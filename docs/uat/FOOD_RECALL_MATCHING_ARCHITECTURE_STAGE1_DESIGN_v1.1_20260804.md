# Food Recall Matching Architecture — Stage 1 Design Package

**Document version:** **v1.1 (candidate)**  
**Date:** 4 August 2026  
**Supersedes:** Stage 1 design package v1.0 (`FOOD_RECALL_MATCHING_ARCHITECTURE_STAGE1_DESIGN_20260804.md`)  
**Instruction base:** Founder *Food Recall Matching Architecture and Codebase Integration Design* + 4 Aug 2026 revision points 1–9  
**Git base:** `1dcc7c11ca4820674258032bc594ca4e82c2f411`  
**Stage:** **1 — Design only**  
**Status:** Revised candidate for founder review. **Stage 2 not authorised.**

### Standing constraints

| Constraint | Status |
|------------|--------|
| `family_match_tokens` | **Not approved** — do not continue |
| Workstream C v0.4 | **Immutable** — superseding patch root proposed as `v0.4.1` |
| Workstream A / B | **Not modified** |
| Public recall path | Only `ProductScanResult.signals` — no legacy banner / second pathway |
| Stage 2 / commit / EAS / submit / testers | **Not authorised under this instruction** |

**Amendment register:** `docs/uat/FOOD_RECALL_MATCHING_ARCHITECTURE_STAGE1_AMENDMENT_REGISTER_v1.1_20260804.md`

---

## 1. Concise current as-built flow (`1dcc7c1`)

```
Camera / manual GTIN
  → product lookup
  → app/result/[barcode].tsx
  → resolveSharedIdentityContext → scanMarketPublic
  → buildWorkstreamCRuntimePublicationRecords  [EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT==='1']
       → v0.4 embedded pack
       → identity chain (brand/alias → brand_id/parent_id)
       → subject-link match (brand | parent | Alfamino name heuristic)
       → DynamicSignalPublicationRecord (valid_until far-future)
  → buildProductScanResult → ProductScanResult.signals
  → flattenSignalsOrdered: Safety then News
  → TruScore independent of Signals
```

**Gap:** No specialised recall matcher; no affected-variant GTIN / batch-date model; Safety recalls can publish brand-wide (over-fire). Legacy `product.recalls` banners already off product-result path.

**Insertion point:** After identity + GTIN are known; matcher decides recall applicability; News subject links unchanged.  
**Principle:** Identity determines *what was scanned*; recall matcher determines *whether that exact variant / batch / date satisfies an official recall rule*.

---

## 2. Target architecture (v1.1)

```
Scan + identity (gtin, brand_id, parent_id, market, …)
        │
        ▼
┌───────────────────────────────────────────────┐
│ For each recall_notice eligible for market:   │
│   activation_status == active_new_path ?      │
│     → FoodRecallMatcher → MatchResult         │
│     → map to ONE Safety card (stable dedupe)│
│   else (legacy_active):                       │
│     → existing v0.4 subject-link Safety path  │
│   never both for same notice/signal           │
└───────────────────────────────────────────────┘
        │
        ▼
ProductScanResult.signals.safety_regulatory
(+ In the News unchanged; Safety before News)
```

Stage 2 scope default: **verified scannable affected-product identifiers (GTIN) only**. Non-GTIN recalls → fail-closed **hold** (see §10).

---

## 3. Five match outcomes

| `match_state` | Condition | Publish Safety card? |
|---------------|-----------|----------------------|
| `confirmed_affected` | Exact **verified** affected GTIN **and** all required conditions in **one** rule group match | Yes — highest severity |
| `batch_check_required` | Exact verified affected GTIN; required batch and/or date **missing** (not malformed) | Yes — medium / action |
| `batch_not_listed` | Exact verified affected GTIN; **complete** required inputs present and normalized; **no** rule group fully matches | Yes — lower than confirmed; **never** imply “safe” |
| `related_recall_variant_unconfirmed` | No exact affected GTIN; **explicit reviewed** family membership mapping exists | Yes — advisory severity |
| `not_applicable` | No exact GTIN; no verified family membership | **No** card |

---

## 4. Stable card identity and state transitions (Point 1)

### 4.1 Stable public card key

**Stable dedupe / card identity (public):**

```
dedupe_key = `p6|food_recall|{recall_notice_id}|{scanned_gtin}`
```

