import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CircleAlert, Copy, ExternalLink, FlaskConical, Info, Rocket, Share2, Sparkles, Wallet } from 'lucide-react';
import { explorerAddress, explorerTx, MONAD_FAUCET } from './chain';
import './launch.css';

const QUOTE_ASSETS = [
  { value: 'USDC', name: 'USD Coin', note: 'Stable demo quote', logo: 'usdc' },
  { value: 'aNVDA', name: 'NVIDIA demo', note: 'Synthetic equity', logo: 'nvidia' },
  { value: 'aAAPL', name: 'Apple demo', note: 'Synthetic equity', logo: 'apple' },
];

const EMPTY_FORM = {
  name: '',
  ticker: '',
  description: '',
  quoteAsset: 'USDC',
  supply: '1000000',
  liquidity: '10000',
};

const STEPS = ['Details', 'Validate', 'Review'];

function readSavedMarkets() {
  try {
    const stored = localStorage.getItem('lilune-markets');
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter((market) => market && typeof market === 'object') : [];
  } catch {
    return [];
  }
}

function formatNumber(value, maximumFractionDigits = 2) {
  const number = Number(value);
  return Number.isFinite(number)
    ? new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(number)
    : '—';
}

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Give your market a name.';
  if (!/^[A-Za-z0-9]{2,8}$/.test(form.ticker.trim())) errors.ticker = 'Use 2–8 letters or numbers.';
  if (form.description.trim().length < 12) errors.description = 'Add at least 12 characters so traders know the premise.';
  if (!Number.isInteger(Number(form.supply)) || Number(form.supply) < 1000 || Number(form.supply) > 1e12) errors.supply = 'Supply must be a whole number between 1,000 and 1 trillion.';
  if (!Number.isFinite(Number(form.liquidity)) || Number(form.liquidity) < 100) errors.liquidity = 'Initial liquidity must be at least 100.';
  return errors;
}

