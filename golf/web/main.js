// GOLF — "Dented": our own story, our own characters, the user's own narration.
// Milo (ball maker, teal vest, mustard cap, round glasses) vs Gus (rival: raspberry jacket, white flat hat, mustache) + Biscuit the dog.
// Built with everything the coaster benchmark taught: hold-and-snap acting with overshoot, squash/stretch + hat follow-through on every pose
// change (studio.keys), smooth expression in-betweens, lip sync, word-timed beats, a living push-in camera on every shot, soft dissolves.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { R, scene, cam, sun, hemi, V, pbr, std, mesh, sky, ready, Burst, PT, makeComposer, rng, water } from '../../web/realkit.js';
import { Cine } from '../../web/cine.js';
import { Flat2D } from '../../web/flat2d.js';
import { role, act } from '../../web/roles.js';
import { loadMo, mo } from '../../web/mocap.js';
import { sstep, clamp, lerp } from '../../web/motion.js';
import { installActing, keys, faceK, makeLip, makeSky, dynamicCam, makeRenderer, makeAccents, withAccent } from '../../web/studio.js';
import { WORDS } from './words.js';
import { Dog2D } from '../../web/dog2d.js';
import { golfCartHQ, Batch, house, forest, grass, flowers, scatter, fence, hedge, bench, lampPost, pot, terrain, terrainH, texMat, plain, boxUV, GLASS } from '../../web/world3d.js';
import { ENERGY } from './energy.js';
import { MILO_O, GUS_O } from './cast.js';
export const DURATION = 48.25;
const lip = makeLip(ENERGY);
const NIGHT = (t) => t >= 10.1 && t < 21.05;
const SCI = (t) => t >= 32.24 && t < 45.22;

// =================== GOLF BALLS (real geometry: mirror-smooth / dimpled / dog-chewed) ===================
const fib = (n) => { const P = [], ga = Math.PI * (3 - Math.sqrt(5)); for (let i = 0; i < n; i++) { const y = 1 - ((i + 0.5) / n) * 2, r = Math.sqrt(1 - y * y), a = i * ga; P.push(V(Math.cos(a) * r, y, Math.sin(a) * r)); } return P; };
const GEO = {};
function ballGeo(kind) {
  if (GEO[kind]) return GEO[kind];
  let g = new THREE.SphereGeometry(1, kind === 'smooth' ? 64 : 160, kind === 'smooth' ? 32 : 80); g.deleteAttribute('uv'); g.deleteAttribute('normal'); g = mergeVertices(g);
  if (kind !== 'smooth') { const pos = g.attributes.position, v = V(), D = fib(kind === 'chewed' ? 120 : 300), rd = kind === 'chewed' ? 0.19 : 0.13, rr = rng(kind === 'chewed' ? 5 : 3);
    const bites = Array.from({ length: 8 }, () => [V(rr() - 0.5, rr() - 0.5, rr() - 0.5).normalize(), 0.3 + rr() * 0.3, 0.06 + rr() * 0.08]);
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); let best = -2; for (const c of D) { const d = c.dot(v); if (d > best) best = d; } const ang = Math.acos(Math.min(1, best)); let r = 1;
      if (ang < rd) r -= (kind === 'chewed' ? 0.035 : 0.05) * (1 - (ang / rd) ** 2);
      if (kind === 'chewed') { r += 0.07 * Math.sin(v.x * 3.1 + 1) * Math.sin(v.y * 2.7 + 2) * Math.sin(v.z * 3.3 + 0.5); for (const [c, w, dp] of bites) { const a2 = Math.acos(Math.min(1, c.dot(v))); if (a2 < w) r -= dp * (1 - (a2 / w) ** 2); } }
      v.multiplyScalar(r); pos.setXYZ(i, v.x, v.y, v.z); } }
  g.computeVertexNormals(); GEO[kind] = g; return g;
}
const MIRROR = new THREE.MeshPhysicalMaterial({ color: 0xf6f6fa, metalness: 1, roughness: 0.04, envMapIntensity: 1.4 });
const WHITEB = new THREE.MeshPhysicalMaterial({ color: 0xfbfbf6, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.15 });
const CHEWM = new THREE.MeshPhysicalMaterial({ color: 0xe8dfc6, roughness: 0.5, clearcoat: 0.4, clearcoatRoughness: 0.3 });
const MATS = { smooth: MIRROR, dimple: WHITEB, chewed: CHEWM };
function ball(kind, r, parent = scene) { const m = mesh(ballGeo(kind), MATS[kind]); m.scale.setScalar(r); parent.add(m); return m; }

// =================== WORLD (v2: full 3D set dressing — textured houses, trees, grass, flowers, rolling hills) ===================
const r1 = rng(7);
const TEE = V(0, 0, 0), TOWN = V(0, 0, 150), SHOP = V(18, 0, 112), PRO = V(-26, 0, 30), PRACT = V(24, 0, 26);
const SL = (x, y, z) => SHOP.clone().add(V(x, y, z));
const canvasTex = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
function banner(text, w, h, bg = '#f4ead8', fg = '#c8342a', font = 'bold 150px "DejaVu Sans", sans-serif', sub = null) {
  const t = canvasTex(2048, Math.round(2048 * h / w), (q, W, H) => { q.fillStyle = bg; q.fillRect(0, 0, W, H); q.fillStyle = fg; q.font = font; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(text, W / 2, sub ? H * 0.38 : H / 2 + 6); if (sub) { q.font = font.replace(/\d+px/, (m) => Math.round(parseInt(m) * 0.62) + 'px'); q.fillText(sub, W / 2, H * 0.74); } q.strokeStyle = fg; q.lineWidth = 18; q.strokeRect(14, 14, W - 28, H - 28); });
  return mesh(new THREE.BoxGeometry(w, h, 0.06), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }));
}
function blob(cx, cz, rx, rz, mat, y = 0.03, seed = 1) { const r = rng(seed), sh = new THREE.Shape(); const n = 32; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, k = 1 + 0.18 * Math.sin(a * 3 + r() * 6) + 0.08 * Math.sin(a * 5); const x = Math.cos(a) * rx * k, z = Math.sin(a) * rz * k; i ? sh.lineTo(x, z) : sh.moveTo(x, z); }
  const g = new THREE.ShapeGeometry(sh, 4); const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 4, p.getY(i) / 4);
  const m = mesh(g, mat, cx, y, cz, false); m.rotation.x = -Math.PI / 2; m.scale.y = -1; m.receiveShadow = true; scene.add(m); return m; }
