// KINGDOM demo (Studio v9): a cruel king's court, thousands of people, an army marching out, arrow volley, armies clash.
// Shows the v9 rules: a new visual every 0.3–0.8 s, every shot = action + reaction + camera move, era-built world, huge crowds.
import * as THREE from 'three';
import { R, scene, cam, sun, hemi, V, std, mesh, sky, ready, Burst, PT, makeComposer, pbr } from '../../web/realkit.js';
import { Cine } from '../../web/cine.js';
import { Flat2D } from '../../web/flat2d.js';
import { sstep, clamp, lerp } from '../../web/motion.js';
import { installActing, keys, faceK, makeSky, dynamicCam, makeRenderer } from '../../web/studio.js';
import { Batch, texMat, plain, boxUV, terrain, photoMat } from '../../web/world3d.js';
import { makeAtlas, Crowd, grid, blob, mulberry, Volley } from '../../web/crowd.js';
import { royalPalace, mughalGarden, greenField, rbox, mat, GOLD, TILE } from '../../web/eras.js';
export const DURATION = 15;
installActing();
// =================== WORLD: palace (z -60), courtyard, city wall + gate (z 0), battlefield (z 0..160) ===================
const flags = []; let TITLE, CAP, capCtx, capTex, DUST = [];
let PAL, GARD;
function cityWall(B) { const brick = photoMat('brick', { rep: 1 }), stone = pbr('red_sandstone_wall', [1, 1], { metal: 0, rough: 1 }), roof = TILE('#18a8b8', '#e8b870', '#1a4a9a', [3, 1]);
  // massive old fort walls: 18 m high, 7 m thick, real bricks, sandstone cap and merlons
  for (const s of [-1, 1]) { B.add(boxUV(70, 18, 7, 2.2), brick, s * 42, 9, 0); B.add(boxUV(70.4, 1.4, 7.4, 2), stone, s * 42, 18.4, 0); for (let i = 0; i < 26; i++) B.add(boxUV(1.6, 2.2, 1.2, 2), stone, s * (9 + i * 2.7), 20.2, 2.9); }
  for (const s of [-1, 1]) { B.add(new THREE.CylinderGeometry(6, 6.8, 28, 28), brick, s * 9, 14, 0); B.add(new THREE.CylinderGeometry(6.4, 6.4, 1.6, 28, 1, true), roof, s * 9, 26, 0); B.add(new THREE.SphereGeometry(6.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), GOLD(), s * 9, 28, 0); }
  B.add(boxUV(12, 6, 7.4, 2.2), brick, 0, 19, 0); B.add(new THREE.BoxGeometry(11, 3, 0.1), roof, 0, 19, 3.75); for (const s of [-1, 1]) B.add(boxUV(7, 18, 70, 2.2), brick, s * 42, 9, -36); }
