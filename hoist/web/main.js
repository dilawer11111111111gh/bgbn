// "ONE MAN LIFTED A HORSE" (block and tackle) : 46.0 s. Voice = audio/voice_clean.mp3. Beats keyed to words.json.
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
const { stage, dofU, FPS, PX } = C; export const DURATION = 46.0;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z); const tm = (h, o = {}) => C.toon({ color: new THREE.Color(h), ...o });
const ctex = (w, h, fn, rep = false) => { const c = mkCanvas(w, h); fn(c.getContext('2d'), w, h); return toTex(c, rep); };
const W = new THREE.Group(); stage.world.add(W); W.add(C.makeSky()); setGround(() => 0);
const seg = (m, a, b) => { const d = b.clone().sub(a); m.position.copy(a).addScaledVector(d, 0.5); m.scale.set(1, Math.max(0.001, d.length()), 1); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); };
const cardMesh = (w, h, draw, unlit = 0.6) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), tm(0xffffff, { map: ctex(Math.round(256 * w / h), 256, draw), unlit, noInk: 1, side: THREE.DoubleSide }));
const textCard = (w, h, lines, bg, fg, font) => cardMesh(w, h, (g, cw, ch) => { g.fillStyle = bg; g.fillRect(0, 0, cw, ch); g.strokeStyle = fg; g.lineWidth = 10; g.strokeRect(6, 6, cw - 12, ch - 12); g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; lines.forEach((l, i) => g.fillText(l, cw / 2, ch / 2 + (i - (lines.length - 1) / 2) * ch * 0.42)); });

