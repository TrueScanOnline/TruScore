/**
 * Transparency (Open) publication / Confidence (§7).
 * Free-text contradiction → Origins insufficient/unresolved for Rateability (not conflict lane).
 */

import type { Product } from '../../types/product';
import type { OpenPillarResult } from '../truscoreEngine/pillars/openPillar';
import { formatS26Explanation } from './s26Copy';
import { applyAuthoritativeHighUplift, defaultProductSourceQuality } from './sourceQuality';
import type {
  AuthoritativeLaneOverrides,
  ConfidenceLevel,
  ContributionOpportunity,
  TransparencyIngredientLaneState,
  TransparencyOriginsLaneState,
  TransparencyPublicationResult,
  TransparencyS26Code,
} from './types';

function ingredientLaneResolved(open: OpenPillarResult): boolean {
  return open.adjustments.some(
    (a) =>
      a.id === 'open-v15-ing-clarity-zero' ||
      a.id === 'open-v15-ing-clarity-one' ||
      a.id === 'open-v15-ing-clarity-two' ||
      a.id === 'open-v15-ing-clarity-three-plus'
  );
}

function originsLaneState(open: OpenPillarResult): TransparencyOriginsLaneState {
  // Registry conflict ID retained for possible future wiring; free-text contradiction
  // is intentionally insufficient/unresolved (correction 2) — do not map to conflict lane.
  if (open.details.originsAdjustmentId === 'open-v15-origins-evidently-complete') {
    return 'resolved';
  }
  if (
    typeof open.details.originsAdjustmentId === 'string' &&
    (open.details.originsAdjustmentId.startsWith('open-v15-origins-pct-') ||
      open.details.originsAdjustmentId === 'open-v15-origins-qualified-partial' ||
      open.details.originsAdjustmentId === 'open-v15-origins-packet-gap')
  ) {
    return 'resolved';
  }
  return 'unassessed';
}

function buildOriginsPrefill(
  product: Product,
  open: OpenPillarResult
): ContributionOpportunity['prefill'] | undefined {
  const diag = open.details.originsDiagnostic;
  const candidate =
    diag?.structuredCountryCandidate ||
    (Array.isArray(product.origins_tags) && product.origins_tags.length === 1
      ? String(product.origins_tags[0])
          .replace(/^en:/i, '')
          .replace(/-/g, ' ')
          .trim()
      : undefined);
  // Only label free text as conflicting when the Origins diagnostic establishes contradiction.
  const conflicting =
    diag?.freeTextContradiction === true
      ? diag.conflictingFreeText ||
        (typeof product.origins === 'string' && product.origins.trim()
          ? product.origins.trim()
          : undefined)
      : undefined;
  const tags = Array.isArray(product.origins_tags)
    ? product.origins_tags.filter((t): t is string => typeof t === 'string')
    : undefined;

  if (!candidate && !conflicting && (!tags || tags.length === 0)) return undefined;
  return {
    ...(candidate ? { structuredOriginCountry: candidate } : {}),
    ...(conflicting ? { conflictingFreeTextOrigins: conflicting } : {}),
    ...(tags && tags.length > 0 ? { originsTags: tags } : {}),
  };
}

function transparencyContribution(
  product: Product,
  open: OpenPillarResult,
  ingredient: TransparencyIngredientLaneState,
  origins: TransparencyOriginsLaneState
): ContributionOpportunity | undefined {
  if (ingredient === 'resolved' && origins === 'resolved') return undefined;

  if (ingredient === 'resolved' && origins === 'unassessed') {
    const prefill = buildOriginsPrefill(product, open);
    return {
      material: true,
      domain: 'origins',
      routeStatus: 'live',
      routeKey: 'origins',
      ...(prefill ? { prefill } : {}),
    };
  }

  if (ingredient === 'unassessed' && origins === 'resolved') {
    return {
      material: true,
      domain: 'ingredients_nutrition',
      routeStatus: 'live',
      routeKey: 'ingredients_nutrition',
    };
  }

  if (ingredient === 'unassessed' && origins === 'unassessed') {
    // Prefer ingredients gap; if Origins contradiction diagnostic exists, still expose origins opp
    // when that is the actionable validate/correct path for available structured evidence.
    if (open.details.originsDiagnostic?.freeTextContradiction) {
      const prefill = buildOriginsPrefill(product, open);
      return {
        material: true,
        domain: 'origins',
        routeStatus: 'live',
        routeKey: 'origins',
        ...(prefill ? { prefill } : {}),
      };
    }
    return {
      material: true,
      domain: 'ingredients_nutrition',
      routeStatus: 'live',
      routeKey: 'ingredients_nutrition',
    };
  }

  return {
    material: true,
    domain: 'ingredients_nutrition',
    routeStatus: 'live',
    routeKey: 'ingredients_nutrition',
  };
}

