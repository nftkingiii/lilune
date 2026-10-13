// Mera bounty demo (≤ 2:00): Mera is the whole account layer.
SPECS.mera = [
  { kind: 'clip', clip: 'mera', range: [0.0, 0.9], line: 'mera-01', cam: [[0, 1300, 300, 1.5], [1, 1420, 200, 1.9]], label: 'Monad testnet' },
  { kind: 'clip', clip: 'mera', range: [0.6, 4.9], line: 'mera-02', cam: [[0, 1420, 200, 1.9], [.5, 1440, 220, 2.1], [1, 1440, 240, 2.0]] },
  { kind: 'clip', clip: 'mera', range: [4.9, 12.6], line: 'mera-03', cam: [[0, 1420, 330, 1.8], [.45, 1420, 400, 1.8], [1, 1420, 440, 1.8]] },
  { kind: 'clip', clip: 'deploy', range: [0.2, 7.6], line: 'mera-04', cam: [[0, 960, 600, 1.5], [.35, 960, 560, 1.2], [.7, 960, 640, 1.55]], label: 'Signed by Mera · Monad testnet' },
  { kind: 'type', draw: 'meraCsp', line: 'mera-05', pad: 2.2, caption: false },
];
