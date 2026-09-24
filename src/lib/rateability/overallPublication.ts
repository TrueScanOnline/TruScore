/**
 * Overall publication / Confidence (§8).
 * Any pillar NR → Overall NR. Confidence = min of four Rated pillars.
 */

import { formatS26Explanation } from './s26Copy';
import type {
  BodyPublicationResult,
  ClaimsPublicationResult,
  ConfidenceLevel,
  OverallPublicationResult,
  OverallS26Code,
  PlanetPublicationResult,
  TransparencyPublicationResult,
} from './types';

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  limited: 1,
  moderate: 2,
  high: 3,
};

function minConfidence(levels: ConfidenceLevel[]): ConfidenceLevel {
  let min: ConfidenceLevel = 'high';
  for (const level of levels) {
    if (CONFIDENCE_RANK[level] < CONFIDENCE_RANK[min]) min = level;
  }
  return min;
}

function overallS26Code(confidence: ConfidenceLevel | null, rated: boolean): OverallS26Code {
  if (!rated) return 'OVERALL_NR';
  if (confidence === 'high') return 'OVERALL_HIGH';
  if (confidence === 'moderate') return 'OVERALL_MODERATE';
  return 'OVERALL_LIMITED';
}

export function publishOverall(args: {
  body: BodyPublicationResult;
  planet: PlanetPublicationResult;
  claims: ClaimsPublicationResult;
  transparency: TransparencyPublicationResult;
  /** Sum of pillar internal scores when all rated — existing Overall arithmetic. */
  internalOverallScore: number | null;
  checking?: boolean;
}): OverallPublicationResult {
  const { body, planet, claims, transparency, internalOverallScore, checking } = args;

  const lanes = {
    body: body.publicationStatus,
    planet: planet.publicationStatus,
    claims: claims.publicationStatus,
    transparency: transparency.publicationStatus,
  };

  if (checking || body.publicationStatus === 'checking' || planet.publicationStatus === 'checking' ||
      claims.publicationStatus === 'checking' || transparency.publicationStatus === 'checking') {
    return {
      publicationStatus: 'checking',
      internalScore: internalOverallScore,
      publishedScore: null,
      confidence: null,
      sourceQuality: 'other_or_unknown',
      s26: null,
      confidenceReasonCode: 'checking',
      assessmentLanes: lanes,
      diagnostic: { lanes },
    };
  }

  const anyNr =
    body.publicationStatus === 'nr' ||
    planet.publicationStatus === 'nr' ||
    claims.publicationStatus === 'nr' ||
    transparency.publicationStatus === 'nr';

  if (anyNr) {
    return {
      publicationStatus: 'nr',
      internalScore: internalOverallScore,
      publishedScore: null,
      confidence: null,
      sourceQuality: 'other_or_unknown',
      s26: {
        code: 'OVERALL_NR',
        copyStatus: 'provisional_awaiting_founder_approval',
        explanation: formatS26Explanation('OVERALL_NR'),
        contributionOpportunity: {
          material: false,
          domain: null,
          routeStatus: 'none',
        },
      },
      confidenceReasonCode: 'overall_any_pillar_nr',
      assessmentLanes: lanes,
      diagnostic: {
        lanes,
        unrevealedPillars: (['body', 'planet', 'claims', 'transparency'] as const).filter(
          (k) => lanes[k] === 'nr'
        ),
        noRenormalisation: true,
      },
    };
  }

  const pillarConfidences = [
    body.confidence,
    planet.confidence,
    claims.confidence,
    transparency.confidence,
  ].filter((c): c is ConfidenceLevel => c != null);

  const confidence = minConfidence(pillarConfidences);
  const code = overallS26Code(confidence, true);

  return {
    publicationStatus: 'rated',
    internalScore: internalOverallScore,
    publishedScore: internalOverallScore,
    confidence,
    sourceQuality: 'other_or_unknown',
    s26: {
      code,
      copyStatus: 'provisional_awaiting_founder_approval',
      explanation: formatS26Explanation(code),
      contributionOpportunity: {
        material: false,
        domain: null,
        routeStatus: 'none',
      },
    },
    confidenceReasonCode: `overall_min_${confidence}`,
    assessmentLanes: lanes,
    diagnostic: {
      lanes,
      pillarConfidences,
      minRule: true,
      noAverage: true,
      noRenormalisation: true,
    },
  };
}
