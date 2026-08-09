// Product preview API for redirect page — TruScore from shared pillar engine (same as app).

import { VercelRequest, VercelResponse } from '@vercel/node';

import { offJsonProductToTruescan } from '../lib/offToTruescanProduct';
/** Resolved via `truescan-src/` (synced from repo root `src/` before deploy — see syncTruescanSrc.cjs). */
import { calculateBodyPillar } from '../truescan-src/lib/truscoreEngine/pillars/bodyPillar';
import { calculatePlanetPillar } from '../truescan-src/lib/truscoreEngine/pillars/planetPillar';
import { calculateEthicsPillar } from '../truescan-src/lib/truscoreEngine/pillars/ethicsPillar';
import { calculateOpenPillar } from '../truescan-src/lib/truscoreEngine/pillars/openPillar';
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
  trust_score?: number | null;
  trust_score_breakdown?: {
    body: number;
    planet: number;
    ethics: number;
    open: number;
  };
  nutriments?: any;
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
    const offUrl = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
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

        let trustScore: number | null = null;
        let trustScoreBreakdown: ProductPreview['trust_score_breakdown'];

        try {
          // S-04: Planet v19 does not require legacy CSV databases; skip vestigial init.
          const truescanProduct = offJsonProductToTruescan(barcode, offProduct);
          const body = calculateBodyPillar(truescanProduct).score;
          const planet = calculatePlanetPillar(truescanProduct).score;
          const ethics = calculateEthicsPillar(truescanProduct).score;
          const open = calculateOpenPillar(truescanProduct).score;

          trustScore = Math.max(0, Math.min(100, Math.round(body + planet + ethics + open)));
          trustScoreBreakdown = { body, planet, ethics, open };
        } catch (e) {
          console.error('[product-preview] Pillar calculation failed:', e);
        }

        const preview: ProductPreview = {
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
          trust_score: trustScore,
          trust_score_breakdown: trustScoreBreakdown,
          nutriments: offProduct.nutriments,
          ingredients_text:
            typeof offProduct.ingredients_text === 'string' ? offProduct.ingredients_text : undefined,
          nova_group:
            typeof offProduct.nova_group === 'number'
              ? offProduct.nova_group
              : typeof offProduct.nova_group === 'string'
                ? parseInt(offProduct.nova_group, 10)
                : undefined,
          ecoscore_grade:
            typeof offProduct.ecoscore_grade === 'string' ? offProduct.ecoscore_grade : undefined,
          categories: typeof offProduct.categories === 'string' ? offProduct.categories : undefined,
        };

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
        const preview: ProductPreview = {
          barcode,
          product_name: item.title,
          brands: item.brand,
          image_url: item.images && item.images.length > 0 ? item.images[0] : undefined,
          trust_score: null,
        };

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
