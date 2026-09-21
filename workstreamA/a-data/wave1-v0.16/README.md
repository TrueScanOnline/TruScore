# Wave 1 A-Data pack v0.16

Successor to `wave1-v0.15` (unmutated). Adds founder-authorised AU/NZ shelf consumer brands/parents for September 2026 SI refresh.

**Active Shared Identity scope (with `chaining-extensions/v0.3`):**

- canonical parents / entities
- canonical brands (including child-brand hierarchy)
- approved brand aliases
- brand/entity relationship metadata

**Not part of Shared Identity:**

- product names, product IDs, product families, pack/variant data
- GTIN→brand ownership links (`gtin_brand_links.csv` is retired header-only; runtime does not consult it)

Product-specific Signal scope lives in Workstream C (`signal_target_product_criteria.csv`).
