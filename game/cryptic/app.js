// Enzi Cryptic: screens, grid, typing and hints.
// The phone never has the answers: checks, reveals and scoring all happen on the server (/api/cryptic/*).
// Progress is saved to the server every few seconds, so a puzzle can be finished later or on another phone.
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const BASE = (window.HZE_API || '') + '/api/cryptic/';
const signInAgain = () => location.replace('../?next=cryptic/');
if (!API.name) signInAgain();

async function cx(route, data = {}, opts = {}) {
  const r = await fetch(BASE + route, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: API.name, token: API.token, ...data }), ...opts });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401) signInAgain();
  if (!r.ok) throw Object.assign(new Error(j.error || r.statusText), { status: r.status });
  return j;
}
async function cxGet(path) { const r = await fetch(BASE + path); const j = await r.json().catch(() => ({})); if (!r.ok) throw Object.assign(new Error(j.error || r.statusText), { status: r.status }); return j; }

let toastT;
function toast(msg, ms = 2200) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms); }
const fmt = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
const nf = n => Number(n || 0).toLocaleString('en');
const best = n => { try { const k = 'hze_best_cryptic'; if (n > +(localStorage.getItem(k) || 0)) localStorage.setItem(k, n); } catch (e) { } };

// ---------- screens + routing (#play/quick, #board, #solution, #learn, #howto)
let playing = false;
function show(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('on', s.id === id);
  if (playing && id !== 'sPlay') leavePuzzle();
  playing = id === 'sPlay'; window.scrollTo(0, 0);
}
function route() {
  closeSheets();
  const [a, b] = location.hash.slice(1).split('/');
  if (a === 'play') return openPuzzle(b === 'classic' ? 'classic' : 'quick');
  if (a === 'board') return openBoard(b === 'classic' ? 'classic' : 'quick');
  if (a === 'solution') return openSolution();
  if (a === 'learn') { show('sLearn'); return renderLessons(); }
  if (a === 'howto') return show('sHowto');
  openHome();
}
window.addEventListener('hashchange', route);
const go = h => { location.hash = h; };
for (const b of document.querySelectorAll('[data-go]')) b.onclick = () => go(b.dataset.go);

// ---------- sheets
function openSheet(id) { $(id).classList.add('on'); }
function closeSheets() { for (const s of document.querySelectorAll('.sheet')) s.classList.remove('on'); }
for (const s of document.querySelectorAll('.sheet')) s.addEventListener('click', e => { if (e.target === s || e.target.hasAttribute('data-close')) s.classList.remove('on'); });
const sheetOpen = () => !!document.querySelector('.sheet.on');

// ---------- home
async function openHome() {
  show('sHome');
  $('who').textContent = API.name;
  $('today').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Dar_es_Salaam' });
  try {
    const h = await cx('home');
    card('q', h.quick, 'A small cryptic, about 3 minutes'); card('c', h.classic, 'The full 15×15 · play over several visits');
    $('solLink').disabled = !h.solution; $('solInfo').textContent = h.solution ? h.solution.title : 'Comes with the next Classic';
    $('homeNote').textContent = '';
  } catch (e) { if (e.status !== 401) $('homeNote').textContent = 'No connection. Check the Wi-Fi and try again.'; }
}
function card(k, m, blurb) {
  const goEl = $(k + 'Go'), info = $(k + 'Info'), bar = $(k + 'Bar');
  if (!m) { info.textContent = 'No puzzle yet'; goEl.textContent = '—'; return; }
  info.textContent = `${m.title} · ${m.size}×${m.size} · ${blurb.split('·').pop().trim()}`;
  bar.style.width = (m.state === 'done' ? 100 : m.progress) + '%';
  goEl.className = 'go' + (m.state === 'done' ? ' done' : '');
  goEl.textContent = m.state === 'done' ? `✓ ${nf(m.result?.score)}` : m.state === 'started' ? `Resume · ${m.progress}%` : 'Play';
}
$('mQuick').onclick = () => go('play/quick');
$('mClassic').onclick = () => go('play/classic');

