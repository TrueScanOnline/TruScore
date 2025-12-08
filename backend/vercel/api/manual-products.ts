/**
 * Manual Products API - Vercel Backend
 * Stores user-contributed product data for global sharing
 * 
 * Endpoints:
 * - POST /api/manual-products - Submit manual product data
 * - GET /api/manual-products?barcode={barcode} - Get manual product data
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  saveManualProduct,
  getManualProduct,
} from '../lib/database';

function handleCORS(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  handleCORS(res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      // Submit manual product data (handles both new submissions and updates)
      const { barcode, productData } = req.body;

      console.log(`[ManualProductsAPI] POST request received for barcode: ${barcode}`);
      console.log(`[ManualProductsAPI] Product data keys: ${Object.keys(productData || {}).join(', ')}`);

      if (!barcode || !productData) {
        console.error('[ManualProductsAPI] Missing required fields:', { barcode: !!barcode, productData: !!productData });
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: barcode, productData',
        });
      }

      // Check if product already exists (for update vs new submission)
      const existingProduct = await getManualProduct(barcode);
      const isUpdate = existingProduct !== null;
      
      console.log(`[ManualProductsAPI] ${isUpdate ? 'UPDATE' : 'NEW'} submission for barcode: ${barcode}`);
      if (isUpdate) {
        console.log(`[ManualProductsAPI] Existing product found, updating with new data`);
        console.log(`[ManualProductsAPI] Existing nutriments keys: ${Object.keys(existingProduct?.productData?.nutriments || {}).join(', ')}`);
        console.log(`[ManualProductsAPI] New nutriments keys: ${Object.keys(productData?.nutriments || {}).join(', ')}`);
      }

      // Save to database (ON CONFLICT DO UPDATE handles updates automatically)
      await saveManualProduct(barcode, {
        ...productData,
        barcode,
        submittedAt: Date.now(),
        source: 'user_contributed',
      });

      console.log(`[ManualProductsAPI] ✅ Product ${isUpdate ? 'updated' : 'saved'} successfully: ${barcode}`);
      console.log(`[ManualProductsAPI] Product name: ${productData?.product_name || 'N/A'}`);
      if (productData?.nutriments?.protein) {
        console.log(`[ManualProductsAPI] Protein value: ${productData.nutriments.protein}g`);
      }

      return res.status(200).json({
        success: true,
        message: `Product data ${isUpdate ? 'updated' : 'submitted'} successfully!`,
        barcode,
        isUpdate,
      });

    } else if (req.method === 'GET') {
      // Get manual product data
      const { barcode } = req.query;

      console.log(`[ManualProductsAPI] GET request received for barcode: ${barcode}`);

      if (!barcode || typeof barcode !== 'string') {
        console.error('[ManualProductsAPI] Missing barcode parameter');
        return res.status(400).json({
          success: false,
          error: 'Missing barcode parameter',
        });
      }

      const productData = await getManualProduct(barcode);
      const product = productData ? {
        ...productData.productData,
        barcode: productData.barcode,
        submittedAt: productData.submittedAt,
        source: productData.source,
      } : null;

      if (!product) {
        console.log(`[ManualProductsAPI] Product not found: ${barcode}`);
        return res.status(200).json({
          success: false,
          product: null,
          message: 'Product not found',
        });
      }

      console.log(`[ManualProductsAPI] ✅ Product found: ${barcode}`);
      console.log(`[ManualProductsAPI] Product name: ${product.product_name || 'N/A'}`);
      if (product.nutriments?.protein) {
        console.log(`[ManualProductsAPI] Protein value: ${product.nutriments.protein}g`);
      }

      return res.status(200).json({
        success: true,
        product,
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('[ManualProductsAPI] ❌ Error:', error);
    console.error('[ManualProductsAPI] Error message:', error?.message);
    console.error('[ManualProductsAPI] Error stack:', error?.stack);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
    });
  }
}
