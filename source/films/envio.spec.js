// Envio bounty demo (≤ 2:00): the feed, how the two HyperSync queries work, then deploy → indexed end to end.
SPECS.envio = [
  { kind: 'clip', clip: 'deploy', range: [24.3, 29.8], line: 'envio-01', free: true, cam: [[0, 960, 860, 1.4], [1, 960, 950, 1.7]], label: 'Indexed by Envio HyperSync · Monad testnet' },
  { kind: 'type', draw: 'envioQuery', line: 'envio-02', pad: .8 },
  { kind: 'type', draw: 'envioSpoof', line: 'envio-03', pad: .8 },
  { kind: 'clip', clip: 'deploy', range: [25.5, 29.8], line: 'envio-04', free: true, cam: [[0, 760, 900, 2.0], [1, 760, 960, 2.2]], label: 'Holders and balances from Transfer logs' },
  { kind: 'clip', clip: 'deploy', range: [0.2, 29.8], line: 'envio-05', len: 13.5, free: true, cam: [[0, 960, 600, 1.5], [.15, 960, 560, 1.2], [.55, 960, 820, 1.3], [.9, 960, 950, 1.65]], timer: true, label: 'Real timing from the capture' },
  { kind: 'type', draw: 'envioServer', line: 'envio-06', pad: 2.2, caption: false },
];
