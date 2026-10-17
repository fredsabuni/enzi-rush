// Characters & props: Enzi (pose-driven), people, boards, vehicles-as-props.

// ---------- boards ----------
function board(x, y, ang, s = 1) { // side-view skateboard; origin = ground under board centre
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  for (const wxp of [-92, 92]) {
    ctx.fillStyle = '#a9a39b'; ctx.beginPath(); ctx.moveTo(wxp - 22, -38); ctx.lineTo(wxp + 22, -38); ctx.lineTo(wxp + 9, -24); ctx.lineTo(wxp - 9, -24); ctx.fill();
    ctx.fillStyle = '#6e6862'; ctx.fillRect(wxp - 5, -28, 10, 9);
    circ(wxp, -17, 17, '#f6efe2'); circ(wxp, -17, 7, '#cdbda9'); ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(wxp, -17, 15, 0, 7); ctx.stroke();
  }
  ctx.fillStyle = C.orange; ctx.beginPath();
  ctx.moveTo(-120, -40); ctx.lineTo(120, -40); ctx.quadraticCurveTo(142, -40, 158, -66); ctx.lineTo(166, -61); ctx.quadraticCurveTo(150, -30, 120, -30); ctx.lineTo(-120, -30); ctx.quadraticCurveTo(-150, -30, -166, -61); ctx.lineTo(-158, -66); ctx.quadraticCurveTo(-142, -40, -120, -40); ctx.fill();
  ctx.fillStyle = '#f1dcb0'; ctx.fillRect(-120, -34.5, 240, 2.5);
  ctx.strokeStyle = '#211a1a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-157, -66); ctx.quadraticCurveTo(-142, -43, -120, -43); ctx.lineTo(120, -43); ctx.quadraticCurveTo(142, -43, 157, -66); ctx.stroke();
  ctx.restore();
}
function hoverboard(x, y, t, on = 1) { // y = deck top
  const g = ctx.createRadialGradient(x, FLOOR, 5, x, FLOOR, 240); g.addColorStop(0, `rgba(90,220,255,${.5 * on})`); g.addColorStop(1, 'rgba(90,220,255,0)'); ctx.fillStyle = g; ctx.fillRect(x - 260, FLOOR - 70, 520, 140);
  ctx.fillStyle = `rgba(120,230,255,${.16 * on})`; ctx.beginPath(); ctx.moveTo(x - 120, y + 30); ctx.lineTo(x + 120, y + 30); ctx.lineTo(x + 175, FLOOR); ctx.lineTo(x - 175, FLOOR); ctx.fill();
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#1c1c24'; rr(-165, 0, 330, 28, 14); ctx.fill();
  ctx.fillStyle = '#34343f'; rr(-160, 0, 320, 8, 4); ctx.fill();
  ctx.fillStyle = C.orangeL; ctx.fillRect(-150, 12, 300, 5);
  ctx.fillStyle = `rgba(120,235,255,${.95 * on})`; rr(-140, 26, 280, 8, 4); ctx.fill();
  for (const px of [-105, 105]) { ell(px, 34, 34, 9, `rgba(170,245,255,${on})`); for (let k = 0; k < 3; k++) { const ph = (t * 2 + k / 3) % 1; ell(px, 40 + ph * 50, 26 * (1 - ph), 5, `rgba(150,235,255,${(1 - ph) * .5 * on})`); } }
  ctx.restore();
}
function shoe(x, y, back) { ctx.save(); ctx.translate(x, y); ctx.fillStyle = back ? '#b84a10' : C.orangeL; rr(-16, -20, 54, 24, 12); ctx.fill(); ctx.fillStyle = '#fff'; rr(-18, 0, 58, 9, 4); ctx.fill(); line([[2, -12], [16, -14]], 3, 'rgba(255,255,255,.7)'); ctx.restore(); }

