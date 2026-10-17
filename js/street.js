// The street world shared by every journey scene (ride / stop / rush / arrive).
let camX = 0;
function wx(x) { return x - camX; }
const SHOPSIGNS = ['DUKA LA VITENGE', 'SIMU & CHAJA', 'WAKALA', 'HOTELI · CHAI', 'VIFAA VYA UJENZI', 'MAMA NTILIE', 'KINYOZI', 'NGUO MPYA', 'DAWA'];
const VSIGNS = ['VICTORIA PLAZA', 'SALUNI', 'MAMA LISHE', 'SIMU POINT', 'DUKA LA DAWA', 'FASHION', 'JUICE BAR', 'STATIONERY', 'MITUMBA'];
const SKIES = [['#2a2350', '#6b4a86', '#e0866e', '#f6b26a'], ['#4d68ad', '#a58fbd', '#f0ab82', '#fbd49a'], ['#5aa3d8', '#9fcbe8', '#f2d6b2', '#fbe7c8'], ['#4f9fd8', '#93c9ec', '#dcebe6', '#f7ecd0']];
function skyAt(x) { let z = 0, p = 0; for (let i = 0; i < 3; i++) { const e = ZB[i]; if (x > e - 700) { z = i; p = clamp((x - (e - 700)) / 1400, 0, 1); } } if (x < ZB[0] - 700) { z = 0; p = 0; } return SKIES[z].map((c, i) => mixc(c, SKIES[Math.min(z + 1, 3)][i], p)); }
function skyGrad(pal) { const g = ctx.createLinearGradient(0, 0, 0, FAR); g.addColorStop(0, pal[0]); g.addColorStop(.45, pal[1]); g.addColorStop(.8, pal[2]); g.addColorStop(1, pal[3]); return g; }
function sunY() { return lerp(900, 330, clamp((camX + SX) / X_END, 0, 1)); }
function sky(t) {
  const cx = camX + SX, prog = clamp(cx / X_END, 0, 1);
  ctx.fillStyle = skyGrad(skyAt(cx)); ctx.fillRect(0, 0, W, FAR + 4);
  const sy = sunY(), sg = ctx.createRadialGradient(760, sy, 20, 760, sy, 420); sg.addColorStop(0, 'rgba(255,236,170,.85)'); sg.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = sg; ctx.fillRect(0, sy - 420, W, 840); circ(760, sy, 95, '#fff0c0');
  for (let i = 0; i < 7; i++) { const w = 260 + rnd(i) * 300, x = ((rnd(i + 3) * 2400 - camX * .12 + t * 14) % 2000 + 2000) % 2000 - 500, y = 380 + rnd(i + 9) * 380;
    ctx.fillStyle = prog < .3 ? 'rgba(240,160,140,.55)' : 'rgba(255,255,255,.6)'; rr(x, y, w, 30, 15); ctx.fill(); rr(x + w * .2, y - 26, w * .45, 34, 17); ctx.fill(); }
  if (prog < .25) for (let i = 0; i < 30; i++) { ctx.fillStyle = `rgba(255,240,220,${Math.max(0, .6 - prog * 2.4) * rnd(i + 3)})`; ctx.fillRect(rnd(i) * W, rnd(i + 50) * 360 + 260, 3, 3); }
}
function farSkyline() {
  const off = -camX * .18, prog = clamp((camX + SX) / X_END, 0, 1);
  ctx.fillStyle = mixc('#5a4588', '#9fb3c9', clamp(prog * 1.6, 0, 1));
  for (let i = 0; i < 60; i++) { const w = 50 + rnd(i) * 70, h = 60 + rnd(i + 7) * 200, x = ((i * 85 + off) % 5100 + 5100) % 5100 - 600; ctx.fillRect(x, FAR - 80 - h, w, h + 80); }
}
function seaPanel(t) { // Coco Beach: sea, dhows, the bridge on the skyline
  const x0 = wx(ZB[1]), x1 = wx(ZB[2]); if (x1 < -50 || x0 > W + 50) return;
  ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, x1 - x0, FAR + 40); ctx.clip();
  ctx.fillStyle = skyGrad(skyAt(camX + SX)); ctx.fillRect(x0, 0, x1 - x0, FAR); circ(760, sunY(), 95, '#fff0c0');
  const off = -camX * .08; ctx.fillStyle = '#6f7fa8';
  for (let i = 0; i < 26; i++) { const w = 34 + rnd(i) * 40, h = 30 + rnd(i + 4) * 110; ctx.fillRect(((i * 62 + off) % 1700 + 1700) % 1700 - 300, 900 - h, w, h); }
  ctx.strokeStyle = '#6f7fa8'; const bx = ((700 + off) % 1700 + 1700) % 1700 - 300; ctx.fillRect(bx - 250, 880, 600, 7);
  for (const tx of [bx - 60, bx + 190]) { ctx.fillRect(tx - 4, 770, 8, 120); ctx.lineWidth = 1.5; for (let k = 1; k <= 7; k++) { ctx.beginPath(); ctx.moveTo(tx, 775 + k * 6); ctx.lineTo(tx - k * 16, 884); ctx.moveTo(tx, 775 + k * 6); ctx.lineTo(tx + k * 16, 884); ctx.stroke(); } }
  const sg = ctx.createLinearGradient(0, 900, 0, FAR); sg.addColorStop(0, '#9fd3e6'); sg.addColorStop(1, '#2f87a8'); ctx.fillStyle = sg; ctx.fillRect(x0, 900, x1 - x0, FAR - 900);
  for (let i = 0; i < 40; i++) { const yy = 905 + rnd(i) * 150, xx = ((rnd(i + 1) * 1400 - camX * .3 + Math.sin(t * 2 + i) * 20) % 1400 + 1400) % 1400 - 200; ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(xx, yy, 30 + rnd(i + 2) * 60, 3); }
  for (let k = 0; k < 4; k++) { const x = ((k * 420 + t * 18 - camX * .3) % 1700 + 1700) % 1700 - 300, y = 950 + k * 18, s = .7 + k * .15;
    ctx.fillStyle = '#3b2a3e'; ctx.beginPath(); ctx.moveTo(x - 50 * s, y); ctx.lineTo(x + 55 * s, y); ctx.lineTo(x + 38 * s, y + 13 * s); ctx.lineTo(x - 38 * s, y + 13 * s); ctx.fill();
    ctx.fillStyle = '#fbf3e4'; ctx.beginPath(); ctx.moveTo(x - 8 * s, y - 2); ctx.lineTo(x + 2 * s, y - 85 * s); ctx.lineTo(x + 50 * s, y - 4); ctx.fill(); }
  for (let k = 0; k < 5; k++) { const x = ((k * 230 + t * 60) % 1300) - 100, y = 640 + Math.sin(t * 1.5 + k) * 30 + k * 25, f = Math.sin(t * 9 + k) * 10; line([[x - 18, y - f], [x, y], [x + 18, y - f]], 4, 'rgba(60,50,70,.7)'); }
  ctx.fillStyle = '#f0d9a8'; ctx.fillRect(x0, FAR - 26, x1 - x0, 40);
  for (let k = 0; k < 6; k++) { const ux = wx(ZB[1] + 300 + k * 420); line([[ux, FAR - 10], [ux, FAR - 90]], 4, '#6b4a2e'); ctx.fillStyle = ['#d6604f', '#e8b830', '#2B7A6E'][k % 3]; ctx.beginPath(); ctx.arc(ux, FAR - 88, 48, Math.PI, 0); ctx.fill(); }
  ctx.restore();
}
function facade(f, t) {
  const x = wx(f.x); if (x > W + 50 || x + f.w < -50) return;
  const top = FAR - f.h;
  if (f.z === 0 || f.z === 3) { // shophouses: Kariakoo / Victoria
    ctx.fillStyle = f.col; ctx.fillRect(x, top, f.w, f.h);
    ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(x + f.w - 18, top, 18, f.h); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x, top, f.w, 14);
    const floors = Math.floor((f.h - 150) / 110);
    for (let fl = 0; fl < floors; fl++) { const y = top + 40 + fl * 110;
      for (let k = 0; k < 3; k++) { ctx.fillStyle = '#3d2c3a'; rr(x + 22 + k * (f.w - 44) / 3, y, (f.w - 44) / 3 - 18, 62, [20, 20, 2, 2]); ctx.fill(); }
      ctx.fillStyle = 'rgba(40,25,30,.6)'; ctx.fillRect(x + 10, y + 70, f.w - 20, 8); for (let k = 0; k < 10; k++) ctx.fillRect(x + 14 + k * (f.w - 28) / 10, y + 70, 3, -22); }
    if (f.i % 2 === 0 && floors > 0) for (let k = 0; k < 4; k++) { ctx.fillStyle = ['#e8b830', '#d6604f', '#2B7A6E', '#9a6fb0'][(k + f.i) % 4]; const kx = x + 30 + k * (f.w - 60) / 4, sw = Math.sin(t * 3 + k + f.i) * 4; ctx.beginPath(); ctx.moveTo(kx, top + 30); ctx.lineTo(kx + 40, top + 30); ctx.lineTo(kx + 40 + sw, top + 100); ctx.lineTo(kx + sw, top + 100); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(kx + 6 + sw * .5, top + 40, 28, 4); }
    ctx.fillStyle = '#5b4a44'; ctx.fillRect(x + 14, FAR - 110, f.w - 28, 110); ctx.fillStyle = '#8a7a72'; for (let k = 0; k < 9; k++) ctx.fillRect(x + 14, FAR - 104 + k * 11, f.w - 28, 4);
    ctx.fillStyle = '#fff'; rr(x + 20, FAR - 150, f.w - 40, 38, 6); ctx.fill();
    text((f.z === 3 ? VSIGNS : SHOPSIGNS)[f.i % 9], x + f.w / 2, FAR - 130, { size: 24, color: f.col === '#efe0c0' || f.col === '#f4ede0' ? '#d6604f' : f.col });
    for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? '#fff' : (f.i % 2 ? C.red : C.teal); ctx.fillRect(x + 6 + k * (f.w - 12) / 8, FAR - 112, (f.w - 12) / 8 + 1, 22); }
  } else if (f.z === 1) { // Posta towers
    ctx.fillStyle = f.col; ctx.fillRect(x, top, f.w, f.h); ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(x, top, f.w * .3, f.h);
    for (let y = top + 24; y < FAR - 90; y += 46) for (let k = 0; k < 5; k++) { ctx.fillStyle = rnd(f.i * 31 + y + k) > .3 ? 'rgba(30,50,80,.5)' : 'rgba(255,240,200,.7)'; ctx.fillRect(x + 16 + k * (f.w - 32) / 5, y, (f.w - 32) / 5 - 10, 30); }
    ctx.fillStyle = '#e8e2d6'; ctx.fillRect(x, FAR - 80, f.w, 80); ctx.fillStyle = 'rgba(40,60,90,.7)'; ctx.fillRect(x + 20, FAR - 66, f.w - 40, 66);
    if (f.i % 3 === 0) { ctx.fillStyle = C.red; ctx.fillRect(x + f.w / 2 - 3, top - 70, 6, 70); }
  }
}
function road() {
  ctx.fillStyle = '#d9c9ad'; ctx.fillRect(0, FAR, W, ROAD0 - FAR); ctx.fillStyle = '#b5a68c'; ctx.fillRect(0, ROAD0 - 6, W, 6);
  const g = ctx.createLinearGradient(0, ROAD0, 0, ROAD1); g.addColorStop(0, '#6d6260'); g.addColorStop(1, '#585050'); ctx.fillStyle = g; ctx.fillRect(0, ROAD0, W, ROAD1 - ROAD0);
  ctx.fillStyle = '#f2e7c4'; const off = ((-camX) % 160 + 160) % 160; for (let x = off - 160; x < W; x += 160) ctx.fillRect(x, 1218, 90, 7);
  ctx.fillStyle = '#cfc2ae'; ctx.fillRect(0, ROAD1, W, 16);
  const pal = [['#c9b394', '#b8a080'], ['#d8cbb6', '#c2b399'], ['#e2b98a', '#cf9f6e'], ['#d6c3a0', '#bea984']];
  for (let i = 0; i < 4; i++) {
    const a = i === 0 ? -1e9 : ZB[i - 1], b = i === 3 ? 1e9 : ZB[i], x0 = clamp(wx(a), 0, W), x1 = clamp(wx(b), 0, W); if (x1 <= x0) continue;
    const sg = ctx.createLinearGradient(0, ROAD1 + 16, 0, H); sg.addColorStop(0, pal[i][0]); sg.addColorStop(1, pal[i][1]); ctx.fillStyle = sg; ctx.fillRect(x0, ROAD1 + 16, x1 - x0, H - ROAD1);
    ctx.save(); ctx.beginPath(); ctx.rect(x0, ROAD1 + 16, x1 - x0, H); ctx.clip();
    ctx.strokeStyle = i === 2 ? 'rgba(255,230,190,.5)' : 'rgba(255,255,255,.28)'; ctx.lineWidth = 3;
    const tw = i === 2 ? 110 : 150, o2 = ((-camX) % tw + tw) % tw;
    for (let x = o2 - tw; x < W + tw; x += tw) { ctx.beginPath(); ctx.moveTo(x, ROAD1 + 16); ctx.lineTo(x - 60, H); ctx.stroke(); }
    for (const y of [1400, 1480, 1580, 1700, 1840]) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
    ctx.restore();
  }
}
function car(c, t) {
  const x = wx(c.x0 + c.v * t); if (x < -400 || x > W + 400) return;
  const y = c.lane ? 1318 : 1232, dir = Math.sign(c.v), s = c.lane ? 1 : .86;
  ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
  const wheel = wx0 => { circ(wx0, -6, 26, '#222'); circ(wx0, -6, 11, '#aaa'); const a = t * Math.abs(c.v) / 26; line([[wx0, -6], [wx0 + Math.cos(a) * 11, -6 + Math.sin(a) * 11]], 3, '#555'); };
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
    rr(-45, -175, 50, 85, 18); ctx.fillStyle = '#f2a02c'; ctx.fill(); circ(-18, -195, 28, '#e8b830'); ctx.fillStyle = '#222'; ctx.fillRect(-2, -205, 26, 14);
    line([[-15, -95], [20, -60], [30, -30]], 14, '#2e2a40'); line([[-5, -150], [60, -110]], 12, '#f2a02c');
  } else {
    ctx.fillStyle = c.col; rr(-150, -95, 300, 70, 24); ctx.fill(); ctx.beginPath(); ctx.moveTo(-90, -95); ctx.quadraticCurveTo(-60, -160, 20, -160); ctx.quadraticCurveTo(80, -155, 100, -95); ctx.fill();
    ctx.fillStyle = '#2e3a50'; ctx.beginPath(); ctx.moveTo(-70, -100); ctx.quadraticCurveTo(-50, -148, 10, -148); ctx.lineTo(10, -100); ctx.fill(); ctx.beginPath(); ctx.moveTo(22, -100); ctx.lineTo(22, -148); ctx.quadraticCurveTo(70, -145, 85, -100); ctx.fill(); wheel(-95); wheel(95);
  }
  ctx.restore();
}
function prop(p, t) {
  const x = wx(p.x); if (x < -300 || x > W + 300) return; const y = NPCY - 10;
  if (p.kind === 'lamp') { ctx.fillStyle = '#3b3440'; ctx.fillRect(x - 6, y - 520, 12, 520); line([[x, y - 510], [x + 70, y - 530]], 10, '#3b3440'); ell(x + 76, y - 520, 30, 12, '#fff3c4'); }
  else if (p.kind === 'palm') {
    ctx.strokeStyle = '#6b4a2e'; ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 30, y - 300, x + 70, y - 560); ctx.stroke();
    for (let k = 0; k < 6; k++) { ctx.fillStyle = 'rgba(80,50,30,.35)'; ctx.fillRect(x + 8 + k * 10, y - 90 - k * 85, 26, 5); }
    for (let k = 0; k < 9; k++) { const a = -Math.PI / 2 + (k - 4) * .45 + Math.sin(t * 2 + k + p.i) * .04, len = 230, ex = x + 70 + Math.cos(a) * len, ey = y - 560 + Math.sin(a) * len * .5 + len * .38;
      ctx.fillStyle = k % 2 ? '#2f7a3a' : '#3c9147'; ctx.beginPath(); ctx.moveTo(x + 70, y - 560); ctx.quadraticCurveTo(x + 70 + Math.cos(a) * len * .5, y - 560 + Math.sin(a) * len * .5 - 50, ex, ey); ctx.quadraticCurveTo(x + 70 + Math.cos(a) * len * .5, y - 560 + Math.sin(a) * len * .5 - 10, x + 70, y - 560); ctx.fill(); }
    for (let k = 0; k < 3; k++) circ(x + 60 + k * 14, y - 545, 14, '#5e7a2a');
  } else if (p.kind === 'tree' || p.kind === 'jacaranda') {
    ctx.fillStyle = '#5b3c26'; ctx.fillRect(x - 12, y - 300, 24, 300);
    const col = p.kind === 'jacaranda' ? ['#8a6ad0', '#a585e0', '#7458c0'] : ['#3f8a45', '#4f9a52', '#2f7a3a'];
    for (let k = 0; k < 9; k++) circ(x + (rnd(p.i + k) - .5) * 220, y - 360 + (rnd(p.i * 3 + k) - .5) * 140, 70 + rnd(k) * 30, col[k % 3]);
    if (p.kind === 'jacaranda') for (let k = 0; k < 6; k++) { const ph = (t * .4 + rnd(k + p.i)) % 1; circ(x + (rnd(k * 5) - .5) * 300 - ph * 60, y - 300 + ph * 300, 6, 'rgba(165,133,224,' + (1 - ph) + ')'); }
  } else if (p.kind === 'stall') {
    ctx.fillStyle = '#8a5a34'; ctx.fillRect(x - 130, y - 110, 260, 18); ctx.fillRect(x - 120, y - 92, 14, 92); ctx.fillRect(x + 106, y - 92, 14, 92);
    ctx.fillStyle = '#7a4a28'; ctx.fillRect(x - 126, y - 230, 10, 120); ctx.fillRect(x + 116, y - 230, 10, 120);
    for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#fff' : ['#d6604f', '#2B7A6E', '#e8b830'][p.i % 3]; ctx.fillRect(x - 140 + k * 47, y - 250, 48, 30); }
    const fruit = [['#e8452c', '#f06a4a'], ['#e8a32c', '#f0c040'], ['#5a8a2f', '#78a83a']][p.i % 3];
    for (let k = 0; k < 14; k++) circ(x - 105 + (k % 7) * 35, y - 122 - Math.floor(k / 7) * 26, 17, fruit[k % 2]);
  }
}
function obstacle(o, t) {
  const x = wx(o.x), y = GY; if (x < -300 || x > W + 300) return;
  if (o.kind === 'kuku') {
    const dt = t - o.tp, cx = x - dt * 40, near = Math.abs(dt) < .3, flap = near ? Math.sin(t * 40) * 20 : 0, hop = near ? 30 * Math.sin(Math.PI * clamp((dt + .3) / .6, 0, 1)) : 0;
    ctx.save(); ctx.translate(cx, y - hop);
    line([[-8, -20], [-8, 0]], 5, '#e8a32c'); line([[8, -20], [8, 0]], 5, '#e8a32c');
    ell(0, -50, 45, 34, '#f4ede0'); circ(-32, -88, 20, '#f4ede0'); ell(38, -66, 18, 26, '#e9dfcf', .5);
    circ(-30, -110, 8, '#d6332c'); circ(-40, -106, 7, '#d6332c'); ell(-46, -78, 6, 9, '#d6332c');
    ctx.fillStyle = '#e8a32c'; ctx.beginPath(); ctx.moveTo(-50, -92); ctx.lineTo(-64, -86); ctx.lineTo(-50, -82); ctx.fill(); circ(-38, -92, 4, '#222');
    ell(4, -52 - flap * .3, 26, 16 + Math.abs(flap) * .4, '#e9dfcf', .3); ctx.restore();
    if (Math.abs(dt) < .4) for (let k = 0; k < 4; k++) { const ph = (dt + .4) / .8; ell(cx + (k - 1.5) * 30 + ph * 20, y - 80 - ph * 80 + k * 10, 10, 5, `rgba(244,237,224,${1 - ph})`, k); }
  } else if (o.kind === 'crate') {
    for (const [dx, dy] of [[-35, 0], [35, 0], [0, -60]]) { ctx.fillStyle = '#b98a52'; ctx.fillRect(x + dx - 30, y + dy - 60, 60, 60); ctx.strokeStyle = '#8a6036'; ctx.lineWidth = 5; ctx.strokeRect(x + dx - 30, y + dy - 60, 60, 60); line([[x + dx - 30, y + dy - 60], [x + dx + 30, y + dy]], 4, '#8a6036'); }
    for (let k = 0; k < 4; k++) circ(x - 27 + k * 18, y - 128, 10, '#e8452c');
  } else if (o.kind === 'kaa') {
    const dt = t - o.tp, cx = x + Math.sin(t * 8) * 6 - dt * 30; ctx.save(); ctx.translate(cx, y);
    for (let k = 0; k < 3; k++) { line([[-20, -24], [-42 - k * 6, -8 + Math.sin(t * 20 + k) * 4], [-50 - k * 6, 0]], 5, '#d6332c'); line([[20, -24], [42 + k * 6, -8 + Math.sin(t * 20 + k + 1) * 4], [50 + k * 6, 0]], 5, '#d6332c'); }
    ell(0, -30, 40, 24, '#e8452c'); circ(-40, -60, 14, '#e8452c'); circ(40, -60, 14, '#e8452c');
    line([[-12, -50], [-14, -64]], 4, '#d6332c'); line([[12, -50], [14, -64]], 4, '#d6332c'); circ(-14, -68, 6, '#fff'); circ(14, -68, 6, '#fff'); circ(-14, -68, 3, '#222'); circ(14, -68, 3, '#222'); ctx.restore();
  } else if (o.kind === 'ball') {
    const dt = t - o.tp; if (dt < -.65) return; const bx = x - dt * 360;
    ctx.save(); ctx.translate(bx, y - 32); ctx.rotate(-dt * 11); circ(0, 0, 32, '#fff'); for (let k = 0; k < 5; k++) { const a = k * 1.256; circ(Math.cos(a) * 20, Math.sin(a) * 20, 8, '#222'); } circ(0, 0, 9, '#222'); ctx.restore();
    ell(bx, y + 2, 30, 6, 'rgba(0,0,0,.15)');
  }
}
function cafeExterior() {
  const x = wx(CAFE_X); if (x > W + 600 || x < -700) return;
  const L = x - 470, R = x + 440, top = 620, base = NPCY + 6;
  ctx.fillStyle = '#f3e6d2'; ctx.fillRect(L, top, R - L, base - top); ctx.fillStyle = '#e6d3b8'; ctx.fillRect(L, top, R - L, 30);
  ctx.fillStyle = C.coffee; rr(x - 250, top + 50, 500, 150, 22); ctx.fill();
  text('enzi', x, top + 115, { size: 110, font: 'Fraunces', weight: 800, color: C.cream }); text('HARAKATI ZA · VICTORIA', x, top + 178, { size: 22, font: 'Nunito', weight: 900, color: C.goldL, ls: 4 });
  const ay = top + 230; for (let k = 0; k < 14; k++) { ctx.fillStyle = k % 2 ? C.cream : C.orange; ctx.fillRect(L + k * (R - L) / 14, ay, (R - L) / 14 + 1, 70); ctx.beginPath(); ctx.arc(L + (k + .5) * (R - L) / 14, ay + 70, (R - L) / 28, 0, Math.PI); ctx.fill(); }
  for (const wxp of [L + 40, R - 250]) { const g = ctx.createLinearGradient(0, ay + 120, 0, base - 60); g.addColorStop(0, '#ffd88a'); g.addColorStop(1, '#f2a24e'); ctx.fillStyle = g; rr(wxp, ay + 120, 210, 300, 16); ctx.fill(); ctx.strokeStyle = C.coffee; ctx.lineWidth = 10; ctx.stroke();
    for (let k = 0; k < 4; k++) { const px = wxp + 35 + k * 48, py = ay + 250 + (k % 2) * 16; circ(px, py, 20, 'rgba(70,35,20,.55)'); ctx.fillStyle = 'rgba(70,35,20,.55)'; rr(px - 22, py + 24, 44, 100, 16); ctx.fill(); }
    for (let k = 0; k < 3; k++) circ(wxp + 30 + k * 75, ay + 140, 14, '#e8b06a'); }
  const dg = ctx.createRadialGradient(x, base - 200, 10, x, base - 200, 300); dg.addColorStop(0, '#fff6dc'); dg.addColorStop(1, '#f4b25e');
  ctx.fillStyle = C.coffee; rr(x - 115, base - 380, 230, 380, [115, 115, 0, 0]); ctx.fill(); ctx.fillStyle = dg; rr(x - 98, base - 364, 196, 364, [98, 98, 0, 0]); ctx.fill();
  text('KARIBU', x, base - 300, { size: 36, color: C.coffee });
  for (const px of [x - 175, x + 175]) { ctx.fillStyle = '#b5532c'; ctx.beginPath(); ctx.moveTo(px - 40, base - 90); ctx.lineTo(px + 40, base - 90); ctx.lineTo(px + 30, base); ctx.lineTo(px - 30, base); ctx.fill(); for (let k = 0; k < 7; k++) ell(px + (k - 3) * 16, base - 130 + Math.abs(k - 3) * 8, 18, 46, '#3f8a45', (k - 3) * .35); }
}

