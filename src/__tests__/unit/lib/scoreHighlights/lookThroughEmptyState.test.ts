/**
 * Score Highlights look-through empty state — legacy manufactured commentary removed.
 *
 * Founder position (Consolidated Controlling Specification 20260905 v0.5 §S12a; Body v0.6 §5,
 * Planet v0.2 §5, Open v0.2 §6): the pillar look-through shows governed Highlight stories and,
 * separately, governed contextual contribution prompts. There is no third category of copy, so a
 * consumer-facing sentence such as "Nothing stood out for <pillar> on this product." is
 * manufactured commentary and must not render.
 *
 * Score-neutral: this asserts presentation only. S12 eligibility, promotion and the fired ledger
 * are untouched.
 */

import * as fs from 'fs';
import * as path from 'path';
import { selectScoreHighlights } from '../../../../lib/scoreHighlights/selectScoreHighlights';
import { selectContextualContributionPrompts } from '../../../../lib/scoreHighlights/contextualContributionPrompts';
import type { FiredAdjustment } from '../../../../lib/scoreHighlights/types';

const COMPONENTS_DIR = path.join(__dirname, '..', '..', '..', '..', 'components');
const LIST_SOURCE = fs.readFileSync(path.join(COMPONENTS_DIR, 'ScoreHighlightsList.tsx'), 'utf8');
const MODAL_SOURCE = fs.readFileSync(
  path.join(COMPONENTS_DIR, 'ScoreHighlightsLookThroughModal.tsx'),
  'utf8'
);

/** Ethics final-cap normaliser: real score movement, Highlight-ineligible, no pillar-specific prompt. */
const CAP_ONLY_LEDGER: FiredAdjustment[] = [
  { pillar: 'Ethics', id: 'ethics-v37-final-cap', value: -4, highlightEligible: false },
];

/** Pillar base only: no score movement, so the governed base contextual prompt owns the state. */
const BASE_ONLY_LEDGER: FiredAdjustment[] = [
  { pillar: 'Ethics', id: 'ethics-v37-base', value: 0, highlightEligible: false },
];

describe('look-through empty state renders nothing manufactured', () => {
  it('no consumer surface carries the legacy empty-state sentence', () => {
    expect(LIST_SOURCE).not.toContain('Nothing stood out');
    expect(MODAL_SOURCE).not.toContain('Nothing stood out');
  });

  it('ScoreHighlightsList no longer accepts or defaults any empty-state copy', () => {
    expect(LIST_SOURCE).not.toContain('emptyText');
    expect(MODAL_SOURCE).not.toContain('emptyText');
    // Fail closed: the component returns before rendering anything when nothing eligible fired.
    expect(LIST_SOURCE).toContain('if (stories.length === 0) return null;');
  });

  it('fails closed when neither an eligible Highlight nor a contextual prompt qualifies', () => {
    const { byPillar } = selectScoreHighlights(CAP_ONLY_LEDGER);
    const prompts = selectContextualContributionPrompts('Ethics', CAP_ONLY_LEDGER);

    expect(byPillar.Ethics).toEqual([]);
    expect(prompts).toEqual([]);
  });

  it('lets the contextual prompt stand alone, with no parallel empty text beside it', () => {
    const { byPillar } = selectScoreHighlights(BASE_ONLY_LEDGER);
    const prompts = selectContextualContributionPrompts('Ethics', BASE_ONLY_LEDGER);

    expect(byPillar.Ethics).toEqual([]);
    expect(prompts).toHaveLength(1);
    expect(prompts[0].kind).toBe('base');
    // Consumer label, not the internal pillar key (founder naming disposition, 5 Sept 2026).
    expect(prompts[0].l1).toBe('We need more information for Claims');
    expect(prompts[0].l2).not.toContain('Nothing stood out');
  });

  it('leaves the promoted Result list untouched when eligible stories exist', () => {
    const { byPillar, promoted } = selectScoreHighlights([
      { pillar: 'Ethics', id: 'ethics-v37-cert-fairtrade', value: 6, highlightEligible: true },
    ]);
    expect(byPillar.Ethics).toHaveLength(1);
    expect(promoted).toHaveLength(1);
    expect(promoted[0].l1).toBe('Fairtrade certified');
  });
});
