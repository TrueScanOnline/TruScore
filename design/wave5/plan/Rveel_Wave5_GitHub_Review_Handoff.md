# Rveel Wave 5 — GitHub review handoff

This note is documentation only after the tested follow-up commit. It does not change the tested source.

| Role | SHA |
| --- | --- |
| Baseline B0 | `99102768b61bd6e518bb889e3ab6f01dfc3e1268` |
| **Pinned submitted review target** | `a7e8cf476911b656f67f62622fbfc77d466049b8` |
| Tested follow-up candidate (code) | `c6bb681b05dcd3473224d7117980d33950ebbe6c` |
| Documentation commit for this note | _(see section “Follow-up SHAs” after the docs push)_ |
| Return branch | `preserve/pre-wave5-9910276-20261008` at the same B0 SHA |

Repository: https://github.com/TrueScanOnline/TruScore

Branch: `wave5/score-experience-20261008`

Pinned comparison (submitted review, docs-only tip on tested `5b33ab9`): https://github.com/TrueScanOnline/TruScore/compare/99102768b61bd6e518bb889e3ab6f01dfc3e1268...a7e8cf476911b656f67f62622fbfc77d466049b8

No EAS build, store submit, TestFlight upload, OTA publish, backend deploy, or release merge was started for this handoff or the follow-up.

Corrective-package acceptance and BC remain open until the consolidated review closes them.

---

## Follow-up SHAs

| Role | Full SHA |
| --- | --- |
| Tested follow-up code | `c6bb681b05dcd3473224d7117980d33950ebbe6c` |
| Documentation-only update of this note | _(branch tip after this docs commit)_ |

Compare the tested follow-up with B0: https://github.com/TrueScanOnline/TruScore/compare/99102768b61bd6e518bb889e3ab6f01dfc3e1268...c6bb681b05dcd3473224d7117980d33950ebbe6c

The remote branch tip after the docs commit is the documentation SHA. Reviewers who want only the tested code should check out `c6bb681b05dcd3473224d7117980d33950ebbe6c`.

**Pinned submitted review target remains** `a7e8cf476911b656f67f62622fbfc77d466049b8`.

---

## 1. Phone-testing configuration

**Designated phone-testing profiles** (do not repurpose production / preview / production-apk):

| Profile | Platform | Distribution | Backend | Authority env | Asset | Recall | Skeleton UAT | Score diagnostics | Store release | Build identity |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `uat-dynamic-signals-ios` | iOS | store (TestFlight path) | `https://truscoreapi-uat.vercel.app` | `uat` | 1 | 1 | 0 | **1** | 0 | iOS build number **60** |
| `uat-dynamic-signals-android` | Android | internal APK | `https://truscoreapi-uat.vercel.app` | `uat` | 1 | 1 | 0 | **1** | 0 | Android versionCode **34** |

Shared resolved identity: app Rveel, package/bundle `com.truescan.foodscanner`, version `10.0.0`, scheme `truescan`. Updates disabled (`enabled: false`, `checkAutomatically: NEVER`). No `runtimeVersion`, no update channel, no update URL.

Native integrations on these profiles: Expo Camera (via plugins), Qonversion keys from EAS/env when present (Expo Go still lacks the native module). Score diagnostics are entitled (`EXPO_PUBLIC_SCORE_DIAGNOSTICS=1`).

**Backend and authority agree on UAT for both profiles.** Asserted by `assertWave5PhoneUatProfilesAgree` and `npm run preflight:mvp-release-asset`. Live GET `https://truscoreapi-uat.vercel.app/api/evidence-authority` returns `{"success":true,"authorityEnv":"uat"}`.

**Legacy / unused for Wave 5 phone testing** (flag only; not deleted):

| Profile | Why not phone-testing |
| --- | --- |
| `uat-ios-flag-off` | Recall path forced **0**; production backend; build number 29. Flag-comparison legacy. |
| `uat-ios-flag-on` | Recall path forced **0**; production backend; build number 30. Flag-comparison legacy. |
| `production`, `preview`, `preview-apk`, `production-apk` | Production backend default; `authorityEnv: production`. Production `/api/evidence-authority` is **NOT_FOUND**. Do not repurpose for phone UAT. Do not deploy production services for this follow-up. |
| `development` | Dev client; expects `authorityEnv: uat` while backend stays on the production default — **backend and authority disagree**. Not a phone-testing target. |

