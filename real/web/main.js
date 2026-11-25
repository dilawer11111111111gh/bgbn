// REAL-LOOK TEST (5 s): physically based renderer + real CC0 assets (Poly Haven HDRI sky, PBR textures, glTF models)
// + flat 2D characters. Goal: match the reference channels' "game engine" environment quality.
import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { Cine } from '../../web/cine.js';
import { Flat2D } from '../../web/flat2d.js';
import { role, act } from '../../web/roles.js';
import { makeTrain } from '../../web/train.js';
import { sstep, lerp, clamp } from '../../web/motion.js';

const Q = new URLSearchParams(location.search); const tier = Q.get('q') || 'final';
const SC = Q.has('s') ? +Q.get('s') : ({ draft: 0.35, fast: 0.5, good: 0.75, final: 1 }[tier] || 1);
const WD = Math.round(1080 * SC), HT = Math.round(1920 * SC), FPS = 30; export const DURATION = 5.0;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }); window.__R = R;
R.setSize(WD, HT); R.setPixelRatio(1); R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 0.82; R.outputColorSpace = THREE.SRGBColorSpace;
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; document.body.appendChild(R.domElement);
const scene = new THREE.Scene(); const cam = new THREE.PerspectiveCamera(40, WD / HT, 0.05, 3000);
scene.fog = new THREE.FogExp2(0xd8c4a8, 0.0042);
const A = (p) => '../../' + p;

// ---------------- loaders ----------------
const TL = new THREE.TextureLoader(); const texCache = {};
function pbr(id, rep = [1, 1], o = {}) {
  const base = `assets/tex/${id}/`; const ld = (f, srgb) => { const t = TL.load(A(base + f)); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const arm = ld('arm.jpg'); return new THREE.MeshStandardMaterial({ map: ld('diff.jpg', true), normalMap: ld('nor.jpg'), normalScale: new THREE.Vector2(o.ns ?? 1, o.ns ?? 1), roughnessMap: arm, metalnessMap: arm, aoMap: arm, metalness: o.metal ?? 1, roughness: 1, color: o.tint ? new THREE.Color(o.tint) : 0xffffff, ...o.extra });
}
const gl = new GLTFLoader(); const models = {};
const loadModel = (id) => new Promise((res) => gl.load(A(`assets/models/${id}/${id}.gltf`), (g) => { g.scene.traverse((m) => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; } }); models[id] = g.scene; res(); }, undefined, () => res()));
const place = (id, x, y, z, s = 1, ry = 0) => { if (!models[id]) return null; const m = models[id].clone(); m.position.set(x, y, z); m.scale.setScalar(s); m.rotation.y = ry; scene.add(m); return m; };
const rng = (seed) => { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };

// ---------------- world ----------------
const sun = new THREE.DirectionalLight(0xffe6c4, 2.6); sun.position.set(-40, 60, 30); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 200 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(0xcfe4ff, 0xb08060, 0.35); scene.add(hemi);

