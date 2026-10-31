// Msako wa Maneno: screens, the letter board, swipes, hints and the secret phrase.
// The phone only knows the letters and how long each word is. Every swipe goes to the server
// (/api/msako/find), which says whether it was a word, keeps the time and works out the score.
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const BASE = (window.HZE_API || '') + '/api/msako/';
const N = 8;
const COLORS = ['#E87E3A', '#2BA796', '#E0B252', '#E0607A', '#5B9BE0', '#7FBF5A', '#A57FE0', '#C98A4B', '#4FC3D9', '#E57FC4'];
const signInAgain = () => location.replace('../?next=msako/');
if (!API.name) signInAgain();

let P = null, S = null; // today's puzzle and this player's progress (as the server last sent it)
async function mx(route, data = {}) {
  const r = await fetch(BASE + route, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: API.name, token: API.token, day: P?.id, ...data }) });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401) signInAgain();
  if (r.status === 410) { toast('Gridi mpya imefika! · New grid is up'); openPuzzle(); }
  if (!r.ok) throw Object.assign(new Error(j.error || r.statusText), { status: r.status, body: j });
  return j;
}
async function mget(path) { const r = await fetch(BASE + path); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || r.statusText); return j; }

let toastT;
function toast(msg, ms = 2000) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms); }
const fmt = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const nf = n => Number(n || 0).toLocaleString('en');
const saveBest = n => { try { if (n > +(localStorage.getItem('hze_best_msako') || 0)) localStorage.setItem('hze_best_msako', n); } catch (e) { } };
const color = i => COLORS[i % COLORS.length];
const rc = i => [Math.floor(i / N), i % N];

// ---------- screens (#play, #board, #jana)
let playing = false;
function show(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('on', s.id === id);
  if (playing && id !== 'sPlay') ping();
  playing = id === 'sPlay';
}
function route() {
  closeSheets();
  const h = location.hash.slice(1);
  if (h === 'play') return openPuzzle();
  if (h === 'board') return openBoard('today');
  if (h === 'jana') return openJana();
  openHome();
}
window.addEventListener('hashchange', route);
const go = h => { location.hash = h; };
for (const b of document.querySelectorAll('[data-go]')) b.onclick = () => go(b.dataset.go);
$('backBtn').onclick = () => go('');

function openSheet(id) { $(id).classList.add('on'); }
function closeSheets() { for (const s of document.querySelectorAll('.sheet')) s.classList.remove('on'); }
for (const s of document.querySelectorAll('.sheet')) s.addEventListener('click', e => { if (e.target === s || e.target.closest('[data-close]')) s.classList.remove('on'); });

// ---------- home
async function openHome() {
  show('sHome'); $('who').textContent = API.name;
  try {
    const h = await mx('home');
    $('tNum').textContent = '#' + h.num; $('tTheme').textContent = h.theme.sw;
    $('tBar').style.width = (h.state === 'done' ? 100 : Math.round(100 * h.found / h.words)) + '%';
    $('tSub').textContent = h.theme.en + ' · ' + (h.state === 'done' ? `Umemaliza · done, rank ${h.result.rank || '–'} of ${h.result.of}` : h.state === 'started' ? `${h.found} of ${h.words} words` : `${h.words} words to find`);
    $('tGo').innerHTML = h.state === 'done' ? `✓ ${nf(h.result.score)}<small>Tazama · See your grid</small>` : h.state === 'started' ? 'ENDELEA<small>Resume</small>' : 'CHEZA<small>Play</small>';
    if (h.result) saveBest(h.result.score);
    $('homeNote').textContent = '';
  } catch (e) { if (e.status !== 401) $('homeNote').textContent = 'Hakuna mtandao · No connection. Check the Wi-Fi and try again.'; }
}
$('todayCard').onclick = () => go('play');

