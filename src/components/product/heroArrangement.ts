export type HeroArrangementInput = {
  cardWidth: number;
  fontScale: number;
  pad: number;
  gap: number;
  photoWidth: number;
  photoHeight: number;
  photoMinWidth: number;
  textMin: number;
  stackFontScale: number;
};

export type HeroArrangement = {
  stack: boolean;
  photoW: number;
  photoH: number;
  textW: number;
};

/**
 * Ordinary phones keep the reference photo beside the name.
 * Narrow cards shrink the photo toward its minimum, then stack.
 * Enlarged system text stacks as well. Text itself is never shrunk.
 */
export function heroArrangement(input: HeroArrangementInput): HeroArrangement {
  const inner = Math.max(0, input.cardWidth - input.pad * 2);
  let photoW = input.photoWidth;
  let textW = inner - input.gap - photoW;
  if (textW < input.textMin) {
    photoW = Math.min(input.photoWidth, Math.max(input.photoMinWidth, inner - input.gap - input.textMin));
    textW = inner - input.gap - photoW;
  }
  // Android can report a 1.3 font scale as 1.29999995, which misses a raw >= 1.3 check.
  const stack =
    Math.round(input.fontScale * 100) >= Math.round(input.stackFontScale * 100) || textW < input.textMin - 0.5;
  if (stack) {
    photoW = Math.min(input.photoWidth, inner);
    textW = inner;
  }
  const photoH = input.photoHeight * (photoW / input.photoWidth);
  return { stack, photoW, photoH, textW };
}
