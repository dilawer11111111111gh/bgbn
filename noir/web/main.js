// NOIR "THE BOSS" (20 s) on the v8 engine: 3D rainy night street + Flat2D cast + mocap + Cine camera. Cartoon action, no blood.
import * as THREE from 'three';
import { R, scene, cam, sun, hemi, V, std, mesh, sky, ready, Burst, PT, makeComposer } from '../../web/realkit.js';
import { Cine } from '../../web/cine.js';
import { Flat2D } from '../../web/flat2d.js';
import { loadMo, mo } from '../../web/mocap.js';
import { sstep, clamp, lerp } from '../../web/motion.js';
import { installActing, keys, faceK, makeSky, dynamicCam, makeRenderer } from '../../web/studio.js';
import { Batch, house, lampPost, texMat, plain, boxUV } from '../../web/world3d.js';
export const DURATION = 20;
installActing();
// =================== WORLD: street runs along z; houses on x = ±9; camera usually looks toward -z ===================
let LAMPS = [], RAIN, CAR, CRATES, HAT3D, TITLE, FLASHL, THUNDER;
function build() { const B = new Batch();
  const road = mesh(new THREE.PlaneGeometry(14, 140), (() => { const m = texMat('cobble', '#6a6a6e', { r: 0.25 }).clone(); m.roughness = 0.22; m.metalness = 0.35; return m; })()); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.001, -30); road.receiveShadow = true; scene.add(road);
  for (const s of [-1, 1]) { const sw = mesh(boxUV(3, 0.18, 140, 2), texMat('tiles', '#8a8a8a', { r: 0.4 }), s * 8.5, 0.09, -30); sw.receiveShadow = true; scene.add(sw); }
  for (let i = 0; i < 12; i++) for (const s of [-1, 1]) { const z = 10 - i * 11, gap = s > 0 && i === 3; if (gap) continue;
    house(B, s * 15, z, s > 0 ? -Math.PI / 2 : Math.PI / 2, { w: 10.5, d: 10, h: 9 + ((i * 7 + (s > 0 ? 3 : 0)) % 5) * 1.6, kind: i % 3 ? 'brick' : 'plaster', wall: '#8a8a88', roof: '#3a3a3c', shutter: '#2a2a2a', door: '#1a1a1a', flowers: false, seed: i * 2 + (s > 0 ? 1 : 0) }); }
  for (let i = 0; i < 7; i++) for (const s of [-1, 1]) { const z = 4 - i * 12 + (s > 0 ? 6 : 0); lampPost(B, s * 7.4, z, 4.4); const L = new THREE.PointLight(0xffe2b0, 14, 16, 1.6); L.position.set(s * 7.0, 4.2, z); scene.add(L); LAMPS.push(L);
    const bulb = mesh(new THREE.SphereGeometry(0.22, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff4d8, toneMapped: false }), s * 7.0, 4.25, z, false); scene.add(bulb); }
  B.flush();
  // 1940s sedan (rounded extruded body, glass, chrome, white-wall tyres)
  CAR = new THREE.Group(); { const sh = new THREE.Shape(); sh.moveTo(-2.5, 0.35); sh.quadraticCurveTo(-2.6, 0.95, -2.1, 1.0); sh.quadraticCurveTo(-1.5, 1.65, -0.4, 1.68); sh.quadraticCurveTo(0.6, 1.68, 1.05, 1.05); sh.quadraticCurveTo(2.35, 1.0, 2.55, 0.62); sh.lineTo(2.55, 0.35); sh.closePath();
    const body = mesh(new THREE.ExtrudeGeometry(sh, { depth: 1.8, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 4, curveSegments: 18 }), new THREE.MeshPhysicalMaterial({ color: 0x141416, roughness: 0.18, metalness: 0.6, clearcoat: 1, clearcoatRoughness: 0.08 })); body.position.z = -0.9; CAR.add(body);
    const glass = new THREE.MeshPhysicalMaterial({ color: 0x8890a0, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.55 }); for (const s of [-1, 1]) { const w = mesh(new THREE.PlaneGeometry(1.6, 0.48), glass, -0.45, 1.33, s * 1.03); w.rotation.y = s > 0 ? 0 : Math.PI; CAR.add(w); }
    const chrome = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.08, metalness: 1 }); CAR.add(mesh(new THREE.BoxGeometry(5.1, 0.12, 2.1), chrome, 0, 0.42, 0)); for (const s of [-1, 1]) CAR.add(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.1, 18), new THREE.MeshBasicMaterial({ color: 0xfff6dc, toneMapped: false }), 2.55, 0.85, s * 0.62).rotateZ(Math.PI / 2));
    for (const [x, z] of [[-1.6, 1], [1.6, 1], [-1.6, -1], [1.6, -1]]) { const tyre = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 24), std(0x0c0c0c, { r: 0.8 }), x, 0.42, z); tyre.rotation.x = Math.PI / 2; CAR.add(tyre); const ww = mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.34, 24), std(0xe8e8e8, { r: 0.5 }), x, 0.42, z); ww.rotation.x = Math.PI / 2; CAR.add(ww); } }
  CAR.rotation.y = Math.PI / 2; CAR.position.set(-4.4, 0, -2.4); scene.add(CAR);
  CRATES = new THREE.Group(); for (const [x, y, z, s] of [[0, 0.5, 0, 1], [1.05, 0.5, 0.1, 1], [0.5, 1.5, 0, 1], [-0.9, 0.4, 0.3, 0.8]]) { const c = mesh(boxUV(s, s, s, 1), texMat('planks', '#8a7a6a', { r: 0.8 }), x, y * s, z); c.rotation.y = x * 0.2; CRATES.add(c); } CRATES.position.set(-0.6, 0, -12.6); scene.add(CRATES);
  // rain: line streaks in a box that follows the camera
  { const N = 2600, pos = new Float32Array(N * 6); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); RAIN = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.32, toneMapped: false })); RAIN.frustumCulled = false; scene.add(RAIN); RAIN.userData.seed = Array.from({ length: N }, (_, i) => [Math.random(), Math.random(), Math.random()]); }
  // 3D fedora that flies off the rival
  HAT3D = new THREE.Group(); { const m = std(0xe0e0e0, { r: 0.6 }); HAT3D.add(mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.16, 20), m, 0, 0.08, 0)); HAT3D.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.02, 28), m, 0, 0.0, 0)); HAT3D.add(mesh(new THREE.CylinderGeometry(0.172, 0.172, 0.05, 20), std(0x1a1a1a), 0, 0.04, 0)); } HAT3D.visible = false; scene.add(HAT3D);
  FLASHL = new THREE.PointLight(0xfff0c8, 0, 12, 1.5); scene.add(FLASHL); THUNDER = new THREE.DirectionalLight(0xe8f0ff, 0); THUNDER.position.set(-10, 40, 10); scene.add(THUNDER);
  // title card on the camera
  { const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const q = c.getContext('2d'); q.textAlign = 'center'; q.fillStyle = '#f2f0ea'; q.shadowColor = 'rgba(0,0,0,0.9)'; q.shadowBlur = 24; q.font = 'bold 170px "DejaVu Serif", serif'; q.fillText('THE BOSS', 512, 230); q.font = 'italic 54px "DejaVu Serif", serif'; q.fillText('— never misses —', 512, 330);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; TITLE = mesh(new THREE.PlaneGeometry(0.36, 0.18), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthTest: false, toneMapped: false }), 0, 0.22, -1.2, false); TITLE.renderOrder = 99; scene.add(cam); cam.add(TITLE); }
}
// =================== CAST ===================
const BOSS = new Flat2D({ body: 'coat', coat: '#5c5c60', tie: '#121212', collar: '#f0f0f0', hat: 'fedora', hatCol: '#1a1a1a', band: '#a0a0a0', hair: '#141010', hairStyle: 'side', pants: { col: '#3a3a3e', len: 'ankle' }, socks: '#dcdcdc', size: 1.95, res: 2.2, wide: true, headroom: 400, seed: 5, rest: 'pockets', scene });
const RIVAL = new Flat2D({ body: 'coat', coat: '#2a2a2e', tie: '#cfcfcf', collar: '#dddddd', hat: 'fedora', hatCol: '#e2e2e2', band: '#151515', hair: '#151010', hairStyle: 'side', mustache: true, pants: { col: '#1c1c20', len: 'ankle' }, socks: '#7a7a7a', width: 1.3, size: 1.9, res: 2.2, wide: true, headroom: 400, seed: 9, scene });
const PEOPLE = [BOSS, RIVAL]; const hide = (c) => { c.mesh.visible = false; if (c.shadow) c.shadow.visible = false; };
const AIM = { armR: [92, -4] }, AIMUP = { armR: [150, -10] }, POCK = { armL: [16, -32], armR: [16, -32] };
// gunfire FX
const BURSTS = {}; const spark = (k) => (BURSTS['s' + k] ||= new Burst({ n: 26, dur: 0.04, life: 0.45, speed: [3, 8], dir: [0, 0.4, 1], spread: 1.0, g: -12, size: [0.05, 0.14], tex: 'spark', add: true, seed: k }));
const smoke = (k) => (BURSTS['m' + k] ||= new Burst({ n: 10, dur: 0.3, life: 1.4, speed: [0.2, 0.6], dir: [0, 1, 0], spread: 0.6, g: 0.4, size: [0.05, 0.11], grow: 1.4, tex: 'smoke', opacity: 0.28, seed: k + 50 }));
const shell = (k) => (BURSTS['c' + k] ||= new Burst({ n: 1, dur: 0.01, life: 0.8, speed: [2.5, 3], dir: [-0.6, 1, 0.3], spread: 0.1, g: -14, size: [0.05, 0.05], tex: 'spark', seed: k + 90 }));
const FLASHES = []; const flashSprite = () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: PT.star, color: 0xfff6dc, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); s.renderOrder = 20; s.visible = false; scene.add(s); return s; };
const TRACERS = []; const tracer = () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 6), new THREE.MeshBasicMaterial({ color: 0xfffbe8, transparent: true, opacity: 0.9, toneMapped: false })); m.visible = false; scene.add(m); return m; };
for (let i = 0; i < 3; i++) { FLASHES.push(flashSprite()); TRACERS.push(tracer()); }
function fire(i, t, t0, from, to) { const d = t - t0, F = FLASHES[i], T = TRACERS[i]; F.visible = d >= 0 && d < 0.07; if (F.visible) { F.position.copy(from); const s = 0.32 * (1 - d / 0.07) + 0.2; F.scale.set(s, s, s); F.material.rotation = t0 * 7; FLASHL.position.copy(from); FLASHL.intensity = Math.max(FLASHL.intensity, 40 * (1 - d / 0.07)); }
  const u = d / 0.1; T.visible = u > 0 && u < 1; if (T.visible) { const a = from.clone().lerp(to, Math.max(0, u - 0.35)), b = from.clone().lerp(to, u); T.position.copy(a).add(b).multiplyScalar(0.5); T.scale.set(1, a.distanceTo(b), 1); T.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); }
  spark(Math.round(t0 * 100)).update(t, t0 + 0.1, to); }
