// Cryptic crossword puzzle checker. Used by the server when loading puzzles, and by setters:
//   node server/cryptic/validate.js server/puzzles/cryptic/*.json      (prints the filled grid too)
//
// Puzzle file (one per puzzle, in server/puzzles/cryptic/):
// {
//   "id": "quick-2026-10-24",          unique, also the file name
//   "mode": "quick" | "classic",
//   "title": "Quick #1", "author": "EnziGames",
//   "date": "2026-10-24",              goes live 05:00 EAT that day (classic: a Monday)
//   "par_seconds": 240, "difficulty": 1,
//   "grid": ["...#...", ...],          '#' = black, '.' = white
//   "clues": { "across": [ { "num": 1, "row": 0, "col": 0,
//       "text": "Broken heart is the planet",   (no letter count here)
//       "enumeration": "5",                      "7,2,6" for phrases, "4-4" for hyphens
//       "answer": "EARTH",                        A–Z only, no spaces
//       "definition_span": [21, 27],              [start, end) of the definition inside text
//       "explanation": "Anagram (broken) of HEART" } ], "down": [ ... ] }
// }
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const SIZES = { quick: [5, 9], classic: [15, 15] };
const CLUE_COUNT = { quick: [4, 12], classic: [24, 36] };

// White runs of length ≥ 2 become entries, numbered left-to-right, top-to-bottom.
export function slots(grid) {
  const R = grid.length, C = grid[0].length, white = (r, c) => r >= 0 && c >= 0 && r < R && c < C && grid[r][c] !== '#';
  const out = { across: [], down: [] }; let n = 0;
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    if (!white(r, c)) continue;
    const a = !white(r, c - 1) && white(r, c + 1), d = !white(r - 1, c) && white(r + 1, c);
    if (!a && !d) continue; n++;
    if (a) { const cells = []; for (let k = c; white(r, k); k++) cells.push(r * C + k); out.across.push({ num: n, row: r, col: c, cells }); }
    if (d) { const cells = []; for (let k = r; white(k, c); k++) cells.push(k * C + c); out.down.push({ num: n, row: r, col: c, cells }); }
  }
  return out;
}
export const enumLengths = e => String(e).split(/[,-]/).map(Number);

