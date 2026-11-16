import {
  formatWeight,
  formatVolume,
  formatServingSize,
  formatNonZeroDisplayNumber,
  approximateGramsFromImperialWeightLabel,
  millilitersToUsFluidOunces,
  usFluidOuncesToMilliliters,
} from '../../../utils/units';

describe('nutrition display units formatting', () => {
  test('zero stays zero', () => {
    expect(formatNonZeroDisplayNumber(0)).toBe('0');
    expect(formatWeight(0, 'metric')).toBe('0 g');
    expect(formatWeight(0, 'imperial')).toBe('0 oz');
    expect(formatVolume(0, 'metric')).toBe('0 mL');
    expect(formatVolume(0, 'imperial')).toBe('0 US fl oz');
  });

  test('trace nonzero grams do not display as 0 oz after imperial conversion', () => {
    const label = formatWeight(0.1, 'imperial'); // ~0.0035 oz
    expect(label).not.toMatch(/^0(\.0+)?\s*oz$/i);
    expect(label).toMatch(/oz$/i);
    expect(label.includes('<') || parseFloat(label) > 0).toBe(true);
  });

  test('trace nonzero millilitres do not display as 0 US fl oz', () => {
    const label = formatVolume(0.05, 'imperial');
    expect(label).not.toMatch(/^0(\.0+)?\s*US fl oz$/i);
    expect(label).toMatch(/US fl oz$/i);
  });

  test('metric small nonzero grams remain visible', () => {
    expect(formatWeight(0.01, 'metric')).toBe('0.01 g');
    expect(formatWeight(0.001, 'metric')).not.toMatch(/^0 g$/);
  });

  test('serving descriptions preserve multipliers when converting', () => {
    expect(formatServingSize('2 × 30 g', 'imperial')).toMatch(/^2 × .+ oz$/);
    expect(formatServingSize('2 x 30 g', 'metric')).toBe('2 x 30 g');
    expect(formatServingSize('1 serving (25 g)', 'imperial')).toMatch(/oz/);
    expect(formatServingSize('2 × 30 g', 'imperial')).not.toMatch(/\bpt\b/i);
  });

  test('liquid imperial uses US fl oz and never ambiguous pints', () => {
    const large = formatVolume(500, 'imperial');
    expect(large).toMatch(/US fl oz$/);
    expect(large).not.toMatch(/\bpt\b/i);
    expect(formatServingSize('500 ml', 'imperial')).toMatch(/US fl oz/);
    expect(formatServingSize('500 ml', 'imperial')).not.toMatch(/\bpt\b/i);
  });

  test('US fl oz round-trip approximates millilitres', () => {
    const ml = 100;
    const flOz = millilitersToUsFluidOunces(ml);
    expect(Math.abs(usFluidOuncesToMilliliters(flOz) - ml)).toBeLessThan(1e-9);
  });

  test('imperial weight label round-trips approximately for ordinary amounts', () => {
    const label = formatWeight(28.35, 'imperial'); // ~1 oz
    const back = approximateGramsFromImperialWeightLabel(label);
    expect(back).not.toBeNull();
    expect(Math.abs(back! - 28.35)).toBeLessThan(0.2);
  });

  test('unrecognised serving text is left unchanged', () => {
    expect(formatServingSize('one biscuit', 'imperial')).toBe('one biscuit');
  });
});
