import {
  ACTIVE_CONSUMER_PILLAR_LABELS,
  consumerPillarLabel,
} from '../../../../lib/scoreHighlights/consumerPillarLabels';
import {
  contextualContributionPromptsByPillar,
  selectContextualContributionPrompts,
  type ContextualPromptGovernance,
} from '../../../../lib/scoreHighlights/contextualContributionPrompts';
import type { FiredAdjustment } from '../../../../lib/scoreHighlights/types';

function live(lanes: NonNullable<ContextualPromptGovernance['lanes']>) {
  return { governance: { material: true, routeStatus: 'live' as const, lanes } };
}

const row = (
  pillar: FiredAdjustment['pillar'],
  id: string,
  value: number,
  highlightEligible = true
): FiredAdjustment => ({ pillar, id, value, highlightEligible });

describe('consumerPillarLabel', () => {
  it('applies the founder naming disposition for Ethics and Open only', () => {
    expect(consumerPillarLabel('Body')).toBe('Body');
    expect(consumerPillarLabel('Planet')).toBe('Planet');
    expect(consumerPillarLabel('Ethics')).toBe('Claims');
    expect(consumerPillarLabel('Open')).toBe('Transparency');
  });

  it('inventories the active in-app consumer labels in render order', () => {
    expect(ACTIVE_CONSUMER_PILLAR_LABELS).toEqual(['Body', 'Planet', 'Claims', 'Transparency']);
  });
});

describe('selectContextualContributionPrompts — base state', () => {
  it('renders the Base prompt from unresolved Body lanes, not from the ledger', () => {
    const ledger = [
      row('Body', 'body-v12-base', 0, false),
      row('Body', 'body-v12-nutri-unavailable', 0, false),
    ];
    expect(selectContextualContributionPrompts('Body', ledger)).toEqual([]);
    const prompts = selectContextualContributionPrompts(
      'Body',
      ledger,
      live({ nutrition: 'unassessed', processing: 'unassessed' })
    );
    expect(prompts).toHaveLength(1);
    expect(prompts[0].kind).toBe('base');
    expect(prompts[0].l1).toBe('We need more information for Body');
    expect(prompts[0].l2).toBe(
      'We do not currently have enough usable information to add a Body finding.'
    );
    expect(
      selectContextualContributionPrompts('Body', [row('Body', 'body-v12-nova-4', -5)], live({
        nutrition: 'unassessed',
        processing: 'unassessed',
      })).map((p) => p.kind)
    ).toEqual(['base']);
  });

  it('binds [PILLAR] to the consumer label for Ethics and Open', () => {
    const ethics = selectContextualContributionPrompts(
      'Ethics',
      [],
      live({ packet: 'unassessed_or_incomplete' })
    );
    expect(ethics[0].l1).toBe('We need more information for Claims');
    expect(ethics[0].l2).toContain('add a Claims finding');

    const open = selectContextualContributionPrompts(
      'Open',
      [],
      live({ ingredient_clarity: 'unassessed', origins: 'unassessed' })
    );
    expect(open[0].l1).toBe('We need more information for Transparency');
    expect(open[0].l2).toContain('add a Transparency finding');
  });

  it('uses the base prompt when every consumer lane for the pillar is unresolved', () => {
    const body = selectContextualContributionPrompts(
      'Body',
      [row('Body', 'body-v12-base', 0, false)],
      live({ nutrition: 'unassessed', processing: 'unassessed' })
    );
    expect(body.map((p) => p.kind)).toEqual(['base']);

    const open = selectContextualContributionPrompts(
      'Open',
      [
        row('Open', 'open-v15-base', 0, false),
        row('Open', 'open-v15-origins-insufficient', 0, false),
      ],
      live({ ingredient_clarity: 'unassessed', origins: 'unassessed' })
    );
    expect(open.map((p) => p.kind)).toEqual(['base']);
  });

  it('does not solicit Planet from the ledger or from a live flag', () => {
    const prompts = selectContextualContributionPrompts(
      'Planet',
      [row('Body', 'body-v12-nova-4', -5)],
      live({ nutrition: 'unassessed' })
    );
    expect(prompts).toEqual([]);
  });
});

describe('selectContextualContributionPrompts — Body Nutri-Score', () => {
  it('explains an unresolved nutrition lane when processing is already resolved', () => {
    const prompts = selectContextualContributionPrompts(
      'Body',
      [row('Body', 'body-v12-nutri-d', -3)],
      live({ nutrition: 'unassessed', processing: 'resolved' })
    );
    expect(prompts).toHaveLength(1);
    expect(prompts[0].kind).toBe('body_nutri_unavailable');
    expect(prompts[0].l1).toBe('We need more nutrition information');
    expect(prompts[0].l2).toBe(
      'We do not currently have enough usable information to assess Nutri-Score for this product.'
    );
  });

  it('does not turn a resolved nutrition lane into a nutrition prompt', () => {
    const prompts = selectContextualContributionPrompts(
      'Body',
      [row('Body', 'body-v12-whole-produce-rescue', 7, false)],
      live({ nutrition: 'resolved', processing: 'resolved' })
    );
    expect(prompts).toEqual([]);
  });

  it('does not render a nutrition prompt when the nutrition lane is resolved', () => {
    const prompts = selectContextualContributionPrompts(
      'Body',
      [row('Body', 'body-v12-nova-4', -5)],
      live({ nutrition: 'resolved', processing: 'unassessed' })
    );
    expect(prompts.map((p) => p.kind)).toEqual(['base']);
  });
});

