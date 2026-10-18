import fs from 'fs';
import path from 'path';
import { productOriginsEntrySentence } from '../../../components/productOriginsEntrySentence';

describe('product origins entry sentence', () => {
  const base = {
    claimType: 'made_in' as const,
    countries: ['Australia'],
    percentage: '30',
    percentageNotStated: false,
    qualifier: 'at_least' as const,
    local: true,
    imported: false,
  };

  it('reads one percentage with the selected statement, country, and source', () => {
    expect(productOriginsEntrySentence(base)).toBe(
      'This product was made in Australia with at least 30% local ingredients.'
    );
    expect(productOriginsEntrySentence({ ...base, local: true, imported: true })).toBe(
      'This product was made in Australia with at least 30% local and imported ingredients.'
    );
    expect(productOriginsEntrySentence({ ...base, claimType: 'produced_in', local: false, imported: false })).toBe(
      'This product was a product of Australia with at least 30%.'
    );
    expect(
      productOriginsEntrySentence({
        ...base,
        claimType: null,
        countries: [],
        percentage: '',
        local: false,
      })
    ).toBe('This product was …');
  });

  it('places the statement choices before the country, percentage, and pack wording', () => {
    const modal = fs.readFileSync(
      path.join(__dirname, '../../../components/PacketContributionModal.tsx'),
      'utf8'
    );
    const statement = modal.indexOf('statementTypes.map');
    const country = modal.indexOf('>Country<');
    const percentage = modal.indexOf('>Percentage<');
    const wording = modal.indexOf('What does the pack say?');
    expect(statement).toBeGreaterThan(-1);
    expect(statement).toBeLessThan(country);
    expect(country).toBeLessThan(percentage);
    expect(percentage).toBeLessThan(wording);
    expect(modal).not.toMatch(/PRODUCT_ORIGINS_CLAIM_TYPES\.map/);
  });
});