export default function LaunchStudio({ onCreated, kuruPulse, wallet, walletBusy, onConnect, onDeploy }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [storageError, setStorageError] = useState('');
  const [savedMarkets, setSavedMarkets] = useState(readSavedMarkets);
  const [created, setCreated] = useState(null);
  const [shareStatus, setShareStatus] = useState('');
  const [deploy, setDeploy] = useState({ status: 'idle', error: '' });
  const funded = wallet?.balance?.raw && wallet.balance.raw !== '0';

  const selectedQuote = useMemo(
    () => QUOTE_ASSETS.find((asset) => asset.value === form.quoteAsset) || QUOTE_ASSETS[0],
    [form.quoteAsset],
  );

  const update = (field) => (event) => {
    const value = field === 'ticker' ? event.target.value.toUpperCase() : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const goNext = () => {
    if (step === 0) {
      const nextErrors = validate(form);
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) return;
    }
    setStep((current) => Math.min(current + 1, 2));
  };

  const createMarket = (onchain) => {
    const market = {
      id: `demo-${Date.now()}`,
      name: form.name.trim(),
      ticker: form.ticker.trim().toUpperCase(),
      description: form.description.trim(),
      quoteAsset: form.quoteAsset,
      supply: Number(form.supply),
      initialLiquidity: Number(form.liquidity),
      createdAt: new Date().toISOString(),
      mode: onchain ? 'monad-testnet' : 'local-demo',
      ...(onchain && { address: onchain.address, txHash: onchain.hash, creator: wallet?.address }),
    };
    try {
      const stored = localStorage.getItem('lilune-markets');
      const parsed = stored ? JSON.parse(stored) : [];
      const existing = Array.isArray(parsed) ? parsed : [];
      localStorage.setItem('lilune-markets', JSON.stringify([market, ...existing]));
    } catch {
      if (!onchain) {
        setStorageError('This browser could not save the demo market. Check storage permissions and try again.');
        return;
      }
    }
    setCreated(market);
    setSavedMarkets((current) => [market, ...current]);
    onCreated?.(market);
  };

  const deployOnchain = async () => {
    if (!wallet || !funded || deploy.status === 'pending') return;
    setDeploy({ status: 'pending', error: '' });
    try {
      const result = await onDeploy({
        name: form.name.trim(),
        symbol: form.ticker.trim().toUpperCase(),
        premise: form.description.trim(),
        supply: form.supply,
      });
      setDeploy({ status: 'idle', error: '' });
      createMarket(result);
    } catch (error) {
      const rejected = /reject|denied|cancel/i.test(error?.message || '');
      setDeploy({ status: 'error', error: rejected ? 'The signature was cancelled. Nothing was deployed.' : /insufficient|funds/i.test(error?.message || '') ? 'Your Mera account needs more testnet MON to pay for gas.' : 'The deployment did not go through. Check your connection and try again.' });
    }
  };

  const shareDraft = async (market) => {
    const onchain = market.mode === 'monad-testnet' && market.address;
    const brief = `${onchain ? 'Launched on Lilune' : 'Lilune launch draft'}\n\n${market.name} ($${market.ticker})\n${market.description}\n\n${formatNumber(market.supply)} total supply · ${formatNumber(market.initialLiquidity)} ${market.quoteAsset} planned liquidity\n\n${onchain ? `Deployed on Monad testnet: ${explorerAddress(market.address)}` : 'Local demo only — no assets moved.'}\nExplore it at ${window.location.origin}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${market.name} · Lilune launch draft`, text: brief });
        setShareStatus('Draft ready to share');
      } else {
        await navigator.clipboard.writeText(brief);
        setShareStatus('Launch brief copied');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') setShareStatus('Could not share this draft yet.');
    }
  };

  if (created) {
    return (
      <section className="launch-studio launch-success" aria-labelledby="launch-success-title">
        <div className="success-mark"><Check size={28} strokeWidth={2.5} /></div>
        <p className="eyebrow">{created.mode === 'monad-testnet' ? 'Deployed on Monad testnet' : 'Market created locally'}</p>
        <h1 id="launch-success-title">{created.name} is {created.mode === 'monad-testnet' ? 'live onchain.' : 'ready to explore.'}</h1>
        <p className="success-copy">{created.mode === 'monad-testnet'
          ? `$${created.ticker} is a real ERC-20 on Monad testnet. The full supply was minted to your Mera account and the premise is stored in the contract. Testnet tokens have no monetary value, and no liquidity pool was created.`
          : 'Your demo market was saved to this browser. Nothing was deployed and no assets moved.'}</p>
        <div className="success-card">
          <div className="mini-token"><span>{created.ticker.slice(0, 2)}</span></div>
          <div><strong>{created.ticker}</strong><span>{formatNumber(created.supply)} total supply · quoted in {created.quoteAsset}</span></div>
          <span className="demo-chip">{created.mode === 'monad-testnet' ? 'TESTNET' : 'LOCAL DEMO'}</span>
        </div>
        {created.mode === 'monad-testnet' && <div className="onchain-proof">
          <span><small>Contract</small><code>{created.address}</code></span>
          <a href={explorerAddress(created.address)} target="_blank" rel="noreferrer">View contract <ExternalLink size={13} /></a>
          <a href={explorerTx(created.txHash)} target="_blank" rel="noreferrer">View transaction <ExternalLink size={13} /></a>
        </div>}
        <div className="success-actions">
          <button className="button button-primary" type="button" onClick={() => shareDraft(created)}>
            <Share2 size={17} /> Share launch brief
          </button>
          <button className="button button-quiet" type="button" onClick={() => { setCreated(null); setStep(0); setForm(EMPTY_FORM); setShareStatus(''); setDeploy({ status: 'idle', error: '' }); }}>
            <Sparkles size={17} /> Launch another
          </button>
        </div>
        {shareStatus && <p className="share-status" role="status"><Copy size={13} /> {shareStatus}</p>}
      </section>
    );
  }

  return (
    <section className="launch-studio" aria-labelledby="launch-title">
      <div className="launch-head">
        <div>
          <h1 id="launch-title">Turn an idea into a market.</h1>
          <p className="lead">Shape a clear premise, set the rails, then deploy a real token to Monad testnet or keep it as a local draft.</p>
        </div>
        <div className="demo-notice" role="note"><Info size={16} /><span><strong>Testnet only</strong><br />Deploys use Monad testnet MON from your Mera account. Tokens have no backing or monetary value.</span></div>
      </div>

      <nav className="stepper" aria-label="Launch progress">
        {STEPS.map((label, index) => <div className={`step ${index === step ? 'is-active' : ''} ${index < step ? 'is-complete' : ''}`} key={label}>
          <span className="step-number">{index < step ? <Check size={14} /> : index + 1}</span><span>{label}</span>
        </div>)}
      </nav>

      <div className="launch-layout">
        <section className="form-panel" aria-live="polite">
          {step === 0 && <form onSubmit={(event) => { event.preventDefault(); goNext(); }}>
            <div className="section-intro"><p className="eyebrow">Step 01</p><h2>Describe your market</h2><p>The sharper the premise, the easier it is to understand at a glance.</p></div>
            <div className="field-grid">
              <Field label="Market name" hint="A memorable name" error={errors.name}><input id="market-name" value={form.name} onChange={update('name')} placeholder="e.g. Greenlight" /></Field>
              <Field label="Ticker" inputId="market-ticker" hint="2–8 characters" error={errors.ticker}><div className="input-prefix"><span>$</span><input id="market-ticker" value={form.ticker} onChange={update('ticker')} maxLength={8} placeholder="GLT" /></div></Field>
            </div>
            <Field label="Description" hint={`${form.description.length}/180`} error={errors.description}><textarea id="market-description" value={form.description} onChange={update('description')} maxLength={180} rows={4} placeholder="What does this market represent?" /></Field>
            <fieldset className="quote-fieldset"><legend>Quote asset</legend><span className="fieldset-hint">Choose the unit markets are priced in</span>
            <div className="quote-options" role="radiogroup" aria-label="Quote asset">
              {QUOTE_ASSETS.map((asset) => <label className={`quote-option ${form.quoteAsset === asset.value ? 'is-selected' : ''}`} key={asset.value}><input type="radio" name="quoteAsset" value={asset.value} checked={form.quoteAsset === asset.value} onChange={update('quoteAsset')} /><span className="asset-symbol"><img src={`/logos/${asset.logo}.svg`} alt="" width="18" height="18" /></span><span><strong>{asset.value}</strong><small>{asset.name}</small></span><Check className="option-check" size={16} /></label>)}
            </div></fieldset>
            <div className="field-grid economics">
              <Field label="Total supply" hint="Whole units" error={errors.supply}><input id="market-supply" type="number" min="1000" step="1" value={form.supply} onChange={update('supply')} /></Field>
              <Field label="Initial liquidity" hint={`In ${form.quoteAsset}`} error={errors.liquidity}><input id="market-liquidity" type="number" min="100" step="100" value={form.liquidity} onChange={update('liquidity')} /></Field>
            </div>
            <div className="form-actions"><span className="required-note">All fields are required</span><button className="button button-primary" type="submit">Continue to validation <ArrowRight size={17} /></button></div>
          </form>}

          {step === 1 && <div className="validation-view"><div className="section-intro"><p className="eyebrow">Step 02</p><h2>Validation check</h2><p>Here’s a quick sanity check before you review the final market card.</p></div><div className="checks">{[['Market identity', 'Name and ticker are ready to publish.', true], ['Description clarity', 'Your premise gives the market useful context.', true], ['Liquidity floor', `${formatNumber(form.liquidity)} ${form.quoteAsset} is above the demo minimum.`, true], ['Launch boundary', wallet ? 'Deploys to Monad testnet only. No backing, pool, or real-money trading.' : 'Saved locally until you connect Mera to deploy on testnet.', true]].map(([title, copy, valid]) => <div className="check-row" key={title}><span className="check-icon"><Check size={16} /></span><div><strong>{title}</strong><span>{copy}</span></div><span className="check-status">Passed</span></div>)}</div><div className="validation-callout"><CircleAlert size={18} /><span><strong>Important:</strong> this validation checks form quality only. It does not validate an issuer, price, reserve, or live market.</span></div><div className="form-actions"><button className="button button-quiet" type="button" onClick={() => setStep(0)}><ArrowLeft size={17} /> Back</button><button className="button button-primary" type="button" onClick={goNext}>Review market <ArrowRight size={17} /></button></div></div>}

          {step === 2 && <div className="review-view"><div className="section-intro"><p className="eyebrow">Step 03</p><h2>Review and create</h2><p>One last look. Deploy it as a real token on Monad testnet, or keep it as a local draft.</p></div><dl className="review-list"><div><dt>Market</dt><dd>{form.name} <span>${form.ticker}</span></dd></div><div><dt>Premise</dt><dd>{form.description}</dd></div><div><dt>Quote asset</dt><dd>{selectedQuote.value} <span>{selectedQuote.note}</span></dd></div><div><dt>Economics</dt><dd>{formatNumber(form.supply)} supply <span>·</span> {formatNumber(form.liquidity)} {form.quoteAsset} liquidity</dd></div></dl><div className="thesis-card" aria-label="Why this market"><div className="thesis-head"><p className="eyebrow">Why this market</p><span>Your thesis</span></div><p className="thesis-copy">{form.description}</p><div className="thesis-facts"><span><strong>${form.ticker}</strong> market symbol</span><span><strong>{selectedQuote.value}</strong> quote asset</span><span><strong>{formatNumber(form.liquidity)}</strong> initial liquidity</span></div></div><div className="review-boundary"><FlaskConical size={19} /><div><strong>What deploying does</strong><p>Your Mera account deploys an ERC-20 for ${form.ticker} on Monad testnet and receives the full supply. No liquidity pool is created and testnet tokens have no monetary value.</p></div></div>
            <DeployPanel wallet={wallet} walletBusy={walletBusy} funded={funded} deploy={deploy} onConnect={onConnect} onDeploy={deployOnchain} />
            {storageError && <p className="storage-error" role="alert">{storageError}</p>}<div className="form-actions"><button className="button button-quiet" type="button" onClick={() => setStep(1)} disabled={deploy.status === 'pending'}><ArrowLeft size={17} /> Back</button><button className="button button-quiet" type="button" onClick={() => createMarket()} disabled={deploy.status === 'pending'}><Sparkles size={17} /> Save local draft</button></div></div>}
        </section>

        <aside className="preview-panel" aria-label="Market preview"><div className="preview-top"><span className="preview-label">Live preview</span><span className="demo-chip">TESTNET</span></div><div className="token-art" aria-hidden="true"><div className="orb orb-one" /><div className="orb orb-two" /><div className="orb orb-three" /><span>{(form.ticker || 'LU').slice(0, 2)}</span></div><p className="preview-ticker">${form.ticker || 'TICKER'}</p><h3>{form.name || 'Your market name'}</h3><p className="preview-description">{form.description || 'A concise description will appear here.'}</p><div className="preview-stats"><div><span>Supply</span><strong>{formatNumber(form.supply)}</strong></div><div><span>Liquidity</span><strong>{formatNumber(form.liquidity)} <small>{form.quoteAsset}</small></strong></div></div><KuruReference pulse={kuruPulse} /><div className="preview-foot"><span className="status-dot" />{selectedQuote.value} quote asset <span className="preview-divider" /> {wallet ? 'Monad testnet ready' : 'local draft'}</div></aside>
      </div>
      <SavedMarkets markets={savedMarkets} />
    </section>
  );
}

