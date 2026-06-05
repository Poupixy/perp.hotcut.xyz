import {
  backupNftDatabase,
  calculatePriceGrowthBatch,
  type PriceGrowthCalculation,
} from "../src/services/rwaNftPriceGrowthService";

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

function numberArg(name: string, fallback: number) {
  const value = Number(arg(name));
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : fallback;
}

function short(value: string | null | undefined) {
  if (!value) return null;
  return value.length <= 14 ? value : `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function summarize(results: PriceGrowthCalculation[]) {
  return {
    checked: results.length,
    calculated: results.filter((row) => row.priceChangeDirection !== "unknown").length,
    withoutPreviousSale: results.filter((row) => row.reason === "no previous sale with same payment symbol").length,
    missingPaymentData: results.filter((row) => row.reason === "missing payment symbol or amount").length,
    paymentSymbolMismatch: results.filter((row) => row.reason === "payment symbol mismatch").length,
    up: results.filter((row) => row.priceChangeDirection === "up").length,
    down: results.filter((row) => row.priceChangeDirection === "down").length,
    flat: results.filter((row) => row.priceChangeDirection === "flat").length,
    unknown: results.filter((row) => row.priceChangeDirection === "unknown").length,
    updated: results.filter((row) => row.updated).length,
  };
}

async function main() {
  const dryRun = boolArg("--dryRun", true);
  const skipBackup = boolArg("--skipBackup", false);
  const limit = numberArg("--limit", 100);
  const mint = arg("--mint") ?? null;
  const category = arg("--category") ?? null;
  let backupPath: string | null = null;

  if (!dryRun && !skipBackup) {
    backupPath = backupNftDatabase();
  }

  const results = calculatePriceGrowthBatch({ dryRun, limit, mint, category });

  console.log(JSON.stringify({
    dryRun,
    limit,
    mint,
    category,
    backupPath,
    ...summarize(results),
    results: results.map((row) => ({
      eventId: row.eventId,
      tx: short(row.txSignature),
      mint: short(row.mint),
      payment: row.paymentAmount !== null && row.paymentSymbol ? `${row.paymentAmount} ${row.paymentSymbol}` : null,
      previousSale: row.previousSaleAmount !== null && row.previousSaleSymbol
        ? `${row.previousSaleAmount} ${row.previousSaleSymbol}`
        : null,
      previousTx: short(row.previousSaleTxSignature),
      priceChangeAmount: row.priceChangeAmount,
      priceChangePercent: row.priceChangePercent,
      direction: row.priceChangeDirection,
      reason: row.reason,
      updated: Boolean(row.updated),
    })),
  }, null, 2));
}

main().catch((error) => {
  console.error(`[RWA MARKET] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
