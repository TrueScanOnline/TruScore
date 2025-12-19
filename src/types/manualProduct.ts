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
  countries?: string;
  categories?: string;
  allergens_tags?: string[];
  additives_tags?: string[];
  packaging_data?: Product['packaging_data'];
  notes?: string; // User notes
  timestamp: number;
  userId?: string; // For future multi-user support
}



