import AsyncStorage from '@react-native-async-storage/async-storage';
import { classifyInterruptedResume, currentResumeLaunchId } from '../../../evidenceImage/resumeGuard';
import { retryParkedEvidenceSubmission, retryUnsentEvidenceSubmissions } from '../../../evidenceAuthority/device';
import { __setSessionPersistenceForTests } from '../../../packetContribution/sessionStore';

const OUTBOX_KEY = '@rveel_evidence_outbox_v1';

describe('interrupted resume classification', () => {
  test('retries once when the previous launch left the first attempt', () => {
    const decision = classifyInterruptedResume(
      { step: 'upload', attempt: 1, startedAt: 10, launchId: 'ln_previous' },
      50
    );
    expect(decision.resume).toBe(true);
    if (decision.resume) {
      expect(decision.marker.attempt).toBe(2);
      expect(decision.marker.launchId).toBe(currentResumeLaunchId);
    }
  });

  test('parks on the second consecutive interrupted launch', () => {
    const decision = classifyInterruptedResume(
      { step: 'upload', attempt: 2, startedAt: 10, launchId: 'ln_previous' },
      50
    );
    expect(decision.resume).toBe(false);
    if (!decision.resume) {
      expect(decision.park).toEqual({ step: 'upload', attempt: 2, interruptedAt: 50 });
    }
  });

  test('a marker from this launch stays in flight', () => {
    const marker = { step: 'submission' as const, attempt: 2, startedAt: 10, launchId: currentResumeLaunchId };
    expect(classifyInterruptedResume(marker, 50)).toEqual({ resume: true, marker });
  });
});

describe('submission resume guard', () => {
  const memory = new Map<string, string>();

  beforeEach(() => {
    memory.clear();
    __setSessionPersistenceForTests(null);
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => memory.get(key) ?? null);
    (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
      memory.set(key, value);
    });
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    __setSessionPersistenceForTests(null);
  });

  test('retries a submission once after the first interrupted launch', async () => {
    memory.set(
      OUTBOX_KEY,
      JSON.stringify([
        {
          idempotencyKey: 'batch-1',
          sessionId: 'ses_photo',
          barcode: '9300675000000',
          unitRefs: [{ unitId: 'unit-1', revision: 'rev' }],
          status: 'unsent',
          createdAt: 1,
          resumeInProgress: { step: 'submission', attempt: 1, startedAt: 2, launchId: 'ln_previous' },
        },
      ])
    );
    await retryUnsentEvidenceSubmissions();
    const saved = JSON.parse(memory.get(OUTBOX_KEY) || '[]');
    expect(saved[0].interruptedResume).toBeUndefined();
    expect(saved[0].resumeInProgress).toBeUndefined();
    expect(saved[0].status).toBe('unsent');
    expect(saved[0].unitRefs).toHaveLength(1);
  });

  test('does not auto-resume a submission on its second interrupted launch', async () => {
    memory.set(
      OUTBOX_KEY,
      JSON.stringify([
        {
          idempotencyKey: 'batch-1',
          sessionId: 'ses_photo',
          barcode: '9300675000000',
          unitRefs: [{ unitId: 'unit-1', revision: 'rev' }],
          status: 'unsent',
          createdAt: 1,
          resumeInProgress: { step: 'submission', attempt: 2, startedAt: 2, launchId: 'ln_previous' },
        },
      ])
    );
    await retryUnsentEvidenceSubmissions();
    expect(global.fetch).not.toHaveBeenCalled();
    const saved = JSON.parse(memory.get(OUTBOX_KEY) || '[]');
    expect(saved[0].interruptedResume.step).toBe('submission');
    expect(saved[0].interruptedResume.attempt).toBe(2);
    expect(saved[0].resumeInProgress).toBeUndefined();
    expect(saved[0].status).toBe('unsent');
    expect(saved[0].unitRefs).toHaveLength(1);
  });

  test('manual retry of a parked submission runs once', async () => {
    memory.set(
      OUTBOX_KEY,
      JSON.stringify([
        {
          idempotencyKey: 'batch-1',
          sessionId: 'ses_missing',
          barcode: '9300675000000',
          unitRefs: [{ unitId: 'unit-1', revision: 'rev' }],
          status: 'unsent',
          createdAt: 1,
          interruptedResume: { step: 'submission', attempt: 2, interruptedAt: 9 },
        },
      ])
    );
    await retryParkedEvidenceSubmission('batch-1');
    const saved = JSON.parse(memory.get(OUTBOX_KEY) || '[]');
    expect(saved[0].interruptedResume).toBeUndefined();
    expect(saved[0].resumeInProgress).toBeUndefined();
    expect(saved[0].unitRefs).toHaveLength(1);
    expect(saved).toHaveLength(1);
  });

  test('two overlapping retries in one launch do not park the item', async () => {
    let releaseSession: () => void = () => undefined;
    const sessionGate = new Promise<void>((resolve) => {
      releaseSession = resolve;
    });
    let sessionLoads = 0;
    __setSessionPersistenceForTests({
      load: async () => {
        sessionLoads += 1;
        await sessionGate;
        return [];
      },
      save: async () => undefined,
    });
    memory.set(
      OUTBOX_KEY,
      JSON.stringify([
        {
          idempotencyKey: 'batch-1',
          sessionId: 'ses_photo',
          barcode: '9300675000000',
          unitRefs: [{ unitId: 'unit-1', revision: 'rev' }],
          status: 'unsent',
          createdAt: 1,
        },
      ])
    );
    const first = retryUnsentEvidenceSubmissions();
    for (let tick = 0; tick < 40; tick += 1) {
      const mid = JSON.parse(memory.get(OUTBOX_KEY) || '[]');
      if (mid[0]?.resumeInProgress) break;
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sessionLoads).toBe(1);
    const second = retryUnsentEvidenceSubmissions();
    await second;
    const during = JSON.parse(memory.get(OUTBOX_KEY) || '[]');
    expect(sessionLoads).toBe(1);
    expect(during[0].interruptedResume).toBeUndefined();
    expect(during[0].resumeInProgress.launchId).toBe(currentResumeLaunchId);
    expect(during[0].status).toBe('unsent');
    releaseSession();
    await first;
    const saved = JSON.parse(memory.get(OUTBOX_KEY) || '[]');
    expect(saved[0].interruptedResume).toBeUndefined();
    expect(saved[0].resumeInProgress).toBeUndefined();
    expect(saved[0].unitRefs).toHaveLength(1);
    expect(saved).toHaveLength(1);
  });
});
