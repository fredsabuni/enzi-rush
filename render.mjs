// node render.mjs video                 → full video_noaudio.mp4 (+ events.json for audio.py)
// node render.mjs scene <id> [<id>...]  → out/scenes/<id>.mp4 for a quick look at one scene (muxes audio.wav if present)
// node render.mjs stills 12.5 cafe@3.2 → out/stills/*.jpg (global seconds, or scene@seconds-into-scene)
// node render.mjs list                  → scene list with start/end times
import { chromium } from '/Users/waky/.claude/skills/gstack/node_modules/playwright/index.mjs';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
const [, , mode = 'list', ...args] = process.argv;
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', e => console.log('[err]', e.message)); page.on('console', m => m.type() === 'error' && console.log('[console]', m.text()));
await page.goto('file://' + process.cwd() + '/index.html');
await page.evaluate(() => window.ready);
const meta = await page.evaluate(() => window.META);
fs.writeFileSync('events.json', JSON.stringify(await page.evaluate(() => ({ events: window.EVENTS, roll: window.ROLL, rush: window.RUSHENV, meta: window.META }))));
const fps = 30, grab = async t => Buffer.from((await page.evaluate(t => window.frame(t, .95), t)).split(',')[1], 'base64');
async function encode(t0, t1, out) {
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'medium', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round((t1 - t0) * fps);
  for (let i = 0; i < n; i++) { const b = await grab(t0 + i / fps); if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r)); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
if (mode === 'list') for (const s of meta.scenes) console.log(s.id.padEnd(10), s.kind.padEnd(9), s.start.toFixed(2).padStart(6), '→', s.end.toFixed(2).padStart(6));
else if (mode === 'video') { await encode(0, meta.DUR, 'video_noaudio.mp4'); console.log('video_noaudio.mp4', meta.DUR.toFixed(2) + 's'); }
else if (mode === 'scene') { fs.mkdirSync('out/scenes', { recursive: true });
  for (const id of args) { const s = meta.scenes.find(s => s.id === id); if (!s) { console.log('no scene', id); continue; }
    const v = `out/scenes/${id}_v.mp4`; await encode(s.start, s.end, v);
    const out = `out/scenes/${id}.mp4`;
    if (fs.existsSync('audio.wav')) spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', v, '-ss', String(s.start), '-t', String(s.end - s.start), '-i', 'audio.wav', '-c:v', 'copy', '-c:a', 'aac', '-shortest', out]); else fs.renameSync(v, out);
    console.log(out); } }
else if (mode === 'stills') { fs.mkdirSync('out/stills', { recursive: true });
  for (const a of args) { let t = +a; if (a.includes('@')) { const [id, lt] = a.split('@'); t = meta.scenes.find(s => s.id === id).start + +lt; }
    fs.writeFileSync(`out/stills/${a.replace('@', '_')}.jpg`, await grab(t)); } }
await browser.close();
