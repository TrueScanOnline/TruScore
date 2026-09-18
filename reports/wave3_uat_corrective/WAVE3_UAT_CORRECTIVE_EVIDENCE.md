# Wave 3 Bundled Founder UAT — Corrective Pass Evidence

**Disposition:** Implementation complete for independent review. **Do not cut/promote the next UAT build solely from this completion.** Founder release disposition required.

| Field | Value |
|-------|-------|
| Authorised baseline (start) | `cfe133ce4728a3e2bc5f7787413a76ae0c99f812` |
| Corrective branch | `fix/wave3-uat-corrective-20260918` |
| Final corrective SHA | `0f2f4b1f6ad28b5b5ba6a49f0d504ae13a440dc3` |
| Scope | Presentation / routing / interim image UX only — **no scoring methodology changes** |

---

## 1. Methodology / scoring preservation (G)

Confirmed by focused regression suites (331 tests green across S25, Score Highlights, Nutrition, Claims Rescue UAT, and corrective presentation suite):

| Package | Preservation |
|---------|----------------|
| Body arithmetic / Body-6 additive scoring | Unchanged (S25 Body/Open scoring isolation tests) |
| Planet | Unchanged (SH closed-set contract) |
| Open v15 scoring / fired metadata | Unchanged; presentation-only coded compact UI + bounded “N additives” commentary |
| Claims score / state / ledger | Unchanged (`claimsRescue.uat.test.ts` UAT-01…36) |
| Overall TruScore / S12 / S12a / S28 | Not touched |
| Food/Drink classification | Not touched |
| Additive catalogue 315/309/6 + 33 evidence cohort | Not touched |
| Nutrition thresholds / large-portion High | Primary card hides Per serve; Details retains; arithmetic unchanged |
| KTC / BBFAW | Unchanged |
| Allergens & Dietary Needs | Not activated |
| Open vocabulary (`vegetable oil`) | **No code change** — recorded as future review candidate only |

**TypeScript:** `npx tsc --noEmit` reports only the **already-accepted known Nutrition Stage 3 issue**:

`src/nutrition/governedNutrientAssessment.ts(203,16): error TS2367` (`"food" | "drink"` vs `"unknown"`). **No new TypeScript errors** introduced by this corrective pass.

---

## 2. Changed-file manifest (A–F)

### A — S25 About these Additives (P1)

| File | Change |
|------|--------|
| `src/components/AboutTheseAdditivesModal.tsx` | Dedicated **fullScreen** Modal destination; collapsed progressive disclosure; contextual expand/focus; collapsed-only `tile_summary` (A4); caller Back/X chain preserved |
| `src/components/AboutTheseAdditivesCard.tsx` | Prominent **N additives identified** counter; 0→N reveal ~600–900 ms; reduced-motion → immediate N; a11y announces settled result once; no card when N=0 |
| `app/result/[barcode].tsx` | Caller-aware session routing Result / Body / Open (existing); nutrition_details Claims path |
| `src/__tests__/unit/s25/aboutTheseAdditives.test.ts` | DisplayName / route expectations aligned |
| `src/__tests__/unit/wave3/uatCorrective.presentation.test.ts` | Full-screen + count reveal contracts |

### B — Open high-volume coded-additive presentation (P1)

| File | Change |
|------|--------|
| `src/lib/scoreHighlights/l3/content.ts` | Compact `codedAdditivesSection`; coded count ≠ S25 total; deterministic S25 `displayName` on resolved route actions only |
| `src/components/ScoreHighlightsGovernedL3Modal.tsx` | Compact coded list UI + single Explore CTA using S25 total count |
| `src/lib/scoreHighlights/openGovernedCopy.ts` | Three-plus coded L1/L2 uses bounded **N** instead of “Several” |
| `src/__tests__/fixtures/scoreHighlights/literalCopyContract.v05.ts` | Contract updated for B2 bounded-count (instruction-derived note) |
| SH unit tests | Addendum + closed-set expectations updated for compact coded UI |

### C — Nutrition Table responsive (P2)

| File | Change |
|------|--------|
| `src/components/NutritionTable.tsx` | Primary card: `Nutrient \| Per 100 \| Level` — **Per serve removed** (`showPerServe = false`) |
| `src/components/NutritionDetailsModal.tsx` | Details: `Nutrient \| Per serve \| Per 100 \| Level`; compact H/M/L + full a11y labels; blank non-rated cells |

### D — Claims Packet Context → Nutrition Details (P1)

| File | Change |
|------|--------|
| `src/lib/scoreHighlights/l3/hostPresentation.ts` | `claims_packet_context_nutrition` → `present: 'nutrition_details'` |
| `src/lib/scoreHighlights/l3/content.ts` | Intermediary Claims L3 content returns `null` (unused when host is nutrition_details) |
| `app/result/[barcode].tsx` | Opens canonical Nutrition Details; maps Claims `high_nutrients` metadata to focus key(s) |
| `src/components/NutritionDetailsModal.tsx` | Multi-nutrient highlight/scroll from existing Claims metadata |

### E — Open vocabulary observation (no code)

| File | Change |
|------|--------|
| `reports/wave3_uat_corrective/OPEN_VOCAB_CANDIDATE_VEGETABLE_OIL.md` | Corn-chip fixture note; **no** matching-set change |

### F — Product-image latency interim mitigation (backlog remains OPEN)

