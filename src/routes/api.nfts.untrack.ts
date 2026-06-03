import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/nfts/untrack")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { untrackNft } = await import("@/services/nftStore");
          const body = await request.json().catch(() => ({})) as { mint?: string };
          const trackedNft = await untrackNft(body.mint ?? "");
          return Response.json({ trackedNft }, { headers: { "Cache-Control": "no-store" } });
        } catch (error) {
          return Response.json({ error: error instanceof Error ? error.message : "Unable to untrack NFT" }, { status: 400 });
        }
      },
    },
  },
});
