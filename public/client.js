(() => {
'use strict';
window.addEventListener('error', e => { try { const t = document.getElementById('toast'); t.textContent = 'Error: ' + (e.message || e); t.classList.remove('hidden'); } catch (x) {} });
const $ = id => document.getElementById(id), cv = $('c'), ctx = cv.getContext('2d'), G = window.Game, A = window.Art, S = A.sfx;
let st = null, online = null, me = 0, sel = null, selTile = null, cam = { x: 0, y: 0, z: 1 }, lastHuman = -1, aiTimer = null, deadline = 0, clockSkew = 0, localTimer = 0;
const TW = 64, TH = 32, esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');
const anim = {}, fx = []; let prevUnits = {};
G.TRIBES.forEach((t, i) => $('lt').innerHTML += `<option value="${i}">${t.name}: ${t.desc || 'starts with ' + G.TECHS[t.tech].name}</option>`);
function resize() { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px'; }
addEventListener('resize', resize);
const W = () => cv.width / devicePixelRatio, H = () => cv.height / devicePixelRatio;
function toast(m, ok) { const t = $('toast'); t.textContent = m; t.style.background = ok ? '#2a7a3a' : '#a33'; t.classList.remove('hidden'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.add('hidden'), 2400); if (!ok) S.error(); }
const viewer = () => online ? me : (st.players[st.current].type === 'human' ? st.current : lastHuman);
const myTurn = () => st && !st.over && st.current === viewer() && st.players[st.current].type === 'human';
const explored = (v, i) => v < 0 || (st.players[v].explored.length ? st.players[v].explored[i] : 1) && st.tiles[i].t !== 'unknown';
const scoreOf = i => { const p = st.players[i]; if (!p.explored.length) return p.score == null ? '?' : p.score; return G.score(st, i); };
const hiddenScores = () => online && !st.over;

// ---------- state diffing -> animations & sounds ----------
function ingest(newSt) {
  const now = performance.now(), old = prevUnits; prevUnits = {};
  for (const k in newSt.units) { const u = newSt.units[k], o = old[k]; prevUnits[k] = { x: u.x, y: u.y, hp: u.hp, owner: u.owner };
    if (o && (o.x !== u.x || o.y !== u.y)) { anim[k] = { fx: o.x, fy: o.y, t0: now }; }
    if (o && u.hp < o.hp) { fx.push({ x: u.x, y: u.y, t0: now, text: '-' + (o.hp - u.hp), col: '#ff5050' }); S.attack(); }
    if (o && u.hp > o.hp) fx.push({ x: u.x, y: u.y, t0: now, text: '+' + (u.hp - o.hp), col: '#60ff80' });
    if (o && o.owner !== u.owner) fx.push({ x: u.x, y: u.y, t0: now, text: 'converted!', col: '#d080ff' }); }
  for (const k in old) if (!newSt.units[k] && st && st.units[k]) { fx.push({ x: old[k].x, y: old[k].y, t0: now, puff: 1 }); S.death(); }
  if (st) { for (const k in newSt.cities) { const a = st.cities[k], b = newSt.cities[k]; if (a && b && a.owner !== b.owner) { fx.push({ x: b.x, y: b.y, t0: now, text: 'captured!', col: '#ffe060' }); S.capture(); } if (a && b && b.level > a.level && b.owner === viewer()) S.level(); }
    const v = viewer(); if (v >= 0 && newSt.players[v] && st.players[v] && newSt.players[v].techs.length > st.players[v].techs.length) S.tech();
    if (newSt.current !== st.current && newSt.current === v) S.turn(); if (Object.keys(newSt.peace || {}).length > Object.keys(st.peace || {}).length) S.peace(); }
  st = newSt;
}

// ---------- actions ----------
function act(a) {
  if (online) { online.send(JSON.stringify({ type: 'action', action: a })); return; }
  const copy = JSON.parse(JSON.stringify(st)); const r = G.apply(copy, copy.current, a);
  if (!r.ok) return toast(r.err); if (r.msg) toast('Found ' + r.msg, 1);
  if (a.type === 'move') S.move(); if (a.type === 'work' || a.type === 'train' || a.type === 'upgrade' || a.type === 'promote') S.build(); if (a.type === 'explore') S.coin();
  ingest(copy); afterLocal(a.type === 'endTurn');
}
function afterLocal(turnEnded) {
  if (!st.players[st.current] || st.players[st.current].type === 'human') autosave();
  if (sel && !st.units[sel]) sel = null; refresh();
  if (st.over) return;
  if (st.players[st.current].type === 'ai') { clearTimeout(aiTimer); aiTimer = setTimeout(() => { const c = JSON.parse(JSON.stringify(st)); G.aiTurn(c); ingest(c); afterLocal(true); }, 350); return; }
  if (turnEnded || st.current !== lastHuman) { const humans = st.players.filter(p => p.type === 'human' && p.alive).length;
    if (humans > 1 && st.current !== lastHuman) { lastHuman = -1; refresh(); showModal(`<h2>Pass the device to <span style="color:${st.players[st.current].color}">${esc(st.players[st.current].name)}</span></h2><button class="big" onclick="hideModal()">I'm ready</button>`); }
    lastHuman = st.current; centerOnCapital(); armLocalTimer(); refresh(); }
}
function armLocalTimer() { deadline = st.turnSeconds && !online ? Date.now() + st.turnSeconds * 1000 : deadline; }
window.hideModal = () => { $('modal').classList.add('hidden'); refresh(); };
function showModal(h) { $('mbox').innerHTML = h; $('modal').classList.remove('hidden'); }
window.A_ = a => { hideModal(); act(a); };

// ---------- save / load ----------
function autosave() { if (online || !st) return; try { localStorage.setItem('pg_autosave', JSON.stringify(st)); } catch (e) {} }
function listSaves() { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('pg_save_') || k === 'pg_autosave') out.push(k); } } catch (e) {} return out.sort(); }
function renderSaves() { const s = listSaves(); $('saves').innerHTML = s.length ? 'Saved games: ' + s.map(k => `<button onclick="loadSave('${k}')">${k === 'pg_autosave' ? 'Continue (autosave)' : esc(k.slice(8))}</button><button onclick="delSave('${k}')" title="delete">✕</button>`).join('') : ''; }
window.loadSave = k => { try { startLoaded(JSON.parse(localStorage.getItem(k))); } catch (e) { try { localStorage.removeItem(k); } catch (x) {} st = null; $('menu').classList.remove('hidden'); renderSaves(); toast('That save was corrupt and has been removed'); } };
window.delSave = k => { localStorage.removeItem(k); renderSaves(); };
function startLoaded(s) { if (!s || !Array.isArray(s.tiles) || !Array.isArray(s.players) || !s.units || !s.cities || s.fogged != null) throw new Error('Not a Polygame save'); online = null; st = null; prevUnits = {}; ingest(s); lastHuman = -1; showGame(); afterLocal(true); }
$('loadFile').onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { startLoaded(JSON.parse(t)); } catch (er) { st = null; $('menu').classList.remove('hidden'); toast('Invalid save file'); } }); };
$('btnSave').onclick = () => {
  if (online) return toast('Online games are saved on the server automatically', 1);
  const name = 'T' + st.turn + ' ' + new Date().toLocaleString().replace(/[/:,]/g, '-'); localStorage.setItem('pg_save_' + name, JSON.stringify(st));
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(st)], { type: 'application/json' })); a.download = 'polygame-' + name.replace(/ /g, '_') + '.json'; a.click(); toast('Game saved', 1);
};
try { renderSaves(); } catch (e) { $('saves').innerHTML = ''; }

