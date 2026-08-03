# W3 As-Built Walkthrough — Confidence & Missing-Data Disclosure

**Document type:** Critical Output Integrity as-built demonstration (plain language)  
**Module:** W3 / Critical Output Integrity **#8** — Confidence & missing-data disclosure  
**Authority:** MVP Launch Plan v0.4 §5 Decision 4 / §8 / §12; Cursor acceptance `docs/cursor-acceptance-mvp-v0.4-20260803.md`
**Document-control addendum:** 4 August 2026 (authority & alignment for Claude review) — see end of this note.

**Depends on:** W0 (journey), W1 (identity/merge), W2 (pillar maths)  
**Code baseline:** Behaviour under `src/utils/confidenceScoring.ts`, `buildProductScanResult.ts`, Result UI  
**Status:** **Demonstrate only.** Existing confidence build is **not founder-accepted**. No Confidence Spec yet — **do not** implement new confidence rules from this note.

**Date:** 3 August 2026  
**Author:** Cursor (implementation agent)

---

## 1. Purpose & controlling reminder

v0.4 requires confidence to be:

- **Separate from score** at pillar and overall level  
- Honest about weak / incomplete evidence  
- Free of “default mid-score looking confidently neutral”  

**Founder decision already locked:** review the existing code → write a **Confidence and Evidence Specification** → Claude review → only then implement approved changes.

W3 only answers: **what does the app do today?**

---

## 2. One-picture view (as-built)

```
Product.source (string)
        ↓
getSourceConfidence / applyConfidenceScore
   → product.confidence (0–1) + sourceReliability (high|medium|low)
        ↓
┌───────────────────────┬──────────────────────────────────┐
│ UI ConfidenceBadge    │ ProductScanResult.confidence     │
│ (mostly source tier)  │ (source + completeness blend +   │
│                       │  web-search cap)                 │
└───────────────────────┴──────────────────────────────────┘
        ↓                              ↓
Shown next to TruScore          Contract / telemetry
(if product.confidence set)     (not a second on-screen badge)

PARALLEL (not confidence maths):
  • Pillar scores (base 15 each → can total ~60 with thin data)
  • hasSufficientDataForTrustScore → trust_score null → “Insufficient Data”
  • Open pillar penalties for missing disclosure
  • ProductDataLimitationsCard / partial banner / unknown product
  • CoM contribution “verified/community/disputed” (different meaning)
```

---

## 3. How “confidence” is computed today

### 3.1 Source-tier confidence (product field)

**File:** `src/utils/confidenceScoring.ts`

| Function | Role |
|----------|------|
| `getSourceConfidence(source)` | Table lookup → `{ confidence: 0–1, reliability }` |
| `applyConfidenceScore(product)` | Writes `product.confidence` and `product.sourceReliability` |
| `getConfidenceLabel` / `getConfidenceDescription` | Badge / modal copy helpers |

**Input:** essentially **`Product.source` only** (which database/API stamped the record).

**Examples (as coded):**

| Reliability | Approx. sources | Approx. value |
|-------------|-----------------|---------------|
| High | OFF, FSANZ, USDA, GS1 | ~0.85–0.95 |
| Medium | Some retailers, other Open Facts families, some barcode APIs | ~0.55–0.75 |
| Low | Weaker free APIs, web search | ~0.30–0.50 |
| Unknown / missing source | Falls back to **0.50 / medium** | |

There is **no** per-field evidence quality model (e.g. “missing ingredients → lower confidence”) in this table.

### 3.2 Scan-contract confidence (blend)

**File:** `src/services/buildProductScanResult.ts` — `effectiveConfidence()`

Adds a **completeness blend** and caps web-search-style products lower (~0.45). Labels via `confidenceLabelFromNumeric` (≥0.8 high, ≥0.55 medium, else low).

**Important as-built gap:** the on-screen **ConfidenceBadge** follows **product** source reliability; it does **not** clearly render the blended `ProductScanResult.confidence`. The two can diverge.

---

## 4. Where it is attached in the pipeline

| Stage | What happens |
|-------|----------------|
| After fetch / merge | `applyConfidenceScore` in optimized/legacy product services and cache paths |
| TruScore wrapper | `calculateTrustScore` does **not** compute confidence; may set `trust_score: null` on sufficiency fail |
| Scan assembly | `buildProductScanResult` sets contract `confidence: { value, label }` |
| Null product | Contract confidence forced to `{ value: 0, label: 'low' }` |

---

## 5. What the consumer sees today

### 5.1 Confidence badge

**Component:** `src/components/ConfidenceBadge.tsx`  
**Shown on Result** when `product.confidence !== undefined` (beside TruScore).

Visible labels (hardcoded / helper): **High confidence** / **Medium confidence** / **Low confidence** (colour-coded).

**TrustScoreInfoModal** has a “Data Quality & Confidence Score” section explaining the three tiers in source-reliability language.

