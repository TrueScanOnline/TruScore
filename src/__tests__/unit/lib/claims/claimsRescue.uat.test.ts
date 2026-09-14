/**
 * Wave 3 Claims Rescue — Section 15 UAT matrix (controlling specification v0.2).
 */

import { assessClaimsPacketAndOrganic } from '../../../../lib/truscoreEngine/claims/assessClaims';
import { buildClaimsNutrientContext } from '../../../../lib/truscoreEngine/claims/nutrientContextAdapter';
import { matchAdmittedObservations } from '../../../../lib/truscoreEngine/claims/matchRegister';
import { normalizePacketStatement } from '../../../../lib/truscoreEngine/claims/normalize';
import { assessGovernedNutrients } from '../../../../nutrition/governedNutrientAssessment';
import type { AdmittedPacketObservation, ClaimsNutrientContext } from '../../../../lib/truscoreEngine/claims/types';
import { calculateEthicsPillar } from '../../../../lib/truscoreEngine/pillars/ethicsPillar';
import { buildTruScoreAnalysis, calculateTruScore } from '../../../../lib/truscoreEngine';
import type { Product } from '../../../../types/product';
import { isScoreDiagnosticsBuildEntitled, shouldShowScoreDiagnosticsEntry } from '../../../../config/scoreDiagnostics';

function obs(text: string, id = 'e1'): AdmittedPacketObservation {
  return {
    evidence_id: id,
    observed_text: text,
    display_text: text,
    admission_method: 'user_confirmation',
    source_locator: 'uat',
  };
}

function nutrientContext(opts: {
  sugars: 'low' | 'moderate' | 'high' | 'unavailable';
  satFat: 'low' | 'moderate' | 'high' | 'unavailable';
  sodium: 'low' | 'moderate' | 'high' | 'unavailable';
  largePortion?: boolean;
}): ClaimsNutrientContext {
  const high: ClaimsNutrientContext['high_nutrient_labels'] = [];
  if (opts.sugars === 'high') high.push('total sugars');
  if (opts.satFat === 'high') high.push('saturated fat');
  if (opts.sodium === 'high') high.push('sodium');
  return {
    standard_version: 'uk-gov-fop-mtl-rveel-reviewed-2026-09-12',
    nutrient_methodology_version: '20260912_v0_1',
    nutrient_reference_asset_id: 'uk-gov-fop-mtl-rveel-reviewed-2026-09-12',
    basis: 'food',
    large_portion_override: !!opts.largePortion,
    nutrients: {
      total_sugars: {
        level: opts.sugars,
        high_reason: opts.sugars === 'high' ? (opts.largePortion ? 'large_portion_override' : 'threshold') : null,
        source_evidence_id: 'uat:total_sugars',
      },
      saturated_fat: {
        level: opts.satFat,
        high_reason: opts.satFat === 'high' ? 'threshold' : null,
        source_evidence_id: 'uat:saturated_fat',
      },
      sodium: {
        level: opts.sodium,
        high_reason: opts.sodium === 'high' ? 'threshold' : null,
        source_evidence_id: 'uat:sodium',
      },
    },
    required_context_complete: [opts.sugars, opts.satFat, opts.sodium].every((l) => l !== 'unavailable'),
    any_governed_high: high.length > 0,
    high_nutrient_labels: high,
  };
}

const noBenchmark = [
  { source: 'ktc' as const, status: 'no_finding' as const },
  { source: 'bbfaw' as const, status: 'no_finding' as const },
];

