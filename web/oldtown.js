// oldtown.js : detailed old-town street kit (brick facades with framed windows, shutters, curtains, cornices, awnings, signs,
// boardwalk, muddy street with puddles, barrels, crates, lamps). Everything is merged per material (fast) and gets
// world-space UVs so bricks/planks never stretch.  const K = new Kit(scene);  K.facade({...});  K.finish();
import * as THREE from 'three';
import * as C from './core.js';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';
import { rng } from './core.js';

const cv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8; return t; };
const hx = (h) => '#' + new THREE.Color(h).getHexString();
function shadeHex(h, k) { const c = new THREE.Color(h); c.multiplyScalar(k); return '#' + c.getHexString(); }

export const TEX = {
  bricks: (base = '#b8643c', mortar = '#e8cfa8', seed = 3) => cv(512, 512, (g, W, H) => {
    const r = rng(seed); g.fillStyle = mortar; g.fillRect(0, 0, W, H); const rows = 16, bw = W / 4, bh = H / rows;
    for (let y = 0; y < rows; y++) for (let x = -1; x < 5; x++) {
      const ox = (y % 2) * bw / 2; const k = 0.86 + r() * 0.26; g.fillStyle = shadeHex(base, k);
      g.fillRect(x * bw + ox + 3, y * bh + 3, bw - 6, bh - 6);
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x * bw + ox + 3, y * bh + 3, bw - 6, 4);
      g.fillStyle = 'rgba(0,0,0,0.10)'; g.fillRect(x * bw + ox + 3, y * bh + bh - 9, bw - 6, 6);
    }
  }),
  planks: (base = '#9a6a3c', seed = 5, n = 6) => cv(512, 512, (g, W, H) => {
    const r = rng(seed); const ph = H / n; for (let i = 0; i < n; i++) { g.fillStyle = shadeHex(base, 0.85 + r() * 0.3); g.fillRect(0, i * ph, W, ph);
      g.strokeStyle = 'rgba(60,30,10,0.25)'; g.lineWidth = 2; for (let k = 0; k < 6; k++) { const yy = i * ph + 8 + r() * (ph - 16); g.beginPath(); g.moveTo(0, yy); g.bezierCurveTo(W * 0.3, yy + (r() - .5) * 8, W * 0.6, yy + (r() - .5) * 8, W, yy); g.stroke(); }
      g.fillStyle = 'rgba(30,15,5,0.85)'; g.fillRect(0, i * ph, W, 4); g.fillStyle = 'rgba(40,20,8,0.6)'; g.fillRect(r() * W * 0.8, i * ph, 4, ph);
      g.fillStyle = '#3a2a1a'; g.beginPath(); g.arc(20, i * ph + ph / 2, 4, 0, 7); g.arc(W - 20, i * ph + ph / 2, 4, 0, 7); g.fill(); }
  }),
  mud: () => cv(1024, 1024, (g, W, H) => {
    const r = rng(11); g.fillStyle = '#a07a4e'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${90 + r() * 60},${60 + r() * 40},${30 + r() * 30},${0.12 + r() * 0.15})`; g.beginPath(); g.ellipse(r() * W, r() * H, 20 + r() * 90, 10 + r() * 40, r() * 3, 0, 7); g.fill(); }
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(60,40,20,${0.2 + r() * 0.3})`; g.fillRect(r() * W, r() * H, 3, 3); }
    g.strokeStyle = 'rgba(70,45,22,0.35)'; g.lineWidth = 14; for (const x of [300, 380, 660, 740]) { g.beginPath(); g.moveTo(0, x); g.bezierCurveTo(W * .3, x + 10, W * .6, x - 12, W, x); g.stroke(); }
  }),
  stripes: (a = '#c8342a', b = '#f3e6c8') => cv(256, 64, (g, W, H) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * W / 8, 0, W / 8, H); } }),
  slats: (c = '#2f6b3a') => cv(128, 256, (g, W, H) => { g.fillStyle = c; g.fillRect(0, 0, W, H); for (let i = 0; i < 12; i++) { g.fillStyle = 'rgba(0,0,0,0.30)'; g.fillRect(8, 10 + i * 20, W - 16, 5); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(8, 15 + i * 20, W - 16, 3); } g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 8; g.strokeRect(4, 4, W - 8, H - 8); }),
  glass: (lit = false) => cv(128, 256, (g, W, H) => { const gr = g.createLinearGradient(0, 0, W, H); if (lit) { gr.addColorStop(0, '#ffe7a8'); gr.addColorStop(1, '#f2b45a'); } else { gr.addColorStop(0, '#5a7290'); gr.addColorStop(1, '#25324a'); } g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.moveTo(20, 0); g.lineTo(60, 0); g.lineTo(10, 120); g.lineTo(0, 120); g.closePath(); g.fill(); g.fillStyle = '#efe6d2'; g.fillRect(W / 2 - 4, 0, 8, H); g.fillRect(0, H / 2 - 4, W, 8); }),
  sign: (text, bg = '#2d5a34', fg = '#f4d27a', w = 1024, h = 256, font = 'serif') => { const t = cv(w, h, (g, W, H) => { g.fillStyle = bg; g.fillRect(0, 0, W, H); g.strokeStyle = fg; g.lineWidth = 10; g.strokeRect(16, 16, W - 32, H - 32); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; let fs = H * 0.62; g.font = `bold ${fs}px ${font}`; while (g.measureText(text).width > W * 0.86) { fs -= 4; g.font = `bold ${fs}px ${font}`; } g.lineWidth = 8; g.strokeStyle = 'rgba(0,0,0,0.55)'; g.strokeText(text, W / 2, H / 2 + 4); g.fillText(text, W / 2, H / 2 + 4); }); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; },
};

