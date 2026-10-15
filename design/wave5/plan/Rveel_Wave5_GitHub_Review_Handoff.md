# Rveel Wave 5 — consolidated GitHub review handoff

No EAS build, store submit, TestFlight upload, OTA publish, backend deploy, or release merge is authorised by this note.

Corrective-package acceptance and BC remain **open**. Certifications and Packaging remain **excluded**.

---

## 1. Review targets

| Role | Full SHA |
| --- | --- |
| Baseline B0 | `99102768b61bd6e518bb889e3ab6f01dfc3e1268` |
| **Original review checkpoint (preserve)** | `a7e8cf476911b656f67f62622fbfc77d466049b8` |
| Phone UAT + type-diagnostic replacement | `c6bb681b05dcd3473224d7117980d33950ebbe6c` |
| Docs for that replacement | `7f6c576ea825771a5e81a4fb9bcbf46165674993` |
| **Final tested candidate (regression closure)** | `51c6c77d8bbac5aa0eece830524203a35d8e457d` |
| This consolidated handoff (docs) | _(remote tip after this docs commit)_ |
| Return branch | `preserve/pre-wave5-9910276-20261008` = B0 |

Repository: https://github.com/TrueScanOnline/TruScore  
Branch: `wave5/score-experience-20261008`

**Pushed confirmation (verified with `git fetch`):** `a7e8cf4`, `c6bb681`, and `7f6c576` are on `origin/wave5/score-experience-20261008`. The final tested and docs SHAs above are filled after the commits in this consolidated pass; remote HEAD is the documentation tip.

Focused comparison (phone UAT replacement vs original checkpoint):  
https://github.com/TrueScanOnline/TruScore/compare/a7e8cf476911b656f67f62622fbfc77d466049b8...c6bb681b05dcd3473224d7117980d33950ebbe6c

Final tested candidate vs original checkpoint:  
https://github.com/TrueScanOnline/TruScore/compare/a7e8cf476911b656f67f62622fbfc77d466049b8...51c6c77d8bbac5aa0eece830524203a35d8e457d

B0 → final tested candidate:  
https://github.com/TrueScanOnline/TruScore/compare/99102768b61bd6e518bb889e3ab6f01dfc3e1268...51c6c77d8bbac5aa0eece830524203a35d8e457d

Reviewers who want only tested code: check out `51c6c77d8bbac5aa0eece830524203a35d8e457d` (includes `c6bb681` plus §10.2 oracle, §10.4 allowlist cleanup, and R-2/R-4/R-9/R-10 evidence).

---

## 2. Behavioural significance of the follow-up fixes

The follow-up is **not** type-only. Classification and behavioural evidence:

### Snapshot null guard — GREEN (fail-closed Result reassessment)

- **Change:** `onSharedEvidenceAdmitted` returns when `!snapshot` before reading `generatedAt` or calling `calculateTrustScore`.
- **Control:** Result contribution acknowledgement / reassessment latch.
- **Before:** a null snapshot would throw when reading `snapshot.generatedAt`, leaving reassessment undefined.
- **After:** marks `result_applied: none` and returns. No score recalculation without an authoritative snapshot.
- **Evidence:** type of `onSharedEvidenceAdmitted?: (snapshot: SharedEvidenceSnapshot | null, …)` in `PacketContributionModal`; guard in `app/result/[barcode].tsx`.

### Preview `assetId` — GREEN (evidence-image projection contract)

- **Change:** Preview carries `assetId` (same value as `tempKey` / `accepted.assetId`) so it satisfies `EvidenceSurfaceImage`.
- **Control:** which contribution photos are visible on the open surface (`visibleEvidenceImages`).
- **Behaviour:** capture already set `tempKey: accepted.assetId`. Filtering still uses `journeyId` / `entryContext`. Retake still keys on `tempKey`. Session asset matching still uses `preview.tempKey === asset.assetId`.
- **Evidence:** contribution closure / Wave 4A image-asset tests remain green; projection contract in `src/evidenceImage/projection.ts`.

### Support narrowing (`derivedAssetId`) — GREEN (provenance for region crops)

- **Change:** bind `const support = unit.support` before resolving region derived assets.
- **Control:** evidence fact provenance (`derivedAssetId`, region box) for `coverage: 'region'`.
- **Behaviour:** same runtime values; TypeScript can see `derivedAssetId` only on the region member. Whole-image coverage still omits `derivedAssetId`.
- **Evidence:** `wave4aSharedAuthority` region / crop cases pass.

### Removed nutrient `unknown` branch — GREEN (dead path after v0.2)

- **Change:** remove `productClass === 'unknown' → servingUsableForClass = false`.
- **Control:** large-portion / per-serve usability in `assessGovernedNutrients`.
- **Behaviour:** `simulateV02FoodDrinkClass` returns only `'food' | 'drink'`. The unknown branch was unreachable. Food/drink unit mismatch handling is unchanged.
- **Evidence:** nutrition / rateability suites that exercise Food/Drink classification remain green.

