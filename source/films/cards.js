// Code-drawn cards shared by the films. Each: (api, lt, len, shot) paints the whole frame.
CARDS.open = ({ g, W, H, L, u, C, F, IMG, text, spring, SPRINGS, clamp }, lt) => {
  const k = spring(lt - .1, ...SPRINGS.heavy), w = spring(lt - .45, ...SPRINGS.base), size = 150 * u;
  const lw = 132 * u, tw = text('lilune', -9999, 0, size, { font: F.ui, weight: 700, track: -4 * u }), gap = 36 * u, total = lw + gap + tw;
  const x0 = L.cx - total / 2, y = L.cy - 40 * u;
  g.save(); g.globalAlpha = clamp(k * 1.4);
  if (IMG.logo) g.drawImage(IMG.logo, x0, y - lw / 2 + (1 - k) * 24 * u, lw, lw);
  text('lilune', x0 + lw + gap, y + (1 - k) * 24 * u, size, { font: F.ui, weight: 700, align: 'left', track: -4 * u });
  g.restore();
  text('Start with curiosity, not complexity.', L.cx, y + 150 * u, 50 * u, { italic: true, color: C.accent, alpha: clamp(w * 1.3) });
  text('Live on Monad · lilune-production.up.railway.app', L.cx, y + 230 * u, 26 * u, { font: F.ui, weight: 500, color: C.mute, alpha: clamp(spring(lt - .9, ...SPRINGS.base) * 1.3) });
};
CARDS.end = ({ g, W, H, L, u, C, F, IMG, text, measure, rrect, spring, SPRINGS, clamp }, lt) => {
  const k = spring(lt - .1, ...SPRINGS.heavy);
  if (IMG.logo) { g.save(); g.globalAlpha = clamp(k * 1.4); g.drawImage(IMG.logo, L.cx - 48 * u, 150 * u, 96 * u, 96 * u); g.restore(); }
  text('Real where it matters.', L.cx, 330 * u, 84 * u, { alpha: clamp(k * 1.4) });
  text('Clearly labeled where it’s a demo.', L.cx, 420 * u, 84 * u, { italic: true, color: C.accent, alpha: clamp(spring(lt - .5, ...SPRINGS.heavy) * 1.4) });
  const rows = [
    ['Real', 'Kuru MON/USDC price, candles, volume · Monad mainnet'],
    ['Real', 'Mera passkey account and signing · Monad testnet'],
    ['Real', 'Token deploy, contract 0x2a1a…bd7ce · Monad testnet'],
    ['Real', 'Launched on Lilune feed · Envio HyperSync'],
    ['Demo', 'Stock prices, stock trades and demo cash'],
  ];
  rows.forEach(([tag, str], i) => {
    const s = spring(lt - .9 - i * .12, ...SPRINGS.snappy), y = 520 * u + i * 62 * u, x = L.cx - 420 * u;
    g.save(); g.globalAlpha = clamp(s * 1.4);
    g.fillStyle = tag === 'Real' ? '#DDF3E4' : C.lilac; rrect(x, y - 20 * u, 96 * u, 40 * u, 20 * u); g.fill();
    text(tag, x + 48 * u, y + 1 * u, 22 * u, { font: F.ui, weight: 700, color: tag === 'Real' ? '#25683A' : C.accent });
    text(str, x + 124 * u, y + 1 * u, 28 * u, { font: F.ui, weight: 500, align: 'left' });
    g.restore();
  });
  text('lilune-production.up.railway.app', L.cx, 880 * u, 34 * u, { font: F.ui, weight: 600, color: C.accent, alpha: clamp(spring(lt - 1.8, ...SPRINGS.base) * 1.4) });
  text('Recorded on the live site, 13 Oct 2026, in headless Chromium with a virtual passkey. Voice: Piper (offline). Made with Claude Code.', L.cx, 940 * u, 19 * u, { font: F.ui, color: C.mute, alpha: clamp(spring(lt - 2.2, ...SPRINGS.base)) });
};

