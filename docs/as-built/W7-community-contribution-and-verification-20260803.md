# W7 As-Built Walkthrough — Community Contribution & Verification

**Document type:** Critical Output Integrity as-built demonstration (plain language)  
**Module:** W7 / Critical Output Integrity **#13** — Community contribution and verification  
**Authority:** MVP Launch Plan v0.4 §12 (Community Verification Spec **pending**); Cursor acceptance `docs/cursor-acceptance-mvp-v0.4-20260803.md`  
**Depends on:** W0 (skippable contribute CTAs), W1 (identity + merge / scoring overlays), W4 (CoM contribution ≠ scored Product fields)  
**Code baseline:** Manual entry, photo upload, CoM threshold path, OFF submission as implemented today  
**Status:** **Demonstrate only.** Do **not** invent ongoing confirmation/dispute rules, admin moderation workflows, or confidence effects of contributions. Community Verification Spec required before expansion.

**Date:** 3 August 2026  
**Author:** Cursor (implementation agent)

---

## 1. Purpose & controlling reminder

v0.4 expects community contribution to eventually support:

- Practical consumer contributes when data is missing or thin  
- Ongoing confirmation / dispute (not only one-shot writes)  
- Clear rules for when verified community info may affect scores  
- Confidence effects reserved to the Confidence Spec  

**Controlling reminder for this walkthrough:**

| Layer | Status |
|-------|--------|
| Consumer contribute CTAs (manual / photo / CoM / edit empty cards) | Present; all skippable (W0 §3.6) |
| Multi-user confirm/dispute across contribution types | **CoM only** (threshold 3) |
| Manual / photo / certs / nutrition writes | **One-shot** (local + OFF and/or Vercel) |
| Founder/admin review queue for contributions | **Absent** in runtime UI/API |
| Community Verification Spec | **Pending** — do not code new rules from this note |
| Confidence impact of contributions | **Reserved** to Confidence Spec (W3) |

W7 answers: **what contribution and “verification” paths exist today?**

---

## 2. One-picture view (as-built)

```
Result screen (skippable CTAs)
        │
        ├── ManualProductEntryModal  (add / edit)
        │     → local cache + SQLite + AsyncStorage
        │     → calculateTruScore on device (immediate)
        │     → optional hero photo → uploadProductPhoto (front)
        │     → core fields → Open Food Facts
        │     → country + certifications → POST /api/manual-products
        │     → mergeUserContributedData on later fetches (W1)
        │
        ├── CameraCaptureModal (standalone hero / capture)
        │     → uploadProductPhoto → /api/upload-photo → photos table
        │
        ├── ManufacturingCountryModal (CoM)
        │     → submitManufacturingCountry
        │     → Vercel /api/manufacturing-country + AsyncStorage
        │     → verified / community / unverified / disputed UI
        │     → does NOT auto-write Product scoring fields (W4)
        │
        └── Empty nutrition / ingredients / certs CTAs
              → same ManualProductEntryModal (editMode)

DORMANT (code present, not live on Result):
  PendingContributionsBanner + unifiedContributionService
  userContributionVerification (client quality checks) — not wired into save
```

---

## 3. Contribution paths that exist

### 3.1 Manual product entry

| Layer | Path |
|-------|------|
| UI | `src/components/ManualProductEntryModal.tsx` |
| Types | `src/types/manualProduct.ts` |
| Service | `src/services/manualProductService.ts` |
| Parsing | `src/utils/manualProductParsing.ts` |
| Proprietary slice | `src/utils/vercelProprietaryManualProduct.ts` |
| API | `backend/vercel/api/manual-products.ts` |
| Wired from | `app/result/[barcode].tsx` (unknown product + edit CTAs) |

**Fields collected in the modal today:**

| Collected | Notes |
|-----------|-------|
| Product name | Required on add |
| Brand | Optional |
| Ingredients | Free text |
| Hero photo | Via camera / picker → front upload |
| Manufacturing country | Picker → `manufacturing_places` + `countries` |
| Certifications | `CertificationMultiPicker` → `labels_tags` / hierarchy |
| Nutrition | Energy, fat, sat fat, carbs, sugars, fiber, protein, salt |
| Serving size / quantity | Optional |
| Allergens / additives | Free text → tags |

**Present on type/merge but not collected as a dedicated packaging contribute UI:** `packaging_data`, `categories`.

**Write sequence (`saveManualProduct`) — one-shot, no peer confirm:**

1. Persist locally (cache + SQLite + AsyncStorage `@truescan_manual_product_*`)  
2. Score immediately via `calculateTruScore` on device  
3. Optional photo → `uploadProductPhoto` (front = proprietary / Vercel)  
4. Core product payload → `submitProductToOpenFoodFacts`  
5. Country + certifications only → `POST /api/manual-products` (skipped if neither present)

