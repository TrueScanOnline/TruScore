/**
 * Nutri-Score 2023 shadow calculator — source-neutral core.
 * Methodology: Santé publique France updated algorithm (2022 solid foods, 2023 beverages).
 */

import {
  beverageEnergyPoints,
  beverageFvlPointsFromPercent,
  beverageProteinPoints,
  beverageSaturatedFatPoints,
  beverageSugarsPoints,
  fatsEnergyFromSaturatesPoints,
  fatsSatFatRatioPoints,
  generalEnergyPoints,
  generalFibrePoints,
  generalFvlPointsFromPercent,
  generalProteinPoints,
  generalSaltPoints,
  generalSaturatedFatPoints,
  generalSugarsPoints,
  gradeFromScoreBeverage,
  gradeFromScoreFats,
  gradeFromScoreGeneral,
} from './pointTables';
import type {
  NutriScore2023Branch,
  NutriScore2023Inputs,
  NutriScore2023Outcome,
} from './types';

function requireNumber(value: number | null, label: string): number | 'missing' {
  if (value === null || !Number.isFinite(value)) return 'missing';
  return value;
}

function resolveFvlPoints(inputs: NutriScore2023Inputs, beverage: boolean): number | 'missing' {
  if (inputs.fvlPoints !== null && Number.isFinite(inputs.fvlPoints)) {
    return inputs.fvlPoints;
  }
  if (inputs.fvlPercent === null || !Number.isFinite(inputs.fvlPercent)) {
    return 'missing';
  }
  return beverage
    ? beverageFvlPointsFromPercent(inputs.fvlPercent)
    : generalFvlPointsFromPercent(inputs.fvlPercent);
}

function capRedMeatProtein(proteinPoints: number): number {
  return Math.min(proteinPoints, 2);
}

function scoreGeneralLike(
  inputs: NutriScore2023Inputs,
  branch: NutriScore2023Branch,
  nThreshold: number,
  cheese: boolean,
  redMeatCap: boolean
): NutriScore2023Outcome | { negative: number; positive: number; score: number } {
  const energy = requireNumber(inputs.energyKj, 'energy');
  const sat = requireNumber(inputs.saturatedFatG, 'saturatedFat');
  const sugars = requireNumber(inputs.sugarsG, 'sugars');
  const salt = requireNumber(inputs.saltG, 'salt');
  const protein = requireNumber(inputs.proteinG, 'protein');
  const fibre = requireNumber(inputs.fibreG, 'fibre');
  const fvl = resolveFvlPoints(inputs, false);

  if ([energy, sat, sugars, salt, protein, fibre, fvl].some((v) => v === 'missing')) {
    return { kind: 'unresolved', reason: 'missing_required_nutrient', branch };
  }

  const nEnergy = generalEnergyPoints(energy as number);
  const nSat = generalSaturatedFatPoints(sat as number);
  const nSugars = generalSugarsPoints(sugars as number);
  const nSalt = generalSaltPoints(salt as number);
  const negative = nEnergy + nSat + nSugars + nSalt;

  let pProtein = generalProteinPoints(protein as number);
  if (redMeatCap) pProtein = capRedMeatProtein(pProtein);
  const pFibre = generalFibrePoints(fibre as number);
  const pFvl = fvl as number;
  const positive = pProtein + pFibre + pFvl;

  let score: number;
  let effectivePositive: number;
  if (cheese || negative < nThreshold) {
    effectivePositive = positive;
    score = negative - positive;
  } else {
    effectivePositive = pFibre + pFvl;
    score = negative - pFibre - pFvl;
  }

  return { negative, positive: effectivePositive, score };
}

