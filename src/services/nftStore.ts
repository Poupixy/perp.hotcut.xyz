import { TARGET_NFTS, isPlaceholderMint, isValidMarket, type TargetNftCollectionConfig, type TrackedNftMarket } from "./trackedNftsConfig";
import type { NftAssetRow, NftIngestionDb, NftQueueState, NormalizedNftAsset, TrackedNftRow, TrackedNftWithAsset } from "./nftTypes";
import { detectRwaNftCategory } from "./nftCategoryService";
import { fromSqliteBool, getNftDb, parseJson, shouldStoreRawHeliusJson, sqliteBool, stringifyJson } from "./nftSqliteDb";

const EMPTY_QUEUE: NftQueueState = { queue: [], processing: false, lastHeliusCallAt: null, backoffUntil: null, updatedAt: null };

function nowIso() {
  return new Date().toISOString();
}

function stableId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "unknown";
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function rowMarket(value: unknown): TrackedNftMarket {
  return typeof value === "string" && isValidMarket(value) ? value : "pokemon";
}

function rowToTracked(row: Record<string, unknown>): TrackedNftRow {
  return {
    id: String(row.id),
    mint: String(row.mint),
    market: rowMarket(row.market),
    label: asString(row.label),
    active: fromSqliteBool(row.active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    last_fetched_at: asString(row.last_fetched_at),
  };
}

function rowToAsset(row: Record<string, unknown>): NftAssetRow {
  return {
    id: String(row.id),
    mint: String(row.mint),
    market: String(row.market),
    name: asString(row.name),
    description: asString(row.description),
    image: asString(row.image),
    owner: asString(row.owner),
    collection: asString(row.collection),
    category: asString(row.category),
    attributes_json: parseJson<unknown[]>(row.attributes_json, []),
    token_standard: asString(row.token_standard),
    interface: asString(row.interface),
    source_collection: asString(row.source_collection),
    is_staging: fromSqliteBool(row.is_staging),
    is_listed: fromSqliteBool(row.is_listed),
    listed_price_sol: asNumber(row.listed_price_sol),
    listed_price_usd: asNumber(row.listed_price_usd),
    listing_marketplace: asString(row.listing_marketplace),
    listing_updated_at: asString(row.listing_updated_at),
    last_sale_price_sol: asNumber(row.last_sale_price_sol),
    last_sale_price_usd: asNumber(row.last_sale_price_usd),
    last_sale_at: asString(row.last_sale_at),
    last_sale_marketplace: asString(row.last_sale_marketplace),
    last_sale_tx_signature: asString(row.last_sale_tx_signature),
    floor_price_sol: asNumber(row.floor_price_sol),
    market_updated_at: asString(row.market_updated_at),
    raw_helius_json: parseJson(row.raw_helius_json, null),
    updated_at: String(row.updated_at),
    created_at: asString(row.created_at) ?? undefined,
  };
}

function rowToQueue(row: Record<string, unknown> | undefined): NftQueueState {
  if (!row) return EMPTY_QUEUE;
  return {
    queue: parseJson<string[]>(row.queue_json, []),
    processing: fromSqliteBool(row.processing),
    lastHeliusCallAt: asString(row.last_helius_call_at),
    backoffUntil: asString(row.backoff_until),
    updatedAt: asString(row.updated_at),
    ingestionRunning: fromSqliteBool(row.ingestion_running),
    ingestionCurrentCollection: asString(row.ingestion_current_collection),
    ingestionCurrentPage: asNumber(row.ingestion_current_page),
    ingestionInserted: asNumber(row.ingestion_inserted) ?? 0,
    ingestionUpdated: asNumber(row.ingestion_updated) ?? 0,
    ingestionDuplicatesSkipped: asNumber(row.ingestion_duplicates_skipped) ?? 0,
    ingestionLastError: asString(row.ingestion_last_error),
    latestIngestionReportPath: asString(row.latest_ingestion_report_path),
    latestUniverseComparisonReportPath: asString(row.latest_universe_comparison_report_path),
  };
}

function isStagingAsset(asset: Pick<NftAssetRow, "name" | "collection" | "source_collection">) {
  return [asset.name, asset.collection, asset.source_collection].some((value) => String(value ?? "").toLowerCase().includes("staging"));
}

function assetCategory(asset: NormalizedNftAsset, raw?: unknown) {
  if (asset.category && asset.category !== "unknown") return asset.category;
  const detected = detectRwaNftCategory({
    name: asset.name,
    description: asset.description,
    collection: asset.collection,
    attributes: asset.attributes,
    attributes_json: Array.isArray(raw) ? raw : asset.attributes,
  });
  if (detected !== "unknown") return detected;
  return isValidMarket(asset.market) ? asset.market : "unknown";
}

function upsertTracked(row: TrackedNftRow) {
  getNftDb().prepare(`
    INSERT INTO tracked_nfts (id, mint, market, label, active, created_at, updated_at, last_fetched_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(mint) DO UPDATE SET
      market = excluded.market,
      label = COALESCE(excluded.label, tracked_nfts.label),
      active = excluded.active,
      updated_at = excluded.updated_at,
      last_fetched_at = COALESCE(excluded.last_fetched_at, tracked_nfts.last_fetched_at)
  `).run(row.id, row.mint, row.market, row.label, sqliteBool(row.active), row.created_at, row.updated_at, row.last_fetched_at);
}

function upsertAsset(row: NftAssetRow) {
  getNftDb().prepare(`
    INSERT INTO nft_assets (
      id, mint, market, name, description, image, owner, collection, category, attributes_json,
      token_standard, interface, source_collection, is_staging, raw_helius_json, is_listed,
      listed_price_sol, listed_price_usd, listing_marketplace, listing_updated_at,
      last_sale_price_sol, last_sale_price_usd, last_sale_at, last_sale_marketplace, last_sale_tx_signature,
      floor_price_sol, market_updated_at, updated_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(mint) DO UPDATE SET
      market = excluded.market,
      name = excluded.name,
      description = excluded.description,
      image = excluded.image,
      owner = excluded.owner,
      collection = excluded.collection,
      category = excluded.category,
      attributes_json = excluded.attributes_json,
      token_standard = excluded.token_standard,
      interface = excluded.interface,
      source_collection = excluded.source_collection,
      is_staging = excluded.is_staging,
      raw_helius_json = excluded.raw_helius_json,
      updated_at = excluded.updated_at
  `).run(
    row.id,
    row.mint,
    row.market,
    row.name,
    row.description,
    row.image,
    row.owner,
    row.collection,
    row.category,
    stringifyJson(row.attributes_json),
    row.token_standard,
    row.interface,
    row.source_collection,
    sqliteBool(row.is_staging),
    shouldStoreRawHeliusJson() ? stringifyJson(row.raw_helius_json) : null,
    sqliteBool(row.is_listed),
    row.listed_price_sol,
    row.listed_price_usd,
    row.listing_marketplace,
    row.listing_updated_at,
    row.last_sale_price_sol,
    row.last_sale_price_usd,
    row.last_sale_at,
    row.last_sale_marketplace,
    row.last_sale_tx_signature,
    row.floor_price_sol,
    row.market_updated_at,
    row.updated_at,
    row.created_at ?? row.updated_at,
  );
}

function seedTargets() {
  const timestamp = nowIso();
  for (const target of TARGET_NFTS) {
    if (isPlaceholderMint(target.mint)) continue;
    upsertTracked({
      id: stableId(target.mint),
      mint: target.mint,
      market: target.market,
      label: target.label,
      active: true,
      created_at: timestamp,
      updated_at: timestamp,
      last_fetched_at: null,
    });
  }
}

function setQueueState(queue: NftQueueState) {
  getNftDb().prepare(`
    INSERT INTO queue_state (id, queue_json, processing, last_helius_call_at, backoff_until, updated_at)
    VALUES ('default', ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      queue_json = excluded.queue_json,
      processing = excluded.processing,
      last_helius_call_at = excluded.last_helius_call_at,
      backoff_until = excluded.backoff_until,
      updated_at = excluded.updated_at
  `).run(stringifyJson(queue.queue), sqliteBool(queue.processing), queue.lastHeliusCallAt, queue.backoffUntil, queue.updatedAt);
}

export function normalizeMint(mint: string): string {
  return mint.trim();
}

export function isProbablySolanaMint(mint: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint.trim());
}

