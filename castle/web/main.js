// CASTLE (Studio v9.1, 45 s): "The Castle Saved by Wet Laundry" — English medieval castle (honey stone), Baron Grimwald's
// army with fire arrows, King Edgar panics, Barnaby the laundry man hangs wet sheets, the arrows fizzle, the science
// (water absorbs heat → steam; a wet cloth can't pass 100 °C), Barnaby is knighted. Cut on the narration words; every
// character acts with perform() (new face/neck/arms every ~0.26 s); a new visual every 0.4–0.9 s.
import * as THREE from 'three';
import { scene, cam, sun, hemi, V, sky, ready, makeComposer, mesh, Burst } from '../../web/realkit.js';
import { Cine } from '../../web/cine.js';
import { Flat2D } from '../../web/flat2d.js';
import { loadMo, mo } from '../../web/mocap.js';
import { clamp, lerp } from '../../web/motion.js';
import { installActing, makeSky, dynamicCam, makeRenderer } from '../../web/studio.js';
import { makeAtlas, Crowd, grid, blob, mulberry } from '../../web/crowd.js';
import { greenField } from '../../web/eras.js';
import { leafyTrees } from '../../web/nature.js';
import { englishCastle, Fire, FireVolley, laundry, thermometer } from '../../web/castle.js';
import { perform } from '../../web/actor.js';
export const DURATION = 45.3;
installActing();
const r0 = mulberry(21), pick = (a) => a[Math.floor(r0() * a.length)];
// ---------------- cast ----------------
const C = { size: 1.95, res: 2.2, wide: true, headroom: 420, scene };
const GRIM = new Flat2D({ ...C, body: 'armor', coat: '#5a0a14', steel: '#3a3a46', emblem: '#c8281a', hairStyle: 'swept', hair: '#141018', mustache: true, beard: '#141018', seed: 3, size: 2.05 });
const KING = new Flat2D({ ...C, body: 'royal', coat: '#1a4a9a', cape: '#9a1a2a', sash: '#f2c63a', hat: 'crown', hatCol: '#f2c63a', beard: '#c8883a', mustache: true, hair: '#c8883a', seed: 5 });
const BARN = new Flat2D({ ...C, body: 'vest', coat: '#3a8ad8', width: 1.35, hairStyle: 'curly', hair: '#c8582a', mustache: true, seed: 8 });
const SOL = new Flat2D({ ...C, body: 'armor', coat: '#2a4a9a', steel: '#c8ced6', emblem: '#bfe8ff', hat: 'helm', hatCol: '#a8aeb6', band: '#d8283a', mustache: true, seed: 11, size: 1.9 });
const ARCH = new Flat2D({ ...C, body: 'armor', coat: '#5a0a14', steel: '#4a4a52', hat: 'helm', hatCol: '#3a3a40', band: '#c8281a', seed: 14, size: 1.9 });
const CAST = [GRIM, KING, BARN, SOL, ARCH];
// positions
const GR_P = V(0, 0, 24), KING_TOP = V(1.1, 14.0, 2.1), KING_GND = V(1.3, 0, 6.0), SOL_P = V(3.4, 0, 6.4), ARCH_P = V(3.4, 0, 32.4);
const BARN_P = (t) => t < 16.6 ? V(lerp(-12, -2.4, clamp((t - 14.7) / 1.9, 0, 1)), 0, 6.3) : t < 38.8 ? V(-2.4, 0, 6.3) : V(0.15, 0, 6.6);
// ---------------- world ----------------
let CASTLE, ARMY, ARCHERS, DEF, BUCK, VOL1, VOL2, FIRE, SHEETS, STEAM, STEAM2, SPLASH, THERMO, SCI = {}, STUCK = [], CAP, capCtx, capTex;
function stuckArrows(n, seed, y0, y1, w, z, flames) { const r = mulberry(seed); const g1 = new THREE.CylinderGeometry(0.02, 0.02, 0.9, 5); g1.rotateX(Math.PI / 2); g1.translate(0, 0, 0.4);
  const im = new THREE.InstancedMesh(g1, new THREE.MeshStandardMaterial({ color: 0x3a2814 }), n); const m = new THREE.Matrix4(), pts = []; for (let i = 0; i < n; i++) { const x = (r() - 0.5) * w, y = y0 + r() * (y1 - y0); m.compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5 - r() * 0.3, (r() - 0.5) * 0.4, 0)), V(1, 1, 1)); im.setMatrixAt(i, m); pts.push(x, y + 0.35, z + 0.75); }
  scene.add(im); const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); const pm = new THREE.PointsMaterial({ size: 0.7, map: flames, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }); const P = new THREE.Points(pg, pm); scene.add(P); return { im, P, pm }; }
