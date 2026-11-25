// fx.js : deterministic effects for the flat+3D style: pop-up SIGNS (billboard labels), particle BURSTS (sparks, smoke, dust,
// coins, shavings, confetti), 3D DEBRIS (planks/bricks flying), all pure functions of time t (safe for parallel rendering).
import * as THREE from 'three';
import * as C from './core.js';
const INK = '#2a1810';
const canvasTex = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8; return t; };
const backOut = (u) => { const s = 2.2; return 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); };

// ---------- pop-up sign: bold text on a rounded panel with ink outline (or plain outlined text) ----------
export class Sign {
  constructor(text, o = {}) {
    this.o = { bg: '#f6d84a', fg: '#2a1810', h: 0.8, panel: true, font: 'bold 150px "DejaVu Sans", sans-serif', arrow: null, ...o };
    const tmp = document.createElement('canvas').getContext('2d'); tmp.font = this.o.font; const tw = tmp.measureText(text).width;
    const W = Math.ceil(tw + 140 + (this.o.arrow ? 160 : 0)), H = 230;
    this.tex = canvasTex(W, H, (g) => {
      g.font = this.o.font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
      if (this.o.panel) { g.fillStyle = INK; g.beginPath(); g.roundRect(8, 14, W - 16, H - 22, 40); g.fill(); g.fillStyle = this.o.bg; g.beginPath(); g.roundRect(14, 8, W - 28, H - 28, 36); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.roundRect(30, 18, W - 60, 40, 20); g.fill(); }
      const cx = W / 2 - (this.o.arrow === 'right' ? 70 : this.o.arrow === 'left' ? -70 : 0);
      if (!this.o.panel) { g.lineWidth = 26; g.strokeStyle = INK; g.strokeText(text, cx, H / 2); }
      g.fillStyle = this.o.panel ? this.o.fg : this.o.bg; g.fillText(text, cx, H / 2 - (this.o.panel ? 8 : 0));
      if (this.o.arrow) { const ax = this.o.arrow === 'right' ? W - 120 : 120, d = this.o.arrow === 'right' ? 1 : -1; g.fillStyle = this.o.fg; g.beginPath(); g.moveTo(ax - d * 50, H / 2 - 30); g.lineTo(ax + d * 20, H / 2 - 30); g.lineTo(ax + d * 20, H / 2 - 60); g.lineTo(ax + d * 75, H / 2 - 8); g.lineTo(ax + d * 20, H / 2 + 44); g.lineTo(ax + d * 20, H / 2 + 14); g.lineTo(ax - d * 50, H / 2 + 14); g.closePath(); g.fill(); }
    });
    const h = this.o.h, w = h * W / H; const mat = C.cardMat(this.tex); mat.depthTest = false; mat.depthWrite = false; this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); this.mesh.renderOrder = 50; this.mesh.frustumCulled = false; this.mesh.visible = false; C.stage.cards.add(this.mesh);   // signs always readable, never cut by walls
    this.pos = new THREE.Vector3();
  }
  // show between t0..t1 at world point p (Vector3 or fn), pops in with overshoot and wobbles
  update(t, t0, t1, p, cam) {
    const on = t >= t0 && t <= t1; this.mesh.visible = on; if (!on) return;
    const u = Math.min(1, (t - t0) / 0.22), out = Math.min(1, (t1 - t) / 0.15); const k = backOut(u) * out;
    this.mesh.position.copy(typeof p === 'function' ? p(t) : p); this.mesh.scale.setScalar(Math.max(0.001, k));
    if (cam) { this.mesh.lookAt(cam); this.mesh.rotateZ(0.06 * Math.sin(t * 5 + t0)); }
  }
}

