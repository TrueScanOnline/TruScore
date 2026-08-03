# W4 As-Built Walkthrough — Product Origins / Country of Manufacture

**Document type:** Critical Output Integrity as-built demonstration (plain language)  
**Module:** W4 / Critical Output Integrity **#6** — Product Origins  
**Authority:** MVP Launch Plan v0.4 §3.1 / §5 Decision 6 / §12 (Product Origins Specification pending)  
**Depends on:** W0 (journey), W1 (merge/overlays), W2 (Open pillar), W3 (confidence ≠ CoM verification)  
**Code baseline:** CoM UI + contribution + Open origin disclosure scoring as implemented today  
**Status:** **Demonstrate only.** As-built ≈ **Country of Manufacture**. **Do not** extend structured multi-claim Origins from inference. Product Origins Spec required first.

**Date:** 3 August 2026  
**Author:** Cursor (implementation agent)

---

## 1. Purpose & controlling reminder

v0.4 requires Product Origins to eventually:

- Distinguish **materially different** origin claims (e.g. made / processed / packed / ingredient origin)  
- Reveal **partial or qualified** disclosure without inventing facts  
- Keep contribution **practical**  
- Preserve future standards / OFF compatibility  

**Founder direction already locked:** Cursor demonstrates the **current Country of Manufacture build** only. A dedicated **Product Origins Specification** follows before structural coding.

W4 answers: **what exists today?**

---

## 2. One-picture view (as-built)

```
OFF / merged product fields
  manufacturing_places(_tags), origins(_tags)
  [countries(_tags) = sold-in — NOT used as CoM by extractor]
        ↓
extractManufacturingCountry(product)
        ↓
Result screen CoM card (inline in app/result/[barcode].tsx)
   ├── Show OFF country (green / verified style)
   ├── Or show community contribution (+ verification state)
   ├── Or “not disclosed” CTA
   └── Optional: “With some imported ingredients”
        ↓
Optional: ManufacturingCountryModal
        ↓
submitManufacturingCountry → Vercel API + device AsyncStorage
        ↓
Parallel (not the same system):
  • Open pillar ± origin disclosure points (needs fields on Product)
  • Manual product entry can write manufacturing_places onto Product (scores)
  • Share type countryOfManufacture
```

---

## 3. What fields are used

**Product type:** `src/types/product.ts` — `origins`, `origins_tags`, `manufacturing_places`, `manufacturing_places_tags`, `countries`, `countries_tags`

**Extractor:** `extractManufacturingCountry` in `src/services/openFoodFacts.ts`

| Priority | Source | Behaviour |
|----------|--------|-----------|
| 1 | `manufacturing_places_tags[0]` | Clean tag → country-style string |
| 2 | `manufacturing_places` | First comma segment |
| 3 | `origins_tags[0]` | Clean tag |
| 4 | `origins` | First segment; strip “Product of / Made in …” style prefixes |
| 5 | Labels / generic name text | Regex for “product of / made in / manufactured in …” |
| **Never for CoM** | `countries` / `countries_tags` | Treated as **where sold**, not where made |

Deprecated alias: `extractOriginCountry` → same function.

---

## 4. What the consumer sees (Result CoM card)

**Live UI:** inline block in `app/result/[barcode].tsx` (not the modular `CountryCard` on the live route).

| Situation | As-built UI |
|-----------|-------------|
| OFF/extracted CoM present, no user override | Country + flag; treated as verified OFF data; no “verify” push |
| No OFF CoM; user contribution exists | Show contributed country + confidence icon (verified / community / unverified / disputed) |
| OFF CoM **and** user country **differs** | **User override wins** for display; border/style by verification state |
| Neither | “Not disclosed” / contribute CTA → modal |
| `hasImportedIngredients` | Orange-style badge: **“With some imported ingredients”** |
| Community stats | Optional “community selected countries” when loaded |

**Modular twin:** `src/features/product/cards/CountryCard/` exists for a refactored layout; live Result uses the **inline** implementation (behaviour is similar but not identical on override rules — live Result allows user override of OFF when countries differ).

Contribution prompts are **skippable** (close modal; keep scanning).

---

## 5. Contribution flow (CoM-specific)

### Modal
`src/components/ManufacturingCountryModal.tsx`  
- Pick country  
- Optional checkbox: imported ingredients  
- Parent screen calls submit

### Service
`src/services/manufacturingCountryService.ts`

| Behaviour | As-built |
|-----------|----------|
| Persistence | POST/GET Vercel `/api/manufacturing-country` + local AsyncStorage cache |
| Verification threshold | **3** matching country submissions → `verified` |
| Intermediate | 2 → `community`; 1 → `unverified`; conflicting countries → `disputed` |
| Rate limit | ~10 submissions / hour / user |
| One submission per user per barcode | Updates allowed; duplicates handled |
| OFF submission | **Not** pushed to Open Food Facts for CoM (Rveel/Vercel only) |

### Backend
`backend/vercel/api/manufacturing-country.ts` + database helpers.

### Critical integrity fact (W1 cross-ref)

CoM contributions drive **UI display and community verification labels**.  
They do **not** automatically rewrite `product.manufacturing_places` for TruScore / Open scoring unless the same information is already on the Product via OFF or **manual product entry**.