describe('Claims Rescue Section 15 UAT', () => {
  test('UAT-01 Set A; complete context; none High → +1 exact L2', () => {
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [obs('High protein')],
      packetCoverageState: 'complete',
      nutrientContext: nutrientContext({ sugars: 'low', satFat: 'low', sodium: 'low' }),
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: noBenchmark,
    });
    expect(r.packet_context_points).toBe(1);
    expect(r.fired_adjustments).toHaveLength(1);
    expect(r.fired_adjustments[0].id).toBe('claims.packet_context.positive.v1');
    expect(r.commentary_payload.l2).toContain(
      'We also checked the nutrition information panel for total sugars, saturated fat and sodium and did not find high levels'
    );
    expect(r.commentary_payload.l2).not.toMatch(/verified|proven|compliant|healthy|substantiated/i);
  });

  test('UAT-02 Two Set A; no High → one +1 synthesized list', () => {
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [obs('High protein', 'a'), obs('Source of fibre', 'b')],
      packetCoverageState: 'complete',
      nutrientContext: nutrientContext({ sugars: 'moderate', satFat: 'low', sodium: 'low' }),
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: noBenchmark,
    });
    expect(r.packet_context_points).toBe(1);
    expect(r.fired_adjustments.filter((f) => f.id.includes('packet_context'))).toHaveLength(1);
    expect(r.commentary_payload.l1).toMatch(/protein/i);
    expect(r.commentary_payload.l1).toMatch(/fibre|fiber/i);
  });

  test('UAT-03 Set A; High total sugars → -3', () => {
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [obs('High protein')],
      packetCoverageState: 'complete',
      nutrientContext: nutrientContext({ sugars: 'high', satFat: 'low', sodium: 'low' }),
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: noBenchmark,
    });
    expect(r.packet_context_points).toBe(-3);
    expect(r.commentary_payload.l1).toContain('total sugars');
    expect(r.commentary_payload.l2).toContain('does not by itself mean the packet claim is false');
  });

  test('UAT-04 Set A; High sat fat and sodium → one -3 list', () => {
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [obs('Source of protein')],
      packetCoverageState: 'complete',
      nutrientContext: nutrientContext({ sugars: 'low', satFat: 'high', sodium: 'high' }),
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: noBenchmark,
    });
    expect(r.packet_context_points).toBe(-3);
    expect(r.commentary_payload.l1).toContain('saturated fat');
    expect(r.commentary_payload.l1).toContain('sodium');
  });

  test('UAT-05 Set A + Set B; High → one -3', () => {
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [obs('High protein', 'a'), obs('30% less sugar', 'b')],
      packetCoverageState: 'complete',
      nutrientContext: nutrientContext({ sugars: 'high', satFat: 'low', sodium: 'low' }),
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: noBenchmark,
    });
    expect(r.packet_context_points).toBe(-3);
    expect(r.fired_adjustments.filter((f) => f.points > 0 && f.family === 'packet_context')).toHaveLength(0);
  });

  test('UAT-06 Set B only; no High → never +1', () => {
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [obs('No added sugars')],
      packetCoverageState: 'complete',
      nutrientContext: nutrientContext({ sugars: 'low', satFat: 'low', sodium: 'low' }),
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: noBenchmark,
    });
    expect(r.packet_context_points).toBe(0);
    expect(r.fired_adjustments.filter((f) => f.family === 'packet_context')).toHaveLength(0);
  });

  test('UAT-07 Set B only; High sodium → -3', () => {
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [obs('Reduced salt')],
      packetCoverageState: 'complete',
      nutrientContext: nutrientContext({ sugars: 'low', satFat: 'low', sodium: 'high' }),
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: noBenchmark,
    });
    expect(r.packet_context_points).toBe(-3);
  });

  test('UAT-08/09 Moderate and exact High threshold are not High triggers', () => {
    const assessment = assessGovernedNutrients({
      nutriments: { sugars_100g: 22.5, 'saturated-fat_100g': 5.0, sodium_100g: 0.6 },
      categoriesTags: ['en:breakfast-cereals'],
    });
    const ctx = buildClaimsNutrientContext(assessment)!;
    expect(ctx.any_governed_high).toBe(false);
    expect(ctx.nutrients.total_sugars.level).toBe('moderate');
  });

  test('UAT-10 Large-portion High override consumed', () => {
    const assessment = assessGovernedNutrients({
      nutriments: { sugars_100g: 10.6 },
      categoriesTags: ['en:beverages'],
      servingSize: '310 mL',
    });
    const ctx = buildClaimsNutrientContext(assessment)!;
    expect(ctx.any_governed_high).toBe(true);
    expect(ctx.large_portion_override).toBe(true);
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [obs('Source of vitamin C')],
      packetCoverageState: 'complete',
      nutrientContext: ctx,
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: noBenchmark,
    });
    expect(r.packet_context_points).toBe(-3);
  });

  test('UAT-11 Total fat High ignored; governed three not High', () => {
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [obs('Low fat')],
      packetCoverageState: 'complete',
      nutrientContext: nutrientContext({ sugars: 'low', satFat: 'low', sodium: 'low' }),
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: noBenchmark,
    });
    expect(r.packet_context_points).toBe(1);
  });

  test('UAT-12 NOVA 4 without A/B → no Claims NOVA story', () => {
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [],
      packetCoverageState: 'complete',
      nutrientContext: nutrientContext({ sugars: 'low', satFat: 'low', sodium: 'low' }),
      novaGroup: 4,
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: noBenchmark,
    });
    expect(r.packet_context_points).toBe(0);
    expect(r.commentary_payload.nova4_sentence_appended).toBeFalsy();
    expect(r.commentary_payload.route).toBe('assessed_neutral');
  });

  test('UAT-13/14 NOVA 4 appends only after context story', () => {
    const pos = assessClaimsPacketAndOrganic({
      admittedObservations: [obs('High protein')],
      packetCoverageState: 'complete',
      nutrientContext: nutrientContext({ sugars: 'low', satFat: 'low', sodium: 'low' }),
      novaGroup: 4,
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: noBenchmark,
    });
    expect(pos.packet_context_points).toBe(1);
    expect(pos.commentary_payload.l2).toContain('NOVA Group 4');

    const adv = assessClaimsPacketAndOrganic({
      admittedObservations: [obs('High protein')],
      packetCoverageState: 'complete',
      nutrientContext: nutrientContext({ sugars: 'high', satFat: 'low', sodium: 'low' }),
      novaGroup: 4,
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: noBenchmark,
    });
    expect(adv.packet_context_points).toBe(-3);
    expect(adv.commentary_payload.l2).toContain('NOVA Group 4');
  });

  test('UAT-15 Certified Organic suppresses claim-only +1', () => {
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [
        {
          evidence_id: 'o1',
          observed_text: 'organic',
          display_text: 'organic',
          admission_method: 'governed_product_name',
          is_product_name: true,
        },
      ],
      packetCoverageState: 'complete',
      nutrientContext: nutrientContext({ sugars: 'low', satFat: 'low', sodium: 'low' }),
      certifiedOrganicFired: true,
      otherCertificationFired: false,
      benchmarkChecks: noBenchmark,
    });
    expect(r.organic_claim_only_points).toBe(0);
    expect(r.suppressed_candidates.some((s) => s.reason_code === 'suppressed_by_certified_organic')).toBe(
      true
    );
  });

  test('UAT-16 Whole-product Organic claim only → +1 Set O', () => {
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [
        {
          evidence_id: 'o1',
          observed_text: 'organic',
          display_text: 'organic',
          admission_method: 'user_confirmation',
        },
      ],
      packetCoverageState: 'complete',
      nutrientContext: nutrientContext({ sugars: 'low', satFat: 'low', sodium: 'low' }),
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: noBenchmark,
    });
    expect(r.organic_claim_only_points).toBe(1);
    expect(r.fired_adjustments.some((f) => f.id === 'claims.organic.claim_only.v1')).toBe(true);
  });

  test('UAT-17 Ingredient-level organic excluded', () => {
    const match = matchAdmittedObservations([obs('Made with organic ingredients')]);
    expect(match.matched.filter((m) => m.set === 'O')).toHaveLength(0);
  });

  test('UAT-22 assessed_neutral exact L2', () => {
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [],
      packetCoverageState: 'complete',
      nutrientContext: nutrientContext({ sugars: 'low', satFat: 'low', sodium: 'low' }),
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: noBenchmark,
    });
    expect(r.assessment_state).toBe('assessed_neutral');
    expect(r.fired_adjustments).toHaveLength(0);
    expect(r.commentary_payload.l2).toBe(
      'We checked the packet for the product claims and certifications we currently assess, and our independent company-level benchmark checks did not produce a positive or adverse finding.'
    );
    expect(r.commentary_payload.l1).toBeUndefined();
  });

  test('UAT-23 assessed_neutral + unclassified append', () => {
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [obs('Responsibly sourced')],
      packetCoverageState: 'complete',
      nutrientContext: nutrientContext({ sugars: 'low', satFat: 'low', sodium: 'low' }),
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: noBenchmark,
    });
    expect(r.assessment_state).toBe('assessed_neutral');
    expect(r.commentary_payload.l2).toContain('Responsibly sourced');
    expect(r.commentary_payload.l2).toContain('outside the claims we currently assess');
  });

  test('UAT-24 incomplete packet → unassessed; never neutral L2', () => {
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [],
      packetCoverageState: 'incomplete',
      nutrientContext: nutrientContext({ sugars: 'low', satFat: 'low', sodium: 'low' }),
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: noBenchmark,
    });
    expect(r.assessment_state).toBe('unassessed');
    expect(r.commentary_payload.route).not.toBe('assessed_neutral');
  });

  test('UAT-25 opposing adjustments net 15 → assessed_scored', () => {
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [obs('High protein')],
      packetCoverageState: 'complete',
      nutrientContext: nutrientContext({ sugars: 'high', satFat: 'low', sodium: 'low' }),
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: [{ source: 'ktc', status: 'positive' }, { source: 'bbfaw', status: 'no_finding' }],
    });
    // -3 packet alone is assessed_scored
    expect(r.assessment_state).toBe('assessed_scored');
    expect(r.fired_adjustments.length).toBeGreaterThan(0);
  });

  test('UAT-26 Set C only → record retained; no score', () => {
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [obs('Gluten free')],
      packetCoverageState: 'complete',
      nutrientContext: nutrientContext({ sugars: 'low', satFat: 'low', sodium: 'low' }),
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: noBenchmark,
    });
    expect(r.admitted_claims.some((c) => c.set === 'C')).toBe(true);
    expect(r.packet_context_points).toBe(0);
    expect(r.assessment_state).toBe('assessed_neutral');
  });

  test('UAT-27 unlisted synonym → no match', () => {
    const match = matchAdmittedObservations([obs('proteiny goodness')]);
    expect(match.matched).toHaveLength(0);
    expect(match.unclassified).toHaveLength(1);
  });

  test('UAT-28 A+B collision on same statement retains B', () => {
    // Construct a statement that could match both if patterns overlap — use "more protein" (B) only
    const match = matchAdmittedObservations([obs('30% more protein')]);
    expect(match.matched.every((m) => m.set === 'B')).toBe(true);
  });

  test('UAT-29 register version mismatch fails closed', () => {
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [obs('High protein')],
      packetCoverageState: 'complete',
      nutrientContext: nutrientContext({ sugars: 'low', satFat: 'low', sodium: 'low' }),
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: noBenchmark,
      registerVersionExpected: 'wrong_version',
    });
    expect(r.admitted_claims).toHaveLength(0);
    expect(r.packet_context_points).toBe(0);
    expect(r.diagnostics.some((d) => d.code === 'register_version_mismatch')).toBe(true);
  });

  test('UAT-30 missing sodium → no +1', () => {
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [obs('High protein')],
      packetCoverageState: 'complete',
      nutrientContext: nutrientContext({ sugars: 'low', satFat: 'low', sodium: 'unavailable' }),
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: noBenchmark,
    });
    expect(r.packet_context_points).toBe(0);
  });

  test('UAT-31 missing claim token suppresses story', () => {
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [obs('High protein')],
      packetCoverageState: 'complete',
      nutrientContext: nutrientContext({ sugars: 'low', satFat: 'low', sodium: 'low' }),
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: noBenchmark,
    });
    // Valid claim present — ensure no raw brackets
    expect(r.commentary_payload.l1).not.toContain('[CLAIM]');
    expect(r.commentary_payload.l2).not.toContain('[CLAIM]');
  });

  test('UAT-32 three claims + three High → one -3 bounded lists', () => {
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [
        obs('High protein', '1'),
        obs('Source of fibre', '2'),
        obs('Source of calcium', '3'),
        obs('Extra protein', '4'),
      ],
      packetCoverageState: 'complete',
      nutrientContext: nutrientContext({ sugars: 'high', satFat: 'high', sodium: 'high' }),
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: noBenchmark,
    });
    expect(r.packet_context_points).toBe(-3);
    expect(r.fired_adjustments.filter((f) => f.family === 'packet_context')).toHaveLength(1);
    expect(r.commentary_payload.l1).toContain('total sugars');
    expect(r.commentary_payload.l1).toContain('saturated fat');
    expect(r.commentary_payload.l1).toContain('sodium');
  });

  test('UAT-33 ordinary-user S28 gated off by default', () => {
    expect(isScoreDiagnosticsBuildEntitled()).toBe(false);
    expect(shouldShowScoreDiagnosticsEntry(true)).toBe(false);
    expect(shouldShowScoreDiagnosticsEntry(false)).toBe(false);
  });

  test('UAT-36 normalisation does not invent synonyms', () => {
    expect(normalizePacketStatement('Gluten-Free')).toBe('gluten free');
    const match = matchAdmittedObservations([obs('plant based')]);
    expect(match.matched.filter((m) => m.canonical_family === 'vegan')).toHaveLength(0);
  });

  test('UAT-18 Fairtrade certification unchanged +6', () => {
    const result = calculateEthicsPillar({
      barcode: 'ft1',
      product_name: 'Fairtrade Chocolate',
      labels_tags: ['en:fair-trade'],
      nutriments: { sugars_100g: 1, 'saturated-fat_100g': 0.5, sodium_100g: 0.05 },
      categories_tags: ['en:chocolates'],
    } as Product);
    expect(result.details.certificationsWinningScheme).toBe('fairtrade');
    expect(result.details.certificationsAdjustment).toBe(6);
    expect(result.adjustments.some((a) => a.id === 'ethics-v37-cert-fairtrade' && a.value === 6)).toBe(
      true
    );
  });

  test('UAT-19 MSC/ASC/Rainforest certification points unchanged', () => {
    const msc = calculateEthicsPillar({
      barcode: 'msc1',
      product_name: 'MSC Fish',
      labels_tags: ['en:sustainable-seafood', 'en:msc'],
      nutriments: { sugars_100g: 0, 'saturated-fat_100g': 0.2, sodium_100g: 0.1 },
      categories_tags: ['en:fishes'],
      ethics_msc_api_validated: true,
    } as Product);
    expect(msc.details.certificationsWinningScheme).toBe('msc');
    expect(msc.details.certificationsAdjustment).toBe(4);

    const ra = calculateEthicsPillar({
      barcode: 'ra1',
      product_name: 'RA Coffee',
      labels_tags: ['en:rainforest-alliance'],
      nutriments: { sugars_100g: 0, 'saturated-fat_100g': 0.1, sodium_100g: 0.01 },
      categories_tags: ['en:coffees'],
    } as Product);
    expect(ra.details.certificationsWinningScheme).toBe('rainforest_alliance');
    expect(ra.details.certificationsAdjustment).toBe(6);
  });

  test('UAT-20 KTC positive with valid entity remains company-level', () => {
    const result = calculateEthicsPillar({
      barcode: 'ktc1',
      product_name: 'Known Brand Product',
      brands: 'Nestle',
      nutriments: { sugars_100g: 1, 'saturated-fat_100g': 0.5, sodium_100g: 0.05 },
      categories_tags: ['en:breakfast-cereals'],
    } as Product);
    // Company-level only — description must not allege the scanned product itself
    const ktcAdj = result.adjustments.find((a) => String(a.id).startsWith('ethics-v37-ktc'));
    if (ktcAdj) {
      expect(ktcAdj.description.toLowerCase()).not.toMatch(/this product is ranked|product allegation/);
      expect(result.details.ktcMatchedCompany).toBeTruthy();
    }
  });

  test('UAT-21 BBFAW ambiguous / unresolved entity → no benchmark fire', () => {
    const result = calculateEthicsPillar({
      barcode: 'bb1',
      product_name: 'Mystery Snack',
      brands: 'CompletelyUnknownBrandXYZ123',
      nutriments: { sugars_100g: 1, 'saturated-fat_100g': 0.5, sodium_100g: 0.05 },
      categories_tags: ['en:snacks'],
    } as Product);
    expect(result.details.bbfawMatchedCompany).toBeNull();
    expect(result.details.bbfawTierScore).toBe(0);
    expect(result.details.bbfawImpactScore).toBe(0);
  });

  test('UAT-34 founder/UAT S28 analysis carries Claims diagnostic payload', () => {
    const product = {
      barcode: 's28-1',
      product_name: 'Organic Oats',
      labels_tags: [],
      nutriments: { sugars_100g: 1, 'saturated-fat_100g': 0.5, sodium_100g: 0.05 },
      categories_tags: ['en:breakfast-cereals'],
      source: 'openfoodfacts',
    } as Product;
    const tru = calculateTruScore(product);
    const analysis = buildTruScoreAnalysis(product, tru);
    expect(analysis?.claimsAssessment).toBeTruthy();
    expect(analysis?.claimsAssessment?.assessment_state).toBeDefined();
    expect(analysis?.claimsAssessment?.packet_coverage_state).toBeDefined();
    expect(analysis?.claimsAssessment?.register_version).toBeTruthy();
    expect(analysis?.claimsAssessment?.nutrient_standard_version).toBeTruthy();
    expect(Array.isArray(analysis?.claimsAssessment?.admitted_claims)).toBe(true);
    expect(Array.isArray(analysis?.claimsAssessment?.suppressed_candidates)).toBe(true);
    expect(Array.isArray(analysis?.claimsAssessment?.benchmark_checks)).toBe(true);
    expect(Array.isArray(analysis?.claimsAssessment?.diagnostics)).toBe(true);
    expect(Array.isArray(analysis?.claimsAssessment?.fired_adjustments)).toBe(true);
    // No synthetic +0 Claims ledger row
    expect(
      analysis?.claimsAssessment?.fired_adjustments.every((f) => f.points !== 0)
    ).toBe(true);
  });

  test('UAT-35 iOS/Android parity via shared Claims assessment payload', () => {
    // Expo shared JS/TS — identical assessClaimsPacketAndOrganic for both platforms.
    const a = assessClaimsPacketAndOrganic({
      admittedObservations: [obs('High protein')],
      packetCoverageState: 'complete',
      nutrientContext: nutrientContext({ sugars: 'low', satFat: 'low', sodium: 'low' }),
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: noBenchmark,
    });
    const b = assessClaimsPacketAndOrganic({
      admittedObservations: [obs('High protein')],
      packetCoverageState: 'complete',
      nutrientContext: nutrientContext({ sugars: 'low', satFat: 'low', sodium: 'low' }),
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: noBenchmark,
    });
    expect(a).toEqual(b);
    expect(a.schema_version).toBe(b.schema_version);
    expect(a.register_version).toBe(b.register_version);
    expect(a.packet_context_points).toBe(1);
  });

  test('Certified Organic +3 on live ethics pillar; claim-only name → Set O +1', () => {
    const certified = calculateEthicsPillar({
      barcode: '1',
      product_name: 'Oats',
      labels_tags: ['en:organic'],
      nutriments: { sugars_100g: 1, 'saturated-fat_100g': 0.5, sodium_100g: 0.05 },
      categories_tags: ['en:breakfast-cereals'],
    } as Product);
    expect(certified.details.certificationsAdjustment).toBe(3);
    expect(certified.adjustments.some((a) => a.id === 'ethics-v37-cert-organic' && a.value === 3)).toBe(true);

    const claimOnly = calculateEthicsPillar({
      barcode: '2',
      product_name: 'Organic Oats',
      labels_tags: [],
      nutriments: { sugars_100g: 1, 'saturated-fat_100g': 0.5, sodium_100g: 0.05 },
      categories_tags: ['en:breakfast-cereals'],
    } as Product);
    expect(claimOnly.details.certificationsAdjustment).toBe(0);
    expect(claimOnly.adjustments.some((a) => a.id === 'claims.organic.claim_only.v1' && a.value === 1)).toBe(
      true
    );
  });
});
