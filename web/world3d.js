// world3d.js : "game-engine" set dressing for the PBR scenes — everything procedural, no downloads.
//   Textures with matching normal maps (roof tiles, clapboard siding, brick, plaster, cobbles, wallpaper, wood panels),
//   a Batch that merges static meshes per material (few draw calls), detailed houses / trees / grass / flowers / fences / props,
//   and a rolling terrain that stays flat where the story happens.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { scene, V, rng } from './realkit.js';

// ---------------- noise ----------------
const hash2 = (x, y, s = 0) => { const h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return h - Math.floor(h); };
export function vnoise(x, y, s = 0) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
export const fbm = (x, y, s = 0, o = 4) => { let a = 0, f = 1, w = 0.5, n = 0; for (let i = 0; i < o; i++) { a += w * vnoise(x * f, y * f, s + i * 13); n += w; f *= 2; w *= 0.5; } return a / n; };

// ---------------- texture factory: one draw function paints both the colour and a height map (-> normal map) ----------------
const cache = {};
export function ptex(key, W, H, draw, o = {}) {
  if (cache[key]) return cache[key];
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const col = mk(), hgt = mk(); draw(col.getContext('2d'), W, H, false); draw(hgt.getContext('2d'), W, H, true);
  const hd = hgt.getContext('2d').getImageData(0, 0, W, H).data, nc = mk(), nx = nc.getContext('2d'), img = nx.createImageData(W, H), s = o.bump ?? 2.5;
  const hAt = (x, y) => hd[(((y + H) % H) * W + ((x + W) % W)) * 4] / 255;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = (hAt(x + 1, y) - hAt(x - 1, y)) * s, dy = (hAt(x, y + 1) - hAt(x, y - 1)) * s; const l = Math.hypot(dx, dy, 1), i = (y * W + x) * 4;
    img.data[i] = (-dx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255; }
  nx.putImageData(img, 0, 0);
  const map = new THREE.CanvasTexture(col), nrm = new THREE.CanvasTexture(nc); map.colorSpace = THREE.SRGBColorSpace; for (const t of [map, nrm]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; }
  return (cache[key] = { map, nrm });
}
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };
// clay roof tiles (rows of rounded tiles, staggered), white-ish so the material colour tints them
export const TEX = {
  tiles: () => ptex('tiles', 256, 256, (g, W, H, h) => { g.fillStyle = h ? '#000' : '#e8e0dc'; g.fillRect(0, 0, W, H); const rh = 32, tw = 32;
    for (let r = 0; r < H / rh + 1; r++) for (let c = -1; c < W / tw + 1; c++) { const x = c * tw + (r % 2) * tw / 2, y = r * rh; const gr = g.createLinearGradient(0, y, 0, y + rh);
      if (h) { gr.addColorStop(0, '#202020'); gr.addColorStop(0.85, '#ffffff'); gr.addColorStop(1, '#000'); } else { const k = 0.86 + hash2(r, c) * 0.2; gr.addColorStop(0, shade('#f4ece8', 0.72 * k)); gr.addColorStop(0.8, shade('#ffffff', k)); gr.addColorStop(1, shade('#e0d8d4', 0.55)); }
      g.fillStyle = gr; g.beginPath(); g.moveTo(x + 1, y); g.lineTo(x + tw - 1, y); g.lineTo(x + tw - 1, y + rh - 8); g.quadraticCurveTo(x + tw / 2, y + rh + 4, x + 1, y + rh - 8); g.closePath(); g.fill(); } }, { bump: 3 }),
  siding: () => ptex('siding', 256, 256, (g, W, H, h) => { const bh = 32; for (let r = 0; r < H / bh; r++) { const y = r * bh; const gr = g.createLinearGradient(0, y, 0, y + bh); if (h) { gr.addColorStop(0, '#000'); gr.addColorStop(1, '#fff'); } else { gr.addColorStop(0, '#c8c4c0'); gr.addColorStop(0.15, '#ffffff'); gr.addColorStop(1, '#f2f0ee'); } g.fillStyle = gr; g.fillRect(0, y, W, bh);
      if (!h) { g.fillStyle = 'rgba(0,0,0,0.05)'; for (let i = 0; i < 18; i++) g.fillRect(hash2(r, i) * W, y + 4 + hash2(i, r) * (bh - 8), 30 + hash2(i, r, 3) * 60, 1); } } }, { bump: 2 }),
  brick: () => ptex('brick', 256, 256, (g, W, H, h) => { g.fillStyle = h ? '#202020' : '#d8d0c8'; g.fillRect(0, 0, W, H); const bh = 21.3, bw = 64;
    for (let r = 0; r < 12; r++) for (let c = -1; c < 5; c++) { const x = c * bw + (r % 2) * bw / 2, y = r * bh; if (h) g.fillStyle = '#e8e8e8'; else { const k = 0.82 + hash2(r, c, 5) * 0.3; g.fillStyle = shade('#ffffff', k); }
      g.beginPath(); g.roundRect(x + 2, y + 2, bw - 4, bh - 4, 3); g.fill(); if (!h) { g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(x + 2, y + bh - 6, bw - 4, 3); } } }, { bump: 2.5 }),
  plaster: () => ptex('plaster', 256, 256, (g, W, H, h) => { const im = g.createImageData(W, H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const n = fbm(x / 22, y / 22, 3, 4), v = h ? n * 255 : 225 + n * 30, i = (y * W + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); }, { bump: 1.5 }),
  cobble: () => ptex('cobble', 256, 256, (g, W, H, h) => { g.fillStyle = h ? '#000' : '#8a8078'; g.fillRect(0, 0, W, H); const r = rng(9); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const cx = x * 32 + 16 + (y % 2) * 16 + (r() - 0.5) * 6, cy = y * 32 + 16 + (r() - 0.5) * 6;
      const gr = g.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, 15); if (h) { gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#333'); } else { const k = 0.8 + r() * 0.35; gr.addColorStop(0, shade('#e8e0d8', k)); gr.addColorStop(1, shade('#a89c90', k)); } g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, 14, 13, r(), 0, 7); g.fill(); } }, { bump: 3 }),
  planks: () => ptex('planks', 256, 256, (g, W, H, h) => { const pw = 42.6; for (let i = 0; i < 6; i++) { const x = i * pw; if (h) { g.fillStyle = '#fff'; g.fillRect(x + 1, 0, pw - 2, H); g.fillStyle = '#000'; g.fillRect(x, 0, 1.5, H); continue; }
      const k = 0.85 + hash2(i, 2) * 0.25; g.fillStyle = shade('#ffffff', k); g.fillRect(x, 0, pw, H); g.strokeStyle = 'rgba(80,40,10,0.12)'; g.lineWidth = 1; for (let j = 0; j < 7; j++) { g.beginPath(); const xx = x + 4 + j * 5.5; g.moveTo(xx, 0); for (let y = 0; y <= H; y += 16) g.lineTo(xx + Math.sin(y / 30 + j + i) * 2, y); g.stroke(); } g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, 0, 1.5, H); } }, { bump: 2 }),
  wallpaper: () => ptex('wallpaper', 256, 256, (g, W, H, h) => { if (h) { g.fillStyle = '#808080'; g.fillRect(0, 0, W, H); return; } g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(0,0,0,0.08)'; for (let x = 0; x < W; x += 32) g.fillRect(x, 0, 12, H);
      g.fillStyle = 'rgba(255,255,255,0.0)'; g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 2; for (let y = 16; y < H; y += 64) for (let x = 22; x < W; x += 64) { g.beginPath(); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; g.ellipse(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 5, 3, a, 0, 7); } g.stroke(); } }, { bump: 0.5 }),
  panel: () => ptex('panel', 256, 256, (g, W, H, h) => { g.fillStyle = h ? '#888' : '#f4f0ec'; g.fillRect(0, 0, W, H); for (let i = 0; i < 2; i++) { const x = 18 + i * 128, y = 22; if (h) { g.fillStyle = '#fff'; g.fillRect(x, y, 92, 212); g.fillStyle = '#555'; g.fillRect(x + 8, y + 8, 76, 196); } else { g.fillStyle = 'rgba(0,0,0,0.14)'; g.fillRect(x, y, 92, 3); g.fillRect(x, y, 3, 212); g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(x, y + 209, 92, 3); g.fillRect(x + 89, y, 3, 212); } } }, { bump: 2 }),
  leaves: () => ptex('leaves', 256, 256, (g, W, H, h) => { g.fillStyle = h ? '#404040' : '#bcd8a8'; g.fillRect(0, 0, W, H); const r = rng(4); for (let i = 0; i < 700; i++) { const x = r() * W, y = r() * H, k = 0.7 + r() * 0.5; g.fillStyle = h ? `rgba(255,255,255,${0.3 + r() * 0.5})` : shade('#e8ffe0', k); g.beginPath(); g.ellipse(x, y, 7, 4, r() * 6, 0, 7); g.fill(); } }, { bump: 2 }),
  fabric: (a = '#e8302a', b = '#ffffff') => ptex('fabric' + a + b, 128, 128, (g, W, H, h) => { for (let i = 0; i < 4; i++) { g.fillStyle = h ? (i % 2 ? '#fff' : '#ccc') : (i % 2 ? b : a); g.fillRect(i * 32, 0, 32, H); } if (!h) { g.fillStyle = 'rgba(0,0,0,0.06)'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1); } }, { bump: 0.6 }),
};
// real photo textures (three.js example set, MIT): brick wall, hardwood floor, lush grass — geometry UVs are in metres (boxUV)
const PH = {}; const TLP = new THREE.TextureLoader();
export function photoMat(kind, o = {}) { const key = kind + JSON.stringify(o); if (PH[key]) return PH[key]; const ld = (f, srgb) => { const t = TLP.load('../../assets/photo/' + f); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(o.rep ?? 1, o.rep ?? 1); return t; };
  const m = kind === 'brick' ? new THREE.MeshStandardMaterial({ map: ld('brick_diffuse.jpg', true), bumpMap: ld('brick_bump.jpg'), bumpScale: 2.2, roughnessMap: ld('brick_roughness.jpg'), color: o.tint ?? 0xffffff, roughness: 1 })
    : kind === 'wood' ? new THREE.MeshStandardMaterial({ map: ld('hardwood2_diffuse.jpg', true), bumpMap: ld('hardwood2_bump.jpg'), bumpScale: 0.6, roughnessMap: ld('hardwood2_roughness.jpg'), color: o.tint ?? 0xffffff, roughness: 1 })
    : new THREE.MeshStandardMaterial({ map: ld('grasslight-big.jpg', true), color: o.tint ?? 0xffffff, roughness: 0.95 });
  return (PH[key] = m); }
