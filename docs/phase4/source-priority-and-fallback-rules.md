# Source priority and fallback rules

Aligns runtime behavior with **confidence**, **alerts**, and **claim governance**. Implementation reference: `src/services/productServiceOptimized.ts`, `src/utils/confidenceScoring.ts`.

## Source order (by market)

### Australia (AU)

1. **Authoritative / open product identity** — e.g. Open Food Facts, GS1-backed paths where configured, government nutrition where applicable.
2. **Retailer APIs** — Woolworths, Coles, IGA (when barcode matches catalog).
3. **Enrichment** — nutrition panels, images, extended attributes.
4. **Fallback APIs** — only if enabled and completeness gate passes (see below).

### New Zealand (NZ)

1. Same pattern as AU with **NZ-specific** retailer sources (Pak’nSave, New World, Woolworths NZ, etc.).
2. FSANZ / NZ parallel paths where applicable.
3. Fallbacks — same gating as AU.

**Note:** Exact ordered list in code is the source of truth; this doc states **policy**. When code order diverges, either update code or update this doc in the same PR.

## When fallback APIs are allowed

All must be true:

1. `EXPO_PUBLIC_ENABLE_FALLBACK_APIS` is **true** (or equivalent runtime flag).
2. **Completeness** is below the configured threshold (currently **70%** in optimized fetch).
3. Primary + secondary phases have had a fair chance to respond (respect phase timeouts).

## When partial data is acceptable

- **Identity** (barcode, name, brand) present with medium confidence → may show shell + “limited analysis”.
- **Nutrition or ethics** missing → score may use **available pillars** with coverage flags.
- **Certifications** missing → omit cert badges; do not infer.

## When confidence must be downgraded

- Source is in **low** reliability tier (`confidenceScoring.ts`: open_gtin, barcode_monster, web_search, etc.).
- Product is merged from **conflicting** sources — use lowest relevant confidence or explicit “mixed sources”.
- Stale cache beyond policy → downgrade or trigger background refetch with UI note.

## When “limited data” (or equivalent) must appear

- Completeness below “full analysis” threshold.
- Any pillar required for a **specific marketing claim** is missing — suppress that claim line; show methodology link.
- Fallback-only identity with no corroborating high-reliability source.

## When derived outputs are suppressed

| Condition | Suppress |
|-----------|----------|
| No ingredient list | Ingredient-level alerts and some ethics subscores |
| No certification evidence | Certification-based trust lines |
| Recall match uncertain | Active recall **safety** surface — show “check authority” copy instead of definitive match |
| User preference off | Preference-class signals only (not safety) |

## Backend aggregation

When `EXPO_PUBLIC_API_URL` proxies product fetch, **server-side source order** must match this policy or this document must record server-specific order.

## Related

- [runtime-fetch-graph.md](runtime-fetch-graph.md)
- [confidence-and-coverage-rules.md](confidence-and-coverage-rules.md)
- Phase 2 claim registry for copy class boundaries.

---

## Appendix A — Concrete source order (Phase 5, tied to code)

**Source of truth:** `src/services/productServiceOptimized.ts` (client scan path) and `src/data/databases/truScoreOptimizedDatabase.ts` (`queryAllDatabases` → `executeQueryPhases`). **MVP note:** `MVP_MODE === true` in `truScoreOptimizedDatabase.ts` disables AU/NZ retailer aggregation and some store APIs until post-MVP.

### A.1 Prefetch / instant path (`fetchProductOptimized`)

When `useCache === true`, order is:

1. `lookupProductFast` — SQLite and/or AsyncStorage cache (whichever wins internally).
2. If hit → **return immediately**; optional background `fetchProductFromOFF` refresh (non-blocking).

When `useCache === false`:

1. `lookupFromSQLite` only; if hit → return immediately.

### A.2 Phase 1 — fast barcode APIs (cache miss)

Executed in `executeFetchProductOptimized` after cache miss:

