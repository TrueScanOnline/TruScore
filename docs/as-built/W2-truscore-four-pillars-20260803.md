# W2 As-Built Walkthrough — Body, Planet, Ethics, Open & Overall TruScore

**Document type:** Critical Output Integrity as-built demonstration (plain language)  
**Modules:** W2 / Critical Output Integrity **#1–5** — Body, Planet, Ethics, Open, Overall TruScore  
**Authority:** MVP Launch Plan v0.4 §4; Cursor acceptance `docs/cursor-acceptance-mvp-v0.4-20260803.md`
**Document-control addendum:** 4 August 2026 (authority & alignment for Claude review) — see end of this note.

**Depends on:** W0 (journey), W1 (identity & data merge)  
**Code baseline:** Scoring behaviour as implemented under `src/lib/truscoreEngine/` (aligned with handoff baseline `0e91226`)  
**Status:** As-built facts only. **Not** product acceptance of scores. Spec mapping to founder-approved Body/Planet/Ethics/Open documents still required for certification.

**Date:** 3 August 2026  
**Author:** Cursor (implementation agent)

---

## 1. Purpose

Modules #1–5 ask: once a product record exists, how does Rveel turn that data into the four pillar scores and the overall TruScore the consumer sees?

W2 answers in plain language:

1. System shape (0–100 from four equal pillars).  
2. What each pillar uses and how it scores today.  
3. What happens when data is missing.  
4. How the Result UI shows the score.  
5. That **confidence is not part of pillar maths** (links to later W3).  
6. Spec locations and known quirks for founder/Claude review.

---

## 2. System shape (as coded)

```
Product fields (after W1 merge)
        ↓
calculateTruScore  (src/lib/truscoreEngine/index.ts)
   ├── Body   (0–25, floor 2)
   ├── Planet (0–25, floor 0)
   ├── Ethics (0–25, floor 0)
   └── Open   (0–25, floor 0)
        ↓
Overall TruScore = round(Body + Planet + Ethics + Open)  → clamp 0–100
```

| Rule | As-built |
|------|----------|
| Starting point per pillar | **Base 15** |
| Equal weight | Yes — no cross-pillar multipliers |
| Product-path wrapper | `src/utils/trustScore.ts` → `calculateTrustScore` (cache, sufficiency gate) |
| UI recalculation | TruScore card can call `calculateTruScore` directly |

---

## 3. Module #1 — Body

**Files:**  
`src/lib/truscoreEngine/pillars/bodyPillar.ts`  
`src/lib/truscoreEngine/pillars/bodyAdditiveScoring.ts`  
`src/services/additiveDatabase.ts`

### What it uses from the product
- Nutri-Score grade  
- NOVA group  
- Additive tags (+ ingredients text fallback for MVP additive forms)  
- Category (additives only for food / unknown — not cosmetics/pet/household)

### How it scores (high level)

1. Start at **15**.  
2. **Nutri-Score** (if A–E recognised): move toward absolute targets (A→22, B→18, C→14, D→12, E→8) relative to base 15.  
3. **NOVA:** 1 **+3**, 2 **+1**, 3 **−1**, 4 **−6**.  
4. **MVP additives of concern:** yellow **−1**, orange **−3**, red **−6** per match; element sum capped at **8**.  
5. If any **red** MVP additive matched: score cannot exceed **12/25** (`BODY_RED_ADDITIVE_SCORE_CEILING`).  
6. Final clamp: **minimum 2**, maximum **25**.

Header comments state Body **does not** currently apply legacy IARC sweeps, universal irritants, country deltas, or parallel “risky tags” lists for scoring (MVP direction).

### Missing data
- No Nutri-Score → stay neutral on that element.  
- No NOVA → no NOVA adjustment.  
- Non-food category → additives not applied.  
- Empty tags → ingredients text may still match registered MVP forms.

### Tests
`src/__tests__/unit/lib/pillars/bodyPillar.test.ts`  
`src/__tests__/unit/lib/pillars/bodyAdditiveScoring.test.ts`

### Spec location (as found in repo)
Under Database files ethics/spec tree, e.g. Body_Scoring_Specification_V12 / additives guidance — **not** the same folder as top-level `Spec documents/PLANET` / `OPEN`.

---

## 4. Module #2 — Planet

**Files:**  
`src/lib/truscoreEngine/pillars/planetPillar.ts`  
`src/lib/truscoreEngine/pillars/planetPackagingFallback.ts`

