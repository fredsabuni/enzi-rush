// Game: state, physics, collisions, scoring, and drawing a frame.
// Screen space is LW=1080 wide × LH tall (LH follows the phone's aspect). The world is drawn at
// scale S, with the sidewalk sitting GROUND_FROM_BOTTOM px above the bottom of the screen.
const LW = 1080, S = .8, PSX = 300, GROUND_FROM_BOTTOM = 400;
let LH = 1920, OY = 0, RS = 1; // RS = canvas pixels per logical unit
const PHYS = { g: 4200, jumpV: 1500, jump2V: 1380, holdG: .42, holdMax: .24, coyote: .1, buffer: .13, accel: 1300, decel: 1500, brake: 2600 };
const HIT_W = 60, HIT_H = 300;

const G = {
  mode: 'idle', li: 0, L: null, E: null, t: 0, modeT: 0, char: 'enzi', paused: false, safeTop: 0,
  run: null, p: null, heat: 100, fx: [], floats: [], pops: [], shake: 0, onEnd: null,
  input: { jump: false, held: false, brake: false },
  levelStats: null,
};

function newRun(char) {
  G.char = char;
  G.run = { score: 0, beans: 0, gold: 0, stomps: 0, fines: 0, hits: 0, falls: 0, delivered: 0, lives: 3, playTime: 0, heatSum: 0 };
  startLevel(0);
}
function startLevel(i) {
  G.li = i; G.L = LEVELS[i]; G.E = genLevel(G.L); buildWorld(G.L.zone, G.L.len);
  G.t = 0; G.heat = 100; G.fx = []; G.floats = []; G.pops = [];
  G.p = { x: 200, y: 0, vy: 0, v: 0, onGround: true, plat: null, jumps: 0, coyote: 0, buffer: 0, holdT: 0, flip: null, inv: 0, hitT: 0, nguvu: 0, slow: 0, landT: 0 };
  G.levelStats = { hits: 0, fines: 0, beans: 0, bonus: 0, heat: 0, perfect: 0 };
  setMode('intro');
}
function setMode(m) { G.mode = m; G.modeT = 0; }
function addScore(n, x, h, col) { G.run.score = Math.max(0, G.run.score + n); if (x !== undefined) G.floats.push({ x, h, str: (n > 0 ? '+' : '') + n, col: col || (n > 0 ? '#ffe6a3' : '#ff6b5a'), life: 0 }); }
function pop(label, sub, col = C.goldL) { G.pops.push({ label, sub, col, life: 0 }); }

// ---- traffic lights: one shared cycle per light (offset) so the player can read and time it
const LIGHT_CYCLE = 7, GREEN = 3.4, YELLOW = 1.2;
function lightPhase(l, t) { const k = ((t + l.off) % LIGHT_CYCLE + LIGHT_CYCLE) % LIGHT_CYCLE; return k < GREEN ? 'green' : k < GREEN + YELLOW ? 'yellow' : 'red'; }

function overGap(x) { for (const g of G.E.gaps) if (x > g.x0 + 28 && x < g.x1 - 28) return g; return null; }

function hurt(heatLoss = 12, steal = false) {
  const p = G.p; if (p.inv > 0 || p.nguvu > 0) return false;
  addScore(-SCORE.hit, p.x, p.y + 360); G.run.hits++; G.levelStats.hits++;
  p.inv = 1.4; p.hitT = .5; G.heat = Math.max(0, G.heat - heatLoss); G.shake = .3; SFX.play('hit');
  for (let i = 0; i < 10; i++) G.fx.push({ type: 'drop', x: p.x + 40, h: p.y + 280, vx: (Math.random() - .3) * 500, vh: 300 + Math.random() * 500, life: 0, max: .9 });
  if (steal && G.run.beans > 0) { const n = Math.min(5, G.run.beans); G.run.beans -= n; for (let i = 0; i < n; i++) G.fx.push({ type: 'lostbean', x: p.x, h: p.y + 200, vx: 200 + Math.random() * 300, vh: 400 + Math.random() * 400, life: 0, max: 1 }); }
  return true;
}