Equivalent Signal card `id` / publication identity must be derived from **`recall_notice_id` + scanned GTIN` only**.

| Included in stable key | Excluded from stable key |
|------------------------|---------------------------|
| `recall_notice_id` | `match_state` |
| scanned GTIN | submitted batch/date |
| | `evaluated_at` |
| | severity / presentation tier |

`signal_id` is owned by the notice (§11); it is **not** required in the dedupe key if `recall_notice_id` is globally unique, but may appear on the card as display/lineage metadata.

### 4.2 One card, state updates

For one notice + one scanned GTIN:

1. First evaluation with exact affected GTIN and no batch/date → publish card with `match_state=batch_check_required`.  
2. User submits batch/date → **re-run matcher** for that notice+GTIN.  
3. Replace card **payload** (state, copy, severity, evidence fields) in place.  
4. Because `dedupe_key` is unchanged, assembly/`dedupeSignalCards` keeps **one** card — no duplicate.

```
batch_check_required ──(complete matching rule group)──► confirmed_affected
batch_check_required ──(complete non-matching inputs)──► batch_not_listed
batch_check_required ──(partial / malformed)──────────► stay batch_check_required
                                                         + validation_message
                                                         (NOT batch_not_listed)
```

`related_recall_variant_unconfirmed` and exact-GTIN states are mutually exclusive for the same notice (exact GTIN path wins). Switching from related→exact only occurs if GTIN mapping is later verified and activation data updated — still same `dedupe_key` if the scanned GTIN is unchanged.

### 4.3 Multiple notices

Two different `recall_notice_id`s for the same GTIN → **two** cards (two stable keys). Same notice must never emit two cards.

---

## 5. Explicit batch/date rule semantics (Point 2)

### 5.1 Rule groups (atomic conjunction)

Batch/date criteria are organised as **`recall_rule_group`** rows under a `recall_variant_id`.

| Entity | Role |
|--------|------|
| `recall_rule_group` | One alternative “affected set” for a variant (OR across groups) |
| `requirement_mode` | `batch_only` \| `date_only` \| `batch_and_date` |
| Child criteria | Batch code(s) and/or date constraint(s) **belonging to that group only** |

**Matching rule:** A group matches only if **every** requirement of that group is satisfied.  
**Confirmed:** At least **one** whole group matches.  
**Forbidden:** Taking a batch from group A and a date from group B.

Example (MILO dipped variant): one group may require `batch_code ∈ {5316TD15,…}` **AND** `date_marking` matches BEST BEFORE END AUG 2026 boundaries — both in the **same** group.

### 5.2 Outcomes for user input

| User input situation | Result |
|----------------------|--------|
| Exact affected GTIN; **no** required fields entered | `batch_check_required` |
| Exact affected GTIN; **partial** input (e.g. batch entered, date required but missing) | `batch_check_required` + `input_status=partial` — **not** `batch_not_listed` |
| Exact affected GTIN; **malformed** batch and/or date (fails normalization / parse) | `batch_check_required` + `input_status=malformed` + validation reason — **not** `batch_not_listed`; **not** `confirmed_affected` |
| Exact affected GTIN; all required fields present & normalized; **no** group fully matches | `batch_not_listed` |
| Exact affected GTIN; all required fields present & normalized; **≥1** group fully matches | `confirmed_affected` |

**Definition:** `batch_not_listed` requires **complete, well-formed** required inputs for the variant’s rule mode. Partial/malformed never qualify.

### 5.3 Modes

| `requirement_mode` | Required for “complete” |
|--------------------|-------------------------|
| `batch_only` | Valid normalized batch |
| `date_only` | Valid normalized date (at declared precision) |
| `batch_and_date` | Both valid |

---

## 6. Matching algorithm (revised)

```
evaluateFoodRecallMatch(notice, gtin, batch?, date?, clock):
  if notice.activation_status == held_non_gtin: return not_applicable + reason held
  if notice.activation_status != active_new_path: (caller uses legacy path instead)

  variant = findVerifiedAffectedVariant(notice, gtin)  # gtin_review_status=verified

  if variant:
    mode = variant.requirement_mode / rule groups
    classify input: missing | partial | malformed | complete
    if input != complete:
      return batch_check_required (never batch_not_listed / confirmed)
    if any rule_group fully matches (conjunction within group only):
      return confirmed_affected
    return batch_not_listed

  # No exact verified affected GTIN
  membership = findReviewedFamilyMembership(notice, gtin)  # explicit mapping only
  if membership.review_status == reviewed AND identifiers verified:
    return related_recall_variant_unconfirmed
  return not_applicable   # missing/unverified membership → fail closed, no advisory
