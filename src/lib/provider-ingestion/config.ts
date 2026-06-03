import type { MarketSourceConfig } from "./types";

export type IngestionEnv = Record<string, string | undefined>;

export function getIngestionEnv(): IngestionEnv {
  return (globalThis as unknown as { process?: { env?: IngestionEnv } }).process?.env ?? {};
}

export function readMarketSources(env = getIngestionEnv()): Record<string, MarketSourceConfig> {
  const raw = env.PERP_MARKET_SOURCES;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, MarketSourceConfig>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function salesDbPath(env = getIngestionEnv()): string {
  return env.PERP_SALES_DB_PATH || "data/provider-sales.json";
}

export function defaultWindow(days = 7) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from, to };
}
