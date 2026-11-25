// props3d.js : detailed 3D vehicles & landscape props for the "3D world + flat 2D people" style.
//   const car = makeClassicCar({ paint:'#5fd0c8', paint2:'#f4ecd6' }); W.add(car.group); car.drive(x, z, heading, distance)
//   car.seat(i) -> world position for a bust Flat2D driver/passenger card (i=0 driver, 1 passenger)
import * as THREE from 'three';
import * as C from './core.js';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';
import { rng } from './core.js';

const mc = new Map(); const M = (hex, o = {}) => { const k = hex + JSON.stringify(o); if (!mc.has(k)) mc.set(k, C.toon({ color: new THREE.Color(hex), ...o })); return mc.get(k); };
const mesh = (geo, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.rotation.set(rx, ry, rz); return me; };
const rbox = (w, h, d, r) => new RoundedBoxGeometry(w, h, d, 4, Math.min(r, Math.min(w, h, d) / 2.05));

// ---------------- classic 1950s-style car (fictional design) ----------------
export function makeClassicCar(o = {}) {
  const P = M(o.paint || '#56c8c0'), P2 = M(o.paint2 || '#f4ecd6'), CH = M('#e8eef4', { band: 0.25 }), BLK = M('#1c1a1e'), SEAT = M(o.seat || '#a8302c'), DASH = M('#3a2a26');
  const LAMP = M('#fff6d0', { emis: 0.9, unlit: 1 }), TAIL = M('#e8302a', { emis: 0.4 }), TYRE = M('#232126'), WW = M('#f6f2ea');
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const add = (m) => (body.add(m), m);
  // lower body + side spear
  add(mesh(rbox(4.5, 0.5, 1.78, 0.2), P, 0, 0.62, 0));
  add(mesh(rbox(4.3, 0.06, 1.81, 0.03), P2, -0.05, 0.66, 0));
  // hood (slightly domed) & trunk deck
  add(mesh(rbox(1.55, 0.22, 1.62, 0.1), P, 1.35, 0.94, 0)); add(mesh(rbox(1.0, 0.2, 1.62, 0.1), P, -1.72, 0.92, 0));
  add(mesh(new THREE.BoxGeometry(1.3, 0.03, 0.06), P2, 1.4, 1.06, 0));                         // hood stripe
  // cabin: hollow tub (sides, back, floor) so people can sit INSIDE
  for (const s of [-1, 1]) add(mesh(rbox(1.75, 0.32, 0.1, 0.04), P, -0.2, 0.98, s * 0.84));
  add(mesh(rbox(0.12, 0.32, 1.6, 0.04), P, -1.12, 0.98, 0)); add(mesh(new THREE.BoxGeometry(1.7, 0.05, 1.6), DASH, -0.2, 0.86, 0));
  add(mesh(rbox(0.16, 0.3, 1.58, 0.05), DASH, 0.6, 1.0, 0));                                       // dashboard
  // seats (bench front + back)
  add(mesh(rbox(0.42, 0.18, 1.5, 0.07), SEAT, 0.0, 0.98, 0)); add(mesh(rbox(0.14, 0.46, 1.5, 0.06), SEAT, -0.22, 1.18, 0));
  add(mesh(rbox(0.42, 0.18, 1.5, 0.07), SEAT, -0.72, 0.98, 0)); add(mesh(rbox(0.14, 0.46, 1.5, 0.06), SEAT, -0.96, 1.18, 0));
  // steering wheel + column
  const sw = new THREE.Group(); sw.position.set(0.48, 1.08, 0.36); sw.rotation.set(0, Math.PI / 2, 0); sw.rotateX(-0.9);
  sw.add(mesh(new THREE.TorusGeometry(0.17, 0.022, 8, 28), BLK)); sw.add(mesh(new THREE.BoxGeometry(0.32, 0.025, 0.025), BLK)); body.add(sw);
  add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.4), BLK, 0.55, 1.1, 0.36, 0, 0, 1.0));
  // roof (two-tone) on thin pillars, windshield frame (open, no glass so riders stay visible)
  add(mesh(rbox(1.5, 0.08, 1.62, 0.04), P2, -0.42, 1.62, 0));
  for (const s of [-1, 1]) { add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55), CH, 0.42, 1.38, s * 0.76, 0, 0, -0.45)); add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5), P2, -1.08, 1.38, s * 0.76, 0, 0, 0.25)); }
  add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.52), CH, 0.54, 1.13, 0, Math.PI / 2)); add(mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.52), CH, 0.31, 1.6, 0, Math.PI / 2));
  // fenders over each wheel (half tubes), slightly bulged
  const PD = M(o.paint || '#56c8c0', { side: THREE.DoubleSide });
  for (const x of [1.35, -1.35]) for (const s of [-1, 1]) add(mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.34, 24, 1, true, Math.PI / 2, Math.PI), PD, x, 0.42, s * 0.76, Math.PI / 2, 0, 0));
  // grille: chrome frame + bars, bumpers, headlights, tail fins + lights, door handles, hood ornament
  add(mesh(rbox(0.12, 0.34, 1.3, 0.05), CH, 2.24, 0.66, 0)); for (let i = -5; i <= 5; i++) add(mesh(new THREE.BoxGeometry(0.04, 0.26, 0.03), BLK, 2.3, 0.66, i * 0.105));
  add(mesh(new THREE.CapsuleGeometry(0.08, 1.75, 4, 10), CH, 2.32, 0.42, 0, Math.PI / 2)); add(mesh(new THREE.CapsuleGeometry(0.08, 1.75, 4, 10), CH, -2.3, 0.44, 0, Math.PI / 2));
  for (const s of [-1, 1]) {
    add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 20), CH, 2.18, 0.86, s * 0.68, 0, 0, Math.PI / 2)); add(mesh(new THREE.SphereGeometry(0.12, 16, 10), LAMP, 2.23, 0.86, s * 0.68));
    add(mesh(rbox(0.7, 0.26, 0.12, 0.05), P, -2.0, 1.08, s * 0.78)); add(mesh(new THREE.BoxGeometry(0.06, 0.16, 0.1), TAIL, -2.36, 1.04, s * 0.78));
    add(mesh(new THREE.BoxGeometry(0.16, 0.03, 0.03), CH, -0.1, 0.96, s * 0.9));
    add(mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16), BLK, 0.62, 1.24, s * 0.8));
    add(mesh(new THREE.BoxGeometry(0.03, 0.08, 0.14), CH, 0.64, 1.3, s * 0.86));            // side mirrors
  }
  add(mesh(new THREE.ConeGeometry(0.04, 0.16, 8), CH, 2.06, 1.1, 0, 0, 0, -Math.PI / 2));
  // wheels: tyre + whitewall + chrome hub + cap (spin with distance)
  const wheels = [];
  for (const x of [1.35, -1.35]) for (const s of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(x, 0.36, s * 0.8);
    w.add(mesh(new THREE.TorusGeometry(0.27, 0.1, 12, 30), TYRE)); w.add(mesh(new THREE.TorusGeometry(0.22, 0.03, 8, 30), WW, 0, 0, s * 0.07));
    w.add(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.14, 24), CH, 0, 0, 0, Math.PI / 2)); w.add(mesh(new THREE.SphereGeometry(0.07, 12, 8), CH, 0, 0, s * 0.08));
    for (let k = 0; k < 4; k++) w.add(mesh(new THREE.BoxGeometry(0.02, 0.24, 0.02), BLK, 0, 0, s * 0.075, 0, 0, k * Math.PI / 4));
    g.add(w); wheels.push(w);
  }
  g.traverse((m) => { if (m.isMesh) m.userData.car = true; });
  const api = {
    group: g, body, wheels, steer: sw,
    drive(x, z, heading = 0, dist = 0, bounce = 0) { g.position.set(x, 0, z); g.rotation.y = heading; for (const w of wheels) w.rotation.z = -dist / 0.37; body.position.y = bounce; },
    seat(i = 0) { return g.localToWorld(new THREE.Vector3(-0.05 - (i > 1 ? 0.7 : 0), 0.9, i % 2 ? -0.38 : 0.38)); },
  };
  return api;
}