// ======================= LAND + COURTYARD (x<0) + WALL (x=0) =======================
const grassTex = ctex(256, 256, (g, w, h) => { g.fillStyle = '#86c050'; g.fillRect(0, 0, w, h); for (let i = 0; i < 1400; i++) { const s = hash(i + 3.3); g.fillStyle = s < 0.5 ? 'rgba(70,140,40,0.5)' : 'rgba(180,220,100,0.45)'; g.fillRect(hash(i) * w, hash(i + 7.1) * h, 2 + s * 3, 6 + s * 10); } }, true);
W.add(box(400, 0.1, 400, tm(0xffffff, { map: grassTex, repeat: [80, 80] }), 0, -0.05, 0));
const cobTex = ctex(256, 256, (g, w, h) => { g.fillStyle = '#b8a68a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 120; i++) { g.fillStyle = hash(i) < 0.5 ? '#a8967a' : '#c8b89a'; g.beginPath(); g.ellipse(hash(i + 1) * w, hash(i + 2) * h, 10 + hash(i + 3) * 8, 7 + hash(i + 4) * 5, hash(i) * 3, 0, 7); g.fill(); } }, true);
W.add(box(24, 0.04, 26, tm(0xffffff, { map: cobTex, repeat: [6, 7] }), -12.8, 0.01, 0));
const stoneTex = ctex(256, 256, (g, w, h) => { g.fillStyle = '#8a8274'; g.fillRect(0, 0, w, h); const rows = 6, bh = h / rows; for (let r = 0; r < rows; r++) { const bw = w / 3, off = r % 2 ? bw / 2 : 0; for (let c = -1; c < 4; c++) { const x = c * bw + off + 3, y = r * bh + 3; const v = 180 + Math.floor(hash(r * 7 + c) * 40); g.fillStyle = `rgb(${v},${v - 8},${v - 22})`; g.fillRect(x, y, bw - 6, bh - 6); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x, y, bw - 6, 4); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x, y + bh - 10, bw - 6, 4); for (let k = 0; k < 18; k++) { g.fillStyle = hash(k + r * 31 + c * 7) < 0.5 ? 'rgba(90,80,70,0.25)' : 'rgba(255,250,235,0.18)'; g.fillRect(x + hash(k * 3 + c) * (bw - 10), y + hash(k * 5 + r) * (bh - 10), 3, 3); } } } }, true);
const woodTex = ctex(128, 256, (g, w, h) => { g.fillStyle = '#9a6a3a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 26; i++) { g.strokeStyle = hash(i) < 0.5 ? 'rgba(90,55,25,0.55)' : 'rgba(200,150,95,0.35)'; g.lineWidth = 1 + hash(i + 1) * 2; const x = hash(i + 2) * w; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= h; y += 16) g.lineTo(x + Math.sin(y * 0.04 + i) * 3, y); g.stroke(); } }, true);
const stone = tm(0xffffff, { map: stoneTex, repeat: [8, 3] }), stone2 = tm(0xffffff, { map: stoneTex, repeat: [1, 1] }), roofM = tm(0x2a5aa8);
const WH = 7.0; W.add(box(1.6, WH, 26, stone, 0, WH / 2, 0)); addSolidCentered('wall', 0, WH / 2, 0, 1.6, WH, 26);
for (let i = -12; i <= 12; i++) W.add(box(0.35, 0.6, 0.6, stone2, 0.62, WH + 0.3, i * 1.05));
for (const z of [-13.5, 13.5]) { W.add(cyl(2, 2.1, 10, stone2, 0, 5, z, 16)); W.add(cyl(0, 2.4, 3, roofM, 0, 11.5, z, 16)); addSolidCentered('tower' + z, 0, 5, z, 4.2, 10, 4.2); }
const FL = []; for (const z of [-13.5, 13.5]) { W.add(box(0.04, 1.6, 0.04, tm(0x3a2a1a), 0, 13.8, z)); const f = box(0.02, 0.55, 0.9, tm(0xf0c020), 0, 14.2, z + 0.45); W.add(f); FL.push(f); }
// courtyard houses
for (let i = 0; i < 6; i++) { const z = -11 + i * 4.4, x = -17 - (i % 2) * 2; W.add(box(3.6, 3.2, 3.6, tm([0xf0dcb8, 0xe8c8a0, 0xf4e4c8][i % 3]), x, 1.6, z)); const r = cyl(0, 2.9, 2.0, tm([0xb84a2a, 0x8a3a2a][i % 2]), x, 4.2, z, 4); r.rotation.y = Math.PI / 4; W.add(r); W.add(box(0.06, 1.4, 0.9, tm(0x5a3a1a), x + 1.81, 0.7, z)); addSolidCentered('house' + i, x, 1.6, z, 3.6, 3.2, 3.6); }
for (let i = 0; i < 18; i++) { const tr = new THREE.Group(); const x = 6 + hash(i) * 50, z = -40 + hash(i + 3) * 80; tr.position.set(x, 0, z); tr.add(cyl(0.2, 0.28, 2.6, tm(0x7a5a3a), 0, 1.3, 0, 8)); for (let k = 0; k < 5; k++) tr.add(sph(1.0 + hash(i + k) * 0.4, tm([0x3f9a3a, 0x5cb846][k % 2], { noInk: 1, band: 0.15 }), Math.cos(k * 2.3) * 0.8, 3 + hash(i * 3 + k), Math.sin(k * 2.3) * 0.8, 10, 8)); W.add(tr); }
for (let i = 0; i < 7; i++) { const cl = makeCloud(i + 160, 1.3); cl.position.set(-150 + i * 55, 55 + (i % 3) * 8, -140); W.add(cl); }
// beam on the wall top (cantilever over the courtyard), ladder, hay pile, banner
const wood = tm(0xffffff, { map: woodTex, repeat: [1, 3] }), woodD = tm(0xb08060, { map: woodTex, repeat: [1, 2] });
const BX = -1.35; W.add(box(2.4, 0.22, 0.26, wood, -0.55, 8.35, 0)); W.add(box(0.26, 1.2, 0.26, wood, 0.45, 7.6, 0)); { const br = box(0.18, 1.5, 0.18, woodD); seg(br, V(0.35, 7.05, 0), V(-1.1, 8.3, 0)); W.add(br); }
W.add(box(0.06, 7.4, 0.06, woodD, -0.95, 3.7, 1.7)); W.add(box(0.06, 7.4, 0.06, woodD, -0.95, 3.7, 2.3)); for (let i = 0; i < 18; i++) W.add(box(0.05, 0.05, 0.6, woodD, -0.95, 0.35 + i * 0.4, 2.0));
const HAY = new THREE.Group(); HAY.position.set(BX, 0, 1.25); W.add(HAY); for (let i = 0; i < 6; i++) { const h = sph(0.32, tm(0xf0c860, { band: 0.2 }), (hash(i) - 0.5) * 0.5, 0.15 + hash(i + 2) * 0.12, (hash(i + 4) - 0.5) * 0.4, 8, 6); h.scale.y = 0.6; HAY.add(h); }
const BANNER = textCard(4.2, 1.1, ['BLOCK AND TACKLE'], '#2a4a8a', '#ffd24a', 'bold 92px serif'); BANNER.rotation.y = -Math.PI / 2; BANNER.position.set(-0.82, 4.6, -3.4); W.add(BANNER);

// ======================= THE HORSE =======================
const HORSE = new THREE.Group(); W.add(HORSE); const hb = tm(0xa8683c, { band: 0.12 }), hd = tm(0x4a2a18), hw = tm(0xffffff, { unlit: 0.8, noInk: 1 }), hk = tm(0x111111, { unlit: 1, noInk: 1 }), hm = tm(0x3a2014);
const HBODY = new THREE.Group(); HBODY.position.y = 0.98; HORSE.add(HBODY); { const b = sph(1, hb, 0, 0, 0, 24, 16); b.scale.set(0.3, 0.34, 0.72); HBODY.add(b); const r = sph(1, hb, 0, 0.02, -0.42, 18, 12); r.scale.set(0.31, 0.33, 0.34); HBODY.add(r); const c = sph(1, hb, 0, 0.04, 0.42, 18, 12); c.scale.set(0.3, 0.34, 0.32); HBODY.add(c); }
const NECK = new THREE.Group(); NECK.position.set(0, 0.16, 0.5); HBODY.add(NECK); { const n = cyl(0.13, 0.19, 0.78, hb, 0, 0.32, 0.1, 16); n.rotation.x = 0.5; NECK.add(n); for (let i = 0; i < 7; i++) { const m = box(0.06, 0.16, 0.1, hm, 0, 0.12 + i * 0.1, -0.08 + i * 0.045); m.rotation.x = 0.5; NECK.add(m); } }
const HEAD = new THREE.Group(); HEAD.position.set(0, 0.68, 0.32); NECK.add(HEAD); { const h1 = sph(1, hb, 0, 0, 0.05, 18, 12); h1.scale.set(0.15, 0.16, 0.2); HEAD.add(h1); const mz = cyl(0.11, 0.14, 0.42, hb, 0, -0.06, 0.3, 14); mz.rotation.x = Math.PI / 2 + 0.25; HEAD.add(mz); const nose = sph(1, tm(0xc89068), 0, -0.1, 0.5, 14, 10); nose.scale.set(0.12, 0.1, 0.09); HEAD.add(nose); }
const JAW = box(0.2, 0.05, 0.16, hd, 0, -0.18, 0.42, 0.02); HEAD.add(JAW); for (const s of [-1, 1]) { const ear = cyl(0, 0.05, 0.16, hb, s * 0.08, 0.2, -0.02, 8); ear.rotation.z = -s * 0.2; HEAD.add(ear); const e = sph(0.065, hw, s * 0.13, 0.05, 0.1, 12, 8); e.scale.z = 0.6; HEAD.add(e); HEAD.add(sph(0.034, hk, s * 0.17, 0.05, 0.12, 8, 6)); HEAD.add(sph(0.012, hw, s * 0.18, 0.07, 0.135, 6, 4)); HEAD.add(sph(0.018, hk, s * 0.05, -0.08, 0.58, 6, 4)); }
const MOUTHHAY = new THREE.Group(); MOUTHHAY.position.set(0, -0.15, 0.56); HEAD.add(MOUTHHAY); for (let i = 0; i < 7; i++) { const st = box(0.012, 0.012, 0.3, tm(0xf0c860)); st.rotation.y = (i - 3) * 0.25; st.rotation.x = (hash(i) - 0.5) * 0.4; MOUTHHAY.add(st); }
const LEGS = []; for (const [x, z] of [[-0.15, 0.45], [0.15, 0.45], [-0.15, -0.45], [0.15, -0.45]]) { const l = new THREE.Group(); l.position.set(x, -0.18, z); HBODY.add(l); l.add(cyl(0.065, 0.085, 0.42, hb, 0, -0.18, 0, 10)); l.add(cyl(0.045, 0.06, 0.36, hb, 0, -0.55, 0, 10)); l.add(cyl(0.07, 0.065, 0.1, hd, 0, -0.76, 0.01, 10)); LEGS.push(l); }
const TAIL = new THREE.Group(); TAIL.position.set(0, 0.16, -0.72); HBODY.add(TAIL); for (let i = 0; i < 5; i++) { const t2 = cyl(0.03, 0.05, 0.55, hm, (i - 2) * 0.025, -0.25, -0.1, 6); t2.rotation.x = -0.35 - i * 0.05; TAIL.add(t2); }
HBODY.add(box(0.6, 0.12, 0.2, tm(0x6a3a1a), 0, 0.0, 0.25)); HBODY.add(box(0.6, 0.12, 0.2, tm(0x6a3a1a), 0, 0.0, -0.3)); const RING = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 14), tm(0xc0c0c8)); RING.position.set(0, 0.42, 0); HBODY.add(RING);
// ======================= PULLEY BLOCKS + ROPES =======================
const BLK = (n) => { const g = new THREE.Group(); g.add(box(0.12, 0.42, 0.62, woodD, 0, 0, 0, 0.04)); const wh = []; for (let i = 0; i < n; i++) { const w = new THREE.Group(); w.position.z = (i - (n - 1) / 2) * 0.22; const d = cyl(0.17, 0.17, 0.07, tm(0xc8964a), 0, 0, 0, 16); d.rotation.x = Math.PI / 2; w.add(d); w.add(cyl(0.04, 0.04, 0.09, tm(0x3a2a1a), 0, 0, 0, 8).rotateX(Math.PI / 2)); w.visible = false; g.add(w); wh.push(w); } W.add(g); return { g, wh }; };
const TOPB = BLK(2), BOTB = BLK(2); TOPB.g.add(box(0.04, 0.4, 0.04, tm(0x3a3a3a), 0, 0.35, 0));
const ropeM = tm(0xd8b070), glowM = tm(0xffd23a, { unlit: 1, noInk: 1 });
const RP = []; for (let i = 0; i < 8; i++) { const r = cyl(0.028, 0.028, 1, ropeM, 0, 0, 0, 6); W.add(r); RP.push(r); }
const COIL = new THREE.Group(); COIL.position.set(0.15, WH + 0.03, 1.05); W.add(COIL); const COILS = []; for (let i = 0; i < 9; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.12 + i * 0.035, 0.026, 6, 20), ropeM); t.rotation.x = Math.PI / 2; t.position.y = i * 0.012; COIL.add(t); COILS.push(t); }
const BAG = new THREE.Group(); W.add(BAG); { const b = sph(0.22, tm(0x9a7a4a), 0, 0, 0, 10, 8); b.scale.y = 1.2; BAG.add(b); BAG.add(cyl(0.03, 0.06, 0.12, tm(0x6a4a2a), 0, 0.28, 0, 8)); }
const FLY = [0, 1, 2, 3].map(() => { const g = new THREE.Group(); const d = cyl(0.17, 0.17, 0.07, tm(0xc8964a), 0, 0, 0, 16); d.rotation.x = Math.PI / 2; g.add(d); W.add(g); return g; });
const NUMS = [1, 2, 3, 4].map((n) => { const c = textCard(0.42, 0.42, [String(n)], '#ffd23a', '#1a1a1a', 'bold 180px sans-serif'); W.add(c); return c; });
const QUARTS = [0, 1, 2, 3].map(() => { const c = textCard(0.5, 0.42, ['¼'], '#ffffff', '#d82a2a', 'bold 200px sans-serif'); W.add(c); return c; });
const DOT = sph(0.09, glowM, 0, -50, 0, 10, 8); W.add(DOT);
const SWEAT = []; for (let i = 0; i < 20; i++) { const m = sph(0.035, tm(0x8ad0ff, { unlit: 0.6, noInk: 1 }), 0, -50, 0, 6, 4); m.scale.y = 1.5; W.add(m); SWEAT.push(m); }
const DUST = []; for (let i = 0; i < 16; i++) { const m = sph(0.12, tm(0xd8c8a8, { noInk: 1 }), 0, -50, 0, 8, 6); W.add(m); DUST.push(m); }
// easel + portrait on the wall top
const EASEL = new THREE.Group(); EASEL.position.set(0.1, WH, -4.0); W.add(EASEL); for (const s of [-1, 1]) { const l = box(0.05, 1.5, 0.05, woodD, 0, 0.75, s * 0.25); l.rotation.x = s * 0.15; EASEL.add(l); }
const CANVAS = new THREE.Group(); CANVAS.position.set(0, 1.15, 0); EASEL.add(CANVAS); CANVAS.add(box(0.04, 0.75, 0.9, tm(0x6a4a2a)));
{ const pic = cardMesh(0.85, 0.68, (g, w, h) => { g.fillStyle = '#8ac8f0'; g.fillRect(0, 0, w, h); g.fillStyle = '#b8ac98'; g.fillRect(0, h * 0.62, w, h); g.fillStyle = '#a0643a'; g.fillRect(w * 0.28, h * 0.32, w * 0.42, h * 0.22); g.fillRect(w * 0.62, h * 0.12, w * 0.12, h * 0.28); g.fillRect(w * 0.66, h * 0.08, w * 0.2, h * 0.1); for (const x of [0.3, 0.38, 0.6, 0.66]) g.fillRect(w * x, h * 0.52, w * 0.04, h * 0.14); g.fillStyle = '#f0c020'; g.beginPath(); g.moveTo(w * 0.66, h * 0.08); g.lineTo(w * 0.7, 0); g.lineTo(w * 0.74, h * 0.06); g.lineTo(w * 0.78, 0); g.lineTo(w * 0.82, h * 0.08); g.fill(); g.strokeStyle = '#d8b040'; g.lineWidth = 10; g.strokeRect(4, 4, w - 8, h - 8); }, 0.8);
  pic.rotation.y = -Math.PI / 2; pic.position.x = -0.025; CANVAS.add(pic); }
