/**
 * FM-03R — Claims pillar photo-free packet-absence attestation entry.
 * Prior FM-03 photo journey wiring remains in PacketContributionModal but is not
 * invoked from the Claims pillar absence action.
 */

import fs from 'fs';
import path from 'path';
import { CLAIMS_PACKET_ABSENCE_PILLAR_LABEL } from '../../../lib/scoreHighlights/highlightContributionLinks';

const REPO = path.join(__dirname, '../../../..');

describe('FM-03R Claims packet-absence direct attestation entry', () => {
  it('uses the exact founder button wording', () => {
    expect(CLAIMS_PACKET_ABSENCE_PILLAR_LABEL).toBe('There are no claims on the packet');
  });

  it('wires Result to submitClaimsAbsenceAttestation without opening capture', () => {
    const result = fs.readFileSync(path.join(REPO, 'app/result/[barcode].tsx'), 'utf8');
    const links = fs.readFileSync(
      path.join(REPO, 'src/lib/scoreHighlights/highlightContributionLinks.ts'),
      'utf8'
    );
    const lookThrough = fs.readFileSync(
      path.join(REPO, 'src/components/ScoreHighlightsLookThroughModal.tsx'),
      'utf8'
    );
    const device = fs.readFileSync(path.join(REPO, 'src/evidenceAuthority/device.ts'), 'utf8');

    expect(links).toContain("entryIntent: 'claims_absence_attestation'");
    expect(result).toContain('submitClaimsAbsenceAttestation');
    expect(result).toContain('submitClaimsAbsenceAttestationFromPillar');
    expect(result).toContain("link.entryIntent === 'claims_absence_attestation'");
    expect(result).not.toContain("link.entryIntent === 'packet_absence' ? 'packet_absence'");
    expect(device).toContain('export async function submitClaimsAbsenceAttestation');
    expect(device).toContain("action: 'finalize-packet-absence-attestation'");
    expect(lookThrough).toContain('Submitting your confirmation…');
    expect(lookThrough).toContain("link.kind === 'absence'");
    expect(lookThrough).toContain('contributeButtonSecondary');
  });

  it('keeps FM-03R pillar photo-free while restoring guided FM-03 photo entry', () => {
    const modal = fs.readFileSync(path.join(REPO, 'src/components/PacketContributionModal.tsx'), 'utf8');
    const result = fs.readFileSync(path.join(REPO, 'app/result/[barcode].tsx'), 'utf8');
    expect(modal).toContain("entryIntent?: 'default' | 'packet_absence'");
    expect(modal).toContain("preferCaptureForAbsence = entryIntentRef.current === 'packet_absence'");
    expect(modal).toContain('Opening alone must not select or admit absence');
    // Claims pillar absence action remains photo-free FM-03R (attestation).
    expect(result).not.toContain("link.entryIntent === 'packet_absence' ? 'packet_absence'");
    // Founder 2026-11-18 restore: photo-supported FM-03 is consumer-reachable again via guided modal.
    expect(result).toContain('result-packet-fm03-photo-absence');
    expect(result).toContain("openContribution('packetClaims', 'add', false, 'packet_absence')");
    expect(result).toContain('isGuidedContributionSubmitEnabled()');
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
