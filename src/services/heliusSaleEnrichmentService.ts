import type { RwaNftMarketEvent } from "@/types/rwaNftMarket";
import { getAssetByMint, HeliusNftError, normalizeHeliusAsset } from "./heliusNftService";
import { parseHeliusEnhancedTransaction } from "./heliusEnhancedTransactionParser";
import { ALLOWED_RWA_NFT_CATEGORIES, detectRwaNftCategory, isAllowedRwaNftCategory } from "./nftCategoryService";
import { getNftDb } from "./nftSqliteDb";
import { addTrackedNft, findTrackedNft, getStoredAsset, saveNormalizedAsset } from "./nftStore";
import { getVerifiedSales, saveRwaNftMarketEvent, updateNftAssetFromMarketEvent } from "./rwaNftMarketEventService";
import { isValidMarket, type TrackedNftMarket } from "./trackedNftsConfig";

const HELIUS_ENHANCED_TX_URL = "https://api.helius.xyz/v0/transactions/";

type RuntimeEnv = Record<string, string | undefined>;

type EnrichOptions = {
  mint?: string | null;
  market?: string | null;
  force?: boolean;
};

export class HeliusSaleEnrichmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HeliusSaleEnrichmentError";
  }
}

function env(): RuntimeEnv {
  return (globalThis as unknown as { process?: { env?: RuntimeEnv } }).process?.env ?? {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function rowByTx(txSignature: string) {
  return getNftDb().prepare("SELECT * FROM rwa_nft_events WHERE tx_signature = ? AND event_type = 'SALE'").get(txSignature) as Record<string, unknown> | undefined;
}

function rowByMint(mint: string) {
  return getNftDb().prepare("SELECT * FROM nft_assets WHERE mint = ?").get(mint) as Record<string, unknown> | undefined;
}

async function fetchEnhancedTransaction(txSignature: string) {
  const apiKey = env().HELIUS_API_KEY;
  if (!apiKey) throw new HeliusSaleEnrichmentError("Missing HELIUS_API_KEY");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(`${HELIUS_ENHANCED_TX_URL}?api-key=${apiKey}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ transactions: [txSignature] }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new HeliusSaleEnrichmentError(`Helius Enhanced Transactions failed: ${response.status} ${response.statusText}`);
    }

    const payload = await response.json() as unknown;
    const rows = Array.isArray(payload) ? payload : [];
    if (!rows.length) throw new HeliusSaleEnrichmentError("Helius returned no transaction for this signature");
    return rows[0];
  } catch (error) {
    if (error instanceof HeliusSaleEnrichmentError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new HeliusSaleEnrichmentError("Helius Enhanced Transactions request timed out");
    throw new HeliusSaleEnrichmentError(error instanceof Error ? error.message : "Helius Enhanced Transactions request failed");
  } finally {
    clearTimeout(timeout);
  }
}

function detectMarketFromAsset(rawAsset: unknown, normalizedMarket: string): TrackedNftMarket | null {
  const normalized = normalizeHeliusAsset(rawAsset, normalizedMarket);
  const detected = detectRwaNftCategory({
    name: normalized.name,
    description: normalized.description,
    collection: normalized.collection,
    attributes: normalized.attributes,
  });
  if (isAllowedRwaNftCategory(detected)) return detected;
  return isValidMarket(normalizedMarket) ? normalizedMarket : null;
}

async function ensureNftAsset(mint: string, market?: string | null) {
  const existing = await getStoredAsset(mint);
  if (existing) return { asset: existing, created: false };

  let rawAsset: unknown;
  try {
    rawAsset = await getAssetByMint(mint);
  } catch (error) {
    if (error instanceof HeliusNftError) throw new HeliusSaleEnrichmentError(`Unable to fetch NFT metadata from Helius: ${error.message}`);
    throw error;
  }

  const chosenMarket = detectMarketFromAsset(rawAsset, market ?? "unknown");
  if (!chosenMarket) {
    throw new HeliusSaleEnrichmentError(`Unable to detect an allowed category for mint ${mint}. Provide --market. Allowed categories: ${ALLOWED_RWA_NFT_CATEGORIES.join(", ")}`);
  }

  let tracked = await findTrackedNft(mint);
  if (!tracked) {
    tracked = await addTrackedNft({ mint, market: chosenMarket, label: "Enriched sale NFT" });
  }

  const normalized = normalizeHeliusAsset(rawAsset, chosenMarket);
  const saved = await saveNormalizedAsset(tracked, normalized, rawAsset);
  return { asset: saved, created: true };
}

export async function enrichSaleFromTxSignature(txSignature: string, options: EnrichOptions = {}): Promise<RwaNftMarketEvent> {
  if (!txSignature.trim()) throw new HeliusSaleEnrichmentError("txSignature is required");
  if (options.market && !isValidMarket(options.market)) {
    throw new HeliusSaleEnrichmentError(`category is not allowed: ${options.market}. Allowed categories: ${ALLOWED_RWA_NFT_CATEGORIES.join(", ")}`);
  }

  const rawTransaction = await fetchEnhancedTransaction(txSignature.trim());
  const sales = parseHeliusEnhancedTransaction(rawTransaction, { fallbackMint: options.mint }).filter((event) => event.eventType === "SALE");
  if (!sales.length) throw new HeliusSaleEnrichmentError("Transaction does not contain a supported NFT sale");

  const sale = sales[0];
  if (!sale.txSignature) sale.txSignature = txSignature.trim();
  if (!sale.mint && options.mint) sale.mint = options.mint;
  if (!sale.mint) throw new HeliusSaleEnrichmentError("NFT mint was not found in the transaction. Provide --mint only if the tx is known to be for that NFT.");

  return {
    ...sale,
    source: "helius_enhanced_tx",
    rawPayload: rawTransaction,
  };
}

export async function enrichAndSaveSaleFromTxSignature(txSignature: string, options: EnrichOptions = {}) {
  const event = await enrichSaleFromTxSignature(txSignature, options);
  const assetResult = await ensureNftAsset(event.mint, options.market);
  const asset = await getStoredAsset(event.mint);
  const category = event.category ?? asset?.category ?? null;

  if (!isAllowedRwaNftCategory(category)) {
    throw new HeliusSaleEnrichmentError(`Enriched sale category is not visible on /verified-sales: ${category ?? "unknown"}`);
  }

  const existing = rowByTx(event.txSignature ?? txSignature);
  let saveStatus = "created";
  if (existing && options.force) {
    getNftDb().prepare(`
      UPDATE rwa_nft_events SET
        mint = ?,
        category = ?,
        price_sol = ?,
        price_usd = ?,
        payment_mint = ?,
        payment_symbol = ?,
        payment_amount = ?,
        marketplace = ?,
        buyer = ?,
        seller = ?,
        owner = ?,
        event_at = ?,
        source = ?,
        raw_payload_json = ?
      WHERE tx_signature = ? AND event_type = 'SALE'
    `).run(
      event.mint,
      category,
      event.priceSol,
      event.priceUsd,
      event.paymentMint ?? null,
      event.paymentSymbol ?? null,
      event.paymentAmount ?? null,
      event.marketplace,
      event.buyer,
      event.seller,
      event.owner,
      event.eventAt,
      "helius_enhanced_tx",
      JSON.stringify(event.rawPayload ?? null),
      event.txSignature,
    );
    await updateNftAssetFromMarketEvent({ ...event, category, source: "helius_enhanced_tx" });
    saveStatus = "updated";
  } else if (existing) {
    saveStatus = "already_exists";
  } else {
    const result = await saveRwaNftMarketEvent({ ...event, category, source: "helius_enhanced_tx" });
    saveStatus = result.saved ? "created" : result.reason;
  }

  const visible = await getVerifiedSales({ search: event.txSignature, limit: 10, page: 1 });
  const updatedAsset = rowByMint(event.mint);
  const savedEvent = rowByTx(event.txSignature ?? txSignature);

  return {
    txSignature: event.txSignature ?? txSignature,
    detectedMint: event.mint,
    nftName: asString(updatedAsset?.name),
    priceSol: event.priceSol,
    priceUsd: event.priceUsd,
    paymentMint: event.paymentMint ?? null,
    paymentSymbol: event.paymentSymbol ?? null,
    paymentAmount: event.paymentAmount ?? null,
    buyer: event.buyer,
    seller: event.seller,
    marketplace: event.marketplace,
    eventTimestamp: event.eventAt,
    source: "helius_enhanced_tx",
    assetCreated: assetResult.created,
    saveStatus,
    visibleOnVerifiedSales: visible.sales.some((sale) => sale.txSignature === (event.txSignature ?? txSignature)),
    saleEvent: savedEvent,
    nftAsset: updatedAsset,
  };
}
