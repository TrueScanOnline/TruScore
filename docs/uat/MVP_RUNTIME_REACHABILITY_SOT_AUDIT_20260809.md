# MVP Runtime Reachability & Single-Source-of-Truth Audit — FINAL v0.5

**Date:** 2026-08-09  
**Authority:** Founder-approved bounded audit (NZ UAT follow-up)  
**Baseline tip audited:** `main` @ `8973374d23e271afb15ec9eb2ade02a835980234` (runtime Signal code from `934cf1c` tag tip)  
**Scope:** Startup; scan → product → four pillars → Dynamic Signals → result; deferred surfaces; duplicate/legacy producers.  
**Out of scope / not performed:** Implementation, deletion, refactor, deferred activation, Chaining data amendments, general Cadbury/data-completeness review.

**Accepted prior diagnostics (A–C):** Expo Go zero-Signals = UAT env/config failure; Chaining runtime matches approved assets; legacy Planet CSV eagerly init, not consumed by Planet v19.

---

## 0. Severity key (against FINAL v0.5)

| Level | Meaning |
|-------|---------|
| **P0** | Mission-critical contradiction with FINAL v0.5 / can ship wrong or empty required MVP output without detection |
| **P1** | Deferred/Post-MVP surface consumer-reachable or superseded path still executing in MVP journeys |
| **P2** | Operational noise / unnecessary execution without score corruption; or UAT/process gap |
| **P3** | Dormant/reference/test-only; record for later cleanup |

**Classification classes (per finding):**  
`required primary-result dependency` · `legitimate secondary enrichment` · `dormant/reference/test-only` · `deferred but consumer-reachable` · `deferred/legacy and unnecessarily executing` · `duplicate/superseded production path`

---

## 1. Release-path Asset flag control (Finding A extension)

### Evidence

| Path | `EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET` |
|------|-------------------------------------|
| `eas.json` → `uat-dynamic-signals-ios` / `uat-dynamic-signals-android` | **`1`** (explicit) |
| `eas.json` → `production`, `production-apk`, `preview`, `preview-apk`, `development` | **Absent** |
| `.env` / `.env.example` | **Absent** |
| `app.config.js` | Does not bake Asset into `extra` |
| `src/utils/environmentValidation.ts` | Validates Qonversion/USDA/GS1 only — **does not mention Asset** |
| Runtime gate | `signalsProducerGuard.ts`: unset/`≠'1'` → **`producer=none`** (fail closed, silent empty Signals) |

EAS “production” project secrets may still inject vars at build time, but **committed release profiles do not require or assert Asset=1**. There is **no** package.json / CI preflight that fails a store build when Asset is missing.

### Verdict

**Yes — intended store/release profiles can silently produce `producer=none`.**  
Existing validation does **not** prevent this. UAT profiles alone are insufficient for production.

| ID | Classification | Severity | Consumer/launch consequence | Smallest safe action (proposal only) |
|----|----------------|----------|-------------------------------|--------------------------------------|
| **R-01** | duplicate/superseded production path *(fail-closed empty Signals)* / release SoT defect | **P0** | Store `production`/`preview` binaries can ship without governed Dynamic Signals while product/TruScore appear healthy | (1) Set `EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET=1` on every store/release EAS profile that is intended to deliver MVP Signals (`production` at minimum; `preview` if used for TestFlight). (2) Add a **preflight assert** in release builds: fail if release profile and Asset ≠ `1` (extend `environmentValidation` for release/`!__DEV__`, or a one-line EAS/`npm` preflight script). Do **not** change matcher/identity. |

Expo Go / Metro without `.env` remains a **UAT process** issue (accepted Finding A), not Asset remediation.

---

## 2. Startup / initialization tasks (`app/_layout.tsx`)

| Task | Critical? | Classification | Severity | Consequence | Smallest safe action |
|------|-----------|----------------|----------|-------------|----------------------|
| `environmentValidation` | No | Legitimate secondary (incomplete — see R-01) | P0 gap covered in R-01 | Warnings only today; Asset not checked | Extend assert per R-01 |
| `rateLimiter` | No | Legitimate secondary enrichment | P3 | Rate limits for fetches | None |
| **`csvDatabases`** | No | **Deferred/legacy and unnecessarily executing** | **P1** | Eager load EWG/RSPO/Idemat/FAO/USDA/Agribalyse; **not** read by Planet v19 | Skip/gate init on MVP launch path; keep module + tests (no delete yet) |
| `settingsStore` | **Yes** | Required primary-result dependency | — | Onboarding + settings | None |
| `scanStore` | No | Required primary (history) | — | Scan history | None |
| `favoritesStore` | No | Legitimate secondary / MVP shell | P3 | Favourites | None for SoT |
| **`subscriptionStore`** | No | Deferred but consumer-reachable + background network | **P1** | Qonversion init; failure → free mode (non-blocking); Upgrade CTAs still reachable | Keep non-critical; hide Upgrade/paywall entry points for MVP |
| `fsanDatabaseInitializer` | No | Legitimate secondary (locale log + API preference messaging) | P2 | Uses `getUserCountryCode()`; server API preferred | None for Signals; optional reduce log noise |
| `fsanDatabaseAutoUpdate` | No | Deferred/legacy and unnecessarily executing *(local FSANZ auto-update; download path largely disabled)* | P2 | Background FSANZ maintenance | Confirm no-op in practice; gate if still schedules work |

