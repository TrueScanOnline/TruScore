# Account Trust / Privacy / Support / Legal completion — evidence

**Date:** 17 November 2026  
**Branch:** `build/w5-founders-native-20261114`  
**Worktree:** `C:\TrueScan-FoodScanner-w5-unified-mvp-20261113`  
**Verified starting SHA (Trust programme):** `1043a9e554a3bc8da6b467bc479c8b9a385d094c`  
**Prior Trust tip before closeout:** `bfd7d0dc1077ad7c629435a79e9d0ab14bec2885`  
**Closeout implementation SHA / Final pushed SHA:** `2442ab320008d72e1e7ee18626db75c71c755f90`  
**Docs tip after evidence SHA records:** see branch HEAD on `build/w5-founders-native-20261114` (docs-only commits may sit above the implementation SHA).

## Doctrine classification

**GREEN** — Account presentation, consumer education, mailto templates, local-clear UX, fail-closed legal destinations, draft factual reconciliation, operational/counsel registers, cache-size unknown propagation, product-report concern picker.

**Not implemented / blocked:** publishing Privacy/Terms; flipping `legalDestinations.*.ready`; scoring/EA/Signals changes; OFF contribution enablement; telemetry default-on; Premium/auth; native Share Card OFF attribution code (proposal only); public release clearance.

## Closeout corrections (17 Nov — this tip)

### 1. Privacy cache correctness
- `getCacheSize()` now returns `number | null`.
- Genuine empty/missing cache → `0`.
- AsyncStorage failure / corrupt JSON / non-object payload → `null` (unknown), **not** zero.
- Privacy & Data and legacy Settings clear confirmations use dedicated unknown copy when count is unavailable.
- Behavioural tests: `src/__tests__/unit/services/getCacheSize.failure.test.ts`.

### 2. Legal draft reconciliation
- Updated `docs/legal/RVEEL_PRIVACY_POLICY_DRAFT_20261116.md` and `docs/legal/RVEEL_TERMS_OF_USE_DRAFT_20261116.md`.
- Factual (*code*) corrections: Skip no longer bypasses legal acknowledgement; share telemetry / local share analytics default OFF; OFF public contribution default disabled; Guest Account / privacy mailto / reporting / administrative hold behaviour.
- Both documents remain **DRAFT — NOT APPROVED FOR PUBLICATION**.
- No invented entity, jurisdiction, retention periods, liability caps, contacts or approvals.

### 3. Product-report classification
- Accessible concern picker (`ProductReportConcernPicker`) on Help before mailto.
- Result report uses `ProductAssessmentReportControl` with the same picker (except fixed hold concern).
- Selected concern is written into assessment mailto `Concern type:`.
- Result path preserves barcode / name / brand when available.
- Open draft ≠ receipt / ticket / automatic score change.

### 4. OFF Share Card attribution
- Recorded as **explicit public-release dependency**.
- Account disclosure does **not** cure the gap.
- Exact proposed change prepared: `docs/legal/ACCOUNT_TRUST_OFF_SHARE_CARD_ATTRIBUTION_PROPOSAL_20261117.md` (not implemented — provenance wording pending counsel).
- Gate nonbinding note updated on `off_database_and_image_reuse` (status remains PENDING).

## Screen inventory and navigation

| Screen | Route | Principal actions |
|---|---|---|
| Privacy & Data | `PrivacyData` | Data-at-a-glance; clears; expandable data-use panels; privacy request categories; published Privacy Policy fail-closed |
| Help & Support | `HelpSupport` | FAQ; concern-classified product report; manufacturer; technical; NZ/AU recalls; Privacy link; contact; About |
| Legal & Methodology | `LegalMethodology` | Score/pillars/states/Confidence; sources/limitations; corrections → Help; Privacy/Terms fail-closed |

## Four-pass ledger (original Trust programme + closeout)