Constants live in `src/config/mvpReleaseDynamicSignalsAsset.ts`: `WAVE5_PHONE_UAT_EAS_PROFILES`, `WAVE5_LEGACY_EAS_PROFILES`, `WAVE5_UAT_BACKEND_HOST`, `WAVE5_UAT_AUTHORITY_ENV`.

---

## 2. Type diagnostics (source-backed)

`npx tsc --noEmit` at the follow-up candidate: **exit 0**.

| Prior diagnostic | Classification | Conclusion / fix |
| --- | --- | --- |
| `TruScoreResult` not in scope (`app/result/[barcode].tsx`) | GREEN | Missing type import. Added `import type { TruScoreResult }`. |
| `snapshot` possibly null on `onSharedEvidenceAdmitted` | GREEN | Callback type allows null. Early return when `!snapshot` before reading `generatedAt`. |
| Preview vs `EvidenceSurfaceImage` in `PacketContributionModal` | GREEN | Preview lacked `assetId`. Captures already use `accepted.assetId` as `tempKey`. Added `assetId` on Preview at creation so the type matches the projection contract without a cast. |
| `_publication` missing on `Product` | GREEN | Field lived only on `ProductWithTrustScore` while contribution helpers already took `Product` and read `_publication`. Moved the optional field onto `Product`. No scoring change. |
| `packet_claims` vs community-verification union | GREEN type + documented mapping | Wave 4A tests prove packet claims accept confirm/dispute (two disputes → `review_required`). Expanded `getCommunityVerificationPolicy` / `getCommunityVerificationThresholds` to accept `packet_claims` and keep the existing certifications threshold shape. Documented that `packetClaims` policy has no own dispute slice yet. Expanded `buildEvidenceId` domain to include `packet_claims` to match live `submitGovernedEvidence`. |
| `derivedAssetId` on `SupportCoverage` | GREEN | Narrowed `support` before the `find` callback so the `region` member is visible. |
| `gtin_brand_links.csv` index on workstream A loader | GREEN | Local `rowsByFile` typed as `WorkstreamAFileName \| RetiredWorkstreamAFileName`, matching the return type. |
| `productClass === 'unknown'` | GREEN | v0.2 determinant returns only `food \| drink`. Removed the unreachable `unknown` branch. |

No `@ts-ignore` / `as any` suppressions were added to silence these.

---

## 3. Interaction and copy provenance

### Score / info → Data limitations

**Authorised.** Founder instruction (remedial editorial pass): make the score and/or the NR question mark open the same destination as the Incomplete product data card.

At `d0b0166` (before that pass): the info glyph beside “Rveel Score” called `setTruScoreModalVisible(true)` (W3-S27 / `TruScoreInfoModal`). Incomplete product data already used `setS26OpenRequestKey`.

At `5b33ab9` / pinned `a7e8cf4`: both the score press (`onScorePress`) and the info glyph call `setS26OpenRequestKey`. `TruScoreInfoModal` remains mounted; nothing sets `truScoreModalVisible` true from those controls.

**Restoration not recommended** unless founders reverse that instruction. Prior behaviour is recoverable from `d0b0166`.

### Nutrient level “Mid”

**Authorised.** Founder instruction (further editorial pass): change the orange LEVEL word from “Moderate” to “Mid”; keep colour, location, and size. Confidence “Moderate confidence” must stay.

Implemented in `en.json` (`levelBadgeMed` / `levelBadgeModerate` → `Mid`) and NutritionTable / NutritionDetailsModal English fallbacks. French/Spanish unchanged. Internal level remains `'moderate'`. Contract test asserts Mid.

**Restoration not recommended** unless founders reverse that instruction.

---

## 4. Review coverage vs doctrine §10.2–§10.4

### Completed evidence (at follow-up tested SHA)