// material with textures + per-instance tint; uv scale handled by geometry (boxUV)
const MATC = {};
export function texMat(kind, color, o = {}) { const k = kind + color + JSON.stringify(o); if (MATC[k]) return MATC[k]; const t = TEX[kind](); return (MATC[k] = new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.nrm, normalScale: new THREE.Vector2(o.ns ?? 1, o.ns ?? 1), color, roughness: o.r ?? 0.8, metalness: o.m ?? 0, side: o.side ?? THREE.FrontSide })); }
export const plain = (color, o = {}) => { const k = 'p' + color + JSON.stringify(o); return MATC[k] || (MATC[k] = new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.6, metalness: o.m ?? 0, emissive: o.e ?? 0, emissiveIntensity: o.ei ?? 1, transparent: !!o.op, opacity: o.op ?? 1, side: o.side ?? THREE.FrontSide, vertexColors: !!o.vc })); };
export const GLASS = new THREE.MeshPhysicalMaterial({ color: 0x8ab8d8, metalness: 0.2, roughness: 0.04, clearcoat: 1, envMapIntensity: 1.6 });
// box with UVs in metres (tile = metres per texture repeat)
export function boxUV(w, h, d, tile = 2) { const g = new THREE.BoxGeometry(w, h, d); const uv = g.attributes.uv; const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const j = f * 4 + i; uv.setXY(j, uv.getX(j) * dims[f][0] / tile, uv.getY(j) * dims[f][1] / tile); } return g; }

// ---------------- Batch: merge static geometry per material ----------------
export class Batch {
  constructor() { this.m = new Map(); }
  add(geo, mat, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1, parent = null) {
    const M = new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), V(sx, sy, sz)); if (parent) M.premultiply(parent);
    let g = geo.index ? geo.toNonIndexed() : geo.clone(); for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); g.clearGroups(); g.applyMatrix4(M);
    if (!this.m.has(mat)) this.m.set(mat, []); this.m.get(mat).push(g); return this; }
  flush(parent = scene, cast = true) { const out = []; for (const [mat, list] of this.m) { for (let i = 0; i < list.length; i += 400) { const mg = mergeGeometries(list.slice(i, i + 400), false); if (!mg) continue; const m = new THREE.Mesh(mg, mat); m.castShadow = cast && !mat.transparent; m.receiveShadow = true; parent.add(m); out.push(m); } } this.m.clear(); return out; }
}
const M4 = (x, y, z, ry = 0) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), ry), V(1, 1, 1));