### 5.2 When there is no TruScore (sufficiency)

**Gate:** `hasSufficientDataForTrustScore` in `src/utils/trustScore.ts`

| Outcome | Consumer UI |
|---------|-------------|
| Gate fails | `trust_score: null` → **“Insufficient Data”** card + message inviting OFF contribution |
| OFF / sqlite source | Generally still allowed to score |
| Web-search / thin other sources | Stricter checks (quality/completion/fields) |

This is a **score withhold**, not a confidence downgrade of a mid-score.

### 5.3 Other missing-data surfaces (parallel to confidence)

| Surface | What it does |
|---------|----------------|
| **Partial analysis banner** | `terminal_state === 'partial'` — “Analysis still updating…” |
| **ProductDataLimitationsCard** | Flags incomplete ingredients / countries style gaps |
| **Synthetic transparency signals** | e.g. limited_data / web_search_source flags in scan contract |
| **Open pillar (W2)** | Numeric penalties for missing ingredients/nutrition/origin — **score**, not badge |
| **Unknown Product page (W0)** | No TruScore / no confidence badge on that branch |
| **CoM contribution states** | verified / community / unverified / disputed — **contribution trust**, not scan source confidence |

Some i18n keys for older “web search notice” / “minimal data” style copy appear unused by current TS references.

---

## 6. Hard separation from score (confirmed)

| Fact | Meaning for founders |
|------|----------------------|
| Pillar calculators **do not read** `confidence` | Confidence cannot currently lower Body/Planet/Ethics/Open points |
| Body **12/25** | Red-additive **score ceiling** (W2) — **not** a confidence label |
| Base **15 × 4 = 60** | Thin-evidence products can still land near a **mid overall score** while badge may say Medium/High if source is OFF |
| Engine failure returning **0** | Different from `trust_score: null` insufficient-data path |

This is the core tension with v0.4’s “default must not masquerade as confident neutral.”

---

## 7. Gaps vs v0.4 intent (factual only)

| v0.4 intent | As-built today |
|-------------|----------------|
| Confidence separate from score at **pillar and overall** | Overall **source-tier** (and unused-on-UI blend) only — **no pillar-level confidence** |
| Explain material evidence weakness | Badge/modal explain **source tier**, not “missing X / conflicting Y” |
| Default / fallback must not look confidently neutral | Unknown source → **medium 0.5**; OFF thin products can still score ~60 with High/Medium badge |
| Dedicated Confidence Spec | **Not written yet** — required before Cursor remediates |
| Single coherent consumer meaning of “confidence” | At least three meanings in UI/code: source reliability, scan-contract blend, CoM verification state |

**Doc drift note:** `docs/phase4/confidence-and-coverage-rules.md` describes broader rules than the runtime paths above; treat runtime as as-built truth until the new Spec supersedes both.

---

## 8. Tests (coverage honesty)

| Present | Missing / weak |
|---------|----------------|
| Golden scan contract includes confidence snapshots | No dedicated unit suite for `confidenceScoring.ts` |
| `deriveScanTerminalState` tests null score → partial | Little/no direct test of badge vs `effectiveConfidence` divergence |
| Body tests cover **12/25 score ceiling** | That is score, not confidence |

---

## 9. What founders / ChatGPT should do with W3

| Action | Owner |
|--------|--------|
| Treat this as the **as-built baseline** for the Confidence Spec | Founders + ChatGPT |
| Decide whether mid-score + High/Medium badge on thin OFF data is acceptable for MVP | Founders |
| Specify pillar-level vs overall-only confidence | Confidence Spec |
| Specify relationship to Open penalties, sufficiency null, and CoM verification language | Confidence Spec |
| Send Claude privacy/integrity questions only after Spec draft exists (or as “current risk” review of as-built) | Founders |

**Cursor will not** change confidence maths, badge copy, or withhold rules from this walkthrough alone.

---

## 10. Suggested Claude questions (as-built risk only)

1. Can OFF-sourced products with sparse fields present **High confidence + mid TruScore** in a way that is misleading under v0.4’s honesty principle?  
2. Is the dual path (product badge vs blended scan-contract confidence) a maintainability / integrity risk?  
3. Should sufficiency (`trust_score: null`) and confidence downgrade be one system or remain separate?  
4. Does Body’s 12/25 ceiling risk being misread by consumers or reviewers as “low confidence”?

---

## 11. Code map

| Concern | Path |
|---------|------|
| Source confidence | `src/utils/confidenceScoring.ts` |
| Completeness helper | `src/utils/dataCompleteness.ts` |
| Scan blend + flags | `src/services/buildProductScanResult.ts` |
| Sufficiency / null score | `src/utils/trustScore.ts` |
| Terminal state | `src/utils/deriveScanTerminalState.ts` |
| Badge | `src/components/ConfidenceBadge.tsx` |
| Info modal | `src/components/TrustScoreInfoModal.tsx` |
| Result wiring | `app/result/[barcode].tsx` |
| Limitations card | `src/components/productLegal/ProductDataLimitationsCard.tsx` |