function build() {
  greenField({ tentZ: 80, flatW: 150, flatZ: 160 });
  CASTLE = englishCastle({ width: 40 });
  leafyTrees([[-48, 14, 1.2, 'oak', 1], [-55, 30, 1.1, 'maple', 2], [52, 18, 1.2, 'oak', 3], [60, 34, 1.0, 'autumn', 4], [-30, 60, 1.3, 'oak', 5], [34, 64, 1.2, 'maple', 6], [-62, -10, 1.2, 'oak', 7], [64, -8, 1.1, 'blossom', 8], [20, 90, 1.3, 'oak', 9], [-22, 95, 1.2, 'autumn', 10]]);
  // crowds
  const enemyV = Array.from({ length: 12 }, () => ({ body: 'armor', coat: pick(['#5a0a14', '#6a1414', '#4a0a10']), steel: pick(['#3a3a46', '#4a4a52']), emblem: '#c8281a', hat: 'helm', hatCol: pick(['#3a3a40', '#2a2a30']), band: '#c8281a', mustache: r0() < 0.4, beard: r0() < 0.3 ? '#1a1410' : null, prop: pick(['spear', 'sword', 'shield']) }));
  const enemyF = [{ armL: [16, -32], armR: [20, 10] }, { armL: [150, 20], armR: [160, 10], face: { eyes: 'stare', mouth: 'scream', brow: -1.1 } }, { armL: [60, -110], armR: [60, -110], face: { eyes: 'lid', lidL: 0.1, lidR: 0.45, mouth: 'flat', browL: 1, browR: -0.5 } }];
  ARMY = new Crowd(makeAtlas(enemyV, enemyF), grid(0, 46, 40, 22, 1.25, 1.35, 0.3, 4), { seed: 4, flip: true, fog: 0xc8d8e8, fogNear: 40, fogFar: 170 });
  const archV = Array.from({ length: 8 }, () => ({ body: 'armor', coat: pick(['#5a0a14', '#6a1414']), steel: '#4a4a52', hat: 'helm', hatCol: '#3a3a40', band: '#c8281a', prop: 'bow' }));
  const archF = [{ armL: [16, -32], armR: [30, -10], prop: 'bow', propHand: 'L' }, { armL: [92, -4], armR: [92, -100], prop: 'bow', propHand: 'L', face: { eyes: 'lid', lid: 0.3, squint: 0.2, mouth: 'line', brow: -0.8 } }, { armL: [60, -110], armR: [60, -110], face: { eyes: 'wide', mouth: 'smallO', brow: 1.0 } }];
  ARCHERS = new Crowd(makeAtlas(archV, archF), grid(0, 35.2, 34, 4, 1.15, 1.1, 0.25, 6), { seed: 7, flip: true });
  const defV = Array.from({ length: 10 }, () => ({ body: 'armor', coat: pick(['#2a4a9a', '#2a5ad8', '#24407a']), steel: '#c8ced6', emblem: '#bfe8ff', hat: 'helm', hatCol: '#a8aeb6', band: '#d8283a', mustache: r0() < 0.4, prop: pick(['spear', null]) }));
  const defF = [{ armL: [16, -32], armR: [20, 10] }, { armL: [130, -150], armR: [130, -150], face: { eyes: 'tiny', mouth: 'scream', brow: 1.4 } }, { armL: [155, 20], armR: [155, 20], face: { eyes: 'happy', mouth: 'laugh' }, hop: 10 }];
  const defAtl = makeAtlas(defV, defF); const wall = []; for (const sd of [-1, 1]) for (let k = 0; k < 26; k++) wall.push({ x: sd * (10.5 + k * 1.1), z: 0.9 + (k % 2) * 0.5 });
  DEF = new Crowd(defAtl, wall, { seed: 9 }); DEF.mesh.position.y = 12.5;
  const buckV = defV.map((v) => ({ ...v, prop: 'bucket' })); BUCK = new Crowd(makeAtlas(buckV, [{ armL: [16, -32], armR: [70, -60], prop: 'bucket', propHand: 'R', propFront: true }, { armL: [16, -32], armR: [120, -10], prop: 'bucket', propHand: 'R', propFront: true, face: { eyes: 'lid', lid: 0.45, lidTilt: 0.5, mouth: 'frown', brow: 1 } }, { armL: [16, -32], armR: [120, -10], prop: 'bucket', propHand: 'R', propFront: true, face: { eyes: 'lid', lid: 0.45, mouth: 'frown', brow: 1 } }]), grid(7.6, 6.6, 6, 2, 1.0, 0.9, 0.2, 12), { seed: 12 });
  // fire, arrows, laundry, steam, science props
  VOL1 = new FireVolley(700, 5); VOL2 = new FireVolley(500, 9); FIRE = new Fire(90, 3);
  const flameTex = VOL1.pts.material.map; STUCK = [stuckArrows(40, 3, 1.0, 6.8, 4.6, 1.5, flameTex), stuckArrows(36, 5, 1.6, 6.8, 5.6, 1.9, flameTex)];
  SHEETS = laundry({ x: 0, y: 7.6, z: 1.75, n: 5, w: 1.25, h: 6.9 });
  STEAM = new Burst({ n: 70, dur: 0.6, life: 2.4, speed: [2.0, 5.0], dir: [0, 1, 0.25], spread: 0.6, g: 1.2, size: [0.9, 2.2], grow: 1.6, tex: 'smoke', opacity: 0.6, seed: 41 });
  STEAM2 = new Burst({ n: 40, dur: 0.4, life: 1.6, speed: [1.5, 3.5], dir: [0, 1, 0.1], spread: 0.5, g: 0.8, size: [0.6, 1.6], grow: 1.4, tex: 'smoke', opacity: 0.5, seed: 43 });
  SPLASH = new Burst({ n: 24, dur: 0.25, life: 0.5, speed: [1.0, 2.6], dir: [0, -0.5, 1], spread: 0.6, g: -9, size: [0.04, 0.1], tex: 'splash', seed: 45 });
  // science stage (right of the gate): a magnified wet cloth with water drops over a flame + a giant thermometer
  const cloth = mesh(new THREE.PlaneGeometry(3.2, 2.4), new THREE.MeshPhysicalMaterial({ color: 0x3a7ad8, roughness: 0.6, side: THREE.DoubleSide, clearcoat: 0.3 }), 14, 3.2, 6.2); scene.add(cloth);
  const dropM = new THREE.MeshPhysicalMaterial({ color: 0x9ad8ff, roughness: 0.02, transmission: 0.5, transparent: true, opacity: 0.85, clearcoat: 1, emissive: 0x000000 }); SCI.drops = []; const rr = mulberry(77);
  for (let i = 0; i < 26; i++) { const d = mesh(new THREE.SphereGeometry(0.11 + rr() * 0.06, 16, 12), dropM, 14 + (rr() - 0.5) * 2.8, 3.2 + (rr() - 0.5) * 2.0, 6.32, false); d.scale.z = 0.55; scene.add(d); SCI.drops.push(d); } SCI.dropM = dropM;
  SCI.fire = new Fire(26, 61); SCI.fire.f.ps.forEach((p) => { p.sz *= 0.45; }); SCI.fire.s.ps.forEach((p) => { p.m.material.opacity = 0; p.sz = 0; }); SCI.steam = new Burst({ n: 40, dur: 0.8, life: 1.6, speed: [0.6, 1.6], dir: [0, 1, 0.3], spread: 0.5, g: 0.5, size: [0.3, 0.8], grow: 1.6, tex: 'smoke', opacity: 0.45, seed: 63 });
  THERMO = thermometer(17.6, 0, 6.4, 0.85);
  // caption plane on the camera
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256; capCtx = c.getContext('2d'); capTex = new THREE.CanvasTexture(c); capTex.colorSpace = THREE.SRGBColorSpace;
  CAP = mesh(new THREE.PlaneGeometry(0.34, 0.085), new THREE.MeshBasicMaterial({ map: capTex, transparent: true, depthTest: false, toneMapped: false }), 0, -0.2, -1.0, false); CAP.renderOrder = 99; scene.add(cam); cam.add(CAP);
}
let capLast = ''; function caption(txt) { if (txt === capLast) return; capLast = txt; const g = capCtx; g.clearRect(0, 0, 1024, 256); if (txt) { let fs = 96; g.font = `bold ${fs}px "DejaVu Sans"`; while (g.measureText(txt).width > 960 && fs > 30) { fs -= 4; g.font = `bold ${fs}px "DejaVu Sans"`; } g.textAlign = 'center'; g.lineWidth = 16; g.strokeStyle = '#000'; g.fillStyle = '#ffe14a'; g.strokeText(txt, 512, 150); g.fillText(txt, 512, 150); } capTex.needsUpdate = true; }
const CAPS = [[0.0, 'IN THE KINGDOM'], [1.16, 'OF BRAMBLETON'], [2.36, 'BARON GRIMWALD'], [3.06, 'HAD ONE PLAN'], [4.3, 'BURN ASHCOMBE CASTLE'], [5.16, 'TO THE GROUND!'], [6.2, 'FIRE ARROWS'], [6.96, 'THOUSANDS OF THEM'], [7.84, 'THE WOODEN GATE'], [8.38, 'CAUGHT FIRE'], [9.0, 'IN SECONDS'], [9.88, 'KING EDGAR DID'], [10.5, 'WHAT KINGS DO'], [11.2, 'BEST...'], [11.8, 'PANIC!'], [12.44, 'WATER?'], [13.04, 'GONE.'], [13.62, 'BUCKETS?'], [14.2, 'EMPTY.'], [14.72, 'THEN CAME BARNABY'], [15.8, 'THE LAUNDRY MAN'], [16.86, 'HE HAD ONE IDEA'], [17.8, 'A VERY WET IDEA'], [19.22, 'HE HUNG SOAKING'], [19.88, 'SHEETS OVER THE GATE'], [20.74, 'AND THE FIRE ARROWS'], [21.64, 'HIT...'], [22.14, 'AND JUST'], [22.6, 'FIZZLED!'], [23.68, "HERE'S WHY"], [24.78, 'WATER SOAKS UP'], [25.38, 'A HUGE AMOUNT OF HEAT'], [26.56, 'TO TURN INTO STEAM'], [27.54, 'AS LONG AS'], [28.14, 'THE CLOTH IS WET'], [29.12, "IT CAN'T GET HOTTER"], [29.84, 'THAN BOILING'], [30.76, "AND THAT'S TOO COOL"], [31.46, 'TO CATCH FIRE'], [32.54, 'BARON GRIMWALD'], [33.1, 'RAN OUT OF ARROWS'], [34.78, 'AND PATIENCE!'], [35.84, 'ASHCOMBE WAS SAVED'], [37.04, 'BY LAUNDRY!'], [37.92, 'AND KING EDGAR?'], [38.88, 'HE MADE BARNABY'], [39.72, 'A KNIGHT'], [40.38, 'SIR BARNABY'], [40.98, 'OF THE WET SHEETS!'], [42.6, '']];
// ---------------- acting tracks ----------------
const TR = {
  GRIM: [[0, 'evil'], [3.6, 'evil', { gestures: ['rubHands', 'fingerTent'] }], [4.9, 'angry', { gestures: ['stabPoint', 'pointAhead'] }], [6.0, 'evil', { gestures: ['pointAhead', 'armsWide'] }], [22.6, 'shock'], [32.5, 'angry'], [33.9, 'angry', { gestures: ['stomp', 'fistShake'] }], [34.8, 'angry', { gestures: ['fistShake', 'armsWide'], rate: 0.2, energy: 1.4 }], [36, 'sad']],
  KING: [[0, 'attitude'], [9.9, 'attitude', { gestures: ['hips', 'leanBack'] }], [10.7, 'scared', { gestures: ['biteNails'] }], [11.8, 'shock', { gestures: ['handsUp', 'cheeks'], rate: 0.2, energy: 1.4 }], [12.4, 'scared'], [17.2, 'confused'], [22.6, 'excited'], [35.6, 'excited'], [37.9, 'happy'], [38.8, 'attitude', { gestures: ['fingerUp'], hold: true }], [40.4, 'laugh']],
  BARN: [[0, 'happy'], [15.2, 'determined', { gestures: ['fists', 'pointAhead'] }], [15.8, 'attitude', { gestures: ['hips', 'thumbsUp'] }], [16.8, 'think', { gestures: ['fingerUp', 'chin'] }], [17.8, 'attitude', { gestures: ['rubHands', 'fixTie'] }], [19.2, 'determined', { gestures: ['openArms'] }], [22.2, 'laugh'], [23.4, 'talk', { gestures: ['fingerUp', 'explainR', 'countFinger'] }], [27.5, 'talk', { gestures: ['explainL', 'pointAhead'] }], [31.0, 'attitude', { gestures: ['thumbsUp', 'crossArms'] }], [35.6, 'excited'], [37.0, 'happy', { gestures: ['cheer', 'thumbsUp'] }], [38.8, 'sad', { gestures: ['slump'], hold: true, energy: 0.5 }], [40.3, 'excited', { gestures: ['cheer', 'fistPump'] }], [41.3, 'laugh']],
  SOL: [[0, 'scared'], [9.3, 'shock', { rate: 0.2 }], [12.4, 'confused', { gestures: ['shrug'] }], [13.0, 'sad'], [14.2, 'sad', { gestures: ['slump'] }], [17.2, 'confused'], [22.6, 'excited']],
  ARCH: [[0, 'evil'], [5.6, 'focused'], [33.2, 'confused', { gestures: ['shrug', 'scratchHead'] }]],
};
TR.ARCH = TR.ARCH.map(([t, m, o]) => [t, m === 'focused' ? 'determined' : m, o]);
const hideAll = () => { for (const F of CAST) { F.mesh.visible = false; if (F.shadow) F.shadow.visible = false; } };
function act(F, P, track, seed, t, camPos, extra = {}) { F.place(P.x, P.y, P.z); F.update({ ...perform(t, track, seed), ...extra }, camPos); }
function setup(t, camPos) { Flat2D.T = t; let cap = ''; for (const [a, s] of CAPS) if (t >= a) cap = s; caption(cap);
  // crowds
  ARMY.update(t, camPos, { bob: 0.3, mode: (t > 4.9 && t < 6.2) ? 1 : (t > 33 && t < 36) ? 2 : 0, march: 0 });
  ARCHERS.update(t, camPos, { bob: 0.2, mode: (t > 5.6 && t < 6.4) || (t > 20.2 && t < 20.9) ? 2 : 0 });
  ARCHERS.u.uMode.value = (t > 5.6 && t < 6.3) || (t > 20.2 && t < 20.8) ? 1 : (t > 33.2 && t < 35) ? 2 : 0;
  DEF.update(t, camPos, { bob: 0.3, mode: t > 8.4 && t < 14.6 ? 1 : t > 22.6 ? 3 : 0 }); DEF.u.uMode.value = t > 8.4 && t < 14.6 ? 2 : t > 22.6 ? 1 : 0;   // panic (hold), then cheer
  BUCK.update(t, camPos, { bob: 0.3, mode: t > 13.0 && t < 15 ? 1 : 0, visible: t > 12 && t < 22 });
  // fire + arrows
  VOL1.update(t, { x: 0, y: 2.0, z: 35, rx: 16, rz: 2 }, { x: 0, y: 4, z: 1.6, rx: 2.6, rz: 0.2 }, 6.25, 1.6, 13, t > 6 && t < 9.5);
  VOL2.update(t, { x: 0, y: 2.0, z: 35, rx: 16, rz: 2 }, { x: 0, y: 4, z: 2.0, rx: 3.0, rz: 0.2 }, 20.6, 1.0, 9, t > 20.4 && t < 22.4);
  FIRE.update(t, 8.38, 19.45, V(0, 0.6, 1.7), 4.4); CASTLE.gateMat.color.setRGB(...(t > 8.4 && t < 19.45 ? [0.75 - 0.35 * clamp((t - 8.4) / 4, 0, 1), 0.55 - 0.3 * clamp((t - 8.4) / 4, 0, 1), 0.4 - 0.25 * clamp((t - 8.4) / 4, 0, 1)] : t >= 19.45 ? [0.35, 0.22, 0.15] : [1, 1, 1]));
  STUCK[0].im.visible = STUCK[0].P.visible = t > 7.9; STUCK[0].P.visible = t > 7.9 && t < 19.45; STUCK[1].im.visible = t > 21.55; STUCK[1].P.visible = t > 21.55 && t < 22.7; STUCK[1].pm.size = 0.7 * clamp((22.7 - t) / 1.0, 0, 1);
  SHEETS.update(t, 19.25); STEAM.update(t, 21.6, V(0, 4.5, 1.9), 0, t > 21.5); STEAM2.update(t, 19.5, V(0, 2.5, 1.9), 0, t > 19.4 && t < 22);
  SPLASH.update(t, 18.0, () => BARN.toWorld(BARN.handR || [256, 600]), 0.25, t > 17.9 && t < 19.2);
  // science: heat flows into the drops (glow), drops shrink into steam; thermometer stops at 100 °C
  SCI.fire.update(t, 24.6, 32.0, V(14, 0.4, 6.1), 1.8); const glow = t > 25.4 && t < 27.3 ? 0.3 + 0.3 * Math.sin(t * 18) : 0; SCI.dropM.emissive.setRGB(glow * 0.6, glow * 0.2, 0);
  const shrink = clamp((t - 26.6) / 0.9, 0, 1); SCI.drops.forEach((d, i) => { const k = clamp(1 - shrink * (0.6 + (i % 5) * 0.12), 0.05, 1) * (t > 27.5 ? 1 : 1); d.scale.set(k, k, k * 0.55); }); SCI.steam.update(t, 26.6, V(14, 3.4, 6.5), 1.6, t > 26.6 && t < 32);
  const lv = t < 28.6 ? 0.08 : t < 30.1 ? lerp(0.08, 0.5, (t - 28.6) / 1.5) : 0.5 + 0.006 * Math.sin(t * 30); THERMO.update(lv);
  // heroes
  hideAll();
  if (t < 8.0 || (t > 22.3 && t < 23.4) || (t > 32.4 && t < 35.7)) act(GRIM, GR_P, TR.GRIM, 3, t, camPos, { prop: t > 4.9 && t < 8 ? 'sword' : null, propHand: 'R' });
  if (t > 5.4 && t < 7.0 || (t > 33.0 && t < 34.0)) act(ARCH, ARCH_P, TR.ARCH, 14, t, camPos, { prop: 'bow', propHand: 'L', ...(t < 7 ? { armL: [92, -4], armR: [92, t < 6.2 ? -110 : -20] } : {}) });
  if (t > 9.8 && t < 18.0) act(KING, KING_TOP, TR.KING, 5, t, camPos);
  if (t > 22.3 && t < 23.4) act(KING, KING_TOP, TR.KING, 5, t, camPos);
  if (t > 35.5) { const P = t < 37.9 ? KING_TOP : KING_GND; act(KING, P, TR.KING, 5, t, camPos, t > 38.8 && t < 40.4 ? { armR: [lerp(150, 100, clamp((t - 39.2) / 0.5, 0, 1)), -10], prop: 'sword', propHand: 'R', propFront: true } : {}); }
  if (t > 8.6 && t < 15.0 || (t > 16.9 && t < 18.0) || (t > 21.6 && t < 23.5)) act(SOL, SOL_P, TR.SOL, 11, t, camPos, t > 12.3 && t < 15 ? { prop: 'bucket', propHand: 'R', propFront: true, armR: [t < 13.0 ? 120 : 70, -10] } : {});
  if (t > 14.6) { const P = BARN_P(t); let pb = perform(t, TR.BARN, 8); if (t < 16.6) { const m = mo('17_06f', t, { t0: 14.7, from: 0.4, amp: 1.3, speed: 1.4, root: 0, hold: 0 }); pb = { ...pb, legL: m.legL, legR: m.legR }; }
    const wring = t > 17.9 && t < 19.2; if (wring) pb = { ...pb, armL: [70, -95], armR: [70, -95] }; if (t > 38.8 && t < 40.3) pb = { ...pb, kneel: 0.7 };
    BARN.place(P.x, P.y, P.z); BARN.update({ ...pb, prop: (t < 19.3 || wring) ? 'rag' : null, propHand: 'R', propFront: true }, camPos); }
}
function fx() {}
// ---------------- camera: one move per beat ----------------
const CINE = new Cine(); const shot = (a, b, s) => CINE.shot(a, b, s); const H = (F, dy = 0) => () => F.headWorld().add(V(0, dy, 0)); const Bd = (F, dy = 0) => () => F.bodyWorld().add(V(0, dy, 0));
const pov = (a, b, from, at, fov = 44) => shot(a, b, { rig: 'pov', from, at, fov, push: 1, drift: [0, 0] }); const u = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const close = (a, b, F, o = {}) => shot(a, b, { rig: 'push', at: H(F, o.dy ?? -0.1), size: o.size ?? 1.15, az: o.az ?? 15, el: o.el ?? 0, fov: o.fov ?? 32, push: o.push ?? 1.2, zoomK: o.zk, roll: o.roll });
const med = (a, b, F, o = {}) => shot(a, b, { rig: 'push', at: Bd(F, o.dy ?? 0.3), size: o.size ?? 2.4, az: o.az ?? -15, el: o.el ?? -10, fov: o.fov ?? 34, push: o.push ?? 1.15, zoomK: o.zk, roll: o.roll });
function camera() {
  pov(0, 1.16, (t) => V(lerp(30, 8, u(t, 0, 1.16)), lerp(80, 24, u(t, 0, 1.16) ** 0.8), lerp(150, 55, u(t, 0, 1.16))), () => V(0, 10, 0), 48);   // drone dive on the castle
  pov(1.16, 2.36, (t) => V(lerp(-26, -20, u(t, 1.16, 2.36)), lerp(6, 16, u(t, 1.16, 2.36)), lerp(26, 20, u(t, 1.16, 2.36))), () => V(-40, 22, 0), 46);   // crane up to the red-roof tower + flag
  close(2.36, 3.06, GRIM, { az: 22, el: -6, zk: [[2.4, 1.5, 0.06]] });                                   // BARON GRIMWALD (crash zoom)
  med(3.06, 3.6, GRIM, { az: 160, el: -12, size: 3.2, dy: 0.6 });                                                  // low angle, army behind
  close(3.6, 4.3, GRIM, { az: 8, size: 0.95, push: 1.3 });                                                // "one plan" — evil finger tent
  pov(4.3, 5.16, (t) => GR_P.clone().add(V(0.9, 2.3, 2.4 + u(t, 4.3, 5.16) * 0.6)), () => V(0, 8, 0), 40);   // over his shoulder: the castle
  med(5.16, 5.6, GRIM, { az: 25, el: -10, size: 3.0, dy: 0.6, zk: [[5.5, 1.3, 0.05]] });                           // "to the ground!" — points
  close(5.6, 6.2, ARCH, { az: -25, size: 1.5, push: 1.25 });                                              // archer draws a fire arrow
  pov(6.2, 6.96, (t) => V(5, 1.0, 44 - u(t, 6.2, 6.96) * 2), () => V(0, 12, 12), 46);                     // behind the archers: launch
  pov(6.96, 7.84, (t) => V(3, 0.8, 20 - u(t, 6.96, 7.84) * 3), () => V(0, 22, 26), 56);                   // under the arcs: thousands
  pov(7.84, 8.38, (t) => V(3.5, 2.2, 14 - u(t, 7.84, 8.38) * 3), () => V(0, 4, 1.5), 42);                 // the wooden gate — arrows thud in
  shot(8.38, 9.0, { rig: 'push', at: () => V(0, 3.4, 1.6), size: 6, az: 12, el: -4, fov: 36, push: 1.3, zoomK: [[8.4, 1.4, 0.06]] });   // CAUGHT FIRE
  pov(9.0, 9.3, (t) => V(-11.5 - u(t, 9.0, 9.3), 14.2, -1.2), () => V(-24, 13.4, 1.0), 50);                 // defenders panic on the wall
  close(9.3, 9.88, SOL, { az: 25, size: 1.2, zk: [[9.32, 1.4, 0.05]] });                                  // soldier shock
  med(9.88, 10.7, KING, { az: 4, el: -4, size: 2.4, dy: 0.5 });                                         // King Edgar, proud
  close(10.7, 11.8, KING, { az: -6, el: 4, size: 1.15 });                                                       // ...nervous
  close(11.8, 12.44, KING, { az: 2, el: 3, size: 1.4, zk: [[11.82, 1.7, 0.05]], roll: 0.1 });                    // PANIC!
  close(12.44, 13.04, SOL, { az: 30, size: 1.6, dy: -0.4 });                                              // water? (bucket upside down)
  close(13.04, 13.62, SOL, { az: 20, el: 4, size: 1.6, dy: -0.5, push: 1.25 });   // insert: empty bucket
  pov(13.62, 14.2, (t) => V(10.5 + u(t, 13.62, 14.2), 1.7, 11.5), () => V(7.0, 1.3, 6.4), 44);           // row of empty buckets
  close(14.2, 14.72, SOL, { az: -20, size: 1.1 });                                                        // "empty." sad
  pov(14.72, 15.3, (t) => V(-2.0, 0.6, 9.3), (t) => BARN_P(t).add(V(0, 1.1, 0)), 40);                   // THEN CAME… low angle, he walks in
  med(15.3, 15.8, BARN, { az: 20, el: -20, size: 2.4 });                                                 // BARNABY hero low angle
  med(15.8, 16.86, BARN, { az: -22, el: -8, size: 2.2, push: 1.1 });                                     // the laundry man
  close(16.86, 17.24, BARN, { az: 15, size: 1.2, zk: [[16.9, 1.35, 0.05]] });                             // one idea (finger up)
  close(17.24, 17.8, KING, { az: -4, el: 4, size: 1.2 });                                                       // king: huh?
  close(17.8, 18.4, BARN, { az: -20, size: 1.3 });                                                        // a very wet idea (wink)
  shot(18.4, 19.22, { rig: 'push', at: () => BARN.toWorld(BARN.handR || [256, 500]), size: 1.0, az: 25, el: 5, fov: 32, push: 1.2 });   // insert: wringing → splash
  pov(19.22, 19.88, (t) => V(5.5 - u(t, 19.22, 19.88), 2.6, 11), () => V(0, 4.2, 1.6), 42);              // sheets unroll over the gate
  pov(19.88, 20.58, (t) => V(-3.2 + u(t, 19.88, 20.58), 1.0, 8.6), () => V(0, 4.3, 1.8), 46);            // from the wall top: dripping sheets
  pov(20.58, 21.1, (t) => V(-6, 3 + u(t, 20.58, 21.1) * 3, 40), () => V(0, 10, 14), 48);                  // second volley launches
  pov(21.1, 21.64, (t) => V(0.6, 4.6 - u(t, 21.1, 21.64) * 0.4, lerp(12, 4.2, u(t, 21.1, 21.64))), () => V(0, 4.2, 1.8), 46);   // arrow-cam into the sheets
  shot(21.64, 22.14, { rig: 'push', at: () => V(0, 4, 2), size: 5.0, az: -14, el: 0, fov: 34, push: 1.2 });   // stuck… flames
  shot(22.14, 22.6, { rig: 'push', at: () => V(0, 4, 2), size: 5.5, az: 10, el: 0, fov: 34, push: 1.1 });
  shot(22.6, 23.4, { rig: 'push', at: () => V(0, 5, 2.2), size: 12, az: 0, el: -6, fov: 36, push: 1.15, zoomK: [[22.62, 1.3, 0.06]] });   // FIZZLED — steam
  close(23.4, 24.6, BARN, { az: 0, size: 1.3, push: 1.15 });                                              // "here's why" — explainer
  pov(24.6, 25.38, (t) => V(14 + u(t, 24.6, 25.38) * 0.4, 3.0, 11.6), () => V(14, 2.8, 6.2), 42);         // science: drops on the cloth, flame below
  pov(25.38, 26.56, (t) => V(14.6, 3.3, 10.4 - u(t, 25.38, 26.56) * 0.8), () => V(14, 3.1, 6.3), 38);     // heat pours into the drops (glow)
  pov(26.56, 27.54, (t) => V(13.2, 3.6, 10.6), () => V(14, 3.8, 6.3), 42);                                // drops → steam
  med(27.54, 28.68, BARN, { az: 25, size: 2.1, push: 1.1 });                                              // as long as the cloth is wet
  pov(28.68, 29.84, (t) => V(16.4, 2.8, 12.2 - u(t, 28.68, 29.84)), () => V(17.6, 3.0, 6.4), 40);         // thermometer climbs
  pov(29.84, 30.76, (t) => V(17.4, 3.2, 10.6 - u(t, 29.84, 30.76) * 0.6), () => V(17.6, 3.3, 6.4), 34);                                // …and STOPS at 100 °C
  shot(30.76, 31.46, { rig: 'push', at: () => V(0, 4, 2), size: 3.0, az: 20, el: 0, fov: 34, push: 1.2 });   // too cool — flames die on the sheet
  close(31.46, 32.54, BARN, { az: -12, size: 1.2 });                                                      // thumbs up
  close(32.54, 33.1, GRIM, { az: 18, size: 1.15, zk: [[32.56, 1.5, 0.05]] });                             // Baron Grimwald
  pov(33.1, 34.0, (t) => V(5.5, 1.3, 31 - u(t, 33.1, 34.0)), () => ARCH_P.clone().add(V(0, 1.2, 0)), 40);   // archers: out of arrows (shrug)
  med(34.0, 34.78, GRIM, { az: -15, el: -10, size: 2.3 });                                               // stomp
  close(34.78, 35.84, GRIM, { az: 0, size: 1.05, zk: [[34.82, 1.6, 0.05]], roll: -0.1 });                 // AND PATIENCE! rage
  pov(35.84, 37.04, (t) => V(lerp(-22, 14, u(t, 35.84, 37.04)), 20, 26), () => V(0, 8, 0), 48);          // castle saved — sweep, soldiers cheer
  close(37.04, 37.92, BARN, { az: 18, size: 1.4, zk: [[37.1, 1.4, 0.05]] });                              // BY LAUNDRY!
  close(37.92, 38.88, KING, { az: -12, size: 1.25 });                                                     // and King Edgar?
  pov(38.88, 39.9, (t) => V(-1.4 + u(t, 38.88, 39.9) * 0.5, 1.3, 9.8), () => V(0.7, 1.2, 6.3), 36);       // knighting two-shot
  pov(39.9, 40.38, (t) => V(0.5 + u(t, 39.9, 40.38) * 0.3, 1.5, 8.7), () => V(0.75, 1.45, 6.3), 30);   // the sword on the shoulder
  close(40.38, 41.34, BARN, { az: -10, size: 1.2, zk: [[40.6, 1.5, 0.05]] });                             // SIR BARNABY
  pov(41.34, 42.6, (t) => V(-4 + u(t, 41.34, 42.6) * 2, 2.2, 12.6), () => V(-0.4, 2.0, 6.3), 46);          // everyone laughs
  pov(42.6, 45.3, (t) => V(lerp(2, 20, u(t, 42.6, 45.3)), lerp(3, 46, u(t, 42.6, 45.3) ** 0.8), lerp(12, 70, u(t, 42.6, 45.3))), () => V(0, 6, 0), 48);   // drone pull-back
}
const composer = makeComposer({ sat: 1.3, con: 1.12, bloom: 0.12 }); const SKY = makeSky();
const look = (t, cpos) => { SKY.update(cpos, false, composer.grade); sun.color.setHex(0xffdcb0); sun.intensity = 2.6; hemi.intensity = 0.55; const tg = sun.target.position; sun.position.copy(tg).add(V(-40, 55, 45)); };
makeRenderer({ CINE, camOf: dynamicCam(CINE), setup, fx, look, composer, DURATION, impacts: [2.4, 8.4, 11.82, 21.62, 22.62, 34.82, 37.1, 40.6] });
(async () => { await loadMo(['17_06f'], './mocap'); await sky('kloofendal_48d_partly_cloudy_puresky', { env: 0.9 }); build(); camera(); await ready(); window.ready = true; })();
