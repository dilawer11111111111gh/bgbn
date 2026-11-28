import * as THREE from 'three';
import { Flat2D } from '../../web/flat2d.js';
import { installActing } from '../../web/studio.js';
import { perform } from '../../web/actor.js';
installActing();
const cv = document.getElementById('c'), g = cv.getContext('2d'); const grp = new THREE.Group();
const moods = ['happy', 'laugh', 'attitude', 'angry', 'shock', 'scared', 'sad', 'think', 'evil', 'excited', 'talk', 'confused', 'phone', 'determined'];
const F = new Flat2D({ body: 'suit', coat: '#1a2a4a', tie: '#e8282a', hairStyle: 'quiff', hair: '#1a1410', glasses: 'round', size: 1.95, res: 1, headroom: 300, seed: 4, scene: grp });
// rows: moods (first 7 / next 7), columns: 4 beats each
moods.forEach((m, mi) => { for (let b = 0; b < 4; b++) { const t = 0.15 + b * 0.27; Flat2D.T = t; F.update(perform(t, [[0, m]], 5 + mi)); const w = 140, h = w * F.ch / F.cw;
  const col = (mi % 4) * 4 + b, row = Math.floor(mi / 4); g.drawImage(F.cv, col * 140, row * 370 - 40, w, h); if (b === 0) { g.fillStyle = '#1a1410'; g.font = 'bold 24px "DejaVu Sans"'; g.fillText(m, col * 140 + 10, 30 + row * 370); } } });
window.renderFrame = () => {}; window.ready = true;