---

## 12. Series status & next

| Walkthrough | Module focus | Status |
|-------------|--------------|--------|
| W0 | End-to-end journey | Done |
| W1 | Identity & data merge (#12) | Done |
| W2 | Four pillars + overall (#1–5) | Done |
| **W3** | **Confidence (#8)** | **Done (this doc)** |
| W4 (proposed) | Product Origins / CoM as-built (#6) — demo only; Origins Spec pending |
| W5 (proposed) | Score Highlights Commentary (#9) |
| W6 (proposed) | Chaining & Signals + Signal commentary (#7, #10) |
| W7 (proposed) | Contributions & verification (#13) |
| W8 (proposed) | Sharing (#11) |
| W9 (proposed) | Scan-result assembly (#14) |
| W10–W11 | Admin inventory; monitoring inventory |

---

*End of W3. No implementation changes were made for this demonstration.*

---

## Document-control addendum — Authority & alignment (4 August 2026)

**Addendum type:** Document-control and review preparation for Claude (not a re-implementation).  
**Scope of change:** Authority citation, terminology position, alignment assessment, effect on original findings, outstanding authority.  
**Original technical evidence:** Remains the body of this note unless expressly revised below.  
**Implementation authority:** None — this addendum does **not** authorise code changes, inferred requirements, or redesign.

**Controlling scope document (shared):**  
*Rveel MVP Launch Plan and Scope Baseline* (**v0.4**, **3 August 2026**) — external file `Rveel_MVP_Launch_Plan_and_Scope_Baseline_20260803_v0_4.docx` (Desktop; not stored in this repo). Also referred to by founders as the MVP Scope Document v0.4.

**Companion founder/ChatGPT instruction:**  
*Rveel Response to Cursor Review and Submission of MVP Scope v0.4* (**3 August 2026**) — `Rveel_Response_to_Cursor_and_v0_4_Submission_20260803.docx`.

**In-repo acceptance mirror:** `docs/cursor-acceptance-mvp-v0.4-20260803.md` (**3 August 2026**).

**Status vocabulary:** Use **Post-MVP** for capability expressly excluded from the current MVP plan in v0.4 §3.3 / §13 (do not use alternate labels such as “deferred cosmetic” for those items).


### A. Controlling specification / instruction for this workstream

| Field | Value |
|-------|-------|
| **Controlling scope outcome** | *MVP Launch Plan and Scope Baseline* v0.4 §3.1 **Confidence & missing-data disclosure**; §4 Critical Output **#8**; §5 Decision **4**; §8 “Confidence — Existing build not accepted”; §12 **Confidence and Evidence Specification** (follow-on) |
| **Approved Confidence Spec** | **None** — deliberately pending |
| **Instruction** | Founder response 3 Aug 2026 concern **7**; Cursor acceptance §3 Confidence row |

### B. Inferred during development (not expressly specified)

| Behaviour | Classification |
|-----------|----------------|
| Source-tier `product.confidence` from `Product.source` table | **Inferred / historical** — not founder-accepted Confidence model |
| Scan-contract confidence blend / web-search cap | Engineering contract field — **not** accepted consumer Confidence |
| Mid-range pillar totals from base 15 looking “neutral” | Exactly the risk v0.4 Decision 4 targets — **demo finding**, Spec will govern remediation |

### C. Terminology and version position

| Legacy / alternate | Current | Naming only or functional? |
|--------------------|---------|----------------------------|
| CoM “verified / community / disputed” | Contribution verification state (W4/W7) | **Functional different concept** from Critical Output #8 Confidence — do not treat as Confidence Spec |
| Body 12/25 additive ceiling | Score ceiling | **Not** Confidence — naming confusion risk only |

### D. Current alignment assessment

**Not aligned** with the v0.4 §3.1 MVP Required outcome (confidence separate at pillar **and** overall; weak evidence explained; no confident-neutral masquerade).

**Unable to determine** detailed thresholds/evidence rules — **no approved Confidence Spec**.

### E. Effect on original W3 findings

| Original finding | Effect |
|------------------|--------|
| As-built source-tier confidence inventory | **Remain valid** |
| “Existing build not accepted” | **Confirmed** by controlling Scope §8 — **specification gap** (and current misalignment), not a claim that no code exists |
| Remediation details | **Must wait** for Confidence and Evidence Specification — not inventable |

### F. Outstanding authority required

| Need | Owner |
|------|--------|
| **Follow-on specification** — Confidence and Evidence Specification | Founders + ChatGPT |
| **Claude technical review** — confidence vs score ceilings presentation | Claude after Spec / with Spec draft |
| **Approved implementation** — only after Spec | Cursor |

*End of document-control addendum for this workstream. No implementation changes were authorised or made.*