export class Kit {
  constructor(parent) { this.parent = parent; this.b = new Map(); this.mats = new Map(); this.solids = []; }
  mat(key, o) { if (!this.mats.has(key)) this.mats.set(key, { m: C.toon(o.map ? { ...o, repeat: [1, 1] } : o), uv: o.uv ?? 1, world: !!o.map && !o.local }); return key; }
  // add geometry to a material bucket (geo already in local space) with transform
  add(key, geo, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone(); const M = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(M); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    const info = this.mats.get(key); if (info.world) { const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv, s = 1 / info.uv; for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)); if (ay > 0.6) uv.setXY(i, p.getX(i) * s, p.getZ(i) * s); else if (ax > 0.6) uv.setXY(i, p.getZ(i) * s, p.getY(i) * s); else uv.setXY(i, p.getX(i) * s, p.getY(i) * s); } }
    if (!this.b.has(key)) this.b.set(key, []); this.b.get(key).push(g); return g;
  }
  box(key, w, h, d, x, y, z, ry = 0, rx = 0, rz = 0) { return this.add(key, new THREE.BoxGeometry(w, h, d), x, y, z, ry, rx, rz); }
  cyl(key, rt, rb, h, x, y, z, seg = 16, rx = 0, rz = 0, ry = 0) { return this.add(key, new THREE.CylinderGeometry(rt, rb, h, seg), x, y, z, ry, rx, rz); }
  finish() { for (const [k, arr] of this.b) { const m = new THREE.Mesh(mergeGeometries(arr), this.mats.get(k).m); this.parent.add(m); } this.b.clear(); }
}