// Enzi on the street (riding, jumping, rushing, stopping to chat, dismounting at the café)
function streetPose(t) {
  const P = basePose(); P.drag = Math.min(1, speed(t) / 900);
  const v = speed(t), j = jumpAt(t), rh = rushH(t);
  if ((t % 3.1) < .1) P.eyes = 'blink';
  const pushing = v > 80 && v < 1000 && !j && rh < 5 && speed(t + .35) > 80;
  if (pushing) {
    const c = ((t - JOURNEY[0]) / .62) % 1;
    if (c < .14) { const p = c / .14; P.fB = [lerp(-72, -10, p), lerp(-52, 0, ease(p))]; }
    else if (c < .44) { const p = (c - .14) / .3; P.fB = [lerp(-10, -175, p), 0]; P.hip[1] = -162; }
    else if (c < .62) { const p = (c - .44) / .18; P.fB = [lerp(-175, -72, ease(p)), -52 - 40 * Math.sin(Math.PI * p)]; }
    P.lean = .16; P.hF = [130, -230 + Math.sin(c * 6.28) * 20]; P.hB = [-125, -280 - Math.sin(c * 6.28) * 20]; P.mouth = 'grin';
  } else if (v > 80 && !j && rh < 5) { P.hB = [-140, -300]; P.hF = [140, -290]; P.mouth = 'grin'; }
  if (speed(t + .35) < 60 && v > 1 && !j && rh < 5) { P.lean = -.14; P.fB = [-128, -66]; P.boardAng = -.1; P.hF = [140, -300]; P.hB = [-110, -320]; P.mouth = 'o'; P.brows = 1; }
  if (j) { const q = clamp((j.p - .1) / .9, 0, 1);
    if (j.p < .1) P.hip[1] = -148; else { P.y -= 200 * 4 * q * (1 - q); P.boardAng = q < .55 ? -.45 * Math.sin(Math.PI * q / .55) : 0; P.hip[1] = -178 + 34 * Math.sin(Math.PI * q); }
    P.hB = [-140, -340]; P.hF = [150, -330]; P.mouth = 'grin'; P.eyes = 'happy'; P.steam = 1.6; }
  if (rh > 2) { P.y -= rh + Math.sin(t * 9) * 8; P.lean = .3; P.hip[1] = -150; P.hB = [-160, -200]; P.hF = [170, -330]; P.jet = clamp(rh / 120, 0, 1); P.mouth = 'grin'; P.steam = 2.2; P.brows = -1; }
  P.glasses = win(t, RUSH[0] - .25, RUSH[0] - .1) * (1 - win(t, RUSH[1] + .2, RUSH[1] + .5));
  for (const st of STOPS) if (t >= st.start && t < st.end) {
    P.fB = [-150, 0]; P.fF = [60, -52]; P.hip = [-30, -160]; P.lean = -.02; P.hB = [-100, -190]; P.hF = [90, -200]; P.mouth = 'smile';
    if (speaking('ENZI', t)) { P.talk = 1; P.mouth = 'talk'; P.hF = [130 + Math.sin(t * 8) * 15, -330 + Math.sin(t * 6) * 15]; P.brows = 1; }
    else { P.hip[1] += Math.sin(t * 5) * 4; if (t < st.start + .3) { P.hF = [120, -370 + Math.sin(t * 20) * 25]; P.mouth = 'grin'; } }
    if (t > st.end - .45) { P.brows = -1; P.mouth = 'grin'; }
  }
  if (t > RUSH[0] - .35 && t < RUSH[0]) { P.hF = [130, -380]; P.hB = [-130, -380]; P.mouth = 'grin'; P.brows = -1; }
  P.groundOff = GY - P.y;
  // arriving: dismount → kick the board up → walk to the door
  const A = A_STOP;
  if (t >= A) {
    P.lean = 0; P.mouth = 'smile'; P.drag = 0; P.groundOff = 0;
    if (t < A + .2) { const p = ease(win(t, A, A + .2)); P.fB = [-150, 0]; P.fF = [lerp(60, 70, p), lerp(-52, 0, p)]; P.hip = [lerp(-30, -50, p), lerp(-160, -150, p)]; P.hB = [-100, -190]; P.hF = [100, -200]; }
    else if (t < A + .5) { const p = win(t, A + .2, A + .5); P.onBoard = false; P.kick = p; P.fB = [-130 + 30 * bump(t, A + .2, A + .35), -30 * bump(t, A + .2, A + .35)]; P.fF = [70, 0]; P.hip = [-30, -150]; P.hF = [lerp(100, 40, p), lerp(-200, -280, p)]; P.hB = [-100, -190]; P.mouth = 'grin'; }
    else { const p = win(t, A + .5, A + 1.3), ph = (t - A - .5) * 9; P.onBoard = false; P.carry = 1;
      P.x = SX + 10 + p * 230; P.y = GY - p * 80; P.scale = 1 - p * .12;
      P.fB = [Math.sin(ph) * 45 - 10, -Math.max(0, Math.cos(ph)) * 24]; P.fF = [-Math.sin(ph) * 45 + 10, -Math.max(0, -Math.cos(ph)) * 24];
      P.hip = [0, -152 - Math.abs(Math.cos(ph)) * 8]; P.hB = [-40, -200]; P.hF = [30 + Math.sin(ph) * 40, -210]; P.mouth = 'grin'; }
  }
  return P;
}
function dust(t) {
  if (t > A_STOP) return;
  for (const [s, d] of JUMPS) { const k = (t - s - d) / .4; if (k < 0 || k > 1) continue; for (let i = 0; i < 6; i++) circ(SX + (i - 2.5) * 40 * (1 + k), GY - 10 - k * 30 * rnd(i), 18 * (1 - k) + 6, `rgba(230,210,180,${.7 * (1 - k)})`); }
  const v = speed(t); if (v > 80 && v < 1000 && !jumpAt(t)) { const c = ((t - JOURNEY[0]) / .62) % 1; if (c > .14 && c < .5) { const k = (c - .14) / .36; for (let i = 0; i < 3; i++) circ(SX - 120 - k * 120 - i * 20, GY - 8 - k * 20 - i * 6, 12 * (1 - k) + 4, `rgba(230,210,180,${.6 * (1 - k)})`); } }
  for (const a of STOPS.map(s => s.start).concat([A_STOP])) { const k = win(t, a - .4, a); if (k > 0 && k < 1) for (let i = 0; i < 5; i++) circ(SX - 165 - rnd(i + Math.floor(t * 20)) * 60, GY - 10 - rnd(i * 3 + Math.floor(t * 20)) * 30, 5, `rgba(255,${200 + i * 10},120,${1 - k * .5})`); }
}
function speedLines(t, amt) { if (amt <= 0) return; ctx.save(); ctx.globalAlpha = amt;
  for (let i = 0; i < 40; i++) { const y = 500 + rnd(i) * 1300, ph = (t * 3 + rnd(i + 9)) % 1, x = W + 200 - ph * (W + 600), len = 120 + rnd(i + 2) * 280; ctx.strokeStyle = 'rgba(255,248,230,.75)'; ctx.lineWidth = 4 + rnd(i) * 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke(); } ctx.restore(); }

