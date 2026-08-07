# Chaining extension v0.1 — product_family + brand/entity hierarchy + Shared Identity enrichment

Additive governed tables for Rveel Dynamic Signals Asset v0.2.

**Does not mutate** Workstream A wave1-v0.14 baseline files. Runtime Asset loaders merge `*_extension.csv` rows after wave1-v0.14.

| File | Role |
|------|------|
| `product_families.csv` | Canonical family IDs referenced by Signal_Targets |
| `product_family_membership.csv` | Reviewed GTIN → family membership (market-aware) |
| `brand_child_of_brand.csv` | Reviewed brand → parent-brand for `brand_descendants` |
| `entity_child_of_entity.csv` | Reviewed entity → parent-entity for subsidiary walks (optional; ownership via `canonical_brands.parent_id` remains primary) |
| `canonical_parents_extension.csv` | Additive reviewed parents (Hoyt Food Mfg; Talley's Group) |
| `canonical_brands_extension.csv` | Additive reviewed brands (Hoyt's; Chickadees; Talley's) |
| `brand_aliases_extension.csv` | Additive aliases for extension brands |
| `gtin_brand_links_extension.csv` | Additive reviewed GTIN links (empty until source-verified) |

**Family matching rules:** both the family row and the membership row must be `review_state=reviewed`. Fail closed otherwise.

Membership remains empty pending founder-reviewed GTINs for tomato-paste / eggs / Keri / butter / Hoyt's turmeric. Tests may inject reviewed membership in memory only.
