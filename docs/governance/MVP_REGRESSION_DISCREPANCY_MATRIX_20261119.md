# Phase 4 — MVP Regression / Discrepancy Matrix

**Tip under assessment:** `127ae20` (`31e7e44` implementation)  
**Companion baseline:** `FOUNDER_APPROVED_MVP_FUNCTIONAL_BASELINE.md`  
**publicReleaseStatus:** BLOCKED  
**Rule:** Unknown ≠ PASS. Code/button visibility ≠ restored journey.

Status legend: **PASS** | **FAIL** | **BLOCKED** | **DEFERRED** | **NOT VERIFIED**

---

## Matrix (abridged permanent IDs — extend in place, never delete rows)

| Feature ID | Feature | Founder decision | Approval source | Original SHA | Last working SHA | Current SHA | Current behaviour | Expected | Regression cause | Required correction | Test coverage | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A-01 | Overall score consumption contract | Publish from contract only | Doctrine; RC1 | Wave5 | `0ce9969` | `127ae20` | Contract path present | Fail closed | n/a intentional | Device re-verify | founderUi / wave5 tests | NOT VERIFIED |
| A-03 | NR/Checking fail-closed | No Rated implication | Doctrine | Wave5 | `0ce9969` | `127ae20` | Code+tests | Fail closed | — | Device R/NR/CK | unit | NOT VERIFIED |
| A-06 | Highlights L3 | Locked prose vs UAT conflict | l3 content vs Wave3 handoff | Wave3 | ? | `127ae20` | Code present | Founder-accepted UAT unclear | Evidence conflict | Escalate UK-01 | partial | BLOCKED |
| B-02 | Origins structured Add journey | P0 structured under MVP | `43b424d` | guided/`67f9edd` | API `43b424d` | `127ae20` | Code ready | Full Add→Admit→Confetti | Device not completed Stage 5 | Device+API Stage 6 | unit/API | NOT VERIFIED |
| B-03 | Origins Change/Remove | Structured only | P0 | pre-956886b | `43b424d` | `127ae20` | Code ready | Change/Remove+refresh | Device outstanding | Device Stage 6 | offer tests | NOT VERIFIED |
| B-05 | Packet Claims display AE | Show contributed claims | UAT list | Wave5 | `127ae20` Android | `127ae20` | 4 claims on `9300652817232` | Visible | — | Keep | Android evidence | PASS (Android tip) |
| B-06 | Packet Share | CF-03 | CF-03/`31e7e44` | gap pre-31e7e44 | `127ae20` | `127ae20` | Share sheet PASS Android | Share works | Missing share pre-Stage5 | Keep; iOS | unit+Android | PASS (Android); iOS DEFERRED |
| B-07 | Packet Info | Info explainer | `d9189fa` | `d9189fa` | `127ae20` | `127ae20` | Present | Present | — | — | Android a11y | PASS (Android) |
| B-08 | Packet Edit | When offer entitles | CF-03 | Wave5 | policy | `127ae20` | Absent on fixture (offer empty) | Respect permissions | MVP containment | None if offer empty | Android | PASS (policy) |
| B-09 | FM-03R eligible | Claims NR → attestation → 15/25 methodology | FM-03R SHAs | `7e1f59c` | API probe | `127ae20` | Client path; no commercial NR UI; no server NR | Full journey | CF-04 + fixture | Server gate after approval; fixture | unit; API partial | BLOCKED |
| B-10 | FM-03 photo | Retired | `956886b` | `9b81e6e` | retired | `127ae20` | Hidden | Hidden | intentional | Keep retired | policy tests | PASS (contained) |
| C-01 | Preselected-only policy | Default-deny | `956886b`/`e36ed7a` | `956886b` | `e36ed7a` | `127ae20` | Client+server modules | Deny prohibited | — | Confirm live UAT deploy | unit+prior 403 | NOT VERIFIED (live deploy) |
| C-04 | Transmit reconcile | CF-06 | CF-06 | dirty P0 | `31e7e44` | `127ae20` | Code+contract tests | No false fail after admit | Antarctica false-fail | Device prove | contract tests | NOT VERIFIED |
| C-03 | Confetti after admit | CD-01 | `3a3d91f` | `3a3d91f` | wired | `127ae20` | Wired | After authoritative only | — | Device | CD-01 docs | NOT VERIFIED |
| C-07 | Free-form restore | Rejected | register | `b752fdf` | rejected | not baseline | Not tip | Stay rejected | — | Do not merge | — | PASS (kept out) |
| D-01 | WP09 Agree Packet | Keep Agree; Agree≠Change | CF-01/`31e7e44` | `f497ce4` | Android `127ae20` | `127ae20` | Visible 0 count | Agree works | Coupled gate pre-fix | Persist/switch Stage 6 | unit+Android | PASS (visibility); persistence NOT VERIFIED |
| D-02 | WP09 Correct Packet | Option C structured or honest Alert | CF-01/02 | WP09 | Alert Android | `127ae20` | Alert non-submit | **Completed correction journey** expected by P0-2 | No packet catalogue | Catalogue or governed exception | Android Alert | FAIL vs P0-2 complete journey (Alert is interim honest path only) |
| D-02b | WP09 Correct Origins | Structured Change when eligible | CF-01/02 | WP09 | code | `127ae20` | Correct visible | Opens structured Change+admit | — | Device prove Change | — | NOT VERIFIED |
| D-03 | WP09 persistence | Revision reset contract | WP09 | `f497ce4` | E2E era | `127ae20` | API unchanged | Persist/switch/reset | — | Device | WP09 docs | NOT VERIFIED |
| E-01/E-02 | Published ToS/PP | Required for release | Legal gate | drafts | never | tip | Not published | Published ready | never cleared | Counsel+URLs | preflight | BLOCKED |
| E-04 | Legal preflight | DENY until clear | MVP_PUBLIC_LAUNCH_BLOCKER | gate | DENIED | tip | DENIED | CLEARED only when complete | — | External approvals | gate scripts | BLOCKED |
| E-06 | Auth/registration | Deferred Guest-only | Account MVP | — | deferred | tip | Guest | Guest | intentional | Keep deferred | Account docs | DEFERRED |
| E-07 | Account Home/Units | Guest MVP Android | Account 16 Nov | Account SHAs | Android PASS | tip | Present | Present | — | iOS | Account UAT | PASS (Android historical); iOS DEFERRED |
| F-03 | Packet share | CF-03 | CF-03 | `31e7e44` | `127ae20` | `127ae20` | PASS Android | PASS | — | iOS | unit+Android | PASS (Android); iOS DEFERRED |
| S-01 | Live UAT deploy ≡ tip policy | Must match | dual-UAT | various dpl_* | unknown live | ? | Host up; deploy id unverified | Matching deploy | UK-02 | Reconfirm vercel alias | probes | NOT VERIFIED |
| S-02 | Metro/device bound to tip | Required for device PASS | directive | — | prior session | down now | Metro/emulator down | Bound to integration tip | — | Restart + bind | — | NOT VERIFIED |

---

## P0 priority callouts (Phase 5)

| P0 | Verdict at matrix time | Why |
|----|------------------------|-----|
| P0-1 Origins full journey | NOT VERIFIED | Code present; device admit+confetti not proven on tip |
| P0-2 Packet Claims | PARTIAL — display/Agree/Share/Info PASS Android; **Correct journey FAIL** as complete pathway (Alert only); persistence NOT VERIFIED | Matches founder: Alert ≠ completed correction |
| P0-3 FM-03R | BLOCKED | CF-04 + commercial NR fixture |
| P0-4 Restrictions | PASS contained in source; live UAT 403 NOT VERIFIED this session | Re-probe after deploy confirm |

---

## Escalations (founder / architecture only)

1. **CF-04** — Approve server publication projection for FM-03R or keep client-only indefinitely.  
2. **D-02 Packet Correct** — Approve structured catalogue Correct, keep interim Alert, or other governed destination.  
3. **UK-01** — Highlights L3 UAT acceptance status.  
4. **Legal publication** — External; remains BLOCKED.
