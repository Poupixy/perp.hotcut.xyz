import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/nfts/tracked")({
  server: {
    handlers: {
      GET: async () => {
        const { listTrackedNfts } = await import("@/services/nftStore");
        return Response.json({ nfts: await listTrackedNfts() }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
