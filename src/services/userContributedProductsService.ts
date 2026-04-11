// User Contributed Products Service
// Retrieves user-contributed products from Vercel backend
// This ensures all users can access products submitted by other users

import { Product, ProductWithTrustScore } from '../types/product';
import { logger } from '../utils/logger';
import { getManualProduct } from './manualProductService';
import { getBackendUrl, BackendEndpoints } from '../config/backendConfig';
import { powershellLogger } from '../utils/powershellLogger';

/** GET /api/manual-products abort timeout (keep in sync with merge waits below). */
export const USER_CONTRIBUTED_BACKEND_TIMEOUT_MS = 12000;

/**
 * Max time to wait for mergeUserContributedData before scoring/display.
 * Must be >= USER_CONTRIBUTED_BACKEND_TIMEOUT_MS so a cold backend can still return a row.
 */
export const USER_CONTRIBUTED_MERGE_RACE_MS = USER_CONTRIBUTED_BACKEND_TIMEOUT_MS + 2500;

/**
 * First-paint path: do not block the product screen on Vercel manual-products longer than this.
 * Full merge still runs in the background and triggers a follow-up UI update when it completes.
 */
export const USER_CONTRIBUTED_FIRST_PAINT_RACE_MS = 450;

const VERCEL_USER_CONTRIB_KEYS = [
  'manufacturing_places',
  'manufacturing_places_tags',
  'countries',
  'countries_tags',
  'origins',
  'origins_tags',
  'labels_tags',
  'labels_hierarchy',
] as const;

function getManualProductsApi(): string {
  return BackendEndpoints.manualProducts(getBackendUrl());
}

