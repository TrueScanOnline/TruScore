# Chaining extension v0.3 — current SoT with wave1-v0.16

Shared Identity chaining for Dynamic Signals owns **parents + brands + aliases + hierarchy only**.

Included artefacts:

- `canonical_brands_extension.csv` / `canonical_parents_extension.csv`
- `brand_aliases_extension.csv`
- `brand_child_of_brand.csv` / `entity_child_of_entity.csv`

**No GTIN scaffold** in this directory (no `gtin_brand_links_extension.csv`).

Product / product-family scope for Signal resolution lives in Workstream C
(`workstreamC/c-data/dynamic-signals-v0.3/input/signal_target_product_criteria.csv`).
This directory must **not** contain `product_families`, `product_family_aliases`,
`product_identities`, `product_identity_aliases`, or `product_family_membership`.

Historical `wave1-v0.15` / `chaining-extensions/v0.2` are unmutated. Runtime consumes
`review_state=reviewed` only.
