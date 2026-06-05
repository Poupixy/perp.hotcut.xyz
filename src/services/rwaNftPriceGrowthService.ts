import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { getNftDb, nftDatabasePath } from "./nftSqliteDb";

export type PriceChangeDirection = "up" | "down" | "flat" | "unknown";

type SaleGrowthRow = {
  id: string;
  mint: string;
  category: string | null;
  tx_signature: string | null;
  payment_symbol: string | null;
  payment_amount: number | null;
  event_at: string | null;
  previous_sale_event_id: string | null;
  previous_sale_tx_signature: string | null;
  previous_sale_amount: number | null;
  previous_sale_symbol: string | null;
  price_change_amount: number | null;
  price_change_percent: number | null;
  price_change_direction: PriceChangeDirection | null;
};

export type PriceGrowthCalculation = {
  eventId: string;
  mint: string;
  txSignature: string | null;
  paymentSymbol: string | null;
  paymentAmount: number | null;
  previousSaleEventId: string | null;
  previousSaleTxSignature: string | null;
  previousSaleAmount: number | null;
  previousSaleSymbol: string | null;
  priceChangeAmount: number | null;
  priceChangePercent: number | null;
  priceChangeDirection: PriceChangeDirection;
  calculatedAt: string;
  reason: string;
  writable: boolean;
  updated?: boolean;
};

export type PriceGrowthBatchOptions = {
  dryRun?: boolean;
  limit?: number;
  mint?: string | null;
  category?: string | null;
};

function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function hasPayment(row: SaleGrowthRow) {
  return Boolean(row.payment_symbol && typeof row.payment_amount === "number" && Number.isFinite(row.payment_amount));
}

function loadSale(eventId: string) {
  return getNftDb().prepare(`
    SELECT id, mint, category, tx_signature, payment_symbol, payment_amount, event_at,
      previous_sale_event_id, previous_sale_tx_signature, previous_sale_amount, previous_sale_symbol,
      price_change_amount, price_change_percent, price_change_direction
    FROM rwa_nft_events
    WHERE id = ? AND event_type = 'SALE'
    LIMIT 1
  `).get(eventId) as SaleGrowthRow | undefined;
}

function loadPreviousSale(row: SaleGrowthRow) {
  return getNftDb().prepare(`
    SELECT id, mint, category, tx_signature, payment_symbol, payment_amount, event_at,
      previous_sale_event_id, previous_sale_tx_signature, previous_sale_amount, previous_sale_symbol,
      price_change_amount, price_change_percent, price_change_direction
    FROM rwa_nft_events
    WHERE event_type = 'SALE'
      AND mint = ?
      AND payment_symbol = ?
      AND payment_amount IS NOT NULL
      AND event_at < ?
      AND id != ?
      AND COALESCE(tx_signature, '') != COALESCE(?, '')
    ORDER BY event_at DESC, created_at DESC
    LIMIT 1
  `).get(row.mint, row.payment_symbol, row.event_at, row.id, row.tx_signature) as SaleGrowthRow | undefined;
}

function buildUnknown(row: SaleGrowthRow, reason: string): PriceGrowthCalculation {
  return {
    eventId: row.id,
    mint: row.mint,
    txSignature: row.tx_signature,
    paymentSymbol: row.payment_symbol,
    paymentAmount: asFiniteNumber(row.payment_amount),
    previousSaleEventId: null,
    previousSaleTxSignature: null,
    previousSaleAmount: null,
    previousSaleSymbol: null,
    priceChangeAmount: null,
    priceChangePercent: null,
    priceChangeDirection: "unknown",
    calculatedAt: new Date().toISOString(),
    reason,
    writable: true,
  };
}

