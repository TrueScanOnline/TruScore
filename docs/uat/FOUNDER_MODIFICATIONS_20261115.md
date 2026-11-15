# Founder modifications FM-01 / FM-02 / FM-03R — 15 November 2026

## Source control

| Item | Value |
|---|---|
| Branch | `build/w5-founders-native-20261114` |
| Independently verified starting HEAD (FM-03R revision) | `074061e41b2fabfce724f03131ecbe11768b55ed` |
| Earlier FM-01/02/03 work started from | `71d0f58db7bd373705324dc1b05fdd7e44337836` |
| Frozen binary-source SHA | `c113ce6ca4ec83c47423073437b2340c7c2d58d2` |
| Freeze tag | `w5-founders-uat-source-android-38-ios-64-20261114` (unchanged; resolves to `add44c656bf61cfea8d14e9539772a9e3f733573` annotated tip / binary freeze `c113ce6…`) |
| FM-01 commit | `f5ec00163ab2dbdbf90feacd008bad4dd3db2899` |
| FM-02 commit | `294b6fda83ccee63d90d84287b29ea599dae4220` |
| FM-03 commit (photo journey; superseded for Claims pillar action) | `9b81e6ee840b902883e97940f2a079cb01e1dd6f` |
| **FM-03R implementation** | `7e1f59c461254c0b059582e616968d6830fa2a57` |
| **FM-03R tests** | `d9c2e14852cf4de594deeb391662a35fdbc95b95` |
| **FM-03R TS fix** | `532c1c82960cc16f18c06355713b4a371f511e86` |
| Documentation commit | *(this commit — do not hardcode its own SHA here)* |

Worktree: `C:\TrueScan-FoodScanner-w5-unified-mvp-20261113`

## Doctrine classification (v0.3)

| Change | Class | Invariants / notes |
|---|---|---|
| FM-01 NOVA 3 icon | **GREEN** | UI-only pictogram in `ProcessingLevelModal` / `InfoModal`. No NOVA classification, scoring, copy, or colour methodology change. |
| FM-02 pillar Add-only | **AMBER** (founder-authorised) | Touches Score Highlights contribution solicitation (`INV-CO-1`–`CO-5`). Excludes `kind: 'change'` from pillar look-through only. Result card / Product Information Change paths preserved. |
| FM-03 Claims absence entry (original) | **AMBER** (founder-authorised) | Exposed photo-backed packet-absence journey. Retained in `PacketContributionModal` for post-MVP; **not** invoked by revised Claims pillar action. |
| **FM-03R photo-free attestation** | **AMBER / controlled exception** (founder-authorised 15 Nov 2026) | Changes permitted evidence basis for **packet absence only**. New source kind `packet_absence_user_attestation_v1`. Does **not** remove photo requirements for other contribution types, change Claims Machine Register / baseline arithmetic, weaken generic admission, alter `claimsRateable`, or bypass barcode / contributor / env validation. |

### Protected invariants touched (FM-03R)

- Evidence Authority admission / source finalisation (`INV-EA-*`): new dedicated attestation finalize + submit path.
- Contribution solicitation (`INV-CO-*`): Claims pillar absence no longer opens capture.
- Claims publication / Confidence: admitted user attestation may complete packet lane; `primaryUserClaimsDependence` keeps Confidence **Limited** when this is the primary publication basis.
- OFF write-back: packet absence still does not queue OFF dispatch (ingredients/nutrition only).

### Not authorised / not changed

- Photo requirements for positive packet claims, certifications, nutrition, origins, ingredients.
- Treating user attestation as photograph-verified or independently corroborated.
- Claims baseline (15) arithmetic or Machine Register.
- Other pillar publication rules.
- Production `truscoreapi` / production database.

## FM-01 — Replace NOVA 3 wrench

**Status:** Implemented; **Result-card correction** applied 15 Nov 2026 (awaiting founder visual acceptance)

**Product:** Barker’s THREE BERRY jam (`9414732208565`) — OFF `nova_group: 3` confirmed.

