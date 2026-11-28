// crowd.js — thousands of Flat2D-style people in one draw call.
// 1) makeAtlas(variants, frames): draws every (variant × frame-pose) with Flat2D into one texture atlas.
// 2) new Crowd(atlas, spots): an InstancedMesh of camera-facing cards; each person has its own variant, scale,
//    animation phase and speed. Per-group controls: mode (0 idle, 1 alternate action frames, 2 hold frame 2),
//    bob (march/cheer bounce), march (stepping), tint, and a "hit" set that gets tossed in the air at clashT.
import * as THREE from 'three';
import { Flat2D } from './flat2d.js';
import { scene } from './realkit.js';

const CW = 128, CH = 331;   // atlas cell (Flat2D card 512x1324 at res 0.5 -> 256x662, scaled by 0.5)
export function makeAtlas(variants, frames) {   // variants: [Flat2D options], frames: [pose objects] (3 recommended: idle, actionA, actionB)
  const n = variants.length * frames.length, cols = 8, rows = Math.ceil(n / cols); const cv = document.createElement('canvas'); cv.width = cols * CW; cv.height = rows * CH; const g = cv.getContext('2d');
  const dummy = new THREE.Group(); let k = 0;
  variants.forEach((o, vi) => { const F = new Flat2D({ size: 1.95, res: 0.5, headroom: 300, seed: vi + 1, ...o, wide: false, scene: dummy });
    frames.forEach((p) => { Flat2D.T = 0.37 * vi; Flat2D.E = 0; Flat2D.ON = 0; F.update({ noBlink: true, noIdle: true, e: 0, ...p }); const c = k % cols, r = Math.floor(k / cols); g.drawImage(F.cv, c * CW, r * CH, CW, CH); k++; }); });
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
  return { tex, cols, rows, frames: frames.length, variants: variants.length, aspect: CW / CH, canvas: cv };
}
const VS = `
attribute vec3 aOff; attribute float aScale; attribute float aVar; attribute float aPhase; attribute float aRate; attribute float aHit;
uniform vec3 uCam; uniform float uTime, uBob, uMarch, uMode, uClashT, uFrames, uCols, uRows, uAspect, uFlip;
varying vec2 vUv; varying float vDist;
void main(){
  vec3 base = (modelMatrix * vec4(aOff, 1.0)).xyz;
  float t = uTime * aRate + aPhase;
  float bob = abs(sin(t * 6.2831)) * 0.07 * uBob + sin(t * 3.1415) * 0.02 * uMarch;
  float frame = uMode < 0.5 ? 0.0 : (uMode < 1.5 ? 1.0 + mod(floor(t * 2.0), 2.0) : 2.0);
  if (uMode > 2.5) frame = mod(floor(t * 2.0), uFrames);
  // tossed in the clash: arc up and back, then lie low
  float h = 0.0; float back = 0.0; if (aHit > 0.5 && uTime > uClashT) { float d = uTime - uClashT - aPhase * 0.25; if (d > 0.0) { h = max(0.0, 3.2 * d - 4.9 * d * d); back = min(d, 0.65) * 3.0; frame = 2.0; } }
  vec3 up = vec3(0.0, 1.0, 0.0); vec3 toC = uCam - base; toC.y = 0.0; vec3 right = normalize(cross(up, normalize(toC)));
  vec3 p = base + right * position.x * aScale * uAspect * uFlip + up * (position.y * aScale + bob + h) + normalize(-toC) * back * 0.0;
  p += normalize(vec3(toC.x, 0.0, toC.z)) * (-back);
  float cell = aVar * uFrames + frame; float cx = mod(cell, uCols), cy = floor(cell / uCols);
  vUv = vec2((cx + uv.x) / uCols, 1.0 - (cy + 1.0 - uv.y) / uRows);
  vec4 mv = viewMatrix * vec4(p, 1.0); vDist = -mv.z; gl_Position = projectionMatrix * mv; }`;
