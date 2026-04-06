/**
 * Activity equivalents from food energy (per 100 g).
 *
 * Method: MET values from the Compendium of Physical Activities (Ainsworth et al.),
 * applied with the standard formula used in exercise physiology and aligned with ACSM practice:
 *   kcal/min = (MET × 3.5 × body weight kg) / 200
 *
 * Reference mass: 70 kg (common research / app convention). Values are estimates only —
 * real expenditure varies with weight, fitness, terrain, and intensity.
 */
export const NUTRITION_BURN_REFERENCE_KG = 70;

/** Compendium-aligned METs for the three reference activities */
export const NUTRITION_BURN_MET = {
  /** Walking ~5 km/h */
  walking: 3.5,
  /** Jogging ~8 km/h (within 7–8 MET range) */
  running: 7.5,
  /** Moderate cycling (within 6–8 MET range) */
  cycling: 7,
} as const;

export function kcalPerMinuteFromMet(met: number, weightKg: number): number {
  return (met * 3.5 * weightKg) / 200;
}

/** kcal/min at reference body mass, for each activity */
export const NUTRITION_BURN_KCAL_PER_MIN = {
  walking: kcalPerMinuteFromMet(NUTRITION_BURN_MET.walking, NUTRITION_BURN_REFERENCE_KG),
  running: kcalPerMinuteFromMet(NUTRITION_BURN_MET.running, NUTRITION_BURN_REFERENCE_KG),
  cycling: kcalPerMinuteFromMet(NUTRITION_BURN_MET.cycling, NUTRITION_BURN_REFERENCE_KG),
} as const;

export type NutritionBurnMinutes = {
  walking: number;
  running: number;
  cycling: number;
};

export function computeBurnMinutesFromKcal(kcal: number): NutritionBurnMinutes | null {
  if (!Number.isFinite(kcal) || kcal <= 0) return null;

  const walk = Math.round(kcal / NUTRITION_BURN_KCAL_PER_MIN.walking);
  const run = Math.round(kcal / NUTRITION_BURN_KCAL_PER_MIN.running);
  const cycle = Math.round(kcal / NUTRITION_BURN_KCAL_PER_MIN.cycling);

  return {
    walking: Math.max(1, walk),
    running: Math.max(1, run),
    cycling: Math.max(1, cycle),
  };
}
