// SCENE 12 — END CARD. Logo, tagline, handle, both locations; Enzi rolls in and waves.
const END = { tag: 'KILA KIKOMBE NI SAFARI', line1: 'Taste Tanzania.', line2: 'Join the movement.', cta: '@harakatizaenzi', where: 'MBEZI  ·  VICTORIA  ·  DAR ES SALAAM' };
let LOGO = null;
scene({
  id: 'endcard', dur: 4.0, kind: 'endcard', music: 'end',
  cues: [[0, 'end']],
  render(T, lt) {
    const g = ctx.createRadialGradient(CX, 760, 50, CX, 900, 1300); g.addColorStop(0, '#5a2c16'); g.addColorStop(.6, '#2e1a10'); g.addColorStop(1, '#160c08'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(CX, 520); ctx.rotate(T * .15); ctx.fillStyle = 'rgba(232,126,58,.08)'; for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-90, -1100); ctx.lineTo(90, -1100); ctx.fill(); } ctx.restore();
    const k = backOut(win(lt, .1, .7)); if (LOGO) { const lw = 440 * k, lh = lw * 1955 / 2147; ctx.drawImage(LOGO, CX - lw / 2, 480 - lh / 2, lw, lh); }
    ctx.save();
    ctx.globalAlpha = win(lt, .5, 1); text(END.tag, CX, 770, { size: 40, color: C.goldL, font: 'Nunito', weight: 900, ls: 6 });
    ctx.globalAlpha = win(lt, .9, 1.4); text(END.line1, CX, 900, { size: 92, font: 'Fraunces', weight: 800 }); text(END.line2, CX, 1005, { size: 92, color: C.orangeL, font: 'Fraunces', weight: 800 });
    ctx.globalAlpha = 1; const k4 = backOut(win(lt, 1.4, 1.8)); ctx.save(); ctx.translate(CX, 1160); ctx.scale(k4, k4); ctx.fillStyle = C.orange; rr(-310, -56, 620, 112, 56); ctx.fill(); text(END.cta, 0, 2, { size: 50, font: 'Nunito', weight: 900 }); ctx.restore();
    ctx.globalAlpha = win(lt, 1.8, 2.2); text(END.where, CX, 1275, { size: 34, color: C.goldL, font: 'Nunito', weight: 800, ls: 4 });
    ctx.restore();
    const p = easeOut(win(lt, .4, 1.5)), P = basePose();
    Object.assign(P, { x: lerp(-250, CX - 30, p), y: 1820, scale: .85, lean: p < .98 ? .14 : 0, hF: p > .98 ? [130 + Math.sin(T * 9) * 25, -390 + Math.cos(T * 9) * 15] : [130, -250], hB: [-130, -260], eyes: (T % 2.4) < .12 ? 'blink' : (lt > 2.6 && lt < 3.0 ? 'wink' : 'open'), mouth: 'grin', brows: 1, steam: 1.2, blush: .5, drag: p < .98 ? .5 : 0 });
    drawEnzi(P, T);
    const fade = win(lt, this.dur - .6, this.dur); if (fade > 0) { ctx.fillStyle = `rgba(0,0,0,${fade})`; ctx.fillRect(0, 0, W, H); }
  },
});