/** True when the URL is not a stable network-reachable image (picker URIs, etc.). */
export function isLocalOnlyImageUrl(url: string | undefined | null): boolean {
  if (url == null || typeof url !== 'string') return true;
  const u = url.trim();
  if (!u) return true;
  if (/^https?:\/\//i.test(u)) return false;
  if (u.startsWith('data:image/')) return false;
  return true;
}

function parseBackendProductPayload(barcode: string, data: Record<string, unknown>): Product | null {
  const root = data as {
    product?: Record<string, unknown>;
    data?: { product?: Record<string, unknown> };
    result?: { product?: Record<string, unknown> };
  };
  const productData =
    root.product || root.data?.product || root.result?.product;

  if (!productData || typeof productData !== 'object') {
    return null;
  }

  const product: Product = {
    barcode: (productData.barcode as string) || barcode,
    image_url: productData.image_url as string | undefined,
    image_front_url:
      (productData.image_front_url as string | undefined) ||
      (productData.image_url as string | undefined),
    manufacturing_places: productData.manufacturing_places as string | undefined,
    manufacturing_places_tags: productData.manufacturing_places_tags as string[] | undefined,
    countries: productData.countries as string | undefined,
    countries_tags: productData.countries_tags as string[] | undefined,
    origins: productData.origins as string | undefined,
    origins_tags: productData.origins_tags as string[] | undefined,
    labels_tags: Array.isArray(productData.labels_tags)
      ? (productData.labels_tags as string[])
      : undefined,
    labels_hierarchy: Array.isArray(productData.labels_hierarchy)
      ? (productData.labels_hierarchy as string[])
      : undefined,
    source: 'user_contributed' as Product['source'],
    created_t: productData.submittedAt
      ? Math.floor(Number(productData.submittedAt) / 1000)
      : undefined,
    last_modified_t: productData.submittedAt
      ? Math.floor(Number(productData.submittedAt) / 1000)
      : undefined,
  } as Product;

  (product as ProductWithTrustScore & { _source?: string; _database?: string })._source = 'BACKEND';
  (product as ProductWithTrustScore & { _source?: string; _database?: string })._database =
    'Vercel Backend API';
  return product;
}

function mergeLocalAndRemoteUserContributed(local: Product, remote: Product): Product {
  const merged = { ...local } as Product;
  for (const key of VERCEL_USER_CONTRIB_KEYS) {
    const v = remote[key as keyof Product];
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    (merged as unknown as Record<string, unknown>)[key] = v;
  }

  const takeRemoteImage =
    isLocalOnlyImageUrl(local.image_url) || (!local.image_url && !!remote.image_url);

  if (takeRemoteImage && remote.image_url) {
    merged.image_url = remote.image_url;
    merged.image_front_url = remote.image_front_url || remote.image_url;
  }

  const m = merged as ProductWithTrustScore & { _source?: string; _database?: string };
  m._source = 'MERGED';
  m._database = 'Local + Vercel Backend API';
  return merged;
}

async function fetchUserContributedFromBackend(barcode: string): Promise<Product | null> {
  const manualProductsApi = getManualProductsApi();

  const retrievalStartTime = Date.now();
  const TIMEOUT_MS = USER_CONTRIBUTED_BACKEND_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${manualProductsApi}?barcode=${encodeURIComponent(barcode)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const retrievalTime = Date.now() - retrievalStartTime;
    const responseText = await response.text();

    powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Vercel GET /api/manual-products complete`, {
      barcode,
      step: 'BACKEND_GET',
      endpoint: manualProductsApi,
      status: response.status,
      responseTime: `${retrievalTime}ms`,
      rawResponsePreview: responseText.substring(0, 500),
    });

    if (!response.ok) {
      powershellLogger.log('WARN', 'USER_CONTRIBUTION', `Vercel manual-products returned non-OK status`, {
        barcode,
        status: response.status,
        statusText: response.statusText,
      });
      return null;
    }

    let data: Record<string, unknown> | null = null;
    try {
      data = JSON.parse(responseText) as Record<string, unknown>;
    } catch (parseError) {
      powershellLogger.log('ERROR', 'USER_CONTRIBUTION', `Failed to parse manual-products JSON`, {
        barcode,
        error: parseError instanceof Error ? parseError.message : String(parseError),
        rawResponse: responseText.substring(0, 1000),
      });
      logger.error('[UserContributedProducts] Failed to parse backend response:', parseError);
      return null;
    }

    if (!data) return null;

    const product = parseBackendProductPayload(barcode, data);
    if (product) {
      powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Vercel user-contribution slice parsed`, {
        barcode,
        success: data.success,
        hasProduct: true,
        hasPhoto: !!product.image_url,
        photoUrl: product.image_url || 'NONE',
        productKeys: Object.keys(
          (data as { product?: Record<string, unknown> }).product || {}
        ),
      });

      if (product.image_url) {
        powershellLogger.log('SUCCESS', 'USER_CONTRIBUTION', `Hero photo URL present on Vercel merge payload`, {
          barcode,
          photoUrlSample: product.image_url.substring(0, 120),
        });
      }
    } else {
      powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Vercel manual-products: no product object in response`, {
        barcode,
        success: data.success,
        responseKeys: Object.keys(data),
      });
    }

    return product;
  } catch (fetchError: unknown) {
    clearTimeout(timeoutId);
    const retrievalTime = Date.now() - retrievalStartTime;
    const err = fetchError as { name?: string; message?: string };

    if (err.name === 'AbortError' || err.message?.includes('aborted')) {
      powershellLogger.log('WARN', 'USER_CONTRIBUTION', `Vercel manual-products request aborted (timeout ${TIMEOUT_MS}ms)`, {
        barcode,
        responseTime: `${retrievalTime}ms`,
      });
      logger.debug(`[UserContributedProducts] Backend request timeout for ${barcode} after ${retrievalTime}ms`);
    } else {
      powershellLogger.log('ERROR', 'USER_CONTRIBUTION', `Vercel manual-products fetch error`, {
        barcode,
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
        responseTime: `${retrievalTime}ms`,
      });
      logger.debug('[UserContributedProducts] Backend unavailable:', fetchError);
    }
    return null;
  }
}

/**
 * Get user-contributed product: local manual entry + Vercel proprietary slice (always fetched in parallel).
 * Merges hosted hero photo and country/cert fields from Vercel even when a local manual row exists.
 */
export async function getUserContributedProduct(barcode: string): Promise<Product | null> {
  powershellLogger.log('INFO', 'USER_CONTRIBUTION', `User-contributed retrieval started (parallel: local AsyncStorage + Vercel)`, {
    barcode,
    step: 'RETRIEVAL_START',
    timestamp: new Date().toISOString(),
  });

  try {
    const [localProduct, remoteProduct] = await Promise.all([
      getManualProduct(barcode),
      fetchUserContributedFromBackend(barcode),
    ]);

    if (localProduct) {
      const lp = localProduct as ProductWithTrustScore & { _source?: string; _database?: string };
      lp._source = 'LOCAL';
      lp._database = 'Local Storage (SQLite/AsyncStorage)';
    }

    if (!localProduct && !remoteProduct) {
      powershellLogger.log('INFO', 'USER_CONTRIBUTION', `No user-contributed product found`, {
        barcode,
        checkedSources: ['LOCAL', 'VERCEL'],
        result: 'NOT_FOUND',
      });
      return null;
    }

    if (localProduct && remoteProduct) {
      const merged = mergeLocalAndRemoteUserContributed(localProduct, remoteProduct);
      powershellLogger.log('SUCCESS', 'USER_CONTRIBUTION', `Merged LOCAL + VERCEL user contribution`, {
        barcode,
        step: 'MERGE_COMPLETE',
        localPhotoWasDeviceOnly: isLocalOnlyImageUrl(localProduct.image_url),
        remoteHasPhoto: !!remoteProduct.image_url,
        finalPhotoIsHosted: !!merged.image_url && !isLocalOnlyImageUrl(merged.image_url),
        finalPhotoUrl: merged.image_url || 'NONE',
      });
      return merged;
    }

    if (localProduct) {
      powershellLogger.log('SUCCESS', 'USER_CONTRIBUTION', `User-contributed from LOCAL only (Vercel empty or unreachable)`, {
        barcode,
        hasPhoto: !!localProduct.image_url,
        photoUrl: localProduct.image_url || 'NONE',
        deviceOnlyPhoto: isLocalOnlyImageUrl(localProduct.image_url),
      });
      logger.debug(`[UserContributedProducts] Found local manual product: ${barcode}`);
      return localProduct;
    }

    powershellLogger.log('SUCCESS', 'USER_CONTRIBUTION', `User-contributed from VERCEL only`, {
      barcode,
      hasPhoto: !!remoteProduct!.image_url,
      photoUrl: remoteProduct!.image_url || 'NONE',
    });
    logger.info(`[UserContributedProducts] Found user-contributed product from backend: ${barcode}`);
    return remoteProduct!;
  } catch (error) {
    logger.error('[UserContributedProducts] Error getting user-contributed product:', error);
    return null;
  }
}

/**
 * Check if a product exists in user-contributed databases
 * This is used to avoid showing "UNKNOWN PRODUCT" when user data exists
 */
export async function hasUserContributedProduct(barcode: string): Promise<boolean> {
  try {
    const product = await getUserContributedProduct(barcode);
    return product !== null;
  } catch (error) {
    return false;
  }
}
