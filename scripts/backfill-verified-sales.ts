import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { parseHeliusEnhancedTransaction } from "../src/services/heliusEnhancedTransactionParser";
import { getAssetByMint, normalizeHeliusAsset } from "../src/services/heliusNftService";
import { ALLOWED_RWA_NFT_CATEGORIES, detectRwaNftCategory, isAllowedRwaNftCategory } from "../src/services/nftCategoryService";
import { nftDatabasePath } from "../src/services/nftSqliteDb";
import { addTrackedNft, findTrackedNft, getStoredAsset, saveNormalizedAsset } from "../src/services/nftStore";
import { saveRwaNftMarketEvent } from "../src/services/rwaNftMarketEventService";
import type { NftAssetRow, NormalizedNftAsset, TrackedNftRow } from "../src/services/nftTypes";
import type { RwaNftCategory, RwaNftMarketEvent } from "../src/types/rwaNftMarket";

const HELIUS_ENHANCED_TX_URL = "https://api.helius.xyz/v0/transactions/";
const HELIUS_RPC_URL = "https://mainnet.helius-rpc.com/";

type InputMode = "signatures" | "mints";
type CategorySource = "metadata" | "fallback_cli" | "unknown";
type ResultStatus = "accepted" | "rejected" | "saved" | "duplicate" | "error";
type RuntimeEnv = Record<string, string | undefined>;

type ParsedArgs = {
  file: string;
  mode: InputMode;
  dryRun: boolean;
  review: boolean;
  allowUnknown: boolean;
  skipBackup: boolean;
  maxTransactions: number;
  maxTransactionsPerMint: number;
  market: string | null;
};

type BackfillResult = {
  txSignature: string;
  status: ResultStatus;
  reason: string;
  mint?: string | null;
  nftName?: string | null;
  detectedCategory?: string | null;
  category?: string | null;
  categorySource?: CategorySource;
  buyer?: string | null;
  seller?: string | null;
  owner?: string | null;
  priceSol?: number | null;
  priceUsd?: number | null;
  paymentSymbol?: string | null;
  marketplace?: string | null;
  timestamp?: string | null;
  heliusType?: string | null;
  heliusSource?: string | null;
  warning?: string | null;
};

type MetadataResolution = {
  rawAsset: unknown | null;
  normalized: NormalizedNftAsset | null;
  storedAsset: NftAssetRow | null;
  nftName: string | null;
  detectedCategory: RwaNftCategory;
  category: RwaNftCategory;
  categorySource: CategorySource;
  warning: string | null;
};

function env(): RuntimeEnv {
  return (globalThis as unknown as { process?: { env?: RuntimeEnv } }).process?.env ?? {};
}

function arg(name: string) {
  const prefix = `${name}=`;
  const match = process.argv.slice(2).find((item) => item.startsWith(prefix));
  if (match) return match.slice(prefix.length);
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function boolArg(name: string, fallback: boolean) {
  const value = arg(name);
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
}

function numberArg(name: string, fallback: number) {
  const value = Number(arg(name));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function inferMode(file: string): InputMode {
  const name = basename(file).toLowerCase();
  if (name === "nft-mints.txt" || name.includes("mint")) return "mints";
  return "signatures";
}

function parseArgs(): ParsedArgs {
  const file = arg("--file")?.trim();
  if (!file) throw new Error("--file is required");

  const modeArg = arg("--mode")?.trim();
  const mode = modeArg === "mints" || modeArg === "signatures" ? modeArg : inferMode(file);
  const market = arg("--market")?.trim() || null;
  if (market && !ALLOWED_RWA_NFT_CATEGORIES.includes(market as never)) {
    throw new Error(`market is not allowed: ${market}. Allowed: ${ALLOWED_RWA_NFT_CATEGORIES.join(", ")}`);
  }

  return {
    file,
    mode,
    dryRun: boolArg("--dryRun", true),
    review: boolArg("--review", false),
    allowUnknown: boolArg("--allowUnknown", false),
    skipBackup: boolArg("--skipBackup", false),
    maxTransactions: Math.min(numberArg("--maxTransactions", 50), 50),
    maxTransactionsPerMint: Math.min(numberArg("--maxTransactionsPerMint", 5), 5),
    market,
  };
}

function readItems(file: string) {
  const seen = new Set<string>();
  return readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*\s]+/, "").trim())
    .filter(Boolean)
    .filter((line) => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    });
}

function requireApiKey() {
  const apiKey = env().HELIUS_API_KEY;
  if (!apiKey) throw new Error("Missing HELIUS_API_KEY");
  return apiKey;
}