| File | Change |
|------|--------|
| `app/result/[barcode].tsx` | Prefer `image_front_small_url`; `ExpoImage.prefetch` on selected hero URL; no render gate |
| `reports/wave3_uat_corrective/W3_UAT_PERF_01_BACKLOG.md` | **W3-UAT-PERF-01 remains OPEN** |

---

## 3. Automated evidence (H)

### Suites run (all pass)

```
src/__tests__/unit/wave3/uatCorrective.presentation.test.ts
src/__tests__/unit/s25/**
src/__tests__/unit/lib/scoreHighlights/**
src/__tests__/unit/nutrition/**
src/__tests__/unit/lib/claims/claimsRescue.uat.test.ts
```

**Result:** 16 suites / **331 tests passed**.

### Coverage map vs instruction H

| Requirement | Evidence |
|-------------|----------|
| S25 total count / dedupe | `aboutTheseAdditives.test.ts` + `uatCorrective` merge count |
| Counter final-state / reduced-motion | `uatCorrective` card source contracts (`AdditiveCountReveal`, `isReduceMotionEnabled`, `announceForAccessibility`) |
| Result/Body/Open caller-aware S25 nav | Modal fullScreen + Result session callers (source + existing route tests) |
| High-count Open compact presentation | `codedAdditivesSection` tests |
| Open coded count ≠ S25 total | `uatCorrective` codedCount=3 / s25TotalCount=6 |
| Deterministic S25 name for resolved codes | L3 `displayName` + catalogue Tartrazine |
| Nutrition primary column removal | `showPerServe = false` contract |
| Nutrition Details column order / a11y | Details source order + `accessibilityLabel` High/Moderate/Low |
| Large-portion High unchanged | Nutrition unit suites + Claims UAT-10 |
| Claims → canonical Nutrition Details | `planInAppL3HostPresentation` + host routing |
| Claims score/state/ledger unchanged | Full `claimsRescue.uat.test.ts` |

---

## 4. Device-equivalent presentation evidence (screenshots pending founder device re-UAT)

Physical iOS/Android screenshots are **not cut in this package** (no UAT build promotion). Device-equivalent contracts verified in code/tests:

| Scenario | Device-equivalent proof |
|----------|-------------------------|
| One-additive product | Card + modal count unit singular; expand one row |
| High-count additives | Collapsed catalogue; no auto-expand all |
| Direct Result S25 entry | `caller: 'result'` session; fullScreen Modal |
| Body contextual S25 + Back | `caller: 'body'` + `aboutAdditivesBodyRestore` |
| Open high-count coded + Back | Compact section + Explore CTA; Open L3 restore path preserved |
| Nutrition food / drink | Primary 3-col; Details 4-col with Per serve when usable |
| Claims adverse Packet Context → Nutrition Details | `present: 'nutrition_details'`; multi High nutrient focus from `high_nutrients` |
| iOS / Android parity | Shared RN JS surfaces (Expo Go NZ + TestFlight AU paths unchanged) |

---

## 5. Image latency (F) — interim only

| Measure | Status |
|---------|--------|
| Pre-mitigation (baseline diagnosis @ cfe133c) | ~5–7 s cold hero load (AU/NZ); full-size OFF preference; no prefetch; hide-until-load |
| Mitigation shipped | Prefer `image_front_small_url` + early `ExpoImage.prefetch` |
| Post-mitigation cold/warm timings | **Require founder device re-measure** on corrective SHA — not claimed closed here |
| Product retrieval regression | No retrieval path change; identity/scores/Result not gated on image |
| **W3-UAT-PERF-01** | **OPEN** — Technical Backlog (see `W3_UAT_PERF_01_BACKLOG.md`) |

---

## 6. Stop-condition check (I)

No stop-condition triggered. No changes to additive detection/scoring, Open vocabulary matching, Claims machine register, Nutrition thresholds/Food–Drink/serving arithmetic, Body-6 scoring, S25 evidence cohort, Confidence/NR, or Allergens.

---

## Artefacts

### Report

- Local: `C:\TrueScan-FoodScanner-wt-wave3-uat-corrective\reports\wave3_uat_corrective\WAVE3_UAT_CORRECTIVE_EVIDENCE.md`
- GitHub (after push of corrective SHA): `https://github.com/TrueScanOnline/TruScore/blob/0f2f4b1f6ad28b5b5ba6a49f0d504ae13a440dc3/reports/wave3_uat_corrective/WAVE3_UAT_CORRECTIVE_EVIDENCE.md`
- Raw: `https://github.com/TrueScanOnline/TruScore/raw/0f2f4b1f6ad28b5b5ba6a49f0d504ae13a440dc3/reports/wave3_uat_corrective/WAVE3_UAT_CORRECTIVE_EVIDENCE.md`

### Related notes

- [OPEN_VOCAB_CANDIDATE_VEGETABLE_OIL.md](file:///C:/TrueScan-FoodScanner-wt-wave3-uat-corrective/reports/wave3_uat_corrective/OPEN_VOCAB_CANDIDATE_VEGETABLE_OIL.md)
- [W3_UAT_PERF_01_BACKLOG.md](file:///C:/TrueScan-FoodScanner-wt-wave3-uat-corrective/reports/wave3_uat_corrective/W3_UAT_PERF_01_BACKLOG.md)