// ---------------- ferris wheel (rotating) ----------------
export function makeFerris(o = {}) {
  const g = new THREE.Group(), rot = new THREE.Group(); const R = o.r || 9; const FR = M(o.frame || '#f2f2f2'), RED = M('#e2463a'), Y = M('#f4c63a'), B = M('#3a7ad8');
  for (const s of [-1, 1]) { rot.add(mesh(new THREE.TorusGeometry(R, 0.12, 8, 64), FR, 0, 0, s * 0.6)); rot.add(mesh(new THREE.TorusGeometry(R * 0.55, 0.08, 6, 48), FR, 0, 0, s * 0.6)); }
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; const sp = mesh(new THREE.CylinderGeometry(0.05, 0.05, R), FR); sp.position.set(Math.cos(a) * R / 2, Math.sin(a) * R / 2, 0); sp.rotation.z = a - Math.PI / 2; rot.add(sp); }
  const cabs = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const c = new THREE.Group(); c.position.set(Math.cos(a) * R, Math.sin(a) * R, 0); c.add(mesh(rbox(0.9, 0.8, 0.9, 0.2), [RED, Y, B][i % 3], 0, -0.7, 0)); c.add(mesh(new THREE.ConeGeometry(0.6, 0.35, 12), FR, 0, -0.18, 0)); rot.add(c); cabs.push(c); }
  rot.add(mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.6, 16), FR, 0, 0, 0, Math.PI / 2));
  rot.position.y = R + 1.5; g.add(rot);
  for (const s of [-1, 1]) for (const d of [-1, 1]) { const l = mesh(new THREE.CylinderGeometry(0.14, 0.18, R + 2.6), FR); l.position.set(d * R * 0.28, (R + 1.5) / 2, s * 0.9); l.rotation.z = d * 0.3; g.add(l); }
  return { group: g, update(t) { rot.rotation.z = t * (o.speed || 0.12); for (const c of cabs) c.rotation.z = -rot.rotation.z; } };
}

