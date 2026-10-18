/**
 * Flag glyph for a country name.
 * The country list is the source. A few common aliases stay readable.
 * Unknown countries use a globe.
 */
import { COUNTRIES } from './countries';

const FLAGS: Record<string, string> = {};
for (const country of COUNTRIES) {
  FLAGS[country.name.toUpperCase()] = country.flag;
}

const ALIASES: Record<string, string> = {
  USA: 'UNITED STATES',
  UK: 'UNITED KINGDOM',
  KOREA: 'SOUTH KOREA',
};

export function countryFlagEmoji(country: string): string {
  const key = country.trim().toUpperCase();
  if (!key) return '🌍';
  return FLAGS[ALIASES[key] || key] || '🌍';
}
