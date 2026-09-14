/**
 * Claims Rescue v0.2 corrective pass — regression / falsification suite (CR-01…CR-15).
 */

import {
  assessClaimsPacketAndOrganic,
  buildClaimsNutrientContext,
  buildClaimsObservationsFromProduct,
  claimsNutrientVersionIdentities,
  escapeDisplayText,
  matchAdmittedObservations,
  naturalLanguageList,
  ORGANIC_CLAIM_ONLY_CTA_LABEL_V02,
  ORGANIC_CLAIM_ONLY_L2_V02,
  ORGANIC_CLAIM_ONLY_L3_BODY_V02,
  toDisplaySafeClaimText,
  CLAIMS_NUTRIENT_METHODOLOGY_VERSION,
  CLAIMS_NUTRIENT_REFERENCE_ASSET_ID,
} from '../../../../lib/truscoreEngine/claims';
import type { ClaimsNutrientContext } from '../../../../lib/truscoreEngine/claims/types';
import type { Product } from '../../../../types/product';
import { resolveGovernedL3Content } from '../../../../lib/scoreHighlights/l3/content';

function nutrientCompleteNoneHigh(): ClaimsNutrientContext {
  return {
    standard_version: CLAIMS_NUTRIENT_REFERENCE_ASSET_ID,
    nutrient_methodology_version: CLAIMS_NUTRIENT_METHODOLOGY_VERSION,
    nutrient_reference_asset_id: CLAIMS_NUTRIENT_REFERENCE_ASSET_ID,
    basis: 'food',
    large_portion_override: false,
    nutrients: {
      total_sugars: { level: 'low', per_100_value: 1, source_evidence_id: 'gov:n' },
      saturated_fat: { level: 'low', per_100_value: 1, source_evidence_id: 'gov:n' },
      sodium: { level: 'low', per_100_value: 50, source_evidence_id: 'gov:n' },
    },
    required_context_complete: true,
    any_governed_high: false,
    high_nutrient_labels: [],
  };
}

function baseProduct(over: Partial<Product> = {}): Product {
  return {
    barcode: '9415007000000',
    name: 'Test Product',
    brands: 'Test',
    ...over,
  } as Product;
}

