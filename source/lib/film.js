// film.js: shared engine for the Lilune films. Classic script, loaded after motion.js and assets/data.js.
// A film is window.SPEC = [shot, ...]. timeline() turns it into timed shots (the same function runs in Node to
// place the voice and SFX), and mount() wires window.FILM / window.seek for render.mjs.
// Shot kinds:
//   { kind: 'clip', clip, range: [a, b], line, min, pad, cam: [[k, cx, cy, zoom], ...], hide: [[x,y,w,h]] }
//     plays clip seconds a..b stretched to the shot length (speed capped), camera keys at shot fractions k
//   { kind: 'type', line, min, pad, draw: 'name' }  a code-drawn card from CARDS[name]
(function (root) {
  const BASE_W = 1920, BASE_H = 1080, LEAD = 0.35;

  function shotLength(s, D) {
    const v = s.line ? (D.voice[s.line] || 0) : 0;
    return Math.max(s.min || 0, v ? LEAD + v + (s.pad ?? 0.7) : 0, s.len || 0);
  }
  // Pure: spec + data -> [{...shot, from, to, voiceAt}]
  function timeline(spec, D) {
    let t = 0;
    return spec.map(s => { const len = shotLength(s, D), out = { ...s, from: t, to: t + len, voiceAt: s.line && D.voice[s.line] ? t + LEAD : null }; t += len; return out; });
  }
  // Clip time for shot-local time lt. Speeds outside [0.5, 2.6] hold the end frame instead of crawling or racing.
  const clipSpeed = s => Math.min(2.6, Math.max(0.5, (s.range[1] - s.range[0]) / Math.max(0.01, s.to - s.from - 0.4)));
  function clipTime(s, lt) { return Math.min(s.range[1], s.range[0] + Math.max(0, lt - 0.1) * clipSpeed(s)); }
  // Pointer path from the capture log: each move is a pair of samples (start, end) at the same target; a click follows.
  function pointerAt(clip, ct) {
    const P = clip.pointer; if (!P.length || ct < P[0].t - 0.4) return null;
    let x = P[0].x, y = P[0].y, press = 0;
    for (let i = 0; i < P.length; i++) {
      const p = P[i];
      if (ct >= p.t) { x = p.x; y = p.y; }
      else if (i > 0 && P[i - 1].t <= ct) {
        const q = P[i - 1], k = (ct - q.t) / Math.max(0.01, p.t - q.t), e = 1 - Math.pow(1 - k, 3);
        x = q.x + (p.x - q.x) * e; y = q.y + (p.y - q.y) * e; break;
      } else break;
    }
    for (const p of P) if (p.click) press = Math.max(press, 1 - Math.min(1, Math.abs(ct - p.t) / 0.14));
    const first = P[0].t - 0.4;
    return { x, y, press, alpha: Math.min(1, (ct - first) / 0.3) };
  }

  function mount(spec, opts = {}) {
    const D = root.DATA, Q = new URLSearchParams(location.search);
    const W = +(Q.get('w') || BASE_W), H = +(Q.get('h') || BASE_H), L = layout(W, H), u = L.u;
    const T = timeline(spec, D), dur = T.at(-1).to + (opts.tail || 0);
    root.FILM = { w: W, h: H, dur: +dur.toFixed(3), fps: 30 };
    root.TIMELINE = T;
    const C = { bg: '#F8F7F3', ink: '#242329', mute: '#77747F', accent: '#7955D9', lilac: '#F0EDF9', line: '#E3E0D9', deep: '#2B2340' };
    const F = { display: '"Instrument Serif", Georgia, serif', ui: '"DM Sans", system-ui, sans-serif' };
    const cv = document.getElementById('c'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d');

    const SEQ = {};
    for (const [name, c] of Object.entries(D.clips)) SEQ[name] = { frames: c.frames, cache: new Map() };
    function frameOf(name, t) {
      const s = SEQ[name], n = Math.min(s.frames, Math.max(1, Math.floor(t * 30) + 1)), key = String(n).padStart(5, '0');
      if (!s.cache.has(key)) { const i = new Image(); i.src = `assets/clips/${name}/${key}.jpg`; s.cache.set(key, i.decode().then(() => i, () => null)); if (s.cache.size > 60) s.cache.delete(s.cache.keys().next().value); }
      return s.cache.get(key);
    }
    const IMG = {};
    const img = (name, src) => { const i = new Image(); i.src = src; IMG[name] = i; return i.decode().catch(() => { IMG[name] = null; }); };

    function text(str, x, y, size, o = {}) {
      g.save(); g.font = `${o.italic ? 'italic ' : ''}${o.weight || 400} ${size}px ${o.font || F.display}`; g.fillStyle = o.color || C.ink;
      g.textAlign = o.align || 'center'; g.textBaseline = o.base || 'middle'; g.globalAlpha *= o.alpha ?? 1;
      if (o.track) g.letterSpacing = o.track + 'px';
      g.fillText(str, x, y); const w = g.measureText(str).width; g.restore(); return w;
    }
    function measure(str, size, o = {}) { g.save(); g.font = `${o.italic ? 'italic ' : ''}${o.weight || 400} ${size}px ${o.font || F.display}`; if (o.track) g.letterSpacing = o.track + 'px'; const w = g.measureText(str).width; g.restore(); return w; }
    function wrap(str, size, maxW, o = {}) {
      const words = str.split(' '), rows = []; let row = '';
      for (const w of words) { const next = row ? row + ' ' + w : w; if (measure(next, size, o) > maxW && row) { rows.push(row); row = w; } else row = next; }
      if (row) rows.push(row); return rows;
    }
    const rrect = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
    function cursor(x, y, press = 0, alpha = 1) {
      g.save(); g.globalAlpha = alpha; g.translate(x, y); const s = (1 - .14 * press) * 1.15 * u; g.scale(s, s);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 34); g.lineTo(9, 26); g.lineTo(16, 40); g.lineTo(22, 37); g.lineTo(15, 24); g.lineTo(26, 24); g.closePath();
      g.shadowColor = 'rgba(36,35,41,.25)'; g.shadowBlur = 8; g.shadowOffsetY = 2;
      g.fillStyle = C.ink; g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.fill(); g.stroke(); g.restore();
    }
    // Caption for the narrated line: lower third, two rows max, on a quiet ivory plate.
    function caption(line, lt, left) {
      const str = D.lines[line]; if (!str || opts.captions === false) return;
      const size = (L.portrait ? 40 : 32) * u, maxW = Math.min(W - 2 * L.safe.side, 1240 * u), rows = wrap(str, size, maxW, { font: F.ui, weight: 500 });
      const k = spring(lt + .05, ...SPRINGS.snappy), out = clamp(left / .2);
      const lh = size * 1.32, h = rows.length * lh + 30 * u, w = Math.max(...rows.map(r => measure(r, size, { font: F.ui, weight: 500 }))) + 56 * u;
      const y = H - (L.portrait ? L.safe.bottom : 56 * u) - h + (1 - k) * 14 * u;
      g.save(); g.globalAlpha = clamp(k * 1.4) * out;
      g.fillStyle = 'rgba(248,247,243,.94)'; g.strokeStyle = 'rgba(121,85,217,.28)'; g.lineWidth = 1.5 * u;
      g.shadowColor = 'rgba(36,35,41,.16)'; g.shadowBlur = 30 * u; g.shadowOffsetY = 8 * u;
      rrect(L.cx - w / 2, y, w, h, 16 * u); g.fill(); g.shadowColor = 'transparent'; g.stroke();
      rows.forEach((r, i) => text(r, L.cx, y + 15 * u + lh * (i + .5), size, { font: F.ui, weight: 500, color: C.ink }));
      g.restore();
    }
    // Camera: keys [[k, cx, cy, zoom]] over the shot (k = fraction). Springs between keys; clamped to the frame.
    function camera(s, lt) {
      const len = s.to - s.from, keys = (s.cam || [[0, 960, 540, 1]]).map(([k, x, y, z]) => [k * len, [x, y, z]]);
      let [cx, cy, z] = keys.length > 1 ? trackN(lt, keys, 60, 16) : keys[0][1];
      const scale = Math.max(W / BASE_W, H / BASE_H) * z;
      const halfW = W / 2 / scale, halfH = H / 2 / scale;
      cx = Math.min(BASE_W - halfW, Math.max(halfW, cx)); if (!s.free) cy = Math.min(BASE_H - halfH, Math.max(halfH, cy));
      return { scale, x: W / 2 - cx * scale, y: H / 2 - cy * scale };
    }
    const toScreen = (cam, x, y) => [cam.x + x * cam.scale, cam.y + y * cam.scale];

    async function drawClip(s, lt) {
      const ct = clipTime(s, lt), im = await frameOf(s.clip, ct), cam = camera(s, lt);
      g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
      if (im) g.drawImage(im, cam.x, cam.y, BASE_W * cam.scale, BASE_H * cam.scale);
      else { g.fillStyle = '#FF3B30'; g.fillRect(0, 0, W, H); text('MISSING CLIP ' + s.clip, L.cx, L.cy, 60 * u, { font: F.ui, weight: 700, color: '#fff' }); }
      if (s.cursor !== false) {
        const p = pointerAt(D.clips[s.clip], ct);
        if (p) {
          const [x, y] = toScreen(cam, p.x, p.y);
          if (p.press > 0) { g.save(); g.globalAlpha = p.press * .3; g.fillStyle = C.accent; g.beginPath(); g.arc(x, y, 34 * u * (1.6 - p.press * .6), 0, Math.PI * 2); g.fill(); g.restore(); }
          cursor(x, y, p.press, p.alpha);
        }
      }
      if (s.label) chip(s.label, lt);
      if (s.timer) {   // elapsed capture time from Mera signing to the feed showing the launch (marks from the capture)
        const m = D.clips[s.clip].marks, t0 = m.signing, t1 = m.feed, e = Math.max(0, Math.min(ct, t1) - t0);
        const str = ct < t0 ? 'Waiting for signature' : ct < t1 ? `Signed · ${e.toFixed(1)} s` : `Signed → indexed in ${(t1 - t0).toFixed(1)} s`;
        const size = 26 * u, w = measure(str, size, { font: F.ui, weight: 700 }) + 48 * u, x = W - L.safe.side - w, y = 44 * u;
        g.save(); g.fillStyle = ct >= t1 ? '#25683A' : C.accent; rrect(x, y, w, 52 * u, 26 * u); g.fill();
        text(str, x + w / 2, y + 27 * u, size, { font: F.ui, weight: 700, color: '#fff' }); g.restore();
      }
    }
    // A small evidence chip (e.g. "Recorded live · Monad testnet"): top-left of the safe area, only when it adds a fact.
    function chip(str, lt) {
      const size = 22 * u, w = measure(str, size, { font: F.ui, weight: 600 }) + 40 * u, x = L.safe.side, y = (L.portrait ? L.safe.top : 44 * u);
      const k = spring(lt - .2, ...SPRINGS.snappy);
      g.save(); g.globalAlpha = clamp(k * 1.5); g.fillStyle = C.deep; rrect(x, y, w, 44 * u, 22 * u); g.fill();
      g.fillStyle = '#7EE2A8'; g.beginPath(); g.arc(x + 20 * u, y + 22 * u, 5 * u, 0, Math.PI * 2); g.fill();
      text(str, x + 34 * u, y + 23 * u, size, { font: F.ui, weight: 600, color: '#fff', align: 'left' }); g.restore();
    }

    const api = { g, W, H, L, u, C, F, IMG, img, text, measure, wrap, rrect, cursor, chip, spring, SPRINGS, clamp, seg, track, trackN, easeOut, ease };
    const CARDS = opts.cards || {};
    async function draw(t) {
      const i = T.findIndex(s => t >= s.from && t < s.to), s = T[i === -1 ? T.length - 1 : i], lt = t - s.from;
      if (s.kind === 'clip') await drawClip(s, lt);
      else { g.fillStyle = C.bg; g.fillRect(0, 0, W, H); CARDS[s.draw](api, lt, s.to - s.from, s); }
      // Captions follow the voice, not the shot, so a line can run across a cut.
      for (const v of T) if (v.voiceAt !== null && v.caption !== false) {
        const end = v.voiceAt + D.voice[v.line] + .35;
        if (t >= v.voiceAt - .05 && t < end) caption(v.line, t - v.voiceAt, end - t);
      }
      // Seam: a short push from the next shot (cut on action), plus an accent bar sweep when the clip changes.
      const n = T[i + 1];
      if (n && n.from - t < .16 && (n.kind !== 'clip' || n.clip !== s.clip)) {
        const k = 1 - (n.from - t) / .16; g.save(); g.globalAlpha = .9 * k; g.fillStyle = C.accent; g.fillRect(0, H - 8 * u, W * easeOut(k), 8 * u); g.restore();
      }
    }
    root.ready = Promise.all([
      document.fonts.load(`400 100px ${F.display}`), document.fonts.load(`italic 400 100px ${F.display}`),
      document.fonts.load(`500 100px ${F.ui}`), document.fonts.load(`600 100px ${F.ui}`), document.fonts.load(`700 100px ${F.ui}`),
      img('logo', 'assets/lilune-logo.png'), ...(opts.images || []).map(([n, s]) => img(n, s)),
    ]);
    root.seek = async t => { await root.ready; await draw(t); };
    if (!Q.has('render')) {
      let t = 0, playing = true, last = performance.now();
      addEventListener('click', () => playing = !playing);
      addEventListener('keydown', e => { const d = e.shiftKey ? 1 : 1 / 30; if (e.key === 'ArrowRight') t += d; if (e.key === 'ArrowLeft') t -= d; playing = false; });
      root.ready.then(async function loop(now = performance.now()) { if (playing) t = loopT(t + (now - last) / 1000, root.FILM.dur); last = now; await draw(t); document.title = t.toFixed(2); requestAnimationFrame(loop); });
    }
    return api;
  }
  Object.assign(root, { timeline, clipSpeed, mountFilm: mount });
})(typeof window !== 'undefined' ? window : globalThis);
