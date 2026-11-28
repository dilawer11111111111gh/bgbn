// cars.js (Studio v9.1): real car shapes, not boxes. The body is LOFTED from rounded cross-sections along the length
// (hood slope, wheel-arch cut-outs, tumblehome), a glass greenhouse with pillars, real wheels (rubber tyre with tread +
// sidewall, 5-spoke alloy rim, brake disc, black wheel-well liners), head/tail lights, grille, mirrors, handles, plate.
//   import { realCar } from '../../web/cars.js';
//   const car = realCar('#d8283a', { type: 'sedan' | 'hatch' | 'suv' | 'taxi' | 'sports' }); scene.add(car);  // front = +x
//   car.userData.spin(dist)  rolls the wheels for a travelled distance (m)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { V } from './realkit.js';

const TYPES = {
  sedan: { L: 4.6, W: 1.84, belt: 1.0, roof: 1.44, hood: 0.84, tail: 0.95, cab: [-1.3, -0.95, -0.05, 0.85], wb: [1.38, -1.32], R: 0.34 },
  hatch: { L: 4.1, W: 1.78, belt: 0.98, roof: 1.48, hood: 0.84, tail: 1.0, cab: [-1.95, -1.8, -0.1, 0.7], wb: [1.25, -1.25], R: 0.32 },
  suv: { L: 4.7, W: 1.9, belt: 1.18, roof: 1.78, hood: 1.02, tail: 1.15, cab: [-2.15, -1.95, 0.0, 0.85], wb: [1.42, -1.38], R: 0.39 },
  sports: { L: 4.5, W: 1.9, belt: 0.86, roof: 1.22, hood: 0.66, tail: 0.86, cab: [-1.2, -0.7, -0.1, 0.95], wb: [1.38, -1.3], R: 0.34 },
};
TYPES.taxi = TYPES.sedan;
const sgn = Math.sign, pw = (v, e) => sgn(v) * Math.abs(v) ** e;
const smooth = (a, b, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };

function loft(stations, section, M) {   // stations: [x...]; section(x, j/M) -> [y, z]  → closed tube geometry (grid)
  const N = stations.length, pos = [], uv = [], idx = [];
  for (let i = 0; i < N; i++) for (let j = 0; j <= M; j++) { const [y, z] = section(stations[i], (j % M) / M); pos.push(stations[i], y, z); uv.push(i / (N - 1), j / M); }
  for (let i = 0; i < N - 1; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j, b = a + M + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
let TREAD = null;
function treadTex() { if (TREAD) return TREAD; const c = document.createElement('canvas'); c.width = 512; c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#2a2a2c'; g.fillRect(0, 0, 512, 64);
  g.fillStyle = '#111113'; for (let i = 0; i < 64; i++) { const x = i * 8; g.beginPath(); g.moveTo(x, 8); g.lineTo(x + 4, 8); g.lineTo(x + 8, 32); g.lineTo(x + 4, 56); g.lineTo(x, 56); g.lineTo(x + 4, 32); g.fill(); }
  g.fillRect(0, 30, 512, 4); TREAD = new THREE.CanvasTexture(c); TREAD.wrapS = THREE.RepeatWrapping; return TREAD; }

function wheel(R, mats) {
  const G = new THREE.Group(), tw = 0.24;
  // tyre: lathe of a rounded rubber profile (sidewall bulge + tread), axis = local y → rotated to z
  const prof = []; const ri = R * 0.66; for (let k = 0; k <= 16; k++) { const a = -Math.PI / 2 + k / 16 * Math.PI; prof.push(new THREE.Vector2(R - 0.05 + Math.cos(a) * 0.05 + (Math.abs(Math.sin(a)) < 0.7 ? 0 : 0), Math.sin(a) * tw / 2)); }
  prof.unshift(new THREE.Vector2(ri, -tw / 2 + 0.01)); prof.push(new THREE.Vector2(ri, tw / 2 - 0.01));
  const ty = new THREE.LatheGeometry(prof, 48); ty.rotateX(Math.PI / 2); const tyre = new THREE.Mesh(ty, mats.tyre); G.add(tyre);
  // tread ring
  const tr = new THREE.CylinderGeometry(R + 0.002, R + 0.002, tw * 0.78, 64, 1, true); tr.rotateX(Math.PI / 2); G.add(new THREE.Mesh(tr, mats.tread));
  // brake disc + caliper
  const disc = new THREE.CylinderGeometry(ri * 0.82, ri * 0.82, 0.03, 32); disc.rotateX(Math.PI / 2); const dm = new THREE.Mesh(disc, mats.disc); dm.position.z = -0.02; G.add(dm);
  const cal = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.06), mats.caliper); cal.position.set(-ri * 0.55, ri * 0.35, 0.01); G.add(cal);
  // 5-spoke alloy: disc shape with 5 window holes, extruded + bevelled
  const sh = new THREE.Shape(); sh.absarc(0, 0, ri, 0, Math.PI * 2, false);
  for (let s = 0; s < 5; s++) { const a0 = s / 5 * Math.PI * 2 + 0.22, a1 = a0 + Math.PI * 2 / 5 - 0.44; const h = new THREE.Path(); h.moveTo(Math.cos(a0) * ri * 0.36, Math.sin(a0) * ri * 0.36);
    h.lineTo(Math.cos(a0) * ri * 0.86, Math.sin(a0) * ri * 0.86); h.absarc(0, 0, ri * 0.86, a0, a1, false); h.lineTo(Math.cos(a1) * ri * 0.36, Math.sin(a1) * ri * 0.36); h.absarc(0, 0, ri * 0.36, a1, a0, true); sh.holes.push(h); }
  const rim = new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 2, curveSegments: 40 }); rim.translate(0, 0, 0.05); G.add(new THREE.Mesh(rim, mats.rim));
  const lip = new THREE.TorusGeometry(ri, 0.018, 8, 48); lip.translate(0, 0, 0.1); G.add(new THREE.Mesh(lip, mats.rim));
  const hub = new THREE.CylinderGeometry(0.06, 0.07, 0.05, 20); hub.rotateX(Math.PI / 2); hub.translate(0, 0, 0.11); G.add(new THREE.Mesh(hub, mats.badge));
  for (let k = 0; k < 5; k++) { const n = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 8), mats.rim); n.rotation.x = Math.PI / 2; const a = k / 5 * Math.PI * 2; n.position.set(Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0.1); G.add(n); }
  return G;
}