// ---------------- houses ----------------
// front faces +z (local). o: { w, d, h, wall, roof, kind:'siding'|'brick'|'plaster', shutter, door, floors, chimney, flowers, seed }
export function house(B, x, z, ry, o = {}) {
  const { w = 8, d = 6.5, h = 3.6, wall = '#f4e2c0', roof = '#c8442a', kind = 'siding', shutter = '#2a6ab8', door = '#c8342a', chimney = true, flowers = true, seed = 1, trim = '#ffffff' } = o; const P = M4(x, 0, z, ry), r = rng(seed * 7 + 3);
  const wm = kind === 'brick' ? photoMat('brick', { rep: 0.5 }) : texMat(kind, wall, { ns: 0.8 }), rm = texMat('tiles', roof, { r: 0.7, ns: 1.4 }), tm = plain(trim, { r: 0.5 }), sm = plain(shutter, { r: 0.55 });
  B.add(boxUV(w, h, d, kind === 'brick' ? 1.6 : 2.2), wm, 0, h / 2, 0, 0, 0, 0, 1, 1, 1, P);
  B.add(boxUV(w + 0.2, 0.35, d + 0.2, 1.2), texMat('brick', '#a89888'), 0, 0.17, 0, 0, 0, 0, 1, 1, 1, P);   // stone base
  for (const [yy, hh] of [[h - 0.08, 0.16]]) B.add(new THREE.BoxGeometry(w + 0.12, hh, d + 0.12), tm, 0, yy, 0, 0, 0, 0, 1, 1, 1, P);   // trim band
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.add(new THREE.BoxGeometry(0.16, h, 0.16), tm, sx * (w / 2 + 0.02), h / 2, sz * (d / 2 + 0.02), 0, 0, 0, 1, 1, 1, P);   // corner boards
  // gable roof: two tiled slabs + wall-coloured gables
  const rh = w * (o.steep ?? (0.42 + (seed % 3) * 0.07)), ang = Math.atan2(rh, w / 2), sl = Math.hypot(w / 2, rh) + 0.55, rd = d + 0.9;
  for (const s of [-1, 1]) { const g = boxUV(sl, 0.16, rd, 1.6); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i)); B.add(g, rm, s * (w / 4 - 0.2 * Math.cos(ang) * 0 + Math.cos(ang) * 0.12), h + rh / 2 - 0.05, 0, 0, 0, -s * ang, 1, 1, 1, P); }
  B.add(new THREE.BoxGeometry(0.25, 0.22, rd + 0.04), plain(shade(roof, 0.7), { r: 0.7 }), 0, h + rh + 0.04, 0, 0, 0, 0, 1, 1, 1, P);
  for (const s of [-1, 1]) { B.add(new THREE.BoxGeometry(0.1, 0.26, rd + 0.02), tm, s * (w / 2 + 0.42), h - 0.18, 0, 0, 0, 0, 1, 1, 1, P); for (const sz of [-1, 1]) B.add(new THREE.BoxGeometry(sl, 0.2, 0.08), tm, s * (w / 4 + 0.1), h + rh / 2 - 0.12, sz * (rd / 2 + 0.02), 0, 0, -s * ang, 1, 1, 1, P); }
  if (o.dormer ?? seed % 2 === 0) { const dz = d * 0.12, dh = rh * 0.42, dy = h + rh * 0.38; B.add(boxUV(1.5, dh, 1.6, 2), wm, 0, dy, dz + 1.1, 0, 0, 0, 1, 1, 1, P); { const sh2 = new THREE.Shape(); sh2.moveTo(-0.95, 0); sh2.lineTo(0.95, 0); sh2.lineTo(0, 0.7); sh2.closePath(); const dg = new THREE.ExtrudeGeometry(sh2, { depth: 1.8, bevelEnabled: false }); dg.translate(0, 0, -0.9); B.add(dg, rm, 0, dy + dh / 2, dz + 1.1, 0, 0, 0, 1, 1, 1, P); }
    B.add(new THREE.BoxGeometry(0.75, 0.8, 0.06), GLASS, 0, dy, dz + 1.92, 0, 0, 0, 1, 1, 1, P); B.add(new THREE.BoxGeometry(0.95, 0.1, 0.12), tm, 0, dy + 0.45, dz + 1.93, 0, 0, 0, 1, 1, 1, P); B.add(new THREE.BoxGeometry(0.95, 0.1, 0.12), tm, 0, dy - 0.45, dz + 1.93, 0, 0, 0, 1, 1, 1, P); for (const sx of [-1, 1]) B.add(new THREE.BoxGeometry(0.1, 0.95, 0.12), tm, sx * 0.42, dy, dz + 1.93, 0, 0, 0, 1, 1, 1, P); }
  { const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, rh); sh.closePath(); const gg = new THREE.ShapeGeometry(sh); const uv = gg.attributes.uv, p = gg.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 2.2, p.getY(i) / 2.2);
    for (const s of [-1, 1]) B.add(gg, wm, 0, h, s * d / 2 + s * 0.01, s > 0 ? 0 : Math.PI, 0, 0, 1, 1, 1, P);
    const rw = new THREE.CircleGeometry(0.42, 20); B.add(rw, GLASS, 0, h + rh * 0.42, d / 2 + 0.03, 0, 0, 0, 1, 1, 1, P); B.add(new THREE.TorusGeometry(0.44, 0.06, 6, 20), tm, 0, h + rh * 0.42, d / 2 + 0.04, 0, 0, 0, 1, 1, 1, P); }
  if (chimney) { const cx = (r() - 0.5) * w * 0.5; B.add(boxUV(0.7, 2.2, 0.7, 1.4), texMat('brick', '#c8705a'), cx, h + rh * 0.55 + 0.6, -d * 0.18, 0, 0, 0, 1, 1, 1, P); B.add(new THREE.BoxGeometry(0.85, 0.14, 0.85), plain('#5a4a44'), cx, h + rh * 0.55 + 1.72, -d * 0.18, 0, 0, 0, 1, 1, 1, P); }
  // windows (front + sides) with frames, mullions, shutters, flower boxes
  const win = (lx, ly, face) => { const fz = face === 'f' ? d / 2 : null; const rot = face === 'f' ? 0 : face === 'l' ? -Math.PI / 2 : Math.PI / 2; const ox = face === 'f' ? lx : face === 'l' ? -w / 2 : w / 2, oz = face === 'f' ? d / 2 : lx;
    const Q = new THREE.Matrix4().multiplyMatrices(P, M4(ox, ly, oz, rot)); const ww = 1.05, wh = 1.3;
    B.add(new THREE.BoxGeometry(ww, wh, 0.06), GLASS, 0, 0, 0.02, 0, 0, 0, 1, 1, 1, Q); B.add(new THREE.BoxGeometry(ww + 0.22, 0.12, 0.14), tm, 0, wh / 2 + 0.05, 0.05, 0, 0, 0, 1, 1, 1, Q); B.add(new THREE.BoxGeometry(ww + 0.3, 0.1, 0.24), tm, 0, -wh / 2 - 0.05, 0.1, 0, 0, 0, 1, 1, 1, Q);
    for (const s of [-1, 1]) B.add(new THREE.BoxGeometry(0.1, wh, 0.12), tm, s * ww / 2, 0, 0.05, 0, 0, 0, 1, 1, 1, Q); B.add(new THREE.BoxGeometry(0.05, wh, 0.1), tm, 0, 0, 0.06, 0, 0, 0, 1, 1, 1, Q); B.add(new THREE.BoxGeometry(ww, 0.05, 0.1), tm, 0, 0.1, 0.06, 0, 0, 0, 1, 1, 1, Q);
    for (const s of [-1, 1]) { B.add(new THREE.BoxGeometry(0.5, wh + 0.05, 0.06), sm, s * (ww / 2 + 0.33), 0, 0.04, 0, 0, 0, 1, 1, 1, Q); for (let k = 0; k < 5; k++) B.add(new THREE.BoxGeometry(0.42, 0.03, 0.03), plain(shade(shutter, 0.75)), s * (ww / 2 + 0.33), -wh / 2 + 0.2 + k * 0.24, 0.08, 0, 0, 0, 1, 1, 1, Q); }
    if (flowers) { B.add(new THREE.BoxGeometry(ww + 0.1, 0.22, 0.26), plain('#8a5a32', { r: 0.8 }), 0, -wh / 2 - 0.2, 0.2, 0, 0, 0, 1, 1, 1, Q); for (let k = 0; k < 7; k++) { const fc = ['#e83a5a', '#f2c63a', '#ffffff', '#e86ad8', '#ff8a2a'][Math.floor(r() * 5)]; B.add(new THREE.IcosahedronGeometry(0.09, 0), plain(fc, { r: 0.6 }), -ww / 2 + 0.1 + k * (ww - 0.2) / 6, -wh / 2 - 0.04 + r() * 0.06, 0.2 + (r() - 0.5) * 0.1, 0, 0, 0, 1, 1, 1, Q); }
      for (let k = 0; k < 5; k++) B.add(new THREE.IcosahedronGeometry(0.12, 0), plain('#3f9a3a', { r: 0.8 }), -ww / 2 + 0.15 + k * (ww - 0.3) / 4, -wh / 2 - 0.1, 0.24, 0, 0, 0, 1, 1, 1, Q); } };
  for (const s of [-1, 1]) win(s * Math.max(1.85, w * 0.3), h * 0.58, 'f'); if (w >= 12) for (const s of [-1, 1]) win(s * w * 0.44, h * 0.58, 'f');
  win(0, h * 0.58, 'l'); win(0, h * 0.58, 'r');
  // door with frame, step and little porch roof + lamp
  const Dq = new THREE.Matrix4().multiplyMatrices(P, M4(0, 0, d / 2, 0)); B.add(texMat('panel', door, { r: 0.5 }) && boxUV(1.1, 2.2, 0.08, 1.1), texMat('panel', door, { r: 0.5 }), 0, 1.1, 0.03, 0, 0, 0, 1, 1, 1, Dq);
  B.add(new THREE.BoxGeometry(1.4, 0.14, 0.14), tm, 0, 2.27, 0.06, 0, 0, 0, 1, 1, 1, Dq); for (const s of [-1, 1]) B.add(new THREE.BoxGeometry(0.12, 2.3, 0.14), tm, s * 0.62, 1.15, 0.06, 0, 0, 0, 1, 1, 1, Dq);
  B.add(new THREE.SphereGeometry(0.05, 8, 6), plain('#e8c040', { m: 0.9, r: 0.25 }), 0.4, 1.1, 0.1, 0, 0, 0, 1, 1, 1, Dq); B.add(boxUV(1.7, 0.2, 0.8, 1), texMat('brick', '#b0a8a0'), 0, 0.1, 0.45, 0, 0, 0, 1, 1, 1, Dq);
  if (o.porch ?? seed % 3 === 1) { B.add(boxUV(3.4, 0.14, 1.9, 1), rm, 0, 2.75, 0.95, 0, -0.18, 0, 1, 1, 1, Dq); B.add(new THREE.BoxGeometry(3.5, 0.14, 0.1), tm, 0, 2.62, 1.9, 0, 0, 0, 1, 1, 1, Dq); for (const s of [-1, 1]) { B.add(new THREE.CylinderGeometry(0.1, 0.12, 2.6, 12), tm, s * 1.55, 1.3, 1.75, 0, 0, 0, 1, 1, 1, Dq); B.add(new THREE.BoxGeometry(0.3, 0.12, 0.3), tm, s * 1.55, 0.06, 1.75, 0, 0, 0, 1, 1, 1, Dq); }
    B.add(boxUV(3.6, 0.22, 2.0, 1), texMat('planks', '#b88a5a'), 0, 0.11, 0.95, 0, 0, 0, 1, 1, 1, Dq); for (let k = 0; k < 9; k++) B.add(new THREE.BoxGeometry(0.05, 0.7, 0.05), tm, -1.55 + k * 0.39 * (k < 4 ? 1 : 1), 0.55, 1.88, 0, 0, 0, 1, 1, 1, Dq); }
  else { B.add(new THREE.BoxGeometry(1.8, 0.08, 0.8), rm, 0, 2.62, 0.38, 0, -0.35, 0, 1, 1, 1, Dq); for (const s of [-1, 1]) B.add(new THREE.BoxGeometry(0.05, 0.4, 0.05), plain('#2a2a30'), s * 0.75, 2.4, 0.7, 0, 0, 0, 1, 1, 1, Dq); }
  return P;
}

