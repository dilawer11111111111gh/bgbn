// flat2d.js v2 : FLAT 2D cartoon characters in a REAL 3D world (reference "3D set + flat 2D people" style).
// Look matched to the reference: white round head with dark hair cap + bangs, calm half-lidded grey eyes, tiny smile,
// small bell-shaped coat with white collar points, long thin tie, yellow badge, thin limbs, round dark hands,
// warm dark-brown slightly wobbly hand-drawn outline. Drawn every frame on a canvas, card turns to face the camera.
//   const A = new Flat2D({ coat:'#3b5ba8', tie:'#e0b03a', hat:'top', hair:'#2a1d16' });  A.place(x,y,z);
//   A.update({ armL:[20,10], armR:[150,-30], walk:t*9, amp:24, face:{eyes:'wide', mouth:'o', brow:1} }, camPos)
import * as THREE from 'three';
import * as C from './core.js';

const R = (d) => (d * Math.PI) / 180;
const INK = '#2a1810';
function softShadowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(30,16,8,0.5)'); gr.addColorStop(0.6, 'rgba(30,16,8,0.25)'); gr.addColorStop(1, 'rgba(30,16,8,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t;
}
let SHT = null;
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };
// hand-drawn wobble: deterministic per character (no shimmer), tiny amplitude
const wob = (seed, i, a = 1.6) => Math.sin(i * 1.7 + seed * 3.1) * a + Math.sin(i * 4.3 + seed) * a * 0.5;

