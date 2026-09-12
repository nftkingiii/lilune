const marketsUrl = "https://api.kuru.io/api/v1/markets";
const chartBase = "/api/kuru";

const periodConfig = {
  "1D": { interval: "30m", span: 24 * 60 * 60 * 1000 },
  "1W": { interval: "6h", span: 7 * 24 * 60 * 60 * 1000 },
  "1M": { interval: "1d", span: 30 * 24 * 60 * 60 * 1000 },
  "1Y": { interval: "1w", span: 365 * 24 * 60 * 60 * 1000 },
};

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

// Kuru's MON/USDC API returns integer-precision prices. Keep the conversion
// local to the adapter so chart components only receive display-ready values.
function kuruPrice(value) {
  const parsed = number(value);
  if (parsed === null) return null;
  return Math.abs(parsed) > 1e6 ? parsed / 1e18 : parsed;
}

function normalizeCandle(candle) {
  const open = kuruPrice(candle?.open);
  const high = kuruPrice(candle?.high);
  const low = kuruPrice(candle?.low);
  const close = kuruPrice(candle?.close);
  const openTime = number(candle?.openTime);
  const closeTime = number(candle?.closeTime);
  if ([open, high, low, close, openTime].some((value) => value === null)) return null;
  return {
    open,
    high: Math.max(open, high, low, close),
    low: Math.min(open, high, low, close),
    close,
    volume: number(candle?.volume) ?? 0,
    openTime,
    closeTime: closeTime ?? openTime,
  };
}

function aggregateRecentTrades(trades, period) {
  const valid = (Array.isArray(trades) ? trades : [])
    .map((trade) => ({
      price: kuruPrice(trade?.price),
      quantity: number(trade?.qty) ?? 0,
      time: number(trade?.time),
    }))
    .filter((trade) => trade.price !== null && trade.time !== null)
    .sort((a, b) => a.time - b.time);
  if (!valid.length) return [];

  const config = periodConfig[period] ?? periodConfig["1D"];
  const first = valid[0].time;
  const last = valid.at(-1).time;
  const range = Math.max(last - first, config.span / 12);
  const bucketSize = Math.max(config.span / 48, range / 48);
  const bucketCount = Math.min(48, Math.max(12, Math.ceil(range / bucketSize)));
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    openTime: first + index * bucketSize,
    trades: [],
  }));

  for (const trade of valid) {
    const index = Math.min(bucketCount - 1, Math.floor((trade.time - first) / bucketSize));
    buckets[index].trades.push(trade);
  }

  let previousClose = valid[0].price;
  return buckets.map((bucket) => {
    const prices = bucket.trades.map((trade) => trade.price);
    const open = prices[0] ?? previousClose;
    const close = prices.at(-1) ?? previousClose;
    const bar = {
      open,
      high: Math.max(open, ...prices),
      low: Math.min(open, ...prices),
      close,
      volume: bucket.trades.reduce((sum, trade) => sum + trade.quantity, 0),
      openTime: bucket.openTime,
      closeTime: bucket.openTime + bucketSize - 1,
    };
    previousClose = close;
    return bar;
  });
}

export async function fetchKuruMonadPulse(signal) {
  const response = await fetch(marketsUrl, { signal });
  if (!response.ok) throw new Error(`Kuru returned HTTP ${response.status}.`);
  const payload = await response.json();
  const markets = payload?.data?.data;
  const market = markets?.find(
    (candidate) =>
      candidate?.basetoken?.ticker === "MON" &&
      candidate?.quotetoken?.ticker === "USDC" &&
      Number(candidate?.lastPrice) > 0,
  );
  if (!market)
    throw new Error("Kuru did not return an active MON/USDC market.");
  return {
    symbol: "MON_USDC",
    marketAddress: market.market,
    lastPrice: Number(market.lastPrice),
    changePercent: Number(market.priceChange24h),
    volume24h: Number(market.volume24h),
    tradeCount: Number(market.buyCount24h) + Number(market.sellCount24h),
    closeTime: Date.parse(market.lastTradeTime),
  };
}

export async function fetchKuruMarketChart(period = "1D", signal) {
  const config = periodConfig[period] ?? periodConfig["1D"];
  const candleParams = new URLSearchParams({
    symbol: "MON_USDC",
    interval: config.interval,
    limit: "1000",
  });
  const candleResponse = await fetch(`${chartBase}/klines?${candleParams}`, { signal });
  if (!candleResponse.ok) throw new Error(`Kuru candles returned HTTP ${candleResponse.status}.`);
  const rawCandles = await candleResponse.json();
  const candles = (Array.isArray(rawCandles) ? rawCandles : [])
    .map(normalizeCandle)
    .filter(Boolean);
  if (candles.length) return { candles, source: "Kuru candles" };

  // The documented kline route can be empty for a newly indexed market. The
  // recent-trades route is still a real-time source, so aggregate it into
  // display bars rather than falling back to synthetic demo samples.
  const tradeParams = new URLSearchParams({ symbol: "MON_USDC", limit: "1000" });
  const tradeResponse = await fetch(`${chartBase}/trades?${tradeParams}`, { signal });
  if (!tradeResponse.ok) throw new Error(`Kuru trades returned HTTP ${tradeResponse.status}.`);
  const trades = await tradeResponse.json();
  const recentCandles = aggregateRecentTrades(trades, period);
  if (!recentCandles.length) throw new Error("Kuru has no recent MON/USDC trades yet.");
  return { candles: recentCandles, source: "Kuru recent trades" };
}
