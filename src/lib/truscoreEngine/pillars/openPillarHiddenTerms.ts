/**
 * Open Pillar v15 — governed vague / code-dependent ingredient disclosure flags.
 * Food & beverage MVP: phrase list and match rules from Open_Scoring_Specification_v15.
 *
 * Tokenization: split on commas at parenthesis depth 0 (NFKC-normalized).
 * Matching: whole-word / exact phrase; additive classes only when standalone or with code-only parentheses;
 * generic extract/essence terms exclude named examples from the spec (e.g. vanilla extract).
 */

import { getAdditiveInfo } from '../../../services/additiveDatabase';

export type OpenHiddenTermPresentationClass = 'broad_generic' | 'coded';

export interface OpenHiddenTermMatch {
  term: string;
  presentationClass: OpenHiddenTermPresentationClass;
  decodedName?: string;
}

export interface OpenHiddenTermAssessment {
  flagCount: number;
  matches: OpenHiddenTermMatch[];
  termPresentationClass: 'broad_generic' | 'coded' | 'mixed';
  matchedTerms: string;
  decodedAdditiveNames: string;
}

function decodeCodedTerm(rawTerm: string): string | undefined {
  const paren = rawTerm.match(/\(([^)]+)\)/);
  if (paren) {
    const fromParen = decodeCodedTerm(paren[1]);
    if (fromParen) return fromParen;
  }
  const compact = rawTerm.replace(/\s+/g, '').toLowerCase();
  let key: string | undefined;
  const enTag = compact.match(/^en:e(\d{3,4}[a-z]?)$/);
  const eDirect = compact.match(/^e(\d{3,4}[a-z]?)$/);
  const insDirect = compact.match(/^ins(\d{3,4}[a-z]?)$/);
  const numOnly = compact.match(/^(\d{3,4}[a-z]?)$/);
  if (enTag) key = `e${enTag[1]}`;
  else if (eDirect) key = `e${eDirect[1]}`;
  else if (insDirect) key = `e${insDirect[1]}`;
  else if (numOnly) key = `e${numOnly[1]}`;
  return key ? getAdditiveInfo(key)?.name : undefined;
}

function deriveTermPresentationClass(
  matches: readonly OpenHiddenTermMatch[]
): 'broad_generic' | 'coded' | 'mixed' {
  const hasBroad = matches.some((m) => m.presentationClass === 'broad_generic');
  const hasCoded = matches.some((m) => m.presentationClass === 'coded');
  if (hasBroad && hasCoded) return 'mixed';
  if (hasCoded) return 'coded';
  return 'broad_generic';
}

function finalizeHiddenTermAssessment(matches: OpenHiddenTermMatch[]): OpenHiddenTermAssessment {
  const decodedNames = matches
    .filter((m) => m.presentationClass === 'coded')
    .map((m) => m.decodedName)
    .filter((name): name is string => Boolean(name));
  return {
    flagCount: matches.length,
    matches,
    termPresentationClass: deriveTermPresentationClass(matches),
    matchedTerms: matches.map((m) => m.term).join('|'),
    decodedAdditiveNames: decodedNames.join('|'),
  };
}

const E_NUMBER_RE = /\bE\s?\d{3,4}[a-z]?\b/gi;
const INS_NUMBER_RE = /\bINS\s?\d{3,4}[a-z]?\b/gi;

/** OFF-style tag sometimes appears in raw text */
const EN_E_NUMBER_RE = /\ben:e\d{3,4}\b/gi;

const GENERIC_FLAVOUR_PHRASES: string[] = [
  'natural and artificial flavours',
  'natural and artificial flavors',
  'natural & artificial flavours',
  'natural & artificial flavors',
  'thermal process flavourings',
  'thermal process flavorings',
  'permitted flavouring substances',
  'permitted flavoring substances',
  'permitted flavouring substance',
  'permitted flavoring substance',
  'nature identical flavouring',
  'nature identical flavoring',
  'nature identical flavours',
  'nature identical flavors',
  'nature identical flavour',
  'nature identical flavor',
  'nature-identical flavouring',
  'nature-identical flavoring',
  'nature-identical flavours',
  'nature-identical flavors',
  'nature-identical flavour',
  'nature-identical flavor',
  'natural flavourings',
  'natural flavorings',
  'natural flavouring',
  'natural flavoring',
  'natural flavours',
  'natural flavors',
  'natural flavour',
  'natural flavor',
  'artificial flavourings',
  'artificial flavorings',
  'artificial flavouring',
  'artificial flavoring',
  'artificial flavours',
  'artificial flavors',
  'artificial flavour',
  'artificial flavor',
  'flavouring preparations',
  'flavoring preparations',
  'flavouring preparation',
  'flavoring preparation',
  'flavouring substances',
  'flavoring substances',
  'flavouring substance',
  'flavoring substance',
  'thermal process flavouring',
  'thermal process flavoring',
  'smoke flavouring',
  'smoke flavoring',
  'smoke flavours',
  'smoke flavors',
  'smoke flavour',
  'smoke flavor',
  'flavourings',
  'flavorings',
  'flavouring',
  'flavoring',
  'flavours',
  'flavors',
  'flavour',
  'flavor',
  'permitted flavourings',
  'permitted flavorings',
  'permitted flavouring',
  'permitted flavoring',
  'artificial aromas',
  'natural aromas',
  'artificial aroma',
  'natural aroma',
  'aromas',
  'aroma',
];

