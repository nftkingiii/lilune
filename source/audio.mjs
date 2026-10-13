// audio.mjs <film>: build the film's audio from the same timeline the page draws.
//   voice: each narrated line placed at its shot's voiceAt → out/<film>/voice.wav
//   sfx:   a click on every captured click that is on screen, a soft swish on clip changes, a chime on cards → out/<film>/sfx.wav
//   bed:   a quiet synthesized pad (no samples, nothing to license) → out/<film>/bed.wav
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';

const film = process.argv[2] || 'demo', out = `out/${film}`;
mkdirSync(out, { recursive: true });
const ctx = { window: {}, SPECS: {}, CARDS: {} }; ctx.globalThis = ctx; vm.createContext(ctx);
for (const f of ['assets/data.js', 'lib/film.js', `films/${film}.spec.js`]) vm.runInContext(readFileSync(f, 'utf8'), ctx);
const W_ = ctx.window, D = W_.DATA, T = W_.timeline(ctx.SPECS[film], D), dur = T.at(-1).to;
writeFileSync(`${out}/timeline.json`, JSON.stringify(T.map(({ kind, clip, line, from, to, voiceAt }) => ({ kind, clip, line, from: +from.toFixed(2), to: +to.toFixed(2), voiceAt })), null, 1));

// Voice
const voiced = T.filter(s => s.voiceAt !== null);
if (voiced.length) {
  const inputs = voiced.flatMap(s => ['-i', `assets/voice/${s.line}.wav`]);
  const chains = voiced.map((s, i) => `[${i}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round(s.voiceAt * 1000)}|${Math.round(s.voiceAt * 1000)}[v${i}]`);
  const filter = `${chains.join(';')};${voiced.map((_, i) => `[v${i}]`).join('')}amix=inputs=${voiced.length}:normalize=0,apad,atrim=0:${dur.toFixed(3)}[a]`;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filter, '-map', '[a]', `${out}/voice.wav`]);
}

// SFX cues
const cues = [];
T.forEach((s, i) => {
  if (s.kind === 'clip') {
    const speed = W_.clipSpeed(s);
    for (const p of D.clips[s.clip].pointer) if (p.click && p.t >= s.range[0] && p.t <= s.range[1]) {
      const t = s.from + .1 + (p.t - s.range[0]) / speed;
      if (t < s.to - .05) cues.push({ t: +(t - .03).toFixed(3), type: 'click', vol: .32, pitch: 1 + (i % 3) * .04 });
    }
  }
  const prev = T[i - 1];
  if (prev && (s.kind !== 'clip' || prev.kind !== 'clip' || prev.clip !== s.clip)) cues.push({ t: +(s.from - .12).toFixed(3), type: 'swish', vol: .18 });
  if (s.kind === 'type') cues.push({ t: +(s.from + .1).toFixed(3), type: 'chime', vol: .16, pitch: s === T.at(-1) ? .75 : 1 });
  if (s.sfx) for (const c of s.sfx) cues.push({ ...c, t: +(s.from + c.at).toFixed(3) });
});
writeFileSync(`${out}/cues.json`, JSON.stringify(cues, null, 1));
execFileSync('node', ['sfx.mjs', `${out}/cues.json`, `${out}/sfx.wav`, `--dur=${dur.toFixed(2)}`], { stdio: 'inherit' });

// Bed: slow maj7 pad, four chords, gentle attack and release. Pure function of the sample index.
const SR = 48000, n = Math.ceil(dur * SR), L = new Float32Array(n), R = new Float32Array(n);
const chords = [[261.63, 329.63, 392, 493.88], [220, 261.63, 329.63, 392], [174.61, 220, 261.63, 329.63], [196, 246.94, 293.66, 392]];
const bar = 4;
for (let i = 0; i < n; i++) {
  const t = i / SR, c = Math.floor(t / bar), local = t - c * bar, ch = chords[c % 4];
  const env = Math.min(1, local / 1.4) * Math.min(1, (bar + .8 - local) / 1.2);
  let l = 0, r = 0;
  ch.forEach((f, j) => { const v = Math.sin(2 * Math.PI * f * t + j) * .5 + Math.sin(2 * Math.PI * f * 2.003 * t) * .08; l += v * (j % 2 ? .7 : 1); r += v * (j % 2 ? 1 : .7); });
  const sub = Math.sin(2 * Math.PI * ch[0] / 2 * t) * .35;
  const fade = Math.min(1, t / 2) * Math.min(1, (dur - t) / 2.5);
  L[i] = (l * .1 + sub * .12) * env * fade; R[i] = (r * .1 + sub * .12) * env * fade;
}
const b = Buffer.alloc(44 + n * 4);
b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 4, 40);
for (let i = 0; i < n; i++) { b.writeInt16LE(Math.round(Math.tanh(L[i]) * 32767), 44 + i * 4); b.writeInt16LE(Math.round(Math.tanh(R[i]) * 32767), 46 + i * 4); }
writeFileSync(`${out}/bed.wav`, b);
console.log(`${film}: ${dur.toFixed(1)} s, ${voiced.length} voice lines, ${cues.length} sfx cues`);
