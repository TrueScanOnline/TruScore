/**
 * Claims publication / Confidence (§6).
 * Lane assessment is separate from the fired-adjustment ledger — no synthetic +0.
 */

import type { Product } from '../../types/product';
import type { EthicsPillarResult } from '../truscoreEngine/pillars/ethicsPillar';
import type {
  ClaimsAssessmentResult,
  ClaimsBenchmarkCheck,
} from '../truscoreEngine/claims/types';
import { formatS26Explanation } from './s26Copy';
import { applyAuthoritativeHighUplift, defaultProductSourceQuality } from './sourceQuality';
import type {
  AuthoritativeLaneOverrides,
  ClaimsLaneState,
  ClaimsPublicationResult,
  ClaimsS26Code,
  ConfidenceLevel,
  ContributionOpportunity,
} from './types';

/**
 * Single benchmark check successfully assessed for Rateability (§6 / correction 1).
 * positive / adverse / no_finding → yes
 * failed → no
 * not_applicable → only when not_applicable_resolution === completed_no_applicable_result
 */
export function isBenchmarkCheckSuccessfullyAssessed(check: ClaimsBenchmarkCheck): boolean {
  if (check.status === 'positive' || check.status === 'adverse' || check.status === 'no_finding') {
    return true;
  }
  if (check.status === 'failed') return false;
  if (check.status === 'not_applicable') {
    return check.not_applicable_resolution === 'completed_no_applicable_result';
  }
  return false;
}

/** Packet lane: substantive assessment completed — not inferred from score movement alone. */
export function isClaimsPacketLaneAssessed(assessment: ClaimsAssessmentResult | undefined): boolean {
  if (!assessment) return false;
  if (assessment.packet_coverage_state === 'complete') return true;
  if (assessment.packet_context_points !== 0) return true;
  if (assessment.organic_claim_only_points !== 0) return true;
  const packetFamilies = new Set(['packet_context', 'organic_claim_only', 'certifications']);
  if (assessment.fired_adjustments.some((f) => packetFamilies.has(f.family))) return true;
  return false;
}

function ethicsCertFired(ethics: EthicsPillarResult): boolean {
  const d = ethics.details;
  if (d.certificationsAdjustment !== 0) return true;
  if (d.certificationsWinningScheme) return true;
  return false;
}

/** Both KTC and BBFAW must reach successful terminal outcomes (§6). */
export function isClaimsBenchmarkLaneAssessed(
  assessment: ClaimsAssessmentResult | undefined
): boolean {
  if (!assessment?.benchmark_checks?.length) return false;
  const ktc = assessment.benchmark_checks.find((b) => b.source === 'ktc');
  const bbfaw = assessment.benchmark_checks.find((b) => b.source === 'bbfaw');
  if (!ktc || !bbfaw) return false;
  return isBenchmarkCheckSuccessfullyAssessed(ktc) && isBenchmarkCheckSuccessfullyAssessed(bbfaw);
}

function claimsContributionOpportunity(packet: ClaimsLaneState): ContributionOpportunity | undefined {
  if (packet === 'assessed') return undefined;
  return {
    material: true,
    domain: 'claims_packet_evidence',
    routeStatus: 'future',
  };
}

function resolveClaimsS26(
  packet: ClaimsLaneState,
  benchmark: ClaimsLaneState,
  confidence: ConfidenceLevel | null,
  rated: boolean
): ClaimsS26Code {
  if (!rated) return 'CLAIMS_NR';
  if (confidence === 'high') return 'CLAIMS_HIGH';
  if (confidence === 'moderate') return 'CLAIMS_MODERATE';
  if (packet === 'assessed' && benchmark !== 'assessed') return 'CLAIMS_LIMITED_PACKET_ONLY';
  if (packet !== 'assessed' && benchmark === 'assessed') return 'CLAIMS_LIMITED_BENCHMARK_ONLY';
  return 'CLAIMS_LIMITED_PACKET_ONLY';
}

