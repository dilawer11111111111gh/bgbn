// BOATS — why a hollow iron boat floats (buoyancy). Fictional harbor town Puddleport; rivals Burl (solid iron) vs Pip (hollow bowl).
// v9 look: physically based renderer + real CC0 assets (realkit.js) + flat 2D actors with the full acting layer (flat2d.js v3).
import * as THREE from 'three';
import { R, scene, cam, sun, V, pbr, std, mesh, place, loadModels, sky, ready, water, Sign, Burst, makeComposer, setCam, rng, FPS } from '../../web/realkit.js';
import { Cine } from '../../web/cine.js';
import { direct } from '../../web/director.js';
import { Flat2D } from '../../web/flat2d.js';
import { role, act } from '../../web/roles.js';
import { sstep, clamp, lerp } from '../../web/motion.js';
import { WORDS } from './words.js';
import { ENERGY, ONSET } from './energy.js';
export const DURATION = 32.85;
const T = (i) => WORDS[i][1];
const DOCK = 1.2;   // dock deck height (water = 0)
let WATER = null;

// =================== WORLD ===================
function build() {
  WATER = water(700, 700); scene.add(WATER); const SEA = mesh(new THREE.PlaneGeometry(400, 400), pbr('dry_ground_01', [60, 60], { tint: '#c8a878' }), 0, -9, 0, false); SEA.rotation.x = -Math.PI / 2; scene.add(SEA);
  // land behind the dock + cobbled quay
  scene.add(mesh(new THREE.BoxGeometry(260, 4, 90), pbr('dry_ground_01', [50, 18], { tint: '#d8b08a' }), 0, DOCK - 2, -59));
  // wooden dock: deck planks on posts
  const deck = mesh(new THREE.BoxGeometry(90, 0.3, 14.2), pbr('wood_planks_dirt', [18, 3], { tint: '#c49a6a' }), 0, DOCK - 0.15, -7.1); scene.add(deck);
  const postM = pbr('wood_planks_dirt', [0.3, 2], { tint: '#7a5a3a' });
  for (let x = -44; x <= 44; x += 3) for (const z of [-0.1, -7]) { const p = mesh(new THREE.CylinderGeometry(0.22, 0.25, 11, 10), postM, x, DOCK - 5.4, z); scene.add(p); }
  for (let x = -44; x <= 44; x += 3) { const b = mesh(new THREE.CylinderGeometry(0.16, 0.18, 1.0, 10), postM, x + 1.5, DOCK + 0.5, -0.15); scene.add(b); }
  // slipways (wooden ramps into the water) for both boats
  for (const sx of [-4.5, 4.5]) { const r = mesh(new THREE.BoxGeometry(3.4, 0.25, 12), pbr('wood_planks_dirt', [1, 4], { tint: '#b08660' }), sx, -0.2, 4.6); r.rotation.x = 0.2; scene.add(r); }
  // town houses (painted-game colours) on the quay
  const r1 = rng(4); const cols = [0xe86a4a, 0xf2c45a, 0x5aa0d8, 0x7ac06a, 0xf29ac0, 0xe8e0c8, 0xd88a3a];
  for (let i = 0; i < 16; i++) { const x = -60 + i * 8 + r1() * 2, w = 6 + r1() * 2, h = 6 + r1() * 7, z = -20 - r1() * 4; const c = cols[i % cols.length];
    scene.add(mesh(new THREE.BoxGeometry(w, h, 7), std(c, { r: 0.85 }), x, DOCK + h / 2, z)); const roof = mesh(new THREE.CylinderGeometry(0.1, w * 0.72, 3, 4), std(0x8a3a2a, { r: 0.7 }), x, DOCK + h + 1.5, z); roof.rotation.y = Math.PI / 4; roof.scale.z = 1.25; scene.add(roof);
    for (let k = 0; k < 2; k++) for (let j = 0; j < Math.floor(h / 3); j++) scene.add(mesh(new THREE.BoxGeometry(1.1, 1.4, 0.1), std(0x2a3448, { r: 0.2, m: 0.3 }), x - w / 4 + k * w / 2, DOCK + 2.2 + j * 2.8, z + 3.52, false)); }
  // lighthouse on rocks
  scene.add(mesh(new THREE.CylinderGeometry(1.6, 2.4, 16, 20), std(0xf4f0e8, { r: 0.6 }), 46, 8, 42)); for (let k = 0; k < 3; k++) scene.add(mesh(new THREE.CylinderGeometry(1.75 - k * 0.22, 1.95 - k * 0.22, 2.2, 20), std(0xd8342a, { r: 0.6 }), 46, 3 + k * 4.4, 42));
  scene.add(mesh(new THREE.CylinderGeometry(1.4, 1.4, 1.6, 16), std(0xfff2b0, { e: 0xfff2b0, ei: 2 }), 46, 16.8, 42)); scene.add(mesh(new THREE.ConeGeometry(1.9, 1.8, 16), std(0x2a2a30), 46, 18.5, 42));
  for (let i = 0; i < 9; i++) place(i % 2 ? 'boulder_01' : 'rock_moss_set_01', 40 + Math.cos(i) * 6, -0.5, 42 + Math.sin(i) * 6, 2.5 + (i % 3), i);
  // moored small boats + barrels + crates + nets on the dock
  for (const [x, z, c] of [[-22, 2.8, 0xe8e0c8], [-28, 3.0, 0x5aa0d8], [22, 2.8, 0xe86a4a], [28, 3.1, 0xf2c45a], [-34, 2.6, 0x7ac06a]]) { const pts = []; for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI / 2; pts.push(new THREE.Vector2(Math.sin(a) * 1.1, -Math.cos(a) * 0.7)); } const hull = mesh(new THREE.LatheGeometry(pts, 24), std(c, { r: 0.6, side: THREE.DoubleSide }), x, 0.35, z); hull.scale.set(1, 1, 2.4); scene.add(hull); }
  for (const [x, z] of [[-12, -2], [-12.8, -2.6], [13, -2.2], [16, -1.6], [-18, -3], [19, -3]]) place('wooden_crate_01', x, DOCK, z, 1.1, x);
  for (let i = 0; i < 6; i++) { const b = mesh(new THREE.CylinderGeometry(0.45, 0.4, 1.1, 14), pbr('wood_planks_dirt', [1, 1], { tint: '#9a6a3a' }), -20 + i * 7.5 + (i > 2 ? 16 : 0), DOCK + 0.55, -12); scene.add(b); }
  // race banner + flags
  for (const x of [-9, 9]) scene.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 7, 8), postM, x, DOCK + 3.5, -1.2));
  const bc = document.createElement('canvas'); bc.width = 2048; bc.height = 256; const bg = bc.getContext('2d'); bg.fillStyle = '#f4e6c8'; bg.fillRect(0, 0, 2048, 256); bg.fillStyle = '#c8342a'; bg.font = 'bold 150px serif'; bg.textAlign = 'center'; bg.textBaseline = 'middle'; bg.fillText('PUDDLEPORT BOAT RACE', 1024, 132); bg.strokeStyle = '#c8342a'; bg.lineWidth = 16; bg.strokeRect(12, 12, 2024, 232);
  const bt = new THREE.CanvasTexture(bc); bt.colorSpace = THREE.SRGBColorSpace; scene.add(mesh(new THREE.BoxGeometry(18, 2.2, 0.08), new THREE.MeshStandardMaterial({ map: bt, roughness: 0.8 }), 0, DOCK + 6.2, -1.2));
  for (let i = 0; i < 24; i++) { const f = mesh(new THREE.ConeGeometry(0.35, 0.8, 3), std(cols[i % cols.length], { side: THREE.DoubleSide }), -8.6 + i * 0.75, DOCK + 4.95, -1.2, false); f.rotation.z = Math.PI; scene.add(f); }
  // finish line: two buoys + ribbon out at sea
  for (const x of [-1, 9]) { scene.add(mesh(new THREE.SphereGeometry(0.7, 16, 12), std(0xe8402a, { r: 0.4 }), x, 0.2, 26)); scene.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), std(0xffffff), x, 1.4, 26)); }
  // FORGE (Burl) at x=-12, PIP's SHOP at x=+12 (open sheds on the dock)
  const shed = (x, col) => { const g = new THREE.Group(); g.position.set(x, DOCK, -9.5); scene.add(g); const wm = pbr('wood_planks_dirt', [2, 1.5], { tint: col });
    g.add(mesh(new THREE.BoxGeometry(8, 4.6, 0.3), wm, 0, 2.3, -3)); g.add(mesh(new THREE.BoxGeometry(0.3, 4.6, 6), wm, -4, 2.3, 0)); g.add(mesh(new THREE.BoxGeometry(0.3, 4.6, 6), wm, 4, 2.3, 0)); const rf = mesh(new THREE.BoxGeometry(9, 0.3, 7.2), std(0x6a3a2a), 0, 4.9, 0); rf.rotation.x = -0.12; g.add(rf); return g; };
  const forge = shed(-12, '#a8805a'); forge.add(mesh(new THREE.BoxGeometry(1.6, 1.3, 1.3), std(0x4a3a36, { r: 0.9 }), -2.4, 0.65, -1.8)); forge.add(mesh(new THREE.BoxGeometry(1.0, 0.5, 0.1), std(0xff7a20, { e: 0xff6a10, ei: 4 }), -2.4, 0.8, -1.14, false));
  forge.add(mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.75, 10), std(0x5a4030), 0.2, 0.38, -0.5)); forge.add(mesh(new THREE.BoxGeometry(1.0, 0.32, 0.42), std(0x2a2a30, { m: 0.8, r: 0.35 }), 0.2, 0.9, -0.5));
  const fl = new THREE.PointLight(0xff8a30, 18, 9, 1.6); fl.position.set(-14.4, DOCK + 1.4, -10.3); scene.add(fl);
  const shop = shed(12, '#8ab0a0'); shop.add(mesh(new THREE.BoxGeometry(3, 0.15, 1.2), pbr('wood_planks_dirt', [1, 1]), 1.5, 1.0, -2.0)); for (let k = 0; k < 4; k++) shop.add(mesh(new THREE.BoxGeometry(1.6, 0.04, 1.0), std(0x8a8f96, { m: 0.9, r: 0.35 }), -2.5, 0.05 + k * 0.05, -1.5));
}

