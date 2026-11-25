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
let SHT = null;
// expression presets (use by name: face:'shock')
export const FACES = {
  neutral: { eyes: 'dot', mouth: 'smirk1' }, calm: { eyes: 'lid', lid: 0.5, mouth: 'smirk1' },
  happy: { eyes: 'dot', mouth: 'bigsmile' }, grin: { eyes: 'dot', mouth: 'grin' }, laugh: { eyes: 'happy', mouth: 'laugh', brow: 0.5 },
  proud: { eyes: 'lid', lid: 0.6, mouth: 'smirk1', browL: 0.5, browR: 0.1 }, smug: { eyes: 'lid', lid: 0.58, look: [0.8, 0], mouth: 'smirk1', browL: 0.9, browR: -0.3 },
  sideeye: { eyes: 'lid', lid: 0.55, look: [1, 0], mouth: 'line', browL: -0.5, browR: 0.6 }, evil: { eyes: 'lid', lid: 0.6, lidTilt: -0.3, mouth: 'grin', brow: -1.0 },
  angry: { eyes: 'lid', lid: 0.45, lidTilt: -0.4, mouth: 'talk', brow: -1.5 }, grumpy: { eyes: 'lid', lid: 0.55, lidTilt: -0.3, mouth: 'frown', brow: -1.2 },
  shock: { eyes: 'tiny', mouth: 'scream', brow: 1.5 }, scared: { eyes: 'wide', mouth: 'wobble', brow: 1.3 }, panic: { eyes: 'tiny', mouth: 'wobble', brow: 1.6 },
  confused: { eyes: 'lid', lid: 0.3, mouth: 'line', browL: 1.1, browR: -0.6 }, worried: { eyes: 'lid', lid: 0.3, lidTilt: 0.3, mouth: 'wobble', brow: 1.0 },
  idea: { eyes: 'wide', mouth: 'grin', brow: 1.2 }, awe: { eyes: 'wide', mouth: 'smallO', brow: 1.2 }, sleepy: { eyes: 'sleepy', mouth: 'line' }, deadpan: { eyes: 'lid', lid: 0.62, mouth: 'line' },
};
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };
// hand-drawn wobble: deterministic per character (no shimmer), tiny amplitude
const wob = (seed, i, a = 1.6) => Math.sin(i * 1.7 + seed * 3.1) * a + Math.sin(i * 4.3 + seed) * a * 0.5;

