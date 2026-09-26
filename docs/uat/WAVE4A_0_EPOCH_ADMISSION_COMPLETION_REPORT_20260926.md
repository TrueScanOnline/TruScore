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
| Implementation commit | Initial: `f3ccdc660bbac8196d5e925202b77177e8a9c146`; Body wording: `a458e32be782937d034e0b2c44a30fafc21de2fe`; QA corrective: see tip below |
| Branch tip | `git rev-parse HEAD` on `wave4a/evidence-epoch-admission-20260926` after QA corrective commit |
| QA baseline tip (Claude assurance) | `a458e32be782937d034e0b2c44a30fafc21de2fe` |
| QA corrective tip | `adb97a328b1eb89f59737eaf07294346bf9f5a5e` |
| Final hardening tip | `git rev-parse HEAD` after final hardening commit |
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

- `src/contributions/productionEpoch.ts` — `wave4a.0` epoch; explicit production recordClass allowlist; runtime creation determinant
- `src/contributions/admissionTypes.ts` — admission/receiver types (breaks circular imports)
- `src/contributions/admissionContract.ts` — admission, recomputed receiver eligibility, prevailing selection, version binding
- `src/contributions/bodyReceiverRegistry.ts` — code/governance-controlled Body predicate registration (empty in 4A.0)
- `src/contributions/contributionRecovery.ts` — durable material-completion checkpoints + non-downgrading retry
- `src/__tests__/unit/contributions/wave4a0AdmissionContract.test.ts` — §8 falsification + QA corrective adversarial suite
- `docs/uat/WAVE4A_0_EPOCH_ADMISSION_COMPLETION_REPORT_20260926.md` — this report

### Files modified (QA corrective pass vs `a458e32`)

- `src/contributions/productionEpoch.ts` — explicit production allowlist + creation runtime determinant
- `src/contributions/admissionContract.ts` — recompute eligibility; drop scoringEligible/stored-map authority; Body via registry
- `src/contributions/bodyReceiverRegistry.ts` — **added**
- `src/contributions/contributionRecovery.ts` — non-downgrading retry
- `src/contributions/eligibilityBoundary.ts` — prevailing-controlled Origins/Certifications consumption
- `src/contributions/evidenceVersion.ts` — `variantKey` in durable `evidenceId`
- `src/contributions/submitGovernedEvidence.ts` — runtime recordClass stamping; variantKey in evidenceId
- `src/contributions/index.ts` — Body registry exports
- `src/__tests__/unit/contributions/wave4a0AdmissionContract.test.ts` — adversarial QA-1…QA-5 cases
- `docs/uat/WAVE4A_0_EPOCH_ADMISSION_COMPLETION_REPORT_20260926.md` — this update

### Contract summary

| Concern | Mechanism |
|---|---|
| Epoch | `productionEpoch === 'wave4a.0'` **and** explicit `recordClass === 'production'` (allowlist; absent/unknown/malformed/historical/fixture/test/developer fail closed) |
| Admission | `admissionStatus`: raw → submitted → admitted; `admitEvidence` requires auditable reason + rule version; never upgrades non-production `recordClass` |
| Receiver eligibility | **Recomputed** from approved methodology predicates on every production gate; stored `receiverEligibility` maps are never authoritative. Body slot fail-closed via empty `bodyReceiverRegistry` (`BODY_RECEIVER_4A0_UNREGISTERED_REASON`); 4A.2 registers predicates in code/governance |
| `scoringEligible` | **Compat mirror only** — not controlling for production assessment; cannot grant receiver eligibility on `review_required` |
| Prevailing | `selectPrevailingAdmittedEvidence` used by Origins/Certifications consumption; later activity on older admitted versions cannot regain precedence via `updatedAt` |
| Corrections | New `evidenceVersion` / `evidenceId`; history retained; `variantKey` participates in durable `evidenceId` and evidence key |
| `review_required` | Governance only; preserves prior receiver eligibility via **controlled recomputation** (confirmation threshold), not stored maps / legacy flags; no withdraw / no score mutation |
| Recovery | `@rveel_contribution_recovery_v1` checkpoints; retry prefers current local authoritative state; snapshot rehydrate only when local absent; non-production classes cannot checkpoint |

