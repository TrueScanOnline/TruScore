/**
 * Grade-invariance bounds check — shadow only.
 * A missing input is tolerated only if every legitimate value yields the same grade.
 */

import { calculateNutriScore2023 } from './calculator';
import type { NutriScore2023Inputs, NutriScoreGrade, NutriScore2023Branch } from './types';
import { gradeFromScoreBeverage, gradeFromScoreFats, gradeFromScoreGeneral } from './pointTables';

type MissingField = keyof Pick<
  NutriScore2023Inputs,
  'energyKj' | 'saturatedFatG' | 'sugarsG' | 'saltG' | 'proteinG' | 'fibreG' | 'fvlPercent' | 'totalFatG'
>;

const GENERAL_RANGES: Record<MissingField, number[]> = {
  energyKj: [0, 500, 1500, 2500, 3500],
  saturatedFatG: [0, 1, 5, 10, 20],
  sugarsG: [0, 5, 15, 30, 60],
  saltG: [0, 0.2, 1, 2, 4],
  proteinG: [0, 3, 8, 15, 25],
  fibreG: [0, 2, 5, 10, 20],
  fvlPercent: [0, 50, 80, 100],
  totalFatG: [0, 10, 30, 60, 100],
};

function gradeOnly(outcome: ReturnType<typeof calculateNutriScore2023>): NutriScoreGrade | null {
  if (outcome.kind === 'calculated') return outcome.grade;
  if (outcome.kind === 'bounds_invariant_grade') return outcome.grade;
  return null;
}

function enumerateCombinations(fields: MissingField[]): Array<Partial<Record<MissingField, number>>> {
  if (fields.length === 0) return [{}];
  const [head, ...rest] = fields;
  const restCombos = enumerateCombinations(rest);
  const values = GENERAL_RANGES[head];
  const combos: Array<Partial<Record<MissingField, number>>> = [];
  for (const v of values) {
    for (const rc of restCombos) {
      combos.push({ ...rc, [head]: v });
    }
  }
  return combos;
}

export function checkGradeInvarianceBounds(
  baseInputs: NutriScore2023Inputs
): { invariant: true; grade: NutriScoreGrade } | { invariant: false } {
  const missing: MissingField[] = [];
  (Object.keys(GENERAL_RANGES) as MissingField[]).forEach((field) => {
    const v = baseInputs[field];
    if (v === null || v === undefined) missing.push(field);
  });

  if (missing.length === 0) {
    return { invariant: false };
  }

  const combos = enumerateCombinations(missing);
  const grades = new Set<NutriScoreGrade>();

  for (const combo of combos) {
    const filled: NutriScore2023Inputs = { ...baseInputs };
    for (const field of missing) {
      const val = combo[field];
      if (val === undefined) continue;
      (filled as Record<string, unknown>)[field] = val;
    }
    if (filled.fvlPercent !== null && filled.fvlPoints === null) {
      filled.fvlPoints = null;
    }
    const outcome = calculateNutriScore2023(filled);
    const g = gradeOnly(outcome);
    if (!g) return { invariant: false };
    grades.add(g);
    if (grades.size > 1) return { invariant: false };
  }

  const only = [...grades][0];
  return only ? { invariant: true, grade: only } : { invariant: false };
}

/** Direct grade from score for bounds reporting when branch known. */
export function gradeForBranch(branch: NutriScore2023Branch, score: number, isWater: boolean): NutriScoreGrade {
  if (branch === 'fats_oils_nuts_seeds') return gradeFromScoreFats(score);
  if (branch === 'beverages' || branch === 'water') return gradeFromScoreBeverage(score, isWater);
  return gradeFromScoreGeneral(score);
}
