import { createFileRoute } from "@tanstack/react-router";
import { getLatestConfirmedSales } from "@/lib/rwa-index/repository";

export const Route = createFileRoute("/api/sales/latest")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 25), 1), 100);
        const sales = await getLatestConfirmedSales(limit);
        return Response.json({ sales }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" } });
      },
    },
  },
});