// =================== BOATS ===================
const ironM = pbr('rusty_metal_02', [2, 1], { tint: '#7a7a82', ns: 1.5 });
const BURLB = new THREE.Group(); scene.add(BURLB);
{ const sh = new THREE.Shape([[-3.6, 0], [2.8, 0], [3.9, 1.5], [3.6, 2.0], [-3.6, 2.0]].map(([x, y]) => new THREE.Vector2(x, y))); const g = new THREE.ExtrudeGeometry(sh, { depth: 2.6, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08 }); g.translate(0, 0, -1.3); g.rotateY(-Math.PI / 2);
  BURLB.add(mesh(g, ironM)); for (let i = 0; i < 12; i++) for (const s of [-1, 1]) BURLB.add(mesh(new THREE.SphereGeometry(0.07, 8, 6), std(0x4a4a50, { m: 0.9, r: 0.3 }), s * 1.37, 1.0 + (i % 2) * 0.6, -3.2 + i * 0.55, false));
  BURLB.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 3, 8), std(0x3a3a3a), 0, 3.5, -2.8)); const fl = mesh(new THREE.ConeGeometry(0.4, 1.1, 3), std(0xd8342a, { side: THREE.DoubleSide }), 0.5, 4.6, -2.8); fl.rotation.z = -Math.PI / 2; BURLB.add(fl); }