const GENERIC_SPICE_HERB_PHRASES: string[] = [
  'spice extractives',
  'spice extractive',
  'spice blends',
  'spice blend',
  'mixed spices',
  'mixed spice',
  'seasoning blends',
  'seasoning blend',
  'seasonings',
  'seasoning',
  'spices',
  'spice',
  'mixed herbs',
  'mixed herb',
  'herb blends',
  'herb blend',
  'herbs',
  'herb',
];

const GENERIC_EXTRACT_PHRASES: string[] = [
  'vegetable extracts',
  'vegetable extract',
  'fruit extracts',
  'fruit extract',
  'plant extracts',
  'plant extract',
  'botanical extracts',
  'botanical extract',
  'essential oils',
  'essential oil',
  'oleoresins',
  'oleoresin',
  'distillates',
  'distillate',
  'extractives',
  'extractive',
  'extracts',
  'extract',
  'infusions',
  'infusion',
  'essences',
  'essence',
];

/** Spec: do not count these as vague disclosure (named / specific). */
const NAMED_SUBSTANCE_EXCLUSIONS: RegExp[] = [
  /\bvanilla\s+extracts?\b/gi,
  /\bpaprika\s+extracts?\b/gi,
  /\blemon\s+essence\b/gi,
  /\bmonosodium\s+glutamate\b/gi,
  /\bmsg\b/gi,
  /\bflavour\s+enhancer\s*\(\s*msg\s*\)/gi,
  /\bflavor\s+enhancer\s*\(\s*msg\s*\)/gi,
  /\bmonosodium\s+glutamate\s*\(\s*\d{3,4}[a-z]?\s*\)/gi,
  /\bpreservative\s*\(\s*potassium\s+sorbate\s*\)/gi,
];

/** Block generic colour/colouring matches inside caramel colour (spec example). */
const CARAMEL_COLOUR_BLOCK: RegExp = /\bcaramel\s+colou?r(ings?|s)?\b/gi;

const ADDITIVE_CLASS_TERMS: string[] = [
  'anti-caking agents',
  'anti-caking agent',
  'anticaking agents',
  'anticaking agent',
  'acidity regulators',
  'acidity regulator',
  'flour treatment agents',
  'flour treatment agent',
  'flavour enhancers',
  'flavour enhancer',
  'flavor enhancers',
  'flavor enhancer',
  'firming agents',
  'firming agent',
  'foaming agents',
  'foaming agent',
  'gelling agents',
  'gelling agent',
  'glazing agents',
  'glazing agent',
  'bulking agents',
  'bulking agent',
  'mineral salts',
  'mineral salt',
  'raising agents',
  'raising agent',
  'food additives',
  'food additive',
  'food acids',
  'food acid',
  'stabilisers',
  'stabilizers',
  'stabiliser',
  'stabilizer',
  'preservatives',
  'preservative',
  'sweeteners',
  'sweetener',
  'thickeners',
  'thickener',
  'colourings',
  'colorings',
  'colouring',
  'coloring',
  'colours',
  'colors',
  'colour',
  'color',
  'emulsifiers',
  'emulsifier',
  'antioxidants',
  'antioxidant',
  'enzymes',
  'enzyme',
  'humectants',
  'humectant',
  'propellants',
  'propellant',
  'sequestrants',
  'sequestrant',
  'additives',
  'additive',
  'acids',
  'acid',
];

