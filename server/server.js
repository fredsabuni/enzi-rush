// HZE Games server: serves the games hub, each game, and a shared player + leaderboard API. No dependencies.
//   PORT=8080 DATA_DIR=./server/data node server/server.js
// Data lives in one JSON file (players + scores). Fine for a few cafés; move to SQLite/Postgres when it grows.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { makeCryptic } from './cryptic/api.js';
import { makeMsako } from './msako/api.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../game');
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(HERE, 'data'));
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PORT = +process.env.PORT || 8080;
const TZ_OFFSET = 3 * 3600e3; // Dar es Salaam (EAT, UTC+3, no DST)
const NAME_RE = /^[A-Za-z0-9_]{3,16}$/;
const BLOCKED = ['admin', 'hze', 'enzi', 'harakati', 'barista', 'staff'];
const CHARS = ['enzi', 'zuri', 'jabali'];
const PIN_RE = /^\d{4}$/;
const PIN_TRIES = 5, PIN_LOCK = 15 * 60e3; // 5 wrong PINs locks the name for 15 minutes
const MAX_DEVICES = 5;                      // phones signed in to one name at the same time
// One entry per game: the most a real run could score. Add a line here when a new game ships.
const GAMES = {
  // every bean, gold bean and stomp, plus max delivery bonuses (generous)
  safari: r => r.score >= 0 && r.score <= 60000 && r.duration >= 15 && r.duration <= 3600 && r.score <= 200 + r.duration * 600,
};

fs.mkdirSync(DATA_DIR, { recursive: true });
let db = { players: {}, scores: [] };
try { db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { }
// older data: one token per player and no game tag on scores
function upgrade(d) {
  for (const p of Object.values(d.players)) if (p.tokenHash) { p.tokens = [p.tokenHash]; delete p.tokenHash; }
  for (const s of d.scores) s.game ||= 'safari';
}
upgrade(db);
let saveTimer = null;
function writeDb() { saveTimer = null; const tmp = DB_FILE + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(db)); fs.renameSync(tmp, DB_FILE); }
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(writeDb, 300); }
// on a restart or deploy, write anything still waiting before the process exits
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => { if (saveTimer) { clearTimeout(saveTimer); writeDb(); } console.log(`${sig}: data saved, bye`); process.exit(0); });
const hash = s => crypto.createHash('sha256').update(String(s)).digest('hex');
const pinHash = (pin, salt) => crypto.scryptSync(pin, salt, 32).toString('hex');
const hasToken = (p, token) => !!token && p.tokens.includes(hash(token));
function newToken(p) { const tk = crypto.randomBytes(24).toString('hex'); p.tokens = [...p.tokens, hash(tk)].slice(-MAX_DEVICES); return tk; }

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
// best score per player in one game since `from`, ranked
function ranking(game, from) {
  const best = new Map();
  for (const s of db.scores) { if (s.game !== game || s.at < from) continue; const b = best.get(s.key); if (!b || s.score > b.score || (s.score === b.score && s.at < b.at)) best.set(s.key, s); }
  return [...best.values()].sort((a, b) => b.score - a.score || a.at - b.at).map((s, i) => ({ rank: i + 1, name: db.players[s.key]?.name || s.key, score: s.score, char: s.char, loc: s.loc || null, key: s.key }));
}

const cryptic = makeCryptic({ db, save, send: (...a) => send(...a), body: r => body(r), limited: (k, m) => limited(k, m), dir: process.env.PUZZLE_DIR || path.join(HERE, 'puzzles/cryptic'),
  auth: (name, token) => { const key = String(name || '').toLowerCase(), p = db.players[key]; return p && hasToken(p, token) ? key : null; } });

const msako = makeMsako({ db, save, send: (...a) => send(...a), body: r => body(r), limited: (k, m) => limited(k, m),
  auth: (name, token) => { const key = String(name || '').toLowerCase(), p = db.players[key]; return p && hasToken(p, token) ? key : null; } });

