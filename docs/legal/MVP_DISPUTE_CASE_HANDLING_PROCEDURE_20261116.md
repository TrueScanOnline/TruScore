# MVP dispute case-handling procedure

**Status:** Operational procedure for MVP (email-based). Not a manufacturer portal.  
**Date:** 16 November 2026  
**Basis:** Stage 2 B2 §5A + launch hardening implementation.

## 1. Intake

1. Complainant uses in-app **Report incorrect assessment** / Help → Report (only when `EXPO_PUBLIC_SUPPORT_EMAIL` is configured).
2. Capture: barcode/GTIN, product name, brand, disputed statement, share URL, error type, notes, optional reporter contact, app version, platform, timestamp.
3. Assign a case id (e.g. `DISP-YYYYMMDD-###`).

If support email is not configured, reporting UI must not claim the channel is operational.

## 2. Identity verification

Confirm barcode ↔ pack photo ↔ in-app Result / share URL. Quote the exact contested text or number and publication state (Rated / NR / Checking / administrative hold).

## 3. Evidence preservation

Preserve: assessment inputs, pillar breakdown, methodology/registry versions, OFF revision if known, Signals pack version, share-event ids (if any), EA keys if any. Do not overwrite logs while investigating.

## 4. Severity triage

| Severity | Examples |
|---|---|
| P0 | Safety / allergen-critical / wrong recall Signal |
| P1 | Wrong product identity / barcode association |
| P2 | Factual cert / nutrition / benchmark error |
| P3 | Methodology disagreement with correct inputs |

## 5. Founder escalation

Escalate P0/P1 to founder (+ counsel when litigation/reputation risk). Prefer silent containment over public commentary. Do not publish unverified allegations.

## 6. Correction or temporary withholding

- Correct upstream/local catalogue data where appropriate.
- For material disputes, founder may set an **administrative publication hold** via authenticated `POST /api/publication-hold` (header `X-Rveel-Founder-Admin`).
- Hold is **not** NR or Checking and does **not** alter Score engines.
- Refer catalogue errors to Open Food Facts when the root cause is OFF data.

## 7. Approval and republication

Release hold only after review (`held: false` on the same API). Record who approved republication.

## 8. Audit record

Retain: case id, barcode, contested statement, decision, approver, timestamps, hold reason (internal only).

## 9. Response to complainant

Send a factual outcome only. No social posting of dispute details. No admission of liability without counsel.

## Founder-selectable internal targets (not public SLAs)

- P0: same business day escalation  
- P1: identity verification within a small number of business days  
- P2/P3: queued investigation / methodology reply  

Do not publish numeric SLAs in consumer Terms until staffing is confirmed.
