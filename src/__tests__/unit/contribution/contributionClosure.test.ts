/**
 * Correction closure on the Evidence Authority path.
 * A later snapshot is the current Result. Withdrawn subjects stay in history and do not project.
 */
import fs from 'fs';
import path from 'path';
import { __setContributionCreationRecordClassForTests } from '../../../contributions/productionEpoch';
import { ceasedPrevailingSubjectKeys, correctionClosureFacts } from '../../../contribution/correctionClosure';
import { EvidenceAuthority } from '../../../evidenceAuthority/authority';
import { projectSnapshotForAssessment } from '../../../evidenceAuthority/assessment';
import { MemoryAuthorityStore } from '../../../evidenceAuthority/memoryStore';
import { deriveEvidenceFacts } from '../../../evidenceAuthority/subjects';
import type { EvidenceFactInput } from '../../../evidenceAuthority/types';
import { selectPrevailingPacketClaims } from '../../../claims/packetClaimReceiver';
import { selectPrevailingOriginFacts } from '../../../origins/governedFacts';
import { projectOriginConsumerLines } from '../../../origins/productOriginsCard';
import { stampCoreTruthAuthority } from '../../../config/coreTruthProductCacheAuthority';
import { sha256Hex } from '../../../packetContribution/sha256';
import type { Product } from '../../../types/product';
import { calculateTrustScore } from '../../../utils/trustScore';
import { resultContributionActions } from '../../../contribution/resultContributionActions';
import {
  bodyDataLimitationActions,
  projectGovernedCertificationNames,
  selectPrevailingGovernedIngredientsText,
  transparencyShowsSeparateAddIngredients,
} from '../../../contribution/governedDisplayProjection';

const BARCODE = '9300673777777';
const packetBytes = new TextEncoder().encode('closure-packet');
const packetHash = sha256Hex(packetBytes);
const REPO = path.join(__dirname, '../../../..');

function authority() {
  return new EvidenceAuthority(new MemoryAuthorityStore(), {
    authorityEnv: 'uat',
    now: () => 9_000,
  });
}

function food(overrides: Partial<Product> = {}): Product {
  return stampCoreTruthAuthority({
    barcode: BARCODE,
    product_name: 'Closure oats',
    source: 'openfoodfacts',
    nutriments: { fat_100g: 2, sugars_100g: 4, proteins_100g: 8, energy_100g: 1500 },
    nutrition_data_per: '100g',
    nutriscore_grade: 'b',
    nova_group: 1,
    ecoscore_grade: 'b',
    ingredients_text: 'Wholegrain oats',
    ...overrides,
  } as Product);
}

async function send(
  service: EvidenceAuthority,
  contributorId: string,
  facts: EvidenceFactInput[],
  key: string,
  ceasedSubjectKeys?: string[]
) {
  return service.submit(contributorId, {
    idempotencyKey: key,
    barcode: BARCODE,
    sourceBytes: facts.length > 0 ? packetBytes : undefined,
    declaredSha256: facts.length > 0 ? packetHash : undefined,
    facts,
    ...(ceasedSubjectKeys && ceasedSubjectKeys.length > 0 ? { ceasedSubjectKeys } : {}),
  });
}

function keys(facts: EvidenceFactInput[]): string[] {
  return deriveEvidenceFacts(facts).facts.map((fact) => fact.subjectKey);
}

beforeEach(() => {
  __setContributionCreationRecordClassForTests('production');
  process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV = 'uat';
});

afterEach(() => {
  __setContributionCreationRecordClassForTests(null);
});

