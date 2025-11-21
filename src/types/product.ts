// Product data types for TrueScan

export interface ProductImage {
  front?: string;
  front_small?: string;
  front_thumb?: string;
  ingredients?: string;
  nutrition?: string;
  packaging?: string;
}

export interface ProductNutriments {
  energy?: number;
  'energy-kcal'?: number;
  'energy-kcal_100g'?: number;
  fat?: number;
  'fat_100g'?: number;
  'saturated-fat'?: number;
  'saturated-fat_100g'?: number;
  carbohydrates?: number;
  'carbohydrates_100g'?: number;
  sugars?: number;
  'sugars_100g'?: number;
  fiber?: number;
  'fiber_100g'?: number;
  proteins?: number;
  'proteins_100g'?: number;
  salt?: number;
  'salt_100g'?: number;
  sodium?: number;
  'sodium_100g'?: number;
}

export interface ProductNutrientLevels {
  fat?: 'low' | 'moderate' | 'high';
  saturated_fat?: 'low' | 'moderate' | 'high';
  sugars?: 'low' | 'moderate' | 'high';
  salt?: 'low' | 'moderate' | 'high';
}

export interface Ingredient {
  id: string;
  text: string;
  percent_estimate?: number;
  rank?: number;
  vegan?: 'yes' | 'no' | 'maybe' | 'unknown';
  vegetarian?: 'yes' | 'no' | 'maybe' | 'unknown';
  origin?: string[];
  country?: string;
}

export interface Additive {
  id: string;
  name: string;
  tag: string;
  e_number?: string;
  warning?: string;
}

export interface Certification {
  id: string;
  name: string;
  tag: string;
  icon_url?: string;
  description?: string;
}

// Enhanced Eco-Score data with full breakdown
export interface AgribalyseData {
  co2_total?: number; // kg CO2e per kg of product
  ef_total?: number; // Environmental footprint
  land_use?: number; // m² per kg
  water_usage?: number; // liters per kg
  biodiversity_threats?: number;
  [key: string]: any; // Allow other agribalyse fields
}

export interface EcoScore {
  score: number; // 0-100
  grade: 'a' | 'b' | 'c' | 'd' | 'e' | 'unknown';
  agribalyse_score?: number;
  agribalyse?: AgribalyseData; // Full Agribalyse LCA data
  co2_total?: number; // kg CO2e per kg (from agribalyse.co2_total)
  co2_total_fr?: number; // French-specific CO2
  water_footprint?: number; // liters per kg (from agribalyse.water_usage)
  land_use?: number; // m² per kg (from agribalyse.land_use)
  biodiversity_threats?: number; // From agribalyse.biodiversity_threats
  transport_impact?: number; // Transport penalty/bonus
  packaging_impact?: number; // Packaging penalty/bonus
  origins_of_ingredients?: any; // Origins breakdown
  deforestation?: 'low' | 'moderate' | 'high' | 'unknown';
  [key: string]: any; // Allow other ecoscore_data fields from OFF
}

// Palm oil analysis from ingredients_analysis_tags
export interface PalmOilAnalysis {
  containsPalmOil: boolean;
  isPalmOilFree: boolean;
  isNonSustainable: boolean;
  score: number; // -10 to +10 (penalty for palm oil, bonus for palm-oil-free)
}

// Packaging sustainability data
export interface PackagingItem {
  material?: string; // e.g., "en:plastic", "en:cardboard"
  shape?: string; // e.g., "en:bottle", "en:box"
  recycling?: string; // e.g., "en:recyclable", "en:non-recyclable"
  [key: string]: any;
}

export interface PackagingData {
  items: PackagingItem[]; // From packagings array
  isRecyclable: boolean; // From packaging_tags
  isReusable: boolean; // From packaging_tags
  isBiodegradable: boolean; // From packaging_tags
  recyclabilityScore: number; // 0-100 calculated score
}

export interface Product {
  barcode: string;
  product_name?: string;
  product_name_en?: string;
  generic_name?: string;
  brands?: string;
  brand_owner?: string;
  categories?: string;
  categories_tags?: string[];
  
  // Images
  image_url?: string;
  image_front_url?: string;
  image_front_small_url?: string;
  image_ingredients_url?: string;
  image_nutrition_url?: string;
  images?: ProductImage;
  
