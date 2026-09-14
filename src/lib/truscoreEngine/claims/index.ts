export { assessClaimsPacketAndOrganic } from './assessClaims';
export type { AssessClaimsInput } from './assessClaims';
export { buildClaimsNutrientContext, claimsNutrientVersionIdentities } from './nutrientContextAdapter';
export { buildClaimsObservationsFromProduct } from './productObservations';
export { matchAdmittedObservations, getMachineRegisterVersion } from './matchRegister';
export {
  getRegisterMatchTypes,
  listDistinctVitaminMineralTargets,
} from './matchRegister';
export {
  buildPositivePacketContextCommentary,
  buildAdversePacketContextCommentary,
  buildAssessedNeutralCommentary,
  buildOrganicClaimOnlyCommentary,
  ORGANIC_CLAIM_ONLY_L1_V02,
  ORGANIC_CLAIM_ONLY_L2_V02,
  ORGANIC_CLAIM_ONLY_L3_BODY_V02,
  ORGANIC_CLAIM_ONLY_CTA_LABEL_V02,
} from './commentary';
export * from './types';
export {
  normalizePacketStatement,
  naturalLanguageList,
  naturalLanguageNutrientList,
  escapeDisplayText,
  toDisplaySafeClaimText,
} from './normalize';
