/**
 * Claims assessment decision procedure (v0.2 §10).
 * Packet Claim Context arithmetic + Organic claim-only + assessment state.
 */

import {
  buildAdversePacketContextCommentary,
  buildAssessedNeutralCommentary,
  buildOrganicClaimOnlyCommentary,
  buildPositivePacketContextCommentary,
} from './commentary';
import { matchAdmittedObservations, getMachineRegisterVersion } from './matchRegister';
import type {
  AdmittedPacketObservation,
  ClaimsBenchmarkCheck,
  ClaimsAssessmentResult,
  ClaimsFiredAdjustment,
  ClaimsNutrientContext,
  ClaimsSuppressedCandidate,
  PacketCoverageState,
} from './types';
import { CLAIMS_ASSESSMENT_SCHEMA_VERSION } from './types';

export interface AssessClaimsInput {
  admittedObservations: AdmittedPacketObservation[];
  packetCoverageState: PacketCoverageState;
  nutrientContext: ClaimsNutrientContext | null;
  /** Body NOVA group when known (optional commentary only). */
  novaGroup?: number | null;
  /** Certified Organic certification fired (+3). */
  certifiedOrganicFired: boolean;
  /** KTC/BBFAW check statuses for assessment_state and neutral copy. */
  benchmarkChecks: ClaimsBenchmarkCheck[];
  /** Other certification schemes fired (Fairtrade, MSC, …) — prevents assessed_neutral. */
  otherCertificationFired: boolean;
  /** Expected register version; mismatch fails closed for new recognition. */
  registerVersionExpected?: string;
}

function computePacketContextPoints(
  hasA: boolean,
  hasB: boolean,
  nutrient: ClaimsNutrientContext | null
): { points: 1 | -3 | 0; diagnostic?: string } {
  if (!hasA && !hasB) return { points: 0 };

  if (!nutrient) {
    return { points: 0, diagnostic: 'nutrient_context_missing' };
  }

  if (nutrient.any_governed_high && (hasA || hasB)) {
    return { points: -3 };
  }

  // Set B never +1
  if (!hasA && hasB) {
    return { points: 0, diagnostic: 'set_b_no_high_zero_outcome' };
  }

  // Set A positive requires complete required context and no High
  if (hasA && !nutrient.any_governed_high) {
    if (!nutrient.required_context_complete) {
      return { points: 0, diagnostic: 'nutrient_context_incomplete_no_positive' };
    }
    return { points: 1 };
  }

  return { points: 0 };
}

/**
 * Run Packet Claim Context + Set O Organic claim-only assessment.
 * Does not include KTC/BBFAW/certification arithmetic (caller merges).
 */
