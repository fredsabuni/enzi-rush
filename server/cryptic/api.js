// Cryptic Crossword API. Answers never leave the server until a puzzle has been replaced
// (then it becomes "last week's solution"). The server keeps each player's progress, applies hint
// penalties, times the solve and works out the score, so the phone only sends letters.
//
// Puzzles are JSON files in server/puzzles/cryptic/ (format in validate.js). The live puzzle for a
// mode is the newest one whose date has arrived; days turn over at 05:00 EAT.
import fs from 'node:fs';
import path from 'node:path';
import { validate, slots } from './validate.js';

const DAY = 86400e3, EAT = 3 * 3600e3, ROLLOVER = 5 * 3600e3;
// spec §6.1: base, time-bonus multiplier, penalty scale; floor = fastest believable solve (seconds)
const MODES = { quick: { base: 1000, mult: 2, scale: 1, floor: 20 }, classic: { base: 10000, mult: 1, scale: 5, floor: 120 } };
// spec §5.3 (before the mode scale)
export const ASSISTS = { checkLetter: 10, checkWord: 25, revealLetter: 40, definition: 30, explain: 60, revealWord: 100, checkPuzzle: 50 };
const PING_GAP = 30e3; // gaps between client pings longer than this count as idle

export function makeCryptic({ db, save, send, body, auth, limited, dir }) {
  db.cryptic ||= { sessions: {} };
  const S = db.cryptic.sessions;

  // ---------- puzzles (re-read the folder at most every 30 s, so new files go live without a restart)
  let cache = { at: 0, list: [] };
  const seenErr = new Set();
  function puzzles() {
    if (Date.now() - cache.at < 30e3) return cache.list;
    const list = [];
    let files = []; try { files = fs.readdirSync(dir).filter(f => f.endsWith('.json')); } catch (e) { }
    for (const f of files) {
      try {
        const p = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')), { err, letters } = validate(p);
        if (err.length) { if (!seenErr.has(f)) console.warn(`[cryptic] skipping ${f}: ${err[0]}${err.length > 1 ? ` (+${err.length - 1} more)` : ''}`); seenErr.add(f); continue; }
        const sl = slots(p.grid), clue = (d, s) => p.clues[d].find(c => c.num === s.num);
        p.R = p.grid.length; p.C = p.grid[0].length; p.key = letters;
        p.entries = ['across', 'down'].flatMap(d => sl[d].map(s => ({ ...clue(d, s), dir: d, cells: s.cells })));
        list.push(p);
      } catch (e) { if (!seenErr.has(f)) console.warn(`[cryptic] skipping ${f}: ${e.message}`); seenErr.add(f); }
    }
    list.sort((a, b) => a.date.localeCompare(b.date));
    return (cache = { at: Date.now(), list }).list;
  }
  const dayKey = (now = Date.now()) => new Date(now + EAT - ROLLOVER).toISOString().slice(0, 10);
  function live(mode) {
    const all = puzzles().filter(p => p.mode === mode), today = dayKey(), past = all.filter(p => p.date <= today);
    return past[past.length - 1] || all[0] || null;
  }
  function previous(mode) { const all = puzzles().filter(p => p.mode === mode), cur = live(mode); const i = all.indexOf(cur); return i > 0 ? all[i - 1] : null; }
  const byId = id => puzzles().find(p => p.id === id);

  // what the phone gets: grid and clues, no answers
  const publicPuzzle = p => ({
    id: p.id, mode: p.mode, title: p.title, author: p.author, date: p.date, par: p.par_seconds, rows: p.R, cols: p.C, grid: p.grid,
    clues: Object.fromEntries(['across', 'down'].map(d => [d, p.clues[d].map(c => ({ num: c.num, row: c.row, col: c.col, text: c.text, enumeration: c.enumeration }))])),
  });

  // ---------- sessions: one per player per puzzle
  const sKey = (player, p) => player + '|' + p.id;
  function session(player, p, create = true) {
    const k = sKey(player, p);
    if (!S[k] && create) S[k] = { player, puzzle: p.id, mode: p.mode, cells: '.'.repeat(p.R * p.C), rev: [], assists: [], pen: 0, defs: [], explains: [], active: 0, last: Date.now(), start: Date.now(), done: null };
    return S[k];
  }
  // count time between pings as play time, unless the gap says the player was away
  function touch(s) { const now = Date.now(), gap = now - s.last; if (gap > 0 && gap <= PING_GAP && !s.done) s.active += gap; s.last = now; }
  // take letters from the phone, but never over a revealed cell or after finishing
  function setCells(s, p, cells) {
    if (s.done || typeof cells !== 'string' || cells.length !== p.R * p.C) return;
    const rev = new Set(s.rev), cur = [...s.cells];
    for (let i = 0; i < cur.length; i++) if (p.grid[Math.floor(i / p.C)][i % p.C] !== '#' && !rev.has(i)) { const ch = cells[i].toUpperCase(); cur[i] = /[A-Z]/.test(ch) ? ch : '.'; }
    s.cells = cur.join('');
  }
  const sessionView = s => ({ cells: s.cells, rev: s.rev, defs: s.defs, explains: s.explains, activeMs: s.active, assists: s.assists.length, penalty: s.pen * MODES[s.mode].scale, done: s.done ? result(s) : null });
  const progress = (s, p) => { const white = p.key.filter(Boolean).length; return white ? Math.round(100 * [...s.cells].filter(c => c !== '.').length / white) : 0; };

  // ---------- scoring (spec §6.1)
  function score(s, p) {
    const m = MODES[p.mode], secs = Math.round(s.active / 1000);
    const timeBonus = Math.max(0, p.par_seconds - secs) * m.mult, penalties = s.pen * m.scale, clean = s.assists.length ? 0 : Math.round(m.base * .2);
    return { base: m.base, timeBonus, penalties, clean, total: Math.max(0, m.base + timeBonus - penalties + clean), secs };
  }
  function ranking(p) {
    return Object.values(S).filter(s => s.puzzle === p.id && s.done && !s.flagged)
      .sort((a, b) => b.score - a.score || a.assists.length - b.assists.length || a.done - b.done)
      .map((s, i) => ({ rank: i + 1, name: db.players[s.player]?.name || s.player, score: s.score, secs: Math.round(s.active / 1000), assists: s.assists.length, player: s.player }));
  }
  function result(s) {
    const p = byId(s.puzzle), r = p ? ranking(p) : [], me = r.find(e => e.player === s.player);
    return { score: s.score, breakdown: s.breakdown, secs: Math.round(s.active / 1000), assists: s.assists.length, rank: me?.rank || null, of: r.length, flagged: !!s.flagged };
  }

  // ---------- hints
  const entryOf = (p, d, num) => p.entries.find(e => e.dir === d && e.num === num);
  function assist(s, p, type, q) {
    if (!(type in ASSISTS)) return { error: 'unknown hint' };
    const e = q.dir && q.num ? entryOf(p, q.dir, +q.num) : null, cell = Number.isInteger(q.cell) && p.key[q.cell] ? q.cell : null;
    const cur = [...s.cells], rev = new Set(s.rev);
    const check = list => list.filter(i => cur[i] !== '.' && !rev.has(i)).map(i => ({ i, ok: cur[i] === p.key[i] }));
    const reveal = list => { const out = []; for (const i of list) if (!rev.has(i)) { cur[i] = p.key[i]; rev.add(i); out.push({ i, ch: p.key[i] }); } s.cells = cur.join(''); s.rev = [...rev]; return out; };
    const tag = e ? `${e.num}${e.dir[0]}` : null;
    let res, free = false;
    switch (type) {
      case 'checkLetter': if (cell === null) return { error: 'pick a square' }; res = { checked: check([cell]) }; free = !res.checked.length; break;
      case 'checkWord': if (!e) return { error: 'pick a clue' }; res = { checked: check(e.cells) }; free = !res.checked.length; break;
      case 'checkPuzzle': res = { checked: check(p.key.map((ch, i) => ch ? i : -1).filter(i => i >= 0)) }; free = !res.checked.length; break;
      case 'revealLetter': if (cell === null) return { error: 'pick a square' }; res = { revealed: reveal([cell]) }; free = !res.revealed.length; break;
      case 'revealWord': if (!e) return { error: 'pick a clue' }; res = { revealed: reveal(e.cells) }; free = !res.revealed.length; break;
      case 'definition': if (!e) return { error: 'pick a clue' }; free = s.defs.some(d => d.clue === tag); if (!free) s.defs.push({ clue: tag, span: e.definition_span }); res = { clue: tag, span: e.definition_span }; break;
      case 'explain': if (!e) return { error: 'pick a clue' }; free = s.explains.some(d => d.clue === tag); if (!free) s.explains.push({ clue: tag, text: e.explanation }); res = { clue: tag, text: e.explanation }; break;
    }
    if (!free) { s.pen += ASSISTS[type]; s.assists.push({ type, clue: tag, cell, at: Date.now() }); }
    return { ...res, cost: free ? 0 : ASSISTS[type] * MODES[p.mode].scale, penalty: s.pen * MODES[p.mode].scale };
  }

  // ---------- routes
  return async function handle(req, res, url) {
    const route = url.pathname.slice('/api/cryptic/'.length);

    if (req.method === 'GET' && route === 'board') {
      const p = live(url.searchParams.get('mode') === 'classic' ? 'classic' : 'quick'); if (!p) return send(res, 404, { error: 'no puzzle' });
      const me = (url.searchParams.get('name') || '').toLowerCase(), r = ranking(p), strip = ({ player, ...e }) => e;
      return send(res, 200, { puzzle: { id: p.id, title: p.title, mode: p.mode }, finished: r.length, top: r.slice(0, 10).map(strip), me: me ? (r.find(e => e.player === me) ? strip(r.find(e => e.player === me)) : null) : null });
    }
    if (req.method === 'GET' && route === 'solution') {
      const p = previous('classic'); if (!p) return send(res, 404, { error: 'no solution yet' });
      return send(res, 200, { ...publicPuzzle(p), letters: p.key.map(c => c || ''), clues: Object.fromEntries(['across', 'down'].map(d => [d, p.clues[d].map(c => ({ num: c.num, text: c.text, enumeration: c.enumeration, answer: c.answer, explanation: c.explanation, definition_span: c.definition_span }))])) });
    }
    if (req.method === 'GET' && route === 'teaser') {
      const p = live('quick'), top = p && ranking(p)[0];
      return send(res, 200, { text: top ? `Leo: ${top.name} · ${top.score.toLocaleString('en')}` : 'Fumbo jipya kila siku · New puzzle daily' });
    }

    if (req.method !== 'POST') return send(res, 404, { error: 'not found' });
    const b = await body(req), player = auth(b.name, b.token);
    if (!player) return send(res, 401, { error: 'sign in first' });
    if (limited('cryptic:' + player, 90)) return send(res, 429, { error: 'slow down' });

    if (route === 'home') {
      const out = {};
      for (const mode of ['quick', 'classic']) {
        const p = live(mode); if (!p) { out[mode] = null; continue; }
        const s = session(player, p, false);
        out[mode] = { id: p.id, title: p.title, date: p.date, par: p.par_seconds, size: p.R, state: s?.done ? 'done' : s ? 'started' : 'new', progress: s ? progress(s, p) : 0, result: s?.done ? result(s) : null };
      }
      const prev = previous('classic');
      return send(res, 200, { ...out, solution: prev ? { id: prev.id, title: prev.title } : null });
    }

    const p = b.puzzle ? byId(b.puzzle) : live(b.mode === 'classic' ? 'classic' : 'quick');
    if (!p) return send(res, 404, { error: 'no puzzle' });
    // only the live puzzles can be played
    if (p !== live(p.mode)) return send(res, 410, { error: 'this puzzle has finished' });

    if (route === 'open') { const s = session(player, p); s.last = Date.now(); save(); return send(res, 200, { puzzle: publicPuzzle(p), session: sessionView(s), assists: Object.fromEntries(Object.entries(ASSISTS).map(([k, v]) => [k, v * MODES[p.mode].scale])) }); }

    const s = session(player, p, false); if (!s) return send(res, 409, { error: 'open the puzzle first' });
    if (route === 'save') { touch(s); setCells(s, p, b.cells); save(); return send(res, 200, { activeMs: s.active }); }
    if (route === 'assist') {
      if (s.done) return send(res, 409, { error: 'already solved' });
      touch(s); setCells(s, p, b.cells); const r = assist(s, p, b.type, b); save();
      return send(res, r.error ? 400 : 200, { ...r, cells: s.cells, rev: s.rev });
    }
    if (route === 'complete') {
      if (s.done) return send(res, 200, { solved: true, ...result(s) });
      touch(s); setCells(s, p, b.cells);
      const solved = p.key.every((ch, i) => !ch || s.cells[i] === ch);
      if (!solved) { save(); return send(res, 200, { solved: false }); }
      const sc = score(s, p);
      s.done = Date.now(); s.score = sc.total; s.breakdown = sc; s.flagged = sc.secs < MODES[p.mode].floor;
      save();
      return send(res, 200, { solved: true, ...result(s) });
    }
    send(res, 404, { error: 'not found' });
  };
}
