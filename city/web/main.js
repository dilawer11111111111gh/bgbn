// CITY demo (Studio v9, today's era): rush hour in a modern city — glass towers, neon shops, shiny rounded cars, hundreds of people.
import * as THREE from 'three';
import { scene, cam, sun, hemi, V, sky, ready, makeComposer } from '../../web/realkit.js';
import { Cine } from '../../web/cine.js';
import { Flat2D } from '../../web/flat2d.js';
import { mo } from '../../web/mocap.js';
import { sstep, clamp, lerp } from '../../web/motion.js';
import { installActing, keys, faceK, makeSky, dynamicCam, makeRenderer } from '../../web/studio.js';
import { makeAtlas, Crowd, blob, grid, mulberry } from '../../web/crowd.js';
import { modernCity } from '../../web/eras.js';
export const DURATION = 10;
installActing();
let CITY, PEOPLE, CROSS; const r0 = mulberry(8), pick = (a) => a[Math.floor(r0() * a.length)];
const HERO = new Flat2D({ body: 'suit', coat: '#1a2a4a', tie: '#e8282a', pocketSq: '#f2c63a', pants: { col: '#1a2a4a', len: 'long' }, hair: '#1a1410', hairStyle: 'quiff', glasses: 'round', size: 1.95, res: 2.2, wide: true, headroom: 400, seed: 4, scene });
const modernV = Array.from({ length: 18 }, () => ({ body: pick(['tshirt', 'hoodie', 'jacket', 'suit', 'tshirt', 'polo']), pants: { col: pick(['#2a4a7a', '#1a1a1a', '#5a5a62', '#c8b088']), len: 'long' }, shirt: '#f4f4f4', tie: pick(['#e8282a', '#1a4a9a']), print: pick([null, 'NYC', 'GO', null]), coat: pick(['#e8282a', '#1a6ad8', '#2ab86a', '#f2c63a', '#ff7a2a', '#8a3ab0', '#18b8c8', '#f4f0e6', '#2a2a2e']), hair: pick(['#1a1410', '#3a2414', '#6a4a2a', '#c8a050']), hairStyle: pick(['quiff', 'side', 'curly', 'spiky', 'messy', 'swept']), glasses: r0() < 0.25 ? 'round' : null, mustache: r0() < 0.2 }));
const modernF = [{ armL: [16, -32], armR: [16, -32] }, { armL: [30, 10], armR: [96, -96], face: { eyes: 'lid', lid: 0.2, mouth: 'smile', look: [0.5, 0.6] } }, { armL: [150, 20], armR: [150, 20], face: { eyes: 'wide', mouth: 'smallO', brow: 1.2 }, hop: 8 }];
function build() { CITY = modernCity({ z0: 0, len: 220, cars: 14, stop: { z: -30, t0: 2.6, t1: 99 } }); const atl = makeAtlas(modernV, modernF);
  const side = []; for (let k = 0; k < 14; k++) for (const sd of [-1, 1]) side.push(...blob(sd * 10, -6 - k * 15, 2.2, 6, 9, k * 3 + (sd > 0 ? 1 : 0)));
  PEOPLE = new Crowd(atl, side, { seed: 3, fog: 0xc8d8e8, fogNear: 60, fogFar: 200 }); CROSS = new Crowd(atl, grid(0, -30, 10, 3, 1.2, 1.1, 0.4, 9), { seed: 4 }); }
function setup(t, camPos) { Flat2D.T = t; HERO.mesh.visible = false; if (HERO.shadow) HERO.shadow.visible = false; CITY.update(t);
  PEOPLE.update(t, camPos, { march: 1, bob: 0.3, mode: t > 7.6 && t < 8.6 ? 2 : 0 }); CROSS.mesh.position.set(lerp(-9, 9, clamp((t - 3.2) / 3, 0, 1)), 0, 0); CROSS.update(t, camPos, { march: 1, bob: 0.5, visible: t > 3.0 && t < 6.4 });
  if (t > 5.2) { HERO.place(1.2, 0, -26); const walk = t > 5.2 && t < 6.6; HERO.update({ e: 1, ...(walk ? mo('17_06f', t, { t0: 5.2, from: 0.4, amp: 1.2, root: 0 }) : keys(t, [[6.6, { armR: [96, -96], armL: [16, -32] }], [7.6, { armR: [150, 20], armL: [150, 20], hop: 16 }, 0.08, 'back']])), face: faceK(t, [[5.2, { eyes: 'lid', lid: 0.2, mouth: 'smile', look: [0.5, 0.6] }], [7.6, { eyes: 'tiny', mouth: 'scream', brow: 1.4 }]], 0.06), noBlink: true }, camPos); } }
function fx() {}
const CINE = new Cine(); const shot = (a, b, s) => CINE.shot(a, b, s); const car0 = () => CITY.cars[0].position.clone();
function camera() {
  shot(0, 1.6, { rig: 'pov', from: (t) => V(lerp(30, 6, t / 1.6), lerp(90, 24, t / 1.6), lerp(40, -10, t / 1.6)), at: (t) => V(0, 2, lerp(-60, -40, t / 1.6)), fov: 52, push: 1.0, drift: [0, 0] });
  shot(1.6, 3.2, { rig: 'pov', from: () => car0().add(V(5.2, 1.9, 6.5)), at: () => car0().add(V(0, 0.7, -2.5)), fov: 40, push: 1.0, drift: [0, 0] });
  shot(3.2, 5.2, { rig: 'pov', from: (t) => V(6, 0.4, -22 + (t - 3.2) * 0.6), at: () => V(0, 1.6, -30), fov: 46, push: 1.0, drift: [0, 0] });
  shot(5.2, 7.6, { rig: 'push', at: () => HERO.headWorld().add(V(0, -0.4, 0)), size: 2.2, az: 15, el: -8, fov: 32, push: 1.2 });
  shot(7.6, 10, { rig: 'push', at: () => HERO.headWorld().add(V(0, -0.1, 0)), size: 1.3, az: 0, el: 0, fov: 30, push: 1.15, zoomK: [[7.6, 1.4, 0.06]] });
}
const composer = makeComposer({ sat: 1.32, con: 1.12, bloom: 0.1 }); const SKY = makeSky();
const look = (t, cpos) => { SKY.update(cpos, false, composer.grade); sun.color.setHex(0xffe0b8); sun.intensity = 2.6; hemi.intensity = 0.55; const tg = sun.target.position; sun.position.copy(tg).add(V(-40, 55, 30)); };
const camOf = dynamicCam(CINE);
makeRenderer({ CINE, camOf, setup, fx, look, composer, DURATION, impacts: [7.6] });
(async () => { await sky('kloofendal_48d_partly_cloudy_puresky', { env: 0.9 }); build(); camera(); await ready(); window.ready = true; })();
