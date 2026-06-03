import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/nfts/refresh")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { refreshMint } = await import("@/services/rateLimitedNftQueue");
          const body = await request.json().catch(() => ({})) as { mint?: string; force?: boolean };
          if (!body.mint) return Response.json({ error: "mint is required" }, { status: 400 });
          const result = await refreshMint(body.mint, Boolean(body.force));
          const status = result.status === "error" ? 400 : 200;
          return Response.json(result, { status, headers: { "Cache-Control": "no-store" } });
        } catch (error) {
          return Response.json({ error: error instanceof Error ? error.message : "Unable to refresh NFT" }, { status: 400 });
        }
      },
    },
  },
});