// ---- Shared helpers for cards
function cardIn(api, lt, delay = 0, preset = 'heavy') { return api.spring(lt - delay, ...api.SPRINGS[preset]); }
function headline(api, lt, rows, y, size, o = {}) {
  const { text, clamp, u } = api;
  rows.forEach((r, i) => {
    const k = cardIn(api, lt, (o.delay || .1) + i * (o.stagger ?? .35));
    text(r.t || r, api.L.cx, y + i * size * 1.12 + (1 - k) * 22 * u, size, { italic: r.i, color: r.c || api.C.ink, alpha: clamp(k * 1.4) });
  });
}
function pill(api, str, x, y, o = {}) {
  const { g, u, C, F, text, measure, rrect } = api, size = (o.size || 30) * u, w = measure(str, size, { font: F.ui, weight: 600 }) + 52 * u, h = size * 2;
  g.save(); g.globalAlpha *= o.alpha ?? 1; g.fillStyle = o.fill || '#fff'; g.strokeStyle = o.stroke || C.line; g.lineWidth = 2 * u;
  rrect(x - w / 2, y - h / 2, w, h, h / 2); g.fill(); g.stroke();
  text(str, x, y + 1 * u, size, { font: F.ui, weight: 600, color: o.color || C.ink }); g.restore(); return w;
}

