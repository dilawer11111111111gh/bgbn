// NOIR 2 (Studio v9.2, 20 s): history + today in one story. 1947 (black & white, rain, gas lamps): a detective meets the
// boss with a stolen diamond, the gang closes in, lightning, the boss escapes and the diamond falls into a drain.
// 79 years later (still black & white noir, rainy modern street): his grandson finds it, the new boss wants it, sirens — busted.
// Every person comes from castgen (unique each seed), every actor uses perform() (hyper energy), every beat a camkit move.
import * as THREE from 'three';
import { scene, cam, V, sky, ready, makeComposer, mesh } from '../../web/realkit.js';
import { Cine } from '../../web/cine.js';
import { Flat2D } from '../../web/flat2d.js';
import { clamp, lerp } from '../../web/motion.js';
import { installActing, makeSky, dynamicCam, makeRenderer } from '../../web/studio.js';
import { makeAtlas, Crowd, grid, blob } from '../../web/crowd.js';
import { realCity } from '../../web/city2.js';
import { realCar } from '../../web/cars.js';
import { perform } from '../../web/actor.js';
import { camkit } from '../../web/camkit.js';
import { makeCharacter, crowdVariants } from '../../web/castgen.js';
import { applyNoir, rain, oldNoirStreet, sedan40s, gem, lightning } from '../../web/noirkit.js';
export const DURATION = 20;
installActing();
const X0 = -400, JUMP = 9.0;   // old town lives at x = -400; today's city at x = 0
const C = { res: 2.2, wide: true, headroom: 420, scene };
const oDET = makeCharacter({ era: 'noir', role: 'detective', seed: 7 }), oBOSS = makeCharacter({ era: 'noir', role: 'boss', seed: 21 });
const oKID = { ...makeCharacter({ era: 'today', role: 'student', seed: 33 }), hat: 'fedora', hatCol: oDET.hatCol, skin: oDET.skin, hair: oDET.hair }, oNEW = { ...makeCharacter({ era: 'today', role: 'office', seed: 48 }), body: 'suit', coat: '#1a1a22', tie: '#c8281a', scar: true, mustache: 'pencil', hairStyle: 'swept', hair: '#141018' }, oCOP = makeCharacter({ era: 'today', role: 'police', seed: 55 });
const DET = new Flat2D({ ...oDET, ...C, prop: null }), BOSS = new Flat2D({ ...oBOSS, ...C }), KID = new Flat2D({ ...oKID, ...C, prop: null }), NEW = new Flat2D({ ...oNEW, ...C }), COP = new Flat2D({ ...oCOP, ...C });
const CAST = [DET, BOSS, KID, NEW, COP];
const P = { DET: V(X0 + 6.0, 0, -15.2), BOSS: V(X0 + 3.6, 0, -17.0), KID: V(7.9, 0.18, -22.6), NEW: (t) => V(lerp(11.5, 9.6, clamp((t - 13.4) / 0.8, 0, 1)), 0.18, lerp(-29, -25.6, clamp((t - 13.4) / 0.8, 0, 1))), COP: V(6.0, 0, -27.4) };
const DRAIN_OLD = V(X0 + 5.6, 0.03, -12.6), DRAIN_NEW = V(6.6, 0.02, -24.2);
let RAIN, CAR, POLICE, POL_L = [], GEM, GANG, COPS, FANS, CAP, capCtx, capTex;
function drain(p) { const g = new THREE.Group(); g.add(mesh(new THREE.BoxGeometry(0.9, 0.04, 0.6), new THREE.MeshStandardMaterial({ color: 0x1a1a1c, metalness: 0.8, roughness: 0.4 }), 0, 0, 0)); for (let k = -3; k <= 3; k++) g.add(mesh(new THREE.BoxGeometry(0.06, 0.05, 0.5), new THREE.MeshStandardMaterial({ color: 0x4a4a50, metalness: 0.9, roughness: 0.3 }), k * 0.11, 0.02, 0)); g.position.copy(p); scene.add(g); }
function build() {
  oldNoirStreet({ x: X0, z0: 10, len: 130, lights: 5 });
  realCity({ z0: 0, len: 160, cars: 8, parked: 6, night: true, lampLights: 5 });
  CAR = sedan40s(0x141416); POLICE = realCar('#1a2a4a', { type: 'sedan', lights: true }); scene.add(POLICE);
  for (const [i, c] of [[0, 0xff2a2a], [1, 0x2a6aff]]) { const l = mesh(new THREE.BoxGeometry(0.3, 0.14, 0.5), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 3 }), -0.3, 1.55, (i ? 1 : -1) * 0.3, false); POLICE.add(l); POL_L.push(l); }
  drain(DRAIN_OLD); drain(DRAIN_NEW); GEM = gem(0xbfe8ff, 0.16);
  RAIN = rain(2600);
  const gV = crowdVariants('noir', 12, 3, ['gangster']); const gF = [{ armL: [16, -32], armR: [20, 10] }, { armL: [16, -32], armR: [92, -4], prop: 'pistol', propHand: 'R', face: { eyes: 'lid', lid: 0.4, lidTilt: -0.3, mouth: 'smirk1', brow: -0.9 } }, { armL: [130, -150], armR: [130, -150], face: { eyes: 'tiny', mouth: 'scream', brow: 1.4 } }];
  GANG = new Crowd(makeAtlas(gV, gF), grid(X0 + 1.5, -21.5, 6, 3, 1.2, 1.1, 0.35, 5), { seed: 5 });
  const cV = crowdVariants('today', 8, 9, ['police']); const cF = [{ armL: [16, -32], armR: [20, 10] }, { armL: [70, -60], armR: [92, -4], face: { eyes: 'lid', lid: 0.3, mouth: 'flat', brow: -0.8 } }, { armL: [155, 20], armR: [155, 20], face: { eyes: 'happy', mouth: 'laugh' } }];
  COPS = new Crowd(makeAtlas(cV, cF), grid(3.6, -30.5, 4, 2, 1.2, 1.0, 0.3, 8), { seed: 8 });
  const fV = crowdVariants('today', 18, 7); const fF = [{ armL: [16, -32], armR: [16, -32] }, { armL: [150, 20], armR: [150, 20], face: { eyes: 'happy', mouth: 'laugh' }, hop: 10 }, { armL: [35, -110], armR: [92, -4], face: { eyes: 'squeeze', mouth: 'laugh' } }];
  const side = []; for (let k = 0; k < 6; k++) side.push(...blob(10.6, -14 - k * 4, 1.4, 1.4, 4, k + 1)); FANS = new Crowd(makeAtlas(fV, fF), side.filter(({ x, z }) => Math.hypot(x - 7.9, z + 22.6) > 1.8 && Math.hypot(x - 9.6, z + 25.6) > 1.8), { seed: 11 });
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256; capCtx = c.getContext('2d'); capTex = new THREE.CanvasTexture(c); capTex.colorSpace = THREE.SRGBColorSpace;
  CAP = mesh(new THREE.PlaneGeometry(0.34, 0.085), new THREE.MeshBasicMaterial({ map: capTex, transparent: true, depthTest: false, toneMapped: false }), 0, -0.2, -1.0, false); CAP.renderOrder = 99; scene.add(cam); cam.add(CAP);
}
let capLast = ''; function caption(txt, old) { const key = txt + old; if (key === capLast) return; capLast = key; const g = capCtx; g.clearRect(0, 0, 1024, 256); if (txt) { let fs = 92; const font = '"DejaVu Serif", serif'; g.font = `bold ${fs}px ${font}`; while (g.measureText(txt).width > 960 && fs > 30) { fs -= 4; g.font = `bold ${fs}px ${font}`; } g.textAlign = 'center'; g.lineWidth = 16; g.strokeStyle = '#000'; g.fillStyle = '#f2f0ea'; g.strokeText(txt, 512, 150); g.fillText(txt, 512, 150); } capTex.needsUpdate = true; }
const CAPS = [[0, '1947. OLD TOWN.'], [1.2, `DETECTIVE ${oDET.name.toUpperCase()}`], [2.0, 'THE BOSS ARRIVED...'], [2.6, 'WITH A DEAL'], [3.8, 'THE STOLEN DIAMOND!'], [4.8, 'AND HIS GANG'], [6.0, ''], [6.6, 'HE GOT AWAY'], [7.4, 'CASE NEVER SOLVED'], [8.2, 'THE DIAMOND? LOST...'], [9.0, '79 YEARS LATER'], [10.2, `HIS GRANDSON, ${oKID.name.split(' ')[0].toUpperCase()}`], [11.0, "WAIT... WHAT'S THAT?"], [12.6, 'THE DIAMOND!'], [13.4, 'THE NEW BOSS WANTS IT'], [14.2, 'NOT TODAY.'], [15.0, 'SIRENS!'], [15.8, 'BUSTED!'], [16.6, 'CASE CLOSED!'], [17.6, '79 YEARS LATE.']];
const TR = {
  DET: [[0, 'cool'], [2.0, 'cool', { gestures: ['tipHat', 'crossArms'] }], [3.2, 'menace'], [3.8, 'shock'], [4.8, 'scared'], [5.5, 'sneaky'], [6.0, 'shock'], [6.6, 'angry'], [7.4, 'cry']],
  BOSS: [[0, 'evil'], [2.6, 'menace'], [3.4, 'evil', { gestures: ['rubHands', 'pointCool'] }], [4.8, 'cool'], [6.0, 'shock'], [6.6, 'laugh']],
  KID: [[0, 'cool'], [10.2, 'cool', { gestures: ['phoneEar', 'tipHat'] }], [11.0, 'think'], [11.8, 'shock'], [12.3, 'excited'], [13.4, 'scared'], [14.2, 'cool', { gestures: ['tipHat', 'crossArms', 'pointCool'] }], [15.8, 'laugh'], [16.6, 'victory']],
  NEW: [[0, 'menace'], [13.4, 'menace', { gestures: ['stabPoint', 'rubHands'] }], [14.2, 'angry'], [15.0, 'shock'], [15.8, 'scared'], [16.6, 'cry']],
  COP: [[0, 'determined'], [15.6, 'determined', { gestures: ['pointAhead', 'aimGun'] }], [16.6, 'happy']],
};
const hide = () => { for (const F of CAST) { F.mesh.visible = false; if (F.shadow) F.shadow.visible = false; } };
function act(F, p, tr, seed, t, camPos, extra = {}) { F.place(p.x, p.y, p.z); F.update({ ...perform(t, tr, seed), ...extra }, camPos); }
const carZ = (t) => t < 2.4 ? lerp(-60, -18.5, clamp((t - 1.4) / 1.0, 0, 1)) : t < 7.0 ? -18.5 : lerp(-18.5, -70, clamp((t - 7.0) / 1.2, 0, 1) ** 2);
const polZ = (t) => lerp(-70, -27.6, clamp((t - 14.9) / 0.9, 0, 1) ** 0.6);
function gemPos(t) { if (t >= 3.4 && t < 7.0) return P.BOSS.clone().add(V(0.5, 1.15, 0.45)); if (t >= 8.2 && t < 9.0) { const k = clamp((t - 8.25) / 0.45, 0, 1); return DRAIN_OLD.clone().add(V(0, 1.4 * (1 - k * k) - 0.2 * k, 0)); }
  if (t >= 10.9 && t < 12.9) return DRAIN_NEW.clone().add(V(0, 0.06, 0)); if (t >= 12.9 && t < 18.5) return P.KID.clone().add(V(0.45, 1.2, 0.45)); return null; }
