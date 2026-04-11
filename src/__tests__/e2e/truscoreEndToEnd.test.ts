/**
 * End-to-End TruScore Testing Suite
 * Tests the complete 4-pillar TruScore calculation with various product scenarios
 * 
 * This suite ensures:
 * 1. All 4 pillars are calculated correctly
 * 2. Scores match specification documents
 * 3. Edge cases are handled properly
 * 4. Platform compliance (Android/iOS)
 */

import { calculateTruScore, TruScoreResult } from '../../lib/truscoreEngine';
import { Product } from '../../types/product';

describe('TruScore End-to-End Tests', () => {
  
  describe('Test Case 1: High-Quality Organic Product (All Pillars Strong)', () => {
    const product: Product = {
      barcode: '1234567890123',
      product_name: 'Organic Fair Trade Coffee',
      brands: 'Marks & Spencer PLC', // BBFAW Tier 2 + Impact B
      labels_tags: [
        'en:organic',
        'en:fair-trade',
        'en:rainforest-alliance',
        'en:rspo',
      ],
      nutriscore_grade: 'a',
      ecoscore_grade: 'a',
      nova_group: 1,
      ingredients_text: 'Organic coffee beans, water. 100% organic ingredients.',
      origins: 'Colombia',
      packaging_tags: ['en:recyclable'],
      additives_tags: [],
      recalls: [],
    };

    test('should calculate high TruScore across all pillars', () => {
      const result = calculateTruScore(product);
      
      expect(result.truscore).toBeGreaterThanOrEqual(80);
      expect(result.breakdown.Body).toBeGreaterThanOrEqual(20);
      expect(result.breakdown.Planet).toBeGreaterThanOrEqual(20);
      expect(result.breakdown.Ethics).toBeGreaterThanOrEqual(20);
      // OPEN pillar may be 15 (base) if no special bonuses apply
      expect(result.breakdown.Open).toBeGreaterThanOrEqual(15);
      
      // Verify all pillars are within valid range
      expect(result.breakdown.Body).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.Body).toBeLessThanOrEqual(25);
      expect(result.breakdown.Planet).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.Planet).toBeLessThanOrEqual(25);
      expect(result.breakdown.Ethics).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.Ethics).toBeLessThanOrEqual(25);
      expect(result.breakdown.Open).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.Open).toBeLessThanOrEqual(25);
    });
  });

  describe('Test Case 2: Ethics Pillar - BBFAW Tier 6 (Tyson Foods)', () => {
    const product: Product = {
      barcode: '2345678901234',
      product_name: 'Test Product',
      brand_owner: 'Tyson Foods',
      brands: 'Tyson Foods',
      labels_tags: [],
      nutriscore_grade: 'b',
      ecoscore_grade: 'b',
      nova_group: 2,
      ingredients_text: 'Water, sugar, natural flavors.',
      origins: 'USA',
      additives_tags: [],
      recalls: [],
    };

    test('should apply BBFAW Tier 6 penalty in Ethics pillar', () => {
      const result = calculateTruScore(product);
      // Ethics: 15 - 6 (Tier 6) - 3 (Impact F) = 6
      expect(result.breakdown.Ethics).toBe(6);
      expect(result.truscore).toBeLessThan(100);
    });
  });

  describe('Test Case 3: Ethics Pillar - BBFAW Tier 5 (Nestlé SA)', () => {
    const product: Product = {
      barcode: '3456789012345',
      product_name: 'Chocolate Bar',
      brand_owner: 'Nestlé SA',
      brands: 'Nestlé',
      labels_tags: [],
      nutriscore_grade: 'c',
      ecoscore_grade: 'c',
      nova_group: 3,
      ingredients_text: 'Sugar, cocoa, milk.',
      origins: 'Switzerland',
      additives_tags: [],
      recalls: [],
    };

    test('should apply BBFAW Tier 5 + Impact F for Nestlé SA', () => {
      const result = calculateTruScore(product);
      // Ethics: 15 - 4 (Tier 5) - 3 (Impact F) = 8
      expect(result.breakdown.Ethics).toBe(8);
      expect(result.breakdown.Ethics).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Test Case 4: Product with Active Recall (Ethics Pillar - BBFAW only)', () => {
    const now = Date.now();
    const sixMonthsAgo = new Date(now - (6 * 30 * 24 * 60 * 60 * 1000)).toISOString();
    
    const product: Product = {
      barcode: '4567890123456',
      product_name: 'Recalled Product',
      brands: 'Test Brand',
      labels_tags: [],
      nutriscore_grade: 'b',
      ecoscore_grade: 'b',
      nova_group: 2,
      ingredients_text: 'Ingredients listed.',
      origins: 'USA',
      additives_tags: [],
      recalls: [{
        recallId: 'test-1',
        productName: 'Recalled Product',
        reason: 'Contamination',
        recallDate: sixMonthsAgo,
        isActive: true,
      }],
    };

    test('Ethics pillar (BBFAW only) unaffected by recalls - stays at base 15', () => {
      const result = calculateTruScore(product);
      // Ethics pillar is BBFAW-only; recalls no longer affect it
      expect(result.breakdown.Ethics).toBe(15);
      const ethicsResult = result.pillarDetails?.ethics;
      expect(ethicsResult?.details.bbfawMatchedCompany).toBeNull();
    });
  });

  describe('Test Case 5: Product with Hidden Ingredients (OPEN Pillar)', () => {
    const product: Product = {
      barcode: '5678901234567',
      product_name: 'Flavoured Product',
      brands: 'Test Brand',
      labels_tags: [],
      nutriscore_grade: 'c',
      ecoscore_grade: 'c',
      nova_group: 3,
      ingredients_text: 'Water, natural flavor, aroma, smoke flavouring.',
      origins: 'France',
      additives_tags: [],
      recalls: [],
    };

    test('should apply hidden terms penalty in OPEN pillar', () => {
      const result = calculateTruScore(product);
      
      // OPEN pillar should be reduced due to hidden terms
      expect(result.breakdown.Open).toBeLessThan(15);
      
      // Verify hidden terms are detected
      const openResult = result.pillarDetails?.open;
      expect(openResult?.details.hiddenTermsCount).toBeGreaterThan(0);
    });
  });

  describe('Test Case 6: Ethics Pillar BBFAW Match (Marks & Spencer Tier 2)', () => {
    const product: Product = {
      barcode: '6789012345678',
      product_name: 'M&S Product',
      brands: 'Marks & Spencer PLC',
      labels_tags: [],
      nutriscore_grade: 'a',
      ecoscore_grade: 'a',
      nova_group: 1,
      ingredients_text: 'Full ingredient list.',
      origins: 'UK',
      additives_tags: [],
      recalls: [],
    };

    test('should apply BBFAW Tier 2 + Impact B for Marks & Spencer', () => {
      const result = calculateTruScore(product);
      // Ethics: 15 + 4 (Tier 2) + 3 (Impact B) = 22
      expect(result.breakdown.Ethics).toBe(22);
      const ethicsResult = result.pillarDetails?.ethics;
      expect(ethicsResult?.details.bbfawMatchedCompany).toBeTruthy();
      expect(ethicsResult?.details.bbfawTier).toBe(2);
      expect(ethicsResult?.details.bbfawTierScore).toBe(4);
      expect(ethicsResult?.details.bbfawImpactScore).toBe(3);
    });
  });

  describe('Test Case 7: Product with Poor Nutrition (BODY Pillar)', () => {
    const product: Product = {
      barcode: '7890123456789',
      product_name: 'Ultra Processed Snack',
      brands: 'Junk Food Co',
      labels_tags: [],
      nutriscore_grade: 'e',
      ecoscore_grade: 'd',
      nova_group: 4,
      ingredients_text: 'Sugar, palm oil, artificial flavors, preservatives.',
      origins: 'Unknown',
      additives_tags: ['en:e621', 'en:e951'], // MSG and Aspartame
      recalls: [],
    };

    test('should apply penalties in BODY pillar', () => {
      const result = calculateTruScore(product);
      
      // BODY pillar should be reduced
      expect(result.breakdown.Body).toBeLessThan(15);
      
      // Verify NOVA penalty is applied
      const bodyResult = result.pillarDetails?.body;
      expect(bodyResult?.details.novaAdjustment).toBeLessThan(0);
    });
  });

  describe('Test Case 8: Product with Palm Oil (PLANET Pillar)', () => {
    const product: Product = {
      barcode: '8901234567890',
      product_name: 'Palm Oil Product',
      brands: 'Test Brand',
      labels_tags: [],
      nutriscore_grade: 'c',
      ecoscore_grade: 'd',
      nova_group: 3,
      ingredients_text: 'Palm oil, water, salt.',
      ingredients_analysis_tags: ['en:palm-oil'],
      origins: 'Malaysia',
      additives_tags: [],
      recalls: [],
    };

    test('Planet v19: palm does not reduce Planet score; Eco-Score drives Planet when present', () => {
      const result = calculateTruScore(product);

      const planetResult = result.pillarDetails?.planet;
      expect(planetResult?.details.palmOilPlanetAdjustment).toBe(0);
      // Eco-Score D => 15 - 3 = 12
      expect(result.breakdown.Planet).toBe(12);
    });
  });

  describe('Test Case 9: Product with Missing Origin (OPEN Pillar)', () => {
    const product: Product = {
      barcode: '9012345678901',
      product_name: 'No Origin Product',
      brands: 'Test Brand',
      labels_tags: [],
      nutriscore_grade: 'b',
      ecoscore_grade: 'b',
      nova_group: 2,
      ingredients_text: 'Ingredients listed.',
      origins: undefined, // Missing origin
      additives_tags: [],
      recalls: [],
    };

    test('should apply origin penalty in OPEN pillar', () => {
      const result = calculateTruScore(product);
      
      // OPEN pillar should be reduced
      expect(result.breakdown.Open).toBeLessThan(15);
      
      // Verify origin penalty is applied
      const openResult = result.pillarDetails?.open;
      expect(openResult?.details.originPenalty).toBeGreaterThan(0);
    });
  });

  describe('Test Case 10: Complete Score Validation', () => {
    const product: Product = {
      barcode: '0123456789012',
      product_name: 'Complete Test Product',
      brands: 'Test Brand',
      labels_tags: ['en:organic'],
      nutriscore_grade: 'a',
      ecoscore_grade: 'a',
      nova_group: 1,
      ingredients_text: 'Full ingredient disclosure with no hidden terms.',
      origins: 'USA',
      packaging_tags: ['en:recyclable'],
      additives_tags: [],
      recalls: [],
    };

    test('should calculate valid total score', () => {
      const result = calculateTruScore(product);
      
      // Total score should be sum of all pillars
      const calculatedTotal = result.breakdown.Body + 
                              result.breakdown.Planet + 
                              result.breakdown.Ethics + 
                              result.breakdown.Open;
      
      expect(result.truscore).toBe(calculatedTotal);
      expect(result.truscore).toBeGreaterThanOrEqual(0);
      expect(result.truscore).toBeLessThanOrEqual(100);
    });
  });

  describe('Test Case 11: Ethics Pillar BBFAW Tier 6 (Tyson Foods)', () => {
    const product: Product = {
      barcode: '1111111111111',
      product_name: 'Tyson Chicken Product',
      brands: 'Tyson Foods',
      labels_tags: [],
      nutriscore_grade: 'b',
      ecoscore_grade: 'b',
      nova_group: 2,
      ingredients_text: 'Ingredients listed.',
      origins: 'USA',
      additives_tags: [],
      recalls: [],
    };

    test('should apply BBFAW Tier 6 penalty for Tyson Foods', () => {
      const result = calculateTruScore(product);
      // Ethics: 15 - 6 (Tier 6) - 3 (Impact F) = 6
      expect(result.breakdown.Ethics).toBe(6);
      const ethicsResult = result.pillarDetails?.ethics;
      expect(ethicsResult?.details.bbfawMatchedCompany).toBeTruthy();
      expect(ethicsResult?.details.bbfawTier).toBe(6);
      expect(ethicsResult?.details.bbfawTierScore).toBe(-6);
      expect(ethicsResult?.details.bbfawImpactScore).toBe(-3);
    });
  });

  describe('Test Case 12: RSPO Certified Palm Oil (PLANET Pillar)', () => {
    const product: Product = {
      barcode: '2222222222222',
      product_name: 'RSPO Certified Product',
      brands: 'Unilever', // RSPO certified
      labels_tags: ['en:rspo'],
      nutriscore_grade: 'b',
      ecoscore_grade: 'b',
      nova_group: 2,
      ingredients_text: 'Palm oil (RSPO certified), water.',
      ingredients_analysis_tags: ['en:palm-oil'],
      origins: 'Malaysia',
      additives_tags: [],
      recalls: [],
    };

    test('Planet v19: RSPO / palm context does not change Planet score when Eco-Score is present', () => {
      const result = calculateTruScore(product);

      const planetResult = result.pillarDetails?.planet;
      expect(planetResult?.details.palmOilPlanetAdjustment).toBe(0);
      expect(result.breakdown.Planet).toBe(18);
    });
  });

  describe('Test Case 13: Zero Hidden Terms Reward (OPEN Pillar)', () => {
    const product: Product = {
      barcode: '3333333333333',
      product_name: 'Transparent Product',
      brands: 'Transparent Brand',
      brand_owner: 'Transparent Brand Inc',
      labels_tags: [],
      nutriscore_grade: 'a',
      ecoscore_grade: 'a',
      nova_group: 1, // NOVA 1–2 + no vague-term matches → +4 sophistication bonus (Open pillar spec)
      // Avoid words that match Open pillar vague-term list (e.g. "extract" in "vanilla extract").
      ingredients_text:
        'Water, organic cane sugar, salt, natural vanilla bean paste. Full disclosure.',
      origins: 'USA',
      origins_tags: ['en:united-states'],
      serving_size: '100 g',
      nutriments: {
        energy_100g: 80,
        fat_100g: 0,
        carbohydrates_100g: 18,
        proteins_100g: 0,
        salt_100g: 0.02,
        sugars_100g: 18,
      },
      additives_tags: [],
      recalls: [],
    };

    test('should apply zero hidden terms reward', () => {
      const result = calculateTruScore(product);

      const openResult = result.pillarDetails?.open;
      expect(openResult?.details.hiddenTermsCount).toBe(0);
      expect(openResult?.details.listingClarityBonus).toBe(4);

      expect(result.breakdown.Open).toBeGreaterThan(15);
    });
  });

  describe('Test Case 14: Minimum Score Floor', () => {
    const product: Product = {
      barcode: '4444444444444',
      product_name: 'Worst Case Product',
      brands: 'Unilever', // Animal testing
      labels_tags: [],
      nutriscore_grade: 'e',
      ecoscore_grade: 'e',
      nova_group: 4,
      ingredients_text: 'natural flavor, artificial flavouring, aroma, colour, preservative (potassium sorbate), E621.',
      origins: undefined,
      additives_tags: ['en:e621', 'en:e951', 'en:e250'],
      recalls: [{
        recallId: 'test-1',
        productName: 'Worst Case Product',
        reason: 'Multiple issues',
        recallDate: new Date().toISOString(),
        isActive: true,
      }],
    };

    test('should not go below 0 for any pillar', () => {
      const result = calculateTruScore(product);
      
      expect(result.breakdown.Body).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.Planet).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.Ethics).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.Open).toBeGreaterThanOrEqual(0);
      expect(result.truscore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Test Case 15: Maximum Score Cap', () => {
    const product: Product = {
      barcode: '5555555555555',
      product_name: 'Perfect Product',
      brands: 'Perfect Brand',
      labels_tags: [
        'en:fair-trade',
        'en:organic',
        'en:rainforest-alliance',
        'en:rspo',
        'en:rspca',
        'en:leaping-bunny',
        'en:b-corp',
      ],
      nutriscore_grade: 'a',
      ecoscore_grade: 'a',
      nova_group: 1,
      ingredients_text: 'Full ingredient disclosure with complete transparency. No hidden terms.',
      origins: 'USA',
      packaging_tags: ['en:recyclable'],
      additives_tags: [],
      recalls: [],
    };

    test('should not exceed 25 for any pillar', () => {
      const result = calculateTruScore(product);
      
      expect(result.breakdown.Body).toBeLessThanOrEqual(25);
      expect(result.breakdown.Planet).toBeLessThanOrEqual(25);
      expect(result.breakdown.Ethics).toBeLessThanOrEqual(25);
      expect(result.breakdown.Open).toBeLessThanOrEqual(25);
      expect(result.truscore).toBeLessThanOrEqual(100);
    });
  });
});

