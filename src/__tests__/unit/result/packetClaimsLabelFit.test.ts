import {
  PACKET_CLAIM_LABEL_EM,
  PACKET_CLAIM_LABEL_MAX_FONT_SIZE,
  packetClaimLabelFontSize,
} from '../../../components/packetClaimsLabelFit';

const LONG_CLAIM = 'ABA Seedling — Commercial Compostable';

describe('packet claim label fit', () => {
  it('keeps the current card size when every label fits on one line', () => {
    expect(
      packetClaimLabelFontSize({
        contentWidth: 320,
        lines: [
          { letterCount: 'Rainforest Alliance'.length, reservedWidth: 50 },
          { letterCount: 'Organic'.length, reservedWidth: 0 },
        ],
      })
    ).toBe(PACKET_CLAIM_LABEL_MAX_FONT_SIZE);
  });

  it('shrinks every label to the longest claim so the full wording fits on one line', () => {
    const size = packetClaimLabelFontSize({
      contentWidth: 300,
      lines: [
        { letterCount: 'Rainforest Alliance'.length, reservedWidth: 50 },
        { letterCount: LONG_CLAIM.length, reservedWidth: 0 },
      ],
    });
    const available = 300 - 8;
    const expected = Math.floor((available / (LONG_CLAIM.length * PACKET_CLAIM_LABEL_EM)) * 10) / 10;
    expect(size).toBe(expected);
    expect(size).toBeLessThan(PACKET_CLAIM_LABEL_MAX_FONT_SIZE);
    expect(size * PACKET_CLAIM_LABEL_EM * LONG_CLAIM.length).toBeLessThanOrEqual(available);
  });

  it('does not grow past the current card size', () => {
    expect(
      packetClaimLabelFontSize({
        contentWidth: 400,
        maxFontSize: 22,
        lines: [{ letterCount: 4, reservedWidth: 0 }],
      })
    ).toBe(22);
  });
});
