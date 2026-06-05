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
      events.price_sol,
      events.price_usd,
      events.marketplace,
      events.tx_signature,
      events.event_at,
      events.source
    FROM rwa_nft_events events
    JOIN nft_assets assets ON assets.mint = events.mint
    WHERE events.event_type = 'SALE'
    ORDER BY events.event_at DESC
    LIMIT 10
  `);

  console.log(JSON.stringify({
    totalSaleEvents: scalar("SELECT COUNT(*) AS count FROM rwa_nft_events WHERE event_type = 'SALE'"),
    totalVerifiedSalesVisible: scalar(`
      SELECT COUNT(*) AS count
      FROM rwa_nft_events events
      JOIN nft_assets assets ON assets.mint = events.mint
      WHERE ${visibleWhere}
    `, ...allowedParams),
    latest10VisibleVerifiedSales: visible.sales,
    latest10SaleEvents: latest,
    excluded,
  }, null, 2));
}

main().catch((error) => {
  console.error(`[RWA MARKET] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
