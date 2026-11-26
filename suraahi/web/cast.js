// cast.js : characters (young man, jinn, vazir, guards, kids, shopkeeper) + magic props (suraahi, basket, fruit, carpet, sparkles, smoke)
import * as THREE from 'three';
import * as C from './core.js';
import { Person, SKIN, FACES, M } from './person.js';
import { W, tm, cm } from './world.js';
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const S = (g, mat, r, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), mat); m.scale.set(r * sx, r * sy, r * sz); m.position.set(x, y, z); g.add(m); return m; };

function turban(P, col, o = {}) {   // wrapped turban on the head (+ optional jewel and plume)
  const H = P.head, hs = P.sp.headScale || 1, m = M(col), m2 = M(o.col2 || col);
  const g = new THREE.Group(); g.position.set(0, 0.085 * hs, -0.015); H.add(g);
  for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.168 * hs - i * 0.012, 0.05 * hs, 10, 28), i % 2 ? m2 : m); t.rotation.x = Math.PI / 2 - 0.12 - i * 0.04; t.position.set(0, 0.03 * hs + i * 0.045 * hs, -0.006 * i); t.scale.set(1, 1.0, 1.0); g.add(t); }
  S(g, m, 0.165 * hs, 0, 0.09 * hs, -0.02, 1, (o.tall ?? 0.72), 1.04);
  if (o.tall > 1) S(g, m2, 0.1 * hs, 0, 0.2 * hs, -0.04, 1, 1.2, 1);
  if (o.jewel) { S(g, M(o.jewel, { unlit: 0.5, emis: 0.3 }), 0.026 * hs, 0, 0.09 * hs, 0.19 * hs, 1, 1.3, 0.6); S(g, M('#e0b040', { emis: 0.2 }), 0.035 * hs, 0, 0.09 * hs, 0.183 * hs, 1, 1.4, 0.4); }
  if (o.plume) { const p = new THREE.Mesh(new THREE.ConeGeometry(0.025 * hs, 0.2 * hs, 8), M(o.plume)); p.position.set(0, 0.2 * hs, 0.15 * hs); p.rotation.x = -0.3; g.add(p); }
  return g;
}
// ============ young man (water-carrier): curly hair, cream shirt, purple vest, gold baggy shalwar, small red cap ============
export const N = new Person({ skin: SKIN.wheatish, face: { ...FACES.oval, eyeSize: 1.06, age: 0.05 }, hair: '#1a110c', hairStyle: 'side', browColor: '#1a110c', top: '#ece2c8', sleeve: '#ece2c8',
  baggy: true, bottom: '#d29a3a', shoe: '#6a3a20', sole: '#3a2010', eyeColor: '#3a2416', lip: '#a0605a', stubble: null, build: { w: 0.95, arm: 0.95 }, height: 0.92, headScale: 1.04, seed: 21 });
{ const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.06, 18), M('#b02a2a')); cap.position.set(0.03, 0.19, -0.04); cap.rotation.set(-0.15, 0, -0.3); N.head.add(cap); S(N.head, M('#1a1a1a'), 0.014, 0.07, 0.23, -0.04); }
{ for (const sd of [-1, 1]) { const v = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.03), M('#6a2f78')); v.position.set(sd * 0.12, 0.38, 0.1); v.rotation.z = sd * 0.1; N.torso.add(v); const tr = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.4, 0.035), M('#e0b040', { emis: 0.1 })); tr.position.set(sd * 0.075, 0.38, 0.113); tr.rotation.z = sd * 0.1; N.torso.add(tr); } S(N.torso, M('#6a2f78'), 0.16, 0, 0.4, -0.05, 1.35, 1.35, 0.85); }
// the water skin (mashk) on his back
export const MASHK = new THREE.Group(); { const m = M('#8a5a32'); S(MASHK, m, 0.17, 0, 0, 0, 1.0, 1.25, 0.6); S(MASHK, M('#6a4024'), 0.05, 0.02, 0.2, 0.0, 0.8, 1.2, 0.8); const st = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.62, 0.015), M('#4a2c18')); st.position.set(-0.06, 0.08, 0.13); st.rotation.z = 0.55; MASHK.add(st); MASHK.position.set(0.06, 0.32, -0.2); N.torso.add(MASHK); }
// ============ JINN: blue, big, bare-chest look with gold vest trims, top-knot, braided beard, gold cuffs, smoky tail instead of legs ============
const JBLUE = '#3f86d8';
export const J = new Person({ skin: JBLUE, skinUnlit: 0.25, face: { ...FACES.square, w: 1.1, jaw: 1.05, brow: 0.9, eyeSize: 1.0, age: 0.3 }, hair: '#101018', hairStyle: 'gray', browColor: '#101018', beard: '#101018', beardFull: 0.7, mustache: '#101018',
  top: JBLUE, sleeve: JBLUE, bottom: '#2a2a6a', belt: true, beltColor: '#e0b040', eyeColor: '#e8c040', lip: '#2a4a8a', build: { w: 1.32, d: 1.15, shoulder: 1.2, arm: 1.3, belly: 0.05 }, height: 1.12, headScale: 1.14, seed: 33 });
{ const H = J.head; S(H, M('#101018'), 0.07, 0, 0.21, -0.04, 1, 0.9, 1); const knot = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, 0.08, 10), M('#e0b040', { emis: 0.2 })); knot.position.set(0, 0.27, -0.04); H.add(knot);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.38, 10), M('#101018')); tail.position.set(0, 0.17, -0.2); tail.rotation.x = -2.4; H.add(tail);
  for (const s of [-1, 1]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 14), M('#e8c040', { emis: 0.3 })); ring.position.set(s * 0.19, -0.06, 0.0); ring.rotation.y = Math.PI / 2; H.add(ring); }
  // braid under the chin
  for (let i = 0; i < 3; i++) S(H, M('#101018'), 0.03 - i * 0.004, 0, -0.2 - i * 0.05, 0.1 - i * 0.01);
  // open red vest edges + gold trim on the chest
  for (const s of [-1, 1]) { const v = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.03), M('#a82a3a')); v.position.set(s * 0.15, 0.4, 0.1); v.rotation.z = s * 0.12; v.scale.x = 1.3; J.torso.add(v); const tr = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.42, 0.035), M('#e0b040', { emis: 0.15 })); tr.position.set(s * 0.1, 0.4, 0.115); tr.rotation.z = s * 0.12; J.torso.add(tr); }
  S(J.torso, M('#a82a3a'), 0.17, 0, 0.42, -0.04, 1.5, 1.4, 0.9);
}
// gold cuffs on the forearms (they break and fall at the end)
export const CUFFS = ['L', 'R'].map((s) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.09, 16, 1, true), M('#e8c040', { emis: 0.25, side: THREE.DoubleSide })); W.add(c); return c; });
// smoky tail: replaces the legs
const JLEGS = ['tL', 'tR', 'sL', 'sR', 'kL', 'kR'];
for (const n of JLEGS) if (J.limb[n]) J.limb[n].visible = false; for (const s of ['L', 'R']) { J.jt['kn' + s].visible = false; J.jt['hp' + s].visible = false; } J.shoes.forEach((s) => (s.visible = false));
export const JTAIL = new THREE.Group(); { const cols = ['#2a6ac8', '#3a8ae0', '#5aa8f0', '#8ac8ff']; for (let i = 0; i < 14; i++) { const u = i / 13; const m = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), M(cols[i % 4], { unlit: 0.35 })); m.userData.u = u; JTAIL.add(m); } W.add(JTAIL); }
export function updateTail(t, k = 1) {   // k: 0 = tail hidden in the bottle .. 1 full
  J.pelvis.updateWorldMatrix(true, false); const base = J.pelvis.localToWorld(V(0, -0.05, 0)); const yaw = J.root.rotation.y;
  JTAIL.children.forEach((m, i) => { const u = m.userData.u, r = (0.27 - 0.22 * u) * J.height * Math.max(0.05, k); const sw = Math.sin(t * 2.2 - u * 4) * 0.18 * u, sw2 = Math.cos(t * 1.7 - u * 3) * 0.12 * u;
    const loc = V(sw + 0.1 * u * u, -u * 0.95 * J.height * k, -0.32 * u * u * J.height + sw2); loc.applyAxisAngle(V(0, 1, 0), yaw); m.position.copy(base).add(loc); m.scale.set(r, r * 1.25, r); m.visible = k > 0.01; });
}
// ============ VAZIR: tall, long face, black-red robe, tall turban with ruby, goatee ============
export const VZ = new Person({ skin: SKIN.olive, face: { ...FACES.long, chin: 0.16, cheek: 0.1, noseL: 1.35, eyeSize: 0.9, age: 0.55 }, hair: '#0c0a0a', hairStyle: 'crop', browColor: '#0c0a0a', beard: '#0c0a0a', beardFull: 0.45, mustache: '#0c0a0a',
  coat: '#24121c', longCoat: true, shirt: '#8a1a24', noTie: true, top: '#8a1a24', bottom: '#3a1418', shoe: '#120a0a', eyeColor: '#2a1c10', lip: '#6a3a3a', wrinkles: 0.6, bags: true, build: { w: 0.92, d: 0.95, arm: 1.0 }, height: 0.98, headScale: 1.0, seed: 41 });
