import { productOriginsCardPresentation } from '../../../origins/productOriginsCard';
import type { GovernedOriginFact } from '../../../origins/governedFacts';
import type { Product } from '../../../types/product';
import * as fs from 'fs';
import * as path from 'path';

const madeIn = (country: string): GovernedOriginFact => ({
  evidenceId: `made-${country}`,
  subjectKey: 'made_in',
  claimType: 'made_in',
  countries: [country],
  exactWording: `Made in ${country}`,
  confidence: 'limited',
});

const packedIn = (country: string): GovernedOriginFact => ({
  evidenceId: `packed-${country}`,
  subjectKey: 'packed_in',
  claimType: 'packed_in',
  countries: [country],
  exactWording: `Packed in ${country}`,
  confidence: 'limited',
});

function product(extra: Partial<Product> = {}): Product {
  return { barcode: '9300673555555', ...extra } as Product;
}

describe('Product Origins Result presentation', () => {
  test('normalises recognised OFF country tags before display', () => {
    expect(
      productOriginsCardPresentation(product({ manufacturing_places_tags: ['en:australia'] })).offCountry
    ).toBe('Australia');
    expect(productOriginsCardPresentation(product({ manufacturing_places: 'new-zealand' })).offCountry).toBe(
      'New Zealand'
    );
    expect(
      productOriginsCardPresentation(product({ origins_tags: ['en:not-a-real-country'] })).offCountry
    ).toBeNull();
  });

  test('shows OFF country when no governed origin displaces it', () => {
    const card = productOriginsCardPresentation(product({ manufacturing_places: 'New Zealand' }));
    expect(card.offCountry).toBe('New Zealand');
    expect(card.facts).toEqual([]);
    expect(card.limitedConfidence).toBe(false);
  });

  test('shows governed user evidence and Limited confidence when OFF has no origin', () => {
    const card = productOriginsCardPresentation(
      product({ rveelGovernedOrigins: [madeIn('Australia')] })
    );
    expect(card.offCountry).toBeNull();
    expect(card.facts.map((fact) => fact.countries)).toEqual([['Australia']]);
    expect(card.limitedConfidence).toBe(true);
  });

  test('drops conflicting OFF manufacturing country and keeps a compatible distinct fact', () => {
    const conflict = productOriginsCardPresentation(
      product({
        manufacturing_places: 'Australia',
        rveelGovernedOrigins: [madeIn('New Zealand')],
      })
    );
    expect(conflict.offCountry).toBeNull();
    expect(conflict.facts[0]?.countries).toEqual(['New Zealand']);
    expect(conflict.limitedConfidence).toBe(true);

    const compatible = productOriginsCardPresentation(
      product({
        manufacturing_places: 'New Zealand',
        rveelGovernedOrigins: [packedIn('Australia')],
      })
    );
    expect(compatible.offCountry).toBe('New Zealand');
    expect(compatible.facts.map((fact) => fact.claimType)).toEqual(['packed_in']);
    expect(compatible.limitedConfidence).toBe(true);
  });

  test('Result no longer exposes the retired contribution routes or the inert certification prompt', () => {
    const result = fs.readFileSync(path.join(__dirname, '../../../../app/result/[barcode].tsx'), 'utf8');
    expect(result).not.toContain('handleEditProduct');
    expect(result).not.toContain('ManufacturingCountryModal');
    expect(result).not.toContain('userContributedCountry');
    expect(result).not.toContain('Tap this card to add labels');
    expect(result).not.toContain('accessibilityLabel={t(\'common.edit\', \'Edit\')}');
    expect(result).toContain('productOriginsCardPresentation');
    expect(result).toContain('CountryFlag');
    expect(result).toContain('Limited confidence');
    expect(fs.existsSync(path.join(__dirname, '../../../components/ManufacturingCountryModal.tsx'))).toBe(false);
    expect(fs.existsSync(path.join(__dirname, '../../../features/product/cards/ProductCards.tsx'))).toBe(false);
    expect(fs.existsSync(path.join(__dirname, '../../../features/product/cards/CountryCard/CountryCard.tsx'))).toBe(false);
  });
});