// ---------- board drawing (shared by today's grid and yesterday's answers)
function buildGrid(el, letters) {
  for (const c of el.querySelectorAll('.c')) c.remove();
  el.insertAdjacentHTML('beforeend', [...letters].map((ch, i) => `<div class="c" data-i="${i}">${ch}</div>`).join(''));
}
function strokes(words, fresh) {
  return words.map((w, i) => {
    if (!w.cells) return '';
    const [r0, c0] = rc(w.cells[0]), [r1, c1] = rc(w.cells[w.cells.length - 1]);
    return `<line class="mark${w.revealed ? ' rev' : ''}${w.word === fresh ? ' new' : ''}" stroke="${color(i)}" x1="${c0 + .5}" y1="${r0 + .5}" x2="${c1 + .5}" y2="${r1 + .5}"/>`;
  }).join('');
}
function slotsHtml(words) {
  return words.map((w, i) => {
    const boxes = Array.from({ length: w.len }, (_, k) => `<i>${w.word ? w.word[k] : k === 0 && w.first ? w.first.letter : ''}</i>`).join('');
    return `<div class="slot${w.word ? ' found' : ''}${w.revealed ? ' revealed' : ''}" style="--wc:${color(i)}" aria-label="${w.word || w.len + ' letters'}">${boxes}</div>`;
  }).join('');
}

// ---------- play
let fresh = null, syncedMs = 0, syncedAt = 0, lastInput = 0;
async function openPuzzle() {
  show('sPlay');
  $('pTheme').textContent = 'Inapakia…'; $('pNum').textContent = ''; $('slots').innerHTML = ''; $('secretBtn').innerHTML = '';
  try {
    const j = await mx('open');
    P = j.puzzle; fresh = null; anchor = null;
    $('pNum').textContent = `Msako #${P.num} · ${P.theme.en}`; $('pTheme').textContent = P.theme.sw;
    $('costFirst').textContent = '−' + P.hints.first; $('costReveal').textContent = '−' + P.hints.reveal;
    buildGrid($('grid'), P.grid); sizeBoard(); apply(j.session);
    lastInput = Date.now();
    if (S.done) showDone();
  } catch (e) { if (e.status !== 401 && e.status !== 410) { $('pTheme').textContent = 'Hakuna mtandao · No connection'; } }
}
function apply(s) {
  S = s; syncedMs = s.activeMs; syncedAt = Date.now();
  $('marks').innerHTML = strokes(S.words, fresh) + '<line id="pend" class="mark pend" x1="0" y1="0" x2="0" y2="0" visibility="hidden"/>';
  $('slots').innerHTML = slotsHtml(S.words);
  const spare = new Set(S.secret.cells || []), firsts = new Set(S.words.filter(w => w.first).map(w => w.first.cell));
  for (const c of $('grid').querySelectorAll('.c')) { const i = +c.dataset.i; c.classList.toggle('spare', spare.has(i)); c.classList.toggle('anchor', i === anchor); if (!firsts.has(i)) c.classList.remove('first'); }
  renderSecret(); tick();
}
function renderSecret() {
  const s = S.secret, b = $('secretBtn');
  b.className = 'secret' + (s.state ? ' ' + s.state : '');
  if (!s.state) b.innerHTML = `<span><small>Neno la siri · Secret phrase · ${s.len} letters</small><b>(${s.enumeration})</b> <small>Herufi zilizobaki zinaunda msemo · The unused letters spell it</small></span><span class="go">KISIA +300</span>`;
  else if (s.state === 'won') b.innerHTML = `<span><small>Neno la siri ✓ +300</small><b>${esc(s.text)}</b></span>`;
  else b.innerHTML = `<span><small>Neno la siri · ${s.state === 'lost' ? 'no guesses left' : 'not guessed'}</small><b>${esc(s.text)}</b></span>`;
}
$('secretBtn').onclick = () => {
  if (!S || S.secret.state) return;
  $('guessSub').textContent = `${S.secret.len} letters (${S.secret.enumeration}). Read the letters no word uses, left to right, top to bottom. ${S.secret.guessesLeft} ${S.secret.guessesLeft === 1 ? 'try' : 'tries'} left, −50 for a wrong one.`;
  $('guessHint').textContent = ''; $('guessIn').value = ''; openSheet('guessSheet'); setTimeout(() => $('guessIn').focus(), 50);
};
$('guessBtn').onclick = async () => {
  const text = $('guessIn').value.trim(); if (!text) return;
  $('guessBtn').disabled = true;
  try {
    const r = await mx('guess', { text }); apply(r.session);
    if (r.correct) { closeSheets(); toast('Sahihi! · Correct! +300'); }
    else if (S.secret.state === 'lost') { closeSheets(); toast('Imeisha · Out of guesses: ' + S.secret.text, 3500); }
    else { $('guessHint').className = 'hint err'; $('guessHint').textContent = `Si sahihi · Not quite (−50). ${S.secret.guessesLeft} left.`; }
  } catch (e) { $('guessHint').className = 'hint err'; $('guessHint').textContent = e.status ? e.message : 'Hakuna mtandao · No connection'; }
  $('guessBtn').disabled = false;
};
$('guessIn').addEventListener('keydown', e => { if (e.key === 'Enter') $('guessBtn').click(); });

