# P0 Exhaustive Historical Regression Matrix — 2026-11-18

**publicReleaseStatus: BLOCKED**  
**Branch:** `build/w5-founders-native-20261114`  
**Pre-corrective tip:** `5f2dce9`  
**UAT API after Antarctica withdraw + admin token:** `dpl_AMuxeFSsPDzx2LjvDMJjeUpu36WV` → `https://truscoreapi-uat.vercel.app`  
**Doctrine:** Wave 5 v0.3; Founder-Approved MVP Functionality Register 2026-11-18 (controlling for preselected-only).

Precedence rule: latest **explicit founder decision** wins over agent interpretation.

---

## Chronological decision-to-code (contribution / WP09 / Claims)

| Date | Founder disposition | SHA / source | Notes |
|------|---------------------|--------------|-------|
| pre–Nov 2026 | Full guided contribution + WP09 Agree/Correct | WP09 `f497ce4`, Corrective R1 `58753eb`, UI `9e4c505` | Last broad working consumer contribution era |
| 14 Nov 2026 | Origins Antarctica E2E accepted on Cadbury | `67f9edd` / FINAL_CONTRIBUTION_AND_SHARE_E2E | Structured Origins admit path proven live |
| 15–17 Nov | FM-03R photo-free Claims absence | `7e1f59c`…`c346551` | Eligible Claims-NR only; Rated hide |
| **17 Nov** | **MVP preselected-only** default-deny photos/free text/VLM; keep FM-03R + WP09 Agree | **`956886b`** | Controlling containment |
| 18 Nov | Agent restore free-form journeys | `b752fdf` | **Rejected** by founder / independent FAIL |
| 18 Nov | Reaffirm preselected-only | **`e36ed7a`** + register | Controlling |
| 18 Nov | Restore structured Origins under MVP (claim+country) | **`43b424d`** | Authorised P0 restore; tip stamp `5f2dce9` |
| 18 Nov (this package) | Exhaustive recovery: Agree≠Change; transmit reconcile; withdraw Antarctica | *(pending commit)* | See rows below |

---

## Feature matrix

| Feature | Latest founder decision | Original impl SHA | Last known working | Regression SHA / cause | Current location | Corrective | Android | iOS | Backend | Status |
|---------|-------------------------|-------------------|--------------------|------------------------|------------------|------------|---------|-----|---------|--------|
| Structured Origins Add (claim+country) | 18 Nov P0 restore under MVP | guided era / `67f9edd` | API admit `43b424d` seq 361 | `956886b` blocked finalize | `PacketContributionModal` + server `mvpContributionInputPolicy` | `43b424d` + transmit reconcile (this) | DEFERRED clean journey | DEFERRED TestFlight | PASS admit (pre-withdraw) | **PARTIAL** |
| Origins Change / Remove | Keep under structured | voluntary offer + modal | pre-`956886b` | Containment + false failure left card stale | `voluntaryContributionOffer` structured Change; edit/share icons on card | structured + reconcile | Icons visible (9300652817232) | DEFERRED | Closure submit path | **PARTIAL** |
| Origins Share icon | Approved card chrome | Result Origins card | visible | n/a | `app/result/[barcode].tsx` | none | PASS visible | DEFERRED | n/a | **PASS** (visual) |
| Antarctica Cadbury integrity | Withdraw test evidence; no resurrection | EA govern withdraw | UAT fixture | Probe admit while UI said fail | EA `ver_076fcf7e57f2`, `ver_dbc2e1261afe` | founder-admin withdraw 200 | n/a | n/a | PASS withdrawn; prevailing origins=[] | **PASS** |
| Client false “Couldn’t submit” | Must reconcile authoritative status | `transmitSession` | n/a | fail without GET check | `src/evidenceAuthority/device.ts` `reconcileFailedTransmit` | this package | DEFERRED | DEFERRED | GET snapshot reconcile | **FIXED (code)** |
| WP09 Agree (Packet Claims) | Keep when entitled (`COMMUNITY_AGREEMENTS=1`) | `f497ce4` / `9e4c505` | Origins still worked | Surface gated on free-form Change → `change_ineligible` under preselected-only | `surfaceGate.ts` + `CommunityAgreementBar` | this package | FAIL pre-fix visual; unit PASS | DEFERRED | n/a | **FIXED (code)** / device re-verify **DEFERRED** |
| WP09 Correct thumbs-down | Contained under MVP (targets free-form Change) | WP09 Correct→Change | free-form era | Coupling hid Agree too | `correctEnabled` from Change destination | this package | Origins Correct visible; Packet Correct hidden (policy) | DEFERRED | Agree ≠ score | **PASS** (policy-aligned) |
| WP09 Agree persistence | WP09 contract | community-agreement API | entitled UAT | n/a | `CommunityAgreementBar` / client | unchanged | Origins count=1 shown | DEFERRED | Postgres buckets | **PASS** (Origins device) |
| FM-03R photo-free | Keep when Claims NR eligible | `c346551` | unit + UAT admit `9300673999999` | Server Claims-NR gate still deferred | Result + attestation path | celebration on admit | DEFERRED NR fixture UI | DEFERRED | Admit PASS; Claims-NR gate **AMBER** | **PARTIAL** |
| Claims 15/25 publication | Methodology; no hardcode | packetAbsence attestation tests | unit | Server Claims-NR unresolved | assessment projection | none (no bypass) | DEFERRED | DEFERRED | DEFERRED server gate | **DEFERRED** |
| Photo / Gallery / OCR / free-text | Forbidden MVP | `956886b` | intentional | restore `b752fdf` rejected | client+server policy | `e36ed7a`/`43b424d` keep blocked | PASS (hidden) | DEFERRED | 403 probes | **PASS** |
| Confetti / success | Only after authoritative success | W5-CD-01 | guided modal | false failure path | Result `presentContributionCelebration` | reconcile + FM-03R celebration | DEFERRED | DEFERRED | admit→notify | **PARTIAL** |
| Certifications / Highlights / Score | Consumption contract only | Wave 5 | B0 doctrine | n/a this package | Result presentation | none | not re-audited | DEFERRED | n/a | **DEFERRED** (no intentional change) |
| Discovery free-text Correct | Block under preselected-only | register | contained | — | gates | contained | n/a | n/a | n/a | **PASS** (contained) |

