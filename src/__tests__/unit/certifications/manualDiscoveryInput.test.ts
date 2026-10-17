import { resolveCertificationArtwork } from '../../../certifications/certificationArtwork';
import {
  discoveryCatalogueValidation,
  loadDiscoveryCatalogue,
  searchDiscoveryCatalogue,
  type DiscoveryEntry,
} from '../../../certifications/discoveryCatalogue';
import {
  addPendingObservation,
  certificationStatementForSelection,
  choosePacketSuggestion,
  pendingContributionLists,
  replacePendingLiteral,
} from '../../../certifications/pendingPacketObservation';
import { governedCertificationLabels } from '../../../contributions/certificationLane';
import { deriveEvidenceFacts } from '../../../evidenceAuthority/subjects';
import { evaluateEthicsCertifications } from '../../../services/ethicsCertificationsService';
import type { Product } from '../../../types/product';

describe('packet claims manual discovery input', () => {
  const validation = discoveryCatalogueValidation();

  it('loads catalogue 1.0.2 with ten scoring identities and five non-scoring vegan identities', () => {
    expect(validation.ok).toBe(true);
    expect(validation.assetVersion).toBe('1.0.2');
    expect(validation.selectableExistingCount).toBe(10);
    expect(validation.selectableNonscoringCount).toBe(5);
    expect(validation.errors).toEqual([]);
  });

  it('adds Source of Fibre and No artificial colours as literal wording in one list', () => {
    let rows = addPendingObservation([], { literalWording: 'Source of Fibre', source: 'manual' }).rows;
    rows = addPendingObservation(rows, { literalWording: 'No artificial colours', source: 'manual' }).rows;
    const lists = pendingContributionLists(rows);
    expect(lists.claims).toEqual(['Source of Fibre', 'No artificial colours']);
    expect(lists.certifications).toEqual(['']);
    expect(governedCertificationLabels('Source of Fibre')).toBeUndefined();
  });

  it('shows organic discovery and still allows the typed wording without selecting ACO', () => {
    const hits = searchDiscoveryCatalogue('organic');
    expect(hits.some((hit) => hit.productionId === 'cert.aco_organic' && hit.selectable)).toBe(true);
    expect(hits.some((hit) => hit.selectable === false)).toBe(true);
    const lists = pendingContributionLists([], 'organic');
    expect(lists.claims).toEqual(['organic']);
    expect(lists.certifications).toEqual(['']);
    expect(governedCertificationLabels('organic')).toBeUndefined();
  });

  it('selects Vegan Australia Certified as a non-scoring identity and keeps the typed wording', () => {
    const hit = searchDiscoveryCatalogue('vegan').find((row) => row.consumerName === 'Vegan Australia Certified');
    expect(hit?.selectable).toBe(true);
    expect(hit?.scoringEligible).toBe(false);
    expect(hit?.productionId).toBe('vegan.au');
    const chosen = choosePacketSuggestion([], hit!, 'vegan');
    expect(chosen.fieldText).toBe('Vegan Australia Certified');
    expect(chosen.rows[0]?.productionCertificationId).toBe('vegan.au');
    expect(chosen.rows[0]?.literalWording).toBe('vegan');
    const lists = pendingContributionLists(chosen.rows, chosen.fieldText);
    expect(lists.certifications).toEqual(['Vegan Australia Certified']);
    expect(lists.claims).toEqual(['']);
    expect(lists.productionByStatement['Vegan Australia Certified']).toBe('vegan.au');
    expect(lists.literalsByStatement['Vegan Australia Certified']).toBe('vegan');
    expect(governedCertificationLabels('Vegan Australia Certified')).toBeUndefined();
    const derived = deriveEvidenceFacts([
      {
        domain: 'certifications',
        claimValue: 'Vegan Australia Certified',
        exactWording: 'vegan',
        certificationId: 'vegan.au',
      },
    ]);
    expect(derived.facts[0]?.certificationId).toBe('vegan.au');
    expect(derived.facts[0]?.claimValue).toBe('Vegan Australia Certified');
    expect(derived.facts[0]?.exactWording).toBe('vegan');
    expect(derived.facts[0]?.labelsTags).toBeUndefined();
    expect(derived.facts[0]?.subjectKey).toBe('certifications|scheme:vegan.au');
    const scored = evaluateEthicsCertifications({
      barcode: '1',
      product_name: 'Plain oats',
      certifications: [{ name: 'Vegan Australia Certified' }],
    } as Product);
    expect(scored.adjustment).toBe(0);
    expect(scored.eligibleSchemes).toEqual([]);
  });

  it('puts a tapped governed mark into the field and keeps that production identity', () => {
    const hit = searchDiscoveryCatalogue('Fairtrade').find((row) => row.productionId === 'cert.fairtrade');
    const chosen = choosePacketSuggestion([], hit!, 'fair');
    expect(chosen.fieldText).toBe('Fairtrade');
    expect(chosen.rows[0]?.productionCertificationId).toBe('cert.fairtrade');
    const lists = pendingContributionLists(chosen.rows, chosen.fieldText);
    expect(lists.certifications).toEqual(['Fairtrade']);
    expect(lists.claims).toEqual(['']);
  });

  it('returns every Veg match and makes the five named vegan identities selectable without scoring', () => {
    const hits = searchDiscoveryCatalogue('Veg');
    expect(hits.length).toBeGreaterThanOrEqual(5);
    expect(hits.map((hit) => hit.consumerName)).toEqual(expect.arrayContaining(['V-Label Vegan', 'V-Label Vegetarian']));
    expect(hits.filter((hit) => hit.selectable).map((hit) => hit.consumerName).sort()).toEqual([
      'Certified Vegan (Vegan Action)',
      'The Vegan Society Vegan Trademark',
      'V-Label Vegan',
      'V-Label Vegetarian',
      'Vegan Australia Certified',
    ]);
    expect(hits.filter((hit) => hit.selectable).every((hit) => hit.scoringEligible === false)).toBe(true);
    expect(searchDiscoveryCatalogue('cert').length).toBeGreaterThan(5);
  });

  it('keeps gluten free as wording and does not offer Coeliac Australia', () => {
    const hits = searchDiscoveryCatalogue('gluten free');
    expect(hits.some((hit) => hit.productionId === 'cert.coeliac_australia' || /coeliac/i.test(hit.consumerName))).toBe(false);
    const lists = pendingContributionLists([], 'gluten free');
    expect(lists.claims).toEqual(['gluten free']);
    expect(governedCertificationLabels('gluten free')).toBeUndefined();
  });

  it('selects Fairtrade explicitly and keeps a separate literal claim', () => {
    const hits = searchDiscoveryCatalogue('Fairtrade');
    const fairtrade = hits.find((hit) => hit.productionId === 'cert.fairtrade' && hit.selectable);
    expect(fairtrade?.consumerName).toBe('Fairtrade');
    let rows = addPendingObservation([], {
      literalWording: 'Fairtrade',
      source: 'manual',
      productionCertificationId: 'cert.fairtrade',
      canonicalName: 'Fairtrade',
    }).rows;
    rows = addPendingObservation(rows, { literalWording: 'No artificial colours', source: 'manual' }).rows;
    const lists = pendingContributionLists(rows);
    expect(lists.certifications).toEqual(['Fairtrade']);
    expect(lists.claims).toEqual(['No artificial colours']);
    expect(governedCertificationLabels('Fairtrade')).toEqual(['en:fair-trade']);
  });

  it('keeps UTZ, Rainforest Alliance, FODMAP schemes and FSC Mix distinct', () => {
    const utz = searchDiscoveryCatalogue('UTZ').find((hit) => hit.selectable);
    const regenerative = searchDiscoveryCatalogue('Rainforest Alliance Certified Regenerative');
    const fodmap = searchDiscoveryCatalogue('low FODMAP');
    const fsc = searchDiscoveryCatalogue('FSC Mix').find((hit) => hit.productionId === 'cert.fsc_mix');
    expect(utz?.productionId).toBe('cert.utz');
    expect(utz?.consumerName).toBe('UTZ Certified');
    expect(regenerative.some((hit) => hit.selectable)).toBe(false);
    expect(regenerative.some((hit) => hit.consumerName.includes('Regenerative'))).toBe(true);
    expect(fodmap.filter((hit) => hit.selectable).map((hit) => hit.productionId).sort()).toEqual([
      'cert.fodmap_friendly',
      'cert.monash_low_fodmap',
    ]);
    expect(fsc?.selectable).toBe(true);
    expect(fsc?.qualifier).toBe('Packaging component');
    expect(certificationStatementForSelection('cert.utz', 'UTZ')).toBe('UTZ');
    expect(governedCertificationLabels('UTZ')).toEqual(['en:utz']);
    const regenerativeWording = pendingContributionLists([], 'Rainforest Alliance Certified Regenerative');
    expect(regenerativeWording.certifications).toEqual(['']);
    expect(regenerativeWording.claims).toEqual(['Rainforest Alliance Certified Regenerative']);
  });

  it('retains unrecognised wording as a claim and keeps a selected alias literal beside the production identity', () => {
    const lists = pendingContributionLists(
      addPendingObservation([], {
        literalWording: 'fair trade',
        source: 'manual',
        productionCertificationId: 'cert.fairtrade',
        canonicalName: 'Fairtrade',
      }).rows
    );
    expect(lists.certifications).toEqual(['Fairtrade']);
    expect(lists.literalsByStatement.Fairtrade).toBe('fair trade');
    const derived = deriveEvidenceFacts([
      {
        domain: 'certifications',
        claimValue: 'Fairtrade',
        exactWording: 'fair trade',
        certificationId: 'cert.fairtrade',
        labelsTags: ['en:fair-trade'],
      },
    ]);
    expect(derived.facts[0]?.exactWording).toBe('fair trade');
    expect(derived.facts[0]?.labelsTags).toEqual(['en:fair-trade']);
    expect(derived.facts[0]?.certificationId).toBe('cert.fairtrade');
    const unknown = pendingContributionLists([], 'XYZ Sustainable Certified');
    expect(unknown.claims).toEqual(['XYZ Sustainable Certified']);
    expect(unknown.certifications).toEqual(['']);
  });

  it('drops a selected identity when the edited wording no longer names that mark', () => {
    const selected = addPendingObservation([], {
      literalWording: 'fair trade',
      source: 'manual',
      productionCertificationId: 'cert.fairtrade',
      canonicalName: 'Fairtrade',
    }).rows;
    const edited = replacePendingLiteral(selected, selected[0].localId, 'No artificial colours');
    expect(edited[0].productionCertificationId).toBeUndefined();
    expect(pendingContributionLists(edited).claims).toEqual(['No artificial colours']);
    expect(pendingContributionLists(edited).certifications).toEqual(['']);
  });

  it('blocks an accidental duplicate and still allows a different line', () => {
    const first = addPendingObservation([], { literalWording: 'Source of Fibre', source: 'manual' });
    const duplicate = addPendingObservation(first.rows, { literalWording: 'source of fibre', source: 'manual' });
    expect(duplicate.added).toBe(false);
    expect(duplicate.rows).toHaveLength(1);
    const second = addPendingObservation(first.rows, { literalWording: 'High protein', source: 'manual' });
    expect(second.rows).toHaveLength(2);
  });

  it('fails closed on a duplicate id and hides excluded entries', () => {
    const broken = loadDiscoveryCatalogue({
      asset_id: 'rveel.packet_certification_manual_discovery',
      asset_version: '9.9.9',
      entries: [
        { id: 'same', consumer_name: 'One', runtime_treatment: 'discoverable_unapproved', search_visible: true, selectable: false, terms: [] },
        { id: 'same', consumer_name: 'Two', runtime_treatment: 'discoverable_unapproved', search_visible: true, selectable: false, terms: [] },
      ],
    });
    expect(broken.validation.ok).toBe(false);
    expect(broken.entries).toEqual([]);
    expect(searchDiscoveryCatalogue('Halal').some((hit) => /AFIC|MUIS|Malaysia/i.test(hit.consumerName))).toBe(false);
  });

  it('can retire a discovery row in a later snapshot without changing the production scoring label', () => {
    const current = searchDiscoveryCatalogue('Fairtrade').find((hit) => hit.productionId === 'cert.fairtrade');
    expect(current?.selectable).toBe(true);
    const retired: DiscoveryEntry = {
      id: 'fairtrade.product',
      familyId: 'fairtrade',
      consumerName: 'Fairtrade',
      semanticVariant: '',
      subjectScopeDescription: '',
      lifecycle: 'retired',
      treatment: 'selectable_existing',
      searchVisible: false,
      selectable: false,
      productionId: 'cert.fairtrade',
      terms: [{ text: 'Fairtrade', role: 'canonical_display' }],
      artwork: {
        assetRef: null,
        permissionStatus: 'not_obtained',
        renderEnabled: false,
        approvedSurfaces: [],
        validUntil: null,
        revokedAt: null,
        territory: null,
        platform: null,
        productAssociationRequired: true,
        approvedVariant: null,
        permissionEvidenceRef: null,
      },
    };
    expect(searchDiscoveryCatalogue('Fairtrade', [retired])).toEqual([]);
    expect(governedCertificationLabels('Fairtrade')).toEqual(['en:fair-trade']);
  });

  it('renders text unless artwork permission, asset, surface and association all pass', () => {
    expect(resolveCertificationArtwork({ accessibleName: 'Fairtrade', productionId: 'cert.fairtrade', surface: 'product_result' }).render).toBe('text');
    const revoked = resolveCertificationArtwork({
      accessibleName: 'Fairtrade',
      surface: 'product_result',
      associationAdmitted: true,
      artwork: {
        assetRef: 'fairtrade.png',
        permissionStatus: 'approved',
        renderEnabled: true,
        approvedSurfaces: ['product_result'],
        validUntil: null,
        revokedAt: '2026-10-01',
        territory: null,
        platform: null,
        productAssociationRequired: true,
        approvedVariant: null,
        permissionEvidenceRef: 'rights-1',
      },
    });
    expect(revoked.render).toBe('text');
    const recognitionOnly = resolveCertificationArtwork({
      accessibleName: 'Fairtrade',
      surface: 'product_result',
      associationAdmitted: true,
      artwork: {
        assetRef: 'fairtrade.png',
        permissionStatus: 'approved',
        renderEnabled: true,
        approvedSurfaces: ['recognition_example'],
        validUntil: null,
        revokedAt: null,
        territory: null,
        platform: null,
        productAssociationRequired: true,
        approvedVariant: null,
        permissionEvidenceRef: 'rights-1',
      },
    });
    expect(recognitionOnly.render).toBe('text');
    const ready = resolveCertificationArtwork({
      accessibleName: 'Fairtrade',
      surface: 'product_result',
      associationAdmitted: true,
      now: new Date('2026-10-17T00:00:00Z'),
      artwork: {
        assetRef: 'fairtrade.png',
        permissionStatus: 'approved',
        renderEnabled: true,
        approvedSurfaces: ['product_result'],
        validUntil: '2027-01-01',
        revokedAt: null,
        territory: null,
        platform: null,
        productAssociationRequired: true,
        approvedVariant: 'primary',
        permissionEvidenceRef: 'rights-1',
      },
    });
    expect(ready).toEqual({ render: 'mark', accessibleName: 'Fairtrade', assetRef: 'fairtrade.png' });
  });
});