### What it uses
- Eco-Score grade (A–E) when valid  
- Else packaging structures / completeness / recycling cues  
- Market / jurisdiction (device / `true_scan_market` / default country — packaging fallback **AU/NZ**; GLOBAL → packaging contribution **0**)

### How it scores (high level)

1. Start at **15**.  
2. If valid Eco-Score: A **+7**, B **+3**, C **−1**, D **−3**, E **−7** — **packaging not scored** when Eco present.  
3. Else packaging fallback (AU/NZ): up to **+2** / **+1** / **0** based on kerbside / completeness rules.  
4. **Palm oil does not change Planet score** in MVP (`palmOilPlanetAdjustment: 0`; display/other surfaces may still show palm).  
5. Clamp **0–25**. On internal Planet error → return base **15**.

### Missing data
- No/invalid Eco → packaging path (often 0).  
- No packaging structure → 0 with neutral note.  
- Non–AU/NZ jurisdiction for packaging path → 0.

### Tests
`planetPillar.test.ts`, `planetPackagingFallback.test.ts`

### Spec location
`Spec documents/PLANET Pillar/Planet_Scoring_Specification_v19.xlsx`  
`Spec documents/PLANET Pillar/Planet_v19_Packaging_Jurisdiction_Rules_Annex_v2.docx`

---

## 5. Module #3 — Ethics

**Files:**  
`src/lib/truscoreEngine/pillars/ethicsPillar.ts`  
`src/lib/truscoreEngine/pillars/ethicsBenchmarkAdapter.ts`  
`src/services/bbfawService.ts`, `ktcService.ts`, `ethicsCertificationsService.ts`

### What it uses
- Brand candidates: `brand_owner` first, then comma-split `brands`  
- Optional shared-identity / frozen-benchmark context for **eligibility**  
- Certification labels / tags / name cues (Fairtrade, RA, ASC, MSC, RSPO, Organic, …)

### How it scores (high level)

1. Start at **15** (“assumes ethical until poor ratings” — as coded comment).  
2. **BBFAW** (if benchmark-eligible): tier and impact band adjustments (e.g. Tier 1 **+6** … Tier 6 **−6**; impact bands similarly). First matching brand candidate wins.  
3. **KTC** (same eligibility): banded adjustments from total benchmark score (from large negatives up to **+10**). First match wins.  
4. **Certifications:** **one scheme only** — highest weight wins (e.g. Fairtrade **+6** … Organic **+2**).  
5. Clamp **0–25**.

If frozen-benchmark eligibility is **false**, BBFAW+KTC movement is forced to **zero**; certifications can still apply.

### Missing data
- No brand / no BBFAW or KTC match → no benchmark movement (stay near base + any certs).  
- No eligible cert → 0 cert adjustment.

### Tests
`ethicsPillar.test.ts`, `ethicsBenchmarkAdapter.test.ts`, plus certifications service tests.

### Spec location
`Database files/ETHICS Pillar/Ethics_Scoring_Specification_37_Cursor_Submit.xlsx`  
`Database files/ETHICS Pillar/CANONICAL_ETHICS_SPEC.txt`  
(No Ethics-named workbook under top-level `Spec documents/`.)

---

## 6. Module #4 — Open

**Files:**  
`src/lib/truscoreEngine/pillars/openPillar.ts`  
`src/lib/truscoreEngine/pillars/openPillarHiddenTerms.ts`

### What it uses
- Ingredients text (`ingredients_text` / `_en`)  
- NOVA (listing-clarity bonus only when no vague hits)  
- Nutriments + serving size  
- Origin / manufacturing place fields and origin-like phrases

### How it scores (high level) — coded against Open v14 header intent

1. Start at **15**.  
2. Ingredients present **+2**; empty/placeholder **−3**.  
3. Vague/hidden-term hits: 1→**−4**, 2→**−8**, ≥3→**−11**.  
4. Zero vague hits + NOVA 1–2 → **+4**; zero + NOVA 3–4 → **+2**.  
5. Nutrition: none **−3**; complete **+3**; partial **+1**.  
6. Origin: none **−4**; “complete” **+4**; partial **0**.  
7. Clamp **0–25**.

**As-built:** Open calculator does **not** score brand-ownership / corporate transparency as a separate ownership DB path (any older comments mentioning Brand DB for Open are stale relative to this file).

### Missing data
Heavy negatives when ingredients, nutrition, or origin are absent — Open tends to **fall when disclosure is thin**, which is intentional in the current formula.

### Tests
`openPillar.test.ts`

### Spec location
`Spec documents/OPEN Pillar.xlsx`

