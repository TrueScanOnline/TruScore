/**
 * Behavioural CF-06: server admit succeeded but client submit ack failed → GET snapshot
 * reconcile recovers admitted state without duplicate invent.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { transmitSessionToAuthority } from '../../../evidenceAuthority/device';
import { PACKET_SESSION_STORAGE_KEY } from '../../../packetContribution/sessionStore';
import { PACKET_SESSION_SCHEMA, type PacketContributionSession } from '../../../packetContribution/types';

const BARCODE = '9300617064879';
const COUNTRY = 'Fiji';

describe('reconcile after lost submit acknowledgement', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    process.env.EXPO_PUBLIC_BACKEND_URL = 'https://authority.example';
    process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV = 'uat';
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => storage.get(key) ?? null);
    (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
      storage.set(key, value);
    });
    (AsyncStorage.removeItem as jest.Mock).mockImplementation(async (key: string) => {
      storage.delete(key);
    });
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_BACKEND_URL;
    delete process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV;
  });

  function originsSession(): PacketContributionSession {
    return {
      schema: PACKET_SESSION_SCHEMA,
      sessionId: 'reconcile-origins',
      barcode: BARCODE,
      createdAt: 1,
      updatedAt: 1,
      status: 'open',
      sourceAssets: [],
      derivedAssets: [],
      extractionRuns: [],
      units: [
        {
          unitId: 'unit-origins-fiji',
          domain: 'origins',
          section: 'origins',
          statement: '',
          support: { coverage: 'whole_image', sourceAssetId: 'manual-text:unit-origins-fiji' },
          origin: 'manual',
          extractionRunId: null,
          observationId: null,
          disposition: null,
          status: 'reviewed',
          originClaimType: 'made_in',
          originCountry: COUNTRY,
          percentageNotStated: true,
        },
      ],
    };
  }

  it('recovers admitted=true via GET snapshot when submit HTTP fails but prevailing already matches', async () => {
    let submitCalls = 0;
    const getCalls: string[] = [];
    (global.fetch as jest.Mock).mockImplementation(async (url: string, init?: { method?: string; body?: string }) => {
      const method = (init?.method || 'GET').toUpperCase();
      if (method === 'GET' || !init?.body) {
        getCalls.push(String(url));
        if (String(url).includes(`barcode=${BARCODE}`)) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              snapshot: {
                barcode: BARCODE,
                authorityEnv: 'uat',
                epoch: 'wave4a.uat',
                recordClass: 'uat',
                generatedAt: Date.now(),
                withdrawnSubjectKeys: [],
                prevailing: [
                  {
                    subjectKey: 'origins|made_in',
                    versionId: 'ver_reconcile_test',
                    versionNo: 1,
                    admissionSeq: 1,
                    governance: 'active',
                    evidence: {
                      domain: 'origins',
                      claimValue: COUNTRY,
                      originStructured: { claimType: 'made_in', primaryCountry: COUNTRY, percentageNotStated: true },
                      admissionStatus: 'admitted',
                    },
                  },
                ],
                offDispatch: [],
              },
            }),
          };
        }
        return { ok: true, status: 200, json: async () => ({ success: true, authorityEnv: 'uat' }) };
      }
      const body = JSON.parse(init.body) as Record<string, unknown>;
      if (body.action === 'issue-credential') {
        return { ok: true, status: 201, json: async () => ({ token: 'credential-token', contributorId: 'rveel_t' }) };
      }
      if (body.action === 'finalize-manual-text') {
        return { ok: true, status: 200, json: async () => ({ ok: true, assetId: 'asset_reconcile', contentType: 'manual_text' }) };
      }
      if (body.action === 'submit') {
        submitCalls += 1;
        // Simulate lost/failed client acknowledgement after server already admitted.
        return { ok: false, status: 503, json: async () => ({ success: false, error: 'upstream_timeout' }) };
      }
      return { ok: false, status: 400, json: async () => ({}) };
    });

    storage.set(PACKET_SESSION_STORAGE_KEY, JSON.stringify([originsSession()]));
    const result = await transmitSessionToAuthority('reconcile-origins');

    expect(submitCalls).toBe(1);
    expect(getCalls.some((u) => u.includes(`barcode=${BARCODE}`))).toBe(true);
    expect(result.admitted).toBe(true);
    expect(result.admittedUnitIds).toEqual(['unit-origins-fiji']);
    expect(result.pendingOutbox).toBe(false);
    expect(result.snapshot?.prevailing[0]?.subjectKey).toBe('origins|made_in');
  });

  it('does not invent success when GET snapshot prevailing country mismatches', async () => {
    (global.fetch as jest.Mock).mockImplementation(async (url: string, init?: { method?: string; body?: string }) => {
      const method = (init?.method || 'GET').toUpperCase();
      if (method === 'GET' || !init?.body) {
        if (String(url).includes(`barcode=${BARCODE}`)) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              snapshot: {
                barcode: BARCODE,
                authorityEnv: 'uat',
                epoch: 'wave4a.uat',
                recordClass: 'uat',
                generatedAt: Date.now(),
                withdrawnSubjectKeys: [],
                prevailing: [
                  {
                    subjectKey: 'origins|made_in',
                    versionId: 'ver_other',
                    evidence: {
                      domain: 'origins',
                      claimValue: 'Australia',
                      originStructured: { claimType: 'made_in', primaryCountry: 'Australia' },
                    },
                  },
                ],
                offDispatch: [],
              },
            }),
          };
        }
        return { ok: true, status: 200, json: async () => ({ success: true, authorityEnv: 'uat' }) };
      }
      const body = JSON.parse(init.body) as Record<string, unknown>;
      if (body.action === 'issue-credential') {
        return { ok: true, status: 201, json: async () => ({ token: 'credential-token' }) };
      }
      if (body.action === 'finalize-manual-text') {
        return { ok: true, status: 200, json: async () => ({ ok: true, assetId: 'asset_x', contentType: 'manual_text' }) };
      }
      if (body.action === 'submit') {
        return { ok: false, status: 503, json: async () => ({}) };
      }
      return { ok: false, status: 400, json: async () => ({}) };
    });

    storage.set(PACKET_SESSION_STORAGE_KEY, JSON.stringify([originsSession()]));
    const result = await transmitSessionToAuthority('reconcile-origins');
    expect(result.admitted).toBe(false);
    expect(result.pendingOutbox).toBe(true);
  });
});
