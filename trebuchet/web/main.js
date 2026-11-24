// "THE ROCK THAT FLEW OVER THE CASTLE" (counterweight trebuchet) : 47.6 s. Voice = audio/voice_clean.mp3. Beats keyed to words.json.
import * as THREE from 'three';
import * as C from './core.js';
import { box, cyl, sph, makeCloud } from '../../web/models.js';
import { mkLook, applyLook } from '../../web/looks.js';
import { EASE, sstep, clamp, lerp, hash } from '../../web/motion.js';
import { Performer, EMOTIONS } from '../../web/perform.js';
import { Cine, T as CT } from '../../web/cine.js';
import { toTex, mkCanvas } from '../../web/tex.js';
import { toonify, placeMarks, CAMPOS } from '../../web/toonkit.js';
import { makeCast } from '../../web/cast.js';
import { addSolidCentered, guardCam, setGround } from '../../web/safety.js';
for (const [n, base, ex] of [['smug', 'proud', 'smug'], ['grin', 'happy', 'grin'], ['gasp', 'shock', 'gasp'], ['awe', 'curious', 'awe'], ['blank', 'neutral', 'blank'], ['gentle', 'calm', 'gentle']]) EMOTIONS[n] = { ...EMOTIONS[base], expr: ex };
const { stage, dofU, FPS, PX } = C; export const DURATION = 47.6;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z); const tm = (h, o = {}) => C.toon({ color: new THREE.Color(h), ...o });
const ctex = (w, h, fn, rep = false) => { const c = mkCanvas(w, h); fn(c.getContext('2d'), w, h); return toTex(c, rep); };
const W = new THREE.Group(); stage.world.add(W); W.add(C.makeSky()); setGround(() => 0);

// ======================= LAND =======================
const grassTex = ctex(256, 256, (g, w, h) => { g.fillStyle = '#86c050'; g.fillRect(0, 0, w, h); for (let i = 0; i < 1400; i++) { const s = hash(i + 3.3); g.fillStyle = s < 0.5 ? 'rgba(70,140,40,0.5)' : 'rgba(180,220,100,0.45)'; g.fillRect(hash(i) * w, hash(i + 7.1) * h, 2 + s * 3, 6 + s * 10); } }, true);
W.add(box(400, 0.1, 400, tm(0xffffff, { map: grassTex, repeat: [80, 80] }), 0, -0.05, 0));
W.add(box(12, 0.02, 3, tm(0xb89a6a), 8, 0.01, 0)); W.add(box(30, 0.02, 3, tm(0xb89a6a), -20, 0.01, 0));   // dirt road to the castle
function tree(x, z, s = 1) { const g = new THREE.Group(); g.position.set(x, 0, z); W.add(g); g.add(cyl(0.18 * s, 0.26 * s, 2.4 * s, tm(0x7a5a3a), 0, 1.2 * s, 0, 8)); for (let i = 0; i < 6; i++) g.add(sph((0.9 + hash(x + i) * 0.5) * s, tm([0x3f9a3a, 0x5cb846, 0x2f7a32][i % 3], { band: 0.15, noInk: 1 }), Math.cos(i * 2.2) * 0.8 * s, (2.8 + hash(z + i) * 1.2) * s, Math.sin(i * 2.2) * 0.8 * s, 10, 8)); }
for (let i = 0; i < 30; i++) { const x = -60 + hash(i) * 130, z = (i % 2 ? 1 : -1) * (10 + hash(i + 5) * 40); tree(x, z, 0.9 + hash(i + 2) * 0.6); }
for (let i = 0; i < 9; i++) { const h = sph(1, tm([0x6aa84a, 0x5a9a42, 0x7ab452][i % 3], { band: 0.15 }), -120 + i * 40, -6, (i % 2 ? -1 : 1) * (110 + hash(i) * 40), 18, 12); h.scale.set(50, 26 + hash(i + 2) * 14, 40); W.add(h); }
for (let i = 0; i < 7; i++) { const cl = makeCloud(i + 120, 1.3); cl.position.set(-150 + i * 55, 55 + (i % 3) * 8, -140); W.add(cl); }

// ======================= GRIMHOLD CASTLE (wall x=30, keep x=38, soup courtyard x=46) =======================
const stone = tm(0xb8ac98), stone2 = tm(0xa09480), roofM = tm(0x8a2a2a);
W.add(box(1.2, 4.6, 18, stone, 30, 2.3, 0)); addSolidCentered('wall', 30, 2.3, 0, 1.2, 4.6, 18);
for (let i = -8; i <= 8; i++) W.add(box(0.3, 0.6, 0.6, stone2, 29.55, 4.9, i * 1.05));
for (const z of [-9.5, 9.5]) { W.add(cyl(1.7, 1.8, 7.2, stone2, 30, 3.6, z, 16)); W.add(cyl(0, 2.1, 2.6, roofM, 30, 8.5, z, 16)); addSolidCentered('tower' + z, 30, 3.6, z, 3.4, 7.2, 3.4); }
W.add(box(0.3, 3.0, 2.6, tm(0x4a2e1a), 29.35, 1.5, 0));
W.add(box(6, 8, 8, stone, 38, 4, 0)); addSolidCentered('keep', 38, 4, 0, 6, 8, 8); for (let i = -3; i <= 3; i++) W.add(box(0.6, 0.6, 0.6, stone2, 35.2, 8.3, i * 1.1));
W.add(cyl(0, 4.6, 3.0, roofM, 38, 9.5, 0, 4)); W.add(box(0.04, 1.8, 0.04, tm(0x3a2a1a), 38, 11.6, 0));
const CFLAG = box(0.02, 0.6, 1.0, tm(0xd82a2a), 38, 12.1, 0.5); W.add(CFLAG);
W.add(box(1.0, 3.2, 18, stone, 52, 1.6, 0)); W.add(box(22, 3.2, 1.0, stone, 41, 1.6, 9.5)); W.add(box(22, 3.2, 1.0, stone, 41, 1.6, -9.5));
const BANNERS = []; for (const z of [-4, 4]) { const b = box(0.04, 2.2, 1.0, tm(0xd82a2a), 29.37, 3.2, z); W.add(b); b.add(box(0.05, 0.4, 0.4, tm(0xf0c020), 0, 0.3, 0)); BANNERS.push(b); }
// soup pot + fire (courtyard)
const POT = V(46, 0, 0); W.add(cyl(0.62, 0.5, 0.85, tm(0x2a2a2e), POT.x, 0.55, POT.z, 18)); W.add(cyl(0.58, 0.58, 0.02, tm(0xd88a3a, { unlit: 0.3 }), POT.x, 0.95, POT.z, 18)); addSolidCentered('pot', POT.x, 0.5, POT.z, 1.25, 1.0, 1.25);
for (let i = 0; i < 4; i++) { const l = cyl(0.06, 0.06, 0.9, tm(0x5a3a1a), POT.x, 0.08, POT.z, 6); l.rotation.set(Math.PI / 2, i * 0.8, 0); W.add(l); }
const FIRE = [0, 1, 2].map((i) => { const f = cyl(0, 0.16, 0.4, tm([0xff5a1a, 0xffa020, 0xffe060][i], { unlit: 1, noInk: 1 }), POT.x + (i - 1) * 0.15, 0.25, POT.z + 0.1, 6); W.add(f); return f; });
const SOUP = []; for (let i = 0; i < 30; i++) { const m = sph(0.06 + hash(i) * 0.06, tm(0xd88a3a, { unlit: 0.3, noInk: 1 }), 0, -50, 0, 8, 6); W.add(m); SOUP.push(m); }
const STEAM = []; for (let i = 0; i < 6; i++) { const m = sph(0.18, tm(0xf4f4f4, { noInk: 1, band: 0.2 }), 0, -50, 0, 8, 6); W.add(m); STEAM.push(m); }

