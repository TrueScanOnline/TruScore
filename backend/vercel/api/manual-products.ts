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
  getPhotos,
} from '../lib/database';
import { barcodeLookupKeys, canonicalBarcodeForStorage } from '../lib/barcodeLookupKeys';

/** Non-scoring keys still accepted on manual-products. Origin/certs are governed evidence, not Product fields. */
const PROPRIETARY_KEYS = [
  'allergens_tags',
  'additives_tags',
] as const;

const SCORING_LEAK_KEYS = [
  'manufacturing_places',
  'manufacturing_places_tags',
  'countries',
  'countries_tags',
  'origins',
  'origins_tags',
  'labels_tags',
  'labels_hierarchy',
] as const;

function pickIncomingProprietary(body: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!body || typeof body !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const key of PROPRIETARY_KEYS) {
    if (Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined) {
      out[key] = body[key];
    }
  }
  return out;
}

function pickStoredProprietary(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of PROPRIETARY_KEYS) {
    if (row[key] !== undefined && row[key] !== null) {
      out[key] = row[key];
    }
  }
  for (const leak of SCORING_LEAK_KEYS) {
    delete out[leak];
  }
  return out;
}

/** Strip legacy non-proprietary fields from DB rows before returning to the app. */
function sanitizeProductForApi(
  p: Record<string, unknown> | null,
  barcode: string,
  submittedAt: unknown,
  source: unknown
): Record<string, unknown> | null {
  if (!p || typeof p !== 'object') return null;
  const base = pickStoredProprietary(p);
  return {
    ...base,
    barcode,
    submittedAt,
    source,
  };
}

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

      if (!barcode || productData === undefined || productData === null || typeof productData !== 'object') {
        console.error('[ManualProductsAPI] Missing required fields:', { barcode: !!barcode, productData: productData != null });
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: barcode, productData',
        });
      }

      const lookupKeys = barcodeLookupKeys(String(barcode));
      const canonicalBarcode = canonicalBarcodeForStorage(String(barcode));

      // Match existing row by any GTIN variant (UPC-A vs EAN-13)
      let existingProduct: Awaited<ReturnType<typeof getManualProduct>> = null;
      for (const k of lookupKeys) {
        existingProduct = await getManualProduct(k);
        if (existingProduct) break;
      }
      const isUpdate = existingProduct !== null;

      const parseProductData = (row: any): Record<string, unknown> => {
        if (!row?.productData) return {};
        return typeof row.productData === 'string' ? JSON.parse(row.productData) : row.productData;
      };

      const existingData = isUpdate ? parseProductData(existingProduct) : {};
      const existingProprietary = pickStoredProprietary(existingData);
      const incomingProprietary = pickIncomingProprietary(productData as Record<string, unknown>);
      const mergedProprietary = { ...existingProprietary, ...incomingProprietary };
      const preservedHistorical: Record<string, unknown> = {};
      for (const key of SCORING_LEAK_KEYS) {
        if (existingData[key] !== undefined && existingData[key] !== null) {
          preservedHistorical[key] = existingData[key];
        }
      }
      const mergedPayload = {
        ...preservedHistorical,
        ...mergedProprietary,
        barcode: canonicalBarcode,
        submittedAt: Date.now(),
        source: 'user_contributed',
      };

      console.log(
        `[ManualProductsAPI] ${isUpdate ? 'UPDATE' : 'NEW'} submission for barcode: ${canonicalBarcode} (incoming: ${barcode}, variants: ${lookupKeys.join(',')})`
      );
      console.log(`[ManualProductsAPI] Proprietary keys stored: ${Object.keys(mergedProprietary).join(', ') || '(none)'}`);

      await saveManualProduct(canonicalBarcode, mergedPayload);

      console.log(`[ManualProductsAPI] ✅ Product ${isUpdate ? 'updated' : 'saved'} successfully: ${canonicalBarcode}`);

      return res.status(200).json({
        success: true,
        message: `Product data ${isUpdate ? 'updated' : 'submitted'} successfully!`,
        barcode: canonicalBarcode,
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

      const gtinKeys = barcodeLookupKeys(barcode);
      const canonical = canonicalBarcodeForStorage(barcode);

      let dbResult: Awaited<ReturnType<typeof getManualProduct>> = null;
      for (const k of gtinKeys) {
        dbResult = await getManualProduct(k);
        if (dbResult) break;
      }
      // dbResult structure: { barcode, productData: {...JSONB data...}, submittedAt, source }
      // The productData field contains the actual product fields as JSONB
      // Note: If productData is a string (shouldn't happen with Postgres JSONB), we may need to parse it
      const productDataJson = typeof dbResult?.productData === 'string' 
        ? JSON.parse(dbResult.productData) 
        : dbResult?.productData;
      
      let product = productDataJson
        ? sanitizeProductForApi(
            productDataJson as Record<string, unknown>,
            canonical,
            dbResult.submittedAt,
            dbResult.source
          )
        : null;

      // Community pack/front photo stored via /api/upload-photo (photos table) — merge if manual JSON lacks image
      const mergeFrontPhotoFromTable = async (
        p: Record<string, unknown> | null
      ): Promise<Record<string, unknown> | null> => {
        try {
          let latest: Record<string, unknown> | undefined;
          for (const k of gtinKeys) {
            const rows = await getPhotos(k, 'front');
            if (rows[0]) {
              latest = rows[0] as Record<string, unknown>;
              break;
            }
          }
          if (!latest) return p;
          const url =
            (latest.photo_url as string) ||
            (latest.photoUrl as string) ||
            (latest.url as string);
          if (typeof url !== 'string' || !url.trim()) return p;
          const u = url.trim();
          if (!u.startsWith('http') && !u.startsWith('data:')) return p;
          const next: Record<string, unknown> = { ...(p || {}), barcode: canonical };
          if (!next.image_url) {
            next.image_url = u;
            next.image_front_url = u;
          }
          return next;
        } catch (e) {
          console.warn('[ManualProductsAPI] getPhotos merge failed:', e);
          return p;
        }
      };

      if (!product) {
        const photoOnly = await mergeFrontPhotoFromTable(null);
        if (photoOnly && photoOnly.image_url) {
          res.setHeader('Cache-Control', 'public, max-age=60');
          console.log(`[ManualProductsAPI] ✅ Photo-only contribution for barcode: ${canonical} (query: ${barcode})`);
          return res.status(200).json({
            success: true,
            product: {
              ...photoOnly,
              source: 'user_contributed',
            },
          });
        }
        console.log(`[ManualProductsAPI] Product not found: ${barcode} (tried keys: ${gtinKeys.join(',')})`);
        res.setHeader('Cache-Control', 'public, max-age=15');
        return res.status(200).json({
          success: false,
          product: null,
          message: 'Product not found',
        });
      }

      const merged = await mergeFrontPhotoFromTable(product);
      product = merged ?? product;
      if (!product) {
        return res.status(500).json({
          success: false,
          error: 'Internal error: manual product merge failed',
        });
      }

      res.setHeader(
        'Cache-Control',
        'public, max-age=120'
      );

      console.log(`[ManualProductsAPI] ✅ Product found: ${canonical} (query: ${barcode})`);
      console.log(
        `[ManualProductsAPI] Proprietary keys in response: ${Object.keys(product).filter((k) => !['barcode', 'submittedAt', 'source', 'image_url', 'image_front_url'].includes(k)).join(', ')}`
      );

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