// ---------------- landscape helpers (into a Kit) ----------------
export function tree(K, x, z, s = 1, seed = 1, leaf = 'leaf') {
  const r = rng(seed); K.cyl('bark', 0.12 * s, 0.2 * s, 2.0 * s, x, 1.0 * s, z, 8);
  const n = 5 + Math.floor(r() * 3); for (let i = 0; i < n; i++) { const a = r() * 6.28, d = (i ? 0.55 + r() * 0.4 : 0) * s, rr = (0.75 + r() * 0.45) * s * (i ? 1 : 1.25); const gg = new THREE.IcosahedronGeometry(rr, 1); K.add(i % 2 ? leaf : leaf + '2', gg, x + Math.cos(a) * d, (2.2 + r() * 0.9) * s + (i ? 0 : 0.5 * s), z + Math.sin(a) * d); }
}
export function pine(K, x, z, s = 1) { K.cyl('bark', 0.1 * s, 0.14 * s, 1.0 * s, x, 0.5 * s, z, 6); for (let i = 0; i < 3; i++) K.add('pine', new THREE.ConeGeometry((1.3 - i * 0.32) * s, 1.5 * s, 9), x, (1.4 + i * 0.85) * s, z); }
// grass blades: thousands of thin triangles merged (no ink, two-sided)
export function grass(K, x0, x1, z0, z1, n, seed = 1, keys = ['blade', 'blade2', 'blade3'], h = [0.22, 0.5], avoid = null) {
  const r = rng(seed); const pos = [], buckets = keys.map(() => []);
  for (let i = 0; i < n; i++) { const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0); if (avoid && avoid(x, z)) continue; const hh = h[0] + r() * (h[1] - h[0]), w = 0.014 + r() * 0.014, a = r() * 6.28, lean = (r() - 0.5) * 0.25;
    const ca = Math.cos(a) * w, sa = Math.sin(a) * w; buckets[i % keys.length].push(x - ca, 0, z - sa, x + ca, 0, z + sa, x + lean * hh, hh, z + lean * hh * 0.5); }
  buckets.forEach((b, i) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(b, 3)); g.computeVertexNormals(); const nn = g.attributes.normal; for (let k = 0; k < nn.count; k++) nn.setXYZ(k, 0, 1, 0); g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(b.length / 3 * 2), 2)); K.add(keys[i], g); });
}
