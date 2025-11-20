// Product search service - searches across all databases
import { Product } from '../types/product';
import { searchUSDAFoodData } from './usdaFoodData';

const OFF_SEARCH_API = 'https://world.openfoodfacts.org/cgi/search.pl';
const OBF_SEARCH_API = 'https://world.openbeautyfacts.org/cgi/search.pl';
const OPF_SEARCH_API = 'https://world.openproductsfacts.org/cgi/search.pl';
const OPFF_SEARCH_API = 'https://world.openpetfoodfacts.org/cgi/search.pl';
const UPCITEMDB_SEARCH_API = 'https://api.upcitemdb.com/prod/trial/search';

/**
 * Search products across all databases
 */
export interface SearchResult {
  barcode: string;
  product: Product;
  source: 'openfoodfacts' | 'openbeautyfacts' | 'openproductsfacts' | 'openpetfoodfacts' | 'usda_fooddata' | 'gs1_datasource' | 'upcitemdb' | 'local';
  relevance: number; // 0-100 relevance score
}

/**
 * Calculate relevance score (0-100) based on query match
 */
function calculateRelevance(productName: string, query: string): number {
  const name = productName.toLowerCase();
  const q = query.toLowerCase().trim();
  
  if (name === q) return 100;
  if (name.startsWith(q)) return 90;
  if (name.includes(q)) {
    const index = name.indexOf(q);
    return Math.max(70, 90 - (index * 2));
  }
  
  const queryWords = q.split(/\s+/).filter(w => w.length > 2);
  const matchedWords = queryWords.filter(word => name.includes(word)).length;
  if (matchedWords > 0) {
    return (matchedWords / queryWords.length) * 60;
  }
  
  return 30;
}

/**
 * Search Open Food Facts by product name
 */
async function searchOpenFoodFacts(query: string, limit = 20): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({
      action: 'process',
      search_terms: query,
      search_simple: '1',
      page_size: limit.toString(),
      json: '1',
      fields: 'code,product_name,product_name_en,brands,categories_tags,image_url,image_front_url,ecoscore_grade,ecoscore_score,nutriscore_grade,nutriscore_score,nova_group,labels_tags',
    });

    const response = await fetch(`${OFF_SEARCH_API}?${params.toString()}`, {
      headers: { 'User-Agent': 'TrueScan-FoodScanner/1.0.0' },
    });

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.products || !Array.isArray(data.products)) return [];

    return data.products
      .filter((p: any) => p.code && p.product_name)
      .map((p: any) => ({
        barcode: p.code,
        product: {
          barcode: p.code,
          product_name: p.product_name || p.product_name_en,
          brands: p.brands,
          categories_tags: p.categories_tags,
          image_url: p.image_url || p.image_front_url,
          ecoscore_grade: p.ecoscore_grade,
          ecoscore_score: p.ecoscore_score,
          nutriscore_grade: p.nutriscore_grade,
          nutriscore_score: p.nutriscore_score,
          nova_group: p.nova_group,
          labels_tags: p.labels_tags,
          source: 'openfoodfacts',
        } as Product,
        source: 'openfoodfacts' as const,
        relevance: calculateRelevance(p.product_name || '', query),
      }));
  } catch (error) {
    console.error('Error searching Open Food Facts:', error);
    return [];
  }
}

/**
 * Search Open Products Facts by product name
 */
