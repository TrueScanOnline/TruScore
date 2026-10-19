import { PACKET_CLAIM_LABEL_MAX_FONT_SIZE, packetClaimLabelFontSize } from '../../../components/packetClaimsLabelFit';

describe('packet claim label fit', () => {
  it('keeps the current card size when every label fits on one line', () => {
    expect(
      packetClaimLabelFontSize({
        contentWidth: 320,
        lines: [
          { textWidthAtMax: 180, reservedWidth: 50 },
          { textWidthAtMax: 240, reservedWidth: 0 },
        ],
      })
    ).toBe(PACKET_CLAIM_LABEL_MAX_FONT_SIZE);
  });

  it('uses one smaller size so the longest label stays on one line', () => {
    const size = packetClaimLabelFontSize({
      contentWidth: 300,
      lines: [
        { textWidthAtMax: 160, reservedWidth: 50 },
        { textWidthAtMax: 420, reservedWidth: 0 },
      ],
    });
    expect(size).toBeLessThan(PACKET_CLAIM_LABEL_MAX_FONT_SIZE);
    expect(size).toBe(Math.floor((((300 - 1) / 420) * 22) * 10) / 10);
    expect((size / 22) * 160 + 50).toBeLessThanOrEqual(300);
  });

  it('does not grow past the current card size', () => {
    expect(
      packetClaimLabelFontSize({
        contentWidth: 400,
        maxFontSize: 22,
        lines: [{ textWidthAtMax: 40, reservedWidth: 0 }],
      })
    ).toBe(22);
  });
});
