import AsyncStorage from '@react-native-async-storage/async-storage';
import { classifyInterruptedResume } from '../../../evidenceImage/resumeGuard';
import { retryParkedEvidenceSubmission, retryUnsentEvidenceSubmissions } from '../../../evidenceAuthority/device';

const OUTBOX_KEY = '@rveel_evidence_outbox_v1';

describe('interrupted resume classification', () => {
  test('reaches the limit on the second interrupted launch', () => {
    const decision = classifyInterruptedResume({ step: 'upload', attempt: 1, startedAt: 10 }, 50);
    expect(decision.resume).toBe(false);
    if (!decision.resume) {
      expect(decision.park).toEqual({ step: 'upload', attempt: 2, interruptedAt: 50 });
    }
  });

  test('an earlier attempt can still resume', () => {
    const decision = classifyInterruptedResume({ step: 'prepare', attempt: 0, startedAt: 10 }, 50);
    expect(decision.resume).toBe(true);
  });
});

describe('submission resume guard', () => {
  const memory = new Map<string, string>();

  beforeEach(() => {
    memory.clear();
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => memory.get(key) ?? null);
    (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
      memory.set(key, value);
    });
    (global.fetch as jest.Mock).mockClear();
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
          resumeInProgress: { step: 'submission', attempt: 1, startedAt: 2 },
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
});
