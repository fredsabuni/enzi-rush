// Kahawa Iko Wapi? (daily hidden coffee bags) API.
// One line drawing a day for everyone (changes at 05:00 EAT), with coffee bags hidden on it.
// Scenes live in server/kahawa/scenes/<id>.json (name, size, hiding spots) with the picture in
// game/kahawa/scenes/. Each day picks a scene and 12 of its hiding spots, so a scene looks different
// every time it comes back. The day's pick is saved, so adding a scene never changes a day already played.
// The phone never gets the bag list: it shows the outlines as one picture (bags.svg), sends each tap,
// and the server says whether it was a bag. Points add up day after day for the month and all-time boards.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { bagSvg, onBag, KIND_NAMES } from '../../game/kahawa/bags.mjs';

const DAY = 86400e3, EAT = 3 * 3600e3, ROLLOVER = 5 * 3600e3, LAUNCH = Date.UTC(2026, 10, 6);
export const SCORE = { bag: 100, gold: 300, finish: 300, par: 300, perSec: 2, clean: 200, miss: 10, floor: 30 };
export const HINT_COST = 100;
const BAGS_PER_DAY = 12;
const MISS_BURST = 3, MISS_WINDOW = 5e3, COOLDOWN = 3e3; // 3 misses in 5 s → taps pause for 3 s
const MIN_GAP = 400;                                    // two finds can't be closer together than this
const PING_GAP = 30e3;                                  // gaps between requests longer than this count as time away

