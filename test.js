const assert = require('assert'), G = require('./public/game.js'), fs = require('fs');
let passed = 0; const T = (name, fn) => { fn(); passed++; console.log('  ✓ ' + name); };
const clearAround = (st, x, y) => { const t = G.tile(st, x, y); t.t = 'field'; t.res = null; t.build = null; t.city = null; t.ruin = false; };
const firstUnit = (st, pid) => Object.values(st.units).find(u => u.owner === pid);
const capital = (st, pid) => Object.values(st.cities).find(c => c.owner === pid);
console.log('Game logic');
T('new game setup', () => { const st = G.newGame({ seed: 42, players: [{ type: 'human' }, { type: 'ai' }] }); assert.equal(st.players.length, 2); assert.equal(Object.values(st.cities).filter(c => c.owner >= 0).length, 2); assert(G.reachable(st, firstUnit(st, 0)).length > 0); });
T('turn order enforced', () => { const st = G.newGame({ seed: 42 }); assert.equal(G.apply(st, 1, { type: 'endTurn' }).ok, false); assert.equal(G.apply(st, 0, null).ok, false); });
T('tech cost = tier*cities+4', () => { const st = G.newGame({ seed: 42 }); assert.equal(G.techCost(st, 0, 'climbing'), 5); assert.equal(G.techCost(st, 0, 'smithery'), 7); });
T('combat formula', () => { const st = G.newGame({ seed: 42 }); const a = firstUnit(st, 0), d = firstUnit(st, 1); d.x = a.x + 1; d.y = a.y; clearAround(st, d.x, d.y); G.tile(st, d.x, d.y).owner = -1;
  const r = G.combatPreview(st, a, d); assert.equal(r.dmg, 5); assert.equal(r.ret, 5); });
T('research + farm', () => { const st = G.newGame({ seed: 7, players: [{ type: 'human', tribe: 4 }, { type: 'ai' }] }); st.players[0].stars = 50; assert(G.apply(st, 0, { type: 'research', tech: 'farming' }).ok); });
T('windmill gains pop from adjacent farms', () => { const st = G.newGame({ seed: 3 }); const c = capital(st, 0); st.players[0].techs.push('organization', 'farming', 'construction'); st.players[0].stars = 99;
  const a = { x: c.x + 1, y: c.y }, b = { x: c.x + 1, y: c.y + 1 }; [a, b].forEach(p => clearAround(st, p.x, p.y)); G.tile(st, a.x, a.y).res = 'crop';
  assert(G.apply(st, 0, { type: 'work', kind: 'farm', x: a.x, y: a.y }).ok); st.pendingLevel = []; const before = c.level * 100 + c.pop; assert(G.worksAt(st, 0, b.x, b.y).includes('windmill'));
  assert(G.apply(st, 0, { type: 'work', kind: 'windmill', x: b.x, y: b.y }).ok); assert(c.level * 100 + c.pop > before, 'windmill added pop'); });
T('ship upgrade purchasable', () => { const st = G.newGame({ seed: 3 }); const u = firstUnit(st, 0); u.boat = 'raft'; st.players[0].stars = 30;
  assert.equal(G.apply(st, 0, { type: 'upgrade', unit: u.id }).ok, false, 'needs sailing'); st.players[0].techs.push('fishing', 'sailing'); assert(G.apply(st, 0, { type: 'upgrade', unit: u.id }).ok); assert.equal(u.boat, 'ship'); assert.equal(st.players[0].stars, 25); assert.equal(G.stats(st, u).a, 2); });
T('monument unlocks + builds', () => { const st = G.newGame({ seed: 3 }); const c = capital(st, 0); st.players[0].maxStars = 70; const p = { x: c.x - 1, y: c.y }; clearAround(st, p.x, p.y); G.tile(st, p.x, p.y).owner = c.id;
  assert(G.worksAt(st, 0, p.x, p.y).includes('monument:wealth')); const s0 = G.score(st, 0); assert(G.apply(st, 0, { type: 'work', kind: 'monument:wealth', x: p.x, y: p.y }).ok); assert(G.score(st, 0) >= s0 + 400); assert(!G.monumentsReady(st, 0).includes('wealth')); });
