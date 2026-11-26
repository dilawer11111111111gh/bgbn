// "TEESRI KHWAHISH" (The Third Wish) - 16:9 PBR dialogue short, 3:36.
// Scenes: desert dawn (jinn emerges) -> bazaar noon (first wish) -> oasis sunset (vazir, second wish) -> flying carpet over the night city -> palace roof (third wish) -> sunrise.
import * as THREE from 'three';
import * as C from './core.js';
import { W, T, COL, showZone, ZONES, OAS } from './world.js';
import { LK } from './looks2.js';
import { applyLook, mixLook } from '../../web/looks.js';
import { Path, place, EASE, clamp, lerp, sstep, angLerp, hash } from '../../web/motion.js';
import { applyTimeline } from '../../web/acting.js';
import { Performer } from '../../web/perform.js';
import { Cine, T as CT } from '../../web/cine.js';
import { handOnProp, propInHand } from '../../web/props.js';
import { N, J, VZ, GUARDS, KIDS, SHOP, SUR, BASKET, TOSS, CARPET, waveCarpet, updateTail, CUFFS, SHARDS, SMOKE, SPARK, REDSPARK, ORBS, FLASH, GLOW, SPEARS } from './cast.js';
import { VOICE } from './voice.js';
const { dofU, FPS, PX } = C;
export const DURATION = VOICE.duration;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const L = (n) => VOICE.lines[n - 1];
const bump = (a, b, t) => sstep(a, a + (b - a) * 0.3, t) * (1 - sstep(a + (b - a) * 0.7, b, t));
const ramp = (a, b, t) => clamp((t - a) / (b - a), 0, 1);
const zp = (k, x, y, z) => V(x + ZONES[k][0], y, z + ZONES[k][1]);
const yawTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
const fwdOf = (yaw) => V(Math.sin(yaw), 0, Math.cos(yaw)), rightOf = (yaw) => V(-Math.cos(yaw), 0, Math.sin(yaw));
// keyed scalar: [[t,v],...] smooth
const key = (K, t, e = 'inOut') => { if (t <= K[0][0]) return K[0][1]; for (let i = 0; i < K.length - 1; i++) if (t < K[i + 1][0]) { const u = EASE[e]((t - K[i][0]) / (K[i + 1][0] - K[i][0])); return lerp(K[i][1], K[i + 1][1], u); } return K[K.length - 1][1]; };
const keyV = (K, t, e = 'inOut') => V(key(K.map((k) => [k[0], k[1]]), t, e), key(K.map((k) => [k[0], k[2]]), t, e), key(K.map((k) => [k[0], k[3]]), t, e));
// Catmull-Rom over keyed points [[t,x,y,z],...]
function crPath(K, t) { let i = 0; while (i < K.length - 2 && t >= K[i + 1][0]) i++; const a = K[i], b = K[i + 1], p0 = K[Math.max(0, i - 1)], p3 = K[Math.min(K.length - 1, i + 2)]; const u = clamp((t - a[0]) / (b[0] - a[0]), 0, 1), u2 = u * u, u3 = u2 * u;
  const c = (k) => 0.5 * (2 * a[k] + (-p0[k] + b[k]) * u + (2 * p0[k] - 5 * a[k] + 4 * b[k] - p3[k]) * u2 + (-p0[k] + 3 * a[k] - 3 * b[k] + p3[k]) * u3); return V(c(1), c(2), c(3)); }

// ---------------- scene timing ----------------
const CUT1 = 60.9, CUT2 = 95.1, CUT3 = 134.0;
const zoneAt = (t) => (t < CUT1 ? 'DES' : t < CUT2 ? 'BAZ' : t < CUT3 ? 'OAS' : 'PAL');
// ---------------- lip sync from the voice envelope ----------------
const envAt = (who, t) => { const e = VOICE.env[who]; const f = Math.round(t * FPS); let a = 0; for (let k = -1; k <= 1; k++) a += e[clamp(f + k, 0, e.length - 1)] || 0; return a / 3; };
function talk(pose, who, t) { const e = envAt(who, t); if (e < 0.02) return; pose.fx = { ...(pose.fx || {}) }; const w = Math.min(1, e);
  pose.fx.open = (pose.fx.open || 0) + w * 0.42 + 0.03; pose.fx.oround = (pose.fx.oround || 0) + w * 0.4 * (0.5 + 0.5 * Math.sin(t * 13.1)); pose.fx.mw = (pose.fx.mw || 0) - w * 0.25 * (0.5 + 0.5 * Math.sin(t * 8.3 + 1)); pose.fx.teeth = (pose.fx.teeth || 0) + w * 0.3;
  pose.head = pose.head || { yaw: 0, pitch: 0, roll: 0 }; pose.head.pitch += w * 3.5 * Math.sin(t * 6.1); pose.head.yaw += w * 2.5 * Math.sin(t * 2.9); pose.head.roll += w * 1.5 * Math.sin(t * 3.7); }
// ---------------- props helpers ----------------
const SUR_UP = V(0, 1, 0);
function placeProp(prop, pos, yaw, extra = null) { prop.group.position.copy(pos); prop.group.rotation.set(0, yaw, 0); if (extra) prop.group.rotation.set(extra[0], yaw + extra[1], extra[2]); prop.group.updateMatrixWorld(true); }
const holdPoint = (P, f = 0.34, up = 0.98, side = 0) => { const y = P.root.rotation.y; return P.root.position.clone().addScaledVector(fwdOf(y), f).addScaledVector(rightOf(y), side).add(V(0, up * P.height / 0.92, 0)); };
const SIT = (k) => ({ sitK: k, sitF: 86, sitKn: 8, seatY: 0.12 });
const headOf = (P) => () => P.headWorld();

// ================= PERFORMERS (emotion beats; lookAt = who they look at) =================
const SURW = () => SUR.group.position.clone();
const kidsMid = () => KIDS[0].headWorld().lerp(KIDS[1].headWorld(), 0.5);
const pN = new Performer(21, { energy: 1.2 }).beats([
  { t: 0, emo: 'tired' }, { t: 4.5, emo: 'tired', gaze: [0.3, 0.1] }, { t: 8.8, emo: 'shock', trans: 0.15 }, { t: 9.5, emo: 'worried', lookAt: SURW }, { t: 11.2, emo: 'curious', lookAt: SURW }, { t: 13, emo: 'awe' === 'x' ? 'x' : 'curious', lookAt: SURW, int: 1.2 },
  { t: 16.5, emo: 'hopeful', lookAt: SURW }, { t: 20.6, emo: 'curious', lookAt: SURW }, { t: 22.6, emo: 'shock', trans: 0.15 }, { t: 23.4, emo: 'terrified', lookAt: headOf(J), trans: 0.15 }, { t: 30, emo: 'afraid', lookAt: headOf(J) },
  { t: 33.4, emo: 'terrified', lookAt: headOf(J) }, { t: 37, emo: 'nervous', lookAt: headOf(J) }, { t: 41, emo: 'curious', lookAt: headOf(J) }, { t: 44.7, emo: 'hopeful', lookAt: headOf(J), int: 1.2 }, { t: 49.4, emo: 'suspicious', lookAt: headOf(J) }, { t: 53, emo: 'curious', lookAt: headOf(J) }, { t: 56.5, emo: 'worried', lookAt: headOf(J) },
  { t: CUT1, emo: 'happy', lookAt: headOf(J) }, { t: 62.4, emo: 'pensive', gaze: [-0.3, 0.2] }, { t: 64.2, emo: 'hopeful', lookAt: headOf(J) }, { t: 66.6, emo: 'curious', lookAt: () => BASKET.group.position.clone() }, { t: 68.1, emo: 'shock', trans: 0.15, lookAt: () => BASKET.group.position.clone() },
  { t: 69.4, emo: 'joy', int: 1.2, lookAt: () => BASKET.group.position.clone() }, { t: 72, emo: 'laugh', lookAt: headOf(J) }, { t: 73.6, emo: 'happy', lookAt: kidsMid }, { t: 77.4, emo: 'joy', lookAt: kidsMid }, { t: 81, emo: 'happy', lookAt: headOf(J) },
  { t: CUT2, emo: 'calm', gaze: [0, -0.2] }, { t: 96.3, emo: 'curious', lookAt: headOf(J) }, { t: 99.7, emo: 'pensive', lookAt: headOf(J) }, { t: 104, emo: 'sad', lookAt: headOf(J) }, { t: 107.6, emo: 'sad', lookAt: headOf(J), int: 1.2 }, { t: 112.3, emo: 'sad', lookAt: headOf(J) },
  { t: 114.9, emo: 'shock', trans: 0.18, lookAt: headOf(VZ) }, { t: 116, emo: 'afraid', lookAt: headOf(VZ) }, { t: 119.5, emo: 'worried', lookAt: headOf(VZ) }, { t: 123.1, emo: 'determined', lookAt: headOf(VZ), int: 1.3 }, { t: 124.4, emo: 'afraid', lookAt: headOf(VZ) },
  { t: 127, emo: 'panic', lookAt: headOf(J) }, { t: 131.3, emo: 'hopeful', lookAt: headOf(J) }, { t: 132.6, emo: 'shock' },
  { t: CUT3, emo: 'joy', gaze: [0.2, -0.3] }, { t: 136, emo: 'laugh', gaze: [0.4, -0.4] }, { t: 140.6, emo: 'joy', lookAt: headOf(J) }, { t: 147, emo: 'worried', lookAt: headOf(VZ) }, { t: 151.5, emo: 'shock', trans: 0.15 }, { t: 153.2, emo: 'afraid', lookAt: headOf(VZ) },
  { t: 154.4, emo: 'shock', lookAt: SURW, trans: 0.15 }, { t: 155.4, emo: 'afraid', lookAt: headOf(VZ) }, { t: 159.9, emo: 'worried', lookAt: headOf(J) }, { t: 166.2, emo: 'afraid', lookAt: headOf(VZ) }, { t: 171.2, emo: 'pensive', gaze: [0, -0.4] },
  { t: 173, emo: 'determined', lookAt: headOf(VZ) }, { t: 175.3, emo: 'sad', lookAt: headOf(J) }, { t: 177, emo: 'hopeful', lookAt: headOf(J) }, { t: 179.6, emo: 'joy', lookAt: headOf(J), int: 1.3 }, { t: 183.8, emo: 'shock', lookAt: SURW, trans: 0.15 }, { t: 185.6, emo: 'relief', lookAt: headOf(J) },
  { t: 189.3, emo: 'joy', lookAt: headOf(J) }, { t: 195, emo: 'happy', lookAt: headOf(J) }, { t: 199.4, emo: 'love', lookAt: headOf(J) }, { t: 202.5, emo: 'joy', lookAt: headOf(J) }, { t: 206.5, emo: 'laugh', lookAt: headOf(J) }, { t: 210, emo: 'joy', gaze: [0.4, 0.2] }]);