const PIPB = new THREE.Group(); scene.add(PIPB); const BOWL = new THREE.Group(); PIPB.add(BOWL);
{ const pts = []; for (let i = 0; i <= 20; i++) { const a = i / 20 * Math.PI / 2; pts.push(new THREE.Vector2(Math.sin(a) * 2.3 + 0.001, -Math.cos(a) * 2.0)); }
  BOWL.add(mesh(new THREE.LatheGeometry(pts, 40), pbr('rusty_metal_02', [3, 1], { tint: '#58b4b4', side: THREE.DoubleSide, ns: 1.2 }))); const rim = mesh(new THREE.TorusGeometry(2.3, 0.1, 10, 48), std(0xe8b83a, { m: 0.8, r: 0.3 })); rim.rotation.x = Math.PI / 2; BOWL.add(rim);
  BOWL.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 8), std(0x8a5a32), 1.5, 1.2, -0.6)); const pf = mesh(new THREE.ConeGeometry(0.4, 1.1, 3), std(0xf2c63a, { side: THREE.DoubleSide }), 2.0, 2.4, -0.6); pf.rotation.z = -Math.PI / 2; BOWL.add(pf); }
// explanation helpers: displaced water dome, arrows
const DOME = mesh(new THREE.SphereGeometry(2.45, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x5ad8ff, emissive: 0x2a8aff, emissiveIntensity: 1.3, transparent: true, opacity: 0.6, depthWrite: false }), 0, 0, 0, false); DOME.renderOrder = 3; scene.add(DOME);
const SMALLW = mesh(new THREE.BoxGeometry(1.0, 0.8, 2.2), new THREE.MeshStandardMaterial({ color: 0x5ad8ff, emissive: 0x2a8aff, emissiveIntensity: 0.6, transparent: true, opacity: 0.5, depthWrite: false }), 0, 0, 0, false); scene.add(SMALLW);
const arrow = (col) => { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 2.4, 12), std(col, { e: col, ei: 0.6 }), 0, 1.2, 0, false)); g.add(mesh(new THREE.ConeGeometry(0.45, 0.8, 16), std(col, { e: col, ei: 0.6 }), 0, 2.7, 0, false)); scene.add(g); return g; };
const UP = arrow(0x3ad0ff), DOWN = arrow(0xe8402a);