function scoreFatsBranch(inputs: NutriScore2023Inputs): NutriScore2023Outcome | { negative: number; positive: number; score: number } {
  const sat = requireNumber(inputs.saturatedFatG, 'saturatedFat');
  const sugars = requireNumber(inputs.sugarsG, 'sugars');
  const salt = requireNumber(inputs.saltG, 'salt');
  const protein = requireNumber(inputs.proteinG, 'protein');
  const fibre = requireNumber(inputs.fibreG, 'fibre');
  const totalFat = requireNumber(inputs.totalFatG, 'totalFat');
  const fvl = resolveFvlPoints(inputs, false);

  if ([sat, sugars, salt, protein, fibre, totalFat, fvl].some((v) => v === 'missing')) {
    return { kind: 'unresolved', reason: 'missing_required_nutrient', branch: 'fats_oils_nuts_seeds' };
  }

  const energyFromSat = fatsEnergyFromSaturatesPoints((sat as number) * 37);
  const ratioPercent = (totalFat as number) > 0 ? ((sat as number) / (totalFat as number)) * 100 : 100;
  const nRatio = fatsSatFatRatioPoints(ratioPercent);
  const negative = energyFromSat + generalSugarsPoints(sugars as number) + nRatio + generalSaltPoints(salt as number);

  const pProtein = generalProteinPoints(protein as number);
  const pFibre = generalFibrePoints(fibre as number);
  const pFvl = fvl as number;
  const positive = pProtein + pFibre + pFvl;

  const score = negative < 7 ? negative - positive : negative - pFibre - pFvl;
  const effectivePositive = negative < 7 ? positive : pFibre + pFvl;
  return { negative, positive: effectivePositive, score };
}

function scoreBeverageBranch(inputs: NutriScore2023Inputs): NutriScore2023Outcome | { negative: number; positive: number; score: number } {
  if (inputs.isWater) {
    return { negative: 0, positive: 0, score: 0 };
  }

  const energy = requireNumber(inputs.energyKj, 'energy');
  const sat = requireNumber(inputs.saturatedFatG, 'saturatedFat');
  const sugars = requireNumber(inputs.sugarsG, 'sugars');
  const salt = requireNumber(inputs.saltG, 'salt');
  const protein = requireNumber(inputs.proteinG, 'protein');
  const fibre = requireNumber(inputs.fibreG, 'fibre');
  const fvl = resolveFvlPoints(inputs, true);
  const nns = inputs.nonNutritiveSweetenersPresent;

  if ([energy, sat, sugars, salt, protein, fibre, fvl, nns].some((v) => v === 'missing')) {
    return { kind: 'unresolved', reason: 'missing_required_nutrient', branch: 'beverages' };
  }

  const negative =
    beverageEnergyPoints(energy as number) +
    beverageSugarsPoints(sugars as number) +
    beverageSaturatedFatPoints(sat as number) +
    generalSaltPoints(salt as number) +
    (nns ? 4 : 0);

  const positive =
    beverageProteinPoints(protein as number) +
    generalFibrePoints(fibre as number) +
    (fvl as number);

  const score = negative - positive;
  return { negative, positive, score };
}

export function calculateNutriScore2023(inputs: NutriScore2023Inputs): NutriScore2023Outcome {
  if (inputs.branch === 'water') {
    return {
      kind: 'calculated',
      numericScore: 0,
      grade: 'a',
      branch: 'water',
      negativePoints: 0,
      positivePoints: 0,
      path: 'complete_input',
    };
  }

  let raw:
    | NutriScore2023Outcome
    | { negative: number; positive: number; score: number };

  switch (inputs.branch) {
    case 'cheese':
      raw = scoreGeneralLike(inputs, 'cheese', 11, true, false);
      break;
    case 'red_meat':
      raw = scoreGeneralLike(inputs, 'red_meat', 11, false, true);
      break;
    case 'fats_oils_nuts_seeds':
      raw = scoreFatsBranch(inputs);
      break;
    case 'beverages':
      raw = scoreBeverageBranch(inputs);
      break;
    case 'general_foods':
    default:
      raw = scoreGeneralLike(inputs, 'general_foods', 11, false, false);
      break;
  }

  if ('kind' in raw) return raw;

  let grade;
  if (inputs.branch === 'fats_oils_nuts_seeds') {
    grade = gradeFromScoreFats(raw.score);
  } else if (inputs.branch === 'beverages') {
    grade = gradeFromScoreBeverage(raw.score, inputs.isWater);
  } else {
    grade = gradeFromScoreGeneral(raw.score);
  }

  return {
    kind: 'calculated',
    numericScore: raw.score,
    grade,
    branch: inputs.branch,
    negativePoints: raw.negative,
    positivePoints: raw.positive,
    path: 'complete_input',
  };
}
