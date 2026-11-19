# Integrated MVP Baseline Acceptance

**Branch:** `integration/w5-mvp-baseline-recovery-20261119`  
**Implementation tip under review (product behaviour):** `46f3913d3e8ddddce5c944805892532cf99de70e`  
**Evidence-preservation tip:** this commit on the same branch (docs/tests/probes only; no product-behaviour change) — see `docs/uat/phase5-p0-probes-20261119/EVIDENCE_INDEX_20261119.md`  
**Implementation lineage:** Stage 5 Android evidence `127ae20` + governance `83c6cd0` + implementation tip `46f3913`  
**UAT backend deploy:** `dpl_AMuxeFSsPDzx2LjvDMJjeUpu36WV`  
**publicReleaseStatus:** **BLOCKED**  
**Date:** 2026-11-19 (review follow-up; candidate **not** founder-accepted)

### Verdict

**NOT fully recovered / NOT accepted as the recovered MVP baseline.** Cumulative integration candidate `46f3913` is the correct recovery base under review, with additional contract, behavioural, deploy, and Android device evidence preserved on this branch. Founder must explicitly approve the recovered baseline before new feature development resumes. Gate 2 and Gate 3 remain **NOT PASSED**.

---

## 1. Canonical feature register

- `docs/governance/FOUNDER_APPROVED_MVP_FUNCTIONAL_BASELINE.md`
- Discrepancy matrix: `docs/governance/MVP_REGRESSION_DISCREPANCY_MATRIX_20261119.md`
- Provenance: `docs/governance/REPOSITORY_PROVENANCE_MAP_20261119.md`

## 2. Integration SHA

| Role | SHA / ref |
|------|-----------|
| Integration branch | `integration/w5-mvp-baseline-recovery-20261119` |
| Reviewed implementation tip | `46f3913` (**not yet accepted**) |
| Evidence-preservation tip | this commit (parent `46f3913`; index: `EVIDENCE_INDEX_20261119.md`) |
| Stage 5 Android evidence tip | `127ae20` |
| Governance docs tip | `83c6cd0` |
| Backend deploy | `dpl_AMuxeFSsPDzx2LjvDMJjeUpu36WV` |
| RC1 presentation ancestor | `0ce9969` (merge-base proven) |
| Rejected tip | `b752fdf` |

## 3. Backend deployment provenance

| Item | Status |
|------|--------|
| Host | `https://truscoreapi-uat.vercel.app` up |
| Live deploy id | **`dpl_AMuxeFSsPDzx2LjvDMJjeUpu36WV`** — Ready (`vercel inspect truscoreapi-uat.vercel.app`, 2026-11-19) |
| Deploy URL | `https://truscoreapi-9yuzpg06h-leightons-projects-d328c774.vercel.app` |
| Frontend compatibility | Tip `46f3913` Expo Go against this alias: structured Origins Packed-in Australia admitted (seq **364**) on Cadbury; policyVersion `mvp_preselected_only_v1_20261118` |
| Policy probes 2026-11-19 | Freeform finalize **403** `mvp_preselected_only_evidence_action_forbidden`; mistaken POST action `snapshot` **403** same; authorised GET snapshot **200** |
| Cadbury Antarctica | GET snapshot: **no Antarctica in prevailing**; withdrawn includes origins subjects — **PASS** |

Evidence: `docs/uat/phase5-p0-probes-20261119/` (`uat_deploy_compat_20261119.txt`, `probe_snapshot_get_vs_post_out.json`, `cadbury_origins_snapshot_post_ui_admit.json`)

## 4. Automated tests (at exact tip `46f3913`)

| Suite | Result |
|-------|--------|
| `mvpBaselineContracts.test.ts` (7 contracts) | **PASS** — recorded `baseline_contracts_at_46f3913.txt` / `baseline_contracts_run_meta.txt` |
| `reconcileAfterLostSubmitAck.test.ts` | **PASS** — GET reconcile recovers server-admitted / client-unacked submit |
| `mvpEaActionPolicy.snapshotRead.test.ts` | **PASS** — POST `snapshot` forbidden; structured Origins / FM-03R finalize permitted by policy module |
| `wp09PacketPersistenceAndCorrectPath.test.ts` | **PASS** — Agree once per revision; reset on new admitted version; Correct stays non-mutating unavailable |
| Combined re-run | **14/14 PASS** — `jest_review_followup.txt` |
| Prior Stage 5 WP09 / share / transmit / policy suites | Retained PASS on lineage |

Source-text contracts are supplemented by executable behavioural suites above (admit/reconcile/policy/persistence). They do **not** by themselves pass Gate 2/3.