OFF failure does **not** roll back local save. Vercel proprietary POST retries up to 3 times.

**Scoring impact (W1 cross-ref):** Manual / local `user_contributed` can short-circuit fetch. `mergeUserContributedData` in `productCacheService` overlays fields before TruScore. Local/merged full rows can overlay nutrition, ingredients, country fields, labels, allergens/additives, packaging if present. Vercel-only (`_source === 'BACKEND'`) overlays proprietary country/origins/labels (+ photo from photos table) — not nutrition/ingredients (those live on OFF). See `docs/as-built/W1-identity-and-data-merge-20260803.md` §7.

---

### 3.2 Photo upload

| Layer | Path |
|-------|------|
| Capture UI | `src/components/CameraCaptureModal.tsx` |
| Service | `src/services/photoUploadService.ts` |
| API | `backend/vercel/api/upload-photo.ts` |
| Standalone from Result | `handleCaptureImage` in `app/result/[barcode].tsx` |

**Image types:** `front` | `ingredients` | `nutrition` | `packaging` | `country_label`.

| Type | Default routing |
|------|-----------------|
| `front`, `country_label` | Vercel only (proprietary) |
| `ingredients`, `nutrition`, `packaging` | May also attempt Open Food Facts |

**Storage fallbacks:** Vercel Blob → Cloudinary → base64 data-URL.  
**Retrieval:** `GET /api/manual-products` can merge latest front photo from `photos` when product JSON lacks an image.

One-shot upload; no multi-user photo verification.

---

### 3.3 Manufacturing country (CoM)

| Layer | Path |
|-------|------|
| UI | `src/components/ManufacturingCountryModal.tsx` |
| Card / CTAs | Result inline CoM + `CountryCard` |
| Service | `src/services/manufacturingCountryService.ts` |
| API | `backend/vercel/api/manufacturing-country.ts` |
| Deep dive | `docs/as-built/W4-product-origins-com-20260803.md` |

**As-built “verification” (only path with support/dispute/threshold):**

| State | Rule (as coded) |
|-------|-----------------|
| `verified` | ≥ **3** matching submissions (`VERIFICATION_THRESHOLD`) |
| `community` | Count ≥ **2** (not yet at threshold) |
| `unverified` | Single / insufficient |
| `disputed` | Conflicting countries while below verified threshold |

Also: ~10 submissions/hour/user rate limit; one submission per userId/barcode (updates allowed). Optional `hasImportedIngredients`. Optional `photoUrl` exists on API/service — **modal does not capture photos**. CoM→OFF push is **obsolete** (deprecated helper; CoM path does not rely on it).

**Does NOT auto-write Product fields for scoring.** CoM drives UI labels only. Scored country fields come from OFF or **manual product entry** proprietary merge (W1 / W4).

---

### 3.4 Open Food Facts submission

| File | Role |
|------|------|
| `src/services/openFoodFactsSubmission.ts` | Product edit API + photo helpers |

**Credentials:** `EXPO_PUBLIC_OFF_USER_ID` + `EXPO_PUBLIC_OFF_PASSWORD` (optional; anonymous if missing).

**Submitted from manual path:** barcode, name, brands, ingredients, serving/quantity, nutriments, allergens, additives.  
**Not submitted to OFF from manual proprietary slice:** country / certifications (Vercel); hero/front image intentionally not uploaded to OFF from manual save.  
**Also:** `uploadPhotoToOpenFoodFacts` for non-proprietary image types when photo path opts in.

---

### 3.5 Other surfaces

| Path | Status |
|------|--------|
| Nutrition / ingredients / certs edit | Same `ManualProductEntryModal` (`editMode`); empty-card CTAs on Result |
| Certifications | `CertificationMultiPicker` → `labels_tags` → Vercel + Ethics via merge |
| Packaging contribute UI | **Absent** (type/merge can hold packaging; PackagingCard is display-only) |
| Unified pending queue | `unifiedContributionService.ts` + `PendingContributionsBanner.tsx` — **dormant**: banner commented out on Result; `addPendingContribution` has **no** live callers |
| Client quality checks | `userContributionVerification.ts` (`verifyUserContributedProduct`, `autoVerifyProduct`, `flagSuspiciousEntry`) — **not wired** into `saveManualProduct` |

---

## 4. Verification model today (inventory only)

| Contribution | Model | Skip? |
|--------------|-------|-------|
| Manual product / nutrition / certs / ingredients | **One-shot write** (local + OFF/Vercel). No peer confirm/dispute | Yes (W0 §3.6) |
| Photo | One-shot upload to storage / `photos` | Yes |
| CoM | **Only path** with support / dispute / threshold (3 / community / unverified / disputed) | Yes |
| Cross-field “1 + ongoing confirmation” | **Not built** (Spec pending) | — |

