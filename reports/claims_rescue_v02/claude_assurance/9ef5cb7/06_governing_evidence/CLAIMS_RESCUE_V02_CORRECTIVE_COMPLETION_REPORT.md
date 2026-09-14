# Claims Rescue v0.2 — Independent QA Corrective Pass Completion

**Status:** Corrective pass complete — ready for re-assurance  
**Claims remote branch:** `origin/feat/claims-rescue-v02`  
**Review (FAIL) SHA:** `16e10c384fdb024282020aaa8e5eaae30da83f2a`  
**Corrective commit SHA:** `git rev-parse HEAD` of the commit that contains this file (immutable tip of Claims corrective line)  
**Parent SHA:** `16e10c384fdb024282020aaa8e5eaae30da83f2a`  
**Nutrition frozen line (untouched):** `674d1fe48d500393a4c19d75859bcaa3b512768c` @ `origin/fix/review1-pass2-corrective-na001-003-004`  
**Controlling clarifications:** founder Claims evidence model + CR-01…CR-15 instruction set (this pass)

**Not done:** merge into Nutrition / bundled release; new OCR or contribution workflow; Nutrition Stage 3 TS2367 fix; UAT release builds.

---

## 1. Parallel release lines

| Line | Location | State |
|------|----------|-------|
| Nutrition | `origin/fix/review1-pass2-corrective-na001-003-004` @ `674d1fe` | Frozen — not advanced |
| Claims review | `16e10c3` | Preserved as parent of corrective |
| Claims corrective | this commit on Claims feature line | Advances Claims only |
| S25 / About these Additives | separate worktree/branch | Untouched |

---

## 2. CR-01…CR-15 disposition map

| ID | Disposition | Notes |
|----|-------------|-------|
| CR-01 | **Corrected** | Product-name evidence scoped to Set O; no A/B catalogue leak from OFF product name |
| CR-02 | **Founder-accepted / non-blocking** | Brand-token “Organic” edge retained; no new taxonomy/parser |
| CR-03 | **Corrected** | Candidate/scoped exclusions; B-SUG-002 survives X-001; B-SOD-002 both word orders; unrelated Organic survival |
| CR-05 | **Corrected** | OFF labels admitted as `off_labels` (never `user_confirmation`); valid A/B/C/O matching |
| CR-06 | **Corrected** | `Open nutrition details` → `View nutrition details`; Organic L1/L2/L3/CTA founder copy; L3 CTA → Certifications |
| CR-07 | **Corrected** | Three states retained; `assessment_state` ⊥ `packet_coverage_state`; scored + incomplete coexistence |
| CR-08 | **Corrected** | Dual identities always present: methodology `20260912_v0_1` + asset `uk-gov-fop-mtl-rveel-reviewed-2026-09-12`; `source_evidence_id` on nutrient entries |
| CR-09 | **Corrected** | `commentary_by_event_id` keyed by fired event; Packet Context + Organic coexist |
| CR-10 | **Corrected** | `escapeDisplayText` on display path; `observed_text` immutable; injection tests |
| CR-11 | **Corrected** | Same exclusion architecture as CR-03 (candidate-scoped; X-007/X-011 style preserve independent patterns) |
| CR-12 | **Corrected** | Higher `collision_priority` wins; R-012/R-013; equal-priority ambiguity fails closed (no JSON order tiebreak) |
| CR-13 | **Corrected** | Singular/plural “other packet statement(s)” |
| CR-14 | **Corrected** | Certified Organic +3 → claim-only +1 suppression retained; `suppressed_candidates` + S28 reason evidence/tests |
| CR-15 | **Corrected** (Claims portions) | Fresh regression suite + clean-tree verification; **Nutrition TS2367 unrelated / not fixed** |

---

## 3. Changed-file register (vs `16e10c3`)

### Runtime / product
| Path | Change |
|------|--------|
| `src/lib/truscoreEngine/claims/types.ts` | `off_labels`; dual nutrient versions; `commentary_by_event_id`; Organic CTA fields |
| `src/lib/truscoreEngine/claims/productObservations.ts` | OFF labels provenance; product-name Set O scope |
| `src/lib/truscoreEngine/claims/matchRegister.ts` | Candidate → scoped exclusions → precedence; product-name A/B block; prose exclusions |
| `src/lib/truscoreEngine/claims/normalize.ts` | Display escaping; singular/plural lists |
| `src/lib/truscoreEngine/claims/assessClaims.ts` | Orthogonal states; per-event commentary; version identities |
| `src/lib/truscoreEngine/claims/commentary.ts` | Founder Organic L1/L2/L3/CTA |
| `src/lib/truscoreEngine/claims/nutrientContextAdapter.ts` | Methodology + reference asset; `source_evidence_id` |
| `src/lib/truscoreEngine/claims/index.ts` | Export surface |
| `src/lib/truscoreEngine/pillars/ethicsPillar.ts` | Per-event commentary stamp |
| `src/lib/truscoreEngine/pillars/ethicsPillarV37Registry.ts` | Organic copy alignment |
| `src/lib/scoreHighlights/governedCommentary.ts` | Organic L2 alignment |
| `src/lib/scoreHighlights/l3/content.ts` | Founder Organic L3 + Certifications CTA; View Nutrition details |
| `src/components/TruScoreAnalysisModal.tsx` | Dual nutrient versions + per-event commentary bindings |
| `src/i18n/locales/en.json` | `openDetailsA11y`: View nutrition details |

