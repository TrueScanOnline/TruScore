import {
  buildShareUrl,
  DEFAULT_SHARE_WEB_ORIGIN,
  formatShareLinkLabel,
  getShareWebOrigin,
  SHARE_QUERY_CTX,
  SHARE_QUERY_SRC,
  parseShareQueryParams,
} from '../../../utils/shareUrl';

describe('buildShareUrl', () => {
  const original = process.env.EXPO_PUBLIC_SHARE_WEB_ORIGIN;

  afterEach(() => {
    if (original === undefined) delete process.env.EXPO_PUBLIC_SHARE_WEB_ORIGIN;
    else process.env.EXPO_PUBLIC_SHARE_WEB_ORIGIN = original;
  });

  it('returns base URL without options on the default share-web origin', () => {
    delete process.env.EXPO_PUBLIC_SHARE_WEB_ORIGIN;
    expect(buildShareUrl('3017620422003')).toBe(
      `${DEFAULT_SHARE_WEB_ORIGIN}/barcode/3017620422003`
    );
  });

  it('honours EXPO_PUBLIC_SHARE_WEB_ORIGIN', () => {
    process.env.EXPO_PUBLIC_SHARE_WEB_ORIGIN = 'https://truscoreapi-uat.vercel.app';
    expect(getShareWebOrigin()).toBe('https://truscoreapi-uat.vercel.app');
    expect(buildShareUrl('3017620422003')).toBe(
      'https://truscoreapi-uat.vercel.app/barcode/3017620422003'
    );
    expect(formatShareLinkLabel('3017620422003')).toBe(
      'truscoreapi-uat.vercel.app/barcode/3017620422003'
    );
  });

  it('adds ctx, src, and utm params', () => {
    delete process.env.EXPO_PUBLIC_SHARE_WEB_ORIGIN;
    const u = buildShareUrl('3017620422003', {
      context: 'recall',
      source: 'whatsapp',
      utmSource: 'app',
      utmMedium: 'share',
      utmCampaign: 'recall',
    });
    expect(u.startsWith(`${DEFAULT_SHARE_WEB_ORIGIN}/barcode/3017620422003?`)).toBe(true);
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
