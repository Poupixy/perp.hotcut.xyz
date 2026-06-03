import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/sales/market/$market")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const { getSalesByMarket } = await import("@/lib/provider-ingestion/store");
        const url = new URL(request.url);
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 250), 1), 500);
        const sales = await getSalesByMarket(params.market, limit);
        return Response.json({ sales }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