function calculate(row: SaleGrowthRow): PriceGrowthCalculation {
  if (!row.mint) return buildUnknown(row, "missing mint");
  if (!row.event_at) return buildUnknown(row, "missing event timestamp");
  if (!hasPayment(row)) return buildUnknown(row, "missing payment symbol or amount");

  const previous = loadPreviousSale(row);
  if (!previous) return buildUnknown(row, "no previous sale with same payment symbol");

  const currentAmount = asFiniteNumber(row.payment_amount);
  const previousAmount = asFiniteNumber(previous.payment_amount);
  if (currentAmount === null || previousAmount === null || !previous.payment_symbol) {
    return {
      ...buildUnknown(row, "previous sale missing payment data"),
      previousSaleEventId: previous.id,
      previousSaleTxSignature: previous.tx_signature,
      previousSaleAmount: previousAmount,
      previousSaleSymbol: previous.payment_symbol,
    };
  }

  if (previous.payment_symbol !== row.payment_symbol) {
    return buildUnknown(row, "payment symbol mismatch");
  }

  if (previousAmount === 0) {
    return {
      ...buildUnknown(row, "previous sale amount is zero"),
      previousSaleEventId: previous.id,
      previousSaleTxSignature: previous.tx_signature,
      previousSaleAmount: previousAmount,
      previousSaleSymbol: previous.payment_symbol,
    };
  }

  const amount = currentAmount - previousAmount;
  const percent = (amount / previousAmount) * 100;
  const direction: PriceChangeDirection = amount > 0 ? "up" : amount < 0 ? "down" : "flat";
  return {
    eventId: row.id,
    mint: row.mint,
    txSignature: row.tx_signature,
    paymentSymbol: row.payment_symbol,
    paymentAmount: currentAmount,
    previousSaleEventId: previous.id,
    previousSaleTxSignature: previous.tx_signature,
    previousSaleAmount: previousAmount,
    previousSaleSymbol: previous.payment_symbol,
    priceChangeAmount: amount,
    priceChangePercent: percent,
    priceChangeDirection: direction,
    calculatedAt: new Date().toISOString(),
    reason: "calculated from previous same-token sale",
    writable: true,
  };
}

export function writePriceGrowth(calculation: PriceGrowthCalculation) {
  getNftDb().prepare(`
    UPDATE rwa_nft_events SET
      previous_sale_event_id = ?,
      previous_sale_tx_signature = ?,
      previous_sale_amount = ?,
      previous_sale_symbol = ?,
      price_change_amount = ?,
      price_change_percent = ?,
      price_change_direction = ?,
      price_change_calculated_at = ?
    WHERE id = ?
  `).run(
    calculation.previousSaleEventId,
    calculation.previousSaleTxSignature,
    calculation.previousSaleAmount,
    calculation.previousSaleSymbol,
    calculation.priceChangeAmount,
    calculation.priceChangePercent,
    calculation.priceChangeDirection,
    calculation.calculatedAt,
    calculation.eventId,
  );
}

export function calculatePriceGrowthForSale(eventId: string, options: { dryRun?: boolean } = {}) {
  const row = loadSale(eventId);
  if (!row) throw new Error(`SALE event not found: ${eventId}`);
  const calculation = calculate(row);
  if (!options.dryRun && calculation.writable) {
    writePriceGrowth(calculation);
    calculation.updated = true;
  }
  return calculation;
}

export function calculatePriceGrowthForMint(mint: string, options: { dryRun?: boolean; limit?: number } = {}) {
  const limit = Math.min(Math.max(Math.trunc(options.limit ?? 100), 1), 500);
  const rows = getNftDb().prepare(`
    SELECT id
    FROM rwa_nft_events
    WHERE event_type = 'SALE' AND mint = ?
    ORDER BY event_at ASC
    LIMIT ?
  `).all(mint, limit) as Array<{ id: string }>;
  return rows.map((row) => calculatePriceGrowthForSale(row.id, { dryRun: options.dryRun ?? true }));
}

export function calculatePriceGrowthBatch(options: PriceGrowthBatchOptions = {}) {
  const limit = Math.min(Math.max(Math.trunc(options.limit ?? 100), 1), 500);
  const where = ["event_type = 'SALE'"];
  const params: unknown[] = [];
  if (options.mint) {
    where.push("mint = ?");
    params.push(options.mint);
  }
  if (options.category && options.category !== "all") {
    where.push("category = ?");
    params.push(options.category);
  }
  params.push(limit);

  const rows = getNftDb().prepare(`
    SELECT id
    FROM rwa_nft_events
    WHERE ${where.join(" AND ")}
    ORDER BY event_at ASC
    LIMIT ?
  `).all(...params) as Array<{ id: string }>;

  return rows.map((row) => calculatePriceGrowthForSale(row.id, { dryRun: options.dryRun ?? true }));
}

export function backupNftDatabase(prefix = "perp-rwa.backup-before-price-growth") {
  const source = nftDatabasePath();
  if (!existsSync(source)) throw new Error(`SQLite database not found: ${source}`);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
  const target = join(dirname(source), `${prefix}-${stamp}.sqlite`);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
  return target;
}
