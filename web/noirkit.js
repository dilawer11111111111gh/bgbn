// noirkit.js (Studio v9.2): NOIR for any era. Rain, wet reflective streets, lamp pools, lightning, a 3D gem, a 1940s sedan,
// the old-town street (cobbles, brick/plaster houses, gas lamps) and looks:
//   NOIR.bw    — 1920s–50s black & white (history)        NOIR.neon — neon-noir colour for TODAY (blue night + magenta/cyan neon)
// Today's street = realCity({ night: true }) from city2.js + rain + NOIR.neon.
//   import { NOIR, applyNoir, rain, oldNoirStreet, sedan40s, gem, lightning } from '../../web/noirkit.js';
import * as THREE from 'three';
import { scene, V, mesh, std, sun, hemi } from './realkit.js';
import { Batch, boxUV, texMat, house, lampPost } from './world3d.js';

export const NOIR = {
  bw: { sat: 0.0, con: 1.3, tint: [1.12, 1.12, 1.12], sun: [0xbfd0ff, 0.8], hemi: 0.32, sky: true },
  sepia: { sat: 0.25, con: 1.25, tint: [1.08, 0.98, 0.84], sun: [0xffe0b0, 0.6], hemi: 0.2, sky: true },
  neon: { sat: 1.15, con: 1.2, tint: [0.92, 0.98, 1.12], sun: [0x7a9aff, 0.45], hemi: 0.22, sky: true },
};
// call every frame from look(): switches the whole grade (B&W ↔ colour) instantly — so one video can jump from 1947 to today
export function applyNoir(composer, SKY, cpos, look) { const L = typeof look === 'string' ? NOIR[look] : look; const u = composer.grade.uniforms; u.uSat.value = L.sat; u.uCon.value = L.con; u.uTint.value.setRGB(...L.tint);
  sun.color.setHex(L.sun[0]); sun.intensity = L.sun[1]; hemi.intensity = L.hemi; if (SKY) SKY.update(cpos, true, composer.grade); u.uSat.value = L.sat; u.uCon.value = L.con; }
// rain streaks in a box that follows the camera (+ splashes are implied by wet reflections). speed 1 = normal, 0.1 = slow-mo
export function rain(n = 2600, o = {}) { const pos = new Float32Array(n * 6), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const R = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: o.color ?? 0xdde8ff, transparent: true, opacity: o.opacity ?? 0.34, toneMapped: false })); R.frustumCulled = false; scene.add(R);
  const seed = Array.from({ length: n }, (_, i) => [Math.sin(i * 12.9898) * 0.5 + 0.5, Math.sin(i * 78.233) * 0.5 + 0.5, Math.sin(i * 39.425) * 0.5 + 0.5].map((v) => (v * 9.73) % 1));
  return { mesh: R, update(t, camPos, camDir, on = true, speed = 1) { R.visible = on; if (!on) return; const d = camDir || V(0, 0, -1); const side = V(-d.z, 0, d.x);
    for (let i = 0; i < n; i++) { const [a, b, h] = seed[i]; const c = camPos.clone().addScaledVector(d, 1 + b * 14).addScaledVector(side, (a - 0.5) * 16); const y = camPos.y + 6 - ((t * 9 * speed + h * 12) % 12);
      pos[i * 6] = c.x; pos[i * 6 + 1] = y; pos[i * 6 + 2] = c.z; pos[i * 6 + 3] = c.x + 0.03; pos[i * 6 + 4] = y - 0.55; pos[i * 6 + 5] = c.z; } g.attributes.position.needsUpdate = true; } }; }
// lightning: returns flash 0..1 for the given strike times (use: composer.grade.uniforms.uFlash.value = 0.6 * flash)
export const lightning = (t, times) => { let f = 0; for (const s of times) { const d = t - s; if (d >= 0 && d < 0.5) f = Math.max(f, d < 0.06 ? 1 : d < 0.12 ? 0.2 : d < 0.18 ? 0.8 : Math.exp(-(d - 0.18) * 10)); } return f; };
// wet look for any material: low roughness + a little metalness so lamps reflect in streets
export const wet = (m) => { const c = m.clone(); c.roughness = 0.16; c.metalness = 0.35; return c; };
// faceted glowing gem (diamond) — props that matter are 3D
export function gem(color = 0xbfe8ff, s = 0.3) { const g = new THREE.Group(); const m = new THREE.MeshPhysicalMaterial({ color, metalness: 0.1, roughness: 0.02, transmission: 0.4, thickness: 0.5, clearcoat: 1, emissive: color, emissiveIntensity: 0.6, flatShading: true });
  const top = new THREE.Mesh(new THREE.ConeGeometry(s, s * 0.6, 8), m); top.position.y = s * 0.3; const bot = new THREE.Mesh(new THREE.ConeGeometry(s, s * 1.3, 8), m); bot.rotation.x = Math.PI; bot.position.y = -s * 0.65; g.add(top, bot);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const q = c.getContext('2d'); const gr = q.createRadialGradient(32, 32, 1, 32, 32, 30); gr.addColorStop(0, 'rgba(230,250,255,1)'); gr.addColorStop(1, 'rgba(150,220,255,0)'); q.fillStyle = gr; q.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  glow.scale.setScalar(s * 2.6); g.add(glow); g.userData.glow = glow; scene.add(g); return g; }
