// SCENE 9 — ARRIVE at HZE Victoria. Last stretch (ride seconds), brake, kick the board up, walk in.
scene({
  id: 'arrive', dur: 2.7, kind: 'arrive', ride: 1.4,
  beans: [[.4, 1.1]],
  cues: [[1.7, 'kick'], [2.35, 'iris']],
  overlay(T, lt) { if (lt > 2.25) irisMask(wx(CAFE_X), NPCY - 200, lerp(1400, 0, easeIn(win(lt, 2.25, 2.65)))); },
});
