// city2.js (Studio v9.1): a REAL-looking modern street. Buildings are built from architecture, not textures:
// glass curtain-wall towers (mullions, floor bands, lobby, setback crown, roof plant), brick mid-rises (punched
// windows with frames, stone sills/lintels, balconies with railings, cornice, AC units), painted stucco blocks
// (shutters, balconies) and stone apartment blocks; ground floors are shops with big glass fronts, awnings and signs.
// Street: asphalt lanes, curbs, tiled sidewalks, leafy street trees, lamps, traffic lights, benches, bus stop, zebra,
// parked + moving real cars (cars.js).
//   import { realCity } from '../../web/city2.js';
//   const CITY = realCity({ z0: 0, len: 200, cars: 12, parked: 8, stop: { z: -30, t0, t1 } }); CITY.update(t);
import * as THREE from 'three';
import { scene, V, rng, pbr, mesh } from './realkit.js';
import { Batch, photoMat, boxUV } from './world3d.js';
import { leafyTrees } from './nature.js';
import { realCar } from './cars.js';

const ctex = (w, h, fn, rep = [1, 1]) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; return t; };
const M = (o) => new THREE.MeshPhysicalMaterial({ roughness: 0.6, ...o });

// ---- instancing helper (thousands of windows / mullions cost one draw call each kind) ----
class Inst { constructor(geo, mat, colors = false) { this.geo = geo; this.mat = mat; this.list = []; this.colors = colors; }
  add(x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, col = null) { this.list.push([new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), ry), V(sx, sy, sz)), col]); }
  flush() { if (!this.list.length) return null; const im = new THREE.InstancedMesh(this.geo, this.mat, this.list.length); this.list.forEach(([m, c], i) => { im.setMatrixAt(i, m); if (this.colors) im.setColorAt(i, c || new THREE.Color(1, 1, 1)); }); im.castShadow = true; im.receiveShadow = true; scene.add(im); return im; } }

