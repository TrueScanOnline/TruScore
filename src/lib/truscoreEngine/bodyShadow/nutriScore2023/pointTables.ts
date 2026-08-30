/**
 * Nutri-Score 2023 updated algorithm point tables (Santé publique France adopted scales).
 * Shadow-only — not wired to production Body scoring.
 */

export function pointsFromAscendingThresholds(value: number, thresholds: readonly number[]): number {
  let points = 0;
  for (const t of thresholds) {
    if (value > t) points += 1;
    else break;
  }
  return points;
}

export function generalEnergyPoints(kj: number): number {
  return pointsFromAscendingThresholds(kj, [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350]);
}

export function generalSaturatedFatPoints(g: number): number {
  return pointsFromAscendingThresholds(g, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
}

export function generalSugarsPoints(g: number): number {
  return pointsFromAscendingThresholds(g, [3.4, 6.8, 10, 14, 17, 20, 24, 27, 31, 34, 37, 41, 44, 48, 51]);
}

/** 2023 general-foods salt: 0–20 points, 0.2 g steps (>0.2 → 1 pt … >4.0 → 20 pts). */
export function generalSaltPoints(g: number): number {
  if (g <= 0.2) return 0;
  return pointsFromAscendingThresholds(g, [
    0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0, 3.2, 3.4, 3.6, 3.8, 4.0,
  ]);
}

export function generalProteinPoints(g: number): number {
  return pointsFromAscendingThresholds(g, [2.4, 4.8, 7.2, 9.6, 12, 14, 17]);
}

export function generalFibrePoints(g: number): number {
  return pointsFromAscendingThresholds(g, [3.0, 4.1, 5.2, 6.3, 7.4]);
}

export function generalFvlPointsFromPercent(pct: number): number {
  if (pct <= 40) return 0;
  if (pct <= 60) return 1;
  if (pct <= 80) return 2;
  return 5;
}

export function fatsEnergyFromSaturatesPoints(kj: number): number {
  return pointsFromAscendingThresholds(kj, [120, 240, 360, 480, 600, 720, 840, 960, 1080, 1200]);
}

export function fatsSatFatRatioPoints(ratioPercent: number): number {
  if (ratioPercent < 10) return 0;
  if (ratioPercent < 16) return 1;
  if (ratioPercent < 22) return 2;
  if (ratioPercent < 28) return 3;
  if (ratioPercent < 34) return 4;
  if (ratioPercent < 40) return 5;
  if (ratioPercent < 46) return 6;
  if (ratioPercent < 52) return 7;
  if (ratioPercent < 58) return 8;
  if (ratioPercent < 64) return 9;
  return 10;
}

export function beverageEnergyPoints(kj: number): number {
  if (kj <= 30) return 0;
  if (kj <= 90) return 1;
  if (kj <= 150) return 2;
  if (kj <= 210) return 3;
  if (kj <= 240) return 4;
  if (kj <= 270) return 5;
  if (kj <= 300) return 6;
  if (kj <= 330) return 7;
  if (kj <= 360) return 8;
  if (kj <= 390) return 9;
  return 10;
}

export function beverageSugarsPoints(g: number): number {
  if (g <= 0.5) return 0;
  if (g <= 2) return 1;
  if (g <= 3.5) return 2;
  if (g <= 5) return 3;
  if (g <= 6) return 4;
  if (g <= 7) return 5;
  if (g <= 8) return 6;
  if (g <= 9) return 7;
  if (g <= 10) return 8;
  if (g <= 11) return 9;
  return 10;
}

export function beverageSaturatedFatPoints(g: number): number {
  return pointsFromAscendingThresholds(g, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
}

export function beverageProteinPoints(g: number): number {
  return pointsFromAscendingThresholds(g, [1.2, 1.5, 1.8, 2.1, 2.4, 2.7, 3.0]);
}

export function beverageFvlPointsFromPercent(pct: number): number {
  if (pct <= 40) return 0;
  if (pct <= 60) return 2;
  if (pct <= 80) return 4;
  return 6;
}

export function gradeFromScoreGeneral(score: number): 'a' | 'b' | 'c' | 'd' | 'e' {
  if (score <= 0) return 'a';
  if (score <= 2) return 'b';
  if (score <= 10) return 'c';
  if (score <= 18) return 'd';
  return 'e';
}

export function gradeFromScoreFats(score: number): 'a' | 'b' | 'c' | 'd' | 'e' {
  if (score <= -6) return 'a';
  if (score <= 2) return 'b';
  if (score <= 10) return 'c';
  if (score <= 18) return 'd';
  return 'e';
}

export function gradeFromScoreBeverage(score: number, isWater: boolean): 'a' | 'b' | 'c' | 'd' | 'e' {
  if (isWater) return 'a';
  if (score <= 2) return 'b';
  if (score <= 6) return 'c';
  if (score <= 9) return 'd';
  return 'e';
}

export function sodiumGToSaltG(sodiumG: number): number {
  return sodiumG * 2.5;
}

export function sodiumMgToSaltG(sodiumMg: number): number {
  return (sodiumMg * 2.5) / 1000;
}
