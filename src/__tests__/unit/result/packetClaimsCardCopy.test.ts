import {
  PACKET_CLAIMS_EMPTY_STATE,
  PACKET_CLAIMS_MORE_INFORMATION,
  displayedPacketSubjectKey,
  packetClaimsCardShowsAddAction,
  packetClaimsCardShowsEmptyState,
  packetClaimsCardShowsLimitedConfidenceBadge,
  packetClaimsRecognisedMarks,
  packetLineWithdrawn,
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

  it('shows the empty-card Add CTA only when empty and a menu Add row exists', () => {
    expect(
      packetClaimsCardShowsAddAction({ showEmptyState: true, hasAddPacketMenuRow: true })
    ).toBe(true);
    expect(
      packetClaimsCardShowsAddAction({ showEmptyState: true, hasAddPacketMenuRow: false })
    ).toBe(false);
    expect(
      packetClaimsCardShowsAddAction({ showEmptyState: false, hasAddPacketMenuRow: true })
    ).toBe(false);
  });

  it('hides Limited confidence chrome only for an admitted packet absence', () => {
    expect(
      packetClaimsCardShowsLimitedConfidenceBadge({
        absenceEstablished: true,
        confidenceReasonCode: 'claims_primary_contribution_limited',
      })
    ).toBe(false);
    expect(
      packetClaimsCardShowsLimitedConfidenceBadge({
        absenceEstablished: false,
        confidenceReasonCode: 'claims_primary_contribution_limited',
      })
    ).toBe(true);
    expect(
      packetClaimsCardShowsLimitedConfidenceBadge({
        absenceEstablished: true,
        confidenceReasonCode: undefined,
      })
    ).toBe(false);
    expect(
      packetClaimsCardShowsLimitedConfidenceBadge({
        absenceEstablished: false,
        confidenceReasonCode: 'other',
      })
    ).toBe(false);
  });

  it('drops a removed packet certification badge when the product source does not list it', () => {
    const biodynamic = { id: 'en:biodynamic', tag: 'en:biodynamic', name: 'Biodynamic' };
    const fairtrade = { id: 'en:fair-trade', tag: 'en:fair-trade', name: 'Fairtrade' };
    expect(
      packetClaimsRecognisedMarks({
        marks: [biodynamic, fairtrade],
        labelHierarchy: [],
        governedCertificationNames: [],
      }).map((mark) => mark.name)
    ).toEqual(['Fairtrade']);
    expect(
      packetClaimsRecognisedMarks({
        marks: [biodynamic],
        labelHierarchy: ['en:biodynamic'],
        governedCertificationNames: [],
      })
    ).toEqual([biodynamic]);
    expect(
      packetClaimsRecognisedMarks({
        marks: [biodynamic],
        labelHierarchy: [],
        governedCertificationNames: ['Demeter biodynamic — Australia'],
      })
    ).toEqual([biodynamic]);
  });

  it('hides a source mark after that subject has been withdrawn', () => {
    const rainforest = { id: 'en:rainforest-alliance', name: 'Rainforest Alliance', tag: 'en:rainforest-alliance' };
    const key = displayedPacketSubjectKey('certification', 'Rainforest Alliance');
    expect(key).toBeTruthy();
    expect(packetLineWithdrawn('certification', 'Rainforest Alliance', key ? [key] : [])).toBe(true);
    expect(
      packetClaimsRecognisedMarks({
        marks: [rainforest],
        labelHierarchy: ['en:rainforest-alliance'],
        governedCertificationNames: [],
        withdrawnSubjectKeys: key ? [key] : [],
      })
    ).toEqual([]);
    expect(
      packetClaimsRecognisedMarks({
        marks: [rainforest],
        labelHierarchy: ['en:rainforest-alliance'],
        governedCertificationNames: [],
      }).map((mark) => mark.name)
    ).toEqual(['Rainforest Alliance']);
  });
});