// ---------- start ----------
function showGame() { $('menu').classList.add('hidden'); ['top', 'side', 'logp'].forEach(i => $(i).classList.remove('hidden')); centerOnCapital(); }
$('btnLocal').onclick = () => { wantOnline = false; if (online) { try { online.close(); } catch (e) {} online = null; }
  const h = +$('lh').value, a = +$('la').value, t = +$('lt').value; if (h + a < 2) return toast('Need at least 2 tribes');
  const players = []; for (let i = 0; i < h + a; i++) { const tr = (t + i) % G.TRIBES.length; players.push({ type: i < h ? 'human' : 'ai', tribe: tr, difficulty: $('ld').value, name: i < h && h > 1 ? 'P' + (i + 1) + ' ' + G.TRIBES[tr].name : null }); }
  st = null; prevUnits = {}; ingest(G.newGame({ players, mode: $('lm').value, size: +$('ls').value || undefined, turnSeconds: +$('lti').value })); online = null; lastHuman = -1;
  showGame(); afterLocal(true);
};
let reconnectTries = 0, wantOnline = false, reconnectT = null;
function wsURL() { return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws'; }
function connect(first) {
  wantOnline = true; clearTimeout(reconnectT);
  let ws; try { ws = new WebSocket(wsURL()); } catch (e) { toast('Cannot open connection'); return scheduleReconnect(); }
  ws.onopen = () => { reconnectTries = 0; ws.send(JSON.stringify(first)); };
  ws.onerror = () => {};
  ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } try {
    if (m.type === 'ping') return;
    if (m.type === 'error') { toast(m.err); if (m.kicked) { ws.kicked = true; wantOnline = false; } if (/not found|already started|full/i.test(m.err) && !st) { wantOnline = false; sessionStorage.removeItem('pg_room'); } }
    else if (m.type === 'toast') { toast('Found ' + m.msg, 1); S.coin(); }
    else if (m.type === 'token') { sessionStorage.setItem('pg_room', JSON.stringify({ code: m.code, token: m.token })); }
    else if (m.type === 'chat') logLine(`<b>${esc(m.from)}:</b> ${esc(m.text)}`);
    else if (m.type === 'lobby') { me = m.you; online = ws; sessionStorage.setItem('pg_room', JSON.stringify({ code: m.code, token: m.token })); try { history.replaceState(null, '', '?room=' + m.code); } catch (x) {}
      $('lobby').innerHTML = `<h3>Room code: <span style="font-size:28px;letter-spacing:3px">${esc(m.code)}</span></h3>Share link: <input readonly value="${esc(location.origin + '/?room=' + m.code)}" size="34" onclick="this.select()"><br>Players: ${m.slots.map(s => esc(s.name)).join(', ')} + ${m.opts.ai} AI (${m.opts.difficulty}) · ${m.opts.mode} · timer ${m.opts.timer ? m.opts.timer + 's' : 'off'}<br>` + (m.you === 0 ? '<button id="btnStart" class="big">Start game</button>' : 'Waiting for host to start...');
      if ($('btnStart')) $('btnStart').onclick = () => ws.send(JSON.stringify({ type: 'start' })); }
    else if (m.type === 'state') { const firstS = !st || online !== ws; me = m.you; online = ws; clockSkew = Date.now() - m.now; deadline = m.deadline ? m.deadline + clockSkew : 0; ingest(m.state); if (firstS) showGame(); if (sel && !st.units[sel]) sel = null; refresh(); }
  } catch (err) { console.error(err); toast('Display error: ' + err.message); } };
  ws.onclose = () => { if (ws.kicked || !wantOnline) return; if (online && online !== ws) return; toast('Connection lost, reconnecting...'); scheduleReconnect(); };
}
function scheduleReconnect() { if (!wantOnline) return; const saved = JSON.parse(sessionStorage.getItem('pg_room') || 'null'); if (!saved) return;
  const delay = Math.min(30000, 1000 * Math.pow(2, reconnectTries++)); clearTimeout(reconnectT); reconnectT = setTimeout(() => connect({ type: 'join', code: saved.code, token: saved.token, name: $('oname').value }), delay); }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && wantOnline && (!online || online.readyState > 1)) { reconnectTries = 0; scheduleReconnect(); } });
