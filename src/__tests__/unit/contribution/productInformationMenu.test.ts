/**
 * One presentation menu over the existing assessment and voluntary journeys.
 */

import type { Product } from '../../../types/product';
import { originRowsForJourney } from '../../../contribution/consumerSurface';
import { productInformationMenu } from '../../../contribution/productInformationMenu';
import { resultContributionActions } from '../../../contribution/resultContributionActions';
import { voluntaryContributionOffer } from '../../../contribution/voluntaryContributionOffer';

const EMPTY_NUTRITION = { basis: 'per_100g' as const, amounts: {}, sodiumUnit: 'mg' as const };

function opportunity(routeKey: string) {
  return { material: true, routeStatus: 'live' as const, routeKey, domain: routeKey };
}

function product(input: {
  settled?: boolean;
  omitPublication?: boolean;
  omitPlanet?: boolean;
  overall?: 'checking' | 'nr' | 'rated';
  bodyStatus?: 'checking' | 'nr' | 'rated';
  planetStatus?: 'checking' | 'nr' | 'rated';
  claimsStatus?: 'checking' | 'nr' | 'rated';
  transparencyStatus?: 'rated' | 'nr' | 'checking';
  nutrition?: 'resolved' | 'unassessed';
  processing?: 'resolved' | 'unassessed';
  ingredient?: 'resolved' | 'unassessed';
  origins?: 'resolved' | 'unassessed';
  packet?: 'assessed' | 'unassessed_or_incomplete';
  bodyOpportunity?: ReturnType<typeof opportunity> | null;
  transparencyOpportunity?: ReturnType<typeof opportunity> | null;
  claimsOpportunity?: ReturnType<typeof opportunity> | null;
  offCountry?: string;
  certifications?: string[];
  governedCertifications?: string[];
  publishedScore?: number | null;
} = {}): Product {
  if (input.omitPublication) return { barcode: '9300000000001' } as Product;
  const nutrition = input.nutrition ?? 'resolved';
  const processing = input.processing ?? 'resolved';
  const ingredient = input.ingredient ?? 'resolved';
  const origins = input.origins ?? 'resolved';
  const packet = input.packet ?? 'assessed';
  return {
    barcode: '9300000000001',
    manufacturing_places: input.offCountry,
    certifications: (input.certifications || []).map((name) => ({ id: name, name })),
    rveelGovernedCertifications: input.governedCertifications,
    _publication: {
      settled: input.settled !== false,
      body: {
        publicationStatus: input.bodyStatus ?? 'rated',
        publishedScore: input.publishedScore === undefined ? 12 : input.publishedScore,
        assessmentLanes: { nutrition, processing },
        s26: input.bodyOpportunity === null ? { explanation: 'Body note' } : input.bodyOpportunity ? { explanation: 'Body note', contributionOpportunity: input.bodyOpportunity } : nutrition === 'resolved' && processing === 'resolved' ? { explanation: 'Body assessed' } : { explanation: 'Body note', contributionOpportunity: opportunity('ingredients_nutrition') },
      },
      planet: input.omitPlanet
        ? undefined
        : {
            publicationStatus: input.planetStatus ?? 'rated',
            publishedScore: 12,
            assessmentLanes: { broad_environment: 'resolved', packaging_fallback: 'resolved' },
            s26: { explanation: 'Planet note', contributionOpportunity: { material: false, routeStatus: 'none', domain: null } },
          },
      claims: {
        publicationStatus: input.claimsStatus ?? 'rated',
        publishedScore: 12,
        assessmentLanes: { packet, benchmark: 'assessed' },
        s26: input.claimsOpportunity === null ? { explanation: 'Claims note' } : input.claimsOpportunity ? { explanation: 'Claims note', contributionOpportunity: input.claimsOpportunity } : packet === 'assessed' ? { explanation: 'Claims assessed' } : { explanation: 'Claims note', contributionOpportunity: opportunity('packet_claims') },
      },
      transparency: {
        publicationStatus: input.transparencyStatus ?? 'rated',
        publishedScore: 12,
        assessmentLanes: { ingredient_clarity: ingredient, origins },
        s26: input.transparencyOpportunity === null
          ? { explanation: 'Transparency note' }
          : input.transparencyOpportunity
            ? { explanation: 'Transparency note', contributionOpportunity: input.transparencyOpportunity }
            : ingredient === 'resolved' && origins === 'resolved'
              ? { explanation: 'Transparency assessed' }
              : {
                  explanation: 'Transparency note',
                  contributionOpportunity: opportunity(origins !== 'resolved' ? 'origins' : 'ingredients_nutrition'),
                },
      },
      overall: {
        publicationStatus: input.overall ?? 'rated',
        publishedScore: input.publishedScore === undefined ? 48 : input.publishedScore,
      },
    },
  } as Product;
}

