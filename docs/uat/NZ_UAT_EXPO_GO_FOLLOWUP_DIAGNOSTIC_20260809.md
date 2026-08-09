# NZ UAT diagnostic — Expo Go clarification & bounded follow-up

**Date:** 2026-08-09  
**Supersedes Finding A assumptions in** `NZ_DYNAMIC_SIGNALS_UAT_DIAGNOSTIC_20260809.md` **where that report assumed BN33/VC15.**  
**No Signal or identity changes performed.**

---

## A — Expo Go / Metro Dynamic Signals diagnosis

### A1. Local repo provenance (this workspace — Cursor / TrueScan-FoodScanner)

| Item | Value |
|------|--------|
| Branch | `main` (tracks `origin/main`) |
| `git rev-parse HEAD` | `8973374d23e271afb15ec9eb2ade02a835980234` |
| Tip relation | Docs tip after tag `dynamic-signals-asset-v0.2-uat-20260808-result-isolation` (`934cf1c` binary tip). Runtime Signal code + embed present on this tip. |
| Partner note | Partner ran **his** Metro checkout. Confirm his `git rev-parse HEAD` matches; if divergent, re-run this section on his machine. |

### A2. Effective `EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET` for Metro

| Source | Asset flag |
|--------|------------|
| `.env` | **Absent** (has Qonversion, FSANZ URLs, OFF creds, etc. — **no** `EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET`) |
| `.env.local` | No Asset / Skeleton / Food-recall keys found |
| Shell `process.env` (unconfigured) | `(unset)` |
| `eas.json` `uat-dynamic-signals-*` | `1` — **applies to EAS builds only, not Expo Go** |
| `app.config.js` | Does **not** inject Asset into `extra` |

**Metro/Expo Go inlines `EXPO_PUBLIC_*` at bundle time from the Metro process environment (typically Expo-loaded `.env`).**  
With Asset unset, runtime check `process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET === '1'` is **false**.

### A3. `resolveActiveSignalsProducer()` under Metro-default env

| Env | Producer |
|-----|----------|
| Asset unset / not `'1'` | **`none`** |
| Asset `'1'` | **`asset`** |

Skeleton flag is ignored either way (Asset-only guard).

### A4. Embedded Asset

| Field | Value |
|-------|--------|
| `generatedAt` | `2026-08-08T00:12:27.748Z` |
| Module | `src/dynamicSignals/asset/v0.2/dynamicSignalsAssetRuntimeEmbed.generated.ts` |
| Loaded via | `loadDynamicSignalsAssetPackFromEmbed()` (cached) |

Embed is present in the JS bundle even when producer is `none` — evaluation simply short-circuits to empty.

### A5. Full Expo Go reload after env change

**Not evidenced** that Asset was ever set on the partner Metro session.  
If Asset is later added to `.env`, Expo requires a **full Metro restart + Expo Go reload** (env is baked at bundle time). A Fast Refresh alone is insufficient.

### A6. Known-positive Dairy Milk path (lab on this tip)

GTIN `9300617064879` · brands `Cadbury` · name `Cadbury Dairy Milk Milk Chocolate 180g` · market hint `NZ`:

| Condition | `scanMarketPublic` | brand_id | parent_id | Matched targets / Signals | Outcome |
|-----------|--------------------|----------|-----------|---------------------------|---------|
| **Metro default (Asset unset)** | **NZ** | **B0241** | **P0009** | — | producer `none` → **`signals_ready` / empty** (0 records) |
| Asset=`1` (same identity) | **NZ** | **B0241** | **P0009** | TGT-015 → **SIG-IN-GL-001**; TGT-021 → **SIG-IN-GL-002** | **`attached`** (2 publishable) |

**Revised Finding A (Expo Go):**  
Zero governed Signals on the partner’s Expo Go session is **explained by Asset flag not supplied to Metro**, not by missing pack content, Cadbury hierarchy gaps on Dairy Milk, or NZ market fail-closed. Identity for Dairy Milk **does resolve** (B0241/P0009); producer never runs.

### A7. FSANZ “User is in NZ” vs Dynamic Signals market — same source?

| Path | Function | Result used for |
|------|----------|-----------------|
| FSANZ startup | `getUserCountryCode()` in `fsanDatabaseInitializer.ts` | Log `User is in NZ` / AU |
| Dynamic Signals | `getUserCountryCode()` → `resolveSharedIdentityContext(...).public_market` as `scanMarketPublic` | Asset matcher market gate |

**Same locale source:** both call `getUserCountryCode()` (`expo-localization` region / languageTag).  
**Not identical value:** Signals use **`public_market` after Shared Identity**, which maps internal `AU+NZ` → **`UNKNOWN`**. When the hint is already `NZ` or `AU`, public market stays NZ/AU.

Therefore: FSANZ logging NZ **supports** that locale resolved to NZ, and under that hint Signals `scanMarketPublic` should also be **NZ** — but do **not** treat the FSANZ string as the Signals market field itself. Capture `scanMarketPublic` / `signals_ready` in Result logs for proof on device.

---

## B — Cadbury / Mondelēz chaining: implementation evidence only

