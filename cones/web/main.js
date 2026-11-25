// CONES — "Why train wheels are cones" (fictional town Clatterbrook). Real 3D world + flat 2D people, director camera on word times.
import * as THREE from 'three';
import * as C from './core.js';
import { mkLook, applyLook } from '../../web/looks.js';
import { lerp, sstep, clamp } from '../../web/motion.js';
import { Cine } from '../../web/cine.js';
import { direct } from '../../web/director.js';
import { Flat2D, FACES } from '../../web/flat2d.js';
import { role, act } from '../../web/roles.js';
import { Kit, TEX, facade, barrel, crate, lamp } from '../../web/oldtown.js';
import { makeTrain, makeTrack, makeWheelset, Horse2D } from '../../web/train.js';
import { Sign, Burst, Debris } from '../../web/fx.js';
import { painted } from '../../web/tex.js';
import { WORDS } from './words.js';
const { stage, dofU, FPS, PX } = C; export const DURATION = 51.6;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const T = (i) => WORDS[i][1];
const W = new THREE.Group(); stage.world.add(W); W.add(C.makeSky());
const tm = (h, o = {}) => C.toon({ color: new THREE.Color(h), ...o });
const box = (w, h, d, m, x, y, z, ry = 0) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); me.rotation.y = ry; return me; };

// =============== MATERIALS (kit) ===============
const K = new Kit(W);
[['brick', '#b65a34'], ['brick2', '#c98a52'], ['brick3', '#9a4a36'], ['brick4', '#d8b48a'], ['brick5', '#8f6a5a']].forEach(([k, c], i) => K.mat(k, { map: TEX.bricks(c, '#ecd6b0', 3 + i), uv: 1.15 }));
K.mat('trim', { color: 0xf3ead6 }); K.mat('trim2', { color: 0xe9d29a }); K.mat('trim3', { color: 0xdfe6e8 }); K.mat('reveal', { color: 0xcfc2a6 }); K.mat('roof', { color: 0x5a4a4e });
K.mat('shut', { map: TEX.slats('#2f6b3a'), local: true }); K.mat('shut2', { map: TEX.slats('#2c4f7a'), local: true }); K.mat('shut3', { map: TEX.slats('#8a2f2a'), local: true });
K.mat('glassD', { map: TEX.glass(false), local: true }); K.mat('glassL', { map: TEX.glass(true), local: true, emis: 0.35 }); K.mat('curtain', { color: 0xc23a33 }); K.mat('curtain2', { color: 0xe2b34a });
K.mat('doorDark', { color: 0x2a1a12 }); K.mat('door', { map: TEX.planks('#6a3f22', 9, 3), uv: 0.6 }); K.mat('crate', { map: TEX.planks('#c08a4c', 4, 4), uv: 0.6 }); K.mat('crateEdge', { color: 0x8a5a2c }); K.mat('goods', { color: 0xd9b060 });
K.mat('awning', { map: TEX.stripes('#c8342a', '#f3e6c8'), local: true }); K.mat('awning2', { map: TEX.stripes('#2d6a4a', '#f3e6c8'), local: true }); K.mat('pot', { color: 0x8a4a2a }); K.mat('flower', { color: 0xe8507a });
K.mat('plank', { map: TEX.planks('#a8743e', 6, 6), uv: 1.6 }); K.mat('post', { color: 0x7a5030 }); K.mat('barrel', { map: TEX.planks('#9a6434', 8, 8), local: true }); K.mat('hoop', { color: 0x3a3030 }); K.mat('barrelTop', { color: 0x8a5a2e });
K.mat('iron', { color: 0x2a2a30 }); K.mat('lampGlass', { color: 0xffd98a, emis: 0.8, unlit: 1 }); K.mat('mud', { map: TEX.mud(), uv: 9 }); K.mat('puddle', { color: 0x9cc4dc, unlit: 0.6, band: 0.2 });
K.mat('sand', { map: painted('sand', { size: 512 }), uv: 8 }); K.mat('dirt', { map: painted('dirt', { size: 512 }), uv: 5 });
K.mat('mesa', { color: 0xd08a5a }); K.mat('mesa2', { color: 0xc27a50 }); K.mat('cactus', { color: 0x5f8a3a }); K.mat('rock', { color: 0xb8a088 }); K.mat('bush', { color: 0x9aa04a });
K.mat('ballast', { color: 0x8a7a6a }); K.mat('tie', { color: 0x6a4630 }); K.mat('rail', { color: 0xa8b0ba }); K.mat('railOut', { color: 0xa8b0ba }); K.mat('railIn', { color: 0xa8b0ba });
K.mat('wood', { map: TEX.planks('#b07a44', 12, 8), uv: 1.4 }); K.mat('woodD', { map: TEX.planks('#7a4e2a', 13, 8), uv: 1.4 }); K.mat('floor', { map: TEX.planks('#9a6a3a', 14, 8), uv: 2 });
K.mat('bar', { color: 0x6a3a1e }); K.mat('bottle', { color: 0x3a8a4a, emis: 0.1 }); K.mat('bottle2', { color: 0xa05a2a }); K.mat('piano', { color: 0x3a2218 }); K.mat('keys', { color: 0xf6f2e6 }); K.mat('felt', { color: 0x2a6a3a });
K.mat('stone', { color: 0xe6dcc6 }); K.mat('gold', { color: 0xe8b83a, band: 0.2 }); K.mat('safe', { color: 0x3a3a44 }); K.mat('red', { color: 0xc2302a }); K.mat('steel', { color: 0xa8b0ba }); K.mat('anvil', { color: 0x34343c });
K.mat('signCurve', { map: TEX.sign('CURVE AHEAD', '#f4c430', '#1a1a1a', 1024, 256, 'sans-serif'), local: true });
K.mat('banner', { map: TEX.sign('CLATTERBROOK', '#f1e2c0', '#8a2418', 2048, 256), local: true }); K.mat('saloonSign', { map: TEX.sign('SALOON', '#5a3018', '#f4d27a'), local: true });
K.mat('bankSign', { map: TEX.sign('BANK', '#26365e', '#f4d27a'), local: true }); K.mat('workSign', { map: TEX.sign('TINKER SHOP', '#2d5a34', '#f4d27a'), local: true }); K.mat('stationSign', { map: TEX.sign('STATION', '#f2e8d2', '#2a1a14'), local: true });
K.mat('sign2', { map: TEX.sign('DRY GOODS', '#7a2a24', '#f6e2b0'), local: true }); K.mat('sign3', { map: TEX.sign('HOTEL', '#2d5a34', '#f4d27a'), local: true });
K.mat('sign4', { map: TEX.sign('BARBER', '#f2e8d2', '#a02a2a'), local: true }); K.mat('sign5', { map: TEX.sign('POST', '#26365e', '#f4d27a'), local: true });

const desert = (cx, cz, seed) => { K.box('sand', 240, 0.1, 240, cx, -0.05, cz); const r = C.rng(seed);
  for (let i = 0; i < 10; i++) { const a = r() * 6.28, d = 90 + r() * 60, s = 10 + r() * 12; const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; K.cyl(i % 2 ? 'mesa' : 'mesa2', s * 0.7, s, s * 0.6, x, s * 0.3, z, 7); K.cyl(i % 2 ? 'mesa' : 'mesa2', s * 0.62, s * 0.7, 0.6, x, s * 0.6 + 0.3, z, 7); }
  for (let i = 0; i < 40; i++) { const x = cx - 70 + r() * 140, z = cz - 60 + r() * 120; if (z > cz - 40 && z < cz + 20 && x < cx + 55) continue; if (i % 3 === 0) { K.cyl('cactus', 0.22, 0.28, 2.4, x, 1.2, z, 8); K.cyl('cactus', 0.14, 0.16, 0.9, x + 0.4, 1.5, z, 8); K.cyl('cactus', 0.14, 0.16, 0.7, x - 0.36, 1.2, z, 8); } else if (i % 3 === 1) K.add('rock', new THREE.DodecahedronGeometry(0.5 + r() * 1.2, 0), x, 0.3, z); else K.add('bush', new THREE.IcosahedronGeometry(0.4 + r() * 0.4, 0), x, 0.3, z); } };

