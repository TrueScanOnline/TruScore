# Data ops — minimum admin / back-office contract

**Not a full product spec** — minimum capabilities to support Phase 4 workflows.

## Roles

- **Reviewer** — approve/reject submissions, attach evidence.
- **Mapping editor** — canonical GTIN, aliases, parent/brand.
- **Cert specialist** — verify certifications, set expiry.
- **Recall editor** — confirm matches, jurisdiction, suppress false positives.

## Screens / APIs (minimum)

1. **Submission queue** — filter by state, market, barcode.
2. **Product record view** — all sources, conflicts, history.
3. **Mapping editor** — CRUD aliases, overrides, audit log viewer.
4. **Cert queue** — pending verifications, expiry dashboard.
5. **Recall inbox** — unmatched high-severity items, fuzzy matches.
6. **Read-only export** — JSON/CSV of decisions for **golden pack** updates.

## SLAs (suggested)

- P0 recall dispute: **4 business hours** first response.
- User submission: **72h** to state change from pending.

## Auth / audit

- SSO + role-based access; all mutations append audit row.

## Implementation note

Today much of this may be **manual** (scripts + DB). This contract defines what a **proper** admin must cover before scale.
