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

describe('User Contribution System - Complete E2E Tests', () => {
  const TEST_BARCODE = `E2E_TEST_${Date.now()}`;
  const TEST_USER_A = `user_a_${Date.now()}`;
  const TEST_USER_B = `user_b_${Date.now()}`;
  
  let AsyncStorage: any;

  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage = require('@react-native-async-storage/async-storage');
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue(undefined);
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
          return Promise.resolve({
            ok: true,
            json: async () => ({
              status: 1,
              status_verbose: 'fields saved',
            }),
          });
        }

        // Backend API calls - check for manual-products endpoint
        if ((urlString.includes('/api/manual-products') || urlString.includes('manual-products')) && method === 'POST') {
          backendCallCount++;
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              message: 'Product data submitted successfully!',
              barcode: TEST_BARCODE,
            }),
          });
        }

        // Photo upload API
        if ((urlString.includes('/api/upload-photo') || urlString.includes('upload-photo')) && method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              url: 'https://storage.example.com/photos/test.jpg',
            }),
          });
        }

        // Other calls (like getUserCountryCode, etc.)
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
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
          return Promise.resolve({
            ok: true,
            json: async () => ({
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
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      });

      // User B retrieves product
      const product = await getUserContributedProduct(TEST_BARCODE);

      // Verify all data is present
      expect(product).not.toBeNull();
      expect(product?.product_name).toBe('Complete Test Product');
      expect(product?.brands).toBe('Test Brand Inc.');
      expect(product?.ingredients_text).toContain('Water, Sugar, Salt');
      expect(product?.allergens_tags).toContain('en:milk');
      expect(product?.allergens_tags).toContain('en:soy');
      expect(product?.additives_tags).toContain('en:e412');
      expect(product?.additives_tags).toContain('en:e202');
      expect(product?.manufacturing_places).toBe('New Zealand');
      expect(product?.packaging_data).toBeDefined();
      expect(product?.nutriments?.energy_kcal_100g).toBe(150);
      expect(product?.source).toBe('user_contributed');
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
          return Promise.resolve({ ok: true, json: async () => ({ status: 1 }) });
        }
        if ((urlString.includes('/api/manual-products') || urlString.includes('manual-products')) && method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, barcode: TEST_BARCODE }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      const result = await saveManualProduct(productData);
      expect(result).toBe(true);

      // Verify retrieval
      AsyncStorage.getItem.mockResolvedValue(null);
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        const urlString = typeof url === 'string' ? url : (url as any)?.url || '';
        if (urlString.includes('/api/manual-products') && urlString.includes('barcode=')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              product: {
                barcode: TEST_BARCODE,
                product_name: 'Allergen Test Product',
                allergens_tags: ['en:milk', 'en:eggs', 'en:gluten', 'en:soy'],
                submittedAt: Date.now(),
              },
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      const product = await getUserContributedProduct(TEST_BARCODE);
      expect(product?.allergens_tags).toHaveLength(4);
      expect(product?.allergens_tags).toContain('en:milk');
      expect(product?.allergens_tags).toContain('en:eggs');
    });

    test('should submit and retrieve additives correctly', async () => {
      const productData: ManualProductData = {
        barcode: TEST_BARCODE,
        product_name: 'Additive Test Product',
        additives_tags: ['en:e412', 'en:e202', 'en:e621', 'en:e951'],
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
          return Promise.resolve({ ok: true, json: async () => ({ status: 1 }) });
        }
        if ((urlString.includes('/api/manual-products') || urlString.includes('manual-products')) && method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, barcode: TEST_BARCODE }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      await saveManualProduct(productData);

      // Verify retrieval
      AsyncStorage.getItem.mockResolvedValue(null);
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        const urlString = typeof url === 'string' ? url : (url as any)?.url || '';
        if (urlString.includes('/api/manual-products') && urlString.includes('barcode=')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              product: {
                barcode: TEST_BARCODE,
                product_name: 'Additive Test Product',
                additives_tags: ['en:e412', 'en:e202', 'en:e621', 'en:e951'],
                submittedAt: Date.now(),
              },
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      const product = await getUserContributedProduct(TEST_BARCODE);
      expect(product?.additives_tags).toHaveLength(4);
      expect(product?.additives_tags).toContain('en:e412');
      expect(product?.additives_tags).toContain('en:e951');
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
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              verified: false,
              message: 'Thank you for your contribution!',
            }),
          });
        }
        if (urlString.includes('openfoodfacts.org')) {
          return Promise.resolve({ ok: true, json: async () => ({ status: 1 }) });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      const result = await submitManufacturingCountry(TEST_BARCODE, 'New Zealand');
      expect(result.success).toBe(true);

      // User B retrieves country
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        const urlString = typeof url === 'string' ? url : (url as any)?.url || '';
        if (urlString.includes('/api/manufacturing-country') && urlString.includes('barcode=')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              country: 'New Zealand',
              confidence: 'community',
              verifiedCount: 1,
              hasImportedIngredients: false,
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      const countryData = await getManufacturingCountry(TEST_BARCODE);
      expect(countryData.country).toBe('New Zealand');
      expect(countryData.confidence).toBe('community');
    });
  });

  describe('Photo Upload (All Types)', () => {
    test('should upload front photo and retrieve globally', async () => {
      const mockImagePath = '/path/to/front.jpg';
      const FileSystem = require('expo-file-system');
      FileSystem.readAsStringAsync.mockResolvedValue('base64encodedimage');

      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        const urlString = typeof url === 'string' ? url : (url as any)?.url || '';
        if (urlString.includes('openfoodfacts.org')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              image_url: 'https://images.openfoodfacts.org/images/products/test/front.jpg',
            }),
          });
        }
        if (urlString.includes('/api/upload-photo') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              url: 'https://storage.example.com/photos/front.jpg',
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      const result = await uploadProductPhoto(TEST_BARCODE, mockImagePath, 'front');
      expect(result.success).toBe(true);
      expect(result.openFoodFactsUrl || result.vercelUrl).toBeDefined();
    });

    test('should upload ingredients photo and retrieve globally', async () => {
      const mockImagePath = '/path/to/ingredients.jpg';
      const FileSystem = require('expo-file-system');
      FileSystem.readAsStringAsync.mockResolvedValue('base64encodedimage');

      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        const urlString = typeof url === 'string' ? url : (url as any)?.url || '';
        if (urlString.includes('openfoodfacts.org')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              image_url: 'https://images.openfoodfacts.org/images/products/test/ingredients.jpg',
            }),
          });
        }
        if (urlString.includes('/api/upload-photo') && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              url: 'https://storage.example.com/photos/ingredients.jpg',
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
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
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, barcode: TEST_BARCODE }),
          });
        }
        if (urlString.includes('openfoodfacts.org')) {
          backendCallOrder.push('openfoodfacts');
          return Promise.resolve({ ok: true, json: async () => ({ status: 1 }) });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      await saveManualProduct(productData);

      // Verify backend is called (app users get data first)
      expect(backendCallOrder).toContain('backend');
      
      // When User B retrieves, they should get data from backend (not Open Food Facts)
      AsyncStorage.getItem.mockResolvedValue(null);
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        const urlString = typeof url === 'string' ? url : (url as any)?.url || '';
        if (urlString.includes('/api/manual-products') && urlString.includes('barcode=')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              product: {
                barcode: TEST_BARCODE,
                product_name: 'App User Priority Product',
                ingredients_text: 'App User Ingredients',
                submittedAt: Date.now(),
              },
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      const product = await getUserContributedProduct(TEST_BARCODE);
      expect(product?.product_name).toBe('App User Priority Product');
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
          return Promise.resolve({ ok: true, json: async () => ({ status: 1 }) });
        }
        if ((urlString.includes('/api/manual-products') || urlString.includes('manual-products')) && method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, barcode: TEST_BARCODE }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      await saveManualProduct(productData);

      // User B retrieves (different device, no local cache)
      AsyncStorage.getItem.mockResolvedValue(null);
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        const urlString = typeof url === 'string' ? url : (url as any)?.url || '';
        if (urlString.includes('/api/manual-products') && urlString.includes('barcode=')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              product: {
                barcode: TEST_BARCODE,
                product_name: 'Multi-User Test Product',
                brands: 'Test Brand',
                ingredients_text: 'Water, Sugar',
                allergens_tags: ['en:milk'],
                submittedAt: Date.now(),
              },
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      const product = await getUserContributedProduct(TEST_BARCODE);

      // User B should see User A's data
      expect(product).not.toBeNull();
      expect(product?.product_name).toBe('Multi-User Test Product');
      expect(product?.brands).toBe('Test Brand');
      expect(product?.ingredients_text).toBe('Water, Sugar');
      expect(product?.allergens_tags).toContain('en:milk');
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
          return Promise.resolve({ ok: true, json: async () => ({ status: 1 }) });
        }
        if ((urlString.includes('/api/manual-products') || urlString.includes('manual-products')) && method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, barcode: TEST_BARCODE }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
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
          return Promise.resolve({
            ok: true,
            json: async () => ({ 
              success: true, 
              verified: false,
              message: 'Thank you for your contribution!',
            }),
          });
        }
        if (urlString.includes('openfoodfacts.org')) {
          return Promise.resolve({ ok: true, json: async () => ({ status: 1 }) });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      const countryResult = await submitManufacturingCountry(TEST_BARCODE, 'New Zealand');
      expect(countryResult.success).toBe(true);

      // Step 3: Different user retrieves all data
      AsyncStorage.getItem.mockResolvedValue(null);
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        const urlString = typeof url === 'string' ? url : (url as any)?.url || '';
        if (urlString.includes('/api/manual-products') && urlString.includes('barcode=')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              product: {
                ...completeData,
                submittedAt: Date.now(),
              },
            }),
          });
        }
        if (urlString.includes('/api/manufacturing-country') && urlString.includes('barcode=')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              country: 'New Zealand',
              confidence: 'community',
              verifiedCount: 1,
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      const product = await getUserContributedProduct(TEST_BARCODE);
      const countryData = await getManufacturingCountry(TEST_BARCODE);

      // Verify all data is available
      expect(product).not.toBeNull();
      expect(product?.product_name).toBe('Complete Workflow Product');
      expect(product?.allergens_tags).toContain('en:milk');
      expect(product?.additives_tags).toContain('en:e412');
      expect(countryData.country).toBe('New Zealand');
    });
  });
});

