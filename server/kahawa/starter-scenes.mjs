// Draws the three starter scenes for Kahawa Iko Wapi? as colouring-book line art, and writes each
// scene's hiding spots. Run it again after changing a drawing:
//   node server/kahawa/starter-scenes.mjs
// Output: game/kahawa/scenes/<id>.svg (the picture) and server/kahawa/scenes/<id>.json (name, size, spots).
// New scenes don't have to come from here: any line drawing works, with spots marked in game/kahawa/spots.html.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const W = 1200, H = 1600, INK = '#1f1a17', LINE = 3;
const f = n => +n.toFixed(1);

function rng(seed) {
  let h = parseInt(crypto.createHash('sha256').update(seed).digest('hex').slice(0, 8), 16);
  return () => { h = h + 0x6D2B79F5 | 0; let t = Math.imul(h ^ h >>> 15, 1 | h); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// A drawing: shapes go in back-to-front, each filled white so it hides what's behind it.
function canvas(seed) {
  const out = [], spots = [], R = rng(seed);
  const rnd = (a, b) => a + R() * (b - a), pick = a => a[Math.floor(R() * a.length)];
  const D = {
    R, rnd, pick, spots,
    shape: (d, w = LINE) => out.push(`<path d="${d}" fill="#fff" stroke-width="${w}"/>`),
    line: (d, w = LINE) => out.push(`<path d="${d}" fill="none" stroke-width="${w}"/>`),
    dark: d => out.push(`<path d="${d}" fill="${INK}" stroke="none"/>`),
    raw: s => out.push(s),
    // a bag standing on a surface at y (bottom), or sitting in something at its centre
    spot: (x, y, s = 66, r = 0) => spots.push({ x: Math.round(x), y: Math.round(y), s: Math.round(s), r: Math.round(r) }),
    on: (x, surfaceY, s = 66, r = 0) => spots.push({ x: Math.round(x), y: Math.round(surfaceY - s / 2 + 4), s: Math.round(s), r: Math.round(r) }),
    svg: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/><g stroke="${INK}" stroke-linecap="round" stroke-linejoin="round">${out.join('')}</g></svg>`,
  };
  return D;
}

// ---------- drawing pieces
const ellipse = (cx, cy, rx, ry) => `M${f(cx - rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)} ${f(cy)}A${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)} ${f(cy)}Z`;
const rect = (x, y, w, h) => `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
const rrect = (x, y, w, h, r) => `M${f(x + r)} ${f(y)}H${f(x + w - r)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)}V${f(y + h - r)}Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)}H${f(x + r)}Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)}V${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Z`;
function spiral(cx, cy, r, turns = 2.2, dir = 1, start = 0) {
  const pts = [], n = Math.ceil(turns * 28);
  for (let i = 0; i <= n; i++) { const t = i / n, a = start + dir * t * turns * Math.PI * 2, rr = r * (1 - t * .92); pts.push(`${f(cx + Math.cos(a) * rr)} ${f(cy + Math.sin(a) * rr)}`); }
  return 'M' + pts.join('L');
}
// a wavy blob: bumps around an ellipse (start..end angle, radians), flat across the bottom if open
function scallop(cx, cy, rx, ry, D, { n = 9, a0 = Math.PI, a1 = Math.PI * 2, bump = .28, closed = false } = {}) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push([cx + Math.cos(a) * rx * D.rnd(.94, 1.04), cy + Math.sin(a) * ry * D.rnd(.94, 1.04)]); }
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], len = Math.hypot(x1 - x0, y1 - y0); d += `A${f(len * .55)} ${f(len * (.55 + bump * D.rnd(.6, 1.2)))} 0 0 1 ${f(x1)} ${f(y1)}`; }
  return d + 'Z';
}
function cloud(D, cx, cy, w, spot = true) {
  const h = w * .42;
  D.shape(scallop(cx, cy + h * .3, w / 2, h, D, { n: Math.round(w / 55) + 4, bump: .35 }));
  D.line(spiral(cx - w * .12, cy + h * .02, h * .38, 1.8, 1, D.rnd(0, 6)));
  if (w > 200) D.line(spiral(cx + w * .22, cy + h * .1, h * .26, 1.6, -1, D.rnd(0, 6)));
  if (spot) D.on(cx + D.rnd(-w * .2, w * .2), cy - h * .45, D.rnd(54, 62), D.rnd(-10, 10));
}
// a leafy bush: scalloped outline and little curls inside
function bush(D, cx, base, w, h, { spot = true, curls = true } = {}) {
  D.shape(scallop(cx, base, w / 2, h, D, { n: Math.round(w / 38) + 5, bump: .32 }));
  if (curls) for (let i = 0; i < Math.round(w * h / 2600); i++) {
    const x = cx + D.rnd(-w * .36, w * .36), y = base - D.rnd(h * .12, h * .8);
    if (((x - cx) / (w / 2)) ** 2 + ((base - y) / h) ** 2 > .7) continue;
    const r = D.rnd(7, 13), a = D.rnd(0, 6);
    D.line(`M${f(x + Math.cos(a) * r)} ${f(y + Math.sin(a) * r)}A${f(r)} ${f(r)} 0 1 1 ${f(x + Math.cos(a + 2.2) * r)} ${f(y + Math.sin(a + 2.2) * r)}`, 2.4);
  }
  if (spot) D.spot(cx + D.rnd(-w * .25, w * .25), base - h * D.rnd(.35, .6), D.rnd(58, 70), D.rnd(-20, 20));
}
function cobbles(D, y0, y1, x0 = 0, x1 = W) {
  for (let y = y0; y < y1; y += 34) for (let x = x0 + D.rnd(0, 30); x < x1; x += D.rnd(70, 100)) D.shape(ellipse(x, y + D.rnd(-5, 5), D.rnd(22, 34), D.rnd(10, 14)), 2.6);
}
// a wall of rounded stones, drawn only inside the rectangle
function stones(D, x, y, w, h, id) {
  D.raw(`<clipPath id="${id}"><path d="${rect(x, y, w, h)}"/></clipPath><g clip-path="url(#${id})">`);
  for (let yy = y + 4, row = 0; yy < y + h; yy += 30, row++) for (let xx = x - (row % 2) * 28; xx < x + w; xx += D.rnd(52, 66)) D.shape(rrect(xx + 3, yy + 3, D.rnd(42, 54), 22, 10), 2.2);
  D.raw('</g>');
}
// Zanzibar-style window: arch top, shutters, a sill a bag can sit on
function swWindow(D, x, y, w, h, { spot = true, bars = true } = {}) {
  const r = w / 2;
  D.shape(`M${f(x - 8)} ${f(y + h + 10)}V${f(y + r)}A${f(r + 8)} ${f(r + 8)} 0 0 1 ${f(x + w + 8)} ${f(y + r)}V${f(y + h + 10)}Z`);
  D.shape(`M${f(x)} ${f(y + h)}V${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}V${f(y + h)}Z`);
  if (bars) { D.line(`M${f(x + w / 2)} ${f(y)}V${f(y + h)}M${f(x)} ${f(y + r + (h - r) / 2)}H${f(x + w)}`, 2.4); D.line(spiral(x + w / 2, y + r * .55, r * .3, 1.4), 2); }
  D.shape(rect(x - 14, y + h, w + 28, 12));
  if (spot) D.on(x + w / 2 + D.rnd(-w * .15, w * .15), y + h, Math.min(64, w * .9), D.rnd(-8, 8));
}
function carvedDoor(D, x, y, w, h) {
  D.shape(`M${f(x - 16)} ${f(y + h)}V${f(y + w * .5)}A${f(w / 2 + 16)} ${f(w / 2 + 16)} 0 0 1 ${f(x + w + 16)} ${f(y + w * .5)}V${f(y + h)}Z`);
  D.shape(`M${f(x)} ${f(y + h)}V${f(y + w * .5)}A${f(w / 2)} ${f(w / 2)} 0 0 1 ${f(x + w)} ${f(y + w * .5)}V${f(y + h)}Z`);
  D.line(`M${f(x + w / 2)} ${f(y)}V${f(y + h)}`);
  for (let yy = y + w * .55; yy < y + h - 10; yy += 34) for (const xx of [x + w * .25, x + w * .75]) D.shape(ellipse(xx, yy, 5, 5), 2);
  D.line(spiral(x + w / 2, y + w * .32, w * .18, 1.6), 2.2);
}
function palm(D, x, base, h, lean = 1) {
  const top = [x + lean * h * .18, base - h];
  D.shape(`M${f(x - 18)} ${f(base)}Q${f(x + lean * h * .08 - 10)} ${f(base - h * .5)} ${f(top[0] - 9)} ${f(top[1])}L${f(top[0] + 9)} ${f(top[1])}Q${f(x + lean * h * .08 + 12)} ${f(base - h * .5)} ${f(x + 18)} ${f(base)}Z`);
  for (let t = .06; t < .95; t += .07) { const yy = base - h * t, xx = x + lean * h * .18 * t * t + lean * h * .02 * t; D.line(`M${f(xx - 15 + t * 6)} ${f(yy)}q${f(15 - t * 6)} 8 ${f(30 - t * 12)} 0`, 2.2); }
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * .48 + D.rnd(-.1, .1), len = D.rnd(150, 210), ex = top[0] + Math.cos(a) * len, ey = top[1] + Math.sin(a) * len * .55 + len * .35;
    const mx = top[0] + Math.cos(a) * len * .5, my = top[1] + Math.sin(a) * len * .5 - 30;
    D.shape(`M${f(top[0])} ${f(top[1])}Q${f(mx - 24)} ${f(my - 20)} ${f(ex)} ${f(ey)}Q${f(mx + 18)} ${f(my + 26)} ${f(top[0])} ${f(top[1])}Z`);
    D.line(`M${f(top[0])} ${f(top[1])}Q${f(mx)} ${f(my)} ${f(ex)} ${f(ey)}`, 2);
  }
  for (const dx of [-16, 4, 20]) D.shape(ellipse(top[0] + dx, top[1] + 14, 13, 13));
  D.on(top[0] + D.rnd(-30, 30), top[1] + 6, 58, D.rnd(-15, 15));
}
function awning(D, x, y, w, h, stripes = 7) {
  const sw = w / stripes;
  D.shape(`M${f(x)} ${f(y)}H${f(x + w)}L${f(x + w + 20)} ${f(y + h)}H${f(x - 20)}Z`);
  for (let i = 1; i < stripes; i++) D.line(`M${f(x + sw * i)} ${f(y)}L${f(x - 20 + (w + 40) / stripes * i)} ${f(y + h)}`, 2.4);
  let d = `M${f(x - 20)} ${f(y + h)}`; const n = stripes * 2, bw = (w + 40) / n;
  for (let i = 0; i < n; i++) d += `a${f(bw / 2)} ${f(bw / 2)} 0 0 0 ${f(bw)} 0`;
  D.shape(d + 'Z');
  D.on(x + D.rnd(w * .2, w * .8), y, 62, D.rnd(-10, 10));
}
function basket(D, cx, base, w, fruit = 'round') {
  const h = w * .45;
  if (fruit === 'round') for (let i = 0; i < 7; i++) D.shape(ellipse(cx + (i - 3) * w * .13, base - h - D.rnd(4, 18) - (i % 2) * 14, w * .1, w * .1));
  else for (let i = 0; i < 4; i++) D.shape(`M${f(cx - w * .35 + i * w * .2)} ${f(base - h)}q${f(w * .1)} ${f(-w * .5)} ${f(w * .3)} ${f(-w * .46)}q${f(-w * .14)} ${f(w * .1)} ${f(-w * .2)} ${f(w * .46)}Z`);
  D.shape(`M${f(cx - w / 2)} ${f(base - h)}H${f(cx + w / 2)}L${f(cx + w * .4)} ${f(base)}H${f(cx - w * .4)}Z`);
  for (let i = 1; i < 4; i++) D.line(`M${f(cx - w / 2 + w * .02 * i)} ${f(base - h + h * i / 4)}H${f(cx + w / 2 - w * .02 * i)}`, 2);
}
function crate(D, x, y, w, h) {
  D.shape(rect(x, y, w, h));
  for (let i = 1; i < 4; i++) D.line(`M${f(x)} ${f(y + h * i / 4)}H${f(x + w)}`, 2.2);
  D.line(`M${f(x + 6)} ${f(y)}V${f(y + h)}M${f(x + w - 6)} ${f(y)}V${f(y + h)}`, 2.2);
}
function lamp(D, x, base, h) {
  D.shape(rect(x - 7, base - h, 14, h));
  D.shape(rect(x - 20, base - 16, 40, 16));
  D.shape(`M${f(x - 26)} ${f(base - h)}L${f(x - 18)} ${f(base - h - 62)}H${f(x + 18)}L${f(x + 26)} ${f(base - h)}Z`);
  D.line(`M${f(x)} ${f(base - h)}V${f(base - h - 62)}`, 2.2);
  D.shape(`M${f(x - 30)} ${f(base - h - 62)}Q${f(x)} ${f(base - h - 100)} ${f(x + 30)} ${f(base - h - 62)}Z`);
}
function bird(D, x, y, s = 16) { D.line(`M${f(x - s)} ${f(y)}q${f(s / 2)} ${f(-s / 2)} ${f(s)} 0q${f(s / 2)} ${f(-s / 2)} ${f(s)} 0`, 2.4); }
function sun(D, x, y, r) {
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; D.line(`M${f(x + Math.cos(a) * (r + 12))} ${f(y + Math.sin(a) * (r + 12))}L${f(x + Math.cos(a) * (r + 34))} ${f(y + Math.sin(a) * (r + 34))}`); }
  D.shape(ellipse(x, y, r, r)); D.line(spiral(x, y, r * .7, 2.2), 2.4);
}
function pot(D, cx, base, w) {
  D.shape(`M${f(cx - w / 2)} ${f(base - w * .7)}H${f(cx + w / 2)}L${f(cx + w * .38)} ${f(base)}H${f(cx - w * .38)}Z`);
  D.shape(rect(cx - w * .56, base - w * .78, w * 1.12, w * .14));
}
function leafy(D, cx, base, w, n = 6) {
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i - (n - 1) / 2) * .42, len = w * D.rnd(.8, 1.15), ex = cx + Math.cos(a) * len, ey = base + Math.sin(a) * len;
    D.shape(`M${f(cx)} ${f(base)}Q${f(cx + Math.cos(a - .35) * len * .6)} ${f(base + Math.sin(a - .35) * len * .6)} ${f(ex)} ${f(ey)}Q${f(cx + Math.cos(a + .35) * len * .6)} ${f(base + Math.sin(a + .35) * len * .6)} ${f(cx)} ${f(base)}Z`);
    D.line(`M${f(cx)} ${f(base)}L${f(ex)} ${f(ey)}`, 1.8);
  }
}