export async function readNftDb(): Promise<NftIngestionDb> {
  seedTargets();
  const database = getNftDb();
  const tracked = database.prepare("SELECT * FROM tracked_nfts ORDER BY market, mint").all().map(rowToTracked);
  const assets = database.prepare("SELECT * FROM nft_assets ORDER BY updated_at DESC, mint").all().map(rowToAsset);
  const queue = rowToQueue(database.prepare("SELECT * FROM queue_state WHERE id = 'default'").get());
  return { tracked_nfts: tracked, nft_assets: assets, queue_state: queue };
}

export async function writeNftDb(db: NftIngestionDb): Promise<void> {
  for (const tracked of db.tracked_nfts) upsertTracked(tracked);
  for (const asset of db.nft_assets) upsertAsset(asset);
  setQueueState({ ...db.queue_state, updatedAt: db.queue_state.updatedAt ?? nowIso() });
}

export async function listTrackedNfts(): Promise<TrackedNftWithAsset[]> {
  const db = await readNftDb();
  const assets = new Map(db.nft_assets.map((asset) => [asset.mint, asset]));
  return db.tracked_nfts
    .map((row) => ({ ...row, asset: assets.get(row.mint) ?? null }))
    .sort((a, b) => a.market.localeCompare(b.market) || a.mint.localeCompare(b.mint));
}

