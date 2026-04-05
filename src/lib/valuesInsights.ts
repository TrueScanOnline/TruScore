// Values insights generator - generates insights based on user preferences and product data
import { Product } from '../types/product';
import { ValuesPreferences } from '../store/useValuesStore';
import { Insight } from './truscoreEngine';
import { VALUES_COLORS } from '../theme/valuesColors';
import { logger } from '../utils/logger';

// Known companies linked to regions (simplified - in production, use comprehensive database)
const ISRAEL_LINKED_BRANDS = ['soda-stream', 'strauss', 'osem', 'tnuva', 'sabon', 'coca-cola', 'coke', 'coca cola'];
const PALESTINE_LINKED_BRANDS = ['palestine', 'najjar', 'al-arabiya'];
const CHINA_LINKED_BRANDS = ['china', 'chinese', 'made in china', 'haier', 'huawei', 'lenovo', 'xiaomi'];
const INDIA_LINKED_BRANDS = ['india', 'indian', 'made in india', 'tata', 'reliance', 'infosys'];

// Known cruel parent companies (from truscoreEngine + additional)
const CRUEL_PARENTS = [
  'unilever', 'procter & gamble', 'p&g', "l'oreal", 'loreal', 'estee lauder',
  'estée lauder', 'colgate-palmolive', 'johnson & johnson', 'j&j', 'reckitt',
  'reckitt benckiser', 'rb', 'henkel', 'beiersdorf', 'shiseido', 'kao',
  'sc johnson', 's.c. johnson', 'clorox', 'church & dwight', 'coty', 'revlon',
  'nestle', 'nestlé', 'mars', 'mondelez', 'danone', 'kimberly-clark',
  'ferrero', 'nutella', 'ferrero rocher',
];

// Top 5 boycotts by market cap
const TOP_BOYCOUTS = [
  'Procter & Gamble',
  'Coca-Cola',
  "L'Oréal",
  'Nestlé',
  'Unilever',
];

function openFoodFactsProductUrl(barcode: string): string {
  const b = (barcode || '').trim();
  return b
    ? `https://world.openfoodfacts.org/product/${encodeURIComponent(b)}`
    : 'https://world.openfoodfacts.org/';
}

const REFERENCE = {
  crueltyFreeInternational: 'https://www.crueltyfreeinternational.org/',
  iloForcedLabour: 'https://www.ilo.org/topics/forced-labour',
  rspo: 'https://rspo.org/',
} as const;

/**
 * Generate insights based on user preferences and product data
 * Includes input validation and error handling
 */
