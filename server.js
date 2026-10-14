const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');
const G = require('./public/game.js');
const PORT = +process.env.PORT || 8090;
const DATA = process.env.ROOMS_FILE || path.join(__dirname, 'data', 'rooms.json');
const PUB = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const MAX_ROOMS = 200, MAX_MSG = 16 * 1024, RATE = 40; // msgs per 5s
const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  if (req.url === '/health') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ ok: true, rooms: Object.keys(rooms).length })); }
  let p; try { p = decodeURIComponent(req.url.split('?')[0]); } catch (e) { res.writeHead(400); return res.end(); }
  if (p === '/') p = '/index.html';
  const f = path.join(PUB, path.normalize(p));
  if (!f.startsWith(PUB + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache',
      'Content-Security-Policy': "default-src 'self'; connect-src 'self' ws: wss:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:" }); res.end(d); });
});
const wss = new WebSocketServer({ server, maxPayload: MAX_MSG });
let rooms = {};
// ---- persistence ----
let saveT = null;
function persist() { clearTimeout(saveT); saveT = setTimeout(saveNow, 300); }
function saveNow() { try { fs.mkdirSync(path.dirname(DATA), { recursive: true }); const out = {}; for (const c in rooms) { const r = rooms[c]; out[c] = { code: c, opts: r.opts, slots: r.slots.map(s => ({ name: s.name, type: s.type, token: s.token })), state: r.state, hostToken: r.hostToken }; }
  fs.writeFileSync(DATA + '.tmp', JSON.stringify(out)); fs.renameSync(DATA + '.tmp', DATA); } catch (e) { console.error('save failed', e.message); } }