turban(VZ, '#1a1018', { col2: '#8a1a24', tall: 1.25, jewel: '#e02040', plume: '#2a1a2a' });
{ for (const s of [-1, 1]) { const sh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.22), M('#8a1a24')); sh.position.set(s * 0.17, 0.6, 0); sh.rotation.z = -s * 0.3; VZ.torso.add(sh); } }
// ============ two palace guards (red, spears) ============
export const GUARDS = [0, 1].map((i) => { const P = new Person({ skin: i ? SKIN.brown : SKIN.tan, face: i ? { ...FACES.heavy, age: 0.3 } : { ...FACES.square, age: 0.2 }, hair: '#0e0b09', hairStyle: 'crop', mustache: '#0e0b09', top: '#9a2a24', sleeve: '#9a2a24', waistcoat: '#2a2a32', baggy: true, bottom: '#e8dcc0', shoe: '#2a1a10', eyeColor: '#2a1c12', build: { w: 1.08, arm: 1.05 }, height: 0.95, seed: 51 + i });
  turban(P, i ? '#e8dcc0' : '#d8c8a0', { col2: '#9a2a24' }); return P; });
export function makeSpear() { const g = new THREE.Group(); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.1, 8), cm(0x5a3a22)); g.add(s); const h = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.22, 8), cm(0xc8ccd8, { emis: 0.1 })); h.position.y = 1.15; g.add(h); return { group: g, grips: { shaft: { p: [0.018, 0.1, 0], dir: [0, 0, 1], pn: [-1, 0, 0], curl: 0.9, thumb: 0.9 } } }; }
export const SPEARS = GUARDS.map(() => { const s = makeSpear(); W.add(s.group); return s; });
// ============ bazaar people: two kids, one shopkeeper ============
export const KIDS = [0, 1].map((i) => new Person({ skin: i ? SKIN.tan : SKIN.wheatish, face: { ...FACES.round, eyeSize: 1.15, noseL: 0.8 }, hair: '#120d0b', hairStyle: i ? 'short' : 'curly', top: i ? '#3a8a5a' : '#e8b030', bottom: i ? '#e0d0b0' : '#5a3a7a', baggy: true, shoe: '#6a3a20', eyeColor: '#2a1c12', build: { w: 0.82, arm: 0.8, leg: 0.85 }, height: 0.6, headScale: 1.22, seed: 61 + i }));
export const SHOP = new Person({ skin: SKIN.olive, face: FACES.round, hair: '#2a2420', hairStyle: 'short', mustache: '#2a2420', beard: '#2a2420', waistcoat: '#2a5a4a', top: '#e0dccc', bottom: '#3a3228', shoe: '#2a2018', eyeColor: '#3a2a1c', build: { w: 1.1, belly: 0.35 }, height: 0.88, seed: 71 });
turban(SHOP, '#f0ead8', {});
for (const P of [N, J, VZ, ...GUARDS, ...KIDS, SHOP]) W.add(P.root);

