/**
 * Unit tests for TruScore calculation engine
 * 
 * Tests the core TruScore calculation logic with various product scenarios.
 */

import { calculateTruScore } from '../../../lib/truscoreEngine';
import { Product } from '../../../types/product';

describe('TruScore Engine', () => {
  describe('calculateTruScore', () => {
    it('should return 0 score for null product', () => {
      const result = calculateTruScore(null);
      expect(result.truscore).toBe(0);
      expect(result.breakdown.Body).toBe(0);
      expect(result.breakdown.Planet).toBe(0);
      expect(result.breakdown.Ethics).toBe(0);
      expect(result.breakdown.Open).toBe(0);
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

    it('should apply palm oil penalty', () => {
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
      expect(result.breakdown.Planet).toBeLessThan(25); // Should have penalty
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

    it('should handle missing ingredients (Open pillar penalty)', () => {
      const product: Product = {
        barcode: '1234567890123',
        product_name: 'Test Product',
        // No ingredients_text
      };

      const result = calculateTruScore(product);
      expect(result.breakdown.Open).toBeLessThan(15); // Should have penalty
    });

    it('should handle hidden terms penalty', () => {
      const product: Product = {
        barcode: '1234567890123',
        product_name: 'Test Product',
        ingredients_text: 'Water, sugar, parfum, fragrance, natural flavor',
      };

      const result = calculateTruScore(product);
      expect(result.breakdown.Open).toBeLessThan(15); // Should have penalty for hidden terms
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
