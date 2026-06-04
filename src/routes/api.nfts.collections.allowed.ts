import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/nfts/collections/allowed")({
  server: {
    handlers: {
      GET: async () => {
        const { getAllowedNftCollections } = await import("@/services/trackedNftsConfig");
        return Response.json({ collections: getAllowedNftCollections() }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
