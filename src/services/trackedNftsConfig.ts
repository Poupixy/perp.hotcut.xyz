export type TrackedNftMarket = "pokemon" | "one_piece" | "nba" | "nfl" | "nhl" | "sealed_products" | "graded_cards" | "other_cards";

export type TargetNftConfig = {
  mint: string;
  market: TrackedNftMarket;
  label: string;
};

export type TargetNftCollectionConfig = {
  collectionAddress: string;
  market: TrackedNftMarket;
  label: string;
};

export const NFT_MARKETS: TrackedNftMarket[] = [
  "pokemon",
  "one_piece",
  "nba",
  "nfl",
  "nhl",
  "sealed_products",
  "graded_cards",
  "other_cards",
];

export const TARGET_NFTS: TargetNftConfig[] = [
  {
    mint: "NFT_MINT_ADDRESS_1",
    market: "pokemon",
    label: "Pokemon Card Example",
  },
  {
    mint: "NFT_MINT_ADDRESS_2",
    market: "one_piece",
    label: "One Piece Card Example",
  },
  {
    mint: "NFT_MINT_ADDRESS_3",
    market: "nba",
    label: "NBA Card Example",
  },
];

// Keep this list empty in code by default. Real collection addresses should be supplied server-side
// through PHYGITALS_COLLECTION_ADDRESSES or added here intentionally in a committed allowlist.
export const ALLOWED_NFT_COLLECTIONS: TargetNftCollectionConfig[] = [];

function env() {
  return (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
}

export function isValidMarket(value: string): value is TrackedNftMarket {
  return NFT_MARKETS.includes(value as TrackedNftMarket);
}

export function isPlaceholderMint(mint: string): boolean {
  return /^NFT_MINT_ADDRESS_\d+$/.test(mint);
}

export function normalizeCollectionAddress(value: string): string {
  return value.trim();
}

export function isProbablySolanaAddress(value: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value.trim());
}

function phygitalsCollectionsFromEnv(): TargetNftCollectionConfig[] {
  const raw = env().PHYGITALS_COLLECTION_ADDRESSES;
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Array<string | Partial<TargetNftCollectionConfig>>;
    if (Array.isArray(parsed)) {
      return parsed
        .map((item): TargetNftCollectionConfig | null => {
          if (typeof item === "string") {
            return { collectionAddress: normalizeCollectionAddress(item), market: "other_cards", label: "Phygitals" };
          }
          const collectionAddress = normalizeCollectionAddress(item.collectionAddress ?? "");
          const market = item.market && isValidMarket(item.market) ? item.market : "other_cards";
          return collectionAddress ? { collectionAddress, market, label: item.label ?? "Phygitals" } : null;
        })
        .filter((item): item is TargetNftCollectionConfig => Boolean(item));
    }
  } catch {
    // Fall through to comma-separated parsing.
  }

  return raw
    .split(",")
    .map((value) => normalizeCollectionAddress(value))
    .filter(Boolean)
    .map((collectionAddress) => ({ collectionAddress, market: "other_cards" as const, label: "Phygitals" }));
}

export function getAllowedNftCollections(): TargetNftCollectionConfig[] {
  const byAddress = new Map<string, TargetNftCollectionConfig>();
  for (const item of [...ALLOWED_NFT_COLLECTIONS, ...phygitalsCollectionsFromEnv()]) {
    const collectionAddress = normalizeCollectionAddress(item.collectionAddress);
    if (!collectionAddress || !isProbablySolanaAddress(collectionAddress)) continue;
    byAddress.set(collectionAddress, { ...item, collectionAddress });
  }
  return Array.from(byAddress.values());
}

export function findAllowedNftCollection(collectionAddress: string): TargetNftCollectionConfig | undefined {
  const normalized = normalizeCollectionAddress(collectionAddress);
  return getAllowedNftCollections().find((item) => item.collectionAddress === normalized);
}
