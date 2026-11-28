// eras.js — Studio v9 ERA KITS: colourful, Pixar-like sets built in code (rounded shapes, jewel colours, gold, gardens, water).
// Every kit returns anchor points (throne, gate, field...) so a story can place people and cameras.
// Rule: NEVER plain white/grey boxes. Each kit has: a hero building with layered shapes, a 3–5 colour palette,
// rich materials (patterned tiles, gold, marble, cloth), life (water, fountains, flags, lanterns, trees, flowers).
import * as THREE from 'three';
import { scene, V, std, mesh, water, Burst } from './realkit.js';
import { Batch, texMat, plain, boxUV, terrain, forest, flowers, scatter, grass, photoMat } from './world3d.js';
import { pbr } from './realkit.js';

const ctex = (w, h, fn, rep = [1, 1]) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; return t; };
export const mat = (o) => new THREE.MeshPhysicalMaterial({ roughness: 0.55, ...o });
// rounded box (bevelled) — soft "toy" edges catch the light like Pixar sets
export function rbox(w, h, d, r = 0.2) { const s = new THREE.Shape(), x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.01, d - 2 * r), bevelEnabled: true, bevelSize: r, bevelThickness: r, bevelSegments: 3, curveSegments: 6 }); g.translate(0, 0, -(d - 2 * r) / 2); g.computeVertexNormals(); return g; }
// ---------- patterned materials
export const TILE = (a = '#1aa3b8', b = '#f6f0e0', c = '#1a4a9a', rep = [4, 1]) => mat({ map: ctex(256, 256, (g, W) => { g.fillStyle = b; g.fillRect(0, 0, W, W); g.fillStyle = a; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const cx = 64 + i * 128, cy = 64 + j * 128; g.beginPath(); for (let k = 0; k < 16; k++) { const ang = (k / 16) * Math.PI * 2, r = k % 2 ? 26 : 58; g.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r); } g.closePath(); g.fill(); g.fillStyle = c; g.beginPath(); g.arc(cx, cy, 16, 0, 7); g.fill(); g.fillStyle = a; }
  g.strokeStyle = c; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, W - 6); }, rep), roughness: 0.25, clearcoat: 0.6 });
export const STRIPES = (cols, n = 8, rep = [1, 1]) => mat({ map: ctex(256, 256, (g, W) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect((i / n) * W, 0, W / n + 1, W); } }, rep), roughness: 0.7, side: THREE.DoubleSide });
export const CHECKER = (a, b, rep) => mat({ map: ctex(256, 256, (g, W) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? a : b; g.fillRect(i * 32, j * 32, 32, 32); } g.strokeStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, W); g.moveTo(0, i * 32); g.lineTo(W, i * 32); g.stroke(); } }, rep), roughness: 0.3, clearcoat: 0.5 });
export const GOLD = () => mat({ color: 0xffc23a, metalness: 1, roughness: 0.22, clearcoat: 0.6, emissive: 0x3a2400 });
const onion = (r, h) => { const p = []; for (let i = 0; i <= 28; i++) { const u = i / 28; const rr = r * Math.sin(Math.PI * (0.12 + 0.8 * u)) * (1 + 0.32 * Math.sin(Math.PI * u * 1.1)) * (1 - u ** 3 * 0.92); p.push(new THREE.Vector2(Math.max(0.03, rr), u * h)); } return new THREE.LatheGeometry(p, 48); };
const archShape = (w, h) => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(-w / 2, h * 0.6); s.quadraticCurveTo(-w / 2, h * 0.9, 0, h); s.quadraticCurveTo(w / 2, h * 0.9, w / 2, h * 0.6); s.lineTo(w / 2, 0); return new THREE.ShapeGeometry(s, 12); };