### Schema / migration

- **No DB column migration.** Backend already stores full JSON evidence documents.
- **No backfill / grandfathering.** Pre-epoch rows remain stored; fail closed for production authority.
- **Authority-changing bulk migration:** **Not performed** (not authorised).

## D. Data safety

| Record class | Treatment |
|---|---|
| Historical / missing / malformed / unspecified `recordClass` | Remain in stores; cannot admit; cannot enter `toScoringProduct` promotion — even if current epoch string is present |
| Fixture / test / developer | Structurally excluded; epoch alone never converts them |
| New production submits (release/TestFlight runtime) | Stamp `wave4a.0`, `recordClass=production`, `admissionStatus=submitted` via `resolveContributionCreationRecordClass()` |
| Jest / Metro / Expo Go submits | Stamp `recordClass=developer` (existing `__DEV__` / `NODE_ENV=test` / `JEST_WORKER_ID` determinant) — cannot acquire production authority |
| Admitted production | Explicit `admitGovernedEvidence` / `admitEvidence` only; requires explicit `recordClass=production` |

## E. Tests

### Commands

```bash
npm run test:wave4a0 -- --no-coverage
npm run test:wave4-contributions -- --no-coverage
```

### Results (2026-09-26 — final hardening tip)

- `test:wave4a0`: **3 suites, 65 tests, all PASS** (was 55 after QA corrective; was 35 at initial foundation)
- `test:wave4-contributions`: **4 suites, 38 tests, all PASS** (unchanged count)

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
| Body fail-closed: no approved Body methodology registered in 4A.0 | `Body receiver — 4A.0 fail-closed default` | PASS |
| Body extensibility via registered predicates (not stored `eligible:true`) | same describe / second case | PASS |

### QA corrective adversarial mapping (founder-directed 4A.0 pass)

| Area | Tests | Result |
|---|---|---|
| **1. Receiver eligibility authority** | QA-1 forged Open/Body stored maps; scoringEligible on `review_required` without confirmations; controlled recomputation when threshold met; Body predicate registration | PASS |
| **2. Prevailing consumption** | QA-2 v2 prevails after later v1 activity; unadmitted draft does not displace; superseded certs not unioned | PASS |
| **3. Recovery non-downgrade** | QA-3 withdrawal/disputes/`review_required` survive retry; repeated failed retries; stale snapshot cannot re-elevate withdrawn | PASS |
| **4. Variant identity** | QA-4 base + variant independently addressable/versioned | PASS |
| **5. Production recordClass allowlist** | QA-5 explicit production required; absent/unknown/malformed/historical/test/fixture/developer fail closed; epoch alone insufficient; Jest stamps developer; admission/retry cannot upgrade | PASS |

### Final hardening adversarial mapping (founder-directed freeze pass)

| Section | Closed behaviour | Tests | Result |
|---|---|---|---|
| **H1** | Asserted `cross_user_eligible` without qualifying confirmations cannot create production receiver eligibility; forged stored fields irrelevant; legitimate confirmations still work | `H1 Asserted cross_user_eligible…` (3) | PASS |
| **H2** | Missing-local recovery recovers payload but strips stale assessment authority; no consumption via rehydration; no progressive elevation; withdrawal/`review_required` preservation intact | `H2 Missing-local recovery…` (4) | PASS |
| **H3** | `variantKey` canonicalised at submission; whitespace-equivalent keys share version history; no overwrite of base/prior | `H3 variantKey canonicalisation…` (2) | PASS |
| **H4** | Controlled production-class override exercises `submitGovernedEvidence` → `admitGovernedEvidence`; authority still requires governed confirmations | `H4 Production submit → admit path…` (1) | PASS |

