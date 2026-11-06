/**
 * Voluntary contribution access stays on the settled card-pencil journeys.
 * Checking and a closed Result latch do not open those pencils.
 */

import fs from 'fs';
import path from 'path';
import type { Product } from '../../../types/product';
import { originRowsForJourney } from '../../../contribution/consumerSurface';
import { prepareVisibleContribution } from '../../../contribution/visibleContribution';
import {
  ADD_OR_CORRECT_INFORMATION,
  ABOUT_THIS_INFORMATION,
  PRODUCT_INFORMATION_HEADING,
  PRODUCT_INFORMATION_SUPPORT,
} from '../../../contribution/productInformationMenu';
import { voluntaryContributionOffer } from '../../../contribution/voluntaryContributionOffer';

const EMPTY_NUTRITION = { basis: 'per_100g' as const, amounts: {}, sodiumUnit: 'mg' as const };

function product(input: {
  settled?: boolean;
  omitPublication?: boolean;
  overall?: 'checking' | 'nr' | 'rated';
  bodyStatus?: 'checking' | 'nr' | 'rated' | 'pending';
  planetStatus?: 'checking' | 'nr' | 'rated';
  claimsStatus?: 'checking' | 'nr' | 'rated';
  omitPillar?: 'body' | 'planet' | 'claims' | 'transparency';
  nutrition?: 'resolved' | 'unassessed';
  processing?: 'resolved' | 'unassessed';
  ingredient?: 'resolved' | 'unassessed';
  origins?: 'resolved' | 'unassessed';
  packet?: 'assessed' | 'unassessed_or_incomplete';
  transparencyStatus?: 'rated' | 'nr' | 'checking';
  publishedScore?: number | null;
  offCountry?: string;
  certifications?: string[];
  governedClaims?: string[];
} = {}): Product {
  if (input.omitPublication) {
    return { barcode: '9300000000001', trust_score: 80 } as Product;
  }
  const publication = {
    settled: input.settled !== false,
    body: {
      publicationStatus: input.bodyStatus ?? 'rated',
      publishedScore: input.publishedScore === undefined ? 12 : input.publishedScore,
      assessmentLanes: {
        nutrition: input.nutrition ?? 'resolved',
        processing: input.processing ?? 'resolved',
      },
    },
    planet: {
      publicationStatus: input.planetStatus ?? 'rated',
      publishedScore: input.publishedScore === undefined ? 12 : input.publishedScore,
      assessmentLanes: { broad_environment: 'resolved', packaging_fallback: 'resolved' },
    },
    claims: {
      publicationStatus: input.claimsStatus ?? 'rated',
      publishedScore: input.publishedScore === undefined ? 12 : input.publishedScore,
      assessmentLanes: { packet: input.packet ?? 'assessed', benchmark: 'assessed' },
    },
    transparency: {
      publicationStatus: input.transparencyStatus ?? 'rated',
      publishedScore: input.publishedScore === undefined ? 12 : input.publishedScore,
      assessmentLanes: {
        ingredient_clarity: input.ingredient ?? 'resolved',
        origins: input.origins ?? 'resolved',
      },
    },
    overall: {
      publicationStatus: input.overall ?? 'rated',
      publishedScore: input.publishedScore === undefined ? 48 : input.publishedScore,
    },
  };
  if (input.omitPillar) {
    delete (publication as { body?: unknown; planet?: unknown; claims?: unknown; transparency?: unknown })[
      input.omitPillar
    ];
  }
  return {
    barcode: '9300000000001',
    trust_score: input.publishedScore === 0 ? 0 : 61,
    manufacturing_places: input.offCountry,
    certifications: (input.certifications || []).map((name) => ({ id: name, name })),
    rveelGovernedPacketClaims: (input.governedClaims || []).map((wording) => ({ exactWording: wording })),
    _publication: publication,
  } as Product;
}

const open = { publicationSettled: true as const };