// =============== ZONE: TOWN (origin) ===============
K.box('mud', 260, 0.1, 40, 0, -0.05, 3.2);
for (const [z0, z1] of [[-4.0, -2.4], [8.9, 10.5]]) { K.box('plank', 200, 0.25, z1 - z0, 0, 0.125, (z0 + z1) / 2); K.box('post', 200, 0.08, 0.1, 0, 0.21, z0 < 0 ? z1 : z0); }
const NORTH = [[-62, 8.6, 3, 'brick5', 'shut3', 'sign5'], [-53, 8.2, 4, 'brick2', 'shut2', null], [-44.5, 8.4, 3, 'brick4', 'shut', 'sign2'], [-17.5, 8.2, 3, 'brick2', 'shut3', null], [-9, 8.2, 4, 'brick4', 'shut', null], [0, 9, 5, 'brick', 'shut', 'sign3'], [9.2, 8.6, 4, 'brick3', 'shut2', null], [18, 8.4, 3, 'brick2', 'shut', 'sign4'], [26.5, 8, 4, 'brick4', 'shut3', null], [35, 8.4, 3, 'brick5', 'shut', null]];
NORTH.forEach(([x, w, fl, br, sh, sg], i) => facade(K, { x, zf: -4, w, floors: fl, brick: br, shut: sh, sign: sg, seed: 10 + i, cols: Math.round(w / 3), trim: i % 2 ? 'trim2' : 'trim', curtain: i % 2 ? 'curtain2' : 'curtain', awning: i % 2 ? 'awning2' : 'awning' }));
const SOUTH = [[-60, 8.4, 3, 'brick', 'shut2', null], [-51, 8.6, 4, 'brick3', 'shut', 'sign4'], [-21, 8.6, 3, 'brick3', 'shut', 'sign2'], [-12.4, 8.4, 4, 'brick', 'shut2', null], [-4, 8.2, 3, 'brick4', 'shut3', null], [4.4, 8.4, 4, 'brick2', 'shut', 'sign5'], [13, 8.6, 4, 'brick5', 'shut2', null], [21.6, 8.4, 3, 'brick', 'shut3', null], [30, 8.4, 4, 'brick2', 'shut', null]];
SOUTH.forEach(([x, w, fl, br, sh, sg], i) => facade(K, { x, zf: 10.5, face: -1, w, floors: fl, brick: br, shut: sh, sign: sg, seed: 40 + i, cols: Math.round(w / 3), trim: i % 2 ? 'trim' : 'trim3', curtain: i % 2 ? 'curtain' : 'curtain2', awning: i % 2 ? 'awning' : 'awning2' }));
// station + footbridge with stairs (x=-30) over the track
K.box('plank', 13, 0.5, 2.6, -33, 0.25, -1.1); K.box('stationSign', 4.2, 0.8, 0.08, -33, 4.4, -2.9); for (const x of [-39, -35, -31, -27]) K.box('post', 0.18, 3.6, 0.18, x, 2.05, -0.1); K.box('roof', 13.4, 0.18, 3.6, -33, 3.9, -1.6);
for (let i = 0; i < 18; i++) K.box('woodD', 0.42, 0.28, 1.3, -38.6 + i * 0.4, 0.64 + i * 0.28, -0.75);

K.box('woodD', 1.6, 0.25, 9, -31.2, 5.65, 3.2); for (const s of [-1, 1]) K.box('post', 0.08, 1.0, 9, -31.2 + s * 0.78, 6.25, 3.2); for (const z of [-0.8, 7.2]) for (const s of [-1, 1]) K.box('post', 0.22, 5.6, 0.22, -31.2 + s * 0.7, 2.8, z);
for (const x of [-20, 12, 40]) lamp(K, x, 0.25, -2.6); for (const x of [-8, 22]) lamp(K, x, 0.25, 9.1);
for (const [x, z] of [[-2.3, -3.55], [-2.95, -3.5], [16.5, 9.6], [17.1, 9.7]]) barrel(K, x, 0.25, z, 0.95); crate(K, 2.4, 0.25, -3.4, 0.62, 0.2); crate(K, -42, 0.25, -3.2, 0.6, 0.3);
K.box('post', 0.18, 6.2, 0.18, -5.2, 3.1, -2.6); K.box('post', 0.18, 6.2, 0.18, -5.2, 3.1, 9.2); K.box('banner', 0.05, 1.0, 10.4, -5.2, 5.4, 3.3);
const TRK_TOWN = makeTrack(K, { x: -110, z: 3, h: 0 }, [{ line: 240 }]);