---

## 7. Module #5 — Overall TruScore

**File:** `src/lib/truscoreEngine/index.ts` → `calculateTruScore`

| Behaviour | As-built |
|-----------|----------|
| Combination | Sum of four pillars, round, clamp **0–100** |
| Null product | Returns zeros (all pillars 0, total 0) |
| Exception in engine | Zero result (comments may say “null”; **code returns 0**) |
| Preference / Alerts toggles | Feed **insights**, not pillar maths |
| Sufficiency gate (`calculateTrustScore` wrapper) | May withhold score as `null` for weak sources (e.g. thin web_search) — separate from confidence badge |

Cross-cutting commentary specs (Highlights, cross-pillar tables) live under `Spec documents/` and are **W** topics for Score Highlights (module #9), not the numeric sum itself.

---

## 8. How the Result UI shows this

| Element | Behaviour |
|---------|-----------|
| Large number | Overall TruScore 0–100 with band labels |
| Four bars | Body / Planet / Ethics / Open as **n/25** |
| “How was this scored?” | Analysis / methodology modal path |
| Confidence badge | Shown when `product.confidence` is set — **presentation**, not pillar input |
| Score highlights / flags | Separate commentary layer (module #9) |

Primary UI: `src/components/TruScore.tsx`, TruScore card under `src/features/product/cards/TruScoreCard/`.

---

## 9. Confidence vs score (preview of W3)

| Concept | Role today |
|---------|------------|
| Pillar maths | Independent of confidence |
| Body **12/25** | **Hard score ceiling** when any red MVP additive matches — **not** a “default mid-score” and **not** confidence |
| `product.confidence` | Source-reliability style value for badge / disclosure paths |
| v0.4 position | Existing confidence build **not accepted**; dedicated Confidence Spec required |

Founders should not treat a mid-range TruScore (e.g. near 60 from four×15) as “confident neutral” without separate confidence disclosure — that is exactly why v0.4 elevates Confidence as its own module.

---

## 10. Spec mapping status (honesty)

| Pillar | Code present | Spec in repo | Mapped & founder-accepted? |
|--------|--------------|--------------|----------------------------|
| Body | Yes | Body V12 / additives guidance (Database files tree) | **Not certified by this walkthrough** |
| Planet | Yes | Planet v19 + packaging annex (`Spec documents/`) | **Not certified** |
| Ethics | Yes | Ethics Spec 37 (Database files) | **Not certified** |
| Open | Yes | OPEN Pillar.xlsx (`Spec documents/`) | **Not certified** |
| Overall | Yes | Cross-pillar commentary docs | **Not certified** |

v0.4 workstream status remains: **Built but unverified** — next is explicit code↔spec mapping + Claude Body/Planet data→score review + founder acceptance.

---

## 11. Known quirks (evidenced — for triage, not auto-fixes)

1. Body floor **2** vs other pillars floor **0**.  
2. Red-additive **12/25** can cut an otherwise high Nutri Body score.  
3. IARC may still appear in additive **UI/DB metadata** while Body scoring uses MVP `bodyConcernTier`.  
4. Planet palm tags do not move Planet points.  
5. Eco present → packaging fallback ignored.  
6. Ethics: BBFAW+KTC can stack; certs do **not** stack.  
7. Frozen eligibility can zero benchmarks while leaving base + certs.  
8. Open can score low purely on missing disclosure — expected by formula.  
9. Engine error path returns **0**, not a distinct “unable to score” consumer state (wrapper sufficiency gate is the main null path).  
10. Result may recalculate TruScore on device even when fetch path already scored — consistency depends on same inputs/context.

---

## 12. What founders / ChatGPT should do with W2

| Action | Owner |
|--------|--------|
| Confirm this matches observed scores on representative AU/NZ products | Founders (UAT) |
| Commission formal **code ↔ approved spec** mapping (Body/Planet first, then Ethics/Open) | Founders + ChatGPT; Cursor assists with evidence |
| Send Claude targeted Body/Planet data→score integrity questions (from v0.4 acceptance) | After W1+W2 alignment |
| Do **not** authorise scoring formula changes from this note alone | All |

---

## 13. Suggested Claude questions (this module set)

1. Does Body’s Nutri + NOVA + MVP-additive path (with 12/25 red ceiling) match Body Spec V12 / additives guidance, or has implementation drifted?  
2. Where can missing Eco-Score + GLOBAL packaging jurisdiction produce Planet scores that **look** decisive while evidence is thin?  
3. Are Ethics freeze guards sufficient to stop current-state contamination of BBFAW/KTC outputs?  
4. Does Open’s large missing-data penalties adequately support Open’s promise, or conflate “bad disclosure” with “uncertain product”?  
5. Is returning overall **0** on engine failure vs withholding score (`null`) a consumer-integrity risk?

---

## 14. Code map

| Module | Primary path |
|--------|----------------|
| Orchestrator | `src/lib/truscoreEngine/index.ts` |
| Body | `pillars/bodyPillar.ts`, `bodyAdditiveScoring.ts` |
| Planet | `pillars/planetPillar.ts`, `planetPackagingFallback.ts` |
| Ethics | `pillars/ethicsPillar.ts`, `ethicsBenchmarkAdapter.ts` |
| Open | `pillars/openPillar.ts`, `openPillarHiddenTerms.ts` |
| Wrapper | `src/utils/trustScore.ts` |
| UI | `src/components/TruScore.tsx`, `src/features/product/cards/TruScoreCard/` |
| Tests | `src/__tests__/unit/lib/pillars/*`, `truscoreEngine.test.ts` |

---

## 15. Next walkthrough

| ID | Focus |
|----|--------|
| **W3** | Confidence & missing-data disclosure (module #8) — **demonstrate only**; existing build not accepted pending Confidence Spec |

---

*End of W2. No implementation changes were made for this demonstration.*

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
| **Controlling scope outcome** | *MVP Launch Plan and Scope Baseline* v0.4 §1 / §3.1 Body, Planet, Ethics, Open, Overall TruScore; §4 Critical Outputs **#1–5**; §8 workstream “Four pillars & TruScore — Built but unverified” |
| **Approved scoring specifications (how)** | Body Scoring Spec **V12**; Planet Scoring Spec **v19** (+ packaging annex v2); Ethics Scoring Spec **37**; OPEN Pillar workbook; Cross-Pillar Score & Commentary table **2025-12-22** (paths under `Spec documents/` and `Database files/ETHICS Pillar/`) |
| **Instruction** | Founder response 3 Aug 2026 §3 Critical Output programme; Cursor acceptance W2. Do not treat code presence as acceptance. |

### B. Inferred during development (not expressly specified)

| Behaviour | Classification |
|-----------|----------------|
| Base **15** per pillar and some floor/cap interactions | Must be verified against approved scoring Specs — treat unverified deltas as **spec-mapping work**, not automatic defects |
| Body red-additive ceiling **12/25** | Spec/code interaction; **not** Confidence (v0.4 Decision 4 / founder concern 7) |
| Methodology version string `RVEEL_SCORE_METHODOLOGY_VERSION` 1.4 | Engineering lock — confirm vs Spec versions in certification |

### C. Terminology and version position

| Legacy / alternate | Current | Naming only or functional? |
|--------------------|---------|----------------------------|
| **Care** (Care Scoring Spec v32 CSV; older logs “Care Pillar”) | **Ethics** (v0.4; `ethicsPillar.ts`; Ethics Spec 37) | **Naming only** for the same Ethics pillar path — **not** a defect if logs/docs say Care historically. Functional inconsistency only if a second Care scorer still diverges from Ethics Spec 37 |
| Trust Score | TruScore / Rveel Score | Naming |
| Planet Eco-Score display vs Planet pillar | Related but distinct OFF Eco-Score card vs pillar maths | **Functional distinction** — do not conflate |

### D. Current alignment assessment

**Partially aligned** — implementation present for #1–5; v0.4 status remains **Built but unverified** until code↔Spec mapping and founder acceptance.

**Unable to determine** full numeric Spec conformance without completed Cursor+Claude Spec mapping (especially Body/Planet).

### E. Effect on original W2 findings

| Original finding | Effect |
|------------------|--------|
| Four-pillar assembly, base 15, confidence not in pillar maths | **Remain valid** |
| “Not product acceptance” | **Reinforced** by v0.4 §8 |
| Care vs Ethics | **Clarify:** historical Care = Ethics naming; not a Critical Output defect by itself |

### F. Outstanding authority required

| Need | Owner |
|------|--------|
| **Claude technical review** — Body/Planet data→score integrity | Claude |
| **Further evidence** — representative AU/NZ outcomes vs Spec | Cursor + founders |
| **Founder decision** — accept pillar outputs after mapping | Founders |
| **Approved implementation** — only after Spec deltas are dispositioned | Cursor |

*End of document-control addendum for this workstream. No implementation changes were authorised or made.*
