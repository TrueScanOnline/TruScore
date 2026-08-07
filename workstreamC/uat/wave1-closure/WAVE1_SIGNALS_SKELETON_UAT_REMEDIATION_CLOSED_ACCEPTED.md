# Wave 1 — Signals Skeleton UAT & Remediation: CLOSED / ACCEPTED

**Milestone status:** **CLOSED / ACCEPTED** (2026-08-07)  
**Scope of this milestone only:** Wave 1 Signals Skeleton UAT, as-built disclosure, architectural remediation, and Claude independent assurance.

## Critical distinction

| Scope | Status |
|-------|--------|
| **Wave 1 — Signals Skeleton UAT & Remediation** | **CLOSED / ACCEPTED** |
| **Wave 1** (broader Chaining & Signals MVP workstream) | **ACTIVE** — not closed |

Do **not** describe the overall Wave 1 Chaining & Signals workstream as closed in repository notes, tags, or status reporting.

Wave 1 continues into founder-approved Chaining & Signals MVP delivery, including:

- integration of the **Rveel Dynamic Signals Asset**;
- broader real-content validation;
- Signal commentary / presentation;
- lifecycle and founder operating controls.

No additional Skeleton-only build or on-device Skeleton UAT cycle is authorised.

## Immutable anchors

| Anchor | Value |
|--------|--------|
| Build 30 baseline SHA | `1c12e339edcaa39572f107a49e906473ba117e38` |
| Final remediation code SHA | `a92be423535c8137bc56b3455e0ed45a7e74c95f` |
| Closure evidence tip SHA | `dece45db6137a3cf5323a4b35d6411d1e97e6a33` |
| Closure tag | `wave1-signals-skeleton-uat-remediation-closure-20260807` |

## Claude assurance outcome

**Determination:** Accept the Wave 1 Signals Skeleton remediation for closure/tagging. **No closure-blocker findings.**

Full report preserved at:

- `claude_wave1_signals_closure_assurance_review_20260807.md`
- `claude_wave1_signals_closure_assurance_review_20260807_1.docx` (original)

Claude independently confirmed (summary):

- one governed public Signals pathway only;
- transitional source mode removed from production;
- Limited Product Data / Web Search Source synthetic Signal generation removed;
- no public preference / My Choices contamination;
- KitKat resolves generically through governed KitKat → Nestlé S.A. chain (not a product-specific patch);
- brand- and parent-level Signal scope behaves correctly;
- ambiguity fails closed;
- `generic_name` cannot establish/override product brand identity;
- sibling brands do not inherit specific-brand Signals;
- duplicate legitimate match paths do not duplicate a Signal;
- normal product resolution does not depend on comprehensive GTIN mapping;
- Safety/Recall matching remains appropriately separated from general Chaining;
- no Workstream A, Workstream B, or TruScore methodology mutation.

## Carry-forward Finding B — integrated Dynamic Signals MVP (non-blocking)

**Not a Skeleton closure blocker.** Address before integrated Dynamic Signals MVP acceptance.

Where normal reviewed product/brand resolution returns unresolved, the normal app runtime does not currently make a final attempt to use an already-existing reviewed GTIN relationship before failing closed.

Current behaviour is **safe** (fails closed; ordinary Signals path does not require comprehensive GTIN coverage).

**Smallest safe correction (during integrated Dynamic Signals implementation):**

1. if normal governed identity resolution fails; **and**
2. a suitable already-existing reviewed GTIN relationship is available;

then allow that reviewed relationship to provide **supplementary** identity evidence before returning unresolved.

Must **not** create:

- a general GTIN-mapping programme;
- a requirement to add GTINs whenever the Rveel Dynamic Signals Asset is updated;
- a broad barcode catalogue;
- weaker fail-closed behaviour where evidence conflicts.

## Carry-forward Finding C — housekeeping (low priority)

`RecallsCard` / `RecallAlertModal` remain only on the unmounted `app/result/[barcode].refactored.tsx` path and are not routed to the live consumer surface.

Record as low-priority cleanup for integrated Dynamic Signals work: delete or clearly quarantine that dead legacy path when convenient. **Do not** create a separate remediation cycle for it.

## Related evidence

- `build30_runtime_and_release_baseline.md`
- `build30_as_built_signals_alerts_inventory.md`
- `build30_signal_producer_matrix.csv`
- `build30_subject_scope_and_product_family_assessment.md`
- `build30_repository_search_and_callsites.md`
- `signals_architectural_remediation_evidence.md`
- `CURSOR_REPLY_20260807.md`
