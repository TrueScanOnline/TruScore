# MVP launch hardening — consolidated evidence

**Date:** 16 November 2026 (stabilisation + closed technical UAT)  
**Branch:** `build/w5-founders-native-20261114`  
**Closed UAT start HEAD:** `82688a30ecc93961b808ca8ffbd59d3eda769d56`  
**Stabilisation implementation:** `88176e7a9af0162cb5c598b3fa50c7154f710988`  
**Final remote SHA:** `ea6a76322a7b91a4388437e8bfe69431cb6f1741`

**Doctrine note:** Administrative hold and Result orchestration remain AMBER presentation/external-control surfaces under founder authorisation. Scoring engines, Rateability, Confidence, and Evidence Authority admission rules were not modified.

---

## 0. Permanent public release lock (verified this UAT)

| Check | Result |
|---|---|
| `node --test scripts/assert-public-launch-ready.test.cjs` | **6/6 PASS** |
| `npm run legal:release-preflight` | **exit 1** (public denied) |
| All 15 `MVP_PUBLIC_LAUNCH_GATE.json` requirements | **PENDING** |
| Closed UAT EAS profiles (`uat-founders-*`, `development`, dynamic-signals UAT) | Still exempt when `STORE_RELEASE=0` + `CLOSED_PRELAUNCH_VISUAL_UAT=1` |
| Store/production/preview/unknown profiles | Fail closed |

Public release remains **NO-GO**. See `MVP_PUBLIC_LAUNCH_BLOCKER.md`.

---

## 1. Stabilisation fixes (prior + UAT delta)

### 1.1 Administrative holds reliable
- Unconfigured Postgres is **never** returned as confirmed `held:false`.
- `PUBLICATION_HOLD_OPERATIONAL=1` + persistent DB required for operational service.
- Audit table `publication_hold_events` records hold/release with authoriser, reason, timestamp.
- Admin POST: timing-safe token (≥24), `authorizedBy`, validation, non-wildcard write CORS.

### 1.2 Client publication gaps
- Pending until verified; barcode race guard; share revalidate; list scores withheld without live verify.
- **UAT defect fix:** Result mount now calls `revalidatePublicationHold` so a short held-cache cannot keep withholding after authorised release for the same GTIN.

### 1.3 Web preview / caching
- Preview/barcode: `no-store` when held; short `max-age=60, must-revalidate` when not; held preview strips image/nutriments.

### 1.4–1.6 Legal / OFF / Expo Go
- Unchanged: drafts unpublished; OFF public contribution gated off; `.env.development` may set `PUBLICATION_HOLD_OPTIONAL=1` for closed UAT only.

---

## 2. Closed UAT backend (`truscoreapi-uat` only)

| Item | Evidence |
|---|---|
| Project | Linked `backend/vercel/.vercel/project.json` → **`truscoreapi-uat`** (not `truscoreapi`) |
| DB isolation | UAT vs production Neon project IDs **differ** (suffixes `…0778` vs `…1682`); hosts differ; same default DB *name* only |
| Deploy | `dpl_Cs5uwNsncq5XutXDi7YxCTb98axv` → alias `https://truscoreapi-uat.vercel.app` |
| Env (names only) | `RVEEL_FOUNDER_ADMIN_TOKEN`, `PUBLICATION_HOLD_OPERATIONAL=1`, `PUBLICATION_HOLD_CORS_ORIGIN` on Production+Development (Preview CLI branch prompt left incomplete; Production alias used) |
| Secrets | Token generated locally in TEMP only; **not** logged, committed, or printed in this handoff |

**No production (`truscoreapi`) deploy was performed.**

---

## 3. Live hold cycle (fixture `4088700300930` Grandessa Mixed Berry Premium Jam)

| Step | Result |
|---|---|
| 1 Unheld publication | GET `held:false`; Result showed **56 Fair** (Body 11 / Planet 14 / Claims 15 / Transparency 16); Limited confidence |
| 2 Authorised hold | POST 200 `administrative_hold`; unauth POST **401** |
| 3 Result withhold | Device: **ADMINISTRATIVE HOLD** / “Assessment temporarily unavailable” / distinct from NR/Checking; product identity + nutrition retained; score gauge withheld |
| 4 Web preview withhold | `publication_hold=administrative_hold`, **no** `image_url`/`nutriments`, `Cache-Control: no-store` |
| 5 Deep-link / barcode teaser | `/barcode/{gtin}` `no-store`; no OFF image / score-like content while held |
| 6 Wrong GTIN | Other barcode remained `held:false` |
| 7 DB failure ≠ no-hold | **Live intentional DB outage not performed** (shared UAT DB healthy). Covered by `publicationHoldStore.integration.test.ts` |
| 8 Audit history | DB rows: hold + release events with `authorized_by=closed-uat-operator` and reasons |
| 9 Authorised release | POST release; GET `held:false`; preview image restored; `Cache-Control: public, max-age=60, must-revalidate` |
| 10 Result after release | Device: score **56 Fair** restored with **same pillar scores** (11/14/15/16) |
| 11 Scoring / EA | Engines untouched; Claims 15/25 unchanged across hold cycle |

Local screenshots (untracked `artifacts/closed-uat-20261116/`): unheld Result, held Result, Account guest Free, released Result.

---

## 4. Application QA (Android Expo Go)

| Area | Result |
|---|---|
| Legal ack / returning user | Metro: `hasCompletedOnboarding:true`, `legalDisclaimersAcceptedAt` set, `willShowOnboardingFlow:false` → Main/Scan |
| Account | Guest / RVEEL Free; Privacy & Data present; Preferences Coming soon |
| OFF public contribution | Remains gated (gates tests PASS); unknown-product UI may mention OFF help text without enabling write |
| Share telemetry | Default OFF (gates tests) |
| Rated path | 56 Fair published when not held |
| Hold path | Assessment withheld; not NR/Checking |
| iOS TestFlight | **BLOCKED** — no iOS test environment on this machine this session |

---

## 5. Automated verification

| Suite | Result |
|---|---|
| Legal release-lock tests | PASS (6) |
| Public release preflight | FAIL closed (exit 1) — expected |
| `src/__tests__/unit/legal/*` | PASS |
| Account Stage 1 + Wave5 §10.4 + listPublishedScore | PASS |
| `yarn tsc --noEmit` | PASS |

---

## 6. Remaining concrete blockers (public release)

1. Permanent legal gate: entity, NZ/AU counsel, Terms/Privacy publication, contacts, licences (BBFAW/KTC/OFF), founder+counsel sign-off, protected `RVEEL_APPROVED_RELEASE_SHA`.
2. iOS device/TestFlight visual regression on this tip.
3. Live intentional DB-failure exercise on UAT (optional ops drill; unit coverage exists).
4. Organisational: no public store submission; keep store builds free of `PUBLICATION_HOLD_OPTIONAL=1`.
5. Preview-env hold vars incomplete via CLI (Production alias verified; optional to finish Preview).

---

## 7. Release stance

**NO-GO for public legal launch.**  
**GO for continued closed technical UAT** on `truscoreapi-uat` + Expo Go with hold cycle demonstrated.

---

## 8. Confirmation

- No production backend deployment.
- No Premium/auth/billing activation.
- No public Privacy/Terms publication.
- `artifacts/` left untracked.
- No store submission performed.
