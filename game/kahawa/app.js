// Kahawa Iko Wapi?: screens, the zoomable picture, taps, hints and the leaderboards.
// The phone never knows where the bags are. It shows the outlines as one picture from the server,
// sends each tap (/api/kahawa/find), and colours a bag in when the server says it was one.
import { bagSvg } from './bags.mjs';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const BASE = (window.HZE_API || '') + '/api/kahawa/';
const signInAgain = () => location.replace('../?next=kahawa/');
if (!API.name) signInAgain();

let P = null, S = null; // today's scene and this player's progress (as the server last sent it)
async function kx(route, data = {}) {
  const r = await fetch(BASE + route, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: API.name, token: API.token, day: P?.id, ...data }) });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401) signInAgain();
  if (r.status === 410) { toast('Picha mpya imefika! · New picture is up'); openScene(); }
  if (!r.ok) throw Object.assign(new Error(j.error || r.statusText), { status: r.status, body: j });
  return j;
}
async function kget(path) { const r = await fetch(BASE + path); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || r.statusText); return j; }

let toastT;
function toast(msg, ms = 2000) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms); }
const fmt = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const nf = n => Number(n || 0).toLocaleString('en');
const saveBest = n => { try { if (n > +(localStorage.getItem('hze_best_kahawa') || 0)) localStorage.setItem('hze_best_kahawa', n); } catch (e) { } };

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
  if (h === 'play') return openScene();
  if (h === 'board') return openBoard('today');
  if (h === 'jana') return openJana();
  openHome();
}
window.addEventListener('hashchange', route);
const go = h => { location.hash = h; };
document.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) { e.preventDefault(); closeSheets(); go(b.dataset.go); } });
$('backBtn').onclick = () => go('');

function openSheet(id) { $(id).classList.add('on'); }
function closeSheets() { for (const s of document.querySelectorAll('.sheet')) s.classList.remove('on'); }
for (const s of document.querySelectorAll('.sheet')) s.addEventListener('click', e => { if (e.target === s || e.target.closest('[data-close]')) s.classList.remove('on'); });

// ---------- home
async function openHome() {
  show('sHome'); $('who').textContent = API.name;
  try {
    const h = await kx('home');
    $('tNum').textContent = '#' + h.num; $('tName').textContent = h.name.sw;
    $('tBar').style.width = Math.round(100 * h.found / h.count) + '%';
    $('tSub').textContent = h.name.en + ' · ' + (h.state === 'done' ? `Umemaliza · done, rank ${h.result.rank || '–'} of ${h.result.of}` : h.state === 'started' ? `${h.found} of ${h.count} bags · ${nf(h.score)} points` : `${h.count} bags hidden`);
    $('tGo').innerHTML = h.state === 'done' ? `✓ ${nf(h.result.score)}<small>Tazama · See the picture</small>` : h.state === 'started' ? 'ENDELEA<small>Resume</small>' : 'CHEZA<small>Play</small>';
    $('tMonth').textContent = nf(h.month); $('tAll').textContent = nf(h.all);
    if (h.result) saveBest(h.result.score);
    $('homeNote').textContent = '';
  } catch (e) { if (e.status !== 401) $('homeNote').textContent = e.status === 503 ? 'Picha bado hazijawekwa · No pictures yet.' : 'Hakuna mtandao · No connection. Check the Wi-Fi and try again.'; }
}
$('todayCard').onclick = () => go('play');

// ---------- the picture: pan and zoom
// view.k is the zoom (screen pixels per picture pixel); view.x/y is where the picture's corner sits.
const stage = $('pic'), world = $('world'), fx = $('fx');
const view = { k: 1, x: 0, y: 0 };
const limits = () => { const r = stage.getBoundingClientRect(), fit = Math.min(r.width / P.w, r.height / P.h); return { r, fit, max: Math.max(fit * 6, 1.2) }; };
// The picture can be dragged a little past its edges, so nothing stays stuck under the zoom buttons.
const SLACK = 72;
function clampView() {
  const { r } = limits(), w = P.w * view.k, h = P.h * view.k;
  view.x = Math.min(Math.max(0, r.width - w) + SLACK, Math.max(Math.min(0, r.width - w) - SLACK, view.x));
  view.y = Math.min(Math.max(0, r.height - h) + SLACK, Math.max(Math.min(0, r.height - h) - SLACK, view.y));
}
function applyView() { clampView(); world.style.transform = `translate(${view.x}px,${view.y}px) scale(${view.k})`; }
function zoomAt(k, sx, sy) { // keep the picture point under screen point sx,sy where it is
  const { fit, max } = limits(), nk = Math.min(max, Math.max(fit, k));
  view.x = sx - (sx - view.x) * nk / view.k; view.y = sy - (sy - view.y) * nk / view.k; view.k = nk; applyView();
}
function fitView() { if (!P) return; const { r, fit } = limits(); view.k = fit; view.x = (r.width - P.w * fit) / 2; view.y = (r.height - P.h * fit) / 2; applyView(); }
const centre = () => { const r = stage.getBoundingClientRect(); return [r.width / 2, r.height / 2]; };
$('zIn').onclick = () => zoomAt(view.k * 1.6, ...centre());
$('zOut').onclick = () => zoomAt(view.k / 1.6, ...centre());
$('zFit').onclick = fitView;
let lastSize = '';
new ResizeObserver(() => { if (!P || !playing) return; const r = stage.getBoundingClientRect(), s = r.width + 'x' + r.height; if (s === lastSize) return; const first = !lastSize; lastSize = s; if (first) fitView(); else applyView(); }).observe(stage);

