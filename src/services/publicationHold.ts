/**
 * Client fetch for administrative publication holds.
 * Distinct from Rateability NR / Checking.
 */

import { getBackendUrl } from '../config/backendConfig';
import { logger } from '../utils/logger';

export type PublicationHoldClientState =
  | { status: 'none'; barcode: string }
  | { status: 'held'; barcode: string; kind: 'administrative_hold' }
  | { status: 'unavailable'; barcode: string; kind: 'hold_state_unavailable' };

const cache = new Map<string, { at: number; state: PublicationHoldClientState }>();
const CACHE_TTL_MS = 60_000;

function normalizeBarcode(raw: string): string {
  return String(raw || '').replace(/\D/g, '');
}

export async function fetchPublicationHold(barcodeRaw: string): Promise<PublicationHoldClientState> {
  const barcode = normalizeBarcode(barcodeRaw);
  if (barcode.length < 8 || barcode.length > 14) {
    return { status: 'unavailable', barcode, kind: 'hold_state_unavailable' };
  }

  const cached = cache.get(barcode);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.state;
  }

  const base = getBackendUrl();
  if (!base?.trim() || base.includes('YOUR-VERCEL-URL')) {
    // No backend configured locally — default no hold so Expo Go scanning continues.
    const state: PublicationHoldClientState = { status: 'none', barcode };
    cache.set(barcode, { at: Date.now(), state });
    return state;
  }

  try {
    const url = `${base.replace(/\/$/, '')}/api/publication-hold?barcode=${encodeURIComponent(barcode)}`;
    const res = await fetch(url, { method: 'GET' });
    const json = (await res.json().catch(() => null)) as {
      held?: boolean;
      kind?: string;
      barcode?: string;
    } | null;

    if (!res.ok || !json || typeof json.held !== 'boolean') {
      const state: PublicationHoldClientState = {
        status: 'unavailable',
        barcode,
        kind: 'hold_state_unavailable',
      };
      cache.set(barcode, { at: Date.now(), state });
      return state;
    }

    const state: PublicationHoldClientState = json.held
      ? { status: 'held', barcode, kind: 'administrative_hold' }
      : { status: 'none', barcode };
    cache.set(barcode, { at: Date.now(), state });
    return state;
  } catch (e) {
    logger.warn('[publicationHold] fetch failed', e);
    const state: PublicationHoldClientState = {
      status: 'unavailable',
      barcode,
      kind: 'hold_state_unavailable',
    };
    cache.set(barcode, { at: Date.now(), state });
    return state;
  }
}

/** Test helper — clear in-memory cache. */
export function clearPublicationHoldCache(): void {
  cache.clear();
}

export function shouldWithholdConsumerPublication(state: PublicationHoldClientState): boolean {
  return state.status === 'held' || state.status === 'unavailable';
}
