# Wave 3 Claims Rescue v0.2 — Completion Report (12 sections)

**Status:** Founder-side reconciliation complete — ready for independent review  
**Branch:** `fix/review1-pass2-corrective-na001-003-004`  
**Parent HEAD at reconciliation:** `674d1fe48d500393a4c19d75859bcaa3b512768c` (Nutrition Stage 3)  
**Claims Rescue commit:** this document is committed with the implementation; authoritative SHA is the git object that contains this file (reported to founders from `git rev-parse HEAD` at handoff).
**Controlling authority:** `Rveel_Wave3_Claims_Controlling_Specification_20260912_v0_2` + Machine Register v1.0 + Nutrient-Level Reference Standard  
**Not done in this package:** Claude QA, new OCR/contribution workflow, UAT release / TestFlight / store promotion, backlog/doc propagation, Confidence/NR redesign

---

## 1. Requirement traceability

| Spec ID | Requirement (short) | Implementation locus | Evidence |
|--------|----------------------|----------------------|----------|
| REG-01…06 | Machine Register closed matching, exclusions, collisions, fail-closed | `matchRegister.ts`, `packetClaimMachineRegister.v1.json` | UAT-27…29; A-VMC-003 suite |
| R-012 | A+B same statement → retain B | `matchRegister.ts` | UAT-28 |
| R-013 / A-VMC-003 | One combination observation + member targets; not per-member events | `matchRegister.ts` (`deterministic_member_count`), `types.member_targets` | `aVmc003.r013.test.ts` |
| REG-03 / §4.1 | Admitted packet evidence only | `productObservations.ts`, `CalculateEthicsPillarOptions` | §3 below; NA evidence honesty |
| SCR / §3 / §10 | Packet Context +1/−3 non-stacking; Set B never +1 | `assessClaims.ts` | UAT-01…07, 32 |
| NUT-01…06 | Consume governed nutrient object | `nutrientContextAdapter.ts` + Nutrition Stage 3 path | UAT-08…11, 30; Nutrition look-through L3 |
| ORG-01…04 | Organic +3 cert / +1 claim-only; suppression | `ethicsCertificationsService.ts`, `assessClaims.ts`, registry | UAT-15…17; ethics pillar tests |
| BEN-01…05 | KTC/BBFAW unchanged company-level | `ethicsPillar.ts` | UAT-20…21; ethics pillar suite |
| STA-01…05 | Assessment state truth | `assessClaims.ts` | UAT-22…25 |
| COM / §11 | Locked L1/L2 commentary | `commentary.ts`, `governedCommentary.ts` | UAT-01, 03, 13/14, 22–23; literal copy contract |
| S28-01…08 | Founder diagnostic surface + release gate | `TruScoreAnalysisModal.tsx`, `buildTruScoreAnalysis`, `scoreDiagnostics.ts` | `claimsS28.contract.test.ts`; UAT-33/34; eas.json |
| INV-01…14 | Invariants | shared Expo JS path | UAT-35; export verify |
| §15 UAT-01…36 | Acceptance matrix | `claimsRescue.uat.test.ts` + linked suites | §6 |
| §16 | Negative assurance | `claimsRescue.negativeAssurance.test.ts` | §7 |

**Match types implemented (Machine Register v1.0):** `regex` (52), `regex_exact` (5), `deterministic_member_count` (1 = A-VMC-003). Confirmed by `getRegisterMatchTypes()`.

---

## 2. Change manifest (added / modified / removed)

### Added
| Path | Purpose |
|------|---------|
| `src/lib/truscoreEngine/claims/**` | Claims Rescue module (assess, match, normalize, commentary, nutrient adapter, product observations, register JSON, types, index) |
| `src/__tests__/unit/lib/claims/claimsRescue.uat.test.ts` | Section 15 automated matrix |
| `src/__tests__/unit/lib/claims/aVmc003.r013.test.ts` | A-VMC-003 / R-013 positive/negative/collision |
| `src/__tests__/unit/lib/claims/claimsS28.contract.test.ts` | S28-01…08 surface contracts |
| `src/__tests__/unit/lib/claims/claimsRescue.negativeAssurance.test.ts` | Section 16 probes |
| `reports/claims_rescue_v02/CLAIMS_RESCUE_V02_COMPLETION_REPORT.md` | This report |
| `reports/claims_rescue_v02/schema_examples/{unassessed,assessed_neutral,assessed_scored}.json` | Canonical schema examples |

