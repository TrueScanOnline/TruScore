# W11 As-Built Walkthrough — Monitoring

**Document type:** Critical Output Integrity as-built demonstration (plain language)  
**Module:** W11 — Monitoring (acceptance series; supports Monitoring and Analytics Minimum Spec later)  
**Authority:** MVP Launch Plan v0.4 §12 (Monitoring detailed rules **pending**); Cursor acceptance `docs/cursor-acceptance-mvp-v0.4-20260803.md`  
**Depends on:** W8 (share-event telemetry), W9 (scan obs on Result)  
**Code baseline:** `errorReporting.ts`, share-event rewrite, local loggers as implemented today  
**Status:** **Inventory only.** Do **not** invent privacy disclosure rules, analytics provider choice, or crash-vs-funnel policy from this note. Monitoring Spec + Claude privacy pass follow.

**Date:** 3 August 2026  
**Author:** Cursor (implementation agent)

---

## 1. Purpose & controlling reminder

Acceptance defines W11 as:

> **Monitoring — Sentry wiring vs DSN; share-event telemetry; what founders can see today**

Acceptance honesty check (not Spec):

> Sentry wrapper exists (`errorReporting.ts`); DSN optional; no productised privacy-disclosed usage analytics suite.

**Controlling reminder:**

| Layer | Status |
|-------|--------|
| Sentry SDK in `package.json` + wrapper | Present |
| `errorReporting.initialize()` in app lifecycle | **Not called** |
| DSN in EAS / `app.config.js` | **Not configured** in repo |
| Share-event POST → Vercel console log | Present (lean; no PII fields by design) |
| Productised founder monitoring dashboard | **Absent** |
| Monitoring and Analytics Minimum Spec | **After** as-built + Claude privacy pass |

W11 answers: **what monitoring exists today, and what can founders actually see?**

---

## 2. One-picture view (as-built)

```
DEVICE
  ErrorBoundary → logger.error only (no Sentry)
  scanObservability → powershellLogger (local buffer)
  shareAnalytics → AsyncStorage (device-only)
  crashReporter → in-memory ≤50 (no upload UI)
  ShareService (success) → reportShareEvent
        ↓
VERCEL
  POST /api/share-event → product-preview?__share_event=1
  → console.log('[share-event]', { barcode, platform, itemType, t })
  → 204  (no DB row, no dashboard)

SENTRY
  @sentry/react-native installed
  errorReporting.ts ready
  initialize() NEVER called from app/_layout (dead import only)
  EXPO_PUBLIC_SENTRY_DSN / SENTRY_DSN not in eas.json
  → remote crash reporting NOT activated by this repo’s build config
```

---

## 3. Sentry (wiring vs DSN)

| Fact | Detail |
|------|--------|
| SDK | `@sentry/react-native` ~6.14.0 in `package.json` |
| Wrapper | `src/services/errorReporting.ts` |
| Init call sites | **`initialize()` never called** under `app/` or `src/` |
| Import only | `app/_layout.tsx` imports `errorReporting` but does not use it |
| DSN vars (code) | `EXPO_PUBLIC_SENTRY_DSN` **or** `SENTRY_DSN`; skipped if empty / placeholder / length ≤ 10 |
| EAS / app config | **No** DSN in `eas.json`; **not** in `app.config.js` `extra` or Sentry Expo plugin |
| When enabled | Only if `initialize()` runs **and** valid DSN — path unused today |
| Capture APIs | `captureException`, `captureMessage`, `addBreadcrumb`, `setUser`, `setContext` — **no call sites** outside the wrapper |
| ErrorBoundary ↔ Sentry | **Not wired** |
| Source maps | No project EAS/script config for Sentry release upload |
| Android vs iOS | Same JS wrapper; no platform branch; no native plugin in `app.config.js` |

**Docs note:** `SENTRY_SETUP.md` / older status notes may be stale vs “package installed but unwired.” Treat **code behaviour** as source of truth: installed, unused.

---

## 4. Share-event telemetry (W8 cross-ref)

| Layer | Behaviour |
|-------|-----------|
| Client | `ShareService` → `reportShareEvent.ts` after **successful** share when product present |
| Gate | Skips if backend URL empty / placeholder |
| POST body | `{ barcode, platform, itemType, t }` — no user id / email / name |
| URL | `{getBackendUrl()}/api/share-event` |
| Rewrite | `backend/vercel/vercel.json` → `/api/product-preview?__share_event=1` |
| Handler | `handleShareEventRoute` in `product-preview.ts` |
| Server | `console.log('[share-event]', …)` then `204` |
| Persistence | **No** DB table, **no** dashboard, **no** admin API |
| Verify | `scripts/verify-backend-config.ts` checks POST → 204 |

**Privacy fact (not Spec):** designed without PII fields; **barcode still appears in remote Vercel logs.**

---

## 5. Scan observability