---

## 3. Scan → product → pillars → Signals → result assembly

### 3.1 Required primary path (SoT)

| Stage | Producer / module | Classification | Notes |
|-------|-------------------|--------------|-------|
| Product retrieval | `fetchProductOptimized` / fallbacks | Required primary | OFF + FSANZ API + other sources |
| TruScore / pillars | `calculateTruScore` → Body / **Planet v19** / Ethics / Open | Required primary | Planet: Eco-Score grade + AU/NZ packaging fallback only (`planetPillar.ts`) |
| Primary scan result | `buildProductScanResult` **without** waiting on Signals | Required primary | Result-isolation design |
| Dynamic Signals | Asset embed + matcher via progressive path when `producer=asset` | Required primary *(MVP Signals)* | Sole Signal-content authority |
| Signal attach | `attachDynamicSignalRecordsToScanResult` | Required primary | Preserves scores by reference |
| Banner from Signals | `buildBannerAlertsDataFromScanResult` | Required primary for Signal banners | Derived from `ProductScanResult.signals` only |

### 3.2 Pipeline findings

| ID | Finding | Classification | Severity | Consequence | Smallest safe action |
|----|---------|----------------|----------|-------------|----------------------|
| **S-01** | Asset gated solely by env; missing → empty Signals, healthy TruScore | See R-01 | **P0** | Silent MVP Signals omission on misconfigured release | R-01 |
| **S-02** | `generateInsights` + `InsightsCarousel` on Result (Alerts prefs / `CRUEL_PARENTS`) | **Duplicate/superseded production path** vs governed Dynamic Signals; also **deferred but consumer-reachable** (MyChoices-era personalisation) | **P1** | Ethical “animal testing” card can appear without Asset Signals | Flag-off Result insights +/or Alerts tab for MVP; preserve code |
| **S-03** | `generateBannerAlerts` (preference/brandDatabase) | **Dormant/reference/test-only** on live Result | P3 | Not called from Result; only unit tests | None now; do not re-wire |
| **S-04** | Legacy Planet CSV init (startup) + vestigial `initializeCSVDatabases` in `backend/vercel/api/product-preview.ts` | **Deferred/legacy and unnecessarily executing** | **P1** (app) / P2 (preview API) | Cost/noise; **no** Planet v19 score conflict | Stop app startup init; remove/skip preview init call; keep service for tests |
| **S-05** | Palm oil: `extractPalmOilAnalysis` / scoring paths; `PalmOilCard` still mounted | Legitimate secondary vs FINAL (display rules vary); card may be no-op UI | P2 | Confirm card hidden behaviour; scoring vs display SoT already Planet-spec owned | No Chaining/Signal change; optional hide mount if card not no-op |
| **S-06** | Chaining resolution via embed A-data + `resolveReviewedRetailChainUnified` (Cadbury bridge **off**) | Required primary for Signal matching identity | — | Runtime matches approved assets (accepted B) | Report gaps as defects only (see §5) |

---

## 4. Deferred routes, stores, background, consumer surfaces