// ======================= ARMY CAMP: king's tent, catapult, rope =======================
const TENT_P = V(-14, 0, 4.2); const TENT = new THREE.Group(); TENT.position.copy(TENT_P); W.add(TENT);
{ const stripes = ctex(256, 64, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#f4f0e8' : '#d82a2a'; g.fillRect(i * 32, 0, 32, h); } }, true);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.8, 2.6, 8, 1, true), tm(0xffffff, { map: stripes, repeat: [2, 1], side: THREE.DoubleSide })); cone.position.y = 1.3; TENT.add(cone); TENT.add(cyl(0.03, 0.03, 0.8, tm(0x5a3a2a), 0, 2.9, 0, 6)); TENT.add(box(0.02, 0.35, 0.55, tm(0xf0c020), 0, 3.1, 0.28)); }
addSolidCentered('tent', TENT_P.x, 1.2, TENT_P.z, 2.6, 2.4, 2.6);
const CAT = new THREE.Group(); const CAT_P = V(-8, 0, 0); CAT.position.copy(CAT_P); W.add(CAT); const wd = tm(0x8a5a32), wdd = tm(0x5a3a1a);
CAT.add(box(2.6, 0.25, 0.2, wd, 0, 0.35, -0.7)); CAT.add(box(2.6, 0.25, 0.2, wd, 0, 0.35, 0.7)); for (const x of [-1.1, 1.1]) CAT.add(box(0.2, 0.25, 1.6, wd, x, 0.35, 0));
for (const s of [-1, 1]) { CAT.add(box(0.2, 1.4, 0.2, wdd, 0.3, 1.0, s * 0.7)); for (const x of [-1, 1]) { const w = cyl(0.36, 0.36, 0.12, wdd, x, 0.36, s * 0.82, 12); w.rotation.x = Math.PI / 2; CAT.add(w); } }
CAT.add(box(0.25, 0.25, 1.6, wdd, 0.3, 1.6, 0)); addSolidCentered('catapult', CAT_P.x, 0.6, CAT_P.z, 2.8, 1.2, 1.8, { people: false });
const CARM = new THREE.Group(); CARM.position.set(-0.3, 0.55, 0); CAT.add(CARM); CARM.add(box(0.16, 2.1, 0.16, wd, 0, 1.05, 0)); const CUP = new THREE.Group(); CUP.position.y = 2.1; CARM.add(CUP); CUP.add(cyl(0.3, 0.2, 0.18, wdd, 0, 0.05, 0, 10));
const CROCK = sph(0.26, tm(0x8a8478), 0, 0, 0, 12, 8); W.add(CROCK);
const ropeM = tm(0xc8a060); const ROPE = cyl(0.025, 0.025, 1, ropeM, 0, 0, 0, 6); W.add(ROPE); const ROPE2 = cyl(0.025, 0.025, 1, ropeM, 0, 0, 0, 6); W.add(ROPE2);
const seg = (m, a, b) => { const d = b.clone().sub(a); m.position.copy(a).addScaledVector(d, 0.5); m.scale.set(1, d.length(), 1); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); };
const ROPE_END = V(-17.2, 0.42, 0);
// catapult arm angle (deg from vertical, + towards the castle)
const catAng = (t) => { if (t < 10.82) return 18; if (t < 13.58) { const k = t < 12.4 ? lerp(18, -35, sstep(10.9, 12.2, t)) : t < 13.04 ? lerp(-35, -58, sstep(12.4, 12.9, t)) : lerp(-58, -78, sstep(13.04, 13.5, t)); return k + 2.5 * Math.sin(t * 40) * sstep(10.9, 11.3, t); }
  if (t < 32.0) return lerp(-78, 22, EASE.outCubic(clamp((t - 13.58) / 0.35, 0, 1))) - 6 * Math.exp(-(t - 13.93) * 4) * Math.sin(Math.max(0, t - 13.93) * 18);
  if (t < 34.44) return lerp(18, -40, sstep(32.1, 34.0, t)) + 3 * Math.sin(t * 38); return 18; };

// ======================= THE TREBUCHET =======================
const TB = V(-5, 0, -5), PIV = V(TB.x, 4.2, TB.z), LL = 5.0, LS = 1.4, SL = 1.2;
const TREB = new THREE.Group(); W.add(TREB); const tbW = tm(0x9a6a3a), tbD = tm(0x6a4424);
for (const s of [-1, 1]) { for (const dx of [-1.6, 1.6]) { const leg = box(0.22, 4.6, 0.22, tbW, 0, 0, 0); const a = V(TB.x + dx, 0, TB.z + s * 0.9), b = V(PIV.x, PIV.y, TB.z + s * 0.9); seg(leg, a, b); leg.scale.set(1, a.distanceTo(b) / 4.6 * 4.6, 1); TREB.add(leg); } TREB.add(box(3.6, 0.2, 0.2, tbD, TB.x, 0.15, TB.z + s * 0.9)); }
TREB.add(cyl(0.1, 0.1, 2.1, tbD, PIV.x, PIV.y, PIV.z, 10).rotateX(Math.PI / 2)); addSolidCentered('trebFrameA', TB.x, 2.1, TB.z - 0.9, 3.4, 4.2, 0.3, { cam: false }); addSolidCentered('trebFrameB', TB.x, 2.1, TB.z + 0.9, 3.4, 4.2, 0.3, { cam: false });
const BEAM = new THREE.Group(); BEAM.position.copy(PIV); W.add(BEAM); BEAM.add(box(LL + LS, 0.24, 0.24, tbW, (LL - LS) / 2, 0, 0));
const CW = new THREE.Group(); W.add(CW); CW.add(box(1.1, 0.9, 1.1, tbD, 0, -0.8, 0, 0.05)); for (let i = 0; i < 7; i++) CW.add(sph(0.2 + hash(i) * 0.08, tm(0x8a8478), (hash(i) - 0.5) * 0.7, -0.3 + hash(i + 2) * 0.15, (hash(i + 4) - 0.5) * 0.7, 8, 6)); for (const s of [-1, 1]) CW.add(box(0.05, 0.6, 0.05, tm(0x2a2a2a), 0, -0.2, s * 0.5));
const SLING = cyl(0.02, 0.02, 1, tm(0x8a6a3a), 0, 0, 0, 5); W.add(SLING); const POUCH = sph(0.16, tm(0x7a5a3a), 0, 0, 0, 8, 6); W.add(POUCH);
const TROCK = sph(0.3, tm(0x8a8478), 0, 0, 0, 12, 8); W.add(TROCK);
const PIN = cyl(0.03, 0.03, 0.32, tm(0x6a6a72), 0, 0, 0, 6); W.add(PIN); const PIN_P = V(-7.9, 0.48, -4.4);
const TRAIL = []; for (let i = 0; i < 26; i++) { const m = sph(0.12, tm(0xffd23a, { unlit: 1, noInk: 1 }), 0, -50, 0, 8, 6); W.add(m); TRAIL.push(m); }
// beam angle phi (deg, direction of the LONG arm in the x-y plane; 231 = cocked with the sling on the ground at the back)
const dropPhi = (t, s0, dur) => { if (t < s0) return 231; const u = (t - s0) / dur; if (u < 1) return 231 - 171 * u * u; const a = t - s0 - dur; return 90 + (60 - 90) * Math.exp(-a * 1.2) * Math.cos(a * 3); };
const phiAt = (t) => t < 24.6 ? 231 : t < 34.44 ? dropPhi(t, 24.6, 1.7) : t < 38.6 ? dropPhi(t, 34.7, 2.2) : dropPhi(t, 38.7, 2.4);
const tipAt = (phi) => PIV.clone().add(V(Math.cos(phi * Math.PI / 180) * LL, Math.sin(phi * Math.PI / 180) * LL, 0));
const slingEnd = (t, phi) => { const tip = tipAt(phi); const st = t < 34.44 ? 24.6 : t < 38.6 ? 34.7 : 38.7, du = t < 34.44 ? 1.7 : t < 38.6 ? 2.2 : 2.4; const u = clamp((t - st) / du, 0, 1); const psi = (phi + lerp(-51, 45, u)) * Math.PI / 180; return { tip, end: tip.clone().add(V(Math.cos(psi) * SL, Math.sin(psi) * SL, 0)) }; };
const REL = 26.3; let P0 = null; { const s = slingEnd(REL, phiAt(REL)); P0 = s.end.clone(); }
const RK = [[REL, 0], [28.08, (30 - P0.x) / (POT.x - P0.x)], [28.96, (38 - P0.x) / (POT.x - P0.x)], [30.62, 1]];
function rockAt(t) { let s = 1; for (let i = 0; i < RK.length - 1; i++) if (t <= RK[i + 1][0]) { const u = (t - RK[i][0]) / (RK[i + 1][0] - RK[i][0]); s = lerp(RK[i][1], RK[i + 1][1], i === 0 ? EASE.outCubic(u) : u); break; }
  const p = V(lerp(P0.x, POT.x, s), lerp(P0.y, 1.0, s) + 21 * 4 * s * (1 - s), lerp(P0.z, POT.z, s)); return p; }
// counterweight trebuchet banner (pops on the words)
const BANNER = new THREE.Group(); BANNER.position.set(-9.5, 0, -1.6); BANNER.rotation.y = 0.35; W.add(BANNER); for (const x of [-1.7, 1.7]) BANNER.add(cyl(0.05, 0.05, 2.8, tm(0x5a3a2a), x, 1.4, 0, 6));
{ const c = mkCanvas(1024, 256), g = c.getContext('2d'); g.fillStyle = '#f2e2b8'; g.fillRect(0, 0, 1024, 256); g.strokeStyle = '#7a4a1a'; g.lineWidth = 16; g.strokeRect(8, 8, 1008, 240); g.fillStyle = '#7a1a1a'; g.font = 'bold 90px serif'; g.textAlign = 'center'; g.fillText('COUNTERWEIGHT', 512, 112); g.fillText('TREBUCHET', 512, 210);
  for (const r of [0, Math.PI]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 0.85), tm(0xffffff, { map: toTex(c, false), unlit: 0.5, noInk: 1 })); m.rotation.y = r; m.position.set(0, 2.3, r ? -0.01 : 0.01); BANNER.add(m); } }
