import { sanitizeCountryForDisplay } from '../../../utils/countryDisplayName';

describe('sanitizeCountryForDisplay', () => {
  it('returns first line only', () => {
    expect(sanitizeCountryForDisplay('New Zealand\n1765571546316')).toBe('New Zealand');
  });

  it('strips spaced dash suffix', () => {
    expect(sanitizeCountryForDisplay('New Zealand – Real Test')).toBe('New Zealand');
    expect(sanitizeCountryForDisplay('New Zealand - Real Test')).toBe('New Zealand');
  });

  it('removes trailing long numeric token on same line', () => {
    expect(sanitizeCountryForDisplay('New Zealand 1765571546316')).toBe('New Zealand');
  });

  it('combines newline and dash junk', () => {
    expect(sanitizeCountryForDisplay('New Zealand – Real Test\n1765571546316')).toBe('New Zealand');
  });

  it('preserves hyphenated country names without spaced dash', () => {
    expect(sanitizeCountryForDisplay('Timor-Leste')).toBe('Timor-Leste');
  });
});
