# Founder modifications FM-01 / FM-02 / FM-03 — 15 November 2026

## Source control

| Item | Value |
|---|---|
| Branch | `build/w5-founders-native-20261114` |
| Starting SHA | `71d0f58db7bd373705324dc1b05fdd7e44337836` |
| Frozen binary-source SHA | `c113ce6ca4ec83c47423073437b2340c7c2d58d2` |
| Freeze tag | `w5-founders-uat-source-android-38-ios-64-20261114` (unchanged) |
| FM-01 commit | `f5ec00163ab2dbdbf90feacd008bad4dd3db2899` |
| FM-02 commit | `294b6fda83ccee63d90d84287b29ea599dae4220` |
| FM-03 commit | `9b81e6ee840b902883e97940f2a079cb01e1dd6f` |
| Evidence document commit | `3082a7096e575a799976750436635a8a33f8055a` |
| Follow-up (fill final HEAD) | `b7351effec6def37ca4d83cec78d2fac7b176904` |
| Final integrated HEAD | `b7351effec6def37ca4d83cec78d2fac7b176904` (will move if another docs fix lands) |

Worktree: `C:\TrueScan-FoodScanner-w5-unified-mvp-20261113`

## Doctrine classification (v0.3)

| Change | Class | Invariants / notes |
|---|---|---|
| FM-01 NOVA 3 icon | **GREEN** | UI-only pictogram in `ProcessingLevelModal` / `InfoModal`. No NOVA classification, scoring, copy, or colour methodology change. |
| FM-02 pillar Add-only | **AMBER** (founder-authorised) | Touches Score Highlights contribution solicitation (`INV-CO-1`–`CO-5`). Excludes `kind: 'change'` from pillar look-through only. Result card / Product Information Change paths preserved. |
| FM-03 Claims absence entry | **AMBER** (founder-authorised) | Exposes existing packet-absence journey (`INV-CO-*`, `INV-EA-*`). Does **not** change `claimsRateable`, Claims Machine Register, certification eligibility, benchmark publication, or hardcode `15`. |

### Methodology conflict reported (no code change)

Existing Claims methodology may still become Rated via substantive benchmark / certification routes even without packet evidence. Founder principle prefers packet evidence or admitted absence to reveal Claims; that broader reinterpretation of `claimsRateable` remains **out of scope** and would need separate architectural approval. FM-03 only routes the existing absence workflow.

### Planet contribution (future)

Planet still has no authorised live contribution destination. No inert Add button was invented. A future Planet packaging / environment contribution route needs founder architectural approval.

## FM-01 — Replace NOVA 3 wrench

**Status:** Implemented

**Replacement icon:** `Nova3PreservedFoodIcon` — SVG jar/tin with vegetable elements in `#FFA500`, via `react-native-svg`. `InfoModal` accepts optional `customIcon` while retaining Ionicons for NOVA 1/2/4.

**Files:**
- `src/components/icons/Nova3PreservedFoodIcon.tsx` (new)
- `src/components/ProcessingLevelModal.tsx`
- `src/components/InfoModal.tsx`
- `src/__tests__/unit/wave5/nova3PreservedFoodIcon.test.ts` (new)

**Commit:** `f5ec00163ab2dbdbf90feacd008bad4dd3db2899`

## FM-02 — Score pillar Add for missing evidence only

**Status:** Implemented

Pillar look-through no longer emits Change nutrition / ingredients / origins / packet information. Add actions remain gated by settled publication + live S26 opportunities + unresolved substantive lanes. Card correction `openContribution(..., 'change', ...)` paths remain in `app/result/[barcode].tsx`.

**Files:**
- `src/lib/scoreHighlights/highlightContributionLinks.ts`
- `src/components/ScoreHighlightsLookThroughModal.tsx` (comment)
- `src/__tests__/unit/wave5/highlightContributionLinks.test.ts`
- `src/__tests__/unit/wave5/fm02CardCorrectionPathsRemain.test.ts` (new)

**Commit:** `294b6fda83ccee63d90d84287b29ea599dae4220`

## FM-03 — Claims “There are no claims on the packet”

**Status:** Implemented

Claims pillar modal can show secondary action **There are no claims on the packet** beneath Add packet information when packet lane unassessed, opportunity live, guided contribution on, no prevailing admitted absence, and no contradicting positive packet/cert projection. Opens `PacketContributionModal` with `entryIntent: 'packet_absence'` (starts at capture; does not auto-admit). Submission continues through Evidence Authority.