### Tests / evidence
| Path | Change |
|------|--------|
| `src/__tests__/unit/lib/claims/claimsCorrective.regression.test.ts` | **Added** — CR regressions |
| `src/__tests__/unit/lib/claims/claimsRescue.uat.test.ts` | Dual nutrient identity helpers |
| `src/__tests__/unit/lib/claims/claimsRescue.negativeAssurance.test.ts` | Dual nutrient identity helpers |
| `src/__tests__/fixtures/scoreHighlights/literalCopyContract.v05.ts` | Organic L3 founder copy |
| `src/__tests__/unit/lib/scoreHighlights/l3ContentAddendum.test.ts` | Organic L3 expectations |
| `src/__tests__/unit/lib/scoreHighlights/selectScoreHighlights.test.ts` | Organic copy alignment |
| `reports/claims_rescue_v02/schema_examples/*.json` | Revised corrective schema examples |
| `reports/claims_rescue_v02/CLAIMS_RESCUE_V02_CORRECTIVE_COMPLETION_REPORT.md` | This report |
| `reports/claims_rescue_v02/corrective_fresh_evidence/*` | Clean-tree command logs |

---

## 4. Revised schema examples

See `reports/claims_rescue_v02/schema_examples/`:

- `unassessed.json` — dual nutrient identities present; incomplete coverage
- `assessed_neutral.json` — `off_labels` admission; complete coverage; no fired adjustment
- `assessed_scored.json` — scored + **incomplete** coverage; `off_labels` + `governed_product_name`; dual events in `commentary_by_event_id`; Organic founder L1

---

## 5. Section 15 UAT matrix (fresh clean-tree)

Evidence class: **A** = automated; **U** = UI/source contract; **P** = platform/parity.

| ID | Expected | Actual | Class | Reference |
|----|----------|--------|-------|-----------|
| UAT-01 | +1; exact positive L2 | Pass | A | `claimsRescue.uat.test.ts` |
| UAT-02 | one +1; synthesized claims | Pass | A | same |
| UAT-03 | −3; sugars adverse | Pass | A | same |
| UAT-04 | −3; multi-nutrient list | Pass | A | same |
| UAT-05 | one −3 only | Pass | A | same |
| UAT-06 | Set B no High → no +1 | Pass | A | same |
| UAT-07 | Set B + High → −3 | Pass | A | same |
| UAT-08 | Moderate not High | Pass | A | same |
| UAT-09 | equality not High | Pass | A | same |
| UAT-10 | large-portion High → −3 | Pass | A | same |
| UAT-11 | total fat ignored | Pass | A | same |
| UAT-12 | NOVA4 alone → no Claims NOVA story | Pass | A | same |
| UAT-13 | +1 + NOVA sentence | Pass | A | same |
| UAT-14 | −3 + NOVA sentence | Pass | A | same |
| UAT-15 | +3; +1 suppressed | Pass | A | same |
| UAT-16 | Organic claim-only +1 | Pass | A | same |
| UAT-17 | ingredient organic excluded | Pass | A | same |
| UAT-18 | Fairtrade +6 unchanged | Pass | A | same |
| UAT-19 | MSC/RA points unchanged | Pass | A | same |
| UAT-20 | KTC company-level | Pass | A | same |
| UAT-21 | ambiguous BBFAW → no fire | Pass | A | same |
| UAT-22 | assessed_neutral; exact L2 | Pass | A | same |
| UAT-23 | neutral + unclassified append | Pass | A | same |
| UAT-24 | incomplete → unassessed (no score) | Pass | A | same |
| UAT-25 | offsetting → assessed_scored | Pass | A | same |
| UAT-26 | Set C record-only | Pass | A | same |
| UAT-27 | unlisted synonym → no match | Pass | A | same |
| UAT-28 | collision retain B | Pass | A | same |
| UAT-29 | register mismatch fail-closed | Pass | A | same |
| UAT-30 | missing sodium → no +1 | Pass | A | same |
| UAT-31 | no raw `[CLAIM]` brackets | Pass | A | same |
| UAT-32 | one −3; bounded lists | Pass | A | same |
| UAT-33 | ordinary S28 inaccessible | Pass | A+U | same + scoreDiagnostics |
| UAT-34 | founder S28 Claims payload | Pass | A+U | UAT-34 + claimsS28 |
| UAT-35 | iOS/Android parity | Pass | P | UAT-35 + expo export |
| UAT-36 | nomenclature / no Ethics leak | Pass | A+U | nomenclature + UAT-36 |

