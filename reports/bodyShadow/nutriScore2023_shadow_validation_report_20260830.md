# Nutri-Score 2023 Shadow Validation — Wave 2 Body (Complete)

Generated: 2026-08-30T01:45:17.029Z
Module: 20260830-offline-v1
SHA: 9d1163a2e0fb734ae9d34e9803895d71f466615c
Baseline: e919d550c40ca73c35179149525bacb1970d7826 (ancestor: true)

## Cohort reconciliation
[
  {
    "name": "au_core_run_79",
    "asset": "C:\\TrueScan-FoodScanner\\scripts\\_local_wave2_au_cohort_executable_DO_NOT_COMMIT.json",
    "expected_count": 79,
    "actual_count": 79,
    "reconciled": true
  },
  {
    "name": "au_edge_cases_6",
    "asset": "C:\\TrueScan-FoodScanner\\scripts\\_local_wave2_au_cohort_executable_DO_NOT_COMMIT.json",
    "expected_count": 6,
    "actual_count": 6,
    "reconciled": true
  },
  {
    "name": "nz_core_run_34",
    "asset": "C:\\TrueScan-FoodScanner\\scripts\\_local_wave2_nz_cohort_executable_DO_NOT_COMMIT.json",
    "expected_count": 34,
    "actual_count": 34,
    "reconciled": true
  },
  {
    "name": "gtin35_historical_regression",
    "asset": "docs/phase4/golden-barcode-pack-au.csv + nz + Cadbury targeted",
    "expected_count": 35,
    "actual_count": 35,
    "reconciled": true
  },
  {
    "name": "mandatory_regressions",
    "asset": "founder mandatory GTINs (not in governed cohort)",
    "expected_count": 2,
    "actual_count": 2,
    "reconciled": true
  }
]

## A. Known-grade validation (mathematical algorithm)
- Cohort with OFF A–E: 88
- Locally calculable (complete input): 40
- Exact matches: 40
- Disagreements: 0
- Branch breakdown: {"beverages":{"total":9,"calculable":3,"exact":3,"disagreements":0},"general_foods":{"total":69,"calculable":31,"exact":31,"disagreements":0},"water":{"total":1,"calculable":1,"exact":1,"disagreements":0},"fats_oils_nuts_seeds":{"total":8,"calculable":4,"exact":4,"disagreements":0},"cheese":{"total":1,"calculable":1,"exact":1,"disagreements":0}}

## B. Runtime eligibility validation
{
  "population": 124,
  "branch_resolved": 98,
  "complete_input_establishable": 41,
  "bounds_establishable": 24,
  "applicable_population": 124,
  "branch_resolved_pct": 79,
  "complete_input_pct": 33.1
}

## Missing-grade validation (denominator = no valid OFF A–E)
- Denominator: 36
- Complete-input recoveries: 1
- Bounds-invariant recoveries: 1
- Incremental bounds (complete-unresolved → bounds): 0
- Unresolved: 33
- Not applicable: 0
- Whole Produce candidates: 1

## Mandatory regressions

