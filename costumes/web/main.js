import * as THREE from 'three';
import { Flat2D } from '../../web/flat2d.js';
const cv = document.getElementById('c'), g = cv.getContext('2d'); const grp = new THREE.Group();
const C = [
  ['Badshah (royal)', { body: 'royal', coat: '#9a1a2a', cape: '#5a1a7a', sash: '#1a8a5a', hat: 'crown', hatCol: '#f2c63a', beard: '#2a1810', mustache: true }, { armL: [40, -110], armR: [92, -4] }],
  ['Wazir (sherwani)', { body: 'sherwani', coat: '#1a5a7a', sash: '#f2c63a', hat: 'turban', hatCol: '#f4f0e6', band: '#d8283a', beard: '#5a5a5a' }, { armL: [16, -32], armR: [60, -110] }],
  ['Sipahi (armor)', { body: 'armor', coat: '#2a4a9a', steel: '#b8c0ca', emblem: '#f2c63a', hat: 'helm', hatCol: '#a8aeb6', band: '#d8283a', mustache: true, prop: 'spear' }, { armL: [16, -32], armR: [20, 10], prop: 'spear', propHand: 'R' }],
  ['Dushman (armor)', { body: 'armor', coat: '#8a1a1a', steel: '#a08a5a', hat: 'helm', hatCol: '#a07a3a', band: '#1a1a1a', beard: '#1a1410' }, { armL: [60, -40], armR: [150, -20], prop: 'sword', propHand: 'R' }],
  ['Aaj: t-shirt + jeans', { body: 'tshirt', coat: '#e8282a', print: 'CITY', pants: { col: '#2a4a7a', len: 'long' }, hairStyle: 'quiff', hair: '#1a1410' }, { armL: [16, -32], armR: [96, -96] }],
  ['Aaj: hoodie', { body: 'hoodie', coat: '#2ab86a', pants: { col: '#2a2a2e', len: 'long' }, hairStyle: 'messy', hair: '#3a2414', glasses: 'round' }, { armL: [40, -120], armR: [40, -120] }],
  ['Aaj: jacket', { body: 'jacket', coat: '#3a5a8a', shirt: '#f4f4f4', pants: { col: '#1a1a1a', len: 'long' }, hairStyle: 'side', hair: '#1a1410' }, { armL: [16, -32], armR: [16, -32] }],
  ['Aaj: suit', { body: 'suit', coat: '#2a2a3a', tie: '#e8282a', pocketSq: '#f2c63a', pants: { col: '#2a2a3a', len: 'long' }, hairStyle: 'swept', hair: '#1a1410' }, { armL: [16, -32], armR: [150, 20] }],
];
Flat2D.T = 0.5; C.forEach(([name, o, p], i) => { const F = new Flat2D({ size: 1.95, res: 1, headroom: 300, seed: i + 2, ...o, scene: grp }); F.update({ noBlink: true, noIdle: true, e: 0, face: { eyes: 'lid', lid: 0.2, mouth: 'smile' }, ...p });
  const w = 250, h = w * F.ch / F.cw; g.drawImage(F.cv, i * 250, 40, w, h); g.fillStyle = '#1a1410'; g.font = 'bold 22px "DejaVu Sans"'; g.textAlign = 'center'; g.fillText(name, i * 250 + 125, 30); });
window.renderFrame = () => {}; window.ready = true;
