/**
 * Implementation evidence for the Wave 4A shared evidence authority.
 * These tests exercise the authority service. They are not independent QA.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { isAssessmentEligibleForReceiver } from '../../../contributions/admissionContract';
import { upsertLocalEvidence } from '../../../contributions/evidenceStore';
import { createPendingEvidence } from '../../../contributions/lifecycle';
import {
  selectAdmittedPacketAbsence,
  selectPrevailingPacketClaims,
} from '../../../claims/packetClaimReceiver';
import { stampCoreTruthAuthority } from '../../../config/coreTruthProductCacheAuthority';
import { EvidenceAuthority } from '../../../evidenceAuthority/authority';
import {
  loadAuthoritativeAssessment,
  projectSnapshotForAssessment,
  rememberSnapshot,
} from '../../../evidenceAuthority/assessment';
import { MemoryAuthorityStore } from '../../../evidenceAuthority/memoryStore';
import { EVIDENCE_AUTHORITY_SCHEMA_SQL } from '../../../evidenceAuthority/schemaSql';
import { assertEvidenceAuthoritySchemaReady } from '../../../evidenceAuthority/schemaReady';
import { SCHEMA_IDENTITY_GAPS } from '../../../evidenceAuthority/subjects';
import type { EvidenceFactInput } from '../../../evidenceAuthority/types';
import { selectPrevailingOriginFacts } from '../../../origins/governedFacts';
import { calculateEthicsPillar } from '../../../lib/truscoreEngine/pillars/ethicsPillar';
import { calculateOpenPillar } from '../../../lib/truscoreEngine/pillars/openPillar';
import { publishBodyPillar } from '../../../lib/rateability/bodyPublication';
import { publishClaimsPillar } from '../../../lib/rateability/claimsPublication';
import { publishTransparencyPillar } from '../../../lib/rateability/transparencyPublication';
import type { BodyPillarResult } from '../../../lib/truscoreEngine/pillars/bodyPillar';
import { sha256Hex } from '../../../packetContribution/sha256';
import { PostgresAuthorityStore } from '../../../../backend/vercel/lib/evidenceAuthorityPg';
import type { Product } from '../../../types/product';
import { calculateTrustScore } from '../../../utils/trustScore';

const BARCODE = '9300673555555';
const bytes = new TextEncoder().encode('packet-source');
const hash = sha256Hex(bytes);
const memory = new Map<string, string>();

function service(env: 'uat' | 'production' = 'uat', extra: ConstructorParameters<typeof EvidenceAuthority>[1] = {}) {
  return new EvidenceAuthority(new MemoryAuthorityStore(), {
    authorityEnv: env,
    founderAdminToken: 'founder-uat',
    ...extra,
  });
}

function packet(wording: string): EvidenceFactInput {
  return { domain: 'packet_claims', exactWording: wording, claimValue: wording };
}

async function send(
  authority: EvidenceAuthority,
  contributorId: string,
  facts: EvidenceFactInput[],
  idempotencyKey: string,
  extra: Partial<{ declaredSha256: string; sourceBytes: Uint8Array }> = {}
) {
  return authority.submit(contributorId, {
    idempotencyKey,
    barcode: BARCODE,
    sourceBytes: extra.sourceBytes ?? bytes,
    declaredSha256: extra.declaredSha256 ?? hash,
    facts,
    clientAuthority: {
      admissionStatus: 'admitted',
      productionEpoch: 'forged-epoch',
      recordClass: 'production',
      scoringEligible: true,
      canonicalPromoted: true,
      receiverEligibility: { claims_packet: { eligible: true } },
    },
  });
}

beforeEach(() => {
  memory.clear();
  delete process.env.EXPO_PUBLIC_BACKEND_URL;
  (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => memory.get(key) ?? null);
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
    memory.set(key, value);
  });
});

describe('Wave 4A shared evidence authority', () => {
  it('keeps the migration identical to the Postgres schema and locks subject rows', () => {
    const file = fs.readFileSync(
      path.join(process.cwd(), 'db/migrations/20260928_wave4a_evidence_authority.sql'),
      'utf8'
    );
    expect(file.trim()).toBe(EVIDENCE_AUTHORITY_SCHEMA_SQL.trim());
    expect(file).toContain('evidence_version_content_immutable');
    expect(file).toContain('UNIQUE (subject_id, version_no)');
    expect(file).toContain('idempotency_key TEXT PRIMARY KEY');
    const pg = fs.readFileSync(
      path.join(process.cwd(), 'backend/vercel/lib/evidenceAuthorityPg.ts'),
      'utf8'
    );
    expect(pg).toContain('FOR UPDATE');
    expect(pg).not.toContain('EVIDENCE_AUTHORITY_SCHEMA_SQL');
    expect(pg).toContain('assertSchemaReady');
    const script = fs.readFileSync(
      path.join(process.cwd(), 'backend/vercel/scripts/apply-evidence-authority-schema.cjs'),
      'utf8'
    );
    expect(script).toContain('20260928_wave4a_evidence_authority.sql');
    const api = fs.readFileSync(path.join(process.cwd(), 'backend/vercel/api/evidence-authority.ts'), 'utf8');
    expect(api).toContain('evidence_authority_schema_unavailable');
    expect(api).not.toContain('CREATE TABLE');
    expect(SCHEMA_IDENTITY_GAPS.length).toBeGreaterThan(0);
    expect(() => assertEvidenceAuthoritySchemaReady(null)).toThrow('evidence_authority_schema_unavailable');
    expect(() => assertEvidenceAuthoritySchemaReady('public.evidence_versions')).not.toThrow();
  });

  it('fails a runtime evidence request when the authority schema is absent', async () => {
    const queries: string[] = [];
    const store = new PostgresAuthorityStore({
      query: async (sql: string) => {
        queries.push(sql);
        return { rows: [{ relation: null }] };
      },
      connect: async () => {
        throw new Error('schema check must fail before a connection is used to write');
      },
    });
    await expect(store.transaction(async () => undefined)).rejects.toThrow('evidence_authority_schema_unavailable');
    expect(queries.join('\n')).not.toContain('CREATE TABLE');
  });

  it('allocates distinct versions for concurrent same-subject submissions', async () => {
    const authority = service();
    const contributor = await authority.issueCredential();
    const [first, second] = await Promise.all([
      send(authority, contributor.contributorId, [{ domain: 'ingredients_nutrition', ingredientsText: 'oats' }], 'c1'),
      send(authority, contributor.contributorId, [{ domain: 'ingredients_nutrition', ingredientsText: 'wheat' }], 'c2'),
    ]);
    const rows = await authority.history(BARCODE);
    expect(rows.map((row) => row.versionNo).sort()).toEqual([1, 2]);
    expect(new Set(rows.map((row) => row.versionId)).size).toBe(2);
    expect(first.admissionSeqs[0]).not.toBe(second.admissionSeqs[0]);
    const snapshot = await authority.snapshot(BARCODE);
    expect(snapshot.prevailing).toHaveLength(1);
    expect(snapshot.prevailing[0].admissionSeq).toBe(Math.max(first.admissionSeqs[0], second.admissionSeqs[0]));
  });

  it('returns the existing outcome for an idempotent retry', async () => {
    const authority = service();
    const contributor = await authority.issueCredential();
    const first = await send(authority, contributor.contributorId, [packet('High protein')], 'same');
    const retry = await send(authority, contributor.contributorId, [packet('High protein changed')], 'same');
    expect(retry.versionIds).toEqual(first.versionIds);
    expect(await authority.history(BARCODE)).toHaveLength(1);
    expect((await authority.snapshot(BARCODE)).prevailing[0].evidence.exactWording).toBe('High protein');
  });

  it('lets the latest admitted version prevail and keeps earlier content immutable', async () => {
    const authority = service();
    const store = new MemoryAuthorityStore();
    const locked = new EvidenceAuthority(store, { authorityEnv: 'uat', founderAdminToken: 'founder-uat' });
    const contributor = await locked.issueCredential();
    await send(locked, contributor.contributorId, [packet('High protein')], 'v1');
    await send(locked, contributor.contributorId, [packet('Source of protein')], 'v2');
    const rows = await locked.history(BARCODE);
    expect(rows[0].content.exactWording).toBe('High protein');
    expect(rows[1].content.exactWording).toBe('Source of protein');
    expect((await locked.snapshot(BARCODE)).prevailing[0].evidence.exactWording).toBe('Source of protein');
    expect((await locked.events(rows[0].versionId)).some((event) => event.kind === 'admitted')).toBe(true);
    expect(() => store.dangerouslyRewriteContent()).toThrow('evidence_version_content_immutable');
  });

  it('reinstates the previous admitted version after withdrawal', async () => {
    const authority = service();
    const contributor = await authority.issueCredential();
    const first = await send(authority, contributor.contributorId, [packet('High protein')], 'old');
    const second = await send(authority, contributor.contributorId, [packet('Source of protein')], 'new');
    expect(await authority.govern('founder-uat', second.versionIds[0], 'withdraw')).toEqual({ ok: true });
    const snapshot = await authority.snapshot(BARCODE);
    expect(snapshot.prevailing).toHaveLength(1);
    expect(snapshot.prevailing[0].versionId).toBe(first.versionIds[0]);
    expect(snapshot.prevailing[0].evidence.exactWording).toBe('High protein');
    expect((await authority.history(BARCODE)).find((row) => row.versionId === second.versionIds[0])?.content.exactWording).toBe(
      'Source of protein'
    );
  });

  it('ignores forged client authority fields and admits without a confirmation', async () => {
    const uat = service('uat');
    const uatContributor = await uat.issueCredential();
    const uatOutcome = await send(uat, uatContributor.contributorId, [packet('High protein')], 'forged-uat');
    const uatRow = uatOutcome.snapshot?.prevailing[0];
    expect(uatRow?.evidence.productionEpoch).toBe('wave4a.uat');
    expect(uatRow?.evidence.canonicalPromoted).toBe(false);
    expect(uatRow?.evidence.admission?.admittedBy).toBe('wave4a-evidence-authority');
    const uatProjected = projectSnapshotForAssessment(uatOutcome.snapshot);
    expect(uatProjected[0].productionEpoch).toBe('wave4a.uat');
    expect(uatProjected[0].recordClass).toBeUndefined();
    expect(isAssessmentEligibleForReceiver(uatProjected[0], 'claims_packet')).toBe(false);

    const production = service('production');
    const contributor = await production.issueCredential();
    const outcome = await send(production, contributor.contributorId, [packet('High protein')], 'forged-production');
    const projected = projectSnapshotForAssessment(outcome.snapshot);
    expect(projected[0].productionEpoch).toBe('wave4a.0');
    expect(projected[0].recordClass).toBe('production');
    expect(projected[0].canonicalPromoted).toBe(false);
    expect(projected[0].confirmations).toHaveLength(0);
    expect(isAssessmentEligibleForReceiver(projected[0], 'claims_packet')).toBe(true);
  });

  it('rejects self-confirmation and marks review_required after two disputes without withdrawing', async () => {
    const authority = service('production');
    const author = await authority.issueCredential();
    const other = await authority.issueCredential();
    const third = await authority.issueCredential();
    const outcome = await send(authority, author.contributorId, [packet('High protein')], 'governed');
    const versionId = outcome.versionIds[0];
    expect(await authority.confirm(author.contributorId, versionId)).toMatchObject({
      ok: false,
      reason: 'submitter_cannot_confirm',
    });
    expect(await authority.govern('not-the-founder', versionId, 'suppress')).toEqual({
      ok: false,
      reason: 'admin_unconfigured_or_rejected',
    });
    expect(await authority.dispute(other.contributorId, versionId)).toMatchObject({ ok: true, governance: 'active' });
    expect(await authority.dispute(third.contributorId, versionId)).toMatchObject({
      ok: true,
      governance: 'review_required',
    });
    expect(await authority.dispute(third.contributorId, versionId)).toMatchObject({
      ok: false,
      reason: 'active_response_exists',
    });
    const snapshot = await authority.snapshot(BARCODE);
    expect(snapshot.prevailing[0].governance).toBe('review_required');
    expect(snapshot.prevailing[0].evidence.state).not.toBe('withdrawn');
    const projected = projectSnapshotForAssessment(snapshot);
    expect(isAssessmentEligibleForReceiver(projected[0], 'claims_packet')).toBe(true);
  });

  it('gives both devices the same prevailing snapshot and keeps absence off positive subjects', async () => {
    const authority = service('production');
    const deviceA = await authority.issueCredential();
    const deviceB = await authority.issueCredential();
    await send(authority, deviceA.contributorId, [packet('High protein'), { domain: 'packet_claims', packetAbsence: true }], 'both');
    const left = await authority.snapshot(BARCODE);
    const right = await authority.snapshot(BARCODE);
    expect(right.prevailing.map((row) => row.versionId)).toEqual(left.prevailing.map((row) => row.versionId));
    expect(left.prevailing.map((row) => row.subjectKey)).toEqual(
      expect.arrayContaining([
        'packet_claims|absence|scope:whole_packet',
        expect.stringContaining('packet_claims|register:'),
      ])
    );
    const projected = projectSnapshotForAssessment(left);
    expect(selectPrevailingPacketClaims(projected).map((row) => row.exactWording)).toContain('High protein');
    expect(selectAdmittedPacketAbsence(projected)).toBe(true);
    expect(deviceB.contributorId).not.toBe(deviceA.contributorId);
    await authority.linkAccount(deviceA.contributorId, 'future-account');
    expect((await authority.history(BARCODE))[0].contributorId).toBe(deviceA.contributorId);
  });

  it('does not let UAT evidence into a production authority or projection', async () => {
    const uat = service('uat');
    const production = service('production');
    const contributor = await uat.issueCredential();
    const outcome = await send(uat, contributor.contributorId, [packet('High protein')], 'uat-only');
    expect((await production.snapshot(BARCODE)).prevailing).toHaveLength(0);
    expect(projectSnapshotForAssessment(outcome.snapshot)[0].productionEpoch).toBe('wave4a.uat');
    expect(isAssessmentEligibleForReceiver(projectSnapshotForAssessment(outcome.snapshot)[0], 'claims_packet')).toBe(
      false
    );
    expect(outcome.snapshot?.epoch).toBe('wave4a.uat');
    expect(outcome.snapshot?.recordClass).toBe('uat');
    expect(hash).toBe(createHash('sha256').update(bytes).digest('hex'));
  });

  it('scores from the cache when the snapshot is unavailable and never from local pending evidence', async () => {
    const authority = service();
    const contributor = await authority.issueCredential();
    const outcome = await send(authority, contributor.contributorId, [packet('High protein')], 'cache');
    const missed = await loadAuthoritativeAssessment(BARCODE, {
      fetchSnapshot: async () => {
        throw new Error('offline');
      },
    });
    expect(missed).toMatchObject({ source: 'none', evidence: [] });
    await rememberSnapshot(outcome.snapshot!);
    const cached = await loadAuthoritativeAssessment(BARCODE, {
      fetchSnapshot: async () => {
        throw new Error('offline');
      },
    });
    expect(cached.source).toBe('cache');
    expect(cached.evidence).toHaveLength(outcome.snapshot?.prevailing.length);
    await upsertLocalEvidence(
      createPendingEvidence({
        evidenceId: `${BARCODE}|packet_claims|local|v1`,
        barcode: BARCODE,
        domain: 'packet_claims',
        evidenceVersion: 1,
        claimKey: 'local pending',
        claimValue: 'Not admitted locally',
        exactWording: 'Not admitted locally',
        submitterId: 'local',
        createdAt: 1,
        admissionStatus: 'admitted',
        productionEpoch: 'wave4a.0',
        recordClass: 'production',
      })
    );
    memory.clear();
    const product = stampCoreTruthAuthority({
      barcode: BARCODE,
      product_name: 'Oats',
      source: 'openfoodfacts',
      nutriments: {},
    } as Product);
    (global.fetch as jest.Mock).mockRejectedValue(new Error('offline'));
    const scored = await calculateTrustScore(product);
    expect(scored.rveelGovernedPacketClaims).toBeUndefined();
  });

  it('creates OFF dispatch from admitted nutrition and does not call a live OFF host', async () => {
    const transport = jest.fn(async () => ({ ok: true, status: 200 }));
    const idle = service();
    const contributor = await idle.issueCredential();
    const idleOutcome = await send(
      idle,
      contributor.contributorId,
      [{ domain: 'ingredients_nutrition', ingredientsText: 'oats, water' }],
      'off-idle'
    );
    expect(idleOutcome.snapshot?.offDispatch[0]).toMatchObject({
      status: 'pending_unconfigured',
      target: null,
      readBackStatus: 'not_run',
    });
    expect(idleOutcome.snapshot?.offDispatch[0].fields.ingredients_text).toBe('oats, water');
    expect(transport).not.toHaveBeenCalled();

    const live = service('uat', {
      offTarget: 'https://off.uat.example/cgi/product_jqm2.pl',
      offCredentialsConfigured: true,
      offExecute: true,
      offTransport: transport,
    });
    const writer = await live.issueCredential();
    const sent = await send(live, writer.contributorId, [{ domain: 'ingredients_nutrition', ingredientsText: 'rye' }], 'off-send');
    expect(transport).toHaveBeenCalledWith(
      expect.objectContaining({
        target: 'https://off.uat.example/cgi/product_jqm2.pl',
        fields: expect.objectContaining({ ingredients_text: 'rye' }),
      })
    );
    expect(String(transport.mock.calls[0][0].target)).not.toContain('world.openfoodfacts.org');
    expect(sent.snapshot?.offDispatch[0].status).toBe('sent');
  });

  it('caps Confidence at Limited when a published pillar uses primary contribution evidence', async () => {
    const authority = service('production');
    const contributor = await authority.issueCredential();
    const outcome = await send(
      authority,
      contributor.contributorId,
      [packet('High protein'), { domain: 'packet_claims', packetAbsence: true }],
      'confidence'
    );
    const projected = projectSnapshotForAssessment(outcome.snapshot);
    const ethics = calculateEthicsPillar(
      { barcode: BARCODE, product_name: 'Oats', labels_tags: [], nutriments: {} } as Product,
      { admittedPacketAbsence: selectAdmittedPacketAbsence(projected) }
    );
    const claims = publishClaimsPillar({
      product: { barcode: BARCODE, product_name: 'Oats' } as Product,
      ethics: {
        ...ethics,
        details: {
          ...ethics.details,
          claimsAssessment: {
            ...ethics.details.claimsAssessment!,
            benchmark_checks: [
              { source: 'ktc', status: 'no_finding' },
              { source: 'bbfaw', status: 'no_finding' },
            ],
          },
        },
      },
      authoritative: { claimsPacket: true, claimsBenchmark: true },
    });
    expect(claims.confidence).toBe('limited');
    expect(claims.s26?.code).toBe('CLAIMS_LIMITED_PRIMARY_CONTRIBUTION');

    const body = publishBodyPillar({
      product: {
        barcode: BARCODE,
        nutriscore_grade: 'b',
        nova_group: 1,
        _rveelPrimaryContributionBodyDependence: true,
      } as Product,
      body: {
        score: 15,
        adjustments: [],
        details: { hasNutriScore: true, nutriscoreGrade: 'b', wholeProduceAdjustmentApplied: false },
      } as unknown as BodyPillarResult,
      authoritative: { bodyNutrition: true, bodyProcessing: true },
    });
    expect(body.confidence).toBe('limited');
    expect(body.s26?.code).toBe('BODY_LIMITED_PRIMARY_CONTRIBUTION');

    const origin = await send(
      authority,
      contributor.contributorId,
      [
        {
          domain: 'origins',
          exactWording: 'Honey from New Zealand',
          claimValue: 'New Zealand',
          originStructured: {
            claimType: 'ingredient_origin',
            primaryCountry: 'New Zealand',
            ingredientSubject: 'Honey',
          },
        },
      ],
      'origin-confidence'
    );
    const originFacts = selectPrevailingOriginFacts(projectSnapshotForAssessment(origin.snapshot));
    const honey = {
      barcode: BARCODE,
      product_name: 'Honey',
      source: 'openfoodfacts',
      ingredients_text: 'honey',
      ingredients_text_en: 'honey',
      ingredients_lc: 'en',
      lang: 'en',
      additives_tags: [],
      rveelGovernedOrigins: originFacts,
    } as Product;
    const transparency = publishTransparencyPillar({
      product: honey,
      open: calculateOpenPillar(honey),
      authoritative: { transparencyIngredient: true, transparencyOrigins: true },
    });
    expect(transparency.confidence).toBe('limited');
    expect(transparency.s26?.code).toBe('TRANSPARENCY_LIMITED_PRIMARY_CONTRIBUTION');
  });

  it('uses the frozen origin subject for each claim type and versions a later country', async () => {
    const authority = service('production');
    const contributor = await authority.issueCredential();
    const origin = (
      claimType: 'made_in' | 'packed_in' | 'grown_in' | 'produced_in' | 'ingredient_origin',
      country: string,
      ingredientSubject?: string
    ): EvidenceFactInput => ({
      domain: 'origins',
      claimValue: country,
      exactWording: `${claimType} ${country}`,
      originStructured: { claimType, primaryCountry: country, ingredientSubject },
    });
    await send(
      authority,
      contributor.contributorId,
      [
        origin('made_in', 'New Zealand'),
        origin('packed_in', 'Australia'),
        origin('grown_in', 'Fiji', 'sugar'),
        origin('produced_in', 'Italy', 'tomatoes'),
        origin('ingredient_origin', 'Ghana', 'cocoa'),
        origin('ingredient_origin', 'New Zealand', 'honey'),
      ],
      'origin-subjects'
    );
    expect((await authority.snapshot(BARCODE)).prevailing.map((row) => row.subjectKey).sort()).toEqual([
      'origins|grown_in',
      'origins|ingredient_origin:cocoa',
      'origins|ingredient_origin:honey',
      'origins|made_in',
      'origins|packed_in',
      'origins|produced_in',
    ]);
    await send(authority, contributor.contributorId, [origin('made_in', 'Australia')], 'made-in-australia');
    const madeIn = (await authority.history(BARCODE)).filter((row) => row.subjectKey === 'origins|made_in');
    expect(madeIn.map((row) => row.versionNo).sort()).toEqual([1, 2]);
    expect(madeIn.find((row) => row.versionNo === 1)?.content.claimValue).toBe('New Zealand');
    expect(
      (await authority.snapshot(BARCODE)).prevailing.find((row) => row.subjectKey === 'origins|made_in')?.evidence
        .claimValue
    ).toBe('Australia');
    await send(authority, contributor.contributorId, [origin('grown_in', 'Brazil', 'coffee')], 'grown-coffee');
    const grown = (await authority.history(BARCODE)).filter((row) => row.subjectKey === 'origins|grown_in');
    expect(grown.map((row) => row.versionNo).sort()).toEqual([1, 2]);
    expect(
      (await authority.snapshot(BARCODE)).prevailing.filter((row) => row.subjectKey === 'origins|grown_in')
    ).toHaveLength(1);
    expect(
      (await authority.snapshot(BARCODE)).prevailing
        .map((row) => row.subjectKey)
        .filter((key) => key.startsWith('origins|ingredient_origin:'))
        .sort()
    ).toEqual(['origins|ingredient_origin:cocoa', 'origins|ingredient_origin:honey']);
  });

  it('rejects a mismatched source hash before admission', async () => {
    const authority = service();
    const contributor = await authority.issueCredential();
    const outcome = await send(authority, contributor.contributorId, [packet('High protein')], 'bad-hash', {
      declaredSha256: 'deadbeef',
    });
    expect(outcome.status).toBe('source_hash_mismatch');
    expect(await authority.history(BARCODE)).toHaveLength(0);
  });
});