  // Nutrition
  nutriments?: ProductNutriments;
  nutrient_levels?: ProductNutrientLevels;
  nova_group?: 1 | 2 | 3 | 4; // NOVA processing score
  nova_groups?: string;
  
  // Ingredients
  ingredients_text?: string;
  ingredients_text_en?: string;
  ingredients?: Ingredient[];
  ingredients_analysis?: {
    'en:palm-oil'?: 'yes' | 'no' | 'maybe' | 'unknown';
    'en:vegan'?: 'yes' | 'no' | 'maybe' | 'unknown';
    'en:vegetarian'?: 'yes' | 'no' | 'maybe' | 'unknown';
    'en:non-vegan'?: 'yes' | 'no' | 'maybe' | 'unknown';
  };
  ingredients_analysis_tags?: string[]; // Full tags array from OFF (e.g., ["en:palm-oil", "en:vegan"])
  
  // Additives & Allergens
  additives_tags?: string[];
  additives?: Additive[];
  allergens?: string;
  allergens_tags?: string[];
  traces?: string;
  traces_tags?: string[];
  
  // Origin & Ethics
  origins?: string;
  origins_tags?: string[];
  countries?: string;
  countries_tags?: string[];
  countries_en?: string;
  manufacturing_places?: string;
  manufacturing_places_tags?: string[];
  
  // Certifications
  labels?: string;
  labels_tags?: string[];
  labels_en?: string;
  certifications?: Certification[];
  
  // Sustainability
  ecoscore_data?: EcoScore;
  ecoscore_grade?: 'a' | 'b' | 'c' | 'd' | 'e' | 'unknown';
  ecoscore_score?: number;
  
  // Nutrition (Nutri-Score)
  nutriscore_grade?: 'a' | 'b' | 'c' | 'd' | 'e' | 'unknown';
  nutriscore_score?: number;
  
  // Animal welfare (if applicable)
  animal_welfare?: {
    rating?: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
    cage_free?: boolean;
    free_range?: boolean;
    organic_animal?: boolean;
  };
  
  // Processing
  processing?: string;
  processing_tags?: string[];
  
  // Fishing method (for seafood)
  fishing_method?: string;
  fishing_methods_tags?: string[];
  
  // Misc
  quantity?: string;
  packaging?: string;
  packaging_tags?: string[];
  packagings?: PackagingItem[]; // Full packaging array from OFF
  serving_size?: string;
  
  // Enhanced sustainability data (extracted from OFF)
  palm_oil_analysis?: PalmOilAnalysis;
  packaging_data?: PackagingData;
  
  // Food recall information
  recalls?: FoodRecall[];
  
  // Metadata
  created_t?: number;
  last_modified_t?: number;
  states?: string;
  states_tags?: string[];
  completion?: number; // 0-100
  quality?: number; // 0-100
  
  // API source
  source?: 'openfoodfacts' | 'openbeautyfacts' | 'openproductsfacts' | 'openpetfoodfacts' | 'usda_fooddata' | 'gs1_datasource' | 'off_api' | 'barcode_spider' | 'spoonacular' | 'upcitemdb' | 'web_search';
}

export interface TrustScoreBreakdown {
  body: number; // 0-25 (Body Safety: Nutri-Score + NOVA + additives + allergens)
  planet: number; // 0-25 (Planet: Eco-Score + packaging + palm oil)
  care: number; // 0-25 (Care: Certifications + ethical labels)
  open: number; // 0-25 (Open: Ingredient disclosure transparency - hidden terms detection)
  // Legacy fields for backward compatibility (still calculated but not used in score)
  sustainability?: number; // Deprecated - use planet
  ethics?: number; // Deprecated - use care
  bodySafety?: number; // Deprecated - use body
  processing?: number; // Deprecated - NOVA now merged into body (displayed separately for education)
  transparency?: number; // Deprecated - use open
  reasons: string[];
}

// Food recall data
export interface FoodRecall {
  recallId: string;
  productName: string;
  brand?: string;
  reason: string;
  recallDate: string;
  distribution?: string[];
  isActive: boolean;
  url?: string;
}

export interface ProductWithTrustScore extends Product {
  trust_score: number | null; // 0-100, or null if insufficient data
  trust_score_breakdown: TrustScoreBreakdown | null;
  // v1.3 metadata for UI transparency warnings
  _truscore_metadata?: {
    hasNutriScore?: boolean;
    hasEcoScore?: boolean;
    hasOrigin?: boolean;
  };
}

