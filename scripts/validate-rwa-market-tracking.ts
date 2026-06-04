import { getNftDb } from "../src/services/nftSqliteDb";

function rows(sql: string, ...params: unknown[]) {
  return getNftDb().prepare(sql).all(...params);
}

function scalar(sql: string, ...params: unknown[]) {
  const row = getNftDb().prepare(sql).get(...params);
  return Number(row?.count ?? 0);
}

function main() {
  console.log(`total NFTs tracked: ${scalar("SELECT COUNT(*) AS count FROM nft_assets WHERE is_staging = 0 AND category != 'unknown'")}`);
  console.log(`total active listings: ${scalar("SELECT COUNT(*) AS count FROM nft_assets WHERE is_listed = 1 AND is_staging = 0 AND category != 'unknown'")}`);
  console.log(`total sales events: ${scalar("SELECT COUNT(*) AS count FROM rwa_nft_events WHERE event_type = 'SALE'")}`);
  console.log(`latest 20 verified sales: ${JSON.stringify(rows("SELECT mint, category, price_sol, price_usd, marketplace, tx_signature, event_at, source FROM rwa_nft_events WHERE event_type = 'SALE' AND tx_signature IS NOT NULL ORDER BY event_at DESC LIMIT 20"), null, 2)}`);
  console.log(`latest 20 listings: ${JSON.stringify(rows("SELECT mint, category, listed_price_sol, listing_marketplace, listing_updated_at FROM nft_assets WHERE is_listed = 1 ORDER BY listing_updated_at DESC LIMIT 20"), null, 2)}`);
  console.log(`count by category: ${JSON.stringify(rows("SELECT COALESCE(category, 'unknown') AS category, COUNT(*) AS count FROM nft_assets GROUP BY COALESCE(category, 'unknown') ORDER BY count DESC"), null, 2)}`);
  console.log(`unknown NFTs ignored count: ${scalar("SELECT COUNT(*) AS count FROM nft_assets WHERE category IS NULL OR category = 'unknown'")}`);
  console.log(`staging NFTs ignored count: ${scalar("SELECT COUNT(*) AS count FROM nft_assets WHERE is_staging = 1")}`);
  console.log(`events missing tx_signature count: ${scalar("SELECT COUNT(*) AS count FROM rwa_nft_events WHERE tx_signature IS NULL")}`);
}

main();