### `packet_claims` community-verification union — GREEN type alignment with live Wave 4A behaviour (AMBER note on policy shape)

- **Change:** `getCommunityVerificationPolicy` / `getCommunityVerificationThresholds` and `buildEvidenceId` accept `packet_claims`. Packet claims continue to use the **certifications** threshold shape (two disputes → `review_required`, no automatic withdrawal). Documented that `packetClaims` policy has no own dispute slice yet.
- **Control:** confirm / dispute / evidence-id identity for packet claims.
- **Behaviour:** matches prior JavaScript runtime (non-origins domains already fell through to certifications thresholds). Lifecycle early-return for `packet_claims` was **attempted and reverted** because it broke Wave 4A disputes.
- **Evidence:** `wave4aSharedAuthority` — “rejects self-confirmation and marks review_required after two disputes without withdrawing” **passes**. Contribution closure and integration closure pass.
- **Open for review:** whether packet claims should eventually own an explicit dispute slice instead of inheriting certifications thresholds (question below). Not a silent behaviour change in this follow-up.

### Phone UAT designation — GREEN (configuration)

- **Change:** `WAVE5_PHONE_UAT_EAS_PROFILES`, agreement assert, preflight extension. Legacy flag profiles named but not deleted.
- **Behaviour:** no consumer runtime change; rejects phone UAT profiles whose backend and authority disagree.

---

## 3. Regression evidence

### Compact suite map (§10.3)

| Suite | Status at `51c6c77` | Notes |
| --- | --- | --- |
| **R-1** Pillar scores | Pass (body/planet/ethics/open + golden/phase6 earlier) | |
| **R-2** Ledger | **Pass** — `expectPillarLedgerReconciles` in body/planet/ethics/open pillar suites | |
| **R-3** NR/Rated/Checking | Pass — `wave3Rateability.fixtures`, `wave3UatNarrowCorrection`, `resultPublicationLoadGuard` | |
| **R-4** Confidence | **Pass** — `sourceQuality.test.ts` + rateability confidence fixtures | |
| **R-5** Overall publication | **Covered** by rateability O-01…O-04 and engine wiring (`publicationSettled=false` → checking) | Not omitted |
| **R-6** Prevailing / withdrawal | **Covered** by `wave4aSharedAuthority` (supersede, withdraw, no-resurrection, UAT/production env) | Not omitted |
| **R-7** Contribution opportunity | Pass — consumer journeys / contribution closure / integration | |
| **R-8** Admission | Pass — Wave 4A shared authority (25) | |
| **R-9** Entity / chaining | **Pass** — `chainingArchitectureBoundary`, `resolveSharedIdentityContext`, workstream A scaffold | |
| **R-10** Signals | **Pass** — `signalRenderMapping`, `scanResultPresentation`, `na022`, Asset v0.2/v0.3, result isolation, Wave 3 chaining integration | |
| **R-11** Share | Pass — NA-018 + C-1 share framing | |
| **R-12 / R-13** | **Excluded** | Certifications / Packaging pending |

Latest closed batch: **22 suites / 340 tests** including new §10.2 oracle and updated §10.4 gate. `tsc --noEmit` exit **0**. Preflight Asset + phone UAT agreement: **pass**.

### §10.2 governed-outcome oracle

New file: `src/__tests__/unit/wave5/governedOutcomeOracle.section10_2.test.ts`.

- Deterministic fixtures via `calculateTruScore` / publication / share / contribution actions.
- **B0-invariant** section: checking latch, Body NR/Rated shapes, Overall NR when any pillar NR.
- **Approved C-1–C-4** section: Checking/NR never paint or share an overall number; Highlights use published pillar scores only; contribution invitations stay false until settled.
- Does **not** regenerate a golden blob to force a pass; assertions name the approved corrective outcomes explicitly.

### §10.4 guard — remaining limitations (precise)

Still a **partial** gate. After this follow-up:

**Still covered:** forbidden-token counts (minus named §8 dormant TruScoreCards), score-adjacent `??0`/`||0` on one line, direct `app/` bodyShadow / `features/product` strings, MVP gates, Palm Oil flag, H-13 file presence.

**Allowed hits retained (justified):**

| File | Count | Why kept |
| --- | --- | --- |
| `app/result/[barcode].tsx` | 4 | Orchestration: `trust_score_breakdown` when assembling consumer `TruScoreResult`; `ecoscore_grade` as one presence check among many. Not score-band colour. |
| `TrustScoreInfoModal.tsx` | 1 | Methodology prose mentioning `ecoscore_grade`. Not a consumer colour read. |

**Removed from ALLOWED_HITS (obsolete for live presentation):**

- `src/features/product/components/TruScoreCard.tsx`
- `src/features/product/cards/TruScoreCard/TruScoreCard.tsx`

Doctrine §8 lists the legacy product feature tree as unreachable. Those paths are now `DORMANT_FORBIDDEN_EXCLUSIONS` (still must exist; must not re-enter the live allowlist).