// ---------- one building front (faces +z unless face=-1, then faces -z).  x0 = centre x, zf = front-face z ----------
export function facade(K, o) {
  const { x, zf, w = 8, floors = 4, fh = 2.6, cols = 3, face = 1, brick = 'brick', trim = 'trim', shut = 'shut', glass = 'glassD', glassLit = 'glassL', curtain = 'curtain', seed = 1, ground = 'shop', sign = null, awning = 'awning', base = 0.25 } = o;
  const r = rng(seed); const s = face; const d = 0.5; const H = floors * fh + 0.8;
  const P = (lx, ly, lz) => [x + lx * s, base + ly, zf + lz * s];   // local: lz>0 = towards street
  const ry = face === 1 ? 0 : Math.PI;
  const bx = (k, w2, h2, d2, lx, ly, lz) => { const p = P(lx, ly, lz); K.box(k, w2, h2, d2, p[0], p[1], p[2], ry); };
  bx(brick, w, H, d, 0, H / 2, -d / 2);
  K.solids.push([x, base + H / 2, zf - s * d / 2, w, H, d]);
  // floor bands + cornice + brackets
  for (let f = 1; f <= floors; f++) bx(trim, w + 0.1, 0.16, 0.12, 0, f * fh, 0.05);
  bx(trim, w + 0.5, 0.35, 0.5, 0, H - 0.2, 0.2); bx(trim, w + 0.7, 0.14, 0.62, 0, H + 0.02, 0.26); bx(brick, w + 0.1, 0.3, 0.2, 0, H - 0.55, 0.06);
  for (let i = 0; i <= 8; i++) bx(trim, 0.14, 0.32, 0.3, -w / 2 + 0.25 + i * (w - 0.5) / 8, H - 0.5, 0.15);
  // corner quoins (stone blocks sticking out) + pilasters
  for (const sd of [-1, 1]) for (let k = 0; k < Math.floor(H / 0.5); k++) bx(trim, k % 2 ? 0.42 : 0.62, 0.42, 0.1, sd * (w / 2 - (k % 2 ? 0.21 : 0.31)), 0.3 + k * 0.5, 0.04);
  // roof: pitched back roof + chimneys (silhouette depth)
  { const p = P(0, H + 0.6, -d - 1.4); K.box('roof', w + 0.2, 0.18, 3.4, p[0], p[1], p[2], ry, -s * 0.38); }
  for (const cx of [-w * 0.3, w * 0.28]) { bx(brick, 0.7, 1.6, 0.7, cx, H + 0.9, -d - 0.9); bx(trim, 0.86, 0.14, 0.86, cx, H + 1.72, -d - 0.9); }
  // windows on upper floors: RECESSED (deep reveal frame), real muntins, deep sills, pediments
  const cw = w / cols;
  for (let f = 1; f < floors; f++) for (let c = 0; c < cols; c++) {
    const lx = -w / 2 + cw * (c + 0.5), ly = f * fh + fh * 0.5 + 0.05, ww = Math.min(0.95, cw * 0.42), wh = 1.35;
    const lit = r() < 0.3, rd = 0.2;   // reveal depth
    bx(lit ? glassLit : glass, ww, wh, 0.04, lx, ly, 0.02);
    if (r() < 0.75) { bx(curtain, ww * 0.3, wh * 0.92, 0.03, lx - ww * 0.34, ly, 0.055); bx(curtain, ww * 0.3, wh * 0.92, 0.03, lx + ww * 0.34, ly, 0.055); }
    bx('reveal', 0.1, wh, rd, lx - ww / 2 - 0.05, ly, rd / 2); bx('reveal', 0.1, wh, rd, lx + ww / 2 + 0.05, ly, rd / 2); bx('reveal', ww + 0.2, 0.1, rd, lx, ly + wh / 2 + 0.05, rd / 2);
    bx(trim, 0.045, wh, 0.05, lx, ly, 0.08); bx(trim, ww, 0.045, 0.05, lx, ly + wh * 0.12, 0.08); bx(trim, ww, 0.045, 0.05, lx, ly - wh * 0.22, 0.08);   // muntins
    bx(trim, ww + 0.36, 0.11, 0.18, lx, ly + wh / 2 + 0.05, rd + 0.06); bx(trim, ww + 0.36, 0.11, 0.18, lx, ly - wh / 2 - 0.05, rd + 0.06);
    bx(trim, 0.11, wh + 0.2, 0.18, lx - ww / 2 - 0.16, ly, rd + 0.06); bx(trim, 0.11, wh + 0.2, 0.18, lx + ww / 2 + 0.16, ly, rd + 0.06);
    bx(trim, ww + 0.56, 0.12, 0.42, lx, ly - wh / 2 - 0.16, 0.24); bx(trim, 0.12, 0.16, 0.16, lx - ww / 2 - 0.1, ly - wh / 2 - 0.28, 0.12); bx(trim, 0.12, 0.16, 0.16, lx + ww / 2 + 0.1, ly - wh / 2 - 0.28, 0.12);  // sill + brackets
    if ((f + c + seed) % 3 === 0) { const p = P(lx, ly + wh / 2 + 0.36, 0.24); K.add(trim, new THREE.CylinderGeometry(0.01, (ww + 0.5) * 0.62, 0.3, 3, 1).rotateZ(0).rotateY(Math.PI / 6).scale(1, 1, 0.35), p[0], p[1], p[2], ry); }
    else { bx(trim, ww + 0.5, 0.22, 0.3, lx, ly + wh / 2 + 0.28, 0.18); bx(trim, ww + 0.66, 0.07, 0.4, lx, ly + wh / 2 + 0.42, 0.22); }
    if (r() < 0.85) { const open = r() < 0.5 ? 0 : 0.9; for (const sd of [-1, 1]) { const sx = lx + sd * (ww / 2 + 0.24 + ww * 0.22); const p = P(sx + (open ? sd * 0.12 : 0), ly, rd + 0.1 + (open ? 0.18 : 0)); K.box(shut, ww * 0.44, wh, 0.07, p[0], p[1], p[2], ry + sd * open * 0.9); } }
    if (r() < 0.3) { bx('pot', ww * 0.9, 0.2, 0.24, lx, ly - wh / 2 - 0.0, 0.34); for (let k = 0; k < 5; k++) { const p = P(lx - ww * 0.4 + k * ww * 0.2, ly - wh / 2 + 0.16, 0.34); K.add('flower', new THREE.IcosahedronGeometry(0.085, 0), p[0], p[1], p[2]); } }
  }
  // balcony (on request) across floor 2
  if (o.balcony) { const by = fh + 0.15; bx(trim, w * 0.6, 0.14, 1.0, 0, by, 0.5); bx('iron', w * 0.6, 0.05, 0.05, 0, by + 0.95, 1.0); for (let k = 0; k <= 22; k++) bx('iron', 0.03, 0.9, 0.03, -w * 0.3 + k * w * 0.6 / 22, by + 0.5, 1.0); for (const sd of [-1, 1]) bx('iron', 0.05, 0.05, 1.0, sd * w * 0.3, by + 0.95, 0.5); for (const sd of [-1, 0, 1]) bx(trim, 0.16, 0.5, 0.5, sd * w * 0.27, by - 0.3, 0.25); }
  // ground floor: door + shop windows + awning + sign
  const gy = fh * 0.5;
  bx(trim, w + 0.1, 0.25, 0.14, 0, 0.12, 0.05);
  bx('doorDark', 1.0, 2.1, 0.06, 0, 1.05 + 0.12, 0.0); bx('door', 0.42, 1.9, 0.06, -0.24, 1.07, 0.03); bx('door', 0.42, 1.9, 0.06, 0.24, 1.07, 0.03);
  bx(trim, 1.3, 0.16, 0.18, 0, 2.3, 0.08); bx(trim, 0.14, 2.2, 0.18, -0.6, 1.1, 0.08); bx(trim, 0.14, 2.2, 0.18, 0.6, 1.1, 0.08);
  for (const sd of [-1, 1]) { const lx = sd * (w / 4 + 0.4), ww = w / 2 - 1.8; bx(ground === 'shop' ? glass : brick, ww, 1.6, 0.04, lx, 1.35, 0.01); bx(trim, ww + 0.2, 0.12, 0.2, lx, 2.2, 0.08); bx(trim, ww + 0.3, 0.2, 0.3, lx, 0.5, 0.12); bx(trim, 0.1, 1.6, 0.16, lx - ww / 2 - 0.05, 1.35, 0.07); bx(trim, 0.1, 1.6, 0.16, lx + ww / 2 + 0.05, 1.35, 0.07); bx(trim, 0.06, 1.6, 0.1, lx, 1.35, 0.05);
    for (let k = 0; k < 3; k++) bx(r() < 0.5 ? 'crate' : 'goods', 0.25, 0.25, 0.25, lx - 0.4 + k * 0.4, 0.73, -0.05); }
  for (const px of [-w / 2 + 0.35, -0.85, 0.85, w / 2 - 0.35]) { bx(trim, 0.3, 2.45, 0.24, px, 1.23, 0.1); bx(trim, 0.42, 0.18, 0.32, px, 2.5, 0.12); bx(trim, 0.4, 0.2, 0.32, px, 0.1, 0.12); }
  bx(trim, w + 0.2, 0.3, 0.34, 0, 2.62, 0.14);
  if (awning) for (let i = 0; i < 1; i++) { const p = P(0, 2.75, 0.6); K.box(awning, w - 0.6, 0.06, 1.3, p[0], p[1], p[2], ry, s * 0.32); const p2 = P(0, 2.53, 1.22); K.box(awning, w - 0.6, 0.28, 0.04, p2[0], p2[1], p2[2], ry); }
  if (sign) { const p = P(0, fh + 0.62, 0.2); K.box(sign, Math.min(w - 1, 4.4), 0.8, 0.08, p[0], p[1], p[2], ry); bx(trim, Math.min(w - 1, 4.4) + 0.2, 0.96, 0.06, 0, fh + 0.62, 0.15); }
  return { top: base + H };
}

