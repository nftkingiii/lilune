// Shared Monad testnet constants, kept separate from meraWallet.js so the main
// bundle can show chain details without loading the wallet libraries.
export const MONAD_TESTNET_CHAIN_ID = 10143;
export const MONAD_EXPLORER = "https://testnet.monadscan.com";
export const MONAD_FAUCET = "https://faucet.monad.xyz/";
export const explorerTx = (hash) => `${MONAD_EXPLORER}/tx/${hash}`;
export const explorerAddress = (address) => `${MONAD_EXPLORER}/address/${address}`;

// Lilune reads Kuru's production market index (Monad mainnet) for market data,
// while Mera accounts and launches stay on Monad testnet.
export const MARKET_DATA_NETWORK = "Monad mainnet";
export const WALLET_NETWORK = "Monad testnet";
export const MONAD_MAINNET_EXPLORER = "https://monadscan.com";
