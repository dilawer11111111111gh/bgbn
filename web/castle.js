// castle.js (Studio v9.1): an English medieval castle in warm honey stone (never grey/white): gatehouse with two round
// towers and a big studded oak gate, curtain walls with merlons and a wall walk, corner towers with slate-blue cone roofs
// and flags, a keep, a moat with a wooden bridge. Plus: fire (gate burning), fire-arrow volleys, hanging wet laundry
// sheets that drip, steam clouds and a giant thermometer for the science beat.
//   import { englishCastle, FireVolley, laundry, thermometer } from '../../web/castle.js';
import * as THREE from 'three';
import { scene, V, pbr, mesh, Burst, water, rng } from './realkit.js';
import { Batch, boxUV } from './world3d.js';

const ctex = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };
const M = (o) => new THREE.MeshPhysicalMaterial({ roughness: 0.7, ...o });
function flag(col, col2, x, y, z, s = 1, emblem = true) {
  const t = ctex(256, 160, (g, W, H) => { g.fillStyle = col; g.fillRect(0, 0, W, H); g.fillStyle = col2; g.fillRect(0, H * 0.4, W, H * 0.2); if (emblem) { g.fillStyle = col2; g.beginPath(); g.arc(W * 0.3, H * 0.5, 34, 0, 7); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(W * 0.3, H * 0.5, 20, 0, 7); g.fill(); } });
  const geo = new THREE.PlaneGeometry(2.6 * s, 1.6 * s, 12, 4); geo.translate(1.3 * s, 0, 0); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, Math.sin(x * 2.2) * 0.18 * x / (2.6 * s)); } geo.computeVertexNormals();
  const f = mesh(geo, new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 0.8 }), x, y, z); scene.add(f);
  const pole = mesh(new THREE.CylinderGeometry(0.06, 0.06, 4 * s, 8), M({ color: 0x3a2a1a }), x, y - 1.2 * s, z); scene.add(pole); return f; }

