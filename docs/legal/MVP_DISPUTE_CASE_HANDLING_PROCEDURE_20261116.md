# MVP dispute case-handling procedure

**Status:** Operational procedure for MVP (email-based). Not a manufacturer portal.  
**Date:** 16 November 2026 (updated 17 November 2026 for Account Trust intake routes)  
**Basis:** Stage 2 B2 §5A + launch hardening + Account Trust Help routes.

## 1. Intake channels

Capture correspondence into a case record as soon as an operator receives it. Opening an in-app mailto draft does **not** create a case.

| Intake type | In-app route (when support email configured) | Case class |
|---|---|---|
| Customer / product factual query | Help → Report incorrect product information | `customer_product_query` |
| Manufacturer / brand-owner correction | Help → Manufacturer review | `manufacturer_factual_correction` |
| Privacy request | Privacy & Data → privacy request categories | `privacy_request` |
| Technical support | Help → Technical support | `technical_support` |
| Legal threat / formal notice | Any channel (email/letter) | `legal_threat` |
| Potential product safety / recall | Any channel; escalate immediately | `product_safety_recall` |
| Security incident | Any channel; escalate immediately | `security_incident` |

If support email is not configured, reporting UI must not claim the channel is operational.

## 2. Case record fields

Minimum fields:

- Case id (e.g. `DISP-YYYYMMDD-###`)
- Case class (table above)
- Received timestamp and channel
- Complainant contact (if provided)
- Barcode/GTIN, product name, brand (when applicable)
- Contested statement / publication state (Rated / NR / Checking / administrative hold)
- Share/preview reference (when applicable)
- Source evidence available at time of complaint
- Methodology / registry context identifiers (internal)
- Actions taken and decision
- Approver for hold release (when used)

## 3. Identity and authority verification

- Consumer product disputes: confirm barcode ↔ pack photo ↔ in-app Result / share URL where available.
- Manufacturer disputes: verify authority to represent the organisation before disclosing case details.
- Privacy requests: use proportionate identity verification through an appropriate secure procedure — do not demand government ID in the ordinary prefilled mailto.

## 4. Evidence preservation

Preserve: originally published statement, barcode, available source evidence, methodology context, date, share/preview reference, subsequent actions. Do not overwrite investigation logs. Do not edit scoring engines to settle a dispute.

## 5. Severity triage

| Severity | Examples |
|---|---|
| P0 | Safety / allergen-critical / wrong recall Signal / security incident |
| P1 | Wrong product identity / barcode association / legal threat |
| P2 | Factual cert / nutrition / benchmark error / privacy request |
| P3 | Methodology disagreement with correct inputs / general technical support |

## 6. Escalation ownership

Until founders configure staffing, escalate P0/P1 to the founder owner (+ counsel when litigation/reputation/privacy risk). Prefer silent containment over public commentary. Do not publish unverified allegations or investigation details.

Named owner slot (configure when staffed): **Founder operations owner — TBD**.

## 7. Correction or temporary withholding

- Correct upstream/local catalogue data where appropriate.
- For material disputes, founder may set an **administrative publication hold** via authenticated `POST /api/publication-hold` (header `X-Rveel-Founder-Admin`).
- Hold is **not** NR or Checking and does **not** alter Score engines.
- Do not fabricate NR or Checking as a takedown state.
- Refer catalogue errors to Open Food Facts when the root cause is OFF data.
- Do not promise automatic takedown of third-party shares.

## 8. Approval and republication

Release hold only after review (`held: false` on the same API). Record who approved republication. Do not automatically release a held assessment without required review.

## 9. Privacy requests

Treat access / correction / deletion-review / complaint categories separately from product disputes. Local clears in Account → Privacy & Data do not complete server deletion. Opening email is not receipt or completion.

## 10. Response to complainant

Send a factual outcome only. No social posting of dispute details. No admission of liability without counsel. No public numeric response-time promises until staffing and legal obligations are assessed.

## Founder-selectable internal targets (not public SLAs)

- P0: same business day escalation  
- P1: identity verification within a small number of business days  
- P2/P3: queued investigation / methodology reply  

Do not publish numeric SLAs in consumer Terms until staffing is confirmed.