// 1940s sedan: rounded extruded body, chrome bumpers, white-wall tyres, glowing headlamps (front = +x)
export function sedan40s(color = 0x141416) { const G = new THREE.Group(); const sh = new THREE.Shape(); sh.moveTo(-2.5, 0.35); sh.quadraticCurveTo(-2.6, 0.95, -2.1, 1.0); sh.quadraticCurveTo(-1.5, 1.65, -0.4, 1.68); sh.quadraticCurveTo(0.6, 1.68, 1.05, 1.05); sh.quadraticCurveTo(2.35, 1.0, 2.55, 0.62); sh.lineTo(2.55, 0.35); sh.closePath();
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 1.8, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 4, curveSegments: 18 }), new THREE.MeshPhysicalMaterial({ color, roughness: 0.18, metalness: 0.6, clearcoat: 1, clearcoatRoughness: 0.08 })); body.position.z = -0.9; G.add(body);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x8890a0, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.55 }); for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.48), glass); w.position.set(-0.45, 1.33, s * 1.03); w.rotation.y = s > 0 ? 0 : Math.PI; G.add(w); }
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.08, metalness: 1 }); const bump = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.12, 2.1), chrome); bump.position.y = 0.42; G.add(bump);
  for (const s of [-1, 1]) { const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.1, 18), new THREE.MeshBasicMaterial({ color: 0xfff6dc, toneMapped: false })); hl.rotation.z = Math.PI / 2; hl.position.set(2.5, 0.85, s * 0.62); G.add(hl); }
  for (const [x, z] of [[-1.6, 1], [1.6, 1], [-1.6, -1], [1.6, -1]]) { const ty = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 24), std(0x0c0c0c, { r: 0.8 })); ty.rotation.x = Math.PI / 2; ty.position.set(x, 0.42, z); G.add(ty); const ww = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.34, 24), std(0xe8e8e8, { r: 0.5 })); ww.rotation.x = Math.PI / 2; ww.position.set(x, 0.42, z); G.add(ww); }
  G.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); scene.add(G); return G; }
// old-town noir street (history): wet cobbles, sidewalks, brick/plaster houses, gas lamps with warm light pools, crates
export function oldNoirStreet(o = {}) { const B = new Batch(), z0 = o.z0 ?? 10, L = o.len ?? 140, x0 = o.x ?? 0; const lamps = [];
  const road = mesh(new THREE.PlaneGeometry(14, L), (() => { const m = texMat('cobble', '#6a6a6e', { r: 0.25 }).clone(); m.roughness = 0.2; m.metalness = 0.35; return m; })(), x0, 0.001, z0 - L / 2); road.rotation.x = -Math.PI / 2; road.receiveShadow = true; scene.add(road);
  for (const s of [-1, 1]) { const sw = mesh(boxUV(3, 0.18, L, 2), wet(texMat('tiles', '#8a8a8a', { r: 0.4 })), x0 + s * 8.5, 0.09, z0 - L / 2); sw.receiveShadow = true; scene.add(sw); }
  for (let i = 0; i < Math.floor(L / 11); i++) for (const s of [-1, 1]) { const z = z0 - i * 11; house(B, x0 + s * 15, z, s > 0 ? -Math.PI / 2 : Math.PI / 2, { w: 10.5, d: 10, h: 9 + ((i * 7 + (s > 0 ? 3 : 0)) % 5) * 1.6, kind: i % 3 ? 'brick' : 'plaster', wall: o.wall || '#8a7a6a', roof: '#3a3a3c', shutter: '#2a2a2a', door: '#1a1a1a', flowers: false, seed: i * 2 + (s > 0 ? 1 : 0) }); }
  for (let i = 0; i < Math.floor(L / 12); i++) for (const s of [-1, 1]) { const z = z0 - 6 - i * 12 + (s > 0 ? 6 : 0); lampPost(B, x0 + s * 7.4, z, 4.4); const bulb = mesh(new THREE.SphereGeometry(0.22, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff4d8, toneMapped: false }), x0 + s * 7.0, 4.25, z, false); scene.add(bulb);
    if (i < (o.lights ?? 6)) { const Lp = new THREE.PointLight(0xffe2b0, 16, 16, 1.6); Lp.position.set(x0 + s * 7.0, 4.2, z); scene.add(Lp); lamps.push(Lp); } }
  B.flush(); return { lamps }; }
