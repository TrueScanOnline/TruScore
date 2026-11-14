/**
 * FM-03 — Claims pillar packet-absence entry uses existing EA journey; no parallel scoring.
 */

import fs from 'fs';
import path from 'path';
import { CLAIMS_PACKET_ABSENCE_PILLAR_LABEL } from '../../../lib/scoreHighlights/highlightContributionLinks';

const REPO = path.join(__dirname, '../../../..');

describe('FM-03 Claims packet-absence pillar entry', () => {
  it('uses the exact founder button wording', () => {
    expect(CLAIMS_PACKET_ABSENCE_PILLAR_LABEL).toBe('There are no claims on the packet');
  });

  it('wires Result → PacketContributionModal with packet_absence entryIntent', () => {
    const result = fs.readFileSync(path.join(REPO, 'app/result/[barcode].tsx'), 'utf8');
    const modal = fs.readFileSync(path.join(REPO, 'src/components/PacketContributionModal.tsx'), 'utf8');
    const lookThrough = fs.readFileSync(
      path.join(REPO, 'src/components/ScoreHighlightsLookThroughModal.tsx'),
      'utf8'
    );

    expect(result).toContain("setContributionEntryIntent");
    expect(result).toContain("'packet_absence'");
    expect(result).toContain('entryIntent={contributionEntryIntent}');
    expect(result).toContain('link.entryIntent');
    expect(modal).toContain("entryIntent?: 'default' | 'packet_absence'");
    expect(modal).toContain("preferCaptureForAbsence = entryIntentRef.current === 'packet_absence'");
    expect(modal).toContain('Opening alone must not select or admit absence');
    expect(lookThrough).toContain("link.kind === 'absence'");
    expect(lookThrough).toContain('contributeButtonSecondary');
  });

  it('does not hardcode Claims score 15 in the pillar entry UI path', () => {
    const links = fs.readFileSync(
      path.join(REPO, 'src/lib/scoreHighlights/highlightContributionLinks.ts'),
      'utf8'
    );
    const lookThrough = fs.readFileSync(
      path.join(REPO, 'src/components/ScoreHighlightsLookThroughModal.tsx'),
      'utf8'
    );
    expect(links).not.toMatch(/\b15\b/);
    expect(lookThrough).not.toMatch(/publishedScore\s*=\s*15|Claims.*15\/25/);
  });
});
