# NZ Dynamic Signals UAT — Diagnostic Report (analysis only)

**Date:** 2026-08-09  
**Authority:** Founder NZ on-device UAT findings A–E  
**Scope:** Diagnosis + smallest-safe remediation recommendations only. **No implementation authorised.**  
**Do not modify** Signal records or identity data based on this report until founders approve.

---

## Executive summary

| Finding | Verdict |
|---------|---------|
| **A — Zero governed Signals** | Matcher + embed are capable of attaching GL-001/GL-002 on NZ when brand chain resolves. Observed zero-Signals are **not** explained by missing publishable pack content. Leading common causes: **wrong binary / Asset flag off**, **public market `UNKNOWN`**, **brand resolution miss/fail-closed on device OFF strings**, and/or **expected Cadbury-wide inheritance for Flake/Crunchie that is not governed**. |
| **B — Ethical “animal testing” card** | Separate **legacy Alerts / MyChoices-preferences path** (`generateInsights` + `CRUEL_PARENTS`). Not an authorised MVP Dynamic Signal. |
| **C — Deferred surfaces** | Alerts tab, Allergens card, Pricing CTA, Subscription route still reachable in MVP journeys; MyChoices Signals context is dormant. |
| **D — Cadbury hierarchy** | Only **B0241 → B0067** is a reviewed brand-child edge. Flake/Crunchie are reviewed Mondelez brands without Cadbury descendant edges — **by design pending founder approval**. |
| **E — `9300617…` prefix** | Third-party GS1 lookups attribute sample GTINs to **Mondelez Australia Pty Ltd**. Usable only as **secondary validation**, never as authoritative brand inference. |

---

## A. Runtime provenance & zero-Signals investigation

### A1. Authorised UAT binary (what should have been tested)

| Field | iOS | Android |
|-------|-----|---------|
| App version | **10.0.0** | **10.0.0** |
| Native build | BN **33** | versionCode **15** |
| EAS build ID | `c4ddec30-3be6-4c8a-b097-ca8486884cd7` | `1af94081-25f8-47f7-bc11-1c12d6ace096` |
| Commit SHA | `934cf1c101dec08c20c12128c38f5b742f726f96` | same |
| Tag | `dynamic-signals-asset-v0.2-uat-20260808-result-isolation` | same |
| EAS profile | `uat-dynamic-signals-ios` | `uat-dynamic-signals-android` |
| Distribution | store → TestFlight | internal APK |
| Content baseline | `a730bcb` / `dynamic-signals-asset-v0.2-uat-20260808` (no Signal content change in isolation commit) | same |

**Hold / not for testers:** BN **31** (`a89c79c8…`) **errored** (no IPA). Pre-isolation `f00d3e1` iOS was cancelled.

### A2. Baked flags / OTA / embed

| Item | Value |
|------|--------|
| `EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET` | **`1`** (EAS profile `env`) |
| `EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH` | `1` |
| `EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT` | **`0`** forced in profile (overrides EAS production secret if present) |
| Runtime producer when Asset=`1` | **`asset`** (`signalsProducerGuard.ts`) — Skeleton flag ignored even if `1` |
| OTA / Expo Updates | **`updates.enabled: false`** in `app.config.js` — binary is source of truth; no OTA channel can rewrite Asset pack |
| Embed `generatedAt` | **`2026-08-08T00:12:27.748Z`** |
| Embed counts | 16 signals / 25 targets / 13 sources; **4 publishable** (`signal_publication_state=publishable`) |
| Publishable IDs | `SIG-SR-AU-003` (AU), `SIG-IN-GL-001` (AU+NZ), `SIG-IN-GL-002` (AU+NZ), `SIG-IN-NZ-005` (NZ) |
| GTIN links in embed | **3 provisional only** (Jalna / Spice Tailor / Chobani) — **none** of the chocolate UAT GTINs |
| Brand-child edges in embed | **1**: `B0241 → B0067` |

### A3. Market resolution (NZ device)

1. `getUserCountryCode()` ← `expo-localization` `regionCode` / languageTag country  
2. `resolveSharedIdentityContext(...).public_market`  
3. Progressive Signals use that `scanMarketPublic`

| Device locale | `public_market` | Asset match |
|---------------|-----------------|-------------|
| NZ | NZ | AU+NZ and NZ targets allowed |
| AU | AU | AU+NZ and AU targets allowed |
| Unreadable / null | **UNKNOWN** | **All matches fail closed** → `signals_ready` / **`empty`** |

There is **no NZ-specific kill switch** beyond market + brand/entity match.

### A4. Progressive path (what device should log)

