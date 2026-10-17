// SCENE 1 — HOME (man cave)
// Enzi works from the couch → WhatsApp from Baraka: "Blaza, leo wapi?" → hops on the hoverboard,
// weighs Mbezi (calm) vs Victoria (the buzz) in thought bubbles → picks Victoria → drops off the
// hoverboard, grabs the skateboard and rolls out the door.
// All times below are seconds from the start of this scene.
const HOME = {
  title: [0, 2.2], tap: 1.75,
  buzz: 2.2, grab: 2.45, chat: [2.75, 3.95], reply: 3.35,
  hop: [4.0, 4.45], think: [4.5, 7.2], pick: 6.8, hopOff: [7.2, 7.55], walk: [7.55, 7.95], carry: 7.95, drop: 8.15, out: 8.3, iris: [8.45, 8.85],
  sel: [[5.1, 0], [5.8, 1], [6.3, 0], [6.55, 1]], // which bubble the cursor is on (0 = Mbezi, 1 = Victoria)
  from: 'Baraka', msg: 'Blaza, leo wapi?', msgEn: 'Bro, where we going today?', reply_: 'Ngoja nifikirie...', replyEn: 'Hold on, let me think...',
  ask: ['CHAGUA KIJIWE', 'pick your spot'],
  choices: [['MBEZI', 'utulivu · calm & quiet'], ['VICTORIA', 'shamrashamra · the buzz']],
  stamp: 'LEO NI VICTORIA!',
};
const HB_X = 720;
function hoverY(t) { return FLOOR - 125 + Math.sin(t * 3) * 8; }
function selAt(t) { let v = .5, i = -1; for (const [ts, k] of HOME.sel) if (t >= ts) { v = lerp(v, k, ease(win(t, ts, ts + .25))); i = k; } return { v, i }; }

