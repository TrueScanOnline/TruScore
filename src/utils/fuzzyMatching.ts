/**
 * Fuzzy Matching Utility
 * 
 * Provides comprehensive fuzzy matching algorithms for brand/company name matching
 * across all TruScore pillars. Implements multiple algorithms and hybrid scoring
 * for maximum accuracy.
 * 
 * Algorithms:
 * - Levenshtein Distance: Character-level similarity
 * - Jaro-Winkler: Better for names (weights prefix matches)
 * - Token-based: Word-level matching (order-independent)
 * - Hybrid: Combines multiple algorithms
 */

export interface FuzzyMatchResult {
  matched: boolean;
  confidence: number; // 0-100
  matchedBrand: string;
  algorithm: 'exact' | 'alias' | 'levenshtein' | 'jaro-winkler' | 'token' | 'hybrid' | 'none';
  details: {
    levenshtein?: number;
    jaroWinkler?: number;
    tokenMatch?: number;
    hybridScore?: number;
  };
  normalizedInput: string;
  normalizedTarget: string;
}

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of single-character edits needed to transform one string into another
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[len2][len1];
}

/**
 * Calculate Levenshtein similarity (0-1, higher is more similar)
 */
export function levenshteinSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;
  return 1 - (distance / maxLen);
}

/**
 * Calculate Jaro similarity between two strings
 * Better for name matching, especially with common prefixes
 */
export function jaroSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;

  const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  if (matchWindow < 0) return 0.0;

  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  // Find transpositions
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro = (
    matches / s1.length +
    matches / s2.length +
    (matches - transpositions / 2) / matches
  ) / 3.0;

  return jaro;
}

/**
 * Calculate Jaro-Winkler similarity
 * Enhances Jaro by giving more weight to common prefixes
 */
export function jaroWinklerSimilarity(str1: string, str2: string, prefixLength: number = 4): number {
  const jaro = jaroSimilarity(str1, str2);
  
  if (jaro < 0.7) return jaro;

  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  let prefix = 0;

  for (let i = 0; i < Math.min(prefixLength, Math.min(s1.length, s2.length)); i++) {
    if (s1[i] === s2[i]) {
      prefix++;
    } else {
      break;
    }
  }

  const winkler = jaro + (0.1 * prefix * (1 - jaro));
  return Math.min(1.0, winkler);
}

/**
 * Calculate token-based similarity
 * Splits strings into tokens and compares sets (order-independent)
 */
export function tokenSimilarity(str1: string, str2: string): number {
  const normalize = (s: string) => s.toLowerCase().trim();
  
  const tokens1 = new Set(
    str1
      .toLowerCase()
      .split(/\s+/)
      .map(t => t.trim())
      .filter(t => t.length > 0)
  );
  
  const tokens2 = new Set(
    str2
      .toLowerCase()
      .split(/\s+/)
      .map(t => t.trim())
      .filter(t => t.length > 0)
  );

  if (tokens1.size === 0 && tokens2.size === 0) return 1.0;
  if (tokens1.size === 0 || tokens2.size === 0) return 0.0;

  // Calculate intersection and union
  const intersection = new Set([...tokens1].filter(t => tokens2.has(t)));
  const union = new Set([...tokens1, ...tokens2]);

  // Jaccard similarity
  return intersection.size / union.size;
}

/**
 * Calculate hybrid similarity score
 * Combines multiple algorithms with weighted average
 */
export function hybridSimilarity(str1: string, str2: string): number {
  const levenshtein = levenshteinSimilarity(str1, str2);
  const jaroWinkler = jaroWinklerSimilarity(str1, str2);
  const token = tokenSimilarity(str1, str2);

  // Weighted average (tuned for brand name matching)
  // Jaro-Winkler gets highest weight (good for names with common prefixes)
  // Token matching gets medium weight (handles word order variations)
  // Levenshtein gets lower weight (catches typos but less important for names)
  const hybrid = (0.4 * jaroWinkler) + (0.35 * token) + (0.25 * levenshtein);

  return hybrid;
}

/**
 * Normalize string for fuzzy matching
 * Removes common variations that shouldn't affect matching
 */
