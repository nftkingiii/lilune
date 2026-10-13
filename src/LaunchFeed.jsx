import React, { useEffect, useState } from 'react';
import { ExternalLink, Radio } from 'lucide-react';
import { explorerAddress } from './chain';

const REFRESH_MS = 20_000;

const shortAddress = (address) => `${address.slice(0, 6)}…${address.slice(-4)}`;

function wholeTokens(raw) {
  try {
    const value = BigInt(raw) / 10n ** 18n;
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value));
  } catch {
    return '—';
  }
}

function launchedAgo(timestamp) {
  if (!timestamp) return '';
  const minutes = Math.max(0, Math.round((Date.now() / 1000 - timestamp) / 60));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h ago`;
  return `${Math.round(minutes / 60 / 24)}d ago`;
}

// Every Lilune launch on Monad testnet, indexed by Envio HyperSync through
// /api/envio/launches. `refreshKey` changes after a deploy to refetch at once.
export default function LaunchFeed({ account, refreshKey }) {
  const [feed, setFeed] = useState({ status: 'loading', data: null });

  useEffect(() => {
    let controller = null;
    const load = async () => {
      controller?.abort();
      controller = new AbortController();
      try {
        const query = account ? `?account=${account}` : '';
        const response = await fetch(`/api/envio/launches${query}`, { signal: controller.signal });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
        setFeed({ status: 'ready', data: body });
      } catch (error) {
        if (error?.name !== 'AbortError') setFeed((current) => current.data ? current : { status: 'error', data: null });
      }
    };
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      clearInterval(timer);
      controller?.abort();
    };
  }, [account, refreshKey]);

  const launches = feed.data?.launches ?? [];
  const mine = account?.toLowerCase();
  const held = launches.filter((launch) => launch.accountBalance && launch.accountBalance !== '0');

  return <section className="launch-feed" aria-labelledby="launch-feed-title" aria-live="polite">
    <div className="saved-markets-head">
      <div><p className="eyebrow"><Radio size={12} /> Indexed by Envio HyperSync</p><h2 id="launch-feed-title">Launched on Lilune</h2></div>
      <span>{feed.status === 'ready' ? `${launches.length} ${launches.length === 1 ? 'launch' : 'launches'} · block ${feed.data.indexedHeight?.toLocaleString() ?? '—'}` : 'Monad testnet'}</span>
    </div>
    {account && held.length > 0 && <p className="launch-feed-holdings">You hold {held.map((launch) => `${wholeTokens(launch.accountBalance)} $${launch.symbol}`).join(' · ')}</p>}
    {feed.status === 'loading' && <p className="launch-feed-empty">Reading every Lilune launch from Envio…</p>}
    {feed.status === 'error' && <p className="launch-feed-empty">The Envio launch feed is unavailable right now. Deploying still works.</p>}
    {feed.status === 'ready' && !launches.length && <p className="launch-feed-empty">No Lilune launches indexed yet. Deploy one and it appears here.</p>}
    {launches.length > 0 && <div className="launch-feed-list">{launches.slice(0, 24).map((launch) => <article className="launch-feed-item" key={launch.token}>
      <div className="saved-market-icon">{launch.symbol.slice(0, 2).toUpperCase()}</div>
      <div className="launch-feed-copy">
        <strong>{launch.name} <span>${launch.symbol}</span>{launch.creator.toLowerCase() === mine && <em>Yours</em>}</strong>
        <p>{launch.premise}</p>
        <small>{wholeTokens(launch.totalSupply)} supply · {launch.holders} {launch.holders === 1 ? 'holder' : 'holders'} · {launch.transfers} {launch.transfers === 1 ? 'transfer' : 'transfers'} · by {shortAddress(launch.creator)}{launch.timestamp ? ` · ${launchedAgo(launch.timestamp)}` : ''}</small>
      </div>
      <a className="saved-market-quote onchain" href={explorerAddress(launch.token)} target="_blank" rel="noreferrer">Contract <ExternalLink size={12} /></a>
    </article>)}</div>}
  </section>;
}