---

## Antarctica trace (item C)

| # | Finding |
|---|---------|
| 1 | Request: structured `made_in` + Antarctica via EA finalize-manual-text + submit (P0 probe). Result: **admitted** `admissionSeq=361` `versionId=ver_076fcf7e57f2`. Prior UAT fixture `produced_in` Antarctica `admissionSeq=349` `ver_dbc2e1261afe` also prevailing. |
| 2 | Prevailing until withdraw; both were authoritative. |
| 3 | Consumer “Couldn’t submit” = client treated non-admitted transmit / 403-era finalize as hard fail (`CONTRIBUTION_NOTICE_SAVED`) **without** GET snapshot reconcile — even when authority already held the subject. |
| 4 | Snapshot did refresh for successful admits; failed client path did not call `notifyEvidenceAdmission`. |
| 5 | Change/Remove empty/stale when Result never applied admitted snapshot after false failure; menus require settled publication + structured Origins facts. |
| 6 | Downstream: Cadbury Origins showed Antarctica to all consumers until withdraw. |
| Withdraw | Founder-admin `withdraw` **200** both versionIds; `prevailing` origins empty; `withdrawnSubjectKeys` includes `origins\|made_in` and `origins\|produced_in` (no resurrection of older versions). Admin token was empty on UAT — configured + redeployed as prerequisite for authorised govern. |

---

## Packet Claims WP09 (item D) — GTIN `9300652817232`

| Finding | Evidence |
|---------|----------|
| Four claims present | EA prevailing: High calcium / Low sugar / 7 Vitamins & Minerals / High Fibre |
| Missing thumbs pre-fix | Android screencap: Origins has “Does this look right?” + thumbs; Packet Claims card ends at Limited confidence with **no** bar |
| Root cause | `agreementSurfaceGate` required `eligibleAgreementChangeJourney` → packet Change only when free-form guided ON → under MVP preselected-only, **Agree hidden** |
| Historical design | W5-UI-13 bar; WP09 Agree permitted; Correct → Change (`mvpFeatureGates` comment + register) |
| Corrective | Agree = settlement Rated\|NR latch; Correct = Change destination only (`correctEnabled`) |
| Not invented | No new interaction model; Correct remains Change-gated / contained for packet under MVP |

---

## STOP conditions

Restoration is **not** independently accepted while:

1. Android Packet Claims Agree bar not re-verified on a clean Result load after reload (Expo navigation flake during this session).
2. iOS TestFlight not run.
3. FM-03R Claims-NR commercial UI fixture + 15/25 publication remain DEFERRED (server Claims-NR AMBER).
4. Implementation SHA for this corrective package not yet committed / stamped on UAT integration list.

**Do not set publicReleaseStatus to anything other than BLOCKED.**