// ---------------- trees (instanced templates with vertex colours) ----------------
function blob(radius, detail, seed, squash = 0.85) { let g = new THREE.IcosahedronGeometry(radius, detail); g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g); const p = g.attributes.position, v = V();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = v.clone().normalize(); const k = 1 + 0.2 * (fbm(n.x * 2 + seed, n.y * 2 + n.z * 1.3, seed, 3) - 0.5) * 2; v.multiplyScalar(k); v.y *= squash; p.setXYZ(i, v.x, v.y, v.z); } g.computeVertexNormals(); return g; }
function colorize(g, base, yMin, yMax, dark = 0.55, light = 1.15, jitter = 0.08, seed = 1) { const p = g.attributes.position, c = new Float32Array(p.count * 3), B = new THREE.Color(base), r = rng(seed);
  for (let i = 0; i < p.count; i++) { const t = Math.min(1, Math.max(0, (p.getY(i) - yMin) / (yMax - yMin))); const k = dark + (light - dark) * t * t * (3 - 2 * t) + (r() - 0.5) * jitter; c[i * 3] = B.r * k; c[i * 3 + 1] = B.g * k; c[i * 3 + 2] = B.b * k; } g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g; }
const stripTo = (g, keep = ['position', 'normal', 'color']) => { g = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(g.attributes)) if (!keep.includes(k)) g.deleteAttribute(k); return g; };
// leaf clusters: many small alpha-cut leaves on cards that sit on the canopy surface — reads as real foliage, not plastic blobs
let LEAFT = null; function leafTex() { if (LEAFT) return LEAFT; const c = document.createElement('canvas'); c.width = c.height = 256; const q = c.getContext('2d'); const r = rng(77);
  for (let i = 0; i < 95; i++) { const x = 20 + r() * 216, y = 20 + r() * 216; if (Math.hypot(x - 128, y - 128) > 118) continue; const a = r() * 6.28, L = 16 + r() * 12, k = 0.72 + r() * 0.4; q.save(); q.translate(x, y); q.rotate(a);
    const gr = q.createLinearGradient(0, -L / 3, 0, L / 3); gr.addColorStop(0, `rgb(${Math.round(250 * k)},${Math.round(255 * k)},${Math.round(235 * k)})`); gr.addColorStop(1, `rgb(${Math.round(185 * k)},${Math.round(205 * k)},${Math.round(170 * k)})`); q.fillStyle = gr;
    q.beginPath(); q.moveTo(-L, 0); q.quadraticCurveTo(0, -L * 0.46, L, 0); q.quadraticCurveTo(0, L * 0.46, -L, 0); q.fill(); q.strokeStyle = 'rgba(60,80,40,0.45)'; q.lineWidth = 1.2; q.beginPath(); q.moveTo(-L * 0.9, 0); q.lineTo(L * 0.9, 0); q.stroke(); q.restore(); }
  LEAFT = new THREE.CanvasTexture(c); LEAFT.colorSpace = THREE.SRGBColorSpace; LEAFT.anisotropy = 8; return LEAFT; }