### Modified
| Path | Purpose |
|------|---------|
| `src/lib/truscoreEngine/pillars/ethicsPillar.ts` | Wire Claims assessment; Certified Organic +3; options for admissions |
| `src/lib/truscoreEngine/pillars/ethicsPillarV37Registry.ts` | Claims canonical IDs + Organic +3 |
| `src/lib/truscoreEngine/index.ts` | Plumb `claimsAssessment` into `TruScoreAnalysis` |
| `src/services/ethicsCertificationsService.ts` | Cert Organic OFF-tags +3; claim-only evaluator |
| `src/lib/scoreHighlights/governedCommentary.ts` | Claims L1/L2 metadata binding |
| `src/lib/scoreHighlights/promotionPriority.ts` | Claims IDs in Ethics priority pools |
| `src/lib/scoreHighlights/l3/{targets,resolveL3Route,content}.ts` | Nutrition look-through for Packet Context |
| `src/components/TruScoreAnalysisModal.tsx` | Render S28-01…07 Claims fields |
| `src/types/truscoreAnalysis.ts` | Optional `claimsAssessment` |
| `src/__tests__/unit/lib/pillars/ethicsPillar.test.ts` | Organic +3 |
| `src/__tests__/unit/services/ethicsCertificationsService.test.ts` | +3 / claim-only separation |
| `src/__tests__/fixtures/scoreHighlights/literalCopyContract.v05.ts` | Claims copy contracts |
| `src/__tests__/unit/lib/scoreHighlights/*.ts` | Organic/Claims ID updates |

### Removed
None (no deleted modules in this package).

---

## 3. Packet-admission boundary

**Inspection result:** No approved live producer of Set A/B `AdmittedPacketObservation` exists in the production TruScore path.

| Candidate | Finding |
|-----------|---------|
| `photoOcrService` | Stub (`confidence: 0`); does not emit Claims admissions |
| Contribution domains | `'origins' \| 'certifications'` only — not Machine Register Set A/B |
| Typed methods `packet_image` / `ocr_crop` / `user_confirmation` | Present on Claims contract; no production feeder |
| Set O `governed_product_name` | Implemented via claim-only organic evaluator |

**Behaviour retained:** fail-closed. `buildClaimsObservationsFromProduct` documents the upstream dependency. Engine accepts future admissions via `CalculateEthicsPillarOptions.admittedPacketObservations` + `packetCoverageState: 'complete'`, preserving:

- evidence ID  
- product/GTIN binding (caller context / evidence_id prefix)  
- observed text + display text  
- admission method + source locator  
- post-match register row / family / set  

**Do not invent:** no new OCR/contribution workflow was created.

---

## 4. Schema examples (three assessment states)

See:

- `reports/claims_rescue_v02/schema_examples/unassessed.json`
- `reports/claims_rescue_v02/schema_examples/assessed_neutral.json`
- `reports/claims_rescue_v02/schema_examples/assessed_scored.json`

Persisted on every assessment: `schema_version`, `register_version` (`20260912_v1_0`), `nutrient_standard_version` (from UK FoP MTL reference id via nutrient adapter).

---

## 5. Scoring / state / commentary / S28 evidence

| Concern | Result |
|---------|--------|
| Packet Context | One +1 or one −3; never both; Set B never +1 |
| Organic | Cert +3 suppresses claim-only +1; suppression in `suppressed_candidates` |
| State | Independent of numeric 15; no synthetic +0 ledger row |
| Commentary | Exact §11 templates; tokens bound; NOVA sentence optional after context story |
| Nutrition look-through | L3 target `claims_packet_context_nutrition` → Nutrition details |
| S28 UI | `TruScoreAnalysisModal` renders assessment_state, coverage, admitted claims (incl. member_targets), nutrient context, fired Claims adjustments, suppressions, benchmarks, diagnostics, versions |
| S28 gate | `EXPO_PUBLIC_SCORE_DIAGNOSTICS` ∧ Settings toggle; production/preview eas profiles `SCORE_DIAGNOSTICS=0` + `STORE_RELEASE=1` |
| Ordinary-user naming | Consumer pillar label **Claims**; S28 may retain internal **Ethics** key (INV / UAT-36 / nomenclature suite) |

---

## 6. Section 15 UAT matrix (row-by-row)