export function normalizeForFuzzyMatching(str: string): string {
  if (!str || typeof str !== 'string') return '';

  return str
    .toLowerCase()
    .trim()
    // Remove common punctuation
    .replace(/[.,;:!?'"()\[\]{}]/g, '')
    // Normalize hyphens and dashes to spaces
    .replace(/[-–—]/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Handle common abbreviations
    .replace(/\b&\b/g, 'and')
    .replace(/\bp&g\b/g, 'procter and gamble')
    .replace(/\bj&j\b/g, 'johnson and johnson')
    // Remove common company suffixes
    .replace(/\binc\b/g, '')
    .replace(/\bllc\b/g, '')
    .replace(/\bltd\b/g, '')
    .replace(/\bcorp\b/g, '')
    .replace(/\bcorporation\b/g, '')
    .replace(/\bco\b/g, '')
    .replace(/\bcompany\b/g, '')
    .replace(/\bgroup\b/g, '')
    .replace(/\bholdings\b/g, '')
    .replace(/\benterprises\b/g, '')
    .replace(/\bplc\b/g, '')
    .replace(/\bsa\b/g, '')
    .replace(/\bag\b/g, '')
    // Remove common prefixes
    .replace(/^the\s+/i, '')
    // Normalize accented characters
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/ç/g, 'c')
    .replace(/ñ/g, 'n')
    .replace(/ß/g, 'ss')
    // Remove apostrophes
    .replace(/'/g, '')
    // Normalize whitespace again
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fuzzy match a brand name against a target brand
 * 
 * @param inputBrand - Brand name to match (from product data)
 * @param targetBrand - Target brand name (from database)
 * @param threshold - Minimum confidence threshold (0-1, default 0.75)
 * @returns Fuzzy match result with confidence score
 */
export function fuzzyMatchBrand(
  inputBrand: string,
  targetBrand: string,
  threshold: number = 0.75
): FuzzyMatchResult {
  if (!inputBrand || !targetBrand) {
    return {
      matched: false,
      confidence: 0,
      matchedBrand: targetBrand,
      algorithm: 'none',
      details: {},
      normalizedInput: normalizeForFuzzyMatching(inputBrand || ''),
      normalizedTarget: normalizeForFuzzyMatching(targetBrand || ''),
    };
  }

  const normalizedInput = normalizeForFuzzyMatching(inputBrand);
  const normalizedTarget = normalizeForFuzzyMatching(targetBrand);

  // Exact match (after normalization)
  if (normalizedInput === normalizedTarget) {
    return {
      matched: true,
      confidence: 100,
      matchedBrand: targetBrand,
      algorithm: 'exact',
      details: {},
      normalizedInput,
      normalizedTarget,
    };
  }

  // Calculate all similarity scores
  const levenshtein = levenshteinSimilarity(normalizedInput, normalizedTarget);
  const jaroWinkler = jaroWinklerSimilarity(normalizedInput, normalizedTarget);
  const token = tokenSimilarity(normalizedInput, normalizedTarget);
  const hybrid = hybridSimilarity(normalizedInput, normalizedTarget);

  // Use hybrid score as primary confidence
  const confidence = Math.round(hybrid * 100);

  // Determine which algorithm gave the best match
  let algorithm: FuzzyMatchResult['algorithm'] = 'hybrid';
  if (jaroWinkler >= threshold && jaroWinkler >= hybrid) {
    algorithm = 'jaro-winkler';
  } else if (token >= threshold && token >= hybrid) {
    algorithm = 'token';
  } else if (levenshtein >= threshold && levenshtein >= hybrid) {
    algorithm = 'levenshtein';
  }

  const matched = confidence >= (threshold * 100);

  return {
    matched,
    confidence,
    matchedBrand: targetBrand,
    algorithm,
    details: {
      levenshtein: Math.round(levenshtein * 100),
      jaroWinkler: Math.round(jaroWinkler * 100),
      tokenMatch: Math.round(token * 100),
      hybridScore: confidence,
    },
    normalizedInput,
    normalizedTarget,
  };
}

/**
 * Find best fuzzy match from a list of candidates
 * 
 * @param inputBrand - Brand name to match
 * @param candidates - Array of candidate brand names
 * @param threshold - Minimum confidence threshold (0-1, default 0.75)
 * @returns Best match result, or null if no match above threshold
 */
export function findBestFuzzyMatch(
  inputBrand: string,
  candidates: string[],
  threshold: number = 0.75
): FuzzyMatchResult | null {
  if (!inputBrand || !candidates || candidates.length === 0) {
    return null;
  }

  let bestMatch: FuzzyMatchResult | null = null;
  let bestConfidence = 0;

  for (const candidate of candidates) {
    const result = fuzzyMatchBrand(inputBrand, candidate, threshold);
    if (result.confidence > bestConfidence) {
      bestConfidence = result.confidence;
      bestMatch = result;
    }
  }

  // Only return if above threshold
  if (bestMatch && bestMatch.confidence >= (threshold * 100)) {
    return bestMatch;
  }

  return null;
}

/**
 * Match multiple brands against candidates
 * Returns all matches above threshold, sorted by confidence
 * 
 * @param inputBrands - Array of brand names to match
 * @param candidates - Array of candidate brand names
 * @param threshold - Minimum confidence threshold (0-1, default 0.75)
 * @returns Array of match results, sorted by confidence (highest first)
 */
export function fuzzyMatchMultipleBrands(
  inputBrands: string[],
  candidates: string[],
  threshold: number = 0.75
): FuzzyMatchResult[] {
  if (!inputBrands || inputBrands.length === 0 || !candidates || candidates.length === 0) {
    return [];
  }

  const matches: FuzzyMatchResult[] = [];

  for (const inputBrand of inputBrands) {
    const match = findBestFuzzyMatch(inputBrand, candidates, threshold);
    if (match) {
      matches.push(match);
    }
  }

  // Sort by confidence (highest first)
  matches.sort((a, b) => b.confidence - a.confidence);

  return matches;
}
