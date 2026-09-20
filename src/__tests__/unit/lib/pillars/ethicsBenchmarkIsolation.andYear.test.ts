/**
 * Targeted proofs for SI/KTC/BBFAW refresh:
 * - BBFAW owner hint must not alter KTC resolution
 * - KTC owner hint must not alter BBFAW resolution
 * - Score Highlights years bind from firing governed records (KTC 2026 / BBFAW 2025)
 * - Missing governed year fails closed
 */

import { calculateEthicsPillar } from '../../../../lib/truscoreEngine/pillars/ethicsPillar';
import { resolveKtcGovernedBenchmarkYear } from '../../../../lib/truscoreEngine/pillars/ethicsBenchmarkAdapter';
import { checkKTCParent } from '../../../../services/ktcService';
import { checkBBFAWTier } from '../../../../services/bbfawService';
import { resolveBrandToKTCParent } from '../../../../services/ktcBrandResolutionService';
import { resolveBrandToParent } from '../../../../services/bbfawBrandResolutionService';
import type { Product } from '../../../../types/product';
import type { ProductWithTrustScore } from '../../../../types/product';
import type { FrozenBenchmarkAttributionObject } from '../../../../benchmark/types';
import { selectBenchmarkSnapshot } from '../../../../benchmark/snapshotSelect';

const baseProduct: Product = {
  barcode: '1234567890123',
  product_name: 'Test Product',
  brands: '',
  labels_tags: [],
  ingredients_text: '',
  ingredients_analysis_tags: [],
  additives_tags: [],
  nutriments: {},
  source: 'test',
};

