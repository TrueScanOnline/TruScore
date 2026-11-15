/**
 * FM-01 — NOVA 3 uses a jar-and-spoon pictogram, not the Ionicons wrench.
 */

import fs from 'fs';
import path from 'path';

const REPO = path.join(__dirname, '../../../..');

describe('FM-01 NOVA 3 preserved-food jar-and-spoon icon', () => {
  it('maps NOVA 3 to Nova3PreservedFoodIcon and leaves other groups on Ionicons', () => {
    const modal = fs.readFileSync(path.join(REPO, 'src/components/ProcessingLevelModal.tsx'), 'utf8');
    expect(modal).toContain("import Nova3PreservedFoodIcon from './icons/Nova3PreservedFoodIcon'");
    expect(modal).toContain('customIcon: <Nova3PreservedFoodIcon');
    expect(modal).toContain("color: '#FFA500'");
    expect(modal).not.toMatch(/case 3:[\s\S]*icon:\s*'build'/);
    expect(modal).toMatch(/case 1:[\s\S]*icon:\s*'leaf'/);
    expect(modal).toMatch(/case 2:[\s\S]*icon:\s*'create'/);
    expect(modal).toMatch(/case 4:[\s\S]*icon:\s*'warning'/);
  });

  it('InfoModal accepts an optional customIcon without removing Ionicons support', () => {
    const info = fs.readFileSync(path.join(REPO, 'src/components/InfoModal.tsx'), 'utf8');
    expect(info).toContain('customIcon?: React.ReactNode');
    expect(info).toContain('customIcon ?');
    expect(info).toContain('<Ionicons');
  });

  it('Product Result Processing Level uses ResultNovaMarkIcon in both paths and never maps NOVA 3 to build', () => {
    const result = fs.readFileSync(path.join(REPO, 'app/result/[barcode].tsx'), 'utf8');
    const helper = fs.readFileSync(path.join(REPO, 'src/components/icons/ResultNovaMarkIcon.tsx'), 'utf8');
    expect(result).toContain("import ResultNovaMarkIcon from '../../src/components/icons/ResultNovaMarkIcon'");
    expect(result.match(/ResultNovaMarkIcon/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(result).not.toMatch(/novaGroup === 3\s*\?\s*'build'/);
    expect(result).not.toMatch(/\?\s*'build'\s*:/);
    expect(helper).toContain('Nova3PreservedFoodIcon');
    expect(helper).toContain("novaGroup === 1 ? 'leaf'");
    expect(helper).toContain("novaGroup === 2 ? 'create'");
    expect(helper).toContain("'warning'");
    expect(helper).not.toContain("'build'");
  });

  it('preserved-food SVG depicts a jar with a spoon in NOVA 3 orange', () => {
    const icon = fs.readFileSync(path.join(REPO, 'src/components/icons/Nova3PreservedFoodIcon.tsx'), 'utf8');
    expect(icon).toContain("from 'react-native-svg'");
    expect(icon).toContain('#FFA500');
    expect(icon).toContain('jar with spoon');
    expect(icon.toLowerCase()).toMatch(/spoon/);
    expect(icon.toLowerCase()).not.toMatch(/wrench|spanner|build|screwdriver|fast.?food/);
  });
});