**Do not treat CoM threshold logic as the accepted Community Verification Spec.** It is a local/backend aggregation preview for Country of Manufacture UI only.

---

## 5. Admin moderation

**Thin / absent as expected.**

- Vercel APIs used for contributions: barcode, manual-products, upload-photo, manufacturing-country — **no** contribution moderation / review endpoints for founders  
- Design-only notes exist under phase docs (e.g. data-ops moderation states) — not a product surface  
- Acceptance record already notes: no clear admin pages/endpoints for contribution moderation  

Founder approve / reject / suppress queues for community contributions are **MVP Spec work**, not as-built capability.

---

## 6. How contributions meet scoring (and where they do not)

```
Manual fields on Product (local merge / OFF / Vercel proprietary)
        ↓
mergeUserContributedData (W1)
        ↓
calculateTruScore / pillars (W2)
        ↑
CoM community table  ──╳── does NOT feed this path automatically
```

| Input | Affects scored Product today? |
|-------|-------------------------------|
| Manual nutrition / ingredients / labels / country fields after merge | **Yes** (when on Product) |
| Manual hero photo | Display / merge photo; not pillar maths by itself |
| CoM verified/community UI | **No** auto-write into scoring country fields |
| Confidence bump from “verified contribution” | **Not defined** — Confidence Spec pending (W3) |

---

## 7. Tests (as-built coverage)

| File | Covers |
|------|--------|
| `src/__tests__/integration/userContribution.test.ts` | Manual POST/retrieve, CoM submit/threshold, photo upload, merge priority, offline, errors |
| `src/__tests__/integration/userContributionE2E.test.ts` | Broader workflow, allergens/additives, photo types, multi-user consistency |
| Scripts (non-Jest) | `scripts/test-user-contributions-e2e.ts`, `scripts/comprehensiveUserContributionE2E.ts` |

Automated tests prove **current** write/merge/CoM aggregation behaviour. They do **not** certify the pending Community Verification Spec.

---

## 8. Gaps vs v0.4 (do not implement from this note)

| Spec-oriented expectation | As-built |
|---------------------------|----------|
| Ongoing confirmation / dispute across contribution types | **CoM only**; manual/photo/certs are one-shot |
| Verified community info may affect scores under Spec rules | Manual fields **already** can affect scores when on Product; CoM UI **does not** auto-feed scores |
| Confidence effects of contributions | **Reserved** to Confidence Spec |
| Founder/admin review queue | Spec/docs only; no runtime UI/API |
| Packaging community contribution | Absent as a user path |
| Unified pending-contribution UX | Code present; **dormant** on Result |

---

## 9. Key file index

```
src/components/ManualProductEntryModal.tsx
src/components/CameraCaptureModal.tsx
src/components/ManufacturingCountryModal.tsx
src/components/PendingContributionsBanner.tsx          # dormant
src/components/CertificationMultiPicker.tsx
src/services/manualProductService.ts
src/services/photoUploadService.ts
src/services/manufacturingCountryService.ts
src/services/openFoodFactsSubmission.ts
src/services/userContributedProductsService.ts
src/services/productCacheService.ts                   # mergeUserContributedData
src/services/unifiedContributionService.ts            # dormant queue
src/services/userContributionVerification.ts          # unwired checks
src/types/manualProduct.ts
src/utils/vercelProprietaryManualProduct.ts
src/features/product/cards/CountryCard/CountryCard.tsx
app/result/[barcode].tsx
backend/vercel/api/manual-products.ts
backend/vercel/api/upload-photo.ts
backend/vercel/api/manufacturing-country.ts
src/__tests__/integration/userContribution.test.ts
src/__tests__/integration/userContributionE2E.test.ts
docs/as-built/W0-end-to-end-consumer-journey-20260803.md
docs/as-built/W1-identity-and-data-merge-20260803.md
docs/as-built/W4-product-origins-com-20260803.md
docs/cursor-acceptance-mvp-v0.4-20260803.md
```

---

## 10. Bottom line for founders / Claude

**What exists:** Skippable consumer contributes for missing/thin products (manual entry, photos, CoM, edit empty cards), with immediate local scoring for manual fields and OFF/Vercel dual write where applicable.

**What “verification” means today:** Only CoM has a coded multi-user threshold / dispute preview. Everything else is one-shot. Client “verification” helpers and the pending-contributions banner are not live on the Result path.

**What is not decided here:** Cross-field ongoing confirmation, when community data may change scores under Spec rules, confidence effects, packaging contribute UX, and founder moderation — all wait on the Community Verification Spec (and related Specs).