// =============== ZONE: CURVE (desert, x≈400) ===============
desert(420, -10, 5);
const TRK_CURVE = makeTrack(K, { x: 300, z: 0, h: 0 }, [{ line: 100 }, { arc: 30, ang: Math.PI / 2 }, { line: 120 }], { railKeys: ['railIn', 'railOut'] });
K.box('post', 0.12, 2.4, 0.12, 392, 1.2, 3.2); K.box('signCurve', 2.6, 0.65, 0.06, 392, 2.5, 3.2, -0.25);
for (let i = 0; i < 9; i++) { const p = TRK_CURVE.at(20 + i * 22); const ox = Math.sin(p.h) * 4.2, oz = Math.cos(p.h) * 4.2; K.cyl('post', 0.09, 0.12, 6, p.x + ox, 3, p.z + oz, 6); K.box('post', 1.2, 0.08, 0.08, p.x + ox, 5.7, p.z + oz, p.h); }
K.cyl('woodD', 2.2, 2.2, 4.2, 380, 6.0, -8, 14); K.cyl('roof', 0.1, 2.6, 1.6, 380, 8.9, -8, 14); for (const [dx, dz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) K.cyl('post', 0.12, 0.12, 4.2, 380 + dx, 2.1, -8 + dz, 6);

// =============== ZONE: SALOON (x≈800) ===============
desert(800, -10, 9);
const TRK_SAL = makeTrack(K, { x: 730, z: 0, h: 0 }, [{ line: 70 }, { arc: 26, ang: Math.PI / 2 }, { line: 40 }]);
K.box('floor', 14, 0.3, 14, 819, 0.15, 0); K.box('wood', 0.3, 5, 14, 826, 2.65, 0); K.box('wood', 14, 5, 0.3, 819, 2.65, -7); K.box('wood', 14, 5, 0.3, 819, 2.65, 7); K.box('roof', 15, 0.3, 15, 819, 5.3, 0);
K.box('woodD', 0.4, 2.2, 14.6, 811.9, 6.2, 0); K.box('saloonSign', 5.6, 1.1, 0.08, 811.6, 6.2, 0, -Math.PI / 2);
K.box('bar', 1.2, 1.2, 8, 823.6, 0.9, -1); K.box('woodD', 1.4, 0.12, 8.2, 823.6, 1.56, -1); for (let i = 0; i < 3; i++) K.box('woodD', 0.4, 0.08, 9, 825.6, 2.2 + i * 0.7, -1);
for (let i = 0; i < 24; i++) K.cyl(i % 2 ? 'bottle' : 'bottle2', 0.07, 0.07, 0.36, 825.6, 2.44 + Math.floor(i / 8) * 0.7, -4.8 + (i % 8) * 1.1, 8);
K.box('piano', 1.0, 1.5, 2.4, 825.3, 1.05, 5.2); K.box('keys', 0.4, 0.08, 2.0, 824.6, 1.3, 5.2); K.box('piano', 0.6, 0.4, 0.8, 823.6, 0.5, 5.2);
for (const [x, z] of [[817, -4.5], [818.5, 3.2], [815.5, 1.0]]) { K.cyl('felt', 0.9, 0.9, 0.08, x, 1.1, z, 18); K.cyl('woodD', 0.1, 0.1, 0.8, x, 0.7, z, 8); for (const a of [0, 2.1, 4.2]) K.box('woodD', 0.45, 0.5, 0.45, x + Math.cos(a) * 1.3, 0.55, z + Math.sin(a) * 1.3); }
K.cyl('iron', 0.9, 0.9, 0.08, 819, 4.6, 0, 16); for (let i = 0; i < 6; i++) K.box('lampGlass', 0.16, 0.24, 0.16, 819 + Math.cos(i) * 0.85, 4.7, Math.sin(i) * 0.85);
const SAL_WALL = []; const wallM = tm(0xb07a44), wallD = tm(0x7a4e2a), doorM = tm(0xd8a04a);
for (let i = 0; i < 12; i++) { const z = -6.4 + i * 1.16; if (Math.abs(z) < 1.0) continue; SAL_WALL.push({ mesh: box(0.25, 5, 1.12, i % 3 ? wallM : wallD, 812, 2.65, z), v: [8 + C.hash(i) * 6, 3 + C.hash(i + 3) * 4, z * 0.8 + (C.hash(i + 9) - 0.5) * 4], spin: [C.hash(i + 1) * 6 - 3, C.hash(i + 2) * 4, C.hash(i + 5) * 6 - 3] }); }
SAL_WALL.push({ mesh: box(0.25, 3.0, 2.0, wallD, 812, 4.15, 0), v: [9, 5, 0], spin: [0, 2, 5] });
for (const s of [-1, 1]) SAL_WALL.push({ mesh: box(0.1, 1.4, 0.95, doorM, 812, 1.6, s * 0.5), v: [10, 4, s * 5], spin: [0, 8 * s, 4] });
const SAL_DEB = new Debris(W, SAL_WALL, { floor: 0.3 });

// =============== ZONE: BANK (x≈1200) ===============
desert(1200, 10, 13);
const TRK_BANK = makeTrack(K, { x: 1130, z: 0, h: 0 }, [{ line: 70 }, { arc: 26, ang: -Math.PI / 2 }, { line: 40 }]);
K.box('floor', 14, 0.3, 14, 1219, 0.15, 0); K.box('stone', 0.4, 6, 14, 1226, 3.1, 0); K.box('stone', 14, 6, 0.4, 1219, 3.1, -7); K.box('stone', 14, 6, 0.4, 1219, 3.1, 7); K.box('roof', 15, 0.4, 15, 1219, 6.2, 0);
K.box('stone', 1.2, 1.0, 15.2, 1211.6, 6.9, 0); K.box('bankSign', 4.2, 1.0, 0.08, 1211.0, 6.9, 0, -Math.PI / 2); for (const z of [-6.5, 6.5]) K.cyl('stone', 0.35, 0.4, 6, 1211.4, 3.0, z, 16);
K.box('woodD', 1.0, 1.3, 9, 1223.5, 0.95, 0); for (let i = 0; i < 6; i++) K.box('gold', 0.06, 0.8, 0.06, 1223.0, 2.0, -4 + i * 1.6); K.box('safe', 1.6, 2.2, 1.6, 1225, 1.4, 5);
for (let i = 0; i < 8; i++) K.cyl('gold', 0.2, 0.2, 0.12 + (i % 3) * 0.1, 1224.2 + (i % 2) * 0.5, 1.76, -3 + i * 0.4, 12);
const BANK_WALL = []; const stoneM = tm(0xe6dcc6), stoneD = tm(0xd2c6ac);
for (let r = 0; r < 5; r++) for (let i = 0; i < 9; i++) { const z = -6.2 + i * 1.55 + (r % 2) * 0.4, y = 0.9 + r * 1.1; if (z > 6.4) continue; BANK_WALL.push({ mesh: box(0.4, 1.05, 1.5, (r + i) % 2 ? stoneM : stoneD, 1212, y, z), v: [9 + C.hash(r * 9 + i) * 6, 2 + C.hash(r * 9 + i + 3) * 5, z * 0.9 + (C.hash(r * 9 + i + 7) - 0.5) * 3], spin: [C.hash(i + r) * 5, C.hash(i + r + 1) * 3, C.hash(i + r + 2) * 5], delay: 0.03 * Math.abs(z) / 6 }); }
const BANK_DEB = new Debris(W, BANK_WALL, { floor: 0.3 });

// =============== ZONE: WORKSHOP (x≈-400) ===============
desert(-400, 0, 17); K.box('dirt', 60, 0.06, 60, -400, 0.0, 0); K.box('floor', 12, 0.25, 9, -400, 0.12, -1.5);
K.box('woodD', 12, 5, 0.3, -400, 2.6, -6); K.box('woodD', 0.3, 5, 9, -406, 2.6, -1.5); K.box('woodD', 0.3, 5, 9, -394, 2.6, -1.5); K.box('roof', 13, 0.3, 10.5, -400, 5.3, -1.2); K.box('workSign', 4.2, 0.9, 0.08, -400, 5.9, 3.6);
K.box('wood', 4.5, 0.15, 1.2, -396.6, 1.1, -5.0); for (const x of [-398.6, -394.6]) K.box('woodD', 0.15, 1.0, 1.0, x, 0.55, -5.0);
K.cyl('woodD', 0.5, 0.6, 0.7, -403.5, 0.6, -2.5, 10); K.box('anvil', 0.9, 0.35, 0.4, -403.5, 1.12, -2.5); K.box('anvil', 0.5, 0.3, 0.3, -403.5, 0.85, -2.5);
K.box('anvil', 3.6, 0.22, 0.5, -395.8, 0.36, -2.6); for (const x of [-397.4, -394.2]) K.box('anvil', 0.3, 0.25, 0.6, x, 0.12, -2.6); K.box('red', 0.8, 0.9, 0.8, -397.6, 1.55, -2.6); K.box('red', 0.5, 0.6, 0.6, -394.2, 1.4, -2.6);
for (let i = 0; i < 6; i++) K.box('iron', 0.08, 0.5, 0.08, -405.6, 2.6 + (i % 3) * 0.6, -5.2 + Math.floor(i / 3) * 1.1);
for (const [x, z] of [[-405, 1.5], [-404.3, 2.1]]) barrel(K, x, 0.25, z, 0.9); crate(K, -395, 0.25, 1.6, 0.6, 0.2); lamp(K, -393, 0, 3.6);
for (let i = 0; i < 4; i++) K.add('iron', new THREE.TorusGeometry(0.35 + i * 0.06, 0.05, 6, 18), -401 + i * 0.9, 3.6, -5.8);

// =============== ZONE: STUDIO (x≈1600) ===============
desert(1600, 0, 21);
const TRK_STUDIO = makeTrack(K, { x: 1590, z: 0, h: 0 }, [{ line: 20 }]);
K.box('stone', 14, 0.05, 1.0, 1604, 0.04, 9); K.box('stone', 14, 0.05, 1.0, 1604, 0.04, 12);
K.finish();
const RAIL_OUT = K.mats.get('railOut').m, RAIL_IN = K.mats.get('railIn').m;
const arcTube = (r, col) => { const pts = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI / 2; pts.push(V(400 + Math.sin(a) * r, 0.42, -30 + Math.cos(a) * r)); } const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.28, 8), tm(col, { emis: 1.3, unlit: 1, noInk: 1 })); m.visible = false; W.add(m); return m; };
const GLOW_O = arcTube(30.75, 0xffd23a), GLOW_I = arcTube(29.25, 0x4ad0ff);
const cloudM = tm(0xfff6ea, { unlit: 0.5 });
for (const cx of [0, 420, 800, 1200, -400, 1600]) for (let i = 0; i < 5; i++) { const g = new THREE.Group(); for (let k = 0; k < 5; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(3 + (k % 3), 12, 8), cloudM); m.position.set(k * 3.4 - 7, (k % 2) * 1.2, 0); m.scale.y = 0.7; g.add(m); } g.position.set(cx - 60 + i * 30, 30 + (i % 3) * 6, -70 + (i % 2) * 140); W.add(g); }