// ================= PROPS =================
// SURAAHI: copper bottle with a long neck, blue enamel bands that glow
export const GLOW = tm(0x7ad8ff, { unlit: 1, emis: 0.7, noInk: 1 });
export const SUR = (() => { const g = new THREE.Group(); const pts = [[0.0, 0], [0.06, 0.0], [0.085, 0.03], [0.095, 0.08], [0.085, 0.13], [0.055, 0.17], [0.028, 0.2], [0.022, 0.27], [0.03, 0.3], [0.035, 0.31], [0.0, 0.315]].map(([r, y]) => new THREE.Vector2(r, y - 0.13));
  const copper = tm(0xc8702e, { emis: 0.05 }); const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), copper); g.add(body);
  for (const [y, r] of [[-0.06, 0.092], [0.0, 0.092], [0.08, 0.035]]) { const b = new THREE.Mesh(new THREE.TorusGeometry(r, 0.006, 6, 24), GLOW); b.rotation.x = Math.PI / 2; b.position.y = y; g.add(b); }
  const st = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.04, 12), tm(0x8a4a1e)); st.position.y = 0.2; g.add(st);
  return { group: g, size: 0.09, grips: { body: { p: [0.09, -0.04, 0], dir: [0, 0, 1], pn: [-1, 0, 0], curl: 0.45, thumb: 0.5 }, neck: { p: [0.028, 0.12, 0], dir: [0, 0, 1], pn: [-1, 0, 0], curl: 0.9, thumb: 0.8 }, hold: { p: [0.094, -0.03, 0], dir: [0, 0, -1], pn: [-1, 0, 0], curl: 0.45, thumb: 0.5 }, top: { p: [0.0, 0.2, 0], dir: [0, 0, -1], pn: [0, -1, 0], curl: 0.8, thumb: 0.8 } } }; })();
