/**
 * Architecture boundary: Shared Identity chaining owns brand/parent/alias/hierarchy only.
 * Product scope for Signal resolution lives in Workstream C.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const CHAIN_V03 = path.join(ROOT, 'workstreamA', 'a-data', 'chaining-extensions', 'v0.3');
const WAVE1_GTIN = path.join(
  ROOT,
  'workstreamA',
  'a-data',
  'wave1-v0.16',
  'input',
  'gtin_brand_links.csv'
);
const CHAINING_SRC = path.join(ROOT, 'src', 'identity', 'chaining');
const EMBED_LOADER = path.join(
  ROOT,
  'src',
  'dynamicSignals',
  'asset',
  'v0.2',
  'loadDynamicSignalsAssetPack.ts'
);
const EMBED_GENERATED = path.join(
  ROOT,
  'src',
  'dynamicSignals',
  'asset',
  'v0.2',
  'dynamicSignalsAssetRuntimeEmbed.generated.ts'
);
const GENERATOR = path.join(
  ROOT,
  'scripts',
  'generate-dynamic-signals-asset-runtime-embed.ts'
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

  it('wave1-v0.16 gtin_brand_links is header-only OR embed consumption uses empty gtinRows', () => {
    const loaderSrc = fs.readFileSync(EMBED_LOADER, 'utf8');
    const generatorSrc = fs.readFileSync(GENERATOR, 'utf8');
    const embedSrc = fs.readFileSync(EMBED_GENERATED, 'utf8');

    const loaderEmptiesGtin =
      /buildADataMapsFromCsvRecords\(\s*e\.brandRows\s*,\s*e\.parentRows\s*,\s*\[\s*\]/.test(
        loaderSrc
      );
    const generatorEmptiesGtin = /gtinRows:\s*\[\s*\]/.test(generatorSrc);
    const embedHasEmptyGtinArray = /"gtinRows":\s*\[\s*\]/.test(embedSrc);

    let gtinHeaderOnly = false;
    if (fs.existsSync(WAVE1_GTIN)) {
      const lines = fs
        .readFileSync(WAVE1_GTIN, 'utf8')
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      gtinHeaderOnly = lines.length <= 1;
    } else {
      gtinHeaderOnly = true; // absent
    }

    expect(
      gtinHeaderOnly || loaderEmptiesGtin || generatorEmptiesGtin || embedHasEmptyGtinArray
    ).toBe(true);
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
});
