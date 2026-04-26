import type { Product } from '../../../types/product';
import type { SharedIdentityContext } from '../../../identity/types';
import {
  buildIdentityCoverageScorecard,
  buildIdentityReviewQueue,
  isOwnLabelPriorityProduct,
  listIdentitySeedSources,
  listIdentityStewardActions,
  logIdentityStewardAction,
  recordIdentitySeedSource,
} from '../../../identity/coverage/identityCoverageStewardship';

function mkContext(overrides: Partial<SharedIdentityContext> = {}): SharedIdentityContext {
  return {
    resolution_key: { gtin: '9300633072391', market_key: 'AU' },
    canonical: { product_id: 'gtin:9300633072391', brand_id: 'brand:acme' },
    operational_entities: {},
    quality: {
      confidence_state: 'strong',
      review_state: 'seeded',
      resolution_status: 'resolved',
      ambiguity_flags: [],
    },
    lineage: { source_refs: ['openfoodfacts'], alias_hits: [], normalizer_version: 'v1' },
    ...overrides,
  };
}

describe('identityCoverageStewardship (Slice 2)', () => {
  it('builds coverage scorecard with market and ambiguity metrics', () => {
    const contexts: SharedIdentityContext[] = [
      mkContext(),
      mkContext({
        resolution_key: { gtin: '2', market_key: 'NZ' },
        quality: {
          confidence_state: 'low',
          review_state: 'provisional',
          resolution_status: 'ambiguous',
          ambiguity_flags: ['multiple_brand_candidates'],
        },
      }),
    ];
    const products: Product[] = [
      { barcode: '1', brand_owner: 'Woolworths', source: 'openfoodfacts' },
      { barcode: '2', brand_owner: 'Other', source: 'openfoodfacts' },
    ];
    const out = buildIdentityCoverageScorecard({
      contexts,
      ownLabelProducts: products,
      generatedAt: '2026-04-26T00:00:00.000Z',
    });
    expect(out.total_contexts).toBe(2);
    expect(out.by_market.AU).toBe(1);
    expect(out.by_market.NZ).toBe(1);
    expect(out.ambiguity_count).toBe(1);
    expect(out.own_label_priority_count).toBe(1);
  });

  it('queues ambiguity/miss contexts for review', () => {
    const queue = buildIdentityReviewQueue({
      contexts: [
        mkContext({
          quality: {
            confidence_state: 'low',
            review_state: 'provisional',
            resolution_status: 'ambiguous',
            ambiguity_flags: ['missing_brand_candidate'],
          },
        }),
      ],
      nowIso: '2026-04-26T00:00:00.000Z',
    });
    expect(queue).toHaveLength(1);
    expect(queue[0].priority).toBe('high');
  });

  it('tracks seed provenance and stewardship action logs', () => {
    const baseSeeds = listIdentitySeedSources().length;
    const baseActions = listIdentityStewardActions().length;

    recordIdentitySeedSource({
      id: 'seed:1',
      gtin: '9300633072391',
      market_key: 'AU',
      source_type: 'catalog_import',
      source_ref: 'seed-file-v1',
      created_at: '2026-04-26T00:00:00.000Z',
    });
    logIdentityStewardAction({
      id: 'act:1',
      action_type: 'review_started',
      actor: 'Leighton',
      reason: 'ambiguity follow-up',
      created_at: '2026-04-26T00:00:00.000Z',
    });

    expect(listIdentitySeedSources().length).toBe(baseSeeds + 1);
    expect(listIdentityStewardActions().length).toBe(baseActions + 1);
  });

  it('prioritizes own-label products using bounded keyword set', () => {
    expect(isOwnLabelPriorityProduct({ barcode: '1', brand_owner: 'Woolworths AU', source: 'openfoodfacts' })).toBe(true);
    expect(isOwnLabelPriorityProduct({ barcode: '2', brand_owner: 'Acme Global', source: 'openfoodfacts' })).toBe(false);
  });
});

