/**
 * Shared top-right peel for the product hero and the four Rveel Score pillars.
 * Geometry only — each surface keeps its own colours.
 *
 * One rounded lifted-paper silhouette is used on both surfaces so the folds
 * read as the same visual system.
 */

export const DOG_EAR_FOLD = 46;

function n(value: number) {
  return (Math.round(value * 10) / 10).toString();
}

/**
 * Rounded flap whose free tip follows the card corner radius.
 * Local coordinates: attachment at 0,0; +x right; +y down.
 */
export function dogEarFlap(fold: number = DOG_EAR_FOLD, cornerRadius: number = 22) {
  const r = Math.min(Math.max(cornerRadius * 0.9, 14), fold * 0.48);
  return [
    'M0 0',
    `H${n(fold - r)}`,
    `A${n(r)} ${n(r)} 0 0 1 ${n(fold)} ${n(r)}`,
    `V${n(fold - r * 0.35)}`,
    `Q${n(fold * 0.78)} ${n(fold * 0.98)} ${n(fold * 0.42)} ${n(fold * 0.9)}`,
    `C${n(0.22 * fold)} ${n(0.82 * fold)} ${n(0.08 * fold)} ${n(0.52 * fold)} 0 0`,
    'Z',
  ].join(' ');
}

/** @deprecated Alias kept for existing pillar call sites during the unified fold. */
export function dogEarFlapPillar(fold: number = DOG_EAR_FOLD, cornerRadius: number = 22) {
  return dogEarFlap(fold, cornerRadius);
}

/** Rounded face with the top-right corner cut on a soft peel diagonal. */
export function dogEarCutFace(
  width: number,
  height: number,
  radius: number,
  fold: number = DOG_EAR_FOLD
) {
  const cutX = Math.max(radius, width - fold);
  const cutY = Math.min(height - radius, fold);
  const r = Math.min(radius, fold * 0.48);
  return [
    `M${n(radius)} 0`,
    `H${n(cutX)}`,
    `C${n(cutX + r * 0.55)} ${n(r * 0.08)} ${n(width - r * 0.2)} ${n(cutY - r * 0.55)} ${n(width)} ${n(cutY)}`,
    `V${n(height - radius)}`,
    `A${n(radius)} ${n(radius)} 0 0 1 ${n(width - radius)} ${n(height)}`,
    `H${n(radius)}`,
    `A${n(radius)} ${n(radius)} 0 0 1 0 ${n(height - radius)}`,
    `V${n(radius)}`,
    `A${n(radius)} ${n(radius)} 0 0 1 ${n(radius)} 0`,
    'Z',
  ].join(' ');
}

/** @deprecated Alias kept for existing pillar call sites during the unified fold. */
export function dogEarCutFacePillar(
  width: number,
  height: number,
  radius: number,
  fold: number = DOG_EAR_FOLD
) {
  return dogEarCutFace(width, height, radius, fold);
}

/** Soft cast under the flap along the peel diagonal. */
export function dogEarCast(fold: number = DOG_EAR_FOLD) {
  return [
    'M0 0',
    `L${n(fold)} ${n(fold * 0.92)}`,
    `L${n(0.55 * fold)} ${n(1.05 * fold)}`,
    `L${n(-0.06 * fold)} ${n(0.48 * fold)}`,
    'Z',
  ].join(' ');
}

/** @deprecated Alias kept for existing pillar call sites during the unified fold. */
export function dogEarCastPillar(fold: number = DOG_EAR_FOLD) {
  return dogEarCast(fold);
}

export function dogEarCut(
  width: number,
  height: number,
  radius: number,
  fold: number = DOG_EAR_FOLD
) {
  const cutX = Math.max(radius, width - fold);
  const cutY = Math.min(height - radius, fold);
  return {
    fold,
    cutX,
    cutY,
    face: dogEarCutFace(width, height, radius, fold),
    flap: dogEarFlap(fold, radius),
    cast: dogEarCast(fold),
    crease: `M${n(cutX)} 0 C${n(cutX + fold * 0.42)} ${n(fold * 0.06)} ${n(width - radius * 0.18)} ${n(cutY - fold * 0.28)} ${n(width)} ${n(cutY)}`,
  };
}
