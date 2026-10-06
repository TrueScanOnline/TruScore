import fs from 'fs';
import path from 'path';
import { PACKET_SESSION_SCHEMA, type PacketContributionSession } from '../../../packetContribution/types';
import { manipulateAsync } from 'expo-image-manipulator';
import { deleteAsync, getInfoAsync, readAsStringAsync } from 'expo-file-system';
import { resumeEvidenceImages, resumeFailureNote, retryParkedEvidenceImage } from '../../../evidenceImage/pipeline';

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

function sessionWith(asset: PacketContributionSession['sourceAssets'][number], updatedAt = Date.now()): PacketContributionSession {
  return {
    schema: PACKET_SESSION_SCHEMA,
    sessionId: 'ses_photo',
    barcode: '9300675000000',
    createdAt: updatedAt,
    updatedAt,
    status: 'open',
    sourceAssets: [asset],
    derivedAssets: [],
    extractionRuns: [],
    units: [],
  };
}

function photo(overrides: Partial<PacketContributionSession['sourceAssets'][number]> = {}): PacketContributionSession['sourceAssets'][number] {
  return {
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
    ...overrides,
  };
}

describe('packet photo launch recovery', () => {
  afterEach(() => {
    (manipulateAsync as jest.Mock).mockReset();
    (manipulateAsync as jest.Mock).mockRejectedValue(new Error('`new NativeEventEmitter()` requires a non-null argument.'));
    (getInfoAsync as jest.Mock).mockReset();
    (getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, isDirectory: false });
    (readAsStringAsync as jest.Mock).mockReset();
    (readAsStringAsync as jest.Mock).mockResolvedValue('mock-file-content');
  });

  test('does not dynamic-import react-native while preparing a photo', () => {
    const source = fs.readFileSync(path.join(__dirname, '../../../evidenceImage/pipeline.ts'), 'utf8');
    expect(source.includes("await import('react-native')")).toBe(false);
    expect(source.includes('from \'react-native\'')).toBe(false);
    expect(source.includes('Image.getSize')).toBe(false);
    expect(source.includes("from 'expo-image-manipulator'")).toBe(true);
    const roots = [path.join(__dirname, '../../../..', 'src'), path.join(__dirname, '../../../..', 'app')];
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) continue;
        const lines = fs.readFileSync(full, 'utf8').split(/\r?\n/);
        lines.forEach((line, index) => {
          const whole =
            /await import\(\s*['"]react-native['"]\s*\)/.test(line) ||
            /import \* as [\w$]+ from ['"]react-native['"]/.test(line) ||
            (/require\(\s*['"]react-native['"]\s*\)/.test(line) && !/\{/.test(line)) ||
            /Object\.keys\(\s*[^;\n]*react-native/.test(line) ||
            /\.\.\.\s*require\(\s*['"]react-native['"]\s*\)/.test(line);
          if (whole) hits.push(`${full}:${index + 1}`);
        });
      }
    };
    roots.forEach(walk);
    expect(hits).toEqual([]);
  });

  test('records the native emitter failure and parks the persisted photo', () => {
    expect(resumeFailureNote(new Error('`new NativeEventEmitter()` requires a non-null argument.'))).toContain(
      'NativeEventEmitter'
    );
  });

  test('an ordinary thrown error parks the photo as failed_retryable and clears the resume marker', async () => {
    mockSessions.splice(0, mockSessions.length, sessionWith(photo()));
    await expect(resumeEvidenceImages()).resolves.toBeUndefined();
    const asset = mockSessions[0].sourceAssets[0];
    expect(asset.imagePhase).toBe('failed_retryable');
    expect(asset.resumeInProgress).toBeUndefined();
    expect(asset.preparationError || '').toContain('NativeEventEmitter');
    expect(asset.lineageWidth).toBe(3000);
    expect(asset.lineageHeight).toBe(2000);
  });

  test('the first interrupted launch resumes the photo automatically', async () => {
    mockSessions.splice(
      0,
      mockSessions.length,
      sessionWith(
        photo({
          resumeInProgress: { step: 'prepare', attempt: 1, startedAt: 1, launchId: 'ln_previous' },
        })
      )
    );
    await resumeEvidenceImages();
    const asset = mockSessions[0].sourceAssets[0];
    expect(asset.imagePhase).not.toBe('parked_after_interrupted_resume');
    expect(asset.interruptedResume).toBeUndefined();
    expect(manipulateAsync).toHaveBeenCalled();
    expect(deleteAsync).not.toHaveBeenCalled();
  });

  test('a second interrupted launch parks the photo and does not auto-resume it', async () => {
    mockSessions.splice(
      0,
      mockSessions.length,
      sessionWith(
        photo({
          resumeInProgress: { step: 'prepare', attempt: 2, startedAt: 1, launchId: 'ln_previous' },
        }),
        0
      )
    );
    await resumeEvidenceImages();
    const asset = mockSessions[0].sourceAssets[0];
    expect(asset.imagePhase).toBe('parked_after_interrupted_resume');
    expect(asset.interruptedResume).toMatchObject({ step: 'prepare', attempt: 2 });
    expect(asset.resumeInProgress).toBeUndefined();
    expect(manipulateAsync).not.toHaveBeenCalled();
    expect(deleteAsync).not.toHaveBeenCalled();
    expect(asset.privateKey).toBe('packet/ses_photo/original/src_photo');
  });

  test('manual retry of a parked photo runs once and re-parks as failed_retryable when prepare throws', async () => {
    mockSessions.splice(
      0,
      mockSessions.length,
      sessionWith(
        photo({
          imagePhase: 'parked_after_interrupted_resume',
          interruptedResume: { step: 'prepare', attempt: 2, interruptedAt: 5 },
        })
      )
    );
    (manipulateAsync as jest.Mock).mockClear();
    await retryParkedEvidenceImage('ses_photo', 'src_photo');
    const asset = mockSessions[0].sourceAssets[0];
    expect(manipulateAsync).toHaveBeenCalledTimes(1);
    expect(asset.imagePhase).toBe('failed_retryable');
    expect(asset.interruptedResume).toBeUndefined();
    expect(asset.resumeInProgress).toBeUndefined();
  });

  test('prepared dimensions do not replace the original lineage dimensions', async () => {
    (manipulateAsync as jest.Mock).mockResolvedValueOnce({ uri: 'file:///prepared.jpg', width: 640, height: 480 });
    (getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, size: 500 });
    (readAsStringAsync as jest.Mock).mockResolvedValue('/9j/2Q==');
    mockSessions.splice(
      0,
      mockSessions.length,
      sessionWith(photo({ lineageWidth: 3000, lineageHeight: 2000 }))
    );
    await resumeEvidenceImages();
    const asset = mockSessions[0].sourceAssets[0];
    expect(asset.lineageWidth).toBe(3000);
    expect(asset.lineageHeight).toBe(2000);
    expect(asset.preparedWidth).toBe(640);
    expect(asset.preparedHeight).toBe(480);
  });

  test('rejects a prepared image whose long edge is still over the envelope', async () => {
    (manipulateAsync as jest.Mock).mockResolvedValue({ uri: 'file:///huge.jpg', width: 4000, height: 3000 });
    (getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, size: 100 });
    mockSessions.splice(0, mockSessions.length, sessionWith(photo()));
    await resumeEvidenceImages();
    const asset = mockSessions[0].sourceAssets[0];
    expect(asset.imagePhase).toBe('failed_retryable');
    expect(asset.preparedWidth).toBeUndefined();
    expect(asset.lineageWidth).toBe(3000);
    expect(asset.lineageHeight).toBe(2000);
  });

  test('sizes an unknown original from the first manipulator output', async () => {
    (manipulateAsync as jest.Mock).mockImplementation(async (_uri: string, actions: { resize?: { width?: number } }[]) => {
      const resize = actions[0]?.resize?.width;
      if (!resize) return { uri: 'file:///measured.jpg', width: 4000, height: 3000 };
      return { uri: 'file:///fitted.jpg', width: resize, height: Math.round((3000 * resize) / 4000) };
    });
    (getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, size: 500 });
    (readAsStringAsync as jest.Mock).mockResolvedValue('/9j/2Q==');
    mockSessions.splice(
      0,
      mockSessions.length,
      sessionWith(photo({ lineageWidth: 0, lineageHeight: 0 }))
    );
    await resumeEvidenceImages();
    const asset = mockSessions[0].sourceAssets[0];
    expect(manipulateAsync).toHaveBeenCalledTimes(2);
    const secondActions = (manipulateAsync as jest.Mock).mock.calls[1][1];
    expect(secondActions[0].resize.width).toBe(2560);
    expect(asset.lineageWidth).toBe(0);
    expect(asset.lineageHeight).toBe(0);
    expect(asset.preparedWidth).toBe(2560);
    expect(asset.preparedHeight).toBe(1920);
  });
});
