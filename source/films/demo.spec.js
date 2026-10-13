// Technical demo (≤ 3:00). Clip ranges are seconds in the captured clip; cam keys are [shot fraction, x, y, zoom].
SPECS.demo = [
  { kind: 'type', draw: 'open', len: 2.6 },
  { kind: 'clip', clip: 'home', range: [0.4, 2.8], line: 'demo-01', cam: [[0, 960, 540, 1], [1, 760, 560, 1.18]] },
  { kind: 'clip', clip: 'discover', range: [0.4, 10.9], line: 'demo-02', cam: [[0, 960, 540, 1], [.12, 960, 520, 1.45], [.62, 960, 560, 1.45], [.8, 960, 820, 1.7]] },
  { kind: 'clip', clip: 'discover', range: [10.9, 16.8], line: 'demo-03', cam: [[0, 960, 900, 1.5], [.45, 960, 600, 1.15]] },
  { kind: 'clip', clip: 'home', range: [2.9, 6.6], line: 'demo-04', cam: [[0, 960, 260, 1.3], [1, 960, 260, 1.55]], label: 'Live · Kuru on Monad mainnet' },
  { kind: 'clip', clip: 'trade', range: [0.4, 13.0], line: 'demo-05', cam: [[0, 960, 540, 1], [.18, 700, 560, 1.3], [.5, 780, 720, 1.3], [1, 780, 760, 1.35]], label: 'Live Kuru candles' },
  { kind: 'clip', clip: 'trade', range: [13.0, 21.6], line: 'demo-06', cam: [[0, 1460, 760, 1.6], [.35, 960, 540, 1.55], [.9, 960, 560, 1.2]] },
  { kind: 'clip', clip: 'portfolio', range: [0.8, 4.4], len: 3.4, cam: [[0, 960, 380, 1.2], [1, 960, 400, 1.35]] },
  { kind: 'clip', clip: 'mera', range: [0.4, 12.4], line: 'demo-07', cam: [[0, 1300, 300, 1.6], [.3, 1350, 300, 1.7], [.42, 1400, 320, 1.7], [.65, 1420, 420, 1.7], [1, 1420, 420, 1.7]], label: 'Monad testnet' },
  { kind: 'clip', clip: 'launch-form', range: [0.6, 17.4], line: 'demo-08', cam: [[0, 960, 540, 1.1], [.12, 820, 560, 1.45], [.5, 820, 600, 1.45], [.62, 820, 600, 1.35], [.85, 820, 640, 1.35]] },
  { kind: 'clip', clip: 'deploy', range: [0.2, 7.6], line: 'demo-09', cam: [[0, 960, 600, 1.5], [.35, 960, 560, 1.2], [.7, 960, 640, 1.55]], label: 'Real deploy · Monad testnet' },
  { kind: 'clip', clip: 'deploy', range: [23.0, 29.8], line: 'demo-10', free: true, cam: [[0, 960, 860, 1.4], [1, 960, 960, 1.65]], label: 'Indexed by Envio HyperSync' },
  { kind: 'type', draw: 'end', line: 'demo-11', pad: 2.6, caption: false },
];
