// dog2d.js : flat cartoon dog card (same ink style as Flat2D) for the PBR scene. Profile view, faces screen-left (flip: true = right).
//   const D = new Dog2D({ scene, coat:'#d8a060', ear:'#7a4a26', size:0.9 }); D.place(x,y,z); D.update({ walk, amp, wag, chew, tilt, hop, squash, lie, eyes, look, tongue, ball, flip }, camPos)
import * as THREE from 'three';
const INK = '#2a1810', R = (d) => (d * Math.PI) / 180;
let SHT = null;
function shadowTex() { const c = document.createElement('canvas'); c.width = 128; c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 32, 4, 64, 32, 60); gr.addColorStop(0, 'rgba(0,0,0,0.42)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 64); return new THREE.CanvasTexture(c); }
export class Dog2D {
  constructor(o = {}) {
    this.o = { coat: '#d89a5a', belly: '#fbf2e2', ear: '#7a4626', spot: '#b87a40', collar: '#d8302a', size: 0.95, res: 2, seed: 1, ...o };
    const S = this.o.res; this.cv = document.createElement('canvas'); this.cv.width = this.cv.height = Math.round(512 * S); this.g = this.cv.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    const h = this.o.size; const geo = new THREE.PlaneGeometry(h, h); geo.translate(0, h / 2 - h * 0.06, 0);
    this.mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: this.tex, color: 0xeeeae4, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, toneMapped: false })); this.mesh.frustumCulled = false; this.o.scene.add(this.mesh);
    SHT = SHT || shadowTex(); this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(h * 0.8, h * 0.3), new THREE.MeshBasicMaterial({ map: SHT, transparent: true, depthWrite: false, toneMapped: false })); this.shadow.rotation.x = -Math.PI / 2; this.shadow.renderOrder = -5; this.o.scene.add(this.shadow);
    this.pos = new THREE.Vector3();
  }
  place(x, y, z) { this.pos.set(x, y, z); return this; }
  headWorld() { return this.pos.clone().add(new THREE.Vector3(0, this.o.size * 0.55, 0)); }
  update(p = {}, cam) {
    this.draw(p); this.tex.needsUpdate = true; this.mesh.position.copy(this.pos); this.mesh.visible = true;
    if (cam) this.mesh.rotation.y = Math.atan2(cam.x - this.pos.x, cam.z - this.pos.z);
    this.shadow.position.set(this.pos.x, this.pos.y + 0.012, this.pos.z); this.shadow.visible = true;
  }
  hide() { this.mesh.visible = false; this.shadow.visible = false; }
  draw(p) {
    const g = this.g, o = this.o, S = o.res, T = p.t ?? 0; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.cv.width, this.cv.height); g.setTransform(S, 0, 0, S, 0, 0);
    g.lineJoin = 'round'; g.lineCap = 'round'; if (p.flip) { g.translate(512, 0); g.scale(-1, 1); }
    const lie = p.lie || 0, hop = p.hop || 0, sq = p.squash || 0, ph = p.walk || 0, amp = p.amp || 0;
    const by = 318 + lie * 92 - hop; g.save(); g.translate(270, by); g.scale(1 + sq * 0.12, 1 - sq * 0.12); g.rotate(R(p.lean || 0)); g.translate(-270, -by);
    // legs (thin ink lines like the people) — back pair drawn first (darker), front pair over the body
    const leg = (x, s, far) => { const a = R(amp * Math.sin(ph + s)); const L = lie ? 30 : 118; const kx = x + Math.sin(a) * L * 0.55, ky = by + 40 + Math.cos(a) * L * 0.5; const fx = lie ? x - 46 : x + Math.sin(a) * L, fy = lie ? by + 66 : Math.min(470 + (by - 318), by + 40 + Math.cos(a) * L);
      g.strokeStyle = far ? '#4a3020' : INK; g.lineWidth = 15; g.beginPath(); g.moveTo(x, by + 20); g.quadraticCurveTo(kx, ky, fx, fy); g.stroke(); g.fillStyle = far ? '#4a3020' : INK; g.beginPath(); g.ellipse(fx - 9, fy + 1, 17, 9, 0, 0, 7); g.fill(); };
    leg(206, Math.PI, true); leg(336, 0, true);
    // tail: curly, wagging
    { const w = Math.sin(T * (p.wag ?? 14)) * 26 * (p.wag === 0 ? 0 : 1); g.strokeStyle = INK; g.lineWidth = 20; g.beginPath(); g.moveTo(372, by - 18); g.quadraticCurveTo(420 + w * 0.3, by - 60, 418 + w, by - 112); g.stroke(); g.strokeStyle = o.coat; g.lineWidth = 9; g.beginPath(); g.moveTo(372, by - 18); g.quadraticCurveTo(420 + w * 0.3, by - 60, 418 + w, by - 112); g.stroke(); }
    // body
    g.beginPath(); g.ellipse(272, by, 112, 64, 0, 0, 7); g.fillStyle = o.coat; g.fill(); g.save(); g.clip();
    g.fillStyle = o.belly; g.beginPath(); g.ellipse(262, by + 50, 90, 34, 0, 0, 7); g.fill(); g.fillStyle = o.spot; g.beginPath(); g.ellipse(318, by - 30, 40, 28, 0.3, 0, 7); g.fill();
    { const gr = g.createLinearGradient(0, by - 64, 0, by + 64); gr.addColorStop(0, 'rgba(255,255,255,0.25)'); gr.addColorStop(0.6, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(40,20,10,0.25)'); g.fillStyle = gr; g.fillRect(150, by - 70, 250, 140); }
    g.restore(); g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.ellipse(272, by, 112, 64, 0, 0, 7); g.stroke();
    leg(222, 0, false); leg(352, Math.PI, false);
    // collar
    g.save(); g.translate(190, by - 30); g.rotate(R(-28)); g.fillStyle = o.collar; g.beginPath(); g.roundRect(-16, -44, 30, 92, 12); g.fill(); g.lineWidth = 4; g.stroke(); g.restore(); g.fillStyle = '#f2c63a'; g.beginPath(); g.arc(178, by + 14, 11, 0, 7); g.fill(); g.lineWidth = 3; g.stroke();
    // head (pivot at the neck): tilt + chew (jaw)
    const hx = 150, hy = by - 92; g.save(); g.translate(190, by - 40); g.rotate(R(p.tilt || 0)); g.translate(-190, -(by - 40));
    const chew = Math.max(0, Math.min(1, p.chew || 0)), jaw = R(6 + 26 * chew);
    // ear behind (far)
    g.fillStyle = '#5a3418'; g.beginPath(); g.ellipse(hx + 40, hy - 20, 22, 46, R(30 + (p.ears || 0) * 20), 0, 7); g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
    // lower jaw (rotates down)
    g.save(); g.translate(hx + 10, hy + 40); g.rotate(-jaw); g.translate(-(hx + 10), -(hy + 40));
    g.fillStyle = '#a8303a'; g.beginPath(); g.moveTo(hx + 14, hy + 30); g.quadraticCurveTo(hx - 50, hy + 34, hx - 78, hy + 38); g.quadraticCurveTo(hx - 70, hy + 70, hx - 20, hy + 70); g.quadraticCurveTo(hx + 20, hy + 66, hx + 14, hy + 30); g.fill(); g.lineWidth = 5; g.stroke();
    if (p.tongue) { g.fillStyle = '#f27a8a'; g.beginPath(); g.ellipse(hx - 46, hy + 60 + 8 * p.tongue, 22, 16 + 10 * p.tongue, 0.2, 0, 7); g.fill(); g.lineWidth = 4; g.stroke(); }
    g.fillStyle = o.belly; g.beginPath(); g.ellipse(hx - 36, hy + 62, 44, 14, 0, 0, 7); g.fill(); g.lineWidth = 5; g.stroke();
    g.restore();
    // head + snout
    g.fillStyle = o.coat; g.beginPath(); g.ellipse(hx, hy, 74, 66, 0, 0, 7); g.fill(); g.lineWidth = 6; g.stroke();
    g.fillStyle = o.belly; g.beginPath(); g.ellipse(hx - 54, hy + 22, 50, 32, -0.1, 0, 7); g.fill(); g.lineWidth = 5; g.stroke();
    if (chew > 0.15) { g.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(hx - 90 + i * 18, hy + 46); g.lineTo(hx - 82 + i * 18, hy + 58); g.lineTo(hx - 74 + i * 18, hy + 46); g.closePath(); g.fill(); g.lineWidth = 2; g.stroke(); } }
    if (p.ball) { g.fillStyle = '#f4f2ea'; g.beginPath(); g.arc(hx - 94, hy + 54, 22, 0, 7); g.fill(); g.lineWidth = 4; g.stroke(); g.fillStyle = 'rgba(90,90,110,0.45)'; for (const [x, y] of [[-6, -6], [6, 2], [-4, 8], [8, -10]]) { g.beginPath(); g.arc(hx - 94 + x, hy + 54 + y, 4, 0, 7); g.fill(); } }
    g.fillStyle = INK; g.beginPath(); g.ellipse(hx - 102, hy + 10, 18, 13, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(hx - 106, hy + 5, 6, 3, 0, 0, 7); g.fill();
    // eye(s)
    const ey = p.eyes || 'open', lk = p.look || [0, 0]; g.strokeStyle = INK; g.lineWidth = 5;
    if (ey === 'happy') { g.lineWidth = 7; g.beginPath(); g.arc(hx - 18, hy - 12, 16, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
    else if (ey === 'closed') { g.lineWidth = 7; g.beginPath(); g.moveTo(hx - 34, hy - 10); g.quadraticCurveTo(hx - 18, hy, hx - 2, hy - 10); g.stroke(); }
    else { const r = ey === 'wide' ? 26 : 22; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(hx - 18, hy - 14, r * 0.85, r, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(hx - 22 + lk[0] * 8, hy - 12 + lk[1] * 8, ey === 'wide' ? 8 : 11, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(hx - 26 + lk[0] * 8, hy - 17 + lk[1] * 8, 3.5, 0, 7); g.fill();
      if (p.lid) { g.fillStyle = o.coat; g.beginPath(); g.rect(hx - 44, hy - 40, 52, 52 * p.lid); g.fill(); g.beginPath(); g.moveTo(hx - 42, hy - 40 + 52 * p.lid); g.lineTo(hx + 6, hy - 40 + 52 * p.lid); g.stroke(); } }
    g.lineWidth = 6; g.beginPath(); g.moveTo(hx - 40, hy - 46 - (p.brow || 0) * 10); g.quadraticCurveTo(hx - 20, hy - 54 - (p.brow || 0) * 12, hx, hy - 46 - (p.brow || 0) * 6); g.stroke();
    // near ear (floppy)
    { const fl = (p.ears || 0) + 0.2 * Math.sin(T * 9) * (hop > 0 ? 1 : 0.25); g.save(); g.translate(hx + 20, hy - 46); g.rotate(R(18 + fl * 30)); g.fillStyle = o.ear; g.beginPath(); g.moveTo(-10, 0); g.quadraticCurveTo(-26, 50, -8, 96); g.quadraticCurveTo(14, 104, 26, 84); g.quadraticCurveTo(30, 30, 14, -4); g.closePath(); g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); g.restore(); }
    g.restore(); g.restore();
  }
}
