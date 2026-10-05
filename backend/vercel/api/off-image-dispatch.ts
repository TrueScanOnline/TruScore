import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dispatchOffImage } from '../lib/offImageDispatch';

function handleCORS(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  handleCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, reason: 'method_not_allowed' });
  const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
  const result = await dispatchOffImage({
    barcode: typeof body.barcode === 'string' ? body.barcode : '',
    imageField: typeof body.imageField === 'string' ? body.imageField : '',
    imageBase64: typeof body.imageBase64 === 'string' ? body.imageBase64 : '',
    mimeType: typeof body.mimeType === 'string' ? body.mimeType : 'image/jpeg',
  });
  return res.status(result.ok ? 200 : result.status).json(
    result.ok ? { ok: true, imageUrl: result.imageUrl } : { ok: false, reason: result.reason }
  );
}
