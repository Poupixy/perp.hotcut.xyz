import { createFileRoute } from "@tanstack/react-router";

function optionalNumber(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export const Route = createFileRoute("/api/rwa-market/listed")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { getListedNfts } = await import("@/services/rwaNftMarketEventService");
        const url = new URL(request.url);
        const rows = await getListedNfts({
          category: url.searchParams.get("category"),
          sort: url.searchParams.get("sort") ?? "updated_desc",
          page: optionalNumber(url.searchParams.get("page")) ?? 1,
          limit: optionalNumber(url.searchParams.get("limit")) ?? 50,
        });
        return Response.json({ listings: rows }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