// One finger drags, two fingers pinch. A touch that barely moves is a tap.
const ptrs = new Map(); let gest = null;
const local = e => { const r = stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
stage.addEventListener('pointerdown', e => {
  if (e.target.closest('.zoom') || !P) return;
  // the first finger of a new touch starts fresh, in case a lift-off was never reported
  if (e.isPrimary) { ptrs.clear(); gest = null; }
  stage.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, local(e)); lastInput = Date.now();
  if (ptrs.size === 1) gest = { start: local(e), at: Date.now(), x: view.x, y: view.y, moved: false, multi: false };
  else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; gest = { ...gest, multi: true, d: Math.hypot(a.x - b.x, a.y - b.y), m: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, k: view.k, x: view.x, y: view.y }; }
});
stage.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId) || !gest) return;
  ptrs.set(e.pointerId, local(e));
  if (ptrs.size >= 2 && gest.multi) {
    const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const { fit, max } = limits(), nk = Math.min(max, Math.max(fit, gest.k * d / gest.d));
    view.x = m.x - (gest.m.x - gest.x) * nk / gest.k; view.y = m.y - (gest.m.y - gest.y) * nk / gest.k; view.k = nk; applyView();
  } else if (ptrs.size === 1 && !gest.multi) {
    const p = local(e), dx = p.x - gest.start.x, dy = p.y - gest.start.y;
    if (!gest.moved && Math.hypot(dx, dy) > 8) { gest.moved = true; stage.classList.add('dragging'); }
    if (gest.moved) { view.x = gest.x + dx; view.y = gest.y + dy; applyView(); }
  }
});
function release(e, cancel) {
  if (!ptrs.has(e.pointerId)) return;
  const p = ptrs.get(e.pointerId); ptrs.delete(e.pointerId);
  if (ptrs.size) return; // still pinching or the second finger is still down
  const g = gest; gest = null; stage.classList.remove('dragging');
  if (!cancel && g && !g.moved && !g.multi && Date.now() - g.at < 700) tap(p.x, p.y);
}
stage.addEventListener('pointerup', e => release(e, false));
stage.addEventListener('pointercancel', e => release(e, true));
stage.addEventListener('lostpointercapture', e => release(e, true));
stage.addEventListener('wheel', e => { if (!P) return; e.preventDefault(); const p = local(e); zoomAt(view.k * Math.exp(-e.deltaY * .0015), p.x, p.y); }, { passive: false });

