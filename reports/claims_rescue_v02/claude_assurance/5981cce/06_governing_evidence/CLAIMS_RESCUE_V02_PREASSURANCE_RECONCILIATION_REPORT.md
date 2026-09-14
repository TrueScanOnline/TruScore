# Claims Rescue v0.2 — Pre-assurance reconciliation completion

**Status:** Pre-assurance residuals resolved — ready for Claude re-assurance  
**Claims remote branch:** `origin/feat/claims-rescue-v02`  
**Prior corrective implementation:** `9ef5cb7b4b853b3b814f919679ada89ef5bbadca` (not rewritten)  
**This reconciliation SHA:** `git rev-parse HEAD` of the commit containing this file  
**Parent:** prior Claims tip (docs packaging and/or `9ef5cb7`)  
**Nutrition frozen line (untouched):** `674d1fe48d500393a4c19d75859bcaa3b512768c`  
**S25:** untouched

**Not done:** Wave 4 contribution activation; Nutrition Stage 3 TS2367 fix; methodology reopen; merge into Nutrition/bundled release.

---

## Residuals resolved

| # | Residual | Disposition |
|---|----------|-------------|
| 1 | eslint unused-var / false exit 0 | **Corrected** — fresh eslint `--max-warnings 0` exit 0; report matches real log |
| 2 | Organic CTA staged availability | **Corrected** — L3 action only when `userContributionRouteLive === true`; copy preserved; Wave 4 not turned on |
| 3 | CR-11 phrase-scoped exclusions | **Corrected** — X-007/X-011 preserve independent A-PRO patterns; Protein Bar / NIP / FOP / Organic Sea Salt tests |
| 4 | X-020/021/022/024 | **Corrected / dispositioned** — X-020 evidence-location; X-021/022 candidate-level; X-024 founder-dispositioned / not runtime-enforced |
| 5 | Nutrient reference asset identity | **Corrected** — always `uk-gov-fop-mtl-rveel-reviewed-2026-09-12`; legacy `standardId` → `upstream_standard_id` |
| 6 | Nutrient evidence traceability | **Corrected** — `governed-nutrient-assessment:{barcode}:{nutrientKey}` product-bound pointer |
| 7 | Claims `unknown` nutrient basis | **Corrected** — binary `food` \| `drink` only |
| 8 | Double display escaping | **Corrected** — single-pass from `observed_text` in matchRegister |
| 9 | OFF provenance precision | **Corrected** — `off:labels` / `off:labels_en` / `off:product_name` |

---

## Fresh clean-tree commands and results

```text
npx jest src/__tests__/unit/lib/claims/ \
  src/__tests__/unit/lib/pillars/ethicsPillar.test.ts \
  src/__tests__/unit/lib/scoreHighlights/ \
  src/__tests__/unit/services/ethicsCertificationsService.test.ts \
  src/__tests__/unit/config/scoreDiagnostics.test.ts --no-cache
→ Test Suites: 17 passed; Tests: 345 passed
  (log: reports/claims_rescue_v02/corrective_fresh_evidence/01_jest_focused.log)

npx eslint …claims… --max-warnings 0
→ exit 0
  (log: reports/claims_rescue_v02/corrective_fresh_evidence/02_eslint.log)

npx tsc --noEmit -p tsconfig.json
→ exit 2 — ONLY:
  src/nutrition/governedNutrientAssessment.ts(203,16): error TS2367
  Nutrition Stage 3 preexisting; UNRELATED; not fixed here
  (log: reports/claims_rescue_v02/corrective_fresh_evidence/03_tsc.log)

npx expo export --platform ios|android (non-release)
→ exit 0 both
  (logs: 04_expo_ios.log / 05_expo_android.log)
```

---

## X-024 mapping (accurate)

**Founder-dispositioned / not runtime-enforced for MVP.** Product-name Organic remains eligible for Set O claim-only +1. Certified Organic +3 requires separately governed certification evidence. No brand-token parser added. Diagnostic `x024_founder_dispositioned_mvp` is emitted on product-name Organic matches.

---

## Nutrient evidence pointer

`source_evidence_id = governed-nutrient-assessment:{barcode}:{nutrientKey}`

Identifies the Claims-consumed governed nutrient assessment outcome for that product + nutrient key. It is **not** the threshold asset id and **not** a packet evidence object. Nutrition has no richer product-bound evidence id to reuse.

---

## Schema examples

Revised under `reports/claims_rescue_v02/schema_examples/`.

---

*End of pre-assurance reconciliation report.*
