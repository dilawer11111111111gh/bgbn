// LOOKDEV: "real 3D world + flat 2D characters" test (5 s). Detailed old-town street, ink outlines, DOF, camera travels through the set.
import * as THREE from 'three';
import * as C from './core.js';
import { mkLook, applyLook } from '../../web/looks.js';
import { clamp, lerp, sstep } from '../../web/motion.js';
import { Cine, T as CT } from '../../web/cine.js';
import { Flat2D } from '../../web/flat2d.js';
import { Kit, TEX, facade, barrel, crate, lamp } from '../../web/oldtown.js';
const { stage, dofU, FPS, PX } = C; export const DURATION = 5.0;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const W = new THREE.Group(); stage.world.add(W); W.add(C.makeSky());

// ---------------- materials ----------------
const K = new Kit(W);
const bricks = [['brick', '#b65a34'], ['brick2', '#c98a52'], ['brick3', '#9a4a36'], ['brick4', '#d8b48a'], ['brick5', '#8f6a5a']];
bricks.forEach(([k, c], i) => K.mat(k, { map: TEX.bricks(c, '#ecd6b0', 3 + i), uv: 2.2 }));
K.mat('trim', { color: 0xf3ead6 }); K.mat('trim2', { color: 0xe9d29a }); K.mat('trim3', { color: 0xdfe6e8 });
K.mat('shut', { map: TEX.slats('#2f6b3a'), local: true }); K.mat('shut2', { map: TEX.slats('#2c4f7a'), local: true }); K.mat('shut3', { map: TEX.slats('#8a2f2a'), local: true });
K.mat('glassD', { map: TEX.glass(false), local: true }); K.mat('glassL', { map: TEX.glass(true), local: true, emis: 0.35 });
K.mat('curtain', { color: 0xc23a33 }); K.mat('curtain2', { color: 0xe2b34a });
K.mat('doorDark', { color: 0x2a1a12 }); K.mat('door', { map: TEX.planks('#6a3f22', 9, 3), uv: 0.6 });
K.mat('crate', { map: TEX.planks('#c08a4c', 4, 4), uv: 0.6 }); K.mat('crateEdge', { color: 0x8a5a2c }); K.mat('goods', { color: 0xd9b060 });
K.mat('awning', { map: TEX.stripes('#c8342a', '#f3e6c8'), local: true }); K.mat('awning2', { map: TEX.stripes('#2d6a4a', '#f3e6c8'), local: true });
K.mat('pot', { color: 0x8a4a2a }); K.mat('flower', { color: 0xe8507a });
K.mat('plank', { map: TEX.planks('#a8743e', 6, 6), uv: 1.6 }); K.mat('post', { color: 0x7a5030 });
K.mat('barrel', { map: TEX.planks('#9a6434', 8, 8), local: true }); K.mat('hoop', { color: 0x3a3030 }); K.mat('barrelTop', { color: 0x8a5a2e });
K.mat('iron', { color: 0x2a2a30 }); K.mat('lampGlass', { color: 0xffd98a, emis: 0.8, unlit: 1 });
K.mat('mud', { map: TEX.mud(), uv: 9 }); K.mat('puddle', { color: 0x9cc4dc, unlit: 0.6, band: 0.2 });
K.mat('hotelSign', { map: TEX.sign('GRAND HOTEL', '#2d5a34', '#f4d27a'), local: true, emis: 0.05 });
K.mat('sign2', { map: TEX.sign('DRY GOODS', '#7a2a24', '#f6e2b0'), local: true }); K.mat('sign3', { map: TEX.sign('BANK', '#26365e', '#f4d27a'), local: true });
K.mat('sign4', { map: TEX.sign('SALOON', '#5a3018', '#f4d27a'), local: true }); K.mat('sign5', { map: TEX.sign('BARBER', '#f2e8d2', '#a02a2a'), local: true });
K.mat('banner', { map: TEX.sign('RATTLESNAKE GULCH  ·  1874', '#f1e2c0', '#8a2418', 2048, 256), local: true });
K.mat('mesa', { color: 0xd08a5a }); K.mat('mesa2', { color: 0xc27a50 }); K.mat('cactus', { color: 0x5f8a3a });