function build() {
  // ground: dry desert
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), pbr('dry_ground_01', [120, 120], { ns: 1.2, tint: '#e8a070' })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  // ballast (gravel mound) along x
  const shape = new THREE.Shape([V(-2.3, 0), V(-1.5, 0.42), V(1.5, 0.42), V(2.3, 0)].map((v) => new THREE.Vector2(v.x, v.y)));
  const bg = new THREE.ExtrudeGeometry(shape, { depth: 400, bevelEnabled: false }); bg.rotateY(Math.PI / 2); bg.translate(-200, 0, 0);
  const uv = bg.attributes.uv, pos = bg.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 2.2, (pos.getZ(i) + pos.getY(i)) / 2.2);
  const ballast = new THREE.Mesh(bg, pbr('gravel_floor_02', [1, 1], { ns: 1.8, tint: '#8c6e5e' })); ballast.receiveShadow = ballast.castShadow = true; scene.add(ballast);
  // sleepers (instanced) + rails
  const tieM = pbr('wood_planks_dirt', [0.5, 1], { tint: '#b89a7a' }); const tieG = new THREE.BoxGeometry(0.26, 0.16, 2.6);
  const ties = new THREE.InstancedMesh(tieG, tieM, 640); const mtx = new THREE.Matrix4(); const r = rng(5);
  for (let i = 0; i < 640; i++) { mtx.compose(V(-200 + i * 0.62, 0.48, (r() - 0.5) * 0.06), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), (r() - 0.5) * 0.04), V(1, 1, 1)); ties.setMatrixAt(i, mtx); }
  ties.castShadow = ties.receiveShadow = true; scene.add(ties);
  const railM = new THREE.MeshStandardMaterial({ color: 0x8a8f96, metalness: 0.95, roughness: 0.32 }), rustM = pbr('rusty_metal_02', [80, 1], { tint: '#8a6a5a' });
  for (const z of [-0.75, 0.75]) { const web = new THREE.Mesh(new THREE.BoxGeometry(400, 0.14, 0.06), rustM); web.position.set(0, 0.63, z); const head = new THREE.Mesh(new THREE.BoxGeometry(400, 0.05, 0.1), railM); head.position.set(0, 0.725, z); const foot = new THREE.Mesh(new THREE.BoxGeometry(400, 0.03, 0.16), rustM); foot.position.set(0, 0.575, z); for (const m of [web, head, foot]) { m.castShadow = m.receiveShadow = true; scene.add(m); } }
  // canyon wall on the left (displaced, red sandstone)
  const wg = new THREE.PlaneGeometry(420, 46, 260, 40); const wp = wg.attributes.position; const n = (x, y) => Math.sin(x * 0.11) * 2.2 + Math.sin(x * 0.037 + y * 0.09) * 3.4 + Math.sin(y * 0.6 + x * 0.3) * 0.5 + Math.sin(x * 0.9 + y * 1.3) * 0.18;
  for (let i = 0; i < wp.count; i++) { const x = wp.getX(i), y = wp.getY(i); wp.setZ(i, n(x, y) + Math.max(0, (y - 10) * 0.18)); } wg.computeVertexNormals();
  const wall = new THREE.Mesh(wg, pbr('rock_face', [30, 3.5], { ns: 1.8, tint: '#d0643c' })); wall.position.set(0, 21, -15); wall.castShadow = wall.receiveShadow = true; scene.add(wall);
  // mesas on the right horizon
  const mesaM = pbr('sandstone_cracks', [6, 3], { tint: '#d08a5e' }); const rm = rng(9);
  for (let i = 0; i < 9; i++) { const s = 18 + rm() * 26; const g = new THREE.CylinderGeometry(s * 0.75, s, s * 0.7, 14, 6); const gp = g.attributes.position; for (let k = 0; k < gp.count; k++) { const a = Math.atan2(gp.getZ(k), gp.getX(k)); const f = 1 + Math.sin(a * 5 + i) * 0.06 + Math.sin(a * 13) * 0.03; gp.setX(k, gp.getX(k) * f); gp.setZ(k, gp.getZ(k) * f); } g.computeVertexNormals();
    const m = new THREE.Mesh(g, mesaM); m.position.set(-260 + i * 70 + rm() * 30, s * 0.35, 140 + rm() * 120); m.receiveShadow = true; scene.add(m); }
  // rocks, boulders, dead wood (glTF)
  const rr = rng(21);
  for (let i = 0; i < 60; i++) { const x = -120 + rr() * 220, side = rr() < 0.55 ? -1 : 1, z = side < 0 ? -4 - rr() * 9 : 4 + rr() * 30; place(rr() < 0.5 ? 'boulder_01' : 'rock_moss_set_01', x, 0, z, 0.6 + rr() * (side < 0 ? 2.2 : 1.2), rr() * 6.28); }
  for (let i = 0; i < 14; i++) place(rr() < 0.5 ? 'dry_branches_medium_01' : 'dead_tree_trunk', -80 + rr() * 140, 0, (rr() < 0.5 ? -1 : 1) * (4 + rr() * 10), 0.8 + rr() * 0.8, rr() * 6.28);
  place('wooden_crate_01', 2.6, 0, 3.4, 1.3, 0.4); place('wooden_crate_01', 3.4, 0, 4.1, 1.1, -0.2);
  // grass clumps (thousands of blades, vertex coloured, wind in update)
  const pts = [], cols = []; const rg = rng(33); const c0 = new THREE.Color(0x6d7a2a), c1 = new THREE.Color(0xd9c26a);
  for (let k = 0; k < 520; k++) { const cx = -90 + rg() * 160, cz = (rg() < 0.5 ? -1 : 1) * (2.6 + rg() * 12); for (let b = 0; b < 26; b++) { const a = rg() * 6.28, d = rg() * 0.35, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, h = 0.25 + rg() * 0.55, w = 0.03, la = (rg() - 0.5) * 0.6, lb = (rg() - 0.5) * 0.6;
    pts.push(x - w, 0, z, x + w, 0, z, x + la * h, h, z + lb * h); const cc = c0.clone().lerp(c1, rg() * 0.8); cols.push(cc.r * 0.6, cc.g * 0.6, cc.b * 0.6, cc.r * 0.6, cc.g * 0.6, cc.b * 0.6, cc.r, cc.g, cc.b); } }
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); gg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); gg.computeVertexNormals();
  const grass = new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.9 })); grass.receiveShadow = true; scene.add(grass);
  // telegraph poles + wires
  const poleM = pbr('wood_planks_dirt', [0.3, 3], { tint: '#8a6a4a' });
  for (let i = 0; i < 12; i++) { const x = -110 + i * 22; const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 8, 10), poleM); p.position.set(x, 4, 5.6); const c = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 1.8), poleM); c.position.set(x, 7.6, 5.6); for (const m of [p, c]) { m.castShadow = true; scene.add(m); }
    for (const dz of [-0.75, 0.75]) { const w = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(V(x, 7.7, 5.6 + dz), V(x + 11, 7.0, 5.6 + dz), V(x + 22, 7.7, 5.6 + dz)), 16, 0.012, 4), new THREE.MeshStandardMaterial({ color: 0x222222 })); scene.add(w); } }
}

