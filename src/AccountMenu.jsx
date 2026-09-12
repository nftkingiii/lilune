import React, { useEffect, useRef, useState } from 'react';
import { Wallet, Copy, Check, ChevronDown, UserRound, Settings, LogOut, ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';
import { readBalance } from './meraWallet';

export default function AccountMenu({ wallet, onDisconnect, chartType, onChartType, onBalance }) {
  const [open, setOpen] = useState(false), [view, setView] = useState('menu');
  const [copied, setCopied] = useState(false), [busy, setBusy] = useState(false);
  const [balance, setBalance] = useState(wallet.balance), [error, setError] = useState('');
  const root = useRef(null), trigger = useRef(null), timer = useRef(null);
  function close() { setOpen(false); setView('menu'); }
  useEffect(() => {
    const outside = e => { if (!root.current?.contains(e.target)) close(); };
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('pointerdown', outside); clearTimeout(timer.current); };
  }, []);
  async function copy() {
    try { await navigator.clipboard.writeText(wallet.address); setCopied(true); setError(''); clearTimeout(timer.current); timer.current = setTimeout(() => setCopied(false), 2000); }
    catch { setError('Copy unavailable. Select and copy the address below.'); setView('profile'); }
  }
  async function refresh() {
    setBusy(true);
    try { const next = await readBalance(wallet.address); setBalance(next); onBalance(next); } finally { setBusy(false); }
  }
  const short = wallet.address.slice(0, 6) + '…' + wallet.address.slice(-4);
  return <div className="account-root" ref={root} onKeyDown={e => {
    if (e.key === 'Escape') { close(); trigger.current?.focus(); }
    if (['ArrowDown','ArrowUp'].includes(e.key) && open) {
      const items = [...root.current.querySelectorAll('.account-panel button:not(:disabled), .account-panel a')];
      const i = items.indexOf(document.activeElement);
      if (items.length) { e.preventDefault(); items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1) + items.length) % items.length].focus(); }
    }
  }}>
    <button ref={trigger} className="account connected" aria-label="Open account menu" aria-expanded={open} aria-controls="account-panel" onClick={() => { setOpen(!open); setView('menu'); }}><Wallet size={16}/><span>{short}</span><span className="avatar">M</span><ChevronDown size={14}/></button>
    {open && <section id="account-panel" className="account-panel" aria-label="Your account">
      {view !== 'menu' && <button className="panel-back" onClick={() => setView('menu')}><ArrowLeft size={15}/> {view === 'profile' ? 'Your profile' : 'Settings'}</button>}
      {view !== 'settings' ? <>
        <div className="account-identity"><span className="profile-orb">M</span><div><strong>Your Lilune account</strong><small>Connected with Mera</small></div><span className="connection-dot" aria-label="Connected"/></div>
        <div className="wallet-balance"><span>Monad testnet balance</span><strong>{balance.formatted}{balance.raw !== null && <small> MON</small>}</strong><button onClick={refresh} disabled={busy} aria-label="Refresh wallet balance"><RefreshCw size={15} className={busy ? 'spin' : ''}/></button></div>
        <button className="copy-address" onClick={copy}><span>{copied ? 'Address copied' : short}</span>{copied ? <Check size={16}/> : <Copy size={16}/>}</button>
        {view === 'profile' && <div className="profile-details"><label htmlFor="full-address">Your testnet address</label><textarea id="full-address" readOnly value={wallet.address} onFocus={e => e.target.select()}/><p>Receive testnet MON at this address. Test tokens have no monetary value.</p><div className="profile-links"><a href="https://faucet.monad.xyz/" target="_blank" rel="noreferrer">Get testnet MON <ExternalLink size={14}/></a><a href={'https://testnet.monadscan.com/address/' + wallet.address} target="_blank" rel="noreferrer">View on Monadscan <ExternalLink size={14}/></a></div></div>}
        {view === 'menu' && <div className="account-actions"><button onClick={() => setView('profile')}><UserRound size={17}/><span>Profile<small>Address and network details</small></span></button><button onClick={() => setView('settings')}><Settings size={17}/><span>Settings<small>Make Lilune feel like you</small></span></button></div>}
      </> : <div className="account-settings"><h3>Your view, your way.</h3><p>Default trading chart</p><div className="chart-switch">{['line','candles'].map(type => <button key={type} aria-pressed={chartType === type} onClick={() => onChartType(type)}>{type === 'line' ? 'Line' : 'Candles'}</button>)}</div><p>Saved in this browser. Your passkey stays with your passkey provider.</p></div>}
      {error && <p role="alert">{error}</p>}
      <button className="disconnect-action" onClick={onDisconnect}><LogOut size={16}/>Disconnect<small>Keep my passkey</small></button>
    </section>}
  </div>;
}