function Field({ label, inputId, hint, error, children }) {
  return <div className={`field ${error ? 'has-error' : ''}`}><div className="field-label"><label htmlFor={inputId || children.props?.id}>{label}</label><span>{hint}</span></div>{children}{error && <small className="field-error" role="alert">{error}</small>}</div>;
}

function SavedMarkets({ markets }) {
  if (!markets.length) return null;
  return <section className="saved-markets" aria-labelledby="saved-markets-title"><div className="saved-markets-head"><div><p className="eyebrow">Your studio</p><h2 id="saved-markets-title">Your markets</h2></div><span>{markets.length} {markets.length === 1 ? 'market' : 'markets'}</span></div><div className="saved-market-list">{markets.map((market) => <article className="saved-market" key={market.id || `${market.name}-${market.ticker}`}><div className="saved-market-icon">{String(market.ticker || 'LU').slice(0, 2)}</div><div><strong>{market.name || 'Untitled market'}</strong><span>${market.ticker || '—'}</span></div>{market.mode === 'monad-testnet' && market.address ? <a className="saved-market-quote onchain" href={explorerAddress(market.address)} target="_blank" rel="noreferrer">Testnet contract <ExternalLink size={12} /></a> : <span className="saved-market-quote">Local draft · {market.quoteAsset || '—'}</span>}</article>)}</div></section>;
}

