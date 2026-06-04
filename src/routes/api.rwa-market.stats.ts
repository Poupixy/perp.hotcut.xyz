import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/rwa-market/stats")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { getRwaMarketStats } = await import("@/services/rwaNftMarketEventService");
        const url = new URL(request.url);
        const stats = await getRwaMarketStats(url.searchParams.get("category"));
        return Response.json(stats, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
