// CITY v9.1 (today's era, 12 s): "Ali late ho gaya" — real street (city2.js), real cars, leafy trees, actors that change
// face / neck / body every 0.2–0.3 s (actor.js), a new visual every 0.3–0.9 s, inserts, crash zooms, crowd reactions.
import * as THREE from 'three';
import { scene, cam, sun, hemi, V, sky, ready, makeComposer, mesh } from '../../web/realkit.js';
import { Cine } from '../../web/cine.js';
import { Flat2D } from '../../web/flat2d.js';
import { loadMo, mo } from '../../web/mocap.js';
import { clamp, lerp } from '../../web/motion.js';
import { installActing, makeSky, dynamicCam, makeRenderer } from '../../web/studio.js';
import { makeAtlas, Crowd, blob, grid, mulberry } from '../../web/crowd.js';
import { realCity } from '../../web/city2.js';
import { perform } from '../../web/actor.js';
export const DURATION = 12;
installActing();
const T = { red: 1.9, green: 5.75 };
let CITY, PEOPLE, CROSS, LAUGH, CAP, capCtx, capTex; const r0 = mulberry(8), pick = (a) => a[Math.floor(r0() * a.length)];
const ALI = new Flat2D({ body: 'suit', coat: '#1a3a7a', tie: '#e8282a', pocketSq: '#e8282a', hair: '#1a1410', hairStyle: 'quiff', size: 1.9, res: 2.2, wide: true, headroom: 420, seed: 4, scene });
const BOSS = new Flat2D({ body: 'suit', coat: '#3a3a42', tie: '#1a8a5a', hair: '#5a5a5a', hairStyle: 'side', mustache: true, glasses: 'round', size: 2.0, res: 2.2, wide: true, headroom: 420, seed: 9, scene });
const DOST = new Flat2D({ body: 'hoodie', coat: '#ff7a2a', hair: '#3a2414', hairStyle: 'spiky', size: 1.85, res: 2.2, wide: true, headroom: 420, seed: 12, scene });
const modernV = Array.from({ length: 18 }, () => ({ body: pick(['tshirt', 'hoodie', 'jacket', 'suit', 'tshirt', 'polo']), shirt: '#f4f4f4', tie: pick(['#e8282a', '#1a4a9a']), print: pick([null, 'NYC', 'GO', null]), coat: pick(['#e8282a', '#1a6ad8', '#2ab86a', '#f2c63a', '#ff7a2a', '#8a3ab0', '#18b8c8', '#e86a8a', '#2a2a2e']), hair: pick(['#1a1410', '#3a2414', '#6a4a2a', '#c8a050']), hairStyle: pick(['quiff', 'side', 'curly', 'spiky', 'messy', 'swept']), glasses: r0() < 0.25 ? 'round' : null, mustache: r0() < 0.2 }));
const modernF = [{ armL: [16, -32], armR: [16, -32], face: { eyes: 'lid', lid: 0.2, mouth: 'smile', look: [0.5, 0.2] } }, { armL: [35, -110], armR: [35, -110], lean: -6, face: { eyes: 'happy', mouth: 'laugh' } }, { armL: [35, -110], armR: [92, -4], face: { eyes: 'squeeze', mouth: 'laugh' }, hop: 8 }];
const A_POS = (t) => t < 1.3 ? V(9.6, 0.18, -14) : t < 2.2 ? V(9.4, 0.18, lerp(-14, -27.6, (t - 1.3) / 0.9)) : t < 6.0 ? V(8.5, 0.18, -27.6) : t < 8.6 ? V(lerp(8.2, -8.4, (t - 6.0) / 2.6), 0.02, -29.4) : V(-8.6, 0.18, -29.4);
const B_POS = V(-10.4, 0.18, -30.8), D_POS = V(10.8, 0.18, -25.8);
function build() {
  CITY = realCity({ z0: 0, len: 190, cars: 12, parked: 8, stop: { z: -30, t0: T.red, t1: 99, green: T.green } });
  const atl = makeAtlas(modernV, modernF); const side = [];
  for (let k = 0; k < 12; k++) for (const sd of [-1, 1]) side.push(...blob(sd * 10.2, -8 - k * 14, 1.8, 5, 7, k * 3 + (sd > 0 ? 1 : 0)));
  const near = (x, z, P, r) => Math.hypot(x - P.x, z - P.z) < r; const _c = side.filter(({ x, z }) => !((x > 0 && z < -12 && z > -32) || near(x, z, B_POS, 1.6) || near(x, z, A_POS(10), 1.6)));
  PEOPLE = new Crowd(atl, side.filter(({ x, z }) => !((x > 0 && z < -12 && z > -32) || near(x, z, B_POS, 1.6) || near(x, z, A_POS(10), 1.6))), { seed: 3, fog: 0xc8d8e8, fogNear: 60, fogFar: 200 }); CROSS = new Crowd(atl, grid(0, -31.0, 8, 2, 1.25, 1.0, 0.35, 9), { seed: 4 });
  LAUGH = new Crowd(atl, [...grid(-12.2, -30.8, 2, 9, 0.9, 0.85, 0.3, 77)], { seed: 6 });
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256; capCtx = c.getContext('2d'); capTex = new THREE.CanvasTexture(c); capTex.colorSpace = THREE.SRGBColorSpace;
  CAP = mesh(new THREE.PlaneGeometry(0.34, 0.085), new THREE.MeshBasicMaterial({ map: capTex, transparent: true, depthTest: false, toneMapped: false }), 0, -0.2, -1.0, false); CAP.renderOrder = 99; scene.add(cam); cam.add(CAP);
}
let capLast = ''; function caption(txt) { if (txt === capLast) return; capLast = txt; const g = capCtx; g.clearRect(0, 0, 1024, 256); if (txt) { let fs = 92; g.font = `bold ${fs}px "DejaVu Sans"`; while (g.measureText(txt).width > 960 && fs > 30) { fs -= 4; g.font = `bold ${fs}px "DejaVu Sans"`; } g.textAlign = 'center'; g.lineWidth = 16; g.strokeStyle = '#000'; g.fillStyle = '#ffe14a'; g.strokeText(txt, 512, 150); g.fillText(txt, 512, 150); } capTex.needsUpdate = true; }
const CAPS = [[0, 'TRAFIKABAD, SUBAH 9 BAJE'], [0.9, 'ALI LATE HO GAYA!'], [1.8, 'LAAL BATTI!'], [2.7, 'GUSSA!'], [3.4, 'BOSS KA PHONE...'], [4.6, '"KAHAN HO?!"'], [5.0, 'JAAN NIKAL GAYI'], [5.6, 'HARI BATTI!'], [6.0, 'BHAAGO!'], [6.9, 'HAHAHA!'], [7.4, 'PHIR BHI ATTITUDE'], [8.6, '"AAJ TO CHHUTTI HAI!"'], [9.3, 'KYAAA?!'], [9.8, 'POORA SHEHAR HANS PARA'], [10.6, 'TRAFIKABAD!']];
// acting tracks (mood changes on the story beats; inside each mood a new micro-beat every ~0.26 s)
const TR_A = [[0, 'scared', { gestures: ['biteNails', 'cheeks'] }], [1.3, 'determined'], [2.2, 'shock', { rate: 0.2 }], [2.7, 'angry'], [3.4, 'phone'], [3.8, 'shock', { gestures: ['phoneEar'] }], [4.6, 'scared', { gestures: ['phoneEar'] }], [5.0, 'scared'], [5.6, 'excited'], [6.0, 'determined'], [7.4, 'attitude', { gestures: ['fixTie', 'pointCool', 'fixTie'] }], [8.0, 'happy', { gestures: ['wave', 'thumbsUp'] }], [8.6, 'confused'], [9.3, 'shock', { rate: 0.2 }], [9.8, 'sad'], [10.6, 'confused']];
const TR_B = [[0, 'talk'], [4.4, 'angry', { gestures: ['phoneEar'], talk: true }], [5.2, 'fume'], [8.0, 'evil'], [8.6, 'laugh'], [9.3, 'laugh'], [10.6, 'happy']].map(([t, m, o]) => [t, m === 'fume' ? 'angry' : m, o]);
const TR_D = [[0, 'talk'], [6.6, 'laugh'], [7.4, 'happy'], [9.6, 'laugh']];
const legsOf = (P) => P ? { legL: P.legL, legR: P.legR, amp: P.amp, walk: P.walk, front: P.front, bob: P.bob } : {};
function setup(t, camPos) { Flat2D.T = t; CITY.update(t); let cap = ''; for (const [a, s] of CAPS) if (t >= a) cap = s; caption(cap);
  const laugh = t > 9.8; PEOPLE.update(t, camPos, { bob: 0.3, mode: laugh ? 1 : 0, march: laugh ? 0 : 0.6 }); CROSS.mesh.position.set(lerp(11, -4, clamp((t - 6.0) / 2.6, 0, 1)), 0, -1.0); CROSS.update(t, camPos, { march: 1, bob: 0.5, visible: t > 5.9 && t < 8.0 }); LAUGH.update(t, camPos, { mode: 1, bob: 0.4, visible: t > 9.6 });
  // ALI
  const ap = A_POS(t); ALI.place(ap.x, ap.y, ap.z); let pa = perform(t, TR_A, 7);
  if (t >= 1.3 && t < 2.2) { const m = mo('17_06f', t, { t0: 1.3, from: 0.4, amp: 1.5, speed: 1.9, root: 0, hold: 0 }); pa = { ...pa, ...m, face: pa.face, neck: pa.neck, lean: 8 }; }
  if (t >= 6.0 && t < 8.6) { const m = mo('17_06f', t, { t0: 6.0, from: 0.4, amp: 1.3, speed: 1.5, root: 0, hold: 0 }); pa = t < 7.4 ? { ...pa, ...m, face: pa.face, neck: pa.neck } : { ...pa, legL: m.legL, legR: m.legR }; }
  const phone = t >= 3.4 && t < 5.0; ALI.update({ ...pa, prop: phone ? 'phone' : null, propHand: 'R', propFront: true, sweat: t > 5.0 && t < 5.6, flip: t >= 6.0 && t < 8.6, noBlink: false }, camPos);
  // BOSS (other side of the zebra) and DOST (laughs)
  BOSS.place(B_POS.x, B_POS.y, B_POS.z); const pb = perform(t, TR_B, 3); BOSS.update({ ...pb, prop: t > 4.3 && t < 5.4 ? 'phone' : null, propHand: 'R', propFront: true }, camPos);
  DOST.place(D_POS.x, D_POS.y, D_POS.z); DOST.update({ ...perform(t, TR_D, 5), flip: true }, camPos);
}
function fx() {}
const CINE = new Cine(); const shot = (a, b, s) => CINE.shot(a, b, s);
const aH = () => ALI.headWorld(), bH = () => BOSS.headWorld(), dH = () => DOST.headWorld();
function camera() {
  shot(0, 0.9, { rig: 'pov', from: (t) => V(lerp(2, 5.6, t / 0.9), lerp(55, 2.4, (t / 0.9) ** 0.7), lerp(25, -8.5, t / 0.9)), at: () => V(9.6, 1.3, -14), fov: 50, push: 1, drift: [0, 0] });   // drone dive onto Ali
  shot(0.9, 1.3, { rig: 'push', at: () => aH().add(V(0, -0.15, 0)), size: 1.05, az: 22, el: 2, fov: 32, push: 1.25 });                 // nervous close-up
  shot(1.3, 1.8, { rig: 'pov', from: (t) => A_POS(t).add(V(1.3, 1.5, -4.6)), at: (t) => A_POS(t).add(V(0, 1.1, 0)), fov: 46, push: 1, drift: [0, 0] });   // running toward camera (tracking)
  shot(1.8, 2.2, { rig: 'pov', from: (t) => V(4.0 + (t - 1.8) * 0.8, 4.5, -22.4), at: () => V(7.3, 5.0, -27.4), fov: 26, push: 1, drift: [0, 0] });   // RED light insert
  shot(2.2, 2.7, { rig: 'pov', from: (t) => V(0.3 - (t - 2.2) * 0.8, 0.55, -30.6), at: () => V(-3.4, 0.8, -22), fov: 44, push: 1, drift: [0, 0] });   // cars stop, low on the zebra
  shot(2.7, 3.4, { rig: 'push', at: () => ALI.bodyWorld().add(V(0, 0.25, 0)), size: 2.3, az: -18, el: -12, fov: 34, push: 1.15, zoomK: [[3.05, 1.6, 0.06]] });   // angry + crash zoom
  shot(3.4, 3.8, { rig: 'push', at: () => aH().add(V(0.15, -0.05, 0)), size: 0.85, az: 35, el: 0, fov: 30, push: 1.2 });                 // phone insert at the ear
  shot(3.8, 4.6, { rig: 'push', at: () => aH().add(V(0, 0.1, 0)), size: 1.5, az: -8, el: -4, fov: 32, push: 1.1, zoomK: [[3.85, 1.4, 0.05]] });   // shock, neck stretch
  shot(4.6, 5.0, { rig: 'push', at: () => bH().add(V(0, -0.1, 0)), size: 1.2, az: 25, el: -8, fov: 30, push: 1.25, zoomK: [[4.62, 1.35, 0.05]] });   // boss yells
  shot(5.0, 5.6, { rig: 'push', at: () => aH().add(V(0, -0.1, 0)), size: 1.15, az: 40, el: 6, fov: 30, push: 1.2, roll: 0.12 });       // scared, dutch tilt
  shot(5.6, 6.0, { rig: 'pov', from: (t) => V(4.0 + (t - 5.6) * 0.8, 4.3, -22.4), at: () => V(7.3, 4.6, -27.4), fov: 26, push: 1, drift: [0, 0] });   // GREEN insert
  shot(6.0, 6.9, { rig: 'pov', from: (t) => A_POS(t).add(V(-3.4, 0.45, 1.8)), at: (t) => A_POS(t).add(V(0, 1.2, 0)), fov: 44, push: 1, drift: [0, 0] });   // low tracking across the zebra
  shot(6.9, 7.4, { rig: 'push', at: () => dH().add(V(0, -0.2, 0)), size: 1.5, az: -25, el: -6, fov: 32, push: 1.2, zoomK: [[6.95, 1.4, 0.05]] });   // friend laughs
  shot(7.4, 8.0, { rig: 'push', at: () => ALI.bodyWorld().add(V(0, 0.35, 0)), size: 2.1, az: 28, el: -14, fov: 34, push: 1.15 });      // attitude walk (low)
  shot(8.0, 8.6, { rig: 'pov', from: () => B_POS.clone().add(V(-0.9, 1.95, -1.5)), at: () => aH().add(V(0, -0.3, 0)), fov: 40, push: 1, drift: [0, 0] });   // over the boss's shoulder
  shot(8.6, 9.3, { rig: 'pov', from: () => A_POS(9).add(V(0.7, 1.9, 1.5)), at: () => bH().add(V(0, -0.25, 0)), fov: 36, push: 1, drift: [0, 0] });   // over Ali's shoulder: boss laughs
  shot(9.3, 9.8, { rig: 'push', at: () => aH(), size: 1.0, az: 0, el: 0, fov: 30, push: 1.15, zoomK: [[9.32, 1.6, 0.05]] });           // KYAAA crash zoom
  shot(9.8, 10.6, { rig: 'pov', from: (t) => V(-2.6 - (t - 9.8) * 0.9, 1.4, -32.4 + (t - 9.8) * 0.6), at: () => V(-10.2, 1.4, -30.0), fov: 44, push: 1, drift: [0, 0] });   // the whole street laughs
  shot(10.6, 12, { rig: 'pov', from: (t) => V(lerp(-3, 4, (t - 10.6) / 1.4), lerp(3, 48, ((t - 10.6) / 1.4) ** 0.8), lerp(-23, 12, (t - 10.6) / 1.4)), at: () => V(-6, 1, -30), fov: 50, push: 1, drift: [0, 0] });   // drone pull-back
}
const composer = makeComposer({ sat: 1.28, con: 1.12, bloom: 0.08 }); const SKY = makeSky();
const look = (t, cpos) => { SKY.update(cpos, false, composer.grade); sun.color.setHex(0xffe0b8); sun.intensity = 2.6; hemi.intensity = 0.6; const tg = sun.target.position; sun.position.copy(tg).add(V(-35, 50, 28)); };
makeRenderer({ CINE, camOf: dynamicCam(CINE), setup, fx, look, composer, DURATION, impacts: [3.05, 3.85, 9.32] });
(async () => { await loadMo(['17_06f'], './mocap'); await sky('kloofendal_48d_partly_cloudy_puresky', { env: 0.9 }); build(); camera(); await ready(); window.ready = true; })();
