// world.js : all locations of "Teesri Khwahish". Four zones far apart (only the active one is visible).
//   DES desert dunes (dawn/morning) | BAZ bazaar street (noon) | OAS oasis lake (sunset) | PAL palace roof above a night city (night -> dawn)
import * as THREE from 'three';
import * as C from './core.js';
import { box, cyl, sph } from '../../web/models.js';
import { painted } from '../../web/tex.js';
import { mergeGeometries } from '../../web/vendor/BufferGeometryUtils.js';
import { Colliders, Terrain } from '../../web/motion.js';

export const tm = (hex, o = {}) => C.toon({ color: new THREE.Color(hex), ...o });
const cache = new Map(); export const cm = (hex, o = {}) => { const k = hex + JSON.stringify(o); if (!cache.has(k)) cache.set(k, tm(hex, o)); return cache.get(k); };
const rng = (s) => { let x = s >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
export const ZONES = { DES: [0, 0], BAZ: [300, 0], OAS: [600, 0], PAL: [900, 0] };
export const W = new THREE.Group(); C.stage.world.add(W);
const sky = C.makeSky(); W.add(sky);
export const T = new Terrain(0); export const COL = new Colliders();
const Z = {}; for (const k in ZONES) { Z[k] = new THREE.Group(); Z[k].position.set(ZONES[k][0], 0, ZONES[k][1]); W.add(Z[k]); }
export function showZone(k) { for (const n in Z) Z[n].visible = n === k; }
const noSh = (o) => { o.userData.noShadow = true; return o; };

// merged static geometry per material (fast: one draw call per material)
class Batch { constructor() { this.m = new Map(); } add(mesh, mat) { mesh.updateMatrix(); const g = mesh.geometry.clone(); g.applyMatrix4(mesh.matrix); for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a); if (g.index) { /* keep */ } const k = mat.name; if (!this.m.has(k)) this.m.set(k, { mat, gs: [] }); this.m.get(k).gs.push(g.index ? g.toNonIndexed() : g); }
  build(parent, noShadow = false) { for (const { mat, gs } of this.m.values()) { const me = new THREE.Mesh(mergeGeometries(gs), mat); me.frustumCulled = false; if (noShadow) me.userData.noShadow = true; parent.add(me); } } }
const tf = (m, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => { m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.scale.set(sx, sy, sz); return m; };
const G = { box: new THREE.BoxGeometry(1, 1, 1), sph: new THREE.SphereGeometry(1, 16, 10), sphLo: new THREE.SphereGeometry(1, 10, 7), cyl: new THREE.CylinderGeometry(1, 1, 1, 14), cone: new THREE.ConeGeometry(1, 1, 12), hemi: new THREE.SphereGeometry(1, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2) };
const onion = (() => { const p = []; for (let i = 0; i <= 16; i++) { const u = i / 16; const r = u < 0.55 ? Math.sin(u / 0.55 * Math.PI * 0.62) * 1.12 : Math.max(0.0, 1.0 * Math.pow(1 - (u - 0.55) / 0.45, 1.6) * Math.sin(Math.PI * 0.62) * 1.12); p.push(new THREE.Vector2(Math.max(r, 0.001), u * 1.55)); } return new THREE.LatheGeometry(p, 20); })();
const M_ = (g, mat) => new THREE.Mesh(g, mat);

// ---------- noise + procedural 3D helpers (PBR upgrade) ----------
const hh = (x, y, s = 0) => { const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };
export function vnoise(x, y, s = 0) { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hh(ix, iy, s), b = hh(ix + 1, iy, s), c = hh(ix, iy + 1, s), d = hh(ix + 1, iy + 1, s); return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1; }
export const fbm = (x, y, s = 0, o = 4) => { let a = 0, f = 1, w = 0.5; for (let i = 0; i < o; i++) { a += w * vnoise(x * f, y * f, s + i * 13); f *= 2.03; w *= 0.5; } return a; };
const sst = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// normal map from a height function painted on a canvas (tileable when fn is periodic in 0..1)
function normalTex(S, hf, k = 2.0) { const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'); const im = g.createImageData(S, S); const H = new Float32Array(S * S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) H[y * S + x] = hf(x / S, y / S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const l = H[y * S + (x - 1 + S) % S], r = H[y * S + (x + 1) % S], u = H[((y - 1 + S) % S) * S + x], d = H[((y + 1) % S) * S + x]; let nx = (l - r) * k, ny = (u - d) * k, nz = 1; const L = Math.hypot(nx, ny, nz); const i = (y * S + x) * 4;
    im.data[i] = (nx / L * 0.5 + 0.5) * 255; im.data[i + 1] = (ny / L * 0.5 + 0.5) * 255; im.data[i + 2] = (nz / L * 0.5 + 0.5) * 255; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; t.userData.data = true; t.anisotropy = 8; return t; }
const TAU = Math.PI * 2;
function tnoise(u, v, P, s) { const x = u * P, y = v * P, ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, a_ = fx * fx * (3 - 2 * fx), b_ = fy * fy * (3 - 2 * fy); const w = (i) => ((i % P) + P) % P;
  const A = hh(w(ix), w(iy), s), B = hh(w(ix + 1), w(iy), s), Cc = hh(w(ix), w(iy + 1), s), D = hh(w(ix + 1), w(iy + 1), s); return (A + (B - A) * a_ + (Cc - A) * b_ + (A - B - Cc + D) * a_ * b_) * 2 - 1; }
const per = (u, v, f, s) => { let a = 0, w = 0.5, P = Math.max(2, Math.round(f)); for (let i = 0; i < 4; i++) { a += w * tnoise(u, v, P, s + i * 7); P *= 2; w *= 0.5; } return a; };
export const NRM = {
  ripple: normalTex(256, (u, v) => Math.sin((v * 7 + 0.6 * per(u, v, 3, 11) + 0.25 * Math.sin(u * TAU * 2)) * TAU) * 0.45 * (0.6 + 0.4 * per(u, v, 2, 12)) + per(u, v, 4, 1) * 0.45, 2.4),
  stucco: normalTex(256, (u, v) => per(u, v, 6, 2) * 0.7 + per(u, v, 14, 3) * 0.3, 2.2),
  rock: normalTex(256, (u, v) => per(u, v, 5, 4) * 0.6 + per(u, v, 16, 5) * 0.4, 3.0),
  water: normalTex(256, (u, v) => Math.sin((u * 6 + per(u, v, 2, 7) * 0.6) * TAU) * 0.3 + Math.sin((v * 5 + u * 2) * TAU) * 0.25 + per(u, v, 6, 8) * 0.3, 1.4),
  bark: normalTex(128, (u, v) => Math.abs(Math.sin(v * TAU * 6)) * 0.7 + per(u, v, 8, 9) * 0.3, 3.0),
};
// dune field: rolling ridged dunes, flattened to y=0 inside radius flatR around (fx,fz) so characters stand on flat sand
export function duneField(size, seg, flatR, seed, mat, fx = 0, fz = 0, amp = 1) {
  const geo = new THREE.PlaneGeometry(size, size, seg, seg); geo.rotateX(-Math.PI / 2); const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const wx = x + fbm(x / 70, z / 70, seed + 3) * 22, wz = z + fbm(x / 70 + 9, z / 70, seed + 4) * 22;
    const ridge = 1 - Math.abs(Math.sin((wx * 0.62 + wz * 0.78) / 21)); const big = fbm(x / 120, z / 120, seed) * 0.5 + 0.5;
    let h = (Math.pow(ridge, 2.2) * 11 + big * 9 + fbm(x / 18, z / 18, seed + 7) * 1.2) * amp; const d = Math.hypot(x - fx, z - fz); h *= sst(flatR, flatR * 2.6 + 8, d); p.setY(i, h - 0.02); }
  geo.computeVertexNormals(); const m = new THREE.Mesh(geo, mat); return m; }