// ---------------- street ----------------
K.box('mud', 120, 0.1, 40, 0, -0.05, 3.2);
for (const [x, z, a, b] of [[-1.5, -0.6, 1.1, 0.5], [3.2, 1.6, 1.6, 0.7], [-6, 2.4, 1.3, 0.6], [7.5, -0.2, 0.9, 0.45], [12, 3, 1.8, 0.8], [-12, 0.5, 1.2, 0.5]]) { const g = new THREE.CircleGeometry(1, 28); g.scale(a, b, 1); K.add('puddle', g, x, 0.006, z, 0, -Math.PI / 2); }
for (const [z0, z1] of [[-4.0, -2.4], [8.9, 10.5]]) { K.box('plank', 80, 0.25, z1 - z0, 0, 0.125, (z0 + z1) / 2); K.box('post', 80, 0.08, 0.1, 0, 0.21, z0 < 0 ? z1 : z0); }
const NORTH = [[-26, 8, 3, 'brick5', 'shut3', 'sign5'], [-17.5, 8.6, 4, 'brick2', 'shut2', 'sign2'], [-9, 8.2, 4, 'brick4', 'shut', null], [0, 9, 5, 'brick', 'shut', 'hotelSign'], [9.2, 8.6, 4, 'brick3', 'shut2', 'sign3'], [18, 8.4, 3, 'brick2', 'shut', 'sign4'], [26.5, 8, 4, 'brick4', 'shut3', null]];
NORTH.forEach(([x, w, fl, br, sh, sg], i) => facade(K, { x, zf: -4, w, floors: fl, brick: br, shut: sh, sign: sg, seed: 10 + i, cols: Math.round(w / 3), trim: i % 2 ? 'trim2' : 'trim', curtain: i % 2 ? 'curtain2' : 'curtain', awning: i % 2 ? 'awning2' : 'awning' }));
const SOUTH = [[-21, 8.6, 3, 'brick3', 'shut', 'sign4'], [-12.4, 8.4, 4, 'brick', 'shut2', null], [-4, 8.2, 3, 'brick4', 'shut3', 'sign2'], [4.4, 8.4, 4, 'brick2', 'shut', 'sign5'], [13, 8.6, 4, 'brick5', 'shut2', null], [21.6, 8.4, 3, 'brick', 'shut3', 'sign3']];
SOUTH.forEach(([x, w, fl, br, sh, sg], i) => facade(K, { x, zf: 10.5, face: -1, w, floors: fl, brick: br, shut: sh, sign: sg, seed: 40 + i, cols: Math.round(w / 3), trim: i % 2 ? 'trim' : 'trim3', curtain: i % 2 ? 'curtain' : 'curtain2', awning: i % 2 ? 'awning' : 'awning2' }));
for (const [x, z] of [[-2.3, -3.55], [-2.95, -3.5], [-2.6, -2.95]]) barrel(K, x, 0.25, z, 0.95);
crate(K, 2.4, 0.25, -3.4, 0.62, 0.2); crate(K, 3.05, 0.25, -3.45, 0.55, -0.1); crate(K, 2.7, 0.87, -3.42, 0.45, 0.4);
for (const x of [-4.6, 4.6, -13.4, 13.6]) lamp(K, x, 0.25, -2.6);
for (const x of [-8.6, 0, 8.6]) lamp(K, x, 0.25, 9.1);
K.box('post', 2.6, 0.1, 0.1, -6.2, 1.0, -1.9); K.box('post', 0.12, 1.0, 0.12, -7.4, 0.5, -1.9); K.box('post', 0.12, 1.0, 0.12, -5.0, 0.5, -1.9);
K.box('plank', 1.6, 0.5, 0.6, 6.4, 0.25, -1.9); K.box('puddle', 1.4, 0.04, 0.45, 6.4, 0.47, -1.9);
K.add('post', new THREE.TorusGeometry(0.55, 0.05, 6, 24), 5.2, 0.8, -3.75, 0.15);
barrel(K, 1.9, 0, 1.2, 1.0); crate(K, -3.5, 0, 0.6, 0.7, 0.5);
K.box('post', 0.18, 6.2, 0.18, 6.2, 3.1, -2.5); K.box('post', 0.18, 6.2, 0.18, 6.2, 3.1, 9.0);
K.box('banner', 0.05, 1.0, 9.6, 6.2, 5.2, 3.25);
for (const [x, z, s, m] of [[70, 0, 14, 'mesa'], [64, 20, 10, 'mesa2'], [-70, 6, 16, 'mesa'], [-66, -18, 11, 'mesa2'], [10, -60, 18, 'mesa'], [-30, -55, 13, 'mesa2'], [30, 60, 15, 'mesa'], [-20, 62, 12, 'mesa2']]) { K.cyl(m, s * 0.7, s, s * 0.6, x, s * 0.3, z, 7); K.cyl(m, s * 0.62, s * 0.7, 0.6, x, s * 0.6 + 0.3, z, 7); }
for (const [x, z] of [[36, -2], [40, 7], [-38, 4], [-42, -1]]) { K.cyl('cactus', 0.25, 0.3, 2.6, x, 1.3, z, 8); K.cyl('cactus', 0.16, 0.18, 1.0, x + 0.45, 1.6, z, 8); }
K.finish();
const cloudM = C.toon({ color: new THREE.Color(0xfff6ea), unlit: 0.5 });
for (let i = 0; i < 7; i++) { const g = new THREE.Group(); for (let k = 0; k < 5; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(3 + (k % 3), 12, 8), cloudM); m.position.set(k * 3.4 - 7, (k % 2) * 1.2, 0); m.scale.y = 0.7; g.add(m); } g.position.set(-60 + i * 22, 34 + (i % 3) * 5, -70 + (i % 2) * 140); W.add(g); }

