import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/nfts/collections/ingest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { fetchAndSaveAllowedCollection } = await import("@/services/heliusNftService");
          const body = await request.json().catch(() => ({})) as { collectionAddress?: string; limit?: number; maxPages?: number };
          if (!body.collectionAddress) return Response.json({ error: "collectionAddress is required" }, { status: 400 });
          const result = await fetchAndSaveAllowedCollection(body.collectionAddress, { limit: body.limit, maxPages: body.maxPages });
          return Response.json(result, { headers: { "Cache-Control": "no-store" } });
        } catch (error) {
          return Response.json({ error: error instanceof Error ? error.message : "Unable to ingest collection" }, { status: 400 });
        }
      },
    },
  },
});
