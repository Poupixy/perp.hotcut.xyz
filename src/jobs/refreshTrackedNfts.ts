import { enqueueActiveTrackedNfts, processTrackedNftQueue } from "../services/rateLimitedNftQueue";

async function main() {
  console.log("[NFT INGESTION] Starting scheduled refresh job");
  const queue = await enqueueActiveTrackedNfts();
  console.log(`[NFT INGESTION] Queued active NFTs: ${queue.length}`);
  const result = await processTrackedNftQueue();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(`[NFT INGESTION] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
