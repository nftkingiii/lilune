// Envio HyperSync reader for the "Launched on Lilune" feed. Every LiluneToken
// emits LiluneLaunched from its constructor, so one topic query over Monad
// testnet finds every launch; a second query over their Transfer logs gives
// holder counts and the connected account's balances. Runs server-side so the
// Envio API token never reaches the browser.
import { HypersyncClient } from "@envio-dev/hypersync-client";
import { decodeEventLog, getAddress, toEventSelector } from "viem";
import { liluneTokenAbi } from "./src/liluneToken.js";

const LAUNCHED_TOPIC = toEventSelector("LiluneLaunched(address,string,string,string,uint256)");
const TRANSFER_TOPIC = toEventSelector("Transfer(address,address,uint256)");
const CACHE_MS = 15_000;
const MAX_PAGES = 25;
const MAX_LAUNCHES = 200;

const url = process.env.ENVIO_HYPERSYNC_URL || "https://monad-testnet.hypersync.xyz";
const apiToken = process.env.ENVIO_API_TOKEN || "";
const fromBlock = Number(process.env.LILUNE_LAUNCH_FROM_BLOCK || 0);

let client = null;
let cache = { at: 0, value: null, pending: null };

export const envioConfigured = () => Boolean(apiToken);

function hypersync() {
  client ??= new HypersyncClient({ url, apiToken, httpReqTimeoutMillis: 10_000, maxNumRetries: 2 });
  return client;
}

// Follows HyperSync's nextBlock pagination until it reaches the chain head.
async function collect(query) {
  const logs = [];
  const transactions = [];
  const blocks = [];
  let next = query.fromBlock;
  let height = 0;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await hypersync().get({ ...query, fromBlock: next });
    logs.push(...response.data.logs);
    transactions.push(...response.data.transactions);
    blocks.push(...response.data.blocks);
    height = response.archiveHeight ?? height;
    if (response.nextBlock <= next || response.nextBlock >= height) break;
    next = response.nextBlock;
  }
  return { logs, transactions, blocks, height };
}

function decode(log) {
  try {
    return decodeEventLog({ abi: liluneTokenAbi, data: log.data, topics: log.topics.filter(Boolean) });
  } catch {
    return null;
  }
}

async function readLaunches() {
  const launched = await collect({
    fromBlock,
    logs: [{ topics: [[LAUNCHED_TOPIC]] }],
    fieldSelection: {
      log: ["Address", "BlockNumber", "TransactionHash", "Data", "Topic0", "Topic1"],
      transaction: ["Hash", "ContractAddress"],
      block: ["Number", "Timestamp"],
    },
  });

  // Only trust launches emitted by the deployment transaction of the contract
  // itself, so another contract cannot spoof a Lilune launch by emitting the
  // same event later.
  const createdBy = new Map(
    launched.transactions
      .filter((tx) => tx.hash && tx.contractAddress)
      .map((tx) => [tx.hash.toLowerCase(), tx.contractAddress.toLowerCase()]),
  );
  const timestamps = new Map(launched.blocks.map((block) => [block.number, Number(block.timestamp)]));

  const launches = [];
  for (const log of launched.logs) {
    const event = decode(log);
    if (event?.eventName !== "LiluneLaunched" || !log.address) continue;
    const token = log.address.toLowerCase();
    if (createdBy.get(log.transactionHash?.toLowerCase()) !== token) continue;
    launches.push({
      token: getAddress(token),
      creator: getAddress(event.args.creator),
      name: event.args.name,
      symbol: event.args.symbol,
      premise: event.args.premise,
      totalSupply: event.args.totalSupply.toString(),
      blockNumber: log.blockNumber,
      timestamp: timestamps.get(log.blockNumber) ?? null,
      txHash: log.transactionHash,
    });
  }
  launches.sort((a, b) => b.blockNumber - a.blockNumber);
  const recent = launches.slice(0, MAX_LAUNCHES);

  // Replay every Transfer of the launched tokens to get balances per holder.
  const balances = new Map(recent.map((launch) => [launch.token.toLowerCase(), new Map()]));
  const transfers = new Map(recent.map((launch) => [launch.token.toLowerCase(), 0]));
  if (recent.length) {
    const minBlock = Math.min(...recent.map((launch) => launch.blockNumber));
    const moved = await collect({
      fromBlock: minBlock,
      logs: [{ address: recent.map((launch) => launch.token), topics: [[TRANSFER_TOPIC]] }],
      fieldSelection: { log: ["Address", "Data", "Topic0", "Topic1", "Topic2"] },
    });
    for (const log of moved.logs) {
      const token = log.address?.toLowerCase();
      const holders = balances.get(token);
      const event = holders && decode(log);
      if (event?.eventName !== "Transfer") continue;
      const { from, to, value } = event.args;
      const zero = "0x0000000000000000000000000000000000000000";
      if (from.toLowerCase() !== zero) holders.set(from.toLowerCase(), (holders.get(from.toLowerCase()) ?? 0n) - value);
      if (to.toLowerCase() !== zero) holders.set(to.toLowerCase(), (holders.get(to.toLowerCase()) ?? 0n) + value);
      transfers.set(token, transfers.get(token) + 1);
    }
  }

  return {
    height: launched.height,
    launches: recent,
    balances,
    transfers,
  };
}

async function snapshot() {
  if (cache.value && Date.now() - cache.at < CACHE_MS) return cache.value;
  cache.pending ??= readLaunches()
    .then((value) => {
      cache = { at: Date.now(), value, pending: null };
      return value;
    })
    .catch((error) => {
      cache.pending = null;
      throw error;
    });
  return cache.pending;
}

// Response for GET /api/envio/launches[?account=0x…].
export async function launchFeed(account) {
  const { height, launches, balances, transfers } = await snapshot();
  const holderKey = account?.toLowerCase();
  return {
    source: "Envio HyperSync",
    network: "Monad testnet",
    indexedHeight: height,
    launches: launches.map((launch) => {
      const holders = balances.get(launch.token.toLowerCase());
      const balance = holderKey ? holders?.get(holderKey) ?? 0n : null;
      return {
        ...launch,
        holders: holders ? [...holders.values()].filter((value) => value > 0n).length : 0,
        transfers: transfers.get(launch.token.toLowerCase()) ?? 0,
        ...(holderKey && { accountBalance: balance.toString() }),
      };
    }),
  };
}

// Shared by server.mjs and the Vite dev server.
export async function handleEnvioRequest(requestUrl, response) {
  const parsed = new URL(requestUrl, "http://localhost");
  const send = (status, body) => {
    response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    response.end(JSON.stringify(body));
  };
  if (parsed.pathname !== "/api/envio/launches") return send(404, { error: "Unknown Envio route." });
  const account = parsed.searchParams.get("account");
  if (account !== null && !/^0x[0-9a-fA-F]{40}$/.test(account)) return send(400, { error: "Invalid account address." });
  if (!envioConfigured()) return send(503, { error: "Envio HyperSync is not configured on this server." });
  try {
    send(200, await launchFeed(account));
  } catch (error) {
    console.error("Envio HyperSync query failed:", error?.message || error);
    send(502, { error: "Envio HyperSync is temporarily unavailable." });
  }
}