export function publishClaimsPillar(args: {
  product: Product;
  ethics: EthicsPillarResult;
  checking?: boolean;
  authoritative?: AuthoritativeLaneOverrides;
}): ClaimsPublicationResult {
  const { product, ethics, checking, authoritative } = args;
  const sourceQuality = defaultProductSourceQuality(product);
  const assessment = ethics.details.claimsAssessment;

  const packetAssessed =
    isClaimsPacketLaneAssessed(assessment) || ethicsCertFired(ethics);
  const benchmarkAssessed = isClaimsBenchmarkLaneAssessed(assessment);

  const packet: ClaimsLaneState = packetAssessed ? 'assessed' : 'unassessed_or_incomplete';
  const benchmark: ClaimsLaneState = benchmarkAssessed
    ? 'assessed'
    : 'unassessed_or_incomplete';

  if (checking) {
    return {
      publicationStatus: 'checking',
      internalScore: ethics.score,
      publishedScore: null,
      confidence: null,
      sourceQuality,
      s26: null,
      confidenceReasonCode: 'checking',
      assessmentLanes: { packet, benchmark },
      diagnostic: {
        packet,
        benchmark,
        assessment_state: assessment?.assessment_state ?? null,
        packet_coverage_state: assessment?.packet_coverage_state ?? null,
        scoringAssessmentStatePreserved: assessment?.assessment_state ?? null,
        benchmark_checks: assessment?.benchmark_checks ?? [],
      },
    };
  }

  if (!packetAssessed && !benchmarkAssessed) {
    const opp = claimsContributionOpportunity(packet);
    return {
      publicationStatus: 'nr',
      internalScore: ethics.score,
      publishedScore: null,
      confidence: null,
      sourceQuality,
      s26: {
        code: 'CLAIMS_NR',
        copyStatus: 'provisional_awaiting_founder_approval',
        explanation: formatS26Explanation('CLAIMS_NR'),
        contributionOpportunity: opp,
      },
      confidenceReasonCode: 'claims_nr',
      assessmentLanes: { packet, benchmark },
      diagnostic: {
        packet,
        benchmark,
        assessment_state: assessment?.assessment_state ?? null,
        packet_coverage_state: assessment?.packet_coverage_state ?? null,
        noSyntheticZeroAdjustments: true,
        benchmark_checks: assessment?.benchmark_checks ?? [],
      },
    };
  }

  let structural: ConfidenceLevel =
    packetAssessed && benchmarkAssessed ? 'moderate' : 'limited';
  const packetAuth = !!authoritative?.claimsPacket;
  const benchmarkAuth = !!authoritative?.claimsBenchmark;
  const confidence = applyAuthoritativeHighUplift({
    structural:
      structural === 'moderate' && packetAuth && benchmarkAuth ? 'high' : structural,
    bothLanesResolved: packetAssessed && benchmarkAssessed,
    laneAAuthoritative: packetAuth,
    laneBAuthoritative: benchmarkAuth,
  });

  const code = resolveClaimsS26(packet, benchmark, confidence, true);
  const opp = claimsContributionOpportunity(packet);

  return {
    publicationStatus: 'rated',
    internalScore: ethics.score,
    publishedScore: ethics.score,
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
        ? 'claims_both_lanes_authoritative'
        : confidence === 'moderate'
          ? 'claims_both_lanes'
          : packetAssessed
            ? 'claims_packet_only'
            : 'claims_benchmark_only',
    assessmentLanes: { packet, benchmark },
    diagnostic: {
      packet,
      benchmark,
      assessment_state: assessment?.assessment_state ?? null,
      packet_coverage_state: assessment?.packet_coverage_state ?? null,
      packet_context_points: assessment?.packet_context_points ?? 0,
      organic_claim_only_points: assessment?.organic_claim_only_points ?? 0,
      benchmark_checks: assessment?.benchmark_checks ?? [],
      noSyntheticZeroAdjustments: true,
      packetAuthoritative: packetAuth,
      benchmarkAuthoritative: benchmarkAuth,
    },
  };
}
