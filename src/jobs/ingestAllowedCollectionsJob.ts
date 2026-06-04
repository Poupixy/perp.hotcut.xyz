import { fetchAndSaveAllowedCollection } from "@/services/heliusNftService";
import { findAllowedNftCollection, getAllowedNftCollections } from "@/services/trackedNftsConfig";

type CollectionJob = {
  collectionAddress: string;
  limit?: number;
  maxPages?: number;
};

const queue: CollectionJob[] = [];
let processing = false;

function sameJob(a: CollectionJob, b: CollectionJob) {
  return a.collectionAddress === b.collectionAddress;
}

async function processQueue() {
  if (processing) return;
  processing = true;
  console.log("[NFT INGESTION] Starting collection ingestion job");
  try {
    while (queue.length) {
      const job = queue.shift();
      if (!job) continue;
      try {
        await fetchAndSaveAllowedCollection(job.collectionAddress, { limit: job.limit, maxPages: job.maxPages });
      } catch (error) {
        console.log(`[NFT INGESTION] Collection ingestion failed: ${error instanceof Error ? error.message : "unknown error"}`);
      }
    }
  } finally {
    processing = false;
  }
}

export function enqueueAllowedCollectionIngestion(job: CollectionJob) {
  const allowed = findAllowedNftCollection(job.collectionAddress);
  if (!allowed) throw new Error("Collection is not allowlisted. Refusing to fetch unknown collection.");
  if (!queue.some((item) => sameJob(item, job))) queue.push({ ...job, collectionAddress: allowed.collectionAddress });
  console.log("[NFT INGESTION] Collection ingestion queued");
  void processQueue();
  return { queued: queue.length, processing, collectionAddress: allowed.collectionAddress };
}

export function enqueueAllAllowedCollectionIngestion(options: Omit<CollectionJob, "collectionAddress"> = {}) {
  const collections = getAllowedNftCollections();
  for (const collection of collections) {
    if (!queue.some((item) => item.collectionAddress === collection.collectionAddress)) {
      queue.push({ collectionAddress: collection.collectionAddress, ...options });
    }
  }
  console.log("[NFT INGESTION] Collection ingestion queued");
  void processQueue();
  return { queued: queue.length, processing, collections: collections.length };
}

export function getCollectionIngestionJobStatus() {
  return { queued: queue.length, processing, queue: queue.map((job) => job.collectionAddress) };
}