CARDS.products = (api, lt) => {
  const { L, u, C, clamp } = api;
  headline(api, lt, ['Millions of people love', { t: 'the products they use every day.', i: true, c: C.accent }], L.cy - 170 * u, 92 * u);
  ['ChatGPT', 'YouTube', 'Xbox', 'AWS'].forEach((p, i) => {
    const k = cardIn(api, lt, 3.0 + i * .45, 'snappy');
    pill(api, p, L.cx + (i - 1.5) * 260 * u, L.cy + 150 * u + (1 - k) * 30 * u, { alpha: clamp(k * 1.5), size: 34 });
  });
};
CARDS.friction = (api, lt, len) => {
  const { g, L, u, C, F, text, measure, clamp, seg } = api;
  headline(api, lt, ['Most have never owned', { t: 'a stock or a token.', i: true, c: C.accent }], 300 * u, 88 * u);
  const items = ['Seed phrases', 'Wallet extensions', 'Walls of tickers'];
  items.forEach((s, i) => {
    const t0 = 3.4 + i * 1.0, k = cardIn(api, lt, t0, 'snappy'), y = 600 * u + i * 96 * u, size = 50 * u;
    text(s, L.cx, y + (1 - k) * 20 * u, size, { font: F.ui, weight: 600, color: C.mute, alpha: clamp(k * 1.5) });
    const strike = seg(lt, t0 + .45, t0 + .75), w = measure(s, size, { font: F.ui, weight: 600 }) + 30 * u;
    if (strike > 0) { g.save(); g.strokeStyle = '#C0392B'; g.lineWidth = 5 * u; g.beginPath(); g.moveTo(L.cx - w / 2, y + 2 * u); g.lineTo(L.cx - w / 2 + w * api.easeOut(strike), y + 2 * u); g.stroke(); g.restore(); }
  });
};
CARDS.pivot = (api, lt) => {
  const { g, L, u, C, IMG, clamp } = api, k = cardIn(api, lt, .05);
  if (IMG.logo) { g.save(); g.globalAlpha = clamp(k * 1.4); g.drawImage(IMG.logo, L.cx - 60 * u, 250 * u + (1 - k) * 20 * u, 120 * u, 120 * u); g.restore(); }
  headline(api, lt, ['Lilune starts with', { t: 'what you already use.', i: true, c: C.accent }], 520 * u, 110 * u, { delay: .35 });
};
CARDS.monad = (api, lt) => {
  const { L, u, C, F, text, clamp } = api;
  headline(api, lt, [{ t: 'Why Monad?', i: true, c: C.accent }], 260 * u, 120 * u);
  const rows = [['Fast, cheap transactions', 'make small, curious first trades practical.'], ['Kuru’s order book', 'gives new traders real markets to grow into.']];
  rows.forEach(([a, b], i) => {
    const k = cardIn(api, lt, 1.6 + i * 3.2, 'base'), y = 520 * u + i * 190 * u;
    text(a, L.cx, y + (1 - k) * 20 * u, 64 * u, { font: F.ui, weight: 700, alpha: clamp(k * 1.4) });
    text(b, L.cx, y + 70 * u + (1 - k) * 20 * u, 42 * u, { font: F.ui, weight: 500, color: C.mute, alpha: clamp(k * 1.4) });
  });
};
CARDS.next = (api, lt) => {
  const { L, u, C, F, text, clamp } = api;
  text('NEXT', L.cx, 330 * u, 30 * u, { font: F.ui, weight: 700, color: C.accent, track: 8 * u, alpha: clamp(cardIn(api, lt, .05, 'snappy') * 1.4) });
  headline(api, lt, ['Real Kuru order execution,', { t: 'signed by Mera.', i: true, c: C.accent }], 470 * u, 104 * u, { delay: .3 });
  text('Today: live Kuru data, demo orders. Planned: real orders.', L.cx, 760 * u, 34 * u, { font: F.ui, weight: 500, color: C.mute, alpha: clamp(cardIn(api, lt, 1.6, 'base') * 1.3) });
};
CARDS.lockup = (api, lt, len, s) => {
  const { g, L, u, C, F, IMG, text, clamp } = api, k = cardIn(api, lt, .1), size = 150 * u;
  const lw = 132 * u, tw = api.measure('lilune', size, { font: F.ui, weight: 700, track: -4 * u }), gap = 36 * u, x0 = L.cx - (lw + gap + tw) / 2, y = L.cy - 90 * u;
  g.save(); g.globalAlpha = clamp(k * 1.4);
  if (IMG.logo) g.drawImage(IMG.logo, x0, y - lw / 2 + (1 - k) * 24 * u, lw, lw);
  text('lilune', x0 + lw + gap, y + (1 - k) * 24 * u, size, { font: F.ui, weight: 700, align: 'left', track: -4 * u }); g.restore();
  text('Start with curiosity, not complexity.', L.cx, y + 160 * u, 54 * u, { italic: true, color: C.accent, alpha: clamp(cardIn(api, lt, .6, 'base') * 1.3) });
  if (!s.short) text('Built by nftking', L.cx, y + 250 * u, 38 * u, { font: F.ui, weight: 600, alpha: clamp(cardIn(api, lt, 1.0, 'base') * 1.3) });
  text('lilune-production.up.railway.app', L.cx, y + (s.short ? 250 : 320) * u, 32 * u, { font: F.ui, weight: 600, color: C.accent, alpha: clamp(cardIn(api, lt, 1.3, 'base') * 1.3) });
  text('Live on Monad · Kuru market data · Mera accounts · Envio HyperSync', L.cx, y + (s.short ? 310 : 380) * u, 24 * u, { font: F.ui, weight: 500, color: C.mute, alpha: clamp(cardIn(api, lt, 1.6, 'base')) });
};
CARDS.adWord = (api, lt, len, s) => {
  const { L, u, C, text, clamp } = api, k = cardIn(api, lt, .02, 'snappy');
  text(s.word, L.cx, L.cy + (1 - k) * 30 * u, 170 * u, { italic: s.italic, color: s.italic ? C.accent : C.ink, alpha: clamp(k * 1.6) * clamp((len - lt) / .12) });
};
// Code panel: real identifiers from the repo (envio.mjs, contracts/LiluneToken.sol, server.mjs).
function codePanel(api, lt, x, y, w, title, rows, delay) {
  const { g, u, C, F, text, rrect, clamp } = api, k = cardIn(api, lt, delay, 'base'), h = 70 * u + rows.length * 46 * u;
  g.save(); g.globalAlpha = clamp(k * 1.4); g.translate(0, (1 - k) * 24 * u);
  g.fillStyle = C.deep; rrect(x, y, w, h, 20 * u); g.fill();
  text(title, x + 32 * u, y + 38 * u, 22 * u, { font: F.ui, weight: 700, color: '#C9BAFA', align: 'left', track: 2 * u });
  rows.forEach((r, i) => text(r, x + 32 * u, y + 86 * u + i * 46 * u, 26 * u, { font: '"DM Mono", ui-monospace, Menlo, monospace', color: '#F1EAFB', align: 'left' }));
  g.restore(); return h;
}
function arrow(api, x1, y1, x2, y2, k) {
  const { g, u, C } = api; if (k <= 0) return;
  const x = x1 + (x2 - x1) * k, y = y1 + (y2 - y1) * k;
  g.save(); g.strokeStyle = C.accent; g.lineWidth = 4 * u; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x, y); g.stroke();
  if (k > .95) { const a = Math.atan2(y2 - y1, x2 - x1); g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - 18 * u * Math.cos(a - .5), y2 - 18 * u * Math.sin(a - .5)); g.moveTo(x2, y2); g.lineTo(x2 - 18 * u * Math.cos(a + .5), y2 - 18 * u * Math.sin(a + .5)); g.stroke(); }
  g.restore();
}
CARDS.envioQuery = (api, lt) => {
  const { u, W, L, C, F, text, clamp, seg } = api;
  text('How Launched on Lilune is built', L.cx, 110 * u, 64 * u, { alpha: clamp(cardIn(api, lt, .05) * 1.4) });
  const lx = 150 * u, rx = 1010 * u, pw = 760 * u;
  codePanel(api, lt, lx, 230 * u, pw, 'LILUNETOKEN.SOL · CONSTRUCTOR', ['emit LiluneLaunched(', '  creator, name, symbol,', '  premise, totalSupply);'], .6);
  codePanel(api, lt, rx, 230 * u, pw, 'ENVIO HYPERSYNC · MONAD TESTNET', ['logs: [{ topics: [[', '  0x096e72c2…8b4245e5 ]] }]', 'any address, block 0 → head'], 3.2);
  arrow(api, lx + pw + 10 * u, 340 * u, rx - 14 * u, 340 * u, seg(lt, 2.6, 3.2));
  codePanel(api, lt, rx, 600 * u, pw, 'RESULT', ['every Lilune launch:', '  name · symbol · premise', '  creator · block · time'], 6.4);
  arrow(api, rx + pw / 2, 470 * u, rx + pw / 2, 590 * u, seg(lt, 6.0, 6.4));
  text('No factory contract. No database.', lx + pw / 2, 720 * u, 40 * u, { font: F.ui, weight: 700, color: C.accent, alpha: clamp(cardIn(api, lt, 8.0, 'base') * 1.3) });
};
CARDS.envioSpoof = (api, lt) => {
  const { L, u, C, F, text, clamp } = api;
  headline(api, lt, ['Only trust the deployment', { t: 'that emitted it.', i: true, c: C.accent }], 230 * u, 86 * u);
  codePanel(api, lt, L.cx - 520 * u, 470 * u, 1040 * u, 'ENVIO.MJS · SPOOF CHECK', ['join each log to its transaction (Hash, ContractAddress)', 'keep if  tx.contractAddress == log.address', 'drop any other contract emitting the same event'], 1.4);
};
CARDS.envioServer = (api, lt) => {
  const { L, u, C, F, text, clamp } = api;
  codePanel(api, lt, L.cx - 520 * u, 160 * u, 1040 * u, 'SERVER.MJS', ['GET /api/envio/launches?account=0x…', 'HyperSync query runs server-side, 15 s cache', 'ENVIO_API_TOKEN never reaches the browser'], .2);
  headline(api, lt, ['Envio HyperSync,', { t: 'the data layer behind the feed.', i: true, c: C.accent }], 640 * u, 84 * u, { delay: 1.6 });
  text('lilune-production.up.railway.app · github.com/nftkingiii/lilune', L.cx, 900 * u, 28 * u, { font: F.ui, weight: 600, color: C.mute, alpha: clamp(cardIn(api, lt, 3, 'base')) });
};
CARDS.meraCsp = (api, lt) => {
  const { L, u, C, F, text, clamp } = api;
  codePanel(api, lt, L.cx - 520 * u, 150 * u, 1040 * u, 'SERVER.MJS · CONTENT-SECURITY-POLICY', ["script-src 'self'", "connect-src 'self' api.kuru.io testnet-rpc.monad.xyz", 'publickey-credentials-get=(self)'], .2);
  headline(api, lt, ['Mera on Monad.', { t: 'Onchain with one passkey.', i: true, c: C.accent }], 640 * u, 96 * u, { delay: 2.4 });
  text('Recorded on the live site with a virtual passkey authenticator in headless Chromium.', L.cx, 920 * u, 24 * u, { font: F.ui, weight: 500, color: C.mute, alpha: clamp(cardIn(api, lt, 3.4, 'base')) });
};
