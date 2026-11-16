# MVP launch hardening — consolidated evidence

**Date:** 16 November 2026 (final stabilisation same day)  
**Branch:** `build/w5-founders-native-20261114`  
**Starting SHA (stabilisation):** `79df3dc04f24c5fe6816db48e19eeac13e937651`  
**Prior hardening implementation SHA:** `5e7fcbc59a685655f7e6a7687571e9e481dc76eb`  
**Final remote SHA:** *(filled at push)*

**Doctrine note:** Administrative hold and Result orchestration remain AMBER presentation/external-control surfaces under founder authorisation. Scoring engines, Rateability, Confidence, and Evidence Authority admission rules were not modified.

---

## 1. Stabilisation fixes (this pass)

### 1.1 Administrative holds reliable
- Unconfigured Postgres is **never** returned as confirmed `held:false` (`hold_store_unconfigured` → 503 / unavailable).
- `PUBLICATION_HOLD_OPERATIONAL=1` documents production readiness; persistent DB required for mutations and confirmed reads.
- Audit table `publication_hold_events` records hold/release with authoriser, reason, timestamp.
- Admin POST: timing-safe token compare (min 24 chars), required `authorizedBy`, boolean `held`, barcode validation, non-wildcard CORS for writes.
- Integration tests: missing DB, DB failure, activate, wrong GTIN, release, validation errors.

### 1.2 Client publication gaps
- Hold starts as **pending** (withhold) until verified.
- Stale async responses ignored via barcode ref.
- Score/highlights/ecoscore shares revalidate hold before opening ShareModal.
- ShareModal suppressed / score+highlights stripped while withheld.
- Search/Favourites list scores fail closed unless `holdVerifiedNotWithheld` (lists do not verify live → no cached score display).

### 1.3 Web preview / caching
- Preview: `max-age=60, must-revalidate` when not held; `no-store` when held/unavailable.
- `/barcode/{barcode}` strips image/nutrient fields under hold; `no-store` when held; fail-closed teaser on preview 503/network error.

### 1.4 Legal version gate
- `hasCurrentPublishedLegalAcceptance` — disclaimer ack ≠ Terms acceptance once docs ready.
- Root launch rechecks version; forces onboarding when published docs ready and version mismatch.
- Drafts remain unpublished; `legalDestinations.*.ready` unchanged (`false`).

### 1.5 OFF write containment
- Gates cover product submit, photo upload, manufacturing-country OFF submit, server image dispatch, EA `offTransport`.
- Public contribution remains disabled by default.
- Private EA evidence processing preserved (non-OFF paths).

### 1.6 Expo Go closed UAT
- `EXPO_PUBLIC_PUBLICATION_HOLD_OPTIONAL=1` in `.env.development` only — allows scanning when hold store unconfigured on UAT.
- Store/public builds must leave optional unset (fail closed).

---

## 2. Intentionally disabled / not done

| Item | Status |
|---|---|
| Public OFF contribution | Disabled |
| Share-event / local share analytics | Disabled (prior pass) |
| Privacy/Terms publication | Not published |
| Genuine live UAT hold cycle on deployed backend | **BLOCKED** — requires backend deploy + Postgres + founder token (not invented as pass) |
| Device/Expo Go visual re-verify of this stabilisation SHA | **BLOCKED / outstanding** — run after Metro reload; older APK does not contain this JS |

---

## 3. Scoring / EA preservation

- No pillar/engine/rateability/admission edits.
- Hold overlays consumer publication only.

---

## 4. Automated verification (this machine)

| Suite | Result |
|---|---|
| `src/__tests__/unit/legal/*` (gates, hold store, hold client, legal version, OFF containment) | PASS |
| `listPublishedScore.test.ts` | PASS |
| `photoUploadFrontOff.test.ts` | PASS |
| `accountStage1.contract.test.ts` | PASS |
| `wave5/consumptionGuards.section10_4.test.ts` | PASS |
| `yarn tsc --noEmit -p tsconfig.json` | PASS |

### Required live hold cycle (deployed UAT)

| Step | Status |
|---|---|
| 1 Product publishes before hold | **BLOCKED** — needs deployed `/api/publication-hold` + operational Postgres |
| 2 Authorised hold activation | BLOCKED |
| 3 Result/share withhold | BLOCKED (unit coverage only) |
| 4 Web preview withhold | BLOCKED (code present; not live-exercised) |
| 5 DB failure ≠ confirmed no hold | Covered by unit/integration fake; live BLOCKED |
| 6 Authorised release | BLOCKED |
| 7 Scoring outputs unchanged | Engine untouched; live compare BLOCKED |

---

## 5. Remaining release blockers

1. Deploy hold API + Postgres; set `PUBLICATION_HOLD_OPERATIONAL=1` and strong `RVEEL_FOUNDER_ADMIN_TOKEN`.
2. Live UAT hold cycle evidence (steps above).
3. Legal entity, monitored contacts, counsel-approved Privacy/Terms publication + readiness flip.
4. BBFAW/KTC clearance (letters drafted, not sent/approved).
5. Store builds must not ship `PUBLICATION_HOLD_OPTIONAL=1`.
6. Separate public launch authorisation.

---

## 6. Release go / no-go

**NO-GO for public legal launch.**  
**Conditional GO for closed UAT** after backend hold deploy and Expo Go visual pass on this SHA.

---

## 7. Confirmation

- No Premium/auth/billing activation.
- No public Privacy/Terms publication.
- `artifacts/` left untracked.
- No store submission performed.
