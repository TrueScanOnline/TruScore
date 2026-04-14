/**
 * Phase 2 — claim governance types.
 * Full inventory: `docs/phase2/claim-registry.csv` (regenerate: `node scripts/generate-phase2-claim-registry.mjs`).
 */

export type ClaimStatus = 'draft' | 'approved' | 'revise' | 'retired';

/** Align with Phase 2 taxonomy (exact strings). */
export type ClaimClass =
  | 'A_direct_product_fact'
  | 'B_third_party_methodology_output'
  | 'C_app_native_interpretation'
  | 'D_user_preference_overlay';

export interface ClaimDefinition {
  claimId: string;
  claimClass: ClaimClass;
  enI18nPath: string;
  mustNotSay: string[];
  approvedAnchors?: string[];
  surfaceLocation: string;
  dependentCodePath: string;
  owner: 'Product' | 'Engineering' | 'Legal/Compliance' | 'Data/Methodology';
  status: ClaimStatus;
  lastReviewedDate: string;
}
