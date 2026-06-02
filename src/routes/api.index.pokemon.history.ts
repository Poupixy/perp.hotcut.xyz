import { createFileRoute } from "@tanstack/react-router";
import { getPokemonIndexHistory } from "@/lib/rwa-index/repository";

export const Route = createFileRoute("/api/index/pokemon/history")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const points = Math.min(Math.max(Number(url.searchParams.get("points") ?? 12), 1), 72);
        const history = await getPokemonIndexHistory(points);
        return Response.json({ indexName: "POKEMON_INDEX", market: "pokemon-cards", history }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" } });
      },
    },
  },
});