function load() { try { const d = JSON.parse(fs.readFileSync(DATA, 'utf8')); for (const c in d) { rooms[c] = Object.assign(d[c], { slots: d[c].slots.map(s => Object.assign(s, { ws: null })) }); if (rooms[c].state) armTimer(rooms[c]); } console.log('restored', Object.keys(rooms).length, 'rooms'); } catch (e) {} }
const code = () => { let c; do { c = Math.random().toString(36).slice(2, 7).toUpperCase(); } while (rooms[c]); return c; };
const token = () => require('crypto').randomBytes(12).toString('hex');
const clean = (s, n) => String(s == null ? '' : s).replace(/[<>&"'`\u0000-\u001f]/g, '').trim().slice(0, n || 20);
const send = (ws, m) => { try { ws && ws.readyState === 1 && ws.send(JSON.stringify(m)); } catch (e) {} };
function lobby(r) { const info = { type: 'lobby', code: r.code, started: !!r.state, slots: r.slots.map(s => ({ name: s.name, connected: !!s.ws })), opts: r.opts };
  r.slots.forEach((s, i) => s.ws && send(s.ws, Object.assign({ you: i, token: s.token }, info))); }
function broadcast(r) { r.slots.forEach((s, i) => s.ws && send(s.ws, { type: 'state', state: G.viewFor(r.state, i), you: i, deadline: r.deadline || 0, now: Date.now() })); persist(); }
function runAI(r) { const st = r.state; let n = 0; while (!st.over && st.players[st.current].type === 'ai' && n++ < 50) G.aiTurn(st); }
// ---- turn timer ----
function armTimer(r) { clearTimeout(r.timer); r.deadline = 0; const sec = r.opts.timer | 0; if (!sec || !r.state || r.state.over) return;
  r.deadline = Date.now() + sec * 1000; const cur = r.state.current, turn = r.state.turn;
  r.timer = setTimeout(() => { if (!r.state || r.state.current !== cur || r.state.turn !== turn) return; r.state.pendingLevel = r.state.pendingLevel.filter(l => r.state.cities[l.city].owner !== cur);
    G.apply(r.state, cur, { type: 'endTurn' }); runAI(r); armTimer(r); broadcast(r); }, sec * 1000 + 50); }
function after(r) { runAI(r); armTimer(r); broadcast(r); }
wss.on('connection', (ws, req) => {
  let room = null, hits = [];
  ws.on('error', () => { try { ws.terminate(); } catch (e) {} });
  const me = () => room ? room.slots.findIndex(s => s.ws === ws) : -1;
  ws.on('message', raw => {
    const now = Date.now(); hits = hits.filter(t => now - t < 5000); hits.push(now); if (hits.length > RATE) return send(ws, { type: 'error', err: 'Slow down' });
    let m; try { m = JSON.parse(raw); } catch (e) { return; } if (!m || typeof m !== 'object') return;
    if (m.type === 'create') {
      if (room) return; if (Object.keys(rooms).length >= MAX_ROOMS) return send(ws, { type: 'error', err: 'Server full' });
      const c = code(), tk = token(), diff = ['easy', 'normal', 'hard', 'crazy'].includes(m.difficulty) ? m.difficulty : 'normal';
      room = rooms[c] = { code: c, hostToken: tk, opts: { mode: m.mode === 'score' ? 'score' : 'domination', size: [0, 11, 14, 16, 20].includes(+m.size) ? +m.size : 0, ai: Math.max(0, Math.min(4, m.ai | 0)), difficulty: diff, timer: [0, 30, 60, 120, 300].includes(+m.timer) ? +m.timer : 0 }, slots: [], state: null };
      room.slots.push({ name: clean(m.name) || 'Host', type: 'human', ws, token: tk, tribe: +m.tribe | 0 }); lobby(room); persist();
    } else if (m.type === 'join') {
      if (room) return; const r = rooms[clean(m.code, 8).toUpperCase()]; if (!r) return send(ws, { type: 'error', err: 'Room not found' });
      const i = r.slots.findIndex(s => (m.token && s.token === m.token) || (r.state && !s.ws && s.name === clean(m.name)));
      if (i >= 0) { if (r.slots[i].ws && r.slots[i].ws !== ws) { send(r.slots[i].ws, { type: 'error', err: 'Seat opened in another window', kicked: 1 }); try { r.slots[i].ws.close(); } catch (e) {} } room = r; r.slots[i].ws = ws; if (r.state) { send(ws, { type: 'token', token: r.slots[i].token, code: r.code }); broadcast(r); } else lobby(r); return; }
      if (r.state) return send(ws, { type: 'error', err: 'Game already started' });
      if (r.slots.length + r.opts.ai >= 8) return send(ws, { type: 'error', err: 'Room full' });
      room = r; r.slots.push({ name: clean(m.name) || 'Player ' + (r.slots.length + 1), type: 'human', ws, token: token(), tribe: r.slots.length }); lobby(r); persist();
    } else if (m.type === 'start' && room && me() === 0 && !room.state) {
      const players = room.slots.map((s, i) => ({ type: 'human', name: s.name, tribe: i }));
      for (let i = 0; i < room.opts.ai; i++) players.push({ type: 'ai', tribe: players.length, difficulty: room.opts.difficulty });
      if (players.length < 2) players.push({ type: 'ai', tribe: 1, difficulty: room.opts.difficulty });
      room.state = G.newGame({ players, mode: room.opts.mode, size: room.opts.size || undefined }); after(room);
    } else if (m.type === 'action' && room && room.state) {
      const r = G.apply(room.state, me(), m.action);
      if (!r.ok) return send(ws, { type: 'error', err: r.err });
      if (r.msg) send(ws, { type: 'toast', msg: r.msg });
      if (m.action.type === 'endTurn' || room.state.players[room.state.current].type === 'ai') after(room); else broadcast(room);
    } else if (m.type === 'chat' && room) { const t = clean(m.text, 200); if (t) room.slots.forEach(s => s.ws && send(s.ws, { type: 'chat', from: (room.slots[me()] || {}).name, text: t })); }
  });
  ws.on('close', () => { if (!room) return; const i = me(); if (i < 0) return; room.slots[i].ws = null;
    if (!room.state) { room.slots.splice(i, 1); if (!room.slots.length) delete rooms[room.code]; else lobby(room); persist(); }
    else broadcast(room); });
});
// prune stale rooms daily
setInterval(() => { for (const c in rooms) { const r = rooms[c]; if (r.slots.every(s => !s.ws) && (!r.state || r.state.over)) delete rooms[c]; } persist(); }, 6 * 3600e3).unref();
load();
server.listen(PORT, '0.0.0.0', () => console.log('Polygame server on http://localhost:' + PORT));
process.on('SIGTERM', () => { saveNow(); process.exit(0); }); process.on('SIGINT', () => { saveNow(); process.exit(0); });
module.exports = { server, rooms: () => rooms, saveNow };