const pJ = new Performer(33, { energy: 1.45 }).beats([
  { t: 0, emo: 'neutral' }, { t: 23.4, emo: 'shock' }, { t: 25.1, emo: 'joy', int: 1.4, gaze: [0, 0.5] }, { t: 28.5, emo: 'laugh', int: 1.3, gaze: [0.2, 0.6] }, { t: 33.3, emo: 'curious', lookAt: headOf(N) }, { t: 37, emo: 'tired', lookAt: headOf(N) }, { t: 40.5, emo: 'happy', lookAt: headOf(N) },
  { t: 44.7, emo: 'proud', lookAt: headOf(N), int: 1.3 }, { t: 47, emo: 'happy', lookAt: headOf(N) }, { t: 52.9, emo: 'laugh', lookAt: headOf(N) }, { t: 55.5, emo: 'stern', lookAt: headOf(N) }, { t: 57.5, emo: 'sad', lookAt: headOf(N) },
  { t: CUT1, emo: 'happy', lookAt: headOf(N) }, { t: 66.4, emo: 'proud', lookAt: headOf(N) }, { t: 67.8, emo: 'joy', lookAt: () => BASKET.group.position.clone() }, { t: 70.6, emo: 'happy', lookAt: headOf(N) }, { t: 73.6, emo: 'curious', lookAt: kidsMid },
  { t: 77.3, emo: 'shock', trans: 0.2, lookAt: headOf(N) }, { t: 78.6, emo: 'love', lookAt: headOf(N) }, { t: 80.5, emo: 'hopeful', lookAt: headOf(N) }, { t: 83, emo: 'happy', lookAt: kidsMid },
  { t: CUT2, emo: 'sad', gaze: [0.2, 0.5] }, { t: 96.4, emo: 'sad', lookAt: headOf(N) }, { t: 99.6, emo: 'sad', gaze: [0.3, 0.8] }, { t: 103.5, emo: 'grief', gaze: [0.1, 0.7] }, { t: 107.6, emo: 'sad', lookAt: headOf(N) }, { t: 112.2, emo: 'love', lookAt: headOf(N) },
  { t: 114.9, emo: 'shock', lookAt: headOf(VZ) }, { t: 116.2, emo: 'angry', lookAt: headOf(VZ) }, { t: 127, emo: 'determined', lookAt: headOf(N) }, { t: 131.2, emo: 'joy', lookAt: headOf(N), int: 1.3 },
  { t: CUT3, emo: 'joy', lookAt: headOf(N) }, { t: 140.5, emo: 'laugh', gaze: [0.5, 0.3], int: 1.3 }, { t: 146.3, emo: 'joy', lookAt: headOf(N) }, { t: 147, emo: 'suspicious', lookAt: headOf(VZ) }, { t: 150, emo: 'worried', lookAt: headOf(VZ) }, { t: 151.6, emo: 'shock' },
  { t: 154.3, emo: 'angry', lookAt: headOf(VZ) }, { t: 159.8, emo: 'stern', lookAt: headOf(VZ), int: 1.2 }, { t: 166, emo: 'worried', lookAt: headOf(N) }, { t: 175.2, emo: 'sad', lookAt: headOf(N) }, { t: 177.2, emo: 'worried', lookAt: headOf(N) }, { t: 180.5, emo: 'shock', lookAt: headOf(N), trans: 0.2 },
  { t: 183.8, emo: 'shock', lookAt: SURW }, { t: 186, emo: 'hopeful', gaze: [0, -0.3] }, { t: 189.2, emo: 'shock', gaze: [0.2, -0.5] }, { t: 191.4, emo: 'joy', int: 1.3, gaze: [0, 0.4] }, { t: 195.1, emo: 'love', lookAt: headOf(N) }, { t: 199.4, emo: 'happy', lookAt: headOf(N) },
  { t: 203.5, emo: 'joy', lookAt: headOf(N) }, { t: 206.5, emo: 'laugh', lookAt: headOf(N), int: 1.3 }, { t: 210, emo: 'joy', gaze: [0.5, 0.2] }]);
const pV = new Performer(41, { energy: 1.25 }).beats([
  { t: 0, emo: 'evil', lookAt: headOf(N) }, { t: 83, emo: 'evil', lookAt: headOf(N), int: 1.2 }, { t: 86.5, emo: 'sneaky', lookAt: headOf(N) }, { t: 89.5, emo: 'evil', lookAt: () => BASKET.group.position.clone(), int: 1.3 },
  { t: CUT2, emo: 'evil', lookAt: headOf(N) }, { t: 118, emo: 'sneaky', lookAt: headOf(N) }, { t: 120.8, emo: 'stern', lookAt: headOf(N) }, { t: 123.2, emo: 'angry', lookAt: headOf(N), int: 1.3 }, { t: 126, emo: 'evil', lookAt: headOf(N) },
  { t: CUT3, emo: 'angry', lookAt: () => CARPET.group.position.clone() }, { t: 150.5, emo: 'evil', lookAt: () => CARPET.group.position.clone(), int: 1.3 }, { t: 153, emo: 'evil', lookAt: SURW },
  { t: 154.5, emo: 'evil', lookAt: SURW, int: 1.4 }, { t: 157.5, emo: 'evil', lookAt: headOf(N) }, { t: 159.8, emo: 'suspicious', lookAt: headOf(J) }, { t: 163, emo: 'angry', lookAt: headOf(J) }, { t: 166.2, emo: 'angry', lookAt: headOf(N), int: 1.4 },
  { t: 171.2, emo: 'stern', lookAt: headOf(N) }, { t: 177, emo: 'evil', lookAt: headOf(N) }, { t: 180.5, emo: 'shock', lookAt: headOf(N) }, { t: 183.7, emo: 'panic', lookAt: SURW, trans: 0.15 }, { t: 185.5, emo: 'terrified', lookAt: SURW }, { t: 188.6, emo: 'defeated' }, { t: 200, emo: 'sad', gaze: [0, -0.5] }]);
const pKid = [0, 1].map((i) => new Performer(61 + i, { energy: 1.6 }).beats([{ t: 0, emo: 'curious', lookAt: headOf(N) }, { t: 75, emo: 'joy', lookAt: headOf(N), int: 1.4 }, { t: 82, emo: 'laugh', lookAt: headOf(N) }]));
const pShop = new Performer(71, { energy: 1.0 }).beats([{ t: 0, emo: 'calm', lookAt: headOf(N) }, { t: 69, emo: 'shock', lookAt: () => BASKET.group.position.clone() }, { t: 71, emo: 'happy', lookAt: headOf(N) }]);
const pG = [0, 1].map((i) => new Performer(51 + i, { energy: 1.1 }).beats([{ t: 0, emo: 'stern', lookAt: headOf(N) }, { t: 126, emo: 'angry', lookAt: headOf(N) }, { t: 132.8, emo: 'shock', lookAt: () => CARPET.group.position.clone() }]));

// ================= PATHS =================
const DESS = V(0.08, 0, 0.5);                       // where the suraahi is buried
const pathN_des = new Path(0, [{ p: [-1.3, -7.0] }, { p: [0, 0], v: 0.8, wait: 300, face: 0.12 }], 230, 1.17, T);
const B = ZONES.BAZ[0], O = ZONES.OAS[0];
const pathN_baz = new Path(0, [{ p: [B - 6.4, 0.4], wait: CUT1 }, { p: [B + 1.5, 0.4], v: 1.4, wait: 300, face: -0.98 }], 230, 1.17, T);
const pathJ_baz = new Path(0, [{ p: [B - 7.6, 1.5], wait: CUT1 + 0.1 }, { p: [B - 0.3, 1.6], v: 1.4, wait: 300, face: 2.16 }], 230, 1.17, null);
const pathK = [new Path(0, [{ p: [B + 11, 1.3], wait: 70.3 }, { p: [B + 4.6, 1.1], v: 3.2, wait: 300, face: -Math.PI / 2 }], 230, 1.17, T), new Path(0, [{ p: [B + 11.6, -0.4], wait: 70.7 }, { p: [B + 5.1, -0.2], v: 3.0, wait: 300, face: -Math.PI / 2 - 0.2 }], 230, 1.17, T)];
const pathV_oas = new Path(0, [{ p: [O + 9.8, 3.8], wait: 114.6 }, { p: [O + 3.3, 1.1], v: 1.5, wait: 300, face: -1.75 }], 230, 1.17, T);
const pathG_oas = [new Path(0, [{ p: [O + 10.9, 2.5], wait: 114.9 }, { p: [O + 4.0, -0.3], v: 1.55, wait: 126.1 - 119.4 }, { p: [O + 1.2, -0.7], v: 2.6, wait: 300, face: -1.7 }], 230, 1.17, T),
  new Path(0, [{ p: [O + 9.3, 5.0], wait: 115.2 }, { p: [O + 4.3, 2.4], v: 1.5, wait: 126.0 - 119.0 }, { p: [O + 1.3, 1.1], v: 2.6, wait: 300, face: -2.2 }], 230, 1.17, T)];
