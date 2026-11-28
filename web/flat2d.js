// flat2d.js v2 : FLAT 2D cartoon characters in a REAL 3D world (reference "3D set + flat 2D people" style).
// Look matched to the reference: white round head with dark hair cap + bangs, calm half-lidded grey eyes, tiny smile,
// small bell-shaped coat with white collar points, long thin tie, yellow badge, thin limbs, round dark hands,
// warm dark-brown slightly wobbly hand-drawn outline. Drawn every frame on a canvas, card turns to face the camera.
//   const A = new Flat2D({ coat:'#3b5ba8', tie:'#e0b03a', hat:'top', hair:'#2a1d16' });  A.place(x,y,z);
//   A.update({ armL:[20,10], armR:[150,-30], walk:t*9, amp:24, face:{eyes:'wide', mouth:'o', brow:1} }, camPos)
import * as THREE from 'three';
import * as C from './core.js';

const R = (d) => (d * Math.PI) / 180;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const INK = '#2a1810';
function softShadowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(30,16,8,0.5)'); gr.addColorStop(0.6, 'rgba(30,16,8,0.25)'); gr.addColorStop(1, 'rgba(30,16,8,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t;
}
let SHT = null, CLOTHN = null;
// expression presets (use by name: face:'shock')
export const FACES = {
  neutral: { eyes: 'lid', lid: 0.12, squint: 0.05, mouth: 'smirk1' }, calm: { eyes: 'lid', lid: 0.35, squint: 0.1, mouth: 'smirk1' },
  happy: { eyes: 'lid', lid: 0.05, squint: 0.26, mouth: 'bigsmile', brow: 0.3 }, grin: { eyes: 'lid', lid: 0.06, squint: 0.24, mouth: 'grin', brow: 0.2 }, laugh: { eyes: 'happy', mouth: 'laugh', brow: 0.5 },
  proud: { eyes: 'lid', lid: 0.5, squint: 0.15, mouth: 'smirk1', browL: 0.5, browR: 0.1, look: [0, -0.4] }, smug: { eyes: 'lid', lidL: 0.32, lidR: 0.45, squint: 0.12, look: [0.9, 0], mouth: 'smirk1', browL: 0.9, browR: -0.3 },
  sideeye: { eyes: 'lid', lid: 0.36, squint: 0.12, look: [1, 0], mouth: 'line', browL: -0.5, browR: 0.6 }, suspicious: { eyes: 'lid', lidL: 0.48, lidR: 0.18, squintL: 0.18, squintR: 0.05, look: [0.6, 0], mouth: 'line', browL: -1.0, browR: 0.8 },
  evil: { eyes: 'lid', lid: 0.38, lidTilt: -0.3, squint: 0.18, mouth: 'grin', brow: -1.0, look: [0.5, 0] }, scheming: { eyes: 'lid', lid: 0.4, squint: 0.2, lidTilt: -0.15, look: [-0.8, 0.2], mouth: 'smirk1', brow: -0.6 },
  angry: { eyes: 'lid', lid: 0.3, lidTilt: -0.45, squint: 0.15, mouth: 'talk', brow: -1.5 }, grumpy: { eyes: 'lid', lid: 0.5, lidTilt: -0.3, squint: 0.2, mouth: 'frown', brow: -1.2 },
  shock: { eyes: 'tiny', mouth: 'scream', brow: 1.5 }, scared: { eyes: 'wide', mouth: 'wobble', brow: 1.3 }, panic: { eyes: 'tiny', mouth: 'wobble', brow: 1.6 },
  confused: { eyes: 'lid', lidL: 0.05, lidR: 0.4, squintR: 0.2, look: [0, -0.6], mouth: 'line', browL: 1.1, browR: -0.6 }, worried: { eyes: 'lid', lid: 0.3, lidTilt: 0.45, look: [0, 0.4], mouth: 'wobble', brow: 1.0 },
  sad: { eyes: 'lid', lid: 0.45, lidTilt: 0.5, look: [0, 0.7], mouth: 'frown', brow: 1.0 }, bored: { eyes: 'lid', lid: 0.62, look: [0, 0.3], mouth: 'line' },
  idea: { eyes: 'wide', mouth: 'grin', brow: 1.2 }, awe: { eyes: 'wide', mouth: 'smallO', brow: 1.2 }, sleepy: { eyes: 'lid', lid: 0.82, mouth: 'line' }, deadpan: { eyes: 'lid', lid: 0.55, mouth: 'line' },
  dreamy: { eyes: 'lid', lid: 0.38, squint: 0.16, look: [0.3, -0.8], mouth: 'smile', brow: 0.4 }, determined: { eyes: 'lid', lid: 0.32, lidTilt: -0.25, squint: 0.15, mouth: 'flat', brow: -0.8 },
};
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };
// hand-drawn wobble: deterministic per character (no shimmer), tiny amplitude
const wob = (seed, i, a = 1.6) => 0;   // clean style: perfectly smooth outlines (reference look)

