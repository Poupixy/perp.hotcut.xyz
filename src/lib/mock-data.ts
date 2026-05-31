export type Collection = {
  id: string;
  slug: string;
  name: string;
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
};

export type Sale = {
  id: string;
  collectionSlug: string;
  collectionName: string;
  asset: string;
  image: string;
  price: number;
  marketplace: string;
  buyer: string;
  seller: string;
  time: string; // ISO
  type: "NFT" | "RWA" | "Phygital";
};

const img = (seed: string) =>
  `https://images.unsplash.com/photo-${seed}?w=400&h=400&fit=crop`;

export const collections: Collection[] = [
  {
    id: "1",
    slug: "pokemon-base-set",
    name: "Pokémon Base Set (1999)",
    series: "Pokémon TCG",
    image: img("1606503153255-59d8b2e4e1d2"),
    floorPrice: 1248.5,
    volume24h: 184320,
    volume7d: 1245890,
    change24h: 4.82,
    change7d: -2.14,
    supply: 12500,
    owners: 4820,
    type: "Phygital",
    marketplace: "Courtyard",
  },
  {
    id: "2",
    slug: "one-piece-romance-dawn",
    name: "One Piece — Romance Dawn",
    series: "One Piece TCG",
    image: img("1633409361618-c73427e4e206"),
    floorPrice: 342.2,
    volume24h: 92480,
    volume7d: 624330,
    change24h: -1.92,
    change7d: 8.41,
    supply: 8400,
    owners: 2310,
    type: "Phygital",
    marketplace: "Courtyard",
  },
  {
    id: "3",
    slug: "pokemon-evolving-skies",
    name: "Pokémon — Evolving Skies",
    series: "Pokémon TCG",
    image: img("1628968434441-d9c61d4e26ce"),
    floorPrice: 184.9,
    volume24h: 68210,
    volume7d: 489720,
    change24h: 12.4,
    change7d: 18.7,
    supply: 22000,
    owners: 6480,
    type: "Phygital",
    marketplace: "TCGFi",
  },
  {
    id: "4",
    slug: "pokemon-151",
    name: "Pokémon — 151",
    series: "Pokémon TCG",
    image: img("1612036782180-6f0b6cd846fe"),
    floorPrice: 76.4,
    volume24h: 24180,
    volume7d: 142890,
    change24h: -4.21,
    change7d: -1.8,
    supply: 18900,
    owners: 5210,
    type: "Phygital",
    marketplace: "TCGFi",
  },
  {
    id: "5",
    slug: "one-piece-paramount-war",
    name: "One Piece — Paramount War",
    series: "One Piece TCG",
    image: img("1606167668584-78701c57f13d"),
    floorPrice: 218.5,
    volume24h: 56240,
    volume7d: 418320,
    change24h: 3.14,
    change7d: 5.67,
    supply: 11200,
    owners: 3890,
    type: "Phygital",
    marketplace: "Courtyard",
  },
  {
    id: "6",
    slug: "nba-topshot-rare",
    name: "NBA Top Shot — Rare Moments",
    series: "NBA Collectibles",
    image: img("1635322966219-b75ed372eb01"),
    floorPrice: 184.3,
    volume24h: 48290,
    volume7d: 312480,
    change24h: -6.41,
    change7d: -8.92,
    supply: 5400,
    owners: 2104,
    type: "NFT",
    marketplace: "Top Shot",
  },
  {
    id: "7",
    slug: "nhl-topshot",
    name: "NHL Top Shot — Highlights",
    series: "NHL Collectibles",
    image: img("1547996160-81dfa63595aa"),
    floorPrice: 92.5,
    volume24h: 28420,
    volume7d: 182340,
    change24h: 7.12,
    change7d: 14.3,
    supply: 7200,
    owners: 2650,
    type: "NFT",
    marketplace: "Top Shot",
  },
  {
    id: "8",
    slug: "nfl-all-day",
    name: "NFL All Day — Legendary",
    series: "NFL Collectibles",
    image: img("1546519638-68e109498ffc"),
    floorPrice: 245.8,
    volume24h: 89120,
    volume7d: 612480,
    change24h: 1.25,
    change7d: -3.41,
    supply: 4800,
    owners: 1980,
    type: "NFT",
    marketplace: "All Day",
  },
];

