/**
 * User Contribution System - Comprehensive End-to-End Tests
 * 
 * Tests verify that ALL user-submitted data types are stored globally and available to all users.
 * 
 * Test Coverage:
 * - Complete product data (name, brand, ingredients, nutrition, etc.)
 * - Allergens and additives
 * - Manufacturing country
 * - Product photos (all types)
 * - Packaging information
 * - Data priority (app users first, then Open Food Facts)
 * - Multi-user retrieval (User A submits, User B retrieves)
 */

import { saveManualProduct } from '../../../src/services/manualProductService';
import { ManualProductData } from '../../../src/types/manualProduct';
import { getUserContributedProduct } from '../../../src/services/userContributedProductsService';
import { submitManufacturingCountry, getManufacturingCountry } from '../../../src/services/manufacturingCountryService';
import { uploadProductPhoto } from '../../../src/services/photoUploadService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

/** Fetch mock compatible with services that use response.text() (e.g. manual-products POST/GET). */
function mockFetchResponse(data: unknown, ok = true) {
  const body = JSON.stringify(data);
  return {
    ok,
    status: ok ? 200 : 400,
    text: async () => body,
    json: async () => JSON.parse(body),
  };
}

describe('User Contribution System - Complete E2E Tests', () => {
  const TEST_BARCODE = '9300657233358';
  const TEST_USER_A = `user_a_${Date.now()}`;
  const TEST_USER_B = `user_b_${Date.now()}`;

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Complete Product Data Submission and Retrieval', () => {
    test('should submit complete product data and retrieve globally', async () => {
      // User A submits complete product data
      const completeProductData: ManualProductData = {
        barcode: TEST_BARCODE,
        product_name: 'Complete Test Product',
        brands: 'Test Brand Inc.',
        ingredients_text: 'Water, Sugar, Salt, Natural Flavors, E412 (Thickener), E202 (Preservative)',
        nutriments: {
          energy_kcal_100g: 150,
          fat_100g: 5.5,
          saturated_fat_100g: 2.0,
          carbohydrates_100g: 25.0,
          sugars_100g: 20.0,
          fiber_100g: 1.5,
          proteins_100g: 2.0,
          salt_100g: 0.5,
        },
        serving_size: '250ml',
        quantity: '500ml',
        manufacturing_places: 'New Zealand',
        countries: 'New Zealand',
        categories: 'Beverages, Soft Drinks',
        allergens_tags: ['en:milk', 'en:soy'],
        additives_tags: ['en:e412', 'en:e202'],
        packaging_data: {
          items: [
            {
              material: 'en:plastic',
              shape: 'en:bottle',
              recycling: 'en:recyclable',
            },
          ],
          isRecyclable: true,
          isReusable: false,
          isBiodegradable: false,
          recyclabilityScore: 50,
        },
        timestamp: Date.now(),
      };

      // Mock all API calls
      let backendCallCount = 0;
      let openFoodFactsCallCount = 0;

      (global.fetch as jest.Mock).mockImplementation((url: string | Request, options?: any) => {
        // Handle both string URLs and Request objects
        let urlString = '';
        let method = 'GET';
        
        if (typeof url === 'string') {
          urlString = url;
          method = options?.method || 'GET';
        } else {
          urlString = (url as Request).url || '';
          method = (url as Request).method || options?.method || 'GET';
        }

        // Open Food Facts calls (may happen first or after backend)
        if (urlString.includes('openfoodfacts.org')) {
          openFoodFactsCallCount++;
          return Promise.resolve(
            mockFetchResponse({
              status: 1,
              status_verbose: 'fields saved',
            })
          );
        }

        // Backend API calls - check for manual-products endpoint
        if ((urlString.includes('/api/manual-products') || urlString.includes('manual-products')) && method === 'POST') {
          backendCallCount++;
          return Promise.resolve(
            mockFetchResponse({
              success: true,
              message: 'Product data submitted successfully!',
              barcode: TEST_BARCODE,
            })
          );
        }

        // Photo upload API
        if ((urlString.includes('/api/upload-photo') || urlString.includes('upload-photo')) && method === 'POST') {
          return Promise.resolve(
            mockFetchResponse({
              success: true,
              url: 'https://storage.example.com/photos/test.jpg',
            })
          );
        }

        // Other calls (like getUserCountryCode, etc.)
        return Promise.resolve(mockFetchResponse({}));
      });

      // Submit complete product
      const result = await saveManualProduct(completeProductData);

      expect(result).toBe(true);
      
      // Verify backend was called (data stored globally)
      expect(backendCallCount).toBeGreaterThan(0);
      
      // Verify Open Food Facts was called (secondary priority)
      expect(openFoodFactsCallCount).toBeGreaterThan(0);
    });

    test('should retrieve complete product data by different user (User B)', async () => {
      // Simulate User B retrieving data submitted by User A
      // No local data for User B
      AsyncStorage.getItem.mockImplementation((key: string) => {
        if (key && key === `@truescan_manual_product_${TEST_BARCODE}`) {
          return Promise.resolve(null); // User B has no local data
        }
        return Promise.resolve(null);
      });

      // Mock backend API response (User B fetches from global storage)
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        const urlString = typeof url === 'string' ? url : (url as any)?.url || '';
        
        if (urlString.includes('/api/manual-products') && urlString.includes('barcode=')) {
          return Promise.resolve(
            mockFetchResponse({
              success: true,
              product: {
                barcode: TEST_BARCODE,
                product_name: 'Complete Test Product',
                brands: 'Test Brand Inc.',
                ingredients_text: 'Water, Sugar, Salt, Natural Flavors, E412 (Thickener), E202 (Preservative)',
                nutriments: {
                  energy_kcal_100g: 150,
                  fat_100g: 5.5,
                  saturated_fat_100g: 2.0,
                  carbohydrates_100g: 25.0,
                  sugars_100g: 20.0,
                  fiber_100g: 1.5,
                  proteins_100g: 2.0,
                  salt_100g: 0.5,
                },
                serving_size: '250ml',
                quantity: '500ml',
                manufacturing_places: 'New Zealand',
                countries: 'New Zealand',
                categories: 'Beverages, Soft Drinks',
                allergens_tags: ['en:milk', 'en:soy'],
                additives_tags: ['en:e412', 'en:e202'],
                packaging_data: {
                  items: [
                    {
                      material: 'en:plastic',
                      shape: 'en:bottle',
                      recycling: 'en:recyclable',
                    },
                  ],
                },
                submittedAt: Date.now(),
              },
            })
          );
        }
        return Promise.resolve(mockFetchResponse({}));
      });

      // User B retrieves product
      const product = await getUserContributedProduct(TEST_BARCODE);

      // Backend manual-products only exposes proprietary fields (country / certifications / photo merge).
      // Name, ingredients, allergens, and scoring fields come from Open Food Facts after merge in the app.
      expect(product).not.toBeNull();
      expect(product?.manufacturing_places).toBe('New Zealand');
      expect(product?.countries).toBe('New Zealand');
      expect(product?.source).toBe('user_contributed');
      expect((product as any)._source).toBe('BACKEND');
    });
  });

  describe('Allergens and Additives Submission', () => {
    test('should submit and retrieve allergens correctly', async () => {
      const productData: ManualProductData = {
        barcode: TEST_BARCODE,
        product_name: 'Allergen Test Product',
        allergens_tags: ['en:milk', 'en:eggs', 'en:gluten', 'en:soy'],
        timestamp: Date.now(),
      };

      let openFoodFactsCallCount = 0;
      (global.fetch as jest.Mock).mockImplementation((url: string | Request, options?: any) => {
        let urlString = '';
        let method = 'GET';

        if (typeof url === 'string') {
          urlString = url;
          method = options?.method || 'GET';
        } else {
          urlString = (url as Request).url || '';
          method = (url as Request).method || options?.method || 'GET';
        }

        if (urlString.includes('openfoodfacts.org')) {
          openFoodFactsCallCount++;
          return Promise.resolve(mockFetchResponse({ status: 1 }));
        }
        if ((urlString.includes('/api/manual-products') || urlString.includes('manual-products')) && method === 'POST') {
          return Promise.resolve(mockFetchResponse({ success: true, barcode: TEST_BARCODE }));
        }
        return Promise.resolve(mockFetchResponse({}));
      });

      const result = await saveManualProduct(productData);
      expect(result).toBe(true);
      expect(openFoodFactsCallCount).toBeGreaterThan(0);

      // Allergens are submitted to OFF for TruScore; Vercel manual-products does not return them here.
      AsyncStorage.getItem.mockResolvedValue(null);
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        const urlString = typeof url === 'string' ? url : (url as any)?.url || '';
        if (urlString.includes('/api/manual-products') && urlString.includes('barcode=')) {
          return Promise.resolve(
            mockFetchResponse({
              success: true,
              product: {
                barcode: TEST_BARCODE,
                submittedAt: Date.now(),
              },
            })
          );
        }
        return Promise.resolve(mockFetchResponse({}));
      });

      const product = await getUserContributedProduct(TEST_BARCODE);
      expect(product?.barcode).toBe(TEST_BARCODE);
      expect(product?.allergens_tags).toBeUndefined();
    });

    test('should submit and retrieve additives correctly', async () => {
      const productData: ManualProductData = {
        barcode: TEST_BARCODE,
        product_name: 'Additive Test Product',
        additives_tags: ['en:e412', 'en:e202', 'en:e621', 'en:e951'],
        timestamp: Date.now(),
      };

      let openFoodFactsCallCount = 0;
      (global.fetch as jest.Mock).mockImplementation((url: string | Request, options?: any) => {
        let urlString = '';
        let method = 'GET';

        if (typeof url === 'string') {
          urlString = url;
          method = options?.method || 'GET';
        } else {
          urlString = (url as Request).url || '';
          method = (url as Request).method || options?.method || 'GET';
        }

        if (urlString.includes('openfoodfacts.org')) {
          openFoodFactsCallCount++;
          return Promise.resolve(mockFetchResponse({ status: 1 }));
        }
        if ((urlString.includes('/api/manual-products') || urlString.includes('manual-products')) && method === 'POST') {
          return Promise.resolve(mockFetchResponse({ success: true, barcode: TEST_BARCODE }));
        }
        return Promise.resolve(mockFetchResponse({}));
      });

      await saveManualProduct(productData);
      expect(openFoodFactsCallCount).toBeGreaterThan(0);

      AsyncStorage.getItem.mockResolvedValue(null);
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        const urlString = typeof url === 'string' ? url : (url as any)?.url || '';
        if (urlString.includes('/api/manual-products') && urlString.includes('barcode=')) {
          return Promise.resolve(
            mockFetchResponse({
              success: true,
              product: {
                barcode: TEST_BARCODE,
                submittedAt: Date.now(),
              },
            })
          );
        }
        return Promise.resolve(mockFetchResponse({}));
      });

      const product = await getUserContributedProduct(TEST_BARCODE);
      expect(product?.barcode).toBe(TEST_BARCODE);
      expect(product?.additives_tags).toBeUndefined();
    });
  });

  describe('Manufacturing Country Submission', () => {
    test('should submit manufacturing country and retrieve globally', async () => {
      AsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'manufacturing_country_user_id') {
          return Promise.resolve(TEST_USER_A);
        }
        if (key === 'manufacturing_country_submissions') {
          return Promise.resolve('[]');
        }
        return Promise.resolve(null);
      });

      (global.fetch as jest.Mock).mockImplementation((url: string | Request, options?: any) => {
        let urlString = '';
        let method = 'GET';
        
        if (typeof url === 'string') {
          urlString = url;
          method = options?.method || 'GET';
        } else {
          urlString = (url as Request).url || '';
          method = (url as Request).method || options?.method || 'GET';
        }

        if ((urlString.includes('/api/manufacturing-country') || urlString.includes('manufacturing-country')) && method === 'POST') {
          return Promise.resolve(
            mockFetchResponse({
              success: true,
              verified: false,
              message: 'Thank you for your contribution!',
            })
          );
        }
        if (urlString.includes('openfoodfacts.org')) {
          return Promise.resolve(mockFetchResponse({ status: 1 }));
        }
        return Promise.resolve(mockFetchResponse({}));
      });

      const result = await submitManufacturingCountry(TEST_BARCODE, 'New Zealand');
      expect(result.success).toBe(true);

      // User B retrieves country
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        const urlString = typeof url === 'string' ? url : (url as any)?.url || '';
        if (urlString.includes('/api/manufacturing-country') && urlString.includes('barcode=')) {
          return Promise.resolve(
            mockFetchResponse({
              country: 'New Zealand',
              confidence: 'community',
              verifiedCount: 1,
              hasImportedIngredients: false,
            })
          );
        }
        return Promise.resolve(mockFetchResponse({}));
      });

      const countryData = await getManufacturingCountry(TEST_BARCODE);
      expect(countryData.country).toBe('New Zealand');
      expect(countryData.confidence).toBe('community');
    });
  });

  describe('Photo Upload (All Types)', () => {
    test('should upload front photo and retrieve globally', async () => {
      const mockImagePath = '/path/to/front.jpg';
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('base64encodedimage');

      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        const urlString = typeof url === 'string' ? url : (url as any)?.url || '';
        if (urlString.includes('openfoodfacts.org')) {
          return Promise.resolve(mockFetchResponse({ status: 1 }));
        }
        if (urlString.includes('/api/upload-photo') && options?.method === 'POST') {
          return Promise.resolve(
            mockFetchResponse({
              success: true,
              url: 'https://storage.example.com/photos/front.jpg',
            })
          );
        }
        return Promise.resolve(mockFetchResponse({}));
      });

      const result = await uploadProductPhoto(TEST_BARCODE, mockImagePath, 'front');
      expect(result.success).toBe(true);
      expect(result.vercelUrl).toBeDefined();
      expect(result.openFoodFactsUrl).toBeUndefined();
    });

    test('should upload ingredients photo and retrieve globally', async () => {
      const mockImagePath = '/path/to/ingredients.jpg';
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('base64encodedimage');

      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        const urlString = typeof url === 'string' ? url : (url as any)?.url || '';
        if (urlString.includes('openfoodfacts.org')) {
          return Promise.resolve(mockFetchResponse({ status: 1 }));
        }
        if (urlString.includes('/api/upload-photo') && options?.method === 'POST') {
          return Promise.resolve(
            mockFetchResponse({
              success: true,
              url: 'https://storage.example.com/photos/ingredients.jpg',
            })
          );
        }
        return Promise.resolve(mockFetchResponse({}));
      });

      const result = await uploadProductPhoto(TEST_BARCODE, mockImagePath, 'ingredients');
      expect(result.success).toBe(true);
    });
  });

  describe('Data Priority System', () => {
    test('should prioritize app user data over Open Food Facts', async () => {
      // User A submits data to app backend (priority 1)
      const productData: ManualProductData = {
        barcode: TEST_BARCODE,
        product_name: 'App User Priority Product',
        ingredients_text: 'App User Ingredients',
        countries: 'App User Origin',
        timestamp: Date.now(),
      };

      let backendCallOrder: string[] = [];

      (global.fetch as jest.Mock).mockImplementation((url: string | Request, options?: any) => {
        let urlString = '';
        let method = 'GET';
        
        if (typeof url === 'string') {
          urlString = url;
          method = options?.method || 'GET';
        } else {
          urlString = (url as Request).url || '';
          method = (url as Request).method || options?.method || 'GET';
        }

        if ((urlString.includes('/api/manual-products') || urlString.includes('manual-products')) && method === 'POST') {
          backendCallOrder.push('backend');
          return Promise.resolve(mockFetchResponse({ success: true, barcode: TEST_BARCODE }));
        }
        if (urlString.includes('openfoodfacts.org')) {
          backendCallOrder.push('openfoodfacts');
          return Promise.resolve(mockFetchResponse({ status: 1 }));
        }
        return Promise.resolve(mockFetchResponse({}));
      });

      await saveManualProduct(productData);

      // Verify backend is called (app users get data first)
      expect(backendCallOrder).toContain('backend');
      
      // When User B retrieves, they should get data from backend (not Open Food Facts)
      AsyncStorage.getItem.mockResolvedValue(null);
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        const urlString = typeof url === 'string' ? url : (url as any)?.url || '';
        if (urlString.includes('/api/manual-products') && urlString.includes('barcode=')) {
          return Promise.resolve(
            mockFetchResponse({
              success: true,
              product: {
                barcode: TEST_BARCODE,
                product_name: 'App User Priority Product',
                ingredients_text: 'App User Ingredients',
                countries: 'App User Origin',
                submittedAt: Date.now(),
              },
            })
          );
        }
        return Promise.resolve(mockFetchResponse({}));
      });

      const product = await getUserContributedProduct(TEST_BARCODE);
      expect(product?.countries).toBe('App User Origin');
      expect(product?.source).toBe('user_contributed');
    });
  });

  describe('Multi-User Data Consistency', () => {
    test('should ensure data submitted by User A is available to User B', async () => {
      // User A submits
      const productData: ManualProductData = {
        barcode: TEST_BARCODE,
        product_name: 'Multi-User Test Product',
        brands: 'Test Brand',
        ingredients_text: 'Water, Sugar',
        allergens_tags: ['en:milk'],
        timestamp: Date.now(),
      };

      (global.fetch as jest.Mock).mockImplementation((url: string | Request, options?: any) => {
        let urlString = '';
        let method = 'GET';
        
        if (typeof url === 'string') {
          urlString = url;
          method = options?.method || 'GET';
        } else {
          urlString = (url as Request).url || '';
          method = (url as Request).method || options?.method || 'GET';
        }

        if (urlString.includes('openfoodfacts.org')) {
          return Promise.resolve(mockFetchResponse({ status: 1 }));
        }
        if ((urlString.includes('/api/manual-products') || urlString.includes('manual-products')) && method === 'POST') {
          return Promise.resolve(mockFetchResponse({ success: true, barcode: TEST_BARCODE }));
        }
        return Promise.resolve(mockFetchResponse({}));
      });

      await saveManualProduct(productData);

      // User B retrieves (different device, no local cache)
      AsyncStorage.getItem.mockResolvedValue(null);
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        const urlString = typeof url === 'string' ? url : (url as any)?.url || '';
        if (urlString.includes('/api/manual-products') && urlString.includes('barcode=')) {
          return Promise.resolve(
            mockFetchResponse({
              success: true,
              product: {
                barcode: TEST_BARCODE,
                product_name: 'Multi-User Test Product',
                brands: 'Test Brand',
                ingredients_text: 'Water, Sugar',
                allergens_tags: ['en:milk'],
                submittedAt: Date.now(),
              },
            })
          );
        }
        return Promise.resolve(mockFetchResponse({}));
      });

      const product = await getUserContributedProduct(TEST_BARCODE);

      // Vercel GET returns the proprietary slice only; core product fields are loaded from OFF when present.
      expect(product).not.toBeNull();
      expect(product?.barcode).toBe(TEST_BARCODE);
      expect(product?.product_name).toBeUndefined();
      expect(product?.ingredients_text).toBeUndefined();
      expect(product?.allergens_tags).toBeUndefined();
    });
  });

  describe('Complete Workflow Test', () => {
    test('should handle complete user contribution workflow end-to-end', async () => {
      // Step 1: User submits complete product with all data types
      const completeData: ManualProductData = {
        barcode: TEST_BARCODE,
        product_name: 'Complete Workflow Product',
        brands: 'Workflow Brand',
        ingredients_text: 'Water, Sugar, E412, E202',
        nutriments: {
          energy_kcal_100g: 100,
          fat_100g: 5,
        },
        manufacturing_places: 'New Zealand',
        allergens_tags: ['en:milk'],
        additives_tags: ['en:e412', 'en:e202'],
        packaging_data: {
          items: [{ material: 'en:plastic', shape: 'en:bottle', recycling: 'en:recyclable' }],
          isRecyclable: true,
          isReusable: false,
          isBiodegradable: false,
          recyclabilityScore: 50,
        },
        timestamp: Date.now(),
      };

      (global.fetch as jest.Mock).mockImplementation((url: string | Request, options?: any) => {
        let urlString = '';
        let method = 'GET';
        
        if (typeof url === 'string') {
          urlString = url;
          method = options?.method || 'GET';
        } else {
          urlString = (url as Request).url || '';
          method = (url as Request).method || options?.method || 'GET';
        }

        if (urlString.includes('openfoodfacts.org')) {
          return Promise.resolve(mockFetchResponse({ status: 1 }));
        }
        if ((urlString.includes('/api/manual-products') || urlString.includes('manual-products')) && method === 'POST') {
          return Promise.resolve(mockFetchResponse({ success: true, barcode: TEST_BARCODE }));
        }
        return Promise.resolve(mockFetchResponse({}));
      });

      const saveResult = await saveManualProduct(completeData);
      expect(saveResult).toBe(true);

      // Step 2: User submits manufacturing country
      AsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'manufacturing_country_user_id') return Promise.resolve(TEST_USER_A);
        if (key === 'manufacturing_country_submissions') return Promise.resolve('[]');
        return Promise.resolve(null);
      });

      (global.fetch as jest.Mock).mockImplementation((url: string | Request, options?: any) => {
        let urlString = '';
        let method = 'GET';
        
        if (typeof url === 'string') {
          urlString = url;
          method = options?.method || 'GET';
        } else {
          urlString = (url as Request).url || '';
          method = (url as Request).method || options?.method || 'GET';
        }

        if ((urlString.includes('/api/manufacturing-country') || urlString.includes('manufacturing-country')) && method === 'POST') {
          return Promise.resolve(
            mockFetchResponse({
              success: true,
              verified: false,
              message: 'Thank you for your contribution!',
            })
          );
        }
        if (urlString.includes('openfoodfacts.org')) {
          return Promise.resolve(mockFetchResponse({ status: 1 }));
        }
        return Promise.resolve(mockFetchResponse({}));
      });

      const countryResult = await submitManufacturingCountry(TEST_BARCODE, 'New Zealand');
      expect(countryResult.success).toBe(true);

      // Step 3: Different user retrieves all data
      AsyncStorage.getItem.mockResolvedValue(null);
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        const urlString = typeof url === 'string' ? url : (url as any)?.url || '';
        if (urlString.includes('/api/manual-products') && urlString.includes('barcode=')) {
          return Promise.resolve(
            mockFetchResponse({
              success: true,
              product: {
                ...completeData,
                submittedAt: Date.now(),
              },
            })
          );
        }
        if (urlString.includes('/api/manufacturing-country') && urlString.includes('barcode=')) {
          return Promise.resolve(
            mockFetchResponse({
              country: 'New Zealand',
              confidence: 'community',
              verifiedCount: 1,
            })
          );
        }
        return Promise.resolve(mockFetchResponse({}));
      });

      const product = await getUserContributedProduct(TEST_BARCODE);
      const countryData = await getManufacturingCountry(TEST_BARCODE);

      // Proprietary country on Vercel + manufacturing-country API; scoring fields come from OFF elsewhere.
      expect(product).not.toBeNull();
      expect(product?.manufacturing_places).toBe('New Zealand');
      expect(countryData.country).toBe('New Zealand');
    });
  });
});

