// Shared Monad testnet constants, kept separate from meraWallet.js so the main
// bundle can show chain details without loading the wallet libraries.
export const MONAD_TESTNET_CHAIN_ID = 10143;
export const MONAD_EXPLORER = "https://testnet.monadscan.com";
export const MONAD_FAUCET = "https://faucet.monad.xyz/";
export const explorerTx = (hash) => `${MONAD_EXPLORER}/tx/${hash}`;
export const explorerAddress = (address) => `${MONAD_EXPLORER}/address/${address}`;
