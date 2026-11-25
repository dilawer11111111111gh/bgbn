// train.js : detailed 3D steam train (loco + tender + coach) with swappable FLAT / CONE wheel treads,
// a track system (lines + arcs, arc-length param, derail-off-the-tangent), and a flat 2D cartoon horse card.
import * as THREE from 'three';
import * as C from './core.js';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';

const mc = new Map(); const M = (hex, o = {}) => { const k = hex + JSON.stringify(o); if (!mc.has(k)) mc.set(k, C.toon({ color: new THREE.Color(hex), ...o })); return mc.get(k); };
const mesh = (geo, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.rotation.set(rx, ry, rz); return me; };
const rbox = (w, h, d, r) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, Math.min(w, h, d) / 2.05));
const cylX = (r, len, m, x, y, z, seg = 28) => mesh(new THREE.CylinderGeometry(r, r, len, seg), m, x, y, z, 0, 0, Math.PI / 2);
const G = 0.75;   // half gauge
export const RAIL_TOP = 0.39;   // rails: centre 0.32, height 0.14 -> wheels sit ON this

// one wheel (axle along z). kind: 'flat' | 'cone'.  side: +1 / -1 (cone: FAT on the inside = toward the centre of the train)
function wheel(r, side, kind, cols) {
  const g = new THREE.Group(), spin = new THREE.Group(); g.add(spin);
  const tread = kind === 'cone' ? new THREE.CylinderGeometry(r * (side > 0 ? 0.86 : 1.0), r * (side > 0 ? 1.0 : 0.86), 0.2, 32) : new THREE.CylinderGeometry(r, r, 0.2, 32);
  spin.add(mesh(tread, cols.steel, 0, 0, 0, Math.PI / 2));
  spin.add(mesh(new THREE.CylinderGeometry(r * 1.08, r * 1.08, 0.04, 32), cols.steel, 0, 0, -side * 0.11, Math.PI / 2));   // flange (inside)
  spin.add(mesh(new THREE.TorusGeometry(r * 0.88, r * 0.06, 8, 32), cols.wheel, 0, 0, side * 0.06));
  const n = r > 0.6 ? 12 : 8; for (let i = 0; i < n; i++) spin.add(mesh(new THREE.BoxGeometry(0.05, r * 0.86, 0.05), cols.wheel, 0, 0, side * 0.06, 0, 0, i * Math.PI / n));
  spin.add(mesh(new THREE.CylinderGeometry(r * 0.2, r * 0.2, 0.16, 16), cols.wheel, 0, 0, side * 0.06, Math.PI / 2));
  if (r > 0.6) spin.add(mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.5, 0.06, 16, 1, false, 0, Math.PI * 0.6), cols.wheel, 0, 0, side * 0.07, Math.PI / 2));
  g.userData = { r, spin, side }; return g;
}

