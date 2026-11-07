/**
 * WP-09 final pre-UAT: Nutrition display provenance + fixed-window rate-limit hygiene.
 */

import type { ProductNutriments } from '../../../types/product';
import type { Product } from '../../../types/product';
import type { SharedEvidenceSnapshot } from '../../../evidenceAuthority/types';
import type { ContributionEvidence } from '../../../contributions/types';
import {
  agreementSurfaceGate,
  communityAgreementScopeHint,
  localAgreementEligibility,
  nutritionEnergyDisplaySource,
  nutritionOffKeyConsumerLabel,
  nutritionRowIsCommunity,
  representedCommunityNutritionKeys,
  selectAgreementTargets,
} from '../../../communityAgreement';
import {
  agreementRateWindowStartMs,
  hashAgreementClientKey,
  COMMUNITY_AGREEMENT_RATE_WINDOW_MS,
  COMMUNITY_AGREEMENT_RATE_BUCKET_RETENTION_MS,
} from '../../../../backend/vercel/lib/communityAgreementPg';
import { getNutrientValue100g, resolveKcalPer100g } from '../../../utils/nutritionPer100g';

function evidence(
  partial: Partial<ContributionEvidence> & Pick<ContributionEvidence, 'evidenceId' | 'domain' | 'submitterId'>
): ContributionEvidence {
  return {
    barcode: '9300000000001',
    evidenceVersion: 1,
    claimKey: 'x',
    claimValue: 'x',
    confirmations: [],
    disputes: [],
    state: 'admitted',
    scoringEligible: true,
    canonicalPromoted: false,
    createdAt: 1,
    updatedAt: 1,
    ...partial,
  } as ContributionEvidence;
}

function nutritionSnap(subjects: Array<{ attribute: string; versionId: string; value: number }>): SharedEvidenceSnapshot {
  return {
    barcode: '9300000000001',
    authorityEnv: 'uat',
    epoch: 'wave4a.uat',
    recordClass: 'uat',
    generatedAt: 1,
    prevailing: subjects.map((item, index) => ({
      subjectKey: `ingredients_nutrition|nutrient:${item.attribute}|basis:per_100g`,
      versionId: item.versionId,
      versionNo: 1,
      admissionSeq: index + 1,
      governance: 'active' as const,
      evidence: evidence({
        evidenceId: `e-${item.attribute}`,
        domain: 'ingredients_nutrition',
        submitterId: 'rveel_author',
        ingredientsNutrition: {
          nutritionBasis: 'per_100g',
          nutriments: [{ attribute: item.attribute as 'sugars', value: item.value, unit: 'g' }],
          nutritionComplete: false,
        },
      }),
    })),
    offDispatch: [],
  };
}

/** Same selection order NutritionTable uses for the energy row. */
function tableEnergyKcal(nutriments: ProductNutriments | undefined): number | undefined {
  return getNutrientValue100g(nutriments, 'energy-kcal') ?? resolveKcalPer100g(nutriments);
}

