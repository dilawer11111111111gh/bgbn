// roles.js : 44 ROLE presets for Flat2D (every place gets its OWN people: different body, clothes, hair, hat, props)
// + POSES library (full-body acting) + act() helper with anticipation / overshoot.
//   import { role, POSE, act } from '../../web/roles.js';
//   const COOK = new Flat2D(role('chef', 1));          // 2nd arg = variant seed (changes colours/hair so two chefs differ)
//   COOK.update({ ...act(t, [[0,'idle'],[1.2,'point'],[2.0,'cheer']]), face:{...} }, cam)
const pick = (arr, k) => arr[((k % arr.length) + arr.length) % arr.length];
const HAIR = ['#2a1a12', '#5a3a26', '#7a5236', '#3a2418', '#a8742e', '#9a9a9a', '#d8c08a', '#1a1a1a'];
const SKIN = ['#fdfaf2'];
export const ROLES = {
  // ---- work ----
  farmer:     (k) => ({ body: 'overalls', coat: pick(['#5b86c4', '#4a6fa8', '#6a8ab8'], k), shirt: pick(['#e85a3a', '#f2b53a', '#c8d84a'], k), hat: 'flat', hatCol: '#d8b46a', band: '#8a5a2a', hair: pick(HAIR, k + 1), hairStyle: 'bangs' }),
  mechanic:   (k) => ({ body: 'overalls', coat: '#5a6470', shirt: '#9aa8b8', patch: '#e8402a', hat: 'ball', hatCol: pick(['#2a5ad0', '#e2463a', '#2a2a2a'], k), band: '#fff', hair: pick(HAIR, k), hairStyle: 'messy', tool: 'wrench' }),
  builder:    (k) => ({ body: 'coat', coat: '#f08a2a', tie: null, badge: '#f4f0e0', hat: 'hardhat', hatCol: '#f4c430', hair: pick(HAIR, k + 2), hairStyle: 'bangs', belt: '#6a4630', width: 1.12 }),
  miner:      (k) => ({ body: 'overalls', coat: '#4a4a52', shirt: '#8a5a3a', hat: 'hardhat', hatCol: '#e2a83a', hair: pick(HAIR, k), hairStyle: 'bangs', beard: k % 2 ? '#4a2f20' : null }),
  engineer:   (k) => ({ body: 'coat', coat: pick(['#2f4f8a', '#3a6a5a'], k), tie: '#e0b03a', badge: '#f2e8d0', hat: 'hardhat', hatCol: '#fff', hair: pick(HAIR, k + 3), hairStyle: 'side', glasses: 'square', pens: 1 }),
  scientist:  (k) => ({ body: 'coat', coat: '#f4f6f8', tie: pick(['#d02a2a', '#2a5ad0'], k), badge: null, hat: null, hair: pick(['#9a9a9a', '#f2f2f2', '#5a3a26'], k), hairStyle: 'messy', glasses: 'round', pens: 1 }),
  inventor:   (k) => ({ body: 'coat', coat: '#8a5a3a', tie: '#e0b03a', apron: '#6a4630', hat: 'aviator', hatCol: '#6a4630', hair: pick(HAIR, k), hairStyle: 'bangs' }),
  chef:       (k) => ({ body: 'coat', coat: '#f8f6f0', tie: null, scarf: '#d02a2a', badge: null, hat: 'chef', hatCol: '#fff', hair: pick(HAIR, k), hairStyle: 'bangs', mustache: k % 2 === 0, width: 1.15 }),
  baker:      (k) => ({ body: 'coat', coat: '#f2e2c8', tie: null, apron: '#fff', hat: 'beret', hatCol: '#d8c8a8', hair: pick(HAIR, k + 4), hairStyle: 'bangs', width: 1.2 }),
  waiter:     (k) => ({ body: 'bean', coat: '#1e1e24', shirt: '#fff', tie: '#d02a2a', badge: null, hat: null, hair: pick(HAIR, k), hairStyle: 'side', mustache: true }),
  postman:    (k) => ({ body: 'coat', coat: '#3a5ab0', tie: '#d02a2a', badge: '#f2c63a', hat: 'police', hatCol: '#3a5ab0', band: '#d02a2a', hair: pick(HAIR, k), hairStyle: 'bangs', bag: '#8a5a2a' }),
  sailor:     (k) => ({ body: 'coat', coat: '#f4f6f8', tie: '#2a4ab0', scarf: '#2a4ab0', badge: null, hat: 'sailor', hatCol: '#fff', band: '#2a4ab0', hair: pick(HAIR, k), hairStyle: 'bangs' }),
  captain:    (k) => ({ body: 'bean', coat: '#1e2a4a', shirt: '#fff', tie: '#e0b03a', badge: '#e0b03a', hat: 'police', hatCol: '#fff', band: '#1e2a4a', hair: '#f2f2f2', hairStyle: 'side', beard: '#f2f2f2' }),
  pilot:      (k) => ({ body: 'coat', coat: '#7a4a2a', tie: null, scarf: '#f4f0e6', badge: null, hat: 'aviator', hatCol: '#5a3a22', hair: pick(HAIR, k), hairStyle: 'bangs' }),
  fisherman:  (k) => ({ body: 'overalls', coat: '#e2c83a', shirt: '#3a5a8a', hat: 'flat', hatCol: '#e2c83a', band: '#8a6a2a', hair: pick(HAIR, k), hairStyle: 'bangs', beard: '#7a5236' }),
  gardener:   (k) => ({ body: 'overalls', coat: '#5a8a3a', shirt: '#f2e8c8', hat: 'flat', hatCol: '#e8d090', band: '#5a8a3a', hair: pick(HAIR, k + 2), hairStyle: 'bangs' }),
  painter:    (k) => ({ body: 'coat', coat: '#f2f0ea', tie: null, apron: '#7ab8e8', hat: 'beret', hatCol: '#d02a2a', hair: pick(HAIR, k), hairStyle: 'side', mustache: true }),
  // ---- authority / town ----
  mayor:      (k) => ({ body: 'bean', coat: pick(['#3a2a4a', '#2a3a2a'], k), shirt: '#fff', tie: '#d02a2a', badge: '#e8b03a', hat: 'top', hatCol: '#1e1a1e', band: '#d02a2a', hair: '#9a9a9a', hairStyle: 'side', mustache: true, width: 1.3 }),
  banker:     (k) => ({ body: 'bean', coat: '#3a3a44', shirt: '#fff', tie: '#e0b03a', badge: null, hat: 'bowler', hatCol: '#1e1a1e', band: '#3a3a44', hair: pick(HAIR, k), hairStyle: 'side', glasses: 'round' }),
  judge:      (k) => ({ body: 'bean', coat: '#141418', shirt: '#fff', tie: '#fff', badge: null, hat: null, hair: '#f2f2f2', hairStyle: 'messy', glasses: 'square' }),
  cop:        (k) => ({ body: 'coat', coat: '#24346a', tie: '#1a1a1a', badge: null, star: 1, hat: 'police', hatCol: '#24346a', band: '#1a1a1a', hair: pick(HAIR, k), hairStyle: 'bangs', belt: '#1a1a1a' }),
  sheriff:    (k) => ({ body: 'coat', coat: '#b8864a', tie: null, scarf: '#d02a2a', star: 1, hat: 'cowboy', hatCol: '#6a4630', band: '#2a1a14', hair: pick(HAIR, k), hairStyle: 'bangs', mustache: true, belt: '#4a2e1e' }),
  cowboy:     (k) => ({ body: 'coat', coat: pick(['#a84a2a', '#4a6a8a', '#8a7a4a'], k), tie: null, scarf: pick(['#e8c84a', '#2a5ad0'], k), badge: null, hat: 'cowboy', hatCol: pick(['#d8b46a', '#3a2620'], k), band: '#2a1a14', hair: pick(HAIR, k), hairStyle: 'bangs', belt: '#4a2e1e' }),
  teacher:    (k) => ({ body: 'dress', coat: pick(['#6a4a8a', '#3a6a8a'], k), hat: null, hair: pick(HAIR, k + 1), hairStyle: 'side', glasses: 'round' }),
  doctor:     (k) => ({ body: 'coat', coat: '#f4f6f8', tie: '#3a8ad0', badge: '#d02a2a', hat: null, hair: pick(HAIR, k), hairStyle: 'side', glasses: 'round', pens: 1 }),
  reporter:   (k) => ({ body: 'coat', coat: '#c8a070', tie: '#3a3a3a', badge: '#fff', hat: 'flat', hatCol: '#8a6a4a', band: '#2a1a14', hair: pick(HAIR, k), hairStyle: 'side', pens: 1 }),
  shopkeeper: (k) => ({ body: 'coat', coat: '#4a7a5a', tie: null, apron: '#f4f0e0', hat: null, hair: pick(HAIR, k + 3), hairStyle: 'side', mustache: true, width: 1.2 }),
  conductor:  (k) => ({ body: 'bean', coat: '#2a3a6a', shirt: '#fff', tie: '#e0b03a', badge: '#e0b03a', hat: 'police', hatCol: '#2a3a6a', band: '#e0b03a', hair: pick(HAIR, k), hairStyle: 'bangs', mustache: true }),
  // ---- people ----
  kid:        (k) => ({ body: 'overalls', coat: pick(['#5b86c4', '#d84a3a', '#4a9a5a'], k), shirt: pick(['#f2b53a', '#fff', '#e8a0c0'], k), hat: 'ball', hatCol: pick(['#d23a32', '#2a5ad0', '#3aa04a'], k), band: '#fff', hair: pick(HAIR, k), hairStyle: 'bangs', size: 1.4 }),
  girl:       (k) => ({ body: 'dress', coat: pick(['#d8343a', '#3a7ad8', '#e88a2a'], k), hat: null, hair: pick(HAIR, k + 1), hairStyle: 'pigtails', band: pick(['#d8343a', '#f2c63a'], k), size: 1.4 }),
  teen:       (k) => ({ body: 'coat', coat: pick(['#e85a7a', '#3aa0d8', '#8a5ad0'], k), tie: null, badge: null, hat: null, hair: pick(HAIR, k + 2), hairStyle: 'messy', size: 1.65 }),
  grandma:    (k) => ({ body: 'dress', coat: pick(['#8a5aa0', '#5a8aa0'], k), hat: 'scarf', hatCol: pick(['#d84a6a', '#4a8ad0'], k), hair: '#f2f2f2', hairStyle: 'side', glasses: 'round', size: 1.6, width: 1.15 }),
  grandpa:    (k) => ({ body: 'coat', coat: '#8a7a5a', tie: '#6a2a2a', badge: null, hat: 'flat', hatCol: '#6a6a6a', band: '#2a2a2a', hair: '#f2f2f2', hairStyle: 'side', beard: '#f2f2f2', glasses: 'round', size: 1.7 }),
  tourist:    (k) => ({ body: 'coat', coat: pick(['#3ad0b0', '#f28a3a'], k), tie: null, badge: '#f2c63a', hat: 'flat', hatCol: '#f2e0a0', band: '#d02a2a', hair: pick(HAIR, k), hairStyle: 'bangs', glasses: 'square', bag: '#2a2a2a', width: 1.2 }),
  athlete:    (k) => ({ body: 'coat', coat: pick(['#e2463a', '#2a5ad0'], k), tie: null, badge: '#fff', hat: null, scarf: null, hair: pick(HAIR, k), hairStyle: 'messy', width: 0.95 }),
  coach:      (k) => ({ body: 'coat', coat: '#2a6a3a', tie: null, badge: '#fff', hat: 'ball', hatCol: '#2a6a3a', band: '#fff', hair: pick(HAIR, k), hairStyle: 'bangs', mustache: true, width: 1.25 }),
  musician:   (k) => ({ body: 'bean', coat: pick(['#8a2a5a', '#2a2a6a'], k), shirt: '#f2c63a', tie: '#1a1a1a', badge: null, hat: 'beret', hatCol: '#1a1a1a', hair: pick(HAIR, k), hairStyle: 'side', beard: pick(HAIR, k) }),
  lady:       (k) => ({ body: 'dress', coat: pick(['#e85a8a', '#3aa0a0', '#a07ad0'], k), hat: 'bonnet', hatCol: pick(['#f2e0a0', '#fff'], k), band: '#d8343a', hair: pick(HAIR, k + 2), hairStyle: 'side' }),
  gentleman:  (k) => ({ body: 'bean', coat: pick(['#4a3a2a', '#2a3a4a', '#5a2a2a'], k), shirt: '#fff', tie: '#e0b03a', badge: null, hat: pick(['top', 'bowler'], k), hatCol: '#2a2224', band: '#8a2a24', hair: pick(HAIR, k), hairStyle: 'side', mustache: k % 2 === 1 }),
  worker:     (k) => ({ body: 'coat', coat: pick(['#6a7a5a', '#7a5a4a', '#5a6a8a'], k), tie: null, badge: null, scarf: pick(['#d02a2a', '#2a5ad0', '#e8c84a'], k), hat: 'cap', hatCol: pick(['#6a6a6a', '#4a3a2a'], k), hair: pick(HAIR, k), hairStyle: 'bangs', size: 1.75 + (k % 3) * 0.06 }),
  // ---- story types ----
  villain:    (k) => ({ body: 'bean', coat: '#f1e6c8', shirt: '#fff', tie: '#2a1a14', badge: '#e8b03a', hat: null, hair: '#3a2418', hairStyle: 'pompadour', size: 1.95 }),
  rival:      (k) => ({ body: 'bean', coat: '#2a2a2a', shirt: '#d02a2a', tie: '#fff', badge: null, hat: 'top', hatCol: '#1a1a1a', band: '#d02a2a', hair: '#1a1a1a', hairStyle: 'side', mustache: true, size: 1.95 }),
  hero:       (k) => ({ body: 'coat', coat: '#2f4f8a', tie: '#e0b03a', badge: '#f2e8d0', hat: null, hair: '#6a4630', hairStyle: 'side' }),
  sidekick:   (k) => ({ body: 'overalls', coat: '#5b86c4', shirt: '#f2b53a', hat: 'ball', hatCol: '#d23a32', band: '#d23a32', hair: '#5a3a26', hairStyle: 'bangs', size: 1.6 }),
};
export const ROLE_IDS = Object.keys(ROLES);
export function role(id, k = 0, extra = {}) { const f = ROLES[id]; if (!f) throw new Error('unknown role ' + id); return { seed: (k * 7 + id.length) % 13 + 1, ...f(k), ...extra }; }