// lumpy rock
export function rockGeo(seed, detail = 3) { const g = new THREE.IcosahedronGeometry(1, detail); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)); const k = 1 + fbm(v.x * 1.6, v.y * 1.6 + v.z * 1.3, seed) * 0.32 + vnoise(v.x * 5, v.z * 5 + v.y * 3, seed + 2) * 0.06; v.multiplyScalar(k); p.setXYZ(i, v.x, v.y, v.z); } g.computeVertexNormals(); return g; }
// palm frond: rib curve + leaflets on both sides (one merged geometry in world space)
function frondGeo(px, py, pz, a, L, droop, s, R) { const pos = []; const rib = (u) => new THREE.Vector3(px + Math.cos(a) * L * u, py + Math.sin(Math.PI * u * 0.8) * 0.55 * s - droop * u * u * 2.0 * s, pz + Math.sin(a) * L * u);
  const side = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)); const n = 22;
  for (let i = 1; i < n; i++) { const u = i / n, c = rib(u), t = rib(Math.min(1, u + 0.02)).sub(c).normalize(); const len = (0.62 * Math.sin(Math.PI * Math.min(1, u * 1.08)) + 0.08) * s, w = 0.045 * s;
    for (const sd of [-1, 1]) { const dir = side.clone().multiplyScalar(sd).addScaledVector(t, 0.55).add(new THREE.Vector3(0, -0.55 - R() * 0.2, 0)).normalize(); const tip = c.clone().addScaledVector(dir, len); const off = t.clone().multiplyScalar(w);
      const A = c.clone().sub(off), B = c.clone().add(off), Cc = tip.clone().addScaledVector(t, w * 0.3); pos.push(A.x, A.y, A.z, B.x, B.y, B.z, Cc.x, Cc.y, Cc.z); } }
  for (let i = 0; i < n; i++) { const A = rib(i / n), Bp = rib((i + 1) / n); const w = 0.025 * s * (1 - i / n); pos.push(A.x - w, A.y, A.z, A.x + w, A.y, A.z, Bp.x, Bp.y, Bp.z); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(pos.length / 3 * 2).fill(0.5), 2)); g.computeVertexNormals(); return g; }


