// actor.js (Studio v9.1): characters ACT all the time. Give a mood track, get a new micro-beat every 0.2–0.35 s:
// the face changes inside the mood family, the head tilts/turns/stretches on the neck, the body switches gesture with
// anticipation + overshoot, and a squash "pop" lands on every beat. Use with installActing() (it blends the faces).
//
//   import { perform, MOODS, GESTURES } from '../../web/actor.js';
//   HERO.update({ ...perform(t, [[0, 'happy'], [1.2, 'attitude', { talk: true }], [2.0, 'shock', { hop: 1 }]], 7), prop: ... }, camPos);
//
// Track entries: [t0, mood, opts]. opts: { talk: lip flaps · rate: beat length (s) · gestures: [names] (override) ·
//   faces: [names] (override) · hold: true (keep one gesture, only face/head change) · energy: 0..1.5 (size of moves) ·
//   pose: {...} extra pose merged on top (e.g. walk) · look: [x, y] fixed eye target }
import { FACES } from './flat2d.js';

const H = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const lerp = (a, b, k) => a + (b - a) * k, clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const back = (u) => { const c = 1.7; return 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2; };

// ---- faces: extra expressions on top of flat2d FACES (all usable by name) ----
export const XFACES = {
  cool: { eyes: 'lid', lid: 0.42, squint: 0.1, mouth: 'smirk1', browL: 0.6, browR: -0.3, look: [0.4, 0] },
  wink: { eyes: 'lid', lidL: 0.05, lidR: 1, mouth: 'grin', browL: 0.5, browR: -0.4 },
  cheeky: { eyes: 'happy', mouth: 'sly', browL: 0.8, browR: 0.2, look: [0.5, -0.2] },
  rage: { eyes: 'stare', mouth: 'teeth', brow: -1.4, squint: 0.25 },
  fume: { eyes: 'lid', lid: 0.35, lidTilt: -0.4, mouth: 'frown', brow: -1.2 },
  yell: { eyes: 'stare', mouth: 'scream', brow: -1.2 },
  gasp: { eyes: 'wide', mouth: 'o', brow: 1.3 },
  horror: { eyes: 'tiny', mouth: 'wobble', brow: 1.5 },
  joy: { eyes: 'happy', mouth: 'laugh', brow: 0.6 },
  beam: { eyes: 'happy', mouth: 'bigsmile', brow: 0.4 },
  giggle: { eyes: 'squeeze', mouth: 'laugh', brow: 0.3 },
  nervous: { eyes: 'wide', mouth: 'grimace', brow: 1.0, look: [0.6, 0.2] },
  doubt: { eyes: 'lid', lidL: 0.1, lidR: 0.45, mouth: 'flat', browL: 1.0, browR: -0.5, look: [0.5, -0.3] },
  plotting: { eyes: 'lid', lid: 0.45, lidTilt: -0.3, mouth: 'psycho', brow: -0.9, look: [0.6, 0] },
  pout: { eyes: 'lid', lid: 0.3, mouth: 'smallO', brow: 0.8, look: [-0.5, 0.4] },
  sob: { eyes: 'squeeze', mouth: 'wobble', brow: 1.2, tears: true },
  dizzy: { eyes: 'dot', mouth: 'wobble', brow: 0.6 },
  eager: { eyes: 'wide', mouth: 'bigsmile', brow: 0.9 },
  focused: { eyes: 'lid', lid: 0.3, squint: 0.2, mouth: 'line', brow: -0.6 },
};
const face = (n) => (typeof n === 'string' ? XFACES[n] || FACES[n] || FACES.neutral : n);

