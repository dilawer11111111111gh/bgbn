// NOIR "THE BOSS" (20 s) on the v8 engine: 3D rainy night street + Flat2D cast + mocap + Cine camera. Cartoon action, no blood.
import * as THREE from 'three';
import { R, scene, cam, sun, hemi, V, std, mesh, sky, ready, Burst, PT, makeComposer } from '../../web/realkit.js';
import { Cine } from '../../web/cine.js';
import { Flat2D } from '../../web/flat2d.js';
import { loadMo, mo } from '../../web/mocap.js';
import { sstep, clamp, lerp } from '../../web/motion.js';
import { installActing, keys, faceK, makeSky, dynamicCam, makeRenderer } from '../../web/studio.js';
import { Batch, house, lampPost, texMat, plain, boxUV } from '../../web/world3d.js';
export const DURATION = 20;
installActing();
// =================== WORLD: street runs along z; houses on x = ±9; camera usually looks toward -z ===================
let LAMPS = [], RAIN, CAR, CRATES, HAT3D, TITLE, FLASHL, THUNDER;
function build() { const B = new Batch();
  const road = mesh(new THREE.PlaneGeometry(14, 140), (() => { const m = texMat('cobble', '#6a6a6e', { r: 0.25 }).clone(); m.roughness = 0.22; m.metalness = 0.35; return m; })()); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.001, -30); road.receiveShadow = true; scene.add(road);
  for (const s of [-1, 1]) { const sw = mesh(boxUV(3, 0.18, 140, 2), texMat('tiles', '#8a8a8a', { r: 0.4 }), s * 8.5, 0.09, -30); sw.receiveShadow = true; scene.add(sw); }
  for (let i = 0; i < 12; i++) for (const s of [-1, 1]) { const z = 10 - i * 11, gap = s > 0 && i === 3; if (gap) continue;
    house(B, s * 15, z, s > 0 ? -Math.PI / 2 : Math.PI / 2, { w: 10.5, d: 10, h: 9 + ((i * 7 + (s > 0 ? 3 : 0)) % 5) * 1.6, kind: i % 3 ? 'brick' : 'plaster', wall: '#8a8a88', roof: '#3a3a3c', shutter: '#2a2a2a', door: '#1a1a1a', flowers: false, seed: i * 2 + (s > 0 ? 1 : 0) }); }
  for (let i = 0; i < 7; i++) for (const s of [-1, 1]) { const z = 4 - i * 12 + (s > 0 ? 6 : 0); lampPost(B, s * 7.4, z, 4.4); const L = new THREE.PointLight(0xffe2b0, 14, 16, 1.6); L.position.set(s * 7.0, 4.2, z); scene.add(L); LAMPS.push(L);
    const bulb = mesh(new THREE.SphereGeometry(0.22, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff4d8, toneMapped: false }), s * 7.0, 4.25, z, false); scene.add(bulb); }
  B.flush();
  // 1940s sedan (rounded extruded body, glass, chrome, white-wall tyres)
  CAR = new THREE.Group(); { const sh = new THREE.Shape(); sh.moveTo(-2.5, 0.35); sh.quadraticCurveTo(-2.6, 0.95, -2.1, 1.0); sh.quadraticCurveTo(-1.5, 1.65, -0.4, 1.68); sh.quadraticCurveTo(0.6, 1.68, 1.05, 1.05); sh.quadraticCurveTo(2.35, 1.0, 2.55, 0.62); sh.lineTo(2.55, 0.35); sh.closePath();
    const body = mesh(new THREE.ExtrudeGeometry(sh, { depth: 1.8, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 4, curveSegments: 18 }), new THREE.MeshPhysicalMaterial({ color: 0x141416, roughness: 0.18, metalness: 0.6, clearcoat: 1, clearcoatRoughness: 0.08 })); body.position.z = -0.9; CAR.add(body);
    const glass = new THREE.MeshPhysicalMaterial({ color: 0x8890a0, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.55 }); for (const s of [-1, 1]) { const w = mesh(new THREE.PlaneGeometry(1.6, 0.48), glass, -0.45, 1.33, s * 1.03); w.rotation.y = s > 0 ? 0 : Math.PI; CAR.add(w); }
    const chrome = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.08, metalness: 1 }); CAR.add(mesh(new THREE.BoxGeometry(5.1, 0.12, 2.1), chrome, 0, 0.42, 0)); for (const s of [-1, 1]) CAR.add(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.1, 18), new THREE.MeshBasicMaterial({ color: 0xfff6dc, toneMapped: false }), 2.55, 0.85, s * 0.62).rotateZ(Math.PI / 2));
    for (const [x, z] of [[-1.6, 1], [1.6, 1], [-1.6, -1], [1.6, -1]]) { const tyre = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 24), std(0x0c0c0c, { r: 0.8 }), x, 0.42, z); tyre.rotation.x = Math.PI / 2; CAR.add(tyre); const ww = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.34, 24), std(0xe8e8e8, { r: 0.5 }), x, 0.42, z); ww.rotation.x = Math.PI / 2; CAR.add(ww); } }
  CAR.rotation.y = Math.PI / 2; CAR.position.set(-4.4, 0, -2.4); scene.add(CAR);
  CRATES = new THREE.Group(); for (const [x, y, z, s] of [[0, 0.5, 0, 1], [1.05, 0.5, 0.1, 1], [0.5, 1.5, 0, 1], [-0.9, 0.4, 0.3, 0.8]]) { const c = mesh(boxUV(s, s, s, 1), texMat('planks', '#8a7a6a', { r: 0.8 }), x, y * s, z); c.rotation.y = x * 0.2; CRATES.add(c); } CRATES.position.set(-0.6, 0, -12.6); scene.add(CRATES);
  // rain: line streaks in a box that follows the camera
  { const N = 2600, pos = new Float32Array(N * 6); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); RAIN = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.32, toneMapped: false })); RAIN.frustumCulled = false; scene.add(RAIN); RAIN.userData.seed = Array.from({ length: N }, (_, i) => [Math.random(), Math.random(), Math.random()]); }
  // 3D fedora that flies off the rival
  HAT3D = new THREE.Group(); { const m = std(0xe0e0e0, { r: 0.6 }); HAT3D.add(mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.16, 20), m, 0, 0.08, 0)); HAT3D.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.02, 28), m, 0, 0.0, 0)); HAT3D.add(mesh(new THREE.CylinderGeometry(0.172, 0.172, 0.05, 20), std(0x1a1a1a), 0, 0.04, 0)); } HAT3D.visible = false; scene.add(HAT3D);
  FLASHL = new THREE.PointLight(0xfff0c8, 0, 12, 1.5); scene.add(FLASHL); THUNDER = new THREE.DirectionalLight(0xe8f0ff, 0); THUNDER.position.set(-10, 40, 10); scene.add(THUNDER);
  // title card on the camera
  { const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const q = c.getContext('2d'); q.textAlign = 'center'; q.fillStyle = '#f2f0ea'; q.shadowColor = 'rgba(0,0,0,0.9)'; q.shadowBlur = 24; q.font = 'bold 170px "DejaVu Serif", serif'; q.fillText('THE BOSS', 512, 230); q.font = 'italic 54px "DejaVu Serif", serif'; q.fillText('— never misses —', 512, 330);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; TITLE = mesh(new THREE.PlaneGeometry(0.36, 0.18), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthTest: false, toneMapped: false }), 0, 0.22, -1.2, false); TITLE.renderOrder = 99; scene.add(cam); cam.add(TITLE); }
}
// =================== CAST ===================
const BOSS = new Flat2D({ body: 'coat', coat: '#5c5c60', tie: '#121212', collar: '#f0f0f0', hat: 'fedora', hatCol: '#1a1a1a', band: '#a0a0a0', hair: '#141010', hairStyle: 'side', pants: { col: '#3a3a3e', len: 'ankle' }, socks: '#dcdcdc', size: 1.95, res: 2.2, wide: true, headroom: 400, seed: 5, rest: 'pockets', scene });
const RIVAL = new Flat2D({ body: 'coat', coat: '#2a2a2e', tie: '#cfcfcf', collar: '#dddddd', hat: 'fedora', hatCol: '#e2e2e2', band: '#151515', hair: '#151010', hairStyle: 'side', mustache: true, pants: { col: '#1c1c20', len: 'ankle' }, socks: '#7a7a7a', width: 1.3, size: 1.9, res: 2.2, wide: true, headroom: 400, seed: 9, scene });
const PEOPLE = [BOSS, RIVAL]; const hide = (c) => { c.mesh.visible = false; if (c.shadow) c.shadow.visible = false; };
const AIM = { armR: [92, -4] }, AIMUP = { armR: [150, -10] }, POCK = { armL: [16, -32], armR: [16, -32] };
// gunfire FX
const BURSTS = {}; const spark = (k) => (BURSTS['s' + k] ||= new Burst({ n: 26, dur: 0.04, life: 0.45, speed: [3, 8], dir: [0, 0.4, 1], spread: 1.0, g: -12, size: [0.05, 0.14], tex: 'spark', add: true, seed: k }));
const smoke = (k) => (BURSTS['m' + k] ||= new Burst({ n: 10, dur: 0.3, life: 1.4, speed: [0.2, 0.6], dir: [0, 1, 0], spread: 0.6, g: 0.4, size: [0.05, 0.11], grow: 1.4, tex: 'smoke', opacity: 0.28, seed: k + 50 }));
const shell = (k) => (BURSTS['c' + k] ||= new Burst({ n: 1, dur: 0.01, life: 0.8, speed: [2.5, 3], dir: [-0.6, 1, 0.3], spread: 0.1, g: -14, size: [0.05, 0.05], tex: 'spark', seed: k + 90 }));
const FLASHES = []; const flashSprite = () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: PT.star, color: 0xfff6dc, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); s.renderOrder = 20; s.visible = false; scene.add(s); return s; };
const TRACERS = []; const tracer = () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 6), new THREE.MeshBasicMaterial({ color: 0xfffbe8, transparent: true, opacity: 0.9, toneMapped: false })); m.visible = false; scene.add(m); return m; };
for (let i = 0; i < 3; i++) { FLASHES.push(flashSprite()); TRACERS.push(tracer()); }
function fire(i, t, t0, from, to) { const d = t - t0, F = FLASHES[i], T = TRACERS[i]; F.visible = d >= 0 && d < 0.07; if (F.visible) { F.position.copy(from); const s = 0.32 * (1 - d / 0.07) + 0.2; F.scale.set(s, s, s); F.material.rotation = t0 * 7; FLASHL.position.copy(from); FLASHL.intensity = Math.max(FLASHL.intensity, 40 * (1 - d / 0.07)); }
  const u = d / 0.1; T.visible = u > 0 && u < 1; if (T.visible) { const a = from.clone().lerp(to, Math.max(0, u - 0.35)), b = from.clone().lerp(to, u); T.position.copy(a).add(b).multiplyScalar(0.5); T.scale.set(1, a.distanceTo(b), 1); T.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); }
  spark(Math.round(t0 * 100)).update(t, t0 + 0.1, to); }