// ================= MUGHAL / ROYAL PALACE KIT =================
// o: { z (palace front), palette: {stone, marble, tile, tile2, tile3, cloth:[...], gold} }
export function royalPalace(o = {}) { const P = { stone: '#c8583a', stone2: '#a8442a', marble: '#fbf3e4', tile: '#18a8b8', tile2: '#1a4a9a', tile3: '#f6f0e0', cloth: ['#e8282a', '#ffc23a'], ...o.palette };
  const z0 = o.z ?? -58, B = new Batch(); const stone = photoMat('brick', { rep: 1 }), stone2 = pbr('red_sandstone_wall', [1, 1], { metal: 0, rough: 1 }), marble = pbr('sandstone_cracks', [1, 1], { metal: 0, rough: 0.9, tint: '#f0c890' }), gold = GOLD(), tile = TILE(P.tile, '#e8b870', P.tile2, [10, 1]), dark = mat({ color: 0x2a1410, roughness: 0.9 });
  // main hall: two stepped rounded blocks + marble cornices + tile friezes
  B.add(boxUV(58, 15, 14, 2.2), stone, 0, 7.5, z0 - 8); B.add(boxUV(60, 1.2, 15.4, 2), marble, 0, 15.4, z0 - 8); B.add(new THREE.BoxGeometry(58.2, 1.6, 14.2), tile, 0, 13.6, z0 - 8 + 0.02);
  B.add(boxUV(30, 8, 12, 3), stone2, 0, 19.5, z0 - 9); B.add(new THREE.BoxGeometry(30.2, 1.2, 12.2), tile, 0, 22.4, z0 - 9); for (let i = -13; i <= 13; i++) B.add(rbox(1.1, 1.3, 1.1, 0.25), marble, i * 2.2, 16.6, z0 - 1.1);
  // entrance iwan: tall marble frame with a dark arch and tile border
  B.add(boxUV(14, 17, 2.2, 3), stone2, 0, 8.5, z0 - 0.6); B.add(new THREE.BoxGeometry(12, 15, 0.1), tile, 0, 8.3, z0 + 0.52); B.add(archShape(9, 13), dark, 0, 0.6, z0 + 0.6); B.add(archShape(9.8, 13.6), gold, 0, 0.3, z0 + 0.56);
  // arcades left/right: marble-framed arches with gold edges
  for (let i = 1; i <= 5; i++) for (const sd of [-1, 1]) { const x = sd * (5.2 + i * 4.4); B.add(archShape(3.6, 7.6), marble, x, 1.1, z0 - 0.88); B.add(archShape(3.0, 6.8), dark, x, 1.2, z0 - 0.84); B.add(archShape(2.4, 4), dark, x, 9.0, z0 - 0.84); B.add(archShape(3.0, 4.6), marble, x, 8.7, z0 - 0.88); }
  // great golden onion dome on a tile drum + marble lotus base + gold finial
  B.add(new THREE.CylinderGeometry(8.4, 8.4, 4.5, 48), tile, 0, 25.6, z0 - 9); B.add(new THREE.CylinderGeometry(8.9, 8.9, 0.8, 48), marble, 0, 27.9, z0 - 9); B.add(onion(8.6, 15), gold, 0, 28.2, z0 - 9); B.add(new THREE.CylinderGeometry(0.15, 0.3, 4, 10), gold, 0, 44.5, z0 - 9); B.add(new THREE.SphereGeometry(0.6, 16, 12), gold, 0, 44, z0 - 9);
  // corner chhatris (domed pavilions on 4 pillars)
  const chhatri = (x, y, z, s = 1) => { for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B.add(new THREE.CylinderGeometry(0.22 * s, 0.22 * s, 3 * s, 10), marble, x + a * 1.3 * s, y + 1.5 * s, z + b * 1.3 * s); B.add(rbox(3.4 * s, 0.4 * s, 3.4 * s, 0.12), stone2, x, y + 3.2 * s, z); B.add(onion(1.9 * s, 3.2 * s), gold, x, y + 3.4 * s, z); B.add(new THREE.ConeGeometry(0.12 * s, 1.2 * s, 8), gold, x, y + 6.8 * s, z); };
  for (const sx of [-1, 1]) { chhatri(sx * 24, 16, z0 - 3); chhatri(sx * 11, 23, z0 - 5, 0.8); }
  // striped minarets with balconies and gold caps
  for (const [x, z] of [[-33, z0 - 1], [33, z0 - 1], [-33, z0 - 15], [33, z0 - 15]]) { for (let k = 0; k < 10; k++) B.add(new THREE.CylinderGeometry(1.55 - k * 0.04, 1.6 - k * 0.04, 3.2, 20), k % 2 ? marble : stone, x, 1.6 + k * 3.2, z); for (const h of [11, 21, 31]) { B.add(new THREE.CylinderGeometry(2.6, 2.2, 0.6, 20), marble, x, h, z); B.add(new THREE.CylinderGeometry(2.6, 2.6, 0.9, 20, 1, true), tile, x, h + 0.75, z); } chhatri(x, 32, z, 0.75); }
  // throne platform: marble steps, gold throne with jewels, striped shamiana canopy on gold poles
  const tz = z0 + 6; for (let k = 0; k < 4; k++) B.add(boxUV(15 - k * 2.6, 0.55, 9 - k * 1.5, 2), k % 2 ? marble : stone2, 0, 0.27 + k * 0.55, tz + k * 0.4);
  B.add(rbox(2.8, 0.9, 1.8, 0.2), gold, 0, 2.7, tz + 0.4); B.add(rbox(3.2, 4.6, 0.5, 0.2), gold, 0, 4.6, tz - 0.4); B.add(new THREE.SphereGeometry(0.7, 20, 14), mat({ color: 0xe8203a, roughness: 0.1, clearcoat: 1 }), 0, 7.2, tz - 0.4); for (const sx of [-1, 1]) B.add(new THREE.SphereGeometry(0.4, 16, 12), mat({ color: 0x18a8ff, roughness: 0.1, clearcoat: 1 }), sx * 1.4, 6.4, tz - 0.4);
  for (const sx of [-1, 1]) for (const dz of [-3, 3.2]) B.add(new THREE.CylinderGeometry(0.18, 0.22, 8, 12), gold, sx * 4, 6, tz + dz); const canopy = mesh(new THREE.ConeGeometry(6.6, 2.6, 4, 1, true), STRIPES(P.cloth, 12, [3, 1]), 0, 11.3, tz + 0.1); canopy.rotation.y = Math.PI / 4; scene.add(canopy);
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; B.add(new THREE.ConeGeometry(0.35, 0.8, 6), mat({ color: P.cloth[k % 2] }), Math.cos(a) * 4.6, 9.7, tz + Math.sin(a) * 4.6, 0, Math.PI, 0); }
  B.flush();
  return { throne: V(0, 2.75 + 0.45, tz + 0.5), front: z0, gold, marble, stone, tile };
}
// garden courtyard: marble+terracotta checker floor, central water channel with fountains, lawns, cypress rows, flower beds, lanterns
export function mughalGarden(o = {}) { const z1 = o.z1 ?? -50, z2 = o.z2 ?? -4, W = o.w ?? 56; const zc = (z1 + z2) / 2, L = z2 - z1;
  const floor = mesh(new THREE.PlaneGeometry(W, L + 6), pbr('sandstone_cracks', [W / 5, (L + 6) / 5], { metal: 0, rough: 0.95, tint: '#e8b888' }), 0, 0.02, zc, false); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  for (const sd of [-1, 1]) { const lawn = mesh(new THREE.PlaneGeometry(W * 0.18, L - 4), pbr('aerial_grass_rock', [6, 10], { tint: '#6cd23c', rough: 1 }), sd * W * 0.38, 0.05, zc, false); lawn.rotation.x = -Math.PI / 2; lawn.receiveShadow = true; scene.add(lawn); }
  const ch = water(3.4, L - 2, { color: 0x1ab8d8 }); ch.position.set(0, 0.12, zc); scene.add(ch); const B = new Batch(); const marble = pbr('red_sandstone_wall', [1, 1], { metal: 0, rough: 1 });
  for (const sd of [-1, 1]) B.add(rbox(0.5, 0.35, L - 1.4, 0.1), marble, sd * 1.95, 0.17, zc); const founts = [];
  for (let k = 0; k < 5; k++) { const z = z1 + 4 + k * ((L - 8) / 4); B.add(new THREE.CylinderGeometry(0.9, 1.1, 0.4, 20), marble, 0, 0.3, z); B.add(new THREE.CylinderGeometry(0.15, 0.2, 0.9, 10), GOLD(), 0, 0.7, z); founts.push(new Burst({ n: 30, dur: 1, life: 0.9, speed: [3.5, 4.5], dir: [0, 1, 0], spread: 0.12, g: -9.8, size: [0.08, 0.16], tex: 'splash', opacity: 0.8, seed: k * 7 })); founts[k].z = z; }
  // lanterns on marble posts
  for (let k = 0; k < 8; k++) for (const sd of [-1, 1]) { const z = z1 + 2 + k * ((L - 4) / 7); B.add(new THREE.CylinderGeometry(0.12, 0.16, 2.6, 8), marble, sd * (W * 0.5 - 1.5), 1.3, z); const l = mesh(new THREE.SphereGeometry(0.32, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffd27a, toneMapped: false }), sd * (W * 0.5 - 1.5), 2.8, z, false); scene.add(l); }
  B.flush();
  const T = []; for (let k = 0; k < 12; k++) for (const sd of [-1, 1]) T.push([sd * (W * 0.38 + (k % 2 ? 3 : -3)), z1 + 2 + k * ((L - 4) / 11), 1.4 + (k % 3) * 0.2, 1, k + (sd > 0 ? 50 : 0)]);
  forest(T, ['pine', 'round', 'pine', 'round']);
  for (const sd of [-1, 1]) flowers(scatter(500, (r) => [sd * (W * 0.38) + (r() - 0.5) * W * 0.16, z1 + 2 + r() * (L - 4), 0.05], 21 + sd));
  return { fountains: founts, update: (t) => founts.forEach((f) => f.update(t, 0, V(0, 0.9, f.z), 1.0)) };
}
// lush battlefield: green rolling hills, trees, distant blue mountains, striped tents
export function greenField(o = {}) { const flat = (x, z) => (Math.abs(x) < (o.flatW ?? 150) && z > -95 && z < (o.flatZ ?? 160) ? 0 : 1);
  terrain(1600, 240, flat, pbr('aerial_grass_rock', [160, 160], { tint: o.tint || '#7cd04a', rough: 1 }));
  const M = mat({ color: 0x6a8ac8, roughness: 0.9 }); for (let i = 0; i < 14; i++) { const a = -0.9 + i * 0.13; const m = mesh(new THREE.ConeGeometry(60 + (i % 3) * 25, 70 + (i % 4) * 30, 7), M, Math.sin(a) * 520, 25, 380 + Math.cos(a) * 140, false); scene.add(m); const cap = mesh(new THREE.ConeGeometry(18 + (i % 3) * 6, 20, 7), mat({ color: 0xffffff }), m.position.x, m.position.y + 25 + (i % 4) * 15, m.position.z, false); scene.add(cap); }
  const T = []; for (let i = 0; i < 160; i++) { const sd = i % 2 ? 1 : -1; T.push([sd * (60 + ((i * 37) % 160)), -40 + ((i * 53) % 260), 1.4 + (i % 5) * 0.3, i % 4, i]); } forest(T, ['round', 'pine', 'blossom', 'bush']);
  grass(scatter(3000, (r) => [(r() - 0.5) * 120, -2 + r() * 160, 0], 5), 1.4);
  const tents = []; for (let i = 0; i < (o.tents ?? 14); i++) { const sd = i % 2 ? 1 : -1, x = sd * (30 + (i % 4) * 9), z = (o.tentZ ?? 150) + (i % 3) * 8; const t = mesh(new THREE.ConeGeometry(3.2, 4.4, 10), STRIPES(i % 2 ? ['#e8282a', '#ffffff'] : ['#1a4a9a', '#ffc23a'], 10, [2, 1]), x, 2.2, z); scene.add(t); tents.push(t); }
  return { tents };
}

