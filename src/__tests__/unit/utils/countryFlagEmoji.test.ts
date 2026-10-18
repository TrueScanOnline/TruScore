import { countryFlagEmoji } from '../../../utils/countryFlagEmoji';
import { COUNTRIES } from '../../../utils/countries';

describe('country flag emoji', () => {
  it('uses the flag stored for that country name', () => {
    expect(countryFlagEmoji('Australia')).toBe('🇦🇺');
    expect(countryFlagEmoji('Bangladesh')).toBe(COUNTRIES.find((country) => country.name === 'Bangladesh')?.flag);
    expect(countryFlagEmoji('USA')).toBe('🇺🇸');
    expect(countryFlagEmoji('not a country')).toBe('🌍');
  });
});