// =================== CAST ===================
Flat2D.T = 0;
const BURL_O = { body: 'overalls', coat: '#3a4a6a', shirt: '#c8402a', patch: '#e8b83a', width: 1.15, size: 2.05, hat: 'cap', hatCol: '#3a3030', hair: '#4a2a18', hairStyle: 'tufts', beard: null, mustache: true, rest: 'hip', seed: 3, res: 2.2 };
const PIP_O = { body: 'overalls', coat: '#2a9a9a', shirt: '#f4e2c8', patch: '#e8402a', width: 0.85, size: 1.65, rest: 'behind', hat: 'beret', hatCol: '#d8343a', hair: '#7a4a26', hairStyle: 'pigtails', band: '#f2c63a', seed: 6, res: 2.2 };
const BURL = new Flat2D({ ...BURL_O, scene }), PIP = new Flat2D({ ...PIP_O, scene });
const CROWD = [['fisherman', 0], ['sailor', 1], ['captain', 0], ['grandma', 1], ['kid', 4], ['girl', 2], ['worker', 3], ['shopkeeper', 2], ['lady', 4], ['gentleman', 1], ['tourist', 2], ['musician', 0]].map(([id, k]) => new Flat2D({ ...role(id, k), scene, res: 1.6 }));
const STARTER = new Flat2D({ ...role('sheriff', 3), scene, res: 1.8 });
const ALL = [BURL, PIP, STARTER, ...CROWD];
const hide = (c) => { c.mesh.visible = false; if (c.shadow) c.shadow.visible = false; };

// =================== FX ===================
const S = { sec: new Sign('2 SECONDS', { bg: '#e8402a', fg: '#fff', h: 0.7 }), uns: new Sign('"UNSINKABLE!"', { bg: '#fff', h: 0.55 }), same: new Sign('SAME IRON', { bg: '#f6d84a', h: 0.5 }), bowl: new Sign('SOUP BOWL?!', { bg: '#fff', h: 0.6 }),
  ha: new Sign('HA HA HA!', { bg: '#fff', h: 1.0, panel: false }), race: new Sign('RACE DAY!', { bg: '#f6d84a', h: 1.0 }), blub: new Sign('BLUB.', { bg: '#7ad0ff', h: 1.0, panel: false }), won: new Sign('WINNER!', { bg: '#f6d84a', h: 0.9 }),
  push: new Sign('WATER PUSHES UP', { bg: '#3ad0ff', h: 0.5 }), weight: new Sign('WEIGHT', { bg: '#e8402a', fg: '#fff', h: 0.5 }), big: new Sign('LOTS OF WATER PUSHED', { bg: '#3ad0ff', h: 0.42 }), small: new Sign('A LITTLE WATER', { bg: '#ffb0a0', h: 0.42 }),
  same2: new Sign('SAME IRON!', { bg: '#f6d84a', h: 0.6 }), buoy: new Sign('BUOYANCY!', { bg: '#7ad85a', h: 1.1 }) };
const B = { sparks: new Burst({ n: 30, dur: 1, life: 0.35, speed: [2, 5], dir: [0, 1, 0.4], spread: 0.9, g: -10, size: [0.05, 0.12], tex: 'spark', add: true, seed: 1 }),
  sparks2: new Burst({ n: 30, dur: 1, life: 0.35, speed: [2, 5], dir: [0, 1, 0.4], spread: 0.9, g: -10, size: [0.05, 0.12], tex: 'spark', add: true, seed: 2 }),
  splash: new Burst({ n: 34, dur: 0.25, life: 1.1, speed: [3, 8], dir: [0, 1, 0.1], spread: 0.6, g: -12, size: [0.3, 0.8], grow: 0.8, tex: 'splash', opacity: 0.75, seed: 3 }),
  splash2: new Burst({ n: 28, dur: 0.25, life: 1.0, speed: [2, 6], dir: [0, 1, 0.1], spread: 0.6, g: -12, size: [0.25, 0.7], grow: 0.8, tex: 'splash', opacity: 0.75, seed: 4 }),
  bubbles: new Burst({ n: 60, dur: 2, life: 1.6, speed: [0.5, 1.6], dir: [0, 1, 0], spread: 0.5, g: 1.5, size: [0.12, 0.35], tex: 'bubble', seed: 5 }),
  bubbles2: new Burst({ n: 40, dur: 2, life: 2.0, speed: [0.3, 1.0], dir: [0, 1, 0], spread: 0.4, g: 1.2, size: [0.1, 0.28], tex: 'bubble', seed: 6 }),
  confetti: new Burst({ n: 90, dur: 0.6, life: 2.4, speed: [4, 8], dir: [0, 1, 0], spread: 0.8, g: -4, size: [0.12, 0.2], tex: 'confetti', seed: 7 }),
  smoke: new Burst({ n: 20, dur: 1, life: 2.0, speed: [0.5, 1.2], dir: [0.2, 1, 0], spread: 0.3, g: 0.3, size: [0.8, 1.4], grow: 2, tex: 'smoke', opacity: 0.7, seed: 8 }),
  stars: new Burst({ n: 30, dur: 1, life: 0.9, speed: [0.5, 1.5], dir: [0, 1, 0], spread: 1, g: 0, size: [0.2, 0.4], tex: 'star', add: true, seed: 9 }) };
