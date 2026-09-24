/**
 * Claims assessment decision procedure (v0.2 §10).
 * Packet Claim Context arithmetic + Organic claim-only + assessment state.
 * assessment_state and packet_coverage_state are orthogonal (CR-07).
 */

import {
  buildAdversePacketContextCommentary,
  buildAssessedNeutralCommentary,
  buildOrganicClaimOnlyCommentary,
  buildPositivePacketContextCommentary,
} from './commentary';
import { matchAdmittedObservations, getMachineRegisterVersion } from './matchRegister';
import { claimsNutrientVersionIdentities } from './nutrientContextAdapter';
import type {
  AdmittedPacketObservation,
  ClaimsBenchmarkCheck,
  ClaimsAssessmentResult,
  ClaimsCommentaryPayload,
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
  novaGroup?: number | null;
  certifiedOrganicFired: boolean;
  /** KTC/BBFAW check statuses for assessment_state and Rateability publication. */
  benchmarkChecks: ClaimsBenchmarkCheck[];
  /** Other certification schemes fired (Fairtrade, MSC, …) — prevents assessed_neutral. */
  otherCertificationFired: boolean;
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

  if (!hasA && hasB) {
    return { points: 0, diagnostic: 'set_b_no_high_zero_outcome' };
  }

  if (hasA && !nutrient.any_governed_high) {
    if (!nutrient.required_context_complete) {
      return { points: 0, diagnostic: 'nutrient_context_incomplete_no_positive' };
    }
    return { points: 1 };
  }

  return { points: 0 };
}

function emptyResult(
  partial: Partial<ClaimsAssessmentResult> &
    Pick<ClaimsAssessmentResult, 'diagnostics' | 'packet_coverage_state' | 'benchmark_checks'>
): ClaimsAssessmentResult {
  const versions = claimsNutrientVersionIdentities();
  return {
    schema_version: CLAIMS_ASSESSMENT_SCHEMA_VERSION,
    register_version: getMachineRegisterVersion(),
    nutrient_standard_version: versions.nutrient_standard_version,
    nutrient_methodology_version: versions.nutrient_methodology_version,
    nutrient_reference_asset_id: versions.nutrient_reference_asset_id,
    assessment_state: 'unassessed',
    admitted_claims: [],
    unclassified_statements: [],
    nutrient_context: null,
    packet_context_points: 0,
    organic_claim_only_points: 0,
    fired_adjustments: [],
    suppressed_candidates: [],
    commentary_payload: { route: 'none' },
    commentary_by_event_id: {},
    publication_packet_lane: 'unassessed_or_incomplete',
    ...partial,
  };
}

/**
 * Run Packet Claim Context + Set O Organic claim-only assessment.
 */
