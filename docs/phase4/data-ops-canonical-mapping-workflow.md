# Data ops — canonical mapping workflow

## Scope

Parent → brand → alias → **product (GTIN)** resolution for scores, recalls, certifications, and user submissions.

## Chain model

```
Parent org (optional)
  └── Brand (marketing)
        └── Alias / search tokens (synonyms, locale variants)
              └── Canonical product (GTIN) + revision
```

## Rules

1. **Canonical key** is GTIN where valid; otherwise internal `product_id` with evidence link.
2. **Aliases** must have `alias_type` (typo | locale | retailer_sku | historic_name).
3. **Override** applies when authoritative source contradicts crowd — reviewer attaches **evidence URL** + **effective_date**.
4. **Market** (AU vs NZ) can map same GTIN to **different** retailer SKUs — keep `market` on mapping row.

## Evidence

Each non-obvious mapping requires: source URL or API response id, screenshot hash (internal), reviewer id.

## Change history

- Append-only **mapping_audit** log: who changed what, prior GTIN, reason code.
- **Review** — two-person for recall-linked changes (policy); single for cosmetic alias.

## Tooling

Minimum contract: [data-ops-minimum-admin-contract.md](data-ops-minimum-admin-contract.md).
