import { parseHeliusEnhancedTransaction } from "../src/services/heliusEnhancedTransactionParser";
import { getNftDb, parseJson } from "../src/services/nftSqliteDb";

const HELIUS_ENHANCED_TX_URL = "https://api.helius.xyz/v0/transactions/";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

type RuntimeEnv = Record<string, string | undefined>;

type SaleRow = {
  id: string;
  mint: string;
  tx_signature: string;
  price_sol: number | null;
  price_usd: number | null;
  payment_mint: string | null;
  payment_symbol: string | null;
  payment_amount: number | null;
  raw_payload_json: string | null;
};

function env(): RuntimeEnv {
  return (globalThis as unknown as { process?: { env?: RuntimeEnv } }).process?.env ?? {};
}

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function short(value: string | null | undefined) {
  if (!value) return "";
  return value.length <= 14 ? value : `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function fallbackFromStoredPrices(row: SaleRow) {
  if (typeof row.price_sol === "number") {
    return { paymentMint: null, paymentSymbol: "SOL", paymentAmount: row.price_sol, source: "stored_price_sol" };
  }
  return { paymentMint: null, paymentSymbol: null, paymentAmount: null, source: "unresolved" };
}

async function fetchEnhancedTransaction(txSignature: string) {
  const apiKey = env().HELIUS_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(`${HELIUS_ENHANCED_TX_URL}?api-key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ transactions: [txSignature] }),
  });

  if (!response.ok) throw new Error(`Helius Enhanced Transactions failed: ${response.status} ${response.statusText}`);
  const payload = await response.json() as unknown;
  return Array.isArray(payload) ? payload[0] : null;
}

function paymentFromParsedPayload(payload: unknown, mint: string) {
  const sale = parseHeliusEnhancedTransaction(payload, { fallbackMint: mint }).find((event) => event.eventType === "SALE" && event.mint === mint);
  if (!sale) return null;
  if (!sale.paymentSymbol && !sale.paymentAmount && !sale.paymentMint) return null;
  return {
    paymentMint: sale.paymentMint ?? null,
    paymentSymbol: sale.paymentSymbol ?? (sale.paymentMint === USDC_MINT ? "USDC" : null),
    paymentAmount: sale.paymentAmount ?? null,
    fallbackVerified: Boolean((sale.rawPayload as { _perpRwa?: { fallbackVerified?: boolean } } | null)?._perpRwa?.fallbackVerified),
    source: "parsed_payload",
  };
}

async function resolvePayment(row: SaleRow) {
  const rawPayload = parseJson(row.raw_payload_json, null);
  const fromRaw = rawPayload ? paymentFromParsedPayload(rawPayload, row.mint) : null;
  if (fromRaw?.paymentSymbol && fromRaw.paymentAmount !== null) return fromRaw;

  if (row.tx_signature.startsWith("TEST_SIGNATURE")) return fallbackFromStoredPrices(row);

  try {
    const fetched = await fetchEnhancedTransaction(row.tx_signature);
    if (fetched) {
      const fromHelius = paymentFromParsedPayload(fetched, row.mint);
      if (fromHelius?.paymentSymbol && fromHelius.paymentAmount !== null) return { ...fromHelius, source: "helius_enhanced_tx" };
    }
  } catch (error) {
    return {
      paymentMint: null,
      paymentSymbol: null,
      paymentAmount: null,
      source: `helius_error:${error instanceof Error ? error.message : "unknown"}`,
    };
  }

  return fallbackFromStoredPrices(row);
}

async function main() {
  const dryRun = boolArg("--dryRun", true);
  const limit = Math.min(numberArg("--limit", 50), 200);
  const database = getNftDb();
  const rows = database.prepare(`
    SELECT id, mint, tx_signature, price_sol, price_usd, payment_mint, payment_symbol, payment_amount, raw_payload_json
    FROM rwa_nft_events
    WHERE event_type = 'SALE'
      AND tx_signature IS NOT NULL
      AND (payment_symbol IS NULL OR payment_amount IS NULL)
    ORDER BY event_at DESC
    LIMIT ?
  `).all(limit) as SaleRow[];

  const results = [];
  let updated = 0;
  for (const row of rows) {
    const resolved = await resolvePayment(row);
    const canUpdate = Boolean(resolved.paymentSymbol && resolved.paymentAmount !== null);
    if (canUpdate && !dryRun) {
      database.prepare(`
        UPDATE rwa_nft_events
        SET payment_mint = ?, payment_symbol = ?, payment_amount = ?
        WHERE id = ?
      `).run(resolved.paymentMint, resolved.paymentSymbol, resolved.paymentAmount, row.id);
      updated += 1;
    }

    results.push({
      tx: short(row.tx_signature),
      mint: short(row.mint),
      existing: `${row.payment_amount ?? ""} ${row.payment_symbol ?? ""}`.trim() || null,
      resolved: resolved.paymentSymbol && resolved.paymentAmount !== null ? `${resolved.paymentAmount} ${resolved.paymentSymbol}` : null,
      paymentMint: resolved.paymentMint,
      source: resolved.source,
      wouldUpdate: canUpdate && (row.payment_symbol !== resolved.paymentSymbol || row.payment_amount !== resolved.paymentAmount || row.payment_mint !== resolved.paymentMint),
      updated: canUpdate && !dryRun,
    });

    if (!dryRun) await sleep(500);
  }

  console.log(JSON.stringify({
    dryRun,
    limit,
    checked: rows.length,
    updated,
    unresolved: results.filter((row) => !row.resolved).length,
    results,
  }, null, 2));
}

main().catch((error) => {
  console.error(`[RWA MARKET] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