```

Never: evaluate batch before exact GTIN; publish on brand/parent/name similarity; combine cross-group criteria.

---

## 7. Governed product-family membership (Point 3)

### 7.1 Identifier for public family membership

Public membership **must** use an **explicit reviewed mapping** keyed by a **governed product identifier**:

| Allowed membership key | Notes |
|------------------------|-------|
| **Reviewed retail GTIN** (primary for Stage 2) | Row in `recall_family_membership` with `product_identifier_type=gtin`, `product_identifier_value=<gtin>`, `review_status=reviewed` |
| Other governed product identifier | Only if founders later approve a typed ID (e.g. verified internal SKU) — **out of Stage 2 default** |

**Not allowed** for public membership: brand_id alone; parent_id alone; pack_size alone; product-name similarity; unreviewed category tags; fuzzy text.

### 7.2 Fail closed

| Membership row state | Public result |
|----------------------|---------------|
| No row for scanned GTIN | `not_applicable` — **no** related-family advisory |
| Row `under_review` / `rejected` / unverified identifier | `not_applicable` — **no** advisory |
| Row `reviewed` + verified identifier + active notice | `related_recall_variant_unconfirmed` (when not an exact affected variant) |

Affected variants with `gtin_review_status=verified` are exact-path; they need not duplicate family membership, but family ID on the variant links advisory scope for unlisted same-family GTINs that **do** have membership rows.

---

## 8. Atomic per-notice migration (Point 4)

### 8.1 Activation model (replaces broad SL001–SL004 disable)

Each `recall_notice` carries:

| `activation_status` | Meaning |
|---------------------|---------|
| `legacy_active` | Public Safety card only via **v0.4 subject-link** path for this `signal_id` / notice |
| `ready_pending_cutover` | New assets+tests green; **not** yet public |
| `active_new_path` | Public Safety card **only** via FoodRecallMatcher |
| `held_non_gtin` | Unsupported without verified scannable IDs — **no** public recall from either path |
| `retired` | No public recall |

### 8.2 Atomic cutover per notice

```
Preconditions for active_new_path:
  - notice + families + verified variants + rule groups valid
  - validation gates pass (§12)
  - automated tests for this notice green
  - activation flip is a single atomic asset/version field update

On cutover for notice N:
  - matcher may publish for N
  - legacy subject-link publish for N’s signal_id is suppressed
  - no window where both publish N
  - other notices remain on their own status (no global SL001–SL004 kill switch)
```

### 8.3 Dual-publish and gap prevention

| Control | Rule |
|---------|------|
| Dual publish | Runtime: if `activation_status==active_new_path`, skip legacy Safety link for that `signal_id`; if `legacy_active`, skip matcher publish for that notice |
| Premature disable | Forbidden: cannot set `active_new_path` without readiness gates |
| Gap | Forbidden: cannot set legacy off without `active_new_path` or `held_non_gtin`/`retired` |
| Rollback | Set notice back to `legacy_active` (single path). Matcher must not publish while `legacy_active`. |

v0.4 CSV files remain immutable; suppression is via **activation registry** in v0.4.1 (or build-time config), not by rewriting v0.4.

---

## 9. State-driven severity and presentation (Point 5)

Generic presentation metadata on the match result / card — **keyed by `match_state`**, never by individual `signal_id`:

| `match_state` | `severity_tier` | `urgency` | `consumer_tone` | UI emphasis |
|---------------|-----------------|-----------|-----------------|-------------|
| `confirmed_affected` | `critical` | `immediate` | `do_not_consume` | Highest (hazard + action) |
| `batch_check_required` | `high` | `action_needed` | `check_markings` | Medium-high; input fields |
| `batch_not_listed` | `moderate` | `inform` | `not_listed_no_safe_claim` | Medium; mandatory non-safety disclaimer |
| `related_recall_variant_unconfirmed` | `advisory` | `inform` | `family_notice_unconfirmed` | Lowest visible recall tier |

Copy templates bind to `match_state` + shared notice fields (hazard, URL). **No** `switch(signal_id)`.

---

## 10. Date granularity (Point 6)

### 10.1 Date fields on rules / match evidence

| Field | Purpose |
|-------|---------|
| `official_date_text` | Exact official wording, e.g. `BEST BEFORE END AUG 2026` |
| `date_marking_type` | `best_before` \| `use_by` \| `expiry` \| `packed_on` \| `none_specified` |
| `date_precision` | `day` \| `month` \| `year` \| `end_of_month` \| `unspecified` |
| `normalized_range_start` | Inclusive ISO lower bound (UTC date or datetime per policy) |
| `normalized_range_end` | Inclusive ISO upper bound |
| `comparison_rule` | How user date is tested against the range |

### 10.2 Example: BEST BEFORE END AUG 2026

| Field | Value |
|-------|--------|
| `official_date_text` | `BEST BEFORE END AUG 2026` |
| `date_marking_type` | `best_before` |
| `date_precision` | `end_of_month` |
| `normalized_range_start` | `2026-08-01` (or notice-specific if narrower) |
| `normalized_range_end` | `2026-08-31` |
| `comparison_rule` | `user_date_within_inclusive_range` **or** `user_month_equals_2026-08` for month-only user input |

User date normalization must respect declared precision (day vs month). Month-precision user input compared with `end_of_month` official precision uses month equality / inclusive month bounds — documented in tests.

---

## 11. Non-GTIN recall scope (Point 7)

**Stage 2 is limited to recalls with verified scannable affected-product identifiers (retail GTINs).**

| Case | Treatment |
|------|-----------|
| Verified affected GTIN(s) | Full matcher states |
| Store-made / non-GTIN (e.g. Pak’n Save Moorhouse bread, `SIG_REG_NZ_002`) | `activation_status=held_non_gtin` — **fail closed**; **no** legacy brand-wide publish once held; **no** improvised broad matcher |
| Future retailer-SKU / store / location model | **Separate founder decision** — not Stage 2 |

While `held_non_gtin`, public result is no Safety recall card from this notice (In the News may still apply via its own rules).

---

## 12. Relational integrity and validation (Point 8)

### 12.1 Ownership of `signal_id`

**`recall_notice` is the authoritative owner of `signal_id`.**

| Asset | `signal_id` |
|-------|-------------|
| `recall_notices` | **Required** — source of truth |
| Child tables (families, variants, rule groups, membership, batch rules) | **Omit `signal_id`** — join via `recall_notice_id` / parent FKs only |

If a denormalized `signal_id` is ever cached on a child for performance, validation must assert equality with the parent notice or fail the asset pack.

### 12.2 Simplified FK graph

```
recall_notice (notice_id, signal_id, activation_status, …)
  ├── recall_product_family (family_id → notice_id)
  ├── recall_affected_variant (variant_id → notice_id, family_id?, gtin, gtin_review_status, …)
  │     └── recall_rule_group (group_id → variant_id, requirement_mode)
  │           ├── recall_batch_criterion (→ group_id)
  │           └── recall_date_criterion (→ group_id, official_date_text, precision, bounds, …)
  └── recall_family_membership (→ notice_id, family_id, product_identifier_type/value, review_status)