export class Flat2D {
  constructor(o = {}) {
    this.o = { coat: '#3b5ba8', tie: '#e0b03a', badge: '#f0b43a', collar: '#fbf6ec', hat: 'top', hatCol: '#3a2620', band: '#a02a24', skin: '#fdfaf2',
      hair: '#2a1d16', hairStyle: 'bangs', bust: false, size: 1.85, res: 1.6, mustache: false, seed: 1, ...o };
    const S = this.S = this.o.res; this.cw = Math.round(512 * S); this.ch = Math.round((this.o.bust ? 512 : 1024) * S);
    this.cv = document.createElement('canvas'); this.cv.width = this.cw; this.cv.height = this.ch; this.g = this.cv.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.NoColorSpace; this.tex.anisotropy = 8;
    this.tex.generateMipmaps = true; this.tex.minFilter = THREE.LinearMipmapLinearFilter;
    const h = this.o.size * (this.o.bust ? 0.5 : 1), w = this.o.bust ? h : h * 0.5;
    const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h / 2, 0);
    this.mesh = new THREE.Mesh(geo, C.cardMat(this.tex)); this.mesh.frustumCulled = false; C.stage.cards.add(this.mesh);
    if (!this.o.bust) {
      SHT = SHT || softShadowTex();
      this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.34), C.fxMat(SHT)); this.shadow.rotation.x = -Math.PI / 2; this.shadow.renderOrder = -5; C.stage.cards.add(this.shadow);
    }
    this.pos = new THREE.Vector3(); this.h = h;
  }
  place(x, y, z) { this.pos.set(x, y, z); return this; }
  headWorld() { return this.pos.clone().add(new THREE.Vector3(0, this.h * (this.o.bust ? 0.5 : 0.68), 0)); }
  bodyWorld() { return this.pos.clone().add(new THREE.Vector3(0, this.h * (this.o.bust ? 0.35 : 0.5), 0)); }
  update(p = {}, cam) {
    this.draw(p); this.tex.needsUpdate = true;
    this.mesh.position.copy(this.pos); this.mesh.visible = !p.hide;
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
    const bob = (p.bob || 0) - (p.hop || 0), sq = p.squash || 0, lean = p.lean || 0;
    const hipY = 640 + bob * 0.7;
    // ---- legs: long thin lines, tiny dark feet ----
    if (!o.bust) { const ph = p.walk || 0, amp = p.amp ?? 0;
      for (const s of [-1, 1]) {
        const sw = Math.sin(ph + (s > 0 ? 0 : Math.PI)), a = R(amp * sw + (p.legOut || 0) * s), hx = 256 + s * 20, L1 = 180, L2 = 170;
        const knee = [hx + Math.sin(a) * L1, hipY + Math.cos(a) * L1], kb = a - R(Math.max(0, sw) * amp * 0.9);
        const foot = [knee[0] + Math.sin(kb) * L2, Math.min(992, knee[1] + Math.cos(kb) * L2)];
        g.strokeStyle = INK; g.lineWidth = 7.5; g.beginPath(); g.moveTo(hx, hipY - 10); g.lineTo(knee[0], knee[1]); g.lineTo(foot[0], foot[1]); g.stroke();
        g.fillStyle = INK; g.beginPath(); g.ellipse(foot[0] + 7, foot[1] + 2, 13, 6.5, 0, 0, 7); g.fill();
      } }
    g.save(); g.translate(256, hipY); g.rotate(R(lean)); g.translate(-256, -hipY);
    // ---- coat: small bell / sack shape ----
    const top = 442 + bob + sq * 14, hem = 652 + bob * 0.6;
    const bodyPts = []; { const n = 14;
      for (let i = 0; i <= n; i++) { const u = i / n; const y = top + (hem - top - 26) * u; const w = 46 + 30 * Math.pow(u, 0.8); bodyPts.push([256 + w, y]); }
      for (let i = 0; i <= 10; i++) { const a = R(0 + 180 * i / 10); bodyPts.push([256 + Math.cos(a) * 76, hem - 26 + Math.sin(a) * 26]); }
      for (let i = n; i >= 0; i--) { const u = i / n; const y = top + (hem - top - 26) * u; const w = 46 + 30 * Math.pow(u, 0.8); bodyPts.push([256 - w, y]); } }
    this.wpath(g, bodyPts); g.fillStyle = o.coat; g.fill();
    g.save(); this.wpath(g, bodyPts); g.clip();
    g.fillStyle = shade(o.coat, 0.78); g.beginPath(); g.ellipse(256 + 70, (top + hem) / 2 + 20, 34, 150, 0, 0, 7); g.fill();   // cel shade
    g.fillStyle = shade(o.coat, 1.12); g.beginPath(); g.ellipse(256 - 52, top + 40, 14, 60, 0.15, 0, 7); g.fill();            // rim light
    // tie (long, thin)
    g.fillStyle = o.tie; g.strokeStyle = INK; g.lineWidth = 3;
    g.beginPath(); g.moveTo(250, top + 8); g.lineTo(262, top + 8); g.lineTo(266, top + 120); g.lineTo(256, top + 136); g.lineTo(246, top + 120); g.closePath(); g.fill(); g.stroke();
    // badge
    g.fillStyle = o.badge; g.lineWidth = 3.5; g.beginPath(); g.roundRect(256 + 18, top + 48, 34, 30, 7); g.fill(); g.stroke();
    g.restore();
    this.wpath(g, bodyPts); g.strokeStyle = INK; g.lineWidth = 5.5; g.stroke();
    // collar points
    g.fillStyle = o.collar; g.strokeStyle = INK; g.lineWidth = 3.5;
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(256, top + 2); g.lineTo(256 + s * 30, top - 4); g.lineTo(256 + s * 20, top + 22); g.closePath(); g.fill(); g.stroke(); }
    // ---- arms: thin lines, round dark hands ----
    const arm = (s, a) => {
      const [sa, eb] = a || [22, 6]; const sx = 256 + s * 44, sy = top + 22, L1 = 84, L2 = 78; const a1 = R(sa), a2 = R(sa + eb);
      const el = [sx + s * Math.sin(a1) * L1, sy + Math.cos(a1) * L1], hd = [el[0] + s * Math.sin(a2) * L2, el[1] + Math.cos(a2) * L2];
      g.strokeStyle = INK; g.lineWidth = 6.5; g.beginPath(); g.moveTo(sx, sy); g.lineTo(el[0], el[1]); g.lineTo(hd[0], hd[1]); g.stroke();
      g.fillStyle = '#3a2620'; g.beginPath(); g.arc(hd[0], hd[1], 15, 0, 7); g.fill(); g.lineWidth = 3; g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.arc(hd[0] - 5, hd[1] - 5, 4, 0, 7); g.fill();
      return hd;
    };
    this.handL = arm(-1, p.armL); this.handR = arm(1, p.armR);
    // ---- head ----
    const r = 116, hx = 256 + (p.headX || 0), hy = 318 + bob + sq * 22;
    g.save(); g.translate(hx, hy); g.rotate(R(p.tilt || 0)); g.scale(1 + sq * 0.12, 1 - sq * 0.1);
    const headPts = this.ell(0, 0, r, r * 1.0, 56);
    this.wpath(g, headPts); g.fillStyle = o.skin; g.fill();
    g.save(); this.wpath(g, headPts); g.clip();
    g.fillStyle = 'rgba(150,110,80,0.10)'; g.beginPath(); g.ellipse(26, 22, r * 0.95, r * 0.95, 0, 0, 7); g.rect(-r * 2, -r * 2, r * 4, r * 4); g.fill('evenodd');
    if (o.hair) this.hair(g, r);
    g.restore();
    this.wpath(g, headPts); g.strokeStyle = INK; g.lineWidth = 5.5; g.stroke();
    this.face(g, p.face || {}, r);
    this.hat(g, r, p.hatOff || 0);
    g.restore(); g.restore();
    if (p.mark) { g.save(); g.translate(256 + 140, 120 + bob); g.rotate(R(12)); g.font = 'bold 130px serif'; g.textAlign = 'center'; g.lineWidth = 10; g.strokeStyle = INK; g.fillStyle = '#e4332a'; g.strokeText(p.mark, 0, 0); g.fillText(p.mark, 0, 0); g.restore(); }
    if (p.sweat) { g.save(); g.translate(hx - 118, hy - 30 + (p.sweat * 30) % 30); g.fillStyle = '#9fd6ff'; g.strokeStyle = INK; g.lineWidth = 3.5; g.beginPath(); g.moveTo(0, -20); g.quadraticCurveTo(14, 4, 0, 11); g.quadraticCurveTo(-14, 4, 0, -20); g.fill(); g.stroke(); g.restore(); }
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
  face(g, f, r) {
    const lx = (f.look?.[0] || 0) * 8, ly = (f.look?.[1] || 0) * 6, ey = 4, ex = 40;
    const eyes = f.eyes || 'calm', mouth = f.mouth || 'smile', brow = f.brow ?? 0;
    g.fillStyle = 'rgba(244,160,150,0.28)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 66, 44, 17, 10, 0, 0, 7); g.fill(); }
    for (const s of [-1, 1]) {
      const x = s * ex; g.strokeStyle = INK; g.fillStyle = '#55555e';
      if (eyes === 'calm' || eyes === 'dot') {      // reference eye: grey half-lidded ellipse with a lid line
        g.beginPath(); g.ellipse(x + lx, ey + ly + 2, 14, 8.5, 0, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.arc(x + lx - 4, ey + ly - 1, 2.6, 0, 7); g.fill();
        g.fillStyle = this.o.skin; g.fillRect(x - 18, ey - 16, 36, eyes === 'calm' ? 13 : 9);
        g.lineWidth = 3.5; g.beginPath(); g.moveTo(x - 16, ey + (eyes === 'calm' ? -3 : -7)); g.lineTo(x + 16, ey + (eyes === 'calm' ? -3 : -7)); g.stroke();
      } else if (eyes === 'wide') { g.fillStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.ellipse(x, ey - 4, 21, 25, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(x + lx, ey - 4 + ly, 7, 0, 7); g.fill(); }
      else if (eyes === 'closed') { g.lineWidth = 4.5; g.beginPath(); g.arc(x, ey - 4, 13, Math.PI * 0.15, Math.PI * 0.85); g.stroke(); }
      else if (eyes === 'happy') { g.lineWidth = 4.5; g.beginPath(); g.arc(x, ey + 8, 13, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
      else if (eyes === 'sleepy') { g.beginPath(); g.ellipse(x + lx, ey + 5, 13, 5, 0, 0, Math.PI); g.fill(); g.lineWidth = 4; g.beginPath(); g.moveTo(x - 16, ey + 4); g.lineTo(x + 16, ey + 4); g.stroke(); }
      if (brow) { const by = ey - (eyes === 'wide' ? 42 : 26) - Math.max(0, brow) * 8; g.lineWidth = 5; g.beginPath(); g.moveTo(x - s * 15, by + (brow < 0 ? -brow * 9 : -brow * 3)); g.lineTo(x + s * 15, by + (brow < 0 ? brow * 3 : brow * 5)); g.stroke(); }
    }
    if (this.o.mustache) { g.fillStyle = this.o.hair || '#4a2f20'; g.strokeStyle = INK; g.lineWidth = 2.5; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 15, 40, 18, 7, s * 0.25, 0, 7); g.fill(); g.stroke(); } }
    g.strokeStyle = INK; g.fillStyle = '#5a1e1a'; g.lineWidth = 3.5; const my = 52;
    if (mouth === 'smile') { g.beginPath(); g.arc(0, my - 12, 10, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); }
    else if (mouth === 'grin') { g.beginPath(); g.moveTo(-22, my - 4); g.quadraticCurveTo(0, my + 26, 22, my - 4); g.closePath(); g.fill(); g.stroke(); }
    else if (mouth === 'o') { g.beginPath(); g.ellipse(0, my + 2, 9, 12, 0, 0, 7); g.fill(); g.stroke(); }
    else if (mouth === 'scream') { g.beginPath(); g.ellipse(0, my + 8, 18, 25, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#e07070'; g.beginPath(); g.ellipse(0, my + 22, 10, 6, 0, 0, 7); g.fill(); }
    else if (mouth === 'frown') { g.beginPath(); g.arc(0, my + 12, 12, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); }
    else if (mouth === 'flat') { g.beginPath(); g.moveTo(-10, my); g.lineTo(10, my); g.stroke(); }
    else if (mouth === 'talk') { g.beginPath(); g.ellipse(0, my, 12, 7, 0, 0, 7); g.fill(); g.stroke(); }
    else if (mouth === 'yawn') { g.beginPath(); g.ellipse(0, my + 8, 13, 20, 0, 0, 7); g.fill(); g.stroke(); }
  }
  hat(g, r, off) {
    const o = this.o; if (!o.hat) return; g.save(); g.translate(0, -off); g.strokeStyle = INK; g.lineWidth = 4.5; g.fillStyle = o.hatCol;
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
    } else if (o.hat === 'cap') {     // newsboy cap
      g.beginPath(); g.ellipse(0, -r * 0.62, r * 1.02, r * 0.5, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2.5; for (const a of [-0.5, 0, 0.5]) { g.beginPath(); g.moveTo(0, -r * 1.1); g.lineTo(a * r * 1.4, -r * 0.62); g.stroke(); }
      g.strokeStyle = INK; g.lineWidth = 4.5; g.fillStyle = shade(o.hatCol, 0.8); g.beginPath(); g.ellipse(r * 0.3, -r * 0.6, r * 0.75, 13, 0.06, 0, Math.PI); g.fill(); g.stroke();
    } else if (o.hat === 'cowboy') {
      g.beginPath(); g.moveTo(-136, -r * 0.82); g.quadraticCurveTo(0, -r * 0.6, 136, -r * 0.82); g.quadraticCurveTo(120, -r - 10, 66, -r * 0.92); g.lineTo(-66, -r * 0.92); g.quadraticCurveTo(-120, -r - 10, -136, -r * 0.82); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-62, -r * 0.9); g.bezierCurveTo(-70, -r - 92, -14, -r - 78, 0, -r - 62); g.bezierCurveTo(14, -r - 78, 70, -r - 92, 62, -r * 0.9); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = o.band; g.fillRect(-62, -r * 0.9 - 20, 124, 14); g.strokeRect(-62, -r * 0.9 - 20, 124, 14);
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