**No new relationships inferred or recommended.**

### B1. Source files (approved A-data + extensions)

| Asset | Path |
|-------|------|
| Brands | `workstreamA/a-data/wave1-v0.14/input/canonical_brands.csv` |
| Parents | `workstreamA/a-data/wave1-v0.14/input/canonical_parents.csv` |
| Aliases | `workstreamA/a-data/wave1-v0.14/input/brand_aliases.csv` |
| GTIN links | `workstreamA/a-data/wave1-v0.14/input/gtin_brand_links.csv` |
| Brand child-of-brand | `workstreamA/a-data/chaining-extensions/v0.1/brand_child_of_brand.csv` |
| Brand / parent / alias / GTIN extensions | `workstreamA/a-data/chaining-extensions/v0.1/*_extension.csv` |

### B2. Runtime load path (app)

| Step | Module |
|------|--------|
| Embed generation | `scripts/generate-dynamic-signals-asset-runtime-embed.ts` → concatenates wave1 + extension rows into `DYNAMIC_SIGNALS_ASSET_RUNTIME_EMBED` |
| Runtime | `loadADataForChainFromEmbed()` + pack family/hierarchy from same embed |
| Chain | `resolveReviewedRetailChainUnified` (`applyCadburyUatBridge: false` on Asset path) |
| Descendants | `brand_child_of_brand` via `buildBrandHierarchyMapsFromCsvRecords` / Asset matcher `brand_descendants` |

### B3. Parent

| parent_id | Name | review_state |
|-----------|------|--------------|
| **P0009** | Mondelez International, Inc. | reviewed (wave1) |

### B4. All current canonical brands under P0009 (wave1; extension adds **0** P0009 brands)

| brand_id | canonical_brand_name | brand_type | review_state |
|----------|----------------------|------------|--------------|
| B0067 | Cadbury | global_brand | reviewed |
| B0068 | Oreo | global_brand | reviewed |
| B0069 | Ritz | global_brand | reviewed |
| B0070 | Philadelphia | global_brand | reviewed |
| B0071 | Toblerone | global_brand | reviewed |
| B0072 | Pascall | global_brand | reviewed |
| B0073 | The Natural Confectionery Co. | global_brand | reviewed |
| B0074 | Sour Patch Kids | global_brand | reviewed |
| B0075 | belVita | global_brand | reviewed |
| B0241 | Cadbury Dairy Milk | global_brand | reviewed |
| B0242 | Caramilk | global_brand | reviewed |
| B0243 | Boost | global_brand | reviewed |
| B0244 | Crunchie | global_brand | reviewed |
| B0245 | Flake | global_brand | reviewed |
| B0246 | Freddo | global_brand | reviewed |
| B0247 | TUC | global_brand | reviewed |
| B0248 | Triscuit | global_brand | reviewed |
| B0249 | Wheat Thins | global_brand | reviewed |
| B0250 | Chips Ahoy! | global_brand | reviewed |
| B0251 | Milka | global_brand | reviewed |
| B0252 | Côte d'Or | global_brand | reviewed |
| B0253 | Daim | global_brand | reviewed |
| B0254 | 5 Star | global_brand | reviewed |
| B0538 | Captain's Table | local_brand | reviewed |
| B0539 | Nabisco | brand_family | **provisional** |
| B0598 | Trident | global_brand | reviewed |
| B0599 | Halls | global_brand | reviewed |

**Count:** 27 wave1 rows under P0009; **0** extension brand rows under P0009.

### B5. Aliases relevant to Cadbury family (implemented)

| alias_id | alias | → brand_id | parent | review_state | file |
|----------|-------|------------|--------|--------------|------|
| A0027 | Dairy Milk | B0241 | P0009 | reviewed | wave1 `brand_aliases.csv` |
| A0132 | cadbury chocolate | B0067 | P0009 | reviewed | wave1 |
| A0134 | toblerone chocolate | B0071 | P0009 | reviewed | wave1 |

No Flake/Crunchie/Cadbury plain-name alias rows in extension file (header-only / no Cadbury hits).

### B6. All `brand_child_of_brand` rows involving Cadbury

| brand_id | parent_brand_id | review_state | confidence | lineage_reference |
|----------|-----------------|--------------|------------|-------------------|
| **B0241** | **B0067** | reviewed | strong | DSA-v0.2-remediation\|cadbury-dairy-milk |

**Only row in the file.** No Flake/Crunchie/Cadbury-other child edges.

### B7. Reviewed GTIN links / resolution examples

| GTIN | In wave1 / extension links? | Runtime resolution example |
|------|-----------------------------|----------------------------|
| Any Cadbury / `9300617…` | **None** in `gtin_brand_links.csv` or extension (extension header-only) | Dairy Milk `9300617064879` resolves via **name/brands** → B0241/P0009 (not GTIN link) |
| Wave1 GTIN rows present | Only provisional Jalna / Spice Tailor / Chobani | Not Cadbury family |

### B8. Divergence: implemented runtime vs approved A-data / extensions