// ---------- hints
$('hintBtn').onclick = () => {
  if (!S || S.done) return;
  const open = S.words.filter(w => !w.word);
  document.querySelector('[data-hint="first"]').disabled = !open.some(w => !w.first);
  openSheet('hintSheet');
};
for (const b of document.querySelectorAll('[data-hint]')) b.onclick = async () => {
  closeSheets();
  try {
    const before = new Set(S.words.filter(w => w.word).map(w => w.word)), r = await mx('hint', { type: b.dataset.hint });
    fresh = r.session.words.find(w => w.word && !before.has(w.word))?.word || null;
    apply(r.session); toast(`Msaada · Hint −${r.cost}`);
    if (b.dataset.hint === 'first') { const w = S.words.filter(w => w.first).pop(); const c = w && $('grid').querySelector(`[data-i="${w.first.cell}"]`); if (c) { c.classList.remove('first'); void c.offsetWidth; c.classList.add('first'); } }
    if (S.done) setTimeout(showDone, 700);
  } catch (e) { toast(e.status ? e.message : 'Hakuna mtandao · No connection'); }
};

// ---------- swiping
// Drag from the first letter to the last (any straight line), or tap the first letter then the last.
let drag = null, anchor = null, busy = false;
const grid = $('grid');
function pos(e) { const r = grid.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * N, y: (e.clientY - r.top) / r.height * N }; }
const cellAt = p => Math.min(N - 1, Math.max(0, Math.floor(p.y))) * N + Math.min(N - 1, Math.max(0, Math.floor(p.x)));
// nearest straight line from square a towards point p (8 directions), kept inside the board
function snap(a, p) {
  const [ar, ac] = rc(a), dx = p.x - (ac + .5), dy = p.y - (ar + .5), dist = Math.hypot(dx, dy);
  if (dist < .5) return a;
  const k = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)), dc = Math.round(Math.cos(k * Math.PI / 4)), dr = Math.round(Math.sin(k * Math.PI / 4));
  let len = Math.round(dist / (dc && dr ? Math.SQRT2 : 1));
  while (len > 0 && (ar + dr * len < 0 || ar + dr * len >= N || ac + dc * len < 0 || ac + dc * len >= N)) len--;
  return (ar + dr * len) * N + ac + dc * len;
}
function cellsOf(a, b) {
  const [r0, c0] = rc(a), [r1, c1] = rc(b), dr = Math.sign(r1 - r0), dc = Math.sign(c1 - c0), len = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0)) + 1;
  return Array.from({ length: len }, (_, k) => (r0 + dr * k) * N + c0 + dc * k);
}
function pending(a, b, cls = 'mark pend') {
  const l = $('pend'); if (!l) return;
  if (a === null) { l.setAttribute('visibility', 'hidden'); return; }
  const [r0, c0] = rc(a), [r1, c1] = rc(b);
  l.setAttribute('class', cls); l.setAttribute('visibility', 'visible');
  l.setAttribute('x1', c0 + .5); l.setAttribute('y1', r0 + .5); l.setAttribute('x2', c1 + .5); l.setAttribute('y2', r1 + .5);
}
function selText(text, cls = '') { const s = $('selText'); s.textContent = text; s.className = 'sel' + (cls ? ' ' + cls : ''); }
function markAnchor() { for (const c of grid.querySelectorAll('.c')) c.classList.toggle('anchor', +c.dataset.i === anchor); }