function KuruReference({ pulse }) {
  const data = pulse?.data;
  return <section className="launch-kuru-reference" aria-label="Kuru market reference" aria-live="polite">
    <div className="launch-kuru-head"><span>Market reference</span><strong>KURU</strong></div>
    {pulse?.status === 'ready' && data ? <>
      <div className="launch-kuru-value"><strong>MON / USDC</strong><b>{data.lastPrice.toFixed(4)}</b></div>
      <div className="launch-kuru-meta"><span className={data.changePercent >= 0 ? 'positive' : 'negative'}>{data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}% 24h</span><span>{Number.isFinite(data.volume24h) ? '$' + (data.volume24h / 1e6).toFixed(2) + 'M' : '—'} volume</span></div>
      <a href="https://www.kuru.io/markets" target="_blank" rel="noreferrer">Open Kuru markets <ExternalLink size={12} /></a>
    </> : pulse?.status === 'error' ? <p className="launch-kuru-unavailable">Kuru context is unavailable right now. Your local draft is still usable.</p> : <p className="launch-kuru-unavailable">Reading Kuru’s live market context…</p>}
    <small>Reference only · Kuru pricing is not used by your token</small>
  </section>;
}

function DeployPanel({ wallet, walletBusy, funded, deploy, onConnect, onDeploy }) {
  const pending = deploy.status === 'pending';
  return <div className="deploy-panel">
    <div className="deploy-copy"><Rocket size={18} /><div><strong>Deploy to Monad testnet</strong><span>{!wallet ? 'Connect Mera with a passkey to sign the deployment.' : funded ? `Signing as ${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)} · ${wallet.balance.formatted} MON` : 'Your Mera account needs testnet MON to pay for gas.'}</span></div></div>
    {!wallet ? <button className="button button-primary" type="button" onClick={onConnect} disabled={walletBusy}><Wallet size={17} /> {walletBusy ? 'Opening passkey…' : 'Connect Mera'}</button>
      : funded ? <button className="button button-primary" type="button" onClick={onDeploy} disabled={pending}><Rocket size={17} /> {pending ? 'Deploying…' : 'Deploy token'}</button>
      : <a className="button button-primary" href={MONAD_FAUCET} target="_blank" rel="noreferrer">Get testnet MON <ExternalLink size={15} /></a>}
    {deploy.status === 'error' && <p className="storage-error" role="alert">{deploy.error}</p>}
  </div>;
}