export function englishCastle(o = {}) {
  const B = new Batch(), r = rng(7);
  // ashlar masonry: honey-coloured cut blocks with mortar joints and colour variation (reads as real castle stone up close)
  const ash = (rx, ry) => { const t = ctex(1024, 1024, (g, W) => { const rr = rng(11); g.fillStyle = '#8a6a48'; g.fillRect(0, 0, W, W); const rows = 12; for (let j = 0; j < rows; j++) { const h = W / rows; let x = -(j % 2) * 60; while (x < W) { const w = 90 + rr() * 90; const l = 50 + rr() * 14, hue = 30 + rr() * 10, sat = 50 + rr() * 18;
      g.fillStyle = `hsl(${hue},${sat}%,${l}%)`; g.fillRect(x + 3, j * h + 3, w - 6, h - 6); for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(${rr() > 0.5 ? '255,240,210' : '90,60,30'},${0.08 + rr() * 0.1})`; g.fillRect(x + 3 + rr() * (w - 10), j * h + 3 + rr() * (h - 10), 3 + rr() * 8, 2 + rr() * 5); }
      g.fillStyle = 'rgba(255,245,220,0.35)'; g.fillRect(x + 3, j * h + 3, w - 6, 3); g.fillStyle = 'rgba(60,40,20,0.35)'; g.fillRect(x + 3, j * h + h - 6, w - 6, 3); x += w; } } }); t.repeat.set(rx, ry); return t; };
  const stone = M({ map: ash(1, 1), roughness: 0.92 }); stone.bumpMap = stone.map; stone.bumpScale = 0.6;
  const stoneT = M({ map: ash(6, 4), roughness: 0.92 }); stoneT.bumpMap = stoneT.map; stoneT.bumpScale = 0.6;
  const roofM = M({ color: 0x2a5aa8, roughness: 0.55, map: ctex(128, 128, (g, W) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, W); g.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 0; y < W; y += 16) { g.fillRect(0, y, W, 2); for (let x = (y / 16) % 2 * 8; x < W; x += 16) g.fillRect(x, y, 2, 16); } }) }); roofM.map.repeat.set(6, 3);
  const roofR = roofM.clone(); roofR.color.setHex(0xc83a2a);
  const oak = pbr('wood_planks_dirt', [1, 2], { metal: 0, rough: 0.8, tint: '#b8783a' }), iron = M({ color: 0x2a2a30, metalness: 0.8, roughness: 0.4 }), slit = M({ color: 0x1a1410, roughness: 1 });
  const merlons = new THREE.InstancedMesh(boxUV(1.4, 1.6, 1.0, 1.5), stone, 400); let nm = 0; const mm = new THREE.Matrix4();
  const merlon = (x, y, z, ry = 0) => { mm.compose(V(x, y, z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), ry), V(1, 1, 1)); merlons.setMatrixAt(nm++, mm); };
  const H = 12, T = 4;   // wall height / thickness
  const tower = (x, z, rad, h, roof = roofM, flagCol = ['#1a4a9a', '#f2c63a']) => {
    const c = new THREE.CylinderGeometry(rad, rad * 1.08, h, 40); c.translate(0, h / 2, 0); const tm = mesh(c, stoneT, x, 0, z); scene.add(tm);
    B.add(new THREE.CylinderGeometry(rad + 0.35, rad + 0.35, 0.6, 40), stone, x, h + 0.3, z); for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; merlon(x + Math.cos(a) * (rad + 0.1), h + 1.4, z + Math.sin(a) * (rad + 0.1), -a); }
    const cone = new THREE.ConeGeometry(rad + 0.6, rad * 2.2, 40); const cm = mesh(cone, roof, x, h + 0.6 + rad * 1.1 + 0.8, z); scene.add(cm);
    for (let k = 0; k < 5; k++) { const a = r() * Math.PI * 2, y = 3 + k * (h - 5) / 5; const s2 = mesh(new THREE.BoxGeometry(0.3, 1.4, 0.3), slit, x + Math.cos(a) * rad, y, z + Math.sin(a) * rad, false); scene.add(s2); }
    flag(flagCol[0], flagCol[1], x, h + rad * 2.2 + 3.2, z, 0.9); };
  // gatehouse
  const gx = 5.6, gw = 5.4, gh = 7.5;
  tower(-gx, 0.6, 3.6, H + 5); tower(gx, 0.6, 3.6, H + 5);
  B.add(boxUV(2 * gx, H + 2 - gh, T + 1, 2.5), stone, 0, gh + (H + 2 - gh) / 2, 0);   // over the gate
  for (let k = -2; k <= 2; k++) merlon(k * 2.2, H + 2 + 0.8, T / 2 + 0.4);
  const sh = new THREE.Shape(); sh.moveTo(-gw / 2 - 1.2, 0); sh.lineTo(-gw / 2 - 1.2, gh + 1.2); sh.lineTo(gw / 2 + 1.2, gh + 1.2); sh.lineTo(gw / 2 + 1.2, 0); sh.lineTo(gw / 2, 0); sh.lineTo(gw / 2, gh - gw / 2); sh.absarc(0, gh - gw / 2, gw / 2, 0, Math.PI, false); sh.lineTo(-gw / 2, 0); sh.closePath();
  const arch = new THREE.ExtrudeGeometry(sh, { depth: T + 1, bevelEnabled: false, curveSegments: 24 }); arch.translate(0, 0, -(T + 1) / 2); const archM = mesh(arch, stone, 0, 0, 0); scene.add(archM);
  for (let k = 0; k < 15; k++) { const a = Math.PI * k / 14; const v = mesh(new THREE.BoxGeometry(0.7, 0.5, 0.4), M({ color: 0xd8a868, roughness: 0.9 }), Math.cos(a) * (gw / 2 + 0.35), gh - gw / 2 + Math.sin(a) * (gw / 2 + 0.35), T / 2 + 0.55); v.rotation.z = a - Math.PI / 2; scene.add(v); }   // voussoirs
  // the oak gate (two leaves) — it burns, then gets covered in wet sheets
  const gate = new THREE.Group(); const gsh = new THREE.Shape(); gsh.moveTo(-gw / 2, 0); gsh.lineTo(-gw / 2, gh - gw / 2); gsh.absarc(0, gh - gw / 2, gw / 2, Math.PI, 0, true); gsh.lineTo(gw / 2, 0); gsh.closePath();
  const gg = new THREE.ExtrudeGeometry(gsh, { depth: 0.35, bevelEnabled: false, curveSegments: 24 }); const uv = gg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2, uv.getY(i) / 4);
  const gateMat = oak.clone(); gate.add(new THREE.Mesh(gg, gateMat)); for (const y of [1.2, 3.4, 5.4]) { const b = new THREE.Mesh(new THREE.BoxGeometry(gw - 0.1, 0.25, 0.1), iron); b.position.set(0, y, 0.4); gate.add(b); for (let k = 0; k < 9; k++) { const st = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), iron); st.position.set(-gw / 2 + 0.4 + k * (gw - 0.8) / 8, y, 0.47); gate.add(st); } }
  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.06, gh, 0.1), iron); seam.position.set(0, gh / 2, 0.38); gate.add(seam); for (const sx of [-0.4, 0.4]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 8, 16), iron); ring.position.set(sx, 3.0, 0.5); gate.add(ring); }
  gate.position.set(0, 0, T / 2 - 0.9); gate.traverse((m) => { m.castShadow = m.receiveShadow = true; }); scene.add(gate);
  // curtain walls + corner towers
  const W = o.width ?? 40; for (const sd of [-1, 1]) { const x0 = sd * (gx + 3), x1 = sd * W, L = Math.abs(x1 - x0), cx = (x0 + x1) / 2;
    B.add(boxUV(L, H, T, 2.5), stone, cx, H / 2, 0); B.add(boxUV(L, 0.5, T + 0.6, 2.5), stone, cx, H + 0.25, 0);
    for (let k = 0; k < L / 2.2; k++) merlon(x0 + sd * (1 + k * 2.2), H + 1.3, T / 2 + 0.1);
    for (let k = 0; k < L / 6; k++) { const s2 = mesh(new THREE.BoxGeometry(0.3, 1.5, 0.2), slit, x0 + sd * (3 + k * 6), 6, T / 2 + 0.05, false); scene.add(s2); }
    tower(x1, 0, 4.6, H + 7, sd > 0 ? roofR : roofM, sd > 0 ? ['#c8281a', '#f2c63a'] : ['#1a4a9a', '#f2c63a']);
    B.add(boxUV(T, H, 40, 2.5), stone, x1, H / 2, -20); tower(x1, -40, 4.2, H + 5); }
  B.add(boxUV(2 * W, H, T, 2.5), stone, 0, H / 2, -40);
  // keep (behind) with turrets + banners
  B.add(boxUV(16, 26, 14, 2.5), stone, 0, 13, -24); for (const [x, z] of [[-8, -17], [8, -17], [-8, -31], [8, -31]]) tower(x, z, 2.2, 30, roofR, ['#c8281a', '#f2c63a']);
  for (let k = -2; k <= 2; k++) { const bn = mesh(new THREE.PlaneGeometry(1.6, 6), new THREE.MeshStandardMaterial({ map: ctex(64, 256, (g, W2, H2) => { g.fillStyle = k % 2 ? '#c8281a' : '#1a4a9a'; g.fillRect(0, 0, W2, H2); g.fillStyle = '#f2c63a'; g.beginPath(); g.moveTo(W2 / 2, 60); g.lineTo(W2 - 10, 110); g.lineTo(W2 / 2, 160); g.lineTo(10, 110); g.fill(); }), side: THREE.DoubleSide }), k * 3, 18, -16.9); scene.add(bn); }
  // moat + bridge
  const moat = water ? water(2 * W + 30, 7, { color: 0x2a8aa8 }) : null; if (moat) { moat.position.set(0, 0.25, 13.5); scene.add(moat); }
  B.add(boxUV(6.4, 0.5, 10, 1.2), oak, 0, 0.5, 13.0); for (const sx of [-3, 3]) for (let k = 0; k < 5; k++) B.add(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8), oak, sx, 1.2, 9 + k * 2);
  merlons.count = nm; merlons.castShadow = merlons.receiveShadow = true; merlons.instanceMatrix.needsUpdate = true; scene.add(merlons); B.flush();
  return { gate, gateMat, H, T, gateFront: V(0, 0, T / 2 - 0.4), wallTop: (x) => V(x, H + 0.3, 0.2) };
}

// fire on a surface: flames (additive sparks rising) + dark smoke; .update(t, t0, t1, origin, scale)
export class Fire { constructor(n = 70, seed = 3) { this.f = new Burst({ n, dur: 0.5, life: 0.7, speed: [1.2, 3.2], dir: [0, 1, 0.1], spread: 0.45, g: 1.2, size: [0.6, 1.4], grow: -0.5, tex: 'spark', add: true, seed });
  this.s = new Burst({ n: Math.round(n / 2), dur: 0.8, life: 2.2, speed: [1, 2.5], dir: [0, 1, 0.2], spread: 0.35, g: 0.4, size: [1.2, 2.6], grow: 1.6, tex: 'smoke', opacity: 0.45, seed: seed + 9 }); this.s.ps.forEach((p) => p.m.material.color.setHex(0x3a3430)); }
  update(t, t0, t1, O, w = 4) { const on = t >= t0 && t < t1; const o2 = (tt) => { const k = Math.floor(tt * 37) % 11 / 10; return V(O.x + (k - 0.5) * w, O.y + ((tt * 7.3) % 1) * 3, O.z); }; this.f.update(t, t0, o2, 0.7, on); this.s.update(t, t0, o2, 2.2, on); } }

// fire-arrow volley: arrows + an additive flame sprite on every tip
export class FireVolley { constructor(n = 300, seed = 5) { this.n = n; const g1 = new THREE.CylinderGeometry(0.02, 0.02, 1.0, 5); g1.rotateZ(Math.PI / 2); this.mesh = new THREE.InstancedMesh(g1, M({ color: 0x3a2814 }), n); this.mesh.frustumCulled = false; scene.add(this.mesh);
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3)); this.pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.9, map: (Burst.prototype, ctex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 1, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,220,1)'); gr.addColorStop(0.35, 'rgba(255,170,40,0.9)'); gr.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); })), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  this.pts.frustumCulled = false; scene.add(this.pts); const r = rng(seed); this.p = Array.from({ length: n }, () => [r(), r(), r(), r(), r()]); this.m = new THREE.Matrix4(); this.q = new THREE.Quaternion(); }
  // from/to {x,y,z,rx,rz}; t0 launch, T flight, Hh apex
  update(t, from, to, t0, T = 1.6, Hh = 14, visible = true) { const pos = this.pts.geometry.attributes.position; let k = 0;
    this.p.forEach(([a, b, c, d, e], i) => { const tt = (t - t0 - e * 0.5) / T; const show = visible && tt > 0 && tt < 1.15; const u = Math.min(1, Math.max(0, tt));
      const sx = from.x + (a - 0.5) * 2 * from.rx, sz = from.z + (b - 0.5) * 2 * from.rz, ex = to.x + (c - 0.5) * 2 * to.rx, ez = to.z + (d - 0.5) * 2 * to.rz;
      const x = sx + (ex - sx) * u, z = sz + (ez - sz) * u, y = from.y + (to.y - from.y) * u + Hh * 4 * u * (1 - u); const du = 0.01, x2 = sx + (ex - sx) * (u + du), z2 = sz + (ez - sz) * (u + du), y2 = from.y + (to.y - from.y) * (u + du) + Hh * 4 * (u + du) * (1 - u - du);
      const dir = V(x2 - x, y2 - y, z2 - z).normalize(); this.q.setFromUnitVectors(V(1, 0, 0), dir); this.m.compose(V(x, y, z), this.q, show ? V(1, 1, 1) : V(0, 0, 0)); this.mesh.setMatrixAt(i, this.m);
      pos.setXYZ(i, show && u < 1 ? x + dir.x * 0.5 : 0, show && u < 1 ? y + dir.y * 0.5 : -999, show && u < 1 ? z + dir.z * 0.5 : 0); });
    this.mesh.instanceMatrix.needsUpdate = true; pos.needsUpdate = true; } }

// wet laundry sheets hung over the gate: they unroll from the top, sway and drip; .update(t, tHang)
export function laundry(o = {}) { const cols = [['#8ac8f0', '#5a9ad8'], ['#f2a8c8', '#e878a8'], ['#f6e2a0', '#e8b858'], ['#a8e0b8', '#6ab888'], ['#c8b8f0', '#9a88d8']]; const sheets = [];
  const w = o.w ?? 1.25, h = o.h ?? 6.2, n = o.n ?? 5, x0 = o.x ?? 0, y0 = o.y ?? 7.4, z0 = o.z ?? 1.7;
  for (let i = 0; i < n; i++) { const [a, b] = cols[i % cols.length]; const t = ctex(128, 512, (g, W, H) => { g.fillStyle = a; g.fillRect(0, 0, W, H); g.fillStyle = b; for (let y = 0; y < H; y += 64) g.fillRect(0, y, W, 14); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(W * 0.2, 0, 10, H); g.fillStyle = 'rgba(0,0,40,0.18)'; g.fillRect(0, H - 40, W, 40); });
    const geo = new THREE.PlaneGeometry(w, h, 6, 24); geo.translate(0, -h / 2, 0); const m = mesh(geo, new THREE.MeshPhysicalMaterial({ map: t, side: THREE.DoubleSide, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2 }), x0 + (i - (n - 1) / 2) * w * 0.98, y0, z0); m.userData.base = geo.attributes.position.array.slice(); scene.add(m); sheets.push(m); }
  const drips = new Burst({ n: 60, dur: 0.6, life: 0.6, speed: [0.2, 0.6], dir: [0, -1, 0], spread: 0.2, g: -9, size: [0.06, 0.12], tex: 'splash', seed: 31 });
  return { sheets, update(t, tHang) { sheets.forEach((m, i) => { const u = Math.min(1, Math.max(0, (t - tHang - i * 0.12) / 0.35)); m.visible = u > 0; m.scale.y = Math.max(0.001, u);
      const p = m.geometry.attributes.position, B0 = m.userData.base; for (let k = 0; k < p.count; k++) { const y = B0[k * 3 + 1]; p.setZ(k, B0[k * 3 + 2] + Math.sin(t * 3 + y * 1.3 + i) * 0.05 * (-y / h)); } p.needsUpdate = true; m.geometry.computeVertexNormals(); });
    drips.update(t, tHang, (tt) => V(x0 + ((tt * 13.7) % 1 - 0.5) * n * w, y0 - h + 0.1, z0 + 0.1), 0.6, t > tHang + 0.3); } };
}

// giant thermometer for the science beat; .update(level 0..1) — the liquid stops at the 100 °C mark
export function thermometer(x, y, z, s = 1) { const G = new THREE.Group(); const glass = new THREE.MeshPhysicalMaterial({ color: 0xe8f4ff, transmission: 0.6, roughness: 0.05, transparent: true, opacity: 0.45, thickness: 0.2 });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 5, 24), glass); tube.position.y = 3.2; G.add(tube); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 16), new THREE.MeshStandardMaterial({ color: 0xe82a2a, emissive: 0x5a0a0a })); bulb.position.y = 0.6; G.add(bulb);
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 1, 16), new THREE.MeshStandardMaterial({ color: 0xe82a2a, emissive: 0x5a0a0a })); liq.position.y = 1; G.add(liq);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 6.4), new THREE.MeshStandardMaterial({ map: ctex(256, 640, (g, W, H) => { g.fillStyle = '#f6e6c0'; g.fillRect(0, 0, W, H); g.strokeStyle = '#5a3a1a'; g.lineWidth = 10; g.strokeRect(5, 5, W - 10, H - 10); g.fillStyle = '#3a2a1a'; g.font = 'bold 34px "DejaVu Sans"'; for (let k = 0; k <= 5; k++) { const yy = H - 120 - k * 90; g.fillRect(W / 2 + 34, yy, 30, 5); g.fillText(`${k * 40}°`, W / 2 + 70, yy + 12); }
    const y100 = H - 120 - 2.5 * 90; g.fillStyle = '#d8281a'; g.fillRect(20, y100 - 3, W - 40, 7); g.font = 'bold 44px "DejaVu Sans"'; g.fillText('100°C', 18, y100 - 14); }) }));
  board.position.set(0, 3.2, -0.35); G.add(board); G.position.set(x, y, z); G.scale.setScalar(s); scene.add(G);
  return { G, update(level) { const h = 0.2 + 4.6 * level; liq.scale.y = h; liq.position.y = 0.9 + h / 2; } }; }