**Corrective addendum (CR suite):** all 15 CR-targeted cases in `claimsCorrective.regression.test.ts` Pass (A).

---

## 6. Section 16 negative-assurance matrix (fresh)

| Theme | Probe | Result | Evidence |
|-------|-------|--------|----------|
| Recognition boundary | Typos / look-alikes / ingredient organic / case | Pass | `claimsRescue.negativeAssurance.test.ts` |
| Evidence honesty | No A/B without admissions; pending ≠ neutral | Pass | same |
| Arithmetic | +1/−3 exclusivity; Organic suppression | Pass | same |
| Nutrient boundary | Moderate; missing sodium | Pass | same |
| State integrity | No +0; offsetting assessed_scored | Pass | same |
| Commentary / access | Qualification retained; S28 gated | Pass | same |
| Corrective evidence model | OFF name no A/B leak; OFF labels honest provenance | Pass | `claimsCorrective.regression.test.ts` |

---

## 7. Fresh clean-tree commands and results

```text
npx jest src/__tests__/unit/lib/claims/ \
  src/__tests__/unit/lib/pillars/ethicsPillar.test.ts \
  src/__tests__/unit/lib/scoreHighlights/ \
  src/__tests__/unit/services/ethicsCertificationsService.test.ts \
  src/__tests__/unit/config/scoreDiagnostics.test.ts --no-cache
→ Test Suites: 17 passed; Tests: 330 passed
  (log: reports/claims_rescue_v02/corrective_fresh_evidence/01_jest_focused.log)

npx eslint src/lib/truscoreEngine/claims/**/*.{ts,tsx} \
  src/components/TruScoreAnalysisModal.tsx src/types/truscoreAnalysis.ts \
  src/__tests__/unit/lib/claims/**/*.ts \
  src/lib/scoreHighlights/l3/content.ts src/lib/scoreHighlights/governedCommentary.ts \
  --max-warnings 0
→ exit 0
  (log: reports/claims_rescue_v02/corrective_fresh_evidence/02_eslint.log)

npx tsc --noEmit -p tsconfig.json
→ exit 2 — single reported error:
  src/nutrition/governedNutrientAssessment.ts(203,16): error TS2367
  (Nutrition Stage 3 preexisting; UNRELATED to this Claims commit — not fixed here)
  (log: reports/claims_rescue_v02/corrective_fresh_evidence/03_tsc.log)

EXPO_PUBLIC_SCORE_DIAGNOSTICS=0 EXPO_PUBLIC_STORE_RELEASE=1 \
  npx expo export --platform ios --output-dir dist-claims-corrective-DO-NOT-COMMIT/ios
→ exit 0 (artifact deleted; not committed)
  (log: reports/claims_rescue_v02/corrective_fresh_evidence/04_expo_ios.log)

EXPO_PUBLIC_SCORE_DIAGNOSTICS=0 EXPO_PUBLIC_STORE_RELEASE=1 \
  npx expo export --platform android --output-dir dist-claims-corrective-DO-NOT-COMMIT/android
→ exit 0 (artifact deleted; not committed)
  (log: reports/claims_rescue_v02/corrective_fresh_evidence/05_expo_android.log)
```

---

## 8. Residuals

1. Nutrition Stage 3 `TS2367` remains on the Nutrition line — unrelated; report only.  
2. No new OCR / contribution workflow (founder instruction).  
3. CR-02 brand-name Organic edge deliberately retained.  
4. Claims not merged into Nutrition or bundled release in this task.

---

## 9. Commit / SHA

| Field | Value |
|-------|-------|
| Branch | `feat/claims-rescue-v02` (Claims-specific remote-backed) |
| Parent | `16e10c384fdb024282020aaa8e5eaae30da83f2a` |
| Corrective SHA | `git rev-parse HEAD` (commit containing this report) |
| Message | `fix(claims): Claims Rescue v0.2 independent QA corrective pass` |

---

*End of corrective completion report.*
