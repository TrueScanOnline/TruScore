/**
 * Allowlisted Open Food Facts product-read host.
 * Unset or unknown environments stay on production. UAT is the only staging host.
 */

export const OFF_PRODUCTION_READ_HOST = 'world.openfoodfacts.org';
export const OFF_UAT_READ_HOST = 'world.openfoodfacts.net';

const ALLOWED_READ_HOSTS = new Set([OFF_PRODUCTION_READ_HOST, OFF_UAT_READ_HOST]);

/** Production unless the caller explicitly names the UAT environment. */
export function offProductReadHost(environment?: string | null): string {
  if (environment === 'uat') return OFF_UAT_READ_HOST;
  return OFF_PRODUCTION_READ_HOST;
}

export function offProductApiUrl(barcode: string, environment?: string | null, version: 'v0' | 'v2' = 'v2'): string {
  const host = offProductReadHost(environment);
  if (!ALLOWED_READ_HOSTS.has(host)) return `https://${OFF_PRODUCTION_READ_HOST}/api/${version}/product/${barcode}.json`;
  return `https://${host}/api/${version}/product/${barcode}.json`;
}
