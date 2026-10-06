/**
 * Visible form state is the contribution. Each journey finalises manual text and admits it
 * on the UAT Evidence Authority, then the Result projection reads that snapshot.
 */
import { __setContributionCreationRecordClassForTests } from '../../../contributions/productionEpoch';
import {
  CONTRIBUTION_UNCHANGED_NOTICE,
  contributionTransportFailureNotice,
  prepareVisibleContribution,
  type ReadyVisibleContribution,
} from '../../../contribution/visibleContribution';
import { CONTRIBUTION_NOTICE_SAVED } from '../../../contribution/resultContributionActions';
import { searchPacketInformation } from '../../../certifications/resolveCertification';
import { EvidenceAuthority } from '../../../evidenceAuthority/authority';
import { projectSnapshotForAssessment } from '../../../evidenceAuthority/assessment';
import { MemoryAuthorityStore } from '../../../evidenceAuthority/memoryStore';
import type { EvidenceFactInput } from '../../../evidenceAuthority/types';
import type { ManualTextDraft } from '../../../evidenceAuthority/manualTextAsset';
import { stampCoreTruthAuthority } from '../../../config/coreTruthProductCacheAuthority';
import { projectOriginConsumerLines } from '../../../origins/productOriginsCard';
import type { Product } from '../../../types/product';
import { calculateTrustScore } from '../../../utils/trustScore';

const BARCODE = '9300673888888';

function authority() {
  return new EvidenceAuthority(new MemoryAuthorityStore(), {
    authorityEnv: 'uat',
    now: () => 12_000,
  });
}

function food(): Product {
  return stampCoreTruthAuthority({
    barcode: BARCODE,
    product_name: 'Submit oats',
    source: 'openfoodfacts',
    nutriments: { fat_100g: 2, sugars_100g: 4, proteins_100g: 8, energy_100g: 1500 },
    nutrition_data_per: '100g',
    nutriscore_grade: 'b',
    nova_group: 1,
    ecoscore_grade: 'b',
    ingredients_text: 'Wholegrain oats',
  } as Product);
}

const emptyNutrition = { basis: 'per_100g' as const, amounts: {}, sodiumUnit: 'mg' as const };

function ready(decision: ReturnType<typeof prepareVisibleContribution>): ReadyVisibleContribution {
  if (decision.status !== 'ready') {
    throw new Error(`expected a submittable form, received ${decision.status}`);
  }
  return decision;
}

async function admit(
  service: EvidenceAuthority,
  contributorId: string,
  draft: ManualTextDraft,
  facts: EvidenceFactInput[],
  key: string
) {
  const finalized = await service.finalizeManualTextAsset({ ...draft, contributorId, barcode: BARCODE });
  if (!finalized.ok) return { finalized, outcome: null };
  const outcome = await service.submit(contributorId, {
    idempotencyKey: key,
    barcode: BARCODE,
    facts: facts.map((fact) => ({ ...fact, finalizedAssetId: finalized.assetId, unitId: draft.unitId })),
  });
  return { finalized, outcome };
}

beforeEach(() => {
  __setContributionCreationRecordClassForTests('production');
  process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV = 'uat';
});

afterEach(() => {
  __setContributionCreationRecordClassForTests(null);
});

