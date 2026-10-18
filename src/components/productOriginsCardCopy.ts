/**
 * Consumer copy for the Product Origins card.
 * This does not select, admit, or score origins.
 */

export const PRODUCT_ORIGINS_EMPTY_STATE =
  'This product does not currently have any product origins that we can find. If there are any stated on the packet, you can add them now.';

export const PRODUCT_ORIGINS_MORE_INFORMATION =
  'Product origins are claims or statements made by the manufacturer that are usually printed on the packaging to show where their product is made, or where the ingredients are sourced. If there are details stated on the packaging then please enter them for everyone to see.';

/** True only when the card would otherwise show no source country and no governed origin line. */
export function productOriginsCardShowsEmptyState(input: {
  offCountry: string | null;
  consumerLineCount: number;
}): boolean {
  return !input.offCountry && input.consumerLineCount === 0;
}
