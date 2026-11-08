# W5-AD-01 Stage 2 — Controlled Additives Commentary Pilot Audit

**Status:** Local experimental pilot only. Not authorised for production, UAT release, merge, or push.

## Baseline identity

| Item | Value |
|------|--------|
| Approved base SHA | `855f45bca3873629811c30542a01ef7f7af617ff` |
| Recovery tag | `w5-ad01-pre-additives-20261108` (peels to the approved SHA) |
| B0 ancestor | `99102768b61bd6e518bb889e3ab6f01dfc3e1268` |
| Local experimental branch | `experiment/w5-ad01-additives-copy-20261108` |
| Wave 5 branch | left untouched (`wave5/score-experience-20261008`) |

## Source-authority exception (explicit)

The original S25 v0.7 XLSX (`Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_20260913_v0_7.xlsx`) and extracted TSV sources were **not recovered**.

For this **four-entry pilot only**, founder authorisation treats the committed ingested derivative `src/s25/assets/catalogue_315.json` as an **interim working source**.

- Do **not** represent that JSON as the original recovered workbook or TSV set.
- `ingestion_manifest.json` is preserved unchanged as the historical ingest record (`generated_at` 2026-09-13; `tsv_dir` pointing at the now-missing temp extract).
- No claim is made that JSON was regenerated from recovered original TSVs.

## Scope implemented

Exactly four STANDARD catalogue records:

| additive_id | Display | treatment | body6_existing |
|-------------|---------|-----------|----------------|
| e120 | Cochineal / carmines / carminic acid | STANDARD | false |
| e170 | Calcium carbonate | STANDARD | false |
| e471 | Mono- and di-glycerides of fatty acids | STANDARD | false |
| e211 | Sodium benzoate | STANDARD | false |

Allowed editorial fields only: `tile_summary`, `expanded_summary`, `source_preparation_copy`, `fact_*` (where already populated), `evidence_copy` (where changed and verified).

Empty `fact_3` slots on e170 and e211 were **not** populated.

## Original vs proposed text (changed fields only)

### e120

| Field | Original | Proposed | Reason |
|-------|----------|----------|--------|
| tile_summary | Cochineal, carmines and carminic acid are red colour preparations derived from cochineal insects. | A vivid red-to-pink colour made from cochineal insects — the pigment behind carmine and carminic acid. | Shorter collapsed hook; keeps insect origin and common names. |
| expanded_summary | …derived from cochineal insects. Carminic acid is the key pigment; carmine is a metal-complexed form of that pigment. | Adds dried female scale insects, colour-lake wording, and common label names (cochineal / carmine / carminic acid / colour 120). | Progressive detail; label recognition without repeating the tile sentence. |
| source_preparation_copy | Produced from extracts of dried female cochineal insects… | Made by extracting colour… Carmine is formed when… | Clearer consumer wording; same preparation pathway. |
| fact_2_copy | The source can matter… | The insect source can matter… | Makes the dietary-choice reason explicit. |
| fact_3_copy | Provides red to pink colouring. | Used to give foods a red to pink colour. | Natural phrasing; same role fact. |
| evidence_copy | …requires carmine or cochineal to be named… | …requires carmine or cochineal extract to be named on the label… | Aligns wording with FDA consumer colour-additive Q&A phrasing; preserves allergy / non-major-allergen qualifications. |

Unchanged e120: `fact_1_label`, `fact_1_copy`, evidence flags/URLs.

### e170

| Field | Original | Proposed | Reason |
|-------|----------|----------|--------|
| tile_summary | A white mineral compound better known… as chalk or limestone. | The same mineral family as chalk and limestone — a fine white powder used in food for colour, texture or calcium. | Punchier hook + food roles without over-claiming. |
| expanded_summary | …can act as a colour, acidity regulator… | Adds food-grade vs raw quarry chalk qualification and recipe-dependent roles. | Corrects possible misread that food additive equals unrefined chalk. |
| source_preparation_copy | …purified mineral sources or produced by controlled precipitation. | …such as limestone… then refined to meet food specifications. | Food-grade qualification retained and clarified. |
| fact_1_copy | …limestone, chalk and shells. | …limestone, chalk and many shells. | Minor precision; shells remain a natural occurrence example. |