// fish for the underwater ending
const FISH = []; const fishTex = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#f28a2a'; g.strokeStyle = '#2a1810'; g.lineWidth = 4; g.beginPath(); g.ellipse(56, 32, 40, 20, 0, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(94, 32); g.lineTo(122, 12); g.lineTo(122, 52); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(34, 26, 7, 0, 7); g.fill(); g.fillStyle = '#000'; g.beginPath(); g.arc(32, 26, 3.5, 0, 7); g.fill(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
for (let i = 0; i < 9; i++) { const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: fishTex, transparent: true })); f.scale.set(0.9, 0.45, 1); scene.add(f); FISH.push(f); }
const WEED = []; for (let i = 0; i < 30; i++) { const w = mesh(new THREE.ConeGeometry(0.18, 1.6 + (i % 4) * 0.5, 6), std(0x3a8a4a, { r: 0.8 }), -12 + (i * 2.3) % 24, -8.2, 1 + (i * 3.7) % 14, false); scene.add(w); WEED.push(w); }

// =================== TIMELINE ===================
// Burl's boat: on the slipway; launch at T(50); sinks from T(52). Hook 1.56..3.56 replays the sink (flash-forward).
const SLIP = (u) => V(-4.5, lerp(DOCK + 0.05, -0.3, u), lerp(-3.2, 7.5, u));
function burlBoat(t) {
  const hook = t > T(5) && t < T(9); const tl = hook ? T(52) - 0.4 + (t - T(5)) * 1.1 : t;
  let p = V(-4.5, DOCK + 0.05, -3.2), pitch = 0;
  if (tl > T(50)) { const u = sstep(T(50), T(52) - 0.1, tl); p = SLIP(u); pitch = 0.2 * u; }
  if (tl > T(52)) { const s = clamp((tl - T(52)) / 1.6, 0, 1); p.y = lerp(-0.3, -7.2, s * s * (3 - 2 * s)); p.z += s * 2; pitch = 0.2 + 0.35 * Math.sin(s * Math.PI); }
  return { p, pitch, sinking: tl > T(52) - 0.1, sunk: tl > T(52) + 1.6, hook };
}
function pipBoat(t) {
  let p = V(4.5, DOCK + 2.05, -3.2), bob = 0; const form = sstep(T(33), T(36) + 0.2, t);   // bowl is hammered into shape
  if (t < T(47)) { p = V(10.6, DOCK + 2.0 * Math.max(0.06, form), -9.0); return { p, form, bob }; }
  if (t > T(57)) { const u = sstep(T(57), T(59) + 0.2, t); p = V(4.5, lerp(DOCK + 2.05, 1.0, u), lerp(-3.2, 7.0, u)); bob = u * 0.12 * Math.sin(t * 3); }
  if (t > T(60)) { const u = sstep(T(60), T(62) + 0.3, t); p.z = lerp(7.0, 24.5, u); p.x = lerp(4.5, 4.0, u); }
  if (t > T(63)) { const u = sstep(T(63), T(65), t); p.set(lerp(4.0, 2.5, u), 1.0, lerp(24.5, 9.0, u)); }
  return { p, form: 1, bob };
}
const ZONE = (t) => (t < T(9) ? 'dock' : t < T(24) ? 'forge' : t < T(47) ? 'shop' : t < T(63) ? 'race' : t < T(88) ? 'explain' : 'under');

