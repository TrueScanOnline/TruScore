/**
 * Contextual contribution prompts (Consolidated Controlling Specification 20260905 v0.5 §4,
 * L3 Content Closure Addendum 20260905 v1.1 §7, Body v0.6 §5, Planet v0.2 §5, Open v0.2).
 *
 * These are presentation objects derived from pillar state. They are NOT scoring adjustments and
 * NOT Score Highlight stories: they never enter the S12 promotion set or the S12a look-through
 * Highlight list, never alter the fired ledger, and never affect score.
 *
 * Governed selection rules:
 *  - Base prompt renders only when no non-base score-moving adjustment fired in that pillar.
 *  - The Body "no usable Nutri-Score" prompt renders only when no usable Nutri-Score adjustment
 *    fired AND another non-base score-moving Body adjustment did (Whole Produce rescue counts as
 *    score movement even though it is Highlight-ineligible).
 *  - The Open ingredient / origins prompts follow the same shape and may both appear together in a
 *    non-base Open state.
 *  - Base always suppresses the specific missing-element prompts; they never duplicate one another.
 *
 * Route-bound copy: every action fragment ends in "tap [here] to contribute" and is wholly
 * suppressed until the governed User Contribution destination exists. `[here]` is an authoring
 * anchor token and never renders literally, so the resolved `l2` never contains it.
 */

import { consumerPillarLabel } from './consumerPillarLabels';
import type { FiredAdjustment, ScoreHighlightPillar } from './types';

export type ContextualPromptKind =
  | 'base'
  | 'body_nutri_unavailable'
  | 'open_ingredient_unavailable'
  | 'open_origins_insufficient';

/** Split action fragment so a host can render the anchor without ever printing `[here]`. */
export interface ContextualPromptAction {
  /** Copy before the navigation anchor. */
  textBefore: string;
  /** Anchor label the host makes pressable. */
  anchorLabel: string;
  /** Copy after the navigation anchor. */
  textAfter: string;
}

export interface ContextualContributionPrompt {
  pillar: ScoreHighlightPillar;
  kind: ContextualPromptKind;
  /** Stable presentation key. Never a scoring adjustment ID. */
  promptKey: string;
  l1: string;
  /** Resolved consumer body copy. Excludes the action fragment while the route is not live. */
  l2: string;
  /** Present only when the governed User Contribution destination is live. */
  action?: ContextualPromptAction;
}

export interface ContextualContributionPromptOptions {
  /**
   * True only when the governed User Contribution destination exists (Wave 4).
   * Defaults to false so no dead `[here]` anchor can render.
   */
  userContributionRouteLive?: boolean;
}

const PILLAR_TOKEN = '[PILLAR]';
const ANCHOR_LABEL = 'here';

const PILLAR_BASE_IDS: Record<ScoreHighlightPillar, string> = {
  Body: 'body-v12-base',
  Planet: 'planet-v19-base',
  Ethics: 'ethics-v37-base',
  Open: 'open-v15-base',
};

/** Usable Nutri-Score scoring adjustments. Absence of all of them is the "no usable grade" state. */
const BODY_USABLE_NUTRI_IDS = [
  'body-v12-nutri-a',
  'body-v12-nutri-b',
  'body-v12-nutri-c',
  'body-v12-nutri-d',
  'body-v12-nutri-e',
];

/** Ingredient-clarity scoring adjustments (including the +1 zero-flag state). */
const OPEN_CLARITY_SCORING_IDS = [
  'open-v15-ing-clarity-zero',
  'open-v15-ing-clarity-one',
  'open-v15-ing-clarity-two',
  'open-v15-ing-clarity-three-plus',
];

const OPEN_ORIGINS_INSUFFICIENT_ID = 'open-v15-origins-insufficient';

interface PromptCopy {
  l1: string;
  /** Always rendered. */
  base: string;
  /** Route-bound; suppressed until the User Contribution destination is live. */
  actionBefore: string;
  actionAfter: string;
}

const BASE_PROMPT_COPY: Record<ScoreHighlightPillar, PromptCopy> = {
  Body: {
    l1: `We need more information for ${PILLAR_TOKEN}`,
    base: `We do not currently have enough usable information to add a ${PILLAR_TOKEN} finding.`,
    actionBefore: 'If you can see nutrition or ingredient information on the packet, tap ',
    actionAfter: ' to contribute.',
  },
  Planet: {
    l1: `We need more information for ${PILLAR_TOKEN}`,
    // Packaging-not-yet-accepted is always-visible context (not route-bound). Only the
    // "If you can see… tap [here]…" invitation is suppressed until contributions are live.
    base:
      `We do not currently have enough usable information to add a ${PILLAR_TOKEN} finding. We are not yet accepting packaging or recycling contributions.`,
    actionBefore: 'If you can see ingredient information on the packet, tap ',
    actionAfter:
      ' to contribute it; more complete product data can support environmental-impact assessments such as Green-Score.',
  },
  Ethics: {
    l1: `We need more information for ${PILLAR_TOKEN}`,
    base: `We do not currently have enough usable information to add a ${PILLAR_TOKEN} finding.`,
    actionBefore:
      'If you can see product certifications or claims (for example, Organic) on the packet, tap ',
    actionAfter: ' to contribute.',
  },
  Open: {
    l1: `We need more information for ${PILLAR_TOKEN}`,
    base: `We do not currently have enough usable information to add a ${PILLAR_TOKEN} finding.`,
    actionBefore:
      'If you can see an ingredient list or ingredient-origin statement on the packet, tap ',
    actionAfter: ' to contribute.',
  },
};

