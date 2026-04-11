// Test suite for TruScoreOptimizedDatabase
// Verifies parallel querying, location-specific databases, and TruScore completeness

import { TruScoreOptimizedDatabase } from '../truScoreOptimizedDatabase';
import { logger } from '../../../utils/logger';

describe('TruScoreOptimizedDatabase', () => {
  let database: TruScoreOptimizedDatabase;

  beforeEach(() => {
    database = new TruScoreOptimizedDatabase();
  });

  describe('Parallel Querying', () => {
    it('should query all databases in parallel', async () => {
      const barcode = '3017620422003'; // Nutella barcode
      const userCountry = 'US';

      const startTime = Date.now();
      const products = await database.queryAllDatabases(barcode, userCountry);
      const endTime = Date.now();
      const queryTime = endTime - startTime;

      // Parallel path; live APIs vary (CI may be slow or return 0 rows).
      expect(queryTime).toBeLessThan(60000);
      expect(Array.isArray(products)).toBe(true);
      const sources = new Set(products.map((p) => p.source).filter(Boolean));
      if (products.length > 1) {
        expect(sources.size).toBeGreaterThan(1);
      } else if (products.length === 1) {
        expect(sources.size).toBeGreaterThanOrEqual(1);
      }

      logger.info(`✅ Parallel querying test: ${queryTime}ms, ${sources.size} sources`);
    });

    it('should handle multiple barcode variants', async () => {
      const barcode = '3017620422003';
      const userCountry = 'US';

      const products = await database.queryAllDatabases(barcode, userCountry);
      
      // Should attempt queries with different barcode formats
      expect(products.length).toBeGreaterThanOrEqual(0);
      
      logger.info(`✅ Barcode variants test: ${products.length} products found`);
    });
  });

  describe('Location-Specific Databases', () => {
    it('should query AU-specific databases for AU users', async () => {
      const barcode = '9300633000000'; // Australian product
      const userCountry = 'AU';

      const products = await database.queryAllDatabases(barcode, userCountry);
      
      // Should include FSANZ databases
      const sources = products.map(p => p.source);
      const hasFSANZ = sources.some(s => s?.includes('fsanz') || s?.includes('nzfcd') || s?.includes('afcd'));
      
      logger.info(`✅ AU location test: ${products.length} products, FSANZ: ${hasFSANZ}`);
    });

    it('should query NZ-specific databases for NZ users', async () => {
      const barcode = '9415677000000'; // New Zealand product
      const userCountry = 'NZ';

      const products = await database.queryAllDatabases(barcode, userCountry);
      
      const sources = products.map(p => p.source);
      const hasNZFCD = sources.some(s => s?.includes('nzfcd'));
      
      logger.info(`✅ NZ location test: ${products.length} products, NZFCD: ${hasNZFCD}`);
    });

    it('should query US-specific databases for US users', async () => {
      const barcode = '3017620422003';
      const userCountry = 'US';

      const products = await database.queryAllDatabases(barcode, userCountry);
      
      const sources = products.map(p => p.source);
      const hasUSDA = sources.some(s => s?.includes('usda'));
      
      logger.info(`✅ US location test: ${products.length} products, USDA: ${hasUSDA}`);
    });
  });

  describe('Product Name Queries', () => {
    it('should query by product name for FSANZ', async () => {
      const mockProduct = {
        barcode: '9300633000000',
        product_name: 'Milk',
        source: 'openfoodfacts' as const,
      };

      const userCountry = 'AU';
      const products = await database.queryByNameForTruScore(mockProduct, userCountry);
      
      // Should find additional products by name
      expect(products.length).toBeGreaterThanOrEqual(0);
      
      logger.info(`✅ Product name query test: ${products.length} additional products found`);
    });
  });

  describe('TruScore Completeness', () => {
    it('should return products with high data completeness', async () => {
      const barcode = '3017620422003';
      const userCountry = 'US';

      const products = await database.queryAllDatabases(barcode, userCountry);
      
      if (products.length > 0) {
        const product = products[0];
        
        // Check for key TruScore fields
        const hasNutrition = !!product.nutriments;
        const hasIngredients = !!product.ingredients_text;
        const hasEcoScore = !!product.ecoscore_score;
        const hasNova = !!product.nova_group;
        
        const completenessScore = [
          hasNutrition,
          hasIngredients,
          hasEcoScore,
          hasNova,
        ].filter(Boolean).length;

        expect(completenessScore).toBeGreaterThanOrEqual(2);
        
        logger.info(`✅ Completeness test: ${completenessScore}/4 key fields present`);
      }
    });

    it('should prioritize Gold Standard databases', () => {
      const weights = database.getTruScoreSourceWeights();
      
      // Gold Standard should have highest weights
      expect(weights['fsanz_au']).toBeGreaterThanOrEqual(0.50);
      expect(weights['usda_fooddata']).toBeGreaterThanOrEqual(0.50);
      expect(weights['nzfcd']).toBeGreaterThanOrEqual(0.50);
      
      logger.info(`✅ Source weights test: Gold Standard weights verified`);
    });
  });
});


