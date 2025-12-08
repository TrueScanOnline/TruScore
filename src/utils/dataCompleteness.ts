// Data Completeness Calculator
// Calculates how complete product data is from each source
// Used for logging and quality metrics

import { Product } from '../types/product';

export interface DataCompletenessMetrics {
  total: number; // 0-100
  nutrition: number; // 0-25
  ingredients: number; // 0-25
  certifications: number; // 0-15
  sustainability: number; // 0-15
  brand: number; // 0-10
  images: number; // 0-10
  breakdown: {
    hasNutrition: boolean;
    hasIngredients: boolean;
    hasCertifications: boolean;
    hasEcoScore: boolean;
    hasPalmOilAnalysis: boolean;
    hasPackaging: boolean;
    hasBrand: boolean;
    hasImage: boolean;
    hasOrigin: boolean;
  };
}

/**
 * Calculate data completeness metrics for a product
 */
export function calculateDataCompleteness(product: Product | null | undefined): DataCompletenessMetrics {
  if (!product) {
    return {
      total: 0,
      nutrition: 0,
      ingredients: 0,
      certifications: 0,
      sustainability: 0,
      brand: 0,
      images: 0,
      breakdown: {
        hasNutrition: false,
        hasIngredients: false,
        hasCertifications: false,
        hasEcoScore: false,
        hasPalmOilAnalysis: false,
        hasPackaging: false,
        hasBrand: false,
        hasImage: false,
        hasOrigin: false,
      },
    };
  }

  // Nutrition completeness (0-25 points)
  let nutritionScore = 0;
  const nutriments = product.nutriments || {};
  const hasEnergy = !!(nutriments.energy || nutriments['energy-kcal'] || nutriments['energy-kj']);
  const hasMacros = !!(nutriments.fat || nutriments.carbohydrates || nutriments.proteins);
  const hasMicros = !!(nutriments.salt || nutriments.sodium || nutriments.fiber || nutriments.sugars);
  const hasNutriScore = !!(product.nutriscore_grade || product.nutriscore_score !== undefined);
  
  if (hasEnergy) nutritionScore += 5;
  if (hasMacros) nutritionScore += 10;
  if (hasMicros) nutritionScore += 5;
  if (hasNutriScore) nutritionScore += 5;

  // Ingredients completeness (0-25 points)
  let ingredientsScore = 0;
  const hasIngredientsText = !!(product.ingredients_text && product.ingredients_text.trim().length > 0);
  const hasIngredientsArray = !!(product.ingredients && Array.isArray(product.ingredients) && product.ingredients.length > 0);
  const hasAnalysisTags = !!(product.ingredients_analysis_tags && product.ingredients_analysis_tags.length > 0);
  const hasAdditives = !!(product.additives_tags && product.additives_tags.length > 0);
  
  if (hasIngredientsText) ingredientsScore += 15;
  if (hasIngredientsArray) ingredientsScore += 5;
  if (hasAnalysisTags) ingredientsScore += 3;
  if (hasAdditives) ingredientsScore += 2;

  // Certifications completeness (0-15 points)
  let certificationsScore = 0;
  const hasCertifications = !!(product.certifications && Array.isArray(product.certifications) && product.certifications.length > 0);
  const hasLabels = !!(product.labels_tags && Array.isArray(product.labels_tags) && product.labels_tags.length > 0);
  const hasOrganic = !!(hasLabels && product.labels_tags!.some((l: string) => l.toLowerCase().includes('organic')));
  const hasVegan = !!(hasLabels && product.labels_tags!.some((l: string) => l.toLowerCase().includes('vegan')));
  
  if (hasCertifications) certificationsScore += 10;
  if (hasLabels) certificationsScore += 3;
  if (hasOrganic || hasVegan) certificationsScore += 2;

  // Sustainability completeness (0-15 points)
  let sustainabilityScore = 0;
  const hasEcoScore = !!(product.ecoscore_grade || product.ecoscore_score !== undefined);
  const hasPalmOilAnalysis = !!(product.palm_oil_analysis);
  const hasPackaging = !!(product.packaging && Array.isArray(product.packaging) && product.packaging.length > 0);
  const hasOrigin = !!(product.origins_tags && product.origins_tags.length > 0) || 
                    !!(product.manufacturing_places_tags && product.manufacturing_places_tags.length > 0);
  
  if (hasEcoScore) sustainabilityScore += 8;
  if (hasPalmOilAnalysis) sustainabilityScore += 4;
  if (hasPackaging) sustainabilityScore += 2;
  if (hasOrigin) sustainabilityScore += 1;

  // Brand completeness (0-10 points)
  let brandScore = 0;
  const hasBrand = !!(product.brands && product.brands.trim().length > 0);
  // Note: brands_tags may not exist in Product type, so we check safely
  const hasBrandTags = !!(product.brands && product.brands.includes(','));
  
  if (hasBrand) brandScore += 7;
  if (hasBrandTags) brandScore += 3;

  // Images completeness (0-10 points)
  let imagesScore = 0;
  const hasImage = !!(product.image_url);
  const hasFrontImage = !!(product.image_front_url);
  const hasImages = !!(product.images && typeof product.images === 'object');
  
  if (hasImage || hasFrontImage) imagesScore += 8;
  if (hasImages) imagesScore += 2;

  const total = Math.min(100, 
    nutritionScore + 
    ingredientsScore + 
    certificationsScore + 
    sustainabilityScore + 
    brandScore + 
    imagesScore
  );

  return {
    total: Math.round(total),
    nutrition: Math.round(nutritionScore),
    ingredients: Math.round(ingredientsScore),
    certifications: Math.round(certificationsScore),
    sustainability: Math.round(sustainabilityScore),
    brand: Math.round(brandScore),
    images: Math.round(imagesScore),
    breakdown: {
      hasNutrition: hasEnergy || hasMacros || hasMicros,
      hasIngredients: hasIngredientsText || hasIngredientsArray,
      hasCertifications: hasCertifications || hasLabels,
      hasEcoScore,
      hasPalmOilAnalysis,
      hasPackaging,
      hasBrand,
      hasImage: hasImage || hasFrontImage,
      hasOrigin,
    },
  };
}

/**
 * Format completeness metrics for logging
 */
export function formatCompletenessMetrics(metrics: DataCompletenessMetrics, source: string): string {
  const parts = [
    `[${source}]`,
    `Total: ${metrics.total}%`,
    `Nutrition: ${metrics.nutrition}/25`,
    `Ingredients: ${metrics.ingredients}/25`,
    `Certifications: ${metrics.certifications}/15`,
    `Sustainability: ${metrics.sustainability}/15`,
    `Brand: ${metrics.brand}/10`,
    `Images: ${metrics.images}/10`,
  ];
  return parts.join(' | ');
}