export function makeTrain(o = {}) {
  const cols = { body: M(o.body || '#b8302a'), dark: M('#1e1c22'), gold: M('#e8b83a', { band: 0.2 }), steel: M('#9aa2ac'), wheel: M(o.wheel || '#c8302a'), wood: M('#8a5a32'),
    cream: M('#f2e2b8'), lamp: M('#fff2b0', { emis: 1.0, unlit: 1 }), glass: M('#2a3448'), coal: M('#26242a'), roof: M('#3a3236') };
  const all = []; const wheels = [];
  const addWheels = (grp, list, kind) => { for (const [x, r] of list) for (const s of [-1, 1]) { const w = wheel(r, s, kind, cols); w.position.set(x, r + 0.02, s * G); grp.add(w); wheels.push(w); } };
  // ---------------- locomotive ----------------
  const loco = new THREE.Group(); all.push(loco);
  loco.add(mesh(new THREE.BoxGeometry(7.6, 0.32, 1.5), cols.dark, 0.6, 1.05, 0));
  loco.add(cylX(0.82, 4.8, cols.body, 1.4, 2.15, 0)); for (const x of [-0.6, 0.6, 1.8, 3.0]) loco.add(cylX(0.85, 0.12, cols.gold, x, 2.15, 0));
  loco.add(cylX(0.9, 0.9, cols.dark, 4.15, 2.15, 0)); loco.add(mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.06, 28), cols.dark, 4.62, 2.15, 0, 0, 0, Math.PI / 2)); loco.add(mesh(new THREE.SphereGeometry(0.16, 12, 8), cols.gold, 4.66, 2.15, 0));
  loco.add(mesh(new THREE.CylinderGeometry(0.24, 0.3, 1.0, 16), cols.dark, 4.0, 3.3, 0)); loco.add(mesh(new THREE.CylinderGeometry(0.62, 0.26, 0.75, 18), cols.dark, 4.0, 4.1, 0)); loco.add(mesh(new THREE.CylinderGeometry(0.66, 0.62, 0.12, 18), cols.gold, 4.0, 4.5, 0));
  loco.add(mesh(new THREE.SphereGeometry(0.42, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), cols.gold, 2.3, 2.95, 0)); loco.add(mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.25, 18), cols.gold, 2.3, 2.92, 0));
  loco.add(mesh(new THREE.SphereGeometry(0.34, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), cols.body, 0.6, 2.92, 0)); loco.add(mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.2, 16), cols.body, 0.6, 2.9, 0));
  const bell = mesh(new THREE.CylinderGeometry(0.12, 0.24, 0.3, 14), cols.gold, 3.2, 3.15, 0); loco.add(bell);
  loco.add(mesh(rbox(0.5, 0.5, 0.5, 0.06), cols.dark, 4.4, 3.2, 0)); loco.add(mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 16), cols.lamp, 4.67, 3.2, 0, 0, 0, Math.PI / 2)); loco.add(mesh(new THREE.ConeGeometry(0.3, 0.25, 4), cols.dark, 4.4, 3.56, 0, 0, Math.PI / 4));
  // cab (open back, window frames, curved roof)
  const cab = new THREE.Group(); cab.position.set(-1.6, 0, 0); loco.add(cab);
  for (const s of [-1, 1]) { cab.add(mesh(new THREE.BoxGeometry(1.9, 1.0, 0.08), cols.body, 0, 1.7, s * 0.98)); cab.add(mesh(new THREE.BoxGeometry(0.25, 1.1, 0.08), cols.body, 0.83, 2.75, s * 0.98)); cab.add(mesh(new THREE.BoxGeometry(0.25, 1.1, 0.08), cols.body, -0.83, 2.75, s * 0.98)); cab.add(mesh(new THREE.BoxGeometry(1.9, 0.08, 0.1), cols.gold, 0, 2.22, s * 0.99)); }
  cab.add(mesh(new THREE.BoxGeometry(0.08, 2.1, 2.0), cols.body, 0.95, 2.25, 0)); cab.add(mesh(new THREE.BoxGeometry(0.1, 0.7, 0.8), cols.glass, 0.98, 2.75, 0.45)); cab.add(mesh(new THREE.BoxGeometry(0.1, 0.7, 0.8), cols.glass, 0.98, 2.75, -0.45));
  cab.add(mesh(new THREE.CylinderGeometry(1.25, 1.25, 2.3, 24, 1, false, -0.7, 1.4), cols.roof, 0, 2.15, 0, Math.PI / 2, 0, Math.PI / 2));
  cab.add(mesh(new THREE.BoxGeometry(1.9, 0.12, 1.96), cols.wood, 0, 1.25, 0));
  // pistons + cowcatcher + side tanks + pipes
  for (const s of [-1, 1]) { loco.add(cylX(0.3, 1.0, cols.dark, 3.5, 1.2, s * 0.95)); loco.add(mesh(new THREE.BoxGeometry(5.0, 0.12, 0.08), cols.gold, 1.4, 1.35, s * 0.86)); loco.add(cylX(0.06, 4.2, cols.gold, 1.8, 2.75, s * 0.7)); }
  for (let i = 0; i < 7; i++) { const z = -0.7 + i * 0.233; const sl = mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), cols.body, 5.0 - Math.abs(z) * 0.5, 0.55, z, 0, 0, -0.55); loco.add(sl); }
  loco.add(mesh(new THREE.BoxGeometry(0.2, 0.2, 1.6), cols.dark, 4.7, 0.95, 0));
  addWheels(loco, [[-0.5, 0.82], [1.35, 0.82], [3.25, 0.42], [4.1, 0.42]], o.kind || 'flat');
  const rods = []; for (const s of [-1, 1]) { const rod = mesh(new THREE.BoxGeometry(1.95, 0.1, 0.05), cols.steel, 0.42, 0.82, s * 0.98); loco.add(rod); rods.push(rod); }
  // ---------------- tender ----------------
  const tender = new THREE.Group(); all.push(tender);
  tender.add(mesh(rbox(4.0, 1.4, 2.0, 0.12), cols.dark, 0, 1.75, 0)); tender.add(mesh(new THREE.BoxGeometry(4.04, 0.12, 2.04), cols.gold, 0, 2.2, 0)); tender.add(mesh(new THREE.BoxGeometry(4.04, 0.1, 2.04), cols.body, 0, 1.25, 0));
  for (let i = 0; i < 14; i++) tender.add(mesh(new THREE.DodecahedronGeometry(0.32 + (i % 3) * 0.08, 0), cols.coal, -1.5 + (i % 7) * 0.5, 2.55 + (i % 2) * 0.15, -0.5 + Math.floor(i / 7) * 0.9));
  tender.add(mesh(new THREE.BoxGeometry(4.0, 0.25, 1.5), cols.dark, 0, 0.95, 0));
  addWheels(tender, [[-1.3, 0.45], [-0.4, 0.45], [0.5, 0.45], [1.4, 0.45]], o.kind || 'flat');
  // ---------------- coach ----------------
  const coach = new THREE.Group(); all.push(coach);
  coach.add(mesh(new THREE.BoxGeometry(7.2, 0.3, 1.6), cols.dark, 0, 1.0, 0));
  coach.add(mesh(rbox(6.6, 1.9, 2.2, 0.08), cols.cream, 0, 2.15, 0)); coach.add(mesh(new THREE.BoxGeometry(6.64, 0.3, 2.24), cols.body, 0, 1.4, 0)); coach.add(mesh(new THREE.BoxGeometry(6.64, 0.12, 2.24), cols.gold, 0, 2.95, 0));
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { coach.add(mesh(new THREE.BoxGeometry(0.6, 0.65, 0.04), cols.glass, -2.6 + i * 1.04, 2.3, s * 1.11)); coach.add(mesh(new THREE.BoxGeometry(0.72, 0.08, 0.06), cols.gold, -2.6 + i * 1.04, 1.94, s * 1.12)); }
  coach.add(mesh(new THREE.CylinderGeometry(1.6, 1.6, 7.3, 24, 1, false, -0.75, 1.5), cols.roof, 0, 1.75, 0, Math.PI / 2, 0, Math.PI / 2));
  for (const x of [-3.5, 3.5]) { coach.add(mesh(new THREE.BoxGeometry(0.5, 0.1, 1.7), cols.wood, x, 1.2, 0)); for (const s of [-1, 1]) coach.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8), cols.gold, x + Math.sign(x) * 0.2, 1.6, s * 0.8)); }
  addWheels(coach, [[-2.6, 0.45], [-1.7, 0.45], [1.7, 0.45], [2.6, 0.45]], o.kind || 'flat');
  const cars = [[loco, 0], [tender, -6.1], [coach, -12.3]];       // offsets along the track (front of loco = +4.9)
  const api = {
    cars: all, loco, tender, coach, wheels, bell, rods, cols,
    // place by a track function: posAt(s) -> {p: Vector3, h: heading, roll, y}
    place(posAt, s, dist) {
      for (const [g, off] of cars) { const a = posAt(s + off - 2.5), b = posAt(s + off + 2.5); const mid = a.p.clone().lerp(b.p, 0.5); g.position.copy(mid); g.position.y += (a.y + b.y) / 2;
        g.rotation.set(0, -Math.atan2(b.p.z - a.p.z, b.p.x - a.p.x), 0); g.rotateX((a.roll + b.roll) / 2); g.rotateZ(Math.atan2((b.y - a.y), 5) + ((a.pitch || 0) + (b.pitch || 0)) / 2); }
      for (const w of wheels) w.userData.spin.rotation.z = -dist / w.userData.r;
      for (let i = 0; i < 2; i++) { const a = -dist / 0.82; rods[i].position.set(0.42 + Math.cos(a) * 0.32, 0.82 + Math.sin(a) * 0.32, rods[i].position.z); }
    },
    chimney() { return loco.localToWorld(new THREE.Vector3(4.0, 4.6, 0)); },
    cabSeat() { return loco.localToWorld(new THREE.Vector3(-1.75, 2.02, 0.35)); },
    pilot() { return loco.localToWorld(new THREE.Vector3(5.05, 0.75, 0)); },
    wheelWorld(i = 0) { return wheels[i].getWorldPosition(new THREE.Vector3()); },
  };
  return api;
}

