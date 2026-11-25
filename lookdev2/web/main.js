// LOOKDEV 2: v3 flat characters + detailed 3D classic car + grass/trees/hills/ferris wheel (6.2 s).
import * as THREE from 'three';
import * as C from './core.js';
import { mkLook, applyLook } from '../../web/looks.js';
import { lerp, sstep } from '../../web/motion.js';
import { Cine, T as CT } from '../../web/cine.js';
import { direct } from '../../web/director.js';
import { Flat2D } from '../../web/flat2d.js';
import { Kit } from '../../web/oldtown.js';
import { painted } from '../../web/tex.js';
import { makeClassicCar, makeFerris, tree, pine, grass } from '../../web/props3d.js';
const { stage, dofU, FPS, PX } = C; export const DURATION = 6.2;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const W = new THREE.Group(); stage.world.add(W); W.add(C.makeSky());

// ---------------- landscape ----------------
const K = new Kit(W);
K.mat('ground', { map: painted('grass', { base: [104, 176, 64], size: 512 }), uv: 6 });
K.mat('road', { map: painted('asphalt', { size: 512 }), uv: 4 }); K.mat('shoulder', { map: painted('dirt', { size: 512 }), uv: 3 });
K.mat('lineY', { color: 0xf2c430 }); K.mat('lineW', { color: 0xf4f0e6 });
K.mat('blade', { color: 0x6fbf3e, noInk: 1, side: THREE.DoubleSide }); K.mat('blade2', { color: 0x8fd24a, noInk: 1, side: THREE.DoubleSide }); K.mat('blade3', { color: 0x4e9a34, noInk: 1, side: THREE.DoubleSide });
K.mat('bark', { color: 0x7a5232 }); K.mat('leaf', { color: 0x5aa83a }); K.mat('leaf2', { color: 0x74c046 }); K.mat('pine', { color: 0x3e8a3a });
K.mat('hill', { color: 0x78b84a }); K.mat('hill2', { color: 0x5f9e44 }); K.mat('wood', { color: 0x9a6e44 }); K.mat('pole', { color: 0x6a4a30 }); K.mat('wire', { color: 0x2a2a2a, noInk: 1 });
K.mat('flowerR', { color: 0xf0506a, noInk: 1 }); K.mat('flowerY', { color: 0xffe14a, noInk: 1 }); K.mat('flowerW', { color: 0xffffff, noInk: 1 }); K.mat('mailbox', { color: 0x3a6ad0 }); K.mat('rock', { color: 0xa8a098 });
K.box('ground', 400, 0.1, 400, 0, -0.06, 0);
K.box('road', 300, 0.06, 6.2, 0, 0.0, 0.9); K.box('shoulder', 300, 0.04, 1.2, 0, -0.005, -2.8); K.box('shoulder', 300, 0.04, 1.2, 0, -0.005, 4.6);
for (let x = -150; x < 150; x += 4) K.box('lineY', 2.0, 0.07, 0.14, x, 0.0, 0.9);
K.box('lineW', 300, 0.07, 0.1, 0, 0.0, -2.05); K.box('lineW', 300, 0.07, 0.1, 0, 0.0, 3.85);
// fence on the north side (between road and the villain)
for (let x = -40; x <= 40; x += 2.2) K.box('wood', 0.14, 1.15, 0.14, x, 0.57, -4.6);
for (const y of [0.45, 0.95]) K.box('wood', 82, 0.12, 0.06, 0, y, -4.55);
// telephone poles + wires (south side)
for (let x = -60; x <= 60; x += 16) { K.cyl('pole', 0.11, 0.14, 7, x, 3.5, 6.2, 8); K.box('pole', 1.6, 0.1, 0.1, x, 6.6, 6.2); }
for (const dz of [-0.6, 0.6]) for (let x = -60; x < 60; x += 16) { const g = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(V(x, 6.68, 6.2 + dz), V(x + 8, 6.1, 6.2 + dz), V(x + 16, 6.68, 6.2 + dz)), 12, 0.018, 4); K.add('wire', g); }
// mailbox + rocks + flowers
K.cyl('pole', 0.05, 0.05, 1.0, 2.2, 0.5, -3.3, 6); K.box('mailbox', 0.5, 0.3, 0.26, 2.2, 1.1, -3.3, 0, 0, 0);
for (const [x, z, s] of [[-6, -3.6, 0.5], [9, -3.4, 0.35], [14, 5.6, 0.6], [-11, 5.3, 0.4]]) K.add('rock', new THREE.DodecahedronGeometry(s, 0), x, s * 0.5, z);
const fr = C.rng(7); for (let i = 0; i < 260; i++) { const x = -30 + fr() * 60, z = fr() < 0.5 ? -3.3 - fr() * 14 : 5.2 + fr() * 14; K.add(['flowerR', 'flowerY', 'flowerW'][i % 3], new THREE.IcosahedronGeometry(0.05, 0), x, 0.3 + fr() * 0.15, z); }
// grass blades (dense near the action, lighter far away); keep road clear
const offRoad = (x, z) => z > -3.4 && z < 5.2;
grass(K, -30, 30, -20, 22, 90000, 3, undefined, [0.14, 0.36], offRoad);
grass(K, -90, 90, -60, 60, 26000, 9, undefined, [0.35, 0.7], (x, z) => offRoad(x, z) || (Math.abs(x) < 30 && Math.abs(z) < 20));
// trees, pines, hills
const tr = C.rng(21); for (let i = 0; i < 46; i++) { const side = i % 2 ? 1 : -1; const x = -70 + tr() * 140, z = side > 0 ? 9 + tr() * 40 : -8 - tr() * 45; if (Math.abs(x - 3) < 6 && z < 0 && z > -12) continue; (i % 4 === 0 ? pine : tree)(K, x, z, 0.9 + tr() * 0.9, 100 + i); }
for (const [x, z, r, k] of [[-60, -110, 45, 'hill'], [20, -130, 55, 'hill2'], [90, -100, 40, 'hill'], [-100, 90, 50, 'hill2'], [60, 120, 55, 'hill'], [150, 10, 50, 'hill2'], [-150, -20, 55, 'hill']]) { const g = new THREE.SphereGeometry(r, 28, 14); g.scale(1, 0.32, 1); K.add(k, g, x, -2, z); }
K.finish();
const cloudM = C.toon({ color: new THREE.Color(0xffffff), unlit: 0.55 });
for (let i = 0; i < 9; i++) { const g = new THREE.Group(); for (let k = 0; k < 6; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(3 + (k % 3) * 1.2, 14, 10), cloudM); m.position.set(k * 3.2 - 8, (k % 2) * 1.5 + (k === 2 ? 2 : 0), 0); m.scale.y = 0.75; g.add(m); } g.position.set(-90 + i * 24, 30 + (i % 3) * 7, -90 + (i % 2) * 180); W.add(g); }
const FERRIS = makeFerris({ r: 9 }); FERRIS.group.position.set(48, 0, -46); FERRIS.group.rotation.y = 0.5; W.add(FERRIS.group);
const CAR = makeClassicCar({ paint: '#56c8c0', paint2: '#f4ecd6' }); W.add(CAR.group);
// dust puffs behind the car (soft billboards)
const puffTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, 'rgba(235,220,190,0.75)'); gr.addColorStop(1, 'rgba(235,220,190,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t; })();
const PUFFS = []; for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), C.fxMat(puffTex, { opacity: 0.7 })); stage.cards.add(m); PUFFS.push(m); }

