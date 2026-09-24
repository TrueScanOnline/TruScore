/**
 * Wave 3 Cross-Pillar Rateability / Confidence / NR — semantic contract
 * (Controlling Specification 20260924 v0.1 §13).
 *
 * Score arithmetic remains in pillar scorers. This module only publishes.
 */

export type PublicationStatus = 'checking' | 'nr' | 'rated';

export type ConfidenceLevel = 'limited' | 'moderate' | 'high';

export type SourceQualityClass = 'authoritative' | 'community_or_user' | 'other_or_unknown';

export type BodyLaneState = 'resolved' | 'unassessed';
export type PlanetLaneState = 'resolved' | 'unassessed';
export type ClaimsLaneState = 'assessed' | 'unassessed_or_incomplete';
export type TransparencyIngredientLaneState = 'resolved' | 'unassessed';
export type TransparencyOriginsLaneState =
  | 'resolved'
  | 'unassessed'
  | 'assessed_unresolved_conflict';

export type ContributionRouteStatus = 'live' | 'future' | 'none';

export type S26CopyStatus = 'provisional_awaiting_founder_approval';

export type BodyS26Code =
  | 'BODY_NR'
  | 'BODY_LIMITED_NUTRITION_ONLY'
  | 'BODY_LIMITED_PROCESSING_ONLY'
  | 'BODY_MODERATE'
  | 'BODY_HIGH';

export type PlanetS26Code =
  | 'PLANET_NR'
  | 'PLANET_LIMITED_PACKAGING'
  | 'PLANET_MODERATE'
  | 'PLANET_HIGH';

export type ClaimsS26Code =
  | 'CLAIMS_NR'
  | 'CLAIMS_LIMITED_PACKET_ONLY'
  | 'CLAIMS_LIMITED_BENCHMARK_ONLY'
  | 'CLAIMS_MODERATE'
  | 'CLAIMS_HIGH';

export type TransparencyS26Code =
  | 'TRANSPARENCY_NR'
  | 'TRANSPARENCY_LIMITED_INGREDIENT_ONLY'
  | 'TRANSPARENCY_LIMITED_ORIGINS_ONLY'
  | 'TRANSPARENCY_LIMITED_ORIGINS_CONFLICT'
  | 'TRANSPARENCY_MODERATE'
  | 'TRANSPARENCY_HIGH';

export type OverallS26Code =
  | 'OVERALL_NR'
  | 'OVERALL_LIMITED'
  | 'OVERALL_MODERATE'
  | 'OVERALL_HIGH';

export type S26Code =
  | BodyS26Code
  | PlanetS26Code
  | ClaimsS26Code
  | TransparencyS26Code
  | OverallS26Code;

export interface ContributionOpportunity {
  material: boolean;
  domain: string | null;
  routeStatus: ContributionRouteStatus;
  /** Only when routeStatus=live and a governed destination exists. */
  routeKey?: string;
  /**
   * Optional prefill for live Origins contribution (validate/correct existing evidence).
   * Does not create scoring rules.
   */
  prefill?: {
    structuredOriginCountry?: string;
    conflictingFreeTextOrigins?: string;
    originsTags?: string[];
  };
}

export interface S26Explanation {
  code: S26Code;
  copyStatus: S26CopyStatus;
  /** Always prefixed with “(Awaiting founder approval)” for this release. */
  explanation: string;
  contributionOpportunity?: ContributionOpportunity;
}

export interface PillarPublicationResult {
  publicationStatus: PublicationStatus;
  /** Scorer numeric truth — never shown while checking/nr. */
  internalScore: number | null;
  /** Consumer score — number only when rated. */
  publishedScore: number | null;
  confidence: ConfidenceLevel | null;
  sourceQuality: SourceQualityClass;
  s26: S26Explanation | null;
  confidenceReasonCode: string;
  diagnostic: Record<string, unknown>;
}

export interface BodyPublicationResult extends PillarPublicationResult {
  assessmentLanes: {
    nutrition: BodyLaneState;
    processing: BodyLaneState;
  };
}

export interface PlanetPublicationResult extends PillarPublicationResult {
  assessmentLanes: {
    broad_environment: PlanetLaneState;
    packaging_fallback: PlanetLaneState;
  };
}

export interface ClaimsPublicationResult extends PillarPublicationResult {
  assessmentLanes: {
    packet: ClaimsLaneState;
    benchmark: ClaimsLaneState;
  };
}

export interface TransparencyPublicationResult extends PillarPublicationResult {
  assessmentLanes: {
    ingredient_clarity: TransparencyIngredientLaneState;
    origins: TransparencyOriginsLaneState;
  };
}

export interface OverallPublicationResult extends PillarPublicationResult {
  assessmentLanes: {
    body: PublicationStatus;
    planet: PublicationStatus;
    claims: PublicationStatus;
    transparency: PublicationStatus;
  };
}

export interface CrossPillarPublicationSnapshot {
  settled: boolean;
  body: BodyPublicationResult;
  planet: PlanetPublicationResult;
  claims: ClaimsPublicationResult;
  transparency: TransparencyPublicationResult;
  overall: OverallPublicationResult;
}

/**
 * Optional explicit authoritative mappings for High uplift (tests / future register).
 * Must never be inferred from URL/source name at runtime.
 */
export interface AuthoritativeLaneOverrides {
  bodyNutrition?: boolean;
  bodyProcessing?: boolean;
  planetBroadEnvironment?: boolean;
  claimsPacket?: boolean;
  claimsBenchmark?: boolean;
  transparencyIngredient?: boolean;
  transparencyOrigins?: boolean;
}