// ---------- textures / materials ----------
const sandT = painted('sand', { base: [226, 190, 132], size: 512, seed: 3 });
const sandM = tm(0xffffff, { map: sandT, repeat: [60, 60], normalMap: NRM.ripple, nScale: 0.4, rough: 0.94 }), duneM = tm(0xffffff, { map: sandT, repeat: [40, 40], normalMap: NRM.ripple, nScale: 0.3, rough: 0.94 });
const stuccoT = painted('stucco', { base: [232, 206, 164] }), stucco2T = painted('stucco', { base: [214, 176, 132], seed: 9 }), stucco3T = painted('stucco', { base: [240, 228, 206], seed: 4 });
const st1 = tm(0xffffff, { map: stuccoT, repeat: [2, 2], normalMap: NRM.stucco, nScale: 0.8, rough: 0.9 }), st2 = tm(0xffffff, { map: stucco2T, repeat: [2, 2], normalMap: NRM.stucco, nScale: 0.8, rough: 0.9 }), st3 = tm(0xffffff, { map: stucco3T, repeat: [2, 2], normalMap: NRM.stucco, nScale: 0.6, rough: 0.85 });
const dirtT = painted('dirt', { base: [196, 156, 108] }); const streetM = tm(0xffffff, { map: dirtT, repeat: [12, 3] });
const woodM = tm(0x7a4a2a, { normalMap: NRM.bark, nScale: 0.5, rough: 0.8 }), woodD = tm(0x4a2c18, { rough: 0.75 }), gold = tm(0xe8b850, { metal: 1, rough: 0.28, env: 2 }), goldD = tm(0xc09040, { metal: 1, rough: 0.35, env: 2 });
const stripe = (a, b, n = 6) => tm(0xffffff, { map: painted('stripes', { a, b, n, size: 256 }), side: THREE.DoubleSide });
const awnings = [stripe('#c8402e', '#f2e2c0'), stripe('#2e6e8a', '#f2e8d0'), stripe('#e0a020', '#8a2e3a'), stripe('#3e7a3e', '#efe2c0'), stripe('#6a3a8a', '#f0d890')];
const lampM = tm(0xffc060, { unlit: 1, emis: 0.9, noInk: 1 }), lampM2 = tm(0xff8a3a, { unlit: 1, emis: 0.7, noInk: 1 });
const winM = tm(0xffb050, { unlit: 1, emis: 0.55, noInk: 1 }), winDark = tm(0x2a2030);
const domeCols = [0x2a8aaa, 0xe8c070, 0x3aaa9a, 0xe8e0d0, 0x9a5a9a];
const palmTrunk = tm(0x8a6a42, { normalMap: NRM.bark, nScale: 1.2, repeat: [1, 3], rough: 0.9 }), palmLeaf = tm(0x3e7a30, { side: THREE.DoubleSide, rough: 0.6, sheen: 0.3, sheenColor: 0xd0ffb0 }), palmLeaf2 = tm(0x5a9a3a, { side: THREE.DoubleSide, rough: 0.6, sheen: 0.3, sheenColor: 0xd0ffb0 });

// ---------- reusable builders (into a Batch) ----------
function palm(B, x, z, s = 1, seed = 1, lean = 0.2) {
  const R = rng(seed * 7 + 3); const segs = 9, H = 5.2 * s, dir = R() * Math.PI * 2; let px = x, py = 0, pz = z;
  for (let i = 0; i < segs; i++) { const u = i / segs, b = lean * u * u * 2.2; const nx = x + Math.cos(dir) * b * H * 0.35, nz = z + Math.sin(dir) * b * H * 0.35, ny = (i + 1) / segs * H;
    const mx = (px + nx) / 2, my = (py + ny) / 2, mz = (pz + nz) / 2, len = Math.hypot(nx - px, ny - py, nz - pz); const m = M_(G.cyl, palmTrunk); m.position.set(mx, my, mz); m.scale.set(0.17 * s * (1 - u * 0.35), len * 1.05, 0.17 * s * (1 - u * 0.35));
    m.lookAt(nx, ny, nz); m.rotateX(Math.PI / 2); B.add(m, palmTrunk); const ring = M_(G.sph, palmTrunk); tf(ring, nx, ny, nz, 0, 0, 0, 0.2 * s * (1 - u * 0.3), 0.06 * s, 0.2 * s * (1 - u * 0.3)); B.add(ring, palmTrunk); px = nx; py = ny; pz = nz; }
  B.add(tf(M_(G.sph, woodD), px, py, pz, 0, 0, 0, 0.28 * s, 0.24 * s, 0.28 * s), woodD);
  for (let k = 0; k < 13; k++) { const a = k / 13 * Math.PI * 2 + R() * 0.3, droop = 0.25 + R() * 0.55 + (k % 3 === 0 ? 0.4 : 0); const L = (2.4 + R() * 0.9) * s; const mat = k % 2 ? palmLeaf : palmLeaf2; B.add(new THREE.Mesh(frondGeo(px, py + 0.1 * s, pz, a, L, droop, s, R), mat), mat); }
  for (let k = 0; k < 5; k++) B.add(tf(M_(G.sph, woodM), px + Math.cos(k * 1.3) * 0.22 * s, py - 0.25 * s, pz + Math.sin(k * 1.3) * 0.22 * s, 0, 0, 0, 0.09 * s, 0.13 * s, 0.09 * s), woodM);   // dates
}
function house(B, x, y0, z, w, h, d, mat, o = {}) {
  B.add(tf(M_(G.box, mat), x, y0 + h / 2, z, 0, o.ry || 0, 0, w, h, d), mat);
  B.add(tf(M_(G.box, mat), x, y0 + h + 0.12, z, 0, o.ry || 0, 0, w + 0.25, 0.24, d + 0.25), mat);   // roof lip
  if (o.dome) { const dm = cm(o.dome); B.add(tf(M_(onion, dm), x, y0 + h + 0.2, z, 0, 0, 0, Math.min(w, d) * 0.36, Math.min(w, d) * 0.36, Math.min(w, d) * 0.36), dm); }
  if (o.win) { const wm = o.win; const R = rng(Math.floor(x * 13 + z * 7)); const fl = Math.max(1, Math.floor(h / 3)); for (let f = 0; f < fl; f++) for (const side of [1, -1]) { const n = Math.max(1, Math.floor(w / 2.2)); for (let i = 0; i < n; i++) { if (R() < 0.3) continue; const lit = R() < (o.litP ?? 0.6);
    const wx = x + (i - (n - 1) / 2) * 2.0, wy = y0 + 1.6 + f * 3, wz = z + side * (d / 2 + 0.02); B.add(tf(M_(G.box, lit ? wm : winDark), wx, wy, wz, 0, 0, 0, 0.7, 1.1, 0.06), lit ? wm : winDark);
    B.add(tf(M_(G.cyl, lit ? wm : winDark), wx, wy + 0.55, wz, Math.PI / 2, 0, 0, 0.35, 0.06, 0.35), lit ? wm : winDark); } } }
}
function minaret(B, x, y0, z, h, mat, top) { B.add(tf(M_(G.cyl, mat), x, y0 + h / 2, z, 0, 0, 0, 0.7, h, 0.7), mat); B.add(tf(M_(G.cyl, mat), x, y0 + h * 0.72, z, 0, 0, 0, 1.0, 0.3, 1.0), mat); B.add(tf(M_(G.cyl, mat), x, y0 + h + 0.6, z, 0, 0, 0, 0.55, 1.2, 0.55), mat);
  const tm2 = cm(top); B.add(tf(M_(onion, tm2), x, y0 + h + 1.2, z, 0, 0, 0, 0.7, 0.7, 0.7), tm2); B.add(tf(M_(G.cyl, gold), x, y0 + h + 2.4, z, 0, 0, 0, 0.04, 0.6, 0.04), gold); }
