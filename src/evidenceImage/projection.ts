/**
 * Consumer projection for a private evidence image.
 * The asset stays in the session. This only decides whether the open contribution surface may show it.
 */

export type EvidenceSurfaceImage = {
  assetId: string;
  journeyId: string;
  entryContext: string;
};

export function visibleEvidenceImages<T extends EvidenceSurfaceImage>(
  images: T[],
  surface: { journeyId: string; entryContext: string } | null
): T[] {
  if (!surface) return [];
  return images.filter(
    (image) => image.journeyId === surface.journeyId && image.entryContext === surface.entryContext
  );
}