function update(dt) {
  if (G.paused || G.mode === 'idle') return;
  G.modeT += dt; G.shake = Math.max(0, G.shake - dt);
  const p = G.p, L = G.L, E = G.E, inp = G.input;
  for (const f of G.floats) f.life += dt; G.floats = G.floats.filter(f => f.life < 1);
  for (const f of G.pops) f.life += dt; G.pops = G.pops.filter(f => f.life < 1.4);
  for (const f of G.fx) { f.life += dt; if (f.vx !== undefined) { f.x += f.vx * dt; f.h += f.vh * dt; f.vh -= 2600 * dt; } } G.fx = G.fx.filter(f => f.life < f.max);

  if (G.mode === 'intro') { if (inp.jump && G.modeT > .5) { inp.jump = false; setMode('play'); SFX.music(true); } inp.jump = false; return; }
  if (G.mode === 'deliver') { G.t += dt; deliverTick(dt); if (inp.jump && G.modeT > 1.6) { inp.jump = false; nextLevel(); } inp.jump = false; return; }
  if (G.mode === 'fall') { G.t += dt; p.y -= 900 * dt; if (G.modeT > 1.1) respawn(); return; }
  if (G.mode !== 'play' && G.mode !== 'arrive') return;

  G.t += dt; G.run.playTime += dt;
  p.inv = Math.max(0, p.inv - dt); p.hitT = Math.max(0, p.hitT - dt); p.nguvu = Math.max(0, p.nguvu - dt); p.slow = Math.max(0, p.slow - dt); p.landT = Math.max(0, p.landT - dt);
  // speed
  let target = inp.brake ? 0 : L.speed * (p.nguvu > 0 ? 1.35 : 1) * (p.slow > 0 ? .55 : 1) * (p.hitT > 0 ? .5 : 1);
  if (G.mode === 'arrive') { const d = Math.max(1, L.len - 250 - p.x); p.v = Math.max(0, p.v - (p.v * p.v / (2 * d)) * dt - 20 * dt); if (p.v < 30 || p.x >= L.len - 250) { p.v = 0; beginDelivery(); } target = null; }
  if (target !== null) p.v = p.v < target ? Math.min(target, p.v + PHYS.accel * dt) : Math.max(target, p.v - (inp.brake ? PHYS.brake : PHYS.decel) * dt);
  // heat: a clean run (waiting briefly at each light) arrives with ~60% heat
  G.heat = Math.max(0, G.heat - (38 / (L.len / L.speed + 2.5 * L.lights.length)) * dt);
  // jump input (buffered, with coyote time and a kickflip double-jump)
  if (inp.jump) { p.buffer = PHYS.buffer; inp.jump = false; }
  p.buffer = Math.max(0, p.buffer - dt); p.coyote = Math.max(0, p.coyote - dt);
  if (p.buffer > 0 && G.mode === 'play') {
    if (p.onGround || p.coyote > 0) { p.vy = PHYS.jumpV; p.onGround = false; p.plat = null; p.jumps = 1; p.holdT = 0; p.buffer = 0; p.coyote = 0; SFX.play('jump'); }
    else if (p.jumps < 2) { p.vy = PHYS.jump2V; p.jumps = 2; p.holdT = PHYS.holdMax; p.flip = 0; p.buffer = 0; SFX.play('flip'); }
  }
  if (p.flip !== null) { p.flip += dt / .42; if (p.flip >= 1) p.flip = null; }
  // physics substeps
  const n = Math.ceil(dt / (1 / 120)), h = dt / n;
  for (let s = 0; s < n; s++) {
    const px = p.x, py = p.y; p.x += p.v * h;
    if (!p.onGround) {
      let g = PHYS.g; if (inp.held && p.vy > 0 && p.holdT < PHYS.holdMax) { g *= PHYS.holdG; } p.holdT += h;
      p.vy -= g * h; p.y += p.vy * h;
      if (p.vy <= 0) {
        for (const pl of E.plats) if (p.x > pl.x0 - 40 && p.x < pl.x1 + 40 && py >= pl.h - 2 && p.y <= pl.h) { p.y = pl.h; land(pl); break; }
        if (!p.onGround && py >= -4 && p.y <= 0 && !overGap(p.x)) { p.y = 0; land(null); }
      }
      if (p.y < -20) { const g2 = E.gaps.find(g => px < g.x1 && p.x + 50 > g.x1 && p.x > g.x0); if (g2) { p.x = g2.x1 - 50; p.v = 0; } } // drain wall
      if (p.y < -380 && G.mode === 'play') { fallIn(); return; }
    } else {
      if (p.plat && (p.x < p.plat.x0 - 40 || p.x > p.plat.x1 + 40)) { p.onGround = false; p.plat = null; p.coyote = PHYS.coyote; p.vy = 0; p.jumps = 0; }
      else if (!p.plat && overGap(p.x)) { p.onGround = false; p.coyote = PHYS.coyote; p.vy = 0; p.jumps = 0; }
    }
  }
  collide(dt);
  if (G.mode === 'play' && p.x >= L.len - 1000) { setMode('arrive'); SFX.music(false); }
}
function land(pl) { const p = G.p; if (p.vy < -900) { SFX.play('land'); G.fx.push({ type: 'dust', x: p.x, h: p.y, life: 0, max: .4 }); } p.onGround = true; p.plat = pl; p.vy = 0; p.jumps = 0; p.flip = null; p.landT = .12; }