Evidence class: **A** = automated fixture; **U** = UI/source contract; **P** = platform/parity (shared JS + export); **M** = manual device (not run — no UAT release).

| ID | Expected | Actual | Evidence class | Evidence reference |
|----|----------|--------|----------------|-------------------|
| UAT-01 | +1; exact positive L2 | Pass | A | `claimsRescue.uat.test.ts` UAT-01 |
| UAT-02 | one +1; synthesized claims | Pass | A | UAT-02 |
| UAT-03 | −3; sugars in adverse story | Pass | A | UAT-03 |
| UAT-04 | −3; multi-nutrient list | Pass | A | UAT-04 |
| UAT-05 | one −3 only | Pass | A | UAT-05 |
| UAT-06 | Set B no High → no +1 | Pass | A | UAT-06 |
| UAT-07 | Set B + High → −3 | Pass | A | UAT-07 |
| UAT-08 | Moderate not High | Pass | A | UAT-08/09 |
| UAT-09 | equality not High | Pass | A | UAT-08/09 |
| UAT-10 | large-portion High → −3 | Pass | A | UAT-10 |
| UAT-11 | total fat ignored | Pass | A | UAT-11 |
| UAT-12 | NOVA4 alone → no Claims NOVA story | Pass | A | UAT-12 |
| UAT-13 | +1 + NOVA sentence | Pass | A | UAT-13/14 |
| UAT-14 | −3 + NOVA sentence | Pass | A | UAT-13/14 |
| UAT-15 | +3; +1 suppressed in S28 payload | Pass | A | UAT-15 |
| UAT-16 | Organic claim-only +1 | Pass | A | UAT-16 |
| UAT-17 | ingredient organic excluded | Pass | A | UAT-17 |
| UAT-18 | Fairtrade +6 unchanged | Pass | A | UAT-18 |
| UAT-19 | MSC/RA points unchanged | Pass | A | UAT-19 |
| UAT-20 | KTC company-level | Pass | A | UAT-20 (+ ethics pillar KTC suite) |
| UAT-21 | ambiguous BBFAW → no fire | Pass | A | UAT-21 |
| UAT-22 | assessed_neutral; exact L2; no L1 | Pass | A | UAT-22 |
| UAT-23 | neutral + unclassified append | Pass | A | UAT-23 |
| UAT-24 | incomplete → unassessed | Pass | A | UAT-24 |
| UAT-25 | offsetting → assessed_scored | Pass | A | UAT-25 |
| UAT-26 | Set C record-only | Pass | A | UAT-26 |
| UAT-27 | unlisted synonym → no match | Pass | A | UAT-27 |
| UAT-28 | collision retain B | Pass | A | UAT-28 |
| UAT-29 | register mismatch fail-closed | Pass | A | UAT-29 |
| UAT-30 | missing sodium → no +1 | Pass | A | UAT-30 |
| UAT-31 | no raw `[CLAIM]` brackets | Pass | A | UAT-31 |
| UAT-32 | one −3; bounded lists | Pass | A | UAT-32 |
| UAT-33 | ordinary S28 inaccessible | Pass | A+U | UAT-33; `scoreDiagnostics`; eas production/preview |
| UAT-34 | founder S28 shows state/ledger/suppression/evidence/versions | Pass | A+U | UAT-34; `claimsS28.contract.test.ts`; modal source |
| UAT-35 | iOS/Android parity | Pass | P | UAT-35 identical payload; `expo export` iOS+Android success (local, unpublished) |
| UAT-36 | no Ethics leak on ordinary surfaces | Pass | A+U | nomenclature suite + UAT-36 normalisation |

**L1/L2/L3 + Nutrition look-through:** automated via commentary tests + `resolveL3Route` / `l3/content` claims_packet_context_nutrition + literal copy contract entries for positive/adverse/claim-only.

**Manual device screenshots:** not produced (no UAT release authorised). Founder/UAT device confirmation remains a later bundled package step.

---

## 7. Section 16 negative-assurance matrix

