import { createFileRoute } from "@tanstack/react-router";

function env() {
  return (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
}

function webhookSecretMatches(request: Request) {
  const secret = env().HELIUS_WEBHOOK_SECRET;
  if (!secret) return true;
  const headerSecret = request.headers.get("x-helius-webhook-secret") ?? request.headers.get("x-webhook-secret");
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return headerSecret === secret || bearer === secret;
}

export const Route = createFileRoute("/api/webhooks/helius/nft-events")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!webhookSecretMatches(request)) return Response.json({ error: "unauthorized" }, { status: 401 });

        console.log("[RWA MARKET] Webhook received");
        const payload = await request.json().catch(() => null);
        const [{ parseHeliusEnhancedTransaction }, { saveRwaNftMarketEvent }] = await Promise.all([
          import("@/services/heliusEnhancedTransactionParser"),
          import("@/services/rwaNftMarketEventService"),
        ]);

        const parsed = parseHeliusEnhancedTransaction(payload).map((event) => ({ ...event, source: "helius_webhook" as const }));
        if (!parsed.length) {
          console.log("[RWA MARKET] Could not detect mint from webhook payload");
          return Response.json({ saved: 0, ignored: 0, message: "No supported NFT market events detected" });
        }

        let saved = 0;
        let ignored = 0;
        for (const event of parsed) {
          const result = await saveRwaNftMarketEvent(event);
          if (result.saved) saved += 1;
          else ignored += 1;
        }

        return Response.json({ saved, ignored });
      },
    },
  },
});