function setup(t, camPos) { Flat2D.T = t; const old = t < JUMP; let cap = ''; for (const [a, s] of CAPS) if (t >= a) cap = s; caption(cap, old);
  CAR.position.set(X0 + 2.6, 0, carZ(t)); CAR.rotation.y = t < 7 ? -Math.PI / 2 : Math.PI / 2; CAR.visible = t > 1.3 && t < 8.3;
  POLICE.position.set(3.4, 0, polZ(t)); POLICE.rotation.y = -Math.PI / 2; POLICE.visible = t > 14.8; POLICE.userData.spin(polZ(t)); POL_L.forEach((l, i) => { l.material.emissiveIntensity = (Math.floor(t * 6) + i) % 2 ? 4 : 0.2; });
  GANG.update(t, camPos, { bob: 0.3, mode: t > 6.0 && t < 6.6 ? 2 : t > 4.8 ? 1 : 0, visible: t > 4.7 && t < JUMP }); GANG.u.uMode.value = t > 6.0 && t < 6.6 ? 2 : t > 4.8 ? 0 : 0; if (t > 4.8 && t < 6.0) GANG.u.uMode.value = 3;
  COPS.update(t, camPos, { bob: 0.3, visible: t > 15.6, mode: t > 16.6 ? 1 : 0 }); if (t > 15.6 && t < 16.6) COPS.u.uMode.value = 0;
  FANS.update(t, camPos, { bob: 0.3, mode: t > 16.5 ? 1 : 0, visible: t > JUMP });
  const g = gemPos(t); GEM.visible = !!g; if (g) { GEM.position.copy(g); GEM.rotation.y = t * 3; GEM.userData.glow.material.opacity = t > 10.9 && t < 12.9 ? 0.6 + 0.4 * Math.sin(t * 12) : 0.8; }
  hide();
  if (old) { act(DET, P.DET, TR.DET, 7, t, camPos, { sweat: t > 5.5 && t < 6.6 ? t : 0 }); if (t > 2.5 && t < 7.0) act(BOSS, P.BOSS, TR.BOSS, 21, t, camPos); }
  else { act(KID, P.KID, TR.KID, 33, t, camPos, { prop: t > 10.2 && t < 11 ? 'phone' : null, propHand: 'R', propFront: true }); if (t > 13.3) act(NEW, P.NEW(t), TR.NEW, 48, t, camPos); if (t > 15.6) act(COP, P.COP, TR.COP, 55, t, camPos, { prop: 'pistol', propHand: 'R' }); }
}
function fx(t) { const d = new THREE.Vector3(); cam.getWorldDirection(d); d.y = 0; d.normalize(); RAIN.update(t, cam.position, d, true, 1); }
const CINE = new Cine(); const K = camkit(CINE); const pov = (a, b, from, at, fov = 44) => CINE.shot(a, b, { rig: 'pov', from, at, fov, push: 1, drift: [0, 0], shake: 0.8 });
function camera() {
  K.drone(0, 1.2, V(X0 + 5, 0, -15), [14, 42, 36], [3, 3.5, 9], { lookY: 1.5 });
  K.low(1.2, 2.0, DET, { az: 25 });
  pov(2.0, 2.6, (t) => V(X0 + 6.4, 0.6, -10.5), () => CAR.position.clone().add(V(0, 0.9, 0)), 40);
  K.dutch(2.6, 3.2, BOSS, { az: -20 });
  K.ots(3.2, 3.8, DET, BOSS);
  pov(3.8, 4.3, () => GEM.position.clone().add(V(0.7, 0.25, 1.4)), () => GEM.position.clone(), 34);
  K.crash(4.3, 4.8, DET, { az: 10 });
  pov(4.8, 5.5, (t) => DET.headWorld().add(V(0.6, 0.3, 1.8 + (t - 4.8) * 0.6)), () => V(X0 + 2, 1.3, -21), 46);
  K.handheld(5.5, 6.0, DET, { az: -25, size: 1.6 });
  K.crane(6.0, 6.6, BOSS, { az: 30, size0: 2.2, size: 6, el: 40 });
  K.vertigo(6.6, 7.1, BOSS, { az: 8 });
  pov(7.1, 7.4, (t) => V(X0 + 1.2, 0.5, -14), () => CAR.position.clone().add(V(0, 0.8, 0)), 42);
  K.crane(7.4, 8.2, DET, { az: -15, size0: 1.8, size: 5, el: 32 });
  pov(8.2, 9.0, (t) => DRAIN_OLD.clone().add(V(0.9, 0.9 - (t - 8.2) * 0.5, 1.6)), () => DRAIN_OLD.clone().add(V(0, 0.4, 0)), 36);
  K.drone(9.0, 10.2, V(7.5, 0, -23), [-14, 55, 45], [-3, 4, 9], { lookY: 1.5 });
  K.low(10.2, 11.0, KID, { az: -20 });
  pov(11.0, 11.8, (t) => DRAIN_NEW.clone().add(V(0.6, 0.7 - (t - 11) * 0.3, 1.1)), () => DRAIN_NEW.clone(), 34);
  K.crash(11.8, 12.6, KID, { az: 15 });
  pov(12.6, 13.4, () => GEM.position.clone().add(V(0.5, 0.3, 1.3)), () => GEM.position.clone().add(V(-0.2, 0.25, 0)), 38);
  K.whip(13.4, 14.2, NEW, { az: -15 });
  K.orbit(14.2, 15.0, KID, { az: -50, sweep: 90, size: 2.0 });
  K.track(15.0, 15.8, { bodyWorld: () => POLICE.position.clone().add(V(0, 0.4, 0)), headWorld: () => POLICE.position.clone() }, [-3.5, 1.0, -4.5]);
  K.vertigo(15.8, 16.6, NEW, { az: -10, fov0: 60, fov1: 22 });
  K.crane(16.6, 17.6, KID, { az: 20, size0: 2.0, size: 5.5, el: 35 });
  K.drone(17.6, 20, V(7.5, 0, -24), [3, 3, 8], [-20, 50, 40], { lookY: 1.2 });
}
const composer = makeComposer({ sat: 0, con: 1.3, bloom: 0.3 }); const SKY = makeSky();
const look = (t, cpos) => { applyNoir(composer, SKY, cpos, 'bw'); /* noir = black & white in EVERY era (user rule) */ composer.grade.uniforms.uFlash.value = 0.55 * lightning(t, [6.0, 6.35]); };
makeRenderer({ CINE, camOf: dynamicCam(CINE), setup, fx, look, composer, DURATION, impacts: [4.32, 6.0, 11.82, 15.82] });
(async () => { await sky('kloofendal_48d_partly_cloudy_puresky', { env: 0.25 }); build(); camera(); await ready(); window.ready = true; })();
