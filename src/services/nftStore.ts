import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { TARGET_NFTS, isPlaceholderMint, isValidMarket, type TargetNftCollectionConfig, type TrackedNftMarket } from "./trackedNftsConfig";
import type { NftAssetRow, NftIngestionDb, NormalizedNftAsset, TrackedNftRow, TrackedNftWithAsset } from "./nftTypes";

const EMPTY_QUEUE = { queue: [], processing: false, lastHeliusCallAt: null, backoffUntil: null, updatedAt: null };
const EMPTY_DB: NftIngestionDb = { tracked_nfts: [], nft_assets: [], queue_state: EMPTY_QUEUE };

function env() {
  return (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
}

function dbFilePath() {
  return resolve(process.cwd(), env().PERP_NFT_DB_PATH || "data/nft-ingestion.json");
}

function nowIso() {
  return new Date().toISOString();
}

function stableId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "unknown";
}

export function normalizeMint(mint: string): string {
  return mint.trim();
}

export function isProbablySolanaMint(mint: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint.trim());
}

function seedTargets(db: NftIngestionDb): NftIngestionDb {
  const rows = [...db.tracked_nfts];
  const existing = new Set(rows.map((row) => row.mint));
  const created = nowIso();
  for (const target of TARGET_NFTS) {
    if (isPlaceholderMint(target.mint) || existing.has(target.mint)) continue;
    rows.push({
      id: stableId(target.mint),
      mint: target.mint,
      market: target.market,
      label: target.label,
      active: true,
      created_at: created,
      updated_at: created,
      last_fetched_at: null,
    });
  }
  return { ...db, tracked_nfts: rows };
}

