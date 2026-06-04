import type { TrackedNftMarket } from "./trackedNftsConfig";

export type TrackedMarketCategory = {
  market: TrackedNftMarket;
  label: string;
  aliases: string[];
};

export const TRACKED_MARKET_CATEGORIES: TrackedMarketCategory[] = [
  { market: "pokemon", label: "Pokémon", aliases: ["pokemon", "pokémon", "pok�mon"] },
  { market: "one_piece", label: "One Piece", aliases: ["one piece"] },
  { market: "nba", label: "NBA / Basketball", aliases: ["basketball", "nba"] },
  { market: "nfl", label: "NFL / Football", aliases: ["football", "nfl"] },
  { market: "nhl", label: "NHL / Hockey", aliases: ["hockey", "nhl"] },
  { market: "baseball", label: "Baseball", aliases: ["baseball"] },
  { market: "soccer", label: "Soccer", aliases: ["soccer"] },
  { market: "yugioh", label: "Yu-Gi-Oh", aliases: ["yu-gi-oh!", "yu-gi-oh", "yu-gi-oh!", "yugioh"] },
  { market: "dragon_ball", label: "Dragon Ball", aliases: ["dragon ball"] },
  { market: "magic_the_gathering", label: "Magic The Gathering", aliases: ["magic the gathering", "mtg"] },
];

const ORDER = new Map(TRACKED_MARKET_CATEGORIES.map((category, index) => [category.market, index]));

function normalizeValue(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\uFFFD/g, "e")
    .trim()
    .toLowerCase();
}

function attributeEntries(attributes: unknown[]) {
  return attributes
    .filter((attribute): attribute is Record<string, unknown> => Boolean(attribute) && typeof attribute === "object" && !Array.isArray(attribute))
    .map((attribute) => ({
      trait: normalizeValue(attribute.trait_type ?? attribute.traitType ?? attribute.key),
      value: normalizeValue(attribute.value),
      rawValue: String(attribute.value ?? "").trim(),
    }));
}

export function getTrackedMarketCategory(attributes: unknown[]): TrackedMarketCategory | null {
  const entries = attributeEntries(attributes);
  const categoryValues = entries.filter((entry) => entry.trait === "category").map((entry) => entry.value);

  for (const value of categoryValues) {
    const category = TRACKED_MARKET_CATEGORIES.find((item) => item.aliases.map(normalizeValue).includes(value));
    if (category) return category;
  }

  return null;
}

export function filterAndSortTrackedAssets<T extends { market: string; name: string | null; attributes: unknown[] }>(assets: T[]): T[] {
  return assets
    .filter((asset) => Boolean(getTrackedMarketCategory(asset.attributes)))
    .map((asset) => {
      const category = getTrackedMarketCategory(asset.attributes);
      return category ? { ...asset, market: category.market } : asset;
    })
    .sort((a, b) => {
      const marketDelta = (ORDER.get(a.market as TrackedNftMarket) ?? 999) - (ORDER.get(b.market as TrackedNftMarket) ?? 999);
      if (marketDelta !== 0) return marketDelta;
      return (a.name ?? "").localeCompare(b.name ?? "");
    });
}

export function trackedMarketLabel(market: string): string {
  return TRACKED_MARKET_CATEGORIES.find((category) => category.market === market)?.label ?? market;
}
