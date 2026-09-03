/**
 * Governed Score Highlights selection engine (S12 overall promotion + S12a pillar look-through).
 *
 * Pipeline, in order (v0.4 §3):
 *   1. Collect fired adjustments carrying stable production IDs.
 *   2. Keep only Highlight-eligible rows, cross-checked against the governed registry.
 *   3. Apply the single approved presentation synthesis (Body colour-warning cluster).
 *   4. Rank each pillar's positive and negative pools by absolute materiality, then locked priority.
 *   5. Overall S12 promotes at most one positive and one negative per pillar.
 *   6. S12a exposes every eligible story for one pillar after synthesis, same deterministic order.
 *
 * Base rows, rescues, arithmetic normalisers and ineligible NOVA provenance states never reach a
 * consumer surface: they are Highlight-ineligible in the registries and are filtered here too.
 * Adjustment descriptions are never inspected.
 */

import {
  BODY_COLOUR_SYNTHESIS_FAMILY,
  BODY_COLOUR_SYNTHESIS_L1,
  bodyColourSynthesisL2,
  bodyColourSynthesisMateriality,
  bodyColourSynthesisPriority,
  isBodyColourSynthesisMemberId,
} from './bodyColourSynthesis';
import {
  governedCommentaryRow,
  governedL3Route,
  resolveGovernedCopy,
  type GovernedCopyOptions,
} from './governedCommentary';
import { scoreHighlightBand } from './materialityBands';
import { lockedPromotionPriority } from './promotionPriority';
import {
  SCORE_HIGHLIGHT_PILLAR_ORDER,
  type FiredAdjustment,
  type ScoreHighlightExclusion,
  type ScoreHighlightPillar,
  type ScoreHighlightSelection,
  type ScoreHighlightStory,
} from './types';

export type SelectScoreHighlightsOptions = GovernedCopyOptions;

function emptyByPillar(): Record<ScoreHighlightPillar, ScoreHighlightStory[]> {
  return { Body: [], Planet: [], Ethics: [], Open: [] };
}

/**
 * Deterministic ordering: larger absolute materiality first, then locked registry priority.
 * `storyKey` is a final stable discriminator so two rows can never depend on array order.
 */
function compareStories(a: ScoreHighlightStory, b: ScoreHighlightStory): number {
  const byMateriality = Math.abs(b.materiality) - Math.abs(a.materiality);
  if (byMateriality !== 0) return byMateriality;
  if (a.priority !== b.priority) return a.priority - b.priority;
  return a.storyKey < b.storyKey ? -1 : a.storyKey > b.storyKey ? 1 : 0;
}

export function selectScoreHighlights(
  fired: readonly FiredAdjustment[],
  options?: SelectScoreHighlightsOptions
): ScoreHighlightSelection {
  const exclusions: ScoreHighlightExclusion[] = [];
  const candidates: ScoreHighlightStory[] = [];
  const firedColoursByPillar: FiredAdjustment[] = [];

  fired.forEach((row) => {
    if (!row.id) {
      exclusions.push({ pillar: row.pillar, adjustmentId: null, reason: 'no_stable_id' });
      return;
    }
    const registry = governedCommentaryRow(row.pillar, row.id);
    if (!registry) {
      exclusions.push({ pillar: row.pillar, adjustmentId: row.id, reason: 'unknown_registry_id' });
      return;
    }
    if (!registry.highlightEligible) {
      exclusions.push({ pillar: row.pillar, adjustmentId: row.id, reason: 'registry_ineligible' });
      return;
    }
    if (row.highlightEligible === false) {
      exclusions.push({ pillar: row.pillar, adjustmentId: row.id, reason: 'scorer_ineligible' });
      return;
    }
    if (row.value === 0) {
      exclusions.push({ pillar: row.pillar, adjustmentId: row.id, reason: 'zero_materiality' });
      return;
    }

    // Approved synthesis: individual colour candidates are removed and replaced by one
    // presentation candidate bound to the exact fired colour IDs.
    if (row.pillar === 'Body' && isBodyColourSynthesisMemberId(row.id)) {
      firedColoursByPillar.push(row);
      exclusions.push({ pillar: 'Body', adjustmentId: row.id, reason: 'absorbed_by_synthesis' });
      return;
    }

    const priority = lockedPromotionPriority(row.pillar, row.id);
    if (priority == null) {
      exclusions.push({
        pillar: row.pillar,
        adjustmentId: row.id,
        reason: 'missing_promotion_priority',
      });
      return;
    }

    const copy = resolveGovernedCopy(row.pillar, row.id, row.metadata);
    if (!copy) {
      exclusions.push({
        pillar: row.pillar,
        adjustmentId: row.id,
        reason: 'unresolved_locked_copy_token',
      });
      return;
    }

    candidates.push({
      pillar: row.pillar,
      storyKey: row.id,
      boundAdjustmentIds: [row.id],
      sign: row.value > 0 ? 'positive' : 'negative',
      materiality: row.value,
      priority,
      band: scoreHighlightBand(row.value),
      l1: copy.l1,
      l2: copy.l2,
      l3Route: governedL3Route(row.pillar, [row.id], registry.externalResource, options),
      ...(row.metadata && { metadata: row.metadata }),
    });
  });

  if (firedColoursByPillar.length > 0) {
    const boundIds = firedColoursByPillar
      .map((row) => row.id as string)
      .filter((id, index, all) => all.indexOf(id) === index)
      .sort();
    const materiality = bodyColourSynthesisMateriality(boundIds.length);
    const externalResource =
      governedCommentaryRow('Body', boundIds[0])?.externalResource ?? '';
    candidates.push({
      pillar: 'Body',
      storyKey: BODY_COLOUR_SYNTHESIS_FAMILY,
      synthesisFamily: BODY_COLOUR_SYNTHESIS_FAMILY,
      boundAdjustmentIds: boundIds,
      sign: 'negative',
      materiality,
      priority: bodyColourSynthesisPriority(boundIds.length),
      band: scoreHighlightBand(materiality),
      l1: BODY_COLOUR_SYNTHESIS_L1,
      l2: bodyColourSynthesisL2(boundIds),
      l3Route: governedL3Route('Body', boundIds, externalResource, options),
    });
  }

  const byPillar = emptyByPillar();
  candidates.forEach((story) => byPillar[story.pillar].push(story));

  const promoted: ScoreHighlightStory[] = [];
  SCORE_HIGHLIGHT_PILLAR_ORDER.forEach((pillar) => {
    byPillar[pillar].sort(compareStories);

    const topPositive = byPillar[pillar].find((s) => s.sign === 'positive');
    const topNegative = byPillar[pillar].find((s) => s.sign === 'negative');
    const pillarPromoted = [topPositive, topNegative].filter(
      (s): s is ScoreHighlightStory => s != null
    );
    pillarPromoted.forEach((story) => {
      story.promotedOverall = true;
    });
    // Within a pillar the more material promoted story renders first. Where the promoted
    // positive and negative are equally material the locked registry priority each story
    // already carries decides, so ordering stays registry-driven rather than sign-driven.
    pillarPromoted.sort(compareStories);
    promoted.push(...pillarPromoted);
  });

  return { promoted, byPillar, exclusions };
}