addSolidCentered('easel', 0.1, WH + 0.75, -4.0, 0.6, 1.5, 0.7, { cam: false });

// ======================= PEOPLE =======================
const BIDS = ['miner', 'engineer', 'farmer', 'mechanic', 'fisherman', 'gardener', 'janitor', 'coach', 'athlete', 'mailman'];
const BLD = BIDS.map((id, i) => makeCast(W, id, { hits: [[11.8, 'jolt', 0.5], [13.24, 'take', 1.3], [14.3, 'jolt', 1.1], [25.7, 'take', 1.0], [39.2, 'double', 1.0], [43.74, 'jolt', 0.7]], loops: [[12.4, 13.2, 'rage'], [14.5, 15.4, 'dizzy'], [26.5, 27.6, 'laugh'], [44.0, 46.0, 'rage']], marks: i === 2 ? [['!', 13.3, 14.1]] : i === 6 ? [['!', 39.2, 40.0]] : [] }, { seed: 300 + i }));
const ROPER = makeCast(W, 'monk', { hits: [[15.6, 'take', 0.3], [18.74, 'jolt', 0.4], [20.14, 'jolt', 0.4], [21.02, 'jolt', 0.4], [21.46, 'jolt', 0.4], [24.44, 'jolt', 0.3], [41.24, 'jolt', 0.5]], loops: [[16.64, 17.5, 'bob'], [26.6, 27.6, 'bob'], [39.3, 40.5, 'bob']], marks: [] });
const KING = makeCast(W, 'prince', { hits: [[6.14, 'jolt', 0.5], [14.66, 'shake', 0.9], [25.5, 'take', 1.2], [43.74, 'double', 1.0]], loops: [[7.2, 8.4, 'bob'], [26.4, 27.6, 'laugh'], [44.2, 46.0, 'rage']], marks: [['!', 25.5, 26.3], ['x', 44.2, 45.6]] });
KING.toonHead.G.children.forEach(() => {}); { const g = new THREE.Group(); g.position.y = 0.235 * 1.08; KING.toonHead.G.add(g); g.add(cyl(0.12, 0.12, 0.07, tm(0xf0c020, { emis: 0.15 }), 0, 0.03, 0, 14)); for (let i = 0; i < 6; i++) g.add(cyl(0, 0.028, 0.08, tm(0xf0c020, { emis: 0.15 }), Math.cos(i * 1.047) * 0.11, 0.1, Math.sin(i * 1.047) * 0.11, 5)); }
const PAINTER = makeCast(W, 'painter', { hits: [[9.24, 'jolt', 0.4], [42.48, 'take', 0.6]], loops: [[42.96, 43.5, 'bob']], marks: [] });
const ALL = [...BLD, ROPER, KING, PAINTER];
const B = (arr) => arr.map(([t, emo, tr]) => ({ t, emo, trans: tr ?? 0.12 }));
const PERF = new Map([
  [ROPER, new Performer(2, { intensity: 1.7, auto: false }).beats(B([[0, 'calm'], [2.5, 'smug'], [4.3, 'proud'], [15.58, 'calm'], [16.64, 'determined'], [17.44, 'smug'], [18.74, 'happy'], [20.14, 'grin'], [21.46, 'proud'], [22.3, 'curious'], [24.44, 'gentle'], [25.48, 'smug'], [26.42, 'joy'], [28.32, 'proud'], [29.4, 'happy'], [33.76, 'smug'], [37.46, 'grin'], [39.14, 'smug'], [40.46, 'joy'], [41.24, 'proud'], [43.48, 'awe']]))],
  [KING, new Performer(1, { intensity: 1.75, auto: false }).beats(B([[0, 'stern'], [1.0, 'angry'], [2.5, 'awe', 0.08], [4.82, 'proud'], [6.14, 'smug'], [7.16, 'love'], [8.4, 'joy'], [9.24, 'proud'], [10.36, 'determined'], [11.8, 'curious'], [13.24, 'shock', 0.06], [14.0, 'gasp'], [14.66, 'angry'], [15.58, 'suspicious'], [18.1, 'curious'], [21.0, 'suspicious'], [24.44, 'blank'], [25.5, 'shock', 0.06], [26.4, 'laugh'], [28.0, 'joy'], [42.38, 'proud'], [42.96, 'love'], [43.74, 'shock', 0.06], [44.2, 'angry']]))],
  [PAINTER, new Performer(3, { intensity: 1.5, auto: false }).beats(B([[0, 'happy'], [9.24, 'proud'], [42.38, 'smug'], [42.48, 'proud'], [42.96, 'joy'], [43.74, 'worried']]))],
]);
BLD.forEach((P, i) => PERF.set(P, new Performer(20 + i, { intensity: 1.7, auto: false }).beats(B([[0, 'determined'], [1.0, 'angry'], [2.5, 'gasp', 0.08], [4.82, 'happy'], [10.36, 'determined'], [11.8, 'angry'], [12.48, 'nervous'], [13.24, 'panic', 0.06], [14.3, 'shock'], [14.9, 'tired'], [15.6, 'suspicious'], [18.0, 'curious'], [21.5, 'suspicious'], [25.5, 'shock', 0.06], [26.4, 'awe'], [27.0, 'laugh'], [28.4, 'curious'], [33.0, 'awe'], [37.46, 'curious'], [39.14, 'shock', 0.06], [39.9, 'gasp'], [41.24, 'joy'], [43.48, 'determined'], [43.74, 'angry'], [44.6, 'nervous']]))));
const pose = (P, t, hands = true) => toonify({ ...PERF.get(P).at(t, { handsFree: hands }), t }, P, t);
const UP = (p, t, ph = 0) => { p.armL = { f: 120 + 15 * Math.sin(t * 13 + ph), o: -70, b: 10 }; p.armR = { f: 120 + 15 * Math.sin(t * 13 + ph + 1.3), o: -70, b: 10 }; };
const PANIC = (p) => { p.armL = { f: 140, o: -50, b: 30 }; p.armR = { f: 140, o: -50, b: 30 }; };
const place = (P, x, y, z, yaw, tilt = 0) => { P.root.visible = true; P.root.position.set(x, y, z); P.root.quaternion.setFromEuler(new THREE.Euler(0, yaw, 0)); if (tilt) P.root.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), tilt)); };

