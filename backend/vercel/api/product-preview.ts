// Public product preview. Identity and catalogue fields only.
// trust_score and trust_score_breakdown are always JSON null: this route has no
// server-verifiable settled/Rated publication snapshot, so internal pillar arithmetic is not exposed.

import { VercelRequest, VercelResponse } from '@vercel/node';

import { toPublicProductPreview } from '../lib/publicPreviewContract';
import { offProductApiUrl } from '../truescan-src/services/offReadTarget';
/** Rewritten from /api/share-event (same serverless function on Hobby). */
function handleShareEventRoute(req: VercelRequest, res: VercelResponse): void | VercelResponse {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const body = req.body as Record<string, unknown> | undefined;
  const barcode = typeof body?.barcode === 'string' ? body.barcode : '';
  if (!barcode || !/^\d{8,14}$/.test(barcode)) {
    return res.status(400).json({ error: 'Invalid barcode' });
  }

  // eslint-disable-next-line no-console -- intentional serverless telemetry
  console.log(
    '[share-event]',
    JSON.stringify({
      barcode,
      platform: body?.platform,
      itemType: body?.itemType,
      t: body?.t,
    })
  );

  return res.status(204).end();
}

function isShareEventRewrite(req: VercelRequest): boolean {
  return req.query.__share_event === '1' || req.query.__share_event === 'true';
}

interface ProductPreview {
  barcode: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  image_url?: string;
  /** Always null on this public route. See publicPreviewContract.ts. */
  trust_score: null;
  /** Always null on this public route. See publicPreviewContract.ts. */
  trust_score_breakdown: null;
  nutriments?: unknown;
  ingredients_text?: string;
  nova_group?: number;
  ecoscore_grade?: string;
  categories?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (isShareEventRewrite(req)) {
    return handleShareEventRoute(req, res);
  }

  const { barcode } = req.query;

  if (!barcode || typeof barcode !== 'string') {
    return res.status(400).json({ error: 'Invalid barcode' });
  }

  try {
    const offUrl = offProductApiUrl(barcode, process.env.RVEEL_EVIDENCE_AUTHORITY_ENV, 'v2');
    const offResponse = await fetch(offUrl, {
      headers: {
        'User-Agent': 'Rveel/1.0.0',
      },
    });

    if (offResponse.ok) {
      const offData = (await offResponse.json()) as {
        status?: number;
        product?: Record<string, unknown>;
      };
      if (offData.status === 1 && offData.product) {
        const offProduct = offData.product;

        const novaGroup =
          typeof offProduct.nova_group === 'number'
            ? offProduct.nova_group
            : typeof offProduct.nova_group === 'string'
              ? parseInt(offProduct.nova_group, 10)
              : undefined;

        const preview: ProductPreview = toPublicProductPreview({
          barcode,
          product_name:
            typeof offProduct.product_name === 'string'
              ? offProduct.product_name
              : typeof offProduct.product_name_en === 'string'
                ? offProduct.product_name_en
                : undefined,
          product_name_en:
            typeof offProduct.product_name_en === 'string' ? offProduct.product_name_en : undefined,
          brands: typeof offProduct.brands === 'string' ? offProduct.brands : undefined,
          image_url:
            (typeof offProduct.image_url === 'string' && offProduct.image_url) ||
            (typeof offProduct.image_front_url === 'string' && offProduct.image_front_url) ||
            (typeof offProduct.image_front_small_url === 'string' && offProduct.image_front_small_url) ||
            undefined,
          nutriments: offProduct.nutriments,
          ingredients_text:
            typeof offProduct.ingredients_text === 'string' ? offProduct.ingredients_text : undefined,
          nova_group: typeof novaGroup === 'number' && Number.isFinite(novaGroup) ? novaGroup : undefined,
          ecoscore_grade:
            typeof offProduct.ecoscore_grade === 'string' ? offProduct.ecoscore_grade : undefined,
          categories: typeof offProduct.categories === 'string' ? offProduct.categories : undefined,
        });

        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.status(200).json(preview);
      }
    }

    const upcUrl = `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`;
    const upcResponse = await fetch(upcUrl);

    if (upcResponse.ok) {
      const upcData = (await upcResponse.json()) as {
        items?: Array<{ title?: string; brand?: string; images?: string[] }>;
      };
      if (upcData.items && upcData.items.length > 0) {
        const item = upcData.items[0];
        const preview: ProductPreview = toPublicProductPreview({
          barcode,
          product_name: item.title,
          brands: item.brand,
          image_url: item.images && item.images.length > 0 ? item.images[0] : undefined,
        });

        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.status(200).json(preview);
      }
    }

    return res.status(404).json({ error: 'Product not found' });
  } catch (error) {
    console.error('Error fetching product preview:', error);
    return res.status(500).json({ error: 'Failed to fetch product data' });
  }
}
