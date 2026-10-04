# Lilune

An interactive product design prototype for discovering companies through the products you use, practicing stock trades, and creating demo markets.

## Product description

Lilune is a personal discovery and ownership layer for the companies already woven into your life. It helps people start with familiar products and interests, follow the companies behind them, understand the surrounding context, and decide what they want to explore next.

The experience is designed for a single user. Discovery turns everyday tools, entertainment, and technology interests into a personal watchlist. Trade provides a calm, readable market view with an interactive chart, clear order review, balance checks, fee visibility, and portfolio feedback. Launch Studio lets a creator shape a market idea with a name, ticker, description, quote asset, supply, and liquidity, then validate and preview it before creating a local demo market.

Lilune is built around curiosity before complexity: a user can begin with something they already know, move into a focused market view, practice an action with explicit feedback, and return to a personal portfolio that remembers their choices. The visual language combines an ivory editorial canvas, deep ink typography, lilac surfaces, purple action states, local company logos, and an original orbit illustration. It takes inspiration from the warmth and personality of consumer products while keeping financial information legible and actions deliberate.

Stock prices and stock trades are illustrative and stay in the browser. Two parts are real: Lilune reads Kuru's live MON/USDC market (price, 24h move, volume, trades and candles), and Mera gives each user a passkey-derived Monad testnet account that can sign real transactions, including deploying a Launch Studio token as an ERC-20 on Monad testnet. Lilune does not claim real stock ownership, issuer backing, live stock liquidity, or Kuru order execution.

**Live demo:** https://lilune-production.up.railway.app

## Judge's demo path (about 60 seconds)

1. **Discover.** Click *Find my companies*, pick a few products you use (ChatGPT, YouTube, Instagram…) and see which public companies each one connects to, and why. They land in your watchlist.
2. **Live market.** The *Monad market pulse* shows Kuru's MON/USDC market live, refreshed every 30 seconds.
3. **Trade.** Open *Trade*, choose *MON / USDC* in the market picker and switch between 1D/1W/1M/1Y and line/candles: these are real Kuru candles. Place a demo buy; it values at the live Kuru price in *Portfolio*.
4. **Connect Mera.** Click *Connect Mera* and create a passkey (Chrome or Edge with a PRF-capable passkey provider). Lilune derives a Monad testnet account on-device, and no seed phrase or extension is needed. Fund it from the [Monad faucet](https://faucet.monad.xyz/).
5. **Launch onchain.** In *Launch*, describe a market, review it and press *Deploy token*. Mera signs a real deployment of `contracts/LiluneToken.sol` to Monad testnet; the full supply is minted to your account and the premise is stored onchain. You get the contract address plus Monadscan links.

| | Real | Simulated |
|---|---|---|
| Kuru MON/USDC market data and candles | ✓ | |
| Mera passkey account, balance and transactions on Monad testnet | ✓ | |
| Launch Studio token deploy (ERC-20 on Monad testnet) | ✓ | |
| Stock prices, stock charts, demo trades and demo cash | | ✓ |
| Launch liquidity and quote asset (planned values; no pool is created) | | ✓ |

A strip under the header shows which network each part uses: Kuru market data comes from Monad mainnet, while Mera wallets and launches stay on Monad testnet.

**Security.** `server.mjs` serves a strict Content-Security-Policy: only Lilune's own scripts run, and the page can only connect to Kuru's API and the Monad testnet RPC. That matters because a connected Mera account keeps its signing key in page memory, so injected scripts or data exfiltration are blocked by the browser.

## Run

Node.js 22 or newer. Run `npm install`, then `npm run dev`. `npm run build` produces the static app in `dist`, and `npm start` serves it with the Kuru market-data proxy (`server.mjs`). Passkeys need `localhost` or HTTPS.

After changing `contracts/LiluneToken.sol`, run `npm run compile:token` to regenerate `src/liluneToken.js`.

## Included

Discovery filters and search, persistent watchlists, product-to-company mapping for 28 everyday products with the reason for each link, illustrative stock charts, a live Kuru market pulse and live MON/USDC candles, buy/sell review with local demo balances, holdings and activity valued at live prices, a validated three-step launch studio that deploys a real ERC-20 on Monad testnet, and Mera passkey onboarding with testnet balance and transactions.

Stock prices, stock chart histories and demo trades are illustrative. Data persists in this browser's localStorage. Mera account metadata is persisted locally; private key material and signing sessions are not. Every onchain action is on Monad testnet, needs a funded account and an explicit user action, and moves no real value. The wallet libraries load only when a user connects, which keeps the first page load small.

Built with React, Vite, Lucide icons and custom CSS. Fonts: DM Sans and Manrope, with system fallbacks. Original hero illustration generated for Lilune.