On Result (`app/result/[barcode].tsx`):

1. Primary TruScore/product with **empty** Signal records → `product_result_ready`  
2. After deferral → `evaluateDynamicSignalsAssetProgressive`  
3. `signals_ready` with `signals_outcome`: `attached` | `empty` | `failed`

If testers only watched the UI and not device logs, confirm **TestFlight BN 33** and ask for console / SCAN_OBS lines for these two events.

### A5. Per-GTIN reproduction (lab, Asset=1, force Asset path)

**Method:** same embed + `resolveReviewedRetailChainUnified` + Asset matcher as BN 33 (Cadbury UAT bridge **off**).  
**Product source:** synthetic brand/name strings (OFF not called in this diagnostic). On-device source will be whatever product fetch returns.

| GTIN | Assumed brands / name (lab) | Market | Resolved brand / parent | Provenance (lab) | Producer | Matched targets | Publication | Runtime Signal outcome |
|------|----------------------------|--------|-------------------------|------------------|----------|-----------------|-------------|------------------------|
| **9300617064879** Cadbury Dairy Milk | brands=`Cadbury`, name contains Dairy Milk | **NZ** | **B0241 / P0009** | identity_resolution; product_name_refine | asset | TGT-015 (GL-001 B0067 descendants), TGT-021 (GL-002 B0241 NZ) | publishable | **2** — GL-001, GL-002 · would be `signals_ready` / **attached** |
| same | same | **UNKNOWN** | B0241 / P0009 | same | asset | — | — | **0** · **empty** (market fail-closed) |
| **9300617042549** Crunchie | brands=`Crunchie` or `Cadbury` + Crunchie name | NZ | **B0244 / P0009** | identity_resolution | asset | — | — | **0** · **empty** (no Cadbury child edge; not a GL-002 target) |
| **9300605155459** KitKat | `KitKat` / `Nestlé, KitKat` | NZ | **B0060 / P0008** | identity_resolution | asset | TGT-022 | publishable | **1** — GL-002 · **attached** |
| **9300682058780** Mars | `Mars` | NZ | **B0050 / P0007** | identity_resolution | asset | TGT-023 | publishable | **1** — GL-002 · **attached** |
| **6942836724894** Hershey's | `Hershey's` | NZ | **B0164 / P0033** | identity_resolution | asset | TGT-025 | publishable | **1** — GL-002 · **attached** |
| Magnum (GTIN **not supplied** in request) | brands=`Magnum` (lab) | NZ | **B0105 / P0014** | identity_resolution | asset | TGT-024 | publishable | **1** — GL-002 · **attached** (brand-name lab only) |

**GTIN table status:** all listed chocolate GTINs are **absent** from `gtin_brand_links` (+ empty extension). Live identity is **brand/alias/name**, not GTIN link.

### A6. Common cause analysis (before any fix)

Ordered by likelihood for “many positives → zero governed Signals”:

1. **Wrong install** — not BN 33 / VC 15 (`934cf1c`). Older TestFlight (27/28/30) or failed BN 31 → Asset may be off → producer **`none`** → empty.  
2. **Market `UNKNOWN`** — device locale not exposing NZ → fail-closed for all Asset targets (lab-proven: Dairy Milk identity OK, Signals still 0).  
3. **On-device brand miss** — OFF/product `brands` strings that do not hit reviewed canonical/alias forms, or cross-parent refine **fail-closed** → `brand_id=null` → no match. Lab shows hits when strings are clean; device OFF may differ.  
4. **Expectation mismatch for Crunchie / non–Dairy Milk Cadbury lines** — resolve to **B0244/B0245**, which **correctly** yield 0 Cadbury-wide Signals today.  
5. **UI mix-up with Finding B** — Ethical Alerts insight visible while Dynamic Signals bucket empty (different pipelines).

**Ruled out as pack/content defect for GL-001/002:** embed contains publishable AU+NZ Signals; NZ market allows AU+NZ targets; matcher attaches when chain resolves.

**Founder confirmation checklist (device):**

- Settings → About / TestFlight card: version **10.0.0**, iOS build **33** (or Android VC **15**)  
- Device Region = New Zealand  
- For one Cadbury Dairy Milk scan, capture logs: `product_result_ready`, `[Dynamic Signals Asset v0.2]`, `signals_ready` + `signals_outcome`  
- Record OFF `brands` / `product_name` as shown on Result  

---

## B. Deferred MyChoices / Alerts — consumer-active path

### Path (complete)

```
Tab “Alerts” (AppTabs → AlertsHome)
  → useAlertsStore preferences (SecureStore; migrate from @truescan_values_*)
  → ethicalEnabled + avoidAnimalTesting toggles
  → Scan Result
  → generateInsights(product, prefs)   // src/lib/alertsInsights.ts
  → TruScoreResult.insights
  → getProductPageAlertsInsights(...)
  → InsightsCarousel (reason + referenceUrl)
