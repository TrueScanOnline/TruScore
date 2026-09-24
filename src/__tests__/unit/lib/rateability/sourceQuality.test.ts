/**
 * sourceQuality — no runtime source-name guessing; unmapped → other_or_unknown.
 */
import { defaultProductSourceQuality } from '../../../../lib/rateability/sourceQuality';
import type { Product } from '../../../../types/product';

describe('sourceQuality', () => {
  it('maps known community sources explicitly', () => {
    expect(defaultProductSourceQuality({ source: 'openfoodfacts' } as Product)).toBe(
      'community_or_user'
    );
    expect(defaultProductSourceQuality({ source: 'user_contributed' } as Product)).toBe(
      'community_or_user'
    );
  });

  it('does not guess from substrings; unmapped → other_or_unknown', () => {
    expect(defaultProductSourceQuality({ source: 'usda-fdc-mirror' } as Product)).toBe(
      'other_or_unknown'
    );
    expect(defaultProductSourceQuality({ source: 'something_openfoodfacts_like' } as Product)).toBe(
      'other_or_unknown'
    );
    expect(defaultProductSourceQuality({ source: '' } as Product)).toBe('other_or_unknown');
    expect(defaultProductSourceQuality({} as Product)).toBe('other_or_unknown');
  });
});