export function generateInsights(
  product: Product | null | undefined,
  preferences: ValuesPreferences | null | undefined
): Insight[] {
  // Input validation
  if (!product || typeof product !== 'object') {
    return [];
  }
  
  if (!preferences || typeof preferences !== 'object') {
    return [];
  }

  try {
    const insights: Insight[] = [];
    const barcode = (product.barcode || '').trim();
    const offProductUrl = openFoodFactsProductUrl(barcode);
    const brands = (product.brands || '').toLowerCase();
    const origins = (product.origins_tags || []).map((o: string) => 
      typeof o === 'string' ? o.toLowerCase() : ''
    ).filter(Boolean);
    const manufacturingPlaces = (product.manufacturing_places_tags || []).map((m: string) => 
      typeof m === 'string' ? m.toLowerCase() : ''
    ).filter(Boolean);
    const allOrigins = [...origins, ...manufacturingPlaces].join(' ');
    const analysisTags = (product.ingredients_analysis_tags || []).filter((tag: unknown) => 
      typeof tag === 'string'
    ) as string[];

  // Geopolitical insights
  if (preferences.geopoliticalEnabled) {
    // Israel-Palestine
    if (preferences.israelPalestine === 'avoid_israel') {
      const isIsraelLinked = ISRAEL_LINKED_BRANDS.some(brand => brands.includes(brand)) ||
        allOrigins.includes('israel') || allOrigins.includes('il') ||
        (product.brands || '').toLowerCase().includes('coca-cola') ||
        (product.brands || '').toLowerCase().includes('coke');
      if (isIsraelLinked) {
        insights.push({
          type: 'geopolitical',
          reason: 'Geopolitical Insight: Matches Avoid Israel-linked preference',
          source: 'Product origin/brand analysis',
          color: VALUES_COLORS.geopolitical,
          referenceUrl: offProductUrl,
          referenceLabel: 'View product on Open Food Facts',
        });
      }
    } else if (preferences.israelPalestine === 'avoid_palestine') {
      const isPalestineLinked = PALESTINE_LINKED_BRANDS.some(brand => brands.includes(brand)) ||
        allOrigins.includes('palestine') || allOrigins.includes('ps');
      if (isPalestineLinked) {
        insights.push({
          type: 'geopolitical',
          reason: 'Geopolitical Insight: Matches Avoid Palestine-linked preference',
          source: 'Product origin/brand analysis',
          color: VALUES_COLORS.geopolitical,
          referenceUrl: offProductUrl,
          referenceLabel: 'View product on Open Food Facts',
        });
      }
    }

    // India-China
    if (preferences.indiaChina === 'avoid_china') {
      const isChinaLinked = CHINA_LINKED_BRANDS.some(brand => brands.includes(brand)) ||
        allOrigins.includes('china') || allOrigins.includes('cn');
      if (isChinaLinked) {
        insights.push({
          type: 'geopolitical',
          reason: 'Geopolitical Insight: Matches Avoid China-linked preference',
          source: 'Product origin/brand analysis',
          color: VALUES_COLORS.geopolitical,
          referenceUrl: offProductUrl,
          referenceLabel: 'View product on Open Food Facts',
        });
      }
    } else if (preferences.indiaChina === 'avoid_india') {
      const isIndiaLinked = INDIA_LINKED_BRANDS.some(brand => brands.includes(brand)) ||
        allOrigins.includes('india') || allOrigins.includes('in');
      if (isIndiaLinked) {
        insights.push({
          type: 'geopolitical',
          reason: 'Geopolitical Insight: Matches Avoid India-linked preference',
          source: 'Product origin/brand analysis',
          color: VALUES_COLORS.geopolitical,
          referenceUrl: offProductUrl,
          referenceLabel: 'View product on Open Food Facts',
        });
      }
    }
  }

  // Ethical insights
  if (preferences.ethicalEnabled) {
    // Animal Testing / Cruelty
    if (preferences.avoidAnimalTesting) {
      const isCruelParent = CRUEL_PARENTS.some(parent => brands.includes(parent));
      if (isCruelParent) {
        insights.push({
          type: 'ethical',
          reason: 'Parent company linked to animal testing/cruelty',
          source: 'Known cruel parent companies database',
          color: VALUES_COLORS.ethical,
          referenceUrl: REFERENCE.crueltyFreeInternational,
          referenceLabel: 'Cruelty Free International',
        });
      }
    }

    // Forced/Child Labour
    if (preferences.avoidForcedLabour) {
      // Check for known labor issues (simplified - in production, use comprehensive database)
      const hasLaborConcerns = analysisTags.some((tag: string) =>
        tag.toLowerCase().includes('labor') || tag.toLowerCase().includes('labour')
      );
      if (hasLaborConcerns) {
        insights.push({
          type: 'ethical',
          reason: 'Potential forced/child labor concerns',
          source: 'Product analysis tags',
          color: VALUES_COLORS.ethical,
          referenceUrl: REFERENCE.iloForcedLabour,
          referenceLabel: 'ILO — forced labour',
        });
      }
    }
  }

  // Environmental insights
  if (preferences.environmentalEnabled) {
    if (preferences.avoidPalmOil) {
      // Use the SAME logic as extractPalmOilAnalysis to ensure consistency
      // Check if product has palm_oil_analysis (from extractPalmOilAnalysis)
      if (product.palm_oil_analysis) {
        const palmOilAnalysis = product.palm_oil_analysis;
        // Only show insight if palm oil is actually detected (not free, not unknown)
        // This matches the Palm Oil card logic exactly
        if (palmOilAnalysis.containsPalmOil && !palmOilAnalysis.isPalmOilFree) {
          insights.push({
            type: 'environmental',
            reason: palmOilAnalysis.isNonSustainable 
              ? 'Contains non-sustainable palm oil'
              : 'Contains palm oil',
            source: palmOilAnalysis.detectedFromIngredientsText 
              ? 'Ingredients analysis'
              : 'Open Food Facts data',
            color: VALUES_COLORS.environmental,
            referenceUrl: REFERENCE.rspo,
            referenceLabel: 'RSPO — sustainable palm oil',
          });
        }
      } else {
        // Fallback: If palm_oil_analysis doesn't exist, use same comprehensive detection logic
        // This ensures consistency even if analysis wasn't created
        const hasPalmOilTag = analysisTags.some((tag: string) =>
          tag.toLowerCase().includes('palm') && !tag.toLowerCase().includes('palm-oil-free')
        );
        const ingredientsText = (product.ingredients_text || '').toLowerCase();
        
        // Use the SAME comprehensive patterns as extractPalmOilAnalysis
        const palmOilDirectPattern = /\bpalm\s+oil\b/i;
        const palmOilVariations = /\b(palmolein|palm\s+fat|palm\s+kernel\s+oil|palm\s+stearin|palm\s+olein|palm\s+fruit\s+oil)\b/i;
        const palmDerivativesPattern = /\b(palmate|palmitate|palmityl|palmitic\s+acid|stearic\s+acid|glyceryl\s+stearate)\b/i;
        const palmScientificPattern = /\belaeis\s+guineensis\b/i;
        const palmSodiumPattern = /\b(sodium\s+lauryl\s+sulfate|sodium\s+kernelate|sodium\s+palm\s+kernelate)\b/i;
        const palmOilFreePattern = /\bpalm[-\s]?oil[-\s]?free\b/i;
        
        // Check for palm-oil-free first (explicit statement)
        if (palmOilFreePattern.test(ingredientsText)) {
          // Explicitly palm-oil-free, don't show insight
        } else if (
          hasPalmOilTag || 
          palmOilDirectPattern.test(ingredientsText) || 
          palmOilVariations.test(ingredientsText) ||
          palmDerivativesPattern.test(ingredientsText) ||
          palmScientificPattern.test(ingredientsText) ||
          palmSodiumPattern.test(ingredientsText)
        ) {
          // Palm oil or derivatives detected
          insights.push({
            type: 'environmental',
            reason: 'Contains palm oil',
            source: 'Ingredients analysis',
            color: VALUES_COLORS.environmental,
            referenceUrl: REFERENCE.rspo,
            referenceLabel: 'RSPO — sustainable palm oil',
          });
        }
      }
    }
  }

    return insights;
  } catch (error) {
    logger.error('[valuesInsights] Error generating insights', error);
    return []; // Safe fallback
  }
}

export { TOP_BOYCOUTS };