export function barrel(K, x, y, z, s = 1) { K.cyl('barrel', 0.3 * s, 0.26 * s, 0.85 * s, x, y + 0.425 * s, z, 16); for (const h of [0.12, 0.42, 0.72]) K.cyl('hoop', 0.315 * s, 0.315 * s, 0.05 * s, x, y + h * s, z, 16); K.cyl('barrelTop', 0.27 * s, 0.27 * s, 0.02, x, y + 0.86 * s, z, 16); }
export function crate(K, x, y, z, s = 0.6, ry = 0) { K.box('crate', s, s, s, x, y + s / 2, z, ry); K.box('crateEdge', s * 1.02, s * 0.12, s * 1.02, x, y + s * 0.06, z, ry); K.box('crateEdge', s * 1.02, s * 0.12, s * 1.02, x, y + s * 0.94, z, ry); }
export function lamp(K, x, y, z) { K.cyl('iron', 0.05, 0.07, 3.0, x, y + 1.5, z, 10); K.cyl('iron', 0.12, 0.14, 0.2, x, y + 0.1, z, 10); K.box('lampGlass', 0.26, 0.36, 0.26, x, y + 3.2, z); K.cyl('iron', 0.02, 0.2, 0.16, x, y + 3.46, z, 4); K.box('iron', 0.3, 0.05, 0.3, x, y + 3.0, z); }
