// SCENE 11 — SAFARI COMPLETE. The café keeps playing underneath (Enzi winks & waves) while the
// level-complete card pops with three stars.
scene({
  id: 'complete', dur: 2.2, kind: 'complete',
  cues: [[0, 'complete'], [.5, 'star'], [.72, 'star'], [.94, 'star']],
  render(T, lt) {
    const cafe = SC('cafe'); renderCafe(T, T - cafe.start, cafe);
    const a = win(lt, 0, .3) * (1 - win(lt, this.dur - .3, this.dur));
    ctx.save(); ctx.globalAlpha = a; const k = backOut(win(lt, 0, .4)); ctx.translate(CX, 470); ctx.scale(k, k);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; rr(-442, -316, 900, 660, 50); ctx.fill();
    ctx.fillStyle = C.cream; rr(-450, -330, 900, 660, 50); ctx.fill(); ctx.lineWidth = 12; ctx.strokeStyle = C.coffee; ctx.stroke();
    ctx.fillStyle = C.orange; rr(-450, -330, 900, 160, [50, 50, 0, 0]); ctx.fill();
    text('SAFARI COMPLETE!', 0, -250, { size: 92, sw: 16, stroke: C.coffee, shadow: 6 });
    for (let i = 0; i < 3; i++) { const sp = backOut(win(lt, .5 + i * .22, .8 + i * .22)); if (sp <= 0) continue; ctx.save(); ctx.translate((i - 1) * 150, -95 - (i === 1 ? 20 : 0)); ctx.scale(sp * (i === 1 ? 1.2 : 1), sp * (i === 1 ? 1.2 : 1)); ctx.rotate((i - 1) * .15);
      ctx.fillStyle = C.goldL; ctx.beginPath(); for (let j = 0; j < 10; j++) { const r = j % 2 ? 26 : 60, an = -Math.PI / 2 + j * Math.PI / 5; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); } ctx.closePath(); ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = C.coffee; ctx.stroke(); ctx.restore(); }
    [['BEANS', String(BEANS.length)], ['FRIENDS', '3/3'], ['VIBE', '100%']].forEach(([l, v], i) => { const x = (i - 1) * 280; ctx.fillStyle = C.creamD; rr(x - 120, 10, 240, 150, 28); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#e6dac9'; ctx.stroke(); text(v, x, 70, { size: 64, color: C.coffee }); text(l, x, 130, { size: 30, color: '#8a6a55' }); });
    text('Kila kikombe ni safari', 0, 240, { size: 50, font: 'Fraunces', weight: 800, italic: 'italic', color: C.orange });
    ctx.restore();
  },
});
