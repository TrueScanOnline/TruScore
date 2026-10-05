import fs from 'fs';
import path from 'path';
import { PACKET_SESSION_SCHEMA, type PacketContributionSession } from '../../../packetContribution/types';
import { resumeEvidenceImages, resumeFailureNote } from '../../../evidenceImage/pipeline';

const mockSessions: PacketContributionSession[] = [];

jest.mock('../../../packetContribution/sessionStore', () => ({
  loadSessions: jest.fn(async () => mockSessions),
  getSession: jest.fn(async (sessionId: string) => mockSessions.find((session) => session.sessionId === sessionId) ?? null),
  upsertSession: jest.fn(async (next: PacketContributionSession) => {
    const index = mockSessions.findIndex((session) => session.sessionId === next.sessionId);
    if (index >= 0) mockSessions[index] = next;
    else mockSessions.push(next);
    return next;
  }),
}));

jest.mock('../../../evidenceAuthority/device', () => ({
  contributorCredential: jest.fn(async () => 'token'),
  listUnsentSubmissions: jest.fn(async () => []),
  postContributorAction: jest.fn(async () => ({
    ok: true,
    json: async () => ({
      profile: {
        profileId: 'evidence-image-v1',
        version: 1,
        maxLongEdgePx: 2560,
        jpegQuality: 0.85,
        maxBytes: 2 * 1024 * 1024,
        crop: false,
        stripLocation: true,
      },
    }),
  })),
  retryUnsentEvidenceSubmissions: jest.fn(async () => undefined),
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(async () => {
    throw new Error('`new NativeEventEmitter()` requires a non-null argument.');
  }),
  SaveFormat: { JPEG: 'jpeg' },
}));

describe('packet photo launch recovery', () => {
  test('does not dynamic-import react-native while preparing a photo', () => {
    const source = fs.readFileSync(path.join(__dirname, '../../../evidenceImage/pipeline.ts'), 'utf8');
    expect(source.includes("await import('react-native')")).toBe(false);
    expect(source.includes('from \'react-native\'')).toBe(false);
    expect(source.includes('Image.getSize')).toBe(false);
    expect(source.includes("import('expo-image-manipulator')")).toBe(true);
  });

  test('records the native emitter failure and parks the persisted photo', () => {
    expect(resumeFailureNote(new Error('`new NativeEventEmitter()` requires a non-null argument.'))).toContain(
      'NativeEventEmitter'
    );
  });

  test('a thrown prepare step parks the photo instead of rejecting launch recovery', async () => {
    mockSessions.splice(0, mockSessions.length, {
      schema: PACKET_SESSION_SCHEMA,
      sessionId: 'ses_photo',
      barcode: '9300675000000',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'open',
      sourceAssets: [
        {
          assetId: 'src_photo',
          sessionId: 'ses_photo',
          contentSha256: 'abc',
          byteLength: 1200,
          privateKey: 'packet/ses_photo/original/src_photo',
          source: 'camera',
          framing: 'targeted',
          locationMetadata: 'absent',
          capturedAt: Date.now(),
          imagePhase: 'local_accepted',
          lineageWidth: 3000,
          lineageHeight: 2000,
          traceId: 'ctr_0123456789abcdef',
        },
      ],
      derivedAssets: [],
      extractionRuns: [],
      units: [],
    });

    await expect(resumeEvidenceImages()).resolves.toBeUndefined();
    expect(mockSessions[0].sourceAssets[0].imagePhase).toBe('failed_retryable');
    const note = mockSessions[0].sourceAssets[0].preparationError ?? '';
    expect(note.includes('dynamic import') || note.includes('NativeEventEmitter')).toBe(true);
  });
});
