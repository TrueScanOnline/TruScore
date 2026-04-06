import type { Product, ProductWithTrustScore } from '../types/product';

function trustScoreOf(product: Product): number | null {
  const p = product as ProductWithTrustScore;
  return p.trust_score ?? null;
}

/** Advanced search filter state — applied in-memory to search API results. */
export interface SearchFilters {
  trustScoreMin: number | null;
  trustScoreMax: number | null;
  nutriscoreGrade: string | null;
  ecoscoreGrade: string | null;
  country: string | null;
  certification: string[];
  allergenFree: boolean;
  novaMax: number | null;
  vegan: boolean;
  organic: boolean;
  local: boolean;
  palmOilFree: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  previouslyScannedOnly: boolean;
  favoritesOnly: boolean;
}

export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  trustScoreMin: null,
  trustScoreMax: null,
  nutriscoreGrade: null,
  ecoscoreGrade: null,
  country: null,
  certification: [],
  allergenFree: false,
  novaMax: null,
  vegan: false,
  organic: false,
  local: false,
  palmOilFree: false,
  glutenFree: false,
  dairyFree: false,
  previouslyScannedOnly: false,
  favoritesOnly: false,
};

function normalizeTags(tags: unknown): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return tags.map((t) => String(t).toLowerCase());
  }
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((t) => String(t).toLowerCase());
      }
    } catch {
      /* ignore */
    }
    return [tags.toLowerCase()];
  }
  return [];
}

function tagsMatchAny(labels: string[], needles: string[]): boolean {
  return needles.some((n) => labels.some((l) => l.includes(n)));
}

export interface SearchFilterContext {
  scannedBarcodes: Set<string>;
  favoriteBarcodes: Set<string>;
}

export function hasActiveSearchFilters(filters: SearchFilters): boolean {
  const d = DEFAULT_SEARCH_FILTERS;
  return (
    filters.trustScoreMin !== d.trustScoreMin ||
    filters.trustScoreMax !== d.trustScoreMax ||
    filters.nutriscoreGrade !== d.nutriscoreGrade ||
    filters.ecoscoreGrade !== d.ecoscoreGrade ||
    filters.country !== d.country ||
    (filters.certification?.length ?? 0) > 0 ||
    filters.allergenFree !== d.allergenFree ||
    filters.novaMax !== d.novaMax ||
    filters.vegan !== d.vegan ||
    filters.organic !== d.organic ||
    filters.local !== d.local ||
    filters.palmOilFree !== d.palmOilFree ||
    filters.glutenFree !== d.glutenFree ||
    filters.dairyFree !== d.dairyFree ||
    filters.previouslyScannedOnly !== d.previouslyScannedOnly ||
    filters.favoritesOnly !== d.favoritesOnly
  );
}

/**
 * Apply advanced filters to search rows. Each row may be `{ product?: Product, barcode: string }`.
 */
export function applySearchFilters<T extends { barcode: string; product?: Product | null }>(
  results: T[],
  filters: SearchFilters,
  ctx: SearchFilterContext
): T[] {
  return results.filter((item) => {
    const product = item.product;
    const barcode = item.barcode;

    if (filters.previouslyScannedOnly && !ctx.scannedBarcodes.has(barcode)) {
      return false;
    }
    if (filters.favoritesOnly && !ctx.favoriteBarcodes.has(barcode)) {
      return false;
    }

    if (!product) {
      return !(filters.previouslyScannedOnly || filters.favoritesOnly);
    }

    const trust = trustScoreOf(product);
    if (filters.trustScoreMin !== null && (trust == null || trust < filters.trustScoreMin)) {
      return false;
    }
    if (filters.trustScoreMax !== null && (trust == null || trust > filters.trustScoreMax)) {
      return false;
    }

    if (filters.nutriscoreGrade) {
      const g = product.nutriscore_grade?.toLowerCase();
      if (g !== filters.nutriscoreGrade.toLowerCase()) return false;
    }

    if (filters.ecoscoreGrade) {
      const g = product.ecoscore_grade?.toLowerCase();
      if (g !== filters.ecoscoreGrade.toLowerCase()) return false;
    }

    if (filters.novaMax !== null && (product.nova_group == null || product.nova_group > filters.novaMax)) {
      return false;
    }

    if (filters.allergenFree && product.allergens_tags && product.allergens_tags.length > 0) {
      return false;
    }

    const labels = normalizeTags(product.labels_tags);
    const allergens = normalizeTags(product.allergens_tags);
    const categories = normalizeTags(product.categories_tags);
    const countries = normalizeTags(product.countries_tags);

    if (filters.country?.trim()) {
      const cc = filters.country.trim().toLowerCase();
      const needle = cc.includes(':') ? cc : `en:${cc}`;
      if (!countries.some((c) => c.includes(needle) || c.includes(cc))) {
        return false;
      }
    }

    if (filters.certification && filters.certification.length > 0) {
      const productCerts = product.certifications?.map((c) => c.id?.toLowerCase()) || [];
      const hasAnyCert = filters.certification.some((cert) => productCerts.includes(cert.toLowerCase()));
      if (!hasAnyCert) {
        const organicFallback = filters.organic && tagsMatchAny(labels, ['organic', 'bio', 'biologique']);
        if (!organicFallback) return false;
      }
    }

    if (filters.organic) {
      const hasOrganic =
        tagsMatchAny(labels, ['organic', 'bio', 'biologique']) ||
        product.certifications?.some((c) => c.id?.toLowerCase().includes('organic'));
      if (!hasOrganic) return false;
    }

    if (filters.vegan) {
      const hasVegan =
        tagsMatchAny(labels, ['vegan', 'vegano', 'végétal']) ||
        tagsMatchAny(categories, ['vegan']);
      if (!hasVegan) return false;
    }

    if (filters.local) {
      const hasLocal =
        tagsMatchAny(labels, ['local', 'locally', 'locaux']) ||
        tagsMatchAny(categories, ['local']);
      if (!hasLocal) return false;
    }

    if (filters.glutenFree) {
      const labeled =
        tagsMatchAny(labels, ['gluten-free', 'glutenfree', 'sans-gluten', 'sin-gluten']) ||
        tagsMatchAny(categories, ['gluten-free']);
      const allergensKnown = allergens.length > 0;
      const noGluten =
        allergensKnown &&
        !allergens.some((a) => a.includes('gluten') || a.includes('wheat') || a.includes('en:gluten'));
      if (!labeled && !noGluten) return false;
    }

    if (filters.dairyFree) {
      const labeled =
        tagsMatchAny(labels, ['dairy-free', 'dairyfree', 'lactose-free', 'sans-lait', 'sin-lactosa']) ||
        tagsMatchAny(categories, ['dairy-free', 'lactose-free']);
      const allergensKnown = allergens.length > 0;
      const noDairy =
        allergensKnown &&
        !allergens.some(
          (a) => a.includes('milk') || a.includes('dairy') || a.includes('lactose') || a.includes('en:milk')
        );
      if (!labeled && !noDairy) return false;
    }

    if (filters.palmOilFree) {
      const labeled = tagsMatchAny(labels, ['palm-oil-free', 'without-palm-oil', 'no-palm-oil']);
      const analysisOk = product.palm_oil_analysis?.isPalmOilFree === true;
      if (!labeled && !analysisOk) return false;
    }

    return true;
  });
}