// ---------- scene 1: a Kariakoo street
function kariakoo() {
  const D = canvas('kariakoo');
  sun(D, 150, 130, 54);
  cloud(D, 480, 110, 300); cloud(D, 900, 70, 240); cloud(D, 1110, 210, 200); cloud(D, 300, 260, 200);
  bird(D, 700, 150); bird(D, 740, 175, 12); bird(D, 640, 190, 13);
  // buildings, back to front
  const blds = [[0, 380, 420], [790, 400, 410], [400, 290, 400]];
  blds.forEach(([x, top, w], k) => {
    const bottom = 1000;
    D.shape(rect(x, top, w, bottom - top));
    stones(D, x, top + 30, w, bottom - top - 30, 'st' + k);
    // parapet with crenellations
    let d = `M${x - 10} ${top + 30}V${top}`; for (let xx = x - 10; xx < x + w + 10; xx += 40) d += `H${xx + 20}v-18h20v18`;
    D.shape(d + `V${top + 30}Z`);
    D.on(x + D.rnd(60, w - 60), top - 18, 64, D.rnd(-8, 8));
    const cols = Math.floor(w / 130);
    for (let row = 0; row < 2; row++) for (let c = 0; c < cols; c++) {
      const ww = 70, gx = x + (w - cols * 130) / 2 + c * 130 + 30;
      swWindow(D, gx, top + 70 + row * 210, ww, 130, { spot: true });
    }
    if (k === 2) { // balcony
      D.shape(rect(x + 30, top + 300, w - 60, 16));
      for (let xx = x + 44; xx < x + w - 40; xx += 26) D.line(`M${xx} ${top + 316}V${top + 372}`, 2.4);
      D.shape(rect(x + 30, top + 368, w - 60, 12));
      D.on(x + w * .3, top + 300, 64, -6); D.on(x + w * .72, top + 300, 64, 6);
    }
  });
  carvedDoor(D, 550, 770, 110, 230);
  palm(D, 385, 1010, 520, -1); palm(D, 1130, 1020, 480, -1);
  D.shape(rect(0, 1000, W, H - 1000)); D.line(`M0 1150H${W}`);
  cobbles(D, 1170, H);
  // stalls
  for (const [x, w] of [[30, 360], [790, 380]]) {
    D.shape(rect(x + 10, 870, 10, 200)); D.shape(rect(x + w - 20, 870, 10, 200));
    awning(D, x, 830, w, 70, 7);
    D.shape(rect(x - 10, 1040, w + 20, 22)); D.shape(rect(x, 1062, w, 70));
    for (let i = 0; i < 4; i++) D.line(`M${x} ${1080 + i * 14}H${x + w}`, 1.8);
    basket(D, x + w * .2, 1040, 100, 'round'); basket(D, x + w * .52, 1040, 90, 'long'); basket(D, x + w * .82, 1040, 90, 'round');
    D.on(x + w * .36, 1040, 62, 0); D.on(x + w * .68, 1040, 60, 0);
  }
  // bajaji
  const bx = 470, by = 1240;
  D.shape(`M${bx} ${by - 30}V${by - 150}Q${bx} ${by - 200} ${bx + 60} ${by - 205}H${bx + 210}Q${bx + 250} ${by - 205} ${bx + 250} ${by - 160}V${by - 30}Z`);
  D.shape(`M${bx - 6} ${by - 190}Q${bx + 120} ${by - 260} ${bx + 258} ${by - 196}V${by - 176}H${bx - 6}Z`);
  D.shape(rect(bx + 30, by - 160, 90, 70)); D.shape(rect(bx + 135, by - 160, 90, 70));
  D.line(`M${bx} ${by - 80}H${bx + 250}`);
  for (const wx of [bx + 50, bx + 210]) { D.shape(ellipse(wx, by - 22, 34, 34)); D.shape(ellipse(wx, by - 22, 12, 12)); }
  D.on(bx + 125, by - 228, 62, 0);
  // things on the street
  lamp(D, 1060, 1380, 300); D.on(1060, 1380 - 300 - 80, 56, 0);
  cloud(D, 720, 300, 180); cloud(D, 1040, 330, 150, false); bird(D, 900, 260, 14); bird(D, 240, 360, 12);
  bush(D, 110, 1260, 240, 150); bush(D, 1120, 1300, 200, 130); bush(D, 300, 1600, 300, 170); bush(D, 900, 1600, 330, 180);
  crate(D, 560, 1350, 120, 90); crate(D, 690, 1380, 100, 70); D.on(620, 1350, 60, 4); D.on(740, 1380, 58, -4);
  basket(D, 160, 1440, 120, 'long'); D.on(160, 1440 - 54 - 50, 56, 10);
  pot(D, 460, 1520, 70); leafy(D, 460, 1465, 110, 7);
  return { id: 'kariakoo', name: { sw: 'Mtaa wa Kariakoo', en: 'Kariakoo street' }, D };
}

