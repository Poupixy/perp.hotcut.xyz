import { getAllowedNftCollections } from "../src/services/trackedNftsConfig";
import { getNftDb, nftDatabasePath } from "../src/services/nftSqliteDb";
import { nftDbExtendedStats } from "../src/services/nftCollectionIngestionService";
import { existsSync, statSync } from "node:fs";

function scalar(sql: string, ...params: unknown[]) {
  const row = getNftDb().prepare(sql).get(...params);
  return Number(row?.count ?? 0);
}

function main() {
  const database = getNftDb();
  const stats = nftDbExtendedStats();
  const categories = database.prepare("SELECT COALESCE(category, 'unknown') AS category, COUNT(*) AS count FROM nft_assets GROUP BY COALESCE(category, 'unknown') ORDER BY count DESC").all();
  const queue = database.prepare("SELECT * FROM queue_state WHERE id = 'default'").get() as Record<string, unknown> | undefined;
  const dbPath = nftDatabasePath();
  console.log("database status: ready");
  console.log(`database path: ${dbPath}`);
  console.log(`database size bytes: ${existsSync(dbPath) ? statSync(dbPath).size : 0}`);
  console.log(`tracked_nfts count: ${scalar("SELECT COUNT(*) AS count FROM tracked_nfts")}`);
  console.log(`nft_assets count: ${scalar("SELECT COUNT(*) AS count FROM nft_assets")}`);
  console.log(`queue_state status: ${JSON.stringify(queue)}`);
  console.log(`allowed collections count: ${getAllowedNftCollections().length}`);
  console.log(`category counts: ${JSON.stringify(categories)}`);
  console.log(`staging NFTs count: ${scalar("SELECT COUNT(*) AS count FROM nft_assets WHERE is_staging = 1")}`);
  console.log(`unknown NFTs count: ${scalar("SELECT COUNT(*) AS count FROM nft_assets WHERE category IS NULL OR category = 'unknown'")}`);
  console.log(`visible public NFT count: ${stats.visiblePublicNftCount}`);
  console.log(`source_collection counts: ${JSON.stringify(stats.sourceCollectionCounts)}`);
  console.log(`NFTs missing image: ${stats.missingImageCount}`);
  console.log(`NFTs missing name: ${stats.missingNameCount}`);
  console.log(`NFTs missing owner: ${stats.missingOwnerCount}`);
  console.log(`duplicate mint count: ${stats.duplicateMintCount}`);
  console.log(`ingestion state: ${JSON.stringify({
    running: Boolean(queue?.ingestion_running),
    currentCollection: queue?.ingestion_current_collection ?? null,
    currentPage: queue?.ingestion_current_page ?? null,
    inserted: queue?.ingestion_inserted ?? 0,
    updated: queue?.ingestion_updated ?? 0,
    duplicatesSkipped: queue?.ingestion_duplicates_skipped ?? 0,
    lastError: queue?.ingestion_last_error ?? null,
  })}`);
  console.log(`latest ingestion report path: ${queue?.latest_ingestion_report_path ?? stats.latestIngestionReportPath ?? null}`);
  console.log(`latest universe comparison report path: ${queue?.latest_universe_comparison_report_path ?? stats.latestUniverseComparisonReportPath ?? null}`);
}

main();
