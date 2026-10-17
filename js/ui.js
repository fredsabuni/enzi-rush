// Game UI: HUD, route map, zone banners, dialogue box, pops, bubbles.
const ZONES = [['KARIAKOO', 'Sokoni · the market'], ['POSTA', 'Mjini · downtown'], ['COCO BEACH', 'Baharini · by the sea'], ['VICTORIA', 'Mtaani · the buzz']];
const ROUTE_LABELS = ['KARIAKOO', 'POSTA', 'COCO', 'VICTORIA', 'ENZI'], ROUTE_X = [130, 330, 540, 750, 950];
const HUD_BEAN = [W - 300, 205];
let SIP_BONUS_AT = 1e9; // set by the café scene
function beansArrived(t) { let n = 0; for (const bt of BEAN_T) if (bt + .38 <= t) n++; return n; }
function hud(t) {
  const done = SC('complete') ? SC('complete').start : TOTAL;
  const a = win(t, JOURNEY[0] - .1, JOURNEY[0] + .3) * (1 - win(t, done - .2, done + .1)); if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(30,20,40,.5)'; rr(40, 64, 92, 92, 22); ctx.fill(); ctx.fillStyle = '#fff'; rr(66, 88, 13, 44, 4); ctx.fill(); rr(92, 88, 13, 44, 4); ctx.fill();
  const nb = beansArrived(t), score = Math.floor(X(Math.min(t, A_STOP)) / 4) + nb * 50 + (t > SIP_BONUS_AT ? 1000 : 0);
  text(String(score).padStart(6, '0'), W - 44, 108, { size: 96, align: 'right', sw: 16, shadow: 8 });
  ctx.fillStyle = 'rgba(30,20,40,.5)'; rr(W - 340, 168, 296, 78, 39); ctx.fill(); bean(HUD_BEAN[0], HUD_BEAN[1], 28, 0);
  let pulse = 0; for (const bt of BEAN_T) { const d = t - bt - .38; if (d >= 0 && d < .12) pulse = 1 - d / .12; }
  text(String(nb), W - 70, 208, { size: 62 + pulse * 10, align: 'right', sw: 10, color: pulse > 0 ? '#ffe6a3' : '#fff' });
  if (t < JOURNEY[1]) {
    const prog = clamp(X(Math.min(t, A_STOP)) / X_END, 0, 1), nodeAt = [0, ZB[0] / X_END, ZB[1] / X_END, ZB[2] / X_END, 1];
    const toX = p => { for (let i = 1; i < 5; i++) if (p <= nodeAt[i]) return lerp(ROUTE_X[i - 1], ROUTE_X[i], (p - nodeAt[i - 1]) / (nodeAt[i] - nodeAt[i - 1])); return ROUTE_X[4]; };
    const ry = 300; ctx.fillStyle = 'rgba(30,20,40,.5)'; rr(70, ry - 52, 940, 128, 40); ctx.fill();
    line([[ROUTE_X[0], ry], [ROUTE_X[4], ry]], 12, 'rgba(255,255,255,.35)'); line([[ROUTE_X[0], ry], [toX(prog), ry]], 12, C.orangeL);
    ROUTE_X.forEach((x, i) => { const dn = prog >= nodeAt[i] - .001; circ(x, ry, i === 4 ? 22 : 16, dn ? C.orangeL : '#7a6a80'); ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.stroke(); text(ROUTE_LABELS[i], x, ry + 46, { size: 24, color: dn ? '#fff' : 'rgba(255,255,255,.65)', sw: 5 }); });
    for (const k in NPC) { const n = NPC[k], mx = toX(n.x / X_END); circ(mx, ry - 2, 9, t > n.stop.start ? C.goldL : 'rgba(255,255,255,.5)'); }
    const mx = toX(prog), my = ry - 32 + Math.sin(t * 10) * 2; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(mx - 13, my + 16); ctx.lineTo(mx + 13, my + 16); ctx.lineTo(mx + 17, my - 18); ctx.lineTo(mx - 17, my - 18); ctx.fill(); ctx.fillStyle = C.coffee; ctx.fillRect(mx - 15, my + 2, 30, 6); ell(mx, my - 18, 17, 4, '#c08a5c');
  }
  if (t > RUSH[0] - .1 && t < RUSH[1] + .3) { const rem = 1 - win(t, RUSH[0], RUSH[1]); circ(92, 450, 44, C.teal); ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.stroke(); text('N', 92, 452, { size: 52 });
    ctx.fillStyle = 'rgba(30,20,40,.55)'; rr(146, 432, 260, 36, 18); ctx.fill(); ctx.fillStyle = C.goldL; rr(152, 438, 248 * rem, 24, 12); ctx.fill(); text('NGUVU', 150, 408, { size: 30, align: 'left', sw: 7 }); }
  ctx.restore();
}
function zoneBanner(t) {
  for (const [t0, i] of ZBANNERS) { const k = t - t0; if (k < 0 || k > 1.9) continue;
    const x = lerp(-700, 60, backOut(win(k, 0, .35))) - easeIn(win(k, 1.5, 1.9)) * 900;
    ctx.save(); ctx.translate(x, 400);
    ctx.fillStyle = 'rgba(20,10,20,.3)'; rr(6, 10, 660, 130, 30); ctx.fill(); ctx.fillStyle = C.coffee; rr(0, 0, 660, 130, 30); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.gold; ctx.stroke();
    ctx.fillStyle = C.orangeL; ctx.beginPath(); ctx.arc(65, 52, 26, Math.PI, 0); ctx.lineTo(65, 100); ctx.closePath(); ctx.fill(); circ(65, 52, 10, C.coffee);
    text(`${i + 1}/4  ` + ZONES[i][0], 115, 50, { size: 54, align: 'left' }); text(ZONES[i][1], 117, 100, { size: 32, align: 'left', font: 'Nunito', weight: 800, color: C.goldL });
    ctx.restore(); }
}
function enziPortrait(x, y, t) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x - 54, y + 130); ctx.lineTo(x + 54, y + 130); ctx.lineTo(x + 70, y - 45); ctx.lineTo(x - 70, y - 45); ctx.fill(); ell(x, y - 45, 70, 14, '#c08a5c'); ell(x - 16, y + 10, 10, 15, '#24120a'); ell(x + 24, y + 10, 10, 15, '#24120a'); circ(x - 13, y + 5, 3.5, '#fff'); circ(x + 27, y + 5, 3.5, '#fff'); const m = Math.abs(Math.sin(t * 17)); ell(x + 4, y + 52, 12, 4 + m * 10, '#4a1a12'); ell(x - 28, y + 35, 12, 7, 'rgba(232,126,58,.4)'); }
function dialogBox(t) {
  let cur = null; for (const d of DIALOG) if (t >= d[0] - .05 && t < d[1]) cur = d;
  let st = null; for (const s of STOPS) if (t >= s.start + .05 && t < s.end) st = s; if (!st) return;
  const inP = backOut(win(t, st.start + .05, st.start + .3)), out = easeIn(win(t, st.end - .2, st.end));
  const y = lerp(H + 50, 1600, inP) + out * 400, bw = 1000, bh = 270, x = (W - bw) / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(20,10,20,.35)'; rr(x + 8, y + 12, bw, bh, 36); ctx.fill(); ctx.fillStyle = C.cream; rr(x, y, bw, bh, 36); ctx.fill(); ctx.lineWidth = 9; ctx.strokeStyle = C.coffee; ctx.stroke();
  if (cur) {
    const [t0, , sp, sw, en] = cur, isEnzi = sp === 'ENZI';
    ctx.save(); ctx.beginPath(); ctx.arc(x + 120, y + 140, 86, 0, 7); ctx.fillStyle = isEnzi ? C.orange : C.teal; ctx.fill(); ctx.clip();
    if (isEnzi) enziPortrait(x + 120, y + 140, t); else head(x + 132, y + 170, 1.3, { ...st.s.portrait, talk: 1 }, t);
    ctx.restore(); ctx.lineWidth = 7; ctx.strokeStyle = C.coffee; ctx.beginPath(); ctx.arc(x + 120, y + 140, 86, 0, 7); ctx.stroke();
    ctx.font = '40px Lilita'; const nw = ctx.measureText(sp).width + 44;
    ctx.fillStyle = isEnzi ? C.orange : C.teal; rr(x + 230, y - 30, nw, 60, 20); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.coffee; ctx.stroke(); text(sp, x + 252, y + 2, { size: 40, align: 'left' });
    const n = Math.floor(clamp((t - t0 - .08) * 42, 0, sw.length)), shown = sw.slice(0, n);
    ctx.font = '900 50px Nunito'; let lines = [shown];
    if (ctx.measureText(sw).width > 700) { const words = sw.split(' '); let l1 = '', i = 0; while (i < words.length && ctx.measureText(l1 + words[i]).width < 700) l1 += words[i++] + ' '; lines = [shown.slice(0, l1.length), shown.slice(l1.length)]; }
    lines.forEach((l, i) => text(l, x + 235, y + 82 + i * 58, { size: 50, align: 'left', font: 'Nunito', weight: 900, color: C.coffee }));
    const ea = win(t, t0 + .25, t0 + .5); ctx.globalAlpha = ea; text(en, x + 235, y + bh - 46, { size: 34, align: 'left', font: 'Nunito', weight: 700, italic: 'italic', color: '#8a6a55' }); ctx.globalAlpha = 1;
    if (ea > .9 && Math.floor(t * 4) % 2) { ctx.fillStyle = C.orange; ctx.beginPath(); ctx.moveTo(x + bw - 70, y + bh - 50); ctx.lineTo(x + bw - 40, y + bh - 50); ctx.lineTo(x + bw - 55, y + bh - 32); ctx.fill(); }
  }
  ctx.restore();
}
function speakerMarker(t) {
  for (const [a, b, sp] of DIALOG) { if (t < a || t >= b) continue;
    let x, y; if (sp === 'ENZI') { const P = streetPose(t); x = P.x; y = P.y - 600; } else { const st = STOPS.find(s => t >= s.start && t < s.end); x = wx(NPC[st.npc].x) - 10; y = NPCY - 560; }
    y += Math.sin(t * 8) * 8; ctx.fillStyle = C.goldL; ctx.beginPath(); ctx.moveTo(x - 22, y - 26); ctx.lineTo(x + 22, y - 26); ctx.lineTo(x, y); ctx.closePath(); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.coffee; ctx.stroke(); }
}
function bubble(x, y, str, a) { if (a <= 0) return; ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); const s = backOut(clamp(a, 0, 1)); ctx.scale(s, s);
  ctx.font = '900 44px Nunito'; const w = ctx.measureText(str).width + 60; ctx.fillStyle = '#fff'; rr(-w / 2, -50, w, 96, 40); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.coffee; ctx.stroke();
  const tx = -w / 2 + 60; ctx.beginPath(); ctx.moveTo(tx - 16, 44); ctx.lineTo(tx - 24, 84); ctx.lineTo(tx + 18, 44); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); ctx.fillRect(tx - 18, 36, 40, 12);
  text(str, 0, -2, { size: 44, font: 'Nunito', weight: 900, color: C.coffee }); ctx.restore(); }
function bigPop(t, t0, label, sub, col, y0 = 820) { const k = t - t0; if (k < 0 || k > 1.3) return; const sc = backOut(win(k, 0, .3)), a = 1 - win(k, 1, 1.3);
  ctx.save(); ctx.globalAlpha = a; ctx.translate(CX, y0 - k * 30); ctx.scale(sc, sc); ctx.rotate(-.05); text(label, 0, 0, { size: 128, color: col, sw: 24, stroke: C.coffee, shadow: 12 }); if (sub) text(sub, 0, 96, { size: 52, sw: 12, stroke: C.coffee }); ctx.restore(); }
