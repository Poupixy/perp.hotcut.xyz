import type { Market } from "./models";

const now = "2026-06-02T00:00:00.000Z";

export const rwaMarkets: Market[] = [
  { id: "pokemon-cards", name: "Pokémon Cards", symbol: "POKEMON", description: "Global tokenized Pokémon card market.", active: true, createdAt: now, updatedAt: now },
  { id: "one-piece-cards", name: "One Piece Cards", symbol: "ONEPIECE", description: "Global tokenized One Piece card market.", active: true, createdAt: now, updatedAt: now },
  { id: "nba-cards", name: "NBA Cards", symbol: "NBA", description: "Global tokenized NBA card market.", active: true, createdAt: now, updatedAt: now },
  { id: "nfl-cards", name: "NFL Cards", symbol: "NFL", description: "Global tokenized NFL card market.", active: true, createdAt: now, updatedAt: now },
  { id: "nhl-cards", name: "NHL Cards", symbol: "NHL", description: "Global tokenized NHL card market.", active: true, createdAt: now, updatedAt: now },
  { id: "sealed-products", name: "Sealed Products", symbol: "SEALED", description: "Tokenized sealed collectible products.", active: true, createdAt: now, updatedAt: now },
  { id: "graded-cards", name: "Graded Cards", symbol: "GRADED", description: "Tokenized graded collectible cards.", active: true, createdAt: now, updatedAt: now },
  { id: "other-cards", name: "Other Cards", symbol: "OTHER", description: "Other tokenized card markets.", active: true, createdAt: now, updatedAt: now },
];
