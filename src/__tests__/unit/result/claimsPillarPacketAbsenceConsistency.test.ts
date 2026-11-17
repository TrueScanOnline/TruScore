/**
 * Claims pillar / Packet Claims card — one presentation decision for admitted absence.
 * Founder S12a exception 20261117: read-only packet evidence status on Claims look-through only.
 */

import fs from 'fs';
import path from 'path';
import { packetEvidenceStatusConsumerLine } from '../../../contribution/packetEvidenceStatus';
import { PACKET_ABSENCE_PRODUCT_STATE } from '../../../contribution/resultContributionActions';

const REPO = path.join(__dirname, '../../../..');

describe('Claims pillar packet-absence consistency', () => {
  const helper = fs.readFileSync(
    path.join(REPO, 'src/contribution/packetEvidenceStatus.ts'),
    'utf8'
  );
  const result = fs.readFileSync(path.join(REPO, 'app/result/[barcode].tsx'), 'utf8');
  const lookThrough = fs.readFileSync(
    path.join(REPO, 'src/components/ScoreHighlightsLookThroughModal.tsx'),
    'utf8'
  );
  const device = fs.readFileSync(path.join(REPO, 'src/evidenceAuthority/device.ts'), 'utf8');

  it('reuses one helper for card and Claims pillar surfaces', () => {
    expect(helper).toContain('PACKET_ABSENCE_PRODUCT_STATE');
    expect(helper).toContain("product.rveelPacketAbsenceEstablished === true");
    expect(result).toContain('packetEvidenceStatusConsumerLine');
    expect(result).toContain('packetAbsenceConsumerLine');
    expect(result).toContain('testID="packet-claims-absence-status"');
    expect(result).toContain('packetEvidenceConsumerLine={packetAbsenceConsumerLine}');
    expect(lookThrough).toContain("current.pillar === 'Ethics' && packetEvidenceConsumerLine");
    expect(lookThrough).toContain('testID="claims-pillar-packet-evidence-status"');
    expect(lookThrough).not.toContain('rveelPacketAbsenceEstablished');
  });

  it('keeps the status outside Highlights, prompts, and contribution solicitation', () => {
    expect(lookThrough).toContain('Founder exception 20261117');
    expect(lookThrough).toContain('packetEvidenceStatus');
    const ethicsBlock = lookThrough.slice(
      lookThrough.indexOf("current.pillar === 'Ethics' && packetEvidenceConsumerLine"),
      lookThrough.indexOf('<ScoreHighlightsList')
    );
    expect(ethicsBlock).toContain('packetEvidenceConsumerLine');
    expect(ethicsBlock).not.toContain('onOpenContribution');
    expect(lookThrough).not.toMatch(/Nothing stood out/);
  });

  it('suppresses presentation during administrative publication hold', () => {
    expect(result).toContain('shouldWithholdConsumerPublication(publicationHold)');
    expect(result).toContain('packetAbsenceConsumerLine');
  });

  it('does not invent client admission without an authoritative snapshot', () => {
    expect(device).toContain("reason: 'admitted_without_snapshot'");
    expect(device).toContain("status: 'pending'");
    expect(device).toMatch(/outcome\?\.status === 'admitted' && !snapshot/);
    expect(result).toContain("result.status === 'admitted' && result.snapshot");
    expect(result).toContain('admitted_without_snapshot');
  });

  it('same governed Boolean yields the same principal statement for both surfaces', () => {
    const line = packetEvidenceStatusConsumerLine({
      rveelPacketAbsenceEstablished: true,
      rveelGovernedPacketClaims: [],
      rveelGovernedCertifications: [],
    });
    expect(line).toBe(PACKET_ABSENCE_PRODUCT_STATE);
    expect(line).toBe('No relevant claim or certification was found on the pack.');
  });

  it('does not manufacture empty Highlights for other pillars', () => {
    expect(lookThrough).toContain("current.pillar === 'Ethics'");
    expect(lookThrough).not.toMatch(/pillar === 'Body' && packetEvidence/);
    expect(lookThrough).not.toMatch(/pillar === 'Planet' && packetEvidence/);
    expect(lookThrough).not.toMatch(/pillar === 'Openness' && packetEvidence/);
  });
});
