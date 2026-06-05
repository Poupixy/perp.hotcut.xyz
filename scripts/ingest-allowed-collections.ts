import { formatIngestionSummary, ingestAllowedCollections } from "../src/services/nftCollectionIngestionService";

function arg(name: string) {
  const prefix = `${name}=`;
  const match = process.argv.slice(2).find((item) => item.startsWith(prefix));
  if (match) return match.slice(prefix.length);
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function boolArg(name: string, fallback: boolean) {
  const value = arg(name);
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
}

function numberArg(name: string): number | null {
  const raw = arg(name);
  if (raw === undefined || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : null;
}

async function main() {
  const report = await ingestAllowedCollections({
    dryRun: boolArg("--dryRun", true),
    limitPages: numberArg("--limitPages"),
    limitAssets: numberArg("--limitAssets"),
    collection: arg("--collection") ?? null,
    delayMs: numberArg("--delayMs") ?? 30_000,
    resume: boolArg("--resume", true),
    includeStaging: boolArg("--includeStaging", false),
    storeRaw: boolArg("--storeRaw", false),
    compareUniverse: boolArg("--compareUniverse", true),
  });

  console.log(formatIngestionSummary(report));
  console.log(JSON.stringify({
    reportPath: report.reportPath,
    totals: report.totals,
    comparison: report.comparison,
    collections: report.collections.map((collection) => ({
      label: collection.label,
      collectionAddress: collection.collectionAddress,
      heliusReportedTotal: collection.heliusReportedTotal,
      pagesScanned: collection.pagesScanned,
      assetsSeen: collection.assetsSeen,
      previousFilterMatchedAssets: collection.previousFilterMatchedAssets,
      visibleAfterPublicFilters: collection.visibleAfterPublicFilters,
      wouldInsert: collection.wouldInsert,
      wouldUpdate: collection.wouldUpdate,
      unknownCategoryAssets: collection.unknownCategoryAssets,
      stagingAssets: collection.stagingAssets,
      categoryCounts: collection.categoryCounts,
      excluded: collection.excluded,
      errors: collection.errors,
    })),
  }, null, 2));
}

main().catch((error) => {
  console.error(`[NFT INGESTION] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
