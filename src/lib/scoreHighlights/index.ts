/**
 * Wave 3 governed Score Highlights — public surface for S12 overall promotion and the
 * S12a pillar look-through. Consumers of this module must not reach into pillar registries
 * or the fired ledger directly.
 */

export {
  SCORE_HIGHLIGHT_PILLAR_ORDER,
  type FiredAdjustment,
  type ScoreHighlightBand,
  type ScoreHighlightExclusion,
  type ScoreHighlightL3Route,
  type ScoreHighlightPillar,
  type ScoreHighlightSelection,
  type ScoreHighlightStory,
} from './types';

export { selectScoreHighlights, type SelectScoreHighlightsOptions } from './selectScoreHighlights';

export {
  firedLedgerFromAnalysis,
  firedLedgerFromPillarDetails,
  firedLedgerFromTruScoreResult,
} from './firedLedger';

export {
  scoreHighlightBand,
  scoreHighlightBandStyle,
  scoreHighlightDirectionGlyph,
  type ScoreHighlightBandStyle,
} from './materialityBands';

export {
  BODY_COLOUR_SYNTHESIS_FAMILY,
  BODY_COLOUR_SYNTHESIS_MEMBER_IDS,
} from './bodyColourSynthesis';

export {
  ACTIVE_CONSUMER_PILLAR_LABELS,
  consumerPillarLabel,
} from './consumerPillarLabels';

export {
  contextualContributionPromptsByPillar,
  selectContextualContributionPrompts,
  type ContextualContributionPrompt,
  type ContextualContributionPromptOptions,
  type ContextualPromptAction,
  type ContextualPromptKind,
} from './contextualContributionPrompts';

/** Locked consumer heading for both overall S12 and the S12a pillar look-through. */
export const SCORE_HIGHLIGHTS_HEADING = 'What we found';
