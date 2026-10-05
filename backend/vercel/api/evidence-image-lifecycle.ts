import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sweepEvidenceImageLifecycle } from '../lib/evidenceImageBlob';

/**
 * Daily retention for unfinalised uploads (24h) and uncited private images (30 days).
 * Admitted evidence is referenced by evidence_versions and is left in place.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ success: false });
  const secret = process.env.CRON_SECRET?.trim();
  const header = req.headers.authorization;
  if (!secret || header !== `Bearer ${secret}`) return res.status(401).json({ success: false });
  const result = await sweepEvidenceImageLifecycle();
  return res.status(200).json({ success: true, ...result });
}