T('tribe-specific super unit from level 5', () => { const st = G.newGame({ seed: 3, players: [{ type: 'human', tribe: 1 }, { type: 'ai' }] }); const c = capital(st, 0); c.level = 5; st.pendingLevel = [{ city: c.id, level: 5 }];
  Object.values(st.units).forEach(u => { if (u.owner === 0) delete st.units[u.id]; }); assert(G.apply(st, 0, { type: 'levelChoice', choice: 'colossus' }).ok); assert(Object.values(st.units).some(u => u.kind === 'golem')); });
T('Wildroot: forests do not stop movement', () => { const st = G.newGame({ seed: 5, players: [{ type: 'human', tribe: 7 }, { type: 'ai' }] }); const u = firstUnit(st, 0); u.kind = 'rider';
  for (let dx = 1; dx <= 2; dx++) { clearAround(st, u.x + dx, u.y); G.tile(st, u.x + dx, u.y).t = 'forest'; } Object.values(st.units).forEach(e => { if (e.owner !== 0) { e.x = 0; e.y = 0; } });
  assert(G.reachable(st, u).some(p => p.x === u.x + 2 && p.y === u.y)); });
T('Tidefolk: wade shallow water without port', () => { const st = G.newGame({ seed: 5, players: [{ type: 'human', tribe: 6 }, { type: 'ai' }] }); const u = firstUnit(st, 0); clearAround(st, u.x + 1, u.y); G.tile(st, u.x + 1, u.y).t = 'water';
  assert(G.reachable(st, u).some(p => p.x === u.x + 1 && p.y === u.y)); const st2 = G.newGame({ seed: 5 }); const u2 = firstUnit(st2, 0); clearAround(st2, u2.x + 1, u2.y); G.tile(st2, u2.x + 1, u2.y).t = 'water'; assert(!G.reachable(st2, u2).some(p => p.x === u2.x + 1 && p.y === u2.y)); });
T('diplomacy: peace blocks attacks, war restores', () => { const st = G.newGame({ seed: 42 }); const a = firstUnit(st, 0), d = firstUnit(st, 1); d.x = a.x + 1; d.y = a.y; clearAround(st, d.x, d.y);
  assert.equal(G.apply(st, 0, { type: 'proposePeace', to: 1 }).ok, false, 'must meet first'); st.players[0].met.push(1); st.players[1].met.push(0);
  assert(G.apply(st, 0, { type: 'proposePeace', to: 1 }).ok); assert(G.apply(st, 0, { type: 'endTurn' }).ok); assert(G.apply(st, 1, { type: 'acceptPeace', from: 0 }).ok); assert(G.atPeace(st, 0, 1));
  G.apply(st, 1, { type: 'endTurn' }); assert.equal(G.targets(st, a).length, 0); st.players[0].techs.push('diplomacy'); const inc = G.income(st, 0); assert(G.apply(st, 0, { type: 'declareWar', to: 1 }).ok); assert.equal(G.income(st, 0), inc - 1); assert(G.targets(st, a).length > 0); });
T('fog view hides enemies, stars, unexplored tiles', () => { const st = G.newGame({ seed: 9, players: [{ type: 'human' }, { type: 'human' }], size: 16 }); const v = G.viewFor(st, 0);
  assert(!Object.values(v.units).some(u => u.owner === 1 && !G.visibleTo(st, 0, u.x, u.y))); assert.equal(v.players[1].stars, null); assert.equal(v.players[1].explored.length, 0); assert.equal(v.seed, 0);
  assert(v.tiles.some(t => t.t === 'unknown')); const ec = capital(st, 1); assert(!v.cities[ec.id] || st.players[0].explored[ec.y * st.w + ec.x]); assert(JSON.stringify(v).length < JSON.stringify(st).length); });
T('AI difficulties finish games; hard beats easy more often', () => { let hardWins = 0, n = 12; for (let s = 1; s <= n; s++) { const g = G.newGame({ seed: s, players: [{ type: 'ai', difficulty: 'hard' }, { type: 'ai', difficulty: 'easy' }], mode: 'score' }); let k = 0; while (!g.over && k++ < 400) G.aiTurn(g); assert(g.over); if (g.winner === 0) hardWins++; }
  console.log('    hard won ' + hardWins + '/' + n + ' vs easy'); assert(hardWins > n / 2); });
