/**
 * Open Pillar v15 — governed vague / code-dependent ingredient disclosure flags.
 * Food & beverage MVP: phrase list and match rules from Open_Scoring_Specification_v15.
 *
 * Parsing: ingredient items are split on top-level `,` / `;` with depth awareness for
 * `()`, `[]` and `{}`; each item is decomposed into an unresolved head plus any
 * bracketed specification groups (recursively parsed the same way).
 * Matching: whole-word / exact phrase against an unresolved head expression, never an
 * arbitrary substring inside a more specific phrase ("yeast extract", "citric acid").
 * Additive classes count only while the additive identity stays unresolved: an identity
 * supplied in the same item resolves the class shell whether it is bracketed
 * ("Emulsifier (Soy Lecithin)") or immediately follows the class name
 * ("Emulsifier Soy Lecithin"). A code-only identity suppresses the shell and keeps one
 * code-dependent flag; a non-exhaustive qualifier ("contains", "may contain",
 * "including") never resolves the shell. Generic extract/essence terms exclude named
 * examples from the spec (e.g. vanilla extract).
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
  const bracketed = rawTerm.match(/[([{]([^)\]}]+)[)\]}]/);
  if (bracketed) {
    const fromBracket = decodeCodedTerm(bracketed[1]);
    if (fromBracket) return fromBracket;
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

/** Generic seasoning/spice/herb heads that a composition list can legitimately resolve. */
const SEASONING_CATEGORY_TERMS: string[] = [
  'seasoning',
  'seasonings',
  'spice',
  'spices',
  'herb',
  'herbs',
];

/** All disclosure phrases (flavour, spice/herb, extract, additive class) — longest first. */
const SORTED_ALL_PHRASES = [
  ...GENERIC_FLAVOUR_PHRASES,
  ...GENERIC_SPICE_HERB_PHRASES,
  ...GENERIC_EXTRACT_PHRASES,
  ...ADDITIVE_CLASS_TERMS,
].sort((a, b) => b.length - a.length);

/** Exported for governed-term coverage tests; not a scoring input on its own. */
export const OPEN_GOVERNED_TERM_PHRASES: readonly string[] = Object.freeze([...SORTED_ALL_PHRASES]);

const ADDITIVE_CLASS_SET = new Set(ADDITIVE_CLASS_TERMS);
const RESOLVABLE_CATEGORY_HEADS = new Set([...ADDITIVE_CLASS_TERMS, ...SEASONING_CATEGORY_TERMS]);

/**
 * Words that carry no ingredient specificity, so a governed term remains the unresolved
 * expression when only these surround it ("permitted colours", "natural colour").
 */
const NON_SPECIFYING_QUALIFIERS = new Set([
  'added',
  'approved',
  'artificial',
  'assorted',
  'blended',
  'certain',
  'edible',
  'food',
  'mixed',
  'natural',
  'other',
  'permitted',
  'synthetic',
  'various',
]);

/** Grammatical glue that never specifies an ingredient. */
const STRUCTURAL_STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'both',
  'contain',
  'containing',
  'contains',
  'each',
  'for',
  'from',
  'in',
  'include',
  'includes',
  'including',
  'of',
  'on',
  'or',
  'plus',
  'the',
  'to',
  'with',
]);

/** NFKC + trim (ingredients_text is usually single-line; newlines treated as space). */
export function normalizeOpenPillarIngredientsText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim();
}

const OPEN_BRACKETS: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
const CLOSE_BRACKETS = new Set([')', ']', '}']);
const TOP_LEVEL_SEPARATORS = new Set([',', ';']);

