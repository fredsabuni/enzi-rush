// Timeline: every scene file calls scene({...}); ORDER sets the running order.
// Scene start times are computed from durations, and everything time-based on the street
// (speed, jumps, beans, NPC positions, dialogue, sound cues) is derived from them, so you can
// change a scene's `dur` or reorder/remove scenes without touching any other numbers.
const ORDER = ['home', 'kariakoo', 'baraka', 'rush', 'coco', 'mzee', 'victoria', 'neema', 'arrive', 'cafe', 'complete', 'endcard'];

const SCENE_DEFS = {};
function scene(def) { SCENE_DEFS[def.id] = def; }
let SCENES = [], TOTAL = 0;
const SC = id => SCENES.find(s => s.id === id);
function sceneAt(T) { for (const s of SCENES) if (T < s.end) return s; return SCENES[SCENES.length - 1]; }

// ---- derived street data (filled by build) ----
let VK = [], XT = [], JUMPS = [], RUSH = [-1, -1], STOPS = [], DIALOG = [], ZB = [], ZBANNERS = [], JOURNEY = [0, 0];
let X_END = 0, CAFE_X = 0, A_STOP = 0, FAC = [], PROPS = [], CARS = [], PEDS = [], NPC = {}, OBST = [], BEANS = [], BEAN_T = [], EVENTS = [];
const DT = 1 / 300, MOVE = { ride: 720, rush: 1750, stop: 0, arrive: 720 };

function speed(t) { for (let i = 1; i < VK.length; i++) if (t <= VK[i][0]) { const [a, va] = VK[i - 1], [b, vb] = VK[i]; return b === a ? vb : lerp(va, vb, ease((t - a) / (b - a))); } return 0; }
function X(t) { const i = clamp(t / DT, 0, XT.length - 1), i0 = Math.floor(i); return lerp(XT[i0], XT[Math.min(i0 + 1, XT.length - 1)], i - i0); }
function jumpAt(t) { for (const j of JUMPS) if (t >= j[0] && t <= j[0] + j[1]) return { p: (t - j[0]) / j[1], j }; return null; }
function rushH(t) { return 240 * easeOut(win(t, RUSH[0], RUSH[0] + .45)) * (1 - ease(win(t, RUSH[1] - .5, RUSH[1]))); }
function heightAt(t) { const j = jumpAt(t); let h = rushH(t); if (j) { const q = clamp((j.p - .1) / .9, 0, 1); h += 200 * 4 * q * (1 - q); } return h; }
function zoneAt(x) { return x < ZB[0] ? 0 : x < ZB[1] ? 1 : x < ZB[2] ? 2 : 3; }
function speaking(sp, t) { for (const [a, b, s] of DIALOG) if (t >= a && t < b - .15 && s === sp) return 1; return 0; }
function onStreet(T) { return T >= JOURNEY[0] && T < JOURNEY[1]; }

