import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/nfts/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { addTrackedNft } = await import("@/services/nftStore");
          const body = await request.json().catch(() => ({})) as { mint?: string; market?: string; label?: string };
          const trackedNft = await addTrackedNft({ mint: body.mint ?? "", market: body.market ?? "", label: body.label });
          return Response.json({ trackedNft }, { status: 201, headers: { "Cache-Control": "no-store" } });
        } catch (error) {
          return Response.json({ error: error instanceof Error ? error.message : "Unable to track NFT" }, { status: 400 });
        }
      },
    },
  },
});