## 5. Android acceptance matrix (partial)

| Feature ID | Status | Notes |
|------------|--------|-------|
| B-05 Packet claims display | PASS | Fixture `9300652817232` — High calcium / Low sugar / 7 Vitamins & Minerals / High Fibre |
| B-06/B-07 Packet Share/Info | PASS | Stage 5 `127ae20` + tip still exposes Share / More information |
| D-01 Packet Agree visible + persistence | PASS | Device: `You already agreed. 1 person agrees`; unit switch/reset on revision |
| D-02 Packet Correct complete journey | **FAIL / UNRESOLVED** | Honest Alert only ("Correction not available yet") — not a submitting correction pathway |
| B-02 Origins full admit journey | **PASS (Android Expo Go on tip)** | Add Packed in Australia → Submit → celebration → Result shows Fiji + Australia; EA seq 364 |
| C-03 Confetti | **PASS (Android on tip)** | Celebration overlay "You made a difference!" after Origins admit |
| P0-4 prohibited pathways (server) | PASS | Live 403 probes + unit policy |
| P0-4 mistaken POST `snapshot` vs GET read | PASS | GET 200 / POST 403 distinguished |
| Expo Go splash / remote-update | Mitigated for this session | Metro without `--offline` + `adb reverse` + `exp://10.0.2.2:8081` |

Device packet: `docs/uat/phase5-p0-probes-20261119/DEVICE_JOURNEY_EVIDENCE_20261119.md`

## 6. iOS acceptance matrix

| Area | Status |
|------|--------|
| All recovery tip journeys | **DEFERRED / NOT VERIFIED / UNRESOLVED** — TestFlight not run on `46f3913` |

## 7. Legal / Account

| Area | Status |
|------|--------|
| Published Terms/Privacy | **BLOCKED** — not published |
| Legal preflight | **BLOCKED** — not CLEARED |
| Account Guest MVP (Android historical) | PASS historical; iOS DEFERRED |
| Auth/registration | DEFERRED (intentional) |

Do **not** interpret Legal as CLEARED. Both legal publication and legal preflight remain **BLOCKED** until explicitly CLEARED by the release process.

## 8. Outstanding governance decisions (explicit unresolved)

1. **CF-04 / FM-03R server eligibility** — Server Claims-NR projection for FM-03R remains **STOPPED / UNRESOLVED**.  
2. **Packet Correct destination** — Catalogue / governed structured Correct vs interim Alert (**P0-2 incomplete / FAIL**).  
3. **iOS** — no TestFlight acceptance on this tip (**UNRESOLVED**).  
4. **Legal** — publication + preflight remain **BLOCKED**.  
5. **Highlights L3 UAT** — evidence conflict UK-01 (unchanged).  
6. **Founder explicit approval** of this baseline before new features — **not granted**; `46f3913` is review candidate only.

## 9. Remaining launch blockers

- Legal publication and legal preflight remain **BLOCKED** (not published / not CLEARED) — they must become CLEARED before any public-release interpretation  
- Independent Stage 6–7 full Android + iOS matrices  
- CF-04 resolution if FM-03R must be server-enforced for launch  
- Packet structured Correct if required for P0-2 PASS  
- `publicReleaseStatus: BLOCKED` until separate release criteria

## 10. Permanent regression protection

- Contract suite: `src/__tests__/unit/governance/mvpBaselineContracts.test.ts` (7/7 at `46f3913`)  
- Behavioural supplements: `reconcileAfterLostSubmitAck.test.ts`, `mvpEaActionPolicy.snapshotRead.test.ts`, `wp09PacketPersistenceAndCorrectPath.test.ts`  
- Existing Stage 5 / policy / WP09 / share / reconcile unit tests retained  
- Canonical baseline + discrepancy matrix in `docs/governance/`  

## 11. Gate status (do not inflate)

| Gate | Status |
|------|--------|
| Gate 2 — integrated functional recovery | **NOT PASSED** |
| Gate 3 — independent acceptance | **NOT PASSED** |

Rationale: iOS unverified; Legal BLOCKED; Packet Correct incomplete; CF-04/FM-03R unresolved; founder has not accepted `46f3913` as the recovered MVP baseline. Android Origins + Packet Agree evidence on tip improves Gate 2 readiness but does **not** flip the gate.

---

**STOP for independent acceptance and founder baseline approval.**  
Do not treat this document as self-certification of full MVP recovery.  
Do not treat `46f3913` as the accepted recovered MVP baseline until founders explicitly approve.
