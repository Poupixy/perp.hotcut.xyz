import { fetchMarketSales } from "@/lib/market-data/providers";
import type { MarketSalesResponse, NormalizedSale } from "@/lib/market-data/types";
import { calculateIndexSnapshot } from "./engine";
import { rwaMarkets } from "./markets";
import type { Asset, IndexSnapshot, RwaMarketId, Sale } from "./models";

const SOL_USD_FALLBACK = 160;

function stableId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "unknown";
}

function marketFromSale(sale: NormalizedSale): RwaMarketId | undefined {
  const known = rwaMarkets.find((market) => market.id === sale.marketSlug || market.name === sale.marketName);
  return known?.id;
}

function saleToIndexSale(sale: NormalizedSale): Sale | undefined {
  const market = marketFromSale(sale);
  if (!market) return undefined;
  const priceUsd = sale.currency === "USD" ? sale.salePrice : sale.salePrice * SOL_USD_FALLBACK;
  const priceSol = sale.currency === "SOL" ? sale.salePrice : priceUsd / SOL_USD_FALLBACK;

  return {
    id: sale.id,
    market,
    assetId: stableId(`${market}-${sale.assetName}`),
    assetName: sale.assetName,
    assetImage: sale.assetImage,
    platform: sale.marketplace,
    source: sale.source,
    txHash: sale.txSignature,
    buyerWallet: sale.buyer,
    sellerWallet: sale.seller,
    priceSol,
    priceUsd,
    timestamp: sale.saleTime,
    rawPayload: sale,
    suspicious: false,
    outlier: false,
    confirmed: true,
  };
}

export async function getConfirmedSales(days = 7): Promise<{ sales: Sale[]; source: MarketSalesResponse }> {
  const source = await fetchMarketSales(days);
  const sales = source.sales.map(saleToIndexSale).filter((sale): sale is Sale => Boolean(sale));
  return { sales, source };
}

export async function getLatestConfirmedSales(limit = 25): Promise<Sale[]> {
  const { sales } = await getConfirmedSales(7);
  return sales
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export async function getAssets(): Promise<Asset[]> {
  const { sales } = await getConfirmedSales(7);
  const assets = new Map<string, Asset>();
  for (const sale of sales) {
    assets.set(sale.assetId, {
      id: sale.assetId,
      market: sale.market,
      name: sale.assetName,
      image: sale.assetImage,
    });
  }
  return Array.from(assets.values());
}

export async function getPokemonIndexSnapshot(): Promise<IndexSnapshot> {
  const { sales } = await getConfirmedSales(7);
  return calculateIndexSnapshot(sales);
}

export async function getPokemonIndexHistory(points = 12): Promise<IndexSnapshot[]> {
  const { sales } = await getConfirmedSales(7);
  const now = new Date();
  return Array.from({ length: points }, (_, index) => {
    const minutesAgo = (points - index - 1) * 10;
    return calculateIndexSnapshot(sales, { now: new Date(now.getTime() - minutesAgo * 60 * 1000) });
  });
}

export function getMarkets() {
  return rwaMarkets;
}
