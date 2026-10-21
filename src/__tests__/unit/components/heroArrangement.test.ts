import { heroArrangement } from '../../../components/product/heroArrangement';

const reference = {
  pad: 14,
  gap: 15,
  photoWidth: 144,
  photoHeight: 170,
  photoMinWidth: 112,
  textMin: 150,
  stackFontScale: 1.3,
};

describe('heroArrangement', () => {
  it('keeps the 144-wide photo beside the name on a 358-wide card', () => {
    const laid = heroArrangement({ ...reference, cardWidth: 358, fontScale: 1 });
    expect(laid.stack).toBe(false);
    expect(laid.photoW).toBe(144);
    expect(laid.photoH).toBe(170);
    expect(laid.textW).toBe(358 - 28 - 15 - 144);
  });

  it('narrows the photo toward 112 before stacking', () => {
    const laid = heroArrangement({ ...reference, cardWidth: 320, fontScale: 1 });
    expect(laid.stack).toBe(false);
    expect(laid.photoW).toBeLessThan(144);
    expect(laid.photoW).toBeGreaterThanOrEqual(112);
    expect(laid.textW).toBeGreaterThanOrEqual(150);
  });

  it('stacks when the text column would fall below 150', () => {
    const laid = heroArrangement({ ...reference, cardWidth: 280, fontScale: 1 });
    expect(laid.stack).toBe(true);
    expect(laid.photoW).toBeLessThanOrEqual(144);
  });

  it('stacks enlarged system text without shrinking the type', () => {
    const laid = heroArrangement({ ...reference, cardWidth: 358, fontScale: 1.3 });
    expect(laid.stack).toBe(true);
    expect(laid.photoW).toBe(144);
  });

  it('stacks the Android 1.3 font scale that arrives just under 1.3', () => {
    const laid = heroArrangement({ ...reference, cardWidth: 358, fontScale: 1.29999995 });
    expect(laid.stack).toBe(true);
  });
});
