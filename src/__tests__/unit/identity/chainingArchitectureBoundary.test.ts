/**
 * Architecture boundary: Shared Identity chaining owns brand/parent/alias/hierarchy only.
 * Product scope for Signal resolution lives in Workstream C.
 */
import fs from 'fs';
import path from 'path';
import { parseCsv } from '../../../identity/workstreamA/csv';
import {
  buildSignalProductScopeMapsFromCsvRecords,
  signalTargetProductScopeMatches,
} from '../../../dynamicSignals/productScope/signalProductScopeEvaluator';

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const CHAIN_V03 = path.join(ROOT, 'workstreamA', 'a-data', 'chaining-extensions', 'v0.3');
const WAVE1_INPUT = path.join(ROOT, 'workstreamA', 'a-data', 'wave1-v0.16', 'input');
const CHAINING_SRC = path.join(ROOT, 'src', 'identity', 'chaining');
const CRITERIA = path.join(
  ROOT,
  'workstreamC',
  'c-data',
  'dynamic-signals-v0.3',
  'input',
  'signal_target_product_criteria.csv'
);

const FORBIDDEN_PRODUCT_CSVS = [
  'product_families.csv',
  'product_family_aliases.csv',
  'product_identities.csv',
  'product_identity_aliases.csv',
  'product_family_membership.csv',
];

describe('Shared Identity chaining architecture boundary', () => {
  it('active chaining-extensions/v0.3 has no product_* CSVs', () => {
    expect(fs.existsSync(CHAIN_V03)).toBe(true);
    for (const name of FORBIDDEN_PRODUCT_CSVS) {
      expect(fs.existsSync(path.join(CHAIN_V03, name))).toBe(false);
    }
  });

  it('wave1-v0.16/input has no gtin_brand_links.csv', () => {
    expect(fs.existsSync(path.join(WAVE1_INPUT, 'gtin_brand_links.csv'))).toBe(false);
  });

  it('chaining-extensions/v0.3 has no gtin_brand_links_extension.csv', () => {
    expect(fs.existsSync(path.join(CHAIN_V03, 'gtin_brand_links_extension.csv'))).toBe(false);
  });

  it('src/identity/chaining has no productFamilyMaps.ts or productIdentityMaps.ts', () => {
    expect(fs.existsSync(path.join(CHAINING_SRC, 'productFamilyMaps.ts'))).toBe(false);
    expect(fs.existsSync(path.join(CHAINING_SRC, 'productIdentityMaps.ts'))).toBe(false);
    const entries = fs.readdirSync(CHAINING_SRC);
    expect(entries).not.toContain('productFamilyMaps.ts');
    expect(entries).not.toContain('productIdentityMaps.ts');
  });

  it('README of chaining v0.3 states parents+brands+aliases+hierarchy only', () => {
    const readme = fs.readFileSync(path.join(CHAIN_V03, 'README.md'), 'utf8');
    expect(readme.toLowerCase()).toMatch(/parents?\s*\+\s*brands?\s*\+\s*aliases?\s*\+\s*hierarchy/);
    expect(readme.toLowerCase()).toMatch(/workstream c/);
    expect(readme).toMatch(/signal_target_product_criteria/);
  });

  it('every reviewed phrase criterion is Chaining-anchored; gtin rows are allowed', () => {
    const rows = parseCsv(fs.readFileSync(CRITERIA, 'utf8'));
    const reviewed = rows.filter((r) => (r.review_state ?? '').trim() === 'reviewed');
    expect(reviewed.length).toBeGreaterThan(0);
    for (const r of reviewed) {
      const field = (r.match_field ?? '').trim();
      expect(field === 'product_name' || field === 'gtin').toBe(true);
      if (field === 'product_name') {
        const brand = (r.required_brand_id ?? '').trim();
        const parent = (r.required_parent_id ?? '').trim();
        expect(brand || parent).toBeTruthy();
      }
    }
  });

  it('criteria carry no scope_group_id and no pack_quantity rows (MVP product-line scope)', () => {
    const header = fs.readFileSync(CRITERIA, 'utf8').split(/\r?\n/)[0];
    expect(header).not.toMatch(/scope_group_id/);
    const rows = parseCsv(fs.readFileSync(CRITERIA, 'utf8'));
    for (const r of rows) {
      const field = (r.match_field ?? '').trim();
      expect(field === 'product_name' || field === 'gtin').toBe(true);
      expect(field).not.toBe('pack_quantity');
    }
  });

  it('product Signals cannot match when brand_id and parent_id are both null', () => {
    const maps = buildSignalProductScopeMapsFromCsvRecords(
      parseCsv(fs.readFileSync(CRITERIA, 'utf8'))
    );
    // Use a known product-scoped target with criteria (Pams Beef Lasagne).
    expect(
      signalTargetProductScopeMatches(maps, 'TGT-105', {
        barcode: '9410000000001',
        productName: 'Pams Beef Lasagne 1.3kg',
        brand_id: null,
        parent_id: null,
        scanMarketPublic: 'NZ',
      })
    ).toBe(false);
  });
});
