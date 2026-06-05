import { enrichAndSaveSaleFromTxSignature } from "../src/services/heliusSaleEnrichmentService";
import { ALLOWED_RWA_NFT_CATEGORIES } from "../src/services/nftCategoryService";

function arg(name: string) {
  const prefix = `${name}=`;
  const match = process.argv.slice(2).find((item) => item.startsWith(prefix));
  if (match) return match.slice(prefix.length);
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function requiredArg(name: string) {
  const value = arg(name);
  if (!value?.trim()) throw new Error(`${name} is required`);
  return value.trim();
}

function boolArg(name: string) {
  const value = arg(name);
  return value === "true" || value === "1";
}

async function main() {
  const tx = requiredArg("--tx");
  const mint = arg("--mint")?.trim() || null;
  const market = arg("--market")?.trim() || null;
  const force = boolArg("--force");

  if (market && !ALLOWED_RWA_NFT_CATEGORIES.includes(market as never)) {
    throw new Error(`category is not allowed: ${market}. Allowed categories: ${ALLOWED_RWA_NFT_CATEGORIES.join(", ")}`);
  }

  const result = await enrichAndSaveSaleFromTxSignature(tx, { mint, market, force });
  console.log(JSON.stringify({
    txSignature: result.txSignature,
    detectedMint: result.detectedMint,
    nftName: result.nftName,
    priceSol: result.priceSol,
    priceUsd: result.priceUsd,
    buyer: result.buyer,
    seller: result.seller,
    marketplace: result.marketplace,
    eventTimestamp: result.eventTimestamp,
    source: result.source,
    saveStatus: result.saveStatus,
    visibleOnVerifiedSales: result.visibleOnVerifiedSales,
    saleEvent: result.saleEvent,
    nftAsset: result.nftAsset,
  }, null, 2));
}

main().catch((error) => {
  console.error(`[RWA MARKET] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