function battlefield() { greenField({ tentZ: 150 }); }
function flag(x, y, z, col, s = 1) { const pole = mesh(new THREE.CylinderGeometry(0.06 * s, 0.06 * s, 6 * s, 8), std(0x5a3a20), x, y + 3 * s, z); scene.add(pole); const g = new THREE.PlaneGeometry(2.4 * s, 1.4 * s, 12, 1); g.translate(1.2 * s, 0, 0); const f = mesh(g, std(col, { side: THREE.DoubleSide, r: 0.7 }), x, y + 5.3 * s, z); scene.add(f); f.userData.p0 = g.attributes.position.array.slice(); flags.push(f); }
function build() { PAL = royalPalace({ z: -58 }); GARD = mughalGarden({ z1: -50, z2: -4, w: 56 }); const B = new Batch(); cityWall(B); B.flush(); battlefield();
  for (let i = -5; i <= 5; i++) flag(i * 5, 17.2, -58.4, i % 2 ? 0xd8283a : 0xf2c63a); for (const s of [-1, 1]) flag(s * 8, 26, 0, 0xd8283a, 1.4); for (let i = -6; i <= 6; i++) flag(i * 9 + 2, 18, 128, 0x2a2a3a, 1.2);
  // caption card on the camera (narration words)
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256; capCtx = c.getContext('2d'); capTex = new THREE.CanvasTexture(c); capTex.colorSpace = THREE.SRGBColorSpace; CAP = mesh(new THREE.PlaneGeometry(0.34, 0.085), new THREE.MeshBasicMaterial({ map: capTex, transparent: true, depthTest: false, toneMapped: false }), 0, -0.2, -1.0, false); CAP.renderOrder = 99; scene.add(cam); cam.add(CAP);
  for (let i = 0; i < 6; i++) DUST.push(new Burst({ n: 40, dur: 0.6, life: 2.2, speed: [1, 4], dir: [0, 0.6, 0], spread: 1.2, g: 0.2, size: [1.5, 4], grow: 1.5, tex: 'smoke', opacity: 0.5, seed: 30 + i }));
}
let capLast = ''; function caption(txt) { if (txt === capLast) return; capLast = txt; const g = capCtx; g.clearRect(0, 0, 1024, 256); if (!txt) { capTex.needsUpdate = true; return; } let fs = 92; g.font = `bold ${fs}px "DejaVu Sans"`; while (g.measureText(txt).width > 960 && fs > 30) { fs -= 4; g.font = `bold ${fs}px "DejaVu Sans"`; } g.textAlign = 'center'; g.lineWidth = 16; g.strokeStyle = '#000'; g.fillStyle = '#ffe14a'; g.strokeText(txt, 512, 150); g.fillText(txt, 512, 150); capTex.needsUpdate = true; }
// =================== CAST (hero cards) ===================
const KING = new Flat2D({ body: 'royal', coat: '#9a1a2a', cape: '#5a1a7a', sash: '#1a8a5a', hat: 'crown', hatCol: '#f2c63a', beard: '#2a1810', mustache: true, hair: '#2a1810', size: 2.1, res: 2.2, wide: true, headroom: 420, seed: 3, scene });
const GEN = new Flat2D({ body: 'armor', coat: '#2a4a9a', steel: '#c8ced6', emblem: '#f2c63a', hat: 'helm', hatCol: '#a8aeb6', band: '#2a5ad8', mustache: true, hair: '#1a1410', size: 2.0, res: 2.2, wide: true, headroom: 420, seed: 7, scene });
const ARCH = new Flat2D({ body: 'armor', coat: '#3a6a2a', steel: '#a89a7a', hat: 'helm', hatCol: '#8a7a5a', hair: '#3a2010', size: 1.95, res: 2.2, wide: true, headroom: 420, seed: 12, scene });
const HERO = [KING, GEN, ARCH]; const hideAll = () => HERO.forEach((c) => { c.mesh.visible = false; if (c.shadow) c.shadow.visible = false; });
// =================== CROWDS ===================
const r0 = mulberry(4); const pick = (a) => a[Math.floor(r0() * a.length)];
const COATS = ['#2a5ad8', '#3a8a5a', '#d8a030', '#8a3ab0', '#c84a2a', '#f4f0e6', '#2a9ab0', '#b05a8a', '#6a4a2a'], HAIRS = ['#1a1410', '#3a2414', '#6a4a2a', '#2a2a2a'];
const courtV = Array.from({ length: 16 }, (_, i) => ({ body: pick(['sherwani', 'sherwani', 'sherwani', 'royal']), sash: pick(['#e8282a', '#1a8a5a', '#f2c63a']), cape: pick(['#5a1a7a', '#1a4a9a']), coat: pick(COATS), hat: i % 3 === 0 ? 'turban' : null, hatCol: pick(['#f4f0e6', '#f2c63a', '#d8283a', '#2a5ad8']), band: pick(['#d8283a', '#2a8a5a']), hair: pick(HAIRS), mustache: r0() < 0.5, beard: r0() < 0.3 ? pick(HAIRS) : null }));
const courtF = [{ armL: [16, -32], armR: [16, -32] }, { armL: [150, 20], armR: [150, 20], face: { eyes: 'happy', mouth: 'laugh' }, hop: 10 }, { armL: [30, 40], armR: [30, 40], lean: 26, bend: 34, face: { eyes: 'closed', mouth: 'line' } }];
const soldierV = Array.from({ length: 12 }, () => ({ body: 'armor', coat: pick(['#2a4a9a', '#2a5ad8', '#24407a']), steel: pick(['#c8ced6', '#b0b8c2']), emblem: '#f2c63a', hat: 'helm', hatCol: pick(['#a8aeb6', '#9aa0a8']), band: '#d8b040', hair: pick(HAIRS), mustache: r0() < 0.4, prop: 'spear' }));
const soldierF = [{ armR: [20, 10], armL: [16, -32], prop: 'spear', propHand: 'R', face: { eyes: 'lid', lid: 0.3, mouth: 'line', brow: -0.6 } }, { armR: [150, -10], armL: [70, -60], prop: 'spear', propHand: 'R', face: { eyes: 'stare', mouth: 'scream', brow: -1 }, lean: -6 }, { armR: [100, -50], armL: [40, 40], prop: 'spear', propHand: 'R', face: { eyes: 'tiny', mouth: 'scream', brow: 1.2 }, lean: 10 }];
const enemyV = Array.from({ length: 12 }, () => ({ body: 'armor', coat: pick(['#8a1a1a', '#a02a20', '#6a1414']), steel: pick(['#a08a5a', '#8a7a5a']), hat: 'helm', hatCol: pick(['#a07a3a', '#8a6a30']), band: '#1a1a1a', hair: pick(HAIRS), mustache: r0() < 0.6, beard: r0() < 0.4 ? '#1a1410' : null }));
const enemyF = [{ armR: [150, -20], armL: [60, -40], prop: 'sword', propHand: 'R', face: { eyes: 'stare', mouth: 'scream', brow: -1 } }, { armR: [60, 40], armL: [60, -40], prop: 'sword', propHand: 'R', face: { eyes: 'stare', mouth: 'psycho', brow: -1 }, lean: 8 }, { armR: [150, 60], armL: [150, 60], prop: 'shield', propHand: 'L', face: { eyes: 'tiny', mouth: 'scream', brow: 1.3 } }];
const archerV = Array.from({ length: 6 }, () => ({ body: 'armor', coat: pick(['#3a5a2a', '#4a6a30']), steel: '#a89a7a', hat: 'helm', hatCol: '#8a7a5a', hair: pick(HAIRS) }));
const archerF = [{ armL: [100, 0], armR: [90, -80], prop: 'bow', propHand: 'L', face: { eyes: 'lid', lid: 0.4, mouth: 'line', brow: -0.8 } }, { armL: [120, 0], armR: [120, -110], prop: 'bow', propHand: 'L', face: { eyes: 'squeeze', mouth: 'line', brow: -0.9 }, lean: -6 }, { armL: [120, 0], armR: [80, 30], prop: 'bow', propHand: 'L', face: { eyes: 'stare', mouth: 'smallO', brow: 0.2 } }];
let ATL = {}, COURT, ARMY, ENEMY, ARCHERS, VOLLEY;
function crowds() { ATL.court = makeAtlas(courtV, courtF); ATL.sol = makeAtlas(soldierV, soldierF); ATL.en = makeAtlas(enemyV, enemyF); ATL.arc = makeAtlas(archerV, archerF);
  const courtSpots = [...grid(-11, -30, 14, 16, 1.1, 1.4, 0.4, 3), ...grid(11, -30, 14, 16, 1.1, 1.4, 0.4, 4)];   // 448 courtiers on both sides of the carpet
  COURT = new Crowd(ATL.court, courtSpots, { seed: 2 });
  ARMY = new Crowd(ATL.sol, grid(0, 0, 40, 30, 1.25, 1.5, 0.35, 5), { seed: 3, hitFrac: 0.12 });   // 1200 soldiers (mesh moves out of the gate)
  ENEMY = new Crowd(ATL.en, grid(0, 0, 44, 30, 1.3, 1.5, 0.45, 6), { seed: 4, hitFrac: 0.18, flip: true });   // 1320 enemies
  ARCHERS = new Crowd(ATL.arc, grid(0, 0, 50, 4, 1.2, 1.6, 0.3, 7), { seed: 5 });   // 200 archers on the wall walk
  VOLLEY = new Volley(1400, { seed: 9 }); }