function build() {
  let t = 0;
  SCENES = ORDER.map(id => { const d = SCENE_DEFS[id]; if (!d) throw new Error('unknown scene ' + id); const s = { ...d, start: t, end: t + d.dur }; t += d.dur; return s; });
  TOTAL = t;
  const street = SCENES.filter(s => MOVE[s.kind] !== undefined);
  JOURNEY = [street[0].start, street[street.length - 1].end];
  // speed keyframes: accelerate at the start of a faster scene, brake at the end of a faster scene
  VK = [[0, 0]]; let prev = 0;
  for (const s of SCENES) {
    const v = MOVE[s.kind] ?? 0;
    if (v > prev) VK.push([s.start, prev], [s.start + .4, v]);
    else if (v < prev) VK.push([s.start - .45, prev], [s.start, v]);
    prev = v;
    if (s.kind === 'arrive') { VK.push([s.start + s.ride - .8, 720], [s.start + s.ride - .4, 600], [s.start + s.ride, 0]); prev = 0; }
  }
  VK.push([1e4, 0]);
  XT = [0]; for (let i = 1; i <= TOTAL / DT + 2; i++) XT.push(XT[i - 1] + speed(i * DT) * DT);
  JUMPS = []; for (const s of street) for (const [lt, kind] of s.jumps || []) JUMPS.push([s.start + lt, .62, kind]);
  const rs = street.find(s => s.kind === 'rush'); RUSH = rs ? [rs.start, rs.end] : [-1, -1];
  STOPS = street.filter(s => s.kind === 'stop').map(s => ({ s, start: s.start, end: s.end, npc: s.npc }));
  DIALOG = []; for (const st of STOPS) for (const [a, b, sp, sw, en] of st.s.lines) DIALOG.push([st.start + a, st.start + b, sp, sw, en]);
  ZB = []; ZBANNERS = []; let lastZone = -1;
  for (const s of street) if (s.zone !== undefined && s.zone !== lastZone) { if (s.zone > 0) ZB.push(X(s.start + (s.zoneAt ?? .2))); ZBANNERS.push([s.start + (s.banner ?? .1), s.zone]); lastZone = s.zone; }
  while (ZB.length < 3) ZB.push(1e9);
  const ar = street.find(s => s.kind === 'arrive'); A_STOP = ar.start + ar.ride; X_END = X(A_STOP); CAFE_X = X_END + 230;
  // world dressing
  FAC = []; { let x = -900, i = 0; while (x < X_END + 2000) { const z = zoneAt(x); let w;
    if (z === 0) { w = 230 + rnd(i) * 140; FAC.push({ x, w, z, h: 300 + rnd(i + 1) * 170, col: ['#2B7A6E', '#e8b830', '#d6604f', '#efe0c0', '#7fb5d5', '#e98b5a', '#9a6fb0'][Math.floor(rnd(i + 2) * 7)], i }); }
    else if (z === 1) { w = 260 + rnd(i) * 160; FAC.push({ x, w, z, h: 560 + rnd(i + 1) * 380, col: ['#7fa7c4', '#5f8fb0', '#a7c1d1', '#d9cbb3', '#8fb7c9'][Math.floor(rnd(i + 2) * 5)], i }); }
    else if (z === 2) w = 400;
    else { w = 240 + rnd(i) * 150; FAC.push({ x, w, z, h: 340 + rnd(i + 1) * 200, col: ['#f2b134', '#e2554a', '#3aa6a0', '#f4ede0', '#5b8bd6', '#ef8a3c', '#c76bb0'][Math.floor(rnd(i + 2) * 7)], i }); }
    x += w + (z === 1 ? 20 : 0); i++; } }
  PROPS = []; { let x = -400, i = 0; while (x < X_END - 900) { const z = zoneAt(x); PROPS.push({ x, z, i, kind: z === 0 ? (i % 3 === 0 ? 'lamp' : 'stall') : z === 1 ? (i % 2 ? 'lamp' : 'tree') : z === 2 ? (i % 3 === 2 ? 'lamp' : 'palm') : (i % 2 ? 'jacaranda' : 'lamp') }); x += z === 2 ? 380 + rnd(i) * 120 : 520 + rnd(i) * 220; i++; } }
  CARS = []; for (let i = 0; i < 90; i++) { const dir = i % 2 ? 1 : -1; CARS.push({ x0: -1500 + i * 480 + rnd(i) * 300, v: dir * (180 + rnd(i + 3) * 260), lane: dir > 0 ? 1 : 0, type: ['daladala', 'bajaji', 'boda', 'car', 'daladala', 'bajaji'][i % 6], col: ['#e8b830', '#2a7ab8', '#d6604f', '#efefef', '#2B7A6E'][Math.floor(rnd(i + 7) * 5)], i }); }
  PEDS = []; for (let i = 0; i < 110; i++) PEDS.push({ x0: -600 + i * 240 + rnd(i) * 200, v: (rnd(i + 2) > .5 ? 1 : -1) * (40 + rnd(i) * 50), i });
  NPC = {}; for (const st of STOPS) NPC[st.npc] = { x: X(st.start) + 300 + (st.s.npcOffset || 0), stop: st };
  OBST = JUMPS.map(([s, d, kind]) => ({ kind, tp: s + d * .55, x: X(s + d * .55) }));
  BEANS = []; for (const s of street) for (const [a, b, step = .1] of s.beans || []) for (let lt = a; lt <= b + 1e-6; lt += step) { const tt = s.start + lt; BEANS.push({ t: tt, x: X(tt), h: heightAt(tt) + 120 }); }
  BEAN_T = BEANS.map(b => b.t);
  // ---- sound cues ----
  EVENTS = [];
  const ev = (t, type, extra = {}) => EVENTS.push({ t, type, ...extra });
  for (const s of SCENES) for (const [lt, type, extra] of s.cues || []) ev(s.start + lt, type, extra);
  for (const bt of BEAN_T) ev(bt, 'bean');
  for (const [s, d] of JUMPS) { ev(s + .05, 'ollie'); ev(s + d - .02, 'land'); }
  for (const st of STOPS) ev(st.start - .45, 'skid');
  ev(A_STOP - .45, 'skid');
  if (rs) { ev(rs.start, 'power'); ev(rs.end - .1, 'land'); }
  for (const [a, , sp, sw] of DIALOG) for (let c = 0; c < sw.length; c += 2) if (sw[c] !== ' ') ev(a + .08 + c / 42, 'blip', { sp });
  for (const [bt] of ZBANNERS) ev(bt, 'zone');
  EVENTS.sort((a, b) => a.t - b.t);
  // continuous sound envelopes (100 Hz)
  const ROLL = [], RUSHENV = [];
  for (let i = 0; i < TOTAL * 100; i++) { const tt = i / 100; ROLL.push(tt > JOURNEY[0] && tt < A_STOP && !jumpAt(tt) && rushH(tt) < 5 ? clamp(speed(tt) / 720, 0, 1) : 0); RUSHENV.push(clamp(rushH(tt) / 240, 0, 1)); }
  window.EVENTS = EVENTS; window.ROLL = ROLL; window.RUSHENV = RUSHENV;
  window.META = { DUR: TOTAL, beans: BEANS.length, scenes: SCENES.map(s => ({ id: s.id, kind: s.kind, start: +s.start.toFixed(3), end: +s.end.toFixed(3), music: s.music || null })), hover: SC('home') ? SC('home').hover : null };
}