export async function findTrackedNft(mint: string): Promise<TrackedNftRow | undefined> {
  const row = getNftDb().prepare("SELECT * FROM tracked_nfts WHERE mint = ?").get(normalizeMint(mint));
  return row ? rowToTracked(row) : undefined;
}

export async function addTrackedNft(input: { mint: string; market: string; label?: string | null }): Promise<TrackedNftRow> {
  const mint = normalizeMint(input.mint);
  if (!mint) throw new Error("mint is required");
  if (!isProbablySolanaMint(mint)) throw new Error("invalid mint");
  if (!input.market || !isValidMarket(input.market)) throw new Error("market is required");

  const existing = await findTrackedNft(mint);
  const timestamp = nowIso();
  if (existing?.active) throw new Error("tracked NFT already exists");

  const row: TrackedNftRow = {
    id: existing?.id ?? stableId(mint),
    mint,
    market: input.market,
    label: input.label?.trim() || existing?.label || null,
    active: true,
    created_at: existing?.created_at ?? timestamp,
    updated_at: timestamp,
    last_fetched_at: existing?.last_fetched_at ?? null,
  };
  upsertTracked(row);
  return row;
}

export async function untrackNft(mintInput: string): Promise<TrackedNftRow> {
  const mint = normalizeMint(mintInput);
  const existing = await findTrackedNft(mint);
  if (!existing) throw new Error("tracked NFT not found");
  const updated = { ...existing, active: false, updated_at: nowIso() };
  upsertTracked(updated);
  return updated;
}

export async function saveNormalizedAsset(trackedNft: TrackedNftRow, asset: NormalizedNftAsset, rawHelius: unknown): Promise<NftAssetRow> {
  const timestamp = asset.updatedAt || nowIso();
  const row: NftAssetRow = {
    id: stableId(asset.mint),
    mint: asset.mint,
    market: trackedNft.market,
    name: asset.name,
    description: asset.description,
    image: asset.image,
    owner: asset.owner,
    collection: asset.collection,
    category: assetCategory(asset, rawHelius),
    attributes_json: asset.attributes,
    token_standard: asset.tokenStandard,
    interface: asset.interface,
    source_collection: asset.collection,
    is_staging: isStagingAsset({ name: asset.name, collection: asset.collection, source_collection: asset.collection }),
    is_listed: false,
    listed_price_sol: null,
    listed_price_usd: null,
    listing_marketplace: null,
    listing_updated_at: null,
    last_sale_price_sol: null,
    last_sale_price_usd: null,
    last_sale_at: null,
    last_sale_marketplace: null,
    last_sale_tx_signature: null,
    floor_price_sol: null,
    market_updated_at: null,
    raw_helius_json: rawHelius,
    updated_at: timestamp,
    created_at: timestamp,
  };
  upsertAsset(row);
  upsertTracked({ ...trackedNft, last_fetched_at: timestamp, updated_at: timestamp });
  console.log(`[NFT INGESTION] Saved NFT asset: ${asset.mint}`);
  return row;
}

