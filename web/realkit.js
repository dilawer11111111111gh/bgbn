// realkit.js : physically based ("game engine look") renderer kit shared by every v9 story.
// Real CC0 assets (assets/manifest.json: Poly Haven HDRI + PBR textures + glTF models), ACES tone mapping, soft shadows,
// bloom + colour grade (saturated "painted game" look), animated water, billboard SIGNS and particle BURSTS for this renderer.
import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export const Q = new URLSearchParams(location.search); const tier = Q.get('q') || 'final';
export const SC = Q.has('s') ? +Q.get('s') : ({ draft: 0.35, fast: 0.5, good: 0.75, final: 1 }[tier] || 1);
export const WD = Math.round(1080 * SC), HT = Math.round(1920 * SC), FPS = 30;
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const A = (p) => '../../' + p;
export const rng = (seed) => { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };

export const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }); window.__R = R;
R.setSize(WD, HT); R.setPixelRatio(1); R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 0.85; R.outputColorSpace = THREE.SRGBColorSpace;
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; document.body.appendChild(R.domElement);
export const scene = new THREE.Scene(); export const cam = new THREE.PerspectiveCamera(40, WD / HT, 0.05, 3000);
export const sun = new THREE.DirectionalLight(0xffe8c8, 2.6); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 220 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; scene.add(sun, sun.target);
export const hemi = new THREE.HemisphereLight(0xcfe4ff, 0xb08060, 0.4); scene.add(hemi);

// ---------- PBR material from a Poly Haven texture set ----------
const TL = new THREE.TextureLoader();
export function pbr(id, rep = [1, 1], o = {}) {
  const base = `assets/tex/${id}/`; const ld = (f, srgb) => { const t = TL.load(A(base + f)); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const arm = ld('arm.jpg'); return new THREE.MeshStandardMaterial({ map: ld('diff.jpg', true), normalMap: ld('nor.jpg'), normalScale: new THREE.Vector2(o.ns ?? 1, o.ns ?? 1), roughnessMap: arm, metalnessMap: arm, metalness: o.metal ?? 1, roughness: o.rough ?? 1, color: o.tint ? new THREE.Color(o.tint) : 0xffffff, side: o.side ?? THREE.FrontSide });
}
export const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.6, metalness: o.m ?? 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, side: o.side ?? THREE.FrontSide, transparent: !!o.op, opacity: o.op ?? 1 });
export function mesh(geo, mat, x = 0, y = 0, z = 0, cast = true) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; return m; }

// ---------- glTF models ----------
const gl = new GLTFLoader(); export const models = {};
export const loadModels = (ids) => Promise.all(ids.map((id) => new Promise((res) => gl.load(A(`assets/models/${id}/${id}.gltf`), (g) => { g.scene.traverse((m) => { if (m.isMesh) m.castShadow = m.receiveShadow = true; }); models[id] = g.scene; res(); }, undefined, () => res()))));
export function place(id, x, y, z, s = 1, ry = 0, parent = scene) { if (!models[id]) return null; const m = models[id].clone(); m.position.set(x, y, z); m.scale.setScalar(s); m.rotation.y = ry; parent.add(m); return m; }

// ---------- sky + environment ----------
export async function sky(id = 'kloofendal_48d_partly_cloudy_puresky', o = {}) {
  const hdr = await new HDRLoader().loadAsync(A(`assets/hdri/${id}.hdr`)); hdr.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(R); scene.environment = pm.fromEquirectangular(hdr).texture; scene.background = hdr; scene.backgroundIntensity = o.bg ?? 1.0; scene.environmentIntensity = o.env ?? 0.75;
  if (o.rot) { scene.backgroundRotation.y = o.rot; scene.environmentRotation.y = o.rot; }
}
export const ready = () => new Promise((r) => { THREE.DefaultLoadingManager.onLoad = r; setTimeout(r, 20000); });

