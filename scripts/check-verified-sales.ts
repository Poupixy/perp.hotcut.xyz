import { ALLOWED_RWA_NFT_CATEGORIES } from "../src/services/nftCategoryService";
import { getVerifiedSales } from "../src/services/rwaNftMarketEventService";
import { getNftDb } from "../src/services/nftSqliteDb";

function scalar(sql: string, ...params: unknown[]) {
  const row = getNftDb().prepare(sql).get(...params);
  return Number(row?.count ?? 0);
}

function rows(sql: string, ...params: unknown[]) {
  return getNftDb().prepare(sql).all(...params);
}

function hasValue(value: unknown) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function completenessScore(row: Record<string, unknown>) {
  return [
    hasValue(row.tx_signature) && !String(row.tx_signature).startsWith("TEST_SIGNATURE"),
    hasValue(row.buyer),
    hasValue(row.seller),
    typeof row.price_sol === "number",
    hasValue(row.marketplace),
    hasValue(row.event_at),
    hasValue(row.image),
    hasValue(row.name),
  ].filter(Boolean).length;
}

async function main() {
  const allowedPlaceholders = ALLOWED_RWA_NFT_CATEGORIES.map(() => "?").join(", ");
  const allowedParams = [...ALLOWED_RWA_NFT_CATEGORIES];
  const visible = await getVerifiedSales({ limit: 10, page: 1 });
  const visibleWhere = `
    events.event_type = 'SALE'
    AND events.tx_signature IS NOT NULL
    AND events.category IS NOT NULL
    AND events.category != 'unknown'
    AND events.category IN (${allowedPlaceholders})
    AND assets.is_staging = 0
  `;

  const excluded = {
    missingTxSignature: scalar("SELECT COUNT(*) AS count FROM rwa_nft_events WHERE event_type = 'SALE' AND tx_signature IS NULL"),
    mintNotFoundInNftAssets: scalar(`
      SELECT COUNT(*) AS count
      FROM rwa_nft_events events
      LEFT JOIN nft_assets assets ON assets.mint = events.mint
      WHERE events.event_type = 'SALE' AND assets.mint IS NULL
    `),
    unknownCategory: scalar(`
      SELECT COUNT(*) AS count
      FROM rwa_nft_events events
      LEFT JOIN nft_assets assets ON assets.mint = events.mint
      WHERE events.event_type = 'SALE'
        AND COALESCE(events.category, assets.category, 'unknown') = 'unknown'
    `),
    stagingNft: scalar(`
      SELECT COUNT(*) AS count
      FROM rwa_nft_events events
      JOIN nft_assets assets ON assets.mint = events.mint
      WHERE events.event_type = 'SALE' AND assets.is_staging = 1
    `),
    categoryNotAllowed: scalar(`
      SELECT COUNT(*) AS count
      FROM rwa_nft_events events
      LEFT JOIN nft_assets assets ON assets.mint = events.mint
      WHERE events.event_type = 'SALE'
        AND COALESCE(events.category, assets.category) IS NOT NULL
        AND COALESCE(events.category, assets.category) != 'unknown'
        AND COALESCE(events.category, assets.category) NOT IN (${allowedPlaceholders})
    `, ...allowedParams),
  };

  const latest = rows(`
    SELECT
      events.id,
      events.mint,
      events.category,
      assets.name,
      assets.image,
      events.price_sol,
      events.price_usd,
      events.marketplace,
      events.tx_signature,
      events.buyer,
      events.seller,
      events.event_at,
      events.source
    FROM rwa_nft_events events
    JOIN nft_assets assets ON assets.mint = events.mint
    WHERE events.event_type = 'SALE'
    ORDER BY events.event_at DESC
    LIMIT 10
  `);

  const totalVisibleSales = scalar(`
      SELECT COUNT(*) AS count
      FROM rwa_nft_events events
      JOIN nft_assets assets ON assets.mint = events.mint
      WHERE ${visibleWhere}
    `, ...allowedParams);

  console.log(JSON.stringify({
    totalSaleEvents: scalar("SELECT COUNT(*) AS count FROM rwa_nft_events WHERE event_type = 'SALE'"),
    totalVisibleSales,
    totalVerifiedSalesVisible: totalVisibleSales,
    manualTestSales: scalar(`
      SELECT COUNT(*) AS count
      FROM rwa_nft_events events
      JOIN nft_assets assets ON assets.mint = events.mint
      WHERE ${visibleWhere}
        AND (events.source = 'manual' OR events.tx_signature LIKE 'TEST_SIGNATURE%')
    `, ...allowedParams),
    onChainVerifiedSales: scalar(`
      SELECT COUNT(*) AS count
      FROM rwa_nft_events events
      JOIN nft_assets assets ON assets.mint = events.mint
      WHERE ${visibleWhere}
        AND events.source IN ('helius_enhanced_tx', 'helius_webhook', 'magiceden', 'tensor')
        AND events.tx_signature NOT LIKE 'TEST_SIGNATURE%'
    `, ...allowedParams),
    salesMissingBuyer: scalar(`SELECT COUNT(*) AS count FROM rwa_nft_events WHERE event_type = 'SALE' AND tx_signature IS NOT NULL AND buyer IS NULL`),
    salesMissingSeller: scalar(`SELECT COUNT(*) AS count FROM rwa_nft_events WHERE event_type = 'SALE' AND tx_signature IS NOT NULL AND seller IS NULL`),
    salesMissingUsd: scalar(`SELECT COUNT(*) AS count FROM rwa_nft_events WHERE event_type = 'SALE' AND tx_signature IS NOT NULL AND price_usd IS NULL`),
    salesWithTestTxSignatures: scalar(`SELECT COUNT(*) AS count FROM rwa_nft_events WHERE event_type = 'SALE' AND tx_signature LIKE 'TEST_SIGNATURE%'`),
    latest10VisibleVerifiedSales: visible.sales,
    latest10SaleEvents: latest.map((row) => ({ ...row, completenessScore: completenessScore(row) })),
    excluded,
  }, null, 2));
}

main().catch((error) => {
  console.error(`[RWA MARKET] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