W.add(SUR.group);
// shards of the suraahi (shatter at the climax)
export const SHARDS = Array.from({ length: 22 }, (_, i) => { const m = new THREE.Mesh(new THREE.TetrahedronGeometry(0.035 + (i % 4) * 0.01), i % 5 === 0 ? GLOW : tm(0xc8702e)); m.visible = false; W.add(m); return m; });
// BASKET (tokri): woven bowl with handles + fruit that appears by magic
export const BASKET = (() => { const g = new THREE.Group(); const wv = tm(0xffffff, { map: (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#b08040'; x.fillRect(0, 0, 128, 128); x.strokeStyle = '#7a5226'; x.lineWidth = 3; for (let i = 0; i < 128; i += 10) { x.beginPath(); x.moveTo(0, i); x.lineTo(128, i); x.stroke(); } for (let i = 0; i < 128; i += 16) for (let j = 0; j < 128; j += 10) { x.fillStyle = (i / 16 + j / 10) % 2 ? '#c8984e' : '#9a6a32'; x.fillRect(i, j + 2, 8, 6); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })(), repeat: [3, 1], side: THREE.DoubleSide });
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.13, 0.15, 22, 1, true), wv); g.add(b); const bt = new THREE.Mesh(new THREE.CircleGeometry(0.13, 20), wv); bt.rotation.x = -Math.PI / 2; bt.position.y = -0.075; g.add(bt);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 6, 26), tm(0x8a5a2a)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.075; g.add(rim);
  const fruit = []; const cols = [0xe8a020, 0xd03020, 0x6aa030, 0xe8d040, 0xa03070, 0xff7a30]; for (let i = 0; i < 14; i++) { const a = i * 2.39, r = i < 6 ? 0.11 : 0.05; const m = new THREE.Mesh(new THREE.SphereGeometry(0.048 + (i % 3) * 0.008, 14, 10), cm(cols[i % 6])); m.position.set(Math.cos(a) * r, 0.04 + (i < 6 ? 0 : 0.05) + (i > 11 ? 0.05 : 0), Math.sin(a) * r); m.userData.home = m.position.clone(); g.add(m); fruit.push(m); }
  return { group: g, fruit, size: 0.01, grips: { side: { p: [0.2, 0.0, 0], dir: [0, 0, 1], pn: [-1, 0, 0], curl: 0.25, thumb: 0.4 }, hold: { p: [0.205, 0.02, 0], dir: [0, 0, -1], pn: [-1, 0, 0], curl: 0.35, thumb: 0.4 } } }; })();