export function assessClaimsPacketAndOrganic(input: AssessClaimsInput): ClaimsAssessmentResult {
  const diagnostics: ClaimsAssessmentResult['diagnostics'] = [];
  const registerVersion = getMachineRegisterVersion();
  const versions = claimsNutrientVersionIdentities();
  const nutrientVersions = {
    nutrient_standard_version:
      input.nutrientContext?.nutrient_reference_asset_id ||
      input.nutrientContext?.standard_version ||
      versions.nutrient_standard_version,
    nutrient_methodology_version:
      input.nutrientContext?.nutrient_methodology_version || versions.nutrient_methodology_version,
    nutrient_reference_asset_id:
      input.nutrientContext?.nutrient_reference_asset_id || versions.nutrient_reference_asset_id,
  };

  const match = matchAdmittedObservations(input.admittedObservations, {
    registerVersionExpected: input.registerVersionExpected,
  });
  diagnostics.push(...match.diagnostics);

  if (match.diagnostics.some((d) => d.code === 'register_version_mismatch')) {
    return emptyResult({
      ...nutrientVersions,
      register_version: registerVersion,
      packet_coverage_state: input.packetCoverageState,
      nutrient_context: input.nutrientContext,
      benchmark_checks: input.benchmarkChecks,
      commentary_payload: { route: 'none', suppressed_reason: 'register_version_mismatch' },
      diagnostics,
    });
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
  const commentaryByEvent: Record<string, ClaimsCommentaryPayload> = {};

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
        detail: 'Certified Organic present — claim-only +1 suppressed; reason exposed for S28',
      });
    } else {
      organicClaimOnlyPoints = 1;
      const organicCommentary = buildOrganicClaimOnlyCommentary();
      commentaryByEvent['claims.organic.claim_only.v1'] = organicCommentary;
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
          evidence_id: setO[0].evidence_id,
          admission_method: setO[0].admission_method,
          ...(organicCommentary.l1 ? { claimsL1: organicCommentary.l1 } : {}),
          ...(organicCommentary.l2 ? { claimsL2: organicCommentary.l2 } : {}),
          ...(organicCommentary.l3_body ? { claimsL3Body: organicCommentary.l3_body } : {}),
          ...(organicCommentary.cta_label ? { claimsCtaLabel: organicCommentary.cta_label } : {}),
          ...(organicCommentary.cta_domain ? { claimsCtaDomain: organicCommentary.cta_domain } : {}),
        },
      });
    }
  }

  const nova4 = input.novaGroup === 4;

  if (packetPoints === -3) {
    const adverse = buildAdversePacketContextCommentary(
      [...setA, ...setB],
      input.nutrientContext?.high_nutrient_labels ?? [],
      nova4
    );
    commentaryByEvent['claims.packet_context.adverse.v1'] = adverse;
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
        ...(adverse.l1 ? { claimsL1: adverse.l1 } : {}),
        ...(adverse.l2 ? { claimsL2: adverse.l2 } : {}),
      },
    });
  } else if (packetPoints === 1) {
    const positive = buildPositivePacketContextCommentary(setA, nova4);
    commentaryByEvent['claims.packet_context.positive.v1'] = positive;
    fired.push({
      id: 'claims.packet_context.positive.v1',
      canonical_id: 'claims.packet_context.positive.v1',
      points: 1,
      description: 'Packet Claim Context positive',
      highlightEligible: true,
      family: 'packet_context',
      metadata: {
        claim_texts: setA.map((c) => c.display_text).join('|'),
        ...(positive.l1 ? { claimsL1: positive.l1 } : {}),
        ...(positive.l2 ? { claimsL2: positive.l2 } : {}),
      },
    });
  }

  // Primary commentary: prefer packet context, else organic (both retained in commentary_by_event_id)
  let commentary_payload: ClaimsCommentaryPayload = { route: 'none' };
  if (commentaryByEvent['claims.packet_context.adverse.v1']) {
    commentary_payload = commentaryByEvent['claims.packet_context.adverse.v1'];
  } else if (commentaryByEvent['claims.packet_context.positive.v1']) {
    commentary_payload = commentaryByEvent['claims.packet_context.positive.v1'];
  } else if (commentaryByEvent['claims.organic.claim_only.v1']) {
    commentary_payload = commentaryByEvent['claims.organic.claim_only.v1'];
  }

  const anyBenchmarkFired = input.benchmarkChecks.some(
    (b) => b.status === 'positive' || b.status === 'adverse'
  );
  const anyScoringClaimOrCert =
    fired.length > 0 || input.certifiedOrganicFired || input.otherCertificationFired;

  // CR-07: assessment_state orthogonal to packet_coverage_state
  let assessment_state: ClaimsAssessmentResult['assessment_state'] = 'unassessed';
  if (anyScoringClaimOrCert || anyBenchmarkFired) {
    assessment_state = 'assessed_scored';
  } else if (input.packetCoverageState === 'complete') {
    assessment_state = 'assessed_neutral';
    const nonScoring = [
      ...setC.map((c) => ({ display_text: c.display_text })),
      ...match.unclassified.map((u) => ({ display_text: u.display_text })),
    ];
    commentary_payload = buildAssessedNeutralCommentary(nonScoring);
  } else {
    assessment_state = 'unassessed';
  }

  // Rateability Packet lane — consume Claims assessment truth only (no invented coverage).
  // Assessed when: governed packet claims/certs were admitted & evaluated (incl. zero adjustment),
  // OR upstream packet_coverage_state === complete (no-claim complete coverage).
  // incomplete + empty/unmatched OFF labels must NOT become “no packet claims” / assessed.
  const packetFamilies = new Set(['packet_context', 'organic_claim_only', 'certifications']);
  const packetOrCertScored =
    packetPoints !== 0 ||
    organicClaimOnlyPoints !== 0 ||
    input.certifiedOrganicFired ||
    input.otherCertificationFired ||
    fired.some((f) => packetFamilies.has(f.family));
  const governedPacketClaimsAdmitted = match.matched.length > 0;
  let publication_packet_lane: ClaimsAssessmentResult['publication_packet_lane'] =
    'unassessed_or_incomplete';
  if (
    packetOrCertScored ||
    governedPacketClaimsAdmitted ||
    input.packetCoverageState === 'complete'
  ) {
    publication_packet_lane = 'assessed';
    if (
      governedPacketClaimsAdmitted &&
      !packetOrCertScored &&
      input.packetCoverageState !== 'complete'
    ) {
      diagnostics.push({
        code: 'packet_lane_assessed_no_adjustment',
        detail:
          'Packet publication lane assessed after governed claim admission with zero packet scoring adjustment',
      });
    }
  }

  if (
    (packetPoints === 1 || packetPoints === -3) &&
    commentary_payload.suppressed_reason
  ) {
    diagnostics.push({
      code: 'commentary_suppressed',
      detail: commentary_payload.suppressed_reason || 'token_failure',
    });
  }

  return {
    schema_version: CLAIMS_ASSESSMENT_SCHEMA_VERSION,
    register_version: registerVersion,
    ...nutrientVersions,
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
    commentary_payload,
    commentary_by_event_id: commentaryByEvent,
    diagnostics,
    publication_packet_lane,
  };
}
