import { colesFamilyScopeGuardAllows } from '../../../dynamicSignals/asset/v0.2/colesFamilyProductScopeGuard';

describe('colesFamilyProductScopeGuard', () => {
  it('allows corroborated Coles own-label via brands_field', () => {
    expect(
      colesFamilyScopeGuardAllows({
        brand_id: 'B0013',
        parent_id: 'P0002',
        brand_match_channel: 'brands_field',
        brand_type: 'retailer_own_label',
      })
    ).toBe(true);
  });

  it('blocks product_name-only Coles chain inference', () => {
    expect(
      colesFamilyScopeGuardAllows({
        brand_id: 'B0769',
        parent_id: 'P0002',
        brand_match_channel: 'product_name',
        brand_type: 'retailer_own_label',
      })
    ).toBe(false);
  });

  it('blocks third-party parent even if mis-resolved', () => {
    expect(
      colesFamilyScopeGuardAllows({
        brand_id: 'B0066',
        parent_id: 'P0008',
        brand_match_channel: 'brands_field',
        brand_type: 'brand_family',
      })
    ).toBe(false);
  });

  it('allows gtin_link corroborated Coles-family chain', () => {
    expect(
      colesFamilyScopeGuardAllows({
        brand_id: 'B0013',
        parent_id: 'P0002',
        brand_match_channel: 'gtin_link',
        brand_type: 'retailer_own_label',
      })
    ).toBe(true);
  });
});
