import { createFileRoute } from "@tanstack/react-router";
import { getPokemonIndexSnapshot } from "@/lib/rwa-index/repository";

export const Route = createFileRoute("/api/index/pokemon")({
  server: {
    handlers: {
      GET: async () => {
        const snapshot = await getPokemonIndexSnapshot();
        return Response.json(snapshot, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" } });
      },
    },
  },
});
