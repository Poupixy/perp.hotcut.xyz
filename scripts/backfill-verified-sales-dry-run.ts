import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { parseHeliusEnhancedTransaction } from "../src/services/heliusEnhancedTransactionParser";
import { ALLOWED_RWA_NFT_CATEGORIES } from "../src/services/nftCategoryService";

const HELIUS_ENHANCED_TX_URL = "https://api.helius.xyz/v0/transactions/";
const HELIUS_RPC_URL = "https://mainnet.helius-rpc.com/";

type InputMode = "signatures" | "mints";

type RuntimeEnv = Record<string, string | undefined>;

type ParsedArgs = {
  file: string;
  mode: InputMode;
  dryRun: boolean;
  maxTransactions: number;
  maxTransactionsPerMint: number;
  market: string | null;
};

type DryRunResult = {
  txSignature: string;
  status: "accepted" | "rejected" | "saved" | "error";
  reason: string;
  mint?: string | null;
  buyer?: string | null;
  seller?: string | null;
  owner?: string | null;
  priceSol?: number | null;
  priceUsd?: number | null;
  paymentToken?: string | null;
  marketplace?: string | null;
  timestamp?: string | null;
  heliusType?: string | null;
  heliusSource?: string | null;
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
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function inferMode(file: string): InputMode {
  const name = basename(file).toLowerCase();
  if (name === "nft-mints.txt" || name.includes("mint")) return "mints";
  return "signatures";
}

function parseArgs(): ParsedArgs {
  const file = arg("--file")?.trim();
  if (!file) throw new Error("--file is required");

  const modeArg = arg("--mode")?.trim();
  const mode = modeArg === "mints" || modeArg === "signatures" ? modeArg : inferMode(file);
  const market = arg("--market")?.trim() || null;
  if (market && !ALLOWED_RWA_NFT_CATEGORIES.includes(market as never)) {
    throw new Error(`market is not allowed: ${market}. Allowed: ${ALLOWED_RWA_NFT_CATEGORIES.join(", ")}`);
  }

  return {
    file,
    mode,
    dryRun: boolArg("--dryRun", true),
    maxTransactions: Math.min(numberArg("--maxTransactions", 50), 50),
    maxTransactionsPerMint: Math.min(numberArg("--maxTransactionsPerMint", 5), 5),
    market,
  };
}

function readItems(file: string) {
  const seen = new Set<string>();
  return readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*\s]+/, "").trim())
    .filter(Boolean)
    .filter((line) => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    });
}

function requireApiKey() {
  const apiKey = env().HELIUS_API_KEY;
  if (!apiKey) throw new Error("Missing HELIUS_API_KEY");
  return apiKey;
}

async function fetchEnhancedTransactions(signatures: string[]) {
  if (!signatures.length) return [];
  const apiKey = requireApiKey();
  const response = await fetch(`${HELIUS_ENHANCED_TX_URL}?api-key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ transactions: signatures }),
  });

  if (!response.ok) throw new Error(`Helius Enhanced Transactions failed: ${response.status} ${response.statusText}`);
  const payload = await response.json() as unknown;
  return Array.isArray(payload) ? payload : [];
}

async function fetchRecentSignaturesForMint(mint: string, limit: number) {
  const apiKey = requireApiKey();
  const response = await fetch(`${HELIUS_RPC_URL}?api-key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "get-signatures-for-mint",
      method: "getSignaturesForAddress",
      params: [mint, { limit }],
    }),
  });

  if (!response.ok) throw new Error(`Helius RPC getSignaturesForAddress failed: ${response.status} ${response.statusText}`);
  const payload = await response.json() as { result?: Array<{ signature?: string }> };
  return (payload.result ?? []).map((row) => row.signature).filter((value): value is string => Boolean(value));
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function paymentTokenForSale(sale: { priceSol: number | null; priceUsd: number | null }) {
  if (sale.priceUsd !== null && sale.priceUsd !== undefined) return "USDC/USD";
  if (sale.priceSol !== null && sale.priceSol !== undefined) return "SOL";
  return null;
}