**Files:**
- `src/lib/scoreHighlights/highlightContributionLinks.ts`
- `src/components/ScoreHighlightsLookThroughModal.tsx`
- `src/components/PacketContributionModal.tsx`
- `app/result/[barcode].tsx`
- `src/__tests__/unit/wave5/fm03ClaimsPacketAbsenceEntry.test.ts` (new)
- `src/__tests__/unit/wave5/highlightContributionLinks.test.ts`

**Commit:** `9b81e6ee840b902883e97940f2a079cb01e1dd6f`

## Automated tests

Commands run (all passed unless noted):

```text
npx jest src/__tests__/unit/wave5/nova3PreservedFoodIcon.test.ts
npx jest src/__tests__/unit/wave5/highlightContributionLinks.test.ts
npx jest src/__tests__/unit/wave5/fm02CardCorrectionPathsRemain.test.ts
npx jest src/__tests__/unit/wave5/fm03ClaimsPacketAbsenceEntry.test.ts
npx jest src/__tests__/unit/contribution/consumerIntegrationJourneys.test.ts
npx jest src/__tests__/unit/contribution/contributionJourneyCorrections.test.ts
npx jest src/__tests__/unit/contribution/founderUatCorrections.test.ts
npx jest src/__tests__/unit/claims/wave4a4Closure.test.ts
npx jest src/__tests__/unit/evidenceAuthority/wave4aSharedAuthority.test.ts
npx jest src/__tests__/unit/lib/rateability/
npx jest src/__tests__/unit/wave5/founderUi09.test.ts
npx jest src/__tests__/unit/config/mvpFeatureGates.test.ts
npx tsc --noEmit
```

Outcomes: targeted suites green (including Wave 4A shared authority absence → assessed-neutral **15/25** fixture). Typecheck: **pass** (exit 0). No pre-existing failures attributed to these commits.

## Emulator testing

| Item | Status |
|---|---|
| AVD | `Pixel_5` (`emulator-5554`) — left **OPEN** |
| Metro | `npx expo start -c --port 8081` with `.env.development` (UAT EA, Dynamic Signals Asset, guided contribution on) — left **RUNNING** |
| Expo Go | `host.exp.exponent` |
| Left visible for founder | Cadbury Favourites Result → **Claims** pillar modal with **Add packet information** + **There are no claims on the packet** |

### Journey outcomes (device screenshots under local `artifacts/fm_qa_*.png`, not committed)

| Journey | Result |
|---|---|
| FM-02 Body (Cadbury Dairy Milk, nutrition resolved) | Modal shows findings only — **no Change / Add** |
| FM-02 Body (Mi goreng, nutrition unresolved) | **Add nutrition** shown; no Change |
| FM-02 Transparency (Cadbury Dairy Milk, origins unresolved) | **Add product origins** shown; no Change |
| FM-02/03 Claims (Cadbury Dairy Milk / Favourites, packet unassessed) | **Add packet information** + **There are no claims on the packet** (secondary outline); no Change |
| FM-03 absence entry | Opens Packet information capture with “Confirming no relevant claims or certifications” guidance; does **not** auto-admit |
| FM-01 NOVA 3 pictogram | History products exercised were **NOVA 4**. Icon mapping verified by unit tests + source. Founder: open any NOVA 3 product → Ingredients → Processing Level → info → confirm jar pictogram in `#FFA500` |
| Card correction icons | “Contribute or correct nutrition information” still present on Result nutrition card (Mi goreng) |

### Android / iOS verification

| Platform | Status |
|---|---|
| Android emulator (Expo Go) | **OPEN** with RVEEL on Claims modal — ready for founder observation |
| iOS TestFlight | Not re-built; no new native binary. JS/TS changes are Expo Go compatible; iOS visual confirmation deferred to existing TestFlight / next entitled build |

## Known limitations

1. FM-03 does not alter Claims rateability via benchmark/cert routes (reported above).
2. Planet still has no Add destination.
3. Full end-to-end UAT Evidence Authority absence admission on a live product should be confirmed by founder during observation (photo + confirm + admit). Automated Wave 4A fixture already proves admitted absence → assessed-neutral **15/25**.
4. Frozen native build tag / binaries (Android 38 / iOS 64) are **not** updated; these commits are source-branch advances for Expo Go / next entitled build.
5. Local history products used for visual QA were predominantly NOVA 4; FM-01 icon is covered by automated source contract + founder step for a NOVA 3 barcode.

## Integration list note

`docs/uat/UAT_INTEGRATION_SHA_LIST.md` historically tracks `wave5/score-experience-20261008`. This work advances `build/w5-founders-native-20261114`. Rows for FM-01–FM-03 are appended without deleting accepted historical entries.
