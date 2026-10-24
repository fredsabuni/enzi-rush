// Soundtrack for the Cryptic ad, made in code (no samples): a calm electric-piano groove plus small
// UI sounds from the cue list in index.html. Returns a 16-bit stereo WAV as a Buffer.
const SR = 44100;

export function soundtrack(cues, dur) {
  const N = Math.ceil(SR * (dur + .5)), music = new Float32Array(N), sfx = new Float32Array(N);
  let seed = 7; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
  const add = (buf, t, sig, g = 1) => { const i0 = Math.round(t * SR); for (let i = 0; i < sig.length; i++) { const j = i0 + i; if (j >= 0 && j < N) buf[j] += sig[i] * g; } };
  const gen = (d, f) => { const n = Math.round(d * SR), o = new Float32Array(n); for (let i = 0; i < n; i++) o[i] = f(i / SR, i); return o; };
  const hz = m => 440 * Math.pow(2, (m - 69) / 12), TAU = Math.PI * 2;

  // --- instruments
  const epiano = (m, d) => { const f = hz(m); return gen(d, x => (Math.sin(TAU * f * x) + .28 * Math.sin(TAU * 2 * f * x) * Math.exp(-x * 5) + .08 * Math.sin(TAU * 3 * f * x) * Math.exp(-x * 9)) * Math.exp(-x * 1.6) * Math.min(1, x / .006) * (1 + .05 * Math.sin(TAU * 5 * x))); };
  const bass = (m, d) => { const f = hz(m); return gen(d, x => Math.sin(TAU * f * x) * Math.exp(-x * 1.1) * Math.min(1, x / .01)); };
  const kick = () => { let ph = 0; return gen(.25, x => { ph += TAU * (45 + 75 * Math.exp(-x * 30)) / SR; return Math.sin(ph) * Math.exp(-x * 11); }); };
  const hat = () => { let y = 0, p = 0; return gen(.05, x => { const n = rnd(); const h = n - p; p = n; return h * Math.exp(-x * 90); }); };
  const bell = (f, d = 1, g = 1) => gen(d, x => (Math.sin(TAU * f * x) + .4 * Math.sin(TAU * 2.76 * f * x) * Math.exp(-x * 6) + .2 * Math.sin(TAU * 5.4 * f * x) * Math.exp(-x * 12)) * Math.exp(-x * 3.2) * Math.min(1, x / .002) * g);
  const noiseBurst = (d, shape, k = 6) => { let y = 0; return gen(d, (x, i) => { y += (rnd() - y) / k; return y * shape(x / d); }); };

  // --- music: Cmaj9 – Am9 – Fmaj7 – G6 at 92 bpm
  const B = 60 / 92, CH = [[36, [64, 67, 71, 74]], [33, [64, 67, 72, 71]], [29, [64, 69, 72, 76]], [31, [62, 67, 71, 76]]];
  const END = 18.8;
  for (let bar = 0; bar * 4 * B < END; bar++) {
    const t = bar * 4 * B, [root, notes] = CH[bar % 4];
    notes.forEach((m, i) => add(music, t + i * .025, epiano(m, 4 * B + .6), .085));
    add(music, t + 2 * B, epiano(notes[3] + 12, 2 * B), .03); // soft answer on beat 3
    if (t >= 3.0) add(music, t, bass(root + 12, 4 * B), .22);
    for (let b = 0; b < 4; b++) {
      const tb = t + b * B; if (tb >= END - .05) break;
      if (tb >= 3.15 && b % 2 === 0) add(music, tb, kick(), .5);
      if (tb >= 9.55) { add(music, tb + B / 2, hat(), .1); add(music, tb, hat(), .05); }
    }
  }
  // final chord under the end card
  [48, 55, 64, 67, 71, 74].forEach((m, i) => add(music, END + .1 + i * .03, epiano(m, 4.5), .09));
  add(music, END + .1, bass(36, 4.5), .25);

  // --- sound effects
  const FX = {
    pop: () => { let ph = 0; return gen(.09, x => { ph += TAU * (700 + 900 * x / .09) / SR; return Math.sin(ph) * Math.exp(-x * 45); }); },
    tick: () => gen(.04, x => (Math.sin(TAU * 2100 * x) * .6 + rnd() * .4) * Math.exp(-x * 160)),
    key: () => { const f = 1500 + rnd() * 250; return gen(.035, x => (Math.sin(TAU * f * x) * .4 + rnd() * .6) * Math.exp(-x * 220)); },
    whoosh: () => noiseBurst(.42, u => Math.sin(Math.PI * Math.pow(u, .7)) ** 2, 4),
    swipe: () => noiseBurst(.22, u => Math.sin(Math.PI * u) ** 2, 2),
    shuffle: () => noiseBurst(.12, u => Math.sin(Math.PI * u), 3),
    ding: () => bell(hz(84), 1.2, .8),
    chime: () => { const o = new Float32Array(Math.round(SR * 1.6)); [72, 76, 79, 84].forEach((m, i) => { const b = bell(hz(m + 12), 1.3, .7), s = Math.round(i * .09 * SR); for (let j = 0; j < b.length && s + j < o.length; j++) o[s + j] += b[j]; }); return o; },
    count: () => { const o = new Float32Array(Math.round(SR * .75)); for (let k = 0; k < 16; k++) { const t = gen(.02, x => Math.sin(TAU * (1800 + k * 40) * x) * Math.exp(-x * 200)), s = Math.round(k * .045 * SR); for (let j = 0; j < t.length && s + j < o.length; j++) o[s + j] += t[j] * .5; } return o; },
    rise: () => { let ph = 0; return gen(.9, x => { ph += TAU * (330 * Math.pow(2.6, x / .9)) / SR; return Math.sin(ph) * Math.sin(Math.PI * x / .9) * .5; }); },
    logo: () => { const o = new Float32Array(Math.round(SR * 2.5)); [60, 67, 72, 76].forEach((m, i) => { const b = bell(hz(m + 12), 2.4, .45), s = Math.round(i * .06 * SR); for (let j = 0; j < b.length && s + j < o.length; j++) o[s + j] += b[j]; }); return o; },
  };
  const GAIN = { pop: .25, tick: .22, key: .2, whoosh: .35, swipe: .25, shuffle: .3, ding: .3, chime: .35, count: .2, rise: .18, logo: .35 };
  for (const c of cues) if (FX[c.type]) add(sfx, c.t, FX[c.type](), GAIN[c.type]);

  // --- mix: fade in/out, soft-clip, normalise
  const mix = new Float32Array(N); let peak = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR, fade = Math.min(1, t / .6) * Math.min(1, Math.max(0, (dur - t) / 1.2));
    const v = Math.tanh((music[i] * .9 + sfx[i]) * fade * 1.2); mix[i] = v; peak = Math.max(peak, Math.abs(v));
  }
  const norm = peak > 0 ? .89 / peak : 1, frames = Math.round(dur * SR);
  const buf = Buffer.alloc(44 + frames * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + frames * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(frames * 4, 40);
  for (let i = 0; i < frames; i++) { const s = Math.round(Math.max(-1, Math.min(1, mix[i] * norm)) * 32767); buf.writeInt16LE(s, 44 + i * 4); buf.writeInt16LE(s, 46 + i * 4); }
  return buf;
}