// ---------- particle textures ----------
export const FXT = {
  spark: canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 1, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,230,1)'); gr.addColorStop(0.3, 'rgba(255,210,90,0.95)'); gr.addColorStop(1, 'rgba(255,120,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }),
  smoke: canvasTex(128, 128, (g) => { for (let i = 0; i < 6; i++) { const x = 40 + (i % 3) * 24, y = 44 + Math.floor(i / 3) * 30, r = 34 + (i % 2) * 8; const gr = g.createRadialGradient(x, y, 2, x, y, r); gr.addColorStop(0, 'rgba(245,245,245,0.9)'); gr.addColorStop(0.7, 'rgba(225,225,228,0.6)'); gr.addColorStop(1, 'rgba(220,220,225,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); } g.strokeStyle = 'rgba(80,80,90,0.35)'; g.lineWidth = 3; g.beginPath(); g.arc(64, 64, 52, 0, 7); g.stroke(); }),
  dust: canvasTex(128, 128, (g) => { for (let i = 0; i < 5; i++) { const x = 40 + (i % 3) * 24, y = 50 + Math.floor(i / 3) * 26; const gr = g.createRadialGradient(x, y, 2, x, y, 38); gr.addColorStop(0, 'rgba(226,196,150,0.85)'); gr.addColorStop(1, 'rgba(226,196,150,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); } }),
  coin: canvasTex(64, 64, (g) => { g.fillStyle = '#f2c63a'; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.arc(32, 32, 26, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#b8862a'; g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', 32, 34); }),
  shaving: canvasTex(64, 64, (g) => { g.strokeStyle = '#d8a050'; g.lineWidth = 7; g.beginPath(); for (let a = 0; a < 12; a += 0.3) g.lineTo(32 + Math.cos(a) * (4 + a * 2), 32 + Math.sin(a) * (4 + a * 2)); g.stroke(); }),
  confetti: canvasTex(32, 32, (g) => { g.fillStyle = '#fff'; g.fillRect(4, 10, 24, 12); }),
  star: canvasTex(64, 64, (g) => { g.fillStyle = '#fff6b0'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 8 : 30; g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } g.closePath(); g.fill(); }),
  glass: canvasTex(64, 64, (g) => { g.fillStyle = 'rgba(200,235,255,0.9)'; g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(10, 10); g.lineTo(54, 20); g.lineTo(30, 56); g.closePath(); g.fill(); g.stroke(); }),
  card: canvasTex(48, 64, (g) => { g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = 3; g.fillRect(4, 4, 40, 56); g.strokeRect(4, 4, 40, 56); g.fillStyle = '#d02a2a'; g.font = 'bold 26px sans-serif'; g.fillText('♥', 12, 42); }),
};
const COLS = [0xe2463a, 0xf2c63a, 0x3a8ad8, 0x4ab84a, 0xe88ad8];
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- burst: n particles born over [t0, t0+dur] from origin, ballistic, fade ----------
export class Burst {
  constructor(o = {}) {
    this.o = { n: 30, dur: 0.3, life: 0.8, speed: [2, 5], dir: [0, 1, 0], spread: 0.8, g: -9, size: [0.08, 0.2], grow: 0, tex: 'spark', add: true, opacity: 1, seed: 1, spin: 0, tint: null, ...o };
    this.ps = []; const add = this.o.add;
    for (let i = 0; i < this.o.n; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), C.fxMat(FXT[this.o.tex], { add: add ? 0.3 : 0, opacity: this.o.opacity })); m.frustumCulled = false; m.visible = false; m.renderOrder = 5; C.stage.cards.add(m);
      if (this.o.tex === 'confetti') m.material.uniforms.uTint.value.setHex(COLS[i % COLS.length]);
      const s = this.o.seed * 97 + i * 13; const d = new THREE.Vector3(...this.o.dir).normalize(); const r = new THREE.Vector3(hash(s) - 0.5, hash(s + 1) - 0.5, hash(s + 2) - 0.5).multiplyScalar(2 * this.o.spread); const v = d.add(r).normalize().multiplyScalar(this.o.speed[0] + hash(s + 3) * (this.o.speed[1] - this.o.speed[0]));
      this.ps.push({ m, v, b: hash(s + 4) * this.o.dur, sz: this.o.size[0] + hash(s + 5) * (this.o.size[1] - this.o.size[0]), sp: (hash(s + 6) - 0.5) * this.o.spin }); }
  }
  // origin: Vector3 or fn(t); t0 = start time; repeat = loop period (for continuous emitters)
  update(t, t0, origin, cam, repeat = 0) {
    for (const p of this.ps) {
      let age = t - t0 - p.b; if (repeat > 0 && t >= t0) { age = ((t - t0 - p.b) % repeat + repeat) % repeat; if (t - t0 < p.b) age = -1; }
      const on = age >= 0 && age <= this.o.life && t >= t0; p.m.visible = on; if (!on) continue;
      const O = typeof origin === 'function' ? origin(t - age) : origin;
      p.m.position.set(O.x + p.v.x * age, O.y + p.v.y * age + 0.5 * this.o.g * age * age, O.z + p.v.z * age);
      const k = age / this.o.life; const s = p.sz * (1 + this.o.grow * k); p.m.scale.set(s, s, s); p.m.material.uniforms.uOpacity.value = this.o.opacity * (1 - k * k);
      if (cam) { p.m.lookAt(cam); p.m.rotateZ(p.sp * age + p.b * 7); }
    }
  }
}

// ---------- 3D debris: real meshes (planks, bricks) that fly from a wall when hit at time tHit ----------
export class Debris {
  constructor(parent, pieces, o = {}) {   // pieces: [{mesh, v:[x,y,z], spin:[x,y,z]}]  meshes already placed in the wall
    this.o = { g: -9.8, floor: 0, ...o }; this.p = pieces.map((q) => ({ ...q, p0: q.mesh.position.clone(), r0: q.mesh.rotation.clone() })); for (const q of this.p) parent.add(q.mesh);
  }
  update(t, tHit) {
    for (const q of this.p) { const a = Math.max(0, t - tHit - (q.delay || 0)); const m = q.mesh; if (a <= 0) { m.position.copy(q.p0); m.rotation.copy(q.r0); continue; }
      const y = q.p0.y + q.v[1] * a + 0.5 * this.o.g * a * a; const landed = y < this.o.floor + 0.08; const ta = landed ? Math.max(0, (-q.v[1] - Math.sqrt(Math.max(0, q.v[1] * q.v[1] - 2 * this.o.g * (q.p0.y - this.o.floor - 0.08)))) / this.o.g) : a;
      const aa = landed ? ta : a; m.position.set(q.p0.x + q.v[0] * aa, landed ? this.o.floor + 0.08 : y, q.p0.z + q.v[2] * aa);
      m.rotation.set(q.r0.x + q.spin[0] * aa, q.r0.y + q.spin[1] * aa, q.r0.z + q.spin[2] * aa); }
  }
}