T('10 four-tribe AI games finish (all tribes incl. specials)', () => { for (let s = 1; s <= 10; s++) { const g = G.newGame({ seed: s * 11, players: [0, 1, 2, 3].map(i => ({ type: 'ai', tribe: (s + i * 2) % 8, difficulty: ['easy', 'normal', 'hard', 'crazy'][i] })), mode: s % 2 ? 'score' : 'domination' }); let k = 0; while (!g.over && k++ < 800) G.aiTurn(g); assert(g.over && g.winner != null, 'game ' + s); } });
T('save/load round-trip via JSON keeps playing', () => { const g = G.newGame({ seed: 4, players: [{ type: 'ai' }, { type: 'ai' }] }); for (let i = 0; i < 10; i++) G.aiTurn(g); const g2 = JSON.parse(JSON.stringify(g)); for (let i = 0; i < 10; i++) G.aiTurn(g2); assert(g2.turn > g.turn); });

T('land unit promotion path (warrior→swordsman) costs stars, keeps hp ratio', () => { const st = G.newGame({ seed: 3 }); const u = firstUnit(st, 0); st.players[0].stars = 20; u.hp = 5;
  assert.equal(G.apply(st, 0, { type: 'promote', unit: u.id }).ok, false, 'needs smithery'); st.players[0].techs.push('climbing', 'mining', 'smithery');
  assert(G.apply(st, 0, { type: 'promote', unit: u.id }).ok); assert.equal(u.kind, 'swordsman'); assert.equal(u.maxHp, 15); assert.equal(u.hp, 8); assert.equal(st.players[0].stars, 16); assert(u.moved);
  const st2 = G.newGame({ seed: 3 }); const d = firstUnit(st2, 0); d.kind = 'defender'; st2.players[0].techs.push('construction'); st2.players[0].stars = 9; assert(G.apply(st2, 0, { type: 'promote', unit: d.id }).ok); assert.equal(d.kind, 'guardian'); });
T('online view hides rival scores until game over, shows own rank', () => { const st = G.newGame({ seed: 9, players: [{ type: 'human' }, { type: 'human' }, { type: 'ai' }] }); const v = G.viewFor(st, 0);
  assert.equal(v.players[1].score, null); assert.equal(v.players[2].score, null); assert(v.players[0].score > 0); assert(v.players[0].rank >= 1 && v.players[0].rank <= 3);
  st.over = true; st.winner = 0; const v2 = G.viewFor(st, 0); assert(v2.players[1].score > 0); });
T('coordinated focus fire kills a target no single unit could', () => { const st = G.newGame({ seed: 42, players: [{ type: 'ai', difficulty: 'hard' }, { type: 'human' }] }); Object.keys(st.units).forEach(k => delete st.units[k]);
  const c = capital(st, 0); const ex = c.x + 3 < st.w - 1 ? c.x + 3 : c.x - 3; const e = { id: 900, kind: 'defender', owner: 1, x: ex, y: c.y, hp: 10, maxHp: 15, kills: 0, moved: false, attacked: false };
  clearAround(st, ex, c.y); G.tile(st, ex, c.y).owner = -1; st.units[900] = e; const sgn = ex > c.x ? -1 : 1; const mk = (id, kind, x, y) => { clearAround(st, x, y); st.units[id] = { id, kind, owner: 0, x, y, hp: 10, maxHp: 10, kills: 0, moved: false, attacked: false }; };
  mk(901, 'archer', ex + 2 * sgn, c.y); mk(902, 'warrior', ex + sgn, c.y); mk(903, 'warrior', ex + sgn, c.y + (c.y + 1 < st.h ? 1 : -1)); st.players[0].met.push(1); st.players[0].explored.fill(1);
  assert(G.combatPreview(st, st.units[902], e).dmg < 10); const n = G.coordinate(st, 0, a => G.apply(st, 0, a).ok); assert(n >= 2, 'several attacks'); assert(!st.units[900], 'target killed'); });