const P_ = ZONES.PAL[0];
const pathV_pal = new Path(0, [{ p: [P_ + 1.2, 2.2], wait: 153.0 }, { p: [P_ - 0.75, 2.55], v: 1.9, wait: 0.55 }, { p: [P_ + 0.9, 2.1], v: 1.3, wait: 300, face: -1.6 }], 230, 1.17, T);
// ================= CARPET (oasis rescue -> flight -> crash on roof -> final flight) =================
const CK_OAS = [[130.6, O - 6, 2.2, -10], [131.4, O - 4.2, 1.3, -6], [132.2, O - 1.0, 0.16, -1.6], [132.7, O - 0.95, 0.14, -0.7], [133.3, O - 1.0, 1.8, -1.6], [134.2, O - 1.2, 6.5, -4]];
const CK_FLY = [[133.6, P_ - 50, 16, 36], [134.0, P_ - 46, 15, 34], [137.5, P_ - 30, 13, 26], [141, P_ - 14, 12, 30], [144.5, P_ + 2, 11, 24], [147.5, P_ + 8, 9.5, 11], [150, P_ + 4.5, 8, 3], [151.8, P_ + 1.2, 6.2, -0.5], [152.6, P_ - 0.8, 3.0, 1.8], [153.25, P_ - 1.6, 0.04, 2.8], [153.3, P_ - 1.6, 0.04, 2.8]];
const CK_END = [[207.6, P_ - 1.6, 0.04, 2.8], [208.4, P_ - 1.6, 0.3, 2.75], [209.6, P_ - 1.6, 0.3, 2.75], [211.5, P_ + 0.5, 2.6, -1.2], [213.5, P_ + 8, 6.5, -12], [216.3, P_ + 22, 11, -30], [217, P_ + 25, 12, -34]];
function carpetAt(t) { let p, k; if (t < 130.6) return null; if (t < CUT3) { p = crPath(CK_OAS, t); k = CK_OAS; } else if (t < 207.6) { if (t >= 153.3) return { p: V(P_ - 1.6, 0.03, 2.8), yaw: -1.2, roll: 0, pitch: 0, fly: 0 }; p = crPath(CK_FLY, t); k = CK_FLY; } else { p = crPath(CK_END, t); k = CK_END; }
  const q = crPath(k, t + 0.08), r = crPath(k, t - 0.08); const v = q.clone().sub(r); const sp = Math.hypot(v.x, v.z); let yaw = sp > 0.02 ? Math.atan2(v.x, v.z) : -1.2;
  if (t < CUT3 && t > 132.1 && t < 133.0) yaw = -1.2 + 0.0; if (t >= CUT3 && t < 207.6 && t > 152.9) yaw = angLerp(yaw, -1.2, sstep(152.9, 153.25, t)); if (t >= 207.6 && t < 209.8) yaw = -1.2;
  const q2 = crPath(k, t + 0.3), r2 = crPath(k, t); const y2 = Math.atan2(q2.x - r2.x, q2.z - r2.z); let dy = y2 - yaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI;
  return { p, yaw, roll: clamp(-dy * 2.2, -0.45, 0.45) * clamp(sp * 4, 0, 1), pitch: clamp(-v.y * 1.2, -0.3, 0.3), fly: clamp(sp * 3 + Math.abs(v.y) * 3, 0, 1) }; }

// ================= per-frame update of everyone =================
const env = { terrain: T, colliders: COL, r: 0.21 };
const ALL = [N, J, VZ, ...GUARDS, ...KIDS, SHOP];
const S = { carpet: null, glow: 0.5, surLight: null };
const jinnK = (t) => (t < 23.35 ? 0 : EASE.outBack(clamp((t - 23.35) / 1.7, 0, 1)));
function poseFrom(perf, t, o, base = {}) { const p = { ...base, ...perf.at(t, o), t }; p.head = { ...(p.head || { yaw: 0, pitch: 0, roll: 0 }) }; return p; }
function hold2(P, pose, prop, grip = 'hold', k = 1) { handOnProp(P, 'L', prop, grip, pose, k); handOnProp(P, 'R', prop, grip, pose, k); }

function update(t) {
  const Z = zoneAt(t); showZone(Z); ALL.forEach((P) => (P.root.visible = false)); [SUR.group, BASKET.group, CARPET.group, ...SPEARS.map((s) => s.group)].forEach((g) => (g.visible = false));
  CUFFS.forEach((c) => (c.visible = false)); TOSS.forEach((m) => (m.visible = false)); BASKET.fruit.forEach((f) => (f.visible = false)); SUR.group.scale.setScalar(1);
  [...SPARK, ...REDSPARK, ...ORBS, ...SHARDS, FLASH].forEach((m) => (m.visible = false));
  S.carpet = carpetAt(t); S.glow = 0.45 + 0.15 * Math.sin(t * 3.1);
  if (Z === 'DES') desert(t); else if (Z === 'BAZ') bazaar(t); else if (Z === 'OAS') oasis(t); else palace(t);
  // jinn tail + cuffs (on his forearms until they break)
  if (J.root.visible) { updateTail(t, Z === 'DES' ? jinnK(t) : 1); const broken = t > 190.0 && Z === 'PAL';
    ['L', 'R'].forEach((s, i) => { const c = CUFFS[i]; c.visible = true; const el = J.jt['el' + s].getWorldPosition(V()), pa = J.palmWorld(s); const mid = el.clone().lerp(pa, 0.62), dir = pa.clone().sub(el).normalize();
      if (!broken) { c.position.copy(mid); c.quaternion.setFromUnitVectors(SUR_UP, dir); c.scale.setScalar(J.height * J.root.scale.x / J.height); }
      else { if (!c.userData.p0) { c.userData.p0 = mid.clone(); } const dt = t - 190.0, p0 = c.userData.p0; const fall = Math.max(0.03, p0.y - 4.9 * dt * dt); c.position.set(p0.x + (i ? 0.5 : -0.5) * dt, fall, p0.z + 0.3 * dt); c.rotation.set(dt * 4 * (i ? 1 : -1), dt, fall <= 0.031 ? Math.PI / 2 : dt * 3); } }); }
  else { JTAILhide(); }
}
import { JTAIL } from './cast.js';
function JTAILhide() { JTAIL.children.forEach((m) => (m.visible = false)); }

