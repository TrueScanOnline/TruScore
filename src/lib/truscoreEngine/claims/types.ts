/**
 * Wave 3 Claims Rescue — shared types (controlling specification v0.2).
 * Consumer name: Claims. Legacy Ethics IDs may remain internal.
 */

export const CLAIMS_ASSESSMENT_SCHEMA_VERSION = 'claims-assessment-v1';
export const PACKET_CLAIM_MACHINE_REGISTER_VERSION = '20260912_v1_0';

export type ClaimsCatalogueSet = 'A' | 'B' | 'O' | 'C';
export type ClaimsAssessmentState = 'unassessed' | 'assessed_neutral' | 'assessed_scored';
export type PacketCoverageState = 'pending' | 'incomplete' | 'complete' | 'failed';
export type BenchmarkCheckStatus =
  | 'not_applicable'
  | 'no_finding'
  | 'positive'
  | 'adverse'
  | 'failed';

export type ClaimsCanonicalAdjustmentId =
  | 'claims.packet_context.positive.v1'
  | 'claims.packet_context.adverse.v1'
  | 'claims.organic.claim_only.v1';

/** Runtime IDs used in the fired ledger (map 1:1 to canonical semantic events). */
export type ClaimsRuntimeAdjustmentId =
  | ClaimsCanonicalAdjustmentId
  | 'ethics-v37-cert-organic'
  | string;

export interface AdmittedPacketObservation {
  evidence_id: string;
  observed_text: string;
  display_text: string;
  admission_method: 'packet_image' | 'ocr_crop' | 'user_confirmation' | 'governed_product_name';
  source_locator?: string;
  /** When true, observation is product-name scope for O-ORG-002. */
  is_product_name?: boolean;
}

export interface MatchedClaimObservation {
  evidence_id: string;
  observed_text: string;
  display_text: string;
  register_row_id: string;
  canonical_family: string;
  set: ClaimsCatalogueSet;
  admission_method: AdmittedPacketObservation['admission_method'];
  source_locator?: string;
  collision_priority: number;
  context_test_eligible: boolean;
  /**
   * R-013 / A-VMC-003: distinct active vitamin/mineral member targets on a combination
   * observation. Absent for non-combination rows. Never implies one score event per member.
   */
  member_targets?: string[];
}

export interface ClaimsNutrientEntry {
  level: 'low' | 'moderate' | 'high' | 'unavailable';
  per_100_value?: number;
  per_portion_value?: number;
  high_reason?: 'threshold' | 'large_portion_override' | null;
  source_evidence_id?: string;
}

export interface ClaimsNutrientContext {
  standard_version: string;
  basis: 'food' | 'drink' | 'unknown';
  large_portion_override: boolean;
  nutrients: {
    total_sugars: ClaimsNutrientEntry;
    saturated_fat: ClaimsNutrientEntry;
    sodium: ClaimsNutrientEntry;
  };
  /** Completeness of the three governed nutrients for +1 eligibility. */
  required_context_complete: boolean;
  any_governed_high: boolean;
  high_nutrient_labels: ('total sugars' | 'saturated fat' | 'sodium')[];
}

export interface ClaimsFiredAdjustment {
  id: ClaimsRuntimeAdjustmentId;
  canonical_id?: ClaimsCanonicalAdjustmentId;
  points: number;
  description: string;
  highlightEligible: boolean;
  family: 'packet_context' | 'organic_claim_only' | 'certifications' | 'ktc' | 'bbfaw' | 'system';
  metadata?: Record<string, string | number | boolean>;
}

export interface ClaimsSuppressedCandidate {
  candidate_id: ClaimsCanonicalAdjustmentId | string;
  points_would_have_been: number;
  reason_code: string;
  reason_detail: string;
}

export interface ClaimsCommentaryPayload {
  route:
    | 'packet_context_positive'
    | 'packet_context_adverse'
    | 'assessed_neutral'
    | 'organic_claim_only'
    | 'none';
  l1?: string;
  l2?: string;
  claim_display_texts?: string[];
  high_nutrient_labels?: string[];
  nova4_sentence_appended?: boolean;
  suppressed_reason?: string;
}

export interface ClaimsDiagnostic {
  code: string;
  detail: string;
}

export interface ClaimsAssessmentResult {
  schema_version: string;
  register_version: string;
  nutrient_standard_version: string;
  assessment_state: ClaimsAssessmentState;
  packet_coverage_state: PacketCoverageState;
  admitted_claims: MatchedClaimObservation[];
  unclassified_statements: {
    evidence_id: string;
    observed_text: string;
    display_text: string;
  }[];
  nutrient_context: ClaimsNutrientContext | null;
  benchmark_checks: { source: 'ktc' | 'bbfaw'; status: BenchmarkCheckStatus }[];
  packet_context_points: 1 | -3 | 0;
  organic_claim_only_points: 0 | 1;
  fired_adjustments: ClaimsFiredAdjustment[];
  suppressed_candidates: ClaimsSuppressedCandidate[];
  commentary_payload: ClaimsCommentaryPayload;
  diagnostics: ClaimsDiagnostic[];
}