describe('selectContextualContributionPrompts — Open', () => {
  it('renders the ingredient prompt only for an unresolved ingredient lane', () => {
    const prompts = selectContextualContributionPrompts(
      'Open',
      [row('Open', 'open-v15-ing-clarity-zero', 1)],
      live({ ingredient_clarity: 'unassessed', origins: 'resolved' })
    );
    expect(prompts.map((p) => p.kind)).toEqual(['open_ingredient_unavailable']);
    expect(prompts[0].l1).toBe('We need ingredient information');
    expect(prompts[0].l2).toBe(
      'We do not currently have enough usable ingredient wording to assess clarity for this product.'
    );
  });

  it('does not render the ingredient prompt when the ingredient lane is resolved', () => {
    const prompts = selectContextualContributionPrompts(
      'Open',
      [row('Open', 'open-v15-ing-clarity-unavailable', 0, false)],
      live({ ingredient_clarity: 'resolved', origins: 'resolved' })
    );
    expect(prompts).toHaveLength(0);
  });

  it('renders the origins prompt only when origins are unresolved and ingredients are resolved', () => {
    const prompts = selectContextualContributionPrompts(
      'Open',
      [],
      live({ ingredient_clarity: 'resolved', origins: 'unassessed' })
    );
    expect(prompts.map((p) => p.kind)).toEqual(['open_origins_insufficient']);
    expect(prompts[0].l1).toBe('We need more origin information');
    expect(prompts[0].l2).toBe(
      'We do not currently have enough usable ingredient-origin information to assess origin disclosure for this product.'
    );
  });
});

describe('contextual prompt route-bound copy', () => {
  const governanceByPillar = {
    Body: live({ nutrition: 'unassessed', processing: 'unassessed' }).governance,
    Ethics: live({ packet: 'unassessed_or_incomplete' }).governance,
    Open: live({ ingredient_clarity: 'unassessed', origins: 'resolved' }).governance,
  };

  it('suppresses the whole action fragment while the contribution route is not live', () => {
    const all = contextualContributionPromptsByPillar([], { governanceByPillar });
    const flat = [...all.Body, ...all.Planet, ...all.Ethics, ...all.Open];
    expect(flat).toHaveLength(3);
    for (const prompt of flat) {
      expect(prompt.action).toBeUndefined();
      expect(prompt.l2).not.toContain('[here]');
      expect(prompt.l2).not.toContain('to contribute');
      expect(prompt.l2).not.toContain('[PILLAR]');
    }
  });

  it('exposes the split action fragment once the route is live and never a literal [here]', () => {
    const prompts = contextualContributionPromptsByPillar([], {
      userContributionRouteLive: true,
      governanceByPillar,
    });
    expect(prompts.Planet).toEqual([]);
    expect(prompts.Body[0].action?.anchorLabel).toBe('here');
    expect(prompts.Body[0].l2).toBe(
      'We do not currently have enough usable information to add a Body finding. ' +
        'If you can see nutrition or ingredient information on the packet, tap here to contribute.'
    );
    expect(prompts.Ethics[0].l2).toContain('product certifications or claims (for example, Organic)');
    expect(prompts.Open[0].l2).toContain('ingredient list');
    expect(JSON.stringify(prompts)).not.toContain('[here]');
    expect(JSON.stringify(prompts)).not.toContain('Green-Score');
  });

  it('carries presentation keys that are never scoring adjustment IDs', () => {
    const prompts = contextualContributionPromptsByPillar(
      [
        row('Body', 'body-v12-nova-4', -5),
        row('Open', 'open-v15-origins-insufficient', 0, false),
        row('Open', 'open-v15-origins-packet-gap', -3),
      ],
      {
        governanceByPillar: {
          Body: live({ nutrition: 'unassessed', processing: 'resolved' }).governance,
          Ethics: live({ packet: 'unassessed_or_incomplete' }).governance,
          Open: live({ ingredient_clarity: 'resolved', origins: 'unassessed' }).governance,
        },
      }
    );
    const keys = [
      ...prompts.Body,
      ...prompts.Planet,
      ...prompts.Ethics,
      ...prompts.Open,
    ].map((p) => p.promptKey);
    expect(keys).toEqual(
      expect.arrayContaining([
        'Body:body_nutri_unavailable',
        'Ethics:base',
        'Open:open_origins_insufficient',
      ])
    );
    expect(keys).not.toContain('Planet:base');
    for (const key of keys) {
      expect(key).not.toMatch(/^(body-v12|planet-v19|ethics-v37|open-v15)-/);
    }
  });
});
