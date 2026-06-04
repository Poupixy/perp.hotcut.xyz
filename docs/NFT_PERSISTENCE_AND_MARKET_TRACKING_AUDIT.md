# NFT Persistence And Market Tracking Audit

## Current Architecture

The current NFT ingestion layer is a prototype. It models three logical tables in TypeScript, but persists them through a local JSON file instead of a real database.

Primary files:

- `src/services/nftTypes.ts`
  - Defines `tracked_nfts`, `nft_assets`, `queue_state`, and related result types.
- `src/services/nftStore.ts`
  - Reads and writes the JSON store.
  - Default path is `data/nft-ingestion.json`, resolved from `process.cwd()`.
  - Can be overridden with `PERP_NFT_DB_PATH`.
- `src/services/trackedNftsConfig.ts`
  - Defines `NFT_MARKETS`, `TARGET_NFTS`, and allowed collection env parsing.
- `src/services/trackedMarketCategories.ts`
  - Filters Helius metadata by approved category attributes.
- `src/services/heliusNftService.ts`
  - Fetches Helius DAS `getAsset` and `getAssetsByGroup`.
  - Normalizes NFT metadata.
  - Saves collection assets through `nftStore`.
- `src/services/rateLimitedNftQueue.ts`
  - Enforces one Helius call every 30 seconds.
  - Stores queue state through `nftStore`.
- `src/routes/api.nfts.*.ts`
  - Exposes the current NFT APIs.

Existing APIs:

- `GET /api/nfts/status`
- `GET /api/nfts/tracked`
- `POST /api/nfts/track`
- `POST /api/nfts/untrack`
- `POST /api/nfts/refresh`
- `GET /api/nfts/collections/allowed`
- `POST /api/nfts/collections/preview`
- `POST /api/nfts/collections/ingest`

## Current JSON Storage Behavior

The current store path is:

```txt
data/nft-ingestion.json
```

Inside Docker this resolves to:

```txt
/app/data/nft-ingestion.json
```

The active container currently has no `nft-ingestion.json` file and the API reports:

```txt
tracked_nfts: 0
nft_assets: 0
queue: empty
HELIUS_API_KEY: configured
allowlisted collections: 3
```

`docker-compose.yml` currently does not mount `/app/data`, so any JSON file written inside the container can be lost when the container is recreated.

## Existing Database Layer

No existing database layer was found:

- no Prisma
- no Drizzle
- no Supabase
- no Postgres client
- no SQLite package
- no migrations folder

The app should therefore use SQLite for V1 persistence.

## Recommended Persistence Option

Use SQLite with a persistent file at:

```txt
/app/data/perp-rwa.sqlite
```

For the current Docker setup, mount a persistent volume to:

```txt
/app/data
```

The SQLite database should own the NFT storage. The existing JSON file should only be used as a temporary migration source if present.

Required tables:

- `tracked_nfts`
- `nft_assets`
- `queue_state`
- `rwa_nft_events`

Required indexes:

- `tracked_nfts.mint`
- `nft_assets.mint`
- `nft_assets.market`
- `nft_assets.category`
- `nft_assets.collection`
- `nft_assets.is_staging`
- `rwa_nft_events.mint`
- `rwa_nft_events.event_type`
- `rwa_nft_events.category`
- `rwa_nft_events.event_at`
- `rwa_nft_events.tx_signature`
- `rwa_nft_events.marketplace`
- `rwa_nft_events.source`

## Risks

1. **Container data loss**
   - Current JSON storage is not mounted as a volume.
   - Recreating the container can remove stored NFT data.

2. **JSON scaling limits**
   - Large NFT collections can make `nft-ingestion.json` expensive to read/write.
   - `raw_helius_json` can grow quickly.

3. **Long HTTP ingestion**
   - `POST /api/nfts/collections/ingest` currently performs long Helius collection ingestion directly inside the request.
   - Large collections should be processed by a background job.

4. **Type/runtime inconsistency**
   - Before migration, `TrackedNftMarket` still included unsupported runtime values such as `sealed_products`, `graded_cards`, and `other_cards`.
   - The V1 runtime should keep only the approved display categories: Pokémon, One Piece, Basketball, Football, Hockey, Baseball, Soccer, Yu-Gi-Oh, Dragon Ball, and Magic The Gathering.
   - Unsupported values should not be accepted for new NFT ingestion.

5. **No event history**
   - Current `nft_assets` only stores latest metadata.
   - There is no persistent historical event table for sales, listings, delistings, price updates, transfers, or owner changes.

## Migration Plan

1. Add a persistent Docker mount for `/app/data`.
2. Add SQLite persistence at `/app/data/perp-rwa.sqlite`.
3. Add simple migrations for:
   - `tracked_nfts`
   - `nft_assets`
   - `queue_state`
   - `rwa_nft_events`
4. Add a JSON migration script:
   - Read `/app/data/nft-ingestion.json` if present.
   - Insert `tracked_nfts`.
   - Insert `nft_assets`.
   - Preserve `queue_state`.
   - Skip duplicate mints.
   - Do not fail if JSON does not exist.
5. Refactor `nftStore.ts` to use SQLite as the primary store.
6. Keep the existing API responses compatible with the frontend.
7. Add category detection and remove unsupported runtime categories.
8. Add `rwa_nft_events` as the only historical market event table.
9. Add `nft_assets` market state fields for current listing/sale state.
10. Add Verified Sales APIs and page backed by `rwa_nft_events` joined with `nft_assets`.
11. Move long collection ingestion to a background-friendly job flow.

## Exact Files That Need Changes

Persistence and schema:

- `package.json`
- `docker-compose.yml`
- `src/services/nftTypes.ts`
- `src/services/nftStore.ts`
- `src/services/nftCategoryService.ts`
- `src/services/nftSqliteDb.ts`
- `scripts/migrate-nft-json-to-db.ts`
- `scripts/validate-nft-db.ts`

Market events:

- `src/types/rwaNftMarket.ts`
- `src/services/rwaNftMarketEventService.ts`
- `src/services/heliusEnhancedTransactionParser.ts`
- `src/services/rwaNftMarketplaceListingService.ts`
- `scripts/validate-rwa-market-tracking.ts`

APIs:

- `src/routes/api.nfts.status.ts`
- `src/routes/api.nfts.tracked.ts`
- `src/routes/api.nfts.track.ts`
- `src/routes/api.nfts.untrack.ts`
- `src/routes/api.nfts.refresh.ts`
- `src/routes/api.nfts.collections.ingest.ts`
- `src/routes/api.verified-sales.ts`
- `src/routes/api.rwa-market.events.ts`
- `src/routes/api.rwa-market.latest-sales.ts`
- `src/routes/api.rwa-market.listed.ts`
- `src/routes/api.rwa-market.stats.ts`
- `src/routes/api.webhooks.helius.nft-events.ts`

Jobs:

- `src/jobs/ingestAllowedCollectionsJob.ts`
- `src/jobs/refreshRwaNftMarketData.ts`
- `src/jobs/refreshTrackedNfts.ts`
- `src/jobs/ingestNftCollection.ts`

Frontend:

- `src/routes/_app.sales.tsx`
- New route for `/verified-sales` if separate public path is required.
