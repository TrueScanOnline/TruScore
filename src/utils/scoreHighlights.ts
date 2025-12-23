// Score Highlights Generation Logic
// Based on Score_Highlights_Specification_v8_20251222.docx
// Implements selection logic: >=7 abs(value) first, then top 2 pos/neg per pillar

import { ProductWithTrustScore } from '../types/product';
import { ALL_HIGHLIGHT_DEFINITIONS, HighlightDefinition, isAlcoholicProduct } from '../config/scoreHighlightDefinitions';
import { ProductFlag } from './productFlags';

export interface ScoreHighlight extends ProductFlag {
  pillar: 'body' | 'planet' | 'ethics' | 'open';
  scoreValue: number;
  externalResource: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Calculate which highlights apply to a product
 * Returns highlights with their calculated score values
 */
export function calculateHighlights(product: ProductWithTrustScore): ScoreHighlight[] {
  const applicableHighlights: ScoreHighlight[] = [];
  
  // Check each highlight definition to see if it applies
  for (const definition of ALL_HIGHLIGHT_DEFINITIONS) {
    try {
      if (definition.trigger(product)) {
        // Get description - apply alcohol override if applicable
        let description = definition.description;
        if (definition.alcoholOverride && isAlcoholicProduct(product)) {
          // Check if this is a nutrient profile highlight (A/B/C)
          if (definition.id.startsWith('body-nutri-') && 
              ['a', 'b', 'c'].includes(definition.id.split('-')[2])) {
            description = definition.alcoholOverride;
          }
        }
        
        applicableHighlights.push({
          type: definition.type,
          category: mapPillarToCategory(definition.pillar),
          title: definition.title,
          description,
          severity: definition.severity,
          pillar: definition.pillar,
          scoreValue: definition.scoreValue,
          externalResource: definition.externalResource,
        });
      }
    } catch (error) {
      // Skip highlights that error during trigger evaluation
      console.warn(`Error evaluating highlight ${definition.id}:`, error);
    }
  }
  
  return applicableHighlights;
}

/**
 * Map pillar category to ProductFlag category for backward compatibility
 */
function mapPillarToCategory(pillar: 'body' | 'planet' | 'ethics' | 'open'): ProductFlag['category'] {
  switch (pillar) {
    case 'body':
      return 'nutrition';
    case 'planet':
      return 'sustainability';
    case 'ethics':
      return 'ethics';
    case 'open':
      return 'nutrition'; // Open pillar doesn't have a direct category, use nutrition as fallback
    default:
      return 'nutrition';
  }
}

/**
 * Select highlights based on spec rules:
 * 1. All measures with abs(value) >= 7 must be included
 * 2. Then top 2 positive + top 2 negative per pillar
 * 3. Soft cap at 12 total (allow breach for >=7 measures)
 * 4. Sort by pillar, then green/red, then severity (high > low)
 */
export function selectHighlights(highlights: ScoreHighlight[]): ScoreHighlight[] {
  if (highlights.length === 0) return [];
  
  // Separate by pillar
  const byPillar = {
    body: highlights.filter(h => h.pillar === 'body'),
    planet: highlights.filter(h => h.pillar === 'planet'),
    ethics: highlights.filter(h => h.pillar === 'ethics'),
    open: highlights.filter(h => h.pillar === 'open'),
  };
  
  const selected: ScoreHighlight[] = [];
  
  // Step 1: Include all with abs(value) >= 7 (high-impact inclusion rule)
  const highImpact = highlights.filter(h => Math.abs(h.scoreValue) >= 7);
  selected.push(...highImpact);
  
  // Track which highlights we've already selected
  const selectedIds = new Set(highImpact.map(h => `${h.pillar}-${h.title}`));
  
  // Step 2: For each pillar, select top 2 positive + top 2 negative
  // (excluding those already selected in high-impact)
  for (const pillar of ['body', 'planet', 'ethics', 'open'] as const) {
    const pillarHighlights = byPillar[pillar].filter(
      h => !selectedIds.has(`${h.pillar}-${h.title}`)
    );
    
    // Separate positive and negative
    const positive = pillarHighlights.filter(h => h.type === 'green')
      .sort((a, b) => Math.abs(b.scoreValue) - Math.abs(a.scoreValue)); // Sort by abs value desc
    const negative = pillarHighlights.filter(h => h.type === 'red')
      .sort((a, b) => Math.abs(b.scoreValue) - Math.abs(a.scoreValue)); // Sort by abs value desc
    
    // Take top 2 of each
    selected.push(...positive.slice(0, 2));
    selected.push(...negative.slice(0, 2));
  }
  
  // Step 3: Remove duplicates
  const uniqueSelected = Array.from(
    new Map(selected.map(h => [`${h.pillar}-${h.title}`, h])).values()
  );
  
  // Step 4: Sort by pillar, then type (green first), then severity (high > medium > low)
  const pillarOrder = ['body', 'planet', 'ethics', 'open'] as const;
  const severityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
  
  uniqueSelected.sort((a, b) => {
    // First by pillar order
    const pillarA = pillarOrder.indexOf(a.pillar);
    const pillarB = pillarOrder.indexOf(b.pillar);
    if (pillarA !== pillarB) return pillarA - pillarB;
    
    // Then by type (green first)
    if (a.type !== b.type) {
      return a.type === 'green' ? -1 : 1;
    }
    
    // Then by severity (high > medium > low)
    const severityA = severityOrder[a.severity] || 0;
    const severityB = severityOrder[b.severity] || 0;
    if (severityA !== severityB) return severityB - severityA;
    
    // Finally by abs score value (higher first)
    return Math.abs(b.scoreValue) - Math.abs(a.scoreValue);
  });
  
  // Step 5: Apply soft cap at 12 (but allow breach for >=7 measures)
  // For MVP, we'll allow all selected highlights (no hard cap enforcement)
  // The spec says "soft cap at 12 to prevent UI bloat" but "allow breach for initial testing"
  
  return uniqueSelected;
}

/**
 * Convert ScoreHighlight to ProductFlag format for backward compatibility
 */
export function convertToProductFlags(highlights: ScoreHighlight[]): ProductFlag[] {
  return highlights.map(h => ({
    type: h.type,
    category: h.category,
    title: h.title,
    description: h.description,
    severity: h.severity,
    externalResource: h.externalResource,
  }));
}

/**
 * Main function to generate product flags using new spec-based logic
 */
export function generateScoreHighlights(product: ProductWithTrustScore): ProductFlag[] {
  // Calculate which highlights apply
  const applicableHighlights = calculateHighlights(product);
  
  // Select highlights based on spec rules
  const selectedHighlights = selectHighlights(applicableHighlights);
  
  // Convert to ProductFlag format
  return convertToProductFlags(selectedHighlights);
}

