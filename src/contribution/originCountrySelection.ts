import { COUNTRIES, canonicalOriginCountryNames, type Country } from '../utils/countries';

/** Canonical country names already recognised by the Origins evidence model. */
export function governedOriginCountryNames(place: string): string[] {
  return canonicalOriginCountryNames(place);
}

function countryRecord(name: string): Country | null {
  return COUNTRIES.find((country) => country.name === name) ?? null;
}

/** One existing country-selector slot per governed country, plus any extra blank row. */
export function originCountrySlots(place: string, extraBlanks: number): Array<Country | null> {
  const selected = governedOriginCountryNames(place)
    .map((name) => countryRecord(name))
    .filter((country): country is Country => country != null);
  const slots: Array<Country | null> = [...selected];
  const blanks = selected.length === 0 ? 1 + extraBlanks : extraBlanks;
  for (let index = 0; index < blanks; index += 1) slots.push(null);
  return slots;
}

/** Serialise selector rows back into the existing comma-joined place field. */
export function placeFromCountrySlots(slots: Array<Country | null>): string {
  return governedOriginCountryNames(slots.map((country) => country?.name || '').join(', ')).join(', ');
}
