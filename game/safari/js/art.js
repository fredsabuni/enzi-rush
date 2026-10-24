// Art: drawing helpers + the whole cast (skaters, customers, hazards, pickups).
// Everything is drawn in code; `ctx` is whichever canvas is active (useCtx).
let ctx;
function useCtx(c) { ctx = c; }

const C = { brown: '#4a2414', coffee: '#291810', orange: '#C4510E', orangeL: '#E87E3A', gold: '#D4A559', goldL: '#E8C27A', cream: '#FFFBF5', creamD: '#F5EFE6', ink: '#1e1530', teal: '#2B7A6E', red: '#B83528', leg: '#3a1d10' };

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, p) => a + (b - a) * p;
const ease = p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
const easeOut = p => 1 - Math.pow(1 - p, 3);
const easeIn = p => p * p * p;
const backOut = p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
const win = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const bump = (t, a, b) => Math.sin(Math.PI * win(t, a, b));
function rnd(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function mixc(a, b, p) { const pa = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16)); return 'rgb(' + pa.map((v, i) => Math.round(lerp(v, pb[i], p))).join(',') + ')'; }

function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function text(str, x, y, { size = 60, font = 'Lilita', color = '#fff', stroke = C.ink, sw = 0, align = 'center', base = 'middle', weight = '', shadow = 0, ls = 0, italic = '' } = {}) {
  ctx.font = `${italic} ${weight} ${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = base; ctx.letterSpacing = ls + 'px';
  if (shadow) { ctx.fillStyle = 'rgba(20,10,30,.4)'; ctx.fillText(str, x, y + shadow); }
  if (sw) { ctx.lineJoin = 'round'; ctx.lineWidth = sw; ctx.strokeStyle = stroke; ctx.strokeText(str, x, y); }
  ctx.fillStyle = color; ctx.fillText(str, x, y); ctx.letterSpacing = '0px';
}
function line(pts, w, col) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); }
function circ(x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, Math.max(.1, r), 0, 7); ctx.fill(); }
function ell(x, y, rx, ry, col, rot = 0) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, 7); ctx.fill(); }
// two-bone IK; returns [root, joint, end]; bend = +1/-1 picks the elbow/knee side
function ik(ax, ay, bx, by, L1, L2, bend) {
  const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy), dd = clamp(d, 1, L1 + L2 - .5);
  const a = Math.atan2(dy, dx), k = Math.acos(clamp((L1 * L1 + dd * dd - L2 * L2) / (2 * L1 * dd), -1, 1));
  const ang = a + bend * k; return [[ax, ay], [ax + Math.cos(ang) * L1, ay + Math.sin(ang) * L1], [ax + Math.cos(a) * dd, ay + Math.sin(a) * dd]];
}

// ---------- pickups ----------
function bean(x, y, r, spin, alpha = 1, gold = false) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.scale(Math.max(.2, Math.abs(Math.cos(spin))), 1); ctx.rotate(.5);
  if (gold) { const gl = ctx.createRadialGradient(0, 0, r * .5, 0, 0, r * 2.2); gl.addColorStop(0, 'rgba(255,230,140,.7)'); gl.addColorStop(1, 'rgba(255,230,140,0)'); ctx.fillStyle = gl; ctx.fillRect(-r * 2.2, -r * 2.2, r * 4.4, r * 4.4); }
  const g = ctx.createRadialGradient(-r * .3, -r * .4, r * .1, 0, 0, r * 1.3);
  if (gold) { g.addColorStop(0, '#fff3b8'); g.addColorStop(.6, '#e8b830'); g.addColorStop(1, '#a8740c'); } else { g.addColorStop(0, '#c9874f'); g.addColorStop(.6, '#7a3f1d'); g.addColorStop(1, '#3e1e0e'); }
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, r * .78, r, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = gold ? '#8a5a08' : '#2a120a'; ctx.lineWidth = r * .16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -r * .8); ctx.bezierCurveTo(r * .35, -r * .3, -r * .35, r * .3, 0, r * .8); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,230,190,.55)'; ctx.lineWidth = r * .12; ctx.beginPath(); ctx.ellipse(-r * .3, -r * .35, r * .18, r * .35, .3, 0, 7); ctx.stroke();
  ctx.restore();
}
function smallCup(x, y, s, sleeve = C.orange) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-26, -40); ctx.lineTo(26, -40); ctx.quadraticCurveTo(26, 0, 0, 0); ctx.quadraticCurveTo(-26, 0, -26, -40); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(28, -24, 10, -1.4, 1.4); ctx.stroke(); ell(0, -40, 26, 6, '#a86e42'); ell(0, -40, 8, 3, '#f3e2cc');
  ctx.fillStyle = sleeve; ctx.fillRect(-26, -24, 52, 6); ctx.restore();
}
function takeawayCup(x, y, s) { // HZE to-go cup (what you deliver)
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-30, -110); ctx.lineTo(30, -110); ctx.lineTo(22, 0); ctx.lineTo(-22, 0); ctx.fill();
  ctx.fillStyle = C.coffee; ctx.beginPath(); ctx.moveTo(-28, -78); ctx.lineTo(28, -78); ctx.lineTo(25, -36); ctx.lineTo(-25, -36); ctx.fill();
  text('e', 0, -57, { size: 34, font: 'Fraunces', weight: 800, color: C.goldL });
  ctx.fillStyle = C.orange; rr(-36, -126, 72, 18, 6); ctx.fill(); ctx.fillStyle = C.orangeL; rr(-28, -136, 56, 12, 5); ctx.fill();
  ctx.restore();
}
function espresso(x, y, s, t) { // NGUVU power-up
  ctx.save(); ctx.translate(x, y + Math.sin(t * 4) * 8); ctx.scale(s, s);
  const g = ctx.createRadialGradient(0, -30, 10, 0, -30, 110); g.addColorStop(0, 'rgba(255,200,90,.75)'); g.addColorStop(1, 'rgba(255,200,90,0)'); ctx.fillStyle = g; ctx.fillRect(-110, -140, 220, 220);
  for (let k = 0; k < 8; k++) { const a = t * 1.5 + k * .785; line([[Math.cos(a) * 62, -30 + Math.sin(a) * 62], [Math.cos(a) * 86, -30 + Math.sin(a) * 86]], 6, 'rgba(255,240,180,.8)'); }
  ell(0, 6, 54, 12, '#f2e8da'); ctx.fillStyle = '#fff'; rr(-36, -56, 72, 60, [6, 6, 26, 26]); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(40, -30, 13, -1.3, 1.3); ctx.stroke();
  ctx.fillStyle = C.teal; rr(-36, -40, 72, 16, 2); ctx.fill(); ell(0, -56, 36, 8, '#6b3a1a');
  ctx.fillStyle = C.goldL; ctx.beginPath(); ctx.moveTo(6, -120); ctx.lineTo(-18, -78); ctx.lineTo(0, -78); ctx.lineTo(-8, -50); ctx.lineTo(20, -94); ctx.lineTo(2, -94); ctx.closePath(); ctx.fill(); ctx.strokeStyle = C.coffee; ctx.lineWidth = 4; ctx.stroke();
  ctx.restore();
}

// ---------- boards ----------
function board(x, y, ang, s = 1, deck = C.orange) { // side-view skateboard; origin = ground under board centre
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  for (const wxp of [-92, 92]) {
    ctx.fillStyle = '#a9a39b'; ctx.beginPath(); ctx.moveTo(wxp - 22, -38); ctx.lineTo(wxp + 22, -38); ctx.lineTo(wxp + 9, -24); ctx.lineTo(wxp - 9, -24); ctx.fill();
    ctx.fillStyle = '#6e6862'; ctx.fillRect(wxp - 5, -28, 10, 9);
    circ(wxp, -17, 17, '#f6efe2'); circ(wxp, -17, 7, '#cdbda9'); ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(wxp, -17, 15, 0, 7); ctx.stroke();
  }
  ctx.fillStyle = deck; ctx.beginPath();
  ctx.moveTo(-120, -40); ctx.lineTo(120, -40); ctx.quadraticCurveTo(142, -40, 158, -66); ctx.lineTo(166, -61); ctx.quadraticCurveTo(150, -30, 120, -30); ctx.lineTo(-120, -30); ctx.quadraticCurveTo(-150, -30, -166, -61); ctx.lineTo(-158, -66); ctx.quadraticCurveTo(-142, -40, -120, -40); ctx.fill();
  ctx.fillStyle = '#f1dcb0'; ctx.fillRect(-120, -34.5, 240, 2.5);
  ctx.strokeStyle = '#211a1a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-157, -66); ctx.quadraticCurveTo(-142, -43, -120, -43); ctx.lineTo(120, -43); ctx.quadraticCurveTo(142, -43, 157, -66); ctx.stroke();
  ctx.restore();
}
function shoe(x, y, col, back) { ctx.save(); ctx.translate(x, y); ctx.fillStyle = back ? mixc(col, '#000000', .25) : col; rr(-16, -20, 54, 24, 12); ctx.fill(); ctx.fillStyle = '#fff'; rr(-18, 0, 58, 9, 4); ctx.fill(); line([[2, -12], [16, -14]], 3, 'rgba(255,255,255,.7)'); ctx.restore(); }

// ---------- THE CREW (playable skaters) ----------
const CREW = {
  enzi: { name: 'Enzi', tag: 'Kikombe cha Moto', en: 'The hot cup', bio: 'The HZE mascot himself. A walking cup of harakati — he never cools down.', body: 'cup', deck: C.orange, shoe: C.orangeL, accent: C.orange },
  zuri: { name: 'Zuri', tag: 'Barista wa Kasi', en: 'The speed barista', bio: 'Fastest pour in Victoria. Afro puffs, kanga headband, zero brakes.', body: 'human', skin: '#6b4026', hair: 'puffs', band: '#E87E3A', shirt: '#FFFBF5', apron: true, pants: '#2B7A6E', shoe: '#E87E3A', deck: C.teal, accent: C.teal },
  jabali: { name: 'Jabali', tag: 'Mfalme wa Kariakoo', en: 'King of the market', bio: 'Knows every shortcut in Kariakoo. Kitenge drip, headphones on, never spills a drop.', body: 'human', skin: '#4e2c1a', hair: 'bucket', hat: '#e8b830', hatPat: '#d6604f', shirt: '#2a7ab8', pattern: '#e8b830', pants: '#3a3550', shoe: '#f4ede0', deck: C.gold, phones: true, beard: true, accent: '#2a7ab8' },
};

function basePose() {
  return { x: 0, y: 0, scale: 1, onBoard: true, boardAng: 0, boardFlip: 0, hip: [-4, -178], lean: .08,
    fB: [-72, -52], fF: [60, -52], hB: [-120, -250], hF: [118, -246], eyes: 'open', mouth: 'smile', talk: 0, brows: 0, glasses: 0, steam: 1, blush: .35, look: 1, jet: 0, drag: 0, groundOff: 0, noShadow: false, item: null };
}
// face centred on (cx, cy); k = size
function face(cx, cy, k, P, t) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
  ell(-38, 30, 15, 9, `rgba(232,126,58,${P.blush})`); ell(38, 30, 12, 9, `rgba(232,126,58,${P.blush})`);
  const eye = (ex, kind) => {
    if (kind === 'open' || kind === 'wide') { const r = kind === 'wide' ? 1.25 : 1; ell(ex, 0, 11 * r, 17 * r, '#24120a'); circ(ex + 3 * P.look, -6, 4.5 * r, '#fff'); circ(ex - 3 * P.look, 6, 2, 'rgba(255,255,255,.6)'); }
    else if (kind === 'blink') line([[ex - 10, 0], [ex + 10, 0]], 5, '#24120a');
    else if (kind === 'closed') { ctx.strokeStyle = '#24120a'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(ex, -4, 10, .2, Math.PI - .2); ctx.stroke(); }
    else if (kind === 'happy') { ctx.strokeStyle = '#24120a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(ex, 6, 11, Math.PI + .3, -.3); ctx.stroke(); }
    else if (kind === 'dizzy') { line([[ex - 9, -9], [ex + 9, 9]], 5, '#24120a'); line([[ex + 9, -9], [ex - 9, 9]], 5, '#24120a'); }
  };
  if (P.eyes === 'wink') { eye(-20, 'open'); eye(20, 'happy'); } else { eye(-20, P.eyes); eye(20, P.eyes); }
  const by0 = -32 - (P.brows > 0 ? 8 : 0);
  line([[-32, by0 + (P.brows < 0 ? -4 : 2)], [-10, by0 + (P.brows < 0 ? 4 : -2)]], 5, '#24120a');
  line([[10, by0 + (P.brows < 0 ? 4 : -2)], [32, by0 + (P.brows < 0 ? -4 : 2)]], 5, '#24120a');
  const my = 40;
  if (P.mouth === 'talk' || P.talk) { const m = Math.abs(Math.sin(t * 17)); ell(0, my + 2, 14, 5 + m * 12, '#4a1a12'); ell(0, my + 6 + m * 6, 8, 4, '#e0766a'); }
  else if (P.mouth === 'grin') { ctx.fillStyle = '#4a1a12'; ctx.beginPath(); ctx.moveTo(-20, my - 4); ctx.quadraticCurveTo(0, my + 30, 20, my - 4); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(-14, my - 3, 28, 6); ell(0, my + 10, 7, 4, '#e0766a'); }
  else if (P.mouth === 'o') ell(0, my + 4, 9, 12, '#4a1a12');
  else if (P.mouth === 'hmm') line([[-12, my + 2], [10, my - 2]], 5, '#4a1a12');
  else if (P.mouth === 'ouch') { ctx.strokeStyle = '#4a1a12'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-16, my + 4); for (let i = 1; i <= 4; i++) ctx.lineTo(-16 + i * 8, my + (i % 2 ? -4 : 4)); ctx.stroke(); }
  else { ctx.strokeStyle = '#4a1a12'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, my - 8, 15, .35, Math.PI - .35); ctx.stroke(); }
  if (P.glasses > 0) { ctx.save(); ctx.globalAlpha *= P.glasses; ctx.fillStyle = '#16121c'; rr(-40, -16, 40, 28, 8); ctx.fill(); rr(4, -16, 40, 28, 8); ctx.fill(); ctx.fillRect(-4, -10, 12, 6); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-34, -10, 10, 5); ctx.fillRect(10, -10, 10, 5); ctx.restore(); }
  ctx.restore();
}
function steamWisps(y0, amp, drag, t, spread = 26) {
  ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 8; ctx.lineCap = 'round';
  for (const k of [-1, 0, 1]) { ctx.beginPath(); for (let i = 0; i <= 12; i++) { const yy = y0 - 20 - i * 6 * Math.min(amp, 1.6), xx = k * spread + Math.sin(i * .7 + t * 7 + k) * 7 * Math.min(amp, 1.4) - i * i * .5 * drag; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); }
}
function cupBody(P, t) {
  const ch = 240, tw = 92, bw = 70;
  const g = ctx.createLinearGradient(-tw, 0, tw, 0); g.addColorStop(0, '#d9d2c7'); g.addColorStop(.3, '#fff'); g.addColorStop(.75, '#f7f2ea'); g.addColorStop(1, '#d4cbbe');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-bw, 0); ctx.lineTo(bw, 0); ctx.lineTo(tw, -ch); ctx.lineTo(-tw, -ch); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(80,50,30,.25)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.moveTo(-bw, 0); ctx.lineTo(bw, 0); ctx.lineTo(tw, -ch); ctx.lineTo(-tw, -ch); ctx.clip();
  ctx.fillStyle = C.coffee; ctx.fillRect(-tw, -76, tw * 2, 42); text('HARAKATI ZA', 0, -55, { size: 17, font: 'Nunito', weight: 900, color: C.goldL, ls: 3 });
  ctx.restore();
  ctx.save(); ctx.translate(-48, -160); ctx.rotate(Math.PI / 2); ctx.font = '800 46px Fraunces'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#5b2a17'; ctx.fillText('enzi', 0, 0); ctx.restore();
  face(46, -168, 1, P, t);
  ell(0, -ch, tw + 3, 16, '#efe9df'); ell(0, -ch, tw - 8, 11, '#c08a5c');
  ctx.fillStyle = '#f6e8d6'; ctx.beginPath(); { const hs = 9, hy = -ch; ctx.moveTo(0, hy + hs * .7); ctx.bezierCurveTo(-hs * 2, hy - hs * .3, -hs * .8, hy - hs * 1.3, 0, hy - hs * .4); ctx.bezierCurveTo(hs * .8, hy - hs * 1.3, hs * 2, hy - hs * .3, 0, hy + hs * .7); ctx.fill(); }
  if (P.steam > 0) steamWisps(-ch, P.steam, P.drag, t);
}
function humanBody(P, t, c) {
  // delivery backpack
  ctx.fillStyle = C.coffee; rr(-82, -158, 50, 116, 14); ctx.fill(); ctx.fillStyle = C.orange; ctx.fillRect(-82, -128, 50, 10);
  text('e', -57, -84, { size: 34, font: 'Fraunces', weight: 800, color: C.goldL });
  if (P.steam > 0) { ctx.save(); ctx.translate(-57, -150); ctx.scale(.45, .45); steamWisps(0, P.steam, P.drag, t, 30); ctx.restore(); }
  // torso
  ctx.fillStyle = c.shirt; rr(-38, -158, 76, 168, 32); ctx.fill();
  if (c.pattern) { ctx.save(); rr(-38, -158, 76, 168, 32); ctx.clip(); for (let yy = -158; yy < 10; yy += 28) for (let xx = -38; xx < 38; xx += 28) { ctx.fillStyle = c.pattern; ctx.beginPath(); ctx.moveTo(xx + 14, yy); ctx.lineTo(xx + 25, yy + 14); ctx.lineTo(xx + 14, yy + 28); ctx.lineTo(xx + 3, yy + 14); ctx.fill(); } ctx.restore(); }
  ctx.fillStyle = 'rgba(0,0,0,.08)'; rr(-38, -158, 22, 168, [32, 0, 0, 32]); ctx.fill();
  line([[-24, -120], [-48, -40]], 8, '#3a2414'); // backpack strap
  if (c.apron) { ctx.fillStyle = C.coffee; rr(-26, -124, 64, 134, [10, 10, 18, 18]); ctx.fill(); line([[-20, -124], [-6, -152]], 5, C.coffee); line([[34, -124], [22, -152]], 5, C.coffee); text('e', 6, -74, { size: 40, font: 'Fraunces', weight: 800, color: C.goldL }); }
  ctx.fillStyle = c.skin; rr(-10, -180, 22, 34, 8); ctx.fill();
  // head
  ctx.save(); ctx.translate(6, -228);
  if (c.hair === 'puffs') { circ(-36, -40, 32, '#1b1310'); circ(28, -50, 30, '#1b1310'); }
  circ(0, 0, 52, c.skin); circ(-38, 6, 12, c.skin); circ(-38, 6, 6, mixc(c.skin, '#000000', .2));
  if (c.hair === 'puffs') {
    ctx.fillStyle = '#1b1310'; ctx.beginPath(); ctx.arc(0, -4, 55, Math.PI * 1.05, Math.PI * 1.95); ctx.quadraticCurveTo(30, -36, -40, -20); ctx.fill();
    ctx.strokeStyle = c.band; ctx.lineWidth = 13; ctx.beginPath(); ctx.arc(0, -2, 50, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    for (let k = 0; k < 4; k++) { const a = Math.PI * (1.18 + k * .2); circ(Math.cos(a) * 50, -2 + Math.sin(a) * 50, 3.5, '#fff6dc'); }
    circ(20, 30, 0, '#000');
    circ(-36, 22, 6, C.goldL); // earring
  }
  face(22, -6, .66, P, t);
  if (c.beard) for (let k = 0; k < 14; k++) { const a = .2 + k * .2; circ(Math.cos(a) * 46 + 6, Math.sin(a) * 40 + 6, 2.4, 'rgba(20,10,8,.55)'); }
  if (c.hair === 'bucket') {
    ctx.fillStyle = c.hat; ctx.beginPath(); ctx.ellipse(4, -34, 76, 15, -.06, 0, 7); ctx.fill();
    rr(-46, -86, 96, 56, [24, 24, 6, 6]); ctx.fill();
    ctx.save(); rr(-46, -86, 96, 56, [24, 24, 6, 6]); ctx.clip(); for (let k = 0; k < 6; k++) { ctx.fillStyle = c.hatPat; ctx.beginPath(); ctx.arc(-40 + k * 18, -58, 6, 0, 7); ctx.fill(); } ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(-46, -42, 96, 10); ctx.restore();
  }
  if (c.phones) { ctx.strokeStyle = '#1c1c24'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(-6, 44, 42, -.2, Math.PI + .2); ctx.stroke(); ell(-40, 46, 13, 18, '#1c1c24'); ell(30, 54, 13, 18, '#1c1c24'); circ(-40, 46, 6, C.orangeL); }
  ctx.restore();
}
function drawSkater(P, t, id = 'enzi') {
  const c = CREW[id] || CREW.enzi, cup = c.body === 'cup';
  ctx.save(); ctx.translate(P.x, P.y); ctx.scale(P.scale, P.scale);
  const lift = P.groundOff;
  if (!P.noShadow) ell(0, lift + 4, 150 * clamp(1 - lift / 900, .3, 1), 14, `rgba(40,20,10,${.25 * clamp(1 - lift / 900, .25, 1)})`);
  if (P.jet > 0) for (let i = 0; i < 18; i++) { const ph = (t * 3.2 + rnd(i)) % 1, px = (rnd(i + 4) - .5) * 120 - ph * 260, py = -10 + ph * 120; circ(px, py, 16 + ph * 36, `rgba(255,${235 - ph * 60},${200 - ph * 80},${(1 - ph) * .7 * P.jet})`); }
  if (P.onBoard) { if (P.boardFlip) { ctx.save(); ctx.translate(0, -30); ctx.scale(1, Math.cos(P.boardFlip)); ctx.translate(0, 30); board(0, 0, P.boardAng, 1, Math.cos(P.boardFlip) < 0 ? '#2a2026' : c.deck); ctx.restore(); } else board(0, 0, P.boardAng, 1, c.deck); }
  const hip = P.hip, lean = P.lean, rot = (px, py) => [hip[0] + px * Math.cos(lean) - py * Math.sin(lean), hip[1] + px * Math.sin(lean) + py * Math.cos(lean)];
  const leg = (hx, fx, fy) => { let L = ik(hx, hip[1] + 4, fx, fy - 10, 84, 84, -1); if (L[1][0] < (hx + fx) / 2) L = ik(hx, hip[1] + 4, fx, fy - 10, 84, 84, 1); return L; };
  const LB = leg(hip[0] - (cup ? 22 : 14), P.fB[0], P.fB[1]), LF = leg(hip[0] + (cup ? 22 : 14), P.fF[0], P.fF[1]);
  const shB = cup ? rot(-74, -138) : rot(-18, -140), shF = cup ? rot(70, -138) : rot(18, -140);
  const arm = (sh, h) => { let A = ik(sh[0], sh[1], h[0], h[1], 68, 68, 1); if (A[1][1] < (sh[1] + h[1]) / 2 - 2 && Math.abs(h[0] - sh[0]) > 20) A = ik(sh[0], sh[1], h[0], h[1], 68, 68, -1); return A; };
  const AB = arm(shB, P.hB), AF = arm(shF, P.hF);
  const limbArm = (A, front) => {
    if (cup) { line(A, 14, front ? C.leg : '#2c160c'); circ(A[2][0], A[2][1], front ? 16 : 15, front ? '#fff' : '#efe9df'); }
    else { const sl = front ? c.shirt : mixc(c.shirt, '#000000', .18), sk = front ? c.skin : mixc(c.skin, '#000000', .15); line([A[1], A[2]], 15, sk); line([A[0], A[1]], 22, sl); circ(A[2][0], A[2][1], 14, sk); }
  };
  const limbLeg = (L, front) => {
    const col = cup ? (front ? C.leg : '#2c160c') : (front ? c.pants : mixc(c.pants, '#000000', .22));
    line(L, cup ? 18 : 24, col); shoe(L[2][0], L[2][1] + 10, c.shoe, !front);
  };
  limbLeg(LB, false); limbArm(AB, false);
  ctx.save(); ctx.translate(hip[0], hip[1]); ctx.rotate(lean);
  if (cup) cupBody(P, t); else humanBody(P, t, c);
  ctx.restore();
  limbLeg(LF, true);
  if (P.item) { ctx.save(); ctx.translate(AF[2][0] + 10, AF[2][1] + 10); takeawayCup(0, 0, .8); ctx.restore(); }
  limbArm(AF, true);
  ctx.restore();
}

// Pose library — shared by the game and the crew gallery.
function poseRide(P, t, push = true) {
  if (push) { const c = (t / .62) % 1;
    if (c < .14) { const p = c / .14; P.fB = [lerp(-72, -10, p), lerp(-52, 0, ease(p))]; }
    else if (c < .44) { const p = (c - .14) / .3; P.fB = [lerp(-10, -175, p), 0]; P.hip[1] = -162; }
    else if (c < .62) { const p = (c - .44) / .18; P.fB = [lerp(-175, -72, ease(p)), -52 - 40 * Math.sin(Math.PI * p)]; }
    P.lean = .16; P.hF = [130, -230 + Math.sin(c * 6.28) * 20]; P.hB = [-125, -280 - Math.sin(c * 6.28) * 20];
  } else { P.hB = [-140, -300]; P.hF = [140, -290]; P.hip[1] = -170 + Math.sin(t * 6) * 3; }
  P.mouth = 'grin'; if ((t % 3.1) < .1) P.eyes = 'blink';
  return P;
}
function poseAir(P, rising, flip) {
  P.hB = [-150, -350]; P.hF = [150, -340]; P.mouth = 'grin'; P.eyes = 'happy'; P.steam = 1.6;
  P.hip[1] = rising ? -150 : -170; P.fB = [-72, -60]; P.fF = [60, -60]; P.boardAng = rising ? -.25 : .06;
  if (flip !== null) { P.boardFlip = flip * Math.PI * 2; P.hip[1] = -205; P.fB = [-80, -110]; P.fF = [70, -110]; P.hB = [-170, -330]; P.hF = [150, -380]; P.eyes = 'wide'; P.mouth = 'o'; }
  return P;
}
function poseBrake(P) { P.lean = -.14; P.fB = [-128, -66]; P.boardAng = -.1; P.hF = [140, -300]; P.hB = [-110, -320]; P.mouth = 'o'; P.brows = 1; return P; }
function poseHit(P, t) { P.lean = -.3; P.eyes = 'dizzy'; P.mouth = 'ouch'; P.hB = [-170, -320]; P.hF = [80, -360 + Math.sin(t * 30) * 20]; P.boardAng = -.2; return P; }
function poseCheer(P, t) { P.lean = 0; P.hip = [-30, -170]; P.fB = [-110, -52]; P.fF = [70, -52]; P.hB = [-120, -400 + Math.sin(t * 10) * 20]; P.hF = [120, -400 + Math.cos(t * 10) * 20]; P.eyes = 'happy'; P.mouth = 'grin'; P.hip[1] -= Math.abs(Math.sin(t * 8)) * 10; return P; }

// ---------- people (customers, Afande) — face LEFT by default ----------
function head(x, y, s, o, t) {
  const { skin = '#6b4026', hat = 'none', beard = false, talk = 0, blink = (t % 2.7) < .1, mood = 'smile' } = o;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (hat === 'wrap') ell(6, -36, 52, 40, o.wrapCol || '#e8b830', -.2);
  if (hat === 'bun') circ(14, -52, 26, '#1b1310');
  circ(0, 0, 46, skin); circ(30, 4, 10, skin);
  ctx.fillStyle = '#1b1310';
  if (hat === 'none' || hat === 'bun') { ctx.beginPath(); ctx.arc(0, -6, 48, Math.PI * 1.05, Math.PI * 1.95); ctx.fill(); }
  for (const ex of [-26, -6]) {
    if (mood === 'angry') { ell(ex, -6, 6, 8, '#1b1310'); circ(ex - 2, -9, 2.2, '#fff'); }
    else if (blink || mood === 'happy') { ctx.strokeStyle = '#1b1310'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(ex, mood === 'happy' ? -2 : -6, 6, mood === 'happy' ? Math.PI + .3 : 0, mood === 'happy' ? -.3 : Math.PI); ctx.stroke(); }
    else { ell(ex, -6, 6, 8, '#1b1310'); circ(ex - 2, -9, 2.2, '#fff'); }
  }
  if (mood === 'angry') { line([[-36, -26], [-20, -18]], 5, '#1b1310'); line([[-12, -18], [2, -26]], 5, '#1b1310'); }
  else { line([[-34, -22], [-20, -24]], 4, '#1b1310'); line([[-12, -24], [0, -22]], 4, '#1b1310'); }
  ell(-38, 6, 8, 6, 'rgba(0,0,0,.18)');
  if (o.blush) { ell(-34, 14, 9, 5, 'rgba(232,126,58,.45)'); ell(4, 14, 8, 5, 'rgba(232,126,58,.45)'); }
  const m = talk > 0 ? Math.abs(Math.sin(t * 17)) * talk : 0;
  if (beard) { ctx.fillStyle = '#d8d4cc'; ctx.beginPath(); ctx.arc(-6, 20, 34, .1, Math.PI - .05); ctx.fill(); }
  if (o.mustache) { ctx.fillStyle = '#1b1310'; ctx.beginPath(); ctx.ellipse(-22, 12, 16, 6, 0, Math.PI, 0); ctx.fill(); }
  if (m > .15) { ell(-22, 24, 12, 4 + m * 10, '#4a1a12'); ell(-22, 28 + m * 4, 7, 3, '#d65a5a'); }
  else if (mood === 'angry') line([[-32, 26], [-12, 22]], 4, '#3a140c');
  else { ctx.strokeStyle = '#3a140c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-22, 14, 13, .3, Math.PI - .3); ctx.stroke(); }
  if (hat === 'kofia') { ctx.fillStyle = '#fbf7ee'; rr(-42, -62, 84, 34, [10, 10, 2, 2]); ctx.fill(); for (let k = 0; k < 6; k++) circ(-34 + k * 14, -46, 3.5, '#c9a36a'); }
  if (hat === 'helmet') { ctx.fillStyle = '#e8b830'; ctx.beginPath(); ctx.arc(2, -8, 54, Math.PI * 1.02, Math.PI * 2.02); ctx.fill(); ctx.fillStyle = 'rgba(40,40,60,.75)'; rr(-56, -20, 40, 16, 6); ctx.fill(); ctx.fillStyle = '#c0392b'; ctx.fillRect(-10, -60, 22, 52); }
  if (hat === 'wrap') { ctx.fillStyle = o.wrapCol || '#e8b830'; ctx.beginPath(); ctx.arc(4, -20, 48, Math.PI * 1.05, Math.PI * 2.0); ctx.fill(); for (let k = 0; k < 5; k++) circ(-20 + k * 14, -42 + (k % 2) * 8, 4, 'rgba(255,255,255,.4)'); }
  if (hat === 'police') { ctx.fillStyle = '#fbfbf6'; ctx.beginPath(); ctx.ellipse(4, -44, 56, 22, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#1d2440'; ctx.fillRect(-46, -38, 96, 16); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(-36, -24, 34, 9, -.15, 0, 7); ctx.fill(); circ(-6, -46, 9, C.goldL); }
  if (o.earring) circ(30, 20, 5, '#e8c27a');
  ctx.restore();
}
function person(x, y, s, o, t) { // y = feet
  const { skin = '#6b4026', shirt = '#2B7A6E', pants = '#2e2a40', robe = false, vest = false, apron = false, gesture = 0, talk = 0, bounce = 0, pattern = null, skirt = null } = o;
  ctx.save(); ctx.translate(x, y - bounce); ctx.scale(s, s);
  if (!robe && !skirt) { line([[-10, -230], [-14, -110], [-12, -10]], 34, '#24203a'); line([[10, -230], [16, -110], [12, -10]], 34, pants); }
  if (skirt) { line([[-10, -150], [-12, -10]], 26, skin); line([[10, -150], [12, -10]], 26, skin); }
  for (const [fx, c] of [[-26, '#222'], [2, '#333']]) { ctx.fillStyle = c; rr(fx - 22, -16, 54, 20, 10); ctx.fill(); }
  const bArm = o.hands ? [[20, -400], [50, -330], [10, -300]] : [[20, -400], [34, -320], [28, -250]];
  line(bArm, 24, mixc(shirt, '#000000', .25)); circ(bArm[2][0], bArm[2][1], 14, skin);
  if (robe) { ctx.fillStyle = '#fbf7ee'; ctx.beginPath(); ctx.moveTo(-46, -420); ctx.lineTo(46, -420); ctx.lineTo(62, -14); ctx.lineTo(-62, -14); ctx.fill(); line([[-10, -400], [-10, -300]], 3, '#e2dccf'); }
  else { ctx.fillStyle = shirt; rr(-50, -430, 100, 210, 34); ctx.fill();
    if (pattern) { ctx.save(); rr(-50, -430, 100, 210, 34); ctx.clip(); for (let yy = -430; yy < -220; yy += 30) for (let xx = -50; xx < 50; xx += 30) { ctx.fillStyle = pattern; ctx.beginPath(); ctx.moveTo(xx + 15, yy); ctx.lineTo(xx + 27, yy + 15); ctx.lineTo(xx + 15, yy + 30); ctx.lineTo(xx + 3, yy + 15); ctx.fill(); } ctx.restore(); } }
  if (skirt) { ctx.fillStyle = skirt; ctx.beginPath(); ctx.moveTo(-50, -250); ctx.lineTo(50, -250); ctx.lineTo(70, -120); ctx.lineTo(-70, -120); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let k = 0; k < 4; k++) ctx.fillRect(-60 + k * 34, -200, 18, 70); }
  if (vest) { ctx.fillStyle = '#f39c12'; rr(-46, -420, 92, 170, 24); ctx.fill(); ctx.fillStyle = '#e8f0f0'; ctx.fillRect(-46, -330, 92, 14); ctx.fillRect(-46, -300, 92, 14); }
  if (o.police) { ctx.fillStyle = '#1d2440'; ctx.fillRect(-50, -250, 100, 22); ctx.fillStyle = C.goldL; ctx.fillRect(-8, -250, 16, 22); ctx.fillStyle = '#c7cdd6'; for (const px of [-30, 20]) rr(px, -410, 14, 26, 4), ctx.fill(); line([[-38, -420], [30, -280]], 9, 'rgba(220,240,120,.85)'); }
  if (apron) { ctx.fillStyle = C.coffee; rr(-44, -390, 88, 200, 16); ctx.fill(); text('e', 0, -330, { size: 40, font: 'Fraunces', weight: 800, color: C.goldL }); }
  let fArm;
  { const g = gesture, wave = Math.sin(t * 9) * .35 * g, sx = -20, sy = -400, a1 = lerp(.15, 1.9, g) + wave * .4, a2 = a1 + lerp(.1, .8, g) + wave;
    const ex = sx - Math.sin(a1) * 90, ey = sy + Math.cos(a1) * 90; fArm = [[sx, sy], [ex, ey], [ex - Math.sin(a2) * 80, ey + Math.cos(a2) * 80]]; }
  if (o.stop) fArm = [[-20, -400], [-100, -420], [-180, -430]];
  line(fArm, 24, robe ? '#fbf7ee' : vest ? '#f39c12' : shirt); circ(fArm[2][0], fArm[2][1], 15, o.police ? '#fff' : skin);
  if (o.stop) { ctx.fillStyle = '#fff'; rr(fArm[2][0] - 20, fArm[2][1] - 36, 36, 50, 12); ctx.fill(); }
  if (o.holding === 'cup') { ctx.save(); ctx.translate(fArm[2][0] - 6, fArm[2][1] + 14); takeawayCup(0, 0, .75); ctx.restore(); }
  head(0, -490, 1, { ...o, talk }, t);
  if (o.whistle) { ctx.save(); ctx.translate(-30, -466); ctx.fillStyle = '#c7cdd6'; rr(-26, -6, 30, 14, 6); ctx.fill(); circ(-24, 1, 9, '#c7cdd6'); ctx.restore();
    if (o.whistle > 0) for (let k = 0; k < 3; k++) { const a = -2.6 + k * .35; line([[-70 + Math.cos(a) * 30, -466 + Math.sin(a) * 30], [-70 + Math.cos(a) * (60 + o.whistle * 30), -466 + Math.sin(a) * (60 + o.whistle * 30)]], 6, '#fff'); } }
  ctx.restore();
}

// ---------- customers (wateja) ----------
const CUSTOMERS = {
  mama: { name: 'Mama Ntilie', place: 'Kariakoo', look: { skin: '#6b4026', shirt: '#d6604f', pattern: '#e8b830', skirt: '#2B7A6E', hat: 'wrap', wrapCol: '#9a6fb0', earring: true, blush: true },
    order: 'Kahawa mbili za tangawizi, haraka!', orderEn: 'Two ginger coffees, quick!', thanks: 'Asante mwanangu! Bado ya moto!', thanksEn: 'Thank you my child! Still hot!' },
  baraka: { name: 'Baraka', place: 'Posta', look: { skin: '#5a3420', shirt: '#2e2a40', vest: true, hat: 'helmet' },
    order: 'Oya blaza, latte moja kwa kijiweni!', orderEn: 'Yo bro, one latte to the boda stage!', thanks: 'Noma sana! Umewahi kuliko boda!', thanksEn: 'Legendary! Faster than a boda!' },
  mzee: { name: 'Mzee Juma', place: 'Coco Beach', look: { skin: '#5a3a26', robe: true, hat: 'kofia', beard: true },
    order: 'Kahawa chungu kama zamani, mjukuu.', orderEn: 'Strong coffee like the old days, grandchild.', thanks: 'Kila kikombe ni safari. Hongera!', thanksEn: 'Every cup is a journey. Well done!' },
  neema: { name: 'Neema', place: 'Victoria', look: { skin: '#7a4a2c', shirt: '#c76bb0', pants: '#2e2a40', hat: 'bun', earring: true, blush: true },
    order: 'Cappuccino kwa meeting yangu ya saa nne!', orderEn: 'A cappuccino for my 10 o\'clock meeting!', thanks: 'Umeniokoa! Karibu tena HZE!', thanksEn: 'You saved me! See you at HZE!' },
};
function customer(id, x, y, s, t, o = {}) { const c = CUSTOMERS[id]; person(x, y, s, { ...c.look, ...o }, t); }

// ---------- hazards (wabaya) ----------
function afande(x, y, s, t, o = {}) { person(x, y, s, { skin: '#4e2c1a', shirt: '#fbfbf6', pants: '#1d2440', hat: 'police', police: true, mustache: true, mood: o.angry ? 'angry' : 'smile', whistle: o.whistle ?? 0.0001, stop: o.stop, talk: o.talk, bounce: o.bounce || 0 }, t); }
function trafficLight(x, y, s, phase) { // phase: 'green' | 'yellow' | 'red'; y = ground
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#2f2f38'; ctx.fillRect(-9, -560, 18, 560); ctx.fillStyle = '#e8b830'; for (let k = 0; k < 6; k++) ctx.fillRect(-9, -160 + k * 26, 18, 13);
  ctx.fillStyle = '#1c1c24'; rr(-52, -800, 104, 260, 22); ctx.fill(); ctx.strokeStyle = '#e8b830'; ctx.lineWidth = 6; ctx.stroke();
  const lamps = [['red', '#ff3b30', '#4a1512'], ['yellow', '#ffcc00', '#4a3c10'], ['green', '#34e07a', '#123a22']];
  lamps.forEach(([k, on, off], i) => { const cy = -755 + i * 80, lit = phase === k;
    if (lit) { const g = ctx.createRadialGradient(0, cy, 10, 0, cy, 110); g.addColorStop(0, on + 'aa'); g.addColorStop(1, on + '00'); ctx.fillStyle = g; ctx.fillRect(-110, cy - 110, 220, 220); }
    circ(0, cy, 30, lit ? on : off); if (lit) circ(-9, cy - 9, 9, 'rgba(255,255,255,.6)');
    ctx.strokeStyle = '#0e0e14'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, cy, 36, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); });
  ctx.restore();
}
function kunguru(x, y, s, t, o = {}) { // house crow — faces LEFT, steals beans
  const flap = Math.sin(t * (o.perched ? 3 : 16) + (o.seed || 0));
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (o.squash) ctx.scale(1.3, .4);
  ell(48, -6, 46, 16, '#1d1a22', -.25); // tail
  ctx.fillStyle = '#22202a'; ctx.beginPath(); ctx.moveTo(10, -10); ctx.quadraticCurveTo(40, -70 - flap * 70, 80, -60 - flap * 90); ctx.quadraticCurveTo(50, -20, 30, 0); ctx.fill();
  ell(0, 0, 58, 38, '#2a2732');
  ell(-34, -26, 34, 30, '#7d7a86'); // grey nape
  circ(-50, -34, 30, '#2a2732');
  ctx.fillStyle = '#1a1820'; ctx.beginPath(); ctx.moveTo(-74, -42); ctx.lineTo(-118, -30); ctx.lineTo(-74, -22); ctx.fill();
  circ(-60, -42, 11, '#fff'); circ(-64, -42, 6, '#111'); line([[-76, -58], [-46, -50]], 5, '#111');
  ctx.fillStyle = '#1d1a22'; ctx.beginPath(); ctx.moveTo(-10, -6); ctx.quadraticCurveTo(10, -70 + flap * 60, 40, -40 + flap * 80); ctx.quadraticCurveTo(30, 0, 10, 10); ctx.fill();
  if (o.carry) bean(-112, -24, 16, t * 3);
  ctx.restore();
}
function kuku(x, y, s, t, o = {}) { // market chicken — faces LEFT
  const walk = Math.sin(t * 12 + (o.seed || 0)), sq = o.squash ? .35 : 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s * sq);
  line([[-8, -24], [-8 - walk * 8, 0]], 6, '#e8a32c'); line([[10, -24], [10 + walk * 8, 0]], 6, '#e8a32c');
  ell(0, -56, 50, 38, '#f4ede0'); ell(42, -76, 20, 30, '#e9dfcf', .5);
  circ(-34, -98, 22, '#f4ede0'); circ(-32, -122, 9, '#d6332c'); circ(-43, -118, 8, '#d6332c'); ell(-50, -86, 6, 10, '#d6332c');
  ctx.fillStyle = '#e8a32c'; ctx.beginPath(); ctx.moveTo(-54, -102); ctx.lineTo(-70, -96); ctx.lineTo(-54, -91); ctx.fill();
  if (o.squash) { line([[-46, -108], [-34, -96]], 4, '#222'); line([[-34, -108], [-46, -96]], 4, '#222'); } else { circ(-40, -102, 5, '#222'); line([[-50, -114], [-32, -110]], 4, '#222'); }
  ell(6, -60, 28, 18, '#e9dfcf', .3 + walk * .1);
  ctx.restore();
}
function kaa(x, y, s, t, o = {}) { // Coco Beach crab
  ctx.save(); ctx.translate(x + Math.sin(t * 8) * 4, y); ctx.scale(s, s * (o.squash ? .4 : 1));
  for (let k = 0; k < 3; k++) { line([[-24, -28], [-50 - k * 7, -10 + Math.sin(t * 20 + k) * 5], [-58 - k * 7, 0]], 6, '#d6332c'); line([[24, -28], [50 + k * 7, -10 + Math.sin(t * 20 + k + 1) * 5], [58 + k * 7, 0]], 6, '#d6332c'); }
  ell(0, -36, 48, 28, '#e8452c'); ell(-10, -44, 26, 10, 'rgba(255,255,255,.2)');
  const snap = Math.abs(Math.sin(t * 6)) * .5;
  for (const sx of [-1, 1]) { ctx.save(); ctx.translate(sx * 50, -70); ctx.rotate(sx * snap); ell(0, 0, 18, 14, '#e8452c'); ctx.restore(); }
  line([[-14, -58], [-16, -76]], 5, '#d6332c'); line([[14, -58], [16, -76]], 5, '#d6332c');
  circ(-16, -80, 8, '#fff'); circ(16, -80, 8, '#fff'); circ(-18, -80, 4, '#222'); circ(14, -80, 4, '#222');
  line([[-26, -92], [-8, -86]], 4, '#222'); line([[26, -92], [8, -86]], 4, '#222');
  ctx.restore();
}
function shimo(x, y, w, t) { // the pothole — it glares at you
  ell(x, y + 10, w / 2 + 12, 30, '#8e7e66'); ell(x, y + 12, w / 2, 24, '#2a201a'); ell(x, y + 18, w / 2 - 14, 14, '#16100c');
  const look = Math.sin(t * 2) * 4;
  for (const ex of [-w * .18, w * .18]) { ell(x + ex, y + 6, 13, 10, '#fff'); circ(x + ex - 5 + look, y + 8, 6, '#111'); }
  line([[x - w * .3, y - 6], [x - w * .08, y + 2]], 5, '#16100c'); line([[x + w * .3, y - 6], [x + w * .08, y + 2]], 5, '#16100c');
}
function dimbwi(x, y, w, t) { // rain puddle
  ell(x, y + 14, w / 2, 26, 'rgba(90,140,180,.85)'); ell(x - w * .1, y + 8, w / 2 - 30, 12, 'rgba(200,230,250,.5)');
  for (let k = 0; k < 3; k++) { const ph = (t * .8 + k / 3) % 1; ctx.strokeStyle = `rgba(255,255,255,${.6 * (1 - ph)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x + (k - 1) * w * .25, y + 14, 10 + ph * 40, 4 + ph * 12, 0, 0, 7); ctx.stroke(); }
}
function bodaRider(x, y, s, t) { // boda boda coming at you — faces LEFT
  ctx.save(); ctx.translate(x, y); ctx.scale(-s, s);
  const wheel = wx0 => { circ(wx0, -40, 42, '#222'); circ(wx0, -40, 18, '#aaa'); const a = -t * 14; line([[wx0, -40], [wx0 + Math.cos(a) * 18, -40 + Math.sin(a) * 18]], 4, '#555'); };
  wheel(-110); wheel(115);
  ctx.fillStyle = '#d6604f'; rr(-95, -130, 170, 52, 22); ctx.fill(); ctx.fillStyle = '#222'; rr(-110, -150, 120, 26, 12); ctx.fill();
  line([[80, -110], [115, -40]], 12, '#555'); line([[70, -150], [100, -190], [130, -186]], 10, '#333');
  const g = ctx.createRadialGradient(140, -150, 4, 140, -150, 90); g.addColorStop(0, 'rgba(255,245,190,.9)'); g.addColorStop(1, 'rgba(255,245,190,0)'); ctx.fillStyle = g; ctx.fillRect(50, -240, 180, 180); circ(122, -150, 14, '#fff3c4');
  line([[-40, -150], [10, -100], [40, -50]], 22, '#2e2a40');
  ctx.fillStyle = '#f2a02c'; rr(-70, -300, 80, 150, 28); ctx.fill(); ctx.fillStyle = '#e8f0f0'; ctx.fillRect(-70, -240, 80, 12);
  line([[-20, -280], [60, -230], [100, -190]], 16, '#f2a02c');
  circ(-26, -340, 40, '#5a3420'); ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(-24, -346, 46, Math.PI * .95, Math.PI * 2.05); ctx.fill(); ctx.fillStyle = 'rgba(40,40,60,.8)'; rr(-4, -356, 34, 18, 6); ctx.fill();
  ctx.restore();
}
function mtaroGrate(x, y) { ctx.fillStyle = '#5c5a58'; ctx.fillRect(x - 10, y - 8, 20, 18); }