export class Flat2D {
  constructor(o = {}) {
    this.o = { coat: '#3b5ba8', tie: '#e0b03a', badge: '#f0b43a', collar: '#fbf6ec', hat: 'top', hatCol: '#3a2620', band: '#a02a24', skin: '#fdfaf2',
      hair: '#2a1d16', hairStyle: 'bangs', bust: false, size: 1.85, res: 2.0, front: 0, mustache: false, seed: 1, ...o };
    const S = this.S = this.o.res; this.cw = Math.round(512 * S); this.ch = Math.round((this.o.bust ? 512 : 1024) * S);
    this.cv = document.createElement('canvas'); this.cv.width = this.cw; this.cv.height = this.ch; this.g = this.cv.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.NoColorSpace; this.tex.anisotropy = 8;
    this.tex.generateMipmaps = true; this.tex.minFilter = THREE.LinearMipmapLinearFilter;
    const h = this.o.size * (this.o.bust ? 0.5 : 1), w = this.o.bust ? h : h * 0.5;
    const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h / 2, 0);
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
  // ALIVE layer (always on): blinks, eye darts, breathing, tiny head motion. Flat2D.T = current time (set once per frame).
  alive(p) {
    const t = Flat2D.T ?? 0, sd = this.o.seed * 1.37; const f = typeof p.face === 'string' ? { ...(FACES[p.face] || FACES.neutral) } : p.face ? { ...p.face } : { ...FACES.neutral };
    const per = 2.4 + (sd % 1.3), ph = (t + sd) % per; if (ph < 0.11 && ['dot', 'calm', 'sly', 'lid', undefined].includes(f.eyes) && !p.noBlink) f.eyes = 'closed';
    if (!f.look) { const k = Math.floor((t + sd) / 0.9); f.look = [Math.sin(k * 12.9898 + sd) * 0.5, Math.sin(k * 78.233 + sd) * 0.3]; }
    if (p.talk) f.mouth = ['talk', 'smallO', 'line', 'talk', 'smallO', 'smirk1'][Math.floor((t + sd) * 12) % 6];   // lip sync ONLY while this character speaks
    // ALIVE v3 (reference style): calm, held poses; the head LOOKS somewhere and holds, then snaps to a new look; accents only on stressed words
    const E = (Flat2D.E || 0) * (p.e ?? 0.6), ON = Math.min(1, (Flat2D.ON || 0) * 6) * (p.e ?? 0.6);
    if (f.brow === undefined && f.browL === undefined && ON > 0.25) f.brow = Math.min(1.1, ON);
    const slot = Math.floor((t + sd * 3) / 1.9), u = ((t + sd * 3) % 1.9) / 1.9; const look = (k) => [-0.55, 0.45, -0.25, 0.6, 0.15, -0.5][Math.abs(Math.floor(k * 7 + sd * 13)) % 6];
    const turn = p.turn ?? (look(slot - 1) + (look(slot) - look(slot - 1)) * Math.min(1, u * 9) ** 2 * (3 - 2 * Math.min(1, u * 9)));
    if (!f.look) f.look = [turn * 0.8, 0];
    const rest = this.o.rest || ['hip', 'pockets', 'hang', 'behind'][Math.floor(sd * 10) % 4];
    const RA = { hip: [[12, 18], [40, -125]], pockets: [[16, -32], [16, -32]], hang: [[8, 14], [10, 16]], behind: [[-12, -20], [-12, -20]] }[rest];
    const breathe = Math.sin(t * 2.4 + sd);
    return { ...p, face: f, turn, armL: p.armL || [RA[0][0] + breathe, RA[0][1]], armR: p.armR || [RA[1][0] + breathe, RA[1][1]], hip: p.hip ?? (sd % 2 > 1 ? 14 : -14),
      bob: (p.bob || 0) + 2.2 * breathe - ON * 10, hop: (p.hop || 0), tilt: (p.tilt || 0) + 3 * Math.sin(t * 0.8 + sd) + ON * 9 * (sd % 2 > 1 ? 1 : -1) + E * 2 * Math.sin(t * 5 + sd),
      squash: (p.squash || 0) + Math.min(0.06, ON * 0.08), lean: (p.lean || 0) + 1.5 * Math.sin(t * 0.7 + sd), hatOff: (p.hatOff || 0) + ON * 8 };
  }
  headWorld() { return this.pos.clone().add(new THREE.Vector3(0, this.h * (this.o.bust ? 0.5 : 0.68), 0)); }
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
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.cw, this.ch); g.setTransform(S, 0, 0, S, 0, 0);
    if (o.bust) { g.translate(256, 290); g.scale(1.05, 1.05); g.translate(-256, -330); }
    const flip = p.flip ? -1 : 1; g.translate(256, 0); g.scale(flip, 1); g.translate(-256, 0);
    g.lineJoin = 'round'; g.lineCap = 'round';
    const kn = p.kneel || 0, drop = 175 * kn; const bob = (p.bob || 0) - (p.hop || 0) + drop, sq = p.squash || 0, lean = p.lean || 0;
    const hipY = 640 + ((p.bob || 0) - (p.hop || 0)) * 0.7 + drop;
    if (p.lines) this.speedLines(g, p.lines);
    // ---- legs: long thin lines, tiny dark feet ----
    if (!o.bust) { const ph = p.walk || 0, amp = p.amp ?? 0;
      for (const s of [-1, 1]) {
        const sw = Math.sin(ph + (s > 0 ? 0 : Math.PI)); let a = R(amp * sw + (p.legOut || 0) * s); const hx = 256 + s * 20 + (p.hip || 0) * 0.5, L1 = 180, L2 = 170;
        const hipS = p.hip || 0, free = hipS !== 0 && Math.sign(hipS) !== s;   // contrapposto: weight on one leg, the other knee bends
        if (!amp && !kn) a += R(s * (free ? 9 : 3));   // feet a little apart, the free leg a bit wider
        if (kn) a = s > 0 ? R(-62 * kn) : R(8 * kn);   // kneel: front thigh forward, back knee on the ground
        const knee = [hx + Math.sin(a) * L1, hipY + Math.cos(a) * L1]; let kb = a + R(Math.max(0, Math.cos(ph + (s > 0 ? 0 : Math.PI))) * amp * 1.2); if (kn) kb = s > 0 ? R(0) : R(88 * kn); else if (!amp) kb = a - R(s * (free ? 7 : 2)) + R(free ? 12 : 3);   // shin swings BACK (character faces left by default)
        const foot = [knee[0] + Math.sin(kb) * L2, Math.min(992, knee[1] + Math.cos(kb) * L2)];
        g.strokeStyle = INK; g.lineWidth = 7.5; g.beginPath(); g.moveTo(hx, hipY - 10); g.lineTo(knee[0], knee[1]); g.lineTo(foot[0], foot[1]); g.stroke();
        g.fillStyle = INK; g.beginPath(); g.ellipse(foot[0] - 8, foot[1] + 2, 14, 6.5, 0, 0, 7); g.fill();
      } }
    g.save(); g.translate(256 + (p.hip || 0) * 0.6, hipY); g.rotate(R(-lean) + R((p.hip || 0) * 0.08)); g.translate(-256, -hipY);   // +lean = forward; hip shift tilts the torso a little
    const top = 382 + bob + sq * 14, hem = 652 + bob * 0.6;   // reference proportions: head 32% / torso 30% / legs 38%
    { const bw = (o.width || 1) * 1.5; g.save(); g.translate(256, 0); g.scale(bw, 1); g.translate(-256, 0); this.body(g, o, top, hem); this.extras(g, o, top, hem); g.restore(); }
    // ---- arms: thin lines, round dark hands ----
    const arm = (s, a) => {
      const [sa, eb] = a || [22, 6]; const sx = 256 + s * 44 * (o.width || 1) * 1.5, sy = top + 30, L1 = 84, L2 = 78; const a1 = R(sa), a2 = R(sa + eb);
      const el = [sx + s * Math.sin(a1) * L1, sy + Math.cos(a1) * L1], hd = [el[0] + s * Math.sin(a2) * L2, el[1] + Math.cos(a2) * L2];
      g.strokeStyle = INK; g.lineWidth = 6.5; g.beginPath(); g.moveTo(sx, sy); g.lineTo(el[0], el[1]); g.lineTo(hd[0], hd[1]); g.stroke();
      g.fillStyle = '#3a2620'; g.beginPath(); g.arc(hd[0], hd[1], 15, 0, 7); g.fill(); g.lineWidth = 3; g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.arc(hd[0] - 5, hd[1] - 5, 4, 0, 7); g.fill();
      hd.ang = s * (sa + eb); hd.s = s; return hd;
    };
    const HH = p.handHead; const headHand = HH ? [256 + (HH === 'R' ? 1 : -1) * 112, 318 + bob - 40] : null;
    if (HH) { const s = HH === 'R' ? 1 : -1, sx = 256 + s * 44 * (o.width || 1) * 1.5, sy = top + 30; g.strokeStyle = INK; g.lineWidth = 6.5; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + s * 90, sy - 40); g.lineTo(headHand[0] + s * 10, headHand[1] + 10); g.stroke(); }
    this.handL = HH === 'L' ? null : arm(-1, p.armL); this.handR = HH === 'R' ? null : arm(1, p.armR);
    if (p.prop) { const hd = (p.propHand === 'L' ? this.handL : this.handR) || this.handR; if (hd) this.prop(g, p.prop, hd); }
    // ---- head ----
    const r = 116 * (o.head ?? 1.25), hx = 256 + (p.headX || 0), hy = 382 - r + 22 + bob + sq * 22;   // big head like the reference; bottom sits on the collar
    g.save(); g.translate(hx, hy); g.rotate(R(p.tilt || 0)); g.scale(1 + sq * 0.12, 1 - sq * 0.1);
    const headPts = this.ell(0, 0, r, r * 1.0, 56);
    this.wpath(g, headPts); g.fillStyle = o.skin; g.fill();
    g.save(); this.wpath(g, headPts); g.clip();
    if (p.tint) { const [tc, tk] = Array.isArray(p.tint) ? p.tint : [p.tint, 0.7]; g.globalAlpha = tk; g.fillStyle = tc; g.fillRect(-r * 2, -r * 2, r * 4, r * 4); g.globalAlpha = 1; }
    { const sh = g.createRadialGradient(-r * 0.35, -r * 0.45, r * 0.1, r * 0.1, r * 0.15, r * 1.15); sh.addColorStop(0, 'rgba(255,255,255,0.28)'); sh.addColorStop(0.55, 'rgba(255,255,255,0)'); sh.addColorStop(0.85, 'rgba(90,60,50,0.10)'); sh.addColorStop(1, 'rgba(70,40,40,0.28)'); g.fillStyle = sh; g.fillRect(-r * 2, -r * 2, r * 4, r * 4); }   // soft 3D shading + sheen on the head
    if (o.hair && (o.hairStyle === 'bangs' || o.hairStyle === 'cap')) { g.save(); g.translate((p.turn || 0) * 16, 0); this.hair(g, r); g.restore(); }
    g.restore();
    this.outline(g, headPts, 9);
    if (o.hair && o.hairStyle === 'tufts') { g.save(); g.translate((p.turn || 0) * 14, 0); this.tufts(g, r); g.restore(); }
    if (o.hair && ['pompadour', 'side', 'messy', 'pigtails'].includes(o.hairStyle)) this.bigHair(g, r);
    { const tu = clamp(p.turn || 0, -0.8, 0.8); g.save(); const fk = r / 116; g.translate(tu * 44 * fk, 6 * fk); g.scale((1 - 0.22 * Math.abs(tu)) * fk, fk); this.face(g, p.face || {}, 116); g.restore(); }   // facial features scale with the head
    if (p.blush) { g.fillStyle = `rgba(230,60,60,${0.55 * p.blush})`; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 62, 40, 28, 15, 0, 0, 7); g.fill(); } g.strokeStyle = 'rgba(180,30,30,0.6)'; g.lineWidth = 3; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(s * 50 + k * 10 - 10, 32); g.lineTo(s * 50 + k * 10 - 16, 48); g.stroke(); } }
    if (p.tears) { const T = Flat2D.T || 0; g.fillStyle = '#7cc8ff'; g.strokeStyle = INK; g.lineWidth = 2.5; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 40 - 8, 8); g.lineTo(s * 40 + 8, 8); g.lineTo(s * 46, 120); g.lineTo(s * 34, 120); g.closePath(); g.globalAlpha = 0.85; g.fill(); g.globalAlpha = 1; for (let k = 0; k < 2; k++) { const y = 20 + ((T * 140 + k * 50 + (s > 0 ? 25 : 0)) % 110); g.beginPath(); g.arc(s * 42, y, 6, 0, 7); g.fill(); g.stroke(); } } }
    g.save(); g.translate((p.turn || 0) * 12, 0); this.hat(g, r, p.hatOff || 0); g.restore();
    g.restore();
    if (p.steam) this.steam(g, hx, hy, r, p.steam);
    if (headHand) { g.fillStyle = '#3a2620'; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.arc(headHand[0], headHand[1], 16, 0, 7); g.fill(); g.stroke(); }
    g.restore();
    if (p.mark) { g.save(); g.translate(256 + 140, 120 + bob); g.rotate(R(12)); g.font = 'bold 130px serif'; g.textAlign = 'center'; g.lineWidth = 10; g.strokeStyle = INK; g.fillStyle = '#e4332a'; g.strokeText(p.mark, 0, 0); g.fillText(p.mark, 0, 0); g.restore(); }
    if (p.sweat) { g.save(); g.translate(hx - 118, hy - 30 + (p.sweat * 30) % 30); g.fillStyle = '#9fd6ff'; g.strokeStyle = INK; g.lineWidth = 3.5; g.beginPath(); g.moveTo(0, -20); g.quadraticCurveTo(14, 4, 0, 11); g.quadraticCurveTo(-14, 4, 0, -20); g.fill(); g.stroke(); g.restore(); }
  }
  speedLines(g, k) { const T = Flat2D.T || 0; g.save(); g.strokeStyle = 'rgba(40,30,25,0.55)'; g.lineCap = 'round'; for (let i = 0; i < 7; i++) { const y = 300 + i * 80 + Math.sin(i * 3.1) * 20, ph = ((T * 3 + i * 0.37) % 1); g.lineWidth = 5; g.beginPath(); g.moveTo(330 + ph * 40, y); g.lineTo(330 + ph * 40 + 70 * k + 40, y); g.stroke(); } g.restore(); }
  steam(g, hx, hy, r, k) { const T = Flat2D.T || 0; g.save(); g.strokeStyle = INK; g.lineWidth = 4; for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const ph = (T * 1.6 + i * 0.5 + (s > 0 ? 0.25 : 0)) % 1; const x = hx + s * (r * 0.78 + ph * 50), y = hy - r * 0.7 - ph * 110, rr = (22 + ph * 26) * k; g.globalAlpha = 1 - ph * 0.7; g.fillStyle = '#fbfbfb'; for (const [dx, dy, f] of [[0, 0, 1], [rr * 0.7, -rr * 0.3, 0.75], [-rr * 0.6, -rr * 0.2, 0.7]]) { g.beginPath(); g.arc(x + dx, y + dy, rr * f, 0, 7); g.fill(); g.stroke(); } } g.globalAlpha = 1; g.restore(); }
  // props held in the hand, aligned with the forearm
  prop(g, kind, hd) { g.save(); g.translate(hd[0], hd[1]); g.rotate(-R(hd.ang || 0)); g.scale(1.45, 1.45); g.strokeStyle = INK; g.lineWidth = 4; const box = (x, y, w, h, c) => { g.fillStyle = c; g.beginPath(); g.roundRect(x, y, w, h, 4); g.fill(); g.stroke(); };
    if (kind === 'hammer') { box(-6, -10, 12, 120, '#a8743e'); box(-34, 98, 68, 34, '#5a5a62'); }
    else if (kind === 'paddle') { box(-6, -120, 12, 230, '#c8904a'); g.fillStyle = '#c8904a'; g.beginPath(); g.ellipse(0, 130, 24, 56, 0, 0, 7); g.fill(); g.stroke(); }
    else if (kind === 'megaphone') { g.fillStyle = '#e8402a'; g.beginPath(); g.moveTo(-12, 0); g.lineTo(12, 0); g.lineTo(44, 90); g.lineTo(-44, 90); g.closePath(); g.fill(); g.stroke(); box(-8, -20, 16, 24, '#3a3a3a'); }
    else if (kind === 'flag') { box(-4, -160, 8, 200, '#8a5a32'); g.fillStyle = '#e8402a'; g.beginPath(); g.moveTo(4, -160); g.lineTo(96, -136); g.lineTo(4, -108); g.closePath(); g.fill(); g.stroke(); }
    else if (kind === 'bucket') { g.fillStyle = '#9aa4ae'; g.beginPath(); g.moveTo(-34, 20); g.lineTo(34, 20); g.lineTo(26, 80); g.lineTo(-26, 80); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.arc(0, 20, 34, Math.PI, 0); g.stroke(); }
    else if (kind === 'trophy') { g.fillStyle = '#f2c63a'; g.beginPath(); g.moveTo(-30, -70); g.lineTo(30, -70); g.quadraticCurveTo(30, -10, 0, -6); g.quadraticCurveTo(-30, -10, -30, -70); g.fill(); g.stroke(); box(-6, -8, 12, 20, '#f2c63a'); box(-22, 10, 44, 12, '#8a5a32'); }
    else if (kind === 'wrench') { box(-6, -10, 12, 90, '#9aa4ae'); g.fillStyle = '#9aa4ae'; g.beginPath(); g.arc(0, 88, 18, 0, 7); g.fill(); g.stroke(); }
    g.restore(); }
  extras(g, o, top, hem) {
    g.strokeStyle = INK; g.lineWidth = 3.5;
    if (o.apron) { g.fillStyle = o.apron; g.beginPath(); g.moveTo(256 - 40, top + 70); g.lineTo(256 + 40, top + 70); g.lineTo(256 + 56, hem - 8); g.quadraticCurveTo(256, hem + 6, 256 - 56, hem - 8); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(256 - 40, top + 70); g.lineTo(256 - 30, top + 4); g.moveTo(256 + 40, top + 70); g.lineTo(256 + 30, top + 4); g.stroke(); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(256 - 24, top + 110, 48, 34); }
    if (o.scarf) { g.fillStyle = o.scarf; g.beginPath(); g.ellipse(256, top + 6, 54, 16, 0, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(256 + 18, top + 10); g.lineTo(256 + 34, top + 90); g.lineTo(256 + 10, top + 92); g.lineTo(256 + 4, top + 14); g.closePath(); g.fill(); g.stroke(); }
    if (o.belt) { g.fillStyle = o.belt; g.fillRect(256 - 72, top + 140, 144, 14); g.strokeRect(256 - 72, top + 140, 144, 14); g.fillStyle = '#e8c86a'; g.fillRect(256 - 10, top + 138, 20, 18); g.strokeRect(256 - 10, top + 138, 20, 18); }
    if (o.star) { g.fillStyle = '#f2c63a'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 7 : 16; g.lineTo(256 - 34 + Math.cos(a) * rr, top + 62 + Math.sin(a) * rr); } g.closePath(); g.fill(); g.stroke(); }
    if (o.tool === 'wrench') { g.save(); g.translate(256 + 46, top + 60); g.rotate(0.3); g.fillStyle = '#9aa4ae'; g.fillRect(-4, 0, 8, 46); g.beginPath(); g.arc(0, 0, 10, 0, 7); g.fill(); g.stroke(); g.restore(); }
    if (o.pens) { for (let i = 0; i < 3; i++) { g.fillStyle = ['#2a5ad0', '#d02a2a', '#222'][i]; g.fillRect(256 + 22 + i * 7, top + 34, 5, 24); } g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(256 + 18, top + 46, 30, 18); }
  }
  // pencil hatching inside the current clip (hand-drawn shading on clothes)
  hatch(g, x0, y0, x1, y1, col, gap = 9, alpha = 0.35) { g.save(); g.strokeStyle = col; g.globalAlpha = alpha; g.lineWidth = 2.2; g.beginPath(); for (let x = x0 - (y1 - y0); x < x1; x += gap) { g.moveTo(x, y1); g.lineTo(x + (y1 - y0) * 0.55, y0); } g.stroke(); g.restore(); }
  outline(g, pts, w = 6) { this.wpath(g, pts); g.strokeStyle = INK; g.lineWidth = w; g.stroke(); g.save(); g.globalAlpha = 0.35; g.translate(1.2, -0.8); this.wpath(g, pts); g.lineWidth = w * 0.45; g.stroke(); g.restore(); }
  body(g, o, top, hem) {
    const type = o.body || 'coat', sd = this.o.seed;
    const shapeBell = (wt, wb) => { const pts = [], n = 14; for (let i = 0; i <= n; i++) { const u = i / n; pts.push([256 + wt + (wb - wt) * Math.pow(u, 0.5), top + (hem - top - 60) * u]); }
      for (let i = 0; i <= 14; i++) { const a = R(180 * i / 14); pts.push([256 + Math.cos(a) * wb, hem - 60 + Math.sin(a) * 60]); }
      for (let i = n; i >= 0; i--) { const u = i / n; pts.push([256 - wt - (wb - wt) * Math.pow(u, 0.5), top + (hem - top - 60) * u]); } return pts; };
    if (type === 'bean') {     // tall rounded capsule (suit / long coat), like the villain
      const pts = []; const bt = top - 4, bh = hem + 40;
      for (let i = 0; i <= 40; i++) { const a = R(-90 + 360 * i / 40); const rx = 66, ry = (bh - bt) / 2; const k = Math.sin(a) > 0 ? 1.0 : 0.85; pts.push([256 + Math.cos(a) * rx * k, (bt + bh) / 2 + Math.sin(a) * ry]); }
      this.wpath(g, pts); g.fillStyle = o.coat; g.fill(); g.save(); this.wpath(g, pts); g.clip();
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
      g.fillStyle = o.coat; g.beginPath(); g.moveTo(256 - 90, top + 10); g.lineTo(256 - 14, top + 40); g.lineTo(256 - 6, hem); g.lineTo(256 - 90, hem); g.closePath(); g.fill(); g.beginPath(); g.moveTo(256 + 90, top + 10); g.lineTo(256 + 14, top + 40); g.lineTo(256 + 6, hem); g.lineTo(256 + 90, hem); g.closePath(); g.fill();
      this.hatch(g, 256 + 30, top, 256 + 100, hem + 10, shade(o.coat, 0.5), 8, 0.4); g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(256 - 14, top + 40); g.lineTo(256 - 6, hem); g.moveTo(256 + 14, top + 40); g.lineTo(256 + 6, hem); g.stroke();
      g.fillStyle = o.buttons || '#f2c63a'; for (let k = 0; k < 4; k++) for (const sx of [-1, 1]) { g.beginPath(); g.arc(256 + sx * 22, top + 70 + k * 38, 5.5, 0, 7); g.fill(); g.stroke(); }
      if (o.pocket) { g.strokeStyle = o.buttons || '#f2c63a'; g.lineWidth = 3; g.beginPath(); g.moveTo(256 + 30, top + 80); g.quadraticCurveTo(256 + 50, top + 100, 256 + 70, top + 80); g.stroke(); }
      g.restore(); this.outline(g, pts, 6);
      if (o.bandana) { g.fillStyle = o.bandana; g.strokeStyle = INK; g.lineWidth = 3.5; g.beginPath(); g.moveTo(256 - 30, top + 2); g.lineTo(256 + 30, top + 2); g.lineTo(256, top + 46); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff'; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(256 - 12 + k * 8, top + 12 + (k % 2) * 8, 2.5, 0, 7); g.fill(); } }
      else if (o.bow) { g.fillStyle = o.bow; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(256, top + 12); g.lineTo(256 - 24, top); g.lineTo(256 - 24, top + 26); g.closePath(); g.moveTo(256, top + 12); g.lineTo(256 + 24, top); g.lineTo(256 + 24, top + 26); g.closePath(); g.fill(); g.stroke(); }
      return;
    }
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
  bigHair(g, r) {
    const o = this.o, st = o.hairStyle; g.fillStyle = o.hair; g.strokeStyle = INK; g.lineWidth = 5;
    const fillStroke = () => { g.fill(); g.stroke(); };
    if (st === 'pompadour') {      // tall swept quiff sitting ON the head
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
    const lx = (f.look?.[0] || 0) * 8, ly = (f.look?.[1] || 0) * 6, ey = -2, ex = 45;
    const eyes = f.eyes || 'calm', mouth = f.mouth || 'smile', brow = f.brow ?? 0;
    g.fillStyle = 'rgba(244,160,150,0.12)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 66, 44, 17, 10, 0, 0, 7); g.fill(); }
    for (const s of [-1, 1]) {
      const x = s * ex; g.strokeStyle = INK; g.fillStyle = '#55555e';
      if (eyes === 'lid') {   // reference eye: small black pupil, upper lid covering part of it (lid 0..1), lid can tilt (angry / worried)
        const lid = f.lid ?? 0.45, tl = (f.lidTilt || 0) * s; const ew = 10, eh = 13, cy = ey - 4;
        g.fillStyle = '#1e1410'; g.beginPath(); g.ellipse(x + lx, cy + ly, ew, eh, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(x + lx - 3, cy + ly + 2, 2.6, 0, 7); g.fill();
        const ly0 = cy - eh + lid * eh * 2; g.fillStyle = this.o.skin; g.beginPath(); g.moveTo(x - 20, cy - eh - 6); g.lineTo(x + 20, cy - eh - 6); g.lineTo(x + 20, ly0 - tl * 14); g.lineTo(x - 20, ly0 + tl * 14); g.closePath(); g.fill();
        g.strokeStyle = INK; g.lineWidth = 4.5; g.beginPath(); g.moveTo(x - 15, ly0 + tl * 10); g.lineTo(x + 15, ly0 - tl * 10); g.stroke(); }
      else if (eyes === 'dot') { g.fillStyle = '#1e1410'; g.beginPath(); g.ellipse(x + lx, ey - 6 + ly, 10.5, 16.5, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(x + lx - 3, ey - 11 + ly, 3, 0, 7); g.fill(); }
      else if (eyes === 'sly') { g.fillStyle = '#1e1410'; g.beginPath(); g.ellipse(x + lx, ey - 4, 12, 7, 0, 0, 7); g.fill(); g.lineWidth = 5; g.beginPath(); g.moveTo(x - 17, ey - 9 - s * 3); g.lineTo(x + 17, ey - 9 + s * 3); g.stroke(); }
      else if (eyes === 'calm') {      // reference eye: grey half-lidded ellipse with a lid line
        g.beginPath(); g.ellipse(x + lx, ey + ly + 2, 14, 8.5, 0, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.arc(x + lx - 4, ey + ly - 1, 2.6, 0, 7); g.fill();
        g.fillStyle = this.o.skin; g.fillRect(x - 18, ey - 16, 36, eyes === 'calm' ? 13 : 9);
        g.lineWidth = 3.5; g.beginPath(); g.moveTo(x - 16, ey + (eyes === 'calm' ? -3 : -7)); g.lineTo(x + 16, ey + (eyes === 'calm' ? -3 : -7)); g.stroke();
      } else if (eyes === 'tiny') { g.fillStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.ellipse(x, ey - 6, 24, 29, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(x + lx * 0.5, ey - 6 + ly * 0.5, 4.5, 0, 7); g.fill(); }
      else if (eyes === 'wide') { g.fillStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.ellipse(x, ey - 4, 21, 25, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(x + lx, ey - 4 + ly, 7, 0, 7); g.fill(); }
      else if (eyes === 'closed') { g.lineWidth = 4.5; g.beginPath(); g.arc(x, ey - 4, 13, Math.PI * 0.15, Math.PI * 0.85); g.stroke(); }
      else if (eyes === 'happy') { g.lineWidth = 4.5; g.beginPath(); g.arc(x, ey + 8, 13, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
      else if (eyes === 'sleepy') { g.beginPath(); g.ellipse(x + lx, ey + 5, 13, 5, 0, 0, Math.PI); g.fill(); g.lineWidth = 4; g.beginPath(); g.moveTo(x - 16, ey + 4); g.lineTo(x + 16, ey + 4); g.stroke(); }
      const bs = s < 0 ? f.browL : f.browR;
      if (bs !== undefined) { const b = bs; const by = ey - 30 - Math.max(0, b) * 10; g.lineWidth = 8; g.beginPath(); g.moveTo(x - s * 15, by + (b < 0 ? -b * 9 : -b * 2)); g.quadraticCurveTo(x, by - 4 - Math.max(0, b) * 3, x + s * 15, by + (b < 0 ? b * 3 : b * 6)); g.stroke(); }
      else if (f.sly) { g.lineWidth = 7; g.beginPath(); g.moveTo(x - s * 4 + s * 22, ey - 40); g.lineTo(x - s * 20, ey - 26); g.stroke(); }
      else if (!brow) { const by = ey - (eyes === 'wide' ? 44 : 30); g.lineWidth = 6; g.beginPath(); g.moveTo(x - s * 14, by + 2); g.quadraticCurveTo(x, by - 5, x + s * 16, by + 1); g.stroke(); }
      else if (brow) { const by = ey - (eyes === 'wide' || eyes === 'tiny' ? 46 : 26) - Math.max(0, brow) * 8; g.lineWidth = 5; g.beginPath(); g.moveTo(x - s * 15, by + (brow < 0 ? -brow * 9 : -brow * 3)); g.lineTo(x + s * 15, by + (brow < 0 ? brow * 3 : brow * 5)); g.stroke(); }
    }
    if (this.o.beard) { g.fillStyle = this.o.beard; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(-r * 0.72, r * 0.38); g.quadraticCurveTo(-r * 0.62, r * 1.12, 0, r * 1.16); g.quadraticCurveTo(r * 0.62, r * 1.12, r * 0.72, r * 0.38); g.quadraticCurveTo(r * 0.4, r * 0.86, 0, r * 0.84); g.quadraticCurveTo(-r * 0.4, r * 0.86, -r * 0.72, r * 0.38); g.closePath(); g.fill(); g.stroke(); }
    if (this.o.glasses) { g.strokeStyle = INK; g.lineWidth = 4.5; g.fillStyle = 'rgba(200,230,255,0.25)'; for (const s of [-1, 1]) { g.beginPath(); if (this.o.glasses === 'square') g.rect(s * 40 - 22, -18, 44, 34); else g.arc(s * 40, -2, 24, 0, 7); g.fill(); g.stroke(); } g.beginPath(); g.moveTo(-16, -6); g.quadraticCurveTo(0, -14, 16, -6); g.stroke(); }
    if (this.o.mustache) { g.fillStyle = this.o.hair || '#4a2f20'; g.strokeStyle = INK; g.lineWidth = 2.5; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 15, 40, 18, 7, s * 0.25, 0, 7); g.fill(); g.stroke(); } }
    g.strokeStyle = INK; g.fillStyle = '#5a1e1a'; g.lineWidth = 3.5; const my = 52;
    if (mouth === 'smile') { g.beginPath(); g.arc(0, my - 12, 10, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); }
    else if (mouth === 'grin' || mouth === 'teeth') {   // big toothy grin
      g.beginPath(); g.moveTo(-58, my - 16); g.quadraticCurveTo(0, my - 2, 58, my - 16); g.quadraticCurveTo(48, my + 34, 0, my + 36); g.quadraticCurveTo(-48, my + 34, -58, my - 16); g.closePath(); g.fillStyle = '#3a1210'; g.fill();
      g.save(); g.clip(); g.fillStyle = '#fffdf6'; g.fillRect(-60, my - 22, 120, 26); g.strokeStyle = INK; g.lineWidth = 2; for (let k = -4; k <= 4; k++) { g.beginPath(); g.moveTo(k * 12, my - 14); g.lineTo(k * 12, my + 4); g.stroke(); } g.fillStyle = '#e07a7a'; g.beginPath(); g.ellipse(0, my + 30, 20, 9, 0, 0, 7); g.fill(); g.restore();
      g.strokeStyle = INK; g.lineWidth = 4.5; g.beginPath(); g.moveTo(-58, my - 16); g.quadraticCurveTo(0, my - 2, 58, my - 16); g.quadraticCurveTo(48, my + 34, 0, my + 36); g.quadraticCurveTo(-48, my + 34, -58, my - 16); g.closePath(); g.stroke(); }
    else if (mouth === 'smirk1') { g.lineWidth = 4; g.beginPath(); g.moveTo(-12, my - 2); g.quadraticCurveTo(8, my + 4, 20, my - 10); g.stroke(); g.beginPath(); g.moveTo(17, my - 13); g.lineTo(23, my - 7); g.stroke(); }
    else if (mouth === 'line') { g.lineWidth = 4; g.beginPath(); g.moveTo(-11, my + 1); g.lineTo(11, my - 1); g.stroke(); }
    else if (mouth === 'smallO') { g.beginPath(); g.ellipse(0, my + 2, 7, 9, 0, 0, 7); g.fill(); g.stroke(); }
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
    else if (mouth === 'talk') { g.beginPath(); g.ellipse(0, my, 12, 7, 0, 0, 7); g.fill(); g.stroke(); }
    else if (mouth === 'yawn') { g.beginPath(); g.ellipse(0, my + 8, 13, 20, 0, 0, 7); g.fill(); g.stroke(); }
  }
  hat(g, r, off) {
    const o = this.o; if (!o.hat) return; g.save(); g.translate(0, -off); const hk = r / 116; g.scale(hk, hk); r = 116; g.strokeStyle = INK; g.lineWidth = 4.5; g.fillStyle = o.hatCol;   // hats scale with the (bigger) head
    const hl = (x, y, w, h) => { g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x, y, w, h); g.fillStyle = o.hatCol; };
    if (o.hat === 'top') {
      g.beginPath(); g.moveTo(-50, -r * 0.78); g.lineTo(-56, -r - 104); g.lineTo(56, -r - 104); g.lineTo(50, -r * 0.78); g.closePath(); g.fill(); g.stroke(); hl(-46, -r - 96, 16, 80);
      g.fillStyle = o.band; g.fillRect(-52, -r * 0.78 - 26, 104, 18); g.strokeRect(-52, -r * 0.78 - 26, 104, 18);
      g.fillStyle = o.hatCol; g.beginPath(); g.ellipse(0, -r * 0.78, 84, 13, 0, 0, 7); g.fill(); g.stroke();
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
