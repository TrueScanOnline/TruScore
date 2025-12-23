// Comprehensive test suite for CSV Database Service
// Tests database reliability, query accuracy, and data integrity

import { getCSVDatabaseService, initializeCSVDatabases } from '../../../services/csvDatabases/csvDatabaseService';

describe('CSV Database Service', () => {
  beforeAll(async () => {
    await initializeCSVDatabases();
  });

  describe('EWG Dirty Dozen Database', () => {
    test('should find strawberries in dirty dozen', () => {
      const service = getCSVDatabaseService();
      const result = service.queryEWGDirtyDozen('strawberries');
      expect(result).not.toBeNull();
      expect(result?.crop).toBe('strawberries');
      expect(result?.rank).toBe(1);
      expect(service.isDirtyDozenCrop('strawberries')).toBe(true);
    });

    test('should find spinach in dirty dozen', () => {
      const service = getCSVDatabaseService();
      expect(service.isDirtyDozenCrop('spinach')).toBe(true);
    });

    test('should handle case-insensitive queries', () => {
      const service = getCSVDatabaseService();
      expect(service.isDirtyDozenCrop('STRAWBERRIES')).toBe(true);
      expect(service.isDirtyDozenCrop('Spinach')).toBe(true);
    });

    test('should return false for non-dirty dozen crops', () => {
      const service = getCSVDatabaseService();
      expect(service.isDirtyDozenCrop('bananas')).toBe(false);
      expect(service.isDirtyDozenCrop('oranges')).toBe(false);
    });
  });

  describe('RSPO Certified Database', () => {
    test('should find Unilever as RSPO certified', () => {
      const service = getCSVDatabaseService();
      expect(service.isRSPOCertified('unilever')).toBe(true);
      const result = service.queryRSPOCertified('unilever');
      expect(result).not.toBeNull();
      expect(result?.brand).toBe('unilever');
    });

    test('should find Nestle as RSPO certified', () => {
      const service = getCSVDatabaseService();
      expect(service.isRSPOCertified('nestle')).toBe(true);
    });

    test('should handle brand name variations', () => {
      const service = getCSVDatabaseService();
      expect(service.isRSPOCertified('Unilever')).toBe(true);
      expect(service.isRSPOCertified('UNILEVER')).toBe(true);
    });

    test('should return false for non-certified brands', () => {
      const service = getCSVDatabaseService();
      expect(service.isRSPOCertified('unknown-brand')).toBe(false);
      expect(service.isRSPOCertified('generic-company')).toBe(false);
    });
  });

  describe('Idemat Eco-Cost Database', () => {
    test('should identify aluminum as high eco-cost', () => {
      const service = getCSVDatabaseService();
      expect(service.isHighEcoCostMaterial('aluminum')).toBe(true);
      const result = service.queryIdematEcoCost('aluminum');
      expect(result).not.toBeNull();
      expect(Number(result?.ecoCost || 0)).toBeGreaterThanOrEqual(100);
    });

    test('should identify cardboard as low eco-cost', () => {
      const service = getCSVDatabaseService();
      expect(service.isHighEcoCostMaterial('cardboard')).toBe(false);
      const result = service.queryIdematEcoCost('cardboard');
      expect(result).not.toBeNull();
      expect(Number(result?.ecoCost || 0)).toBeLessThan(100);
    });
  });

  describe('FAO Crop Data Database', () => {
    test('should find rice with high water usage', () => {
      const service = getCSVDatabaseService();
      const result = service.queryFAOCropData('rice');
      expect(result).not.toBeNull();
      expect(result?.crop).toBe('rice');
      expect(Number(result?.waterUsage || 0)).toBeGreaterThan(0);
    });
  });

  describe('USDA PDP Database', () => {
    test('should find strawberries with high residue', () => {
      const service = getCSVDatabaseService();
      const result = service.queryUSDAPDP('strawberries');
      expect(result).not.toBeNull();
      expect(result?.crop).toBe('strawberries');
      expect(Number(result?.pesticideCount || 0)).toBeGreaterThan(0);
    });
  });

  describe('Farming Impact Detection', () => {
    test('should identify rice as high-impact (high water)', () => {
      const service = getCSVDatabaseService();
      expect(service.hasHighFarmingImpact('rice')).toBe(true);
    });

    test('should identify strawberries as high-impact (dirty dozen)', () => {
      const service = getCSVDatabaseService();
      expect(service.hasHighFarmingImpact('strawberries')).toBe(true);
    });

    test('should identify low-impact crops', () => {
      const service = getCSVDatabaseService();
      expect(service.hasHighFarmingImpact('potatoes')).toBe(false);
      expect(service.hasHighFarmingImpact('tomatoes')).toBe(false);
    });
  });

  describe('Agribalyse Fallback Database', () => {
    test('should identify beef as high carbon', () => {
      const service = getCSVDatabaseService();
      expect(service.hasHighCarbonFootprint('beef')).toBe(true);
      const result = service.queryAgribalyseFallback('beef');
      expect(result).not.toBeNull();
      expect(Number(result?.co2eq || 0)).toBeGreaterThanOrEqual(5);
    });

    test('should identify vegetables as low carbon', () => {
      const service = getCSVDatabaseService();
      expect(service.hasHighCarbonFootprint('vegetables')).toBe(false);
    });
  });
});











