// Manual Product Data Types
// Shared types for user-contributed product data
// Separated to avoid circular dependencies

import { Product } from './product';

export interface ManualProductData {
  barcode: string;
  product_name: string;
  brands?: string;
  ingredients_text?: string;
  image_url?: string;
  nutriments?: Product['nutriments'];
  serving_size?: string;
  quantity?: string;
  manufacturing_places?: string;
  manufacturing_places_tags?: string[];
  countries?: string;
  countries_tags?: string[];
  origins?: string;
  origins_tags?: string[];
  categories?: string;
  allergens_tags?: string[];
  additives_tags?: string[];
  packaging_data?: Product['packaging_data'];
  /** OFF-style labels (e.g. en:organic) for certification badges + Ethics pillar */
  labels_tags?: string[];
  labels_hierarchy?: string[];
  notes?: string; // User notes
  timestamp: number;
  userId?: string; // For future multi-user support
}






