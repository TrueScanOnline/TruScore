import type { ShareableItem, SharePlatform } from '../features/sharing/types';

export const SHARE_QUERY_CTX = 'ctx';
export const SHARE_QUERY_SRC = 'src';
export const SHARE_QUERY_REF = 'ref';

export type ShareLinkSource = SharePlatform | 'copy' | 'image';

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
  const base = `https://truescan.app/barcode/${encodeURIComponent(barcode)}`;
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
