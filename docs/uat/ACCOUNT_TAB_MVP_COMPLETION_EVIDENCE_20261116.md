# Account tab MVP completion — evidence

**Date:** 16 November 2026  
**Branch:** `build/w5-founders-native-20261114`  
**Worktree:** `C:\TrueScan-FoodScanner-w5-unified-mvp-20261113`  
**Account MVP completion tip (prior):** `183db04e7a9ed612a6bdbe4a19f7abbda8b9a903`  
**Final acceptance-correction starting remote HEAD:** `183db04e7a9ed612a6bdbe4a19f7abbda8b9a903`  
**Final pushed SHA:** _(filled after push of this acceptance-correction commit)_

## Doctrine classification

**GREEN** — Account presentation, local settings persistence, display-only units formatting, and privacy-request mailto copy only.

- No Body/Planet/Claims/Transparency scoring changes.
- No Rateability, Confidence, NR/Checking, Evidence Authority admission, Dynamic Signals governance, or protected identity changes.
- No Premium/paywall, Qonversion, authentication, cloud sync or billing activation.
- Units toggle affects nutrition **display formatting only** (`NutritionTable` / `NutritionDetailsModal` / `src/utils/units.ts`); it does not feed scoring engines. Per-100 g/mL assessment basis and nutrient classifications remain unchanged.
- Public legal release lock unchanged (`publicReleaseStatus: BLOCKED`; all mandatory approvals remain PENDING).

## Account features completed (prior tip `183db04`)

1. **Account Home** — Guest + RVEEL Free; Dark Mode; English-only Language; Units row; Privacy/Help/Legal; version footer; Preferences placeholder removed.
2. **Profile** — Guest-only truthfulness; no sign-in/logout/Delete Account fabrication.
3. **Plan** — Free plan copy; paid/trial/billing/restore unavailable in this build.
4. **Privacy & Data** — Local-only clears; no Delete Account; support-gated data help.
5. **Help & Support** — Configured support email only; opening email ≠ receipt.
6. **Legal & Methodology** — Draft Privacy/Terms fail-closed; in-app methodology retained.
7. **Accessibility polish** — ≥56px rows; max font multiplier 1.35; switch a11y.

## Final acceptance corrections (this tip)

### 1. Nutrition Units formatting
- `formatNonZeroDisplayNumber` prevents small nonzero quantities from rendering as `0` after conversion/rounding.
- Imperial liquids use **US fl oz** only (no ambiguous pint).
- Serving descriptions such as `1 portion (20 g)` convert quantity while preserving serving context (`1 portion (0.71 oz)`).
- Underlying nutriment values and per-100 g columns remain the assessment basis (`Per 100g` retained on fixture).

### 2. Personal-data request emails
- `PrivacyDataScreen` no longer calls `openAssessmentReport`.
- New path: `src/utils/reportPrivacyMailto.ts` + `src/utils/openPrivacyDataRequest.ts`.
- Supports access / correction / deletion wording without GTIN or pack-photo requirements.
- Uses configured `productIdentity.supportEmail` only; unconfigured builds show readiness alert.
- Copy states opening email does not transmit, confirm receipt, delete an account, or complete server deletion.

### 3. Android device acceptance (Expo Go / Pixel_5 `emulator-5554`)
Captured under untracked `artifacts/account-mvp-acceptance-20261116/` (not committed):

| Check | Evidence | Result |
|---|---|---|
| Account Home | `91_units_persisted_after_restart.png` | PASS — Profile/Subscription/Units/Privacy/Help/Legal present |
| Profile | `12_profile.png` / `20_profile.png` | PASS |
| Free Plan | `60_plan.png` | PASS |
| Privacy & Data | `61_privacy.png` | PASS |
| Help & Support | `62_help.png` | PASS |
| Legal & Methodology | `63_legal.png` | PASS |
| Legal links blocked | `70_legal_privacy_blocked.png` | PASS — Privacy Policy alert: not published |
| Dark mode | `71_dark_mode_on.png` | PASS |
| Units label US customary | `64_units_toggled.png`, `85_units_us.png` | PASS — `US customary (lb, oz, US fl oz)` |
| Nutrition metric | `84_nutrition_metric_values.png` | PASS — Barker’s jam `9414732208565`; serving `20 g`; Energy `268 kcal` |
| Nutrition US after toggle | `86_nutrition_us.png` | PASS — serving `0.71 oz`; `Per 100g` retained |
| Units persist after full app restart | `91_units_persisted_after_restart.png`, `94_nutrition_us_after_restart.png` | PASS — US units + `0.71 oz` after force-stop / `exp://127.0.0.1:8081` relaunch |
| Clear confirmation | `92_clear_history_confirm.png` | PASS — Cancel/Clear dialog; cancelled without clear |
| Privacy request unconfigured | `93_privacy_request_unconfigured.png` | PASS — no placeholder address |
| iOS TestFlight / simulator | — | **OUTSTANDING** — no iOS environment this session |

Screen-reader / large-font: Account rows retain ≥56px targets and `maxFontSizeMultiplier` 1.35 (code + prior a11y polish); live TalkBack sweep not separately recorded this session.

## Deliberately deferred

- Premium, authentication, cloud sync, billing, restore purchases.
- Multi-language UI.
- Public Privacy/Terms publication and `legalDestinations.*.ready` flip.
- Functional Delete Account.
- Manufacturer portal / support ticketing backend.
- Configured monitored support email for live mailto open.
- iOS visual QA on this tip.

## Functional / automated evidence (acceptance correction)

| Check | Result |
|---|---|
| `yarn tsc --noEmit` | PASS |
| `yarn jest src/__tests__/unit/account` + `unitsFormatting.test.ts` | PASS (46) |
| `yarn jest src/__tests__/unit/wave5` + nutrition presentation contract | PASS (127) |
| Methodology suites (`methodologyFlagsCopy`, `methodologyVersion`, `methodologyContainment`) | PASS (run with this tip) |
| `node --test scripts/assert-public-launch-ready.test.cjs` | PASS (6) |
| `npm run legal:release-preflight` | exit **1** (expected BLOCKED) |

## Remaining external dependencies

- Configured monitored support email for Help / data-request mailto.
- Counsel-approved published Privacy/Terms before flipping legal readiness.
- iOS visual QA on this tip (cross-platform UAT outstanding).
- Permanent legal entity / territory / licensing approvals (release register).

## Protected architecture confirmation

No scoring engines, Rateability, Confidence, Evidence Authority admission rules, Dynamic Signals publication governance, release-lock registry approvals, or Premium/auth modules were modified for entitlement. Untracked `artifacts/` retained local-only. Frozen UAT tag untouched. Public release remains **BLOCKED**.

## Exact final verdict

**Account MVP final acceptance corrections complete** for units non-zero display, privacy-request mailto path, and Android Account device acceptance listed above, with automated contracts green.

Outstanding non-code items: **iOS visual QA**; support-email configuration for live mailto; public legal publication.

## Separate public-release statement

**Public release remains BLOCKED.** Account acceptance corrections are not public-release approval. See `docs/legal/MVP_PUBLIC_LAUNCH_BLOCKER.md` and `docs/legal/MVP_PUBLIC_LAUNCH_GATE.json` (`publicReleaseStatus: BLOCKED`, requirements PENDING).
