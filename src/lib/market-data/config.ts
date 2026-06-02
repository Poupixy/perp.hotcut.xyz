import type { MarketSourceConfig, RuntimeEnv } from "./types";

export const MARKET_NAMES: Record<string, string> = {
  "pokemon-base-set": "Pokémon Cards",
  "pokemon-151": "Pokémon Cards",
  "one-piece-romance-dawn": "One Piece Cards",
  "one-piece-paramount-war": "One Piece Cards",
  "nba-topshot-rare": "NBA Cards",
  "nfl-all-day": "NFL Cards",
  "nhl-topshot": "NHL Cards",
  "pokemon-evolving-skies": "Sealed Products",
  "pokemon-cards": "Pokémon Cards",
  "one-piece-cards": "One Piece Cards",
  "nba-cards": "NBA Cards",
  "nfl-cards": "NFL Cards",
  "nhl-cards": "NHL Cards",
  "sealed-products": "Sealed Products",
  "graded-cards": "Graded Cards",
  "other-cards": "Other Cards",
};

export function getRuntimeEnv(): RuntimeEnv {
  return (globalThis as unknown as { process?: { env?: RuntimeEnv } }).process?.env ?? {};
}

export function readMarketSourceConfig(env = getRuntimeEnv()): Record<string, MarketSourceConfig> {
  const raw = env.PERP_MARKET_SOURCES;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, MarketSourceConfig>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function clampDays(value: string | null): number {
  const days = Number(value ?? 7);
  return Number.isFinite(days) ? Math.min(Math.max(Math.floor(days), 1), 30) : 7;
}
