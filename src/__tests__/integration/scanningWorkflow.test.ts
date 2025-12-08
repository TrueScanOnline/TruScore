/**
 * Integration tests for scanning workflow
 * 
 * Tests the complete barcode scanning workflow.
 */

import { normalizeBarcode, getPrimaryBarcode } from '../../../utils/barcodeNormalization';
import { fetchProduct } from '../../../services/productService';

describe('Scanning Workflow Integration', () => {
  it('should handle EAN-8 barcode', () => {
    const barcode = '12345670';
    const normalized = normalizeBarcode(barcode);
    const primary = getPrimaryBarcode(barcode);
    
    expect(normalized.length).toBeGreaterThan(0);
    expect(primary.length).toBeGreaterThanOrEqual(8);
  });

  it('should handle EAN-13 barcode', () => {
    const barcode = '1234567890128';
    const normalized = normalizeBarcode(barcode);
    const primary = getPrimaryBarcode(barcode);
    
    expect(normalized).toContain(barcode);
    expect(primary).toBe(barcode);
  });

  it('should handle UPC-A barcode', () => {
    const barcode = '012345678905';
    const normalized = normalizeBarcode(barcode);
    const primary = getPrimaryBarcode(barcode);
    
    expect(normalized.length).toBeGreaterThan(0);
    expect(primary.length).toBeGreaterThanOrEqual(12);
  });

  it('should complete full scan workflow', async () => {
    const barcode = '3017620422003';
    
    // Step 1: Normalize barcode
    const normalized = normalizeBarcode(barcode);
    expect(normalized.length).toBeGreaterThan(0);
    
    // Step 2: Get primary barcode
    const primary = getPrimaryBarcode(barcode);
    expect(primary).toBeDefined();
    
    // Step 3: Fetch product
    const product = await fetchProduct(primary);
    expect(product).not.toBeNull();
    expect(product?.barcode).toBeDefined();
  }, 30000);
});