// ================= MODERN CITY KIT (today) =================
// glass towers with window grids, street with lanes + zebra, shops with awnings + neon signs, traffic lights, planters,
// and high-end rounded cars that drive (call city.update(t)). o: { z0, len, night }
export function modernCar(color = '#e8282a', o = {}) { const G = new THREE.Group(); const paint = mat({ color, metalness: 0.5, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05 });
  const sh = new THREE.Shape(); sh.moveTo(-2.25, 0.3); sh.quadraticCurveTo(-2.35, 0.75, -2.0, 0.82); sh.quadraticCurveTo(-1.3, 0.9, -0.95, 1.38); sh.quadraticCurveTo(-0.3, 1.62, 0.55, 1.55); sh.quadraticCurveTo(1.15, 1.45, 1.45, 0.98); sh.quadraticCurveTo(2.2, 0.9, 2.3, 0.6); sh.lineTo(2.3, 0.3); sh.closePath();
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 1.55, bevelEnabled: true, bevelSize: 0.14, bevelThickness: 0.16, bevelSegments: 5, curveSegments: 20 }), paint); body.position.z = -0.775; G.add(body);
  const glass = mat({ color: 0x223040, metalness: 0.3, roughness: 0.04, transparent: true, opacity: 0.8, clearcoat: 1 }); const gs = new THREE.Shape(); gs.moveTo(-0.85, 0.98); gs.quadraticCurveTo(-0.25, 1.5, 0.5, 1.46); gs.quadraticCurveTo(1.0, 1.38, 1.28, 1.0); gs.closePath();
  for (const z of [-0.94, 0.94]) { const w = new THREE.Mesh(new THREE.ShapeGeometry(gs, 12), glass); w.position.z = z; w.position.y = 0.02; G.add(w); } const ws = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.6), glass); ws.position.set(1.3, 1.18, 0); ws.rotation.set(0, Math.PI / 2, 0.85); G.add(ws);
  const chrome = mat({ color: 0xffffff, metalness: 1, roughness: 0.08 }), rub = mat({ color: 0x141414, roughness: 0.8 }); for (const [x, z] of [[-1.45, 0.82], [1.45, 0.82], [-1.45, -0.82], [1.45, -0.82]]) { const ty = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.13, 12, 24), rub); ty.position.set(x, 0.42, z); G.add(ty); const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.2, 18), chrome); rim.rotation.x = Math.PI / 2; rim.position.set(x, 0.42, z); G.add(rim); }
  for (const z of [-0.55, 0.55]) { const hl = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff6dc, toneMapped: false })); hl.scale.set(0.5, 0.8, 1.4); hl.position.set(2.32, 0.68, z); G.add(hl); const tl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.38), new THREE.MeshBasicMaterial({ color: 0xff2030, toneMapped: false })); tl.position.set(-2.33, 0.72, z); G.add(tl); }
  const strip = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.06, 1.88), chrome); strip.position.y = 0.5; G.add(strip); G.traverse((m) => (m.castShadow = true)); G.scale.setScalar(o.scale ?? 1); scene.add(G); return G; }