```

### 12.3 Validation gates (block `active_new_path`)

| Gate | Fail if |
|------|---------|
| Orphan FKs | Child references missing parent |
| Duplicate mappings | Same verified GTIN → two variants on one notice; duplicate membership keys |
| Unknown Signal | `signal_id` not in governed Signal catalogue / notice unknown |
| Unsupported review status | e.g. membership/variant not `reviewed`/`verified` where required |
| Incomplete rules | Variant `active` with empty rule groups when mode requires criteria |
| Malformed dates | Missing precision/bounds; unparseable `official_date_text` without bounds |
| Unsafe activation | `active_new_path` while legacy still enabled for same notice; or dual-path config |
| Non-GTIN activation | Attempt to activate new path without verified GTIN variants → must be `held_non_gtin` |

---

## 13. Proposed types (summary deltas from v1.0)

```ts
type FoodRecallMatchState =
  | 'confirmed_affected'
  | 'batch_check_required'
  | 'batch_not_listed'
  | 'related_recall_variant_unconfirmed'
  | 'not_applicable';

type InputStatus = 'missing' | 'partial' | 'malformed' | 'complete';

type RequirementMode = 'batch_only' | 'date_only' | 'batch_and_date';

type DatePrecision = 'day' | 'month' | 'year' | 'end_of_month' | 'unspecified';

type ActivationStatus =
  | 'legacy_active'
  | 'ready_pending_cutover'
  | 'active_new_path'
  | 'held_non_gtin'
  | 'retired';

type SeverityTier = 'critical' | 'high' | 'moderate' | 'advisory';

