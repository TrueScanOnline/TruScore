/**
 * The words that travel with a share.
 * The coloured card carries the layout. This caption is the tappable path back.
 */

export function buildReceiverCaption(input: {
  note?: string;
  productName: string;
  section: string;
  summary?: string;
  url?: string;
  includeSummary: boolean;
}): string {
  const lines: string[] = [];
  const note = input.note?.trim();
  if (note) lines.push(note, '');
  lines.push(input.productName.trim() || 'This product');
  lines.push(input.section.trim() || 'Rveel');
  const summary = input.summary?.trim();
  if (input.includeSummary && summary) lines.push('', summary);
  const url = input.url?.trim();
  if (url) lines.push('', 'Open in Rveel', url);
  return lines.join('\n');
}