Unchanged e170: fact labels, fact_2_copy, empty fact_3, no evidence block.

### e471

| Field | Original | Proposed | Reason |
|-------|----------|----------|--------|
| tile_summary | Long chemistry definition. | Partial fat molecules used as emulsifiers — glycerol carrying one or two fatty acids… | Function-first hook; chemistry compressed. |
| expanded_summary | Same sentence as tile. | Explains triglyceride relationship + everyday food uses; avoids repeating tile verbatim. | Progressive reading reward. |
| source_preparation_copy | …fatty-acid source can be vegetable or animal. | Same pathway; emphasises number alone does not disclose origin. | Strengthens consumer-relevant variable-source warning. |
| fact_2_copy | …interface between fat and water. | …boundary between fat and water. | Light clarity edit. |
| fact_3_copy | The additive number alone does not reveal… | …only the manufacturer can confirm the fat source used for a given product. | Prevents product-level source inference. |
| evidence_copy | EFSA findings paraphrased. | Same material claims; “judged” / “released” / “at the mean” wording tightened to EFSA abstract. | Editorial polish only; no new safety claims. |

Unchanged e471: fact_1_*, evidence metadata/URL.

### e211

| Field | Original | Proposed | Reason |
|-------|----------|----------|--------|
| tile_summary | Sodium benzoate is the sodium salt of benzoic acid. | A preservative salt of benzoic acid, used mainly to slow spoilage in acidic foods and drinks. | Function-first hook. |
| expanded_summary | …mainly for preservation rather than for flavour. | Adds acidic-product examples and yeasts/moulds/bacteria inhibition. | Explains what it does without safety slogans. |
| fact_1_copy | The most commonly encountered benzoate preservative salt. | The benzoate preservative salt most often seen on ingredient lists. | Natural phrasing. |
| fact_2_copy | Used especially in acidic foods and drinks. | Most effective in acidic foods and drinks. | Reflects known acidic-condition effectiveness without inventing a pH number. |

Unchanged e211: `source_preparation_copy` (already clear), empty fact_3, **entire `evidence_copy` retained verbatim** (already dense, qualified, dual-sourced). Evidence URLs untouched.

## Claim-to-source evidence mapping

Access date for all web-verified sources: **2026-11-08**.

### e120

| Claim (proposed) | Support |
|------------------|---------|
| Insect / cochineal origin; carminic acid / carmine relationship | Original catalogue fields; EU/FSANZ additive identity for code 120 |
| Female cochineal / extraction / metal complex or lake | Original `source_preparation_copy` + original expanded summary |
| Label names include cochineal, carmine, carminic acid, colour 120 | Original catalogue names + FSANZ additive labelling class+number practice |
| Dietary-choice relevance (vegan/vegetarian/religious/personal) | Original fact_2; insect origin is animal-derived |
| Residual insect protein / uncommon allergy / FDA naming requirement / not a universal major allergen | Original evidence_copy; FDA Color Additives Q&A / FDA Food Allergies page noting cochineal extract and carmine must be declared |

FDA: https://www.fda.gov/food/color-additives-information-consumers/color-additives-questions-and-answers-consumers  
FDA allergies note: https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/food-allergies

### e170

| Claim | Support |
|-------|---------|
| Chalk / limestone familiarity; white mineral powder | Original catalogue; JECFA / EU 231/2012 synonym “Chalk”; FDA 21 CFR 73.70 limestone or precipitation |
| Food roles (colour, acidity regulator, firming, calcium processing) | Original expanded_summary |
| Food-grade purified mineral or precipitated — not raw quarry chalk | Original source_preparation_copy + EU 231/2012 / FDA identity (ground limestone or precipitation; food specs) |

