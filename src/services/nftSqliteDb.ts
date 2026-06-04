import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

type RuntimeEnv = Record<string, string | undefined>;

let db: DatabaseSync | null = null;

function env(): RuntimeEnv {
  return (globalThis as unknown as { process?: { env?: RuntimeEnv } }).process?.env ?? {};
}

export function nftDatabasePath() {
  return resolve(process.cwd(), env().NFT_SQLITE_DB_PATH || "data/perp-rwa.sqlite");
}

export function shouldStoreRawHeliusJson() {
  return env().STORE_RAW_HELIUS_JSON === "true";
}

export function getNftDb() {
  if (db) return db;
  const file = nftDatabasePath();
  mkdirSync(dirname(file), { recursive: true });
  console.log(`[NFT DB] Initializing persistent database: ${file}`);
  db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  runNftMigrations(db);
  return db;
}

function runNftMigrations(database: DatabaseSync) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS tracked_nfts (
      id TEXT PRIMARY KEY,
      mint TEXT UNIQUE NOT NULL,
      market TEXT NOT NULL,
      label TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_fetched_at TEXT
    );

    CREATE TABLE IF NOT EXISTS nft_assets (
      id TEXT PRIMARY KEY,
      mint TEXT UNIQUE NOT NULL,
      market TEXT NOT NULL,
      name TEXT,
      description TEXT,
      image TEXT,
      owner TEXT,
      collection TEXT,
      category TEXT,
      attributes_json TEXT,
      token_standard TEXT,
      interface TEXT,
      source_collection TEXT,
      is_staging INTEGER NOT NULL DEFAULT 0,
      raw_helius_json TEXT,
      is_listed INTEGER NOT NULL DEFAULT 0,
      listed_price_sol REAL,
      listed_price_usd REAL,
      listing_marketplace TEXT,
      listing_updated_at TEXT,
      last_sale_price_sol REAL,
      last_sale_price_usd REAL,
      last_sale_at TEXT,
      last_sale_marketplace TEXT,
      last_sale_tx_signature TEXT,
      floor_price_sol REAL,
      market_updated_at TEXT,
      updated_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS queue_state (
      id TEXT PRIMARY KEY,
      queue_json TEXT NOT NULL DEFAULT '[]',
      processing INTEGER NOT NULL DEFAULT 0,
      last_helius_call_at TEXT,
      backoff_until TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS rwa_nft_events (
      id TEXT PRIMARY KEY,
      mint TEXT NOT NULL,
      category TEXT,
      event_type TEXT NOT NULL,
      price_sol REAL,
      price_usd REAL,
      marketplace TEXT,
      tx_signature TEXT,
      buyer TEXT,
      seller TEXT,
      owner TEXT,
      event_at TEXT NOT NULL,
      source TEXT NOT NULL,
      raw_payload_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tracked_nfts_mint ON tracked_nfts(mint);
    CREATE INDEX IF NOT EXISTS idx_nft_assets_mint ON nft_assets(mint);
    CREATE INDEX IF NOT EXISTS idx_nft_assets_market ON nft_assets(market);
    CREATE INDEX IF NOT EXISTS idx_nft_assets_category ON nft_assets(category);
    CREATE INDEX IF NOT EXISTS idx_nft_assets_collection ON nft_assets(collection);
    CREATE INDEX IF NOT EXISTS idx_nft_assets_is_staging ON nft_assets(is_staging);
    CREATE INDEX IF NOT EXISTS idx_rwa_nft_events_mint ON rwa_nft_events(mint);
    CREATE INDEX IF NOT EXISTS idx_rwa_nft_events_event_type ON rwa_nft_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_rwa_nft_events_category ON rwa_nft_events(category);
    CREATE INDEX IF NOT EXISTS idx_rwa_nft_events_event_at ON rwa_nft_events(event_at);
    CREATE INDEX IF NOT EXISTS idx_rwa_nft_events_tx_signature ON rwa_nft_events(tx_signature);
    CREATE INDEX IF NOT EXISTS idx_rwa_nft_events_marketplace ON rwa_nft_events(marketplace);
    CREATE INDEX IF NOT EXISTS idx_rwa_nft_events_source ON rwa_nft_events(source);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_rwa_events_tx_type_unique
      ON rwa_nft_events(tx_signature, event_type)
      WHERE tx_signature IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_rwa_events_fallback_unique
      ON rwa_nft_events(mint, event_type, event_at, COALESCE(price_sol, -1), COALESCE(marketplace, ''))
      WHERE tx_signature IS NULL;
  `);

  database.prepare(`
    INSERT OR IGNORE INTO queue_state (id, queue_json, processing, updated_at)
    VALUES ('default', '[]', 0, ?)
  `).run(new Date().toISOString());
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function stringifyJson(value: unknown) {
  return JSON.stringify(value ?? null);
}

export function sqliteBool(value: unknown) {
  return value ? 1 : 0;
}

export function fromSqliteBool(value: unknown) {
  return Boolean(value);
}