addSolidCentered('banner', -9.5, 1.4, -1.6, 3.6, 2.8, 0.2, { cam: false, people: false });

// ======================= PEOPLE =======================
const KING = makeCast(W, 'king', { hits: [[0.9, 'take', 0.4], [7.2, 'jolt', 0.4], [15.26, 'take', 1.4], [15.9, 'double', 1.0], [22.9, 'shake', 0.6], [24.92, 'take', 0.8], [30.62, 'jolt', 0.7], [45.94, 'take', 1.2]], loops: [[9.3, 10.6, 'bob'], [30.9, 31.3, 'laugh'], [43.36, 45.3, 'laugh'], [46.0, 47.6, 'sob']], marks: [['!', 15.3, 16.2], ['!', 45.94, 46.7]] });
const CARP = makeCast(W, 'grandpa', { hits: [[16.7, 'take', 0.3], [24.24, 'jolt', 0.8], [26.4, 'take', 0.6], [31.3, 'jolt', 0.4]], loops: [[17.6, 21.0, 'nod'], [30.7, 31.2, 'laugh'], [41.0, 41.7, 'bob']], marks: [] });
const CAPT = makeCast(W, 'knight', { hits: [[10.82, 'jolt', 0.6], [12.4, 'jolt', 0.7], [13.04, 'jolt', 0.9], [13.58, 'take', 1.4], [22.9, 'shake', 0.5]], loops: [[11.0, 13.5, 'rage'], [43.36, 45.0, 'bob']], marks: [['!', 13.58, 14.4]] });
const CHEF = makeCast(W, 'chef', { hits: [[30.62, 'double', 1.2]], loops: [[29.0, 30.5, 'nod']], marks: [['!', 30.8, 31.4]] });
const GUARDS = [0, 1].map((i) => makeCast(W, 'soldier', { hits: [[28.0 + i * 0.1, 'take', 1.2]], loops: [], marks: [['!', 28.1, 28.9]] }, { spec: { top: '#2a4a9a', height: 0.62 }, head: { hatCol: 0x4a6aaa } }));
const SOLC = ['#9a3030', '#8a2a2a', '#a83a3a', '#7a2a2a'];
const SOL = []; for (let i = 0; i < 18; i++) SOL.push(makeCast(W, 'soldier', { hits: [[13.58, 'take', 1.2], [30.62, 'jolt', 0.5]], loops: [[13.9, 15.4, 'dizzy'], [43.36 + hash(i) * 0.2, 45.3, 'bob'], [30.8, 31.3, 'laugh']], marks: i === 4 ? [['!', 13.6, 14.3]] : [] }, { spec: { top: SOLC[i % 4], height: 0.58 + (i % 3) * 0.02 }, seed: 200 + i }));
const ALL = [KING, CARP, CAPT, CHEF, ...GUARDS, ...SOL];
const B = (arr) => arr.map(([t, emo, tr]) => ({ t, emo, trans: tr ?? 0.12 }));
const PERF = new Map([
  [KING, new Performer(1, { intensity: 1.55, auto: false }).beats(B([[0, 'smug'], [0.9, 'shock', 0.06], [1.6, 'angry'], [3.4, 'gasp'], [4.9, 'proud'], [6.2, 'smug'], [7.2, 'determined'], [8.2, 'proud'], [9.3, 'joy'], [10.8, 'determined'], [12.4, 'grin'], [13.58, 'shock', 0.06], [14.4, 'awe'], [15.26, 'panic', 0.06], [16.2, 'angry'], [17.6, 'suspicious'], [18.66, 'curious'], [20.5, 'smug'], [21.2, 'gasp'], [22.6, 'suspicious'], [24.92, 'shock', 0.06], [26.4, 'awe'], [28.0, 'gasp'], [30.62, 'joy', 0.08], [31.3, 'laugh'], [32.0, 'curious'], [36.0, 'awe'], [41.68, 'proud'], [43.36, 'laugh'], [45.38, 'happy'], [45.94, 'shock', 0.06], [46.3, 'cry']]))],
  [CARP, new Performer(2, { intensity: 1.5, auto: false }).beats(B([[0, 'calm'], [16.62, 'smug'], [17.6, 'determined'], [18.66, 'happy'], [19.7, 'proud'], [21.2, 'grin'], [23.12, 'sneaky'], [24.24, 'determined', 0.06], [24.92, 'awe'], [26.4, 'joy'], [28.0, 'proud'], [30.62, 'laugh'], [31.3, 'smug'], [32.1, 'pensive'], [34.44, 'happy'], [36.46, 'proud'], [38.5, 'grin'], [41.0, 'joy'], [43.36, 'laugh']]))],
  [CAPT, new Performer(3, { intensity: 1.55, auto: false }).beats(B([[0, 'stern'], [10.82, 'angry', 0.08], [12.4, 'determined'], [13.04, 'angry'], [13.58, 'shock', 0.06], [14.3, 'gasp'], [16.62, 'suspicious'], [21.2, 'smug'], [24.92, 'shock'], [26.4, 'awe'], [30.62, 'joy'], [32.08, 'angry'], [34.44, 'tired'], [43.36, 'joy']]))],
  [CHEF, new Performer(4, { intensity: 1.5, auto: false }).beats(B([[0, 'happy'], [29.0, 'smug'], [30.0, 'curious'], [30.62, 'shock', 0.06], [31.1, 'gasp']]))],
]);
GUARDS.forEach((P, i) => PERF.set(P, new Performer(10 + i, { intensity: 1.5, auto: false }).beats(B([[0, 'stern'], [27.7, 'curious'], [28.0, 'shock', 0.06], [28.9, 'gasp']]))));
SOL.forEach((P, i) => PERF.set(P, new Performer(30 + i, { intensity: 1.45, auto: false }).beats(B([[0, 'determined'], [9.3, 'proud'], [10.82, 'determined'], [11.6, 'nervous'], [12.4, 'angry'], [13.04, 'panic'], [13.58, 'shock', 0.06], [14.2, 'blank'], [15.26, 'gasp'], [16.62, 'curious'], [21.2, 'awe'], [24.92, 'shock'], [26.4, 'awe'], [30.62, 'laugh'], [31.4, 'happy'], [32.08, 'tired'], [33.0, 'nervous'], [34.44, 'curious'], [43.36, 'laugh'], [44.4, 'joy']]))));
const pose = (P, t, o = {}) => toonify({ ...PERF.get(P).at(t, { handsFree: o.hands ?? true, walking: !!o.walk }), t }, P, t);
const UP = (p, t, ph = 0) => { p.armL = { f: 120 + 15 * Math.sin(t * 13 + ph), o: -70, b: 10 }; p.armR = { f: 120 + 15 * Math.sin(t * 13 + ph + 1.3), o: -70, b: 10 }; };
const place = (P, x, z, yaw, y = 0) => { P.root.visible = true; P.root.position.set(x, y, z); P.root.quaternion.setFromEuler(new THREE.Euler(0, yaw, 0)); };
const SLOT = (k) => V(-10.6 - Math.floor(k / 2) * 0.72, 0, k % 2 ? 0.36 : -0.36);
const FORM = (k) => SLOT(k);
const CROWD = (k) => V(-12.8 - (k % 5) * 1.0 - Math.floor(k / 10) * 0.45, 0, -0.9 - Math.floor(k / 5) * 0.95 + (k % 2) * 0.15);
const joinT = (k) => (k < 6 ? 10.82 : k < 12 ? 12.4 : 13.04);
const ropeY = (x) => lerp(ROPE_END.y, 0.72, clamp((x - ROPE_END.x) / 6.6, 0, 1));