### Original modal work
**Commit:** `f5ec00163ab2dbdbf90feacd008bad4dd3db2899`  
InfoModal / Processing Level info uses shared `Nova3PreservedFoodIcon`.

### Corrective commit (Result card spanner → jar-and-spoon)
**Commit:** `8b2ee07670dc6470eb6483ba2e54bc0be5e746d6`

| Change | Detail |
|---|---|
| Result card (both paths) | `ResultNovaMarkIcon` replaces Ionicons `build` for NOVA 3 inside `styles.novaMark` |
| SVG | `Nova3PreservedFoodIcon` refined to preserve jar + recognisable spoon at 26px `#FFA500` |
| Info modal | Same shared component (no layout change) |
| NOVA 1 / 2 / 4 | Unchanged Ionicons leaf / create / warning |

**Local evidence (not committed):**
- `artifacts/FM01_nova3_icon_preview.html` / `artifacts/FM01_nova3_jar_spoon_preview.webp` — 26px card mock + large detail
- Prior InfoModal screenshot: `artifacts/FM01_NOVA3_ProcessingLevel_InfoModal.png`

**Emulator note (15 Nov corrective session):** After Metro was restarted with `--clear`, Expo Go repeatedly hung on “New update available, downloading…” / “Reloading…” (host logcat showed OkHttp `ProtocolException` during bundle transfer). Metro itself bundles successfully (`Android Bundled`, HTTP 200). Founder should reconnect Expo Go to `exp://10.0.2.2:8081` on the open Pixel_5 emulator and confirm the Processing Level card on Barker’s jam.

## FM-02 — Score pillar Add for missing evidence only

**Status:** Implemented + emulator regression **PASS**

