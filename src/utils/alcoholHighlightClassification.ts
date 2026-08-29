/**
 * Deterministic alcohol classification for Score Highlights commentary only.
 * Does not affect TruScore / Body pillar arithmetic.
 */

const NON_ALCOHOLIC_CATEGORY_ROOT = 'en:non-alcoholic-beverages';
const ALCOHOLIC_CATEGORY_ROOT = 'en:alcoholic-beverages';

/** Founder-approved non-alcoholic name phrases (exact strings, longest first). */
const NON_ALCOHOLIC_NAME_PHRASES = [
  'non-alcoholic',
  'non alcoholic',
  'alcohol-free',
  'alcohol free',
  'zero alcohol',
  'zero-alcohol',
  '0% alcohol',
  '0.0% alcohol',
  'de-alcoholised',
  'dealcoholised',
  'de-alcoholized',
  'dealcoholized',
  'ginger beer',
  'root beer',
  'ginger ale',
] as const;

/** Founder-approved alcoholic name terms (exact strings, longest first). */
const ALCOHOLIC_NAME_TERMS = [
  'india pale ale',
  'cabernet sauvignon',
  'cabernet franc',
  'sauvignon blanc',
  'pinot grigio',
  'pinot noir',
  'pinot gris',
  'chenin blanc',
  'port wine',
  'fortified wine',
  'sparkling wine',
  'hard iced tea',
  'hard lemonade',
  'hard kombucha',
  'hard seltzer',
  'hard soda',
  'pale ale',
  'wheat beer',
  'eau de vie',
  'gewurztraminer',
  'gewürztraminer',
  'alcoholic',
  'alcopop',
  'armagnac',
  'absinthe',
  'aquavit',
  'akvavit',
  'cachaça',
  'cachaca',
  'calvados',
  'champagne',
  'prosecco',
  'shochu',
  'schnapps',
  'sangiovese',
  'sangria',
  'sémillon',
  'semillon',
  'tempranillo',
  'verdelho',
  'vermouth',
  'zinfandel',
  'bourbon',
  'brandy',
  'cognac',
  'grappa',
  'liquor',
  'liquors',
  'liqor',
  'liqour',
  'liqeuer',
  'liqueur',
  'liqueurs',
  'madeira',
  'marsala',
  'merlot',
  'moscato',
  'muscat',
  'nebbiolo',
  'pilsner',
  'shiraz',
  'syrah',
  'tequila',
  'viognier',
  'whiskey',
  'whisky',
  'baijiu',
  'chardonnay',
  'grenache',
  'lager',
  'malbec',
  'mezcal',
  'pastis',
  'perry',
  'pils',
  'pisco',
  'porter',
  'riesling',
  'sherry',
  'stout',
  'durif',
  'cider',
  'wine',
  'beer',
  'ouzo',
  'raki',
  'rakia',
  'sake',
  'soju',
  'ale',
  'cava',
  'gin',
  'ipa',
  'rum',
  'vodka',
  'mead',
] as const;

function normalizeProductName(product: {
  product_name?: string | null;
  product_name_en?: string | null;
}): string {
  return (product.product_name || product.product_name_en || '').trim().toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Whole-phrase / whole-term match with non-alphanumeric boundaries. */
function nameContainsTerm(name: string, term: string): boolean {
  if (!name || !term) return false;
  const escaped = escapeRegExp(term.toLowerCase()).replace(/\s+/g, '\\s+');
  const re = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i');
  return re.test(name);
}

function readPositiveAlcoholNutriment(nutriments: Record<string, unknown> | undefined): number | null {
  if (!nutriments) return null;
  const raw = nutriments['alcohol_100g'] ?? nutriments['alcohol'];
  if (raw === undefined || raw === null) return null;
  const value = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(value)) return null;
  return value;
}

function classifyFromCategoryTags(categories: string[]): boolean | null {
  const hasNonAlcoholicRoot = categories.includes(NON_ALCOHOLIC_CATEGORY_ROOT);
  const hasAlcoholicRoot = categories.includes(ALCOHOLIC_CATEGORY_ROOT);
  if (hasNonAlcoholicRoot && hasAlcoholicRoot) return false;
  if (hasNonAlcoholicRoot) return false;
  if (hasAlcoholicRoot) return true;
  return null;
}

function classifyFromProductName(name: string): boolean {
  for (const phrase of NON_ALCOHOLIC_NAME_PHRASES) {
    if (nameContainsTerm(name, phrase)) return false;
  }
  for (const term of ALCOHOLIC_NAME_TERMS) {
    if (nameContainsTerm(name, term)) return true;
  }
  return false;
}

export function isAlcoholicProduct(product: {
  categories_tags?: string[] | null;
  nutriments?: Record<string, unknown> | null;
  product_name?: string | null;
  product_name_en?: string | null;
}): boolean {
  const categories = product.categories_tags ?? [];
  const categoryResult = classifyFromCategoryTags(categories);
  if (categoryResult !== null) return categoryResult;

  const alcoholNutriment = readPositiveAlcoholNutriment(product.nutriments ?? undefined);
  if (alcoholNutriment !== null && alcoholNutriment > 0) return true;

  const name = normalizeProductName(product);
  if (!name) return false;
  return classifyFromProductName(name);
}
