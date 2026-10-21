# Rveel Wave 5 — consolidated GitHub review handoff

No EAS build, store submit, TestFlight upload, OTA publish, backend deploy, or release merge is authorised by this note.

Corrective-package acceptance and BC remain **open**. Certifications and Packaging remain **excluded**. The product-hero redesign below does not close either.

## Latest — product hero

| Role | Full SHA |
| --- | --- |
| Parent | `1a97625847a19e5f0fa3e2676ebfb5eadaa350b5` |
| **Tested source (product hero)** | `e3012ee36ab76c9ae461f30a1be328b749bdd68f` |

Repository: https://github.com/TrueScanOnline/TruScore  
Branch: `wave5/score-experience-20261008`

Focused comparison:  
https://github.com/TrueScanOnline/TruScore/compare/1a97625847a19e5f0fa3e2676ebfb5eadaa350b5...e3012ee36ab76c9ae461f30a1be328b749bdd68f

Classification: **GREEN** presentation. Favourite, share, photo enlargement, capture, retry, and the contributed-photo badge keep their existing handlers. Mint does not encode a score or a confidence state. No governed outcome changes.

The documentation tip that records this section follows `e3012ee36ab76c9ae461f30a1be328b749bdd68f` directly.

Screenshots:

- Before: `design/wave5/APP-emerald-hero-before.png`
- After, Coca-Cola Classic on the Pixel 5: `design/wave5/APP-emerald-hero-after.png`
- After, hero crop: `design/wave5/APP-emerald-hero-after-crop.png`

Checked on the Pixel 5 emulator, light mode, default text: horizontal photo and name, circular favourite and share, lightbox, favourite toggle, and the share sheet. A three-line name grows the card. Dark mode stays legible. System text at 1.3 stacks the photo above the name. iOS was not checked. Missing photo, image error, a user-contributed badge, a landscape source, and a product with no brand were not on this device pass.

`npm run typecheck` passed on this source. Hero arrangement, Result surface contract, doctrine §10.2, and §10.4 consumption guards passed. No build, submission, OTA update, or deployment was started.

---

## 1. Review targets

| Role | Full SHA |
| --- | --- |
| Baseline B0 | `99102768b61bd6e518bb889e3ab6f01dfc3e1268` |
| Original review checkpoint (preserve) | `a7e8cf476911b656f67f62622fbfc77d466049b8` |
| Phone UAT + type-diagnostic replacement | `c6bb681b05dcd3473224d7117980d33950ebbe6c` |
| Prior regression-closure candidate | `51c6c77d8bbac5aa0eece830524203a35d8e457d` |
| Prior consolidated docs tip | `ff9d627b8370c30b644709ed53d6e1f40e812a96` |
| **Final tested source (this freeze)** | `6236a36dfce6005f3540c2caec469a8bdc151537` |
| This handoff (docs tip) | `92ef4530aa60cabfaed2fd51888b388f05f811bb` |
| Return branch | `preserve/pre-wave5-9910276-20261008` = B0 (unchanged) |

Repository: https://github.com/TrueScanOnline/TruScore  
Branch: `wave5/score-experience-20261008`

Prior candidate → tested source:  
https://github.com/TrueScanOnline/TruScore/compare/51c6c77d8bbac5aa0eece830524203a35d8e457d...6236a36dfce6005f3540c2caec469a8bdc151537

B0 → tested source:  
https://github.com/TrueScanOnline/TruScore/compare/99102768b61bd6e518bb889e3ab6f01dfc3e1268...6236a36dfce6005f3540c2caec469a8bdc151537

Reviewers who want only tested application code: check out `6236a36dfce6005f3540c2caec469a8bdc151537`.

---

## 2. Summary of founder’s latest changes (after `51c6c77`)

All classified **GREEN** presentation / Result consumption wiring. No governed score math, publication, or authority admission changes.

### Live app (integrated; not concept-only)

