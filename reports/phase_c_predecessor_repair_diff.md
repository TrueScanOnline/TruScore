# Phase C §6.1 predecessor repair diff

Workbook sheet: `Signals` (18 rows, 30 columns)  
CSV defect: 31 values per row — unintended blank immediately after `supersedes_signal_id`, shifting `lineage_reference`, `rationale_summary`, and dropping `evidence_policy_version` under header mapping.

## Structural repair (all 18 predecessors)

- Removed blank field after `supersedes_signal_id` (31 → 30 values)
- Restored column alignment for `lineage_reference`, `rationale_summary`, `evidence_policy_version`
- Verified `publishable_from` = empty and `expires_at` = empty (workbook semantics; September successor lifecycle **not** applied to predecessors)
- Verified `supersedes_signal_id` = empty on predecessors

## Per-signal field repairs (CSV before → workbook-aligned after)

### SIG-SR-AU-001 / SIG-SR-AU-002 / SIG-SR-NZ-002
- `review_state`: reviewed → seeded
- `signal_publication_state`: publishable → candidate
- `reviewed_at`: 2026-08-19 → empty (AU-001/002/NZ-002)
- `expires_at`: 2026-08-19 (misaligned) → empty
- Restored `lineage_reference` / `rationale_summary` / `evidence_policy_version` = RVEEL-SIGNALS-MVP-2026-08-v0.2

### SIG-SR-AU-003
- `review_state`: reviewed → seeded
- `signal_publication_state`: publishable → candidate
- `expires_at`: 2026-08-19 → empty
- Restored lineage / rationale / evidence = RVEEL-SIGNALS-MVP-2026-08-v0.3

### SIG-IN-AU-001 … SIG-IN-AU-005 / SIG-IN-GL-001 / SIG-IN-NZ-001 … SIG-IN-NZ-004
- `review_state`: reviewed → seeded
- `signal_publication_state`: publishable → candidate
- `editorial_review_state`: approved → pending (workbook)
- `reviewed_at`: 2026-08-19 → empty (where workbook empty)
- `expires_at`: 2026-08-19 → empty
- Restored lineage / rationale / evidence policy (v0.2 or v0.3 per workbook)

### SIG-IN-GL-002
- Same lifecycle realignment as other IN rows; `reviewed_at` retained where workbook had a date; `expires_at` cleared
- Evidence policy RVEEL-SIGNALS-MVP-2026-08-v0.3

### SIG-IN-NZ-005
- Same as other IN rows; evidence v0.2

### SIG-SR-NZ-003 / SIG-SR-AU-004
- `signal_publication_state`: publishable → candidate
- `expires_at`: 2026-08-19 → empty
- `review_state` / `reviewed_at` left at workbook-reviewed values
- Evidence policy RVEEL-SIGNALS-MVP-2026-08-v0.3

## Explicit non-changes

- No `expires_at=2026-12-31` or evidence policy v0.4 on predecessors (successor-only)
- No reactivation of expired/publishable predecessor heads in place