// ======================= PER FRAME =======================
let SHAKE = 0, FLASH = 0;
function setup(f) {
  const t = f / FPS; for (const P of ALL) P.root.visible = false; SHAKE = 0; FLASH = 0;
  for (const [ti, k] of [[13.58, 0.9], [15.9, 1.3], [25.3, 0.8], [30.62, 1.1], [41.68, 0.9]]) { const a = t - ti; if (a > 0 && a < 0.7) { SHAKE += k * Math.exp(-a * 6); FLASH = Math.max(FLASH, 0.25 * k * Math.exp(-a * 12)); } }
  CFLAG.rotation.y = 0.2 * Math.sin(t * 4); BANNERS.forEach((b, i) => (b.rotation.z = 0.04 * Math.sin(t * 3 + i)));
  FIRE.forEach((fm, i) => { fm.scale.set(1, 0.8 + 0.3 * Math.abs(Math.sin(t * 9 + i * 2)), 1); });
  STEAM.forEach((m, i) => { const a = (t * 0.6 + i / 6) % 1; m.position.set(POT.x + Math.sin(i * 2 + t) * 0.25, 1.1 + a * 1.6, POT.z + Math.cos(i * 3 + t) * 0.2); m.scale.setScalar(0.5 + a * 1.2); m.visible = true; });
  // ---- catapult + its rock + rope ----
  const ca = catAng(t); CARM.rotation.z = -ca * Math.PI / 180; CAT.updateMatrixWorld(true); const cupW = CUP.localToWorld(V(0, 0.2, 0));
  if (t < 13.7) CROCK.position.copy(cupW); else if (t < 15.9) { const u = (t - 13.7) / 2.2; const a = CUP.localToWorld(V(0, 0.2, 0)); const p0 = V(-9.9, 1.6, 0), p1 = V(TENT_P.x, 2.5, TENT_P.z); CROCK.position.set(lerp(p0.x, p1.x, u), lerp(p0.y, p1.y, u) + 9 * 4 * u * (1 - u), lerp(p0.z, p1.z, u)); CROCK.rotation.set(t * 6, t * 4, 0); }
  else if (t < 45.38 || true) CROCK.position.set(TENT_P.x + 0.1, 0.62, TENT_P.z + 0.2);
  CROCK.visible = !(t >= 32.0 && t < 34.44);
  const tentSq = t < 15.9 ? 1 : lerp(1, 0.22, EASE.outBack(clamp((t - 15.9) / 0.35, 0, 1))); TENT.scale.set(1 + (1 - tentSq) * 0.5, tentSq, 1 + (1 - tentSq) * 0.5);
  const roping = (t >= 10.6 && t < 13.58) || (t >= 32.0 && t < 34.44); ROPE.visible = roping; ROPE2.visible = t >= 13.58 && t < 14.6;
  const armTip = CARM.localToWorld(V(0, 1.6, 0)); if (ROPE.visible) seg(ROPE, armTip, ROPE_END);
  if (ROPE2.visible) { const a = t - 13.58; seg(ROPE2, ROPE_END, ROPE_END.clone().add(V(2.4, 0.5 - a * 2.5, 0.2 * Math.sin(a * 20))).setY(Math.max(0.05, 0.5 - a * 2.5))); }
  // ---- trebuchet (hidden while 'not built yet') ----
  const built = (k) => t < 4.9 || t >= k; const pop = (k) => (t < 4.9 || t > k + 0.35 ? 1 : Math.max(0.01, EASE.outBack(clamp((t - k) / 0.35, 0, 1))));
  TREB.visible = built(17.34); TREB.scale.set(1, pop(17.34), 1);
  const phi = phiAt(t); BEAM.visible = built(18.66); BEAM.rotation.z = phi * Math.PI / 180; BEAM.scale.setScalar(pop(18.66));
  const cwEnd = PIV.clone().add(V(Math.cos((phi + 180) * Math.PI / 180) * LS, Math.sin((phi + 180) * Math.PI / 180) * LS, 0));
  CW.visible = built(21.2); CW.position.copy(cwEnd); if (t >= 21.2 && t < 21.7) CW.position.y += (1 - EASE.outCubic((t - 21.2) / 0.5)) * 8;
  const sl = slingEnd(t, phi); SLING.visible = POUCH.visible = built(19.7); seg(SLING, sl.tip, sl.end); POUCH.position.copy(sl.end);
  TROCK.visible = built(19.7) && t < 30.62 || (t >= 30.62 && t < 31.4); if (t < REL) TROCK.position.copy(sl.end); else if (t < 30.62) { TROCK.position.copy(rockAt(t)); TROCK.rotation.set(t * 8, t * 5, 0); } else TROCK.position.set(POT.x, 0.85, POT.z);
  if (t >= 34.44) TROCK.visible = false;
  PIN.visible = built(21.2) && t < 24.6; if (t < 24.24) { PIN.position.copy(PIN_P); PIN.rotation.set(0, 0, Math.PI / 2); }
  TRAIL.forEach((m, i) => { const ti = 38.7 + i * 0.09; m.visible = t >= ti && t < 41.7; if (m.visible) m.position.copy(tipAt(phiAt(ti))); });
  BANNER.visible = t >= 41.68; BANNER.scale.setScalar(t < 42.05 ? Math.max(0.01, EASE.outBack(clamp((t - 41.68) / 0.35, 0, 1))) : 1);
  // soup splash
  SOUP.forEach((m, i) => { const a = t - 30.62; m.visible = a > 0 && a < 1.3; if (!m.visible) return; const ang = hash(i) * 6.28, sp = 1.2 + hash(i + 3) * 2.4, up = 3 + hash(i + 7) * 3; m.position.set(POT.x + Math.cos(ang) * sp * a, Math.max(0.05, 1.0 + up * a - 4.9 * a * a), POT.z + Math.sin(ang) * sp * a); });
  // ---- soldiers ----
  SOL.forEach((P, k) => { let p, pos, yaw = Math.PI / 2;
    if (t < 4.9) { pos = FORM(k); p = pose(P, t); }
    else if (t < 8.2) { const f0 = FORM(k); pos = f0.clone().add(V(-9 * (1 - (t - 4.9) / 3.3), 0, 0)); p = pose(P, t, { walk: true }); p.walk = t * 1.9 + (k % 2) * 0.5; p.walkK = 1; p.gait = 1; p.cyc = 0.75; p.armL = { f: 28 * Math.sin(p.walk * 6.283 + Math.PI), o: -14, b: 10 }; p.armR = { f: 28 * Math.sin(p.walk * 6.283), o: -14, b: 10 }; }
    else if (t < 13.58) { const jt = joinT(k); if (t < jt) { pos = SLOT(k); p = pose(P, t); } else { pos = SLOT(k); p = pose(P, t, { hands: false }); const ry = ropeY(pos.x); for (const [h, dx] of [['L', 0.14], ['R', -0.1]]) p['hand' + h] = { w: V(pos.x + dx, ry, 0), k: 1 }; p.reachAssist = false; p.lean = (p.lean || 0) - 12 - 4 * Math.sin(t * 9 + k); p.stanceZ = [0.12, -0.12]; } }
    else if (t < 16.62) { pos = SLOT(k).add(V(-0.4, 0, 0)); p = pose(P, t); const tilt = 75 * EASE.outCubic(clamp((t - 13.58) / 0.3, 0, 1)) * (1 - sstep(15.3, 16.3, t)); P.root.visible = true; P.root.position.copy(pos); P.root.quaternion.setFromEuler(new THREE.Euler(0, yaw, 0)).multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), -tilt * Math.PI / 180)); p.armL = { f: 90, o: -40, b: 10 }; p.armR = { f: 90, o: -40, b: 10 }; P.update(p); return; }
    else if (t >= 32.0 && t < 34.44 && k < 6) { pos = SLOT(k); p = pose(P, t, { hands: false }); const ry = ropeY(pos.x); for (const [h, dx] of [['L', 0.14], ['R', -0.1]]) p['hand' + h] = { w: V(pos.x + dx, ry, 0), k: 1 }; p.reachAssist = false; p.lean = (p.lean || 0) - 10 + 4 * Math.sin(t * 7 + k); }
    else { pos = CROWD(k); yaw = Math.atan2(TB.x - pos.x, TB.z - pos.z) * 0.4 + Math.PI / 2 * 0.6; p = pose(P, t); if ((t >= 30.62 && t < 31.4) || (t >= 43.36 && t < 45.4)) UP(p, t, k); if (t >= 24.92 && t < 26.3) { p.armL = { f: 140, o: -50, b: 30 }; p.armR = { f: 140, o: -50, b: 30 }; } }
    place(P, pos.x, pos.z, yaw); P.update(p); });
  // ---- captain ----
  { const P = CAPT; let p, x, z, yaw;
    if (t < 16.62) { x = -9.4; z = 1.35; yaw = -Math.PI / 2 - 0.4; p = pose(P, t); if (t >= 10.82 && t < 13.58) { p.armL = { f: 95 + 35 * Math.sin(t * 10), o: -30, b: 5 }; p.armR = { f: 60, o: -20, b: 90 }; } if (t >= 13.58 && t < 14.6) { p.armL = { f: 140, o: -50, b: 30 }; p.armR = { f: 140, o: -50, b: 30 }; } }
    else if (t >= 32.0 && t < 34.44) { x = -9.4; z = 1.35; yaw = -Math.PI / 2 - 0.4; p = pose(P, t); p.armL = { f: 95 + 35 * Math.sin(t * 10), o: -30, b: 5 }; }
    else { x = -11.0; z = 0.9; yaw = Math.atan2(TB.x - x, TB.z - z); p = pose(P, t); if (t >= 43.36 && t < 45.3) UP(p, t, 2); }
    place(P, x, z, yaw); P.update(p); }
  // ---- king ----
  { const P = KING; let p, x, z, yaw;
    if (t < 4.9) { x = -12.0; z = 2.0; yaw = Math.PI / 2; } else if (t < 16.62) { x = -12.6; z = 2.5; yaw = Math.PI / 2 - 0.25; } else if (t < 45.38) { x = -10.2; z = -1.4; yaw = Math.atan2(TB.x - x, TB.z - z) + 0.3; } else { x = -13.0; z = 2.3; yaw = 0.6; }
    p = pose(P, t); if (t >= 6.2 && t < 8.2) { p.armL = { f: 95, o: -25, b: 5 }; } if (t >= 15.26 && t < 16.6) { p.armL = { f: 140, o: -50, b: 30 }; p.armR = { f: 140, o: -50, b: 30 }; }
    if ((t >= 30.62 && t < 31.3) || (t >= 43.36 && t < 45.3)) UP(p, t, 1); if (t >= 46.0) { p.armL = { f: 60, o: -15, b: 110 }; p.armR = { f: 60, o: -15, b: 110 }; }
    if (t >= 22.6 && t < 23.12) { p.armL = { f: -5, o: -55, b: 115 }; p.armR = { f: -5, o: -55, b: 115 }; }
    place(P, x, z, yaw); P.update(p); }
  // ---- carpenter ----
  if (t >= 16.62) { const P = CARP; let p, x, z, yaw;
    if (t < 17.4) { const u = (t - 16.62) / 0.78; x = lerp(-11, -4.6, u); z = lerp(-1.6, -3.4, u); yaw = Math.atan2(-4.6 - -11, -3.4 - -1.6); p = pose(P, t, { walk: true }); p.walk = t * 2.2; p.walkK = 1; p.gait = 1.1; p.cyc = 0.75; }
    else if (t < 23.0) { x = -4.6; z = -3.45; yaw = Math.PI; p = pose(P, t, { hands: false }); const hm = Math.abs(Math.sin(t * 7)); p.armR = { f: 70 + 70 * hm, o: -20, b: 40 }; p.armL = { f: 60, o: -15, b: 60 }; }
    else if (t < 31.3) { x = lerp(-4.6, -7.75, sstep(23.0, 23.3, t)); z = lerp(-3.45, -3.7, sstep(23.0, 23.3, t)); yaw = Math.PI; p = pose(P, t, { hands: false });
      if (t < 24.24) p.handR = { w: PIN_P.clone().add(V(0.12, 0, 0.05)), k: sstep(23.1, 23.4, t) }; else if (t < 24.6) { p.handR = { w: PIN_P.clone().add(V(0.25, 0.3 * (t - 24.24) / 0.36, 0.5 * (t - 24.24) / 0.36)), k: 1 }; } if (t >= 26.4 && t < 31.3 && (t > 30.62)) UP(p, t); }
    else { x = -7.4; z = -2.6; yaw = 0.9 * Math.PI; p = pose(P, t); if (t >= 31.3 && t < 32.0) p.armR = { f: 95, o: -25, b: 5 }; if (t >= 34.44 && t < 36.4) p.armL = { f: 110, o: -25, b: 5 }; if (t >= 38.5 && t < 41.0) p.armR = { f: 125, o: -20, b: 5 }; if (t >= 41.0 && t < 41.7) UP(p, t); if (t >= 43.36 && t < 45.3) UP(p, t, 0.6); }
    place(P, x, z, yaw); P.update(p); if (t >= 24.24 && t < 24.6) { PIN.position.copy(P.palmWorld('R')); } }
  // ---- castle guards + chef ----
  GUARDS.forEach((P, i) => { const p = pose(P, t); const look = sstep(27.6, 28.0, t) * (1 - sstep(29.4, 30.2, t)); p.head = { ...(p.head || {}), pitch: (p.head?.pitch || 0) - 40 * look, yaw: (p.head?.yaw || 0) + 70 * sstep(28.1, 29.0, t) * (i ? -1 : 1) * 0 }; if (look > 0.5) { p.armL = { f: 140, o: -50, b: 30 }; p.armR = { f: 140, o: -50, b: 30 }; } place(P, 30.25, i ? 2.2 : -2.2, -Math.PI / 2, 4.6); P.update(p); });
  { const P = CHEF; const p = pose(P, t, { hands: false }); if (t < 30.62) p.handR = { w: V(POT.x + 0.2 * Math.cos(t * 4), 1.05, POT.z + 0.35 + 0.15 * Math.sin(t * 4)), k: 1 }; else { p.armL = { f: 140, o: -50, b: 30 }; p.armR = { f: 140, o: -50, b: 30 }; } p.reachAssist = false; place(P, POT.x, POT.z + 1.15, Math.PI); P.update(p); }
  return { t };
}