### Sour Patch Kids 9300617300793
{
  "row": {
    "gtin": "9300617300793",
    "productName": "Sour patch kids",
    "offGrade": null,
    "localGrade": null,
    "localNumericScore": null,
    "branch": "general_foods",
    "classification": "INSUFFICIENT_DETERMINISTIC_EVIDENCE",
    "unresolvedReason": "missing_required_nutrient",
    "exactMatch": null,
    "productionBodyScore": 9,
    "shadowBodyScoreEstimate": 9,
    "wholeProduceCandidate": false,
    "completeOutcomeKind": null,
    "cohorts": [
      "mandatory_regressions"
    ],
    "fetchSource": "cache",
    "runtimeEligibility": {
      "branchResolved": true,
      "branch": "general_foods",
      "completeInputCalculable": false,
      "boundsCalculable": false
    },
    "algorithmValidation": {
      "applicable": true,
      "completeGradeComparable": false,
      "exactMatch": null
    },
    "missingGradeClassification": "INSUFFICIENT_DETERMINISTIC_EVIDENCE"
  },
  "input_trace": {
    "rawOffNutriments": {
      "energyKj": 1749.68,
      "sugarsG": 62,
      "saturatedFatG": 4,
      "sodiumG": null,
      "sodiumMg": null,
      "saltG": null,
      "fibreG": null,
      "proteinG": 4,
      "fvlPercent": 0
    },
    "preparationBasis": {
      "basis": "as_sold",
      "requiredPrepared": false,
      "source": "default_as_sold"
    },
    "offNutriscore2023Data": {
      "energy": 1749.68,
      "fiber": null,
      "fruits_vegetables_legumes": 0,
      "is_beverage": 0,
      "is_cheese": 0,
      "is_fat_oil_nuts_seeds": 0,
      "is_red_meat_product": 0,
      "is_water": 0,
      "proteins": 4,
      "salt": null,
      "saturated_fat": 4,
      "sugars": 62
    },
    "categoryAvailable": true,
    "saltResolution": {
      "directSaltG": null,
      "sodiumG": null,
      "sodiumMg": null,
      "resolvedSaltG": null,
      "sodiumToSaltApplied": false
    },
    "normalizedInputs": {
      "branch": "general_foods",
      "basis": "per_100g",
      "energyKj": 1749.68,
      "saturatedFatG": 4,
      "sugarsG": 62,
      "saltG": null,
      "proteinG": 4,
      "fibreG": null,
      "fvlPercent": 0,
      "fvlPoints": null,
      "totalFatG": 4.32,
      "nonNutritiveSweetenersPresent": null,
      "isWater": false,
      "nutritionPreparation": "as_sold"
    },
    "unresolvedReason": "missing_required_nutrient",
    "completeOutcome": {
      "kind": "unresolved",
      "reason": "missing_required_nutrient",
      "branch": "general_foods"
    },
    "boundsOutcome": null
  },
  "complete_input_result": null,
  "bounds_result": null,
  "unresolved_reason": "missing_required_nutrient",
  "sodium_present": false,
  "salt_conversion_applied": false,
  "fibre_treated_as_zero": false
}

### Driscoll's Raspberries 93541121
{
  "row": {
    "gtin": "93541121",
    "productName": "Raspberries",
    "offGrade": null,
    "localGrade": null,
    "localNumericScore": null,
    "branch": "general_foods",
    "classification": "WHOLE_PRODUCE_CANDIDATE",
    "unresolvedReason": "missing_required_nutrient",
    "exactMatch": null,
    "productionBodyScore": 18,
    "shadowBodyScoreEstimate": 22,
    "wholeProduceCandidate": true,
    "completeOutcomeKind": null,
    "cohorts": [
      "mandatory_regressions"
    ],
    "fetchSource": "cache",
    "runtimeEligibility": {
      "branchResolved": true,
      "branch": "general_foods",
      "completeInputCalculable": false,
      "boundsCalculable": false
    },
    "algorithmValidation": {
      "applicable": true,
      "completeGradeComparable": false,
      "exactMatch": null
    },
    "missingGradeClassification": "WHOLE_PRODUCE_CANDIDATE"
  },
  "shadow_body_breakdown": {
    "base": 15,
    "nova1": 3,
    "whole_produce": 4,
    "nutri_adjustment": 0,
    "total": 22
  }
}

## Whole Produce boundary tests
- [x] Driscolls raspberries 93541121 inclusion 15+3+4=22: shadowBody=22
- [x] Juice category excluded from Whole Produce: excluded_category
- [x] Multi-ingredient excluded from Whole Produce: ingredients_not_whole_produce_only
- [x] NOVA 4 excluded from Whole Produce: nova_not_1
- [x] Whole Produce +4 does not stack when OFF Nutri grade present: shadowBody=25 (15+7 NOVA1+3)

## Recommendation
- Complete-input MVP supported: false
- Bounds: Bounds provided no incremental missing-grade recovery beyond complete-input path in this cohort — marginal for MVP.
- Whole Produce boundaries pass: true

## Production Body unchanged
bodyPillar.ts modified since baseline: false