const SORTED_ADDITIVE_CLASSES = [...ADDITIVE_CLASS_TERMS].sort((a, b) => b.length - a.length);
/** All disclosure phrases (flavour, spice/herb, extract, additive class) — longest first. */
const SORTED_ALL_PHRASES = [
  ...GENERIC_FLAVOUR_PHRASES,
  ...GENERIC_SPICE_HERB_PHRASES,
  ...GENERIC_EXTRACT_PHRASES,
  ...ADDITIVE_CLASS_TERMS,
].sort((a, b) => b.length - a.length);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** NFKC + trim (ingredients_text is usually single-line; newlines treated as space). */
export function normalizeOpenPillarIngredientsText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Split on commas at parenthesis depth 0 (handles "emulsifier (soy, modified), salt").
 */
export function tokenizeIngredientsText(text: string): string[] {
  const normalized = normalizeOpenPillarIngredientsText(text);
  if (!normalized) return [];

  const tokens: string[] = [];
  let depth = 0;
  let start = 0;

  for (let i = 0; i < normalized.length; i++) {
    const c = normalized[i];
    if (c === '(') depth++;
    else if (c === ')') depth = Math.max(0, depth - 1);
    else if (c === ',' && depth === 0) {
      const piece = normalized.slice(start, i).trim();
      if (piece) tokens.push(piece);
      start = i + 1;
    }
  }
  const last = normalized.slice(start).trim();
  if (last) tokens.push(last);

  return tokens;
}

function isRangeFree(covered: boolean[], from: number, to: number): boolean {
  for (let i = from; i < to; i++) {
    if (covered[i]) return false;
  }
  return true;
}

function markRange(covered: boolean[], from: number, to: number): void {
  for (let i = from; i < to; i++) covered[i] = true;
}

function maskExclusions(token: string, covered: boolean[]): void {
  const apply = (re: RegExp) => {
    let m: RegExpExecArray | null;
    const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
    while ((m = r.exec(token)) !== null) {
      markRange(covered, m.index, m.index + m[0].length);
    }
  };
  for (const ex of NAMED_SUBSTANCE_EXCLUSIONS) apply(ex);
  apply(CARAMEL_COLOUR_BLOCK);
}

function findPhraseMatch(tokenLower: string, phrase: string): { start: number; len: number } | null {
  const p = phrase.toLowerCase();
  let from = 0;
  while (from <= tokenLower.length - p.length) {
    const idx = tokenLower.indexOf(p, from);
    if (idx === -1) return null;
    const before = idx === 0 ? ' ' : tokenLower[idx - 1];
    const after = idx + p.length >= tokenLower.length ? ' ' : tokenLower[idx + p.length];
    if (!/\w/.test(before) && !/\w/.test(after)) {
      return { start: idx, len: p.length };
    }
    from = idx + 1;
  }
  return null;
}