function leafCards(cx, cy, cz, radius, n, col, seed, squash = 0.85) { const r = rng(seed * 17 + 3), parts = [], B = new THREE.Color(col);
  for (let i = 0; i < n; i++) { const u = r() * 2 - 1, a = r() * 6.28, s2 = Math.sqrt(1 - u * u); const nrm = V(s2 * Math.cos(a), u * 0.9 + 0.1, s2 * Math.sin(a)).normalize(); const pos = V(cx, cy, cz).add(nrm.clone().multiplyScalar(radius * (0.85 + r() * 0.2)).multiply(V(1, squash, 1)));
    const sz = radius * (0.9 + r() * 0.5); const pg = new THREE.PlaneGeometry(sz, sz); pg.lookAt(nrm); pg.rotateOnAxis ? 0 : 0; const rot = new THREE.Matrix4().makeRotationAxis(nrm, r() * 6.28); pg.applyMatrix4(rot); pg.translate(pos.x, pos.y, pos.z);
    const nn = pg.attributes.normal; for (let k = 0; k < nn.count; k++) nn.setXYZ(k, nrm.x, nrm.y, nrm.z); const cc = new Float32Array(nn.count * 3), sh = 0.62 + 0.5 * (u * 0.5 + 0.5) + (r() - 0.5) * 0.12; for (let k = 0; k < nn.count; k++) { cc[k * 3] = B.r * sh; cc[k * 3 + 1] = B.g * sh; cc[k * 3 + 2] = B.b * sh; }
    pg.setAttribute('color', new THREE.BufferAttribute(cc, 3)); parts.push(pg.index ? pg.toNonIndexed() : pg); }
  return parts; }