// ---------- scene 2: a coffee farm on Kilimanjaro
function shamba() {
  const D = canvas('shamba');
  // the mountain with its snow cap
  D.shape('M-20 560L260 330Q360 250 450 205Q560 170 660 200Q760 240 860 320L1220 560Z');
  D.shape('M450 205Q560 170 660 200Q700 222 735 245L700 270L660 245L620 280L575 248L530 285L495 250L455 275L420 240L398 232Q420 215 450 205Z');
  D.line('M330 300Q380 330 360 380M800 300Q760 340 790 400M600 300Q590 360 620 420M250 380Q300 420 270 470M900 380Q860 430 920 480M470 320Q440 380 480 440M720 330Q760 390 730 450', 2.4);
  for (let x = 40; x < W; x += 46) { const y = 540; D.shape(`M${x - 22} ${y + 20}L${x} ${y - 34 - (x % 3) * 8}L${x + 22} ${y + 20}Z`, 2.2); D.line(`M${x} ${y + 20}v10`, 2); }
  cloud(D, 180, 140, 260); cloud(D, 1000, 120, 300); cloud(D, 560, 80, 200, false);
  sun(D, 1080, 300, 40);
  bird(D, 360, 150); bird(D, 400, 170, 12); bird(D, 760, 120, 14);
  // hills with rows of coffee bushes
  const hills = [[520, 'M-20 600Q300 470 640 560T1220 520V720H-20Z'], [640, 'M-20 700Q400 600 760 660T1220 640V860H-20Z']];
  for (const [y, d] of hills) {
    D.shape(d);
    for (let x = 30, k = 0; x < W; x += 78, k++) bush(D, x, y + 120 + Math.sin(x / 140) * 20, 70, 46, { spot: k % 4 === (y > 600 ? 2 : 0), curls: false });
  }
  // the hut
  D.shape('M70 1040V820H430V1040Z');
  stones(D, 70, 820, 360, 220, 'hut');
  D.shape('M30 840L250 620L470 840Z');
  for (let i = 1; i < 9; i++) D.line(`M250 620L${30 + i * 49} 840`, 2);
  for (let y = 680; y < 840; y += 30) D.line(`M${250 - (y - 620) * .98} ${y}H${250 + (y - 620) * .98}`, 1.8);
  D.on(250, 652, 60, 0); D.on(150, 760, 58, -40); D.on(360, 770, 58, 40);
  carvedDoor(D, 210, 900, 80, 140);
  swWindow(D, 100, 880, 60, 90); swWindow(D, 340, 880, 60, 90);
  // banana plants
  for (const [x, base] of [[1040, 1040], [880, 1000]]) {
    D.shape(`M${x - 14} ${base}Q${x - 8} ${base - 160} ${x} ${base - 260}Q${x + 8} ${base - 160} ${x + 14} ${base}Z`);
    for (let i = 0; i < 6; i++) {
      const side = i % 2 ? 1 : -1, len = D.rnd(170, 220), bx = x, by = base - 250;
      const tx = bx + side * len * D.rnd(.75, .95), ty = by - len * (i < 2 ? .55 : i < 4 ? .2 : -.15);
      const mx = (bx + tx) / 2, my = (by + ty) / 2 - 50, nx = -(ty - by) / len, ny = (tx - bx) / len, wd = 34;
      D.shape(`M${bx} ${by}Q${f(mx + nx * wd)} ${f(my + ny * wd)} ${f(tx)} ${f(ty)}Q${f(mx - nx * wd)} ${f(my - ny * wd)} ${bx} ${by}Z`);
      D.line(`M${bx} ${by}Q${f(mx)} ${f(my)} ${f(tx)} ${f(ty)}`, 1.8);
      for (let k = 1; k < 5; k++) { const t = k / 5, px = (1 - t) ** 2 * bx + 2 * (1 - t) * t * mx + t * t * tx, py = (1 - t) ** 2 * by + 2 * (1 - t) * t * my + t * t * ty; D.line(`M${f(px)} ${f(py)}l${f(nx * 18)} ${f(ny * 18)}`, 1.6); }
    }
    D.on(x + D.rnd(-20, 20), base - 280, 56, 0);
  }
  // drying beds with beans
  for (const [x, w] of [[470, 360], [520, 300]].slice(0, 1)) {
    D.shape(rect(x, 1060, w, 24)); D.shape(rect(x - 10, 1040, w + 20, 22));
    for (let i = 0; i < 70; i++) D.shape(ellipse(x + D.rnd(10, w - 10), 1030 - D.rnd(0, 14), 6, 4), 1.6);
    for (const lx of [x + 10, x + w - 20]) D.shape(rect(lx, 1084, 10, 90));
    D.on(x + w * .3, 1030, 60, 0); D.on(x + w * .75, 1030, 60, 0);
  }
  // fence along the path
  D.line('M0 1150H1200');
  for (let x = 20, k = 0; x < W; x += 90, k++) { D.shape(rect(x, 1100, 16, 90)); if (k % 3 === 1) D.on(x + 8, 1100, 50, 0); }
  D.shape(rect(0, 1120, W, 12)); D.shape(rect(0, 1160, W, 12));
  // the path and the big coffee bushes in front, heavy with cherries
  D.shape('M480 1600Q560 1400 600 1190H700Q720 1400 840 1600Z');
  for (let y = 1220; y < 1590; y += 50) D.shape(ellipse(650 + (y - 1190) * .3 * (D.R() - .5), y, 24 + (y - 1190) / 30, 9), 2);
  for (const [x, base, w, h] of [[200, 1450, 360, 260], [1010, 1450, 340, 250], [110, 1650, 300, 200], [1100, 1650, 300, 200], [420, 1640, 200, 140]]) {
    bush(D, x, base, w, h);
    for (let i = 0; i < 9; i++) { const cx = x + D.rnd(-w * .35, w * .35), cy = base - D.rnd(h * .2, h * .7); for (let k = 0; k < 3; k++) D.shape(ellipse(cx + k * 11 - 11, cy + (k % 2) * 7, 7, 7), 2); }
  }
  basket(D, 640, 1560, 140, 'round'); D.on(560, 1580, 62, -12);
  return { id: 'shamba', name: { sw: 'Shamba la Kahawa', en: 'Coffee farm on Kilimanjaro' }, D };
}