// ---------- play
let syncedMs = 0, syncedAt = 0, lastInput = 0, busy = false, coolT = null;
async function openScene() {
  show('sPlay');
  $('pName').textContent = 'Inapakia…'; $('pNum').textContent = ''; $('foundCount').textContent = ''; $('pips').innerHTML = ''; $('pScore').textContent = '';
  try {
    const j = await kx('open');
    const fresh = P?.id !== j.puzzle.id; P = j.puzzle;
    $('pNum').textContent = `Kahawa #${P.num} · ${P.name.en}`; $('pName').textContent = P.name.sw;
    $('hintCost').textContent = P.hintCost;
    world.style.width = P.w + 'px'; world.style.height = P.h + 'px';
    fx.setAttribute('viewBox', `0 0 ${P.w} ${P.h}`);
    if (fresh) { $('bg').src = P.image; $('bagsImg').src = `${BASE}bags.svg?day=${P.id}`; fx.innerHTML = ''; lastSize = ''; }
    apply(j.session, null);
    requestAnimationFrame(() => { if (!lastSize) { lastSize = stage.getBoundingClientRect().width + 'x' + stage.getBoundingClientRect().height; fitView(); } });
    lastInput = Date.now();
    if (S.done) setTimeout(showDone, 400);
  } catch (e) { if (e.status !== 401 && e.status !== 410) $('pName').textContent = e.status === 503 ? 'Picha bado hazijawekwa · No pictures yet' : 'Hakuna mtandao · No connection'; }
}
function apply(s, freshBag) {
  S = s; syncedMs = s.activeMs; syncedAt = Date.now();
  // found bags in colour (the newest one pops), and any hint circles still open
  fx.innerHTML = s.hints.map(h => `<circle class="hintc" cx="${h.x}" cy="${h.y}" r="${h.r}" stroke-width="${4}"/>`).join('')
    + s.found.map(b => bagSvg(b, b.gold ? 'gold' : 'color', P.line, b.i === freshBag ? ' class="found"' : '')).join('');
  $('foundCount').innerHTML = `Umepata <b>${s.found.length}/${s.count}</b>`;
  // one pip per bag: found ones lit (the golden one first, in gold), the rest dark
  const lit = [...s.found].sort((a, b) => !!b.gold - !!a.gold);
  $('pips').innerHTML = Array.from({ length: s.count }, (_, i) => `<i class="${lit[i] ? 'on' + (lit[i].gold ? ' gold' : '') : ''}"></i>`).join('');
  $('pScore').textContent = nf(s.score) + ' pts';
  world.classList.toggle('done', !!s.done);
  tick();
}
function floatText(x, y, text, cls = '') {
  const el = document.createElement('div'); el.className = 'float ' + cls; el.textContent = text;
  el.style.left = x + 'px'; el.style.top = y + 'px'; stage.appendChild(el); setTimeout(() => el.remove(), 950);
}
function missRing(sx, sy) {
  const px = (sx - view.x) / view.k, py = (sy - view.y) / view.k, r = 18 / view.k;
  fx.insertAdjacentHTML('beforeend', `<circle class="ring" cx="${px}" cy="${py}" r="${r}" stroke-width="${3 / view.k}"/>`);
  const c = fx.lastElementChild; setTimeout(() => c.remove(), 520);
}
function cooling(ms) {
  $('cool').classList.add('on'); clearTimeout(coolT);
  coolT = setTimeout(() => $('cool').classList.remove('on'), Math.max(600, ms));
}
async function tap(sx, sy) {
  if (!S || S.done || busy) return;
  const x = (sx - view.x) / view.k, y = (sy - view.y) / view.k;
  if (x < 0 || y < 0 || x > P.w || y > P.h) return;
  busy = true;
  try {
    const r = await kx('find', { x: Math.round(x), y: Math.round(y) });
    if (r.bag) {
      apply(r.session, r.bag.i);
      floatText(sx, sy, (r.bag.gold ? '★ +' : '+') + r.points, r.bag.gold ? 'gold' : '');
      if (r.bag.gold) toast('Mfuko wa dhahabu! · Golden bag! +300');
      navigator.vibrate?.(30);
      if (S.done) setTimeout(showDone, 1400);
    } else if (r.miss) {
      apply(r.session, null); missRing(sx, sy); floatText(sx, sy, '−' + r.cost, 'miss');
      if (r.cooling) cooling(r.session.coolMs);
    } else if (r.cooling) cooling(r.session.coolMs);
  } catch (e) { toast(e.status ? e.message : 'Hakuna mtandao · No connection'); }
  busy = false;
}

// ---------- hints
$('hintBtn').onclick = () => { if (S && !S.done) openSheet('hintSheet'); };
$('hintGo').onclick = async () => {
  closeSheets();
  try {
    const r = await kx('hint'); apply(r.session, null); toast(`Msaada · Hint −${r.cost}`);
    // zoom out enough to see the circle, centred on it
    const h = S.hints[S.hints.length - 1]; if (h) { const { r: box } = limits(); const k = Math.min(box.width, box.height) / (h.r * 4); view.k = Math.max(limits().fit, Math.min(limits().max, k)); view.x = box.width / 2 - h.x * view.k; view.y = box.height / 2 - h.y * view.k; applyView(); }
  } catch (e) { toast(e.status ? e.message : 'Hakuna mtandao · No connection'); }
};

// ---------- timer: the server counts play time; the phone just shows it ticking
const isActive = () => playing && !document.hidden && Date.now() - lastInput < 60e3;
function tick() {
  if (!S) return;
  const extra = !S.done && isActive() ? Math.min(Date.now() - syncedAt, 30e3) : 0;
  $('pTime').textContent = fmt((S.done ? S.done.secs * 1000 : syncedMs + extra) / 1000);
}
setInterval(tick, 1000);
async function ping() { if (!S || S.done) return; try { const r = await kx('ping'); S.activeMs = r.session.activeMs; syncedMs = S.activeMs; syncedAt = Date.now(); } catch (e) { } }
setInterval(() => { if (isActive() && !S?.done) ping(); }, 10e3);
document.addEventListener('visibilitychange', () => { if (document.hidden && playing) ping(); });
document.addEventListener('pointerdown', () => { if (playing) lastInput = Date.now(); }, true);

