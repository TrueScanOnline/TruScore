/**
 * FM-02 — pillar look-through drops Change, but Result card correction workflows remain.
 */

import fs from 'fs';
import path from 'path';

const REPO = path.join(__dirname, '../../../..');
const RESULT = path.join(REPO, 'app/result/[barcode].tsx');
const LINKS = path.join(REPO, 'src/lib/scoreHighlights/highlightContributionLinks.ts');

describe('FM-02 card correction paths remain', () => {
  const result = fs.readFileSync(RESULT, 'utf8');
  const links = fs.readFileSync(LINKS, 'utf8');

  it('keeps Result card Change/Edit openContribution journeys', () => {
    expect(result).toContain("openContribution('nutrition', 'change', true)");
    expect(result).toContain("openContribution('ingredients', 'change', true)");
    expect(result).toContain("openContribution('packetClaims', 'change', true)");
    expect(result).toContain("openContribution('origins', 'change', true)");
  });

  it('pillar offer source no longer emits Change labels', () => {
    expect(links).not.toContain('CHANGE_NUTRITION');
    expect(links).not.toContain('CHANGE_INGREDIENTS');
    expect(links).not.toContain('CHANGE_PACKET_INFORMATION');
    expect(links).not.toContain('CHANGE_PRODUCT_ORIGINS');
    expect(links).toContain('Never offer Change');
  });
});