try { $('oname').value = localStorage.getItem('pg_name') || 'Player'; } catch (e) {}
$('btnCreate').onclick = () => { localStorage.setItem('pg_name', $('oname').value); connect({ type: 'create', name: $('oname').value, ai: +$('oa').value, mode: $('om').value, difficulty: $('od').value, timer: +$('oti').value }); };
$('btnJoin').onclick = () => { localStorage.setItem('pg_name', $('oname').value); const saved = JSON.parse(sessionStorage.getItem('pg_room') || 'null'), code = $('ocode').value.trim().toUpperCase(); connect({ type: 'join', name: $('oname').value, code, token: saved && saved.code === code ? saved.token : undefined }); };
const qRoom = new URLSearchParams(location.search).get('room'); if (qRoom) $('ocode').value = qRoom;
$('btnEnd').onclick = () => myTurn() && act({ type: 'endTurn' });
$('btnMenu').onclick = () => { renderSaves(); $('menu').classList.toggle('hidden'); };
$('btnTech').onclick = techTree; $('btnDip').onclick = diplomacy;
$('btnMus').onclick = () => { $('btnMus').style.opacity = A.toggleMusic() ? 1 : 0.4; }; $('btnMus').style.opacity = A.musicMuted ? 0.4 : 1;
addEventListener('pointerdown', () => A.startMusic(), { once: true });
$('btnSnd').onclick = () => { A.muted = !A.muted; localStorage.setItem('pg_mute', A.muted ? '1' : '0'); $('btnSnd').textContent = A.muted ? '🔇' : '🔊'; }; $('btnSnd').textContent = A.muted ? '🔇' : '🔊';

// ---------- iso math ----------
const toScreen = (x, y) => ({ x: (x - y) * TW / 2 * cam.z + W() / 2 + cam.x, y: (x + y) * TH / 2 * cam.z + 80 + cam.y });
function toTile(sx, sy) { const X = (sx - W() / 2 - cam.x) / (TW / 2 * cam.z), Y = (sy - 80 - cam.y) / (TH / 2 * cam.z); return { x: Math.floor((X + Y) / 2 + 0.5), y: Math.floor((Y - X) / 2 + 0.5) }; }
function centerOnCapital() { const v = viewer(); if (v < 0 || !st) return; const c = Object.values(st.cities).find(c => c.owner === v && c.capital) || Object.values(st.cities).find(c => c.owner === v); if (!c) return; cam.x = 0; cam.y = 0; const p = toScreen(c.x, c.y); cam.x = W() / 2 - p.x; cam.y = H() / 2 - p.y; }

