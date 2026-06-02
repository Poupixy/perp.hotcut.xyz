export type MarketProvider = "magic-eden" | "tensor" | "solscan" | "helius" | "collector-crypt" | "mock";

export type NormalizedSale = {
  id: string;
  marketSlug: string;
  marketName: string;
  assetName: string;
  assetImage?: string;
  grade?: string;
  salePrice: number;
  currency: string;
  saleTime: string;
  marketplace: string;
  source: MarketProvider;
  sourceUrl?: string;
  txSignature?: string;
  buyer?: string;
  seller?: string;
};

export type MarketSourceConfig = {
  magicEdenSymbols?: string[];
  tensorCollections?: string[];
  solscanCollections?: string[];
  heliusAddresses?: string[];
};

export type ProviderStatus = {
  provider: MarketProvider;
  enabled: boolean;
  ok: boolean;
  message: string;
};

export type MarketSalesResponse = {
  generatedAt: string;
  from: string;
  to: string;
  days: number;
  live: boolean;
  sales: NormalizedSale[];
  providerStatus: ProviderStatus[];
  warnings: string[];
};

export type RuntimeEnv = Record<string, string | undefined>;