describe('Claims corrective pass regressions', () => {
  test('CR-01: OFF product name does not leak into unintended A/B recognition', () => {
    const bundle = buildClaimsObservationsFromProduct(
      baseProduct({
        product_name: "Harry's High Protein Organic Milk",
        name: "Harry's High Protein Organic Milk",
        labels: '',
        labels_en: '',
      })
    );
    const nameObs = bundle.observations.filter((o) => o.is_product_name);
    expect(nameObs.length).toBeGreaterThan(0);
    const match = matchAdmittedObservations(nameObs);
    expect(match.matched.every((m) => m.set === 'O')).toBe(true);
    expect(match.matched.some((m) => m.set === 'A' || m.set === 'B')).toBe(false);
  });

  test('CR-01/05: OFF labels can establish governed A/B claims and never as user_confirmation', () => {
    const bundle = buildClaimsObservationsFromProduct(
      baseProduct({
        name: 'Plain Yoghurt',
        product_name: 'Plain Yoghurt',
        labels: 'High protein, No added sugar',
        labels_en: '',
      })
    );
    expect(bundle.observations.every((o) => o.admission_method !== 'user_confirmation')).toBe(true);
    expect(bundle.observations.some((o) => o.admission_method === 'off_labels')).toBe(true);
    const match = matchAdmittedObservations(bundle.observations);
    expect(match.matched.some((m) => m.register_row_id === 'B-SUG-002')).toBe(true);
    expect(match.matched.some((m) => m.register_row_id === 'A-PRO-003')).toBe(true);
    expect(match.matched.every((m) => m.admission_method !== 'user_confirmation')).toBe(true);
  });

  test('CR-03: no added sugar / sugars / without added sugar survive X-001', () => {
    for (const text of ['no added sugar', 'no added sugars', 'without added sugar']) {
      const match = matchAdmittedObservations([
        {
          evidence_id: `e-${text}`,
          observed_text: text,
          display_text: text,
          admission_method: 'off_labels',
        },
      ]);
      expect(match.matched.some((m) => m.register_row_id === 'B-SUG-002')).toBe(true);
    }
  });

  test('CR-03: no added salt / no salt added both match B-SOD-002', () => {
    for (const text of ['no added salt', 'no salt added']) {
      const match = matchAdmittedObservations([
        {
          evidence_id: `e-${text}`,
          observed_text: text,
          display_text: text,
          admission_method: 'packet_image',
        },
      ]);
      expect(match.matched.some((m) => m.register_row_id === 'B-SOD-002')).toBe(true);
    }
  });

  test('CR-03: unrelated Organic survives when another phrase meets an exclusion', () => {
    // X-001 may veto sugar candidates; Set O exact/organic token should still be able to fire
    // when organic appears as a label chunk — use separate admissions as production does
    const split = matchAdmittedObservations([
      {
        evidence_id: 'org',
        observed_text: 'organic',
        display_text: 'organic',
        admission_method: 'off_labels',
      },
      {
        evidence_id: 'sug',
        observed_text: 'added sugar',
        display_text: 'added sugar',
        admission_method: 'off_labels',
      },
    ]);
    expect(split.matched.some((m) => m.set === 'O')).toBe(true);
    expect(split.matched.some((m) => m.register_row_id === 'B-SUG-002')).toBe(false);
  });

  test('CR-02: Organic product-name claim-only +1 (founder-accepted edge)', () => {
    const bundle = buildClaimsObservationsFromProduct(
      baseProduct({
        product_name: "Harry's Organic Milk",
        name: "Harry's Organic Milk",
        labels: '',
        labels_en: '',
      })
    );
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: bundle.observations,
      packetCoverageState: 'incomplete',
      nutrientContext: nutrientCompleteNoneHigh(),
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: [
        { source: 'ktc', status: 'no_finding' },
        { source: 'bbfaw', status: 'no_finding' },
      ],
    });
    expect(r.organic_claim_only_points).toBe(1);
    expect(r.assessment_state).toBe('assessed_scored');
    expect(r.commentary_by_event_id['claims.organic.claim_only.v1']?.l2).toBe(ORGANIC_CLAIM_ONLY_L2_V02);
  });

  test('CR-14: Certified Organic suppresses claim-only with S28 reason', () => {
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [
        {
          evidence_id: 'o',
          observed_text: 'organic',
          display_text: 'organic',
          admission_method: 'off_labels',
        },
      ],
      packetCoverageState: 'incomplete',
      nutrientContext: nutrientCompleteNoneHigh(),
      certifiedOrganicFired: true,
      otherCertificationFired: false,
      benchmarkChecks: [
        { source: 'ktc', status: 'no_finding' },
        { source: 'bbfaw', status: 'no_finding' },
      ],
    });
    expect(r.organic_claim_only_points).toBe(0);
    expect(r.suppressed_candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          candidate_id: 'claims.organic.claim_only.v1',
          reason_code: 'suppressed_by_certified_organic',
        }),
      ])
    );
  });

  test('CR-07: scored + incomplete coverage coexistence; contribution still possible', () => {
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [
        {
          evidence_id: 'o',
          observed_text: 'organic',
          display_text: 'organic',
          admission_method: 'off_labels',
        },
      ],
      packetCoverageState: 'incomplete',
      nutrientContext: nutrientCompleteNoneHigh(),
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: [
        { source: 'ktc', status: 'no_finding' },
        { source: 'bbfaw', status: 'no_finding' },
      ],
    });
    expect(r.assessment_state).toBe('assessed_scored');
    expect(r.packet_coverage_state).toBe('incomplete');
    const organic = r.commentary_by_event_id['claims.organic.claim_only.v1'];
    expect(organic?.cta_domain).toBe('certifications');
    expect(organic?.cta_label).toBe(ORGANIC_CLAIM_ONLY_CTA_LABEL_V02);
  });

  test('CR-09: dual Packet Context + Organic event commentary bindings', () => {
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [
        {
          evidence_id: 'a',
          observed_text: 'high protein',
          display_text: 'high protein',
          admission_method: 'off_labels',
        },
        {
          evidence_id: 'o',
          observed_text: 'organic',
          display_text: 'organic',
          admission_method: 'off_labels',
        },
      ],
      packetCoverageState: 'incomplete',
      nutrientContext: nutrientCompleteNoneHigh(),
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: [
        { source: 'ktc', status: 'no_finding' },
        { source: 'bbfaw', status: 'no_finding' },
      ],
    });
    expect(r.packet_context_points).toBe(1);
    expect(r.organic_claim_only_points).toBe(1);
    expect(r.commentary_by_event_id['claims.packet_context.positive.v1']?.route).toBe(
      'packet_context_positive'
    );
    expect(r.commentary_by_event_id['claims.organic.claim_only.v1']?.route).toBe('organic_claim_only');
  });

  test('CR-08: both nutrient version identities always present', () => {
    const ids = claimsNutrientVersionIdentities();
    expect(ids.nutrient_methodology_version).toBe('20260912_v0_1');
    expect(ids.nutrient_reference_asset_id).toBe('uk-gov-fop-mtl-rveel-reviewed-2026-09-12');
    const ctx = buildClaimsNutrientContext(null);
    expect(ctx).toBeNull();
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [],
      packetCoverageState: 'incomplete',
      nutrientContext: null,
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: [
        { source: 'ktc', status: 'no_finding' },
        { source: 'bbfaw', status: 'no_finding' },
      ],
    });
    expect(r.nutrient_methodology_version).toBe('20260912_v0_1');
    expect(r.nutrient_reference_asset_id.length).toBeGreaterThan(0);
    expect(r.nutrient_standard_version.length).toBeGreaterThan(0);
  });

  test('CR-10: display escaping; observed_text immutable', () => {
    const raw = '<script>alert("x")</script> & more';
    expect(escapeDisplayText(raw)).toContain('&lt;script&gt;');
    expect(escapeDisplayText(raw)).toContain('&amp;');
    const match = matchAdmittedObservations([
      {
        evidence_id: 'inj',
        observed_text: raw,
        display_text: raw,
        admission_method: 'user_confirmation',
      },
    ]);
    // May be unclassified; if matched, display is escaped and observed preserved
    if (match.matched[0]) {
      expect(match.matched[0].observed_text).toBe(raw);
      expect(match.matched[0].display_text).not.toContain('<script>');
    }
    expect(toDisplaySafeClaimText(raw)).toContain('&lt;');
  });

  test('CR-12: R-013 combination supersedes component hits; equal priority fails closed', () => {
    const match = matchAdmittedObservations([
      {
        evidence_id: 'vmc',
        observed_text: 'source of vitamin c and calcium',
        display_text: 'source of vitamin c and calcium',
        admission_method: 'off_labels',
      },
    ]);
    expect(match.matched).toHaveLength(1);
    expect(match.matched[0].register_row_id).toBe('A-VMC-003');
    expect(match.matched[0].member_targets?.length).toBeGreaterThanOrEqual(2);
  });

  test('CR-13: singular/plural bounded lists', () => {
    expect(naturalLanguageList(['a', 'b', 'c', 'd'])).toContain('1 other packet statement');
    expect(naturalLanguageList(['a', 'b', 'c', 'd', 'e'])).toContain('2 other packet statements');
    expect(naturalLanguageList(['a', 'b', 'c', 'd'])).not.toContain('1 other packet statements');
  });

  test('CR-06: Organic L3 founder copy + certifications CTA', () => {
    const l3 = resolveGovernedL3Content(
      'ethics_organic',
      'claims.organic.claim_only.v1',
      {
        organicEvidenceClass: 'claim_only',
        claimsL3Body: ORGANIC_CLAIM_ONLY_L3_BODY_V02,
        claimsCtaLabel: ORGANIC_CLAIM_ONLY_CTA_LABEL_V02,
      },
      {}
    );
    expect(l3?.sections[0]?.body).toBe(ORGANIC_CLAIM_ONLY_L3_BODY_V02);
    expect(l3?.action?.anchorLabel).toBe('Update certification');
    expect(l3?.action?.contributionDomain).toBe('certifications');
  });

  test('CR-06: ordinary-user Claims nomenclature — View nutrition details', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const en = require('../../../../i18n/locales/en.json');
    expect(en.nutrition.openDetailsA11y).toBe('View nutrition details');
    expect(en.nutrition.openDetailsA11y.toLowerCase()).not.toMatch(/\bopen\b/);
  });
});
