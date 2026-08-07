import type { ConfidenceState, MarketKeyResolution, ReviewState } from '../contracts/phase6/enums';

export type SharedIdentityResolutionStatus = 'resolved' | 'ambiguous' | 'needs_review';
export const SHARED_IDENTITY_AMBIGUITY_FLAGS = [
  'missing_brand_candidate',
  'multiple_brand_candidates',
] as const;
export type SharedIdentityAmbiguityFlag = (typeof SHARED_IDENTITY_AMBIGUITY_FLAGS)[number];

export interface SharedIdentityContext {
  resolution_key: {
    gtin: string;
    market_key: MarketKeyResolution;
  };
  canonical: {
    product_id: string;
    brand_id: string;
    current_owner_entity_id?: string;
    /**
     * Reviewed product_family IDs from Chaining membership (additive DSA v0.2).
     * Empty when no reviewed membership exists for the GTIN.
     */
    product_family_ids?: string[];
  };
  operational_entities: {
    manufacturer_id?: string;
    importer_id?: string;
    distributor_id?: string;
    licensee_id?: string;
  };
  quality: {
    confidence_state: ConfidenceState;
    review_state: ReviewState;
    resolution_status: SharedIdentityResolutionStatus;
    ambiguity_flags: SharedIdentityAmbiguityFlag[];
  };
  lineage: {
    source_refs: string[];
    alias_hits: string[];
    normalizer_version: string;
  };
}

export interface SharedIdentityResolutionResult {
  context: SharedIdentityContext;
  public_market: 'AU' | 'NZ' | 'UNKNOWN';
}

