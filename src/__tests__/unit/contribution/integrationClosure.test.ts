import * as fs from 'fs';
import * as path from 'path';
import { ingredientSubjectKey } from '../../../contributions/originStructured';
import {
  admissionCompletedEveryReviewedUnit,
  nutritionAmountsFromExisting,
  projectAdmittedIngredientsDisplay,
} from '../../../contribution/governedDisplayProjection';
import { resultContributionActions } from '../../../contribution/resultContributionActions';
import {
  buildManualTextDocument,
  canonicalManualOriginContent,
} from '../../../evidenceAuthority/manualTextAsset';
import { resolveGovernedOriginsDisclosure } from '../../../origins/disclosureReceiver';
import type { GovernedOriginFact } from '../../../origins/governedFacts';
import type { OpenPillarResult } from '../../../lib/truscoreEngine/pillars/openPillar';
import type { Product } from '../../../types/product';
import type { CrossPillarPublicationSnapshot } from '../../../lib/rateability/types';
import { assessNOVAGroup1 } from '../../../utils/novaAssessment';

const REPO = path.resolve(__dirname, '../../../..');

function laneProduct(ingredient: 'resolved' | 'unassessed', processing: 'resolved' | 'unassessed'): Product {
  return {
    barcode: '9300000000000',
    certifications: [],
    _publication: {
      settled: true,
      body: { assessmentLanes: { nutrition: 'resolved', processing } },
      transparency: {
        publicationStatus: 'rated',
        assessmentLanes: { ingredient_clarity: ingredient, origins: 'unassessed' },
      },
      claims: { assessmentLanes: { packet: 'unassessed_or_incomplete', benchmark: 'unassessed_or_incomplete' } },
    } as CrossPillarPublicationSnapshot,
  } as Product;
}