function setup(t, camPos) {
  Flat2D.T = t; const fi = Math.min(ENERGY.length - 1, Math.round(t * FPS)); Flat2D.E = ENERGY[fi]; Flat2D.ON = ONSET[fi]; const z = ZONE(t); for (const c of ALL) hide(c);
  // ----- boats -----
  const bb = burlBoat(t); BURLB.position.copy(bb.p); BURLB.rotation.set(bb.pitch, 0, 0);
  const pb = pipBoat(t); PIPB.position.copy(pb.p); PIPB.position.y += pb.bob; PIPB.rotation.z = pb.bob * 0.3; BOWL.scale.set(1, Math.max(0.06, pb.form), 1);
  const onBoat = (B0, dx, dy, dz) => B0.localToWorld(V(dx, dy, dz));
  BURLB.updateMatrixWorld(true); PIPB.updateMatrixWorld(true);
  // ----- Burl -----
  let bp, bpose = {};
  if (z === 'dock' && !bb.hook) { bp = onBoat(BURLB, 0, 2.0, -0.6); bpose = { ...act(t, [[0, 'proud']]), face: 'smug' }; }
  else if (bb.hook) { bp = onBoat(BURLB, 0, 2.0, -0.6); bpose = { ...act(t, [[0, 'flail']]), face: t > T(7) ? 'panic' : 'shock', tears: t > T(7) ? 1 : 0, lines: 0 }; }
  else if (z === 'forge') { if (t < T(16)) { bp = V(-11.8, DOCK, -9.6); bpose = { ...act(t, [[T(9), 'hammer']]), face: 'angry', tint: ['#e2403a', 0.25], flip: true }; }
    else if (t < T(21)) { const u = sstep(T(16), T(20), t); bp = V(-6.4, DOCK, lerp(-5.6, -1.2, u)); bpose = { ...act(t, [[T(16), 'hammer'], [T(18), 'walk']]), face: 'smug', flip: false }; }
    else { bp = V(-6.6, DOCK, -1.6); bpose = { ...act(t, [[T(21), 'proud'], [T(22), 'thumbsUp']]), face: t < T(22) ? 'proud' : 'smug', talk: t > T(21) && t < T(22), mark: null }; } }
  else if (z === 'shop') { if (t > T(41)) { bp = V(-10.4, DOCK, -1.7); bpose = { ...act(t, [[0, 'laughPoint']]), face: 'laugh', tears: 0.6, flip: true }; } }
  else if (z === 'race') { if (t < T(52)) { bp = onBoat(BURLB, 0, 2.0, -0.6); bpose = { ...act(t, [[T(47), 'proud'], [T(50), 'cheer']]), face: t < T(50) ? 'smug' : 'laugh' }; }
    else if (!bb.sunk) { bp = onBoat(BURLB, 0, 2.0, -0.6); bpose = { ...act(t, [[T(52), 'shock'], [T(53), 'flail']]), face: t < T(53) ? 'shock' : 'panic', tears: t > T(53) ? 1 : 0 }; } }
  else if (z === 'explain') { if (t > T(77) && t < T(86)) { bp = onBoat(BURLB, 0, 2.0, -0.6); bpose = { ...act(t, [[0, 'crossArms']]), face: 'angry', steam: 0.8, tint: ['#8a4ad0', 0.4] }; } }
  else if (z === 'under') { bp = onBoat(BURLB, 0, 2.0, -0.6); bpose = { ...act(t, [[T(88), 'facepalm'], [T(90), 'row']]), face: t < T(90) ? 'worried' : 'proud', flip: false }; }
  if (bp) { BURL.place(bp.x, bp.y, bp.z); BURL.update({ e: 1, ...bpose }, camPos); }
  // ----- Pip -----
  let pp, ppose = {};
  if (z === 'shop') { if (t < T(31)) { pp = V(14.0, DOCK, -7.6); ppose = { ...act(t, [[T(24), 'wave'], [T(27), 'presenter']]), face: t < T(27) ? 'grin' : 'proud', flip: true }; }
    else if (t < T(36)) { pp = V(13.3, DOCK, -8.4); ppose = { ...act(t, [[T(31), 'kneel']]), prop: 'hammer', armR: [150 - 120 * Math.abs(Math.sin(t * 9)), 20], face: 'angry', flip: false }; }
    else if (t < T(41)) { pp = V(13.9, DOCK, -7.8); ppose = { ...act(t, [[T(36), 'thumbsUp']]), face: 'proud', blush: 0.6, flip: false }; }
    else { pp = V(13.9, DOCK, -7.8); ppose = { ...act(t, [[T(41), 'crossArms']]), face: 'angry', steam: 0.8, tint: ['#e2403a', 0.35] }; } }
  else if (z === 'race') { pp = onBoat(PIPB, 0, -0.9, 0.4); ppose = t < T(57) ? { ...act(t, [[0, 'crossArms']]), face: 'smug' } : t < T(61) ? { ...act(t, [[T(57), 'row']]), face: 'grin', lines: t > T(60) ? 1 : 0 } : { ...act(t, [[T(61), 'cheer']]), prop: 'trophy', face: 'laugh' }; }
  else if (z === 'explain') { pp = onBoat(PIPB, 0, -0.9, 0.4); ppose = { ...act(t, [[T(63), 'presenter'], [T(77), 'point'], [T(86), 'thumbsUp']]), face: t > T(86) ? 'laugh' : 'proud' }; }
  if (pp) { PIP.place(pp.x, pp.y, pp.z); PIP.update({ e: 1, ...ppose }, camPos); }
  // ----- crowd on the dock edge -----
  const crowdOn = z === 'dock' || (z === 'shop' && t > T(41)) || (z === 'race' && t < T(63));
  if (crowdOn) CROWD.forEach((c, i) => { const x = i < 6 ? -15.5 + i * 1.35 : 8.8 + (i - 6) * 1.6, zz = -0.9 - (i % 2) * 1.1; c.place(x, DOCK, zz);
    const laugh = z === 'shop', sink = z === 'race' && t > T(52) && t < T(57), win = z === 'race' && t > T(61), hook = z === 'dock';
    const pose = laugh ? (i % 3 ? 'laughPoint' : 'laugh') : sink ? (i % 2 ? 'shock' : 'flail') : win ? 'cheer' : hook ? (i % 2 ? 'shock' : 'flail') : i % 2 ? 'cheer' : 'wave';
    c.update({ ...act(t + i * 0.11, [[0, pose]]), face: laugh ? 'laugh' : sink || hook ? (i % 2 ? 'shock' : 'awe') : win ? 'laugh' : 'grin', flip: i >= 6 }, camPos); });
  if (z === 'race' && t < T(53)) { STARTER.place(0, DOCK, -1.8); STARTER.update({ ...act(t, [[T(47), 'pointUp'], [T(50), 'cheer']]), prop: t < T(50) ? 'megaphone' : 'flag', face: 'grin', talk: t > T(47) && t < T(49) }, camPos); }
  // ----- explanation visuals -----
  const ex = z === 'explain'; DOME.visible = ex && t > T(70); DOME.position.copy(PIPB.position); DOME.position.y = 0.02; DOME.scale.setScalar(0.98 + 0.03 * Math.sin(t * 4));
  SMALLW.visible = ex && t > T(77) && t < T(86); SMALLW.position.set(BURLB.position.x, -6.2, BURLB.position.z);
  UP.visible = ex && t > T(70); UP.position.set(PIPB.position.x - 3.2, -2.6 + 0.2 * Math.sin(t * 6), PIPB.position.z); DOWN.visible = ex && t > T(73); DOWN.position.set(PIPB.position.x + 3.2, 3.4, PIPB.position.z); DOWN.rotation.z = Math.PI;
  // ----- fish + weed (underwater) -----
  FISH.forEach((f, i) => { const a = t * (0.5 + (i % 3) * 0.2) + i; f.position.set(-6 + Math.cos(a) * (3 + i % 4), -6.5 + (i % 3) * 0.9 + Math.sin(a * 2) * 0.3, 8 + Math.sin(a) * 3); f.material.rotation = 0; f.visible = z === 'under' || (z === 'race' && t > T(53)); });
  WEED.forEach((w, i) => { w.rotation.z = 0.15 * Math.sin(t * 1.5 + i); });
  return { bb, pb };
}
function fx(t, st) {
  const z = ZONE(t);
  B.sparks.update(t, T(9), V(-11.5, DOCK + 1.0, -9.4), 0.5, z === 'forge' && t < T(16)); B.sparks2.update(t, T(31), V(12.7, DOCK + 0.5, -8.8), 0.5, z === 'shop' && t > T(31) && t < T(36));
  B.splash.update(t, st.bb.hook ? T(5) + 0.35 : T(52) - 0.15, () => V(-4.5, 0.2, 8.2), 0, (st.bb.hook || z === 'race') && t < (st.bb.hook ? T(9) : T(57)));
  B.splash2.update(t, T(59), () => V(4.5, 0.2, 7.0), 0, z === 'race' && t > T(58));
  B.bubbles.update(t, st.bb.hook ? T(5) + 0.5 : T(52), () => BURLB.position.clone().add(V(0, 2.4, 0)), 1.6, st.bb.sinking && (st.bb.hook || z === 'race' || z === 'under'));
  B.bubbles2.update(t, T(88), () => BURL.headWorld().add(V(-0.2, 0.3, 0)), 2.0, z === 'under');
  B.confetti.update(t, T(61), V(4.5, 4.5, 20), 0, z === 'race' && t > T(61)); B.stars.update(t, T(61), () => PIP.headWorld(), 1.0, z === 'race' && t > T(61));
  B.smoke.update(t, 0, V(-14.4, DOCK + 5.6, -12.4), 2.0, z === 'forge' || z === 'dock');
  S.sec.update(t, T(7), T(9) - 0.05, () => BURLB.position.clone().add(V(0, 4.2, 0))); S.uns.update(t, T(21), T(24) - 0.05, () => BURL.headWorld().add(V(0.6, 1.0, 0)));
  S.same.update(t, T(28), T(31), V(12.5, DOCK + 1.6, -8.4)); S.bowl.update(t, T(38), T(41), () => PIPB.position.clone().add(V(0, 3.0, 0))); S.ha.update(t, T(42), T(47) - 0.05, V(-1, DOCK + 3.6, -1.5));
  S.race.update(t, T(47), T(49), V(0, DOCK + 4.0, -1.0)); S.blub.update(t, T(52), T(53) + 0.4, () => BURL.headWorld().add(V(0, 1.25, 0))); S.won.update(t, T(61) + 0.1, T(63), () => PIPB.position.clone().add(V(0, 4.0, 0)));
  S.push.update(t, T(70), T(77), () => PIPB.position.clone().add(V(-3.2, 0.9, 0))); S.weight.update(t, T(73), T(77), () => PIPB.position.clone().add(V(3.2, 6.8, 0)));
  S.big.update(t, T(77), T(82), () => PIPB.position.clone().add(V(0, -2.8, 2.6))); S.small.update(t, T(79), T(82), () => V(BURLB.position.x, -4.6, BURLB.position.z + 2));
  S.same2.update(t, T(82), T(86), () => V(0, 3.2, 8.5)); S.buoy.update(t, T(86), T(88), () => PIPB.position.clone().add(V(0, 4.2, 0)));
}

