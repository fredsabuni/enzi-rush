// SCENE 7 — VICTORIA (ride). Busy streets; kids kick a football across, Enzi ollies it.
scene({
  id: 'victoria', dur: 2.2, kind: 'ride', zone: 3, banner: .25, zoneAt: .15,
  jumps: [[.75, 'ball']],
  beans: [[.45, 1.7]],
  cues: [[.5, 'kickball']],
  drawWorld(t, lt) {
    const o = OBST.find(o => o.kind === 'ball'); if (!o) return;
    const x = wx(o.x) + 470; if (x < -200 || x > W + 300) return;
    const kick = bump(lt, .35, .6), cheer = lt > 1.0 && lt < 2.2;
    person(x, NPCY + 30, .55, { skin: '#5a3420', shirt: '#e8452c', pants: '#1f6fb2', gesture: lt > .95 ? 1 : kick * .5, bounce: cheer ? Math.abs(Math.sin(t * 10)) * 14 : 0, talk: lt > .95 && lt < 1.8 ? 1 : 0 }, t);
    person(x + 120, NPCY + 30, .5, { skin: '#7a4a2c', shirt: '#2B7A6E', gesture: lt > 1.0 ? 1 : 0, bounce: cheer ? Math.abs(Math.sin(t * 11 + 1)) * 14 : 0, hat: 'wrap', wrapCol: '#e8b830' }, t);
  },
});