const windowTex = (base, lit, rep) => ctex(256, 512, (g, W, H) => { g.fillStyle = base; g.fillRect(0, 0, W, H); for (let y = 8; y < H; y += 32) for (let x = 8; x < W; x += 32) { const on = Math.sin(x * 12.9 + y * 7.1) > 0.2; g.fillStyle = on ? lit : 'rgba(20,40,60,0.85)'; g.fillRect(x, y, 22, 24); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x, y, 22, 4); } }, rep);
const neon = (txt, col) => { const t = ctex(512, 160, (g, W, H) => { g.fillStyle = '#141018'; g.fillRect(0, 0, W, H); g.font = 'bold 96px "DejaVu Sans"'; g.textAlign = 'center'; g.shadowColor = col; g.shadowBlur = 30; g.fillStyle = col; g.fillText(txt, W / 2, 118); g.fillStyle = '#ffffff'; g.shadowBlur = 0; g.globalAlpha = 0.6; g.fillText(txt, W / 2, 118); }); return new THREE.MeshBasicMaterial({ map: t, toneMapped: false }); };
export function modernCity(o = {}) { const z0 = o.z0 ?? 0, L = o.len ?? 200; const B = new Batch();
  const asphalt = mat({ map: ctex(256, 256, (g, W) => { g.fillStyle = '#2a2c30'; g.fillRect(0, 0, W, W); for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '0,0,0'},0.05)`; g.fillRect(Math.random() * W, Math.random() * W, 2, 2); } g.fillStyle = '#f2f2e8'; g.fillRect(W / 2 - 3, 20, 6, 90); g.fillRect(W / 2 - 3, 148, 6, 90); }, [1, L / 12]), roughness: 0.55, clearcoat: 0.3 });
  const road = mesh(new THREE.PlaneGeometry(14, L), asphalt, 0, 0.02, z0 - L / 2, false); road.rotation.x = -Math.PI / 2; road.receiveShadow = true; scene.add(road);
  const walk = pbr('sandstone_cracks', [2, L / 4], { metal: 0, rough: 0.9, tint: '#d8d0c8' }); for (const sd of [-1, 1]) { const w = mesh(new THREE.BoxGeometry(6, 0.25, L), walk, sd * 10, 0.12, z0 - L / 2); w.receiveShadow = true; scene.add(w); }
  for (let k = 0; k < 8; k++) B.add(new THREE.BoxGeometry(0.9, 0.03, 4), mat({ color: 0xf6f6f0 }), -6 + k * 1.7, 0.04, z0 - 30);
  const pal = o.palette || ['#18a8b8', '#ff7a5a', '#f4c84a', '#5a8ae8', '#e86ab0', '#7ad89a'];
  const towers = []; for (let i = 0; i < Math.floor(L / 16); i++) for (const sd of [-1, 1]) { const h = 20 + ((i * 37 + (sd > 0 ? 11 : 0)) % 7) * 10, w = 11 + (i % 3) * 2, d = 12, x = sd * (13 + w / 2), z = z0 - 8 - i * 16; const col = pal[(i + (sd > 0 ? 2 : 0)) % pal.length];
    const glassM = mat({ map: windowTex(col, o.night ? '#ffd88a' : '#a8e0ff', [w / 6, h / 10]), metalness: 0.35, roughness: 0.12, clearcoat: 1, emissive: o.night ? 0x332200 : 0x000000 });
    const T = mesh(new THREE.BoxGeometry(w, h, d), glassM, x, h / 2, z); T.castShadow = true; T.receiveShadow = true; scene.add(T); towers.push(T); B.add(rbox(w + 0.6, 1.0, d + 0.6, 0.3), mat({ color: 0x2a3440, roughness: 0.5, metalness: 0.4 }), x, h + 0.5, z); if (i % 2) B.add(new THREE.CylinderGeometry(1.2, 1.2, 3, 16), mat({ color: 0x9aa4ae, metalness: 0.6, roughness: 0.3 }), x, h + 2.5, z);
    // shop front: coloured awning + neon sign + glass door
    const aw = mesh(new THREE.BoxGeometry(0.2, 0.9, w - 2), STRIPES(['#e8282a', '#fff0c8', '#1a8ad8', '#fff0c8', '#2ab86a', '#ffd84a'].slice((i % 3) * 2, (i % 3) * 2 + 2), 10, [1, 1]), x - sd * (w / 2 + 0.9), 4.2, z); aw.rotation.z = sd * 0.5; scene.add(aw);
    const sign = mesh(new THREE.PlaneGeometry(5, 1.5), neon(['CAFE', 'PIZZA', 'SHOP', 'BOOKS', 'GYM', 'MUSIC', 'TECH', 'BAKERY'][(i * 2 + (sd > 0)) % 8], ['#ff4ad8', '#4af0ff', '#ffd84a', '#7aff6a'][i % 4]), x - sd * (w / 2 + 0.06), 6.6, z); sign.rotation.y = -sd * Math.PI / 2; scene.add(sign); }
  // street furniture: lamps, traffic lights, planters with trees
  const metal = mat({ color: 0x3a3e44, metalness: 0.7, roughness: 0.35 }); const T = [];
  for (let k = 0; k < Math.floor(L / 12); k++) for (const sd of [-1, 1]) { const z = z0 - 4 - k * 12; B.add(new THREE.CylinderGeometry(0.1, 0.14, 6, 10), metal, sd * 7.6, 3, z); B.add(new THREE.BoxGeometry(1.6, 0.12, 0.3), metal, sd * 6.9, 6, z); const bulb = mesh(new THREE.BoxGeometry(0.7, 0.1, 0.3), new THREE.MeshBasicMaterial({ color: 0xfff2d0, toneMapped: false }), sd * 6.5, 5.92, z, false); scene.add(bulb);
    B.add(rbox(1.6, 0.8, 1.6, 0.2), mat({ color: 0xd8d0c4, roughness: 0.6 }), sd * 9.5, 0.65, z - 6); T.push([sd * 9.5, z - 6, 0.9, k % 2, k + (sd > 0 ? 30 : 0), 1.0]); }
  forest(T, ['round', 'blossom']);
  for (const sd of [-1, 1]) { const z = z0 - 27; B.add(new THREE.CylinderGeometry(0.12, 0.12, 5, 10), metal, sd * 7.4, 2.5, z); B.add(rbox(0.5, 1.5, 0.5, 0.1), metal, sd * 7.4, 5.2, z); [0xff2a2a, 0xffc020, 0x2aff6a].forEach((c, i) => { const l = mesh(new THREE.SphereGeometry(0.15, 12, 8), new THREE.MeshBasicMaterial({ color: c, toneMapped: false, transparent: true, opacity: i === 2 ? 1 : 0.25 }), sd * 7.4 + 0.27 * -sd, 5.65 - i * 0.45, z, false); scene.add(l); }); }
  B.flush();
  // traffic
  const cols = ['#e8282a', '#1a6ad8', '#f2c63a', '#9aa8bc', '#2ab86a', '#ff7a2a', '#8a3ab0', '#18b8c8'], cars = [];
  for (let i = 0; i < (o.cars ?? 10); i++) { const c = modernCar(cols[i % cols.length]); const lane = i % 2 ? 1 : -1; c.userData = { lane, z0: z0 - 10 - (i * 23) % L, v: 8 + (i % 4) * 2 }; c.rotation.y = lane > 0 ? Math.PI / 2 : -Math.PI / 2; cars.push(c); }
  return { towers, cars, update: (t) => { const S = o.stop, q = { '-1': [], '1': [] };
    for (const c of cars) { const u = c.userData; let z = u.z0 + u.lane * u.v * t; z = z0 - (((z0 - z) % L) + L) % L; c.position.set(u.lane * 3.4, 0, z); c.rotation.y = u.lane > 0 ? -Math.PI / 2 : Math.PI / 2;
      if (S && t > S.t0 && t < S.t1) { const d = (z - S.z) * u.lane + 4; if (d >= 0 && d <= u.v * (t - S.t0)) q[u.lane].push([d, c]); } }
    // red light: cars that reached the stop line during the window queue up behind it (first to arrive in front)
    for (const ln of [-1, 1]) q[ln].sort((a, b) => b[0] - a[0]).forEach(([, c], k) => { c.position.z = S.z - ln * (4 + k * 5.6); }); } };
}