// ---- mood families: faces cycle inside the family (never the same twice in a row) ----
export const MOODS = {
  happy: { faces: ['happy', 'beam', 'grin', 'joy', 'cheeky', 'proud'], gestures: ['thumbsUp', 'wave', 'cheer', 'clap', 'openArms', 'hipsHappy'], neck: [0, 8], tilt: 9, hop: 10 },
  laugh: { faces: ['joy', 'giggle', 'laugh', 'joy', 'beam'], gestures: ['bellyLaugh', 'pointLaugh', 'slapKnee', 'bellyLaugh'], neck: [0, 6], tilt: 12, hop: 8 },
  attitude: { faces: ['cool', 'smug', 'sideeye', 'wink', 'proud', 'cheeky'], gestures: ['crossArms', 'hips', 'fixTie', 'pointCool', 'leanBack', 'shrugCool'], neck: [0, 4], tilt: 7, hop: 0 },
  angry: { faces: ['angry', 'rage', 'yell', 'fume', 'grumpy'], gestures: ['fistShake', 'stabPoint', 'fists', 'stomp', 'armsWide'], neck: [-6, 4], tilt: 6, hop: 6, lean: 10 },
  shock: { faces: ['shock', 'gasp', 'horror', 'scared'], gestures: ['handsUp', 'cheeks', 'recoil', 'handsUp'], neck: [30, 60], tilt: 5, hop: 22 },
  scared: { faces: ['scared', 'nervous', 'panic', 'horror'], gestures: ['cower', 'shield', 'biteNails', 'cower'], neck: [-10, 0], tilt: 6, hop: 0 },
  sad: { faces: ['sad', 'pout', 'sob', 'worried'], gestures: ['slump', 'headHand', 'slump'], neck: [-12, -4], tilt: 8, hop: 0 },
  think: { faces: ['thinking', 'doubt', 'suspicious', 'confused', 'idea'], gestures: ['chin', 'scratchHead', 'chin', 'fingerUp'], neck: [0, 6], tilt: 10, hop: 0 },
  evil: { faces: ['evil', 'plotting', 'scheming', 'smug'], gestures: ['rubHands', 'fingerTent', 'pointCool'], neck: [0, 4], tilt: 6, hop: 0 },
  excited: { faces: ['eager', 'beam', 'awe', 'joy'], gestures: ['fistPump', 'cheer', 'jumpJack', 'clap'], neck: [4, 14], tilt: 10, hop: 26 },
  talk: { faces: ['neutral', 'happy', 'doubt', 'proud', 'cheeky'], gestures: ['explainL', 'explainR', 'openArms', 'countFinger', 'pointCool'], neck: [0, 6], tilt: 8, hop: 0, talk: true },
  determined: { faces: ['determined', 'focused', 'angry'], gestures: ['fists', 'fistPump', 'pointAhead'], neck: [0, 4], tilt: 4, hop: 4, lean: 6 },
  confused: { faces: ['confused', 'doubt', 'dizzy'], gestures: ['shrug', 'scratchHead', 'shrug'], neck: [0, 10], tilt: 14, hop: 0 },
  phone: { faces: ['neutral', 'happy', 'doubt', 'shock'], gestures: ['phoneEar'], neck: [0, 4], tilt: 8, hop: 0, talk: true },
  // v9.2 extra moods
  cool: { faces: ['cool', 'smug', 'wink', 'sideeye'], gestures: ['tipHat', 'leanBack', 'hips', 'crossArms', 'pointCool'], neck: [0, 4], tilt: 6, hop: 0 },
  menace: { faces: ['plotting', 'evil', 'focused', 'fume'], gestures: ['fingerTent', 'rubHands', 'stabPoint', 'crossArms'], neck: [-6, 2], tilt: 5, hop: 0, lean: 8 },
  sneaky: { faces: ['sideeye', 'suspicious', 'plotting', 'nervous'], gestures: ['crouch', 'tiptoe', 'crouch'], neck: [-4, 6], tilt: 10, hop: 0 },
  victory: { faces: ['joy', 'eager', 'beam', 'proud'], gestures: ['fistPump', 'cheer', 'jumpJack', 'thumbsUp'], neck: [6, 18], tilt: 12, hop: 30 },
  cry: { faces: ['sob', 'sad', 'pout'], gestures: ['slump', 'headHand', 'cheeks'], neck: [-12, -2], tilt: 10, hop: 0 },
  run: { faces: ['determined', 'scared', 'focused', 'panic'], gestures: ['runA', 'runB'], neck: [0, 6], tilt: 6, hop: 12, lean: 14 },
};

