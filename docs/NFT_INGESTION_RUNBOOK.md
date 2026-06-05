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

## Safety Rules

- The seed command refuses unknown mints.
- The transaction signature is required.
- The seed command only creates `SALE` events.
- The seed command defaults to `source=manual`.
- The event is deduplicated by `tx_signature + event_type`.
- The page only displays verified sales that match the same visibility rules as `/api/verified-sales`.
