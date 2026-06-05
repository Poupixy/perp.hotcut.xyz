import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { heliusAssetsPage, normalizeNftUniverseAsset, type AssetCandidate } from "../src/services/nftCollectionIngestionService";
import { ALLOWED_RWA_NFT_CATEGORIES, isAllowedRwaNftCategory } from "../src/services/nftCategoryService";
import type { TargetNftCollectionConfig } from "../src/services/trackedNftsConfig";

const PAGE_LIMIT = 1000;
const CATEGORY_EXAMPLES = [
  "pokemon",
  "one_piece",
  "football",
  "baseball",
  "yugioh",
  "magic_the_gathering",
  "soccer",
  "dragon_ball",
  "unknown",
];
const STRONG_CARD_SIGNALS = [
  "psa",
  "bgs",
  "cgc card",
  "graded card",
  "rookie card",
  "card",
  "holo",
  "prizm",
  "topps",
  "panini",
  "upper deck",
];

type SourceCollectionReport = {
  label: string;
  market: TargetNftCollectionConfig["market"];
  collectionAddress: string;
  pagesScanned: number;
};

type SourceReport = {
  reportPath?: string;
  collections?: SourceCollectionReport[];
  comparison?: {
    newVisibleCardAssetsMissedByPreviousFilter?: number;
  };
};

type SampleItem = {
  mint: string;
  name: string | null;
  detectedCategory: string;
  assetType: string;
  publicGroup: string;
  sourceCollection: string;
  sourceCollectionLabel: string;
  collection: string | null;
  rawNftCategoryAttribute: string | null;
  newFilterCardReason: string;
  oldFilterMissReason: string;
  imageExists: boolean;
};

type ReviewReport = {
  sourceReportPath: string;
  sampleSize: number;
  generatedAt: string;
  scannedPages: number;
  scannedAssets: number;
  newOnlyVisibleCount: number;
  expectedNewOnlyVisibleCount: number | null;
  categoryCounts: Record<string, number>;
  strongCardSignalCounts: Record<string, number>;
  strongCardSignalTotal: number;
  weakCardSignalCount: number;
  unknownCategoryCount: number;
  missingImageCount: number;
  missingNameCount: number;
  randomSample: SampleItem[];
  topCategorySamples: Record<string, SampleItem[]>;
  categoryExamples: Record<string, SampleItem[]>;
  unknownCardExamples: SampleItem[];
  notes: string[];
  reportPath: string;
};

function arg(name: string) {
  const prefix = `${name}=`;
  const match = process.argv.slice(2).find((item) => item.startsWith(prefix));
  if (match) return match.slice(prefix.length);
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function numberArg(name: string, fallback: number) {
  const raw = arg(name);
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? Math.trunc(value) : fallback;
}

function sleep(ms: number) {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

function normalize(value: unknown) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\uFFFD/g, "e")
    .toLowerCase();
}

function flatten(value: unknown, depth = 0): string {
  if (value === null || value === undefined || depth > 4) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => flatten(item, depth + 1)).join(" ");
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !["raw_helius_json", "instructions", "accountData"].includes(key))
      .map(([key, item]) => `${key} ${flatten(item, depth + 1)}`)
      .join(" ");
  }
  return "";
}

function addCount(target: Record<string, number>, key: string, amount = 1) {
  target[key] = (target[key] ?? 0) + amount;
}

function attributeValue(attributes: unknown[], traitName: string) {
  const normalizedTrait = normalize(traitName);
  for (const attribute of attributes) {
    if (!attribute || typeof attribute !== "object" || Array.isArray(attribute)) continue;
    const row = attribute as Record<string, unknown>;
    const trait = normalize(row.trait_type ?? row.traitType ?? row.key);
    if (trait === normalizedTrait) return String(row.value ?? "").trim() || null;
  }
  return null;
}

function cardSignals(candidate: AssetCandidate) {
  const text = normalize([
    candidate.name,
    candidate.description,
    candidate.collection,
    flatten(candidate.attributes),
    flatten(candidate.raw),
  ].join(" "));
  return STRONG_CARD_SIGNALS.filter((signal) => text.includes(normalize(signal)));
}

