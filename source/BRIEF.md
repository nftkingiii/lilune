# Lilune films: brief and truth sheet

**Event:** Monad Metropolis hackathon, deadline 13 Oct 20:59 PDT. Upload hosts: YouTube, Loom or Vimeo (the user uploads; I never post).
**Route:** A+ capture composite. Real screen recordings of https://lilune-production.up.railway.app recorded in headless Chromium on a GitHub Actions runner, then zooms, captions, cursor, title cards and sound drawn in code.
**Look:** the product's own brand: ivory #F8F7F3, ink #242329, accent purple #7955D9, lilac #F0EDF9. UI face DM Sans; editorial serif italic (Instrument Serif) for display lines, which echoes the app's italic serif accents.
**Voice:** Piper, en_US lessac high (offline, free). Captions carry every narrated line.
**Sound:** synthesized in code (sfx.mjs) under the voice. No licensed music.

| Film | Field | Limit | Audience question | Target |
|---|---|---|---|---|
| demo | Technical demo (required) | 3:00 | Does it work, end to end? | ~2:40 |
| pitch | Pitch video (required) | 2:00 | Who, what problem, why now? | ~1:30 |
| envio | Envio bounty demo (optional) | 2:00 | Does Envio drive a real feature? | ~1:15 |
| mera | Mera bounty demo (optional) | 2:00 | Is Mera the whole account layer? | ~1:10 |
| ad | Product advertisement (optional) | 0:30 | What is it, in one breath? | 0:28 |

## Truth sheet (claim → evidence → status)
| Claim | Evidence | Status |
|---|---|---|
| Kuru MON/USDC price, 24h move, volume, candles are live | Captured on the live site; app fetches api.kuru.io and exchange.kuru.io | live, Monad mainnet data |
| Mera derives a Monad testnet account from a passkey | Captured; capture used Chrome's virtual WebAuthn authenticator with PRF in place of a hardware passkey | real account, virtual authenticator (stated in credits) |
| Token deploy is real on Monad testnet | Captured success screen with contract + tx links; account funded from faucet | testnet, onchain |
| Envio HyperSync feed lists the launch | Captured feed tagged "Yours" after deploy; code in envio.mjs | live, Monad testnet |
| Stock prices and trades are demo | App labels "Demo trading · No real funds", network strip "Stocks Demo only" | demo, label kept visible |
| Launch liquidity / quote asset are planned values | App says "No liquidity pool is created" | planned, stated |
| Real Kuru execution | Roadmap only | planned, narrated as "next" |

No other numbers appear on screen except those inside the captured UI.

## Credits line
Captured: Lilune live site, 13 Oct 2026, Monad mainnet (Kuru data) and Monad testnet (Mera, deploy, Envio), headless Chromium with a virtual passkey. Code-drawn: captions, zooms, cursor, title cards. Sound: synthesized in code. Voice: Piper (offline, en_US lessac). Numbers: only those shown in the captured app. Made with Claude Code (Opus 5.5).
