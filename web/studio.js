// studio.js : everything the coaster benchmark taught, packaged for every new story.
//   installActing()            HOLD-style acting + smooth expression in-betweens on every Flat2D character
//   keys(t, K)                 animator pose keys: [[time, pose, transition, ease]]  (pose-to-pose, then HOLD)
//   faceK(t, K, d)             expression keys with smooth in-betweens (lids slide, eyes drift, brows move)
//   makeLip(ENERGY)            mouth shape per frame from the voice energy (lip sync) -> mouth: lip(t), lip: true
//   makeSky(night)             painted sky dome + puffy clouds + stars + moon;  sky.update(camPos, isNight)
//   dynamicCam(CINE, o)        every shot gets a living camera move (push-in / pull-out / drift), reference-style
//   makeRenderer({...})        window.renderFrame with soft dissolves between shots + impact camera shake
import * as THREE from 'three';
import { Flat2D, FACES } from './flat2d.js';
import { R, scene, cam, sun, hemi, V, rng, setCam } from './realkit.js';

export const EZ = { io: (u) => u * u * (3 - 2 * u), in: (u) => u * u * u, out: (u) => 1 - (1 - u) ** 3, back: (u) => { const c = 1.6; return 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2; } };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, k) => a + (b - a) * k;
export function keys(t, K) {
  let i = 0; while (i < K.length - 1 && t >= K[i + 1][0]) i++; const [t0, cur, d = 0.16, ez = 'back'] = K[i]; const prev = i > 0 ? K[i - 1][1] : cur; const u = clamp((t - t0) / d, 0, 1), e = EZ[ez](u);
  const out = { ...cur }; for (const k of Object.keys(cur)) { const a = prev[k], b = cur[k]; if (Array.isArray(b) && Array.isArray(a)) out[k] = b.map((v, j) => lerp(a[j], v, e)); else if (typeof b === 'number' && typeof a === 'number') out[k] = lerp(a, b, e); }
  for (const k of Object.keys(prev)) if (!(k in cur) && typeof prev[k] === 'number') out[k] = lerp(prev[k], 0, e);
  // squash & stretch on every pose change + hat/head follow-through (the "rubber" bounce)
  if (u < 1 && i > 0) { const s = Math.sin(u * Math.PI); out.squash = (out.squash || 0) - 0.05 * s; out.hatOff = (out.hatOff || 0) + 14 * s; out.headLag = (out.headLag || 0) + 10 * s * Math.sign((cur.lean ?? 0) - (prev.lean ?? 0) || 1); }
  return out; }
export function faceK(t, K, d = 0.16) { K = K.map(([a, f]) => [a, typeof f === 'string' ? (FACES[f] || FACES.neutral) : f]); let i = 0; while (i < K.length - 1 && t >= K[i + 1][0]) i++; const [t0, B] = K[i]; const A = i > 0 ? K[i - 1][1] : B; const u = Math.min(1, Math.max(0, (t - t0) / d)), e = u * u * (3 - 2 * u);
  const num = (k, def) => { const a = A[k] ?? def, b = B[k] ?? def; return a + (b - a) * e; }; const lk = (A.look || [0, 0]).map((v, j) => v + ((B.look || [0, 0])[j] - v) * e);
  const f = { ...(e < 0.5 ? A : B), look: lk }; for (const k of ['lid', 'lidL', 'lidR', 'squint', 'brow', 'browL', 'browR', 'lidTilt']) if (k in A || k in B) f[k] = num(k, k.startsWith('lid') ? (A.lid ?? B.lid ?? 0.1) : 0);
  if (A.eyes !== B.eyes && u > 0.3 && u < 0.7 && A.eyes !== 'closed' && B.eyes !== 'closed') f.eyes = 'lid', f.lid = 0.6; return f; }
export const makeLip = (ENERGY, FPS = 30) => (t) => { const i = Math.min(ENERGY.length - 1, Math.round(t * FPS)); const e = ENERGY[i] || 0, d = e - (ENERGY[Math.max(0, i - 2)] || 0); return e > 0.55 ? (d > 0.05 ? 'talk' : 'smallO') : e > 0.35 ? 'talk' : e > 0.2 ? 'smallO' : 'line'; };