const BODY_NUTRI_UNAVAILABLE_COPY: PromptCopy = {
  l1: 'We need more nutrition information',
  base: 'We do not currently have enough usable information to assess Nutri-Score for this product.',
  actionBefore: 'If you can see the nutrition table on the packet, tap ',
  actionAfter: ' to contribute.',
};

const OPEN_INGREDIENT_UNAVAILABLE_COPY: PromptCopy = {
  l1: 'We need ingredient information',
  base: 'We do not currently have enough usable ingredient wording to assess clarity for this product.',
  actionBefore: 'If you can see the ingredient list on the packet, tap ',
  actionAfter: ' to contribute.',
};

const OPEN_ORIGINS_INSUFFICIENT_COPY: PromptCopy = {
  l1: 'We need more origin information',
  base: 'We do not currently have enough usable ingredient-origin information to assess origin disclosure for this product.',
  actionBefore: 'If you can see an origin statement on the packet, tap ',
  actionAfter: ' to contribute.',
};

function bindPillarToken(text: string, pillar: ScoreHighlightPillar): string {
  return text.split(PILLAR_TOKEN).join(consumerPillarLabel(pillar));
}

function buildPrompt(
  pillar: ScoreHighlightPillar,
  kind: ContextualPromptKind,
  copy: PromptCopy,
  routeLive: boolean
): ContextualContributionPrompt {
  const action: ContextualPromptAction = {
    textBefore: bindPillarToken(copy.actionBefore, pillar),
    anchorLabel: ANCHOR_LABEL,
    textAfter: bindPillarToken(copy.actionAfter, pillar),
  };
  const base = bindPillarToken(copy.base, pillar);
  return {
    pillar,
    kind,
    promptKey: `${pillar}:${kind}`,
    l1: bindPillarToken(copy.l1, pillar),
    l2: routeLive ? `${base} ${action.textBefore}${action.anchorLabel}${action.textAfter}` : base,
    ...(routeLive && { action }),
  };
}

/** A fired row that actually moved this pillar's score and is not the pillar base row. */
function isNonBaseScoreMoving(pillar: ScoreHighlightPillar, row: FiredAdjustment): boolean {
  if (row.pillar !== pillar) return false;
  if (!row.id) return false;
  if (row.id === PILLAR_BASE_IDS[pillar]) return false;
  return row.value !== 0;
}

/**
 * Governed contextual prompts for one pillar, derived from the fired ledger only.
 * Returns an empty array when the pillar state warrants no prompt.
 */
export function selectContextualContributionPrompts(
  pillar: ScoreHighlightPillar,
  fired: readonly FiredAdjustment[],
  options?: ContextualContributionPromptOptions
): ContextualContributionPrompt[] {
  const routeLive = options?.userContributionRouteLive === true;
  const pillarRows = fired.filter((row) => row.pillar === pillar);
  const firedIds = new Set(
    pillarRows.map((row) => row.id).filter((id): id is string => typeof id === 'string')
  );

  const hasNonBaseScoreMovement = pillarRows.some((row) => isNonBaseScoreMoving(pillar, row));

  // Base owns the pillar state and always suppresses the specific missing-element prompts.
  if (!hasNonBaseScoreMovement) {
    return [buildPrompt(pillar, 'base', BASE_PROMPT_COPY[pillar], routeLive)];
  }

  const prompts: ContextualContributionPrompt[] = [];

  if (pillar === 'Body') {
    const hasUsableNutri = BODY_USABLE_NUTRI_IDS.some((id) => firedIds.has(id));
    if (!hasUsableNutri) {
      prompts.push(
        buildPrompt(pillar, 'body_nutri_unavailable', BODY_NUTRI_UNAVAILABLE_COPY, routeLive)
      );
    }
  }

  if (pillar === 'Open') {
    const hasClarityAdjustment = OPEN_CLARITY_SCORING_IDS.some((id) => firedIds.has(id));
    if (!hasClarityAdjustment) {
      prompts.push(
        buildPrompt(pillar, 'open_ingredient_unavailable', OPEN_INGREDIENT_UNAVAILABLE_COPY, routeLive)
      );
    }
    if (firedIds.has(OPEN_ORIGINS_INSUFFICIENT_ID)) {
      prompts.push(
        buildPrompt(pillar, 'open_origins_insufficient', OPEN_ORIGINS_INSUFFICIENT_COPY, routeLive)
      );
    }
  }

  return prompts;
}

/** Governed contextual prompts for every pillar, keyed by internal pillar name. */
export function contextualContributionPromptsByPillar(
  fired: readonly FiredAdjustment[],
  options?: ContextualContributionPromptOptions
): Record<ScoreHighlightPillar, ContextualContributionPrompt[]> {
  return {
    Body: selectContextualContributionPrompts('Body', fired, options),
    Planet: selectContextualContributionPrompts('Planet', fired, options),
    Ethics: selectContextualContributionPrompts('Ethics', fired, options),
    Open: selectContextualContributionPrompts('Open', fired, options),
  };
}