// ---------------- cast (v3 flat characters) ----------------
const DRIVER = new Flat2D({ bust: true, body: 'coat', coat: '#2f4f8a', tie: '#e0b03a', badge: null, hat: null, hair: '#6a4630', hairStyle: 'side', res: 1.6, seed: 5 });
const KID = new Flat2D({ body: 'overalls', coat: '#5b86c4', shirt: '#f2b53a', hat: 'ball', hatCol: '#d23a32', band: '#d23a32', hair: '#5a3a26', hairStyle: 'bangs', size: 1.55, seed: 3 });
const VILLAIN = new Flat2D({ body: 'bean', coat: '#f1e6c8', shirt: '#fff', tie: '#2a1a14', badge: '#e8b03a', hat: null, hair: '#3a2418', hairStyle: 'pompadour', size: 1.95, seed: 4 });
const carX = (t) => -30 + 10.2 * t;

function setup(t, cam) {
  const x = carX(t); CAR.drive(x, 1.6, 0, x + 30, 0.012 * Math.sin(t * 23)); CAR.steer.rotation.z = 0.08 * Math.sin(t * 2);
  CAR.group.updateMatrixWorld(true);
  const sp = CAR.seat(0); DRIVER.place(sp.x, sp.y, sp.z);
  const pass = t > 3.2 && t < 3.9;
  DRIVER.update({ face: t > 1.6 && t < 2.6 ? { eyes: 'happy', mouth: 'grin' } : pass ? { eyes: 'dot', mouth: 'o', look: [-1, 0] } : { eyes: 'dot', mouth: 'bigsmile' }, armR: [60, 80], armL: [60, 80], tilt: 3 * Math.sin(t * 9) }, cam);
  KID.place(4.0, 0, -3.3);
  const wave = t > 3.0 && t < 4.2;
  KID.update({ face: wave ? { eyes: Math.floor(t * 6) % 5 ? 'dot' : 'happy', mouth: 'grin' } : t > 4.2 ? { eyes: 'wide', mouth: 'o', brow: 1 } : { eyes: 'dot', mouth: 'bigsmile', look: [-1, 0] },
    armR: wave ? [150 + 18 * Math.sin(t * 16), 30 * Math.sin(t * 16)] : [20, 10], armL: [15, 8], hop: wave ? Math.max(0, Math.sin(t * 12)) * 25 : 0, flip: t > 3.8 }, cam);
  VILLAIN.place(9.5, 0, -5.6);
  const sly = t > 4.0;
  VILLAIN.update({ face: sly ? { eyes: 'sly', mouth: Math.floor(t * 5) % 3 ? 'smirk' : 'grin', sly: 1 } : { eyes: 'dot', mouth: 'flat', look: [-1, 0] }, armL: sly ? [40, 95] : [10, 20], armR: sly ? [60, 100] : [10, 20], lean: sly ? -3 + 2 * Math.sin(t * 8) : 0, flip: true }, cam);
  FERRIS.update(t);
  PUFFS.forEach((m, i) => { const age = ((t * 6 + i) % 16) / 16; const px = carX(t - age * 0.9) - 2.6; m.position.set(px - age * 1.5, 0.25 + age * 0.9, 1.6 + (i % 2 ? 0.6 : -0.6) * (0.4 + age)); const s = 0.3 + age * 1.0; m.scale.set(s, s, s); m.material.uniforms.uOpacity.value = 0.4 * (1 - age); if (cam) m.lookAt(cam); });
}