const BOSS_SHOTS = [7.45, 8.0, 8.75, 9.7, 10.6, 12.1, 12.55], RIVAL_SHOTS = [8.3, 9.15, 10.15, 11.0];
window.SFX = { boss: BOSS_SHOTS, rival: RIVAL_SHOTS, thunder: [2.4, 3.75], steps: [0.3, 0.75, 1.2, 1.65, 2.1, 2.55, 3.0, 18.7, 19.15, 19.6], draw: [6.4, 15.6, 17.6], hat: 13.8, glass: 10.2, title: 18.8, run: 14.4 };
const muzzle = (C, spin = 0) => { const h = C.handR; if (!h) return C.pos.clone(); const hd = Object.assign([...h], { ang: (h.ang || 0) + spin }); return C.toWorld(C.propPt(hd, -14, 92)); };
// swagger walk in profile: slow, shoulders rolling, leaning back, head sway, one hand in the pocket
function swag(t, per = 1.05, amp = 1) { const ph = (t / per) * Math.PI * 2, s = Math.sin(ph), c = Math.cos(ph);
  return { legL: [24 * s * amp, Math.max(0, -c) * 34 * amp], legR: [-24 * s * amp, Math.max(0, c) * 34 * amp], armL: [16, -32], armR: [22 - 18 * s, 14 + 10 * s], bob: -9 * Math.abs(s), lean: -6, tilt: 5 * s, hip: 10 * s, sway: 3 * s, headLag: 4 * c }; }
