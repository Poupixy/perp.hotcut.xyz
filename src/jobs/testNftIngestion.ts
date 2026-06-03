import { addTrackedNft } from "../services/nftStore";
import { enqueueTrackedMints } from "../services/nftStore";
import { processTrackedNftQueue } from "../services/rateLimitedNftQueue";

function env() {
  return (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
}

async function main() {
  const runtime = env();
  const mockMode = runtime.NFT_INGESTION_TEST_MODE === "mock";
  if (!runtime.HELIUS_API_KEY && !mockMode) {
    throw new Error("HELIUS_API_KEY is required unless NFT_INGESTION_TEST_MODE=mock");
  }

  const mint = runtime.HELIUS_TEST_NFT_MINT;
  if (!mint && !mockMode) {
    throw new Error("HELIUS_TEST_NFT_MINT is required. The test refuses to fetch a random NFT.");
  }

  if (mockMode) {
    console.log("[NFT INGESTION] Mock mode selected. No Helius calls will be made.");
    console.log(JSON.stringify({ ok: true, mode: "mock" }, null, 2));
    return;
  }

  const trackedNft = await addTrackedNft({ mint: mint!, market: "pokemon", label: "NFT ingestion test" }).catch(async (error) => {
    if (error instanceof Error && error.message.includes("already exists")) {
      const { findTrackedNft } = await import("../services/nftStore");
      const existing = await findTrackedNft(mint!);
      if (existing) return existing;
    }
    throw error;
  });

  await enqueueTrackedMints([trackedNft.mint]);
  const result = await processTrackedNftQueue({ force: true, maxItems: 1 });
  const saved = result.results[0]?.asset;
  console.log(JSON.stringify({ trackedNft, result, normalized: saved }, null, 2));
}

main().catch((error) => {
  console.error(`[NFT INGESTION] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
