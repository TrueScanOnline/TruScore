/**
 * POST /api/off-product-write
 *
 * Retired as a client-controlled relay. Admitted Ingredients & Nutrition
 * evidence creates OFF dispatch work inside /api/evidence-authority.
 * Credentials stay server-side and this route does not call Open Food Facts.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

function handleCORS(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  handleCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  return res.status(403).json({
    success: false,
    error: 'off_write_client_relay_retired',
    status: 'pending_unconfigured',
  });
}