// ---------- render loop ----------
function diamond(x, y, fill, stroke, lw) { const p = toScreen(x, y), w = TW / 2 * cam.z, h = TH / 2 * cam.z; ctx.beginPath(); ctx.moveTo(p.x, p.y - h); ctx.lineTo(p.x + w, p.y); ctx.lineTo(p.x, p.y + h); ctx.lineTo(p.x - w, p.y); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); } }
function unitPos(u, now) { const a = anim[u.id]; if (!a) return toScreen(u.x, u.y); const k = Math.min(1, (now - a.t0) / 260); if (k >= 1) { delete anim[u.id]; return toScreen(u.x, u.y); } const e = k * (2 - k); const p0 = toScreen(a.fx, a.fy), p1 = toScreen(u.x, u.y); return { x: p0.x + (p1.x - p0.x) * e, y: p0.y + (p1.y - p0.y) * e - Math.sin(k * Math.PI) * 8 * cam.z }; }
function frame(now) {
  requestAnimationFrame(frame);
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, H()); g.addColorStop(0, '#0e1824'); g.addColorStop(1, '#1a2a3c'); ctx.fillStyle = g; ctx.fillRect(0, 0, W(), H());
  if (!st) return;
  const v = viewer(), z = cam.z, w = TW / 2 * z, h = TH / 2 * z;
  const su = sel && st.units[sel] && myTurn() ? st.units[sel] : null, reach = su ? G.reachable(st, su) : [], tg = su ? G.targets(st, su) : [];
  for (let s = 0; s < st.w + st.h; s++) for (let x = 0; x <= s; x++) { const y = s - x; if (x >= st.w || y >= st.h) continue;
    const i = y * st.w + x, t = st.tiles[i], p = toScreen(x, y); if (p.x < -w * 2 || p.x > W() + w * 2 || p.y < -h * 4 || p.y > H() + h * 4) continue;
    if (!explored(v, i)) { A.tile(ctx, p, w, h, 'unknown', z, now, i); continue; }
    A.tile(ctx, p, w, h, t.t, z, now, i * 7 + 3);
    const oc = t.owner >= 0 && st.cities[t.owner] && st.cities[t.owner].owner >= 0 ? st.players[st.cities[t.owner].owner].color : null;
    if (oc) { diamond(x, y, oc + '30'); // border edges
      [[1, 0], [0, 1], [-1, 0], [0, -1]].forEach(([dx, dy]) => { const n = G.tile(st, x + dx, y + dy); const no = n && n.owner >= 0 && st.cities[n.owner] ? st.cities[n.owner].owner : -2; if (no !== st.cities[t.owner].owner) { ctx.strokeStyle = oc; ctx.lineWidth = 2.5 * z; ctx.beginPath(); const c = [[p.x, p.y - h], [p.x + w, p.y], [p.x, p.y + h], [p.x - w, p.y]]; const e = dx === 1 ? [1, 2] : dy === 1 ? [2, 3] : dx === -1 ? [3, 0] : [0, 1]; ctx.moveTo(...c[e[0]]); ctx.lineTo(...c[e[1]]); ctx.stroke(); } }); }
    if (t.road && t.city == null) { ctx.strokeStyle = '#b08a5a'; ctx.lineWidth = 3 * z; [[1, 0], [0, 1], [-1, 0], [0, -1]].forEach(([dx, dy]) => { const n = G.tile(st, x + dx, y + dy); if (n && (n.road || n.city != null)) { const q = toScreen(x + dx / 2, y + dy / 2); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); } }); }
    if (t.t === 'forest') A.forest(ctx, p, z); if (t.t === 'mountain') A.mountain(ctx, p, z);
    if (t.res) A.resource(ctx, t.res, p.x + 10 * z, p.y + 6 * z, z);
    if (t.build) A.building(ctx, t.build, p.x, p.y + 4 * z, z, now);
    if (t.ruin) A.ruin(ctx, p, z);
    if (t.city != null && st.cities[t.city]) { const c = st.cities[t.city], col = c.owner >= 0 ? st.players[c.owner].color : '#ccc'; A.city(ctx, p, z, c, col, c.owner >= 0 ? st.players[c.owner].tribe : null); }
    if (selTile && selTile.x === x && selTile.y === y) diamond(x, y, null, '#fff', 2.5);
    if (reach.some(r => r.x === x && r.y === y)) { diamond(x, y, '#ffffff40'); ctx.fillStyle = '#ffffffcc'; ctx.beginPath(); ctx.arc(p.x, p.y, 3 * z, 0, 7); ctx.fill(); }
  }
  Object.values(st.units).sort((a, b) => a.x + a.y - b.x - b.y).forEach(u => {
    if (v >= 0 && u.owner !== v && !G.visibleTo(st, v, u.x, u.y)) return;
    const pl = st.players[u.owner], p0 = unitPos(u, now), onCity = G.tile(st, u.x, u.y).city != null && !anim[u.id], p = onCity ? { x: p0.x + 15 * z, y: p0.y + 9 * z } : p0, bob = Math.sin(now / 400 + u.id) * 1.2 * z, sup = G.UNITS[u.kind].sup;
    if (sel === u.id) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p.x, p.y, 13 * z, 6 * z, 0, 0, 7); ctx.stroke(); }
    A.unit(ctx, p.x, p.y + bob * 0.3, onCity ? z * 0.85 : z, u, pl.color, pl.tribe, { sup, time: now, flip: false });
    const top = p.y - (sup ? 46 : 34) * z; ctx.fillStyle = '#000a'; ctx.fillRect(p.x - 11 * z, top, 22 * z, 5 * z); ctx.fillStyle = u.hp / u.maxHp > 0.5 ? '#5f5' : u.hp / u.maxHp > 0.25 ? '#fb4' : '#f44'; ctx.fillRect(p.x - 10 * z, top + z, 20 * z * u.hp / u.maxHp, 3 * z);
    if (u.vet) { ctx.fillStyle = '#ffd700'; ctx.font = `${10 * z}px system-ui`; ctx.fillText('★', p.x - 14 * z, top + 5 * z); }
    if (u.owner === v && myTurn() && (!u.moved || !u.attacked)) { ctx.fillStyle = '#ffe14a'; ctx.beginPath(); ctx.arc(p.x + 14 * z, top + 2 * z, 3 * z, 0, 7); ctx.fill(); }
    if (st.peace && u.owner !== v && v >= 0 && G.atPeace(st, v, u.owner)) { ctx.font = `${10 * z}px system-ui`; ctx.fillText('🕊', p.x, top - 3 * z); }
  });
  // city labels
  for (const c of Object.values(st.cities)) { if (!explored(v, c.y * st.w + c.x)) continue; const p = toScreen(c.x, c.y); const label = c.owner >= 0 ? (c.capital ? '★ ' : '') + c.name + ' ' + c.level : 'Village';
    ctx.font = `bold ${Math.max(9, 11 * z)}px system-ui`; ctx.textAlign = 'center'; const tw = ctx.measureText(label).width + 10; ctx.fillStyle = c.owner >= 0 ? st.players[c.owner].color + 'dd' : '#0008'; ctx.fillRect(p.x - tw / 2, p.y + 12 * z, tw, 14 * z); ctx.fillStyle = '#fff'; ctx.fillText(label, p.x, p.y + 23 * z);
    if (c.owner >= 0) for (let i = 0; i < c.level + 1; i++) { ctx.fillStyle = i < c.pop ? '#7fdcff' : '#2a3a4a'; ctx.fillRect(p.x - (c.level + 1) * 4 * z + i * 8 * z, p.y + 28 * z, 6 * z, 3 * z); } }
  tg.forEach(e => { const p = toScreen(e.x, e.y); diamond(e.x, e.y, '#ff303050', '#f33', 2.5); const r = G.combatPreview(st, su, e); ctx.font = `bold ${11 * z}px system-ui`; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; const t = `-${r.dmg}${r.ret ? ' / -' + r.ret : ''}`; ctx.strokeText(t, p.x, p.y + 14 * z); ctx.fillText(t, p.x, p.y + 14 * z); });
  for (let i = fx.length - 1; i >= 0; i--) { const f = fx[i], k = (now - f.t0) / 1100; if (k > 1) { fx.splice(i, 1); continue; } const p = toScreen(f.x, f.y);
    if (f.puff) { ctx.fillStyle = `rgba(220,220,220,${1 - k})`; for (let j = 0; j < 6; j++) { const a = j * 1.05; ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * k * 18 * z, p.y - 12 * z + Math.sin(a) * k * 10 * z, (5 - 3 * k) * z, 0, 7); ctx.fill(); } }
    else { ctx.globalAlpha = 1 - k; ctx.font = `bold ${14 * z}px system-ui`; ctx.fillStyle = f.col; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText(f.text, p.x, p.y - 40 * z - k * 25 * z); ctx.fillText(f.text, p.x, p.y - 40 * z - k * 25 * z); ctx.globalAlpha = 1; } }
  // timer
  if (deadline && !st.over) { const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000)); $('timer').textContent = '⏱ ' + left + 's'; $('timer').style.color = left < 10 ? '#f66' : '';
    if (!online && left <= 0 && myTurn()) { deadline = 0; st.pendingLevel = st.pendingLevel.filter(l => st.cities[l.city].owner !== st.current); hideModal(); act({ type: 'endTurn' }); } } else $('timer').textContent = '';
}
requestAnimationFrame(frame);