function validateClearSale(tx: unknown): DryRunResult {
  const txRow = record(tx);
  const signature = String(txRow.signature ?? "");
  const parsedSales = parseHeliusEnhancedTransaction(tx).filter((event) => event.eventType === "SALE");
  if (!parsedSales.length) {
    return {
      txSignature: signature,
      status: "rejected",
      reason: "no clear SALE event detected by parser",
      heliusType: String(txRow.type ?? "") || null,
      heliusSource: String(txRow.source ?? "") || null,
    };
  }

  const sale = parsedSales[0];
  const missing: string[] = [];
  if (!sale.mint) missing.push("mint");
  if (!sale.txSignature) missing.push("txSignature");
  if (!sale.buyer) missing.push("buyer");
  if (!sale.seller) missing.push("seller");
  if (!sale.eventAt) missing.push("timestamp");
  if (sale.priceSol === null && sale.priceUsd === null) missing.push("price");

  const base = {
    txSignature: sale.txSignature ?? signature,
    mint: sale.mint,
    buyer: sale.buyer,
    seller: sale.seller,
    owner: sale.owner,
    priceSol: sale.priceSol,
    priceUsd: sale.priceUsd,
    paymentToken: paymentTokenForSale(sale),
    marketplace: sale.marketplace,
    timestamp: sale.eventAt,
    heliusType: String(txRow.type ?? "") || null,
    heliusSource: String(txRow.source ?? "") || null,
  };

  if (missing.length) {
    return {
      ...base,
      status: "rejected",
      reason: `uncertain SALE event, missing ${missing.join(", ")}`,
    };
  }

  return {
    ...base,
    status: "accepted",
    reason: "clear SALE event detected",
  };
}

async function collectSignatures(args: ParsedArgs, items: string[]) {
  if (args.mode === "signatures") return items.slice(0, args.maxTransactions);

  const signatures: string[] = [];
  const seen = new Set<string>();
  for (const mint of items) {
    if (signatures.length >= args.maxTransactions) break;
    console.log(`[RWA BACKFILL] Fetching recent signatures for mint: ${mint}`);
    const mintSignatures = await fetchRecentSignaturesForMint(mint, args.maxTransactionsPerMint);
    for (const signature of mintSignatures) {
      if (seen.has(signature)) continue;
      seen.add(signature);
      signatures.push(signature);
      if (signatures.length >= args.maxTransactions) break;
    }
  }
  return signatures;
}

async function maybeSave(result: DryRunResult, args: ParsedArgs) {
  if (args.dryRun || result.status !== "accepted") return result;
  try {
    const { enrichAndSaveSaleFromTxSignature } = await import("../src/services/heliusSaleEnrichmentService");
    await enrichAndSaveSaleFromTxSignature(result.txSignature, {
      mint: result.mint,
      market: args.market,
      force: true,
    });
    return { ...result, status: "saved" as const, reason: "saved to rwa_nft_events" };
  } catch (error) {
    return {
      ...result,
      status: "error" as const,
      reason: error instanceof Error ? error.message : "save failed",
    };
  }
}

async function main() {
  const args = parseArgs();
  const items = readItems(args.file);
  const signatures = await collectSignatures(args, items);
  const cappedSignatures = signatures.slice(0, args.maxTransactions);
  const txRows = await fetchEnhancedTransactions(cappedSignatures);
  const results: DryRunResult[] = [];

  for (const tx of txRows) {
    const result = validateClearSale(tx);
    results.push(await maybeSave(result, args));
  }

  const missingFromHelius = cappedSignatures.filter((signature) => !txRows.some((row) => String(record(row).signature ?? "") === signature));
  for (const signature of missingFromHelius) {
    results.push({ txSignature: signature, status: "rejected", reason: "Helius returned no transaction" });
  }

  const summary = {
    mode: args.mode,
    dryRun: args.dryRun,
    inputItems: items.length,
    checkedTransactions: cappedSignatures.length,
    accepted: results.filter((row) => row.status === "accepted").length,
    rejected: results.filter((row) => row.status === "rejected").length,
    saved: results.filter((row) => row.status === "saved").length,
    errors: results.filter((row) => row.status === "error").length,
  };

  console.log(JSON.stringify({ summary, results }, null, 2));
  if (!args.dryRun && summary.errors > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`[RWA BACKFILL] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