// ---------- grid geometry (same numbering rules as the server)
function slots(grid) {
  const R = grid.length, C = grid[0].length, white = (r, c) => r >= 0 && c >= 0 && r < R && c < C && grid[r][c] !== '#';
  const out = []; let n = 0;
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    if (!white(r, c)) continue;
    const a = !white(r, c - 1) && white(r, c + 1), d = !white(r - 1, c) && white(r + 1, c);
    if (!a && !d) continue; n++;
    if (a) { const cells = []; for (let k = c; white(r, k); k++) cells.push(r * C + k); out.push({ num: n, dir: 'across', cells }); }
    if (d) { const cells = []; for (let k = r; white(k, c); k++) cells.push(k * C + c); out.push({ num: n, dir: 'down', cells }); }
  }
  return out;
}
// entries with clue text, plus which entries each cell belongs to and where the numbers go
function layout(P) {
  const ents = slots(P.grid).map(s => ({ ...s, ...P.clues[s.dir].find(c => c.num === s.num) }))
    .sort((a, b) => (a.dir === b.dir ? a.num - b.num : a.dir === 'across' ? -1 : 1));
  for (const e of ents) e.key = e.num + e.dir[0];
  const per = [], nums = [];
  for (const e of ents) { e.cells.forEach(i => { (per[i] ||= {})[e.dir] = e; }); nums[e.cells[0]] = e.num; }
  return { ents, per, nums };
}
// draw the grid; returns the cell elements
function buildGrid(el, P, L, letters) {
  el.innerHTML = ''; el.style.gridTemplateColumns = `repeat(${P.cols}, var(--c))`;
  const els = [];
  for (let i = 0; i < P.rows * P.cols; i++) {
    const blk = P.grid[Math.floor(i / P.cols)][i % P.cols] === '#', d = document.createElement('div');
    d.className = 'cell' + (blk ? ' blk' : ''); d.dataset.i = i;
    if (!blk) { d.setAttribute('role', 'gridcell'); d.innerHTML = (L.nums[i] ? `<span class="n">${L.nums[i]}</span>` : '') + `<span class="l">${letters?.[i] || ''}</span>`; }
    el.appendChild(d); els.push(d);
  }
  // word breaks: (7,2,6) gets a thick bar, (4-4) a small dash
  for (const e of L.ents) {
    const parts = String(e.enumeration).match(/\d+|[,-]/g) || []; let pos = 0;
    for (const t of parts) { if (/\d/.test(t)) { pos += +t; continue; } const c = els[e.cells[pos - 1]]; if (c) c.classList.add((t === ',' ? 'br-' : 'hy-') + (e.dir === 'across' ? 'r' : 'b')); }
  }
  return els;
}
function sizeGrid(el, cols, rows, w, h, max) {
  const c = Math.max(14, Math.floor(Math.min((w - 4 - (cols - 1)) / cols, (h - 4 - (rows - 1)) / rows, max)));
  el.style.setProperty('--c', c + 'px');
}

// ---------- play state
let P = null, L = null, els = [], cells = [], rev = new Set(), bad = new Set(), defs = new Map(), explains = new Map();
let sel = { i: 0, dir: 'across' }, costs = {}, activeMs = 0, lastInput = 0, doneResult = null, lastFull = '', mode = 'quick', busy = false;
const lsKey = () => 'hze_cx_' + P.id;
const cellStr = () => cells.map((c, i) => P.grid[Math.floor(i / P.cols)][i % P.cols] === '#' ? '#' : c || '.').join('');
const white = i => !!L.per[i];

