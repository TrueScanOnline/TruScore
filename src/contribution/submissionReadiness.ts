/**
 * A reviewed structured unit is ready to send when its source can be finalised now.
 * An evidence photo that is still preparing stays on its own recovery path and does not hold the text.
 * Packet absence still cites the photograph, because that affirmation is about the pack image.
 */

export type SubmissionPhoto = {
  assetId: string;
  imagePhase?: string;
  remoteAssetId?: string;
};

export function photoCanBeCited(photo: SubmissionPhoto): boolean {
  return photo.imagePhase === 'available' && !!photo.remoteAssetId;
}

export function reviewedUnitSupport(input: {
  unitId: string;
  packetAbsence: boolean;
  photos: SubmissionPhoto[];
}): { sourceAssetId: string; companionSourceAssetIds?: string[] } {
  const primary = input.photos[0];
  if (input.packetAbsence && primary) {
    return { sourceAssetId: primary.assetId };
  }
  const ready = input.photos.filter(photoCanBeCited);
  if (ready.length > 0) {
    return {
      sourceAssetId: ready[0].assetId,
      ...(ready.length > 1 ? { companionSourceAssetIds: ready.slice(1).map((photo) => photo.assetId) } : {}),
    };
  }
  return { sourceAssetId: `manual-text:${input.unitId}` };
}