export function installActing() {
  Flat2D.T = 0; Flat2D.HOLD = true; const _u = Flat2D.prototype.update; const NUM = ['lid', 'lidL', 'lidR', 'squint', 'squintL', 'squintR', 'brow', 'browL', 'browR', 'lidTilt'];
  Flat2D.prototype.update = function (p = {}, c) { const T = Flat2D.T || 0; let f = typeof p.face === 'string' ? { ...(FACES[p.face] || FACES.neutral) } : p.face ? { ...p.face } : null;
    if (f) { const key = (f.eyes || '') + '|' + (f.lip ? 'lip' : f.mouth);
      if (this._fk !== key) { if (this._fk !== undefined && T - (this._ft || -9) > 0.04 && Math.abs(T - (this._fT ?? T)) < 0.1) { this._from = this._cur || f; this._ft = T; } else this._from = null; this._fk = key; }
      const u = this._from ? Math.min(1, (T - this._ft) / 0.16) : 1; if (u < 1 && this._from) { const A = this._from, e = u * u * (3 - 2 * u); const g = { ...(e < 0.5 ? { ...f, eyes: A.eyes, mouth: A.mouth } : f) };
        for (const k of NUM) if (k in A || k in f) { const a = A[k] ?? A.lid ?? 0.12, b = f[k] ?? f.lid ?? 0.12; g[k] = a + (b - a) * e; } if (A.look || f.look) { const la = A.look || [0, 0], lb = f.look || [0, 0]; g.look = la.map((v, j) => v + (lb[j] - v) * e); }
        if (f.lip) g.mouth = f.mouth; if (A.eyes !== f.eyes && e > 0.35 && e < 0.65 && A.eyes !== 'closed' && f.eyes !== 'closed') { g.eyes = 'lid'; g.lid = 0.55; } f = g; } else this._from = null;
      this._cur = f; this._fT = T; const since = T - (this._ft ?? -9), fs = since >= 0 && since < 0.7 ? Math.exp(-since * 6) * Math.sin(since * 26) : 0, F = this._cur;
      const fk = ['tiny', 'wide'].includes(F.eyes) || F.mouth === 'scream' ? 1.15 : ['squeeze', 'happy', 'closed'].includes(F.eyes) || ['laugh', 'psycho', 'grin'].includes(F.mouth) ? -1 : 0.6; p = { ...p, face: f, fs, fk }; }
    return _u.call(this, { turn: 0, ...p }, c); };
}

export function makeSky() {
  const M = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: new THREE.Color() }, bot: { value: new THREE.Color() } }, toneMapped: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying vec3 vP; void main(){ float h = clamp(vP.y * 1.6, 0.0, 1.0); gl_FragColor = vec4(mix(bot, top, pow(h, 0.7)), 1.0); }' });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1400, 32, 16), M); dome.renderOrder = -10; scene.add(dome);
  const clouds = new THREE.Group(); scene.add(clouds);
  { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const q = c.getContext('2d'); q.fillStyle = '#fff'; for (const [x, y, r] of [[70, 80, 34], [110, 62, 44], [158, 70, 38], [196, 86, 28], [128, 92, 40], [92, 96, 30], [170, 96, 30]]) { q.beginPath(); q.arc(x, y, r, 0, 7); q.fill(); }
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; const cr = rng(19);
    for (let i = 0; i < 40; i++) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, fog: false, depthWrite: false, toneMapped: false })); const a = cr() * Math.PI * 2; m.position.set(Math.cos(a) * 900, 120 + cr() * 380, Math.sin(a) * 900); const k = 60 + cr() * 90; m.scale.set(k * 2, k, 1); clouds.add(m); } }
  const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(Array.from({ length: 900 }, (_, i) => { const r = rng(5 + Math.floor(i / 3)); const a = r() * 6.28, b = 0.15 + r() * 1.3; return [Math.cos(a) * Math.cos(b) * 1300, Math.sin(b) * 1300, Math.sin(a) * Math.cos(b) * 1300][i % 3]; }), 3)), new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, fog: false, toneMapped: false })); scene.add(stars);
  const moon = new THREE.Mesh(new THREE.CircleGeometry(9, 40), new THREE.MeshBasicMaterial({ color: 0xfff8e0, toneMapped: false, fog: false })); scene.add(moon);
  const fogDay = new THREE.FogExp2(0xa8d8f4, 0.0008), fogNight = new THREE.FogExp2(0x0a1430, 0.012);
  return { update(cpos, n, grade) {
    scene.fog = n ? fogNight : fogDay; scene.background = null; dome.position.copy(cpos); clouds.position.set(cpos.x, 0, cpos.z); stars.position.copy(cpos); stars.visible = n;
    M.uniforms.top.value.setHex(n ? 0x0a1840 : 0x1d5fd6).convertSRGBToLinear(); M.uniforms.bot.value.setHex(n ? 0x2a4488 : 0x9fd2f4).convertSRGBToLinear(); clouds.children.forEach((c) => c.material.color.setHex(n ? 0x3a4a78 : 0xffffff).convertSRGBToLinear());
    scene.environmentIntensity = n ? 0.05 : 0.8; sun.color.set(n ? 0x7a98ff : 0xffe8c8); sun.intensity = n ? 0.35 : 2.6; hemi.intensity = n ? 0.12 : 0.4; hemi.color.set(n ? 0x3a5aa0 : 0xcfe4ff);
    R.toneMappingExposure = n ? 0.95 : 0.85; moon.visible = n; if (n) { const d = V(-0.35, 0.42, -1).normalize(); moon.position.copy(cpos).addScaledVector(d, 300); moon.lookAt(cpos); }
    if (grade) grade.uniforms.uTint.value.set(n ? 0.82 : 1.03, n ? 0.9 : 1.0, n ? 1.14 : 0.96); } };
}