**Still not covered by §10.4:**

- Full §5.1 forbidden-import allowlist across presentation.
- Transitive dormant reachability (e.g. ShareModal → ShareContentBuilder ecoscore branch).
- Score defaults via intermediate variables / other lines; `src/utils` / `src/lib` (e.g. shareAnalytics `truScore || 0`).
- H-13 assertion content (presence only).
- `.breakdown.` used for display; S28 as a separate exclusion.

---

## 4. Configuration evidence (phone UAT)

**Designated profiles only:** `uat-dynamic-signals-ios`, `uat-dynamic-signals-android`.

| | iOS UAT | Android UAT |
| --- | --- | --- |
| Profile | `uat-dynamic-signals-ios` | `uat-dynamic-signals-android` |
| Distribution | store (TestFlight path) | internal APK |
| Backend | `https://truscoreapi-uat.vercel.app` | same |
| Authority env | `uat` | `uat` |
| Live authority GET | `{"success":true,"authorityEnv":"uat"}` | same host |
| Asset / recall / skeleton | 1 / 1 / 0 | 1 / 1 / 0 |
| Score diagnostics | 1 | 1 |
| Store release | 0 | 0 |
| Build identity in profile | iOS buildNumber **60** | Android versionCode **34** |
| Package / bundle | `com.truescan.foodscanner` | same |
| Updates | disabled; no runtimeVersion; no channel; no update URL | same |

**Build-number suitability:** last founder contribution release markers on this branch used iOS **59** / Android **33** (`da8a474`). Profile values **60** / **34** are the next increments in-repo. Whether those numbers are free in App Store Connect / Play Console is **unverified** (account evidence unavailable). Do not treat in-repo next-number as store confirmation.

**Legacy (not phone-testing):** `uat-ios-flag-off` / `uat-ios-flag-on` (recall path 0, production backend).  
**Production profiles:** not repurposed. Production `https://truscoreapi.vercel.app/api/evidence-authority` remains **NOT_FOUND** — recorded as a **production-release** issue. It does **not** block correctly configured UAT phone testing.

---

## 5. Founder authorisation (destination + Mid)

Recorded founder instructions in the Wave 5 working session (editorial passes after `d0b0166`):

1. **Score / info → Data limitations:** “RVEEL SCORE card = make the 'score' and/or the '? question mark' button to be a link to be same as the INCOMPLETE PRODUCT DATA card.”  
   Prior behaviour at `d0b0166`: info glyph opened W3-S27 (`TruScoreInfoModal` via `setTruScoreModalVisible(true)`). Incomplete product data already used `setS26OpenRequestKey`.  
   Current: score `onScorePress` and info glyph both use `setS26OpenRequestKey`.

2. **LEVEL “Mid”:** “change the LEVEL displayed as an orange colour Moderate to read as Mid” (colour/location/size unchanged). Confidence “Moderate confidence” unchanged.  
   Implemented in `en.json` `levelBadgeMed` / `levelBadgeModerate` and NutritionTable / NutritionDetailsModal English fallbacks.

Restoration is not recommended unless founders reverse those instructions.

---

## 6. Remaining material issues

1. Corrective-package **acceptance** and **BC** still open (C-1–C-4 tests pass; founders have not closed the package).
2. §10.4 remains partial (limitations above). Orchestration allowlist entries in Result and TrustScoreInfoModal prose remain.
3. Production evidence-authority route missing (production-release blocker, not UAT phone blocker).
4. `development` EAS profile still expects `uat` authority against the production backend default (not a phone-testing profile).
5. Result acknowledgement after admitted evidence still unverified (no evidence submitted).
6. Packet claims still inherit certifications community-verification thresholds — confirm or schedule an explicit dispute slice.
7. Certifications / Packaging suites excluded.
8. Build creation pending review authorisation. ASC/Play free build numbers unverified.

---

## 7. Evidence required for corrective acceptance / BC

Per Master Plan §3 / §15 and doctrine §14:

- Founder consolidated review that accepts each C-1–C-4 required outcome independently.
- Record the accepted package full SHA as **BC** (presentation comparison checkpoint), keeping intended corrective differences from B0.
- Do **not** treat `d5a7955` (SCR-RESULT visual only), `a7e8cf4`, `c6bb681`, or this docs tip as BC.
- Pending certification and packaging suites must not be reported as passed when recording BC.

---

## 8. Questions for independent review

1. Accept `c6bb681` as the tested replacement for the original `a7e8cf4` checkpoint while keeping `a7e8cf4` in history?
2. Confirm iOS 60 / Android 34 once ASC/Play availability is verified.
3. Confirm packet_claims → certifications threshold shape, or require an explicit dispute slice before BC?
4. Confirm Result orchestration allowlist (4) and TrustScoreInfoModal prose (1) may remain until a later AMBER cleanup?
5. Authorise UAT native builds only after this review — still no build from this handoff.
