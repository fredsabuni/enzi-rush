// Sound: tiny WebAudio synth (no audio files to download). Unlocked on the first tap.
const SFX = (() => {
  let ac = null, master = null, muted = false, musicOn = false, musicTimer = null, step = 0;
  try { muted = localStorage.getItem('hze_mute') === '1'; } catch (e) { }
  function unlock() {
    if (!ac) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return; ac = new A(); master = ac.createGain(); master.gain.value = muted ? 0 : .5; master.connect(ac.destination); }
    if (ac.state === 'suspended') ac.resume();
  }
  function tone(f, d, { type = 'square', g = .15, slide = 0, at = 0, vib = 0 } = {}) {
    if (!ac) return; const t = ac.currentTime + at, o = ac.createOscillator(), a = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + d);
    if (vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = vib; lg.gain.value = f * .06; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + d); }
    a.gain.setValueAtTime(g, t); a.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(a); a.connect(master); o.start(t); o.stop(t + d + .02);
  }
  function noise(d, g = .2, at = 0, hp = 800) {
    if (!ac) return; const t = ac.currentTime + at, n = Math.floor(ac.sampleRate * d), b = ac.createBuffer(1, n, ac.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), a = ac.createGain(); f.type = 'highpass'; f.frequency.value = hp; a.gain.value = g; s.buffer = b; s.connect(f); f.connect(a); a.connect(master); s.start(t);
  }
  const nf = m => 440 * Math.pow(2, (m - 69) / 12);
  const play = {
    bean: () => { tone(1320, .06, { g: .07 }); tone(1980, .08, { g: .06, at: .05 }); },
    gold: () => [0, 4, 7, 12].forEach((m, i) => tone(nf(84 + m), .12, { g: .08, at: i * .06 })),
    jump: () => tone(380, .16, { slide: 520, g: .08 }),
    flip: () => { tone(520, .1, { slide: 700, g: .07 }); noise(.12, .05, 0, 3000); },
    land: () => noise(.07, .1, 0, 400),
    stomp: () => { tone(220, .12, { slide: -120, g: .14, type: 'triangle' }); tone(880, .1, { g: .06, at: .08 }); },
    hit: () => { tone(200, .3, { slide: -140, g: .14, type: 'sawtooth' }); noise(.2, .12, 0, 300); },
    whistle: () => { tone(2600, .5, { type: 'sine', g: .12, vib: 28 }); tone(2600, .35, { type: 'sine', g: .1, vib: 28, at: .6 }); },
    honk: () => { tone(330, .22, { type: 'square', g: .07 }); tone(392, .22, { type: 'square', g: .05 }); tone(330, .3, { type: 'square', g: .07, at: .28 }); },
    splash: () => noise(.3, .12, 0, 1500),
    fall: () => tone(600, .7, { slide: -520, g: .1, type: 'triangle' }),
    nguvu: () => [0, 3, 7, 10, 12, 15].forEach((m, i) => tone(nf(72 + m), .14, { g: .08, at: i * .05, type: 'sawtooth' })),
    deliver: () => [0, 4, 7, 12, 7, 12, 16].forEach((m, i) => tone(nf(72 + m), .18, { g: .09, at: i * .09, type: 'triangle' })),
    tick: () => tone(1500, .03, { g: .04 }),
    over: () => [7, 5, 3, 0].forEach((m, i) => tone(nf(64 + m), .3, { g: .09, at: i * .2, type: 'triangle' })),
  };
  // light street groove so the game doesn't feel empty
  const prog = [[48, [60, 64, 67]], [45, [60, 64, 69]], [41, [60, 65, 69]], [43, [59, 62, 67]]];
  function beat() {
    if (!ac || !musicOn) return; const B = 60 / 132 / 4, bar = Math.floor(step / 16), s = step % 16, [root] = prog[bar % 4];
    if (s === 0 || s === 8 || s === 10) tone(110, .14, { slide: -60, type: 'sine', g: .22 });
    if (s === 4 || s === 12) noise(.08, .06, 0, 2000);
    if (s % 2 === 0) noise(.02, .025, 0, 7000);
    if ([0, 3, 7, 8, 11, 14].includes(s)) tone(nf(root - 12 + (s === 7 || s === 14 ? 12 : 0)), B * 1.6, { type: 'triangle', g: .09 });
    if (s === 0 && bar % 2 === 0) prog[bar % 4][1].forEach(m => tone(nf(m), B * 7, { type: 'sine', g: .025 }));
    step++; musicTimer = setTimeout(beat, B * 1000);
  }
  return {
    unlock, play: k => { if (!muted && ac && play[k]) play[k](); },
    music(on) { musicOn = on; clearTimeout(musicTimer); if (on) beat(); },
    toggle() { muted = !muted; try { localStorage.setItem('hze_mute', muted ? '1' : '0'); } catch (e) { } if (master) master.gain.value = muted ? 0 : .5; return muted; },
    get muted() { return muted; },
  };
})();