// living camera: each shot starts from its framing and pushes in (or out) with an ease, plus a slow drift — the reference's
// measured average was a 1.2x-1.6x push per shot. Per shot: { push: 1.3 } (zoom factor over the shot), { drift: [x, y] } (frame fraction), { still: true }.
export function dynamicCam(CINE) {
  return (i, t) => { const S0 = CINE.shots[Math.max(0, Math.min(CINE.shots.length - 1, i))]; const own = S0.still || !!S0.sizeK;
    const SS = own ? S0 : { ...S0, size: Array.isArray(S0.size) ? S0.size[0] : S0.size, az: Array.isArray(S0.az) ? S0.az[0] : S0.az, el: Array.isArray(S0.el) ? S0.el[0] : S0.el, fov: Array.isArray(S0.fov) ? S0.fov[0] : S0.fov };
    const c = CINE._eval(SS, t); let pos = c.pos.clone(), look = c.look.clone(), fov = c.fov;
    if (!own) { const u = clamp((t - S0.t0) / Math.max(0.1, S0.t1 - S0.t0), 0, 1), e = u * u * (3 - 2 * u); const z = (1 + ((S0.push ?? 1.3) - 1) * e) * (S0.zoomK ? zoomAt(S0.zoomK, t) : 1); const [dx, dy] = S0.drift || [0.03, -0.02];
      if (S0.rig === 'pov') fov = (2 * Math.atan(Math.tan((fov * Math.PI) / 360) / z) * 180) / Math.PI; else pos = look.clone().add(pos.clone().sub(look).multiplyScalar(1 / z));
      const fwd = look.clone().sub(pos), dist = fwd.length(); fwd.normalize(); const right = V().crossVectors(fwd, V(0, 1, 0)).normalize(), up = V().crossVectors(right, fwd);
      const hh = 2 * dist * Math.tan((fov * Math.PI) / 360), ww = hh * (9 / 16); look.addScaledVector(right, dx * ww * e).addScaledVector(up, dy * hh * e); }
    return { pos: pos.toArray(), look: look.toArray(), fov, roll: (c.roll * Math.PI) / 180 }; };
}

