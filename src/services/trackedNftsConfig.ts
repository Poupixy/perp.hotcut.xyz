export type TrackedNftMarket = "pokemon" | "one_piece" | "nba" | "nfl" | "nhl" | "sealed_products" | "graded_cards" | "other_cards";

export type TargetNftConfig = {
  mint: string;
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

export function isValidMarket(value: string): value is TrackedNftMarket {
  return NFT_MARKETS.includes(value as TrackedNftMarket);
}

export function isPlaceholderMint(mint: string): boolean {
  return /^NFT_MINT_ADDRESS_\d+$/.test(mint);
}
