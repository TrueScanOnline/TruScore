import easJson from '../../../../eas.json';
import manifest from '../../../certifications/artwork/closedPrelaunchManifest.json';
import { selectClosedPrelaunchMark } from '../../../certifications/artwork/closedPrelaunchSelection';

describe('closed pre-launch certification artwork', () => {
  it('shows one authentic mark for an exact non-scoring identity and withholds ordinary wording', () => {
    const vegan = selectClosedPrelaunchMark({
      enabled: true,
      surface: 'product_result',
      productionId: 'vegan.au',
    });
    expect(vegan?.researchId).toBe('vegan.au');
    expect(vegan?.writtenPermission).toBe(false);
    expect(vegan?.sample).toBe(false);
    expect(
      selectClosedPrelaunchMark({ enabled: true, surface: 'product_result', consumerName: 'Vegan certified' })
    ).toBeNull();
    expect(
      selectClosedPrelaunchMark({ enabled: true, surface: 'recognition_example', consumerName: 'organic' })
    ).toBeNull();
    expect(selectClosedPrelaunchMark({ enabled: false, surface: 'recognition_example', productionId: 'vegan.au' })).toBeNull();
  });

  it('does not choose between Fairtrade variants or put a sample mark on a Result', () => {
    expect(manifest.marks.some((mark) => mark.researchId === 'fairtrade.product')).toBe(false);
    const sample = manifest.marks.find((mark) => mark.researchId === 'fsc.mix');
    expect(sample?.sample).toBe(true);
    expect(sample?.surfaces).toEqual(['recognition_example']);
    expect(
      selectClosedPrelaunchMark({ enabled: true, surface: 'product_result', productionId: 'cert.fsc_mix' })
    ).toBeNull();
  });

  it('keeps the public store profiles off the visual UAT gate', () => {
    const profiles = easJson.build as Record<string, { env?: Record<string, string> }>;
    for (const name of ['production', 'production-apk', 'preview', 'preview-apk']) {
      expect(profiles[name].env?.EXPO_PUBLIC_CLOSED_PRELAUNCH_VISUAL_UAT).toBe('0');
    }
    expect(profiles['uat-dynamic-signals-android'].env?.EXPO_PUBLIC_CLOSED_PRELAUNCH_VISUAL_UAT).toBe('1');
    expect(manifest.publicAllowlist).toEqual([]);
    expect(manifest.rightsGrant).toBe(false);
  });
});