// ---------------- DESERT ----------------
function desert(t) {
  [N, J].forEach((P) => (P.root.visible = true)); SUR.group.visible = true; J.root.visible = t > 23.35;
  // ---- young man ----
  let pose, yaw;
  if (t < 9.5) { const r = place(N, pathN_des, t, env); pose = poseFrom(pN, t, { walking: r.speed > 0.25, handsFree: true }, r.pose); yaw = r.yaw;
    const st = bump(8.75, 9.6, t); pose.lean = (pose.lean || 0) + 24 * st; if (st > 0.02) { pose.armL = { f: 50 * st, o: 30, b: 25 }; pose.armR = { f: 50 * st, o: 30, b: 25 }; pose.head.pitch += 18 * st; } }
  else { const sitK = sstep(23.3, 23.95, t) * (1 - sstep(41.0, 42.6, t)); const back = sstep(23.3, 23.95, t) * 0.5 + sstep(33.5, 35.5, t) * 0.32;
    N.root.position.set(0, 0, -back); yaw = 0.12; if (t > 23.3) yaw = angLerp(0.12, yawTo(N.root.position, J.root.position), sstep(24, 26, t)); N.root.rotation.set(0, yaw, 0);
    pose = poseFrom(pN, t, { walking: false, handsFree: t > 23.4 }, { walk: null, ...SIT(sitK) });
    if (sitK > 0.01) { pose.lean = (pose.lean || 0) * (1 - sitK) - 14 * sitK; if (t < 40) { pose.armL = { f: -38, o: 28, b: 6 }; pose.armR = { f: -38, o: 28, b: 6 }; delete pose.handL; delete pose.handR; } } }
  N.root.rotation.y = yaw;
  // ---- suraahi: buried -> brushed out -> lifted -> rubbed -> leaps out -> rocks on the sand ----
  const fw = fwdOf(yaw), H = holdPoint(N, 0.34, 1.02);
  if (t < 12.6) { const rise = sstep(10.6, 12.4, t); placeProp(SUR, V(DESS.x, -0.16 + rise * 0.29, DESS.z), 0.12 + Math.PI, [0.25 * (1 - rise), 0, 0.15 * (1 - rise)]);
    if (t > 10.2) { const k = sstep(10.2, 10.8, t); const sw = Math.sin(t * 9) * 0.06 * (1 - sstep(12.0, 12.4, t));
      for (const [s, sd] of [['L', -1], ['R', 1]]) { const w = SUR.group.position.clone().addScaledVector(rightOf(yaw), s === 'L' ? 0.17 : -0.17).add(V(sw * (s === 'L' ? 1 : -1), 0.03 - SUR.group.position.y + 0.04, 0.02)); pose['hand' + s] = { w, dir: [0, -0.3, 1], pn: [0, -1, 0], k }; pose['grip' + s] = { curl: 0.35, thumb: 0.3 }; } } }
  else if (t < 23.3) { const lift = EASE.inOut(ramp(12.6, 13.9, t)); const ground = V(DESS.x, 0.13, DESS.z); const eye = H.clone().add(V(0, 0.16 + 0.12 * sstep(15.5, 17, t) * (1 - sstep(19.5, 20.5, t)), 0));
    const p = ground.lerp(eye, lift); const shake = sstep(22.4, 23.2, t); p.add(V(Math.sin(t * 61) * 0.012 * shake, Math.sin(t * 47) * 0.01 * shake + (t > 16.9 && t < 17.15 ? 0.02 : 0), 0));
    placeProp(SUR, p, yaw + Math.PI + 0.35 * Math.sin(t * 0.8) * sstep(14, 15, t) * (1 - sstep(20, 20.6, t)), [shake * 0.1 * Math.sin(t * 53), 0, shake * 0.1 * Math.sin(t * 41)]);
    hold2(N, pose, SUR, 'hold', 1);
    if (t > 20.7 && t < 22.6) { const k = bump(20.7, 22.6, t); SUR.group.updateMatrixWorld(true); const a = t * 9; const w = SUR.group.localToWorld(V(0.098, -0.03 + 0.04 * Math.sin(a), 0.04 * Math.cos(a))); pose.handR = { w, dir: [0, 0.3, 1], pn: [-1, 0, 0], k }; pose.gripR = { curl: 0.2, thumb: 0.3 }; } }
  else { const u = ramp(23.3, 23.85, t); const a = V(H.x, H.y, H.z), b = V(0.3, 0.13, 1.15); const p = a.clone().lerp(b, u); p.y += Math.sin(Math.PI * u) * 0.5; if (u >= 1) p.copy(b);
    const rock = Math.max(0, 1 - (t - 23.85) / 2.5); placeProp(SUR, p, 0.4, [u < 1 ? u * 6 : Math.sin((t - 23.85) * 12) * 0.25 * rock, 0, u < 1 ? u * 3 : Math.cos((t - 23.85) * 10) * 0.2 * rock]);
    if (t < 23.7) hold2(N, pose, SUR, 'hold', 1 - ramp(23.3, 23.7, t)); }
  talk(pose, 'naujawan', t); N.update(pose);
  // glow
  S.glow = t < 10.4 ? 0.0 : t < 22.4 ? 0.55 + 0.35 * Math.sin(t * 2.6) : t < 23.4 ? lerp(0.9, 3.5, ramp(22.4, 23.4, t)) : lerp(3.5, 0.5, ramp(23.4, 25, t));
  // ---- jinn ----
  if (J.root.visible) { const k = jinnK(t); const base = V(0.32, 0.55 + 0.08 * Math.sin(t * 1.6), 1.7); J.root.position.copy(base).lerp(V(0.3, 0.1, 1.2), 1 - Math.min(1, k)); J.root.scale.setScalar(J.height * Math.max(0.02, k));
    const jy = yawTo(J.root.position, N.root.position); J.root.rotation.set(0, jy, 0);
    const jp = poseFrom(pJ, t, { walking: false, handsFree: true }, { walk: null });
    const roar = bump(25.0, 29.5, t); if (roar > 0.01) { jp.armL = { f: 140 * roar + 10, o: 8 - 50 * roar, b: 12 }; jp.armR = { f: 140 * roar + 10, o: 8 - 50 * roar, b: 12 }; delete jp.handL; delete jp.handR; jp.lean = -12 * roar; jp.head.pitch -= 20 * roar; }
    if (t > 37 && t < 40.5) applyTimeline(jp, [[37.2, 'neckBack', 'L', 0.4, 2.4, 0.5], [37.3, 'hips', 'R', 0.4, 2.4, 0.5]], t, 0);
    if (t > 41.2 && t < 44.2) applyTimeline(jp, [[41.4, 'chest', 'L', 0.35, 2.0, 0.4]], t, 0);
    const bow = bump(44.7, 47.4, t); if (bow > 0.01) { jp.lean = (jp.lean || 0) + 32 * bow; jp.armR = { f: lerp(10, 70, bow), o: 50 * bow, b: 40 }; jp.armL = { f: 60 * bow, o: 10, b: 95 * bow }; delete jp.handL; delete jp.handR; }
    if (t > 47.4 && t < 52.5) { const k2 = bump(47.4, 52.5, t); jp.armL = { f: 70 * k2 + 5, o: 30 * k2 + 8, b: 70 * k2 + 10 }; delete jp.handL; }
    if (t > 55.5 && t < 59.2) applyTimeline(jp, [[55.6, 'point', 'R', 0.3, 2.6, 0.5]], t, 0);
    talk(jp, 'jinn', t); J.update(jp); }
  // smoke + sparkles of the emergence
  smokeSpiral(t, V(0.3, 0.3, 1.15), 23.15, 2.8);
  burst(SPARK, 0, 30, t, 23.3, V(0.3, 0.35, 1.15), 2.4, 1.5, 0.3);
  rising(SPARK, 30, 30, t, 23.8, 26.5, () => J.root.position.clone().add(V(0, 0.9, 0)), 1.0);
  orbs(t);
}
// ---------------- BAZAAR ----------------
function bazaar(t) {
  [N, J, VZ, GUARDS[0], ...KIDS, SHOP].forEach((P) => (P.root.visible = true)); BASKET.group.visible = true; SUR.group.visible = true; SPEARS[0].group.visible = true;
  // young man walks in with the empty basket, stops, wishes, then turns to the kids and throws fruit
  const r = place(N, pathN_baz, t, env); let yaw = r.yaw; if (t > 73.2) yaw = angLerp(yaw, Math.PI / 2, sstep(73.2, 74.0, t)); N.root.rotation.y = yaw;
  const pose = poseFrom(pN, t, { walking: r.speed > 0.25, handsFree: false }, r.pose);
  const oneHand = sstep(73.4, 73.9, t);
  const H2 = holdPoint(N, 0.33, 0.93), H1 = holdPoint(N, 0.2, 0.9, -0.27); const bp = H2.clone().lerp(H1, oneHand); if (r.speed > 0.25) bp.y += 0.015 * Math.sin((r.pose.walk || 0) * 4 * Math.PI);
  placeProp(BASKET, bp, yaw + Math.PI); handOnProp(N, 'R', BASKET, 'hold', pose, 1); if (oneHand < 0.99) handOnProp(N, 'L', BASKET, 'hold', pose, 1 - oneHand);
  // throws (character's right hand 'L')
  const TH = [74.4, 75.2, 76.0, 76.8];
  if (oneHand > 0.01) { let f = 8, b = 25, o = 14; for (const tl of TH) { const u = (t - tl + 0.4) / 0.6; if (u > 0 && u < 1) { f = u < 0.55 ? lerp(10, -25, u / 0.55) : lerp(-25, 105, (u - 0.55) / 0.45); b = 40; o = 20; } }
    if (t > 77.2) { const k = bump(77.2, 81.5, t); f = 30 * k + 8; o = 40 * k + 14; b = 40; } pose.armL = { f: lerp(pose.armL ? pose.armL.f : 8, f, oneHand), o, b }; delete pose.handL; pose.gripL = { curl: 0.5, thumb: 0.4 }; }
  talk(pose, 'naujawan', t); N.update(pose);
  // suraahi tied at his belt (left hip)
  { const y = N.root.rotation.y; const p = N.root.position.clone().addScaledVector(rightOf(y), -0.24).addScaledVector(fwdOf(y), 0.02).add(V(0, 0.78, 0)); placeProp(SUR, p, y, [0, 0, 0.15]); SUR.group.scale.setScalar(0.8); }
  // fruit: appears by magic, top four are thrown to the kids
  const pop = (i) => EASE.outBack(clamp((t - 68.0 - i * 0.08) / 0.35, 0, 1));
  BASKET.fruit.forEach((m, i) => { const thrown = 13 - i; const gone = thrown >= 0 && thrown < 4 && t > TH[thrown]; m.visible = pop(i) > 0.01 && !gone; m.scale.setScalar(Math.max(0.01, pop(i))); });
  // kids
  KIDS.forEach((P, i) => { const rk = place(P, pathK[i], t, env); const kp = poseFrom(pKid[i], t, { walking: rk.speed > 0.25, handsFree: rk.speed < 0.25 }, rk.pose);
    if (t > 73.6 && rk.speed < 0.3) { const k = sstep(73.6, 74.1, t); kp.armL = { f: 60 * k + 5, o: 14, b: 35 }; kp.armR = { f: 60 * k + 5, o: 14, b: 35 }; delete kp.handL; delete kp.handR; kp.gripL = { curl: 0.6, thumb: 0.5 }; kp.gripR = { curl: 0.6, thumb: 0.5 }; }
    const caught = TH.filter((tl, j) => j % 2 === i && t > tl + 0.62).length; if (caught > 0 && t < 84) { P.root.position.y += 0.12 * Math.abs(Math.sin((t - 75) * 6)) * (1 - sstep(80, 82, t)); }
    P.update(kp); });
  TOSS.forEach((m, j) => { const tl = TH[j]; if (t < tl) return; const kid = KIDS[j % 2]; const catchP = kid.palmWorld('L').lerp(kid.palmWorld('R'), 0.5).add(V(0, 0.05, 0)); const u = clamp((t - tl) / 0.62, 0, 1);
    const from = m.userData.from || N.palmWorld('L').clone(); const p = from.clone().lerp(catchP, u); p.y += Math.sin(Math.PI * u) * 0.9; m.position.copy(u < 1 ? p : catchP); m.visible = true; });
  // jinn floats behind him
  { const rj = pathJ_baz.at(t); J.root.position.set(rj.x, 0.4 + 0.07 * Math.sin(t * 1.6), rj.z); J.root.rotation.set(0, rj.speed > 0.2 ? rj.yaw : angLerp(rj.yaw, yawTo(J.root.position, N.root.position), 0.8), 0); J.root.scale.setScalar(J.height);
    const jp = poseFrom(pJ, t, { walking: false, handsFree: true }, { walk: null }); jp.lean = (jp.lean || 0) + 10 * clamp(rj.speed, 0, 1);
    const snap = bump(67.4, 68.6, t); if (snap > 0.01) { jp.armL = { f: 125 * snap + 5, o: 10 - 25 * snap, b: 50 }; delete jp.handL; }
    talk(jp, 'jinn', t); J.update(jp); }
  // vazir in the dark arch, a guard behind him
  { VZ.root.position.set(B + 14.5, 0, -6.6); VZ.root.rotation.set(0, -0.35, 0); const vp = poseFrom(pV, t, { walking: false, handsFree: true }, { walk: null });
    if (t > 86.3 && t < 90) applyTimeline(vp, [[86.4, 'chin', 'R', 0.4, 2.5, 0.5]], t, 0); talk(vp, 'vazir', t); VZ.update(vp);
    const G = GUARDS[0]; G.root.position.set(B + 15.5, 0, -7.6); G.root.rotation.set(0, -0.6, 0); const gp = poseFrom(pG[0], t, { walking: false, handsFree: false }, { walk: null }); gp.armR = { f: 28, o: 10, b: 85 }; G.update(gp); spearIn(G, SPEARS[0]); }
  // shopkeeper behind his stall (north side, x=4)
  { SHOP.root.position.set(B + 4.0, 0, -4.75); SHOP.root.rotation.set(0, yawTo(SHOP.root.position, N.root.position) * 0.5, 0); const sp = poseFrom(pShop, t, { walking: false, handsFree: true }, { walk: null }); SHOP.update(sp); }
  // magic snap: flash at his fingers, sparkles over the basket
  flashAt(t, 67.95, 0.35, () => J.palmWorld('L'), 0.25);
  burst(SPARK, 0, 40, t, 68.0, BASKET.group.position.clone().add(V(0, 0.15, 0)), 1.1, 1.1, -0.2);
}
// ---------------- OASIS ----------------
function oasis(t) {
  [N, J, VZ, ...GUARDS].forEach((P) => (P.root.visible = true)); SUR.group.visible = true; SPEARS.forEach((s) => (s.group.visible = true));
  const vis = t > 114.3; VZ.root.visible = vis; GUARDS.forEach((G) => (G.root.visible = vis)); SPEARS.forEach((s) => (s.group.visible = vis));
  // young man: sits by the water -> stands, picks up the suraahi -> backs off -> carpet scoops him up
  const NS = V(O + 0.5, 0, 0.4), NB = V(O - 0.95, 0, -0.75); const back = EASE.inOut(ramp(126.8, 128.7, t)); const np = NS.clone().lerp(NB, back);
  const c = S.carpet; let onCarpet = c && t > 132.15 ? 1 : 0; const sitK = (1 - sstep(115.2, 116.4, t)) + sstep(132.15, 132.7, t);
  let yaw = 2.79; if (t > 114.9) yaw = angLerp(2.79, yawTo(np, VZ.root.position), sstep(114.9, 116.5, t)); if (t > 126.7) yaw = angLerp(yaw, yawTo(np, VZ.root.position) + 0.0, 1);
  if (onCarpet) { N.root.position.copy(c.p).add(V(0, 0.03, 0)); yaw = c.yaw; N.root.rotation.set(c.pitch * 0.5, yaw, c.roll * 0.5); } else { N.root.position.copy(np); N.root.rotation.set(0, yaw, 0); }
  const pose = poseFrom(pN, t, { walking: back > 0 && back < 1, handsFree: t < 116 }, { walk: back > 0 && back < 1 ? (t - 126.8) * 1.6 : null, walkK: back > 0 && back < 1 ? 0.8 : 0, gait: 0.7, ...SIT(clamp(sitK, 0, 1)) });
  if (back > 0 && back < 1) pose.lean = (pose.lean || 0) - 8;
  // suraahi: on the sand beside him -> picked up -> clutched -> on the carpet in his lap
  const rest = NS.clone().addScaledVector(rightOf(2.79), 0.48).addScaledVector(fwdOf(2.79), 0.15).add(V(0, 0.13, 0));
  if (t < 116.3) { placeProp(SUR, rest, 2.79 + Math.PI); if (t > 115.6) { handOnProp(N, 'L', SUR, 'hold', pose, sstep(115.6, 116.3, t)); } }
  else { const lift = EASE.inOut(ramp(116.3, 117.3, t)); const clutch = sstep(123.0, 123.5, t); const H = holdPoint(N, lerp(0.34, 0.22, clutch), lerp(1.0, 1.08, clutch)); if (onCarpet) H.copy(holdPoint(N, 0.42, 0.5));
    placeProp(SUR, rest.clone().lerp(H, lift), yaw + Math.PI); hold2(N, pose, SUR, 'hold', 1); if (clutch > 0) pose.twist = (pose.twist || 0) - 22 * clutch * (1 - sstep(126.5, 127.5, t)); }
  talk(pose, 'naujawan', t); N.update(pose);
  // jinn over the water
  { let jpz = V(O - 0.45, 0.42 + 0.07 * Math.sin(t * 1.4), -2.45); let jy = yawTo(jpz, N.root.position);
    if (c && t > 132.6) { const s = sstep(132.6, 133.3, t); jpz = jpz.lerp(c.p.clone().addScaledVector(rightOf(c.yaw), -1.3).add(V(0, 0.4, 0)), s); jy = angLerp(jy, c.yaw, s); }
    J.root.position.copy(jpz); J.root.rotation.set(0, jy, 0); J.root.scale.setScalar(J.height);
    const jp = poseFrom(pJ, t, { walking: false, handsFree: true }, { walk: null }); if (t > 99.7 && t < 106.5) jp.head.pitch -= 18 * bump(99.7, 106.5, t);
    const clap = bump(131.1, 132.3, t); if (clap > 0.01) { jp.armL = { f: 75 * clap + 5, o: 12, b: 60 * clap }; jp.armR = { f: 75 * clap + 5, o: 12, b: 60 * clap }; delete jp.handL; delete jp.handR; }
    if (t > 116.5 && t < 122) applyTimeline(jp, [[116.6, 'fist', 'L', 0.3, 4.4, 0.5]], t, 0);
    talk(jp, 'jinn', t); J.update(jp); }
  // vazir + guards
  if (vis) { const rv = place(VZ, pathV_oas, t, env); const vp = poseFrom(pV, t, { walking: rv.speed > 0.25, handsFree: rv.speed < 0.25 }, rv.pose);
    if (t > 120.4 && t < 123.3) applyTimeline(vp, [[120.5, 'reach', 'L', 0.5, 2.0, 0.4]], t, 0); if (t > 124.1 && t < 126.6) applyTimeline(vp, [[124.2, 'point', 'L', 0.18, 1.6, 0.5]], t, 0);
    if (t > 132.8) { vp.head.pitch -= 30 * sstep(132.8, 133.5, t); } talk(vp, 'vazir', t); VZ.update(vp);
    GUARDS.forEach((G, i) => { const rg = place(G, pathG_oas[i], t, env); const gp = poseFrom(pG[i], t, { walking: rg.speed > 0.25, handsFree: false }, rg.pose); gp.armR = { f: 28, o: 10, b: 85 }; delete gp.handR;
      if (t > 129.4 && t < 132.6 && rg.speed < 0.3) { const k = bump(129.4, 132.6, t); gp.armL = { f: 80 * k + 5, o: 10, b: 20 }; delete gp.handL; gp.lean = (gp.lean || 0) + 12 * k; }
      if (t > 132.8) gp.head.pitch -= 35 * sstep(132.8, 133.4, t); G.update(gp); spearIn(G, SPEARS[i]); }); }
  // carpet
  if (c) { CARPET.group.visible = true; CARPET.group.position.copy(c.p); CARPET.group.rotation.set(c.pitch, c.yaw, c.roll, 'YXZ'); waveCarpet(t, 0.6 + c.fly, 1); trail(t, 130.6, 134.0); }
}
// ---------------- NIGHT FLIGHT + PALACE ROOF + SUNRISE ----------------
function palace(t) {
  [N, J, VZ].forEach((P) => (P.root.visible = true)); SUR.group.visible = t < 184.62; CARPET.group.visible = true;
  const c = S.carpet; CARPET.group.position.copy(c.p); CARPET.group.rotation.set(c.pitch, c.yaw, c.roll, 'YXZ'); waveCarpet(t, c.fly > 0.05 ? 0.5 + c.fly : (t > 153.4 && t < 207.6 ? 0.08 : 0.4), 1);
  const flying = t < 153.5 || t > 208.6; const crash = sstep(151.85, 152.2, t) * (1 - sstep(153.2, 153.6, t));
  // ---- young man ----
  let pose; const NP = V(P_ - 1.5, 0, 2.75);
  if (flying) { const sk = t < 153.5 ? 1 - sstep(153.45, 154.1, t) : sstep(208.6, 209.3, t); N.root.position.copy(c.p).add(V(0, 0.03, 0)); N.root.rotation.set(c.pitch * 0.5, c.yaw, c.roll * 0.6);
    pose = poseFrom(pN, t, { walking: false, handsFree: t > 208.6 }, { walk: null, ...SIT(sk) }); if (crash > 0) { pose.lean = (pose.lean || 0) - 18 * crash; pose.armL = { f: 60, o: 50, b: 20 }; pose.armR = { f: 60, o: 50, b: 20 }; }
    if (t < 140 && t > CUT3) { const k = bump(135.5, 139.6, t); if (k > 0.01) { pose.armL = { f: 120 * k + 5, o: 10 - 30 * k, b: 20 }; delete pose.handL; } } }
  else { const sk = 1 - sstep(153.45, 154.1, t); N.root.position.copy(NP); const yaw = yawTo(NP, VZ.root.position); N.root.rotation.set(0, yaw, 0);
    pose = poseFrom(pN, t, { walking: false, handsFree: t > 155.2 }, { walk: null, ...SIT(sk) });
    const reach = bump(154.3, 155.6, t); if (reach > 0.01) { pose.armL = { f: 80 * reach, o: 15, b: 20 }; pose.armR = { f: 70 * reach, o: 15, b: 20 }; delete pose.handL; delete pose.handR; }
    const shout = bump(179.6, 184.2, t); if (shout > 0.01) { pose.armL = { f: 75 * shout + 5, o: 60 * shout + 10, b: 15 }; pose.armR = { f: 75 * shout + 5, o: 60 * shout + 10, b: 15 }; delete pose.handL; delete pose.handR; pose.head.pitch -= 10 * shout; }
    if (t > 171.6 && t < 174.6) pose.fx = { ...(pose.fx || {}), lid: 0.6 * bump(171.6, 174.6, t) };
    if (t > 199.5 && t < 205.5) applyTimeline(pose, [[199.7, 'heart', 'R', 0.4, 4.6, 0.6]], t, 0); }
  // suraahi: in his lap during the flight -> snatched by the vazir -> held high -> shatters
  const vHas = t > 154.42;
  if (!vHas) { const H = flying || t < 154.1 ? holdPoint(N, 0.42, t < 153.5 ? 0.5 : lerp(0.5, 1.0, sstep(153.5, 154.1, t))) : holdPoint(N, 0.34, 1.0); placeProp(SUR, H, N.root.rotation.y + Math.PI); hold2(N, pose, SUR, 'hold', 1 - crash * 0.8); }
  talk(pose, 'naujawan', t); N.update(pose);
  // ---- vazir on the roof ----
  { const rv = place(VZ, pathV_pal, t, env); let vy = rv.yaw; if (t < 153) vy = c ? yawTo(VZ.root.position, c.p) : vy; if (t > 155.6) vy = yawTo(VZ.root.position, N.root.position) + (t > 159.8 && t < 166 ? -0.5 * sstep(159.8, 160.6, t) * (1 - sstep(165.6, 166.4, t)) : 0); VZ.root.rotation.y = vy;
    const sitK = sstep(186.0, 187.1, t); const vp = poseFrom(pV, t, { walking: rv.speed > 0.25, handsFree: !vHas || t > 184.7 }, { ...rv.pose, ...SIT(sitK) });
    if (t < 153) { vp.head.pitch -= 25; const cast = bump(150.9, 152.1, t); if (cast > 0.01) { vp.armL = { f: 150 * cast + 5, o: 10 - 20 * cast, b: 10 }; delete vp.handL; } else if (t > 147 && t < 150.8) { vp.armL = { f: 140, o: -10, b: 60 }; delete vp.handL; } }
    if (t > 153.9 && !vHas) handOnProp(VZ, 'L', SUR, 'hold', vp, sstep(153.9, 154.4, t));
    if (vHas && t < 184.62) { const high = bump(155.3, 159.4, t); vp.armL = { f: lerp(45, 160, high), o: lerp(18, -12, high), b: lerp(80, 15, high) }; delete vp.handL; vp.gripL = { curl: 0.5, thumb: 0.5 };
      if (t > 166.2 && t < 170.8) applyTimeline(vp, [[166.3, 'point', 'R', 0.25, 4.0, 0.4]], t, 0); }
    if (t > 184.62 && t < 186) { vp.armL = { f: 60, o: 40, b: 30 }; delete vp.handL; vp.lean = (vp.lean || 0) - 15; }
    if (sitK > 0.01) { vp.lean = 10 * sitK; vp.armL = { f: 20, o: 10, b: 60 }; vp.armR = { f: 20, o: 10, b: 60 }; delete vp.handL; delete vp.handR; vp.head.pitch += 15 * sitK; }
    talk(vp, 'vazir', t); VZ.update(vp);
    if (vHas && t < 184.62) { propInHand(VZ, 'L', SUR, 'hold'); const sh = sstep(183.7, 184.6, t); SUR.group.position.add(V(Math.sin(t * 71) * 0.015 * sh, Math.sin(t * 57) * 0.012 * sh, 0)); } }
  // ---- jinn ----
  { let jpz, jy; if (flying && t < 154) { jpz = c.p.clone().addScaledVector(rightOf(c.yaw), -1.35).addScaledVector(fwdOf(c.yaw), -0.2).add(V(0, 0.45 + 0.1 * Math.sin(t * 2), 0)); jy = c.yaw; }
    else if (t < 208.6) { jpz = V(P_ + 0.05, 0.5 + 0.07 * Math.sin(t * 1.5), 0.6); jy = 0.2; if (t > 159.8 && t < 171) jy = yawTo(jpz, VZ.root.position); else if (t >= 171) jy = yawTo(jpz, N.root.position); if (t > 152.6 && t < 154.4) jpz.lerp(crPath(CK_FLY, Math.min(t, 152.6)).addScaledVector(rightOf(-1.2), -1.35).add(V(0, 0.45, 0)), 1 - sstep(152.6, 154.4, t)); }
    else { jpz = V(P_ + 0.05, 0.5, 0.6).lerp(c.p.clone().addScaledVector(rightOf(c.yaw), -1.35).add(V(0, 0.45, 0)), sstep(208.6, 210.0, t)); jy = angLerp(yawTo(V(P_, 0, 0.6), N.root.position), c.yaw, sstep(209, 210.2, t)); }
    J.root.position.copy(jpz); J.root.rotation.set(0, jy, 0); J.root.scale.setScalar(J.height);
    const jp = poseFrom(pJ, t, { walking: false, handsFree: true }, { walk: null }); if (flying) jp.lean = (jp.lean || 0) + 22;
    const wide = bump(140.5, 146.3, t); if (wide > 0.01) { jp.armL = { f: 70 * wide + 8, o: 10 + 70 * wide, b: 10 }; jp.armR = { f: 70 * wide + 8, o: 10 + 70 * wide, b: 10 }; delete jp.handL; delete jp.handR; }
    if (t > 160 && t < 165.4) applyTimeline(jp, [[160.2, 'point', 'L', 0.3, 4.6, 0.5]], t, 0);
    const wrists = bump(189.0, 194.3, t); if (wrists > 0.01) { jp.armL = { f: 80 * wrists + 5, o: 5, b: 95 * wrists }; jp.armR = { f: 80 * wrists + 5, o: 5, b: 95 * wrists }; delete jp.handL; delete jp.handR; jp.head.pitch += 20 * wrists * (1 - sstep(191.5, 192.4, t)); }
    const joyUp = bump(191.6, 194.6, t); if (joyUp > 0.01) { jp.armL = { f: 140 * joyUp + 10, o: 10 - 50 * joyUp, b: 10 }; jp.armR = { f: 140 * joyUp + 10, o: 10 - 50 * joyUp, b: 10 }; delete jp.handL; delete jp.handR; jp.head.pitch -= 25 * joyUp; }
    const bow = bump(195.2, 198.6, t); if (bow > 0.01) { jp.lean = (jp.lean || 0) + 30 * bow; jp.armL = { f: 55 * bow, o: 10, b: 90 * bow }; delete jp.handL; }
    const call = bump(207.0, 209.0, t); if (call > 0.01) { jp.armR = { f: 120 * call + 5, o: 10 - 30 * call, b: 20 }; delete jp.handR; }
    talk(jp, 'jinn', t); J.update(jp); }
  // red magic bolt from the vazir hits the carpet
  bolt(t, 151.15, 151.85, () => VZ.palmWorld('L'), () => crPath(CK_FLY, 151.85));
  // shatter
  if (t > 184.62) shatter(t, 184.62); burst(SPARK, 0, 60, t, 184.62, S.shatterAt || V(), 3.0, 1.8, 1.2); flashAt(t, 184.62, 0.5, () => S.shatterAt || V(), 1.4);
  if (t > 184.62 && t < 185.4) C.dofU.uFlash.value = 0.55 * (1 - ramp(184.62, 185.4, t));
  if (t > 189.9) { burst(SPARK, 0, 30, t, 190.0, CUFFS[0].userData.p0 || V(), 1.0, 0.9, 0.5); }
  if (t > 207.6) trail(t, 208.4, 216.2);
  // glow + practical light
  S.glow = t < 183.7 ? 0.55 + 0.25 * Math.sin(t * 2.3) : lerp(1, 5, ramp(183.7, 184.6, t));
}
// ================= effects =================
function spearIn(G, sp) { const p = G.palmWorld('R'); sp.group.position.copy(p).add(V(0, 0.15, 0)); sp.group.rotation.set(0.05, 0, 0.06); sp.group.visible = G.root.visible; }
function smokeSpiral(t, origin, t0, dur) { SMOKE.forEach((m, i) => { const u = i / SMOKE.length, ts = t0 + u * dur * 0.75, p = (t - ts) / 1.5; if (p <= 0 || p >= 1) { m.visible = false; return; }
  const a = 7 * p + i * 2.4, r = 0.1 + 0.6 * p, h = p * 2.6; m.position.copy(origin).add(V(Math.cos(a) * r, h, Math.sin(a) * r)); const s = (0.1 + 0.42 * Math.sin(Math.PI * Math.min(1, p * 1.3))) * (0.7 + 0.6 * hash(i)); m.scale.setScalar(s); m.visible = true; }); }
