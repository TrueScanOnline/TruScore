/**
 * WP-09 pre-deployment correctives R1–R3 + concurrency.
 */

import fs from 'fs';
import path from 'path';
import type { Product } from '../../../types/product';
import type { SharedEvidenceSnapshot } from '../../../evidenceAuthority/types';
import type { ContributionEvidence } from '../../../contributions/types';
import {
  agreementControlsVisible,
  agreementSurfaceGate,
  COMMUNITY_ADDED_CAPTION,
  CommunityAgreementService,
  createMemoryAgreementStore,
  localAgreementEligibility,
  nutritionRowIsCommunity,
  selectAgreementTargets,
  buildAgreementRevision,
  communityAgreementScopeHint,
} from '../../../communityAgreement';

function settledProduct(input: {
  overall?: 'rated' | 'nr' | 'checking';
  body?: 'rated' | 'nr' | 'checking';
  planet?: 'rated' | 'nr' | 'checking';
  claims?: 'rated' | 'nr' | 'checking';
  transparency?: 'rated' | 'nr' | 'checking';
  omitPillar?: 'body' | 'planet' | 'claims' | 'transparency';
  settled?: boolean;
  publishedScore?: number;
  barcode?: string;
} = {}): Product {
  const publication: Record<string, unknown> = {
    settled: input.settled !== false,
    body: {
      publicationStatus: input.body ?? 'rated',
      publishedScore: input.publishedScore ?? 12,
      assessmentLanes: { nutrition: 'resolved', processing: 'resolved' },
    },
    planet: {
      publicationStatus: input.planet ?? 'rated',
      publishedScore: input.publishedScore ?? 12,
      assessmentLanes: { broad_environment: 'resolved', packaging_fallback: 'resolved' },
    },
    claims: {
      publicationStatus: input.claims ?? 'rated',
      publishedScore: input.publishedScore ?? 12,
      assessmentLanes: { packet: 'assessed', benchmark: 'assessed' },
    },
    transparency: {
      publicationStatus: input.transparency ?? 'rated',
      publishedScore: input.publishedScore ?? 12,
      assessmentLanes: { ingredient_clarity: 'resolved', origins: 'resolved' },
    },
    overall: {
      publicationStatus: input.overall ?? 'rated',
      publishedScore: input.publishedScore ?? 48,
    },
  };
  if (input.omitPillar) delete publication[input.omitPillar];
  return {
    barcode: input.barcode ?? '9300000000001',
    _publication: publication,
  } as Product;
}

function evidence(partial: Partial<ContributionEvidence> & Pick<ContributionEvidence, 'evidenceId' | 'domain' | 'submitterId'>): ContributionEvidence {
  return {
    barcode: '9300000000001',
    evidenceVersion: 1,
    claimKey: 'x',
    claimValue: 'x',
    confirmations: [],
    disputes: [],
    state: 'admitted',
    scoringEligible: true,
    canonicalPromoted: false,
    createdAt: 1,
    updatedAt: 1,
    ...partial,
  } as ContributionEvidence;
}

function originsSnap(versionId: string): SharedEvidenceSnapshot {
  return {
    barcode: '9300000000001',
    authorityEnv: 'uat',
    epoch: 'wave4a.uat',
    recordClass: 'uat',
    generatedAt: 1,
    prevailing: [
      {
        subjectKey: 'origins|made_in',
        versionId,
        versionNo: 1,
        admissionSeq: 1,
        governance: 'active',
        evidence: evidence({
          evidenceId: '9300000000001|origins|made_in|v1',
          domain: 'origins',
          submitterId: 'rveel_author',
          originStructured: {
            claimType: 'made_in',
            primaryCountry: 'Australia',
            countries: ['Australia'],
          },
        }),
      },
    ],
    offDispatch: [],
  };
}