function collide(dt) {
  const p = G.p, E = G.E, t = G.t, L = G.L, mag = p.nguvu > 0 ? 420 : 0;
  // beans
  for (const b of E.beans) { if (b.got) continue; const dx = b.x - p.x; if (dx > 600) break; if (dx < -200) continue;
    const near = Math.abs(dx) < 90 && b.h > p.y - 40 && b.h < p.y + HIT_H + 40;
    if (near || (mag && Math.hypot(dx, b.h - p.y - 150) < mag)) { b.got = true;
      if (b.gold) { G.run.gold++; addScore(SCORE.gold, b.x, b.h + 60); SFX.play('gold'); } else { G.run.beans++; G.levelStats.beans++; G.run.score += SCORE.bean; SFX.play('bean'); }
      G.fx.push({ type: 'beanfly', sx: wsx(b.x), sy: wsy(b.h), life: 0, max: .45, gold: b.gold }); } }
  for (const w of E.pows) { if (w.got) continue; if (Math.abs(w.x - p.x) < 110 && w.h > p.y - 60 && w.h < p.y + HIT_H + 80) { w.got = true; p.nguvu = 5; SFX.play('nguvu'); pop('NGUVU!', 'kasi + sumaku ya punje'); } }
  // traffic lights
  for (const l of E.lights) {
    const ph = lightPhase(l, t);
    if (!l.passed && p.x >= l.x) { l.passed = true;
      if (ph === 'red' && p.nguvu <= 0) { l.fined = true; G.run.fines++; G.levelStats.fines++; addScore(-SCORE.fine, p.x, p.y + 380); SFX.play('whistle'); pop('FAINI!', 'Taa nyekundu · −' + SCORE.fine, '#ff6b5a'); G.shake = .2; }
      else { l.waved = true; } }
  }
  // hazards
  for (const hz of E.haz) {
    const dx = (hz.x ?? hz.x0) - p.x; if (dx > 2200) continue; if (dx < -800) continue;
    if (hz.type === 'shimo') { if (!hz.hit && p.onGround && !p.plat && Math.abs(dx) < hz.w / 2 - 8) { hz.hit = true; if (hurt(12)) pop('SHIMO!', 'umemwaga kahawa', '#ff6b5a'); } }
    else if (hz.type === 'dimbwi') { if (p.onGround && !p.plat && Math.abs(dx) < hz.w / 2) { p.slow = .5; if (!hz.splashed) { hz.splashed = true; G.heat = Math.max(0, G.heat - 5); SFX.play('splash'); for (let i = 0; i < 12; i++) G.fx.push({ type: 'splash', x: p.x, h: 10, vx: (Math.random() - .5) * 600, vh: 400 + Math.random() * 500, life: 0, max: .7 }); } } }
    else if (hz.type === 'kuku' || hz.type === 'kaa') {
      if (!hz.alive) { hz.dead = (hz.dead || 0) + dt; continue; }
      if (dx < 1500) hz.x += hz.vx * dt;
      const top = hz.type === 'kuku' ? 130 : 90;
      if (Math.abs(hz.x - p.x) < 50 + HIT_W && p.y < top && p.y + HIT_H > 0) stompOrHurt(hz, top);
    }
    else if (hz.type === 'kunguru') {
      if (hz.flee) { hz.x += 500 * dt; hz.h += 500 * dt; continue; }
      if (!hz.alive) { hz.dead = (hz.dead || 0) + dt; continue; }
      if (dx < 1700) hz.x += hz.vx * dt;
      const hh = hz.h + Math.sin(t * 3 + hz.seed) * 25; hz.cy = hh;
      if (Math.abs(hz.x - p.x) < 55 + HIT_W && p.y < hh + 40 && p.y + HIT_H > hh - 40) {
        if (p.vy < 0 && p.y > hh) stompOrHurt(hz, hh + 40); else if (p.nguvu > 0) stompOrHurt(hz, hh + 40); else if (hurt(8, true)) { hz.flee = true; pop('KUNGURU!', 'ameiba punje zako', '#ff6b5a'); }
      }
    }
    else if (hz.type === 'boda') {
      if (!hz.live && hz.x0 - camX < VIEW_W + 300) { hz.live = true; SFX.play('honk'); }
      if (hz.live) hz.x += hz.vx * dt;
      if (!hz.hit && Math.abs(hz.x - p.x) < 140 + HIT_W && p.y < 250) { hz.hit = true; if (hurt(12)) pop('BODA!', 'pole pole!', '#ff6b5a'); }
    }
  }
}
function stompOrHurt(hz, top) {
  const p = G.p;
  if ((p.vy < 0 && p.y > top - 80) || p.nguvu > 0) { hz.alive = false; hz.dead = 0; G.run.stomps++; addScore(SCORE.stomp, hz.x, top + 80); p.vy = 1150; p.onGround = false; p.jumps = 1; SFX.play('stomp'); G.fx.push({ type: 'star', x: hz.x, h: top, life: 0, max: .5 }); }
  else if (!hz.bumped) { hz.bumped = true; if (hurt(10)) pop(hz.type === 'kaa' ? 'KAA!' : 'KUKU!', 'ruka juu yake!', '#ff6b5a'); }
}
function fallIn() {
  const p = G.p; setMode('fall'); G.run.falls++; G.run.lives--; addScore(-SCORE.fall); SFX.play('fall'); G.heat = Math.max(0, G.heat - 15);
  pop('MTARONI!', G.run.lives > 0 ? 'kikombe kimoja kimepotea' : 'mchezo umekwisha', '#ff6b5a');
  for (let i = 0; i < 14; i++) G.fx.push({ type: 'splash', x: p.x, h: -150, vx: (Math.random() - .5) * 500, vh: 600 + Math.random() * 600, life: 0, max: .9 });
}
function respawn() {
  const p = G.p;
  if (G.run.lives <= 0) { endRun(false); return; }
  const g = G.E.gaps.filter(g => g.x0 <= p.x + 60).pop();
  p.x = g ? g.x0 - 420 : p.x - 400; p.y = 0; p.vy = 0; p.v = 0; p.onGround = true; p.plat = null; p.jumps = 0; p.inv = 2; p.flip = null;
  setMode('play');
}
function beginDelivery() {
  const s = G.levelStats, heat = Math.round(G.heat);
  s.heat = heat; s.base = SCORE.deliverBase; s.heatBonus = heat * SCORE.deliverHeat; s.perfect = s.hits === 0 && s.fines === 0 ? 500 : 0;
  s.bonus = s.base + s.heatBonus + s.perfect; s.shown = 0; s.scoreBefore = G.run.score;
  G.run.score += s.bonus; G.run.delivered++; G.run.heatSum += heat;
  setMode('deliver'); SFX.play('deliver');
}
function deliverTick(dt) { const s = G.levelStats; const prev = Math.floor(s.shown / 50); s.shown = Math.min(s.bonus, s.shown + dt * 1400); if (Math.floor(s.shown / 50) !== prev && s.shown < s.bonus) SFX.play('tick'); }
function nextLevel() { if (G.li + 1 < LEVELS.length) startLevel(G.li + 1); else endRun(true); }
function endRun(won) {
  SFX.music(false); SFX.play(won ? 'deliver' : 'over'); setMode('idle');
  const r = G.run; if (G.onEnd) G.onEnd({ won, score: r.score, beans: r.beans, gold: r.gold, stomps: r.stomps, fines: r.fines, hits: r.hits, falls: r.falls, delivered: r.delivered, levels: LEVELS.length, duration: Math.round(r.playTime), char: G.char });
}