### Body receiver corrective note (founder-authorised)

Before (initial tip): extensibility “proved” by mutating stored `receiverEligibility` map.  
After (QA corrective): stored maps never authoritative; `bodyReceiverRegistry.registerBodyReceiverPredicate` is the only 4A.2 extensibility path; forged `eligible:true` fails closed.

### ORG-02 / ORG-06 backlog note (not authorised for retune in this pass)

On tip `95c7d16`, pre-existing Wave 4 ORG-02/ORG-06 expectations that Open score **delta** vs bare equals a fixed +4 already failed (Open returned 15 for bare and trusted NZ tags alike). 4A.0 tests assert **field preservation / source consistency / epoch gating** rather than retuning Open methodology. **Founder backlog disposition:** weakened/masked Open delta regression-test issue remains open; do not treat as epoch-contract defect.

## F. Reachability

### New contract paths (live)

- `submitGovernedEvidence` → stamps epoch + recordClass from runtime determinant + `submitted` + recovery checkpoint (production class only); canonicalises `variantKey`
- `admitGovernedEvidence` / `submitAndAdmitGovernedEvidence` → governed admission
- `toScoringProduct` → applies promoted evidence only via `canApplyToProductionReceiver` + prevailing selection **per evidence key**
- `selectPrevailingAdmittedEvidence` / `getPrevailingAdmittedEvidenceForKey`
- `retryPendingRemotePersist` / `listPendingRecovery` / `resolveRecoveryPersistPayload` / `stripStaleAssessmentAuthorityForMissingLocalRecovery`
- `registerBodyReceiverPredicate` / `evaluateBodyReceiverEligibility`

### Compatibility / legacy paths retained

- Pre-epoch lifecycle flags (`scoringEligible`, `canPromoteToCanonicalProduct`) remain for Wave 4 community-verification unit behaviour.
- Backend API accepts nested evidence JSON as before (new fields stored when present); no deploy performed.
- `unifiedContributionService` pending accumulate unchanged (not production-authoritative).
- Callers that only `submitGovernedEvidence` without admit will **not** affect production assessment until a later package wires admit into UI flows (intentional fail closed).

## G. Unresolved / blockers (explicit later dependencies)

1. **Functional Spec v0.2 Required Controlling Inputs** — methodology cells not invented. Body receiver slot remains fail-closed until 4A.2 registers approved predicates via `bodyReceiverRegistry`.
2. **Call-site cutover:** Manual Edit / CoM still submit without automatic admit — assessment stays fail closed until 4A.1+ wires controlled admission (by design).
3. **Backend authority gate (blocking for shared-remote production):** no remote evidence may become production assessment-authoritative while the backend accepts client-supplied authority fields without server-side admission/recomputation. **Not redesigned/deployed in this pass.**
4. **Multi-device / server version collision (blocking for shared-remote production):** version allocation is local; two devices can independently produce the same `…|v1`, colliding at backend upsert. **Explicit pre-production/shared-remote design dependency.**
5. **Origins subject/key semantics → 4A.3:** For the same governed product/variant contribution **subject**, the later successfully admitted user contribution prevails; earlier same-subject contributions are historical. Origins may legitimately hold multiple concurrent facts (made in / packed in / processed in / sourced from / multiple countries). A later contribution about one subject must not erase unrelated Origins facts. Do not compare unrelated Origins records by per-key version as a global winner; do not invent a timestamp winner across subjects. **Detailed subject/key/correction semantics belong to 4A.3 — not implemented in 4A.0.**
6. **Value-derived evidence key / correction semantics** (e.g. AU→NZ new key vs new version) — preserve for Origins/4A.3 disposition.
7. **ORG-02/ORG-06 Open delta** — weakened/masked regression-test issue; founder backlog; do not retune Open methodology here.
8. **NOVA1 Rescuer / Body6 / Whole Produce** deferred to 4A.2. OFF Nutri-Score/NOVA substitution via contribution evidence remains prohibited.

