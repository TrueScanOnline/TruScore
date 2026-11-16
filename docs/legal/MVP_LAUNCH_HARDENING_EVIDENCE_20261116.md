# MVP launch hardening — consolidated evidence

**Date:** 16 November 2026  
**Branch:** `build/w5-founders-native-20261114`  
**Starting SHA:** `3deb4f44282f17ac23ab105ca3f75510be582cfb`  
**Final remote SHA:** *(filled at push)*  

**Doctrine note:** Emergency hold and Result orchestration touch AMBER presentation/external-control surfaces. Founder instruction of 16 Nov 2026 authorised this implementation. Scoring engines, Rateability, Confidence, and Evidence Authority admission rules were not modified.

---

## 1. Implemented protections

### A — Dispute protection
- Result + Account Help report path builds a structured mailto via configured `supportEmail` only (`reportAssessmentMailto` / `openAssessmentReport`).
- Operational procedure: `docs/legal/MVP_DISPUTE_CASE_HANDLING_PROCEDURE_20261116.md`.
- Administrative publication hold:
  - `GET/POST /api/publication-hold`
  - Postgres-backed `publication_holds` (default no hold when DB absent on GET)
  - Founder auth: `X-Rveel-Founder-Admin` + `RVEEL_FOUNDER_ADMIN_TOKEN`
  - Client withhold distinct from NR/Checking (`PublicationHoldNotice`)
  - Preview path strips image/fields + `no-store` when held or hold-state unavailable

### B — Legal acknowledgement
- Skip intro → legal disclaimer step (cannot complete without `legalDisclaimersAcceptedAt`)
- Root layout resets completed-onboarding when legal ack missing (legacy Skip repair)
- Binding Terms/Privacy version stamp only when published destinations ready or segregated non-store test entitlement (`legalGate`)
- `legalDestinations.*.ready` remains **false**; drafts not published

### C — Source licensing
- OFF User-Agent from configurable contact; placeholder `truescan@example.com` removed
- Public OFF contribution kill-switch default OFF (client + server image dispatch)
- Share landing OFF photo attribution when image present
- BBFAW / KTC send-ready request drafts created; scoring inputs preserved; clearance **blocked pending replies**

### D — Privacy minimisation
- Share-event telemetry default OFF (client + server)
- Local share analytics default OFF
- `analyticsEnabled` not presented as governing these paths
- Privacy Policy draft updated accordingly (still DRAFT — NOT APPROVED FOR PUBLICATION)

### E — Config surface
- `app.config.js` extras: `offPublicContribution`, `shareEventTelemetry`, `localShareAnalytics`, `offApiContactEmail`, `legalDocumentsTestReady`, `storeRelease`
- `backend/vercel/ENV_TEMPLATE.md` updated

---

## 2. Intentionally disabled functionality

| Function | Status |
|---|---|
| Automatic public OFF photo/product contribution | Disabled unless explicit entitlement |
| Outbound `/api/share-event` logging | Disabled unless explicit entitlement |
| Local `@truescan_share_analytics` writes | Disabled unless explicit entitlement |
| Binding Terms/Privacy acceptance against drafts | Not activated |
| Manufacturer portal / public SLA | Not built |

Private Evidence Authority evidence upload remains available when EA features are entitled.

---

## 3. Scoring / Evidence Authority preservation

- No edits to pillar registries, `truscoreEngine`, rateability settle, or EA admission logic.
- Hold overlays consumer publication only; engines may still compute internally.
- OFF live write from EA still requires existing execute/credential gates; image dispatch additionally requires public-contribution entitlement + real contact.

---

## 4. Tests and device QA

### Automated
- `yarn jest src/__tests__/unit/legal/mvpLaunchHardening.gates.test.ts` — PASS (7)
- `yarn jest src/__tests__/unit/account/accountStage1.contract.test.ts` — PASS
- `yarn tsc --noEmit -p tsconfig.json` — PASS

### Device QA
- **Not completed in this sprint for a rebuilt native binary.** JS changes require Metro/Expo Go or a new native build; do not claim an older APK contains this work.
- Recommended NZ Expo Go visual pass: onboarding Skip → legal required; Result report row; held/unheld behaviour after backend deploy of `/api/publication-hold`.

---

## 5. Outstanding technical defects / residual risks

1. Hold persistence requires Postgres; without it, GET defaults to no-hold (POST fails closed).
2. Client fail-closed on hold fetch errors may withhold scores during backend outages (safer legally; UX residual).
3. Inbound share attribution local key still not cleared by Account Privacy actions.
4. Publication-hold API must be deployed to UAT/production backends before holds are operational remotely.
5. Result Highlights / other non-score surfaces under hold may still show some product content — score/share card path is the primary withhold.

---

## 6. Outstanding legal / licensing decisions

1. OFF commercial reuse programme (attribution completeness, share-image residual trademark rights) — counsel.
2. BBFAW / KTC written clearance — send drafts; blocked until response.
3. Privacy/Terms counsel approval and publication.
4. NZ/AU privacy applicability / IPP 3A mapping — counsel.
5. Liability / governing law / entity — founder + counsel.

---

## 7. Founder-only decisions still required

1. Legal entity and jurisdiction.
2. Monitored support / legal / privacy contact emails (set `EXPO_PUBLIC_SUPPORT_EMAIL` / OFF contact).
3. When to publish Privacy/Terms and flip `legalDestinations.*.ready`.
4. Staff dispute intake + whether to enable hold store in production.
5. Whether to send BBFAW/KTC letters as drafted.
6. Separate public launch authorisation (store submit / marketing).

---

## 8. Release go / no-go

**NO-GO for public legal launch** until: entity/contacts set, Privacy/Terms published with readiness flip, OFF contribution remains gated (or consent shipped), BBFAW/KTC path decided, hold backend deployed if relying on holds, and separate launch authorisation given.

**GO for continued closed UAT** of hardening behaviour on this branch after backend deploy of new routes, with drafts remaining unpublished.

---

## 9. Confirmation

- Application scoring behaviour for ordinary non-held products intended unchanged.
- No Premium/auth/billing activation.
- `artifacts/` left untracked.
- No public store submission performed under this instruction.
