import { calculateEthicsPillar } from '../../../../lib/truscoreEngine/pillars/ethicsPillar';
import type { Product } from '../../../../types/product';
import type { ProductWithTrustScore } from '../../../../types/product';

describe('ethics benchmark adapter integration (Slice 3)', () => {
  const baseProduct: Product = {
    barcode: '1234567890123',
    product_name: 'Test Product',
    brands: 'Marks & Spencer PLC',
    labels_tags: [],
    ingredients_text: '',
    ingredients_analysis_tags: [],
    additives_tags: [],
    nutriments: {},
    source: 'test',
  };

  it('deterministically disables benchmark movement when frozen eligibility is false', () => {
    const product = {
      ...baseProduct,
      _shared_identity_context: {
        resolution_key: { gtin: '1234567890123', market_key: 'AU' },
        canonical: { product_id: 'gtin:1234567890123', brand_id: 'brand:m_s', current_owner_entity_id: 'owner:m_s' },
        operational_entities: {},
        quality: {
          confidence_state: 'strong',
          review_state: 'reviewed',
          resolution_status: 'resolved',
          ambiguity_flags: [],
        },
        lineage: { source_refs: ['test'], alias_hits: [], normalizer_version: 'v1' },
      },
      _frozen_benchmark_attribution: {
        snapshot_ref: {
          benchmark_name: 'BBFAW',
          benchmark_cycle: '2024',
          snapshot_version: 'bbfaw-2024-v1',
          ownership_cutoff_date: '2024-06-30',
        },
        subject_resolution: {
          canonical_brand_id: 'brand:m_s',
          benchmark_owner_entity_id: 'owner:m_s',
          benchmark_owner_legal_name: 'Marks & Spencer PLC',
        },
        comparison_context: {
          current_owner_entity_id: 'owner:m_s',
          ownership_divergence_flag: false,
        },
        state: {
          confidence_state: 'strong',
          review_state: 'provisional',
          resolution_status: 'needs_review',
        },
        eligibility: {
          ethics_scoring_eligible: false,
          blocker_flags: ['needs_review'],
        },
        freeze: { freeze_status: 'frozen', lineage_reference: 'x' },
      },
    } as ProductWithTrustScore;

    const result = calculateEthicsPillar(product);
    expect(result.score).toBe(15);
    expect(
      result.adjustments.some((a) =>
        a.description.includes('Frozen benchmark not eligible for ethics scoring')
      )
    ).toBe(true);
  });
});

