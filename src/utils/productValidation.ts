// Product data validation using Zod schemas
// Ensures data integrity and prevents XSS/corruption

import { z } from 'zod';
import { Product } from '../types/product';
import { sanitizeText } from './validation';

// Nutri-Score grade schema
const NutriScoreGradeSchema = z.enum(['a', 'b', 'c', 'd', 'e']).optional();

// Eco-Score grade schema
const EcoScoreGradeSchema = z.enum(['a', 'b', 'c', 'd', 'e']).optional();

// NOVA group schema
const NovaGroupSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional();

// Product schema with validation
export const ProductSchema = z.object({
  code: z.string().min(8).max(14).regex(/^\d+$/).or(z.string().min(8).max(14)),
  product_name: z.string().max(500).optional().nullable(),
  product_name_en: z.string().max(500).optional().nullable(),
  brands: z.string().max(200).optional().nullable(),
  categories: z.string().max(500).optional().nullable(),
  categories_tags: z.array(z.string()).optional(),
  labels_tags: z.array(z.string()).optional(),
  ingredients_text: z.string().max(5000).optional().nullable(),
  additives_tags: z.array(z.string()).optional(),
  allergens_tags: z.array(z.string()).optional(),
  nutriscore_grade: NutriScoreGradeSchema,
  ecoscore_grade: EcoScoreGradeSchema,
  nova_group: NovaGroupSchema,
  image_url: z.string().url().optional().nullable(),
  image_small_url: z.string().url().optional().nullable(),
  image_front_url: z.string().url().optional().nullable(),
  origins_tags: z.array(z.string()).optional(),
  manufacturing_places_tags: z.array(z.string()).optional(),
  ingredients_analysis_tags: z.array(z.string()).optional(),
  nutriments: z.record(z.string(), z.unknown()).optional().nullable(),
  // Allow additional fields but validate known ones
}).passthrough();

// Validate and sanitize product data
export function validateProduct(data: unknown): { valid: boolean; product?: Product; error?: string } {
  try {
    const validated = ProductSchema.parse(data);
    
    // Additional sanitization - sanitizeText accepts (input, maxLength) where maxLength is optional
    const sanitized: Product = {
      ...validated,
      barcode: validated.code, // Map 'code' to 'barcode' for Product type
      product_name: validated.product_name ? sanitizeText(validated.product_name, 500) : undefined,
      product_name_en: validated.product_name_en ? sanitizeText(validated.product_name_en, 500) : undefined,
      brands: validated.brands ? sanitizeText(validated.brands, 200) : undefined,
      ingredients_text: validated.ingredients_text ? sanitizeText(validated.ingredients_text, 5000) : undefined,
      source: 'openfoodfacts', // Default source
    } as Product; // Type assertion needed due to passthrough() allowing extra fields
    
    return { valid: true, product: sanitized };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: `Validation failed: ${error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      };
    }
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}

// Note: sanitizeText is imported from validation.ts

// Safe product getter with validation
export function getSafeProduct(data: unknown): Product | null {
  const validation = validateProduct(data);
  return validation.valid ? validation.product || null : null;
}