```

### Exact unauthorised MVP copy (do not “improve”)

| Field | Source |
|-------|--------|
| Reason | `Parent company linked to animal testing/cruelty` — `alertsInsights.ts` |
| Link | `https://www.crueltyfreeinternational.org/` |
| Label | `Cruelty Free International` |
| Match list | `CRUEL_PARENTS` includes `mars`, `nestle`, `nestlé`, … — **substring on `product.brands` only** |

### Why KitKat / Mars can show this without a Dynamic Signal

| Pipeline | Mechanism |
|----------|-----------|
| **Legacy Alerts insights** | Prefs on + brands contains `mars` / `nestle` → Ethical card |
| **Dynamic Signal GL-002** | Separate progressive Asset path; governed brand-risk Signal |
| **Banner animal-testing** | Uses `brandDatabase.animalTesting`; Mars/Nestlé flags false → banner path does not fire |

So UAT can see the Ethical Alerts card while governed Dynamic Signals are empty/absent — **not** evidence that Asset Signals “leaked” as Ethical alerts.

### Smallest-safe isolation (proposal only — not implementing)

Prefer one of:

1. **Hide Alerts tab + Result InsightsCarousel** behind a single compile-time / env flag (e.g. `EXPO_PUBLIC_MVP_ALERTS_INSIGHTS=0`) default off for UAT/MVP profiles — preserve store + `generateInsights` code for post-MVP.  
2. Or: stop calling `generateInsights` / skip InsightsCarousel on Result when flag off (smaller Result-only cut; Alerts tab prefs remain but inert).

Do **not** rewrite CFI copy or `CRUEL_PARENTS` as part of MVP isolation.

---

## C. Bounded deferred-capability reachability audit

| Capability | Dormant only? | Registered route? | Rendered in MVP journey? | Background / network? | Required for MVP result? | Smallest action |
|------------|---------------|-------------------|--------------------------|----------------------|--------------------------|-----------------|
| **MyChoices / personalised Signals** | **Yes** (types/gates; no `myChoicesContext` from Result) | No consumer screen | No | No | No | Leave dormant; do not wire context |
| **Subscription / paywall / premium** | Partial | **Yes** — root `Subscription`; Profile/Search/Allergens entry | Paywall CTAs reachable | Qonversion init (non-critical) | **No** — init failure → free mode; Result not gated (`ENABLE_PREMIUM_GATING=false`) | Hide Profile Upgrade / Search paywall CTAs for MVP; keep init non-critical |
| **Allergens & Dietary Needs** | No | Via Result modal | **Yes** — Result allergens card | No required network for card shell | No | Hide Result allergens block + modal for MVP |
| **Pricing / trolley** | Trolley absent | N/A | **Yes** — `UniversalPricingCard` web-search CTA on Result | Optional web | No | Hide `UniversalPricingCard` on Result |
| **Accounts / cloud** | Cloud account absent | Profile “Account” stub / comingSoon | Stub only | Local stores only | No | Keep comingSoon or hide Account rows |
| **Advanced / personalised Signals** | MyChoices class gated unused | No | No | No | No | None |

**Subscription-status failure:** warned in root layout; **does not** blank TruScore/product. Treat as UX noise, not scan blocker.

---

## D. Cadbury hierarchy diagnostic

### Reviewed brand rows (wave1-v0.14)

| brand_id | Name | parent_id | review_state |
|----------|------|-----------|--------------|
| B0067 | Cadbury | P0009 Mondelez | reviewed |
| B0241 | Cadbury Dairy Milk | P0009 | reviewed |
| B0244 | Crunchie | P0009 | reviewed |
| B0245 | Flake | P0009 | reviewed |

### Brand-of-brand (`chaining-extensions/v0.1/brand_child_of_brand.csv`)

| Child | Parent brand | review_state |
|-------|--------------|--------------|
| **B0241** Dairy Milk | **B0067** Cadbury | **reviewed** |
| Flake / Crunchie | — | **no rows** |

**Why Dairy Milk inherits Cadbury-wide Signals and Flake/Crunchie do not:**  
Governance explicitly added only `B0241 → B0067` for DSA v0.2 remediation. Further Cadbury chocolate children (Flake, Crunchie, …) were documented as **propose later / founder approval** — not inferred from name or shared parent.

**Signal effect:**

