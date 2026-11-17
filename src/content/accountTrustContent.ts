/**
 * Account Trust shared constants — consumer education helpers only.
 * Binding legal documents remain unpublished until legalDestinations are ready.
 */

/** Official food-safety recall pages (verified external destinations). */
export const OFFICIAL_FOOD_RECALL_LINKS = {
  nz: {
    labelKey: 'account.recallLinkNz',
    url: 'https://www.mpi.govt.nz/food-safety-home/food-recalls-and-complaints/recalled-food-products',
  },
  au: {
    labelKey: 'account.recallLinkAu',
    url: 'https://www.foodstandards.gov.au/food-recalls/recall-alert',
  },
} as const;

/** Privacy request categories shown to consumers (not deletion entitlement claims). */
export const PRIVACY_REQUEST_CATEGORIES = [
  'access',
  'correction',
  'deletion_review',
  'complaint_or_question',
] as const;

export type PrivacyRequestCategory = (typeof PRIVACY_REQUEST_CATEGORIES)[number];

/** Product-report concern types for assessment mailto templates. */
export const PRODUCT_REPORT_CONCERN_TYPES = [
  'barcode_or_identity',
  'name_or_brand',
  'ingredients_or_nutrition',
  'origins',
  'certification_or_benchmark',
  'manufacturer_or_parent',
  'assessment_or_score_explanation',
  'recall_or_signal',
  'share_or_preview',
  'other',
] as const;

export type ProductReportConcernType = (typeof PRODUCT_REPORT_CONCERN_TYPES)[number];

/** i18n keys for accessible concern labels shown before opening a report mailto. */
export const PRODUCT_REPORT_CONCERN_LABEL_KEYS: Record<
  ProductReportConcernType,
  string
> = {
  barcode_or_identity: 'account.reportConcernBarcode',
  name_or_brand: 'account.reportConcernNameBrand',
  ingredients_or_nutrition: 'account.reportConcernIngredients',
  origins: 'account.reportConcernOrigins',
  certification_or_benchmark: 'account.reportConcernCert',
  manufacturer_or_parent: 'account.reportConcernManufacturer',
  assessment_or_score_explanation: 'account.reportConcernAssessment',
  recall_or_signal: 'account.reportConcernRecall',
  share_or_preview: 'account.reportConcernShare',
  other: 'account.reportConcernOther',
};

export const HELP_FAQ_ITEMS = [
  { titleKey: 'account.faqScoreHow', bodyKey: 'account.faqScoreHowBody', testID: 'help-faq-scoreHow' },
  { titleKey: 'account.faqNrWhy', bodyKey: 'account.faqNrWhyBody', testID: 'help-faq-nrWhy' },
  { titleKey: 'account.faqCheckingWhat', bodyKey: 'account.faqCheckingWhatBody', testID: 'help-faq-checkingWhat' },
  { titleKey: 'account.faqConfidenceWhat', bodyKey: 'account.faqConfidenceWhatBody', testID: 'help-faq-confidenceWhat' },
  { titleKey: 'account.faqIncorrectWhy', bodyKey: 'account.faqIncorrectWhyBody', testID: 'help-faq-incorrectWhy' },
  { titleKey: 'account.faqCorrectionHow', bodyKey: 'account.faqCorrectionHowBody', testID: 'help-faq-correctionHow' },
  { titleKey: 'account.faqNotMedical', bodyKey: 'account.faqNotMedicalBody', testID: 'help-faq-notMedical' },
  { titleKey: 'account.faqSignalsVsScore', bodyKey: 'account.faqSignalsVsScoreBody', testID: 'help-faq-signalsVsScore' },
  { titleKey: 'account.faqLocalStorageWhere', bodyKey: 'account.faqLocalStorageWhereBody', testID: 'help-faq-localStorageWhere' },
  { titleKey: 'account.faqClearLocalHow', bodyKey: 'account.faqClearLocalHowBody', testID: 'help-faq-clearLocalHow' },
  { titleKey: 'account.faqAccountSubscribe', bodyKey: 'account.faqAccountSubscribeBody', testID: 'help-faq-accountSubscribe' },
  { titleKey: 'account.faqCannotScan', bodyKey: 'account.faqCannotScanBody', testID: 'help-faq-cannotScan' },
] as const;