// =============== TRAINS + PROPS ===============
const TF = makeTrain({ kind: 'flat' }); TF.cars.forEach((g) => W.add(g));
const TC = makeTrain({ kind: 'cone', body: '#2a6ab0', wheel: '#e8b83a' }); TC.cars.forEach((g) => W.add(g));
const STANDW = makeWheelset('flat', 0.62); STANDW.group.position.set(-400.9, 0.25, -0.5); STANDW.group.rotation.y = 0.5; W.add(STANDW.group);
const LATHE_F = makeWheelset('flat', 0.55), LATHE_C = makeWheelset('cone', 0.55);
for (const L of [LATHE_F, LATHE_C]) { L.group.position.set(-395.8, 1.1 - 0.55, -2.6); L.group.rotation.y = Math.PI / 2; W.add(L.group); }
const SHOWW = makeWheelset('cone', 0.62); SHOWW.group.position.set(-401.5, 0.25, 1.0); SHOWW.group.rotation.y = -0.35; W.add(SHOWW.group);
const STUDW = makeWheelset('cone', 0.85); STUDW.group.position.set(1600, 0.37, 0); W.add(STUDW.group);
const ROLL_F = makeWheelset('cone', 1.0), ROLL_T = makeWheelset('cone', 0.7);
for (const [R, z] of [[ROLL_F, 9], [ROLL_T, 12]]) { R.group.position.set(1598, 0.06, z - 0.75); R.wheels[0].visible = false; R.group.children[2].visible = false; W.add(R.group); }
const ribbon = (col) => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.03, 0.5), tm(col, { emis: 0.3 })); W.add(m); return m; };
const RIB_F = ribbon(0xf4c430), RIB_T = ribbon(0x4a8ad8);
const BULB = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), tm(0xfff2a0, { emis: 1.2, unlit: 1, noInk: 1 })); W.add(BULB);
const CONTACT_O = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.05, 8, 40), tm(0xf4c430, { emis: 1.4, unlit: 1, noInk: 1 })), CONTACT_I = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.05, 8, 40), tm(0x4ad0ff, { emis: 1.4, unlit: 1, noInk: 1 }));
for (const c of [CONTACT_O, CONTACT_I]) { STUDW.group.add(c); c.visible = false; }
CONTACT_O.position.set(0, 0.85, 0.66); CONTACT_I.position.set(0, 0.85, -0.84);

// =============== CAST ===============
const P = (id, k, extra = {}) => new Flat2D(role(id, k, extra));
const TINK = P('inventor', 1), TINKB = new Flat2D({ ...role('inventor', 1), size: 1.8 });   // full body standing on the cab floor: walls hide the legs, no cut edge
const RIDER = new Flat2D({ ...role('cowboy', 2), bust: true, res: 1.6, front: 0.3 }); const HORSE = new Horse2D({ coat: '#a8642e' });
const CROWD = [['farmer', 0], ['lady', 1], ['kid', 2], ['girl', 0], ['sheriff', 1], ['grandma', 0], ['gentleman', 2], ['shopkeeper', 0], ['postman', 1], ['teen', 3], ['worker', 1], ['tourist', 0]].map(([id, k]) => P(id, k));
const PIANO = P('musician', 1), DRINK = P('cowboy', 4), BARK = P('waiter', 0), DANCER = P('lady', 3);
const SPECT = [P('gentleman', 4), P('teacher', 1), P('worker', 5)];
const BANKER = P('banker', 0, { front: 0.5 }); const BANKER_RIDE = new Flat2D({ ...role('banker', 0), front: 1.9 }); const PEEK = [P('grandpa', 0), P('reporter', 1), P('athlete', 0)];
const CARDS = [TINK, TINKB, RIDER, ...SPECT, ...CROWD, PIANO, DRINK, BARK, DANCER, BANKER, BANKER_RIDE, ...PEEK];

// =============== SIGNS + PARTICLES ===============
const S = {
  flat: new Sign('PERFECTLY FLAT', { bg: '#f6d84a', h: 0.24 }), screech: new Sign('SCREEEECH!', { bg: '#e8402a', fg: '#fff', h: 1.1 }), q: new Sign('?', { bg: '#fff', h: 0.55 }),
  fat1: new Sign('FAT', { bg: '#f4c430', h: 0.4, arrow: 'right' }), thin1: new Sign('THIN', { bg: '#4ad0ff', h: 0.4, arrow: 'left' }),
  longer: new Sign('LONGER', { bg: '#f4c430', h: 5.5 }), shorter: new Sign('SHORTER', { bg: '#4ad0ff', h: 5.5 }), out: new Sign('OUTWARD', { bg: '#fff', h: 0.55, arrow: 'right' }),
  fat2: new Sign('FAT PART', { bg: '#f4c430', h: 0.45 }), thin2: new Sign('THIN PART', { bg: '#4ad0ff', h: 0.45 }), turn1: new Sign('1 TURN', { bg: '#f4c430', h: 0.6 }), turn2: new Sign('1 TURN', { bg: '#4ad0ff', h: 0.6 }),
  more: new Sign('MORE GROUND!', { bg: '#7ad85a', h: 0.5 }), nosteer: new Sign('NO STEERING WHEEL', { bg: '#fff', h: 0.2 }), cones: new Sign('JUST CONES', { bg: '#f4c430', h: 0.4 }), ha: new Sign('HA HA HA', { bg: '#fff', h: 1.0, panel: false }),
  boom: new Sign('CRASH!', { bg: '#f4c430', h: 1.6, panel: false }), x: new Sign('X', { bg: '#e8402a', h: 3.0, panel: false }), butter: new Sign('SMOOTH!', { bg: '#7ad85a', h: 1.4 }), bank: new Sign('BOOM!', { bg: '#f4c430', h: 1.6, panel: false }),
};
const B = {
  spark1: new Burst({ n: 60, dur: 2.6, life: 0.45, speed: [3, 7], dir: [0, 1, 1], spread: 0.9, g: -12, size: [0.12, 0.3], tex: 'spark', seed: 1 }),
  spark2: new Burst({ n: 60, dur: 2.6, life: 0.45, speed: [3, 7], dir: [0, 1, -1], spread: 0.9, g: -12, size: [0.12, 0.3], tex: 'spark', seed: 2 }),
  smoke: new Burst({ n: 40, dur: 3.0, life: 1.8, speed: [0.6, 2.0], dir: [0, 1, 0], spread: 1.2, g: 0.6, size: [0.8, 1.6], grow: 2.2, tex: 'smoke', add: false, opacity: 0.85, seed: 3, spin: 2 }),
  chimney: new Burst({ n: 30, dur: 1, life: 1.4, speed: [2, 4], dir: [-0.4, 1, 0], spread: 0.3, g: 0.5, size: [0.5, 0.9], grow: 2.6, tex: 'smoke', add: false, opacity: 0.8, seed: 4, spin: 1 }),
  dust: new Burst({ n: 40, dur: 0.6, life: 1.6, speed: [2, 6], dir: [0, 0.6, 0], spread: 1.2, g: -1, size: [0.8, 1.8], grow: 1.6, tex: 'dust', add: false, opacity: 0.9, seed: 5, spin: 1 }),
  planks: new Burst({ n: 40, dur: 0.25, life: 1.4, speed: [3, 9], dir: [1, 0.6, 0], spread: 1.0, g: -9, size: [0.1, 0.3], tex: 'card', add: false, seed: 6, spin: 14 }),
  glass: new Burst({ n: 30, dur: 0.2, life: 1.0, speed: [2, 6], dir: [0, 1, 0], spread: 1.0, g: -9, size: [0.08, 0.18], tex: 'glass', add: false, seed: 7, spin: 12 }),
  coins: new Burst({ n: 80, dur: 1.0, life: 1.6, speed: [3, 8], dir: [0.3, 1, 0], spread: 0.9, g: -9, size: [0.14, 0.24], tex: 'coin', add: false, seed: 8, spin: 10 }),
  shave: new Burst({ n: 60, dur: 1.4, life: 0.9, speed: [2, 5], dir: [0, 1, 1], spread: 0.8, g: -9, size: [0.08, 0.18], tex: 'shaving', add: false, seed: 9, spin: 12 }),
  lsparks: new Burst({ n: 50, dur: 1.4, life: 0.35, speed: [2, 6], dir: [0, 1, 1], spread: 0.8, g: -10, size: [0.04, 0.1], tex: 'spark', seed: 10 }),
  anvil: new Burst({ n: 24, dur: 1.2, life: 0.3, speed: [2, 5], dir: [0, 1, 0], spread: 1, g: -10, size: [0.04, 0.1], tex: 'spark', seed: 11 }),
  stars: new Burst({ n: 40, dur: 2.0, life: 0.8, speed: [0.4, 1.2], dir: [0, 1, 0], spread: 1.2, g: 0, size: [0.2, 0.45], tex: 'star', seed: 12, spin: 3 }),
  confetti: new Burst({ n: 70, dur: 0.6, life: 2.2, speed: [3, 7], dir: [0, 1, 0], spread: 0.9, g: -4, size: [0.1, 0.18], tex: 'confetti', add: false, seed: 13, spin: 10 }),
  coins2: new Burst({ n: 40, dur: 1.4, life: 1.2, speed: [0.5, 2], dir: [0, 1, 0], spread: 1.2, g: -6, size: [0.14, 0.22], tex: 'coin', add: false, seed: 14, spin: 8 }),
};