// ---------------- camera ----------------
const CINE = new Cine({ blend: 0.3 }); const P = CT.pt;
const carC = (t) => V(carX(t) + 0.3, 1.0, 1.6), carF = (t) => V(carX(t) + 2.2, 0.75, 1.6);
carC.pure = true; carF.pure = true;
const kidH = () => KID.headWorld(), vilH = () => VILLAIN.headWorld().add(V(0, -0.1, 0)), drvH = () => DRIVER.headWorld();
const carM = (t) => V(carX(t) + 0.2, 1.1, 1.6); carM.pure = true;
window.SHOTLOG = direct(CINE, [
  { t0: 0.0, t1: 1.1, beat: 'establish', at: carM, az: -40 },                       // drone: whole world, car on the road, ferris wheel far
  { t0: 1.1, t1: 1.9, beat: 'move', at: carM, heading: 0, side: 1, size: 3.4 },      // track alongside the moving car
  { t0: 1.9, t1: 2.6, shot: 'lead', at: drvH, heading: 0, size: 1.8 },               // in front: driver grinning at us
  { t0: 2.6, t1: 3.25, beat: 'sees', from: () => KID.headWorld().add(V(0.15, 0, 0.25)), at: carM },   // POV: the kid sees the car
  { t0: 3.25, t1: 3.95, beat: 'react', at: () => kidH().add(V(0, -0.15, 0)), az: 8 }, // close-up: kid cheers
  { t0: 3.95, t1: 4.7, beat: 'villain', at: () => VILLAIN.bodyWorld().add(V(0, 0.3, 0)), size: 2.6, az: 20 },   // low angle: villain behind fence
  { t0: 4.7, t1: 5.35, beat: 'realize', at: vilH, size: 1.0 },                       // dolly in: his evil idea
  { t0: 5.35, t1: 6.25, beat: 'ending', at: carM, size: 3, big: 16, az: -95 },        // crane up: car drives off
]);
function guard(c, t) { const p = c.pos; p[1] = Math.max(p[1], 0.3); const cx = carX(t); if (Math.abs(p[0] - (cx + 0.1)) < 2.6 && Math.abs(p[2] - 1.6) < 1.1 && p[1] < 1.8) p[1] = 1.8; if (p[2] < -4.4 && p[2] > -4.8) p[2] = -4.4; return c; }

const LOOK = mkLook({ sun: [0.45, 0.75, 0.5], lit: '#fff6e4', litK: 1.1, shade: '#8ea6d8', ambSky: '#eef6ff', ambGnd: '#e8f0c8', rim: '#fff4d8', rimDir: [-0.5, 0.3, -0.8], fog: '#cfe4f6', fogR: [40, 220],
  sky: ['#1f6fe0', '#4a9cf0', '#bfe0fa', '#d8ecd0'], contrast: 1.07, vig: 0.12, vigCol: '#1a2a40', glow: 0.35, sat: 1.22, exposure: 1.05, shadow: 0.9, lo: '#f2f6ff', hi: '#fff8ea' });
window.renderFrame = function (f) {
  const t = f / FPS;
  setup(t, null);
  const cam = guard(CINE.at(t), t); const cp = V(...cam.pos);
  setup(t, cp);
  applyLook(LOOK, { shadowCenter: [cam.look[0], 0, cam.look[2]], shadowSize: 24 });
  C.setCam({ pos: cam.pos, look: cam.look, fov: cam.fov, roll: cam.roll, near: 0.05, far: 700 });
  dofU.uFocus.value = cam.focus; dofU.uAper.value = cam.ap * PX * 0.9; dofU.uMaxC.value = 12 * PX; dofU.uTime.value = f * 0.37;
  dofU.uFade.value = Math.max(0, 1 - t / 0.25); dofU.uFlash.value = 0;
  C.drawFrame(); return 'ok';
};
window.ready = true;
