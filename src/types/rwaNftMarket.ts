export type RwaNftMarketEventType =
  | "LISTED"
  | "SALE"
  | "DELISTED"
  | "PRICE_UPDATED"
  | "TRANSFER"
  | "OWNER_CHANGED";

export type RwaNftMarketEventSource =
  | "helius_webhook"
  | "helius_enhanced_tx"
  | "magiceden"
  | "tensor"
  | "discord"
  | "manual";

export type RwaNftCategory =
  | "pokemon"
  | "one_piece"
  | "basketball"
  | "football"
  | "hockey"
  | "baseball"
  | "soccer"
  | "yugioh"
  | "dragon_ball"
  | "magic_the_gathering"
  | "unknown";

export type RwaNftMarketEvent = {
  mint: string;
  category: string | null;
  eventType: RwaNftMarketEventType;
  priceSol: number | null;
  priceUsd: number | null;
  paymentMint?: string | null;
  paymentSymbol?: string | null;
  paymentAmount?: number | null;
  marketplace: string | null;
  txSignature: string | null;
  buyer: string | null;
  seller: string | null;
  owner: string | null;
  eventAt: string;
  source: RwaNftMarketEventSource;
  rawPayload: unknown;
};

export type VerifiedSale = {
  id: string;
  mint: string;
  category: string;
  priceSol: number | null;
  priceUsd: number | null;
  paymentMint: string | null;
  paymentSymbol: string | null;
  paymentAmount: number | null;
  marketplace: string | null;
  txSignature: string;
  buyer: string | null;
  seller: string | null;
  eventAt: string;
  source: RwaNftMarketEventSource;
  fallbackVerified: boolean;
  isTestSale: boolean;
  name: string | null;
  image: string | null;
  collection: string | null;
  owner: string | null;
  lastSalePriceSol: number | null;
  lastSaleAt: string | null;
  lastSaleMarketplace: string | null;
};