function dirHash(i) { const a = hash(i * 3.1) * Math.PI * 2, z = hash(i * 7.7) * 2 - 1, r = Math.sqrt(1 - z * z); return V(Math.cos(a) * r, z, Math.sin(a) * r); }
function burst(pool, i0, n, t, t0, center, speed, life, up = 0) { for (let i = i0; i < i0 + n; i++) { const m = pool[i]; const d = hash(i * 1.3 + t0) * 0.25, p = (t - t0 - d) / life; if (p <= 0 || p >= 1) continue;
  const dir = dirHash(i + Math.floor(t0)); dir.y = Math.abs(dir.y) * 0.6 + up * 0.3; m.position.copy(center).addScaledVector(dir, speed * life * (1 - Math.pow(1 - p, 2)) * 0.5).add(V(0, -0.8 * p * p, 0)); m.scale.setScalar(0.035 * (1 - p) + 0.005); m.rotation.y = t * 6 + i; m.visible = true; } }
function rising(pool, i0, n, t, t0, t1, at, rad) { if (t < t0 || t > t1 + 1) return; const c = at(); for (let i = i0; i < i0 + n; i++) { const m = pool[i]; const ph = hash(i * 5.1), p = ((t - t0) * 0.6 + ph) % 1; if (t > t1 && p < (t - t1)) continue;
  const a = ph * 20 + t * 2; m.position.copy(c).add(V(Math.cos(a) * rad * (1 - p * 0.5), (p - 0.5) * 2.4, Math.sin(a) * rad * (1 - p * 0.5))); m.scale.setScalar(0.03 * Math.sin(Math.PI * p) + 0.004); m.rotation.y = t * 5 + i; m.visible = true; } }