describe('WP09-R1 settlement gate (reproduce fail-closed cases)', () => {
  const barcode = '9300000000001';

  it('Checking overall with cached evidence: no surface', () => {
    const product = settledProduct({ overall: 'checking' });
    expect(
      agreementSurfaceGate('origins', product, {
        publicationSettled: true,
        settledBarcode: barcode,
        currentBarcode: barcode,
      }).ok
    ).toBe(false);
  });

  it('Overall Rated but one pillar Checking: no surface', () => {
    const product = settledProduct({ overall: 'rated', body: 'checking' });
    expect(
      agreementSurfaceGate('nutrition', product, {
        publicationSettled: true,
        settledBarcode: barcode,
        currentBarcode: barcode,
      }).ok
    ).toBe(false);
  });

  it('Missing pillar: no surface', () => {
    const product = settledProduct({ omitPillar: 'planet' });
    expect(
      agreementSurfaceGate('ingredients', product, {
        publicationSettled: true,
        settledBarcode: barcode,
        currentBarcode: barcode,
      }).ok
    ).toBe(false);
  });

  it('Closed Result latch: no surface', () => {
    const product = settledProduct();
    expect(
      agreementSurfaceGate('origins', product, {
        publicationSettled: false,
        settledBarcode: barcode,
        currentBarcode: barcode,
      }).ok
    ).toBe(false);
  });

  it('Latch closing between display and tap: Agree visibility and revalidate fail', () => {
    const product = settledProduct();
    const open = agreementSurfaceGate('origins', product, {
      publicationSettled: true,
      settledBarcode: barcode,
      currentBarcode: barcode,
    });
    expect(open.ok).toBe(true);
    const closed = agreementSurfaceGate('origins', product, {
      publicationSettled: false,
      settledBarcode: barcode,
      currentBarcode: barcode,
    });
    expect(closed.ok).toBe(false);
    expect(
      agreementControlsVisible(
        { eligible: true, revisionId: 'abc' },
        {
          authorityEnv: 'uat',
          barcode,
          variantKey: '',
          cardGroup: 'origins',
          revisionId: 'abc',
          count: 1,
          eligible: true,
        },
        false
      )
    ).toBe(false);
  });

  it('Settled NR with eligible Change: surface available', () => {
    const product = settledProduct({
      overall: 'nr',
      body: 'nr',
      planet: 'nr',
      claims: 'nr',
      transparency: 'nr',
    });
    expect(
      agreementSurfaceGate('nutrition', product, {
        publicationSettled: true,
        settledBarcode: barcode,
        currentBarcode: barcode,
      }).ok
    ).toBe(true);
  });

  it('Settled Rated with genuine published zero: surface available', () => {
    const product = settledProduct({ publishedScore: 0 });
    expect(
      agreementSurfaceGate('nutrition', product, {
        publicationSettled: true,
        settledBarcode: barcode,
        currentBarcode: barcode,
      }).ok
    ).toBe(true);
  });
});

describe('WP09-R2 memory guard is labelled test/local only', () => {
  it('documents production uses Postgres buckets in API and migration', () => {
    const api = fs.readFileSync(
      path.join(__dirname, '../../../../backend/vercel/api/community-agreement.ts'),
      'utf8'
    );
    const pg = fs.readFileSync(
      path.join(__dirname, '../../../../backend/vercel/lib/communityAgreementPg.ts'),
      'utf8'
    );
    const sql = fs.readFileSync(
      path.join(__dirname, '../../../../db/migrations/20261107_wp09_community_agreements.sql'),
      'utf8'
    );
    expect(api).toContain('createPostgresAgreementAbuseGuard');
    expect(api).not.toContain('createMemoryAgreementAbuseGuard');
    expect(pg).toContain('community_agreement_rate_buckets');
    expect(sql).toContain('community_agreement_rate_buckets');
  });
});

describe('WP09-R3 community markers', () => {
  it('marks only community nutrition rows that drive the displayed value', () => {
    expect(
      nutritionRowIsCommunity('sugars', { sugars_100g: 1, fat_100g: 2 }, ['sugars_100g', 'fat_100g'])
    ).toBe(true);
    expect(nutritionRowIsCommunity('proteins', { sugars_100g: 1 }, ['sugars_100g'])).toBe(false);
    expect(
      nutritionRowIsCommunity('energy-kcal', { 'energy-kj_100g': 1674 }, ['energy-kj_100g'])
    ).toBe(true);
    expect(
      nutritionRowIsCommunity(
        'energy-kcal',
        { 'energy-kcal_100g': 400, 'energy-kj_100g': 1674 },
        ['energy-kj_100g']
      )
    ).toBe(false);
  });

  it('scope hint names community-added rows and caption is not Confidence', () => {
    expect(COMMUNITY_ADDED_CAPTION).toBe('Community-added');
    expect(COMMUNITY_ADDED_CAPTION.toLowerCase()).not.toContain('confidence');
    const hint = communityAgreementScopeHint('nutrition', {
      barcode: '1',
      nutriments: { sugars_100g: 1 },
      rveelGovernedNutrimentKeys: ['sugars_100g'],
    } as Product);
    expect(hint).toContain('Sugars');
    expect(hint.toLowerCase()).not.toContain('confidence');
  });

  it('NutritionTable and Result wire Community-added captions', () => {
    const nutrition = fs.readFileSync(
      path.join(__dirname, '../../../components/NutritionTable.tsx'),
      'utf8'
    );
    const result = fs.readFileSync(path.join(__dirname, '../../../../app/result/[barcode].tsx'), 'utf8');
    expect(nutrition).toContain('COMMUNITY_ADDED_CAPTION');
    expect(nutrition).toContain('communityNutrimentKeys');
    expect(result).toContain('communityAdded={!!product.rveelGovernedIngredientsText}');
    expect(result).toContain('COMMUNITY_ADDED_CAPTION');
    expect(result).toContain('agreementSurfaceGate');
  });
});