export class Flat2D {
  constructor(o = {}) {
    this.o = { coat: '#3b5ba8', tie: '#e0b03a', badge: '#f0b43a', collar: '#fbf6ec', hat: null, hatCol: '#3a2620', band: '#a02a24', skin: '#fff3e6',
      hair: '#2a1d16', hairStyle: 'bangs', bust: false, size: 1.85, res: 2.0, front: 0, mustache: false, seed: 1, ...o };
    const S = this.S = this.o.res; this.cw = Math.round((this.o.wide ? 1024 : 512) * S); this.hr = this.o.headroom || 0; this.ch = Math.round(((this.o.bust ? 512 : 1024) + this.hr) * S);
    this.cv = document.createElement('canvas'); this.cv.width = this.cw; this.cv.height = this.ch; this.g = this.cv.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.NoColorSpace; this.tex.anisotropy = 8;
    this.tex.generateMipmaps = true; this.tex.minFilter = THREE.LinearMipmapLinearFilter;
    const h = this.o.size * (this.o.bust ? 0.5 : 1), w = this.o.bust ? h : h * (this.o.wide ? 1 : 0.5); const hh = h * (1 + this.hr / 1024);
    const geo = new THREE.PlaneGeometry(w, hh); geo.translate(0, hh / 2, 0);
    const parent = this.o.scene || C.stage.cards;   // o.scene: draw into a normal three.js scene (PBR renderer) instead of the toon card pass
    if (this.o.scene) this.tex.colorSpace = THREE.SRGBColorSpace;
    const mat = this.o.scene ? new THREE.MeshBasicMaterial({ map: this.tex, color: 0xeeeae4, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, toneMapped: false }) : C.cardMat(this.tex);
    this.mesh = new THREE.Mesh(geo, mat); this.mesh.frustumCulled = false; parent.add(this.mesh);
    if (!this.o.bust) {
      SHT = SHT || softShadowTex();
      this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.34), this.o.scene ? new THREE.MeshBasicMaterial({ map: SHT, transparent: true, depthWrite: false, toneMapped: false }) : C.fxMat(SHT)); this.shadow.rotation.x = -Math.PI / 2; this.shadow.renderOrder = -5; parent.add(this.shadow);
    }
    this.pos = new THREE.Vector3(); this.h = h;
  }
  place(x, y, z) { this.pos.set(x, y, z); return this; }
  // world position of a point in arm space (this.handL / this.handR, or a prop point via propPt) from the last draw — lets 3D props meet the 2D hands
  toWorld(pt) { const m = this.armM; if (!m || !pt) return this.pos.clone(); const q = m.transformPoint(new DOMPoint(pt[0], pt[1])); const w = this.mesh.geometry.parameters.width, hh = this.mesh.geometry.parameters.height, ry = this.mesh.rotation.y;
    const u = q.x / this.cw - 0.5, v = 1 - q.y / this.ch; return this.mesh.position.clone().add(new THREE.Vector3(Math.cos(ry) * u * w, v * hh, -Math.sin(ry) * u * w)); }
  propPt(hd, px, py, sc = 1.45) { if (!hd) return null; const a = -(hd.ang || 0) * Math.PI / 180, x = px * sc, y = py * sc; return [hd[0] + x * Math.cos(a) - y * Math.sin(a), hd[1] + x * Math.sin(a) + y * Math.cos(a)]; }
  // ALIVE layer (always on): blinks, eye darts, breathing, tiny head motion. Flat2D.T = current time (set once per frame).
  alive(p) {
    const t = Flat2D.T ?? 0, sd = this.o.seed * 1.37; const f = typeof p.face === 'string' ? { ...(FACES[p.face] || FACES.neutral) } : p.face ? { ...p.face } : { ...FACES.neutral };
    const per = 2.4 + (sd % 1.3), ph = (t + sd) % per; if (ph < 0.11 && ['dot', 'calm', 'sly', 'lid', 'stare', undefined].includes(f.eyes) && !p.noBlink) f.eyes = 'closed';
    if (!f.look) { const k = Math.floor((t + sd) / 0.9); f.look = [Math.sin(k * 12.9898 + sd) * 0.5, Math.sin(k * 78.233 + sd) * 0.3]; }
    if (p.talk) f.mouth = ['talk', 'smallO', 'line', 'talk', 'smallO', 'smirk1'][Math.floor((t + sd) * 12) % 6];   // lip sync ONLY while this character speaks
    // the expression drives the whole head: laughs shake it, shock trembles, a psycho stare sways
    { const m = f.mouth, e = f.eyes; if (m === 'laugh') p = { ...p, tilt: (p.tilt || 0) + 6 * Math.sin(t * 22), bob: (p.bob || 0) - 7 * Math.abs(Math.sin(t * 11)), squash: (p.squash || 0) + 0.035 * Math.abs(Math.sin(t * 11)), headLag: (p.headLag || 0) + 5 * Math.sin(t * 11) };
      if (e === 'tiny' || m === 'scream' || m === 'wobble') p = { ...p, headX: (p.headX || 0) + 2.6 * Math.sin(t * 70) };
      if (m === 'psycho' || e === 'stare') p = { ...p, tilt: (p.tilt || 0) + 2.2 * Math.sin(t * 3.1 + sd) }; }
    // ALIVE v3 (reference style): calm, held poses; the head LOOKS somewhere and holds, then snaps to a new look; accents only on stressed words
    const E = (Flat2D.E || 0) * (p.e ?? 0.6), ON = Math.min(1, (Flat2D.ON || 0) * 6) * (p.e ?? 0.6);
    if (f.brow === undefined && f.browL === undefined && ON > 0.25) f.brow = Math.min(1.1, ON);
    const slot = Math.floor((t + sd * 3) / 1.9), u = ((t + sd * 3) % 1.9) / 1.9; const look = (k) => [-0.55, 0.45, -0.25, 0.6, 0.15, -0.5][Math.abs(Math.floor(k * 7 + sd * 13)) % 6];
    const turn = p.turn ?? (look(slot - 1) + (look(slot) - look(slot - 1)) * Math.min(1, u * 9) ** 2 * (3 - 2 * Math.min(1, u * 9)));
    if (!f.look) f.look = [turn * 0.8, 0];
    const rest = this.o.rest || ['hip', 'pockets', 'hang', 'behind'][Math.floor(sd * 10) % 4];
    const RA = { hip: [[12, 18], [40, -125]], pockets: [[16, -32], [16, -32]], hang: [[8, 14], [10, 16]], behind: [[-12, -20], [-12, -20]] }[rest];
    const breathe = Math.sin(t * 2.4 + sd);
    // HOLD-style idle life: every ~1.3 s shift weight / tilt the head / glance somewhere, SNAP there and hold (never a slow drift)
    if (Flat2D.HOLD && !p.noIdle) { const per = 1.3 + (sd % 0.5), x = (t + sd * 2.1) / per, k = Math.floor(x), u = Math.min(1, (x - k) * per / 0.16), e = u * u * (3 - 2 * u);
      const hz = (n, j) => { const v = Math.sin(n * 91.7 + j * 17.3 + sd * 7.1) * 43758.5453; return (v - Math.floor(v)) * 2 - 1; };
      const at = (n) => ({ hip: hz(n, 1) > 0 ? 14 : -14, tilt: hz(n, 2) * 5, turn: hz(n, 3) * 0.25, look: [hz(n, 4) * 0.7, hz(n, 5) * 0.3] }); const A = at(k - 1), B = at(k);
      const mix = (a, b) => a + (b - a) * e;
      if (p.hip === undefined) p = { ...p, hip: mix(A.hip, B.hip) }; p = { ...p, tilt: (p.tilt || 0) + mix(A.tilt, B.tilt) };
      if (p.turn === undefined || p.turn === 0) p = { ...p, turn: mix(A.turn, B.turn) };
      if (f.eyes !== 'stare' && (!f.look || (f.look[0] === 0 && f.look[1] === 0 && !p.lockLook))) f.look = [mix(A.look[0], B.look[0]), mix(A.look[1], B.look[1])]; }
    // rubber WALK: step bob, body rock, head tilts side to side and lags, hat bounces (reference walk)
    if (p.walk !== undefined && p.amp && p.front) { const ph = p.walk; p = { ...p, bob: -16 * Math.abs(Math.sin(ph)), lean: 2, tilt: (p.tilt || 0) + 2 * Math.sin(ph), hatOff: (p.hatOff || 0) + 8 * Math.abs(Math.sin(ph * 2 - 0.9)), squash: (p.squash || 0) + 0.05 * Math.abs(Math.cos(ph)), armL: [14 + 6 * Math.sin(ph), 10], armR: [14 - 6 * Math.sin(ph), 10] }; }
    else if (p.walk !== undefined && p.amp) { const ph = p.walk; p = { ...p, sway: (p.sway || 0) + 3 * Math.sin(ph), bend: (p.bend || 0) + 9 * Math.sin(ph), headLag: (p.headLag || 0) + 8 * Math.sin(ph - 0.7), tilt: (p.tilt || 0) + 7 * Math.sin(ph - 0.4), hatOff: (p.hatOff || 0) + 7 * Math.abs(Math.sin(ph - 0.9)), squash: (p.squash || 0) + 0.04 * Math.abs(Math.cos(ph)) }; }
    return { ...p, face: f, turn, armL: p.armL || [RA[0][0] + breathe, RA[0][1]], armR: p.armR || [RA[1][0] + breathe, RA[1][1]], hip: p.hip ?? (sd % 2 > 1 ? 14 : -14),
      bob: (p.bob || 0) + (Flat2D.HOLD ? 0.6 : 2.2) * breathe - ON * 10, hop: (p.hop || 0), tilt: (p.tilt || 0) + (Flat2D.HOLD ? 0 : 3 * Math.sin(t * 0.8 + sd)) + ON * 9 * (sd % 2 > 1 ? 1 : -1) + E * 2 * Math.sin(t * 5 + sd),
      squash: (p.squash || 0) + Math.min(0.06, ON * 0.08), lean: (p.lean || 0) + (Flat2D.HOLD ? 0 : 1.5 * Math.sin(t * 0.7 + sd)), hatOff: (p.hatOff || 0) + ON * 8 + Math.max(0, p.hop || 0) * 0.55 + Math.max(0, -(p.squash || 0)) * 160, headLag: (p.headLag || 0) + (p.lean || 0) * 0.6 };
  }
  headWorld() { return this.pos.clone().add(new THREE.Vector3(0, this.h * (this.o.bust ? 0.5 : 0.76), 0)); }
  bodyWorld() { return this.pos.clone().add(new THREE.Vector3(0, this.h * (this.o.bust ? 0.35 : 0.5), 0)); }
  update(p = {}, cam) {
    p = this.alive(p); this.draw(p); this.tex.needsUpdate = true;
    this.mesh.position.copy(this.pos); this.mesh.visible = !p.hide;
    if (cam && this.o.front) { const d = cam.clone().sub(this.pos).setY(0).normalize().multiplyScalar(this.o.front); this.mesh.position.add(d); }   // riders / passengers: pulled toward the camera so they never sink into the vehicle
    if (cam) this.mesh.rotation.y = Math.atan2(cam.x - this.pos.x, cam.z - this.pos.z);
    if (this.shadow) { this.shadow.position.set(this.pos.x, this.pos.y + 0.012, this.pos.z); this.shadow.visible = !p.hide; const k = 1 - Math.min(0.5, (p.hop || 0) / 300); this.shadow.scale.set(k, k, k); }
  }
  // wobbly closed outline through points [[x,y],...]
  wpath(g, pts) { const sd = this.o.seed; g.beginPath(); pts.forEach(([x, y], i) => { const X = x + wob(sd, i, 0.9), Y = y + wob(sd + 2, i, 0.9); i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); }
  ell(cx, cy, rx, ry, n = 48, a0 = 0, a1 = Math.PI * 2) { const pts = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return pts; }
  draw(p) {
    const g = this.g, S = this.S, o = this.o;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.cw, this.ch); g.setTransform(S, 0, 0, S, 0, 0); if (o.wide) g.translate(256, 0); if (this.hr) g.translate(0, this.hr);
    if (o.bust) { g.translate(256, 290); g.scale(1.05, 1.05); g.translate(-256, -330); }
    const flip = p.flip ? -1 : 1; g.translate(256, 0); g.scale(flip, 1); g.translate(-256, 0);
    if (p.sway) { g.translate(256, 992); g.rotate(R(p.sway)); g.translate(-256, -992); }
    const B = p.bend || 0, SD = p.side || 0;   // rubber torso bend (px at the shoulders, + = forward/right in local space)
    const qc = (a, m, b) => [2 * m[0] - (a[0] + b[0]) / 2, 2 * m[1] - (a[1] + b[1]) / 2];   // control point so the curve passes through the joint (rubber-hose limbs)
    g.lineJoin = 'round'; g.lineCap = 'round';
    const kn = p.kneel || 0, drop = 175 * kn; const bob = (p.bob || 0) - (p.hop || 0) + drop, sq = p.squash || 0, lean = p.lean || 0;
    const hipY = 736 + ((p.bob || 0) - (p.hop || 0)) * 0.7 + drop;
    if (p.lines) this.speedLines(g, p.lines);
    // ---- legs: long thin lines, tiny dark feet ----
    if (!o.bust) { const ph = p.walk || 0, amp = p.amp ?? 0;
      for (const s of [-1, 1]) {
        const sw = Math.sin(ph + (s > 0 ? 0 : Math.PI)); let a = R(amp * sw + (p.legOut || 0) * s); const hx = 256 + s * 22 * (1 - 0.75 * (p.side || 0)) + (p.hip || 0) * 0.5, L1 = 134, L2 = 126;
        const hipS = p.hip || 0, free = hipS !== 0 && Math.sign(hipS) !== s;   // contrapposto: weight on one leg, the other knee bends
        if (!amp && !kn) a += R(s * (free ? 9 : 3));   // feet a little apart, the free leg a bit wider
        if (kn) a = s > 0 ? R(-62 * kn) : R(8 * kn);   // kneel: front thigh forward, back knee on the ground
        let knee = [hx + Math.sin(a) * L1, hipY + Math.cos(a) * L1]; let kb = a + R(Math.max(0, Math.cos(ph + (s > 0 ? 0 : Math.PI))) * amp * 1.2); if (kn) kb = s > 0 ? R(0) : R(88 * kn); else if (!amp) kb = a - R(s * (free ? 7 : 2)) + R(free ? 12 : 3);   // shin swings BACK (character faces left by default)
        let foot = [knee[0] + Math.sin(kb) * L2, Math.min(992, knee[1] + Math.cos(kb) * L2)];
        if (p.sit) { const st = p.sit; knee = [hx + s * 26 * st, hipY + L1 * (1 - 0.72 * st)]; foot = [knee[0] + s * 6 * st, knee[1] + L2 * (1 - 0.1 * st)]; }
        else if (p.legL && p.legR) { const LG = s < 0 ? p.legL : p.legR; knee = [hx + Math.sin(R(LG[0])) * L1, hipY + Math.cos(R(LG[0])) * L1]; foot = [knee[0] + Math.sin(R(LG[1])) * L2, Math.min(992, knee[1] + Math.cos(R(LG[1])) * L2)]; }
        else if (p.front && amp) { const lift = Math.max(0, Math.sin(ph + (s > 0 ? 0 : Math.PI))); const fx = 256 + s * 26; knee = [fx + s * 10 * lift, hipY + L1 * (1 - 0.3 * lift)]; foot = [fx + s * 2, knee[1] + L2 * (1 - 0.55 * lift)]; }
        const c0 = qc([hx, hipY - 10], knee, foot), legPath = () => { g.beginPath(); g.moveTo(hx, hipY - 10); g.quadraticCurveTo(c0[0], c0[1], foot[0], foot[1]); };
        if (o.socks) { legPath(); g.strokeStyle = INK; g.lineWidth = 27; g.stroke(); legPath(); g.strokeStyle = o.socks; g.lineWidth = 19; g.stroke(); if (o.socks2) { g.save(); legPath(); g.strokeStyle = o.socks2; g.lineWidth = 15; g.setLineDash([12, 14]); g.stroke(); g.restore(); } }
        else { legPath(); g.strokeStyle = INK; g.lineWidth = 20; g.stroke(); }
        if (o.pants) { const P = o.pants, upto = P.len === 'long' ? 0.9 : P.len === 'ankle' ? 0.8 : P.len === 'shorts' ? 0.32 : 0.6, wdt = P.len === 'knickers' ? 44 : 38; const q = (u) => [(1 - u) * (1 - u) * hx + 2 * (1 - u) * u * c0[0] + u * u * foot[0], (1 - u) * (1 - u) * (hipY - 10) + 2 * (1 - u) * u * c0[1] + u * u * foot[1]];
          const pts = []; for (let k = 0; k <= 10; k++) pts.push(q(upto * k / 10)); const seg = () => { g.beginPath(); g.moveTo(hx, hipY - 26); pts.forEach(([x, y]) => g.lineTo(x, y)); };
          g.lineCap = 'round'; seg(); g.strokeStyle = INK; g.lineWidth = wdt + 9; g.stroke(); seg(); g.strokeStyle = P.col; g.lineWidth = wdt; g.stroke(); if (P.check) { g.save(); seg(); g.strokeStyle = P.check; g.lineWidth = wdt * 0.5; g.setLineDash([10, 12]); g.stroke(); g.restore(); }
          seg(); g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = wdt * 0.25; g.stroke(); const e = pts[10]; if (P.len === 'knickers') { g.fillStyle = P.cuff || P.col; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.ellipse(e[0], e[1] + 4, wdt * 0.55, 9, 0, 0, 7); g.fill(); g.stroke(); } }
        if (o.shoes) { g.fillStyle = INK; g.beginPath(); g.ellipse(foot[0] - 10 * (o.shoeDir || 1), foot[1] + 1, 26, 13, 0, 0, 7); g.fill(); g.fillStyle = o.shoes; g.beginPath(); g.ellipse(foot[0] - 10 * (o.shoeDir || 1), foot[1] - 1, 22, 9.5, 0, 0, 7); g.fill(); if (o.shoes2) { g.fillStyle = o.shoes2; g.beginPath(); g.ellipse(foot[0] - 22 * (o.shoeDir || 1), foot[1], 10, 8, 0, 0, 7); g.fill(); } }
        else { g.fillStyle = INK; g.beginPath(); g.ellipse(foot[0] - 10, foot[1] + 1, 23, 11, 0, 0, 7); g.fill(); }
      } }
    g.save(); g.translate(256 + (p.hip || 0) * 0.6, hipY); g.rotate(R(-lean) + R((p.hip || 0) * 0.08)); g.translate(-256, -hipY);   // +lean = forward; hip shift tilts the torso a little
    const top = 400 + bob + sq * 14, hem = 742 + bob * 0.6; this.armM = g.getTransform();   // adult proportions: head ~27%, long bean torso, legs ~28%   // reference proportions: head 35% / torso 33% / legs 32%
    // ---- arms: thin lines, round dark hands ----
    const arm = (s, a) => {
      const [sa, eb] = a || [22, 6]; const sx = 256 + s * 44 * (o.width || 1) * 1.5 * (1 - 0.55 * SD) + B * 0.82, sy = top + 30, L1 = 84, L2 = 78; const a1 = R(sa), a2 = R(sa + eb);
      const el = [sx + s * Math.sin(a1) * L1, sy + Math.cos(a1) * L1], hd = [el[0] + s * Math.sin(a2) * L2, el[1] + Math.cos(a2) * L2];
      g.strokeStyle = INK; g.lineWidth = 19; g.beginPath(); g.moveTo(sx, sy); { const c = qc([sx, sy], el, hd); g.quadraticCurveTo(c[0], c[1], hd[0], hd[1]); } g.stroke();
      g.fillStyle = (o.glove === (s < 0 ? 'L' : 'R')) ? '#f6f4ee' : '#3a2620'; g.beginPath(); g.arc(hd[0], hd[1], 24, 0, 7); g.fill(); g.lineWidth = 3; g.stroke();
      if (o.sleeves) { g.save(); g.translate(sx, sy); g.rotate(-s * a1); g.fillStyle = o.sleeveCol || o.coat; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.moveTo(-20, -8); g.lineTo(20, -8); g.lineTo(23, 52); g.quadraticCurveTo(0, 60, -23, 52); g.closePath(); g.fill(); g.stroke(); g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-21, 44); g.quadraticCurveTo(0, 52, 21, 44); g.stroke(); g.restore(); }
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.arc(hd[0] - 5, hd[1] - 5, 4, 0, 7); g.fill();
      hd.ang = s * (sa + eb); hd.s = s; return hd;
    };
    const HH = p.handHead; const headHand = HH ? [256 + (HH === 'R' ? 1 : -1) * 128, 400 - 130 + 26 + bob - 40] : null;
    if (HH) { const s = HH === 'R' ? 1 : -1, sx = 256 + s * 44 * (o.width || 1) * 1.5, sy = top + 30; g.strokeStyle = INK; g.lineWidth = 17; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + s * 90, sy - 40); g.lineTo(headHand[0] + s * 10, headHand[1] + 10); g.stroke(); }
    const ik = (hd, sg = -1) => { const sx = 256 + sg * 44 * (o.width || 1) * 1.5 + B * 0.82, sy = top + 30, L1 = 84, L2 = 78; const dx = hd[0] - sx, dy = hd[1] - sy; const d = Math.min(L1 + L2 - 1, Math.hypot(dx, dy)); const a = Math.atan2(dy, dx), b = -sg * Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
      const el = [sx + Math.cos(a + b) * L1, sy + Math.sin(a + b) * L1]; const h2 = [sx + Math.cos(a) * d, sy + Math.sin(a) * d]; g.strokeStyle = INK; g.lineWidth = 19; g.beginPath(); g.moveTo(sx, sy); { const c = qc([sx, sy], el, h2); g.quadraticCurveTo(c[0], c[1], h2[0], h2[1]); } g.stroke(); g.fillStyle = '#3a2620'; g.beginPath(); g.arc(h2[0], h2[1], 24, 0, 7); g.fill(); g.lineWidth = 3; g.stroke(); return h2; };
    const drawArms = () => { if (p.grip === 'L') { this.handL = arm(-1, p.armL); const hd = this.handL, aa = R(p.armL[0] + p.armL[1]); this.handR = ik([hd[0] + Math.sin(aa) * 46, hd[1] - Math.cos(aa) * 46], 1); return; }
      if (p.grip) { this.handR = arm(1, p.armR); const hd = this.handR, aa = R(p.armR[0] + p.armR[1]); const g2 = [hd[0] - Math.sin(aa) * 46, hd[1] - Math.cos(aa) * 46]; this.handL = ik(g2); return; }
      this.handL = HH === 'L' ? null : arm(-1, p.armL); this.handR = HH === 'R' ? null : arm(1, p.armR); };
    // SIDE / 3-quarter view: the far arm goes BEHIND the (narrower) body, the near arm in front
    if (SD > 0.3 && !p.grip && !HH) { this.handR = arm(1, p.armR); { const bw = (o.width || 1) * 1.5 * (1 - 0.42 * SD); const draw = (gg) => { gg.save(); gg.translate(256, 0); gg.scale(bw, 1); gg.translate(-256, 0); this._cloth = [top, hem]; this.body(gg, o, top, hem); this._cloth = null; this.extras(gg, o, top, hem); gg.restore(); };
      if (!B) draw(g); else { if (!this.tc) { this.tc = document.createElement('canvas'); this.tc.width = this.cw; this.tc.height = this.ch; this.tg = this.tc.getContext('2d'); }
        const tg = this.tg, m = g.getTransform(); tg.setTransform(1, 0, 0, 1, 0, 0); tg.clearRect(0, 0, this.cw, this.ch); tg.setTransform(m); tg.lineJoin = 'round'; tg.lineCap = 'round'; draw(tg);
        const y0 = m.transformPoint({ x: 256, y: top - 40 }).y, y1 = m.transformPoint({ x: 256, y: hem }).y, bx = B * m.a * 1, H = this.ch; g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
        for (let y = 0; y < H; y += 3) { const k = Math.max(0, Math.min(1, (y1 - y) / Math.max(1, y1 - y0))); const dx = bx * k * k; g.drawImage(this.tc, 0, y, this.cw, 3, dx, y, this.cw, 3); } g.restore(); } } this.handL = arm(-1, p.armL); }
    else { { const bw = (o.width || 1) * 1.5 * (1 - 0.42 * SD); const draw = (gg) => { gg.save(); gg.translate(256, 0); gg.scale(bw, 1); gg.translate(-256, 0); this._cloth = [top, hem]; this.body(gg, o, top, hem); this._cloth = null; this.extras(gg, o, top, hem); gg.restore(); };
      if (!B) draw(g); else { if (!this.tc) { this.tc = document.createElement('canvas'); this.tc.width = this.cw; this.tc.height = this.ch; this.tg = this.tc.getContext('2d'); }
        const tg = this.tg, m = g.getTransform(); tg.setTransform(1, 0, 0, 1, 0, 0); tg.clearRect(0, 0, this.cw, this.ch); tg.setTransform(m); tg.lineJoin = 'round'; tg.lineCap = 'round'; draw(tg);
        const y0 = m.transformPoint({ x: 256, y: top - 40 }).y, y1 = m.transformPoint({ x: 256, y: hem }).y, bx = B * m.a * 1, H = this.ch; g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
        for (let y = 0; y < H; y += 3) { const k = Math.max(0, Math.min(1, (y1 - y) / Math.max(1, y1 - y0))); const dx = bx * k * k; g.drawImage(this.tc, 0, y, this.cw, 3, dx, y, this.cw, 3); } g.restore(); } } drawArms(); }
    if (p.whoosh) { const [w0, w1, wa] = p.whoosh; const sx = 256 + 44 * (o.width || 1) * 1.5, sy = top + 30; g.save(); g.lineCap = 'round';
      for (let k = 0; k < 3; k++) { const rr = 190 + k * 34; g.strokeStyle = `rgba(255,255,255,${(wa ?? 0.8) * (0.9 - k * 0.22)})`; g.lineWidth = 10 - k * 2; g.beginPath(); g.arc(sx, sy, rr, R(90 - w0), R(90 - w1), w1 < w0 ? false : true); g.stroke(); } g.restore(); }
    if (p.prop) { const hd = (p.propHand === 'L' ? this.handL : this.handR) || this.handR; if (hd) this.prop(g, p.prop, hd, p.propSpin || 0); }
    // ---- head ----
    const r = 116 * (o.head ?? 1.12), hx = 256 + (p.headX || 0) + B + (p.headLag || 0), hy = 400 - r + 26 + bob + sq * 22 + Math.abs(B) * 0.08;   // big head like the reference; bottom sits on the collar
    const fsA = (p.fs || 0) * (p.fk ?? 0.5); this._fs = fsA;
    g.save(); g.translate(hx, hy); g.rotate(R(p.tilt || 0)); g.scale((1 + sq * 0.12) * (1 - 0.08 * fsA), (1 - sq * 0.1) * (1 + 0.12 * fsA));
    const TUa = clamp(p.turn || 0, -1, 1); if (!o.noEars) for (const s of [-1, 1]) { if (Math.abs(TUa) > 0.5 && Math.sign(TUa) === s) continue; const ex = s * r * (1.04 - (Math.abs(TUa) > 0.5 ? 0.5 * (Math.abs(TUa) - 0.5) : 0)) + TUa * 12, ey = 16; g.fillStyle = o.skin; g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.ellipse(ex, ey, 17, 25, s * 0.25, 0, 7); g.fill(); g.stroke(); g.lineWidth = 3.5; g.beginPath(); g.arc(ex + s * 2, ey, 9, s > 0 ? -1.1 : Math.PI - 1.1, s > 0 ? 1.1 : Math.PI + 1.1); g.stroke(); }
    const headPts = this.ell(0, 0, r * 1.07, r * 0.94, 64);   // slightly wide oval head (reference)
    this.wpath(g, headPts); g.fillStyle = o.skin; g.fill();
    g.save(); this.wpath(g, headPts); g.clip();
    if (p.tint) { const [tc, tk] = Array.isArray(p.tint) ? p.tint : [p.tint, 0.7]; g.globalAlpha = tk; g.fillStyle = tc; g.fillRect(-r * 2, -r * 2, r * 4, r * 4); g.globalAlpha = 1; }
    { const sh = g.createRadialGradient(-r * 0.35, -r * 0.45, r * 0.1, r * 0.1, r * 0.15, r * 1.15); sh.addColorStop(0, 'rgba(255,255,255,0.45)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); sh.addColorStop(0.78, 'rgba(90,60,60,0.16)'); sh.addColorStop(1, 'rgba(60,30,40,0.42)'); g.fillStyle = sh; g.fillRect(-r * 2, -r * 2, r * 4, r * 4); }   // soft 3D shading + sheen on the head
    if (o.hair && (o.hairStyle === 'bangs' || o.hairStyle === 'cap')) { g.save(); g.translate((p.turn || 0) * 16, 0); this.hair(g, r); g.restore(); }
    g.restore();
    this.outline(g, headPts, 7);
    if (o.nose && Math.abs(TUa) > 0.55) { const sg = Math.sign(TUa), k = (Math.abs(TUa) - 0.55) / 0.45, nx = sg * r * 1.0, ny = 22; g.fillStyle = o.skin; g.beginPath(); g.ellipse(nx, ny, 16 + 14 * k, 17, 0, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.ellipse(nx, ny, 16 + 14 * k, 17, 0, sg > 0 ? -1.75 : Math.PI - 1.4, sg > 0 ? 1.4 : Math.PI + 1.75); g.stroke(); }
    if (o.hair && o.hairStyle === 'tufts') { g.save(); g.translate((p.turn || 0) * 14, 0); this.tufts(g, r); g.restore(); }
    if (o.hair && ['pompadour', 'side', 'messy', 'pigtails', 'quiff', 'swept', 'curly', 'bun', 'ponytail', 'bald', 'spiky'].includes(o.hairStyle)) { g.save(); g.translate(-TUa * r * 0.08, -Math.abs(TUa) * r * 0.04); this.bigHair(g, r, TUa); g.restore(); }
    g.save(); this.wpath(g, this.ell(0, 0, r * 1.07 - 3.5, r * 0.94 - 3.5, 64)); g.clip();
    { const tu = clamp(p.turn || 0, -1, 1); g.save(); const fk = r / 116 * 0.95; g.translate(tu * (52 + 26 * Math.max(0, Math.abs(tu) - 0.6) / 0.4) * fk, 16 * fk); g.scale((1 - 0.22 * Math.abs(tu)) * fk, fk); this._tu = tu; this.face(g, p.face || {}, 116); this._tu = 0; g.restore(); }   // facial features scale with the head
    g.restore();
    if (p.blush) { g.fillStyle = `rgba(230,60,60,${0.55 * p.blush})`; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 62, 40, 28, 15, 0, 0, 7); g.fill(); } g.strokeStyle = 'rgba(180,30,30,0.6)'; g.lineWidth = 3; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(s * 50 + k * 10 - 10, 32); g.lineTo(s * 50 + k * 10 - 16, 48); g.stroke(); } }
    if (p.tears) { const T = Flat2D.T || 0; g.fillStyle = '#7cc8ff'; g.strokeStyle = INK; g.lineWidth = 2.5; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 40 - 8, 8); g.lineTo(s * 40 + 8, 8); g.lineTo(s * 46, 120); g.lineTo(s * 34, 120); g.closePath(); g.globalAlpha = 0.85; g.fill(); g.globalAlpha = 1; for (let k = 0; k < 2; k++) { const y = 20 + ((T * 140 + k * 50 + (s > 0 ? 25 : 0)) % 110); g.beginPath(); g.arc(s * 42, y, 6, 0, 7); g.fill(); g.stroke(); } } }
    g.save(); g.translate((p.turn || 0) * 12, 0); this.hat(g, r, p.hatOff || 0); g.restore();
    g.restore();
    if (p.steam) this.steam(g, hx, hy, r, p.steam);
    if (p.prop && !HH && (p.propFront || (p.armR && p.armR[0] > 115 && !p.propBack))) { drawArms(); { const hd = (p.propHand === 'L' ? this.handL : this.handR) || this.handR; if (hd) this.prop(g, p.prop, hd, p.propSpin || 0); } }   // raised arms + held prop go IN FRONT of the head
    if (headHand) { g.fillStyle = '#3a2620'; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.arc(headHand[0], headHand[1], 16, 0, 7); g.fill(); g.stroke(); }
    g.restore();
    if (p.mark) { g.save(); g.translate(256 + 140, 120 + bob); g.rotate(R(12)); g.font = 'bold 130px serif'; g.textAlign = 'center'; g.lineWidth = 10; g.strokeStyle = INK; g.fillStyle = '#e4332a'; g.strokeText(p.mark, 0, 0); g.fillText(p.mark, 0, 0); g.restore(); }
    if (p.sweat) { g.save(); g.translate(hx - 118, hy - 30 + (p.sweat * 30) % 30); g.fillStyle = '#9fd6ff'; g.strokeStyle = INK; g.lineWidth = 3.5; g.beginPath(); g.moveTo(0, -20); g.quadraticCurveTo(14, 4, 0, 11); g.quadraticCurveTo(-14, 4, 0, -20); g.fill(); g.stroke(); g.restore(); }
  }
  speedLines(g, k) { const T = Flat2D.T || 0; g.save(); g.strokeStyle = 'rgba(40,30,25,0.55)'; g.lineCap = 'round'; for (let i = 0; i < 7; i++) { const y = 300 + i * 80 + Math.sin(i * 3.1) * 20, ph = ((T * 3 + i * 0.37) % 1); g.lineWidth = 5; g.beginPath(); g.moveTo(330 + ph * 40, y); g.lineTo(330 + ph * 40 + 70 * k + 40, y); g.stroke(); } g.restore(); }
  steam(g, hx, hy, r, k) { const T = Flat2D.T || 0; g.save(); g.strokeStyle = INK; g.lineWidth = 4; for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const ph = (T * 1.6 + i * 0.5 + (s > 0 ? 0.25 : 0)) % 1; const x = hx + s * (r * 0.78 + ph * 50), y = hy - r * 0.7 - ph * 110, rr = (22 + ph * 26) * k; g.globalAlpha = 1 - ph * 0.7; g.fillStyle = '#fbfbfb'; for (const [dx, dy, f] of [[0, 0, 1], [rr * 0.7, -rr * 0.3, 0.75], [-rr * 0.6, -rr * 0.2, 0.7]]) { g.beginPath(); g.arc(x + dx, y + dy, rr * f, 0, 7); g.fill(); g.stroke(); } } g.globalAlpha = 1; g.restore(); }
  // props held in the hand, aligned with the forearm
  prop(g, kind, hd, spin = 0) { g.save(); g.translate(hd[0], hd[1]); g.rotate(-R((hd.ang || 0) + spin)); g.scale(1.45, 1.45); g.strokeStyle = INK; g.lineWidth = 4; const box = (x, y, w, h, c) => { g.fillStyle = c; g.beginPath(); g.roundRect(x, y, w, h, 4); g.fill(); g.stroke(); };
        if (kind === 'spear') { box(-5, -300, 10, 420, '#8a5a32'); g.fillStyle = '#c8ccd4'; g.beginPath(); g.moveTo(0, -360); g.lineTo(14, -300); g.lineTo(0, -290); g.lineTo(-14, -300); g.closePath(); g.fill(); g.stroke(); }
        else if (kind === 'sword') { box(-6, -6, 12, 30, '#5a3a20'); box(-26, 20, 52, 10, '#d8b040'); g.fillStyle = '#dde2ea'; g.beginPath(); g.moveTo(-9, 30); g.lineTo(9, 30); g.lineTo(7, 170); g.lineTo(0, 190); g.lineTo(-7, 170); g.closePath(); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(-2, 36, 3, 130); }
        else if (kind === 'shield') { g.fillStyle = '#8a2a2a'; g.beginPath(); g.arc(0, 20, 78, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#d8b040'; g.beginPath(); g.arc(0, 20, 64, 0, 7); g.lineWidth = 6; g.strokeStyle = '#d8b040'; g.stroke(); g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.arc(0, 20, 18, 0, 7); g.fill(); g.stroke(); }
        else if (kind === 'bow') { g.strokeStyle = '#6a4220'; g.lineWidth = 10; g.beginPath(); g.arc(-40, 0, 130, -0.95, 0.95); g.stroke(); g.strokeStyle = '#eee'; g.lineWidth = 2; g.beginPath(); g.moveTo(-40 + 130 * Math.cos(-0.95), 130 * Math.sin(-0.95)); g.lineTo(-40 + 130 * Math.cos(0.95), 130 * Math.sin(0.95)); g.stroke(); g.strokeStyle = INK; g.lineWidth = 4; }
        else if (kind === 'torch') { box(-6, -10, 12, 120, '#6a4220'); g.fillStyle = '#ffb030'; g.beginPath(); g.moveTo(-16, -10); g.quadraticCurveTo(0, -70, 16, -10); g.closePath(); g.fill(); g.fillStyle = '#fff2a0'; g.beginPath(); g.moveTo(-7, -10); g.quadraticCurveTo(0, -40, 7, -10); g.closePath(); g.fill(); }
        else if (kind === 'pistol') { const steel = '#2c2c30', st2 = '#18181a';
      g.fillStyle = '#5a4434'; g.beginPath(); g.moveTo(-8, -10); g.lineTo(10, -16); g.lineTo(40, -6); g.lineTo(36, 14); g.lineTo(2, 16); g.closePath(); g.fill(); g.stroke(); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(12 + k * 6, -10); g.lineTo(10 + k * 6, 10); g.stroke(); } g.strokeStyle = INK; g.lineWidth = 4;
      g.fillStyle = st2; g.beginPath(); g.roundRect(-8, -6, 14, 74, 3); g.fill(); g.stroke();
      g.beginPath(); g.arc(14, 22, 11, -0.2, Math.PI * 1.1); g.stroke();
      g.fillStyle = steel; g.beginPath(); g.roundRect(-24, -16, 20, 104, 4); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(-20, -10, 4, 92); g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 2; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(-23, -8 + k * 5); g.lineTo(-6, -8 + k * 5); g.stroke(); } g.strokeStyle = INK; g.lineWidth = 4;
      g.fillStyle = st2; g.fillRect(-26, -22, 8, 10); g.beginPath(); g.arc(-14, 88, 5, 0, 7); g.fillStyle = '#050505'; g.fill(); g.fillStyle = steel; g.fillRect(-28, 78, 6, 8); }
    else if (kind === 'hammer') { box(-6, -10, 12, 120, '#a8743e'); box(-34, 98, 68, 34, '#5a5a62'); }
    else if (kind === 'paddle') { box(-6, -120, 12, 230, '#c8904a'); g.fillStyle = '#c8904a'; g.beginPath(); g.ellipse(0, 130, 24, 56, 0, 0, 7); g.fill(); g.stroke(); }
    else if (kind === 'megaphone') { g.fillStyle = '#e8402a'; g.beginPath(); g.moveTo(-12, 0); g.lineTo(12, 0); g.lineTo(44, 90); g.lineTo(-44, 90); g.closePath(); g.fill(); g.stroke(); box(-8, -20, 16, 24, '#3a3a3a'); }
    else if (kind === 'flag') { box(-4, -160, 8, 200, '#8a5a32'); g.fillStyle = '#e8402a'; g.beginPath(); g.moveTo(4, -160); g.lineTo(96, -136); g.lineTo(4, -108); g.closePath(); g.fill(); g.stroke(); }
    else if (kind === 'bucket') { g.fillStyle = '#9aa4ae'; g.beginPath(); g.moveTo(-34, 20); g.lineTo(34, 20); g.lineTo(26, 80); g.lineTo(-26, 80); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.arc(0, 20, 34, Math.PI, 0); g.stroke(); }
    else if (kind === 'trophy') { g.fillStyle = '#f2c63a'; g.beginPath(); g.moveTo(-30, -70); g.lineTo(30, -70); g.quadraticCurveTo(30, -10, 0, -6); g.quadraticCurveTo(-30, -10, -30, -70); g.fill(); g.stroke(); box(-6, -8, 12, 20, '#f2c63a'); box(-22, 10, 44, 12, '#8a5a32'); }
    else if (kind === 'wallet') { g.rotate(R(hd.ang || 0)); box(-58, -46, 56, 70, '#8a5a32'); box(2, -46, 56, 70, '#7a4a28'); g.fillStyle = '#5a3418'; g.fillRect(-50, -36, 40, 8); g.fillRect(10, -36, 40, 8); }
    else if (kind === 'maul') { g.scale(1 / 1.45, 1 / 1.45); box(-7, -70, 14, 470, '#d8a848'); box(-34, 390, 68, 40, '#4a4a52'); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-30, 395, 60, 7); }
    else if (kind === 'sledge') { box(-7, -20, 14, 170, '#a8743e'); box(-50, 140, 100, 46, '#4a4a52'); }
    else if (kind === 'twig' || kind === 'twig2') { g.rotate(R(hd.ang || 0)); g.strokeStyle = '#6a4424'; g.lineWidth = 10; g.beginPath(); if (kind === 'twig') { g.moveTo(-70, 0); g.lineTo(70, -6); g.moveTo(20, -3); g.lineTo(40, -26); } else { g.moveTo(-70, 0); g.lineTo(-6, -24); g.moveTo(6, -24); g.lineTo(70, 0); } g.stroke(); }
    else if (kind === 'pen') { box(-5, -10, 10, 60, '#2a5ad0'); }
    else if (kind === 'lantern') { box(-3, -10, 6, 30, '#3a3a3a'); g.fillStyle = '#ffd860'; g.beginPath(); g.roundRect(-22, 18, 44, 52, 8); g.fill(); g.stroke(); box(-26, 14, 52, 8, '#3a3a3a'); box(-26, 68, 52, 8, '#3a3a3a'); }
    else if (kind === 'sign') { box(-4, -150, 8, 170, '#8a5a32'); g.fillStyle = '#f6d84a'; g.beginPath(); g.roundRect(-70, -230, 140, 90, 10); g.fill(); g.stroke(); g.fillStyle = INK; g.font = 'bold 40px "DejaVu Sans", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(this.o.signText || 'FIRST!', 0, -184); }
    else if (kind === 'club') { g.scale(1 / 1.45, 1 / 1.45); box(-6, -40, 12, 90, '#2a2a30'); g.fillStyle = '#c8ccd4'; g.beginPath(); g.roundRect(-4, 40, 8, 300, 4); g.fill(); g.stroke();   // golf driver: grip + steel shaft + big round head
      g.fillStyle = '#2a2a34'; g.beginPath(); g.ellipse(26, 354, 46, 28, -0.25, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#e8e8ee'; g.beginPath(); g.ellipse(36, 354, 22, 14, -0.25, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(12, 342, 18, 7, -0.25, 0, 7); g.fill(); }
    else if (kind === 'rag') { g.fillStyle = '#f2d24a'; g.beginPath(); g.moveTo(-34, -6); g.quadraticCurveTo(0, -24, 36, -4); g.quadraticCurveTo(46, 30, 20, 52); g.quadraticCurveTo(-6, 40, -30, 50); g.quadraticCurveTo(-48, 20, -34, -6); g.fill(); g.stroke(); g.strokeStyle = '#c8a02a'; g.lineWidth = 3; g.beginPath(); g.moveTo(-20, 10); g.quadraticCurveTo(0, 22, 22, 8); g.stroke(); }
    else if (kind === 'gball') { g.fillStyle = '#fbfbf6'; g.beginPath(); g.arc(0, 30, 24, 0, 7); g.fill(); g.stroke(); g.fillStyle = 'rgba(120,120,140,0.35)'; for (const [x, y] of [[-8, 24], [6, 22], [-2, 36], [10, 36], [-12, 38]]) { g.beginPath(); g.arc(x, y, 3.2, 0, 7); g.fill(); } }
    else if (kind === 'sack') { g.fillStyle = '#c8a46a'; g.beginPath(); g.moveTo(-14, 0); g.lineTo(14, 0); g.quadraticCurveTo(80, 40, 74, 120); g.quadraticCurveTo(60, 176, 0, 178); g.quadraticCurveTo(-60, 176, -74, 120); g.quadraticCurveTo(-80, 40, -14, 0); g.fill(); g.stroke(); box(-18, -4, 36, 14, '#8a5a32');
      g.fillStyle = '#fbfbf6'; for (const [x, y] of [[-8, -14], [12, -18], [2, -26]]) { g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); g.stroke(); } }
    else if (kind === 'wrench') { box(-6, -10, 12, 90, '#9aa4ae'); g.fillStyle = '#9aa4ae'; g.beginPath(); g.arc(0, 88, 18, 0, 7); g.fill(); g.stroke(); }
    g.restore(); }
  pattern(g, o, top, hem) { if (!o.pattern) return; const x0 = 256 - 130, x1 = 256 + 130, y0 = top - 30, y1 = hem + 60; g.save();
    if (o.pattern === 'argyle') { const c1 = o.patCol || 'rgba(0,30,40,0.3)', c2 = o.patCol2 || 'rgba(255,214,90,0.75)', w = 46, h = 62;
      for (let r = 0; r * h / 2 < y1 - y0 + h; r += 2) for (let c = -1; c * w < 280; c++) { const cx = x0 + c * w + ((r / 2) % 2) * w / 2, cy = y0 + r * h / 2; g.fillStyle = c1; g.beginPath(); g.moveTo(cx, cy - h / 2); g.lineTo(cx + w / 2, cy); g.lineTo(cx, cy + h / 2); g.lineTo(cx - w / 2, cy); g.closePath(); g.fill(); }
      g.strokeStyle = c2; g.lineWidth = 2.4; g.setLineDash([7, 6]); for (let k = -10; k < 14; k++) { for (const d of [1, -1]) { g.beginPath(); g.moveTo(x0 + k * w, y0); g.lineTo(x0 + k * w + d * (y1 - y0) * (w / 2) / (h / 2), y1); g.stroke(); } } g.setLineDash([]); }
    else if (o.pattern === 'plaid') { const c1 = o.patCol || 'rgba(70,0,30,0.24)', c2 = o.patCol2 || 'rgba(255,240,200,0.45)';
      g.fillStyle = c1; for (let x = x0; x < x1; x += 52) g.fillRect(x, y0, 22, y1 - y0); for (let y = y0; y < y1; y += 52) g.fillRect(x0, y, x1 - x0, 22);
      g.strokeStyle = c2; g.lineWidth = 2.2; for (let x = x0 + 37; x < x1; x += 52) { g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke(); } for (let y = y0 + 37; y < y1; y += 52) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); } }
    else if (o.pattern === 'stripes') { g.fillStyle = o.patCol || 'rgba(255,255,255,0.3)'; for (let x = x0; x < x1; x += 26) g.fillRect(x, y0, 9, y1 - y0); }
    g.restore(); }
  cloth(g, o, top, hem) {
    g.save(); const x0 = 256 - 130, x1 = 256 + 130, y0 = top - 30, y1 = hem + 60;
    if (!CLOTHN) { CLOTHN = document.createElement('canvas'); CLOTHN.width = CLOTHN.height = 96; const q = CLOTHN.getContext('2d'); let sd = 7; const rr = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
      for (let i = 0; i < 1400; i++) { q.fillStyle = rr() > 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'; q.fillRect(rr() * 96, rr() * 96, 2, 2); } for (let y = 0; y < 96; y += 4) { q.fillStyle = 'rgba(0,0,0,0.035)'; q.fillRect(0, y, 96, 1); } }
    g.fillStyle = g.createPattern(CLOTHN, 'repeat'); g.fillRect(x0, y0, x1 - x0, y1 - y0);
    const rim = g.createLinearGradient(256 - 96, 0, 256 - 36, 0); rim.addColorStop(0, 'rgba(255,255,255,0.32)'); rim.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rim; g.fillRect(x0, y0, 100, y1 - y0);
    const sh = g.createLinearGradient(0, hem - 90, 0, hem + 50); sh.addColorStop(0, 'rgba(30,10,40,0)'); sh.addColorStop(1, 'rgba(30,10,40,0.26)'); g.fillStyle = sh; g.fillRect(x0, hem - 90, x1 - x0, 150);
    const nk = g.createLinearGradient(0, top - 10, 0, top + 40); nk.addColorStop(0, 'rgba(30,10,40,0.28)'); nk.addColorStop(1, 'rgba(30,10,40,0)'); g.fillStyle = nk; g.fillRect(x0, top - 10, x1 - x0, 50);
    g.strokeStyle = 'rgba(30,10,40,0.28)'; g.lineWidth = 3.2; g.lineCap = 'round'; for (const [a, b] of [[-42, 0.6], [34, 0.68], [-8, 0.84]]) { const y = top + (hem - top) * b; g.beginPath(); g.moveTo(256 + a - 18, y); g.quadraticCurveTo(256 + a, y + 11, 256 + a + 17, y - 5); g.stroke(); }
    g.restore(); }
  extras(g, o, top, hem) {
    g.strokeStyle = INK; g.lineWidth = 3.5;
    if (o.tied) {   // sweater knotted over the shoulders (preppy golfer)
      g.fillStyle = o.tied; g.lineWidth = 4.5;
      for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(256 + sx * 60, top + 26); g.quadraticCurveTo(256 + sx * 30, top + 54, 256 - sx * 8, top + 62); g.lineTo(256 - sx * 2, top + 80); g.quadraticCurveTo(256 + sx * 36, top + 74, 256 + sx * 70, top + 36); g.closePath(); g.fill(); g.stroke(); }
      g.beginPath(); g.ellipse(256, top + 64, 14, 11, 0, 0, 7); g.fill(); g.stroke(); g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 2; for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(256 + sx * (52 - k * 14), top + 30 + k * 12); g.lineTo(256 + sx * (44 - k * 14), top + 44 + k * 12); g.stroke(); } g.strokeStyle = INK; g.lineWidth = 3.5; }
    if (o.apron) { g.fillStyle = o.apron; g.beginPath(); g.moveTo(256 - 40, top + 70); g.lineTo(256 + 40, top + 70); g.lineTo(256 + 56, hem - 8); g.quadraticCurveTo(256, hem + 6, 256 - 56, hem - 8); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(256 - 40, top + 70); g.lineTo(256 - 30, top + 4); g.moveTo(256 + 40, top + 70); g.lineTo(256 + 30, top + 4); g.stroke(); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(256 - 24, top + 110, 48, 34); }
    if (o.scarf) { g.fillStyle = o.scarf; g.beginPath(); g.ellipse(256, top + 6, 54, 16, 0, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(256 + 18, top + 10); g.lineTo(256 + 34, top + 90); g.lineTo(256 + 10, top + 92); g.lineTo(256 + 4, top + 14); g.closePath(); g.fill(); g.stroke(); }
    if (o.belt) { g.fillStyle = o.belt; g.fillRect(256 - 72, top + 140, 144, 14); g.strokeRect(256 - 72, top + 140, 144, 14); g.fillStyle = '#e8c86a'; g.fillRect(256 - 10, top + 138, 20, 18); g.strokeRect(256 - 10, top + 138, 20, 18); }
    if (o.star) { g.fillStyle = '#f2c63a'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 7 : 16; g.lineTo(256 - 34 + Math.cos(a) * rr, top + 62 + Math.sin(a) * rr); } g.closePath(); g.fill(); g.stroke(); }
    if (o.tool === 'wrench') { g.save(); g.translate(256 + 46, top + 60); g.rotate(0.3); g.fillStyle = '#9aa4ae'; g.fillRect(-4, 0, 8, 46); g.beginPath(); g.arc(0, 0, 10, 0, 7); g.fill(); g.stroke(); g.restore(); }
    if (o.pens) { for (let i = 0; i < 3; i++) { g.fillStyle = ['#2a5ad0', '#d02a2a', '#222'][i]; g.fillRect(256 + 22 + i * 7, top + 34, 5, 24); } g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(256 + 18, top + 46, 30, 18); }
  }
  // pencil hatching inside the current clip (hand-drawn shading on clothes)
  hatch(g, x0, y0, x1, y1, col, gap = 9, alpha = 0.35) { // clean style: soft 3D shading band instead of pencil lines
    g.save(); const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(20,10,30,0.28)'); g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0); g.restore(); }
  _hatchOld(g, x0, y0, x1, y1, col, gap = 9, alpha = 0.35) { g.save(); g.strokeStyle = col; g.globalAlpha = alpha; g.lineWidth = 2.2; g.beginPath(); for (let x = x0 - (y1 - y0); x < x1; x += gap) { g.moveTo(x, y1); g.lineTo(x + (y1 - y0) * 0.55, y0); } g.stroke(); g.restore(); }
  outline(g, pts, w = 6) { if (this._cloth) { const [tp, hm] = this._cloth; this._cloth = null; g.save(); this.wpath(g, pts); g.clip(); this.cloth(g, this.o, tp, hm); g.restore(); } this.wpath(g, pts); g.strokeStyle = INK; g.lineWidth = w; g.stroke(); return; g.save(); g.globalAlpha = 0.35; g.translate(1.2, -0.8); this.wpath(g, pts); g.lineWidth = w * 0.45; g.stroke(); g.restore(); }
  body(g, o, top, hem) {
    const type = o.body || 'coat', sd = this.o.seed;
    const shapeBell = (wt, wb) => { const pts = [], n = 14; for (let i = 0; i <= n; i++) { const u = i / n; pts.push([256 + wt + (wb - wt) * Math.pow(u, 0.5), top + (hem - top - 60) * u]); }
      for (let i = 0; i <= 14; i++) { const a = R(180 * i / 14); pts.push([256 + Math.cos(a) * wb, hem - 60 + Math.sin(a) * 60]); }
      for (let i = n; i >= 0; i--) { const u = i / n; pts.push([256 - wt - (wb - wt) * Math.pow(u, 0.5), top + (hem - top - 60) * u]); } return pts; };
    if (type === 'bean') {     // tall rounded capsule (suit / long coat), like the villain
      const pts = []; const bt = top - 4, bh = hem + 40;
      for (let i = 0; i <= 40; i++) { const a = R(-90 + 360 * i / 40); const rx = 66, ry = (bh - bt) / 2; const k = Math.sin(a) > 0 ? 1.0 : 0.85; pts.push([256 + Math.cos(a) * rx * k, (bt + bh) / 2 + Math.sin(a) * ry]); }
      this.wpath(g, pts); g.fillStyle = o.coat; g.fill(); g.save(); this.wpath(g, pts); g.clip(); this.pattern(g, o, top, hem);
      this.hatch(g, 256 + 26, bt, 256 + 80, bh, shade(o.coat, 0.55), 8, 0.5);
      g.fillStyle = o.shirt || '#fbf6ec'; g.beginPath(); g.moveTo(240, bt); g.lineTo(272, bt); g.lineTo(262, bt + 120); g.lineTo(250, bt + 120); g.closePath(); g.fill();
      g.strokeStyle = INK; g.lineWidth = 3.5; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(256 + s * 18, bt); g.quadraticCurveTo(256 + s * 30, bt + 60, 256 + s * 6, bt + 150); g.stroke(); }
      g.fillStyle = o.tie; g.beginPath(); g.moveTo(256, bt + 26); g.lineTo(242, bt + 14); g.lineTo(242, bt + 38); g.closePath(); g.moveTo(256, bt + 26); g.lineTo(270, bt + 14); g.lineTo(270, bt + 38); g.closePath(); g.fill(); g.stroke();
      if (o.badge) { g.fillStyle = o.badge; g.beginPath(); g.arc(256 - 32, bt + 70, 11, 0, 7); g.fill(); g.stroke(); }
      g.restore(); this.outline(g, pts, 6); return;
    }
    if (type === 'overalls') {   // shirt + denim bib overalls with straps, patch, buttons
      const pts = shapeBell(48, 80); this.wpath(g, pts); g.fillStyle = o.shirt || '#f2b53a'; g.fill();
      g.save(); this.wpath(g, pts); g.clip();
      const den = o.coat; g.fillStyle = den; g.beginPath(); g.roundRect(256 - 46, top + 58, 92, 90, 10); g.fill(); g.fillRect(256 - 90, top + 128, 180, 200);
      g.strokeStyle = shade(den, 0.6); g.lineWidth = 2; g.setLineDash([6, 5]); g.strokeRect(256 - 40, top + 64, 80, 78); g.setLineDash([]);
      g.strokeStyle = den; g.lineWidth = 16; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(256 + s * 38, top + 64); g.lineTo(256 + s * 44, top - 2); g.stroke(); }
      g.fillStyle = '#e8c86a'; g.strokeStyle = INK; g.lineWidth = 2.5; for (const s of [-1, 1]) { g.beginPath(); g.arc(256 + s * 36, top + 70, 6, 0, 7); g.fill(); g.stroke(); }
      if (o.patch !== false) { g.fillStyle = o.patch || '#c8342a'; g.beginPath(); g.rect(256 - 6, top + 86, 28, 26); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.setLineDash([4, 3]); g.strokeRect(256 - 4, top + 88, 24, 22); g.setLineDash([]); }
      this.hatch(g, 256 + 36, top, 256 + 90, hem + 10, shade(den, 0.5), 8, 0.45); this.hatch(g, 256 - 90, top + 140, 256 - 60, hem + 10, '#ffffff', 10, 0.15);
      g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(256 - 46, top + 128); g.lineTo(256 + 46, top + 128); g.stroke();
      g.restore(); this.outline(g, pts, 6); return;
    }
    if (type === 'vest') {       // shirt + waistcoat with buttons + bow tie / bandana (reference look)
      const pts = shapeBell(46, 78); this.wpath(g, pts); g.fillStyle = o.shirt || '#f4f0e6'; g.fill(); g.save(); this.wpath(g, pts); g.clip();
      { const pp = new Path2D(); pp.moveTo(256 - 90, top + 10); pp.lineTo(256 - 14, top + 40); pp.lineTo(256 - 6, hem); pp.lineTo(256 - 90, hem); pp.closePath(); pp.moveTo(256 + 90, top + 10); pp.lineTo(256 + 14, top + 40); pp.lineTo(256 + 6, hem); pp.lineTo(256 + 90, hem); pp.closePath(); g.fillStyle = o.coat; g.fill(pp); g.save(); g.clip(pp); this.pattern(g, o, top, hem); g.restore(); }
      this.hatch(g, 256 + 30, top, 256 + 100, hem + 10, shade(o.coat, 0.5), 8, 0.4); g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(256 - 14, top + 40); g.lineTo(256 - 6, hem); g.moveTo(256 + 14, top + 40); g.lineTo(256 + 6, hem); g.stroke();
      g.fillStyle = o.buttons || '#f2c63a'; for (let k = 0; k < 4; k++) for (const sx of [-1, 1]) { g.beginPath(); g.arc(256 + sx * 22, top + 70 + k * 38, 5.5, 0, 7); g.fill(); g.stroke(); }
      if (o.pocket) { g.strokeStyle = o.buttons || '#f2c63a'; g.lineWidth = 3; g.beginPath(); g.moveTo(256 + 30, top + 80); g.quadraticCurveTo(256 + 50, top + 100, 256 + 70, top + 80); g.stroke(); }
      g.restore(); this.outline(g, pts, 6);
      if (o.bandana) { g.fillStyle = o.bandana; g.strokeStyle = INK; g.lineWidth = 3.5; g.beginPath(); g.moveTo(256 - 30, top + 2); g.lineTo(256 + 30, top + 2); g.lineTo(256, top + 46); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff'; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(256 - 12 + k * 8, top + 12 + (k % 2) * 8, 2.5, 0, 7); g.fill(); } }
      else if (o.bow) { g.fillStyle = o.bow; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(256, top + 12); g.lineTo(256 - 24, top); g.lineTo(256 - 24, top + 26); g.closePath(); g.moveTo(256, top + 12); g.lineTo(256 + 24, top); g.lineTo(256 + 24, top + 26); g.closePath(); g.fill(); g.stroke(); }
      return;
    }
    if (type === 'polo') {       // golf polo: soft collar, button placket, short sleeves (o.sleeves), optional pattern
      if (o.pants) { g.fillStyle = o.pants.col; g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.moveTo(256 - 54, hem - 70); g.lineTo(256 + 54, hem - 70); g.lineTo(256 + 50, hem + 20); g.quadraticCurveTo(256, hem + 34, 256 - 50, hem + 20); g.closePath(); g.fill(); g.stroke(); }
      const pts = shapeBell(46, 60).map(([x, y]) => [x, top + (y - top) * (o.pants ? 0.9 : 1)]); this.wpath(g, pts); g.fillStyle = o.coat; g.fill(); g.save(); this.wpath(g, pts); g.clip(); this.pattern(g, o, top, hem);
      this.hatch(g, 256 + 30, top, 256 + 100, hem + 10, shade(o.coat, 0.5), 8, 0.4); g.fillStyle = shade(o.coat, 0.88); g.fillRect(256 - 9, top + 6, 18, 74); g.strokeStyle = INK; g.lineWidth = 2.5; g.strokeRect(256 - 9, top + 6, 18, 74);
      g.fillStyle = '#f8f4ea'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(256, top + 22 + k * 22, 4.5, 0, 7); g.fill(); g.stroke(); }
      if (o.belt) { g.fillStyle = o.belt; g.fillRect(256 - 90, hem - 52, 180, 14); g.strokeRect(256 - 90, hem - 52, 180, 14); g.fillStyle = '#e8c86a'; g.fillRect(256 - 10, hem - 54, 20, 18); g.strokeRect(256 - 10, hem - 54, 20, 18); }
      g.restore(); this.outline(g, pts, 6);
      g.fillStyle = o.collarCol || shade(o.coat, 1.12); g.strokeStyle = INK; g.lineWidth = 4; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(256 + sx * 4, top + 6); g.quadraticCurveTo(256 + sx * 22, top - 4, 256 + sx * 36, top + 2); g.quadraticCurveTo(256 + sx * 30, top + 18, 256 + sx * 16, top + 30); g.closePath(); g.fill(); g.stroke(); }
      if (o.logo) { g.fillStyle = o.logo; g.beginPath(); g.arc(256 + 40, top + 50, 8, 0, 7); g.fill(); }
      return;
    }
    // ---------- v9 costumes: fitted silhouettes per era/role (not the generic bell) ----------
    const fit = (ws, ww, wh, ext = 0, top2 = top) => { const pts = [], H = hem + ext; const mid = top2 + (hem - top2) * 0.55;
      pts.push([256 + ws * 0.55, top2 - 2], [256 + ws, top2 + 14]); for (let i = 1; i <= 8; i++) { const u = i / 8; pts.push([256 + ws + (ww - ws) * Math.sin(u * Math.PI / 2), top2 + 14 + (mid - top2 - 14) * u]); }
      for (let i = 1; i <= 8; i++) { const u = i / 8; pts.push([256 + ww + (wh - ww) * u * u, mid + (H - mid) * u]); } for (let i = 1; i < 10; i++) { const u = i / 10; pts.push([256 + wh - 2 * wh * u, H + Math.sin(u * Math.PI) * 10]); }
      for (let i = 8; i >= 1; i--) { const u = i / 8; pts.push([256 - ww - (wh - ww) * u * u, mid + (H - mid) * u]); } for (let i = 8; i >= 1; i--) { const u = i / 8; pts.push([256 - ws - (ww - ws) * Math.sin(u * Math.PI / 2), top2 + 14 + (mid - top2 - 14) * u]); }
      pts.push([256 - ws, top2 + 14], [256 - ws * 0.55, top2 - 2]); return pts; };
    const shadeR = (pts, col) => { g.save(); this.wpath(g, pts); g.clip(); const gr = g.createLinearGradient(256 - 90, 0, 256 + 90, 0); gr.addColorStop(0, 'rgba(255,255,255,0.12)'); gr.addColorStop(0.55, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(10,0,20,0.32)'); g.fillStyle = gr; g.fillRect(0, top - 40, 512, hem - top + 200); g.restore(); };
    const goldC = o.trim || '#f2c63a';
    if (type === 'royal' || type === 'sherwani') {   // long fitted sherwani to the knees; royal = + cape, fur collar, gold epaulettes, sash
      if (type === 'royal') { const cp = [[256 - 66, top + 6], [256 + 66, top + 6], [256 + 118, hem + 150], [256 - 118, hem + 150]]; this.wpath(g, cp); g.fillStyle = o.cape || '#b0182a'; g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.stroke(); g.save(); this.wpath(g, cp); g.clip(); g.fillStyle = 'rgba(0,0,0,0.25)'; for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(256 + k * 22, top + 30); g.lineTo(256 + k * 34, hem + 150); g.lineWidth = 6; g.strokeStyle = 'rgba(0,0,0,0.18)'; g.stroke(); } g.restore(); }
      const pts = fit(68, 52, 74, 90); this.wpath(g, pts); g.fillStyle = o.coat; g.fill(); g.save(); this.wpath(g, pts); g.clip(); this.pattern(g, o, top, hem + 90);
      g.fillStyle = goldC; g.fillRect(256 - 7, top + 10, 14, hem - top + 100); g.fillStyle = shade(goldC, 0.7); for (let y = top + 20; y < hem + 90; y += 18) { g.beginPath(); g.arc(256, y, 3, 0, 7); g.fill(); }
      g.strokeStyle = goldC; g.lineWidth = 7; g.beginPath(); g.moveTo(256 - 74, hem + 70); g.quadraticCurveTo(256, hem + 92, 256 + 74, hem + 70); g.stroke();
      for (const sx of [-1, 1]) { g.fillStyle = goldC; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(256 + sx * (36 + (k % 2) * 10), top + 50 + k * 20, 4, 0, 7); g.fill(); } }
      if (o.sash !== null) { g.fillStyle = o.sash || '#e8282a'; g.fillRect(256 - 70, hem - 70, 140, 26); g.fillStyle = goldC; g.fillRect(256 - 70, hem - 70, 140, 5); g.fillRect(256 - 70, hem - 49, 140, 5); g.beginPath(); g.moveTo(256 + 30, hem - 50); g.lineTo(256 + 40, hem + 30); g.lineTo(256 + 54, hem + 26); g.lineTo(256 + 46, hem - 50); g.fill(); }
      g.restore(); shadeR(pts); this.outline(g, pts, 6);
      g.fillStyle = goldC; g.strokeStyle = INK; g.lineWidth = 3.5; g.beginPath(); g.roundRect(256 - 30, top - 8, 60, 22, 8); g.fill(); g.stroke();
      if (type === 'royal') { g.fillStyle = '#fbf6ee'; g.beginPath(); g.ellipse(256, top + 4, 86, 26, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#1a1410'; for (let k = -4; k <= 4; k++) { g.beginPath(); g.ellipse(256 + k * 18, top + 4 + (k % 2) * 6, 3, 6, 0, 0, 7); g.fill(); }
        for (const sx of [-1, 1]) { g.fillStyle = goldC; g.beginPath(); g.ellipse(256 + sx * 70, top + 22, 26, 14, sx * 0.3, 0, 7); g.fill(); g.stroke(); for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(256 + sx * (52 + k * 8), top + 30); g.lineTo(256 + sx * (52 + k * 8), top + 50); g.lineWidth = 3; g.strokeStyle = goldC; g.stroke(); } g.strokeStyle = INK; g.lineWidth = 3.5; } }
      return; }
    if (type === 'armor') {   // soldier: tunic skirt, steel breastplate with ridge + rivets, pauldrons, leather belt
      const sk = fit(60, 56, 84, 50, top + 120); this.wpath(g, sk); g.fillStyle = o.coat; g.fill(); g.save(); this.wpath(g, sk); g.clip(); g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 3; for (let k = -4; k <= 4; k++) { g.beginPath(); g.moveTo(256 + k * 16, top + 150); g.lineTo(256 + k * 21, hem + 60); g.stroke(); } g.restore(); this.outline(g, sk, 6);
      const st = o.steel || '#b8c0ca'; const pl = fit(64, 50, 54, -(hem - top) + 150); this.wpath(g, pl); const gr = g.createLinearGradient(256 - 70, 0, 256 + 70, 0); gr.addColorStop(0, shade(st, 1.18)); gr.addColorStop(0.45, st); gr.addColorStop(1, shade(st, 0.62)); g.fillStyle = gr; g.fill(); this.outline(g, pl, 6);
      g.strokeStyle = shade(st, 0.55); g.lineWidth = 4; g.beginPath(); g.moveTo(256, top + 12); g.lineTo(256, top + 150); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.ellipse(256 - 30, top + 60, 10, 34, 0.2, 0, 7); g.fill();
      g.fillStyle = shade(st, 0.5); for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(256 + sx * 44, top + 30 + k * 30, 3.5, 0, 7); g.fill(); }
      g.fillStyle = '#6a4220'; g.fillRect(256 - 64, top + 146, 128, 20); g.strokeStyle = INK; g.lineWidth = 3.5; g.strokeRect(256 - 64, top + 146, 128, 20); g.fillStyle = goldC; g.fillRect(256 - 12, top + 143, 24, 26); g.strokeRect(256 - 12, top + 143, 24, 26);
      for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(256 + sx * 66, top + 16, 34, 24, sx * 0.35, 0, 7); const pg = g.createRadialGradient(256 + sx * 60, top + 8, 4, 256 + sx * 66, top + 16, 36); pg.addColorStop(0, shade(st, 1.2)); pg.addColorStop(1, shade(st, 0.6)); g.fillStyle = pg; g.fill(); g.stroke(); }
      if (o.emblem) { g.fillStyle = o.emblem; g.beginPath(); g.moveTo(256, top + 52); g.lineTo(256 + 18, top + 72); g.lineTo(256, top + 96); g.lineTo(256 - 18, top + 72); g.closePath(); g.fill(); g.stroke(); }
      return; }
    if (type === 'tshirt' || type === 'hoodie') {   // modern casual: crew-neck tee (print) or hoodie (hood, pocket, strings)
      if (type === 'hoodie') { g.fillStyle = shade(o.coat, 0.85); g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.ellipse(256, top + 4, 74, 30, 0, 0, 7); g.fill(); g.stroke(); }
      const pts = fit(type === 'hoodie' ? 70 : 62, type === 'hoodie' ? 60 : 50, type === 'hoodie' ? 64 : 54, type === 'hoodie' ? 8 : -10); this.wpath(g, pts); g.fillStyle = o.coat; g.fill(); g.save(); this.wpath(g, pts); g.clip(); this.pattern(g, o, top, hem);
      if (type === 'hoodie') { g.fillStyle = shade(o.coat, 0.85); g.beginPath(); g.roundRect(256 - 46, hem - 90, 92, 54, 14); g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); g.strokeStyle = o.strings || '#f4f4f4'; g.lineWidth = 4; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(256 + sx * 12, top + 14); g.lineTo(256 + sx * 14, top + 74); g.stroke(); } }
      else if (o.print) { g.fillStyle = o.printCol || '#ffffff'; g.font = 'bold 34px "DejaVu Sans"'; g.textAlign = 'center'; g.fillText(o.print, 256, top + 92); } else { g.fillStyle = o.printCol || 'rgba(255,255,255,0.75)'; g.beginPath(); g.arc(256, top + 80, 22, 0, 7); g.fill(); }
      g.restore(); shadeR(pts); this.outline(g, pts, 6); g.strokeStyle = INK; g.lineWidth = 4; g.fillStyle = shade(o.coat, 0.8); g.beginPath(); g.ellipse(256, top + 4, 26, 9, 0, 0, Math.PI); g.fill(); g.stroke(); return; }
    if (type === 'jacket' || type === 'suit') {   // jacket over a tee (open front) / fitted suit with lapels + tie
      const pts = fit(68, 54, 60, type === 'suit' ? 14 : 0); this.wpath(g, pts); g.fillStyle = o.shirt || (type === 'suit' ? '#f6f4f0' : '#f2f2f2'); g.fill(); g.save(); this.wpath(g, pts); g.clip();
      for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(256 + sx * 100, top - 10); g.lineTo(256 + sx * (type === 'suit' ? 6 : 22), top + (type === 'suit' ? 110 : 20)); g.lineTo(256 + sx * (type === 'suit' ? 4 : 20), hem + 40); g.lineTo(256 + sx * 100, hem + 40); g.closePath(); g.fillStyle = o.coat; g.fill(); }
      if (type === 'suit' && o.tie) { g.fillStyle = o.tie; g.beginPath(); g.moveTo(250, top + 6); g.lineTo(262, top + 6); g.lineTo(266, top + 104); g.lineTo(256, top + 118); g.lineTo(246, top + 104); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); }
      g.strokeStyle = INK; g.lineWidth = 3.5; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(256 + sx * 30, top + 2); g.lineTo(256 + sx * 46, top + 56); g.lineTo(256 + sx * (type === 'suit' ? 8 : 22), top + (type === 'suit' ? 112 : 70)); g.stroke(); }
      if (type === 'jacket') { g.fillStyle = '#d8d8d8'; for (let y = top + 30; y < hem + 30; y += 26) for (const sx of [-1, 1]) { g.beginPath(); g.arc(256 + sx * 24, y, 3, 0, 7); g.fill(); } } else { g.fillStyle = '#1a1a1a'; for (let k = 0; k < 2; k++) { g.beginPath(); g.arc(256 + 9, top + 140 + k * 34, 5, 0, 7); g.fill(); } if (o.pocketSq) { g.fillStyle = o.pocketSq; g.beginPath(); g.moveTo(256 - 64, top + 76); g.lineTo(256 - 40, top + 76); g.lineTo(256 - 48, top + 62); g.closePath(); g.fill(); } }
      g.restore(); shadeR(pts); this.outline(g, pts, 6); return; }
    if (type === 'dress') {      // checked dress (gingham)
      const pts = shapeBell(40, 92); this.wpath(g, pts); g.fillStyle = '#fff'; g.fill();
      g.save(); this.wpath(g, pts); g.clip(); g.fillStyle = o.coat; g.globalAlpha = 0.85;
      g.globalAlpha = 0.45; for (let x = 140; x < 380; x += 24) g.fillRect(x, top - 20, 12, hem - top + 60); for (let y = top - 20; y < hem + 40; y += 24) g.fillRect(140, y, 240, 12);
      g.globalAlpha = 1; this.hatch(g, 256 + 40, top, 256 + 100, hem + 10, '#000', 9, 0.18); g.restore(); this.outline(g, pts, 6);
      g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.ellipse(256, top + 6, 32, 12, 0, 0, 7); g.fill(); g.stroke(); return;
    }
    // default: small bell coat (reference #1)
    const pts = shapeBell(46, 76); this.wpath(g, pts); g.fillStyle = o.coat; g.fill();
    g.save(); this.wpath(g, pts); g.clip();
    g.fillStyle = shade(o.coat, 0.78); g.beginPath(); g.ellipse(256 + 70, (top + hem) / 2 + 20, 34, 150, 0, 0, 7); g.fill();
    this.hatch(g, 256 + 40, top, 256 + 90, hem + 10, shade(o.coat, 0.5), 9, 0.3);
    g.fillStyle = shade(o.coat, 1.12); g.beginPath(); g.ellipse(256 - 52, top + 40, 14, 60, 0.15, 0, 7); g.fill();
    if (o.tie) { g.fillStyle = o.tie; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(250, top + 8); g.lineTo(262, top + 8); g.lineTo(266, top + 120); g.lineTo(256, top + 136); g.lineTo(246, top + 120); g.closePath(); g.fill(); g.stroke(); }
    if (o.badge) { g.fillStyle = o.badge; g.lineWidth = 3.5; g.beginPath(); g.roundRect(256 + 18, top + 48, 34, 30, 7); g.fill(); g.stroke(); }
    g.restore(); this.outline(g, pts, 6);
    g.fillStyle = o.collar; g.strokeStyle = INK; g.lineWidth = 3.5;
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(256, top + 2); g.lineTo(256 + s * 30, top - 4); g.lineTo(256 + s * 20, top + 22); g.closePath(); g.fill(); g.stroke(); }
  }
  hair(g, r) {
    const o = this.o; g.fillStyle = o.hair;
    // hair cap down to ~40% of the head, jagged bangs over the forehead
    g.beginPath(); g.moveTo(-r - 4, -r * 0.05);
    g.bezierCurveTo(-r * 1.02, -r * 1.25, r * 1.02, -r * 1.25, r + 4, -r * 0.05);
    const bang = [[r * 0.78, -r * 0.28], [r * 0.55, -r * 0.45], [r * 0.38, -r * 0.3], [r * 0.12, -r * 0.47], [-r * 0.1, -r * 0.33], [-r * 0.36, -r * 0.5], [-r * 0.58, -r * 0.32], [-r * 0.82, -r * 0.42]];
    if (o.hairStyle === 'bangs') for (const [x, y] of bang) g.lineTo(x, y); else g.lineTo(-r * 0.9, -r * 0.45);
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,220,180,0.38)'; g.lineWidth = 7; g.beginPath(); g.moveTo(-r * 0.62, -r * 0.62); g.quadraticCurveTo(-r * 0.3, -r * 0.84, 0, -r * 0.8); g.stroke();
    g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(-r - 4, -r * 0.05); for (const [x, y] of bang.slice().reverse()) g.lineTo(x, y); g.lineTo(r + 4, -r * 0.05); g.stroke();
  }
  tufts(g, r) { const o = this.o; g.fillStyle = o.hair; g.strokeStyle = INK; g.lineWidth = 4;
    for (const sd of [-1, 1]) { if (o.tuftSide && o.tuftSide !== sd) continue; g.beginPath(); g.moveTo(sd * r * 0.98, -r * 0.42); g.quadraticCurveTo(sd * r * 1.1, -r * 0.05, sd * r * 0.92, r * 0.18); g.lineTo(sd * r * 0.74, -r * 0.05); g.lineTo(sd * r * 0.8, r * 0.08); g.lineTo(sd * r * 0.62, -r * 0.35); g.closePath(); g.fill(); g.stroke(); } }
  bigHair(g, r, tu = 0) {
    const o = this.o, st = o.hairStyle; g.fillStyle = o.hair; g.strokeStyle = INK; g.lineWidth = 5;
    const fillStroke = () => { g.fill(); g.stroke(); }, shine = (a, b) => { g.save(); g.strokeStyle = 'rgba(255,240,220,0.32)'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0] * r, a[1] * r); g.quadraticCurveTo((a[0] + b[0]) / 2 * r, Math.min(a[1], b[1]) * r - 0.12 * r, b[0] * r, b[1] * r); g.stroke(); g.restore(); };
    if (Math.abs(tu) > 0.55 && !['bald', 'quiff', 'pompadour'].includes(st)) { const sg = -Math.sign(tu); g.beginPath(); g.ellipse(sg * r * 0.78, -r * 0.34, r * 0.28, r * 0.4, sg * 0.3, 0, 7); g.fill(); }   // back of the head in profile
    if (st === 'quiff') {   // slicked-back quiff: volume over the forehead, side part, hair down to the temples
      g.beginPath(); g.moveTo(-r * 1.05, -r * 0.02); g.bezierCurveTo(-r * 1.18, -r * 1.05, -r * 0.3, -r * 1.42, r * 0.35, -r * 1.36); g.bezierCurveTo(r * 0.95, -r * 1.32, r * 1.18, -r * 1.0, r * 1.02, -r * 0.72);
      g.bezierCurveTo(r * 1.12, -r * 0.5, r * 1.08, -r * 0.25, r * 1.04, -r * 0.08); g.bezierCurveTo(r * 0.85, -r * 0.55, r * 0.55, -r * 0.66, r * 0.15, -r * 0.6); g.bezierCurveTo(-r * 0.3, -r * 0.7, -r * 0.75, -r * 0.4, -r * 1.05, -r * 0.02); g.closePath(); fillStroke();
      shine([-0.55, -0.95], [0.45, -1.12]); g.strokeStyle = INK; g.lineWidth = 3.5; g.beginPath(); g.moveTo(-r * 0.35, -r * 0.66); g.quadraticCurveTo(-r * 0.2, -r * 0.95, -r * 0.4, -r * 1.2); g.stroke(); }
    else if (st === 'swept') {   // short side-swept fringe
      g.beginPath(); g.moveTo(-r * 1.06, r * 0.02); g.bezierCurveTo(-r * 1.15, -r * 1.25, r * 1.15, -r * 1.3, r * 1.06, -r * 0.05); g.bezierCurveTo(r * 0.98, -r * 0.4, r * 0.7, -r * 0.42, r * 0.5, -r * 0.3);
      g.quadraticCurveTo(r * 0.25, -r * 0.5, -r * 0.1, -r * 0.42); g.quadraticCurveTo(-r * 0.45, -r * 0.6, -r * 0.75, -r * 0.45); g.quadraticCurveTo(-r * 0.95, -r * 0.3, -r * 1.06, r * 0.02); g.closePath(); fillStroke(); shine([-0.5, -0.9], [0.5, -0.9]);
      g.strokeStyle = INK; g.lineWidth = 3; for (const [a, b] of [[0.2, -0.45], [0.55, -0.35]]) { g.beginPath(); g.moveTo(a * r, b * r); g.quadraticCurveTo((a - 0.15) * r, (b - 0.3) * r, (a - 0.05) * r, (b - 0.5) * r); g.stroke(); } }
    else if (st === 'curly') { const n = 13; g.beginPath(); for (let i = 0; i <= n; i++) { const a = Math.PI * 0.98 + Math.PI * 1.04 * i / n; g.arc(Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.86 - r * 0.08, r * 0.24, 0, 7); } g.fill(); for (let i = 0; i <= n; i++) { const a = Math.PI * 0.98 + Math.PI * 1.04 * i / n; g.beginPath(); g.arc(Math.cos(a) * r * 0.98, Math.sin(a) * r * 0.86 - r * 0.08, r * 0.24, a - 1.6, a + 1.6); g.stroke(); } }
    else if (st === 'bun' || st === 'ponytail') { if (st === 'bun') { g.beginPath(); g.arc(0, -r * 1.12, r * 0.34, 0, 7); fillStroke(); shine([-0.2, -1.3], [0.2, -1.3]); } else { g.beginPath(); g.moveTo(-r * 0.9, -r * 0.45); g.bezierCurveTo(-r * 1.55, -r * 0.2, -r * 1.35, r * 0.6, -r * 1.1, r * 0.85); g.bezierCurveTo(-r * 1.0, r * 0.4, -r * 0.95, 0, -r * 0.7, -r * 0.3); g.closePath(); fillStroke(); }
      g.beginPath(); g.moveTo(-r * 1.04, -r * 0.02); g.bezierCurveTo(-r * 1.12, -r * 1.25, r * 1.12, -r * 1.25, r * 1.04, -r * 0.02); g.bezierCurveTo(r * 0.7, -r * 0.6, -r * 0.7, -r * 0.6, -r * 1.04, -r * 0.02); g.closePath(); fillStroke(); shine([-0.5, -0.88], [0.4, -0.92]); g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -r * 0.55); g.lineTo(0, -r * 0.92); g.stroke(); }
    else if (st === 'bald') { for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * r * 0.98, -r * 0.18, r * 0.2, r * 0.32, s * 0.3, 0, 7); fillStroke(); } g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.ellipse(-r * 0.3, -r * 0.7, r * 0.22, r * 0.1, -0.4, 0, 7); g.fill(); }
    else if (st === 'spiky') { g.beginPath(); g.moveTo(-r * 1.05, -r * 0.05); const n = 9; for (let i = 0; i <= n; i++) { const a = Math.PI + Math.PI * i / n, rr = r * (i % 2 ? 1.42 : 1.0); g.lineTo(Math.cos(a) * rr * 1.02, Math.sin(a) * rr * 0.95); } g.lineTo(r * 1.05, -r * 0.05); g.quadraticCurveTo(0, -r * 0.55, -r * 1.05, -r * 0.05); g.closePath(); fillStroke(); }
    else if (st === 'pompadour') {      // tall swept quiff sitting ON the head
      g.beginPath(); g.moveTo(-r * 0.98, -r * 0.2); g.bezierCurveTo(-r * 1.15, -r * 1.25, r * 0.2, -r * 1.55, r * 0.95, -r * 1.05);
      g.bezierCurveTo(r * 1.1, -r * 0.8, r * 1.02, -r * 0.4, r * 0.98, -r * 0.25); g.bezierCurveTo(r * 0.6, -r * 0.75, -r * 0.2, -r * 0.62, -r * 0.55, -r * 0.45);
      g.quadraticCurveTo(-r * 0.8, -r * 0.35, -r * 0.98, -r * 0.2); g.closePath(); fillStroke();
      g.strokeStyle = 'rgba(255,230,200,0.35)'; g.lineWidth = 6; g.beginPath(); g.moveTo(-r * 0.6, -r * 0.95); g.quadraticCurveTo(0, -r * 1.25, r * 0.6, -r * 1.05); g.stroke();
      g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(-r * 0.15, -r * 0.62); g.quadraticCurveTo(r * 0.05, -r * 0.4, -r * 0.05, -r * 0.3); g.stroke();
    } else if (st === 'side') {    // side-parted helmet hair
      g.beginPath(); g.moveTo(-r * 1.02, r * 0.05); g.bezierCurveTo(-r * 1.15, -r * 1.2, r * 1.15, -r * 1.25, r * 1.03, -r * 0.1);
      g.bezierCurveTo(r * 0.7, -r * 0.55, r * 0.0, -r * 0.62, -r * 0.45, -r * 0.4); g.quadraticCurveTo(-r * 0.75, -r * 0.25, -r * 1.02, r * 0.05); g.closePath(); fillStroke();
      g.strokeStyle = 'rgba(255,230,200,0.3)'; g.lineWidth = 6; g.beginPath(); g.moveTo(-r * 0.5, -r * 0.85); g.quadraticCurveTo(r * 0.1, -r * 1.05, r * 0.6, -r * 0.8); g.stroke();
    } else if (st === 'messy') {
      g.beginPath(); g.moveTo(-r * 1.0, -r * 0.1); const n = 11; for (let i = 0; i <= n; i++) { const a = Math.PI + Math.PI * i / n; const rr = r * (i % 2 ? 1.22 : 1.02); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.95); }
      g.lineTo(r * 0.9, -r * 0.35); g.lineTo(r * 0.4, -r * 0.5); g.lineTo(0, -r * 0.38); g.lineTo(-r * 0.45, -r * 0.55); g.lineTo(-r * 0.8, -r * 0.35); g.closePath(); fillStroke();
    } else if (st === 'pigtails') {
      for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * r * 1.08, -r * 0.05, r * 0.28, r * 0.42, s * 0.5, 0, 7); fillStroke(); }
      g.beginPath(); g.moveTo(-r * 1.0, -r * 0.1); g.bezierCurveTo(-r * 1.1, -r * 1.25, r * 1.1, -r * 1.25, r * 1.0, -r * 0.1); g.bezierCurveTo(r * 0.5, -r * 0.5, -r * 0.5, -r * 0.5, -r * 1.0, -r * 0.1); g.closePath(); fillStroke();
      g.fillStyle = o.band || '#e4332a'; for (const s of [-1, 1]) { g.beginPath(); g.arc(s * r * 0.92, -r * 0.3, 12, 0, 7); g.fill(); g.stroke(); }
    }
  }
  face(g, f, r) {
    const lx = (f.look?.[0] || 0) * 8, ly = (f.look?.[1] || 0) * 6, ey = -4, ex = 42;
    const eyes = f.eyes || 'calm', mouth = f.mouth || 'smile', brow = f.brow ?? 0;
    { const hp = ['grin', 'laugh', 'psycho', 'bigsmile', 'talk', 'smile'].includes(mouth) || ['happy', 'squeeze'].includes(eyes); const a = (hp ? 0.4 : 0.2); for (const s of [-1, 1]) { const gr = g.createRadialGradient(s * 66, 36, 2, s * 66, 36, 30); gr.addColorStop(0, `rgba(255,110,110,${a})`); gr.addColorStop(1, 'rgba(255,110,110,0)'); g.fillStyle = gr; g.beginPath(); g.arc(s * 66, 36, 30, 0, 7); g.fill(); } }
    
    const TU = this._tu || 0;
    for (const s of [-1, 1]) {
      const near = Math.sign(TU) === s ? 1 : Math.sign(TU) === -s ? -1 : 0, ek = (1 + near * Math.abs(TU) * 0.36) * (1 + 0.26 * Math.abs(this._fs || 0)); if (near < 0 && Math.abs(TU) > 0.85) continue;   // true profile: one eye   // perspective: the eye on the turned side is nearer
      g.save(); g.translate(0, -7 * (this._fs || 0)); g.translate(s * ex, ey); g.scale(ek, ek); g.translate(-s * ex, -ey);
      const x = s * ex; g.strokeStyle = INK; g.fillStyle = '#1e1410';
      if (eyes === 'lid') {   // EXPRESSIVE EYE: pupil (look), upper lid (coverage + tilt), lower lid (squint), per-side values
        const sd = s < 0 ? 'L' : 'R'; let lid = f['lid' + sd] ?? f.lid ?? 0.3, sq = f['squint' + sd] ?? f.squint ?? 0.08; const tl = (f['lidTilt' + sd] ?? f.lidTilt ?? 0) * s; const cov = lid + sq; if (cov > 0.6) { lid *= 0.6 / cov; sq *= 0.6 / cov; }   // never squeeze the eye into a line
        const ew = 14, eh = 20, cy = ey - 4, px = x + lx * 1.6, py = cy + ly * 1.4;
        g.save(); g.beginPath(); g.ellipse(x, cy, ew + 3, eh + 3, 0, 0, 7); g.clip();
        g.fillStyle = '#1e1410'; g.beginPath(); g.ellipse(px, py, ew * 0.82, eh * 0.9, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.arc(px - 4, py - 8, 4.6, 0, 7); g.fill(); g.beginPath(); g.arc(px + 4, py + 7, 2.2, 0, 7); g.fill();
        const top = cy - eh - 2 + lid * (eh * 2 + 4), bot = cy + eh + 2 - sq * (eh * 2 + 4);
        g.fillStyle = this.o.skin; g.beginPath(); g.moveTo(x - 24, cy - eh - 8); g.lineTo(x + 24, cy - eh - 8); g.lineTo(x + 24, top - tl * 9); g.lineTo(x - 24, top + tl * 9); g.closePath(); g.fill();
        g.beginPath(); g.moveTo(x - 24, cy + eh + 8); g.lineTo(x + 24, cy + eh + 8); g.lineTo(x + 24, bot); g.quadraticCurveTo(x, bot - sq * 10, x - 24, bot); g.closePath(); g.fill(); g.restore();
        g.strokeStyle = INK; g.lineCap = 'round';
        if (lid > 0.24) { g.lineWidth = 5; g.beginPath(); g.moveTo(x - ew - 2, top + tl * 8); g.quadraticCurveTo(x, top - 4, x + ew + 2, top - tl * 8); g.stroke(); }

      }
      else if (eyes === 'stare') { g.fillStyle = '#1e1410'; g.beginPath(); g.ellipse(x + lx * 0.4, ey - 8 + ly * 0.4, 15, 23, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.arc(x + lx * 0.4 - 5, ey - 17 + ly * 0.4, 5, 0, 7); g.fill(); g.beginPath(); g.arc(x + lx * 0.4 + 4, ey - 1 + ly * 0.4, 2.4, 0, 7); g.fill(); }
      else if (eyes === 'dot') { g.fillStyle = '#1e1410'; g.beginPath(); g.ellipse(x + lx, ey - 6 + ly, 13, 19.5, 0, 0, 7); g.fill(); }
      else if (eyes === 'sly') { g.fillStyle = '#1e1410'; g.beginPath(); g.ellipse(x + lx, ey - 4, 12, 7, 0, 0, 7); g.fill(); g.lineWidth = 5; g.beginPath(); g.moveTo(x - 17, ey - 9 - s * 3); g.lineTo(x + 17, ey - 9 + s * 3); g.stroke(); }
      else if (eyes === 'calm') {      // reference eye: grey half-lidded ellipse with a lid line
        g.beginPath(); g.ellipse(x + lx, ey + ly + 2, 14, 8.5, 0, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.arc(x + lx - 4, ey + ly - 1, 2.6, 0, 7); g.fill();
        g.fillStyle = this.o.skin; g.fillRect(x - 18, ey - 16, 36, eyes === 'calm' ? 13 : 9);
        g.lineWidth = 3.5; g.beginPath(); g.moveTo(x - 16, ey + (eyes === 'calm' ? -3 : -7)); g.lineTo(x + 16, ey + (eyes === 'calm' ? -3 : -7)); g.stroke();
      } else if (eyes === 'tiny') { g.fillStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.ellipse(x, ey - 6, 24, 29, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(x + lx * 0.5, ey - 6 + ly * 0.5, 4.5, 0, 7); g.fill(); }
      else if (eyes === 'wide') { g.fillStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.ellipse(x, ey - 4, 21, 25, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(x + lx, ey - 4 + ly, 7, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + lx - 2.5, ey - 6.5 + ly, 2.2, 0, 7); g.fill(); }
      else if (eyes === 'closed') { g.lineWidth = 4.5; g.beginPath(); g.arc(x, ey - 4, 13, Math.PI * 0.15, Math.PI * 0.85); g.stroke(); }
      else if (eyes === 'squeeze') { g.lineWidth = 6.5; g.beginPath(); const d = s > 0 ? -1 : 1; g.moveTo(x - 13 * d, ey - 16); g.lineTo(x + 11 * d, ey - 4); g.lineTo(x - 13 * d, ey + 8); g.stroke(); }
      else if (eyes === 'happy') { g.lineWidth = 4.5; g.beginPath(); g.arc(x, ey + 8, 13, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
      else if (eyes === 'sleepy') { g.beginPath(); g.ellipse(x + lx, ey + 5, 13, 5, 0, 0, Math.PI); g.fill(); g.lineWidth = 4; g.beginPath(); g.moveTo(x - 16, ey + 4); g.lineTo(x + 16, ey + 4); g.stroke(); }
      const bs = s < 0 ? f.browL : f.browR;
      if (bs !== undefined) { const b = bs; const by = ey - 32 - Math.max(0, b) * 10; g.lineWidth = 8.5; g.beginPath(); g.moveTo(x - s * 15, by + (b < 0 ? -b * 9 : -b * 2)); g.quadraticCurveTo(x, by - 4 - Math.max(0, b) * 3, x + s * 15, by + (b < 0 ? b * 3 : b * 6)); g.stroke(); }
      else if (f.sly) { g.lineWidth = 7; g.beginPath(); g.moveTo(x - s * 4 + s * 22, ey - 40); g.lineTo(x - s * 20, ey - 26); g.stroke(); }
      else if (!brow) { const by = ey - (eyes === 'wide' ? 46 : 36); g.lineWidth = 8.5; g.beginPath(); g.moveTo(x - s * 13, by + 3); g.quadraticCurveTo(x, by - 6, x + s * 15, by + 2); g.stroke(); }
      else if (brow) { const by = ey - (eyes === 'wide' || eyes === 'tiny' ? 48 : 30) - Math.max(0, brow) * 8; g.lineWidth = 8.5; g.beginPath(); g.moveTo(x - s * 15, by + (brow < 0 ? -brow * 9 : -brow * 3)); g.lineTo(x + s * 15, by + (brow < 0 ? brow * 3 : brow * 5)); g.stroke(); }
    g.restore(); }
    if (this.o.beard) { g.fillStyle = this.o.beard; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(-r * 0.72, r * 0.38); g.quadraticCurveTo(-r * 0.62, r * 1.12, 0, r * 1.16); g.quadraticCurveTo(r * 0.62, r * 1.12, r * 0.72, r * 0.38); g.quadraticCurveTo(r * 0.4, r * 0.86, 0, r * 0.84); g.quadraticCurveTo(-r * 0.4, r * 0.86, -r * 0.72, r * 0.38); g.closePath(); g.fill(); g.stroke(); }
    if (this.o.glasses) { g.strokeStyle = INK; g.lineWidth = 4.5; g.fillStyle = 'rgba(200,230,255,0.25)'; for (const s of [-1, 1]) { g.beginPath(); if (this.o.glasses === 'square') g.rect(s * 40 - 22, -18, 44, 34); else g.arc(s * 40, -2, 24, 0, 7); g.fill(); g.stroke(); } g.beginPath(); g.moveTo(-16, -6); g.quadraticCurveTo(0, -14, 16, -6); g.stroke(); }
    if (this.o.mustache) { g.fillStyle = this.o.hair || '#4a2f20'; g.strokeStyle = INK; g.lineWidth = 2.5; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 15, 40, 18, 7, s * 0.25, 0, 7); g.fill(); g.stroke(); } }
    g.translate((this._tu || 0) * 14, 0);
    g.strokeStyle = INK; g.fillStyle = '#5a1e1a'; g.lineWidth = 3.5; const my = 52; const mk = ['laugh', 'scream', 'talk', 'psycho', 'grin'].includes(mouth) ? 1 + 0.08 * Math.sin((Flat2D.T || 0) * 17 + this.o.seed) : 1; g.save(); g.translate(0, my); g.scale(1 + (mk - 1) * 0.4, mk); g.translate(0, -my);
    if (mouth === 'smile') { g.beginPath(); g.arc(0, my - 12, 10, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); }
    else if (mouth === 'psycho') {   // reference grin: wide flat crescent, clenched upper + lower teeth
      const P = () => { g.beginPath(); g.moveTo(-72, my - 10); g.quadraticCurveTo(0, my + 8, 72, my - 10); g.quadraticCurveTo(52, my + 44, 0, my + 46); g.quadraticCurveTo(-52, my + 44, -72, my - 10); g.closePath(); };
      P(); g.fillStyle = '#24140f'; g.fill(); g.save(); P(); g.clip(); g.fillStyle = '#fffdf6'; g.beginPath(); g.moveTo(-80, my - 14); g.quadraticCurveTo(0, my + 6, 80, my - 14); g.lineTo(80, my + 2); g.quadraticCurveTo(0, my + 26, -80, my + 2); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(-60, my + 52); g.quadraticCurveTo(0, my + 30, 60, my + 52); g.lineTo(60, my + 60); g.lineTo(-60, my + 60); g.closePath(); g.fill();
      g.strokeStyle = '#24140f'; g.lineWidth = 3; for (let k = -5; k <= 5; k++) { g.beginPath(); g.moveTo(k * 12, my - 8); g.lineTo(k * 12, my + 22); g.stroke(); g.beginPath(); g.moveTo(k * 12 + 6, my + 32); g.lineTo(k * 12 + 6, my + 50); g.stroke(); } g.restore();
      g.strokeStyle = INK; g.lineWidth = 6; P(); g.stroke(); }
    else if (mouth === 'grin' || mouth === 'teeth') {   // big toothy grin
      g.beginPath(); g.moveTo(-58, my - 16); g.quadraticCurveTo(0, my - 2, 58, my - 16); g.quadraticCurveTo(48, my + 34, 0, my + 36); g.quadraticCurveTo(-48, my + 34, -58, my - 16); g.closePath(); g.fillStyle = '#3a1210'; g.fill();
      g.save(); g.clip(); g.fillStyle = '#fffdf6'; g.fillRect(-60, my - 22, 120, 26); g.strokeStyle = INK; g.lineWidth = 2; for (let k = -4; k <= 4; k++) { g.beginPath(); g.moveTo(k * 12, my - 14); g.lineTo(k * 12, my + 4); g.stroke(); } g.fillStyle = '#e07a7a'; g.beginPath(); g.ellipse(0, my + 30, 20, 9, 0, 0, 7); g.fill(); g.restore();
      g.strokeStyle = INK; g.lineWidth = 4.5; g.beginPath(); g.moveTo(-58, my - 16); g.quadraticCurveTo(0, my - 2, 58, my - 16); g.quadraticCurveTo(48, my + 34, 0, my + 36); g.quadraticCurveTo(-48, my + 34, -58, my - 16); g.closePath(); g.stroke(); }
    else if (mouth === 'smirk1') { g.lineWidth = 4; g.beginPath(); g.moveTo(-12, my - 2); g.quadraticCurveTo(8, my + 4, 20, my - 10); g.stroke(); g.beginPath(); g.moveTo(17, my - 13); g.lineTo(23, my - 7); g.stroke(); }
    else if (mouth === 'line') { g.lineWidth = 4; g.beginPath(); g.moveTo(-11, my + 1); g.lineTo(11, my - 1); g.stroke(); }
    else if (mouth === 'smallO') { g.fillStyle = '#3a1210'; g.lineWidth = 5; g.beginPath(); g.ellipse(0, my + 6, 18, 22, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#e26a6a'; g.beginPath(); g.ellipse(0, my + 18, 10, 6, 0, 0, 7); g.fill(); }
    else if (mouth === 'laugh') { g.beginPath(); g.moveTo(-40, my - 10); g.quadraticCurveTo(0, my - 2, 40, my - 10); g.quadraticCurveTo(36, my + 46, 0, my + 48); g.quadraticCurveTo(-36, my + 46, -40, my - 10); g.closePath(); g.fillStyle = '#3a1210'; g.fill(); g.save(); g.clip(); g.fillStyle = '#fffdf6'; g.fillRect(-44, my - 16, 88, 16); g.fillStyle = '#e07a7a'; g.beginPath(); g.ellipse(0, my + 40, 22, 12, 0, 0, 7); g.fill(); g.restore(); g.strokeStyle = INK; g.lineWidth = 4; g.stroke(); }
    else if (mouth === 'teeth') { g.fillStyle = '#fffdf6'; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.roundRect(-36, my - 8, 72, 30, 8); g.fill(); g.stroke(); g.lineWidth = 2; g.beginPath(); g.moveTo(-36, my + 7); g.lineTo(36, my + 7); for (let k = -2; k <= 2; k++) { g.moveTo(k * 12, my - 8); g.lineTo(k * 12, my + 22); } g.stroke(); }
    else if (mouth === 'wobble') { g.lineWidth = 4.5; g.beginPath(); for (let k = 0; k <= 12; k++) { const x = -26 + k * 52 / 12; const y = my + 6 + Math.sin(k * 1.6 + (Flat2D.T || 0) * 30) * 4; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    else if (mouth === 'smirk') {
      g.beginPath(); g.moveTo(-30, my - 2); g.quadraticCurveTo(10, my + 14, 40, my - 16); g.quadraticCurveTo(20, my + 26, -30, my - 2); g.closePath(); g.fillStyle = '#3a1210'; g.fill(); g.save(); g.clip(); g.fillStyle = '#fffdf6'; g.fillRect(-30, my - 18, 72, 16); g.restore(); g.strokeStyle = INK; g.lineWidth = 4; g.stroke(); }
    else if (mouth === 'bigsmile') { g.lineWidth = 4.5; g.beginPath(); g.arc(0, my - 22, 30, Math.PI * 0.18, Math.PI * 0.82); g.stroke(); }
    else if (mouth === 'o') { g.beginPath(); g.ellipse(0, my + 2, 9, 12, 0, 0, 7); g.fill(); g.stroke(); }
    else if (mouth === 'scream') { g.beginPath(); g.ellipse(0, my + 12, 26, 34, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#e07070'; g.beginPath(); g.ellipse(0, my + 22, 10, 6, 0, 0, 7); g.fill(); }
    else if (mouth === 'frown') { g.beginPath(); g.arc(0, my + 12, 12, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); }
    else if (mouth === 'flat') { g.beginPath(); g.moveTo(-10, my); g.lineTo(10, my); g.stroke(); }
    else if (mouth === 'talk') { const P = () => { g.beginPath(); g.moveTo(-46, my - 8); g.quadraticCurveTo(0, my - 2, 46, my - 8); g.quadraticCurveTo(36, my + 40, 0, my + 42); g.quadraticCurveTo(-36, my + 40, -46, my - 8); g.closePath(); };
      P(); g.fillStyle = '#3a1210'; g.fill(); g.save(); P(); g.clip(); g.fillStyle = '#fffdf6'; g.fillRect(-50, my - 14, 100, 16); g.fillStyle = '#e26a6a'; g.beginPath(); g.ellipse(0, my + 38, 26, 14, 0, 0, 7); g.fill(); g.restore(); g.strokeStyle = INK; g.lineWidth = 5; P(); g.stroke(); }
    else if (mouth === 'yawn') { g.beginPath(); g.ellipse(0, my + 8, 13, 20, 0, 0, 7); g.fill(); g.stroke(); }
    g.restore();
    { const cw = { psycho: 76, grin: 62, laugh: 44, talk: 50, bigsmile: 34, smile: 18 }[mouth]; if (cw) { g.strokeStyle = 'rgba(42,24,16,0.55)'; g.lineWidth = 3.5; g.lineCap = 'round'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * (cw + 4), my - 22); g.quadraticCurveTo(s * (cw + 12), my - 10, s * (cw + 6), my + 2); g.stroke(); } } }
  }
  hat(g, r, off) {
    const o = this.o; if (!o.hat) return; g.save(); g.translate(0, -off); const hk = r / 116; g.scale(hk, hk); r = 116; g.strokeStyle = INK; g.lineWidth = 4.5; g.fillStyle = o.hatCol;   // hats scale with the (bigger) head
    const hl = (x, y, w, h) => { g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x, y, w, h); g.fillStyle = o.hatCol; };
    if (o.hat === 'crown') {   // gold crown with five points and jewels
      const gold = o.hatCol || '#f2c63a'; g.fillStyle = gold; g.beginPath(); g.moveTo(-r * 0.78, -r * 0.62); for (let i = 0; i <= 8; i++) { const x = -r * 0.78 + (i / 8) * r * 1.56, up = i % 2 === 0; g.lineTo(x, up ? -r * 1.32 : -r * 1.0); } g.lineTo(r * 0.78, -r * 0.62); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-r * 0.7, -r * 0.78, r * 1.4, 10); g.fillStyle = shade(gold, 0.75); g.fillRect(-r * 0.78, -r * 0.7, r * 1.56, 16); g.strokeRect(-r * 0.78, -r * 0.7, r * 1.56, 16);
      for (const [x, c] of [[-0.5, '#d8283a'], [0, '#2a8ad8'], [0.5, '#2ab86a']]) { g.fillStyle = c; g.beginPath(); g.arc(x * r, -r * 0.92, 11, 0, 7); g.fill(); g.stroke(); } for (let i = 0; i <= 4; i++) { g.fillStyle = '#fff6d0'; g.beginPath(); g.arc(-r * 0.78 + (i / 4) * r * 1.56, -r * 1.33, 7, 0, 7); g.fill(); g.stroke(); }
    } else if (o.hat === 'helm') {   // round steel soldier helmet with nose guard and a crest stripe
      const st = o.hatCol || '#9aa0a8'; g.fillStyle = st; g.beginPath(); g.moveTo(-r * 1.02, -r * 0.42); g.bezierCurveTo(-r * 1.1, -r * 1.42, r * 1.1, -r * 1.42, r * 1.02, -r * 0.42); g.closePath(); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.ellipse(-r * 0.4, -r * 0.98, r * 0.22, r * 0.1, -0.5, 0, 7); g.fill();
      g.fillStyle = shade(st, 0.7); g.fillRect(-r * 1.04, -r * 0.5, r * 2.08, 16); g.strokeRect(-r * 1.04, -r * 0.5, r * 2.08, 16); g.fillRect(-8, -r * 0.5, 16, r * 0.5); g.strokeRect(-8, -r * 0.5, 16, r * 0.5);
      if (o.band) { g.fillStyle = o.band; g.beginPath(); g.moveTo(-10, -r * 1.2); g.quadraticCurveTo(0, -r * 1.5, 10, -r * 1.2); g.lineTo(10, -r * 0.55); g.lineTo(-10, -r * 0.55); g.closePath(); g.fill(); g.stroke(); }
    } else if (o.hat === 'turban') {   // royal turban with a jewel and feather
      const tc = o.hatCol || '#f4f0e6'; g.fillStyle = tc; g.beginPath(); g.ellipse(0, -r * 0.88, r * 1.02, r * 0.5, 0, 0, 7); g.fill(); g.stroke(); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 4; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(-r * 0.95, -r * 0.8 + k * 12); g.quadraticCurveTo(0, -r * 1.2 + k * 14, r * 0.95, -r * 0.9 + k * 12); g.stroke(); } g.strokeStyle = INK; g.lineWidth = 4.5;
      g.fillStyle = o.band || '#d8283a'; g.beginPath(); g.arc(0, -r * 1.0, 16, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#f4f4f4'; g.beginPath(); g.moveTo(0, -r * 1.05); g.quadraticCurveTo(30, -r * 1.6, 8, -r * 1.75); g.quadraticCurveTo(0, -r * 1.4, 0, -r * 1.05); g.fill(); g.stroke();
    } else if (o.hat === 'top') {
      g.beginPath(); g.moveTo(-50, -r * 0.78); g.lineTo(-56, -r - 104); g.lineTo(56, -r - 104); g.lineTo(50, -r * 0.78); g.closePath(); g.fill(); g.stroke(); hl(-46, -r - 96, 16, 80);
      g.fillStyle = o.band; g.fillRect(-52, -r * 0.78 - 26, 104, 18); g.strokeRect(-52, -r * 0.78 - 26, 104, 18);
      g.fillStyle = o.hatCol; g.beginPath(); g.ellipse(0, -r * 0.78, 84, 13, 0, 0, 7); g.fill(); g.stroke();
    } else if (o.hat === 'fedora') {   // pinched crown, band, wide curved brim
      g.beginPath(); g.moveTo(-60, -r * 0.8); g.bezierCurveTo(-70, -r - 46, -36, -r - 74, 0, -r - 50); g.bezierCurveTo(36, -r - 74, 70, -r - 46, 60, -r * 0.8); g.closePath(); g.fill(); g.stroke(); hl(-44, -r - 40, 12, 40);
      g.beginPath(); g.moveTo(-14, -r - 56); g.quadraticCurveTo(0, -r - 30, 14, -r - 56); g.stroke();
      g.fillStyle = o.band; g.fillRect(-61, -r * 0.8 - 22, 122, 18); g.strokeRect(-61, -r * 0.8 - 22, 122, 18);
      g.fillStyle = o.hatCol; g.beginPath(); g.moveTo(-122, -r * 0.8 + 6); g.quadraticCurveTo(-100, -r * 0.8 - 22, 0, -r * 0.8 - 16); g.quadraticCurveTo(100, -r * 0.8 - 22, 122, -r * 0.8 + 6); g.quadraticCurveTo(60, -r * 0.8 + 14, 0, -r * 0.8 + 10); g.quadraticCurveTo(-60, -r * 0.8 + 14, -122, -r * 0.8 + 6); g.closePath(); g.fill(); g.stroke();
    } else if (o.hat === 'bowler' || o.hat === 'derby') {
      g.beginPath(); g.moveTo(-58, -r * 0.8); g.bezierCurveTo(-62, -r - 78, 62, -r - 78, 58, -r * 0.8); g.closePath(); g.fill(); g.stroke(); hl(-40, -r - 30, 14, 40);
      g.fillStyle = o.band; g.fillRect(-58, -r * 0.8 - 18, 116, 14); g.strokeRect(-58, -r * 0.8 - 18, 116, 14);
      g.fillStyle = o.hatCol; g.beginPath(); g.ellipse(0, -r * 0.8, 92, 13, 0, 0, 7); g.fill(); g.stroke();
    } else if (o.hat === 'flat') {    // flat-top hat with wide brim (brown, like the reference)
      g.beginPath(); g.roundRect(-62, -r - 50, 124, 64, 6); g.fill(); g.stroke(); hl(-56, -r - 44, 14, 50);
      g.fillStyle = shade(o.hatCol, 0.75); g.fillRect(-62, -r + 0, 124, 12);
      g.fillStyle = o.hatCol; g.beginPath(); g.ellipse(0, -r + 16, 112, 15, 0, 0, 7); g.fill(); g.stroke();
    } else if (o.hat === 'engineer') {   // striped railway cap
      g.save(); g.beginPath(); g.moveTo(-r * 1.04, -r * 0.42); g.bezierCurveTo(-r * 1.12, -r * 1.36, r * 1.12, -r * 1.36, r * 1.04, -r * 0.42); g.closePath(); g.fillStyle = o.hatCol || '#3a5a9a'; g.fill(); g.clip();
      g.strokeStyle = o.band || '#f4f0e6'; g.lineWidth = 9; for (let k = -6; k <= 6; k++) { g.beginPath(); g.moveTo(k * r * 0.17, -r * 1.3); g.quadraticCurveTo(k * r * 0.2, -r * 0.8, k * r * 0.22, -r * 0.4); g.stroke(); } g.restore();
      g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.moveTo(-r * 1.04, -r * 0.42); g.bezierCurveTo(-r * 1.12, -r * 1.36, r * 1.12, -r * 1.36, r * 1.04, -r * 0.42); g.closePath(); g.stroke();
      g.fillStyle = shade(o.hatCol || '#3a5a9a', 0.7); g.beginPath(); g.ellipse(-r * 0.62, -r * 0.42, r * 0.55, 13, -0.08, 0, Math.PI); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, -r * 1.12, 8, 0, 7); g.fill(); g.stroke();
    } else if (o.hat === 'ball') {    // baseball cap
      g.beginPath(); g.moveTo(-r * 1.02, -r * 0.35); g.bezierCurveTo(-r * 1.05, -r * 1.3, r * 1.05, -r * 1.3, r * 1.02, -r * 0.35); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 2.5; for (const a of [-0.45, 0, 0.45]) { g.beginPath(); g.moveTo(0, -r * 1.05); g.quadraticCurveTo(a * r * 0.9, -r * 0.8, a * r * 1.6, -r * 0.38); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.ellipse(-r * 0.45, -r * 0.85, 18, 9, -0.5, 0, 7); g.fill();
      g.save(); g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 2.6; g.setLineDash([8, 6]); for (const a of [-0.45, 0.45]) { g.beginPath(); g.moveTo(a * 0.12 * r, -r * 1.0); g.quadraticCurveTo(a * r * 0.95, -r * 0.78, a * r * 1.55, -r * 0.44); g.stroke(); } g.beginPath(); g.moveTo(-r * 0.95, -r * 0.46); g.quadraticCurveTo(0, -r * 0.56, r * 0.95, -r * 0.46); g.stroke(); g.restore();
      g.strokeStyle = INK; g.lineWidth = 4.5; g.fillStyle = shade(o.hatCol, 0.8); g.beginPath(); g.moveTo(-r * 1.02, -r * 0.36); g.quadraticCurveTo(-r * 1.4, -r * 0.32, -r * 1.42, -r * 0.18); g.quadraticCurveTo(-r * 1.1, -r * 0.16, -r * 0.6, -r * 0.3); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = o.band; g.beginPath(); g.arc(0, -r * 1.06, 9, 0, 7); g.fill(); g.stroke();
    } else if (o.hat === 'cap') {     // newsboy cap
      g.beginPath(); g.ellipse(0, -r * 0.62, r * 1.02, r * 0.5, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2.5; for (const a of [-0.5, 0, 0.5]) { g.beginPath(); g.moveTo(0, -r * 1.1); g.lineTo(a * r * 1.4, -r * 0.62); g.stroke(); }
      g.strokeStyle = INK; g.lineWidth = 4.5; g.fillStyle = shade(o.hatCol, 0.8); g.beginPath(); g.ellipse(r * 0.3, -r * 0.6, r * 0.75, 13, 0.06, 0, Math.PI); g.fill(); g.stroke();
    } else if (o.hat === 'cowboy') {
      g.beginPath(); g.moveTo(-136, -r * 0.82); g.quadraticCurveTo(0, -r * 0.6, 136, -r * 0.82); g.quadraticCurveTo(120, -r - 10, 66, -r * 0.92); g.lineTo(-66, -r * 0.92); g.quadraticCurveTo(-120, -r - 10, -136, -r * 0.82); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-62, -r * 0.9); g.bezierCurveTo(-70, -r - 92, -14, -r - 78, 0, -r - 62); g.bezierCurveTo(14, -r - 78, 70, -r - 92, 62, -r * 0.9); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = o.band; g.fillRect(-62, -r * 0.9 - 20, 124, 14); g.strokeRect(-62, -r * 0.9 - 20, 124, 14);
    } else if (o.hat === 'hardhat') {
      g.beginPath(); g.moveTo(-r * 0.98, -r * 0.42); g.bezierCurveTo(-r * 1.0, -r * 1.32, r * 1.0, -r * 1.32, r * 0.98, -r * 0.42); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.roundRect(-r * 1.15, -r * 0.48, r * 2.3, 16, 6); g.fill(); g.stroke(); g.beginPath(); g.roundRect(-14, -r * 1.12, 28, r * 0.66, 10); g.fill(); g.stroke(); hl(-r * 0.6, -r * 0.95, 14, 40);
    } else if (o.hat === 'chef') {
      g.fillStyle = '#fff'; for (const [x, y, rr] of [[-50, -r - 40, 46], [0, -r - 62, 52], [50, -r - 40, 46]]) { g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); g.stroke(); }
      g.beginPath(); g.rect(-r * 0.78, -r - 30, r * 1.56, 52); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillRect(-r * 0.76, -r - 34, r * 1.52, 20);
    } else if (o.hat === 'police') {
      g.beginPath(); g.moveTo(-r * 0.95, -r * 0.6); g.lineTo(-r * 1.05, -r * 1.05); g.quadraticCurveTo(0, -r * 1.35, r * 1.05, -r * 1.05); g.lineTo(r * 0.95, -r * 0.6); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#1a1a1a'; g.beginPath(); g.ellipse(0, -r * 0.56, r * 0.95, 16, 0, 0, Math.PI); g.fill(); g.stroke(); g.fillStyle = '#f2c63a'; g.beginPath(); g.arc(0, -r * 0.9, 14, 0, 7); g.fill(); g.stroke();
    } else if (o.hat === 'beret') {
      g.beginPath(); g.ellipse(-12, -r * 0.82, r * 1.0, r * 0.34, -0.12, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-6, -r * 1.14); g.lineTo(0, -r * 1.28); g.stroke();
    } else if (o.hat === 'scarf') {      // head scarf (grandma)
      g.beginPath(); g.moveTo(-r * 1.04, r * 0.2); g.bezierCurveTo(-r * 1.2, -r * 1.35, r * 1.2, -r * 1.35, r * 1.04, r * 0.2); g.quadraticCurveTo(r * 0.7, -r * 0.45, 0, -r * 0.5); g.quadraticCurveTo(-r * 0.7, -r * 0.45, -r * 1.04, r * 0.2); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(-r * 0.7 + i * r * 0.23, -r * 0.8 + (i % 2) * 20, 6, 0, 7); g.fill(); }
    } else if (o.hat === 'aviator') {
      g.beginPath(); g.moveTo(-r * 1.02, r * 0.1); g.bezierCurveTo(-r * 1.12, -r * 1.3, r * 1.12, -r * 1.3, r * 1.02, r * 0.1); g.lineTo(r * 0.8, r * 0.1); g.quadraticCurveTo(r * 0.6, -r * 0.5, 0, -r * 0.52); g.quadraticCurveTo(-r * 0.6, -r * 0.5, -r * 0.8, r * 0.1); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#9fd6ff'; g.strokeStyle = INK; g.lineWidth = 5; for (const s of [-1, 1]) { g.beginPath(); g.arc(s * 36, -r * 0.62, 24, 0, 7); g.fill(); g.stroke(); } g.fillStyle = '#6a4630'; g.fillRect(-r, -r * 0.66, 2 * r * 0.4 - 10, 10);
    } else if (o.hat === 'sailor') {
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-r * 0.85, -r * 0.62); g.bezierCurveTo(-r * 0.9, -r * 1.25, r * 0.9, -r * 1.25, r * 0.85, -r * 0.62); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.ellipse(0, -r * 0.62, r * 0.98, 14, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = o.band; g.fillRect(-r * 0.8, -r * 0.8, r * 1.6, 10);
    } else if (o.hat === 'nightcap') {
      g.beginPath(); g.moveTo(-r * 0.98, -r * 0.42); g.quadraticCurveTo(-20, -r - 110, 140, -r - 30); g.lineTo(r * 0.98, -r * 0.42); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(146, -r - 26, 17, 0, 7); g.fill(); g.stroke();
      g.fillStyle = o.band; g.beginPath(); g.ellipse(0, -r * 0.45, r * 1.0, 18, 0, 0, 7); g.fill(); g.stroke();
    } else if (o.hat === 'bonnet') {
      g.beginPath(); g.ellipse(0, -r * 0.3, r * 1.12, r * 0.85, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = o.band; g.beginPath(); g.ellipse(0, -r * 0.3, r * 1.0, 13, 0, 0, 7); g.fill(); g.stroke();
    }
    g.restore();
  }
}