export function treeTemplate(kind, seed = 1) {
  const r = rng(seed * 11 + 5), parts = [], leaves = [];
  const trunkH = kind === 'pine' ? 1.6 : kind === 'bush' ? 0.2 : 2.4; const tr = new THREE.CylinderGeometry(0.14, 0.3, trunkH + 0.6, 10); tr.translate(0, (trunkH + 0.6) / 2 - 0.3, 0); parts.push(colorize(tr, '#7a5232', 0, trunkH, 0.6, 1.05, 0.05, seed));
  if (kind === 'round' || kind === 'blossom') { const n = 6 + Math.floor(r() * 3); const col = kind === 'blossom' ? '#f2a6cc' : ['#4aa83a', '#58b840', '#3f9a34', '#6ac048'][seed % 4];
    for (let i = 0; i < n; i++) { const a = r() * 6.28, d = i === 0 ? 0 : 0.7 + r() * 0.8, y = trunkH + 0.9 + (i === 0 ? 0.9 : r() * 1.6), rad = 0.9 + r() * 0.6; const b = blob(rad * 0.92, 3, seed * 3 + i); b.translate(Math.cos(a) * d, y, Math.sin(a) * d); parts.push(colorize(b, col, trunkH - 0.2, trunkH + 3.6, 0.42, 0.95, 0.06, seed + i));
      leaves.push(...leafCards(Math.cos(a) * d, y, Math.sin(a) * d, rad, 26, col, seed * 7 + i)); }
    for (const [a, l] of [[0.7, 1.1], [2.6, 0.9], [4.4, 1.0]]) { const br = new THREE.CylinderGeometry(0.05, 0.1, l, 6); br.translate(0, l / 2, 0); br.rotateZ(0.9); br.rotateY(a); br.translate(0, trunkH - 0.2, 0); parts.push(colorize(br, '#6a4428', 0, 4, 0.8, 0.9, 0, seed)); } }
  else if (kind === 'pine') { const col = ['#2f7a3a', '#2a6e34', '#3a8a42'][seed % 3]; for (let i = 0; i < 5; i++) { const c = new THREE.ConeGeometry(2.0 - i * 0.34, 1.6, 24, 3); const p = c.attributes.position; for (let j = 0; j < p.count; j++) { const x = p.getX(j), z = p.getZ(j), k = 1 + 0.12 * Math.sin(Math.atan2(z, x) * 9 + i); p.setX(j, x * k); p.setZ(j, z * k); } c.computeVertexNormals(); c.translate(0, trunkH + 0.4 + i * 0.95, 0); parts.push(colorize(c, col, trunkH, trunkH + 5.5, 0.5, 1.15, 0.08, seed + i));
      leaves.push(...leafCards(0, trunkH + 0.2 + i * 0.95, 0, (2.0 - i * 0.34) * 0.75, 14, col, seed * 5 + i, 0.4)); } }
  else if (kind === 'bush') { const col = ['#3f9a34', '#4aa83a', '#5ab048'][seed % 3]; for (let i = 0; i < 4; i++) { const a = i * 1.7, d = i ? 0.5 : 0, rad = 0.6 + r() * 0.3; const b = blob(rad * 0.92, 3, seed * 5 + i, 0.8); b.translate(Math.cos(a) * d, 0.5 + r() * 0.2, Math.sin(a) * d); parts.push(colorize(b, col, 0, 1.3, 0.45, 0.95, 0.08, seed + i)); leaves.push(...leafCards(Math.cos(a) * d, 0.5, Math.sin(a) * d, rad, 14, col, seed * 9 + i, 0.8)); }
    if (seed % 2) for (let i = 0; i < 9; i++) { const f = new THREE.IcosahedronGeometry(0.08, 1); const a = r() * 6.28, h2 = 0.5 + r() * 0.6; f.translate(Math.cos(a) * 0.8, h2, Math.sin(a) * 0.8); parts.push(colorize(f, ['#ff5a7a', '#ffffff', '#f2d23a'][seed % 3], 0, 1, 1, 1, 0, 1)); } }
  const solid = mergeGeometries(parts.map((g) => stripTo(g)), false); const lv = leaves.length ? mergeGeometries(leaves.map((g) => stripTo(g, ['position', 'normal', 'color', 'uv'])), false) : null; return { solid, leaves: lv };
}
const TREEMAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
let LEAFM = null, LEAFD = null;
export function forest(list, kinds = ['round', 'pine', 'round', 'bush']) {   // list: [[x, z, scale, kindIndex, seed, y]]
  if (!LEAFM) { LEAFM = new THREE.MeshStandardMaterial({ map: leafTex(), alphaTest: 0.5, vertexColors: true, side: THREE.DoubleSide, roughness: 0.75 }); LEAFD = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: leafTex(), alphaTest: 0.5 }); }
  const groups = {}; for (const it of list) { const k = kinds[it[3] % kinds.length] + '_' + (it[4] % 3); (groups[k] = groups[k] || []).push(it); }
  const out = []; for (const [k, its] of Object.entries(groups)) { const [kind, sd] = k.split('_'); const T = treeTemplate(kind, +sd + 1); const ims = [new THREE.InstancedMesh(T.solid, TREEMAT, its.length)]; if (T.leaves) { const lm = new THREE.InstancedMesh(T.leaves, LEAFM, its.length); lm.customDepthMaterial = LEAFD; ims.push(lm); }
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
    its.forEach((it, i) => { const r = rng(it[4] * 13 + 1); q.setFromAxisAngle(V(0, 1, 0), r() * 6.28); m4.compose(V(it[0], it[5] || 0, it[1]), q, V(it[2], it[2] * (0.9 + r() * 0.25), it[2])); c.setRGB(1, 1, 1).multiplyScalar(0.85 + r() * 0.3); for (const im of ims) { im.setMatrixAt(i, m4); im.setColorAt(i, c); } });
    for (const im of ims) { im.castShadow = true; im.receiveShadow = true; scene.add(im); out.push(im); } }
  return out;
}

// ---------------- grass tufts + flowers (instanced, up-facing normals so they light like the ground) ----------------
let GRASSG = null, GRASSM = null;
function grassGeo() { if (GRASSG) return GRASSG; const t = document.createElement('canvas'); t.width = 128; t.height = 128; const q = t.getContext('2d'); const r = rng(3);
  for (let i = 0; i < 26; i++) { const x = 10 + r() * 108, h = 50 + r() * 70, bend = (r() - 0.5) * 30; const gr = q.createLinearGradient(0, 128, 0, 128 - h); gr.addColorStop(0, '#4a8e30'); gr.addColorStop(1, ['#9ae070', '#7ad058', '#b4ea80'][i % 3]); q.fillStyle = gr; q.beginPath(); q.moveTo(x - 4, 128); q.quadraticCurveTo(x + bend * 0.4, 128 - h * 0.6, x + bend, 128 - h); q.quadraticCurveTo(x + bend * 0.4 + 2, 128 - h * 0.6, x + 4, 128); q.closePath(); q.fill(); }
  const tx = new THREE.CanvasTexture(t); tx.colorSpace = THREE.SRGBColorSpace; GRASSM = new THREE.MeshStandardMaterial({ map: tx, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.9 });
  const parts = []; for (let k = 0; k < 3; k++) { const p = new THREE.PlaneGeometry(0.7, 0.45); p.translate(0, 0.22, 0); p.rotateY(k * Math.PI / 3); parts.push(p); } GRASSG = mergeGeometries(parts); const n = GRASSG.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0); return GRASSG; }
export function grass(points, scale = 1) { const g = grassGeo(); const im = new THREE.InstancedMesh(g, GRASSM, points.length); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
  points.forEach(([x, z, y = 0, s = 1], i) => { const r = hash2(x, z); q.setFromAxisAngle(V(0, 1, 0), r * 6.28); m4.compose(V(x, y, z), q, V(s * scale * (0.8 + r * 0.5), s * scale * (0.7 + hash2(z, x) * 0.7), s * scale * (0.8 + r * 0.5))); im.setMatrixAt(i, m4); c.setRGB(0.85 + r * 0.3, 0.9 + hash2(z, x, 2) * 0.2, 0.75 + r * 0.2); im.setColorAt(i, c); });
  im.receiveShadow = true; scene.add(im); return im; }
export function flowers(points) { const head = new THREE.IcosahedronGeometry(0.07, 0); const stem = new THREE.CylinderGeometry(0.008, 0.008, 0.28, 3); stem.translate(0, 0.14, 0); head.translate(0, 0.3, 0);
  const geo = mergeGeometries([stripTo(head, ['position', 'normal']), stripTo(stem, ['position', 'normal'])]); const cols = [0xff4a6a, 0xffffff, 0xffd23a, 0xc86af0, 0xff8a2a, 0x5aa8ff]; const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.6 }), points.length); const m4 = new THREE.Matrix4(), c = new THREE.Color();
  points.forEach(([x, z, y = 0], i) => { const r = hash2(x * 3, z * 3); m4.compose(V(x, y, z), new THREE.Quaternion(), V(1, 0.7 + r * 0.6, 1)); im.setMatrixAt(i, m4); c.setHex(cols[Math.floor(r * cols.length)]); im.setColorAt(i, c); }); scene.add(im); return im; }
export function scatter(n, fn, seed = 1) { const r = rng(seed), out = []; let tries = 0; while (out.length < n && tries++ < n * 20) { const p = fn(r); if (p) out.push(p); } return out; }