describe('benchmark isolation + governed year binding', () => {
  test('active snapshots are ktc-2026-v2 and bbfaw-2025-v1 with authorised cutoffs', () => {
    const ktc = selectBenchmarkSnapshot('KTC');
    const bbfaw = selectBenchmarkSnapshot('BBFAW');
    expect(ktc.snapshot_version).toBe('ktc-2026-v2');
    expect(ktc.benchmark_cycle).toBe('2026');
    expect(ktc.ownership_cutoff_date).toBe('2025-09-30');
    expect(bbfaw.snapshot_version).toBe('bbfaw-2025-v1');
    expect(bbfaw.benchmark_cycle).toBe('2025');
    expect(bbfaw.ownership_cutoff_date).toBe('2025-11-30');
  });

  test('official score tables: KTC 45 and BBFAW 149', () => {
    const ktcParents = require('../../../../data/ethics/ktcParents.json');
    const bbfaw = require('../../../../data/ethics/bbfaw2025Canonical.json');
    expect(ktcParents).toHaveLength(45);
    expect(bbfaw.companies).toHaveLength(149);
    expect(checkKTCParent('Barry Callebaut AG')?.totalBenchmarkScore).toBe(14);
    expect(checkKTCParent('Archer Daniels Midland Company')?.totalBenchmarkScore).toBe(11);
    expect(checkKTCParent('Kerry Group plc')?.totalBenchmarkScore).toBe(6);
  });

  test('BBFAW owner hint does not prepend into KTC candidate resolution', () => {
    // Product brand is a KTC-scored company. BBFAW frozen owner hint is a different BBFAW company.
    // If the BBFAW hint were wrongly prepended to KTC, KTC would resolve Marks & Spencer (no KTC row)
    // and miss JBS.
    const product = {
      ...baseProduct,
      brands: 'JBS S.A.',
      _frozen_benchmark_attribution: {
        snapshot_ref: {
          benchmark_name: 'BBFAW',
          benchmark_cycle: '2025',
          snapshot_version: 'bbfaw-2025-v1',
          ownership_cutoff_date: '2025-11-30',
        },
        subject_resolution: {
          canonical_brand_id: 'brand:ms',
          benchmark_owner_entity_id: 'owner:ms',
          benchmark_owner_legal_name: 'Marks & Spencer PLC',
        },
        comparison_context: {
          current_owner_entity_id: 'owner:ms',
          ownership_divergence_flag: false,
        },
        state: {
          confidence_state: 'strong',
          review_state: 'reviewed',
          resolution_status: 'resolved',
        },
        eligibility: {
          ethics_scoring_eligible: true,
          blocker_flags: [],
        },
        freeze: { freeze_status: 'frozen', lineage_reference: 'isolation-test' },
      },
    } as ProductWithTrustScore;

    const result = calculateEthicsPillar(product);
    const ktcRow = result.adjustments.find((a) => a.id.startsWith('ethics-v37-ktc-'));
    expect(ktcRow?.metadata?.benchmarkCompany).toBe('JBS S.A.');
    expect(ktcRow?.metadata?.benchmarkYear).toBe(2026);
  });

  test('fired BBFAW highlight metadata uses 2025 from the canonical firing record', () => {
    const result = calculateEthicsPillar({ ...baseProduct, brands: 'Marks & Spencer PLC' });
    const tier = result.adjustments.find((a) => a.id === 'ethics-v37-bbfaw-tier-2');
    expect(tier?.metadata?.benchmarkYear).toBe(2025);
    expect(checkBBFAWTier('Marks & Spencer PLC')?.year).toBe(2025);
  });

  test('fired KTC highlight metadata uses 2026 from the firing score row', () => {
    const result = calculateEthicsPillar({ ...baseProduct, brands: 'JBS S.A.' });
    const ktc = result.adjustments.find((a) => a.id.startsWith('ethics-v37-ktc-'));
    expect(ktc?.metadata?.benchmarkYear).toBe(2026);
  });

  test('missing governed KTC year fails closed (no registry manufacture)', () => {
    expect(resolveKtcGovernedBenchmarkYear(null)).toBeUndefined();
    expect(
      resolveKtcGovernedBenchmarkYear({
        snapshot_ref: { benchmark_cycle: '' },
      } as FrozenBenchmarkAttributionObject)
    ).toBeUndefined();
  });

  test('Arnott\'s does not inherit Campbell KTC scoring under ktc-2026-v2', () => {
    expect(resolveBrandToKTCParent("Arnott's")).toBeNull();
    expect(resolveBrandToKTCParent('arnotts')).toBeNull();
    const result = calculateEthicsPillar({ ...baseProduct, brands: "Arnott's" });
    expect(result.adjustments.some((a) => a.id.startsWith('ethics-v37-ktc-'))).toBe(false);
    // Campbell itself remains independently scoreable
    expect(checkKTCParent('Campbell Soup Company')).toBeTruthy();
  });

  test('Birds Eye does not inherit Conagra KTC scoring under ktc-2026-v2', () => {
    expect(resolveBrandToKTCParent('Birds Eye')).toBeNull();
    expect(resolveBrandToKTCParent('birdseye')).toBeNull();
    const result = calculateEthicsPillar({ ...baseProduct, brands: 'Birds Eye' });
    expect(result.adjustments.some((a) => a.id.startsWith('ethics-v37-ktc-'))).toBe(false);
    expect(checkKTCParent('Conagra Brands, Inc.')).toBeTruthy();
  });

  test('unqualified Tulip does not inherit Danish Crown BBFAW scoring', () => {
    expect(resolveBrandToParent('Tulip')).toBeNull();
    expect(resolveBrandToParent('tulip')).toBeNull();
    const result = calculateEthicsPillar({ ...baseProduct, brands: 'Tulip' });
    expect(result.adjustments.some((a) => a.id.startsWith('ethics-v37-bbfaw-'))).toBe(false);
  });

  test('Magnum retains frozen Unilever KTC attribution (TMICC divergence preserved)', () => {
    const resolved = resolveBrandToKTCParent('Magnum');
    expect(resolved?.parentName).toBe('Unilever plc');
  });
});