const BOSS_SHOTS = [7.45, 8.0, 8.75, 9.7, 10.6, 12.1, 12.55], RIVAL_SHOTS = [8.3, 9.15, 10.15, 11.0];
window.SFX = { boss: BOSS_SHOTS, rival: RIVAL_SHOTS, thunder: [2.4, 3.75], steps: [0.3, 0.75, 1.2, 1.65, 2.1, 2.55, 3.0, 18.7, 19.15, 19.6], draw: [6.4, 15.6, 17.6], hat: 13.8, glass: 10.2, title: 18.8, run: 14.4 };
const muzzle = (C, spin = 0) => { const h = C.handR; if (!h) return C.pos.clone(); const hd = Object.assign([...h], { ang: (h.ang || 0) + spin }); return C.toWorld(C.propPt(hd, -14, 92)); };
// swagger walk in profile: slow, shoulders rolling, leaning back, head sway, one hand in the pocket
function swag(t, per = 1.05, amp = 1) { const ph = (t / per) * Math.PI * 2, s = Math.sin(ph), c = Math.cos(ph);
  return { legL: [24 * s * amp, Math.max(0, -c) * 34 * amp], legR: [-24 * s * amp, Math.max(0, c) * 34 * amp], armL: [16, -32], armR: [22 - 18 * s, 14 + 10 * s], bob: -9 * Math.abs(s), lean: -6, tilt: 5 * s, hip: 10 * s, sway: 3 * s, headLag: 4 * c }; }
