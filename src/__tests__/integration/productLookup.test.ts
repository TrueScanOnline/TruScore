/**
 * Integration tests for product lookup flow
 * 
 * Tests the complete product lookup workflow from barcode to product display.
 */

import { fetchProduct } from '../../../services/productService';
import { normalizeBarcode } from '../../../utils/barcodeNormalization';

describe('Product Lookup Integration', () => {
  it('should fetch product for valid barcode', async () => {
    const barcode = '3017620422003'; // Nutella barcode
    const product = await fetchProduct(barcode);
    
    expect(product).not.toBeNull();
    expect(product?.barcode).toBeDefined();
    expect(product?.product_name).toBeDefined();
  }, 30000); // 30 second timeout for network requests

  it('should normalize barcode variants', () => {
    const variants = normalizeBarcode('12345670');
    expect(variants.length).toBeGreaterThan(0);
    expect(variants).toContain('12345670');
  });

  it('should handle invalid barcode gracefully', async () => {
    const barcode = '0000000000000';
    const product = await fetchProduct(barcode);
    
    // Should return a product (even if minimal from web search)
    expect(product).not.toBeNull();
  }, 30000);

  it('should use cache on second lookup', async () => {
    const barcode = '3017620422003';
    
    // First lookup
    const product1 = await fetchProduct(barcode, true);
    expect(product1).not.toBeNull();
    
    // Second lookup should be faster (from cache)
    const startTime = Date.now();
    const product2 = await fetchProduct(barcode, true);
    const duration = Date.now() - startTime;
    
    expect(product2).not.toBeNull();
    expect(duration).toBeLessThan(1000); // Should be much faster from cache
  }, 30000);
});

