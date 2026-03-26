/**
 * NOVA Group 1 — limited internal rescue (Implementation Guidance v1.3)
 *
 * Only assigns estimated NOVA 1 when OFF nova_group is missing, with whitelist-led rules.
 * No internal NOVA 2 / 3 / 4. Provenance: _nova_estimated, _nova_confidence.
 */

import { Product } from '../types/product';
import { logger } from './logger';

export interface NOVA1Assessment {
  likelyNOVA1: boolean;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

const GROUP2_RE =
  /\b(salt|sugar|sucrose|glucose|fructose|olive oil|vegetable oil|sunflower oil|canola oil|coconut oil|sesame oil|butter|margarine|lard|cream|honey|maple syrup|molasses|vinegar)\b/i;

const PROCESSED_MARKERS =
  /\b(modified\s+starch|corn\s+syrup|high\s+fructose|hfcs|hydrogenated|nitrite|nitrate|preservative|colour|color|flavour|flavor|sweetener|emulsifier|stabiliser|stabilizer|isolate|carrageenan|xanthan|msg|maltodextrin)\b/i;

const COMPOSITE_BLOCK =
  /\b(bread|cracker|biscuit|pasta\s+sauce|soup|seasoned|salted\s+nuts|roasted\s+salted)\b/i;

/** Normalised single-ingredient lines allowed for NOVA 1 rescue (source-anchored examples, v1.3). */
const NOVA1_SINGLE_WHITELIST = new Set([
  'peas',
  'green peas',
  'corn',
  'spinach',
  'blueberries',
  'strawberries',
  'mixed vegetables',
  'broccoli',
  'carrots',
  'brown rice',
  'white rice',
  'oats',
  'quinoa',
  'wheat berries',
  'lentils',
  'chickpeas',
  'black beans',
  'kidney beans',
  'split peas',
  'potatoes',
  'sweet potatoes',
  'cassava',
  'mushrooms',
  'eggs',
  'milk',
  'almonds',
  'sunflower seeds',
  'black pepper',
  'mint',
  'tea',
  'coffee',
  'water',
  'plain yoghurt',
  'plain yogurt',
  'salmon',
  'tuna',
  'shrimp',
  'fish',
  'chicken',
  'beef',
  'pork',
  'turkey',
  'poultry',
  'meat',
]);

function stripLeadingQualifiers(s: string): string {
  return s
    .toLowerCase()
    .replace(/^(organic|fresh|frozen|whole|raw|dried|chilled|natural|pure)\s+/i, '')
    .trim();
}

function splitIngredients(text: string): string[] {
  return text
    .split(/[,;]/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 0);
}

function isPlainYoghurtMilkCultures(parts: string[]): boolean {
  if (parts.length < 2 || parts.length > 3) return false;
  const joined = parts.join(' ').toLowerCase();
  const hasMilk = /\bmilk\b/.test(joined);
  const hasYoghurtWord = /\byoghurt\b|\byogurt\b/.test(joined);
  const hasCulture =
    /\bcultures?\b|\bstarter\b|\blactic\s+acid\s+bacteria\b|\bprobiotic\b/.test(joined);
  if (!hasMilk || !hasCulture) return false;
  if (/\bsugar\b|\bsweetener\b|\bflavour\b|\bflavor\b|\bhoney\b|\bsyrup\b/i.test(joined)) {
    return false;
  }
  return true;
}

function isFlourAndWaterOnly(parts: string[]): boolean {
  if (parts.length !== 2) return false;
  const [a, b] = parts.map(stripLeadingQualifiers);
  const flour = /\b(flour|wheat flour|semolina)\b/i.test(a) || /\b(flour|wheat flour|semolina)\b/i.test(b);
  const water = /\bwater\b/i.test(a) || /\bwater\b/i.test(b);
  return flour && water;
}

function isSingleQualifyingIngredient(part: string): boolean {
  const n = stripLeadingQualifiers(part);
  if (!n) return false;
  if (NOVA1_SINGLE_WHITELIST.has(n)) return true;
  if (n.endsWith(' peas') && NOVA1_SINGLE_WHITELIST.has(n.replace(/^.*?\s/, ''))) return true;
  return false;
}

function isWater(part: string): boolean {
  return stripLeadingQualifiers(part) === 'water';
}

function passesNova1Whitelist(product: Product): { ok: boolean; reason: string } {
  const text = product.ingredients_text || '';
  if (GROUP2_RE.test(text)) {
    return { ok: false, reason: 'Group 2 culinary ingredient detected' };
  }
  if (PROCESSED_MARKERS.test(text)) {
    return { ok: false, reason: 'Processed marker detected' };
  }
  if (COMPOSITE_BLOCK.test(text)) {
    return { ok: false, reason: 'Composite / processed product pattern' };
  }

  const parts = splitIngredients(text);
  if (parts.length === 0) {
    return { ok: false, reason: 'No ingredient parts' };
  }

  if (parts.length === 1) {
    return isSingleQualifyingIngredient(parts[0])
      ? { ok: true, reason: 'Single qualifying ingredient' }
      : { ok: false, reason: 'Single ingredient not on NOVA 1 whitelist' };
  }

  if (parts.length === 2) {
    const [p0, p1] = parts;
    if ((isWater(p0) && isSingleQualifyingIngredient(p1)) || (isWater(p1) && isSingleQualifyingIngredient(p0))) {
      return { ok: true, reason: 'One qualifying ingredient + water' };
    }
    if (isFlourAndWaterOnly(parts)) {
      return { ok: true, reason: 'Flour + water only' };
    }
  }

  if (isPlainYoghurtMilkCultures(parts)) {
    return { ok: true, reason: 'Plain yoghurt (milk + cultures)' };
  }

  return { ok: false, reason: 'Ingredient pattern does not match whitelist rescue' };
}

export function assessNOVAGroup1(product: Product): NOVA1Assessment {
  if (product.nova_group !== undefined && product.nova_group !== null) {
    return {
      likelyNOVA1: product.nova_group === 1,
      confidence: 'high',
      reason: 'NOVA group already set by data source',
    };
  }

  const additives = product.additives_tags;
  if (additives && additives.length > 0) {
    return {
      likelyNOVA1: false,
      confidence: 'low',
      reason: 'Additive tags present — NOVA 1 rescue blocked',
    };
  }

  if (!product.ingredients_text || product.ingredients_text.trim().length === 0) {
    return { likelyNOVA1: false, confidence: 'low', reason: 'No ingredients text' };
  }

  const gate = passesNova1Whitelist(product);
  if (!gate.ok) {
    return { likelyNOVA1: false, confidence: 'low', reason: gate.reason };
  }

  return {
    likelyNOVA1: true,
    confidence: 'high',
    reason: gate.reason,
  };
}

export function assignNOVA1IfHighConfidence(product: Product): Product {
  const assessment = assessNOVAGroup1(product);
  if (assessment.likelyNOVA1 && assessment.confidence === 'high') {
    product.nova_group = 1;
    (product as any)._nova_estimated = true;
    (product as any)._nova_confidence = 'high';
    logger.debug(`[NOVA Assessment] Assigned NOVA 1 (whitelist rescue): ${assessment.reason}`);
  }
  return product;
}
