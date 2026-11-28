// look-dev for v9.1 kits: leafy trees, real cars
import * as THREE from 'three';
import { scene, cam, sun, hemi, V, sky, ready, makeComposer, mesh, pbr } from '../../web/realkit.js';
import { Cine } from '../../web/cine.js';
import { makeSky, dynamicCam, makeRenderer, installActing } from '../../web/studio.js';
import { leafyTrees } from '../../web/nature.js';
import { realCar } from '../../web/cars.js';
import { realCity } from '../../web/city2.js';
export const DURATION = 6; installActing();
let CARS = [];
let CITY;
function build() { CITY = realCity({ z0: 0, len: 180, cars: 12, parked: 8, stop: { z: -30, t0: 2, t1: 99 } }); }
const CINE = new Cine(); const shot = (a, b, s) => CINE.shot(a, b, s);
function camera() {
  shot(0, 1, { rig: 'pov', from: () => V(3, 1.6, 6), at: () => V(-6, 5, -30), fov: 50, push: 1, drift: [0, 0] });
  shot(1, 2, { rig: 'pov', from: () => V(-4, 1.7, -10), at: () => V(-13, 6, -22), fov: 50, push: 1, drift: [0, 0] });
  shot(2, 3, { rig: 'pov', from: () => V(5.5, 1.2, -22), at: () => V(3.4, 0.7, -26), fov: 40, push: 1, drift: [0, 0] });
  shot(3, 4, { rig: 'pov', from: () => V(-9.5, 1.6, -16), at: () => V(-8.3, 3.5, -27), fov: 55, push: 1, drift: [0, 0] });
  shot(4, 5, { rig: 'pov', from: () => V(0, 30, 20), at: () => V(0, 0, -50), fov: 50, push: 1, drift: [0, 0] });
  shot(5, 6, { rig: 'pov', from: () => V(9, 1.6, -40), at: () => V(13, 12, -60), fov: 55, push: 1, drift: [0, 0] });
}
const composer = makeComposer({ sat: 1.25, con: 1.1, bloom: 0.08 }); const SKY = makeSky();
const look = (t, cpos) => { SKY.update(cpos, false, composer.grade); sun.color.setHex(0xffe0b8); sun.intensity = 2.6; hemi.intensity = 0.55; const tg = sun.target.position; sun.position.copy(tg).add(V(-30, 45, 25)); };
makeRenderer({ CINE, camOf: dynamicCam(CINE), setup: (t) => CITY.update(t), fx: () => {}, look, composer, DURATION });
(async () => { await sky('kloofendal_48d_partly_cloudy_puresky', { env: 0.9 }); build(); camera(); await ready(); window.ready = true; })();