| Item | Fact |
|------|------|
| Module | `src/services/scanObservability.ts` |
| Sink | `powershellLogger` only — console + in-memory buffer; **no backend** |
| Events typed | `scan_started`, `fetch_phase`, `fetch_complete`, `score_ready`, `signals_built`, `scan_terminal` |
| Emitted today | Started / phases / fetch_complete / score_ready from Result; `signals_built` from `buildProductScanResult` |
| `scan_terminal` | Defined, **never emitted** in current call sites |
| Payload intent | PII-safe fields (`scan_id`, barcode, scores, phases, signal counts) — no full ingredient dumps |
| Plan doc | `docs/phase4/runtime-observability-plan.md` — aspirational; not a product dashboard |

---

## 6. Analytics SDKs

| Piece | Remote? |
|-------|---------|
| `shareAnalytics.ts` | **Device-only** AsyncStorage (`@truescan_share_analytics`) — counts, platform/item breakdown, recent shares |
| Amplitude / Firebase Analytics / Mixpanel / PostHog / Segment / Crashlytics | **Not** in `package.json` |
| `src/services/analytics` | Does not exist |
| `matchQualityLogger.ts` | In-memory + `logger`; comment mentions future analytics |

Matches acceptance: no productised privacy-disclosed usage analytics suite.

---

## 7. Crash / error boundaries

| Piece | Path / behaviour |
|-------|------------------|
| `ErrorBoundary.tsx` | Catch → `logger.error` → optional `onError` → Try Again UI. **No Sentry** |
| Wired | Root `_layout`, per-tab `AppTabs`, Result, many product cards |
| `crashReporter.ts` | In-memory ≤50; used from Result `loadProduct` catch; `getCrashLogs` / `exportLogs` exist — **no UI / upload found** |

---

## 8. Logging

| Logger | Local vs remote |
|--------|-----------------|
| `logger.ts` | Local console; sanitizes key/token-like fields; prod WARN+ |
| `powershellLogger.ts` | Local console + ring buffer (1000); `getLogs()` — **no remote sink** |
| Vercel `console.log` | Hosting provider logs only (share-event, API handlers) |

---

## 9. Health / status endpoints

| Route | Implementation |
|-------|----------------|
| `GET /api/fsanz-health` | Rewrite → `fsanz-database?__health=1` — NZFCD/AFCD file presence / sizes / counts |
| App-wide `/health` or `/status` | **Not found** |
| Share-event | Telemetry, not health |

---

## 10. What founders can see today

| Surface | As-built |
|---------|----------|
| In-app founder monitoring dashboard | **None** |
| Sentry from this repo’s build config | **Not wired** (no EAS DSN; init unused) |
| Share funnel | Successful shares → Vercel **raw function logs** if deployment includes rewrite |
| Scan / contribution logs | Device Metro / Xcode / `adb` during UAT — not a founder portal |
| `shareAnalytics` / `crashReporter` / `powershellLogger` buffers | On-device only; no founder pull path |
| FSANZ health | Manual HTTP to `/api/fsanz-health` — data-file status, not crash/use analytics |

**Bottom line for “what founders can see”:** thin ops visibility only (optional Vercel logs + local UAT consoles). No product monitoring console in the app.

---

## 11. Gaps vs acceptance W11 + privacy note

| Acceptance text | Code alignment |
|-----------------|----------------|
| Sentry wiring vs DSN | Wrapper + optional DSN vars exist; **wiring incomplete** |
| Share-event telemetry | **Present** (lean barcode/platform/itemType) |
| What founders can see today | **Thin / ops logs only** |
| No productised usage analytics suite | **Matches** |
| Follow-on Monitoring Spec + Claude privacy pass | **Not inventable** from this inventory |
| Founder choice: crash-only vs crash + lean funnel; provider TBD | Still open |

**Claude question still pending (acceptance):** whether optional Sentry + share-event is an acceptable MVP baseline, and what must be disclosed or removed.

**Do not implement** a monitoring suite or enable Sentry from this note without Spec + founder direction.

---

## 12. Key file index

```
src/services/errorReporting.ts
app/_layout.tsx
package.json
eas.json
app.config.js
src/utils/reportShareEvent.ts
src/utils/shareAnalytics.ts
src/features/sharing/services/ShareService.ts
src/config/backendConfig.ts
backend/vercel/vercel.json
backend/vercel/api/product-preview.ts
backend/vercel/api/fsanz-database.ts
src/services/scanObservability.ts
app/result/[barcode].tsx
src/services/buildProductScanResult.ts
src/components/ErrorBoundary.tsx
src/utils/crashReporter.ts
src/utils/logger.ts
src/utils/powershellLogger.ts
docs/phase4/runtime-observability-plan.md
scripts/verify-backend-config.ts
docs/as-built/W8-sharing-20260803.md
docs/cursor-acceptance-mvp-v0.4-20260803.md
```

---

## 13. Bottom line for founders / Claude

**What exists:** Local error boundaries and log buffers; lean share-event posts to Vercel logs; device-only share analytics; Sentry package + wrapper sitting idle.

**What does not exist:** Active Sentry from repo build config; productised analytics suite; founder monitoring dashboard; Monitoring Spec privacy disclosures.

**Next decision (founders + Claude privacy pass):** crash-only vs crash + lean funnel; whether to wire optional Sentry; disclosure obligations — then Monitoring and Analytics Minimum Spec before coding.
