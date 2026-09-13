export { assessClaimsPacketAndOrganic } from './assessClaims';
export type { AssessClaimsInput } from './assessClaims';
export { buildClaimsNutrientContext } from './nutrientContextAdapter';
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
} from './commentary';
export * from './types';
export {
  normalizePacketStatement,
  naturalLanguageList,
  naturalLanguageNutrientList,
} from './normalize';
