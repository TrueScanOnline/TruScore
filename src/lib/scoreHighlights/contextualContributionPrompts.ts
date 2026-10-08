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

import type { CrossPillarPublicationSnapshot } from '../rateability';
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

/**
 * Governed reason a prompt may explain a contribution need.
 * The fired ledger is not an input to this decision.
 */
export interface ContextualPromptGovernance {
  material: boolean;
  routeStatus: 'live' | 'future' | 'none';
  lanes?: {
    nutrition?: string;
    processing?: string;
    packet?: string;
    ingredient_clarity?: string;
    origins?: string;
  };
}

export interface ContextualContributionPromptOptions {
  /**
   * True only when the governed User Contribution destination exists (Wave 4).
   * Defaults to false so no dead `[here]` anchor can render.
   * Callers must not set this merely to surface a prompt.
   */
  userContributionRouteLive?: boolean;
  /** Required. Without a live material lane opportunity, no prompt is returned. */
  governance?: ContextualPromptGovernance;
}

const PILLAR_TOKEN = '[PILLAR]';
const ANCHOR_LABEL = 'here';

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

function liveMaterialNeed(governance: ContextualPromptGovernance | undefined): boolean {
  return governance?.material === true && governance.routeStatus === 'live';
}

/**
 * Lane opportunity for one Highlights pillar. A missing pillar or missing lanes yield no governance,
 * so the look-through cannot invent a prompt or throw.
 */
export function governanceFromPublication(
  pillar: ScoreHighlightPillar,
  publication: CrossPillarPublicationSnapshot | null | undefined
): ContextualPromptGovernance | undefined {
  if (!publication) return undefined;
  if (pillar === 'Body') {
    const body = publication.body;
    if (!body?.assessmentLanes) return undefined;
    const opportunity = body.s26?.contributionOpportunity;
    return {
      material: opportunity?.material === true,
      routeStatus: opportunity?.routeStatus ?? 'none',
      lanes: {
        nutrition: body.assessmentLanes.nutrition,
        processing: body.assessmentLanes.processing,
      },
    };
  }
  if (pillar === 'Planet') {
    const planet = publication.planet;
    if (!planet) return undefined;
    const opportunity = planet.s26?.contributionOpportunity;
    return {
      material: opportunity?.material === true,
      routeStatus: opportunity?.routeStatus ?? 'none',
    };
  }
  if (pillar === 'Ethics') {
    const claims = publication.claims;
    if (!claims?.assessmentLanes) return undefined;
    const opportunity = claims.s26?.contributionOpportunity;
    return {
      material: opportunity?.material === true,
      routeStatus: opportunity?.routeStatus ?? 'none',
      lanes: { packet: claims.assessmentLanes.packet },
    };
  }
  const transparency = publication.transparency;
  if (!transparency?.assessmentLanes) return undefined;
  const opportunity = transparency.s26?.contributionOpportunity;
  return {
    material: opportunity?.material === true,
    routeStatus: opportunity?.routeStatus ?? 'none',
    lanes: {
      ingredient_clarity: transparency.assessmentLanes.ingredient_clarity,
      origins: transparency.assessmentLanes.origins,
    },
  };
}

/**
 * Prompts explain a governed lane opportunity. The fired ledger cannot create or remove that need.
 * Planet has no live contribution opportunity, so it never solicits from this path.
 */
export function selectContextualContributionPrompts(
  pillar: ScoreHighlightPillar,
  fired: readonly FiredAdjustment[],
  options?: ContextualContributionPromptOptions
): ContextualContributionPrompt[] {
  void fired;
  if (pillar === 'Planet') return [];
  const governance = options?.governance;
  if (!liveMaterialNeed(governance)) return [];
  const routeLive = options?.userContributionRouteLive === true;
  const lanes = governance?.lanes;
  if (!lanes) return [];

  if (pillar === 'Body') {
    const nutritionUnassessed = lanes.nutrition === 'unassessed';
    const processingUnassessed = lanes.processing === 'unassessed';
    if (nutritionUnassessed && processingUnassessed) {
      return [buildPrompt(pillar, 'base', BASE_PROMPT_COPY.Body, routeLive)];
    }
    if (nutritionUnassessed) {
      return [buildPrompt(pillar, 'body_nutri_unavailable', BODY_NUTRI_UNAVAILABLE_COPY, routeLive)];
    }
    // Processing-only: the base sentence says Body has no finding, and the nutrition
    // sentence names the wrong lane. Neither may be shown. A processing sentence needs
    // founder copy before this gap can be explained here.
    return [];
  }

  if (pillar === 'Ethics') {
    if (lanes.packet !== 'unassessed_or_incomplete') return [];
    return [buildPrompt(pillar, 'base', BASE_PROMPT_COPY.Ethics, routeLive)];
  }

  if (pillar === 'Open') {
    const ingredientUnassessed = lanes.ingredient_clarity === 'unassessed';
    const originsUnresolved =
      lanes.origins === 'unassessed' || lanes.origins === 'assessed_unresolved_conflict';
    if (!ingredientUnassessed && !originsUnresolved) return [];
    if (ingredientUnassessed && originsUnresolved) {
      return [buildPrompt(pillar, 'base', BASE_PROMPT_COPY.Open, routeLive)];
    }
    if (ingredientUnassessed) {
      return [
        buildPrompt(pillar, 'open_ingredient_unavailable', OPEN_INGREDIENT_UNAVAILABLE_COPY, routeLive),
      ];
    }
    return [
      buildPrompt(pillar, 'open_origins_insufficient', OPEN_ORIGINS_INSUFFICIENT_COPY, routeLive),
    ];
  }

  return [];
}

/** Governed contextual prompts for every pillar, keyed by internal pillar name. */
export function contextualContributionPromptsByPillar(
  fired: readonly FiredAdjustment[],
  options?: ContextualContributionPromptOptions & {
    governanceByPillar?: Partial<Record<ScoreHighlightPillar, ContextualPromptGovernance>>;
  }
): Record<ScoreHighlightPillar, ContextualContributionPrompt[]> {
  const shared = { userContributionRouteLive: options?.userContributionRouteLive };
  const byPillar = options?.governanceByPillar;
  return {
    Body: selectContextualContributionPrompts('Body', fired, {
      ...shared,
      governance: byPillar?.Body ?? options?.governance,
    }),
    Planet: selectContextualContributionPrompts('Planet', fired, {
      ...shared,
      governance: byPillar?.Planet ?? options?.governance,
    }),
    Ethics: selectContextualContributionPrompts('Ethics', fired, {
      ...shared,
      governance: byPillar?.Ethics ?? options?.governance,
    }),
    Open: selectContextualContributionPrompts('Open', fired, {
      ...shared,
      governance: byPillar?.Open ?? options?.governance,
    }),
  };
}
