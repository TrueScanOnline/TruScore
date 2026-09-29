/**
 * Governed manual_text source assets and unmapped certification representation.
 * These tests exercise the authority service. They are not independent QA.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAssessmentEligibleForReceiver } from '../../../contributions/admissionContract';
import { EvidenceAuthority } from '../../../evidenceAuthority/authority';
import { evidenceFactsForUnits, transmitSessionToAuthority } from '../../../evidenceAuthority/device';
import { deriveEvidenceFacts } from '../../../evidenceAuthority/subjects';
import { MANUAL_TEXT_CONTENT_TYPE, manualTextSha256 } from '../../../evidenceAuthority/manualTextAsset';
import { MemoryAuthorityStore } from '../../../evidenceAuthority/memoryStore';
import type { EvidenceFactInput } from '../../../evidenceAuthority/types';
import { PACKET_SESSION_STORAGE_KEY } from '../../../packetContribution/sessionStore';
import { PACKET_SESSION_SCHEMA, type PacketContributionSession } from '../../../packetContribution/types';
import { sha256Hex } from '../../../packetContribution/sha256';

const BARCODE = '9300673555555';

function service(env: 'uat' | 'production' = 'production') {
  return new EvidenceAuthority(new MemoryAuthorityStore(), {
    authorityEnv: env,
    founderAdminToken: 'founder-test',
  });
}

describe('manual_text source assets', () => {
  test('server canonicalises and hashes a manual statement without an image', async () => {
    const authority = service();
    const { contributorId } = await authority.issueCredential();
    const finalized = await authority.finalizeManualTextAsset({
      contributorId,
      barcode: BARCODE,
      sessionId: 'sess-1',
      unitId: 'unit-1',
      domain: 'ingredients_nutrition',
      statement: '  oats water  ',
      ingredientsText: '  oats water  ',
    });
    expect(finalized.ok).toBe(true);
    if (!finalized.ok) return;
    const expected = JSON.stringify({
      sourceKind: 'manual_text',
      barcode: BARCODE,
      variantKey: '',
      sessionId: 'sess-1',
      unitId: 'unit-1',
      domain: 'ingredients_nutrition',
      statement: 'oats water',
      structured: { ingredientsText: 'oats water' },
    });
    expect(finalized.contentType).toBe(MANUAL_TEXT_CONTENT_TYPE);
    expect(finalized.sha256).toBe(sha256Hex(new TextEncoder().encode(expected)));
    expect(manualTextSha256({
      barcode: BARCODE,
      sessionId: 'sess-1',
      unitId: 'unit-1',
      domain: 'ingredients_nutrition',
      statement: 'oats water',
      ingredientsText: 'oats water',
    })?.sha256).toBe(finalized.sha256);

    const admitted = await authority.submit(contributorId, {
      idempotencyKey: 'manual-ingredients-1',
      barcode: BARCODE,
      facts: [
        {
          domain: 'ingredients_nutrition',
          ingredientsText: 'oats water',
          finalizedAssetId: finalized.assetId,
          unitId: 'unit-1',
        },
      ],
    });
    expect(admitted.status).toBe('admitted');
    const evidence = admitted.snapshot?.prevailing[0]?.evidence;
    expect(evidence?.exactWording).toBe('oats water');
    expect(evidence?.imageUrl).toBeUndefined();
    expect(evidence?.sourceProvenance).toBeUndefined();
    expect(isAssessmentEligibleForReceiver(evidence!, 'body_ingredients_nutrition')).toBe(true);
  });

  test('the same reviewed statement reuses the bound asset and a later statement is a new version', async () => {
    const authority = service();
    const { contributorId } = await authority.issueCredential();
    const draft = {
      contributorId,
      barcode: BARCODE,
      sessionId: 'sess-2',
      unitId: 'unit-a',
      domain: 'ingredients_nutrition' as const,
      statement: 'oats water',
      ingredientsText: 'oats water',
    };
    const first = await authority.finalizeManualTextAsset(draft);
    const replay = await authority.finalizeManualTextAsset(draft);
    expect(first.ok && replay.ok).toBe(true);
    if (!first.ok || !replay.ok) return;
    expect(replay.assetId).toBe(first.assetId);

    const other = await authority.issueCredential();
    const rebound = await authority.finalizeManualTextAsset({ ...draft, contributorId: other.contributorId });
    expect(rebound.ok).toBe(true);
    if (!rebound.ok) return;
    expect(rebound.assetId).not.toBe(first.assetId);

    const opened = await authority.submit(contributorId, {
      idempotencyKey: 'manual-v1',
      barcode: BARCODE,
      facts: [
        {
          domain: 'ingredients_nutrition',
          ingredientsText: 'oats water',
          finalizedAssetId: first.assetId,
          unitId: 'unit-a',
        },
      ],
    });
    const correctedAsset = await authority.finalizeManualTextAsset({
      ...draft,
      sessionId: 'sess-3',
      unitId: 'unit-b',
      statement: 'oats water salt',
      ingredientsText: 'oats water salt',
    });
    expect(correctedAsset.ok).toBe(true);
    if (!correctedAsset.ok) return;
    expect(correctedAsset.assetId).not.toBe(first.assetId);
    const corrected = await authority.submit(contributorId, {
      idempotencyKey: 'manual-v2',
      barcode: BARCODE,
      facts: [
        {
          domain: 'ingredients_nutrition',
          ingredientsText: 'oats water salt',
          finalizedAssetId: correctedAsset.assetId,
          unitId: 'unit-b',
        },
      ],
    });
    expect(opened.snapshot?.prevailing[0]?.evidence.exactWording).toBe('oats water');
    expect(corrected.status).toBe('admitted');
    expect(corrected.snapshot?.prevailing[0]?.versionNo).toBe(2);
    expect(corrected.snapshot?.prevailing[0]?.evidence.exactWording).toBe('oats water salt');
    expect(opened.snapshot?.prevailing[0]?.evidence.exactWording).toBe('oats water');
  });

  test('packet absence cannot be finalised or admitted as manual_text', async () => {
    const authority = service();
    const { contributorId } = await authority.issueCredential();
    const denied = await authority.finalizeManualTextAsset({
      contributorId,
      barcode: BARCODE,
      sessionId: 'sess-abs',
      unitId: 'unit-abs',
      domain: 'packet_claims',
      statement: 'No claims on this pack',
      packetAbsence: true,
    });
    expect(denied).toEqual({ ok: false, reason: 'packet_absence_requires_packet_evidence' });

    const claim = await authority.finalizeManualTextAsset({
      contributorId,
      barcode: BARCODE,
      sessionId: 'sess-claim',
      unitId: 'unit-claim',
      domain: 'packet_claims',
      statement: 'No added sugar',
    });
    expect(claim.ok).toBe(true);
    if (!claim.ok) return;
    const absence = await authority.submit(contributorId, {
      idempotencyKey: 'absence-on-manual-text',
      barcode: BARCODE,
      facts: [
        {
          domain: 'packet_claims',
          packetAbsence: true,
          finalizedAssetId: claim.assetId,
          unitId: 'unit-claim',
        },
      ],
    });
    expect(absence.status).toBe('pending_source');
    expect(absence.snapshot).toBeNull();
  });

  test('a statement that does not reconstruct the asset is rejected and image finalisation cannot spoof manual_text', async () => {
    const authority = service();
    const { contributorId } = await authority.issueCredential();
    const finalized = await authority.finalizeManualTextAsset({
      contributorId,
      barcode: BARCODE,
      sessionId: 'sess-mismatch',
      unitId: 'unit-mismatch',
      domain: 'ingredients_nutrition',
      statement: 'oats water',
      ingredientsText: 'oats water',
    });
    expect(finalized.ok).toBe(true);
    if (!finalized.ok) return;
    const mismatch = await authority.submit(contributorId, {
      idempotencyKey: 'manual-mismatch',
      barcode: BARCODE,
      facts: [
        {
          domain: 'ingredients_nutrition',
          ingredientsText: 'wheat',
          finalizedAssetId: finalized.assetId,
          unitId: 'unit-mismatch',
        },
      ],
    });
    expect(mismatch.status).toBe('source_hash_mismatch');
    const spoofed = await authority.finalizeAssetUpload({
      uploadId: 'upload-spoof',
      declaredSha256: 'not-a-hash',
      contentType: MANUAL_TEXT_CONTENT_TYPE,
      contributorId,
      barcode: BARCODE,
    });
    expect(spoofed).toEqual({ ok: false, reason: 'manual_text_not_an_image' });
  });
});

describe('unmapped certification representation', () => {
  test('an unmapped statement keeps its wording and subject and does not become a scoring label', async () => {
    const wording = 'Supports local growers';
    const derived = deriveEvidenceFacts([
      {
        domain: 'certifications',
        exactWording: wording,
        claimValue: wording,
        unitId: 'cert-1',
      },
    ]);
    expect(derived.facts).toEqual([
      expect.objectContaining({
        subjectKey: 'certifications|scheme:supports local growers',
        claimValue: wording,
        exactWording: wording,
      }),
    ]);
    expect(derived.facts[0]?.labelsTags).toBeUndefined();

    const authority = service();
    const { contributorId } = await authority.issueCredential();
    const finalized = await authority.finalizeManualTextAsset({
      contributorId,
      barcode: BARCODE,
      sessionId: 'sess-cert',
      unitId: 'cert-1',
      domain: 'certifications',
      statement: wording,
    });
    expect(finalized.ok).toBe(true);
    if (!finalized.ok) return;
    const admitted = await authority.submit(contributorId, {
      idempotencyKey: 'unmapped-cert',
      barcode: BARCODE,
      facts: [
        {
          domain: 'certifications',
          exactWording: wording,
          claimValue: wording,
          finalizedAssetId: finalized.assetId,
          unitId: 'cert-1',
        } satisfies EvidenceFactInput,
      ],
    });
    const evidence = admitted.snapshot?.prevailing[0]?.evidence;
    expect(admitted.status).toBe('admitted');
    expect(evidence?.exactWording).toBe(wording);
    expect(evidence?.claimValue).toBe(wording);
    expect(evidence?.claimKey).toBe('supports local growers');
    expect(evidence?.labelsTags).toBeUndefined();
    expect(evidence?.certificationLane).toBe('B');
    expect(evidence?.receiverEligibility?.ethics_certifications.eligible).toBe(false);
    expect(isAssessmentEligibleForReceiver(evidence!, 'ethics_certifications')).toBe(false);
  });

  test('a recognised certification still maps to its governed scoring label', async () => {
    const authority = service();
    const { contributorId } = await authority.issueCredential();
    const finalized = await authority.finalizeManualTextAsset({
      contributorId,
      barcode: BARCODE,
      sessionId: 'sess-fair',
      unitId: 'cert-fair',
      domain: 'certifications',
      statement: 'Fairtrade',
      labelsTags: ['en:fair-trade'],
    });
    expect(finalized.ok).toBe(true);
    if (!finalized.ok) return;
    const admitted = await authority.submit(contributorId, {
      idempotencyKey: 'mapped-cert',
      barcode: BARCODE,
      facts: [
        {
          domain: 'certifications',
          exactWording: 'Fairtrade',
          claimValue: 'Fairtrade',
          labelsTags: ['en:fair-trade'],
          finalizedAssetId: finalized.assetId,
          unitId: 'cert-fair',
        },
      ],
    });
    const evidence = admitted.snapshot?.prevailing[0]?.evidence;
    expect(admitted.status).toBe('admitted');
    expect(evidence?.labelsTags).toEqual(['en:fair-trade']);
    expect(evidence?.exactWording).toBe('Fairtrade');
    expect(evidence?.certificationLane).toBe('A');
    expect(evidence?.claimKey).toBe('fair trade');
    expect(isAssessmentEligibleForReceiver(evidence!, 'ethics_certifications')).toBe(true);
  });
});

describe('manual contribution transmission', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    process.env.EXPO_PUBLIC_BACKEND_URL = 'https://authority.example';
    process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV = 'uat';
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => storage.get(key) ?? null);
    (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
      storage.set(key, value);
    });
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_BACKEND_URL;
    delete process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV;
  });

  function reviewedSession(unit: PacketContributionSession['units'][number]): PacketContributionSession {
    return {
      schema: PACKET_SESSION_SCHEMA,
      sessionId: 'manual-session',
      barcode: BARCODE,
      createdAt: 1,
      updatedAt: 1,
      status: 'open',
      sourceAssets: [],
      derivedAssets: [],
      extractionRuns: [],
      units: [unit],
    };
  }

  test('a reviewed manual statement is finalised as manual_text and then submitted', async () => {
    const actions: string[] = [];
    (global.fetch as jest.Mock).mockImplementation(async (_url: string, init?: { method?: string; body?: string }) => {
      if (!init?.body) return { ok: true, json: async () => ({ authorityEnv: 'uat' }) };
      const body = JSON.parse(init.body) as Record<string, unknown>;
      actions.push(String(body.action));
      if (body.action === 'issue-credential') return { ok: true, json: async () => ({ token: 'credential-token' }) };
      if (body.action === 'finalize-manual-text') {
        expect(body.sha256).toBeUndefined();
        expect(body.declaredSha256).toBeUndefined();
        expect(body.packetAbsence).toBe(false);
        expect(body.statement).toBe('oats water');
        expect(body.domain).toBe('ingredients_nutrition');
        return { ok: true, json: async () => ({ ok: true, assetId: 'asset-manual', contentType: 'manual_text' }) };
      }
      if (body.action === 'submit') {
        const facts = body.facts as Array<{ finalizedAssetId?: string; ingredientsText?: string }>;
        expect(facts[0]?.finalizedAssetId).toBe('asset-manual');
        expect(facts[0]?.ingredientsText).toBe('oats water');
        return {
          ok: true,
          json: async () => ({
            outcome: {
              status: 'admitted',
              admittedUnitIds: ['unit-manual'],
              snapshot: {
                barcode: BARCODE,
                authorityEnv: 'uat',
                epoch: 'wave4a.uat',
                recordClass: 'uat',
                generatedAt: 1,
                prevailing: [],
                offDispatch: [],
              },
            },
          }),
        };
      }
      return { ok: false, json: async () => ({}) };
    });
    storage.set(
      PACKET_SESSION_STORAGE_KEY,
      JSON.stringify([
        reviewedSession({
          unitId: 'unit-manual',
          sessionId: 'manual-session',
          domain: 'ingredients_nutrition',
          section: 'ingredients',
          statement: 'oats water',
          support: { coverage: 'whole_image', sourceAssetId: 'manual-text:unit-manual' },
          origin: 'manual',
          extractionRunId: null,
          observationId: null,
          disposition: null,
          status: 'reviewed',
        }),
      ])
    );
    const transmitted = await transmitSessionToAuthority('manual-session');
    expect(actions).toEqual(['issue-credential', 'finalize-manual-text', 'submit']);
    expect(actions).not.toContain('finalize-asset');
    expect(actions).not.toContain('upload-asset-chunk');
    expect(transmitted.admitted).toBe(true);
    expect(transmitted.snapshot?.barcode).toBe(BARCODE);
  });

  test('packet absence without a photograph stays unsent and does not create manual_text', async () => {
    const actions: string[] = [];
    (global.fetch as jest.Mock).mockImplementation(async (_url: string, init?: { body?: string }) => {
      if (!init?.body) return { ok: true, json: async () => ({ authorityEnv: 'uat' }) };
      const body = JSON.parse(init.body) as { action?: string };
      actions.push(body.action || '');
      if (body.action === 'issue-credential') return { ok: true, json: async () => ({ token: 'credential-token' }) };
      return { ok: false, json: async () => ({}) };
    });
    storage.set(
      PACKET_SESSION_STORAGE_KEY,
      JSON.stringify([
        reviewedSession({
          unitId: 'unit-absence',
          sessionId: 'manual-session',
          domain: 'packet_claims',
          statement: 'No claims on this pack',
          packetAbsenceAffirmation: true,
          support: { coverage: 'whole_image', sourceAssetId: 'manual-text:unit-absence' },
          origin: 'manual',
          extractionRunId: null,
          observationId: null,
          disposition: null,
          status: 'reviewed',
        }),
      ])
    );
    const transmitted = await transmitSessionToAuthority('manual-session');
    expect(transmitted).toEqual({ admitted: false, admittedUnitIds: [], pendingOutbox: true, snapshot: null });
    expect(actions).toEqual(['issue-credential']);
  });
});

describe('manual_text fact integrity', () => {
  async function textAsset(
    authority: EvidenceAuthority,
    contributorId: string,
    draft: Parameters<EvidenceAuthority['finalizeManualTextAsset']>[0]
  ) {
    const finalized = await authority.finalizeManualTextAsset(draft);
    expect(finalized.ok).toBe(true);
    if (!finalized.ok) throw new Error(finalized.reason);
    return finalized.assetId;
  }

  test('rejects a same-unit fact that the canonical document does not contain', async () => {
    const authority = service();
    const { contributorId } = await authority.issueCredential();
    const assetId = await textAsset(authority, contributorId, {
      contributorId,
      barcode: BARCODE,
      sessionId: 'sess-inject',
      unitId: 'unit-inject',
      domain: 'ingredients_nutrition',
      statement: 'oats water',
      ingredientsText: 'oats water',
    });
    const injected = await authority.submit(contributorId, {
      idempotencyKey: 'same-unit-injection',
      barcode: BARCODE,
      facts: [
        {
          domain: 'ingredients_nutrition',
          ingredientsText: 'oats water',
          finalizedAssetId: assetId,
          unitId: 'unit-inject',
        },
        {
          domain: 'packet_claims',
          exactWording: 'High protein',
          claimValue: 'High protein',
          finalizedAssetId: assetId,
          unitId: 'unit-inject',
        },
      ],
    });
    expect(injected.status).toBe('source_hash_mismatch');
    expect(injected.snapshot).toBeNull();
  });

  test('rejects a different-unit fact that reuses a manual_text asset', async () => {
    const authority = service();
    const { contributorId } = await authority.issueCredential();
    const assetId = await textAsset(authority, contributorId, {
      contributorId,
      barcode: BARCODE,
      sessionId: 'sess-other-unit',
      unitId: 'unit-real',
      domain: 'packet_claims',
      statement: 'No added sugar',
    });
    const injected = await authority.submit(contributorId, {
      idempotencyKey: 'different-unit-injection',
      barcode: BARCODE,
      facts: [
        {
          domain: 'packet_claims',
          exactWording: 'No added sugar',
          claimValue: 'No added sugar',
          finalizedAssetId: assetId,
          unitId: 'unit-real',
        },
        {
          domain: 'packet_claims',
          exactWording: 'High protein',
          claimValue: 'High protein',
          finalizedAssetId: assetId,
          unitId: 'unit-other',
        },
      ],
    });
    expect(injected.status).toBe('source_hash_mismatch');
    expect(injected.versionIds).toEqual([]);
  });

  test('admits one reviewed nutrition unit only when every stated amount matches', async () => {
    const authority = service();
    const { contributorId } = await authority.issueCredential();
    const assetId = await textAsset(authority, contributorId, {
      contributorId,
      barcode: BARCODE,
      sessionId: 'sess-nutrition',
      unitId: 'unit-nutrition',
      domain: 'ingredients_nutrition',
      nutritionBasis: 'per_100g',
      nutritionAmounts: [
        { attribute: 'sugars', value: 4, unit: 'g' },
        { attribute: 'energy-kj', value: 210, unit: 'kJ' },
      ],
    });
    const partial = await authority.submit(contributorId, {
      idempotencyKey: 'nutrition-partial',
      barcode: BARCODE,
      facts: [
        {
          domain: 'ingredients_nutrition',
          nutritionBasis: 'per_100g',
          nutriments: [{ attribute: 'sugars', value: 4, unit: 'g' }],
          finalizedAssetId: assetId,
          unitId: 'unit-nutrition',
        },
      ],
    });
    expect(partial.status).toBe('source_hash_mismatch');
    const admitted = await authority.submit(contributorId, {
      idempotencyKey: 'nutrition-complete',
      barcode: BARCODE,
      facts: [
        {
          domain: 'ingredients_nutrition',
          nutritionBasis: 'per_100g',
          nutriments: [
            { attribute: 'sugars', value: 4, unit: 'g' },
            { attribute: 'energy-kj', value: 210, unit: 'kJ' },
          ],
          finalizedAssetId: assetId,
          unitId: 'unit-nutrition',
        },
      ],
    });
    expect(admitted.status).toBe('admitted');
    expect(admitted.snapshot?.prevailing.map((row) => row.evidence.claimKey).sort()).toEqual([
      'energy-kj|per_100g',
      'sugars|per_100g',
    ]);
  });

  test('keeps typed origin wording and does not rebuild it from the structured controls', async () => {
    const wording = 'at least 80% from New Zealand';
    const authority = service();
    const { contributorId } = await authority.issueCredential();
    const assetId = await textAsset(authority, contributorId, {
      contributorId,
      barcode: BARCODE,
      sessionId: 'sess-origin',
      unitId: 'unit-origin',
      domain: 'origins',
      statement: wording,
      originClaimType: 'made_in',
      originCountry: 'New Zealand',
    });
    const admitted = await authority.submit(contributorId, {
      idempotencyKey: 'origin-wording',
      barcode: BARCODE,
      facts: [
        {
          domain: 'origins',
          exactWording: wording,
          claimValue: 'New Zealand',
          originStructured: { claimType: 'made_in', primaryCountry: 'New Zealand' },
          finalizedAssetId: assetId,
          unitId: 'unit-origin',
        },
      ],
    });
    expect(admitted.status).toBe('admitted');
    expect(admitted.snapshot?.prevailing[0]?.evidence.exactWording).toBe(wording);
    expect(admitted.snapshot?.prevailing[0]?.evidence.originStructured?.claimType).toBe('made_in');
    expect(admitted.snapshot?.prevailing[0]?.evidence.originStructured?.primaryCountry).toBe('New Zealand');
  });

  test('a forged certification tag cannot become the scoring label', async () => {
    const authority = service();
    const { contributorId } = await authority.issueCredential();
    const unmapped = await authority.finalizeManualTextAsset({
      contributorId,
      barcode: BARCODE,
      sessionId: 'sess-forged',
      unitId: 'unit-forged',
      domain: 'certifications',
      statement: 'Supports local growers',
      labelsTags: ['en:fair-trade'],
    });
    const recognised = await authority.finalizeManualTextAsset({
      contributorId,
      barcode: BARCODE,
      sessionId: 'sess-forged',
      unitId: 'unit-forged-fair',
      domain: 'certifications',
      statement: 'Fairtrade',
      labelsTags: ['en:organic'],
    });
    const recognisedAgain = await authority.finalizeManualTextAsset({
      contributorId,
      barcode: BARCODE,
      sessionId: 'sess-forged',
      unitId: 'unit-forged-fair',
      domain: 'certifications',
      statement: 'Fairtrade',
    });
    expect(unmapped.ok && recognised.ok && recognisedAgain.ok).toBe(true);
    if (!unmapped.ok || !recognised.ok || !recognisedAgain.ok) return;
    expect(recognisedAgain.assetId).toBe(recognised.assetId);
    const laneB = await authority.submit(contributorId, {
      idempotencyKey: 'forged-lane-b',
      barcode: BARCODE,
      facts: [
        {
          domain: 'certifications',
          exactWording: 'Supports local growers',
          claimValue: 'Supports local growers',
          labelsTags: ['en:fair-trade'],
          finalizedAssetId: unmapped.assetId,
          unitId: 'unit-forged',
        },
      ],
    });
    expect(laneB.status).toBe('admitted');
    expect(laneB.snapshot?.prevailing[0]?.evidence.labelsTags).toBeUndefined();
    expect(laneB.snapshot?.prevailing[0]?.evidence.certificationLane).toBe('B');
    expect(isAssessmentEligibleForReceiver(laneB.snapshot!.prevailing[0].evidence, 'ethics_certifications')).toBe(false);
    const laneA = await authority.submit(contributorId, {
      idempotencyKey: 'forged-lane-a',
      barcode: BARCODE,
      facts: [
        {
          domain: 'certifications',
          exactWording: 'Fairtrade',
          claimValue: 'Fairtrade',
          labelsTags: ['en:organic'],
          finalizedAssetId: recognised.assetId,
          unitId: 'unit-forged-fair',
        },
      ],
    });
    expect(laneA.status).toBe('admitted');
    expect(laneA.snapshot?.prevailing.find((row) => row.evidence.exactWording === 'Fairtrade')?.evidence.labelsTags).toEqual([
      'en:fair-trade',
    ]);
  });
});

describe('kept photographs', () => {
  test('every retained photograph is uploaded with the reviewed unit', () => {
    const session: PacketContributionSession = {
      schema: PACKET_SESSION_SCHEMA,
      sessionId: 'photos',
      barcode: BARCODE,
      createdAt: 1,
      updatedAt: 1,
      status: 'open',
      sourceAssets: [],
      derivedAssets: [],
      extractionRuns: [],
      units: [
        {
          unitId: 'unit-photos',
          sessionId: 'photos',
          domain: 'packet_claims',
          statement: 'No added sugar',
          support: { coverage: 'whole_image', sourceAssetId: 'local-a' },
          companionSourceAssetIds: ['local-b', 'local-c'],
          origin: 'manual',
          extractionRunId: null,
          observationId: null,
          disposition: null,
          status: 'reviewed',
        },
      ],
    };
    const facts = evidenceFactsForUnits(
      session,
      session.units,
      new Map([
        ['local-a', 'server-a'],
        ['local-b', 'server-b'],
        ['local-c', 'server-c'],
      ])
    );
    expect(facts[0]?.finalizedAssetId).toBe('server-a');
    expect(facts[0]?.companionFinalizedAssetIds).toEqual(['server-b', 'server-c']);
  });

  test('a second kept photograph is stored on the admitted evidence', async () => {
    const authority = service();
    const { contributorId } = await authority.issueCredential();
    const firstBytes = new TextEncoder().encode('photo-a');
    const secondBytes = new TextEncoder().encode('photo-b');
    const upload = async (uploadId: string, bytes: Uint8Array) => {
      const declaredSha256 = sha256Hex(bytes);
      expect(
        await authority.putAssetChunk({
          uploadId,
          chunkIndex: 0,
          chunkCount: 1,
          totalBytes: bytes.length,
          declaredSha256,
          bytes,
        })
      ).toEqual({ ok: true, stored: 'stored' });
      const finalized = await authority.finalizeAssetUpload({
        uploadId,
        declaredSha256,
        contentType: 'image/jpeg',
        contributorId,
        barcode: BARCODE,
      });
      expect(finalized.ok).toBe(true);
      if (!finalized.ok) throw new Error(finalized.reason);
      return finalized.assetId;
    };
    const primary = await upload('upload-a', firstBytes);
    const companion = await upload('upload-b', secondBytes);
    const admitted = await authority.submit(contributorId, {
      idempotencyKey: 'two-photos',
      barcode: BARCODE,
      facts: [
        {
          domain: 'packet_claims',
          exactWording: 'No added sugar',
          claimValue: 'No added sugar',
          finalizedAssetId: primary,
          companionFinalizedAssetIds: [companion],
          unitId: 'unit-photos',
        },
      ],
    });
    expect(admitted.status).toBe('admitted');
    expect(admitted.snapshot?.prevailing[0]?.evidence.imageUrl).toBe(`private://evidence/${primary}`);
    expect(admitted.snapshot?.prevailing[0]?.evidence.associatedSourceAssetIds).toEqual([companion]);
  });
});

