// Unit tests for TruScore calculation engine
import { calculateTruScore } from '../../../lib/truscoreEngine';
import { Product } from '../../../types/product';

describe('TruScore Engine', () => {
  const baseProduct: Product = {
    code: '1234567890123',
    product_name: 'Test Product',
    source: 'openfoodfacts', // Use valid source type for tests
  };

  describe('Bounds Checking', () => {
    it('should return score between 0 and 100', () => {
      const result = calculateTruScore(baseProduct);
      expect(result.truscore).toBeGreaterThanOrEqual(0);
      expect(result.truscore).toBeLessThanOrEqual(100);
    });

    it('should return pillar scores between 0 and 25', () => {
      const result = calculateTruScore(baseProduct);
      expect(result.breakdown.Body).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.Body).toBeLessThanOrEqual(25);
      expect(result.breakdown.Planet).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.Planet).toBeLessThanOrEqual(25);
      expect(result.breakdown.Care).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.Care).toBeLessThanOrEqual(25);
      expect(result.breakdown.Open).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.Open).toBeLessThanOrEqual(25);
    });
  });

  describe('Input Validation', () => {
    it('should handle null product', () => {
      const result = calculateTruScore(null);
      expect(result.truscore).toBe(0);
      expect(result.breakdown.Body).toBe(0);
    });

    it('should handle undefined product', () => {
      const result = calculateTruScore(undefined);
      expect(result.truscore).toBe(0);
    });

    it('should handle product with Nutri-Score A', () => {
      const product: Product = {
        ...baseProduct,
        nutriscore_grade: 'a',
      };
      const result = calculateTruScore(product);
      expect(result.truscore).toBeGreaterThan(0);
      expect(result.hasNutriScore).toBe(true);
    });

    it('should handle product with many additives', () => {
      const product: Product = {
        ...baseProduct,
        additives_tags: Array(20).fill('en:e412'),
      };
      const result = calculateTruScore(product);
      // Should have penalty for additives (capped at 15)
      expect(result.breakdown.Body).toBeLessThan(25);
    });
  });

  describe('Edge Cases', () => {
    it('should handle product with no data', () => {
      const product: Product = {
        code: '1234567890123',
        source: 'openfoodfacts', // Use valid source type for tests
      };
      const result = calculateTruScore(product);
      expect(result.truscore).toBeGreaterThanOrEqual(0);
    });

    it('should handle product with all negative factors', () => {
      const product: Product = {
        ...baseProduct,
        additives_tags: Array(20).fill('en:e412'),
        ingredients_analysis_tags: ['en:palm-oil', 'en:irritant'],
        nova_group: 4,
      };
      const result = calculateTruScore(product);
      expect(result.truscore).toBeGreaterThanOrEqual(0);
      expect(result.truscore).toBeLessThan(50); // Should be low
    });
  });
});