export function assessClaimsPacketAndOrganic(input: AssessClaimsInput): ClaimsAssessmentResult {
  const diagnostics: ClaimsAssessmentResult['diagnostics'] = [];
  const registerVersion = getMachineRegisterVersion();

  const match = matchAdmittedObservations(input.admittedObservations, {
    registerVersionExpected: input.registerVersionExpected,
  });
  diagnostics.push(...match.diagnostics);

  if (match.diagnostics.some((d) => d.code === 'register_version_mismatch')) {
    return {
      schema_version: CLAIMS_ASSESSMENT_SCHEMA_VERSION,
      register_version: registerVersion,
      nutrient_standard_version: input.nutrientContext?.standard_version ?? '',
      assessment_state: 'unassessed',
      packet_coverage_state: input.packetCoverageState,
      admitted_claims: [],
      unclassified_statements: [],
      nutrient_context: input.nutrientContext,
      benchmark_checks: input.benchmarkChecks,
      packet_context_points: 0,
      organic_claim_only_points: 0,
      fired_adjustments: [],
      suppressed_candidates: [],
      commentary_payload: { route: 'none', suppressed_reason: 'register_version_mismatch' },
      diagnostics,
    };
  }

  const setA = match.matched.filter((m) => m.set === 'A');
  const setB = match.matched.filter((m) => m.set === 'B');
  const setO = match.matched.filter((m) => m.set === 'O');
  const setC = match.matched.filter((m) => m.set === 'C');

  const { points: packetPoints, diagnostic: packetDiag } = computePacketContextPoints(
    setA.length > 0,
    setB.length > 0,
    input.nutrientContext
  );
  if (packetDiag) diagnostics.push({ code: packetDiag, detail: packetDiag });

  const fired: ClaimsFiredAdjustment[] = [];
  const suppressed: ClaimsSuppressedCandidate[] = [];

  // Organic claim-only +1, suppressed by Certified Organic +3
  let organicClaimOnlyPoints: 0 | 1 = 0;
  if (setO.length > 0) {
    if (input.certifiedOrganicFired) {
      suppressed.push({
        candidate_id: 'claims.organic.claim_only.v1',
        points_would_have_been: 1,
        reason_code: 'suppressed_by_certified_organic',
        reason_detail: 'ORG-02/ORG-03: Certified Organic +3 suppresses claim-only Organic +1',
      });
      diagnostics.push({
        code: 'organic_claim_only_suppressed',
        detail: 'Certified Organic present',
      });
    } else {
      organicClaimOnlyPoints = 1;
      fired.push({
        id: 'claims.organic.claim_only.v1',
        canonical_id: 'claims.organic.claim_only.v1',
        points: 1,
        description: 'Whole-product Organic claim (claim-only)',
        highlightEligible: true,
        family: 'organic_claim_only',
        metadata: {
          register_row_id: setO[0].register_row_id,
          display_text: setO[0].display_text,
          organicEvidenceClass: 'claim_only',
        },
      });
    }
  }

  const nova4 = input.novaGroup === 4;
  let commentary: ClaimsAssessmentResult['commentary_payload'] = { route: 'none' };

  if (packetPoints === -3) {
    fired.push({
      id: 'claims.packet_context.adverse.v1',
      canonical_id: 'claims.packet_context.adverse.v1',
      points: -3,
      description: 'Packet Claim Context adverse',
      highlightEligible: true,
      family: 'packet_context',
      metadata: {
        high_nutrients: (input.nutrientContext?.high_nutrient_labels ?? []).join('|'),
        claim_texts: [...setA, ...setB].map((c) => c.display_text).join('|'),
      },
    });
    commentary = buildAdversePacketContextCommentary(
      [...setA, ...setB],
      input.nutrientContext?.high_nutrient_labels ?? [],
      nova4
    );
  } else if (packetPoints === 1) {
    fired.push({
      id: 'claims.packet_context.positive.v1',
      canonical_id: 'claims.packet_context.positive.v1',
      points: 1,
      description: 'Packet Claim Context positive',
      highlightEligible: true,
      family: 'packet_context',
      metadata: {
        claim_texts: setA.map((c) => c.display_text).join('|'),
      },
    });
    commentary = buildPositivePacketContextCommentary(setA, nova4);
  } else if (organicClaimOnlyPoints === 1) {
    commentary = buildOrganicClaimOnlyCommentary();
  }

  // Assessment state
  const anyBenchmarkFired = input.benchmarkChecks.some(
    (b) => b.status === 'positive' || b.status === 'adverse'
  );
  const anyScoringClaimOrCert =
    fired.length > 0 || input.certifiedOrganicFired || input.otherCertificationFired;

  let assessment_state: ClaimsAssessmentResult['assessment_state'] = 'unassessed';
  if (input.packetCoverageState !== 'complete') {
    assessment_state = anyScoringClaimOrCert || anyBenchmarkFired ? 'assessed_scored' : 'unassessed';
    // If we have scored events, assessed_scored even if coverage incomplete
    if (anyScoringClaimOrCert || anyBenchmarkFired) assessment_state = 'assessed_scored';
  } else if (anyScoringClaimOrCert || anyBenchmarkFired) {
    assessment_state = 'assessed_scored';
  } else {
    // Complete coverage, no scoring claim/cert, no benchmark fire
    assessment_state = 'assessed_neutral';
    const nonScoring = [
      ...setC.map((c) => ({ display_text: c.display_text })),
      ...match.unclassified.map((u) => ({ display_text: u.display_text })),
    ];
    commentary = buildAssessedNeutralCommentary(nonScoring);
  }

  // If packet context commentary was suppressed (missing tokens), keep score event + diagnostic
  if (
    (packetPoints === 1 || packetPoints === -3) &&
    (commentary as { suppressed_reason?: string }).suppressed_reason
  ) {
    diagnostics.push({
      code: 'commentary_suppressed',
      detail: (commentary as { suppressed_reason?: string }).suppressed_reason || 'token_failure',
    });
  }

  return {
    schema_version: CLAIMS_ASSESSMENT_SCHEMA_VERSION,
    register_version: registerVersion,
    nutrient_standard_version: input.nutrientContext?.standard_version ?? '',
    assessment_state,
    packet_coverage_state: input.packetCoverageState,
    admitted_claims: match.matched,
    unclassified_statements: match.unclassified,
    nutrient_context: input.nutrientContext,
    benchmark_checks: input.benchmarkChecks,
    packet_context_points: packetPoints,
    organic_claim_only_points: organicClaimOnlyPoints,
    fired_adjustments: fired,
    suppressed_candidates: suppressed,
    commentary_payload: commentary,
    diagnostics,
  };
}
