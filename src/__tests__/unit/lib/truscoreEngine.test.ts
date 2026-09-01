/**
 * Unit tests for TruScore calculation engine
 * 
 * Tests the core TruScore calculation logic with various product scenarios.
 */

import { calculateTruScore } from '../../../lib/truscoreEngine';
import { Product } from '../../../types/product';

describe('TruScore Engine', () => {
  describe('calculateTruScore', () => {
    it('should return unavailable (null) for null product — not Overall 0', () => {
      const result = calculateTruScore(null);
      expect(result.truscore).toBeNull();
      expect(result.scoringUnavailable).toBe(true);
      expect(result.breakdown.Body).toBeNull();
      expect(result.breakdown.Planet).toBeNull();
      expect(result.breakdown.Ethics).toBeNull();
      expect(result.breakdown.Open).toBeNull();
    });

    it('should calculate score for product with Nutri-Score A', () => {
      const product: Product = {
        barcode: '1234567890123',
        product_name: 'Test Product',
        nutriscore_grade: 'a',
        nutriscore_score: 1,
      };

      const result = calculateTruScore(product);
      expect(result.truscore).toBeGreaterThan(0);
      expect(result.breakdown.Body).toBe(22); // Nutri-Score A → pillar value 22/25 (spec)
      expect(result.hasNutriScore).toBe(true);
    });

    it('should calculate score for product with Eco-Score A', () => {
      const product: Product = {
        barcode: '1234567890123',
        product_name: 'Test Product',
        ecoscore_grade: 'a',
        ecoscore_score: 100,
      };

      const result = calculateTruScore(product);
      expect(result.truscore).toBeGreaterThan(0);
      expect(result.breakdown.Planet).toBe(22); // Eco-Score A → +7 from base 15 (spec)
      expect(result.hasEcoScore).toBe(true);
    });

    it('Planet v19: palm does not reduce Planet when Eco-Score is present', () => {
      const product: Product = {
        barcode: '1234567890123',
        product_name: 'Test Product',
        ecoscore_grade: 'a',
        palm_oil_analysis: {
          containsPalmOil: true,
          isPalmOilFree: false,
          isNonSustainable: true,
          isCertifiedSustainable: false,
        },
      };

      const result = calculateTruScore(product);
      expect(result.breakdown.Planet).toBe(22);
      expect(result.pillarDetails?.planet.details.palmOilPlanetAdjustment).toBe(0);
    });

    it('should apply additive penalties', () => {
      const product: Product = {
        barcode: '1234567890123',
        product_name: 'Test Product',
        additives_tags: ['en:e100', 'en:e200', 'en:e300'],
      };

      const result = calculateTruScore(product);
      expect(result.breakdown.Body).toBeLessThan(25); // Should have penalties
    });

    it('should apply NOVA group penalties', () => {
      const product: Product = {
        barcode: '1234567890123',
        product_name: 'Test Product',
        nova_group: 4, // Ultra-processed
      };

      const result = calculateTruScore(product);
      expect(result.breakdown.Body).toBeLessThan(15); // Should have -8 penalty
    });

    it('should apply certification bonuses', () => {
      const product: Product = {
        barcode: '1234567890123',
        product_name: 'Test Product',
        labels_tags: ['en:organic', 'en:fair-trade'],
      };

      const result = calculateTruScore(product);
      expect(result.breakdown.Ethics).toBeGreaterThan(15); // Should have bonuses
    });

    it('should handle missing ingredients (Open v15 neutral — no penalty)', () => {
      const product: Product = {
        barcode: '1234567890123',
        product_name: 'Test Product',
        // No ingredients_text
      };

      const result = calculateTruScore(product);
      expect(result.breakdown.Open).toBe(15);
    });

    it('should handle governed vague-term flags penalty', () => {
      const product: Product = {
        barcode: '1234567890123',
        product_name: 'Test Product',
        ingredients_text: 'Water, sugar, natural flavor, aroma',
      };

      const result = calculateTruScore(product);
      expect(result.breakdown.Open).toBeLessThan(15);
    });

    it('should calculate complete score for full product', () => {
      const product: Product = {
        barcode: '1234567890123',
        product_name: 'Organic Test Product',
        nutriscore_grade: 'a',
        ecoscore_grade: 'a',
        ingredients_text: 'Organic ingredients, water, salt',
        labels_tags: ['en:organic'],
        origins_tags: ['en:france'],
        nova_group: 1,
      };

      const result = calculateTruScore(product);
      expect(result.truscore).toBeGreaterThan(60); // Should be a good score
      expect(result.breakdown.Body).toBeGreaterThan(20);
      expect(result.breakdown.Planet).toBeGreaterThan(20);
      expect(result.breakdown.Ethics).toBeGreaterThanOrEqual(17);
      expect(result.breakdown.Open).toBeGreaterThan(15);
    });
  });
});