// ---------------- dust motes ----------------
const moteTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 1, 32, 32, 30); gr.addColorStop(0, 'rgba(255,246,220,0.95)'); gr.addColorStop(1, 'rgba(255,246,220,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t; })();
const MOTES = []; for (let i = 0; i < 70; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.05), C.fxMat(moteTex, { opacity: 0.8 })); stage.cards.add(m); MOTES.push({ m, x: -8 + C.hash(i) * 16, y: 0.4 + C.hash(i + 50) * 4, z: -3 + C.hash(i + 99) * 6, s: 0.6 + C.hash(i + 7) }); }

// ---------------- cast (flat 2D) ----------------
const CLEM = new Flat2D({ coat: '#34508e', trim: '#f4ead2', tie: '#c4302a', hat: 'top', hatCol: '#2a2224', band: '#8a2a24' });
const MAYOR = new Flat2D({ coat: '#4f7a3a', trim: '#f4ead2', tie: '#e0b03a', vest: '#c8a04a', hat: 'bowler', hatCol: '#4a3226', band: '#2a1a14', mustache: true, hair: '#5a3a26', size: 1.78 });
const GUEST = new Flat2D({ bust: true, coat: '#e6d6b8', trim: '#fff', tie: null, hat: 'nightcap', hatCol: '#5a7ac0', band: '#f4f0e0', res: 1.4 });
const say = (t, t0, t1) => (t > t0 && t < t1 ? ['talk', 'o', 'talk', 'smile', 'grin'][Math.floor(t * 11) % 5] : null);

function setup(t, cam) {
  const cx = lerp(0, 0.9, sstep(1.6, 2.4, t)), cz = lerp(-3.75, -3.0, sstep(0.9, 1.7, t));
  CLEM.place(cx, 0.25, cz);
  const walking = t > 0.9 && t < 2.4, shock = t > 4.0;
  CLEM.update({
    walk: t * 10, amp: walking ? 26 : 0, bob: walking ? -Math.abs(Math.sin(t * 10)) * 10 : 0, flip: t >= 2.6,
    armL: shock ? [150 + 12 * Math.sin(t * 30), -25] : walking ? [12 + 22 * Math.sin(t * 10), 10] : t > 2.4 && t < 3.0 ? [70, 40] : [10, 8],
    armR: shock ? [150 + 12 * Math.sin(t * 30 + 1), -25] : walking ? [12 - 22 * Math.sin(t * 10), 10] : [14, 6],
    hop: shock ? Math.max(0, Math.sin((t - 4.0) * 9)) * 60 * (t < 4.4 ? 1 : 0.3) : 0, squash: shock ? 0.08 * Math.sin(t * 40) : 0,
    lean: walking ? 5 : 0, tilt: t > 3.0 && t < 4.0 ? -6 : 0,
    face: shock ? { eyes: 'wide', mouth: 'scream', brow: 1.2, look: [0, -1] } : t > 3.0 ? { eyes: 'dot', mouth: 'o', brow: 0.6, look: [0.3, -1] } : t > 2.4 ? { eyes: 'dot', mouth: say(t, 2.4, 3.0) || 'smile', brow: 0.2 } : { eyes: Math.floor(t * 2.3) % 6 === 0 ? 'closed' : 'dot', mouth: 'smile', brow: 0 },
    mark: shock && t > 4.08 ? '!' : null, sweat: shock ? t * 2 : 0,
  }, cam);
  MAYOR.place(-1.45, 0.25, -3.05);
  const mShock = t > 4.15;
  MAYOR.update({
    armL: mShock ? [130, -40] : t > 2.2 && t < 3.1 ? [40 + 20 * Math.sin(t * 14), 50] : [8, 25], armR: mShock ? [140, -30] : [30, 60],
    hatOff: mShock ? 30 + 20 * Math.sin(t * 25) : 0, hop: mShock ? Math.max(0, Math.sin((t - 4.15) * 10)) * 40 : 0, lean: mShock ? -4 : 2,
    face: mShock ? { eyes: 'wide', mouth: 'o', brow: 1.4, look: [0.5, -1] } : t > 2.2 && t < 3.1 ? { eyes: 'happy', mouth: say(t, 2.2, 3.1) || 'grin', brow: -0.2 } : { eyes: 'dot', mouth: 'smile', brow: -0.4, look: [0.6, 0] },
  }, cam);
  GUEST.place(0, 6.15, -3.965);
  const yawn = t > 3.15 && t < 3.9;
  GUEST.update({ face: yawn ? { eyes: 'closed', mouth: 'yawn', brow: 0.4 } : t > 3.9 ? { eyes: 'sleepy', mouth: 'flat', brow: 0.2, look: [0, 1] } : { eyes: 'closed', mouth: 'smile' }, tilt: yawn ? -8 : 4 * Math.sin(t * 2) }, cam);
  for (const d of MOTES) { const k = t * 0.25 * d.s; d.m.position.set(d.x + Math.sin(k * 3 + d.y) * 0.4, d.y + Math.sin(k * 2 + d.x) * 0.3, d.z + Math.cos(k * 2.6 + d.x) * 0.3); if (cam) d.m.lookAt(cam); const sz = d.s * 0.9; d.m.scale.set(sz, sz, sz); }
}

