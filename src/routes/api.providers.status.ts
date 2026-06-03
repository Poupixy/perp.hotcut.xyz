import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/providers/status")({
  server: {
    handlers: {
      GET: async () => {
        const { getProviderStatusReport } = await import("@/lib/provider-ingestion/ingest");
        return Response.json(await getProviderStatusReport(), { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
