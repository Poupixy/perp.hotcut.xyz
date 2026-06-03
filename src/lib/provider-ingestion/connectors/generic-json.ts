import type { NormalizedSale, ProviderId } from "../types";
import { asNumber, asRecord, asString, rowsFromPayload, toIsoDate } from "../utils";

export function normalizeGenericSale(rowValue: unknown, provider: ProviderId, market: string): NormalizedSale | undefined {
  const row = asRecord(rowValue);
  const txHash = asString(row.txHash) ?? asString(row.tx_hash) ?? asString(row.signature) ?? asString(row.transactionHash) ?? asString(row.transaction_hash);
  const assetMint = asString(row.assetMint) ?? asString(row.asset_mint) ?? asString(row.mint) ?? asString(row.tokenMint) ?? asString(row.token_mint);
  const timestamp = toIsoDate(row.timestamp) ?? toIsoDate(row.saleTime) ?? toIsoDate(row.sale_time) ?? toIsoDate(row.blockTime) ?? toIsoDate(row.createdAt);
  const priceUsd = asNumber(row.priceUsd) ?? asNumber(row.price_usd) ?? asNumber(row.usdAmount);
  const priceSol = asNumber(row.priceSol) ?? asNumber(row.price_sol) ?? (asString(row.currency)?.toUpperCase() === "SOL" ? asNumber(row.amount) : undefined);
  const amount = asNumber(row.amount) ?? asNumber(row.price);
  const currency = asString(row.currency)?.toUpperCase() ?? (priceSol ? "SOL" : priceUsd ? "USD" : "UNKNOWN");

  if (!timestamp || !amount && !priceUsd && !priceSol) return undefined;
  return {
    provider,
    market,
    assetName: asString(row.assetName) ?? asString(row.asset_name) ?? asString(row.name) ?? asString(row.title) ?? assetMint ?? "Unknown asset",
    assetMint,
    imageUrl: asString(row.imageUrl) ?? asString(row.image_url) ?? asString(row.image) ?? asString(row.metadataImage),
    txHash,
    buyerWallet: asString(row.buyerWallet) ?? asString(row.buyer_wallet) ?? asString(row.buyer),
    sellerWallet: asString(row.sellerWallet) ?? asString(row.seller_wallet) ?? asString(row.seller),
    priceSol: priceSol ?? (currency === "SOL" ? amount ?? null : null),
    priceUsd: priceUsd ?? (currency === "USD" ? amount ?? null : null),
    currency,
    timestamp,
    blockSlot: asNumber(row.blockSlot) ?? asNumber(row.block_slot) ?? asNumber(row.slot) ?? null,
    rawPayload: row,
    validationStatus: "unverified",
  };
}

export function normalizeGenericPayload(payload: unknown, provider: ProviderId, market: string): NormalizedSale[] {
  return rowsFromPayload(payload).map((row) => normalizeGenericSale(row, provider, market)).filter((sale): sale is NormalizedSale => Boolean(sale));
}
