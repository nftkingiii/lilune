// Pitch (≤ 2:00): problem in type, answer in real footage, why Monad, next, built by nftking.
SPECS.pitch = [
  { kind: 'type', draw: 'products', line: 'pitch-01', pad: .5 },
  { kind: 'type', draw: 'friction', line: 'pitch-02', pad: .5 },
  { kind: 'type', draw: 'pivot', line: 'pitch-03', pad: .4 },
  { kind: 'clip', clip: 'discover', range: [1.0, 10.9], line: 'pitch-04', len: 6.2, cam: [[0, 960, 520, 1.45], [.6, 960, 560, 1.45], [.85, 960, 820, 1.7]] },
  { kind: 'clip', clip: 'trade', range: [8.5, 13.2], len: 4.6, cam: [[0, 780, 700, 1.3], [1, 780, 760, 1.4]], label: 'Live Kuru data · Monad mainnet' },
  { kind: 'clip', clip: 'mera', range: [0.5, 9.5], line: 'pitch-05', cam: [[0, 1300, 300, 1.6], [.45, 1420, 380, 1.7], [1, 1420, 420, 1.7]], label: 'Monad testnet' },
  { kind: 'clip', clip: 'launch-form', range: [2.5, 16.5], line: 'pitch-06', len: 5.0, cam: [[0, 820, 560, 1.4], [1, 820, 620, 1.35]] },
  { kind: 'clip', clip: 'deploy', range: [23.0, 29.8], len: 4.6, free: true, cam: [[0, 960, 880, 1.45], [1, 960, 960, 1.65]], label: 'Indexed by Envio HyperSync' },
  { kind: 'type', draw: 'monad', line: 'pitch-07', pad: .6 },
  { kind: 'type', draw: 'next', line: 'pitch-08', pad: .6 },
  { kind: 'type', draw: 'lockup', line: 'pitch-09', pad: 2.4, caption: false },
];
