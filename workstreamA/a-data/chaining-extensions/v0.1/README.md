# Chaining extension v0.1 — product_family + brand/entity hierarchy

Additive governed tables for Rveel Dynamic Signals Asset v0.2.

**Does not mutate** Workstream A wave1-v0.14 `canonical_brands.csv`, `canonical_parents.csv`, `brand_aliases.csv`, or `gtin_brand_links.csv`.

| File | Role |
|------|------|
| `product_families.csv` | Canonical family IDs referenced by Signal_Targets |
| `product_family_membership.csv` | Reviewed GTIN → family membership (market-aware) |
| `brand_child_of_brand.csv` | Reviewed brand → parent-brand for `brand_descendants` |
| `entity_child_of_entity.csv` | Reviewed entity → parent-entity for subsidiary walks (optional; ownership via `canonical_brands.parent_id` remains primary) |

**Family matching rules:** both the family row and the membership row must be `review_state=reviewed`. Fail closed otherwise.

Membership is empty in v0.1 pending founder-reviewed GTINs. Tests may inject reviewed membership in memory only.
