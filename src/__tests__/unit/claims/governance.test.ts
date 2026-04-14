import en from '../../../i18n/locales/en.json';
import { CLAIM_DEFINITIONS } from '../../../claims/definitions';
import { getStringAtPath, validateClaimEnText } from '../../../claims/governance';

describe('Phase 2 claim governance (EN)', () => {
  it('every claim resolves EN text and passes mustNotSay / anchors', () => {
    for (const def of CLAIM_DEFINITIONS) {
      const text = getStringAtPath(en, def.enI18nPath);
      const result = validateClaimEnText(text, def);
      expect(result).toEqual({ ok: true });
    }
  });

  it('registry has unique claimIds', () => {
    const ids = CLAIM_DEFINITIONS.map((c) => c.claimId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
