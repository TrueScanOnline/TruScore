# Wave 3 Bundled Founder UAT — Corrective Pass Evidence

**Disposition:** Final technical closure for targeted Claude re-review. **Do not cut/promote a UAT build** until founder/ChatGPT disposition.

| Field | Value |
|-------|-------|
| Original integrated baseline | `cfe133ce4728a3e2bc5f7787413a76ae0c99f812` |
| First corrective implementation | `0f2f4b1f6ad28b5b5ba6a49f0d504ae13a440dc3` |
| Evidence-stamp tip (pre–Claude closure) | `fa9c57fb3951e331b1f66732a0720aeef2342505` |
| Claude P1/P2 closure | `6515c3d8cfc5f949bc7b1b58231b1d13153b7b1c` |
| Final implementation SHA | _(filled at commit)_ |
| Branch | `fix/wave3-uat-corrective-20260918` |
| Scope | Presentation / routing / interim image UX / TypeScript safety only — **no scoring methodology changes** |

---

## 1. History and founder dispositions

### 1.1 First corrective pass (`cfe133c` → `0f2f4b1`)

Implemented A–F presentation corrections: full-screen S25, Open compact coded list, Nutrition Per serve Details-only, Claims → Nutrition Details, vegetable-oil note only, hero small-URL + prefetch.

### 1.2 Claude independent QA — P1 / P2 findings

| Finding | Issue |
|---------|--------|
| **P1** | Open/Transparency surfaced exact numeric additive counts that could contradict unique S25 `renderedAdditiveIds` (e.g. duplicate raw codes). |
| **P2** | `NutritionTable` kept stale `detailsFocus` when a later Claims open had `initialDetailsFocus = null`. |

### 1.3 Final founder disposition (Claude P1/P2 closure → `6515c3d`)

**Supersedes** the earlier Open dynamic-count requirement:

- The **only** authoritative consumer-facing additive count belongs to **S25 / About these Additives** (`unique(renderedAdditiveIds).length`), including Result-card N reveal and destination count.
- Open three-plus Highlight restored to baseline **number-free** copy (`Several ingredients need decoding` / `Several additives are listed mainly by number…`).
- Open L3 compact list retained; heading is simply **Coded additives** (no N); CTA is **About these Additives** (no number).
- Deterministic code + S25 display-name and single CTA preserved.
- P2: always mirror `initialDetailsFocus`, including `null`, so consecutive Claims opens cannot leave a stale highlight.

### 1.4 TypeScript closure (this tip)

- **TS2322** in `NutritionDetailsModal.tsx` (multi-focus array widening) — **fixed** with `typeof focusTarget === 'string'` narrowing. Multi-nutrient Claims → Nutrition focus behaviour preserved.
- **Accepted remaining:** Nutrition Stage 3 **TS2367** in `governedNutrientAssessment.ts` only.

---

## 2. Methodology / scoring preservation

| Package | Preservation |
|---------|----------------|
| Body / Body-6 / Planet / Open v15 scoring & fired metadata | Unchanged |
| Claims score / state / ledger | Unchanged |
| S25 detection / merge / dedupe / catalogue | Unchanged |
| Nutrition thresholds / large-portion High | Unchanged |
| Open vocabulary (`vegetable oil`) | No matching-set change |
| **W3-UAT-PERF-01** | **OPEN** — interim small-URL/prefetch only |

---

## 3. Changed-file map (cumulative corrective)

### Presentation / routing (A–F + P1/P2)

| Area | Key files |
|------|-----------|
| S25 full-screen + count reveal | `AboutTheseAdditivesModal.tsx`, `AboutTheseAdditivesCard.tsx`, Result session routing |
| Open compact coded (number-free after P1) | `l3/content.ts`, `ScoreHighlightsGovernedL3Modal.tsx`, `openGovernedCopy.ts` |
| Nutrition tables | `NutritionTable.tsx`, `NutritionDetailsModal.tsx` |
| Claims → Nutrition Details + multi-focus | `hostPresentation.ts`, Result barcode, `NutritionDetailsModal.tsx` |
| Image interim | Result barcode (`image_front_small_url` + prefetch) |
| Notes | `OPEN_VOCAB_CANDIDATE_VEGETABLE_OIL.md`, `W3_UAT_PERF_01_BACKLOG.md` |

### This final tip (TS + evidence)

| File | Change |
|------|--------|
| `src/components/NutritionDetailsModal.tsx` | Type-safe `normalizeFocusTargets` (eliminate TS2322) |
| `reports/wave3_uat_corrective/WAVE3_UAT_CORRECTIVE_EVIDENCE.md` | Updated history / dispositions / results |

---

## 4. Automated evidence

### Focused suites (retain ≥184)

```
src/__tests__/unit/wave3/uatCorrective.presentation.test.ts
src/__tests__/unit/lib/scoreHighlights/openGovernedCopy.test.ts
src/__tests__/unit/lib/scoreHighlights/pipelineResolvedCopy.closedSet.test.ts
src/__tests__/unit/lib/scoreHighlights/l3ContentAddendum.test.ts
src/__tests__/unit/s25/aboutTheseAdditives.test.ts
src/__tests__/unit/nutrition/nutritionTablePresentation.contract.test.ts
src/__tests__/unit/lib/claims/claimsRescue.uat.test.ts
```

**Behavioural coverage retained:**

- Open Highlight three-plus coded: number-free baseline wording
- Open L3: heading `Coded additives`, CTA `About these Additives` (no digits)
- Claude fixture `Colour (E102), Antioxidant (E300), Preservative (E102)`: deduped compact list; S25 unique count separate
- Unresolved codes: no invented S25 identities
- About these Additives / merge: unique `renderedAdditiveIds` doctrine
- P2: first Claims focus then second with null → no stale highlight; still opens `nutrition_details`

### TypeScript

```
npx tsc --noEmit -p tsconfig.json
```

Expected: **only** `governedNutrientAssessment.ts(203,16): error TS2367`. **No TS2322. No other new errors.**

---

## 5. Image latency (F)

**W3-UAT-PERF-01 remains OPEN.** Interim prefer `image_front_small_url` + prefetch does not close the backlog item.

---

## Artefacts

- Evidence: `reports/wave3_uat_corrective/WAVE3_UAT_CORRECTIVE_EVIDENCE.md`
- [OPEN_VOCAB_CANDIDATE_VEGETABLE_OIL.md](./OPEN_VOCAB_CANDIDATE_VEGETABLE_OIL.md)
- [W3_UAT_PERF_01_BACKLOG.md](./W3_UAT_PERF_01_BACKLOG.md)