| Area | Change |
| --- | --- |
| Hero identity | Heading above photo; favourites/share top-right of card |
| Score medallion | Visible `/100` removed; number + rating band only |
| Score info (`i`) | Opens **Understanding Rveel Score** (`TruScoreInfoModal` / S27). Score disc and Confidence still open Data Limitations (S26) |
| Nutrition / Feel the Burn | Thin green border; heading size aligned with other cards |
| Ingredients | Edit pencil identical to Nutrition (same change chooser); title inline with flask icon |
| Did You Know | External-link icon inline at end of article title; size 20 emerald; module heading + bulb icon aligned |
| About these Additives | Modal entries: light grey fill, thicker green border, amber headings; Result card heading size aligned |
| Card headings | Shared pattern: icon 24 beside title, fontSize 20 bold across Result section cards |

### §10.4 allowlist (test gate only)

Result orchestration forbidden-token hits on `app/result/[barcode].tsx` reduced **4 → 3** after removing the TruScoreInfoModal mount gate on `trust_score_breakdown`. Allowlist updated to match. Not a consumer score-colour read change.

### Screenshots committed for review

Under `design/wave5/`: `APP-emerald-*.png`, `app-result-*.png`, `signature-*.png`, `rveel-signature.html`.

**Deliberately excluded (untracked):** `design/wave5/metro-phone-qr.png`, `design/wave5/metro-qr.png` (local Metro QR artefacts).

### Docs-only between `51c6c77` and this freeze

`ff9d627` — prior consolidated handoff (no app code).

---

## 3. Changed screens, components and governed boundaries

**Screens / surfaces:** Result (`app/result/[barcode].tsx`) and Result-owned cards/modals listed above.

**Components:** `ProductHeroSection`, `EmeraldScoreComposition`, `NutritionTable`, `BannerAlertsCard`, `AboutTheseAdditivesCard`, `AboutTheseAdditivesModal`, `ProductDataLimitationsCard` (heading size only).

**Governed boundaries preserved:**

- UI still consumes publication / contribution actions via existing Result contracts (§5).
- Score disc / Confidence → S26; info glyph → S27 (founder override of the earlier “both open S26” note in `ff9d627`).
- Contribution add/change routes unchanged; Ingredients pencil reuses the existing Nutrition change chooser.
- No reactivation of dormant §8 surfaces; Certifications / Packaging still excluded.
- Shared Emerald theme tokens retained (`resultPresentation` / `resultEmeraldTone`).

---

## 4. Effective testing-profile configuration

**Designated phone-testing profiles (confirmed):** `uat-dynamic-signals-ios`, `uat-dynamic-signals-android`.

| | iOS UAT | Android UAT |
| --- | --- | --- |
| Profile | `uat-dynamic-signals-ios` (extends `preview`) | `uat-dynamic-signals-android` (extends `preview-apk`) |
| App version | `10.0.0` | `10.0.0` |
| Bundle / package | `com.truescan.foodscanner` | `com.truescan.foodscanner` |
| Distribution | store (TestFlight-compatible) | internal APK |
| Backend | `https://truscoreapi-uat.vercel.app` | same |
| Authority env | `uat` | `uat` |
| Live authority GET | HTTP 200, `authorityEnv: uat` | same host |
| Asset / recall / skeleton | 1 / 1 / 0 | 1 / 1 / 0 |
| Score diagnostics | 1 | 1 |
| Store release | 0 | 0 |
| Build identity in profile | iOS buildNumber **60** | Android versionCode **34** |
| Updates | `app.config.js` `updates.enabled: false`; no runtimeVersion / channel / update URL | same |
| Standalone | Release native builds; no Metro required | APK standalone |

**app.config.js fallbacks (not phone UAT overrides):** versionCode **13**, buildNumber **26** when EAS env unset.

