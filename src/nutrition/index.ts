export { UK_GOV_FOP_MTL_REFERENCE } from './ukGovFopMtlReference';
export { parseReliableServingSize } from './parseReliableServingSize';
export {
  assessGovernedNutrients,
  assessGovernedNutrientsFromProduct,
  hasGovernedHighNutrient,
  resolveGovernedProductClass,
  sodiumMgFromNutriments,
  formatHighReason,
  governedPerServeFromPer100,
} from './governedNutrientAssessment';
export { simulateV02FoodDrinkClass } from './v02FoodDrinkDeterminant';
export type {
  V02FoodDrinkDeterminantInput,
  V02FoodDrinkDeterminantResult,
  V02ProductClass,
} from './v02FoodDrinkDeterminant';
export type {
  GovernedNutrientAssessment,
  GovernedNutrientAssessmentItem,
  GovernedNutrientKey,
  GovernedNutrientLevel,
  GovernedProductClass,
  GovernedLimitationCode,
} from './governedNutrientTypes';
