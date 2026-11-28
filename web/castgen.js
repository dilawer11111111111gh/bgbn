// castgen.js (Studio v9.2): UNLIMITED characters. Every seed gives a new person: head shape/size, body size/width,
// skin tone, eyes (size, spacing), nose, hair style + colour, moustache/beard styles, glasses, freckles, scars, and a
// costume that fits the ERA and ROLE (torso only; legs stay plain black sticks). Never reuse one face for everybody.
//   import { makeCharacter, makeCast, crowdVariants, fakeName } from '../../web/castgen.js';
//   const DET = new Flat2D({ ...makeCharacter({ era: 'noir', role: 'detective', seed: 17 }), size: 1.95, res: 2.2, wide: true, headroom: 420, scene });
//   const V = crowdVariants('today', 18, 5);   // → makeAtlas(V, frames)
// Eras: medieval · royal (Mughal court) · noir (1920s–50s) · today · western · ancient (Egypt/Rome) · future
// Roles per era: see ROLES below (or 'random'). Gold only for kings.
const mul = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const SKIN = ['#fff3e6', '#ffe6cc', '#f8d6b0', '#eec49a', '#dba57a', '#c08a5e', '#9a6a48', '#7a5038'];
const HAIR_DARK = ['#141018', '#1a1410', '#2a1d16', '#3a2414'], HAIR_ALL = [...HAIR_DARK, '#5a3a22', '#8a5a2a', '#c8582a', '#c8a050', '#e0c878', '#8a8a8a', '#d8d8d8'];
const STYLES = ['quiff', 'side', 'curly', 'spiky', 'messy', 'swept', 'bangs', 'pompadour', 'tufts', 'bald'];
const PAL = {
  medieval: ['#1a4a9a', '#9a1a2a', '#2a6a3a', '#6a3a8a', '#8a5a2a', '#c87a2a', '#3a5a7a', '#5a2a1a'],
  royal: ['#9a1a2a', '#1a4a9a', '#1a7a6a', '#6a2a8a', '#c85a2a', '#2a6a3a', '#1a5a7a'],
  noir: ['#2a2a32', '#3a3a44', '#4a3a2a', '#5a1a20', '#2a3a4a', '#4a4a3a', '#6a5a4a', '#1a2a3a'],
  today: ['#e8282a', '#1a6ad8', '#2ab86a', '#f2c63a', '#ff7a2a', '#8a3ab0', '#18b8c8', '#e86a8a', '#2a2a2e', '#f4f0e6'],
  western: ['#8a5a2a', '#6a3a1a', '#c87a3a', '#3a5a7a', '#5a3a2a', '#9a2a1a', '#d8b878'],
  ancient: ['#f2e6c8', '#d8b878', '#1a8aa8', '#c8582a', '#8a3a2a', '#2a6a8a'],
  future: ['#18c8d8', '#e8e8f0', '#8a3ab0', '#2a2a3a', '#ff4ad8', '#4af07a'],
};
// role → [bodies], [hats], [props], extra
export const ROLES = {
  medieval: { king: [['royal'], ['crown'], [null, 'sword']], knight: [['armor'], ['helm', null], ['sword', 'spear', 'shield']], archer: [['armor'], ['helm'], ['bow']], soldier: [['armor'], ['helm'], ['spear', 'sword', 'shield']],
    villager: [['vest', 'overalls', 'coat'], [null, 'flat', 'cap', null], [null, 'sack', 'hammer', 'bucket']], worker: [['vest', 'overalls'], [null, 'flat'], ['hammer', 'bucket', 'rag', null]], baron: [['armor', 'coat'], [null], ['sword', null]], monk: [['coat'], [null], [null]] },
  royal: { king: [['royal'], ['crown'], [null]], minister: [['sherwani'], ['turban'], [null, 'pen']], guard: [['armor'], ['helm'], ['spear', 'sword']], courtier: [['sherwani'], ['turban', null], [null]], servant: [['vest'], [null, 'turban'], ['bucket', 'rag', null]] },
  noir: { detective: [['suit', 'jacket'], ['fedora'], [null, 'pistol']], boss: [['suit'], ['fedora', 'bowler'], [null]], gangster: [['suit', 'vest'], ['fedora', 'derby', 'flat'], ['pistol', null]], cop: [['jacket'], ['police'], [null]],
    bartender: [['vest'], [null], ['rag']], newsboy: [['vest'], ['flat'], ['sign', null]], driver: [['jacket'], ['flat', 'cap'], [null]], citizen: [['suit', 'jacket', 'vest'], ['fedora', 'derby', null], [null]] },
  today: { office: [['suit', 'jacket'], [null], [null, 'phone']], student: [['hoodie', 'tshirt'], [null, 'ball'], [null, 'phone']], worker: [['overalls', 'vest'], ['hardhat', null], ['hammer', 'wrench']], chef: [['coat'], ['chef'], [null]],
    police: [['jacket'], ['police'], [null]], athlete: [['polo', 'tshirt'], [null, 'ball'], [null, 'trophy']], gamer: [['hoodie'], [null], ['phone']], shopkeeper: [['vest', 'polo'], [null], [null]], citizen: [['tshirt', 'hoodie', 'jacket', 'suit', 'polo'], [null, null, 'ball'], [null, 'phone']] },
  western: { sheriff: [['vest'], ['cowboy'], ['pistol']], outlaw: [['coat', 'vest'], ['cowboy'], ['pistol']], farmer: [['overalls'], ['cowboy', null], ['bucket', 'hammer']], townsman: [['vest', 'coat'], ['cowboy', 'derby', null], [null]] },
  ancient: { pharaoh: [['royal'], ['crown'], [null]], worker: [['vest'], [null], ['hammer', 'sack']], soldier: [['armor'], ['helm'], ['spear', 'shield']], scribe: [['coat'], [null], ['pen']] },
  future: { pilot: [['jacket'], ['aviator', null], [null]], scientist: [['coat'], [null], ['phone', null]], citizen: [['hoodie', 'tshirt', 'suit'], [null], [null]], robotcop: [['armor'], ['helm'], [null]] },
};
const VILLAIN = ['baron', 'gangster', 'boss', 'outlaw'];
export function makeCharacter({ era = 'today', role = 'random', seed = 1, signature = null } = {}) {
  const r = mul(seed * 7919 + 17), pick = (a) => a[Math.floor(r() * a.length)], RL = ROLES[era] || ROLES.today; if (role === 'random' || !RL[role]) role = pick(Object.keys(RL));
  const [bodies, hats, props] = RL[role]; const pal = PAL[era] || PAL.today; const body = pick(bodies); const coat = signature || pick(pal);
  const skin = pick(SKIN), darkSkin = SKIN.indexOf(skin) >= 5, old = r() < 0.22;
  const hair = old ? pick(['#8a8a8a', '#d8d8d8', '#b8b8b8']) : darkSkin ? pick(HAIR_DARK) : pick(HAIR_ALL.slice(0, 9));
  const villain = VILLAIN.includes(role);
  const o = { body, coat, skin, hair, hairStyle: old && r() < 0.4 ? 'bald' : pick(STYLES), seed: (seed % 997) + 1,
    head: 1.0 + r() * 0.28, headShape: pick(['oval', 'oval', 'round', 'long', 'wide', 'egg']), width: 0.85 + r() * 0.6, size: 1.75 + r() * 0.4,
    eyeScale: 0.85 + r() * 0.4, eyeGap: 0.9 + r() * 0.22, eyeY: (r() - 0.5) * 8, noseF: pick([null, null, 'button', 'long', 'round', 'small']),
    mustache: r() < (villain ? 0.75 : 0.35) ? pick([true, 'handlebar', 'pencil', 'walrus', 'chevron']) : false,
    beard: r() < (old ? 0.45 : 0.2) ? hair : null, beardStyle: pick(['full', 'goatee', 'stubble']), glasses: r() < 0.18 ? pick(['round', 'square']) : null,
    freckles: !darkSkin && r() < 0.15, scar: villain && r() < 0.5,
    hat: pick(hats), hatCol: pick(['#2a2a30', '#4a3a2a', '#6a5a4a', '#1a2a3a', '#8a2a1a']), band: pick(['#1a1a1a', '#8a1a1a', '#c8a050']),
    tie: pick(['#e8282a', '#1a4a9a', '#2a8a4a', '#f2c63a', '#1a1a1a']), shirt: pick(['#f4f0e6', '#d8e4f0', '#f2e6c8']), collar: '#f4f0e6',
    prop: pick(props), role, era, name: fakeName(seed, era) };
  if (body === 'armor') Object.assign(o, { steel: villain ? '#3a3a46' : pick(['#c8ced6', '#b0b8c2', '#9aa4b0']), emblem: pick(['#bfe8ff', '#c8281a', '#1a4a9a']), hatCol: villain ? '#2a2a30' : '#a8aeb6' });
  if (body === 'royal') Object.assign(o, { cape: pick(['#9a1a2a', '#5a1a7a', '#1a4a9a']), sash: '#f2c63a', hatCol: '#f2c63a', mustache: o.mustache || true });   // gold only on the king
  if (body === 'sherwani') Object.assign(o, { sash: pick(['#e8282a', '#1a8a5a', '#1a4a9a']), hatCol: pick(['#f2a83a', '#e8282a', '#f4f0e6', '#1a8a8a']), band: '#d8283a' });
  if (o.hat === 'chef') o.coat = '#f4f4f4';
  if (o.hat === 'fedora' || o.hat === 'derby' || o.hat === 'bowler') o.hatCol = pick(['#2a2a30', '#3a3028', '#4a4a52', '#5a4a3a']);
  if (o.hat === 'police') o.hatCol = '#1a2a4a';
  if (o.hat === 'crown' && body !== 'royal') o.hat = null;
  if (body === 'tshirt') o.print = pick([null, 'GO', 'NYC', '23', 'CITY', null]);
  return o;
}
export const makeCast = (era, roles, seed = 1) => roles.map((role, i) => makeCharacter({ era, role, seed: seed * 101 + i * 13 }));
export function crowdVariants(era, n = 16, seed = 1, roles = null) { const RL = Object.keys(ROLES[era] || ROLES.today).filter((k) => !['king', 'pharaoh', 'boss'].includes(k)); const rs = roles || RL;
  return Array.from({ length: n }, (_, i) => { const c = makeCharacter({ era, role: rs[i % rs.length], seed: seed * 977 + i * 31 }); c.prop = r1(i) ? c.prop : null; return c; }); }
