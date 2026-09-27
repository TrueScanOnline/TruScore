/**
 * POST /api/off-product-write
 *
 * Server-side Open Food Facts write for admitted packet fields.
 * Credentials are read only from OFF_WRITE_USER_ID and OFF_WRITE_PASSWORD.
 * A successful OFF response is status "sent". It does not mean the edit is
 * visible on Open Food Facts and it does not create a Nutri-Score or NOVA group.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { establishNutrition, projectOffWriteFields } from '../../../src/ingredientsNutrition/nutritionSchema';

const OFF_EDIT_API = 'https://world.openfoodfacts.org/cgi/product_jqm2.pl';

function handleCORS(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  handleCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const body = asRecord(req.body) || {};
  const barcode = typeof body.barcode === 'string' ? body.barcode.trim() : '';
  if (!/^\d{8,14}$/.test(barcode)) {
    return res.status(400).json({ success: false, error: 'Valid barcode required' });
  }
  const amounts = Array.isArray(body.amounts) ? body.amounts : [];
  const nutrition = establishNutrition({
    basis: typeof body.basis === 'string' ? body.basis : undefined,
    amounts: amounts.filter((item) => item && typeof item === 'object') as Array<{
      attribute?: string;
      value?: unknown;
      unit?: string;
    }>,
  });
  const fields = projectOffWriteFields({
    barcode,
    ingredientsText: typeof body.ingredientsText === 'string' ? body.ingredientsText : undefined,
    nutrition,
  });
  if (!fields) {
    return res.status(400).json({ success: false, error: 'off_dispatch_has_no_established_fields' });
  }

  const userId = process.env.OFF_WRITE_USER_ID?.trim();
  const password = process.env.OFF_WRITE_PASSWORD?.trim();
  if (!userId || !password) {
    return res.status(503).json({
      success: false,
      status: 'failed_retryable',
      error: 'off_write_credentials_unavailable',
    });
  }

  const form = new URLSearchParams(fields);
  form.set('user_id', userId);
  form.set('password', password);
  try {
    const response = await fetch(OFF_EDIT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });
    if (!response.ok) {
      return res.status(502).json({
        success: false,
        status: 'failed_retryable',
        error: `off_http_${response.status}`,
      });
    }
    return res.status(200).json({
      success: true,
      status: 'sent',
      fields,
      visibleOnOff: false,
      derivedClassification: false,
    });
  } catch {
    return res.status(502).json({
      success: false,
      status: 'failed_retryable',
      error: 'off_dispatch_failed',
    });
  }
}