// ---------------- small props into a batch ----------------
export function fence(B, ax, az, bx, bz, col = '#ffffff', h = 0.9) { const L = Math.hypot(bx - ax, bz - az), ry = Math.atan2(-(bz - az), bx - ax), n = Math.max(2, Math.round(L / 0.32)); const m = plain(col, { r: 0.6 }), P = M4(ax, 0, az, ry);
  for (let i = 0; i <= n; i++) { const g = new THREE.BoxGeometry(0.1, h, 0.04); B.add(g, m, (i / n) * L, h / 2, 0, 0, 0, 0, 1, 1, 1, P); B.add(new THREE.ConeGeometry(0.07, 0.12, 4), m, (i / n) * L, h + 0.06, 0, Math.PI / 4, 0, 0, 1, 1, 1, P); }
  for (const y of [h * 0.3, h * 0.72]) B.add(new THREE.BoxGeometry(L, 0.07, 0.03), m, L / 2, y, -0.035, 0, 0, 0, 1, 1, 1, P); }
export function hedge(B, x, z, w, d, h = 1.0) { B.add(boxUV(w, h, d, 1.2), texMat('leaves', '#58a848', { r: 0.9, ns: 1.5 }), x, h / 2, z); B.add(boxUV(w + 0.06, 0.08, d + 0.06, 1.2), texMat('leaves', '#6ab858', { r: 0.9 }), x, h, z); }
export function bench(B, x, z, ry, col = '#9a5a2a') { const P = M4(x, 0, z, ry), w = texMat('planks', col, { r: 0.7 }), iron = plain('#2a2a30', { m: 0.6, r: 0.4 });
  for (let i = 0; i < 3; i++) B.add(boxUV(1.6, 0.05, 0.12, 1), w, 0, 0.46, -0.16 + i * 0.15, 0, 0, 0, 1, 1, 1, P); for (let i = 0; i < 2; i++) B.add(boxUV(1.6, 0.12, 0.04, 1), w, 0, 0.66 + i * 0.16, -0.3, 0, -0.15, 0, 1, 1, 1, P);
  for (const s of [-1, 1]) { B.add(new THREE.BoxGeometry(0.06, 0.46, 0.06), iron, s * 0.7, 0.23, 0.1, 0, 0, 0, 1, 1, 1, P); B.add(new THREE.BoxGeometry(0.06, 0.85, 0.06), iron, s * 0.7, 0.42, -0.28, 0, 0, 0, 1, 1, 1, P); } }
export function lampPost(B, x, z, h = 3.6) { const iron = plain('#2a3a3a', { m: 0.7, r: 0.35 }); B.add(new THREE.CylinderGeometry(0.06, 0.1, h, 8), iron, x, h / 2, z); B.add(new THREE.CylinderGeometry(0.16, 0.16, 0.3, 8), iron, x, 0.15, z); B.add(new THREE.CylinderGeometry(0.25, 0.12, 0.45, 6), plain('#fff4c8', { e: '#ffd890', ei: 0.4 }), x, h + 0.2, z); B.add(new THREE.ConeGeometry(0.32, 0.25, 6), iron, x, h + 0.55, z); }
export function pot(B, x, z, s = 1, col = '#c8603a') { B.add(new THREE.CylinderGeometry(0.28 * s, 0.2 * s, 0.4 * s, 12), plain(col, { r: 0.8 }), x, 0.2 * s, z); B.add(blob(0.34 * s, 1, x * 3 + z), plain('#4aa83a', { r: 0.85 }), x, 0.5 * s, z); }

// ---------------- terrain: rolling hills that stay flat where the story happens ----------------
export const terrainH = (x, z, k) => Math.max(-0.5, k * (fbm(x / 140, z / 140, 2, 4) * 34 - 6 + fbm(x / 40, z / 40, 7, 3) * 6)) * k;
export function terrain(size, seg, flat, mat) {   // flat(x, z) -> 0 (must stay flat) .. 1 (free to roll)
  const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2); const p = g.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const k = flat(x, z); p.setY(i, terrainH(x, z, k));
    const m = 0.82 + fbm(x / 26, z / 26, 5, 4) * 0.36, yy = fbm(x / 70, z / 70, 9, 3); c[i * 3] = m * (0.92 + yy * 0.18); c[i * 3 + 1] = m * (1.0 + yy * 0.04); c[i * 3 + 2] = m * (0.85 + (1 - yy) * 0.1); }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.computeVertexNormals(); mat.vertexColors = true; const m = new THREE.Mesh(g, mat); m.receiveShadow = true; scene.add(m); return m;
}

