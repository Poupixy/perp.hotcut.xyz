import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/nfts/tracked")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { listTrackedNfts } = await import("@/services/nftStore");
        const { NFT_MARKETS, getAllowedNftCollections } = await import("@/services/trackedNftsConfig");
        const url = new URL(request.url);
        const market = url.searchParams.get("market");
        const collection = url.searchParams.get("collection");
        const activeOnly = url.searchParams.get("active") !== "false";
        const fetchedOnly = url.searchParams.get("fetched") === "true";
        const approvedOnly = url.searchParams.get("approved") === "true";
        const assetType = url.searchParams.get("assetType");
        const publicGroup = url.searchParams.get("publicGroup");
        const includeOther = url.searchParams.get("includeOther") === "true";
        const includeStaging = url.searchParams.get("includeStaging") === "true";
        const includeUnknown = url.searchParams.get("includeUnknown") === "true";

        let nfts = await listTrackedNfts();
        if (activeOnly) nfts = nfts.filter((nft) => nft.active);
        if (fetchedOnly) nfts = nfts.filter((nft) => Boolean(nft.asset));
        if (approvedOnly) {
          const allowedMarkets = new Set<string>(NFT_MARKETS);
          const allowedCollections = new Set(getAllowedNftCollections().map((collection) => collection.collectionAddress));
          nfts = nfts.filter((nft) => {
            const collectionAddress = nft.asset?.source_collection ?? nft.asset?.collection;
            return allowedMarkets.has(nft.market) && (!collectionAddress || allowedCollections.has(collectionAddress));
          });
        }
        if (market && market !== "all") nfts = nfts.filter((nft) => nft.market === market);
        if (collection && collection !== "all") nfts = nfts.filter((nft) => nft.asset?.collection === collection);
        if (assetType && assetType !== "all") nfts = nfts.filter((nft) => nft.asset?.asset_type === assetType);
        if (publicGroup && publicGroup !== "all") nfts = nfts.filter((nft) => nft.asset?.public_group === publicGroup);
        if (!includeOther) nfts = nfts.filter((nft) => !nft.asset || nft.asset.public_group === "card" || nft.asset.asset_type === "card");
        if (!includeStaging) nfts = nfts.filter((nft) => !nft.asset?.is_staging);
        if (!includeUnknown) nfts = nfts.filter((nft) => !nft.asset || (nft.asset.category !== "unknown" && Boolean(nft.asset.category)));

        return Response.json({ nfts }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
