# S25 — About these Additives — Implementation Evidence

**Brief:** Wave 3 S25 v0.2 (catalogue MVP asset v0.7)  
**Worktree:** `C:\TrueScan-FoodScanner-wt-s25-674d1fe`  
**Branch:** `feat/s25-about-these-additives-v07`

## Baseline and tip

| Item | SHA |
|------|-----|
| Founder-approved baseline (ancestry) | `674d1fe48d500393a4c19d75859bcaa3b512768c` |
| Tip (see git log after commits) | *(filled at commit time)* |

## Asset ingestion counts

Generated via `node scripts/generate-s25-asset-runtime.js` → committed under `src/s25/assets/`.

| Metric | Count |
|--------|------:|
| Catalogue rows | 315 |
| Standard rows (`body6_existing=false`) | 309 |
| BODY6_EXISTING rows | 6 |
| `evidence_enabled=true` (standard) | 33 |
| Of those with `evidence_source_count=2` | 7 |
| Unique `additive_id` | 315 (0 duplicates) |
| Classes_25 | 25 |
| Source_Profiles | 11 |
| Surface_Copy keys | 8 |

Manifest: `src/s25/assets/ingestion_manifest.json`.

## Changed-file list (implementation)

### Asset / module
- `scripts/generate-s25-asset-runtime.js` (+ `.ts` twin)
- `scripts/generate-s25-rendering-evidence.js`
- `src/s25/assets/catalogue_315.json`
- `src/s25/assets/classes_25.json`
- `src/s25/assets/source_profiles.json`
- `src/s25/assets/surface_copy.json`
- `src/s25/assets/ingestion_manifest.json`
- `src/s25/types.ts`, `loadAsset.ts`, `normalize.ts`, `resolveClass.ts`, `detectBody6.ts`, `detectStandard.ts`, `merge.ts`, `glyphs.ts`, `index.ts`

### UI / Result / L3
- `src/components/AboutTheseAdditivesModal.tsx` (canonical merged destination)
- `src/components/AboutTheseAdditivesCard.tsx` (conditional Result card)
- `src/components/InfoModal.tsx` (caller-aware Back + scrollToY)
- `src/components/ScoreHighlightsGovernedL3Modal.tsx` (`content.action` + `termRouteActions`)
- `src/lib/scoreHighlights/l3/content.ts` (Open coded-term deep-link actions; **no Open scoring change**)
- `app/result/[barcode].tsx` (card mount, navigation, demount `AdditivesRiskCard`)

### Tests / evidence
- `src/__tests__/unit/s25/aboutTheseAdditives.test.ts`
- `src/__tests__/unit/s25/renderingEvidence.test.ts`
- `reports/s25_about_these_additives/S25_IMPLEMENTATION_EVIDENCE.md` (this file)
- `reports/s25_about_these_additives/S25_RENDERING_EVIDENCE.json`

### Intentionally untouched (Claims overlap — S25 concerns only elsewhere)
- `src/lib/scoreHighlights/l3/resolveL3Route.ts` — Body still routes to `additives` (label unchanged for L2 CTA)
- `src/lib/scoreHighlights/l3/targets.ts` — no Claims edits
- Body/Open scoring modules unchanged

## Claims / S25 overlap classification (confirmed)

| File | Classification | Action taken |
|------|----------------|--------------|
| `content.ts` | Same file, separable | S25-only: term route actions + `renderedAdditiveIds` option |
| `resolveL3Route.ts` | Same file, separable | No edit (existing additives route retained) |
| `targets.ts` | Same file, separable | No edit |
| `app/result/[barcode].tsx` | S25-only | Card + navigation + legacy demount |
| `AboutTheseAdditivesModal.tsx` | S25-only | Evolved to merged catalogue |
| `AdditivesRiskCard.tsx` | S25-only | Demounted from Result (source retained) |
| `hostPresentation.ts` | S25-only | Unchanged (still dismisses look-through before additives) |
| `ScoreHighlightsGovernedL3Modal.tsx` | S25-only | Action / deep-link rendering |

**No Claims code copied or merged.**

## Test commands and results

```text
npm test -- --testPathPattern="src/__tests__/unit/s25|selectScoreHighlights|l3HostPresentation|l3ContentAddendum|bodyAdditiveScoring|openPillarHiddenTermMatcher|openGovernedCopy" --no-coverage
```

**Result:** 8 suites passed, **269 tests passed** (includes new S25 suites + Body/Open/Score Highlights regressions).

Additional targeted proofs inside S25 suite:
- Asset counts 315 / 309 / 6 / 33 / 7 / no dupes
- Body-6 ledger-only + no standard redetect of Body-6
- Colour count-separate / shared list group
- Class unknown fail-closed → Surface_Copy.function_unknown path
- Open coded-term “About this additive” gated on `renderedAdditiveIds`
- Body MVP scoring + Open hidden-term assessment APIs unchanged
- Result source no longer mounts `AdditivesRiskCard`
- S25 modules do not read `ADDITIVE_DATABASE` / safety judgement fields

## Body / Open scoring unchanged

- No edits to `bodyAdditiveScoring.ts`, `bodyPillar.ts`, Open pillar scoring, or `decodedAdditiveNames` generation.
- S25 deep-link normalises the already-fired coded term; does not re-decode Open L3 lines.
- Regression fixtures above remain green.

## Rendering evidence (automated — not device screenshots)

See `S25_RENDERING_EVIDENCE.json` (`kind: automated_render_evidence`).

Scenarios covered:
1. no-additive hidden state (card absent)
2. standard-only without evidence
3. standard enriched one-source (`e120`)
4. standard enriched two-source (`e211`)
5. Body-6-only (`e250`)
6. mixed standard + Body-6
7. mixed enriched standard + Body-6
8. direct Result entry
9. Open coded-term deep-link Back/X contract (structured navigation fields)

Device screenshots were unavailable in this agent environment; the JSON fixtures are labeled as automated render evidence.

## Legacy retirement evidence

- `AdditivesRiskCard` removed from `app/result/[barcode].tsx` mount path.
- `AllergensAdditivesModal` remains behind existing MVP / premium gates — not activated by S25; not used as the S25 journey.
- S25 surface copy uses Surface_Copy / Catalogue / Body L3 locked content only — no safety/caution/avoid/IARC/EWG risk framing on the new card/modal.
- Targeted source search in `src/s25/**` for prohibited judgement fields: clean (unit-enforced).

## Navigation contract (implemented)

| Entry | Back | X / Close |
|-------|------|-----------|
| Result card | n/a (Result) | Result |
| Body L2 “About these additives” | restores Body L2 detail story | Result |
| Open coded-term “About this additive” | restores Ingredient wording L3 | Result |

One canonical destination; look-through dismissed before Present (no modal-on-modal stack).

## Blockers requiring founder decision

None identified for the bounded S25 path. No scoring-method or product-inference conflicts with baseline `674d1fe`.

## Release note

Do **not** cut founder UAT from Cursor completion alone. Submit tip + v0.7 asset + brief v0.2 + this evidence to Claude independent assurance first.