// ---- gestures (armL/armR = [shoulder°, elbow°]; + extra body) ----
export const GESTURES = {
  rest: { armL: [16, -32], armR: [16, -32] },
  thumbsUp: { armL: [16, -32], armR: [70, -100], lean: -3 },
  wave: { armL: [16, -32], armR: [150, 30] },
  cheer: { armL: [155, 20], armR: [155, 20], hop: 14 },
  clap: { armL: [70, -95], armR: [70, -95], lean: 4 },
  openArms: { armL: [95, 20], armR: [95, 20], lean: -4 },
  hipsHappy: { armL: [40, -120], armR: [40, -120], hip: 14 },
  bellyLaugh: { armL: [35, -110], armR: [35, -110], lean: -8, squash: 0.08 },
  pointLaugh: { armL: [35, -110], armR: [92, -4], lean: -6 },
  slapKnee: { armL: [16, -32], armR: [10, -60], lean: 18, bend: 10 },
  crossArms: { armL: [55, -135], armR: [55, -135], lean: -4 },
  hips: { armL: [40, -120], armR: [40, -120], hip: -12, lean: -3 },
  fixTie: { armL: [16, -32], armR: [62, -150] },
  pointCool: { armL: [40, -120], armR: [92, -4], lean: -3 },
  leanBack: { armL: [30, -60], armR: [30, -60], lean: -9, hip: 10 },
  shrugCool: { armL: [60, -110], armR: [60, -110], tilt: 8 },
  fistShake: { armL: [16, -40], armR: [140, -50], lean: 6 },
  stabPoint: { armL: [30, -70], armR: [95, -2], lean: 12 },
  fists: { armL: [30, -100], armR: [30, -100], lean: 8, squash: 0.06 },
  stomp: { armL: [20, -90], armR: [20, -90], squash: 0.14, lean: 4 },
  armsWide: { armL: [120, -20], armR: [120, -20], lean: 6 },
  handsUp: { armL: [160, 10], armR: [160, 10], lean: -8 },
  cheeks: { armL: [130, -150], armR: [130, -150] },
  recoil: { armL: [100, -60], armR: [100, -60], lean: -14 },
  cower: { armL: [120, -140], armR: [120, -140], kneel: 0.25, lean: 6 },
  shield: { armL: [100, -110], armR: [100, -110], lean: -8 },
  biteNails: { armL: [16, -32], armR: [120, -160] },
  slump: { armL: [8, -10], armR: [8, -10], lean: 12, bend: 12 },
  headHand: { armL: [16, -32], armR: [140, -165], lean: 6 },
  chin: { armL: [45, -130], armR: [115, -150] },
  scratchHead: { armL: [16, -32], armR: [160, -150] },
  fingerUp: { armL: [16, -32], armR: [140, -30] },
  rubHands: { armL: [55, -110], armR: [55, -110], lean: 6 },
  fingerTent: { armL: [70, -125], armR: [70, -125] },
  fistPump: { armL: [30, -90], armR: [150, -60], hop: 18 },
  jumpJack: { armL: [150, 40], armR: [150, 40], hop: 34 },
  explainL: { armL: [80, -30], armR: [20, -40] },
  explainR: { armL: [20, -40], armR: [85, -40] },
  countFinger: { armL: [60, -100], armR: [70, -120] },
  shrug: { armL: [60, -110], armR: [60, -110], tilt: 10 },
  pointAhead: { armL: [16, -32], armR: [96, -2], lean: 8 },
  phoneEar: { armL: [16, -32], armR: [125, -160], tilt: 10 },
  tipHat: { armL: [16, -32], armR: [165, -155], tilt: -6 }, crouch: { armL: [70, -110], armR: [70, -110], kneel: 0.3, lean: 10 }, tiptoe: { armL: [40, -140], armR: [40, -140], hop: 10, lean: 8 },
  aimGun: { armL: [70, -60], armR: [92, -4], lean: 4 }, runA: { armL: [60, -100], armR: [-30, -60], lean: 16 }, runB: { armL: [-30, -60], armR: [60, -100], lean: 16 },
};

// beat grid inside one segment: lengths between 0.2 and 0.2 + 0.15 s (deterministic)
function beatAt(t, t0, rate, seed) { let s = t0, k = 0; for (;;) { const d = rate * (0.85 + 0.6 * H(seed + k * 1.7, 3)); if (t < s + d || k > 400) return [k, s, d]; s += d; k++; } }

function beatPose(M, opts, k, seed, energy) {
  const fs = opts.faces || M.faces, gs = opts.gestures || M.gestures;
  const fi = Math.floor(H(seed, k) * fs.length), fj = (k > 0 && Math.floor(H(seed, k - 1) * fs.length) === fi) ? (fi + 1) % fs.length : fi;
  const gk = opts.hold ? 0 : Math.floor(k / 2);   // the body changes gesture every 2 beats (0.4–0.6 s), the face every beat
  const gi = Math.floor(H(seed + 9, gk) * gs.length); const G = GESTURES[gs[gi]] || GESTURES.rest;
  const side = H(seed + 3, k) > 0.5 ? 1 : -1, E = energy;
  const pose = { ...G, tilt: (G.tilt || 0) + side * M.tilt * (0.4 + 0.6 * H(seed + 4, k)) * E, turn: (H(seed + 5, k) - 0.5) * 0.5,
    neck: lerp(M.neck[0], M.neck[1], H(seed + 6, k)) * E, headX: (H(seed + 7, k) - 0.5) * 16 * E, lean: ((G.lean || 0) + (M.lean || 0) * E) * 0.45,   // front view: lean reads as a sideways tilt, keep it small
    hop: k % 2 === 0 ? (G.hop || 0) + M.hop * E * (k === 0 ? 1.4 : 0.6) : (G.hop || 0) * 0.3 };
  const f = { ...face(fs[fj]) }; if (opts.look) f.look = opts.look; else if (!f.look) f.look = [(H(seed + 8, k) - 0.5) * 1.2, (H(seed + 2, k) - 0.5) * 0.5];
  return [pose, f];
}