describe('WP-09 Nutrition display provenance (NutritionTable selection rules)', () => {
  it('1. OFF kcal present and community kJ present → energy row is not Community-added', () => {
    const nutriments = { 'energy-kcal_100g': 400, 'energy-kj_100g': 1674 } as ProductNutriments;
    const community = ['energy-kj_100g'];
    expect(tableEnergyKcal(nutriments)).toBe(400);
    expect(nutritionRowIsCommunity('energy-kcal', nutriments, community)).toBe(false);
    expect(nutritionEnergyDisplaySource(nutriments, community)).toEqual({
      kind: 'external',
      offKey: 'energy-kcal_100g',
    });
    expect(representedCommunityNutritionKeys(nutriments, community).has('energy-kj_100g')).toBe(false);
  });

  it('2. Community kcal present and OFF kJ present → energy row is Community-added', () => {
    const nutriments = { 'energy-kcal_100g': 380, 'energy-kj_100g': 2000 } as ProductNutriments;
    const community = ['energy-kcal_100g'];
    expect(tableEnergyKcal(nutriments)).toBe(380);
    expect(nutritionRowIsCommunity('energy-kcal', nutriments, community)).toBe(true);
    expect([...representedCommunityNutritionKeys(nutriments, community)]).toEqual(['energy-kcal_100g']);
  });

  it('3. Community kJ converted to displayed kcal because no kcal is available', () => {
    const nutriments = { 'energy-kj_100g': 1674 } as ProductNutriments;
    const community = ['energy-kj_100g'];
    const displayed = tableEnergyKcal(nutriments);
    expect(displayed).toBeCloseTo(1674 / 4.184, 5);
    expect(nutritionRowIsCommunity('energy-kcal', nutriments, community)).toBe(true);
    expect(nutritionEnergyDisplaySource(nutriments, community)).toEqual({
      kind: 'community',
      offKey: 'energy-kj_100g',
    });
  });

  it('4. OFF-only kcal and kJ → never Community-added', () => {
    const nutriments = { 'energy-kcal_100g': 400, 'energy-kj_100g': 1674 } as ProductNutriments;
    expect(nutritionRowIsCommunity('energy-kcal', nutriments, [])).toBe(false);
    expect(representedCommunityNutritionKeys(nutriments, []).size).toBe(0);
  });

  it('5. Other community nutrient values displayed normally are marked', () => {
    const nutriments = { sugars_100g: 12, fat_100g: 9 } as ProductNutriments;
    const community = ['sugars_100g'];
    expect(nutritionRowIsCommunity('sugars', nutriments, community)).toBe(true);
    expect(nutritionRowIsCommunity('fat', nutriments, community)).toBe(false);
  });

  it('6. Contributed kJ present but not selected by table display → not represented; agreement hides', () => {
    const nutriments = {
      'energy-kcal_100g': 400,
      'energy-kj_100g': 1674,
      sugars_100g: 12,
    } as ProductNutriments;
    const community = ['energy-kj_100g', 'sugars_100g'];
    expect(representedCommunityNutritionKeys(nutriments, community).has('energy-kj_100g')).toBe(false);
    expect(representedCommunityNutritionKeys(nutriments, community).has('sugars_100g')).toBe(true);

    const snap = nutritionSnap([
      { attribute: 'energy-kj', versionId: 'ver_kj', value: 1674 },
      { attribute: 'sugars', versionId: 'ver_s', value: 12 },
    ]);
    const product = {
      barcode: '9300000000001',
      nutriments,
      rveelGovernedNutrimentKeys: community,
    } as Product;
    // Full target set includes non-represented energy-kj → presentation mismatch → ineligible.
    expect(localAgreementEligibility('nutrition', product, snap).eligible).toBe(false);
    expect(selectAgreementTargets('nutrition', snap)).toHaveLength(2);
  });

  it('agreement becomes eligible when every community target is actually displayed', () => {
    const nutriments = { sugars_100g: 12, fat_100g: 1 } as ProductNutriments;
    const community = ['sugars_100g'];
    const snap = nutritionSnap([{ attribute: 'sugars', versionId: 'ver_s', value: 12 }]);
    const product = {
      barcode: '9300000000001',
      nutriments,
      rveelGovernedNutrimentKeys: community,
    } as Product;
    expect(localAgreementEligibility('nutrition', product, snap).eligible).toBe(true);
  });

  it('scope hint uses consumer-facing nutrient names', () => {
    expect(nutritionOffKeyConsumerLabel('sugars_100g')).toBe('Sugars');
    expect(nutritionOffKeyConsumerLabel('energy-kj_100g')).toBe('Energy');
    const hint = communityAgreementScopeHint('nutrition', {
      barcode: '1',
      nutriments: { sugars_100g: 1 },
      rveelGovernedNutrimentKeys: ['sugars_100g'],
    } as Product);
    expect(hint).toContain('Sugars');
    expect(hint).not.toContain('sugars_100g');
  });
});

describe('WP-09 rate-limit hygiene and fixed-minute windows', () => {
  it('hashes edge client keys so raw IPs are not stored in bucket material', () => {
    const hashed = hashAgreementClientKey('203.0.113.10');
    expect(hashed).toHaveLength(32);
    expect(hashed).not.toContain('203');
    expect(hashed).not.toEqual(hashAgreementClientKey('203.0.113.11'));
    expect(hashAgreementClientKey('203.0.113.10')).toBe(hashed);
  });

  it('uses fixed-minute window starts and resets on the boundary', () => {
    const raw = 1_700_000_123_456;
    const windowStart = agreementRateWindowStartMs(raw);
    expect(windowStart % COMMUNITY_AGREEMENT_RATE_WINDOW_MS).toBe(0);
    expect(windowStart).toBeLessThanOrEqual(raw);
    expect(agreementRateWindowStartMs(windowStart + COMMUNITY_AGREEMENT_RATE_WINDOW_MS - 1)).toBe(
      windowStart
    );
    expect(agreementRateWindowStartMs(windowStart + COMMUNITY_AGREEMENT_RATE_WINDOW_MS)).toBe(
      windowStart + COMMUNITY_AGREEMENT_RATE_WINDOW_MS
    );
  });

  it('documents a bounded retention horizon for automatic cleanup', () => {
    expect(COMMUNITY_AGREEMENT_RATE_BUCKET_RETENTION_MS).toBe(10 * 60_000);
  });
});

describe('WP-09 R1 settlement still intact with genuine zero', () => {
  it('keeps surface available for settled Rated genuine zero', () => {
    const product = {
      barcode: '9300000000001',
      _publication: {
        settled: true,
        body: {
          publicationStatus: 'rated',
          publishedScore: 0,
          assessmentLanes: { nutrition: 'resolved', processing: 'resolved' },
        },
        planet: {
          publicationStatus: 'rated',
          publishedScore: 0,
          assessmentLanes: { broad_environment: 'resolved', packaging_fallback: 'resolved' },
        },
        claims: {
          publicationStatus: 'rated',
          publishedScore: 0,
          assessmentLanes: { packet: 'assessed', benchmark: 'assessed' },
        },
        transparency: {
          publicationStatus: 'rated',
          publishedScore: 0,
          assessmentLanes: { ingredient_clarity: 'resolved', origins: 'resolved' },
        },
        overall: { publicationStatus: 'rated', publishedScore: 0 },
      },
    } as Product;
    expect(
      agreementSurfaceGate('nutrition', product, {
        publicationSettled: true,
        settledBarcode: '9300000000001',
        currentBarcode: '9300000000001',
      }).ok
    ).toBe(true);
  });
});
