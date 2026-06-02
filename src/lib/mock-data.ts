export type Collection = {
  id: string;
  slug: string;
  name: string;
  category: string;
  series: string;
  image: string;
  floorPrice: number; // in USD
  volume24h: number;
  volume7d: number;
  change24h: number; // percentage
  change7d: number;
  supply: number;
  owners: number;
  type: "NFT" | "RWA" | "Phygital";
  marketplace: string;
  trackedAssets: number;
};

export type Sale = {
  id: string;
  collectionSlug: string;
  collectionName: string;
  category: string;
  asset: string;
  grade: string;
  image: string;
  price: number;
  priceChange: number;
  marketplace: string;
  buyer: string;
  seller: string;
  time: string; // ISO
  type: "NFT" | "RWA" | "Phygital";
};

const img = (seed: string) =>
  `https://images.unsplash.com/photo-${seed}?w=400&h=400&fit=crop`;

export const categories = [
  { name: "Pokémon Cards", collections: 1, assets: 1820, volume24h: 315190, change24h: 4.8 },
  { name: "One Piece Cards", collections: 1, assets: 740, volume24h: 148720, change24h: 1.6 },
  { name: "NBA Cards", collections: 1, assets: 940, volume24h: 177830, change24h: -2.4 },
  { name: "NFL Cards", collections: 1, assets: 760, volume24h: 129600, change24h: 2.1 },
  { name: "NHL Cards", collections: 1, assets: 610, volume24h: 98400, change24h: 1.2 },
  { name: "Sealed Products", collections: 1, assets: 320, volume24h: 96400, change24h: 6.1 },
  { name: "Graded Cards", collections: 1, assets: 2410, volume24h: 412580, change24h: 3.2 },
  { name: "Other Cards", collections: 1, assets: 530, volume24h: 74200, change24h: -0.7 },
];

export const collections: Collection[] = [
  {
    id: "1",
    slug: "pokemon-cards",
    name: "Pokémon Cards",
    category: "Pokémon Cards",
    series: "Global market",
    image: img("1606503153255-59d8b2e4e1d2"),
    floorPrice: 1248.5,
    volume24h: 315190,
    volume7d: 1388780,
    change24h: 4.82,
    change7d: -0.84,
    supply: 31400,
    owners: 10030,
    type: "Phygital",
    marketplace: "Courtyard",
    trackedAssets: 800,
  },
  {
    id: "2",
    slug: "one-piece-cards",
    name: "One Piece Cards",
    category: "One Piece Cards",
    series: "Global market",
    image: img("1633409361618-c73427e4e206"),
    floorPrice: 342.2,
    volume24h: 148720,
    volume7d: 1042650,
    change24h: 1.6,
    change7d: 7.2,
    supply: 19600,
    owners: 6200,
    type: "Phygital",
    marketplace: "Courtyard",
    trackedAssets: 485,
  },
  {
    id: "3",
    slug: "nba-cards",
    name: "NBA Cards",
    category: "NBA Cards",
    series: "Global market",
    image: img("1635322966219-b75ed372eb01"),
    floorPrice: 184.3,
    volume24h: 177830,
    volume7d: 312480,
    change24h: -2.4,
    change7d: -8.92,
    supply: 5400,
    owners: 2104,
    type: "NFT",
    marketplace: "Top Shot",
    trackedAssets: 540,
  },
  {
    id: "4",
    slug: "nfl-cards",
    name: "NFL Cards",
    category: "NFL Cards",
    series: "Global market",
    image: img("1546519638-68e109498ffc"),
    floorPrice: 245.8,
    volume24h: 129600,
    volume7d: 612480,
    change24h: 2.1,
    change7d: -3.41,
    supply: 4800,
    owners: 1980,
    type: "NFT",
    marketplace: "All Day",
    trackedAssets: 440,
  },
  {
    id: "5",
    slug: "nhl-cards",
    name: "NHL Cards",
    category: "NHL Cards",
    series: "Global market",
    image: img("1547996160-81dfa63595aa"),
    floorPrice: 92.5,
    volume24h: 98400,
    volume7d: 182340,
    change24h: 1.2,
    change7d: 14.3,
    supply: 7200,
    owners: 2650,
    type: "NFT",
    marketplace: "Top Shot",
    trackedAssets: 360,
  },
  {
    id: "6",
    slug: "sealed-products",
    name: "Sealed Products",
    category: "Sealed Products",
    series: "Global market",
    image: img("1628968434441-d9c61d4e26ce"),
    floorPrice: 184.9,
    volume24h: 96400,
    volume7d: 489720,
    change24h: 6.1,
    change7d: 18.7,
    supply: 22000,
    owners: 6480,
    type: "Phygital",
    marketplace: "TCGFi",
    trackedAssets: 310,
  },
  {
    id: "7",
    slug: "graded-cards",
    name: "Graded Cards",
    category: "Graded Cards",
    series: "Global market",
    image: img("1612036782180-6f0b6cd846fe"),
    floorPrice: 1120.4,
    volume24h: 412580,
    volume7d: 1242890,
    change24h: 3.2,
    change7d: 6.4,
    supply: 18900,
    owners: 5210,
    type: "Phygital",
    marketplace: "Courtyard",
    trackedAssets: 760,
  },
  {
    id: "8",
    slug: "other-cards",
    name: "Other Cards",
    category: "Other Cards",
    series: "Global market",
    image: img("1606167668584-78701c57f13d"),
    floorPrice: 218.5,
    volume24h: 74200,
    volume7d: 418320,
    change24h: -0.7,
    change7d: 5.67,
    supply: 11200,
    owners: 3890,
    type: "Phygital",
    marketplace: "Courtyard",
    trackedAssets: 225,
  },
];