function applyRegexHits(
  token: string,
  tokenLower: string,
  covered: boolean[],
  re: RegExp,
  hits: { count: number; matches?: OpenHiddenTermMatch[] },
  presentationClass: OpenHiddenTermPresentationClass
): void {
  const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
  let m: RegExpExecArray | null;
  while ((m = r.exec(tokenLower)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    if (isRangeFree(covered, start, end)) {
      markRange(covered, start, end);
      hits.count += 1;
      if (hits.matches) {
        const term = token.slice(start, end);
        const decodedName = decodeCodedTerm(term);
        hits.matches.push({ term, presentationClass, ...(decodedName && { decodedName }) });
      }
    }
  }
}

function innerParenIsCodeOnly(inner: string): boolean {
  const s = inner.trim();
  if (!s) return false;
  if (/^e\s?\d{3,4}[a-z]?$/i.test(s)) return true;
  if (/^ins\s?\d{3,4}[a-z]?$/i.test(s)) return true;
  if (/^\d{3,4}[a-z]?$/i.test(s)) return true;
  return false;
}

const GENERIC_SEASONING_DISCLOSURE_TERMS = ['seasoning', 'seasonings', 'spice', 'spices', 'herb', 'herbs'];

function isDisclosedSeasoningCompositionToken(tokenLower: string): boolean {
  for (const term of GENERIC_SEASONING_DISCLOSURE_TERMS) {
    const escaped = escapeRegExp(term);
    const re = new RegExp(`^${escaped}\\s*\\(([^)]+)\\)\\s*$`, 'i');
    const m = tokenLower.match(re);
    if (m && !innerParenIsCodeOnly(m[1])) return true;
  }
  return false;
}

/**
 * e.g. emulsifier (471) → hit; emulsifier (soy lecithin) → no hit from this rule.
 */
function additiveClassWithCodeParenHit(tokenLower: string): boolean {
  for (const cls of SORTED_ADDITIVE_CLASSES) {
    const escaped = escapeRegExp(cls.toLowerCase());
    const re = new RegExp(`^${escaped}\\s*\\(([^)]+)\\)\\s*$`, 'i');
    const m = tokenLower.match(re);
    if (m) return innerParenIsCodeOnly(m[1]);
  }
  return false;
}

/** e.g. emulsifier (soy lecithin) — do not treat class name as a vague term (spec). */
function isOpaqueAdditiveParenToken(tokenLower: string): boolean {
  for (const cls of SORTED_ADDITIVE_CLASSES) {
    const escaped = escapeRegExp(cls.toLowerCase());
    const re = new RegExp(`^${escaped}\\s*\\(([^)]+)\\)\\s*$`, 'i');
    const m = tokenLower.match(re);
    if (m && !innerParenIsCodeOnly(m[1])) return true;
  }
  return false;
}

/**
 * Count vague-disclosure hits for one ingredient token (comma-separated segment).
 */
export function countHiddenTermHitsInToken(token: string): number {
  return scanHiddenTermHitsInToken(token).count;
}

function scanHiddenTermHitsInToken(
  token: string,
  collectMatches = false
): { count: number; matches: OpenHiddenTermMatch[] } {
  const raw = normalizeOpenPillarIngredientsText(token);
  if (!raw) return { count: 0, matches: [] };

  const tokenLower = raw.toLowerCase();
  const covered = new Array(tokenLower.length).fill(false);
  maskExclusions(raw, covered);

  const hits: { count: number; matches?: OpenHiddenTermMatch[] } = {
    count: 0,
    ...(collectMatches && { matches: [] }),
  };

  applyRegexHits(raw, tokenLower, covered, E_NUMBER_RE, hits, 'coded');
  applyRegexHits(raw, tokenLower, covered, INS_NUMBER_RE, hits, 'coded');
  applyRegexHits(raw, tokenLower, covered, EN_E_NUMBER_RE, hits, 'coded');

  if (additiveClassWithCodeParenHit(tokenLower)) {
    if (isRangeFree(covered, 0, tokenLower.length)) {
      markRange(covered, 0, tokenLower.length);
      hits.count += 1;
      if (hits.matches) {
        const decodedName = decodeCodedTerm(raw);
        hits.matches.push({ term: raw, presentationClass: 'coded', ...(decodedName && { decodedName }) });
      }
    }
    return { count: hits.count, matches: hits.matches ?? [] };
  }

  if (isOpaqueAdditiveParenToken(tokenLower)) {
    markRange(covered, 0, tokenLower.length);
    return { count: hits.count, matches: hits.matches ?? [] };
  }

  if (isDisclosedSeasoningCompositionToken(tokenLower)) {
    markRange(covered, 0, tokenLower.length);
    return { count: hits.count, matches: hits.matches ?? [] };
  }

  for (const phrase of SORTED_ALL_PHRASES) {
    const match = findPhraseMatch(tokenLower, phrase);
    if (!match) continue;
    const { start, len } = match;
    const end = start + len;
    if (isRangeFree(covered, start, end)) {
      markRange(covered, start, end);
      hits.count += 1;
      if (hits.matches) {
        hits.matches.push({
          term: raw.slice(start, end),
          presentationClass: 'broad_generic',
        });
      }
    }
  }

  return { count: hits.count, matches: hits.matches ?? [] };
}

/** Total hidden-term hits across all ingredient tokens (Open Pillar v15). */
export function countOpenPillarHiddenTermHits(ingredientsText: string): number {
  return assessOpenPillarHiddenTerms(ingredientsText).flagCount;
}

/**
 * Score-neutral governed-term assessment for Open ingredient-clarity commentary metadata.
 * Uses the same match rules as scoring; does not change flag counts.
 */
export function assessOpenPillarHiddenTerms(ingredientsText: string): OpenHiddenTermAssessment {
  const text = ingredientsText || '';
  const tokens = tokenizeIngredientsText(text);
  const allMatches: OpenHiddenTermMatch[] = [];

  if (tokens.length === 0 && normalizeOpenPillarIngredientsText(text)) {
    allMatches.push(...scanHiddenTermHitsInToken(text, true).matches);
  } else {
    for (const t of tokens) {
      allMatches.push(...scanHiddenTermHitsInToken(t, true).matches);
    }
  }

  return finalizeHiddenTermAssessment(allMatches);
}
