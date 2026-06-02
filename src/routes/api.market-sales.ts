import { createFileRoute } from "@tanstack/react-router";
import { clampDays } from "@/lib/market-data/config";
import { fetchMarketSales } from "@/lib/market-data/providers";

export const Route = createFileRoute("/api/market-sales")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const days = clampDays(url.searchParams.get("days"));
        const payload = await fetchMarketSales(days);
        return Response.json(payload, {
          headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
        });
      },
    },
  },
});
