/**
 * WP-09 Community Agreements — revision, eligibility, service behaviour, isolation.
 */

import {
  CommunityAgreementService,
  buildAgreementRevision,
  computeAgreementRevisionId,
  createMemoryAgreementAbuseGuard,
  createMemoryAgreementStore,
  localAgreementEligibility,
  agreementControlsVisible,
  presentationMatchesAgreementTargets,
  resolveAgreementVariantKey,
  selectAgreementTargets,
  eligibleAgreementChangeJourney,
  COMMUNITY_AGREEMENT_EMPTY_VARIANT,
} from '../../../communityAgreement';
import type { SharedEvidenceSnapshot } from '../../../evidenceAuthority/types';
import type { Product } from '../../../types/product';
import type { ContributionEvidence } from '../../../contributions/types';

function evidence(partial: Partial<ContributionEvidence> & Pick<ContributionEvidence, 'evidenceId' | 'domain' | 'submitterId'>): ContributionEvidence {
  return {
    barcode: '9300675028732',
    evidenceVersion: 1,
    claimKey: partial.claimKey || 'x',
    claimValue: partial.claimValue || 'x',
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

function snapshot(rows: SharedEvidenceSnapshot['prevailing'], env: 'uat' | 'production' = 'uat'): SharedEvidenceSnapshot {
  return {
    barcode: '9300675028732',
    authorityEnv: env,
    epoch: 'wave4a.uat',
    recordClass: env,
    generatedAt: 100,
    prevailing: rows,
    offDispatch: [],
  };
}

describe('WP-09 revision identity', () => {
  it('is deterministic for sorted subject/version pairs', () => {
    const a = computeAgreementRevisionId({
      authorityEnv: 'uat',
      barcode: '9300675028732',
      variantKey: '',
      cardGroup: 'origins',
      pairs: [
        { subjectKey: 'origins|made_in', versionId: 'ver_b' },
        { subjectKey: 'origins|grown_in', versionId: 'ver_a' },
      ],
    });
    const b = computeAgreementRevisionId({
      authorityEnv: 'uat',
      barcode: '9300675028732',
      variantKey: '',
      cardGroup: 'origins',
      pairs: [
        { subjectKey: 'origins|grown_in', versionId: 'ver_a' },
        { subjectKey: 'origins|made_in', versionId: 'ver_b' },
      ],
    });
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it('changes when a versionId changes (identical-content re-admit resets)', () => {
    const first = computeAgreementRevisionId({
      authorityEnv: 'uat',
      barcode: '9300675028732',
      variantKey: '',
      cardGroup: 'ingredients',
      pairs: [{ subjectKey: 'ingredients_nutrition|ingredients_text', versionId: 'ver_1' }],
    });
    const second = computeAgreementRevisionId({
      authorityEnv: 'uat',
      barcode: '9300675028732',
      variantKey: '',
      cardGroup: 'ingredients',
      pairs: [{ subjectKey: 'ingredients_nutrition|ingredients_text', versionId: 'ver_2' }],
    });
    expect(first).not.toBe(second);
  });

  it('rejects non-empty client variant labels', () => {
    expect(resolveAgreementVariantKey('pack-a')).toEqual({ ok: false, reason: 'unsupported_variant' });
    expect(resolveAgreementVariantKey('')).toEqual({
      ok: true,
      variantKey: COMMUNITY_AGREEMENT_EMPTY_VARIANT,
    });
  });
});

describe('WP-09 target selection', () => {
  it('selects nutrition per_100g displayable nutrients only', () => {
    const snap = snapshot([
      {
        subjectKey: 'ingredients_nutrition|nutrient:fat|basis:per_100g',
        versionId: 'ver_fat',
        versionNo: 1,
        admissionSeq: 1,
        governance: 'active',
        evidence: evidence({
          evidenceId: 'e-fat',
          domain: 'ingredients_nutrition',
          submitterId: 'rveel_submitter',
          ingredientsNutrition: {
            nutritionBasis: 'per_100g',
            nutriments: [{ attribute: 'fat', value: 10, unit: 'g' }],
            nutritionComplete: false,
          },
        }),
      },
      {
        subjectKey: 'ingredients_nutrition|nutrient:fat|basis:per_serving',
        versionId: 'ver_serving',
        versionNo: 1,
        admissionSeq: 2,
        governance: 'active',
        evidence: evidence({
          evidenceId: 'e-fat-s',
          domain: 'ingredients_nutrition',
          submitterId: 'rveel_submitter',
        }),
      },
      {
        subjectKey: 'ingredients_nutrition|ingredients_text',
        versionId: 'ver_ing',
        versionNo: 1,
        admissionSeq: 3,
        governance: 'active',
        evidence: evidence({
          evidenceId: 'e-ing',
          domain: 'ingredients_nutrition',
          submitterId: 'rveel_submitter',
          ingredientsNutrition: { ingredientsText: 'Oats', nutritionComplete: false },
        }),
      },
    ]);
    expect(selectAgreementTargets('nutrition', snap)).toEqual([
      { subjectKey: 'ingredients_nutrition|nutrient:fat|basis:per_100g', versionId: 'ver_fat' },
    ]);
    expect(selectAgreementTargets('ingredients', snap)).toEqual([
      { subjectKey: 'ingredients_nutrition|ingredients_text', versionId: 'ver_ing' },
    ]);
  });

  it('hides OFF-only nutrition and ingredients presentation', () => {
    const snap = snapshot([]);
    const product = {
      barcode: '9300675028732',
      nutriments: { fat_100g: 1 },
      ingredients_text: 'OFF oats',
    } as Product;
    expect(localAgreementEligibility('nutrition', product, snap).eligible).toBe(false);
    expect(localAgreementEligibility('ingredients', product, snap).eligible).toBe(false);
  });
});

describe('WP-09 presentation match', () => {
  it('requires governed nutrition keys to match the authoritative target set', () => {
    const snap = snapshot([
      {
        subjectKey: 'ingredients_nutrition|nutrient:sugars|basis:per_100g',
        versionId: 'ver_s',
        versionNo: 1,
        admissionSeq: 1,
        governance: 'active',
        evidence: evidence({
          evidenceId: 'e-s',
          domain: 'ingredients_nutrition',
          submitterId: 'rveel_a',
          ingredientsNutrition: {
            nutritionBasis: 'per_100g',
            nutriments: [{ attribute: 'sugars', value: 12, unit: 'g' }],
            nutritionComplete: false,
          },
        }),
      },
    ]);
    const pairs = selectAgreementTargets('nutrition', snap);
    const matched = {
      barcode: '9300675028732',
      rveelGovernedNutrimentKeys: ['sugars_100g'],
      nutriments: { sugars_100g: 12, fat_100g: 9 },
    } as Product;
    const mismatched = {
      barcode: '9300675028732',
      rveelGovernedNutrimentKeys: ['sugars_100g', 'fat_100g'],
      nutriments: { sugars_100g: 12, fat_100g: 9 },
    } as Product;
    expect(presentationMatchesAgreementTargets('nutrition', matched, snap, pairs)).toBe(true);
    expect(presentationMatchesAgreementTargets('nutrition', mismatched, snap, pairs)).toBe(false);
    expect(localAgreementEligibility('nutrition', mismatched, snap).reason).toBe('presentation_mismatch');
  });

  it('matches ingredients only when governed text equals the prevailing contribution', () => {
    const snap = snapshot([
      {
        subjectKey: 'ingredients_nutrition|ingredients_text',
        versionId: 'ver_i',
        versionNo: 1,
        admissionSeq: 1,
        governance: 'active',
        evidence: evidence({
          evidenceId: 'e-i',
          domain: 'ingredients_nutrition',
          submitterId: 'rveel_a',
          ingredientsNutrition: { ingredientsText: 'Raspberries', nutritionComplete: false },
        }),
      },
    ]);
    const pairs = selectAgreementTargets('ingredients', snap);
    expect(
      presentationMatchesAgreementTargets(
        'ingredients',
        { barcode: '9300675028732', rveelGovernedIngredientsText: 'Raspberries' } as Product,
        snap,
        pairs
      )
    ).toBe(true);
    expect(
      presentationMatchesAgreementTargets(
        'ingredients',
        { barcode: '9300675028732', ingredients_text: 'Raspberries' } as Product,
        snap,
        pairs
      )
    ).toBe(false);
  });
});

describe('WP-09 agreement service', () => {
  function originsSnap(versionId: string, submitterId: string): SharedEvidenceSnapshot {
    return snapshot([
      {
        subjectKey: 'origins|made_in',
        versionId,
        versionNo: 1,
        admissionSeq: 1,
        governance: 'active',
        evidence: evidence({
          evidenceId: `9300675028732|origins|made_in|v1`,
          domain: 'origins',
          submitterId,
          claimKey: 'made_in',
          originStructured: {
            claimType: 'made_in',
            primaryCountry: 'Australia',
            countries: ['Australia'],
          },
        }),
      },
    ]);
  }

  it('starts at zero, increments once per credential, and rejects duplicates and self-agreement', async () => {
    const store = createMemoryAgreementStore();
    const service = new CommunityAgreementService({
      authorityEnv: 'uat',
      store,
      abuse: createMemoryAgreementAbuseGuard({ perCredentialPerMinute: 100 }),
      newId: () => `agr_${store.rows.length + 1}`,
    });
    const snap = originsSnap('ver_1', 'rveel_author');
    const pairs = selectAgreementTargets('origins', snap);
    const revision = buildAgreementRevision({
      authorityEnv: 'uat',
      barcode: '9300675028732',
      variantKey: '',
      cardGroup: 'origins',
      pairs,
    });

    const initial = await service.get({
      barcode: '9300675028732',
      cardGroup: 'origins',
      snapshot: snap,
    });
    expect(initial.ok && initial.body.count).toBe(0);

    const first = await service.agree({
      barcode: '9300675028732',
      cardGroup: 'origins',
      expectedRevisionId: revision.revisionId,
      contributorId: 'rveel_reader',
      snapshot: snap,
    });
    expect(first.ok && first.body.count).toBe(1);

    const again = await service.agree({
      barcode: '9300675028732',
      cardGroup: 'origins',
      expectedRevisionId: revision.revisionId,
      contributorId: 'rveel_reader',
      snapshot: snap,
    });
    expect(again.ok && again.body.count).toBe(1);

    const second = await service.agree({
      barcode: '9300675028732',
      cardGroup: 'origins',
      expectedRevisionId: revision.revisionId,
      contributorId: 'rveel_other',
      snapshot: snap,
    });
    expect(second.ok && second.body.count).toBe(2);

    const self = await service.agree({
      barcode: '9300675028732',
      cardGroup: 'origins',
      expectedRevisionId: revision.revisionId,
      contributorId: 'rveel_author',
      snapshot: snap,
    });
    expect(self).toEqual({ ok: false, status: 403, reason: 'self_agreement_not_allowed' });
  });

  it('rejects stale revisions and unsupported variants; preserves count across unrelated group', async () => {
    const store = createMemoryAgreementStore();
    const service = new CommunityAgreementService({
      authorityEnv: 'uat',
      store,
      newId: () => `agr_${store.rows.length + 1}`,
    });
    const snap = originsSnap('ver_1', 'rveel_author');
    const revision = buildAgreementRevision({
      authorityEnv: 'uat',
      barcode: '9300675028732',
      variantKey: '',
      cardGroup: 'origins',
      pairs: selectAgreementTargets('origins', snap),
    });
    await service.agree({
      barcode: '9300675028732',
      cardGroup: 'origins',
      expectedRevisionId: revision.revisionId,
      contributorId: 'rveel_reader',
      snapshot: snap,
    });

    const stale = await service.agree({
      barcode: '9300675028732',
      cardGroup: 'origins',
      expectedRevisionId: 'deadbeef',
      contributorId: 'rveel_other',
      snapshot: snap,
    });
    expect(stale).toEqual({ ok: false, status: 409, reason: 'stale_revision' });

    const variant = await service.agree({
      barcode: '9300675028732',
      cardGroup: 'origins',
      expectedRevisionId: revision.revisionId,
      variantKey: 'pack-x',
      contributorId: 'rveel_other',
      snapshot: snap,
    });
    expect(variant).toEqual({ ok: false, status: 400, reason: 'unsupported_variant' });

    const after = await service.get({
      barcode: '9300675028732',
      cardGroup: 'origins',
      snapshot: snap,
    });
    expect(after.ok && after.body.count).toBe(1);

    const ingredientsGet = await service.get({
      barcode: '9300675028732',
      cardGroup: 'ingredients',
      snapshot: snap,
    });
    expect(ingredientsGet.ok && ingredientsGet.body.eligible).toBe(false);
  });

  it('resets displayed count when a new admitted version forms a new revision', async () => {
    const store = createMemoryAgreementStore();
    const service = new CommunityAgreementService({
      authorityEnv: 'uat',
      store,
      newId: () => `agr_${store.rows.length + 1}`,
    });
    const firstSnap = originsSnap('ver_1', 'rveel_author');
    const firstRevision = buildAgreementRevision({
      authorityEnv: 'uat',
      barcode: '9300675028732',
      variantKey: '',
      cardGroup: 'origins',
      pairs: selectAgreementTargets('origins', firstSnap),
    });
    await service.agree({
      barcode: '9300675028732',
      cardGroup: 'origins',
      expectedRevisionId: firstRevision.revisionId,
      contributorId: 'rveel_reader',
      snapshot: firstSnap,
    });

    const secondSnap = originsSnap('ver_2', 'rveel_corrector');
    const secondGet = await service.get({
      barcode: '9300675028732',
      cardGroup: 'origins',
      snapshot: secondSnap,
    });
    expect(secondGet.ok && secondGet.body.count).toBe(0);
    expect(secondGet.ok && secondGet.body.revisionId).not.toBe(firstRevision.revisionId);
  });

  it('handles concurrent duplicate inserts without double-counting one credential', async () => {
    const store = createMemoryAgreementStore();
    const service = new CommunityAgreementService({
      authorityEnv: 'uat',
      store,
      newId: () => `agr_${Math.random().toString(16).slice(2)}`,
    });
    const snap = originsSnap('ver_1', 'rveel_author');
    const revision = buildAgreementRevision({
      authorityEnv: 'uat',
      barcode: '9300675028732',
      variantKey: '',
      cardGroup: 'origins',
      pairs: selectAgreementTargets('origins', snap),
    });
    const results = await Promise.all([
      service.agree({
        barcode: '9300675028732',
        cardGroup: 'origins',
        expectedRevisionId: revision.revisionId,
        contributorId: 'rveel_reader',
        snapshot: snap,
      }),
      service.agree({
        barcode: '9300675028732',
        cardGroup: 'origins',
        expectedRevisionId: revision.revisionId,
        contributorId: 'rveel_reader',
        snapshot: snap,
      }),
    ]);
    expect(results.every((row) => row.ok)).toBe(true);
    const counted = await service.get({
      barcode: '9300675028732',
      cardGroup: 'origins',
      snapshot: snap,
    });
    expect(counted.ok && counted.body.count).toBe(1);
  });

  it('isolates uat from production by authorityEnv', async () => {
    const store = createMemoryAgreementStore();
    const uat = new CommunityAgreementService({ authorityEnv: 'uat', store, newId: () => 'agr_u' });
    const prod = new CommunityAgreementService({
      authorityEnv: 'production',
      store,
      newId: () => 'agr_p',
    });
    const uatSnap = originsSnap('ver_1', 'rveel_author');
    const prodSnap = snapshot(uatSnap.prevailing, 'production');
    const uatRevision = buildAgreementRevision({
      authorityEnv: 'uat',
      barcode: '9300675028732',
      variantKey: '',
      cardGroup: 'origins',
      pairs: selectAgreementTargets('origins', uatSnap),
    });
    await uat.agree({
      barcode: '9300675028732',
      cardGroup: 'origins',
      expectedRevisionId: uatRevision.revisionId,
      contributorId: 'rveel_reader',
      snapshot: uatSnap,
    });
    const prodGet = await prod.get({
      barcode: '9300675028732',
      cardGroup: 'origins',
      snapshot: prodSnap,
    });
    expect(prodGet.ok && prodGet.body.count).toBe(0);
  });
});

describe('WP-09 client visibility and thumbs-down gate', () => {
  it('hides controls on client/server revision mismatch', () => {
    expect(
      agreementControlsVisible(
        { eligible: true, revisionId: 'aaa' },
        {
          authorityEnv: 'uat',
          barcode: '9300675028732',
          variantKey: '',
          cardGroup: 'origins',
          revisionId: 'bbb',
          count: 3,
          eligible: true,
        }
      )
    ).toBe(false);
  });

  it('opens Change only when voluntary Change journey exists', () => {
    const closed = eligibleAgreementChangeJourney('origins', { barcode: '1' } as Product, {
      publicationSettled: false,
    });
    expect(closed.ok).toBe(false);
  });
});

describe('WP-09 isolation wall (source contract)', () => {
  it('does not import confirm/dispute or evidence_responses writers', () => {
    const fs = require('fs') as typeof import('fs');
    const path = require('path') as typeof import('path');
    const root = path.join(__dirname, '../../../communityAgreement');
    const files = fs.readdirSync(root).filter((name: string) => name.endsWith('.ts'));
    const joined = files.map((name: string) => fs.readFileSync(path.join(root, name), 'utf8')).join('\n');
    expect(joined).not.toMatch(/EvidenceAuthority\.confirm|EvidenceAuthority\.dispute/);
    expect(joined).not.toMatch(/confirmEvidence|disputeEvidence/);
    expect(joined).not.toMatch(/evidence_responses/);
  });

  it('API route stays clear of confirm/dispute actions', () => {
    const fs = require('fs') as typeof import('fs');
    const path = require('path') as typeof import('path');
    const api = fs.readFileSync(
      path.join(__dirname, '../../../../backend/vercel/api/community-agreement.ts'),
      'utf8'
    );
    expect(api).not.toMatch(/action:\s*'confirm'|action:\s*'dispute'/);
    expect(api).toContain('community-agreement');
  });
});
