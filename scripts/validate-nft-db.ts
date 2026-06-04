import { getAllowedNftCollections } from "../src/services/trackedNftsConfig";
import { getNftDb, nftDatabasePath } from "../src/services/nftSqliteDb";

function scalar(sql: string, ...params: unknown[]) {
  const row = getNftDb().prepare(sql).get(...params);
  return Number(row?.count ?? 0);
}

function main() {
  const database = getNftDb();
  const categories = database.prepare("SELECT COALESCE(category, 'unknown') AS category, COUNT(*) AS count FROM nft_assets GROUP BY COALESCE(category, 'unknown') ORDER BY count DESC").all();
  const queue = database.prepare("SELECT queue_json, processing, last_helius_call_at, backoff_until FROM queue_state WHERE id = 'default'").get();
  console.log("database status: ready");
  console.log(`database path: ${nftDatabasePath()}`);
  console.log(`tracked_nfts count: ${scalar("SELECT COUNT(*) AS count FROM tracked_nfts")}`);
  console.log(`nft_assets count: ${scalar("SELECT COUNT(*) AS count FROM nft_assets")}`);
  console.log(`queue_state status: ${JSON.stringify(queue)}`);
  console.log(`allowed collections count: ${getAllowedNftCollections().length}`);
  console.log(`category counts: ${JSON.stringify(categories)}`);
  console.log(`staging NFTs count: ${scalar("SELECT COUNT(*) AS count FROM nft_assets WHERE is_staging = 1")}`);
  console.log(`unknown NFTs count: ${scalar("SELECT COUNT(*) AS count FROM nft_assets WHERE category IS NULL OR category = 'unknown'")}`);
}

main();
