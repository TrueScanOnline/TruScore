/**
 * Client fetch for administrative publication holds.
 * Distinct from Rateability NR / Checking.
 *
 * Unresolved / pending / unavailable → withhold disputed assessment publication.
 * Never treat missing backend as confirmed "no hold" on store/public runtimes.
 */

import Constants from 'expo-constants';
import { getBackendUrl } from '../config/backendConfig';
import { logger } from '../utils/logger';

export type PublicationHoldClientState =
  | { status: 'pending'; barcode: string }
  | { status: 'none'; barcode: string }
  | { status: 'held'; barcode: string; kind: 'administrative_hold' }
  | { status: 'unavailable'; barcode: string; kind: 'hold_state_unavailable' };

const cache = new Map<string, { at: number; state: PublicationHoldClientState }>();
const CACHE_TTL_NONE_MS = 30_000;
const CACHE_TTL_HELD_MS = 15_000;
const CACHE_TTL_UNAVAILABLE_MS = 10_000;

function normalizeBarcode(raw: string): string {
  return String(raw || '').replace(/\D/g, '');
}

function isStoreReleaseRuntime(): boolean {
  const raw = Constants.expoConfig?.extra?.storeRelease;
  return raw === '1' || raw === 1 || raw === true;
}

/** Local/UAT may opt into optional hold checks only when explicitly entitled. */
function isPublicationHoldOptional(): boolean {
  if (isStoreReleaseRuntime()) return false;
  const raw = Constants.expoConfig?.extra?.publicationHoldOptional;
  return raw === '1' || raw === 1 || raw === true;
}

function cacheTtl(state: PublicationHoldClientState): number {
  if (state.status === 'held') return CACHE_TTL_HELD_MS;
  if (state.status === 'unavailable' || state.status === 'pending') return CACHE_TTL_UNAVAILABLE_MS;
  return CACHE_TTL_NONE_MS;
}

export function initialPublicationHoldState(barcodeRaw: string): PublicationHoldClientState {
  return { status: 'pending', barcode: normalizeBarcode(barcodeRaw) };
}

export async function fetchPublicationHold(
  barcodeRaw: string,
  options?: { bypassCache?: boolean }
): Promise<PublicationHoldClientState> {
  const barcode = normalizeBarcode(barcodeRaw);
  if (barcode.length < 8 || barcode.length > 14) {
    return { status: 'unavailable', barcode, kind: 'hold_state_unavailable' };
  }

  if (!options?.bypassCache) {
    const cached = cache.get(barcode);
    if (cached && Date.now() - cached.at < cacheTtl(cached.state) && cached.state.status !== 'pending') {
      return cached.state;
    }
  }

  const base = getBackendUrl();
  if (!base?.trim() || base.includes('YOUR-VERCEL-URL')) {
    // Missing backend: never confirm "no hold" on store/public builds.
    const state: PublicationHoldClientState = isPublicationHoldOptional()
      ? { status: 'none', barcode }
      : { status: 'unavailable', barcode, kind: 'hold_state_unavailable' };
    cache.set(barcode, { at: Date.now(), state });
    return state;
  }

  try {
    const url = `${base.replace(/\/$/, '')}/api/publication-hold?barcode=${encodeURIComponent(barcode)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    });
    const json = (await res.json().catch(() => null)) as {
      held?: boolean;
      kind?: string;
      barcode?: string;
    } | null;

    if (!res.ok || !json || typeof json.held !== 'boolean') {
      const err = (json as { error?: string } | null)?.error;
      // Closed UAT only: unconfigured store may fail-open when explicitly entitled.
      // Store/public builds never take this path (optional is false).
      if (
        res.status === 503 &&
        err === 'hold_store_unconfigured' &&
        isPublicationHoldOptional()
      ) {
        const state: PublicationHoldClientState = { status: 'none', barcode };
        cache.set(barcode, { at: Date.now(), state });
        return state;
      }
      const state: PublicationHoldClientState = {
        status: 'unavailable',
        barcode,
        kind: 'hold_state_unavailable',
      };
      cache.set(barcode, { at: Date.now(), state });
      return state;
    }

    // Ignore responses that do not match the requested barcode digits.
    if (json.barcode && normalizeBarcode(json.barcode) !== barcode) {
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

/** Force a fresh hold check before sharing assessment content. */
export async function revalidatePublicationHold(barcodeRaw: string): Promise<PublicationHoldClientState> {
  const barcode = normalizeBarcode(barcodeRaw);
  cache.delete(barcode);
  return fetchPublicationHold(barcode, { bypassCache: true });
}

export function clearPublicationHoldCache(): void {
  cache.clear();
}

export function shouldWithholdConsumerPublication(
  state: PublicationHoldClientState | null | undefined
): boolean {
  if (!state) return true;
  return state.status === 'held' || state.status === 'unavailable' || state.status === 'pending';
}
