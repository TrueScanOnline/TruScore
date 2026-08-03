# W5 As-Built Walkthrough — Score Highlights Commentary

**Document type:** Critical Output Integrity as-built demonstration (plain language)  
**Module:** W5 / Critical Output Integrity **#9** — Score Highlights Commentary  
**Authority:** MVP Launch Plan v0.4 §3.1 / §4 / §8 (Partially built — review for priority, brevity, factual restraint)  
**Depends on:** W2 (pillar maths), W3 (confidence is separate), W0 (Result layout)  
**Not this module:** Signal Alert Commentary (#10) / `InsightsCarousel` / preference-driven insights  
**Code baseline:** `scoreHighlightDefinitions.ts` + `generateProductFlags` path  
**Status:** As-built facts only. **Not** product acceptance of commentary copy. Founders + ChatGPT own copy/priority review; Cursor implements approved changes only.

**Date:** 3 August 2026  
**Author:** Cursor (implementation agent)

---

## 1. Purpose

Module #9 asks: after TruScore is calculated, how does Rveel explain the **most important score drivers** in short consumer language?

v0.4 outcome: commentary is concise, correctly prioritised, consistent with evidence, useful to an ordinary consumer, and factually restrained.

W5 answers: **what the live catalogue and UI do today.**

---

## 2. One-picture view (as-built)

```
Product fields (Nutri, NOVA, Eco, additives, brands, ingredients, …)
        ↓
ALL_HIGHLIGHT_DEFINITIONS (41 entries)
        ↓
calculateHighlights → which triggers fire
        ↓
selectHighlights → ranking / top-N per pillar
        ↓
applyOverrideRules → alcohol / legacy mismatch rules
        ↓
generateProductFlags(product, options?)
        ↓
Result UI: “Score highlights:” green list + red list
   (BBFAW/KTC ethics highlights suppressed on live Result)

SEPARATE (#10 — not W5):
  Alerts preferences → generateInsights → InsightsCarousel
```

Highlights **do not** change pillar maths. They are a **commentary layer** on the same underlying data.

---

## 3. Definition library

**File:** `src/config/scoreHighlightDefinitions.ts`  
**Overrides:** `src/config/scoreHighlightOverrides.ts`

| Pillar bucket | Approx. count | Themes |
|---------------|---------------|--------|
| Body | 15 | Nutri A–E, NOVA 1–4, additive caution/avoid, IARC/EWG style flags |
| Planet | 9 | Eco A–E, palm, packaging fallback cues |
| Ethics | 5 | BBFAW ±, KTC ±, certifications |
| Open | 12 | Ingredients, hidden terms, nutrition, origins, ownership-style |
| **Total** | **41** | `ALL_HIGHLIGHT_DEFINITIONS` |

**Each definition typically has:** `id`, `pillar`, `type` (green/red), `severity`, `title`, `description`, `scoreValue` (for **selection ranking**, not for mutating TruScore), `trigger(product)`, optional `alcoholOverride`, optional external resource.

There is **no** explicit `priority` field; priority is derived from `|scoreValue|`, per-pillar caps, and severity sorting.

---

## 4. How highlights are generated

| Function | File | Role |
|----------|------|------|
| `calculateHighlights` | `src/utils/scoreHighlights.ts` | Run triggers; alcohol overrides for some Nutri cases |
| `selectHighlights` | same | Keep high-impact items; top **2 green + 2 red per pillar** by `|scoreValue|`; soft cap 12 **commented as not enforced** |
| `generateProductFlags` | `src/utils/productFlags.ts` | **Live entry point** used by Result UI |
| `applyOverrideRules` | `scoreHighlightOverrides.ts` | Extra suppress/adjust rules |

**Inputs:** product fields only.  
**Not inputs:** overall TruScore number, user Alerts preferences, confidence badge.

**Live Result option:** `suppressBbfawKtcScoreHighlights: true` — hides BBFAW/KTC strip on the main Result TruScore block (those may still appear in TruScore info modal / modular card paths that do not pass the flag).

**Dead / unused helpers:** several older flag generators in `productFlags.ts` are **not** called by `generateProductFlags` (legacy residue).

---

## 5. What the consumer sees

| Surface | Behaviour |
|---------|-----------|
| **Live Result** (`app/result/[barcode].tsx`) | Section **“Score highlights:”** under TruScore; green then red lists with **title + full description** |
| **TruScoreCard** (modular / refactored route) | Same flags; tap can open `ExplainerModal` |
| **TrustScoreInfoModal** | Regenerates flags (BBFAW/KTC **not** suppressed by default) |
| **ProductHeader** | Up to ~3 flag chips |
| **InsightsCarousel** | **Not Score Highlights** — preference insights (#10) |

**Copy sources:**
- Highlight **titles/descriptions:** hardcoded English in the definitions file  
- Section chrome (“positive/negative points” style labels): partial i18n  
- Heading “Score highlights:” on Result: hardcoded English  

Highlight body copy is **not** fully localised for FR/ES in the definitions catalogue.

---

## 6. Relationship to pillars (integrity)

| Fact | Implication |
|------|-------------|
| Highlights re-state drivers (Nutri, Eco, NOVA, …) | Should align with what moved the score |
| Triggers **re-run** helpers (BBFAW/KTC/packaging) independently | If helper vs pillar logic diverges, commentary can disagree with the number |
| Ethics BBFAW/KTC entries often `scoreValue: 0` (informational) | Ranking treats them differently; Result currently suppresses them |
| Soft cap 12 not enforced | Long lists possible on complex products |
| Some Open/ownership triggers appear weak or always-false in catalogue | Dead or non-firing entries can exist |

Score Highlights are **not** Signal Alert Commentary and must not invent original news/regulatory claims (that risk belongs to #10 / Signals).

---

## 7. Specs and doc drift

| Artefact | Role |
|----------|------|
| `Spec documents/Score_Highlights_Specification_v8_20251222.docx` | Cited controlling commentary spec |
| `Spec documents/Score_Highlights_Complete_Rules.csv` | Rules extract; partly **legacy** titles vs live 41-id library |
| Root `SCORE_HIGHLIGHTS_COMPLETE_REFERENCE.md` / CSV | Historical catalogues — **stale vs live definitions** |
| `CROSS_PILLAR_DOC_EXTRACTED.txt` / Cross-Pillar tables | Score value + commentary pairing |
| Phase 2 claim-drift docs | Some Body highlight copy already remediated |

**Founder note:** treat the **live TypeScript catalogue** as as-built truth; CSV/root reference docs need reconciliation during the Highlights review.

---

## 8. Tests

| Present | Missing |
|---------|---------|
| Pillar unit tests cover scoring helpers that triggers also use | **No** dedicated unit tests for `calculateHighlights`, `selectHighlights`, `generateProductFlags`, or definition trigger matrix |

This is a material integrity gap for a consumer-facing commentary layer.

---

## 9. Gaps vs v0.4 (factual only)

| Lens | As-built observation |
|------|----------------------|
| **Priority** | Driven by `|scoreValue|` + top-2 green/red per pillar; soft cap unused → can be verbose |
| **Brevity** | Full descriptions always shown on live Result (not title-only) |
| **Factual restraint** | Mix of remediated claim-safe Body copy and remaining casual imperatives / placeholders (e.g. some Nutri D/E tone; Open hidden-term placeholders; packaging “fallback +N” jargon) |
| **Ordinary usefulness** | Mix of plain language and internal jargon (BBFAW/KTC, packaging fallback); Result suppresses BBFAW/KTC strip but other surfaces may not |
| **i18n** | Definition copy largely English-only |
| **Overrides drift** | Some override rules target **legacy** flag titles no longer emitted by the v8 catalogue |
| **Separation from #10** | Correct at architecture level (`generateInsights` separate) |

---

## 10. What founders / ChatGPT should do with W5

| Action | Owner |
|--------|--------|
| Review live catalogue against Score Highlights Spec v8 + experience promise | Founders + ChatGPT |
| Decide MVP max count, title-only vs title+body, and jargon policy | Founders |
| Mark copy that must be rewritten for factual restraint | Founders + ChatGPT |
| Authorise Cursor to implement approved copy/selection changes only | Founders |
| Keep Signal Alert Commentary (#10) on a **separate** review track | All |

**Cursor will not** rewrite highlight copy from this note alone.

---

## 11. Suggested Claude questions (as-built risk only)

1. Where can highlight triggers disagree with pillar maths because helpers are re-run independently?  
2. Is suppressing BBFAW/KTC on Result but showing them in the info modal an integrity/consistency risk?  
3. Does the unenforced soft cap + full descriptions create a P1 usability issue or only P2 polish?  
4. Which remaining titles/descriptions create claim-governance risk under Phase 2 standards?

---

## 12. Code map

| Concern | Path |
|---------|------|
| Definitions | `src/config/scoreHighlightDefinitions.ts` |
| Overrides | `src/config/scoreHighlightOverrides.ts` |
| Calculate / select | `src/utils/scoreHighlights.ts` |
| Live entry | `src/utils/productFlags.ts` → `generateProductFlags` |
| Result UI | `app/result/[barcode].tsx` |
| Explainer | `src/components/ExplainerModal.tsx` |
| Info modal | `src/components/TrustScoreInfoModal.tsx` |
| #10 (not this) | `src/lib/alertsInsights.ts`, `src/components/InsightsCarousel.tsx` |

---

## 13. Series status & next

| Walkthrough | Focus | Status |
|-------------|-------|--------|
| W0–W4 | Journey, identity, pillars, confidence, Origins/CoM | Done |
| **W5** | **Score Highlights (#9)** | **Done (this doc)** |
| W6 (proposed) | Chaining & Signals + **Signal Alert Commentary** (#7, #10) |

---

*End of W5. No implementation changes were made for this demonstration.*
