/**
 * Stage 2 MVP — MILO / SIG_REG_AU_001 recall pack (v0.4.1).
 * Workstream C v0.4 CSV baseline is NOT modified.
 *
 * GTIN verification legend:
 * - verified_for_consumer: approved for production consumer alerts
 * - controlled_test_awaiting_external_verification: usable under Skeleton UAT / unit tests only
 * - controlled_test_synthetic: lab/test identifier only — never production consumer activation
 */

import type { FoodRecallNoticeActivation, GtinVerificationStatus } from './types';

export const MILO_RECALL_NOTICE_ID = 'RN_FSANZ_MILO_SNACK_BARS_2026_02';
export const MILO_SIGNAL_ID = 'SIG_REG_AU_001';
export const MILO_FAMILY_ID = 'RPF_MILO_SNACK_BARS';

/** Official FSANZ notice */
export const MILO_OFFICIAL_SOURCE_URL =
  'https://www.foodstandards.gov.au/food-recalls/recall-alert/nestle-australia-ltd-milo-dipped-snack-bars-270g-box-960g-box-160g-box';

export const MILO_HAZARD =
  'Food products containing black rubber may cause illness/injury if consumed.';

export const MILO_CONSUMER_ACTION =
  'Consumers should not eat this product. Return it to the place of purchase for a full refund. Seek medical advice if concerned.';

/** Listed batch codes from FSANZ notice (dipped + original) */
export const MILO_LISTED_BATCH_CODES = [
  '5316TD15',
  '5317TD15',
  '5318TD15',
  '5321TD15',
  '5322TD15',
  '5323TD15',
  '5324TD15',
] as const;

/** Official best-before product marking: August 2026 / end August 2026 */
export const MILO_BB_MONTH = 8;
export const MILO_BB_YEAR = 2026;
export const MILO_OFFICIAL_DATE_TEXT = 'BEST BEFORE END AUG 2026';

export type MiloAffectedVariant = {
  recall_variant_id: string;
  gtin: string;
  official_product_name: string;
  pack_size: string;
  gtin_verification_status: GtinVerificationStatus;
  notes: string;
};

/**
 * Affected retail GTINs.
 * 9300605100114 is a controlled UAT/test mapping pending founder confirmation of which
 * official pack size (270g / 160g / 960g) it corresponds to — NOT verified_for_consumer.
 */
export const MILO_AFFECTED_VARIANTS: MiloAffectedVariant[] = [
  {
    recall_variant_id: 'RV_MILO_DIPPED_CANDIDATE_9300605100114',
    gtin: '9300605100114',
    official_product_name: 'MILO Dipped Snack Bars (retail candidate — pack size pending confirmation)',
    pack_size: 'pending_confirmation',
    gtin_verification_status: 'controlled_test_awaiting_external_verification',
    notes:
      'OFF: MILO Dipped Snack Bars with White Choc. Founder must confirm FSANZ pack mapping before production consumer activation.',
  },
];

/**
 * Explicitly reviewed MILO Snack Bar family membership that is NOT on the affected list.
 * Synthetic controlled test GTIN for related_recall_variant_unconfirmed — not production.
 */
export const MILO_RELATED_FAMILY_GTINS: Array<{
  gtin: string;
  gtin_verification_status: GtinVerificationStatus;
  notes: string;
}> = [
  {
    gtin: '9300605199991',
    gtin_verification_status: 'controlled_test_synthetic',
    notes: 'Controlled synthetic GTIN for related snack-bar advisory unit tests only.',
  },
];

/** Powder / out-of-family control (not in snack-bar family) */
export const MILO_POWDER_CONTROL_GTIN = '9300605003811';

export const MILO_NOTICE_ACTIVATION: FoodRecallNoticeActivation = 'corrected_matcher_active';

/** Signal IDs that must never publish via legacy subject-link broad matching in Stage 2 corrected pathway */
export const STAGE2_SUPPRESSED_LEGACY_SAFETY_SIGNAL_IDS = [
  'SIG_REG_AU_002', // Alfamino — unavailable until exact IDs
  'SIG_REG_NZ_001', // Pams — unavailable until exact IDs
  'SIG_REG_NZ_002', // Pak'n Save Moorhouse — held_non_gtin
] as const;

export const STAGE2_HELD_NON_GTIN_SIGNAL_IDS = ['SIG_REG_NZ_002'] as const;