function trail(t, t0, t1) { if (!S.carpet) return; for (let i = 0; i < 40; i++) { const m = SPARK[i]; const ts = t - (i / 40) * 1.0; if (ts < t0 || ts > t1) continue; const c = carpetAt(ts); if (!c) continue; const p = (t - ts) / 1.0;
  m.position.copy(c.p).addScaledVector(rightOf(c.yaw), (hash(i) - 0.5) * 1.1).add(V(0, -0.05 - p * 0.5, 0)); m.scale.setScalar(0.03 * (1 - p) + 0.004); m.rotation.y = t * 4 + i; m.visible = true; } }
function bolt(t, t0, t1, from, to) { if (t < t0 || t > t1 + 0.5) return; const a = from(), b = to(); REDSPARK.forEach((m, i) => { const u = (t - t0) / (t1 - t0) - i * 0.03; if (t > t1) { const p = (t - t1) / 0.5; const dir = dirHash(i + 99); m.position.copy(b).addScaledVector(dir, p * 0.9); m.scale.setScalar(0.05 * (1 - p)); m.visible = p < 1; return; }
  if (u < 0 || u > 1) return; m.position.copy(a).lerp(b, u).add(V(Math.sin(i * 1.7 + t * 30) * 0.08, Math.cos(i * 2.3 + t * 25) * 0.08, 0)); m.scale.setScalar(0.045); m.rotation.y = t * 9; m.visible = true; }); }