// standalone wheelset (axle + 2 wheels) for explanations. kind 'flat' | 'cone'
export function makeWheelset(kind = 'cone', r = 0.8, o = {}) {
  const cols = { steel: M(o.steel || '#b8c0ca'), wheel: M(o.wheel || '#c8302a') }; const g = new THREE.Group(); const ws = [];
  for (const s of [-1, 1]) { const w = wheel(r, s, kind, cols); w.position.set(0, r, s * G); g.add(w); ws.push(w); }
  g.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, G * 2 + 0.3, 16), M('#5a5a62'), 0, r, 0, Math.PI / 2)); return { group: g, wheels: ws };
}
// ---------------- track ----------------
// segs: [{line: len} | {arc: radius, ang: radians (+ = left turn)}], start {x,z,h}
export function makeTrack(K, start, segs, o = {}) {
  const pts = []; let x = start.x, z = start.z, h = start.h || 0, s = 0; const ds = 0.25;
  pts.push({ x, z, h, s, curve: 0 });
  for (const sg of segs) {
    if (sg.line) { const n = Math.ceil(sg.line / ds); for (let i = 0; i < n; i++) { x += Math.cos(h) * ds; z -= Math.sin(h) * ds; s += ds; pts.push({ x, z, h, s, curve: 0 }); } }
    else { const n = Math.ceil(Math.abs(sg.arc * sg.ang) / ds), dh = sg.ang / n, step = Math.abs(sg.arc * sg.ang) / n; for (let i = 0; i < n; i++) { h += dh / 2; x += Math.cos(h) * step; z -= Math.sin(h) * step; h += dh / 2; s += step; pts.push({ x, z, h, s, curve: Math.sign(sg.ang) }); } }
  }
  const L = s;
  const at = (q) => { if (q <= 0) { const p = pts[0]; return { x: p.x + Math.cos(p.h) * q, z: p.z - Math.sin(p.h) * q, h: p.h }; } if (q >= L) { const p = pts[pts.length - 1]; return { x: p.x + Math.cos(p.h) * (q - L), z: p.z - Math.sin(p.h) * (q - L), h: p.h }; }
    const i = Math.min(pts.length - 2, Math.floor(q / ds)); let j = i; while (j < pts.length - 2 && pts[j + 1].s < q) j++; while (j > 0 && pts[j].s > q) j--; const a = pts[j], b = pts[j + 1], u = (q - a.s) / Math.max(1e-6, b.s - a.s); return { x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u, h: a.h + (b.h - a.h) * u }; };
  // geometry: ballast, sleepers, two rails (outer/inner rails get their own material keys so they can glow in the explanation)
  if (K) {
    const rk = o.railKeys || ['rail', 'rail'];
    for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, hh = (a.h + b.h) / 2, len = Math.hypot(b.x - a.x, b.z - a.z) + 0.02;
      K.box('ballast', len + 0.05, 0.12, 3.0, mx, 0.06, mz, hh);
      for (const sd of [-1, 1]) { const ox = -Math.sin(hh) * G * sd, oz = -Math.cos(hh) * G * sd; const key = a.curve ? (sd * a.curve > 0 ? rk[1] : rk[0]) : 'rail'; K.box(key, len, 0.14, 0.09, mx + ox, 0.32, mz + oz, hh); } }
    for (let q = 0.3; q < L; q += 0.62) { const p = at(q); K.box('tie', 0.26, 0.12, 2.3, p.x, 0.19, p.z, p.h); }
  }
  // posAt for the train: derail = {s: where it leaves, stop: s where it stops, hop: height}
  const posAt = (q, der) => { let p; let y = 0, roll = 0, pitch = 0;
    if (der && q > der.s) { const d = at(der.s); const qq = Math.min(q, der.stop); const e = qq - der.s; p = { x: d.x + Math.cos(d.h) * e, z: d.z - Math.sin(d.h) * e, h: d.h }; y = (der.hop || 0) * Math.max(0, Math.sin(Math.min(1, e / (der.len || 8)) * Math.PI)); roll = (der.roll || 0) * Math.min(1, e / 4); }
    else p = at(q);
    return { p: new THREE.Vector3(p.x, RAIL_TOP - 0.02, p.z), h: p.h, y, roll, pitch }; };
  return { at, posAt, L, pts };
}

