/**
 * Map fired adjustment IDs to governed in-app L3 destinations (Addendum v1.0).
 * Every Highlight-eligible family listed here must resolve in-app — not via external fallback alone.
 */

import { L3_TITLES, type ScoreHighlightL3InAppTarget } from './targets';
import type { ScoreHighlightL3Route, ScoreHighlightPillar } from '../types';

const BODY_ADDITIVE_IDS = new Set([
  'body-v12-additive-e102',
  'body-v12-additive-e110',
  'body-v12-additive-e129',
  'body-v12-additive-e171',
  'body-v12-additive-e250',
  'body-v12-additive-e951',
]);

const NUTRI_IDS = new Set([
  'body-v12-nutri-a',
  'body-v12-nutri-b',
  'body-v12-nutri-c',
  'body-v12-nutri-d',
  'body-v12-nutri-e',
]);

const NOVA_IDS = new Set([
  'body-v12-nova-1-off',
  'body-v12-nova-2',
  'body-v12-nova-3',
  'body-v12-nova-4',
]);

const GREEN_SCORE_IDS = new Set([
  'planet-v19-environmental-a',
  'planet-v19-environmental-b',
  'planet-v19-environmental-c',
  'planet-v19-environmental-d',
  'planet-v19-environmental-e',
]);

const PACKAGING_IDS = new Set([
  'planet-v19-packaging-all-kerbside',
  'planet-v19-packaging-some-kerbside',
]);

const OPEN_ORIGINS_IDS = new Set([
  'open-v15-origins-evidently-complete',
  'open-v15-origins-pct-95-99',
  'open-v15-origins-pct-76-94',
  'open-v15-origins-pct-50-75',
  'open-v15-origins-pct-25-49',
  'open-v15-origins-pct-1-24',
  'open-v15-origins-qualified-partial',
  'open-v15-origins-packet-gap',
]);

const OPEN_CLARITY_IDS = new Set([
  'open-v15-ing-clarity-zero',
  'open-v15-ing-clarity-one',
  'open-v15-ing-clarity-two',
  'open-v15-ing-clarity-three-plus',
]);

const KTC_PREFIX = 'ethics-v37-ktc-';
const BBFAW_PREFIXES = ['ethics-v37-bbfaw-tier-', 'ethics-v37-bbfaw-impact-'];

function routeFor(target: ScoreHighlightL3InAppTarget): ScoreHighlightL3Route {
  return { kind: 'in_app', target, label: L3_TITLES[target] };
}

/**
 * Resolve the governed in-app L3 destination for a story's bound IDs.
 * Returns undefined only when no governed L3 family matches (should not happen for Highlight-eligible rows covered by the addendum).
 */
export function resolveInAppL3Route(
  pillar: ScoreHighlightPillar,
  boundAdjustmentIds: readonly string[]
): ScoreHighlightL3Route | undefined {
  if (pillar === 'Body') {
    if (boundAdjustmentIds.some((id) => BODY_ADDITIVE_IDS.has(id))) {
      return routeFor('additives');
    }
    if (boundAdjustmentIds.some((id) => NUTRI_IDS.has(id))) {
      return routeFor('nutri_score');
    }
    if (boundAdjustmentIds.some((id) => NOVA_IDS.has(id))) {
      return routeFor('nova');
    }
  }

  if (pillar === 'Planet') {
    if (boundAdjustmentIds.some((id) => GREEN_SCORE_IDS.has(id))) {
      return routeFor('green_score');
    }
    if (boundAdjustmentIds.some((id) => PACKAGING_IDS.has(id))) {
      return routeFor('packaging');
    }
  }

  if (pillar === 'Ethics') {
    if (boundAdjustmentIds.includes('ethics-v37-cert-fairtrade')) return routeFor('ethics_fairtrade');
    if (boundAdjustmentIds.includes('ethics-v37-cert-rainforest-alliance')) {
      return routeFor('ethics_rainforest');
    }
    if (boundAdjustmentIds.includes('ethics-v37-cert-msc')) return routeFor('ethics_msc');
    if (boundAdjustmentIds.includes('ethics-v37-cert-asc')) return routeFor('ethics_asc');
    if (boundAdjustmentIds.includes('ethics-v37-cert-organic')) return routeFor('ethics_organic');
    if (boundAdjustmentIds.some((id) => id.startsWith(KTC_PREFIX))) return routeFor('ethics_ktc');
    if (boundAdjustmentIds.some((id) => BBFAW_PREFIXES.some((p) => id.startsWith(p)))) {
      return routeFor('ethics_bbfaw');
    }
  }

  if (pillar === 'Open') {
    if (boundAdjustmentIds.some((id) => OPEN_ORIGINS_IDS.has(id))) {
      return routeFor('product_origins');
    }
    if (boundAdjustmentIds.some((id) => OPEN_CLARITY_IDS.has(id))) {
      return routeFor('ingredient_wording');
    }
  }

  return undefined;
}
