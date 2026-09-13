/**
 * Section 16 — Claims Rescue negative assurance probes (controlling specification v0.2).
 */

import { assessClaimsPacketAndOrganic } from '../../../../lib/truscoreEngine/claims/assessClaims';
import { matchAdmittedObservations } from '../../../../lib/truscoreEngine/claims/matchRegister';
import { normalizePacketStatement } from '../../../../lib/truscoreEngine/claims/normalize';
import { buildClaimsObservationsFromProduct } from '../../../../lib/truscoreEngine/claims/productObservations';
import { calculateEthicsPillar } from '../../../../lib/truscoreEngine/pillars/ethicsPillar';
import type { AdmittedPacketObservation, ClaimsNutrientContext } from '../../../../lib/truscoreEngine/claims/types';
import type { Product } from '../../../../types/product';
import { assertScoreDiagnosticsReleaseSafe, shouldShowScoreDiagnosticsEntry } from '../../../../config/scoreDiagnostics';

function obs(text: string, id = 'e1'): AdmittedPacketObservation {
  return {
    evidence_id: id,
    observed_text: text,
    display_text: text,
    admission_method: 'user_confirmation',
    source_locator: 'uat',
  };
}

function nutrient(opts: {
  sugars: 'low' | 'moderate' | 'high' | 'unavailable';
  satFat: 'low' | 'moderate' | 'high' | 'unavailable';
  sodium: 'low' | 'moderate' | 'high' | 'unavailable';
}): ClaimsNutrientContext {
  const high: ClaimsNutrientContext['high_nutrient_labels'] = [];
  if (opts.sugars === 'high') high.push('total sugars');
  if (opts.satFat === 'high') high.push('saturated fat');
  if (opts.sodium === 'high') high.push('sodium');
  return {
    standard_version: 'uk-gov-fop-mtl-v1',
    basis: 'food',
    large_portion_override: false,
    nutrients: {
      total_sugars: { level: opts.sugars, high_reason: opts.sugars === 'high' ? 'threshold' : null },
      saturated_fat: { level: opts.satFat, high_reason: opts.satFat === 'high' ? 'threshold' : null },
      sodium: { level: opts.sodium, high_reason: opts.sodium === 'high' ? 'threshold' : null },
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

describe('Claims Rescue Section 16 negative assurance', () => {
  describe('Recognition boundary', () => {
    test('typos / look-alike synonyms do not match', () => {
      expect(matchAdmittedObservations([obs('hiigh protein')]).matched).toHaveLength(0);
      expect(matchAdmittedObservations([obs('proteiin rich')]).matched).toHaveLength(0);
    });

    test('case/punctuation/pluralisation resolve only via R-004 normalisation', () => {
      expect(normalizePacketStatement('HIGH-PROTEIN')).toBe('high protein');
      const a = matchAdmittedObservations([obs('High protein')]);
      const b = matchAdmittedObservations([obs('HIGH PROTEIN')]);
      expect(a.matched.map((m) => m.register_row_id)).toEqual(b.matched.map((m) => m.register_row_id));
    });

    test('ingredient-level organic excluded', () => {
      const m = matchAdmittedObservations([obs('Made with organic ingredients')]);
      expect(m.matched.filter((x) => x.set === 'O')).toHaveLength(0);
    });
  });

  describe('Evidence honesty', () => {
    test('live product path without admissions fails closed for Set A/B', () => {
      const bundle = buildClaimsObservationsFromProduct({
        barcode: 'x',
        product_name: 'High Protein Bar',
      } as Product);
      expect(bundle.packetCoverageState).toBe('incomplete');
      expect(bundle.observations.every((o) => o.admission_method !== 'ocr_crop')).toBe(true);
      const r = assessClaimsPacketAndOrganic({
        admittedObservations: bundle.observations,
        packetCoverageState: bundle.packetCoverageState,
        nutrientContext: nutrient({ sugars: 'low', satFat: 'low', sodium: 'low' }),
        certifiedOrganicFired: false,
        otherCertificationFired: false,
        benchmarkChecks: noBenchmark,
      });
      expect(r.assessment_state).toBe('unassessed');
      expect(r.packet_context_points).toBe(0);
    });

    test('pending coverage never yields assessed_neutral', () => {
      const r = assessClaimsPacketAndOrganic({
        admittedObservations: [],
        packetCoverageState: 'pending',
        nutrientContext: nutrient({ sugars: 'low', satFat: 'low', sodium: 'low' }),
        certifiedOrganicFired: false,
        otherCertificationFired: false,
        benchmarkChecks: noBenchmark,
      });
      expect(r.assessment_state).toBe('unassessed');
      expect(r.commentary_payload.route).not.toBe('assessed_neutral');
    });
  });

  describe('Arithmetic', () => {
    test('+1 and -3 exclusivity; no stacking', () => {
      const r = assessClaimsPacketAndOrganic({
        admittedObservations: [obs('High protein', 'a'), obs('Source of fibre', 'b'), obs('30% less sugar', 'c')],
        packetCoverageState: 'complete',
        nutrientContext: nutrient({ sugars: 'high', satFat: 'low', sodium: 'low' }),
        certifiedOrganicFired: false,
        otherCertificationFired: false,
        benchmarkChecks: noBenchmark,
      });
      expect(r.packet_context_points).toBe(-3);
      expect(r.fired_adjustments.filter((f) => f.family === 'packet_context')).toHaveLength(1);
      expect(r.fired_adjustments.some((f) => f.id.includes('positive'))).toBe(false);
    });

    test('Organic claim-only suppressed by Certified Organic', () => {
      const r = assessClaimsPacketAndOrganic({
        admittedObservations: [
          {
            evidence_id: 'o',
            observed_text: 'organic',
            display_text: 'organic',
            admission_method: 'governed_product_name',
            is_product_name: true,
          },
        ],
        packetCoverageState: 'complete',
        nutrientContext: nutrient({ sugars: 'low', satFat: 'low', sodium: 'low' }),
        certifiedOrganicFired: true,
        otherCertificationFired: false,
        benchmarkChecks: noBenchmark,
      });
      expect(r.organic_claim_only_points).toBe(0);
      expect(r.suppressed_candidates.some((s) => s.reason_code === 'suppressed_by_certified_organic')).toBe(
        true
      );
    });
  });

  describe('Nutrient boundary', () => {
    test('Moderate / exact High threshold equality do not adverse-trigger', () => {
      const r = assessClaimsPacketAndOrganic({
        admittedObservations: [obs('High protein')],
        packetCoverageState: 'complete',
        nutrientContext: nutrient({ sugars: 'moderate', satFat: 'moderate', sodium: 'moderate' }),
        certifiedOrganicFired: false,
        otherCertificationFired: false,
        benchmarkChecks: noBenchmark,
      });
      expect(r.packet_context_points).toBe(1);
    });

    test('missing sodium blocks +1', () => {
      const r = assessClaimsPacketAndOrganic({
        admittedObservations: [obs('High protein')],
        packetCoverageState: 'complete',
        nutrientContext: nutrient({ sugars: 'low', satFat: 'low', sodium: 'unavailable' }),
        certifiedOrganicFired: false,
        otherCertificationFired: false,
        benchmarkChecks: noBenchmark,
      });
      expect(r.packet_context_points).toBe(0);
    });
  });

  describe('State integrity', () => {
    test('no +0 Claims fired ledger event for assessed_neutral', () => {
      const r = assessClaimsPacketAndOrganic({
        admittedObservations: [],
        packetCoverageState: 'complete',
        nutrientContext: nutrient({ sugars: 'low', satFat: 'low', sodium: 'low' }),
        certifiedOrganicFired: false,
        otherCertificationFired: false,
        benchmarkChecks: noBenchmark,
      });
      expect(r.assessment_state).toBe('assessed_neutral');
      expect(r.fired_adjustments).toHaveLength(0);
    });

    test('offsetting arithmetic retains assessed_scored', () => {
      const ethics = calculateEthicsPillar(
        {
          barcode: 'off15',
          product_name: 'High Protein Crisp',
          nutriments: { sugars_100g: 50, 'saturated-fat_100g': 0.5, sodium_100g: 0.05 },
          categories_tags: ['en:snacks'],
        } as Product,
        {
          admittedPacketObservations: [obs('High protein')],
          packetCoverageState: 'complete',
        }
      );
      expect(ethics.details.claimsAssessment?.assessment_state).toBe('assessed_scored');
      expect(ethics.details.claimsAssessment?.fired_adjustments.some((f) => f.points === -3)).toBe(true);
    });
  });

  describe('Commentary / access control', () => {
    test('no raw tokens; adverse copy retains non-allegation qualification', () => {
      const r = assessClaimsPacketAndOrganic({
        admittedObservations: [obs('High protein')],
        packetCoverageState: 'complete',
        nutrientContext: nutrient({ sugars: 'high', satFat: 'low', sodium: 'low' }),
        certifiedOrganicFired: false,
        otherCertificationFired: false,
        benchmarkChecks: noBenchmark,
      });
      expect(r.commentary_payload.l1).not.toMatch(/\[CLAIM\]|\[NUTRIENT/);
      expect(r.commentary_payload.l2).toContain('does not by itself mean the packet claim is false');
    });

    test('S28 inaccessible without build entitlement', () => {
      expect(shouldShowScoreDiagnosticsEntry(true)).toBe(false);
      const prev = process.env.EXPO_PUBLIC_STORE_RELEASE;
      const prevDiag = process.env.EXPO_PUBLIC_SCORE_DIAGNOSTICS;
      try {
        process.env.EXPO_PUBLIC_STORE_RELEASE = '1';
        process.env.EXPO_PUBLIC_SCORE_DIAGNOSTICS = '0';
        expect(() => assertScoreDiagnosticsReleaseSafe()).not.toThrow();
      } finally {
        process.env.EXPO_PUBLIC_STORE_RELEASE = prev;
        process.env.EXPO_PUBLIC_SCORE_DIAGNOSTICS = prevDiag;
      }
    });
  });
});
