// Product ad (≤ 0:30): no voice, kinetic type between real footage.
SPECS.ad = [
  { kind: 'type', draw: 'adWord', len: 1.5, word: 'You use it.' },
  { kind: 'clip', clip: 'discover', range: [1.0, 7.0], len: 3.0, cam: [[0, 960, 520, 1.4], [1, 960, 560, 1.55]] },
  { kind: 'type', draw: 'adWord', len: 1.4, word: 'You love it.' },
  { kind: 'clip', clip: 'trade', range: [9.6, 13.2], len: 2.8, cam: [[0, 780, 700, 1.3], [1, 780, 760, 1.45]], label: 'Live Kuru candles' },
  { kind: 'type', draw: 'adWord', len: 1.6, word: 'Explore owning it.', italic: true },
  { kind: 'clip', clip: 'mera', range: [0.6, 3.6], len: 2.2, cam: [[0, 1300, 300, 1.6], [1, 1420, 250, 1.9]], label: 'One passkey' },
  { kind: 'clip', clip: 'launch-form', range: [2.5, 9.5], len: 2.6, cam: [[0, 820, 560, 1.4], [1, 820, 600, 1.5]] },
  { kind: 'clip', clip: 'deploy', range: [2.4, 6.2], len: 2.6, cam: [[0, 960, 600, 1.5], [1, 960, 420, 1.3]], label: 'Real deploy · Monad testnet' },
  { kind: 'clip', clip: 'deploy', range: [24.3, 29.8], len: 2.8, free: true, cam: [[0, 960, 880, 1.5], [1, 960, 960, 1.7]], label: 'Indexed by Envio' },
  { kind: 'type', draw: 'lockup', len: 4.4, short: true },
];
