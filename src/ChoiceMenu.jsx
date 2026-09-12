import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

export default function ChoiceMenu({ label, value, options, onChange, searchable = false }) {
  const [open, setOpen] = useState(false), [query, setQuery] = useState('');
  const root = useRef(null), trigger = useRef(null), panel = useRef(null), id = useId();
  const selected = options.find(o => o.value === value);
  const filtered = options.filter(o => (o.label + ' ' + (o.detail || '')).toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {
    const outside = e => { if (!root.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  useEffect(() => { if (open) { setQuery(''); panel.current?.querySelector('input,button')?.focus(); } }, [open]);
  return <div className="choice-root" ref={root} onKeyDown={e => {
    if (e.key === 'Escape') { setOpen(false); trigger.current?.focus(); }
    if (['ArrowDown','ArrowUp'].includes(e.key)) {
      e.preventDefault(); if (!open) { setOpen(true); return; }
      const rows = [...panel.current.querySelectorAll('[role=option]')], i = rows.indexOf(document.activeElement);
      rows[(i + (e.key === 'ArrowDown' ? 1 : rows.length - 1) + rows.length) % rows.length]?.focus();
    }
  }}>
    <button className="choice-trigger" ref={trigger} aria-label={label + ': ' + selected?.label} aria-haspopup="listbox" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>{selected?.logo && <img src={selected.logo} alt=""/>}<span>{selected?.label}</span>{selected?.detail && <small>{selected.detail}</small>}<ChevronDown size={16}/></button>
    {open && <div className="choice-panel" ref={panel}>
      {searchable && <label className="choice-search"><Search size={15}/><input aria-label={'Search ' + label.toLowerCase()} placeholder="Find your company…" value={query} onChange={e => setQuery(e.target.value)}/></label>}
      <div role="listbox" id={id} aria-label={label}>{filtered.map(o => <button key={o.value} role="option" aria-selected={o.value === value} onClick={() => { onChange(o.value); setOpen(false); trigger.current?.focus(); }}>{o.logo && <img src={o.logo} alt=""/>}<span>{o.label}<small>{o.detail}</small></span>{o.value === value && <Check size={16}/>}</button>)}</div>
      {!filtered.length && <p className="choice-empty">No companies found. Try a name or ticker.</p>}
    </div>}
  </div>;
}