const FS = `
uniform sampler2D uAtlas; uniform vec3 uTint, uFog; uniform float uFogNear, uFogFar;
varying vec2 vUv; varying float vDist;
void main(){ vec4 c = texture2D(uAtlas, vUv); if (c.a < 0.4) discard; vec3 col = c.rgb * uTint; col = mix(col, uFog, smoothstep(uFogNear, uFogFar, vDist)); gl_FragColor = vec4(col, 1.0); }`;
export class Crowd {
  // spots: [{x, z, s?, v?}]  (v = variant index; omitted -> random)
  constructor(atlas, spots, o = {}) { const N = spots.length; const geo = new THREE.InstancedBufferGeometry(); const pl = new THREE.PlaneGeometry(1, 1); pl.translate(0, 0.5, 0); geo.index = pl.index; geo.setAttribute('position', pl.attributes.position); geo.setAttribute('uv', pl.attributes.uv);
    const off = new Float32Array(N * 3), sc = new Float32Array(N), va = new Float32Array(N), ph = new Float32Array(N), ra = new Float32Array(N), hit = new Float32Array(N); const rnd = mulberry(o.seed || 7);
    spots.forEach((p, i) => { off[i * 3] = p.x; off[i * 3 + 1] = p.y || 0; off[i * 3 + 2] = p.z; sc[i] = (p.s || 2.5) * (0.9 + rnd() * 0.2); va[i] = p.v ?? Math.floor(rnd() * atlas.variants) % atlas.variants; ph[i] = rnd(); ra[i] = 0.8 + rnd() * 0.5; hit[i] = rnd() < (o.hitFrac || 0) ? 1 : 0; });
    geo.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 3)); geo.setAttribute('aScale', new THREE.InstancedBufferAttribute(sc, 1)); geo.setAttribute('aVar', new THREE.InstancedBufferAttribute(va, 1)); geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(ph, 1)); geo.setAttribute('aRate', new THREE.InstancedBufferAttribute(ra, 1)); geo.setAttribute('aHit', new THREE.InstancedBufferAttribute(hit, 1)); geo.instanceCount = N;
    this.u = { uAtlas: { value: atlas.tex }, uCam: { value: new THREE.Vector3() }, uTime: { value: 0 }, uBob: { value: 0 }, uMarch: { value: 0 }, uMode: { value: 0 }, uClashT: { value: 1e9 }, uFrames: { value: atlas.frames }, uCols: { value: atlas.cols }, uRows: { value: atlas.rows }, uAspect: { value: atlas.aspect }, uFlip: { value: o.flip ? -1 : 1 },
      uTint: { value: new THREE.Color(o.tint || 0xffffff) }, uFog: { value: new THREE.Color(o.fog || 0xd8d0c0) }, uFogNear: { value: o.fogNear ?? 40 }, uFogFar: { value: o.fogFar ?? 260 } };
    this.mesh = new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, uniforms: this.u, side: THREE.DoubleSide })); this.mesh.frustumCulled = false; scene.add(this.mesh); this.N = N; }
  // per frame: camera position + time; set mode/bob/march/clash per shot
  update(t, camPos, s = {}) { const u = this.u; u.uTime.value = t; u.uCam.value.copy(camPos); u.uBob.value = s.bob ?? 0; u.uMarch.value = s.march ?? 0; u.uMode.value = s.mode ?? 0; u.uClashT.value = s.clashT ?? 1e9; this.mesh.visible = s.visible ?? true; }
}
// layout helpers
export function grid(cx, cz, cols, rows, dx, dz, jitter = 0.25, seed = 3, extra = {}) { const r = mulberry(seed), out = []; for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) out.push({ x: cx + (i - (cols - 1) / 2) * dx + (r() - 0.5) * jitter, z: cz + (j - (rows - 1) / 2) * dz + (r() - 0.5) * jitter, ...extra }); return out; }
export function blob(cx, cz, rx, rz, n, seed = 5, extra = {}) { const r = mulberry(seed), out = []; for (let i = 0; i < n; i++) { const a = r() * 6.2832, d = Math.sqrt(r()); out.push({ x: cx + Math.cos(a) * rx * d, z: cz + Math.sin(a) * rz * d, ...extra }); } return out; }
export function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- arrow volley: N arrows on ballistic arcs from a launch area to a target area (InstancedMesh)
export class Volley {
  constructor(n = 1200, o = {}) { const g1 = new THREE.CylinderGeometry(0.012, 0.012, 0.9, 5); g1.rotateZ(Math.PI / 2); const g2 = new THREE.ConeGeometry(0.03, 0.12, 6); g2.rotateZ(-Math.PI / 2); g2.translate(0.5, 0, 0);
    const g3 = new THREE.BoxGeometry(0.16, 0.06, 0.004); g3.translate(-0.4, 0, 0); const merged = mergeGeos([g1, g2, g3]);
    this.mesh = new THREE.InstancedMesh(merged, new THREE.MeshStandardMaterial({ color: o.color || 0x2a2018, roughness: 0.7 }), n); this.mesh.frustumCulled = false; scene.add(this.mesh); this.n = n; const r = mulberry(o.seed || 11);
    this.p = Array.from({ length: n }, () => ({ a: r(), b: r(), c: r(), d: r(), e: r() })); this.m = new THREE.Matrix4(); this.q = new THREE.Quaternion(); }
  // from/to: {x,z,rx,rz}; t0 launch time, T flight time, H apex height
  update(t, from, to, t0, T = 2.0, H = 30, visible = true) { const m = this.m; let k = 0; for (const p of this.p) { const tt = (t - t0 - p.e * 0.35) / T; let show = visible && tt > 0; const u = Math.min(1, Math.max(0, tt));
      const sx = from.x + (p.a - 0.5) * from.rx * 2, sz = from.z + (p.b - 0.5) * from.rz * 2, ex = to.x + (p.c - 0.5) * to.rx * 2, ez = to.z + (p.d - 0.5) * to.rz * 2; const x = sx + (ex - sx) * u, z = sz + (ez - sz) * u, y = 1.6 + 4 * H * u * (1 - u) - (u >= 1 ? 1.2 : 0);
      const vx = ex - sx, vz = ez - sz, vy = 4 * H * (1 - 2 * u); const dir = new THREE.Vector3(vx, vy * (u >= 1 ? 0.3 : 1), vz).normalize(); this.q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
      m.compose(new THREE.Vector3(x, show ? y : -50, z), this.q, new THREE.Vector3(2.4, 2.4, 2.4)); this.mesh.setMatrixAt(k++, m); } this.mesh.instanceMatrix.needsUpdate = true; }
}
function mergeGeos(gs) { const pos = [], idx = []; let off = 0; for (const g of gs) { const ng = g.index ? g : g; const p = ng.attributes.position.array; for (let i = 0; i < p.length; i++) pos.push(p[i]); const ii = ng.index.array; for (let i = 0; i < ii.length; i++) idx.push(ii[i] + off); off += p.length / 3; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; }
