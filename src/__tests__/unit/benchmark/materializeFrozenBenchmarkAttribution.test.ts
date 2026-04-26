import { materializeFrozenBenchmarkAttribution } from '../../../benchmark/materializeFrozenBenchmarkAttribution';
import { selectBenchmarkSnapshot } from '../../../benchmark/snapshotSelect';
import type { SharedIdentityContext } from '../../../identity/types';
import type { Product } from '../../../types/product';

function baseContext(): SharedIdentityContext {
  return {
    resolution_key: { gtin: '9300633072391', market_key: 'AU' },
    canonical: {
      product_id: 'gtin:9300633072391',
      brand_id: 'brand:acme',
      current_owner_entity_id: 'owner:new_owner',
    },
    operational_entities: {},
    quality: {
      confidence_state: 'strong',
      review_state: 'reviewed',
      resolution_status: 'resolved',
      ambiguity_flags: [],
    },
    lineage: { source_refs: ['openfoodfacts'], alias_hits: [], normalizer_version: 'v1' },
  };
}

function baseProduct(overrides: Partial<Product> = {}): Product {
  return {
    barcode: '9300633072391',
    brand_owner: 'New Owner Ltd',
    source: 'openfoodfacts',
    ...overrides,
  };
}

describe('materializeFrozenBenchmarkAttribution (Slice 3)', () => {
  it('uses previous owner when acquisition is post-cutoff (divergence true)', () => {
    const snapshot = selectBenchmarkSnapshot('BBFAW');
    const out = materializeFrozenBenchmarkAttribution({
      snapshot,
      benchmarkName: 'BBFAW',
      product: baseProduct({
        phase6_current_owner_effective_date: '2025-01-15',
        phase6_previous_owner_entity_id: 'owner:old_owner',
      }),
      sharedIdentityContext: baseContext(),
    });
    expect(out.subject_resolution.benchmark_owner_entity_id).toBe('owner:old_owner');
    expect(out.comparison_context.ownership_divergence_flag).toBe(true);
  });

  it('keeps current owner as benchmark owner when acquisition is pre-cutoff', () => {
    const snapshot = selectBenchmarkSnapshot('BBFAW');
    const out = materializeFrozenBenchmarkAttribution({
      snapshot,
      benchmarkName: 'BBFAW',
      product: baseProduct({
        phase6_current_owner_effective_date: '2024-01-01',
        phase6_previous_owner_entity_id: 'owner:old_owner',
      }),
      sharedIdentityContext: baseContext(),
    });
    expect(out.subject_resolution.benchmark_owner_entity_id).toBe('owner:new_owner');
    expect(out.comparison_context.ownership_divergence_flag).toBe(false);
  });

  it('alias added after freeze does not mutate existing frozen object', () => {
    const snapshot = selectBenchmarkSnapshot('BBFAW');
    const first = materializeFrozenBenchmarkAttribution({
      snapshot,
      benchmarkName: 'BBFAW',
      product: baseProduct(),
      sharedIdentityContext: baseContext(),
    });
    const changedProduct = baseProduct({ brands: 'Acme Alias Added Later' });
    const second = materializeFrozenBenchmarkAttribution({
      snapshot,
      benchmarkName: 'BBFAW',
      product: changedProduct,
      sharedIdentityContext: baseContext(),
    });
    expect(first.snapshot_ref.snapshot_version).toBe(second.snapshot_ref.snapshot_version);
    expect(first.subject_resolution.benchmark_owner_entity_id).toBe('owner:new_owner');
  });
});