function resolveTransparencyS26(
  ingredient: TransparencyIngredientLaneState,
  origins: TransparencyOriginsLaneState,
  confidence: ConfidenceLevel | null,
  rated: boolean
): TransparencyS26Code {
  if (!rated) return 'TRANSPARENCY_NR';
  if (confidence === 'high') return 'TRANSPARENCY_HIGH';
  if (confidence === 'moderate') return 'TRANSPARENCY_MODERATE';
  if (ingredient === 'resolved' && origins !== 'resolved') {
    return 'TRANSPARENCY_LIMITED_INGREDIENT_ONLY';
  }
  if (ingredient !== 'resolved' && origins === 'resolved') {
    return 'TRANSPARENCY_LIMITED_ORIGINS_ONLY';
  }
  return 'TRANSPARENCY_LIMITED_INGREDIENT_ONLY';
}

export function publishTransparencyPillar(args: {
  product: Product;
  open: OpenPillarResult;
  checking?: boolean;
  authoritative?: AuthoritativeLaneOverrides;
}): TransparencyPublicationResult {
  const { product, open, checking, authoritative } = args;
  const sourceQuality = defaultProductSourceQuality(product);
  const ingredient: TransparencyIngredientLaneState = ingredientLaneResolved(open)
    ? 'resolved'
    : 'unassessed';
  const origins = originsLaneState(open);

  if (checking) {
    return {
      publicationStatus: 'checking',
      internalScore: open.score,
      publishedScore: null,
      confidence: null,
      sourceQuality,
      s26: null,
      confidenceReasonCode: 'checking',
      assessmentLanes: { ingredient_clarity: ingredient, origins },
      diagnostic: {
        ingredient,
        origins,
        originsDiagnostic: open.details.originsDiagnostic ?? null,
      },
    };
  }

  const canRate = ingredient === 'resolved' || origins === 'resolved';

  if (!canRate) {
    const opp = transparencyContribution(product, open, ingredient, origins);
    return {
      publicationStatus: 'nr',
      internalScore: open.score,
      publishedScore: null,
      confidence: null,
      sourceQuality,
      s26: {
        code: 'TRANSPARENCY_NR',
        copyStatus: 'provisional_awaiting_founder_approval',
        explanation: formatS26Explanation('TRANSPARENCY_NR'),
        contributionOpportunity: opp,
      },
      confidenceReasonCode: 'transparency_nr',
      assessmentLanes: { ingredient_clarity: ingredient, origins },
      diagnostic: {
        ingredient,
        origins,
        originsDiagnostic: open.details.originsDiagnostic ?? null,
      },
    };
  }

  const bothResolved = ingredient === 'resolved' && origins === 'resolved';
  let structural: ConfidenceLevel = bothResolved ? 'moderate' : 'limited';
  const ingAuth = !!authoritative?.transparencyIngredient;
  const origAuth = !!authoritative?.transparencyOrigins;
  const confidence = applyAuthoritativeHighUplift({
    structural: structural === 'moderate' && ingAuth && origAuth ? 'high' : structural,
    bothLanesResolved: bothResolved,
    laneAAuthoritative: ingAuth,
    laneBAuthoritative: origAuth,
  });

  const code = resolveTransparencyS26(ingredient, origins, confidence, true);
  const opp = transparencyContribution(product, open, ingredient, origins);

  return {
    publicationStatus: 'rated',
    internalScore: open.score,
    publishedScore: open.score,
    confidence,
    sourceQuality,
    s26: {
      code,
      copyStatus: 'provisional_awaiting_founder_approval',
      explanation: formatS26Explanation(code),
      ...(opp ? { contributionOpportunity: opp } : {}),
    },
    confidenceReasonCode:
      confidence === 'high'
        ? 'transparency_both_authoritative'
        : confidence === 'moderate'
          ? 'transparency_both_lanes'
          : ingredient === 'resolved'
            ? 'transparency_ingredient_only'
            : 'transparency_origins_only',
    assessmentLanes: { ingredient_clarity: ingredient, origins },
    diagnostic: {
      ingredient,
      origins,
      originsAdjustmentId: open.details.originsAdjustmentId,
      originsProvenance: open.details.originsProvenance,
      originsDiagnostic: open.details.originsDiagnostic ?? null,
      freeTextContradiction: !!open.details.originsDiagnostic?.freeTextContradiction,
    },
  };
}