// ---------- laptop (3/4 view so the screen reads) ----------
function drawLaptop(x0, ly, lw, open, typed = 0) { // x0,ly = front-left of base on the surface
  ctx.fillStyle = '#8d939b'; ctx.beginPath(); ctx.moveTo(x0, ly); ctx.lineTo(x0 + lw, ly); ctx.lineTo(x0 + lw - lw * .12, ly - 16); ctx.lineTo(x0 + lw * .1, ly - 16); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#6f757d'; ctx.fillRect(x0, ly - 2, lw, 6);
  for (let k = 0; k < 7; k++) { ctx.fillStyle = 'rgba(40,40,50,.35)'; ctx.fillRect(x0 + lw * .16 + k * lw * .1, ly - 12, lw * .07, 4); }
  const sh = lw * .79 * open, hx0 = x0 + lw * .16, hw = lw * .77, lean = lw * .12 * open;
  if (open > .02) {
    const glow = ctx.createRadialGradient(hx0 + hw / 2, ly - 16 - sh / 2, 10, hx0 + hw / 2, ly - 16 - sh / 2, lw * 2); glow.addColorStop(0, `rgba(170,220,255,${.35 * open})`); glow.addColorStop(1, 'rgba(170,220,255,0)'); ctx.fillStyle = glow; ctx.fillRect(hx0 - lw * 2, ly - lw * 2.6, lw * 4.6, lw * 4);
    ctx.fillStyle = '#4a4f57'; ctx.beginPath(); ctx.moveTo(hx0 - 8, ly - 14); ctx.lineTo(hx0 + hw + 8, ly - 14); ctx.lineTo(hx0 + hw + 8 + lean, ly - 14 - sh); ctx.lineTo(hx0 - 8 + lean, ly - 14 - sh); ctx.closePath(); ctx.fill();
    if (open > .4) { const k = win(open, .4, 1); ctx.save(); ctx.beginPath(); ctx.moveTo(hx0, ly - 22); ctx.lineTo(hx0 + hw, ly - 22); ctx.lineTo(hx0 + hw + lean * .95, ly - 8 - sh); ctx.lineTo(hx0 + lean * .95, ly - 8 - sh); ctx.closePath(); ctx.clip();
      ctx.globalAlpha *= k; ctx.fillStyle = '#fbf3e4'; ctx.fillRect(hx0 - 10, ly - 30 - sh, hw + 60, sh + 20);
      ctx.fillStyle = C.orange; ctx.fillRect(hx0 - 10, ly - 10 - sh, hw + 60, sh * .2); circ(hx0 + lean + 18, ly + 5 - sh, sh * .06, '#fff');
      for (let i = 0; i < 5; i++) { if (i >= 2 + typed) break; ctx.fillStyle = i === 0 ? C.coffee : '#c9b9a6'; ctx.fillRect(hx0 + 14 + lean * (1 - (i + 1) / 6), ly - sh + sh * .27 + i * sh * .12, (i === 0 ? hw * .45 : hw * .65 - (i % 2) * hw * .2), sh * .05); }
      ctx.restore(); }
  } else circ(x0 + lw / 2, ly - 18, 8, C.orange);
}