// =================== 3D PROPS: pistol (slide racks), magazine with visible rounds, bullet ===================
const steel = new THREE.MeshPhysicalMaterial({ color: 0xb8b8c0, metalness: 0.85, roughness: 0.22, clearcoat: 0.8, emissive: 0x202024 }), dark = new THREE.MeshStandardMaterial({ color: 0x55555a, metalness: 0.7, roughness: 0.35, emissive: 0x101012 }), wood = new THREE.MeshStandardMaterial({ color: 0x5a3e2a, roughness: 0.6 }), brass = new THREE.MeshPhysicalMaterial({ color: 0xc8a040, metalness: 1, roughness: 0.22 }), copper = new THREE.MeshPhysicalMaterial({ color: 0xb06a3a, metalness: 1, roughness: 0.25 });
function makeGun() { const G = new THREE.Group(), add = (geo, mat, x, y, z, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.z = rz; G.add(m); return m; };
  add(new THREE.BoxGeometry(0.15, 0.026, 0.024), dark, 0.025, 0, 0); const slide = new THREE.Group(); G.add(slide); { const s = new THREE.Mesh(new THREE.BoxGeometry(0.185, 0.034, 0.028), steel); s.position.set(0.04, 0.03, 0); slide.add(s); for (let k = 0; k < 5; k++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.03, 0.029), dark); r.position.set(-0.03 + k * 0.008, 0.03, 0); slide.add(r); } const sight = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.008, 0.006), dark); sight.position.set(0.125, 0.05, 0); slide.add(sight); }
  const bore = add(new THREE.CylinderGeometry(0.0075, 0.0075, 0.01, 14), new THREE.MeshBasicMaterial({ color: 0x000000 }), 0.133, 0.03, 0, Math.PI / 2);
  add(new THREE.BoxGeometry(0.036, 0.1, 0.026), wood, -0.045, -0.052, 0, -0.26); add(new THREE.TorusGeometry(0.019, 0.0035, 8, 20, Math.PI * 1.2), dark, 0.012, -0.026, 0, Math.PI * 0.95); add(new THREE.BoxGeometry(0.004, 0.016, 0.008), dark, 0.008, -0.022, 0);
  add(new THREE.BoxGeometry(0.014, 0.016, 0.012), dark, -0.062, 0.05, 0, -0.4);
  const mag = new THREE.Group(); { const b = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.09, 0.02), steel); mag.add(b); for (let k = 0; k < 2; k++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.016, 12), brass); c.rotation.z = Math.PI / 2; c.position.set(0.004, 0.05 + k * 0.0, (k - 0.5) * 0.011); mag.add(c); const tip = new THREE.Mesh(new THREE.ConeGeometry(0.0055, 0.01, 12), copper); tip.rotation.z = -Math.PI / 2; tip.position.set(0.017, 0.05, (k - 0.5) * 0.011); mag.add(tip); } } mag.rotation.z = -0.26; G.add(mag);
  G.userData = { slide, mag, muzzle: V(0.14, 0.03, 0) }; G.scale.setScalar(1.7); G.traverse((m) => (m.castShadow = true)); G.visible = false; scene.add(G); return G; }