// ---------- finished
function showDone() {
  const d = S.done; if (!d) return;
  const b = d.breakdown; saveBest(d.score);
  $('doneBody').innerHTML = `<div class="done">
    <h3>${d.flagged ? 'Umemaliza!' : 'Hongera! Umeipata yote!'}</h3>
    <p class="big">${nf(d.score)}</p>
    <div class="rankline">${d.flagged ? 'Too fast for the leaderboard' : d.rank ? `#${d.rank} kati ya ${d.of} leo · today` : ''}</div>
    <div class="rows">
      <span>Mifuko · Bags</span><b>+${nf(b.bags)}</b>
      <span>Umemaliza · Found them all</span><b>+${nf(b.finish)}</b>
      <span>Muda · Time ${fmt(b.secs)}</span><b>+${nf(b.timeBonus)}</b>
      <span>Bila msaada · No hints</span><b>+${nf(b.clean)}</b>
      <span>Makosa na msaada · ${b.misses} wrong tap${b.misses === 1 ? '' : 's'}${d.breakdown.clean ? '' : ', hints'}</span><b class="neg">−${nf(b.penalties)}</b>
    </div>
    <div class="totals"><div><small>Mwezi huu · This month</small><b>${nf(d.month)}</b></div><div><small>Jumla · All-time</small><b>${nf(d.all)}</b></div></div>
    <button class="btn" data-go="board">UBAO<small>Leaderboard</small></button>
    <div class="row"><a class="btn ghost" href="../">Michezo<small>All games</small></a><button class="btn ghost" data-close>Picha<small>See the picture</small></button></div>
  </div>`;
  openSheet('doneSheet');
}

// ---------- leaderboard: today, this month, all-time
let boardP = 'today';
for (const b of $('bTabs').children) b.onclick = () => openBoard(b.dataset.p);
async function openBoard(p) {
  boardP = p; show('sBoard');
  for (const b of $('bTabs').children) b.classList.toggle('on', b.dataset.p === p);
  $('bRows').innerHTML = ''; $('bNote').textContent = 'Inapakia…';
  try {
    const j = await kget(`board?period=${p}&name=${encodeURIComponent(API.name)}`);
    if (boardP !== p) return;
    const month = new Date(j.month + '-01T00:00:00Z').toLocaleString('en', { month: 'long', timeZone: 'UTC' }).toUpperCase();
    $('bTitle').textContent = p === 'today' ? `#${j.num} · ${j.name.sw.toUpperCase()}` : p === 'month' ? `${month} · POINTS THIS MONTH` : 'ALL-TIME POINTS';
    const sub = e => p === 'today' ? `${e.found}/${e.of} bags${e.done ? ' · ' + fmt(e.secs) : ''}` : p === 'all' ? `${e.days} day${e.days === 1 ? '' : 's'} played` : '';
    const row = (e, me) => `<li class="${me ? 'me ' : ''}${e.rank <= 3 ? 'top' + e.rank : ''}"><span class="rk">${e.rank}</span><span class="nm">${esc(e.name)}${sub(e) ? `<small>${sub(e)}</small>` : ''}</span><span class="sc">${nf(e.score)}</span></li>`;
    const meIn = j.me && j.top.some(e => e.rank === j.me.rank);
    $('bRows').innerHTML = j.top.map(e => row(e, j.me && e.rank === j.me.rank)).join('') + (j.me && !meIn ? row(j.me, true) : '');
    $('bNote').textContent = j.top.length ? `${j.players} ${p === 'today' ? 'wanacheza leo · playing today' : 'wachezaji · players'}` : 'Bado hakuna · Nobody yet. Be the first!';
  } catch (e) { $('bNote').textContent = 'Hakuna mtandao · No connection'; }
}

// ---------- yesterday's picture with every bag coloured in
async function openJana() {
  show('sJana'); $('jNote').textContent = 'Inapakia…';
  try {
    const j = await kget('yesterday'), pic = $('jPic');
    $('jTitle').textContent = `#${j.num} · ${j.name.sw.toUpperCase()}`;
    pic.querySelector('img').src = j.image;
    const svg = pic.querySelector('svg'); svg.setAttribute('viewBox', `0 0 ${j.w} ${j.h}`);
    svg.innerHTML = j.bags.map(b => bagSvg(b, b.gold ? 'gold' : 'color', j.line)).join('');
    $('jNote').textContent = `${j.name.en} · mifuko ${j.bags.length} · the golden one shines`;
  } catch (e) { $('jNote').textContent = /nothing/.test(e.message) ? 'Hakuna picha ya jana · No picture yesterday. Come back tomorrow!' : 'Hakuna mtandao · No connection'; }
}

API.flush();
route();
