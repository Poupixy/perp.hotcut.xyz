export type RwaMarketId = "pokemon-cards" | "one-piece-cards" | "nba-cards" | "nfl-cards" | "nhl-cards" | "sealed-products" | "graded-cards" | "other-cards";

export type Market = {
  id: RwaMarketId;
  name: string;
  symbol: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Asset = {
  id: string;
  market: RwaMarketId;
  name: string;
  image?: string;
  grade?: string;
  metadata?: Record<string, unknown>;
};

export type Sale = {
  id: string;
  market: RwaMarketId;
  assetId: string;
  assetName: string;
  assetImage?: string;
  platform: string;
  source: string;
  txHash?: string;
  buyerWallet?: string;
  sellerWallet?: string;
  priceSol: number;
  priceUsd: number;
  timestamp: string;
  blockSlot?: number;
  rawPayload: unknown;
  suspicious: boolean;
  outlier: boolean;
  confirmed: boolean;
};

export type IndexSnapshot = {
  indexName: string;
  market: RwaMarketId;
  indexPrice: number;
  lastSalePrice: number | null;
  previousSalePrice: number | null;
  priceChangePercent: number | null;
  vwap10m: number | null;
  vwap30m: number | null;
  volume10m: number;
  volume30m: number;
  salesCount10m: number;
  salesCount30m: number;
  growth10m: number | null;
  growth30m: number | null;
  liquidityScore: number;
  confidenceScore: number;
  stale: boolean;
  staleReason?: string;
  timestamp: string;
};

export type OraclePriceUpdate = {
  id: string;
  indexName: string;
  market: RwaMarketId;
  price: number;
  confidenceScore: number;
  stale: boolean;
  payload: Record<string, unknown>;
  createdAt: string;
  publishedAt?: string;
  signature?: string;
  status: "prepared" | "refused" | "published";
  reason?: string;
};

export type IndexEngineConfig = {
  market: RwaMarketId;
  indexName: string;
  now?: Date;
  staleAfterMinutes: number;
  minimumSales30m: number;
  outlierVwapDeviation: number;
  lowVolumeUsd: number;
  abnormalMovePercent: number;
};
