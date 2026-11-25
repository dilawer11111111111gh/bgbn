// flat2d.js : FLAT 2D cartoon characters (drawn every frame on a canvas, ink outlines baked in) standing in a REAL 3D world.
// This is the "3D background + flat 2D character" look: the card always turns to face the camera (yaw only),
// gets a soft contact shadow on the ground and is depth-tested + depth-of-field blurred like everything else.
//   const A = new Flat2D({ coat:'#3b5ba8', hat:'top', tie:'#c23a2a' });  A.place(x, y, z);
//   per frame: A.update({ armL:[20,10], armR:[150,-30], walk:t*9, amp:28, face:{eyes:'wide', mouth:'o', brow:-1} }, camPosVector3)
import * as THREE from 'three';
import * as C from './core.js';

const R = (d) => (d * Math.PI) / 180;
const INK = '#17110f';
function softShadowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(20,12,8,0.55)'); gr.addColorStop(0.6, 'rgba(20,12,8,0.28)'); gr.addColorStop(1, 'rgba(20,12,8,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t;
}
let SHT = null;

// canvas units: 512 x 1024, feet at y=1000, head centre y=380 (r=150)  -> drawn at S x scale
export class Flat2D {
  constructor(o = {}) {
    this.o = { coat: '#3b5ba8', coatDark: null, trim: '#f2e6c8', tie: '#c23a2a', hat: 'bowler', hatCol: '#2a2220', band: '#7a3a2a', skin: '#fbf6ec', blush: '#f4a9a0',
      hair: null, vest: null, bust: false, size: 1.85, res: 1.6, mustache: false, bag: null, ...o };
    const S = this.S = this.o.res; this.cw = Math.round(512 * S); this.ch = Math.round((this.o.bust ? 512 : 1024) * S);
    this.cv = document.createElement('canvas'); this.cv.width = this.cw; this.cv.height = this.ch; this.g = this.cv.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.NoColorSpace; this.tex.anisotropy = 8;
    this.tex.generateMipmaps = true; this.tex.minFilter = THREE.LinearMipmapLinearFilter;
    const h = this.o.size * (this.o.bust ? 0.5 : 1), w = this.o.bust ? h : h * 0.5;
    const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h / 2, 0);
    this.mesh = new THREE.Mesh(geo, C.cardMat(this.tex)); this.mesh.frustumCulled = false; C.stage.cards.add(this.mesh);
    this.root = new THREE.Group(); C.stage.cards.add(this.root);
    if (!this.o.bust) {
      SHT = SHT || softShadowTex();
      this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.42), C.fxMat(SHT)); this.shadow.rotation.x = -Math.PI / 2; this.shadow.renderOrder = -5; C.stage.cards.add(this.shadow);
    }
    this.pos = new THREE.Vector3(); this.h = h;
  }
  place(x, y, z) { this.pos.set(x, y, z); return this; }
  // world point of the head centre (for camera targets)
  headWorld() { return this.pos.clone().add(new THREE.Vector3(0, this.h * (this.o.bust ? 0.414 : 0.62), 0)); }
  bodyWorld() { return this.pos.clone().add(new THREE.Vector3(0, this.h * (this.o.bust ? 0.4 : 0.45), 0)); }
  update(p = {}, cam) {
    this.draw(p);
    this.tex.needsUpdate = true;
    this.mesh.position.copy(this.pos);
    if (cam) this.mesh.rotation.y = Math.atan2(cam.x - this.pos.x, cam.z - this.pos.z);
    if (p.hide) this.mesh.visible = false; else this.mesh.visible = true;
    if (this.shadow) { this.shadow.position.set(this.pos.x, this.pos.y + 0.012, this.pos.z); this.shadow.visible = !p.hide; const k = 1 - Math.min(0.5, (p.hop || 0) / 300); this.shadow.scale.set(k, k, k); }
  }
  draw(p) {
    const g = this.g, S = this.S, o = this.o;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.cw, this.ch);
    g.setTransform(S, 0, 0, S, 0, 0);
    if (o.bust) { g.translate(256, 300); g.scale(0.85, 0.85); g.translate(-256, -388); }
    const flip = p.flip ? -1 : 1; g.translate(256, 0); g.scale(flip, 1); g.translate(-256, 0);
    const lean = p.lean || 0, bob = (p.bob || 0) - (p.hop || 0), sq = p.squash || 0;
    g.lineJoin = 'round'; g.lineCap = 'round';
    // ---- legs ----
    const ph = p.walk || 0, amp = p.amp ?? 0;
    const hipY = 742 + bob * 0.6;
    if (!o.bust) for (const s of [-1, 1]) {
      const a = R(amp * Math.sin(ph + (s > 0 ? 0 : Math.PI)) + (p.legOut || 0) * s);
      const hx = 256 + s * 20, L1 = 128, L2 = 120;
      const knee = [hx + Math.sin(a) * L1, hipY + Math.cos(a) * L1];
      const lift = Math.max(0, Math.sin(ph + (s > 0 ? 0 : Math.PI))) * amp * 0.012;
      const kb = a - R(amp > 0 ? 25 * lift * 3 : 0);
      const foot = [knee[0] + Math.sin(kb) * L2, Math.min(986, knee[1] + Math.cos(kb) * L2)];
      g.strokeStyle = INK; g.lineWidth = 15; g.beginPath(); g.moveTo(hx, hipY); g.lineTo(knee[0], knee[1]); g.lineTo(foot[0], foot[1]); g.stroke();
      g.fillStyle = '#2a1f1a'; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.ellipse(foot[0] + 12, foot[1] + 6, 26, 13, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    }
    g.save(); g.translate(256, hipY); g.rotate(R(lean)); g.translate(-256, -hipY);
    const shY = 580 + bob + sq * 20;
    // ---- coat body ----
    const top = shY - 18, hem = 770 + bob * 0.5;
    const body = () => { g.beginPath(); g.moveTo(256 - 56, top); g.quadraticCurveTo(256 - 70, (top + hem) / 2, 256 - 82, hem); g.lineTo(256 + 82, hem); g.quadraticCurveTo(256 + 70, (top + hem) / 2, 256 + 56, top); g.quadraticCurveTo(256, top - 16, 256 - 56, top); g.closePath(); };
    body(); g.fillStyle = o.coat; g.fill();
    g.save(); body(); g.clip();
    const gr = g.createLinearGradient(256 - 80, 0, 256 + 80, 0); gr.addColorStop(0, 'rgba(255,255,255,0.10)'); gr.addColorStop(0.55, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.22)');
    g.fillStyle = gr; g.fillRect(0, 0, 512, 1024);
    if (o.vest) { g.fillStyle = o.vest; g.beginPath(); g.moveTo(256 - 26, top); g.lineTo(256 + 26, top); g.lineTo(256 + 30, hem - 40); g.lineTo(256 - 30, hem - 40); g.closePath(); g.fill(); }
    g.fillStyle = o.trim; g.beginPath(); g.moveTo(256 - 18, top - 4); g.lineTo(256 + 18, top - 4); g.lineTo(256, top + 58); g.closePath(); g.fill();
    if (o.tie) { g.fillStyle = o.tie; g.beginPath(); g.moveTo(256 - 9, top + 2); g.lineTo(256 + 9, top + 2); g.lineTo(256 + 11, top + 92); g.lineTo(256, top + 106); g.lineTo(256 - 11, top + 92); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); }
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(256 - 18, top); g.lineTo(256 - 34, top + 120); g.moveTo(256 + 18, top); g.lineTo(256 + 34, top + 120); g.stroke();
    g.fillStyle = '#e8c86a'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(256 + 40, top + 70 + i * 34, 5, 0, 7); g.fill(); }
    g.restore(); body(); g.strokeStyle = INK; g.lineWidth = 7; g.stroke();
    if (o.bag) { g.fillStyle = o.bag; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.roundRect(256 + 52, top + 110, 52, 58, 10); g.fill(); g.stroke(); g.beginPath(); g.moveTo(256 - 40, top + 4); g.lineTo(256 + 78, top + 112); g.lineWidth = 4; g.stroke(); }
    // ---- arms ----
    const arm = (s, a) => {
      const [sa, eb] = a || [12, 8]; const sx = 256 + s * 54, sy = shY + 4, L1 = 92, L2 = 86;
      const a1 = R(sa), a2 = R(sa + eb);
      const el = [sx + s * Math.sin(a1) * L1, sy + Math.cos(a1) * L1], hd = [el[0] + s * Math.sin(a2) * L2, el[1] + Math.cos(a2) * L2];
      g.strokeStyle = INK; g.lineWidth = 13; g.beginPath(); g.moveTo(sx, sy); g.lineTo(el[0], el[1]); g.lineTo(hd[0], hd[1]); g.stroke();
      g.fillStyle = INK; g.beginPath(); g.arc(hd[0], hd[1], 13, 0, 7); g.fill();
      return hd;
    };
    this.handL = arm(-1, p.armL); this.handR = arm(1, p.armR);
    // ---- head ----
    const hx = 256 + (p.headX || 0), hy = 388 + bob + sq * 30, r = 150;
    const tilt = R(p.tilt || 0);
    g.save(); g.translate(hx, hy); g.rotate(tilt); g.scale(1 + sq * 0.12, 1 - sq * 0.1);
    g.strokeStyle = INK; g.lineWidth = 14; g.beginPath(); g.moveTo(0, r - 10); g.lineTo(0, shY - hy - 4); g.stroke();
    g.beginPath(); g.ellipse(0, 0, r * 0.97, r, 0, 0, Math.PI * 2); g.fillStyle = o.skin; g.fill();
    const hg = g.createRadialGradient(-50, -60, 20, 0, 0, r * 1.05); hg.addColorStop(0, 'rgba(255,255,255,0.0)'); hg.addColorStop(0.75, 'rgba(120,90,70,0.0)'); hg.addColorStop(1, 'rgba(120,90,70,0.20)');
    g.fillStyle = hg; g.fill();
    if (o.hair) { g.fillStyle = o.hair; g.beginPath(); g.ellipse(0, -r * 0.55, r * 0.92, r * 0.5, 0, Math.PI, 0); g.fill(); }
    g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.ellipse(0, 0, r * 0.97, r, 0, 0, Math.PI * 2); g.stroke();
    this.face(g, p.face || {}, r);
    this.hat(g, r, p.hatOff || 0);
    g.restore();
    g.restore();
    // ---- marks (! ?) ----
    if (p.mark) { g.save(); g.translate(256 + 150, 140 + bob); g.rotate(R(12)); g.font = 'bold 150px serif'; g.textAlign = 'center'; g.lineWidth = 12; g.strokeStyle = INK; g.fillStyle = '#e4332a'; g.strokeText(p.mark, 0, 0); g.fillText(p.mark, 0, 0); g.restore(); }
    if (p.sweat) { g.save(); g.translate(hx - 130, hy - 40 + (p.sweat * 30) % 30); g.fillStyle = '#8fd0ff'; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(0, -22); g.quadraticCurveTo(16, 4, 0, 12); g.quadraticCurveTo(-16, 4, 0, -22); g.fill(); g.stroke(); g.restore(); }
  }
  face(g, f, r) {
    const lx = (f.look?.[0] || 0) * 10, ly = (f.look?.[1] || 0) * 8, ey = -10, ex = 50;
    const eyes = f.eyes || 'dot', mouth = f.mouth || 'smile', brow = f.brow ?? 0;
    g.fillStyle = INK; g.strokeStyle = INK;
    // cheeks
    g.fillStyle = 'rgba(244,150,140,0.45)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 82, 52, 24, 14, 0, 0, 7); g.fill(); }
    for (const s of [-1, 1]) {
      const x = s * ex;
      if (eyes === 'wide') { g.fillStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.ellipse(x, ey, 30, 36, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(x + lx, ey + ly, 11, 0, 7); g.fill(); }
      else if (eyes === 'closed') { g.lineWidth = 7; g.beginPath(); g.arc(x, ey + 4, 18, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
      else if (eyes === 'happy') { g.lineWidth = 7; g.beginPath(); g.arc(x, ey + 12, 18, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
      else if (eyes === 'sleepy') { g.fillStyle = INK; g.beginPath(); g.arc(x + lx, ey + 4, 12, 0, Math.PI); g.fill(); g.lineWidth = 6; g.beginPath(); g.moveTo(x - 18, ey + 2); g.lineTo(x + 18, ey + 2); g.stroke(); }
      else { g.fillStyle = INK; g.beginPath(); g.ellipse(x + lx, ey + ly, 12, 15, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + lx - 4, ey + ly - 6, 4, 0, 7); g.fill(); }
      // brows: brow<0 angry (inner down), >0 worried/surprised (up)
      const by = ey - (eyes === 'wide' ? 58 : 42) - Math.max(0, brow) * 12;
      g.strokeStyle = INK; g.lineWidth = 10; g.beginPath();
      g.moveTo(x - s * 22, by + (brow < 0 ? -brow * 14 : brow * -6) * 1); g.lineTo(x + s * 22, by + (brow < 0 ? brow * 6 : brow * 8)); g.stroke();
    }
    if (this.o.mustache) { g.fillStyle = this.o.hair || '#4a2f20'; g.strokeStyle = INK; g.lineWidth = 4; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 22, 52, 28, 12, s * 0.25, 0, 7); g.fill(); g.stroke(); } }
    g.strokeStyle = INK; g.fillStyle = '#5a1a1a'; g.lineWidth = 7; const my = 70;
    if (mouth === 'smile') { g.beginPath(); g.arc(0, my - 26, 30, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); }
    else if (mouth === 'grin') { g.beginPath(); g.moveTo(-42, my - 8); g.quadraticCurveTo(0, my + 52, 42, my - 8); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillRect(-30, my - 6, 60, 10); }
    else if (mouth === 'o') { g.beginPath(); g.ellipse(0, my + 6, 18, 24, 0, 0, 7); g.fill(); g.stroke(); }
    else if (mouth === 'scream') { g.beginPath(); g.ellipse(0, my + 12, 34, 44, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#e46a6a'; g.beginPath(); g.ellipse(0, my + 38, 20, 12, 0, 0, 7); g.fill(); }
    else if (mouth === 'frown') { g.beginPath(); g.arc(0, my + 26, 26, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); }
    else if (mouth === 'flat') { g.beginPath(); g.moveTo(-22, my); g.lineTo(22, my); g.stroke(); }
    else if (mouth === 'talk') { g.beginPath(); g.ellipse(0, my + 2, 24, 14, 0, 0, 7); g.fill(); g.stroke(); }
    else if (mouth === 'yawn') { g.beginPath(); g.ellipse(0, my + 14, 26, 38, 0, 0, 7); g.fill(); g.stroke(); }
  }
  hat(g, r, off) {
    const o = this.o; if (!o.hat) return; g.save(); g.translate(0, -off); g.strokeStyle = INK; g.lineWidth = 7; g.fillStyle = o.hatCol;
    if (o.hat === 'top') {
      g.beginPath(); g.roundRect(-78, -r - 150, 156, 160, 8); g.fill(); g.stroke();
      g.fillStyle = o.band; g.fillRect(-76, -r - 22, 152, 26); g.strokeRect(-76, -r - 22, 152, 26);
      g.fillStyle = o.hatCol; g.beginPath(); g.ellipse(0, -r + 10, 122, 20, 0, 0, 7); g.fill(); g.stroke();
    } else if (o.hat === 'bowler') {
      g.beginPath(); g.ellipse(0, -r + 6, 132, 22, 0, 0, 7); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-88, -r + 4); g.bezierCurveTo(-92, -r - 120, 92, -r - 120, 88, -r + 4); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = o.band; g.beginPath(); g.moveTo(-88, -r - 4); g.lineTo(88, -r - 4); g.lineTo(86, -r - 26); g.lineTo(-86, -r - 26); g.closePath(); g.fill(); g.stroke();
    } else if (o.hat === 'cowboy') {
      g.beginPath(); g.moveTo(-170, -r + 0); g.quadraticCurveTo(0, -r + 40, 170, -r + 0); g.quadraticCurveTo(150, -r - 30, 90, -r - 14); g.lineTo(-90, -r - 14); g.quadraticCurveTo(-150, -r - 30, -170, -r); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-86, -r - 12); g.bezierCurveTo(-96, -r - 130, -20, -r - 110, 0, -r - 90); g.bezierCurveTo(20, -r - 110, 96, -r - 130, 86, -r - 12); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = o.band; g.fillRect(-86, -r - 36, 172, 20); g.strokeRect(-86, -r - 36, 172, 20);
    } else if (o.hat === 'bonnet') {
      g.beginPath(); g.ellipse(0, -r * 0.45, r * 1.08, r * 0.78, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = o.band; g.beginPath(); g.ellipse(0, -r * 0.45, r * 0.95, r * 0.14, 0, 0, 7); g.fill(); g.stroke();
    } else if (o.hat === 'nightcap') {
      g.beginPath(); g.moveTo(-120, -r * 0.55); g.quadraticCurveTo(0, -r - 120, 170, -r - 40); g.lineTo(120, -r * 0.5); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(178, -r - 36, 22, 0, 7); g.fill(); g.stroke();
      g.fillStyle = o.band; g.beginPath(); g.ellipse(0, -r * 0.55, 126, 24, 0, 0, 7); g.fill(); g.stroke();
    }
    g.restore();
  }
}