// ================= drawing =================
const wsx = x => (x - camX) * S, wsy = h => OY + (GY - h) * S; // world → screen
function wrapText(str, maxW, font) { ctx.font = font; const words = str.split(' '), out = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; } if (cur) out.push(cur); return out; }

function skaterPoseNow() {
  const p = G.p, t = G.t + G.li * 10, P = basePose();
  const air = !p.onGround, braking = G.input.brake || G.mode === 'arrive';
  if (G.mode === 'deliver') { poseCheer(P, t); P.steam = 0; }
  else if (G.mode === 'intro') { P.hip[1] = -172 + Math.sin(t * 3) * 3; P.hB = [-110, -200]; P.hF = [110, -200]; P.mouth = 'smile'; if ((t % 3.1) < .1) P.eyes = 'blink'; }
  else if (G.mode === 'fall') { poseHit(P, t); }
  else if (p.hitT > 0) poseHit(P, t);
  else if (air) poseAir(P, p.vy > 0, p.flip);
  else if (braking && p.v > 20) poseBrake(P);
  else if (p.v > 60) poseRide(P, t, p.v < G.L.speed * 1.05 && p.nguvu <= 0);
  else { P.hip[1] = -172 + Math.sin(t * 3) * 3; P.hB = [-110, -200]; P.hF = [110, -200]; P.mouth = 'smile'; }
  if (p.landT > 0) P.hip[1] += 14;
  P.steam = G.mode === 'deliver' ? 0 : clamp(G.heat / 55, .15, 1.8); P.drag = clamp(p.v / 900, 0, 1);
  if (p.nguvu > 0) { P.glasses = 1; P.jet = 1; P.brows = -1; P.mouth = 'grin'; }
  if (G.heat < 25 && G.mode === 'play' && p.hitT <= 0) P.brows = 1;
  P.x = p.x - camX; P.y = GY - p.y; P.groundOff = overGap(p.x) ? 900 : (p.plat ? 0 : p.y); P.scale = .85;
  if (G.mode === 'deliver') P.item = G.modeT < .6 ? { tilt: 0 } : null;
  return P;
}
function drawDrain(g) {
  const x0 = wx(g.x0), x1 = wx(g.x1); if (x1 < -50 || x0 > VIEW_W + 50) return;
  const top = ROAD1 + 16, bot = (LH - OY) / S + 20;
  const gr = ctx.createLinearGradient(0, top, 0, bot); gr.addColorStop(0, '#2b2420'); gr.addColorStop(1, '#0d0a08'); ctx.fillStyle = gr; ctx.fillRect(x0, top, x1 - x0, bot - top);
  ctx.fillStyle = '#3d5a4c'; ctx.fillRect(x0, GY + 120, x1 - x0, bot - GY); for (let k = 0; k < 6; k++) { ctx.fillStyle = 'rgba(160,200,170,.35)'; ctx.fillRect(x0 + 20 + ((k * 97 + G.t * 40) % Math.max(1, x1 - x0 - 60)), GY + 140 + k * 30, 40, 4); }
  ctx.fillStyle = '#8a8478'; ctx.fillRect(x0 - 16, top, 22, bot - top); ctx.fillRect(x1 - 6, top, 22, bot - top);
  ctx.fillStyle = '#a8a294'; ctx.fillRect(x0 - 16, top, 22, 10); ctx.fillRect(x1 - 6, top, 22, 10);
}
function drawPlat(pl) {
  const x0 = wx(pl.x0), x1 = wx(pl.x1); if (x1 < -50 || x0 > VIEW_W + 50) return;
  const y = GY - pl.h, w = x1 - x0, Z = G.L.zone;
  ctx.fillStyle = 'rgba(40,20,10,.18)'; ctx.beginPath(); ctx.ellipse((x0 + x1) / 2, GY + 6, w / 2, 14, 0, 0, 7); ctx.fill();
  const postCol = Z === 2 ? '#8a6036' : '#5b4a44';
  for (const px of [x0 + 24, x1 - 24]) { ctx.fillStyle = postCol; ctx.fillRect(px - 8, y, 16, GY - y); }
  if (Z === 2) { ctx.fillStyle = '#b98a52'; rr(x0, y - 6, w, 34, 8); ctx.fill(); ctx.strokeStyle = '#8a6036'; ctx.lineWidth = 4; for (let k = 1; k < w / 60; k++) { ctx.beginPath(); ctx.moveTo(x0 + k * 60, y - 4); ctx.lineTo(x0 + k * 60, y + 26); ctx.stroke(); } }
  else { const cols = Z === 1 ? ['#2a7ab8', '#fff'] : Z === 3 ? ['#c76bb0', '#fff'] : ['#d6604f', '#fff']; const n = Math.max(3, Math.round(w / 52));
    for (let k = 0; k < n; k++) { ctx.fillStyle = cols[k % 2]; ctx.fillRect(x0 + k * w / n, y - 8, w / n + 1, 40); ctx.beginPath(); ctx.arc(x0 + (k + .5) * w / n, y + 32, w / n / 2, 0, Math.PI); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x0, y - 8, w, 8); }
}
function drawLight(l) {
  const x = wx(l.x); if (x < -500 || x > VIEW_W + 500) return;
  const ph = lightPhase(l, G.t);
  for (let k = 0; k < 7; k++) { ctx.fillStyle = 'rgba(255,255,255,.82)'; const zx = x + 20 + k * 46; ctx.beginPath(); ctx.moveTo(zx, ROAD1 + 18); ctx.lineTo(zx + 26, ROAD1 + 18); ctx.lineTo(zx + 26 - 60, LH / S); ctx.lineTo(zx - 60, LH / S); ctx.fill(); }
  ctx.fillStyle = '#fff'; ctx.fillRect(x - 6, ROAD1 + 18, 10, 600); // stop line
  trafficLight(x - 60, NPCY + 10, .9, ph);
  const fined = l.fined && G.t < 200, angry = l.fined && l.passed && Math.abs(G.p.x - l.x) < 1400;
  afande(x + 420, NPCY + 30, .62, G.t, { stop: ph === 'red' && !l.passed, angry, whistle: angry ? Math.abs(Math.sin(G.t * 12)) : .0001, bounce: l.waved && Math.abs(G.p.x - l.x) < 700 ? Math.abs(Math.sin(G.t * 10)) * 8 : 0 });
  if (!l.passed && x < VIEW_W + 100 && x > PSX) { // countdown bubble so it feels fair
    const k = ((G.t + l.off) % LIGHT_CYCLE + LIGHT_CYCLE) % LIGHT_CYCLE, left = ph === 'red' ? LIGHT_CYCLE - k : ph === 'yellow' ? GREEN + YELLOW - k : GREEN - k;
    ctx.fillStyle = 'rgba(30,20,40,.65)'; rr(x - 120, NPCY - 860, 120, 70, 24); ctx.fill(); text(Math.ceil(left) + 's', x - 60, NPCY - 824, { size: 46, color: ph === 'red' ? '#ff6b5a' : ph === 'yellow' ? '#ffcc00' : '#34e07a' });
  }
}
function drawHaz(hz) {
  const x = wx(hz.x ?? hz.x0); if (x < -400 || x > VIEW_W + 400) return;
  const t = G.t;
  if (hz.type === 'shimo') shimo(x, GY - 20, hz.w, t);
  else if (hz.type === 'dimbwi') dimbwi(x, GY - 24, hz.w, t);
  else if (hz.type === 'kuku') { if (hz.dead > .6) return; ctx.save(); ctx.globalAlpha = 1 - clamp((hz.dead || 0) / .6, 0, 1); kuku(x, GY, 1.1, t, { squash: !hz.alive, seed: hz.x0 }); ctx.restore(); }
  else if (hz.type === 'kaa') { if (hz.dead > .6) return; ctx.save(); ctx.globalAlpha = 1 - clamp((hz.dead || 0) / .6, 0, 1); kaa(x, GY, 1.2, t, { squash: !hz.alive }); ctx.restore(); }
  else if (hz.type === 'kunguru') { if (hz.dead > .6) return; ctx.save(); ctx.globalAlpha = 1 - clamp((hz.dead || 0) / .6, 0, 1); kunguru(x, GY - (hz.cy ?? hz.h), 1, t, { squash: !hz.alive, seed: hz.seed, carry: hz.flee }); ctx.restore(); }
  else if (hz.type === 'boda') bodaRider(x, GY + 10, .85, t);
}
function drawFx() {
  for (const f of G.fx) { const k = f.life / f.max, x = wx(f.x ?? 0), y = GY - (f.h ?? 0);
    if (f.type === 'drop') circ(x, y, 12 * (1 - k) + 4, `rgba(110,60,30,${1 - k})`);
    else if (f.type === 'splash') circ(x, y, 12 * (1 - k) + 4, `rgba(200,230,250,${1 - k})`);
    else if (f.type === 'lostbean') bean(x, y, 22, f.life * 12, 1 - k);
    else if (f.type === 'dust') for (let i = 0; i < 6; i++) circ(x + (i - 2.5) * 40 * (1 + k), y - 10 - k * 30 * rnd(i), 18 * (1 - k) + 6, `rgba(230,210,180,${.7 * (1 - k)})`);
    else if (f.type === 'star') for (let i = 0; i < 6; i++) { const a = i * 1.047 + k; circ(x + Math.cos(a) * 120 * k, y - 60 + Math.sin(a) * 120 * k, 14 * (1 - k), '#ffe6a3'); }
  }
  for (const f of G.floats) { const k = f.life; ctx.save(); ctx.globalAlpha = 1 - easeIn(k); text(f.str, wx(f.x), GY - f.h - k * 140, { size: 64, color: f.col, sw: 12, stroke: C.coffee }); ctx.restore(); }
}

