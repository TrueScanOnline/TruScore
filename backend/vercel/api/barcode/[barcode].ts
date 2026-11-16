// Share-card destination for https://truescan.app/barcode/{barcode}
// Shows the shared product in the Rveel emerald page, then offers the app.

import { VercelRequest, VercelResponse } from '@vercel/node';
import { renderShareLandingHtml } from '../../lib/shareLandingHtml';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { barcode } = req.query;

  if (!barcode || typeof barcode !== 'string') {
    return res.status(400).send('Invalid barcode');
  }

  const host = typeof req.headers['x-forwarded-host'] === 'string'
    ? req.headers['x-forwarded-host']
    : typeof req.headers.host === 'string'
      ? req.headers.host
      : 'truscoreapi.vercel.app';
  const proto = typeof req.headers['x-forwarded-proto'] === 'string'
    ? req.headers['x-forwarded-proto']
    : 'https';
  const origin = `${proto}://${host}`;

  let productData: any = null;
  let heldPreview = false;
  try {
    // Prefer the same public host the receiver opened, then explicit preview base, then prod.
    const previewBase =
      process.env.PRODUCT_PREVIEW_BASE_URL ||
      origin ||
      'https://truscoreapi.vercel.app';
    const productResponse = await fetch(
      `${previewBase.replace(/\/$/, '')}/api/product-preview?barcode=${encodeURIComponent(barcode)}`,
      { headers: { 'Cache-Control': 'no-cache' } }
    );
    if (productResponse.ok) {
      productData = await productResponse.json();
      heldPreview =
        typeof productData?.publication_hold === 'string' &&
        productData.publication_hold.length > 0;
      if (heldPreview) {
        // Do not redistribute held assessment-adjacent preview fields on the teaser.
        productData = {
          barcode,
          product_name: productData.product_name,
          product_name_en: productData.product_name_en,
          brands: productData.brands,
          trust_score: null,
          trust_score_breakdown: null,
          publication_hold: productData.publication_hold,
        };
      }
    } else if (productResponse.status === 503) {
      heldPreview = true;
      productData = {
        barcode,
        trust_score: null,
        trust_score_breakdown: null,
        publication_hold: 'hold_state_unavailable',
      };
    }
  } catch (error) {
    console.error('Error fetching product data:', error);
    // Fail closed for teaser media when preview host is inconsistent.
    heldPreview = true;
    productData = {
      barcode,
      trust_score: null,
      trust_score_breakdown: null,
      publication_hold: 'hold_state_unavailable',
    };
  }

  const html = renderShareLandingHtml({
    barcode,
    query: req.query as Record<string, string | string[] | undefined>,
    productData,
    appStoreId: process.env.APP_STORE_ID || '',
    origin,
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', heldPreview ? 'no-store' : 'public, max-age=60, must-revalidate');
  return res.status(200).send(html);
}
