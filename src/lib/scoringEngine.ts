// src/lib/scoringEngine.ts – TruScore v1.3 Final Launch Engine (Jan 2026)
// 100% public data, zero proprietary → untouchable

import { Product, ProductWithTrustScore, TrustScoreBreakdown, PackagingItem } from '../types/product';

export interface TruScoreResult {
  truscore: number;
  breakdown: {
    Body: number;
    Planet: number;
    Care: number;
    Open: number;
  };
  hasNutriScore?: boolean;
  hasEcoScore?: boolean;
  hasOrigin?: boolean;
  [key: string]: unknown;
}

/**
 * Calculate TruScore v1.3 - Final Launch Engine
 * Four equal pillars (25 points each = 100 total)
 * 100% based on recognized public systems (Nutri-Score, Eco-Score, NOVA, OFF labels)
 */
export const calculateTruScore = (product: Product, source_used: string): TruScoreResult => {
  const text = product.ingredients_text?.toLowerCase() || '';
  const labels = (product.labels_tags || []).map((l: string) => l.toLowerCase());
  const analysis_tags = product.ingredients_analysis_tags || [];
  const packagings = product.packagings || [];
  const brand = product.brands?.toLowerCase() || '';

  // Helper function for word boundary matching
  const hasTerm = (term: string): boolean => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(text);
  };

  // Helper function for label matching
  const hasLabel = (pattern: string): boolean => {
    return labels.some((l: string) => l.includes(pattern.toLowerCase()));
  };

  // BODY
  let body = 25;
  const hasNutriScore = !!product.nutriscore_grade;

  const ns = product.nutriscore_grade?.toLowerCase();
  if (ns) {
    body = { a: 25, b: 20, c: 15, d: 10, e: 5 }[ns] || 25;
  } else {
    // No Nutri-Score: use baseline 12 (matches current implementation)
    body = 12;
  }

  body -= Math.min((product.additives_tags?.length || 0) * 1.5, 15);

  const risky_count = analysis_tags.filter((t: string) => 
    ['carcinogenic', 'endocrine', 'palm', 'allergen', 'irritant'].some(x => t.toLowerCase().includes(x))
  ).length;

  body -= risky_count * 4;

  const irritants = ["paraben", "phthalate", "sulfate", "triclosan", "formaldehyde", "peg", "silicone", "phenoxyethanol"];
  if (irritants.some(i => hasTerm(i))) body -= 10;

  if (["parfum", "fragrance", "aroma"].some(a => hasTerm(a))) body -= 10;

  const nova = product.nova_group;
  if (nova === 4) body -= 10;
  else if (nova === 3) body -= 5;

  body = Math.max(0, Math.min(25, Math.round(body)));

  // PLANET
  let planet = 25;
  const hasEcoScore = !!product.ecoscore_grade;

  const es = product.ecoscore_grade?.toLowerCase();
  if (es) {
    planet = { a: 25, b: 20, c: 15, d: 10, e: 5 }[es] || 25;
  } else {
    // No Eco-Score: use baseline 12 (matches current implementation)
    planet = 12;
  }

  const has_palm = analysis_tags.some((t: string) => t.toLowerCase().includes('palm'));
  const palm_free = [...analysis_tags, ...labels].some((t: string) => t.toLowerCase().includes('palm-oil-free'));

  if (has_palm && !palm_free) planet -= 10;

  const recyclable = packagings.filter((p: PackagingItem) => 
    p.recycling && ['recycle', 'widely recycled'].includes(p.recycling.toLowerCase())
  ).length;

  if (recyclable === packagings.length && packagings.length > 0) planet += 5;
  else if (recyclable > 0) planet += 2;

  planet = Math.max(0, Math.min(25, Math.round(planet)));

  // CARE – v1.3 sweet spot
  let care = 18; // absence of known cruelty = default

  let bonuses = 0;
  if (hasLabel('fair-trade')) bonuses += 8;
  if (hasLabel('organic')) bonuses += 8;
  if (hasLabel('rainforest-alliance')) bonuses += 7;
  if (labels.some((l: string) => ['en:msc', 'en:asc', 'en:dolphin-safe'].includes(l))) bonuses += 8;
  if (hasLabel('rspca')) bonuses += 6;
  if (labels.some((l: string) => ['en:vegan', 'en:cruelty-free'].includes(l))) bonuses += 10;

  const KNOWN_CRUEL_PARENTS = [
    "unilever", "procter & gamble", "p&g", "l'oreal", "loreal", "estee lauder", "estée lauder",
    "colgate-palmolive", "johnson & johnson", "j&j", "reckitt", "reckitt benckiser", "rb",
    "henkel", "beiersdorf", "shiseido", "kao", "sc johnson", "s.c. johnson", "clorox",
    "church & dwight", "coty", "revlon", "nestle", "nestlé", "mars", "mondelez", "danone", "kimberly-clark"
  ];

  if (KNOWN_CRUEL_PARENTS.some(cruel => brand.includes(cruel))) {
    care -= 30;
  }

  care += bonuses;
  care = Math.max(0, Math.min(25, Math.round(care)));

  // OPEN – with origin penalty
  let open = 25;

  const hidden_terms = ["parfum", "fragrance", "aroma", "flavor", "natural flavor", "natural flavour", "proprietary"];
  const hidden_count = hidden_terms.filter(t => hasTerm(t)).length;

  if (hidden_count >= 3) open -= 20;
  else if (hidden_count >= 1) open -= 12;

  // Check for ingredient list completeness
  // For simple products (like honey, milk, salt), short but complete lists are EXPECTED and acceptable
  // Only penalize if text is missing, placeholder, or suspiciously incomplete
  if (!text || text.trim().length === 0) {
    open = 5; // No ingredient list at all
  } else {
    // Check if it's a placeholder or generic text
    const isPlaceholder = /^(product|item|n\/a|not available|unknown|missing|no ingredients|ingredients not listed)/i.test(text.trim());
    if (isPlaceholder) {
      open = 5; // Placeholder/generic text - not transparent
    } else {
      // Valid ingredient text exists - check if it's suspiciously incomplete
      // For simple products (single ingredient), short lists are complete and transparent
      const hasPercent = /%|\d+/.test(text);
      const hasMultipleWords = text.trim().split(/\s+/).length >= 2;
      const wordCount = text.trim().split(/\s+/).length;
      
      // If text is very short (< 10 chars) but NOT a placeholder:
      // Could be complete for simple products (e.g., "Milk", "Salt", "Honey")
      // These are fully transparent - NO penalty
      
      // If text is short (10-15 chars) but contains meaningful info:
      // Likely complete for simple products (e.g., "Honey (100%)", "100% Milk")
      // These are fully transparent - NO penalty
      
      // Only penalize if text is suspiciously vague (no numbers, no percentages, single word, 
      // but for a product that should have multiple ingredients based on category)
      // For now, if it's not a placeholder and contains actual ingredient text, it's transparent
      // We don't penalize short lists for simple products - that's expected!
      
      // NO PENALTY for short but complete ingredient lists
      // Only apply penalty if text is missing or placeholder (already handled above)
    }
  }

  const has_origin = product.origins_tags || product.manufacturing_places_tags || product.origins || product.manufacturing_places;
  if (!has_origin || String(has_origin).toLowerCase().includes('unknown')) {
    open -= 15;
  }

  open = Math.max(0, Math.min(25, Math.round(open)));

  const truscore = body + planet + care + open;

  return {
    truscore,
    breakdown: {
      Body: body,
      Planet: planet,
      Care: care,
      Open: open,
    },
    hasNutriScore,
    hasEcoScore,
    hasOrigin: !!has_origin && !String(has_origin).toLowerCase().includes('unknown'),
  };
};