const NUMK = ['tilt', 'turn', 'neck', 'headX', 'lean', 'hop', 'hip', 'squash', 'bend', 'kneel'];
// perform(t, track, seed) → pose for Flat2D.update (includes face; add your own props / walk on top)
export function perform(t, track, seed = 1) {
  let i = 0; while (i < track.length - 1 && t >= track[i + 1][0]) i++; const [t0, mood, opts = {}] = track[i]; const M = MOODS[mood] || MOODS.talk;
  const rate = opts.rate || 0.22, E = opts.energy ?? 1.3; const [k, s, d] = beatAt(t, t0, rate, seed + i * 31);
  const [P1, F1] = beatPose(M, opts, k, seed + i * 31, E);
  let P0; if (k > 0) P0 = beatPose(M, opts, k - 1, seed + i * 31, E)[0];
  else if (i > 0) { const [pt0, pm, po = {}] = track[i - 1]; const pk = beatAt(t0 - 1e-4, pt0, po.rate || 0.26, seed + (i - 1) * 31)[0]; P0 = beatPose(MOODS[pm] || MOODS.talk, po, pk, seed + (i - 1) * 31, po.energy ?? 1)[0]; }
  else P0 = P1;
  const u = clamp((t - s) / Math.min(0.11, d * 0.5), 0, 1), e = back(u); const out = {};
  for (const n of NUMK) out[n] = lerp(P0[n] || 0, P1[n] || 0, e);
  for (const n of ['armL', 'armR']) { const a = P0[n] || GESTURES.rest[n], b = P1[n] || GESTURES.rest[n]; out[n] = [lerp(a[0], b[0], e), lerp(a[1], b[1], e)]; }
  // beat pop: squash in, stretch out, head lag (rubber follow-through)
  const pop = Math.sin(clamp((t - s) / 0.14, 0, 1) * Math.PI); out.squash = (out.squash || 0) + 0.06 * pop * E; out.headLag = 9 * pop * (k % 2 ? 1 : -1) * E; out.hatOff = 10 * pop;
  if (mood === 'laugh') { out.tilt += 7 * Math.sin(t * 24); out.bob = -6 * Math.abs(Math.sin(t * 12)); }
  if (mood === 'angry' || mood === 'shock') out.headX += 3 * Math.sin(t * 40) * (mood === 'shock' ? 1 : 0.6);   // tremble
  if (opts.talk || M.talk) F1.mouth = ['talk', 'smallO', 'o', 'talk', 'grin'][Math.floor(t * 9 + seed) % 5];
  // v9.2 HYPER layer: a "take" on every mood change (squash → stretch pop, hop, speed lines, a ! or ? mark),
  // continuous head life between beats, and mood FX (anger steam, fear sweat, tears, laugh shake)
  const since = t - t0, take = since < 0.22 ? Math.sin(since / 0.22 * Math.PI) : 0, FX = {};
  if (take > 0 && i > 0) { out.squash += (since < 0.08 ? 0.22 : -0.12) * E; out.hop += 18 * take * E; out.neck += (mood === 'shock' ? 30 : 10) * take; FX.lines = take;
    const mk = { shock: '!', excited: '!', victory: '!', confused: '?', think: '?', angry: '#', scared: '!' }[mood]; if (mk) FX.mark = mk; }
  out.tilt += Math.sin(t * 6.3 + seed) * 2.2 * E; out.headX += Math.sin(t * 4.7 + seed * 2) * 3 * E;
  if (mood === 'angry' || mood === 'menace') FX.steam = mood === 'angry' ? 1 : 0; if (mood === 'scared' || mood === 'sneaky') FX.sweat = t; if (mood === 'cry') FX.tears = true; if (mood === 'run') FX.lines = 1;
  if (mood === 'laugh' || mood === 'victory') out.tilt += 5 * Math.sin(t * 26);
  return { ...out, ...FX, ...(opts.pose || {}), face: F1, noBlink: false };
}