// ======================= STORY STATE (world time S, so the hook can flash-forward) =======================
const Sof = (t) => (t < 2.3 ? 11.9 + t * 0.5 : t < 4.7 ? 24.5 + (t - 2.3) * 0.55 : t);
const liftH = (s) => (s < 24.6 ? 0 : s < 28.2 ? 5.4 * EASE.inOut(clamp((s - 24.6) / 3.4, 0, 1)) : s < 42.38 ? 2.6 : 0);
const flyL = (s) => (s < 13.24 ? 0 : s < 14.3 ? 1.25 * Math.sin(Math.min(1, (s - 13.24) / 0.5) * Math.PI / 2) + 0.12 * Math.sin(s * 14) : 0);
const TOPP = V(BX, 7.95, 0);
function setup(f) {
  const t = f / FPS, s = Sof(t); for (const P of ALL) P.root.visible = false;
  FL.forEach((fl, i) => (fl.rotation.y = 0.25 * Math.sin(t * 4 + i)));
  // ---- horse ----
  const onWall = s >= 42.38; const hy = liftH(s);
  if (onWall) { HORSE.position.set(0, WH, -1.7); const lean = s >= 43.74 ? 0.22 * sstep(43.74, 44.0, s) + 0.03 * Math.sin(s * 30) * sstep(43.74, 44.0, s) : 0; HORSE.rotation.set(-lean, 0, 0); }
  else { HORSE.position.set(BX, hy, 0); HORSE.rotation.set(0, 0, hy > 0.05 ? 0.06 * Math.sin(s * 2.2) : 0); }
  const hanging = !onWall && hy > 0.05; LEGS.forEach((l, i) => (l.rotation.x = hanging ? 0.25 * Math.sin(s * 3 + i) + 0.2 : onWall && s > 43.74 ? (i < 2 ? -0.35 : 0.3) : 0));
  const eating = !onWall && (hy < 0.05 ? s > 4.6 : true); NECK.rotation.x = !onWall && hy < 0.05 && s > 4.6 && s < 24.6 ? 0.75 + 0.08 * Math.sin(s * 3) : 0; JAW.position.y = -0.17 - (eating ? 0.03 * Math.abs(Math.sin(s * 9)) : 0);
  MOUTHHAY.visible = hanging || (hy < 0.05 && s > 4.6 && s < 24.6); HEAD.rotation.set(0, onWall && s > 43.74 ? 0.5 * Math.sin(s * 9) : 0, 0); TAIL.rotation.z = 0.3 * Math.sin(s * 3);
  HAY.visible = !onWall; HORSE.updateMatrixWorld(true); const ringW = RING.getWorldPosition(V());
  // ---- blocks ----
  TOPB.g.position.copy(TOPP); BOTB.g.position.copy(ringW).add(V(0, 0.42, 0));
  const phase2 = s >= 18.74 && !onWall; TOPB.g.visible = phase2 || s >= 18.74 && false; BOTB.g.visible = phase2 && s >= 20.14;
  TOPB.wh[0].visible = s >= 19.1; BOTB.wh[0].visible = s >= 20.46; TOPB.wh[1].visible = s >= 21.3; BOTB.wh[1].visible = s >= 21.8;
  BOTB.wh.forEach((w) => (w.children[0].rotation.y = s * 6)); TOPB.wh.forEach((w) => (w.children[0].rotation.y = s * 6));
  // ---- ropes ----
  RP.forEach((r) => { r.visible = false; r.material = ropeM; });
  const B1 = BLD.map((P, i) => V(-2.9 - Math.floor(i / 2) * 1.2 + (i % 2) * 0.6, 0, i % 2 ? 0.32 : -0.32));
  let ropeHandY = 0.8 + flyL(s);
  if (s >= 10.36 && s < 18.74) { const a = V(BX, 8.45, 0); seg(RP[0], ringW, a); RP[0].visible = true; seg(RP[1], a, V(-2.6, ropeHandY + 0.05, 0)); RP[1].visible = true; seg(RP[2], V(-2.6, ropeHandY + 0.05, 0), V(-9.4, ropeHandY - 0.05, 0)); RP[2].visible = true; }
  const ROPER_P = V(-0.35, WH, 0.7);
  if (phase2) { const zs = [-0.33, -0.11, 0.11, 0.33]; const top = TOPP.clone(), bot = BOTB.g.position.clone(); const nSeg = clamp(Math.floor((s - 22.2) / 0.42) + 1, 0, 4);
    for (let k = 0; k < 4; k++) { if (s < 22.2 || k >= nSeg) continue; const a = V(BX, top.y - 0.1, zs[k]), b = V(BX, bot.y + 0.1, zs[k]); seg(RP[k], a, b); RP[k].visible = true; if (s >= 31.42 && s < 42.38 && s >= 31.42 + k * 0.45) RP[k].material = glowM; }
    if (s >= 23.9) { seg(RP[4], V(BX, top.y + 0.1, 0.33), ROPER.root.visible ? ROPER.palmWorld('L').lerp(ROPER.palmWorld('R'), 0.5) : V(-0.4, WH + 0.6, 0.7)); RP[4].visible = true; }
    if (s >= 37.46 && s < 42.38) { RP[5].visible = false; } }
  if (onWall && s >= 43.48) { const hr = HORSE.localToWorld(V(0, 1.37, 0)); seg(RP[6], hr, V(-0.9, WH - 0.1, -1.7)); seg(RP[7], V(-0.9, WH - 0.1, -1.7), V(-3.0, 0.8, -1.7)); RP[6].visible = RP[7].visible = true; }
  COIL.visible = s >= 25.2 && !onWall; const cn = s < 37.46 ? 3 : 3 + Math.floor(6 * sstep(37.46, 38.6, s)); COILS.forEach((c, i) => (c.visible = i < cn));
  // flying wheels (hung by the rope maker) and the dot that runs along the rope
  const hangT = [[18.74, () => TOPP.clone().add(V(0, 0, -0.11))], [20.14, () => BOTB.g.position.clone().add(V(0, 0, -0.11))], [20.88, () => TOPP.clone().add(V(0, 0, 0.11))], [21.46, () => BOTB.g.position.clone().add(V(0, 0, 0.11))]];
  FLY.forEach((fw, i) => { const [t0, tg] = hangT[i]; const dur = i % 2 ? 0.6 : 0.35; fw.visible = s >= t0 && s < t0 + dur; if (!fw.visible) return; const from = ROPER.root.visible ? ROPER.palmWorld('R') : V(-0.4, WH + 0.6, 0.7); const u = (s - t0) / dur; fw.position.copy(from.lerp(tg(), EASE.inOut(u))); fw.position.y += Math.sin(u * Math.PI) * 0.4; fw.rotation.set(s * 8, 0, 0); });
  DOT.visible = s >= 29.4 && s < 31.0; if (DOT.visible) { const zs = [-0.33, -0.11, 0.11, 0.33]; const u = (s - 29.4) / 1.6 * 4, k = Math.min(3, Math.floor(u)), f2 = u - k; const top = TOPP.y - 0.1, bot = BOTB.g.position.y + 0.1; const goingDown = k % 2 === 0; DOT.position.set(BX, goingDown ? lerp(top, bot, f2) : lerp(bot, top, f2), zs[k]); }
  NUMS.forEach((c, k) => { c.visible = phase2 && s >= 33.76 + k * 0.12 && s < 35.2; if (!c.visible) return; c.position.set(BX - 0.05, (TOPP.y + BOTB.g.position.y) / 2 + 0.3, [-0.33, -0.11, 0.11, 0.33][k] * 2.4); c.rotation.y = -Math.PI / 2; c.scale.setScalar(Math.max(0.01, EASE.outBack(clamp((s - 33.76 - k * 0.12) / 0.25, 0, 1)))); });
  QUARTS.forEach((c, k) => { c.visible = phase2 && s >= 35.28 + k * 0.12 && s < 37.4; if (!c.visible) return; c.position.set(BX - 0.05, (TOPP.y + BOTB.g.position.y) / 2 - 0.25, [-0.33, -0.11, 0.11, 0.33][k] * 2.4); c.rotation.y = -Math.PI / 2; c.scale.setScalar(Math.max(0.01, EASE.outBack(clamp((s - 35.28 - k * 0.12) / 0.25, 0, 1)))); });
  BANNER.visible = s >= 41.24; BANNER.scale.setScalar(s < 41.6 ? Math.max(0.01, EASE.outBack(clamp((s - 41.24) / 0.35, 0, 1))) : 1);
  CANVAS.rotation.y = 0;
  // ---- builders ----
  BLD.forEach((P, i) => { let p, x, y = 0, z, yaw = -Math.PI / 2, tilt = 0; const b = B1[i];
    if (s < 10.36) { x = -5.2 - (i % 5) * 0.95; z = 3.0 + Math.floor(i / 5) * 1.0; yaw = 0.8; p = pose(P, s); if (s >= 4.6 && s < 10.36) { if (i % 3 === 0) p.armR = { f: 70, o: -20, b: 100 }; } }
    else if (s < 15.4) { x = b.x; z = b.z; yaw = -Math.PI / 2; y = flyL(s); p = pose(P, s, false); const ry = 0.8 + flyL(s);
      for (const [h, dx] of [['L', -0.16], ['R', 0.16]]) p['hand' + h] = { w: V(x + dx, ry, 0), k: s < 10.8 ? sstep(10.36, 10.8, s) : 1 }; p.reachAssist = false; p.lean = (p.lean || 0) + (s > 11.8 ? -14 - 4 * Math.sin(s * 9 + i) : 0); p.stanceZ = [0.1, -0.1];
      if (s >= 14.3) { tilt = -1.2 * EASE.outCubic(clamp((s - 14.3) / 0.25, 0, 1)) * (1 - sstep(14.9, 15.4, s)); p.handL = p.handR = undefined; PANIC(p); y = 0; }
      if (s >= 13.24 && s < 14.3) { p.walk = s * 3 + i; p.walkK = 1; p.gait = 1.5; p.cyc = 0.6; } }
    else if (s < 42.38) { x = -3.6 - (i % 5) * 0.95; z = -3.2 - Math.floor(i / 5) * 1.0 + (i % 2) * 0.2; yaw = Math.atan2(BX - x, 0 - z); p = pose(P, s); if ((s >= 25.6 && s < 26.4) || (s >= 39.14 && s < 40.0)) PANIC(p); if (s >= 26.5 && s < 27.6) UP(p, s, i); if (s >= 41.24 && s < 42.38) UP(p, s, i); }
    else { if (s < 43.48) { x = -3.6 - (i % 5) * 0.95; z = -3.2 - Math.floor(i / 5) * 1.0; yaw = 1.0; p = pose(P, s); UP(p, s, i); } else { x = -3.2 - Math.floor(i / 2) * 0.9; z = -1.7 + (i % 2 ? 0.34 : -0.34); yaw = -Math.PI / 2; p = pose(P, s, false); for (const [h, dx] of [['L', -0.16], ['R', 0.16]]) p['hand' + h] = { w: V(x + dx, 0.8, -1.7), k: 1 }; p.reachAssist = false; p.lean = -16 - 4 * Math.sin(s * 9 + i); p.stanceZ = [0.1, -0.1]; } }
    place(P, x, y, z, yaw, tilt); P.update(p); });
  // sweat drops + dust
  SWEAT.forEach((m, i) => { const P = BLD[i % 10]; const on = (s >= 12.48 && s < 14.3) || (s >= 43.74); m.visible = on && P.root.visible; if (!m.visible) return; const a = ((s * 1.7 + hash(i)) % 1); const hw = P.headWorld(); m.position.set(hw.x + (hash(i + 1) - 0.5) * 0.5, hw.y + 0.1 - a * 0.6, hw.z + (hash(i + 2) - 0.5) * 0.5); });
  DUST.forEach((m, i) => { const a = s - 14.3 - hash(i) * 0.1; m.visible = a > 0 && a < 0.8; if (!m.visible) return; const b = B1[i % 10]; m.position.set(b.x + (hash(i) - 0.5) * 0.6, 0.1 + a * 0.5, b.z + (hash(i + 3) - 0.5) * 0.6); m.scale.setScalar(0.5 + a * 2); });
  // ---- rope maker ----
  { const P = ROPER; let p, x, y = 0, z, yaw;
    if (s < 15.58) { P.root.visible = false; }
    else if (s < 16.64) { const u = (s - 15.58) / 1.06; x = lerp(-6, -1.25, u); z = lerp(4.5, 2.0, u); yaw = Math.atan2(-1.25 - -6, 2.0 - 4.5); p = pose(P, s); p.walk = s * 2.2; p.walkK = 1; p.gait = 1; p.cyc = 0.6; place(P, x, 0, z, yaw); P.update(p); }
    else if (s < 17.6) { const u = clamp((s - 16.64) / 0.9, 0, 1); x = -1.25; z = 2.0; y = u * WH; yaw = Math.PI / 2; p = pose(P, s, false); const ph = s * 10; p.handL = { w: V(-0.97, y + 0.95 + 0.15 * Math.sin(ph), 1.75), k: 1 }; p.handR = { w: V(-0.97, y + 0.95 - 0.15 * Math.sin(ph), 2.25), k: 1 }; p.reachAssist = false; place(P, x, y, z, yaw); P.update(p); if (u >= 1) P.root.position.set(-0.35, WH, 1.5); }
    else { x = -0.35; z = s < 18.3 ? lerp(1.5, 0.7, sstep(17.6, 18.3, s)) : 0.7; yaw = -Math.PI / 2; if (onWall) { x = 0.0; z = 1.4; yaw = -2.6; } p = pose(P, s, false);
      if (s >= 18.6 && s < 21.9) { const k = [18.74, 20.14, 20.88, 21.46].findIndex((tt) => s >= tt - 0.2 && s < tt + 0.35); if (k >= 0) { p.armR = { f: 110, o: -15, b: 10 }; } else p.armR = { f: 40, o: -20, b: 60 }; }
      else if (s >= 23.9 && s < 28.3) { const ph = s * 3.2; const hx = -0.7, hy0 = WH + 0.75; p.handL = { w: V(hx + 0.15 * Math.sin(ph), hy0 + 0.1 * Math.cos(ph), 0.62), k: 1 }; p.handR = { w: V(hx - 0.15 * Math.sin(ph), hy0 - 0.1 * Math.cos(ph), 0.78), k: 1 }; p.reachAssist = false; }
      else if (s >= 28.3 && s < 39.14 && !onWall) { p.handR = { w: V(-0.72, WH + 0.85, 0.66), k: 1 }; p.reachAssist = false; if (s >= 37.46) { const ph = s * 6; p.handL = { w: V(-0.6 + 0.2 * Math.sin(ph), WH + 0.75, 0.75), k: 1 }; } else p.armL = { f: s >= 33.76 && s < 36.86 ? 95 : 20, o: -25, b: 5 }; }
      else if (s >= 39.14 && s < 42.38) { p.handR = { w: V(-0.72, WH + 0.85, 0.66), k: 1 }; p.armL = { f: -5, o: -55, b: 115 }; p.reachAssist = false; p.lean = -8; }
      else if (onWall) { if (s >= 43.48) PANIC(p); }
      place(P, x, 0, z, yaw); P.root.position.y = WH; P.update(p); } }
  BAG.visible = s >= 15.58 && s < 21.9; if (BAG.visible) { const P = ROPER; BAG.position.copy(P.root.visible ? P.torso.localToWorld(V(0.46, 0.02, -0.04)) : V(0, -50, 0)); BAG.scale.setScalar(0.55); }
  // ---- king + painter ----
  { const P = KING; let x = -6.2, z = 1.0, yaw = Math.atan2(BX - x, 0 - z); if (s >= 42.38) { x = -4.2; z = 0.6; yaw = 2.0; } const p = pose(P, s); if (s >= 6.14 && s < 9.0) p.armR = { f: 100, o: -25, b: 5 }; if (s >= 13.24 && s < 14.3) PANIC(p); if (s >= 14.66 && s < 15.5) { p.armL = { f: -5, o: -55, b: 115 }; p.armR = { f: -5, o: -55, b: 115 }; } if (s >= 25.5 && s < 26.3) PANIC(p); if (s >= 26.4 && s < 27.8) UP(p, s); if (s >= 42.96 && s < 43.6) UP(p, s); if (s >= 44.2) p.armR = { f: 100, o: -20, b: 5 }; place(P, x, 0, z, yaw); P.update(p); }
  { const P = PAINTER; const show = (s >= 8.4 && s < 10.36) || s >= 42.0; if (show) { const p = pose(P, s); if (s >= 42.48 && s < 43.0) p.armR = { f: 100, o: -25, b: 5 }; if (s >= 42.96 && s < 43.48) UP(p, s); if (s >= 43.74) PANIC(p); if (s < 10.36) p.armR = { f: 80, o: -20, b: 30 }; place(P, 0.15, WH, -4.75, 0); P.update(p); } }
  EASEL.visible = (s >= 8.4 && s < 10.36) || s >= 42.0;
  return { t, s };
}

