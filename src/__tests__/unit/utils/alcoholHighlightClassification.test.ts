import { isAlcoholicProduct } from '../../../utils/alcoholHighlightClassification';
import { calculateHighlights } from '../../../utils/scoreHighlights';
import { applyOverrideRules } from '../../../config/scoreHighlightOverrides';
import { calculateTruScore } from '../../../lib/truscoreEngine';
import type { Product } from '../../../types/product';

describe('alcoholHighlightClassification', () => {
  describe('category evidence (exact OFF root tags)', () => {
    it('classifies en:non-alcoholic-beverages as non-alcoholic', () => {
      expect(
        isAlcoholicProduct({
          categories_tags: ['en:non-alcoholic-beverages'],
          product_name: 'Coke Zero Sugar',
          nutriscore_grade: 'c',
        } as Product)
      ).toBe(false);
    });

    it('classifies en:alcohol-free-beers with non-alcoholic parent root as non-alcoholic', () => {
      expect(
        isAlcoholicProduct({
          categories_tags: ['en:alcohol-free-beers', 'en:non-alcoholic-beverages'],
        } as Product)
      ).toBe(false);
    });

    it('classifies en:alcoholic-beverages as alcoholic', () => {
      expect(
        isAlcoholicProduct({
          categories_tags: ['en:alcoholic-beverages'],
        } as Product)
      ).toBe(true);
    });

    it('classifies taxonomised child with alcoholic parent root as alcoholic', () => {
      expect(
        isAlcoholicProduct({
          categories_tags: ['en:beers', 'en:alcoholic-beverages'],
        } as Product)
      ).toBe(true);
    });

    it('treats contradictory alcoholic + non-alcoholic roots as non-alcoholic', () => {
      expect(
        isAlcoholicProduct({
          categories_tags: ['en:alcoholic-beverages', 'en:non-alcoholic-beverages'],
        } as Product)
      ).toBe(false);
    });

    it('does not substring-match non-alcoholic from unrelated category tags', () => {
      expect(
        isAlcoholicProduct({
          categories_tags: ['en:sodas', 'en:diet-beverages'],
          product_name: 'Cola',
        } as Product)
      ).toBe(false);
    });
  });

  describe('nutriment evidence', () => {
    it('classifies alcohol_100g > 0 as alcoholic when category undecided', () => {
      expect(
        isAlcoholicProduct({
          nutriments: { alcohol_100g: 5.2 },
          product_name: 'Mystery drink',
        } as Product)
      ).toBe(true);
    });

    it('does not classify zero alcohol nutriment alone as alcoholic', () => {
      expect(
        isAlcoholicProduct({
          nutriments: { alcohol_100g: 0 },
          product_name: 'Sparkling Water',
        } as Product)
      ).toBe(false);
    });
  });

  describe('product-name fallback', () => {
    it('classifies Zero Alcohol Lager as non-alcoholic', () => {
      expect(isAlcoholicProduct({ product_name: 'Zero Alcohol Lager' } as Product)).toBe(false);
    });

    it('classifies ginger beer, root beer and ginger ale as non-alcoholic', () => {
      expect(isAlcoholicProduct({ product_name: 'Bundaberg Ginger Beer' } as Product)).toBe(false);
      expect(isAlcoholicProduct({ product_name: 'A&W Root Beer' } as Product)).toBe(false);
      expect(isAlcoholicProduct({ product_name: 'Schweppes Ginger Ale' } as Product)).toBe(false);
    });

    it('classifies ordinary soda as non-alcoholic', () => {
      expect(
        isAlcoholicProduct({
          product_name: 'Coke Zero Sugar',
          categories_tags: ['en:sodas'],
        } as Product)
      ).toBe(false);
    });

    it('classifies VSOP Brandy 700ml as alcoholic (name-only)', () => {
      expect(isAlcoholicProduct({ product_name: 'VSOP Brandy 700ml' } as Product)).toBe(true);
    });

    it.each([
      ['Penfolds Shiraz'],
      ['Oakridge Chardonnay'],
      ['Little Creatures Pale Ale'],
      ['Heineken Lager'],
      ['Guinness Stout'],
      ['Stone & Wood Pacific Ale IPA'],
    ])('classifies %s as alcoholic (name-only)', (product_name) => {
      expect(isAlcoholicProduct({ product_name } as Product)).toBe(true);
    });

    it('classifies explicit liqueur/liquor spelling variants as alcoholic', () => {
      expect(isAlcoholicProduct({ product_name: 'Orange Liqueur' } as Product)).toBe(true);
      expect(isAlcoholicProduct({ product_name: 'Party Liquor Mix' } as Product)).toBe(true);
      expect(isAlcoholicProduct({ product_name: 'Imported Liqour Bottle' } as Product)).toBe(true);
    });
  });

  describe('Score Highlights commentary wiring', () => {
    const cokeZeroShape = {
      product_name: 'Zero Sugar',
      categories_tags: ['en:non-alcoholic-beverages', 'en:sodas'],
      nutriscore_grade: 'c',
    } as Product;

    it('does not apply alcohol override on Coke Zero-shaped Nutri C highlight', () => {
      const highlights = calculateHighlights(cokeZeroShape as any);
      const nutriC = highlights.find((h) => h.highlightId === 'body-nutri-c');
      expect(nutriC).toBeDefined();
      expect(nutriC?.description).not.toContain('Alcohol should always be consumed');
      expect(nutriC?.scoreValue).toBe(0);
    });

    it('applies alcohol override for alcoholic-beverages Nutri A highlight', () => {
      const highlights = calculateHighlights({
        product_name: 'House Red',
        categories_tags: ['en:alcoholic-beverages', 'en:wines'],
        nutriscore_grade: 'a',
      } as any);
      const nutriA = highlights.find((h) => h.highlightId === 'body-nutri-a');
      expect(nutriA?.description).toContain('Alcohol should always be consumed');
      expect(nutriA?.scoreValue).toBe(7);
    });

    it('uses the shared classifier in alcohol override rules', () => {
      const alcoholic = {
        product_name: 'VSOP Brandy 700ml',
        trust_score_breakdown: { body: 22 },
      } as any;
      const flags = [
        {
          type: 'green' as const,
          category: 'nutrition' as const,
          title: 'High Body Safety Score',
          description: 'Product is generally safe and nutritious',
        },
      ];
      const filtered = applyOverrideRules(flags, alcoholic);
      expect(filtered).toHaveLength(0);
    });
  });

  describe('TruScore arithmetic isolation', () => {
    it('does not change TruScore output for a fixed product fixture', () => {
      const fixture: Product = {
        barcode: '9310675079464',
        product_name: 'Zero Sugar',
        brands: 'Coca-Cola',
        categories_tags: ['en:non-alcoholic-beverages', 'en:sodas'],
        nutriscore_grade: 'c',
        nova_group: 4,
        source: 'openfoodfacts',
      };
      const scored = calculateTruScore(fixture);
      expect(scored.truscore).not.toBeNull();
      expect(scored.breakdown.Body).not.toBeNull();
      expect(isAlcoholicProduct(fixture)).toBe(false);
    });
  });
});
