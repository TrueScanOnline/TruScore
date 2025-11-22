// Values insights generator - generates insights based on user preferences and product data
import { Product } from '../types/product';
import { ValuesPreferences } from '../store/useValuesStore';
import { Insight } from './truscoreEngine';

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

/**
 * Generate insights based on user preferences and product data
 */
export function generateInsights(
  product: Product,
  preferences: ValuesPreferences
): Insight[] {
  const insights: Insight[] = [];
  const brands = (product.brands || '').toLowerCase();
  const origins = (product.origins_tags || []).map((o: string) => o.toLowerCase());
  const manufacturingPlaces = (product.manufacturing_places_tags || []).map((m: string) => m.toLowerCase());
  const allOrigins = [...origins, ...manufacturingPlaces].join(' ');
  const analysisTags = product.ingredients_analysis_tags || [];

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
          reason: 'Geopolitical Insight: Matches your Avoid Israel-linked preference',
          source: 'Product origin/brand analysis',
          color: '#ff6b6b', // Red
        });
      }
    } else if (preferences.israelPalestine === 'avoid_palestine') {
      const isPalestineLinked = PALESTINE_LINKED_BRANDS.some(brand => brands.includes(brand)) ||
        allOrigins.includes('palestine') || allOrigins.includes('ps');
      if (isPalestineLinked) {
        insights.push({
          type: 'geopolitical',
          reason: 'Geopolitical Insight: Matches your Avoid Palestine-linked preference',
          source: 'Product origin/brand analysis',
          color: '#ff6b6b', // Red
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
          reason: 'Geopolitical Insight: Matches your Avoid China-linked preference',
          source: 'Product origin/brand analysis',
          color: '#ff6b6b', // Red
        });
      }
    } else if (preferences.indiaChina === 'avoid_india') {
      const isIndiaLinked = INDIA_LINKED_BRANDS.some(brand => brands.includes(brand)) ||
        allOrigins.includes('india') || allOrigins.includes('in');
      if (isIndiaLinked) {
        insights.push({
          type: 'geopolitical',
          reason: 'Geopolitical Insight: Matches your Avoid India-linked preference',
          source: 'Product origin/brand analysis',
          color: '#ff6b6b', // Red
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
          color: '#9b59b6', // Purple
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
          color: '#9b59b6', // Purple
        });
      }
    }
  }

  // Environmental insights
  if (preferences.environmentalEnabled) {
    if (preferences.avoidPalmOil) {
      const hasPalmOil = analysisTags.some((tag: string) =>
        tag.toLowerCase().includes('palm') && !tag.toLowerCase().includes('palm-oil-free')
      ) || (product.ingredients_text || '').toLowerCase().includes('palm oil');
      
      if (hasPalmOil) {
        insights.push({
          type: 'environmental',
          reason: 'Contains unsustainable palm oil',
          source: 'Ingredients analysis',
          color: '#16a085', // Green
        });
      }
    }
  }

  return insights;
}

export { TOP_BOYCOUTS };

