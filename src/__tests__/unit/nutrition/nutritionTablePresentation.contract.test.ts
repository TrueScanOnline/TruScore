/**
 * Presentation / interaction contract smoke tests for Nutrition Table Wave 3.
 * Full RN gesture UAT remains device-side; these assert wiring contracts in source.
 */
import * as fs from 'fs';
import * as path from 'path';

const REPO = path.resolve(__dirname, '../../../..');

function read(rel: string): string {
  return fs.readFileSync(path.join(REPO, rel), 'utf8');
}

describe('Nutrition Table Wave 3 presentation contracts', () => {
  it('result path uses NutritionTable without whole-card edit Pressable', () => {
    const src = read('app/result/[barcode].tsx');
    expect(src).toContain('<NutritionTable');
    expect(src).toContain('onEdit={handleEditProduct}');
    // Whole-card contribution Pressable around NutritionTable removed
    expect(src).not.toMatch(/Pressable[\s\S]{0,200}onPress=\{handleEditProduct\}[\s\S]{0,400}<NutritionTable/);
    expect(src).not.toContain('addNutritionFactsHere');
  });

  it('NutritionTable opens details from body and keeps Moderate label key', () => {
    const src = read('src/components/NutritionTable.tsx');
    expect(src).toContain('assessGovernedNutrients');
    expect(src).toContain('NutritionDetailsModal');
    expect(src).toContain('levelBadgeModerate');
    expect(src).toContain('openDetails');
    expect(src).toContain('contributeA11y');
    // Salt row removed from consumer table; sodium is canonical
    expect(src).toContain("key: 'sodium'");
    expect(src).not.toMatch(/key:\s*'salt'/);
    // Fat has no governedKey rating
    expect(src).toMatch(/label: t\('nutrition\.fat'\)[\s\S]*?key: 'fat'[\s\S]*?unit: 'g'/);
  });

  it('Nutrition Details has no contribution CTA and exposes focus targets', () => {
    const src = read('src/components/NutritionDetailsModal.tsx');
    expect(src).toContain('Nutrition details');
    expect(src).toContain('nutrition-details-');
    expect(src).toContain('focusTarget');
    expect(src).not.toContain('handleEditProduct');
    expect(src).not.toContain('Contribute');
  });

  it('consumer copy uses Moderate not Med in en locale', () => {
    const en = JSON.parse(read('src/i18n/locales/en.json'));
    expect(en.nutrition.levelBadgeModerate).toBe('Moderate');
    expect(en.nutrition.levelBadgeMed).toBe('Moderate');
    expect(en.nutrition.sodium).toBe('Sodium');
  });
});
