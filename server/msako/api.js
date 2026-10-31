// Msako wa Maneno (daily word hunt) API.
// A new 8×8 grid every day at 05:00 EAT, built from a theme in themes.js. The grid is made from the date,
// so every player gets the same puzzle and nothing has to be written by hand. The phone gets the letters
// and the word lengths only: it sends the start and end square of each swipe and the server says what it found.
// Letters no theme word uses spell a hidden Swahili phrase ("neno la siri"); guessing it early earns a bonus.
import crypto from 'node:crypto';
import { THEMES, PHRASES } from './themes.js';

const N = 8, DAY = 86400e3, EAT = 3 * 3600e3, ROLLOVER = 5 * 3600e3, LAUNCH = Date.UTC(2026, 9, 31);
// right, down and the two forward diagonals first. Each direction gets a fixed share of the words
// (DIR_SHARE), however many spots it has, so long words don't all end up straight across or down.
const DIRS = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];
const DIR_SHARE = [2, 2, 3, 3, 1, 1, 1.5, 1.5];
export const SCORE = { base: 1000, par: 240, perSec: 4, clean: 200, secret: 300, wrongGuess: 50, guesses: 3, floor: 25 };
export const HINTS = { first: 60, reveal: 150 };
const PING_GAP = 30e3; // gaps between requests longer than this count as time away

const letters = s => String(s || '').toUpperCase().replace(/[^A-Z]/g, '');
const PHRASE_LENS = new Map();
for (const p of PHRASES) { const n = letters(p).length; PHRASE_LENS.set(n, [...(PHRASE_LENS.get(n) || []), p]); }

