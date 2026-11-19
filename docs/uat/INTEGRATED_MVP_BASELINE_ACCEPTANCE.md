# Integrated MVP Baseline Acceptance

**Branch:** `integration/w5-mvp-baseline-recovery-20261119`  
**Implementation core:** `31e7e44`  
**Evidence tip (Stage 5 Android):** `127ae20`  
**Governance docs tip:** `83c6cd0` (this report superseding stamp below)  
**publicReleaseStatus:** **BLOCKED**  
**Date:** 2026-11-19  

### Verdict

**NOT fully recovered.** Cumulative integration candidate exists and is the correct recovery base, but Phase 5–7 device/iOS/legal acceptance is incomplete. Founder must explicitly approve the recovered baseline before new feature development resumes.

---

## 1. Canonical feature register

- `docs/governance/FOUNDER_APPROVED_MVP_FUNCTIONAL_BASELINE.md`
- Discrepancy matrix: `docs/governance/MVP_REGRESSION_DISCREPANCY_MATRIX_20261119.md`
- Provenance: `docs/governance/REPOSITORY_PROVENANCE_MAP_20261119.md`

## 2. Integration SHA

| Role | SHA / ref |
|------|-----------|
| Integration branch | `integration/w5-mvp-baseline-recovery-20261119` |
| Recommended candidate | `127ae20` + governance `83c6cd0` |
| RC1 presentation ancestor | `0ce9969` (merge-base proven) |
| Rejected tip | `b752fdf` |

## 3. Backend deployment provenance

| Item | Status |
|------|--------|
| Host | `https://truscoreapi-uat.vercel.app` up |
| Live deploy id | **NOT VERIFIED** this session (CLI token unavailable) |
| Policy probes 2026-11-19 | Freeform finalize **403** `mvp_preselected_only_evidence_action_forbidden`; photo upload **403** `mvp_preselected_only_photo_upload_forbidden`; policyVersion `mvp_preselected_only_v1_20261118` |
| Cadbury Antarctica | GET snapshot: **no Antarctica in prevailing**; withdrawn includes `origins\|made_in`, `origins\|produced_in`, `origins\|grown_in` — **PASS** |

Evidence: `docs/uat/phase5-p0-probes-20261119/`

## 4. Automated tests (this session)

| Suite | Result |
|-------|--------|
| WP09 dual thumbs / Agree≠Change | PASS (16 tests across 5 files including policy) |
| Packet Claims share | PASS |
| Transmit reconcile contracts | PASS |
| mvpContributionInputPolicy | PASS |
| New `mvpBaselineContracts.test.ts` | to be run on commit |

## 5. Android acceptance matrix (partial)

| Feature ID | Status | Notes |
|------------|--------|-------|
| B-05 Packet claims display | PASS | Stage 5 `127ae20` fixture `9300652817232` |
| B-06/B-07 Packet Share/Info | PASS | Stage 5 Android |
| D-01 Packet Agree visible | PASS | Stage 5 Android |
| D-02 Packet Correct complete journey | FAIL | Honest Alert only — not a submitting correction pathway |
| B-02 Origins full admit journey | NOT VERIFIED | This session Expo Go failed remote update / stuck splash after Metro reconnect |
| C-03 Confetti | NOT VERIFIED | |
| P0-4 prohibited pathways (server) | PASS | Live 403 probes |
| P0-4 prohibited pathways (UI) | NOT VERIFIED | Device session blocked |

## 6. iOS acceptance matrix

| Area | Status |
|------|--------|
| All recovery tip journeys | **DEFERRED / NOT VERIFIED** — TestFlight not run |

## 7. Legal / Account

| Area | Status |
|------|--------|
| Published Terms/Privacy | BLOCKED — not published |
| Legal preflight | BLOCKED |
| Account Guest MVP (Android historical) | PASS historical; iOS DEFERRED |
| Auth/registration | DEFERRED (intentional) |

## 8. Outstanding governance decisions

1. **CF-04** — Server Claims-NR projection for FM-03R (STOPPED).  
2. **Packet Correct destination** — Catalogue / governed structured Correct vs interim Alert (P0-2 incomplete).  
3. **Highlights L3 UAT** — evidence conflict UK-01.  
4. **Confirm live UAT deploy id** matches tip policy modules including structured Origins.  
5. **Founder explicit approval** of this baseline before new features.

## 9. Remaining launch blockers

- Legal publication + preflight CLEARED  
- Independent Stage 6–7 full Android + iOS matrices  
- CF-04 resolution if FM-03R must be server-enforced for launch  
- Packet structured Correct if required for P0-2 PASS  
- `publicReleaseStatus: BLOCKED` until separate release criteria

## 10. Permanent regression protection

- Contract suite: `src/__tests__/unit/governance/mvpBaselineContracts.test.ts`  
- Existing Stage 5 / policy / WP09 / share / reconcile unit tests retained  
- Canonical baseline + discrepancy matrix in `docs/governance/`  

---

**STOP for independent acceptance and founder baseline approval.**  
Do not treat this document as self-certification of full MVP recovery.
