import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { NftAssetRow, NftIngestionDb, TrackedNftRow } from "../src/services/nftTypes";
import { writeNftDb } from "../src/services/nftStore";

function env() {
  return process.env;
}

function jsonPath() {
  return resolve(process.cwd(), env().PERP_NFT_DB_PATH || "data/nft-ingestion.json");
}

function nowIso() {
  return new Date().toISOString();
}

function stableId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "unknown";
}

function normalizeTracked(row: Partial<TrackedNftRow>): TrackedNftRow | null {
  if (!row.mint || !row.market) return null;
  const timestamp = nowIso();
  return {
    id: row.id ?? stableId(row.mint),
    mint: row.mint,
    market: row.market,
    label: row.label ?? null,
    active: row.active ?? true,
    created_at: row.created_at ?? timestamp,
    updated_at: row.updated_at ?? timestamp,
    last_fetched_at: row.last_fetched_at ?? null,
  };
}

function normalizeAsset(row: Partial<NftAssetRow>): NftAssetRow | null {
  if (!row.mint || !row.market) return null;
  const timestamp = row.updated_at ?? nowIso();
  return {
    id: row.id ?? stableId(row.mint),
    mint: row.mint,
    market: row.market,
    name: row.name ?? null,
    description: row.description ?? null,
    image: row.image ?? null,
    owner: row.owner ?? null,
    collection: row.collection ?? null,
    category: row.category ?? row.market,
    attributes_json: Array.isArray(row.attributes_json) ? row.attributes_json : [],
    token_standard: row.token_standard ?? null,
    interface: row.interface ?? null,
    source_collection: row.source_collection ?? row.collection ?? null,
    is_staging: row.is_staging ?? false,
    is_listed: row.is_listed ?? false,
    listed_price_sol: row.listed_price_sol ?? null,
    listed_price_usd: row.listed_price_usd ?? null,
    listing_marketplace: row.listing_marketplace ?? null,
    listing_updated_at: row.listing_updated_at ?? null,
    last_sale_price_sol: row.last_sale_price_sol ?? null,
    last_sale_price_usd: row.last_sale_price_usd ?? null,
    last_sale_at: row.last_sale_at ?? null,
    last_sale_marketplace: row.last_sale_marketplace ?? null,
    last_sale_tx_signature: row.last_sale_tx_signature ?? null,
    floor_price_sol: row.floor_price_sol ?? null,
    market_updated_at: row.market_updated_at ?? null,
    raw_helius_json: row.raw_helius_json ?? null,
    updated_at: timestamp,
    created_at: row.created_at ?? timestamp,
  };
}

async function main() {
  const file = jsonPath();
  console.log(`[NFT DB] Migrating from JSON storage: ${file}`);
  try {
    await access(file);
  } catch {
    console.log("[NFT DB] JSON file not found, starting with empty tables");
    await writeNftDb({ tracked_nfts: [], nft_assets: [], queue_state: { queue: [], processing: false, lastHeliusCallAt: null, backoffUntil: null, updatedAt: nowIso() } });
    console.log("tracked_nfts migrated count: 0");
    console.log("nft_assets migrated count: 0");
    console.log("queue_state initialized");
    console.log("duplicates skipped: 0");
    console.log("errors: 0");
    return;
  }

  const parsed = JSON.parse(await readFile(file, "utf8")) as Partial<NftIngestionDb>;
  const tracked = (parsed.tracked_nfts ?? []).map(normalizeTracked).filter((row): row is TrackedNftRow => Boolean(row));
  const assets = (parsed.nft_assets ?? []).map(normalizeAsset).filter((row): row is NftAssetRow => Boolean(row));
  const trackedUnique = new Map(tracked.map((row) => [row.mint, row]));
  const assetUnique = new Map(assets.map((row) => [row.mint, row]));

  await writeNftDb({
    tracked_nfts: Array.from(trackedUnique.values()),
    nft_assets: Array.from(assetUnique.values()),
    queue_state: {
      queue: parsed.queue_state?.queue ?? [],
      processing: false,
      lastHeliusCallAt: parsed.queue_state?.lastHeliusCallAt ?? null,
      backoffUntil: parsed.queue_state?.backoffUntil ?? null,
      updatedAt: nowIso(),
    },
  });

  console.log("[NFT DB] Migration completed");
  console.log(`tracked_nfts migrated count: ${trackedUnique.size}`);
  console.log(`nft_assets migrated count: ${assetUnique.size}`);
  console.log("queue_state migrated or initialized");
  console.log(`duplicates skipped: ${(tracked.length - trackedUnique.size) + (assets.length - assetUnique.size)}`);
  console.log("errors: 0");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