describe('WP09 concurrency: agreements never transfer to a newer revision', () => {
  it('inserts against the validated revision only; newer revision stays at zero', async () => {
    const store = createMemoryAgreementStore();
    let snap = originsSnap('ver_1');
    const service = new CommunityAgreementService({
      authorityEnv: 'uat',
      store,
      newId: () => `agr_${store.rows.length + 1}`,
      revalidateSnapshot: async () => snap,
    });
    const firstRevision = buildAgreementRevision({
      authorityEnv: 'uat',
      barcode: '9300000000001',
      variantKey: '',
      cardGroup: 'origins',
      pairs: selectAgreementTargets('origins', snap),
    });
    const agreed = await service.agree({
      barcode: '9300000000001',
      cardGroup: 'origins',
      expectedRevisionId: firstRevision.revisionId,
      contributorId: 'rveel_reader',
      snapshot: snap,
    });
    expect(agreed.ok && agreed.body.count).toBe(1);

    snap = originsSnap('ver_2');
    const stale = await service.agree({
      barcode: '9300000000001',
      cardGroup: 'origins',
      expectedRevisionId: firstRevision.revisionId,
      contributorId: 'rveel_other',
      snapshot: snap,
    });
    expect(stale).toEqual({ ok: false, status: 409, reason: 'stale_revision' });

    const newer = await service.get({
      barcode: '9300000000001',
      cardGroup: 'origins',
      snapshot: snap,
    });
    expect(newer.ok && newer.body.count).toBe(0);
    expect(newer.ok && newer.body.revisionId).not.toBe(firstRevision.revisionId);
  });

  it('revalidateSnapshot mismatch rejects before insert', async () => {
    const store = createMemoryAgreementStore();
    const initial = originsSnap('ver_1');
    const service = new CommunityAgreementService({
      authorityEnv: 'uat',
      store,
      newId: () => 'agr_x',
      revalidateSnapshot: async () => originsSnap('ver_2'),
    });
    const revision = buildAgreementRevision({
      authorityEnv: 'uat',
      barcode: '9300000000001',
      variantKey: '',
      cardGroup: 'origins',
      pairs: selectAgreementTargets('origins', initial),
    });
    const result = await service.agree({
      barcode: '9300000000001',
      cardGroup: 'origins',
      expectedRevisionId: revision.revisionId,
      contributorId: 'rveel_reader',
      snapshot: initial,
    });
    expect(result).toEqual({ ok: false, status: 409, reason: 'stale_revision' });
    expect(store.rows).toHaveLength(0);
  });
});

describe('WP09 local eligibility still requires identifiable community facts', () => {
  it('hides when presentation cannot identify community nutrition keys', () => {
    const snap: SharedEvidenceSnapshot = {
      barcode: '9300000000001',
      authorityEnv: 'uat',
      epoch: 'wave4a.uat',
      recordClass: 'uat',
      generatedAt: 1,
      prevailing: [
        {
          subjectKey: 'ingredients_nutrition|nutrient:sugars|basis:per_100g',
          versionId: 'ver_s',
          versionNo: 1,
          admissionSeq: 1,
          governance: 'active',
          evidence: evidence({
            evidenceId: 'e-s',
            domain: 'ingredients_nutrition',
            submitterId: 'a',
            ingredientsNutrition: {
              nutritionBasis: 'per_100g',
              nutriments: [{ attribute: 'sugars', value: 1, unit: 'g' }],
              nutritionComplete: false,
            },
          }),
        },
      ],
      offDispatch: [],
    };
    const product = {
      barcode: '9300000000001',
      rveelGovernedNutrimentKeys: undefined,
      nutriments: { sugars_100g: 1 },
    } as Product;
    expect(localAgreementEligibility('nutrition', product, snap).eligible).toBe(false);
  });
});
