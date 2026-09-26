/**
 * MVP recall doctrine (22 Sep 2026): a target's reviewed criteria are alternative
 * product_name descriptors (OR). Pack size, batch and date never gate display.
 */
import {
  buildSignalProductScopeMapsFromCsvRecords,
  signalTargetProductScopeMatches,
  type ProductScopeScanContext,
} from '../../../dynamicSignals/productScope/signalProductScopeEvaluator';
import type { CsvRecord } from '../../../identity/workstreamA/csv';

const PAMS_TARGET = 'TGT-105';
const EGGS_TARGET = 'TGT-111';
const VOGEL_TARGET = 'TGT-125';

function criterion(partial: Partial<CsvRecord> & { criterion_id: string; signal_target_id: string; match_value: string }): CsvRecord {
  return {
    market_key: 'NZ',
    required_brand_id: 'B0024',
    required_parent_id: 'P0003',
    match_field: 'product_name',
    match_mode: 'phrase_contains',
    match_value_normalized: partial.match_value,
    review_state: 'reviewed',
    ...partial,
  };
}

function pamsCriteria(): CsvRecord[] {
  return [
    criterion({
      criterion_id: 'SPC-0012',
      signal_target_id: PAMS_TARGET,
      match_value: 'beef lasagne',
    }),
  ];
}

function eggsCriteria(): CsvRecord[] {
  return [
    criterion({
      criterion_id: 'SPC-EGGS-NAME',
      signal_target_id: EGGS_TARGET,
      market_key: 'AU+NZ',
      required_brand_id: 'B0001',
      required_parent_id: 'P0001',
      match_value: 'eggs',
    }),
    {
      criterion_id: 'SPC-EGGS-GTIN',
      signal_target_id: EGGS_TARGET,
      market_key: 'AU+NZ',
      required_brand_id: 'B0001',
      required_parent_id: 'P0001',
      match_field: 'gtin',
      match_mode: 'exact',
      match_value: '9339687306558',
      match_value_normalized: '9339687306558',
      review_state: 'reviewed',
    },
  ];
}

function vogelCriteria(): CsvRecord[] {
  return ['original mixed grain toast', 'dark rye toast', 'fruit and spice extra thick'].map(
    (value, i) =>
      criterion({
        criterion_id: `SPC-VOGEL-${i}`,
        signal_target_id: VOGEL_TARGET,
        required_brand_id: 'B0175',
        required_parent_id: 'P0040',
        match_value: value,
      })
  );
}

function pamsCtx(
  partial: Partial<ProductScopeScanContext> & { productName: string }
): ProductScopeScanContext {
  return {
    barcode: partial.barcode ?? '9410000111111',
    productName: partial.productName,
    brand_id: partial.brand_id === undefined ? 'B0024' : partial.brand_id,
    parent_id: partial.parent_id === undefined ? 'P0003' : partial.parent_id,
    scanMarketPublic: partial.scanMarketPublic ?? 'NZ',
  };
}

describe('productScope simple reviewed descriptors', () => {
  const pamsMaps = buildSignalProductScopeMapsFromCsvRecords(pamsCriteria());
  const eggsMaps = buildSignalProductScopeMapsFromCsvRecords(eggsCriteria());
  const vogelMaps = buildSignalProductScopeMapsFromCsvRecords(vogelCriteria());

  it('Pams: product line matches at any pack size — size is qualification content', () => {
    for (const name of [
      'Pams Beef Lasagne 1.3kg',
      'Pams Beef Lasagne 500g',
      'Pams Beef Lasagne',
    ]) {
      expect(signalTargetProductScopeMatches(pamsMaps, PAMS_TARGET, pamsCtx({ productName: name }))).toBe(
        true
      );
    }
  });

  it('Pams: sibling product line does not match', () => {
    expect(
      signalTargetProductScopeMatches(
        pamsMaps,
        PAMS_TARGET,
        pamsCtx({ productName: 'Pams Chicken Pie 1.3kg' })
      )
    ).toBe(false);
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

  it('null Chaining identity fails closed even with a perfect product name', () => {
    expect(
      signalTargetProductScopeMatches(
        pamsMaps,
        PAMS_TARGET,
        pamsCtx({ productName: 'Pams Beef Lasagne 1.3kg', brand_id: null, parent_id: null })
      )
    ).toBe(false);
  });

  it('alternative Woolworths egg labels match governed eggs term', () => {
    const base = {
      barcode: '9300000222222',
      brand_id: 'B0001',
      parent_id: 'P0001',
      scanMarketPublic: 'AU' as const,
    };
    for (const name of ['Woolworths Cage Free Eggs 12pk', 'Woolworths Free Range Eggs 12pk']) {
      expect(signalTargetProductScopeMatches(eggsMaps, EGGS_TARGET, { ...base, productName: name })).toBe(
        true
      );
    }
  });

  it('any one of several reviewed product-line descriptors is sufficient', () => {
    const base = {
      barcode: '9410000666666',
      brand_id: 'B0175',
      parent_id: 'P0040',
      scanMarketPublic: 'NZ' as const,
    };
    expect(
      signalTargetProductScopeMatches(vogelMaps, VOGEL_TARGET, {
        ...base,
        productName: "Vogel's Original Mixed Grain Toast",
      })
    ).toBe(true);
    expect(
      signalTargetProductScopeMatches(vogelMaps, VOGEL_TARGET, {
        ...base,
        productName: "Vogel's Dark Rye Toast 720g",
      })
    ).toBe(true);
    expect(
      signalTargetProductScopeMatches(vogelMaps, VOGEL_TARGET, {
        ...base,
        productName: "Vogel's Soy and Linseed 700g",
      })
    ).toBe(false);
  });

  it('pack_quantity criteria remain ignored; gtin exact is a live positive path', () => {
    const maps = buildSignalProductScopeMapsFromCsvRecords([
      criterion({
        criterion_id: 'SPC-QTY',
        signal_target_id: PAMS_TARGET,
        match_field: 'pack_quantity',
        match_value: '1.3kg',
        match_value_normalized: '1 3kg',
      }),
      {
        criterion_id: 'SPC-GTIN',
        signal_target_id: PAMS_TARGET,
        market_key: 'NZ',
        required_brand_id: 'B0024',
        required_parent_id: 'P0003',
        match_field: 'gtin',
        match_mode: 'exact',
        match_value: '9415077182329',
        match_value_normalized: '9415077182329',
        review_state: 'reviewed',
      },
    ]);
    expect(
      signalTargetProductScopeMatches(maps, PAMS_TARGET, pamsCtx({ productName: 'Pams Beef Lasagne 1.3kg' }))
    ).toBe(false);
    expect(
      signalTargetProductScopeMatches(
        maps,
        PAMS_TARGET,
        pamsCtx({
          barcode: '9415077182329',
          productName: '',
          brand_id: null,
          parent_id: null,
        })
      )
    ).toBe(true);
  });

  it('unanchored reviewed rows fail closed', () => {
    const maps = buildSignalProductScopeMapsFromCsvRecords([
      criterion({
        criterion_id: 'SPC-UNANCHORED',
        signal_target_id: PAMS_TARGET,
        required_brand_id: '',
        required_parent_id: '',
        match_value: 'beef lasagne',
      }),
    ]);
    expect(
      signalTargetProductScopeMatches(maps, PAMS_TARGET, pamsCtx({ productName: 'Pams Beef Lasagne' }))
    ).toBe(false);
  });
});
