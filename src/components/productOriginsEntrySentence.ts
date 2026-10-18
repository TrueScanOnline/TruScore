/**
 * Live reading of the Product Origins entry form.
 * This repeats the choices already on the form. It is not saved.
 */

export type ProductOriginsEntrySentenceInput = {
  claimType: 'grown_in' | 'produced_in' | 'made_in' | 'packed_in' | 'ingredient_origin' | null;
  countries: string[];
  percentage: string;
  percentageNotStated: boolean;
  qualifier?: 'at_least' | 'exactly' | 'more_than' | 'less_than';
  local: boolean;
  imported: boolean;
};

const STATEMENT: Record<NonNullable<ProductOriginsEntrySentenceInput['claimType']>, string> = {
  grown_in: 'grown in',
  produced_in: 'a product of',
  made_in: 'made in',
  packed_in: 'packed in',
  ingredient_origin: 'made with ingredients from',
};

const QUALIFIER: Record<NonNullable<ProductOriginsEntrySentenceInput['qualifier']>, string> = {
  at_least: 'at least',
  exactly: 'exactly',
  more_than: 'more than',
  less_than: 'less than',
};

function countryList(countries: string[]): string {
  const names = countries.map((country) => country.trim()).filter((country) => country.length > 0);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** A reading of the current choices. Missing choices stay as an ellipsis. */
export function productOriginsEntrySentence(input: ProductOriginsEntrySentenceInput): string {
  const phrase = input.claimType ? STATEMENT[input.claimType] : '';
  const country = countryList(input.countries);
  const head = phrase ? `This product was ${phrase} ${country || '…'}` : 'This product was …';
  const percent = input.percentage.trim();
  const showPercent = !input.percentageNotStated && percent.length > 0;
  const qualifier = showPercent && input.qualifier ? `${QUALIFIER[input.qualifier]} ` : '';
  const amount = showPercent ? `${qualifier}${percent}%` : '';
  const source =
    input.local && input.imported
      ? 'local and imported ingredients'
      : input.local
        ? 'local ingredients'
        : input.imported
          ? 'imported ingredients'
          : '';
  if (amount && source) return `${head} with ${amount} ${source}.`;
  if (amount) return `${head} with ${amount}.`;
  if (source) return `${head} with ${source}.`;
  return head.endsWith('…') ? head : `${head}.`;
}
