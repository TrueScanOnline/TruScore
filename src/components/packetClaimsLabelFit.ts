/**
 * Shared size for Packet Claims labels on the product card.
 * Display only: this does not select or score a claim.
 */

/** The label size already used on the product card. Fitted text must not grow past it. */
export const PACKET_CLAIM_LABEL_MAX_FONT_SIZE = 22;

const LINE_HEIGHT_RATIO = 28 / 22;

export function packetClaimLabelLineHeight(fontSize: number): number {
  return Math.round(fontSize * LINE_HEIGHT_RATIO);
}

/**
 * One size for every label. It stays at the current card size when every label
 * fits on one line, and shrinks only as far as the longest label needs.
 */
export function packetClaimLabelFontSize(input: {
  contentWidth: number;
  maxFontSize?: number;
  lines: { textWidthAtMax: number; reservedWidth: number }[];
}): number {
  const maxFontSize = input.maxFontSize ?? PACKET_CLAIM_LABEL_MAX_FONT_SIZE;
  if (!(input.contentWidth > 0) || input.lines.length === 0) return maxFontSize;
  let size = maxFontSize;
  for (const line of input.lines) {
    const available = input.contentWidth - line.reservedWidth;
    if (!(line.textWidthAtMax > 0) || !(available > 0)) continue;
    if (line.textWidthAtMax <= available) continue;
    size = Math.min(size, ((available - 1) / line.textWidthAtMax) * maxFontSize);
  }
  const fitted = Math.floor(size * 10) / 10;
  return Math.min(maxFontSize, fitted);
}