function flashAt(t, t0, dur, at, size) { if (t < t0 || t > t0 + dur) return; const p = (t - t0) / dur; FLASH.position.copy(at()); FLASH.scale.setScalar(size * Math.sin(Math.PI * Math.sqrt(p)) + 0.001); FLASH.visible = true; }
function shatter(t, t0) { const dt = t - t0; SHARDS.forEach((m, i) => { const dir = dirHash(i + 500); dir.y = Math.abs(dir.y) + 0.2; const v = 2.2 + hash(i) * 1.5; const p = S.shatterAt.clone().addScaledVector(dir, v * dt); p.y -= 4.9 * dt * dt; if (p.y < 0.02) { p.y = 0.02; }
  m.position.copy(p); m.rotation.set(dt * 7 + i, dt * 5, i); m.visible = true; }); }
function orbs(t) { ORBS.forEach((m, i) => { const t0 = 47.3 + i * 0.45; if (t < t0 || t > 59.8) { m.visible = false; return; } const k = EASE.outBack(clamp((t - t0) / 0.4, 0, 1)) * (1 - sstep(58.9, 59.7, t)); const c = J.palmWorld('L').add(V(0, 0.22, 0));
  const ce = t > 52.5 ? J.root.position.clone().add(V(0, 1.55 * J.height, 0)) : c; const a = t * 2.4 + i * 2.094, r = t > 52.5 ? 0.62 : 0.2; m.position.copy(ce).add(V(Math.cos(a) * r, 0.08 * Math.sin(t * 3 + i), Math.sin(a) * r)); m.scale.setScalar(Math.max(0.01, k)); m.visible = true; }); }

// ================= CAMERA =================
const CINE = new Cine({ env: { colliders: COL, terrain: T }, blend: 0.7 });
CINE.defaults = { fov: 32, shake: 0.4 };
const relY = (P) => () => P.root.rotation.y;
const mid = (a, b, w = 0.5) => () => a.headWorld().lerp(b.headWorld(), w);
const carpetT = () => (S.carpet ? S.carpet.p.clone().add(V(0, 0.75, 0)) : V());
const carpetYaw = () => (S.carpet ? S.carpet.yaw : 0);
// desert
CINE.shot(0, 4.2, { rig: 'crane', at: CT.walker(pathN_des, T, 1.2), size: [7, 2.8], az: [140, 40], el: [38, 9], fov: 40, ease: 'inOut', shake: 0.3 })
  .shot(4.2, 8.6, { rig: 'track', at: CT.head(N), lag: 0.2, size: 'ms', az: [35, 15], el: [4, 6], fov: 32 })
  .shot(8.6, 10.2, { rig: 'push', at: CT.pt(0.05, 0.85, 0.2), size: [2.4, 1.8], az: [70, 55], el: [8, 12], fov: 30, shake: 0.9 })
  .shot(10.2, 12.6, { rig: 'orbit', at: () => SUR.group.position.clone().lerp(N.headWorld(), 0.45), size: 1.5, az: [40, 20], el: [14, 18], fov: 28, rel: relY(N) })
  .shot(12.6, 16.6, { rig: 'push', at: () => N.headWorld().lerp(SUR.group.position, 0.3), size: [1.1, 0.8], az: [15, 0], el: [-10, -5], fov: 28, rel: relY(N), focus: CT.head(N) })
  .shot(16.6, 20.7, { rig: 'orbit', at: () => N.headWorld().lerp(SUR.group.position, 0.5), size: 1.0, az: [-25, -50], el: [-4, -2], fov: 28, rel: relY(N) })
  .shot(20.7, 22.6, { rig: 'push', at: CT.obj(SUR.group), size: [0.55, 0.38], az: [-30, -18], el: 10, fov: 26, rel: relY(N) })
  .shot(22.6, 25.6, { rig: 'static', at: CT.pt(0.2, 1.5, 0.7), size: 3.4, az: [82, 96], el: [6, 12], fov: 38, shake: 1.6, kick: 12 })
  .shot(25.6, 33.0, { rig: 'low', at: CT.head(J), size: ['mws', 'ms'], az: [10, -15], fov: 34, rel: relY(J), shake: 0.8 })
  .shot(33.0, 36.7, { rig: 'push', at: CT.head(N), size: ['ms', 'mcu'], az: [10, 25], el: 16, fov: 30, rel: relY(N) })
  .shot(36.7, 44.3, { rig: 'orbit', at: mid(N, J), size: 3.0, az: [95, 72], el: [5, 9], fov: 34 })
  .shot(44.3, 49.1, { rig: 'orbit', at: CT.chest(J), size: [1.6, 1.25], az: [-15, 20], el: 4, fov: 32, rel: relY(J) })
  .shot(49.1, 52.9, { rig: 'ots', from: CT.head(J), at: CT.head(N), fov: 32 })
  .shot(52.9, 56.6, { rig: 'push', at: CT.head(J), size: ['ms', 'mcu'], az: [12, -6], el: 2, fov: 30, rel: relY(J) })
  .shot(56.6, CUT1, { rig: 'crane', at: mid(N, J), size: [3.0, 4.6], az: [120, 140], el: [8, 22], fov: 34 })
// bazaar
  .shot(CUT1, 66.3, { rig: 'track', at: CT.walker(pathN_baz, T, 1.3), lag: 0.15, size: 'fs', az: [62, 48], el: [6, 4], fov: 34, cut: true })
  .shot(66.3, 68.0, { rig: 'orbit', at: mid(N, J), size: 2.2, az: [-8, 8], el: 6, fov: 50 })
  .shot(68.0, 70.8, { rig: 'push', at: CT.obj(BASKET.group), size: [0.8, 0.55], az: [10, -10], el: [28, 36], fov: 30, rel: relY(N) })
  .shot(70.8, 72.6, { rig: 'push', at: CT.head(N), size: ['mcu', 'cu'], az: [5, -5], el: 3, fov: 28, rel: relY(N) })
  .shot(72.6, 77.4, { rig: 'orbit', at: CT.pt(B + 3.2, 1.0, 0.6), size: 3.2, az: [12, 30], el: [8, 12], fov: 48 })
  .shot(77.4, 82.1, { rig: 'push', at: CT.head(J), size: ['ms', 'mcu'], az: [-8, 8], el: 2, fov: 30, rel: relY(J) })
  .shot(82.1, 90.0, { rig: 'pov', from: (t) => V(B + 13.6, 1.85, -0.6).lerp(V(B + 14.2, 1.75, -3.6), EASE.inOut(ramp(82.1, 90, t))), at: CT.head(VZ), fov: 32, kick: 14, swing: 9 })
  .shot(90.0, CUT2, { rig: 'pov', from: (t) => V(B + 14.25, 1.74, -4.3).lerp(V(B + 14.4, 1.74, -4.95), EASE.inOut(ramp(90, CUT2, t))), at: CT.eyes(VZ), fov: 28 })