| Gate | Status |
| --- | --- |
| §10.4 consumption guards (`consumptionGuards.section10_4.test.ts`) | Pass. Partial gate: forbidden reads, score-adjacent `?? 0`/`|| 0`, dormant reactivation from `app/`, MVP gates, Palm Oil off, H-13 file presence. Known-hit allowlist unchanged. |
| §10.3 R-1 anchors (scan golden + phase 6) | Pass |
| §10.3 R-3 / R-5 anchors (rateability UAT narrow + publication load guard) | Pass |
| §10.3 R-7 / contribution closure + integration | Pass |
| §10.3 R-8 Wave 4A shared authority | Pass (25 tests) |
| §10.3 R-11 NA-018 share authority | Pass |
| C-1–C-4 corrective package behavioural tests | Pass (not founder acceptance) |
| Nutrition presentation Mid + contribution call shape | Pass (H-13-style assertion updated to live add/change calls; behavioural replacement named in the commit) |
| Phone UAT profile backend/authority agreement | Pass |
| `tsc --noEmit` | Pass (exit 0) |
| `expo-doctor` | Pass at pinned review (16/16); not re-blocking for this follow-up |
| Live UAT authority identity | `authorityEnv: "uat"` |

### Outstanding / partial

| Gap | Detail |
| --- | --- |
| §10.2 governed-outcome oracle | No full G-byte comparison harness between B0 and candidate for the full fixture matrix. Compact suites below are used instead. |
| §10.3 R-2 Ledger | Not run in this follow-up (`expectPillarLedgerReconciles` cohort). |
| §10.3 R-4 Confidence (`sourceQuality.test.ts`) | Not run in this follow-up. |
| §10.3 R-6 / full R-8 depth | Wave 4A shared authority pass; broader `evidenceAuthority/*.test.ts` not exhaustively re-run. |
| §10.3 R-9 Entity / chaining | Not run in this follow-up. |
| §10.3 R-10 Signals | Not run in this follow-up (Asset preflight only). |
| §10.3 R-12 / R-13 | Certifications and Packaging **PENDING**. Excluded. Not reported as passed. |
| §10.4 forbidden imports from RED zones beyond current partial gate | Partial only. Does not prove the full §5.1 interface allowlist for every presentation file. |
| §10.4 allowlist removal after C-1–C-3 | Still deferred. Known hits remain allowlisted until founders accept the corrective package. |
| Production authority route | Still `NOT_FOUND` at `truscoreapi.vercel.app/api/evidence-authority`. Irrelevant to designated phone UAT profiles; blocks production-profile evidence. |
| Result acknowledgement after admission | Still unverified. No evidence submitted. |
| Did You Know scrollbar on a product that has DYK content | Still unverified on device. |

Changed governed assertion: nutrition contract no longer expects the absent one-argument `openContribution('nutrition')`; it requires the live add and change call shapes. Behavioural replacement is those same Result contribution entry points.

---

## 5. Implementation scope (cumulative, pinned + follow-up)

Pinned `a7e8cf4` includes Emerald Result through Settings/tab bar, share capture gate, C-1–C-4 code, and the Result editorial pass (hero, score→limitations, Mid, additives glyph, scan-another border, debug removal).

Follow-up code adds: UAT phone profile designation and agreement assert; type diagnostic fixes listed above; no production profile or production service changes.

Founder visual acceptance in the Master Plan remains only SCR-RESULT at `d5a7955b60bf64fbd455d332ae640780279127e1`. Later surfaces are implemented for review, not recorded as accepted.

---

## Questions for review

1. Confirm `uat-dynamic-signals-ios` and `uat-dynamic-signals-android` as the only Wave 5 phone-testing profiles, with build numbers 60 / 34 remaining the intended next numbers.
2. Confirm legacy `uat-ios-flag-off` / `uat-ios-flag-on` stay unused for phone testing.
3. Confirm score/info → Data limitations and “Mid” remain as authorised; no restoration.
4. Confirm packet_claims continuing to use the certifications community-verification threshold shape is acceptable until `packetClaims` grows its own dispute slice.
5. Confirm corrective acceptance and BC stay open; Certifications and Packaging stay excluded.
6. Confirm no build creation until the consolidated review authorises it.
