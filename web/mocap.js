// mocap.js : play recorded human motion (CMU motion capture, converted by mocap/bvh2rig.py) on a Flat2D cartoon rig.
//   await loadMo(['79_70', ...], './mocap');   pose = mo('79_70', t, { t0: 20.9, from: 1.0, amp: 1.3, mirror: false })
//   CHAR.update({ ...pose, face: 'laugh' }, cam)     // arms, legs, spine lean, head tilt and the hop/bob come from the recording
export const MO = {};
export async function loadMo(names, base) { await Promise.all(names.map(async (n) => { MO[n] = (await (await fetch(`${base}/${n}.json`)).json()).frames; })); }
const lerp = (a, b, k) => a + (b - a) * k;
const L2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
export function mo(name, t, o = {}) {
  if ((o.hold ?? 0.38) > 0) { const h = o.hold ?? 0.38, tr = o.snap ?? 0.09, rel = t - (o.t0 || 0); const k = Math.floor(rel / h), u = rel - k * h; const A = moRaw(name, (o.t0 || 0) + k * h, o);
    if (u < h - tr) return A; const B = moRaw(name, (o.t0 || 0) + (k + 1) * h, o); let e = (u - (h - tr)) / tr; const c = 1.7; e = 1 + (c + 1) * (e - 1) ** 3 + c * (e - 1) ** 2;
    const out = {}; for (const key of Object.keys(A)) { const x = A[key], y = B[key]; out[key] = Array.isArray(x) ? x.map((v, i) => v + (y[i] - v) * e) : typeof x === 'number' ? x + (y - x) * e : y; } return out; }
  return moRaw(name, t, o); }
function moRaw(name, t, o = {}) {
  const F = MO[name]; if (!F) return {}; const { t0 = 0, from = 0.7, speed = 1, amp = 1.25, mirror = false, loop = false, root = 0.6 } = o;
  let x = (from + (t - t0) * speed) * 30; const n = F.length - 1; if (loop) x = ((x % n) + n) % n; x = Math.max(0, Math.min(n - 0.001, x));
  const i = Math.floor(x), k = x - i, a = F[i], b = F[i + 1] || a, b0 = F[Math.floor(from * 30)] || F[0];
  const c = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  let armL = L2(a.armL, b.armL, k), armR = L2(a.armR, b.armR, k), legL = L2(a.legL, b.legL, k), legR = L2(a.legR, b.legR, k);
  let lean = c(lerp(a.lean, b.lean, k) * amp, -35, 35), tilt = c(lerp(a.tilt, b.tilt, k) * amp, -28, 28), dx = (lerp(a.dx, b.dx, k) - b0.dx) * root, dy = (lerp(a.dy, b.dy, k) - b0.dy) * root;
  armL = [armL[0] * amp, armL[1]]; armR = [armR[0] * amp, armR[1]];
  if (mirror) { [armL, armR] = [armR, armL]; [legL, legR] = [legR.map((v) => -v), legL.map((v) => -v)]; lean = -lean; tilt = -tilt; dx = -dx; }
  return { armL, armR, legL, legR, lean: -lean, tilt, hop: Math.max(-60, Math.min(160, dy)), shiftX: dx, bend: -lean * 1.2, headLag: -lean * 0.5 };
}
