/**
 * Result-host presentation plan for governed in-app L3 destinations.
 *
 * Native Modal stacking control (pre-UAT corrective): the Score Highlights look-through
 * Modal must be dismissed before any L3 native Modal is presented. product_origins already
 * followed this rule (dismiss then scroll); additives and shared governed L3 must match.
 */

import type { ScoreHighlightL3InAppTarget } from './targets';

export type ScoreHighlightL3HostPresentation =
  | { dismissLookThrough: true; present: 'additives' }
  | { dismissLookThrough: true; present: 'product_origins' }
  | { dismissLookThrough: true; present: 'governed_l3' };

export function planInAppL3HostPresentation(
  target: ScoreHighlightL3InAppTarget
): ScoreHighlightL3HostPresentation {
  if (target === 'additives') {
    return { dismissLookThrough: true, present: 'additives' };
  }
  if (target === 'product_origins') {
    return { dismissLookThrough: true, present: 'product_origins' };
  }
  return { dismissLookThrough: true, present: 'governed_l3' };
}