// =================== CAMERA (director) ===================
const CINE = new Cine({ blend: 0.6 }); const pt = (x, y, z) => { const f = () => V(x, y, z); f.pure = true; return f; };
const burlH = () => BURL.headWorld().add(V(0, -0.35, 0)), pipH = () => PIP.headWorld().add(V(0, -0.3, 0)), bboat = () => BURLB.position.clone().add(V(0, 1.6, 0)), pboat = () => PIPB.position.clone().add(V(0, 0.6, 0));
const CALM = { kick: 2, swing: 1, shake: 0.15 };   // readable pacing: gentle transitions, no camera jerks
const BEATS = [
  { t0: 0, t1: T(5), beat: 'establish', at: pt(0, 2, 0), az: 20, big: 30, mid: 20, over: CALM },
  { t0: T(5), t1: T(9), cut: true, shot: 'orbit', at: () => V(-4.5, 1.0, 9.0), size: 7, az: 55, over: { ...CALM, az: [60, 45], el: [8, 9] } },
  { t0: T(9), t1: T(16), cut: true, shot: 'craneDown', at: burlH, big: 6, size: 2.8, az: 25, over: CALM },
  { t0: T(16), t1: T(21), shot: 'orbit', at: () => V(-5.6, DOCK + 1.6, -2.4), size: 5.2, az: -35, over: { ...CALM, az: [-40, -25], el: [6, 7] } },
  { t0: T(21), t1: T(24), shot: 'low', at: burlH, size: 2.8, az: -20, over: { ...CALM, az: [-22, -12] } },
  { t0: T(24), t1: T(31), cut: true, shot: 'orbit', at: pipH, size: 2.8, az: -25, over: { ...CALM, az: [-28, -10], el: [5, 6] } },
  { t0: T(31), t1: T(41), shot: 'orbit', at: () => V(12.1, DOCK + 1.1, -8.6), size: 6.0, az: 25, over: { ...CALM, az: [28, 12], el: [10, 9] } },
  { t0: T(41), t1: T(47), shot: 'orbit', at: pt(-11.5, DOCK + 1.3, -1.5), size: 6.8, az: 22, over: { ...CALM, az: [24, 12], el: [6, 6] } },
  { t0: T(47), t1: T(52), cut: true, shot: 'drone', at: pt(-1, 1.5, 3), big: 22, mid: 16, az: 15, over: CALM },
  { t0: T(52), t1: T(57), shot: 'orbit', at: () => V(-4.5, 1.6, 9.0), size: 6.5, az: 70, over: { ...CALM, az: [72, 60], el: [8, 7] } },
  { t0: T(57), t1: T(63), shot: 'orbit', at: pboat, size: 5.5, az: 60, over: { ...CALM, az: [65, 85], el: [8, 6] } },
  { t0: T(63), t1: T(77), cut: true, shot: 'static', at: () => V(0.5, -1.2, 9), size: 13, az: 90, over: { ...CALM, el: [2, 3] } },
  { t0: T(77), t1: T(88), shot: 'orbit', at: () => V(0.5, -1.4, 8.5), size: 12, az: 85, over: { ...CALM, az: [86, 96], el: [2, 3] } },
  { t0: T(88), t1: DURATION + 0.1, cut: true, shot: 'orbit', at: burlH, size: 3.4, az: 120, over: { ...CALM, az: [122, 108], el: [6, 9] } },
];
direct(CINE, BEATS);
const composer = makeComposer({ sat: 1.4, con: 1.07, bloom: 0.25 });
const SEA_COL = new THREE.Color(0x1a7a90);
const fogAir = new THREE.FogExp2(0xcfe0ee, 0.0035), fogSea = new THREE.FogExp2(0x1a7a90, 0.085);
window.renderFrame = function (f) {
  const t = f / FPS;
  const c0 = CINE.at(t); const cp = V(...c0.pos); const st = setup(t, cp);
  const c = CINE.at(t); if (ZONE(t) !== 'under' && c.pos[1] < 0.35 && !(t > T(53) && t < T(57))) c.pos[1] = 0.35; setCam(c); setup(t, cam.position.clone());
  const under = cam.position.y < 0; scene.fog = under ? fogSea : fogAir; WATER.material.opacity = ZONE(t) === 'explain' ? 0.42 : 0.86; if (!window.__bg) window.__bg = scene.background; scene.background = under ? SEA_COL : window.__bg; scene.backgroundIntensity = 1.0;
  scene.traverse((o) => o.userData.tick && o.userData.tick(t));
  fx(t, st);
  composer.grade.uniforms.uFade.value = Math.max(0, 1 - t / 0.2) + Math.max(0, (t - (DURATION - 0.3)) / 0.3);
  composer.grade.uniforms.uFlash.value = 0;
  composer.render(); return 'ok';
};
(async () => {
  await sky('kloofendal_48d_partly_cloudy_puresky', { env: 0.8 });
  await loadModels(['boulder_01', 'rock_moss_set_01', 'wooden_crate_01']);
  build(); await ready(); window.ready = true;
})();