grid.addEventListener('pointerdown', e => {
  if (!S || S.done || busy || !e.isPrimary) return;
  const a = cellAt(pos(e)); drag = { a, b: a };
  grid.setPointerCapture(e.pointerId); lastInput = Date.now();
  pending(a, a); selText(P.grid[a]);
});
grid.addEventListener('pointermove', e => {
  if (!drag) return;
  const b = snap(drag.a, pos(e)); if (b === drag.b) return;
  drag.b = b; pending(drag.a, b); selText(cellsOf(drag.a, b).map(i => P.grid[i]).join(''));
});
grid.addEventListener('pointerup', () => {
  if (!drag) return;
  const { a, b } = drag; drag = null;
  if (a !== b) { anchor = null; markAnchor(); return submit(a, b); }
  // a tap: the first tap picks the start, the second picks the end
  if (anchor !== null && anchor !== a) { const [r, c] = rc(a), from = anchor, to = snap(from, { x: c + .5, y: r + .5 }); anchor = null; markAnchor(); return submit(from, to); }
  anchor = anchor === a ? null : a; markAnchor(); pending(null);
  selText(anchor === null ? '' : P.grid[anchor]);
});
grid.addEventListener('pointercancel', () => { drag = null; pending(null); selText(''); });

async function submit(a, b) {
  const cells = cellsOf(a, b), word = cells.map(i => P.grid[i]).join('');
  if (cells.length < 3) { pending(null); selText(''); return; }
  busy = true; pending(a, b);
  try {
    const r = await mx('find', { a, b });
    fresh = r.word || null; apply(r.session);
    if (r.word) { selText(r.word + ' ✓', 'ok'); if (S.done) setTimeout(showDone, 700); }
    else if (r.already) selText(`${r.already} · tayari · already found`, 'bad');
    else { selText(word, 'bad'); pending(a, b, 'mark bad'); setTimeout(() => pending(null), 350); }
  } catch (e) { pending(null); selText(''); toast(e.status ? e.message : 'Hakuna mtandao · No connection'); }
  busy = false;
  setTimeout(() => { if (!drag && !busy) selText(''); }, 1400);
}

function sizeBoard() {
  if (!playing) return;
  const w = $('boardWrap').getBoundingClientRect(), size = Math.floor(Math.min(w.width - 8, w.height - 8, 520));
  grid.style.width = size + 'px'; grid.style.setProperty('--cell', size / N + 'px');
}
window.addEventListener('resize', sizeBoard);

// ---------- timer: the server counts play time; the phone just shows it ticking
const isActive = () => playing && !document.hidden && Date.now() - lastInput < 60e3;
function tick() {
  if (!S) return;
  const extra = !S.done && isActive() ? Math.min(Date.now() - syncedAt, 30e3) : 0;
  $('pTime').textContent = fmt((S.done ? S.done.secs * 1000 : syncedMs + extra) / 1000);
}
setInterval(tick, 1000);
async function ping() { if (!S || S.done) return; try { const r = await mx('ping'); S.activeMs = r.session.activeMs; syncedMs = S.activeMs; syncedAt = Date.now(); } catch (e) { } }
setInterval(() => { if (isActive() && !S?.done) ping(); }, 10e3);
document.addEventListener('visibilitychange', () => { if (document.hidden && playing) ping(); });
document.addEventListener('pointerdown', () => { if (playing) lastInput = Date.now(); }, true);