// ---------- panels ----------
function logLine(h) { $('logp').innerHTML += `<div>${h}</div>`; $('logp').scrollTop = 1e9; }
function refresh() {
  if (!st) return; const v = viewer(), P = st.players[Math.max(0, v)], cur = st.players[st.current];
  $('who').innerHTML = `<span style="color:${cur.color}">●</span> ${esc(cur.name)}'s turn` + (online ? ` <small>(you: ${esc(st.players[me].name)})</small>` : '');
  $('stars').textContent = P.stars; $('inc').textContent = G.income(st, P.id); $('turn').textContent = st.turn + (st.mode === 'score' ? '/' + st.maxTurns : '');
  $('score').textContent = 'Score ' + scoreOf(P.id) + (P.rank ? ' (rank ' + P.rank + '/' + st.players.length + ')' : ''); $('btnEnd').disabled = !myTurn();
  const offers = (st.offers || []).filter(f => f.to === v).length; $('btnDip').textContent = 'Diplomacy' + (offers ? ' (' + offers + ')' : '');
  $('logp').innerHTML = st.log.slice(-25).map(l => `<div>T${l.turn}: ${esc(l.m)}</div>`).join(''); $('logp').scrollTop = 1e9;
  if (st.over) { showModal(`<h2>🏆 ${esc(st.players[st.winner].name)} wins!</h2>${st.players.map(p => `<div style="color:${p.color}">${esc(p.name)}: ${scoreOf(p.id)} pts ${p.alive ? '' : '(eliminated)'}</div>`).join('')}<br><button class="big" onclick="location.href='/'">New game</button>`); }
  else if (myTurn() && st.pendingLevel.length && st.cities[st.pendingLevel[0].city] && st.cities[st.pendingLevel[0].city].owner === v) { const pl = st.pendingLevel[0];
    showModal(`<h2>${esc(st.cities[pl.city].name)} reached level ${pl.level}!</h2><p>Choose a reward:</p>` + G.levelChoices(pl.level).map(c => `<button class="big" onclick="A_({type:'levelChoice',choice:'${c}'})">${c === 'colossus' ? G.UNITS[P.superKind || 'colossus'].name + ' (super unit)' : G.CHOICE_DESC[c]}</button>`).join('')); }
  side();
}
function side() {
  const s = $('side'), v = viewer(); let h = '';
  if (!selTile || v < 0) { s.innerHTML = '<i>Tap a tile or unit.</i><br><small>Drag to pan · wheel/pinch to zoom</small>' + scoreboard(); return; }
  const t = G.tile(st, selTile.x, selTile.y), P = st.players[v];
  if (!explored(v, selTile.y * st.w + selTile.x)) { s.innerHTML = 'Unexplored' + scoreboard(); return; }
  h += `<b>${t.t[0].toUpperCase() + t.t.slice(1)}</b>${t.res ? ' · ' + t.res : ''}${t.build ? ' · ' + t.build + (t.monument ? ' (' + G.MONUMENTS[t.monument].name + ')' : '') : ''}${t.road ? ' · road' : ''}${t.ruin ? ' · <b>ruins</b>' : ''}<br>`;
  const u = G.unitAt(st, selTile.x, selTile.y);
  if (u && (u.owner === v || G.visibleTo(st, v, u.x, u.y))) { const S2 = G.stats(st, u);
    h += `<hr><b style="color:${st.players[u.owner].color}">${u.boat ? G.BOATS[u.boat].name + ' (' + G.UNITS[u.kind].name + ')' : G.UNITS[u.kind].name}</b>${u.vet ? ' ★veteran' : ''} <small>${esc(st.players[u.owner].name)}</small><br>HP ${u.hp}/${u.maxHp} · Atk ${S2.a} · Def ${S2.d} · Move ${S2.m} · Range ${S2.r}<br><small>${[S2.dash && 'dash', S2.escape && 'escape', S2.persist && 'persist', S2.convert && 'convert', S2.sup && 'super unit'].filter(Boolean).join(', ')} · kills ${u.kills}</small><br>`;
    if (u.owner === v && myTurn()) {
      if (t.city != null && st.cities[t.city] && st.cities[t.city].owner !== v) h += `<button ${u.moved || u.attacked ? 'disabled' : ''} onclick="A_({type:'capture',unit:${u.id}})">Capture</button>`;
      if (t.ruin) h += `<button ${u.attacked ? 'disabled' : ''} onclick="A_({type:'explore',unit:${u.id}})">Examine ruins</button>`;
      h += `<button ${u.moved || u.attacked || u.hp >= u.maxHp ? 'disabled' : ''} onclick="A_({type:'heal',unit:${u.id}})">Recover</button>`;
      if (u.kind === 'mindbender') h += `<button ${u.attacked ? 'disabled' : ''} onclick="A_({type:'healOthers',unit:${u.id}})">Heal others</button>`;
      if (!u.boat && G.PROMOTE[u.kind]) { const pr = G.PROMOTE[u.kind]; const cc = G.cityOfTile(st, u.x, u.y); h += `<button ${!G.has(st, v, pr.tech) || P.stars < pr.cost || u.moved || u.attacked || !cc || cc.owner !== v ? 'disabled' : ''} onclick="A_({type:'promote',unit:${u.id}})" title="needs ${G.TECHS[pr.tech].name}, in your territory">Upgrade to ${G.UNITS[pr.to].name} ⭐${pr.cost}</button>`; }
      if (u.boat && G.SHIP_UP[u.boat]) { const up = G.SHIP_UP[u.boat]; h += `<button ${!G.has(st, v, up.tech) || P.stars < up.cost || u.moved ? 'disabled' : ''} onclick="A_({type:'upgrade',unit:${u.id}})" title="requires ${G.TECHS[up.tech].name}">Upgrade to ${G.BOATS[up.to].name} ⭐${up.cost}</button>`; }
      h += `<button onclick="if(confirm('Disband this unit?'))A_({type:'disband',unit:${u.id}})">Disband</button>`;
    } }
  if (t.city != null && st.cities[t.city]) { const c = st.cities[t.city];
    h += `<hr><b>${c.owner >= 0 ? esc(c.name) : 'Village'}</b>${c.owner >= 0 ? ` (${esc(st.players[c.owner].name)})<br>Level ${c.level} · Pop ${c.pop}/${c.level + 1} · Units ${G.cityUnits(st, c.id)}/${c.level + 1}${c.wall ? ' · Wall' : ''}${c.workshop ? ' · Workshop' : ''}${c.park ? ' · Park x' + c.park : ''}` : '<br>Move a unit here and capture it next turn.'}<br>`;
    if (c.owner === v && myTurn()) { h += '<b>Train:</b><br>'; for (const k in G.UNITS) { const d = G.UNITS[k]; if (d.tech === 'none') continue;
      if (G.has(st, v, d.tech)) h += `<button ${P.stars < d.cost ? 'disabled' : ''} title="A${d.a} D${d.d} M${d.m} HP${d.hp} R${d.r}" onclick="A_({type:'train',city:${c.id},kind:'${k}'})">${d.name} ⭐${d.cost}</button>`; } } }
  if (myTurn()) { const w = G.worksAt(st, v, selTile.x, selTile.y); if (w.length) { h += '<hr><b>Build / harvest:</b><br>' + w.map(k => { if (k.startsWith('monument:')) return `<button onclick="A_({type:'work',kind:'${k}',x:${selTile.x},y:${selTile.y}})">🏛 ${G.MONUMENTS[k.slice(9)].name} (free, +3 pop)</button>`;
    const W2 = G.WORKS[k]; return `<button ${P.stars < W2.cost ? 'disabled' : ''} onclick="A_({type:'work',kind:'${k}',x:${selTile.x},y:${selTile.y}})">${W2.name} ⭐${W2.cost}${W2.pop ? ' +' + W2.pop + 'pop' : ''}${W2.adj ? ' (+' + W2.per + '/adj ' + W2.adj + ')' : ''}${W2.stars ? ' +' + W2.stars + '⭐' : ''}</button>`; }).join(''); } }
  s.innerHTML = h + scoreboard();
}
function scoreboard() { return '<hr><b>Tribes</b>' + st.players.map(p => `<div style="color:${p.color}">${esc(p.name)}${p.type === 'ai' ? ' (AI ' + (p.difficulty || '') + ')' : ''}: ${p.alive ? (hiddenScores() && p.id !== viewer() ? 'alive' : scoreOf(p.id) + ' pts') : 'eliminated'}${viewer() >= 0 && p.id !== viewer() && G.atPeace(st, viewer(), p.id) ? ' 🕊' : ''}</div>`).join(''); }
function techTree() {
  const v = viewer(); if (v < 0) return; const roots = Object.keys(G.TECHS).filter(k => !G.TECHS[k].req);
  let h = `<h2>Technology</h2><p>Cost = tier × cities + 4${G.has(st, v, 'philosophy') ? ' (−33% Philosophy)' : ''} · You have ⭐${st.players[v].stars}</p>`;
  roots.forEach(r => { h += '<div style="margin:6px 0;white-space:nowrap;overflow-x:auto">'; const order = [r]; Object.keys(G.TECHS).filter(k => G.TECHS[k].req === r).forEach(b => { order.push(b); Object.keys(G.TECHS).filter(k => G.TECHS[k].req === b).forEach(x => order.push(x)); });
    order.forEach(k => { const T = G.TECHS[k], have = G.has(st, v, k), can = G.canResearch(st, v, k), cost = G.techCost(st, v, k);
      h += `<div class="tech ${have ? 'have' : can ? 'can' : ''}" style="white-space:normal" ${can && myTurn() ? `onclick="A_({type:'research',tech:'${k}'})"` : ''}><b>${T.name}</b> ${have ? '✔' : '⭐' + cost}<br><small>Tier ${T.tier}</small><br>${G.TECH_DESC[k]}</div>`; }); h += '</div>'; });
  h += '<h3>Monuments</h3>' + Object.keys(G.MONUMENTS).map(k => `<div class="tech ${st.players[v].monuments.includes(k) ? 'have' : ''}"><b>${G.MONUMENTS[k].name}</b><br>${G.MONUMENTS[k].need}</div>`).join('');
  showModal(h + '<br><button onclick="hideModal()">Close</button>');
}
function diplomacy() {
  const v = viewer(); if (v < 0) return; const P = st.players[v]; let h = '<h2>Diplomacy</h2><p class="small">You can only deal with tribes you have met. Peace treaties stop all attacks and captures between the two tribes. With the Diplomacy tech, each treaty also gives you +1 star per turn.</p>';
  (st.offers || []).filter(f => f.to === v).forEach(f => h += `<div class="row">📜 <b style="color:${st.players[f.from].color}">${esc(st.players[f.from].name)}</b> offers peace. ${myTurn() ? `<button onclick="A_({type:'acceptPeace',from:${f.from}})">Accept</button><button onclick="A_({type:'rejectPeace',from:${f.from}})">Reject</button>` : '(answer on your turn)'}</div>`);
  st.players.forEach(p => { if (p.id === v || !p.alive) return; const met = P.met.includes(p.id), peace = G.atPeace(st, v, p.id), pending = (st.offers || []).some(f => f.from === v && f.to === p.id);
    h += `<div class="row"><b style="color:${p.color};min-width:150px">${esc(p.name)}</b> ${!met ? '<i>not met</i>' : peace ? '🕊 At peace' + (myTurn() ? ` <button onclick="A_({type:'declareWar',to:${p.id}})">Declare war</button>` : '') : '⚔ At war' + (myTurn() ? (pending ? ' (offer sent)' : ` <button onclick="A_({type:'proposePeace',to:${p.id}})">Propose peace</button>`) : '')} <small>${met ? p.techs.length + ' techs' + (hiddenScores() ? '' : ' · ' + scoreOf(p.id) + ' pts') : ''}</small></div>`; });
  if (online) h += '<hr>Chat: <input id="chatIn" maxlength="200" size="30"><button onclick="sendChat()">Send</button>';
  showModal(h + '<br><button onclick="hideModal()">Close</button>');
}
window.sendChat = () => { const t = $('chatIn').value; if (t && online) online.send(JSON.stringify({ type: 'chat', text: t })); $('chatIn').value = ''; };

