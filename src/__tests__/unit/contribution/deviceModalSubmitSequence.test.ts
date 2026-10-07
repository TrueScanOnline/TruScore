/**
 * Diagnosis: founder devices throw inside the modal after local_handoff_begin
 * and before any Evidence Authority request. This runs that same local sequence.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import fs from 'fs';
import path from 'path';
import { __setContributionCreationRecordClassForTests } from '../../../contributions/productionEpoch';
import { ceasedOriginsRemovedFromForm } from '../../../contribution/consumerSurface';
import { prepareVisibleContribution } from '../../../contribution/visibleContribution';
import { searchPacketInformation } from '../../../certifications/resolveCertification';
import { recordUnresolvedObservation } from '../../../certifications/unresolvedMarkCandidates';
import { capturedOriginQualifications } from '../../../contributions/originStructured';
import { governedOriginCountryNames } from '../../../contribution/originCountrySelection';
import {
  addManualEvidenceUnit,
  getSession,
  handoffReviewedUnits,
  openSessionForProduct,
  upsertSession,
} from '../../../packetContribution';
import { reviewedUnitSupport } from '../../../contribution/submissionReadiness';
import { ContributionTrace } from '../../../evidenceAuthority/contributionTrace';
import { transmitSessionToAuthority } from '../../../evidenceAuthority/device';
import { logClientTimeline } from '../../../../backend/vercel/lib/contributionTrace';

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  __setContributionCreationRecordClassForTests(null);
  (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => memory.get(key) ?? null);
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
    memory.set(key, value);
  });
});

afterEach(() => {
  __setContributionCreationRecordClassForTests(null);
});

const EMPTY_ORIGIN = {
  claimType: null as null,
  wording: '',
  place: '',
  ingredient: '',
  percentage: '',
  intent: 'new' as const,
};

async function runModalSequence(input: {
  barcode: string;
  contexts: Array<'ingredients' | 'nutrition' | 'origins' | 'packetClaims' | 'certifications'>;
  packetQuery?: string;
  claims?: string[];
  certifications?: string[];
  origins?: Array<{
    claimType: 'made_in' | null;
    wording: string;
    place: string;
    ingredient: string;
    percentage: string;
    qualifier?: 'at_least';
    percentageNotStated?: boolean;
    intent: 'new';
  }>;
}) {
  const session = await openSessionForProduct({ barcode: input.barcode });
  const packetQuery = input.packetQuery || '';
  const packetHits = searchPacketInformation(packetQuery);
  const origins = input.origins || [EMPTY_ORIGIN];
  const exactCatalogue = packetHits.find(
    (hit) => hit.displayName.trim().toLowerCase() === packetQuery.trim().toLowerCase()
  );
  const removedOriginKeys = ceasedOriginsRemovedFromForm([], origins);
  const decision = prepareVisibleContribution({
    contexts: input.contexts,
    ingredientsText: '',
    initialIngredients: '',
    nutrition: { basis: 'per_100g', amounts: {}, sodiumUnit: 'mg' },
    nutritionBaseline: { basis: 'per_100g', amounts: {}, sodiumUnit: 'mg' },
    origins,
    claims: input.claims || [''],
    initialClaims: [],
    certifications: input.certifications || [''],
    initialCertifications: [],
    pendingPacketWording: packetQuery,
    catalogueName: exactCatalogue?.displayName,
    absence: false,
    hasPhotoForAbsence: false,
  });
  if (decision.status !== 'ready') {
    return { status: decision.status, removedOriginKeys };
  }
  const created: string[] = [];
  for (let index = 0; index < decision.origins.length; index += 1) {
    const row = decision.origins[index];
    const places = governedOriginCountryNames(row.place);
    const wording = row.wording.trim();
    if (places.length === 0) continue;
    const percentage = Number(row.percentage);
    const statedPercentage = !row.percentageNotStated && Number.isFinite(percentage) && row.percentage.trim();
    const qualifications = capturedOriginQualifications({
      local: row.local === true,
      imported: row.imported === true,
      multiple: false,
    });
    const unit = await addManualEvidenceUnit({
      sessionId: session.sessionId,
      domain: 'origins',
      statement: wording,
      originClaimType: row.claimType,
      originCountry: places[0],
      originCountries: places.length > 1 ? places : undefined,
      ingredientSubject: row.claimType === 'ingredient_origin' ? row.ingredient.trim() : undefined,
      originPercentage: statedPercentage ? percentage : undefined,
      originPercentageQualifier: statedPercentage ? row.qualifier : undefined,
      originQualification: qualifications.originQualification,
      originQualifications: qualifications.originQualifications,
      percentageNotStated: row.percentageNotStated === true && !statedPercentage,
      support: { coverage: 'whole_image', sourceAssetId: 'manual-text-only' },
    });
    created.push(unit.unitId);
  }
  for (const text of decision.claims) {
    recordUnresolvedObservation(text);
    const unit = await addManualEvidenceUnit({
      sessionId: session.sessionId,
      domain: 'packet_claims',
      statement: text,
      support: { coverage: 'whole_image', sourceAssetId: 'manual-text-only' },
    });
    created.push(unit.unitId);
  }
  for (const text of decision.certifications) {
    const unit = await addManualEvidenceUnit({
      sessionId: session.sessionId,
      domain: 'certifications',
      statement: text,
      support: { coverage: 'whole_image', sourceAssetId: 'manual-text-only' },
    });
    created.push(unit.unitId);
  }
  const latest = await getSession(session.sessionId);
  if (latest) {
    await upsertSession({
      ...latest,
      units: latest.units.map((unit) => {
        if (!created.includes(unit.unitId)) return unit;
        const support = reviewedUnitSupport({
          unitId: unit.unitId,
          packetAbsence: unit.packetAbsenceAffirmation === true,
          photos: [],
        });
        return { ...unit, support: { coverage: 'whole_image' as const, sourceAssetId: support.sourceAssetId } };
      }),
    });
  }
  const reviewed = await getSession(session.sessionId);
  if (reviewed) {
    await upsertSession({
      ...reviewed,
      units: reviewed.units.map((unit) =>
        created.includes(unit.unitId) ? { ...unit, status: 'reviewed' as const, reviewAction: 'manual_entry' as const } : unit
      ),
    });
  }
  const handed = await handoffReviewedUnits({ sessionId: session.sessionId, persistRemote: false });
  return {
    status: 'ready' as const,
    created,
    handed: handed.map((item) => ({ outcome: item.outcome, reason: 'reason' in item ? item.reason : undefined })),
  };
}

describe('device modal submit sequence', () => {
  it('submits made-in Australia at least 10 percent without throwing', async () => {
    const result = await runModalSequence({
      barcode: '9300673000001',
      contexts: ['origins'],
      origins: [
        {
          claimType: 'made_in',
          wording: '',
          place: 'Australia',
          ingredient: '',
          percentage: '10',
          qualifier: 'at_least',
          intent: 'new',
        },
      ],
    });
    expect(result.status).toBe('ready');
    expect(result.handed?.some((item) => item.outcome === 'submitted')).toBe(true);
  });

  it('submits unmatched Microwave Easy without throwing', async () => {
    const result = await runModalSequence({
      barcode: '9300673000002',
      contexts: ['packetClaims', 'certifications'],
      packetQuery: 'Microwave Easy',
    });
    expect(result.status).toBe('ready');
    expect(result.handed?.some((item) => item.outcome === 'submitted')).toBe(true);
  });

  it('retries the session write when AsyncStorage reports it is full', async () => {
    let failed = false;
    (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
      if (!failed && key.includes('packet_contribution')) {
        failed = true;
        throw new Error('QuotaExceededError');
      }
      memory.set(key, value);
    });
    (AsyncStorage.multiRemove as jest.Mock).mockImplementation(async () => undefined);
    const session = await openSessionForProduct({ barcode: '9300673000099' });
    expect(session.barcode).toBe('9300673000099');
    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
      '@truescan_fsanz_cache_AU',
      '@truescan_fsanz_cache_AU_metadata',
      '@truescan_fsanz_cache_NZ',
      '@truescan_fsanz_cache_NZ_metadata',
    ]);
    expect(memory.get('@rveel_packet_contribution_sessions_v1')).toContain('9300673000099');
  });

  it('submits Excellent Source of Fibre without throwing', async () => {
    const result = await runModalSequence({
      barcode: '9300673000003',
      contexts: ['packetClaims', 'certifications'],
      packetQuery: 'Excellent Source of Fibre',
    });
    expect(result.status).toBe('ready');
    expect(result.handed?.some((item) => item.outcome === 'submitted')).toBe(true);
  });

  it('keeps the reviewed session when the local evidence cache cannot be written', async () => {
    (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
      if (key === '@rveel_contribution_evidence_v1') throw new Error('QuotaExceededError');
      memory.set(key, value);
    });
    const result = await runModalSequence({
      barcode: '9300673000002',
      contexts: ['packetClaims', 'certifications'],
      packetQuery: 'Microwave Easy',
    });
    expect(result.status).toBe('ready');
    const stored = JSON.parse(memory.get('@rveel_packet_contribution_sessions_v1') || '[]') as Array<{
      units: Array<{ statement: string; status: string }>;
    }>;
    expect(stored[0].units.some((unit) => unit.statement === 'Microwave Easy' && unit.status === 'reviewed')).toBe(true);
    expect(memory.has('@rveel_contribution_evidence_v1')).toBe(false);
  });

  it('keeps the session and unsent outbox when authority transmission fails', async () => {
    process.env.EXPO_PUBLIC_BACKEND_URL = 'https://truscoreapi-uat.vercel.app';
    process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV = 'uat';
    const result = await runModalSequence({
      barcode: '9300673000002',
      contexts: ['packetClaims', 'certifications'],
      packetQuery: 'Microwave Easy',
    });
    expect(result.status).toBe('ready');
    const sessions = JSON.parse(memory.get('@rveel_packet_contribution_sessions_v1') || '[]') as Array<{
      sessionId: string;
      units: Array<{ statement: string; status: string }>;
    }>;
    global.fetch = jest.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method || 'GET';
      const action = typeof init?.body === 'string' ? (JSON.parse(init.body) as { action?: string }).action : '';
      const status = method === 'GET' ? 200 : action === 'issue-credential' ? 201 : action === 'submit' ? 500 : 200;
      const body =
        method === 'GET'
          ? { success: true, authorityEnv: 'uat' }
          : action === 'issue-credential'
            ? { token: 'local-test-token' }
            : action === 'finalize-manual-text'
              ? { ok: true, assetId: 'asset_local' }
              : { success: false, error: 'unavailable' };
      return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
    });
    const transmitted = await transmitSessionToAuthority(sessions[0].sessionId);
    expect(transmitted.admitted).toBe(false);
    expect(transmitted.pendingOutbox).toBe(true);
    const retained = JSON.parse(memory.get('@rveel_packet_contribution_sessions_v1') || '[]') as Array<{
      units: Array<{ statement: string; status: string }>;
    }>;
    expect(retained[0].units.some((unit) => unit.statement === 'Microwave Easy' && unit.status === 'reviewed')).toBe(true);
    const outbox = JSON.parse(memory.get('@rveel_evidence_outbox_v1') || '[]') as Array<{ status: string }>;
    expect(outbox.some((item) => item.status === 'unsent')).toBe(true);
    delete process.env.EXPO_PUBLIC_BACKEND_URL;
    delete process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV;
  });

  it('imports reviewedUnitSupport into the modal Submit executes', () => {
    const modal = fs.readFileSync(path.join(__dirname, '../../../components/PacketContributionModal.tsx'), 'utf8');
    expect(modal).toMatch(
      /import\s*\{[^}]*\breviewedUnitSupport\b[^}]*\}\s*from\s*['"]\.\.\/contribution\/submissionReadiness['"]/
    );
    const submit = modal.slice(modal.indexOf('const submit = async'));
    expect(submit).toContain('reviewedUnitSupport(');
    expect(reviewedUnitSupport({ unitId: 'eu_manual_symbol', packetAbsence: false, photos: [] }).sourceAssetId).toBe(
      'manual-text:eu_manual_symbol'
    );
  });

  it('puts the bounded handoff exception on the client payload and the UAT trace log', () => {
    const trace = new ContributionTrace('modal', 'ios');
    trace.noteError(new TypeError('QuotaExceededError'));
    trace.mark('submit_failed', 'failed');
    const payload = trace.payload('modal_finally');
    expect(payload.error).toBe('TypeError: QuotaExceededError');
    (console.log as jest.Mock).mockClear();
    logClientTimeline(payload as unknown as Record<string, unknown>);
    const logged = (console.log as jest.Mock).mock.calls.map((call) => call.map(String).join(' ')).join('\n');
    expect(logged).toContain('TypeError: QuotaExceededError');
    expect(logged).toContain('submit_failed');
  });
});
