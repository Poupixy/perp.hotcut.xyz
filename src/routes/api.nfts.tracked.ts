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

        return Response.json({ nfts }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