## H. Recommendation

| Question | Answer |
|---|---|
| Ready for founder acceptance / freeze of 4A.0 foundation? | **Yes** — QA corrective + final hardening closed with mapped adversarial coverage |
| Can 4A.1 safely depend on this contract for **local/single-device** epoch + admission + receiver + prevailing + recovery? | **Yes**, provided 4A.1 uses `admit*` paths, confirmation-record eligibility, and explicit `recordClass=production` |
| Can 4A.1 declare **shared-remote / multi-device production readiness**? | **No** — unresolved backend authority + multi-device version-collision gates |
| Origins multi-subject / correction semantics? | **4A.3 dependency** — not changed in 4A.0 |
| Next package should | Wire capture/UI to `submit` → `admit`; keep fixtures off production class; avoid bulk migration; dispose remote/server-authority + multi-device versioning before shared-remote production |

## I. QA corrective delta (vs tip `a458e32`)

| Authorised correction | Before | After |
|---|---|---|
| Receiver eligibility authority | `isAssessmentEligibleForReceiver` trusted stored map; `review_required` could use `scoringEligible` / prior stored eligible | Always recomputes via `computeReceiverEligibility`; `review_required` preserves via confirmation-threshold recomputation only; Body via registry |
| Prevailing consumption | Origins chose by `updatedAt`; Certs unioned all eligible versions | Both use `selectPrevailingAdmittedEvidence` per evidence key |
| Recovery | `retryPendingRemotePersist` always `upsertLocalEvidence(snapshot)` | Prefer current local; snapshot only if absent; cannot roll governance backwards |
| Variant identity | `buildEvidenceId` omitted `variantKey` | `variantKey` in durable `evidenceId` + evidence key |
| Production recordClass | Denylist of fixture/test/developer; absent class + epoch could be production | Explicit allowlist `recordClass===production`; creation stamped via `__DEV__`/`NODE_ENV=test`/`JEST_WORKER_ID` → developer, else production |

## J. Final hardening delta (vs tip `adb97a3`)

| Authorised correction | Before | After |
|---|---|---|
| Asserted lifecycle eligibility | `state === cross_user_eligible` alone could grant receiver eligibility | Confirmation threshold always taken from governed confirmation records; asserted state without qualifying confirmations fails closed |
| Missing-local recovery | Absent local rehydrated full checkpoint snapshot including promotion/eligibility | Payload recovered; assessment authority stripped (`state→pending`, `canonicalPromoted=false`, eligibility cleared); lifecycle required to regain authority |
| `variantKey` | Trim inconsistently / compared raw at submit | `canonicalizeVariantKey` once at submission for versioning, keys, IDs, storage, comparisons |
| Production path assurance | No direct submit→admit production-class path test under Jest | `H4` uses `__setContributionCreationRecordClassForTests('production')` without weakening runtime Jest→developer default |

**Closed in this final hardening pass:**
- asserted `cross_user_eligible` cannot independently create production authority;
- missing-local recovery cannot restore stale assessment authority;
- `variantKey` is canonicalised consistently;
- production submission→admission has direct path-level test coverage.

**Signals / EAS / release / pillar methodology / scoring files:** unchanged.  
**Backend / multi-device architecture:** unchanged.  
**Origins cross-key/subject semantics:** unchanged (4A.3 dependency recorded).  
**4A.1:** not started.

**Parallel Signals ancestry note:** Dynamic Signals MVP work continues on separate branch lineage from `95c7d16` (e.g. `signals/dsa-asset-20260926-final`). This Wave 4A.0 tip does not merge or depend on Signals pack changes.

## Dual-device UAT

JS/TS only. No `.env` / EAS / Dynamic Signals Asset changes. AU TestFlight + NZ Expo Go convention unchanged. TestFlight release builds stamp `recordClass=production`; Expo Go / Metro stamp `developer`.
