/**
 * Workstream C product-scope AND/OR group behaviour.
 */
import {
  buildSignalProductScopeMapsFromCsvRecords,
  signalTargetProductScopeMatches,
  type ProductScopeScanContext,
} from '../../../dynamicSignals/productScope/signalProductScopeEvaluator';
import type { CsvRecord } from '../../../identity/workstreamA/csv';

const PAMS_TARGET = 'TGT-105';
const EGGS_TARGET = 'TGT-111';

function pamsCriteria(): CsvRecord[] {
  return [
    {
      criterion_id: 'SPC-0023',
      signal_target_id: PAMS_TARGET,
      scope_group_id: `${PAMS_TARGET}__pack`,
      market_key: 'NZ',
      required_brand_id: 'B0024',
      required_parent_id: 'P0003',
      match_field: 'product_name',
      match_mode: 'phrase_contains',
      match_value: 'beef lasagne',
      match_value_normalized: 'beef lasagne',
      review_state: 'reviewed',
    },
    {
      criterion_id: 'SPC-0024',
      signal_target_id: PAMS_TARGET,
      scope_group_id: `${PAMS_TARGET}__pack`,
      market_key: 'NZ',
      required_brand_id: 'B0024',
      required_parent_id: 'P0003',
      match_field: 'pack_quantity',
      match_mode: 'phrase_contains',
      match_value: '1.3kg',
      match_value_normalized: '1 3kg',
      review_state: 'reviewed',
    },
  ];
}

function eggsOrGroups(): CsvRecord[] {
  return [
    {
      criterion_id: 'SPC-0044',
      signal_target_id: EGGS_TARGET,
      scope_group_id: `${EGGS_TARGET}__cage_free`,
      market_key: 'AU',
      required_brand_id: 'B0001',
      required_parent_id: 'P0001',
      match_field: 'product_name',
      match_mode: 'phrase_contains',
      match_value: 'cage free eggs',
      match_value_normalized: 'cage free eggs',
      review_state: 'reviewed',
    },
    {
      criterion_id: 'SPC-0045',
      signal_target_id: EGGS_TARGET,
      scope_group_id: `${EGGS_TARGET}__cage_free_hyphen`,
      market_key: 'AU',
      required_brand_id: 'B0001',
      required_parent_id: 'P0001',
      match_field: 'product_name',
      match_mode: 'phrase_contains',
      match_value: 'cage-free eggs',
      match_value_normalized: 'cage free eggs',
      review_state: 'reviewed',
    },
  ];
}

function pamsCtx(partial: Partial<ProductScopeScanContext> & { productName: string }): ProductScopeScanContext {
  return {
    barcode: partial.barcode ?? '9410000111111',
    productName: partial.productName,
    brand_id: partial.brand_id === undefined ? 'B0024' : partial.brand_id,
    parent_id: partial.parent_id === undefined ? 'P0003' : partial.parent_id,
    scanMarketPublic: partial.scanMarketPublic ?? 'NZ',
    quantity: partial.quantity,
    product_quantity: partial.product_quantity,
    product_quantity_unit: partial.product_quantity_unit,
  };
}

describe('productScope AND/OR groups', () => {
  const pamsMaps = buildSignalProductScopeMapsFromCsvRecords(pamsCriteria());
  const eggsMaps = buildSignalProductScopeMapsFromCsvRecords(eggsOrGroups());

  it('Pams: beef lasagne + wrong size → no match', () => {
    expect(
      signalTargetProductScopeMatches(
        pamsMaps,
        PAMS_TARGET,
        pamsCtx({ productName: 'Pams Beef Lasagne 500g' })
      )
    ).toBe(false);
  });

  it('Pams: wrong line + 1.3kg → no match', () => {
    expect(
      signalTargetProductScopeMatches(
        pamsMaps,
        PAMS_TARGET,
        pamsCtx({ productName: 'Pams Chicken Pie 1.3kg' })
      )
    ).toBe(false);
  });

  it('Pams: beef lasagne + 1.3kg → match', () => {
    expect(
      signalTargetProductScopeMatches(
        pamsMaps,
        PAMS_TARGET,
        pamsCtx({ productName: 'Pams Beef Lasagne 1.3kg' })
      )
    ).toBe(true);
  });

  it('Pams: wrong brand → no match', () => {
    expect(
      signalTargetProductScopeMatches(
        pamsMaps,
        PAMS_TARGET,
        pamsCtx({ productName: 'Pams Beef Lasagne 1.3kg', brand_id: 'B0001', parent_id: 'P0001' })
      )
    ).toBe(false);
  });

  it('Pams: wrong market → no match', () => {
    expect(
      signalTargetProductScopeMatches(
        pamsMaps,
        PAMS_TARGET,
        pamsCtx({ productName: 'Pams Beef Lasagne 1.3kg', scanMarketPublic: 'AU' })
      )
    ).toBe(false);
  });

  it('brand_id=null parent_id=null → no match even with perfect product name', () => {
    expect(
      signalTargetProductScopeMatches(
        pamsMaps,
        PAMS_TARGET,
        pamsCtx({ productName: 'Pams Beef Lasagne 1.3kg', brand_id: null, parent_id: null })
      )
    ).toBe(false);
  });

  it('OR groups: cage-free eggs and cage free eggs both match as complete alternative groups', () => {
    const eggsCtxBase = {
      barcode: '9300000222222',
      brand_id: 'B0001',
      parent_id: 'P0001',
      scanMarketPublic: 'AU' as const,
    };
    expect(
      signalTargetProductScopeMatches(eggsMaps, EGGS_TARGET, {
        ...eggsCtxBase,
        productName: 'Woolworths Cage Free Eggs 12pk',
      })
    ).toBe(true);
    expect(
      signalTargetProductScopeMatches(eggsMaps, EGGS_TARGET, {
        ...eggsCtxBase,
        productName: 'Woolworths Cage-Free Eggs 12pk',
      })
    ).toBe(true);
  });
});
