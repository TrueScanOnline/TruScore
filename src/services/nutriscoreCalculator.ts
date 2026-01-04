/**
 * Nutri-Score Calculator
 * 
 * Implements the official Nutri-Score algorithm from Santé Publique France
 * Calculates Nutri-Score grade (A-E) and score when Open Food Facts is missing Nutri-Score
 * 
 * Algorithm Reference: https://www.santepubliquefrance.fr/determinants-de-sante/nutrition-et-activite-physique/articles/nutri-score
 * 
 * @module nutriscoreCalculator
 */

import { ProductNutriments } from '../types/product';
import { logger } from '../utils/logger';

/**
 * Calculate Nutri-Score from nutrition data
 * 
 * Required nutrients (minimum):
 * - Energy (kJ or kcal)
 * - Saturated fat (g per 100g)
 * - Sugars (g per 100g)
 * - Sodium (mg per 100g) or Salt (g per 100g)
 * 
 * Optional nutrients (improves accuracy):
 * - Fruits/vegetables/nuts (g per 100g)
 * - Fiber (g per 100g)
 * - Protein (g per 100g)
 * 
 * @param nutriments - Product nutrition data (should be per 100g)
 * @returns Nutri-Score grade (A-E) and score, or null if insufficient data
 */
export function calculateNutriScoreFromNutrition(
  nutriments: ProductNutriments
): { grade: 'a' | 'b' | 'c' | 'd' | 'e'; score: number } | null {
  try {
    // Step 1: Extract and normalize nutrients to per-100g
    // Energy: Convert kcal to kJ if needed (1 kcal = 4.184 kJ)
    const energyKcal = nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0;
    const energyKj = nutriments['energy-kj_100g'] || nutriments['energy-kj'] || (energyKcal * 4.184);
    
    // Saturated fat (g per 100g)
    const saturatedFat = nutriments['saturated-fat_100g'] || nutriments['saturated-fat'] || 0;
    
    // Sugars (g per 100g)
    const sugars = nutriments['sugars_100g'] || nutriments['sugars'] || 0;
    
    // Sodium: Convert salt to sodium if needed (salt = sodium * 2.54, so sodium = salt / 2.54)
    const sodiumMg = nutriments['sodium_100g'] || nutriments['sodium'] || 0;
    const saltG = nutriments['salt_100g'] || nutriments['salt'] || 0;
    const sodium = sodiumMg > 0 ? sodiumMg : (saltG > 0 ? (saltG * 1000) / 2.54 : 0); // Convert salt (g) to sodium (mg)
    
    // Optional nutrients
    const fruitsVegetablesNuts = nutriments['fruits-vegetables-nuts-estimate-from-ingredients_100g'] || 
                                  nutriments['fruits-vegetables-nuts-estimate-from-ingredients'] || 0;
    const fiber = nutriments['fiber_100g'] || nutriments['fiber'] || 0;
    const protein = nutriments['proteins_100g'] || nutriments['proteins'] || 0;
    
    // Step 2: Check if we have minimum required data
    // We need at least: energy, saturated fat, sugars, and sodium
    if (!energyKj || !saturatedFat && saturatedFat !== 0 || !sugars && sugars !== 0 || !sodium && sodium !== 0) {
      // Check if we have energy but missing other required nutrients
      if (!energyKj) {
        logger.debug('[NutriScore] Insufficient data: missing energy');
        return null;
      }
      if (saturatedFat === undefined && saturatedFat !== 0) {
        logger.debug('[NutriScore] Insufficient data: missing saturated fat');
        return null;
      }
      if (sugars === undefined && sugars !== 0) {
        logger.debug('[NutriScore] Insufficient data: missing sugars');
        return null;
      }
      if (sodium === undefined && sodium !== 0) {
        logger.debug('[NutriScore] Insufficient data: missing sodium/salt');
        return null;
      }
    }
    
    // Step 3: Calculate Negative Points (N)
    let negativePoints = 0;
    
    // Energy (kJ per 100g)
    if (energyKj >= 3350) negativePoints += 10;
    else if (energyKj >= 3015) negativePoints += 9;
    else if (energyKj >= 2680) negativePoints += 8;
    else if (energyKj >= 2345) negativePoints += 7;
    else if (energyKj >= 2010) negativePoints += 6;
    else if (energyKj >= 1675) negativePoints += 5;
    else if (energyKj >= 1340) negativePoints += 4;
    else if (energyKj >= 1005) negativePoints += 3;
    else if (energyKj >= 670) negativePoints += 2;
    else if (energyKj >= 335) negativePoints += 1;
    
    // Saturated fat (g per 100g)
    if (saturatedFat >= 10) negativePoints += 10;
    else if (saturatedFat >= 9) negativePoints += 9;
    else if (saturatedFat >= 8) negativePoints += 8;
    else if (saturatedFat >= 7) negativePoints += 7;
    else if (saturatedFat >= 6) negativePoints += 6;
    else if (saturatedFat >= 5) negativePoints += 5;
    else if (saturatedFat >= 4) negativePoints += 4;
    else if (saturatedFat >= 3) negativePoints += 3;
    else if (saturatedFat >= 2) negativePoints += 2;
    else if (saturatedFat >= 1) negativePoints += 1;
    
    // Sugars (g per 100g)
    if (sugars >= 45) negativePoints += 10;
    else if (sugars >= 40) negativePoints += 9;
    else if (sugars >= 36) negativePoints += 8;
    else if (sugars >= 31) negativePoints += 7;
    else if (sugars >= 27) negativePoints += 6;
    else if (sugars >= 22.5) negativePoints += 5;
    else if (sugars >= 18) negativePoints += 4;
    else if (sugars >= 13.5) negativePoints += 3;
    else if (sugars >= 9) negativePoints += 2;
    else if (sugars >= 4.5) negativePoints += 1;
    
    // Sodium (mg per 100g)
    if (sodium >= 900) negativePoints += 10;
    else if (sodium >= 810) negativePoints += 9;
    else if (sodium >= 720) negativePoints += 8;
    else if (sodium >= 630) negativePoints += 7;
    else if (sodium >= 540) negativePoints += 6;
    else if (sodium >= 450) negativePoints += 5;
    else if (sodium >= 360) negativePoints += 4;
    else if (sodium >= 270) negativePoints += 3;
    else if (sodium >= 180) negativePoints += 2;
    else if (sodium >= 90) negativePoints += 1;
    
    // Step 4: Calculate Positive Points (P)
    let positivePoints = 0;
    
    // Fruits, vegetables, nuts, and legumes (g per 100g)
    if (fruitsVegetablesNuts >= 80) positivePoints += 5;
    else if (fruitsVegetablesNuts >= 60) positivePoints += 2;
    else if (fruitsVegetablesNuts >= 40) positivePoints += 1;
    
    // Fiber (g per 100g)
    if (fiber >= 4.7) positivePoints += 5;
    else if (fiber >= 3.7) positivePoints += 4;
    else if (fiber >= 2.8) positivePoints += 3;
    else if (fiber >= 1.9) positivePoints += 2;
    else if (fiber >= 0.9) positivePoints += 1;
    
    // Protein (g per 100g)
    if (protein >= 8) positivePoints += 5;
    else if (protein >= 6.4) positivePoints += 4;
    else if (protein >= 4.8) positivePoints += 3;
    else if (protein >= 3.2) positivePoints += 2;
    else if (protein >= 1.6) positivePoints += 1;
    
    // Step 5: Calculate Final Score
    // Final Score = Negative Points (N) - Positive Points (P)
    const finalScore = negativePoints - positivePoints;
    
    // Step 6: Map Score to Grade
    let grade: 'a' | 'b' | 'c' | 'd' | 'e';
    if (finalScore <= -1) {
      grade = 'a'; // Best
    } else if (finalScore <= 2) {
      grade = 'b';
    } else if (finalScore <= 10) {
      grade = 'c';
    } else if (finalScore <= 18) {
      grade = 'd';
    } else {
      grade = 'e'; // Worst
    }
    
    logger.debug(`[NutriScore] Calculated: grade=${grade}, score=${finalScore} (N=${negativePoints}, P=${positivePoints})`);
    
    return {
      grade,
      score: finalScore,
    };
  } catch (error) {
    logger.debug('[NutriScore] Error calculating Nutri-Score:', error);
    return null;
  }
}

/**
 * Check if product has sufficient nutrition data for Nutri-Score calculation
 */
export function hasRequiredNutrientsForNutriScore(nutriments: ProductNutriments | undefined): boolean {
  if (!nutriments) return false;
  
  const energyKcal = nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0;
  const energyKj = nutriments['energy-kj_100g'] || nutriments['energy-kj'] || (energyKcal * 4.184);
  const saturatedFat = nutriments['saturated-fat_100g'] || nutriments['saturated-fat'] || 0;
  const sugars = nutriments['sugars_100g'] || nutriments['sugars'] || 0;
  const sodiumMg = nutriments['sodium_100g'] || nutriments['sodium'] || 0;
  const saltG = nutriments['salt_100g'] || nutriments['salt'] || 0;
  const sodium = sodiumMg > 0 || saltG > 0;
  
  return !!(energyKj && (saturatedFat !== undefined || saturatedFat === 0) && (sugars !== undefined || sugars === 0) && sodium);
}

