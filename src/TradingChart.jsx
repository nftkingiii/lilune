import React, { useState } from 'react';
import { series, money } from './data';
export function makeCandles(seed, period, price) {
  const points = series(seed + ['1D','1W','1M','1Y'].indexOf(period) * 3);
  const closes = points.map(p => price * (1 + (points.at(-1) - p) / 800));
  return closes.map((close, i) => {
    const open = i ? closes[i - 1] : close * .998;
    const wick = price * (.001 + Math.abs(Math.sin(i + seed)) * .003);
    return { open, close, high: Math.max(open, close) + wick, low: Math.min(open, close) - wick };
  });
}
function timeLabel(timestamp) {
  if (!timestamp) return '';
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(timestamp));
}

export default function TradingChart({ seed, period, price, type, data, live = false }) {
  const [hover, setHover] = useState(null);
  const candles = data?.length ? data : makeCandles(seed, period, price);
  const maxIndex = Math.max(0, candles.length - 1);
  const low = Math.min(...candles.map(c => c.low)), high = Math.max(...candles.map(c => c.high));
  const spread = high - low || Math.max(high * .01, .0001);
  const y = v => 190 - (v - low) / spread * 170, x = i => 8 + (maxIndex ? i * 580 / maxIndex : 290);
  const path = candles.map((c,i) => `${x(i)},${y(c.close)}`).join(' ');
  const active = candles[hover ?? candles.length - 1];
  if (live && !data?.length) return <div className="trading-chart live-chart-state" role="status">Loading live Kuru market data…</div>;
  return <div className="trading-chart" tabIndex={0} aria-label={`${period} ${live ? 'live Kuru' : 'illustrative'} ${type} chart. Use left and right arrows to inspect samples.`} onKeyDown={e => { if (['ArrowLeft','ArrowRight'].includes(e.key)) { e.preventDefault(); setHover(Math.max(0, Math.min(maxIndex, (hover ?? maxIndex) + (e.key === 'ArrowRight' ? 1 : -1)))); } }} onPointerMove={e => { const r = e.currentTarget.getBoundingClientRect(); setHover(Math.max(0, Math.min(maxIndex, Math.round((e.clientX - r.left) / r.width * maxIndex)))); }} onPointerLeave={() => setHover(null)}>
    <div className="ohlc-readout">{(type === 'candles' ? ['open','high','low','close'] : ['close']).map(k => <span key={k}>{k[0].toUpperCase()} <b>{live ? `$${active[k].toFixed(4)}` : money(active[k])}</b></span>)}<small>{live ? `LIVE KURU · ${timeLabel(active.openTime)}` : 'Illustrative OHLC'}</small></div>
    <svg viewBox="0 0 650 215" preserveAspectRatio="none" role="img" aria-label={`${live ? 'Live Kuru' : 'Illustrative'} ${type === 'candles' ? 'candlestick' : 'line'} prices`}>
      {[0,.25,.5,.75,1].map(t => <g key={t}><line x1="0" x2="600" y1={20+t*170} y2={20+t*170} stroke="#e8e2ee" strokeDasharray="3 5"/><text x="607" y={24+t*170} fill="#8b7d96" fontSize="9">{(high-t*spread).toFixed(live ? 4 : 2)}</text></g>)}
      {type === 'candles' ? candles.map((c,i) => <g key={i} fill={c.close >= c.open ? '#418878' : '#ba747c'} stroke={c.close >= c.open ? '#418878' : '#ba747c'}><line x1={x(i)} x2={x(i)} y1={y(c.high)} y2={y(c.low)}/><rect x={x(i)-3.5} y={Math.min(y(c.open),y(c.close))} width="7" height={Math.max(1,Math.abs(y(c.close)-y(c.open)))} rx="1"/></g>) : <><polygon points={`8,200 ${path} 588,200`} fill="#8860ce0d"/><polyline points={path} fill="none" stroke="#8860ce" strokeWidth="2" vectorEffect="non-scaling-stroke"/></>}
      {hover !== null && <line x1={x(hover)} x2={x(hover)} y1="12" y2="200" stroke="#9776c5" strokeDasharray="3 3"/>}
    </svg>
  </div>;
}