function publicVisibleByNewFilter(candidate: AssetCandidate) {
  return candidate.assetType === "card"
    && isAllowedRwaNftCategory(candidate.category)
    && candidate.category !== "unknown"
    && !candidate.isStaging;
}

function newOnlyVisibleCard(candidate: AssetCandidate) {
  return publicVisibleByNewFilter(candidate) && !candidate.previousFilterMatched;
}

function toSampleItem(candidate: AssetCandidate): SampleItem {
  const signals = cardSignals(candidate);
  const rawCategory = attributeValue(candidate.attributes, "category");
  return {
    mint: candidate.mint,
    name: candidate.name,
    detectedCategory: candidate.category,
    assetType: candidate.assetType,
    publicGroup: candidate.publicGroup,
    sourceCollection: candidate.sourceCollection,
    sourceCollectionLabel: candidate.sourceCollectionLabel,
    collection: candidate.collection,
    rawNftCategoryAttribute: rawCategory,
    newFilterCardReason: signals.length
      ? `asset_type=card because metadata matched: ${signals.join(", ")}`
      : "asset_type=card from metadata/raw DAS fields, but no explicit review signal was extracted",
    oldFilterMissReason: rawCategory
      ? `old filter only accepted tracked Category attributes; raw Category=${rawCategory} was not recognized`
      : "old filter did not match because no tracked Category attribute was found",
    imageExists: Boolean(candidate.image),
  };
}

function reservoirPush<T>(items: T[], item: T, seenCount: number, sampleSize: number) {
  if (sampleSize <= 0) return;
  if (items.length < sampleSize) {
    items.push(item);
    return;
  }
  const index = Math.floor(Math.random() * seenCount);
  if (index < sampleSize) items[index] = item;
}

function addLimitedSample(target: Record<string, SampleItem[]>, key: string, item: SampleItem, limit: number) {
  const list = target[key] ?? [];
  if (list.length < limit) {
    list.push(item);
    target[key] = list;
  }
}

function reportPathFor(sourceReportPath: string) {
  const directory = dirname(sourceReportPath);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
  return join(directory, `nft-filter-sample-review-${stamp}.json`);
}

function readSourceReport(path: string): SourceReport {
  return JSON.parse(readFileSync(path, "utf8")) as SourceReport;
}

