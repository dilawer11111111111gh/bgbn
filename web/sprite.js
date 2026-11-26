// sprite.js : plays a character animation made in an animation program (Cartoon Animator 5, Moho, After Effects ...)
// inside the 3D world. Export each shot from the program as a transparent PNG sequence (30 fps), put it in
// <app>/actors/<shot>/0001.png, 0002.png ... and the card stands in the 3D scene, always facing the camera, with real shadow.
//   const A = new SpriteActor({ scene, dir: '../actors/s05_wallet', count: 45, t0: 5.3, height: 2.6 });   await A.ready;
//   A.update(t, V(x, y, z), cam.position)     // shows the frame for time t (holds first/last frame outside the shot)
import * as THREE from 'three';
export class SpriteActor {
  constructor(o) {
    this.o = { fps: 30, height: 2.4, anchor: 0.0, ...o }; this.frames = []; const loads = [];
    for (let i = 1; i <= this.o.count; i++) { const im = new Image(); im.src = `${this.o.dir}/${String(i).padStart(4, '0')}.png`; this.frames.push(im); loads.push(new Promise((r) => { im.onload = r; im.onerror = r; })); }
    this.ready = Promise.all(loads).then(() => { const f = this.frames.find((x) => x.naturalWidth) || { naturalWidth: 512, naturalHeight: 1024 }; this.aspect = f.naturalWidth / f.naturalHeight; this.build(); });
  }
  build() {
    const f = this.frames[0]; this.cv = document.createElement('canvas'); this.cv.width = f.naturalWidth || 512; this.cv.height = f.naturalHeight || 1024; this.g = this.cv.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    const h = this.o.height, w = h * this.aspect; const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h * (0.5 - this.o.anchor), 0);
    this.mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, toneMapped: false }));
    this.mesh.frustumCulled = false; this.mesh.visible = false; this.o.scene.add(this.mesh); this.last = -1;
  }
  update(t, pos, camPos, on = true) {
    if (!this.mesh) return; this.mesh.visible = on; if (!on) return;
    const i = Math.max(0, Math.min(this.o.count - 1, Math.floor((t - this.o.t0) * this.o.fps)));
    if (i !== this.last) { this.g.clearRect(0, 0, this.cv.width, this.cv.height); const im = this.frames[i]; if (im && im.naturalWidth) this.g.drawImage(im, 0, 0, this.cv.width, this.cv.height); this.tex.needsUpdate = true; this.last = i; }
    this.mesh.position.copy(pos); if (camPos) this.mesh.rotation.y = Math.atan2(camPos.x - pos.x, camPos.z - pos.z);
  }
}
