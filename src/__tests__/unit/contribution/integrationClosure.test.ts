import * as fs from 'fs';
import * as path from 'path';
import { ingredientComparisonKey, ingredientSubjectKey } from '../../../contributions/originStructured';
import {
  nutritionAmountsToSubmit,
  nutritionPrefillFromSource,
  originDraftsFromGovernedFacts,
  originRowsToSubmit,
  projectAdmittedIngredientsDisplay,
  retainedAfterPartialAdmission,
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
import { unitRevision } from '../../../evidenceAuthority/device';
import type { PacketEvidenceUnit } from '../../../packetContribution/types';
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

  it('recognises a characterising percentage for comparison and keeps the evidence subject distinct', () => {
    const printed = 'Raspberries (100%)';
    expect(ingredientComparisonKey(printed)).toBe('raspberries');
    expect(ingredientComparisonKey('Strawberries (100%)')).toBe('strawberries');
    expect(ingredientSubjectKey(printed)).toBe('raspberries (100%)');
    expect(ingredientSubjectKey('Raspberries')).toBe('raspberries');
    expect(ingredientSubjectKey(printed)).not.toBe(ingredientSubjectKey('Raspberries'));
    expect(printed).toBe('Raspberries (100%)');
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

  it('prefills nutrition on its source basis and does not turn an unchanged prefill into evidence', () => {
    const prefill = nutritionPrefillFromSource({ fat_100g: 2, sodium_100g: 0.4 }, '100g');
    expect(prefill.basis).toBe('per_100g');
    expect(prefill.amounts.fat).toBe('2');
    expect(prefill.amounts.sodium).toBe('0.4');
    expect(prefill.sodiumUnit).toBe('g');
    expect(nutritionAmountsToSubmit(prefill, prefill, [])).toEqual([]);
    expect(nutritionAmountsToSubmit({ ...prefill, amounts: { ...prefill.amounts, fat: '3' } }, prefill, ['fat'])).toEqual([
      { attribute: 'fat', value: 3, unit: 'g' },
    ]);
  });

  it('keeps another contributor’s unchanged origin fact out of a new submission', () => {
    const existing = originDraftsFromGovernedFacts([
      {
        evidenceId: 'contributor-a',
        subjectKey: 'grown_in',
        claimType: 'grown_in',
        countries: ['New Zealand'],
        exactWording: 'Grown in New Zealand',
        confidence: 'limited',
      },
    ]);
    const submitted = originRowsToSubmit([
      ...existing,
      {
        intent: 'new',
        claimType: 'packed_in',
        wording: 'Packed in Australia',
        place: 'Australia',
        ingredient: '',
        percentage: '',
      },
    ]);
    expect(submitted.map((row) => row.evidenceId)).toEqual([undefined]);
    expect(submitted.map((row) => row.wording)).toEqual(['Packed in Australia']);
  });

  it('retains refused observations and does not treat admitted units as still to send', () => {
    const retained = retainedAfterPartialAdmission(
      [
        { unitId: 'added', label: 'Grown in New Zealand' },
        { unitId: 'held', label: 'Fairtrade' },
      ],
      ['added']
    );
    expect(retained.complete).toBe(false);
    expect(retained.admitted.map((row) => row.unitId)).toEqual(['added']);
    expect(retained.refused.map((row) => row.label)).toEqual(['Fairtrade']);
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
    expect(modal).toContain('retainedAfterPartialAdmission');
    expect(modal).toContain('Correct this statement');
    expect(modal).toContain('Already known:');
    expect(modal).not.toContain('Lane A');
    expect(result).toContain('rveelPacketNutritionStatus');
    expect(result).toContain('authoritativeSnapshot');
    expect(result).toContain('subscribeEvidenceAdmission');
  });

  it('does not let a non-scoring certification turn an unresolved packet invitation into Update', () => {
    const base = laneProduct('resolved', 'resolved');
    expect(resultContributionActions(base).certificationsAction).toBe('add');
    expect(resultContributionActions(base).packetInformationAction).toBe('add');
    const contributed = resultContributionActions({
      ...base,
      rveelGovernedCertifications: ['Community standard'],
    });
    expect(contributed.certificationsAction).toBe('update');
    expect(contributed.packetInformationAction).toBe('add');
  });

  it('changes the unit revision when origins countries, percentage, qualifier, or qualification change', () => {
    const base: PacketEvidenceUnit = {
      unitId: 'u',
      sessionId: 's',
      domain: 'origins',
      statement: 'Grown in New Zealand',
      support: { coverage: 'whole_image', sourceAssetId: 'manual-text:u' },
      origin: 'manual',
      extractionRunId: null,
      observationId: null,
      disposition: null,
      status: 'reviewed',
      originClaimType: 'grown_in',
      originCountry: 'New Zealand',
    };
    expect(unitRevision({ ...base, originPercentage: 80 })).not.toBe(unitRevision(base));
    expect(unitRevision({ ...base, originCountries: ['New Zealand', 'Australia'] })).not.toBe(unitRevision(base));
    expect(unitRevision({ ...base, originPercentageQualifier: 'at_least' })).not.toBe(unitRevision(base));
    expect(unitRevision({ ...base, originQualification: 'multiple' })).not.toBe(unitRevision(base));
  });
});