const r1 = (i) => (Math.sin(i * 12.9898) * 43758.5453) % 1 > 0.2;
const FIRST = ['Barnaby', 'Edgar', 'Rupert', 'Silas', 'Archie', 'Felix', 'Otis', 'Mortimer', 'Jasper', 'Clyde', 'Hugo', 'Percy', 'Ralph', 'Wilbur', 'Cecil', 'Monty', 'Gus', 'Leo', 'Max', 'Toby', 'Rex', 'Duke', 'Ziggy', 'Nico', 'Ozzie', 'Basil', 'Alfie', 'Reggie', 'Theo', 'Vince'];
const LAST = ['Thistlewood', 'Grimwald', 'Puddleton', 'Bramble', 'Crumb', 'Wobbleton', 'Fizzwick', 'Copperpot', 'Muddle', 'Snodgrass', 'Pickering', 'Blackwood', 'Featherstone', 'Hollow', 'Quill', 'Rattigan', 'Sprocket', 'Tumble', 'Underhill', 'Wexley', 'Marlowe', 'Malone', 'Callahan', 'Romano', 'Sullivan'];
export function fakeName(seed, era) { const r = mul(seed * 31 + 7); return FIRST[Math.floor(r() * FIRST.length)] + ' ' + LAST[Math.floor(r() * LAST.length)]; }