function rng(seed) { // mulberry32, seeded from a string
  let h = parseInt(crypto.createHash('sha256').update(seed).digest('hex').slice(0, 8), 16);
  return () => { h = h + 0x6D2B79F5 | 0; let t = Math.imul(h ^ h >>> 15, 1 | h); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const shuffle = (a, r) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const line = (r, c, [dr, dc], len) => { const out = []; for (let k = 0; k < len; k++) { const y = r + dr * k, x = c + dc * k; if (y < 0 || x < 0 || y >= N || x >= N) return null; out.push(y * N + x); } return out; };
function occurs(g, w) {
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) for (const d of DIRS) { const cs = line(r, c, d, w.length); if (cs && cs.every((i, k) => g[i] === w[k])) return true; }
  return false;
}

export const dayKey = (now = Date.now()) => new Date(now + EAT - ROLLOVER).toISOString().slice(0, 10);
const dayNum = day => Math.round((Date.parse(day + 'T00:00:00Z') - LAUNCH) / DAY) + 1;
const shiftDay = (day, n) => new Date(Date.parse(day + 'T00:00:00Z') + n * DAY).toISOString().slice(0, 10);

// Go through every theme once, in a shuffled order, before any repeats; never the same theme two days running.
const orders = new Map();
function cycleOrder(cycle) {
  if (orders.has(cycle)) return orders.get(cycle);
  const T = THEMES.length, order = shuffle(THEMES.map((_, k) => k), rng('msako-cycle-' + cycle));
  if (cycle > -2 && order[0] === cycleOrder(cycle - 1)[T - 1]) order.push(order.shift());
  orders.set(cycle, order); return order;
}
function themeIndex(num) { const T = THEMES.length, n = num - 1; return cycleOrder(Math.floor(n / T))[((n % T) + T) % T]; }

// Build the puzzle for one day. Same day in, same puzzle out.
export function generate(day) {
  const num = dayNum(day), theme = THEMES[themeIndex(num)];
  const r = rng('msako-' + day);
  for (let attempt = 0; attempt < 3000; attempt++) {
    const g = Array(N * N).fill(null), placed = [];
    const words = shuffle(theme.words, r).sort((a, b) => b.length - a.length + (r() - .5) * 4);
    for (const w of words) {
      if (placed.length >= 10) break;
      if (placed.some(p => p.w.includes(w) || w.includes(p.w))) continue;
      const opts = []; let total = 0;
      for (let d = 0; d < 8; d++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const cs = line(y, x, DIRS[d], w.length); if (!cs) continue;
        let overlap = 0, ok = true;
        for (let k = 0; k < cs.length; k++) { const v = g[cs[k]]; if (v === null) continue; if (v !== w[k]) { ok = false; break; } overlap++; }
        if (!ok || overlap === w.length) continue;
        opts.push({ cs, d, wt: 1 + overlap * 2 });
      }
      if (!opts.length) continue;
      const perDir = DIRS.map((_, d) => opts.filter(o => o.d === d).reduce((a, o) => a + o.wt, 0));
      for (const o of opts) { o.wt *= DIR_SHARE[o.d] / perDir[o.d]; total += o.wt; }
      let pick = r() * total, o = opts[0]; for (o of opts) { pick -= o.wt; if (pick <= 0) break; }
      o.cs.forEach((c, k) => { g[c] = w[k]; }); placed.push({ w, cells: o.cs });
      // enough words, and the empty squares fit a phrase exactly: fill them and check nothing extra crept in
      const empty = g.reduce((a, v, c) => v === null ? [...a, c] : a, []), choices = PHRASE_LENS.get(empty.length);
      if (placed.length < 7 || !choices) continue;
      const phrase = choices[Math.floor(r() * choices.length)], pl = letters(phrase), full = [...g];
      empty.forEach((c, k) => { full[c] = pl[k]; });
      const unused = theme.words.filter(u => !placed.some(p => p.w === u || p.w.includes(u)));
      if (unused.some(u => occurs(full, u) || occurs(full, [...u].reverse().join('')))) continue;
      const list = placed.sort((a, b) => a.w.length - b.w.length || a.w.localeCompare(b.w));
      return { id: day, num, theme: { sw: theme.sw, en: theme.en }, grid: full.join(''), words: list, phrase, phraseLetters: pl, spare: empty };
    }
  }
  throw new Error('msako: could not build a grid for ' + day);
}

export function makeMsako({ db, save, send, body, auth, limited }) {
  db.msako ||= { sessions: {} };
  const S = db.msako.sessions;
  // keep a month of sessions; older ones only fill up the data file
  const cutoff = shiftDay(dayKey(), -30);
  for (const k of Object.keys(S)) if (S[k].day < cutoff) delete S[k];

  const cache = new Map();
  function puzzle(day) { if (!cache.has(day)) { cache.set(day, generate(day)); if (cache.size > 7) cache.delete(cache.keys().next().value); } return cache.get(day); }

  const sKey = (player, day) => player + '|' + day;
  function session(player, P, create = true) {
    const k = sKey(player, P.id);
    if (!S[k] && create) S[k] = { player, day: P.id, found: {}, firsts: [], pen: 0, hints: 0, secret: null, wrong: 0, active: 0, last: Date.now(), done: null };
    return S[k];
  }
  function touch(s) { const now = Date.now(), gap = now - s.last; if (gap > 0 && gap <= PING_GAP && !s.done) s.active += gap; s.last = now; }

  const enumeration = p => p.split(' ').map(w => w.length).join(',');
  function view(s, P) {
    return {
      words: P.words.map(({ w, cells }) => { const f = s.found[w], first = s.firsts.includes(w); return { len: w.length, word: f ? w : null, cells: f ? f.cells : null, revealed: f?.how === 'revealed', first: first && !f ? { cell: cells[0], letter: w[0] } : null }; }),
      secret: { len: P.phraseLetters.length, enumeration: enumeration(P.phrase), state: s.secret, text: s.secret ? P.phrase : null, cells: s.secret ? P.spare : null, guessesLeft: SCORE.guesses - s.wrong },
      activeMs: s.active, penalty: s.pen, hints: s.hints, done: s.done ? result(s) : null,
    };
  }
  const publicPuzzle = P => ({ id: P.id, num: P.num, theme: P.theme, size: N, grid: P.grid, hints: HINTS, score: SCORE });

  function ranking(day) {
    return Object.values(S).filter(s => s.day === day && s.done && !s.flagged)
      .sort((a, b) => b.score - a.score || a.active - b.active || a.done - b.done)
      .map((s, i) => ({ rank: i + 1, name: db.players[s.player]?.name || s.player, score: s.score, secs: Math.round(s.active / 1000), hints: s.hints, secret: s.secret === 'won', player: s.player }));
  }
  function result(s) {
    const r = ranking(s.day), me = r.find(e => e.player === s.player);
    return { score: s.score, breakdown: s.breakdown, secs: Math.round(s.active / 1000), hints: s.hints, rank: me?.rank || null, of: r.length, flagged: !!s.flagged };
  }
  function finishIfDone(s, P) {
    if (s.done || !P.words.every(({ w }) => s.found[w])) return;
    const secs = Math.round(s.active / 1000), timeBonus = Math.max(0, SCORE.par - secs) * SCORE.perSec;
    const clean = s.hints ? 0 : SCORE.clean, secret = s.secret === 'won' ? SCORE.secret : 0;
    s.breakdown = { base: SCORE.base, timeBonus, secret, clean, penalties: s.pen, secs };
    s.score = Math.max(0, SCORE.base + timeBonus + secret + clean - s.pen);
    s.secret ||= 'shown'; s.done = Date.now(); s.flagged = secs < SCORE.floor;
  }

  // a swipe from square a to square b: straight across, down or diagonal, at least 3 squares
  function find(s, P, a, b) {
    if (![a, b].every(v => Number.isInteger(v) && v >= 0 && v < N * N)) return { error: 'bad swipe' };
    const r0 = Math.floor(a / N), c0 = a % N, dr = Math.floor(b / N) - r0, dc = b % N - c0;
    if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return { miss: true };
    const len = Math.max(Math.abs(dr), Math.abs(dc)) + 1; if (len < 3) return { miss: true };
    const cells = line(r0, c0, [Math.sign(dr), Math.sign(dc)], len), str = cells.map(i => P.grid[i]).join(''), rev = [...str].reverse().join('');
    const hit = P.words.find(({ w }) => w === str || w === rev);
    if (!hit) return { miss: true };
    if (s.found[hit.w]) return { already: hit.w };
    s.found[hit.w] = { cells: hit.w === str ? cells : [...cells].reverse(), how: 'found', at: Date.now() };
    finishIfDone(s, P);
    return { word: hit.w };
  }
  function hint(s, P, type) {
    const open = P.words.filter(({ w }) => !s.found[w]);
    if (!open.length) return { error: 'all found' };
    if (type === 'first') {
      const x = open.find(({ w }) => !s.firsts.includes(w)); if (!x) return { error: 'every word already has its first letter' };
      s.firsts.push(x.w);
    } else if (type === 'reveal') {
      const x = open.find(({ w }) => s.firsts.includes(w)) || open[0];
      s.found[x.w] = { cells: x.cells, how: 'revealed', at: Date.now() };
    } else return { error: 'unknown hint' };
    s.pen += HINTS[type]; s.hints++;
    finishIfDone(s, P);
    return { cost: HINTS[type] };
  }
  function guess(s, P, text) {
    if (s.secret) return { error: 'already settled' };
    const g = letters(text); if (g.length < 3) return { error: 'type the phrase' };
    if (g === P.phraseLetters) { s.secret = 'won'; return { correct: true }; }
    s.wrong++; s.pen += SCORE.wrongGuess; if (s.wrong >= SCORE.guesses) s.secret = 'lost';
    return { correct: false, cost: SCORE.wrongGuess };
  }

  return async function handle(req, res, url) {
    const route = url.pathname.slice('/api/msako/'.length), today = dayKey();

    if (req.method === 'GET' && route === 'board') {
      const day = url.searchParams.get('day') === 'yesterday' ? shiftDay(today, -1) : today, P = puzzle(day);
      const me = (url.searchParams.get('name') || '').toLowerCase(), r = ranking(day), strip = ({ player, ...e }) => e;
      return send(res, 200, { day, num: P.num, theme: P.theme, finished: r.length, top: r.slice(0, 20).map(strip), me: me ? (r.find(e => e.player === me) ? strip(r.find(e => e.player === me)) : null) : null });
    }
    if (req.method === 'GET' && route === 'teaser') {
      const P = puzzle(today), top = ranking(today)[0];
      return send(res, 200, { text: top ? `Leo: ${top.name} · ${top.score.toLocaleString('en')}` : `Leo: ${P.theme.sw} · ${P.theme.en}` });
    }
    if (req.method === 'GET' && route === 'yesterday') {
      const P = puzzle(shiftDay(today, -1));
      return send(res, 200, { ...publicPuzzle(P), words: P.words.map(({ w, cells }) => ({ word: w, cells })), phrase: P.phrase, spare: P.spare });
    }

    if (req.method !== 'POST') return send(res, 404, { error: 'not found' });
    const b = await body(req), player = auth(b.name, b.token);
    if (!player) return send(res, 401, { error: 'sign in first' });
    if (limited('msako:' + player, 150)) return send(res, 429, { error: 'slow down' });
    const P = puzzle(today);

    if (route === 'home') {
      const s = session(player, P, false);
      return send(res, 200, { num: P.num, theme: P.theme, words: P.words.length, found: s ? Object.keys(s.found).length : 0, state: s?.done ? 'done' : s ? 'started' : 'new', result: s?.done ? result(s) : null });
    }
    // a phone left open overnight is still on yesterday's grid
    if (b.day && b.day !== P.id && route !== 'open') return send(res, 410, { error: 'new puzzle', day: P.id });
    if (route === 'open') { const s = session(player, P); s.last = Date.now(); save(); return send(res, 200, { puzzle: publicPuzzle(P), session: view(s, P) }); }

    const s = session(player, P, false); if (!s) return send(res, 409, { error: 'open the puzzle first' });
    touch(s);
    let out;
    if (route === 'ping') out = {};
    else if (s.done) out = { error: 'already finished' };
    else if (route === 'find') out = find(s, P, b.a, b.b);
    else if (route === 'hint') out = hint(s, P, b.type);
    else if (route === 'guess') out = guess(s, P, b.text);
    else return send(res, 404, { error: 'not found' });
    save();
    return send(res, out.error ? 400 : 200, { ...out, session: view(s, P) });
  };
}
