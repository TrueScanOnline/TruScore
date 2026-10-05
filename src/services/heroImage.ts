/**
 * Result hero selection.
 * A catalogue image wins. A user photo is only the bridge while no catalogue image is available.
 * Remembered contribution URLs are not catalogue images, so a later OFF/manufacturer image can replace them.
 */

export type HeroImageFields = {
  image_front_small_url?: string | null;
  image_front_url?: string | null;
  image_url?: string | null;
};

export function isHttpImageUrl(url: string | null | undefined): boolean {
  const value = url?.trim() || '';
  return /^https?:\/\//i.test(value);
}

export function catalogueHeroUrl(product: HeroImageFields | null | undefined, contributedUrl?: string | null): string | null {
  if (!product) return null;
  const contributed = contributedUrl?.trim() || '';
  const candidates = [product.image_front_small_url, product.image_front_url, product.image_url];
  for (const candidate of candidates) {
    const url = candidate?.trim() || '';
    if (!isHttpImageUrl(url)) continue;
    if (contributed && url === contributed) continue;
    return url;
  }
  return null;
}

export function resolveDisplayedHero(input: {
  catalogueUrl: string | null;
  interimUri?: string | null;
  contributedUrl?: string | null;
}): string | null {
  if (input.catalogueUrl) return input.catalogueUrl;
  const interim = input.interimUri?.trim() || '';
  if (interim) return interim;
  const contributed = input.contributedUrl?.trim() || '';
  if (isHttpImageUrl(contributed)) return contributed;
  return null;
}

export type HeroTimingPhase = 'source_resolved' | 'retrieval' | 'displayed';

export function heroTimingRecord(input: {
  barcode: string;
  phase: HeroTimingPhase;
  ms: number;
  outcome?: string;
}): void {
  console.info('[hero-timing]', JSON.stringify(input));
}
