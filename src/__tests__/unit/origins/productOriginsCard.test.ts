import {
  originConsumerContinuationSentence,
  productOriginsCardPresentation,
  projectOriginConsumerLines,
  splitOriginContinuationForEmphasis,
} from '../../../origins/productOriginsCard';
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

  test('a made_in contribution is the current manufacturing subject, including the same country', () => {
    const same = productOriginsCardPresentation(
      product({
        manufacturing_places: 'Australia',
        rveelGovernedOrigins: [madeIn('Australia')],
      })
    );
    expect(same.offCountry).toBeNull();
    expect(projectOriginConsumerLines([{
      ...same.facts[0],
      percentage: 99,
      percentageQualifier: 'at_least',
      exactWording: 'Made in Australia from at least 99% Australian ingredients',
    }])).toEqual([
      {
        key: 'made-Australia:made_in:Australia',
        primary: '🇦🇺 Made in Australia',
        supporting: ['at least 99%'],
        country: 'Australia',
        statement: 'Made in',
        packWording: 'Made in Australia from at least 99% Australian ingredients',
      },
    ]);
    expect(same.facts[0]?.exactWording).toBe('Made in Australia');
  });

  test('each origin entry keeps its own ingredient choice, including a second country', () => {
    const lines = projectOriginConsumerLines([
      {
        ...packedIn('Serbia'),
        countries: ['Serbia', 'Fiji'],
        originQualifications: ['imported'],
        percentage: 40,
        percentageQualifier: 'at_least',
      },
      {
        ...madeIn('Australia'),
        originQualifications: ['local'],
      },
    ]);
    expect(lines.map((line) => line.country)).toEqual(['Serbia', 'Fiji', 'Australia']);
    expect(lines[0]?.supporting).toEqual([
      'at least 40%',
      'Imported ingredients',
      'Imported ingredient origins not specified',
    ]);
    expect(lines[1]?.supporting).toEqual(lines[0]?.supporting);
    expect(lines[2]?.supporting).toEqual(['Local ingredients']);
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

  test('formats existing supporting phrases as a natural continuation without inventing values', () => {
    expect(
      originConsumerContinuationSentence(['at least 98%', 'Local & Imported ingredients'])
    ).toBe('With at least 98% local and imported ingredients.');
    expect(originConsumerContinuationSentence(['more than 79%', 'Local ingredients'])).toBe(
      'With more than 79% local ingredients.'
    );
    expect(
      originConsumerContinuationSentence([
        'at least 40%',
        'Imported ingredients',
        'Imported ingredient origins not specified',
      ])
    ).toBe('With at least 40% imported ingredients. Imported ingredient origins not specified.');
    expect(originConsumerContinuationSentence([])).toBeNull();
  });

  test('Result no longer exposes the retired contribution routes or the inert certification prompt', () => {
    const result = fs.readFileSync(path.join(__dirname, '../../../../app/result/[barcode].tsx'), 'utf8');
    expect(result).not.toContain('handleEditProduct');
    expect(result).not.toContain('ManufacturingCountryModal');
    expect(result).not.toContain('userContributedCountry');
    expect(result).not.toContain('Tap this card to add labels');
    expect(result).not.toContain('accessibilityLabel={t(\'common.edit\', \'Edit\')}');
    expect(result).toContain('productOriginsCardPresentation');
    expect(result).toContain('originConsumerContinuationSentence');
    expect(result).toContain('ProductOriginsDeclarationPanel');
    // OFF-only and declaration lines both use the V2 panel (no flat originHero shell).
    expect(result).toContain('originsCard.offCountry');
    expect(result).toContain('flagAlign="center"');
    expect(result).not.toContain('originHero');
    expect(result).toContain('Limited confidence');
    expect(result).toContain('PRODUCT_ORIGINS_LIMITED_CONFIDENCE');
    expect(result).not.toContain('transparency.s26?.explanation');
    expect(fs.existsSync(path.join(__dirname, '../../../components/ManufacturingCountryModal.tsx'))).toBe(false);
    expect(fs.existsSync(path.join(__dirname, '../../../features/product/cards/ProductCards.tsx'))).toBe(false);
    expect(fs.existsSync(path.join(__dirname, '../../../features/product/cards/CountryCard/CountryCard.tsx'))).toBe(false);
    const panel = fs.readFileSync(
      path.join(__dirname, '../../../components/ProductOriginsDeclarationPanel.tsx'),
      'utf8'
    );
    expect(panel).toContain('align={flagAlign}');
    expect(panel).toContain('showRibbon');
    expect(panel).toContain('CountryFlag');
    expect(panel).toContain('splitOriginContinuationForEmphasis');
    expect(fs.readFileSync(path.join(__dirname, '../../../origins/productOriginsCard.ts'), 'utf8')).toContain(
      'export function splitOriginContinuationForEmphasis'
    );
  });
});

describe('Product Origins Concept V2 emphasis split', () => {
  test('emphasises existing percentage phrase without changing wording', () => {
    expect(
      splitOriginContinuationForEmphasis(
        'With more than 78% local and imported ingredients. Imported ingredient origins not specified.'
      )
    ).toEqual({
      prefix: 'With ',
      emphasis: 'more than 78%',
      suffix: ' local and imported ingredients. Imported ingredient origins not specified.',
    });
    expect(splitOriginContinuationForEmphasis('With local ingredients.')).toEqual({
      prefix: 'With local ingredients.',
      emphasis: null,
      suffix: '',
    });
  });
});
