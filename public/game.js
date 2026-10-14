// Shared game rules (browser + Node). Original names/visuals; gameplay modeled on 4X-lite tile games.
(function (root) {
'use strict';
const TRIBES = [
  { key: 'verdani', name: 'Verdani', color: '#3fa34d', tech: 'hunting' },
  { key: 'kharu', name: 'Kharu', color: '#d64545', tech: 'climbing' },
  { key: 'solenne', name: 'Solenne', color: '#e0b030', tech: 'fishing' },
  { key: 'mossik', name: 'Mossik', color: '#4a6fd6', tech: 'riding' },
  { key: 'ashra', name: 'Ashra', color: '#a050c8', tech: 'organization' },
  { key: 'tolvi', name: 'Tolvi', color: '#e07a30', tech: 'hunting' },
  { key: 'tidefolk', name: 'Tidefolk', color: '#20b8b0', tech: 'fishing', special: 'aqua', desc: 'Amphibious: land units wade through shallow water' },
  { key: 'wildroot', name: 'Wildroot', color: '#6b8e23', tech: 'hunting', special: 'forest', desc: 'Forest-walkers: forests never stop movement' },
];
const TECHS = {
  climbing: { tier: 1, req: null, name: 'Climbing' }, mining: { tier: 2, req: 'climbing', name: 'Mining' },
  smithery: { tier: 3, req: 'mining', name: 'Smithery' }, meditation: { tier: 2, req: 'climbing', name: 'Meditation' },
  philosophy: { tier: 3, req: 'meditation', name: 'Philosophy' },
  fishing: { tier: 1, req: null, name: 'Fishing' }, whaling: { tier: 2, req: 'fishing', name: 'Whaling' },
  aquatism: { tier: 3, req: 'whaling', name: 'Aquatism' }, sailing: { tier: 2, req: 'fishing', name: 'Sailing' },
  navigation: { tier: 3, req: 'sailing', name: 'Navigation' },
  hunting: { tier: 1, req: null, name: 'Hunting' }, archery: { tier: 2, req: 'hunting', name: 'Archery' },
  spiritualism: { tier: 3, req: 'archery', name: 'Spiritualism' }, forestry: { tier: 2, req: 'hunting', name: 'Forestry' },
  mathematics: { tier: 3, req: 'forestry', name: 'Mathematics' },
  organization: { tier: 1, req: null, name: 'Organization' }, farming: { tier: 2, req: 'organization', name: 'Farming' },
  construction: { tier: 3, req: 'farming', name: 'Construction' }, strategy: { tier: 2, req: 'organization', name: 'Strategy' },
  diplomacy: { tier: 3, req: 'strategy', name: 'Diplomacy' },
  riding: { tier: 1, req: null, name: 'Riding' }, roads: { tier: 2, req: 'riding', name: 'Roads' },
  trade: { tier: 3, req: 'roads', name: 'Trade' }, freespirit: { tier: 2, req: 'riding', name: 'Free Spirit' },
  chivalry: { tier: 3, req: 'freespirit', name: 'Chivalry' },
};
const TECH_DESC = {
  climbing: 'Move onto mountains; mountain defense bonus', mining: 'Build mines on ore (+2 pop)', smithery: 'Swordsman',
  meditation: 'Mountain shrine (+1 pop)', philosophy: 'Mind Bender; techs 33% cheaper',
  fishing: 'Catch fish; build ports (boats)', whaling: 'Harvest whales (+10 stars)', aquatism: 'Water defense bonus',
  sailing: 'Ships; move on ocean', navigation: 'Battleships',
  hunting: 'Hunt animals', archery: 'Archer; forest defense bonus', spiritualism: 'Grow forest',
  forestry: 'Lumber hut, clear forest', mathematics: 'Catapult',
  organization: 'Harvest fruit', farming: 'Farms on crops (+2 pop)', construction: 'Burn forest into fields',
  strategy: 'Defender', diplomacy: 'Reveal all capitals',
  riding: 'Rider', roads: 'Build roads', trade: '+1 star per city per turn', freespirit: 'Temples (+1 pop)', chivalry: 'Knight',
};
// a: attack, d: defense, m: move, hp, r: range, cost, tech, dash: attack after move, escape: move after attack, persist: chain kills
const UNITS = {
  warrior: { name: 'Warrior', a: 2, d: 2, m: 1, hp: 10, r: 1, cost: 2, tech: null, dash: 1 },
  archer: { name: 'Archer', a: 2, d: 1, m: 1, hp: 10, r: 2, cost: 3, tech: 'archery', dash: 1 },
  rider: { name: 'Rider', a: 2, d: 1, m: 2, hp: 10, r: 1, cost: 3, tech: 'riding', dash: 1, escape: 1 },
  defender: { name: 'Defender', a: 1, d: 3, m: 1, hp: 15, r: 1, cost: 3, tech: 'strategy' },
  swordsman: { name: 'Swordsman', a: 3, d: 3, m: 1, hp: 15, r: 1, cost: 5, tech: 'smithery', dash: 1 },
  catapult: { name: 'Catapult', a: 4, d: 0, m: 1, hp: 10, r: 3, cost: 8, tech: 'mathematics' },
  knight: { name: 'Knight', a: 3.5, d: 1, m: 3, hp: 10, r: 1, cost: 8, tech: 'chivalry', dash: 1, persist: 1 },
  guardian: { name: 'Guardian', a: 2, d: 4, m: 1, hp: 20, r: 1, cost: 0, tech: 'none', promoOnly: 1 },
  mindbender: { name: 'Mind Bender', a: 0, d: 1, m: 1, hp: 10, r: 1, cost: 5, tech: 'philosophy', convert: 1 },
  colossus: { name: 'Colossus', a: 5, d: 4, m: 1, hp: 40, r: 1, cost: 0, tech: 'none', sup: 1 },
  treant: { name: 'Treant', a: 4, d: 5, m: 1, hp: 45, r: 1, cost: 0, tech: 'none', sup: 1 },
  golem: { name: 'Stone Golem', a: 4, d: 5, m: 1, hp: 40, r: 1, cost: 0, tech: 'none', sup: 1 },
  sunrider: { name: 'Sun Rider', a: 4, d: 3, m: 2, hp: 30, r: 1, cost: 0, tech: 'none', sup: 1, dash: 1, escape: 1 },
  oracle: { name: 'Oracle', a: 5, d: 3, m: 1, hp: 35, r: 2, cost: 0, tech: 'none', sup: 1 },
  titan: { name: 'Titan', a: 6, d: 3, m: 1, hp: 40, r: 1, cost: 0, tech: 'none', sup: 1, dash: 1 },
  leviathan: { name: 'Leviathan', a: 5, d: 4, m: 2, hp: 40, r: 1, cost: 0, tech: 'none', sup: 1 },
};
const SUPER = { verdani: 'treant', kharu: 'golem', solenne: 'sunrider', mossik: 'colossus', ashra: 'oracle', tolvi: 'titan', tidefolk: 'leviathan', wildroot: 'treant' };
const PROMOTE = { warrior: { to: 'swordsman', cost: 4, tech: 'smithery' }, rider: { to: 'knight', cost: 6, tech: 'chivalry' }, archer: { to: 'catapult', cost: 6, tech: 'mathematics' }, defender: { to: 'guardian', cost: 5, tech: 'construction' } };
const SHIP_UP = { raft: { to: 'ship', cost: 5, tech: 'sailing' }, ship: { to: 'battleship', cost: 15, tech: 'navigation' } };
const MONUMENTS = { wisdom: { name: 'Spire of Wisdom', need: 'Research 15 techs' }, war: { name: 'Bloodstone Arch', need: 'Defeat 10 units' }, empire: { name: 'Crown Pillar', need: 'Rule 5 cities' }, explorer: { name: 'Wayfarer Statue', need: 'Explore 80% of the map' }, wealth: { name: 'Golden Idol', need: 'Hold 60 stars at once' } };
const DIFF = { easy: { bonus: 0, aggr: 0.5 }, normal: { bonus: 0, aggr: 0.85 }, hard: { bonus: 1, aggr: 1 }, crazy: { bonus: 3, aggr: 1 } };
const BOATS = {
  raft: { name: 'Raft', a: 1, d: 1, m: 2, r: 2 }, ship: { name: 'Ship', a: 2, d: 2, m: 3, r: 2 }, battleship: { name: 'Battleship', a: 4, d: 3, m: 3, r: 2 },
};
// Harvest/build actions: terrain/resource requirements, cost, pop/star rewards
const WORKS = {
  fruit: { name: 'Gather fruit', tech: 'organization', res: 'fruit', cost: 2, pop: 1 },
  hunt: { name: 'Hunt', tech: 'hunting', res: 'animal', cost: 2, pop: 1 },
  fish: { name: 'Fish', tech: 'fishing', res: 'fish', cost: 2, pop: 1 },
  whale: { name: 'Harvest whale', tech: 'whaling', res: 'whale', cost: 0, stars: 10 },
  farm: { name: 'Farm', tech: 'farming', res: 'crop', cost: 5, pop: 2, build: 'farm' },
  mine: { name: 'Mine', tech: 'mining', res: 'ore', cost: 5, pop: 2, build: 'mine' },
  lumber: { name: 'Lumber hut', tech: 'forestry', ter: 'forest', cost: 3, pop: 1, build: 'lumber' },
  port: { name: 'Port', tech: 'fishing', ter: 'water', cost: 7, pop: 1, build: 'port' },
  shrine: { name: 'Shrine', tech: 'meditation', ter: 'mountain', cost: 10, pop: 1, build: 'shrine' },
  temple: { name: 'Temple', tech: 'freespirit', ter: 'field', cost: 10, pop: 1, build: 'temple' },
  clear: { name: 'Clear forest', tech: 'forestry', ter: 'forest', cost: 0, stars: 1, to: 'field' },
  burn: { name: 'Burn forest', tech: 'construction', ter: 'forest', cost: 5, to: 'field', newres: 'crop' },
  grow: { name: 'Grow forest', tech: 'spiritualism', ter: 'field', cost: 5, to: 'forest' },
  road: { name: 'Road', tech: 'roads', cost: 3, road: 1 },
  windmill: { name: 'Windmill', tech: 'construction', ter: 'field', cost: 5, build: 'windmill', adj: 'farm', per: 1 },
  sawmill: { name: 'Sawmill', tech: 'mathematics', ter: 'field', cost: 5, build: 'sawmill', adj: 'lumber', per: 1 },
  forge: { name: 'Forge', tech: 'smithery', ter: 'field', cost: 5, build: 'forge', adj: 'mine', per: 2 },
};
const FEEDS = { farm: 'windmill', lumber: 'sawmill', mine: 'forge' };
const CITY_NAMES = ['Ostra','Vel','Quorin','Belmis','Tarn','Ilum','Zephro','Ka-Mel','Durnes','Pallu','Rokka','Seyn','Umbrel','Vashti','Ardo','Fenn','Lirra','Mox','Nadu','Orrin','Pex','Quill','Rhun','Saro','Tilk','Yra','Zoben','Emmet','Gharo','Hesk'];

function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const idx = (st, x, y) => y * st.w + x;
const inb = (st, x, y) => x >= 0 && y >= 0 && x < st.w && y < st.h;
const tile = (st, x, y) => inb(st, x, y) ? st.tiles[idx(st, x, y)] : null;
const dist = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const isWater = t => t.t === 'water' || t.t === 'ocean';
function around(st, x, y, r) { const o = []; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (inb(st, x + dx, y + dy)) o.push({ x: x + dx, y: y + dy }); return o; }

function newGame(opts) {
  opts = opts || {};
  const n = Math.max(2, Math.min(6, opts.players ? opts.players.length : 2));
  const players = (opts.players || [{ type: 'human' }, { type: 'ai' }]).slice(0, n);
  const size = opts.size || (n <= 2 ? 12 : n <= 4 ? 16 : 18);
  const seed = opts.seed || Math.floor(Math.random() * 1e9);
  const R = rng(seed);
  const st = { w: size, h: size, seed, tiles: [], cities: {}, units: {}, players: [], turn: 1, current: 0, nextId: 1,
    mode: opts.mode || 'domination', maxTurns: opts.maxTurns || 30, peace: {}, offers: [], turnSeconds: opts.turnSeconds || 0, version: 2, log: [], winner: null, over: false, pendingLevel: [] };
  // terrain via smoothed noise
  let h = []; for (let i = 0; i < size * size; i++) h.push(R());
  for (let k = 0; k < 3; k++) h = h.map((v, i) => { const x = i % size, y = (i / size) | 0; let s = 0, c = 0; around(st, x, y, 1).forEach(p => { s += h[p.y * size + p.x]; c++; }); return s / c; });
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const v = h[y * size + x], edge = Math.min(x, y, size - 1 - x, size - 1 - y);
    let t = v + (edge < 1 ? -0.12 : 0) < 0.42 ? 'water' : 'field';
    if (t === 'field') { const r = R(); t = r < 0.25 ? 'forest' : r < 0.37 ? 'mountain' : 'field'; }
    st.tiles.push({ t, res: null, owner: -1, city: null, road: 0, build: null, ruin: false });
  }
  st.tiles.forEach((t, i) => { if (t.t === 'water') { const x = i % size, y = (i / size) | 0; if (!around(st, x, y, 1).some(p => !isWater(tile(st, p.x, p.y)))) t.t = 'ocean'; } });
  // capitals
  const spots = [];
  const cand = []; for (let y = 1; y < size - 1; y++) for (let x = 1; x < size - 1; x++) cand.push({ x, y });
  players.forEach((p, i) => {
    let best = null, bd = -1;
    for (let k = 0; k < 400; k++) { const c = cand[(R() * cand.length) | 0]; const d = spots.length ? Math.min(...spots.map(s => dist(s, c))) : Math.min(c.x, c.y, size - 1 - c.x, size - 1 - c.y) + R(); const edgeOk = Math.min(c.x, c.y, size - 1 - c.x, size - 1 - c.y) >= 2; if (edgeOk && d > bd) { bd = d; best = c; } }
    spots.push(best);
  });
  players.forEach((p, i) => {
    const tr = TRIBES[(p.tribe != null ? p.tribe : i) % TRIBES.length];
    st.players.push({ id: i, name: p.name || tr.name, tribe: tr.key, tribeName: tr.name, color: tr.color, type: p.type || 'ai', stars: 5, techs: [tr.tech], alive: true, explored: new Array(size * size).fill(0), kills: 0, special: tr.special || null, superKind: SUPER[tr.key] || 'colossus', difficulty: p.difficulty || 'normal', monuments: [], maxStars: 5, met: [i] });
    const c = spots[i];
    around(st, c.x, c.y, 1).forEach(q => { const t = tile(st, q.x, q.y); if (t.t === 'ocean' || (t.t === 'water' && R() < 0.6)) t.t = 'field'; });
    tile(st, c.x, c.y).t = 'field';
  });
  // villages
  const vill = spots.slice();
  for (let k = 0; k < size * size * 4; k++) { const c = cand[(R() * cand.length) | 0], t = tile(st, c.x, c.y); if (isWater(t) || t.t === 'mountain') continue; if (vill.every(v => dist(v, c) >= 3)) { vill.push(c); t.t = 'field'; } }
  vill.forEach((v, i) => { const id = makeCity(st, v.x, v.y, -1); if (i < players.length) captureCity(st, id, i, true); });
  // resources and ruins
  st.tiles.forEach((t, i) => {
    if (t.city != null) return; const r = R(), x = i % size, y = (i / size) | 0;
    const near = vill.some(v => dist(v, { x, y }) <= 2), m = near ? 1 : 0.35;
    if (t.t === 'field') t.res = r < 0.18 * m ? 'fruit' : r < 0.3 * m ? 'crop' : null;
    else if (t.t === 'forest') t.res = r < 0.3 * m ? 'animal' : null;
    else if (t.t === 'mountain') t.res = r < 0.25 * m ? 'ore' : null;
    else if (t.t === 'water') t.res = r < 0.35 * m ? 'fish' : null;
    else if (t.t === 'ocean') t.res = r < 0.06 ? 'whale' : null;
    if (!near && !t.res && t.t !== 'water' && R() < 0.03) t.ruin = true;
  });
  st.players.forEach((p, i) => { const c = st.cities[firstCity(st, i)]; spawnUnit(st, i, 'warrior', c.x, c.y, c.id, false); reveal(st, i, c.x, c.y, 2); });
  startTurn(st);
  return st;
}
function firstCity(st, pid) { return Object.keys(st.cities).find(k => st.cities[k].owner === pid); }
function makeCity(st, x, y, owner) {
  const id = st.nextId++; const name = CITY_NAMES[(id * 7) % CITY_NAMES.length] + (id > CITY_NAMES.length ? ' ' + id : '');
  st.cities[id] = { id, x, y, owner, level: 1, pop: 0, name, capital: false, wall: false, workshop: 0, park: 0, radius: 1 };
  const t = tile(st, x, y); t.city = id; t.res = null; t.ruin = false; t.road = 1; return id;
}
function claimTerritory(st, c) { around(st, c.x, c.y, c.radius).forEach(p => { const t = tile(st, p.x, p.y); if (t.owner === -1 || t.owner === c.id) t.owner = c.id; }); }
function captureCity(st, cid, pid, cap) {
  const c = st.cities[cid], prev = c.owner; c.owner = pid; if (cap) c.capital = true; else if (prev >= 0) c.capital = false;
  claimTerritory(st, c); reveal(st, pid, c.x, c.y, 2);
  if (prev >= 0 && !Object.values(st.cities).some(k => k.owner === prev)) eliminate(st, prev, pid);
}
function eliminate(st, pid, by) {
  const p = st.players[pid]; p.alive = false; Object.values(st.units).forEach(u => { if (u.owner === pid) delete st.units[u.id]; });
  log(st, `${p.name} has been eliminated${by != null ? ' by ' + st.players[by].name : ''}!`); checkWin(st);
}
function checkWin(st) {
  const alive = st.players.filter(p => p.alive);
  if (alive.length === 1) { st.over = true; st.winner = alive[0].id; log(st, `${alive[0].name} wins!`); }
}
function log(st, m) { st.log.push({ turn: st.turn, m }); if (st.log.length > 60) st.log.shift(); }
function spawnUnit(st, pid, kind, x, y, home, acted) {
  const d = UNITS[kind]; const id = st.nextId++;
  st.units[id] = { id, kind, owner: pid, x, y, hp: d.hp, maxHp: d.hp, home, moved: !!acted, attacked: !!acted, kills: 0, vet: false, boat: null };
  reveal(st, pid, x, y, 1); return st.units[id];
}
function has(st, pid, tech) { return tech == null || st.players[pid].techs.includes(tech); }
function stats(st, u) { const b = UNITS[u.kind];  if (u.wading) return Object.assign({}, b, { m: Math.max(b.m, 2) }); if (u.boat) { const s = BOATS[u.boat]; return Object.assign({}, b, s, { dash: 1 }); } return b; }
function unitAt(st, x, y) { for (const k in st.units) { const u = st.units[k]; if (u.x === x && u.y === y) return u; } return null; }
function reveal(st, pid, x, y, r) { const P = st.players[pid]; around(st, x, y, r).forEach(p => { P.explored[idx(st, p.x, p.y)] = 1; const t = tile(st, p.x, p.y);
  const o = t.city != null ? st.cities[t.city].owner : -1; if (o >= 0 && P.met && !P.met.includes(o)) { P.met.push(o); st.players[o].met.push(pid); }
  const u = unitAt(st, p.x, p.y); if (u && P.met && !P.met.includes(u.owner)) { P.met.push(u.owner); st.players[u.owner].met.push(pid); } }); }
function monumentsReady(st, pid) {
  const P = st.players[pid], cities = Object.values(st.cities).filter(c => c.owner === pid).length, ex = P.explored.reduce((a, b) => a + b, 0) / P.explored.length;
  const ok = { wisdom: P.techs.length >= 15, war: P.kills >= 10, empire: cities >= 5, explorer: ex >= 0.8, wealth: P.maxStars >= 60 };
  return Object.keys(MONUMENTS).filter(k => ok[k] && !P.monuments.includes(k));
}
function visionOf(st, u) { return tile(st, u.x, u.y).t === 'mountain' ? 2 : 1; }

function techCost(st, pid, tech) {
  const n = Object.values(st.cities).filter(c => c.owner === pid).length;
  let c = TECHS[tech].tier * n + 4; if (has(st, pid, 'philosophy')) c = Math.ceil(c * 0.67); return c;
}
function canResearch(st, pid, tech) { const T = TECHS[tech]; return T && !has(st, pid, tech) && (T.req == null || has(st, pid, T.req)); }
function income(st, pid) {
  let s = has(st, pid, 'diplomacy') ? Object.keys(st.peace || {}).filter(k => k.split('-').includes(String(pid))).length : 0; Object.values(st.cities).forEach(c => { if (c.owner === pid) s += c.level + c.workshop + c.park + (c.capital ? 1 : 0) + (has(st, pid, 'trade') ? 1 : 0); }); return s;
}
function cityUnits(st, cid) { return Object.values(st.units).filter(u => u.home === cid).length; }

// Movement: Dijkstra with move points; forest/mountain end movement unless road; enemy adjacency (zone of control) stops.
function moveCostInfo(st, u, from, to) {
  const t = tile(st, to.x, to.y), f = tile(st, from.x, from.y), pid = u.owner;
  const s = stats(st, u);
  if (unitAt(st, to.x, to.y) || t.t === 'unknown') return null;
  if (u.boat) {
    if (!isWater(t)) return { cost: 99, stop: 1, land: 1 }; // disembark
    if (t.t === 'ocean' && u.boat === 'raft') return null;
    return { cost: 1 };
  }
  const sp = st.players[pid].special;
  if (sp === 'aqua' && t.t === 'water' && !UNITS[u.kind].sup) return { cost: 1 };
  if (sp === 'aqua' && t.t === 'water') return { cost: 1 };
  if (isWater(t)) { if (t.build === 'port' && t.owner >= 0 && st.cities[t.owner].owner === pid) return { cost: 99, stop: 1 }; return null; }
  if (t.t === 'mountain' && !has(st, pid, 'climbing')) return null;
  if (f.road && t.road) return { cost: 0.5 };
  if (t.t === 'forest' && sp === 'forest') return { cost: 1 };
  if (t.t === 'forest' || t.t === 'mountain') return { cost: 99, stop: 1 };
  return { cost: 1 };
}
function zoc(st, u, p) { return around(st, p.x, p.y, 1).some(q => { const e = unitAt(st, q.x, q.y); return e && e.owner !== u.owner; }); }
function reachable(st, u) {
  const s = stats(st, u); if (u.moved) return [];
  const best = {}; const out = []; const q = [{ x: u.x, y: u.y, mp: s.m }]; best[idx(st, u.x, u.y)] = s.m;
  while (q.length) {
    q.sort((a, b) => b.mp - a.mp); const c = q.shift();
    if (c.x !== u.x || c.y !== u.y) { if (zoc(st, u, c) || c.stop) continue; }
    for (const n of around(st, c.x, c.y, 1)) {
      if (n.x === c.x && n.y === c.y) continue;
      const info = moveCostInfo(st, u, c, n); if (!info) continue;
      const mp = info.cost >= 99 ? 0 : c.mp - info.cost; if (info.cost < 99 && mp < 0) continue;
      const k = idx(st, n.x, n.y); if (best[k] != null && best[k] >= mp) continue;
      if (best[k] == null) out.push(n); best[k] = mp; q.push({ x: n.x, y: n.y, mp, stop: info.stop || mp <= 0 });
    }
  }
  return out;
}
function defBonus(st, u) {
  const t = tile(st, u.x, u.y), p = u.owner;
  if (t.city != null && st.cities[t.city].owner === p) return st.cities[t.city].wall ? 4 : 1.5;
  if (t.t === 'forest' && has(st, p, 'archery')) return 1.5;
  if (t.t === 'mountain' && has(st, p, 'climbing')) return 1.5;
  if (isWater(t) && has(st, p, 'aquatism')) return 1.5;
  return 1;
}
function combatPreview(st, a, d) {
  const sa = stats(st, a), sd = stats(st, d);
  const af = sa.a * (a.hp / a.maxHp), df = sd.d * (d.hp / d.maxHp) * defBonus(st, d), tot = af + df;
  const dmg = Math.round(af / tot * sa.a * 4.5);
  const ret = d.hp - dmg > 0 && dist(a, d) <= sd.r ? Math.round(df / tot * sd.d * 4.5) : 0;
  return { dmg, ret };
}
function targets(st, u) {
  const s = stats(st, u); if (u.attacked || (u.moved && !s.dash)) return [];
  if (s.a <= 0 && !s.convert) return [];
  return Object.values(st.units).filter(e => e.owner !== u.owner && !atPeace(st, u.owner, e.owner) && dist(u, e) <= s.r && st.players[u.owner].explored[idx(st, e.x, e.y)] && visibleTo(st, u.owner, e.x, e.y));
}
function pkey(a, b) { return a < b ? a + '-' + b : b + '-' + a; }
function atPeace(st, a, b) { return !!(st.peace && st.peace[pkey(a, b)]); }
function met(st, a, b) { return st.players[a].met.includes(b); }
function visibleTo(st, pid, x, y) {
  return Object.values(st.units).some(u => u.owner === pid && dist(u, { x, y }) <= visionOf(st, u)) || Object.values(st.cities).some(c => c.owner === pid && dist(c, { x, y }) <= c.radius + 0);
}

function startTurn(st) {
  const p = st.players[st.current];
  if (st.turn !== 1) p.stars += income(st, p.id) + (p.type === 'ai' ? DIFF[p.difficulty || 'normal'].bonus : 0);
  Object.values(st.units).forEach(u => { if (u.owner === p.id) { u.moved = false; u.attacked = false; u.healed = false; u.fresh = false; } });
}
function endTurn(st) {
  if (st.over) return;
  const n = st.players.length; let i = st.current;
  do { i = (i + 1) % n; if (i === 0) st.turn++; } while (!st.players[i].alive);
  st.current = i;
  if (st.mode === 'score' && st.turn > st.maxTurns) { st.over = true; const sc = st.players.map(p => score(st, p.id)); let w = 0; sc.forEach((s, k) => { if (s > sc[w]) w = k; }); st.winner = w; log(st, `Time up! ${st.players[w].name} wins with ${sc[w]} points.`); return; }
  startTurn(st);
}
function score(st, pid) {
  const p = st.players[pid]; if (!p.alive) return 0; if (p.score != null && !p.explored.length) return p.score;
  let s = p.explored.reduce((a, b) => a + b, 0) * 5;
  Object.values(st.cities).forEach(c => { if (c.owner === pid) s += 100 + c.level * 50 + c.pop * 5 + (c.wall ? 20 : 0) + (c.park * 250); });
  Object.values(st.units).forEach(u => { if (u.owner === pid) s += (UNITS[u.kind].cost || 10) * 5; });
  p.techs.forEach(t => s += TECHS[t].tier * 100); s += (p.monuments || []).length * 400;
  return s;
}
function addPop(st, cid, n) {
  const c = st.cities[cid]; c.pop += n;
  while (c.pop >= c.level + 1) { c.pop -= c.level + 1; c.level++; st.pendingLevel.push({ city: cid, level: c.level }); log(st, `${c.name} grew to level ${c.level}.`); }
  while (c.pop < 0 && c.level > 1) { c.level--; c.pop += c.level + 1; }
}
const LEVEL_CHOICES = { 2: ['workshop', 'explorer'], 3: ['wall', 'stars'], 4: ['pop', 'border'] };
function levelChoices(lv) { return LEVEL_CHOICES[lv] || ['park', 'colossus']; }
const CHOICE_DESC = { workshop: 'Workshop (+1 star/turn)', explorer: 'Explorer (reveal land)', wall: 'City Wall (x4 defense)', stars: '+5 stars', pop: '+3 population', border: 'Border growth', park: 'Park (+1 star, +250 score)', colossus: 'Super unit (tribe-specific)' };

function cityOfTile(st, x, y) { const t = tile(st, x, y); return t.owner >= 0 ? st.cities[t.owner] : null; }
function worksAt(st, pid, x, y) {
  const t = tile(st, x, y), c = cityOfTile(st, x, y); const out = [];
  if (!c || c.owner !== pid || t.city != null || !st.players[pid].explored[idx(st, x, y)]) return out;
  for (const k in WORKS) {
    const w = WORKS[k]; if (!has(st, pid, w.tech)) continue;
    if (w.res && t.res !== w.res) continue; if (w.ter && t.t !== w.ter) continue;
    if (w.build && t.build) continue; if ((k === 'lumber' || k === 'temple' || k === 'grow' || k === 'port' || k === 'shrine') && (t.res || t.build)) continue;
    if ((k === 'clear' || k === 'burn') && t.build) continue;
    if (k === 'road' && (t.road || isWater(t))) continue;
    if (w.adj && (t.res || t.build)) continue;
    out.push(k);
  }
  if (t.t === 'field' && !t.res && !t.build) monumentsReady(st, pid).forEach(m => out.push('monument:' + m));
  return out;
}

// apply(action) -> {ok, err}
function apply(st, pid, a) { const r = apply0(st, pid, a); if (st.players[pid]) st.players[pid].maxStars = Math.max(st.players[pid].maxStars || 0, st.players[pid].stars); return r; }
function apply0(st, pid, a) {
  if (!a || typeof a.type !== 'string') return { ok: false, err: 'Bad action' };
  if (st.over) return { ok: false, err: 'Game over' };
  if (st.pendingLevel.length && a.type !== 'levelChoice') { const pl = st.pendingLevel[0]; if (st.cities[pl.city].owner === pid) return { ok: false, err: 'Choose city reward first' }; st.pendingLevel.shift(); }
  if (pid !== st.current) return { ok: false, err: 'Not your turn' };
  const P = st.players[pid]; const u = a.unit != null ? st.units[a.unit] : null;
  if (a.unit != null && (!u || u.owner !== pid)) return { ok: false, err: 'Bad unit' };
  switch (a.type) {
    case 'endTurn': endTurn(st); return { ok: true };
    case 'move': {
      if (!reachable(st, u).some(p => p.x === a.x && p.y === a.y)) return { ok: false, err: 'Cannot move there' };
      const t = tile(st, a.x, a.y), s = stats(st, u);
      u.x = a.x; u.y = a.y; u.moved = true; if (!s.dash) u.attacked = true;
      if (u.boat && !isWater(t)) { u.boat = null; u.attacked = true; }
      else if (!u.boat && isWater(t) && t.build === 'port') { u.boat = 'raft'; u.attacked = true; u.wading = false; }
      else if (!u.boat) u.wading = isWater(t);
      if (u.escapeLeft) { u.escapeLeft = false; u.attacked = true; }
      reveal(st, pid, u.x, u.y, visionOf(st, u)); return { ok: true };
    }
    case 'attack': {
      const d = st.units[a.target]; if (!d || !targets(st, u).includes(d)) return { ok: false, err: 'Invalid target' };
      const s = stats(st, u);
      if (s.convert) { d.owner = pid; d.moved = d.attacked = true; d.home = null; u.attacked = u.moved = true; log(st, `${P.name} converted a ${UNITS[d.kind].name}.`); return { ok: true }; }
      const r = combatPreview(st, u, d); d.hp -= r.dmg; u.moved = true; u.attacked = true;
      if (d.hp <= 0) {
        const dx = d.x, dy = d.y; delete st.units[d.id]; u.kills++; P.kills++;
        if (u.kills >= 3 && !u.vet) { u.vet = true; u.maxHp += 5; u.hp = u.maxHp; }
        if (s.r === 1 && !u.boat && moveCostInfo(st, u, u, { x: dx, y: dy }) && !isWater(tile(st, dx, dy))) { u.x = dx; u.y = dy; reveal(st, pid, dx, dy, 1); }
        if (s.persist) { u.attacked = false; }
      } else { u.hp -= r.ret; if (u.hp <= 0) { delete st.units[u.id]; return { ok: true }; } }
      if (s.escape && st.units[u.id]) { u.moved = false; u.escapeLeft = true; }
      return { ok: true };
    }
    case 'capture': {
      const t = tile(st, u.x, u.y); if (t.city == null) return { ok: false, err: 'No city' };
      const c = st.cities[t.city]; if (c.owner === pid || u.moved || u.attacked) return { ok: false, err: 'Cannot capture now' };
      if (c.owner >= 0 && atPeace(st, pid, c.owner)) return { ok: false, err: 'You are at peace with this tribe' };
      captureCity(st, c.id, pid, false); u.moved = u.attacked = true; log(st, `${P.name} captured ${c.name}.`);
      if (!Object.values(st.cities).some(k => k.capital && k.owner === pid) && false) c.capital = true; return { ok: true };
    }
    case 'explore': {
      const t = tile(st, u.x, u.y); if (!t.ruin || u.attacked) return { ok: false, err: 'No ruin' };
      t.ruin = false; u.moved = u.attacked = true; const R = rng(st.seed + st.turn * 31 + u.x * 7 + u.y), r = R();
      let m;
      if (r < 0.3) { P.stars += 10; m = '10 stars'; }
      else if (r < 0.5) { const opts = Object.keys(TECHS).filter(k => canResearch(st, pid, k)); if (opts.length) { const k = opts[(R() * opts.length) | 0]; P.techs.push(k); m = 'the secret of ' + TECHS[k].name; } else { P.stars += 10; m = '10 stars'; } }
      else if (r < 0.7) { const cs = Object.values(st.cities).filter(c => c.owner === pid); if (cs.length) { addPop(st, cs[0].id, 3); m = 'new citizens (+3 pop)'; } else { P.stars += 10; m = '10 stars'; } }
      else if (r < 0.85) { reveal(st, pid, u.x, u.y, 4); m = 'an ancient map'; }
      else { const spot = around(st, u.x, u.y, 1).find(p => !unitAt(st, p.x, p.y) && !isWater(tile(st, p.x, p.y)) && (tile(st, p.x, p.y).t !== 'mountain' || has(st, pid, 'climbing'))); if (spot) { const v = spawnUnit(st, pid, 'swordsman', spot.x, spot.y, null, true); v.vet = true; v.maxHp += 5; v.hp = v.maxHp; m = 'a veteran swordsman'; } else { P.stars += 10; m = '10 stars'; } }
      log(st, `${P.name} explored ruins and found ${m}.`); return { ok: true, msg: m };
    }
    case 'heal': {
      if (u.moved || u.attacked) return { ok: false, err: 'Unit already acted' };
      const c = cityOfTile(st, u.x, u.y); u.hp = Math.min(u.maxHp, u.hp + (c && c.owner === pid ? 4 : 2)); u.moved = u.attacked = true; return { ok: true };
    }
    case 'healOthers': {
      if (u.kind !== 'mindbender' || u.attacked) return { ok: false, err: 'Cannot' };
      around(st, u.x, u.y, 1).forEach(p => { const f = unitAt(st, p.x, p.y); if (f && f.owner === pid && f !== u) f.hp = Math.min(f.maxHp, f.hp + 4); }); u.moved = u.attacked = true; return { ok: true };
    }
    case 'promote': {
      const pr = PROMOTE[u.kind]; if (!pr || u.boat) return { ok: false, err: 'No upgrade path' }; if (!has(st, pid, pr.tech)) return { ok: false, err: 'Requires ' + TECHS[pr.tech].name };
      if (u.moved || u.attacked) return { ok: false, err: 'Unit already acted' }; const c = cityOfTile(st, u.x, u.y); if (!c || c.owner !== pid) return { ok: false, err: 'Must be in your territory' };
      if (P.stars < pr.cost) return { ok: false, err: 'Not enough stars' }; P.stars -= pr.cost; const nd = UNITS[pr.to], ratio = u.hp / u.maxHp;
      u.kind = pr.to; u.maxHp = nd.hp + (u.vet ? 5 : 0); u.hp = Math.max(1, Math.round(u.maxHp * ratio)); u.moved = u.attacked = true; return { ok: true };
    }
    case 'upgrade': {
      const up = u.boat && SHIP_UP[u.boat]; if (!up) return { ok: false, err: 'Cannot upgrade' }; if (!has(st, pid, up.tech)) return { ok: false, err: 'Requires ' + TECHS[up.tech].name };
      if (P.stars < up.cost) return { ok: false, err: 'Not enough stars' }; P.stars -= up.cost; u.boat = up.to; u.moved = u.attacked = true; return { ok: true };
    }
    case 'proposePeace': {
      const o = a.to | 0; if (!st.players[o] || o === pid || !st.players[o].alive || !met(st, pid, o) || atPeace(st, pid, o)) return { ok: false, err: 'Cannot propose' };
      if (!st.offers.some(f => f.from === pid && f.to === o)) st.offers.push({ from: pid, to: o, turn: st.turn }); log(st, `${P.name} proposed peace to ${st.players[o].name}.`); return { ok: true };
    }
    case 'acceptPeace': {
      const i = st.offers.findIndex(f => f.from === (a.from | 0) && f.to === pid); if (i < 0) return { ok: false, err: 'No such offer' };
      st.offers.splice(i, 1); st.peace[pkey(pid, a.from | 0)] = st.turn; log(st, `${P.name} and ${st.players[a.from | 0].name} signed a peace treaty.`); return { ok: true };
    }
    case 'rejectPeace': { st.offers = st.offers.filter(f => !(f.from === (a.from | 0) && f.to === pid)); return { ok: true }; }
    case 'declareWar': { const o = a.to | 0; if (!atPeace(st, pid, o)) return { ok: false, err: 'Not at peace' }; delete st.peace[pkey(pid, o)]; log(st, `${P.name} declared war on ${st.players[o].name}!`); return { ok: true }; }
    case 'disband': { delete st.units[u.id]; P.stars += Math.floor((UNITS[u.kind].cost || 0) / 2); return { ok: true }; }
    case 'train': {
      const c = st.cities[a.city], d = UNITS[a.kind]; if (!c || c.owner !== pid || !d || d.tech === 'none') return { ok: false, err: 'Bad city/unit' };
      if (!has(st, pid, d.tech)) return { ok: false, err: 'Tech required' }; if (P.stars < d.cost) return { ok: false, err: 'Not enough stars' };
      if (unitAt(st, c.x, c.y)) return { ok: false, err: 'City tile occupied' }; if (cityUnits(st, c.id) >= c.level + 1) return { ok: false, err: 'City unit limit reached' };
      P.stars -= d.cost; spawnUnit(st, pid, a.kind, c.x, c.y, c.id, true); return { ok: true };
    }
    case 'research': {
      if (!canResearch(st, pid, a.tech)) return { ok: false, err: 'Cannot research' }; const cost = techCost(st, pid, a.tech);
      if (P.stars < cost) return { ok: false, err: 'Not enough stars' }; P.stars -= cost; P.techs.push(a.tech);
      if (a.tech === 'diplomacy') Object.values(st.cities).forEach(c => { if (c.capital) reveal(st, pid, c.x, c.y, 1); });
      return { ok: true };
    }
    case 'work': {
      if (!worksAt(st, pid, a.x, a.y).includes(a.kind)) return { ok: false, err: 'Not available' };
      const t = tile(st, a.x, a.y);
      if (a.kind.startsWith('monument:')) { const m = a.kind.slice(9); t.build = 'monument'; t.monument = m; P.monuments.push(m); addPop(st, cityOfTile(st, a.x, a.y).id, 3); log(st, `${P.name} raised the ${MONUMENTS[m].name}.`); return { ok: true }; }
      const w = WORKS[a.kind]; if (P.stars < w.cost) return { ok: false, err: 'Not enough stars' };
      P.stars -= w.cost; const c = cityOfTile(st, a.x, a.y);
      if (w.res) t.res = null; if (w.build) t.build = w.build; if (w.to) { t.t = w.to; t.res = w.newres || null; }
      if (w.road) t.road = 1; if (w.stars) P.stars += w.stars; if (w.pop) addPop(st, c.id, w.pop);
      if (w.adj) { const n = around(st, a.x, a.y, 1).filter(q => { const tt = tile(st, q.x, q.y); const cc = cityOfTile(st, q.x, q.y); return tt.build === w.adj && cc && cc.owner === pid; }).length; if (n) addPop(st, c.id, n * w.per); }
      if (FEEDS[w.build]) around(st, a.x, a.y, 1).forEach(q => { const tt = tile(st, q.x, q.y), cc = cityOfTile(st, q.x, q.y); if (tt.build === FEEDS[w.build] && cc && cc.owner === pid) addPop(st, cc.id, WORKS[FEEDS[w.build]].per); });
      return { ok: true };
    }
    case 'levelChoice': {
      const pl = st.pendingLevel[0]; if (!pl || st.cities[pl.city].owner !== pid) return { ok: false, err: 'No pending reward' };
      const ch = levelChoices(pl.level); if (!ch.includes(a.choice)) return { ok: false, err: 'Bad choice' };
      st.pendingLevel.shift(); const c = st.cities[pl.city];
      switch (a.choice) {
        case 'workshop': c.workshop = 1; break; case 'explorer': reveal(st, pid, c.x, c.y, 4); break;
        case 'wall': c.wall = true; break; case 'stars': P.stars += 5; break;
        case 'pop': addPop(st, c.id, 3); break; case 'border': c.radius = 2; claimTerritory(st, c); reveal(st, pid, c.x, c.y, 3); break;
        case 'park': c.park++; break;
        case 'colossus': { const spot = [{ x: c.x, y: c.y }].concat(around(st, c.x, c.y, 1)).find(p => !unitAt(st, p.x, p.y) && !isWater(tile(st, p.x, p.y))); if (spot) spawnUnit(st, pid, P.superKind || 'colossus', spot.x, spot.y, null, true); break; }
      }
      return { ok: true };
    }
  }
  return { ok: false, err: 'Unknown action' };
}

// ---------- AI ----------
function strength(st, pid) { let s = 0; Object.values(st.units).forEach(u => { if (u.owner === pid) s += (UNITS[u.kind].cost || 12) * u.hp / u.maxHp; }); Object.values(st.cities).forEach(c => { if (c.owner === pid) s += c.level * 3; }); return s; }
function aiTurn(st) {
  const pid = st.current, P = st.players[pid], D = DIFF[P.difficulty || 'normal'], smart = P.difficulty === 'hard' || P.difficulty === 'crazy';
  const R = rng(st.seed * 13 + st.turn * 101 + pid * 7 + (st.nextId | 0)); let guard = 0;
  const act = a => apply(st, pid, a).ok;
  const resolveLevels = () => { while (st.pendingLevel.length && st.cities[st.pendingLevel[0].city].owner === pid) { const ch = levelChoices(st.pendingLevel[0].level); const pick = smart ? { 2: 'workshop', 3: 'wall', 4: 'pop' }[st.pendingLevel[0].level] || 'colossus' : ch[ch[0] === 'explorer' || ch[0] === 'park' ? 1 : 0]; act({ type: 'levelChoice', choice: pick }); } };
  resolveLevels();
  const myCities = () => Object.values(st.cities).filter(c => c.owner === pid);
  // Diplomacy
  const mine = strength(st, pid);
  for (const f of st.offers.filter(f => f.to === pid)) { const ratio = strength(st, f.from) / Math.max(1, mine); (ratio > 1.2 || (!smart && R() < 0.5)) ? act({ type: 'acceptPeace', from: f.from }) : act({ type: 'rejectPeace', from: f.from }); }
  for (const o of P.met) { if (o === pid || !st.players[o].alive) continue; const ratio = strength(st, o) / Math.max(1, mine);
    const allPeace = st.players.every(q => q.id === pid || !q.alive || atPeace(st, pid, q.id));
    if (atPeace(st, pid, o)) { const age = st.turn - st.peace[pkey(pid, o)]; if ((ratio < (smart ? 0.6 : 0.4) && age > 5) || (allPeace && age > 8 && ratio < 1.2)) act({ type: 'declareWar', to: o }); }
    else if (ratio > 1.5 && R() < 0.3 && st.players.filter(q => q.alive).length > 2) act({ type: 'proposePeace', to: o }); }
  // Economy
  const skip = smart ? ['clear', 'grow', 'burn', 'road'] : ['road', 'clear', 'grow', 'temple', 'shrine', 'burn', 'windmill', 'sawmill', 'forge'];
  for (const c of myCities()) for (const p of around(st, c.x, c.y, c.radius)) for (const k of worksAt(st, pid, p.x, p.y)) {
    if (skip.includes(k)) continue; if (k === 'port' && R() < 0.7) continue;
    const cost = k.startsWith('monument:') ? 0 : WORKS[k].cost; if (P.stars >= cost + 2) { act({ type: 'work', kind: k, x: p.x, y: p.y }); resolveLevels(); }
  }
  const want = smart ? ['organization', 'hunting', 'riding', 'climbing', 'fishing', 'archery', 'farming', 'strategy', 'mining', 'forestry', 'smithery', 'roads', 'freespirit', 'chivalry', 'mathematics', 'construction', 'sailing', 'philosophy', 'whaling', 'meditation', 'navigation', 'diplomacy', 'trade', 'aquatism', 'spiritualism']
    : ['organization', 'hunting', 'fishing', 'climbing', 'riding', 'archery', 'farming', 'mining', 'strategy', 'forestry', 'smithery', 'mathematics', 'roads', 'freespirit', 'chivalry', 'sailing', 'whaling', 'meditation', 'philosophy', 'navigation'];
  if (P.stars > 8) for (const t of want) if (canResearch(st, pid, t) && P.stars - techCost(st, pid, t) >= 3) { act({ type: 'research', tech: t }); break; }
  const enemyNear = c => Object.values(st.units).some(e => e.owner !== pid && !atPeace(st, pid, e.owner) && dist(e, c) <= 3);
  if (smart) coordinate(st, pid, act);
  // smart AI picks a single focus city for all attackers
  let focus = null; if (smart) { const cap = myCities()[0]; const ens = Object.values(st.cities).filter(c => c.owner >= 0 && c.owner !== pid && !atPeace(st, pid, c.owner) && P.explored[idx(st, c.x, c.y)]); if (cap && ens.length) focus = ens.sort((a, b) => dist(a, cap) - dist(b, cap))[0]; }
  for (const u of Object.values(st.units).filter(u => u.owner === pid)) {
    if (!st.units[u.id] || ++guard > 300) continue;
    const t = tile(st, u.x, u.y);
    if (t.city != null && st.cities[t.city].owner !== pid && !u.moved && !(st.cities[t.city].owner >= 0 && atPeace(st, pid, st.cities[t.city].owner))) { act({ type: 'capture', unit: u.id }); resolveLevels(); continue; }
    if (t.ruin && !u.attacked) { act({ type: 'explore', unit: u.id }); continue; }
    if (smart && PROMOTE[u.kind] && !u.boat && !u.moved && has(st, pid, PROMOTE[u.kind].tech) && P.stars >= PROMOTE[u.kind].cost + 6) { const cc = cityOfTile(st, u.x, u.y); if (cc && cc.owner === pid && !enemyNear(u)) { act({ type: 'promote', unit: u.id }); continue; } }
    if (u.boat && SHIP_UP[u.boat] && has(st, pid, SHIP_UP[u.boat].tech) && P.stars >= SHIP_UP[u.boat].cost + 5 && smart && !u.moved) { act({ type: 'upgrade', unit: u.id }); continue; }
    // garrison: hard AI keeps a unit in threatened cities
    if (smart && t.city != null && st.cities[t.city].owner === pid && enemyNear(u) && u.hp > u.maxHp / 2) { const tg = targets(st, u).map(e => ({ e, r: combatPreview(st, u, e) })).filter(x => x.r.dmg >= x.e.hp); if (tg.length) act({ type: 'attack', unit: u.id, target: tg[0].e.id }); else if (u.hp < u.maxHp) act({ type: 'heal', unit: u.id }); continue; }
    const good = x => x.r.dmg >= x.e.hp || (smart ? x.r.dmg - x.r.ret > 0 && x.r.ret < u.hp - 1 : x.r.ret < u.hp - 2);
    let tg = targets(st, u).map(e => ({ e, r: combatPreview(st, u, e) })).sort((a, b) => (b.r.dmg >= b.e.hp) - (a.r.dmg >= a.e.hp) || (b.r.dmg - b.r.ret) - (a.r.dmg - a.r.ret));
    if (tg.length && good(tg[0]) && R() < D.aggr) { act({ type: 'attack', unit: u.id, target: tg[0].e.id }); if (!st.units[u.id]) continue; }
    if (u.hp < u.maxHp * (smart ? 0.5 : 0.4) && !u.moved && !u.attacked) { act({ type: 'heal', unit: u.id }); continue; }
    const goals = [];
    Object.values(st.cities).forEach(c => { if (c.owner !== pid && P.explored[idx(st, c.x, c.y)] && !(c.owner >= 0 && atPeace(st, pid, c.owner))) goals.push({ x: c.x, y: c.y, w: c.owner === -1 ? 0 : (smart ? 1 : 3) }); });
    Object.values(st.units).forEach(e => { if (e.owner !== pid && !atPeace(st, pid, e.owner) && visibleTo(st, pid, e.x, e.y)) goals.push({ x: e.x, y: e.y, w: 2 }); });
    if (focus) goals.push({ x: focus.x, y: focus.y, w: -1 });
    st.tiles.forEach((tt, i) => { if (tt.ruin && P.explored[i]) goals.push({ x: i % st.w, y: (i / st.w) | 0, w: 1 }); });
    if (!goals.length || R() < 0.25) for (let i = 0; i < st.tiles.length; i++) if (!P.explored[i]) goals.push({ x: i % st.w, y: (i / st.w) | 0, w: 6 });
    const opts = reachable(st, u); if (!opts.length) continue;
    let best = null, bv = Infinity; const cur = goals.length ? Math.min(...goals.map(g => dist(u, g) + g.w)) : 0;
    for (const o of opts) { const v = goals.length ? Math.min(...goals.map(g => dist(o, g) + g.w)) : R(); const tt = tile(st, o.x, o.y);
      const danger = smart ? Object.values(st.units).filter(e => e.owner !== pid && !atPeace(st, pid, e.owner) && dist(e, o) <= stats(st, e).r + 1).length * 0.3 : 0;
      const vv = v + danger + (tt.city != null && st.cities[tt.city].owner !== pid ? -3 : 0) + R() * 0.3; if (vv < bv) { bv = vv; best = o; } }
    if (best && bv < cur + 0.5) act({ type: 'move', unit: u.id, x: best.x, y: best.y });
    const t2 = targets(st, u).map(e => ({ e, r: combatPreview(st, u, e) })).filter(good);
    if (t2.length && R() < D.aggr) act({ type: 'attack', unit: u.id, target: t2[0].e.id });
  }
  for (const c of myCities()) {
    const threatened = enemyNear(c);
    const kinds = Object.keys(UNITS).filter(k => UNITS[k].tech !== 'none' && has(st, pid, UNITS[k].tech) && k !== 'mindbender').sort((a, b) => UNITS[b].cost - UNITS[a].cost);
    let k = smart && threatened && has(st, pid, 'strategy') && P.stars >= 3 ? 'defender' : kinds.find(k => P.stars >= UNITS[k].cost + (myCities().length < 3 ? 0 : 3));
    if (k && R() < (P.difficulty === 'easy' ? 0.5 : 0.9)) act({ type: 'train', city: c.id, kind: k });
  }
  resolveLevels();
  if (!st.over) act({ type: 'endTurn' });
}
// Coordinated focus fire: if several units together can kill a target, attack in order (ranged/weak-retaliation first).
function coordinate(st, pid, act) {
  const mine = Object.values(st.units).filter(u => u.owner === pid);
  const enemies = Object.values(st.units).filter(e => e.owner !== pid && !atPeace(st, pid, e.owner) && visibleTo(st, pid, e.x, e.y));
  let n = 0;
  for (const e of enemies.sort((a, b) => a.hp - b.hp)) {
    const atk = mine.filter(u => st.units[u.id] && targets(st, u).includes(e));
    if (atk.length < 2) continue;
    let hp = e.hp; const order = atk.map(u => ({ u, r: combatPreview(st, u, e) })).sort((a, b) => (stats(st, b.u).r - stats(st, a.u).r) || (a.r.ret - b.r.ret));
    for (const o of order) hp -= o.r.dmg; if (hp > 0) continue; // not lethal together
    for (const o of order) { if (!st.units[e.id]) break; if (!st.units[o.u.id] || !targets(st, o.u).includes(e)) continue; act({ type: 'attack', unit: o.u.id, target: e.id }); n++; }
  }
  return n;
}
function runAI(st, max) { let n = 0; while (!st.over && st.players[st.current].type === 'ai' && n++ < (max || 50)) aiTurn(st); }
// Fog-filtered view for one player (server sends only this online)
function viewFor(st, pid) {
  const v = JSON.parse(JSON.stringify(st)), P = st.players[pid], E = P.explored;
  v.tiles = v.tiles.map((t, i) => E[i] ? t : { t: 'unknown', res: null, owner: -1, city: null, road: 0, build: null, ruin: false });
  const keep = {}; v.tiles.forEach(t => { if (t.city != null) keep[t.city] = 1; if (t.owner >= 0) keep[t.owner] = 1; });
  for (const k in v.cities) if (!keep[k]) delete v.cities[k];
  for (const k in v.units) { const u = v.units[k]; if (u.owner !== pid && !visibleTo(st, pid, u.x, u.y)) delete v.units[k]; }
  v.players = v.players.map((p, i) => i === pid ? p : { id: p.id, name: p.name, tribe: p.tribe, tribeName: p.tribeName, color: p.color, type: p.type, alive: p.alive, techs: P.met.includes(i) ? p.techs : [], stars: null, explored: [], kills: p.kills, special: p.special, monuments: p.monuments, met: p.met, difficulty: p.difficulty, score: st.over ? score(st, i) : null });
  v.players[pid].score = score(st, pid);
  if (!st.over) { const sc = st.players.map((q, i) => ({ i, s: score(st, i) })).sort((a, b) => b.s - a.s); v.players[pid].rank = sc.findIndex(x => x.i === pid) + 1; }
  v.pendingLevel = v.pendingLevel.filter(l => st.cities[l.city].owner === pid);
  v.offers = v.offers.filter(f => f.from === pid || f.to === pid); v.seed = 0; v.fogged = pid;
  return v;
}

const api = { PROMOTE, coordinate, viewFor, atPeace, met, monumentsReady, MONUMENTS, SUPER, SHIP_UP, DIFF, strength, TRIBES, TECHS, TECH_DESC, UNITS, BOATS, WORKS, CHOICE_DESC, newGame, apply, reachable, targets, combatPreview, techCost, canResearch, income, score, worksAt, tile, unitAt, stats, levelChoices, cityUnits, visibleTo, aiTurn, runAI, has, dist, isWater, cityOfTile };
if (typeof module !== 'undefined') module.exports = api; else root.Game = api;
})(this);