export const sales: Sale[] = [
  { id: "s1", collectionSlug: "pokemon-cards", collectionName: "Pokémon Cards", category: "Pokémon Cards", asset: "Charizard #4 PSA 10", grade: "PSA 10", image: collections[0].image, price: 18420, priceChange: 7.4, marketplace: "Courtyard", buyer: "0x8f3a…2c1d", seller: "0x9c4b…7e2a", time: "2026-05-31T10:00:00Z", type: "Phygital" },
  { id: "s2", collectionSlug: "one-piece-cards", collectionName: "One Piece Cards", category: "One Piece Cards", asset: "Monkey D. Luffy Manga Rare PSA 10", grade: "PSA 10", image: collections[1].image, price: 1240, priceChange: 3.1, marketplace: "Courtyard", buyer: "0x2a1b…8f4c", seller: "0x6d2e…3a91", time: "2026-05-31T09:54:00Z", type: "Phygital" },
  { id: "s3", collectionSlug: "pokemon-cards", asset: "Charizard ex 199/165 PSA 10", collectionName: "Pokémon Cards", category: "Pokémon Cards", grade: "PSA 10", image: collections[0].image, price: 340, priceChange: -1.8, marketplace: "TCGFi", buyer: "0x4c8a…1d2b", seller: "0x7e1f…9a3c", time: "2026-05-31T09:46:00Z", type: "Phygital" },
  { id: "s4", collectionSlug: "nba-cards", asset: "LeBron James rookie card", collectionName: "NBA Cards", category: "NBA Cards", grade: "Verified", image: collections[2].image, price: 320, priceChange: -4.2, marketplace: "Top Shot", buyer: "0x3a2c…6e9d", seller: "0x1b4f…2a8c", time: "2026-05-31T09:38:00Z", type: "NFT" },
  { id: "s5", collectionSlug: "sealed-products", asset: "Evolving Skies Booster Box", collectionName: "Sealed Products", category: "Sealed Products", grade: "Sealed", image: collections[5].image, price: 892, priceChange: 12.6, marketplace: "TCGFi", buyer: "0x9d2a…4f1b", seller: "0x5c3e…8b2d", time: "2026-05-31T09:22:00Z", type: "Phygital" },
  { id: "s6", collectionSlug: "nhl-cards", asset: "Connor McDavid card", collectionName: "NHL Cards", category: "NHL Cards", grade: "Verified", image: collections[4].image, price: 180, priceChange: 5.9, marketplace: "Top Shot", buyer: "0x7b1a…2d8e", seller: "0x4f9c…1a3b", time: "2026-05-31T09:08:00Z", type: "NFT" },
  { id: "s7", collectionSlug: "nfl-cards", asset: "Tom Brady card", collectionName: "NFL Cards", category: "NFL Cards", grade: "Verified", image: collections[3].image, price: 510, priceChange: 1.7, marketplace: "All Day", buyer: "0x2e8d…9c4a", seller: "0x6a3b…7f1d", time: "2026-05-31T08:49:00Z", type: "NFT" },
  { id: "s8", collectionSlug: "pokemon-cards", asset: "Blastoise #2 PSA 9", collectionName: "Pokémon Cards", category: "Pokémon Cards", grade: "PSA 9", image: collections[0].image, price: 6420, priceChange: -2.3, marketplace: "Courtyard", buyer: "0x4b8c…2e1a", seller: "0x9f3d…7c2b", time: "2026-05-31T08:44:00Z", type: "Phygital" },
  { id: "s9", collectionSlug: "one-piece-cards", asset: "Portgas D. Ace Alt Art PSA 10", collectionName: "One Piece Cards", category: "One Piece Cards", grade: "PSA 10", image: collections[1].image, price: 620, priceChange: 4.6, marketplace: "Courtyard", buyer: "0x1c4f…3a8b", seller: "0x8d2e…6b1c", time: "2026-05-31T08:28:00Z", type: "Phygital" },
  { id: "s10", collectionSlug: "nba-cards", asset: "Stephen Curry card", collectionName: "NBA Cards", category: "NBA Cards", grade: "Verified", image: collections[2].image, price: 280, priceChange: -3.8, marketplace: "Top Shot", buyer: "0x6e2a…8d4c", seller: "0x3b1f…9a2e", time: "2026-05-31T08:00:00Z", type: "NFT" },
];

export const watchlist = ["pokemon-cards", "one-piece-cards", "nba-cards", "nfl-cards"];

export const fmtUSD = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000 ? `$${(n / 1_000).toFixed(1)}K`
  : `$${n.toFixed(2)}`;

export const fmtUSDFull = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

export const fmtTimeAgo = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};
