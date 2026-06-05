import { getNftDb } from "../src/services/nftSqliteDb";
import { saveRwaNftMarketEvent } from "../src/services/rwaNftMarketEventService";
import type { RwaNftMarketEventSource } from "../src/types/rwaNftMarket";

function arg(name: string) {
  const prefix = `${name}=`;
  const match = process.argv.slice(2).find((item) => item.startsWith(prefix));
  if (match) return match.slice(prefix.length);
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function requiredArg(name: string) {
  const value = arg(name);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function numberArg(name: string, required = false) {
  const value = arg(name);
  if (!value) {
    if (required) throw new Error(`${name} is required`);
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${name} must be a valid number`);
  return parsed;
}

function loadAsset(mint: string) {
  return getNftDb().prepare("SELECT * FROM nft_assets WHERE mint = ?").get(mint);
}

function loadEvent(tx: string) {
  return getNftDb().prepare("SELECT * FROM rwa_nft_events WHERE tx_signature = ? AND event_type = 'SALE'").get(tx);
}

async function main() {
  const mint = requiredArg("--mint").trim();
  const priceSol = numberArg("--priceSol", true);
  const priceUsd = numberArg("--priceUsd");
  const tx = requiredArg("--tx").trim();
  const marketplace = arg("--marketplace")?.trim() || "manual";
  const source = (arg("--source")?.trim() || "manual") as RwaNftMarketEventSource;

  if (source !== "manual") throw new Error("--source must be manual for seed:verified-sale");
  if (!tx) throw new Error("--tx is required");

  const asset = loadAsset(mint);
  if (!asset) throw new Error(`mint not found in nft_assets: ${mint}`);

  const result = await saveRwaNftMarketEvent({
    mint,
    category: typeof asset.category === "string" ? asset.category : null,
    eventType: "SALE",
    priceSol,
    priceUsd,
    marketplace,
    txSignature: tx,
    buyer: null,
    seller: null,
    owner: typeof asset.owner === "string" ? asset.owner : null,
    eventAt: new Date().toISOString(),
    source,
    rawPayload: {
      seededBy: "npm run seed:verified-sale",
      mint,
      priceSol,
      priceUsd,
      tx,
      marketplace,
      source,
    },
  });

  if (!result.saved) {
    throw new Error(`SALE event was not created: ${result.reason}`);
  }

  const createdEvent = loadEvent(tx);
  const updatedAsset = loadAsset(mint);

  console.log(JSON.stringify({
    createdEvent,
    updatedAsset,
  }, null, 2));
}

main().catch((error) => {
  console.error(`[RWA MARKET] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
