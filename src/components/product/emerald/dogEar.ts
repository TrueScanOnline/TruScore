/**
 * Shared top-right peel for the product hero and the four Rveel Score pillars.
 * Geometry only — each surface keeps its own colours.
 */

export const DOG_EAR_FOLD = 46;

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

export function dogEarCut(width: number, height: number, radius: number, fold: number = DOG_EAR_FOLD) {
  return {
    fold,
    cutX: Math.max(radius, width - fold),
    cutY: Math.min(height - radius, fold),
    face: dogEarCutFace(width, height, radius, fold),
    flap: dogEarFlap(fold),
    cast: dogEarCast(fold),
    crease: `M${n(Math.max(radius, width - fold))} 0 L${n(width)} ${n(Math.min(height - radius, fold))}`,
  };
}