async function fetchEnhancedTransactions(signatures: string[]) {
  if (!signatures.length) return [];
  const apiKey = requireApiKey();
  const response = await fetch(`${HELIUS_ENHANCED_TX_URL}?api-key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ transactions: signatures }),
  });

  if (!response.ok) throw new Error(`Helius Enhanced Transactions failed: ${response.status} ${response.statusText}`);
  const payload = await response.json() as unknown;
  return Array.isArray(payload) ? payload : [];
}

async function fetchRecentSignaturesForMint(mint: string, limit: number) {
  const apiKey = requireApiKey();
  const response = await fetch(`${HELIUS_RPC_URL}?api-key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "get-signatures-for-mint",
      method: "getSignaturesForAddress",
      params: [mint, { limit }],
    }),
  });

  if (!response.ok) throw new Error(`Helius RPC getSignaturesForAddress failed: ${response.status} ${response.statusText}`);
  const payload = await response.json() as { result?: Array<{ signature?: string }> };
  return (payload.result ?? []).map((row) => row.signature).filter((value): value is string => Boolean(value));
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function paymentSymbolForSale(sale: { priceSol: number | null; priceUsd: number | null }) {
  if (sale.priceUsd !== null && sale.priceUsd !== undefined) return "USDC/USD";
  if (sale.priceSol !== null && sale.priceSol !== undefined) return "SOL";
  return null;
}

function timestampSlug(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
}