| Check | Result |
|---|---|
| Body (Barker's jam, nutrition resolved) | Findings only — **no Change / Add** |
| Transparency (Barker's jam, origins unresolved) | **Add product origins** only — **no Change** |
| Claims Rated (Magnum / Cadbury-style) | May show **Add packet information**; **no Change**; absence hidden when Claims Rated |
| Card correction icons | Retained (`openContribution(..., 'change', ...)`) |

**Commit:** `294b6fda83ccee63d90d84287b29ea599dae4220` (no corrective commit).

## FM-03 — Claims “There are no claims on the packet” (original)

**Status:** Superseded for the Claims pillar action by FM-03R. Commit `9b81e6e` retained. Guided `packet_absence` capture remains in `PacketContributionModal` for future post-MVP use and is **not** opened by the Claims pillar absence button.

## FM-03R — Photo-free user-attested Claims absence (pre-MVP)

**Status:** Implemented + UAT live admission exercised on emulator

### Behaviour

Claims NR (settled, `publishedScore` null, packet unassessed, opportunity live, no prevailing absence, no contradicting positive packet/cert) → secondary **There are no claims on the packet** → direct `submitClaimsAbsenceAttestation()` → **Submitting your confirmation…** → Evidence Authority admit → reassessment → Claims Rated when methodology permits (baseline **15/25** when no other adjustments).

No camera, gallery, contribution form, claim wording, or second confirmation screen.

### Evidence source

| Field | Value |
|---|---|
| Content / source kind | `packet_absence_user_attestation_v1` |
| Provenance | Explicit user declaration bound to contributor credential + barcode |
| Confidence | Limited when primary contribution dependence applies (`primaryUserClaimsDependence`) |
| OFF write-back | None for packet absence |

### Commits

| Piece | SHA |
|---|---|
| Implementation (EA + UI) | `7e1f59c` |
| Tests | `d9c2e14` |
| TS fix | `532c1c8` |

### Files (principal)

- `src/evidenceAuthority/packetAbsenceAttestationAsset.ts` (new)
- `src/evidenceAuthority/authority.ts`
- `src/evidenceAuthority/device.ts` (`submitClaimsAbsenceAttestation`)
- `src/evidenceAuthority/contributionTrace.ts`
- `backend/vercel/api/evidence-authority.ts` (`finalize-packet-absence-attestation`)
- `backend/vercel/lib/contributionTrace.ts`
- `src/lib/scoreHighlights/highlightContributionLinks.ts`
- `src/components/ScoreHighlightsLookThroughModal.tsx`
- `app/result/[barcode].tsx`
- `src/__tests__/unit/evidenceAuthority/packetAbsenceUserAttestation.test.ts`
- `src/__tests__/unit/wave5/fm03ClaimsPacketAbsenceEntry.test.ts`
- `src/__tests__/unit/wave5/highlightContributionLinks.test.ts`

### UAT backend deployment

| Item | Value |
|---|---|
| Project | `truscoreapi-uat` only (not `truscoreapi` production) |
| Deployment ID | `dpl_8XHh7PMga7N2NFQcbywexxMUwWS8` |
| Deployment URL | `https://truscoreapi-cty0tz5t9-leightons-projects-d328c774.vercel.app` |
| Alias | `https://truscoreapi-uat.vercel.app` → above deployment |
| Source SHA at deploy | branch HEAD containing `7e1f59c` / `d9c2e14` / `532c1c8` (synced via `npm run sync-truescan-src`) |
| API probe | `finalize-packet-absence-attestation` returns `contentType: packet_absence_user_attestation_v1` with bearer credential; unauthenticated → `contributor_credential_required` |

### Emulator Journey C (Grandessa Mixed Berry Premium Jam `4088700300930`)

| Step | Result |
|---|---|
| Claims pillar NR (`—`) | **Add packet information** + supporting copy + **There are no claims on the packet** |
| Tap absence | **Submitting your confirmation…** — no camera / gallery / form |
| Admission | Claims **15/25**; overall **56 Fair**; **Limited confidence** |
| After admission | Absence action removed; Claims modal shows **15/25** |
| Rescan | Same Claims **15/25** + Limited confidence restored |

Screenshots (local `artifacts/`, not committed): `fm03r_grandessa_claims.png`, `fm03r_submitting.png`, `fm03r_after_submit.png`, `fm03r_rescan.png`.

## Automated tests

```text
npx jest src/__tests__/unit/evidenceAuthority/packetAbsenceUserAttestation.test.ts
npx jest src/__tests__/unit/wave5/fm03ClaimsPacketAbsenceEntry.test.ts
npx jest src/__tests__/unit/wave5/highlightContributionLinks.test.ts
npx jest src/__tests__/unit/evidenceAuthority/manualTextAsset.test.ts
npx jest src/__tests__/unit/evidenceAuthority/wave4aSharedAuthority.test.ts
npx jest src/__tests__/unit/claims/
npx jest src/__tests__/unit/wave5/fm02CardCorrectionPathsRemain.test.ts
npx jest src/__tests__/unit/wave5
npx tsc --noEmit
```

Outcomes: listed suites **PASS**. Typecheck **PASS** after `532c1c8`.

## Emulator / platforms

| Item | Status |
|---|---|
| AVD | `Pixel_5` / `emulator-5554` — left **OPEN** with Grandessa Result (Claims 15/25) |
| Metro | `npx expo start -c --port 8081` — left **RUNNING** |
| Expo Go | `host.exp.exponent` + UAT backend |
| iOS TestFlight | Not rebuilt; JS/TS Expo Go compatible. Native/TestFlight-specific confirmation deferred |

## Known limitations

1. Expo Go + UAT EA admission was exercised successfully for Grandessa; founder should still visually accept on this open emulator session.
2. Result card NOVA 3 mark still uses Ionicons `build`; InfoModal uses jar pictogram (verified).
3. Planet still has no authorised Add destination.
4. Frozen native tag / Android 38 / iOS 64 binaries **unchanged**.
5. Failure-path UI (backend reject) was covered by automated tests; live force-fail not re-run after successful admission on Grandessa.
6. Request **explicit founder confirmation** before declaring FM-01 / FM-02 / FM-03R accepted.

## Integration list note

`docs/uat/UAT_INTEGRATION_SHA_LIST.md` historically tracks `wave5/score-experience-20261008`. This work advances `build/w5-founders-native-20261114`. Append FM-03R SHAs without deleting accepted historical entries.