async function openPuzzle(m) {
  if (playing && P) leavePuzzle();
  mode = m; show('sPlay');
  $('pTitle').textContent = 'Loading…'; $('grid').innerHTML = ''; $('clueText').textContent = ''; $('pPen').textContent = ''; $('pTime').textContent = '0:00';
  let j;
  try { j = await cx('open', { mode: m }); } catch (e) { if (e.status !== 401) { toast(e.status === 404 ? 'No puzzle yet, check back soon' : 'No connection. Try again.'); go(''); } return; }
  if (!playing) return;
  P = j.puzzle; L = layout(P); costs = j.assists;
  const s = j.session;
  cells = [...s.cells].map(c => (/[A-Z]/.test(c) ? c : ''));
  rev = new Set(s.rev); bad = new Set();
  defs = new Map(s.defs.map(d => [d.clue, d.span])); explains = new Map(s.explains.map(d => [d.clue, d.text]));
  activeMs = s.activeMs; doneResult = s.done; lastInput = Date.now(); lastFull = '';
  // letters typed while offline last time
  try { const local = localStorage.getItem(lsKey()); if (local && !doneResult) [...local].forEach((c, i) => { if (/[A-Z]/.test(c) && !cells[i] && !rev.has(i)) cells[i] = c; }); } catch (e) { }
  $('pTitle').innerHTML = `${esc(P.title)}<small>${P.rows}×${P.cols}</small>`;
  els = buildGrid($('grid'), P, L, cells);
  els.forEach((d, i) => { if (white(i)) drawCell(i); });
  renderLists(); fit(); showPenalty(s.penalty); tick(true);
  const first = L.ents.find(e => e.cells.some(i => !cells[i])) || L.ents[0];
  selectEntry(first);
  if (doneResult) showDone(doneResult);
}
function leavePuzzle() { if (P && !doneResult) saveNow(true); P && localSave(); }

function drawCell(i) {
  const d = els[i]; d.querySelector('.l').textContent = cells[i] || '';
  d.classList.toggle('rev', rev.has(i)); d.classList.toggle('bad', bad.has(i));
  const e = L.per[i].across || L.per[i].down;
  d.setAttribute('aria-label', `${e.num} ${e.dir}, letter ${e.cells.indexOf(i) + 1} of ${e.cells.length}, ${cells[i] || 'empty'}${rev.has(i) ? ', revealed' : ''}${bad.has(i) ? ', wrong' : ''}`);
}
const curEntry = () => L.per[sel.i]?.[sel.dir];

function select(i, dir = sel.dir) {
  if (!white(i)) return;
  if (!L.per[i][dir]) dir = dir === 'across' ? 'down' : 'across';
  sel = { i, dir }; paint();
}
function selectEntry(e) { if (!e) return; select(e.cells.find(i => !cells[i]) ?? e.cells[0], e.dir); }

function clueHTML(e, withNum = true) {
  const span = defs.get(e.key), t = e.text;
  const body = span ? esc(t.slice(0, span[0])) + `<span class="def">${esc(t.slice(span[0], span[1]))}</span>` + esc(t.slice(span[1])) : esc(t);
  const ex = explains.get(e.key);
  return (withNum ? `<b>${e.num}${e.dir === 'across' ? 'A' : 'D'}</b>` : '') + `<span>${body} (${esc(e.enumeration)})</span>` + (ex ? `<span class="explain">💡 ${esc(ex)}</span>` : '');
}
function paint() {
  const e = curEntry(), on = new Set(e ? e.cells : []);
  els.forEach((d, i) => { if (!white(i)) return; d.classList.toggle('word', on.has(i) && i !== sel.i); d.classList.toggle('sel', i === sel.i); });
  $('clueText').innerHTML = e ? clueHTML(e) : '';
  for (const li of document.querySelectorAll('.lists li[data-k]')) li.classList.toggle('on', li.dataset.k === e?.key);
  const li = $('listsSide').querySelector('li.on'); if (li) li.scrollIntoView({ block: 'nearest' });
}
function renderLists() {
  const html = ['across', 'down'].map(d => `<h3>${d === 'across' ? 'Across' : 'Down'}</h3><ol>` +
    L.ents.filter(e => e.dir === d).map(e => `<li data-k="${e.key}" class="${e.cells.every(i => cells[i]) ? 'filled' : ''}"><b>${e.num}</b><span>${clueHTML(e, false)}</span></li>`).join('') + '</ol>').join('');
  $('listsSide').innerHTML = html; $('listsSheet').innerHTML = html;
  for (const li of document.querySelectorAll('.lists li[data-k]')) li.onclick = () => { selectEntry(L.ents.find(e => e.key === li.dataset.k)); closeSheets(); };
  paint();
}
function fit() {
  if (!P) return; const w = $('boardWrap');
  sizeGrid($('grid'), P.cols, P.rows, w.clientWidth, w.clientHeight, P.cols > 9 ? 48 : 64);
}
new ResizeObserver(() => playing && fit()).observe($('boardWrap'));

