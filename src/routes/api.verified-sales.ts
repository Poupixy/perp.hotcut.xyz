import { createFileRoute } from "@tanstack/react-router";

function optionalNumber(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export const Route = createFileRoute("/api/verified-sales")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { getVerifiedSales } = await import("@/services/rwaNftMarketEventService");
        const url = new URL(request.url);
        const result = await getVerifiedSales({
          category: url.searchParams.get("category"),
          marketplace: url.searchParams.get("marketplace"),
          source: url.searchParams.get("source"),
          minPriceSol: optionalNumber(url.searchParams.get("minPriceSol")),
          maxPriceSol: optionalNumber(url.searchParams.get("maxPriceSol")),
          startDate: url.searchParams.get("startDate"),
          endDate: url.searchParams.get("endDate"),
          search: url.searchParams.get("search"),
          page: optionalNumber(url.searchParams.get("page")) ?? 1,
          limit: optionalNumber(url.searchParams.get("limit")) ?? 50,
          sort: url.searchParams.get("sort"),
          includeStaging: url.searchParams.get("includeStaging") === "true",
        });
        return Response.json(result, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
