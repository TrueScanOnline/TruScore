/**
 * Unit tests for product data merging
 */

import { mergeProducts } from '../../../services/productDataMerger';
import { Product } from '../../../types/product';

describe('Product Data Merger', () => {
  it('should merge products with different sources', () => {
    const product1: Product = {
      barcode: '1234567890123',
      product_name: 'Test Product',
      source: 'openfoodfacts',
      nutriments: {
        'energy-kcal': 100,
        proteins: 10,
      },
    };

    const product2: Product = {
      barcode: '1234567890123',
      product_name: 'Test Product',
      source: 'usda',
      nutriments: {
        'energy-kcal': 100,
        fat: 5,
      },
    };

    const merged = mergeProducts([product1, product2], {
      normalizeNutrition: true,
      shouldMergeCertifications: true,
    });

    expect(merged.nutriments).toBeDefined();
    expect(merged.nutriments?.['energy-kcal']).toBe(100);
    expect(merged.nutriments?.proteins).toBe(10);
    expect(merged.nutriments?.fat).toBe(5);
  });

  it('should prioritize higher quality sources', () => {
    const product1: Product = {
      barcode: '1234567890123',
      product_name: 'Test Product',
      source: 'openfoodfacts',
      quality: 90,
      image_url: 'https://example.com/image1.jpg',
    };

    const product2: Product = {
      barcode: '1234567890123',
      product_name: 'Test Product',
      source: 'web_search',
      quality: 30,
      image_url: 'https://example.com/image2.jpg',
    };

    const merged = mergeProducts([product1, product2], {
      sourceWeights: { openfoodfacts: 1.0, web_search: 0.3 },
      normalizeNutrition: true,
      shouldMergeCertifications: true,
    });

    expect(merged.image_url).toBe('https://example.com/image1.jpg');
  });

  it('should merge certifications', () => {
    const product1: Product = {
      barcode: '1234567890123',
      product_name: 'Test Product',
      labels_tags: ['en:organic'],
    };

    const product2: Product = {
      barcode: '1234567890123',
      product_name: 'Test Product',
      labels_tags: ['en:fair-trade'],
    };

    const merged = mergeProducts([product1, product2], {
      normalizeNutrition: true,
      shouldMergeCertifications: true,
    });

    expect(merged.labels_tags).toContain('en:organic');
    expect(merged.labels_tags).toContain('en:fair-trade');
  });
});

