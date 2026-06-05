import { createFileRoute } from "@tanstack/react-router";

function env() {
  return (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
}

function adminAuthorized(request: Request) {
  const secret = env().RWA_MARKET_ADMIN_SECRET;
  if (!secret) return false;
  return request.headers.get("x-admin-secret") === secret;
}

export const Route = createFileRoute("/api/rwa-market/enrich-sale")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!env().RWA_MARKET_ADMIN_SECRET) {
          return Response.json({ error: "RWA_MARKET_ADMIN_SECRET is not configured; enrichment route is disabled" }, { status: 503 });
        }
        if (!adminAuthorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });

        try {
          const { enrichAndSaveSaleFromTxSignature } = await import("@/services/heliusSaleEnrichmentService");
          const body = await request.json().catch(() => ({})) as { txSignature?: string; mint?: string; market?: string; force?: boolean };
          if (!body.txSignature) return Response.json({ error: "txSignature is required" }, { status: 400 });

          const result = await enrichAndSaveSaleFromTxSignature(body.txSignature, {
            mint: body.mint,
            market: body.market,
            force: Boolean(body.force),
          });
          return Response.json(result, { headers: { "Cache-Control": "no-store" } });
        } catch (error) {
          return Response.json({ error: error instanceof Error ? error.message : "Unable to enrich sale" }, { status: 400 });
        }
      },
    },
  },
});