const SECURITY = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin', 'x-frame-options': 'SAMEORIGIN' };
function send(res, code, obj) { res.writeHead(code, { ...SECURITY, 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(obj)); }
function body(req, max = 4096) { return new Promise((ok, bad) => { let s = ''; req.on('data', c => { s += c; if (s.length > max) { bad(new Error('too big')); req.destroy(); } }); req.on('end', () => { try { ok(JSON.parse(s || '{}')); } catch (e) { bad(e); } }); }); }

async function api(req, res, url) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (url.pathname === '/api/health') return send(res, 200, { ok: true });
  // the crossword saves progress every few seconds, so it is limited per player instead of per café Wi-Fi address
  if (url.pathname.startsWith('/api/cryptic/')) return cryptic(req, res, url);
  if (url.pathname.startsWith('/api/msako/')) return msako(req, res, url);
  if (req.method === 'POST' && limited(ip)) return send(res, 429, { error: 'slow down' });
  if (url.pathname.startsWith('/api/admin/')) return admin(req, res, url, ip);

  // Sign in or sign up with one call: { name, pin } or { name, token }.
  //  new name + pin       → creates the player
  //  known name + token   → this phone is already signed in (a pin here sets one if the player has none)
  //  known name + pin     → returning player on a new phone
  if (req.method === 'POST' && url.pathname === '/api/register') {
    const { name, token, pin } = await body(req);
    if (!NAME_RE.test(name || '') || BLOCKED.some(b => name.toLowerCase().includes(b))) return send(res, 400, { error: 'bad name' });
    if (pin !== undefined && !PIN_RE.test(String(pin))) return send(res, 400, { error: 'bad pin' });
    const key = name.toLowerCase(), p = db.players[key], now = Date.now();
    if (!p) {
      if (!pin) return send(res, 400, { error: 'pin required' });
      const salt = crypto.randomBytes(8).toString('hex');
      db.players[key] = { name, tokens: [], pinSalt: salt, pinHash: pinHash(String(pin), salt), created: now };
      const tk = newToken(db.players[key]); save();
      return send(res, 201, { name, token: tk, hasPin: true, created: true });
    }
    if (hasToken(p, token)) {
      if (pin && !p.pinHash) { p.pinSalt = crypto.randomBytes(8).toString('hex'); p.pinHash = pinHash(String(pin), p.pinSalt); save(); }
      return send(res, 200, { name: p.name, token, hasPin: !!p.pinHash });
    }
    if (!p.pinHash || !pin) return send(res, 409, { error: 'taken', hasPin: !!p.pinHash });
    if (p.lockUntil > now) return send(res, 423, { error: 'locked', retryIn: Math.ceil((p.lockUntil - now) / 60e3) });
    if (pinHash(String(pin), p.pinSalt) !== p.pinHash) {
      p.fails = (p.fails || 0) + 1;
      if (p.fails >= PIN_TRIES) { p.lockUntil = now + PIN_LOCK; p.fails = 0; save(); return send(res, 423, { error: 'locked', retryIn: PIN_LOCK / 60e3 }); }
      save(); return send(res, 403, { error: 'wrong pin', triesLeft: PIN_TRIES - p.fails });
    }
    p.fails = 0; delete p.lockUntil;
    const tk = newToken(p); save();
    return send(res, 200, { name: p.name, token: tk, hasPin: true });
  }

  if (req.method === 'POST' && url.pathname === '/api/scores') {
    const r = await body(req), key = String(r.name || '').toLowerCase(), p = db.players[key];
    if (!p || !hasToken(p, r.token)) return send(res, 401, { error: 'unknown player' });
    const game = r.game || 'safari', plausible = GAMES[game];
    if (!plausible) return send(res, 400, { error: 'unknown game' });
    const run = { score: Math.floor(+r.score), duration: Math.floor(+r.duration) };
    if (!Number.isFinite(run.score) || !plausible(run)) return send(res, 422, { error: 'implausible score' });
    const prevBest = Math.max(0, ...db.scores.filter(s => s.key === key && s.game === game).map(s => s.score));
    const num = k => clamp(Math.floor(+r[k] || 0), 0, 9999);
    db.scores.push({ key, game, score: run.score, at: Date.now(), char: CHARS.includes(r.char) ? r.char : 'enzi', loc: /^[a-z0-9_-]{1,24}$/.test(r.loc || '') ? r.loc : null,
      duration: run.duration, beans: num('beans'), gold: num('gold'), stomps: num('stomps'), fines: num('fines'), hits: num('hits'), delivered: num('delivered'), won: !!r.won });
    save();
    const rk = from => ranking(game, from).find(e => e.key === key)?.rank;
    return send(res, 200, { ok: true, newBest: run.score > prevBest, best: Math.max(prevBest, run.score), rankToday: rk(periodStart('today')), rankWeek: rk(periodStart('week')), rankAll: rk(0) });
  }

  if (req.method === 'GET' && url.pathname === '/api/leaderboard') {
    const game = url.searchParams.get('game') || 'safari';
    if (!GAMES[game]) return send(res, 400, { error: 'unknown game' });
    const period = ['today', 'week', 'all'].includes(url.searchParams.get('period')) ? url.searchParams.get('period') : 'today';
    const limit = clamp(+url.searchParams.get('limit') || 50, 1, 100), me = (url.searchParams.get('name') || '').toLowerCase();
    const all = ranking(game, periodStart(period)), strip = ({ key, ...e }) => e;
    return send(res, 200, { game, period, players: all.length, top: all.slice(0, limit).map(strip), me: me ? (all.find(e => e.key === me) ? strip(all.find(e => e.key === me)) : null) : null });
  }
  send(res, 404, { error: 'not found' });
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---- admin: back up and move the data file. Off unless ADMIN_TOKEN is set (16+ characters).
//   curl -H "Authorization: Bearer $ADMIN_TOKEN" https://<host>/api/admin/export > backup.json
//   curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" -H 'content-type: application/json' --data-binary @server/data/db.json https://<host>/api/admin/import
// Import only works while the server has no players, unless ?replace=1 is added.
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
function isAdmin(req) {
  const got = Buffer.from(String(req.headers.authorization || '').replace(/^Bearer /, '')), want = Buffer.from(ADMIN_TOKEN);
  return ADMIN_TOKEN.length >= 16 && got.length === want.length && crypto.timingSafeEqual(got, want);
}
async function admin(req, res, url, ip) {
  if (!ADMIN_TOKEN) return send(res, 404, { error: 'not found' });
  if (limited('admin:' + ip, 10)) return send(res, 429, { error: 'slow down' });
  if (!isAdmin(req)) return send(res, 401, { error: 'wrong token' });
  const route = url.pathname.slice('/api/admin/'.length);
  if (req.method === 'GET' && route === 'export') {
    res.writeHead(200, { ...SECURITY, 'content-type': 'application/json', 'cache-control': 'no-store', 'content-disposition': `attachment; filename="hze-db-${new Date().toISOString().slice(0, 10)}.json"` });
    return res.end(JSON.stringify(db));
  }
  if (req.method === 'POST' && route === 'import') {
    const d = await body(req, 50e6);
    if (!d || typeof d.players !== 'object' || !Array.isArray(d.scores)) return send(res, 400, { error: 'not a db.json file' });
    const have = Object.keys(db.players).length;
    if (have && url.searchParams.get('replace') !== '1') return send(res, 409, { error: `server already has ${have} players; add ?replace=1 to overwrite them` });
    upgrade(d);
    // the crossword and word hunt keep references to their session objects, so fill those in place
    const fill = (into, from) => { for (const k of Object.keys(into)) delete into[k]; Object.assign(into, from || {}); };
    fill(db.players, d.players); db.scores.length = 0; db.scores.push(...d.scores);
    fill(db.cryptic.sessions, d.cryptic?.sessions); fill(db.msako.sessions, d.msako?.sessions);
    clearTimeout(saveTimer); writeDb();
    console.log(`[admin] imported ${Object.keys(db.players).length} players, ${db.scores.length} scores`);
    return send(res, 200, { ok: true, players: Object.keys(db.players).length, scores: db.scores.length });
  }
  send(res, 404, { error: 'not found' });
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon' };
function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname); if (p.endsWith('/')) p += 'index.html';
  const file = path.resolve(ROOT, '.' + p);
  if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => {
    if (!err && st.isDirectory()) { res.writeHead(301, { location: url.pathname + '/' + url.search }); return res.end(); }
    if (err || !st.isFile()) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('not found'); }
    const ext = path.extname(file);
    res.writeHead(200, { ...SECURITY, 'content-type': TYPES[ext] || 'application/octet-stream', 'cache-control': ext === '.ttf' || ext === '.svg' ? 'public, max-age=604800' : 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try { if (url.pathname.startsWith('/api/')) await api(req, res, url); else serveStatic(req, res, url); }
  catch (e) { send(res, 400, { error: 'bad request' }); }
}).listen(PORT, () => console.log(`HZE Games → http://localhost:${PORT} (data in ${DATA_DIR})`));
