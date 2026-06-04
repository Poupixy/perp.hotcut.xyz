import type { TrackedNftMarket } from "./trackedNftsConfig";

export type NormalizedNftAsset = {
  mint: string;
  name: string | null;
  description: string | null;
  image: string | null;
  owner: string | null;
  collection: string | null;
  market: string;
  category?: string | null;
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
  category: string | null;
  attributes_json: unknown[];
  token_standard: string | null;
  interface: string | null;
  source_collection: string | null;
  is_staging: boolean;
  is_listed: boolean;
  listed_price_sol: number | null;
  listed_price_usd: number | null;
  listing_marketplace: string | null;
  listing_updated_at: string | null;
  last_sale_price_sol: number | null;
  last_sale_price_usd: number | null;
  last_sale_at: string | null;
  last_sale_marketplace: string | null;
  last_sale_tx_signature: string | null;
  floor_price_sol: number | null;
  market_updated_at: string | null;
  raw_helius_json: unknown;
  updated_at: string;
  created_at?: string;
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
  skippedAssets: number;
  nextPage: number | null;
};