// ---------- finished
function showDone() {
  const d = S.done; if (!d) return;
  const b = d.breakdown; saveBest(d.score);
  $('doneBody').innerHTML = `<div class="done">
    <h3>${d.flagged ? 'Umemaliza!' : 'Hongera!'}</h3>
    <p class="big">${nf(d.score)}</p>
    <div class="rankline">${d.flagged ? 'Too fast for the leaderboard' : d.rank ? `#${d.rank} kati ya ${d.of} leo · today` : ''}</div>
    <div class="rows">
      <span>Msingi · Base</span><b>${nf(b.base)}</b>
      <span>Muda · Time ${fmt(b.secs)}</span><b>+${nf(b.timeBonus)}</b>
      <span>Neno la siri</span><b>+${nf(b.secret)}</b>
      <span>Bila msaada · No hints</span><b>+${nf(b.clean)}</b>
      <span>Msaada na makosa · Hints and wrong guesses</span><b class="neg">−${nf(b.penalties)}</b>
    </div>
    <p class="note">Neno la siri: <b>${esc(S.secret.text)}</b></p>
    <button class="btn" onclick="go('board')">UBAO<small>Leaderboard</small></button>
    <div class="row"><a class="btn ghost" href="../">Michezo<small>All games</small></a><button class="btn ghost" data-close>Gridi<small>See the grid</small></button></div>
  </div>`;
  openSheet('doneSheet');
}

// ---------- leaderboard
let boardDay = 'today';
for (const b of $('bTabs').children) b.onclick = () => openBoard(b.dataset.d);
async function openBoard(d) {
  boardDay = d; show('sBoard');
  for (const b of $('bTabs').children) b.classList.toggle('on', b.dataset.d === d);
  $('bRows').innerHTML = ''; $('bNote').textContent = 'Inapakia…';
  try {
    const j = await mget(`board?day=${d}&name=${encodeURIComponent(API.name)}`);
    if (boardDay !== d) return;
    $('bTitle').textContent = `#${j.num} · ${j.theme.sw.toUpperCase()}`;
    const row = (e, me) => `<li class="${me ? 'me ' : ''}${e.rank <= 3 ? 'top' + e.rank : ''}"><span class="rk">${e.rank}</span><span class="nm">${esc(e.name)}<small>${fmt(e.secs)}${e.secret ? ' · 🔑 siri' : ''}${e.hints ? ` · ${e.hints} hint${e.hints > 1 ? 's' : ''}` : ''}</small></span><span class="sc">${nf(e.score)}</span></li>`;
    const meIn = j.me && j.top.some(e => e.rank === j.me.rank);
    $('bRows').innerHTML = j.top.map(e => row(e, j.me && e.rank === j.me.rank)).join('') + (j.me && !meIn ? row(j.me, true) : '');
    $('bNote').textContent = j.top.length ? `${j.finished} wamemaliza · finished` : 'Bado hakuna · Nobody has finished yet. Be the first!';
  } catch (e) { $('bNote').textContent = 'Hakuna mtandao · No connection'; }
}

// ---------- yesterday's answers
async function openJana() {
  show('sJana'); $('jWords').innerHTML = ''; $('jPhrase').textContent = 'Inapakia…';
  try {
    const j = await mget('yesterday'), g = $('jGrid');
    $('jTitle').textContent = `#${j.num} · ${j.theme.sw.toUpperCase()} · ${j.theme.en.toUpperCase()}`;
    buildGrid(g, j.grid);
    const words = j.words.map(w => ({ word: w.word, len: w.word.length, cells: w.cells }));
    g.querySelector('svg').innerHTML = strokes(words);
    const spare = new Set(j.spare); for (const c of g.querySelectorAll('.c')) c.classList.toggle('spare', spare.has(+c.dataset.i));
    $('jWords').innerHTML = slotsHtml(words);
    $('jPhrase').innerHTML = `<small>Neno la siri · Secret phrase</small>${esc(j.phrase)}`;
  } catch (e) { $('jPhrase').textContent = 'Hakuna mtandao · No connection'; }
}

API.flush();
route();