// ---------- ENZI ----------
function basePose() {
  return { x: SX, y: GY, scale: 1, onBoard: true, boardAng: 0, carry: 0, hip: [-4, -178], lean: .08,
    fB: [-72, -52], fF: [60, -52], hB: [-120, -250], hF: [118, -246], eyes: 'open', eyeDX: 0, mouth: 'smile', talk: 0, brows: 0, glasses: 0, steam: 1, blush: .35, look: 1, jet: 0,
    item: null, phone: false, heart: 0, zzz: 0, squash: 1, kick: null, drag: 0, groundOff: 0, noShadow: false, beforeFront: null };
}
function drawEnzi(P, t) {
  ctx.save(); ctx.translate(P.x, P.y); ctx.scale(P.scale, P.scale);
  const lift = P.groundOff;
  if (!P.noShadow) ell(0, lift + 4, 150 * clamp(1 - lift / 700, .35, 1), 14, `rgba(40,20,10,${.25 * clamp(1 - lift / 700, .3, 1)})`);
  if (P.jet > 0) for (let i = 0; i < 22; i++) { const ph = (t * 3.2 + rnd(i)) % 1, px = (rnd(i + 4) - .5) * 120 - ph * 240, py = -10 + ph * 170; circ(px, py, 18 + ph * 42, `rgba(255,${235 - ph * 60},${200 - ph * 80},${(1 - ph) * .75 * P.jet})`); }
  if (P.onBoard) board(0, 0, P.boardAng);
  else if (P.kick !== null && !P.carry) { const p = P.kick, a = p < .35 ? -.6 * (p / .35) : -.6 - (p - .35) / .65 * .95, up = p < .35 ? 0 : easeOut((p - .35) / .65) * 250;
    ctx.save(); ctx.translate(-150 + (p < .35 ? 0 : (p - .35) / .65 * 140), -up); ctx.rotate(a); board(150, 0, 0); ctx.restore(); }
  const hip = P.hip, lean = P.lean, rot = (px, py) => [hip[0] + px * Math.cos(lean) - py * Math.sin(lean), hip[1] + px * Math.sin(lean) + py * Math.cos(lean)];
  const leg = (hx, fx, fy) => { let L = ik(hx, hip[1] + 4, fx, fy - 10, 84, 84, -1); if (L[1][0] < (hx + fx) / 2) L = ik(hx, hip[1] + 4, fx, fy - 10, 84, 84, 1); return L; };
  const LB = leg(hip[0] - 22, P.fB[0], P.fB[1]), LF = leg(hip[0] + 22, P.fF[0], P.fF[1]);
  const shB = rot(-74, -138), shF = rot(70, -138);
  const arm = (sh, h) => { let A = ik(sh[0], sh[1], h[0], h[1], 68, 68, 1); if (A[1][1] < (sh[1] + h[1]) / 2 - 2 && Math.abs(h[0] - sh[0]) > 20) A = ik(sh[0], sh[1], h[0], h[1], 68, 68, -1); return A; };
  const AB = arm(shB, P.hB), AF = arm(shF, P.hF);
  line(LB, 18, '#2c160c'); shoe(LB[2][0], LB[2][1] + 10, true);
  line(AB, 14, '#2c160c'); circ(AB[2][0], AB[2][1], 15, '#efe9df');
  if (P.carry) { ctx.save(); ctx.translate(AB[2][0] - 6, AB[2][1] + 90); ctx.rotate(-Math.PI / 2 + .15); board(0, 0, 0, .85); ctx.restore(); circ(AB[2][0], AB[2][1], 15, '#efe9df'); }
  // cup body
  ctx.save(); ctx.translate(hip[0], hip[1]); ctx.rotate(lean); ctx.scale(1 / P.squash, P.squash);
  const ch = 240, tw = 92, bw = 70;
  const g = ctx.createLinearGradient(-tw, 0, tw, 0); g.addColorStop(0, '#d9d2c7'); g.addColorStop(.3, '#fff'); g.addColorStop(.75, '#f7f2ea'); g.addColorStop(1, '#d4cbbe');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-bw, 0); ctx.lineTo(bw, 0); ctx.lineTo(tw, -ch); ctx.lineTo(-tw, -ch); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(80,50,30,.25)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.moveTo(-bw, 0); ctx.lineTo(bw, 0); ctx.lineTo(tw, -ch); ctx.lineTo(-tw, -ch); ctx.clip();
  ctx.fillStyle = C.coffee; ctx.fillRect(-tw, -76, tw * 2, 42); text('HARAKATI ZA', 0, -55, { size: 17, font: 'Nunito', weight: 900, color: C.goldL, ls: 3 });
  ctx.restore();
  ctx.save(); ctx.translate(-48, -160); ctx.rotate(Math.PI / 2); ctx.font = '800 46px Fraunces'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#5b2a17'; ctx.fillText('enzi', 0, 0); ctx.restore();
  const fx = 32, fy = -168;
  ell(fx - 24, fy + 30, 15, 9, `rgba(232,126,58,${P.blush})`); ell(fx + 50, fy + 30, 12, 9, `rgba(232,126,58,${P.blush})`);
  const eye = (ex0, kind) => { const ex = ex0 + P.eyeDX;
    if (kind === 'open' || kind === 'wide') { const r = kind === 'wide' ? 1.25 : 1; ell(ex, fy, 11 * r, 17 * r, '#24120a'); circ(ex + 3 * P.look, fy - 6, 4.5 * r, '#fff'); circ(ex - 3 * P.look, fy + 6, 2, 'rgba(255,255,255,.6)'); }
    else if (kind === 'blink') line([[ex - 10, fy], [ex + 10, fy]], 5, '#24120a');
    else if (kind === 'closed') { ctx.strokeStyle = '#24120a'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(ex, fy - 4, 10, .2, Math.PI - .2); ctx.stroke(); }
    else if (kind === 'happy') { ctx.strokeStyle = '#24120a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(ex, fy + 6, 11, Math.PI + .3, -.3); ctx.stroke(); } };
  if (P.eyes === 'wink') { eye(fx - 6, 'open'); eye(fx + 34, 'happy'); } else { eye(fx - 6, P.eyes); eye(fx + 34, P.eyes); }
  const by0 = fy - 32 - (P.brows > 0 ? 8 : 0);
  line([[fx - 18, by0 + (P.brows < 0 ? -4 : 2)], [fx + 4, by0 + (P.brows < 0 ? 4 : -2)]], 5, '#24120a');
  line([[fx + 24, by0 + (P.brows < 0 ? 4 : -2)], [fx + 46, by0 + (P.brows < 0 ? -4 : 2)]], 5, '#24120a');
  const mx = fx + 14, my = fy + 40;
  if (P.mouth === 'talk' || P.talk) { const m = Math.abs(Math.sin(t * 17)); ell(mx, my + 2, 14, 5 + m * 12, '#4a1a12'); ell(mx, my + 6 + m * 6, 8, 4, '#e0766a'); }
  else if (P.mouth === 'grin') { ctx.fillStyle = '#4a1a12'; ctx.beginPath(); ctx.moveTo(mx - 20, my - 4); ctx.quadraticCurveTo(mx, my + 30, mx + 20, my - 4); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(mx - 14, my - 3, 28, 6); ell(mx, my + 10, 7, 4, '#e0766a'); }
  else if (P.mouth === 'o') ell(mx, my + 4, 9, 12, '#4a1a12');
  else if (P.mouth === 'hmm') line([[mx - 12, my + 2], [mx + 10, my - 2]], 5, '#4a1a12');
  else if (P.mouth === 'sip') ell(mx + 10, my, 7, 5, '#4a1a12');
  else { ctx.strokeStyle = '#4a1a12'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(mx, my - 8, 15, .35, Math.PI - .35); ctx.stroke(); }
  if (P.glasses > 0) { ctx.save(); ctx.globalAlpha *= P.glasses; ctx.translate(0, (1 - P.glasses) * -60); ctx.fillStyle = '#16121c'; rr(fx - 26, fy - 16, 40, 28, 8); ctx.fill(); rr(fx + 18, fy - 16, 40, 28, 8); ctx.fill(); ctx.fillRect(fx + 10, fy - 10, 12, 6); ctx.fillRect(-tw + 6, fy - 10, fx - 26 + tw - 6, 5); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(fx - 20, fy - 10, 10, 5); ctx.fillRect(fx + 24, fy - 10, 10, 5); ctx.restore(); }
  ell(0, -ch, tw + 3, 16, '#efe9df'); ell(0, -ch, tw - 8, 11, '#c08a5c');
  ctx.fillStyle = '#f6e8d6'; ctx.beginPath(); { const hs = 9, hy = -ch; ctx.moveTo(0, hy + hs * .7); ctx.bezierCurveTo(-hs * 2, hy - hs * .3, -hs * .8, hy - hs * 1.3, 0, hy - hs * .4); ctx.bezierCurveTo(hs * .8, hy - hs * 1.3, hs * 2, hy - hs * .3, 0, hy + hs * .7); ctx.fill(); }
  if (P.steam > 0) { const amp = P.steam, drag = P.drag; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    for (const k of [-1, 0, 1]) { ctx.beginPath(); for (let i = 0; i <= 12; i++) { const yy = -ch - 20 - i * 6 * Math.min(amp, 1.6), xx = k * 26 + Math.sin(i * .7 + t * 7 + k) * 7 * Math.min(amp, 1.4) - i * i * .5 * drag; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); } }
  if (P.heart > 0) { const k = P.heart; ctx.save(); ctx.globalAlpha *= 1 - k * .3; ctx.translate(10, -ch - 70 - k * 90); ctx.scale(1 + k * .5, 1 + k * .5); ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 22); ctx.bezierCurveTo(-46, -8, -22, -40, 0, -16); ctx.bezierCurveTo(22, -40, 46, -8, 0, 22); ctx.stroke(); ctx.restore(); }
  ctx.restore();
  if (P.beforeFront) P.beforeFront();
  line(LF, 18, C.leg); shoe(LF[2][0], LF[2][1] + 10, false);
  if (P.item) { ctx.save(); ctx.translate(AF[2][0] + 14, AF[2][1] + 6); ctx.rotate(-P.item.tilt); smallCup(0, 0, .9); ctx.restore(); }
  if (P.phone) { ctx.save(); ctx.translate(AF[2][0] + 4, AF[2][1] - 4); ctx.rotate(-.15); ctx.fillStyle = '#16141c'; rr(-26, -76, 52, 96, 10); ctx.fill(); ctx.fillStyle = '#9ff0c0'; rr(-21, -68, 42, 78, 6); ctx.fill(); ctx.fillStyle = '#25a35a'; ctx.fillRect(-21, -68, 42, 14); ctx.restore(); }
  line(AF, 14, C.leg); circ(AF[2][0], AF[2][1], 16, '#fff');
  ctx.restore();
}

