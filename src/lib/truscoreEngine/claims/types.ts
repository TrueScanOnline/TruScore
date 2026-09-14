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

/**
 * Provenance / admission method for a packet-claim observation.
 * `off_labels` = governed OFF labels / labels_en (never record as user_confirmation).
 */
export type ClaimsAdmissionMethod =
  | 'packet_image'
  | 'ocr_crop'
  | 'user_confirmation'
  | 'governed_product_name'
  | 'off_labels';

export interface AdmittedPacketObservation {
  evidence_id: string;
  /** Immutable observed wording (never HTML-escaped). */
  observed_text: string;
  /** Display-safe wording for commentary tokens (escaped). */
  display_text: string;
  admission_method: ClaimsAdmissionMethod;
  source_locator?: string;
  /** When true, observation is product-name scope for O-ORG-002 (not A/B catalogue). */
  is_product_name?: boolean;
}

export interface MatchedClaimObservation {
  evidence_id: string;
  observed_text: string;
  display_text: string;
  register_row_id: string;
  canonical_family: string;
  set: ClaimsCatalogueSet;
  admission_method: ClaimsAdmissionMethod;
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

/** Founder methodology identity (Nutrient-Level Reference Standard). */
export const CLAIMS_NUTRIENT_METHODOLOGY_VERSION = '20260912_v0_1';
/** Governed threshold/reference asset identity (UK FoP MTL Rveel-reviewed). */
export const CLAIMS_NUTRIENT_REFERENCE_ASSET_ID = 'uk-gov-fop-mtl-rveel-reviewed-2026-09-12';

export interface ClaimsNutrientContext {
  /**
   * @deprecated Prefer nutrient_reference_asset_id — retained for schema compatibility.
   * Always the governed threshold asset id (never empty).
   */
  standard_version: string;
  /** Founder methodology version — always populated. */
  nutrient_methodology_version: string;
  /** Governed threshold/reference asset — always populated; never overridden by legacy standardId. */
  nutrient_reference_asset_id: string;
  /**
   * Diagnostic only: upstream Nutrition assessment.standardId when it differs from the
   * controlling Claims reference asset (e.g. legacy uk-gov-fop-mtl-v1).
   */
  upstream_standard_id?: string;
  /** Accepted upstream contract is binary food | drink. */
  basis: 'food' | 'drink';
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
  /** L3 body (organic claim-only founder copy). */
  l3_body?: string;
  /** Contribution CTA label (routes to Certifications User Contribution). */
  cta_label?: string;
  cta_domain?: 'certifications';
  claim_display_texts?: string[];
  high_nutrient_labels?: string[];
  nova4_sentence_appended?: boolean;
  suppressed_reason?: string;
  /** Canonical fired-event id this payload binds to (R-016 multi-event). */
  bound_event_id?: string;
}

export interface ClaimsDiagnostic {
  code: string;
  detail: string;
}

export interface ClaimsAssessmentResult {
  schema_version: string;
  register_version: string;
  /** @deprecated Prefer nutrient_reference_asset_id — always the threshold asset id. */
  nutrient_standard_version: string;
  nutrient_methodology_version: string;
  nutrient_reference_asset_id: string;
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
  /**
   * Primary / consumer-facing commentary (legacy single-route consumers).
   * Prefer commentary_by_event_id when multiple events fire (R-016).
   */
  commentary_payload: ClaimsCommentaryPayload;
  /** Per fired-event commentary keyed by canonical/runtime adjustment id. */
  commentary_by_event_id: Record<string, ClaimsCommentaryPayload>;
  diagnostics: ClaimsDiagnostic[];
}