function short(value: string | null | undefined) {
  if (!value) return "";
  return value.length <= 14 ? value : `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function dataDir() {
  return dirname(nftDatabasePath());
}

function reportPath(slug: string) {
  const directory = join(dataDir(), "backfill-reports");
  mkdirSync(directory, { recursive: true });
  return join(directory, `verified-sales-backfill-${slug}.json`);
}

function backupSqliteIfNeeded(args: ParsedArgs, slug: string) {
  if (args.dryRun || args.skipBackup) return null;
  const databasePath = nftDatabasePath();
  if (!existsSync(databasePath)) return null;
  const backupPath = join(dataDir(), `perp-rwa.backup-before-backfill-${slug}.sqlite`);
  copyFileSync(databasePath, backupPath);
  console.log(`[RWA BACKFILL] SQLite backup created: ${backupPath}`);
  return backupPath;
}

function detectCategoryFromNormalized(asset: NormalizedNftAsset | null, storedAsset: NftAssetRow | null): RwaNftCategory {
  if (asset) {
    return detectRwaNftCategory({
      name: asset.name,
      description: asset.description,
      collection: asset.collection,
      attributes: asset.attributes,
    });
  }

  if (storedAsset) {
    return detectRwaNftCategory({
      name: storedAsset.name,
      description: storedAsset.description,
      collection: storedAsset.collection,
      attributes_json: storedAsset.attributes_json,
    });
  }

  return "unknown";
}

async function resolveMetadata(mint: string, args: ParsedArgs, cache: Map<string, MetadataResolution>): Promise<MetadataResolution> {
  const cached = cache.get(mint);
  if (cached) return cached;

  const storedAsset = await getStoredAsset(mint);
  let rawAsset: unknown | null = null;
  let normalized: NormalizedNftAsset | null = null;

  try {
    rawAsset = await getAssetByMint(mint);
    normalized = normalizeHeliusAsset(rawAsset, args.market ?? storedAsset?.market ?? "unknown");
  } catch (error) {
    if (!storedAsset) throw error;
  }

  const detectedCategory = detectCategoryFromNormalized(normalized, storedAsset);
  let category: RwaNftCategory = "unknown";
  let categorySource: CategorySource = "unknown";
  let warning: string | null = null;

  if (isAllowedRwaNftCategory(detectedCategory)) {
    category = detectedCategory;
    categorySource = "metadata";
    if (args.market && args.market !== detectedCategory) {
      warning = "Detected category differs from CLI fallback market.";
      console.warn(`[RWA BACKFILL] ${warning} tx mint=${mint} detected=${detectedCategory} cli=${args.market}`);
    }
  } else if (args.market) {
    category = args.market as RwaNftCategory;
    categorySource = "fallback_cli";
  } else if (args.allowUnknown) {
    category = "unknown";
    categorySource = "unknown";
  }

  const result = {
    rawAsset,
    normalized,
    storedAsset,
    nftName: normalized?.name ?? storedAsset?.name ?? null,
    detectedCategory,
    category,
    categorySource,
    warning,
  };
  cache.set(mint, result);
  return result;
}

function validateParsedSale(tx: unknown): { event: RwaNftMarketEvent | null; result: BackfillResult } {
  const txRow = record(tx);
  const signature = String(txRow.signature ?? "");
  const parsedSales = parseHeliusEnhancedTransaction(tx).filter((event) => event.eventType === "SALE");
  if (!parsedSales.length) {
    return {
      event: null,
      result: {
        txSignature: signature,
        status: "rejected",
        reason: "no clear SALE event detected by parser",
        heliusType: String(txRow.type ?? "") || null,
        heliusSource: String(txRow.source ?? "") || null,
      },
    };
  }

  const sale = parsedSales[0];
  const missing: string[] = [];
  if (!sale.mint) missing.push("mint");
  if (!sale.txSignature) missing.push("txSignature");
  if (!sale.buyer) missing.push("buyer");
  if (!sale.seller) missing.push("seller");
  if (!sale.eventAt) missing.push("timestamp");
  if (sale.priceSol === null && sale.priceUsd === null) missing.push("price");

  const base = {
    txSignature: sale.txSignature ?? signature,
    mint: sale.mint,
    buyer: sale.buyer,
    seller: sale.seller,
    owner: sale.owner,
    priceSol: sale.priceSol,
    priceUsd: sale.priceUsd,
    paymentSymbol: paymentSymbolForSale(sale),
    marketplace: sale.marketplace,
    timestamp: sale.eventAt,
    heliusType: String(txRow.type ?? "") || null,
    heliusSource: String(txRow.source ?? "") || null,
  };

  if (missing.length) {
    return {
      event: null,
      result: { ...base, status: "rejected", reason: `uncertain SALE event, missing ${missing.join(", ")}` },
    };
  }

  return {
    event: { ...sale, rawPayload: tx },
    result: { ...base, status: "accepted", reason: "clear SALE event detected" },
  };
}

async function collectSignatures(args: ParsedArgs, items: string[]) {
  if (args.mode === "signatures") return items.slice(0, args.maxTransactions);

  const signatures: string[] = [];
  const seen = new Set<string>();
  for (const mint of items) {
    if (signatures.length >= args.maxTransactions) break;
    console.log(`[RWA BACKFILL] Fetching recent signatures for mint: ${mint}`);
    const mintSignatures = await fetchRecentSignaturesForMint(mint, args.maxTransactionsPerMint);
    for (const signature of mintSignatures) {
      if (seen.has(signature)) continue;
      seen.add(signature);
      signatures.push(signature);
      if (signatures.length >= args.maxTransactions) break;
    }
  }
  return signatures;
}

async function ensureAssetForSave(event: RwaNftMarketEvent, metadata: MetadataResolution): Promise<NftAssetRow> {
  const category = metadata.category;
  if (!isAllowedRwaNftCategory(category)) throw new Error("unknown category");

  const existingTracked = await findTrackedNft(event.mint);
  const timestamp = new Date().toISOString();
  let tracked: TrackedNftRow;

  if (existingTracked) {
    tracked = {
      ...existingTracked,
      market: metadata.categorySource === "metadata" ? category : existingTracked.market,
      updated_at: timestamp,
    };
  } else {
    tracked = await addTrackedNft({
      mint: event.mint,
      market: category,
      label: metadata.nftName ?? "Backfilled verified sale NFT",
    });
  }

  if (metadata.normalized) {
    const saved = await saveNormalizedAsset(tracked, { ...metadata.normalized, market: category }, metadata.rawAsset);
    if (metadata.categorySource === "fallback_cli" && metadata.storedAsset && isAllowedRwaNftCategory(metadata.storedAsset.category)) {
      return metadata.storedAsset;
    }
    return saved;
  }

  const storedAsset = metadata.storedAsset ?? await getStoredAsset(event.mint);
  if (!storedAsset) throw new Error("NFT metadata not available");
  return storedAsset;
}

async function maybeSave(event: RwaNftMarketEvent | null, result: BackfillResult, metadata: MetadataResolution | null, args: ParsedArgs): Promise<BackfillResult> {
  if (args.dryRun || result.status !== "accepted" || !event || !metadata) return result;

  try {
    await ensureAssetForSave(event, metadata);
    const saved = await saveRwaNftMarketEvent({
      ...event,
      category: metadata.category,
      source: "helius_enhanced_tx",
    });

    if (saved.saved) return { ...result, status: "saved", reason: "saved to rwa_nft_events" };
    if (saved.reason === "duplicate") return { ...result, status: "duplicate", reason: "duplicate tx_signature + event_type skipped" };
    return { ...result, status: "error", reason: saved.reason };
  } catch (error) {
    return {
      ...result,
      status: "error",
      reason: error instanceof Error ? error.message : "save failed",
    };
  }
}

function reviewRows(results: BackfillResult[]) {
  return results.map((row) => ({
    tx: short(row.txSignature),
    mint: short(row.mint),
    name: row.nftName ?? "",
    category: row.category ?? row.detectedCategory ?? "",
    categorySource: row.categorySource ?? "",
    price: row.priceSol !== null && row.priceSol !== undefined ? row.priceSol : row.priceUsd ?? "",
    payment: row.paymentSymbol ?? "",
    buyer: short(row.buyer),
    seller: short(row.seller),
    marketplace: row.marketplace ?? "",
    status: row.status,
    reason: row.reason,
  }));
}

function countBy<T extends string>(values: T[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value || "unknown"] = (counts[value || "unknown"] ?? 0) + 1;
    return counts;
  }, {});
}

function writeReport(args: ParsedArgs, slug: string, results: BackfillResult[], backupPath: string | null, inputCount: number, checkedCount: number) {
  const accepted = results.filter((row) => row.status === "accepted" || row.status === "saved" || row.status === "duplicate");
  const rejected = results.filter((row) => row.status === "rejected" || row.status === "error");
  const report = {
    inputFile: args.file,
    mode: args.mode,
    dryRun: args.dryRun,
    review: args.review,
    totalSignatures: checkedCount,
    acceptedCount: accepted.length,
    savedCount: results.filter((row) => row.status === "saved").length,
    skippedDuplicates: results.filter((row) => row.status === "duplicate").length,
    rejectedCount: rejected.length,
    rejectedReasons: countBy(rejected.map((row) => row.reason)),
    categoryCounts: countBy(accepted.map((row) => row.category ?? row.detectedCategory ?? "unknown")),
    paymentSymbolCounts: countBy(accepted.map((row) => row.paymentSymbol ?? "unknown")),
    backupPath,
    acceptedSales: accepted,
    rejectedTransactions: rejected,
  };
  const path = reportPath(slug);
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`[RWA BACKFILL] Report written: ${path}`);
  return { path, report };
}

async function main() {
  const args = parseArgs();
  const slug = timestampSlug();
  const items = readItems(args.file);
  const signatures = await collectSignatures(args, items);
  const cappedSignatures = signatures.slice(0, args.maxTransactions);
  const txRows = await fetchEnhancedTransactions(cappedSignatures);
  const txRowsBySignature = new Map(txRows.map((row) => [String(record(row).signature ?? ""), row]));
  const metadataCache = new Map<string, MetadataResolution>();
  const results: BackfillResult[] = [];

  const backupPath = backupSqliteIfNeeded(args, slug);

  for (const signature of cappedSignatures) {
    const tx = txRowsBySignature.get(signature);
    if (!tx) {
      results.push({ txSignature: signature, status: "rejected", reason: "Helius returned no transaction" });
      continue;
    }

    const { event, result } = validateParsedSale(tx);
    if (!event || result.status !== "accepted" || !result.mint) {
      results.push(result);
      continue;
    }

    let metadata: MetadataResolution | null = null;
    try {
      metadata = await resolveMetadata(result.mint, args, metadataCache);
      result.nftName = metadata.nftName;
      result.detectedCategory = metadata.detectedCategory;
      result.category = metadata.category;
      result.categorySource = metadata.categorySource;
      result.warning = metadata.warning;

      if (!isAllowedRwaNftCategory(metadata.category)) {
        results.push({
          ...result,
          status: "rejected",
          reason: args.allowUnknown ? "unknown category cannot be shown on Verified Sales" : "unknown category",
        });
        continue;
      }
    } catch (error) {
      results.push({
        ...result,
        status: "rejected",
        reason: `metadata unavailable: ${error instanceof Error ? error.message : "unknown error"}`,
      });
      continue;
    }

    results.push(await maybeSave(event, result, metadata, args));
  }

  const summary = {
    mode: args.mode,
    dryRun: args.dryRun,
    review: args.review,
    inputItems: items.length,
    checkedTransactions: cappedSignatures.length,
    accepted: results.filter((row) => row.status === "accepted").length,
    rejected: results.filter((row) => row.status === "rejected").length,
    saved: results.filter((row) => row.status === "saved").length,
    skippedDuplicates: results.filter((row) => row.status === "duplicate").length,
    errors: results.filter((row) => row.status === "error").length,
  };

  if (args.review) console.table(reviewRows(results));
  const { path } = writeReport(args, slug, results, backupPath, items.length, cappedSignatures.length);
  console.log(JSON.stringify({ summary, reportPath: path, results }, null, 2));
  if (!args.dryRun && summary.errors > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`[RWA BACKFILL] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
