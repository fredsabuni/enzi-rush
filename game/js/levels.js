// Levels: one delivery per zone. Courses are generated from a fixed seed so every player
// rides the same streets — that keeps the leaderboard fair.
// mix = relative weights of chunk types; lights = where the traffic lights sit (fraction of length).
const LEVELS = [
  { zone: 0, customer: 'mama', seed: 101, len: 22000, speed: 640, lights: [.45], nguvu: .6,
    mix: { beans: 4, arc: 3, shimo: 2, kuku: 2.5, mtaro: 1.2, plats: 1.5, dimbwi: .5 } },
  { zone: 1, customer: 'baraka', seed: 202, len: 26000, speed: 690, lights: [.3, .62, .85], nguvu: .5,
    mix: { beans: 3, arc: 2.5, shimo: 2, kuku: 1, mtaro: 1.5, plats: 2, boda: 2, kunguru: 1.5, dimbwi: .8 } },
  { zone: 2, customer: 'mzee', seed: 303, len: 28000, speed: 730, lights: [.5], nguvu: .4,
    mix: { beans: 3, arc: 3, kaa: 2.5, mtaro: 2.2, plats: 2.5, kunguru: 2, dimbwi: 1.5 } },
  { zone: 3, customer: 'neema', seed: 404, len: 32000, speed: 770, lights: [.25, .5, .78], nguvu: .55, final: true,
    mix: { beans: 3, arc: 2.5, shimo: 2, kuku: 1.5, mtaro: 2, plats: 2.5, boda: 2.5, kunguru: 2.5, dimbwi: 1 } },
];
const SCORE = { bean: 10, gold: 100, stomp: 50, hit: 100, fine: 250, fall: 150, deliverBase: 300, deliverHeat: 10 };

function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function genLevel(L) {
  const R = mulberry(L.seed), rn = (a, b) => a + R() * (b - a), ri = (a, b) => Math.floor(rn(a, b + 1));
  const E = { beans: [], gaps: [], plats: [], haz: [], lights: [], pows: [] };
  const beanLine = (x0, n, h, step = 95) => { for (let i = 0; i < n; i++) E.beans.push({ x: x0 + i * step, h, gold: false }); };
  const beanArc = (x0, w, h0, peak, n) => { for (let i = 0; i < n; i++) { const p = i / (n - 1); E.beans.push({ x: x0 + p * w, h: h0 + peak * 4 * p * (1 - p), gold: false }); } };
  const types = Object.keys(L.mix), total = types.reduce((s, k) => s + L.mix[k], 0);
  const pick = () => { let r = R() * total; for (const k of types) { r -= L.mix[k]; if (r <= 0) return k; } return types[0]; };
  const lightsAt = L.lights.map(f => f * L.len), endX = L.len - 1900;
  let x = 1500, li = 0, last = '', nguvuDone = false, difficulty = 0;
  beanLine(700, 6, 70);
  while (x < endX) {
    difficulty = x / L.len;
    if (li < lightsAt.length && x >= lightsAt[li]) { // traffic light crossing: zebra x..x+320
      E.lights.push({ x: x + 200, off: R() * 6, fined: false, waved: false });
      beanLine(x + 220, 3, 70, 100); x += 1000; li++; last = 'light'; continue;
    }
    let k = pick(); if (k === last && (k === 'mtaro' || k === 'boda')) k = 'beans'; last = k;
    switch (k) {
      case 'beans': { const n = ri(5, 8); beanLine(x, n, R() < .5 ? 70 : 220); x += n * 95 + rn(250, 450); break; }
      case 'arc': { const w = rn(450, 650); beanArc(x, w, 70, rn(220, 360), 7); x += w + rn(300, 450); break; }
      case 'shimo': { E.haz.push({ type: 'shimo', x: x + 80, w: 170 }); beanArc(x - 120, 400, 80, 260, 5); x += 650; break; }
      case 'dimbwi': { E.haz.push({ type: 'dimbwi', x: x + 110, w: 260 }); x += 650; break; }
      case 'kuku': case 'kaa': { E.haz.push({ type: k, x: x + 200, x0: x + 200, vx: k === 'kuku' ? -70 : 0, alive: true }); beanLine(x + 100, 3, 330, 100); x += 800; break; }
      case 'mtaro': { const w = rn(260, 320 + difficulty * 140); E.gaps.push({ x0: x, x1: x + w }); beanArc(x - 120, w + 240, 90, 320, 6); x += w + rn(500, 700); break; }
      case 'boda': { E.haz.push({ type: 'boda', x: x + 900, x0: x + 900, vx: -420, live: false, honked: false }); beanLine(x, 3, 70); x += 1200; break; }
      case 'kunguru': { const n = ri(1, 3), low = R() < .55; for (let i = 0; i < n; i++) E.haz.push({ type: 'kunguru', x0: x + 500 + i * 300, x: x + 500 + i * 300, h: low ? rn(150, 210) : rn(430, 500), vx: -140, alive: true, seed: i * 2 });
        if (!low) beanLine(x + 400, 5, 70); x += 600 + n * 300 + 300; break; }
      case 'plats': { // one-way ledges (awnings / balconies), optional drain under them
        const n = ri(2, 3); let px = x, top = 0; const under = difficulty > .3 && R() < .5;
        for (let i = 0; i < n; i++) { const w = rn(380, 520), h = i === 0 ? rn(240, 300) : clamp(top + rn(-80, 140), 240, 520); E.plats.push({ x0: px, x1: px + w, h }); beanLine(px + 60, Math.floor((w - 80) / 95), h + 70); top = h; px += w + rn(150, 260); }
        if (under) E.gaps.push({ x0: x + 260, x1: x + 260 + rn(260, 340) });
        if (!nguvuDone && x > L.len * L.nguvu) { E.pows.push({ type: 'nguvu', x: px - 120, h: top + 320 }); nguvuDone = true; }
        else E.beans.push({ x: px - 120, h: top + 330, gold: true });
        x = px + rn(300, 500); break; }
    }
  }
  // keep beans out of drains (they'd be uncollectable at ground level)
  E.beans = E.beans.filter(b => b.h > 150 || !E.gaps.some(g => b.x > g.x0 - 30 && b.x < g.x1 + 30));
  E.haz = E.haz.filter(h => h.type === 'kunguru' || h.type === 'boda' || !E.gaps.some(g => h.x > g.x0 - 200 && h.x < g.x1 + 200));
  for (const b of E.beans) b.got = false;
  E.maxBeans = E.beans.length;
  return E;
}
