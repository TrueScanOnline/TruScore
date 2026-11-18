import { packetClaimsShareRows, packetClaimsShareText } from '../../../components/shareCardRows';
import { ShareContentBuilder } from '../../../features/sharing/services/ShareContentBuilder';
import { shareStoryHeading } from '../../../components/shareStoryHeading';
import { PACKET_CLAIMS_EMPTY_STATE } from '../../../components/packetClaimsCardCopy';
import { PACKET_ABSENCE_PRODUCT_STATE } from '../../../contribution/resultContributionActions';
import type { Product } from '../../../types/product';

describe('Packet Claims share (CF-03)', () => {
  it('shares governed claim lines without inventing content', () => {
    const product = {
      barcode: '9300652817232',
      product_name: 'Fixture',
      rveelGovernedPacketClaims: [
        { exactWording: 'High Fibre', evidenceId: 'a' },
        { exactWording: 'Low sugar', evidenceId: 'b' },
      ],
      rveelGovernedCertifications: [],
      certifications: [],
    } as Product;
    expect(packetClaimsShareText(product)).toContain('High Fibre');
    expect(packetClaimsShareText(product)).toContain('Low sugar');
    expect(shareStoryHeading('packetClaims')).toBe('Packet Claims');
    const content = ShareContentBuilder.buildContent({
      product: product as never,
      item: 'packetClaims',
    });
    expect(content.title).toMatch(/Packet Claims/);
    expect(content.message).toContain('High Fibre');
  });

  it('uses empty-state and absence copy from the Result card projection', () => {
    const empty = { barcode: '1', certifications: [], rveelGovernedPacketClaims: [] } as Product;
    expect(packetClaimsShareRows(empty)[0]).toEqual({ kind: 'text', text: PACKET_CLAIMS_EMPTY_STATE });
    const absence = {
      barcode: '1',
      certifications: [],
      rveelGovernedPacketClaims: [],
      rveelPacketAbsenceEstablished: true,
    } as Product;
    expect(packetClaimsShareText(absence)).toBe(PACKET_ABSENCE_PRODUCT_STATE);
  });
});
