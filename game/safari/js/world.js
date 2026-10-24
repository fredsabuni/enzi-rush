// World: the Dar es Salaam backdrop for each zone (sky, buildings, traffic, sidewalk).
// World units: the sidewalk the player rides on is at GY; x grows to the right. camX = left edge of view.
const FAR = 1080, ROAD0 = 1110, ROAD1 = 1335, NPCY = 1452, GY = 1545, WORLD_H = 1920;
let camX = 0, VIEW_W = 1500;
const wx = x => x - camX;

const ZONES = [
  { name: 'KARIAKOO', sub: 'Sokoni · the market', sky: ['#4d68ad', '#a58fbd', '#f0ab82', '#fbd49a'], walk: ['#c9b394', '#b8a080'], far: '#7a5f8f' },
  { name: 'POSTA', sub: 'Mjini · downtown', sky: ['#5aa3d8', '#9fcbe8', '#f2d6b2', '#fbe7c8'], walk: ['#d8cbb6', '#c2b399'], far: '#8fa3bd' },
  { name: 'COCO BEACH', sub: 'Baharini · by the sea', sky: ['#3f93d0', '#8cc6ea', '#f6dcb4', '#fde9c6'], walk: ['#e8c99a', '#d6b07a'], far: '#7f93b8' },
  { name: 'VICTORIA', sub: 'Mtaani · the buzz', sky: ['#e0866e', '#f2a46a', '#f8c98a', '#fde2b0'], walk: ['#d6c3a0', '#bea984'], far: '#a5708a' },
];
const SHOPSIGNS = ['DUKA LA VITENGE', 'SIMU & CHAJA', 'WAKALA', 'HOTELI · CHAI', 'VIFAA VYA UJENZI', 'MAMA NTILIE', 'KINYOZI', 'NGUO MPYA', 'DAWA'];
const VSIGNS = ['VICTORIA PLAZA', 'SALUNI', 'MAMA LISHE', 'SIMU POINT', 'DUKA LA DAWA', 'FASHION', 'JUICE BAR', 'STATIONERY', 'MITUMBA'];

let WZ = 0, FAC = [], PROPS = [], CARS = [], PEDS = [];
function buildWorld(zone, len) {
  WZ = zone; FAC = []; PROPS = []; CARS = []; PEDS = [];
  let x = -900, i = zone * 100;
  while (x < len + 2400) {
    let w;
    if (zone === 0) { w = 230 + rnd(i) * 140; FAC.push({ x, w, h: 300 + rnd(i + 1) * 170, col: ['#2B7A6E', '#e8b830', '#d6604f', '#efe0c0', '#7fb5d5', '#e98b5a', '#9a6fb0'][Math.floor(rnd(i + 2) * 7)], i }); }
    else if (zone === 1) { w = 260 + rnd(i) * 160; FAC.push({ x, w, h: 560 + rnd(i + 1) * 380, col: ['#7fa7c4', '#5f8fb0', '#a7c1d1', '#d9cbb3', '#8fb7c9'][Math.floor(rnd(i + 2) * 5)], i }); w += 20; }
    else if (zone === 2) w = 400;
    else { w = 240 + rnd(i) * 150; FAC.push({ x, w, h: 340 + rnd(i + 1) * 200, col: ['#f2b134', '#e2554a', '#3aa6a0', '#f4ede0', '#5b8bd6', '#ef8a3c', '#c76bb0'][Math.floor(rnd(i + 2) * 7)], i }); }
    x += w; i++;
  }
  x = -400; i = zone * 50;
  while (x < len + 1500) { PROPS.push({ x, i, kind: zone === 0 ? (i % 3 === 0 ? 'lamp' : 'stall') : zone === 1 ? (i % 2 ? 'lamp' : 'tree') : zone === 2 ? (i % 3 === 2 ? 'lamp' : 'palm') : (i % 2 ? 'jacaranda' : 'lamp') }); x += zone === 2 ? 420 + rnd(i) * 160 : 560 + rnd(i) * 240; i++; }
  const n = Math.ceil((len + 6000) / 480);
  for (let k = 0; k < n; k++) { const dir = k % 2 ? 1 : -1; CARS.push({ x0: -1500 + k * 480 + rnd(k) * 300, v: dir * (180 + rnd(k + 3) * 260), lane: dir > 0 ? 1 : 0, type: ['daladala', 'bajaji', 'boda', 'car', 'daladala', 'bajaji'][k % 6], col: ['#e8b830', '#2a7ab8', '#d6604f', '#efefef', '#2B7A6E'][Math.floor(rnd(k + 7) * 5)], i: k }); }
  if (zone !== 2) for (let k = 0; k < len / 240; k++) PEDS.push({ x0: -600 + k * 240 + rnd(k) * 200, v: (rnd(k + 2) > .5 ? 1 : -1) * (40 + rnd(k) * 50), i: k });
}

