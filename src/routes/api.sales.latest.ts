import { createFileRoute } from "@tanstack/react-router";
import type { NormalizedSale } from "@/lib/provider-ingestion/types";
import type { RwaMarketId, Sale } from "@/lib/rwa-index/models";

const RWA_MARKETS = new Set<RwaMarketId>([
  "pokemon-cards",
  "one-piece-cards",
  "nba-cards",
  "nfl-cards",
  "nhl-cards",
  "sealed-products",
  "graded-cards",
  "other-cards",
]);
const SOL_USD_FALLBACK = 160;

function stableId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "unknown";
}

function providerSaleToIndexSale(sale: NormalizedSale): Sale | undefined {
  if (!RWA_MARKETS.has(sale.market as RwaMarketId)) return undefined;
  const priceUsd = sale.priceUsd ?? (sale.priceSol ? sale.priceSol * SOL_USD_FALLBACK : undefined);
  const priceSol = sale.priceSol ?? (priceUsd ? priceUsd / SOL_USD_FALLBACK : undefined);
  if (!priceUsd || !priceSol) return undefined;

  return {
    id: stableId(`${sale.provider}-${sale.market}-${sale.txHash ?? sale.assetMint ?? sale.assetName}-${sale.timestamp}`),
    market: sale.market as RwaMarketId,
    assetId: stableId(`${sale.market}-${sale.assetMint ?? sale.assetName}`),
    assetName: sale.assetName,
    assetImage: sale.imageUrl,
    platform: sale.provider,
    source: sale.provider,
    txHash: sale.txHash,
    buyerWallet: sale.buyerWallet,
    sellerWallet: sale.sellerWallet,
    priceSol,
    priceUsd,
    timestamp: sale.timestamp,
    blockSlot: sale.blockSlot ?? undefined,
    rawPayload: sale.rawPayload,
    suspicious: sale.validationStatus === "failed",
    outlier: false,
    confirmed: sale.validationStatus !== "failed",
  };
}

export const Route = createFileRoute("/api/sales/latest")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const [{ getLatestProviderSales }, { getLatestConfirmedSales }] = await Promise.all([
          import("@/lib/provider-ingestion/store"),
          import("@/lib/rwa-index/repository"),
        ]);
        const url = new URL(request.url);
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 25), 1), 100);
        const providerSales = (await getLatestProviderSales(limit)).map(providerSaleToIndexSale).filter((sale): sale is Sale => Boolean(sale));
        const sales = providerSales.length ? providerSales.slice(0, limit) : await getLatestConfirmedSales(limit);
        return Response.json({ sales }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
