import type { NormalizedNftAsset, TrackedNftRow } from "./nftTypes";
import { saveNormalizedAsset } from "./nftStore";

const HELIUS_RPC_URL = "https://mainnet.helius-rpc.com/";

type HeliusJsonRpcResponse = {
  result?: unknown;
  error?: { code?: number; message?: string };
};

function env() {
  return (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function attributesFromMetadata(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export class HeliusNftError extends Error {
  status?: number;
  rateLimited: boolean;

  constructor(message: string, options: { status?: number; rateLimited?: boolean } = {}) {
    super(message);
    this.name = "HeliusNftError";
    this.status = options.status;
    this.rateLimited = Boolean(options.rateLimited);
  }
}

export async function getAssetByMint(mint: string): Promise<unknown> {
  const apiKey = env().HELIUS_API_KEY;
  if (!apiKey) {
    console.log("[NFT INGESTION] Missing HELIUS_API_KEY");
    throw new HeliusNftError("Missing HELIUS_API_KEY");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${HELIUS_RPC_URL}?api-key=${apiKey}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "get-asset",
        method: "getAsset",
        params: { id: mint },
      }),
      signal: controller.signal,
    });

    if (response.status === 429) {
      throw new HeliusNftError("Helius rate limit hit", { status: 429, rateLimited: true });
    }
    if (!response.ok) {
      throw new HeliusNftError(`Helius request failed: ${response.status} ${response.statusText}`, { status: response.status });
    }

    const payload = await response.json() as HeliusJsonRpcResponse;
    if (payload.error) {
      throw new HeliusNftError(payload.error.message || "Helius getAsset returned an error");
    }
    if (!payload.result) {
      throw new HeliusNftError("NFT not found");
    }
    return payload.result;
  } catch (error) {
    if (error instanceof HeliusNftError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new HeliusNftError("Helius request timed out");
    throw new HeliusNftError(error instanceof Error ? error.message : "Helius network error");
  } finally {
    clearTimeout(timeout);
  }
}

export function normalizeHeliusAsset(asset: any, market = "other_cards"): NormalizedNftAsset {
  const record = asRecord(asset);
  const content = asRecord(record.content);
  const metadata = asRecord(content.metadata);
  const links = asRecord(content.links);
  const ownership = asRecord(record.ownership);
  const tokenInfo = asRecord(record.token_info);
  const grouping = Array.isArray(record.grouping) ? record.grouping.map(asRecord) : [];
  const collectionGroup = grouping.find((group) => group.group_key === "collection");
  const mint = asString(record.id);

  if (!mint) throw new HeliusNftError("Invalid Helius asset: missing id");

  return {
    mint,
    name: asString(metadata.name),
    description: asString(metadata.description),
    image: asString(links.image),
    owner: asString(ownership.owner),
    collection: asString(collectionGroup?.group_value),
    market,
    attributes: attributesFromMetadata(metadata.attributes),
    tokenStandard: asString(tokenInfo.token_program) ?? asString(record.interface),
    interface: asString(record.interface),
    rawSource: "helius",
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchTrackedNft(trackedNft: TrackedNftRow) {
  console.log(`[NFT INGESTION] Fetching mint: ${trackedNft.mint}`);
  const raw = await getAssetByMint(trackedNft.mint);
  const normalized = normalizeHeliusAsset(raw, trackedNft.market);
  const saved = await saveNormalizedAsset(trackedNft, normalized, raw);
  console.log(`[NFT INGESTION] Saved asset: ${trackedNft.mint}`);
  return { normalized, saved, raw };
}
