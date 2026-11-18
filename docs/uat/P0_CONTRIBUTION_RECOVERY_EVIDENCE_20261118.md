# P0 Contribution Recovery Evidence — 2026-11-18

**publicReleaseStatus: BLOCKED**  
**Branch tip (implementation):** `43b424dd466d3593faffa6bf1b94a71fa5191703`  
**UAT deploy:** `dpl_AkpmnL9NBhAHxiPE9yaSpy84qm5i` → `https://truscoreapi-uat.vercel.app`

---

## Root causes (not policy toggling)

### Product Origins “Couldn’t submit”

| Field | Value |
|-------|--------|
| Consumer notice | `CONTRIBUTION_NOTICE_SAVED` — “We couldn’t submit this yet…” (`src/contribution/resultContributionActions.ts`) |
| Endpoint | `POST /api/evidence-authority` |
| Broken action | `finalize-manual-text` then `submit` |
| Auth | Bearer contributor credential (`issue-credential`) |
| Policy decision (pre-fix) | **403** `mvp_preselected_only_evidence_action_forbidden` — *all* manual-text forbidden under default-deny |
| Breaking change | `956886b` (containment) forbade `finalize-manual-text`; restore `b752fdf` reopened UI but live admit never verified; corrective `e36ed7a` closed UI again |
| Last successful Origins admit | Cadbury `9300617064879` Antarctica — `docs/uat/w5-mvp-rc/e2e-final/FINAL_CONTRIBUTION_AND_SHARE_E2E_ACCEPTANCE.md` @ `67f9edd` (2026-11-14) |
| Genuine gap | Structured Origins UI existed, but **no MVP-allowed transport** — free text/photo path was correctly blocked; dedicated structured allowlist was never wired |

### Fix applied (founder P0 authorised structured path)

- Server: allow `finalize-manual-text` **only** for structured Origins (claim type ∈ grown/produced/made/packed + country; **no** statement / typed % / ingredient free text).
- Server: allow `submit` facts that are structured Origins-only or FM-03R attestation.
- Client: `isStructuredOriginsContributionEnabled()`; menus show Origins Add/Change under MVP; modal form-first, no Camera/Gallery/free-text wording/typed %.
- Photos / free-form packet / nutrition remain blocked.

### Live UAT positive journey (Origins)

Barcode `9300617064879` (Cadbury UAT fixture):

| Step | Evidence |
|------|----------|
| Auth | `issue-credential` → success (`artifacts/p0-contribution-recovery-20261118/probe_structured_origins_log.txt`) |
| Selected payload | `made_in` + `Antarctica` + `percentageNotStated:true`, empty statement |
| Finalize | **HTTP 200** `asset_dc467c71ac12` `contentType=manual_text` |
| Submit | **HTTP 200** `outcome.status=admitted` `admissionSeq=361` subject `origins\|made_in` in prevailing |
| Negative free-form | Same endpoint with `statement:"Made in NZ"` → **403** |
| Negative photo | `POST /api/upload-photo` → **403** |

### FM-03R

| Step | Evidence |
|------|----------|
| Rated hide | Unit: Claims Rated → FM-03R ineligible (`packetClaimsFm03Fm03rEntry.test.ts`) — Barker `9414732208565` remains Rated |
| Eligible admit (UAT EA) | Barcode `9300673999999`: finalize attestation **200** + submit **admitted** `admissionSeq=362` (`probe_fm03r_*`) |
| 15/25 methodology | Unit `packetAbsenceUserAttestation.test.ts` — ethics 15, publishedScore 15, confidence limited, rated |
| Success UX | FM-03R now calls `presentContributionCelebration` + `CONTRIBUTION_NOTICE_ADDED` on admitted+snapshot |
| Server Claims-NR gate | **Still AMBER/RED** — remediation: `backend/vercel/lib/claimsAbsenceNrGate.ts` + call before finalize; **not implemented** pending founder approval of EA↔publication coupling |
| Live Claims-NR GTIN for UI | **Outstanding** — no documented commercial Claims-NR fixture in repo; UI visibility must be proven on device with a product whose `_publication.claims.publicationStatus === 'nr'` |

---

## Photo-free MVP

- Capture phase Camera/Gallery hidden when policy active.
- Packet journey Camera/Gallery gated.
- Hero Take Photo already gated by `allowTakePhoto={isConsumerPhotoEvidenceContributionAllowed()}`.
- Backend photo upload + evidence-image finalize remain **403**.

---

## Device matrix

| Platform | Status |
|----------|--------|
| UAT API probes | **PASS** (Origins admit + FM-03R admit + negatives) |
| Android clean bundle visual | **Outstanding** this tip |
| iOS TestFlight | **Outstanding** |

---

## Historical regression matrix (contribution)

| Capability | Approval | Impl / last good | Current | Classification |
|------------|----------|------------------|---------|----------------|
| Structured Origins country+claim | Pre-Nov guided UAT + P0 restore | `67f9edd` live; broken after `956886b` | **Restored** via structured allowlist | Regressed → fixed |
| Origins free text / photo | Preselected-only exclude | `956886b` | Still blocked | Intentional |
| FM-03R attestation | 15–17 Nov | `7e1f59c` | Code + UAT admit OK; UI NR fixture outstanding | Partial |
| FM-03 photo absence | Retired MVP | `956886b` | Retired | Intentional |
| Confetti on guided admit | W5-CD-01 | modal path | Working for guided; **now also FM-03R** | Gap fixed |
| Confetti on Origins | Same | modal `onSharedEvidenceAdmitted` | Path restored for structured Origins modal | Restored |
| Nutrition/Ingredients free-form | Contained | `956886b` | Hidden | Intentional / deferred catalogue |
| Packet claim catalogue-only | Deferred | never | Unavailable | Never implemented |
| Server Claims-NR | Deferred AMBER | never | Still deferred | Never implemented |
| Add/Change/Remove Origins | Founder UX | pre-containment | Origins Add/Change under structured gate | Restored |

**STOP for independent acceptance** when Android visual completes the Origins + FM-03R-NR journeys on device. Do not treat API-only Origins admit as full consumer UX acceptance without Metro/device confirmation.