// =============== TIMELINE ===============
const ZONES = [[0, T(9), 'town'], [T(9), T(16), 'curve'], [T(16), T(26), 'work'], [T(26), T(31), 'town'], [T(31), T(41), 'curve'], [T(41), T(53), 'saloon'], [T(53), T(64), 'bank'], [T(64), T(86), 'work'], [T(86), T(90), 'town'], [T(90), T(112), 'curve'], [T(112), T(143), 'studio'], [T(143), T(166), 'curve'], [T(166), 99, 'town']];
const zoneAt = (t) => { for (const z of ZONES) if (t >= z[0] && t < z[1]) return z[2]; return 'town'; };
const smoothStop = (t, t0, s0, v, maxD) => (t < t0 ? s0 + v * (t - t0) : s0 + maxD * (1 - Math.exp(-(t - t0) * v / maxD)));
function trainPlan(t, z) {
  if (z === 'town' && t < T(9)) return { tr: TRK_TOWN, T: TF, s: 30 + 20 * t };
  if (z === 'curve' && t < T(16)) return { tr: TRK_CURVE, T: TF, s: 100 + 20 * (t - 4.25), der: { s: 101, stop: 124, hop: 1.4, len: 12, roll: 0.55 } };
  if (z === 'town' && t < T(31)) return { tr: TRK_TOWN, T: TF, s: 52 + 15 * (t - T(26)) };
  if (z === 'curve' && t < T(41)) return { tr: TRK_CURVE, T: TF, s: 100 + 14 * (t - T(36)) };
  if (z === 'saloon') return { tr: TRK_SAL, T: TF, s: smoothStop(t, T(45), 70, 16, 14), der: { s: 70, stop: 999, hop: 0.9, len: 7, roll: 0.1 } };
  if (z === 'bank') return { tr: TRK_BANK, T: TF, s: smoothStop(t, T(55), 70, 16, 14), der: { s: 70, stop: 999, hop: 0.7, len: 6, roll: -0.1 } };
  if (z === 'town' && t < T(90)) return { tr: TRK_TOWN, T: TC, s: 95 };
  if (z === 'curve' && t < T(112)) { const s = t < T(98) ? 92 + 16 * (t - T(90)) : 92 + 16 * (T(98) - T(90)) + 6 * (t - T(98)); return { tr: TRK_CURVE, T: TC, s }; }
  if (z === 'curve') return { tr: TRK_CURVE, T: TC, s: 88 + 15 * (t - T(143)) };
  if (z === 'town') return { tr: TRK_TOWN, T: TC, s: 58 + 11 * (t - T(166)) };
  return null;
}
const TP = { plan: null };
const solveHit = (z, t0, t1, x0, wallX) => { let lo = t0, hi = t1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (x0 + trainPlan(m, z).s + 5.0 < wallX) lo = m; else hi = m; } return lo; };
const HIT_SAL = solveHit('saloon', T(45), T(53), 730, 812), HIT_BANK = solveHit('bank', T(55), T(64), 1130, 1212);