describe('visible contribution submit on the UAT authority path', () => {
  it('admits ingredients typed on the form and shows them on Result', async () => {
    const decision = ready(
      prepareVisibleContribution({
        contexts: ['ingredients'],
        ingredientsText: 'Rolled oats, water',
        initialIngredients: 'Wholegrain oats',
        nutrition: emptyNutrition,
        nutritionBaseline: emptyNutrition,
        origins: [],
        claims: [''],
        certifications: [''],
      })
    );
    expect(decision.ingredientsText).toBe('Rolled oats, water');
    const service = authority();
    const contributor = await service.issueCredential();
    const sent = await admit(
      service,
      contributor.contributorId,
      {
        barcode: BARCODE,
        sessionId: 'ingredients',
        unitId: 'unit-ingredients',
        domain: 'ingredients_nutrition',
        statement: decision.ingredientsText,
        ingredientsText: decision.ingredientsText,
      },
      [{ domain: 'ingredients_nutrition', ingredientsText: decision.ingredientsText }],
      'ingredients-direct'
    );
    expect(sent.outcome?.status).toBe('admitted');
    const shown = await calculateTrustScore(food(), { authoritativeSnapshot: sent.outcome?.snapshot });
    expect(shown.rveelGovernedIngredientsText).toBe('Rolled oats, water');
    expect(shown.ingredients_text).toBe('Wholegrain oats');
  });

  it('admits a nutrient value without an edited-flag commit and updates Result', async () => {
    const baseline = { basis: 'per_100g' as const, amounts: { sugars: '4' }, sodiumUnit: 'mg' as const };
    const decision = ready(
      prepareVisibleContribution({
        contexts: ['nutrition'],
        ingredientsText: '',
        nutrition: { ...baseline, amounts: { sugars: '12' } },
        nutritionBaseline: baseline,
        origins: [],
        claims: [''],
        certifications: [''],
      })
    );
    expect(decision.nutritionAmounts).toEqual([{ attribute: 'sugars', value: 12, unit: 'g' }]);
    const service = authority();
    const contributor = await service.issueCredential();
    const sent = await admit(
      service,
      contributor.contributorId,
      {
        barcode: BARCODE,
        sessionId: 'nutrition',
        unitId: 'unit-nutrition',
        domain: 'ingredients_nutrition',
        nutritionBasis: decision.nutritionBasis || 'per_100g',
        nutritionAmounts: decision.nutritionAmounts,
      },
      [
        {
          domain: 'ingredients_nutrition',
          nutritionBasis: decision.nutritionBasis || 'per_100g',
          nutriments: decision.nutritionAmounts,
        },
      ],
      'nutrition-direct'
    );
    expect(sent.outcome?.status).toBe('admitted');
    const shown = await calculateTrustScore(food(), { authoritativeSnapshot: sent.outcome?.snapshot });
    expect(shown.nutriments?.sugars_100g).toBe(12);
    expect(shown.rveelGovernedNutrimentKeys).toContain('sugars_100g');
  });

  it('admits origin type plus country as the structured proposition and keeps pack wording separate', async () => {
    const decision = ready(
      prepareVisibleContribution({
        contexts: ['origins'],
        ingredientsText: '',
        nutrition: emptyNutrition,
        nutritionBaseline: emptyNutrition,
        origins: [
          {
            intent: 'new',
            claimType: 'produced_in',
            wording: '',
            place: 'Chile',
            ingredient: '',
            percentage: '',
          },
        ],
        claims: [''],
        certifications: [''],
      })
    );
    const row = decision.origins[0];
    expect(row?.wording).toBe('');
    const service = authority();
    const contributor = await service.issueCredential();
    const sent = await admit(
      service,
      contributor.contributorId,
      {
        barcode: BARCODE,
        sessionId: 'origins',
        unitId: 'unit-origin',
        domain: 'origins',
        statement: row?.wording || '',
        originClaimType: row?.claimType,
        originCountry: 'Chile',
      },
      [
        {
          domain: 'origins',
          claimValue: 'Chile',
          originStructured: { claimType: 'produced_in', primaryCountry: 'Chile' },
        },
      ],
      'origin-direct'
    );
    expect(sent.outcome?.status).toBe('admitted');
    const shown = await calculateTrustScore(food(), { authoritativeSnapshot: sent.outcome?.snapshot });
    const fact = shown.rveelGovernedOrigins?.[0];
    expect(fact?.claimType).toBe('produced_in');
    expect(fact?.countries).toEqual(['Chile']);
    expect(fact?.exactWording).toBeUndefined();
    expect(projectOriginConsumerLines(shown.rveelGovernedOrigins || [])[0]?.primary).toContain('Product of Chile');

    const observed = 'Product of Chile — Valle del Elqui';
    const withWording = ready(
      prepareVisibleContribution({
        contexts: ['origins'],
        ingredientsText: '',
        nutrition: emptyNutrition,
        nutritionBaseline: emptyNutrition,
        origins: [
          {
            intent: 'new',
            claimType: 'produced_in',
            wording: observed,
            place: 'Chile',
            ingredient: '',
            percentage: '',
          },
        ],
        claims: [''],
        certifications: [''],
      })
    );
    const worded = await admit(
      service,
      contributor.contributorId,
      {
        barcode: BARCODE,
        sessionId: 'origins-wording',
        unitId: 'unit-origin-wording',
        domain: 'origins',
        statement: observed,
        originClaimType: 'produced_in',
        originCountry: 'Chile',
      },
      [
        {
          domain: 'origins',
          exactWording: observed,
          claimValue: 'Chile',
          originStructured: { claimType: 'produced_in', primaryCountry: 'Chile' },
        },
      ],
      'origin-wording'
    );
    expect(withWording.origins[0]?.wording).toBe(observed);
    expect(worded.outcome?.status).toBe('admitted');
    const wordedResult = await calculateTrustScore(food(), { authoritativeSnapshot: worded.outcome?.snapshot });
    expect(wordedResult.rveelGovernedOrigins?.[0]?.exactWording).toBe(observed);
    expect(wordedResult.rveelGovernedOrigins?.[0]?.claimType).toBe('produced_in');
    expect(wordedResult.rveelGovernedOrigins?.[0]?.countries).toEqual(['Chile']);
  });

  it('admits unmatched packet wording still in the field', async () => {
    const query = 'High in protein';
    const exact = searchPacketInformation(query).find((hit) => hit.displayName.toLowerCase() === query.toLowerCase());
    const decision = ready(
      prepareVisibleContribution({
        contexts: ['packetClaims'],
        ingredientsText: '',
        nutrition: emptyNutrition,
        nutritionBaseline: emptyNutrition,
        origins: [],
        claims: [''],
        certifications: [''],
        pendingPacketWording: query,
        catalogueName: exact?.displayName,
      })
    );
    expect(decision.claims).toEqual([query]);
    const service = authority();
    const contributor = await service.issueCredential();
    const sent = await admit(
      service,
      contributor.contributorId,
      {
        barcode: BARCODE,
        sessionId: 'packet',
        unitId: 'unit-claim',
        domain: 'packet_claims',
        statement: query,
      },
      [{ domain: 'packet_claims', exactWording: query, claimValue: query }],
      'claim-direct'
    );
    expect(sent.outcome?.status).toBe('admitted');
    const shown = await calculateTrustScore(food(), { authoritativeSnapshot: sent.outcome?.snapshot });
    expect((shown.rveelGovernedPacketClaims || []).map((row) => row.exactWording)).toEqual([query]);
  });

  it('admits an exact catalogue selection as the certification', async () => {
    const query = 'Fairtrade';
    const exact = searchPacketInformation(query).find((hit) => hit.displayName.toLowerCase() === query.toLowerCase());
    expect(exact?.displayName).toBe('Fairtrade');
    const decision = ready(
      prepareVisibleContribution({
        contexts: ['packetClaims', 'certifications'],
        ingredientsText: '',
        nutrition: emptyNutrition,
        nutritionBaseline: emptyNutrition,
        origins: [],
        claims: [''],
        certifications: [''],
        pendingPacketWording: query,
        catalogueName: exact?.displayName,
      })
    );
    expect(decision.certifications).toEqual(['Fairtrade']);
    expect(decision.claims).toEqual([]);
    const service = authority();
    const contributor = await service.issueCredential();
    const sent = await admit(
      service,
      contributor.contributorId,
      {
        barcode: BARCODE,
        sessionId: 'cert',
        unitId: 'unit-cert',
        domain: 'certifications',
        statement: 'Fairtrade',
      },
      [{ domain: 'certifications', exactWording: 'Fairtrade', claimValue: 'Fairtrade' }],
      'cert-direct'
    );
    expect(sent.outcome?.status).toBe('admitted');
    const shown = await calculateTrustScore(food(), { authoritativeSnapshot: sent.outcome?.snapshot });
    expect(shown.rveelGovernedCertifications).toContain('Fairtrade');
    expect(projectSnapshotForAssessment(sent.outcome?.snapshot, 'uat').some((row) => row.domain === 'certifications')).toBe(
      true
    );
  });

  it('names the missing requirement and does not call an incomplete form already current', () => {
    const ingredients = prepareVisibleContribution({
      contexts: ['ingredients'],
      ingredientsText: '   ',
      nutrition: emptyNutrition,
      nutritionBaseline: emptyNutrition,
      origins: [],
      claims: [''],
      certifications: [''],
    });
    const nutrition = prepareVisibleContribution({
      contexts: ['nutrition'],
      ingredientsText: '',
      nutrition: emptyNutrition,
      nutritionBaseline: emptyNutrition,
      origins: [],
      claims: [''],
      certifications: [''],
    });
    const origins = prepareVisibleContribution({
      contexts: ['origins'],
      ingredientsText: '',
      nutrition: emptyNutrition,
      nutritionBaseline: emptyNutrition,
      origins: [{ intent: 'new', claimType: 'produced_in', wording: '', place: '', ingredient: '', percentage: '' }],
      claims: [''],
      certifications: [''],
    });
    const packet = prepareVisibleContribution({
      contexts: ['packetClaims'],
      ingredientsText: '',
      nutrition: emptyNutrition,
      nutritionBaseline: emptyNutrition,
      origins: [],
      claims: [''],
      certifications: [''],
      pendingPacketWording: '',
    });
    for (const decision of [ingredients, nutrition, origins, packet]) {
      expect(decision.status).toBe('incomplete');
      if (decision.status !== 'incomplete') continue;
      expect(decision.messages.join(' ')).not.toContain('Nothing new was ready to submit');
      expect(decision.messages[0]?.length).toBeGreaterThan(0);
    }
    expect(origins.status === 'incomplete' && origins.messages[0]).toContain('country');
    expect(packet.status === 'incomplete' && packet.messages[0]).toContain('pack');
  });

  it('keeps a refused contribution recoverable and admits the same form on retry', async () => {
    expect(contributionTransportFailureNotice()).toBe(CONTRIBUTION_NOTICE_SAVED);
    const decision = ready(
      prepareVisibleContribution({
        contexts: ['ingredients'],
        ingredientsText: 'Rolled oats, water',
        initialIngredients: '',
        nutrition: emptyNutrition,
        nutritionBaseline: emptyNutrition,
        origins: [],
        claims: [''],
        certifications: [''],
      })
    );
    const service = authority();
    const contributor = await service.issueCredential();
    const draft: ManualTextDraft = {
      barcode: BARCODE,
      sessionId: 'retry',
      unitId: 'unit-retry',
      domain: 'ingredients_nutrition',
      statement: decision.ingredientsText,
      ingredientsText: decision.ingredientsText,
    };
    const refused = await admit(
      service,
      contributor.contributorId,
      draft,
      [{ domain: 'ingredients_nutrition', ingredientsText: 'A different statement' }],
      'ingredients-refused'
    );
    expect(refused.outcome?.status).not.toBe('admitted');
    expect((await service.snapshot(BARCODE)).prevailing).toHaveLength(0);
    const retried = await admit(
      service,
      contributor.contributorId,
      draft,
      [{ domain: 'ingredients_nutrition', ingredientsText: decision.ingredientsText }],
      'ingredients-retry'
    );
    expect(retried.outcome?.status).toBe('admitted');
    const shown = await calculateTrustScore(food(), { authoritativeSnapshot: retried.outcome?.snapshot });
    expect(shown.rveelGovernedIngredientsText).toBe('Rolled oats, water');
  });

  it('does not admit the same prevailing ingredients again', async () => {
    const service = authority();
    const contributor = await service.issueCredential();
    const first = ready(
      prepareVisibleContribution({
        contexts: ['ingredients'],
        ingredientsText: 'Rolled oats, water',
        initialIngredients: '',
        nutrition: emptyNutrition,
        nutritionBaseline: emptyNutrition,
        origins: [],
        claims: [''],
        certifications: [''],
      })
    );
    const admitted = await admit(
      service,
      contributor.contributorId,
      {
        barcode: BARCODE,
        sessionId: 'same',
        unitId: 'unit-same',
        domain: 'ingredients_nutrition',
        statement: first.ingredientsText,
        ingredientsText: first.ingredientsText,
      },
      [{ domain: 'ingredients_nutrition', ingredientsText: first.ingredientsText }],
      'ingredients-once'
    );
    expect(admitted.outcome?.status).toBe('admitted');
    const again = prepareVisibleContribution({
      contexts: ['ingredients'],
      ingredientsText: 'Rolled oats, water',
      initialIngredients: 'Rolled oats, water',
      nutrition: emptyNutrition,
      nutritionBaseline: emptyNutrition,
      origins: [],
      claims: [''],
      certifications: [''],
    });
    expect(again).toEqual({ status: 'unchanged', message: CONTRIBUTION_UNCHANGED_NOTICE });
    expect((await service.history(BARCODE)).filter((row) => row.admissionStatus === 'admitted')).toHaveLength(1);
  });
});
