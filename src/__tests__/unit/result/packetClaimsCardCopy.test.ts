import {
  PACKET_CLAIMS_EMPTY_STATE,
  PACKET_CLAIMS_MORE_INFORMATION,
  packetClaimsCardShowsEmptyState,
} from '../../../components/packetClaimsCardCopy';

describe('packet claims card consumer copy', () => {
  it('shows the empty sentence only when the card has nothing to display', () => {
    expect(PACKET_CLAIMS_EMPTY_STATE).toBe(
      'This product does not currently have any claims that we can find. If there are any stated on the packet, you can add them now.'
    );
    expect(PACKET_CLAIMS_MORE_INFORMATION).toContain('Packet claims are claims made by the manufacturer');
    expect(
      packetClaimsCardShowsEmptyState({
        recognisedMarkCount: 0,
        certificationLineCount: 0,
        claimLineCount: 0,
        absenceEstablished: false,
      })
    ).toBe(true);
    expect(
      packetClaimsCardShowsEmptyState({
        recognisedMarkCount: 1,
        certificationLineCount: 0,
        claimLineCount: 0,
        absenceEstablished: false,
      })
    ).toBe(false);
    expect(
      packetClaimsCardShowsEmptyState({
        recognisedMarkCount: 0,
        certificationLineCount: 1,
        claimLineCount: 0,
        absenceEstablished: false,
      })
    ).toBe(false);
    expect(
      packetClaimsCardShowsEmptyState({
        recognisedMarkCount: 0,
        certificationLineCount: 0,
        claimLineCount: 1,
        absenceEstablished: false,
      })
    ).toBe(false);
    expect(
      packetClaimsCardShowsEmptyState({
        recognisedMarkCount: 0,
        certificationLineCount: 0,
        claimLineCount: 0,
        absenceEstablished: true,
      })
    ).toBe(false);
  });
});