- GL-001 (`B0067` + `brand_descendants`) → B0067 and **B0241** only  
- GL-002 Dairy Milk targets → **B0241** (AU/NZ rows)  
- Product resolving to **B0244/B0245** → **no** GL-001/GL-002 from Cadbury tree  

### UAT GTIN identities (from lab + repo)

| GTIN | In `gtin_brand_links`? | Lab-resolved identity | Notes |
|------|------------------------|----------------------|-------|
| 9300617064879 | No | B0241 / P0009 when name/brands imply Dairy Milk/Cadbury | Documented AU UAT D03 |
| 9300617042549 | No (absent from repo) | B0244 / P0009 when Crunchie resolves | Explains zero Cadbury Signals |
| Flake GTINs | None in repo | B0245 if name resolves | Same limitation |

**Separate proposal (not implementing):** if founders want Flake/Crunchie to inherit Cadbury-wide GL-001, add **reviewed** `brand_child_of_brand` rows `B0244→B0067` and `B0245→B0067` with evidence — after approval. Do **not** invent GTINs or auto-infer from prefix.

---

## E. GTIN-prefix investigation (`9300617…`) — analysis only

### In-repo

- Only Cadbury-related GTIN under this prefix found in repo docs/tests: **`9300617064879`**  
- No GS1 company-prefix / licensee table in A-data  
- `SRC_GS1_NPC_FUTURE_PROVIDER` — no active MVP override strategy  

### External lookups (non-authoritative for Rveel chaining)

| GTIN | Third-party GS1 Name (Buycott / similar) |
|------|----------------------------------------|
| 9300617064879 | **Mondelez Australia Pty Ltd** (Melbourne AU) |
| 9300617304029 (Favourites, related prefix sample) | **Mondelez Australia Pty Ltd** |

`93` = GS1 Australia namespace. Company Prefix length is **variable**; a fixed 7-digit `9300617` slice is **not** proven in-repo as the full GCP.

### Can this be a secondary validation signal?

| Use | Safe? |
|-----|-------|
| Secondary consistency check (“GTIN licensee family matches Mondelez AU when brand already resolves to P0009”) | **Possibly**, after governed import of GS1 AU NPC/GEPIR data |
| Authoritative brand / Cadbury vs Flake vs Crunchie / ownership inference | **No** |

**Limitations:** licensee ≠ on-pack brand; co-pack/shared prefix; variable GCP length; siblings under P0009 (e.g. Ritz) share company proximity without Cadbury brand hierarchy; no reviewed GTIN→brand rows for these SKUs today.

---

## Smallest-safe remediation recommendations (proposal only)

### P0 — Confirm provenance on NZ devices (no code)

1. Verify TestFlight **BN 33** / Android **VC 15** only.  
2. Confirm Region **NZ**.  
3. Capture `product_result_ready` + `signals_ready` for Dairy Milk `9300617064879`.  
4. Record on-screen `brands` / product name for each zero-Signal case.

### P1 — If BN 33 + NZ + clean brands still empty

Investigate device OFF brand strings / fail-closed logs — **identity resolution**, not Signal CSV edits.  
Optional later (founder-approved): reviewed GTIN links for UAT positives — **do not invent**.

### P2 — Isolate legacy Alerts insights from MVP

Env/flag off: Alerts tab and/or Result `InsightsCarousel` / `generateInsights` call. Preserve code for post-MVP. Do not edit CFI copy.

### P3 — Hide other deferred Result surfaces

Hide Allergens card + `UniversalPricingCard`; mute Subscription entry points. Keep Qonversion non-critical.

### P4 — Cadbury hierarchy (separate approval)

If Flake/Crunchie must show GL-001: propose reviewed `brand_child_of_brand` edges only — **not** as part of this diagnostic implementation pass.

### P5 — GS1 prefix

Do **not** wire prefix→brand. Optionally backlog GS1 AU NPC as secondary validation only.

---

## Explicit non-actions (per request)

- No Signal content/scope changes  
- No identity enrichment / new GTINs  
- No copy/link “improvements” to Ethical alerts  
- No implementation of the remediations above until founders authorise  

---

*Evidence bases: EAS build metadata; `eas.json` UAT profiles; `dynamicSignalsAssetRuntimeEmbed.generated.ts`; `signalsProducerGuard.ts`; `app/result/[barcode].tsx`; `matchDynamicSignalsAsset.ts`; `resolveWorkstreamCRetailChain.ts`; `alertsInsights.ts`; wave1 + chaining-extensions CSVs; local Asset reproduction 2026-08-09; third-party GS1 name lookups (Buycott) for prefix discussion only.*
