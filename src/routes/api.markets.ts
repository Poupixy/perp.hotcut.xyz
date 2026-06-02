import { createFileRoute } from "@tanstack/react-router";
import { getMarkets } from "@/lib/rwa-index/repository";

export const Route = createFileRoute("/api/markets")({
  server: {
    handlers: {
      GET: async () => Response.json({ markets: getMarkets() }, { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } }),
    },
  },
});
