// camkit.js (Studio v9.2): named camera MOVES on top of Cine — so every beat gets a different, energetic move.
//   import { camkit } from '../../web/camkit.js';  const K = camkit(CINE);
//   K.crash(t0, t1, HERO)  K.orbit(..)  K.vertigo(..)  K.whip(..)  K.dutch(..)  K.low(..)  K.top(..)  K.crane(..)
//   K.handheld(..)  K.ots(t0, t1, A, B)  K.track(t0, t1, F, offset)  K.objectCam(t0, t1, objFn, offset)  K.drone(t0, t1, center, from, to)
//   K.auto(beats)  — beats: [[t0, t1, F, 'close'|'med'|'wide'|'insert'], ...] → picks a different move each time (never the same twice).
// Every function takes F = a Flat2D (or anything with headWorld()/bodyWorld()) and o = { size, az, el, fov, dy } overrides.
import * as THREE from 'three';
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export function camkit(CINE) {
  const head = (F, dy = -0.1) => () => F.headWorld().add(V(0, dy, 0)), body = (F, dy = 0.3) => () => F.bodyWorld().add(V(0, dy, 0));
  const u = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
  const K = {
    crash: (a, b, F, o = {}) => CINE.shot(a, b, { rig: 'push', at: head(F, o.dy), size: o.size ?? 1.1, az: o.az ?? 12, el: o.el ?? 0, fov: o.fov ?? 32, push: 1.25, zoomK: [[a + 0.02, o.zoom ?? 1.55, 0.05]], shake: 1.2 }),
    orbit: (a, b, F, o = {}) => CINE.shot(a, b, { rig: 'push', at: body(F, o.dy ?? 0.5), size: o.size ?? 2.2, az: [o.az ?? -40, (o.az ?? -40) + (o.sweep ?? 80)], el: o.el ?? 4, fov: o.fov ?? 34, push: 1.05 }),
    vertigo: (a, b, F, o = {}) => CINE.shot(a, b, { rig: 'push', at: head(F, o.dy), size: o.size ?? 1.3, az: o.az ?? 0, el: o.el ?? 0, fov: [o.fov0 ?? 22, o.fov1 ?? 62], push: 1 }),   // dolly-zoom: same framing, the world stretches
    whip: (a, b, F, o = {}) => CINE.shot(a, b, { rig: 'push', at: body(F, o.dy ?? 0.4), size: o.size ?? 1.8, az: [o.az0 ?? -75, o.az ?? 10], el: o.el ?? 2, fov: o.fov ?? 34, ease: 'out', fovKick: 10, push: 1.1 }),
    dutch: (a, b, F, o = {}) => CINE.shot(a, b, { rig: 'push', at: head(F, o.dy ?? -0.2), size: o.size ?? 1.4, az: o.az ?? 25, el: o.el ?? 4, fov: o.fov ?? 32, roll: o.roll ?? 0.2, push: 1.2 }),
    low: (a, b, F, o = {}) => CINE.shot(a, b, { rig: 'push', at: body(F, o.dy ?? 0.6), size: o.size ?? 2.8, az: o.az ?? -18, el: o.el ?? -22, fov: o.fov ?? 36, push: 1.15 }),
    top: (a, b, F, o = {}) => CINE.shot(a, b, { rig: 'push', at: body(F, 0), size: o.size ?? 4, az: o.az ?? 0, el: o.el ?? 78, fov: o.fov ?? 40, push: 1.2 }),
    crane: (a, b, F, o = {}) => CINE.shot(a, b, { rig: 'push', at: body(F, o.dy ?? 0.5), size: [o.size0 ?? 1.6, o.size ?? 4], az: o.az ?? 10, el: [o.el0 ?? 0, o.el ?? 55], fov: o.fov ?? 38, push: 1 }),
    handheld: (a, b, F, o = {}) => CINE.shot(a, b, { rig: 'push', at: body(F, o.dy ?? 0.6), size: o.size ?? 1.9, az: o.az ?? 20, el: o.el ?? 0, fov: o.fov ?? 34, shake: o.shake ?? 3.5, push: 1.1 }),
    ots: (a, b, A, B, o = {}) => CINE.shot(a, b, { rig: 'pov', from: () => { const pa = A.headWorld(), pb = B.headWorld(); const d = pb.clone().sub(pa).setY(0).normalize(); const side = V(-d.z, 0, d.x); return pa.clone().addScaledVector(d, -(o.back ?? 1.1)).addScaledVector(side, (o.side ?? 0.45)).add(V(0, o.up ?? 0.15, 0)); }, at: () => B.headWorld().add(V(0, -0.25, 0)), fov: o.fov ?? 40, push: 1, drift: [0, 0] }),
    track: (a, b, F, off = [-2.5, 1.2, 3], o = {}) => CINE.shot(a, b, { rig: 'pov', from: () => F.bodyWorld().add(V(...off)), at: () => F.bodyWorld().add(V(0, 0.5, 0)), fov: o.fov ?? 40, push: 1, drift: [0, 0], shake: 1.5 }),
    objectCam: (a, b, obj, off = [0, 0.3, 1.2], o = {}) => CINE.shot(a, b, { rig: 'pov', from: (t) => obj(t).clone().add(V(...off)), at: (t) => obj(t + 0.05).clone().add(V(...(o.lookOff || [0, 0, -1]))), fov: o.fov ?? 50, push: 1, drift: [0, 0] }),
    drone: (a, b, center, from = [20, 40, 30], to = [6, 4, 10], o = {}) => CINE.shot(a, b, { rig: 'pov', from: (t) => { const k = u(t, a, b) ** 0.8; return center.clone().add(V(...from).lerp(V(...to), k)); }, at: () => center.clone().add(V(0, o.lookY ?? 1, 0)), fov: o.fov ?? 48, push: 1, drift: [0, 0] }),
  };
  const ROT = { close: ['crash', 'dutch', 'vertigo', 'handheld'], med: ['orbit', 'low', 'whip', 'handheld', 'crane'], wide: ['crane', 'top', 'orbit', 'low'], insert: ['handheld', 'crash'] };
  K.auto = (beats) => { let last = ''; beats.forEach(([a, b, F, kind = 'med', o = {}], i) => { const list = ROT[kind] || ROT.med; let m = list[i % list.length]; if (m === last) m = list[(i + 1) % list.length]; last = m; K[m](a, b, F, o); }); };
  return K;
}