function arch(B, x, z, w, h, ry, mat) { const c = Math.cos(ry), s = Math.sin(ry); for (const sd of [-1, 1]) B.add(tf(M_(G.box, mat), x + c * sd * w / 2, h / 2, z - s * sd * w / 2, 0, ry, 0, 0.7, h, 0.9), mat);
  const ar = new THREE.Mesh(new THREE.TorusGeometry(w / 2, 0.38, 8, 20, Math.PI), mat); ar.position.set(x, h, z); ar.rotation.set(0, ry, 0); ar.scale.set(1, 0.9, 1.15); B.add(ar, mat); B.add(tf(M_(G.box, mat), x, h + w / 2 * 0.9 + 0.35, z, 0, ry, 0, w + 1.2, 0.5, 0.95), mat); }
function lanternHang(B, x, y, z, m = lampM) { B.add(tf(M_(G.cyl, woodD), x, y + 0.4, z, 0, 0, 0, 0.01, 0.8, 0.01), woodD); B.add(tf(M_(G.sph, m), x, y, z, 0, 0, 0, 0.13, 0.17, 0.13), m); B.add(tf(M_(G.cone, goldD), x, y + 0.19, z, 0, 0, 0, 0.1, 0.1, 0.1), goldD); }
function dunes(B, cx, cz, n, rMin, rMax, seed, mat) { if (n > 0 && rMin < 100) B.add(duneField(560, 200, rMin, seed, mat, cx, cz, rMin > 25 ? 1.0 : 0.8), mat); }
function skyline(B, cx, cz, dist, n, seed, night) { const R = rng(seed); for (let i = 0; i < n; i++) { const a = -0.55 + i / n * 1.1 + (R() - 0.5) * 0.02; const x = cx + Math.sin(a) * dist, z = cz - Math.cos(a) * dist; const w = 3 + R() * 6, h = 3 + R() * 9;
  house(B, x, 0, z, w, h, w, [st1, st2, st3][i % 3], { dome: R() < 0.35 ? domeCols[i % 5] : null, win: night ? winM : null }); if (R() < 0.1) minaret(B, x + w, 0, z, 14 + R() * 8, st3, domeCols[(i + 2) % 5]); } }
function stars(parent, n, seed) { const R = rng(seed); const gs = []; for (let i = 0; i < n; i++) { const th = R() * Math.PI * 2, ph = 0.08 + Math.acos(1 - R() * 0.9) * 0.95; const d = 330, s = 0.35 + R() * 0.9; const g = G.sphLo.clone(); g.scale(s, s, s); g.translate(Math.cos(th) * Math.sin(ph) * d, Math.cos(ph) * d, Math.sin(th) * Math.sin(ph) * d); gs.push(g.toNonIndexed()); }
  const m = new THREE.Mesh(mergeGeometries(gs), tm(0xfff6e0, { unlit: 1, emis: 0.6, noInk: 1 })); m.frustumCulled = false; m.userData.noShadow = true; parent.add(m); return m; }

