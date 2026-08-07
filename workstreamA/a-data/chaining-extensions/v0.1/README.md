# Chaining extension v0.1 — product_family

Additive governed tables for Rveel Dynamic Signals Asset v0.2 `family_members` propagation.

**Does not mutate** Workstream A wave1-v0.14 `canonical_brands.csv`, `canonical_parents.csv`, `brand_aliases.csv`, or `gtin_brand_links.csv`.

| File | Role |
|------|------|
| `product_families.csv` | Canonical family IDs referenced by Signal_Targets |
| `product_family_membership.csv` | Reviewed GTIN → family membership (market-aware, lineage-bearing) |

Membership is empty in v0.1 pending founder-reviewed GTINs. Runtime matching fails closed when membership is absent. Tests may inject reviewed membership in memory only.