// =================== TIMING / ACTING ===================
const T = { court: [0, 3.6], march: [3.6, 5.2], enemy: [5.2, 6.2], archers: [6.2, 7.0], volley: 7.0, rain: 8.4, clash: 9.6 };
const ARMY_Z = (t) => (t < 3.6 ? 14 : lerp(14, 70, clamp((t - 3.6) / 6.0, 0, 1))), ENEMY_Z = (t) => lerp(150, 84, clamp((t - 5.2) / 4.4, 0, 1));
const CAPS = [[0, 'EK ZAALIM BADSHAH'], [1.4, 'USKA HUKM'], [2.8, 'HAZAARON SAR JHUKTE'], [3.6, 'LAAKHON KI FAUJ'], [5.2, 'DUSHMAN AA PAHUNCHA'], [7.0, 'AASMAAN TEERON SE BHAR GAYA'], [9.6, 'JANG!'], [12.8, '']];
function setup(t, camPos) { Flat2D.T = t; Flat2D.E = 0; Flat2D.ON = 0; hideAll(); for (const f of flags) { const a = f.geometry.attributes.position, p0 = f.userData.p0; for (let i = 0; i < a.count; i++) { const x = p0[i * 3]; a.setZ(i, Math.sin(x * 2.2 - t * 9) * 0.18 * x / 2.4); } a.needsUpdate = true; }
  let cap = ''; for (const [a, s] of CAPS) if (t >= a) cap = s; caption(cap);
  // crowds every frame (they live in the world; shots decide what we see)
  const bow = t > 2.8 && t < 3.6, cheer = t > 1.0 && t < 1.4;
  COURT.update(t, camPos, { mode: bow ? 2 : cheer ? 1 : 0, bob: cheer ? 1 : 0.2, visible: t < 3.7 });
  ARMY.mesh.position.set(0, 0, ARMY_Z(t)); ARMY.update(t, camPos, { mode: t > 9.4 ? 1 : t > 4.6 ? 0 : 0, march: t > 3.6 ? 1 : 0, bob: t > 3.6 ? 0.6 : 0, clashT: T.clash + 0.2, visible: t > 3.5 });
  ENEMY.mesh.position.set(0, 0, ENEMY_Z(t)); ENEMY.update(t, camPos, { mode: t > 8.4 && t < 9.4 ? 2 : 1, march: 1, bob: 1.0, clashT: T.rain + 0.4, visible: t > 5.0 });
  ARCHERS.mesh.position.set(0, 19.1, 0.2); ARCHERS.update(t, camPos, { mode: t > 6.2 && t < 7.0 ? 1 : t >= 7.0 ? 2 : 0, visible: t > 6.0 && t < 9.6 });
  VOLLEY.update(t, { x: 0, z: 0, rx: 30, rz: 2 }, { x: 0, z: ENEMY_Z(t), rx: 28, rz: 18 }, T.volley, 1.6, 34, t > T.volley && t < 10.5);
  for (const [i, d] of DUST.entries()) d.update(t, T.clash + i * 0.12, V((i - 2.5) * 9, 0.5, 78 + (i % 2) * 4));
  // hero performances
  if (t < 3.6) { KING.place(PAL.throne.x, PAL.throne.y - 0.45, PAL.throne.z); KING.update({ e: 1, sit: t < 1.4 ? 1 : 0, ...keys(t, [[0, { armL: [40, -110], armR: [40, -110], tilt: 0, lean: 0 }], [1.6, { armR: [150, -40], armL: [40, -110], lean: -8, tilt: -8, hop: 10 }, 0.08, 'back'], [2.1, { armR: [92, -4], armL: [40, -110], lean: 6, tilt: 6, squash: 0.06 }, 0.1, 'in'], [2.5, { armR: [92, -4], armL: [40, -110], lean: 0, tilt: 0 }, 0.2]]),
      face: faceK(t, [[0, { eyes: 'lid', lid: 0.45, mouth: 'smirk1', brow: -0.6 }], [1.6, { eyes: 'stare', mouth: 'scream', brow: -1.1 }], [2.5, { eyes: 'lid', lid: 0.3, mouth: 'psycho', brow: -1.0 }]], 0.06), noBlink: true }, camPos); }
  if (t > 4.4 && t < 5.4) { GEN.place(0.2, 0, ARMY_Z(t) + 25); GEN.update({ e: 1, ...keys(t, [[4.4, { armR: [60, -40], armL: [16, -32], lean: 0 }], [4.7, { armR: [160, 10], armL: [70, -60], lean: -10, tilt: -8, hop: 12 }, 0.08, 'back']]), prop: 'sword', propHand: 'R', propFront: true, face: faceK(t, [[4.4, { eyes: 'lid', lid: 0.3, mouth: 'line', brow: -0.9 }], [4.7, { eyes: 'stare', mouth: 'scream', brow: -1.2 }]], 0.05), noBlink: true }, camPos); }
  if (t > 6.2 && t < 7.0) { ARCH.place(21.15, 19.1, 1.6); ARCH.update({ e: 1, ...keys(t, [[6.2, archerF[0]], [6.5, { ...archerF[1] }, 0.25], [6.95, { ...archerF[2] }, 0.05]]), prop: 'bow', propHand: 'L', propFront: true, face: faceK(t, [[6.2, archerF[0].face], [6.5, { eyes: 'squeeze', mouth: 'line', brow: -1 }], [6.95, { eyes: 'stare', mouth: 'smallO', brow: 0.2 }]], 0.05), noBlink: true }, camPos); }
  if (t > 11.0 && t < 11.8) { KING.place(PAL.throne.x, PAL.throne.y - 0.45, PAL.throne.z); KING.update({ e: 1, ...keys(t, [[11.0, { armL: [40, -110], armR: [40, -110] }], [11.35, { armL: [150, 40], armR: [150, 40], hop: 14, lean: -6 }, 0.08, 'back']]), face: faceK(t, [[11.0, { eyes: 'tiny', mouth: 'smallO', brow: 1.4 }], [11.35, { eyes: 'stare', mouth: 'scream', brow: -1.2 }]], 0.05), noBlink: true }, camPos); }
  if (t > 11.8 && t < 12.8) { GEN.place(0.2, 0, 72); GEN.update({ e: 1, ...keys(t, [[11.8, { armR: [160, 10], armL: [70, -60], lean: -8 }], [12.15, { armR: [40, 60], armL: [70, -60], lean: 12, tilt: 10, hop: 6, squash: 0.08 }, 0.07, 'in'], [12.5, { armR: [150, 20], armL: [150, 20], lean: -6, hop: 10 }, 0.12, 'back']]), prop: 'sword', propHand: 'R', propFront: true, face: { eyes: 'stare', mouth: 'scream', brow: -1.2 }, noBlink: true }, camPos); }
}
const SPARK = new Burst({ n: 40, dur: 0.05, life: 0.4, speed: [4, 9], dir: [0, 0.5, 1], spread: 1.1, g: -10, size: [0.08, 0.2], tex: 'spark', add: true, seed: 3 });
function fx(t) { SPARK.update(t, 12.15, GEN.pos.clone().add(V(0.8, 1.2, 0.4))); if (GARD) GARD.update(t); }
// =================== CAMERA: a new view every 0.3–0.8 s, always moving ===================
const CINE = new Cine(); const shot = (a, b, s) => CINE.shot(a, b, s);
const kH = (dy = 0) => () => KING.headWorld().add(V(0, dy, 0)), gH = (dy = 0) => () => GEN.headWorld().add(V(0, dy, 0));
function camera() {
  shot(0, 1.4, { rig: 'pov', from: (t) => V(lerp(0, 4, t / 1.4), lerp(52, 24, t / 1.4), lerp(6, -14, t / 1.4)), at: (t) => V(0, 3, lerp(-34, -48, t / 1.4)), fov: 50, push: 1.0, drift: [0, 0] });
  shot(1.4, 2.0, { rig: 'pov', from: (t) => KING.headWorld().add(V(0, 0.2, lerp(14, 2.6, sstep(1.4, 1.7, t)))), at: kH(-0.15), fov: 34, push: 1.0, drift: [0, 0] });
  shot(2.0, 2.8, { rig: 'push', at: kH(-0.3), size: 2.0, az: -18, el: -10, fov: 32, push: 1.2, zoomK: [[2.1, 1.3, 0.06]] });
  shot(2.8, 3.6, { rig: 'pov', from: (t) => V(lerp(18, 14, (t - 2.8) / 0.8), 2.2, lerp(-12, -16, (t - 2.8) / 0.8)), at: () => V(-6, 0.8, -32), fov: 44, push: 1.0, drift: [0, 0] });
  shot(3.6, 4.4, { rig: 'pov', from: (t) => V(4, 0.4, ARMY_Z(t) + 26), at: (t) => V(0, 2.6, ARMY_Z(t) + 8), fov: 46, push: 1.0, drift: [0, 0] });
  shot(4.4, 5.2, { rig: 'push', at: gH(-0.2), size: 1.9, az: 15, el: -14, fov: 32, push: 1.25, zoomK: [[4.7, 1.3, 0.06]] });
  shot(5.2, 6.2, { rig: 'pov', from: (t) => V(lerp(-30, -10, (t - 5.2)), 3, 112), at: (t) => V(0, 2, ENEMY_Z(t)), fov: 40, push: 1.0, drift: [0, 0] });
  shot(6.2, 7.0, { rig: 'push', at: () => V(21.15, 20.6, 1.6), size: 2.8, az: 10, el: 22, fov: 34, push: 1.15 });
  shot(7.0, 8.4, { rig: 'pov', from: (t) => V(7, 2.5, 46 + (t - 7) * 6), at: (t) => V(0, 22, lerp(18, 70, (t - 7) / 1.4)), fov: 60, push: 1.0, drift: [0, 0] });
  shot(8.4, 9.6, { rig: 'pov', from: (t) => V(14, 4, ENEMY_Z(t) - 18), at: (t) => V(0, 1.8, ENEMY_Z(t)), fov: 44, push: 1.0, drift: [0, 0] });
  shot(9.6, 11.0, { rig: 'pov', from: (t) => V(lerp(18, 8, (t - 9.6) / 1.4), lerp(6, 2.5, (t - 9.6) / 1.4), 64 + (t - 9.6) * 6), at: () => V(0, 2, 80), fov: 50, push: 1.0, drift: [0, 0] });
  shot(11.0, 11.8, { rig: 'push', at: kH(-0.15), size: 1.4, az: 8, el: -6, fov: 30, push: 1.3, zoomK: [[11.35, 1.35, 0.06]] });
  shot(11.8, 12.8, { rig: 'push', at: gH(-0.4), size: 2.2, az: 30, el: -12, fov: 34, push: 1.2, zoomK: [[12.15, 1.4, 0.05]] });
  shot(12.8, 15, { rig: 'pov', from: (t) => V(lerp(10, 40, (t - 12.8) / 2.2), lerp(8, 60, (t - 12.8) / 2.2), lerp(60, 20, (t - 12.8) / 2.2)), at: () => V(0, 0, 82), fov: 52, push: 1.0, drift: [0, 0] });
}
// =================== RENDER ===================
const composer = makeComposer({ sat: 1.38, con: 1.16, bloom: 0.08 }); const SKY = makeSky();
const look = (t, cpos) => { SKY.update(cpos, false, composer.grade); sun.color.setHex(0xffd8a8); sun.intensity = 2.5; hemi.color.setHex(0xbfe0ff); hemi.groundColor.setHex(0xc89a6a); hemi.intensity = 0.55; const tg = sun.target.position; sun.position.copy(tg).add(V(-55, 45, 40)); };
const camOf = dynamicCam(CINE);
makeRenderer({ CINE, camOf, setup, fx, look, composer, DURATION, impacts: [2.1, T.clash, T.clash + 0.3, 12.15], flash: (t) => (t > T.clash && t < T.clash + 0.05 ? 0.4 : 0) });
(async () => { await sky('kloofendal_48d_partly_cloudy_puresky', { env: 0.8 }); build(); crowds(); camera(); await ready(); window.ready = true; })();
