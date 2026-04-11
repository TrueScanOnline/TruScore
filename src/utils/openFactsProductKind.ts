import { Product } from '../types/product';

/**
 * Heuristic: OFF product is food/beverage (not beauty/pet/household-specific Open Facts siblings).
 * Used to skip redundant Open Beauty / Pet / Products Facts API calls when we already have a food hit.
 */
export function isOpenFactsFoodLikeProduct(product: Product): boolean {
  const parts: string[] = [];
  if (Array.isArray(product.categories_tags)) parts.push(...product.categories_tags);
  if (typeof product.categories === 'string' && product.categories.length > 0) {
    parts.push(product.categories);
  }
  const tags = parts.join(' ').toLowerCase();

  if (
    tags.includes('en:beauty') ||
    tags.includes('beauty') ||
    tags.includes('cosmetic') ||
    tags.includes('makeup') ||
    tags.includes('shampoo')
  ) {
    return false;
  }
  if (
    tags.includes('en:pet-food') ||
    tags.includes('pet-food') ||
    tags.includes('pet food') ||
    tags.includes('dog-food') ||
    tags.includes('cat-food') ||
    tags.includes('dog food') ||
    tags.includes('cat food')
  ) {
    return false;
  }
  if (tags.includes('non-food')) return false;
  return true;
}