function skyGrad(pal) { const g = ctx.createLinearGradient(0, 0, 0, FAR); g.addColorStop(0, pal[0]); g.addColorStop(.45, pal[1]); g.addColorStop(.8, pal[2]); g.addColorStop(1, pal[3]); return g; }
function sky(t) {
  const Z = ZONES[WZ];
  ctx.fillStyle = Z.sky[0]; ctx.fillRect(0, -2000, VIEW_W, 2000);
  ctx.fillStyle = skyGrad(Z.sky); ctx.fillRect(0, 0, VIEW_W, FAR + 4);
  const sx = VIEW_W * .72, sy = WZ === 3 ? 640 : 330, sg = ctx.createRadialGradient(sx, sy, 20, sx, sy, 420); sg.addColorStop(0, 'rgba(255,236,170,.85)'); sg.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = sg; ctx.fillRect(0, sy - 420, VIEW_W, 840); circ(sx, sy, 95, '#fff0c0');
  for (let i = 0; i < 8; i++) { const w = 260 + rnd(i) * 300, x = ((rnd(i + 3) * 2400 - camX * .12 + t * 14) % 2200 + 2200) % 2200 - 500, y = 300 + rnd(i + 9) * 420;
    ctx.fillStyle = 'rgba(255,255,255,.6)'; rr(x, y, w, 30, 15); ctx.fill(); rr(x + w * .2, y - 26, w * .45, 34, 17); ctx.fill(); }
}
function farSkyline() {
  if (WZ === 2) return;
  const off = -camX * .18; ctx.fillStyle = ZONES[WZ].far;
  for (let i = 0; i < 70; i++) { const w = 50 + rnd(i) * 70, h = 60 + rnd(i + 7) * (WZ === 1 ? 380 : 200), x = ((i * 85 + off) % 5950 + 5950) % 5950 - 600; ctx.fillRect(x, FAR - 80 - h, w, h + 80); }
}
function sea(t) { // Coco Beach: sea, dhows, the bridge on the skyline
  const off = -camX * .08; ctx.fillStyle = '#6f7fa8';
  for (let i = 0; i < 30; i++) { const w = 34 + rnd(i) * 40, h = 30 + rnd(i + 4) * 110; ctx.fillRect(((i * 62 + off) % 1860 + 1860) % 1860 - 300, 900 - h, w, h); }
  ctx.strokeStyle = '#6f7fa8'; const bx = ((700 + off) % 1900 + 1900) % 1900 - 300; ctx.fillRect(bx - 250, 880, 600, 7);
  for (const tx of [bx - 60, bx + 190]) { ctx.fillRect(tx - 4, 770, 8, 120); ctx.lineWidth = 1.5; for (let k = 1; k <= 7; k++) { ctx.beginPath(); ctx.moveTo(tx, 775 + k * 6); ctx.lineTo(tx - k * 16, 884); ctx.moveTo(tx, 775 + k * 6); ctx.lineTo(tx + k * 16, 884); ctx.stroke(); } }
  const sg = ctx.createLinearGradient(0, 900, 0, FAR); sg.addColorStop(0, '#9fd3e6'); sg.addColorStop(1, '#2f87a8'); ctx.fillStyle = sg; ctx.fillRect(0, 900, VIEW_W, FAR - 900);
  for (let i = 0; i < 46; i++) { const yy = 905 + rnd(i) * 150, xx = ((rnd(i + 1) * 1700 - camX * .3 + Math.sin(t * 2 + i) * 20) % 1700 + 1700) % 1700 - 200; ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(xx, yy, 30 + rnd(i + 2) * 60, 3); }
  for (let k = 0; k < 4; k++) { const x = ((k * 480 + t * 18 - camX * .3) % 1900 + 1900) % 1900 - 300, y = 950 + k * 18, s = .7 + k * .15;
    ctx.fillStyle = '#3b2a3e'; ctx.beginPath(); ctx.moveTo(x - 50 * s, y); ctx.lineTo(x + 55 * s, y); ctx.lineTo(x + 38 * s, y + 13 * s); ctx.lineTo(x - 38 * s, y + 13 * s); ctx.fill();
    ctx.fillStyle = '#fbf3e4'; ctx.beginPath(); ctx.moveTo(x - 8 * s, y - 2); ctx.lineTo(x + 2 * s, y - 85 * s); ctx.lineTo(x + 50 * s, y - 4); ctx.fill(); }
  for (let k = 0; k < 5; k++) { const x = ((k * 230 + t * 60) % 1700) - 100, y = 640 + Math.sin(t * 1.5 + k) * 30 + k * 25, f = Math.sin(t * 9 + k) * 10; line([[x - 18, y - f], [x, y], [x + 18, y - f]], 4, 'rgba(60,50,70,.7)'); }
  ctx.fillStyle = '#f0d9a8'; ctx.fillRect(0, FAR - 26, VIEW_W, 40);
  for (let k = 0; k < 40; k++) { const ux = wx(300 + k * 620); if (ux < -100 || ux > VIEW_W + 100) continue; line([[ux, FAR - 10], [ux, FAR - 90]], 4, '#6b4a2e'); ctx.fillStyle = ['#d6604f', '#e8b830', '#2B7A6E'][k % 3]; ctx.beginPath(); ctx.arc(ux, FAR - 88, 48, Math.PI, 0); ctx.fill(); }
}
function facade(f, t) {
  const x = wx(f.x); if (x > VIEW_W + 50 || x + f.w < -50) return;
  const top = FAR - f.h;
  if (WZ === 0 || WZ === 3) {
    ctx.fillStyle = f.col; ctx.fillRect(x, top, f.w, f.h);
    ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(x + f.w - 18, top, 18, f.h); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x, top, f.w, 14);
    const floors = Math.floor((f.h - 150) / 110);
    for (let fl = 0; fl < floors; fl++) { const y = top + 40 + fl * 110;
      for (let k = 0; k < 3; k++) { ctx.fillStyle = '#3d2c3a'; rr(x + 22 + k * (f.w - 44) / 3, y, (f.w - 44) / 3 - 18, 62, [20, 20, 2, 2]); ctx.fill(); }
      ctx.fillStyle = 'rgba(40,25,30,.6)'; ctx.fillRect(x + 10, y + 70, f.w - 20, 8); }
    if (f.i % 2 === 0 && floors > 0) for (let k = 0; k < 4; k++) { ctx.fillStyle = ['#e8b830', '#d6604f', '#2B7A6E', '#9a6fb0'][(k + f.i) % 4]; const kx = x + 30 + k * (f.w - 60) / 4, sw = Math.sin(t * 3 + k + f.i) * 4; ctx.beginPath(); ctx.moveTo(kx, top + 30); ctx.lineTo(kx + 40, top + 30); ctx.lineTo(kx + 40 + sw, top + 100); ctx.lineTo(kx + sw, top + 100); ctx.fill(); }
    ctx.fillStyle = '#5b4a44'; ctx.fillRect(x + 14, FAR - 110, f.w - 28, 110); ctx.fillStyle = '#8a7a72'; for (let k = 0; k < 9; k++) ctx.fillRect(x + 14, FAR - 104 + k * 11, f.w - 28, 4);
    ctx.fillStyle = '#fff'; rr(x + 20, FAR - 150, f.w - 40, 38, 6); ctx.fill();
    text((WZ === 3 ? VSIGNS : SHOPSIGNS)[f.i % 9], x + f.w / 2, FAR - 130, { size: 24, color: f.col === '#efe0c0' || f.col === '#f4ede0' ? '#d6604f' : f.col });
    for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? '#fff' : (f.i % 2 ? C.red : C.teal); ctx.fillRect(x + 6 + k * (f.w - 12) / 8, FAR - 112, (f.w - 12) / 8 + 1, 22); }
  } else {
    ctx.fillStyle = f.col; ctx.fillRect(x, top, f.w, f.h); ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(x, top, f.w * .3, f.h);
    for (let y = top + 24; y < FAR - 90; y += 46) for (let k = 0; k < 5; k++) { ctx.fillStyle = rnd(f.i * 31 + y + k) > .3 ? 'rgba(30,50,80,.5)' : 'rgba(255,240,200,.7)'; ctx.fillRect(x + 16 + k * (f.w - 32) / 5, y, (f.w - 32) / 5 - 10, 30); }
    ctx.fillStyle = '#e8e2d6'; ctx.fillRect(x, FAR - 80, f.w, 80); ctx.fillStyle = 'rgba(40,60,90,.7)'; ctx.fillRect(x + 20, FAR - 66, f.w - 40, 66);
    if (f.i % 3 === 0) { ctx.fillStyle = C.red; ctx.fillRect(x + f.w / 2 - 3, top - 70, 6, 70); }
  }
}
function road() {
  ctx.fillStyle = WZ === 2 ? '#e6cfa0' : '#d9c9ad'; ctx.fillRect(0, FAR, VIEW_W, ROAD0 - FAR); ctx.fillStyle = '#b5a68c'; ctx.fillRect(0, ROAD0 - 6, VIEW_W, 6);
  const g = ctx.createLinearGradient(0, ROAD0, 0, ROAD1); g.addColorStop(0, '#6d6260'); g.addColorStop(1, '#585050'); ctx.fillStyle = g; ctx.fillRect(0, ROAD0, VIEW_W, ROAD1 - ROAD0);
  ctx.fillStyle = '#f2e7c4'; const off = ((-camX) % 160 + 160) % 160; for (let x = off - 160; x < VIEW_W; x += 160) ctx.fillRect(x, 1218, 90, 7);
  ctx.fillStyle = '#cfc2ae'; ctx.fillRect(0, ROAD1, VIEW_W, 16);
  const pal = ZONES[WZ].walk, sg = ctx.createLinearGradient(0, ROAD1 + 16, 0, WORLD_H); sg.addColorStop(0, pal[0]); sg.addColorStop(1, pal[1]); ctx.fillStyle = sg; ctx.fillRect(0, ROAD1 + 16, VIEW_W, 4000);
  ctx.strokeStyle = WZ === 2 ? 'rgba(255,230,190,.5)' : 'rgba(255,255,255,.28)'; ctx.lineWidth = 3;
  const tw = WZ === 2 ? 110 : 150, o2 = ((-camX) % tw + tw) % tw;
  for (let x = o2 - tw; x < VIEW_W + tw; x += tw) { ctx.beginPath(); ctx.moveTo(x, ROAD1 + 16); ctx.lineTo(x - 60, WORLD_H); ctx.stroke(); }
  for (const y of [1400, 1480, 1580, 1700, 1840]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEW_W, y); ctx.stroke(); }
}
function car(c, t) {
  const x = wx(c.x0 + c.v * t); if (x < -400 || x > VIEW_W + 400) return;
  const y = c.lane ? 1318 : 1232, dir = Math.sign(c.v), s = c.lane ? 1 : .86;
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
  const wheel = wx0 => { circ(wx0, -6, 26, '#222'); circ(wx0, -6, 11, '#aaa'); };
  if (c.type === 'daladala') {
    rr(-230, -190, 460, 170, 22); ctx.fillStyle = '#f2efe6'; ctx.fill(); ctx.fillStyle = c.col; ctx.fillRect(-230, -80, 460, 26); ctx.fillStyle = '#1f6fb2'; ctx.fillRect(-230, -54, 460, 12);
    for (let k = 0; k < 6; k++) { ctx.fillStyle = '#2e2a40'; rr(-205 + k * 66, -170, 54, 60, 8); ctx.fill(); circ(-180 + k * 66, -132, 12, 'rgba(110,70,50,.9)'); }
    ctx.save(); ctx.scale(dir, 1); text('POLE POLE NDIO MWENDO', 0, -96, { size: 22, color: C.red }); ctx.restore();
    ctx.fillStyle = '#7a6a5a'; ctx.fillRect(-200, -204, 400, 14); wheel(-150); wheel(150);
  } else if (c.type === 'bajaji') {
    ctx.fillStyle = c.col; ctx.beginPath(); ctx.moveTo(-90, -30); ctx.lineTo(-90, -140); ctx.quadraticCurveTo(-60, -175, 40, -170); ctx.quadraticCurveTo(95, -150, 100, -60); ctx.lineTo(100, -30); ctx.fill();
    ctx.fillStyle = '#2e2a40'; ctx.fillRect(-60, -140, 70, 60); circ(-25, -110, 13, 'rgba(110,70,50,.9)'); ctx.fillStyle = '#e8b830'; ctx.fillRect(-90, -60, 190, 12); wheel(-60); wheel(70);
  } else if (c.type === 'boda') {
    wheel(-70); wheel(75); ctx.fillStyle = '#d6604f'; rr(-60, -80, 120, 40, 14); ctx.fill(); ctx.fillStyle = '#222'; rr(-75, -95, 80, 18, 8); ctx.fill(); line([[60, -60], [85, -110]], 8, '#333');
    rr(-45, -175, 50, 85, 18); ctx.fillStyle = '#f2a02c'; ctx.fill(); circ(-18, -195, 28, '#e8b830');
    line([[-15, -95], [20, -60], [30, -30]], 14, '#2e2a40'); line([[-5, -150], [60, -110]], 12, '#f2a02c');
  } else {
    ctx.fillStyle = c.col; rr(-150, -95, 300, 70, 24); ctx.fill(); ctx.beginPath(); ctx.moveTo(-90, -95); ctx.quadraticCurveTo(-60, -160, 20, -160); ctx.quadraticCurveTo(80, -155, 100, -95); ctx.fill();
    ctx.fillStyle = '#2e3a50'; ctx.beginPath(); ctx.moveTo(-70, -100); ctx.quadraticCurveTo(-50, -148, 10, -148); ctx.lineTo(10, -100); ctx.fill(); ctx.beginPath(); ctx.moveTo(22, -100); ctx.lineTo(22, -148); ctx.quadraticCurveTo(70, -145, 85, -100); ctx.fill(); wheel(-95); wheel(95);
  }
  ctx.restore();
}
function walker(x, y, s, t, seed, dir) {
  const sw = Math.sin(t * 6 + seed) * .5;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
  const skin = ['#6b4026', '#8a5434', '#4e2c1a'][seed % 3], top = ['#d6604f', '#2B7A6E', '#e8b830', '#7fb5d5', '#9a6fb0', '#fff'][seed % 6];
  line([[0, -110], [Math.sin(sw) * 45, -50], [Math.sin(sw) * 45 + 10, 0]], 18, '#2e2a40');
  line([[0, -110], [-Math.sin(sw) * 45, -50], [-Math.sin(sw) * 45 + 10, 0]], 18, '#3a3550');
  rr(-28, -230, 56, 130, 22); ctx.fillStyle = top; ctx.fill();
  circ(4, -262, 30, skin);
  if (seed % 4 === 0) ell(0, -284, 34, 22, ['#e8b830', '#d6604f', '#2B7A6E'][seed % 3]); else { ctx.fillStyle = '#1b1310'; ctx.beginPath(); ctx.arc(2, -270, 31, Math.PI, 0); ctx.fill(); }
  ctx.restore();
}
function prop(p, t) {
  const x = wx(p.x); if (x < -300 || x > VIEW_W + 300) return; const y = NPCY - 10;
  if (p.kind === 'lamp') { ctx.fillStyle = '#3b3440'; ctx.fillRect(x - 6, y - 520, 12, 520); line([[x, y - 510], [x + 70, y - 530]], 10, '#3b3440'); ell(x + 76, y - 520, 30, 12, '#fff3c4'); }
  else if (p.kind === 'palm') {
    ctx.strokeStyle = '#6b4a2e'; ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 30, y - 300, x + 70, y - 560); ctx.stroke();
    for (let k = 0; k < 9; k++) { const a = -Math.PI / 2 + (k - 4) * .45 + Math.sin(t * 2 + k + p.i) * .04, len = 230, ex = x + 70 + Math.cos(a) * len, ey = y - 560 + Math.sin(a) * len * .5 + len * .38;
      ctx.fillStyle = k % 2 ? '#2f7a3a' : '#3c9147'; ctx.beginPath(); ctx.moveTo(x + 70, y - 560); ctx.quadraticCurveTo(x + 70 + Math.cos(a) * len * .5, y - 560 + Math.sin(a) * len * .5 - 50, ex, ey); ctx.quadraticCurveTo(x + 70 + Math.cos(a) * len * .5, y - 560 + Math.sin(a) * len * .5 - 10, x + 70, y - 560); ctx.fill(); }
    for (let k = 0; k < 3; k++) circ(x + 60 + k * 14, y - 545, 14, '#5e7a2a');
  } else if (p.kind === 'tree' || p.kind === 'jacaranda') {
    ctx.fillStyle = '#5b3c26'; ctx.fillRect(x - 12, y - 300, 24, 300);
    const col = p.kind === 'jacaranda' ? ['#8a6ad0', '#a585e0', '#7458c0'] : ['#3f8a45', '#4f9a52', '#2f7a3a'];
    for (let k = 0; k < 9; k++) circ(x + (rnd(p.i + k) - .5) * 220, y - 360 + (rnd(p.i * 3 + k) - .5) * 140, 70 + rnd(k) * 30, col[k % 3]);
  } else if (p.kind === 'stall') {
    ctx.fillStyle = '#8a5a34'; ctx.fillRect(x - 130, y - 110, 260, 18); ctx.fillRect(x - 120, y - 92, 14, 92); ctx.fillRect(x + 106, y - 92, 14, 92);
    ctx.fillStyle = '#7a4a28'; ctx.fillRect(x - 126, y - 230, 10, 120); ctx.fillRect(x + 116, y - 230, 10, 120);
    for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#fff' : ['#d6604f', '#2B7A6E', '#e8b830'][p.i % 3]; ctx.fillRect(x - 140 + k * 47, y - 250, 48, 30); }
    const fruit = [['#e8452c', '#f06a4a'], ['#e8a32c', '#f0c040'], ['#5a8a2f', '#78a83a']][p.i % 3];
    for (let k = 0; k < 14; k++) circ(x - 105 + (k % 7) * 35, y - 122 - Math.floor(k / 7) * 26, 17, fruit[k % 2]);
  }
}
function cafeFront(x) { // HZE Victoria, where the last delivery ends
  const L = x - 470, R = x + 440, top = 620, base = NPCY + 6;
  ctx.fillStyle = '#f3e6d2'; ctx.fillRect(L, top, R - L, base - top); ctx.fillStyle = '#e6d3b8'; ctx.fillRect(L, top, R - L, 30);
  ctx.fillStyle = C.coffee; rr(x - 250, top + 50, 500, 150, 22); ctx.fill();
  text('enzi', x, top + 115, { size: 110, font: 'Fraunces', weight: 800, color: C.cream }); text('HARAKATI ZA · VICTORIA', x, top + 178, { size: 22, font: 'Nunito', weight: 900, color: C.goldL, ls: 4 });
  const ay = top + 230; for (let k = 0; k < 14; k++) { ctx.fillStyle = k % 2 ? C.cream : C.orange; ctx.fillRect(L + k * (R - L) / 14, ay, (R - L) / 14 + 1, 70); ctx.beginPath(); ctx.arc(L + (k + .5) * (R - L) / 14, ay + 70, (R - L) / 28, 0, Math.PI); ctx.fill(); }
  for (const wxp of [L + 40, R - 250]) { const g = ctx.createLinearGradient(0, ay + 120, 0, base - 60); g.addColorStop(0, '#ffd88a'); g.addColorStop(1, '#f2a24e'); ctx.fillStyle = g; rr(wxp, ay + 120, 210, 300, 16); ctx.fill(); ctx.strokeStyle = C.coffee; ctx.lineWidth = 10; ctx.stroke(); }
  const dg = ctx.createRadialGradient(x, base - 200, 10, x, base - 200, 300); dg.addColorStop(0, '#fff6dc'); dg.addColorStop(1, '#f4b25e');
  ctx.fillStyle = C.coffee; rr(x - 115, base - 380, 230, 380, [115, 115, 0, 0]); ctx.fill(); ctx.fillStyle = dg; rr(x - 98, base - 364, 196, 364, [98, 98, 0, 0]); ctx.fill();
  text('KARIBU', x, base - 300, { size: 36, color: C.coffee });
}
// background up to (not including) the sidewalk features
function drawBackdrop(t) {
  sky(t); if (WZ === 2) sea(t); else farSkyline();
  for (const f of FAC) facade(f, t);
  road();
  for (const p of PEDS) { const px = p.x0 + p.v * t, x = wx(px); if (x < -100 || x > VIEW_W + 100) continue; walker(x, 1100, .42, t, p.i, Math.sign(p.v)); }
  for (const c of CARS) if (c.lane === 0) car(c, t);
  for (const c of CARS) if (c.lane === 1) car(c, t);
  for (const p of PROPS) prop(p, t);
}