function mats() {
  const winTex = ctex(64, 128, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#b8b8b8'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, H * 0.55, W, 3); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W * 0.5, 0); g.lineTo(0, H * 0.6); g.fill(); });
  return {
    glassT: M({ color: 0x5aa8c8, metalness: 0.85, roughness: 0.06, clearcoat: 1, envMapIntensity: 1.8 }),           // curtain wall glass (reflective)
    glassG: M({ color: 0x4ac8a8, metalness: 0.85, roughness: 0.06, clearcoat: 1, envMapIntensity: 1.8 }),
    glassB: M({ color: 0x3a6ad8, metalness: 0.85, roughness: 0.06, clearcoat: 1, envMapIntensity: 1.8 }),
    win: new THREE.MeshPhysicalMaterial({ map: winTex, color: 0xffffff, metalness: 0.5, roughness: 0.08, clearcoat: 1, envMapIntensity: 1.4, emissive: 0x000000 }),   // punched window panes, per-instance tint
    alu: M({ color: 0xb8c0c8, metalness: 0.9, roughness: 0.3 }), darkAlu: M({ color: 0x2a3038, metalness: 0.8, roughness: 0.35 }),
    frame: M({ color: 0xf0e6d2, roughness: 0.5 }), stoneTrim: pbr('sandstone_cracks', [1, 1], { metal: 0, rough: 0.85, tint: '#e8d0a8' }),
    brick: photoMat('brick', { rep: 1 }), sand: pbr('red_sandstone_wall', [1, 1], { metal: 0, rough: 1 }),
    rail: M({ color: 0x24282e, metalness: 0.8, roughness: 0.35 }), railGlass: M({ color: 0x9ad8e8, metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.45 }),
    ac: M({ color: 0xd8dce0, metalness: 0.3, roughness: 0.5 }), shop: M({ color: 0x3a4a54, metalness: 0.5, roughness: 0.05, clearcoat: 1, envMapIntensity: 1.5, emissive: 0x3a2a14 }),
    curb: M({ color: 0x9a9a98, roughness: 0.8 }), plant: M({ color: 0x5a4a3a, roughness: 0.9 }),
  };
}
const STUCCO = ['#e8784a', '#f2b84a', '#4ab8a8', '#e86a8a', '#7a9ad8', '#9ac85a'];

function signTex(txt, bg, fg) { return new THREE.MeshStandardMaterial({ map: ctex(512, 128, (g, W, H) => { g.fillStyle = bg; g.fillRect(0, 0, W, H); g.fillStyle = fg; g.font = 'bold 78px "DejaVu Sans"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, W / 2, H / 2 + 4); g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(8, 8, W - 16, H - 16); }), emissive: 0xffffff, emissiveIntensity: 0.15, emissiveMap: null, roughness: 0.4 }); }
const SHOPS = [['CAFE', '#2a5a3a', '#f2e6c8'], ['BAKERY', '#8a3a2a', '#ffe8b0'], ['BOOKS', '#1a3a6a', '#f2f2f2'], ['PIZZA', '#c8281a', '#fff2c8'], ['TECH', '#1a1a1a', '#4af0ff'], ['FLOWERS', '#e86a8a', '#ffffff'], ['GYM', '#2a2a2a', '#ffd84a'], ['MUSIC', '#5a2a8a', '#ffd8ff'], ['SHOES', '#c86a1a', '#1a1a1a'], ['PHARMACY', '#1a8a5a', '#ffffff']];

// one building on the street. side = -1 (left, front faces +x) / +1 (right, front faces -x). x0 = street-facing plane
function building(B, I, X, side, z, w, d, kind, floors, seed) {
  const r = rng(seed * 31 + 7), fh = 3.4, H = floors * fh + 1.2, cx = X + side * d / 2, ry = side < 0 ? Math.PI / 2 : -Math.PI / 2;   // local front normal points to the street
  const fx = X; const toStreet = -side;   // front face x = X; +toStreet = direction to the street
  const along = (u) => z + u;   // u in [-w/2, w/2] along the street
  // ground floor (shop) for all kinds
  const shop = SHOPS[seed % SHOPS.length]; const gh = 4.2;
  B.add(new THREE.BoxGeometry(d, gh, w), I.m.darkAlu, cx, gh / 2, z);
  for (let k = 0; k < Math.floor(w / 3.2); k++) { const u = -w / 2 + 1.6 + k * 3.2; I.shopGlass.add(fx + toStreet * 0.03, 1.9, along(u), ry, 2.9, 3.2, 1); I.mullion.add(fx + toStreet * 0.08, gh / 2, along(u - 1.6), 0, 1, gh, 1); }
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w - 1, 7), 1.0), signTex(shop[0], shop[1], shop[2])); sg.position.set(fx + toStreet * 0.12, 3.75, z); sg.rotation.y = ry; scene.add(sg);
  const awn = new THREE.Mesh(new THREE.PlaneGeometry(w - 1.2, 1.6), I.awnings[seed % I.awnings.length]); awn.position.set(fx + toStreet * 0.75, 3.0, z); awn.rotation.set(0, ry, 0); awn.rotateX(-1.05); scene.add(awn);
  const up = gh, Hb = H - gh;
  if (kind === 'glass') {
    const gm = [I.m.glassT, I.m.glassG, I.m.glassB][seed % 3]; B.add(new THREE.BoxGeometry(d, Hb, w), gm, cx, up + Hb / 2, z);
    for (let k = 0; k <= Math.floor(w / 1.5); k++) I.mullion.add(fx + toStreet * 0.06, up + Hb / 2, along(-w / 2 + k * (w / Math.floor(w / 1.5))), 0, 1, Hb, 1);   // vertical mullions on the front
    for (let k = 0; k <= Math.floor(d / 1.5); k++) for (const s2 of [-1, 1]) I.mullionS.add(cx - side * (d / 2) + side * k * (d / Math.floor(d / 1.5)), up + Hb / 2, z + s2 * (w / 2 + 0.06), 0, 1, Hb, 1);
    for (let f = 0; f <= floors - 1; f++) { const y = up + f * fh; B.add(new THREE.BoxGeometry(d + 0.16, 0.45, w + 0.16), I.band[seed % I.band.length], cx, y + 0.22, z); }
    // setback crown + roof plant + antenna
    const cw = w * 0.7, cd = d * 0.7, ch = 4 + r() * 6; B.add(new THREE.BoxGeometry(cd, ch, cw), gm, cx, H + ch / 2, z); B.add(new THREE.BoxGeometry(cd + 0.3, 0.5, cw + 0.3), I.m.alu, cx, H + ch + 0.25, z);
    B.add(new THREE.BoxGeometry(d + 0.3, 0.9, w + 0.3), I.m.alu, cx, H + 0.45, z); if (r() > 0.4) B.add(new THREE.CylinderGeometry(0.08, 0.12, 8, 8), I.m.alu, cx, H + ch + 4, z);
    for (let k = 0; k < 3; k++) B.add(new THREE.BoxGeometry(2, 1.4, 1.6), I.m.ac, cx + (r() - 0.5) * cd * 0.6, H + 0.9 + 0.7, z + (r() - 0.5) * cw * 0.6);
  } else {
    const wall = kind === 'brick' ? I.m.brick : kind === 'stone' ? I.m.sand : I.stucco[seed % I.stucco.length];
    B.add(kind === 'stucco' ? new THREE.BoxGeometry(d, Hb, w) : boxUV(d, Hb, w, 2.2), wall, cx, up + Hb / 2, z);
    // cornice + parapet
    B.add(new THREE.BoxGeometry(d + 0.6, 0.5, w + 0.6), I.m.stoneTrim, cx + side * 0.0, H + 0.1, z); B.add(new THREE.BoxGeometry(d + 0.3, 0.9, w + 0.3), wall, cx, H + 0.8, z);
    B.add(new THREE.BoxGeometry(d + 0.5, 0.3, w + 0.5), I.m.stoneTrim, cx, up + 0.1, z);   // string course over the shops
    const nW = Math.max(2, Math.floor(w / 2.6)), ww = 1.3, wh = 1.9;
    for (let f = 0; f < floors - 1; f++) { const y = up + 1.6 + f * fh; const bal = (kind !== 'brick' || f % 2 === 1) && f > 0;
      for (let k = 0; k < nW; k++) { const u = -w / 2 + (k + 0.5) * (w / nW); const lit = r() < 0.18; const tint = lit ? new THREE.Color(1.4, 1.2, 0.8) : new THREE.Color(0.55 + r() * 0.2, 0.7 + r() * 0.15, 0.85 + r() * 0.15);
        I.pane.add(fx + toStreet * 0.04, y, along(u), ry, ww, wh, 1, tint);                                           // glass pane
        I.frameV.add(fx + toStreet * 0.08, y, along(u - ww / 2), 0, 1, wh + 0.1, 1); I.frameV.add(fx + toStreet * 0.08, y, along(u + ww / 2), 0, 1, wh + 0.1, 1); I.frameV.add(fx + toStreet * 0.07, y, along(u), 0, 0.6, wh, 1);
        I.sill.add(fx + toStreet * 0.14, y - wh / 2 - 0.08, along(u), 0, 1, 1, ww + 0.3); I.sill.add(fx + toStreet * 0.1, y + wh / 2 + 0.12, along(u), 0, 1, 1.6, ww + 0.2);   // sill + lintel
        if (kind === 'stucco') for (const s2 of [-1, 1]) I.shutter.add(fx + toStreet * 0.06, y, along(u + s2 * (ww / 2 + 0.33)), ry, 0.6, wh, 1, new THREE.Color(STUCCO[(seed + 2) % STUCCO.length]).multiplyScalar(0.6));
        if (!bal && r() < 0.15) I.acu.add(fx + toStreet * 0.35, y - 0.7, along(u + 0.3), 0);
      }
      if (bal) { const bw = w * (kind === 'stone' ? 0.9 : 0.6), bx = fx + toStreet * 0.75; B.add(new THREE.BoxGeometry(1.5, 0.18, bw), I.m.stoneTrim, bx, y - 1.05, z);
        if (kind === 'stucco' || kind === 'stone') B.add(new THREE.BoxGeometry(0.06, 1.0, bw), I.m.railGlass, bx + toStreet * 0.72, y - 0.5, z);
        else { B.add(new THREE.BoxGeometry(0.06, 0.06, bw), I.m.rail, bx + toStreet * 0.72, y - 0.0, z); for (let k = 0; k <= Math.floor(bw / 0.14); k++) I.baluster.add(bx + toStreet * 0.72, y - 0.5, z - bw / 2 + k * 0.14); }
        B.add(new THREE.BoxGeometry(1.5, 1.0, 0.06), I.m.rail, bx, y - 0.5, z - bw / 2); B.add(new THREE.BoxGeometry(1.5, 1.0, 0.06), I.m.rail, bx, y - 0.5, z + bw / 2);
        if (r() < 0.6) I.pots.add(bx + toStreet * 0.4, y - 0.75, z + (r() - 0.5) * bw * 0.8); }
    }
    // side faces: plain wall with a few windows (seen in perspective)
    for (let f = 0; f < floors - 1; f++) for (const s2 of [-1, 1]) for (let k = 0; k < Math.floor(d / 4); k++) { const y = up + 1.6 + f * fh, xx = fx - toStreet * (2 + k * 4); I.pane.add(xx, y, z + s2 * (w / 2 + 0.03), s2 > 0 ? 0 : Math.PI, 1.1, 1.7, 1, new THREE.Color(0.6, 0.72, 0.85)); }
  }
}

export function realCity(o = {}) {
  const z0 = o.z0 ?? 0, L = o.len ?? 200; const B = new Batch(); const m = mats();
  const I = { m, stucco: STUCCO.map((c) => M({ color: c, roughness: 0.85 })), band: ['#2a3a4a', '#e8784a', '#1a6a6a', '#c8a878'].map((c) => M({ color: c, roughness: 0.5, metalness: 0.3 })),
    awnings: [['#e8282a', '#fff2d8'], ['#1a6ad8', '#f2f2e8'], ['#2a8a4a', '#f6ead0'], ['#f2a83a', '#5a2a1a'], ['#8a3ab0', '#f2e0ff']].map(([a, b]) => new THREE.MeshStandardMaterial({ map: ctex(256, 64, (g, W, H) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * W / 8, 0, W / 8 + 1, H); } g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, H - 8, W, 8); }), side: THREE.DoubleSide, roughness: 0.8 })) };
  I.shopGlass = new Inst(new THREE.PlaneGeometry(1, 1), m.shop); I.mullion = new Inst(new THREE.BoxGeometry(0.12, 1, 0.12), m.alu); I.mullionS = new Inst(new THREE.BoxGeometry(0.12, 1, 0.12), m.alu);
  I.pane = new Inst(new THREE.PlaneGeometry(1, 1), m.win, true); I.frameV = new Inst(new THREE.BoxGeometry(0.1, 1, 0.1), m.frame); I.sill = new Inst(new THREE.BoxGeometry(0.28, 0.12, 1), m.stoneTrim);
  I.shutter = new Inst(new THREE.PlaneGeometry(1, 1), M({ color: 0xffffff, roughness: 0.7 }), true); I.acu = new Inst(new THREE.BoxGeometry(0.6, 0.55, 0.9), m.ac); I.baluster = new Inst(new THREE.BoxGeometry(0.03, 1.0, 0.03), m.rail);
  I.pots = new Inst(new THREE.SphereGeometry(0.28, 10, 8), M({ color: 0x4a9a3a, roughness: 0.8 }));
  // street surfaces
  const asphalt = pbr('gravel_floor_02', [3, L / 5], { metal: 0, rough: 0.9, tint: '#4a4c52' }); const road = mesh(new THREE.PlaneGeometry(14, L), asphalt, 0, 0.01, z0 - L / 2, false); road.rotation.x = -Math.PI / 2; road.receiveShadow = true; scene.add(road);
  const lineM = new THREE.MeshStandardMaterial({ color: 0xf2f0e6, roughness: 0.6 }), yel = new THREE.MeshStandardMaterial({ color: 0xf2c23a, roughness: 0.6 });
  for (let k = 0; k < L / 6; k++) B.add(new THREE.BoxGeometry(0.15, 0.02, 3), lineM, 0, 0.02, z0 - 3 - k * 6); for (const sd of [-1, 1]) B.add(new THREE.BoxGeometry(0.12, 0.02, L), yel, sd * 6.6, 0.02, z0 - L / 2);
  const tiles = new THREE.MeshStandardMaterial({ map: ctex(256, 256, (g, W) => { g.fillStyle = '#b8aca0'; g.fillRect(0, 0, W, W); const r = rng(4); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = `hsl(${25 + r() * 10},${12 + r() * 8}%,${62 + r() * 10}%)`; g.fillRect(i * 64 + 2, j * 64 + 2, 60, 60); } }, [3, L / 3]), roughness: 0.85 });
  for (const sd of [-1, 1]) { const w = mesh(new THREE.BoxGeometry(6, 0.18, L), tiles, sd * 10, 0.09, z0 - L / 2); w.receiveShadow = true; scene.add(w); B.add(new THREE.BoxGeometry(0.3, 0.2, L), m.curb, sd * 7.1, 0.1, z0 - L / 2); }
  // zebra at stop.z
  const zz = o.stop ? o.stop.z : z0 - 30; for (let k = 0; k < 9; k++) B.add(new THREE.BoxGeometry(0.8, 0.025, 4), lineM, -6 + k * 1.5, 0.025, zz);
  // buildings (both sides, no gaps), mixed kinds and heights
  const kinds = ['glass', 'brick', 'stucco', 'glass', 'stone', 'brick', 'stucco', 'glass'];
  for (const sd of [-1, 1]) { let z = z0 - 2, i = sd > 0 ? 3 : 0; while (z > z0 - L) { const w = 12 + ((i * 7) % 3) * 3, kind = kinds[i % kinds.length], floors = kind === 'glass' ? 9 + (i * 5) % 8 : 4 + (i * 3) % 4; building(B, I, sd * 13, sd, z - w / 2, w, 14, kind, floors, i + (sd > 0 ? 50 : 0)); z -= w; i++; } }
  // street furniture: lamps, trees in pits, benches, traffic lights, bus stop
  const metal = M({ color: 0x2a2e34, metalness: 0.7, roughness: 0.35 }), bulb = new THREE.MeshStandardMaterial({ color: 0xfff2d0, emissive: 0xffe2a0, emissiveIntensity: 1.5 });
  const treesList = [];
  for (let k = 0; k < Math.floor(L / 14); k++) for (const sd of [-1, 1]) { const z = z0 - 6 - k * 14; if (Math.abs(z - zz) < 4) continue;
    B.add(new THREE.CylinderGeometry(0.08, 0.12, 6.5, 10), metal, sd * 7.7, 3.25, z); B.add(new THREE.BoxGeometry(1.6, 0.1, 0.25), metal, sd * 7.0, 6.45, z); B.add(new THREE.BoxGeometry(0.7, 0.08, 0.3), bulb, sd * 6.6, 6.38, z);
    if (Math.abs(z - 7 - zz) > 6) { B.add(new THREE.BoxGeometry(1.4, 0.12, 1.4), m.curb, sd * 8.3, 0.2, z - 7); B.add(new THREE.BoxGeometry(1.2, 0.1, 1.2), m.plant, sd * 8.3, 0.22, z - 7); treesList.push([sd * 8.3, z - 7, 0.95 + ((k * 3) % 4) * 0.08, ['oak', 'maple', 'blossom', 'oak'][k % 4], k + (sd > 0 ? 20 : 0), 0.2]); }
    if (k % 3 === 1) { B.add(new THREE.BoxGeometry(0.5, 0.06, 1.8), M({ color: 0x8a5a2a, roughness: 0.7 }), sd * 11.5, 0.65, z - 3.5); B.add(new THREE.BoxGeometry(0.08, 0.5, 1.8), M({ color: 0x8a5a2a, roughness: 0.7 }), sd * 11.75, 0.95, z - 3.5); for (const dz of [-0.8, 0.8]) B.add(new THREE.BoxGeometry(0.4, 0.6, 0.06), metal, sd * 11.5, 0.35, z - 3.5 + dz); } }
  leafyTrees(treesList);
  const tl = []; for (const sd of [-1, 1]) { const z = zz + sd * 2.6; B.add(new THREE.CylinderGeometry(0.1, 0.1, 5.2, 10), metal, sd * 7.5, 2.6, z); B.add(new THREE.BoxGeometry(0.5, 1.4, 0.45), metal, sd * 7.5, 5.0, z);
    const L3 = [0xff2a2a, 0xffc020, 0x2aff6a].map((c, i) => { const l = mesh(new THREE.SphereGeometry(0.14, 14, 10), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.15 }), sd * 7.5 - sd * 0.24, 5.45 - i * 0.42, z, false); scene.add(l); return l; }); tl.push(L3); }
  B.flush(); for (const k of Object.keys(I)) if (I[k] instanceof Inst) I[k].flush();
  // cars
  const cols = ['#d8283a', '#1a6ad8', '#f2c63a', '#2ab86a', '#ff7a2a', '#8a3ab0', '#18b8c8', '#2a2a30', '#c8ccd4', '#e86a8a'], types = ['sedan', 'suv', 'taxi', 'hatch', 'sports', 'sedan', 'suv'];
  const cars = []; for (let i = 0; i < (o.cars ?? 10); i++) { const c = realCar(cols[i % cols.length], { type: types[i % types.length] }); const lane = i % 2 ? 1 : -1; c.userData.lane = lane; c.userData.z0 = z0 - 10 - (i * 19) % L; c.userData.v = 8 + (i % 4) * 2; scene.add(c); cars.push(c); }
  for (let i = 0; i < (o.parked ?? 8); i++) { const sd = i % 2 ? 1 : -1; const c = realCar(cols[(i + 3) % cols.length], { type: types[(i + 2) % types.length] }); c.position.set(sd * 5.6, 0, z0 - 14 - i * 11); c.rotation.y = Math.PI / 2 * (sd > 0 ? -1 : 1) + Math.PI; scene.add(c); }
  return { cars, lights: tl, update: (t) => { const S = o.stop, q = { '-1': [], '1': [] }; const red = S && t > S.t0 && t < S.t1, lightRed = S && t > S.t0 && t < (S.green ?? S.t1);
    for (const L3 of tl) L3.forEach((l, i) => { const on = lightRed ? i === 0 : i === 2; l.material.emissiveIntensity = on ? 4 : 0; l.material.color.setHex(on ? [0xff2a2a, 0xffc020, 0x2aff6a][i] : 0x2a2a2e); });
    for (const c of cars) { const u = c.userData; let z = u.z0 + u.lane * u.v * t; z = z0 - (((z0 - z) % L) + L) % L; c.position.set(u.lane * 3.4, 0, z); c.rotation.y = u.lane > 0 ? -Math.PI / 2 : Math.PI / 2; c.userData.spin(u.v * t);
      if (red) { const d = (z - S.z) * u.lane + 4; if (d >= 0 && d <= u.v * (t - S.t0)) q[u.lane].push([d, c]); } }
    for (const ln of [-1, 1]) q[ln].sort((a, b) => b[0] - a[0]).forEach(([, c], k) => { c.position.z = S.z - ln * (4 + k * 5.6); }); } };
}