export function validate(p) {
  const err = [], warn = [];
  const E = m => err.push(m), W = m => warn.push(m);
  if (!/^[a-z0-9-]+$/.test(p.id || '')) E('id must be lowercase letters, digits, dashes');
  if (!SIZES[p.mode]) { E('mode must be quick or classic'); return { err, warn }; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date || '')) E('date must be YYYY-MM-DD');
  else if (p.mode === 'classic' && new Date(p.date + 'T12:00:00Z').getUTCDay() !== 1) E('classic date must be a Monday');
  if (!(p.par_seconds > 0)) E('par_seconds missing');
  const g = p.grid;
  if (!Array.isArray(g) || !g.length) { E('grid missing'); return { err, warn }; }
  const R = g.length, C = g[0].length, [lo, hi] = SIZES[p.mode];
  if (g.some(row => row.length !== C || /[^#.]/.test(row))) E('grid rows must be equal length and use only # and .');
  if (R !== C || R < lo || R > hi) E(`grid must be square, ${lo}–${hi} cells`);
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (g[r][c] !== g[R - 1 - r][C - 1 - c]) { E(`grid not symmetric (180°) at row ${r} col ${c}`); r = R; break; }
  const S = slots(g);
  // every white cell in at least one entry; entries at least 3 long
  const used = new Map();
  for (const dir of ['across', 'down']) for (const s of S[dir]) { if (s.cells.length < 3) E(`${s.num} ${dir} is only ${s.cells.length} long`); for (const i of s.cells) used.set(i, (used.get(i) || 0) + 1); }
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (g[r][c] === '.' && !used.get(r * C + c)) E(`white cell row ${r} col ${c} is in no answer`);
  // British-style checking: no two unchecked letters in a row, at least half of each answer checked
  for (const dir of ['across', 'down']) for (const s of S[dir]) {
    const chk = s.cells.map(i => used.get(i) > 1), n = chk.filter(Boolean).length;
    if (n * 2 < s.cells.length - 1) E(`${s.num} ${dir}: only ${n} of ${s.cells.length} letters are crossed`);
    for (let k = 1; k < chk.length; k++) if (!chk[k] && !chk[k - 1]) { E(`${s.num} ${dir}: two uncrossed letters in a row`); break; }
  }
  // clues match slots
  const letters = new Array(R * C).fill(null), answers = new Set();
  let count = 0;
  for (const dir of ['across', 'down']) {
    const list = p.clues?.[dir] || [], bySlot = new Map(S[dir].map(s => [s.num, s]));
    if (list.length !== S[dir].length) E(`${dir}: grid has ${S[dir].length} entries, ${list.length} clues given`);
    for (const cl of list) {
      count++;
      const s = bySlot.get(cl.num), tag = `${cl.num} ${dir}`;
      if (!s) { E(`${tag}: no such entry in the grid (entries: ${S[dir].map(x => x.num).join(', ')})`); continue; }
      if (cl.row !== s.row || cl.col !== s.col) E(`${tag}: row/col should be ${s.row}/${s.col}`);
      const a = cl.answer || '';
      if (!/^[A-Z]+$/.test(a)) E(`${tag}: answer must be A–Z only`);
      if (a.length !== s.cells.length) E(`${tag}: answer ${a} is ${a.length} letters, slot is ${s.cells.length}`);
      if (!/^\d+([,-]\d+)*$/.test(cl.enumeration || '')) E(`${tag}: bad enumeration`);
      else if (enumLengths(cl.enumeration).reduce((x, y) => x + y, 0) !== a.length) E(`${tag}: enumeration ${cl.enumeration} doesn't add up to ${a.length}`);
      if (answers.has(a)) E(`${tag}: answer ${a} used twice`); answers.add(a);
      s.cells.forEach((i, k) => { const ch = a[k]; if (letters[i] && ch && letters[i] !== ch) E(`${tag}: letter ${k + 1} '${ch}' clashes with crossing '${letters[i]}'`); letters[i] ||= ch; });
      const t = cl.text || '', ds = cl.definition_span;
      if (!t.trim()) E(`${tag}: empty clue`);
      if (/\(\d/.test(t)) E(`${tag}: put the letter count in enumeration, not in text`);
      if (!Array.isArray(ds) || ds.length !== 2 || !(ds[0] >= 0 && ds[1] > ds[0] && ds[1] <= t.length)) E(`${tag}: definition_span must be [start, end) inside text`);
      else if (ds[0] !== 0 && ds[1] !== t.length) E(`${tag}: definition "${t.slice(...ds)}" should be at the start or end of the clue`);
      if (!(cl.explanation || '').trim()) E(`${tag}: explanation missing`);
    }
  }
  const [cmin, cmax] = CLUE_COUNT[p.mode];
  if (count < cmin || count > cmax) W(`${count} clues (usual for ${p.mode}: ${cmin}–${cmax})`);
  return { err, warn, letters, R, C };
}

export function picture(p, letters) {
  return p.grid.map((row, r) => [...row].map((ch, c) => ch === '#' ? '█' : (letters?.[r * row.length + c] || '·')).join(' ')).join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let bad = 0;
  for (const f of process.argv.slice(2)) {
    let p; try { p = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.log(`✗ ${f}: ${e.message}`); bad++; continue; }
    const { err, warn, letters } = validate(p);
    console.log(`${err.length ? '✗' : '✓'} ${f}  (${p.mode}, ${p.grid?.length}×${p.grid?.[0]?.length}, ${(p.clues?.across?.length || 0) + (p.clues?.down?.length || 0)} clues)`);
    for (const e of err) console.log('   error:', e);
    for (const w of warn) console.log('   note: ', w);
    if (letters) console.log(picture(p, letters).replace(/^/gm, '   '));
    if (err.length) bad++;
  }
  process.exit(bad ? 1 : 0);
}