// ---------- people (face left by default) ----------
function head(x, y, s, o, t) {
  const { skin = '#6b4026', hat = 'none', beard = false, talk = 0, blink = (t % 2.7) < .1 } = o;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (hat === 'wrap') ell(6, -36, 52, 40, o.wrapCol || '#e8b830', -.2);
  circ(0, 0, 46, skin); circ(30, 4, 10, skin);
  ctx.fillStyle = '#1b1310';
  if (hat === 'none') { ctx.beginPath(); ctx.arc(0, -6, 48, Math.PI * 1.05, Math.PI * 1.95); ctx.fill(); }
  for (const ex of [-26, -6]) { if (blink) line([[ex - 6, -6], [ex + 6, -6]], 4, '#1b1310'); else { ell(ex, -6, 6, 8, '#1b1310'); circ(ex - 2, -9, 2.2, '#fff'); } }
  line([[-34, -22], [-20, -24]], 4, '#1b1310'); line([[-12, -24], [0, -22]], 4, '#1b1310');
  ell(-38, 6, 8, 6, 'rgba(0,0,0,.18)');
  const m = talk > 0 ? Math.abs(Math.sin(t * 17)) * talk : 0;
  if (beard) { ctx.fillStyle = '#d8d4cc'; ctx.beginPath(); ctx.arc(-6, 20, 34, .1, Math.PI - .05); ctx.fill(); }
  if (m > .15) { ell(-22, 24, 12, 4 + m * 10, '#4a1a12'); ell(-22, 28 + m * 4, 7, 3, '#d65a5a'); }
  else { ctx.strokeStyle = '#3a140c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-22, 14, 13, .3, Math.PI - .3); ctx.stroke(); }
  if (hat === 'kofia') { ctx.fillStyle = '#fbf7ee'; rr(-42, -62, 84, 34, [10, 10, 2, 2]); ctx.fill(); for (let k = 0; k < 6; k++) circ(-34 + k * 14, -46, 3.5, '#c9a36a'); }
  if (hat === 'helmet') { ctx.fillStyle = '#e8b830'; ctx.beginPath(); ctx.arc(2, -8, 54, Math.PI * 1.02, Math.PI * 2.02); ctx.fill(); ctx.fillStyle = 'rgba(40,40,60,.75)'; rr(-56, -20, 40, 16, 6); ctx.fill(); ctx.fillStyle = '#c0392b'; ctx.fillRect(-10, -60, 22, 52); }
  if (hat === 'wrap') { ctx.fillStyle = o.wrapCol || '#e8b830'; ctx.beginPath(); ctx.arc(4, -20, 48, Math.PI * 1.05, Math.PI * 2.0); ctx.fill(); for (let k = 0; k < 5; k++) circ(-20 + k * 14, -42 + (k % 2) * 8, 4, 'rgba(255,255,255,.4)'); }
  if (o.earring) circ(30, 20, 5, '#e8c27a');
  ctx.restore();
}
function person(x, y, s, o, t) { // y = feet
  const { skin = '#6b4026', shirt = '#2B7A6E', pants = '#2e2a40', robe = false, vest = false, apron = false, gesture = 0, talk = 0, bounce = 0, pattern = null, jj = 0 } = o;
  ctx.save(); ctx.translate(x, y - bounce); ctx.scale(s, s);
  const legSp = jj * 26;
  if (!robe) { line([[-10, -230], [-14 - legSp, -110], [-12 - legSp, -10]], 34, '#24203a'); line([[10, -230], [16 + legSp, -110], [12 + legSp, -10]], 34, pants); }
  for (const [fx, c] of [[-26 - legSp, '#222'], [2 + legSp, '#333']]) { ctx.fillStyle = c; rr(fx - 22, -16, 54, 20, 10); ctx.fill(); }
  const pump = jj ? Math.abs(Math.sin(t * 7)) : 0;
  const bArm = jj ? [[20, -400], [70, -440 - pump * 40], [60, -500 - pump * 70]] : [[20, -400], [34, -320], [28, -250]];
  line(bArm, 24, mixc(shirt, '#000000', .25)); circ(bArm[2][0], bArm[2][1], 14, skin);
  if (robe) { ctx.fillStyle = '#fbf7ee'; ctx.beginPath(); ctx.moveTo(-46, -420); ctx.lineTo(46, -420); ctx.lineTo(62, -14); ctx.lineTo(-62, -14); ctx.fill(); line([[-10, -400], [-10, -300]], 3, '#e2dccf'); }
  else { ctx.fillStyle = shirt; rr(-50, -430, 100, 210, 34); ctx.fill();
    if (pattern) { ctx.save(); rr(-50, -430, 100, 210, 34); ctx.clip(); for (let yy = -430; yy < -220; yy += 30) for (let xx = -50; xx < 50; xx += 30) { ctx.fillStyle = pattern; ctx.beginPath(); ctx.moveTo(xx + 15, yy); ctx.lineTo(xx + 27, yy + 15); ctx.lineTo(xx + 15, yy + 30); ctx.lineTo(xx + 3, yy + 15); ctx.fill(); } ctx.restore(); } }
  if (vest) { ctx.fillStyle = '#f39c12'; rr(-46, -420, 92, 170, 24); ctx.fill(); ctx.fillStyle = '#e8f0f0'; ctx.fillRect(-46, -330, 92, 14); ctx.fillRect(-46, -300, 92, 14); }
  if (apron) { ctx.fillStyle = C.coffee; rr(-44, -390, 88, 200, 16); ctx.fill(); text('e', 0, -330, { size: 40, font: 'Fraunces', weight: 800, color: C.goldL }); }
  let fArm;
  if (jj) fArm = [[-20, -400], [-70, -440 - pump * 40], [-60, -500 - pump * 70]];
  else { const g = gesture, wave = Math.sin(t * 9) * .35 * g, sx = -20, sy = -400, a1 = lerp(.15, 1.9, g) + wave * .4, a2 = a1 + lerp(.1, .8, g) + wave;
    const ex = sx - Math.sin(a1) * 90, ey = sy + Math.cos(a1) * 90; fArm = [[sx, sy], [ex, ey], [ex - Math.sin(a2) * 80, ey + Math.cos(a2) * 80]]; }
  line(fArm, 24, robe ? '#fbf7ee' : vest ? '#f39c12' : shirt); circ(fArm[2][0], fArm[2][1], 15, skin);
  if (o.holding === 'flyer') { ctx.save(); ctx.translate(fArm[2][0], fArm[2][1]); ctx.rotate(-.2); ctx.fillStyle = '#fff'; ctx.fillRect(-50, -80, 70, 92); ctx.fillStyle = C.orange; ctx.fillRect(-46, -74, 62, 26); text('AEROBICS', -15, -61, { size: 11 }); ctx.fillStyle = '#ccc'; ctx.fillRect(-44, -40, 54, 6); ctx.fillRect(-44, -28, 44, 6); ctx.fillRect(-44, -16, 50, 6); ctx.restore(); }
  head(0, -490, 1, { ...o, talk }, t);
  ctx.restore();
}
function walker(x, y, s, t, seed, dir) { // small background pedestrian
  const sw = Math.sin(t * 6 + seed) * .5;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
  const skin = ['#6b4026', '#8a5434', '#4e2c1a'][seed % 3], top = ['#d6604f', '#2B7A6E', '#e8b830', '#7fb5d5', '#9a6fb0', '#fff'][seed % 6];
  line([[0, -110], [Math.sin(sw) * 45, -50], [Math.sin(sw) * 45 + 10, 0]], 18, '#2e2a40');
  line([[0, -110], [-Math.sin(sw) * 45, -50], [-Math.sin(sw) * 45 + 10, 0]], 18, '#3a3550');
  rr(-28, -230, 56, 130, 22); ctx.fillStyle = top; ctx.fill();
  line([[0, -210], [-Math.sin(sw) * 40, -150], [-Math.sin(sw) * 50 + 6, -110]], 14, skin);
  circ(4, -262, 30, skin);
  if (seed % 4 === 0) ell(0, -284, 34, 22, ['#e8b830', '#d6604f', '#2B7A6E'][seed % 3]);
  else { ctx.fillStyle = '#1b1310'; ctx.beginPath(); ctx.arc(2, -270, 31, Math.PI, 0); ctx.fill(); }
  if (seed % 5 === 1) { ctx.fillStyle = '#e8b830'; rr(-24, -330, 48, 36, 6); ctx.fill(); }
  ctx.restore();
}
function motorbike(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  circ(-110, -45, 45, '#222'); circ(-110, -45, 20, '#999'); circ(115, -45, 45, '#222'); circ(115, -45, 20, '#999');
  ctx.fillStyle = '#c0392b'; rr(-90, -130, 170, 50, 22); ctx.fill(); ctx.fillStyle = '#222'; rr(-110, -150, 120, 26, 12); ctx.fill();
  line([[80, -110], [115, -45]], 12, '#555'); line([[70, -150], [100, -185], [130, -180]], 10, '#333'); circ(118, -150, 14, '#fff3c4');
  ctx.fillStyle = '#e8b830'; rr(-170, -175, 70, 32, 6); ctx.fill(); text('BODA', -135, -158, { size: 20, color: C.coffee });
  ctx.restore();
}
function madafuCart(x, y) {
  ctx.fillStyle = '#9a6a3a'; ctx.fillRect(x - 130, y - 140, 260, 70); ctx.fillStyle = '#7a4a28'; ctx.fillRect(x - 130, y - 76, 260, 10);
  circ(x - 70, y - 40, 40, '#5b3c26'); circ(x - 70, y - 40, 14, '#3a2414'); line([[x + 130, y - 110], [x + 210, y - 90]], 10, '#7a4a28');
  for (let k = 0; k < 11; k++) circ(x - 105 + (k % 6) * 42 + (k > 5 ? 20 : 0), y - 160 - (k > 5 ? 36 : 0), 26, k % 3 ? '#5e9a34' : '#4f8a2a');
  ctx.fillStyle = '#fff'; rr(x - 70, y - 270, 140, 44, 8); ctx.fill(); text('MADAFU', x, y - 247, { size: 30, color: '#3f7a2a' });
  line([[x - 60, y - 226], [x - 60, y - 196]], 5, '#7a4a28'); line([[x + 60, y - 226], [x + 60, y - 196]], 5, '#7a4a28');
}
function busStop(x, y, t) {
  ctx.fillStyle = '#3b4a5a'; ctx.fillRect(x - 170, y - 330, 12, 330); ctx.fillRect(x + 158, y - 330, 12, 330);
  ctx.fillStyle = C.teal; rr(x - 190, y - 360, 380, 44, 10); ctx.fill(); text('KITUO · VICTORIA', x, y - 337, { size: 28 });
  ctx.fillStyle = 'rgba(180,220,230,.35)'; ctx.fillRect(x - 158, y - 316, 316, 200);
  for (let k = 0; k < 3; k++) walker(x - 100 + k * 100, y, .62, (Math.sin(t * 6 + k) > .6 ? .2 : 0), 10 + k * 7, -1);
}
