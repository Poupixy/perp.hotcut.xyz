import { ALLOWED_RWA_NFT_CATEGORIES } from "@/services/nftCategoryService";
import { refreshListingsForCategory } from "@/services/rwaNftMarketplaceListingService";

export async function refreshRwaNftMarketData() {
  console.log("[RWA MARKET] Starting listing refresh");
  const results = [];
  for (const category of ALLOWED_RWA_NFT_CATEGORIES) {
    results.push({ category, result: await refreshListingsForCategory(category) });
  }
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  refreshRwaNftMarketData()
    .then((results) => {
      console.log(JSON.stringify(results, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
