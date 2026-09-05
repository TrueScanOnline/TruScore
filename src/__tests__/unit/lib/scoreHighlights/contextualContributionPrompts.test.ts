import {
  ACTIVE_CONSUMER_PILLAR_LABELS,
  consumerPillarLabel,
} from '../../../../lib/scoreHighlights/consumerPillarLabels';
import {
  contextualContributionPromptsByPillar,
  selectContextualContributionPrompts,
} from '../../../../lib/scoreHighlights/contextualContributionPrompts';
import type { FiredAdjustment } from '../../../../lib/scoreHighlights/types';

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
  it('renders the Base prompt when no non-base score-moving adjustment fired', () => {
    const prompts = selectContextualContributionPrompts('Body', [
      row('Body', 'body-v12-base', 0, false),
      row('Body', 'body-v12-nutri-unavailable', 0, false),
    ]);
    expect(prompts).toHaveLength(1);
    expect(prompts[0].kind).toBe('base');
    expect(prompts[0].l1).toBe('We need more information for Body');
    expect(prompts[0].l2).toBe(
      'We do not currently have enough usable information to add a Body finding.'
    );
  });

  it('binds [PILLAR] to the consumer label for Ethics and Open', () => {
    const ethics = selectContextualContributionPrompts('Ethics', []);
    expect(ethics[0].l1).toBe('We need more information for Claims');
    expect(ethics[0].l2).toContain('add a Claims finding');

    const open = selectContextualContributionPrompts('Open', []);
    expect(open[0].l1).toBe('We need more information for Transparency');
    expect(open[0].l2).toContain('add a Transparency finding');
  });

  it('suppresses the specific missing-element prompts while Base owns the pillar state', () => {
    const body = selectContextualContributionPrompts('Body', [row('Body', 'body-v12-base', 0, false)]);
    expect(body.map((p) => p.kind)).toEqual(['base']);

    const open = selectContextualContributionPrompts('Open', [
      row('Open', 'open-v15-base', 0, false),
      row('Open', 'open-v15-origins-insufficient', 0, false),
    ]);
    expect(open.map((p) => p.kind)).toEqual(['base']);
  });

  it('ignores fired rows from other pillars', () => {
    const prompts = selectContextualContributionPrompts('Planet', [
      row('Body', 'body-v12-nova-4', -5),
    ]);
    expect(prompts.map((p) => p.kind)).toEqual(['base']);
    expect(prompts[0].l2).toContain('Planet');
  });
});

describe('selectContextualContributionPrompts — Body Nutri-Score', () => {
  it('renders when no usable Nutri fired but another non-base Body element did', () => {
    const prompts = selectContextualContributionPrompts('Body', [
      row('Body', 'body-v12-nutri-unavailable', 0, false),
      row('Body', 'body-v12-nova-4', -5),
    ]);
    expect(prompts).toHaveLength(1);
    expect(prompts[0].kind).toBe('body_nutri_unavailable');
    expect(prompts[0].l1).toBe('We need more nutrition information');
    expect(prompts[0].l2).toBe(
      'We do not currently have enough usable information to assess Nutri-Score for this product.'
    );
  });

  it('counts the Highlight-ineligible Whole Produce rescue as score movement', () => {
    const prompts = selectContextualContributionPrompts('Body', [
      row('Body', 'body-v12-whole-produce-rescue', 7, false),
    ]);
    expect(prompts.map((p) => p.kind)).toEqual(['body_nutri_unavailable']);
  });

  it('does not render when a usable Nutri grade fired', () => {
    const prompts = selectContextualContributionPrompts('Body', [
      row('Body', 'body-v12-nutri-d', -3),
      row('Body', 'body-v12-nova-4', -5),
    ]);
    expect(prompts).toHaveLength(0);
  });
});

describe('selectContextualContributionPrompts — Open', () => {
  it('renders the ingredient prompt when no clarity adjustment fired', () => {
    const prompts = selectContextualContributionPrompts('Open', [
      row('Open', 'open-v15-ing-clarity-unavailable', 0, false),
      row('Open', 'open-v15-origins-packet-gap', -3),
    ]);
    expect(prompts.map((p) => p.kind)).toEqual(['open_ingredient_unavailable']);
    expect(prompts[0].l1).toBe('We need ingredient information');
    expect(prompts[0].l2).toBe(
      'We do not currently have enough usable ingredient wording to assess clarity for this product.'
    );
  });

  it('does not render the ingredient prompt when the zero-flag clarity state scored', () => {
    const prompts = selectContextualContributionPrompts('Open', [
      row('Open', 'open-v15-ing-clarity-zero', 1),
    ]);
    expect(prompts).toHaveLength(0);
  });

  it('renders both Open prompts together in a non-base state', () => {
    const prompts = selectContextualContributionPrompts('Open', [
      row('Open', 'open-v15-ing-clarity-unavailable', 0, false),
      row('Open', 'open-v15-origins-insufficient', 0, false),
      row('Open', 'open-v15-origins-packet-gap', -3),
    ]);
    expect(prompts.map((p) => p.kind)).toEqual([
      'open_ingredient_unavailable',
      'open_origins_insufficient',
    ]);
    expect(prompts[1].l1).toBe('We need more origin information');
    expect(prompts[1].l2).toBe(
      'We do not currently have enough usable ingredient-origin information to assess origin disclosure for this product.'
    );
  });
});

describe('contextual prompt route-bound copy', () => {
  it('suppresses the whole action fragment while the contribution route is not live', () => {
    const all = contextualContributionPromptsByPillar([]);
    const flat = [...all.Body, ...all.Planet, ...all.Ethics, ...all.Open];
    expect(flat).toHaveLength(4);
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
    });
    expect(prompts.Body[0].action?.anchorLabel).toBe('here');
    expect(prompts.Body[0].l2).toBe(
      'We do not currently have enough usable information to add a Body finding. ' +
        'If you can see nutrition or ingredient information on the packet, tap here to contribute.'
    );
    expect(prompts.Planet[0].l2).toContain('not yet accepting packaging or recycling contributions');
    expect(prompts.Ethics[0].l2).toContain('product certifications or claims (for example, Organic)');
    expect(prompts.Open[0].l2).toContain('ingredient list or ingredient-origin statement');
    expect(JSON.stringify(prompts)).not.toContain('[here]');
  });

  it('carries presentation keys that are never scoring adjustment IDs', () => {
    const prompts = contextualContributionPromptsByPillar([
      row('Body', 'body-v12-nova-4', -5),
      row('Open', 'open-v15-origins-insufficient', 0, false),
      row('Open', 'open-v15-origins-packet-gap', -3),
    ]);
    const keys = [
      ...prompts.Body,
      ...prompts.Planet,
      ...prompts.Ethics,
      ...prompts.Open,
    ].map((p) => p.promptKey);
    expect(keys).toEqual(
      expect.arrayContaining([
        'Body:body_nutri_unavailable',
        'Planet:base',
        'Ethics:base',
        'Open:open_ingredient_unavailable',
        'Open:open_origins_insufficient',
      ])
    );
    for (const key of keys) {
      expect(key).not.toMatch(/^(body-v12|planet-v19|ethics-v37|open-v15)-/);
    }
  });
});
