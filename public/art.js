// Original procedural art + generated sound for Polygame.
(function () {
const Art = {};
function shade(hex, f) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const m = c => Math.max(0, Math.min(255, Math.round(f > 0 ? c + (255 - c) * f : c * (1 + f)))); return '#' + ((1 << 24) + (m(r) << 16) + (m(g) << 8) + m(b)).toString(16).slice(1); }
Art.shade = shade;
const TILE = { field: ['#9ad468', '#6fa244'], forest: ['#7cba58', '#527f34'], mountain: ['#a9b0a4', '#7c8478'], water: ['#56b6e2', '#3a8cb8'], ocean: ['#2f74b0', '#215a8c'], unknown: ['#1c2632', '#151d27'] };
Art.tile = function (ctx, p, w, h, t, z, time, seed) {
  const [top, side] = TILE[t] || TILE.unknown, land = t !== 'water' && t !== 'ocean' && t !== 'unknown', d = land ? 6 * z : 0;
  ctx.beginPath(); ctx.moveTo(p.x - w, p.y); ctx.lineTo(p.x, p.y + h); ctx.lineTo(p.x + w, p.y); ctx.lineTo(p.x + w, p.y + d); ctx.lineTo(p.x, p.y + h + d); ctx.lineTo(p.x - w, p.y + d); ctx.closePath(); ctx.fillStyle = side; ctx.fill();
  ctx.beginPath(); ctx.moveTo(p.x, p.y - h); ctx.lineTo(p.x + w, p.y); ctx.lineTo(p.x, p.y + h); ctx.lineTo(p.x - w, p.y); ctx.closePath();
  const gr = ctx.createLinearGradient(p.x - w * 0.5, p.y - h, p.x + w * 0.5, p.y + h); gr.addColorStop(0, shade(top, 0.12)); gr.addColorStop(1, shade(top, -0.1)); ctx.fillStyle = gr; ctx.fill();
  ctx.strokeStyle = '#00000030'; ctx.lineWidth = 1; ctx.stroke();
  if (t !== 'unknown') { ctx.strokeStyle = '#ffffff30'; ctx.beginPath(); ctx.moveTo(p.x - w + 2, p.y); ctx.lineTo(p.x, p.y - h + 1); ctx.lineTo(p.x + w - 2, p.y); ctx.stroke();
    ctx.fillStyle = t === 'mountain' ? '#00000022' : t === 'water' || t === 'ocean' ? '#ffffff14' : '#00000018';
    for (let i = 0; i < 7; i++) { const a = ((seed * 31 + i * 97) % 100) / 100 - 0.5, b = ((seed * 17 + i * 53) % 100) / 100 - 0.5; if (Math.abs(a) + Math.abs(b) > 0.45) continue; ctx.fillRect(p.x + a * 2 * w, p.y + b * 2 * h, 1.6 * z, 1.2 * z); } }
  if (land) { ctx.fillStyle = '#00000025'; ctx.beginPath(); ctx.moveTo(p.x, p.y + h); ctx.lineTo(p.x + w, p.y); ctx.lineTo(p.x + w, p.y + d); ctx.lineTo(p.x, p.y + h + d); ctx.fill(); }
  if (t === 'field') { ctx.strokeStyle = '#5f9a3a'; ctx.lineWidth = 1.2 * z; for (let i = 0; i < 3; i++) { const a = ((seed * (i + 3)) % 17) / 17 - 0.5, b = ((seed * (i + 7)) % 13) / 13 - 0.5; const x = p.x + a * w, y = p.y + b * h; ctx.beginPath(); ctx.moveTo(x - 2 * z, y); ctx.lineTo(x - 1 * z, y - 3 * z); ctx.moveTo(x, y); ctx.lineTo(x + 1 * z, y - 4 * z); ctx.stroke(); } }
  if (t === 'water' || t === 'ocean') { ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 1.2 * z; const o = Math.sin(time / 600 + seed) * 4 * z; ctx.beginPath(); ctx.moveTo(p.x - 10 * z + o, p.y - 2 * z); ctx.quadraticCurveTo(p.x - 5 * z + o, p.y - 5 * z, p.x + o, p.y - 2 * z); ctx.moveTo(p.x + 2 * z - o, p.y + 4 * z); ctx.quadraticCurveTo(p.x + 7 * z - o, p.y + 1 * z, p.x + 12 * z - o, p.y + 4 * z); ctx.stroke(); }
};
function tree(ctx, x, y, s, c) { ctx.fillStyle = '#0003'; ctx.beginPath(); ctx.ellipse(x + s * 0.2, y + s * 0.3, s * 0.5, s * 0.18, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#6b4a2a'; ctx.fillRect(x - s * 0.12, y - s * 0.2, s * 0.24, s * 0.5);
  ctx.strokeStyle = shade(c, -0.5); ctx.lineWidth = Math.max(0.6, s * 0.06); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x, y - s * (1.3 - i * 0.3)); ctx.lineTo(x + s * (0.45 + i * 0.12), y - s * (0.5 - i * 0.25)); ctx.lineTo(x - s * (0.45 + i * 0.12), y - s * (0.5 - i * 0.25)); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); ctx.stroke();
  ctx.fillStyle = shade(c, 0.25); ctx.beginPath(); ctx.moveTo(x, y - s * (1.3 - i * 0.3)); ctx.lineTo(x - s * (0.45 + i * 0.12), y - s * (0.5 - i * 0.25)); ctx.lineTo(x - s * 0.1, y - s * (0.5 - i * 0.25)); ctx.fill(); } }
