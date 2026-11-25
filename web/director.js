// director.js : the camera DIRECTOR. You describe WHAT the moment is (a story beat); it picks the right kind of shot
// the way a real cinematographer would, and never repeats the same shot type twice in a row.
//   import { direct, SHOTS, BEATS } from '../../web/director.js';
//   direct(CINE, [ {t0:0, t1:1.2, beat:'establish', at: carFn, heading: 0},
//                  {t0:1.2, t1:2.0, beat:'move', at: carFn, heading: 0},
//                  {t0:2.0, t1:2.6, shot:'pov', from: kidEyes, at: carFn}, ... ])
// at / from are functions t -> Vector3 (use .pure = true for time-pure targets).  heading = direction of travel (radians, 0 = +x).
import * as THREE from 'three';
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const deg = (r) => (r * 180) / Math.PI;
// az in cine.js: 0 = camera on +z side, 90 = camera on +x side.  A subject moving along heading h (0 = +x) is seen:
const azFront = (h) => 90 - deg(h), azBack = (h) => -90 - deg(h), azSide = (h, s = 1) => (s > 0 ? 0 : 180) - deg(h);

// ---- shot vocabulary: what each shot is FOR, and how it is built ----
export const SHOTS = {
  drone:     { for: 'new place, show the whole world & its scale, travel between places', make: (b) => ({ rig: 'crane', size: [b.big ?? 34, b.mid ?? 14], el: [48, 26], az: [b.az ?? -30, (b.az ?? -30) + 35], fov: [48, 42], shake: 0.12, ap: 0.25 }) },
  droneTop:  { for: 'layout / plan / pattern of things (map view, crowd, track shape)', make: (b) => ({ rig: 'crane', size: [b.big ?? 24, b.mid ?? 16], el: [86, 80], az: [b.az ?? 0, (b.az ?? 0) + 60], fov: 44, shake: 0.08, ap: 0.2 }) },
  craneDown: { for: 'arriving INTO a place, from the sky down to the people', make: (b) => ({ rig: 'crane', size: [b.big ?? 16, b.size ?? 3], el: [55, 6], az: [b.az ?? 20, (b.az ?? 20) - 15], fov: [44, 34], shake: 0.2, ap: 1.5 }) },
  craneUp:   { for: 'ending, aftermath, "and that is how…", leaving the scene', make: (b) => ({ rig: 'crane', size: [b.size ?? 2.5, b.big ?? 14], el: [6, 52], az: [b.az ?? -15, (b.az ?? -15) + 20], fov: [34, 44], shake: 0.15, ap: 1 }) },
  dollyIn:   { for: 'realisation, tension, an important word, "but then…"', make: (b) => ({ rig: 'push', size: [(b.size ?? 1.4) * 2.2, b.size ?? 1.4], az: [b.az ?? 8, (b.az ?? 8) - 6], el: [5, 3], fov: [34, 30], ease: 'inOut', shake: 0.3, ap: 5 }) },
  dollyOut:  { for: 'REVEAL of consequence or scale ("…the whole building was in the air")', make: (b) => ({ rig: 'push', size: [b.size ?? 1.3, b.big ?? 7], az: [b.az ?? -6, (b.az ?? -6) + 18], el: [4, 14], fov: [30, 38], ease: 'inOut', shake: 0.25, ap: 2 }) },
  track:     { for: 'something MOVING (walk, run, drive) — camera slides alongside', make: (b) => ({ rig: 'track', size: b.size ?? 3.2, az: [azSide(b.heading ?? 0, b.side ?? 1) - 12, azSide(b.heading ?? 0, b.side ?? 1) + 12], el: [5, 7], fov: 36, shake: 0.5, ap: 3 }) },
  lead:      { for: 'moving subject coming AT us (excitement, speed, face of the driver/runner)', make: (b) => ({ rig: 'track', size: b.size ?? 2.4, az: [azFront(b.heading ?? 0) - 25, azFront(b.heading ?? 0) + 10], el: [6, 4], fov: 34, shake: 0.7, ap: 4 }) },
  follow:    { for: 'chase / going somewhere / where is it going', make: (b) => ({ rig: 'track', size: b.size ?? 3.5, az: [azBack(b.heading ?? 0) - 8, azBack(b.heading ?? 0) + 8], el: [12, 16], fov: 40, shake: 0.6, ap: 2 }) },
  orbit:     { for: 'two people talking, hero moment, showing something from all sides', make: (b) => ({ rig: 'orbit', size: b.size ?? 2.2, az: [b.az ?? -45, (b.az ?? -45) + 80], el: [6, 9], fov: 34, shake: 0.4, ap: 4 }) },
  ots:       { for: 'confrontation / reply in a dialogue (over the shoulder of the listener)', make: (b) => ({ rig: 'ots', size: b.size ?? 1.2, fov: 32, shake: 0.35, ap: 6, side: b.side ?? 1 }) },
  low:       { for: 'POWER: villain, boss, a huge machine/building, a hero rising', make: (b) => ({ rig: 'low', size: [b.size ?? 2.4, (b.size ?? 2.4) * 0.85], az: [b.az ?? 25, (b.az ?? 25) - 30], fov: [42, 38], shake: 0.35, ap: 3 }) },
  high:      { for: 'smallness, defeat, being trapped, "poor guy"', make: (b) => ({ rig: 'high', size: [b.size ?? 3, (b.size ?? 3) * 0.8], az: [b.az ?? 0, (b.az ?? 0) + 20], fov: 38, shake: 0.2, ap: 2 }) },
  pov:       { for: 'a character SEES something (what they are looking at)', make: (b) => ({ rig: 'pov', fov: [44, 34], shake: 0.6, ap: 2 }) },
  closeup:   { for: 'emotion punch, reaction, joke face (short! max 1 in 4 shots)', make: (b) => ({ rig: 'push', size: [b.size ?? 0.95, (b.size ?? 0.95) * 0.82], az: [b.az ?? 10, (b.az ?? 10) - 8], el: [3, 2], fov: 30, ease: 'snap', fovKick: 6, shake: 0.6, ap: 7 }) },
  dollyZoom: { for: 'SHOCK realisation (the world stretches behind them)', make: (b) => ({ rig: 'push', size: b.size ?? 1.2, fov: [22, 52], az: b.az ?? 0, el: 3, ease: 'inOut', shake: 0.15, ap: 5 }) },
  whip:      { for: 'comedy cut to a reaction / "meanwhile"', make: (b) => ({ rig: 'orbit', size: b.size ?? 1.6, az: [b.az ?? -70, (b.az ?? -70) + 70], el: 6, fov: 34, ease: 'snap', shake: 0.8, kick: 14, swing: 12, ap: 5 }) },
  handheld:  { for: 'CHAOS, panic, crash, everything goes wrong', make: (b) => ({ rig: 'orbit', size: b.size ?? 3, az: [b.az ?? -20, (b.az ?? -20) + 35], el: [4, 9], fov: 38, shake: 2.4, ap: 2 }) },
  static:    { for: 'deadpan pause, comedic beat, "…" silence (tiny drift only)', make: (b) => ({ rig: 'push', size: [b.size ?? 2.2, (b.size ?? 2.2) * 0.97], az: b.az ?? 0, el: 5, fov: 32, shake: 0.05, ap: 3 }) },
};
// ---- story beat -> best shot types (first choice first; the director skips a type used in the previous shot) ----
export const BEATS = {
  establish: ['drone', 'craneDown'], newPlace: ['craneDown', 'drone'], travel: ['drone', 'follow', 'track'],
  move: ['track', 'lead', 'follow'], chase: ['follow', 'lead', 'handheld'], arrive: ['craneDown', 'dollyIn'],
  talk: ['orbit', 'ots', 'static'], reply: ['ots', 'orbit'], hero: ['low', 'orbit'], villain: ['low', 'dollyIn'], power: ['low', 'droneTop'],
  small: ['high', 'dollyOut'], defeat: ['high', 'craneUp'], sees: ['pov', 'dollyIn'], realize: ['dollyIn', 'closeup'], shock: ['dollyZoom', 'closeup', 'whip'],
  react: ['closeup', 'whip'], joke: ['static', 'whip'], reveal: ['dollyOut', 'craneUp', 'drone'], explain: ['droneTop', 'dollyOut', 'orbit'], plan: ['droneTop', 'orbit'],
  chaos: ['handheld', 'whip'], build: ['orbit', 'low', 'dollyOut'], ending: ['craneUp', 'drone'],
};
export function direct(cine, beats) {
  let last = null; const used = [];
  for (const b of beats) {
    let type = b.shot; if (!type) { const opts = BEATS[b.beat] || ['orbit']; type = opts.find((o) => o !== last) || opts[0]; }
    const s = { ...SHOTS[type].make(b), at: b.at, from: b.from, ...(b.over || {}) };
    if (b.cut) s.cut = true; if (b.focus) s.focus = b.focus;
    cine.shot(b.t0, b.t1, s); used.push([b.t0, type, b.beat || '']); last = type;
  }
  return used;   // [[t0, shotType, beat]] — print it into the shot plan
}
export function shotTable() { return Object.entries(SHOTS).map(([k, v]) => `| ${k} | ${v.for} |`).join('\n'); }
