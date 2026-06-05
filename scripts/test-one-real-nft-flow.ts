import { ALLOWED_RWA_NFT_CATEGORIES } from "../src/services/nftCategoryService";
import { getNftDb } from "../src/services/nftSqliteDb";
import { addTrackedNft, findTrackedNft, getStoredAsset } from "../src/services/nftStore";
import { refreshMint } from "../src/services/rateLimitedNftQueue";
import { isValidMarket } from "../src/services/trackedNftsConfig";
import { getVerifiedSales, saveRwaNftMarketEvent } from "../src/services/rwaNftMarketEventService";
import type { NftAssetRow, RefreshResult, TrackedNftRow } from "../src/services/nftTypes";

type Counts = {
  trackedNfts: number;
  nftAssets: number;
  rwaNftEvents: number;
  saleEvents: number;
  visibleVerifiedSales: number;
};

function arg(name: string) {
  const prefix = `${name}=`;
  const match = process.argv.slice(2).find((item) => item.startsWith(prefix));
  if (match) return match.slice(prefix.length);
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function requiredArg(name: string) {
  const value = arg(name);
  if (!value?.trim()) throw new Error(`${name} is required`);
  return value.trim();
}

function numberArg(name: string, required = false) {
  const value = arg(name);
  if (!value?.trim()) {
    if (required) throw new Error(`${name} is required`);
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${name} must be a valid number`);
  return parsed;
}

function scalar(sql: string, ...params: unknown[]) {
  const row = getNftDb().prepare(sql).get(...params);
  return Number(row?.count ?? 0);
}

function loadAsset(mint: string) {
  return getNftDb().prepare("SELECT * FROM nft_assets WHERE mint = ?").get(mint) as Record<string, unknown> | undefined;
}

function loadSaleEvent(tx: string) {
  return getNftDb().prepare("SELECT * FROM rwa_nft_events WHERE tx_signature = ? AND event_type = 'SALE'").get(tx) as Record<string, unknown> | undefined;
}

function allowedPlaceholders() {
  return ALLOWED_RWA_NFT_CATEGORIES.map(() => "?").join(", ");
}

function visibleVerifiedSalesCount() {
  return scalar(`
    SELECT COUNT(*) AS count
    FROM rwa_nft_events events
    JOIN nft_assets assets ON assets.mint = events.mint
    WHERE events.event_type = 'SALE'
      AND events.tx_signature IS NOT NULL
      AND events.category IS NOT NULL
      AND events.category != 'unknown'
      AND events.category IN (${allowedPlaceholders()})
      AND assets.is_staging = 0
  `, ...ALLOWED_RWA_NFT_CATEGORIES);
}

async function counts(): Promise<Counts> {
  return {
    trackedNfts: scalar("SELECT COUNT(*) AS count FROM tracked_nfts"),
    nftAssets: scalar("SELECT COUNT(*) AS count FROM nft_assets"),
    rwaNftEvents: scalar("SELECT COUNT(*) AS count FROM rwa_nft_events"),
    saleEvents: scalar("SELECT COUNT(*) AS count FROM rwa_nft_events WHERE event_type = 'SALE'"),
    visibleVerifiedSales: visibleVerifiedSalesCount(),
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function updateExistingTrackedNft(row: TrackedNftRow, market: string, label: string | null) {
  const timestamp = new Date().toISOString();
  getNftDb().prepare(`
    UPDATE tracked_nfts
    SET market = ?, label = COALESCE(?, label), active = 1, updated_at = ?
    WHERE mint = ?
  `).run(market, label, timestamp, row.mint);
}

async function addOrUpdateTrackedNft(input: { mint: string; market: string; label: string | null }) {
  const existing = await findTrackedNft(input.mint);
  if (existing) {
    updateExistingTrackedNft(existing, input.market, input.label);
    return { action: "updated", trackedNft: await findTrackedNft(input.mint) };
  }

  const trackedNft = await addTrackedNft({ mint: input.mint, market: input.market, label: input.label });
  return { action: "created", trackedNft };
}

async function refreshFromHelius(mint: string): Promise<RefreshResult> {
  let result = await refreshMint(mint, true);
  for (let attempt = 0; result.status === "queued" && attempt < 3; attempt += 1) {
    const waitMs = Math.min(Math.max(result.retryAfterMs ?? 30_000, 1_000), 65_000);
    console.log(`[NFT INGESTION] Refresh queued, waiting ${Math.ceil(waitMs / 1000)}s before retry`);
    await sleep(waitMs + 500);
    result = await refreshMint(mint, true);
  }
  return result;
}

async function main() {
  const mint = requiredArg("--mint");
  const market = requiredArg("--market");
  const label = arg("--label")?.trim() || null;
  const priceSol = numberArg("--priceSol", true);
  const priceUsd = numberArg("--priceUsd");
  const tx = requiredArg("--tx");
  const marketplace = requiredArg("--marketplace");

  if (!isValidMarket(market)) {
    throw new Error(`category is not allowed: ${market}. Allowed categories: ${ALLOWED_RWA_NFT_CATEGORIES.join(", ")}`);
  }

  console.log(JSON.stringify({ step: "before", counts: await counts() }, null, 2));

  const tracked = await addOrUpdateTrackedNft({ mint, market, label });
  if (!tracked.trackedNft) throw new Error("Unable to create or update tracked_nfts row");
  console.log(JSON.stringify({ step: "tracked_nfts", action: tracked.action, trackedNft: tracked.trackedNft }, null, 2));

  const refreshResult = await refreshFromHelius(mint);
  if (refreshResult.status === "error") throw new Error(`Helius refresh failed: ${refreshResult.message}`);
  if (refreshResult.status !== "saved" && refreshResult.status !== "cached") {
    throw new Error(`Helius refresh did not save metadata: ${refreshResult.status} ${refreshResult.message}`);
  }

  const storedAsset = await getStoredAsset(mint);
  if (!storedAsset) throw new Error(`nft_assets was not created for mint: ${mint}`);
  if (storedAsset.is_staging) console.warn("[RWA MARKET] Warning: NFT is marked staging and will be hidden from /verified-sales by default");
  if (!ALLOWED_RWA_NFT_CATEGORIES.includes(storedAsset.category as never)) {
    throw new Error(`Stored NFT category is not visible on /verified-sales: ${storedAsset.category}`);
  }

  let saleStatus = "created";
  let saleEvent = loadSaleEvent(tx);
  if (saleEvent) {
    saleStatus = "already_exists";
  } else {
    const result = await saveRwaNftMarketEvent({
      mint,
      category: storedAsset.category,
      eventType: "SALE",
      priceSol,
      priceUsd,
      marketplace,
      txSignature: tx,
      buyer: null,
      seller: null,
      owner: storedAsset.owner,
      eventAt: new Date().toISOString(),
      source: "manual",
      rawPayload: {
        seededBy: "npm run test:one-nft-flow",
        mint,
        market,
        label,
        priceSol,
        priceUsd,
        tx,
        marketplace,
      },
    });
    if (!result.saved && result.reason !== "duplicate") throw new Error(`SALE event was not created: ${result.reason}`);
    if (!result.saved && result.reason === "duplicate") saleStatus = "already_exists";
    saleEvent = loadSaleEvent(tx);
  }

  const visible = await getVerifiedSales({ search: tx, limit: 10, page: 1 });
  const updatedAsset = loadAsset(mint);
  const finalCounts = await counts();

  console.log(JSON.stringify({
    step: "final",
    counts: finalCounts,
    nftAsset: updatedAsset,
    saleEvent,
    saleStatus,
    verifiedSalesMatches: visible.sales,
    shouldShowOnVerifiedSales: visible.sales.some((sale) => sale.txSignature === tx),
  }, null, 2));
}

main().catch((error) => {
  console.error(`[ONE NFT FLOW] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
