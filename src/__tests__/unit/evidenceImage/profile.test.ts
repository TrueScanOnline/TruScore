import { evidenceImageProfile } from '../../../evidenceImage/profile';
import { fittedLongEdge, jpegContainsExif } from '../../../evidenceImage/jpeg';
import { localEvidenceAbandoned } from '../../../evidenceImage/retention';

describe('evidence image envelope', () => {
  test('defaults to the founder profile and refuses a larger byte cap', () => {
    const profile = evidenceImageProfile({});
    expect(profile).toMatchObject({
      profileId: 'evidence-image-v1',
      version: 1,
      maxLongEdgePx: 2560,
      jpegQuality: 0.85,
      maxBytes: 2 * 1024 * 1024,
      crop: false,
      stripLocation: true,
    });
    expect(evidenceImageProfile({ EVIDENCE_IMAGE_MAX_BYTES: '8000000' }).maxBytes).toBe(2 * 1024 * 1024);
    expect(evidenceImageProfile({ EVIDENCE_IMAGE_MAX_LONG_EDGE: '1920', EVIDENCE_IMAGE_PROFILE_VERSION: '2' })).toMatchObject({
      maxLongEdgePx: 1920,
      version: 2,
    });
  });

  test('fits the long edge without cropping', () => {
    expect(fittedLongEdge(4000, 3000, 2560)).toEqual({ width: 2560, height: 1920 });
    expect(fittedLongEdge(1200, 800, 2560)).toEqual({ width: 1200, height: 800 });
  });

  test('detects an Exif APP1 segment', () => {
    const clean = Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]);
    expect(jpegContainsExif(clean)).toBe(false);
    const exif = Uint8Array.from([
      0xff, 0xd8, 0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0xff, 0xd9,
    ]);
    expect(jpegContainsExif(exif)).toBe(true);
  });

  test('keeps a local file that is still waiting to retry', () => {
    const now = 20 * 24 * 60 * 60 * 1000;
    expect(localEvidenceAbandoned(0, now, false)).toBe(true);
    expect(localEvidenceAbandoned(now - 1000, now, false)).toBe(false);
    expect(localEvidenceAbandoned(0, now, true)).toBe(false);
  });
});