/** Edge punctuation removed per item/head without disturbing internal phrase structure. */
const EDGE_TRIM_RE = /[\s.,;:!?*†‡•·+/\\_"'\u2018\u2019\u201C\u201D\-\u2013\u2014]/;

interface TextRange {
  start: number;
  end: number;
}

interface SpecificationGroup extends TextRange {
  outerStart: number;
  outerEnd: number;
}

interface ParsedIngredientItem extends TextRange {
  /** Top-level text ranges outside any bracket group; the first one is the head. */
  bareRanges: TextRange[];
  groups: SpecificationGroup[];
}

function trimRange(text: string, start: number, end: number): TextRange {
  let s = start;
  let e = end;
  while (s < e && EDGE_TRIM_RE.test(text[s])) s++;
  while (e > s && EDGE_TRIM_RE.test(text[e - 1])) e--;
  return { start: s, end: e };
}

/** Depth-aware split on top-level `,` and `;` (parentheses, brackets and braces nest). */
function splitTopLevelRanges(text: string, from: number, to: number): TextRange[] {
  const parts: TextRange[] = [];
  const stack: string[] = [];
  let segmentStart = from;

  for (let i = from; i < to; i++) {
    const c = text[i];
    if (OPEN_BRACKETS[c]) {
      stack.push(OPEN_BRACKETS[c]);
    } else if (CLOSE_BRACKETS.has(c)) {
      if (stack.length > 0) stack.pop();
    } else if (stack.length === 0 && TOP_LEVEL_SEPARATORS.has(c)) {
      const piece = trimRange(text, segmentStart, i);
      if (piece.end > piece.start) parts.push(piece);
      segmentStart = i + 1;
    }
  }

  const last = trimRange(text, segmentStart, to);
  if (last.end > last.start) parts.push(last);
  return parts;
}

/** Decompose one item into its unresolved bare text ranges and specification groups. */
function parseIngredientItem(text: string, start: number, end: number): ParsedIngredientItem {
  const groups: SpecificationGroup[] = [];
  const stack: string[] = [];
  let groupOuterStart = -1;

  for (let i = start; i < end; i++) {
    const c = text[i];
    if (OPEN_BRACKETS[c]) {
      if (stack.length === 0) groupOuterStart = i;
      stack.push(OPEN_BRACKETS[c]);
    } else if (CLOSE_BRACKETS.has(c)) {
      if (stack.length === 0) continue;
      stack.pop();
      if (stack.length === 0 && groupOuterStart >= 0) {
        groups.push({
          outerStart: groupOuterStart,
          outerEnd: i + 1,
          start: groupOuterStart + 1,
          end: i,
        });
        groupOuterStart = -1;
      }
    }
  }

  // Unterminated group: treat the remainder as its specification content.
  if (stack.length > 0 && groupOuterStart >= 0) {
    groups.push({
      outerStart: groupOuterStart,
      outerEnd: end,
      start: groupOuterStart + 1,
      end,
    });
  }

  const bareRanges: TextRange[] = [];
  let cursor = start;
  for (const group of groups) {
    const bare = trimRange(text, cursor, group.outerStart);
    if (bare.end > bare.start) bareRanges.push(bare);
    cursor = group.outerEnd;
  }
  const tail = trimRange(text, cursor, end);
  if (tail.end > tail.start) bareRanges.push(tail);

  return { start, end, bareRanges, groups };
}

interface ScanContext {
  text: string;
  lower: string;
  covered: boolean[];
  matches: OpenHiddenTermMatch[];
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

function maskExclusions(ctx: ScanContext): void {
  const apply = (re: RegExp) => {
    const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
    let m: RegExpExecArray | null;
    while ((m = r.exec(ctx.text)) !== null) {
      markRange(ctx.covered, m.index, m.index + m[0].length);
    }
  };
  for (const ex of NAMED_SUBSTANCE_EXCLUSIONS) apply(ex);
  apply(CARAMEL_COLOUR_BLOCK);
}

/**
 * First whole-word occurrence of `phrase` in `haystack` whose span is still available.
 */
function findPhraseMatch(
  haystack: string,
  phrase: string,
  isAvailable: (start: number, end: number) => boolean
): TextRange | null {
  const p = phrase.toLowerCase();
  if (!p || p.length > haystack.length) return null;
  let from = 0;
  while (from <= haystack.length - p.length) {
    const idx = haystack.indexOf(p, from);
    if (idx === -1) return null;
    const before = idx === 0 ? ' ' : haystack[idx - 1];
    const after = idx + p.length >= haystack.length ? ' ' : haystack[idx + p.length];
    if (!/\w/.test(before) && !/\w/.test(after) && isAvailable(idx, idx + p.length)) {
      return { start: idx, end: idx + p.length };
    }
    from = idx + 1;
  }
  return null;
}

function applyRegexHits(
  ctx: ScanContext,
  from: number,
  to: number,
  re: RegExp,
  presentationClass: OpenHiddenTermPresentationClass
): void {
  const slice = ctx.lower.slice(from, to);
  const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
  let m: RegExpExecArray | null;
  while ((m = r.exec(slice)) !== null) {
    const start = from + m.index;
    const end = start + m[0].length;
    if (isRangeFree(ctx.covered, start, end)) {
      markRange(ctx.covered, start, end);
      const term = ctx.text.slice(start, end);
      const decodedName = decodeCodedTerm(term);
      ctx.matches.push({ term, presentationClass, ...(decodedName && { decodedName }) });
    }
  }
}

/** e.g. `471`, `E150a`, `INS 322` — a specification that is nothing but an additive code. */
function specificationIsCodeOnly(inner: string): boolean {
  const s = inner.trim();
  if (!s) return false;
  if (/^e\s?\d{3,4}[a-z]?$/i.test(s)) return true;
  if (/^ins\s?\d{3,4}[a-z]?$/i.test(s)) return true;
  if (/^\d{3,4}[a-z]?$/i.test(s)) return true;
  return false;
}

/**
 * "contains", "may contain", "including" and equivalents are non-exhaustive: they name an
 * example rather than establishing that the category is fully specified, so they never
 * resolve a class shell ("Flavours (Contains Glutamic Acid)" stays a broad Flavours flag).
 */
const NON_EXHAUSTIVE_QUALIFIER_RE =
  /^(?:may\s+contains?|contains?|includ(?:e|es|ing)|such\s+as|e\.?g\.?|etc\.?)\b/i;

function specificationIsNonExhaustive(inner: string): boolean {
  return NON_EXHAUSTIVE_QUALIFIER_RE.test(inner.trim());
}

/**
 * Bare code items listed inside an additive category specification, e.g. the `471` and
 * `472e` of "Emulsifiers (471, 472e)". The category context disambiguates these from
 * quantities, so they count as code-dependent disclosure rather than being dropped with
 * the suppressed category shell.
 */
function countBareCodesInSpecification(ctx: ScanContext, from: number, to: number): void {
  for (const range of splitTopLevelRanges(ctx.text, from, to)) {
    const item = ctx.text.slice(range.start, range.end);
    if (!specificationIsCodeOnly(item)) continue;
    if (!isRangeFree(ctx.covered, range.start, range.end)) continue;
    markRange(ctx.covered, range.start, range.end);
    const decodedName = decodeCodedTerm(item);
    ctx.matches.push({ term: item, presentationClass: 'coded', ...(decodedName && { decodedName }) });
  }
}

const WORD_RE = /[\p{L}\p{N}]+/gu;

/**
 * True when the expression carries a substantive word from `from` onwards that no governed
 * phrase, exclusion mask or coded hit already accounts for — i.e. wording that specifies an
 * actual ingredient identity rather than restating the generic expression.
 */
function hasSpecifyingWord(
  ctx: ScanContext,
  absStart: number,
  expression: string,
  candidates: readonly TextRange[],
  from = 0
): boolean {
  const re = new RegExp(WORD_RE.source, WORD_RE.flags);
  re.lastIndex = from;
  let m: RegExpExecArray | null;
  while ((m = re.exec(expression)) !== null) {
    const wordStart = m.index;
    const wordEnd = wordStart + m[0].length;
    if (candidates.some((c) => wordStart >= c.start && wordEnd <= c.end)) continue;
    // Already resolved by an exclusion mask or a coded-term hit.
    if (!isRangeFree(ctx.covered, absStart + wordStart, absStart + wordEnd)) continue;
    const word = m[0];
    if (/\d/.test(word)) continue;
    if (STRUCTURAL_STOPWORDS.has(word) || NON_SPECIFYING_QUALIFIERS.has(word)) continue;
    return true;
  }
  return false;
}

/**
 * True when every substantive word of the expression belongs to a governed phrase match
 * (or is already resolved / non-specifying), i.e. the governed terms ARE the expression
 * rather than fragments of a more specific phrase ("citric acid", "yeast extract").
 */
function expressionIsFullyGoverned(
  ctx: ScanContext,
  absStart: number,
  expression: string,
  candidates: readonly TextRange[]
): boolean {
  return !hasSpecifyingWord(ctx, absStart, expression, candidates);
}

function commitBroadGenericMatches(
  ctx: ScanContext,
  absStart: number,
  candidates: readonly TextRange[]
): void {
  for (const c of candidates) {
    const start = absStart + c.start;
    const end = absStart + c.end;
    if (!isRangeFree(ctx.covered, start, end)) continue;
    markRange(ctx.covered, start, end);
    ctx.matches.push({ term: ctx.text.slice(start, end), presentationClass: 'broad_generic' });
  }
}

/**
 * Class+identity supplied without brackets, e.g. "Emulsifier Soy Lecithin" or
 * "Colour 150a". Returns `true` when the shell has been disposed of here: either the
 * identity resolves it (suppress the shell, keep assessing the identity wording) or the
 * identity is code-only (one code-dependent flag, never the shell as well).
 */
function resolveInlineClassShell(
  ctx: ScanContext,
  start: number,
  end: number,
  expression: string,
  shell: TextRange,
  candidates: readonly TextRange[]
): boolean {
  // "Colour 150a", "Colour: 150a" and "Colour — 150a" all supply the same identity.
  const remainder = expression.slice(shell.end).replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
  if (!remainder) return false;
  if (specificationIsNonExhaustive(remainder)) return false;

  if (specificationIsCodeOnly(remainder)) {
    if (isRangeFree(ctx.covered, start, end)) {
      markRange(ctx.covered, start, end);
      const term = ctx.text.slice(start, end);
      const decodedName = decodeCodedTerm(remainder);
      ctx.matches.push({ term, presentationClass: 'coded', ...(decodedName && { decodedName }) });
    } else {
      // The code was already counted (e.g. "Colour E150a"); only suppress the shell.
      markRange(ctx.covered, start + shell.start, start + shell.end);
    }
    return true;
  }

  if (!hasSpecifyingWord(ctx, start, expression, candidates, shell.end)) return false;

  markRange(ctx.covered, start + shell.start, start + shell.end);
  const identity = trimRange(ctx.text, start + shell.end, end);
  if (identity.end > identity.start) analyzeBareExpression(ctx, identity.start, identity.end);
  return true;
}

/**
 * Governed phrase matching for one unresolved bare expression (an item head or a tail
 * fragment). Longest phrase first; a match only counts when it is the whole unresolved
 * expression, or an additive-category shell whose additive identity is still unresolved.
 */
function analyzeBareExpression(ctx: ScanContext, start: number, end: number): void {
  const expression = ctx.lower.slice(start, end);
  if (!expression) return;

  const localCovered = new Array(expression.length).fill(false);
  const candidates: (TextRange & { phrase: string })[] = [];

  for (const phrase of SORTED_ALL_PHRASES) {
    const match = findPhraseMatch(
      expression,
      phrase,
      (s, e) => isRangeFree(localCovered, s, e) && isRangeFree(ctx.covered, start + s, start + e)
    );
    if (!match) continue;
    markRange(localCovered, match.start, match.end);
    candidates.push({ ...match, phrase });
  }

  if (candidates.length === 0) return;

  const categoryShell = candidates.find((c) => c.start === 0 && ADDITIVE_CLASS_SET.has(c.phrase));
  if (categoryShell && resolveInlineClassShell(ctx, start, end, expression, categoryShell, candidates)) {
    return;
  }

  if (expressionIsFullyGoverned(ctx, start, expression, candidates)) {
    commitBroadGenericMatches(ctx, start, candidates);
  }
}

function analyzeRange(ctx: ScanContext, from: number, to: number): void {
  for (const range of splitTopLevelRanges(ctx.text, from, to)) {
    analyzeItem(ctx, parseIngredientItem(ctx.text, range.start, range.end));
  }
}

function analyzeItem(ctx: ScanContext, item: ParsedIngredientItem): void {
  const head = item.bareRanges[0];
  const headLower = head ? ctx.lower.slice(head.start, head.end) : '';
  const headOnlyBare = item.bareRanges.length === 1;
  const hasSpecification = item.groups.length > 0;
  const allSpecificationsCoded =
    hasSpecification &&
    item.groups.every((g) => specificationIsCodeOnly(ctx.text.slice(g.start, g.end)));
  // "contains / may contain / including" names an example, so it cannot resolve the shell.
  const hasDirectSpecification =
    hasSpecification &&
    item.groups.some((g) => !specificationIsNonExhaustive(ctx.text.slice(g.start, g.end)));

  // Additive category disclosed only by code, e.g. "Thickeners (471)": one coded flag for
  // the shell + its specification, never both.
  if (headOnlyBare && allSpecificationsCoded && ADDITIVE_CLASS_SET.has(headLower)) {
    if (isRangeFree(ctx.covered, item.start, item.end)) {
      markRange(ctx.covered, item.start, item.end);
      const term = ctx.text.slice(item.start, item.end);
      const decodedName = decodeCodedTerm(term);
      ctx.matches.push({ term, presentationClass: 'coded', ...(decodedName && { decodedName }) });
    }
    return;
  }

  // Category specifically resolved, e.g. "Thickeners (Methyl Cellulose)": suppress the
  // category shell, then assess the specification for any governed terms left inside it.
  if (
    headOnlyBare &&
    hasDirectSpecification &&
    !allSpecificationsCoded &&
    RESOLVABLE_CATEGORY_HEADS.has(headLower)
  ) {
    markRange(ctx.covered, head.start, head.end);
    for (const group of item.groups) {
      if (ADDITIVE_CLASS_SET.has(headLower)) countBareCodesInSpecification(ctx, group.start, group.end);
      analyzeRange(ctx, group.start, group.end);
    }
    return;
  }

  for (const bare of item.bareRanges) analyzeBareExpression(ctx, bare.start, bare.end);
  for (const group of item.groups) analyzeRange(ctx, group.start, group.end);
}

/**
 * Split ingredients text into top-level ingredient items.
 * Depth-aware for `()`, `[]`, `{}` and splitting on both `,` and `;`
 * (e.g. "emulsifier (soy, modified), salt" → 2 items).
 */
export function tokenizeIngredientsText(text: string): string[] {
  const normalized = normalizeOpenPillarIngredientsText(text);
  if (!normalized) return [];
  return splitTopLevelRanges(normalized, 0, normalized.length).map((r) =>
    normalized.slice(r.start, r.end)
  );
}

function createScanContext(normalized: string): ScanContext {
  const ctx: ScanContext = {
    text: normalized,
    lower: normalized.toLowerCase(),
    covered: new Array(normalized.length).fill(false),
    matches: [],
  };
  maskExclusions(ctx);
  return ctx;
}

function scanItemRange(ctx: ScanContext, range: TextRange): void {
  applyRegexHits(ctx, range.start, range.end, E_NUMBER_RE, 'coded');
  applyRegexHits(ctx, range.start, range.end, INS_NUMBER_RE, 'coded');
  applyRegexHits(ctx, range.start, range.end, EN_E_NUMBER_RE, 'coded');
  analyzeItem(ctx, parseIngredientItem(ctx.text, range.start, range.end));
}

function scanHiddenTerms(text: string): OpenHiddenTermMatch[] {
  const normalized = normalizeOpenPillarIngredientsText(text || '');
  if (!normalized) return [];
  const ctx = createScanContext(normalized);
  const ranges = splitTopLevelRanges(normalized, 0, normalized.length);
  if (ranges.length === 0) {
    scanItemRange(ctx, { start: 0, end: normalized.length });
  } else {
    for (const range of ranges) scanItemRange(ctx, range);
  }
  return ctx.matches;
}

/**
 * Count vague-disclosure hits for one ingredient item (or a short item list).
 */
export function countHiddenTermHitsInToken(token: string): number {
  return scanHiddenTerms(token).length;
}

/** Total hidden-term hits across all ingredient items (Open Pillar v15). */
export function countOpenPillarHiddenTermHits(ingredientsText: string): number {
  return assessOpenPillarHiddenTerms(ingredientsText).flagCount;
}

/**
 * Score-neutral governed-term assessment for Open ingredient-clarity commentary metadata.
 * Uses the same match rules as scoring; does not change flag counts.
 */
export function assessOpenPillarHiddenTerms(ingredientsText: string): OpenHiddenTermAssessment {
  return finalizeHiddenTermAssessment(scanHiddenTerms(ingredientsText || ''));
}
