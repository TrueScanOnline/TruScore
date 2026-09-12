/**
 * Rveel-governed UK Government Front-of-Pack Multiple Traffic Light reference.
 * Runtime must not fetch or silently update these values from the web or OFF.
 *
 * Controlling methodology: Rveel_Wave3_Nutrient_Level_Reference_Standard (2026-09-12).
 * External threshold authority: UK Government FoP MTL guidance (not Open Food Facts).
 */

export const UK_GOV_FOP_MTL_REFERENCE = {
  reference_standard_id: 'uk-gov-fop-mtl-rveel-reviewed-2026-09-12',
  authority: 'UK Government / Department of Health front-of-pack Multiple Traffic Light guidance',
  rveel_reviewed_at: '2026-09-12',
  jurisdiction_role: 'external consumer-composition reference for AU/NZ Rveel use',
  rveel_label_mapping: { uk_medium: 'moderate' as const },
  source_runtime_fetch: false as const,
  annual_source_check_due: '2027-09-12',
  event_driven_review: true as const,
  source: {
    title: 'Guide to creating a front of pack nutrition label for pre-packed products sold through retail outlets',
    url: 'https://www.gov.uk/government/publications/the-guide-to-creating-a-front-of-pack-nutrition-label-for-pre-packed-products-sold-through-retail-outlets',
    publisher: 'UK Government / Department of Health',
    notes:
      'Controls Low/Moderate/High and large-portion High rules. Rveel maps UK “Medium” → “Moderate”.',
  },
  thresholds: {
    food: {
      saturatedFat_g_per_100: { lowMax: 1.5, highMinExclusive: 5.0 },
      totalSugars_g_per_100: { lowMax: 5.0, highMinExclusive: 22.5 },
      sodium_mg_per_100: { lowMax: 120, highMinExclusive: 600 },
    },
    drink: {
      saturatedFat_g_per_100: { lowMax: 0.75, highMinExclusive: 2.5 },
      totalSugars_g_per_100: { lowMax: 2.5, highMinExclusive: 11.25 },
      sodium_mg_per_100: { lowMax: 120, highMinExclusive: 300 },
    },
  },
  largePortion: {
    food: {
      minServingExclusive: { quantity: 100, unit: 'g' as const },
      saturatedFat_g: 6.0,
      totalSugars_g: 27.0,
      sodium_mg: 720,
    },
    drink: {
      minServingExclusive: { quantity: 150, unit: 'ml' as const },
      saturatedFat_g: 3.0,
      totalSugars_g: 13.5,
      sodium_mg: 360,
    },
  },
  intakeContext: {
    adult_sodium_sdt_mg: 2000,
    child_adolescent_sodium_ul_mg: {
      ages_1_3: 1000,
      ages_4_8: 1400,
      ages_9_13: 2000,
      ages_14_18: 2300,
    },
    sodium_nrv_notes:
      'Current AU/NZ NRVs for sodium; values under NHMRC review. Event-driven reassessment required on final update.',
    sodium_nrv_reviewed_at: '2026-09-12',
  },
  relatedSources: {
    fsanz_nip_sodium: {
      title: 'FSANZ nutrition information panels / sodium guidance',
      role: 'AU/NZ NIP sodium presentation context only; not H/M/L authority',
      url: 'https://www.foodstandards.gov.au/consumer/labelling/panels',
    },
    au_nz_nrv_sodium: {
      title: 'NHMRC / Eat for Health Nutrient Reference Values — Sodium',
      role: 'Adult SDT and child/adolescent upper-level context',
      url: 'https://www.eatforhealth.gov.au/nutrient-reference-values/nutrients/sodium',
    },
    who_free_sugars: {
      title: 'WHO free sugars guidance',
      role: 'Explains why total sugars are not converted to a WHO daily percentage',
      url: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',
    },
    who_saturated_fat: {
      title: 'WHO saturated fatty acid guideline',
      role: 'Supports <10% energy contextual statement; not a universal daily % calculator',
      url: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',
    },
  },
} as const;

export type UkGovFopMtlReference = typeof UK_GOV_FOP_MTL_REFERENCE;
