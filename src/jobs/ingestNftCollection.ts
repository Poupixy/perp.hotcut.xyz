import { fetchAndSaveAllowedCollection } from "../services/heliusNftService";
import { getAllowedNftCollections } from "../services/trackedNftsConfig";

function arg(name: string) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main() {
  const collectionAddress = arg("--collection");
  const maxPages = arg("--max-pages");
  const limit = arg("--limit");

  if (!collectionAddress) {
    console.log(JSON.stringify({ allowedCollections: getAllowedNftCollections() }, null, 2));
    throw new Error("Missing --collection. Only collections in allowedCollections can be ingested.");
  }

  const result = await fetchAndSaveAllowedCollection(collectionAddress, {
    maxPages: maxPages ? Number(maxPages) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(`[COLLECTION INGESTION] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
