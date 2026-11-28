// nature.js (Studio v9.1): REAL-looking trees — branching trunk + thousands of individual leaves you can see one by one.
//   import { leafyTrees } from '../../web/nature.js';
//   leafyTrees([[x, z, scale, kind, seed, y], ...])   kind: 'oak' | 'maple' | 'blossom' | 'palm' | 'cypress' | 'autumn'
// One InstancedMesh per (kind, variant) for bark and one for leaves → hundreds of trees stay cheap.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { scene, V, rng } from './realkit.js';

const TEX = {};
function leafTex(kind) {   // one clear leaf per texture (blade, midrib, veins, stem) — readable even in close-ups
  if (TEX[kind]) return TEX[kind]; const c = document.createElement('canvas'); c.width = 128; c.height = 256; const g = c.getContext('2d');
  g.translate(64, 250);
  const blade = (w, L) => { g.beginPath(); g.moveTo(0, -18); g.bezierCurveTo(w, -18 - L * 0.25, w * 0.9, -18 - L * 0.75, 0, -18 - L); g.bezierCurveTo(-w * 0.9, -18 - L * 0.75, -w, -18 - L * 0.25, 0, -18); g.closePath(); };
  if (kind === 'palm') { g.strokeStyle = '#ffffff'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -240); g.stroke(); for (let i = 0; i < 22; i++) { const y = -20 - i * 10, l = 54 * Math.sin((i + 2) / 25 * Math.PI); for (const s of [-1, 1]) { g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(0, y); g.quadraticCurveTo(s * l * 0.6, y - 10, s * l, y + 14); g.quadraticCurveTo(s * l * 0.5, y + 2, 0, y + 4); g.fill(); } } }
  else { const w = kind === 'cypress' ? 34 : kind === 'maple' || kind === 'autumn' ? 62 : 52; blade(w, 226);
    const gr = g.createLinearGradient(-w, 0, w, 0); gr.addColorStop(0, '#d8d8d8'); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(1, '#c8c8c8'); g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.28)'; g.lineWidth = 2.5; g.stroke();
    g.strokeStyle = 'rgba(255,255,230,0.9)'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -230); g.stroke();   // midrib + stem
    g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,230,0.6)'; for (let i = 1; i < 8; i++) { const y = -18 - i * 26; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(0, y); g.quadraticCurveTo(s * w * 0.4, y - 14, s * w * 0.7, y - 34); g.stroke(); } } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return (TEX[kind] = t);
}
let BARK = null;
function barkTex() { if (BARK) return BARK; const c = document.createElement('canvas'); c.width = 128; c.height = 256; const g = c.getContext('2d'); const r = rng(5);
  g.fillStyle = '#6a4a32'; g.fillRect(0, 0, 128, 256); for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(${r() > 0.5 ? '40,26,16' : '140,110,80'},${0.3 + r() * 0.4})`; g.lineWidth = 1 + r() * 3; const x = r() * 128; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= 256; y += 32) g.lineTo(x + (r() - 0.5) * 10, y); g.stroke(); }
  BARK = new THREE.CanvasTexture(c); BARK.wrapS = BARK.wrapT = THREE.RepeatWrapping; BARK.colorSpace = THREE.SRGBColorSpace; return BARK; }

const KIND = {
  oak: { cols: ['#3f8a2e', '#4f9a34', '#5aa83a', '#356f26', '#6ab842'], trunk: 2.2, depth: 4, spread: 0.85, leaf: 0.26, perTip: 170, crown: 0.62, kids: 3 },
  maple: { cols: ['#4a9a30', '#5fb03a', '#78c048', '#3a8228'], trunk: 2.4, depth: 4, spread: 0.7, leaf: 0.28, perTip: 160, crown: 0.58, kids: 3 },
  autumn: { cols: ['#e8782a', '#f2a03a', '#d8481e', '#f2c63a', '#c8381a'], trunk: 2.3, depth: 4, spread: 0.8, leaf: 0.28, perTip: 160, crown: 0.6, kids: 3 },
  blossom: { cols: ['#f6a8c8', '#f8c0d8', '#ee88b0', '#fbd8e6', '#e070a0'], trunk: 2.0, depth: 4, spread: 0.95, leaf: 0.18, perTip: 220, crown: 0.6, kids: 3 },
  cypress: { cols: ['#2a6a2a', '#357a30', '#226024'], trunk: 1.8, depth: 3, spread: 0.22, leaf: 0.2, perTip: 260, crown: 0.9, kids: 4 },
  palm: { cols: ['#4a9a2e', '#5aaa38', '#3e8a28'], trunk: 6.0, depth: 0, spread: 0, leaf: 2.6, perTip: 0, crown: 1, kids: 0 },
};
function seg(a, b, r0, r1, parts, tw = 0) {   // tapered cylinder from a to b
  const d = b.clone().sub(a), L = d.length(); const g = new THREE.CylinderGeometry(r1, r0, L, 8, 1, false); g.translate(0, L / 2, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize()); g.applyQuaternion(q); g.translate(a.x, a.y, a.z);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * L * 1.2 + tw); parts.push(g); }
function template(kind, seed) {
  const K = KIND[kind] || KIND.oak, r = rng(seed * 97 + 13), bark = [], leaves = [], col = new THREE.Color();
  const addLeaf = (p, n, size) => { const g = new THREE.PlaneGeometry(size * 0.5, size); g.translate(0, size * 0.42, 0);   // pivot at the stem
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 2.4, r() * 6.28, (r() - 0.5) * 2.4)); const up = n.clone().add(V((r() - 0.5), r() * 0.6, (r() - 0.5))).normalize();
    q.premultiply(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), up)); g.applyQuaternion(q); g.translate(p.x, p.y, p.z);
    col.set(K.cols[Math.floor(r() * K.cols.length)]).multiplyScalar(0.8 + r() * 0.4); const c = new Float32Array(12); for (let i = 0; i < 4; i++) { c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3)); const nn = g.attributes.normal; for (let i = 0; i < 4; i++) nn.setXYZ(i, up.x, up.y, up.z); leaves.push(g); };
  if (kind === 'palm') { let p = V(0, 0, 0), dir = V(0.12, 1, 0).normalize(); for (let i = 0; i < 10; i++) { const q = p.clone().add(dir.clone().multiplyScalar(K.trunk / 10)); seg(p, q, 0.24 - i * 0.012, 0.23 - (i + 1) * 0.012, bark, i); p = q; dir.x -= 0.02; }
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28 + r() * 0.3, droop = 0.2 + r() * 0.7; for (let k = 0; k < 2; k++) { const g = new THREE.PlaneGeometry(1.0, K.leaf); g.translate(0, K.leaf / 2, 0); g.rotateX(-Math.PI / 2 + droop + k * 0.0); g.rotateZ(k ? 0.35 : -0.35); g.rotateY(a); g.translate(p.x, p.y, p.z);
      col.set(K.cols[i % 3]); const c = new Float32Array(12); for (let j = 0; j < 4; j++) { c[j * 3] = col.r; c[j * 3 + 1] = col.g; c[j * 3 + 2] = col.b; } g.setAttribute('color', new THREE.BufferAttribute(c, 3)); leaves.push(g); } } }
  else {
    const grow = (a, dir, L, rad, d) => { const b = a.clone().add(dir.clone().multiplyScalar(L)); seg(a, b, rad, rad * 0.68, bark, d);
      if (d >= K.depth) { const n = K.perTip; for (let i = 0; i < n; i++) { const u = 0.2 + r() * 1.0, off = V((r() - 0.5), (r() - 0.35), (r() - 0.5)).multiplyScalar(L * 1.25); const p = a.clone().lerp(b, u).add(off); addLeaf(p, off.clone().normalize(), K.leaf * (0.8 + r() * 0.45)); } return; }
      const kids = K.kids + (r() > 0.6 ? 1 : 0); for (let i = 0; i < kids; i++) { const ang = (i / kids) * 6.28 + r() * 1.2, tilt = K.spread * (0.6 + r() * 0.6);
        const nd = dir.clone().applyAxisAngle(V(Math.cos(ang), 0, Math.sin(ang)), tilt).add(V(0, 0.25, 0)).normalize(); grow(b, nd, L * (0.62 + r() * 0.18), rad * 0.62, d + 1); }
      if (d === 0) grow(b, dir.clone().add(V(r() - 0.5, 0, r() - 0.5).multiplyScalar(0.3)).normalize(), L * 0.75, rad * 0.7, d + 1); };   // leader
    grow(V(0, 0, 0), V((r() - 0.5) * 0.1, 1, (r() - 0.5) * 0.1).normalize(), K.trunk, kind === 'cypress' ? 0.16 : 0.26, 0);
  }
  return { bark: mergeGeometries(bark.map((g) => g.index ? g.toNonIndexed() : g), false), leaves: mergeGeometries(leaves.map((g) => { const h = g.index ? g.toNonIndexed() : g; return h; }), false) };
}
const LM = {}, LD = {};
let BM = null;
export function leafyTrees(list) {
  if (!BM) BM = new THREE.MeshStandardMaterial({ map: barkTex(), color: 0xffffff, roughness: 0.95 });
  const groups = {}; for (const it of list) { const k = (it[3] || 'oak') + '|' + ((it[4] || 0) % 3); (groups[k] = groups[k] || []).push(it); } const out = [];
  for (const [k, its] of Object.entries(groups)) { const [kind, v] = k.split('|'); const T = template(kind, +v + 1); const tk = kind === 'palm' ? 'palm' : kind;
    if (!LM[tk]) { LM[tk] = new THREE.MeshStandardMaterial({ map: leafTex(tk), alphaTest: 0.45, vertexColors: true, side: THREE.DoubleSide, roughness: 0.6, emissive: 0x0a1a04, emissiveIntensity: 0.6 }); LD[tk] = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: leafTex(tk), alphaTest: 0.45 }); }
    const ims = [new THREE.InstancedMesh(T.bark, BM, its.length), new THREE.InstancedMesh(T.leaves, LM[tk], its.length)]; ims[1].customDepthMaterial = LD[tk];
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    its.forEach((it, i) => { const r = rng((it[4] || 1) * 13 + 7); q.setFromAxisAngle(V(0, 1, 0), r() * 6.28); const s = it[2] || 1; m4.compose(V(it[0], it[5] || 0, it[1]), q, V(s, s * (0.92 + r() * 0.16), s)); for (const im of ims) im.setMatrixAt(i, m4); });
    for (const im of ims) { im.castShadow = true; im.receiveShadow = true; scene.add(im); out.push(im); } }
  return out;
}
