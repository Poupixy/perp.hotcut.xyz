import { fetchTrackedNft, HeliusNftError } from "./heliusNftService";
import { enqueueTrackedMints, findTrackedNft, getStoredAsset, listTrackedNfts, readNftDb, updateQueueState } from "./nftStore";
import type { RefreshResult, TrackedNftRow } from "./nftTypes";

export const HELIUS_CALL_INTERVAL_MS = 30_000;
export const NFT_REFRESH_INTERVAL_MS = 30 * 60 * 1000;
export const HELIUS_RATE_LIMIT_BACKOFF_MS = 60_000;

function now() {
  return Date.now();
}

function timeMs(iso: string | null | undefined) {
  return iso ? new Date(iso).getTime() : 0;
}

function remainingMs(timestamp: string | null | undefined, intervalMs: number) {
  const elapsed = now() - timeMs(timestamp);
  return Math.max(intervalMs - elapsed, 0);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function shouldSkipRecentlyFetched(trackedNft: TrackedNftRow, force = false): boolean {
  if (force) return false;
  return Boolean(trackedNft.last_fetched_at && now() - timeMs(trackedNft.last_fetched_at) < NFT_REFRESH_INTERVAL_MS);
}

async function markProcessing(processing: boolean) {
  await updateQueueState((db) => ({ ...db, queue_state: { ...db.queue_state, processing } }));
}

async function waitForRateLimit(): Promise<number> {
  const db = await readNftDb();
  const backoff = remainingMs(db.queue_state.backoffUntil, 0);
  if (backoff > 0) return backoff;
  return remainingMs(db.queue_state.lastHeliusCallAt, HELIUS_CALL_INTERVAL_MS);
}

async function markHeliusCall() {
  await updateQueueState((db) => ({ ...db, queue_state: { ...db.queue_state, lastHeliusCallAt: new Date().toISOString(), backoffUntil: null } }));
}

async function markBackoff() {
  const backoffUntil = new Date(now() + HELIUS_RATE_LIMIT_BACKOFF_MS).toISOString();
  await updateQueueState((db) => ({ ...db, queue_state: { ...db.queue_state, backoffUntil } }));
}

async function popNextMint(): Promise<string | null> {
  let next: string | null = null;
  await updateQueueState((db) => {
    const [first, ...rest] = db.queue_state.queue;
    next = first ?? null;
    return { ...db, queue_state: { ...db.queue_state, queue: rest } };
  });
  return next;
}

async function requeueMint(mint: string) {
  await enqueueTrackedMints([mint]);
}

async function refreshTrackedNftNow(trackedNft: TrackedNftRow, force = false): Promise<RefreshResult> {
  if (!trackedNft.active) return { status: "skipped", message: "NFT is not active", trackedNft, asset: await getStoredAsset(trackedNft.mint) };
  if (shouldSkipRecentlyFetched(trackedNft, force)) {
    console.log(`[NFT INGESTION] Skipped, recently fetched: ${trackedNft.mint}`);
    return { status: "cached", message: "Recently fetched; returning cached data", trackedNft, asset: await getStoredAsset(trackedNft.mint) };
  }

  const waitMs = await waitForRateLimit();
  if (waitMs > 0) {
    await requeueMint(trackedNft.mint);
    return { status: "queued", message: "Queued behind Helius rate limit", trackedNft, asset: await getStoredAsset(trackedNft.mint), retryAfterMs: waitMs };
  }

  try {
    await markHeliusCall();
    const { saved } = await fetchTrackedNft(trackedNft);
    return { status: "saved", message: "Fetched and saved", trackedNft: { ...trackedNft, last_fetched_at: saved.updated_at }, asset: saved };
  } catch (error) {
    if (error instanceof HeliusNftError && error.rateLimited) {
      console.log("[NFT INGESTION] Helius rate limit hit, backing off");
      await markBackoff();
      await requeueMint(trackedNft.mint);
      return { status: "queued", message: "Helius rate limit hit; queued for retry", trackedNft, asset: await getStoredAsset(trackedNft.mint), retryAfterMs: HELIUS_RATE_LIMIT_BACKOFF_MS };
    }
    console.log(`[NFT INGESTION] Error for ${trackedNft.mint}: ${error instanceof Error ? error.message : "unknown error"}`);
    return { status: "error", message: error instanceof Error ? error.message : "Unknown NFT ingestion error", trackedNft, asset: await getStoredAsset(trackedNft.mint) };
  }
}

export async function enqueueActiveTrackedNfts() {
  const rows = await listTrackedNfts();
  return enqueueTrackedMints(rows.filter((row) => row.active).map((row) => row.mint));
}

export async function refreshMint(mint: string, force = false): Promise<RefreshResult> {
  const trackedNft = await findTrackedNft(mint);
  if (!trackedNft) return { status: "error", message: "Mint is not in tracked_nfts. Refusing to fetch untracked NFT." };
  if (!trackedNft.active) return { status: "skipped", message: "Tracked NFT is inactive", trackedNft, asset: await getStoredAsset(mint) };
  return refreshTrackedNftNow(trackedNft, force);
}

export async function processTrackedNftQueue(options: { force?: boolean; maxItems?: number } = {}) {
  console.log("[NFT INGESTION] Starting queue");
  const db = await readNftDb();
  if (db.queue_state.processing) return { processed: 0, results: [], message: "Queue is already processing" };

  await markProcessing(true);
  const results: RefreshResult[] = [];
  try {
    let processed = 0;
    while (processed < (options.maxItems ?? Number.POSITIVE_INFINITY)) {
      const mint = await popNextMint();
      if (!mint) break;
      const trackedNft = await findTrackedNft(mint);
      if (!trackedNft || !trackedNft.active) {
        results.push({ status: "skipped", message: "Mint no longer active or tracked" });
        continue;
      }

      const waitMs = await waitForRateLimit();
      if (waitMs > 0) await sleep(waitMs);
      const result = await refreshTrackedNftNow(trackedNft, Boolean(options.force));
      results.push(result);
      processed += 1;
      if (result.status === "queued" && result.retryAfterMs) await sleep(result.retryAfterMs);
      if (processed < (options.maxItems ?? Number.POSITIVE_INFINITY)) await sleep(HELIUS_CALL_INTERVAL_MS);
    }
    return { processed, results, message: "Queue finished" };
  } finally {
    await markProcessing(false);
  }
}
