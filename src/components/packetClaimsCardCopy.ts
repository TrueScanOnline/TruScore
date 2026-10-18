/**
 * Consumer copy for the Packet Claims card.
 * This does not select, admit, or score claims.
 */

export const PACKET_CLAIMS_EMPTY_STATE =
  'This product does not currently have any claims that we can find. If there are any stated on the packet, you can add them now.';

export const PACKET_CLAIMS_MORE_INFORMATION =
  'Packet claims are claims made by the manufacturer that are usually printed on the packaging to help promote their product. If there are claims stated on the packaging then please enter them for everyone to see.';

/** True only when the card would otherwise show no claim, certification, or admitted absence. */
export function packetClaimsCardShowsEmptyState(input: {
  recognisedMarkCount: number;
  certificationLineCount: number;
  claimLineCount: number;
  absenceEstablished: boolean;
}): boolean {
  if (input.absenceEstablished) return false;
  return input.recognisedMarkCount === 0 && input.certificationLineCount === 0 && input.claimLineCount === 0;
}
