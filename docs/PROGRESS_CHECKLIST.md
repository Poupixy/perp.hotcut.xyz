# Progress Checklist

Last updated: 2026-06-05

## Implemented And Deployed

- [x] `perp-rwa` runs in Docker on the VPS.
- [x] Public route `https://perp.hotcut.xyz/` stays behind `127.0.0.1:3002`.
- [x] Persistent SQLite storage is active at `/app/data/perp-rwa.sqlite`.
- [x] Docker persistence for `/app/data` is active.
- [x] Core NFT tables exist:
  - [x] `tracked_nfts`
  - [x] `nft_assets`
  - [x] `queue_state`
  - [x] `rwa_nft_events`
- [x] Runtime NFT categories are limited to approved markets:
  - [x] `pokemon`
  - [x] `one_piece`
  - [x] `basketball`
  - [x] `football`
  - [x] `hockey`
  - [x] `baseball`
  - [x] `soccer`
  - [x] `yugioh`
  - [x] `dragon_ball`
  - [x] `magic_the_gathering`
- [x] Helius DAS metadata fetch is implemented for controlled NFT mints.
- [x] Helius Enhanced Transaction sale enrichment is implemented.
- [x] Magic Eden / Helius sale parsing supports explicit `NFT_SALE` events.
- [x] Transfer-pattern fallback detects clear NFT sale patterns when Helius marks a transaction as `UNKNOWN`.
- [x] Parser prefers `events.nft.nfts[0].mint` over fungible token transfers, preventing USDC mint pollution.
- [x] `/verified-sales` is deployed and reads `SALE` events from `rwa_nft_events` joined with `nft_assets`.
- [x] `/api/verified-sales` is deployed.
- [x] Operational scripts exist:
  - [x] `npm run validate:nft-db`
  - [x] `npm run validate:rwa-market`
  - [x] `npm run check:verified-sales`
  - [x] `npm run seed:verified-sale`
  - [x] `npm run test:one-nft-flow`
  - [x] `npm run enrich:sale-from-tx`
  - [x] `npm run backfill:verified-sales`
- [x] A controlled 15-signature batch was reviewed.
- [x] The reviewed batch saved 13 clear on-chain sales.
- [x] The batch preserved detected categories:
  - [x] 11 Pokémon sales
  - [x] 2 Basketball sales
- [x] The 2 rejected transactions remained unsaved.
- [x] SQLite backup was created before the write:
  - [x] `/app/data/perp-rwa.backup-before-backfill-20260605-054111.sqlite`
- [x] Backfill report was written:
  - [x] `/app/data/backfill-reports/verified-sales-backfill-20260605-054111.json`

## Current VPS Data State

- [x] `tracked_nfts`: 15
- [x] `nft_assets`: 15
- [x] `rwa_nft_events` SALE rows: 15
- [x] visible verified sales: 15
- [x] on-chain verified sales: 14
- [x] manual test sales: 1
- [x] unknown NFTs: 0
- [x] staging NFTs: 0
- [x] events missing transaction signature: 0

## Completed Workflow

- [x] Backfill safety workflow hardening.
  - [x] Review mode produces a JSON report without writing DB rows.
  - [x] Commit mode saves only from a previously generated reviewed report.
  - [x] Commit mode refuses to reinterpret categories or transactions.
  - [x] Commit mode creates a SQLite backup before writing.
  - [x] Commit mode skips duplicate `tx_signature + event_type`.

## Next

- [ ] Improve `/verified-sales` filters only after the reviewed backfill workflow is complete.
  - [ ] category
  - [ ] marketplace
  - [ ] source
  - [ ] date range
  - [ ] price range
  - [ ] hide test sales by default

## Not Started

- [ ] Full collection ingestion at scale.
- [ ] Automated scheduled sales backfill.
- [ ] Active listings production ingestion.
- [ ] Perp trading UI.
- [ ] Solana program deployment.

## Guardrails

- [x] Do not touch Hotcut production.
- [x] Do not touch Hotcut preproduction.
- [x] Do not scan all NFTs.
- [x] Do not ingest full collections without explicit approval.
- [x] Keep `perp-rwa` isolated to its own app and Docker service.
