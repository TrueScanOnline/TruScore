/**
 * Result publication latch helper — network/offline reruns for the same barcode
 * must not undo an already settled successful consumer publication.
 */

export function shouldPreserveSettledResultOnLoadMiss(params: {
  publicationSettled: boolean;
  settledBarcode: string | null | undefined;
  requestBarcode: string;
}): boolean {
  return (
    params.publicationSettled === true &&
    typeof params.settledBarcode === 'string' &&
    params.settledBarcode.length > 0 &&
    params.settledBarcode === params.requestBarcode
  );
}
