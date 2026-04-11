import {
  buildShareUrl,
  SHARE_QUERY_CTX,
  SHARE_QUERY_SRC,
  parseShareQueryParams,
} from '../../../utils/shareUrl';

describe('buildShareUrl', () => {
  it('returns base URL without options', () => {
    expect(buildShareUrl('3017620422003')).toBe('https://truescan.app/barcode/3017620422003');
  });

  it('adds ctx, src, and utm params', () => {
    const u = buildShareUrl('3017620422003', {
      context: 'recall',
      source: 'whatsapp',
      utmSource: 'app',
      utmMedium: 'share',
      utmCampaign: 'recall',
    });
    expect(u).toContain('/barcode/3017620422003?');
    expect(u).toContain(`${SHARE_QUERY_CTX}=recall`);
    expect(u).toContain(`${SHARE_QUERY_SRC}=whatsapp`);
    expect(u).toContain('utm_source=app');
    expect(u).toContain('utm_medium=share');
    expect(u).toContain('utm_campaign=recall');
  });
});

describe('parseShareQueryParams', () => {
  it('reads ctx and src', () => {
    expect(
      parseShareQueryParams({
        ctx: 'nutrition',
        src: 'copy',
      })
    ).toEqual({ ctx: 'nutrition', src: 'copy', ref: undefined });
  });
});
