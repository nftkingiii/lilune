import React, { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  Search,
  Plus,
  Star,
  X,
  Check,
  ChevronDown,
  ArrowLeft,
  SlidersHorizontal,
  Wallet,
  Compass,
  Layers,
  Sparkles,
  Command,
  ExternalLink,
} from "lucide-react";
import { assets, series, money } from "./data";
import LaunchStudio from "./LaunchStudio";
import {
  createMeraAccount,
  endMeraSession,
  restoreMeraAccount,
  sendMeraSelfCheck,
  MONAD_TESTNET_CHAIN_ID,
} from "./meraWallet";
import { fetchKuruMonadPulse } from "./kuruMarkets";
const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
function getMeraErrorMessage(error) {
  const code = error?.code;
  if (code === "PRF_UNAVAILABLE") {
    return "This passkey has no WebAuthn PRF support. Try Chrome with Google Password Manager, Edge on a supported Windows passkey, 1Password, or a hardware key.";
  }
  if (code === "PASSKEY_OPERATION_FAILED") {
    return "The passkey ceremony was cancelled or blocked. Try again in localhost/HTTPS and keep the passkey prompt open.";
  }
  return error?.message || "Mera could not connect on this device.";
}
const logos = {
  NVDA: "nvidia",
  AAPL: "apple",
  MSFT: "microsoft",
  AMZN: "amazon",
  GOOGL: "google",
  META: "meta",
};
function Mark({ asset, size = "" }) {
  return (
    <span
      className={"asset-mark " + size}
      style={{ background: asset.color, color: asset.ink }}
    >
      <img
        src={`/logos/${logos[asset.symbol]}.svg`}
        alt=""
        width="24"
        height="24"
      />
    </span>
  );
}
function Chart({ seed = 1, large = false, period = "1D", negative = false }) {
  const [hover, setHover] = useState(null);
  const points = series(seed + ["1D", "1W", "1M", "1Y"].indexOf(period) * 3);
  const line = points
    .map((y, i) => `${(i * 600) / (points.length - 1)},${y * 2}`)
    .join(" ");
  return (
    <div
      className={"chart " + (large ? "large" : "")}
      onPointerMove={(e) => {
        if (large) {
          const r = e.currentTarget.getBoundingClientRect();
          setHover(
            Math.max(
              0,
              Math.min(47, Math.round(((e.clientX - r.left) / r.width) * 47)),
            ),
          );
        }
      }}
      onPointerLeave={() => setHover(null)}
    >
      <svg
        viewBox="0 0 600 180"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${period} illustrative price trend`}
      >
        <defs>
          <linearGradient
            id={"fill" + seed + large}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              stopColor={negative ? "#bc625f" : "#9273d0"}
              stopOpacity=".18"
            />
            <stop offset="1" stopColor="#9273d0" stopOpacity="0" />
          </linearGradient>
        </defs>
        {large &&
          [30, 75, 120, 165].map((y) => (
            <line
              key={y}
              x1="0"
              x2="600"
              y1={y}
              y2={y}
              stroke="#e8e5ed"
              strokeDasharray="4 5"
            />
          ))}
        <polygon
          points={`0,180 ${line} 600,180`}
          fill={`url(#fill${seed}${large})`}
        />
        <polyline
          points={line}
          fill="none"
          stroke={negative ? "#bc625f" : "#8860ce"}
          strokeWidth={large ? "2" : "3"}
          vectorEffect="non-scaling-stroke"
        />
        {hover !== null && (
          <>
            <line
              x1={(hover * 600) / 47}
              x2={(hover * 600) / 47}
              y1="0"
              y2="180"
              stroke="#9273d0"
              strokeDasharray="3 3"
            />
            <circle
              cx={(hover * 600) / 47}
              cy={points[hover] * 2}
              r="4"
              fill="#7955d9"
            />
          </>
        )}
      </svg>
      {hover !== null && (
        <span className="chart-tooltip">
          Sample {hover + 1} · {period}
        </span>
      )}
    </div>
  );
}
export default function App() {
  const [page, setPage] = useState("Discover"),
    [category, setCategory] = useState("For you"),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState(assets[0]),
    [period, setPeriod] = useState("1D"),
    [watch, setWatch] = useState(() => read("lilune-watch", ["NVDA", "AAPL"])),
    [balance, setBalance] = useState(() => read("lilune-balance", 10000)),
    [holdings, setHoldings] = useState(() => read("lilune-holdings", {})),
    [activity, setActivity] = useState(() => read("lilune-activity", [])),
    [side, setSide] = useState("Buy"),
    [amount, setAmount] = useState("100"),
    [review, setReview] = useState(false),
    [pending, setPending] = useState(false),
    [toast, setToast] = useState(""),
    [stack, setStack] = useState(false),
    [choices, setChoices] = useState(["ChatGPT", "YouTube"]),
    [news, setNews] = useState(null),
    [sort, setSort] = useState(false),
    [mera, setMera] = useState(null),
    [meraBusy, setMeraBusy] = useState(false),
    [meraError, setMeraError] = useState(""),
    [proofStatus, setProofStatus] = useState("idle"),
    [proofHash, setProofHash] = useState(""),
    [kuruPulse, setKuruPulse] = useState({ status: "loading", data: null });
  const searchRef = useRef(null),
    dialogRef = useRef(null),
    meraSession = useRef(null);
  useEffect(() => {
    for (const [k, v] of Object.entries({ watch, balance, holdings, activity }))
      localStorage.setItem("lilune-" + k, JSON.stringify(v));
  }, [watch, balance, holdings, activity]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => () => endMeraSession(meraSession.current), []);
  useEffect(() => {
    let disposed = false;
    let controller;
    let timeout;
    const load = async () => {
      controller?.abort();
      clearTimeout(timeout);
      controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const data = await fetchKuruMonadPulse(controller.signal);
        if (!disposed) setKuruPulse({ status: "ready", data });
      } catch (error) {
        if (!disposed && error?.name !== "AbortError") {
          setKuruPulse({ status: "error", data: null, error: error?.message });
        }
      } finally {
        clearTimeout(timeout);
      }
    };
    load();
    const timer = setInterval(load, 30000);
    return () => {
      disposed = true;
      controller?.abort();
      clearTimeout(timeout);
      clearInterval(timer);
    };
  }, []);
  async function connectMera() {
    if (meraBusy) return;
    setMeraBusy(true);
    setMeraError("");
    try {
      const saved = read("lilune-mera-meta", null);
      const connected = saved
        ? await restoreMeraAccount(saved)
        : await createMeraAccount();
      meraSession.current = connected.session;
      setMera(connected);
      localStorage.setItem("lilune-mera-meta", JSON.stringify(connected.meta));
      setToast(
        saved
          ? "Mera account restored"
          : "Mera account created on Monad testnet",
      );
    } catch (error) {
      setMeraError(getMeraErrorMessage(error));
    } finally {
      setMeraBusy(false);
    }
  }
  async function proveMeraOnchain() {
    if (!mera?.account || proofStatus === "pending") return;
    setProofStatus("pending");
    setProofHash("");
    try {
      const { hash } = await sendMeraSelfCheck(mera.account);
      setProofHash(hash);
      setProofStatus("confirmed");
      setToast("Mera proof confirmed on Monad testnet");
    } catch (error) {
      setProofStatus(
        error?.name === "UserRejectedRequestError" ||
          /reject|denied|cancel/i.test(error?.message || "")
          ? "rejected"
          : "failed",
      );
    }
  }
  useEffect(() => {
    const fn = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPage("Discover");
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        if (!pending) setReview(false);
        setStack(false);
        setNews(null);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [pending]);
  useEffect(() => {
    if (review || stack || news) {
      const prev = document.activeElement;
      dialogRef.current?.focus();
      const trap = (e) => {
        if (e.key !== "Tab") return;
        const all = dialogRef.current?.querySelectorAll(
          'button,input,select,[tabindex="0"]',
        );
        if (!all?.length) return;
        const first = all[0],
          last = all[all.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === dialogRef.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      };
      document.addEventListener("keydown", trap);
      return () => {
        document.removeEventListener("keydown", trap);
        prev?.focus?.();
      };
    }
  }, [review, stack, news]);
  const toggle = (s) =>
    setWatch((w) => (w.includes(s) ? w.filter((x) => x !== s) : [...w, s]));
  const trade = (a) => {
    setSelected(a);
    setPage("Trade");
    setAmount("100");
    setSide("Buy");
  };
  let shown = assets.filter(
    (a) =>
      (category === "For you" ||
        (category === "Watchlist" && watch.includes(a.symbol)) ||
        a.category === category) &&
      (a.name + " " + a.symbol).toLowerCase().includes(query.toLowerCase()),
  );
  if (sort) shown = [...shown].sort((a, b) => b.change - a.change);
  const value = Number(amount),
    fee = Math.round(value * 0.001 * 100) / 100,
    qty = value / selected.price,
    owned = holdings[selected.symbol] || 0,
    valid =
      Number.isFinite(value) &&
      value > 0 &&
      (side === "Buy" ? value + fee <= balance : qty <= owned),
    total =
      balance +
      assets.reduce((s, a) => s + (holdings[a.symbol] || 0) * a.price, 0);
  async function confirm() {
    if (!valid || pending) return;
    setPending(true);
    await new Promise((r) => setTimeout(r, 650));
    setBalance((b) => b + (side === "Buy" ? -value - fee : value - fee));
    setHoldings((h) => ({
      ...h,
      [selected.symbol]:
        (h[selected.symbol] || 0) + (side === "Buy" ? qty : -qty),
    }));
    setActivity((a) => [
      { id: Date.now(), side, symbol: selected.symbol, value, quantity: qty },
      ...a,
    ]);
    setPending(false);
    setReview(false);
    setToast(
      `${side === "Buy" ? "Bought" : "Sold"} ${qty.toFixed(4)} demo ${selected.symbol}`,
    );
  }
  return (
    <div className="app">
      <header>
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            setPage("Discover");
          }}
        >
          <span className="brand-star">✦</span> lilune
          <span className="brand-dot">®</span>
        </a>
        <nav aria-label="Main navigation">
          {["Discover", "Trade", "Launch", "Portfolio"].map((p) => (
            <button
              key={p}
              className={page === p ? "active" : ""}
              aria-current={page === p ? "page" : undefined}
              onClick={() => setPage(p)}
            >
              {p}
              {p === "Launch" && <span className="nav-plus">+</span>}
            </button>
          ))}
        </nav>
        <div className="header-right">
          <span className="demo-label">
            {mera
              ? `Monad testnet · ${mera.balance.formatted} MON`
              : "Monad testnet"}
          </span>
          <button
            className={"account " + (mera ? "connected" : "")}
            onClick={() => (mera ? setPage("Portfolio") : connectMera())}
            disabled={meraBusy}
            aria-label={mera ? "Open Mera account" : "Connect Mera account"}
          >
            <Wallet size={15} />
            <span>
              {meraBusy
                ? "Opening…"
                : mera
                  ? `${mera.address.slice(0, 6)}…${mera.address.slice(-4)}`
                  : "Connect Mera"}
            </span>
            <span className="avatar">{mera ? "M" : "Y"}</span>
          </button>
          {meraError && (
            <span className="mera-error-inline" role="alert">
              {meraError}
            </span>
          )}
        </div>
      </header>
      <main>
        {page === "Discover" && (
          <>
            <section className="heading-row">
              <div>
                <h1>
                  A little more <em>yours.</em>
                </h1>
                <p>
                  Discover the companies in your world. Find your next
                  beginning.
                </p>
              </div>
              <button className="text-button" onClick={() => setStack(true)}>
                Make it personal <SlidersHorizontal size={16} />
              </button>
            </section>
            <section className="feature-grid">
              <div className="hero">
                <div className="hero-copy">
                  <span className="pill">Your world, onchain</span>
                  <h2>
                    You use it.
                    <br />
                    You love it.
                    <br />
                    <em>Explore owning it.</em>
                  </h2>
                  <p>
                    From your everyday essentials to your
                    <br className="desktop" /> next big obsession. Start with
                    what you know.
                  </p>
                  <button className="primary" onClick={() => setStack(true)}>
                    Find my companies <ArrowRight size={17} />
                  </button>
                  <span className="hero-foot">
                    A little curiosity goes a long way.
                  </span>
                </div>
                <div className="hero-art">
                  <img
                    src="/orbit-hero.png"
                    alt="Sculptural lilac orbit, purple star and chrome sphere"
                  />
                  <span className="floating-label label-one">
                    <span className="tiny-green">N</span> Your AI obsession{" "}
                    <ArrowRight size={13} />
                  </span>
                  <span className="floating-label label-two">
                    <span>⊞</span> Your everyday tools
                  </span>
                </div>
                <span className="hero-page">
                  01 <span>/ 03</span>
                </span>
              </div>
              <aside className="spotlight">
                <div className="spotlight-top">
                  <span>THE WATCHLIST</span>
                  <Star size={17} />
                </div>
                <div className="spotlight-art">
                  <div className="orbit-wire" />
                  <div className="nvidia-cube">
                    N<span>nvidia</span>
                  </div>
                  <span className="little-star">✦</span>
                </div>
                <span className="spotlight-tag">Behind the AI moment</span>
                <h3>
                  Big ideas.
                  <br />
                  Tiny chips.
                </h3>
                <p>
                  Meet the company powering
                  <br />a whole new kind of creativity.
                </p>
                <button onClick={() => trade(assets[0])}>
                  Explore NVIDIA <ArrowRight size={18} />
                </button>
              </aside>
            </section>
            <section className="kuru-pulse" aria-labelledby="kuru-pulse-title">
              <div className="kuru-pulse-heading">
                <div>
                  <span className="pulse-eyebrow">MONAD MARKET PULSE</span>
                  <h2 id="kuru-pulse-title">
                    What’s moving beyond the familiar.
                  </h2>
                  <p>
                    A live, read-only window into Kuru’s MON/USDC market. Start
                    with context before you decide what deserves your attention.
                  </p>
                </div>
                <span className="pulse-source">
                  <span className="status-dot" /> Kuru feed
                </span>
              </div>
              {kuruPulse.status === "loading" && (
                <div className="pulse-message">Reading the market pulse…</div>
              )}
              {kuruPulse.status === "error" && (
                <div className="pulse-message error" role="status">
                  Kuru’s public feed is unavailable right now. Lilune’s saved
                  discovery experience is still available.
                </div>
              )}
              {kuruPulse.status === "ready" && kuruPulse.data && (
                <div className="pulse-metrics">
                  <div>
                    <span>MON / USDC</span>
                    <strong>{kuruPulse.data.lastPrice.toFixed(4)}</strong>
                    <small>last price</small>
                  </div>
                  <div>
                    <span>24H MOVE</span>
                    <strong
                      className={
                        kuruPulse.data.changePercent >= 0
                          ? "positive"
                          : "negative"
                      }
                    >
                      {kuruPulse.data.changePercent >= 0 ? "+" : ""}
                      {kuruPulse.data.changePercent.toFixed(2)}%
                    </strong>
                    <small>rolling ticker</small>
                  </div>
                  <div>
                    <span>24H VOLUME</span>
                    <strong>
                      {Number.isFinite(kuruPulse.data.volume24h)
                        ? "$" +
                          (kuruPulse.data.volume24h / 1e6).toFixed(2) +
                          "M"
                        : "—"}
                    </strong>
                    <small>USDC volume</small>
                  </div>
                  <div>
                    <span>TRADES</span>
                    <strong>
                      {kuruPulse.data.tradeCount.toLocaleString()}
                    </strong>
                    <small>24h count</small>
                  </div>
                </div>
              )}
              <div className="pulse-footnote">
                <span>
                  Source: Kuru market index · refreshed every 30 seconds
                </span>
                <span>Read-only · no wallet action</span>
              </div>
            </section>
            <section className="market-section">
              <div className="section-heading">
                <h2>
                  Find your kind of company<span>06</span>
                </h2>
                <div className="search">
                  <Search size={16} />
                  <input
                    ref={searchRef}
                    aria-label="Search companies"
                    placeholder="Search companies"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <kbd>⌘ K</kbd>
                </div>
              </div>
              <div className="filter-row">
                <div className="filters">
                  {[
                    "For you",
                    "AI & tech",
                    "Everyday",
                    "Culture",
                    "Watchlist",
                  ].map((c) => (
                    <button
                      key={c}
                      className={category === c ? "selected" : ""}
                      onClick={() => setCategory(c)}
                    >
                      {c === "For you" && <Sparkles size={13} />} {c}
                      {c === "Watchlist" && <span>{watch.length}</span>}
                    </button>
                  ))}
                </div>
                <button className="sort-button" onClick={() => setSort(!sort)}>
                  {sort ? "Top movers" : "Featured"}
                  <ChevronDown size={14} />
                </button>
              </div>
              <div className="company-grid">
                {shown.map((a, i) => (
                  <article className="company-card" key={a.symbol}>
                    <div className="company-top">
                      <button
                        className="company-identity"
                        onClick={() => trade(a)}
                      >
                        <Mark asset={a} />
                        <span>
                          <strong>{a.name}</strong>
                          <small>{a.symbol}</small>
                        </span>
                      </button>
                      <button
                        className={
                          "watch-button " +
                          (watch.includes(a.symbol) ? "saved" : "")
                        }
                        aria-label={`${watch.includes(a.symbol) ? "Remove" : "Add"} ${a.name} ${watch.includes(a.symbol) ? "from" : "to"} watchlist`}
                        aria-pressed={watch.includes(a.symbol)}
                        onClick={() => toggle(a.symbol)}
                      >
                        <Star
                          size={17}
                          fill={
                            watch.includes(a.symbol) ? "currentColor" : "none"
                          }
                        />
                      </button>
                    </div>
                    <p>{a.tag}</p>
                    <button
                      className="card-trade"
                      onClick={() => trade(a)}
                      aria-label={`Explore ${a.name}`}
                    >
                      <Chart seed={i + 1} negative={a.change < 0} />
                      <div className="company-bottom">
                        <strong>{money(a.price)}</strong>
                        <span
                          className={a.change >= 0 ? "positive" : "negative"}
                        >
                          {a.change >= 0 ? "↗" : "↘"}{" "}
                          {Math.abs(a.change).toFixed(2)}%
                        </span>
                      </div>
                    </button>
                  </article>
                ))}
              </div>
              {!shown.length && (
                <div className="empty">
                  <Search />
                  <h3>No companies found</h3>
                  <p>Try another name or explore a different category.</p>
                  <button
                    className="secondary"
                    onClick={() => {
                      setQuery("");
                      setCategory("For you");
                    }}
                  >
                    Show all companies
                  </button>
                </div>
              )}
              <div className="data-note">
                Illustrative prices and trends · All trades use demo funds
              </div>
            </section>
            <section className="bottom-grid">
              <div className="story-panel">
                <div className="section-heading">
                  <h2>A little context</h2>
                  <span className="muted">The bigger picture</span>
                </div>
                {[
                  {
                    title: "The tools you use have a story. Follow it.",
                    category: "YOUR AI STACK",
                    art: "✳",
                    text: "A model is only one part of your AI stack. Chip makers, cloud providers and software companies each play a different role. Explore those connections without assuming that using a product makes its stock a good investment.",
                  },
                  {
                    title: "A familiar brand. A different kind of asset.",
                    category: "THE BASICS",
                    art: "◒",
                    text: "Tokenized assets can represent different rights depending on their issuer. Check backing, redemption, eligibility and market liquidity before trading. Every stock in this prototype is a demonstration asset with no ownership rights.",
                  },
                ].map((s) => (
                  <button
                    className="story"
                    key={s.title}
                    onClick={() => setNews(s)}
                  >
                    <span
                      className={"story-art " + (s.art === "◒" ? "peach" : "")}
                    >
                      {s.art}
                    </span>
                    <span>
                      <small>{s.category}</small>
                      <h3>{s.title}</h3>
                      <span className="muted">
                        2 min read · Lilune field notes
                      </span>
                    </span>
                    <ArrowRight size={19} />
                  </button>
                ))}
              </div>
              <div className="launch-teaser">
                <span className="launch-symbol">✧</span>
                <span className="pill">For the ones with an idea</span>
                <h2>
                  Start something
                  <br />
                  <em>of your own.</em>
                </h2>
                <p>
                  Give your idea a name, a token,
                  <br />
                  and a place to begin.
                </p>
                <button
                  className="text-button"
                  onClick={() => setPage("Launch")}
                >
                  Enter the launch studio <ArrowRight size={17} />
                </button>
              </div>
            </section>
          </>
        )}
        {page === "Trade" && (
          <>
            <div className="heading-row">
              <div>
                <h1>
                  Follow your <em>curiosity.</em>
                </h1>
                <p>A closer look at the companies that caught your eye.</p>
              </div>
              <span className="pill">Demo trading · No real funds</span>
            </div>
            <div className="trade-layout">
              <section className="trade-main">
                <div className="asset-selector">
                  <label htmlFor="asset">Company</label>
                  <select
                    id="asset"
                    value={selected.symbol}
                    onChange={(e) =>
                      setSelected(
                        assets.find((a) => a.symbol === e.target.value),
                      )
                    }
                  >
                    {assets.map((a) => (
                      <option key={a.symbol} value={a.symbol}>
                        {a.name} · {a.symbol}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="trade-title">
                  <Mark asset={selected} />
                  <div>
                    <h2>{selected.name}</h2>
                    <span className="muted">
                      {selected.symbol} · Illustrative stock asset
                    </span>
                  </div>
                  <button
                    className="watch-button"
                    onClick={() => toggle(selected.symbol)}
                    aria-label="Toggle watchlist"
                  >
                    <Star
                      fill={
                        watch.includes(selected.symbol)
                          ? "currentColor"
                          : "none"
                      }
                      size={20}
                    />
                  </button>
                </div>
                <div className="price-display">
                  {money(selected.price)}
                  <span
                    className={selected.change > 0 ? "positive" : "negative"}
                  >
                    {selected.change > 0 ? "+" : ""}
                    {selected.change}% <small>sample day</small>
                  </span>
                </div>
                <Chart
                  large
                  seed={assets.indexOf(selected) + 1}
                  period={period}
                />
                <div className="chart-axis">
                  <span>09:30</span>
                  <span>11:00</span>
                  <span>12:30</span>
                  <span>14:00</span>
                  <span>16:00</span>
                </div>
                <div className="periods">
                  {["1D", "1W", "1M", "1Y"].map((p) => (
                    <button
                      className={p === period ? "selected" : ""}
                      onClick={() => setPeriod(p)}
                      key={p}
                    >
                      {p}
                    </button>
                  ))}
                  <span>Illustrative chart</span>
                </div>
                <div className="about-company">
                  <h3>In your world</h3>
                  <p>{selected.description}</p>
                  <div>
                    <span>
                      Category<strong>{selected.category}</strong>
                    </span>
                    <span>
                      Asset type<strong>Demo stock</strong>
                    </span>
                    <span>
                      Sample volume<strong>${selected.volume}</strong>
                    </span>
                  </div>
                </div>
              </section>
              <aside className="order-ticket">
                {mera ? (
                  <div className="mera-status">
                    <div className="mera-status-head">
                      <span className="status-dot" />
                      <span>
                        <strong>Mera ready</strong>
                        <small>
                          {mera.address.slice(0, 10)}… · Chain{" "}
                          {MONAD_TESTNET_CHAIN_ID}
                        </small>
                      </span>
                    </div>
                    <div className="mera-status-actions">
                      <span>{mera.balance.formatted} MON</span>
                      <button
                        className="text-action"
                        onClick={proveMeraOnchain}
                        disabled={
                          proofStatus === "pending" ||
                          mera.balance.raw === "0" ||
                          mera.balance.raw === "Unavailable"
                        }
                        title={
                          mera.balance.raw === "0"
                            ? "Fund this account with Monad testnet MON first"
                            : "Send a 0 MON self-check transaction"
                        }
                      >
                        {proofStatus === "pending"
                          ? "Waiting…"
                          : "Prove onchain"}
                      </button>
                    </div>
                    {proofStatus !== "idle" && (
                      <small className={"proof-state " + proofStatus}>
                        {proofStatus === "confirmed"
                          ? "Confirmed · " + proofHash.slice(0, 12) + "…"
                          : proofStatus === "rejected"
                            ? "Signature rejected"
                            : proofStatus === "failed"
                              ? "Transaction failed"
                              : "Transaction pending"}
                      </small>
                    )}
                  </div>
                ) : (
                  <button
                    className="connect-prompt"
                    onClick={connectMera}
                    disabled={meraBusy}
                  >
                    <Wallet size={16} />
                    <span>
                      {meraBusy ? "Opening passkey…" : "Connect Mera to trade"}
                    </span>
                    <ArrowRight size={15} />
                  </button>
                )}
                {meraError && (
                  <p className="form-error" role="alert">
                    {meraError}
                  </p>
                )}
                <div className="buy-sell">
                  {["Buy", "Sell"].map((s) => (
                    <button
                      className={s === side ? "selected" : ""}
                      onClick={() => setSide(s)}
                      key={s}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <p className="muted">
                  {side === "Buy"
                    ? "Put a little curiosity to work."
                    : "Make room for your next idea."}
                </p>
                <label htmlFor="amount">
                  {side === "Buy" ? "You pay" : "Sell value"}
                </label>
                <div className="amount-input">
                  <span>$</span>
                  <input
                    id="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <span>USD</span>
                </div>
                <div className="presets">
                  {[25, 100, 250].map((n) => (
                    <button onClick={() => setAmount(String(n))} key={n}>
                      ${n}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      setAmount(
                        (side === "Buy"
                          ? Math.floor((balance / 1.001) * 100) / 100
                          : Math.floor(owned * selected.price * 100) / 100
                        ).toFixed(2),
                      )
                    }
                  >
                    Max
                  </button>
                </div>
                <div className="order-details">
                  <span>
                    Available demo cash<strong>{money(balance)}</strong>
                  </span>
                  <span>
                    You {side === "Buy" ? "receive" : "sell"}
                    <strong>
                      {Number.isFinite(qty) ? qty.toFixed(5) : "0"}{" "}
                      {selected.symbol}
                    </strong>
                  </span>
                  <span>
                    Demo fee (0.1%)
                    <strong>{money(Number.isFinite(fee) ? fee : 0)}</strong>
                  </span>
                  <span>
                    Your holdings
                    <strong>
                      {owned.toFixed(5)} {selected.symbol}
                    </strong>
                  </span>
                </div>
                {!valid && amount !== "" && (
                  <p className="form-error">
                    {value <= 0
                      ? "Enter an amount greater than zero."
                      : side === "Buy"
                        ? "Your demo balance does not cover this order and fee."
                        : "You do not have enough demo shares to sell."}
                  </p>
                )}
                <button
                  className="primary full"
                  disabled={!valid}
                  onClick={() => setReview(true)}
                >
                  Review {side.toLowerCase()} <ArrowRight size={17} />
                </button>
                <p className="ticket-note">
                  Practice with demo funds. Orders are simulated locally and do
                  not buy real stocks.
                </p>
              </aside>
            </div>
          </>
        )}
        {page === "Launch" && (
          <LaunchStudio
            onCreated={() => setToast("Your demo market is ready")}
          />
        )}
        {page === "Portfolio" && (
          <>
            <div className="heading-row">
              <div>
                <h1>
                  Your own little <em>universe.</em>
                </h1>
                <p>Your companies, your ideas, your next chapter.</p>
              </div>
              <button className="secondary" onClick={() => setPage("Discover")}>
                Explore companies <ArrowRight size={16} />
              </button>
            </div>
            <div className="portfolio-summary">
              <div>
                <span>Total demo value</span>
                <h2>{money(total)}</h2>
                <p>Includes {money(balance)} available demo cash</p>
              </div>
              <span className="portfolio-orbit">✦</span>
              <div>
                <span>Companies held</span>
                <h3>
                  {Object.values(holdings).filter((v) => v > 0.000001).length}
                </h3>
                <span>Local practice portfolio</span>
              </div>
            </div>
            <h2 className="section-title">Your holdings</h2>
            {assets.filter((a) => (holdings[a.symbol] || 0) > 0.000001)
              .length ? (
              <div className="holdings">
                {assets
                  .filter((a) => (holdings[a.symbol] || 0) > 0.000001)
                  .map((a) => (
                    <button key={a.symbol} onClick={() => trade(a)}>
                      <Mark asset={a} />
                      <span>
                        <strong>{a.name}</strong>
                        <small>
                          {holdings[a.symbol].toFixed(5)} demo shares
                        </small>
                      </span>
                      <strong>{money(holdings[a.symbol] * a.price)}</strong>
                      <ArrowRight size={17} />
                    </button>
                  ))}
              </div>
            ) : (
              <div className="empty">
                <Layers size={30} />
                <h3>Every portfolio starts somewhere.</h3>
                <p>Find a company you know and make your first demo trade.</p>
                <button className="primary" onClick={() => setPage("Discover")}>
                  Find my first company <ArrowRight size={16} />
                </button>
              </div>
            )}
            <h2 className="section-title">Recent activity</h2>
            {activity.length ? (
              <div className="activity">
                {activity.map((a) => (
                  <div key={a.id}>
                    <span className="activity-icon">
                      <Check size={17} />
                    </span>
                    <span>
                      <strong>
                        {a.side === "Buy" ? "Bought" : "Sold"} {a.symbol}
                      </strong>
                      <small>
                        {a.quantity.toFixed(5)} demo shares ·{" "}
                        {new Date(a.id).toLocaleDateString()}
                      </small>
                    </span>
                    <strong>{money(a.value)}</strong>
                    <span className="pill">Simulated</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Your demo trades will appear here.</p>
            )}
          </>
        )}
      </main>
      <footer>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("Discover");
          }}
        >
          <span className="brand-star">✦</span> lilune
        </a>
        <span>Made for your kind of curious.</span>
        <span>Design prototype · Demo assets only</span>
        <span className="footer-monad">◇ Inspired by Monad</span>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
      {(review || stack || news) && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !pending) {
              setReview(false);
              setStack(false);
              setNews(null);
            }
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
            ref={dialogRef}
          >
            <button
              className="close"
              aria-label="Close dialog"
              disabled={pending}
              onClick={() => {
                setReview(false);
                setStack(false);
                setNews(null);
              }}
            >
              <X size={21} />
            </button>
            {review ? (
              <>
                <span className="modal-icon">
                  <Wallet />
                </span>
                <h2 id="modal-title">A little closer to {selected.name}.</h2>
                <p>Review your simulated {side.toLowerCase()}.</p>
                <div className="review-amount">{money(value)}</div>
                <div className="order-details">
                  <span>
                    Demo shares
                    <strong>
                      {qty.toFixed(5)} {selected.symbol}
                    </strong>
                  </span>
                  <span>
                    Fee<strong>{money(fee)}</strong>
                  </span>
                  <span>
                    {side === "Buy" ? "Total cost" : "Net proceeds"}
                    <strong>
                      {money(side === "Buy" ? value + fee : value - fee)}
                    </strong>
                  </span>
                </div>
                <button
                  className="primary full"
                  disabled={pending || !valid}
                  onClick={confirm}
                >
                  {pending
                    ? "Simulating…"
                    : `Confirm demo ${side.toLowerCase()}`}
                  <ArrowRight size={16} />
                </button>
                <p className="ticket-note">
                  No wallet signature. No real transaction.
                </p>
              </>
            ) : stack ? (
              <>
                <span className="modal-icon">
                  <Sparkles />
                </span>
                <h2 id="modal-title">What's in your world?</h2>
                <p>
                  Pick the tools you use. We'll connect the dots to the
                  companies behind them.
                </p>
                <div className="stack-options">
                  {[
                    "ChatGPT",
                    "YouTube",
                    "iPhone",
                    "Xbox",
                    "Instagram",
                    "AWS",
                  ].map((c) => (
                    <button
                      className={choices.includes(c) ? "chosen" : ""}
                      key={c}
                      onClick={() =>
                        setChoices((v) =>
                          v.includes(c) ? v.filter((x) => x !== c) : [...v, c],
                        )
                      }
                    >
                      {c}
                      {choices.includes(c) ? (
                        <Check size={17} />
                      ) : (
                        <Plus size={17} />
                      )}
                    </button>
                  ))}
                </div>
                <p className="ticket-note">
                  These are company relationships, not investment
                  recommendations. OpenAI is private; NVIDIA and Microsoft are
                  related infrastructure companies.
                </p>
                <button
                  className="primary full"
                  disabled={!choices.length}
                  onClick={() => {
                    const map = {
                      ChatGPT: ["NVDA", "MSFT"],
                      YouTube: ["GOOGL"],
                      iPhone: ["AAPL"],
                      Xbox: ["MSFT"],
                      Instagram: ["META"],
                      AWS: ["AMZN"],
                    };
                    setWatch((w) => [
                      ...new Set([...w, ...choices.flatMap((c) => map[c])]),
                    ]);
                    setCategory("Watchlist");
                    setPage("Discover");
                    setStack(false);
                    setToast("Your companies are waiting in your watchlist");
                  }}
                >
                  Discover my companies <ArrowRight size={17} />
                </button>
              </>
            ) : (
              <>
                <span className="modal-icon">
                  <Compass />
                </span>
                <h2 id="modal-title">{news.title}</h2>
                <p className="article-text">{news.text}</p>
                <button
                  className="primary"
                  onClick={() => {
                    setNews(null);
                    setPage("Discover");
                  }}
                >
                  Keep exploring <ArrowRight size={16} />
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
