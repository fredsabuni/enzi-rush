// SCENE 3 — STOP: BARAKA (the boda rider who sent the WhatsApp). Offers a lift; Enzi has NGUVU.
// lines: [start, end, speaker, Swahili, English] in scene seconds.
scene({
  id: 'baraka', dur: 2.6, kind: 'stop', npc: 'baraka', npcOffset: 40,
  portrait: { skin: '#5a3420', hat: 'helmet' },
  lines: [
    [.15, 1.35, 'BARAKA', 'Oya blaza! Victoria? Nikupe lifti?', 'Yo bro! Victoria? Need a lift?'],
    [1.35, 2.55, 'ENZI', 'Hapana kaka, nina NGUVU!', 'Nah bro, I\'ve got NGUVU!'],
  ],
  cues: [[-.05, 'horn']],
  drawWorld(t, lt, s) {
    const x = wx(NPC.baraka.x); if (x < -400 || x > W + 400) return;
    motorbike(x + 170, NPCY, 1);
    const sp = speaking('BARAKA', t), laugh = lt > 1.9 && lt < s.dur;
    const gesture = lt > .1 && lt < s.dur ? (sp ? 1 : laugh ? .7 : .2) : (lt > -.7 && lt <= .1 ? .9 : 0);
    person(x, NPCY, .92, { skin: '#5a3420', shirt: '#2e2a40', vest: true, hat: 'helmet', talk: sp || (laugh ? .6 : 0), gesture, bounce: laugh ? Math.abs(Math.sin(t * 14)) * 8 : Math.abs(Math.sin(t * 3)) * 3 }, t);
  },
});
