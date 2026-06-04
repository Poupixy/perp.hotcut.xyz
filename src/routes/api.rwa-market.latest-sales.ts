import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/rwa-market/latest-sales")({
  server: {
    handlers: {
      GET: async () => {
        const { getVerifiedSales } = await import("@/services/rwaNftMarketEventService");
        const result = await getVerifiedSales({ limit: 20, page: 1, sort: "newest" });
        return Response.json({ sales: result.sales }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