describe('contribution correction closure', () => {
  it('replaces a mistyped packet claim and then removes it', async () => {
    const service = authority();
    const contributor = await service.issueCredential();
    const guten = { domain: 'packet_claims' as const, exactWording: 'Guten Free', claimValue: 'Guten Free' };
    const gluten = { domain: 'packet_claims' as const, exactWording: 'Gluten Free', claimValue: 'Gluten Free' };
    const first = await send(service, contributor.contributorId, [guten], 'guten');
    expect(selectPrevailingPacketClaims(projectSnapshotForAssessment(first.snapshot, 'uat')).map((row) => row.exactWording)).toEqual([
      'Guten Free',
    ]);
    const corrected = await send(service, contributor.contributorId, [gluten], 'gluten', keys([guten]));
    const current = selectPrevailingPacketClaims(projectSnapshotForAssessment(corrected.snapshot, 'uat')).map(
      (row) => row.exactWording
    );
    expect(current).toEqual(['Gluten Free']);
    const reloaded = await service.snapshot(BARCODE);
    expect(selectPrevailingPacketClaims(projectSnapshotForAssessment(reloaded, 'uat')).map((row) => row.exactWording)).toEqual([
      'Gluten Free',
    ]);
    const shown = await calculateTrustScore(food(), { authoritativeSnapshot: reloaded });
    expect((shown.rveelGovernedPacketClaims || []).map((row) => row.exactWording)).toEqual(['Gluten Free']);
    const removed = await send(service, contributor.contributorId, [], 'remove-gluten', keys([gluten]));
    expect(removed.status).toBe('admitted');
    const after = await service.snapshot(BARCODE);
    expect(selectPrevailingPacketClaims(projectSnapshotForAssessment(after, 'uat'))).toEqual([]);
    const history = await service.history(BARCODE);
    expect(history.some((row) => row.governance === 'withdrawn')).toBe(true);
    expect(history.some((row) => row.content.exactWording === 'Guten Free')).toBe(true);
  });

  it('keeps an added claim and does not duplicate an unchanged claim', async () => {
    const service = authority();
    const contributor = await service.issueCredential();
    const gluten = { domain: 'packet_claims' as const, exactWording: 'Gluten Free', claimValue: 'Gluten Free' };
    const organic = { domain: 'packet_claims' as const, exactWording: 'Organic', claimValue: 'Organic' };
    await send(service, contributor.contributorId, [gluten], 'gluten-keep');
    const added = await send(service, contributor.contributorId, [organic], 'organic-add');
    expect(
      selectPrevailingPacketClaims(projectSnapshotForAssessment(added.snapshot, 'uat'))
        .map((row) => row.exactWording)
        .sort()
    ).toEqual(['Gluten Free', 'Organic']);
    const again = await send(service, contributor.contributorId, [gluten], 'gluten-again');
    const wordings = selectPrevailingPacketClaims(projectSnapshotForAssessment(again.snapshot, 'uat')).map(
      (row) => row.exactWording
    );
    expect(wordings.filter((row) => row === 'Gluten Free')).toHaveLength(1);
    expect(wordings).toContain('Organic');
  });

  it('replaces ingredients and nutrition, and a cleared nutrient does not return', async () => {
    const service = authority();
    const contributor = await service.issueCredential();
    const oats = await send(
      service,
      contributor.contributorId,
      [{ domain: 'ingredients_nutrition', ingredientsText: 'Wholegrain oats' }],
      'oats'
    );
    const berries = await send(
      service,
      contributor.contributorId,
      [{ domain: 'ingredients_nutrition', ingredientsText: 'Raspberries' }],
      'berries'
    );
    const ingredientEvidence = projectSnapshotForAssessment(berries.snapshot, 'uat');
    expect(selectPrevailingGovernedIngredientsText(ingredientEvidence)).toBe('Raspberries');
    const ingredientResult = await calculateTrustScore(food(), { authoritativeSnapshot: berries.snapshot });
    expect(ingredientResult.rveelGovernedIngredientsText).toBe('Raspberries');
    expect(ingredientResult.rveelSourceIngredientsText).toBe('Wholegrain oats');
    const reloadedIngredients = await calculateTrustScore(food(), {
      authoritativeSnapshot: await service.snapshot(BARCODE),
    });
    expect(reloadedIngredients.rveelGovernedIngredientsText).toBe('Raspberries');
    expect(oats.status).toBe('admitted');

    const fat10 = await send(
      service,
      contributor.contributorId,
      [
        {
          domain: 'ingredients_nutrition',
          nutritionBasis: 'per_100g',
          nutriments: [{ attribute: 'fat', value: 10, unit: 'g' }],
        },
      ],
      'fat-10'
    );
    const shown10 = await calculateTrustScore(food(), { authoritativeSnapshot: fat10.snapshot });
    expect(shown10.nutriments?.fat_100g).toBe(10);
    const fat8 = await send(
      service,
      contributor.contributorId,
      [
        {
          domain: 'ingredients_nutrition',
          nutritionBasis: 'per_100g',
          nutriments: [{ attribute: 'fat', value: 8, unit: 'g' }],
        },
      ],
      'fat-8'
    );
    const shown8 = await calculateTrustScore(food(), { authoritativeSnapshot: fat8.snapshot });
    expect(shown8.nutriments?.fat_100g).toBe(8);
    const fatKey = keys([
      {
        domain: 'ingredients_nutrition',
        nutritionBasis: 'per_100g',
        nutriments: [{ attribute: 'fat', value: 8, unit: 'g' }],
      },
    ]);
    const cleared = await send(service, contributor.contributorId, [], 'fat-cleared', fatKey);
    const afterClear = await calculateTrustScore(food(), { authoritativeSnapshot: cleared.snapshot });
    expect(afterClear.nutriments?.fat_100g).toBe(2);
    expect(afterClear.rveelGovernedNutrimentKeys || []).not.toContain('fat_100g');
    expect(afterClear.rveelGovernedIngredientsText).toBe('Raspberries');
  });

  it('projects packed-in Serbia, replaces that proposition, and drops it after removal', async () => {
    const service = authority();
    const contributor = await service.issueCredential();
    const serbia = {
      domain: 'origins' as const,
      exactWording: 'Packed in Serbia',
      claimValue: 'Serbia',
      originStructured: {
        claimType: 'packed_in' as const,
        primaryCountry: 'Serbia',
        originQualifications: ['local' as const, 'imported' as const],
        percentageNotStated: true,
      },
    };
    const australia = {
      ...serbia,
      exactWording: 'Packed in Australia',
      claimValue: 'Australia',
      originStructured: {
        claimType: 'packed_in' as const,
        primaryCountry: 'Australia',
        originQualifications: ['local' as const, 'imported' as const],
        percentageNotStated: true,
      },
    };
    const fiji = {
      domain: 'origins' as const,
      exactWording: 'Made in Fiji',
      claimValue: 'Fiji',
      originStructured: { claimType: 'made_in' as const, primaryCountry: 'Fiji' },
    };
    const first = await send(service, contributor.contributorId, [serbia, fiji], 'serbia');
    const firstFacts = selectPrevailingOriginFacts(projectSnapshotForAssessment(first.snapshot, 'uat'));
    const packed = firstFacts.find((fact) => fact.claimType === 'packed_in');
    expect(packed).toBeTruthy();
    const lines = projectOriginConsumerLines(packed ? [packed] : []);
    expect(lines[0]?.primary).toBe('🇷🇸 Packed in Serbia');
    expect(lines[0]?.supporting).toEqual([
      'Local & Imported ingredients',
      'Imported ingredient origins not specified',
    ]);
    expect(JSON.stringify(lines)).not.toContain('Not stated');
    const corrected = await send(service, contributor.contributorId, [australia], 'australia');
    const correctedFacts = selectPrevailingOriginFacts(projectSnapshotForAssessment(corrected.snapshot, 'uat'));
    expect(correctedFacts.filter((fact) => fact.claimType === 'packed_in').map((fact) => fact.countries)).toEqual([
      ['Australia'],
    ]);
    expect(correctedFacts.some((fact) => fact.countries.includes('Serbia'))).toBe(false);
    expect(correctedFacts.some((fact) => fact.claimType === 'made_in')).toBe(true);
    const packedKey = keys([serbia]);
    const removed = await send(service, contributor.contributorId, [], 'remove-packed', packedKey);
    const remaining = selectPrevailingOriginFacts(projectSnapshotForAssessment(removed.snapshot, 'uat'));
    expect(remaining.map((fact) => fact.claimType)).toEqual(['made_in']);
    const rescanned = await calculateTrustScore(food({ manufacturing_places: 'Fiji' }), {
      authoritativeSnapshot: await service.snapshot(BARCODE),
    });
    expect((rescanned.rveelGovernedOrigins || []).map((fact) => fact.claimType)).toEqual(['made_in']);
    expect(projectOriginConsumerLines(rescanned.rveelGovernedOrigins || [])[0]?.primary).toContain('Made in Fiji');
    expect(JSON.stringify(projectOriginConsumerLines(rescanned.rveelGovernedOrigins || []))).not.toContain('Serbia');
  });

  it('replaces a certification and does not keep the previous scheme current', async () => {
    const service = authority();
    const contributor = await service.issueCredential();
    const fairtrade = { domain: 'certifications' as const, exactWording: 'Fairtrade', claimValue: 'Fairtrade' };
    const organic = { domain: 'certifications' as const, exactWording: 'Organic', claimValue: 'Organic' };
    await send(service, contributor.contributorId, [fairtrade], 'fairtrade');
    const corrected = await send(service, contributor.contributorId, [organic], 'organic', keys([fairtrade]));
    const names = projectGovernedCertificationNames(projectSnapshotForAssessment(corrected.snapshot, 'uat'));
    expect(names).toEqual(['Organic']);
    const shown = await calculateTrustScore(food(), { authoritativeSnapshot: await service.snapshot(BARCODE) });
    expect(shown.rveelGovernedCertifications).toEqual(['Organic']);
  });

  it('derives cessation from the populated form, including an unchanged row that stays', () => {
    const closure = correctionClosureFacts({
      initialClaims: ['Guten Free', 'High protein'],
      claims: ['Gluten Free', 'High protein'],
      initialOrigins: [
        {
          claimType: 'packed_in',
          wording: 'Packed in Serbia',
          place: 'Serbia',
          ingredient: '',
          percentage: '',
          local: true,
          imported: true,
          percentageNotStated: true,
          intent: 'edited',
        },
      ],
      origins: [
        {
          claimType: 'made_in',
          wording: 'Made in Australia',
          place: 'Australia',
          ingredient: '',
          percentage: '',
          intent: 'edited',
        },
      ],
    });
    const ceased = ceasedPrevailingSubjectKeys(closure.baseline, closure.represented);
    expect(ceased).toEqual(expect.arrayContaining(keys([{ domain: 'packet_claims', exactWording: 'Guten Free', claimValue: 'Guten Free' }])));
    expect(ceased.some((key) => key.startsWith('origins|packed_in'))).toBe(true);
    expect(ceased.some((key) => key.includes('High protein') || key.includes('high protein'))).toBe(false);
  });

  it('keeps resolved assessment actions off the large Result buttons and uses one contribution title', () => {
    const result = fs.readFileSync(path.join(REPO, 'app/result/[barcode].tsx'), 'utf8');
    const modal = fs.readFileSync(path.join(REPO, 'src/components/PacketContributionModal.tsx'), 'utf8');
    expect(result).not.toContain('Update ingredients');
    expect(result).not.toContain('Update product origins');
    expect(result).toContain('Correct ingredients');
    expect(result).toContain('Correct product origins');
    expect(result).toContain('projectOriginConsumerLines');
    expect(result).not.toContain('formatGovernedOriginFactLine');
    expect(modal).toContain("header: 'Product Origins'");
    expect(modal).toContain("header: 'Packet information'");
    expect(modal).not.toContain('Packet claims and certifications');
    expect(modal).not.toContain('More than one origin');
    expect(modal).toContain('Enter ingredients');
    expect(modal).toContain('Local');
    expect(modal).toContain('Imported');
    expect(modal).toContain('Not stated');
    expect(result).toContain('Add product origins');
    expect(result).not.toContain('Complete product origins');
    expect(result).not.toContain('Update product origins');
    expect(result).toContain('CONTRIBUTION_NOTICE_ADDED');
    expect(modal).toContain('CONTRIBUTION_NOTICE_SAVED');
    expect(result).toContain('add-circle-outline');
  });

  it('replaces an origin proposition across every governed type and does not restore a removed one', async () => {
    const service = authority();
    const contributor = await service.issueCredential();
    const types = ['grown_in', 'produced_in', 'made_in', 'packed_in', 'ingredient_origin'] as const;
    const origin = (claimType: (typeof types)[number], country: string) => ({
      domain: 'origins' as const,
      exactWording: `${claimType} ${country}`,
      claimValue: country,
      originStructured: {
        claimType,
        primaryCountry: country,
        ...(claimType === 'ingredient_origin' ? { ingredientSubject: 'oats' } : {}),
      },
    });
    const madeIn = origin('made_in', 'New Zealand');
    const producedIn = origin('produced_in', 'Chile');
    const first = await send(service, contributor.contributorId, [madeIn], 'made-nz');
    const replaced = await send(service, contributor.contributorId, [producedIn], 'produced-chile', keys([madeIn]));
    const replacedFacts = selectPrevailingOriginFacts(projectSnapshotForAssessment(replaced.snapshot, 'uat'));
    expect(replacedFacts.map((fact) => fact.claimType)).toEqual(['produced_in']);
    expect(replacedFacts[0]?.countries).toEqual(['Chile']);
    const reloaded = await calculateTrustScore(food({ manufacturing_places: 'New Zealand' }), {
      authoritativeSnapshot: await service.snapshot(BARCODE),
    });
    expect((reloaded.rveelGovernedOrigins || []).map((fact) => `${fact.claimType}:${fact.countries.join(',')}`)).toEqual([
      'produced_in:Chile',
    ]);
    for (const claimType of types) {
      const older = origin(claimType, 'Fiji');
      const newer = origin(claimType, 'Australia');
      await send(service, contributor.contributorId, [older], `${claimType}-fiji`);
      const current = await send(service, contributor.contributorId, [newer], `${claimType}-australia`);
      const facts = selectPrevailingOriginFacts(projectSnapshotForAssessment(current.snapshot, 'uat'));
      const rows = facts.filter((fact) => fact.claimType === claimType);
      expect(rows.map((fact) => fact.countries)).toEqual([['Australia']]);
      const removed = await send(service, contributor.contributorId, [], `${claimType}-removed`, keys([newer]));
      const after = selectPrevailingOriginFacts(projectSnapshotForAssessment(removed.snapshot, 'uat'));
      expect(after.some((fact) => fact.claimType === claimType)).toBe(false);
      expect(JSON.stringify(after)).not.toContain('Fiji');
      expect(JSON.stringify(after)).not.toContain('Australia');
    }
    const rescanned = await calculateTrustScore(food(), {
      authoritativeSnapshot: await service.snapshot(BARCODE),
    });
    expect(rescanned.rveelGovernedOrigins || []).toEqual([]);
    expect(JSON.stringify(rescanned.rveelGovernedOrigins || [])).not.toContain('New Zealand');
  });

  it('drops Add actions after the governed requirement resolves and keeps the correction pencil', async () => {
    const service = authority();
    const contributor = await service.issueCredential();
    const missingNutrition = food({
      nutriments: {},
      nutriscore_grade: undefined,
      nova_group: 1,
      ingredients_text: 'Wholegrain oats',
    });
    const beforeNutrition = await calculateTrustScore(missingNutrition);
    expect(resultContributionActions(beforeNutrition).addNutrition).toBe(true);
    const nutrition = await send(
      service,
      contributor.contributorId,
      [
        {
          domain: 'ingredients_nutrition',
          nutritionBasis: 'per_100g',
          nutriments: [{ attribute: 'fat', value: 2, unit: 'g' }],
        },
      ],
      'nutrition'
    );
    const afterNutrition = await calculateTrustScore(missingNutrition, { authoritativeSnapshot: nutrition.snapshot });
    expect(resultContributionActions(afterNutrition).addNutrition).toBe(false);
    expect(resultContributionActions(afterNutrition).updateNutrition).toBe(true);

    const missingIngredients = food({
      ingredients_text: '',
      nova_group: undefined,
      nutriscore_grade: 'b',
    });
    const beforeIngredients = await calculateTrustScore(missingIngredients);
    expect(bodyDataLimitationActions(beforeIngredients).some((action) => action.label === 'Add ingredients')).toBe(true);
    expect(transparencyShowsSeparateAddIngredients(beforeIngredients)).toBe(true);
    const ingredients = await send(
      service,
      contributor.contributorId,
      [{ domain: 'ingredients_nutrition', ingredientsText: 'Wholegrain oats' }],
      'ingredients'
    );
    const afterIngredients = await calculateTrustScore(missingIngredients, {
      authoritativeSnapshot: ingredients.snapshot,
    });
    expect(afterIngredients.rveelGovernedIngredientsText).toBe('Wholegrain oats');
    expect(resultContributionActions(afterIngredients).addIngredients).toBe(false);
    expect(bodyDataLimitationActions(afterIngredients).some((action) => action.label === 'Add ingredients')).toBe(false);
    expect(transparencyShowsSeparateAddIngredients(afterIngredients)).toBe(false);

    const beforeOrigins = await calculateTrustScore(food({ ingredients_text: 'Wholegrain oats', nova_group: 1 }));
    expect(resultContributionActions(beforeOrigins).originsAction === 'add' || resultContributionActions(beforeOrigins).originsAction === 'complete').toBe(true);
    const origins = await send(
      service,
      contributor.contributorId,
      [
        {
          domain: 'origins',
          exactWording: 'Product of Australia',
          claimValue: 'Australia',
          originStructured: { claimType: 'produced_in', primaryCountry: 'Australia' },
        },
      ],
      'origins'
    );
    const afterOrigins = await calculateTrustScore(food({ ingredients_text: 'Wholegrain oats', nova_group: 1 }), {
      authoritativeSnapshot: origins.snapshot,
    });
    expect(resultContributionActions(afterOrigins).originsAction).toBe('update');

    const beforePacket = await calculateTrustScore(food());
    expect(resultContributionActions(beforePacket).packetInformationAction).toBe('add');
    const packet = await send(
      service,
      contributor.contributorId,
      [{ domain: 'packet_claims', exactWording: 'High protein', claimValue: 'High protein' }],
      'packet'
    );
    const afterPacket = await calculateTrustScore(food(), { authoritativeSnapshot: packet.snapshot });
    expect(resultContributionActions(afterPacket).packetInformationAction).toBe('update');
  });

  it('lets a recognised Organic certification supersede claim-only Organic and restore it when withdrawn', async () => {
    const service = authority();
    const contributor = await service.issueCredential();
    const organicProduct = food({
      product_name: 'Organic Oats',
      labels_tags: [],
      labels: '',
      certifications: undefined,
    });
    const claimOnly = await calculateTrustScore(organicProduct);
    const ethicsAdjustments = (product: { _truscore_analysis?: { pillars?: { Ethics?: { adjustments?: Array<{ adjustmentId?: string; value: number }> } } } }) =>
      product._truscore_analysis?.pillars?.Ethics?.adjustments || [];
    const claimRows = ethicsAdjustments(claimOnly);
    expect(claimRows.some((row) => row.adjustmentId === 'claims.organic.claim_only.v1' && row.value === 1)).toBe(true);
    expect(claimRows.some((row) => row.adjustmentId === 'ethics-v37-cert-organic')).toBe(false);
    const claim = { domain: 'packet_claims' as const, exactWording: 'Organic', claimValue: 'Organic' };
    const aco = {
      domain: 'certifications' as const,
      exactWording: 'ACO Certified Organic',
      claimValue: 'ACO Certified Organic',
    };
    await send(service, contributor.contributorId, [claim], 'organic-claim');
    const certified = await send(service, contributor.contributorId, [aco], 'aco');
    const shown = await calculateTrustScore(organicProduct, { authoritativeSnapshot: certified.snapshot });
    const certifiedRows = ethicsAdjustments(shown);
    expect(certifiedRows.some((row) => row.adjustmentId === 'ethics-v37-cert-organic' && row.value === 2)).toBe(true);
    expect(certifiedRows.some((row) => row.adjustmentId === 'claims.organic.claim_only.v1')).toBe(false);
    expect(shown.rveelGovernedCertifications).toEqual(['ACO Certified Organic']);
    expect((shown.rveelGovernedPacketClaims || []).map((row) => row.exactWording)).not.toContain('Organic');
    expect((shown.certifications || []).some((row) => row.tag === 'ts:organic-product-name-claim')).toBe(false);
    const reloaded = await calculateTrustScore(organicProduct, {
      authoritativeSnapshot: await service.snapshot(BARCODE),
    });
    const reloadedRows = ethicsAdjustments(reloaded);
    expect(reloadedRows.some((row) => row.adjustmentId === 'ethics-v37-cert-organic' && row.value === 2)).toBe(true);
    expect(reloadedRows.some((row) => row.adjustmentId === 'claims.organic.claim_only.v1')).toBe(false);
    const withdrawn = await send(service, contributor.contributorId, [], 'remove-aco', keys([aco]));
    const restored = await calculateTrustScore(organicProduct, { authoritativeSnapshot: withdrawn.snapshot });
    const restoredRows = ethicsAdjustments(restored);
    expect(restoredRows.some((row) => row.adjustmentId === 'claims.organic.claim_only.v1' && row.value === 1)).toBe(true);
    expect(restoredRows.some((row) => row.adjustmentId === 'ethics-v37-cert-organic')).toBe(false);
    expect(restored.rveelGovernedCertifications).toBeUndefined();
    expect((restored.rveelGovernedPacketClaims || []).map((row) => row.exactWording)).toContain('Organic');
  });
});
