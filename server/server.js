// HZE Delivery Safari server: serves the game and a small leaderboard API. No dependencies.
//   PORT=8080 DATA_DIR=./server/data node server/server.js
// Data lives in one JSON file (players + scores). Fine for a few cafés; move to SQLite/Postgres when it grows.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../game');
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(HERE, 'data'));
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PORT = +process.env.PORT || 8080;
const TZ_OFFSET = 3 * 3600e3; // Dar es Salaam (EAT, UTC+3, no DST)
const NAME_RE = /^[A-Za-z0-9_]{3,16}$/;
const BLOCKED = ['admin', 'hze', 'enzi', 'harakati', 'barista', 'staff'];
const CHARS = ['enzi', 'zuri', 'jabali'];

fs.mkdirSync(DATA_DIR, { recursive: true });
let db = { players: {}, scores: [] };
try { db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { }
let saveTimer = null;
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(() => { const tmp = DB_FILE + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(db)); fs.renameSync(tmp, DB_FILE); }, 300); }
const hash = s => crypto.createHash('sha256').update(String(s)).digest('hex');

// ---- tiny per-IP rate limit
const hits = new Map();
function limited(ip, max = 30) { const now = Date.now(), h = (hits.get(ip) || []).filter(t => now - t < 60e3); h.push(now); hits.set(ip, h); return h.length > max; }
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.some(t => now - t < 60e3)) hits.delete(k); }, 60e3).unref();

function periodStart(p, now = Date.now()) {
  const day = 86400e3, local = now + TZ_OFFSET, dayStart = Math.floor(local / day) * day - TZ_OFFSET;
  if (p === 'today') return dayStart;
  if (p === 'week') { const dow = (new Date(local).getUTCDay() + 6) % 7; return dayStart - dow * day; } // Monday
  return 0;
}
// best score per player since `from`, ranked
function ranking(from) {
  const best = new Map();
  for (const s of db.scores) { if (s.at < from) continue; const b = best.get(s.key); if (!b || s.score > b.score || (s.score === b.score && s.at < b.at)) best.set(s.key, s); }
  return [...best.values()].sort((a, b) => b.score - a.score || a.at - b.at).map((s, i) => ({ rank: i + 1, name: db.players[s.key]?.name || s.key, score: s.score, char: s.char, loc: s.loc || null, key: s.key }));
}
// a run can't score more than this: every bean, gold bean and stomp, plus max delivery bonuses (generous)
const plausible = r => r.score >= 0 && r.score <= 60000 && r.duration >= 15 && r.duration <= 3600 && r.score <= 200 + r.duration * 600;

function send(res, code, obj) { res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(obj)); }
function body(req) { return new Promise((ok, bad) => { let s = ''; req.on('data', c => { s += c; if (s.length > 4096) { bad(new Error('too big')); req.destroy(); } }); req.on('end', () => { try { ok(JSON.parse(s || '{}')); } catch (e) { bad(e); } }); }); }

async function api(req, res, url) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (url.pathname === '/api/health') return send(res, 200, { ok: true });
  if (req.method === 'POST' && limited(ip)) return send(res, 429, { error: 'slow down' });

  if (req.method === 'POST' && url.pathname === '/api/register') {
    const { name, token } = await body(req);
    if (!NAME_RE.test(name || '') || BLOCKED.some(b => name.toLowerCase().includes(b))) return send(res, 400, { error: 'bad name' });
    const key = name.toLowerCase(), p = db.players[key];
    if (p) { if (token && hash(token) === p.tokenHash) return send(res, 200, { name: p.name, token }); return send(res, 409, { error: 'taken' }); }
    const tk = crypto.randomBytes(24).toString('hex');
    db.players[key] = { name, tokenHash: hash(tk), created: Date.now() }; save();
    return send(res, 201, { name, token: tk });
  }

  if (req.method === 'POST' && url.pathname === '/api/scores') {
    const r = await body(req), key = String(r.name || '').toLowerCase(), p = db.players[key];
    if (!p || !r.token || hash(r.token) !== p.tokenHash) return send(res, 401, { error: 'unknown player' });
    const run = { score: Math.floor(+r.score), duration: Math.floor(+r.duration) };
    if (!Number.isFinite(run.score) || !plausible(run)) return send(res, 422, { error: 'implausible score' });
    const prevBest = Math.max(0, ...db.scores.filter(s => s.key === key).map(s => s.score));
    const num = k => clamp(Math.floor(+r[k] || 0), 0, 9999);
    db.scores.push({ key, score: run.score, at: Date.now(), char: CHARS.includes(r.char) ? r.char : 'enzi', loc: /^[a-z0-9_-]{1,24}$/.test(r.loc || '') ? r.loc : null,
      duration: run.duration, beans: num('beans'), gold: num('gold'), stomps: num('stomps'), fines: num('fines'), hits: num('hits'), delivered: num('delivered'), won: !!r.won });
    save();
    const rk = from => ranking(from).find(e => e.key === key)?.rank;
    return send(res, 200, { ok: true, newBest: run.score > prevBest, best: Math.max(prevBest, run.score), rankToday: rk(periodStart('today')), rankWeek: rk(periodStart('week')), rankAll: rk(0) });
  }

  if (req.method === 'GET' && url.pathname === '/api/leaderboard') {
    const period = ['today', 'week', 'all'].includes(url.searchParams.get('period')) ? url.searchParams.get('period') : 'today';
    const limit = clamp(+url.searchParams.get('limit') || 50, 1, 100), me = (url.searchParams.get('name') || '').toLowerCase();
    const all = ranking(periodStart(period)), strip = ({ key, ...e }) => e;
    return send(res, 200, { period, players: all.length, top: all.slice(0, limit).map(strip), me: me ? (all.find(e => e.key === me) ? strip(all.find(e => e.key === me)) : null) : null });
  }
  send(res, 404, { error: 'not found' });
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon' };
function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname); if (p.endsWith('/')) p += 'index.html';
  const file = path.resolve(ROOT, '.' + p);
  if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('not found'); }
    const ext = path.extname(file);
    res.writeHead(200, { 'content-type': TYPES[ext] || 'application/octet-stream', 'cache-control': ext === '.ttf' || ext === '.svg' ? 'public, max-age=604800' : 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try { if (url.pathname.startsWith('/api/')) await api(req, res, url); else serveStatic(req, res, url); }
  catch (e) { send(res, 400, { error: 'bad request' }); }
}).listen(PORT, () => console.log(`HZE Delivery Safari → http://localhost:${PORT}`));