function rng(seed) { // mulberry32, seeded from a string
  let h = parseInt(crypto.createHash('sha256').update(seed).digest('hex').slice(0, 8), 16);
  return () => { h = h + 0x6D2B79F5 | 0; let t = Math.imul(h ^ h >>> 15, 1 | h); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const shuffle = (a, r) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export const dayKey = (now = Date.now()) => new Date(now + EAT - ROLLOVER).toISOString().slice(0, 10);
const dayNum = day => Math.round((Date.parse(day + 'T00:00:00Z') - LAUNCH) / DAY) + 1;
const shiftDay = (day, n) => new Date(Date.parse(day + 'T00:00:00Z') + n * DAY).toISOString().slice(0, 10);
const monthOf = day => day.slice(0, 7);

export function loadScenes(dir) {
  const out = new Map();
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort() : []) {
    try {
      const s = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      if (!s.id || !s.image || !(s.w > 0) || !(s.h > 0) || !Array.isArray(s.spots)) throw new Error('needs id, image, w, h and spots');
      if (s.spots.length < BAGS_PER_DAY) throw new Error(`only ${s.spots.length} hiding spots, needs at least ${BAGS_PER_DAY}`);
      out.set(s.id, s);
    } catch (e) { console.warn(`[kahawa] skipping scene ${f}: ${e.message}`); }
  }
  return out;
}

// Pick 12 hiding spots that don't overlap, then give each bag its own shape, size and tilt.
export function placeBags(scene, seed) {
  const r = rng(seed), picked = [];
  for (const sp of shuffle(scene.spots, r)) {
    const s = Math.round((sp.s || 70) * (.9 + r() * .2));
    if (picked.some(p => Math.hypot(p.x - sp.x, p.y - sp.y) < (p.s + s) * .45)) continue;
    picked.push({ x: Math.round(sp.x), y: Math.round(sp.y), s, r: Math.round((sp.r || 0) + (r() * 30 - 15)), kind: KIND_NAMES[Math.floor(r() * KIND_NAMES.length)], flip: r() < .5 });
    if (picked.length === BAGS_PER_DAY) break;
  }
  picked[Math.floor(r() * picked.length)].gold = true;
  return picked;
}

export function makeKahawa({ db, save, send, body, auth, limited, scenesDir }) {
  db.kahawa ||= {};
  const K = db.kahawa; K.sessions ||= {}; K.days ||= {}; K.totals ||= {};
  const S = K.sessions;
  const scenes = loadScenes(scenesDir);
  console.log(`[kahawa] ${scenes.size} scene${scenes.size === 1 ? '' : 's'}: ${[...scenes.keys()].join(', ')}`);
  // keep a month of sessions and two months of daily picks; totals keep the points
  const cutoff = shiftDay(dayKey(), -30);
  for (const k of Object.keys(S)) if (S[k].day < cutoff) delete S[k];
  for (const d of Object.keys(K.days)) if (d < shiftDay(dayKey(), -60)) delete K.days[d];

  // The scene for a day: the one shown longest ago (never yesterday's), ties broken by the date.
  function puzzle(day) {
    if (K.days[day] && scenes.has(K.days[day].scene)) return withScene(day, K.days[day]);
    if (!scenes.size) return null;
    if (day > dayKey() || Date.parse(day + 'T00:00:00Z') < LAUNCH) return null; // never tomorrow, nothing before launch
    const lastUsed = new Map(), prev = K.days[shiftDay(day, -1)]?.scene;
    for (const [d, v] of Object.entries(K.days)) if (d < day && (!lastUsed.has(v.scene) || lastUsed.get(v.scene) < d)) lastUsed.set(v.scene, d);
    const r = rng('kahawa-scene-' + day);
    const pool = shuffle([...scenes.keys()], r).filter(id => scenes.size === 1 || id !== prev);
    pool.sort((a, b) => (lastUsed.get(a) || '').localeCompare(lastUsed.get(b) || ''));
    const scene = scenes.get(pool[0]);
    K.days[day] = { scene: scene.id, bags: placeBags(scene, 'kahawa-bags-' + day) }; save();
    return withScene(day, K.days[day]);
  }
  const withScene = (day, d) => { const sc = scenes.get(d.scene); return { id: day, num: dayNum(day), scene: sc, bags: d.bags }; };
  const publicPuzzle = P => ({ id: P.id, num: P.num, name: P.scene.name, image: P.scene.image, w: P.scene.w, h: P.scene.h, line: P.scene.line || 3, count: P.bags.length, score: SCORE, hintCost: HINT_COST });

  const sKey = (player, day) => player + '|' + day;
  function session(player, P, create = true) {
    const k = sKey(player, P.id);
    if (!S[k] && create) S[k] = { player, day: P.id, found: {}, hints: [], pen: 0, misses: 0, missAt: [], coolUntil: 0, lastFind: 0, active: 0, last: Date.now(), done: null, score: 0, counted: 0 };
    return S[k];
  }
  function touch(s) { const now = Date.now(), gap = now - s.last; if (gap > 0 && gap <= PING_GAP && !s.done) s.active += gap; s.last = now; }

  // Points so far today. Bags count as soon as they're found; the bonuses come when the last one is.
  function rescore(s, P) {
    const bags = Object.keys(s.found).reduce((a, i) => a + (P.bags[i].gold ? SCORE.gold : SCORE.bag), 0);
    const b = s.done ? s.breakdown : null;
    s.score = Math.max(0, bags + (b ? b.finish + b.timeBonus + b.clean : 0) - s.pen);
    // keep the month and all-time totals in step (a run flagged as too fast counts for nothing)
    const want = s.flagged ? 0 : s.score, delta = want - s.counted;
    if (delta) {
      const t = K.totals[s.player] ||= { all: 0, months: {}, days: 0, at: 0 };
      t.all += delta; t.months[monthOf(s.day)] = (t.months[monthOf(s.day)] || 0) + delta; t.at = Date.now();
      if (!s.counted && want) t.days++; else if (s.counted && !want) t.days--;
      s.counted = want;
    }
  }
  function finishIfDone(s, P) {
    if (s.done || Object.keys(s.found).length < P.bags.length) return;
    const secs = Math.round(s.active / 1000);
    s.breakdown = { bags: Object.keys(s.found).reduce((a, i) => a + (P.bags[i].gold ? SCORE.gold : SCORE.bag), 0), finish: SCORE.finish,
      timeBonus: Math.max(0, SCORE.par - secs) * SCORE.perSec, clean: s.hints.length ? 0 : SCORE.clean, penalties: s.pen, misses: s.misses, secs };
    s.done = Date.now(); s.flagged = secs < SCORE.floor;
  }

  function view(s, P) {
    return {
      found: Object.keys(s.found).map(i => ({ i: +i, ...P.bags[i] })),
      hints: s.hints.filter(h => !s.found[h.bag]).map(({ x, y, r }) => ({ x, y, r })),
      count: P.bags.length, gold: P.bags.some((b, i) => b.gold && s.found[i]),
      activeMs: s.active, score: s.score, misses: s.misses, penalty: s.pen, hintsUsed: s.hints.length,
      coolMs: Math.max(0, s.coolUntil - Date.now()), done: s.done ? result(s) : null,
    };
  }

  // ---- leaderboards: today's points, this month's total, all-time total
  const nameOf = k => db.players[k]?.name || k;
  function rankToday(day) {
    return Object.values(S).filter(s => s.day === day && s.score > 0 && !s.flagged)
      .sort((a, b) => b.score - a.score || (a.done || Infinity) - (b.done || Infinity) || a.active - b.active)
      .map((s, i) => ({ rank: i + 1, name: nameOf(s.player), score: s.score, found: Object.keys(s.found).length, of: K.days[day]?.bags.length || BAGS_PER_DAY, done: !!s.done, secs: Math.round(s.active / 1000), player: s.player }));
  }
  function rankTotal(month) {
    return Object.entries(K.totals).map(([player, t]) => ({ player, score: month ? t.months[month] || 0 : t.all, days: t.days, at: t.at }))
      .filter(e => e.score > 0).sort((a, b) => b.score - a.score || a.at - b.at)
      .map((e, i) => ({ rank: i + 1, name: nameOf(e.player), score: e.score, days: month ? undefined : e.days, player: e.player }));
  }
  function result(s) {
    const r = rankToday(s.day), me = r.find(e => e.player === s.player), t = K.totals[s.player];
    return { score: s.score, breakdown: s.breakdown, secs: Math.round(s.active / 1000), rank: me?.rank || null, of: r.length, flagged: !!s.flagged,
      month: t?.months[monthOf(s.day)] || 0, all: t?.all || 0 };
  }

  // ---- a tap at scene point x,y
  function find(s, P, x, y) {
    if (![x, y].every(Number.isFinite) || x < 0 || y < 0 || x > P.scene.w || y > P.scene.h) return { error: 'bad tap' };
    const now = Date.now();
    if (now < s.coolUntil) return { cooling: true };
    if (now - s.lastFind < MIN_GAP) return { cooling: true };
    // the closest bag under the finger, found or not
    let hit = -1, best = Infinity;
    P.bags.forEach((b, i) => { if (!onBag(b, x, y)) return; const d = Math.hypot(b.x - x, b.y - y); if (d < best) { best = d; hit = i; } });
    if (hit >= 0 && s.found[hit]) return { already: true };
    if (hit < 0) {
      s.misses++; s.pen += SCORE.miss;
      s.missAt = [...s.missAt.filter(t => now - t < MISS_WINDOW), now];
      if (s.missAt.length >= MISS_BURST) { s.coolUntil = now + COOLDOWN; s.missAt = []; }
      rescore(s, P);
      return { miss: true, cost: SCORE.miss, cooling: now < s.coolUntil };
    }
    s.found[hit] = now; s.lastFind = now;
    finishIfDone(s, P); rescore(s, P);
    return { bag: { i: hit, ...P.bags[hit] }, points: P.bags[hit].gold ? SCORE.gold : SCORE.bag };
  }
  // a circle somewhere around one bag still hidden
  function hint(s, P) {
    const open = P.bags.map((b, i) => ({ b, i })).filter(({ i }) => !s.found[i] && !s.hints.some(h => h.bag === i));
    if (!open.length) return { error: P.bags.every((_, i) => s.found[i]) ? 'all found' : 'every bag left already has a circle' };
    const { b, i } = open[Math.floor(Math.random() * open.length)];
    const r = Math.round(b.s * 2.2), a = Math.random() * Math.PI * 2, off = Math.random() * r * .55;
    s.hints.push({ bag: i, x: Math.round(b.x + Math.cos(a) * off), y: Math.round(b.y + Math.sin(a) * off), r });
    s.pen += HINT_COST; rescore(s, P);
    return { cost: HINT_COST };
  }

  // the hidden outlines for one day, as one picture laid over the drawing
  function overlay(P) {
    const line = P.scene.line || 3;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${P.scene.w} ${P.scene.h}" width="${P.scene.w}" height="${P.scene.h}">${P.bags.map(b => bagSvg(b, 'outline', line)).join('')}</svg>`;
  }

  return async function handle(req, res, url) {
    const route = url.pathname.slice('/api/kahawa/'.length), today = dayKey();
    if (!scenes.size) return send(res, 503, { error: 'no scenes yet' });

    if (req.method === 'GET' && route === 'bags.svg') {
      const day = url.searchParams.get('day');
      if (day !== today && day !== shiftDay(today, -1)) return send(res, 404, { error: 'not found' });
      res.writeHead(200, { 'content-type': 'image/svg+xml', 'cache-control': 'private, max-age=3600', 'x-content-type-options': 'nosniff' });
      return res.end(overlay(puzzle(day)));
    }
    if (req.method === 'GET' && route === 'board') {
      const period = ['today', 'yesterday', 'month', 'all'].includes(url.searchParams.get('period')) ? url.searchParams.get('period') : 'today';
      const me = (url.searchParams.get('name') || '').toLowerCase(), strip = ({ player, ...e }) => e;
      const day = period === 'yesterday' ? shiftDay(today, -1) : today, P = puzzle(day);
      const r = period === 'month' ? rankTotal(monthOf(today)) : period === 'all' ? rankTotal(null) : rankToday(day);
      const mine = me ? r.find(e => e.player === me) : null;
      return send(res, 200, { period, day, num: P?.num, name: P?.scene.name, month: monthOf(today), players: r.length, top: r.slice(0, 25).map(strip), me: mine ? strip(mine) : null });
    }
    if (req.method === 'GET' && route === 'teaser') {
      const P = puzzle(today), top = rankToday(today)[0];
      return send(res, 200, { text: top ? `Leo: ${top.name} · ${top.score.toLocaleString('en')}` : `Leo: ${P.scene.name.sw} · mifuko ${P.bags.length}` });
    }
    if (req.method === 'GET' && route === 'yesterday') {
      const P = puzzle(shiftDay(today, -1)); if (!P) return send(res, 404, { error: 'nothing yesterday' });
      return send(res, 200, { ...publicPuzzle(P), bags: P.bags });
    }

    if (req.method !== 'POST') return send(res, 404, { error: 'not found' });
    const b = await body(req), player = auth(b.name, b.token);
    if (!player) return send(res, 401, { error: 'sign in first' });
    if (limited('kahawa:' + player, 200)) return send(res, 429, { error: 'slow down' });
    const P = puzzle(today);

    if (route === 'home') {
      const s = session(player, P, false), t = K.totals[player];
      return send(res, 200, { num: P.num, name: P.scene.name, count: P.bags.length, found: s ? Object.keys(s.found).length : 0, score: s?.score || 0,
        state: s?.done ? 'done' : s ? 'started' : 'new', result: s?.done ? result(s) : null, month: t?.months[monthOf(today)] || 0, all: t?.all || 0 });
    }
    // a phone left open overnight is still on yesterday's drawing
    if (b.day && b.day !== P.id && route !== 'open') return send(res, 410, { error: 'new scene', day: P.id });
    if (route === 'open') { const s = session(player, P); s.last = Date.now(); save(); return send(res, 200, { puzzle: publicPuzzle(P), session: view(s, P) }); }

    const s = session(player, P, false); if (!s) return send(res, 409, { error: 'open the scene first' });
    touch(s);
    let out;
    if (route === 'ping') out = {};
    else if (s.done) out = { error: 'already finished' };
    else if (route === 'find') out = find(s, P, +b.x, +b.y);
    else if (route === 'hint') out = hint(s, P);
    else return send(res, 404, { error: 'not found' });
    save();
    return send(res, out.error ? 400 : 200, { ...out, session: view(s, P) });
  };
}
