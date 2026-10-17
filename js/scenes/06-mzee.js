// SCENE 6 — STOP: MZEE JUMA at his madafu cart. The tagline lands here.
scene({
  id: 'mzee', dur: 2.6, kind: 'stop', npc: 'mzee',
  portrait: { skin: '#6b4026', hat: 'kofia', beard: true },
  lines: [
    [.15, 1.35, 'MZEE JUMA', 'Haraka ya nini, Enzi?', 'What\'s the rush, Enzi?'],
    [1.35, 2.55, 'ENZI', 'Kila kikombe ni safari, Mzee!', 'Every cup is a journey, Mzee!'],
  ],
  drawWorld(t, lt, s) {
    const x = wx(NPC.mzee.x); if (x < -400 || x > W + 400) return;
    madafuCart(x + 190, NPCY);
    const sp = speaking('MZEE JUMA', t);
    person(x, NPCY, .9, { skin: '#6b4026', robe: true, hat: 'kofia', beard: true, talk: sp, gesture: sp ? .8 : (lt > 1.4 && lt < s.dur ? .5 : 0), bounce: lt > 2.0 && lt < s.dur ? Math.abs(Math.sin(t * 12)) * 5 : 0 }, t);
  },
});
