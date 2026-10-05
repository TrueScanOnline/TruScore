/** True when a JPEG still carries an Exif APP1 segment. GPS lives inside that segment. */
export function jpegContainsExif(bytes: Uint8Array): boolean {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return false;
  let offset = 2;
  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) return false;
    const marker = bytes[offset + 1];
    if (marker === 0xda || marker === 0xd9) return false;
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (length < 2 || offset + 2 + length > bytes.length) return false;
    if (marker === 0xe1) {
      const start = offset + 4;
      const header = String.fromCharCode(...bytes.subarray(start, Math.min(start + 6, bytes.length)));
      if (header.startsWith('Exif')) return true;
    }
    offset += 2 + length;
  }
  return false;
}

/** Uniform fit. Never crops. */
export function fittedLongEdge(
  width: number,
  height: number,
  maxLongEdgePx: number
): { width: number; height: number } {
  const safeWidth = Math.max(1, Math.round(width));
  const safeHeight = Math.max(1, Math.round(height));
  const longEdge = Math.max(safeWidth, safeHeight);
  if (longEdge <= maxLongEdgePx) return { width: safeWidth, height: safeHeight };
  const scale = maxLongEdgePx / longEdge;
  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale)),
  };
}