function manCave(t) {
  let g = ctx.createLinearGradient(0, 0, 0, FLOOR); g.addColorStop(0, '#141320'); g.addColorStop(1, '#231f2f'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, FLOOR);
  for (let x = 90; x < 610; x += 28) { ctx.fillStyle = (x / 28) % 2 ? '#2b2433' : '#32293c'; ctx.fillRect(x, 830, 22, FLOOR - 830); } // slat wall
  g = ctx.createLinearGradient(0, 0, 0, 280); g.addColorStop(0, 'rgba(232,126,58,.5)'); g.addColorStop(1, 'rgba(232,126,58,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 280); ctx.fillStyle = '#ffb27a'; ctx.fillRect(0, 0, W, 6);
  // window: sunrise over Dar
  const wx0 = 70, wy0 = 250, ww = 430, wh = 470;
  g = ctx.createLinearGradient(0, wy0, 0, wy0 + wh); g.addColorStop(0, '#2a2350'); g.addColorStop(.55, '#c9707a'); g.addColorStop(1, '#f6b26a'); ctx.fillStyle = g; ctx.fillRect(wx0, wy0, ww, wh);
  circ(wx0 + 300, wy0 + wh - 70, 50, '#ffe3a6');
  ctx.fillStyle = '#3a2c5a'; for (let i = 0; i < 12; i++) { const bw = 26 + rnd(i) * 30, bh = 50 + rnd(i + 3) * 150; ctx.fillRect(wx0 + i * 38, wy0 + wh - bh, bw, bh); }
  for (let i = 0; i < 30; i++) { ctx.fillStyle = '#f6c46e'; ctx.fillRect(wx0 + 10 + rnd(i) * (ww - 20), wy0 + wh - 20 - rnd(i + 9) * 120, 5, 7); }
  ctx.strokeStyle = '#0e0d14'; ctx.lineWidth = 16; ctx.strokeRect(wx0, wy0, ww, wh); line([[wx0 + ww / 2, wy0], [wx0 + ww / 2, wy0 + wh]], 10, '#0e0d14');
  // neon
  ctx.save(); ctx.shadowColor = C.orangeL; ctx.shadowBlur = 34; text('kahawa kama kawa', 330, 785, { size: 50, font: 'Fraunces', weight: 800, italic: 'italic', color: '#ffd2ad' }); ctx.restore();
  text('kahawa kama kawa', 330, 785, { size: 50, font: 'Fraunces', weight: 800, italic: 'italic', color: '#fff3e6' });
  // shelves
  for (const sy of [400, 600]) { ctx.fillStyle = '#3a3044'; ctx.fillRect(600, sy, 440, 14); const lg = ctx.createLinearGradient(0, sy + 14, 0, sy + 60); lg.addColorStop(0, 'rgba(255,170,110,.35)'); lg.addColorStop(1, 'rgba(255,170,110,0)'); ctx.fillStyle = lg; ctx.fillRect(600, sy + 14, 440, 46); }
  for (let k = 0; k < 3; k++) { shoe(640 + k * 90, 392, k % 2); }
  ctx.fillStyle = '#2B7A6E'; rr(910, 300, 70, 100, 8); ctx.fill(); ctx.fillStyle = '#fbf3e4'; rr(916, 330, 58, 30, 4); ctx.fill(); text('NGUVU', 945, 346, { size: 15, color: '#2B7A6E' });
  for (let k = 0; k < 5; k++) { ctx.fillStyle = ['#e2554a', '#f2b134', '#3aa6a0', '#c76bb0', '#5b8bd6'][k]; ctx.fillRect(630 + k * 22, 500, 18, 100); }
  circ(800, 560, 36, '#1a1a1a'); circ(800, 560, 12, C.orange); ctx.fillStyle = C.goldL; ctx.beginPath(); ctx.moveTo(880, 600); ctx.lineTo(930, 600); ctx.lineTo(920, 560); ctx.lineTo(890, 560); ctx.fill(); ell(905, 548, 30, 14, C.goldL);
  for (let k = 0; k < 5; k++) ell(1000 + (k - 2) * 12, 560 - Math.abs(k - 2) * 6, 10, 34, '#3f8a45', (k - 2) * .4);
  // RGB hex panels
  for (let k = 0; k < 5; k++) { const hx = 640 + k * 78, hy = 760 + (k % 2) * 46, hue = (t * 60 + k * 50) % 360; ctx.strokeStyle = `hsl(${hue},90%,62%)`; ctx.lineWidth = 6; ctx.beginPath(); for (let j = 0; j < 6; j++) { const a = j * Math.PI / 3; ctx.lineTo(hx + Math.cos(a) * 38, hy + Math.sin(a) * 38); } ctx.closePath(); ctx.stroke(); }
  // floor
  g = ctx.createLinearGradient(0, FLOOR, 0, H); g.addColorStop(0, '#2c2734'); g.addColorStop(1, '#141119'); ctx.fillStyle = g; ctx.fillRect(0, FLOOR, W, H - FLOOR);
  ctx.fillStyle = 'rgba(255,170,110,.06)'; for (let i = 0; i < 6; i++) ctx.fillRect(0, FLOOR + 30 + i * 50, W, 2);
  ell(420, FLOOR + 150, 380, 55, '#3b2a3a'); ell(420, FLOOR + 150, 340, 44, '#4a3346');
  // door (open, morning light)
  g = ctx.createLinearGradient(1000, 0, 1080, 0); g.addColorStop(0, '#ffe9c4'); g.addColorStop(1, '#fff7e6'); ctx.fillStyle = g; ctx.fillRect(1000, 1000, 80, FLOOR - 1000); ctx.fillStyle = '#0e0d14'; ctx.fillRect(992, 990, 12, FLOOR - 990);
  ctx.fillStyle = 'rgba(255,230,180,.18)'; ctx.beginPath(); ctx.moveTo(1000, FLOOR); ctx.lineTo(1080, FLOOR); ctx.lineTo(1080, H); ctx.lineTo(760, H); ctx.fill();
  // ring light on stand (between couch and gaming corner)
  ringLight(628, 960, 86, FLOOR);
  // gaming corner: desk, ultrawide, RGB keyboard, gamer chair
  ctx.fillStyle = '#16141c'; ctx.fillRect(760, 1290, 230, 22); ctx.fillRect(770, 1312, 14, FLOOR - 1312); ctx.fillRect(966, 1312, 14, FLOOR - 1312);
  ctx.fillStyle = '#0d0c12'; rr(770, 1090, 210, 140, 10); ctx.fill(); ctx.fillStyle = '#0d0c12'; ctx.fillRect(868, 1230, 14, 60);
  g = ctx.createLinearGradient(780, 1100, 970, 1220); g.addColorStop(0, '#2a2350'); g.addColorStop(1, '#e0866e'); ctx.fillStyle = g; rr(778, 1098, 194, 124, 6); ctx.fill();
  text('HARAKATI ZA', 875, 1135, { size: 18, color: C.goldL }); text('ENZI', 875, 1170, { size: 40, sw: 5, stroke: C.coffee }); ctx.fillStyle = C.orange; rr(840, 1192, 70, 16, 8); ctx.fill();
  for (let k = 0; k < 8; k++) { ctx.fillStyle = `hsl(${(t * 120 + k * 40) % 360},90%,60%)`; ctx.fillRect(790 + k * 18, 1282, 16, 6); }
  ringLight(965, 1050, 40, 1290);
  // gamer chair (facing the desk)
  ctx.fillStyle = '#1a1820'; ctx.fillRect(705, FLOOR - 160, 12, 140); for (const dx of [-50, 0, 50]) circ(711 + dx, FLOOR - 10, 10, '#1a1820'); line([[661, FLOOR - 20], [761, FLOOR - 20]], 10, '#1a1820');
  ctx.fillStyle = '#1e1c26'; rr(650, FLOOR - 205, 130, 40, 12); ctx.fill();
  ctx.fillStyle = '#1e1c26'; rr(640, FLOOR - 540, 56, 360, 20); ctx.fill(); ctx.fillStyle = C.orange; ctx.fillRect(650, FLOOR - 520, 10, 320); ctx.fillRect(676, FLOOR - 520, 10, 320);
  ctx.fillStyle = '#2c2a35'; rr(632, FLOOR - 560, 72, 60, 18); ctx.fill();
}
function ringLight(x, y, r, groundY) {
  line([[x, y + r], [x, groundY]], 8, '#2a2833'); line([[x - 50, groundY], [x, groundY - 60], [x + 50, groundY]], 6, '#2a2833');
  const g = ctx.createRadialGradient(x, y, r * .6, x, y, r * 2.4); g.addColorStop(0, 'rgba(255,255,245,.35)'); g.addColorStop(1, 'rgba(255,255,245,0)'); ctx.fillStyle = g; ctx.fillRect(x - r * 2.4, y - r * 2.4, r * 4.8, r * 4.8);
  ctx.strokeStyle = '#fffdf5'; ctx.lineWidth = r * .22; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
}
function couch() {
  ctx.fillStyle = '#1f4a4f'; rr(110, FLOOR - 430, 90, 290, 30); ctx.fill();                 // backrest (left)
  ctx.fillStyle = '#245a60'; rr(110, FLOOR - 200, 490, 120, 26); ctx.fill();                // base
  ctx.fillStyle = '#2b6a70'; rr(190, FLOOR - 205, 330, 46, 20); ctx.fill();                 // seat cushion
  ctx.fillStyle = '#1f4a4f'; rr(530, FLOOR - 270, 80, 190, 26); ctx.fill();                 // armrest (right)
  ctx.fillStyle = C.orange; rr(130, FLOOR - 380, 60, 110, 20); ctx.fill();                  // throw pillow
  ctx.fillStyle = '#0e0d14'; ctx.fillRect(130, FLOOR - 80, 14, 80); ctx.fillRect(570, FLOOR - 80, 14, 80);
}
function homePose(t) {
  const P = basePose(), h = HOME; P.onBoard = false; P.drag = 0; P.y = FLOOR;
  if ((t % 3.3) < .1) P.eyes = 'blink';
  const hy = hoverY(t), s = selAt(t), drift = t >= h.think[0] ? lerp(-45, 45, s.v) : 0;
  if (t < h.hop[0]) { // on the couch, laptop on lap
    P.x = 330; P.hip = [0, -176]; P.lean = -.05; P.fB = [70, -40]; P.fF = [88, -44]; P.eyeDX = 3; P.mouth = 'smile';
    const tp = Math.abs(Math.sin(t * 20)); P.hF = [150, -222 - tp * 8]; P.hB = [120, -218 - Math.abs(Math.cos(t * 18)) * 8];
    P.beforeFront = () => drawLaptop(40, -194, 170, 1, Math.floor(t * 2) % 4);
    if (t > h.buzz) { P.eyes = 'open'; P.brows = 1; P.eyeDX = 7; P.mouth = 'o'; }
    if (t > h.grab) { const p = ease(win(t, h.grab, h.grab + .25)), up = ease(win(t, h.grab + .25, h.chat[0] + .1)); P.hF = [lerp(lerp(150, 262, p), 92, up), lerp(lerp(-222, -268, p), -360, up)]; P.phone = p > .85; }
    if (t > h.chat[0] + .1) { const reading = t < h.chat[0] + .45; P.eyes = reading ? 'wide' : 'happy'; P.mouth = reading ? 'o' : 'grin'; P.brows = 1; P.phone = true; P.hF = [92, -360 + (t > h.reply - .3 && t < h.reply ? Math.abs(Math.sin(t * 30)) * 6 : 0)]; }
    if (t > h.chat[1] - .05) { P.phone = false; P.hF = [150, -230]; P.mouth = 'grin'; P.brows = -1; }
  } else if (t < h.hop[1]) { // hop onto the hoverboard
    const p = win(t, h.hop[0], h.hop[1]), e = ease(p); P.x = lerp(330, HB_X, e); P.y = lerp(FLOOR, hy + 43, e) - 220 * Math.sin(Math.PI * p);
    P.hip = [0, -170]; P.fB = [-50, -60]; P.fF = [50, -60]; P.hB = [-140, -340]; P.hF = [140, -340]; P.eyes = 'happy'; P.mouth = 'grin'; P.steam = 1.8; P.noShadow = true;
  } else if (t < h.hopOff[0]) { // thinking on the hoverboard
    P.x = HB_X + drift; P.y = hy + 43; P.noShadow = true; P.hip = [-4, -176 + Math.sin(t * 3) * 3]; P.lean = .04 * (s.v - .5);
    P.hF = [60, -298]; P.hB = [-82, -196]; P.brows = -1; P.mouth = 'hmm'; P.eyeDX = lerp(-8, 8, s.v); P.look = s.v > .5 ? 1 : -1;
    if (t < h.think[0] + .35) { P.mouth = 'o'; P.brows = 1; }
    if (t > h.pick) { P.hF = [120, -420 + Math.sin(t * 20) * 10]; P.hB = [-120, -330]; P.eyes = 'happy'; P.mouth = 'grin'; P.brows = 1; P.steam = 2; }
  } else if (t < h.walk[0]) { // hop off
    const p = win(t, h.hopOff[0], h.hopOff[1]), e = ease(p); P.x = lerp(HB_X + 45, 830, e); P.y = lerp(hy + 43, FLOOR, e) - 120 * Math.sin(Math.PI * p);
    P.hip = [0, -165]; P.fB = [-40, -10]; P.fF = [40, -10]; P.hB = [-130, -300]; P.hF = [130, -300]; P.mouth = 'grin'; P.noShadow = p < .8;
  } else if (t < h.drop) { // walk to the board by the door, pick it up
    const p = win(t, h.walk[0], h.walk[1]), ph = (t - h.walk[0]) * 10; P.x = lerp(830, 900, p);
    P.fB = [Math.sin(ph) * 45 - 10, -Math.max(0, Math.cos(ph)) * 24]; P.fF = [-Math.sin(ph) * 45 + 10, -Math.max(0, -Math.cos(ph)) * 24]; P.hip = [0, -152 - Math.abs(Math.cos(ph)) * 8];
    P.hB = t > h.carry ? [-40, -200] : [60, -150]; P.hF = [30 + Math.sin(ph) * 40, -210]; P.mouth = 'grin'; P.carry = t > h.carry ? 1 : 0;
  } else { // drop it, hop on, roll out
    P.onBoard = true; P.mouth = 'grin'; P.brows = -1; P.drag = .5;
    if (t < h.out) { P.x = 900; P.y = FLOOR - 40 * bump(t, h.drop, h.out); }
    else { const k = t - h.out; P.x = 900 + k * k * 500 + k * 250; const c = (k / .5) % 1; if (c < .5) P.fB = [lerp(-20, -170, c * 2), 0]; P.lean = .16; P.hF = [130, -240]; P.hB = [-125, -290]; }
  }
  return P;
}
// ----- overlays -----
function titleOverlay(t) {
  const a = 1 - win(t, HOME.title[1] - .35, HOME.title[1]); if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  const vg = ctx.createLinearGradient(0, 0, 0, H); vg.addColorStop(0, 'rgba(10,8,20,.7)'); vg.addColorStop(.45, 'rgba(10,8,20,.1)'); vg.addColorStop(1, 'rgba(10,8,20,.55)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  const k = backOut(win(t, .1, .7)), bob = Math.sin(t * 3) * 8;
  ctx.save(); ctx.translate(CX, 360 + bob); ctx.scale(k, k); ctx.rotate(-.04);
  text('HARAKATI ZA', 0, -120, { size: 110, color: C.goldL, sw: 26, stroke: C.coffee, shadow: 14 }); text('ENZI', 0, 40, { size: 250, sw: 34, stroke: C.coffee, shadow: 18 });
  ctx.fillStyle = C.orange; rr(-330, 150, 660, 76, 38); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = C.coffee; ctx.stroke(); text('KILA KIKOMBE NI SAFARI', 0, 190, { size: 46 });
  ctx.restore();
  const pulse = 1 + .06 * Math.sin(t * 7); ctx.save(); ctx.translate(CX, 1780); ctx.scale(pulse, pulse); text('TAP TO PLAY', 0, 0, { size: 84, sw: 18, stroke: C.coffee, shadow: 10 }); ctx.restore();
  const tp = win(t, HOME.tap, HOME.tap + .45); if (tp > 0 && tp < 1) { ctx.strokeStyle = `rgba(255,255,255,${1 - tp})`; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(CX + 160, 1680, 30 + tp * 150, 0, 7); ctx.stroke(); circ(CX + 160, 1680, 40, `rgba(255,255,255,${.5 * (1 - tp)})`); }
  ctx.restore();
}
function chatIcon(x, y, r) { circ(x, y, r, '#25D366'); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y - r * .05, r * .55, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - r * .5, y + r * .3); ctx.lineTo(x - r * .62, y + r * .62); ctx.lineTo(x - r * .2, y + r * .48); ctx.fill(); ctx.fillStyle = '#25D366'; ctx.beginPath(); ctx.arc(x, y - r * .05, r * .38, 0, 7); ctx.fill(); }
function notification(t) {
  const a0 = HOME.buzz, k = t - a0; if (k < 0 || k > .9) return;
  const y = lerp(-180, 60, backOut(win(k, 0, .3))) - easeIn(win(k, .65, .9)) * 260;
  ctx.save(); ctx.fillStyle = 'rgba(20,20,26,.92)'; rr(60, y, 960, 150, 36); ctx.fill();
  chatIcon(140, y + 75, 42); text(HOME.from, 205, y + 50, { size: 40, align: 'left', font: 'Nunito', weight: 900 }); text(HOME.msg, 205, y + 102, { size: 40, align: 'left', font: 'Nunito', weight: 700, color: '#ddd' }); text('sasa hivi', 990, y + 50, { size: 28, align: 'right', font: 'Nunito', weight: 700, color: '#999' });
  ctx.restore();
}
function chatCard(t) {
  const [a, b] = HOME.chat; if (t < a || t > b + .25) return;
  const k = backOut(win(t, a, a + .3)) * (1 - easeIn(win(t, b, b + .25)));
  const cw = 820, chh = 600, x0 = CX - cw / 2, y0 = 420;
  ctx.save(); ctx.translate(CX, y0 + chh / 2); ctx.scale(k, k); ctx.translate(-CX, -(y0 + chh / 2));
  ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(x0 + 10, y0 + 16, cw, chh, 40); ctx.fill();
  ctx.save(); rr(x0, y0, cw, chh, 40); ctx.clip();
  ctx.fillStyle = '#ECE5DD'; ctx.fillRect(x0, y0, cw, chh);
  for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(0,0,0,.035)'; ctx.beginPath(); ctx.arc(x0 + rnd(i) * cw, y0 + 120 + rnd(i + 3) * (chh - 120), 10 + rnd(i + 5) * 14, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#075E54'; ctx.fillRect(x0, y0, cw, 120);
  ctx.save(); ctx.beginPath(); ctx.arc(x0 + 90, y0 + 60, 40, 0, 7); ctx.fillStyle = '#d9d2c7'; ctx.fill(); ctx.clip(); head(x0 + 96, y0 + 76, .62, { skin: '#5a3420', hat: 'helmet' }, t); ctx.restore();
  text(HOME.from, x0 + 150, y0 + 45, { size: 42, align: 'left', font: 'Nunito', weight: 900 }); text('online', x0 + 150, y0 + 88, { size: 28, align: 'left', font: 'Nunito', weight: 600, color: '#cfe9e2' });
  // incoming
  const inA = win(t, a + .15, a + .35); if (inA > 0) { ctx.globalAlpha = inA; ctx.font = '900 54px Nunito'; const w = ctx.measureText(HOME.msg).width + 70; ctx.fillStyle = '#fff'; rr(x0 + 40, y0 + 170, w, 120, [0, 28, 28, 28]); ctx.fill(); text(HOME.msg, x0 + 72, y0 + 220, { size: 54, align: 'left', font: 'Nunito', weight: 900, color: '#1b1b1b' }); text('07:42', x0 + 40 + w - 20, y0 + 268, { size: 24, align: 'right', font: 'Nunito', weight: 600, color: '#888' }); ctx.globalAlpha = 1; }
  // typing… then reply
  const r = HOME.reply; if (t > r - .3 && t < r) { ctx.fillStyle = '#DCF8C6'; rr(x0 + cw - 200, y0 + 340, 160, 80, 30); ctx.fill(); for (let i = 0; i < 3; i++) circ(x0 + cw - 160 + i * 40, y0 + 380 - Math.abs(Math.sin(t * 14 + i)) * 8, 10, '#6aa86a'); }
  if (t >= r) { const ra = win(t, r, r + .15); ctx.globalAlpha = ra; ctx.font = '900 50px Nunito'; const w = ctx.measureText(HOME.reply_).width + 70; ctx.fillStyle = '#DCF8C6'; rr(x0 + cw - 40 - w, y0 + 330, w, 116, [28, 0, 28, 28]); ctx.fill(); text(HOME.reply_, x0 + cw - 40 - w + 32, y0 + 378, { size: 50, align: 'left', font: 'Nunito', weight: 900, color: '#1b1b1b' }); text('07:42 ✓✓', x0 + cw - 60, y0 + 424, { size: 24, align: 'right', font: 'Nunito', weight: 700, color: '#34B7F1' }); ctx.globalAlpha = 1; }
  ctx.restore();
  // English captions
  text(HOME.msgEn, CX, y0 + chh + 50, { size: 38, font: 'Nunito', weight: 800, italic: 'italic', sw: 8, stroke: 'rgba(20,10,20,.8)' });
  if (t >= r) text(HOME.replyEn, CX, y0 + chh + 100, { size: 34, font: 'Nunito', weight: 700, italic: 'italic', color: '#bfeac0', sw: 8, stroke: 'rgba(20,10,20,.8)' });
  ctx.restore();
}
function cloud(cx, cy, rx, ry, seed, fill, edge) {
  const pts = []; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, 52 + rnd(i + seed) * 22]); }
  for (const [x, y, r] of pts) circ(x, y, r + 9, edge); ell(cx, cy, rx + 9, ry + 9, edge);
  for (const [x, y, r] of pts) circ(x, y, r, fill); ell(cx, cy, rx, ry, fill);
}
function mbeziVision(t) { // calm terrace, plants, a reader, the playground
  let g = ctx.createLinearGradient(0, -200, 0, 200); g.addColorStop(0, '#bfe6f2'); g.addColorStop(1, '#f6f0dc'); ctx.fillStyle = g; ctx.fillRect(-260, -220, 520, 440);
  circ(120, -110, 34, '#fff4c8');
  circ(-170, -20, 80, '#5f9e64'); circ(-100, -60, 64, '#6fae6f'); circ(190, -10, 70, '#5f9e64');
  ctx.fillStyle = '#f6efe2'; ctx.fillRect(-210, -60, 250, 140); for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? '#fbf7ee' : C.teal; ctx.fillRect(-215 + k * 32, -75, 33, 26); }
  ctx.fillStyle = '#e9dcc4'; ctx.fillRect(-260, 80, 520, 160);
  // swing
  line([[110, 150], [140, -20], [230, -20], [250, 150]], 7, C.teal); const sw = Math.sin(t * 2) * .3; line([[175, -20], [175 + Math.sin(sw) * 110, -20 + Math.cos(sw) * 110]], 3, '#555'); ctx.fillStyle = C.red; ctx.fillRect(160 + Math.sin(sw) * 110, -14 + Math.cos(sw) * 110, 30, 7);
  // reader at a table
  person(-20, 175, .3, { skin: '#6b4026', shirt: '#9a6fb0', gesture: .5 }, t);
  ctx.fillStyle = '#fff'; ctx.fillRect(-58, 60, 26, 34); ctx.fillStyle = C.orange; ctx.fillRect(-58, 60, 4, 34);
  ctx.fillStyle = '#7a4a28'; ctx.fillRect(-140, 95, 110, 10); ctx.fillRect(-90, 105, 8, 70); smallCup(-110, 95, .45);
  for (let k = 0; k < 2; k++) { const ph = (t * .6 + k * .5) % 1; line([[-112 + k * 6, 70 - ph * 30], [-108 + k * 6, 60 - ph * 30]], 3, `rgba(255,255,255,${1 - ph})`); }
  // potted plants + drifting leaves
  for (const px of [-220, 60]) { ctx.fillStyle = '#b5532c'; ctx.fillRect(px, 120, 40, 50); for (let k = 0; k < 5; k++) ell(px + 20 + (k - 2) * 9, 105, 8, 24, '#3f8a45', (k - 2) * .4); }
  for (let k = 0; k < 3; k++) { const ph = (t * .3 + k / 3) % 1; ell(-200 + ph * 400, -150 + Math.sin(ph * 9 + k) * 20 + k * 30, 8, 4, '#6fae6f', ph * 6); }
}
function victoriaVision(t) { // packed café, string lights, music
  let g = ctx.createLinearGradient(0, -200, 0, 200); g.addColorStop(0, '#5a2c16'); g.addColorStop(1, '#c4510e'); ctx.fillStyle = g; ctx.fillRect(-260, -220, 520, 440);
  ctx.strokeStyle = '#2a1408'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-260, -150); ctx.quadraticCurveTo(0, -60, 260, -150); ctx.stroke();
  for (let i = 1; i < 12; i++) { const u = i / 12, bx = lerp(-260, 260, u), by = (1 - u) * (1 - u) * -150 + 2 * u * (1 - u) * -60 + u * u * -150 + 10, on = .6 + .4 * Math.sin(t * 6 + i);
    circ(bx, by, 16, `rgba(255,214,140,${.3 * on})`); circ(bx, by, 7, `rgba(255,235,180,${.8 + .2 * on})`); }
  const crowd = [[-190, '#e2554a', '#5a3420'], [-110, '#3aa6a0', '#7a4a2c'], [-30, '#f2b134', '#4e2c1a'], [50, '#5b8bd6', '#8a5434'], [130, '#c76bb0', '#6b4026'], [205, '#2B7A6E', '#5a3420'], [-150, '#fbf7ee', '#6b4026'], [90, '#e98b5a', '#4e2c1a']];
  crowd.forEach(([x, shirt, skin], i) => { const back = i >= 6, bob = Math.abs(Math.sin(t * 9 + i * 1.3)) * 10;
    person(x, (back ? 150 : 230), back ? .3 : .36, { skin, shirt, hat: i % 3 === 0 ? 'wrap' : 'none', wrapCol: ['#e8b830', '#2B7A6E'][i % 2], talk: 1, gesture: i % 2 ? 1 : .5, bounce: bob }, t + i); });
  for (let i = 0; i < 6; i++) { const ph = (t * .8 + i / 6) % 1; text(i % 2 ? '♪' : '♫', -220 + i * 85 + Math.sin(t * 3 + i) * 12, 60 - ph * 220, { size: 40, color: `rgba(255,230,170,${1 - ph})`, font: 'Nunito', weight: 900 }); }
}
function thoughts(t) {
  const h = HOME; if (t < h.think[0] - .05 || t > h.think[1] + .2) return;
  const fade = 1 - win(t, h.think[1] - .15, h.think[1] + .15), s = selAt(t), picked = t > h.pick;
  const ex = HB_X + (t >= h.think[0] ? lerp(-45, 45, s.v) : 0) + 20, ey = hoverY(t) + 43 - 470;
  ctx.save(); ctx.globalAlpha = fade;
  // header
  const ha = backOut(win(t, h.think[0], h.think[0] + .3)); ctx.save(); ctx.translate(CX, 380); ctx.scale(ha, ha); ctx.fillStyle = C.coffee; rr(-330, -52, 660, 104, 52); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.gold; ctx.stroke(); text(h.ask[0], 0, -10, { size: 50 }); text(h.ask[1], 0, 30, { size: 28, font: 'Nunito', weight: 800, color: C.goldL }); ctx.restore();
  [[290, 0, mbeziVision], [790, 1, victoriaVision]].forEach(([cx, i, vis]) => {
    const appear = backOut(win(t, h.think[0] + .1 + i * .3, h.think[0] + .45 + i * .3)); if (appear <= 0) return;
    const cy = 790, on = s.i === i, chosen = picked && i === 1, dropped = picked && i === 0;
    let sc = appear * (on ? 1.05 + .02 * Math.sin(t * 10) : .95); if (dropped) sc *= 1 - easeIn(win(t, h.pick + .25, h.pick + .6)); if (chosen) sc *= 1 + .08 * bump(t, h.pick, h.pick + .4);
    if (sc <= .01) return;
    // trail of little thought puffs from Enzi's head
    for (let k = 0; k < 3; k++) { const u = (k + 1) / 4, px = lerp(ex, cx, u), py = lerp(ey, cy + 210, u); circ(px, py, (10 + k * 8) * Math.min(1, appear), C.coffee); circ(px, py, (10 + k * 8) * Math.min(1, appear) - 5, '#fff'); }
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.globalAlpha = fade * (on || picked ? 1 : .72); if (dropped) { ctx.filter = 'grayscale(1)'; ctx.globalAlpha = fade * .6; }
    if (on) { const gl = ctx.createRadialGradient(0, 0, 150, 0, 0, 330); gl.addColorStop(0, 'rgba(232,194,122,.6)'); gl.addColorStop(1, 'rgba(232,194,122,0)'); ctx.fillStyle = gl; ctx.fillRect(-340, -340, 680, 680); }
    cloud(0, 0, 175, 150, i * 9, '#fff', on ? C.goldL : C.coffee);
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 200, 168, 0, 0, 7); ctx.clip(); vis(t); ctx.restore();
    // label sticker
    ctx.fillStyle = i ? C.orange : C.teal; rr(-170, -250, 340, 96, 30); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.coffee; ctx.stroke();
    text(h.choices[i][0], 0, -215, { size: 52 }); text(h.choices[i][1], 0, -176, { size: 24, font: 'Nunito', weight: 800, color: '#fff3e0' });
    ctx.restore();
    if (dropped) { const k = win(t, h.pick + .25, h.pick + .7); if (k > 0 && k < 1) for (let j = 0; j < 10; j++) { const a = j * .63; circ(cx + Math.cos(a) * 200 * k, cy + Math.sin(a) * 160 * k, 26 * (1 - k), 'rgba(255,255,255,.9)'); } }
  });
  // selection cursor
  if (!picked && s.i >= 0) { const cx = lerp(290, 790, s.v), y = 520 + Math.sin(t * 12) * 10; ctx.fillStyle = C.goldL; ctx.beginPath(); ctx.moveTo(cx - 30, y - 40); ctx.lineTo(cx + 30, y - 40); ctx.lineTo(cx, y); ctx.closePath(); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.coffee; ctx.stroke(); }
  // stamp
  if (picked) { const k = backOut(win(t, h.pick + .05, h.pick + .35)); ctx.save(); ctx.translate(790, 1020); ctx.rotate(-.12); ctx.scale(k * 1, k * 1); ctx.fillStyle = C.red; rr(-250, -52, 500, 104, 22); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#fff'; ctx.stroke(); text(h.stamp, 0, 4, { size: 54 }); ctx.restore(); }
  ctx.restore();
}
scene({
  id: 'home', dur: 9.0, kind: 'home',
  hover: [4.25, 7.3],
  cues: [[HOME.tap, 'tap'], [HOME.buzz, 'buzz'], [HOME.buzz + .25, 'notif'], [HOME.chat[0] + .15, 'msg'], [HOME.reply - .3, 'typing'], [HOME.reply, 'msgout'], [HOME.hop[0], 'hop'], [4.25, 'hoverOn'],
    [HOME.think[0] + .1, 'think'], [HOME.think[0] + .4, 'think'], ...HOME.sel.map(([t]) => [t, 'cursor']), [HOME.pick, 'select'], [HOME.pick + .3, 'poof'], [HOME.hopOff[0], 'hop'], [7.3, 'hoverOff'], [HOME.drop + .1, 'kick'], [HOME.iris[0], 'iris']],
  render(T, t) {
    manCave(t); couch();
    if (t < HOME.grab + .2) { const bz = t > HOME.buzz && t < HOME.buzz + .5 ? Math.sin(t * 90) * 4 : 0; ctx.save(); ctx.translate(575 + bz, FLOOR - 272); ctx.rotate(-.1); ctx.fillStyle = '#16141c'; rr(-40, -12, 80, 16, 6); ctx.fill(); ctx.restore(); if (bz) for (const s of [-1, 1]) line([[575 + s * 55, FLOOR - 300], [575 + s * 65, FLOOR - 285]], 4, '#9ff0c0'); }
    if (t < HOME.carry) { ctx.save(); ctx.translate(950, FLOOR); ctx.rotate(-Math.PI / 2 + .22); board(105, 0, 0, .9); ctx.restore(); }
    const P = homePose(t), hbX = HB_X + (t >= HOME.think[0] && t < HOME.hopOff[0] ? lerp(-45, 45, selAt(t).v) : t >= HOME.hopOff[0] ? 45 : 0);
    hoverboard(hbX, hoverY(t), t, t > HOME.hopOff[1] + .3 ? lerp(1, .4, win(t, HOME.hopOff[1] + .3, HOME.hopOff[1] + .8)) : 1);
    drawEnzi(P, t);
    titleOverlay(t); notification(t); chatCard(t); thoughts(t);
    if (t > HOME.iris[0]) irisMask(Math.min(P.x, 1040), FLOOR - 220, lerp(1400, 0, easeIn(win(t, HOME.iris[0], HOME.iris[1]))));
  },
});
