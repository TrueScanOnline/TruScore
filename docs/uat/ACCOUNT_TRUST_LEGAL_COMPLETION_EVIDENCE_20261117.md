# Account Trust / Privacy / Support / Legal completion — evidence

**Date:** 17 November 2026  
**Branch:** `build/w5-founders-native-20261114`  
**Worktree:** `C:\TrueScan-FoodScanner-w5-unified-mvp-20261113`  
**Verified starting SHA:** `1043a9e554a3bc8da6b467bc479c8b9a385d094c`  
**Implementation SHA:** `840cad5df983a02ef2d3029e62a42ef928f72adb`  
**Final pushed SHA:** `840cad5df983a02ef2d3029e62a42ef928f72adb`

## Doctrine classification

**GREEN** — Account presentation, consumer education, mailto templates, local-clear UX, fail-closed legal destinations, operational procedure docs, nonbinding gate review notes.

**Not implemented here (RED / external):** publishing Privacy/Terms, flipping `legalDestinations.*.ready`, scoring/EA/Signals changes, OFF contribution enablement, telemetry default-on, Premium/auth, public release clearance.

## 1. Screen inventory and navigation

| Screen | Route | Principal actions |
|---|---|---|
| Privacy & Data | `PrivacyData` | Data-at-a-glance; clear history/favourites/cache; expandable data-use panels; privacy request categories; camera note; published Privacy Policy (fail-closed) |
| Help & Support | `HelpSupport` | Intro; 12 FAQs; product report; manufacturer review; technical support; NZ/AU recall links; link to Privacy; contact; About |
| Legal & Methodology | `LegalMethodology` | Score overview; pillars; publication states; Confidence; methodology/sources/limitations modals; corrections → Help; Privacy/Terms fail-closed |

Cross-links: Help → PrivacyData; Legal → HelpSupport.

## 2. New consumer text — sources / rationale

| Area | Source |
|---|---|
| Privacy intro / clear limits | Founder proposed plain language, validated against local stores + EA credential isolation |
| Data-use expandables | Code gates: local stores, network lookups, sharing, OFF contribution default off, share telemetry default off, EA separate |
| Privacy request categories | Brief §4.1 D; deletion framed as review, not universal right |
| Help FAQ answers | Approved Result/Legal methodology i18n semantics (NR/Checking/Confidence/Signals) |
| Food-safety copy + links | Founder-specified MPI/FSANZ URLs; FSANZ verified live; MPI URL retained as specified |
| Pillars / publication states / Confidence | B1/methodology i18n + brief; Confidence aligned to weakest-pillar rule |
| Sources structured panels | OFF ODbL/DbCL/CC BY-SA notices; honest native Share Card attribution gap |
| Limitations intro | Founder proposed wording + existing Result legal disclaimer keys |

## 3. Data-flow → UI disclosure mapping

| Flow | UI disclosure |
|---|---|
| Device history/favourites/settings/cache | Privacy intro + device expandable + clear actions |
| Network product lookup | Network expandable (functional request; not “every scan on RVEEL servers”) |
| Sharing / preview | Sharing expandable |
| Optional evidence / OFF public photos | Evidence expandable; OFF contribution disabled |
| Backend logs/security | Backend expandable; no invented retention/country claims |
| OFF catalogue | OFF expandable; clears ≠ OFF deletion |
| Optional share analytics | Telemetry expandable; gated, default off; no fake consent toggle |
| EA credentials | Intro/footnote: not removed by clears |

## 4. Functional actions and limits

- Clears: confirm → targeted API → success only after completion; failure alert; no AsyncStorage broad clear; no Delete Account.
- Cache count: `null` → “Count unavailable” (not false zero).
- Privacy/Help mailtos: configured email only; open ≠ receipt/ticket/server deletion.
- Privacy mailtos: no GTIN/photo/government ID demand.
- Product report: optional photos; no automatic score change.
- Legal Privacy/Terms: blocked until `ready`.
- Recall links: external official pages only.

## 5. Source licence / attribution mapping

| Source class | Consumer statement | Gap |
|---|---|---|
| OFF DB/contents/photos | ODbL / DbCL / CC BY-SA noted | Attribution alone may not satisfy all obligations |
| Native Share Card | Explicitly states no dedicated on-card OFF licence line | Counsel/product follow-up |
| Web preview | Conditional attribution when image present | Unchanged |
| Benchmarks/certs | Informed Claims where configured; endorsement not implied; rights uncleared | Do not activate restricted displays |

