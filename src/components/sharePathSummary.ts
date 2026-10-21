/**
 * Display copy for the share sheet Summary.
 * This reads information already shown on the chosen Result card.
 * It does not build the message that is sent.
 */

import type { Product } from '../types/product';
import { nutritionShareText, originShareText } from './shareCardRows';

export type ShareSummaryPillar = { label: string; value: string };

function scoreSummary(caption: string, value: string | null, pillars: ShareSummaryPillar[] | null): string {
  const lines = [value ? `${caption} ${value}` : caption];
  for (const pillar of pillars || []) lines.push(`${pillar.label} ${pillar.value}`);
  return lines.join('\n');
}

/** Plain summary for the share sheet, chosen from the Result control the sender used. */
export function sharePathSummary(input: {
  shareType: string;
  product: Product;
  country?: string;
  scoreCaption: string;
  scoreValue: string | null;
  pillars: ShareSummaryPillar[] | null;
  insightLines?: string[];
  /** Lines already visible on the What we found card, in display order. */
  highlightLines?: string[];
}): string {
  const { shareType, product } = input;
  if (shareType === 'nutrition') return nutritionShareText(product);
  if (shareType === 'countryOfManufacture') return originShareText(product, input.country);
  if (shareType === 'ingredients') {
    const text = (product.ingredients_text || '').replace(/\s+/g, ' ').trim();
    return text || 'Ingredients for this product are not listed.';
  }
  if (shareType === 'processing') {
    const nova = product.nova_group;
    const labels = ['Unprocessed', 'Minimally processed', 'Processed', 'Ultra-processed'];
    if (!nova) return 'Processing level is not listed.';
    return `NOVA ${nova} (${labels[nova - 1] || 'Processing level'})`;
  }
  if (shareType === 'allergens') {
    const allergens = (product.allergens_tags || []).map((tag) => tag.replace(/^en:/, '').replace(/-/g, ' '));
    const additiveCount = (product.additives_tags || []).length;
    const lines: string[] = [];
    if (allergens.length > 0) lines.push(`Allergens: ${allergens.join(', ')}`);
    if (additiveCount > 0) lines.push(`${additiveCount} additives identified`);
    return lines.join('\n') || 'No allergens or additives are listed.';
  }
  if (shareType === 'ecoscore') {
    const grade = (product.ecoscore_grade || '').trim();
    return grade ? `Eco-Score ${grade.toUpperCase()}` : 'An environmental grade is not listed.';
  }
  if (shareType === 'palmOil') {
    const palm = product.palm_oil_analysis;
    if (!palm) return 'Palm oil status is not listed.';
    if (palm.isPalmOilFree) return 'Palm oil free';
    if (palm.isNonSustainable) return 'Non-sustainable palm oil';
    if (palm.containsPalmOil) return 'Contains palm oil';
    return 'Palm oil status is not listed.';
  }
  if (shareType === 'recall') {
    const active = (product.recalls || []).filter((recall) => recall.isActive !== false);
    if (active.length === 0) return 'No recall is listed for this product.';
    return active.map((recall) => recall.reason).filter(Boolean).join('\n');
  }
  if (shareType === 'insights') {
    const lines = (input.insightLines || []).map((line) => line.trim()).filter((line) => line.length > 0);
    return lines.join('\n') || 'No extra insights are listed.';
  }
  if (shareType === 'highlights') {
    const lines = (input.highlightLines || []).map((line) => line.trim()).filter((line) => line.length > 0);
    return lines.join('\n') || 'Nothing is listed on this card.';
  }
  return scoreSummary(input.scoreCaption, input.scoreValue, input.pillars);
}
