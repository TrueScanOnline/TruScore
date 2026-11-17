# Packet Claims — FM-03 / FM-03R entry reconciliation

**Date:** 17 November 2026  
**Branch:** `build/w5-founders-native-20261114`  
**Worktree:** `C:\TrueScan-FoodScanner-w5-unified-mvp-20261113`  
**Starting remote HEAD:** `598910ee90c2af274d1544780c2fb37462d4350c`  
**Implementation SHA:** *(stamped at push)*  
**Doctrine:** **AMBER** (founder-authorised) — additional Result UI entry to existing FM-03R attestation without broadening eligibility. Footer hold/NR report fixes are **GREEN**.

## Root cause of the missing button

The empty Packet Claims **Add packet claims** control previously called only:

`openContribution('packetClaims', 'add', …)` → `PacketContributionModal` with `entryIntent: 'default'`.

That is the **FM-03 photo-supported** journey. Its in-modal absence control stays hidden until `targeted.length > 0` (pack photo). Emulator Camera black therefore hid the older absence confirmation.

Separately, **FM-03R** (photo-free) already existed as:

- Label: **There are no claims on the packet**
- Entry: Claims pillar Score Highlights (`claims_absence_attestation`)
- Submit: `submitClaimsAbsenceAttestation()` / `submitClaimsAbsenceAttestationFromPillar()`

The card Add path never exposed FM-03R. That was the deeper discoverability defect — not only the black camera.

## FM-03 vs FM-03R

| | FM-03 (photo) | FM-03R (photo-free) |
|---|---|---|
| Label | In-modal: “I checked the pack…” | **There are no claims on the packet** |
| Evidence | Pack image + affirmation | `packet_absence_user_attestation_v1` |
| Photo | Required | Not required |
| Eligibility | Empty packet seed; modal gate on photo | Claims **NR**, no published Claims score, packet lane not assessed, live S26, Packet Add, no admitted absence, no contradictory packet evidence, guided contribution ON |
| Prior Result entry | Dormant / modal-only | Pillar look-through only |

## What changed in Add Packet Claims

Tapping **Add packet claims** on an eligible empty card now opens choice sheet `packetClaimsAdd`:

1. **Add a claim or certification** → existing guided form (Camera / Gallery / type).  
2. **There are no claims on the packet** → only when `claimsPacketAbsencePillarEligible` is true; revalidates then calls shared `submitClaimsAbsenceAttestationFromPillar` (same EA path as pillar).  
3. **Confirm absence with a pack photo** → `openContribution(..., 'packet_absence')` when `packetClaimsPhotoAbsenceDiscoverable`; explains photo is required before confirmation; opening alone does not admit.

Diagnostics helper: `claimsPacketAbsencePillarIneligibilityReason()` (exact gate code, no broadened rules).

### Footer carry-forward (GREEN)

- Hold-specific report (`fixedConcern=administrative_hold_or_review`) only when `publicationHold.status === 'held'`. Pending/unavailable are **not** described as confirmed administrative review.  
- Loaded settled **NR/Rated** products retain Report even if `truScore` is null.

## Founder test GTIN — actual Claims state

**GTIN:** `9414732208565` (Barker’s THREE BERRY jam)  
**Runtime:** Expo Go + Metro from this worktree (`.env.development`: guided contribution=1, WP09=1, EA env=uat)

Governed snapshot from live Metro `TRUSCORE_ANALYSIS_JSON` (non-sensitive):

| Field | Value |
|---|---|
| Overall | rated / published 60 |
| Claims publicationStatus | **rated** |
| Claims publishedScore | **15** |
| Packet lane | **assessed** |
| Packet coverage | complete |
| Admitted OFF claim example | “No gluten” (assessment); card empty-state can still appear when consumer projection has no governed lines |
| FM-03R | **Not eligible** — `claims_status_rated` / `claims_published_score_present` / `packet_lane_assessed` |
| Choice sheet observed | Add claim/cert + photo-supported FM-03; **no** FM-03R button (correct) |

**Architectural boundary:** Expanding photo-free FM-03R to Claims **Rated** (or other states) is a separate AMBER/RED methodology / Evidence Authority assessment and was **not** implemented.

**Second fixture:** `4088700300930` Mixed Berry Premium Jam — also Claims **rated** / packet **assessed** in this cache (Ethics 15). Not an FM-03R live-admit candidate in this session.

Live FM-03R Evidence Authority admission was therefore **not** executed against these Rated fixtures (would violate preserved eligibility). Unit/integration suites cover NR admit behaviour.

## Android screenshots (untracked)

`artifacts/packet-claims-fm03-fm03r-20261117/`

| File | Observation |
|---|---|
| `05_packet_add.png` | Empty Packet Claims + Add packet claims |
| `06_choice_sheet.png` | Choice sheet: add claim/cert + photo-supported absence; FM-03R correctly absent for Claims Rated |

## WP09 status

Expo Go entitled ON via `.env.development`. Store defaults remain OFF. No fabricated counts. Thumbs after admitted absence still depend on Change eligibility + server; not re-exercised on Rated fixtures here.

## Tests

| Suite | Result |
|---|---|
| `packetClaimsFm03Fm03rEntry.test.ts` | PASS |
| `fm03ClaimsPacketAbsenceEntry` / `highlightContributionLinks` / `packetAbsenceUserAttestation` | PASS |
| wave5 + communityAgreement + contribution + result batch | **418 PASS** |
| Public release | remains **BLOCKED** |

## Remaining unresolved architectural question

Should photo-free FM-03R ever apply when Claims is **Rated** but the consumer Packet Claims card is empty (e.g. OFF-assessed claims not projected as governed card lines)? That would change methodology/eligibility and requires explicit founder architectural approval — **not done here**.

## Protected invariants

No scoring, Rateability, Confidence derivation, EA admission semantics broadening, Signals, Account reopen, or legal-gate flips. `publicReleaseStatus: BLOCKED`; 15 requirements PENDING.