let BULLET, BLIGHT, MAG; { BULLET = new THREE.Group(); BULLET.add(mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.05, 12), new THREE.MeshBasicMaterial({ color: 0xfff2c0, toneMapped: false }), 0, 0, 0, false));
  const tr = mesh(new THREE.CylinderGeometry(0.004, 0.022, 1.6, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false }), 0, -0.82, 0, false); BULLET.add(tr);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: PT.spark, color: 0xfff6dc, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); glow.scale.set(0.035, 0.035, 0.035); BULLET.add(glow);
  BULLET.scale.setScalar(2.6); BULLET.visible = false; scene.add(BULLET); BLIGHT = new THREE.PointLight(0xfff0c8, 0, 3, 1.5); scene.add(BLIGHT);
  MAG = mesh(new THREE.BoxGeometry(0.03, 0.11, 0.02), new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.8, roughness: 0.3 }), 0, 0, 0, false); MAG.visible = false; scene.add(MAG); }
const STOP = -7.2, P_BOSS = (t) => V(0, 0, lerp(-9.6, STOP, clamp(t / 2.0, 0, 1))), RIV = V(0.6, 0, -14.8), HATP = V(0.6, 1.98, -14.8);
const T_MAG = 5.55, T_RACK = 6.15, T_SPIN = [6.3, 6.95], T_SHOT1 = 8.2, T_HIT = 9.9, RIV_SHOTS = [12.3, 12.75], BOSS2 = [13.9, 14.35];
window.SFX = { boss: [T_SHOT1, ...BOSS2], rival: RIV_SHOTS, thunder: [1.5], steps: [0.2, 0.75, 1.3, 1.85], draw: [4.0, 4.75, T_MAG, T_RACK, 17.0], spin: T_SPIN[0], hat: T_HIT, title: 18.6, run: 14.7, bulletTime: 8.45 };
const AIMT = { armR: [92, -4], armL: [16, -32] };
// =================== ACTING (per shot) ===================
function setup(t, camPos) { Flat2D.T = t; Flat2D.E = 0; Flat2D.ON = 0; for (const c of PEOPLE) hide(c); HAT3D.visible = false; BULLET.visible = false; MAG.visible = false; BLIGHT.intensity = 0; FLASHL.intensity = 0; FLASHES.forEach((f) => (f.visible = false)); TRACERS.forEach((x) => (x.visible = false)); for (const b of Object.values(BURSTS)) b.update(t, -99, V(), 0, false);
  const lightning = (t0) => (t > t0 && t < t0 + 0.32 ? (t < t0 + 0.05 || (t > t0 + 0.13 && t < t0 + 0.19) ? 6 : 1.2) : 0); THUNDER.intensity = lightning(1.5);
  CRATES.visible = false; const B = BOSS, Rv = RIVAL; RIVAL.o.hat = t >= T_HIT ? null : 'fedora'; const bp = P_BOSS(t); B.place(bp.x, 0, bp.z); Rv.place(RIV.x, 0, RIV.z);
  const rivIdle = (face) => Rv.update({ e: 0.8, ...AIMT, armL: [40, -110], prop: 'pistol', propFront: true, side: 1, turn: -1, face, noBlink: true }, camPos);
  // 0 - 2.0 hero walk toward a camera at his feet (front view)
  if (t < 2.0) B.update({ e: 0.6, ...mo('17_06f', t, { t0: 0, from: 0.4, amp: 1.1, root: 0 }), armL: [16, -32], lean: -4, face: faceK(t, [[0, { eyes: 'lid', lid: 0.5, mouth: 'smirk1', brow: -0.7, look: [0, -0.4] }], [1.5, { eyes: 'lid', lid: 0.35, mouth: 'line', brow: -0.9, look: [0, -0.5] }]]), noBlink: true, noIdle: true }, camPos);
  // 2.0 - 3.3 close-up stare; eyes slide back over his shoulder
  else if (t < 3.3) B.update({ e: 1, armL: [16, -32], armR: [16, -32], ...keys(t, [[2.0, { tilt: 0 }], [2.7, { tilt: -7 }, 0.3]]), face: faceK(t, [[2.0, { eyes: 'lid', lid: 0.35, mouth: 'line', brow: -0.8, look: [0, 0] }], [2.65, { eyes: 'lid', lid: 0.45, mouth: 'smirk1', brow: -0.9, look: [-1, 0.1] }]]), noBlink: true, noIdle: true }, camPos);
  // 3.3 - 4.6 the rival steps out under the far lamp and draws (boss's back in the foreground)
  else if (t < 4.6) { B.update({ e: 0.5, armL: [16, -32], armR: [16, -32], face: 'deadpan', noIdle: true }, camPos);
    Rv.update({ e: 1, ...keys(t, [[3.3, { armR: [16, -32], armL: [16, -32] }], [3.9, { armR: [150, -20], armL: [40, -110], lean: -6, hop: 6 }, 0.12, 'back'], [4.25, { ...AIMT, armL: [40, -110], lean: 4 }, 0.16, 'back']]), prop: t > 3.85 ? 'pistol' : null, propFront: true, side: 1, turn: -1, face: faceK(t, [[3.3, 'smug'], [3.9, { eyes: 'lid', lid: 0.3, mouth: 'psycho', brow: -0.9, look: [-1, 0] }]]) }, camPos); }
  // 4.6 - 7.0 loads the gun: pistol out, magazine in (click), racks the slide (click), spins it
  else if (t < 7.0) { const spin = t > T_SPIN[0] && t < T_SPIN[1] ? sstep(T_SPIN[0], T_SPIN[1], t) * 1080 : 0;
    const k = keys(t, [[4.6, { armR: [16, -32], armL: [16, -32] }], [4.75, { armR: [70, -60], armL: [16, -32], tilt: 3 }, 0.14, 'back'], [5.1, { armR: [70, -60], armL: [40, 40], tilt: 4 }, 0.16], [T_MAG, { armR: [70, -60], armL: [62, -30], tilt: -3, hop: 3 }, 0.1, 'in'], [5.8, { armR: [70, -60], armL: [62, -62], tilt: 0 }, 0.12],
      [T_RACK, { armR: [70, -60], armL: [40, -20], tilt: -5, hop: 4 }, 0.08, 'in'], [6.3, { armR: [80, -40], armL: [16, -32], tilt: 2 }, 0.14, 'back']]);
    B.update({ e: 1, ...k, prop: 'pistol', propFront: true, propSpin: spin, face: faceK(t, [[4.6, { eyes: 'lid', lid: 0.45, mouth: 'line', brow: -0.7, look: [0.4, 0.5] }], [T_MAG, { eyes: 'lid', lid: 0.5, mouth: 'smirk1', brow: -0.8, look: [0.4, 0.5] }], [T_SPIN[0], { eyes: 'lid', lid: 0.55, mouth: 'smirk1', browL: 0.6, browR: -0.8, look: [0, 0] }]]), noBlink: true, noIdle: true }, camPos);
    if (t > 5.05 && t < T_MAG + 0.05 && B.handL) { MAG.visible = true; MAG.position.copy(B.toWorld(B.handL)).add(V(0, 0.04, 0.03)); MAG.rotation.set(0, 0, 0.2); } }
  // 7.0 - 8.45 TWO-SHOT over the boss's shoulder: aims level at the rival in the distance, fires
  else if (t < 8.45) { const k = keys(t, [[7.0, { ...AIMT, lean: -4 }], [T_SHOT1, { ...AIMT, lean: -10, tilt: -6, hop: 2 }, 0.05], [T_SHOT1 + 0.08, { ...AIMT, lean: -4 }, 0.16, 'back']]);
    B.update({ e: 1, ...k, prop: 'pistol', propFront: true, side: 1, turn: 1, face: { eyes: 'lid', lid: 0.4, mouth: 'smirk1', brow: -1.0, look: [1, 0] }, noBlink: true, noIdle: true }, camPos); rivIdle({ eyes: 'lid', lid: 0.3, mouth: 'psycho', brow: -0.9, look: [-1, 0] });
    const m = muzzle(B); fire(0, t, T_SHOT1, m, m.clone().add(V(0, 0, -0.5))); smoke(821).update(t, T_SHOT1, m); }
  // 8.45 - T_HIT bullet time: camera behind the glowing bullet, the rival grows ahead, the bullet hits his hat
  else if (t < T_HIT + 0.12) { const from = V(0.2, 1.62, STOP - 0.6), to = HATP.clone().add(V(0, 0.06, 0.12)), u = clamp((t - 8.45) / (T_HIT - 8.45), 0, 1); BULLET.visible = t < T_HIT; BULLET.position.copy(from.clone().lerp(to, u)); BULLET.quaternion.setFromUnitVectors(V(0, 1, 0), to.clone().sub(from).normalize()); BLIGHT.position.copy(BULLET.position); BLIGHT.intensity = 1.2;
    rivIdle(t < T_HIT ? { eyes: 'wide', mouth: 'smallO', brow: 1.0, look: [-1, 0] } : { eyes: 'tiny', mouth: 'scream', brow: 1.5 }); if (t > T_HIT) { HAT3D.visible = true; HAT3D.position.copy(HATP); } spark(990).update(t, T_HIT, HATP); }
  // T_HIT - 12.0 slow-mo: the hat spins away, the rival's face drops
  else if (t < 12.0) { const v = t - T_HIT; HAT3D.visible = true; HAT3D.position.set(HATP.x, HATP.y + v * 1.5 - 1.1 * v * v, HATP.z - v * 0.5); HAT3D.rotation.set(v * 3, v * 2, v * 4);
    Rv.update({ e: 1, ...keys(t, [[T_HIT, { ...AIMT, armL: [40, -110] }], [10.9, { armR: [150, 30], armL: [150, 30], hop: 10, lean: -6 }, 0.12, 'back']]), prop: 'pistol', propFront: true, side: 1, turn: -1, face: faceK(t, [[T_HIT, { eyes: 'tiny', mouth: 'smallO', brow: 1.4, look: [0, -1] }], [10.9, { eyes: 'wide', mouth: 'scream', brow: 1.5 }]]), sweat: true, noBlink: true }, camPos); }
  // 12.0 - 13.4 REVERSE TWO-SHOT over the rival: he fires wildly, the boss stands calm in the distance
  else if (t < 13.4) { Rv.update({ e: 1, ...AIMT, armL: [40, -110], lean: 6, tilt: 6 * Math.sin(t * 30), prop: 'pistol', propFront: true, side: 1, turn: -1, face: { eyes: 'wide', mouth: 'grimace', brow: 1.2 }, sweat: true }, camPos);
    B.update({ e: 0.6, armL: [16, -32], armR: [16, -32], prop: 'pistol', propFront: true, side: 1, turn: 1, face: { eyes: 'lid', lid: 0.55, mouth: 'smirk1', brow: -0.4 }, noBlink: true, noIdle: true }, camPos);
    const m = muzzle(Rv); RIV_SHOTS.forEach((h, i) => fire(2, t, h, m, bp.clone().add(V(-1.3 + i * 2.4, 1.2 + i * 0.6, 0.8)))); RIV_SHOTS.forEach((h, i) => spark(1200 + i).update(t, h + 0.1, bp.clone().add(V(-1.3 + i * 2.4, 1.2 + i * 0.6, 0.8)))); }
  // 13.4 - 14.6 two level shots knock the gun out of the rival's hand
  else if (t < 14.6) { const k = keys(t, [[13.4, { ...AIMT, lean: -4 }], [BOSS2[0], { ...AIMT, lean: -10, tilt: -6 }, 0.05], [BOSS2[0] + 0.08, { ...AIMT, lean: -4 }, 0.15, 'back'], [BOSS2[1], { ...AIMT, lean: -10, tilt: -6 }, 0.05], [BOSS2[1] + 0.08, { ...AIMT, lean: -4 }, 0.15, 'back']]);
    B.update({ e: 1, ...k, prop: 'pistol', propFront: true, side: 1, turn: 1, face: { eyes: 'lid', lid: 0.35, mouth: 'grin', brow: -1.0, look: [1, 0] }, noBlink: true, noIdle: true }, camPos); const m = muzzle(B); for (const h of BOSS2) { fire(0, t, h, m, m.clone().add(V(0, 0, -0.5))); smoke(h * 10).update(t, h, m); shell(h * 10).update(t, h, m); } }
  // 14.6 - 15.6 gun flies out of his hand; he runs
  else if (t < 15.6) { const run = sstep(14.8, 15.6, t); Rv.place(RIV.x, 0, RIV.z - run * 4); Rv.update({ e: 1, ...(run > 0 ? swag(t * 2.2, 1, 1.6) : { armR: [150, 30], armL: [150, 30] }), lean: run > 0 ? 10 : 0, side: 1, turn: 1, face: { eyes: 'tiny', mouth: 'scream', brow: 1.4 }, tears: true }, camPos); spark(1460).update(t, 14.6, V(RIV.x - 0.3, 1.3, RIV.z + 0.3)); }
  // 15.6 - 18.2 smoke, spin into the holster, tip the hat (front close-up)
  else if (t < 18.2) { const k = keys(t, [[15.6, { armR: [150, -120], armL: [16, -32], tilt: -4 }], [16.5, { armR: [60, -60], armL: [16, -32], tilt: 0 }, 0.2], [17.0, { armR: [16, -32], armL: [16, -32] }, 0.2], [17.4, { armR: [160, -150], armL: [16, -32], tilt: -8, hop: 4 }, 0.16, 'back'], [17.85, { armR: [16, -32], armL: [16, -32], tilt: 0 }, 0.2]]);
    const spin = t > 16.5 && t < 17.0 ? sstep(16.5, 16.95, t) * 720 : 0; B.update({ e: 1, ...k, prop: t < 17.0 ? 'pistol' : null, propFront: true, propSpin: spin, face: faceK(t, [[15.6, { eyes: 'lid', lid: 0.5, mouth: 'smallO', brow: -0.4, look: [0.6, -0.6] }], [16.3, { eyes: 'lid', lid: 0.55, lidL: 0.1, mouth: 'smirk1', browL: 0.7, browR: -0.6 }], [17.4, { eyes: 'closed', mouth: 'smirk1', brow: 0.2 }]]), noBlink: true, noIdle: true }, camPos);
    if (t < 16.5) smoke(1560).update(t, 15.6, () => muzzle(B), 0.5); }
  // 18.2 - 20 swaggers away (low angle, profile)
  else { const z = lerp(STOP, -10.5, (t - 18.2) / 1.8); B.place(0, 0, z); B.update({ e: 0.5, ...swag(t), side: 1, turn: 1, face: { eyes: 'lid', lid: 0.5, mouth: 'smirk1', brow: -0.5, look: [0.6, 0] }, noBlink: true, noIdle: true }, camPos); }
  TITLE.visible = t > 18.5; TITLE.material.opacity = sstep(18.5, 19.0, t) * (1 - sstep(19.75, 20, t));
}
function fx(t) { const P = RAIN.geometry.attributes.position.array, S = RAIN.userData.seed, c = cam.position; const slow = t > 8.45 && t < 12.0 ? 0.12 : 1; const tt = t < 8.45 ? t : t < 12.0 ? 8.45 + (t - 8.45) * 0.12 : t - 3.55 * 0.88; for (let i = 0; i < S.length; i++) { const [a, b, h] = S[i]; const x = c.x + (a - 0.5) * 16, z = c.z - 1 - b * 14, y = c.y + 6 - ((tt * 9 + h * 12) % 12); P[i * 6] = x; P[i * 6 + 1] = y; P[i * 6 + 2] = z; P[i * 6 + 3] = x + 0.03; P[i * 6 + 4] = y - 0.45 * slow - 0.03; P[i * 6 + 5] = z; } RAIN.geometry.attributes.position.needsUpdate = true; }
// =================== CAMERA ===================
const CINE = new Cine(); const shot = (a, b, s) => CINE.shot(a, b, s);
const bH = (dy = 0) => () => BOSS.headWorld().add(V(0, dy, 0)), rH = (dy = 0) => () => RIVAL.headWorld().add(V(0, dy, 0));
function camera() {
  shot(0, 2.0, { rig: 'pov', from: (t) => V(0.3, 0.14, lerp(-6.0, -5.7, t / 2)), at: (t) => P_BOSS(t).add(V(0, 1.55, 0)), fov: 50, push: 1.0, drift: [0, 0] });
  shot(2.0, 3.3, { rig: 'push', at: bH(0.05), size: 1.2, az: 6, el: -4, fov: 30, push: 1.15, zoomK: [[2.65, 1.18, 0.1]] });
  shot(3.3, 4.6, { rig: 'pov', from: () => V(0.9, 1.5, STOP + 1.6), at: () => RIV.clone().add(V(-0.2, 1.3, 0)), fov: 30, push: 1.0, drift: [0, 0], zoomK: [[3.9, 1.4, 0.12]] });
  shot(4.6, 7.0, { rig: 'push', at: () => P_BOSS(5).add(V(0.15, 1.3, 0)), size: 1.5, az: 4, el: -6, fov: 30, push: 1.12, zoomK: [[T_MAG, 1.12, 0.06], [T_RACK, 1.25, 0.06]] });
  shot(7.0, 8.45, { rig: 'pov', from: () => V(0.32, 1.72, STOP + 1.5), at: () => V(0.45, 1.3, -12.5), fov: 50, push: 1.0, drift: [0, 0], zoomK: [[T_SHOT1, 1.12, 0.05]] });
  shot(8.45, T_HIT + 0.12, { rig: 'pov', from: () => BULLET.position.clone().add(V(0.06, 0.07, 0.55)), at: () => HATP.clone().add(V(0, -0.15, 0)), fov: 40, push: 1.0, drift: [0, 0] });
  shot(T_HIT + 0.12, 12.0, { rig: 'push', at: () => RIV.clone().add(V(0, 1.7, 0)), size: 2.6, az: 80, el: 4, fov: 32, push: 1.15 });
  shot(12.0, 13.4, { rig: 'pov', from: () => V(0.95, 1.65, RIV.z - 1.5), at: () => V(0.0, 1.3, STOP), fov: 50, push: 1.0, drift: [0, 0] });
  shot(13.4, 14.6, { rig: 'push', at: () => P_BOSS(14).add(V(0.3, 1.25, -0.3)), size: 2.0, az: 62, el: -14, fov: 32, push: 1.15, zoomK: [[BOSS2[0], 1.15, 0.05], [BOSS2[1], 1.3, 0.05]] });
  shot(14.6, 15.6, { rig: 'push', at: (t) => RIV.clone().add(V(0, 1.2, -sstep(14.8, 15.6, t) * 3)), size: 3.0, az: 80, el: 2, fov: 34, push: 1.05 });
  shot(15.6, 18.2, { rig: 'push', at: bH(-0.15), size: 1.4, az: -12, el: -6, fov: 30, push: 1.12 });
  shot(18.2, 20, { rig: 'pov', from: (t) => V(2.6, 0.25, lerp(STOP, -10.5, (t - 18.2) / 1.8) + 1.4), at: (t) => V(0, 1.4, lerp(STOP, -10.5, (t - 18.2) / 1.8) - 0.6), fov: 42, push: 1.0, drift: [0, 0] });
}

// =================== RENDER ===================
const composer = makeComposer({ sat: 0.0, con: 1.32, bloom: 0.3 }); const SKY = makeSky();
const look = (t, cpos) => { SKY.update(cpos, true, composer.grade); hemi.intensity = 0.25; hemi.color.setHex(0xc8c8c8); sun.intensity = 0.35; sun.color.setHex(0xd8d8d8); const tg = sun.target.position; sun.position.copy(tg).add(V(-12, 30, 14)); };
const camOf = dynamicCam(CINE);
makeRenderer({ CINE, camOf, setup, fx, look, composer, DURATION, impacts: [T_SHOT1, ...BOSS2, ...RIV_SHOTS, T_HIT], flash: (t) => (t > 1.5 && t < 1.56 ? 0.35 : 0) });
(async () => { await loadMo(['17_03', '17_06f'], './mocap'); await sky('kloofendal_48d_partly_cloudy_puresky', { env: 0.25 }); build(); camera(); await ready(); window.ready = true; })();