describe('voluntary contribution offer', () => {
  it('lists Change and the independent origin and packet Add rows when every pillar is Rated', () => {
    const labels = voluntaryContributionOffer(product(), open).map((row) => row.label);
    expect(labels).toEqual([
      'Change nutrition',
      'Change ingredients',
      'Add product origins',
      'Change product origins',
      'Add packet information',
      'Change packet information',
    ]);
    expect(labels.join(' ')).not.toMatch(/Planet|NOVA|processing|packaging|Eco-Score|benchmark|additive/i);
  });

  it('offers Change nutrition when processing is unresolved and does not invent a processing Add', () => {
    const offer = voluntaryContributionOffer(
      product({
        nutrition: 'resolved',
        processing: 'unassessed',
        ingredient: 'unassessed',
        origins: 'unassessed',
        packet: 'unassessed_or_incomplete',
        transparencyStatus: 'nr',
        overall: 'nr',
      }),
      open
    );
    expect(offer.map((row) => row.label)).toEqual(['Change nutrition']);
    expect(offer.map((row) => row.label).join(' ')).not.toMatch(/processing|NOVA|Planet/);
  });

  it('keeps Add and Change packet when a certification already exists', () => {
    const offer = voluntaryContributionOffer(
      product({ packet: 'assessed', certifications: ['Fairtrade'] }),
      open
    );
    expect(offer.filter((row) => row.destination === 'packetClaims').map((row) => row.journey)).toEqual([
      'add',
      'change',
    ]);
    const added = prepareVisibleContribution({
      contexts: ['packetClaims', 'certifications'],
      ingredientsText: '',
      nutrition: EMPTY_NUTRITION,
      nutritionBaseline: EMPTY_NUTRITION,
      origins: [],
      claims: [],
      initialClaims: [],
      certifications: ['Fairtrade', 'Organic'],
      initialCertifications: ['Fairtrade'],
    });
    expect(added.status).toBe('ready');
    if (added.status === 'ready') {
      expect(added.certifications).toContain('Organic');
      expect(added.ceasedSubjectKeys).toEqual([]);
    }
  });

  it('starts Add origins blank and opens the current proposition on Change', () => {
    const chile = {
      claimType: 'produced_in' as const,
      wording: '',
      place: 'Chile',
      ingredient: '',
      percentage: '',
      intent: 'edited' as const,
    };
    const offer = voluntaryContributionOffer(product({ origins: 'resolved' }), open);
    expect(offer.filter((row) => row.destination === 'origins').map((row) => row.journey)).toEqual([
      'add',
      'change',
    ]);
    expect(originRowsForJourney('add', [chile], 'Chile')).toEqual([
      { claimType: null, wording: '', place: '', ingredient: '', percentage: '', intent: 'new' },
    ]);
    expect(originRowsForJourney('change', [chile], 'Chile')[0]?.place).toBe('Chile');
  });

  it('keeps voluntary rows for settled NR and a genuine published zero', () => {
    const nr = voluntaryContributionOffer(product({ overall: 'nr', publishedScore: null }), open).map(
      (row) => row.label
    );
    const zero = voluntaryContributionOffer(product({ publishedScore: 0 }), open).map((row) => row.label);
    const rated = voluntaryContributionOffer(product({ publishedScore: 48 }), open).map((row) => row.label);
    expect(nr).toEqual(rated);
    expect(zero).toEqual(rated);
    expect(nr.length).toBeGreaterThan(0);
  });

  it('offers nothing for Checking, a missing or unsettled snapshot, or a closed latch', () => {
    const withEvidence = {
      offCountry: 'Australia',
      certifications: ['Fairtrade'],
      governedClaims: ['High fibre'],
    };
    expect(voluntaryContributionOffer(product({ ...withEvidence, overall: 'checking', settled: true }), open)).toEqual(
      []
    );
    expect(voluntaryContributionOffer(product({ ...withEvidence, settled: false }), open)).toEqual([]);
    expect(voluntaryContributionOffer(product({ omitPublication: true }), open)).toEqual([]);
    expect(voluntaryContributionOffer(product(withEvidence), { publicationSettled: false })).toEqual([]);
    expect(voluntaryContributionOffer(product(withEvidence))).toEqual([]);
  });

  it('drops a row when the latch closes between the menu and the tap', () => {
    const shown = product();
    expect(voluntaryContributionOffer(shown, open).some((row) => row.key === 'change-nutrition')).toBe(true);
    const atTap = voluntaryContributionOffer(shown, { publicationSettled: false });
    expect(atTap.some((row) => row.key === 'change-nutrition')).toBe(false);
    expect(atTap).toEqual([]);
  });

  it('does not read a Highlight ledger or an internal score', () => {
    const bare = product();
    delete (bare as { pillarDetails?: unknown }).pillarDetails;
    delete (bare as { _truscore_analysis?: unknown })._truscore_analysis;
    (bare as { trust_score?: number }).trust_score = 4;
    expect(voluntaryContributionOffer(bare, open).map((row) => row.label)).toEqual(
      voluntaryContributionOffer(product({ publishedScore: 18 }), open).map((row) => row.label)
    );
  });

  it('does not turn an unchanged or local-only statement into a score input', () => {
    expect(voluntaryContributionOffer(product({ omitPublication: true }), open)).toEqual([]);
    const unchanged = prepareVisibleContribution({
      contexts: ['packetClaims'],
      ingredientsText: '',
      nutrition: EMPTY_NUTRITION,
      nutritionBaseline: EMPTY_NUTRITION,
      origins: [],
      claims: [],
      certifications: ['ACO Certified Organic'],
      initialCertifications: ['ACO Certified Organic'],
      pendingPacketWording: 'ACO Certified Organic',
    });
    expect(unchanged.status).toBe('unchanged');
  });

  it('fails closed when any pillar is Checking, missing, or not a terminal status', () => {
    const six = [
      'Change nutrition',
      'Change ingredients',
      'Add product origins',
      'Change product origins',
      'Add packet information',
      'Change packet information',
    ];
    expect(voluntaryContributionOffer(product({ overall: 'rated', bodyStatus: 'checking' }), open)).toEqual([]);
    expect(voluntaryContributionOffer(product({ overall: 'rated', planetStatus: 'checking' }), open)).toEqual([]);
    expect(voluntaryContributionOffer(product({ overall: 'rated', claimsStatus: 'checking' }), open)).toEqual([]);
    expect(voluntaryContributionOffer(product({ overall: 'rated', transparencyStatus: 'checking' }), open)).toEqual([]);
    expect(voluntaryContributionOffer(product({ overall: 'nr', omitPillar: 'planet' }), open)).toEqual([]);
    expect(voluntaryContributionOffer(product({ overall: 'rated', bodyStatus: 'pending' }), open)).toEqual([]);

    const settledNr = voluntaryContributionOffer(
      product({ overall: 'nr', bodyStatus: 'nr', publishedScore: null }),
      open
    ).map((row) => row.label);
    expect(settledNr).toEqual(six);
    expect(voluntaryContributionOffer(product(), open).map((row) => row.label)).toEqual(six);
    expect(voluntaryContributionOffer(product({ publishedScore: 0 }), open).map((row) => row.label)).toEqual(six);
  });

  it('does not open a previously shown action after a pillar becomes Checking', () => {
    const shown = product();
    expect(voluntaryContributionOffer(shown, open).some((row) => row.key === 'change-nutrition')).toBe(true);
    const atTap = voluntaryContributionOffer(product({ bodyStatus: 'checking' }), open);
    expect(atTap.some((row) => row.key === 'change-nutrition')).toBe(false);
    expect(atTap).toEqual([]);
  });

  it('places the neutral action on Result and rechecks the latch before a pencil tap', () => {
    const source = fs.readFileSync(path.join(__dirname, '../../../../app/result/[barcode].tsx'), 'utf8');
    expect(PRODUCT_INFORMATION_HEADING).toBe('Information missing?');
    expect(PRODUCT_INFORMATION_SUPPORT).toBe(
      'If you think any of the information about this product displayed is incorrect or missing then please help us out and make any necessary additions.'
    );
    expect(ADD_OR_CORRECT_INFORMATION).toBe('Add or correct information');
    expect(ABOUT_THIS_INFORMATION).toBe('About this information');
    expect(source).toContain('freshProductInformationMenu');
    expect(source).toContain('publicationSettledRef.current');
    expect(source).not.toContain('userContributionRouteLive');
    expect(source).not.toContain('Incomplete product data');
    const frameEnd = source.indexOf('</EmeraldScoreFrame>');
    const cardAt = source.indexOf('<ProductDataLimitationsCard', frameEnd);
    expect(source.slice(frameEnd, cardAt)).not.toContain('TouchableOpacity');
    const offeredCard = source.slice(cardAt, source.indexOf('/>', cardAt));
    expect(offeredCard).toContain('hasContributionActions={informationMenu.length > 0}');
    expect(offeredCard).toContain('if (freshProductInformationMenu().length === 0) return;');
    expect(offeredCard).toContain("setContributionChoice('productInformation')");
    const secondAt = source.indexOf('<ProductDataLimitationsCard', source.indexOf('/>', cardAt));
    const insufficientCard = source.slice(secondAt, source.indexOf('/>', secondAt));
    expect(insufficientCard).toContain('onAddOrCorrect');
  });
});
