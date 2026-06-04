import type { RwaNftMarketEvent } from "@/types/rwaNftMarket";
import { saveRwaNftMarketEvent } from "./rwaNftMarketEventService";
import { getNftDb } from "./nftSqliteDb";

type MarketplaceListing = {
  mint: string;
  category: string | null;
  priceSol: number | null;
  priceUsd: number | null;
  marketplace: string | null;
  rawPayload: unknown;
};

function env() {
  return (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function storedMintsForCategory(category?: string | null) {
  if (category && category !== "all") {
    return new Set(getNftDb().prepare("SELECT mint FROM nft_assets WHERE category = ? AND is_staging = 0").all(category).map((row) => String(row.mint)));
  }
  return new Set(getNftDb().prepare("SELECT mint FROM nft_assets WHERE category != 'unknown' AND is_staging = 0").all().map((row) => String(row.mint)));
}

export function normalizeMarketplaceListing(rawListing: unknown): MarketplaceListing | null {
  const row = rawListing && typeof rawListing === "object" && !Array.isArray(rawListing) ? rawListing as Record<string, unknown> : {};
  const mint = asString(row.mint) ?? asString(row.assetMint) ?? asString(row.tokenMint);
  if (!mint) return null;
  return {
    mint,
    category: asString(row.category),
    priceSol: asNumber(row.priceSol) ?? asNumber(row.price_sol),
    priceUsd: asNumber(row.priceUsd) ?? asNumber(row.price_usd),
    marketplace: asString(row.marketplace) ?? asString(row.source),
    rawPayload: rawListing,
  };
}

async function saveListing(listing: MarketplaceListing) {
  const event: RwaNftMarketEvent = {
    mint: listing.mint,
    category: listing.category,
    eventType: "LISTED",
    priceSol: listing.priceSol,
    priceUsd: listing.priceUsd,
    marketplace: listing.marketplace,
    txSignature: null,
    buyer: null,
    seller: null,
    owner: null,
    eventAt: new Date().toISOString(),
    source: "magiceden",
    rawPayload: listing.rawPayload,
  };
  return saveRwaNftMarketEvent(event);
}

export async function refreshListingsForCategory(category: string) {
  console.log(`[RWA MARKET] Fetching listings for category: ${category}`);
  const magicEdenKey = env().MAGIC_EDEN_API_KEY;
  const tensorKey = env().TENSOR_API_KEY;

  if (!magicEdenKey && !tensorKey) {
    return { status: "disabled", message: "No marketplace API key configured", matched: 0 };
  }

  return {
    status: "prepared",
    message: "Listing refresh scaffold is ready; collection/category marketplace endpoints must be configured before polling.",
    matched: 0,
    trackedMints: storedMintsForCategory(category).size,
  };
}

export async function refreshListingsForCollection(collection: string) {
  console.log(`[RWA MARKET] Starting listing refresh for collection: ${collection}`);
  return refreshListingsForCategory("all");
}

export async function refreshListingsForMint(mint: string) {
  const known = storedMintsForCategory("all").has(mint);
  if (!known) return { status: "ignored", message: "Mint is not stored in nft_assets", matched: 0 };
  return refreshListingsForCategory("all");
}

export async function saveMatchedListings(rawListings: unknown[], category?: string | null) {
  const allowedMints = storedMintsForCategory(category);
  let matched = 0;
  for (const raw of rawListings) {
    const listing = normalizeMarketplaceListing(raw);
    if (!listing || !allowedMints.has(listing.mint)) continue;
    console.log(`[RWA MARKET] Matched listing for mint: ${listing.mint}`);
    await saveListing(listing);
    matched += 1;
  }
  return { matched };
}