const GUN = makeGun(), RGUN = makeGun(); const GUNLIGHT = new THREE.PointLight(0xffffff, 0, 2.5, 1.2); scene.add(GUNLIGHT); const MAG_IN = V(-0.048, -0.056, 0);
const gunMuzzle = (G) => G.localToWorld(G.userData.muzzle.clone());
function aimGun(G, pos, target, roll = 0) { G.position.copy(pos); const x = target.clone().sub(pos).normalize(); let up = V(0, 1, 0); if (Math.abs(x.y) > 0.95) up = V(0, 0, 1); const z = V().crossVectors(x, up).normalize(), y = V().crossVectors(z, x); G.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)); if (roll) G.rotateX(roll); G.updateMatrixWorld(true); }
let BULLET, BLIGHT; { BULLET = new THREE.Group(); const prof = [[0, -0.012], [0.0055, -0.012], [0.0057, 0.004], [0.0045, 0.01], [0.002, 0.016], [0, 0.018]].map(([x, y]) => new THREE.Vector2(x, y)); BULLET.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 20), copper));
  const tr = mesh(new THREE.CylinderGeometry(0.0015, 0.006, 0.5, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false }), 0, -0.26, 0, false); BULLET.add(tr); BULLET.scale.setScalar(3.2); BULLET.visible = false; scene.add(BULLET); BLIGHT = new THREE.PointLight(0xfff0c8, 0, 2, 1.5); scene.add(BLIGHT); }
// =================== BACK VIEW CARD (for over-the-shoulder two-shots and walking away) ===================
class BackCard { constructor(o) { this.o = o; this.cv = document.createElement('canvas'); this.cv.width = 600; this.cv.height = 1300; this.g = this.cv.getContext('2d'); this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    const geo = new THREE.PlaneGeometry(1.2, 2.6); geo.translate(0, 1.3, 0); this.mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: this.tex, color: 0xeeeae4, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, toneMapped: false })); this.mesh.castShadow = true; this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.tex, alphaTest: 0.4 }); this.mesh.visible = false; scene.add(this.mesh); this.pos = V(); this.hand = [400, 520]; }
  place(x, y, z) { this.pos.set(x, y, z); }
  update(p, cam) { this.draw(p); this.tex.needsUpdate = true; this.mesh.position.copy(this.pos); this.mesh.rotation.y = Math.atan2(cam.x - this.pos.x, cam.z - this.pos.z); this.mesh.visible = true; }
  toWorld([x, y]) { const ry = this.mesh.rotation.y, u = (x / 600 - 0.5) * 1.2, v = (1300 - y) / 500; return this.pos.clone().add(V(Math.cos(ry) * u, v, -Math.sin(ry) * u)); }
  draw(p) { const g = this.g, o = this.o, INK = '#1e1612'; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 600, 1300); g.lineCap = g.lineJoin = 'round'; const ph = p.walk || 0, s = Math.sin(ph), wk = p.walk !== undefined ? 1 : 0, bob = -Math.abs(s) * 10 * wk; g.translate(0, bob);
    const line = (pts, w, c) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.lineWidth = w + 10; g.strokeStyle = INK; g.stroke(); g.lineWidth = w; g.strokeStyle = c; g.stroke(); };
    // legs: trousers to the ankle, white socks, shoes
    for (const sd of [-1, 1]) { const lift = Math.max(0, sd * s) * 34 * wk, fx = 300 + sd * 38, hy = 815; const ank = [fx, 1232 - lift]; line([[300 + sd * 26, hy], [fx + sd * 4, 1030 - lift * 0.5], ank], 40, o.pants);
      g.fillStyle = o.sock; g.fillRect(fx - 13, 1232 - lift, 26, 34); g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(fx - 13, 1232 - lift, 26, 34); g.fillStyle = '#0c0c0c'; g.beginPath(); g.ellipse(fx, 1272 - lift, 30, 16, 0, 0, 7); g.fill(); }
    // coat back
    g.beginPath(); g.moveTo(205, 610); g.quadraticCurveTo(205, 572, 245, 568); g.lineTo(355, 568); g.quadraticCurveTo(395, 572, 395, 610); g.lineTo(390, 940); g.quadraticCurveTo(300, 955, 210, 940); g.closePath(); const gr = g.createLinearGradient(200, 0, 400, 0); gr.addColorStop(0, o.coatHi); gr.addColorStop(0.6, o.coat); gr.addColorStop(1, o.coatD); g.fillStyle = gr; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
    g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.moveTo(300, 600); g.lineTo(300, 948); g.moveTo(220, 812); g.quadraticCurveTo(300, 822, 380, 812); g.stroke();
    // arms: left hangs/swings; right either swings, hangs, or aims forward (foreshortened, raised toward the target)
    const swing = wk * s * 26; line([[215, 600], [205 - swing * 0.2, 720], [200 + swing, 840]], 30, o.coat); g.fillStyle = '#0c0c0c'; g.beginPath(); g.arc(200 + swing, 852, 17, 0, 7); g.fill();
    if (p.aim) { line([[385, 600], [400, 560], [392, 520]], 32, o.coat); g.fillStyle = '#0c0c0c'; g.beginPath(); g.arc(390, 505, 18, 0, 7); g.fill(); this.hand = [390, 500]; }
    else { line([[385, 600], [395 + swing * 0.2, 720], [400 - swing, 840]], 30, o.coat); g.fillStyle = '#0c0c0c'; g.beginPath(); g.arc(400 - swing, 852, 17, 0, 7); g.fill(); this.hand = [400 - swing, 852]; }
    // neck, collar, back of the head (hair), ears, fedora from behind
    g.fillStyle = o.skin; g.fillRect(282, 540, 36, 34); g.fillStyle = '#e8e8e8'; g.fillRect(262, 562, 76, 12); g.strokeStyle = INK; g.lineWidth = 4; g.strokeRect(262, 562, 76, 12);
    for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(300 + sd * 103, 466, 20, 30, 0, 0, 7); g.fillStyle = o.skin; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); }
    g.beginPath(); g.arc(300, 456, 104, 0, 7); g.fillStyle = o.hair; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke(); g.fillStyle = 'rgba(255,255,255,0.08)'; g.beginPath(); g.ellipse(270, 420, 40, 20, -0.4, 0, 7); g.fill();
    if (!p.noHat) { const r = 104, Y = 456; g.save(); g.translate(300, Y); g.rotate(p.hatTilt || 0); g.fillStyle = o.hatCol; g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.moveTo(-70, -r * 0.55); g.bezierCurveTo(-82, -r - 40, -40, -r - 70, 0, -r - 50); g.bezierCurveTo(40, -r - 70, 82, -r - 40, 70, -r * 0.55); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = o.band; g.fillRect(-72, -r * 0.55 - 22, 144, 20); g.fillStyle = o.hatCol; g.beginPath(); g.ellipse(0, -r * 0.5, 150, 22, 0, 0, 7); g.fill(); g.stroke(); g.restore(); }
  } }
