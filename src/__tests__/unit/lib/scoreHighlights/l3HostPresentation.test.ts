import { planInAppL3HostPresentation } from '../../../../lib/scoreHighlights/l3/hostPresentation';
import { L3_TITLES, type ScoreHighlightL3InAppTarget } from '../../../../lib/scoreHighlights/l3/targets';

describe('planInAppL3HostPresentation — no look-through stacking under L3', () => {
  const allTargets = Object.keys(L3_TITLES) as ScoreHighlightL3InAppTarget[];

  it('dismisses the look-through Modal before every in-app L3 presentation', () => {
    for (const target of allTargets) {
      const plan = planInAppL3HostPresentation(target);
      expect(plan.dismissLookThrough).toBe(true);
    }
  });

  it('preserves product_origins scroll host behaviour and modal hosts for L3 content', () => {
    expect(planInAppL3HostPresentation('product_origins')).toEqual({
      dismissLookThrough: true,
      present: 'product_origins',
    });
    expect(planInAppL3HostPresentation('additives')).toEqual({
      dismissLookThrough: true,
      present: 'additives',
    });
    expect(planInAppL3HostPresentation('nutri_score')).toEqual({
      dismissLookThrough: true,
      present: 'governed_l3',
    });
    expect(planInAppL3HostPresentation('ingredient_wording')).toEqual({
      dismissLookThrough: true,
      present: 'governed_l3',
    });
  });
});
