import type { IndexEngineConfig, IndexSnapshot, Sale } from "./models";

const MINUTE = 60 * 1000;

export const defaultPokemonIndexConfig: IndexEngineConfig = {
  market: "pokemon-cards",
  indexName: "POKEMON_INDEX",
  staleAfterMinutes: 30,
  minimumSales30m: 2,
  outlierVwapDeviation: 0.35,
  lowVolumeUsd: 1_000,
  abnormalMovePercent: 0.6,
};

function priceChange(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null || previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function inWindow(sale: Sale, now: Date, minutes: number): boolean {
  const age = now.getTime() - new Date(sale.timestamp).getTime();
  return age >= 0 && age <= minutes * MINUTE;
}

function sumVolume(sales: Sale[]): number {
  return sales.reduce((sum, sale) => sum + sale.priceUsd, 0);
}

function vwap(sales: Sale[]): number | null {
  if (!sales.length) return null;
  const total = sales.reduce((sum, sale) => sum + sale.priceUsd, 0);
  return total / sales.length;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number | null, decimals = 4): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Number(value.toFixed(decimals));
}

function markSuspiciousSales(sales: Sale[], config: IndexEngineConfig): Sale[] {
  const walletPairs = new Map<string, number>();
  for (const sale of sales) {
    if (!sale.buyerWallet || !sale.sellerWallet) continue;
    const pair = `${sale.buyerWallet}:${sale.sellerWallet}`;
    walletPairs.set(pair, (walletPairs.get(pair) ?? 0) + 1);
  }

  return sales.map((sale, index, ordered) => {
    const pair = sale.buyerWallet && sale.sellerWallet ? `${sale.buyerWallet}:${sale.sellerWallet}` : undefined;
    const repeatedPair = pair ? (walletPairs.get(pair) ?? 0) >= 3 : false;
    const sameWallet = Boolean(sale.buyerWallet && sale.sellerWallet && sale.buyerWallet === sale.sellerWallet);
    const previous = ordered[index - 1];
    const abnormalMove = previous ? Math.abs((sale.priceUsd - previous.priceUsd) / previous.priceUsd) > config.abnormalMovePercent : false;
    const lowVolume = sale.priceUsd < config.lowVolumeUsd;

    return {
      ...sale,
      suspicious: sale.suspicious || sameWallet || repeatedPair || (abnormalMove && lowVolume),
    };
  });
}

function markOutliers(sales: Sale[], config: IndexEngineConfig): Sale[] {
  const baseline = vwap(sales.slice(0, Math.min(5, sales.length)));
  if (!baseline) return sales;

  return sales.map((sale) => {
    const deviation = Math.abs(sale.priceUsd - baseline) / baseline;
    const isOutlier = deviation > config.outlierVwapDeviation;
    return { ...sale, outlier: sale.outlier || isOutlier };
  });
}

function liquidityScore(sales30m: Sale[], volume30m: number): number {
  const countScore = clamp((sales30m.length / 8) * 45);
  const volumeScore = clamp((volume30m / 50_000) * 45);
  const diversity = new Set(sales30m.map((sale) => sale.platform)).size;
  const sourceScore = clamp(diversity * 5, 0, 10);
  return Math.round(countScore + volumeScore + sourceScore);
}

function confidenceScore(params: { stale: boolean; salesCount30m: number; liquidityScore: number; outlierCount: number; suspiciousCount: number }): number {
  const base = params.stale ? 35 : 70;
  const countBonus = clamp(params.salesCount30m * 4, 0, 15);
  const liquidityBonus = params.liquidityScore * 0.15;
  const penalty = params.outlierCount * 8 + params.suspiciousCount * 10;
  return Math.round(clamp(base + countBonus + liquidityBonus - penalty));
}

export function calculateIndexSnapshot(rawSales: Sale[], partialConfig: Partial<IndexEngineConfig> = {}): IndexSnapshot {
  const config = { ...defaultPokemonIndexConfig, ...partialConfig };
  const now = config.now ?? new Date();
  const confirmed = rawSales
    .filter((sale) => sale.confirmed && sale.market === config.market && sale.priceUsd > 0)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const qualityChecked = markOutliers(markSuspiciousSales(confirmed, config), config);
  const valid = qualityChecked.filter((sale) => !sale.outlier && !sale.suspicious);
  const valid10m = valid.filter((sale) => inWindow(sale, now, 10));
  const valid30m = valid.filter((sale) => inWindow(sale, now, 30));
  const previous10m = valid.filter((sale) => {
    const age = now.getTime() - new Date(sale.timestamp).getTime();
    return age > 10 * MINUTE && age <= 20 * MINUTE;
  });
  const previous30m = valid.filter((sale) => {
    const age = now.getTime() - new Date(sale.timestamp).getTime();
    return age > 30 * MINUTE && age <= 60 * MINUTE;
  });

  const lastSale = valid[0] ?? null;
  const previousSale = valid[1] ?? null;
  const vwap10m = vwap(valid10m);
  const vwap30m = vwap(valid30m);
  const volume10m = sumVolume(valid10m);
  const volume30m = sumVolume(valid30m);
  const latestAgeMinutes = lastSale ? (now.getTime() - new Date(lastSale.timestamp).getTime()) / MINUTE : Infinity;
  const stale = valid30m.length < config.minimumSales30m || latestAgeMinutes > config.staleAfterMinutes || !vwap30m;
  const staleReason = !vwap30m
    ? "No valid confirmed sales in the 30m window."
    : valid30m.length < config.minimumSales30m
      ? "Not enough confirmed sales in the 30m window."
      : latestAgeMinutes > config.staleAfterMinutes
        ? "Latest valid sale is too old."
        : undefined;
  const liquidity = liquidityScore(valid30m, volume30m);
  const outlierCount = qualityChecked.filter((sale) => sale.outlier).length;
  const suspiciousCount = qualityChecked.filter((sale) => sale.suspicious).length;

  return {
    indexName: config.indexName,
    market: config.market,
    indexPrice: round(vwap30m ?? lastSale?.priceUsd ?? 0, 4) ?? 0,
    lastSalePrice: round(lastSale?.priceUsd ?? null, 4),
    previousSalePrice: round(previousSale?.priceUsd ?? null, 4),
    priceChangePercent: round(priceChange(lastSale?.priceUsd ?? null, previousSale?.priceUsd ?? null), 4),
    vwap10m: round(vwap10m, 4),
    vwap30m: round(vwap30m, 4),
    volume10m: round(volume10m, 2) ?? 0,
    volume30m: round(volume30m, 2) ?? 0,
    salesCount10m: valid10m.length,
    salesCount30m: valid30m.length,
    growth10m: round(priceChange(vwap10m, vwap(previous10m)), 4),
    growth30m: round(priceChange(vwap30m, vwap(previous30m)), 4),
    liquidityScore: liquidity,
    confidenceScore: confidenceScore({ stale, salesCount30m: valid30m.length, liquidityScore: liquidity, outlierCount, suspiciousCount }),
    stale,
    staleReason,
    timestamp: now.toISOString(),
  };
}