// oasis
  .shot(CUT2, 99.4, { rig: 'crane', at: mid(N, J), size: [7, 2.8], az: [190, 175], el: [30, 8], fov: 36, cut: true })
  .shot(99.4, 107.4, { rig: 'low', at: CT.head(J), size: ['ms', 'mcu'], az: [8, -8], fov: 30, rel: relY(J) })
  .shot(107.4, 112.1, { rig: 'push', at: CT.head(N), size: ['ms', 'mcu'], az: [-5, 10], el: 4, fov: 30, rel: relY(N) })
  .shot(112.1, 115.0, { rig: 'orbit', at: mid(N, J), size: 2.5, az: [98, 85], el: 6, fov: 34 })
  .shot(115.0, 120.2, { rig: 'static', at: CT.pt(O + 4.0, 1.3, 1.3), size: 4.4, az: [200, 214], el: [8, 6], fov: 36 })
  .shot(120.2, 123.2, { rig: 'push', at: CT.head(VZ), size: ['ms', 'mcu'], az: [-5, 8], el: 3, fov: 30, rel: relY(VZ) })
  .shot(123.2, 124.3, { rig: 'push', at: CT.head(N), size: ['mcu', 'cu'], az: [10, 5], el: 3, fov: 28, rel: relY(N), ease: 'snap' })
  .shot(124.3, 126.3, { rig: 'ots', from: CT.head(N), at: CT.head(VZ), fov: 32 })
  .shot(126.3, 131.2, { rig: 'orbit', at: mid(N, GUARDS[0]), size: 3.8, az: [150, 175], el: [10, 6], fov: 36, shake: 1.2 })
  .shot(131.2, CUT3, { rig: 'crane', at: () => N.root.position.clone().add(V(0, 0.9, 0)), size: [2.6, 4.2], az: [120, 150], el: [6, 28], fov: 38 })
// flight
  .shot(CUT3, 140.0, { rig: 'track', at: carpetT, size: 2.8, az: [60, 28], el: [10, 4], fov: 36, rel: carpetYaw, cut: true })
  .shot(140.0, 146.3, { rig: 'orbit', at: CT.head(J), size: 'ms', az: [70, 100], el: 4, fov: 32, rel: carpetYaw })
  .shot(146.3, 149.2, { rig: 'track', at: carpetT, size: [6, 9], az: [200, 230], el: [-4, 2], fov: 40, rel: carpetYaw })
  .shot(149.2, 152.0, { rig: 'push', at: CT.head(VZ), size: ['mws', 'ms'], az: [20, 40], el: -4, fov: 34, rel: relY(VZ) })
  .shot(152.0, 154.3, { rig: 'static', at: CT.pt(P_ - 0.7, 1.4, 2.4), size: 5.2, az: [10, 25], el: [10, 6], fov: 38, shake: 1.6 })
// roof
  .shot(154.3, 159.5, { rig: 'push', at: CT.head(VZ), size: ['ms', 'mws'], az: [-25, -5], el: 0, fov: 32, rel: relY(VZ) })
  .shot(159.5, 165.8, { rig: 'push', at: CT.head(J), size: ['ms', 'mcu'], az: [-10, 6], el: 3, fov: 30, rel: relY(J) })
  .shot(165.8, 171.4, { rig: 'orbit', at: mid(N, VZ), size: 2.3, az: [-8, 8], el: 6, fov: 34 })
  .shot(171.4, 175.1, { rig: 'push', at: CT.head(N), size: ['mcu', 'cu'], az: [6, -6], el: 2, fov: 28, rel: relY(N) })
  .shot(175.1, 176.9, { rig: 'push', at: CT.head(J), size: 'mcu', az: [10, 0], el: 2, fov: 28, rel: relY(J) })
  .shot(176.9, 183.6, { rig: 'push', at: CT.head(N), size: ['ms', 'mcu'], az: [-18, 6], el: 3, fov: 30, rel: relY(N) })
  .shot(183.6, 188.7, { rig: 'push', at: () => (SUR.group.visible ? SUR.group.position.clone() : (S.shatterAt || V()).clone()), size: [0.9, 2.6], az: [40, 55], el: [6, 10], fov: 30, rel: relY(VZ), ease: 'inOut' })
  .shot(188.7, 195.1, { rig: 'crane', at: () => J.headWorld().add(V(0, -0.35, 0)), size: [1.6, 2.0], az: [-8, 12], el: [8, 2], fov: 32, rel: relY(J) })
  .shot(195.1, 199.4, { rig: 'orbit', at: mid(N, J), size: 2.5, az: [5, -10], el: 6, fov: 34 })
  .shot(199.4, 206.4, { rig: 'push', at: CT.head(N), size: ['ms', 'mcu'], az: [0, 14], el: 3, fov: 30, rel: relY(N) })
  .shot(206.4, 209.6, { rig: 'orbit', at: CT.head(J), size: 'ms', az: [-10, 12], el: 3, fov: 32, rel: relY(J) })
  .shot(209.6, DURATION + 1, { rig: 'crane', at: carpetT, size: [3.2, 15], az: [-30, -42], el: [8, 16], fov: 38, ease: 'inOut' });
// sky-tilt transitions: before a scene cut the camera tilts up into the sky, after it tilts down from the sky
function tiltSky(cam, u) { if (u <= 0) return cam; const pos = V(...cam.pos), look = V(...cam.look), d = look.clone().sub(pos); const L0 = d.length(); d.normalize(); const pitch0 = Math.asin(clamp(d.y, -1, 1)), h = V(d.x, 0, d.z).normalize(); const e = EASE.inOutCubic(u), pitch = lerp(pitch0, 1.25, e);
  const nd = h.multiplyScalar(Math.cos(pitch)).add(V(0, Math.sin(pitch), 0)); cam.look = pos.clone().addScaledVector(nd, L0).toArray(); cam.fov += 10 * e; cam.ap *= 1 - e; cam.roll += 0.12 * Math.sin(Math.PI * e); return cam; }
function camAt(t) { let c = CINE.at(t); for (const tc of [CUT1, CUT2, CUT3]) { if (t > tc - 1.3 && t < tc) c = tiltSky(c, ramp(tc - 1.3, tc, t)); if (t >= tc && t < tc + 1.5) c = tiltSky(c, 1 - ramp(tc, tc + 1.5, t)); } return c; }

// ================= LOOK =================
function lookAt(t) { const Z = zoneAt(t); let L0;
  if (Z === 'DES') L0 = mixLook(LK.dawn, LK.morning, sstep(0, 45, t)); else if (Z === 'BAZ') L0 = LK.noon; else if (Z === 'OAS') L0 = mixLook(LK.sunset, LK.night, 0.35 * sstep(128, 134, t)); else L0 = mixLook(LK.night, LK.sunrise, sstep(184.6, 194, t));
  return L0; }
const GLOWBASE = new THREE.Color(0x7ad8ff).convertSRGBToLinear();
window.renderFrame = function (f) {
  const t = f / FPS; update(t); const cam = camAt(t); const Z = zoneAt(t);
  GLOW.color.copy(GLOWBASE).multiplyScalar(1 + 2.2 * S.glow);
  const pl = []; if (SUR.group.visible && S.glow > 0.05) pl.push({ pos: SUR.group.position.toArray(), col: [0.15 * Math.min(S.glow, 1.6), 0.4 * Math.min(S.glow, 1.6), 0.55 * Math.min(S.glow, 1.6)], range: 2.0 + Math.min(S.glow, 1.6) });
  if (Z === 'PAL' && t < 192) { const k = 1 - sstep(185, 192, t); pl.push({ pos: [P_ - 6.5, 2.1, -3.1], col: [1.0 * k, 0.55 * k, 0.2 * k], range: 7 }, { pos: [P_ + 5.5, 1.9, -7.4], col: [1.0 * k, 0.55 * k, 0.2 * k], range: 7 }); }
  const sc = Z === 'PAL' && t < 153.3 && S.carpet ? S.carpet.p.toArray() : cam.look; applyLook(lookAt(t), { pl, shadowCenter: sc, shadowSize: Z === 'PAL' && t < 153 ? 26 : 16 });
  C.setCam({ pos: cam.pos, look: cam.look, fov: cam.fov, roll: cam.roll, near: 0.05, far: 600 });
  dofU.uFocus.value = cam.focus; dofU.uAper.value = cam.ap * 0.45 * PX; dofU.uMaxC.value = 12 * PX; dofU.uTime.value = f * 0.37;
  dofU.uFade.value = Math.max(1 - Math.min(1, t / 0.7), clamp((t - (DURATION - 1.6)) / 1.6, 0, 1)); if (!(t > 184.62 && t < 185.4)) dofU.uFlash.value = 0;
  C.drawFrame(); return 'ok';
};
window.dbg = (f) => { const t = f / FPS; update(t); return { N: N.root.position.toArray().map((v) => +v.toFixed(2)), J: J.root.position.toArray().map((v) => +v.toFixed(2)), V: VZ.root.position.toArray().map((v) => +v.toFixed(2)) }; };
// deterministic anchors (so any frame can be rendered on its own): shatter point, cuff break points, fruit launch points
update(184.6); S.shatterAt = SUR.group.position.clone();
update(189.98); CUFFS.forEach((c) => (c.userData.p0 = c.position.clone()));
[74.4, 75.2, 76.0, 76.8].forEach((tl, j) => { update(tl); TOSS[j].userData.from = N.palmWorld('L').clone(); });
window.ready = true;