function render(now) {
  const t = G.t, p = G.p; if (!p) return;
  OY = LH - GROUND_FROM_BOTTOM - GY * S; VIEW_W = LW / S;
  camX = p.x - PSX;
  ctx.setTransform(RS, 0, 0, RS, 0, 0); ctx.clearRect(0, 0, LW, LH);
  ctx.save(); if (G.shake > 0) ctx.translate(Math.sin(now * .09) * 14 * G.shake / .3, Math.cos(now * .07) * 10 * G.shake / .3);
  ctx.translate(0, OY); ctx.scale(S, S);
  drawBackdrop(t);
  for (const g of G.E.gaps) drawDrain(g);
  const L = G.L, endX = wx(L.len);
  if (L.final) { if (endX > -900 && endX < VIEW_W + 700) cafeFront(endX + 300); }
  else if (endX > -400 && endX < VIEW_W + 800) { ctx.fillStyle = C.teal; rr(endX - 330, NPCY - 640, 300, 110, 18); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.stroke(); text(CUSTOMERS[L.customer].name.toUpperCase(), endX - 180, NPCY - 598, { size: 38 }); text('ODA YAKO HAPA ↓', endX - 180, NPCY - 556, { size: 22, color: C.goldL }); ctx.fillStyle = '#5b3c26'; ctx.fillRect(endX - 186, NPCY - 530, 12, 530); }
  for (const l of G.E.lights) drawLight(l);
  for (const pl of G.E.plats) drawPlat(pl);
  if (endX > -400 && endX < VIEW_W + 600) { const d = G.mode === 'deliver', talk = d && G.modeT > .4 && G.modeT < 2.4 ? 1 : 0;
    customer(L.customer, endX + 40, GY - 4, .78, t, { gesture: d ? (G.modeT < .9 ? 1 : .6) : .9, talk, holding: d && G.modeT > .6 ? 'cup' : null, mood: d ? 'happy' : 'smile', bounce: d ? Math.abs(Math.sin(t * 8)) * 10 : 0 }); }
  for (const hz of G.E.haz) drawHaz(hz);
  for (const b of G.E.beans) { if (b.got) continue; const x = wx(b.x); if (x < -60 || x > VIEW_W + 60) continue; bean(x, GY - b.h + Math.sin(t * 5 + b.x) * 6, b.gold ? 40 : 28, t * 5 + b.x * .01, 1, b.gold); }
  for (const w of G.E.pows) if (!w.got) { const x = wx(w.x); if (x > -100 && x < VIEW_W + 100) espresso(x, GY - w.h, 1, t); }
  if (!(p.inv > 0 && Math.floor(now / 70) % 2 && G.mode === 'play')) drawSkater(skaterPoseNow(), t, G.char);
  drawFx();
  ctx.restore();
  drawHud(now);
  if (G.mode === 'intro') drawIntroCard(now);
  if (G.mode === 'deliver') drawDeliverCard(now);
  if (p.nguvu > 0) { ctx.fillStyle = `rgba(255,170,80,${.08 * Math.min(1, p.nguvu)})`; ctx.fillRect(0, 0, LW, LH); }
}