describe('functional-to-consumer integration closure', () => {
  it('keeps contributed ingredients off the source field across a later projection', () => {
    const source = 'Raspberries (100%)';
    const first = projectAdmittedIngredientsDisplay(undefined, source);
    expect(first.ingredients_text).toBeUndefined();
    expect(first.rveelGovernedIngredientsText).toBe(source);
    const again = projectAdmittedIngredientsDisplay(first.ingredients_text, source);
    expect(again).toEqual({ rveelGovernedIngredientsText: source });
    const withSource = projectAdmittedIngredientsDisplay('oats', source);
    expect(withSource).toEqual({ ingredients_text: 'oats' });
  });

  it('recognises a characterising percentage without changing the printed ingredient', () => {
    const printed = 'Raspberries (100%)';
    expect(ingredientSubjectKey(printed)).toBe('raspberries');
    expect(printed).toBe('Raspberries (100%)');
    expect(ingredientSubjectKey('Strawberries (100%)')).toBe('strawberries');
    expect(assessNOVAGroup1({ barcode: '1', ingredients_text: 'Strawberries (100%)' } as Product).likelyNOVA1).toBe(true);
    expect(assessNOVAGroup1({ barcode: '1', ingredients_text: printed } as Product).likelyNOVA1).toBe(false);
  });

  it('hides Add ingredients once ingredient clarity is resolved even if processing is not', () => {
    const actions = resultContributionActions(laneProduct('resolved', 'unassessed'));
    expect(actions.addIngredients).toBe(false);
    expect(actions.updateIngredients).toBe(true);
    const stillNeeded = resultContributionActions(laneProduct('unassessed', 'resolved'));
    expect(stillNeeded.addIngredients).toBe(true);
    expect(stillNeeded.updateIngredients).toBe(false);
  });

  it('reconstructs reviewed multi-country percentage origins and omits fields the document does not contain', () => {
    const present = buildManualTextDocument({
      barcode: '9300673111111',
      sessionId: 'session',
      unitId: 'unit',
      domain: 'origins',
      statement: 'Grown in New Zealand, Australia, at least 80%',
      originClaimType: 'grown_in',
      originCountry: 'New Zealand',
      originCountries: ['New Zealand', 'Australia'],
      originPercentage: 80,
      originPercentageQualifier: 'at_least',
      originQualification: 'multiple',
    });
    const content = canonicalManualOriginContent(present!);
    expect(content?.exactWording).toBe('Grown in New Zealand, Australia, at least 80%');
    expect(content?.originStructured).toEqual({
      claimType: 'grown_in',
      primaryCountry: 'New Zealand',
      countries: ['New Zealand', 'Australia'],
      ingredientOriginPercentage: 80,
      percentageQualifier: 'at_least',
      originQualification: 'multiple',
    });

    const bare = buildManualTextDocument({
      barcode: '9300673111111',
      sessionId: 'session',
      unitId: 'unit',
      domain: 'origins',
      statement: 'Grown in Australia',
      originClaimType: 'grown_in',
      originCountry: 'Australia',
    });
    expect(canonicalManualOriginContent(bare!)?.originStructured).toEqual({
      claimType: 'grown_in',
      primaryCountry: 'Australia',
    });
  });

  it('uses the sole ingredient identity for grown-in completeness and fails closed when identity is ambiguous', () => {
    const open = { details: { governedFlagCount: 0 } } as OpenPillarResult;
    const fact: GovernedOriginFact = {
      evidenceId: 'origin-1',
      subjectKey: 'grown_in',
      claimType: 'grown_in',
      countries: ['New Zealand'],
      exactWording: 'Grown in New Zealand',
      confidence: 'limited',
    };
    const single = resolveGovernedOriginsDisclosure(
      { barcode: '1', ingredients_text_en: 'Raspberries (100%)' } as Product,
      open,
      [fact]
    );
    expect(single).toEqual({ resolved: true, requirement: 'evidently_complete' });
    const ambiguous = resolveGovernedOriginsDisclosure(
      { barcode: '1', ingredients_text_en: 'raspberries, sugar' } as Product,
      open,
      [fact]
    );
    expect(ambiguous.resolved).toBe(false);
  });

  it('prefills an existing nutrition value and withholds full success when only part of a submission is admitted', () => {
    expect(nutritionAmountsFromExisting({ fat_100g: 2 })).toMatchObject({ fat: '2' });
    expect(admissionCompletedEveryReviewedUnit(['unit-a', 'unit-b'], ['unit-a'])).toBe(false);
    expect(admissionCompletedEveryReviewedUnit(['unit-a'], ['unit-a', 'unit-b'])).toBe(true);
  });

  it('gives packet claims and certifications one consumer entry', () => {
    const result = fs.readFileSync(path.join(REPO, 'app/result/[barcode].tsx'), 'utf8');
    const modal = fs.readFileSync(path.join(REPO, 'src/components/PacketContributionModal.tsx'), 'utf8');
    expect(result).toContain('PACKET_INFORMATION_ADD');
    expect(result).toContain('PACKET_INFORMATION_UPDATE');
    expect(result).not.toContain('Add certifications');
    expect(result).not.toContain('Lane A');
    expect(result).not.toContain('Lane B');
    expect(modal).toContain('Claim on the pack');
    expect(modal).toContain('Certification shown on the pack');
    expect(modal).toContain('admissionCompletedEveryReviewedUnit');
    expect(modal).not.toContain('Lane A');
    expect(result).toContain('rveelPacketNutritionStatus');
    expect(result).toContain('authoritativeSnapshot');
    expect(result).toContain('subscribeEvidenceAdmission');
  });

  it('drives certification update from prevailing governed wording as well as source certifications', () => {
    const base = laneProduct('resolved', 'resolved');
    expect(resultContributionActions(base).certificationsAction).toBe('add');
    expect(resultContributionActions(base).packetInformationAction).toBe('add');
    const contributed = resultContributionActions({
      ...base,
      rveelGovernedCertifications: ['Fairtrade'],
    });
    expect(contributed.certificationsAction).toBe('update');
    expect(contributed.packetInformationAction).toBe('update');
  });
});
