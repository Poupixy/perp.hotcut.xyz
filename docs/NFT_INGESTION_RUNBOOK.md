# NFT Ingestion Runbook

This runbook is for the persistent NFT metadata and verified-sales database.

## Operational Order

Run these commands from the app folder:

```bash
npm run validate:nft-db
npm run migrate:nft-json
npm run validate:nft-db
npm run seed:verified-sale -- --mint=<existing_mint> --priceSol=1 --tx=<real_or_test_signature> --marketplace=manual
npm run check:verified-sales
```

## Expected Result

After `seed:verified-sale` is run with a mint that already exists in `nft_assets`, the sale is inserted into `rwa_nft_events`, the current NFT state in `nft_assets` is updated, and `/verified-sales` displays one confirmed SALE event.

## First Real NFT Test

Use this flow before ingesting larger Collector Crypt or Phygitals datasets. It tracks one explicit real mint, fetches its metadata from Helius, then seeds one manual verified sale.

```bash
npm run test:one-nft-flow -- --mint=<real_nft_mint> --market=pokemon --label="First real NFT test" --priceSol=1 --tx=TEST_SIGNATURE_FIRST_VERIFIED_SALE_001 --marketplace=manual
npm run validate:nft-db
npm run check:verified-sales
```

Expected result:

- `nft_assets` should be at least `1`.
- `tracked_nfts` should be at least `1`.
- Verified sales should be at least `1`.
- `/verified-sales` should display the seeded sale.

Do not run full collection ingestion for this test.

## Safety Rules

- The seed command refuses unknown mints.
- The transaction signature is required.
- The seed command only creates `SALE` events.
- The seed command defaults to `source=manual`.
- The event is deduplicated by `tx_signature + event_type`.
- The page only displays verified sales that match the same visibility rules as `/api/verified-sales`.
