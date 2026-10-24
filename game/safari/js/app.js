// App: screens, canvas sizing, input, and the main loop.
const $ = id => document.getElementById(id);
const cv = $('game'), gctx = cv.getContext('2d');
let playing = false, lastNow = 0;

// ---------- sizing: fill the phone; on desktop show a phone-shaped column ----------
function resize() {
  const vw = window.innerWidth, vh = window.innerHeight;
  let cssW = vw, cssH = vh;
  LH = clamp(Math.round(LW * cssH / cssW), 1650, 2400);
  if (LW * cssH / cssW > 2400) cssH = cssW * 2400 / LW; // very tall: letterbox
  if (LW * cssH / cssW < 1650) cssW = cssH * LW / 1650;  // wide/desktop: portrait column
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.style.width = cssW + 'px'; cv.style.height = cssH + 'px';
  cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
  RS = cv.width / LW;
  G.safeTop = $('safeProbe').getBoundingClientRect().height * LW / cssW;
}
window.addEventListener('resize', resize);

// ---------- screens ----------
function show(id) { for (const s of document.querySelectorAll('.screen')) s.classList.toggle('on', s.id === id); const inGame = !id || id === 'sPause'; $('pauseBtn').style.display = $('muteBtn').style.display = inGame && playing ? 'block' : 'none'; }

// ---------- character picker ----------
let picked = API.char in CREW ? API.char : 'enzi';
const pickCanv = [];
for (const id in CREW) {
  const b = document.createElement('button'); b.className = 'pick' + (id === picked ? ' sel' : ''); b.dataset.id = id;
  const c = document.createElement('canvas'); c.width = 300; c.height = 330; b.appendChild(c);
  b.insertAdjacentHTML('beforeend', `${CREW[id].name}<small>${CREW[id].tag}</small>`);
  b.onclick = () => { picked = id; API.char = id; for (const x of document.querySelectorAll('.pick')) x.classList.toggle('sel', x.dataset.id === id); SFX.unlock(); SFX.play('bean'); };
  $('picker').appendChild(b); pickCanv.push({ id, c, x: c.getContext('2d') });
}
function drawPickers(t) {
  for (const { id, c, x } of pickCanv) { useCtx(x); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, c.width, c.height);
    const sel = id === picked, P = basePose(); if (sel) poseRide(P, t, true); else { P.hip[1] = -172 + Math.sin(t * 3) * 3; P.hB = [-110, -200]; P.hF = [110, -200]; }
    P.x = 150; P.y = 310; P.scale = .58; drawSkater(P, t, id); }
}

// ---------- start ----------
// Sign-in lives on the hub (../). Arriving here without a name sends you there first.
const autoplay = new URLSearchParams(location.search).has('autoplay');
if (!API.name && !autoplay) location.replace('../?next=safari/');
$('whoName').textContent = API.name;
$('playBtn').onclick = () => { SFX.unlock(); startGame(); };
function startGame() { playing = true; show(null); useCtx(gctx); resize(); newRun(picked); G.paused = false; }

// ---------- end of run ----------
G.onEnd = async run => {
  playing = false;
  $('resTitle').textContent = run.won ? 'SAFARI COMPLETE!' : 'MCHEZO UMEKWISHA';
  $('resScore').textContent = run.score.toLocaleString();
  $('resRank').textContent = 'Inatuma alama…';
  const st = [['Oda zilizofika', `${run.delivered}/${run.levels}`], ['Punje', run.beans + (run.gold ? ` + ${run.gold}★` : '')], ['Stomps', run.stomps], ['Faini', run.fines], ['Ajali · hits', run.hits], ['Muda', run.duration + 's']];
  $('resStats').innerHTML = st.map(([a, b]) => `<div>${a}<b>${b}</b></div>`).join('');
  show('sResult');
  const r = await API.submit(run);
  if (r.rankToday) $('resRank').textContent = `#${r.rankToday} leo · #${r.rankAll} wa wakati wote` + (r.newBest ? ' · REKODI MPYA!' : '');
  else if (r.offline) $('resRank').textContent = 'Hakuna mtandao — tutatuma baadaye · best ' + r.localBest;
  else $('resRank').textContent = 'Haikutumwa: ' + (r.error || '') + ' · best ' + r.localBest;
};
$('againBtn').onclick = () => { SFX.unlock(); startGame(); };
$('resHome').onclick = () => show('sStart');
$('resBoard').onclick = () => openBoard('today');