const BOSSB = new BackCard({ coat: '#5c5c60', coatHi: '#7a7a7e', coatD: '#38383c', pants: '#3a3a3e', sock: '#dcdcdc', skin: '#f2dcc8', hair: '#141010', hatCol: '#1a1a1a', band: '#a0a0a0' });
const RIVALB = new BackCard({ coat: '#2a2a2e', coatHi: '#444448', coatD: '#18181a', pants: '#1c1c20', sock: '#7a7a7a', skin: '#f2dcc8', hair: '#141010', hatCol: '#e2e2e2', band: '#151515' });
// =================== TIMING ===================
const STOP = -7.2, P_BOSS = (t) => V(0, 0, lerp(-9.6, STOP, clamp(t / 2.0, 0, 1))), RIV = V(0.5, 0, -14.8), HATP = V(0.5, 1.98, -14.8);
const T_MAG0 = 4.9, T_MAG = 5.6, T_RACK = 6.0, T_SPIN = [6.35, 7.15], T_SHOT1 = 8.4, T_HIT = 9.95;
window.SFX = { boss: [T_SHOT1], rival: [], thunder: [1.5], steps: [0.2, 0.75, 1.3, 1.85, 17.4, 17.95, 18.5, 19.05], draw: [4.7, T_MAG, T_RACK, T_RACK + 0.12, 16.6], spin: T_SPIN[0], hat: T_HIT, title: 18.4, run: 11.9, bulletTime: 8.6 };
// =================== ACTING ===================
function setup(t, camPos) { Flat2D.T = t; Flat2D.E = 0; Flat2D.ON = 0; for (const c of PEOPLE) hide(c); BOSSB.mesh.visible = RIVALB.mesh.visible = false; GUNLIGHT.intensity = 0; GUN.visible = RGUN.visible = false; HAT3D.visible = false; BULLET.visible = false; BLIGHT.intensity = 0; FLASHL.intensity = 0; FLASHES.forEach((f) => (f.visible = false)); TRACERS.forEach((x) => (x.visible = false)); for (const b of Object.values(BURSTS)) b.update(t, -99, V(), 0, false);
  const lightning = (t0) => (t > t0 && t < t0 + 0.32 ? (t < t0 + 0.05 || (t > t0 + 0.13 && t < t0 + 0.19) ? 6 : 1.2) : 0); THUNDER.intensity = lightning(1.5); CRATES.visible = false;
  const B = BOSS, Rv = RIVAL; RIVAL.o.hat = t >= T_HIT ? null : 'fedora'; const bp = P_BOSS(t); B.place(bp.x, 0, bp.z); Rv.place(RIV.x, 0, RIV.z); GUN.userData.mag.position.copy(MAG_IN); GUN.userData.mag.visible = true; GUN.userData.slide.position.x = 0;
  const bossTarget = HATP.clone().add(V(0, 0.02, 0));
  const rivalFront = (face, armR = [70, -60], extra = {}) => { Rv.update({ e: 1, armR, armL: [16, -32], face, noBlink: true, ...extra }, camPos); if (!extra.noGun && Rv.handR) { RGUN.visible = true; aimGun(RGUN, Rv.toWorld(Rv.handR).add(V(0, 0, 0.06)), bp.clone().add(V(0, 1.5, 0))); } };
  // 0 - 2.0 hero walk toward a camera at his feet
  if (t < 2.0) B.update({ e: 0.6, ...mo('17_06f', t, { t0: 0, from: 0.4, amp: 1.1, root: 0 }), armL: [16, -32], lean: -4, face: faceK(t, [[0, { eyes: 'lid', lid: 0.5, mouth: 'smirk1', brow: -0.7, look: [0, -0.4] }], [1.5, { eyes: 'lid', lid: 0.35, mouth: 'line', brow: -0.9, look: [0, -0.5] }]]), noBlink: true, noIdle: true }, camPos);
  // 2.0 - 3.3 close-up stare; eyes slide back over his shoulder
  else if (t < 3.3) B.update({ e: 1, armL: [16, -32], armR: [16, -32], ...keys(t, [[2.0, { tilt: 0 }], [2.7, { tilt: -7 }, 0.3]]), face: faceK(t, [[2.0, { eyes: 'lid', lid: 0.35, mouth: 'line', brow: -0.8, look: [0, 0] }], [2.65, { eyes: 'lid', lid: 0.45, mouth: 'smirk1', brow: -0.9, look: [-1, 0.1] }]]), noBlink: true, noIdle: true }, camPos);
  // 3.3 - 4.6 OVER THE BOSS'S SHOULDER (his back): the rival faces him at the end of the street and draws
  else if (t < 4.6) { BOSSB.place(bp.x, 0, bp.z); BOSSB.update({}, camPos); const dr = sstep(3.8, 4.1, t); rivalFront(faceK(t, [[3.3, 'smug'], [3.85, { eyes: 'lid', lid: 0.3, mouth: 'psycho', brow: -0.9 }]]), [lerp(16, 70, dr), lerp(-32, -60, dr)], { noGun: dr < 0.5 }); }
  // 4.6 - 8.0 LOADING (front, chest close-up): magazine with rounds slides up into the grip, slide racked, gun spun
  else if (t < 8.0) { const k = keys(t, [[4.6, { armR: [16, -32], armL: [16, -32] }], [4.75, { armR: [62, -58], armL: [16, -32], tilt: 3 }, 0.14, 'back'], [T_MAG0, { armR: [62, -58], armL: [40, 20], tilt: 4 }, 0.16], [T_MAG, { armR: [62, -58], armL: [56, -40], tilt: -3, hop: 3 }, 0.1, 'in'], [5.8, { armR: [62, -58], armL: [58, -60] }, 0.12], [T_RACK, { armR: [62, -58], armL: [48, -30], tilt: -5, hop: 4 }, 0.08, 'in'], [6.25, { armR: [70, -50], armL: [16, -32], tilt: 2 }, 0.14, 'back']]);
    B.update({ e: 1, ...k, face: faceK(t, [[4.6, { eyes: 'lid', lid: 0.45, mouth: 'line', brow: -0.7, look: [-0.5, 0.6] }], [T_MAG, { eyes: 'lid', lid: 0.5, mouth: 'smirk1', brow: -0.8, look: [-0.5, 0.6] }], [T_SPIN[0], { eyes: 'lid', lid: 0.55, mouth: 'smirk1', browL: 0.6, browR: -0.8, look: [-0.6, 0] }]]), noBlink: true, noIdle: true }, camPos);
    const hp = B.toWorld(B.handR), toCam = camPos.clone().sub(hp).setY(0).normalize(), camL = V(-1, 0, 0).applyQuaternion(cam.quaternion).setY(0).normalize(); GUN.visible = true; aimGun(GUN, hp.clone().addScaledVector(toCam, 0.16), hp.clone().addScaledVector(toCam, 0.16).add(camL).add(V(0, 0.03, 0)));
    if (t > T_SPIN[0] && t < T_SPIN[1]) { const a = sstep(T_SPIN[0], T_SPIN[1], t) * Math.PI * 6; GUN.translateX(0.03); GUN.rotateZ(a); GUN.translateX(-0.03); }
    const mu = sstep(T_MAG0, T_MAG, t); GUN.userData.mag.position.copy(MAG_IN.clone().add(V(-0.05, -0.28, 0).multiplyScalar(1 - mu))); GUN.userData.mag.rotation.z = -0.26 + (1 - mu) * 0.5;
    GUNLIGHT.intensity = 2.2; GUNLIGHT.position.copy(hp).addScaledVector(toCam, 0.7).add(V(0.2, 0.3, 0));
    const rk = t > T_RACK && t < T_RACK + 0.22 ? Math.sin(((t - T_RACK) / 0.22) * Math.PI) : 0; GUN.userData.slide.position.x = -0.045 * rk; }
  // 8.0 - 8.6 TWO-SHOT over the boss's shoulder: gun straight at the rival's hat, fires
  else if (t < 8.6) { BOSSB.place(bp.x, 0, bp.z); BOSSB.update({ aim: true }, camPos); GUN.visible = true; const hw = BOSSB.toWorld(BOSSB.hand); const kick = t > T_SHOT1 && t < T_SHOT1 + 0.12 ? Math.sin(((t - T_SHOT1) / 0.12) * Math.PI) * 0.25 : 0;
    aimGun(GUN, hw, bossTarget); GUN.rotateZ(kick); rivalFront({ eyes: 'lid', lid: 0.3, mouth: 'psycho', brow: -0.9 }); const m = gunMuzzle(GUN); fire(0, t, T_SHOT1, m, m.clone().add(bossTarget.clone().sub(m).normalize().multiplyScalar(0.6))); smoke(841).update(t, T_SHOT1, m); }
  // 8.6 - T_HIT bullet time: camera behind the 3D bullet all the way to the hat
  else if (t < T_HIT + 0.12) { const from = V(0.2, 1.72, STOP - 1.8), to = bossTarget, u = clamp((t - 8.6) / (T_HIT - 8.6), 0, 1); BULLET.visible = t < T_HIT; BULLET.position.copy(from.clone().lerp(to, u)); BULLET.quaternion.setFromUnitVectors(V(0, 1, 0), to.clone().sub(from).normalize()); BULLET.rotateY(t * 40); BLIGHT.position.copy(BULLET.position); BLIGHT.intensity = 1.0;
    rivalFront(t < T_HIT ? { eyes: 'wide', mouth: 'smallO', brow: 1.0 } : { eyes: 'tiny', mouth: 'scream', brow: 1.5 }); if (t > T_HIT) { HAT3D.visible = true; HAT3D.position.copy(HATP); } spark(990).update(t, T_HIT, HATP); }
  // T_HIT - 11.8 the hat flies off, he drops the gun
  else if (t < 11.8) { const v = t - T_HIT; HAT3D.visible = true; HAT3D.position.set(HATP.x, HATP.y + v * 1.5 - 1.1 * v * v, HATP.z - v * 0.5); HAT3D.rotation.set(v * 3, v * 2, v * 4);
    const drop = t > 10.8; Rv.update({ e: 1, ...keys(t, [[T_HIT, { armR: [70, -60], armL: [16, -32] }], [10.8, { armR: [150, 30], armL: [150, 30], hop: 10 }, 0.12, 'back']]), face: faceK(t, [[T_HIT, { eyes: 'tiny', mouth: 'smallO', brow: 1.4, look: [0, -1] }], [10.8, { eyes: 'wide', mouth: 'scream', brow: 1.5 }]]), sweat: true, noBlink: true }, camPos);
    RGUN.visible = true; if (!drop && Rv.handR) aimGun(RGUN, Rv.toWorld(Rv.handR).add(V(0, 0, 0.06)), bp.clone().add(V(0, 1.5, 0))); else { const g = t - 10.8; RGUN.position.set(RIV.x + 0.3, Math.max(0.05, 1.3 - 4.9 * g * g), RIV.z + 0.3); RGUN.rotation.set(g * 6, 0, g * 9); } }
  // 11.8 - 13.4 he runs away down the street (his back), boss's shoulder in the foreground
  else if (t < 13.4) { const r = (t - 11.8) / 1.6; RIVALB.place(RIV.x, 0, RIV.z - r * 7); RIVALB.update({ walk: t * 16, noHat: true }, camPos); }
  // 13.4 - 17.2 front close-up: blows the smoke off the barrel, spins it into the holster, tips the hat
  else if (t < 17.2) { const k = keys(t, [[13.4, { armR: [150, -120], armL: [16, -32], tilt: -4 }], [15.2, { armR: [62, -58], armL: [16, -32], tilt: 0 }, 0.2], [16.1, { armR: [16, -32], armL: [16, -32] }, 0.2], [16.5, { armR: [160, -150], armL: [16, -32], tilt: -8, hop: 4 }, 0.16, 'back'], [16.9, { armR: [16, -32], armL: [16, -32], tilt: 0 }, 0.2]]);
    B.update({ e: 1, ...k, face: faceK(t, [[13.4, { eyes: 'lid', lid: 0.5, mouth: 'smallO', brow: -0.4, look: [0.6, -0.6] }], [14.4, { eyes: 'lid', lid: 0.55, lidL: 0.1, mouth: 'smirk1', browL: 0.7, browR: -0.6 }], [16.5, { eyes: 'closed', mouth: 'smirk1', brow: 0.2 }]]), noBlink: true, noIdle: true }, camPos);
    if (t < 16.1 && B.handR) { const hp = B.toWorld(B.handR).addScaledVector(camPos.clone().sub(B.pos).setY(0).normalize(), 0.16), camL = V(-1, 0, 0).applyQuaternion(cam.quaternion).setY(0).normalize(); GUN.visible = true; if (t < 15.2) aimGun(GUN, hp, hp.clone().add(V(0, 1, 0))); else { aimGun(GUN, hp, hp.clone().add(camL)); const a = sstep(15.3, 16.0, t) * Math.PI * 4; GUN.translateX(0.03); GUN.rotateZ(a); GUN.translateX(-0.03); }
      if (t < 15.2) smoke(1340).update(t, 13.4, gunMuzzle(GUN), 0.5); } }
  // 17.2 - 20 walks away into the rain (his back), title
  else { const z = lerp(STOP, -12, (t - 17.2) / 2.8); BOSSB.place(0, 0, z); BOSSB.update({ walk: t * 6 }, camPos); }
  TITLE.visible = t > 18.4; TITLE.material.opacity = sstep(18.4, 18.9, t) * (1 - sstep(19.75, 20, t));
}
function fx(t) { const P = RAIN.geometry.attributes.position.array, S = RAIN.userData.seed, c = cam.position; const slow = t > 8.6 && t < 11.8 ? 0.12 : 1; const tt = t < 8.6 ? t : t < 11.8 ? 8.6 + (t - 8.6) * 0.12 : t - 3.2 * 0.88; for (let i = 0; i < S.length; i++) { const [a, b, h] = S[i]; const x = c.x + (a - 0.5) * 16, z = c.z - 1 - b * 14, y = c.y + 6 - ((tt * 9 + h * 12) % 12); P[i * 6] = x; P[i * 6 + 1] = y; P[i * 6 + 2] = z; P[i * 6 + 3] = x + 0.03; P[i * 6 + 4] = y - 0.45 * slow - 0.03; P[i * 6 + 5] = z; } RAIN.geometry.attributes.position.needsUpdate = true; }
// =================== CAMERA (no side views) ===================
const CINE = new Cine(); const shot = (a, b, s) => CINE.shot(a, b, s);
const bH = (dy = 0) => () => BOSS.headWorld().add(V(0, dy, 0)), rH = (dy = 0) => () => RIVAL.headWorld().add(V(0, dy, 0));
const OTS = (t) => P_BOSS(Math.min(t, 2)).add(V(0.28, 1.82, 1.25)), OTSLOOK = () => V(1.2, 1.35, -12.5);
function camera() {
  shot(0, 2.0, { rig: 'pov', from: (t) => V(0.3, 0.14, lerp(-6.0, -5.7, t / 2)), at: (t) => P_BOSS(t).add(V(0, 1.55, 0)), fov: 50, push: 1.0, drift: [0, 0] });
  shot(2.0, 3.3, { rig: 'push', at: bH(0.05), size: 1.2, az: 6, el: -4, fov: 30, push: 1.15, zoomK: [[2.65, 1.18, 0.1]] });
  shot(3.3, 4.6, { rig: 'pov', from: OTS, at: OTSLOOK, fov: 56, push: 1.0, drift: [0, 0], zoomK: [[3.85, 1.25, 0.12]] });
  shot(4.6, 8.0, { rig: 'push', at: () => P_BOSS(5).add(V(-0.05, 1.0, 0)), size: 0.72, az: 0, el: 2, fov: 30, push: 1.12, zoomK: [[T_MAG, 1.12, 0.06], [T_RACK, 1.22, 0.06], [T_SPIN[0], 1.12, 0.2]] });
  shot(8.0, 8.6, { rig: 'pov', from: OTS, at: OTSLOOK, fov: 56, push: 1.0, drift: [0, 0], zoomK: [[T_SHOT1, 1.12, 0.05]] });
  shot(8.6, T_HIT + 0.12, { rig: 'pov', from: () => BULLET.position.clone().add(V(0.035, 0.05, 0.3)), at: () => HATP.clone().add(V(0, -0.12, 0)), fov: 40, push: 1.0, drift: [0, 0] });
  shot(T_HIT + 0.12, 11.8, { rig: 'push', at: () => RIV.clone().add(V(0, 1.6, 0)), size: 2.8, az: 0, el: 4, fov: 32, push: 1.15 });
  shot(11.8, 13.4, { rig: 'pov', from: (t) => V(1.2, 1.5, RIV.z + 3.2 - (t - 11.8) * 2.5), at: (t) => V(RIV.x, 1.1, RIV.z - (t - 11.8) / 1.6 * 7), fov: 40, push: 1.0, drift: [0, 0] });
  shot(13.4, 17.2, { rig: 'push', at: bH(-0.2), size: 1.45, az: -8, el: -4, fov: 30, push: 1.12 });
  shot(17.2, 20, { rig: 'pov', from: (t) => V(0.5, 0.3, STOP + 2.2 - (t - 17.2) * 0.4), at: (t) => V(0, 1.4, lerp(STOP, -12, (t - 17.2) / 2.8)), fov: 44, push: 1.0, drift: [0, 0] });
}

// =================== RENDER ===================
const composer = makeComposer({ sat: 0.0, con: 1.32, bloom: 0.3 }); const SKY = makeSky();
const look = (t, cpos) => { SKY.update(cpos, true, composer.grade); hemi.intensity = 0.25; hemi.color.setHex(0xc8c8c8); sun.intensity = 0.35; sun.color.setHex(0xd8d8d8); const tg = sun.target.position; sun.position.copy(tg).add(V(-12, 30, 14)); };
const camOf = dynamicCam(CINE);
makeRenderer({ CINE, camOf, setup, fx, look, composer, DURATION, impacts: [T_SHOT1, T_HIT], flash: (t) => (t > 1.5 && t < 1.56 ? 0.35 : 0) });
(async () => { await loadMo(['17_03', '17_06f'], './mocap'); await sky('kloofendal_48d_partly_cloudy_puresky', { env: 0.25 }); build(); camera(); await ready(); window.ready = true; })();

