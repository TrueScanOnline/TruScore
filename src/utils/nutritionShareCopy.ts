import { ProductNutriments } from '../types/product';
import { resolveKcalPer100g } from './nutritionPer100g';
import {
  computeBurnMinutesFromKcal,
  NUTRITION_BURN_REFERENCE_KG,
  type NutritionBurnMinutes,
} from './nutritionBurnTime';

export interface NutritionShareBurnData {
  kcalPer100g: number | undefined;
  burn: NutritionBurnMinutes | null;
}

export function getNutritionShareBurnData(nutriments: ProductNutriments | undefined): NutritionShareBurnData {
  const kcalPer100g = resolveKcalPer100g(nutriments);
  const burn = kcalPer100g !== undefined ? computeBurnMinutesFromKcal(kcalPer100g) : null;
  return { kcalPer100g, burn };
}

export function buildNutritionShareBodyLines(options: {
  productName: string;
  universalLink: string;
  kcalPer100g: number | undefined;
  burn: NutritionBurnMinutes | null;
}): string {
  const { productName, universalLink, kcalPer100g, burn } = options;
  const lines: string[] = [`🥗 ${productName}`];

  if (kcalPer100g !== undefined) {
    lines.push(`≈ ${Math.round(kcalPer100g)} kcal per 100 g`);
  }

  if (burn) {
    lines.push(
      `MET-based activity equivalents (${NUTRITION_BURN_REFERENCE_KG} kg reference adult): ` +
        `≈ ${burn.walking} min walking, ≈ ${burn.running} min jogging, ≈ ${burn.cycling} min moderate cycling`
    );
  }

  lines.push('', universalLink, '', '📱 TruScore — scan any product', '', '#TruScore #Nutrition #ProductScan');

  return lines.join('\n');
}
