# Stable technical identifiers (Layer B)

These identifiers **intentionally retain legacy strings** where changing them would break installs, deep links, persisted data, or provider configuration. They are **not** shown as the public product name in the UI.

| Identifier | Current value | Notes |
|------------|---------------|--------|
| iOS bundle ID | `com.truescan.foodscanner` | App Store / keychain / provisioning |
| Android application ID | `com.truescan.foodscanner` | Play Console, signing, intents |
| Expo slug | `truescan-food-scanner` | EAS / Expo project linkage |
| URL scheme | `truescan` | Custom scheme intents |
| Universal link host | `truescan.app` | Associated domains; in-app legal URLs still use this host until a Rveel domain migration |
| Public legal paths (when this repo’s Vercel project serves the host) | `/terms`, `/privacy` | Rewrites to `api/terms.ts` and `api/privacy.ts` return **Rveel**-branded HTML. If `truescan.app` is routed to a different stack, those pages must be updated there instead (or DNS/proxy pointed here). |
| Support inbox | `EXPO_PUBLIC_SUPPORT_EMAIL` → `extra.supportEmail` | **Store release blocker** if the app exposes support or store listing requires a contact; wired in `app.config.js` and `productIdentity.supportEmail`. |
| npm package name | `truescan-food-scanner` | `package.json` — tooling / folder name |
| AsyncStorage key prefixes | `@truescan_*` | Renaming would orphan user data |
| Cache directory segment | `truescan/` under app cache | Paths on device |
| Vercel project / script names | `sync-truescan-src`, etc. | CI and backend deploy |
| Default backend URL in config | `https://truscoreapi.vercel.app` | Override via `EXPO_PUBLIC_BACKEND_URL` |

Public-facing name, score label, and permission copy are owned by `src/config/productIdentity.ts` and locale files.