// ---------- animated water (normal-mapped, reflective, see-through enough to watch things sink) ----------
function noiseNormal(size = 256, seed = 3) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'); const img = g.createImageData(size, size); const r = rng(seed); const W = [];
  for (let i = 0; i < 14; i++) W.push([1 + Math.floor(r() * 6), 1 + Math.floor(r() * 6), r() * 6.28, 0.4 + r()]);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { let dx = 0, dy = 0; for (const [fx, fy, ph, a] of W) { const u = (x / size) * fx * 6.283, v = (y / size) * fy * 6.283, k = Math.cos(u + v + ph) * a; dx += k * fx; dy += k * fy; }
    const n = new THREE.Vector3(-dx * 0.05, -dy * 0.05, 1).normalize(); const i = (y * size + x) * 4; img.data[i] = (n.x * 0.5 + 0.5) * 255; img.data[i + 1] = (n.y * 0.5 + 0.5) * 255; img.data[i + 2] = (n.z * 0.5 + 0.5) * 255; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
export function water(w = 600, d = 600, o = {}) {
  const nm = noiseNormal(); nm.repeat.set(w / 14, d / 14); const nm2 = nm.clone(); nm2.repeat.set(w / 31, d / 31); nm2.needsUpdate = true;
  const mat = new THREE.MeshPhysicalMaterial({ color: o.color ?? 0x2a9aa8, roughness: 0.06, metalness: 0.0, normalMap: nm, normalScale: new THREE.Vector2(0.55, 0.55), transparent: true, opacity: o.opacity ?? 0.86, envMapIntensity: 1.2, clearcoat: 0.6, clearcoatRoughness: 0.08, clearcoatNormalMap: nm2, side: THREE.DoubleSide });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; m.renderOrder = 2;
  m.userData.tick = (t) => { nm.offset.set(t * 0.03, t * 0.017); nm2.offset.set(-t * 0.012, t * 0.021); };
  return m;
}

// ---------- signs (always readable, auto-fit inside the frame) ----------
const INK = '#2a1810';
export class Sign {
  constructor(text, o = {}) {
    this.o = { bg: '#f6d84a', fg: '#2a1810', h: 0.8, panel: true, font: 'bold 150px "DejaVu Sans", sans-serif', ...o };
    const tmp = document.createElement('canvas').getContext('2d'); tmp.font = this.o.font; const tw = tmp.measureText(text).width; const Wc = Math.ceil(tw + 140), Hc = 230;
    const c = document.createElement('canvas'); c.width = Wc; c.height = Hc; const g = c.getContext('2d'); g.font = this.o.font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    if (this.o.panel) { g.fillStyle = INK; g.beginPath(); g.roundRect(8, 14, Wc - 16, Hc - 22, 40); g.fill(); g.fillStyle = this.o.bg; g.beginPath(); g.roundRect(14, 8, Wc - 28, Hc - 28, 36); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.roundRect(30, 18, Wc - 60, 40, 20); g.fill(); g.fillStyle = this.o.fg; g.fillText(text, Wc / 2, Hc / 2 - 8); }
    else { g.lineWidth = 26; g.strokeStyle = INK; g.strokeText(text, Wc / 2, Hc / 2); g.fillStyle = this.o.bg; g.fillText(text, Wc / 2, Hc / 2); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const h = this.o.h, w = h * Wc / Hc; this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
    this.mesh.renderOrder = 60; this.mesh.visible = false; this.mesh.frustumCulled = false; scene.add(this.mesh);
  }
  update(t, t0, t1, p) {
    const on = t >= t0 && t <= t1 && !(window.NOSIGNS && !this.o.keep); this.mesh.visible = on; if (!on) return;
    const u = Math.min(1, (t - t0) / 0.22), out = Math.min(1, (t1 - t) / 0.15), s = 2.2; const k = (1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2)) * out;
    this.mesh.position.copy(typeof p === 'function' ? p(t) : p); const d = cam.position.distanceTo(this.mesh.position); const fw = 2 * d * Math.tan((cam.fov * Math.PI) / 360) * cam.aspect;
    const w = this.mesh.geometry.parameters.width; const fit = w > fw * 0.82 ? (fw * 0.82) / w : 1; this.mesh.scale.setScalar(Math.max(0.001, k * fit));
    this.mesh.quaternion.copy(cam.quaternion); this.mesh.rotateZ(0.05 * Math.sin(t * 5 + t0));
    this.mesh.updateMatrixWorld(); const q = this.mesh.position.clone().project(cam); const hw = (w * this.mesh.scale.x) / fw, hh = (this.mesh.geometry.parameters.height * this.mesh.scale.y) / (fw / cam.aspect);
    let dx = 0, dy = 0; if (q.x + hw > 0.92) dx = 0.92 - (q.x + hw); else if (q.x - hw < -0.92) dx = -0.92 - (q.x - hw); if (q.y + hh > 0.86) dy = 0.86 - (q.y + hh); if (q.y - hh < -0.62) dy = -0.62 - (q.y - hh);
    if (dx || dy) { const right = V().setFromMatrixColumn(cam.matrixWorld, 0), up = V().setFromMatrixColumn(cam.matrixWorld, 1); this.mesh.position.addScaledVector(right, dx * fw / 2).addScaledVector(up, dy * fw / cam.aspect / 2); }
  }
}

// ---------- particle bursts (sprites) ----------
const ctex = (s, fn) => { const c = document.createElement('canvas'); c.width = c.height = s; fn(c.getContext('2d'), s); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
export const PT = {
  spark: ctex(64, (g) => { const gr = g.createRadialGradient(32, 32, 1, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,230,1)'); gr.addColorStop(0.3, 'rgba(255,200,80,0.95)'); gr.addColorStop(1, 'rgba(255,110,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }),
  smoke: ctex(128, (g) => { for (let i = 0; i < 7; i++) { const x = 34 + (i % 3) * 30, y = 40 + Math.floor(i / 3) * 26, rr = 30 + (i % 2) * 10; const gr = g.createRadialGradient(x, y, 2, x, y, rr); gr.addColorStop(0, 'rgba(250,250,250,0.95)'); gr.addColorStop(1, 'rgba(235,235,240,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); } }),
  splash: ctex(128, (g) => { for (let i = 0; i < 9; i++) { const x = 30 + (i % 3) * 34, y = 30 + Math.floor(i / 3) * 34, rr = 26; const gr = g.createRadialGradient(x, y, 2, x, y, rr); gr.addColorStop(0, 'rgba(255,255,255,0.98)'); gr.addColorStop(0.6, 'rgba(200,240,255,0.7)'); gr.addColorStop(1, 'rgba(180,230,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); } }),
  bubble: ctex(64, (g) => { g.strokeStyle = 'rgba(230,250,255,0.95)'; g.lineWidth = 5; g.beginPath(); g.arc(32, 32, 24, 0, 7); g.stroke(); g.fillStyle = 'rgba(200,240,255,0.25)'; g.fill(); g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(24, 22, 6, 0, 7); g.fill(); }),
  confetti: ctex(32, (g) => { g.fillStyle = '#fff'; g.fillRect(4, 10, 24, 12); }),
  star: ctex(64, (g) => { g.fillStyle = '#fff6b0'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 8 : 30; g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } g.closePath(); g.fill(); }),
};
const COLS = [0xe2463a, 0xf2c63a, 0x3a8ad8, 0x4ab84a, 0xe88ad8]; const hsh = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export class Burst {
  constructor(o = {}) {
    this.o = { n: 30, dur: 0.3, life: 0.8, speed: [2, 5], dir: [0, 1, 0], spread: 0.8, g: -9, size: [0.1, 0.25], grow: 0, tex: 'spark', add: false, opacity: 1, seed: 1, ...o }; this.ps = [];
    for (let i = 0; i < this.o.n; i++) { const mat = new THREE.SpriteMaterial({ map: PT[this.o.tex], transparent: true, depthWrite: false, opacity: this.o.opacity, blending: this.o.add ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: !this.o.add });
      if (this.o.tex === 'confetti') mat.color.setHex(COLS[i % COLS.length]); const m = new THREE.Sprite(mat); m.visible = false; m.renderOrder = 10; scene.add(m);
      const s = this.o.seed * 97 + i * 13; const d = V(...this.o.dir).normalize(); const r = V(hsh(s) - 0.5, hsh(s + 1) - 0.5, hsh(s + 2) - 0.5).multiplyScalar(2 * this.o.spread); const v = d.add(r).normalize().multiplyScalar(this.o.speed[0] + hsh(s + 3) * (this.o.speed[1] - this.o.speed[0]));
      this.ps.push({ m, v, b: hsh(s + 4) * this.o.dur, sz: this.o.size[0] + hsh(s + 5) * (this.o.size[1] - this.o.size[0]), rot: hsh(s + 6) * 6.28 }); }
  }
  update(t, t0, origin, repeat = 0, on = true) {
    for (const p of this.ps) { let age = t - t0 - p.b; if (repeat > 0 && t >= t0) { age = ((t - t0 - p.b) % repeat + repeat) % repeat; if (t - t0 < p.b) age = -1; }
      const vis = on && age >= 0 && age <= this.o.life && t >= t0; p.m.visible = vis; if (!vis) continue; const O = typeof origin === 'function' ? origin(t - age) : origin;
      p.m.position.set(O.x + p.v.x * age, O.y + p.v.y * age + 0.5 * this.o.g * age * age, O.z + p.v.z * age); const k = age / this.o.life; const s = p.sz * (1 + this.o.grow * k); p.m.scale.set(s, s, s); p.m.material.opacity = this.o.opacity * (1 - k * k); p.m.material.rotation = p.rot + age * 3; }
  }
}

// ---------- post: bloom + saturated painted-game grade + vignette ----------
export function makeComposer(o = {}) {
  const composer = new EffectComposer(R, new THREE.WebGLRenderTarget(WD, HT, { samples: o.msaa ?? 4, type: THREE.HalfFloatType })); composer.addPass(new RenderPass(scene, cam));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(WD, HT), o.bloom ?? 0.22, 0.5, 1.5)); composer.addPass(new OutputPass());
  const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uSat: { value: o.sat ?? 1.35 }, uCon: { value: o.con ?? 1.08 }, uFade: { value: 0 }, uFlash: { value: 0 }, uTint: { value: new THREE.Color(1.03, 1.0, 0.96) } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform sampler2D tDiffuse; uniform float uSat; uniform float uCon; uniform float uFade; uniform float uFlash; uniform vec3 uTint; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); float l = dot(c.rgb, vec3(0.299,0.587,0.114)); c.rgb = mix(vec3(l), c.rgb, uSat); c.rgb = (c.rgb - 0.5) * uCon + 0.5; c.rgb *= uTint; vec2 q = vUv - 0.5; c.rgb *= mix(0.8, 1.0, smoothstep(0.75, 0.25, length(q * vec2(1.0, 0.8)))); c.rgb += uFlash; c.rgb = mix(c.rgb, vec3(0.0), uFade); gl_FragColor = c; }' });
  composer.addPass(grade); composer.grade = grade; return composer;
}
// apply a Cine camera result
export function setCam(c) { cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); if (c.roll) cam.rotateZ(c.roll); cam.fov = c.fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld(); sun.target.position.set(c.look[0], 0, c.look[2]); sun.position.set(c.look[0] - 40, 60, c.look[2] + 30); }
// framing QA: is a world point inside the frame (with margin)?
export function inFrame(p, m = 0.9) { const q = p.clone().project(cam); return Math.abs(q.x) < m && Math.abs(q.y) < m && q.z < 1; }