const hideCard = (c) => { c.mesh.visible = false; if (c.shadow) c.shadow.visible = false; };
function setup(t, cam) {
  const z = zoneAt(t);
  const pl = trainPlan(t, z); for (const TT of [TF, TC]) for (const g of TT.cars) g.visible = false;
  if (pl) { for (const g of pl.T.cars) g.visible = true; pl.T.place((q) => pl.tr.posAt(q, pl.der), pl.s, pl.s); for (const g of pl.T.cars) g.updateMatrixWorld(true); }
  TP.plan = pl; const tr = pl ? pl.T : TF;
  for (const c of CARDS) hideCard(c); HORSE.mesh.visible = false;
  if (pl && z !== 'studio') { const sp = tr.cabSeat(); TINKB.place(sp.x, sp.y, sp.z);
    const scared = (t > T(35) && t < T(41)) || (t > T(43) && t < T(64)), relax = t > T(143);
    TINKB.update({ face: scared ? (Math.floor(t * 6) % 2 ? 'panic' : 'shock') : relax ? (t > T(147) && t < T(150) ? 'laugh' : 'proud') : t > T(26) && t < T(31) ? 'proud' : t > T(31) ? 'worried' : 'grin', tilt: scared ? 6 * Math.sin(t * 30) : 4 * Math.sin(t * 3), sweat: scared ? t * 3 : 0 }, cam); if (TINKB.shadow) TINKB.shadow.visible = false; }
  if (z === 'town') {
    if (t < T(9)) { const hx = -38 + 13 * t; HORSE.place(hx, 0, 6.6); HORSE.update({ gallop: t * 14, flip: cam ? cam.z < 6.6 : false }, cam); HORSE.mesh.visible = true;
      const rb = HORSE.backWorld(); const toCam = cam ? cam.clone().sub(rb).setY(0).normalize().multiplyScalar(0.1) : V(); RIDER.place(rb.x + toCam.x, rb.y - 0.12, rb.z + toCam.z);
      const passed = t > 2.6; RIDER.update({ face: passed ? 'shock' : 'grin', hatOff: passed ? Math.min(60, (t - 2.6) * 160) : 0, tilt: passed ? -8 : 3 * Math.sin(t * 14) }, cam); }
    const cheer = t > T(26) && t < T(31), laugh = t > T(86) && t < T(90);
    if (cheer || laugh) CROWD.forEach((c, i) => { const south = i > 5; const x = (laugh ? -19 : -14) + (i % 6) * 1.3 + (south ? 0.6 : 0);
      c.place(laugh ? -20 + (i % 6) * 1.35 + (south ? 0.7 : 0) : x, laugh ? 0 : 0.25, laugh ? (south ? -1.6 : -0.3) : (south ? 9.6 : -3.1)); const pose = laugh ? (i % 3 === 0 ? 'point' : 'laugh') : (i % 2 ? 'cheer' : 'wave');
      c.update({ ...act(t + i * 0.13, [[0, pose]]), flip: laugh ? false : south, face: laugh ? (i % 3 === 0 ? 'grin' : 'laugh') : (i % 2 ? 'laugh' : 'grin') }, cam); });
    if (t > T(166)) { const u = clamp((t - T(169)) / (DURATION - T(169)), 0, 1); const k = Math.min(11, Math.floor(u * 12)); BANKER.place(-38.6 + k * 0.4 + 0.1, 0.78 + 0.28 * k, -0.75);
      BANKER.update({ ...act(t, [[0, 'walk']]), amp: 18, flip: true, face: t > T(171) ? 'smug' : 'deadpan', sweat: t * 2 }, cam); }
  }
  if (z === 'work') {
    const early = t < T(26);
    TINK.place(early ? -402.4 : t < T(71) ? -398.6 : -396.0, 0.25, early ? -1.4 : t < T(71) ? -1.0 : -0.9);
    const plan = early ? [[T(16), 'hips'], [T(19), 'angry'], [T(22), 'point'], [T(24), 'hips']] : [[T(64), 'think'], [T(69), 'pointUp'], [T(71), 'push'], [T(78), 'point'], [T(82), 'point']];
    const hammer = early && t > T(19) && t < T(22);
    TINK.update({ ...act(t, plan), ...(hammer ? { armL: [150 - 110 * Math.abs(Math.sin(t * 12)), 20] } : {}), flip: early ? false : t > T(78),
      face: early ? (t > T(24) ? 'smug' : hammer ? 'angry' : t > T(22) ? 'grin' : 'proud') : t < T(69) ? { eyes: 'dot', mouth: 'wobble', look: [0.8, -1], brow: 0.9 } : t < T(71) ? 'idea' : t < T(78) ? 'evil' : 'proud',
      mark: !early && t > T(69) && t < T(71) + 0.3 ? '!' : null }, cam);
    if (!early && t < T(71)) PEEK.forEach((c, i) => { c.place(-397.4 + i * 1.15, 0.25, 2.6 + (i % 2) * 0.35); c.update({ ...act(t, [[0, ['shrug', 'think', 'hips'][i]]]), face: i === 1 ? 'awe' : 'confused', mark: t > T(68) ? '?' : null }, cam); });
  }
  if (z === 'curve' && t > T(90) && t < T(98) + 0.6) SPECT.forEach((c, i) => { c.place(434 + i * 1.3, 0, 7 + (i % 2) * 0.6); const wow = t > T(95);
    c.update({ ...act(t, [[T(90), i === 1 ? 'hips' : 'think'], [T(95), wow ? 'shock' : 'idle'], [T(96), i === 2 ? 'cheer' : 'shock']]), flip: true, face: wow ? (i === 2 ? 'laugh' : 'awe') : 'smug' }, cam); });
  if (z === 'saloon') {
    const hit = t > HIT_SAL, post = t > HIT_SAL + 0.6;
    PIANO.place(823.2, 0.3, 4.2); PIANO.update({ armL: [70, 30 + 20 * Math.sin(t * 20)], armR: [70, 30 + 20 * Math.sin(t * 20 + 2)], flip: true, face: post ? 'deadpan' : hit ? 'shock' : 'laugh', tilt: 5 * Math.sin(t * 6), mark: post && t < HIT_SAL + 1.4 ? '?' : null }, cam);
    DRINK.place(817.5, 0.3, -2.6); DRINK.update({ ...act(t, [[0, 'idle'], [HIT_SAL, 'shock'], [HIT_SAL + 0.5, 'shrug']]), face: hit ? 'shock' : 'grin', hatOff: hit ? 40 : 0 }, cam);
    BARK.place(823.0, 0.3, -3.0); BARK.update({ ...act(t, [[0, 'idle'], [HIT_SAL, 'shock']]), flip: true, face: hit ? 'scared' : 'deadpan' }, cam);
    DANCER.place(819.5, 0.3, 2.2); DANCER.update({ ...act(t, [[0, 'cheer'], [HIT_SAL, 'panic']]), face: hit ? 'panic' : 'laugh' }, cam);
  }
  if (z === 'bank') {
    const hit = t > HIT_BANK; const lp = hit ? tr.pilot() : V(1222.5, 0.3, 1.0);
    const BK = hit ? BANKER_RIDE : BANKER; BK.place(lp.x + (hit ? 0.25 : 0), hit ? lp.y + 0.3 : 0.3, lp.z); BK.update({ ...act(t, [[0, 'idle'], [HIT_BANK, 'carry']]), legOut: hit ? 35 : 0, flip: true, face: hit ? (Math.floor(t * 6) % 2 ? 'panic' : 'shock') : 'smug', sweat: hit ? t * 3 : 0, hatOff: hit ? 30 : 0 }, cam);
  }
  SAL_DEB.update(z === 'saloon' ? t : 0, HIT_SAL); BANK_DEB.update(z === 'bank' ? t : 0, HIT_BANK);
  const gO = z === 'curve' && t > T(104) && t < T(112), gI = z === 'curve' && t > T(109) && t < T(112);
  RAIL_OUT.uniforms.uColor.value.setHex(gO ? 0xffd23a : 0xa8b0ba); RAIL_OUT.uniforms.uEmis.value = gO ? 0.9 : 0; RAIL_IN.uniforms.uColor.value.setHex(gI ? 0x4ad0ff : 0xa8b0ba); RAIL_IN.uniforms.uEmis.value = gI ? 0.9 : 0;
  GLOW_O.visible = gO; GLOW_I.visible = gI; SHOWW.group.visible = t > T(77);
  const swapped = t > T(77); LATHE_F.group.visible = !swapped; LATHE_C.group.visible = swapped; for (const L of [LATHE_F, LATHE_C]) for (const w of L.wheels) w.userData.spin.rotation.z = t > T(72) && t < T(78) ? -t * 30 : 0;
  STANDW.group.rotation.y = 0.5 + (t > T(22) && t < T(26) ? (t - T(22)) * 2.2 : 0); SHOWW.group.rotation.y = -0.35 + (t > T(78) && t < T(86) ? (t - T(78)) * 0.4 : 0);
  STUDW.group.position.y = 0.37; STUDW.group.position.z = sstep(T(115), T(116) + 0.3, t) * 0.12; CONTACT_O.visible = z === 'studio' && t > T(124); CONTACT_I.visible = z === 'studio' && t > T(132);
  const ru = sstep(T(134), T(142), t); for (const [R, r, rib, z0] of [[ROLL_F, 1.0, RIB_F, 9], [ROLL_T, 0.7, RIB_T, 12]]) { const d = ru * 2 * Math.PI * r; R.group.position.x = 1598 + d; R.wheels[1].userData.spin.rotation.z = -d / r; rib.scale.set(Math.max(0.01, d), 1, 1); rib.position.set(1598 + d / 2, 0.06, z0); }
  BULB.visible = z === 'work' && t > T(69) && t < T(71) + 0.4; BULB.position.set(-396.0, 2.55 + 0.05 * Math.sin(t * 20), -1.4);
}