async function main() {
  const sourceReportPath = arg("--report");
  if (!sourceReportPath) throw new Error("Missing --report=/app/data/ingestion-reports/...");
  const sampleSize = numberArg("--sampleSize", 100);
  const delayMs = numberArg("--delayMs", 250);
  const sourceReport = readSourceReport(sourceReportPath);
  const collections = (sourceReport.collections ?? [])
    .filter((collection) => collection.collectionAddress && collection.pagesScanned > 0)
    .map((collection) => ({
      collectionAddress: collection.collectionAddress,
      market: collection.market,
      label: collection.label,
      pagesScanned: collection.pagesScanned,
    }));

  if (!collections.length) throw new Error("Source report has no scanned collections.");

  const randomSample: SampleItem[] = [];
  const topCategorySamples: Record<string, SampleItem[]> = {};
  const categoryExamples: Record<string, SampleItem[]> = {};
  const unknownCardExamples: SampleItem[] = [];
  const categoryCounts: Record<string, number> = {};
  const strongCardSignalCounts: Record<string, number> = {};
  const seenMints = new Set<string>();
  let scannedPages = 0;
  let scannedAssets = 0;
  let newOnlyVisibleCount = 0;
  let strongCardSignalTotal = 0;
  let weakCardSignalCount = 0;
  let unknownCategoryCount = 0;
  let missingImageCount = 0;
  let missingNameCount = 0;

  for (const collection of collections) {
    const config: TargetNftCollectionConfig = {
      collectionAddress: collection.collectionAddress,
      market: collection.market,
      label: collection.label,
    };
    console.log(`[NFT FILTER REVIEW] Collection ${collection.label} ${collection.collectionAddress}`);

    for (let page = 1; page <= collection.pagesScanned; page += 1) {
      const result = await heliusAssetsPage(collection.collectionAddress, page, PAGE_LIMIT);
      scannedPages += 1;
      scannedAssets += result.items.length;
      console.log(`[NFT FILTER REVIEW] page=${page}/${collection.pagesScanned} assets=${result.items.length} scanned=${scannedAssets} newOnlyVisible=${newOnlyVisibleCount}`);

      for (const raw of result.items) {
        const candidate = normalizeNftUniverseAsset(raw, config);
        if (!candidate || seenMints.has(candidate.mint)) continue;
        seenMints.add(candidate.mint);

        const unknownNewOnlyCard = candidate.assetType === "card"
          && candidate.category === "unknown"
          && !candidate.previousFilterMatched
          && !candidate.isStaging;

        if (unknownNewOnlyCard && unknownCardExamples.length < 20) {
          unknownCardExamples.push(toSampleItem(candidate));
        }

        if (!newOnlyVisibleCard(candidate)) continue;

        newOnlyVisibleCount += 1;
        addCount(categoryCounts, candidate.category);
        if (!candidate.image) missingImageCount += 1;
        if (!candidate.name) missingNameCount += 1;
        if (candidate.category === "unknown") unknownCategoryCount += 1;

        const signals = cardSignals(candidate);
        if (signals.length) {
          strongCardSignalTotal += 1;
          for (const signal of signals) addCount(strongCardSignalCounts, signal);
        } else {
          weakCardSignalCount += 1;
        }

        const sampleItem = toSampleItem(candidate);
        reservoirPush(randomSample, sampleItem, newOnlyVisibleCount, sampleSize);
        addLimitedSample(topCategorySamples, candidate.category, sampleItem, 10);
        if (CATEGORY_EXAMPLES.includes(candidate.category)) addLimitedSample(categoryExamples, candidate.category, sampleItem, 10);
      }

      await sleep(delayMs);
    }
  }

  for (const category of ALLOWED_RWA_NFT_CATEGORIES) {
    categoryExamples[category] ??= [];
  }
  categoryExamples.unknown ??= [];

  const reportPath = reportPathFor(sourceReportPath);
  const reviewReport: ReviewReport = {
    sourceReportPath,
    sampleSize,
    generatedAt: new Date().toISOString(),
    scannedPages,
    scannedAssets,
    newOnlyVisibleCount,
    expectedNewOnlyVisibleCount: sourceReport.comparison?.newVisibleCardAssetsMissedByPreviousFilter ?? null,
    categoryCounts,
    strongCardSignalCounts,
    strongCardSignalTotal,
    weakCardSignalCount,
    unknownCategoryCount,
    missingImageCount,
    missingNameCount,
    randomSample,
    topCategorySamples: Object.fromEntries(
      Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([category]) => [category, topCategorySamples[category] ?? []]),
    ),
    categoryExamples,
    unknownCardExamples,
    notes: [
      "No database writes are performed by this script.",
      "New-only visible cards are assets where asset_type=card, category is allowed and non-unknown, is_staging=false, and the previous Category-attribute filter did not match.",
      "Unknown category card examples are reported separately because they are hidden from public pages by default.",
    ],
    reportPath,
  };

  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(reviewReport, null, 2));

  console.log("NFT filter sample review:");
  console.log(`source report: ${sourceReportPath}`);
  console.log(`review report: ${reportPath}`);
  console.log(`scanned pages: ${scannedPages}`);
  console.log(`scanned assets: ${scannedAssets}`);
  console.log(`new-only visible cards: ${newOnlyVisibleCount}`);
  console.log(`expected from source report: ${reviewReport.expectedNewOnlyVisibleCount ?? "unknown"}`);
  console.log(`category counts: ${JSON.stringify(categoryCounts)}`);
  console.log(`strong card signal total: ${strongCardSignalTotal}`);
  console.log(`strong card signal counts: ${JSON.stringify(strongCardSignalCounts)}`);
  console.log(`weak card signal count: ${weakCardSignalCount}`);
  console.log(`category unknown among visible cards: ${unknownCategoryCount}`);
  console.log(`missing image: ${missingImageCount}`);
  console.log(`missing name: ${missingNameCount}`);
  console.log(`unknown card examples outside public visible: ${unknownCardExamples.length}`);
}

main().catch((error) => {
  console.error(`[NFT FILTER REVIEW] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