export async function readNftDb(): Promise<NftIngestionDb> {
  try {
    const raw = await readFile(dbFilePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<NftIngestionDb>;
    return seedTargets({
      tracked_nfts: parsed.tracked_nfts ?? [],
      nft_assets: parsed.nft_assets ?? [],
      queue_state: { ...EMPTY_QUEUE, ...(parsed.queue_state ?? {}) },
    });
  } catch {
    return seedTargets(EMPTY_DB);
  }
}

export async function writeNftDb(db: NftIngestionDb): Promise<void> {
  const file = dbFilePath();
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await rename(tmp, file);
}

export async function listTrackedNfts(): Promise<TrackedNftWithAsset[]> {
  const db = await readNftDb();
  const assets = new Map(db.nft_assets.map((asset) => [asset.mint, asset]));
  return db.tracked_nfts
    .map((row) => ({ ...row, asset: assets.get(row.mint) ?? null }))
    .sort((a, b) => a.market.localeCompare(b.market) || a.mint.localeCompare(b.mint));
}

export async function findTrackedNft(mint: string): Promise<TrackedNftRow | undefined> {
  const db = await readNftDb();
  return db.tracked_nfts.find((row) => row.mint === normalizeMint(mint));
}

export async function addTrackedNft(input: { mint: string; market: string; label?: string | null }): Promise<TrackedNftRow> {
  const mint = normalizeMint(input.mint);
  if (!mint) throw new Error("mint is required");
  if (!isProbablySolanaMint(mint)) throw new Error("invalid mint");
  if (!input.market || !isValidMarket(input.market)) throw new Error("market is required");

  const db = await readNftDb();
  const existing = db.tracked_nfts.find((row) => row.mint === mint);
  const timestamp = nowIso();
  if (existing) {
    if (existing.active) throw new Error("tracked NFT already exists");
    const updated = { ...existing, market: input.market as TrackedNftMarket, label: input.label ?? existing.label, active: true, updated_at: timestamp };
    await writeNftDb({ ...db, tracked_nfts: db.tracked_nfts.map((row) => row.mint === mint ? updated : row) });
    return updated;
  }

  const row: TrackedNftRow = {
    id: stableId(mint),
    mint,
    market: input.market,
    label: input.label?.trim() || null,
    active: true,
    created_at: timestamp,
    updated_at: timestamp,
    last_fetched_at: null,
  };
  await writeNftDb({ ...db, tracked_nfts: [...db.tracked_nfts, row] });
  return row;
}

export async function untrackNft(mintInput: string): Promise<TrackedNftRow> {
  const mint = normalizeMint(mintInput);
  const db = await readNftDb();
  const existing = db.tracked_nfts.find((row) => row.mint === mint);
  if (!existing) throw new Error("tracked NFT not found");
  const updated = { ...existing, active: false, updated_at: nowIso() };
  await writeNftDb({ ...db, tracked_nfts: db.tracked_nfts.map((row) => row.mint === mint ? updated : row) });
  return updated;
}

export async function saveNormalizedAsset(trackedNft: TrackedNftRow, asset: NormalizedNftAsset, rawHelius: unknown): Promise<NftAssetRow> {
  const db = await readNftDb();
  const timestamp = asset.updatedAt;
  const row: NftAssetRow = {
    id: stableId(asset.mint),
    mint: asset.mint,
    market: trackedNft.market,
    name: asset.name,
    description: asset.description,
    image: asset.image,
    owner: asset.owner,
    collection: asset.collection,
    attributes_json: asset.attributes,
    token_standard: asset.tokenStandard,
    interface: asset.interface,
    raw_helius_json: rawHelius,
    updated_at: timestamp,
  };
  const assets = db.nft_assets.filter((item) => item.mint !== asset.mint);
  const tracked = db.tracked_nfts.map((item) => item.mint === trackedNft.mint ? { ...item, last_fetched_at: timestamp, updated_at: timestamp } : item);
  await writeNftDb({ ...db, tracked_nfts: tracked, nft_assets: [...assets, row] });
  return row;
}

export async function saveCollectionAssets(
  collection: TargetNftCollectionConfig,
  assets: NormalizedNftAsset[],
  rawAssets: unknown[],
): Promise<{ savedAssets: number; totalAssets: number }> {
  const db = await readNftDb();
  const timestamp = nowIso();
  const rawByMint = new Map<string, unknown>();
  rawAssets.forEach((raw, index) => {
    const mint = assets[index]?.mint;
    if (mint) rawByMint.set(mint, raw);
  });

  const assetByMint = new Map(db.nft_assets.map((asset) => [asset.mint, asset]));
  const trackedByMint = new Map(db.tracked_nfts.map((tracked) => [tracked.mint, tracked]));
  let savedAssets = 0;

  for (const asset of assets) {
    if (!asset.mint) continue;
    savedAssets += 1;
    assetByMint.set(asset.mint, {
      id: stableId(asset.mint),
      mint: asset.mint,
      market: collection.market,
      name: asset.name,
      description: asset.description,
      image: asset.image,
      owner: asset.owner,
      collection: asset.collection ?? collection.collectionAddress,
      attributes_json: asset.attributes,
      token_standard: asset.tokenStandard,
      interface: asset.interface,
      raw_helius_json: rawByMint.get(asset.mint) ?? asset,
      updated_at: asset.updatedAt || timestamp,
    });

    const existingTracked = trackedByMint.get(asset.mint);
    trackedByMint.set(asset.mint, {
      id: existingTracked?.id ?? stableId(asset.mint),
      mint: asset.mint,
      market: collection.market,
      label: existingTracked?.label ?? asset.name ?? collection.label,
      active: true,
      created_at: existingTracked?.created_at ?? timestamp,
      updated_at: timestamp,
      last_fetched_at: asset.updatedAt || timestamp,
    });
  }

  await writeNftDb({
    ...db,
    tracked_nfts: Array.from(trackedByMint.values()),
    nft_assets: Array.from(assetByMint.values()),
  });

  return { savedAssets, totalAssets: assets.length };
}

export async function getStoredAsset(mintInput: string): Promise<NftAssetRow | null> {
  const mint = normalizeMint(mintInput);
  const db = await readNftDb();
  return db.nft_assets.find((asset) => asset.mint === mint) ?? null;
}

export async function updateQueueState(mutator: (db: NftIngestionDb) => NftIngestionDb | Promise<NftIngestionDb>): Promise<NftIngestionDb> {
  const db = await readNftDb();
  const next = await mutator(db);
  await writeNftDb({ ...next, queue_state: { ...next.queue_state, updatedAt: nowIso() } });
  return next;
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