| Check | Result |
|-------|--------|
| Embed brand rows sourced from wave1 + extension | Yes (generator concatenates) |
| Embed `brandChildOfBrand` vs CSV | **Match** — single B0241→B0067 row |
| Extension P0009 brands | **None** — no divergence from empty extension |
| Cadbury GTIN links | Approved tables empty of Cadbury GTINs; embed likewise |
| Cadbury UAT bridge | **Off** on Asset runtime (`applyCadburyUatBridge: false`) — not an A-data row; behavioural gate only |

**Fidelity conclusion for founder/ChatGPT review:** Runtime Cadbury/Mondelēz representation matches approved wave1 v0.14 + chaining-extension files as committed; no silent Cadbury child edges beyond B0241→B0067.

---

## C — Legacy Planet CSV runtime reachability

### C1. Startup

`app/_layout.tsx` non-critical task `csvDatabases` → `initializeCSVDatabases()` eagerly loads in-memory EWG Dirty Dozen, RSPO, Idemat, FAO, USDA PDP, Agribalyse fallback (`csvDatabaseService.ts`).

### C2. Consumers of query/helpers

| Consumer | Uses CSV methods? |
|----------|-------------------|
| `src/lib/truscoreEngine/pillars/planetPillar.ts` (Planet v19) | **No** — Eco-Score grade + `computePackagingFallback` only |
| Product retrieval / Result assembly / Score Highlights | **No** imports of `getCSVDatabaseService` |
| `backend/vercel/api/product-preview.ts` | Calls `initializeCSVDatabases()` before pillars, but pillars **do not read** the service — vestigial init |
| `src/__tests__/unit/services/csvDatabaseService.test.ts` | Yes — unit tests |
| `scripts/archive/one-time/test-planet-pillar.ts` | Yes — archived tooling |

**Classification:** **Startup-loaded (and preview API init) but otherwise unreachable** from governed MVP Planet scoring / scan Result. Used by **tests + archived script** only for queries.

### C3. Planet v19 conflict

| Path | Conflict? |
|------|-----------|
| Governed Planet score | **No conflict in score math** — v19 path does not call CSV DBs |
| Operational | **Yes — noise / cost:** superseded datasets still initialise on every app start (Metro and native), contradicting “single source of truth” hygiene |

### C4. Smallest safe action (proposal only — not implementing)

- Gate or remove the `csvDatabases` init task in `app/_layout.tsx` (and vestigial `initializeCSVDatabases` in `product-preview.ts`) behind a non-MVP / test-only path.  
- Keep `csvDatabaseService.ts` + unit tests for reference until founders approve deletion.  
- Do **not** alter Planet v19 scoring as part of that isolation.

---

## D — Proposed bounded MVP Runtime Reachability & Single-Source-of-Truth Audit

### D1. Proposed scope (approval required before implementation)

**In scope**

1. **Startup / init tasks** in `app/_layout.tsx` (and any parallel App bootstrap): each task → criticality → whether it mutates consumer-visible state or network.  
2. **Scan pipeline only:** barcode → product retrieval → Body/Planet/Ethics/Open → Dynamic Signals progressive attach → `ProductScanResult` / Result UI assembly.  
3. **Registered/reachable consumer routes + background/store/network** for explicitly deferred modules: MyChoices/personalisation, subscription/paywall, Allergens & Dietary Needs, pricing/trolley, accounts/cloud, advanced/personalised Signals, **legacy Alerts insights**, **legacy Planet CSV DBs**.  
4. **Duplicate / legacy / superseded producers** capable of affecting those outputs (e.g. Alerts insights vs Asset Signals; CSV Planet vs Planet v19; Skeleton flag vs Asset).

**Out of scope**

- Broad refactor, deletion, tech-debt cleanup, Signal/identity content edits, Planet methodology redesign, Cadbury completeness amendments.

**Deliverable when approved:** matrix of init/route/producer → classification (dormant / reachable / affects MVP output) → minimum isolate action only where an approved MVP output is at risk or superseded work still executes.

### D2. Known concrete findings already established (pre-audit)

| Finding | Evidence |
|---------|----------|
| Expo Go UAT ran **without** Asset env → producer `none` | `.env` lacks flag; lab empty vs attached |
| FSANZ NZ log shares `getUserCountryCode` with Signals hint | `fsanDatabaseInitializer.ts` / Result progressive path |
| Legacy Ethical Alerts insights still consumer-reachable | `generateInsights` + Alerts tab + InsightsCarousel |
| CSV Planet DBs init at startup; not used by Planet v19 | `_layout` + `planetPillar.ts` |
| Subscription init non-critical; paywall/Allergens/Pricing still reachable | prior NZ diagnostic §B–C |
| Cadbury runtime chaining matches approved A-data (B0241→B0067 only) | §B above |

### D3. Minimum follow-up options (for founder approval)

1. **P0 Expo Go:** Set `EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET=1` in partner Metro `.env`, full restart/reload, re-scan Dairy Milk; or switch to BN33 TestFlight.  
2. **P1 Audit execution:** Approve §D1 scope → produce isolate matrix only.  
3. **P2 Optional isolates (after approval):** Alerts insights flag-off; CSV init skip; hide deferred Result CTAs.

---

*No implementation performed under this request.*
