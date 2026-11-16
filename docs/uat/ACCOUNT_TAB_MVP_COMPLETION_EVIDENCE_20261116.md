# Account tab MVP completion — evidence

**Date:** 16 November 2026  
**Branch:** `build/w5-founders-native-20261114`  
**Worktree:** `C:\TrueScan-FoodScanner-w5-unified-mvp-20261113`  
**Starting SHA:** `9aa6403ed6ee2e9706a795d50f34f4ed1cf9acbd`  
**Final pushed SHA:** *(filled at push)*

## Doctrine classification

**GREEN** — Account presentation, local settings persistence and consumer copy only.

- No Body/Planet/Claims/Transparency scoring changes.
- No Rateability, Confidence, NR/Checking, Evidence Authority admission, Dynamic Signals governance, or protected identity changes.
- No Premium/paywall, Qonversion, authentication, cloud sync or billing activation.
- Units toggle affects nutrition **display formatting only** (`NutritionTable` / `src/utils/units.ts`); it does not feed scoring engines.
- Public legal release lock unchanged (`publicReleaseStatus: BLOCKED`; all mandatory approvals remain PENDING).

## Account features completed

1. **Account Home**
   - Guest profile + RVEEL Free card retained.
   - Dark mode switch persists via `useSettingsStore`.
   - Language shows English only (no dormant locale activation).
   - **Removed** nonfunctional Preferences “Coming soon” row.
   - **Added** Units row (metric ↔ imperial) for genuine display formatting.
   - Privacy / Help / Legal navigation preserved; dynamic version footer retained.
2. **Profile**
   - Guest-only truthfulness strengthened (`profileGuestBody`, `profileLocalStorageNote`, `profileLimitsNote`).
   - No sign-in, logout, fabricated identity or Delete Account control.
3. **Plan**
   - Free plan description updated for current offering.
   - Paid/trial/billing/restore explicitly unavailable in this build (`planPaidUnavailableNote`).
   - Purchase UI remains gated by `isMvpSubscriptionAndPaywallEnabled()`.
4. **Privacy & Data**
   - Intro/footnote clarify local-only clears vs OFF catalogue / server correction / EA credentials.
   - Targeted clears for history, favourites, product cache with confirm + success/failure alerts.
   - “Request help with personal data” only when `productIdentity.supportEmail` is configured.
   - No Delete Account action; no AsyncStorage broad-clear.
5. **Help & Support**
   - Contact / report still use configured support email only.
   - Copy states opening email does **not** confirm receipt.
6. **Legal & Methodology**
   - Draft Privacy/Terms remain fail-closed (`legalDestinations.*.ready` unchanged).
   - In-app methodology/sources/limitations retained; Signals separation note added.
7. **Accessibility polish**
   - Account rows: 56px min height, max font multiplier 1.35, richer a11y labels/hints.
   - Dark-mode switch toggles from full-row press; nested Switch hidden from duplicate a11y.

## Deliberately deferred

- Premium, authentication, cloud sync, billing, restore purchases.
- Multi-language UI.
- Public Privacy/Terms publication and `legalDestinations.*.ready` flip.
- Functional Delete Account.
- Manufacturer portal / support ticketing backend.
- Score methodology versioning product surface.

## Functional / automated evidence

| Check | Result |
|---|---|
| `yarn tsc --noEmit` | PASS |
| `yarn jest src/__tests__/unit/account` | PASS (32) |
| Wave 5 §10.4 consumption guards | PASS |
| MVP runtime gates (legacy alerts) | PASS |
| `node --test scripts/assert-public-launch-ready.test.cjs` | PASS (6) |
| `npm run legal:release-preflight` | exit **1** (expected BLOCKED) |

## Android / iOS visual evidence

| Platform | Status |
|---|---|
| Android Expo Go (Pixel_5 / `emulator-5554`) | **Partial PASS** — Account Home scrolled capture shows Units (Metric), English, Dark Mode switch, Privacy/Help/Legal rows, version `RVEEL 10.0.0`; Preferences gone. File: `artifacts/account-mvp-completion-20261116/07_account_home_scrolled.png` (untracked). Further deep-screen taps were interrupted by system notification shade / Expo reload flakiness; not claimed as full journey screenshots for Profile/Plan/Privacy/Help/Legal this session. |
| iOS TestFlight / simulator | **OUTSTANDING / not passed** — no iOS test environment available this session. |

## Accessibility and persistence outcomes

- Touch targets ≥56px on Account rows; switch + button roles set.
- Font scaling capped at 1.35 on row labels to avoid layout collapse.
- Safe-area shell unchanged (`AccountScreenShell`).
- Units/dark mode persist through existing settings store save path (covered by store + Stage 1 architecture; full cold-restart visual re-proof of units toggle not completed this session).
- Offline: Account settings remain local; legal external open remains fail-closed.

## Remaining external dependencies

- Configured monitored support email for Help / data-request mailto.
- Counsel-approved published Privacy/Terms before flipping legal readiness.
- iOS visual QA on this tip.
- Permanent legal entity / territory / licensing approvals (release register).

## Protected architecture confirmation

No scoring engines, Rateability, Confidence, Evidence Authority admission rules, Dynamic Signals publication governance, release-lock registry approvals, or Premium/auth modules were modified for entitlement.

## Exact final verdict

**Account MVP code-complete** for Free/Guest consumer Account surfaces described above, with automated contracts green and Android Home/Units visual confirmation captured.

Outstanding non-code items: iOS visual QA; fuller Android deep-screen screenshot set after stable Expo session; support-email configuration for live mailto.

## Separate public-release statement

**Public release remains BLOCKED.** Account completion is not public-release approval. See `docs/legal/MVP_PUBLIC_LAUNCH_BLOCKER.md` and `docs/legal/MVP_PUBLIC_LAUNCH_GATE.json` (`publicReleaseStatus: BLOCKED`, requirements PENDING).