// ---------- typing
function changed() { lastInput = Date.now(); localSave(); renderListsSoon(); }
let listT; function renderListsSoon() { clearTimeout(listT); listT = setTimeout(renderLists, 150); }
function type(ch) {
  if (doneResult) return; const e = curEntry(); if (!e) return;
  if (!rev.has(sel.i)) { cells[sel.i] = ch; bad.delete(sel.i); drawCell(sel.i); changed(); }
  const k = e.cells.indexOf(sel.i);
  const next = e.cells.slice(k + 1).find(i => !cells[i]) ?? e.cells[k + 1];
  if (next !== undefined) sel.i = next;
  paint(); maybeComplete();
}
function backspace() {
  if (doneResult) return; const e = curEntry(); if (!e) return;
  const k = e.cells.indexOf(sel.i), clear = i => { if (!rev.has(i) && cells[i]) { cells[i] = ''; bad.delete(i); drawCell(i); changed(); } };
  if (cells[sel.i] && !rev.has(sel.i)) { clear(sel.i); if (k > 0) sel.i = e.cells[k - 1]; }
  else if (k > 0) { sel.i = e.cells[k - 1]; clear(sel.i); }
  paint();
}
function move(dr, dc) {
  const dir = dc ? 'across' : 'down';
  if (sel.dir !== dir && L.per[sel.i][dir]) { sel.dir = dir; return paint(); }
  let r = Math.floor(sel.i / P.cols) + dr, c = sel.i % P.cols + dc;
  while (r >= 0 && c >= 0 && r < P.rows && c < P.cols) { const i = r * P.cols + c; if (white(i)) return select(i, dir); r += dr; c += dc; }
}
function stepClue(d) { const i = L.ents.indexOf(curEntry()), n = L.ents.length; selectEntry(L.ents[(i + d + n) % n]); }
function toggleDir() { const o = sel.dir === 'across' ? 'down' : 'across'; if (L.per[sel.i][o]) { sel.dir = o; paint(); } }

