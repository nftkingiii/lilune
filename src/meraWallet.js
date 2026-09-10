import {
  createPasskeyWithPrfOutput,
  getEvmAddress,
  getPasskeyPrfOutput,
  createSecp256k1SigningSession,
} from "@category-labs/mera";
import { toViemAccount } from "@category-labs/mera/viem";
import { HDKey } from "@scure/bip32";
import { entropyToMnemonic, mnemonicToSeedSync } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  formatEther,
  http,
} from "viem";

export const MONAD_TESTNET_CHAIN_ID = 10143;
export const monadTestnet = defineChain({
  id: MONAD_TESTNET_CHAIN_ID,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
  blockExplorers: {
    default: { name: "Monadscan", url: "https://testnet.monadscan.com" },
  },
});

const derivationPath = "m/44'/60'/0'/0/0";
const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

function deriveSession(prfOutput) {
  const mnemonic = entropyToMnemonic(prfOutput, wordlist);
  const seed = mnemonicToSeedSync(mnemonic);
  const node = HDKey.fromMasterSeed(seed).derive(derivationPath);
  if (!node.privateKey)
    throw new Error("Mera account derivation did not produce a key.");
  return createSecp256k1SigningSession({ privateKey: node.privateKey });
}

async function readBalance(address) {
  try {
    const balance = await publicClient.getBalance({ address });
    return {
      raw: balance.toString(),
      formatted: Number(formatEther(balance)).toFixed(4),
    };
  } catch {
    return { raw: "0", formatted: "Unavailable" };
  }
}

export async function createMeraAccount() {
  const rp = { id: window.location.hostname, name: "Lilune" };
  const created = await createPasskeyWithPrfOutput({
    rp,
    user: { name: "lilune-account", displayName: "Lilune account" },
  });
  const session = deriveSession(created.prfOutput);
  const address = getEvmAddress(session.publicKey);
  const meta = {
    rpId: rp.id,
    credentialId: created.credentialId,
    transports: created.transports,
    prfSalt: bytesToBase64(created.prfSalt),
  };
  return {
    address,
    meta,
    session,
    account: toViemAccount(session),
    balance: await readBalance(address),
    isNew: true,
  };
}

export async function restoreMeraAccount(meta) {
  if (!meta?.rpId || !meta?.credentialId || !meta?.prfSalt)
    throw new Error("Mera account details are incomplete.");
  const credential = {
    credentialId: meta.credentialId,
    transports: meta.transports,
  };
  const { prfOutput } = await getPasskeyPrfOutput({
    rpId: meta.rpId,
    credential,
    prfSalt: base64ToBytes(meta.prfSalt),
  });
  const session = deriveSession(prfOutput);
  const address = getEvmAddress(session.publicKey);
  return {
    address,
    meta,
    session,
    account: toViemAccount(session),
    balance: await readBalance(address),
    isNew: false,
  };
}

export function endMeraSession(session) {
  session?.end?.();
}

export async function sendMeraSelfCheck(account) {
  if (!account?.address)
    throw new Error("Connect Mera before sending a proof.");
  const walletClient = createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(),
  });
  const hash = await walletClient.sendTransaction({
    account,
    to: account.address,
    value: 0n,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return { hash, receipt };
}