// ---------------- flat 2D cartoon horse (card) ----------------
const INK = '#2a1810';
export class Horse2D {
  constructor(o = {}) { this.o = { coat: '#9a5a2e', mane: '#3a2216', size: 2.9, res: 1.4, ...o }; const S = this.o.res; this.cv = document.createElement('canvas'); this.cv.width = 640 * S; this.cv.height = 512 * S; this.g = this.cv.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.NoColorSpace; this.tex.anisotropy = 8;
    const h = this.o.size, w = h * 1.25; const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h / 2, 0); this.mesh = new THREE.Mesh(geo, C.cardMat(this.tex)); this.mesh.frustumCulled = false; C.stage.cards.add(this.mesh); this.pos = new THREE.Vector3(); this.h = h; }
  place(x, y, z) { this.pos.set(x, y, z); return this; }
  backWorld() { return this.pos.clone().add(new THREE.Vector3(0, this.h * 0.55, 0)); }
  update(p = {}, cam) {
    const g = this.g, S = this.o.res, o = this.o; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.cv.width, this.cv.height); g.setTransform(S, 0, 0, S, 0, 0);
    if (p.flip) { g.translate(640, 0); g.scale(-1, 1); }
    const ph = p.gallop || 0, bob = Math.sin(ph * 2) * 8; g.lineCap = 'round'; g.lineJoin = 'round';
    // legs (two pairs, gallop)
    const leg = (x, y, a, b) => { g.strokeStyle = INK; g.lineWidth = 22; g.beginPath(); const k = [x + Math.sin(a) * 80, y + Math.cos(a) * 80]; g.moveTo(x, y); g.lineTo(...k); g.lineTo(k[0] + Math.sin(a + b) * 75, k[1] + Math.cos(a + b) * 75); g.stroke(); g.strokeStyle = o.coat; g.lineWidth = 13; g.stroke(); g.fillStyle = '#2a2020'; g.beginPath(); g.ellipse(k[0] + Math.sin(a + b) * 75, k[1] + Math.cos(a + b) * 75 + 4, 13, 9, 0, 0, 7); g.fill(); };
    leg(200, 300 + bob, 0.7 * Math.sin(ph), 0.5 + 0.4 * Math.sin(ph + 1)); leg(230, 300 + bob, 0.7 * Math.sin(ph + 2.5), 0.5); leg(420, 300 + bob, 0.7 * Math.sin(ph + 1.2), -0.6); leg(450, 300 + bob, 0.7 * Math.sin(ph + 3.6), -0.5 - 0.3 * Math.sin(ph));
    // tail
    g.strokeStyle = INK; g.lineWidth = 34; g.beginPath(); g.moveTo(160, 250 + bob); g.quadraticCurveTo(90, 250 + Math.sin(ph * 2) * 30, 70, 330); g.stroke(); g.strokeStyle = o.mane; g.lineWidth = 24; g.stroke();
    // body
    g.fillStyle = o.coat; g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.ellipse(320, 270 + bob, 175, 82, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); g.ellipse(320, 305 + bob, 150, 40, 0, 0, Math.PI); g.fill();
    // neck + head
    g.fillStyle = o.coat; g.beginPath(); g.moveTo(430, 230 + bob); g.quadraticCurveTo(470, 120 + bob, 520, 100 + bob); g.lineTo(560, 140 + bob); g.quadraticCurveTo(520, 200 + bob, 490, 290 + bob); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(560, 130 + bob, 70, 40, 0.5, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#f2d8b0'; g.beginPath(); g.ellipse(600, 158 + bob, 26, 20, 0.5, 0, 7); g.fill(); g.stroke();
    g.fillStyle = INK; g.beginPath(); g.arc(555, 112 + bob, 9, 0, 7); g.fill(); g.beginPath(); g.arc(606, 162 + bob, 4, 0, 7); g.fill();
    g.fillStyle = o.coat; g.beginPath(); g.moveTo(520, 92 + bob); g.lineTo(512, 55 + bob); g.lineTo(538, 86 + bob); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = o.mane; g.beginPath(); g.moveTo(518, 90 + bob); for (let i = 0; i < 6; i++) g.lineTo(500 - i * 14 + (i % 2) * 10, 110 + i * 26 + bob + (i % 2 ? 14 : 0)); g.lineTo(450, 220 + bob); g.quadraticCurveTo(480, 150 + bob, 518, 90 + bob); g.fill(); g.stroke();
    // saddle
    if (o.saddle !== false) { g.fillStyle = '#6a3a1e'; g.beginPath(); g.ellipse(300, 196 + bob, 70, 26, 0, Math.PI, 0); g.fill(); g.stroke(); g.fillStyle = '#c8302a'; g.fillRect(250, 200 + bob, 100, 50); g.strokeRect(250, 200 + bob, 100, 50); }
    this.tex.needsUpdate = true; this.mesh.position.copy(this.pos); if (cam) this.mesh.rotation.y = Math.atan2(cam.x - this.pos.x, cam.z - this.pos.z);
  }
}
