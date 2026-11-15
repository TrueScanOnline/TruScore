# Account Stage 1 — Consumer Account Foundation

**Date:** 15 November 2026  
**Branch:** `build/w5-founders-native-20261114`  
**Worktree:** `C:\TrueScan-FoodScanner-w5-unified-mvp-20261113`

## Starting SHA

`87ace5056b28a2e3bd572fdaa0d61815e8f7b88a`

## Doctrine classification

**GREEN** — presentation, navigation and consumer settings architecture only.

- Reads settings/theme from existing stores (`useSettingsStore`).
- Does not change scoring, Evidence Authority, Dynamic Signals, publication rules, FM-01/02/03R, premium gates, or Qonversion purchase logic.
- Does not reactivate dormant Methodology content; in-app legal panels reuse approved i18n copy.
- Does not mount `DeveloperSettings` inside the Account stack.

**AMBER notes (not implemented as behaviour changes):**

- Configured public privacy/terms URLs are not ready (see blockers).
- Support email is unset in the local Expo env (see blockers).

## Files changed (implementation)

- `src/navigation/AppTabs.tsx` — Settings → Account tab, person icon, Account stack
- `src/navigation/AccountStack.tsx` — Account route stack
- `src/navigation/tabStackParamLists.ts` — `AccountStackParamList`
- `src/utils/linking.ts` — legacy `/profile` → `AccountHome`
- `app/profile.tsx` — thin re-export of Account Home (no developer tools)
- `src/components/account/*` — shared Account UI
- `src/screens/account/*` — Home, Profile, Plan, Privacy, Help, Legal
- `src/config/legalDestinations.ts` — verified URL readiness fail-closed
- `src/utils/appVersion.ts` — Expo config version helper
- `src/i18n/locales/en.json` — Account copy + `tabs.account`
- `src/__tests__/unit/account/*` — Stage 1 contracts + clear isolation
- related test updates for locale/celebration boundary

## Navigation mapping

| Surface | Route |
|---|---|
| Bottom tab | `Account` (label Account, person icon) |
| Deep link legacy | `/profile` → `Account` / `AccountHome` |
| Profile detail | `AccountProfile` |
| Plan | `AccountPlan` |
| Privacy & Data | `PrivacyData` |
| Help & Support | `HelpSupport` |
| Legal & Methodology | `LegalMethodology` |
| Developer tools | Root `DeveloperSettings` only (unchanged) |

Tab order preserved: Scan → Search → History → Favs → Account.

## Account screen inventory

1. **Account Home** — guest card, Free plan summary, Personal / App settings / Privacy & support, dynamic version, no logout
2. **Profile** — guest-only, local-storage note, no fake auth
3. **Your RVEEL plan** — Free only; no purchase CTAs; future note
4. **Privacy & Data** — clear history / favourites / cache + how-data-used (fail-closed URL)
5. **Help & Support** — contact/report gated on configured email; About RVEEL
6. **Legal & Methodology** — privacy/terms fail-closed; methodology/sources/limitations in-app

## MVP versus future Premium boundaries

| Kept off | Future-ready |
|---|---|
| `subscriptionAndPaywall: false` | AccountPlan is permanent entry point |
| `ENABLE_PREMIUM_GATING = false` | Guest profile structure for authenticated fields |
| No Qonversion init from Account | No Subscribe / Trial / Restore / Billing UI |
| No authentication / logout | Logout reserved for signed-in state later |

## Analytics

`analyticsEnabled` is stored but not consulted by any active collection path. Removed from Account Home without changing the store default (`false`). No silent consent change.

## Test results

- `npx tsc --noEmit` — PASS
- `npx jest src/__tests__/unit/account ...` (+ locale / contribution / methodology containment) — PASS (30 tests)
- `mvpFeatureGates` — PASS
- Scoring / Evidence Authority / FM suites — not modified by this change set

## Emulator screenshot paths

Directory: `artifacts/account-stage1-20261115/`

| File | Content |
|---|---|
| `02_account_home_light.png` | Account Home light |
| `03_profile.png` | Guest profile |
| `04_plan_free.png` | Free plan |
| `05_account_home_scrolled.png` | Scrolled home (version / lower rows) |
| `06_privacy_data.png` | Privacy & Data |
| `07_help_support.png` | Help & Support |
| `08_legal_methodology.png` | Legal & Methodology |
| `11_account_home_dark_final.png` | Account Home dark (founder leave-open state) |

Device: Android emulator **Pixel_5** (`emulator-5554`) via Expo Go + Metro offline (`8081`).

## Support / legal readiness findings

| Item | Status |
|---|---|
| `https://truescan.app/privacy` | **BLOCKED** — HTTP 404 (15 Nov 2026) |
| `https://truescan.app/terms` | **BLOCKED** — HTTP 500 (15 Nov 2026) |
| `productIdentity.supportEmail` / `EXPO_PUBLIC_SUPPORT_EMAIL` | **BLOCKED** — empty in `.env.development`; Help shows “Not configured” |
| In-app methodology / sources / disclaimers | Available from existing approved i18n |
| Interim Vercel legal HTML | Exists on `truscoreapi.vercel.app`, but productIdentity does not point there; not used |

## Outstanding blockers

1. Publish approved privacy + terms pages at the configured `truescan.app` URLs before declaring Legal external links release-ready.
2. Set `EXPO_PUBLIC_SUPPORT_EMAIL` for builds that should expose Contact / Report actions.
3. Founder visual acceptance of Account Stage 1 UI.

## Commit SHAs

1. `108aa18` — `feat(account): Account tab stack with guest home and MVP detail screens`
2. `09121ce` — `test(account): Stage 1 contracts and privacy clear isolation`
3. `b17e314` — `docs(uat): Account Stage 1 evidence and privacy clear label polish`

**Final pushed remote HEAD:** `b17e3143717130107a4a7c5ef12ac2b7aa7ad66c`  
(`origin/build/w5-founders-native-20261114`)

## Frozen native-build tag

Tag `w5-founders-uat-source-android-38-ios-64-20261114` still peels to  
`c113ce6ca4ec83c47423073437b2340c7c2d58d2` (unchanged).
