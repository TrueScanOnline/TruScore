/**
 * Shared top-right peel for the product hero and the four Rveel Score pillars.
 * Geometry only — each surface keeps its own colours.
 *
 * The Hero path is founder-approved. Pillars may request a rounded flap that
 * follows the tile corner radius without changing the Hero silhouette.
 */

export const DOG_EAR_FOLD = 46;

export type DogEarSurface = 'hero' | 'pillar';

function n(value: number) {
  return (Math.round(value * 10) / 10).toString();
}

/** Curled paper flap in the local F×F square (attachment at 0,0 → diagonal to F,F). */
export function dogEarFlap(fold: number = DOG_EAR_FOLD) {
  const x1 = 0.28 * fold;
  const y1 = 0.9 * fold;
  const x2 = 0.02 * fold;
  const y2 = 1.02 * fold;
  return [
    'M0 0',
    `L${n(fold)} ${n(fold)}`,
    `C${n(0.55 * fold)} ${n(0.98 * fold)} ${n(0.36 * fold)} ${n(0.94 * fold)} ${n(x1)} ${n(y1)}`,
    `C${n(0.16 * fold)} ${n(0.86 * fold)} ${n(0.08 * fold)} ${n(y2)} ${n(x2)} ${n(y2)}`,
    `C${n(0.01 * fold)} ${n(0.62 * fold)} 0 ${n(0.22 * fold)} 0 0`,
    'Z',
  ].join(' ');
}

/**
 * Pillar flap: the free tip follows the tile corner radius so the peel reads as
 * the same rounded paper as the card, not a sharp triangle painted on top.
 */
export function dogEarFlapPillar(fold: number = DOG_EAR_FOLD, cornerRadius: number = 22) {
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

/** Rounded face with the top-right corner cut on the peel diagonal. */
export function dogEarCutFace(width: number, height: number, radius: number, fold: number = DOG_EAR_FOLD) {
  const cutX = Math.max(radius, width - fold);
  const cutY = Math.min(height - radius, fold);
  return [
    `M${n(radius)} 0`,
    `H${n(cutX)}`,
    `L${n(width)} ${n(cutY)}`,
    `V${n(height - radius)}`,
    `A${n(radius)} ${n(radius)} 0 0 1 ${n(width - radius)} ${n(height)}`,
    `H${n(radius)}`,
    `A${n(radius)} ${n(radius)} 0 0 1 0 ${n(height - radius)}`,
    `V${n(radius)}`,
    `A${n(radius)} ${n(radius)} 0 0 1 ${n(radius)} 0`,
    'Z',
  ].join(' ');
}

/**
 * Pillar face cut: the peel edge starts after the corner radius and softens into
 * the diagonal so the cutaway matches the rounded tile silhouette.
 */
export function dogEarCutFacePillar(
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

/** Soft cast that sits under the flap along the peel diagonal. */
export function dogEarCast(fold: number = DOG_EAR_FOLD) {
  return [
    'M0 0',
    `L${n(fold)} ${n(fold)}`,
    `L${n(0.62 * fold)} ${n(1.18 * fold)}`,
    `L${n(-0.12 * fold)} ${n(0.58 * fold)}`,
    'Z',
  ].join(' ');
}

/** Pillar cast stays mostly inside the tile so a visible lift is not clipped away. */
export function dogEarCastPillar(fold: number = DOG_EAR_FOLD) {
  return [
    'M0 0',
    `L${n(fold)} ${n(fold * 0.92)}`,
    `L${n(0.55 * fold)} ${n(1.05 * fold)}`,
    `L${n(-0.06 * fold)} ${n(0.48 * fold)}`,
    'Z',
  ].join(' ');
}

export function dogEarCut(
  width: number,
  height: number,
  radius: number,
  fold: number = DOG_EAR_FOLD,
  surface: DogEarSurface = 'hero'
) {
  const cutX = Math.max(radius, width - fold);
  const cutY = Math.min(height - radius, fold);
  if (surface === 'pillar') {
    return {
      fold,
      cutX,
      cutY,
      face: dogEarCutFacePillar(width, height, radius, fold),
      flap: dogEarFlapPillar(fold, radius),
      cast: dogEarCastPillar(fold),
      crease: `M${n(cutX)} 0 C${n(cutX + fold * 0.42)} ${n(fold * 0.06)} ${n(width - radius * 0.18)} ${n(cutY - fold * 0.28)} ${n(width)} ${n(cutY)}`,
    };
  }
  return {
    fold,
    cutX,
    cutY,
    face: dogEarCutFace(width, height, radius, fold),
    flap: dogEarFlap(fold),
    cast: dogEarCast(fold),
    crease: `M${n(cutX)} 0 L${n(width)} ${n(cutY)}`,
  };
}
