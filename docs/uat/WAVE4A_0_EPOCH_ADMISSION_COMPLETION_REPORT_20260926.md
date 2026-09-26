# Wave 4A.0 — Clean Production Evidence Epoch & Runtime Evidence/Admission Contract

**Package:** Cursor Implementation Instruction v0.1 · 26 September 2026  
**Branch:** `wave4a/evidence-epoch-admission-20260926`  
**Report date:** 2026-09-26

## A. Baseline

| Item | Value |
|---|---|
| Starting branch (inspected) | `fix/wave3-rateability-corrective-20260924` |
| Starting SHA | `95c7d16dd46f64714baa4540d859b2d49eab4cda` |
| Implementation branch | `wave4a/evidence-epoch-admission-20260926` (from starting SHA; no unrelated merge/cherry-pick) |
| Ending SHA | `be6ed970e422caf274f8cb6184f1c57e1f24ed2f` (package tip; impl `f3ccdc6`) |
| Working tree at start | Clean except local extract helper |
| Unrelated merge/cherry-pick | **None** |

## B. As-built inventory (pre-change)

### Contribution / evidence stores

| Surface | Path | Role |
|---|---|---|
| Client governed evidence | `src/contributions/*` | Lifecycle, submit, local AsyncStorage `@rveel_contribution_evidence_v1` |
| Unified pending accumulate | `src/services/unifiedContributionService.ts` | Pre-submit accumulation (`@truescan_pending_contributions_*`) — not production epoch authority |
| Manual / CoM writers | `manualProductService.ts`, `manufacturingCountryService.ts` | Call `submitGovernedEvidence` |
| Backend API | `backend/vercel/api/contribution-evidence.ts` | POST/GET JSON evidence rows |
| DB | `backend/vercel/lib/database.ts` → `contribution_evidence` (Postgres JSONB / Mongo / memory) |
| Scoring adapter | `eligibilityBoundary.toScoringProduct` ← `calculateTruScore` | Assessment-facing consumption |
| Policy SoT | `src/config/contributionPolicy.ts` | Confirm/dispute thresholds; `review_required` at 2 disputes |

### Pre-4A.0 semantics (as found)

- **Versioning:** `evidenceId` embeds `evidenceVersion`; confirm/dispute bind to `evidenceId`.
- **Bug vs 4A.0:** `submitGovernedEvidence` reused max version (overwrite) instead of incrementing corrections.
- **Admission:** No explicit admission transition — submit created `pending` only; community confirm → `cross_user_eligible`.
- **`scoringEligible`:** Domain/lane boolean set on `cross_user_eligible`; controlling for `canPromoteToCanonicalProduct` and (previously) `toScoringProduct` promotion.
- **Epoch:** None. Historical/fixture/local rows could be passed as `promotedContributionEvidence` if flags were set.
- **`review_required`:** Present; does not auto-withdraw; preserves prior `scoringEligible`.
- **Leakage paths:** Standalone local/AsyncStorage overlays stripped by `toScoringProduct`; promoted evidence array was the remaining assessment path.

### Legacy / test leakage risks (reported before cutover)

1. Pre-epoch rows with `scoringEligible` + `canonicalPromoted` could enter `toScoringProduct` if supplied by callers.
2. Fixture/test records had no structural exclusion from production authority.
3. Backend GET returned all barcode rows without epoch filtering (client must fail closed).
4. No authority-changing migration existed; JSON blob store is additive.

## C. Implementation

### Files added

- `src/contributions/productionEpoch.ts` — `wave4a.0` epoch; record-class exclusion; inspectable authority descriptor
- `src/contributions/admissionTypes.ts` — admission/receiver types (breaks circular imports)
- `src/contributions/admissionContract.ts` — admission, receiver eligibility, prevailing selection, version binding
- `src/contributions/contributionRecovery.ts` — durable material-completion checkpoints + retry
- `src/__tests__/unit/contributions/wave4a0AdmissionContract.test.ts` — §8 falsification suite
- `docs/uat/WAVE4A_0_EPOCH_ADMISSION_COMPLETION_REPORT_20260926.md` — this report

### Files modified

- `src/contributions/types.ts` — epoch, recordClass, admission*, receiverEligibility, version-bound confirm/dispute
- `src/contributions/lifecycle.ts` — version stamps on confirm/dispute; refresh production receiver eligibility
- `src/contributions/submitGovernedEvidence.ts` — epoch stamp, version increment, submit≠admit, `admitGovernedEvidence`, recovery hooks
- `src/contributions/eligibilityBoundary.ts` — production receiver gate for promoted evidence; pre-epoch fail closed
- `src/contributions/index.ts` — exports
- `src/__tests__/unit/contributions/eligibilityBoundary.test.ts` — CERT-08/ORG-02/ORG-06 aligned to epoch contract
- `package.json` — `test:wave4a0` script

### Contract summary