// Stable card identity — NO match_state
// dedupe_key = `p6|food_recall|${recall_notice_id}|${scanned_gtin}`
```

Match result includes: `match_state`, `input_status?`, `severity_tier`, `recall_notice_id`, `matched_gtin`, raw/normalized batch & date, `match_reason_code`, `consumer_message_key`, `official_source_url`, `evaluated_at` (injected clock), rule-group id when confirmed.

---

## 14. Consumer wording (unchanged intent)

- **confirmed_affected:** Food recall — this batch is affected. Do not consume; follow official instructions.  
- **batch_check_required:** Selected batches recalled — check batch code and date marking (+ manual fields).  
- **batch_not_listed:** Other batches recalled; entered details not listed. **Also:** This does not independently confirm the product is safe.  
- **related_…_unconfirmed:** Recall for selected variants in this family; barcode not identified as listed affected variant.  
- **not_applicable:** No Safety recall card.

---

## 15. File-by-file Stage 2 proposal (not implemented)

| Path | Role |
|------|------|
| `src/workstreamC/recall/*` | Types, normalize, rule-group eval, matcher, map-to-publication, activation guard |
| `workstreamC/c-data/v0.4.1/` | Notices, families, variants, rule groups, criteria, membership, activation |
| `workstreamCRuntimePublicationRecords.ts` | Per-notice: matcher **or** legacy link — never both |
| `app/result/[barcode].tsx` | Hold card identity; re-evaluate on batch/date submit |
| Signal card UI | Severity from `match_state` metadata |
| Tests | §16 matrix |

A/B trees untouched; v0.4 input CSVs untouched.

---

## 16. Test matrix additions (Point 9) + retained core

| ID | Test |
|----|------|
| **A1** | Card state replacement without duplication (`batch_check_required` → `confirmed_affected` / `batch_not_listed`, same dedupe_key) |
| **A2** | Same-rule batch/date conjunction (batch from group A + date from group B must **not** confirm) |
| **A3** | Partial input → `batch_check_required`, not `batch_not_listed` |
| **A4** | Malformed input → `batch_check_required` + malformed, not `batch_not_listed` |
| **A5** | Missing/unverified family membership → `not_applicable`, no advisory |
| **A6** | End-of-month date precision (`BEST BEFORE END AUG 2026` bounds) |
| **A7** | Atomic legacy/new-path cutover (no dual publish) |
| **A8** | Rollback restores single legacy path |
| **A9** | Multiple simultaneous recall notices → distinct cards |
| **A10** | Unsupported non-GTIN recall → `held_non_gtin`, no public card |
| T1–T4 | Exact GTIN confirmed / check required / not listed / malformed (core) |
| T5–T7 | Related family / under-review GTIN / MILO powder N/A |
| T8–T11 | KitKat; Pams sprouts; unrelated Pams |
| T12–T15 | Ordering; flag off/on; TruScore isolation |
| T16–T20 | Fail-closed; fixed clock |

---

## 17. MILO / NZ reference (v1.1 notes)

**MILO (FSANZ):** Dipped 270/960/160g + Original 210g; BEST BEFORE END AUG 2026; listed batches. Only `9300605100114` is a known retail candidate — pack/variant verification still founder-owned. Unverified packs → no confirmed; powder → `not_applicable`.  

**Pams:** Exact GTIN founder-supplied when verified; unrelated Pams → N/A for sprouts notice; News may still show.  

**PAK'nSAVE Moorhouse:** `held_non_gtin` until separate founder decision on non-GTIN model.

---

## 18. Migration of current Safety links (per-notice)

| Link / Signal | Until ready | When ready |
|---------------|-------------|------------|
| SL001 / `SIG_REG_AU_001` | `legacy_active` (known over-fire risk accepted only until cutover) | `active_new_path` with verified GTINs + rule groups; legacy suppressed **for this notice only** |
| SL002 / `SIG_REG_AU_002` | `legacy_active` or earlier `held` if founders prefer | Exact GTIN + batches when verified |
| SL003 / `SIG_REG_NZ_001` | `legacy_active` until GTIN+rules ready | `active_new_path` |
| SL004 / `SIG_REG_NZ_002` | Prefer **`held_non_gtin`** (no improvised matcher) | Separate non-GTIN decision |

No global simultaneous disable of SL001–SL004.

---

## 19. Lifecycle

Schema supports official status, display/review dates, injected clock. **No** 3-month expiry implementation. 365/7/90 remain provisional defaults. Skeleton UAT may stay time-stable.

---

## 20. Open founder decisions

1. Verify MILO pack↔GTIN mappings.  
2. Supply Pams sprouts GTIN(s) + batch/date rules.  
3. Cutover order among AU/NZ notices.  
4. Whether SL004 goes to `held_non_gtin` immediately at Stage 2 start.  
5. Legal finalisation of non-safety disclaimer copy.  
6. Authorise Stage 2 only after approving **v1.1**.

---

## 21. Confirmations

| Item | |
|------|--|
| Design version | **v1.1 candidate** |
| Stage 2 implemented | **No** |
| Commit | **No** |
| EAS / submit / testers | **None** |
| Workstream C v0.4 preserved | **Yes** |
| Workstreams A/B modified | **No** |
| Expo session | Not used for builds |

*End of Stage 1 design package v1.1.*
