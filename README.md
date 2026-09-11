# Lilune

An interactive product design prototype for discovering companies through the products you use, practicing stock trades, and creating demo markets.

## Product description

Lilune is a personal discovery and ownership layer for the companies already woven into your life. It helps people start with familiar products and interests, follow the companies behind them, understand the surrounding context, and decide what they want to explore next.

The experience is designed for a single user. Discovery turns everyday tools, entertainment, and technology interests into a personal watchlist. Trade provides a calm, readable market view with an interactive chart, clear order review, balance checks, fee visibility, and portfolio feedback. Launch Studio lets a creator shape a market idea with a name, ticker, description, quote asset, supply, and liquidity, then validate and preview it before creating a local demo market.

Lilune is built around curiosity before complexity: a user can begin with something they already know, move into a focused market view, practice an action with explicit feedback, and return to a personal portfolio that remembers their choices. The visual language combines an ivory editorial canvas, deep ink typography, lilac surfaces, purple action states, local company logos, and an original orbit illustration. It takes inspiration from the warmth and personality of consumer products while keeping financial information legible and actions deliberate.

The current prototype uses illustrative prices, local demo funds, local browser persistence, and demonstration stock assets. Mera is integrated as an optional Monad testnet account layer: a passkey derives the account on-device, the session is reconstructed from saved credential metadata, the address and MON balance are read from Monad, and a user-triggered 0 MON self-check can produce a real testnet transaction. Lilune also reads a live, read-only MON/USDC market pulse from Kuru’s public market index, with bounded loading and an unavailable state. The stock actions remain explicitly demo-only; Lilune does not claim real stock ownership, issuer backing, live stock liquidity, subscription payments, or deployed launchpad markets.

## Run

Node.js 22 or newer. Run `npm install`, then `npm run dev`. `npm run build` produces the static app in `dist`.

## Included

Discovery filters and search, persistent watchlists, personalized company mapping, illustrative interactive charts, a live Kuru market pulse, buy/sell review and local demo balances, holdings and activity, a validated three-step market creation studio, and optional Mera passkey onboarding with Monad testnet balance/transaction state.

All stock prices, chart histories, trades, assets and markets are illustrative. Data persists in this browser's localStorage. Mera account metadata is persisted locally; private key material and signing sessions are not. Testnet proof transactions are separate from stock trades and require a funded account plus an explicit user action.

Built with React, Vite, Lucide icons and custom CSS. Fonts: DM Sans and Manrope, with system fallbacks. Original hero illustration generated for Lilune.
