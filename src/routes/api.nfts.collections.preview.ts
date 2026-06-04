import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/nfts/collections/preview")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { getAssetsByCollection, normalizeHeliusAsset } = await import("@/services/heliusNftService");
          const body = await request.json().catch(() => ({})) as { collectionAddress?: string; limit?: number };
          if (!body.collectionAddress) return Response.json({ error: "collectionAddress is required" }, { status: 400 });

          const limit = Math.min(Math.max(body.limit ?? 10, 1), 50);
          const result = await getAssetsByCollection(body.collectionAddress, { limit, maxPages: 1 });
          const assets = result.assets.map((asset) => normalizeHeliusAsset(asset));

          return Response.json({
            collectionAddress: body.collectionAddress,
            pagesFetched: result.pagesFetched,
            total: result.total,
            assets,
          }, { headers: { "Cache-Control": "no-store" } });
        } catch (error) {
          return Response.json({ error: error instanceof Error ? error.message : "Unable to preview collection" }, { status: 400 });
        }
      },
    },
  },
});