// full street frame (used by every journey scene)
function renderStreet(t) {
  camX = X(Math.min(t, A_STOP)) - SX;
  const rh = rushH(t), sh = rh > 2 ? 4 : 0;
  let ls = 0; for (const [s, d] of JUMPS) { const k = win(t, s + d, s + d + .2); if (k > 0 && k < 1) ls = (1 - k) * 8; }
  ctx.save(); ctx.translate(Math.sin(t * 50) * (sh + ls), Math.cos(t * 43) * (sh + ls));
  sky(t); farSkyline(); seaPanel(t);
  for (const f of FAC) facade(f, t);
  road();
  for (const p of PEDS) { const px = p.x0 + p.v * t, x = wx(px); if (x < -100 || x > W + 100 || zoneAt(px) === 2) continue; walker(x, 1100, .42, t, p.i, Math.sign(p.v)); }
  for (const c of CARS) if (c.lane === 0) car(c, t);
  for (const c of CARS) if (c.lane === 1) car(c, t);
  { const x = wx(X_END - 330); if (x > -200 && x < W + 200) { ctx.fillStyle = '#5b3c26'; ctx.fillRect(x - 8, NPCY - 320, 16, 320); ctx.fillStyle = C.teal; rr(x - 150, NPCY - 410, 300, 120, 16); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.stroke(); text('ENZI  →', x, NPCY - 372, { size: 48 }); text('VICTORIA · 50m', x, NPCY - 326, { size: 28, color: C.goldL }); } }
  for (const p of PROPS) prop(p, t);
  cafeExterior();
  for (const s of SCENES) if (s.drawWorld) s.drawWorld(t, t - s.start, s);
  for (const o of OBST) obstacle(o, t);
  for (const b of BEANS) { if (t >= b.t) continue; const x = wx(b.x); if (x < -60 || x > W + 60) continue; bean(x, GY - b.h + Math.sin(t * 5 + b.t * 9) * 6, 26, t * 5 + b.t * 3); }
  dust(t);
  drawEnzi(streetPose(t), t);
  ctx.restore();
  for (const b of BEANS) { const k = (t - b.t) / .38; if (k < 0 || k > 1) continue; const sy = GY - b.h, e = easeIn(k); bean(lerp(SX, HUD_BEAN[0], e), lerp(sy, HUD_BEAN[1], e) - Math.sin(Math.PI * k) * 160, 26 - k * 6, t * 9); if (k < .3) for (let i = 0; i < 5; i++) circ(SX + Math.cos(i * 1.26 + b.t) * (20 + k * 200), sy + Math.sin(i * 1.26 + b.t) * (20 + k * 200), 8 * (1 - k / .3), '#ffe6a3'); }
  const ef = win(t, RUSH[0], RUSH[0] + .3) * (1 - win(t, RUSH[1] - .4, RUSH[1])); if (ef > 0) { ctx.fillStyle = `rgba(255,170,80,${.08 * ef})`; ctx.fillRect(0, 0, W, H); } speedLines(t, ef);
  const nf = bump(t, RUSH[0] - .18, RUSH[0] + .1); if (nf > 0) { ctx.fillStyle = `rgba(255,236,170,${nf * .7})`; ctx.fillRect(0, 0, W, H); }
  hud(t); zoneBanner(t); dialogBox(t); speakerMarker(t);
  bigPop(t, RUSH[0] + .05, 'NGUVU RUSH!', 'nguvu ya asubuhi', C.goldL);
}
