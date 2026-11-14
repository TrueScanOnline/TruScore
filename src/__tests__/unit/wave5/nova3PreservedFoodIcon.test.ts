/**
 * FM-01 — NOVA 3 uses a preserved-food pictogram, not the Ionicons wrench.
 */

import fs from 'fs';
import path from 'path';

const REPO = path.join(__dirname, '../../../..');

describe('FM-01 NOVA 3 preserved-food icon', () => {
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

  it('preserved-food SVG uses react-native-svg and NOVA 3 orange', () => {
    const icon = fs.readFileSync(path.join(REPO, 'src/components/icons/Nova3PreservedFoodIcon.tsx'), 'utf8');
    expect(icon).toContain("from 'react-native-svg'");
    expect(icon).toContain('#FFA500');
    expect(icon).toContain('Preserved food');
    expect(icon.toLowerCase()).not.toMatch(/wrench|spanner|build|fast.?food|warning/);
  });
});