export async function saveCollectionAssets(
  collection: TargetNftCollectionConfig,
  assets: NormalizedNftAsset[],
  rawAssets: unknown[],
): Promise<{ savedAssets: number; totalAssets: number }> {
  const timestamp = nowIso();
  const rawByMint = new Map<string, unknown>();
  rawAssets.forEach((raw, index) => {
    const mint = assets[index]?.mint;
    if (mint) rawByMint.set(mint, raw);
  });

  let savedAssets = 0;
  for (const asset of assets) {
    if (!asset.mint) continue;
    const raw = rawByMint.get(asset.mint) ?? asset;
    const category = assetCategory(asset, raw);
    const sourceCollection = asset.collection ?? collection.collectionAddress;
    const row: NftAssetRow = {
      id: stableId(asset.mint),
      mint: asset.mint,
      market: asset.market,
      name: asset.name,
      description: asset.description,
      image: asset.image,
      owner: asset.owner,
      collection: sourceCollection,
      category,
      attributes_json: asset.attributes,
      token_standard: asset.tokenStandard,
      interface: asset.interface,
      source_collection: collection.collectionAddress,
      is_staging: isStagingAsset({ name: asset.name, collection: sourceCollection, source_collection: collection.label }),
      is_listed: false,
      listed_price_sol: null,
      listed_price_usd: null,
      listing_marketplace: null,
      listing_updated_at: null,
      last_sale_price_sol: null,
      last_sale_price_usd: null,
      last_sale_at: null,
      last_sale_marketplace: null,
      last_sale_tx_signature: null,
      floor_price_sol: null,
      market_updated_at: null,
      raw_helius_json: raw,
      updated_at: asset.updatedAt || timestamp,
      created_at: timestamp,
    };
    upsertAsset(row);
    upsertTracked({
      id: stableId(asset.mint),
      mint: asset.mint,
      market: asset.market as TrackedNftMarket,
      label: asset.name ?? collection.label,
      active: true,
      created_at: timestamp,
      updated_at: timestamp,
      last_fetched_at: asset.updatedAt || timestamp,
    });
    savedAssets += 1;
    console.log(`[NFT INGESTION] Saved NFT asset: ${asset.mint}`);
  }

  return { savedAssets, totalAssets: assets.length };
}

export async function getStoredAsset(mintInput: string): Promise<NftAssetRow | null> {
  const row = getNftDb().prepare("SELECT * FROM nft_assets WHERE mint = ?").get(normalizeMint(mintInput));
  return row ? rowToAsset(row) : null;
}

export async function updateQueueState(mutator: (db: NftIngestionDb) => NftIngestionDb | Promise<NftIngestionDb>): Promise<NftIngestionDb> {
  const db = await readNftDb();
  const next = await mutator(db);
  const queueState = { ...next.queue_state, updatedAt: nowIso() };
  setQueueState(queueState);
  return { ...next, queue_state: queueState };
}

export async function enqueueTrackedMints(mints: string[]): Promise<string[]> {
  const normalized = mints.map(normalizeMint).filter(Boolean);
  const db = await updateQueueState((current) => {
    const allowed = new Set(current.tracked_nfts.filter((row) => row.active).map((row) => row.mint));
    const queue = [...current.queue_state.queue];
    for (const mint of normalized) {
      if (allowed.has(mint) && !queue.includes(mint)) queue.push(mint);
    }
    return { ...current, queue_state: { ...current.queue_state, queue } };
  });
  return db.queue_state.queue;
}
