import type { RwaNftCategory } from "@/types/rwaNftMarket";

type CategoryInput = {
  name?: string | null;
  description?: string | null;
  collection?: string | null;
  attributes_json?: unknown;
  attributes?: unknown;
};

export const ALLOWED_RWA_NFT_CATEGORIES: Exclude<RwaNftCategory, "unknown">[] = [
  "pokemon",
  "one_piece",
  "basketball",
  "football",
  "hockey",
  "baseball",
  "soccer",
  "yugioh",
  "dragon_ball",
  "magic_the_gathering",
];

const KEYWORDS: Record<Exclude<RwaNftCategory, "unknown">, string[]> = {
  pokemon: ["pokemon", "pokémon", "pikachu", "charizard", "mewtwo", "bulbasaur", "squirtle", "eevee", "gengar", "snorlax"],
  one_piece: ["one piece", "luffy", "zoro", "nami", "sanji", "chopper", "trafalgar", "kaido"],
  basketball: ["nba", "basketball", "lebron", "jordan", "kobe", "curry", "durant", "luka", "panini basketball"],
  football: ["nfl", "football", "quarterback", "rookie football", "panini football", "prizm football"],
  hockey: ["nhl", "hockey", "upper deck hockey", "rookie hockey"],
  baseball: ["baseball", "mlb", "topps", "bowman", "rookie baseball"],
  soccer: ["soccer", "fifa", "uefa", "panini soccer", "football club", "messi", "ronaldo", "mbappe", "haaland"],
  yugioh: ["yu-gi-oh", "yugioh", "yugi", "dark magician", "blue-eyes", "blue eyes white dragon"],
  dragon_ball: ["dragon ball", "dbz", "goku", "vegeta", "gohan", "frieza"],
  magic_the_gathering: ["magic the gathering", "mtg", "planeswalker", "black lotus", "mana"],
};

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\uFFFD/g, "e")
    .toLowerCase();
}

function attributeText(value: unknown): string {
  const attributes = Array.isArray(value) ? value : [];
  return attributes
    .map((attribute) => {
      if (!attribute || typeof attribute !== "object" || Array.isArray(attribute)) return "";
      const row = attribute as Record<string, unknown>;
      return `${row.trait_type ?? row.traitType ?? row.key ?? ""} ${row.value ?? ""}`;
    })
    .join(" ");
}

export function detectRwaNftCategory(nft: CategoryInput): RwaNftCategory {
  const haystack = normalize([
    nft.name,
    nft.description,
    nft.collection,
    attributeText(nft.attributes_json),
    attributeText(nft.attributes),
  ].join(" "));

  for (const category of ALLOWED_RWA_NFT_CATEGORIES) {
    if (KEYWORDS[category].some((keyword) => haystack.includes(normalize(keyword)))) return category;
  }

  return "unknown";
}

export function isAllowedRwaNftCategory(category: string | null | undefined): category is Exclude<RwaNftCategory, "unknown"> {
  return ALLOWED_RWA_NFT_CATEGORIES.includes(category as Exclude<RwaNftCategory, "unknown">);
}