| Pass | Outcome |
|---|---|
| 1 Factual | Disclosures, clears, FAQ/routes, mailto separation |
| 2 Rights | Deletion=review; telemetry honesty; attribution gap disclosed; drafts reconciled factually |
| 3 Adversarial | Unconfigured support; food-safety; no auto correction; cache unknown ≠ zero |
| 4 QA | Automated suites PASS on closeout tip. Fresh Android Expo Go Trust UI capture **PASS** on tip `6c6340c` / impl `2442ab3` (17 Nov session: Metro recovered via `adb reverse` + `exp://127.0.0.1:8081`; force-stop relaunch cleared stuck Bundling 100%). Artifacts under `artifacts/account-trust-closeout-20261117/` (`26`–`48`). **iOS OUTSTANDING**. |

## Automated test results (closeout)

| Check | Result |
|---|---|
| `yarn tsc --noEmit` | PASS |
| Account unit suites + trust/concern contracts | PASS |
| `getCacheSize.failure.test.ts` | PASS |
| Methodology flags/version | PASS |
| Wave 5 §10.4 / §10.2 | PASS |
| `mvpLaunchHardening.gates.test.ts` | PASS |
| `assert-public-launch-ready.test.cjs` | PASS (6) |
| `npm run legal:release-preflight` | DENIED / **BLOCKED** (expected) |

## Device evidence

Untracked folder: `artifacts/account-trust-closeout-20261117/`.  
**SHA at capture:** `6c6340c89f33b6607095c9c5937dfe06c44db042` (docs tip; closeout impl `2442ab3`).  
**Platform:** Android Expo Go / Pixel_5 (`emulator-5554`) via `exp://127.0.0.1:8081` + `adb reverse tcp:8081 tcp:8081`.

| Capture | File | Observation |
|---|---|---|
| Account Trust rows | `26_account_scrolled.png`, `48_account_trust_rows.png` | Privacy & Data / Help & Support / Legal & Methodology; `RVEEL 10.0.0` |
| Privacy top / mid / requests | `27`–`30` | Data-at-a-glance; clears with counts; expandable use panels; privacy request categories; “Not configured” / “Not published yet” |
| Help FAQ / contact | `32`–`35`, `37` | FAQ expandables; product / manufacturer / technical report rows |
| Help fail-closed mailto | `36_help_concern_or_state.png` | “A support email is not configured… no placeholder address will be used.” |
| Legal education | `38`–`42` | Pillars/states/Confidence; methodology sources; corrections → Help |
| Legal destinations blocked | `43`, `45` | Privacy Policy / Terms “Not published yet”; draft ≠ published copy in alert |
| Methodology in-app dest | `46_legal_methodology_dest.png` | In-app Score methodology sheet opens (approved copy) |

**Do not treat prior `account-trust-privacy-legal-20261117` or Account MVP acceptance PNGs alone as proof of this closeout tip** — this folder’s `26`–`48` series is the post-recovery proof.

## Remaining residual

| Class | Item |
|---|---|
| Technical | iOS TestFlight visual of Privacy/Help/Legal |
| Technical / rights | Native Share Card OFF attribution implementation after counsel wording approval |
| Operational | Configured monitored support email; staffed dispute owner |
| Legal external | Entity, counsel approvals, published PP/ToS — all PENDING |

## Protected invariant confirmation

No scoring weights, Rateability, Confidence derivation, EA admission, Dynamic Signals governance, manufacturer-hold semantics, Premium/auth, OFF contribution enablement, or telemetry default-on flips.

## Verdicts

| Verdict | Status |
|---|---|
| **Technical Account Trust closeout (code)** | COMPLETE for authorised gaps above |
| **Android device visual re-proof** | **PASS** (Expo Go; see Device evidence) |
| **iOS device visual** | **OUTSTANDING** |
| **Public legal release** | **BLOCKED** — unchanged (`publicReleaseStatus: BLOCKED`, 15 requirements PENDING, legal destinations unpublished) |

## Separate public-release statement

Account Trust completion / closeout is **not** public-launch approval. See `docs/legal/MVP_PUBLIC_LAUNCH_BLOCKER.md` and `docs/legal/MVP_PUBLIC_LAUNCH_GATE.json`.
