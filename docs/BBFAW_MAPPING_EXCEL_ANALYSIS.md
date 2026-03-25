
# BBFAW Parent Mapping Excel Analysis
**Source:** `Database files/ETHICS Pillar/BBFAW folder/BBFAW_2024_Supermarket_Parent_Brand_Mapping_20260311.xlsx`
**Extracted:** 2026-03-25T07:34:55.718Z

## Tabs Found (actual workbook)
| Tab | Rows | Purpose |
|-----|------|---------|
| Parent_Entities | 106 | Parent companies from BBFAW universe |
| Brand_Alias_Map | 106 | Columns: parent_entity_exact, canonical_brand, aliases_csv, brand_type, au_nz_relevance, mapping_confidence, seed_status, tier_2024, impact_2024, tier_delta_vs_2023, impact_delta_vs_2023, notes |
| ReadMe | - | Instructions |

**Note:** User spec referred to BBFAW_Parents, Brand_Mapping, Brand_Aliases. The workbook uses Parent_Entities and Brand_Alias_Map. Structure will be reconciled during implementation.

## Resolution Pipeline (per spec)
1. Barcode scan → product lookup (Open Food Facts)
2. Extract brand string (`brand_owner` or `brands`)
3. Normalize brand (lowercase, &→and, remove punctuation, collapse whitespace)
4. Match against Brand_Aliases → return canonical_brand
5. Look up canonical_brand in Brand_Mapping → return parent_company
6. Pass parent_company to BBFAW scoring engine (bbfaw2024Canonical.json)

## JSON outputs (source of truth)
- `Database files/ETHICS Pillar/BBFAW folder/bbfawParents.json`
- `Database files/ETHICS Pillar/BBFAW folder/brandAliasMap.json`

Run `yarn sync-ethics-data` to copy these to `src/data/ethics/` for app bundle.
