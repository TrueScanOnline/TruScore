import manifest from './closedPrelaunchManifest.json';

export type ClosedPrelaunchSurface = 'recognition_example' | 'contribution_review' | 'product_result';

type Mark = (typeof manifest.marks)[number];

function unique(matches: Mark[]): Mark | null {
  return matches.length === 1 ? matches[0] : null;
}

/**
 * Exact identity only. Ordinary wording is not matched, and a sample file
 * cannot satisfy review or a product Result.
 */
export function selectClosedPrelaunchMark(input: {
  enabled: boolean;
  surface: ClosedPrelaunchSurface;
  researchId?: string | null;
  productionId?: string | null;
  consumerName?: string | null;
}): Mark | null {
  if (!input.enabled) return null;
  const researchId = input.researchId?.trim() || '';
  const productionId = input.productionId?.trim() || '';
  const consumerName = input.consumerName?.trim() || '';
  let mark: Mark | null = null;
  if (researchId) {
    mark = unique(manifest.marks.filter((item) => item.researchId === researchId || item.productionId === researchId));
  } else if (productionId) {
    mark = unique(manifest.marks.filter((item) => item.productionId === productionId || item.researchId === productionId));
  } else if (consumerName) {
    mark = unique(manifest.marks.filter((item) => item.consumerName === consumerName));
  }
  if (!mark || !mark.surfaces.includes(input.surface)) return null;
  return mark;
}
