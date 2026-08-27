// Test suite for TruScoreOptimizedDatabase (Wave 2 demise compatibility surface)

import { TruScoreOptimizedDatabase } from '../truScoreOptimizedDatabase';
import { logger } from '../../../utils/logger';

describe('TruScoreOptimizedDatabase', () => {
  let database: TruScoreOptimizedDatabase;

  beforeEach(() => {
    database = new TruScoreOptimizedDatabase();
  });

  describe('queryAllDatabases (demised stub)', () => {
    it('returns empty array — multi-provider fan-out is not production-reachable', async () => {
      const products = await database.queryAllDatabases('3017620422003', 'US');
      expect(products).toEqual([]);
      logger.info('✅ queryAllDatabases demise stub: returns []');
    });

    it('returns empty array regardless of user country', async () => {
      for (const country of ['AU', 'NZ', 'US'] as const) {
        const products = await database.queryAllDatabases('9300633000000', country);
        expect(products).toEqual([]);
      }
      logger.info('✅ queryAllDatabases demise stub: country-independent []');
    });
  });

  describe('Source weights (compatibility)', () => {
    it('should prioritize Gold Standard databases', () => {
      const weights = database.getTruScoreSourceWeights();

      expect(weights['fsanz_au']).toBeGreaterThanOrEqual(0.50);
      expect(weights['usda_fooddata']).toBeGreaterThanOrEqual(0.50);
      expect(weights['nzfcd']).toBeGreaterThanOrEqual(0.50);

      logger.info('✅ Source weights test: Gold Standard weights verified');
    });
  });
});