Art.forest = (ctx, p, z) => { tree(ctx, p.x - 9 * z, p.y + 2 * z, 12 * z, '#2f7a34'); tree(ctx, p.x + 8 * z, p.y - 2 * z, 14 * z, '#38883a'); tree(ctx, p.x, p.y + 6 * z, 10 * z, '#2a6c2e'); };
Art.mountain = (ctx, p, z) => { const m = (x, y, s, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.9, y + s * 0.3); ctx.lineTo(x - s * 0.9, y + s * 0.3); ctx.fill(); ctx.fillStyle = shade(c, -0.25); ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.9, y + s * 0.3); ctx.lineTo(x + s * 0.1, y + s * 0.3); ctx.fill(); ctx.fillStyle = '#f4f6f8'; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.28, y - s * 0.6); ctx.lineTo(x - s * 0.28, y - s * 0.6); ctx.fill(); };
  m(p.x + 9 * z, p.y + 1 * z, 11 * z, '#8d948a'); m(p.x - 3 * z, p.y - 2 * z, 18 * z, '#9ea69a'); };
Art.ruin = (ctx, p, z) => { ctx.fillStyle = '#8a8270'; ctx.fillRect(p.x - 9 * z, p.y - 12 * z, 4 * z, 14 * z); ctx.fillRect(p.x + 5 * z, p.y - 8 * z, 4 * z, 10 * z); ctx.fillRect(p.x - 10 * z, p.y - 15 * z, 12 * z, 3 * z); ctx.fillStyle = '#6a6250'; ctx.fillRect(p.x - 2 * z, p.y - 1 * z, 6 * z, 3 * z); };
const RES = {
  fruit: (ctx, x, y, z) => { ctx.fillStyle = '#3a7a2a'; ctx.beginPath(); ctx.arc(x, y - 6 * z, 6 * z, 0, 7); ctx.fill(); ['#e0384a', '#f0c030', '#e0384a'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x - 3 * z + i * 3 * z, y - 5 * z + (i % 2) * 2 * z, 1.8 * z, 0, 7); ctx.fill(); }); },
  crop: (ctx, x, y, z) => { ctx.strokeStyle = '#e8c040'; ctx.lineWidth = 1.6 * z; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * 2.5 * z, y); ctx.lineTo(x + i * 2.5 * z + z, y - 9 * z); ctx.stroke(); } },
  animal: (ctx, x, y, z) => { ctx.fillStyle = '#a0683a'; ctx.beginPath(); ctx.ellipse(x, y - 4 * z, 6 * z, 3.5 * z, 0, 0, 7); ctx.fill(); ctx.fillRect(x - 5 * z, y - 2 * z, 1.5 * z, 4 * z); ctx.fillRect(x + 3.5 * z, y - 2 * z, 1.5 * z, 4 * z); ctx.beginPath(); ctx.arc(x + 6 * z, y - 7 * z, 2.5 * z, 0, 7); ctx.fill(); ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = z; ctx.beginPath(); ctx.moveTo(x + 6 * z, y - 9 * z); ctx.lineTo(x + 5 * z, y - 13 * z); ctx.moveTo(x + 7 * z, y - 9 * z); ctx.lineTo(x + 9 * z, y - 12 * z); ctx.stroke(); },
  ore: (ctx, x, y, z) => { ctx.fillStyle = '#7ad0f0'; ctx.beginPath(); ctx.moveTo(x, y - 9 * z); ctx.lineTo(x + 4 * z, y - 4 * z); ctx.lineTo(x, y); ctx.lineTo(x - 4 * z, y - 4 * z); ctx.fill(); ctx.fillStyle = '#c0f0ff'; ctx.fillRect(x - 1 * z, y - 6 * z, 2 * z, 2 * z); },
  fish: (ctx, x, y, z) => { ctx.fillStyle = '#f0f4ff'; ctx.beginPath(); ctx.ellipse(x, y - 3 * z, 5 * z, 2.5 * z, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - 4 * z, y - 3 * z); ctx.lineTo(x - 8 * z, y - 6 * z); ctx.lineTo(x - 8 * z, y); ctx.fill(); },
  whale: (ctx, x, y, z) => { ctx.fillStyle = '#26384e'; ctx.beginPath(); ctx.ellipse(x, y - 3 * z, 9 * z, 4 * z, 0, Math.PI, 0); ctx.fill(); ctx.strokeStyle = '#cfe8ff'; ctx.lineWidth = z; ctx.beginPath(); ctx.moveTo(x + 3 * z, y - 7 * z); ctx.lineTo(x + 3 * z, y - 11 * z); ctx.moveTo(x + 1 * z, y - 12 * z); ctx.lineTo(x + 5 * z, y - 12 * z); ctx.stroke(); },
};
Art.resource = (ctx, k, x, y, z) => RES[k] && RES[k](ctx, x, y, z);
const BLD = {
  farm: (ctx, x, y, z) => { ctx.fillStyle = '#d8b040'; for (let i = 0; i < 3; i++) ctx.fillRect(x - 9 * z, y - 6 * z + i * 3.5 * z, 18 * z, 2 * z); },
  mine: (ctx, x, y, z) => { ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(x, y, 5 * z, Math.PI, 0); ctx.fill(); ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 2 * z; ctx.stroke(); },
  lumber: (ctx, x, y, z) => { ctx.fillStyle = '#9a6a3a'; ctx.fillRect(x - 7 * z, y - 8 * z, 14 * z, 8 * z); ctx.fillStyle = '#6a3a1a'; ctx.beginPath(); ctx.moveTo(x - 9 * z, y - 8 * z); ctx.lineTo(x, y - 14 * z); ctx.lineTo(x + 9 * z, y - 8 * z); ctx.fill(); },
  port: (ctx, x, y, z) => { ctx.fillStyle = '#8a6040'; ctx.fillRect(x - 10 * z, y - 2 * z, 20 * z, 4 * z); ctx.fillRect(x - 8 * z, y, 2 * z, 5 * z); ctx.fillRect(x + 6 * z, y, 2 * z, 5 * z); ctx.fillStyle = '#ddd'; ctx.fillRect(x - 1 * z, y - 14 * z, 2 * z, 12 * z); },
  shrine: (ctx, x, y, z) => { ctx.fillStyle = '#d8d0b0'; ctx.fillRect(x - 4 * z, y - 12 * z, 8 * z, 12 * z); ctx.fillStyle = '#b05a3a'; ctx.beginPath(); ctx.moveTo(x - 6 * z, y - 12 * z); ctx.lineTo(x, y - 18 * z); ctx.lineTo(x + 6 * z, y - 12 * z); ctx.fill(); },
  temple: (ctx, x, y, z) => { ctx.fillStyle = '#e8e0c8'; ctx.fillRect(x - 9 * z, y - 10 * z, 18 * z, 10 * z); ctx.fillStyle = '#c04a3a'; ctx.beginPath(); ctx.moveTo(x - 11 * z, y - 10 * z); ctx.lineTo(x, y - 17 * z); ctx.lineTo(x + 11 * z, y - 10 * z); ctx.fill(); ctx.fillStyle = '#8a7a5a'; for (let i = -1; i <= 1; i++) ctx.fillRect(x + i * 5 * z - z, y - 9 * z, 2 * z, 9 * z); },
  windmill: (ctx, x, y, z, time) => { ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x - 4 * z, y - 14 * z, 8 * z, 14 * z); ctx.save(); ctx.translate(x, y - 14 * z); ctx.rotate(time / 700); ctx.fillStyle = '#7a5a3a'; for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.fillRect(-1.2 * z, 0, 2.4 * z, 10 * z); } ctx.restore(); },
  sawmill: (ctx, x, y, z, time) => { ctx.fillStyle = '#a07040'; ctx.fillRect(x - 9 * z, y - 9 * z, 18 * z, 9 * z); ctx.save(); ctx.translate(x + 6 * z, y - 10 * z); ctx.rotate(time / 300); ctx.fillStyle = '#ccd'; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.lineTo(Math.cos(a) * 5 * z, Math.sin(a) * 5 * z); ctx.lineTo(Math.cos(a + 0.4) * 3.5 * z, Math.sin(a + 0.4) * 3.5 * z); } ctx.fill(); ctx.restore(); },
  forge: (ctx, x, y, z, time) => { ctx.fillStyle = '#5a5a62'; ctx.fillRect(x - 8 * z, y - 10 * z, 16 * z, 10 * z); ctx.fillRect(x + 3 * z, y - 18 * z, 4 * z, 8 * z); ctx.fillStyle = `rgba(255,${120 + 60 * Math.sin(time / 150)},40,0.9)`; ctx.fillRect(x - 5 * z, y - 6 * z, 6 * z, 5 * z); ctx.fillStyle = '#aaa8'; ctx.beginPath(); ctx.arc(x + 5 * z, y - 21 * z - (time / 80 % 6) * z, 2.5 * z, 0, 7); ctx.fill(); },
  monument: (ctx, x, y, z, time) => { ctx.fillStyle = '#e6c650'; ctx.beginPath(); ctx.moveTo(x - 5 * z, y); ctx.lineTo(x - 2.5 * z, y - 24 * z); ctx.lineTo(x, y - 28 * z); ctx.lineTo(x + 2.5 * z, y - 24 * z); ctx.lineTo(x + 5 * z, y); ctx.fill(); ctx.fillStyle = '#fff8'; ctx.beginPath(); ctx.arc(x, y - 29 * z, (2 + Math.sin(time / 300)) * z, 0, 7); ctx.fill(); },
};
Art.building = (ctx, k, x, y, z, time) => BLD[k] && BLD[k](ctx, x, y, z, time);
// Tribe-specific cities: roof style per tribe
const ROOF = { verdani: 'leaf', kharu: 'peak', solenne: 'dome', mossik: 'flat', ashra: 'spire', tolvi: 'tent', tidefolk: 'shell', wildroot: 'hut' };
function house(ctx, x, y, s, col, style) {
  ctx.fillStyle = '#e9dcc0'; ctx.fillRect(x - s / 2, y - s, s, s); ctx.fillStyle = shade('#e9dcc0', -0.2); ctx.fillRect(x, y - s, s / 2, s);
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = Math.max(0.6, s * 0.08); ctx.strokeRect(x - s / 2, y - s, s, s);
  ctx.fillStyle = '#4a3020'; ctx.fillRect(x - s * 0.12, y - s * 0.45, s * 0.24, s * 0.45); ctx.fillStyle = '#ffe9a0'; ctx.fillRect(x + s * 0.18, y - s * 0.75, s * 0.18, s * 0.18); ctx.fillRect(x - s * 0.38, y - s * 0.75, s * 0.18, s * 0.18);
  ctx.fillStyle = col; ctx.beginPath();
  switch (style) {
    case 'dome': ctx.arc(x, y - s, s * 0.55, Math.PI, 0); break;
    case 'flat': ctx.rect(x - s * 0.6, y - s * 1.2, s * 1.2, s * 0.25); break;
    case 'spire': ctx.moveTo(x - s * 0.55, y - s); ctx.lineTo(x, y - s * 2); ctx.lineTo(x + s * 0.55, y - s); break;
    case 'tent': ctx.moveTo(x - s * 0.7, y - s * 0.8); ctx.lineTo(x, y - s * 1.6); ctx.lineTo(x + s * 0.7, y - s * 0.8); break;
    case 'shell': ctx.ellipse(x, y - s, s * 0.6, s * 0.4, 0, Math.PI, 0); break;
    case 'hut': ctx.moveTo(x - s * 0.7, y - s * 0.9); ctx.quadraticCurveTo(x, y - s * 2, x + s * 0.7, y - s * 0.9); break;
    case 'leaf': ctx.moveTo(x - s * 0.6, y - s); ctx.quadraticCurveTo(x - s * 0.2, y - s * 1.8, x + s * 0.6, y - s); break;
    default: ctx.moveTo(x - s * 0.6, y - s); ctx.lineTo(x, y - s * 1.5); ctx.lineTo(x + s * 0.6, y - s);
  }
  ctx.closePath(); const rg = ctx.createLinearGradient(x - s, y - s * 2, x + s, y - s); rg.addColorStop(0, shade(col, 0.25)); rg.addColorStop(1, shade(col, -0.25)); ctx.fillStyle = rg; ctx.fill(); ctx.strokeStyle = shade(col, -0.55); ctx.stroke(); ctx.fillStyle = shade(col, -0.3); ctx.fillRect(x - s * 0.6, y - s - 1, s * 1.2, 2);
}
Art.city = function (ctx, p, z, c, col, tribe) {
  const style = ROOF[tribe] || 'peak', n = Math.min(c.level, 6), pos = [[0, 2], [-9, -1], [9, -1], [-5, -6], [5, -6], [0, -10]];
  if (c.wall) { ctx.strokeStyle = '#b8b0a0'; ctx.lineWidth = 3 * z; ctx.beginPath(); ctx.ellipse(p.x, p.y, 22 * z, 11 * z, 0, 0, 7); ctx.stroke(); }
  pos.slice(0, Math.max(1, n)).sort((a, b) => a[1] - b[1]).forEach(([dx, dy]) => house(ctx, p.x + dx * z, p.y + dy * z + 4 * z, 8 * z, c.owner >= 0 ? col : '#a08a6a', c.owner >= 0 ? style : 'hut'));
  if (c.capital) { ctx.fillStyle = '#5a3a1a'; ctx.fillRect(p.x + 12 * z, p.y - 24 * z, 1.5 * z, 20 * z); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(p.x + 13.5 * z, p.y - 24 * z); ctx.lineTo(p.x + 22 * z, p.y - 21 * z); ctx.lineTo(p.x + 13.5 * z, p.y - 18 * z); ctx.fill(); }
};
// Units: tribe headgear + weapon per class
const HAT = ['leaf', 'horns', 'sun', 'feather', 'hood', 'band', 'fin', 'antler'];
const TRIBE_KEYS = ['verdani', 'kharu', 'solenne', 'mossik', 'ashra', 'tolvi', 'tidefolk', 'wildroot'];
const cache = new Map();
Art.unit = function (ctx, x, y, z, u, col, tribe, opts) {
  if (typeof document === 'undefined') return rawUnit(ctx, x, y, z, u, col, tribe, opts);
  const sup = opts.sup ? 1.6 : 1, zq = Math.round(z * 20) / 20, key = [u.kind, u.boat, tribe, col, sup, zq, u.vet ? 1 : 0].join('|');
  let c = cache.get(key);
  if (!c) { if (cache.size > 400) cache.clear(); const S = Math.ceil(70 * zq * sup), ax = S / 2, ay = S * 0.82;
    const base = document.createElement('canvas'); base.width = base.height = S; rawUnit(base.getContext('2d'), ax, ay, zq, u, col, tribe, Object.assign({}, opts, { time: 0 }));
    const sil = document.createElement('canvas'); sil.width = sil.height = S; const sc = sil.getContext('2d'); sc.drawImage(base, 0, 0); sc.globalCompositeOperation = 'source-in'; sc.fillStyle = u.vet ? '#ffd23a' : '#141018'; sc.fillRect(0, 0, S, S);
    c = document.createElement('canvas'); c.width = c.height = S; const cc = c.getContext('2d'); const o = Math.max(1, 1.3 * zq);
    for (const [dx, dy] of [[-o, 0], [o, 0], [0, -o], [0, o], [-o, -o], [o, o], [-o, o], [o, -o]]) cc.drawImage(sil, dx, dy);
    cc.drawImage(base, 0, 0); c.ax = ax; c.ay = ay; cache.set(key, c); }
  ctx.drawImage(c, x - c.ax, y - c.ay);
  if (u.kind === 'mindbender' || u.kind === 'oracle') { ctx.fillStyle = `hsla(${(opts.time / 10) % 360},90%,70%,0.8)`; ctx.beginPath(); ctx.arc(x + 7 * z * sup, y - 26 * z * sup, 2.6 * z * sup, 0, 7); ctx.fill(); }
};
function rawUnit(ctx, x, y, z, u, col, tribe, opts) {
  const hat = HAT[TRIBE_KEYS.indexOf(tribe) % HAT.length] || 'band', sup = opts.sup, s = sup ? 1.6 : 1, k = u.kind;
  ctx.save(); ctx.translate(x, y); ctx.scale(z * s, z * s); if (opts.flip) ctx.scale(-1, 1);
  ctx.fillStyle = '#0004'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 3.5, 0, 0, 7); ctx.fill();
  if (u.boat) { const L = { raft: 10, ship: 13, battleship: 16 }[u.boat]; ctx.fillStyle = '#7a4e2a'; ctx.beginPath(); ctx.moveTo(-L, -6); ctx.lineTo(L, -6); ctx.lineTo(L - 4, 0); ctx.lineTo(-L + 4, 0); ctx.fill();
    if (u.boat !== 'raft') { ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-1, -26, 2, 20); ctx.fillStyle = '#f4f0e0'; ctx.beginPath(); ctx.moveTo(1, -25); ctx.lineTo(11, -10); ctx.lineTo(1, -10); ctx.fill(); ctx.fillStyle = col; ctx.fillRect(1, -27, 6, 3); }
    if (u.boat === 'battleship') { ctx.fillStyle = '#444'; ctx.fillRect(-12, -10, 8, 4); ctx.fillRect(-6, -9, 6, 2); }
    if (u.boat === 'raft') { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, -10, 4, 0, 7); ctx.fill(); }
    ctx.restore(); return; }
  const mounted = k === 'rider' || k === 'knight' || k === 'sunrider';
  if (mounted) { ctx.fillStyle = k === 'knight' ? '#eae4d8' : '#8a5a3a'; ctx.beginPath(); ctx.ellipse(0, -7, 9, 4.5, 0, 0, 7); ctx.fill(); ctx.fillRect(-7, -5, 2, 6); ctx.fillRect(5, -5, 2, 6); ctx.beginPath(); ctx.ellipse(9, -12, 3, 4.5, 0.5, 0, 7); ctx.fill(); }
  if (k === 'catapult') { ctx.fillStyle = '#7a5030'; ctx.fillRect(-10, -8, 20, 4); ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(-7, -3, 3, 0, 7); ctx.arc(7, -3, 3, 0, 7); ctx.fill(); ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(8, -22); ctx.stroke(); ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(8, -23, 3, 0, 7); ctx.fill(); }
  const by = mounted ? -10 : 0;
  if (k !== 'catapult') {
    ctx.fillStyle = shade(col, -0.25); ctx.fillRect(-4, by - 6, 3, 6); ctx.fillRect(1, by - 6, 3, 6);
    const tg = ctx.createLinearGradient(-6, 0, 6, 0); tg.addColorStop(0, shade(col, 0.3)); tg.addColorStop(0.6, col); tg.addColorStop(1, shade(col, -0.3)); ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(-6, by - 6); ctx.lineTo(6, by - 6); ctx.lineTo(5, by - 17); ctx.lineTo(-5, by - 17); ctx.fill();
    ctx.fillStyle = '#3a2412'; ctx.fillRect(-6, by - 9, 12, 1.6); ctx.fillStyle = '#e8c860'; ctx.fillRect(-1, by - 9, 2, 1.6);
    ctx.fillStyle = '#e8c4a0'; ctx.beginPath(); ctx.arc(0, by - 21, 4.5, 0, 7); ctx.fill(); ctx.fillStyle = '#222'; ctx.fillRect(1, by - 22, 1.5, 1.5);
    const hy = by - 25; ctx.fillStyle = shade(col, 0.3);
    if (hat === 'leaf') { ctx.beginPath(); ctx.ellipse(-3, hy, 4, 1.8, -0.5, 0, 7); ctx.ellipse(3, hy, 4, 1.8, 0.5, 0, 7); ctx.fill(); }
    else if (hat === 'horns') { ctx.fillStyle = '#ddd'; ctx.beginPath(); ctx.moveTo(-4, hy + 2); ctx.lineTo(-7, hy - 4); ctx.lineTo(-2, hy + 1); ctx.moveTo(4, hy + 2); ctx.lineTo(7, hy - 4); ctx.lineTo(2, hy + 1); ctx.fill(); }
    else if (hat === 'sun') { ctx.fillStyle = '#f8d040'; ctx.beginPath(); ctx.arc(0, hy, 3.5, Math.PI, 0); ctx.fill(); }
    else if (hat === 'feather') { ctx.fillStyle = '#f04a4a'; ctx.beginPath(); ctx.ellipse(3, hy - 2, 1.5, 5, 0.4, 0, 7); ctx.fill(); }
    else if (hat === 'hood') { ctx.fillStyle = shade(col, -0.4); ctx.beginPath(); ctx.arc(0, hy + 3, 5.2, Math.PI, 0); ctx.fill(); }
    else if (hat === 'fin') { ctx.beginPath(); ctx.moveTo(-3, hy + 2); ctx.lineTo(0, hy - 5); ctx.lineTo(3, hy + 2); ctx.fill(); }
    else if (hat === 'antler') { ctx.strokeStyle = '#a07040'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-2, hy + 2); ctx.lineTo(-5, hy - 4); ctx.lineTo(-7, hy - 2); ctx.moveTo(2, hy + 2); ctx.lineTo(5, hy - 4); ctx.lineTo(7, hy - 2); ctx.stroke(); }
    else { ctx.fillStyle = shade(col, -0.3); ctx.fillRect(-5, hy + 1, 10, 2); }
    ctx.lineWidth = 1.6; ctx.strokeStyle = '#5a3a1a';
    if (k === 'warrior') { ctx.beginPath(); ctx.moveTo(6, by - 10); ctx.lineTo(10, by - 20); ctx.stroke(); ctx.fillStyle = '#5a3a1a'; ctx.beginPath(); ctx.arc(10, by - 21, 2.2, 0, 7); ctx.fill(); }
    if (k === 'archer') { ctx.beginPath(); ctx.arc(7, by - 13, 7, -1.2, 1.2); ctx.stroke(); ctx.strokeStyle = '#ddd'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(9.5, by - 19.5); ctx.lineTo(9.5, by - 6.5); ctx.stroke(); }
    if (k === 'rider' || k === 'knight' || k === 'sunrider') { ctx.strokeStyle = '#bbb'; ctx.beginPath(); ctx.moveTo(3, by - 12); ctx.lineTo(16, by - (k === 'knight' ? 18 : 26)); ctx.stroke(); }
    if (k === 'defender' || k === 'golem') { ctx.fillStyle = shade(col, -0.4); ctx.beginPath(); ctx.moveTo(3, by - 18); ctx.lineTo(11, by - 18); ctx.lineTo(11, by - 9); ctx.lineTo(7, by - 5); ctx.lineTo(3, by - 9); ctx.fill(); ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.stroke(); }
    if (k === 'swordsman' || k === 'titan' || k === 'colossus') { ctx.strokeStyle = '#d8dce4'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(6, by - 9); ctx.lineTo(12, by - 25); ctx.stroke(); ctx.strokeStyle = '#8a6a2a'; ctx.beginPath(); ctx.moveTo(4, by - 12); ctx.lineTo(9, by - 10); ctx.stroke(); }
    if (k === 'mindbender' || k === 'oracle') { ctx.strokeStyle = '#a07040'; ctx.beginPath(); ctx.moveTo(7, by - 4); ctx.lineTo(7, by - 24); ctx.stroke(); ctx.fillStyle = `hsl(${(opts.time / 10) % 360},80%,70%)`; ctx.beginPath(); ctx.arc(7, by - 26, 2.8, 0, 7); ctx.fill(); }
    if (k === 'treant') { ctx.fillStyle = '#3a8a3a'; ctx.beginPath(); ctx.arc(0, by - 27, 7, 0, 7); ctx.fill(); }
    if (k === 'leviathan') { ctx.fillStyle = '#20b8b0'; ctx.beginPath(); ctx.moveTo(-8, by - 12); ctx.lineTo(-14, by - 18); ctx.lineTo(-12, by - 8); ctx.fill(); }
  }
  ctx.restore();
};
// ---- generated sound ----
let ac = null; Art.muted = localStorage.getItem('pg_mute') === '1';
function tone(f, d, type, vol, slide, delay) { if (Art.muted) return; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const t = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d); g.gain.setValueAtTime(vol || 0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d); } catch (e) {} }
function noise(d, vol) { if (Art.muted) return; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const b = ac.createBuffer(1, ac.sampleRate * d, ac.sampleRate), a = b.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / a.length); const s = ac.createBufferSource(), g = ac.createGain(); g.gain.value = vol || 0.2; s.buffer = b; s.connect(g).connect(ac.destination); s.start(); } catch (e) {} }
Art.sfx = {
  select: () => tone(660, 0.06, 'triangle', 0.08), move: () => { tone(300, 0.08, 'triangle', 0.1, 420); }, attack: () => { noise(0.18, 0.25); tone(180, 0.15, 'sawtooth', 0.08, 70); },
  death: () => { tone(300, 0.4, 'sawtooth', 0.1, 60); }, capture: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'square', 0.06, null, i * 0.09)),
  level: () => [392, 523, 659, 784].forEach((f, i) => tone(f, 0.25, 'triangle', 0.1, null, i * 0.07)), tech: () => { tone(880, 0.3, 'sine', 0.1, 1320); }, build: () => { tone(220, 0.07, 'square', 0.08); tone(260, 0.07, 'square', 0.08, null, 0.08); },
  coin: () => { tone(988, 0.08, 'square', 0.06); tone(1318, 0.15, 'square', 0.06, null, 0.07); }, error: () => tone(140, 0.2, 'square', 0.08), turn: () => { tone(440, 0.12, 'sine', 0.1); tone(660, 0.2, 'sine', 0.1, null, 0.1); }, peace: () => [523, 784, 1046].forEach((f, i) => tone(f, 0.4, 'sine', 0.08, null, i * 0.15)),
};
// ---- generative background music (pentatonic, original) ----
let musicOn = false, musicTimer = null, step = 0; Art.musicMuted = localStorage.getItem('pg_music') === '0';
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16], CHORDS = [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]];
function note(m, t, d, type, vol) { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = 220 * Math.pow(2, m / 12); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0008, t + d); o.connect(g).connect(Art.musicBus); o.start(t); o.stop(t + d + 0.05); }
Art.startMusic = function () { if (musicOn || Art.musicMuted) return; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume && ac.resume(); Art.musicBus = Art.musicBus || (() => { const g = ac.createGain(); g.gain.value = 0.35; g.connect(ac.destination); return g; })(); } catch (e) { return; }
  musicOn = true; let next = ac.currentTime + 0.1; const beat = 0.42;
  musicTimer = setInterval(() => { while (next < ac.currentTime + 0.6) { const bar = Math.floor(step / 8) % 4, ch = CHORDS[bar];
      if (step % 8 === 0) ch.forEach(n => note(n - 12, next, beat * 8, 'triangle', 0.035));
      if (step % 2 === 0) note(ch[0] - 24, next, beat * 1.6, 'sine', 0.07);
      const r = Math.sin(step * 12.9898 + bar * 78.233) * 43758.5453 % 1; if (Math.abs(r) > 0.35) note(SCALE[Math.floor(Math.abs(r) * 100) % SCALE.length] + (ch[0] > -3 ? 0 : -2), next, beat * 1.2, 'triangle', 0.045);
      step++; next += beat; } }, 150); };
Art.stopMusic = function () { musicOn = false; clearInterval(musicTimer); };
Art.toggleMusic = function () { Art.musicMuted = !Art.musicMuted; localStorage.setItem('pg_music', Art.musicMuted ? '0' : '1'); Art.musicMuted ? Art.stopMusic() : Art.startMusic(); return !Art.musicMuted; };
Art.musicPlaying = () => musicOn;
window.Art = Art;
})();
