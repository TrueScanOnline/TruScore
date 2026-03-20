
# KTC 2026 Parent & Brand Alias Mapping – Analysis
**Source:** `Database files/ETHICS Pillar/KTC folder/KTC_2026_Parent_Brand_Alias_Mapping.xlsx`
**Extracted:** 2026-03-20T00:52:40.912Z

## Tabs Found (actual workbook)
| Tab | Rows | Notes |
|-----|------|-------|
| KTC_Parents/Parent_Entities | 42 | Columns: company_id, benchmark_year_parent_company, country, region, subindustry, total_benchmark_score, rank_2025 |
| KTC_Brand_Alias_Map/Brand_Alias_Map | 148 | Columns: benchmark_year_parent_company, canonical_brand, aliases_csv, current_parent_company, ownership_alignment_status, notes |

## JSON outputs (source of truth)
- `Database files/ETHICS Pillar/KTC folder/ktcParents.json`
- `Database files/ETHICS Pillar/KTC folder/ktcBrandAliasMap.json`

Run `yarn sync-ethics-data` to copy these to `src/data/ethics/` for app bundle.