// ---------------- train (converted to physically based materials) ----------------
const TR = makeTrain({ kind: 'flat' }); const toPBR = (g) => g.traverse((m) => { if (m.isMesh && m.material.uniforms) { const u = m.material.uniforms; const col = u.uColor.value.clone(); const em = u.uEmis.value > 0.5;
  const k = col.r + col.g + col.b; m.material = new THREE.MeshStandardMaterial({ color: col.convertSRGBToLinear(), metalness: k < 0.4 ? 0.6 : k > 2.2 ? 0.8 : 0.35, roughness: k < 0.4 ? 0.45 : 0.38, emissive: em ? col : 0x000000, emissiveIntensity: em ? 3 : 0 }); m.castShadow = m.receiveShadow = true; } });
TR.cars.forEach((g) => { toPBR(g); scene.add(g); });
const trainAt = (s) => ({ p: V(s, 0.73 - 0.02, 0), h: 0, y: 0, roll: 0, pitch: 0 });

// ---------------- smoke puffs ----------------
const smokeTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); for (let i = 0; i < 7; i++) { const x = 34 + (i % 3) * 30, y = 40 + Math.floor(i / 3) * 26, rr = 30 + (i % 2) * 10; const gr = g.createRadialGradient(x, y, 2, x, y, rr); gr.addColorStop(0, 'rgba(250,250,250,0.95)'); gr.addColorStop(1, 'rgba(235,235,240,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const PUFFS = []; for (let i = 0; i < 26; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0.85 })); scene.add(s); PUFFS.push(s); }

// ---------------- cast: track inspector vs rail baron (flat 2D, drawn into the PBR scene) ----------------
Flat2D.T = 0;
const WORKER = new Flat2D({ ...role('worker', 2), scene, size: 1.8, res: 2.2 });
const BARON = new Flat2D({ ...role('rival', 0), scene, size: 1.95, res: 2.2 });

// ---------------- camera ----------------
const CINE = new Cine({ blend: 0.3 }); const pt = (x, y, z) => { const f = () => V(x, y, z); f.pure = true; return f; };
CINE.shot(0, 1.7, { rig: 'push', at: pt(1.2, 1.4, 2.6), size: [4.2, 2.8], az: [-78, -70], el: [3, 4], fov: [38, 34], shake: 0.3 });           // low dolly along the rails toward the pair
CINE.shot(1.7, 3.3, { rig: 'orbit', at: pt(1.6, 1.45, 2.9), size: 2.4, az: [-25, 25], el: [4, 6], fov: 32, shake: 0.4 });                  // two-shot, the argument
CINE.shot(3.3, 5.1, { rig: 'crane', at: () => V(1.0, 1.6, 1.6), size: [3.0, 9.0], el: [6, 22], az: [70, 95], fov: [34, 44], shake: 0.25 }); // reveal: train charging out of the canyon

// ---------------- post ----------------
const composer = new EffectComposer(R); composer.addPass(new RenderPass(scene, cam));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(WD, HT), 0.22, 0.5, 1.6));
composer.addPass(new OutputPass());
composer.addPass(new ShaderPass({ uniforms: { tDiffuse: { value: null } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); float l = dot(c.rgb, vec3(0.299,0.587,0.114)); c.rgb = mix(vec3(l), c.rgb, 1.32); c.rgb = (c.rgb - 0.5) * 1.08 + 0.5; c.rgb *= vec3(1.03, 1.0, 0.95); vec2 q = vUv - 0.5; float v = smoothstep(0.75, 0.25, length(q * vec2(1.0, 0.8))); c.rgb *= mix(0.78, 1.0, v); gl_FragColor = c; }' }));

window.renderFrame = function (f) {
  const t = f / FPS; Flat2D.T = t;
  // train charges in from the canyon (far -x) toward the camera side
  const s = -175 + 40 * t; TR.place(trainAt, s, s);
  for (let i = 0; i < PUFFS.length; i++) { const age = ((t * 3 + i * 0.137) % 1.6); const ch = TR.chimney(); const p = PUFFS[i]; p.position.set(ch.x - age * 12 - i * 0.3, ch.y + age * 3.2, ch.z + Math.sin(i) * age); const sc = 1.0 + age * 3.2; p.scale.set(sc, sc, sc); p.material.opacity = 0.8 * (1 - age / 1.6); }
  // acting: baron furious, points down the track; inspector shrugs, then both see the train
  const C0 = cam.position.clone();
  const see = t > 3.4;
  BARON.place(2.3, 0, 3.4); WORKER.place(0.7, 0, 2.6);
  const camPos = (() => { const c = CINE.at(t); return V(...c.pos); })();
  BARON.update({ ...act(t, [[0, 'angry'], [1.1, 'point'], [2.3, 'angry'], [3.4, 'shock']]), flip: false, face: see ? 'shock' : t > 1.1 && t < 2.3 ? 'angry' : 'angry', mark: see ? '!' : null }, camPos);
  WORKER.update({ ...act(t, [[0, 'idle'], [0.9, 'shrug'], [2.1, 'hips'], [3.5, 'panic']]), flip: true, face: see ? 'panic' : t > 0.9 ? 'smug' : 'deadpan' }, camPos);
  const c = CINE.at(t); cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); if (c.roll) cam.rotateZ(c.roll); cam.fov = c.fov; cam.updateProjectionMatrix();
  sun.target.position.set(c.look[0], 0, c.look[2]); sun.position.set(c.look[0] - 40, 60, c.look[2] + 30);
  composer.render(); return 'ok';
};
(async () => {
  const hdr = await new HDRLoader().loadAsync(A('assets/hdri/kloofendal_48d_partly_cloudy_puresky.hdr')); hdr.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(R); scene.environment = pm.fromEquirectangular(hdr).texture; scene.background = hdr; scene.backgroundIntensity = 1.0; scene.environmentIntensity = 0.75;
  await Promise.all(['boulder_01', 'rock_moss_set_01', 'dry_branches_medium_01', 'dead_tree_trunk', 'wooden_crate_01'].map(loadModel));
  build();
  await new Promise((r) => { THREE.DefaultLoadingManager.onLoad = r; setTimeout(r, 15000); });
  window.ready = true;
})();
