# Wave 4 contribution exposure inventory — 2026-08-12

Classification only. **No deletion.** Historical Vercel `manual_products` rows that still contain origin/certification keys remain stored; GET `/api/manual-products` no longer returns those keys, and client merge/scoring no longer copies them onto the scoring Product.

Conservative treatment for any historically exposed origin/cert/nutrition field: **pending**. It must not enter `toScoringProduct`.

## Leak keys (must not score from contributions)

- `manufacturing_places`
- `manufacturing_places_tags`
- `countries`
- `countries_tags`
- `origins`
- `origins_tags`
- `labels_tags`
- `labels_hierarchy`

## Allowed non-scoring proprietary keys

- `allergens_tags`
- `additives_tags`

## Sample classification

| sampleId | leak keys | allowed keys | classification | treatment | delete | score |
|---|---|---|---|---|---|---|
| historical-origin-and-certs | manufacturing_places, countries, labels_tags, labels_hierarchy | — | historical_scoring_field_exposure | pending | no | no |
| allowed-allergens-additives-only | — | allergens_tags, additives_tags | allowed_non_scoring_proprietary | not_applicable | no | no |
| empty-proprietary-row | — | — | no_contribution_fields | not_applicable | no | no |

## Live database

No `DATABASE_URL`/`POSTGRES_URL` in this run. Inventory is the key map + conservative pending treatment above. A live read-only pass can be attached later without changing policy.

## Residual risk

- On-device caches written before this package may still hold leaked origin/cert fields. `calculateTruScore` → `toScoringProduct` strips standalone `user_contributed` records and pending-marked fields. Trusted OFF/SQLite fields are unchanged (W1).