async function searchOpenProductsFacts(query: string, limit = 20): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({
      action: 'process',
      search_terms: query,
      search_simple: '1',
      page_size: limit.toString(),
      json: '1',
      fields: 'code,product_name,product_name_en,brands,categories_tags,image_url,image_front_url,ecoscore_grade,ecoscore_score,labels_tags',
    });

    const response = await fetch(`${OPF_SEARCH_API}?${params.toString()}`, {
      headers: { 'User-Agent': 'TrueScan-FoodScanner/1.0.0' },
    });

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.products || !Array.isArray(data.products)) return [];

    return data.products
      .filter((p: any) => p.code && p.product_name)
      .map((p: any) => ({
        barcode: p.code,
        product: {
          barcode: p.code,
          product_name: p.product_name || p.product_name_en,
          brands: p.brands,
          categories_tags: p.categories_tags,
          image_url: p.image_url || p.image_front_url,
          ecoscore_grade: p.ecoscore_grade,
          ecoscore_score: p.ecoscore_score,
          labels_tags: p.labels_tags,
          source: 'openproductsfacts',
        } as Product,
        source: 'openproductsfacts' as const,
        relevance: calculateRelevance(p.product_name || '', query),
      }));
  } catch (error) {
    console.error('Error searching Open Products Facts:', error);
    return [];
  }
}

/**
 * Search Open Pet Food Facts by product name
 */
async function searchOpenPetFoodFacts(query: string, limit = 20): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({
      action: 'process',
      search_terms: query,
      search_simple: '1',
      page_size: limit.toString(),
      json: '1',
      fields: 'code,product_name,product_name_en,brands,categories_tags,image_url,image_front_url,ecoscore_grade,ecoscore_score,nutriscore_grade,nutriscore_score,nova_group,labels_tags',
    });

    const response = await fetch(`${OPFF_SEARCH_API}?${params.toString()}`, {
      headers: { 'User-Agent': 'TrueScan-FoodScanner/1.0.0' },
    });

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.products || !Array.isArray(data.products)) return [];

    return data.products
      .filter((p: any) => p.code && p.product_name)
      .map((p: any) => ({
        barcode: p.code,
        product: {
          barcode: p.code,
          product_name: p.product_name || p.product_name_en,
          brands: p.brands,
          categories_tags: p.categories_tags,
          image_url: p.image_url || p.image_front_url,
          ecoscore_grade: p.ecoscore_grade,
          ecoscore_score: p.ecoscore_score,
          nutriscore_grade: p.nutriscore_grade,
          nutriscore_score: p.nutriscore_score,
          nova_group: p.nova_group,
          labels_tags: p.labels_tags,
          source: 'openpetfoodfacts',
        } as Product,
        source: 'openpetfoodfacts' as const,
        relevance: calculateRelevance(p.product_name || '', query),
      }));
  } catch (error) {
    console.error('Error searching Open Pet Food Facts:', error);
    return [];
  }
}

/**
 * Search Open Beauty Facts by product name
 */
async function searchOpenBeautyFacts(query: string, limit = 20): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({
      action: 'process',
      search_terms: query,
      search_simple: '1',
      page_size: limit.toString(),
      json: '1',
      fields: 'code,product_name,product_name_en,brands,categories_tags,image_url,image_front_url,ecoscore_grade,ecoscore_score,labels_tags',
    });

    const response = await fetch(`${OBF_SEARCH_API}?${params.toString()}`, {
      headers: { 'User-Agent': 'TrueScan-FoodScanner/1.0.0' },
    });

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.products || !Array.isArray(data.products)) return [];

    return data.products
      .filter((p: any) => p.code && p.product_name)
      .map((p: any) => ({
        barcode: p.code,
        product: {
          barcode: p.code,
          product_name: p.product_name || p.product_name_en,
          brands: p.brands,
          categories_tags: p.categories_tags,
          image_url: p.image_url || p.image_front_url,
          ecoscore_grade: p.ecoscore_grade,
          ecoscore_score: p.ecoscore_score,
          labels_tags: p.labels_tags,
          source: 'openbeautyfacts',
        } as Product,
        source: 'openbeautyfacts' as const,
        relevance: calculateRelevance(p.product_name || '', query),
      }));
  } catch (error) {
    console.error('Error searching Open Beauty Facts:', error);
    return [];
  }
}

/**
 * Search USDA FoodData Central by product name
 */