// =========================== DESERT (dawn) ===========================
{ const z = Z.DES, B = new Batch(); const g = new THREE.Mesh(new THREE.CircleGeometry(260, 48), sandM); g.rotation.x = -Math.PI / 2; z.add(g);
  dunes(B, 0, 0, 34, 26, 120, 11, duneM); dunes(B, 0, 0, 20, 130, 230, 12, duneM);
  // a few rocks + a dry bush
  const rock = tm(0x9a7a5a, { normalMap: NRM.rock, rough: 0.85 }); [[4.5, -3, 0.6], [-5, -6, 0.9], [7, 5, 0.5], [-3.2, 4.5, 0.4], [9, -9, 1.3], [-10, 3, 1.0]].forEach(([x, zz, s], i) => B.add(tf(M_(rockGeo(i + 3), rock), x, s * 0.25, zz, 0.3, x, 0, s * 1.3, s * 0.7, s), rock));
  // the distant city on the horizon (morning haze)
  skyline(B, 0, 0, 170, 26, 5, false); { const big = cm(0xe8c070); B.add(tf(M_(onion, big), 6, 6, -168, 0, 0, 0, 6, 6, 6), big); B.add(tf(M_(G.box, st3), 6, 3, -168, 0, 0, 0, 14, 6, 14), st3); minaret(B, -6, 0, -166, 20, st3, 0x2a7a9a); minaret(B, 18, 0, -166, 20, st3, 0x2a7a9a); }
  for (const [x, zz, s, sd] of [[-14, -22, 1.1, 2], [-17, -19, 0.9, 3], [22, -30, 1.2, 4]]) palm(B, x, zz, s, sd, 0.3);
  B.build(z);
}
// =========================== BAZAAR (noon) ===========================
export const BAZ = { stalls: [] };
{ const z = Z.BAZ, B = new Batch(); const g = new THREE.Mesh(new THREE.PlaneGeometry(120, 40), streetM); g.rotation.x = -Math.PI / 2; z.add(g);
  const g2 = new THREE.Mesh(new THREE.CircleGeometry(250, 40), sandM); g2.rotation.x = -Math.PI / 2; g2.position.y = -0.02; z.add(g2);
  const R = rng(77); const goodsC = [0xd04020, 0xe8a020, 0x6a9a2a, 0xa03070, 0xd8c040, 0x8a4a1a, 0xe06a30];
  // two rows of stalls along x, facing the street (street = z in [-2.6, 2.6])
  for (const side of [-1, 1]) for (let i = -6; i <= 6; i++) { const x = i * 4.0 + (side > 0 ? 1.5 : 0), zz = side * 4.4; const aw = awnings[(i + 7 + (side > 0 ? 2 : 0)) % 5]; if (side < 0 && (i === 3 || i === 4)) continue;
    COL.box(ZONES.BAZ[0] + x, zz + side * 2.6, 4.0, 3.0, 0, 99);
    // back wall building
    house(B, x, 0, zz + side * 2.6, 4.0, 4.5 + R() * 3, 3.0, [st1, st2, st3][(i + 9) % 3], { dome: R() < 0.2 ? domeCols[(i + 9) % 5] : null });
    // posts
    for (const dx of [-1.7, 1.7]) B.add(tf(M_(G.box, woodD), x + dx, 1.25, zz - side * 0.9, 0, 0, 0, 0.12, 2.5, 0.12), woodD);
    // awning (sloped)
    const a = M_(G.box, aw); tf(a, x, 2.55, zz - side * 0.25, side * 0.32, 0, 0, 3.9, 0.04, 2.3); B.add(a, aw);
    // counter + goods
    const ctr = woodM; B.add(tf(M_(G.box, ctr), x, 0.45, zz - side * 0.6, 0, 0, 0, 3.2, 0.9, 0.9), ctr);
    const kind = (i + 20 + (side > 0 ? 3 : 0)) % 4;
    if (kind === 0) for (let k = 0; k < 5; k++) { const c = cm(goodsC[(k + i + 7) % 7]); B.add(tf(M_(G.sph, c), x - 1.2 + k * 0.6, 0.95, zz - side * 0.6, 0, 0, 0, 0.27, 0.2, 0.3), c); }   // spice heaps
    if (kind === 1) for (let k = 0; k < 6; k++) { const c = cm([0xb05a2a, 0x2a6a8a, 0xd8b040][k % 3]); B.add(tf(M_(onion, c), x - 1.3 + k * 0.52, 0.9, zz - side * 0.6, 0, 0, 0, 0.17, 0.2, 0.17), c); }   // jars / pots
    if (kind === 2) for (let k = 0; k < 3; k++) { const c = cm(goodsC[(k * 2 + i + 7) % 7]); B.add(tf(M_(G.box, c), x - 1 + k, 1.0, zz - side * 0.6, 0, 0, 0.0, 0.85, 0.12, 0.7), c); const c2 = cm(goodsC[(k * 2 + i + 8) % 7]); B.add(tf(M_(G.box, c2), x - 1 + k, 1.11, zz - side * 0.6, 0, 0.2, 0, 0.75, 0.1, 0.6), c2); }   // folded cloth
    if (kind === 3) for (let k = 0; k < 7; k++) { const c = cm([0xe8a020, 0xd04020, 0x6a9a2a][k % 3]); B.add(tf(M_(G.sph, c), x - 1.3 + k * 0.43, 1.0 + (k % 2) * 0.05, zz - side * 0.55, 0, 0, 0, 0.14, 0.14, 0.14), c); }   // fruit
    // hanging carpet on the back wall
    if (R() < 0.6) { const cp = stripe(['#8a2030', '#2a4a7a', '#a0602a'][i & 1 ? 0 : 1], '#e8c070', 9); B.add(tf(M_(G.box, cp), x + (R() - 0.5), 2.2, zz + side * 1.07, 0, 0, Math.PI / 2, 1.8, 1.3, 0.03), cp); }
    lanternHang(B, x + 1.2, 2.1, zz - side * 1.1, (i & 1) ? lampM : lampM2);
    COL.box(ZONES.BAZ[0] + x, zz - side * 0.6, 3.3, 1.0, 0, 0.92);
    BAZ.stalls.push([x, zz]); }
  // cloth strung across the street, high
  for (let i = -5; i <= 5; i += 2) { const c = awnings[(i + 10) % 5]; const m = M_(G.box, c); tf(m, i * 4 + 1, 4.2, 0, 0, 0.1, 0.05, 1.6, 0.03, 9.5); B.add(m, c); }
  // the dark arch (Vazir watches from here) at x=+14 on the north side
  arch(B, 14.5, -5.7, 2.6, 2.8, 0, st2);
  // dark alley behind the arch (where the vazir lurks)
  for (const x of [11.6, 17.4]) { B.add(tf(M_(G.box, st2), x, 2.6, -9.5, 0, 0, 0, 1.0, 5.2, 8), st2); COL.box(ZONES.BAZ[0] + x, -9.5, 1.0, 8, 0, 99); }
  B.add(tf(M_(G.box, st1), 14.5, 3.0, -13.6, 0, 0, 0, 7, 6, 0.8), st1); B.add(tf(M_(G.box, woodD), 14.5, 4.6, -9.5, 0, 0, 0, 6.2, 0.15, 6.5), woodD);
  for (const [x, zz] of [[12.6, -8.4], [16.4, -10.6]]) B.add(tf(M_(G.box, woodM), x, 0.4, zz, 0, 0.3, 0, 0.8, 0.8, 0.8), woodM);
  for (const [x, zz] of [[-24, -9], [24, 9], [-30, 6]]) palm(B, x, zz, 1, Math.abs(x), 0.25);
  // gates at both ends + distant domes
  arch(B, -27, 0, 5.4, 4.2, Math.PI / 2, st3); arch(B, 29, 0, 5.4, 4.2, Math.PI / 2, st3);
  skyline(B, 0, 0, 60, 18, 17, false); { const big = cm(0x2a7a9a); B.add(tf(M_(onion, big), -8, 9, -48, 0, 0, 0, 7, 7, 7), big); B.add(tf(M_(G.box, st3), -8, 4.5, -48, 0, 0, 0, 15, 9, 15), st3); minaret(B, 6, 0, -46, 22, st3, 0xe8c070); }
  B.build(z);
}
// =========================== OASIS (sunset) ===========================
export const OAS = {};
{ const z = Z.OAS, B = new Batch(); const g = new THREE.Mesh(new THREE.CircleGeometry(260, 48), sandM); g.rotation.x = -Math.PI / 2; z.add(g);
  const grassM = tm(0x5a8a34, { normalMap: NRM.rock, nScale: 0.5, repeat: [12, 12], rough: 0.95 }), grass2 = tm(0x4a8a3a, { rough: 0.7, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.CircleGeometry(15, 40), grassM); ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.01, -9); z.add(ring);
  OAS.waterMat = tm(0x2a7a8a, { normalMap: NRM.water, repeat: [6, 6], nScale: 0.35, rough: 0.05, metal: 0.0, env: 3.5, clear: 1, clearRough: 0.03 });
  const water = new THREE.Mesh(new THREE.CircleGeometry(10.5, 40), OAS.waterMat); water.rotation.x = -Math.PI / 2; water.position.set(0, 0.03, -11); z.add(water); OAS.water = water;
  COL.cyl(ZONES.OAS[0] + 0, -11, 10.2, 0.5);
  // shore rocks + reeds
  const rock = tm(0x8a7a6a, { normalMap: NRM.rock, rough: 0.8 }); const R = rng(5); const RG = [rockGeo(41, 2), rockGeo(42, 2), rockGeo(43, 2)];
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, r = 10.6 + R() * 0.6; const x = Math.cos(a) * r, zz = -11 + Math.sin(a) * r; if (zz > -2.4 && Math.abs(x) < 3.2) continue; B.add(tf(M_(RG[i % 3], rock), x, 0.1, zz, R(), R() * 3, 0, 0.5 + R() * 0.6, 0.35, 0.5 + R() * 0.4), rock); }
  for (let i = 0; i < 60; i++) { const a = R() * Math.PI * 2, r = 10.2 + R() * 1.4; const x = Math.cos(a) * r, zz = -11 + Math.sin(a) * r; if (zz > -3 && Math.abs(x) < 4) continue; B.add(tf(M_(G.cone, grass2), x, 0.4, zz, (R() - 0.5) * 0.3, 0, (R() - 0.5) * 0.3, 0.06, 0.8 + R() * 0.6, 0.06), grass2); }
  // a big flat sitting rock at the shore (the young man sits here)
  OAS.rock = [1.4, -0.2]; B.add(tf(M_(rockGeo(44, 3), rock), -2.6, 0.2, -1.6, 0, 0.4, 0, 0.8, 0.45, 0.6), rock);
  // palms around the lake (and the cluster the Vazir comes out of, east)
  const P = [[-7, 1.5, 1.1], [-11, -3, 1.2], [-12.5, -8, 1.0], [-11, -16, 1.15], [-6, -21, 1.0], [2, -23, 1.25], [9, -20, 1.0], [12.5, -14, 1.2], [12, -6, 1.1], [8.5, 2.0, 1.0], [10.5, 4.5, 1.25], [6.2, 5.2, 0.95], [-4.5, 4.5, 1.0], [-15, 6, 1.3], [17, 1, 1.1]];
  P.forEach(([x, zz, s], i) => { palm(B, x, zz, s, i + 3, 0.35); COL.cyl(ZONES.OAS[0] + x, zz, 0.3, 4); });
  for (let i = 0; i < 18; i++) { const x = (R() - 0.5) * 34, zz = -11 + (R() - 0.5) * 34; if (Math.hypot(x, zz + 11) < 12.5) continue; B.add(tf(M_(G.sph, grass2), x, 0.2, zz, 0, 0, 0, 0.6 + R() * 0.6, 0.4 + R() * 0.3, 0.6 + R() * 0.5), grass2); }
  dunes(B, 0, -8, 30, 30, 120, 31, duneM); dunes(B, 0, -8, 16, 130, 220, 32, duneM);
  B.build(z);
}
// =========================== PALACE ROOF + NIGHT CITY ===========================
export const PAL = {};
{ const z = Z.PAL, B = new Batch(), Bc = new Batch();
  const marble = tm(0xffffff, { map: painted('checker', { n: 8, a: '#efe8da', b: '#a88a6a', size: 256 }), repeat: [3, 3], rough: 0.4, env: 1.2, clear: 0.2, clearRough: 0.3 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 16), marble); floor.rotation.x = -Math.PI / 2; z.add(floor);
  // roof slab edge going down + palace body
  B.add(tf(M_(G.box, st3), 0, -6.2, 0, 0, 0, 0, 18, 12.3, 16), st3);
  // parapet with merlons (front edge open at the stairs side? no: all around, low)
  for (const [x, zz, w, d] of [[0, -8, 18, 0.4], [0, 8, 18, 0.4], [-9, 0, 0.4, 16], [9, 0, 0.4, 16]]) { B.add(tf(M_(G.box, st3), x, 0.45, zz, 0, 0, 0, w, 0.9, d), st3); COL.box(ZONES.PAL[0] + x, zz, w, d, 0, 0.9);
    const n = Math.round(Math.max(w, d) / 1.2); for (let i = 0; i < n; i++) { const u = (i + 0.5) / n - 0.5; B.add(tf(M_(G.box, st3), x + (w > d ? u * w : 0), 1.05, zz + (w > d ? 0 : u * d), 0, 0, 0, w > d ? 0.5 : 0.45, 0.35, w > d ? 0.45 : 0.5), st3); } }
  // the great dome behind the roof (north) + four minarets
  const dg = cm(0x3a9ab8, { rough: 0.3, env: 1.8, clear: 0.5 }); const drum = cm(0xeee4d2, { rough: 0.85 }); B.add(tf(M_(G.cyl, drum), 0, 2.2, -13.5, 0, 0, 0, 5.5, 4.4, 5.5), drum); B.add(tf(M_(onion, dg), 0, 4.4, -13.5, 0, 0, 0, 5.2, 5.2, 5.2), dg); B.add(tf(M_(G.cyl, gold), 0, 13, -13.5, 0, 0, 0, 0.08, 1.4, 0.08), gold);
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; B.add(tf(M_(G.box, lampM), Math.cos(a) * 5.55, 2.6, -13.5 + Math.sin(a) * 5.55, 0, -a, 0, 0.4, 1.4, 0.2), lampM); }
  for (const [x, zz] of [[-9.5, -8.5], [9.5, -8.5], [-9.5, 8.5], [9.5, 8.5]]) minaret(B, x, -12, zz, 22, st3, 0xe8c070);
  // roof dressing: flower pots, a pavilion (chhatri) with columns, hanging lanterns, a carpet on the floor
  const pot = tm(0xb05a2a), leaf = tm(0x3e7a3a), flw = [tm(0xe84a6a), tm(0xf0c040), tm(0xf0f0f0)];
  for (const [x, zz] of [[-7.8, -6.8], [7.8, -6.8], [-7.8, 6.8], [7.8, 6.8], [-7.8, 0], [7.8, 0]]) { B.add(tf(M_(onion, pot), x, 0, zz, 0, 0, 0, 0.35, 0.4, 0.35), pot); B.add(tf(M_(G.sph, leaf), x, 0.85, zz, 0, 0, 0, 0.5, 0.45, 0.5), leaf); for (let k = 0; k < 5; k++) B.add(tf(M_(G.sph, flw[k % 3]), x + Math.cos(k * 1.3) * 0.38, 1.0 + (k % 2) * 0.15, zz + Math.sin(k * 1.3) * 0.38, 0, 0, 0, 0.09, 0.09, 0.09), flw[k % 3]); COL.cyl(ZONES.PAL[0] + x, zz, 0.45, 1.2); }
  // pavilion at the west side
  for (const [x, zz] of [[-7.6, -4.2], [-5.4, -4.2], [-7.6, -2.0], [-5.4, -2.0]]) { B.add(tf(M_(G.cyl, st3), x, 1.4, zz, 0, 0, 0, 0.14, 2.8, 0.14), st3); COL.cyl(ZONES.PAL[0] + x, zz, 0.16, 2.8); }
  B.add(tf(M_(G.box, st3), -6.5, 2.9, -3.1, 0, 0, 0, 2.8, 0.25, 2.8), st3); { const pd = cm(0xe8c070); B.add(tf(M_(onion, pd), -6.5, 3.0, -3.1, 0, 0, 0, 1.1, 1.1, 1.1), pd); }
  lanternHang(B, -6.5, 2.2, -3.1); lanternHang(B, 5.5, 2.0, -7.4); lanternHang(B, -3, 2.0, -7.4);
  { const rug = stripe('#8a2030', '#e8c070', 12); const r = M_(G.box, rug); tf(r, 1.0, 0.012, 1.0, 0, 0.0, 0, 5, 0.02, 3.2); B.add(r, rug); }
  // ---- city far below: houses whose tops are 4..14 m under the roof, lit windows, domes, minarets ----
  const R = rng(91); for (let i = 0; i < 230; i++) { const a = R() * Math.PI * 2, r = 16 + Math.pow(R(), 0.8) * 150; const x = Math.cos(a) * r, zz = Math.sin(a) * r; const w = 4 + R() * 6, d = 4 + R() * 6, h = 4 + R() * 9; const top = -4 - R() * 10 - r * 0.02;
    house(Bc, x, top - h, zz, w, h, d, [st1, st2, st3][i % 3], { dome: R() < 0.22 ? domeCols[i % 5] : null, win: winM, litP: 0.55, ry: R() < 0.5 ? 0 : 0.3 }); if (R() < 0.05) minaret(Bc, x + w * 0.6, top - h, zz, h + 10 + R() * 8, st3, domeCols[(i + 1) % 5]); }
  // street lamps glowing in the dark streets
  for (let i = 0; i < 120; i++) { const a = R() * Math.PI * 2, r = 18 + R() * 120; Bc.add(tf(M_(G.sphLo, lampM2), Math.cos(a) * r, -18 + R() * 4, Math.sin(a) * r, 0, 0, 0, 0.35, 0.35, 0.35), lampM2); }
  const cityGround = new THREE.Mesh(new THREE.CircleGeometry(300, 40), tm(0x3a3040)); cityGround.rotation.x = -Math.PI / 2; cityGround.position.y = -26; z.add(noSh(cityGround));
  dunes(Bc, 0, 0, 30, 190, 280, 71, duneM);
  B.build(z); Bc.build(z, true);
  PAL.stars = stars(z, 420, 3);
  PAL.moon = noSh(sph(9, tm(0xfff2d0, { unlit: 1, emis: 0.5, noInk: 1 }), -90, 120, -250)); z.add(PAL.moon);
  PAL.moonHalo = noSh(sph(14, tm(0x6a7ab0, { unlit: 1, noInk: 1 }), -90, 120, -252)); PAL.moonHalo.scale.z = 0.1; z.add(PAL.moonHalo);
  PAL.sun = noSh(sph(10, tm(0xffd070, { unlit: 1, emis: 0.9, noInk: 1 }), 160, 8, -230)); z.add(PAL.sun);
}
// stars over the desert too? no (day). Clouds for sunset/dawn skies: soft flat banks
function cloudBank(parent, n, seed, col, y, dist) { const B = new Batch(); const R = rng(seed); const m = tm(col, { unlit: 0.6, noInk: 1, band: 0.3 }); for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2, d = dist * (0.8 + R() * 0.3); const cx = Math.cos(a) * d, cz = Math.sin(a) * d, cy = y + R() * 30;
  for (let k = 0; k < 5; k++) B.add(tf(M_(G.sphLo, m), cx + (k - 2) * 9 + R() * 4, cy + R() * 3, cz + R() * 6, 0, a, 0, 9 + R() * 6, 2.5 + R() * 2, 6), m); } const g = new THREE.Group(); B.build(g, true); parent.add(g); return g; }
export const CLOUDS = { DES: cloudBank(Z.DES, 10, 4, 0xffe8d8, 60, 300), OAS: cloudBank(Z.OAS, 14, 8, 0xf0a0a0, 45, 300), PAL: cloudBank(Z.PAL, 10, 12, 0x5a6080, 40, 300) };
