import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/nfts/status")({
  server: {
    handlers: {
      GET: async () => {
        const [{ readNftDb }, { getAllowedNftCollections }, { nftDatabasePath }] = await Promise.all([
          import("@/services/nftStore"),
          import("@/services/trackedNftsConfig"),
          import("@/services/nftSqliteDb"),
        ]);
        const db = await readNftDb();
        const allowedCollections = getAllowedNftCollections();
        const env = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
        return Response.json({
          heliusConfigured: Boolean(env.HELIUS_API_KEY),
          trackedCount: db.tracked_nfts.length,
          activeTrackedCount: db.tracked_nfts.filter((nft) => nft.active).length,
          fetchedAssetCount: db.nft_assets.length,
          allowedCollectionCount: allowedCollections.length,
          allowedCollections,
          queue: db.queue_state,
          database: {
            ok: true,
            path: nftDatabasePath(),
            status: "ready",
            persistenceMode: "sqlite",
          },
        }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
