/**
 * Allowlisted Open Food Facts product-read host.
 * Ordinary catalogue reads, including UAT, use world.openfoodfacts.org.
 * world.openfoodfacts.net is not a product source.
 */

export const OFF_PRODUCTION_READ_HOST = 'world.openfoodfacts.org';

const ALLOWED_READ_HOSTS = new Set([OFF_PRODUCTION_READ_HOST]);

/** Every environment reads the live catalogue host. */
export function offProductReadHost(_environment?: string | null): string {
  return OFF_PRODUCTION_READ_HOST;
}

export function offProductApiUrl(barcode: string, environment?: string | null, version: 'v0' | 'v2' = 'v2'): string {
  const host = offProductReadHost(environment);
  if (!ALLOWED_READ_HOSTS.has(host)) return `https://${OFF_PRODUCTION_READ_HOST}/api/${version}/product/${barcode}.json`;
  return `https://${host}/api/${version}/product/${barcode}.json`;
}