// ======================= CAMERA: a new moving shot about every second, cut on the words =======================
const CINE = new Cine({ blend: 0.3 }); const P = CT.pt;
const ropeMid = () => V(BX, (TOPP.y + BOTB.g.position.y) / 2, 0), horseC = () => HORSE.localToWorld(V(0, 1.0, 0)), bld = (k) => () => BLD[k].headWorld();
const S = [
  [0.0, 1.0, { rig: 'orbit', at: () => BLD[0].torso.localToWorld(V(0, 0.2, 0)).lerp(horseC(), 0.4), size: [3.6, 3.0], az: [-150, -110], el: [10, 8], fov: 34, shake: 0.6 }],
  [1.0, 1.94, { rig: 'push', at: horseC, size: [2.4, 1.6], az: [-40, -20], el: [6, 4], fov: 32, shake: 0.6, ease: 'snap' }],
  [1.94, 2.5, { rig: 'orbit', at: bld(1), size: [2.6, 2.2], az: [-120, -90], el: [16, 12], fov: 32, shake: 0.8 }],
  [2.5, 3.4, { rig: 'push', at: () => ROPER.headWorld(), size: [1.8, 1.2], az: [-80, -100], el: [8, 6], fov: 30, shake: 0.4, cut: true, ease: 'snap', fovKick: 8 }],
  [3.4, 4.6, { rig: 'crane', at: horseC, size: [4, 7], az: [-100, -60], el: [-10, 20], fov: 36, shake: 0.4 }],
  [4.6, 5.9, { rig: 'fly', path: [[-30, 14, 22], [-14, 8, 10]], at: P(-1, 6, 0), fov: [42, 36], shake: 0.2, cut: true }],
  [5.9, 7.0, { rig: 'orbit', at: () => KING.headWorld(), size: [1.8, 1.3], az: [70, 110], el: [8, 6], fov: 32, shake: 0.4 }],
  [7.0, 7.6, { rig: 'push', at: () => HEAD.getWorldPosition(V()), size: [1.6, 1.0], az: [-30, -10], el: [8, 6], fov: 30, shake: 0.4, ease: 'snap' }],
  [7.6, 8.7, { rig: 'crane', at: P(-0.6, 5.5, 0), size: [4, 9], az: [-100, -70], el: [-20, 10], fov: 36, shake: 0.3 }],
  [8.7, 10.36, { rig: 'orbit', at: () => PAINTER.headWorld().lerp(V(0.1, WH + 1.2, -4.0), 0.4), size: [2.2, 1.8], az: [-140, -100], el: [10, 8], fov: 32, shake: 0.4 }],
  [10.36, 11.2, { rig: 'orbit', at: () => V(-4.5, 1.0, 0), size: [4, 3.4], az: [140, 100], el: [12, 10], fov: 34, shake: 0.5, cut: true }],
  [11.2, 11.8, { rig: 'push', at: P(-3.5, 1.0, 0), size: [1.6, 1.0], az: [160, 140], el: [20, 16], fov: 32, shake: 0.6, ease: 'snap' }],
  [11.8, 12.4, { rig: 'orbit', at: bld(0), size: [2.6, 2.2], az: [-140, -110], el: [16, 12], fov: 32, shake: 0.8 }],
  [12.4, 13.1, { rig: 'push', at: bld(3), size: [1.6, 1.0], az: [-60, -40], el: [6, 4], fov: 30, shake: 0.9, ease: 'snap', fovKick: 6 }],
  [13.1, 14.3, { rig: 'orbit', at: () => V(-5.0, 1.4 + flyL(CINE._s), 0), size: [5, 5], az: [170, 120], el: [4, 10], fov: 36, shake: 1.0, fovKick: 8 }],
  [14.3, 15.0, { rig: 'push', at: horseC, size: [2.2, 1.6], az: [-50, -30], el: [8, 6], fov: 32, shake: 0.7, ease: 'snap' }],
  [15.0, 15.58, { rig: 'push', at: () => KING.headWorld(), size: [1.6, 1.2], az: [80, 60], el: [6, 4], fov: 30, shake: 0.6 }],
  [15.58, 16.6, { rig: 'track', at: () => ROPER.root.visible ? ROPER.torso.localToWorld(V(0, 0.3, 0)) : V(-4, 1, 3), size: [2.6, 2.2], az: [-40, -10], el: [10, 8], fov: 34, shake: 0.4, cut: true }],
  [16.6, 17.6, { rig: 'crane', at: () => ROPER.headWorld(), size: [2.4, 2.4], az: [-60, -30], el: [-20, 10], fov: 36, shake: 0.4 }],
  [17.6, 18.6, { rig: 'push', at: () => BAG.position.clone(), size: [1.4, 0.9], az: [-120, -90], el: [16, 10], fov: 30, shake: 0.4 }],
  [18.6, 19.8, { rig: 'orbit', at: () => TOPP.clone().lerp(ROPER.headWorld(), 0.4), size: [2.2, 1.8], az: [-150, -110], el: [14, 10], fov: 32, shake: 0.4 }],
  [19.8, 20.8, { rig: 'orbit', at: () => FLY[1].visible ? FLY[1].position.clone() : BOTB.g.position.clone(), size: [2.0, 1.6], az: [-80, -60], el: [10, 6], fov: 36, shake: 0.4 }],
  [20.8, 21.4, { rig: 'push', at: () => TOPP.clone(), size: [1.4, 0.9], az: [-100, -80], el: [6, 4], fov: 30, shake: 0.5, ease: 'snap' }],
  [21.4, 22.0, { rig: 'push', at: () => BOTB.g.position.clone(), size: [1.4, 0.9], az: [-110, -80], el: [10, 6], fov: 30, shake: 0.5, ease: 'snap' }],
  [22.0, 24.0, { rig: 'crane', at: ropeMid, size: [4, 7], az: [-140, -100], el: [-10, 20], fov: 36, shake: 0.4 }],
  [24.0, 24.7, { rig: 'push', at: () => ROPER.headWorld(), size: [1.6, 1.1], az: [-80, -100], el: [6, 4], fov: 30, shake: 0.4, ease: 'snap' }],
  [24.7, 25.6, { rig: 'low', at: horseC, size: [3, 3.6], az: [-110, -70], fov: 36, shake: 0.5 }],
  [25.6, 26.4, { rig: 'push', at: () => BLD[4].headWorld().lerp(KING.headWorld(), 0.5), size: [3.0, 2.2], az: [-20, 10], el: [6, 4], fov: 32, shake: 0.7, ease: 'snap', fovKick: 8 }],
  [26.4, 27.5, { rig: 'track', at: horseC, size: [3.0, 2.6], az: [-90, -60], el: [4, 8], fov: 34, shake: 0.4 }],
  [27.5, 28.3, { rig: 'push', at: () => HEAD.getWorldPosition(V()), size: [1.9, 1.4], az: [-70, -45], el: [6, 4], fov: 30, shake: 0.3 }],
  [28.3, 29.4, { rig: 'push', at: () => ROPER.headWorld(), size: [1.8, 1.2], az: [-110, -90], el: [8, 6], fov: 30, shake: 0.4, cut: true }],
  [29.4, 31.0, { rig: 'orbit', at: ropeMid, size: [3.8, 3.4], az: [-130, -60], el: [6, 10], fov: 34, shake: 0.4 }],
  [31.0, 33.3, { rig: 'orbit', at: ropeMid, size: [3.4, 3.6], az: [-60, -110], el: [10, 4], fov: 34, shake: 0.3 }],
  [33.3, 35.2, { rig: 'push', at: ropeMid, size: [3.6, 2.8], az: [-95, -85], el: [4, 2], fov: 32, shake: 0.3, ease: 'snap' }],
  [35.2, 36.9, { rig: 'orbit', at: () => ropeMid().add(V(0, -0.4, 0)), size: [3.2, 2.6], az: [-80, -100], el: [2, 6], fov: 32, shake: 0.3 }],
  [36.9, 38.6, { rig: 'crane', at: () => COIL.position.clone().lerp(ROPER.headWorld(), 0.4), size: [2.0, 3.2], az: [-150, -110], el: [20, 50], fov: 34, shake: 0.4, cut: true }],
  [38.6, 39.4, { rig: 'push', at: () => ROPER.palmWorld('R'), size: [1.2, 0.7], az: [-120, -100], el: [14, 10], fov: 30, shake: 0.4, ease: 'snap' }],
  [39.4, 40.4, { rig: 'orbit', at: () => BLD[6].headWorld().lerp(BLD[7].headWorld(), 0.5), size: [2.6, 2.2], az: [-40, 0], el: [8, 6], fov: 32, shake: 0.6, cut: true }],
  [40.4, 41.24, { rig: 'push', at: () => ROPER.headWorld(), size: [1.6, 1.1], az: [-110, -90], el: [8, 6], fov: 30, shake: 0.4, cut: true }],
  [41.24, 42.38, { rig: 'push', at: P(-0.9, 4.6, -3.4), size: [8.4, 7.6], az: [-82, -92], el: [4, 2], fov: 34, shake: 0.8, ease: 'snap', fovKick: 8 }],
  [42.38, 43.0, { rig: 'push', at: () => V(0.1, WH + 1.15, -4.0), size: [2.2, 1.4], az: [-100, -85], el: [10, 6], fov: 32, shake: 0.4, cut: true }],
  [43.0, 43.6, { rig: 'push', at: () => HEAD.getWorldPosition(V()), size: [2.4, 1.8], az: [-110, -90], el: [8, 6], fov: 32, shake: 0.4 }],
  [43.6, 44.6, { rig: 'orbit', at: () => V(-2, 3.5, -1.7), size: [8, 7], az: [-150, -120], el: [6, 10], fov: 36, shake: 0.8 }],
  [44.6, 45.3, { rig: 'push', at: () => HEAD.getWorldPosition(V()), size: [2.4, 1.8], az: [-100, -80], el: [6, 4], fov: 30, shake: 0.6, ease: 'snap' }],
  [45.3, 46.1, { rig: 'crane', at: () => HORSE.localToWorld(V(0, 1.0, 0)), size: [3, 9], az: [-130, -100], el: [10, 40], fov: 36, shake: 0.2 }],
];
for (const [a, b, sp] of S) CINE.shot(a, b, sp);
const LOOK = mkLook({ sun: [0.5, 0.78, 0.4], lit: '#fff2d8', litK: 1.08, shade: '#a8b0d8', ambSky: '#eef2ff', ambGnd: '#f8eed0', rim: '#ffecc8', fog: '#e4ecf8', fogR: [60, 360], sky: ['#3a80e0', '#80bcf0', '#f8e4c4', '#ffffff'], contrast: 1.06, vig: 0.1, glow: 0.4, sat: 1.2, lo: '#f8f8ff', hi: '#fff8e8', exposure: 1.05, shadow: 0.8 });
let SHK = 0;
window.renderFrame = function (f) {
  const { t, s } = setup(f); CINE._t = t; CINE._s = s; const cam = guardCam(CINE.at(t));
  SHK = 0; for (const [ti, k] of [[13.24, 0.8], [14.3, 1.1], [25.5, 0.6], [41.24, 0.9], [43.74, 0.7]]) { const a = t - ti; if (a > 0 && a < 0.6) SHK += k * Math.exp(-a * 6); }
  if (SHK > 0) { cam.pos[0] += 0.05 * SHK * Math.sin(t * 91); cam.pos[1] += 0.06 * SHK * Math.sin(t * 77 + 1); }
  CAMPOS.set(...cam.pos); for (const Pp of ALL) placeMarks(Pp, s);
  applyLook(LOOK, { shadowCenter: [clamp(cam.look[0], -20, 10), 3, clamp(cam.look[2], -10, 10)], shadowSize: 22 }); C.skyU.uSunSize.value = 0;
  C.setCam({ pos: cam.pos, look: cam.look, fov: cam.fov, roll: cam.roll, near: 0.04, far: 800 });
  dofU.uFocus.value = cam.focus; dofU.uAper.value = cam.ap * PX * 0.6; dofU.uMaxC.value = 10 * PX; dofU.uTime.value = f * 0.37;
  dofU.uFade.value = 1 - Math.min(1, t / 0.4) + Math.max(0, (t - (DURATION - 0.9)) / 0.9); dofU.uFlash.value = 0;
  C.drawFrame(); return 'ok';
};
window.ready = true;
