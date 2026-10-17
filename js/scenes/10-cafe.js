// SCENE 10 — INSIDE HZE VICTORIA. The crowd cheers, the barista greets him, Enzi grabs a seat at the
// shared table, opens the laptop, types, then sips from the cup on the side. (Times = seconds into the café.)
const CAFE = {
  irisIn: [0, .45], walk: [0, 1.1], wave: [.65, 1.1], cheer: [.15, 1.3], barista: [.5, 1.1], boardDown: 1.15, hop: [1.2, 1.55],
  reach: [1.65, 1.9], lid: [1.7, 2.05], type: [2.2, 2.85], sip: { reach: [2.85, 3.1], lift: [3.1, 3.4], down: [4.05, 4.4] }, heart: [3.5, 4.1], ahh: [3.75, 4.8], wink: [5.3, 5.7],
  neighbourNod: [1.6, 2.3],
  greet: 'Karibu Victoria, Enzi!', ahhTxt: 'Ahhh...', sign: 'HZE · VICTORIA', wall: ['Bring your laptop.', 'We\'ll bring great coffee.'],
};
const DESK = { cx: 420, dx0: 520, dTop: FLOOR - 310 };
function cafeInterior(ct, t) {
  const g = ctx.createLinearGradient(0, 0, 0, FLOOR); g.addColorStop(0, '#f6ead6'); g.addColorStop(1, '#efdcc0'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, FLOOR);
  ctx.fillStyle = '#8a5a34'; ctx.fillRect(0, FLOOR - 260, W, 260); ctx.fillStyle = '#7a4a28'; for (let x = 0; x < W; x += 90) ctx.fillRect(x, FLOOR - 260, 4, 260); ctx.fillStyle = '#a06a3e'; ctx.fillRect(0, FLOOR - 268, W, 14);
  // window onto the busy street
  ctx.fillStyle = '#9fd0ef'; rr(40, 330, 420, 560, 20); ctx.fill(); ctx.fillStyle = '#d7ecf5'; ctx.fillRect(40, 640, 420, 250);
  circ(150, 760, 90, '#3f8a45'); circ(380, 740, 80, '#8a6ad0');
  for (let k = 0; k < 3; k++) walker(((ct * 90 + k * 170) % 520), 890, .35, t, 3 + k, k % 2 ? -1 : 1);
  ctx.strokeStyle = C.coffee; ctx.lineWidth = 16; rr(40, 330, 420, 560, 20); ctx.stroke(); line([[250, 330], [250, 890]], 10, C.coffee); line([[40, 610], [460, 610]], 10, C.coffee);
  ctx.fillStyle = 'rgba(255,240,200,.16)'; ctx.beginPath(); ctx.moveTo(40, 330); ctx.lineTo(460, 330); ctx.lineTo(760, FLOOR); ctx.lineTo(240, FLOOR); ctx.fill();
  // roasts on the shelf
  ctx.fillStyle = '#7a4a28'; ctx.fillRect(560, 520, 460, 16); ctx.fillRect(560, 700, 460, 16);
  [['NGUVU', '#2B7A6E'], ['TUNU', '#B83528'], ['AMKA', '#e8a32c'], ['MIRUMBANI', '#7a4e1e']].forEach(([n, c], i) => { const bx = 590 + i * 108; ctx.fillStyle = c; rr(bx, 400, 86, 120, 8); ctx.fill(); ctx.fillStyle = '#fbf3e4'; rr(bx + 8, 440, 70, 44, 4); ctx.fill(); text(n, bx + 43, 462, { size: n.length > 6 ? 13 : 18, color: c }); ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(bx, 400, 86, 12); });
  for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#d9cbb3', '#c9b9a0', '#e6d7bf'][i]; rr(590 + i * 120, 600 + i * 6, 90, 100 - i * 6, 10); ctx.fill(); } ell(990, 640, 30, 56, '#3f8a45');
  text(CAFE.wall[0], 790, 790, { size: 40, font: 'Fraunces', weight: 800, italic: 'italic', color: C.brown }); text(CAFE.wall[1], 790, 845, { size: 40, font: 'Fraunces', weight: 800, italic: 'italic', color: C.orange });
  ctx.fillStyle = C.coffee; rr(600, 300, 380, 70, 35); ctx.fill(); text(CAFE.sign, 790, 336, { size: 38, color: C.goldL });
  // pendant lamps + string lights
  for (const lx of [300, 640, 900]) { line([[lx, 0], [lx, 210]], 3, '#3a2a20'); ctx.fillStyle = '#c99a5b'; ctx.beginPath(); ctx.moveTo(lx - 60, 280); ctx.quadraticCurveTo(lx, 170, lx + 60, 280); ctx.fill(); const lg = ctx.createRadialGradient(lx, 290, 5, lx, 290, 260); lg.addColorStop(0, 'rgba(255,220,150,.55)'); lg.addColorStop(1, 'rgba(255,220,150,0)'); ctx.fillStyle = lg; ctx.fillRect(lx - 260, 280, 520, 300); }
  for (let k = 0; k < 2; k++) { const y0 = 90 + k * 40, ym = 260 + k * 40; ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, y0); ctx.quadraticCurveTo(540, ym, 1080, y0); ctx.stroke();
    for (let i = 1; i < 14; i++) { const u = i / 14, bx = u * 1080, by = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * ym + u * u * y0 + 14, on = .6 + .4 * Math.sin(t * 4 + i + k);
      const lg = ctx.createRadialGradient(bx, by, 2, bx, by, 40); lg.addColorStop(0, `rgba(255,214,140,${.6 * on})`); lg.addColorStop(1, 'rgba(255,214,140,0)'); ctx.fillStyle = lg; ctx.fillRect(bx - 40, by - 40, 80, 80); circ(bx, by, 9, `rgba(255,230,170,${.7 + .3 * on})`); } }
  // the crowd at the back high-table
  const cheer = win(ct, CAFE.cheer[0], CAFE.cheer[0] + .15) * (1 - win(ct, CAFE.cheer[1] - .3, CAFE.cheer[1]));
  [[430, '#e2554a', '#5a3420', 0], [540, '#3aa6a0', '#7a4a2c', 1], [700, '#f2b134', '#4e2c1a', 0], [820, '#5b8bd6', '#8a5434', 1], [950, '#c76bb0', '#6b4026', 0]].forEach(([cx, shirt, skin, hat], i) => {
    const talk = Math.sin(t * 2 + i * 2) > .3 ? 1 : 0, bob = Math.abs(Math.sin(t * 3 + i)) * 4 + cheer * Math.abs(Math.sin(t * 12 + i)) * 16;
    person(cx, 1395, .56, { skin, shirt, hat: hat ? 'wrap' : 'none', wrapCol: ['#e8b830', '#2B7A6E'][i % 2], talk: cheer > .3 ? 1 : talk * .7, gesture: cheer > .3 ? 1 : (talk ? .4 : 0), bounce: bob }, t + i * .3); });
  ctx.fillStyle = '#6b4530'; ctx.fillRect(380, 1215, 700, 30); ctx.fillStyle = '#5b3a24'; ctx.fillRect(380, 1245, 700, 95);
  for (let i = 0; i < 4; i++) smallCup(470 + i * 160, 1215, .55);
  for (let i = 0; i < 6; i++) { const ph = (t * .5 + i / 6) % 1; text(i % 2 ? '♪' : '♫', 300 + i * 130 + Math.sin(t * 2 + i) * 20, 1100 - ph * 300, { size: 44, color: `rgba(196,81,14,${(1 - ph) * .8})`, font: 'Nunito', weight: 900 }); }
  // counter + barista
  ctx.fillStyle = '#5b3a24'; ctx.fillRect(0, 1000, 330, 340);
  person(170, 1230, .62, { skin: '#5a3420', shirt: '#fbf7ee', apron: true, talk: ct > CAFE.barista[0] && ct < CAFE.barista[1] ? 1 : 0, gesture: ct > CAFE.barista[0] - .1 && ct < CAFE.barista[1] + .3 ? 1 : .1 }, t);
  ctx.fillStyle = '#6b4530'; ctx.fillRect(0, 1060, 360, 290); ctx.fillStyle = '#8a5a34'; ctx.fillRect(0, 1048, 372, 22);
  ctx.fillStyle = '#c9c4bd'; rr(40, 960, 130, 90, 10); ctx.fill(); ctx.fillStyle = '#333'; ctx.fillRect(60, 1020, 20, 20); ctx.fillRect(110, 1020, 20, 20);
  text('enzi', 180, 1200, { size: 60, font: 'Fraunces', weight: 800, color: C.cream });
  const fg = ctx.createLinearGradient(0, FLOOR, 0, H); fg.addColorStop(0, '#b07a4a'); fg.addColorStop(1, '#8a5a34'); ctx.fillStyle = fg; ctx.fillRect(0, FLOOR, W, H - FLOOR);
  ctx.strokeStyle = 'rgba(60,30,15,.25)'; ctx.lineWidth = 3; for (let y = FLOOR + 40; y < H; y += 70) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ell(620, FLOOR + 150, 420, 60, '#c4510e'); ell(620, FLOOR + 150, 380, 48, '#d4a559');
}
function cafeChair(ct) {
  const { cx } = DESK, seat = FLOOR - 182;
  ctx.fillStyle = '#7a4a28'; ctx.fillRect(cx - 80, seat, 150, 18); ctx.fillRect(cx - 80, seat - 260, 16, 278); ctx.fillRect(cx - 74, seat + 18, 14, 164); ctx.fillRect(cx + 52, seat + 18, 14, 164);
  for (let k = 0; k < 3; k++) ctx.fillRect(cx - 80, seat - 240 + k * 60, 40, 10);
  if (ct > CAFE.boardDown) { ctx.save(); ctx.translate(cx - 150, FLOOR); ctx.rotate(-Math.PI / 2 + .25); board(110, 0, 0, .9); ctx.restore(); }
}
function cafeTable(ct, t, P) { // shared table, neighbour on her laptop, Enzi's laptop + cup
  const { cx, dx0, dTop } = DESK, nod = ct > CAFE.neighbourNod[0] && ct < CAFE.neighbourNod[1];
  person(dx0 + 400, FLOOR - 110, .62, { skin: '#6b4026', shirt: '#2B7A6E', hat: 'wrap', wrapCol: '#e8b830', talk: nod ? 1 : 0, gesture: nod ? .9 : 0 }, t);
  ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.moveTo(dx0 + 300, dTop - 2); ctx.lineTo(dx0 + 380, dTop - 2); ctx.lineTo(dx0 + 392, dTop - 90); ctx.lineTo(dx0 + 380, dTop - 92); ctx.closePath(); ctx.fill(); circ(dx0 + 384, dTop - 50, 8, C.orange);
  ctx.fillStyle = '#8a5a34'; ctx.fillRect(dx0, dTop, 460, 26); ctx.fillStyle = '#6b4530'; ctx.fillRect(dx0 + 20, dTop + 26, 22, 284); ctx.fillRect(dx0 + 420, dTop + 26, 22, 284); ctx.fillStyle = '#7a4e30'; ctx.fillRect(dx0 + 20, dTop + 26, 420, 150);
  const cupX = cx + 164; ell(cupX, dTop - 2, 40, 7, '#f3eee6');
  if (!P.item) { smallCup(cupX, dTop - 4, .9); if (ct < CAFE.sip.reach[0]) for (const k of [-1, 1]) { ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 4; ctx.beginPath(); for (let i = 0; i < 8; i++) { const yy = dTop - 52 - i * 8, xx = cupX + k * 8 + Math.sin(i + t * 6) * 4; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); } }
  drawLaptop(cx + 178, dTop - 2, 190, ease(win(ct, CAFE.lid[0], CAFE.lid[1])), Math.floor(win(ct, CAFE.type[0] + .05, CAFE.type[1]) * 4));
}
function cafePose(ct, t) {
  const P = basePose(), c = CAFE; P.onBoard = false; P.y = FLOOR; P.lean = 0;
  if ((t % 3.1) < .1) P.eyes = 'blink';
  if (ct < c.hop[0]) { const p = win(ct, c.walk[0], c.walk[1]), ph = ct * 9; P.x = lerp(130, 360, p); P.carry = ct < c.boardDown ? 1 : 0;
    P.fB = [Math.sin(ph) * 45 - 10, -Math.max(0, Math.cos(ph)) * 24]; P.fF = [-Math.sin(ph) * 45 + 10, -Math.max(0, -Math.cos(ph)) * 24]; P.hip = [0, -152 - Math.abs(Math.cos(ph)) * 8]; P.hB = [-40, -200];
    const wave = ct > c.wave[0] && ct < c.wave[1]; P.hF = wave ? [110, -370 + Math.sin(t * 16) * 22] : [30 + Math.sin(ph) * 40, -210]; P.mouth = wave ? 'grin' : 'smile'; P.look = wave ? -1 : 1; P.eyes = ct < c.cheer[1] && ct > c.cheer[0] + .2 && !wave ? 'happy' : P.eyes; }
  else if (ct < c.hop[1]) { const p = win(ct, c.hop[0], c.hop[1]); P.x = lerp(360, 420, ease(p)); P.y = FLOOR - 80 * Math.sin(Math.PI * p);
    P.hip = [0, lerp(-152, -182, p)]; P.fB = [lerp(-20, 75, p), lerp(0, -96, p)]; P.fF = [lerp(20, 92, p), lerp(0, -100, p)]; P.hB = [-120, -280]; P.hF = [120, -280]; P.mouth = 'grin'; P.eyes = 'happy'; }
  else {
    P.x = 420; P.hip = [0, -182]; const kick = Math.sin(t * 6) * 16 * win(ct, 3.4, 3.7) * (1 - win(ct, 4.6, 4.9));
    P.fB = [75 + kick, -96]; P.fF = [92 - kick, -100]; P.lean = .04; P.hB = [70, -250]; P.hF = [110, -262];
    if (ct < c.type[0]) { const p = ease(win(ct, c.reach[0], c.reach[1])), lift = ease(win(ct, c.lid[0], c.lid[1])); P.hF = [lerp(110, 250, p) - lift * 30, lerp(-262, -300, p) - lift * 60]; P.eyes = ct > c.reach[1] ? 'wide' : 'open'; P.brows = 1; P.mouth = ct > c.reach[1] ? 'o' : 'smile'; }
    else if (ct < c.sip.reach[0]) { P.hF = [200 + Math.abs(Math.sin(t * 22)) * 10, -300 - Math.abs(Math.sin(t * 22)) * 14]; P.hB = [170 + Math.abs(Math.sin(t * 19)) * 10, -296 - Math.abs(Math.cos(t * 19)) * 14]; P.brows = -1; }
    else {
      const reach = ease(win(ct, ...c.sip.reach)), lift = ease(win(ct, ...c.sip.lift)), down = ease(win(ct, ...c.sip.down)), cupDesk = [150, -300], mouthPt = [78, -345];
      let hx = lerp(110, cupDesk[0], reach), hy = lerp(-262, cupDesk[1], reach); hx = lerp(hx, mouthPt[0], lift - down); hy = lerp(hy, mouthPt[1], lift - down);
      P.hF = [hx, hy]; if (reach > .95 && down < .98) P.item = { tilt: (lift - down) * .8 };
      if (lift > .5 && down < .5) { P.eyes = 'closed'; P.blush = .9; P.mouth = 'sip'; P.heart = win(ct, ...c.heart); P.steam = 0; }
      if (ct > c.sip.down[1] - .1) { P.eyes = ct > c.wink[0] && ct < c.wink[1] ? 'wink' : 'happy'; P.mouth = 'grin'; P.blush = .6; P.hB = ct > c.wink[0] - .1 ? [-40, -400 + Math.sin(t * 12) * 10] : [70, -250]; }
    }
  }
  return P;
}
function renderCafe(T, ct, s) {
  SIP_BONUS_AT = s.start + CAFE.sip.lift[1];
  cafeInterior(ct, T); cafeChair(ct);
  const P = cafePose(ct, T); drawEnzi(P, T); cafeTable(ct, T, P);
  bubble(330, 830, CAFE.greet, win(ct, .5, .7) * (1 - win(ct, 1.5, 1.7)));
  bubble(560, 1000, CAFE.ahhTxt, win(ct, CAFE.ahh[0], CAFE.ahh[0] + .15) * (1 - win(ct, CAFE.ahh[1] - .2, CAFE.ahh[1])));
  hud(T);
  if (ct < CAFE.irisIn[1]) irisMask(160, FLOOR - 200, lerp(0, 1400, easeOut(win(ct, ...CAFE.irisIn))));
}
scene({
  id: 'cafe', dur: 4.5, kind: 'cafe', music: 'cafe',
  cues: [[.05, 'door'], [.2, 'cheer'], ...Array.from({ length: 9 }, (_, i) => [.5 + i * .06, 'blip', { sp: 'BARISTA' }]), [1.75, 'laptop'], ...Array.from({ length: 9 }, (_, i) => [2.25 + i * .07, 'type']), [3.45, 'sip'], [3.8, 'ahh']],
  render(T, lt, s) { renderCafe(T, lt, s); },
});