$('grid').addEventListener('pointerdown', e => {
  const d = e.target.closest('.cell'); if (!d || d.classList.contains('blk')) return;
  e.preventDefault(); const i = +d.dataset.i;
  if (i === sel.i) toggleDir(); else select(i);
});
$('prevClue').onclick = () => stepClue(-1);
$('nextClue').onclick = () => stepClue(1);
document.addEventListener('keydown', e => {
  if (!playing || !P || sheetOpen() || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (/^[a-z]$/i.test(k)) type(k.toUpperCase());
  else if (k === 'Backspace' || k === 'Delete') backspace();
  else if (k === 'ArrowLeft') move(0, -1); else if (k === 'ArrowRight') move(0, 1);
  else if (k === 'ArrowUp') move(-1, 0); else if (k === 'ArrowDown') move(1, 0);
  else if (k === 'Tab') stepClue(e.shiftKey ? -1 : 1);
  else if (k === 'Enter') stepClue(1);
  else if (k === ' ') toggleDir();
  else return;
  e.preventDefault();
});
// on-screen keyboard: the phone's own keyboard never opens
$('kbd').innerHTML = ['QWERTYUIOP', 'ASDFGHJKL', '⇄ZXCVBNM⌫'].map(r => `<div>${[...r].map(k => `<button data-k="${k}" class="${'⇄⌫'.includes(k) ? 'wide' : ''}" aria-label="${k === '⌫' ? 'Delete' : k === '⇄' ? 'Switch direction' : k}">${k}</button>`).join('')}</div>`).join('');
$('kbd').addEventListener('pointerdown', e => {
  const b = e.target.closest('button'); if (!b) return; e.preventDefault();
  const k = b.dataset.k; if (k === '⌫') backspace(); else if (k === '⇄') toggleDir(); else type(k);
});

// ---------- timer + saving: time only runs while the page is open and the player has touched it in the last minute
const isActive = () => playing && !document.hidden && !doneResult && Date.now() - lastInput < 60e3;
function tick(force) { if (isActive()) activeMs += 1000; if (playing && (force || isActive())) $('pTime').textContent = fmt(activeMs / 1000); }
setInterval(tick, 1000);
document.addEventListener('pointerdown', () => { if (playing) lastInput = Date.now(); }, true);
function localSave() { try { localStorage.setItem(lsKey(), cellStr()); } catch (e) { } }
async function saveNow(leaving) {
  if (!P || doneResult) return;
  try { await cx('save', { puzzle: P.id, cells: cellStr() }, leaving ? { keepalive: true } : {}); } catch (e) { }
}
setInterval(() => { if (isActive()) { saveNow(); maybeComplete(); } }, 10e3);
document.addEventListener('visibilitychange', () => { if (document.hidden && playing) saveNow(true); });

// ---------- finishing
async function maybeComplete() {
  if (doneResult || !L.ents.every(e => e.cells.every(i => cells[i]))) return;
  const s = cellStr(); if (s === lastFull) return; lastFull = s;
  try {
    const r = await cx('complete', { puzzle: P.id, cells: s });
    if (r.solved) { doneResult = r; tick(true); renderLists(); showDone(r); try { localStorage.removeItem(lsKey()); } catch (e) { } }
    else { toast('Not quite: some letters are wrong. Try Hints → Check puzzle.', 3200); }
  } catch (e) { lastFull = ''; toast('No connection. We\'ll submit when you\'re back online.'); }
}
function showDone(r) {
  best(r.score);
  const b = r.breakdown || {}, isQuick = P.mode === 'quick';
  $('doneBody').innerHTML = `
    <h3>${r.flagged ? 'Solved' : 'Solved!'}</h3>
    <div class="big">${nf(r.score)}</div>
    ${r.secs < 240 ? '<p class="fun">Solved before your cappuccino was ready ☕</p>' : ''}
    <div class="rows">
      <span>Time</span><b>${fmt(r.secs)}</b>
      <span>Base</span><b>${nf(b.base)}</b>
      <span>Time bonus</span><b>+${nf(b.timeBonus)}</b>
      <span>Hints used (${r.assists})</span><b>−${nf(b.penalties)}</b>
      ${b.clean ? `<span>No-hints bonus</span><b>+${nf(b.clean)}</b>` : ''}
      <span>Rank ${isQuick ? 'today' : 'this week'}</span><b>${r.rank ? `#${r.rank} of ${r.of}` : '—'}</b>
    </div>
    ${r.flagged ? '<p class="note">That was very fast, so this solve isn\'t on the board.</p>' : ''}
    <a class="btn" href="#board${isQuick ? '' : '/classic'}">See the leaderboard</a>
    <a class="btn alt" href="#play/${isQuick ? 'classic' : 'quick'}">Play the ${isQuick ? 'Weekly Classic' : 'Quick'}</a>
    <button class="close" data-close>View the grid</button>`;
  openSheet('doneSheet');
}

// ---------- hints
const HINTS = [
  ['checkLetter', 'Check letter'], ['checkWord', 'Check word'], ['definition', 'Show definition'], ['explain', 'Explain clue'],
  ['revealLetter', 'Reveal letter'], ['revealWord', 'Reveal word'], ['checkPuzzle', 'Check whole puzzle', 'wide'],
];
$('hintBtn').onclick = () => {
  if (!P) return;
  if (doneResult) return showDone(doneResult);
  const e = curEntry();
  $('hintSub').textContent = `For ${e.num} ${e.dir}. Each hint costs points.`;
  $('hintList').innerHTML = HINTS.map(([k, label, cls]) => `<button data-h="${k}" class="${cls || ''}">${label}<i>−${costs[k]}</i></button>`).join('');
  openSheet('hintSheet');
};
$('hintList').addEventListener('click', async ev => {
  const b = ev.target.closest('button'); if (!b || busy) return;
  const type = b.dataset.h, e = curEntry(); busy = true;
  try {
    const r = await cx('assist', { puzzle: P.id, type, dir: e.dir, num: e.num, cell: sel.i, cells: cellStr() });
    closeSheets();
    if (r.checked) {
      if (!r.checked.length) toast('Nothing to check yet. Fill in some letters first.');
      else { const wrong = r.checked.filter(x => !x.ok); wrong.forEach(x => bad.add(x.i)); r.checked.forEach(x => drawCell(x.i)); toast(wrong.length ? `${wrong.length} wrong letter${wrong.length > 1 ? 's' : ''}, marked in red` : 'All correct ✓'); }
    }
    if (r.revealed) { for (const x of r.revealed) { cells[x.i] = x.ch; rev.add(x.i); bad.delete(x.i); drawCell(x.i); } localSave(); renderLists(); }
    if (r.span) { defs.set(r.clue, r.span); renderLists(); }
    if (r.text) { explains.set(r.clue, r.text); renderLists(); }
    showPenalty(r.penalty); paint(); maybeComplete();
  } catch (err) { toast(err.status ? err.message : 'Hints need the internet. Check the Wi-Fi.'); }
  busy = false;
});
function showPenalty(p) { $('pPen').textContent = p ? `−${nf(p)}` : ''; }
$('cluesBtn').onclick = () => { openSheet('clueSheet'); $('listsSheet').querySelector('li.on')?.scrollIntoView({ block: 'center' }); };
$('backBtn').onclick = () => go('');

// ---------- leaderboard
let boardMode = 'quick';
async function openBoard(m) {
  boardMode = m; show('sBoard');
  for (const b of $('bTabs').children) b.classList.toggle('on', b.dataset.m === m);
  $('bRows').innerHTML = '<tr><td colspan="4" class="note">Loading…</td></tr>'; $('bNote').textContent = ''; $('bTitle').textContent = '';
  try {
    const j = await cxGet(`board?mode=${m}&name=${encodeURIComponent(API.name)}`); if (boardMode !== m) return;
    const me = API.name.toLowerCase(), row = e => `<tr class="${e.name.toLowerCase() === me ? 'me' : ''}"><td class="rk">${e.rank}</td><td>${esc(e.name)}</td><td class="r">${fmt(e.secs)}</td><td class="r">${nf(e.score)}</td></tr>`;
    let html = j.top.map(row).join('');
    if (j.me && !j.top.some(e => e.name.toLowerCase() === me)) html += '<tr><td colspan="4" class="note">⋯</td></tr>' + row(j.me);
    $('bRows').innerHTML = html || '<tr><td colspan="4" class="note">Nobody has finished yet. Be the first!</td></tr>';
    $('bTitle').textContent = j.puzzle.title;
    $('bNote').textContent = `${j.finished} ${j.finished === 1 ? 'person has' : 'people have'} finished · ${m === 'quick' ? 'resets daily at 05:00' : 'new puzzle every Monday'}`;
  } catch (e) { $('bRows').innerHTML = '<tr><td colspan="4" class="note">Couldn\'t load the board. Check the Wi-Fi.</td></tr>'; }
}
for (const b of $('bTabs').children) b.onclick = () => go(b.dataset.m === 'classic' ? 'board/classic' : 'board');

// ---------- last week's solution
async function openSolution() {
  show('sSolution'); $('solGrid').innerHTML = ''; $('solLists').innerHTML = '<p class="note">Loading…</p>';
  try {
    const S = await cxGet('solution'), SL = layout(S);
    $('solTitle').textContent = S.title;
    const g = document.createElement('div'); g.className = 'grid'; $('solGrid').appendChild(g);
    buildGrid(g, S, SL, S.letters);
    sizeGrid(g, S.cols, S.rows, Math.min(document.querySelector('#sSolution .page').clientWidth - 32, 560), 9999, 36);
    $('solLists').innerHTML = ['across', 'down'].map(d => `<h3>${d === 'across' ? 'Across' : 'Down'}</h3><ol>` + SL.ents.filter(e => e.dir === d).map(e => {
      const [a, b] = e.definition_span, t = e.text;
      return `<li><b>${e.num}</b><span>${esc(t.slice(0, a))}<span class="def">${esc(t.slice(a, b))}</span>${esc(t.slice(b))} (${esc(e.enumeration)})<br><span class="ans">${esc(e.answer)}</span><span class="explain">${esc(e.explanation)}</span></span></li>`;
    }).join('') + '</ol>').join('');
  } catch (e) { $('solLists').innerHTML = '<p class="note">The solution appears when the next Weekly Classic comes out.</p>'; }
}

// ---------- learn: three worked examples
const LESSONS = [
  { kind: 'Anagram', text: 'Listen, unusually quiet', en: '6', def: 'quiet', answer: 'SILENT', why: '“Unusually” tells you to rearrange the letters of LISTEN. They make SILENT, which means “quiet”.' },
  { kind: 'Hidden word', text: 'Vegetable found in cheap eats', en: '3', def: 'Vegetable', answer: 'PEA', why: '“Found in” means the answer is hiding inside the next words: chea<b>P EA</b>ts. A PEA is a vegetable.' },
  { kind: 'Reversal', text: 'Halt, sending pots back', en: '4', def: 'Halt', answer: 'STOP', why: '“Back” means read POTS backwards: STOP, which means “halt”.' },
];
function renderLessons() {
  for (const l of LESSONS) if (typeof l.def === 'string') { const a = l.text.indexOf(l.def); l.def = [a, a + l.def.length]; }
  $('lessons').innerHTML = LESSONS.map((l, n) => `<div class="lesson" data-n="${n}">
    <small style="font:800 12px Nunito;color:var(--muted);text-transform:uppercase;letter-spacing:1px">${n + 1}. ${l.kind}</small>
    <div class="clue">${esc(l.text)} (${l.en})</div>
    <div class="steps"><button data-a="def">1 · Find the definition</button><button data-a="why">2 · See the trick</button></div>
    <div class="out"></div>
    <div style="display:flex;gap:8px;align-items:center;margin-top:10px"><input maxlength="${l.answer.length}" placeholder="${'·'.repeat(l.answer.length)}" aria-label="Your answer" autocapitalize="characters" autocomplete="off" spellcheck="false"><span class="res" style="font:800 14px Nunito"></span></div>
  </div>`).join('');
  for (const card of document.querySelectorAll('.lesson')) {
    const l = LESSONS[card.dataset.n], out = card.querySelector('.out'), clue = card.querySelector('.clue');
    card.querySelector('[data-a=def]').onclick = () => { clue.innerHTML = `${esc(l.text.slice(0, l.def[0]))}<span class="def">${esc(l.text.slice(...l.def))}</span>${esc(l.text.slice(l.def[1]))} (${l.en})`; out.innerHTML = `The definition is <b>${esc(l.text.slice(...l.def))}</b>, at the ${l.def[0] === 0 ? 'start' : 'end'} of the clue.`; };
    card.querySelector('[data-a=why]').onclick = () => { out.innerHTML = l.why; };
    const inp = card.querySelector('input'), res = card.querySelector('.res');
    inp.oninput = () => { const v = inp.value.toUpperCase().replace(/[^A-Z]/g, ''); inp.value = v; res.textContent = v.length < l.answer.length ? '' : v === l.answer ? '✓ Nice!' : 'Not quite'; res.style.color = v === l.answer ? 'var(--good)' : 'var(--wrong)'; };
  }
}

// ---------- start
API.flush();
route();