// ---------------- POSES (arms: [shoulder deg from down, outward +; elbow deg]) ----------------
export const POSE = {
  idle:     { armL: [14, 6], armR: [14, 6] },
  wave:     (t) => ({ armL: [14, 6], armR: [150 + 16 * Math.sin(t * 16), 25 * Math.sin(t * 16)], tilt: 4 }),
  point:    { armL: [14, 6], armR: [95, 0], lean: 4 },
  pointUp:  { armL: [14, 6], armR: [165, 0], tilt: -6 },
  cheer:    (t) => ({ armL: [150 + 10 * Math.sin(t * 18), -20], armR: [150 + 10 * Math.sin(t * 18 + 1), -20], hop: Math.max(0, Math.sin(t * 12)) * 40 }),
  shrug:    { armL: [55, -110], armR: [55, -110], tilt: 8, squash: 0.05 },
  hips:     { armL: [40, -125], armR: [40, -125], lean: -3 },
  think:    { armL: [30, -120], armR: [35, 125], tilt: 10 },
  panic:    (t) => ({ armL: [140 + 30 * Math.sin(t * 25), -40 * Math.sin(t * 25)], armR: [140 + 30 * Math.sin(t * 25 + 2), -40 * Math.sin(t * 25 + 2)], hop: Math.abs(Math.sin(t * 14)) * 22, legOut: 10 }),
  run:      (t) => ({ armL: [40 + 35 * Math.sin(t * 16), 70], armR: [40 - 35 * Math.sin(t * 16), 70], walk: t * 16, amp: 40, lean: 14, bob: -Math.abs(Math.sin(t * 16)) * 16 }),
  walk:     (t) => ({ armL: [12 + 20 * Math.sin(t * 9), 10], armR: [12 - 20 * Math.sin(t * 9), 10], walk: t * 9, amp: 24, lean: 4, bob: -Math.abs(Math.sin(t * 9)) * 8 }),
  carry:    { armL: [80, -10], armR: [80, -10], lean: -6, squash: 0.06 },
  push:     { armL: [88, 8], armR: [92, 4], lean: 18, legOut: 14 },
  pull:     { armL: [80, 30], armR: [76, 34], lean: -18, legOut: 12 },
  fall:     (t) => ({ armL: [150, 20], armR: [130, -30], lean: -70, legOut: 25, tilt: -20 }),
  sit:      { armL: [30, 40], armR: [30, 40], legOut: 40 },
  bow:      { armL: [10, 40], armR: [60, 90], lean: 25 },
  laugh:    (t) => ({ armL: [30, -120], armR: [30, -120], squash: 0.07 * Math.sin(t * 30), tilt: 8 * Math.sin(t * 12) }),
  angry:    (t) => ({ armL: [70, -60 + 12 * Math.sin(t * 30)], armR: [70, -60 + 12 * Math.sin(t * 30 + 1)], hop: Math.abs(Math.sin(t * 20)) * 10, lean: 6 }),
  sad:      { armL: [5, 0], armR: [5, 0], lean: 8, tilt: -10, bob: 10 },
  kneel:    { armL: [30, 40], armR: [60, 50], kneel: 1 },
  crouch:   { armL: [40, 60], armR: [40, 60], kneel: 0.5, lean: 10 },
  crossArms:{ armL: [25, -150], armR: [25, -150], lean: -4 },
  thumbsUp: { armL: [14, 6], armR: [70, -95], tilt: 6 },
  facepalm: { armL: [14, 6], handHead: 'R', tilt: 10, lean: 6 },
  proud:    { armL: [40, -125], armR: [40, -125], lean: -8, squash: -0.05 },
  laughPoint: (t) => ({ armL: [30, -120], armR: [95, 0], squash: 0.07 * Math.sin(t * 30), tilt: 10 * Math.sin(t * 12), hop: Math.abs(Math.sin(t * 14)) * 12 }),
  hammer:   (t) => ({ armL: [40, 40], armR: [150 - 120 * Math.abs(Math.sin(t * 9)), 20], prop: 'hammer', lean: 6 }),
  row:      (t) => ({ armL: [70 + 30 * Math.sin(t * 7), 30], armR: [70 + 30 * Math.sin(t * 7), 30], prop: 'paddle', lean: 8 * Math.sin(t * 7) }),
  flail:    (t) => ({ armL: [165 + 15 * Math.sin(t * 22), -20 * Math.sin(t * 22)], armR: [165 + 15 * Math.sin(t * 22 + 2), -20 * Math.sin(t * 22 + 2)], hop: Math.abs(Math.sin(t * 16)) * 20 }),
  swim:     (t) => ({ armL: [90 + 70 * Math.sin(t * 8), 20], armR: [90 + 70 * Math.sin(t * 8 + Math.PI), 20], walk: t * 10, amp: 20 }),
  presenter:{ armL: [14, 6], armR: [70, 30], lean: 3 },
  shock:    (t) => ({ armL: [120, -30], armR: [120, -30], hop: 30, squash: -0.08 }),
};
const lerpA = (a, b, k) => (Array.isArray(a) && Array.isArray(b) ? a.map((v, i) => v + (b[i] - v) * k) : (typeof a === 'number' && typeof b === 'number' ? a + (b - a) * k : k < 0.5 ? a : b));
const ev = (n, t) => { const p = POSE[n] || POSE.idle; return typeof p === 'function' ? p(t) : p; };
// act(t, [[time,'pose'],...], trans=0.14): blends poses with anticipation (small opposite dip) + overshoot (back.out)
export function act(t, plan, trans = 0.14) {
  let i = 0; while (i < plan.length - 1 && t >= plan[i + 1][0]) i++;
  const cur = ev(plan[i][1], t); if (i === 0 && t < plan[0][0]) return { ...cur };
  const prev = i > 0 ? ev(plan[i - 1][1], t) : cur; const u = Math.min(1, (t - plan[i][0]) / trans);
  const s = 1.70158, k = u < 1 ? 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2) : 1;   // back.out overshoot
  const out = {}; for (const key of new Set([...Object.keys(prev), ...Object.keys(cur)])) { const a = prev[key] ?? (Array.isArray(cur[key]) ? [14, 6] : 0), b = cur[key] ?? (Array.isArray(a) ? [14, 6] : 0); out[key] = lerpA(a, b, k); }
  if (u < 1) out.squash = (out.squash || 0) + 0.06 * Math.sin(u * Math.PI);                   // squash on every change
  return out;
}
