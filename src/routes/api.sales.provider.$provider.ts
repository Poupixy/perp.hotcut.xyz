import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/sales/provider/$provider")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const { getSalesByProvider } = await import("@/lib/provider-ingestion/store");
        const url = new URL(request.url);
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 250), 1), 500);
        const sales = await getSalesByProvider(params.provider, limit);
        return Response.json({ sales }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
