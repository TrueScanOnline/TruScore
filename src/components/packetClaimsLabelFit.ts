/**
 * Shared size for Packet Claims labels on the product card.
 * Display only: this does not select or score a claim.
 */

/** The label size already used on the product card. Fitted text must not grow past it. */
export const PACKET_CLAIM_LABEL_MAX_FONT_SIZE = 22;

/**
 * Bold label width, in ems. Large enough that a long claim stays inside the
 * green panel instead of being cut off.
 */
export const PACKET_CLAIM_LABEL_EM = 0.62;

const LINE_HEIGHT_RATIO = 28 / 22;
const FIT_GUTTER = 8;

export function packetClaimLabelLineHeight(fontSize: number): number {
  return Math.round(fontSize * LINE_HEIGHT_RATIO);
}

/**
 * One size for every label. The claim with the most letters, in the narrowest
 * row, sets that size. It never grows past the current card text.
 */
export function packetClaimLabelFontSize(input: {
  contentWidth: number;
  maxFontSize?: number;
  lines: { letterCount: number; reservedWidth: number }[];
}): number {
  const maxFontSize = input.maxFontSize ?? PACKET_CLAIM_LABEL_MAX_FONT_SIZE;
  if (!(input.contentWidth > 0) || input.lines.length === 0) return maxFontSize;
  let size = maxFontSize;
  for (const line of input.lines) {
    const letters = Math.max(0, line.letterCount);
    if (letters === 0) continue;
    const available = input.contentWidth - line.reservedWidth - FIT_GUTTER;
    if (available <= 0) continue;
    size = Math.min(size, available / (letters * PACKET_CLAIM_LABEL_EM));
  }
  const fitted = Math.floor(size * 10) / 10;
  return Math.min(maxFontSize, Math.max(8, fitted));
}