---

## 6. Manual product entry vs CoM contribution

| Path | Writes onto Product for scoring? | Verification model |
|------|----------------------------------|--------------------|
| **ManualProductEntryModal** `manufacturing_places` | **Yes** (merge / short-circuit) | No 3-vote CoM threshold |
| **CoM contribution API** | **UI primarily** | Threshold + dispute |

Manual entry may also set `countries` to the same picker value — that does **not** make `countries_tags` a CoM source for `extractManufacturingCountry`.

---

## 7. Open pillar vs CoM UI (two jobs)

**Open** (`calculateOpenPillar`, W2): scores **disclosure completeness** of origin/manufacturing fields on the Product (±4 style adjustments).

**CoM card:** chooses **which country string to show** and community verification chrome.

Same underlying OFF fields can feed both. Community CoM cache alone does not move Open points until fields land on the Product object.

---

## 8. Sharing

Share type **`countryOfManufacture`** exists:

- Result share button passes a sanitised country label  
- `ShareContentBuilder.buildCountryContent` — e.g. “Manufactured in: {country}” + app link  
- Share landing meta supports the same type on the backend  

Whether shared copy retains enough qualification for MVP honesty is a later Sharing integrity topic (module #11) — not certified here.

---

## 9. What is NOT built (confirmed absent)

Repo search found **no** implementation of:

- Structured multi-claim origin records (made / processed / packed / grown / ingredient-sourced)  
- Percentage + qualifier models (“at least 87% …”)  
- Undisclosed-balance modelling  
- Packet exact-wording capture as a first-class schema  
- Named-ingredient origin rows  

v0.4 explicitly removed detailed schema from the launch plan and deferred it to the **Product Origins Specification**. Priority-5 label regex inside the extractor is historical as-built behaviour — **not** a licence to expand inference.

---

## 10. Gaps vs v0.4 Origins principles (factual)

| v0.4 principle | As-built today |
|----------------|----------------|
| Distinguish materially different claim types | **Not built** — single CoM-style string |
| Expose partial / qualified disclosure honestly | Partial only via “imported ingredients” checkbox + Open disclosure score; no qualifier/% model |
| Avoid repeating vague manufacturer wording blindly | Extractor strips some prefixes; no claim-type normalisation |
| Practical contribution | **Yes** — simple country picker + optional imported flag |
| Future OFF / standards compatibility | Fields align with OFF manufacturing/origins; structured extension not designed yet |
| CoM UI vs scored fields | **Split** — contribution UI ≠ automatic score input |

---

## 11. Tests

| Coverage | Path |
|----------|------|
| Contribution integration | `src/__tests__/integration/userContribution.test.ts`, E2E twin |
| Open origin penalty | `openPillar.test.ts`, e2e TruScore fixtures |
| Display-name helpers | `countryDisplayName.test.ts` |

**Weak / missing:** dedicated unit tests for `extractManufacturingCountry` and the live Result CoM override matrix.

---

## 12. What founders / ChatGPT should do with W4

| Action | Owner |
|--------|--------|
| Treat this as the **as-built CoM baseline** for the Product Origins Spec | Founders + ChatGPT |
| Decide which packet claim types are MVP-required vs post-MVP | Origins Spec |
| Decide whether CoM contributions must feed Open/TruScore after N verifications | Origins Spec + Community Verification Spec |
| Confirm AU/NZ packet examples for “Made in … from at least X% …” journeys | Founders (physical packs) |
| **Do not** ask Cursor to build multi-claim schema from this note | All |

---

## 13. Suggested Claude questions (as-built risk only)

1. Does allowing user CoM to **override OFF display** without automatically updating scored `manufacturing_places` create consumer/score inconsistency risk?  
2. Is treating `countries` as sold-in (excluded from CoM) consistently applied across UI, share, and Open?  
3. Are verification threshold 3 + dispute states adequate safety until the Community Verification Spec lands?

---

## 14. Code map

| Concern | Path |
|---------|------|
| Extract CoM | `src/services/openFoodFacts.ts` → `extractManufacturingCountry` |
| Live UI | `app/result/[barcode].tsx` |
| Modular card | `src/features/product/cards/CountryCard/` |
| Modal | `src/components/ManufacturingCountryModal.tsx` |
| Service | `src/services/manufacturingCountryService.ts` |
| Backend | `backend/vercel/api/manufacturing-country.ts` |
| Manual overlay | `src/components/ManualProductEntryModal.tsx` |
| Open scoring | `src/lib/truscoreEngine/pillars/openPillar.ts` |
| Share | `src/features/sharing/services/ShareContentBuilder.ts` |

---

## 15. Series status & next

| Walkthrough | Focus | Status |
|-------------|-------|--------|
| W0 | End-to-end journey | Done |
| W1 | Identity & data merge | Done |
| W2 | Four pillars + overall | Done |
| W3 | Confidence | Done |
| **W4** | **Origins / CoM** | **Done (this doc)** |
| W5 (proposed) | Score Highlights Commentary (#9) |
| W6 (proposed) | Chaining & Signals + Signal Alert Commentary (#7, #10) |

---

*End of W4. No implementation changes were made for this demonstration.*