| Surface | Reachability | Classification | Severity | Consequence | Smallest safe action |
|---------|--------------|----------------|----------|-------------|----------------------|
| **Alerts tab** (`AppTabs` → `AlertsHome`) | Tab bar MVP shell | Deferred but consumer-reachable | **P1** | Prefs drive Result insights (S-02) | Hide tab or disconnect prefs→Result for MVP |
| **Subscription** root modal | Profile / Search / Allergens `PremiumGate` | Deferred but consumer-reachable + background | **P1** | Paywall UX; FINAL: unfinished premium hidden/disabled | Hide entry points; keep `ENABLE_PREMIUM_GATING=false` |
| **Allergens & Additives** Result card | Live under `PremiumGate` (ungated) | Deferred but consumer-reachable | **P1** | FINAL v0.5: Allergens removed from MVP | Hide Result block + modal |
| **UniversalPricingCard** | Live on Result | Deferred but consumer-reachable | **P1** | Pricing/trolley Post-MVP; web-search CTA | Hide card on Result |
| **Search paywall CTA** | Search tab | Deferred but consumer-reachable | **P1** | Commercial surface | Hide CTA |
| **Profile Account / Upgrade** | Settings tab | Deferred but consumer-reachable (stub/upgrade) | **P1**–P2 | Account comingSoon; Upgrade → Subscription | Hide Upgrade; leave Account stub or hide |
| **MyChoices / personalised Signals context** | Not wired from Result | Dormant/reference/test-only | P3 | No consumer UI | Do not wire |
| **Advanced / my_choices_chain class** | Mapping exists; no progressive attach of MyChoices | Dormant/reference | P3 | — | None |
| **History / Favourites** | Tabs | Legitimate MVP shell | — | Local stores | None |
| **DeveloperSettings / FSANZ import** | Root stack (not main Settings tab) | Dormant/reference / advanced | P3 | Dev tooling | Keep out of primary Settings |

---

## 5. Chaining — runtime-path / SoT defects only (not data-completeness review)

| ID | Defect / evidence | Classification | Severity | Note for governed refresh |
|----|-------------------|----------------|----------|---------------------------|
| **CH-01** | **Crunchie** (e.g. GTIN `9300617042549` when resolved to **B0244/P0009**): no `brand_child_of_brand` to Cadbury **B0067** → Cadbury-wide GL-001 correctly does not fire | Runtime SoT is **faithful** to approved assets; recorded as **Chaining Asset completeness defect** for **subsequent governed refresh** | **P2** (UAT expectation / asset completeness — **not** a runtime bug) | Disposition with full AU/NZ brand-family / `brand_child_of_brand` read-across after UAT; **do not** fix Crunchie alone in this cycle |
| **CH-02** | Chocolate UAT GTINs absent from reviewed `gtin_brand_links` — identity depends on brands/name/alias path | Runtime-path dependency / identity gap evidence | P2 | Include in refresh GTIN/alias gap list; no inventing GTINs now |
| **CH-03** | Embed A-data matches wave1 + extensions (accepted B) | Required primary SoT — **aligned** | — | Refresh must regenerate embed after asset amendments |

**Cursor will not** infer or propose individual Cadbury/Flake/Crunchie child edges during current UAT.

**GS1 licensee secondary input:** founders/ChatGPT enhancement assessment only — not authorised here.

---

## 6. Duplicate / superseded producers (summary)

| Producer A (governed / MVP) | Producer B (legacy/deferred) | Risk |
|----------------------------|------------------------------|------|
| Dynamic Signals Asset | Legacy Alerts `generateInsights` / InsightsCarousel | Consumer confuses Ethical Alerts with governed Signals |
| Dynamic Signals Asset | Skeleton UAT (retired; flag ignored) | Log only if Skeleton=1; no dual content |
| Planet v19 (Eco-Score + packaging fallback) | CSVDatabaseService EWG/RSPO/Idemat/FAO/USDA/Agribalyse | Init noise only; score SoT OK |
| Signal banners via `buildBannerAlertsDataFromScanResult` | `generateBannerAlerts` preference engine | B dormant on Result |
| Asset recall eligibility | Historical MILO pack alone | Contained; MILO cannot originate production Signal |

---

## 7. Priority action list (authorisation required before any change)

| Priority | ID | Action |
|----------|-----|--------|
| **P0** | R-01 / S-01 | Release-profile Asset=`1` + preflight fail-closed if missing |
| **P1** | S-02 | Isolate Alerts insights from MVP Result (and/or hide Alerts tab) |
| **P1** | S-04 | Stop CSV Planet eager init (app + vestigial preview) |
| **P1** | Deferred UI | Hide Allergens, Pricing CTA, Subscription/Upgrade entries |
| **P2** | CH-01, CH-02 | Record for post-UAT Chaining Asset refresh only |
| **P2** | FSANZ auto-update | Confirm/gate residual background work |
| **P3** | Dormant modules | Leave until cleanup wave |

---

## 8. Explicit non-actions (this audit)

- No code deletion or refactor  
- No Chaining data amendments or brand-family proposals  
- No Signal content changes  
- No activation of deferred capabilities  
- NZ Expo Go retest with Asset=`1` remains the UAT process step for Finding A  

---

*End of bounded MVP Runtime Reachability & Single-Source-of-Truth Audit.*