| Concern | Mechanism |
|---|---|
| Epoch | `productionEpoch === 'wave4a.0'`; absent ⇒ pre-epoch fail closed; `fixture`/`test`/`developer` structurally excluded |
| Admission | `admissionStatus`: raw → submitted → admitted; `admitEvidence` requires auditable reason + rule version |
| Receiver eligibility | `receiverEligibility[open_origins \| ethics_certifications \| body_ingredients_nutrition]`; Body always fail closed for local contribution |
| `scoringEligible` | **Compat mirror only** — not controlling for production assessment |
| Prevailing | `selectPrevailingAdmittedEvidence` — latest admitted production-epoch version per evidence key; draft cannot displace |
| Corrections | New `evidenceVersion` / `evidenceId`; history retained |
| `review_required` | Governance only; preserves prior receiver eligibility; no withdraw / no score mutation |
| Recovery | `@rveel_contribution_recovery_v1` checkpoints; retry remote persist; fixtures cannot checkpoint |

### Schema / migration

- **No DB column migration.** Backend already stores full JSON evidence documents.
- **No backfill / grandfathering.** Pre-epoch rows remain stored; fail closed for production authority.
- **Authority-changing bulk migration:** **Not performed** (not authorised).

## D. Data safety

| Record class | Treatment |
|---|---|
| Historical / missing epoch | Remain in stores; cannot admit; cannot enter `toScoringProduct` promotion |
| Fixture / test / developer | Structurally excluded even if epoch string present |
| New production submits | Stamp `wave4a.0`, `recordClass=production`, `admissionStatus=submitted` |
| Admitted production | Explicit `admitGovernedEvidence` / `admitEvidence` only |

## E. Tests

### Commands

```bash
npm run test:wave4a0 -- --no-coverage
npm run test:wave4-contributions -- --no-coverage
```

### Results (2026-09-26)

- `test:wave4a0`: **3 suites, 35 tests, all PASS**
- `test:wave4-contributions`: **4 suites, 38 tests, all PASS**

### §8 falsification mapping

| §8 case | Test | Result |
|---|---|---|
| Pre-epoch cannot affect assessment/Confidence/maturity | `§8.1` | PASS |
| Raw/draft cannot score before admission | `§8.2` | PASS |
| Eligible for one receiver, ineligible for another | `§8.3` | PASS |
| Newer draft does not displace admitted prevailing | `§8.4` | PASS |
| Later admitted correction becomes prevailing; history kept | `§8.5` | PASS |
| Partial contribution leaves unrelated keys intact | `§8.6` | PASS |
| Confirm/dispute on N does not attach to N+1 | `§8.7` | PASS |
| Two independent disputes → `review_required` | `§8.8` | PASS |
| `review_required` does not withdraw or mutate score | `§8.9` | PASS |
| Fixture cannot acquire production authority via retry/rehydrate | `§8.10` | PASS |
| Material completion survives failure/retry | `§8.11` | PASS |
| Unauthorised pillar behaviour unchanged | `§8.12` + CERT-02/NUT/W1 | PASS |
| Domain-global `scoringEligible` not controlling | dedicated case in suite | PASS |

### Baseline note (not a 4A.0 regression)

On tip `95c7d16`, pre-existing Wave 4 ORG-02/ORG-06 expectations that Open score **delta** vs bare equals a fixed +4 already failed (Open returned 15 for bare and trusted NZ tags alike). 4A.0 tests assert **field preservation / source consistency / epoch gating** rather than retuning Open methodology (out of scope).

## F. Reachability

### New contract paths (live)

- `submitGovernedEvidence` → stamps epoch + `submitted` + recovery checkpoint
- `admitGovernedEvidence` / `submitAndAdmitGovernedEvidence` → governed admission
- `toScoringProduct` → applies promoted evidence only via `canApplyToProductionReceiver`
- `selectPrevailingAdmittedEvidence` / `getPrevailingAdmittedEvidenceForKey`
- `retryPendingRemotePersist` / `listPendingRecovery`

### Compatibility / legacy paths retained

- Pre-epoch lifecycle flags (`scoringEligible`, `canPromoteToCanonicalProduct`) remain for Wave 4 community-verification unit behaviour.
- Backend API accepts nested evidence JSON as before (new fields stored when present); no deploy performed.
- `unifiedContributionService` pending accumulate unchanged (not production-authoritative).
- Callers that only `submitGovernedEvidence` without admit will **not** affect production assessment until a later package wires admit into UI flows (intentional fail closed).

## G. Unresolved / blockers

1. **Functional Spec v0.2 Required Controlling Inputs** were not present in-repo / Desktop pack beyond this instruction — methodology cells not invented; Body local contribution remains fail closed.
2. **Call-site cutover:** Manual Edit / CoM still submit without automatic admit — assessment stays fail closed until 4A.1+ wires controlled admission (by design).
3. **Backend deploy** not authorised — remote persist remains best-effort; recovery retries when backend available.
4. **Open score delta vs bare** for string-only origin is baseline-sensitive on this tip — separate from 4A.0; do not treat as epoch defect.
5. **NOVA1 Rescuer** not inspected/modified (deferred to 4A.2 per instruction §11).

## H. Recommendation

| Question | Answer |
|---|---|
| Ready for founder review / independent QA? | **Yes** — bounded foundation implemented with §8 evidence |
| Can 4A.1 safely depend on this contract? | **Yes**, for epoch + admission + receiver eligibility + prevailing + recovery APIs. 4A.1 must use `admit*` paths and must not treat `scoringEligible` as controlling. |
| Next package should | Wire capture/UI to `submit` → `admit`; keep fixtures off production epoch; avoid bulk migration |

## Dual-device UAT

JS/TS only. No `.env` / EAS / Dynamic Signals Asset changes. AU TestFlight + NZ Expo Go convention unchanged.
