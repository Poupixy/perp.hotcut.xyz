import { existsSync, readFileSync } from "node:fs";

type CountMap = Record<string, number>;

type CollectionSummary = {
  label?: string;
  collectionAddress?: string;
  assetsSeen?: number;
  previousFilterMatchedAssets?: number;
  previousFilterMatchedCards?: number;
  previousFilterMatchedOther?: number;
  previousFilterMatchedVisibleAssets?: number;
  visibleAfterPublicFilters?: number;
  newVisibleAssetsMissedByPreviousFilter?: number;
  newVisibleCardAssetsMissedByPreviousFilter?: number;
  newVisibleOtherAssetsMissedByPreviousFilter?: number;
  assetTypeCounts?: CountMap;
  publicGroupCounts?: CountMap;
  hiddenOtherAssets?: number;
};

type UniverseReport = {
  reportPath?: string;
  dryRun?: boolean;
  totals?: {
    heliusAssetsSeen?: number;
    previousFilterMatchedAssets?: number;
    previousFilterMatchedCards?: number;
    previousFilterMatchedOther?: number;
    previousFilterMatchedVisibleAssets?: number;
    visibleAfterPublicFilters?: number;
    newVisibleAssetsMissedByPreviousFilter?: number;
    newVisibleCardAssetsMissedByPreviousFilter?: number;
    newVisibleOtherAssetsMissedByPreviousFilter?: number;
    hiddenOtherAssets?: number;
    assetTypeCounts?: CountMap;
    publicGroupCounts?: CountMap;
    categoryCounts?: CountMap;
    cardCategoryCounts?: CountMap;
    otherCategoryCounts?: CountMap;
  };
  comparison?: {
    previousFilterMatchedAssets?: number;
    previousFilterMatchedCards?: number;
    previousFilterMatchedOther?: number;
    previousFilterMatchedVisibleAssets?: number;
    visibleAfterPublicFilters?: number;
    newVisibleAssetsMissedByPreviousFilter?: number;
    newVisibleCardAssetsMissedByPreviousFilter?: number;
    newVisibleOtherAssetsMissedByPreviousFilter?: number;
    difference?: number;
    matchesPreviousFilterInScannedPages?: boolean;
  };
  collections?: CollectionSummary[];
};

function arg(name: string) {
  const prefix = `${name}=`;
  const match = process.argv.slice(2).find((item) => item.startsWith(prefix));
  if (match) return match.slice(prefix.length);
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function count(map: CountMap | undefined, key: string) {
  return Number(map?.[key] ?? 0);
}

function number(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function pct(part: number, total: number) {
  if (!total) return "0.0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

function printMap(title: string, map: CountMap | undefined) {
  const entries = Object.entries(map ?? {}).sort((a, b) => b[1] - a[1]);
  console.log(`${title}: ${entries.length ? entries.map(([key, value]) => `${key}=${value}`).join(", ") : "none"}`);
}

function main() {
  const reportPath = arg("--report");
  if (!reportPath) {
    console.error("Missing --report=<path>");
    process.exitCode = 1;
    return;
  }
  if (!existsSync(reportPath)) {
    console.error(`Report not found: ${reportPath}`);
    process.exitCode = 1;
    return;
  }

  const report = JSON.parse(readFileSync(reportPath, "utf8")) as UniverseReport;
  const totals = report.totals ?? {};
  const comparison = report.comparison ?? {};
  const assetTypes = totals.assetTypeCounts ?? {};
  const publicGroups = totals.publicGroupCounts ?? {};

  const totalAssets = number(totals.heliusAssetsSeen);
  const cardCount = count(assetTypes, "card");
  const sealedCount = count(assetTypes, "sealed");
  const comicCount = count(assetTypes, "comic");
  const merchCount = count(assetTypes, "merch");
  const unknownAssetTypeCount = count(assetTypes, "unknown");
  const otherCount = count(publicGroups, "other") || sealedCount + comicCount + merchCount + unknownAssetTypeCount;
  const visibleCards = number(totals.visibleAfterPublicFilters);
  const previousMatched = number(totals.previousFilterMatchedAssets);
  const previousMatchedCards = number(totals.previousFilterMatchedCards);
  const previousMatchedOther = number(totals.previousFilterMatchedOther);
  const previousMatchedVisible = number(totals.previousFilterMatchedVisibleAssets);
  const newVisibleMissed = number(totals.newVisibleAssetsMissedByPreviousFilter ?? comparison.newVisibleAssetsMissedByPreviousFilter);
  const newVisibleCardsMissed = number(totals.newVisibleCardAssetsMissedByPreviousFilter ?? comparison.newVisibleCardAssetsMissedByPreviousFilter);
  const newVisibleOtherMissed = number(totals.newVisibleOtherAssetsMissedByPreviousFilter ?? comparison.newVisibleOtherAssetsMissedByPreviousFilter);

  console.log("NFT filter comparison");
  console.log(`report: ${reportPath}`);
  console.log(`dryRun: ${Boolean(report.dryRun)}`);
  console.log(`total assets found: ${totalAssets}`);
  console.log(`individual card NFTs: ${cardCount} (${pct(cardCount, totalAssets)})`);
  console.log(`sealed products: ${sealedCount}`);
  console.log(`comics: ${comicCount}`);
  console.log(`merch: ${merchCount}`);
  console.log(`unknown asset type: ${unknownAssetTypeCount}`);
  console.log(`public_group card: ${count(publicGroups, "card")}`);
  console.log(`public_group other: ${otherCount}`);
  console.log(`public visible cards: ${visibleCards}`);
  console.log(`hidden other assets: ${number(totals.hiddenOtherAssets) || otherCount}`);
  console.log("");
  console.log("Previous filter overlap");
  console.log(`old filter matched assets: ${previousMatched}`);
  console.log(`old filter matched cards: ${previousMatchedCards}`);
  console.log(`old filter matched non-card: ${previousMatchedOther}`);
  console.log(`old filter matched currently public-visible cards: ${previousMatchedVisible}`);
  console.log(`new public-visible assets missed by old filter: ${newVisibleMissed}`);
  console.log(`new public-visible individual cards missed by old filter: ${newVisibleCardsMissed}`);
  console.log(`new public-visible non-card assets missed by old filter: ${newVisibleOtherMissed}`);
  console.log(`public-visible difference vs old visible overlap: ${number(comparison.difference)}`);
  console.log(`matches old filter on scanned pages: ${Boolean(comparison.matchesPreviousFilterInScannedPages)}`);
  console.log("");
  printMap("asset_type counts", assetTypes);
  printMap("card-only category counts", totals.cardCategoryCounts);
  printMap("other category counts", totals.otherCategoryCounts);
  console.log("");

  if (newVisibleCardsMissed > 0 && newVisibleOtherMissed === 0) {
    console.log("Conclusion: the new public-visible difference is coming from individual cards that the older filter missed, not non-card assets.");
  } else if (newVisibleOtherMissed > 0) {
    console.log("Conclusion: some of the difference is caused by non-card assets. Review asset_type counts before writing to the database.");
  } else if (newVisibleMissed === 0) {
    console.log("Conclusion: the current public card filter matches the previously visible filter on the scanned pages.");
  } else {
    console.log("Conclusion: the report does not contain enough overlap detail to fully explain the difference.");
  }
}

main();
