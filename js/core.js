// Core: canvas, layout constants, palette, easing and drawing helpers.
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const W = 1080, H = 1920, CX = W / 2;
// street layout (side-scroller): far-side buildings sit on FAR, road between ROAD0/ROAD1,
// NPCs stand on NPCY, Enzi's wheels touch GY. Interiors use FLOOR.
const FAR = 1080, ROAD0 = 1110, ROAD1 = 1335, NPCY = 1452, GY = 1545, FLOOR = 1600, SX = 330;
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
function bean(x, y, r, spin, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.scale(Math.max(.2, Math.abs(Math.cos(spin))), 1); ctx.rotate(.5);
  const g = ctx.createRadialGradient(-r * .3, -r * .4, r * .1, 0, 0, r * 1.3); g.addColorStop(0, '#c9874f'); g.addColorStop(.6, '#7a3f1d'); g.addColorStop(1, '#3e1e0e');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, r * .78, r, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#2a120a'; ctx.lineWidth = r * .16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -r * .8); ctx.bezierCurveTo(r * .35, -r * .3, -r * .35, r * .3, 0, r * .8); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,230,190,.55)'; ctx.lineWidth = r * .12; ctx.beginPath(); ctx.ellipse(-r * .3, -r * .35, r * .18, r * .35, .3, 0, 7); ctx.stroke();
  ctx.restore();
}
function smallCup(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-26, -40); ctx.lineTo(26, -40); ctx.quadraticCurveTo(26, 0, 0, 0); ctx.quadraticCurveTo(-26, 0, -26, -40); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(28, -24, 10, -1.4, 1.4); ctx.stroke(); ell(0, -40, 26, 6, '#a86e42'); ell(0, -40, 8, 3, '#f3e2cc');
  ctx.fillStyle = C.orange; ctx.fillRect(-26, -24, 52, 6); ctx.restore();
}
// circular wipe: r = visible radius
function irisMask(cx, cy, r) { ctx.save(); ctx.fillStyle = '#160c08'; ctx.beginPath(); ctx.rect(0, 0, W, H); const R = Math.max(r, .1); ctx.moveTo(cx + R, cy); ctx.arc(cx, cy, R, 0, Math.PI * 2, true); ctx.fill('evenodd'); ctx.restore(); }