// ---------- scene 3: inside an HZE café
function cafe() {
  const D = canvas('cafe');
  // back wall planks
  for (let x = 0; x < W; x += 120) { D.line(`M${x} 0V820`, 1.6); for (let k = 0; k < 6; k++) { const y = D.rnd(30, 780); D.line(`M${f(x + D.rnd(20, 60))} ${f(y)}q${f(D.rnd(10, 30))} ${f(D.rnd(-8, 8))} ${f(D.rnd(30, 50))} 0`, 1.4); } }
  for (const x of [380, 820]) { D.line(`M${x} 0V70`); pot(D, x, 130, 50); for (let k = 0; k < 4; k++) D.line(`M${x - 18 + k * 12} 120q${f(D.rnd(-30, 30))} 80 ${f(D.rnd(-20, 20))} ${f(D.rnd(120, 180))}`, 2); }
  // windows looking out at the street
  for (const x of [60, 880]) {
    D.shape(`M${x} 560V200A130 130 0 0 1 ${x + 260} 200V560Z`);
    cloud(D, x + 130, 190, 160, false);
    palm(D, x + 210, 560, 260, -1);
    D.line(`M${x + 130} 70V560M${x} 330H${x + 260}`, 4);
    D.shape(rect(x - 20, 560, 300, 18));
    D.on(x + 70, 560, 60, 0); D.on(x + 200, 560, 58, 0);
  }
  // chalkboard menu
  D.shape(rect(440, 120, 320, 220), 4); D.shape(rect(456, 136, 288, 188));
  for (let i = 0; i < 5; i++) D.line(`M480 ${170 + i * 32}h${D.rnd(120, 230)}`, 2);
  D.on(600, 120, 58, 0);
  // shelves with jars, cups and plants
  for (const [x, y, w] of [[400, 420, 400], [420, 560, 360], [60, 650, 260], [880, 650, 260]]) {
    D.shape(rect(x, y, w, 16));
    D.line(`M${x + 20} ${y + 16}l20 30M${x + w - 20} ${y + 16}l-20 30`);
    const items = Math.floor(w / 80);
    for (let i = 0; i < items; i++) {
      const cx = x + 40 + i * (w - 80) / Math.max(1, items - 1), kind = (i + Math.round(y / 10)) % 3;
      if (kind === 0) { D.shape(rrect(cx - 26, y - 70, 52, 70, 8)); D.shape(rect(cx - 30, y - 84, 60, 16)); for (let k = 0; k < 5; k++) D.shape(ellipse(cx - 12 + (k % 3) * 12, y - 20 - Math.floor(k / 3) * 18, 5, 3.5), 1.6); }
      else if (kind === 1) { D.shape(`M${cx - 22} ${y - 46}H${cx + 22}L${cx + 18} ${y}H${cx - 18}Z`); D.line(`M${cx + 21} ${y - 38}a12 12 0 0 1 0 24`); D.shape(`M${cx - 18} ${y - 92}H${cx + 18}L${cx + 15} ${y - 50}H${cx - 15}Z`); }
      else { pot(D, cx, y, 46); leafy(D, cx, y - 34, 56, 5); }
    }
    for (let k = 0; k < Math.max(1, Math.floor(w / 180)); k++) D.on(x + 70 + k * (w - 120) / Math.max(1, Math.floor(w / 180)) + D.rnd(0, 40), y, 58, D.rnd(-6, 6));
  }
  // pendant lamps
  for (const x of [300, 600, 900]) { D.line(`M${x} 0V90`); D.shape(`M${x - 50} 150Q${x - 46} 90 ${x} 90Q${x + 46} 90 ${x + 50} 150Z`); D.shape(ellipse(x, 158, 16, 10)); }
  // the counter with the espresso machine and grinder
  D.shape(rect(0, 820, W, 30)); D.shape(rect(20, 850, W - 40, 300));
  for (let x = 20; x < W - 20; x += 116) { D.shape(rrect(x + 14, 880, 88, 240, 10), 2.4); D.shape(ellipse(x + 58, 1000, 24, 34), 2); D.line(`M${x + 64} 970c-16 20 16 40 -2 60`, 2); D.line(spiral(x + 58, 920, 14, 1.5), 1.8); D.line(spiral(x + 58, 1080, 14, 1.5, -1), 1.8); }
  // stools along the counter
  for (const x of [150, 420, 780, 1050]) { D.shape(rect(x - 6, 1050, 12, 190)); D.shape(rect(x - 40, 1170, 80, 8)); D.shape(ellipse(x, 1040, 50, 14)); D.on(x, 1030, 60, D.rnd(-8, 8)); }
  D.shape(rrect(440, 640, 300, 180, 16)); D.shape(rect(460, 660, 260, 60));
  for (const gx of [500, 640]) { D.shape(rect(gx - 30, 720, 60, 26)); D.line(`M${gx} 746v28`); D.shape(`M${gx - 22} 790H${gx + 22}L${gx + 18} 820H${gx - 18}Z`); }
  D.shape(ellipse(590, 690, 22, 22)); D.line(spiral(590, 690, 16, 1.6), 2);
  D.on(530, 640, 60, 0); D.on(660, 640, 60, 0);
  D.shape('M820 820V700L860 640H900L940 700V820Z'); D.shape('M845 640L860 560H900L915 640Z');
  D.on(260, 820, 62, 0); D.on(1020, 820, 62, 0); D.on(150, 820, 60, 0);
  // cups on the counter
  for (const x of [330, 380]) { D.shape(`M${x - 18} 784H${x + 18}L${x + 14} 820H${x - 14}Z`); D.line(`M${x + 17} 792a9 9 0 0 1 0 18`); }
  // the floor and tables
  D.line('M0 1150H1200');
  for (let y = 1150, r = 0; y < H; y += 56, r++) for (let x = (r % 2) * 56; x < W; x += 112) { D.shape(rect(x, y, 56, 56), 1.6); D.line(`M${x + 28} ${y + 10}l18 18l-18 18l-18-18Z`, 1.4); }
  for (const [x, y] of [[300, 1400], [880, 1440]]) {
    for (const dx of [-170, 170]) {
      D.shape(rect(x + dx - 50, y - 160, 100, 14));
      D.shape(rect(x + dx - 50, y - 50, 100, 18));
      D.shape(rect(x + dx - 44, y - 146, 8, 96)); D.shape(rect(x + dx + 36, y - 146, 8, 96));
      for (const lx of [x + dx - 44, x + dx + 36]) D.shape(rect(lx, y - 32, 8, 120));
      D.on(x + dx, y - 50, 60, D.rnd(-6, 6));
    }
    D.shape(rect(x - 12, y - 80, 24, 220)); D.shape(ellipse(x, y + 140, 70, 14));
    D.shape(ellipse(x, y - 90, 150, 26));
    D.shape(`M${x - 40} ${y - 128}H${x - 4}L${x - 8} ${y - 96}H${x - 36}Z`); D.shape(ellipse(x + 50, y - 96, 26, 8));
    D.on(x + 60, y - 100, 58, 0);
  }
  // big plants in the corners
  for (const [x, base] of [[90, 1560], [1110, 1560]]) { pot(D, x, base, 120); leafy(D, x, base - 92, 220, 9); D.spot(x, base - 200, 62, D.rnd(-15, 15)); }
  bush(D, 600, 1620, 260, 120, { spot: true });
  return { id: 'cafe', name: { sw: 'Ndani ya Kahawa ya HZE', en: 'Inside the HZE café' }, D };
}

const outPics = path.resolve(HERE, '../../game/kahawa/scenes'), outData = path.join(HERE, 'scenes');
fs.mkdirSync(outPics, { recursive: true }); fs.mkdirSync(outData, { recursive: true });
for (const make of [kariakoo, shamba, cafe]) {
  const { id, name, D } = make();
  // keep spots inside the picture
  const spots = D.spots.filter(s => s.x > s.s * .4 && s.x < W - s.s * .4 && s.y > s.s * .55 && s.y < H - s.s * .55);
  fs.writeFileSync(path.join(outPics, id + '.svg'), D.svg());
  fs.writeFileSync(path.join(outData, id + '.json'), JSON.stringify({ id, name, image: `scenes/${id}.svg`, w: W, h: H, line: LINE, spots }, null, 1));
  console.log(`${id}: ${spots.length} hiding spots`);
}