async function searchUSDA(query: string, limit = 20): Promise<SearchResult[]> {
  try {
    const products = await searchUSDAFoodData(query, limit);
    return products.map(product => ({
      barcode: product.barcode,
      product,
      source: 'usda_fooddata' as const,
      relevance: calculateRelevance(product.product_name || '', query),
    }));
  } catch (error) {
    console.error('Error searching USDA FoodData Central:', error);
    return [];
  }
}

/**
 * Search UPCitemdb by product name
 */
async function searchUPCitemdb(query: string, limit = 20): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({
      s: query,
      type: 'product',
      match_mode: '2',
      limit: limit.toString(),
    });

    const response = await fetch(`${UPCITEMDB_SEARCH_API}?${params.toString()}`);

    if (!response.ok) return [];

    const data = await response.json();
    if (data.code !== 'OK' || !data.items || !Array.isArray(data.items)) return [];

    return data.items
      .filter((item: any) => item.upc && item.title)
      .map((item: any) => ({
        barcode: item.upc,
        product: {
          barcode: item.upc,
          product_name: item.title,
          brands: item.brand,
          image_url: item.images?.[0] || item.images,
          description: item.description,
          source: 'upcitemdb',
        } as Product,
        source: 'upcitemdb' as const,
        relevance: calculateRelevance(item.title || '', query),
      }));
  } catch (error) {
    console.error('Error searching UPCitemdb:', error);
    return [];
  }
}

/**
 * Main search function - searches all databases and merges results
 */
export async function searchProducts(
  query: string,
  options: {
    limit?: number;
    includeOpenFoodFacts?: boolean;
    includeOpenBeautyFacts?: boolean;
    includeOpenProductsFacts?: boolean;
    includeOpenPetFoodFacts?: boolean;
    includeUSDA?: boolean;
    includeGS1?: boolean;
    includeUPCitemdb?: boolean;
  } = {}
): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const {
    limit = 20,
    includeOpenFoodFacts = true,
    includeOpenBeautyFacts = true,
    includeOpenProductsFacts = true,
    includeOpenPetFoodFacts = true,
    includeUSDA = true, // Include USDA if API key is configured
    includeGS1 = false, // GS1 doesn't have search, only lookup
    includeUPCitemdb = true,
  } = options;

  const trimmedQuery = query.trim();
  // Divide limit among all sources
  const sourceCount = [
    includeOpenFoodFacts,
    includeOpenBeautyFacts,
    includeOpenProductsFacts,
    includeOpenPetFoodFacts,
    includeUSDA,
    includeUPCitemdb,
  ].filter(Boolean).length;
  const perSourceLimit = Math.ceil(limit / Math.max(sourceCount, 1));

  // Run all searches in parallel for best performance
  const promises: Promise<SearchResult[]>[] = [];
  if (includeOpenFoodFacts) promises.push(searchOpenFoodFacts(trimmedQuery, perSourceLimit));
  if (includeOpenBeautyFacts) promises.push(searchOpenBeautyFacts(trimmedQuery, perSourceLimit));
  if (includeOpenProductsFacts) promises.push(searchOpenProductsFacts(trimmedQuery, perSourceLimit));
  if (includeOpenPetFoodFacts) promises.push(searchOpenPetFoodFacts(trimmedQuery, perSourceLimit));
  if (includeUSDA) promises.push(searchUSDA(trimmedQuery, perSourceLimit));
  if (includeUPCitemdb) promises.push(searchUPCitemdb(trimmedQuery, perSourceLimit));
  // Note: GS1 doesn't have search endpoint, only barcode lookup

  const results = await Promise.allSettled(promises);
  const allResults: SearchResult[] = [];
  
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      allResults.push(...result.value);
    }
  });

  // Deduplicate by barcode (keep highest relevance)
  const uniqueResults = new Map<string, SearchResult>();
  allResults.forEach((result) => {
    const existing = uniqueResults.get(result.barcode);
    if (!existing || result.relevance > existing.relevance) {
      uniqueResults.set(result.barcode, result);
    }
  });

  return Array.from(uniqueResults.values())
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}