// ======================= CAMERA: a new moving shot about every second =======================
const CINE = new Cine({ blend: 0.32 }); const P = CT.pt;
const catTarget = P(-8.6, 1.4, 0), trebMid = P(-5.5, 2.4, -5), castle = P(30, 4.5, 0), rope = P(-12.4, 0.7, 0);
const S = [
  [0.0, 1.0, { rig: 'fly', path: [[40, 14, 4], [26, 8, 3]], at: P(10, 2, 0), fov: [44, 38], shake: 0.25 }],
  [1.0, 1.9, { rig: 'orbit', at: catTarget, size: [4.5, 3.6], az: [60, 110], el: [10, 8], fov: 36, shake: 0.35 }],
  [1.9, 2.9, { rig: 'push', at: castle, size: [12, 8], az: [-80, -95], el: [6, 4], fov: 36, shake: 0.35, cut: true }],
  [2.9, 3.6, { rig: 'push', at: () => CW.position.clone(), size: [3.4, 1.8], az: [40, 20], el: [18, 10], fov: 34, shake: 0.6, ease: 'snap', fovKick: 8, cut: true }],
  [3.6, 4.6, { rig: 'crane', at: trebMid, size: [5, 8], az: [50, 80], el: [-6, 25], fov: 36, shake: 0.3 }],
  [4.6, 5.6, { rig: 'orbit', at: () => KING.headWorld(), size: [1.8, 1.4], az: [70, 110], el: [8, 6], fov: 32, shake: 0.4, cut: true }],
  [5.6, 6.6, { rig: 'track', at: () => SOL[4].root.position.clone().add(V(0, 0.7, 0)), size: [3.6, 3.0], az: [20, 70], el: [12, 8], fov: 34, shake: 0.5 }],
  [6.6, 7.2, { rig: 'orbit', at: () => SOL[1].root.position.clone().add(V(0, 0.5, 0)), size: [2.0, 1.7], az: [80, 45], el: [8, 10], fov: 34, shake: 0.5 }],
  [7.2, 8.2, { rig: 'fly', path: [[-14, 3.5, 3], [-6, 6.5, 1]], at: castle, fov: [40, 32], shake: 0.3 }],
  [8.2, 9.3, { rig: 'push', at: catTarget, size: [4.0, 2.6], az: [40, 20], el: [14, 10], fov: 34, shake: 0.4, cut: true }],
  [9.3, 10.82, { rig: 'orbit', at: () => KING.headWorld().lerp(CAPT.headWorld(), 0.5), size: [3.2, 2.6], az: [120, 60], el: [10, 8], fov: 32, shake: 0.4 }],
  [10.82, 11.6, { rig: 'orbit', at: P(-12.0, 0.75, 0), size: [3.0, 2.6], az: [140, 118], el: [12, 10], fov: 34, shake: 0.6 }],
  [11.6, 12.4, { rig: 'push', at: () => CAPT.headWorld(), size: [1.7, 1.2], az: [-135, -110], el: [8, 5], fov: 30, shake: 0.8, ease: 'snap', fovKick: 6 }],
  [12.4, 13.04, { rig: 'orbit', at: P(-13.0, 0.8, 0), size: [5.0, 4.4], az: [-20, 15], el: [22, 18], fov: 34, shake: 0.7 }],
  [13.04, 13.58, { rig: 'crane', at: rope, size: [4, 6.5], az: [10, 30], el: [30, 65], fov: 36, shake: 0.6 }],
  [13.58, 14.2, { rig: 'push', at: () => ROPE_END.clone().add(V(1.5, 0.4, 0)), size: [2.4, 1.8], az: [10, 30], el: [10, 8], fov: 34, shake: 1.2, ease: 'snap', fovKick: 10, cut: true }],
  [14.2, 15.1, { rig: 'orbit', at: () => CROCK.position.clone(), size: [4, 5], az: [100, 140], el: [-10, 0], fov: 36, shake: 0.4 }],
  [15.1, 15.8, { rig: 'push', at: () => KING.headWorld(), size: [1.6, 1.1], az: [60, 80], el: [-6, -4], fov: 30, shake: 0.6, ease: 'snap', cut: true }],
  [15.8, 16.62, { rig: 'orbit', at: P(TENT_P.x, 0.9, TENT_P.z), size: [5.5, 4.5], az: [40, 80], el: [10, 14], fov: 36, shake: 1.0 }],
  [16.62, 17.6, { rig: 'track', at: () => CARP.root.position.clone().add(V(0, 0.7, 0)), size: [3.0, 2.6], az: [60, 100], el: [10, 8], fov: 34, shake: 0.4, cut: true }],
  [17.6, 18.66, { rig: 'orbit', at: () => CARP.headWorld(), size: [1.6, 1.3], az: [150, 200], el: [10, 6], fov: 32, shake: 0.4 }],
  [18.66, 19.6, { rig: 'crane', at: trebMid, size: [5, 7], az: [40, 70], el: [4, 30], fov: 36, shake: 0.3 }],
  [19.6, 20.5, { rig: 'push', at: () => POUCH.position.clone(), size: [2.0, 1.3], az: [30, 60], el: [20, 14], fov: 32, shake: 0.4 }],
  [20.5, 21.2, { rig: 'orbit', at: () => CARP.headWorld(), size: [1.8, 1.5], az: [200, 160], el: [8, 10], fov: 32, shake: 0.5 }],
  [21.2, 22.6, { rig: 'crane', at: () => CW.position.clone().add(V(0, -0.6, 0)), size: [3.4, 4.8], az: [80, 40], el: [-10, 20], fov: 36, shake: 0.6 }],
  [22.6, 23.12, { rig: 'push', at: () => KING.headWorld().lerp(CAPT.headWorld(), 0.5), size: [2.4, 1.7], az: [60, 40], el: [6, 4], fov: 32, shake: 0.5, ease: 'snap' }],
  [23.12, 24.24, { rig: 'push', at: () => PIN_P.clone().add(V(0.1, 0.2, 0.3)), size: [1.6, 1.0], az: [125, 145], el: [24, 16], fov: 30, shake: 0.3, cut: true }],
  [24.24, 24.9, { rig: 'push', at: () => CARP.headWorld(), size: [1.4, 1.0], az: [165, 185], el: [6, 4], fov: 30, shake: 0.8, ease: 'snap', fovKick: 8 }],
  [24.9, 25.6, { rig: 'low', at: () => CW.position.clone().add(V(0, -0.6, 0)), size: [2.6, 3.4], az: [60, 90], fov: 36, shake: 0.8 }],
  [25.6, 26.4, { rig: 'orbit', at: trebMid, size: [7, 9], az: [80, 40], el: [8, 12], fov: 38, shake: 0.9 }],
  [26.4, 27.4, { rig: 'track', at: () => TROCK.position.clone(), size: [5, 6], az: [-30, 0], el: [-20, -10], fov: 38, shake: 0.4 }],
  [27.4, 28.3, { rig: 'track', at: () => TROCK.position.clone(), size: [7, 10], az: [-70, -95], el: [32, 22], fov: 38, shake: 0.4 }],
  [28.3, 29.0, { rig: 'orbit', at: () => GUARDS[0].headWorld(), size: [2.4, 2.0], az: [-115, -80], el: [20, 14], fov: 34, shake: 0.6, cut: true }],
  [29.0, 29.7, { rig: 'pov', from: () => V(lerp(48, 47, (CINE._t - 29.0) / 0.7), lerp(15, 13, (CINE._t - 29.0) / 0.7), 15), at: () => V(42.5, 7.5, 0), fov: 44, shake: 0.3, cut: true }],
  [29.7, 30.4, { rig: 'push', at: () => CHEF.headWorld().lerp(V(POT.x, 1.0, POT.z), 0.4), size: [2.0, 1.5], az: [150, 130], el: [14, 10], fov: 32, shake: 0.3 }],
  [30.4, 31.3, { rig: 'orbit', at: P(POT.x, 1.2, POT.z), size: [3.0, 3.4], az: [120, 70], el: [14, 18], fov: 34, shake: 1.0, fovKick: 8 }],
  [31.3, 32.0, { rig: 'push', at: () => CARP.headWorld(), size: [1.6, 1.2], az: [150, 170], el: [6, 4], fov: 30, shake: 0.4, cut: true }],
  [32.0, 33.0, { rig: 'orbit', at: rope, size: [4.4, 4.0], az: [-25, 10], el: [16, 12], fov: 34, shake: 0.5, cut: true }],
  [33.0, 34.44, { rig: 'orbit', at: () => SOL[1].headWorld(), size: [2.4, 2.0], az: [50, 70], el: [20, 16], fov: 32, shake: 0.4 }],
  [34.44, 35.9, { rig: 'low', at: () => CW.position.clone().add(V(0, -0.5, 0)), size: [3.2, 4.2], az: [70, 110], fov: 36, shake: 0.4, cut: true }],
  [35.9, 36.46, { rig: 'push', at: () => CARP.headWorld(), size: [1.6, 1.1], az: [165, 185], el: [6, 4], fov: 30, shake: 0.4, ease: 'snap' }],
  [36.46, 38.6, { rig: 'orbit', at: () => CW.position.clone().add(V(0, -0.5, 0)), size: [2.6, 2.2], az: [120, 60], el: [10, 14], fov: 34, shake: 0.4 }],
  [38.6, 40.0, { rig: 'crane', at: trebMid, size: [8, 11], az: [80, 100], el: [6, 18], fov: 38, shake: 0.3, cut: true }],
  [40.0, 41.0, { rig: 'orbit', at: () => tipAt(phiAt(40.3)), size: [8, 7], az: [140, 110], el: [10, 14], fov: 36, shake: 0.4 }],
  [41.0, 41.68, { rig: 'push', at: () => CARP.headWorld(), size: [1.6, 1.2], az: [170, 190], el: [6, 4], fov: 30, shake: 0.5, ease: 'snap' }],
  [41.68, 43.2, { rig: 'push', at: P(-9.5, 2.0, -1.6), size: [6.0, 4.6], az: [25, 15], el: [6, 4], fov: 34, shake: 0.8, ease: 'snap', fovKick: 8 }],
  [43.2, 44.2, { rig: 'crane', at: () => SOL[7].root.position.clone().add(V(0, 0.6, 0)), size: [4.5, 7], az: [90, 60], el: [10, 50], fov: 36, shake: 0.4 }],
  [44.2, 44.9, { rig: 'push', at: () => KING.headWorld(), size: [1.6, 1.1], az: [150, 130], el: [6, 4], fov: 30, shake: 0.4 }],
  [44.9, 45.38, { rig: 'orbit', at: () => KING.headWorld(), size: [1.5, 1.2], az: [130, 165], el: [6, 4], fov: 30, shake: 0.5 }],
  [45.38, 46.4, { rig: 'orbit', at: P(TENT_P.x + 0.6, 0.9, TENT_P.z - 0.8), size: [4.0, 3.2], az: [20, 50], el: [10, 8], fov: 34, shake: 0.4, cut: true }],
  [46.4, 47.7, { rig: 'crane', at: () => KING.headWorld(), size: [1.6, 10], az: [40, 70], el: [6, 50], fov: 36, shake: 0.2 }],
];
for (const [a, b, s] of S) CINE.shot(a, b, s);
const LOOK = mkLook({ sun: [0.55, 0.75, 0.45], lit: '#fff0d4', litK: 1.08, shade: '#a8b0d8', ambSky: '#eef2ff', ambGnd: '#f8eed0', rim: '#ffecc8', fog: '#e4ecf8', fogR: [60, 360], sky: ['#3a80e0', '#80bcf0', '#f8e0c0', '#ffffff'], contrast: 1.06, vig: 0.1, glow: 0.4, grain: 0, desat: 0, sat: 1.2, lo: '#f8f8ff', hi: '#fff8e8', exposure: 1.05, shadow: 0.8 });
window.renderFrame = function (f) {
  const { t } = setup(f); CINE._t = t; const cam = guardCam(CINE.at(t)); const sh = SHAKE; if (sh > 0) { cam.pos[0] += 0.05 * sh * Math.sin(t * 91); cam.pos[1] += 0.06 * sh * Math.sin(t * 77 + 1); cam.roll += 0.02 * sh * Math.sin(t * 63); }
  CAMPOS.set(...cam.pos); for (const Pp of ALL) placeMarks(Pp, t);
  applyLook(LOOK, { shadowCenter: [clamp(cam.look[0], -20, 50), 1.5, clamp(cam.look[2], -10, 10)], shadowSize: 24 }); C.skyU.uSunSize.value = 0;
  C.setCam({ pos: cam.pos, look: cam.look, fov: cam.fov, roll: cam.roll, near: 0.04, far: 800 });
  dofU.uFocus.value = cam.focus; dofU.uAper.value = cam.ap * PX * 0.6; dofU.uMaxC.value = 10 * PX; dofU.uTime.value = f * 0.37;
  dofU.uFade.value = 1 - Math.min(1, t / 0.4) + Math.max(0, (t - (DURATION - 0.9)) / 0.9); dofU.uFlash.value = FLASH;
  C.drawFrame(); return 'ok';
};
window.ready = true;
