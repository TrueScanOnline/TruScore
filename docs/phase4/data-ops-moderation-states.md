# Data ops — user submission moderation states

Applies to manual product edits, photos, corrections, and user-contributed metadata (`manualProductService` flows).

## States

| State | Meaning |
|-------|---------|
| **submitted** | Received, not queued or auto-validated only. |
| **pending_review** | In human or rules queue. |
| **approved** | Eligible to affect canonical product or user-private view per policy. |
| **rejected** | Not used; reason code stored. |
| **needs_evidence** | Request more proof from submitter. |
| **disputed** | Conflict with another source or brand challenge. |
| **superseded** | Replaced by newer submission. |
| **archived** | Retained for audit only; not active. |

## Reviewer notes

- Internal-only text; never shown to end user verbatim unless “public response” feature exists.

## Evidence retention

- Store media hashes + URLs with **retention policy** aligned with privacy policy.
- Legal hold overrides deletion.

## Audit trail

- Immutable log: state transitions, actor (system | user id | reviewer id), timestamp.

## App output

| State | User sees |
|-------|-----------|
| pending_review | “Thanks — under review” for contributor; consumers see **prior** canonical data only. |
| approved | Merged per merge rules; may affect score after next fetch/cache bust. |
| rejected | Contributor notified; no public change. |
| needs_evidence | Contributor prompted. |

## Related

- [data-ops-minimum-admin-contract.md](data-ops-minimum-admin-contract.md)