// ---------- leaderboard ----------
let boardPeriod = 'today';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function openBoard(p) {
  boardPeriod = p; show('sBoard');
  for (const b of $('tabs').children) b.classList.toggle('on', b.dataset.p === p);
  $('boardList').innerHTML = '<li class="empty" style="background:none">Inapakia…</li>'; $('boardNote').textContent = '';
  try {
    const j = await API.board(p); if (boardPeriod !== p) return;
    const me = API.name.toLowerCase();
    const row = e => `<li class="${e.name.toLowerCase() === me ? 'me' : ''} ${e.rank <= 3 ? 'top' + e.rank : ''}"><span class="rk">${e.rank}</span><span class="nm">${esc(e.name)}<small>${esc(CREW[e.char]?.name || '')}${e.loc ? ' · ' + esc(e.loc) : ''}</small></span><span class="sc">${e.score.toLocaleString()}</span></li>`;
    let html = j.top.map(row).join('');
    if (j.me && !j.top.some(e => e.name.toLowerCase() === me)) html += '<li style="background:none;justify-content:center;color:#cdb9a6">⋯</li>' + row(j.me);
    $('boardList').innerHTML = html || '<li class="empty" style="background:none">Bado hakuna alama — kuwa wa kwanza!</li>';
    $('boardNote').textContent = `${j.players} wachezaji · ${p === 'today' ? 'leo (EAT)' : p === 'week' ? 'wiki hii' : 'wakati wote'}`;
  } catch (e) { $('boardList').innerHTML = '<li class="empty" style="background:none">Imeshindwa kupakia ubao. Angalia mtandao.</li>'; }
}
for (const b of $('tabs').children) b.onclick = () => openBoard(b.dataset.p);
$('boardBtn').onclick = () => openBoard('today');
$('boardBack').onclick = () => show('sStart');
$('boardPlay').onclick = () => { show('sStart'); $('playBtn').click(); };

// ---------- pause ----------
function pause(on) { if (!playing) return; G.paused = on; show(on ? 'sPause' : null); SFX.music(!on && G.mode === 'play'); }
$('pauseBtn').onclick = () => pause(true);
$('resumeBtn').onclick = () => pause(false);
$('quitBtn').onclick = () => { playing = false; G.mode = 'idle'; SFX.music(false); show('sStart'); };
$('muteBtn').onclick = () => { $('muteBtn').textContent = SFX.toggle() ? '✕' : '♪'; };
$('muteBtn').textContent = SFX.muted ? '✕' : '♪';
document.addEventListener('visibilitychange', () => { if (document.hidden && playing && !G.paused) pause(true); });

// ---------- input: brake button (hold) + tap anywhere else to jump ----------
let jumpPtr = null, brakePtr = null;
function toLogical(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * LW / r.width, (e.clientY - r.top) * LH / r.height]; }
cv.addEventListener('pointerdown', e => {
  e.preventDefault(); SFX.unlock(); if (!playing || G.paused) return;
  const [x, y] = toLogical(e), b = brakeRect();
  if ((G.mode === 'play' || G.mode === 'arrive') && Math.hypot(x - b.x, y - b.y) < b.r + 30) { brakePtr = e.pointerId; G.input.brake = true; }
  else { jumpPtr = e.pointerId; G.input.jump = true; G.input.held = true; }
});
const release = e => { if (e.pointerId === brakePtr) { brakePtr = null; G.input.brake = false; } if (e.pointerId === jumpPtr) { jumpPtr = null; G.input.held = false; } };
cv.addEventListener('pointerup', release); cv.addEventListener('pointercancel', release); cv.addEventListener('pointerleave', release);
cv.addEventListener('contextmenu', e => e.preventDefault());
const JUMP_KEYS = ['Space', 'ArrowUp', 'KeyW', 'Enter'], BRAKE_KEYS = ['ArrowLeft', 'ArrowDown', 'KeyS', 'KeyB', 'ShiftLeft'];
window.addEventListener('keydown', e => {
  if (!playing) return;
  if (e.code === 'Escape' || e.code === 'KeyP') { pause(!G.paused); return; }
  if (JUMP_KEYS.includes(e.code)) { e.preventDefault(); if (!e.repeat) G.input.jump = true; G.input.held = true; }
  if (BRAKE_KEYS.includes(e.code)) { e.preventDefault(); G.input.brake = true; }
});
window.addEventListener('keyup', e => { if (JUMP_KEYS.includes(e.code)) G.input.held = false; if (BRAKE_KEYS.includes(e.code)) G.input.brake = false; });

// ---------- loop ----------
function frame(now) {
  const dt = Math.min(.05, (now - lastNow) / 1000 || 0); lastNow = now;
  if (playing || G.mode !== 'idle') { useCtx(gctx); update(dt); if (G.p) render(now); }
  else if ($('sStart').classList.contains('on')) drawPickers(now / 1000);
  requestAnimationFrame(frame);
}
(async () => {
  resize();
  await Promise.all(['60px Lilita', '800 60px Fraunces', '900 60px Nunito', 'italic 700 60px Nunito'].map(f => document.fonts.load(f).catch(() => { })));
  API.flush();
  // ?autoplay=1 skips the menu (handy for testing on a laptop)
  if (autoplay) startGame();
  requestAnimationFrame(frame);
})();
