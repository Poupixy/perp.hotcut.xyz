import type { RwaNftMarketEvent, RwaNftMarketEventType } from "@/types/rwaNftMarket";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    const result = asString(value);
    if (result) return result;
  }
  return null;
}

function nestedString(row: Record<string, unknown>, path: string[]) {
  let current: unknown = row;
  for (const key of path) current = asRecord(current)[key];
  return asString(current);
}

function detectEventType(tx: Record<string, unknown>): RwaNftMarketEventType | null {
  const typeText = String(tx.type ?? tx.transactionType ?? tx.description ?? "").toUpperCase();
  if (typeText.includes("NFT_SALE") || typeText.includes("SALE")) return "SALE";
  if (typeText.includes("LIST")) return "LISTED";
  if (typeText.includes("DELIST")) return "DELISTED";
  if (typeText.includes("PRICE")) return "PRICE_UPDATED";
  if (typeText.includes("TRANSFER")) return "TRANSFER";
  return null;
}

function nftMintFromTx(tx: Record<string, unknown>) {
  const nftEvent = asRecord(tx.nft);
  const events = asRecord(tx.events);
  const nft = asRecord(events.nft);
  const nfts = Array.isArray(tx.nfts) ? tx.nfts.map(asRecord) : [];
  const transfers = Array.isArray(tx.tokenTransfers) ? tx.tokenTransfers.map(asRecord) : [];
  return firstString(
    tx.mint,
    tx.assetMint,
    tx.mintAddress,
    nftEvent.mint,
    nftEvent.assetMint,
    nft.mint,
    nft.assetMint,
    nfts[0]?.mint,
    nfts[0]?.assetMint,
    transfers.find((transfer) => asString(transfer.mint))?.mint,
  );
}

function solAmount(tx: Record<string, unknown>) {
  const events = asRecord(tx.events);
  const nft = asRecord(events.nft);
  const amount = firstString(tx.amount, tx.price, nft.amount, nft.price);
  const numeric = typeof amount === "string" ? Number(amount) : asNumber(amount);
  if (typeof numeric === "number" && Number.isFinite(numeric)) return numeric > 10_000 ? numeric / 1_000_000_000 : numeric;
  return asNumber(tx.priceSol) ?? asNumber(nft.priceSol) ?? null;
}

function timestampFromTx(tx: Record<string, unknown>) {
  const raw = tx.timestamp ?? tx.blockTime ?? tx.createdAt ?? tx.time;
  if (typeof raw === "number") return new Date(raw < 10_000_000_000 ? raw * 1000 : raw).toISOString();
  return asString(raw) ?? new Date().toISOString();
}

export function parseHeliusEnhancedTransaction(txPayload: unknown): RwaNftMarketEvent[] {
  const rows = Array.isArray(txPayload) ? txPayload.map(asRecord) : [asRecord(txPayload)];
  const events: RwaNftMarketEvent[] = [];

  for (const tx of rows) {
    const eventType = detectEventType(tx);
    if (!eventType) continue;

    const mint = nftMintFromTx(tx);
    if (!mint) continue;

    const heliusEvents = asRecord(tx.events);
    const nft = asRecord(heliusEvents.nft);
    const marketplace = firstString(tx.source, tx.marketplace, nft.source, nft.marketplace);
    const buyer = firstString(tx.buyer, nft.buyer, nft.buyerAddress, nestedString(tx, ["nativeTransfers", "0", "toUserAccount"]));
    const seller = firstString(tx.seller, nft.seller, nft.sellerAddress, nestedString(tx, ["nativeTransfers", "0", "fromUserAccount"]));
    const owner = firstString(tx.owner, tx.toUserAccount, buyer);

    events.push({
      mint,
      category: null,
      eventType,
      priceSol: eventType === "SALE" || eventType === "LISTED" || eventType === "PRICE_UPDATED" ? solAmount(tx) : null,
      priceUsd: asNumber(tx.priceUsd) ?? asNumber(nft.priceUsd),
      marketplace,
      txSignature: firstString(tx.signature, tx.transactionSignature, tx.txHash),
      buyer,
      seller,
      owner,
      eventAt: timestampFromTx(tx),
      source: "helius_enhanced_tx",
      rawPayload: tx,
    });
  }

  return events;
}
