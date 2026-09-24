/**
 * Provisional S26 consumer explanation contract (§11).
 * Every explanation MUST carry the literal founder-approval prefix for Wave 3 UAT.
 */

import type { S26Code } from './types';

export const S26_FOUNDER_APPROVAL_PREFIX = '(Awaiting founder approval)';

const S26_BODY: Record<string, string> = {
  BODY_NR:
    'We do not yet have a usable nutritional-quality assessment or food-processing assessment, so we cannot reveal Body.',
  BODY_LIMITED_NUTRITION_ONLY:
    'We could assess nutritional quality, but we do not yet have a usable food-processing assessment.',
  BODY_LIMITED_PROCESSING_ONLY:
    'We could assess food processing, but we do not yet have a usable nutritional-quality assessment.',
  BODY_MODERATE:
    'We could assess both nutritional quality and food processing. The available product evidence supports a Moderate-confidence result.',
  BODY_HIGH:
    'We could assess both nutritional quality and food processing using authoritative, traceable product evidence.',
};

const S26_PLANET: Record<string, string> = {
  PLANET_NR:
    'We do not yet have a usable environmental assessment or qualifying packaging assessment, so we cannot reveal Planet.',
  PLANET_LIMITED_PACKAGING:
    'We could assess this product’s primary packaging, but a broader environmental assessment was not available.',
  PLANET_MODERATE:
    'A broader environmental assessment was available for this product, but the current source data and methodology have limitations, so confidence is Moderate.',
  PLANET_HIGH:
    'A broader environmental assessment was available and is supported by authoritative, traceable product evidence.',
};

const S26_CLAIMS: Record<string, string> = {
  CLAIMS_NR:
    'We do not yet have enough packet evidence or completed benchmark checks to reveal Claims.',
  CLAIMS_LIMITED_PACKET_ONLY:
    'We assessed packet claims and certifications, but the governed company benchmark checks have not both been successfully completed.',
  CLAIMS_LIMITED_BENCHMARK_ONLY:
    'We completed the governed company benchmark checks, but packet claims and certifications have not yet been substantively assessed.',
  CLAIMS_MODERATE:
    'We assessed both packet claims and certifications and the governed company benchmark checks. The available evidence supports a Moderate-confidence result.',
  CLAIMS_HIGH:
    'We assessed both packet claims and certifications and the governed company benchmark checks using authoritative, traceable evidence.',
};

const S26_TRANSPARENCY: Record<string, string> = {
  TRANSPARENCY_NR:
    'We do not yet have a resolved ingredient-wording assessment or origin-disclosure assessment, so we cannot reveal Transparency.',
  TRANSPARENCY_LIMITED_INGREDIENT_ONLY:
    'We could assess ingredient-wording clarity, but origin disclosure has not yet been resolved.',
  TRANSPARENCY_LIMITED_ORIGINS_ONLY:
    'We could assess origin disclosure, but ingredient-wording clarity has not yet been resolved.',
  TRANSPARENCY_LIMITED_ORIGINS_CONFLICT:
    'We could assess ingredient-wording clarity, but the available origin evidence conflicts and is not yet resolved.',
  TRANSPARENCY_MODERATE:
    'We resolved both ingredient-wording clarity and origin disclosure. The available evidence supports a Moderate-confidence result.',
  TRANSPARENCY_HIGH:
    'We resolved both ingredient-wording clarity and origin disclosure using authoritative, traceable disclosure evidence.',
};

const S26_OVERALL: Record<string, string> = {
  OVERALL_NR:
    'We cannot reveal the overall result until all four pillars can be rated. Check the unrevealed pillar result for what is still missing.',
  OVERALL_LIMITED:
    'All four pillar scores are available. Overall confidence is Limited because at least one pillar has Limited confidence.',
  OVERALL_MODERATE:
    'All four pillar scores are available. No pillar is Limited, and at least one pillar has Moderate confidence, so overall confidence is Moderate.',
  OVERALL_HIGH: 'All four pillar scores are supported by High-confidence assessments.',
};

const ALL: Record<string, string> = {
  ...S26_BODY,
  ...S26_PLANET,
  ...S26_CLAIMS,
  ...S26_TRANSPARENCY,
  ...S26_OVERALL,
};

/** Build provisional UAT explanation with mandatory founder-approval prefix. */
export function formatS26Explanation(code: S26Code): string {
  const body = ALL[code];
  if (!body) {
    return `${S26_FOUNDER_APPROVAL_PREFIX} Explanation unavailable for code ${code}.`;
  }
  return `${S26_FOUNDER_APPROVAL_PREFIX} ${body}`;
}