// ---------------- camera ----------------
const CINE = new Cine({ blend: 0.34 }); const P = CT.pt;
const clemH = () => CLEM.headWorld(), clemB = () => CLEM.bodyWorld(), guestH = () => GUEST.headWorld();
const pair = () => CLEM.bodyWorld().lerp(MAYOR.bodyWorld(), 0.5).add(V(0, 0.25, 0));
[[0, 1.15, { rig: 'fly', path: [[-13, 7.5, 6.5], [-7, 4.2, 4.0], [-3.2, 2.4, 1.8]], at: P(1.5, 2.6, -3.8), fov: [44, 38], shake: 0.25, ap: 0.6 }],
 [1.15, 2.25, { rig: 'push', at: clemB, size: [3.2, 1.7], az: [32, 14], el: [3, 6], fov: 34, shake: 0.4, focus: clemB, ap: 4 }],
 [2.25, 2.75, { rig: 'orbit', at: () => MAYOR.headWorld().add(V(0, -0.35, 0)), size: [1.5, 1.2], az: [-40, -10], el: [6, 4], fov: 32, shake: 0.45, ap: 5 }],
 [2.75, 3.15, { rig: 'orbit', at: () => CLEM.headWorld().add(V(0, -0.35, 0)), size: [1.4, 1.2], az: [30, 5], el: [4, 8], fov: 32, shake: 0.45, ap: 5 }],
 [3.15, 4.0, { rig: 'crane', at: guestH, size: [2.4, 0.75], az: [-12, 6], el: [-14, 4], fov: 30, shake: 0.3, ap: 5 }],
 [4.0, 5.05, { rig: 'low', at: clemH, size: [1.5, 1.15], az: [36, -24], fov: 30, shake: 1.0, fovKick: 9, ease: 'snap', ap: 6 }],
].forEach(([a, b, s]) => CINE.shot(a, b, s));
function guard(c) { const p = c.pos; if (p[1] < 3.2) p[2] = Math.max(p[2], -2.35); p[2] = Math.max(p[2], -3.6); p[1] = Math.max(p[1], 0.45); return c; }

const LOOK = mkLook({ sun: [-0.55, 0.62, 0.62], lit: '#fff0d6', litK: 1.12, shade: '#9a8ab8', ambSky: '#f6eedc', ambGnd: '#f0d6b0', rim: '#ffe2b0', rimDir: [0.6, 0.3, -0.8], fog: '#f2dcb8', fogR: [30, 140],
  sky: ['#3c86d8', '#7ab8ec', '#f6e2c0', '#e8c89a'], contrast: 1.06, vig: 0.18, vigCol: '#3a2014', glow: 0.45, sat: 1.15, exposure: 1.04, shadow: 0.85, lo: '#f4f0ff', hi: '#fff2dc' });
window.renderFrame = function (f) {
  const t = f / FPS;
  setup(t, null);
  const cam = guard(CINE.at(t)); const cp = V(...cam.pos);
  setup(t, cp);
  applyLook(LOOK, { shadowCenter: [cam.look[0], 0, cam.look[2]], shadowSize: 22, pl: [{ pos: [-4.6, 3.45, -2.6], col: [1.0, 0.75, 0.35], range: 3 }, { pos: [4.6, 3.45, -2.6], col: [1.0, 0.75, 0.35], range: 3 }] });
  C.setCam({ pos: cam.pos, look: cam.look, fov: cam.fov, roll: cam.roll, near: 0.05, far: 600 });
  dofU.uFocus.value = cam.focus; dofU.uAper.value = cam.ap * PX * 0.9; dofU.uMaxC.value = 12 * PX; dofU.uTime.value = f * 0.37;
  dofU.uFade.value = Math.max(0, 1 - t / 0.25); dofU.uFlash.value = t > 4.0 && t < 4.12 ? 0.18 : 0;
  C.drawFrame(); return 'ok';
};
window.ready = true;