export function makeRenderer({ CINE, camOf, setup, fx, look, composer, DURATION, FPS = 30, impacts = [], flash = () => 0 }) {
  const OUT = document.createElement('canvas'); OUT.width = R.domElement.width; OUT.height = R.domElement.height; const OG = OUT.getContext('2d'); window.__R = { domElement: OUT }; const DIS = 0.16;
  const renderWith = (t, c) => { for (const h of impacts) { const d = t - h; if (d > 0 && d < 0.4) { const a = 0.06 * Math.exp(-d * 10); c.pos[0] += a * Math.sin(d * 70); c.pos[1] += a * Math.cos(d * 55); } } if (c.pos[1] < 0.3) c.pos[1] = 0.3; setCam(c); setup(t, cam.position.clone()); look(t, cam.position); fx(t); composer.render(); };
  window.renderFrame = function (f) {
    const t = f / FPS; const shots = CINE.shots; let i = 0; while (i < shots.length - 1 && t >= shots[i + 1].t0) i++;
    const nb = shots[i + 1] && Math.abs(t - shots[i + 1].t0) < DIS / 2 ? i + 1 : (Math.abs(t - shots[i].t0) < DIS / 2 && i > 0 ? i : -1);
    scene.traverse((o) => o.userData.tick && o.userData.tick(t));
    composer.grade.uniforms.uFade.value = Math.max(0, 1 - t / 0.15) + Math.max(0, (t - (DURATION - 0.3)) / 0.3); composer.grade.uniforms.uFlash.value = flash(t);
    setup(t, V(...camOf(i, t).pos)); const W = OUT.width, H = OUT.height;
    if (nb < 0) { renderWith(t, camOf(i, t)); OG.globalAlpha = 1; OG.drawImage(R.domElement, 0, 0); return 'ok'; }
    const u = Math.min(1, Math.max(0, (t - (shots[nb].t0 - DIS / 2)) / DIS)), e = u * u * (3 - 2 * u);
    renderWith(t, camOf(nb - 1, t)); const sa = 1 + 0.04 * e; OG.globalAlpha = 1; OG.drawImage(R.domElement, W * (1 - sa) / 2, H * (1 - sa) / 2, W * sa, H * sa);
    renderWith(t, camOf(nb, t)); const sb = 1.04 - 0.04 * e; OG.globalAlpha = e; OG.drawImage(R.domElement, W * (1 - sb) / 2, H * (1 - sb) / 2, W * sb, H * sb); OG.globalAlpha = 1;
    return 'ok'; };
}

// VOICE-DRIVEN PERFORMANCE: every stressed word of the narration gives the on-screen character a springy accent
// (head tilt, brow pop, little hop / squash, hat bounce, lean or glance) — directions alternate and vary, so nothing repeats robotically.
export function makeAccents(WORDS, ENERGY, FPS = 30) {
  const on = WORDS.map(([w, t], i) => { const k = Math.round(t * FPS); let e = 0; for (let j = k; j < k + 7 && j < ENERGY.length; j++) e = Math.max(e, ENERGY[j] || 0); return { t, e, i, w: w.replace(/[^a-z]/gi, '') }; });
  const es = on.map((o) => o.e).sort((a, b) => a - b), thr = es[Math.floor(es.length * 0.3)]; const acc = on.filter((o) => o.e >= thr && o.w.length > 2);
  return (t, amp = 1, seed = 0) => { const out = { tilt: 0, lean: 0, hop: 0, squash: 0, headLag: 0, hatOff: 0, brow: 0, turn: 0 };
    for (const o of acc) { const u = t - o.t + 0.05; if (u < 0 || u > 0.75) continue; const s = Math.exp(-u * 6) * Math.sin(u * 16), k = 0.45 + 0.55 * (o.e - thr) / (1 - thr + 1e-6), d = (o.i + seed) % 2 ? 1 : -1, v = (o.i * 7 + seed) % 3;
      out.tilt += d * 8 * s * k; out.hop += (v === 0 ? 12 : 5) * Math.max(0, s) * k; out.squash -= 0.04 * s * k; out.headLag += d * 7 * s * k; out.hatOff += 12 * Math.abs(s) * k; out.brow += 0.5 * Math.max(0, s) * k; out.lean += (v === 1 ? d * 6 : 0) * s * k; out.turn += (v === 2 ? d * 0.2 : 0) * s * k; }
    for (const k in out) out[k] *= amp; return out; };
}
export function withAccent(pose, a) { const p = { ...pose }; for (const k of ['tilt', 'lean', 'hop', 'squash', 'headLag', 'hatOff']) p[k] = (p[k] || 0) + a[k]; if (a.turn) p.turn = (typeof p.turn === 'number' ? p.turn : 0) + a.turn;
  if (a.brow && p.face) { const f = typeof p.face === 'string' ? { ...(FACES[p.face] || FACES.neutral) } : { ...p.face }; if ('browL' in f || 'browR' in f) { f.browL = (f.browL ?? 0) + a.brow; f.browR = (f.browR ?? 0) + a.brow; } else f.brow = (f.brow ?? 0) + a.brow; p.face = f; } return p; }
// keyed crash-zooms: [[t, zoom, dur]] with a springy back-ease (zoom multiplies the shot's push)
export const zoomAt = (K, t) => { let z = 1, prev = 1; for (const [t0, v, d = 0.13] of K) { if (t < t0) break; const u = Math.min(1, (t - t0) / d); z = prev + (v - prev) * EZ.back(u); prev = v; } return z; };
