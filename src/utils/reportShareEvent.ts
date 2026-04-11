/**
 * Optional server-side share funnel (no PII). Uses same backend URL as the rest of the app.
 */

import { getBackendUrl } from '../config/backendConfig';
import { logger } from './logger';

export async function reportShareEventToBackend(payload: {
  barcode: string;
  platform: string;
  itemType: string;
  success: boolean;
}): Promise<void> {
  if (!payload.success) return;

  const base = getBackendUrl();
  if (!base?.trim() || base.includes('YOUR-VERCEL-URL')) return;

  try {
    const url = `${base.replace(/\/$/, '')}/api/share-event`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barcode: payload.barcode,
        platform: payload.platform,
        itemType: payload.itemType,
        t: Date.now(),
      }),
    });
    if (!res.ok) {
      logger.warn('[reportShareEvent] Non-OK response', res.status);
    }
  } catch (e) {
    logger.warn('[reportShareEvent] Failed', e);
  }
}
