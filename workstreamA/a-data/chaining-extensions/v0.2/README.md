# Chaining extension v0.2 — current SoT with wave1-v0.15

Copied from `chaining-extensions/v0.1` then refreshed under the 20260816 AU/NZ Chaining / Shared Identity instruction.

Historical `wave1-v0.14` and `chaining-extensions/v0.1` are preserved and not rewritten.

Runtime Asset loaders merge `*_extension.csv` rows after wave1-v0.15. Only `review_state=reviewed` rows are consumed.

| File | Role |
|------|------|
| `product_families.csv` | Canonical family IDs referenced by Signal_Targets (unchanged from v0.1 copy) |
| `product_family_membership.csv` | Reviewed GTIN → family membership |
| `brand_child_of_brand.csv` | Reviewed brand → parent-brand for brand_descendants |
| `entity_child_of_entity.csv` | Reviewed entity → parent-entity (Open Country Dairy → Talley's; GWF → ABF) |
| `canonical_*_extension.csv` | Additive Hoyt / Chickadees / Talley's rows from v0.1 |

**Family matching rules:** both the family row and the membership row must be `review_state=reviewed`. Fail closed otherwise.

Do not invent GTINs. Cadbury children are Cadbury descendants; Oreo is not. Pringles is Mars, not a Kellogg's child. Yoplait AU/NZ and Tip Top Bakery/Ice Cream and Primo dairy vs meat fail closed on bare aliases.