EU specs (E 170): https://www.legislation.gov.uk/eur/2012/231/annex/division/42/adopted  
FDA 21 CFR 73.70: https://www.ecfr.gov/current/title-21/chapter-I/subchapter-A/part-73/subpart-A/section-73.70  
JECFA monograph: https://www.fao.org/fileadmin/user_upload/jecfa_additives/docs/Monograph1/Additive-075.pdf

### e471

| Claim | Support |
|-------|---------|
| Partial glycerides vs triglycerides; emulsifier role | Original catalogue |
| Vegetable or animal fatty-acid source; number alone insufficient; manufacturer confirmation | Original source_preparation + fact_3; EFSA identity as mixture from edible fats/oils |
| Digestion to glycerol + fatty acids; no ADI; no genotox/cancer/repro concern at assessed uses; ~0.8–3.5% fat intake | Original evidence_copy; EFSA Journal 2017;5045 abstract |

EFSA: https://www.efsa.europa.eu/en/efsajournal/pub/5045 (DOI 10.2903/j.efsa.2017.5045)

### e211

| Claim | Support |
|-------|---------|
| Sodium salt of benzoic acid; preservative in acidic foods/drinks; yeasts/moulds/some bacteria | Original catalogue + widely established preservative use (acidic systems); FDA beverage Q&A notes benzoates inhibit bacteria/yeasts/moulds |
| ATDS high-consumer child exceedance vs average below half ADI | Original evidence_copy; FSANZ Australian Total Diet Study archive link already in catalogue |
| Benzoate + vitamin C → trace benzene with heat/light; FDA monitoring / reformulation / recipe dependence | Original evidence_copy; FDA benzene Q&A |

FDA benzene Q&A: https://www.fda.gov/food/environmental-contaminants-food/questions-and-answers-occurrence-benzene-soft-drinks-and-other-beverages  
FSANZ ATDS hub (existing catalogue URL): https://www.foodstandards.gov.au/science-data/monitoring-safety/australian-total-diet-study

## Material claims not safely strengthened / unresolved uncertainty

| Topic | Disposition |
|-------|-------------|
| Specific finished-product animal vs plant origin for e471 | **Not asserted** — manufacturer confirmation required |
| Numerical pH optimum for benzoate | **Not inserted** (avoid inventing a figure); “acidic” retained |
| Quantified allergy incidence for carmine | **Not quantified** beyond “uncommon” from original evidence |
| Calling any additive “safe” or “dangerous” as a slogan | **Avoided**; retained regulator-qualified wording |
| Original XLSX/TSV reconciliation of every phrase | **Unavailable** — interim JSON exception applies |

No new application source-link URLs were inserted.

## Protected files / fields confirmed unchanged

Protected / out-of-scope (not modified in this pilot):

- `AboutTheseAdditivesCard.tsx`, `AboutTheseAdditivesModal.tsx`
- S25 detection / normalize / merge / scoring modules
- `classes_25.json`, `source_profiles.json`, `surface_copy.json`, `ingestion_manifest.json`
- `bodyAdditivesL3Content.ts` and all six Body-6 catalogue rows
- All non-editorial catalogue fields on every row
- Evidence enablement, counts, labels, URLs
- All 311 non-pilot catalogue records (value-identical to baseline)

## Rollback (non-destructive; preserves unrelated local work)

Untracked evidence such as `docs/uat/w5-wp09/` must be left alone.

```text
# From anywhere in the repo:
git switch wave5/score-experience-20261008
# Optional: keep the experimental branch for inspection, or delete only that branch tip:
# git branch -D experiment/w5-ad01-additives-copy-20261108

# If still on the experimental branch and needing to discard ONLY this pilot commit
# after it exists, use a non-destructive reverse of that commit (do not hard-reset shared branches):
# git revert <pilot-commit-sha>
```

Recovery tag `w5-ad01-pre-additives-20261108` remains the founder-approved checkpoint and must not be moved.

## Verification artefacts

Focused regression: `src/__tests__/unit/s25/w5Ad01CommentaryPilot.test.ts`  
Programmatic baseline comparison uses `git show 855f45b:src/s25/assets/catalogue_315.json`.