function fx(t, cam) {
  const z = zoneAt(t), pl = TP.plan, tr = pl ? pl.T : TF;
  const inCurve1 = z === 'curve' && t > T(36) && t < T(41);
  B.spark1.update(inCurve1 ? t : -9, T(37), () => tr.wheelWorld(0).add(V(0, -0.6, 0)), cam, 0.5); B.spark2.update(inCurve1 ? t : -9, T(37), () => tr.wheelWorld(3).add(V(0, -0.6, 0)), cam, 0.5);
  B.smoke.update(inCurve1 && t > T(39) ? t : -9, T(39), () => tr.wheelWorld(1).add(V(-2, 0, 0)), cam, 1.8);
  B.chimney.update(pl && z !== 'saloon' && z !== 'bank' && t < T(166) ? t : -9, 0, () => tr.chimney(), cam, 1.4);
  B.dust.update(z === 'curve' && t < T(16) ? t : -9, 4.6, () => tr.loco.position.clone(), cam);
  B.planks.update(z === 'saloon' ? t : -9, HIT_SAL, V(812, 2, 0), cam); B.glass.update(z === 'saloon' ? t : -9, HIT_SAL + 0.1, V(818, 1.4, -1), cam);
  B.coins.update(z === 'bank' ? t : -9, HIT_BANK, V(1214, 1.6, 0), cam); B.coins2.update(z === 'bank' ? t : -9, HIT_BANK + 0.4, () => tr.pilot().add(V(0, 1.6, 0)), cam, 1.2);
  B.shave.update(z === 'work' && t > T(72) && t < T(78) ? t : -9, T(72), V(-395.8, 1.2, -2.3), cam, 1.4); B.lsparks.update(z === 'work' && t > T(72) && t < T(78) ? t : -9, T(72), V(-395.6, 1.1, -2.2), cam, 1.4);
  B.anvil.update(z === 'work' && t > T(19) && t < T(22) ? t : -9, T(19), V(-403.5, 1.35, -2.5), cam, 0.25);
  B.stars.update(z === 'curve' && t > T(93) && t < T(98) + 0.5 ? t : -9, T(93), () => tr.wheelWorld(0).add(V(0, 0.4, 0)), cam, 2.0);
  B.confetti.update(z === 'town' && t > T(28) && t < T(31) ? t : -9, T(29), V(-8, 4.5, 3), cam);
  S.flat.update(t, T(24), T(26) - 0.05, V(-400.9, 1.75, -0.3), cam); S.screech.update(t, T(38), T(39) + 0.4, () => tr.loco.position.clone().add(V(0, 5.2, 0)), cam);
  S.x.update(t, T(15), T(16) - 0.05, () => tr.loco.position.clone().add(V(0, 5, 0)), cam); S.boom.update(t, HIT_SAL, HIT_SAL + 0.9, V(812, 4.0, 0), cam); S.bank.update(t, HIT_BANK, HIT_BANK + 0.7, V(1212, 4.0, 0), cam); S.q.update(t, T(68), T(71), V(-396.2, 3.1, 2.8), cam);
  S.fat1.update(t, T(78), T(86), () => SHOWW.group.localToWorld(V(0, 1.55, -0.55)), cam); S.thin1.update(t, T(82), T(86), () => SHOWW.group.localToWorld(V(0, 1.55, 1.25)), cam);
  S.ha.update(t, T(87), T(90), V(-15, 3.6, 2.8), cam); S.butter.update(t, T(96), T(98) + 0.4, () => tr.loco.position.clone().add(V(0, 5.5, 0)), cam);
  S.longer.update(t, T(107), T(112), V(427, 2, -2.6), cam); S.shorter.update(t, T(110), T(112), V(414.5, 2, -15.5), cam);
  S.out.update(t, T(115), T(117), V(1600, 2.4, 1.4), cam); S.fat2.update(t, T(124), T(128), V(1600, 2.2, 1.1), cam); S.thin2.update(t, T(132), T(134), V(1600, 2.2, -1.1), cam);
  S.turn1.update(t, T(141), T(143), V(1598 + 2 * Math.PI * 1.0, 2.6, 9), cam); S.turn2.update(t, T(141), T(143), V(1598 + 2 * Math.PI * 0.7, 2.0, 12), cam); S.more.update(t, T(138), T(143), V(1603, 3.8, 10.5), cam);
  S.nosteer.update(t, T(147), T(150), () => tr.cabSeat().add(V(0, 2.1, 0)), cam); S.cones.update(t, T(150), T(152), () => tr.wheelWorld(0).add(V(0, 1.2, 0)), cam);
}