## 6. Legal content reconciliation

See `docs/legal/ACCOUNT_TRUST_DRAFT_RECONCILIATION_20261117.md` and `docs/legal/ACCOUNT_TRUST_COUNSEL_REVIEW_REGISTER_20261117.md`.  
Dispute procedure updated: `docs/legal/MVP_DISPUTE_CASE_HANDLING_PROCEDURE_20261116.md`.  
Gate nonbinding `currentReview` notes updated only; all requirements remain **PENDING**; `publicReleaseStatus: BLOCKED`.

## 7. Four-pass review/correction ledger

### PASS 1 — Factual / technical truth
**Findings:** Initial Privacy “How data used” only opened unpublished policy; cache errors reported as 0; Help lacked FAQ/manufacturer/technical/safety routes; Legal lacked explicit NR/Checking/hold separation on the Account surface; assessment mailto implied mandatory pack photos.  
**Corrections:** Expandable data-use disclosures; cache unavailable state; Help FAQ + report/manufacturer/technical/recall/privacy routes; Legal pillars/states/confidence/sources structure; mailto templates revised; privacy categories access/correction/deletion_review/complaint.

### PASS 2 — Legal / rights exposure
**Findings:** Risk of implying universal deletion right; telemetry permanence; native OFF attribution completeness; absolute accuracy/transparency language.  
**Corrections:** Deletion framed as review; telemetry “gated / default off”; Share Card attribution gap disclosed; reused B1 methodology limitation language; no entity/jurisdiction invention; counsel register created.

### PASS 3 — Adversarial / failure scenarios
**Findings:** Unconfigured support must stay honest; food-safety urgency must not wait on email; clear failure isolation; shared-then-held assessments must not promise auto-takedown.  
**Corrections:** Unconfigured alerts retained; food-safety section + official links; clear failure copy unchanged in spirit; corrections copy states no automatic assessment/share/OFF change; manufacturer authority verification note in mailto.

### PASS 4 — Integrated product QA
**Automated:** `tsc` PASS; Account + gate suites PASS (55); methodology + Wave 5 §10.2/§10.4 suites run with programme.  
**Android:** Emulator visual captures under `artifacts/account-trust-privacy-legal-20261117/` (untracked). Early captures used pre-reload bundle; Metro `-c` restart then lost emulator connection before fresh Trust UI screenshots could be sealed. **Fresh post-reload Android visuals: OUTSTANDING.**  
**iOS:** **OUTSTANDING** — no iOS environment this session.

## 8. Automated test results

| Suite | Result |
|---|---|
| `yarn tsc --noEmit` | PASS |
| `yarn jest src/__tests__/unit/account` (+ trust completion) | PASS |
| `mvpLaunchHardening.gates.test.ts` | PASS |
| Methodology flags/version/containment | PASS (with programme run) |
| Wave 5 §10.4 / §10.2 | PASS (with programme run) |
| `legal:release-preflight` | Expected DENIED / BLOCKED |

## 9. Remaining code / ops / legal

**Technical outstanding:** Fresh Android visual after Metro clear; iOS visual; optional native Share Card attribution implementation (AMBER/rights).  
**Operational:** Configured monitored support email; staffed dispute owner.  
**Legal external:** Entity, counsel approvals, published PP/ToS, OFF/benchmark rights, privacy regime applicability — all PENDING / BLOCKED.

## 10. Protected invariant confirmation

No scoring weights, Rateability, Confidence derivation, EA admission, Dynamic Signals governance, manufacturer-hold semantics, parent/benchmark scoring logic, Premium/auth, OFF contribution, or telemetry default flips were changed for entitlement.

## 11. Verdicts

| Verdict | Status |
|---|---|
| **Technical Account Trust completion (code)** | COMPLETE for authorised GREEN scope, subject to outstanding device visual re-proof after Metro reload |
| **Public legal release** | **BLOCKED** — unchanged |

## Separate public-release statement

Account Trust completion is **not** public-launch approval. See `docs/legal/MVP_PUBLIC_LAUNCH_BLOCKER.md` and `docs/legal/MVP_PUBLIC_LAUNCH_GATE.json`.
