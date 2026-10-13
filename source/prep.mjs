// prep.mjs: turn the captured clips and voiced lines into what the seek pages read.
//   node prep.mjs   (after assets/capture and assets/voice are in place)
// Writes assets/clips/<clip>/%05d.jpg (30 fps) and assets/data.js (clip durations, marks, pointer paths, voice lengths).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const marks = JSON.parse(readFileSync('assets/capture/marks.json', 'utf8'));
const probe = f => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim();
const clips = {};
for (const [name, info] of Object.entries(marks)) {
  const src = `assets/capture/${name}.mp4`, dir = `assets/clips/${name}`;
  if (!existsSync(src)) continue;
  if (!existsSync(dir) || !readdirSync(dir).length) {
    mkdirSync(dir, { recursive: true });
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-vf', 'fps=30', '-q:v', '3', join(dir, '%05d.jpg')]);
  }
  const frames = readdirSync(dir).filter(f => f.endsWith('.jpg')).length;
  clips[name] = { frames, duration: frames / 30, marks: Object.fromEntries(info.marks.map(m => [m.label, m.t])), pointer: info.pointer || [] };
}
const voice = {};
if (existsSync('assets/voice')) for (const f of readdirSync('assets/voice').filter(f => f.endsWith('.wav'))) voice[f.slice(0, -4)] = +probe(`assets/voice/${f}`).toFixed(3);
const lines = {};
for (const f of existsSync('assets/narration') ? readdirSync('assets/narration') : []) {
  for (const row of readFileSync(`assets/narration/${f}`, 'utf8').split('\n')) if (row.includes('|')) { const [k, t] = row.split('|'); lines[`${f.slice(0, -4)}-${k}`] = t.trim(); }
}
writeFileSync('assets/data.js', `window.DATA = ${JSON.stringify({ clips, voice, lines }, null, 1)};\n`);
console.log(`clips: ${Object.entries(clips).map(([k, v]) => `${k} ${v.duration.toFixed(1)}s`).join(', ')}`);
console.log(`voice lines: ${Object.keys(voice).length}`);
