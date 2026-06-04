import { createFileRoute } from "@tanstack/react-router";

function optionalNumber(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export const Route = createFileRoute("/api/rwa-market/events")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { getLatestEvents, marketEventFromDbRow } = await import("@/services/rwaNftMarketEventService");
        const url = new URL(request.url);
        const rows = await getLatestEvents({
          category: url.searchParams.get("category"),
          eventType: url.searchParams.get("eventType") as never,
          page: optionalNumber(url.searchParams.get("page")) ?? 1,
          limit: optionalNumber(url.searchParams.get("limit")) ?? 50,
          includeStaging: url.searchParams.get("includeStaging") === "true",
        });
        return Response.json({ events: rows.map(marketEventFromDbRow) }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
