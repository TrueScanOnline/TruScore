# Founder MVP recall decisions — Stage 2 control note

**Date:** 5 August 2026  
**Status:** Controlling plain-English founder decisions for Stage 2 MVP scope  
**Supporting architecture:** v1.1 design remains supporting reference — **not** expanded for MVP  
**Stage 2 / commit / build / submit:** **Not authorised** under this note  

---

## 1. Can these decisions be implemented cleanly within v1.1?

**Yes.** The founder decisions are a **narrowing** of v1.1, not a contradiction.

| Founder decision | v1.1 fit |
|------------------|----------|
| One pathway at a time; old brand matching off when new matcher enabled for that recall | Fits per-notice cutover; MVP simplifies to a **single** active path for the MILO notice without exposing a multi-state activation UI to founders |
| Unavailable (no verified barcode) rather than broad brand fallback | Fits fail-closed / hold — **not** `legacy_active` brand publish after corrected path is chosen for that recall |
| Preserve v0.4 for audit only | Fits immutable v0.4 + superseding assets |
| MILO: barcode + batch + Aug 2026 BB both required | Fits one `batch_and_date` rule group |
| Five consumer outcomes including powder N/A | Fits five `match_state`s |
| One updating Safety card via `ProductScanResult.signals` | Fits stable dedupe (`notice_id` + GTIN), no `match_state` in key |
| Manual batch + BB; no OCR; fixed tests; score isolation | Fits Stage 2 defaults already in v1.1 |
| Defer Pams / Alfamino / Pak’n Save until IDs verified; no broad matching to keep tests | Fits held / not-in-corrected-path — **do not** keep SL003/SL002/SL004 brand publish in the corrected pathway |

**Only nuance (not a blocker):** v1.1’s multi-value `activation_status` model is richer than founders need to *see*. MVP implementation can use a minimal internal switch (“corrected matcher on for this notice” vs “not available for scan alerts”) while keeping v1.1 states as future-capability notes.

---

## 2. v1.1 → future-capability (not Stage 2 MVP)

| v1.1 topic | Stage 2 MVP? |
|------------|--------------|
| Full activation state machine UI / multi-notice orchestration | **Future** — MVP: one recall (MILO), one path at a time |
| General date-precision engine (day/year/many formats) | **Future** — MVP: recognise **August 2026 / end August 2026** only for MILO |
| Pams / Alfamino / Pak’n Save full mappings | **Future** (after verified product IDs) |
| Non-GTIN / store-made / retailer SKU / location | **Future** — separate founder decision |
| OCR; automated ingestion | **Out of MVP** |
| Final recall-expiry / lifecycle policy | **Out of MVP** (schema may stub; no policy) |
| Multi-jurisdiction notice catalogue ops | **Future** |
| Rich validation-gate product for all notices | **MVP:** gates for MILO assets only; general catalogue gates later |

**Still required in Stage 2 MVP (from v1.1):** exact GTIN match; rule-group conjunction (batch **and** BB); stable card identity; state-driven severity; no “safe” wording; family membership only via explicit reviewed GTIN; injected/fixed test clock; score isolation.

---

## 3. Is any design amendment genuinely required?

**No structural redesign.** Optional clarifying amendments (documentation only, when founders want them versioned):

1. State explicitly that once the corrected MILO path is enabled, **SL001 must not publish** consumer alerts (v0.4 retained for audit only).  
2. State that other `SIG_REG_*` notices **must not** keep brand-wide Skeleton publish in the corrected consumer pathway merely for coverage — leave them **unavailable** until exact IDs exist.  
3. Narrow MILO date matching to **August 2026 / end-Aug 2026** recognition — not a general calendar engine.  
4. Collapse founder-facing activation to: **corrected matcher active** | **unavailable for scan alerts** (internal detail may still mirror v1.1).

These are scope clarifications, not architecture changes.

---

## 4. Reduced Stage 2 file and test scope

### Files (MVP)

