import { ALLOWED_RWA_NFT_CATEGORIES } from "../src/services/nftCategoryService";
import { getVerifiedSales } from "../src/services/rwaNftMarketEventService";
import { getNftDb, parseJson } from "../src/services/nftSqliteDb";

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

function fallbackVerified(row: Record<string, unknown>) {
  const raw = parseJson(row.raw_payload_json, null);
  const payload = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  const metadata = payload._perpRwa && typeof payload._perpRwa === "object" && !Array.isArray(payload._perpRwa)
    ? payload._perpRwa as Record<string, unknown>
    : {};
  return metadata.fallbackVerified === true;
}

function short(value: unknown) {
  const text = typeof value === "string" ? value : "";
  return text.length > 14 ? `${text.slice(0, 6)}...${text.slice(-4)}` : text;
}

async function main() {
  const allowedPlaceholders = ALLOWED_RWA_NFT_CATEGORIES.map(() => "?").join(", ");
  const allowedParams = [...ALLOWED_RWA_NFT_CATEGORIES];
  const visibleDefault = await getVerifiedSales({ limit: 20, page: 1 });
  const visibleIncludingTests = await getVerifiedSales({ limit: 20, page: 1, hideTestSales: false });
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
      events.payment_mint,
      events.payment_symbol,
      events.payment_amount,
      events.marketplace,
      events.tx_signature,
      events.buyer,
      events.seller,
      events.event_at,
      events.source
      , events.raw_payload_json
    FROM rwa_nft_events events
    JOIN nft_assets assets ON assets.mint = events.mint
    WHERE events.event_type = 'SALE'
    ORDER BY events.event_at DESC
    LIMIT 20
  `);

  const totalVisibleSalesIncludingTests = scalar(`
      SELECT COUNT(*) AS count
      FROM rwa_nft_events events
      JOIN nft_assets assets ON assets.mint = events.mint
      WHERE ${visibleWhere}
    `, ...allowedParams);
  const totalVisibleSalesDefault = scalar(`
      SELECT COUNT(*) AS count
      FROM rwa_nft_events events
      JOIN nft_assets assets ON assets.mint = events.mint
      WHERE ${visibleWhere}
        AND events.tx_signature NOT LIKE 'TEST_SIGNATURE%'
    `, ...allowedParams);

  console.log(JSON.stringify({
    totalSaleEvents: scalar("SELECT COUNT(*) AS count FROM rwa_nft_events WHERE event_type = 'SALE'"),
    totalVisibleSales: totalVisibleSalesDefault,
    totalVisibleSalesWithDefaultFilters: totalVisibleSalesDefault,
    totalVisibleSalesIncludingTestSales: totalVisibleSalesIncludingTests,
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
    fallbackVerifiedSales: rows(`
      SELECT events.raw_payload_json
      FROM rwa_nft_events events
      JOIN nft_assets assets ON assets.mint = events.mint
      WHERE ${visibleWhere}
    `, ...allowedParams).filter((row) => fallbackVerified(row)).length,
    solDenominatedSales: scalar(`
      SELECT COUNT(*) AS count
      FROM rwa_nft_events events
      JOIN nft_assets assets ON assets.mint = events.mint
      WHERE ${visibleWhere} AND events.payment_symbol = 'SOL'
    `, ...allowedParams),
    usdcDenominatedSales: scalar(`
      SELECT COUNT(*) AS count
      FROM rwa_nft_events events
      JOIN nft_assets assets ON assets.mint = events.mint
      WHERE ${visibleWhere} AND events.payment_symbol = 'USDC'
    `, ...allowedParams),
    unknownPaymentTokenSales: scalar(`
      SELECT COUNT(*) AS count
      FROM rwa_nft_events events
      JOIN nft_assets assets ON assets.mint = events.mint
      WHERE ${visibleWhere} AND events.payment_symbol = 'UNKNOWN'
    `, ...allowedParams),
    salesMissingPaymentSymbol: scalar(`
      SELECT COUNT(*) AS count
      FROM rwa_nft_events events
      JOIN nft_assets assets ON assets.mint = events.mint
      WHERE ${visibleWhere} AND events.payment_symbol IS NULL
    `, ...allowedParams),
    salesMissingPaymentAmount: scalar(`
      SELECT COUNT(*) AS count
      FROM rwa_nft_events events
      JOIN nft_assets assets ON assets.mint = events.mint
      WHERE ${visibleWhere} AND events.payment_amount IS NULL
    `, ...allowedParams),
    salesMissingBuyer: scalar(`SELECT COUNT(*) AS count FROM rwa_nft_events WHERE event_type = 'SALE' AND tx_signature IS NOT NULL AND buyer IS NULL`),
    salesMissingSeller: scalar(`SELECT COUNT(*) AS count FROM rwa_nft_events WHERE event_type = 'SALE' AND tx_signature IS NOT NULL AND seller IS NULL`),
    salesMissingUsdConversion: scalar(`SELECT COUNT(*) AS count FROM rwa_nft_events WHERE event_type = 'SALE' AND tx_signature IS NOT NULL AND price_usd IS NULL`),
    salesWithTestTxSignatures: scalar(`SELECT COUNT(*) AS count FROM rwa_nft_events WHERE event_type = 'SALE' AND tx_signature LIKE 'TEST_SIGNATURE%'`),
    salesByCategory: rows(`
      SELECT events.category, COUNT(*) AS count
      FROM rwa_nft_events events
      JOIN nft_assets assets ON assets.mint = events.mint
      WHERE ${visibleWhere}
      GROUP BY events.category
      ORDER BY count DESC
    `, ...allowedParams),
    salesByMarketplace: rows(`
      SELECT COALESCE(events.marketplace, 'unknown') AS marketplace, COUNT(*) AS count
      FROM rwa_nft_events events
      JOIN nft_assets assets ON assets.mint = events.mint
      WHERE ${visibleWhere}
      GROUP BY COALESCE(events.marketplace, 'unknown')
      ORDER BY count DESC
    `, ...allowedParams),
    salesBySource: rows(`
      SELECT events.source, COUNT(*) AS count
      FROM rwa_nft_events events
      JOIN nft_assets assets ON assets.mint = events.mint
      WHERE ${visibleWhere}
      GROUP BY events.source
      ORDER BY count DESC
    `, ...allowedParams),
    latest20VisibleVerifiedSales: visibleDefault.sales,
    latest20VisibleVerifiedSalesIncludingTests: visibleIncludingTests.sales,
    latest20Sales: latest.map((row) => ({
      nftName: row.name,
      category: row.category,
      payment: row.payment_amount !== null && row.payment_amount !== undefined && row.payment_symbol
        ? `${row.payment_amount} ${row.payment_symbol}`
        : null,
      source: row.source,
      marketplace: row.marketplace,
      fallbackVerified: fallbackVerified(row),
      tx: short(row.tx_signature),
      completenessScore: completenessScore(row),
    })),
    latest20SaleEvents: latest.map((row) => ({ ...row, fallbackVerified: fallbackVerified(row), completenessScore: completenessScore(row) })),
    excluded,
  }, null, 2));
}

main().catch((error) => {
  console.error(`[RWA MARKET] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