// ---------- input: mouse + touch (pointer events) ----------
const ptrs = new Map(); let drag = null, pinch = null;
cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 1) drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: false };
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: cam.z }; drag = null; } });
cv.addEventListener('pointermove', e => { if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d); return; }
  if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 8) drag.moved = true; if (drag.moved) { cam.x = drag.cx + dx; cam.y = drag.cy + dy; } });
const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; const d = drag; drag = null; if (e.type === 'pointerup' && d && !d.moved && st) click(toTile(e.clientX, e.clientY)); };
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
function zoomAt(x, y, nz) { nz = Math.max(0.4, Math.min(2.5, nz)); const mx = x - W() / 2 - cam.x, my = y - 80 - cam.y; cam.x -= mx * (nz / cam.z - 1); cam.y -= my * (nz / cam.z - 1); cam.z = nz; }
cv.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.clientX, e.clientY, cam.z * (e.deltaY < 0 ? 1.1 : 0.9)); }, { passive: false });
function click(p) {
  if (p.x < 0 || p.y < 0 || p.x >= st.w || p.y >= st.h) return; const v = viewer();
  if (sel && st.units[sel] && myTurn()) { const u = st.units[sel];
    const tg = G.targets(st, u).find(e => e.x === p.x && e.y === p.y);
    if (tg) { selTile = p; act({ type: 'attack', unit: u.id, target: tg.id }); return; }
    if (G.reachable(st, u).some(r => r.x === p.x && r.y === p.y)) { if (online) S.move(); act({ type: 'move', unit: u.id, x: p.x, y: p.y }); selTile = p; sel = u.id; refresh(); return; }
  }
  selTile = p; const u = G.unitAt(st, p.x, p.y); sel = u && u.owner === v ? u.id : null; if (sel) S.select(); refresh();
}
addEventListener('keydown', e => { if (e.key === 'Escape') { sel = null; hideModal(); } if (e.key === 'Enter' && e.ctrlKey) $('btnEnd').click(); });
resize();
// auto-reconnect to an online game after reload
let saved = null; try { saved = JSON.parse(sessionStorage.getItem('pg_room') || 'null'); } catch (e) { sessionStorage.removeItem('pg_room'); } if (saved && qRoom && saved.code === qRoom) connect({ type: 'join', code: saved.code, token: saved.token, name: $('oname').value });
window.__pg = { get st() { return st; }, act, cam };
})();