| Area | Scope |
|------|--------|
| `src/workstreamC/recall/*` | Types, MILO-oriented normalize (batch + Aug-2026 BB), matcher, map → publication record, path guard (no dual publish) |
| `workstreamC/c-data/v0.4.1/` (or equivalent) | **MILO notice only:** variants, rule group (batch∧BB), family membership for reviewed snack-bar GTINs; leave other recalls unavailable |
| Runtime publication entry | Route MILO Safety through matcher; suppress SL001 when corrected path on; News unchanged |
| `app/result/[barcode].tsx` + Signal card | Manual batch + best-before fields; one updating Safety card |
| Unit tests | § below |
| **Not in MVP** | OCR, ingestion jobs, Pams/Alfamino/Pak’n Save assets, non-GTIN matcher, expiry policy engine |

### Tests (MVP)

| Test | Expected |
|------|----------|
| Affected MILO barcode + listed batch + Aug 2026 BB | `confirmed_affected` |
| Affected barcode, batch or BB missing/invalid | `batch_check_required` |
| Affected barcode, complete nonmatching details | `batch_not_listed` (no “safe”) |
| Reviewed other MILO Snack Bar barcode, not on affected list | `related_recall_variant_unconfirmed` |
| MILO powder (e.g. known powder GTIN) | `not_applicable` |
| Card state update same dedupe_key | No duplicate cards |
| Flag-off / score isolation | No recall card / identical TruScore |
| Fixed test clock | No wall-clock dependency |
| Corrected path on → SL001 does not also publish | Single pathway |

Defer: multi-notice cutover matrix, end-of-month general engine, Pams/Alfamino/Pak’n Save, non-GTIN hold suite (beyond “unavailable”).

---

## 5. Remaining verified-GTIN evidence (MILO)

Official FSANZ variants: Dipped **270g / 960g / 160g**; Original **210g**; BB end Aug 2026; listed batches.

| Need | Status |
|------|--------|
| At least **one** verified affected retail barcode for a listed MILO Snack Bar pack | Candidate **`9300605100114`** (OFF: MILO Dipped Snack Bars with White Choc) — **founder must confirm** which official pack (270/160/960) it is |
| Verified barcodes for the **other** affected packs (remaining of 270/160/960/210) | **Still required** from packaging / manufacturer / founder aisle evidence — not assumed known |
| At least **one** explicitly reviewed **other** MILO Snack Bar barcode **not** on the affected list (related-family case) | **Founder supply** |
| MILO powder barcode for N/A | Candidate **`9300605003811`** (OFF Milo 750g powder) — founder confirm for UAT |
| Batch list | From notice (already known in design): dipped `5316TD15`…`5322TD15`; original `5323TD15`,`5324TD15` |
| BB recognition | August 2026 / end August 2026 only for MVP |

Without founder confirmation of pack↔GTIN for affected variants, Stage 2 can still be coded against **fixtures**, but **on-device UAT / production enablement** for confirmed_affected should wait on verified IDs.

---

## 6. Revised implementation estimate (Stage 2 MVP)

| Slice | Estimate |
|-------|----------|
| Matcher + rule group (batch∧Aug-2026 BB) + types + path guard | ~1.5–2.5 days |
| MILO v0.4.1 assets + suppress SL001 when enabled | ~0.5–1 day |
| Result UI: batch + BB entry, state copy, one card | ~1–2 days |
| Unit tests (MVP matrix) | ~1 day |
| **Total** | **~4–6.5 engineering days** after Stage 2 authorisation |

Depends on timely founder GTIN confirmations for positive / related cases.

---

## 7. Confirmations

| Item | |
|------|--|
| Implement / commit / build / submit / testers | **None under this instruction** |
| v0.4 preserved for history | **Yes** |
| Broad brand matching in corrected pathway | **Must not remain** for enabled recalls |
| Controlling for Stage 2 | **This founder decision note**; v1.1 = supporting architecture |

*End of control note.*
