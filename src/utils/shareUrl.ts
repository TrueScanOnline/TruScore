import type { ShareableItem, SharePlatform } from '../features/sharing/types';

export const SHARE_QUERY_CTX = 'ctx';
export const SHARE_QUERY_SRC = 'src';
export const SHARE_QUERY_REF = 'ref';

/**
 * Interim public share-web host while truescan.app TLS/DNS is unusable for testers.
 * Override with EXPO_PUBLIC_SHARE_WEB_ORIGIN (no trailing slash).
 */
export const DEFAULT_SHARE_WEB_ORIGIN = 'https://truscoreapi.vercel.app';

export const KNOWN_SHARE_WEB_HOSTS = new Set([
  'truescan.app',
  'truscoreapi.vercel.app',
  'truscoreapi-uat.vercel.app',
]);

export type ShareLinkSource = SharePlatform | 'copy' | 'image';

function stripTrailingSlash(origin: string): string {
  return origin.replace(/\/+$/, '');
}

/** Public HTTPS origin used in share captions and universal links. */
export function getShareWebOrigin(): string {
  const raw =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SHARE_WEB_ORIGIN) ||
    DEFAULT_SHARE_WEB_ORIGIN;
  const trimmed = String(raw || '').trim();
  if (!trimmed) return DEFAULT_SHARE_WEB_ORIGIN;
  try {
    const u = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    if (u.protocol !== 'https:') return DEFAULT_SHARE_WEB_ORIGIN;
    return stripTrailingSlash(`${u.protocol}//${u.host}`);
  } catch {
    return DEFAULT_SHARE_WEB_ORIGIN;
  }
}

/** Host-only label printed on the share card (no scheme). */
export function formatShareLinkLabel(barcode: string): string {
  const host = getShareWebOrigin().replace(/^https:\/\//i, '');
  return `${host}/barcode/${barcode}`;
}

export function isShareWebHostname(hostname: string | null | undefined): boolean {
  if (!hostname) return false;
  return KNOWN_SHARE_WEB_HOSTS.has(hostname.toLowerCase());
}

export function buildShareUrl(
  barcode: string,
  options?: {
    context?: ShareableItem;
    source?: ShareLinkSource;
    ref?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }
): string {
  const base = `${getShareWebOrigin()}/barcode/${encodeURIComponent(barcode)}`;
  if (!options) return base;

  const params = new URLSearchParams();
  if (options.context) params.set(SHARE_QUERY_CTX, options.context);
  if (options.source) params.set(SHARE_QUERY_SRC, String(options.source));
  if (options.ref) params.set(SHARE_QUERY_REF, options.ref);
  if (options.utmSource) params.set('utm_source', options.utmSource);
  if (options.utmMedium) params.set('utm_medium', options.utmMedium);
  if (options.utmCampaign) params.set('utm_campaign', options.utmCampaign);

  const q = params.toString();
  return q ? `${base}?${q}` : base;
}

export function parseShareQueryParams(
  queryParams: Record<string, string | string[] | undefined> | null | undefined
): { ctx?: string; src?: string; ref?: string } {
  const pick = (key: string): string | undefined => {
    if (!queryParams) return undefined;
    const v = queryParams[key];
    if (typeof v === 'string') return v;
    if (Array.isArray(v) && v[0] != null) return String(v[0]);
    return undefined;
  };
  return {
    ctx: pick('ctx'),
    src: pick('src'),
    ref: pick('ref'),
  };
}
