# Phase 6 — Chaining & Signals: Engineering Execution Pack

**Document type:** implementation slicing pack (not a new architecture, not an Agile ticket backlog).  
**Purpose:** Operationalize the **locked** Phase 6 specification set into slices, contracts, file impact, migration order, tests, and release gates with **low rework risk**.

**This pack revision:** v0.3 (2026-04-26). *Prior revision:* v0.2 (2026-04-25).

**Status:** **Ready for pack lock** after **§14** is completed (named owners; §2.2 **(a)/(b)** recorded; exceptions filled). v0.3 is a **final targeted revision** only. Closure detail: **§16**.

**Provenance (non-normative):** A one-time **Formal Revision Memo** (chat agent output; filename `Rveel_Chaining_and_Signals_Engineering_Execution_Pack_Formal_Revision_Memo_20260425_v0.1.docx`) supplied **review feedback** for this document. It is **not** an architecture artefact (unlike Documents 1–6), not part of the **Execution Pack** as maintained text, and **is not** iterated. Feedback was **incorporated** here; the **controlling** engineering baseline is **this** file. A trace of the first review (R1–R8) is in [§15](#15-incorporated-review-feedback-r1r8-one-time-input). A **follow-up** review closure is in [§16](#16-follow-up-revision-memo-closure--v03). Future edits use **this pack** only, under your usual revision control.

**Normative constraints (must be treated as hard requirements in code and CI):**

| ID | Controlling filename | Version | Role |
|----|----------------------|---------|------|
| Doc 1 | `Rveel_Chaining_and_Signals_Architecture_Lock_Memo_Document_1_20260423_v0.1.docx` | v0.1 | Architecture lock / non-corruption boundaries |
| Doc 2 | `Rveel_Chaining_and_Signals_Shared_Identity_Layer_Specification_Document_2_20260424_v0.3.docx` | v0.3 | Shared Identity Layer |
| Doc 2A | `Rveel_Chaining_and_Signals_Shared_Identity_Coverage_Build_and_Stewardship_Plan_Document_2A_20260424_v0.2.docx` | v0.2 | Coverage build & stewardship |
| Doc 3 | `Rveel_Chaining_and_Signals_Frozen_Benchmark_Attribution_Layer_Specification_Document_3_20260424_v0.4.docx` | v0.4 | Frozen BBFAW/KTC benchmark attribution |
| Doc 4 | `Rveel_Chaining_and_Signals_Dynamic_Signals_Attribution_Layer_Specification_Document_4_20260424_v0.3.docx` | v0.3 | Dynamic Signals |
| Doc 5 | `Rveel_Chaining_and_Signals_Field_Level_Implementation_Annex_Document_5_20260424_v0.4.docx` | v0.4 | **Locked / normative** — fields, enums, transitions, persistence |
| Doc 6 | `Rveel_Chaining_and_Signals_Golden_Fixtures_UAT_and_Release_Comparison_Gates_Document_6_20260424_v0.3.docx` | v0.3 | **Locked / normative** — golden fixtures, gates, baselines |

If any earlier draft, internal note, or code comment conflicts with the rows **for Documents 1–6**, **those documents** control. **This Engineering Execution Pack** (markdown) is the team’s **operational** work instructions; it must **conform** to Docs 1–6. A **pack lock** (treat as implementation baseline) is a **separate** team decision, recorded in **§14** (not a seventh normative product doc).

---

## 1. Executive implementation summary

Phase 6 delivers **three governed layers** (shared identity, frozen benchmark attribution, dynamic signals) with **hard separation of mutability**, **explicit ambiguity**, **AU/NZ-first market scoping**, and a **single public consumer contract** for in-app Signals: `ProductScanResult.signals` (Doc 1, 4, 5, 6).

In this repository, the app already has:

- A **Phase 4/5 scan output contract** (`ProductScanResult`) and a **single builder** (`buildProductScanResult`) feeding **one presentation path** (`scanResultPresentation` → banner UI).
- **Ethics scoring** that applies **BBFAW + KTC** from **bundled canonical data** and **in-memory product fields** (`ethicsPillar`, `bbfawService`, `ktcService`, brand resolution).

The execution work is to **align implementation with the locked annex** (Doc 5) and **prove it** (Doc 6), which implies:

1. **Typed, versioned domain contracts** for identity, frozen benchmark rows, and dynamic signal records (even if the first “persistence” is local JSON fixtures + optional remote store).
2. **Enforcement of non-mutation** of frozen benchmark material by dynamic / current-state paths (service boundaries + tests).
3. **Mapping and ordering rules** from normative `signal_id` / `dedupe_key` / class semantics (Doc 4–5) into the **existing** `ProductScanResult.signals` structure without introducing **parallel public UI paths** (Doc 6 Gate E, XL-03).
4. **Fixture pack + CI** implementing Doc 6 minimum set (P0/P1), baseline discipline, and audit outputs.

**Strategic note:** Full operational identity + benchmark **database** may live in a service not present in this repo. This pack still applies: **contracts and ordering are client-relevant**; **migrations** are listed for **wherever** authoritative state is stored, with an explicit **MVP split** (see §6).

---

## 2. Non-negotiable architectural invariants (restated from locked docs)

These are **release blockers** if violated:

1. **Shared identity is a common language, not shared attribution mutability** — identity resolution does not grant authority to rewrite frozen benchmark objects (Doc 1, 2, 5).
2. **Dynamic current-state updates must not mutate frozen benchmark outputs** (Doc 1, 3, 5, 6).  
3. **Current owner** and **benchmark owner** remain **separately representable** and must not be collapsed in storage or in ethics reasoning (Doc 2, 3, 5).  
4. **Ambiguous identity** may **block** benchmark use and/or **block or hold** signal publication; ambiguity must **never be silently collapsed** to a “best guess” (Doc 2, 4, 5).  
5. **Benchmark corrections** produce **superseding versions**; **no history rewrite** of frozen rows (Doc 3, 5, 6).  
6. **`ethics_scoring_eligible` (benchmark)** and **`signal_publication_state` (dynamic)** are **semantically distinct** — separate fields, separate transitions, separate rules (Doc 3, 4, 5).  
7. **No public Signals path may bypass** `ProductScanResult.signals` (Doc 4, 6). Internal helpers may exist only as feeders during transition, subject to **XL-03 sunset rule** (Doc 6).  
8. **AU** and **NZ** are **explicit** market scopes; **`AU+NZ` is constrained** and must **not** be a convenience bucket (Doc 2, 5, 6).  
9. **Lower-level operational entities** (manufacturer, importer, distributor, licensee) are **selective** and **in support of Safety & Regulatory accuracy** when used — not a general identity shortcut (Doc 2, 5).  
10. **Document 5 v0.4** and **Document 6 v0.3** are **normative** for field names, enums, gates, and fixtures — not advisory.

### 2.1 Internal vs public market exposure (Document 2 / 5; R2)

- **`SharedIdentityContext.resolution_key.market_key` (internal)** may include **`AU+NZ` only** when the locked identity layer determines the **same fact** is valid in **both** Australia and New Zealand, per Document 2 and 5. It remains a **constrained** scope, **not** a bin for “unknown” or “we did not split.”
- **`ProductScanResult.market` (public / user-facing contract)** is **`AU` \| `NZ` \| `UNKNOWN` only**. It **MUST NOT** be set to `AU+NZ` or to any merged token for convenience. The app **chooses a single** primary market for display, or `UNKNOWN` when the scan context does not resolve to one exact scope — **not** a substitute for `AU+NZ` internal resolution.
- **Prohibited:** promoting internal `AU+NZ` to the public `ProductScanResult` field, or using `UNKNOWN` to mean “AU+NZ we did not model.”
- **Implementation rule:** one-way projection: **internal identity state** → (optional) public copy fields; public fields **do not** drive `market_key` shortcuts backward.

### 2.2 Single owning module: normative class → `ProductScanResult` buckets, precedence, dedupe (R1, R8)

A **single** module **MUST** own, in one place, for the whole app:

1. Mapping **`signal_class_enum` (Document 5)** → existing **`ProductScanResult.signals` buckets** + `SignalClass` (`A` | `B` | `C` | `D`).
2. **Precedence** ordering and **dedupe** ordering for release-equality and UI ordering (per Document 6, after domain precedence/dedupe).
3. Any **approved MVP mapping exception** (see §3.2), documented in that module’s header, not spread across the codebase.

**MVP required implementation path:** The file **`src/signals/signalRenderMapping.ts`** is the **mandatory** home for the above, unless **Product + Engineering** jointly **approve a single different path in writing** and update this section and all imports in one change set. **Renaming** this file requires the same: one coordinated PR, no orphan logic. `buildProductScanResult.ts` and `scanResultPresentation.ts` (and all other callers) **MUST** import mapping and ordering from that module. **Duplicating** mapping, precedence, or release-order rules elsewhere is **forbidden** for Phase 6 MVP.

**Default class → bucket + `SignalClass` mapping (explicit — R1):**  
- `safety_regulatory` → `signals.safety_regulatory` + `A`  
- `in_the_news` → `signals.transparency` + `B`  
- `my_choices_chain` → `signals.user_preference` + `C`  

**Product / founder status of this default (P0 for lock):** The table above is **(b) provisional** until **Product** grants written approval. Until then, it is an **open product dependency** for **customer-facing** claims and marketing, **but** it is still the **required** engineering default: all implementation and Doc 6 baselines **must** use this table unless and until the pack (§2.2) is **updated in one place** and released with the replacement mapping. **(a) Approved for MVP** is in effect only when **Product** signs the mapping line in **§14** (and this sentence may be edited to read “approved” in the next pack revision, if you choose to record that only in the repo).  
- If Product **rejects** this default, the **same** `signalRenderMapping` module must still exist; the **revised** one-row table replaces §2.2 in a single versioned change—**not** ad hoc branches.

---

## 3. Spec ↔ code tensions (do not silently reconcile)

These are **known deltas**; resolve via **explicit mapping layer + tests**, not by renaming one side in passing.

| Tension | Locked spec (Docs 4–5) | Current app (`TrueScan-FoodScanner`) | Open handling |
|--------|------------------------|--------------------------------------|---------------|
| **Signal class taxonomy (domain)** | `signal_class_enum`: `safety_regulatory`, `in_the_news`, `my_choices_chain` | `SignalCard.class`: `A` \| `B` \| `C` \| `D` (presentation) | **Resolved in this pack (§2.2, §2.2 module):** all mapping is owned by `signalRenderMapping.ts`. Dynamic records carry normative `signal_class` from Doc 5; **no** ad hoc mapping in components. **Do not** re-open Signals IA. |
| **Signals buckets in `ProductScanResult`** | Classes above + publication rules | Four buckets: `safety_regulatory`, `transparency`, `user_preference`, `premium_insight` | **Default MVP mapping in §2.2** (provisional for Product / external claims until **§14**; engineering **must** implement that table for CI). **Order** for release comparison: `signalRenderMapping` only. |
| **Ethics / benchmark** | `FrozenBenchmarkAttributionObject` + `ethics_scoring_eligible` + `freeze_status` + supersede chain | `calculateEthicsPillar(product)` + JSON BBFAW/KTC — no frozen row in DB | **Slice 3+:** introduce **materialized frozen view** (server or build artifact) for MVP scope agreed by team; until then, **containment tests** and **feature flags** limit claims of “frozen immutability” in production. |
| **Market** | `market_key` AU, NZ, constrained `AU+NZ` | `ProductScanResult.market`: `AU` \| `NZ` \| `UNKNOWN` | Extend types to allow **constrained** multi-market only when identity rules satisfy Doc 2/5; **forbid** using `UNKNOWN` as AU+NZ shortcut. |
| **Where state lives** | Doc 5 DDL-style tables (identity, benchmark, dynamic) | Client-only services + local data | **Data model** applies to **authoritative store** (to be selected: e.g. Supabase/Postgres, or staged JSON in repo for offline MVP). Slices name **contract + migration** regardless. |

**Exception record:** If product management locks a **reduced MVP** (e.g. “fixtures-only frozen benchmark in CI, not production DB” ), record it in **§3.2** (not only in prose) and still run **Doc 6** gates for what is claimed shippable.

### 3.1 Release truthfulness: fixture/CI compliance vs production persistence (R5)

These are **different** claims. The pack and marketing/comms must use consistent language.

| State | What the build **may** claim | What it **must not** claim without evidence |
|--------|-----------------------------|-----------------------------------------------|
| **Fixture- or CI-only compliance** | The implementation **matches locked specs** in **automated tests** and **Doc 6** baselines in CI (given `fixture_pack_version` / `fixture_schema_id`). | “Production database enforces all Doc 5 tables,” “all frozen rows are live,” or “end-to-end persistence is complete” if production store is not live. |
| **Production persistence compliance** | User-facing and backend stores **persist** and **enforce** the Doc 5 DDL-style rules (or equivalent) for the **scopes actually deployed**. | Dropping test discipline because “it ships.” |

**Rule:** A release is **“Phase 6 chaining/signals–ready”** for **external** statements only if the **relevant** production persistence and **P0** public gates (see [§11](#11-release-gate-severity-merge--release-candidate--public) — **public-release** row) are satisfied. **CI-only** proof is necessary but **not sufficient** for that claim. Internal engineering may still merge with **merge-tier** gates green while **public** proof is in progress, per §11.

### 3.2 Approved MVP exceptions and transitional constraints (R4)

Each row is **governance for temporary truth**, not a back door on architecture. Changes require **Engineering + Product** sign-off.

| ID | What is allowed temporarily | What it does **not** permit | Owner (required: real name/role) | Product approver of exception (if distinct) | Target exit: milestone, slice, or **release gate to clear** |
|----|----------------------------|----------------------------|-----------------------------------|--------------------------------|-------------------------------------------------------------|
| EX-1 | Legacy ethics: `calculateEthicsPillar(product)` without DB-backed `benchmark_attribution_frozen` in some build flavors | Stating “full Document 3 frozen-benchmark in production” for those flavors | Leighton — Co-Founder, Engineering Implementation Owner | Matt — Co-Founder, Product & Claims Owner | Slice 3 + 4 complete; production DB-backed frozen benchmark attribution active for claimed scope; Doc 6 Gate B passing in production-aligned mode; §3.1 production-persistence truth standard satisfied before any public claim of full Document 3 compliance. |
| EX-2 | Duplicate mapping logic on a short-lived feature branch for spike work only | Merging to `default` / `main` with duplicate rules vs §2.2 | Leighton — Co-Founder, Engineering Implementation Owner | Not required — process exception only | Before merge to `main`/`default`, all mapping, precedence, and dedupe logic consolidated into `src/signals/signalRenderMapping.ts`; no duplicate logic remaining outside the approved owning module. |
| *Add rows* | *…* | *…* | *…* | *…* | *…* |

**Pack lock rule (R4):** The pack is **not** **locked** until the **Owner** and **Product approver** (where applicable) columns list **real assigned people** (or a single formally delegated “acting” owner). Placeholder text such as “— fill before pack lock —” is **not** sufficient for a locked baseline; replace with names before sign-off in **§14**.

---

**R3 / §6 (discipline, near-lock):** In **TypeScript and JSON Schema**, any field for which **Document 5** defines a **closed** enum, literal set, or fixed vocabulary **must** be implemented with that **exact** closed set — **not** a generic `string`. The sketches in **§6** that still show `string` **either** (a) refer to a Document 5 **open-text** or opaque identifier (then keep `string` in code) **or** (b) must be replaced in implementation by the same literal unions as in the annex, even if the markdown sketch still says `string` for space. The rule is: **no silent widening** of types beyond Document 5.

---

## 4. Module / file impact map (repository anchors)

| Concern | Primary locations | Phase 6 touch |
|--------|-------------------|---------------|
| **Normative → render mapping (owner)** | **`src/signals/signalRenderMapping.ts`** (per §2.2) | **Sole** place for class→bucket, `A`–`D`, precedence, and **release order**; no duplicate business rules in other files. |
| Scan output contract | `src/types/scanOutputContract.ts` | Extend only as required by mapping; keep **single** export shape. |
| Scan result builder | `src/services/buildProductScanResult.ts` | Consumes `signalRenderMapping` only; inject identity + dynamic signal inputs; **no alternate public builders** for product UI. |
| Presentation / dedupe / order | `src/utils/scanResultPresentation.ts` | Calls into `signalRenderMapping` for any ordering that must match Doc 6; keep shared `dedupe_key` behavior here or delegate to owner per §2.2. |
| Result screen | `app/result/[barcode].tsx` (and any parallel result screen) | **Must** consume `ProductScanResult` only for signals/scores (no new parallel signal lists for GA). |
| Golden tests | `src/__tests__/golden/scanOutputContract.golden.test.ts` + snapshots | Evolve to **Doc 6** `fixture_id` + baseline artifacts. |
| Terminal / confidence | `src/utils/deriveScanTerminalState.ts`, `src/utils/confidenceScoring.ts` | Align with `confidence_state` / `review_state` from Doc 5 where wired. |
| Ethics / benchmark math | `src/lib/truscoreEngine/pillars/ethicsPillar.ts`, `src/services/bbfawService.ts`, `src/services/ktcService.ts`, brand resolution | Read from **FrozenBenchmarkAttributionObject** (adapter) when frozen path exists; **guard** no write from dynamic. |
| Observability | `src/services/scanObservability.ts` | Optional: events for `signals_built`, fixture run IDs. |
| Docs | `docs/phase4/scan-output-contract.md` | Cross-link Phase 6 annex; no duplicate normative field lists (point to Doc 5). |

**New suggested directories (layer modules may be re-homed; **not** the render-mapping file per §2.2):**

- `src/identity/` — `SharedIdentityContext` resolution, ambiguity flags, `market_key` policy.
- `src/benchmark/` — snapshot selection, `FrozenBenchmarkAttributionObject` materialization, **freeze guards**, supersede.
- `src/dynamicSignals/` — `DynamicSignalAttributionObject` / record pipeline, `signal_id`, `dedupe_key`, publication FSM.
- `src/phase6/` or `src/contracts/phase6/` — shared enums and types **mirroring Document 5** (Word annex remains source of truth).  
- **`src/signals/signalRenderMapping.ts` is required** (§2.2); only **joint** Product+Engineering approval renames it.

---

## 5. Data model and migration strategy

### 5.1 Authoritative tables (per Doc 5)

Normative table names (implement in the **authoritative database** when available):

- `identity_product` (unique `(gtin, market_key)`)
- `benchmark_snapshot` (unique `(benchmark_name, benchmark_cycle, snapshot_version)`)
- `benchmark_attribution_frozen` (unique composite per Doc 5 §8.4)
- `dynamic_signal_record` (unique `signal_id`; index `dedupe_key`)
- `dynamic_signal_editorial_review`, `dynamic_signal_feedback`, `dynamic_signal_queue`, `dynamic_signal_lineage_reference`

### 5.2 Migration order (logical)

1. **Enums + constraints** (check constraints or app-level validation mirroring SQL).
2. **Identity** tables → seed/read paths.
3. **Benchmark snapshot** + **frozen attribution** → read path for ethics adapter.
4. **Dynamic signal** tables → write path isolated from frozen.
5. **Supersede / correction** linkage tables + immutable prior version pointers.
6. **Lineage** tables for audit.

**In-repo MVP without DB:** Versioned **JSON** (or SQLite **local only** with the same unique keys) for fixtures and dev; **CI** still validates invariants. Production migration to Postgres (or other) should **replay** the same constraints.

### 5.3 Versioning

- `fixture_pack_version` and `fixture_schema_id` (Doc 6) for every release comparison.
- `ProductScanResult.scores.methodology_version` already exists — keep; add **`benchmark_snapshot_ref`** / **`identity_normalizer_version`** to contracts when exposed.

---

## 6. Draft TypeScript contracts (align to Doc 5; illustrative) (R3)

> **Document 5 v0.4 is authoritative** for every enum literal and field name. The code block below is a **structural** sketch. **Implementation** must not use an unconstrained `string` for any field that the annex defines as a **closed** enum or literal set (see the **R3** rule in [§3.2](#32-approved-mvp-exceptions-and-transitional-constraints-r4)).  
> For fields that are **genuinely** free text or opaque server-generated IDs in Document 5, `string` in implementation is valid; the sketch marks those in comments.

```ts
// --- Doc 5 §6 — shared enums (literals must match the annex) ---

export type ConfidenceState = 'confirmed' | 'strong' | 'probable' | 'low' | 'rejected';
export type ReviewState = 'seeded' | 'provisional' | 'reviewed' | 'disputed' | 'archived';
export type ResolutionStatus = 'resolved' | 'resolved_with_warning' | 'ambiguous' | 'blocked' | 'needs_review';
export type FreezeStatus = 'draft' | 'frozen' | 'superseded';
export type SignalPublicationState = 'candidate' | 'held_for_review' | 'publishable' | 'suppressed' | 'expired';
export type NormativeSignalClass = 'safety_regulatory' | 'in_the_news' | 'my_choices_chain';

/** Market keys for *identity resolution* (Doc 2 / 5) — not `ProductScanResult.market`. */
export type MarketKeyResolution = 'AU' | 'NZ' | 'AU+NZ';

/** Benchmark name values where Doc 3/5 use BBFAW/KTC only — extend with further literals if the annex lists them. */
export type BenchmarkName = 'BBFAW' | 'KTC';

// --- Doc 2 / 5: SharedIdentityContext ---

export interface SharedIdentityContext {
  // `market_key`: not copied to `ProductScanResult.market` (see §2.1).
  resolution_key: { gtin: string; market_key: MarketKeyResolution };
  canonical: { product_id: string; brand_id: string; current_owner_entity_id?: string };
  operational_entities: {
    manufacturer_id?: string;
    importer_id?: string;
    distributor_id?: string;
    licensee_id?: string;
  };
  quality: {
    confidence_state: ConfidenceState;
    review_state: ReviewState;
    ambiguity_flags: string[];
  };
  lineage: { source_refs: string[]; alias_hits: string[]; normalizer_version: string };
}

// --- Doc 3 / 5: FrozenBenchmarkAttributionObject ---

export interface FrozenBenchmarkAttributionObject {
  snapshot_ref: {
    benchmark_name: BenchmarkName;
    /** Opaque keys per Doc 3/5 cycle semantics — if annex closes these to an enum, use that union. */
    benchmark_cycle: string;
    snapshot_version: string;
    ownership_cutoff_date: string; // ISO 8601 date
  };
  subject_resolution: {
    canonical_brand_id: string;
    benchmark_owner_entity_id: string;
    benchmark_owner_legal_name: string;
  };
  comparison_context: {
    current_owner_entity_id?: string;
    ownership_divergence_flag: boolean;
  };
  state: {
    confidence_state: ConfidenceState;
    review_state: ReviewState;
    resolution_status: ResolutionStatus;
  };
  eligibility: {
    ethics_scoring_eligible: boolean; // Doc 5 naming; Doc 3 semantics
    blocker_flags: string[];
  };
  freeze: { freeze_status: FreezeStatus; lineage_reference: string };
}

// --- Doc 4 / 5: dynamic signal (record-level; then map to ProductScanResult) ---

export interface DynamicSignalAttributionObject {
  signal_id: string;
  dedupe_key: string;
  signal_class: NormativeSignalClass;
  signal_publication_state: SignalPublicationState;
  resolution_key: { gtin: string; market_key: MarketKeyResolution };
  state: {
    confidence_state: ConfidenceState;
    review_state: ReviewState;
    resolution_status: ResolutionStatus;
  };
  lineage_reference: string;
  source_record_id?: string;
  // editorial_queue hooks per Doc 5: priority, due_at, etc.
}

// --- Supersede / snapshot (Doc 3 / 5) ---

export interface BenchmarkSnapshot {
  benchmark_name: BenchmarkName;
  benchmark_cycle: string;
  snapshot_version: string;
  ownership_cutoff_date: string;
  assessment_window?: { start: string; end: string };
  freeze_status: FreezeStatus;
  /** Opaque or URL refs as defined in Doc 3/5. */
  methodology_ref: string;
  seed_ref: string;
}

export interface SupersedeCorrection {
  supersedes_snapshot_version: string;
  new_snapshot_version: string;
  rationale: string;
  approver_ref: string;
  diff_ref: string; // pointer to immutable diff artifact
}
```

**Android / iOS:** The **same** serializable DTOs apply on both platforms if any logic is duplicated; **Doc 6** requires **identical contract interpretation** at the `ProductScanResult` layer.

---

## 7. Implementation slices (controlled)

Each slice: **objective**, **in/out of scope**, **modules/files**, **migrations**, **tests**, **release gate**, **risks**, **acceptance criteria**, **blockers**, **rollback**.

---

### Slice 0 — Foundation alignment

- **Objective:** Lock **code ↔ spec** mapping, add **Phase 6 types/enums** module, add **stub** `src/signals/signalRenderMapping.ts` per **§2.2** (re-exports default mapping only), document **tensions** (§3), and define **feature flags** / phases for partial rollout.
- **In scope:** `src/contracts/phase6/enums.ts` (or similar), **`src/signals/signalRenderMapping.ts`** (stub), architecture note in `docs/phase6/`; CI rule that new signals code imports enums from one module.
- **Out of scope:** New UI design; new product features outside chaining/signals.
- **Files:** New under `src/contracts/phase6/`; touch `src/types/scanOutputContract.ts` only if adding optional metadata fields (backward compatible).
- **Migrations:** Enum tables / check constraints in DB **or** `fixture_schema_id` v1 in JSON.
- **Tests:** Unit test: enum exhaustiveness; no duplicate string literals elsewhere.
- **Release gate:** Doc 6 not required yet; **no regression** in existing `scanOutputContract` golden test.
- **Risks:** None material if types are additive.
- **Acceptance criteria:** One import path for Doc 5 enums; README pointer to controlling doc filenames.
- **Release blockers:** None for shipping if flags default to current behavior.
- **Rollback:** Remove imports; keep enums file for next slice.

---

### Slice 1 — Shared Identity core

- **Objective:** Implement **SharedIdentityContext** resolution for `(gtin, market_key)` with **explicit ambiguity** and **no AU+NZ shortcut** unless rules fire.
- **In scope:** Resolver, normalizer version tagging, `ambiguity_flags`, AU/NZ split behavior (Doc 2).
- **Out of scope:** Full global identity graph; non–AU/NZ markets beyond what MVP allows.
- **Files:** `src/identity/resolveSharedIdentityContext.ts`, `src/identity/marketKey.ts`, wire from `productService` or post-merge hook where product is assembled.
- **Migrations:** `identity_product` + alias tables in authoritative DB; or fixture JSON for dev.
- **Tests:** **ID-01…ID-05** (Doc 6); unit tests for ambiguous collision (**ID-03**), own-label (**ID-04**), post-freeze alias (**ID-05**) as far as in-repo data allows.
- **Release gate:** **Gate A** (identity stability) for included fixtures.
- **Risks:** Performance of resolution; mitigate with cache keyed by `(gtin, market_key)`.
- **Acceptance criteria:** `resolution_status`/`ambiguity` never silent; `market_key` never inferred from “closest region.”
- **Release blockers:** N/A for full product until identity feeds benchmark/dynamic; **P0** fixtures for identity must pass for Phase 6 claim.
- **Rollback:** Feature flag to legacy product fields only; identity output ignored downstream.

---

### Slice 2 — Shared Identity coverage / stewardship (Doc 2A)

- **Objective:** Support **coverage scorecard**, **seed** tracking, and **stewardship** actions (logging, queues) without conflating coverage with benchmark freeze.
- **In scope:** Metrics types, `identity_steward_action_log` or file equivalent; dashboards optional.
- **Out of scope:** Hitting 80% shelf target (program goal, not one sprint).
- **Files:** `src/identity/coverage/`, admin or internal script folder if not in app.
- **Migrations:** `identity_coverage_scorecard`, `identity_seed_source` (when DB exists).
- **Tests:** Schema validation; smoke import of scorecard JSON.
- **Release gate:** No gate on user-facing app if internal-only; **no violation** of identity invariants.
- **Risks:** Scope creep into data science — **keep logging minimal**.
- **Acceptance criteria:** Every stewardship mutation has **actor + reason + timestamp** (Doc 2A spirit).
- **Rollback:** Disable telemetry tables.

---

### Slice 3 — Frozen benchmark attribution machinery (BBFAW/KTC)

- **Objective:** **Materialize** `FrozenBenchmarkAttributionObject` per `benchmark_snapshot` with **`ethics_scoring_eligible`** per Doc 5 §10.1; adapter into **`calculateEthicsPillar`** (or replace internals with adapter output).
- **In scope:** Snapshot read model, **read-only** resolver, divergence flags (`current_owner` vs `benchmark_owner`).
- **Out of scope:** Rewriting `bbfaw2024Canonical.json` at runtime; yo-yo modifiers unless Doc 3 explicitly allows.
- **Files:** `src/benchmark/materializeFrozenAttribution.ts`, `src/benchmark/snapshotSelect.ts`, adapter in `ethicsPillar.ts`.
- **Migrations:** `benchmark_snapshot`, `benchmark_attribution_frozen`; seed from pipeline.
- **Tests:** **FB-01…FB-06** (Doc 6).
- **Release gate:** **Gate B** (immutability) for frozen outputs.
- **Risks:** **Dual path** (old in-memory vs frozen) — mitigate with **single adapter** and tests.
- **Acceptance criteria:** When `ethics_scoring_eligible` false, benchmark-derived **score movement = 0** by default (Doc 5/6).
- **Release blockers:** If production still uses only in-memory path, **document** in **§3.2** (EX-1) and **§3.1**; do not claim full Doc 3 compliance in marketing.

---

### Slice 4 — Freeze guards and superseding correction path

- **Objective:** Enforce **no dynamic write** to `benchmark_attribution_frozen`; **supersede** only for corrections; **diff** stored.
- **In scope:** Service middleware, audit log, `freeze_status` FSM, supersede chain table.
- **Out of scope:** Ad-hoc SQL fixes in production.
- **Files:** `src/benchmark/freezeGuards.ts`, `src/benchmark/supersede.ts`, integration with any API layer.
- **Migrations:** `benchmark_supersede_chain`, `benchmark_version_diff` (or Doc 5 names).
- **Tests:** **FB-05**, **XL-01**; property-style test: “random product refresh does not change frozen row.”
- **Release gate:** **Gate B** + **Correction mode** (Doc 6 §8).
- **Risks:** False positives in guard blocking legitimate **supersede** — use explicit **correction role**.
- **Acceptance criteria:** **No** `UPDATE` to frozen in-place; only new version rows + `superseded` on old.
- **Rollback:** Disable new write APIs; read path unchanged.

---

### Slice 5 — Dynamic Signals attribution core (R6: split responsibilities)

This slice is **two sub-deliverables** with different failure modes. **Do not** conflate them in one “ingestion” task.

#### Slice 5A — Source and candidate ingestion (plumbing; not the publication engine)

- **Objective:** Bring **sources** (recalls, news candidates, My Choices inputs) into **typed candidates** with **`source_record_id` / lineage** and stable keys for dedupe, **without** final publication decisions in the ingester.
- **In scope:** Ingestion adapters, idempotency, raw → candidate row, `injected_clock_reference` for time tests.
- **Out of scope:** `signal_publication_state` **FSM** and class **gates** (that is **5B**).
- **Files:** e.g. `src/dynamicSignals/ingest/*`, import jobs, API clients.
- **Migrations:** Staging or raw tables if needed; must not write **frozen** benchmark.
- **Tests:** Contract tests on parsing; no need to pass full **Gate C** here alone.
- **Release gate (merge tier):** Ingesters do not set `publishable` **without** calling **5B** engine (or merge is blocked in review).
- **Risks:** Ingestion errors mistaken for gating errors — keep logs **separately** tagable.

#### Slice 5B — Publication-state engine, gating, precedence, and lineage (MVP core of Slice 5)

- **Objective:** Implement the **`dynamic_signal_record` lifecycle** per Doc 4–5: **`signal_id`**, **`dedupe_key`**, **`signal_publication_state` FSM**, **class gates** (Doc 5 §10.2), **`blocked` / `needs_review` precedence** (**XL-02**), staleness/expiry, editorial hooks.
- **In scope:** FSM, transitions, guards, **lineage** on the record, queue fields (`priority`, `due_at`, etc. per Doc 5).
- **Out of scope:** Source-specific network code (5A). Non-MVP signal classes.
- **Files:** `src/dynamicSignals/publish/*` or `engine/*`, persistence adapters, **no** direct UI. **No** public UI reads raw DB.
- **Migrations:** `dynamic_signal_*` tables per Doc 5.
- **Tests:** **DS-01…DS-08**; **P0** first. **Gates C + D** at **release-candidate** tier.
- **Risks:** Async editorial **flake** — inject clocks per Doc 6.
- **Acceptance criteria:** If `resolution_status = blocked`, **never** `publishable` (Doc 5 §9). **5B** is the **only** place that may advance publication state.
- **Rollback:** Disable 5A feeds → empty candidates; 5B returns no public signals.

---

### Slice 6 — `ProductScanResult.signals` integration

- **Objective:** **Single** builder path maps 5B outputs + identity into **`ProductScanResult.signals`**; **all** class→bucket and **release order** from **`src/signals/signalRenderMapping.ts`** (§2.2) — not re-derived in the builder.
- **In scope:** `buildProductScanResult.ts`, `scanResultPresentation.ts`, `signalRenderMapping.ts`, i18n keys; **no** new result screen entry points for signals.
- **Out of scope:** Visual redesign; card copy unless required by class gates.
- **Files:** `src/signals/signalRenderMapping.ts`, `src/services/buildProductScanResult.ts`, `src/utils/scanResultPresentation.ts`, `src/types/scanOutputContract.ts` (optional metadata for `normative_class` if needed for tests only).
- **Migrations:** None for shape if additive optional fields only.
- **Tests:** Update golden tests; add ordering assertions per Doc 6.
- **Release gate:** **Gate E**; **iOS + Android** contract parity (Doc 6).
- **Risks:** Order mismatch between platforms — **shared test vectors** in TS, reuse on native if split later.
- **Acceptance criteria:** Banners and any signal UI **only** from `buildProductScanResult` output.
- **Rollback:** Revert builder changes; feature flag off dynamic portion.

---

### Slice 7 — Golden fixture pack + CI / release gates

- **Objective:** Implement **Doc 6** minimum fixture set, **`test_clock`**, **P0/P1** tagging, **baseline** storage, **audit JSON** outputs, wiring into Jest/CI.
- **In scope:** `fixtures/phase6/*.json` (or `src/__tests__/fixtures/phase6/`), harness `runFixture(id)`, `fixture_run_summary.json` generation in CI artifacts.
- **Out of scope:** Full UAT people process; this pack covers **automation** hooks.
- **Files:** `src/__tests__/golden/phase6*.test.ts`, `scripts/phase6-release-compare.ts` (optional), CI workflow YAML.
- **Migrations:** N/A; **`fixture_schema_id`** version file.
- **Tests:** All **P0** required for release; **P1** per policy.
- **Release gate:** Doc 6 §9–11; **XL-03** sunset rule; fail on new public bypass.
- **Risks:** Brittle JSON snapshots — prefer **field-selective** comparison for large payloads.
- **Acceptance criteria:** `release_comparison_diff.json` saved per build id (Doc 6 §8A); approver fields for baseline bump.
- **Release blockers:** **All listed P0 failures**; frozen benchmark change without supersede; blocked→publishable.

---

## 8. Acceptance criteria by slice (summary)

| Slice | Core acceptance |
|------|-----------------|
| 0 | Single enum source; `signalRenderMapping` file exists; no drift in string literals. |
| 1 | Ambiguity explicit; **internal** `market_key` vs **public** `ProductScanResult.market` per §2.1. |
| 2 | Stewardship actions auditable. |
| 3 | Ethics uses frozen object when enabled; `ethics_scoring_eligible` honored. |
| 4 | No in-place frozen mutation; supersede only. |
| 5A / 5B | **5A** ingests; **5B** alone owns FSM, gates, precedence, dedupe rules. |
| 6 | One public path; mapping/order from **one** module (§2.2). |
| 7 | P0 pass; baselines and artifacts per Doc 6; **truthfulness** per §3.1. |

---

## 9. Must-not-break regression list

- `yarn test` (or project equivalent) — **existing** `scanOutputContract.golden.test.ts` must pass unless **baseline** intentionally bumped with **approval** (Doc 6 §11–12).
- `calculateTruScore` / pillar outputs — no unexplained **Ethics** drift when frozen path **disabled** (regression in old path).
- **Single presentation path** — `scanResultPresentation` remains the only banner derivation from `ProductScanResult`; **mapping and order** from `signalRenderMapping.ts` only (§2.2).
- **iOS and Android** — no `Platform.select` that reads **different** `ProductScanResult` shapes for the same product.

---

## 10. Dependencies and deferred items (explicit)

| Item | Dependency | Note |
|------|------------|------|
| Authoritative **database** for identity/benchmark/dynamic | Infra / backend | Client can still run **Doc 6** with **fixtures** + **mock** stores. |
| **Editorial** workflows (queues, SLA) | Ops tooling | Fields exist per Doc 5; full UI may be later. |
| **Dynamic source** ingesters (recalls, news) | Data partnerships | Pipelines plug into **Slice 5A**; **5B** owns publication. |
| **Marketing** claims of “fully frozen in production” | Slices 3–4 in prod + DB | **§3.1** — external claims require matching persistence; see §3. |

---

## 11. Release-gate severity: merge, release-candidate, and public (R7 + Doc 6)

Different failures **block different pipeline stages** — avoid a single undifferentiated “all must be green for every PR.”

| Stage | When it runs | **Must** pass (non-exhaustive) | **May** fail without blocking (examples) | Purpose |
|-------|----------------|--------------------------------|-------------------------------------------|--------|
| **Merge to main (merge gates)** | PR / feature branch to default branch | Lint/typecheck; no regression in **unchanged** golden paths; **5A/5B** not bypassing FSM; **2.2** no duplicate mapping in diff | P1-only Doc 6 fixtures; internal perf | Keep trunk buildable. |
| **Release candidate (RC gates)** | Tagged RC / nightly / pre-store build | **Doc 6** Gates **A–E** on **P0** fixtures; **3.1** truth label matches what is built (e.g. CI+fixtures vs prod DB) | P1 with documented waiver | Ship candidate is spec-tested for **claimed** mode. |
| **Public / store release (public gates)** | App Store / Play public phase | All **RC** items; **§3.1** full **external** claim if marketing says “Phase 6 production”; **P0** zero exceptions; **mobile** contract parity; frozen benchmark immutability **in production** if that is claimed; baseline audit per Doc 6 §8A | *None* for **asserted** scope | **Truthful** public readiness. |

**Blockers (always, at the stage that matches the claim):**  
- **P0** fixtures (Doc 6 §6) for **RC+** on any build that **claims** Phase 6 chaining/signals.  
- **Gates A–E** for **RC+** when Doc 6 is in scope.  
- **Precedence, dedupe, single render path** (Gate D/E) — **RC+**; merge may allow if behind **feature flag** off, explicitly in PR.  
- **Baseline** bump — only with approver, timestamp, rationale, `fixture_pack_version` (Doc 6 §8A).

---

## 12. Required implementation principles (short)

- **Shared identity** = common language; **not** a lever to change frozen rows.  
- **Frozen** BBFAW/KTC outputs **never** updated by dynamic/current-state services.  
- **`ProductScanResult.signals`** = only **public** render contract for app Signals.  
- **Ambiguity** = explicit; no silent default owner or market.  
- **AU / NZ** explicit for public `ProductScanResult.market`; **internal** `market_key` may use constrained **`AU+NZ`** per **§2.1** (never a public shortcut).  
- **Operational entities** = narrow, Safety & Regulatory–driven.  
- **Doc 5 v0.4** and **Doc 6 v0.3** = **normative** implementation constraints.

---

## 13. What this pack is not

- **Not** a new architecture pitch — it follows **Doc 1**.  
- **Not** a **Signals information architecture** redesign (Doc 4 product UX is out of scope here).  
- **Not** an exhaustive **Jira** backlog — convert slices to tickets **per team** after sign-off.  
- **Not** a place to **reconcile** spec/code tensions without recording them in **§3** and the mapping module.

---

## 14. Sign-off checkpoint (pack lock and owners)

**Condition for pack lock:** This **Execution Pack** is **locked** and may be used as the **Phase 6 implementation baseline** only when every item below is checked and names are filled in where required. Re-opening the pack after lock uses normal revision control (not an informal chat loop).

- [x] **Product / claims truthfulness approval** — Confirmed **§3.1** truth labels (fixture/CI vs production) and any public “Phase 6” claims. **Name:** Matt — Co-Founder, Product & Claims Owner **Date:** 20260426
- [x] **Product** — For **§2.2** default class→bucket mapping: **(a) approved for MVP**. **Name:** Matt — Co-Founder, Product & Claims Owner **Date:** 20260426
- [x] **Engineering lead** — Owner of `src/signals/signalRenderMapping.ts` (§2.2) for the release line. **Name:** Leighton — Co-Founder, Engineering Implementation Owner **Date:** 20260426
- [x] **MVP exception owners (§3.2)** — **EX-1** Engineering owner: Leighton — Co-Founder, Engineering Implementation Owner; **EX-1** Product approver: Matt — Co-Founder, Product & Claims Owner; **EX-2** Engineering owner: Leighton — Co-Founder, Engineering Implementation Owner. **Date:** 20260426
- [x] **MVP exception approver** — **Name:** Matt — Co-Founder, Product & Claims Owner
- [x] **Milestones** — Slice 0–2 first; 3–4 ethics integrity; 5A/5B–7 release hardening — acknowledged by engineering lead. **Name:** Leighton — Co-Founder, Engineering Implementation Owner **Date:** 20260426

---

## 15. Incorporated review feedback (R1–R8) — first one-time input

> **Context:** Trace of the **first** Formal Revision Memo (R1–R8) merged at **v0.2** of this pack. That memo is not a normative product artefact.

| Memo ID | How addressed (through **v0.3**) |
|--------|----------------------------------|
| **R1** | **§2.2** default mapping, **MVP / provisional** sentence; **v0.3** removed optional “unresolved” table row. |
| **R2** | **§2.1** public vs internal `market`. |
| **R3** | **§3.2** R3 rule; **§6** tighter aliases (`MarketKeyResolution`, `BenchmarkName`), link to R3. |
| **R4** | **§3.2** table + **§14** owners. |
| **R5** | **§3.1** |
| **R6** | **5A / 5B** |
| **R7** | **§11** |
| **R8** | **§2.2** mandatory `signalRenderMapping.ts` |

---

## 16. Follow-up revision memo — closure (v0.3)

*Review basis: **Engineering Pack v0.2**. This section records the **second** (follow-up) review and how **v0.3** closed or refined items.*

| Item | Closure in **v0.3** |
|------|---------------------|
| **R1** (partial) | **Explicit (b) provisional** for the §2.2 default until **Product** signs in **§14**; path to (a) documented. |
| **R2** | **Closed** — no material change. |
| **R3** (partial) | **R3** rule in **§3.2**; **§6** `MarketKeyResolution` / `BenchmarkName`; stricter `DynamicSignalAttributionObject.market_key`. |
| **R4** (partial) | **Table** extended with approver, target exit, gate; **§14** and “fill before lock” rule; real names still **required in §3.2 / §14 to lock** (P0 for org). |
| **R5** | **Closed** — polish only. |
| **R6, R7** | **Closed** — no change. |
| **R8** (partial) | **§2.2** reworded as **MVP required path**; “proposed” language removed. |
| **P0 (follow-up)** | Provisional mapping **(b)** explicit; R3 string discipline; R4 owners; R8 firming; **opening** polish; **optional unresolved row removed**; **§14** strengthened. |
| **P1 (follow-up)** | **§14** named **Product**, **Engineering**, **MVP exception** lines; **§16** records follow-up. |

*End of execution pack **v0.3** (2026-04-26). **Controlling** product/implementation spec: **Documents 1–6** (table at top). This **markdown file** is the **Execution Pack**; revise under your normal **change control** after pack lock. Baseline: **v0.3** once **§14** is complete (see **Condition for pack lock**).*