| Theme | Probe | Result | Evidence |
|-------|-------|--------|----------|
| Recognition boundary | Typos / look-alikes / ingredient organic / case | Pass | `claimsRescue.negativeAssurance.test.ts` |
| Evidence honesty | No admissions → unassessed; pending ≠ neutral | Pass | same |
| Arithmetic | +1/−3 exclusivity; Organic suppression | Pass | same |
| Nutrient boundary | Moderate; missing sodium | Pass | same |
| State integrity | No +0; offsetting assessed_scored | Pass | same |
| Attribution | KTC/BBFAW company-level (UAT-20/21) | Pass | UAT + ethics suite |
| Commentary | No raw tokens; qualification retained | Pass | NA commentary |
| Access control | Store release rejects entitled S28 | Pass | `scoreDiagnostics.test.ts` |
| Parity/regression | Ethics/Highlights/Claims 315 green; cert/KTC/BBFAW suites | Pass | §8 |

---

## 8. Exact commands and results

```text
# Focused Claims / Ethics / Highlights / cert / S28 gate
npx jest src/__tests__/unit/lib/claims/ \
  src/__tests__/unit/lib/pillars/ethicsPillar.test.ts \
  src/__tests__/unit/lib/scoreHighlights/ \
  src/__tests__/unit/services/ethicsCertificationsService.test.ts \
  src/__tests__/unit/config/scoreDiagnostics.test.ts --no-cache
→ Test Suites: 16 passed; Tests: 315 passed

# Lint (Claims package paths)
npx eslint src/lib/truscoreEngine/claims/**/*.{ts,tsx} \
  src/components/TruScoreAnalysisModal.tsx src/types/truscoreAnalysis.ts \
  src/__tests__/unit/lib/claims/**/*.ts --max-warnings 0
→ exit 0

# Typecheck (repo-wide)
npx tsc --noEmit -p tsconfig.json
→ exit 2 — pre-existing failures dominated by reports/** evidence trees;
  plus one Nutrition Stage 3 dead-compare warning in governedNutrientAssessment.ts
  (productClass '"food"|"drink"' vs '"unknown"') — not introduced by Claims files.
  No Claims-path tsc errors in src/lib/truscoreEngine/claims/**

# Non-release production profile gate check
eas.json production/preview/preview-apk:
  EXPO_PUBLIC_SCORE_DIAGNOSTICS=0, EXPO_PUBLIC_STORE_RELEASE=1 ✓

# Non-release platform bundle verification (not published)
EXPO_PUBLIC_SCORE_DIAGNOSTICS=0 EXPO_PUBLIC_STORE_RELEASE=1 \
  npx expo export --platform ios --output-dir dist-claims-verify-DO-NOT-COMMIT/ios
→ exit 0 (Hermes bundle written; artifact deleted locally, not committed)

EXPO_PUBLIC_SCORE_DIAGNOSTICS=0 EXPO_PUBLIC_STORE_RELEASE=1 \
  npx expo export --platform android --output-dir dist-claims-verify-DO-NOT-COMMIT/android
→ exit 0 (same)
```

---

## 9. Regressions

- Ethics pillar, Score Highlights closed-set, certifications, S28 gate: **green** (315).  
- Nutrition Stage 3 remain on HEAD `674d1fe` — untouched by Claims commit intent.  
- Dual-UAT Expo Go path: no native-only Claims module added.

---

## 10. Deviations / residuals

1. **Set A/B live admissions:** upstream dependency documented; fail-closed until an approved producer exists (no OCR workflow invented).  
2. **S28 screenshots on device:** deferred to later bundled UAT package (export + contracts satisfy automated UAT-34/35; no release build).  
3. **Internal Ethics nomenclature** remains on S28 pillar map and registry keys — allowed; ordinary-user surfaces use Claims.  
4. **Document-control propagation / Confidence / NR / W3-S26 / alcohol:** out of scope per instruction.

---

## 11. QA handover (independent review)

Suggested review order:

1. `matchRegister.ts` vs Register Rules R-001–R-023 (esp. R-012/R-013) + `aVmc003.r013.test.ts`  
2. `assessClaims.ts` decision procedure + state model  
3. Organic +3/+1 suppression path  
4. `TruScoreAnalysisModal` Claims block vs S28-01…07  
5. Section 15/16 suites vs this matrix  
6. Confirm no Claims threshold arithmetic in Nutrition module  
7. Confirm production eas S28 off  

---

## 12. Commit / SHA

| Field | Value |
|-------|-------|
| Branch | `fix/review1-pass2-corrective-na001-003-004` |
| Claims Rescue commit SHA | Reported at handoff from `git rev-parse HEAD` (this file is part of that commit) |
| Message | `feat(claims): Claims Rescue v0.2 register, assessment, S28 and evidence` |

---

*End of completion report.*