export function realCar(color = '#d8283a', o = {}) {
  const T = { ...TYPES[o.type || 'sedan'], ...(o.dims || {}) }; const HL = T.L / 2, HW = T.W / 2, R = T.R; const G = new THREE.Group();
  const env = o.envI ?? 1.2;
  const mats = {
    paint: new THREE.MeshPhysicalMaterial({ color, metalness: 0.55, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: env }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x10161e, metalness: 0.4, roughness: 0.04, clearcoat: 1, envMapIntensity: 1.6 }),
    black: new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.55, metalness: 0.2 }),
    trim: new THREE.MeshStandardMaterial({ color: 0x1c1c20, roughness: 0.35, metalness: 0.4 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.08 }),
    tyre: new THREE.MeshStandardMaterial({ color: 0x1e1e20, roughness: 0.92 }), tread: new THREE.MeshStandardMaterial({ map: treadTex(), roughness: 0.95 }),
    rim: new THREE.MeshStandardMaterial({ color: 0xc8ccd4, metalness: 0.9, roughness: 0.22 }), disc: new THREE.MeshStandardMaterial({ color: 0x6a6a70, metalness: 0.8, roughness: 0.4 }),
    caliper: new THREE.MeshStandardMaterial({ color: o.caliper || 0xd8283a, roughness: 0.4 }), badge: new THREE.MeshStandardMaterial({ color: 0xdadde4, metalness: 1, roughness: 0.15 }),
    head: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4e0, emissiveIntensity: o.lights ? 3 : 0.9, roughness: 0.1 }),
    tail: new THREE.MeshStandardMaterial({ color: 0xa0101a, emissive: 0xff1a2a, emissiveIntensity: o.lights ? 2.5 : 0.7, roughness: 0.2 }),
    amber: new THREE.MeshStandardMaterial({ color: 0xffa020, emissive: 0xff8a10, emissiveIntensity: 0.5, roughness: 0.2 }),
    plate: new THREE.MeshStandardMaterial({ color: 0xf2e8c8, roughness: 0.5 }),
  };
  // --- lower body ---
  const N = 64, xs = Array.from({ length: N }, (_, i) => -HL * Math.cos(Math.PI * i / (N - 1)));
  const arch = (x) => { let y = 0.24; for (const xw of T.wb) { const d = Math.abs(x - xw), Ra = R + 0.09; if (d < Ra) y = Math.max(y, R + Math.sqrt(Ra * Ra - d * d) + 0.01); } return y; };
  const topY = (x) => { const front = T.wb[0] - 0.2, rear = T.wb[1] + 0.1; if (x > front) { const u = (x - front) / (HL - front); return lerp3(T.belt - 0.04, T.hood, T.hood - 0.18, u); } if (x < rear) { const u = (rear - x) / (HL + rear); return lerp3(T.belt, T.tail, T.tail - 0.12, u); } return T.belt; };
  function lerp3(a, b, c, u) { return u < 0.7 ? a + (b - a) * smooth(0, 0.7, u) : b + (c - b) * smooth(0.7, 1, u); }
  const halfW = (x) => HW * (1 - Math.abs(x / HL) ** 6) ** (1 / 6);
  const bodyS = (x, v) => { const a = v * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); const yb = arch(x), yt = topY(x), mid = (yb + yt) / 2, hh = (yt - yb) / 2;
    const w = halfW(x) * (1 - 0.07 * Math.max(0, s)); return [mid + hh * pw(s, 0.22), w * pw(c, 0.2)]; };   // low exponents = crisp, car-like shoulders
  const body = new THREE.Mesh(loft(xs, bodyS, 48), mats.paint); body.castShadow = body.receiveShadow = true; G.add(body);
  // underbody / sills (dark) so the arches read as holes
  // --- greenhouse (glass) + roof (paint) ---
  const [cr, rr, rf, cf] = T.cab; const roofY = (x) => { if (x > cf) return T.belt; if (x > rf) return T.belt + (T.roof - T.belt) * smooth(cf, rf, x); if (x > rr) return T.roof - 0.02 * Math.abs((x - (rf + rr) / 2) / ((rf - rr) / 2)); if (x > cr) return T.belt + (T.roof - T.belt) * smooth(cr, rr, x); return T.belt; };
  const cxs = Array.from({ length: 40 }, (_, i) => cr + (cf - cr) * i / 39);
  const cabS = (x, v) => { const a = v * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); const y0 = topY(x) - 0.02, y1 = Math.max(y0 + 0.001, roofY(x)); const mid = (y0 + y1) / 2, hh = (y1 - y0) / 2;
    const wb = halfW(x) * 0.93, wt = wb * 0.8; const w = s > 0 ? wb + (wt - wb) * s : wb; return [mid + hh * pw(s, 0.45), w * pw(c, 0.25)]; };
  const cab = new THREE.Mesh(loft(cxs, cabS, 40), mats.glass); G.add(cab);
  const roof = new THREE.Mesh(loft(Array.from({ length: 20 }, (_, i) => rr - 0.06 + (rf - rr + 0.18) * i / 19), (x, v) => { const a = v * Math.PI * 2; const y = roofY(x) + 0.012; return [y + 0.035 * Math.sin(a), halfW(x) * 0.93 * 0.8 * 0.97 * Math.cos(a)]; }, 24), mats.paint); roof.castShadow = true; G.add(roof);
  // pillars (A, B, C) + belt chrome
  const pillar = (x0, x1, mat = mats.trim, th = 0.06) => { for (const sd of [-1, 1]) { const a = V(x0, topY(x0), sd * halfW(x0) * 0.9), b = V(x1, roofY(x1) + 0.01, sd * halfW(x1) * 0.93 * 0.8); const d = b.clone().sub(a); const m = new THREE.Mesh(new THREE.BoxGeometry(th, d.length(), 0.03), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); G.add(m); } };
  pillar(cf - 0.02, rf + 0.04, mats.paint, 0.09); pillar((rf + rr) / 2 - 0.1, (rf + rr) / 2 - 0.1, mats.trim, 0.1); pillar(cr + 0.02, rr - 0.04, mats.paint, 0.18);
  for (const sd of [-1, 1]) { const pts = cxs.filter((x) => x > cr + 0.05 && x < cf - 0.05).map((x) => V(x, topY(x) + 0.005, sd * (halfW(x) * 0.935))); const c = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.012, 6), mats.chrome); G.add(c); }
  // --- wheels + liners ---
  const wheels = []; for (const xw of T.wb) for (const sd of [-1, 1]) { const w = wheel(R, mats); w.position.set(xw, R, sd * (HW - 0.17)); if (sd < 0) w.rotation.y = Math.PI; G.add(w); wheels.push(w);
    const ln = new THREE.CylinderGeometry(R + 0.1, R + 0.1, 0.36, 24, 1, true, Math.PI / 2, Math.PI); /* upper half = the wheel well */ ln.rotateX(Math.PI / 2); const lm = new THREE.Mesh(ln, new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 1, side: THREE.BackSide })); lm.position.set(xw, R, sd * (HW - 0.22)); G.add(lm); }
  // --- face: grille, lights, bumper, plates ---
  const nose = HL - 0.02, hy = T.hood - 0.08;
  const gr = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, HW * 0.9), mats.black); gr.position.set(nose - 0.01, hy - 0.16, 0); G.add(gr);
  for (let k = 0; k < 3; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.012, HW * 0.86), mats.chrome); s.position.set(nose, hy - 0.22 + k * 0.05, 0); G.add(s); }
  const intake = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, HW * 1.1), mats.black); intake.position.set(nose - 0.03, 0.4, 0); G.add(intake);
  for (const sd of [-1, 1]) { const hl = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), mats.head); hl.scale.set(0.06, 0.06, 0.2); hl.position.set(nose - 0.06, hy - 0.04, sd * (HW - 0.3)); G.add(hl);
    const drl = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.018, 0.3), mats.head); drl.position.set(nose - 0.04, hy - 0.12, sd * (HW - 0.32)); G.add(drl);
    const tl = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), mats.tail); tl.scale.set(0.05, 0.07, 0.3); tl.position.set(-HL + 0.05, T.tail - 0.1, sd * (HW - 0.3)); G.add(tl);
    const ind = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.12), mats.amber); ind.position.set(nose - 0.08, 0.5, sd * (HW - 0.18)); G.add(ind);
    // mirror
    const mx = cf - 0.12, my = topY(mx) + 0.1; const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.12), mats.trim); arm.position.set(mx, my - 0.04, sd * (halfW(mx) + 0.02)); G.add(arm);
    const mir = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), mats.paint); mir.scale.set(0.07, 0.07, 0.11); mir.position.set(mx - 0.02, my, sd * (halfW(mx) + 0.1)); G.add(mir);
    // door handles + door seams
    for (const hx of [0.15, -0.75]) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, 0.02), mats.chrome); h.position.set(hx, T.belt - 0.1, sd * (halfW(hx) - 0.005)); G.add(h); }
    for (const sx of [0.55, -0.32, -1.15]) { const seam = new THREE.Mesh(new THREE.BoxGeometry(0.006, T.belt - 0.42, 0.006), mats.black); seam.position.set(sx, (T.belt + 0.34) / 2 + 0.02, sd * (halfW(sx) + 0.002)); G.add(seam); } }
  const pl = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.11, 0.48), mats.plate); pl.position.set(nose + 0.005, 0.5, 0); G.add(pl); const pr = pl.clone(); pr.position.set(-HL + 0.01, T.tail - 0.3, 0); G.add(pr);
  const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 20), mats.badge); badge.rotation.z = Math.PI / 2; badge.position.set(nose + 0.02, hy - 0.14, 0); G.add(badge);
  if (o.type === 'taxi') { const sign = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.16), new THREE.MeshStandardMaterial({ color: 0xffe060, emissive: 0xffc020, emissiveIntensity: 0.6 })); sign.position.set((rf + rr) / 2, T.roof + 0.1, 0); G.add(sign); }
  G.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  G.userData.spin = (dist) => { for (const w of wheels) w.rotation.z = -dist / R * (w.rotation.y ? -1 : 1); };
  G.userData.mats = mats; return G;
}
