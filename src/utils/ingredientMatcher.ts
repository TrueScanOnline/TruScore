// Ingredient Matcher Utility
// Extracts and matches ingredients against IARC database

import { IARCAgent, findIARCInIngredients, getIARCInfo } from '../data/iarcAgents';
import { logger } from './logger';

export interface MatchedIARCAgent extends IARCAgent {
  confidence: 'exact' | 'high' | 'medium' | 'low';
  matchedText: string;
}

/**
 * Extract individual ingredients from ingredients text
 */
export function extractIngredients(ingredientsText: string): string[] {
  if (!ingredientsText || ingredientsText.trim().length === 0) {
    return [];
  }

  // Normalize text
  let text = ingredientsText.trim();

  // Remove common prefixes
  text = text.replace(/^(ingredients?|contains?|may contain|made with)[:\s]+/i, '');

  // Split by common delimiters
  const delimiters = [',', ';', ' and ', ' & ', '\n', '|'];
  
  let ingredients: string[] = [text];
  
  // Split by each delimiter
  for (const delimiter of delimiters) {
    const newIngredients: string[] = [];
    for (const ingredient of ingredients) {
      const parts = ingredient.split(delimiter);
      newIngredients.push(...parts);
    }
    ingredients = newIngredients;
  }

  // Clean and normalize each ingredient
  return ingredients
    .map(ing => {
      // Remove parentheses content (e.g., "Sugar (Cane Sugar)")
      ing = ing.replace(/\([^)]*\)/g, '').trim();
      // Remove leading/trailing punctuation
      ing = ing.replace(/^[,\s;:]+|[,\s;:]+$/g, '').trim();
      // Remove extra whitespace
      ing = ing.replace(/\s+/g, ' ').trim();
      return ing;
    })
    .filter(ing => ing.length > 2) // Filter out very short strings
    .filter(ing => !/^(and|or|the|a|an)$/i.test(ing)); // Filter out common words
}

/**
 * Normalize ingredient name for matching
 */
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Calculate match confidence between ingredient and IARC agent
 */
function calculateConfidence(ingredient: string, agent: IARCAgent): 'exact' | 'high' | 'medium' | 'low' {
  const ingNormalized = normalizeIngredientName(ingredient);
  const agentNormalized = normalizeIngredientName(agent.agent);

  // Exact match
  if (ingNormalized === agentNormalized) {
    return 'exact';
  }

  // High confidence: ingredient contains agent name as whole word
  const agentWords = agentNormalized.split(/\s+/);
  const allWordsMatch = agentWords.every(word => {
    if (word.length < 3) return true; // Skip short words
    return new RegExp(`\\b${word}\\b`, 'i').test(ingNormalized);
  });
  
  if (allWordsMatch && agentWords.length > 0) {
    return 'high';
  }

  // Medium confidence: ingredient contains agent name (partial)
  if (ingNormalized.includes(agentNormalized) || agentNormalized.includes(ingNormalized)) {
    return 'medium';
  }

  // Low confidence: some word overlap
  const ingWords = ingNormalized.split(/\s+/);
  const commonWords = ingWords.filter(word => 
    word.length >= 4 && agentWords.includes(word)
  );
  
  if (commonWords.length > 0) {
    return 'low';
  }

  return 'low';
}

/**
 * Match ingredients against IARC database
 * Returns all matched IARC agents with confidence scores
 */
export function matchIngredientsAgainstIARC(ingredientsText: string): MatchedIARCAgent[] {
  if (!ingredientsText || ingredientsText.trim().length === 0) {
    return [];
  }

  try {
    // First, try direct search in full text (fast)
    const directMatches = findIARCInIngredients(ingredientsText);
    
    const matched: MatchedIARCAgent[] = [];
    const seen = new Set<string>(); // Prevent duplicates

    // Process direct matches
    for (const agent of directMatches) {
      const key = `${agent.agent}|${agent.group}`;
      if (!seen.has(key)) {
        matched.push({
          ...agent,
          confidence: 'high',
          matchedText: agent.agent,
        });
        seen.add(key);
      }
    }

    // Also check individual ingredients for better matching
    const ingredients = extractIngredients(ingredientsText);
    
    for (const ingredient of ingredients) {
      // Skip if already matched
      if (matched.some(m => m.matchedText.toLowerCase() === ingredient.toLowerCase())) {
        continue;
      }

      // Try exact match first
      const exactMatch = getIARCInfo(ingredient);
      if (exactMatch) {
        const key = `${exactMatch.agent}|${exactMatch.group}`;
        if (!seen.has(key)) {
          matched.push({
            ...exactMatch,
            confidence: 'exact',
            matchedText: ingredient,
          });
          seen.add(key);
          continue;
        }
      }

      // Try fuzzy match in full text
      const fuzzyMatches = findIARCInIngredients(ingredient);
      for (const agent of fuzzyMatches) {
        const key = `${agent.agent}|${agent.group}`;
        if (!seen.has(key)) {
          const confidence = calculateConfidence(ingredient, agent);
          // Only include high confidence matches from individual ingredients
          if (confidence === 'exact' || confidence === 'high') {
            matched.push({
              ...agent,
              confidence,
              matchedText: ingredient,
            });
            seen.add(key);
          }
        }
      }
    }

    // Sort by confidence and group severity
    matched.sort((a, b) => {
      const confidenceOrder = { exact: 0, high: 1, medium: 2, low: 3 };
      const groupOrder = { '1': 0, '2A': 1, '2B': 2, '3': 3, '4': 4 };
      
      const confDiff = confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
      if (confDiff !== 0) return confDiff;
      
      return groupOrder[a.group] - groupOrder[b.group];
    });

    return matched;
  } catch (error) {
    logger.debug('Error matching ingredients against IARC:', error);
    return [];
  }
}

/**
 * Get IARC penalty for a matched agent
 */
export function getIARCPenalty(agent: IARCAgent): number {
  switch (agent.group) {
    case '1':
      return 10; // Carcinogenic to humans
    case '2A':
      return 5; // Probably carcinogenic
    case '2B':
      return 3; // Possibly carcinogenic
    case '3':
      return 1; // Not classifiable
    case '4':
      return 0; // Probably not carcinogenic
    default:
      return 0;
  }
}