const open = { publicationSettled: true as const };
const six = [
  'Change nutrition',
  'Change ingredients',
  'Add product origins',
  'Change product origins',
  'Add packet information',
  'Change packet information',
];

describe('product information menu', () => {
  it('keeps voluntary paths on a fully assessed Rated product, including a published zero', () => {
    expect(productInformationMenu(product(), open).map((row) => row.label)).toEqual(six);
    expect(productInformationMenu(product({ publishedScore: 0 }), open).map((row) => row.label)).toEqual(six);
    expect(productInformationMenu(product(), open).map((row) => row.label).join(' ')).not.toMatch(/Planet|NOVA|processing|packaging|Eco-Score|additive/i);
  });

  it('offers the governed nutrition Add and does not describe the card as incomplete', () => {
    const labels = productInformationMenu(
      product({
        overall: 'nr',
        bodyStatus: 'nr',
        nutrition: 'unassessed',
        processing: 'resolved',
      }),
      open
    ).map((row) => row.label);
    expect(labels).toContain('Add nutrition');
    expect(labels).toContain('Change ingredients');
    expect(labels).not.toContain('Add ingredients');
    expect(labels.join(' ')).not.toMatch(/incomplete|NOVA|processing/i);
  });

  it('does not invent a route for Planet NR when the customer lanes are already resolved', () => {
    const labels = productInformationMenu(
      product({ overall: 'nr', planetStatus: 'nr' }),
      open
    ).map((row) => row.label);
    expect(labels).toEqual(six);
    expect(labels.join(' ')).not.toMatch(/Planet/);
  });

  it('keeps Change nutrition and does not invent a NOVA Add when only processing is unresolved', () => {
    const labels = productInformationMenu(
      product({
        overall: 'nr',
        bodyStatus: 'rated',
        nutrition: 'resolved',
        processing: 'unassessed',
        ingredient: 'resolved',
        origins: 'resolved',
      }),
      open
    ).map((row) => row.label);
    expect(labels).toContain('Change nutrition');
    expect(labels).not.toContain('Add nutrition');
    expect(labels.join(' ')).not.toMatch(/NOVA|processing/);
  });

  it('keeps both Transparency journeys when the single opportunity names origins', () => {
    const labels = productInformationMenu(
      product({
        overall: 'nr',
        transparencyStatus: 'nr',
        ingredient: 'unassessed',
        origins: 'unassessed',
        nutrition: 'resolved',
        processing: 'resolved',
      }),
      open
    ).map((row) => row.label);
    expect(labels).toContain('Add ingredients');
    expect(labels).toContain('Add product origins');
    expect(labels).not.toContain('Change ingredients');
    expect(labels).not.toContain('Change product origins');
  });

  it('keeps Add and Change packet information when a certification is already shown', () => {
    const current = product({
      packet: 'unassessed_or_incomplete',
      claimsStatus: 'nr',
      overall: 'nr',
      certifications: ['Fairtrade'],
    });
    const labels = productInformationMenu(current, open).map((row) => row.label);
    expect(labels).toContain('Add packet information');
    expect(labels).toContain('Change packet information');
    expect(current.certifications).toEqual([{ id: 'Fairtrade', name: 'Fairtrade' }]);
    expect(resultContributionActions(current).packetInformationAction).toBe('add');
    expect(voluntaryContributionOffer(current, open).some((row) => row.key === 'add-packet' && row.journey === 'add')).toBe(true);
    expect(productInformationMenu(current, open).find((row) => row.key === 'add-packet')).toMatchObject({
      journey: 'add',
      formFirst: true,
      label: 'Add packet information',
    });
  });

  it('offers nothing for Checking, a closed latch, or a missing publication', () => {
    expect(productInformationMenu(product({ overall: 'checking', bodyStatus: 'checking' }), open)).toEqual([]);
    expect(productInformationMenu(product({ overall: 'checking', bodyStatus: 'rated', nutrition: 'unassessed' }), open)).toEqual([]);
    expect(productInformationMenu(product({
      planetStatus: 'checking',
      bodyStatus: 'nr',
      overall: 'nr',
      nutrition: 'unassessed',
    }), open)).toEqual([]);
    expect(productInformationMenu(product({ omitPlanet: true, nutrition: 'unassessed', bodyStatus: 'nr', overall: 'nr' }), open)).toEqual([]);
    const invalidPlanet = product({ nutrition: 'unassessed', bodyStatus: 'nr', overall: 'nr' });
    (invalidPlanet._publication as { planet: { publicationStatus: string } }).planet.publicationStatus = 'pending';
    expect(productInformationMenu(invalidPlanet, open)).toEqual([]);
    const missingLanes = product({ nutrition: 'unassessed', bodyStatus: 'nr', overall: 'nr' });
    delete (missingLanes._publication as { body: { assessmentLanes?: unknown } }).body.assessmentLanes;
    expect(productInformationMenu(missingLanes, open)).toEqual([]);
    expect(productInformationMenu(product({ settled: false }), open)).toEqual([]);
    expect(productInformationMenu(product({ omitPublication: true }), open)).toEqual([]);
    expect(productInformationMenu(product(), { publicationSettled: false })).toEqual([]);
    expect(productInformationMenu(product(), undefined)).toEqual([]);
  });

  it('drops a stale action when a pillar becomes Checking before the tap', () => {
    const shown = product({ nutrition: 'unassessed', bodyStatus: 'nr', overall: 'nr' });
    expect(productInformationMenu(shown, open).some((row) => row.key === 'add-nutrition')).toBe(true);
    const atTap = productInformationMenu(product({ nutrition: 'unassessed', bodyStatus: 'checking', overall: 'checking' }), open);
    expect(atTap.some((row) => row.key === 'add-nutrition')).toBe(false);
    expect(atTap).toEqual([]);
    expect(productInformationMenu(product({
      nutrition: 'unassessed',
      bodyStatus: 'nr',
      overall: 'nr',
      planetStatus: 'checking',
    }), open)).toEqual([]);
  });

  it('keeps the origins Add journey when an unresolved lane also has an OFF country', () => {
    const current = product({
      overall: 'nr',
      transparencyStatus: 'nr',
      origins: 'unassessed',
      offCountry: 'New Zealand',
    });
    expect(resultContributionActions(current).originsAction).toBe('add');
    expect(voluntaryContributionOffer(current, open).some((row) => row.key === 'add-origins' && row.journey === 'add')).toBe(true);
    expect(productInformationMenu(current, open).find((row) => row.key === 'add-origins')).toMatchObject({
      journey: 'add',
      formFirst: true,
      label: 'Add product origins',
    });
    expect(originRowsForJourney('add', [], 'New Zealand')[0]?.place).toBe('New Zealand');
    const governed = [{
      evidenceId: 'origin-1',
      subjectKey: 'made_in',
      claimType: 'made_in' as const,
      countries: ['Chile'],
      confidence: 'limited' as const,
    }];
    const withFact = product({ overall: 'nr', transparencyStatus: 'nr', origins: 'unassessed' });
    (withFact as Product & { rveelGovernedOrigins: typeof governed }).rveelGovernedOrigins = governed;
    expect(productInformationMenu(withFact, open).find((row) => row.key === 'add-origins')).toMatchObject({
      journey: 'add',
      formFirst: true,
    });
    expect(originRowsForJourney('add', [{
      claimType: 'made_in',
      wording: '',
      place: 'Chile',
      ingredient: '',
      percentage: '',
      intent: 'edited',
    }], '')).toEqual([
      expect.objectContaining({ claimType: null, place: '' }),
    ]);
    expect(withFact.rveelGovernedOrigins).toEqual(governed);
  });

  it('does not open an assessment Add from an unresolved lane that has no live opportunity', () => {
    const labels = productInformationMenu(
      product({
        nutrition: 'unassessed',
        bodyStatus: 'nr',
        overall: 'nr',
        bodyOpportunity: null,
      }),
      open
    ).map((row) => row.label);
    expect(labels).not.toContain('Add nutrition');
  });
});
