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

## Why Verified Sales Can Show Missing Data

Manual seeded sales are only for UI and pipeline testing. They prove that `nft_assets`, `rwa_nft_events`, `/api/verified-sales`, and `/verified-sales` are connected, but they do not contain real buyer, seller, USD price, marketplace, or blockchain timestamp unless those values are explicitly supplied.

Buyer, seller, USD price, marketplace, and real sale timestamp require a trusted source:

- Helius Enhanced Transactions for real Solana transaction signatures.
- Marketplace APIs later, when provider endpoints are configured.

Use this command with a real Solana sale transaction signature to enrich a sale from on-chain data:

```bash
npm run enrich:sale-from-tx -- --tx=<real_solana_sale_transaction_signature>
```

Optional matching arguments:

```bash
npm run enrich:sale-from-tx -- --tx=<real_solana_sale_transaction_signature> --mint=<mint> --market=pokemon --force=true
```

`--mint` is only used for matching when the transaction parser cannot detect the mint. It does not create fake buyer, seller, price, or marketplace values.

The API equivalent is disabled unless `RWA_MARKET_ADMIN_SECRET` is configured:

```bash
curl -X POST https://perp.hotcut.xyz/api/rwa-market/enrich-sale \
  -H "content-type: application/json" \
  -H "x-admin-secret: <secret>" \
  -d '{"txSignature":"<real_solana_sale_transaction_signature>"}'
```

## Safety Rules

- The seed command refuses unknown mints.
- The transaction signature is required.
- The seed command only creates `SALE` events.
- The seed command defaults to `source=manual`.
- The event is deduplicated by `tx_signature + event_type`.
- The page only displays verified sales that match the same visibility rules as `/api/verified-sales`.