1. `fetchProductFromOFF(primaryBarcode)` — Open Food Facts.
2. `fetchProductFromOBF(primaryBarcode)` — Open Beauty Facts **only if** there is no OFF hit **or** OFF product is **not** food-like (`isOpenFactsFoodLikeProduct`); otherwise OBF is skipped.

Merge preference when multiple Phase-1 products exist: **SQLite/cache > OFF > OBF** (see fastSources selection in code).

### A.3 Phase 2 / 3 — `TruScoreOptimizedDatabase.queryAllDatabases`

All **tier groups** below are fired **in parallel** (`Promise.allSettled`); order inside a tier is logical, not wall-clock sequential.

#### Tier “Open Facts” (`queryOpenFactsParallel`)

1. Open Food Facts — reused from `seedProducts` when Phase 1 already fetched OFF.
2. Open Beauty Facts — seeded or fetched; **skipped** when seeded OFF is food-like.
3. Open Pet Food Facts — **skipped** when seeded OFF is food-like.
4. Open Products Facts — **skipped** when seeded OFF is food-like.

#### Tier “Local” (`queryLocalFirstParallel`)

Country-gated parallel set:

| Source | When queried |
|--------|----------------|
| `queryFSANZByProductName(earlyProductName, userCountry)` | `userCountry` is `AU` or `NZ`, and `earlyProductName` is present and not a placeholder |
| `fetchProductFromUSDA` | `userCountry === 'US'` |
| `fetchProductFromHealthCanada` | `userCountry === 'CA'` |
| `fetchProductFromUKFSA` | `userCountry === 'GB'` |
| `fetchProductFromEFSA` | `isEUCountry(userCountry)` |
| `fetchProductFromNZStores` | `userCountry === 'NZ'` and **`!MVP_MODE`** |
| `fetchProductFromAURetailers` | `userCountry === 'AU'` and **`!MVP_MODE`** |
| `fetchProductFromWalmart`, `fetchProductFromFoodRepo` | `userCountry === 'US'` and **`!MVP_MODE`** |
| FoodAtlas (name) | `earlyProductName` valid |

#### Tier “Gold Standard” (`queryGoldStandardParallel`)

1. `fetchProductFromGS1` — **2s** `Promise.race` timeout (may resolve null).

#### Tier “Enhancements” (`queryEnhancementsParallel`)

When `EXPO_PUBLIC_ENABLE_COMMERCIAL_NUTRITION_APIS === 'true'` **and** baseline nutrition is below internal threshold:

1. Edamam  
2. Nutritionix  
3. Spoonacular  

When **`!MVP_MODE`** and `userCountry !== 'US'`:

- `fetchProductFromWalmart`, `fetchProductFromFoodRepo` (each best-effort).

#### Tier “Fallbacks” (`queryFallbacksParallel`)

Circuit-breaker gated; all **best-effort** in parallel, then **5s** outer cap on the batch:

1. Datakick  
2. OpenEAN  
3. Product Open Data  
4. UPCitemdb  
5. EAN-Search  
6. Barcode Spider  
7. GoUPC  
8. Buycott  
9. Open GTIN  
10. Barcode Monster  
11. UPC Database  
12. Barcode Lookup  
13. EAN Data  
14. Best Buy — only if category suggests electronics/tech  
15. BarcodeLookup.com  

**Note:** `productServiceOptimized` additionally gates **calling** this tier in the main return path with `shouldQueryFallbacks` (`EXPO_PUBLIC_ENABLE_FALLBACK_APIS` and completeness rules). Inside `queryAllDatabases`, fallback tier is still scheduled as part of the parallel bundle when this path runs.

### A.4 Background vs blocking

- **Early return:** When Phase 1 `hasGoodData`, the service returns after `processProductFast` / user-merge while Phase 2/3 `queryAllDatabases` continues in the background (same barcode).

### A.5 Maintenance

When adding a database call, update **this appendix** in the same PR as code, or add a CI check that greps for `queryNames.push` / new `fetchProductFrom*` in these two files.