W.add(BASKET.group);
// thrown fruit (flying arcs to the kids)
export const TOSS = Array.from({ length: 4 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 10), cm([0xd03020, 0xe8a020, 0x6aa030, 0xff7a30][i])); m.visible = false; W.add(m); return m; });
// MAGIC CARPET: subdivided plane, waves in the wind, tassels
export const CARPET = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 384; const x = c.getContext('2d'); x.fillStyle = '#8a1e2a'; x.fillRect(0, 0, 256, 384); x.fillStyle = '#e0b040'; x.fillRect(10, 10, 236, 364); x.fillStyle = '#7a1824'; x.fillRect(20, 20, 216, 344); x.fillStyle = '#2a4a8a'; x.fillRect(36, 36, 184, 312);
  x.fillStyle = '#e0b040'; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(128, 70 + i * 62); x.lineTo(168, 100 + i * 62); x.lineTo(128, 130 + i * 62); x.lineTo(88, 100 + i * 62); x.closePath(); x.fill(); } x.fillStyle = '#c83a3a'; for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(128, 100 + i * 62, 12, 0, 7); x.fill(); }
  x.strokeStyle = '#e0b040'; x.lineWidth = 4; for (let i = 0; i < 12; i++) { x.beginPath(); x.arc(i % 2 ? 50 : 206, 60 + i * 26, 7, 0, 7); x.stroke(); }
  const tex = new THREE.CanvasTexture(c); const geo = new THREE.PlaneGeometry(1.25, 1.9, 12, 18); geo.rotateX(-Math.PI / 2); const m = new THREE.Mesh(geo, tm(0xffffff, { map: tex, side: THREE.DoubleSide })); m.frustumCulled = false;
  const g = new THREE.Group(); g.add(m); const base = Float32Array.from(geo.attributes.position.array); const tas = []; for (const zs of [-1, 1]) for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.09, 6), tm(0xe0b040)); t.userData.ix = -0.55 + i * 0.22; t.userData.iz = zs * 0.98; g.add(t); tas.push(t); }
  W.add(g); return { group: g, mesh: m, geo, base, tas }; })();
export function waveCarpet(t, amp = 1, speed = 1) { const p = CARPET.geo.attributes.position, b = CARPET.base; for (let i = 0; i < p.count; i++) { const x = b[i * 3], z = b[i * 3 + 2]; const edge = Math.min(1, Math.abs(x) / 0.62) ** 2; p.array[i * 3 + 1] = amp * (0.035 * Math.sin(z * 4.2 - t * 6 * speed) + 0.05 * edge * Math.sin(z * 3 + t * 4)) + amp * 0.06 * Math.max(0, -z - 0.5) * Math.sin(t * 7 * speed); }
  p.needsUpdate = true; CARPET.geo.computeVertexNormals(); for (const ts of CARPET.tas) { const { ix, iz } = ts.userData; ts.position.set(ix, amp * 0.035 * Math.sin(iz * 4.2 - t * 6 * speed) - 0.04, iz * 0.97); ts.rotation.x = iz > 0 ? 1.2 : -1.2; } }
// ================= MAGIC FX =================
// blue smoke puffs (opaque spheres that grow / fade by shrinking), sparkles (tiny emissive stars), orbs
export const SMOKE = Array.from({ length: 60 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), tm([0x4a8ae0, 0x6aa8f0, 0x8ac0ff, 0x3a70c8][i % 4], { emis: 0.35, opacity: 0.32, rough: 1 })); m.visible = false; m.userData.noShadow = true; W.add(m); return m; });
const starG = (() => { const g = new THREE.OctahedronGeometry(1, 0); g.scale(0.35, 1, 0.35); return g; })();
export const SPARK = Array.from({ length: 60 }, (_, i) => { const m = new THREE.Mesh(starG, tm([0xfff0a0, 0xa0e8ff, 0xffffff][i % 3], { unlit: 1, emis: 1.2, noInk: 1 })); m.visible = false; m.userData.noShadow = true; W.add(m); return m; });
export const ORBS = Array.from({ length: 3 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), tm(0xffe890, { unlit: 1, emis: 1.4, noInk: 1 })); m.visible = false; m.userData.noShadow = true; W.add(m); return m; });
export const FLASH = (() => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), tm(0xe8f6ff, { unlit: 1, emis: 1.5, noInk: 1 })); m.visible = false; m.userData.noShadow = true; W.add(m); return m; })();
export const REDSPARK = Array.from({ length: 24 }, (_, i) => { const m = new THREE.Mesh(starG, tm([0xff3040, 0xff8030][i % 2], { unlit: 1, emis: 1.2, noInk: 1 })); m.visible = false; m.userData.noShadow = true; W.add(m); return m; });
