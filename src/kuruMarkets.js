const marketsUrl = "https://api.kuru.io/api/v1/markets";

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
