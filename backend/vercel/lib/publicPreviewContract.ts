/**
 * Public /api/product-preview score contract.
 *
 * This route has no server-verifiable settled/Rated publication snapshot.
 * trust_score and trust_score_breakdown are therefore always present and JSON null.
 * They are not omitted. Identity, photograph and non-score catalogue fields are kept.
 * Raw pillar arithmetic passed in by a caller is ignored and must not be copied through.
 */

export type IgnoredPreviewScores = {
  trust_score?: number | null;
  trust_score_breakdown?: {
    body?: number;
    planet?: number;
    ethics?: number;
    care?: number;
    open?: number;
  } | null;
};

export type PublicPreviewInput = IgnoredPreviewScores & {
  barcode: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  image_url?: string;
  nutriments?: unknown;
  ingredients_text?: string;
  nova_group?: number;
  ecoscore_grade?: string;
  categories?: string;
};

export type PublicProductPreview = {
  barcode: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  image_url?: string;
  trust_score: null;
  trust_score_breakdown: null;
  nutriments?: unknown;
  ingredients_text?: string;
  nova_group?: number;
  ecoscore_grade?: string;
  categories?: string;
};

export function toPublicProductPreview(source: PublicPreviewInput): PublicProductPreview {
  return {
    barcode: source.barcode,
    product_name: source.product_name,
    product_name_en: source.product_name_en,
    brands: source.brands,
    image_url: source.image_url,
    trust_score: null,
    trust_score_breakdown: null,
    nutriments: source.nutriments,
    ingredients_text: source.ingredients_text,
    nova_group: source.nova_group,
    ecoscore_grade: source.ecoscore_grade,
    categories: source.categories,
  };
}
