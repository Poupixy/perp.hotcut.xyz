export type RealMarketCategory = {
  slug: string;
  name: string;
  shortName: string;
  collectorCryptAssets: number;
  phygitalsAssets: number;
  assets: number;
};

export type RealProviderCollection = {
  id: string;
  slug: string;
  provider: "Collector Crypt" | "Phygitals";
  symbol: string;
  name: string;
  address: string;
  supply: number;
  holders: number;
  trackedAssets: number;
  floorSol: number | null;
  volume24hSol: number | null;
  volume7dSol: number | null;
  image: string;
};

const img = (seed: string) =>
  `https://images.unsplash.com/photo-${seed}?w=400&h=400&fit=crop`;

export const realMarketCategories: RealMarketCategory[] = [
  { slug: "pokemon-cards", name: "Pokémon", shortName: "Pokémon", collectorCryptAssets: 44454, phygitalsAssets: 38374 },
  { slug: "one-piece-cards", name: "One Piece", shortName: "One Piece", collectorCryptAssets: 5041, phygitalsAssets: 9963 },
  { slug: "nba-cards", name: "NBA / Basketball", shortName: "NBA", collectorCryptAssets: 594, phygitalsAssets: 2646 },
  { slug: "nfl-cards", name: "NFL / Football", shortName: "NFL", collectorCryptAssets: 717, phygitalsAssets: 659 },
  { slug: "nhl-cards", name: "NHL / Hockey", shortName: "NHL", collectorCryptAssets: 29, phygitalsAssets: 0 },
  { slug: "baseball-cards", name: "Baseball", shortName: "Baseball", collectorCryptAssets: 558, phygitalsAssets: 479 },
  { slug: "soccer-cards", name: "Soccer", shortName: "Soccer", collectorCryptAssets: 19, phygitalsAssets: 214 },
  { slug: "yugioh-cards", name: "Yu-Gi-Oh", shortName: "Yu-Gi-Oh", collectorCryptAssets: 377, phygitalsAssets: 1147 },
  { slug: "dragon-ball-cards", name: "Dragon Ball", shortName: "Dragon Ball", collectorCryptAssets: 0, phygitalsAssets: 404 },
  { slug: "magic-the-gathering-cards", name: "Magic The Gathering", shortName: "MTG", collectorCryptAssets: 328, phygitalsAssets: 26 },
].map((category) => ({ ...category, assets: category.collectorCryptAssets + category.phygitalsAssets }));

export const realProviderCollections: RealProviderCollection[] = [
  {
    id: "collector-crypt",
    slug: "collector-crypt",
    provider: "Collector Crypt",
    symbol: "collector_crypt",
    name: "Collector Crypt",
    address: "CCryptWBYktukHDQ2vHGtVcmtjXxYzvw8XNVY64YN2Yf",
    supply: 69022,
    holders: 8934,
    trackedAssets: 52117,
    floorSol: 0.430648,
    volume24hSol: 98.238049,
    volume7dSol: 760.190629,
    image: img("1606167668584-78701c57f13d"),
  },
  {
    id: "phygitals",
    slug: "phygitals",
    provider: "Phygitals",
    symbol: "phygitals",
    name: "Phygitals",
    address: "BSG6DyEihFFtfvxtL9mKYsvTwiZXB1rq5gARMTJC2xAM",
    supply: 94419,
    holders: 17340,
    trackedAssets: 23755,
    floorSol: 0.006603,
    volume24hSol: 0,
    volume7dSol: 0,
    image: img("1612036782180-6f0b6cd846fe"),
  },
  {
    id: "phygitals-core",
    slug: "phygitals-core",
    provider: "Phygitals",
    symbol: "phygitals___",
    name: "Phygitals Core",
    address: "phygZDQZJZVHvJGYPGoKPYUtXw7mstSYtTtcuh8LJcC",
    supply: 37180,
    holders: 3474,
    trackedAssets: 30157,
    floorSol: 0.126323,
    volume24hSol: 0,
    volume7dSol: 0,
    image: img("1628968434441-d9c61d4e26ce"),
  },
];

export const realTotals = {
  categories: realMarketCategories.length,
  providerCollections: realProviderCollections.length,
  providerSupply: realProviderCollections.reduce((sum, collection) => sum + collection.supply, 0),
  trackedAssets: realMarketCategories.reduce((sum, category) => sum + category.assets, 0),
  collectorCryptTrackedAssets: realMarketCategories.reduce((sum, category) => sum + category.collectorCryptAssets, 0),
  phygitalsTrackedAssets: realMarketCategories.reduce((sum, category) => sum + category.phygitalsAssets, 0),
  holders: realProviderCollections.reduce((sum, collection) => sum + collection.holders, 0),
};

export function fmtCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function fmtSOL(value: number | null) {
  if (value === null) return "--";
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 4 })} SOL`;
}

export const fmtUSD = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000 ? `$${(n / 1_000).toFixed(1)}K`
  : `$${n.toFixed(2)}`;
