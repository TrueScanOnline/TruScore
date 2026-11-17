/**
 * Shared Packet Claims / Claims-pillar absence presentation — governed projection only.
 */

import {
  PACKET_ABSENCE_ATTRIBUTION,
  packetEvidenceStatus,
  packetEvidenceStatusConsumerLine,
} from '../../../contribution/packetEvidenceStatus';
import { PACKET_ABSENCE_PRODUCT_STATE } from '../../../contribution/resultContributionActions';

describe('packetEvidenceStatus', () => {
  it('shows the principal absence line only when the product Boolean is true', () => {
    expect(
      packetEvidenceStatus({
        rveelPacketAbsenceEstablished: true,
        rveelGovernedPacketClaims: [],
        rveelGovernedCertifications: [],
      })
    ).toEqual({
      kind: 'absence_established',
      consumerCopy: PACKET_ABSENCE_PRODUCT_STATE,
    });
    expect(
      packetEvidenceStatusConsumerLine({
        rveelPacketAbsenceEstablished: true,
        rveelGovernedPacketClaims: [],
        rveelGovernedCertifications: [],
      })
    ).toBe('No relevant claim or certification was found on the pack.');
  });

  it('never infers absence from empty claims, score silence, or missing Boolean', () => {
    expect(
      packetEvidenceStatus({
        rveelPacketAbsenceEstablished: false,
        rveelGovernedPacketClaims: [],
        rveelGovernedCertifications: [],
      }).kind
    ).toBe('none');
    expect(
      packetEvidenceStatus({
        rveelGovernedPacketClaims: [],
        rveelGovernedCertifications: [],
      } as any).kind
    ).toBe('none');
    expect(packetEvidenceStatus(null).kind).toBe('none');
    expect(packetEvidenceStatusConsumerLine(undefined)).toBeNull();
  });

  it('reports positive governed packet evidence without inventing absence', () => {
    expect(
      packetEvidenceStatus({
        rveelPacketAbsenceEstablished: false,
        rveelGovernedPacketClaims: [{ exactWording: 'Gluten Free' } as any],
        rveelGovernedCertifications: [],
      })
    ).toEqual({ kind: 'positive_governed', claimCount: 1, certificationCount: 0 });
  });

  it('keeps attribution distinct from scoring language', () => {
    expect(PACKET_ABSENCE_ATTRIBUTION).toContain('Admitted contributor');
    expect(PACKET_ABSENCE_ATTRIBUTION.toLowerCase()).not.toContain('score');
    expect(PACKET_ABSENCE_ATTRIBUTION.toLowerCase()).not.toContain('bonus');
    expect(PACKET_ABSENCE_ATTRIBUTION).toContain('Not independently verified');
  });
});