const painting = (fn) => new THREE.MeshStandardMaterial({ map: canvasTex(256, 200, fn), roughness: 0.6 });
// play areas stay flat; hills roll everywhere else
const FLATZ = [[-80, 80, -440, 50], [-120, 120, 0, 250]];
const flatK = (x, z) => { let d = 1e9; for (const [x0, x1, z0, z1] of FLATZ) { const dx = Math.max(x0 - x, 0, x - x1), dz = Math.max(z0 - z, 0, z - z1); d = Math.min(d, Math.hypot(dx, dz)); } return Math.min(1, d / 70) ** 1.5; };
const groundY = (x, z) => terrainH(x, z, flatK(x, z));
let FLAG, SHOPG, SHOPFRONT, SHOPROOF, BASKET, BASKET_SMOOTH = [], BASKET_CHEW = [], FLOORCHEW = [], LAMP, STREETLAMP, PROLAMP, PROBOXES = [], REGDRAWER, BUFF, WINGLOW = [], SHELFBALLS, SHELFCHEW, GSTAND, CART, CASH;
function build() {
  const B = new Batch();
  // ---- ground: rolling grass hills with colour variation ----
  terrain(1600, 240, flatK, pbr('aerial_grass_rock', [160, 160], { tint: '#6cd23c', rough: 1 }));
  // ---- fairway with mowing stripes, rough edge, tee box, green, bunkers, pond, cart path ----
  const stripe = canvasTex(64, 256, (q) => { q.fillStyle = '#72d84a'; q.fillRect(0, 0, 64, 128); q.fillStyle = '#5cc23a'; q.fillRect(0, 128, 64, 128); for (let i = 0; i < 900; i++) { q.fillStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '0,40,0'},0.06)`; q.fillRect(Math.random() * 64, Math.random() * 256, 1, 2); } }); stripe.wrapS = stripe.wrapT = THREE.RepeatWrapping;
  { const sh = new THREE.Shape(); const W = 22, L = 360; sh.moveTo(-W, 6); sh.lineTo(W, 6); sh.lineTo(W + 6, -L / 2); sh.lineTo(W, -L); sh.quadraticCurveTo(0, -L - 14, -W, -L); sh.lineTo(-W - 6, -L / 2); sh.closePath();
    const fg = new THREE.ShapeGeometry(sh, 12); const st = stripe.clone(); st.needsUpdate = true; st.repeat.set(1 / 40, 1 / 24); const fw = mesh(fg, new THREE.MeshStandardMaterial({ map: st, roughness: 0.95 }), 0, 0.03, 0, false); fw.rotation.x = -Math.PI / 2; fw.scale.set(1, -1, 1); scene.add(fw); }
  { const st2 = stripe.clone(); st2.needsUpdate = true; st2.repeat.set(1, 1); const tb = mesh(boxUV(8, 0.16, 6, 2), new THREE.MeshStandardMaterial({ map: st2, roughness: 0.95, color: 0xe8ffe0 }), 0, 0.07, -0.5); tb.receiveShadow = true; scene.add(tb); }
  for (const s of [-1, 1]) B.add(new THREE.SphereGeometry(0.13, 16, 10), plain('#2a5ad8', { r: 0.3 }), 1.6 * s, 0.22, -2.2);
  blob(6, -335, 16, 13, new THREE.MeshStandardMaterial({ color: 0x86ea5e, roughness: 0.9 }), 0.05, 3); blob(6, -335, 18, 15, new THREE.MeshStandardMaterial({ color: 0x6cd448, roughness: 0.9 }), 0.045, 3);
  scene.add(mesh(new THREE.CircleGeometry(0.3, 20), std(0x101010), 8, 0.065, -338, false).rotateX(-Math.PI / 2));
  FLAG = new THREE.Group(); FLAG.position.set(8, 0, -338); scene.add(FLAG); FLAG.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.2, 8), std(0xf4f4f4, { m: 0.3 }), 0, 2.1, 0));
  { const fl = mesh(new THREE.PlaneGeometry(1.4, 0.9, 10, 1), std(0xe8302a, { side: THREE.DoubleSide, r: 0.6 }), 0.7, 3.7, 0); FLAG.add(fl); const p0 = fl.geometry.attributes.position.array.slice(); FLAG.userData.tick = (t) => { const a = fl.geometry.attributes.position; for (let i = 0; i < a.count; i++) { const x = p0[i * 3] + 0.7; a.setZ(i, Math.sin(x * 3 - t * 6) * 0.12 * x); } a.needsUpdate = true; }; }
  const sand = texMat('plaster', '#f6dc9a', { r: 1, ns: 0.6 }); for (const [x, z, a, b, s] of [[-17, -118, 7, 4, 2], [18, -196, 8, 5, 4], [-14, -300, 6, 4, 6], [22, -322, 6, 4, 8], [-4, -352, 7, 3, 9], [12, -60, 5, 3, 12]]) { blob(x, z, a + 0.8, b + 0.8, new THREE.MeshStandardMaterial({ color: 0x5cbe3a, roughness: 1 }), 0.04, s); blob(x, z, a, b, sand, 0.05, s); }
  const pond = water(46, 28, { color: 0x28b0d0 }); pond.position.set(-48, 0.06, -150); scene.add(pond); blob(-48, -150, 26, 17, texMat('cobble', '#c8b8a0', { r: 0.9 }), 0.04, 21);
  // cart path (light concrete ribbon) from the tee down the right side
  { const pts = [V(6, 0.05, 4), V(14, 0.05, -20), V(30, 0.05, -80), V(32, 0.05, -170), V(28, 0.05, -260), V(20, 0.05, -330)]; const c = new THREE.CatmullRomCurve3(pts), n = 160, pos = [], uv = [], idx = [];
    for (let i = 0; i <= n; i++) { const p = c.getPointAt(i / n), tg = c.getTangentAt(i / n), sd = V(-tg.z, 0, tg.x).multiplyScalar(1.3); pos.push(p.x + sd.x, 0.05, p.z + sd.z, p.x - sd.x, 0.05, p.z - sd.z); uv.push(0, i * 0.6, 1, i * 0.6); if (i < n) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); const m = new THREE.Mesh(g, texMat('plaster', '#d8d4cc', { r: 0.9 })); m.material.side = THREE.DoubleSide; m.receiveShadow = true; scene.add(m); }
  // distance markers + old record flag
  const markCol = { 100: ['#f6d84a', '#2a1810'], 200: ['#ffffff', '#2a1810'], 300: ['#3a7ae8', '#ffffff'] };
  for (const z of [100, 200, 300]) { const g = new THREE.Group(); g.position.set(-14, 0, -z); g.rotation.y = Math.PI / 2 - 0.35; scene.add(g); g.add(mesh(new THREE.CylinderGeometry(0.14, 0.16, 6.4, 10), std(0xf4f4f4), 0, 3.2, 0));
    const t = canvasTex(512, 512, (q) => { q.fillStyle = '#2a1810'; q.beginPath(); q.arc(256, 256, 250, 0, 7); q.fill(); q.fillStyle = markCol[z][0]; q.beginPath(); q.arc(256, 256, 232, 0, 7); q.fill(); q.fillStyle = markCol[z][1]; q.font = 'bold 230px "DejaVu Sans"'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(String(z), 256, 268); });
    g.add(mesh(new THREE.CircleGeometry(3.2, 40), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, side: THREE.DoubleSide }), 0, 6.4, 0.15)); }
  { const g = new THREE.Group(); g.position.set(-13, 0, -160); g.rotation.y = Math.PI / 2 - 0.45; scene.add(g); g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 9.6, 8), std(0xd8d8d8, { m: 0.6 }), 0, 4.8, 0)); const b = banner('RECORD', 7, 2.2, '#e8302a', '#ffffff', 'bold 300px "DejaVu Sans", sans-serif'); b.position.set(3.55, 8.3, 0); g.add(b); }
  // ---- tee surroundings: flower beds, hedges, bench, ball washer, tee sign ----
  hedge(B, -4.6, 6.6, 9, 0.9, 0.9); bench(B, 3.4, 5.6, Math.PI); bench(B, 26, 23, Math.PI);
  B.add(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 8), plain('#2a5a3a', { m: 0.5 }), 3.4, 0.5, -6.4); B.add(new THREE.BoxGeometry(0.3, 0.32, 0.22), plain('#2a8a5a', { r: 0.5 }), 3.4, 1.1, -6.4);
  { const sg = banner('HOLE 1  ·  PAR 4  ·  340', 2.6, 0.7, '#2a6a3a', '#ffffff', 'bold 120px "DejaVu Sans", sans-serif'); sg.position.set(1.6, 1.2, 4.6); sg.rotation.y = 0.4; scene.add(sg); B.add(new THREE.BoxGeometry(0.1, 1.0, 0.1), plain('#6a4428'), 1.6, 0.5, 4.6); }
  flowers(scatter(260, (r) => { const a = r() * 6.28, d = r(); const x = 5.6 + Math.cos(a) * 1.6 * d, z = -5.2 + Math.sin(a) * 1.0 * d; return [x, z, 0.02]; }, 3)); B.add(new THREE.CylinderGeometry(1.75, 1.8, 0.12, 24), plain('#6a4428', { r: 1 }), 5.6, 0.06, -5.2, 0, 0, 0, 1, 1, 0.62);
  flowers(scatter(300, (r) => { const x = -8 + r() * 6, z = -7 + r() * 2.4; return [x, z, 0.02]; }, 5));
  // ---- trees: fairway rows, around town, on the hills ----
  const T = []; let sd = 1; for (let i = 0; i < 90; i++) { const side = i % 2 ? 1 : -1; const x = side * (32 + r1() * 30), z = 30 - r1() * 420; T.push([x, z, 1.1 + r1() * 1.0, Math.floor(r1() * 4), sd++]); }
  for (let i = 0; i < 260; i++) { const a = r1() * Math.PI * 2, d = 170 + r1() * 420; const x = Math.cos(a) * d, z = Math.sin(a) * d - 120; T.push([x, z, 1.4 + r1() * 1.6, Math.floor(r1() * 3), sd++, groundY(x, z) - 0.2]); }
  for (let i = 0; i < 70; i++) { const x = -100 + r1() * 200, z = 175 + r1() * 70; if (Math.abs(x + 8) < 6) continue; T.push([x, z, 1.0 + r1() * 0.6, Math.floor(r1() * 4), sd++]); }
  for (let i = 0; i < 26; i++) { const x = -70 + i * 6.2; if (x < 11 || x > 25) T.push([x, 110.5, 0.75, 3, sd++]); }
  forest(T, ['round', 'pine', 'blossom', 'bush']);
  // ---- clubhouse (faces the tee: +x) ----
  { const P = house(B, -26, 14, Math.PI / 2, { w: 16, d: 9, h: 4.6, wall: '#fff6e8', roof: '#2a8a4a', kind: 'plaster', shutter: '#2a6a3a', door: '#2a6a3a', seed: 31 });
    for (let i = 0; i < 6; i++) B.add(new THREE.CylinderGeometry(0.2, 0.24, 4.2, 12), plain('#ffffff', { r: 0.4 }), -6.5 + i * 2.6, 2.1, 6.4, 0, 0, 0, 1, 1, 1, P); B.add(texMat('tiles', '#2a8a4a') && boxUV(17, 0.22, 3.2, 1.6), texMat('tiles', '#2a8a4a'), 0, 4.35, 5.6, 0, 0.12, 0, 1, 1, 1, P);
    B.add(boxUV(17, 0.3, 3.4, 1.2), texMat('planks', '#c89a6a'), 0, 0.15, 5.7, 0, 0, 0, 1, 1, 1, P);
    const b = banner('PUTTSBY GOLF CLUB', 10, 1.1, '#2a7a4a', '#ffffff', 'bold 150px "DejaVu Sans", sans-serif'); b.position.set(-26 + 7.35, 5.1, 14); b.rotation.y = Math.PI / 2; scene.add(b);
    B.add(new THREE.CylinderGeometry(0.06, 0.06, 9, 8), plain('#e8e8ee', { m: 0.8, r: 0.2 }), -16, 4.5, 24); const fl = mesh(new THREE.PlaneGeometry(1.8, 1.1), std(0x2a8a4a, { side: THREE.DoubleSide }), -15.1, 8.4, 24); scene.add(fl);
    for (const z of [6, 22]) { pot(B, -17.6, z, 1.4); } flowers(scatter(200, (r) => [-17.0 - r() * 0.8, 7 + r() * 14, 0.02], 7)); }
  // ---- grandstand with striped canopy ----
  GSTAND = new THREE.Group(); GSTAND.position.set(-9, 0, -1); scene.add(GSTAND);
  { const GB = new Batch(); for (let i = 0; i < 4; i++) { GB.add(boxUV(1.3, 0.5 + i * 0.5, 14, 1.4), texMat('planks', i % 2 ? '#2a8a5a' : '#f4f2ee', { r: 0.6 }), -i * 1.3, (0.5 + i * 0.5) / 2, 0); }
    for (let i = 0; i < 5; i++) for (const z of [-6.8, 6.8]) GB.add(new THREE.CylinderGeometry(0.08, 0.08, 5.4, 8), plain('#f4f4f4', { m: 0.5 }), -0.3 - i * 1.1, 2.7, z);
    const can = boxUV(6, 0.1, 14.6, 1); GB.add(can, texMat('fabric', '#e8302a', { side: THREE.DoubleSide }), -2.4, 5.3, 0, 0, 0, 0.18); for (let i = 0; i < 14; i++) GB.add(new THREE.ConeGeometry(0.28, 0.5, 3), plain(['#e8302a', '#ffffff'][i % 2], { side: THREE.DoubleSide }), 0.55, 4.6, -6.6 + i * 1.02, 0, 0, Math.PI);
    GB.flush(GSTAND); const b = banner('PUTTSBY OPEN', 9, 1.5, '#f6d84a', '#c8342a', 'bold 260px "DejaVu Sans", sans-serif'); b.position.set(-5.6, 6.3, 0); b.rotation.y = Math.PI / 2; GSTAND.add(b); }
  for (let i = 0; i < 8; i++) B.add(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 6), plain('#f4f4f4'), -4.6, 0.5, -7 + i * 2); B.add(new THREE.BoxGeometry(0.03, 0.03, 14), plain('#e8302a'), -4.6, 0.95, 0);
  // ---- practice green ----
  blob(PRACT.x, PRACT.z, 8.3, 6.8, new THREE.MeshStandardMaterial({ color: 0x4fb83a, roughness: 0.9 }), 0.045, 11); { const st3 = stripe.clone(); st3.needsUpdate = true; st3.repeat.set(0.18, 0.18); blob(PRACT.x, PRACT.z, 7.5, 6, new THREE.MeshStandardMaterial({ map: st3, color: 0xb4d8a0, roughness: 0.85 }), 0.05, 11); }
  B.add(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 6), plain('#ffffff'), PRACT.x + 3, 1.1, PRACT.z - 2); scene.add(mesh(new THREE.PlaneGeometry(0.7, 0.45), std(0xf2c63a, { side: THREE.DoubleSide }), PRACT.x + 3.35, 1.95, PRACT.z - 2));
  flowers(scatter(220, (r) => { const a = r() * 6.28; return [PRACT.x + Math.cos(a) * (9 + r() * 1.2), PRACT.z + Math.sin(a) * (7.6 + r()), 0.02]; }, 9));
  // ---- town of Puttsby: detailed houses, yards, fences, cobbled streets with sidewalks, lamps, square ----
  const cob = texMat('cobble', '#c8b8a8', { r: 0.9, ns: 1.2 }), walk = texMat('brick', '#d8c8b8', { r: 0.85 });
  for (const z of [119.5, 160]) { const s = mesh(new THREE.PlaneGeometry(170, 8), cob, 0, 0.025, z, false); s.rotation.x = -Math.PI / 2; s.material.map.repeat.set(1, 1); const g = s.geometry.attributes.uv; for (let i = 0; i < g.count; i++) g.setXY(i, g.getX(i) * 170 / 2.4, g.getY(i) * 8 / 2.4); scene.add(s);
    for (const s2 of [-1, 1]) { if (z < 130 && s2 < 0) { B.add(boxUV(97, 0.16, 2.2, 1.2), walk, -85 + 48.5, 0.08, z - 5.1); B.add(boxUV(61, 0.16, 2.2, 1.2), walk, 24 + 30.5, 0.08, z - 5.1); } else B.add(boxUV(170, 0.16, 2.2, 1.2), walk, 0, 0.08, z + s2 * 5.1); } }
  { const s = mesh(new THREE.PlaneGeometry(8, 120), cob, -8, 0.026, 150, false); s.rotation.x = -Math.PI / 2; const g = s.geometry.attributes.uv; for (let i = 0; i < g.count; i++) g.setXY(i, g.getX(i) * 8 / 2.4, g.getY(i) * 120 / 2.4); scene.add(s); }
  const walls = ['#f6e2b8', '#f8c8b8', '#cfe4f6', '#fbf3dc', '#e4d0f2', '#c8ecd4', '#ffd6a0'], roofs = ['#c8442a', '#2a5ab8', '#2a8a4a', '#d88a2a', '#8a3a8a', '#3a3a4a'], shutters = ['#2a6ab8', '#2a8a4a', '#c8342a', '#f2c63a', '#ffffff'], kinds = ['siding', 'brick', 'plaster', 'siding'];
  let hs = 0; const H = (x, z, ry) => { hs++; house(B, x, z, ry, { w: 7.5 + (hs % 3) * 1.2, d: 6.5, h: 3.4 + (hs % 3) * 0.5, wall: walls[hs % 7], roof: roofs[hs % 6], kind: kinds[hs % 4], shutter: shutters[hs % 5], door: shutters[(hs + 2) % 5], seed: hs });
    const fz = z + Math.cos(ry) * 4.6; const fx = x + Math.sin(ry) * 4.6; fence(B, fx - 4.2, fz, fx - 1.0, fz); fence(B, fx + 1.0, fz, fx + 4.2, fz); flowers(scatter(40, (r) => [fx - 3.8 + r() * 7.6, fz - Math.cos(ry) * (0.3 + r() * 0.8), 0.02], hs)); };
  for (let i = 0; i < 12; i++) { const x = -74 + i * 13; if (Math.abs(x - SHOP.x) > 8) H(x, 106, 0); if (Math.abs(x + 3 - SHOP.x) > 12) H(x + 3, 132, Math.PI); }
  for (let i = 0; i < 12; i++) { const x = -70 + i * 13; if (Math.abs(x + 8) > 7) { H(x + 4, 152, 0); H(x, 172, Math.PI); } }
  for (let i = 0; i < 14; i++) { const x = -80 + i * 13; if (x < 12 || x > 24) lampPost(B, x, 114.6); lampPost(B, -76 + i * 13, 165); }
  { const g = new THREE.Group(); g.position.set(-8, 0, 140); scene.add(g); const TB = new Batch(); TB.add(boxUV(3, 12, 3, 1.6), texMat('brick', '#e8c8a8'), 0, 6, 0); TB.add(new THREE.BoxGeometry(3.4, 0.4, 3.4), plain('#ffffff'), 0, 12.1, 0); TB.flush(g); const sh = mesh(new THREE.ConeGeometry(2.6, 3.4, 4), texMat('tiles', '#2a5ab8'), 0, 14, 0); sh.rotation.y = Math.PI / 4; g.add(sh);
    const t = canvasTex(256, 256, (q) => { q.fillStyle = '#fff'; q.beginPath(); q.arc(128, 128, 120, 0, 7); q.fill(); q.strokeStyle = '#2a1810'; q.lineWidth = 12; q.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; q.fillStyle = '#2a1810'; q.fillRect(128 + Math.cos(a) * 96 - 4, 128 + Math.sin(a) * 96 - 4, 8, 8); } q.lineWidth = 10; q.beginPath(); q.moveTo(128, 128); q.lineTo(128, 44); q.moveTo(128, 128); q.lineTo(184, 150); q.stroke(); });
    for (let k = 0; k < 4; k++) { const c = mesh(new THREE.CircleGeometry(1.2, 32), new THREE.MeshStandardMaterial({ map: t }), Math.sin(k * Math.PI / 2) * 1.52, 10, Math.cos(k * Math.PI / 2) * 1.52); c.rotation.y = k * Math.PI / 2; g.add(c); } }
  // fountain in the square
  B.add(new THREE.CylinderGeometry(2.6, 2.8, 0.6, 32), texMat('brick', '#e0d4c4'), 4, 0.3, 140); { const w2 = water(5, 5, { color: 0x3ab8e0 }); w2.position.set(4, 0.55, 140); w2.scale.set(0.95, 0.95, 1); scene.add(w2); } B.add(new THREE.CylinderGeometry(0.3, 0.4, 1.6, 12), plain('#e0d4c4'), 4, 0.8, 140); B.add(new THREE.SphereGeometry(0.5, 20, 12), plain('#e0d4c4'), 4, 1.8, 140);
  // bunting across the main street
  for (const x of [-40, -20, 0, 40]) for (let i = 0; i < 12; i++) { const z = 115 + i * 0.85; B.add(new THREE.ConeGeometry(0.22, 0.4, 3), plain(['#e8302a', '#f2c63a', '#3a8ad8', '#4ab84a'][i % 4], { side: THREE.DoubleSide }), x, 6.2 - Math.sin(i / 11 * Math.PI) * 0.8, z, 0, 0, Math.PI); }
  // giant mirror golf-ball water tower: the town is OBSESSED with smooth balls
  { const g = new THREE.Group(); g.position.set(-34, 0, 142); scene.add(g); for (const [x, z] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) { const l = mesh(new THREE.CylinderGeometry(0.2, 0.25, 13, 8), std(0x8a8a92, { m: 0.8, r: 0.3 }), x, 6.5, z); l.rotation.set(z * 0.04, 0, -x * 0.04); g.add(l); }
    const tb = ball('smooth', 4.4, g); tb.position.y = 16.5; g.add(mesh(new THREE.CylinderGeometry(0.4, 0.6, 1.4, 12), std(0xf4f4f4), 0, 12.4, 0)); }
  // grass tufts + wild flowers along edges, yards and around every set
  const busy = (x, z) => (Math.abs(x) < 9 && z > -9 && z < 9) || Math.hypot(x - PRACT.x, (z - PRACT.z) * 1.15) < 10.5 || (x > -36 && x < -15 && z > 3 && z < 27) || (x > -31 && x < -20 && z > 24 && z < 37) || (x > -18 && x < -3 && Math.abs(z + 1) < 9) || (Math.abs(x) < 28 && z < 7 && z > -380);
  const GP = []; const tuft = (x, z, s = 1) => { if (!busy(x, z)) GP.push([x, z, 0, s]); };
  for (const p of scatter(9000, (r) => { const x = (r() - 0.5) * 150, z = 40 - r() * 440; const fwEdge = Math.abs(x) > 22 + (z < -180 ? 6 : 0) && Math.abs(x) < 75; return fwEdge ? [x, z] : null; }, 2)) tuft(...p, 0.8);
  for (const p of scatter(5000, (r) => { const x = (r() - 0.5) * 70, z = 60 - r() * 70; const onTee = Math.abs(x) < 4.6 && z < 3 && z > -4; const onStand = x < -4 && x > -17 && Math.abs(z + 1) < 8; const onGreen = Math.hypot(x - PRACT.x, (z - PRACT.z) * 1.2) < 9; const onCH = x < -16 && x > -36 && z > 4 && z < 26; return onTee || onStand || onGreen || onCH ? null : [x, z]; }, 4)) tuft(...p, 0.65);
  for (const p of scatter(5000, (r) => { const x = -100 + r() * 200, z = 95 + r() * 90; const street = Math.abs(z - 119.5) < 6.5 || (x > 12 && x < 24 && z > 107 && z < 117) || Math.abs(z - 160) < 6.5 || Math.abs(x + 8) < 5 || Math.hypot(x - 4, z - 140) < 3.4; return street ? null : [x, z]; }, 6)) tuft(...p, 0.7);
  grass(GP); flowers(scatter(1600, (r) => { const x = (r() - 0.5) * 160, z = 40 - r() * 420; return Math.abs(x) > 26 && Math.abs(x) < 80 ? [x, z, 0] : null; }, 8));
  B.flush();
  // ---- MILO'S SHOP (interior set + exterior; front wall + roof only in the exterior shots) ----
  buildShop();
  // ---- PRO SHOP kiosk ----
  buildPro();
  CART = golfCartHQ(); scene.add(CART);
}
function buildShop() {
  SHOPG = new THREE.Group(); SHOPG.position.copy(SHOP); scene.add(SHOPG); const IB = new Batch();
  const floor = mesh(new THREE.PlaneGeometry(9, 6), pbr('wood_planks_dirt', [4, 3], { tint: '#d89858' }), 0, 0.03, 0, false); floor.rotation.x = -Math.PI / 2; SHOPG.add(floor);
  const paper = texMat('wallpaper', '#d0503a', { r: 0.8 }), pan = texMat('panel', '#8a5230', { r: 0.6 }), white = plain('#fff8ee', { r: 0.5 });
  IB.add(boxUV(9, 2.3, 0.2, 1.4), paper, 0, 2.25, -3); IB.add(boxUV(9, 1.1, 0.24, 1.1), pan, 0, 0.55, -2.98); IB.add(new THREE.BoxGeometry(9, 0.12, 0.3), white, 0, 1.12, -2.92); IB.add(new THREE.BoxGeometry(9, 0.2, 0.32), white, 0, 3.32, -2.9); IB.add(new THREE.BoxGeometry(9, 0.1, 0.3), white, 0, 0.05, -2.86);
  for (const s of [-1, 1]) { IB.add(boxUV(0.2, 2.3, 6, 1.4), paper, s * 4.5, 2.25, 0); IB.add(boxUV(0.24, 1.1, 6, 1.1), pan, s * 4.48, 0.55, 0); IB.add(new THREE.BoxGeometry(0.3, 0.12, 6), white, s * 4.42, 1.12, 0); IB.add(new THREE.BoxGeometry(0.32, 0.2, 6), white, s * 4.4, 3.32, 0); }
  // rug
  { const t = canvasTex(512, 320, (q) => { q.fillStyle = '#2a5a9a'; q.beginPath(); q.ellipse(256, 160, 250, 156, 0, 0, 7); q.fill(); q.strokeStyle = '#f2c63a'; q.lineWidth = 14; q.beginPath(); q.ellipse(256, 160, 222, 132, 0, 0, 7); q.stroke(); q.strokeStyle = '#e8402a'; q.lineWidth = 8; q.beginPath(); q.ellipse(256, 160, 190, 108, 0, 0, 7); q.stroke(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; q.fillStyle = '#f4ead8'; q.beginPath(); q.ellipse(256 + Math.cos(a) * 120, 160 + Math.sin(a) * 66, 18, 10, a, 0, 7); q.fill(); } });
    const rg = mesh(new THREE.PlaneGeometry(3.4, 2.1), new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.5, roughness: 0.95 }), 0.4, 0.04, 0.6, false); rg.rotation.x = -Math.PI / 2; SHOPG.add(rg); }
  // side window with curtains (right wall) + picture frames + clock
  const winM = new THREE.MeshBasicMaterial({ color: 0x9fd2f4, toneMapped: false }); const wn = mesh(new THREE.PlaneGeometry(1.9, 1.3), winM, 4.36, 2.0, -0.6, false); wn.rotation.y = -Math.PI / 2; SHOPG.add(wn); SHOPG.userData.winM = winM;
  for (const [y, w] of [[1.32, 2.3], [2.68, 2.3]]) IB.add(new THREE.BoxGeometry(0.14, 0.12, w), white, 4.34, y, -0.6); for (const z of [-1.62, 0.42]) IB.add(new THREE.BoxGeometry(0.14, 1.4, 0.12), white, 4.34, 2.0, z); IB.add(new THREE.BoxGeometry(0.1, 1.3, 0.06), white, 4.34, 2.0, -0.6); IB.add(new THREE.BoxGeometry(0.1, 0.06, 1.9), white, 4.34, 2.0, -0.6);
  for (const s of [-1, 1]) IB.add(boxUV(0.08, 1.9, 0.55, 0.6), texMat('fabric', '#f4e8c8', { side: THREE.DoubleSide }), 4.28, 1.95, -0.6 + s * 1.15); IB.add(boxUV(0.12, 0.35, 2.7, 0.6), texMat('fabric', '#e8302a', { side: THREE.DoubleSide }), 4.26, 2.9, -0.6);
  const frame = plain('#d8a838', { m: 0.6, r: 0.35 });
  const pics = [painting((q) => { q.fillStyle = '#8ad0f0'; q.fillRect(0, 0, 256, 200); q.fillStyle = '#5ac040'; q.beginPath(); q.ellipse(128, 210, 200, 90, 0, 0, 7); q.fill(); q.fillStyle = '#fff'; q.fillRect(150, 50, 6, 100); q.fillStyle = '#e8302a'; q.beginPath(); q.moveTo(156, 50); q.lineTo(200, 64); q.lineTo(156, 78); q.fill(); q.fillStyle = '#ffe060'; q.beginPath(); q.arc(50, 40, 22, 0, 7); q.fill(); }),
    painting((q) => { q.fillStyle = '#2a3a6a'; q.fillRect(0, 0, 256, 200); q.fillStyle = '#f4f4f8'; q.beginPath(); q.arc(128, 100, 66, 0, 7); q.fill(); q.fillStyle = 'rgba(255,255,255,0.8)'; q.beginPath(); q.arc(104, 76, 16, 0, 7); q.fill(); q.fillStyle = '#f2c63a'; q.font = 'bold 34px "DejaVu Sans"'; q.textAlign = 'center'; q.fillText('No. 1', 128, 190); }),
    painting((q) => { q.fillStyle = '#f4e8d0'; q.fillRect(0, 0, 256, 200); q.fillStyle = '#c8642a'; q.beginPath(); q.arc(128, 80, 40, 0, 7); q.fill(); q.fillStyle = '#e2a83a'; q.fillRect(80, 30, 96, 30); q.fillStyle = '#1f9a9a'; q.fillRect(78, 120, 100, 80); q.strokeStyle = '#2a1810'; q.lineWidth = 4; q.beginPath(); q.arc(112, 84, 10, 0, 7); q.arc(144, 84, 10, 0, 7); q.stroke(); })];
  for (const [i, x, z, ry, w, h] of [[0, -4.36, -1.4, Math.PI / 2, 1.2, 0.9], [2, -4.36, 0.6, Math.PI / 2, 0.8, 1.0], [1, 2.95, -2.86, 0, 0.9, 0.75]]) { const g = new THREE.Group(); g.position.set(x, 2.15, z); g.rotation.y = ry; SHOPG.add(g); g.add(mesh(new THREE.BoxGeometry(w + 0.16, h + 0.16, 0.06), frame)); g.add(mesh(new THREE.PlaneGeometry(w, h), pics[i], 0, 0, 0.035, false)); }
  { const t = canvasTex(256, 256, (q) => { q.fillStyle = '#fff8e8'; q.beginPath(); q.arc(128, 128, 120, 0, 7); q.fill(); q.strokeStyle = '#2a1810'; q.lineWidth = 6; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; q.beginPath(); q.moveTo(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100); q.lineTo(128 + Math.cos(a) * 112, 128 + Math.sin(a) * 112); q.stroke(); } q.lineWidth = 9; q.beginPath(); q.moveTo(128, 128); q.lineTo(128, 52); q.moveTo(128, 128); q.lineTo(180, 140); q.stroke(); });
    const c = mesh(new THREE.CircleGeometry(0.36, 32), new THREE.MeshStandardMaterial({ map: t }), -0.6, 3.0, -2.86, false); SHOPG.add(c); SHOPG.add(mesh(new THREE.TorusGeometry(0.37, 0.04, 8, 32), frame, -0.6, 3.0, -2.86)); }
  // workbench (planked top, lower shelf, vise, tools) + buffing machine
  const bt = 0.72, woodTop = texMat('planks', '#c8945a', { r: 0.55 }), wood = texMat('planks', '#8a5a32', { r: 0.7 });
  IB.add(boxUV(3.4, 0.1, 1.1, 1.2), woodTop, 0, bt - 0.05, -1.75); for (const x of [-1.6, 1.6]) for (const z of [-2.2, -1.3]) IB.add(boxUV(0.1, bt - 0.1, 0.1, 1), wood, x, (bt - 0.1) / 2, z); IB.add(boxUV(3.2, 0.06, 0.9, 1.2), wood, 0, 0.18, -1.75);
  for (let i = 0; i < 4; i++) IB.add(new THREE.BoxGeometry(0.4, 0.3, 0.32), plain(['#c8342a', '#2a6ab8', '#e2a83a', '#3a8a4a'][i], { r: 0.6 }), -1.2 + i * 0.75, 0.36, -1.75);
  IB.add(new THREE.BoxGeometry(0.3, 0.16, 0.2), plain('#3a5a8a', { m: 0.6, r: 0.4 }), 1.55, bt + 0.08, -1.35); IB.add(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), plain('#c8c8d0', { m: 0.9, r: 0.2 }), 1.55, bt + 0.2, -1.2, 0, Math.PI / 2);
  BUFF = new THREE.Group(); BUFF.position.set(1.05, bt, -1.9); SHOPG.add(BUFF); BUFF.add(mesh(new THREE.BoxGeometry(0.3, 0.12, 0.3), std(0x2a6a5a, { m: 0.4, r: 0.5 }), 0, 0.06, 0)); const mot = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.42, 16), std(0x2a8a7a, { m: 0.5, r: 0.4 }), 0, 0.26, 0); mot.rotation.z = Math.PI / 2; BUFF.add(mot);
  BUFF.userData.w = []; for (const s of [-1, 1]) { const w = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 20), texMat('fabric', '#f4f0e0'), s * 0.33, 0.26, 0); w.rotation.z = Math.PI / 2; BUFF.add(w); BUFF.userData.w.push(w); }
  // shelves + brackets + mirror balls (the smoothest in town)
  for (const y of [1.45, 1.95, 2.45]) { IB.add(boxUV(4.4, 0.06, 0.34, 1.2), texMat('planks', '#a86a3a'), -1.9, y, -2.75); for (const x of [-3.9, -1.9, 0.1]) IB.add(new THREE.BoxGeometry(0.05, 0.2, 0.28), plain('#2a2a30', { m: 0.6 }), x, y - 0.12, -2.78); }
  const N = 72; SHELFBALLS = new THREE.InstancedMesh(ballGeo('smooth'), MIRROR, N); SHELFCHEW = new THREE.InstancedMesh(ballGeo('chewed'), CHEWM, N); const m4 = new THREE.Matrix4();
  for (let i = 0; i < N; i++) { const row = Math.floor(i / 24), k = i % 24; m4.makeScale(0.075, 0.075, 0.075).setPosition(-3.95 + k * 0.178, 1.45 + row * 0.5 + 0.11, -2.72); SHELFBALLS.setMatrixAt(i, m4); SHELFCHEW.setMatrixAt(i, m4); }
  SHELFBALLS.position.copy(SHOP); SHELFCHEW.position.copy(SHOP); scene.add(SHELFBALLS, SHELFCHEW);
  // pegboard with tools + poster
  const peg = canvasTex(512, 384, (q) => { q.fillStyle = '#c89a62'; q.fillRect(0, 0, 512, 384); q.fillStyle = 'rgba(60,30,10,0.35)'; for (let x = 16; x < 512; x += 32) for (let y = 16; y < 384; y += 32) { q.beginPath(); q.arc(x, y, 4, 0, 7); q.fill(); }
    q.fillStyle = '#4a4a52'; q.fillRect(60, 60, 26, 200); q.fillRect(30, 50, 86, 40); q.fillStyle = '#9aa4ae'; q.fillRect(180, 70, 18, 190); q.beginPath(); q.arc(189, 70, 30, 0, 7); q.fill(); q.fillStyle = '#d8302a'; q.fillRect(290, 80, 22, 120); q.fillStyle = '#9aa4ae'; q.fillRect(296, 200, 10, 80); q.fillStyle = '#e2a83a'; q.fillRect(380, 60, 70, 24); q.fillRect(405, 84, 20, 180); });
  SHOPG.add(mesh(new THREE.BoxGeometry(2.0, 1.5, 0.04), new THREE.MeshStandardMaterial({ map: peg, roughness: 0.8 }), 2.6, 1.95, -2.86, false));
  const poster = banner('PUTTSBY OPEN', 1.5, 1.0, '#f6d84a', '#c8342a', 'bold 220px "DejaVu Sans", sans-serif', 'TOMORROW!'); poster.position.set(-4.36, 2.05, 2.0); poster.rotation.y = Math.PI / 2; SHOPG.add(poster);
  // props: potted plants, crates, golf bag with clubs
  pot(IB, -3.9, -2.4, 1.6, '#2a6ab8'); pot(IB, 3.9, 2.3, 1.4, '#c8603a'); for (const [x, z, s] of [[3.7, -2.3, 0.6], [3.7, -1.65, 0.5], [3.75, -2.0, 0.45]]) IB.add(boxUV(s, s, s, 0.6), texMat('planks', '#b8844a'), x, s / 2 + (x === 3.75 ? 0.6 : 0), z, 0.2);
  IB.add(new THREE.CylinderGeometry(0.2, 0.18, 0.95, 16), plain('#2a5a9a', { r: 0.5 }), -3.6, 0.48, -0.2, 0, 0.12, 0); for (let i = 0; i < 4; i++) { IB.add(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 5), plain('#c8ccd4', { m: 0.9, r: 0.2 }), -3.6 + (i - 1.5) * 0.06, 1.1, -0.2 + (i % 2) * 0.06); IB.add(new THREE.BoxGeometry(0.1, 0.06, 0.06), plain('#2a2a34', { m: 0.6 }), -3.58 + (i - 1.5) * 0.06, 1.47, -0.2 + (i % 2) * 0.06); }
  // hanging lamp
  IB.add(new THREE.CylinderGeometry(0.01, 0.01, 0.8, 4), plain('#222222'), 0, 3.0, -1.6); const shade = mesh(new THREE.ConeGeometry(0.32, 0.3, 20, 1, true), std(0x2a6a5a, { m: 0.5, r: 0.4, side: THREE.DoubleSide }), 0, 2.5, -1.6); SHOPG.add(shade);
  SHOPG.add(mesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff0b0, toneMapped: false }), 0, 2.38, -1.6, false)); LAMP = new THREE.PointLight(0xffc870, 6, 11, 1.4); LAMP.position.set(0, 2.3, -1.4); SHOPG.add(LAMP);
  // basket of balls + dog bed
  BASKET = new THREE.Group(); BASKET.position.set(2.5, 0, -0.5); SHOPG.add(BASKET);
  const wick = canvasTex(256, 64, (q) => { q.fillStyle = '#c8924e'; q.fillRect(0, 0, 256, 64); q.strokeStyle = '#7a4e22'; q.lineWidth = 4; for (let x = 0; x < 256; x += 16) { q.beginPath(); q.moveTo(x, 0); q.lineTo(x + 8, 64); q.stroke(); } for (let y = 8; y < 64; y += 16) { q.beginPath(); q.moveTo(0, y); q.lineTo(256, y); q.stroke(); } }); wick.wrapS = THREE.RepeatWrapping; wick.repeat.set(4, 1);
  BASKET.add(mesh(new THREE.CylinderGeometry(0.46, 0.38, 0.5, 28, 1, true), new THREE.MeshStandardMaterial({ map: wick, roughness: 0.9, side: THREE.DoubleSide }), 0, 0.25, 0)); BASKET.add(mesh(new THREE.TorusGeometry(0.46, 0.04, 8, 28), std(0x8a5a2a), 0, 0.5, 0).rotateX(Math.PI / 2)); BASKET.add(mesh(new THREE.CircleGeometry(0.38, 24), std(0x7a4e22), 0, 0.02, 0).rotateX(-Math.PI / 2));
  const br = rng(23); for (let i = 0; i < 26; i++) { const a = br() * 6.28, d = br() * 0.33, y = 0.12 + (i / 26) * 0.42; const p = V(Math.cos(a) * d, y, Math.sin(a) * d); const s = ball('smooth', 0.075, BASKET); s.position.copy(p); BASKET_SMOOTH.push(s); const c = ball('chewed', 0.075, BASKET); c.position.copy(p); c.rotation.set(br() * 6, br() * 6, 0); BASKET_CHEW.push(c); }
  for (let i = 0; i < 14; i++) { const c = ball('chewed', 0.075); c.userData.home = V(2.5 + (br() - 0.5) * 0.5, 0.075, -0.5 + br() * 0.3); c.userData.to = V(2.5 - 0.4 - br() * 1.6, 0.075, -0.5 + 0.2 + br() * 1.6); c.rotation.set(br() * 6, br() * 6, 0); FLOORCHEW.push(c); }
  const bed = mesh(new THREE.TorusGeometry(0.45, 0.16, 12, 28), texMat('fabric', '#d8402a'), -3.0, 0.15, -0.8); bed.rotation.x = Math.PI / 2; SHOPG.add(bed); SHOPG.add(mesh(new THREE.CircleGeometry(0.45, 24), std(0xf4e0c0, { r: 1 }), -3.0, 0.08, -0.8).rotateX(-Math.PI / 2));
  IB.flush(SHOPG);
  // ---- exterior: brick front with door, display window, striped awning, sign, pots, bench; tiled roof; street lamp ----
  SHOPFRONT = new THREE.Group(); SHOPG.add(SHOPFRONT); const FB = new Batch(), fw = texMat('brick', '#c86a4a', { ns: 1.2 }), trim = plain('#fff8ee', { r: 0.5 });
  FB.add(boxUV(3.6, 3.4, 0.24, 1.6), fw, -2.7, 1.7, 3); FB.add(boxUV(0.9, 3.4, 0.24, 1.6), fw, 4.05, 1.7, 3); FB.add(boxUV(1.8, 1.1, 0.24, 1.6), fw, 0, 2.85, 3); FB.add(boxUV(2.7, 1.0, 0.24, 1.6), fw, 2.25, 0.5, 3); FB.add(boxUV(2.7, 0.7, 0.24, 1.6), fw, 2.25, 3.05, 3);
  FB.add(boxUV(1.7, 2.3, 0.08, 1.1), texMat('panel', '#1f7a7a', { r: 0.5 }), 0, 1.15, 3.02); for (const s of [-1, 1]) FB.add(new THREE.BoxGeometry(0.14, 2.4, 0.2), trim, s * 0.9, 1.2, 3.1); FB.add(new THREE.BoxGeometry(2.0, 0.16, 0.2), trim, 0, 2.38, 3.1);
  FB.add(new THREE.BoxGeometry(2.9, 0.14, 0.3), trim, 2.25, 1.0, 3.15); FB.add(new THREE.BoxGeometry(2.9, 0.12, 0.2), trim, 2.25, 2.72, 3.1); for (const x of [0.9, 2.25, 3.6]) FB.add(new THREE.BoxGeometry(0.08, 1.7, 0.12), trim, x, 1.86, 3.1);
  const glow = new THREE.MeshStandardMaterial({ color: 0x2a1a10, emissive: 0xff8a20, emissiveIntensity: 0.0, roughness: 0.1, transparent: true, opacity: 0.9 }); WINGLOW.push(glow); SHOPFRONT.add(mesh(new THREE.BoxGeometry(2.6, 1.7, 0.05), glow, 2.25, 1.85, 3.02, false));
  FB.add(boxUV(4.6, 0.08, 1.4, 0.9), texMat('fabric', '#1f9a9a', { side: THREE.DoubleSide }), 1.0, 2.95, 3.6, 0, -0.42);
  for (let i = 0; i < 12; i++) FB.add(new THREE.ConeGeometry(0.2, 0.22, 3), plain(i % 2 ? '#ffffff' : '#1f9a9a', { side: THREE.DoubleSide }), -1.1 + i * 0.38, 2.6, 4.25, 0, 0, Math.PI);
  pot(FB, -1.35, 3.5, 1.3, '#e2a83a'); pot(FB, 3.9, 3.5, 1.2, '#2a6ab8'); bench(FB, -3.0, 3.9, 0, '#2a8a8a');
  FB.add(new THREE.BoxGeometry(9.4, 0.22, 0.4), trim, 0, 3.45, 3.1); FB.flush(SHOPFRONT);
  const sign = banner("MILO'S GOLF BALLS", 4.2, 0.7, '#f6d84a', '#1e5a5a', 'bold 170px "DejaVu Sans", sans-serif'); sign.position.set(0.6, 3.85, 3.2); SHOPFRONT.add(sign);
  const nb = banner('PUTTSBY OPEN', 1.2, 0.8, '#f4f0e6', '#c8342a', 'bold 220px "DejaVu Sans", sans-serif', 'TOMORROW!'); nb.position.set(-1.6, 1.7, 3.15); SHOPFRONT.add(nb);
  SHOPROOF = new THREE.Group(); SHOPG.add(SHOPROOF); { const RB2 = new Batch(); const rh = 2.2, ang = Math.atan2(rh, 4.5), sl = Math.hypot(4.5, rh) + 0.6; for (const s of [-1, 1]) { const g = boxUV(sl, 0.16, 7.0, 1.6); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i)); RB2.add(g, texMat('tiles', '#c8442a', { ns: 1.4 }), s * 2.3, 3.4 + rh / 2, 0, 0, 0, -s * ang); }
    const sh = new THREE.Shape(); sh.moveTo(-4.5, 0); sh.lineTo(4.5, 0); sh.lineTo(0, rh); sh.closePath(); RB2.add(new THREE.ShapeGeometry(sh), texMat('brick', '#c86a4a'), 0, 3.4, 3.12); RB2.add(new THREE.ShapeGeometry(sh), texMat('brick', '#c86a4a'), 0, 3.4, -3.1, Math.PI); RB2.flush(SHOPROOF); }
  STREETLAMP = new THREE.Group(); STREETLAMP.position.set(-5.5, 0, 5.2); SHOPG.add(STREETLAMP); { const LB = new Batch(); lampPost(LB, 0, 0, 3.9); LB.flush(STREETLAMP); }
  const sl = new THREE.PointLight(0xffd090, 0, 18, 1.3); sl.position.set(0, 3.9, 0.4); STREETLAMP.add(sl); STREETLAMP.userData.l = sl;
}
function buildPro() {
  const g = new THREE.Group(); g.position.copy(PRO); scene.add(g); const PB = new Batch(), wl = texMat('siding', '#f4f0e6'), gr = texMat('siding', '#2a8a5a');
  PB.add(boxUV(0.2, 3.2, 5, 2), wl, -2, 1.6, 0); for (const s of [-1, 1]) PB.add(boxUV(3.6, 3.2, 0.2, 2), gr, -0.2, 1.6, s * 2.5); PB.add(boxUV(4, 0.2, 5.4, 2), texMat('tiles', '#2a8a4a'), -0.1, 3.3, 0);
  PB.add(boxUV(0.8, 0.9, 4.6, 1), texMat('panel', '#2a7a4a', { r: 0.6 }), 1.2, 0.45, 0); PB.add(boxUV(1.0, 0.08, 4.8, 1), texMat('planks', '#c8945a', { r: 0.5 }), 1.2, 0.94, 0);
  PB.add(boxUV(1.5, 0.05, 5.4, 0.9), texMat('fabric', '#e8302a', { side: THREE.DoubleSide }), 2.0, 3.05, 0, 0, 0, -0.35); for (let i = 0; i < 14; i++) PB.add(new THREE.ConeGeometry(0.19, 0.22, 3), plain(i % 2 ? '#ffffff' : '#e8302a', { side: THREE.DoubleSide }), 2.72, 2.72, -2.5 + i * 0.385, 0, 0, Math.PI);
  for (const y of [1.3, 1.9, 2.5]) PB.add(boxUV(0.4, 0.05, 4.4, 1), texMat('planks', '#9a6a3a'), -1.7, y, 0);
  PB.flush(g); const sb = banner('PRO SHOP', 3, 0.6, '#2a7a4a', '#ffffff', 'bold 200px "DejaVu Sans", sans-serif'); sb.position.set(1.6, 3.6, 0); sb.rotation.y = Math.PI / 2; g.add(sb);
  const boxT = canvasTex(128, 96, (q) => { q.fillStyle = '#fff'; q.fillRect(0, 0, 128, 96); q.fillStyle = '#2a5ad8'; q.fillRect(0, 0, 128, 22); q.fillStyle = '#d8d8e0'; q.beginPath(); q.arc(64, 60, 26, 0, 7); q.fill(); q.fillStyle = '#fff'; q.beginPath(); q.arc(56, 52, 9, 0, 7); q.fill(); });
  const boxM = new THREE.MeshStandardMaterial({ map: boxT, roughness: 0.5 }); for (const y of [1.3, 1.9, 2.5]) for (let k = 0; k < 12; k++) { const b = mesh(new THREE.BoxGeometry(0.3, 0.24, 0.32), boxM, -1.68, y + 0.15, -2.0 + k * 0.36); b.rotation.y = Math.PI / 2; g.add(b); b.userData.home = b.position.clone(); PROBOXES.push(b); }
  CASH = new THREE.Group(); CASH.position.set(1.15, 0.98, 0.5); g.add(CASH); CASH.add(mesh(new THREE.BoxGeometry(0.5, 0.32, 0.5), std(0x3a3a42, { m: 0.5, r: 0.4 }), 0, 0.2, 0)); const top = mesh(new THREE.BoxGeometry(0.4, 0.18, 0.44), std(0xd8a848, { m: 0.8, r: 0.3 }), -0.05, 0.42, 0); top.rotation.z = 0.4; CASH.add(top);
  REGDRAWER = mesh(new THREE.BoxGeometry(0.42, 0.1, 0.44), std(0x5a5a62, { m: 0.6 }), 0.0, 0.08, 0); CASH.add(REGDRAWER);
  PROLAMP = new THREE.PointLight(0xffd090, 0, 10, 1.4); PROLAMP.position.set(0.5, 2.8, 0); g.add(PROLAMP);
}
function golfCart() {   // open-sided cart: nobody gets swallowed by its panels
  const g = new THREE.Group(); const paint = new THREE.MeshPhysicalMaterial({ color: 0xf6f4f0, roughness: 0.3, clearcoat: 1 }), pink = new THREE.MeshPhysicalMaterial({ color: 0xe0487e, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05 }), dark = std(0x2a2a30, { r: 0.6 }), tyre = std(0x1a1a1c, { r: 0.85 }), chrome = std(0xe8e8ee, { m: 1, r: 0.15 });
  g.add(mesh(new THREE.BoxGeometry(2.3, 0.22, 1.15), paint, 0, 0.42, 0)); const nose = mesh(new THREE.CapsuleGeometry(0.42, 0.4, 6, 16), pink, 0.85, 0.72, 0); nose.rotation.x = Math.PI / 2; nose.scale.set(1, 1.35, 0.9); g.add(nose);
  g.add(mesh(new THREE.BoxGeometry(0.7, 0.14, 1.0), texMat('fabric', '#f4f0e6'), -0.15, 0.78, 0)); g.add(mesh(new THREE.BoxGeometry(0.14, 0.55, 1.0), texMat('fabric', '#f4f0e6'), -0.52, 1.08, 0)); g.add(mesh(new THREE.BoxGeometry(0.5, 0.3, 0.9), pink, -0.15, 0.6, 0));
  for (const [x, z] of [[-0.75, -0.52], [-0.75, 0.52], [0.7, -0.52], [0.7, 0.52]]) g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.45, 8), chrome, x, 1.25, z));
  g.add(mesh(new THREE.BoxGeometry(1.95, 0.08, 1.3), pink, -0.02, 1.98, 0)); g.add(mesh(new THREE.BoxGeometry(2.0, 0.05, 1.34), paint, -0.02, 2.04, 0));
  const sw = mesh(new THREE.TorusGeometry(0.15, 0.025, 8, 20), dark, 0.42, 1.08, 0.22); sw.rotation.set(0, Math.PI / 2, 0.5); g.add(sw);
  for (const [x, z] of [[-0.75, -0.6], [-0.75, 0.6], [0.78, -0.6], [0.78, 0.6]]) { const w = mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 20), tyre, x, 0.24, z); w.rotation.x = Math.PI / 2; g.add(w); const h = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.17, 16), chrome, x, 0.24, z); h.rotation.x = Math.PI / 2; g.add(h); }
  g.userData.lights = []; for (const z of [-0.3, 0.3]) { const l = mesh(new THREE.SphereGeometry(0.08, 12, 8), new THREE.MeshStandardMaterial({ color: 0xfff6d0, emissive: 0xfff0b0, emissiveIntensity: 2 }), 1.26, 0.74, z, false); g.add(l); g.userData.lights.push(l); }
  const bag = mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.95, 14), pink, -1.0, 1.0, 0); bag.rotation.z = 0.3; g.add(bag); for (let i = 0; i < 3; i++) { const c = mesh(new THREE.BoxGeometry(0.12, 0.07, 0.07), chrome, -1.18 + i * 0.03, 1.5, -0.08 + i * 0.08); g.add(c); }
  return g;
}

// =================== CAST ===================
installActing();
const MILO = new Flat2D({ ...MILO_O, scene }), GUS = new Flat2D({ ...GUS_O, scene });
// the narration drives the leads: every stressed word lands as a springy head / brow / body accent
const ACC = makeAccents(WORDS, ENERGY); for (const P of [MILO, GUS]) { const u0 = P.update.bind(P); P.update = (pose, c) => u0(pose.noAcc ? pose : withAccent(pose, ACC(Flat2D.T || 0, pose.acc ?? 1, P === MILO ? 0 : 1)), c); }
const DOG = new Dog2D({ scene, size: 0.95 }), DOG2 = new Dog2D({ scene, size: 0.85, coat: '#f6f4ee', belly: '#ffffff', spot: '#2a2a2a', ear: '#2a2a2a', collar: '#2a5ad8', seed: 2 });
// golf-world people: dressed for golf on the torso, real hair shapes, hats only where the story needs them (none here)
const HAIRC = ['#2a1c16', '#6a3a1e', '#c8642a', '#e8c86a', '#9a9a9a', '#3a2418', '#b8743a'];
const folk = (k, o = {}) => new Flat2D({ body: k % 4 === 3 ? 'dress' : 'polo', coat: ['#3a8ad8', '#f2c63a', '#4ab84a', '#e8402a', '#9a6ad8', '#2a9a8a', '#f28a3a', '#ffffff'][k % 8], pattern: ['stripes', null, 'plaid', null, 'argyle'][k % 5], patCol: 'rgba(255,255,255,0.3)', collarCol: '#ffffff', sleeves: true,
  hair: HAIRC[k % 7], hairStyle: ['swept', 'curly', 'bun', 'quiff', 'ponytail', 'bald', 'spiky', 'pigtails', 'messy'][k % 9], hat: null, glasses: k % 5 === 2 ? 'round' : null, mustache: k % 6 === 4, seed: 20 + k, size: k % 7 === 2 ? 1.45 : 1.85 + (k % 3) * 0.06, width: 0.95 + (k % 3) * 0.12, scene, res: 1.4, ...o });
const KEEP = folk(2, { coat: '#2a8a4a', pattern: null, logo: '#ffffff', hairStyle: 'swept', hair: '#3a2418', size: 1.9, res: 1.6 });
const GOLFERS = [folk(0, { coat: '#ffffff', pattern: 'argyle', patCol: 'rgba(40,80,160,0.35)', patCol2: 'rgba(230,60,60,0.7)', hairStyle: 'bald', hair: '#9a9a9a', mustache: true, res: 1.6 }), folk(4, { body: 'dress', coat: '#f28ab8', pattern: 'stripes', hairStyle: 'ponytail', hair: '#e8c86a', res: 1.6 }), folk(1, { coat: '#3a8ad8', pattern: null, hairStyle: 'curly', hair: '#2a1c16', glasses: 'round', res: 1.6 })];
const CROWD = Array.from({ length: 14 }, (_, k) => folk(k + 3));
const PEOPLE = [MILO, GUS, KEEP, ...GOLFERS, ...CROWD];
const hide = (c) => { c.mesh.visible = false; c.mesh.rotation.z = 0; c.mesh.scale.setScalar(1); c.mesh.material.depthTest = true; c.mesh.renderOrder = 0; if (c.shadow) { c.shadow.visible = false; c.shadow.scale.set(1, 1, 1); } };
const MILO_DAY = { ...MILO_O }, MILO_PJ = { ...MILO_O, body: 'coat', coat: '#7aa8e8', pattern: 'stripes', patCol: 'rgba(255,255,255,0.45)', sleeves: false, tie: null, badge: null, bandana: null, hat: null, hairStyle: 'messy', glasses: 'round' };
const outfit = (P, o) => Object.assign(P.o, o);
const cardFront = (P, camPos, d) => P.mesh.position.add(V().subVectors(camPos, P.pos).setY(0).normalize().multiplyScalar(d));

// =================== FX ===================
const B = {
  tink: new Burst({ n: 26, dur: 0.05, life: 0.35, speed: [2, 5], dir: [0, 1, 0.4], spread: 1.1, g: -12, size: [0.03, 0.08], tex: 'spark', add: true, seed: 11 }),
  tink2: new Burst({ n: 26, dur: 0.05, life: 0.35, speed: [2, 5], dir: [0, 1, 0.4], spread: 1.1, g: -12, size: [0.03, 0.08], tex: 'spark', add: true, seed: 12 }),
  shine: new Burst({ n: 8, dur: 0.15, life: 0.55, speed: [0.05, 0.3], dir: [0, 1, 0], spread: 1, g: 0, size: [0.04, 0.12], grow: 1.5, tex: 'star', add: true, seed: 3 }),
  shine2: new Burst({ n: 8, dur: 0.15, life: 0.55, speed: [0.05, 0.3], dir: [0, 1, 0], spread: 1, g: 0, size: [0.04, 0.12], grow: 1.5, tex: 'star', add: true, seed: 31 }),
  shine3: new Burst({ n: 8, dur: 0.15, life: 0.55, speed: [0.05, 0.3], dir: [0, 1, 0], spread: 1, g: 0, size: [0.05, 0.14], grow: 1.5, tex: 'star', add: true, seed: 32 }),
  shineS: new Burst({ n: 8, dur: 0.15, life: 0.6, speed: [0.02, 0.1], dir: [0, 1, 0], spread: 1, g: 0, size: [0.03, 0.1], grow: 1.3, tex: 'star', add: true, seed: 33 }),
  shineBig: new Burst({ n: 10, dur: 0.2, life: 0.7, speed: [0.2, 0.8], dir: [0, 1, 0], spread: 1, g: 0, size: [0.3, 0.9], grow: 1.2, tex: 'star', add: true, seed: 4 }),
  crumbs: new Burst({ n: 20, dur: 0.8, life: 0.5, speed: [0.6, 1.6], dir: [0, 1, 0.3], spread: 0.8, g: -6, size: [0.02, 0.05], tex: 'smoke', opacity: 0.9, seed: 5 }),
  dust: new Burst({ n: 12, dur: 0.15, life: 0.6, speed: [1, 2], dir: [0, 1, 0], spread: 1.3, g: -1, size: [0.15, 0.3], grow: 1.2, tex: 'smoke', opacity: 0.5, seed: 6 }),
  dust2: new Burst({ n: 18, dur: 0.15, life: 1.0, speed: [2, 5], dir: [0, 1, 0], spread: 1.0, g: -3, size: [0.8, 1.6], grow: 1.4, tex: 'smoke', opacity: 0.7, seed: 16 }),
  confetti: new Burst({ n: 90, dur: 0.8, life: 2.0, speed: [4, 8], dir: [0, 1, 0], spread: 0.8, g: -5, size: [0.12, 0.2], tex: 'confetti', seed: 7 }),
  hit: new Burst({ n: 22, dur: 0.05, life: 0.3, speed: [2, 6], dir: [0, 0.3, -1], spread: 0.8, g: -6, size: [0.05, 0.12], tex: 'spark', add: true, seed: 8 }),
  bonk: new Burst({ n: 16, dur: 0.05, life: 0.4, speed: [1.5, 3.5], dir: [0, 1, 0], spread: 1.2, g: -6, size: [0.06, 0.14], tex: 'star', add: true, seed: 9 }),
  tears: new Burst({ n: 12, dur: 0.5, life: 0.6, speed: [1, 2], dir: [0, 1, 0], spread: 0.9, g: -8, size: [0.05, 0.08], tex: 'bubble', seed: 10 }),
  money: new Burst({ n: 16, dur: 0.3, life: 0.9, speed: [1.5, 3], dir: [0, 1, 0], spread: 0.9, g: -5, size: [0.1, 0.16], tex: 'confetti', seed: 13 }),
  sweat: new Burst({ n: 10, dur: 0.6, life: 0.5, speed: [1, 2], dir: [0, 1, 0], spread: 1.2, g: -7, size: [0.05, 0.09], tex: 'bubble', seed: 14 }),
};
B.money.ps.forEach((q) => q.m.material.color.setHex(0x6ad860));
// dazed stars circling Gus's head
const DAZE = []; for (let i = 0; i < 5; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: PT.star, transparent: true, depthWrite: false, toneMapped: false, color: 0xfff060 })); s.visible = false; s.renderOrder = 12; scene.add(s); DAZE.push(s); }
const glowM = (c, o = 0.8) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, toneMapped: false, depthWrite: false });
const TRAIL = new THREE.Mesh(new THREE.BufferGeometry(), glowM(0xffd27a, 0.8)); scene.add(TRAIL);
const GLOW = new THREE.Sprite(new THREE.SpriteMaterial({ map: PT.spark, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); GLOW.renderOrder = 11; scene.add(GLOW);
const tube = (m, pts, r) => { m.geometry.dispose(); m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(8, pts.length * 3), r, 8, false); };

// the ball props in the story
const ANVIL = mesh(new THREE.BoxGeometry(0.34, 1, 0.26), std(0x3a3a42, { m: 0.8, r: 0.35 })); scene.add(ANVIL);
const HOOKBALL = ball('dimple', 0.07), TEEBALL = ball('chewed', 0.075), MIRRORB = ball('smooth', 0.075), GUSBALL = ball('smooth', 0.075), PRACTB = ball('smooth', 0.07), END1 = ball('chewed', 0.07), END2 = ball('chewed', 0.07);
const TEEPEG = mesh(new THREE.CylinderGeometry(0.018, 0.008, 0.07, 8), std(0xf4f4f4)); scene.add(TEEPEG);
// Milo's drive: launch from the tee, flies twice as far as the old record
const DRIVE = (u) => V(0.3 + 3 * u, 0.1 + 46 * 4 * u * (1 - u) * (1 - 0.15 * u), -330 * u);
// Gus's drive: up like a rocket ... stops ... drops like a brick straight onto his own head
const GUSUP = (t) => { const k = clamp((t - 29.35) / 1.25, 0, 1), e = 1 - (1 - k) ** 2.2; return V(0.6 + 1.2 * Math.sin(k * 3), 0.2 + 34 * e, -0.5 - 3 * e); };

// =================== SCIENCE SET: a giant ball high over the course, the air drawn as flowing lines ===================
const sciPos = (t) => V(90, 70, -240 - (t - 32.24) * 3); const FLOWQ = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), 0.78);
const SCIG = new THREE.Group(); SCIG.position.copy(sciPos(32.24)); scene.add(SCIG);
const FLOW = new THREE.Group(); SCIG.add(FLOW); FLOW.rotation.x = 0.78;   // ball climbs up-right in the portrait frame, wake trails down-left
const RB = 1.15;
const SBALL = { generic: ball('dimple', RB, FLOW), smooth: ball('smooth', RB, FLOW), dimple: ball('dimple', RB, FLOW) };
const L2 = (X, Y) => V(0, Y * RB, -X * RB);   // flow plane: X forward (screen right-up), Y across
const DASH = canvasTex(64, 4, (q) => { q.fillStyle = '#000'; q.fillRect(0, 0, 64, 4); q.fillStyle = '#fff'; q.fillRect(0, 0, 38, 4); });
DASH.colorSpace = THREE.NoColorSpace;
const LINES = []; for (let i = 0; i < 12; i++) { const tx = DASH.clone(); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.needsUpdate = true; const m = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0xe8f8ff, transparent: true, alphaMap: tx, opacity: 0.95, depthWrite: false, toneMapped: false })); m.renderOrder = 5; FLOW.add(m); LINES.push(m); }
const Y0 = [0.18, 0.5, 0.85, 1.25, 1.9, 2.7]; let flowKey = '';
function flowPath(y0, sep, wd) { const s = Math.sign(y0), a = Math.abs(y0), pts = [];
  if (a > 1.7) { for (let X = 6; X >= -9; X -= 0.5) pts.push([X, s * (a + 0.9 * Math.exp(-(((X + 0.4) / 1.8) ** 2)) / a + (X < 0 ? wd * 0.5 * -X / a : 0))]); return pts; }
  const rho = 1.12 + 0.34 * a, pa = Math.asin(Math.min(0.9, a / rho)); for (let X = 6; X > rho * Math.cos(pa) + 0.6; X -= 0.5) pts.push([X, s * a]);
  for (let k = 0; k <= 18; k++) { const p = pa + (sep - pa) * k / 18; pts.push([rho * Math.cos(p), s * rho * Math.sin(p)]); }
  const [ex, ey] = pts[pts.length - 1]; for (let d = 0.5; d <= 9; d += 0.5) pts.push([ex - d, s * Math.max(0.15, Math.abs(ey) + wd * d + 0.06 * Math.sin(d * 2.3) * Math.min(1, d / 3))]); return pts; }
function buildFlow(sepDeg, wd) { const key = sepDeg.toFixed(1) + wd.toFixed(3); if (key === flowKey) return; flowKey = key; let i = 0;
  for (const y of Y0) for (const s of [1, -1]) { const p = flowPath(s * y, (sepDeg * Math.PI) / 180, wd).map(([x, yy]) => L2(x, yy)); const m = LINES[i++]; tube(m, p, 0.028); let len = 0; for (let j = 1; j < p.length; j++) len += p[j].distanceTo(p[j - 1]); m.material.alphaMap.repeat.set(len / 0.5, 1); m.userData.len = len; } }
// swirling pocket behind the ball (wake): spinning spirals + a soft haze
const SPIRAL = (() => { const pts = []; for (let i = 0; i <= 60; i++) { const u = i / 60, a = u * Math.PI * 2 * 2.2, r = 0.15 + 0.85 * u; pts.push(V(0, Math.sin(a) * r, Math.cos(a) * r)); } return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.03, 6, false); })();
const SWIRLS = []; for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(SPIRAL, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false, toneMapped: false })); m.renderOrder = 6; FLOW.add(m); SWIRLS.push(m); }
const HAZE = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: canvasTex(256, 128, (q) => { const g = q.createRadialGradient(128, 64, 4, 128, 64, 124); g.addColorStop(0, 'rgba(210,235,255,0.75)'); g.addColorStop(1, 'rgba(210,235,255,0)'); q.fillStyle = g; q.fillRect(0, 0, 256, 128); }), transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
HAZE.rotation.y = Math.PI / 2; FLOW.add(HAZE);
const CURLS = []; for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(SPIRAL, new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false })); FLOW.add(m); CURLS.push(m); }
const SEPDOT = []; for (const s of [1, -1]) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), glowM(0xff8a2a, 1)); FLOW.add(m); SEPDOT.push([m, s]); }
// parachute (the wake drawn as a drag chute): striped canopy + tethers
function makeChute(parent) { const g = new THREE.Group(); parent.add(g);
  const tx = canvasTex(512, 64, (q) => { for (let i = 0; i < 12; i++) { q.fillStyle = i % 2 ? '#ffffff' : '#e8302a'; q.fillRect(i * 512 / 12, 0, 512 / 12 + 1, 64); } });
  const can = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 14, 0, Math.PI * 2, 0, Math.PI * 0.42), new THREE.MeshStandardMaterial({ map: tx, side: THREE.DoubleSide, roughness: 0.7, transparent: true, opacity: 0.95 })); can.castShadow = false; g.add(can);
  g.userData.can = can; g.userData.teth = []; for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 4), std(0xf4f0e6)); g.add(c); g.userData.teth.push(c); } return g; }
const CHUTE = makeChute(FLOW);
// second ball pair for the race (43.66-45.22): Gus's mirror ball (huge chute) vs Milo's dimpled ball (tiny chute)
const RACE = new THREE.Group(); SCIG.add(RACE); RACE.rotation.x = 0.78; const RACE_G = new THREE.Group(), RACE_M = new THREE.Group(); RACE.add(RACE_G, RACE_M);
ball('smooth', RB, RACE_G); ball('dimple', RB, RACE_M); const CHUTE_G = makeChute(RACE_G), CHUTE_M = makeChute(RACE_M);
function setChute(ch, Rc, Ltt, t) { ch.visible = Rc > 0.02; if (!ch.visible) return; const fl = 1 + 0.035 * Math.sin(t * 11) + 0.02 * Math.sin(t * 17);
  const can = ch.userData.can; const rimZ = RB * (1.0 + Ltt); can.scale.setScalar(Rc * fl); can.rotation.x = Math.PI / 2; can.position.set(0, 0, rimZ - Rc * 0.25 * fl);
  const rr = Rc * fl * Math.sin(Math.PI * 0.42); ch.userData.teth.forEach((c, i) => { const a = (i / 6) * Math.PI * 2 + 0.3; const A = V(0, Math.sin(a) * 0.35 * RB, RB * 0.95), Bp = V(Math.cos(a) * rr, Math.sin(a) * rr, rimZ); c.position.copy(A).add(Bp).multiplyScalar(0.5); c.scale.y = A.distanceTo(Bp); c.quaternion.setFromUnitVectors(V(0, 1, 0), Bp.clone().sub(A).normalize()); }); }
const SCI_CLOUDS = []; { const tx = canvasTex(256, 128, (q) => { q.fillStyle = '#fff'; for (const [x, y, r] of [[70, 80, 34], [110, 62, 44], [158, 70, 38], [196, 86, 28], [128, 92, 40]]) { q.beginPath(); q.arc(x, y, r, 0, 7); q.fill(); } }); for (let i = 0; i < 10; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false })); s.scale.set(9, 4.5, 1); SCIG.add(s); SCI_CLOUDS.push(s); } }

// =================== SETUP per frame ===================
const sceneVis = (t) => { const ext = (t >= 10.1 && t < 12.22) || (t >= 16.3 && t < 19.0); SHOPFRONT.visible = ext; SHOPROOF.visible = ext; };
const W = (t, a, b) => t >= a && t < b;
function setup(t, camPos) {
  Flat2D.T = t; Flat2D.E = 0; Flat2D.ON = 0; for (const c of PEOPLE) hide(c); DOG.hide(); DOG2.hide(); sceneVis(t);
  ANVIL.visible = false; for (const b of [HOOKBALL, TEEBALL, MIRRORB, GUSBALL, PRACTB, END1, END2, TEEPEG, ...FLOORCHEW]) b.visible = false; TRAIL.visible = false; GLOW.visible = false; DAZE.forEach((s) => (s.visible = false));
  const n = NIGHT(t); LAMP.intensity = n ? 2.4 : 3.5; STREETLAMP.userData.l.intensity = n ? 12 : 0; PROLAMP.intensity = n ? 12 : 0; WINGLOW.forEach((m) => (m.emissiveIntensity = n ? 0.45 : 0)); GLASS.emissive.setHex(n ? 0xffa040 : 0x000000); GLASS.emissiveIntensity = n ? 0.55 : 0; SHOPG.userData.winM.color.setHex(n ? 0x1a2a5a : 0x9fd2f4);
  CART.userData.lights.forEach((l) => (l.material.emissiveIntensity = n ? 4 : 0.6));
  const chewed = t >= 12.9 && t < 46.76 ? 1 : 0; SHELFBALLS.visible = !(t >= 46.76); SHELFCHEW.visible = t >= 46.76;
  { const tip = t >= 13.38 && t < 21 ? sstep(13.38, 13.6, t) : 0; BASKET.rotation.z = tip * 1.35; BASKET.position.set(2.5 - tip * 0.25, tip * 0.2, -0.5); } BASKET_SMOOTH.forEach((b, i) => { const sw = t >= 46.76 || (t > 12.6 + i * 0.03 && t < 21); b.visible = !sw; BASKET_CHEW[i].visible = sw; });
  BUFF.userData.w.forEach((w) => (w.rotation.x = t * 40)); SCIG.visible = SCI(t);
  const H = MILO, G = GUS; outfit(H, NIGHT(t) && t < 16.3 ? MILO_PJ : MILO_DAY);
  const hs = (x, z) => SL(x, 0, z);
  // ---------------- 0 - 1.3 HOOK: Milo hammers dents into a perfectly good ball ----------------
  if (t < 1.3) { const p = hs(-2.3, -1.6); H.place(p.x, 0, p.z);
    const UP = { armR: [150, 12], armL: [28, -40], lean: 5, bend: -22, tilt: 6, hatOff: 18, squash: -0.04, headLag: -8 }, HIT = { armR: [66, 10], armL: [30, -40], lean: -9, bend: 24, tilt: -8, hatOff: -4, squash: 0.1, headLag: 10, hop: -6 }, SET = { armR: [70, 12], armL: [28, -40], lean: -5, bend: 14, tilt: -4, hatOff: 0, squash: 0, headLag: 4, hop: 0 };
    const F = faceK(t, [[0, { eyes: 'stare', mouth: 'psycho', brow: 0.2, look: [0.6, 0.6] }], [0.33, { eyes: 'squeeze', mouth: 'psycho', brow: -0.5 }], [0.5, { eyes: 'stare', mouth: 'psycho', brow: 0.3, look: [0.7, 0.7] }], [0.9, { eyes: 'squeeze', mouth: 'psycho', brow: -0.6 }], [1.05, { eyes: 'stare', mouth: 'psycho', brow: 0.35, look: [0, 0] }]]);
    const base = { e: 1, prop: 'hammer', propHand: 'R', propFront: true, face: F, noBlink: true, noIdle: true, hip: -8 };
    H.update({ ...base, ...HIT, noAcc: true }, camPos); const fa = H.toWorld(H.propPt(H.handR, 34, 115)), fb = H.toWorld(H.propPt(H.handR, -34, 115)); const face = fa.y < fb.y ? fa : fb;
    const k = keys(t, [[0, UP], [0.25, { ...UP, armR: [168, 22], lean: 8, bend: -34, hatOff: 30 }, 0.15], [0.33, HIT, 0.07, 'in'], [0.42, SET, 0.2, 'back'], [0.66, { ...UP, armR: [166, 20] }, 0.18], [0.9, HIT, 0.07, 'in'], [1.0, SET, 0.2, 'back']]);
    H.update({ ...base, ...k, acc: 0.5 }, camPos);
    const toC = V().subVectors(camPos, p).setY(0).normalize(); const bc = face.clone().addScaledVector(toC, 0.06); bc.y = Math.max(0.72 + 0.065, face.y - 0.065); HOOKBALL.visible = true; HOOKBALL.position.copy(bc);
    HOOKBALL.scale.set(0.065 * (1 + 0.3 * Math.max(0, 1 - Math.abs(t - 0.42) * 8) + 0.3 * Math.max(0, 1 - Math.abs(t - 0.99) * 8)), 0.065 * (1 - 0.25 * Math.max(0, 1 - Math.abs(t - 0.42) * 8) - 0.25 * Math.max(0, 1 - Math.abs(t - 0.99) * 8)), 0.065);
    const ah = Math.max(0.02, bc.y - 0.065 - 0.72); ANVIL.visible = true; ANVIL.scale.set(1, ah, 1); ANVIL.position.set(bc.x, 0.72 + ah / 2, bc.z); }
  // ---------------- 1.3 - 3.06 he shows the dented ball ----------------
  else if (t < 3.06) { const p = hs(-2.3, -1.6); H.place(p.x, 0, p.z);
    const k = keys(t, [[1.3, { armR: [96, -70], armL: [34, 6], tilt: 0, lean: 0 }], [1.66, { armR: [104, -88], armL: [34, 6], tilt: 8, lean: 4, bend: 10 }, 0.16], [1.98, { armR: [118, -96], armL: [20, 30], tilt: 10, lean: 6, bend: 16, hop: 6 }, 0.14], [2.28, { armR: [108, -86], armL: [20, 30], tilt: -6, lean: -2, bend: -8 }, 0.16], [2.52, { armR: [112, -90], armL: [150, -150], tilt: -9, lean: -3, hop: 10 }, 0.14]]);
    H.update({ e: 1, ...k, prop: 'gball', face: faceK(t, [[1.3, { eyes: 'stare', mouth: 'psycho', brow: 0.2, look: [0.7, -0.3] }], [1.66, { eyes: 'lid', lid: 0.3, mouth: 'smirk1', brow: -0.4, look: [0.8, -0.4] }], [1.98, { eyes: 'stare', mouth: 'psycho', brow: 0.5, look: [0.8, -0.5] }], [2.28, { eyes: 'lid', lidL: 0.5, lidR: 0.08, squint: 0.2, mouth: 'grin', browL: -0.6, browR: 0.8, look: [0, 0] }], [2.52, { eyes: 'stare', mouth: 'psycho', brow: 0.4, look: [0, 0] }]]), noBlink: true }, camPos); }
  // ---------------- 4.72 - 6.96 every golfer swore by smooth balls ----------------
  if (W(t, 4.72, 6.96)) { const P0 = PRACT;
    GOLFERS[0].place(P0.x - 1.15, 0.05, P0.z + 0.5); GOLFERS[0].update({ e: 1, ...keys(t, [[4.72, { armR: [40, -120], armL: [40, -120], tilt: 4 }], [5.26, { armR: [160, 10], armL: [70, -110], tilt: -6, lean: -4, hop: 8 }, 0.14], [5.94, { armR: [150, 0], armL: [70, -110], tilt: -4 }, 0.2]]), prop: t < 5.26 ? 'rag' : null, propHand: 'R', face: t < 5.26 ? 'proud' : { eyes: 'closed', mouth: 'smile', brow: 0.6 } }, camPos);
    GOLFERS[1].place(P0.x, 0.05, P0.z - 0.2); GOLFERS[1].update({ e: 1, ...keys(t, [[4.72, { armR: [110, -80], armL: [20, 10], tilt: 6 }], [5.68, { armR: [140, -40], armL: [20, 10], tilt: -6, hop: 10 }, 0.14], [6.4, { armR: [120, -110], armL: [60, -110], tilt: 8 }, 0.18]]), prop: 'gball', face: faceK(t, [[4.72, { eyes: 'lid', lid: 0.2, mouth: 'smile', brow: 0.4, look: [0.6, -0.6] }], [5.68, { eyes: 'wide', mouth: 'grin', brow: 1 }], [6.4, { eyes: 'happy', mouth: 'bigsmile', brow: 0.5 }]]) }, camPos);
    GOLFERS[2].place(P0.x + 1.15, 0.05, P0.z + 0.4); GOLFERS[2].update({ e: 1, ...keys(t, [[4.72, { armL: [20, 10], armR: [96, -110], tilt: 0 }], [5.94, { armL: [20, 10], armR: [70, -150], tilt: 12, lean: 6, bend: 18 }, 0.16], [6.4, { armL: [140, -20], armR: [70, -150], tilt: 14, lean: 8, hop: 6 }, 0.14]]), prop: 'gball', face: t < 5.94 ? 'happy' : { eyes: 'closed', mouth: 'smallO', brow: 0.6 }, blush: t > 5.94 ? 1 : 0 }, camPos); }
  // ---------------- 6.96 - 8.28 mirror ball macro ----------------
  if (W(t, 6.9, 8.32)) { MIRRORB.visible = true; MIRRORB.position.set(PRACT.x + 0.2, 0.05 + 0.05 + 0.075, PRACT.z + 2.4); TEEPEG.visible = true; TEEPEG.position.set(PRACT.x + 0.2, 0.05 + 0.035, PRACT.z + 2.4); MIRRORB.rotation.y = t * 0.6; }
  // ---------------- 8.28 - 10.1 Milo polishes the smoothest ball of all ----------------
  if (W(t, 8.28, 10.12)) { const p = hs(0.3, -1.0); H.place(p.x, 0, p.z);
    const pol = t < 9.22 ? Math.sin(t * 22) : 0; const k = keys(t, [[8.28, { armR: [58 + 6 * pol, -60 + 8 * pol], armL: [40, -96], lean: 6, bend: 14, tilt: 6 }], [9.22, { armR: [150, -10], armL: [40, -96], lean: -6, bend: -16, tilt: -8, hop: 14 }, 0.14], [9.7, { armR: [146, -8], armL: [28, -150], lean: -4, bend: -10, tilt: -4, hop: 0 }, 0.2]]);
    H.update({ e: 1, ...k, armR: t < 9.22 ? [58 + 6 * pol, -60 + 8 * pol] : k.armR, prop: 'gball', face: faceK(t, [[8.28, { eyes: 'lid', lid: 0.35, mouth: 'smile', brow: 0.2, look: [0.5, 0.4] }], [9.22, { eyes: 'wide', mouth: 'grin', brow: 1.0, look: [0.6, -0.8] }], [9.7, { eyes: 'lid', lid: 0.5, squint: 0.15, mouth: 'smirk1', browL: 0.5, browR: 0.1, look: [0, -0.3] }]]) }, camPos); }
  // ---------------- 12.22 - 15.55 the dog chews the whole batch ----------------
  if (W(t, 13.4, 16.3)) FLOORCHEW.forEach((c, i) => { const u = clamp((t - 13.45 - i * 0.03) / 0.7, 0, 1); c.visible = t > 13.4; const h = c.userData.home, to = c.userData.to; c.position.copy(SL(0, 0, 0)).add(h.clone().lerp(to, 1 - (1 - u) ** 2)); c.position.y = 0.075 + Math.abs(Math.sin(u * Math.PI * 2.5)) * 0.25 * (1 - u); c.rotation.z = -u * 8; });
  if (W(t, 12.22, 15.55)) {
    if (t < 13.72) { const walk = t < 12.54; const x = walk ? lerp(-0.6, 1.7, sstep(12.22, 12.54, t)) : 1.75; DOG.place(SL(x, 0, 0.08).x, 0, SL(0, 0, 0.08).z);
      const ch = walk ? 0 : Math.max(0, Math.sin((t - 12.54) * 21)); DOG.update({ t, walk: t * 14, amp: walk ? 26 : 0, wag: 16, chew: ch, tilt: walk ? 0 : 18 + 8 * ch, hop: walk ? 10 * Math.abs(Math.sin(t * 14)) : 0, squash: walk ? 0 : 0.06 * ch, eyes: walk ? 'open' : (ch > 0.5 ? 'closed' : 'happy'), ball: !walk && t > 12.7, flip: true, look: [1, 0.3] }, camPos); }
    else { DOG.place(SL(1.2, 0, 0.2).x, 0.045, SL(0, 0, 0.2).z); const spit = t > 15.0; const ch = t < 14.66 ? Math.max(0, Math.sin((t - 13.72) * 18)) * 0.6 : t < 15.0 ? Math.max(0, Math.sin((t - 14.66) * 24)) : 0;
      DOG.update({ t, lie: 1, wag: 18, chew: spit ? 0.9 * Math.exp(-(t - 15.0) * 6) : ch, tilt: spit ? -10 : 10, eyes: t > 15.22 ? 'happy' : (ch > 0.4 ? 'closed' : 'open'), tongue: t > 15.22 ? 1 : 0, ball: !spit, flip: true, look: [0.6, 0.6] }, camPos); }
    if (t > 15.0) { END1.visible = true; const u = clamp((t - 15.0) / 0.25, 0, 1); END1.position.copy(SL(1.0 - 0.6 * u, 0, 0.4 + 0.9 * u)).add(V(0, 0.07 + 0.35 * Math.sin(u * Math.PI) * (t < 15.25 ? 1 : 0) + (t > 15.25 ? 0.12 * Math.abs(Math.sin((t - 15.25) * 14)) * Math.exp(-(t - 15.25) * 5) : 0), 0)); END1.rotation.z = -u * 6; } }
  // ---------------- 15.55 - 16.3 "Ruined." ----------------
  if (W(t, 15.55, 16.3)) { const p = hs(2.9, -1.5); H.place(p.x, 0, p.z);
    const k = keys(t, [[15.55, { armR: [120, -10], armL: [20, 10], lean: 0, tilt: 0 }], [15.82, { armR: [130, -6], armL: [60, -20], lean: -8, bend: -24, tilt: -6, hop: 18, hatOff: 40 }, 0.08, 'back'], [16.0, { armR: [30, 10], armL: [20, 10], lean: 10, bend: 26, tilt: 14, kneel: 0.08 }, 0.22]]);
    H.update({ e: 1, ...k, prop: 'lantern', face: faceK(t, [[15.55, { eyes: 'lid', lid: 0.55, mouth: 'line', brow: 0 }], [15.82, { eyes: 'tiny', mouth: 'scream', brow: 1.5 }], [16.0, { eyes: 'lid', lid: 0.5, lidTilt: 0.5, mouth: 'wobble', brow: 1.2, look: [0, 0.8] }]], 0.08), noBlink: true }, camPos); }
  // ---------------- 16.3 - 19.0 Gus laughs so hard he falls off his cart ----------------
  CART.visible = W(t, 16.3, 19.0) || W(t, 21.05, 22.62) || W(t, 27.55, 28.56);
  if (W(t, 16.3, 19.0)) { const cx = lerp(-4.2, -1.2, sstep(16.3, 16.85, t)) + (t > 18.3 ? (t - 18.3) * 1.6 : 0); CART.position.copy(SL(cx, 0, 5.6)); CART.rotation.set(0, 0, t < 16.85 ? 0 : -0.035 * Math.sin(sstep(16.85, 17.1, t) * Math.PI)); CART.updateMatrixWorld(true);
    CART.userData.wheels.forEach((w) => (w.rotation.z = -cx / 0.245)); const seat = CART.localToWorld(V(-0.27, 0.22, 0.26));
    if (t < 17.96) { G.place(seat.x, seat.y, seat.z); const lau = t > 16.98 ? Math.abs(Math.sin((t - 16.98) * 13)) : 0; const prof = t >= 16.76 && t < 17.5;
      const k = keys(t, [[16.3, { armL: [70, -40], armR: [70, -40], lean: 0, tilt: 0, side: 0, turn: 0 }], [16.76, { armL: [40, -20], armR: [100, -60], lean: -8, tilt: -6, bend: -12, side: 1, turn: 1 }, 0.12, 'back'],
        [16.98, { armL: [40, -120], armR: [40, -120], lean: -8, tilt: -18, bend: -14, side: 1, turn: 1, hop: 8 }, 0.1, 'back'], [17.5, { armL: [40, -120], armR: [96, -12], lean: 8, tilt: 12, bend: 18, side: 0, turn: 0 }, 0.12, 'back'], [17.7, { armL: [150, -30], armR: [96, -12], lean: 14, tilt: 18, bend: 30, side: 0, turn: 0 }, 0.12, 'back']]);
      G.update({ e: 1, ...k, sit: 1, bob: -lau * 10, squash: lau * 0.05, headLag: (prof ? -8 : -10) * lau, hatOff: lau * 18, tears: t > 17.56, face: t < 16.98 ? faceK(t, [[16.3, 'smug'], [16.76, { eyes: 'lid', lid: 0.4, lidTilt: -0.3, mouth: 'psycho', brow: -0.9 }]]) : { eyes: 'squeeze', mouth: 'laugh', brow: 0.4 } }, camPos); }
    else { const u = clamp((t - 17.96) / 0.26, 0, 1); const g0 = SL(-0.6, 0, 7.4); G.place(lerp(seat.x, g0.x, u), lerp(seat.y, 0.02, u) + Math.sin(u * Math.PI) * 0.7, lerp(seat.z, g0.z, u)); const lau = Math.abs(Math.sin((t - 17.96) * 13)); const kick = Math.sin(t * 16);
      G.update({ e: 1, armL: [60 + 40 * lau, -110], armR: [60 + 40 * lau, -110], legL: [-70 + 30 * kick, -80], legR: [-50 - 30 * kick, -70], bob: -lau * 8, tears: true, face: u < 1 && t < 18.2 ? { eyes: 'tiny', mouth: 'scream', brow: 1.3 } : { eyes: 'squeeze', mouth: 'laugh', brow: 0.5 }, hatOff: 40 }, camPos);
      G.mesh.rotation.z = lerp(0, 1.45, u); G.mesh.position.y += 0.34 * u; if (G.shadow) G.shadow.scale.set(2.2, 1, 1); } }
  // ---------------- 19.0 - 21.05 ...then buys every smooth ball left in town ----------------
  PROBOXES.forEach((b, i) => { b.visible = !(t >= 19.28 && t < 21.05 && t > 19.28 + i * 0.022 + 0.25) || t >= 21.05; b.position.copy(b.userData.home); });
  REGDRAWER.position.x = t >= 20.04 && t < 21.05 ? 0.28 * sstep(20.04, 20.1, t) : 0;
  if (W(t, 19.0, 21.05)) { const gp = PRO.clone().add(V(2.2, 0, -0.6)); G.place(gp.x, 0, gp.z); KEEP.place(PRO.x + 1.95, 0, PRO.z + 1.75);
    const sweep = t >= 19.28 && t < 20.04 ? Math.sin((t - 19.28) * 14) : 0;
    const k = keys(t, [[19.0, { armR: [60, -40], armL: [30, 10], lean: 0, tilt: 0 }], [19.02, { armR: [100, -10], armL: [30, 10], lean: 10, bend: 24, tilt: 6, hop: 10 }, 0.1, 'back'], [19.28, { armR: [130, -20], armL: [70, -60], lean: 6, bend: 18, tilt: -4 }, 0.12], [20.04, { armR: [60, -120], armL: [60, -120], lean: -6, bend: -16, tilt: -8, hop: 12 }, 0.14, 'back'], [20.3, { armR: [60, -130], armL: [60, -130], lean: -4, tilt: 10, hop: 0 }, 0.18]]);
    G.update({ e: 1, ...k, armR: sweep ? [120 + 30 * sweep, -20 - 20 * sweep] : k.armR, prop: t < 19.28 ? 'wallet' : t < 20.04 ? null : 'sack', propHand: t < 20.04 ? 'R' : 'L', flip: false, face: faceK(t, [[19.0, 'smug'], [19.02, { eyes: 'lid', lid: 0.35, mouth: 'grin', brow: -0.8 }], [19.28, { eyes: 'lid', lid: 0.2, mouth: 'psycho', brow: -0.9, look: [-1, 0] }], [20.04, { eyes: 'squeeze', mouth: 'laugh', brow: 0.3 }], [20.3, { eyes: 'lid', lid: 0.45, lidTilt: -0.3, mouth: 'grin', brow: -1.0, look: [0, 0] }]]) }, camPos);
    KEEP.update({ e: 1, ...keys(t, [[19.0, { armL: [20, 10], armR: [20, 10] }], [19.28, { armL: [60, -20], armR: [60, -20], hop: 14, lean: -6 }, 0.1, 'back'], [20.04, { armL: [150, -20], armR: [150, -20], hop: 6 }, 0.12, 'back']]), face: t < 19.28 ? 'happy' : t < 20.04 ? 'shock' : { eyes: 'wide', mouth: 'smallO', brow: 1.4 } }, camPos);
    // boxes fly from the shelves into the sack
    PROBOXES.forEach((b, i) => { const t0 = 19.28 + i * 0.022; if (t > t0 && t < t0 + 0.25) { const u = (t - t0) / 0.25; const dst = PRO.clone().add(V(2.0, 0.9, -0.2)).sub(PRO); b.position.copy(b.userData.home).lerp(dst, u); b.position.y += Math.sin(u * Math.PI) * 0.8; b.visible = true; } }); }
  // ---------------- 21.05 - 22.62 tournament day: "So Milo has no choice." ----------------
  if (W(t, 21.05, 22.62)) { const z = lerp(5, 2.2, sstep(21.05, 21.66, t)); H.place(1.4, 0.14, z);
    const walking = t < 21.66; H.update({ e: 1, ...(walking ? mo('17_06f', t, { t0: 21.05, from: 2.2, amp: 1.2, root: 0 }) : keys(t, [[21.66, { armL: [30, 10], armR: [96, -96], lean: 4, tilt: 6, bend: 10, squash: 0.05 }, 0.2], [22.06, { armL: [30, 10], armR: [100, -104], lean: 10, tilt: 12, bend: 22, kneel: 0.05 }, 0.2]])), prop: walking ? 'club' : 'gball', propHand: walking ? 'L' : 'R', face: walking ? 'determined' : faceK(t, [[21.66, { eyes: 'lid', lid: 0.4, mouth: 'flat', brow: 0.4, look: [0.6, 0.5] }], [22.06, { eyes: 'lid', lid: 0.55, lidTilt: 0.4, mouth: 'wobble', brow: 0.9, look: [0.7, 0.7] }]]) }, camPos);
    G.place(-1.6, 0.14, -1.4); G.update({ e: 1, ...act(t, [[21.05, 'crossArms']]), face: 'smug' }, camPos); CART.position.set(-3.6, 0, -3); CART.rotation.set(0, 0.5, 0); }
  // ---------------- 22.62 - 23.88 he tees up a chewed-up ball ----------------
  if (W(t, 22.62, 23.88)) { H.place(-0.35, 0.14, 0); const placed = t > 22.86;
    H.update({ e: 1, ...keys(t, [[22.62, { armR: [10, 4], armL: [20, 10], kneel: 0.4, lean: 22, bend: 30, tilt: 10 }, 0.15], [22.86, { armR: [24, 4], armL: [20, 10], kneel: 0.3, lean: 16, bend: 20, tilt: 6, hop: 0 }, 0.18], [23.12, { armR: [60, -30], armL: [20, 10], kneel: 0, lean: -4, bend: -8, tilt: -6, hop: 8 }, 0.16, 'back']]), prop: placed ? null : 'gball', face: faceK(t, [[22.62, { eyes: 'lid', lid: 0.3, mouth: 'flat', brow: -0.2, look: [0.3, 1] }], [23.12, { eyes: 'lid', lid: 0.2, mouth: 'smile', brow: 0.4, look: [1, 0] }]]) }, camPos);
    if (placed) { TEEBALL.visible = TEEPEG.visible = true; TEEPEG.position.set(0.32, 0.14 + 0.035, 0.05); const w = t > 23.12 ? Math.sin((t - 23.12) * 18) * Math.exp(-(t - 23.12) * 3) : 0; TEEBALL.position.set(0.32, 0.14 + 0.07 + 0.075 + Math.abs(Math.sin((t - 22.86) * 12)) * 0.06 * Math.exp(-(t - 22.86) * 5), 0.05); TEEBALL.rotation.set(w * 0.4, 0, w * 0.5); } }
  // tournament crowd (grandstand) + Gus watching
  const TOUR = t >= 21.05 && t < 32.24;
  if (TOUR) CROWD.forEach((c, i) => { const tier = i % 4, row = Math.floor(i / 4); c.place(-9 - tier * 1.3 + 0.3, 0.5 + tier * 0.5, -5.2 + row * 3.0 + (tier % 2) * 1.4);
    const dl = (i * 0.071) % 0.3, cheer = t >= 26.4 + dl && t < 28.6, gasp = t >= 22.86 + dl && t < 23.9, bonk = t >= 31.82 + dl, look = t >= 29.4 && t < 31.82;
    const CH = ['cheer', 'wave', 'thumbsUp', 'laughPoint', 'clap', 'cheer', 'clap'][i % 7], GA = ['shock', 'facepalm', 'panic', 'shock', 'facepalm'][i % 5], ID = ['idle', 'crossArms', 'hips', 'think', 'idle', 'hips'][i % 6];
    const clap = { armL: [34, -100 + 26 * Math.sin(t * 19 + i)], armR: [34, -100 + 26 * Math.sin(t * 19 + i)] };
    const pose = cheer ? (CH === 'clap' ? clap : act(t + i * 0.13, [[0, CH]])) : gasp ? act(t, [[0, GA]]) : bonk ? (i % 3 ? act(t + i * 0.1, [[0, 'laughPoint']]) : act(t, [[0, 'facepalm']])) : look ? { armL: [20, 10], armR: i % 2 ? [150, -20] : [20, 10] } : act(t + i, [[0, ID]]);
    c.update({ ...pose, hop: cheer ? (5 + (i % 3) * 6) * Math.abs(Math.sin(t * (7 + (i % 4)) + i)) : bonk ? 4 * Math.abs(Math.sin(t * 12 + i)) : 0, tilt: cheer ? 6 * Math.sin(t * 5 + i) : 0,
      face: cheer ? ['laugh', 'awe', 'happy', 'grin', { eyes: 'happy', mouth: 'laugh' }][i % 5] : gasp ? ['shock', 'scared', 'panic', 'worried'][i % 4] : bonk ? (i % 3 ? 'laugh' : { eyes: 'squeeze', mouth: 'scream' }) : look ? { eyes: 'lid', lid: 0.1, look: [0, -1], mouth: 'smallO', brow: 0.6 } : ['happy', 'neutral', 'calm', 'smug', 'happy'][i % 5] }, camPos); });
  // ---------------- 23.88 - 25.5 "Does he know what he's doing? ... Not really." ----------------
  if (W(t, 23.88, 25.5)) { H.place(-0.35, 0.14, 0); TEEBALL.visible = TEEPEG.visible = true; TEEPEG.position.set(0.32, 0.175, 0.05); TEEBALL.position.set(0.32, 0.285, 0.05);
    const k = keys(t, [[23.88, { armL: [-40, 40], lean: -6, tilt: -4, side: 1, turn: 1 }], [24.24, { armL: [-40, 40], lean: -10, tilt: -8, bend: -10, side: 1, turn: 1 }, 0.16], [24.52, { armL: [-40, 40], lean: -4, tilt: 4, side: 1, turn: 0.9 }, 0.14], [24.96, { armL: [-40, 40], lean: 0, tilt: 10, bend: 8, hop: 6, side: 0, turn: -0.15 }, 0.1, 'back'], [25.08, { armL: [-30, 40], armR: [120, -130], lean: -4, tilt: 14, hop: 14, squash: 0.04, side: 0, turn: -0.1 }, 0.12, 'back']]);
    const F = t < 24.96 ? faceK(t, [[23.88, { eyes: 'lid', lid: 0.32, lidTilt: -0.25, squint: 0.15, mouth: 'flat', brow: -0.8 }], [24.24, { eyes: 'lid', lidL: 0.45, lidR: 0.1, mouth: 'smirk1', browL: -0.6, browR: 0.7, look: [1, 0] }], [24.52, { eyes: 'stare', mouth: 'psycho', brow: 0.3, look: [1, 0] }]]) : { eyes: 'lid', lid: 0.35, look: [-0.9, -0.2], mouth: t < 25.45 ? lip(t) : 'wobble', lip: true, brow: 1.0 };
    H.update({ e: 1, ...k, grip: t < 25.08 ? 'L' : undefined, propHand: 'L', prop: 'club', face: F, sweat: t > 25.08 ? (t - 25.08) * 3 : 0, noBlink: t > 24.9 }, camPos); }
  // ---------------- 25.5 - 26.34 THE SWING ----------------
  if (W(t, 25.5, 26.34)) { H.place(-0.35, 0.14, 0); TEEPEG.visible = true; TEEPEG.position.set(0.32, 0.175, 0.05);
    const ADD = { armL: [-40, 40], lean: 4, bend: 0, tilt: 4 }, TOP = { armL: [130, 60], lean: -8, bend: -26, tilt: -8, hatOff: 10 }, IMP = { armL: [-35, 38], lean: 8, bend: 22, tilt: 6, squash: 0.06 };
    const imp = 25.92; const pre = t < imp;
    const k = pre ? keys(t, [[25.5, ADD], [25.56, TOP, 0.26, 'out'], [25.84, IMP, 0.08, 'in']]) : keys(t, [[imp, { armR: [-35, 38], lean: 8, bend: 22, tilt: 6 }], [imp + 0.01, { armR: [140, 60], lean: 10, bend: 32, tilt: 12, hatOff: 24, hop: 10 }, 0.16, 'back']]);
    H.update({ e: 1, ...k, grip: pre ? 'L' : true, propHand: pre ? 'L' : 'R', prop: 'club', propBack: !pre, whoosh: t > 25.8 && t < 26.15 ? [200, -20, 0.9 * (1 - (t - 25.8) / 0.35)] : null, face: pre ? { eyes: 'lid', lid: 0.3, lidTilt: -0.3, mouth: 'flat', brow: -1.0 } : faceK(t, [[imp, { eyes: 'squeeze', mouth: 'grin', brow: -0.5 }], [26.1, { eyes: 'stare', mouth: 'psycho', brow: 0.3, look: [-1, -0.6] }]]), noBlink: true }, camPos);
    if (t < imp) { TEEBALL.visible = true; TEEBALL.position.set(0.32, 0.285, 0.05); } else { TEEBALL.visible = true; const u = (t - imp) / 1.6; TEEBALL.position.copy(DRIVE(Math.min(1, u * 0.9))); } }
  // ---------------- 26.34 - 27.55 it flies twice as far as anyone has ever hit ----------------
  if (W(t, 26.34, 27.6)) { const u = clamp((t - 25.92) / 1.68, 0, 1); TEEBALL.visible = true; TEEBALL.position.copy(DRIVE(u)); TEEBALL.rotation.x = -t * 30; TEEBALL.scale.setScalar(0.075 * 2.2);
    TRAIL.visible = true; const ps = []; for (let j = 0; j <= 30; j++) ps.push(DRIVE(Math.max(0, u - 0.3 + 0.3 * j / 30))); tube(TRAIL, ps, 0.45); GLOW.visible = true; GLOW.position.copy(TEEBALL.position); GLOW.scale.setScalar(5); } else TEEBALL.scale.setScalar(0.075);
  // ---------------- 27.55 - 28.56 the crowd goes wild, Gus's jaw drops ----------------
  if (W(t, 27.55, 28.56)) { G.place(-3.0, 0.14, -0.6); G.update({ e: 1, ...keys(t, [[27.55, { armL: [20, 10], armR: [20, 10], lean: 0 }], [27.8, { armL: [60, 20], armR: [60, 20], lean: -10, bend: -22, tilt: -8, hop: 20, hatOff: 70 }, 0.1, 'back'], [28.3, { armL: [30, 10], armR: [30, 10], lean: -4, tilt: -4, hop: 0, hatOff: 50 }, 0.2]]), face: faceK(t, [[27.55, { eyes: 'lid', lid: 0.4, mouth: 'smirk1', brow: -0.4, look: [1, -0.6] }], [27.8, { eyes: 'tiny', mouth: 'scream', brow: 1.6 }], [28.3, { eyes: 'wide', mouth: 'scream', brow: 1.4 }]], 0.08), noBlink: true }, camPos);
    CART.position.set(-5.4, 0, -2.4); CART.rotation.set(0, 0.4, 0); }
  // ---------------- 28.56 - 29.55 Gus swings his mirror ball ----------------
  if (W(t, 28.56, 29.55)) { G.place(-0.35, 0.14, 0); TEEPEG.visible = true; TEEPEG.position.set(0.32, 0.175, 0.05);
    const imp = 29.3, pre = t < imp; const pol = t < 28.94 ? Math.sin(t * 26) : 0;
    const k = t < 28.94 ? { armL: [40 + 6 * pol, -100 + 8 * pol], armR: [60, -100], lean: 6, bend: 10, tilt: 8 } : pre ? keys(t, [[28.94, { armL: [-40, 40], lean: 4, tilt: 4 }, 0.1], [29.0, { armL: [150, 80], lean: -10, bend: -30, tilt: -10, hatOff: 14 }, 0.24, 'out'], [29.24, { armL: [-35, 38], lean: 10, bend: 24, tilt: 6 }, 0.06, 'in']]) : keys(t, [[imp, { armR: [-35, 38], lean: 10, bend: 24 }], [imp + 0.01, { armR: [150, 70], lean: 12, bend: 36, tilt: 14, hatOff: 30, hop: 14 }, 0.14, 'back']]);
    G.update({ e: 1, ...k, grip: t < 28.94 ? undefined : pre ? 'L' : true, propHand: t < 28.94 ? 'L' : pre ? 'L' : 'R', prop: t < 28.94 ? 'rag' : 'club', propBack: !pre, whoosh: t > 29.2 && t < 29.5 ? [200, -20, 0.9] : null, face: t < 28.94 ? { eyes: 'lid', lid: 0.45, mouth: 'smirk1', browL: 0.6, browR: -0.2, look: [0.6, 0.8] } : pre ? 'evil' : { eyes: 'squeeze', mouth: 'grin', brow: -0.8 } }, camPos);
    GUSBALL.visible = true; if (pre) GUSBALL.position.set(0.32, 0.285, 0.05); else GUSBALL.position.copy(GUSUP(t)); }
  // ---------------- 29.55 - 30.52 the mirror ball rockets up, gleaming ----------------
  if (W(t, 29.55, 30.52)) { GUSBALL.visible = true; GUSBALL.position.copy(GUSUP(t)); GUSBALL.scale.setScalar(0.075 * 8); TRAIL.visible = true; const ps = []; for (let j = 0; j <= 16; j++) ps.push(GUSUP(t - 0.35 + 0.35 * j / 16)); tube(TRAIL, ps, 0.3); GLOW.visible = true; GLOW.position.copy(GUSBALL.position); GLOW.scale.setScalar(4); }
  else GUSBALL.scale.setScalar(0.075);
  // ---------------- 30.52 - 32.24 ...it drops out of the sky like a brick (on his head) ----------------
  if (W(t, 30.52, 32.24)) { G.place(-0.35, 0.14, 0); const fall = clamp((t - 31.15) / 0.67, 0, 1); const top = GUSUP(30.6); const head = G.headWorld().add(V(0, 0.45, 0)); const bonk = t >= 31.82;
    GUSBALL.visible = true; GUSBALL.scale.setScalar(t < 31.25 ? 0.075 * 8 : 0.075 * 1.6); if (t < 31.25) { GLOW.visible = true; GLOW.position.copy(GUSBALL.position); GLOW.scale.setScalar(3.2); } if (t < 31.15) GUSBALL.position.copy(top).add(V(0, 0.4 * Math.sin((t - 30.52) * 3), 0)); else if (t < 31.25) GUSBALL.position.copy(top).add(V(0, -6 * ((t - 31.15) / 0.1) ** 2, 0)); else if (!bonk) { const q = clamp((t - 31.25) / 0.57, 0, 1); GUSBALL.position.copy(head).add(V(0, lerp(3.4, 0, q * q), 0)); } else { const d = t - 31.82; GUSBALL.position.copy(head).add(V(0.5 * d * 3, 0.5 * Math.sin(Math.min(1, d * 2.5) * Math.PI) - d * 0.8, 0.4 * d * 3)); if (GUSBALL.position.y < 0.2) GUSBALL.position.y = 0.2; }
    const k = keys(t, [[30.52, { armR: [150, 70], armL: [20, 10], lean: 4, tilt: -14 }], [30.64, { armR: [150, -60], armL: [20, 10], lean: -4, tilt: -18, bend: -10 }, 0.16], [31.4, { armR: [60, -20], armL: [60, -20], lean: -2, tilt: -22, bend: -6 }, 0.12, 'back'], [31.82, { armR: [70, 30], armL: [70, 30], lean: 0, tilt: 10, squash: 0.18, kneel: 0.12, hatOff: -20 }, 0.06, 'in'], [32.0, { armR: [40, 20], armL: [40, 20], tilt: 0, squash: 0, kneel: 0.05, sway: 0 }, 0.2]]);
    G.update({ e: 1, ...k, sway: bonk ? 7 * Math.sin((t - 31.82) * 9) : 0, prop: t < 30.64 ? 'club' : null, propBack: true, face: faceK(t, [[30.52, { eyes: 'lid', lid: 0.4, mouth: 'smirk1', brow: 0.3, look: [0, -1] }], [30.84, { eyes: 'lid', lid: 0.1, mouth: 'smallO', brow: 0.8, look: [0, -1] }], [31.4, { eyes: 'tiny', mouth: 'scream', brow: 1.6, look: [0, -1] }], [31.82, { eyes: 'squeeze', mouth: 'wobble', brow: 0.6 }], [31.98, { eyes: 'tiny', mouth: 'wobble', brow: 0.9 }]], 0.06), noBlink: true }, camPos);
    if (bonk) DAZE.forEach((s, i) => { const a = (t - 31.82) * 7 + i * (Math.PI * 2 / 5); const c = G.headWorld().add(V(0, 0.42, 0)); s.visible = true; s.position.set(c.x + Math.cos(a) * 0.32, c.y + Math.sin(a) * 0.08, c.z + Math.sin(a) * 0.32); s.scale.setScalar(0.16); }); }
  // ---------------- SCIENCE 32.24 - 45.22 ----------------
  if (SCI(t)) sciSetup(t, camPos);
  // ---------------- 45.22 - 46.76 Gus tried polishing harder ----------------
  if (W(t, 45.22, 46.76)) { G.place(PRACT.x + 0.5, 0.05, PRACT.z + 1.0); const pol = Math.sin(t * (t > 45.64 ? 34 : 20));
    G.update({ e: 1, armL: [60 + 10 * pol, -110 + 12 * pol], armR: [70, -118], lean: 8 + 3 * pol, tilt: 6 + 4 * pol, bend: 12 + 6 * pol, side: t < 46.0 ? 1 : 0, turn: t < 46.0 ? -1 : 0, bob: 4 * Math.abs(pol), hatOff: 6 * Math.abs(pol), prop: 'rag', propHand: 'L', steam: t > 45.64 ? 1 : 0, sweat: t * 2, face: faceK(t, [[45.22, { eyes: 'lid', lid: 0.3, lidTilt: -0.4, mouth: 'flat', brow: -1.2, look: [0.4, 0.8] }], [45.64, { eyes: 'lid', lid: 0.25, lidTilt: -0.5, mouth: 'talk', brow: -1.5, look: [0.4, 0.8] }], [46.08, { eyes: 'squeeze', mouth: 'scream', brow: -1.2 }]]), noBlink: true }, camPos);
    GUSBALL.visible = true; GUSBALL.scale.setScalar(0.075 * 1.3); const hp = G.toWorld(G.propPt(G.handL, 0, 20)); GUSBALL.position.copy(hp).add(V().subVectors(camPos, hp).setY(0).normalize().multiplyScalar(0.12)); }
  // ---------------- 46.76 - 48.25 Milo just bought another dog ----------------
  if (t >= 46.76) { const p = hs(0.2, 0.2); H.place(p.x, 0, p.z);
    H.update({ e: 1, ...keys(t, [[46.76, { armL: [30, 10], armR: [150, -20], tilt: 0, lean: 0 }], [47.16, { armL: [130, -10], armR: [150, -20], tilt: -8, lean: -6, hop: 14, bend: -10 }, 0.12, 'back'], [47.68, { armL: [40, -110], armR: [40, -110], tilt: 10, lean: 6, bend: 12, hop: 0 }, 0.14, 'back']]), prop: 'trophy', face: faceK(t, [[46.76, { eyes: 'happy', mouth: 'bigsmile', brow: 0.5 }], [47.16, { eyes: 'stare', mouth: 'psycho', brow: 0.4 }], [47.68, { eyes: 'lid', lidL: 0.5, lidR: 0.06, squint: 0.2, mouth: 'grin', browL: -0.6, browR: 0.8, look: [0, 0] }]]), noBlink: true }, camPos);
    DOG.place(SL(-0.3, 0, 1.0).x, 0.045, SL(0, 0, 1.0).z); const c1 = Math.max(0, Math.sin(t * 19)); DOG.update({ t, lie: 1, wag: 18, chew: c1, tilt: 14, eyes: c1 > 0.5 ? 'closed' : 'happy', ball: true }, camPos);
    const inn = sstep(47.16, 47.5, t); DOG2.place(SL(lerp(2.4, 0.85, inn), 0, 1.05).x, inn > 0.6 ? 0.045 : 0, SL(0, 0, 1.05).z); const c2 = t > 47.68 ? Math.max(0, Math.sin(t * 21 + 1)) : 0;
    DOG2.update({ t, walk: t * 14, amp: t < 47.5 ? 26 : 0, hop: t < 47.5 ? 12 * Math.abs(Math.sin(t * 14)) : 0, lie: t > 47.6 ? 1 : 0, wag: 20, chew: c2, tilt: t > 47.68 ? 14 : 0, eyes: c2 > 0.5 ? 'closed' : 'happy', ball: t > 47.68, flip: false, tongue: t < 47.68 ? 1 : 0 }, camPos); }
}
// the airflow explainer
function sciSetup(t, camPos) {
  const phase = t < 36.18 ? 'generic' : t < 39.98 ? 'smooth' : 'dimple'; const race = t >= 43.66;
  FLOW.visible = !race; RACE.visible = race; SCIG.position.copy(sciPos(t));
  for (const [k, m] of Object.entries(SBALL)) { m.visible = k === phase; m.rotation.x = -t * 2; }
  SCI_CLOUDS.forEach((s, i) => { const r = rng(i * 7 + 1); const span = 70; const z = ((r() * span + (t - 32) * 14) % span) - span / 2; s.position.set(-40 - r() * 30, -20 + r() * 34, z * 2); s.scale.set(14, 7, 1); });
  // separation angle (deg from the nose) + wake growth; "peels away early" / "hugs the ball longer"
  let sep = 105, wd = 0.05; if (phase === 'smooth') { sep = lerp(105, 84, sstep(37.22, 37.76, t)); wd = lerp(0.05, 0.16, sstep(37.22, 37.9, t)); } if (phase === 'dimple') { sep = lerp(105, 132, sstep(41.2, 41.8, t)); wd = lerp(0.05, -0.05, sstep(41.2, 41.9, t)); }
  if (!race) { buildFlow(Math.round(sep * 2) / 2, Math.round(wd * 200) / 200); LINES.forEach((m) => { m.material.alphaMap.offset.x = -t * 8; });
    const hw = (X) => (phase === 'smooth' ? 1.35 : phase === 'dimple' ? 0.75 : 1.05) * (phase === 'smooth' ? lerp(0.8, 1.25, sstep(37.22, 37.9, t)) : phase === 'dimple' ? lerp(1.35, 0.85, sstep(41.2, 41.9, t)) : 1) + 0.08 * -X;
    SWIRLS.forEach((m, i) => { const X = -(1.7 + ((i * 1.15 + (t * 1.6) % 1.15) % (7 * 1.15))); const s = i % 2 ? -1 : 1; const h = hw(X); m.position.copy(L2(X, s * h * 0.42)); m.scale.setScalar(h * 0.42 * RB); m.rotation.x = s * t * 5; m.material.opacity = 0.75 * clamp((X + 9) / 2, 0, 1); });
    HAZE.position.copy(L2(-4.2, 0)); HAZE.scale.set(9 * RB, hw(-4) * 2.3 * RB, 1); HAZE.material.opacity = 0.9;
    CURLS.forEach((m, i) => { m.visible = phase === 'dimple' && t > 40.18; const s = i % 2 ? 1 : -1, a = ((50 + (i >> 1) * 22) * Math.PI) / 180; m.position.copy(L2(Math.cos(a) * 1.07, s * Math.sin(a) * 1.07)); m.scale.setScalar(0.09 * RB); m.rotation.x = s * t * 14; });
    SEPDOT.forEach(([m, s]) => { const a = (sep * Math.PI) / 180, on = (phase === 'smooth' && t > 37.1) || (phase === 'dimple' && t > 41.3); m.visible = on; m.position.copy(L2(Math.cos(a) * 1.12, s * Math.sin(a) * 1.12)); m.scale.setScalar(1 + 0.35 * Math.sin(t * 12)); });
    // parachute: pops at "parachute" (35.58), HUGE at "huge" (39.12), shrinks at "shrinks" (43.04)
    const back = (a, d, x) => { const u = clamp((x - a) / d, 0, 1); const c = 1.7; return u <= 0 ? 0 : 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2; };
    let Rc = 0, Ltt = 2.2; if (phase === 'generic') Rc = 1.5 * back(35.58, 0.3, t); else if (phase === 'smooth') { Rc = lerp(1.5, 3.0, back(39.12, 0.3, t)); Ltt = lerp(2.2, 2.8, sstep(39.1, 39.4, t)); } else { Rc = lerp(1.5, 0.75, back(43.04, 0.3, t)); Ltt = lerp(2.2, 1.6, sstep(43.0, 43.3, t)); }
    setChute(CHUTE, Rc, Ltt, t); }
  else { setChute(CHUTE_G, 3.0, 2.8, t); setChute(CHUTE_M, 0.75, 1.6, t); const u = sstep(43.66, 45.2, t); RACE_G.position.set(0, -1.9, 2.6 + u * 1.5); RACE_M.position.set(0, 1.9, -1.6 - u * 2.5 - (t > 44.34 ? (t - 44.34) ** 2 * 9 : 0)); RACE_G.children[0].rotation.x = -t * 2; RACE_M.children[0].rotation.x = -t * 4; }
  SCIG.updateMatrixWorld(true);
  // riders: Gus on the mirror ball, Milo on the dimpled ball
  const H = MILO, G = GUS; const ride = (P, grp, pose) => { const c = grp.localToWorld(V(0, 0, 0)); P.place(c.x, c.y + RB * 0.95 - 0.74, c.z); P.update({ e: 1, kneel: 0.25, legOut: 30, ...pose }, camPos); P.mesh.scale.setScalar(1.45); P.mesh.material.depthTest = false; P.mesh.renderOrder = 30; if (P.shadow) P.shadow.visible = false; };
  if (phase === 'smooth' && !race) ride(G, SBALL.smooth, { ...keys(t, [[36.18, { armL: [130, -30], armR: [40, -120], lean: 0, tilt: -6 }], [36.42, { armL: [150, -20], armR: [40, -120], lean: -4, tilt: -8, hop: 10 }, 0.14, 'back'], [37.22, { armL: [60, -30], armR: [60, -30], lean: 6, tilt: 10, hop: 0 }, 0.16], [39.12, { armL: [150, 30], armR: [150, 30], lean: -24, bend: -40, tilt: -20, hatOff: 120, hop: 20 }, 0.1, 'back']]), face: faceK(t, [[36.18, 'smug'], [36.42, { eyes: 'lid', lid: 0.35, mouth: 'grin', brow: -0.6 }], [37.22, { eyes: 'wide', mouth: 'smallO', brow: 1.0, look: [-1, 0.3] }], [38.42, { eyes: 'lid', lid: 0.2, lidTilt: 0.4, mouth: 'wobble', brow: 1.2, look: [-1, 0.4] }], [39.12, { eyes: 'tiny', mouth: 'scream', brow: 1.6 }]], 0.1), lines: t > 39.12 ? 1 : 0, noBlink: true });
  if (phase === 'dimple' && !race) ride(H, SBALL.dimple, { ...keys(t, [[39.98, { armL: [150, -10], armR: [150, -10], lean: 0, tilt: 0 }], [40.18, { armL: [160, -30], armR: [40, -120], lean: -4, tilt: -8, hop: 12 }, 0.14, 'back'], [41.42, { armL: [100, -70], armR: [100, -70], lean: 6, tilt: 8, hop: 0 }, 0.16], [43.04, { armL: [165, -20], armR: [40, -120], lean: -6, tilt: -10, hop: 16 }, 0.12, 'back']]), face: faceK(t, [[39.98, { eyes: 'stare', mouth: 'psycho', brow: 0.3 }], [40.18, { eyes: 'happy', mouth: 'grin', brow: 0.5 }], [41.42, { eyes: 'lid', lid: 0.3, mouth: 'smile', brow: 0.3, look: [-1, 0.4] }], [43.04, { eyes: 'squeeze', mouth: 'laugh', brow: 0.5 }]]), noBlink: true });
  if (race) { ride(G, RACE_G, { armL: [150, 30], armR: [150, 30], lean: -20, tilt: -16, hatOff: 100, face: 'panic', lines: 1 }); ride(H, RACE_M, { ...keys(t, [[43.66, { armL: [160, -20], armR: [40, -120], tilt: -6 }], [44.34, { armL: [170, -10], armR: [170, -10], tilt: 8, hop: 14 }, 0.12, 'back']]), face: t < 44.34 ? 'grin' : { eyes: 'squeeze', mouth: 'laugh', brow: 0.6 }, lines: 1 }); }
}
function fx(t) {
  const hb = HOOKBALL.position; B.tink.update(t, 0.4, hb, 0, t > 0.4 && t < 1.3); B.tink2.update(t, 0.97, hb, 0, t > 0.97 && t < 1.3);
  B.shine.update(t, 1.98, () => MILO.toWorld(MILO.propPt(MILO.handR, 0, 30)), 0.8, t > 1.98 && t < 3.06);
  B.shineS.update(t, 7.55, () => MIRRORB.position.clone().add(V(-0.03, 0.05, 0.05)), 0, t > 7.55 && t < 8.32);
  B.shine2.update(t, 9.22, () => MILO.toWorld(MILO.propPt(MILO.handR, 0, 30)), 0.7, t > 9.22 && t < 10.1); if (t > 8.28 && t < 9.22) B.tink.update(t, 8.28, () => SL(0.72, 0.98, -1.75), 0.3, true);
  B.crumbs.update(t, 12.6, () => DOG.pos.clone().add(V(0.3, 0.55, 0.1)), 0.5, t > 12.6 && t < 13.72);
  B.dust.update(t, 18.18, () => GUS.pos.clone().add(V(0, 0.1, 0)), 0, t > 18.15 && t < 19.0); B.tears.update(t, 17.56, () => GUS.headWorld(), 0.5, t > 17.56 && t < 19.0);
  B.money.update(t, 19.02, () => PRO.clone().add(V(1.6, 1.3, -0.2)), 0, t > 19.02 && t < 20.0);
  B.hit.update(t, 25.92, V(0.32, 0.3, 0.05), 0, t > 25.92 && t < 26.34); B.confetti.update(t, 27.55, V(-10, 4, 0), 0, t > 27.55 && t < 28.56);
  B.dust2.update(t, 27.3, () => DRIVE(1), 0, t > 27.3 && t < 27.6);
  B.shineBig.update(t, 29.9, () => GUSBALL.position.clone(), 0, t > 29.9 && t < 30.52);
  B.bonk.update(t, 31.82, () => GUS.headWorld().add(V(0, 0.42, 0)), 0, t > 31.82 && t < 32.24);
  B.sweat.update(t, 45.3, () => GUS.headWorld(), 0.5, t > 45.3 && t < 46.76); B.shine3.update(t, 45.6, () => GUSBALL.position.clone(), 0.4, t > 45.6 && t < 46.76);
}

// =================== CAMERA (28 shots, cuts on the words) ===================
const CINE = new Cine({ blend: 0.6 });
const shot = (t0, t1, o) => CINE.shot(t0, t1, { cut: true, ease: 'inOut', shake: 0.12, push: 1.25, ...o });
const mH = (dy = -0.3) => () => MILO.headWorld().add(V(0, dy, 0)), gH = (dy = -0.3) => () => GUS.headWorld().add(V(0, dy, 0));
const flowW = (t, X, Y) => L2(X, Y).applyQuaternion(FLOWQ).add(sciPos(t)); const sciC = (t) => flowW(t, -2.2, 0);
function camera() {
  shot(0, 1.3, { rig: 'push', at: () => SL(-1.95, 1.2, -1.6), size: 2.4, az: 8, el: 14, fov: 34, push: 1.2, drift: [0.02, 0.0] });
  shot(1.3, 3.06, { rig: 'push', at: mH(-0.3), size: 1.85, az: -10, el: 2, fov: 30, push: 1.15, zoomK: [[2.28, 1.3]] });
  shot(3.06, 4.72, { rig: 'pov', from: (t) => V(lerp(-30, -14, (t - 3.06) / 1.66), lerp(48, 40, (t - 3.06) / 1.66), lerp(238, 205, (t - 3.06) / 1.66)), at: (t) => V(-6, 4, lerp(120, 95, (t - 3.06) / 1.66)), fov: 46, push: 1.0, drift: [0, 0] });
  shot(4.72, 6.96, { rig: 'push', at: () => PRACT.clone().add(V(0, 1.15, 0.2)), size: 6.2, az: 6, el: 6, fov: 36, push: 1.25 });
  shot(6.96, 8.3, { rig: 'push', at: () => MIRRORB.position.clone().add(V(0, 0.02, 0)), size: 0.36, az: 20, el: 4, fov: 28, push: 1.35, drift: [0, 0] });
  shot(8.3, 10.1, { rig: 'push', at: () => SL(0.55, 1.25, -1.2), size: 2.8, az: -10, el: 5, fov: 34, push: 1.15, zoomK: [[9.22, 1.28]] });
  shot(10.1, 12.22, { rig: 'pov', from: (t) => { const a = sstep(10.1, 11.25, t), b = sstep(11.25, 11.95, t); return SL(9, 34, 46).lerp(SL(3, 3.4, 15), a).lerp(SL(-1.3, 1.85, 5.2), b); }, at: (t) => SL(0.4, 1.6, 3).lerp(SL(-1.6, 1.72, 3.1), sstep(11.25, 11.95, t)), fov: 40, push: 1.0, drift: [0, 0] });
  shot(12.22, 13.72, { rig: 'push', at: () => SL(1.95, 0.45, -0.2), size: 2.5, az: -8, el: 3, fov: 34, push: 1.3 });
  shot(13.72, 15.55, { rig: 'push', at: () => SL(1.3, 0.38, 0.5), size: 1.8, az: 18, el: 6, fov: 32, push: 1.25 });
  shot(15.55, 16.3, { rig: 'push', at: mH(-0.2), size: 1.6, az: 6, el: -2, fov: 30, push: 1.1, zoomK: [[15.82, 1.55, 0.1]] });
  shot(16.3, 16.76, { rig: 'pov', from: (t) => CART.position.clone().add(V(-2.5 + (t - 16.3) * 2, 6.5 - (t - 16.3) * 3, 7.5)), at: () => CART.position.clone().add(V(0.3, 0.9, 0.3)), fov: 44, push: 1.0, drift: [0, 0] });
  shot(16.76, 17.5, { rig: 'push', at: gH(-0.2), size: 1.8, az: 10, el: 2, fov: 30, push: 1.08, zoomK: [[16.98, 1.18, 0.1]] });
  shot(17.5, 19.0, { rig: 'push', at: (t) => SL(-1.25, 1.05, 6.2).lerp(SL(-1.2, 0.75, 7.6), sstep(17.96, 18.3, t)), size: 3.6, az: 40, el: 7, fov: 38, push: 1.1, zoomK: [[17.96, 0.8, 0.3]] });
  shot(19.0, 21.05, { rig: 'push', at: () => PRO.clone().add(V(1.9, 1.45, -0.25)), size: 3.2, az: 92, el: 4, fov: 36, push: 1.1, zoomK: [[20.3, 1.4]] });
  shot(21.05, 22.62, { rig: 'pov', from: (t) => { const u = sstep(21.05, 22.4, t); return V(34, 26, 34).lerp(V(9.5, 3.2, 7.5), u); }, at: (t) => V(-8, 2, -6).lerp(MILO.headWorld().add(V(-0.5, -0.6, -0.4)), sstep(21.05, 22.2, t)), fov: 44, push: 1.0, drift: [0, 0] });
  shot(22.62, 23.88, { rig: 'push', at: () => V(0.0, 0.8, 0.1), size: 2.3, az: 84, el: 2, fov: 32, push: 1.25 });
  shot(23.88, 25.5, { rig: 'push', at: mH(-0.35), size: 1.8, az: 82, el: 1, fov: 30, push: 1.12, zoomK: [[24.96, 1.35, 0.1]] });
  shot(25.5, 26.34, { rig: 'push', at: () => V(-0.3, 1.25, 0.1), size: 3.6, az: 90, el: 4, fov: 38, push: 1.15 });
  shot(26.34, 27.6, { rig: 'pov', from: (t) => V(26, 30, lerp(30, -40, (t - 26.34) / 1.26)), at: (t) => DRIVE(clamp((t - 25.92) / 1.68, 0, 1)).lerp(V(-4, 0, -200), 0.45), fov: 50, push: 1.0, drift: [0, 0] });
  shot(27.6, 28.56, { rig: 'push', at: () => V(-3.6, 1.55, -0.6), size: 4.4, az: 78, el: 4, fov: 38, push: 1.05, zoomK: [[27.8, 1.7, 0.12]] });
  shot(28.56, 29.55, { rig: 'push', at: () => V(-0.3, 1.25, 0.1), size: 3.4, az: 90, el: 4, fov: 38, push: 1.2 });
  shot(29.55, 30.52, { rig: 'pov', from: () => V(19, 1.2, 15), at: (t) => GUSUP(t).lerp(V(-1, 6, -1), 0.45), fov: 50, push: 1.0, drift: [0, 0] });
  shot(30.52, 31.25, { rig: 'pov', from: () => V(3.5, 1.2, 3.5), at: () => GUSUP(30.6).add(V(0, -1.5, 0)), fov: 30, push: 1.25, drift: [0, 0] });
  shot(31.25, 32.24, { rig: 'push', at: () => GUS.headWorld().add(V(0, 0.8, 0)), size: 4.0, az: 80, el: -16, fov: 40, push: 1.1, zoomK: [[31.82, 1.4, 0.1]] });
  shot(32.24, 34.08, { rig: 'push', at: (t) => flowW(t, -1.4, 0).add(V(0, 0.4, 0)), size: 11.5, az: 90, el: 2, fov: 40, push: 1.2 });
  shot(34.08, 36.18, { rig: 'push', at: (t) => flowW(t, -2.2, 0).add(V(0, 0.4, 0)), size: 10, az: 96, el: 3, fov: 40, push: 1.25 });
  shot(36.18, 39.98, { rig: 'push', at: (t) => flowW(t, -1.5, 0).add(V(0, 0.8, 0)), size: 11.5, az: 88, el: 2, fov: 40, push: 1.1 });
  shot(39.98, 43.66, { rig: 'push', at: (t) => flowW(t, -1.5, 0).add(V(0, 0.8, 0)), size: 10.5, az: 92, el: 2, fov: 40, push: 1.2 });
  shot(43.66, 45.22, { rig: 'push', at: (t) => sciPos(t).add(V(0, 0.6, 0)), size: 10, az: 90, el: 3, fov: 42, push: 0.72, drift: [0, 0] });
  shot(45.22, 46.76, { rig: 'push', at: gH(-0.25), size: 1.8, az: 10, el: 2, fov: 32, push: 1.12, zoomK: [[46.08, 1.32, 0.1]] });
  shot(46.76, 48.4, { rig: 'push', at: () => SL(0.25, 0.95, 0.75), size: 3.8, az: 4, el: 4, fov: 34, push: 1.1, zoomK: [[47.68, 1.32]] });
}

// =================== RENDER ===================
const composer = makeComposer({ sat: 1.4, con: 1.08, bloom: 0.18 });
const SKY = makeSky();
const look = (t, cpos) => { SKY.update(cpos, NIGHT(t), composer.grade); const tg = sun.target.position; const d = V(cpos.x - tg.x, 0, cpos.z - tg.z).normalize().applyAxisAngle(V(0, 1, 0), 0.75); sun.position.copy(tg).addScaledVector(d, 45).add(V(0, 60, 0)); };
const camOf = dynamicCam(CINE);
makeRenderer({ CINE, camOf, setup, fx, look, composer, DURATION, impacts: [0.4, 0.97, 18.18, 25.92, 31.82] });
window.__d = () => ({ MILO, GUS, DOG, cam, scene, CINE });
(async () => {
  await loadMo(['17_06f', '79_70'], './mocap');
  await sky('kloofendal_48d_partly_cloudy_puresky', { env: 0.8 });
  build(); camera(); await ready(); window.ready = true;
})();