export const sales: Sale[] = [
  { id: "s1", collectionSlug: "pokemon-base-set", collectionName: "Pokémon Base Set", asset: "Charizard #4 PSA 10", image: collections[0].image, price: 18420, marketplace: "Courtyard", buyer: "0x8f3a…2c1d", seller: "0x9c4b…7e2a", time: new Date(Date.now() - 1000 * 60 * 2).toISOString(), type: "Phygital" },
  { id: "s2", collectionSlug: "one-piece-romance-dawn", collectionName: "One Piece RD", asset: "Luffy Leader Alt-Art", image: collections[1].image, price: 1240, marketplace: "Courtyard", buyer: "0x2a1b…8f4c", seller: "0x6d2e…3a91", time: new Date(Date.now() - 1000 * 60 * 6).toISOString(), type: "Phygital" },
  { id: "s3", collectionSlug: "magic-alpha", asset: "Black Lotus BGS 9", collectionName: "MTG Alpha", image: collections[3].image, price: 142000, marketplace: "Collector Crypt", buyer: "0x4c8a…1d2b", seller: "0x7e1f…9a3c", time: new Date(Date.now() - 1000 * 60 * 14).toISOString(), type: "RWA" },
  { id: "s4", collectionSlug: "azuki", asset: "Azuki #4821", collectionName: "Azuki", image: collections[5].image, price: 4310, marketplace: "OpenSea", buyer: "0x3a2c…6e9d", seller: "0x1b4f…2a8c", time: new Date(Date.now() - 1000 * 60 * 22).toISOString(), type: "NFT" },
  { id: "s5", collectionSlug: "pokemon-evolving-skies", asset: "Umbreon VMAX Alt", collectionName: "Evolving Skies", image: collections[2].image, price: 892, marketplace: "TCGFi", buyer: "0x9d2a…4f1b", seller: "0x5c3e…8b2d", time: new Date(Date.now() - 1000 * 60 * 38).toISOString(), type: "Phygital" },
  { id: "s6", collectionSlug: "rolex-daytona-tokenized", asset: "Daytona 116500LN", collectionName: "Rolex Daytona", image: collections[6].image, price: 39800, marketplace: "Arianee", buyer: "0x7b1a…2d8e", seller: "0x4f9c…1a3b", time: new Date(Date.now() - 1000 * 60 * 52).toISOString(), type: "RWA" },
  { id: "s7", collectionSlug: "yugioh-lob", asset: "Blue-Eyes White Dragon 1st", collectionName: "Yu-Gi-Oh! LOB", image: collections[4].image, price: 4280, marketplace: "Courtyard", buyer: "0x2e8d…9c4a", seller: "0x6a3b…7f1d", time: new Date(Date.now() - 1000 * 60 * 71).toISOString(), type: "Phygital" },
  { id: "s8", collectionSlug: "nba-topshot-rare", asset: "LeBron James Dunk", collectionName: "NBA Top Shot", image: collections[7].image, price: 320, marketplace: "Top Shot", buyer: "0x1c4f…3a8b", seller: "0x8d2e…6b1c", time: new Date(Date.now() - 1000 * 60 * 88).toISOString(), type: "NFT" },
  { id: "s9", collectionSlug: "pokemon-base-set", asset: "Blastoise #2 PSA 9", collectionName: "Pokémon Base Set", image: collections[0].image, price: 6420, marketplace: "Courtyard", buyer: "0x4b8c…2e1a", seller: "0x9f3d…7c2b", time: new Date(Date.now() - 1000 * 60 * 104).toISOString(), type: "Phygital" },
  { id: "s10", collectionSlug: "azuki", asset: "Azuki #1284", collectionName: "Azuki", image: collections[5].image, price: 4180, marketplace: "OpenSea", buyer: "0x6e2a…8d4c", seller: "0x3b1f…9a2e", time: new Date(Date.now() - 1000 * 60 * 132).toISOString(), type: "NFT" },
];

export const watchlist = ["pokemon-base-set", "one-piece-romance-dawn", "magic-alpha", "rolex-daytona-tokenized"];

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
