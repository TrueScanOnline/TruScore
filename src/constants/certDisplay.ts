/**
 * Certification UI: synthetic display-only tag and badge icons (no Expo / RN imports).
 * Synthetic tags must not appear in ETHICS_ORGANIC_TAG_ALLOWLIST — scoring uses OFF fields only.
 */
export const ORGANIC_PRODUCT_NAME_CLAIM_TAG = 'ts:organic-product-name-claim';
/** Display-only when organic matched from labels / labels_en (same rules as ethics MVP), no OFF tag. */
export const ORGANIC_LABEL_TEXT_CLAIM_TAG = 'ts:organic-label-text-claim';

export const CERT_BADGE_ICONS: Record<string, string> = {
  'en:organic': 'leaf-outline',
  'en:aco-certified-organic': 'leaf-outline',
  'en:australian-certified-organic': 'leaf-outline',
  'en:eu-organic': 'leaf-outline',
  'en:european-organic': 'leaf-outline',
  'en:usda-organic': 'leaf-outline',
  'en:soil-association-organic': 'leaf-outline',
  'en:organic-food-chain': 'leaf-outline',
  'en:demeter': 'leaf-outline',
  'en:biodynamic': 'leaf-outline',
  'en:biodynamic-agriculture': 'leaf-outline',
  'en:naturland': 'leaf-outline',
  'en:ccof-certified-organic': 'leaf-outline',
  'en:canada-organic': 'leaf-outline',
  'en:bioland': 'leaf-outline',
  'en:biokreis': 'leaf-outline',
  'en:danish-state-controlled-organic': 'leaf-outline',
  'en:luomu-controlled-organic-production': 'leaf-outline',
  'en:finnish-organic-association': 'leaf-outline',
  'en:tun-certified-organic': 'leaf-outline',
  'en:debio-organic': 'leaf-outline',
  'en:southern-cross-certified': 'leaf-outline',
  'en:southern-cross-organic': 'leaf-outline',
  'en:acos-organic': 'leaf-outline',
  [ORGANIC_PRODUCT_NAME_CLAIM_TAG]: 'leaf-outline',
  [ORGANIC_LABEL_TEXT_CLAIM_TAG]: 'leaf-outline',
  'en:fair-trade': 'hand-right-outline',
  'en:rainforest-alliance': 'water-outline',
  'en:utz': 'checkmark-circle-outline',
  'en:free-range': 'paw-outline',
  'en:cage-free': 'egg-outline',
  'en:marine-stewardship-council': 'fish-outline',
};