// ---------------- high-detail golf cart (forward = +x, driver seat on +z side) ----------------
export function golfCartHQ(o = {}) {
  const body = new THREE.MeshPhysicalMaterial({ color: o.body ?? 0xe0487e, roughness: 0.28, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.06 }), white = new THREE.MeshPhysicalMaterial({ color: o.roof ?? 0xf8f6f2, roughness: 0.35, clearcoat: 0.6 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xf2f2f6, metalness: 1, roughness: 0.14 }), rubber = new THREE.MeshStandardMaterial({ color: 0x1c1c20, roughness: 0.85 }), dark = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.5 });
  const seatM = texMat('panel', o.seat ?? '#f4e6cc', { r: 0.55, ns: 0.8 }), glass = new THREE.MeshPhysicalMaterial({ color: 0xcfe8ff, roughness: 0.02, metalness: 0.1, transparent: true, opacity: 0.28, side: THREE.DoubleSide });
  const g = new THREE.Group(); const W = 1.12;
  // body shell: side profile with wheel arches, open foot well, seat base and rear deck — extruded with rounded bevels
  const sh = new THREE.Shape(); sh.moveTo(-1.16, 0.36); sh.lineTo(-1.08, 0.36); sh.absarc(-0.78, 0.24, 0.31, Math.PI - 0.4, 0.4, true); sh.lineTo(0.47, 0.36); sh.absarc(0.78, 0.24, 0.31, Math.PI - 0.4, 0.4, true); sh.lineTo(1.12, 0.36);
  sh.quadraticCurveTo(1.3, 0.37, 1.28, 0.56); sh.quadraticCurveTo(1.24, 0.88, 0.96, 0.93); sh.lineTo(0.62, 0.96); sh.quadraticCurveTo(0.5, 0.96, 0.48, 0.82); sh.lineTo(0.42, 0.47); sh.lineTo(-0.28, 0.47); sh.lineTo(-0.32, 0.64); sh.lineTo(-0.84, 0.64); sh.lineTo(-0.88, 0.8); sh.lineTo(-1.1, 0.82); sh.quadraticCurveTo(-1.24, 0.8, -1.22, 0.58); sh.lineTo(-1.16, 0.36);
  const bg = new THREE.ExtrudeGeometry(sh, { depth: W - 0.12, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 5, curveSegments: 24 }); bg.translate(0, 0, -(W - 0.12) / 2); g.add(mesh(bg, body));
  // white hood stripe + chrome trim line + black rubber bumpers + skid plate
  g.add(mesh(new THREE.BoxGeometry(0.52, 0.012, 0.22), white, 0.82, 0.95, 0, true)); g.children.at(-1).rotation.z = -0.08;
  for (const s of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(2.3, 0.025, 0.02), chrome, 0.05, 0.52, s * (W / 2 + 0.005)));
  g.add(mesh(new THREE.CapsuleGeometry(0.06, W - 0.1, 4, 10), rubber, 1.3, 0.42, 0).rotateX(Math.PI / 2)); g.add(mesh(new THREE.CapsuleGeometry(0.06, W - 0.1, 4, 10), rubber, -1.24, 0.42, 0).rotateX(Math.PI / 2));
  // seat cushion + backrest (rounded), seat back panel
  const rr = (w, h, r) => { const s2 = new THREE.Shape(); s2.moveTo(-w / 2 + r, -h / 2); s2.lineTo(w / 2 - r, -h / 2); s2.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s2.lineTo(w / 2, h / 2 - r); s2.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s2.lineTo(-w / 2 + r, h / 2); s2.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s2.lineTo(-w / 2, -h / 2 + r); s2.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); return s2; };
  const cush = new THREE.ExtrudeGeometry(rr(0.56, 0.15, 0.06), { depth: W - 0.2, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 }); cush.translate(0, 0, -(W - 0.2) / 2); g.add(mesh(cush, seatM, -0.57, 0.72, 0));
  const back = new THREE.ExtrudeGeometry(rr(0.14, 0.52, 0.06), { depth: W - 0.2, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 }); back.translate(0, 0, -(W - 0.2) / 2); const bk = mesh(back, seatM, -0.88, 1.06, 0); bk.rotation.z = 0.16; g.add(bk);
  for (const z of [-0.02, 0.02]) g.add(mesh(new THREE.BoxGeometry(0.5, 0.006, 0.008), dark, -0.57, 0.815, z));
  // roof canopy on four struts, windshield, rear bag rack + golf bag
  const roof = new THREE.ExtrudeGeometry(rr(2.0, 1.28, 0.16), { depth: 0.05, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 3 }); roof.rotateX(-Math.PI / 2); g.add(mesh(roof, white, -0.12, 1.98, 0));
  const strut = (a, b) => { const len = a.distanceTo(b), m = mesh(new THREE.CylinderGeometry(0.028, 0.028, len, 10), chrome); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); g.add(m); };
  for (const s of [-1, 1]) { strut(V(0.56, 0.95, s * 0.5), V(0.74, 1.98, s * 0.55)); strut(V(-0.98, 0.8, s * 0.5), V(-0.95, 1.98, s * 0.55)); }
  { const ws = mesh(new THREE.PlaneGeometry(1.02, 1.0), glass, 0.65, 1.47, 0, false); ws.rotation.set(0, Math.PI / 2, 0); ws.rotateX(0.17); g.add(ws); }
  const bag = mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.95, 18), body, -1.12, 1.18, 0.15); bag.rotation.z = 0.22; g.add(bag); g.add(mesh(new THREE.TorusGeometry(0.17, 0.025, 8, 18), chrome, -1.22, 1.62, 0.15).rotateX(Math.PI / 2));
  for (let i = 0; i < 4; i++) { const h = mesh(new THREE.BoxGeometry(0.13, 0.07, 0.07), i % 2 ? chrome : dark, -1.24 + (i % 2) * 0.05, 1.72 + (i % 3) * 0.03, 0.08 + i * 0.05); h.rotation.z = 0.3; g.add(h); }
  // steering column + wheel, dash panel
  { const col = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), dark, 0.36, 0.98, 0.27); col.rotation.z = 0.75; g.add(col); const wh = mesh(new THREE.TorusGeometry(0.17, 0.028, 10, 28), rubber, 0.18, 1.12, 0.27); wh.rotation.set(0, Math.PI / 2, 0); wh.rotateX(-0.75); g.add(wh); for (let k = 0; k < 3; k++) { const sp = mesh(new THREE.BoxGeometry(0.02, 0.17, 0.02), chrome, 0.18, 1.12, 0.27); sp.rotation.set(0, Math.PI / 2, 0); sp.rotateX(-0.75); sp.rotateZ(k * 2.09); sp.translateY(0.08); g.add(sp); } }
  g.add(mesh(new THREE.BoxGeometry(0.06, 0.16, 0.8), dark, 0.48, 0.86, 0));
  // wheels: rounded tyres (lathe) + chrome rims with spokes
  const tp = []; for (let i = 0; i <= 16; i++) { const a = -Math.PI / 2 + Math.PI * i / 16; tp.push(new THREE.Vector2(0.17 + Math.cos(a) * 0.075, Math.sin(a) * 0.09)); } const tyreG = new THREE.LatheGeometry(tp, 32);
  g.userData.wheels = []; for (const [x, z] of [[0.78, 0.6], [0.78, -0.6], [-0.78, 0.6], [-0.78, -0.6]]) { const w = new THREE.Group(); w.position.set(x, 0.245, z); g.add(w); const t = mesh(tyreG, rubber); t.rotation.x = Math.PI / 2; w.add(t);
    const rim = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.13, 24), chrome); rim.rotation.x = Math.PI / 2; w.add(rim); for (let k = 0; k < 5; k++) { const sp = mesh(new THREE.BoxGeometry(0.03, 0.22, 0.03), dark, 0, 0, Math.sign(z) * 0.07); sp.rotation.z = k * 1.2566; w.add(sp); } w.add(mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.15, 12), chrome).rotateX(Math.PI / 2)); g.userData.wheels.push(w); }
  // lights
  g.userData.lights = []; for (const z of [-0.33, 0.33]) { const l = mesh(new THREE.SphereGeometry(0.075, 16, 10), new THREE.MeshStandardMaterial({ color: 0xfff6d0, emissive: 0xfff0b0, emissiveIntensity: 2 }), 1.26, 0.68, z, false); l.scale.x = 0.5; g.add(l); g.userData.lights.push(l); g.add(mesh(new THREE.TorusGeometry(0.075, 0.015, 6, 16), chrome, 1.26, 0.68, z).rotateY(Math.PI / 2)); }
  for (const z of [-0.4, 0.4]) g.add(mesh(new THREE.BoxGeometry(0.03, 0.08, 0.16), new THREE.MeshStandardMaterial({ color: 0xe8202a, emissive: 0x801010 }), -1.25, 0.62, z));
  g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return g;
}
function mesh(geo, mat, x = 0, y = 0, z = 0, cast = true) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; return m; }