// =============== CAMERA (director) ===============
const CINE = new Cine({ blend: 0.28 });
const loco = () => (TP.plan ? TP.plan.T.loco.position.clone().add(V(0, 2.2, 0)) : V()); const front = () => (TP.plan ? TP.plan.T.pilot().add(V(0, 0.6, 0)) : V());
const cab = () => (TP.plan ? TP.plan.T.cabSeat().add(V(0, 1.2, 0)) : V()); const wheelW = () => (TP.plan ? TP.plan.T.wheelWorld(0).add(V(0, 0.2, 0)) : V());
const mid = () => (TP.plan ? TP.plan.T.tender.position.clone().add(V(0, 2, 0)) : V()); const head = (c, dy = 0) => () => c.headWorld().add(V(0, dy, 0));
const pt = (x, y, z) => { const f = () => V(x, y, z); f.pure = true; return f; };
const HR = { rel: () => (TP.plan ? TP.plan.T.loco.rotation.y : 0) };   // shot angles relative to the train (180 = left side, 0 = right side, 90 = front, -90 = back)
const povFrom = () => (TP.plan ? TP.plan.T.loco.localToWorld(V(-0.6, 3.9, 0.95)) : V()); const povAt = () => (TP.plan ? TP.plan.T.loco.localToWorld(V(30, 0.5, 0)) : V());
const cutAt = new Set(ZONES.map((z) => +z[0].toFixed(3)));
const BEATS = [
  { t0: 0, t1: T(3), beat: 'establish', at: loco, az: 70, big: 30, mid: 16 },
  { t0: T(3), t1: T(6), shot: 'orbit', at: loco, size: 6.5, az: 60, over: { az: [62, 38], el: [6, 8] } },
  { t0: T(6), t1: T(9), shot: 'lead', at: () => RIDER.headWorld().add(V(-1, -0.4, 0)), heading: 0, size: 3.4 },
  { t0: T(9), t1: T(13), beat: 'realize', at: pt(392, 2.4, 3.2), size: 1.6, az: -70 },
  { t0: T(13), t1: T(16), beat: 'explain', at: pt(408, 0, -4), big: 40, mid: 30 },
  { t0: T(16), t1: T(21), shot: 'craneDown', at: head(TINK, -0.5), big: 5.5, size: 3.6, az: 15 },
  { t0: T(21), t1: T(24), shot: 'dollyIn', at: pt(-400.9, 0.9, -0.5), size: 1.6, az: 20 },
  { t0: T(24), t1: T(26), beat: 'joke', at: () => TINK.headWorld().lerp(V(-400.9, 1.0, -0.5), 0.5), size: 3.4, az: 15 },
  { t0: T(26), t1: T(31), shot: 'orbit', at: loco, size: 7, az: 60, over: { az: [72, 45], el: [5, 9] } },
  { t0: T(31), t1: T(35), shot: 'pov', from: povFrom, at: () => { const p = TRK_CURVE.at(clamp(TP.plan ? TP.plan.s + 28 : 120, 0, 200)); return V(p.x, 0.8, p.z); } },
  { t0: T(35), t1: T(37), shot: 'closeup', at: cab, size: 1.1, az: 200, over: HR },
  { t0: T(37), t1: T(39), shot: 'orbit', at: wheelW, size: 3.4, az: 150, over: { ...HR, az: [150, 200], el: [5, 7] } },
  { t0: T(39), t1: T(40), shot: 'closeup', at: wheelW, size: 2.3, az: 195, over: HR },
  { t0: T(40), t1: T(41), shot: 'dollyOut', at: mid, size: 5, big: 14, az: 210, over: HR },
  { t0: T(41), t1: T(45), beat: 'establish', at: pt(790, 1, 0), az: -120, big: 28, mid: 18 },
  { t0: T(45), t1: T(48), shot: 'orbit', at: front, size: 5.5, az: 215, over: { az: [215, 235], el: [6, 8] } },
  { t0: T(48), t1: T(53), shot: 'static', at: pt(814, 2.1, 0), size: 5.2, az: 96, over: { el: 6 } },
  { t0: T(53), t1: T(57), shot: 'follow', at: loco, heading: 0, size: 8, over: { el: [20, 24] } },
  { t0: T(57), t1: T(59), beat: 'reveal', at: pt(1213, 2.5, 0), size: 5, big: 14, az: -95 },
  { t0: T(59), t1: T(64), shot: 'orbit', at: () => BANKER_RIDE.headWorld().add(V(0, -0.4, 0)), size: 2.4, az: 120, over: { az: [125, 75], el: [5, 8] } },
  { t0: T(64), t1: T(69), shot: 'orbit', at: pt(-396.3, 1.4, 2.7), size: 3.0, az: 25, over: { az: [30, 5], el: [5, 7] } },
  { t0: T(69), t1: T(71), beat: 'react', at: head(TINK, -0.1), size: 1.3 },
  { t0: T(71), t1: T(77), shot: 'dollyIn', at: pt(-395.8, 1.15, -2.6), size: 2.0, az: 20 },
  { t0: T(77), t1: T(82), shot: 'orbit', at: pt(-401.5, 1.2, 1.0), size: 3.2, az: 20 },
  { t0: T(82), t1: T(86), shot: 'dollyOut', at: pt(-401.6, 1.0, 1.1), size: 1.6, big: 3.6, az: 70 },
  { t0: T(86), t1: T(90), shot: 'handheld', at: pt(-17, 1.2, -0.9), size: 4.4, az: 60, over: { az: [58, 84], el: [6, 9] } },
  { t0: T(90), t1: T(95), shot: 'drone', at: loco, big: 26, mid: 16, az: -40 },
  { t0: T(95), t1: T(98), shot: 'orbit', at: pt(435.3, 1.4, 7.3), size: 3.2, az: 60, over: { az: [70, 40], el: [4, 6] } },
  { t0: T(98), t1: T(112), shot: 'droneTop', at: pt(418, 0, -12), big: 62, mid: 56, az: 45 },
  { t0: T(112), t1: T(117), shot: 'static', at: pt(1600, 1.2, 0.1), size: 4.4, az: -90 },
  { t0: T(117), t1: T(126), beat: 'realize', at: pt(1600, 0.9, 0.75), size: 1.6, az: -70 },
  { t0: T(126), t1: T(134), shot: 'orbit', at: pt(1600, 0.9, -0.75), size: 1.7, az: -110 },
  { t0: T(134), t1: T(143), beat: 'reveal', at: pt(1602, 1.0, 10.5), size: 5, big: 11, az: 10 },
  { t0: T(143), t1: T(147), shot: 'track', at: loco, heading: 0, side: 1, size: 7 },
  { t0: T(147), t1: T(150), shot: 'static', at: () => cab().add(V(0, 0.3, 0)), size: 2.2, az: 195, over: HR },
  { t0: T(150), t1: T(152), shot: 'orbit', at: wheelW, size: 2.6, az: 200, over: { ...HR, az: [205, 185], el: [6, 8] } },
  { t0: T(152), t1: T(159), beat: 'ending', at: loco, size: 8, big: 30, az: -60 },
  { t0: T(159), t1: T(166), beat: 'reveal', at: mid, size: 4, big: 20, az: 30 },
  { t0: T(166), t1: T(169), shot: 'whip', at: head(BANKER, -0.2), size: 2.4, az: -40 },
  { t0: T(169), t1: DURATION + 0.1, shot: 'orbit', at: () => BANKER.headWorld().add(V(0, -0.45, 0)), size: 2.6, az: 30, over: { az: [35, 15], el: [14, 10] } },
];
for (const b of BEATS) if (cutAt.has(+b.t0.toFixed(3))) b.cut = true;
window.SHOTLOG = direct(CINE, BEATS);

const LOOK = mkLook({ sun: [-0.5, 0.7, 0.55], lit: '#fff0d6', litK: 1.12, shade: '#9a8ab8', ambSky: '#f6eedc', ambGnd: '#f0d6b0', rim: '#ffe2b0', rimDir: [0.6, 0.3, -0.8], fog: '#f2dcb8', fogR: [60, 260],
  sky: ['#3c86d8', '#7ab8ec', '#f6e2c0', '#e8c89a'], contrast: 1.06, vig: 0.16, vigCol: '#3a2014', glow: 0.45, sat: 1.15, exposure: 1.04, shadow: 0.85, lo: '#f4f0ff', hi: '#fff2dc' });
function guard(c, t) { const p = c.pos, z = zoneAt(t); p[1] = Math.max(p[1], 0.45); if (z === 'town' && p[1] < 6) { p[2] = clamp(p[2], -2.3, 8.8); } return c; }
window.renderFrame = function (f) {
  const t = f / FPS; Flat2D.T = t;
  setup(t, null);
  const cam = guard(CINE.at(t), t); const cp = V(...cam.pos);
  setup(t, cp);
  const z = zoneAt(t); const indoor = z === 'saloon' && t > T(48);
  applyLook(LOOK, { shadowCenter: [cam.look[0], 0, cam.look[2]], shadowSize: 30, pl: indoor ? [{ pos: [819, 4.4, 0], col: [1.0, 0.8, 0.45], range: 9 }] : z === 'bank' ? [{ pos: [1218, 4.5, 0], col: [1.0, 0.9, 0.7], range: 12 }] : z === 'town' && t > T(166) ? [{ pos: [-33, 4.5, 1.5], col: [1.0, 0.9, 0.7], range: 10 }] : [] });
  C.setCam({ pos: cam.pos, look: cam.look, fov: cam.fov, roll: cam.roll, near: 0.05, far: 900 });
  fx(t, cp);   // after setCam: signs auto-fit to THIS frame's lens
  dofU.uFocus.value = cam.focus; dofU.uAper.value = cam.ap * PX * 0.3; dofU.uMaxC.value = 5 * PX;   // light background blur only: keep everything crisp dofU.uTime.value = f * 0.37;
  dofU.uFade.value = Math.max(0, 1 - t / 0.2) + Math.max(0, (t - (DURATION - 0.35)) / 0.35);
  dofU.uFlash.value = (Math.abs(t - HIT_SAL) < 0.08 || Math.abs(t - HIT_BANK) < 0.08) ? 0.25 : 0;
  C.drawFrame(); return 'ok';
};
window.ready = true;
