/**
 * Stage 2 MVP — MILO / SIG_REG_AU_001 recall pack (v0.4.1).
 * Workstream C v0.4 CSV baseline is NOT modified.
 *
 * GTIN verification legend:
 * - verified_for_consumer: approved for production consumer alerts
 * - controlled_test_awaiting_external_verification: usable under Skeleton UAT / unit tests only
 * - controlled_test_synthetic: lab/test identifier only — never production consumer activation
 *
 * Manufacturer batch breakdown (each pack confirms only its own listed batches):
 * - Dipped 270g: 5316TD15, 5318TD15, 5321TD15, 5322TD15
 * - Dipped 160g: 5316TD15, 5318TD15
 * - Dipped 960g: 5317TD15
 * - Original 210g: 5323TD15, 5324TD15
 * All require August 2026 / end-August 2026 best-before marking.
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

/** Official best-before product marking: August 2026 / end August 2026 */
export const MILO_BB_MONTH = 8;
export const MILO_BB_YEAR = 2026;
export const MILO_OFFICIAL_DATE_TEXT = 'BEST BEFORE END AUG 2026';

export type MiloPackKey = 'dipped_270g' | 'dipped_160g' | 'dipped_960g' | 'original_210g';

/** Official per-variant batch lists — never use a combined union for confirmation. */
export const MILO_VARIANT_BATCH_CODES: Record<MiloPackKey, readonly string[]> = {
  dipped_270g: ['5316TD15', '5318TD15', '5321TD15', '5322TD15'],
  dipped_160g: ['5316TD15', '5318TD15'],
  dipped_960g: ['5317TD15'],
  original_210g: ['5323TD15', '5324TD15'],
};

export type MiloAffectedVariant = {
  recall_variant_id: string;
  gtin: string;
  pack_key: MiloPackKey;
  official_product_name: string;
  pack_size: string;
  listed_batch_codes: readonly string[];
  gtin_verification_status: GtinVerificationStatus;
  notes: string;
};

/**
 * Controlled UAT affected GTINs — one GTIN ↔ one pack ↔ that pack's batch list only.
 * None are verified_for_consumer. Do not activate as production consumer data.
 */
export const MILO_AFFECTED_VARIANTS: MiloAffectedVariant[] = [
  {
    recall_variant_id: 'RV_MILO_DIPPED_270G_UAT',
    gtin: '9300605190270',
    pack_key: 'dipped_270g',
    official_product_name: 'MILO Dipped Snack Bars 270g (controlled UAT mapping)',
    pack_size: '270g',
    listed_batch_codes: MILO_VARIANT_BATCH_CODES.dipped_270g,
    gtin_verification_status: 'controlled_test_synthetic',
    notes: 'Controlled synthetic GTIN for Dipped 270g Stage 2 tests only.',
  },
  {
    recall_variant_id: 'RV_MILO_DIPPED_160G_UAT',
    gtin: '9300605190160',
    pack_key: 'dipped_160g',
    official_product_name: 'MILO Dipped Snack Bars 160g (controlled UAT mapping)',
    pack_size: '160g',
    listed_batch_codes: MILO_VARIANT_BATCH_CODES.dipped_160g,
    gtin_verification_status: 'controlled_test_synthetic',
    notes: 'Controlled synthetic GTIN for Dipped 160g Stage 2 tests only.',
  },
  {
    recall_variant_id: 'RV_MILO_DIPPED_960G_UAT',
    gtin: '9300605190960',
    pack_key: 'dipped_960g',
    official_product_name: 'MILO Dipped Snack Bars 960g (controlled UAT mapping)',
    pack_size: '960g',
    listed_batch_codes: MILO_VARIANT_BATCH_CODES.dipped_960g,
    gtin_verification_status: 'controlled_test_synthetic',
    notes: 'Controlled synthetic GTIN for Dipped 960g Stage 2 tests only.',
  },
  {
    recall_variant_id: 'RV_MILO_ORIGINAL_210G_UAT',
    gtin: '9300605190210',
    pack_key: 'original_210g',
    official_product_name: 'MILO Original Snack Bars 210g (controlled UAT mapping)',
    pack_size: '210g',
    listed_batch_codes: MILO_VARIANT_BATCH_CODES.original_210g,
    gtin_verification_status: 'controlled_test_synthetic',
    notes: 'Controlled synthetic GTIN for Original 210g Stage 2 tests only.',
  },
];

/**
 * Real retail candidate barcode observed in earlier UAT — pack size NOT confirmed.
 * Not on the affected confirmable list; must not confirm any pack's batches.
 */
export const MILO_UNVERIFIED_REAL_CANDIDATE_GTIN = '9300605100114';
export const MILO_UNVERIFIED_REAL_CANDIDATE_STATUS: GtinVerificationStatus =
  'controlled_test_awaiting_external_verification';

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

/** All four legacy Safety signal IDs — always suppressed from subject-link scan publication. */
export const STAGE2_SUPPRESSED_LEGACY_SAFETY_SIGNAL_IDS = [
  'SIG_REG_AU_001', // MILO — exact matcher only when corrected path on; unavailable when off
  'SIG_REG_AU_002', // Alfamino — unavailable until exact IDs
  'SIG_REG_NZ_001', // Pams — unavailable until exact IDs
  'SIG_REG_NZ_002', // Pak'n Save Moorhouse — held_non_gtin
] as const;

export const STAGE2_HELD_NON_GTIN_SIGNAL_IDS = ['SIG_REG_NZ_002'] as const;

export function findMiloAffectedVariant(
  gtin: string,
  variants: readonly MiloAffectedVariant[] = MILO_AFFECTED_VARIANTS
): MiloAffectedVariant | undefined {
  return variants.find((v) => v.gtin === gtin);
}

export function isBatchListedForVariant(
  batchNormalized: string,
  variant: MiloAffectedVariant
): boolean {
  const listed = new Set(variant.listed_batch_codes.map((b) => b.toUpperCase()));
  return listed.has(batchNormalized.toUpperCase());
}
