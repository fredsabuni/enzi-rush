// SCENE 8 — STOP: NEEMA at the Victoria daladala stage, doing jumping jacks. Plugs Saturday aerobics at Mbezi.
scene({
  id: 'neema', dur: 2.6, kind: 'stop', npc: 'neema',
  portrait: { skin: '#7a4a2c', hat: 'wrap', wrapCol: '#C4510E', earring: true },
  lines: [
    [.15, 1.35, 'NEEMA', 'Aerobics Mbezi, Jumamosi saa moja!', 'Aerobics at Mbezi, Saturday 7AM!'],
    [1.35, 2.55, 'ENZI', 'Nitakuwepo! Leo ni Victoria.', 'I\'ll be there! Today, Victoria.'],
  ],
  drawWorld(t, lt, s) {
    const x = wx(NPC.neema.x); if (x < -500 || x > W + 500) return;
    busStop(x + 300, NPCY - 10, t);
    const talking = lt > .05 && lt < s.dur, sp = speaking('NEEMA', t);
    person(x, NPCY, .9, { skin: '#7a4a2c', shirt: '#9a6fb0', pattern: '#e8b830', hat: 'wrap', wrapCol: C.orange, earring: true, talk: sp, gesture: talking ? (sp ? .9 : .35) : 0, holding: talking ? 'flyer' : null, jj: talking ? 0 : 1, bounce: talking ? 0 : Math.abs(Math.sin(t * 7)) * 22 }, t);
  },
});