**Metro / Expo Go (NZ local) ≠ EAS:** `.env.development` sets `EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV=uat`; local `.env` sets production `EXPO_PUBLIC_BACKEND_URL`. Production `…/api/evidence-authority` remains **404**. Packet Claims submit on Expo Go with that pairing remains fail-closed (recorded earlier). Phone UAT EAS profiles agree on UAT backend + authority.

**Production profiles:** unchanged. Not repurposed for Wave 5 phone UAT.

**Build-number availability vs App Store Connect / Play Console:** in-repo next increments only; store/console free-number check **unverified**.

---

## 5. Commands executed and results (against `6236a36`)

| Command | Result |
| --- | --- |
| `npm run typecheck` (`tsc --noEmit`) | exit **0** |
| `npm run preflight:mvp-release-asset` | OK — 7 MVP Asset profiles; 2 phone UAT profiles agree |
| `governedOutcomeOracle.section10_2.test.ts` | Pass |
| `consumptionGuards.section10_4.test.ts` | Pass (allowlist 3) |
| `wave4a5ResultSurface.contract.test.ts` | Pass |
| `nutritionTablePresentation.contract.test.ts` | Pass |
| `mvpReleaseDynamicSignalsAsset.test.ts` | Pass |
| null-score path + integrity | Pass |
| contribution consumer / closure / integration | Pass |
| `wave4aSharedAuthority` | Pass (25) |
| NA-018 share authority | Pass |
| `correctivePackage.c1c4` | Pass |
| rateability fixtures + UAT narrow + sourceQuality | Pass |
| scanResultPresentation + na022 | Pass |
| body/planet/ethics/open pillars | Pass |
| chainingArchitectureBoundary + resolveSharedIdentityContext | Pass |

**Limitations:** no device/UI screenshot automation of the latest editorial pixels in CI; no live contribution admission UAT on this freeze; Certifications/Packaging suites excluded; ASC/Play build-number free check not run; no EAS build started.

---

## 6. Remaining defects, unverified behaviour and exclusions

1. Corrective-package **acceptance** and **BC** still open.
2. §10.4 remains a **partial** gate (orchestration allowlist 3 + TrustScoreInfoModal prose 1; dormant exclusions; no full §5.1 import allowlist).
3. Production evidence-authority route missing (production-release issue; not a correctly configured UAT phone blocker).
4. `development` EAS profile still pairs `authorityEnv=uat` with production backend default when URL unset (not a phone-testing profile).
5. Expo Go Metro backend/authority mismatch can block Packet Claims submit (local env; not EAS UAT).
6. Result acknowledgement after admitted evidence still unverified end-to-end.
7. Packet claims still inherit certifications community-verification thresholds.
8. Certifications / Packaging excluded.
9. Build creation pending separate founder authorisation after independent review.

---

## 7. Corrective-package acceptance and BC status

**Open.** C-1–C-4 automated outcomes pass on the tested source. Founders have not closed the package or recorded BC.

Do **not** treat `d5a7955` (SCR-RESULT visual), `a7e8cf4`, `c6bb681`, `51c6c77`, `6236a36`, or this docs tip as BC.

---

## 8. Certifications / Packaging status

**Excluded** from Wave 5 acceptance claims (R-12 / R-13). Do not report those suites as passed when recording BC.

---

## 9. Questions for independent assessment

1. Accept `6236a36` as the freeze replacing prior tested candidate `51c6c77` while keeping earlier checkpoints in history?
2. Confirm score **info (`i`) → S27** while disc/Confidence remain on S26 matches founder intent for production UAT?
3. Confirm iOS buildNumber **60** / Android versionCode **34** once ASC/Play availability is verified?
4. Confirm packet_claims → certifications threshold shape, or require an explicit dispute slice before BC?
5. Confirm Result orchestration allowlist (3) and TrustScoreInfoModal prose (1) may remain until a later AMBER cleanup?
6. Authorise UAT native builds only after this review — still no build from this handoff.

---

## 10. Actions not taken

No EAS builds, store submissions, TestFlight uploads, OTA publishes, backend deployments, or release merges were started from this freeze.