function drawHud(now) {
  const top = G.safeTop + 30, r = G.run, L = G.L, Z = ZONES[L.zone];
  // score + beans
  text(String(r.score).padStart(6, '0'), LW - 40, top + 50, { size: 92, align: 'right', sw: 16, shadow: 8 });
  ctx.fillStyle = 'rgba(30,20,40,.5)'; rr(LW - 300, top + 110, 260, 72, 36); ctx.fill(); bean(LW - 258, top + 146, 26, 0);
  let pulse = 0; for (const f of G.fx) if (f.type === 'beanfly' && f.life > f.max - .1) pulse = 1;
  text(String(r.beans), LW - 66, top + 148, { size: 56 + pulse * 8, align: 'right', sw: 10, color: pulse ? '#ffe6a3' : '#fff' });
  // lives (cups)
  for (let i = 0; i < 3; i++) { ctx.save(); ctx.globalAlpha = i < r.lives ? 1 : .25; smallCup(400 + i * 72, top + 70, .95); ctx.restore(); }
  // heat meter (JOTO)
  const hx = 40, hy = top + 130, hw = 380, hk = G.heat / 100, hc = hk > .55 ? '#ff7a2e' : hk > .25 ? '#f2b134' : '#7fb5d5';
  ctx.fillStyle = 'rgba(30,20,40,.5)'; rr(hx, hy, hw, 52, 26); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.15)'; rr(hx + 108, hy + 12, hw - 124, 28, 14); ctx.fill(); ctx.fillStyle = hc; rr(hx + 108, hy + 12, (hw - 124) * hk, 28, 14); ctx.fill();
  text('JOTO', hx + 56, hy + 27, { size: 30, color: hc, sw: 6 });
  if (hk < .25 && Math.floor(now / 300) % 2 && G.mode === 'play') text('Kahawa inapoa!', hx + 20, hy + 82, { size: 30, align: 'left', color: '#bfe4ff', sw: 7 });
  // route progress
  const py = top + 230, prog = clamp(G.p.x / L.len, 0, 1);
  ctx.fillStyle = 'rgba(30,20,40,.45)'; rr(40, py - 34, LW - 80, 68, 34); ctx.fill();
  text(`${G.li + 1}/${LEVELS.length} ${Z.name}`, 70, py + 2, { size: 30, align: 'left', sw: 6 });
  const bx0 = 400, bx1 = LW - 110; line([[bx0, py], [bx1, py]], 10, 'rgba(255,255,255,.3)'); line([[bx0, py], [lerp(bx0, bx1, prog), py]], 10, C.orangeL);
  for (const l of G.E.lights) { const lx = lerp(bx0, bx1, l.x / L.len); circ(lx, py, 9, l.fined ? '#ff6b5a' : l.passed ? '#34e07a' : '#ffcc00'); }
  ctx.save(); ctx.beginPath(); ctx.arc(bx1 + 28, py, 30, 0, 7); ctx.fillStyle = C.teal; ctx.fill(); ctx.clip(); head(bx1 + 34, py + 22, .5, { ...CUSTOMERS[L.customer].look }, G.t); ctx.restore();
  ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(bx1 + 28, py, 30, 0, 7); ctx.stroke();
  const mx = lerp(bx0, bx1, prog); takeawayCup(mx, py + 14, .32);
  if (G.p.nguvu > 0) { const k = G.p.nguvu / 5; ctx.fillStyle = 'rgba(30,20,40,.55)'; rr(40, py + 50, 300, 36, 18); ctx.fill(); ctx.fillStyle = C.goldL; rr(46, py + 56, 288 * k, 24, 12); ctx.fill(); text('NGUVU', 190, py + 69, { size: 24, color: C.coffee }); }
  // zone banner at level start
  if (G.mode === 'play' && G.modeT < 2.2 && G.t < 3) { const k = G.modeT, x = lerp(-700, 60, backOut(win(k, 0, .35))) - easeIn(win(k, 1.8, 2.2)) * 900;
    ctx.save(); ctx.translate(x, top + 330); ctx.fillStyle = C.coffee; rr(0, 0, 660, 130, 30); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.gold; ctx.stroke();
    text(Z.name, 40, 50, { size: 58, align: 'left' }); text(Z.sub, 42, 100, { size: 32, align: 'left', font: 'Nunito', weight: 800, color: C.goldL }); ctx.restore(); }
  // bean fly-to-HUD
  for (const f of G.fx) if (f.type === 'beanfly') { const k = f.life / f.max, e = easeIn(k); bean(lerp(f.sx, LW - 258, e), lerp(f.sy, top + 146, e) - Math.sin(Math.PI * k) * 120, 22, f.life * 14, 1, f.gold); }
  // big pops
  for (const f of G.pops.slice(-1)) { const k = f.life, sc = backOut(win(k, 0, .3)), a = 1 - win(k, 1.1, 1.4);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(LW / 2, LH * .36 - k * 30); ctx.scale(sc, sc); ctx.rotate(-.04); text(f.label, 0, 0, { size: 120, color: f.col, sw: 22, stroke: C.coffee, shadow: 10 }); if (f.sub) text(f.sub, 0, 92, { size: 46, sw: 11, stroke: C.coffee }); ctx.restore(); }
  // controls
  if (G.mode === 'play' || G.mode === 'arrive') {
    const b = brakeRect(), on = G.input.brake;
    ctx.save(); ctx.globalAlpha = on ? .95 : .7; circ(b.x, b.y, b.r, on ? C.red : 'rgba(30,20,40,.55)'); ctx.lineWidth = 8; ctx.strokeStyle = on ? '#fff' : 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.stroke();
    ctx.fillStyle = '#fff'; rr(b.x - 34, b.y - 52, 68, 62, 14); ctx.fill(); for (let k = 0; k < 4; k++) { rr(b.x - 34 + k * 18, b.y - 78, 14, 40, 7); ctx.fill(); }
    text('SIMAMA', b.x, b.y + 50, { size: 34, sw: 6 }); ctx.restore();
    if (G.t < 8 && G.li === 0) { ctx.save(); ctx.globalAlpha = .6 + Math.sin(now * .006) * .3; text('GUSA POPOTE KURUKA', LW * .66, LH - 170, { size: 40, sw: 8 }); text('tap anywhere to jump · tap again to kickflip', LW * .66, LH - 120, { size: 26, font: 'Nunito', weight: 800, sw: 6 }); ctx.restore(); }
  }
}
function brakeRect() { return { x: 150, y: LH - 170, r: 112 }; }

