import type { TrackedNftMarket } from "./trackedNftsConfig";

export type NormalizedNftAsset = {
  mint: string;
  name: string | null;
  description: string | null;
  image: string | null;
  owner: string | null;
  collection: string | null;
  market: string;
  attributes: unknown[];
  tokenStandard: string | null;
  interface: string | null;
  rawSource: "helius";
  updatedAt: string;
};

export type TrackedNftRow = {
  id: string;
  mint: string;
  market: TrackedNftMarket;
  label: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  last_fetched_at: string | null;
};

export type NftAssetRow = {
  id: string;
  mint: string;
  market: string;
  name: string | null;
  description: string | null;
  image: string | null;
  owner: string | null;
  collection: string | null;
  attributes_json: unknown[];
  token_standard: string | null;
  interface: string | null;
  raw_helius_json: unknown;
  updated_at: string;
};

export type NftQueueState = {
  queue: string[];
  processing: boolean;
  lastHeliusCallAt: string | null;
  backoffUntil: string | null;
  updatedAt: string | null;
};

export type NftIngestionDb = {
  tracked_nfts: TrackedNftRow[];
  nft_assets: NftAssetRow[];
  queue_state: NftQueueState;
};

export type TrackedNftWithAsset = TrackedNftRow & {
  asset: NftAssetRow | null;
};

export type RefreshResult = {
  status: "saved" | "cached" | "queued" | "skipped" | "error";
  message: string;
  trackedNft?: TrackedNftRow;
  asset?: NftAssetRow | null;
  retryAfterMs?: number;
};


export type CollectionIngestionResult = {
  collectionAddress: string;
  market: string;
  label: string;
  pagesFetched: number;
  assetsFound: number;
  savedAssets: number;
  nextPage: number | null;
};
