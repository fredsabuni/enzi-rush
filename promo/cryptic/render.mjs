// Renders the Cryptic Crossword ad.
//   node promo/cryptic/render.mjs              → promo/cryptic/out/cryptic-promo.mp4 (video + sound)
//   node promo/cryptic/render.mjs stills 2 6.5 → promo/cryptic/out/stills/*.jpg (spot-check frames)
// Needs ffmpeg and Playwright's Chromium. Set PLAYWRIGHT (path to playwright's index.mjs) and CHROMIUM
// (browser executable) if they live somewhere else on your machine.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { soundtrack } from './sound.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), OUT = path.join(HERE, 'out');
const PW = process.env.PLAYWRIGHT || `${process.env.HOME}/.npm/_npx/a78846c3c5730f70/node_modules/playwright/index.mjs`;
const EXE = process.env.CHROMIUM || `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1148/chrome-mac/Chromium.app/Contents/MacOS/Chromium`;
const { chromium } = await import(PW);
const [, , mode = 'video', ...args] = process.argv;
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: fs.existsSync(EXE) ? EXE : undefined, args: ['--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', e => console.log('[page error]', e.message));
await page.goto('file://' + path.join(HERE, 'index.html') + '?render=1');
await page.evaluate(() => window.ready);
const { DUR, CUES } = await page.evaluate(() => ({ DUR: window.DUR, CUES: window.CUES }));
const fps = 30, grab = async t => Buffer.from((await page.evaluate(t => window.frame(t, .95), t)).split(',')[1], 'base64');

if (mode === 'stills') {
  fs.mkdirSync(path.join(OUT, 'stills'), { recursive: true });
  for (const a of args) { const f = path.join(OUT, 'stills', `t${(+a).toFixed(2)}.jpg`); fs.writeFileSync(f, await grab(+a)); console.log(f); }
} else {
  const silent = path.join(OUT, 'video_noaudio.mp4'), wav = path.join(OUT, 'audio.wav'), final = path.join(OUT, 'cryptic-promo.mp4');
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(DUR * fps);
  for (let i = 0; i < n; i++) {
    const b = await grab(i / fps); if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 90 === 0) process.stdout.write(`frames ${i}/${n}\r`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  fs.writeFileSync(wav, soundtrack(CUES, DUR));
  const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', silent, '-i', wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', final], { stdio: 'inherit' });
  console.log(r.status === 0 ? `\n${final}  (${DUR}s, 1080×1920, ${fps}fps)` : '\nffmpeg mux failed');
}
await browser.close();