function card(h) { const w = LW - 120, x = 60, y = (LH - h) / 2; ctx.fillStyle = 'rgba(20,10,8,.45)'; ctx.fillRect(0, 0, LW, LH); ctx.fillStyle = 'rgba(20,10,20,.35)'; rr(x + 8, y + 12, w, h, 40); ctx.fill(); ctx.fillStyle = C.cream; rr(x, y, w, h, 40); ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = C.coffee; ctx.stroke(); return { x, y, w, h }; }
function portrait(id, cx, cy, r, t, mood) { ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fillStyle = C.teal; ctx.fill(); ctx.clip(); head(cx + 14, cy + 34, r / 62, { ...CUSTOMERS[id].look, talk: 1, mood }, t); ctx.restore(); ctx.lineWidth = 8; ctx.strokeStyle = C.coffee; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke(); }
function drawIntroCard(now) {
  const L = G.L, c = CUSTOMERS[L.customer], k = backOut(win(G.modeT, 0, .35));
  ctx.save(); ctx.translate(LW / 2, LH / 2); ctx.scale(k, k); ctx.translate(-LW / 2, -LH / 2);
  const b = card(880);
  ctx.fillStyle = C.orange; rr(b.x + 40, b.y - 36, 330, 72, 24); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.coffee; ctx.stroke(); text(`ODA #${G.li + 1} / ${LEVELS.length}`, b.x + 205, b.y + 2, { size: 44 });
  portrait(L.customer, b.x + 150, b.y + 190, 100, G.t, 'smile');
  text(c.name, b.x + 290, b.y + 150, { size: 64, align: 'left', color: C.coffee });
  text('📍 ' + c.place, b.x + 292, b.y + 216, { size: 36, align: 'left', font: 'Nunito', weight: 900, color: C.teal });
  const lines = wrapText('“' + c.order + '”', b.w - 100, '900 50px Nunito'); lines.forEach((l, i) => text(l, b.x + 50, b.y + 360 + i * 62, { size: 50, font: 'Nunito', weight: 900, align: 'left', color: C.coffee }));
  const en = wrapText(c.orderEn, b.w - 100, 'italic 700 36px Nunito'); en.forEach((l, i) => text(l, b.x + 50, b.y + 370 + lines.length * 62 + i * 44, { size: 36, font: 'Nunito', weight: 700, italic: 'italic', align: 'left', color: '#8a6a55' }));
  const ty = b.y + 610;
  ctx.fillStyle = C.creamD; rr(b.x + 40, ty - 20, b.w - 80, 150, 24); ctx.fill();
  text('Fika kabla kahawa haijapoa. Simama kwenye taa nyekundu!', b.x + b.w / 2, ty + 20, { size: 30, font: 'Nunito', weight: 900, color: C.brown });
  text('Deliver it hot · stop at red lights · grab the beans', b.x + b.w / 2, ty + 70, { size: 28, font: 'Nunito', weight: 700, color: '#8a6a55' });
  if (G.modeT > .5 && Math.floor(now / 400) % 2 === 0) text('GUSA KUANZA · TAP TO START', LW / 2, b.y + b.h - 50, { size: 44, color: C.orange });
  ctx.restore();
}
function drawDeliverCard(now) {
  if (G.modeT < .9) return;
  const s = G.levelStats, c = CUSTOMERS[G.L.customer], k = backOut(win(G.modeT, .9, 1.25));
  ctx.save(); ctx.translate(LW / 2, LH * .42); ctx.scale(k, k); ctx.translate(-LW / 2, -LH * .42);
  const b = card(900); b.y = (LH - 900) / 2;
  text('IMEFIKA!', LW / 2, b.y + 90, { size: 96, color: C.orange, sw: 14, stroke: C.coffee });
  portrait(G.L.customer, b.x + 130, b.y + 250, 80, G.t, 'happy');
  const lines = wrapText('“' + c.thanks + '”', b.w - 290, '900 40px Nunito'); lines.forEach((l, i) => text(l, b.x + 240, b.y + 225 + i * 50, { size: 40, font: 'Nunito', weight: 900, align: 'left', color: C.coffee }));
  text(c.thanksEn, b.x + 240, b.y + 230 + lines.length * 50, { size: 30, font: 'Nunito', weight: 700, italic: 'italic', align: 'left', color: '#8a6a55' });
  const rows = [['Delivery', s.base], [`Joto ${s.heat}% × ${SCORE.deliverHeat}`, s.heatBonus], ['Bila kosa · no hits', s.perfect]];
  let acc = 0; rows.forEach(([lbl, v], i) => { const y = b.y + 420 + i * 78, shown = clamp(s.shown - acc, 0, v); acc += v;
    ctx.fillStyle = i % 2 ? C.cream : C.creamD; rr(b.x + 40, y - 34, b.w - 80, 68, 18); ctx.fill();
    text(lbl, b.x + 70, y, { size: 38, font: 'Nunito', weight: 900, align: 'left', color: v ? C.brown : '#b8a898' }); text('+' + Math.floor(shown), b.x + b.w - 70, y, { size: 46, align: 'right', color: v ? C.teal : '#b8a898' }); });
  text('JUMLA  ' + String(Math.floor(s.scoreBefore + s.shown)).padStart(6, '0'), LW / 2, b.y + 690, { size: 64, color: C.coffee });
  if (G.modeT > 1.6 && Math.floor(now / 400) % 2 === 0) text(G.li + 1 < LEVELS.length ? 'GUSA · ODA INAYOFUATA' : 'GUSA · MALIZA SAFARI', LW / 2, b.y + b.h - 60, { size: 42, color: C.orange });
  ctx.restore();
}