console.log('Server');
process.env.PORT = 8099; process.env.ROOMS_FILE = '/tmp/pg_test_rooms.json'; try { fs.unlinkSync(process.env.ROOMS_FILE); } catch (e) {}
const srvMod = require('./server.js'); const WS = require('ws'), http = require('http');
const open = () => new Promise(r => { const w = new WS('ws://localhost:8099'); w.q = []; w.on('error', () => {}); w.on('message', m => { m = JSON.parse(m); w.q.push(m); (w.waiters || []).slice().forEach(f => f()); }); w.on('open', () => r(w)); });
const wait = (w, pred, ms = 4000) => new Promise((res, rej) => { const chk = () => { const i = w.q.findIndex(pred); if (i >= 0) { const m = w.q[i]; w.q.splice(0, i + 1); w.waiters = w.waiters.filter(f => f !== chk); res(m); return true; } }; w.waiters = w.waiters || []; if (chk()) return; w.waiters.push(chk); setTimeout(() => rej(new Error('timeout')), ms); });
const get = p => new Promise(r => http.get({ host: 'localhost', port: 8099, path: p }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => r({ code: res.statusCode, body: d })); }));
(async () => {
  const c1 = await open(), c2 = await open();
  c1.send(JSON.stringify({ type: 'create', name: '<b>A</b>', ai: 1, timer: 30 })); const lob = await wait(c1, m => m.type === 'lobby'); assert.equal(lob.slots[0].name, 'bA/b', 'name sanitized');
  c2.send(JSON.stringify({ type: 'join', code: lob.code, name: 'B' })); await wait(c1, m => m.type === 'lobby' && m.slots.length === 2); c1.send(JSON.stringify({ type: 'start' }));
  const s1 = await wait(c1, m => m.type === 'state'), s2 = await wait(c2, m => m.type === 'state'); passed++; console.log('  ✓ create/join/start room');
  assert.equal(s1.state.fogged, 0); assert.equal(s2.state.fogged, 1); assert.equal(s1.state.players[1].stars, null); assert.equal(s1.state.players[1].score, null); assert(s1.state.players[0].rank >= 1); assert(!Object.values(s1.state.units).some(u => u.owner !== 0 && !G.visibleTo(s1.state, 0, u.x, u.y))); assert(s1.deadline > Date.now()); passed++; console.log('  ✓ per-player fog-filtered state + turn deadline');
  c2.send(JSON.stringify({ type: 'action', action: { type: 'endTurn' } })); assert.equal((await wait(c2, m => m.type === 'error')).err, 'Not your turn'); passed++; console.log('  ✓ rejects out-of-turn actions');
  c1.send(JSON.stringify({ type: 'action', action: { type: 'endTurn' } })); const t2 = await wait(c2, m => m.type === 'state' && m.state.current === 1); c2.send(JSON.stringify({ type: 'action', action: { type: 'endTurn' } }));
  await wait(c1, m => m.type === 'state' && m.state.turn === 2 && m.state.current === 0); passed++; console.log('  ✓ turn sync across clients + AI');
  c1.send('x'.repeat(20000)); await new Promise(r => c1.on('close', r)); passed++; console.log('  ✓ oversized message drops connection');
  assert.equal((await get('/../server.js')).code !== 200 || !(await get('/../server.js')).body.includes('WebSocketServer'), true); for (const p of ['/%2e%2e/server.js', '/..%2fserver.js', '/%2e%2e%2f%2e%2e%2fetc/passwd']) { const r = await get(p); assert(r.code !== 200 && !r.body.includes('WebSocketServer'), p); } assert.equal((await get('/health')).code, 200); passed++; console.log('  ✓ static path traversal blocked, /health ok');
  // rejoin with token after disconnect
  const c3 = await open(); c3.send(JSON.stringify({ type: 'join', code: lob.code, token: lob.token })); const rs = await wait(c3, m => m.type === 'state'); assert.equal(rs.you, 0); passed++; console.log('  ✓ rejoin seat with token');
  // persistence
  srvMod.saveNow(); const saved = JSON.parse(fs.readFileSync(process.env.ROOMS_FILE)); assert(saved[lob.code] && saved[lob.code].state.turn >= 2); passed++; console.log('  ✓ rooms persisted to disk');
  const { execFileSync } = require('child_process'); const out = execFileSync('node', ['-e', `process.env.PORT=8098;process.env.ROOMS_FILE='${process.env.ROOMS_FILE}';const s=require('./server.js');setTimeout(()=>{console.log(Object.keys(s.rooms()).join(','));process.exit(0)},300)`]).toString(); assert(out.includes(lob.code)); passed++; console.log('  ✓ rooms restored after restart');
  // timer auto-ends turn (use short timer by editing room opts)
  const room = srvMod.rooms()[lob.code]; room.opts.timer = 1; c3.send(JSON.stringify({ type: 'action', action: { type: 'endTurn' } })); await wait(c3, m => m.type === 'state' && m.state.current === 1);
  await wait(c3, m => m.type === 'state' && m.state.current === 0, 4000); passed++; console.log('  ✓ turn timer auto-ends idle turn');
  console.log(`\nAll ${passed} tests passed`); process.exit(0);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
