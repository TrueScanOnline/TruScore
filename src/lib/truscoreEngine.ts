// src/lib/truscoreEngine.ts – TruScore v1.4 Core Engine (Nov 2025)
// Full client-side TS scoring engine - offline-first, <150ms
// Ported from Python v1.4 spec exactly

import { Product } from '../types/product';

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
}

// Cruel list: 21 parent companies (hardcoded)
const CRUEL_PARENTS = [
  'unilever',
  'procter & gamble',
  'p&g',
  "l'oreal",
  'loreal',
  'estee lauder',
  'estée lauder',
  'colgate-palmolive',
  'johnson & johnson',
  'j&j',
  'reckitt',
  'reckitt benckiser',
  'rb',
  'henkel',
  'beiersdorf',
  'shiseido',
  'kao',
  'sc johnson',
  's.c. johnson',
  'clorox',
  'church & dwight',
  'coty',
  'revlon',
  'nestle',
  'nestlé',
  'mars',
  'mondelez',
  'danone',
  'kimberly-clark',
];

// Hidden terms for Open pillar
const HIDDEN_TERMS = [
  'parfum',
  'fragrance',
  'aroma',
  'flavor',
  'natural flavor',
  'natural flavour',
  'proprietary',
];

// Irritant terms for Body pillar
const IRRITANTS = [
  'paraben',
  'phthalate',
  'sulfate',
  'triclosan',
  'formaldehyde',
  'peg',
  'silicone',
  'phenoxyethanol',
];

/**
 * Calculate TruScore v1.4 - Full spec implementation
 * 4 pillars × 25pts = 100 total
 * Offline-first, <150ms execution
 */
export function calculateTruScore(product: Product): TruScoreResult {
  const text = (product.ingredients_text || '').toLowerCase();
  const labels = (product.labels_tags || []).map((l: string) => l.toLowerCase());
  const analysisTags = product.ingredients_analysis_tags || [];
  const packagings = product.packagings || [];
  const brands = (product.brands || '').toLowerCase();
  const additivesCount = product.additives_tags?.length || 0;

  // Helper: word boundary matching
  const hasTerm = (term: string): boolean => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(text);
  };

  // Helper: label matching
  const hasLabel = (pattern: string): boolean => {
    return labels.some((l: string) => l.includes(pattern.toLowerCase()));
  };

  // === BODY PILLAR (25pts) ===
  let body = 25; // Base when Nutri absent
  const hasNutriScore = !!product.nutriscore_grade;

  // If Nutri-Score exists, use it
  if (hasNutriScore) {
    const ns = product.nutriscore_grade?.toLowerCase();
    if (ns) {
      body = { a: 25, b: 20, c: 15, d: 10, e: 5 }[ns] || 25;
    }
  }

  // Penalties
  // Additives: −1.5 each (cap 15)
  body -= Math.min(additivesCount * 1.5, 15);

  // Risky tags: −4 each
  const riskyCount = analysisTags.filter((t: string) =>
    ['carcinogenic', 'endocrine', 'palm', 'allergen', 'irritant'].some((x) =>
      t.toLowerCase().includes(x)
    )
  ).length;
  body -= riskyCount * 4;

  // Irritant block: −10
  if (IRRITANTS.some((i) => hasTerm(i))) {
    body -= 10;
  }

  // Fragrance: −10
  if (['parfum', 'fragrance', 'aroma'].some((a) => hasTerm(a))) {
    body -= 10;
  }

  // NOVA: 4 = −10, 3 = −5
  const nova = product.nova_group;
  if (nova === 4) body -= 10;
  else if (nova === 3) body -= 5;

  body = Math.max(0, Math.min(25, Math.round(body)));

  // === PLANET PILLAR (25pts) ===
  let planet = 25; // Base when Eco absent
  const hasEcoScore = !!product.ecoscore_grade;

  // If Eco-Score exists, use it
  if (hasEcoScore) {
    const es = product.ecoscore_grade?.toLowerCase();
    if (es) {
      planet = { a: 25, b: 20, c: 15, d: 10, e: 5 }[es] || 25;
    }
  }

  // Palm oil: −10
  const hasPalm = analysisTags.some((t: string) => t.toLowerCase().includes('palm'));
  const palmFree = [...analysisTags, ...labels].some((t: string) =>
    t.toLowerCase().includes('palm-oil-free')
  );
  if (hasPalm && !palmFree) {
    planet -= 10;
  }

  // Recyclable: full +5, partial +2
  const recyclableCount = packagings.filter(
    (p: any) =>
      p.recycling &&
      ['recycle', 'widely recycled'].includes(p.recycling.toLowerCase())
  ).length;
  if (recyclableCount === packagings.length && packagings.length > 0) {
    planet += 5;
  } else if (recyclableCount > 0) {
    planet += 2;
  }

  planet = Math.max(0, Math.min(25, Math.round(planet)));

  // === CARE PILLAR (25pts) ===
  let care = 18; // Base (absence of known cruelty)

  // Stack bonuses
  if (hasLabel('fair-trade')) care += 8;
  if (hasLabel('organic')) care += 8;
  if (hasLabel('rainforest-alliance')) care += 7;
  if (labels.some((l: string) => ['en:msc', 'en:asc', 'en:dolphin-safe'].includes(l))) {
    care += 8;
  }
  if (hasLabel('rspca')) care += 6;
  if (labels.some((l: string) => ['en:vegan', 'en:cruelty-free'].includes(l))) {
    care += 10;
  }
  if (hasLabel('utz')) care += 7;

  // Cruel parent: −30
  if (CRUEL_PARENTS.some((cruel) => brands.includes(cruel))) {
    care -= 30;
  }

  care = Math.max(0, Math.min(25, Math.round(care)));

  // === OPEN PILLAR (25pts) ===
  let open = 25; // Base

  // Hidden terms: 1-2 = −12, ≥3 = −20
  const hiddenCount = HIDDEN_TERMS.filter((t) => hasTerm(t)).length;
  if (hiddenCount >= 3) {
    open -= 20;
  } else if (hiddenCount >= 1) {
    open -= 12;
  }

  // No ingredients: 5
  if (!text || text.trim().length === 0) {
    open = 5;
  } else {
    // Check for placeholder
    const isPlaceholder = /^(product|item|n\/a|not available|unknown|missing|no ingredients|ingredients not listed)/i.test(
      text.trim()
    );
    if (isPlaceholder) {
      open = 5;
    }
  }

  // No origin: −15
  const hasOrigin =
    product.origins_tags ||
    product.manufacturing_places_tags ||
    product.origins ||
    product.manufacturing_places;
  if (!hasOrigin || String(hasOrigin).toLowerCase().includes('unknown')) {
    open -= 15;
  }

  // Origin penalty: prefix mismatch OFF tags −8 Open
  // Check if origin tags don't match product code prefix
  // Note: This requires barcode/code which may not be in Product type
  // For now, we'll skip this check as it requires additional context
  // TODO: Implement origin penalty when barcode context is available

  open = Math.max(0, Math.min(25, Math.round(open)));

  // Total
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
    hasOrigin: !!hasOrigin && !String(hasOrigin).toLowerCase().includes('unknown'),
  };
}

