/**
 * J1–J12 production-path journeys for Packet information.
 * Machine observations stop at resolvePacketObservation. Admission is Evidence Authority.
 */
import fs from 'fs';
import path from 'path';
import { __setContributionCreationRecordClassForTests } from '../../../contributions/productionEpoch';
import { ceasedPrevailingSubjectKeys, correctionClosureFacts } from '../../../contribution/correctionClosure';
import {
  CERTIFICATION_ARTWORK_REGISTER_CSV,
  CERTIFICATION_CATALOGUE_CSV,
  CERTIFICATION_RECOGNITION_TERMS_CSV,
} from '../../../certifications/governedCsv';
import {
  consumerEmblemPermitted,
  evidenceFactFromResolution,
  governedCertificationAssets,
  isSameCurrentProposition,
  resolvePacketObservation,
  retainCurrentDespiteNonDetection,
  scopeDependentAssessment,
  searchPacketInformation,
  type GovernedCertificationAssets,
  type PacketResolution,
} from '../../../certifications/resolveCertification';
import {
  listUnresolvedMarkCandidates,
  recordUnresolvedObservation,
  resetUnresolvedMarkCandidatesForTests,
  setCandidateDisposition,
} from '../../../certifications/unresolvedMarkCandidates';
import { governedCertificationLabels } from '../../../contributions/certificationLane';
import { EvidenceAuthority } from '../../../evidenceAuthority/authority';
import { projectSnapshotForAssessment } from '../../../evidenceAuthority/assessment';
import { MemoryAuthorityStore } from '../../../evidenceAuthority/memoryStore';
import { deriveEvidenceFacts } from '../../../evidenceAuthority/subjects';
import type { EvidenceFactInput } from '../../../evidenceAuthority/types';
import { selectPrevailingPacketClaims } from '../../../claims/packetClaimReceiver';
import { stampCoreTruthAuthority } from '../../../config/coreTruthProductCacheAuthority';
import { sha256Hex } from '../../../packetContribution/sha256';
import type { Product } from '../../../types/product';
import { calculateTrustScore } from '../../../utils/trustScore';

const BARCODE = '9300673888888';
const packetBytes = new TextEncoder().encode('packet-information-journey');
const packetHash = sha256Hex(packetBytes);
const ASSET_DIR = path.join(__dirname, '../../../certifications/governed');

function authority() {
  return new EvidenceAuthority(new MemoryAuthorityStore(), {
    authorityEnv: 'uat',
    now: () => 12_000,
  });
}

function food(overrides: Partial<Product> = {}): Product {
  return stampCoreTruthAuthority({
    barcode: BARCODE,
    product_name: 'Journey oats',
    source: 'openfoodfacts',
    nutriments: { fat_100g: 2, sugars_100g: 4, proteins_100g: 8, energy_100g: 1500 },
    nutrition_data_per: '100g',
    nutriscore_grade: 'b',
    nova_group: 1,
    ecoscore_grade: 'b',
    ingredients_text: 'Wholegrain oats',
    labels_tags: [],
    labels: '',
    ...overrides,
  } as Product);
}

type Adjustment = { adjustmentId?: string; value: number };

function ethicsAdjustments(product: { _truscore_analysis?: { pillars?: { Ethics?: { adjustments?: Adjustment[] } } } }): Adjustment[] {
  return product._truscore_analysis?.pillars?.Ethics?.adjustments || [];
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

function factFor(resolution: PacketResolution): EvidenceFactInput {
  const fact = evidenceFactFromResolution(resolution);
  if (!fact) throw new Error('resolution_not_admissible');
  if (fact.domain === 'packet_claims') recordUnresolvedObservation(fact.exactWording || fact.claimValue || '');
  return fact;
}

beforeEach(() => {
  __setContributionCreationRecordClassForTests('production');
  process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV = 'uat';
  resetUnresolvedMarkCandidatesForTests();
});

afterEach(() => {
  __setContributionCreationRecordClassForTests(null);
});

describe('governed certification assets', () => {
  it('loads the same rows as the CSV seed files', () => {
    const normalize = (value: string) => value.replace(/\r\n/g, '\n').trim();
    expect(normalize(fs.readFileSync(path.join(ASSET_DIR, 'certification_catalogue_v0_1.csv'), 'utf8'))).toBe(
      normalize(CERTIFICATION_CATALOGUE_CSV)
    );
    expect(normalize(fs.readFileSync(path.join(ASSET_DIR, 'certification_recognition_terms_v0_1.csv'), 'utf8'))).toBe(
      normalize(CERTIFICATION_RECOGNITION_TERMS_CSV)
    );
    expect(normalize(fs.readFileSync(path.join(ASSET_DIR, 'certification_artwork_register_v0_1.csv'), 'utf8'))).toBe(
      normalize(CERTIFICATION_ARTWORK_REGISTER_CSV)
    );
    expect(governedCertificationAssets().catalogue).toHaveLength(10);
    expect(governedCertificationAssets().artwork.every((row) => row.consumerDisplayPermission === 'unknown')).toBe(true);
    expect(consumerEmblemPermitted('cert.fairtrade')).toBe(false);
  });
});

describe('Packet information journeys J1-J12', () => {
  it('J1 admits Gluten Free as packet wording and does not shortlist a certifier', async () => {
    const resolution = resolvePacketObservation({ observedWording: 'Gluten Free' });
    expect(resolution.kind).toBe('wording');
    expect(governedCertificationLabels('Gluten Free')).toBeUndefined();
    expect(governedCertificationLabels('gluten free')).toBeUndefined();
    const service = authority();
    const contributor = await service.issueCredential();
    const admitted = await send(service, contributor.contributorId, [factFor(resolution)], 'j1');
    const claims = selectPrevailingPacketClaims(projectSnapshotForAssessment(admitted.snapshot, 'uat'));
    expect(claims.map((row) => row.exactWording)).toEqual(['Gluten Free']);
    expect(projectSnapshotForAssessment(admitted.snapshot, 'uat').some((row) => row.domain === 'certifications')).toBe(false);
    const scored = await calculateTrustScore(food(), { authoritativeSnapshot: admitted.snapshot });
    expect(ethicsAdjustments(scored).some((row) => row.adjustmentId?.startsWith('ethics-v37-cert-'))).toBe(false);
    expect(listUnresolvedMarkCandidates()[0]?.disposition).toBe('Unresolved');
  });

  it('J2 admits a governed mark and Gluten Free as separate propositions', async () => {
    const mark = resolvePacketObservation({ observedWording: 'Coeliac Australia', visualMark: true });
    const claim = resolvePacketObservation({ observedWording: 'Gluten Free' });
    expect(mark.kind).toBe('certification');
    expect(claim.kind).toBe('wording');
    if (mark.kind !== 'certification') return;
    expect(mark.certificationId).toBe('cert.coeliac_australia');
    expect(mark.scoringLabel).toBeUndefined();
    const ignored = resolvePacketObservation({
      observedWording: 'Gluten Free',
      proposedCertificationId: 'cert.coeliac_australia',
    });
    expect(ignored.kind).toBe('wording');
    const service = authority();
    const contributor = await service.issueCredential();
    const admitted = await send(service, contributor.contributorId, [factFor(mark), factFor(claim)], 'j2');
    const rows = projectSnapshotForAssessment(admitted.snapshot, 'uat');
    expect(rows.some((row) => row.domain === 'certifications' && row.certificationId === 'cert.coeliac_australia')).toBe(true);
    expect(rows.some((row) => row.domain === 'packet_claims' && row.exactWording === 'Gluten Free')).toBe(true);
    const scored = await calculateTrustScore(food(), { authoritativeSnapshot: admitted.snapshot });
    expect(scored.rveelGovernedCertifications).toEqual(['Coeliac Australia Endorsement']);
    expect(ethicsAdjustments(scored).some((row) => row.adjustmentId?.startsWith('ethics-v37-cert-'))).toBe(false);
  });

  it('J3 asks for a closer photo and does not list subject-matter certifiers', () => {
    const resolution = resolvePacketObservation({
      visualMark: true,
      ambiguity: 'insufficient',
      observedWording: 'Gluten Free',
      proposedFamilyName: 'Organic',
    });
    expect(resolution).toEqual({ kind: 'closer_photo' });
    const unrelated = resolvePacketObservation({
      visualMark: true,
      ambiguity: 'family_variants',
      proposedFamilyName: 'Halal',
    });
    expect(unrelated).toEqual({ kind: 'closer_photo' });
  });

  it('J4 shows ACO Certified Organic at +2 and hides generic Organic +1', async () => {
    const organicProduct = food({ product_name: 'Organic Oats' });
    const before = await calculateTrustScore(organicProduct);
    expect(ethicsAdjustments(before).some((row) => row.adjustmentId === 'claims.organic.claim_only.v1' && row.value === 1)).toBe(true);
    const claim = resolvePacketObservation({ observedWording: 'Organic' });
    const aco = resolvePacketObservation({ observedWording: 'ACO Certified Organic' });
    expect(claim.kind).toBe('wording');
    expect(aco.kind).toBe('certification');
    const service = authority();
    const contributor = await service.issueCredential();
    await send(service, contributor.contributorId, [factFor(claim)], 'j4-claim');
    const certified = await send(service, contributor.contributorId, [factFor(aco)], 'j4-aco');
    const shown = await calculateTrustScore(organicProduct, { authoritativeSnapshot: certified.snapshot });
    expect(ethicsAdjustments(shown).some((row) => row.adjustmentId === 'ethics-v37-cert-organic' && row.value === 2)).toBe(true);
    expect(ethicsAdjustments(shown).some((row) => row.adjustmentId === 'claims.organic.claim_only.v1')).toBe(false);
    expect(shown.rveelGovernedCertifications).toEqual(['ACO Certified Organic']);
    expect((shown.rveelGovernedPacketClaims || []).map((row) => row.exactWording)).not.toContain('Organic');
    expect((shown.certifications || []).some((row) => String(row.tag).startsWith('ts:organic'))).toBe(false);
  });

  it('J5 removes ACO and restores generic Organic without resurrecting ACO', async () => {
    const organicProduct = food({ product_name: 'Organic Oats' });
    const claim = factFor(resolvePacketObservation({ observedWording: 'Organic' }));
    const aco = factFor(resolvePacketObservation({ observedWording: 'ACO Certified Organic' }));
    const service = authority();
    const contributor = await service.issueCredential();
    await send(service, contributor.contributorId, [claim], 'j5-claim');
    const certified = await send(service, contributor.contributorId, [aco], 'j5-aco');
    const removed = await send(
      service,
      contributor.contributorId,
      [],
      'j5-remove',
      deriveEvidenceFacts([aco]).facts.map((row) => row.subjectKey)
    );
    const restored = await calculateTrustScore(organicProduct, { authoritativeSnapshot: removed.snapshot });
    expect(ethicsAdjustments(restored).some((row) => row.adjustmentId === 'claims.organic.claim_only.v1' && row.value === 1)).toBe(true);
    expect(ethicsAdjustments(restored).some((row) => row.adjustmentId === 'ethics-v37-cert-organic')).toBe(false);
    expect(restored.rveelGovernedCertifications).toBeUndefined();
    expect((restored.rveelGovernedPacketClaims || []).map((row) => row.exactWording)).toContain('Organic');
    const refreshed = await calculateTrustScore(organicProduct, { authoritativeSnapshot: await service.snapshot(BARCODE) });
    expect(refreshed.rveelGovernedCertifications).toBeUndefined();
    expect(projectSnapshotForAssessment(certified.snapshot, 'uat').some((row) => row.certificationId === 'cert.aco_organic')).toBe(true);
    expect(projectSnapshotForAssessment(removed.snapshot, 'uat').some((row) => row.domain === 'certifications')).toBe(false);
  });

  it('J6 keeps UTZ distinct from Rainforest Alliance and applies the existing +6 mapping', async () => {
    const resolution = resolvePacketObservation({ observedWording: 'UTZ', visualMark: true });
    expect(resolution.kind).toBe('certification');
    if (resolution.kind !== 'certification') return;
    expect(resolution.certificationId).toBe('cert.utz');
    expect(resolution.displayName).toBe('UTZ Certified');
    expect(governedCertificationAssets().catalogue.find((row) => row.certificationId === 'cert.utz')?.succeededBy).toBe(
      'cert.rainforest_alliance'
    );
    const service = authority();
    const contributor = await service.issueCredential();
    const admitted = await send(service, contributor.contributorId, [factFor(resolution)], 'j6');
    const row = projectSnapshotForAssessment(admitted.snapshot, 'uat').find((item) => item.domain === 'certifications');
    expect(row?.certificationId).toBe('cert.utz');
    expect(row?.labelsTags).toEqual(['en:utz']);
    expect(admitted.snapshot?.prevailing.find((item) => item.evidence.certificationId === 'cert.utz')?.subjectKey).not.toContain(
      'rainforest'
    );
    const scored = await calculateTrustScore(food(), { authoritativeSnapshot: admitted.snapshot });
    expect(scored.rveelGovernedCertifications).toEqual(['UTZ Certified']);
    expect(ethicsAdjustments(scored).some((item) => item.adjustmentId === 'ethics-v37-cert-rainforest-alliance' && item.value === 6)).toBe(
      true
    );
  });

  it('J7 shows Fairtrade when scope is unresolved and withholds a scope-dependent assessment', async () => {
    const resolution = resolvePacketObservation({ observedWording: 'Fairtrade' });
    expect(resolution.kind).toBe('certification');
    if (resolution.kind !== 'certification') return;
    expect(resolution.scopeClass).toBe('unresolved');
    expect(scopeDependentAssessment({ requiresScope: true, scopeClass: resolution.scopeClass })).toBe('withheld');
    expect(scopeDependentAssessment({ requiresScope: false, scopeClass: resolution.scopeClass })).toBe('apply');
    const service = authority();
    const contributor = await service.issueCredential();
    const admitted = await send(service, contributor.contributorId, [factFor(resolution)], 'j7');
    const scored = await calculateTrustScore(food(), { authoritativeSnapshot: admitted.snapshot });
    expect(scored.rveelGovernedCertifications).toEqual(['Fairtrade']);
    expect(String(scored.rveelGovernedCertifications?.[0] || '')).not.toMatch(/unclear/i);
    expect(ethicsAdjustments(scored).some((row) => row.adjustmentId === 'ethics-v37-cert-fairtrade' && row.value === 6)).toBe(true);
    const stored = projectSnapshotForAssessment(admitted.snapshot, 'uat').find((row) => row.domain === 'certifications');
    expect(stored?.certificationScope).toBeUndefined();
  });

  it('J8 shows Fairtrade / Cocoa and does not infer whole-product scope', async () => {
    const resolution = resolvePacketObservation({
      observedWording: 'Fairtrade',
      scopeClass: 'ingredient_component',
      scopeSubject: 'cocoa',
    });
    expect(resolution.kind).toBe('certification');
    if (resolution.kind !== 'certification') return;
    expect(resolution.scopeClass).toBe('ingredient_component');
    expect(resolution.scopeSubject).toBe('cocoa');
    const service = authority();
    const contributor = await service.issueCredential();
    const admitted = await send(service, contributor.contributorId, [factFor(resolution)], 'j8');
    const stored = projectSnapshotForAssessment(admitted.snapshot, 'uat').find((row) => row.domain === 'certifications');
    expect(stored?.certificationScope).toBe('ingredient_component');
    expect(stored?.certificationScopeSubject).toBe('cocoa');
    const subjectKey = admitted.snapshot?.prevailing.find((item) => item.evidence.certificationId === 'cert.fairtrade')?.subjectKey || '';
    expect(subjectKey).not.toContain('cocoa');
    expect(subjectKey).not.toContain('whole');
    const scored = await calculateTrustScore(food(), { authoritativeSnapshot: admitted.snapshot });
    expect(scored.rveelGovernedCertifications).toEqual(['Fairtrade / Cocoa']);
  });

  it('J9 admits unmatched wording as packet information and does not promote it when later recognised', async () => {
    const resolution = resolvePacketObservation({ observedWording: 'XYZ Sustainable Certified' });
    expect(resolution.kind).toBe('wording');
    expect(searchPacketInformation('XYZ Sustainable Certified')).toEqual([]);
    const service = authority();
    const contributor = await service.issueCredential();
    const admitted = await send(service, contributor.contributorId, [factFor(resolution)], 'j9');
    const scored = await calculateTrustScore(food(), { authoritativeSnapshot: admitted.snapshot });
    expect((scored.rveelGovernedPacketClaims || []).map((row) => row.exactWording)).toEqual(['XYZ Sustainable Certified']);
    expect(scored.rveelGovernedCertifications).toBeUndefined();
    expect(ethicsAdjustments(scored).some((row) => row.adjustmentId?.startsWith('ethics-v37-cert-'))).toBe(false);
    const queued = listUnresolvedMarkCandidates()[0];
    expect(queued?.disposition).toBe('Unresolved');
    expect(queued?.count).toBe(1);
    setCandidateDisposition('XYZ Sustainable Certified', 'Recognised');
    const after = await service.snapshot(BARCODE);
    expect(projectSnapshotForAssessment(after, 'uat').every((row) => row.domain !== 'certifications')).toBe(true);
    expect(listUnresolvedMarkCandidates()[0]?.disposition).toBe('Recognised');
    expect(listUnresolvedMarkCandidates()[0]?.escalated).toBe(false);
  });

  it('J10 does not solicit an identical current certification', async () => {
    const detected = resolvePacketObservation({ observedWording: 'Fairtrade' });
    expect(isSameCurrentProposition(detected, ['Fairtrade'])).toBe(true);
    const service = authority();
    const contributor = await service.issueCredential();
    const admitted = await send(service, contributor.contributorId, [factFor(detected)], 'j10');
    const before = projectSnapshotForAssessment(admitted.snapshot, 'uat');
    const solicited = isSameCurrentProposition(detected, before.map((row) => row.exactWording || ''));
    expect(solicited).toBe(true);
    const kept = retainCurrentDespiteNonDetection(before);
    expect(kept).toHaveLength(1);
    expect(kept[0]?.evidenceVersion).toBe(before[0]?.evidenceVersion);
    const refreshed = await service.snapshot(BARCODE);
    expect(projectSnapshotForAssessment(refreshed, 'uat')).toHaveLength(1);
  });

  it('J11 keeps a current certification when a new photo does not detect it', async () => {
    const fairtrade = factFor(resolvePacketObservation({ observedWording: 'Fairtrade' }));
    const service = authority();
    const contributor = await service.issueCredential();
    const admitted = await send(service, contributor.contributorId, [fairtrade], 'j11');
    const current = projectSnapshotForAssessment(admitted.snapshot, 'uat');
    const rearPanelDetections: PacketResolution[] = [resolvePacketObservation({ observedWording: 'High protein' })];
    expect(rearPanelDetections.some((item) => item.kind === 'certification')).toBe(false);
    const stillCurrent = retainCurrentDespiteNonDetection(current);
    expect(stillCurrent.map((row) => row.certificationId)).toEqual(['cert.fairtrade']);
    const refreshed = await calculateTrustScore(food(), { authoritativeSnapshot: await service.snapshot(BARCODE) });
    expect(refreshed.rveelGovernedCertifications).toEqual(['Fairtrade']);
  });

  it('J12 changes or removes the current proposition and does not restore the old one', async () => {
    const fairtrade = factFor(resolvePacketObservation({ observedWording: 'Fairtrade' }));
    const utz = factFor(resolvePacketObservation({ observedWording: 'UTZ' }));
    const service = authority();
    const contributor = await service.issueCredential();
    await send(service, contributor.contributorId, [fairtrade], 'j12-fairtrade');
    const closure = correctionClosureFacts({
      initialCertifications: ['Fairtrade'],
      certifications: ['UTZ'],
    });
    const replaced = await send(
      service,
      contributor.contributorId,
      [utz],
      'j12-change',
      ceasedPrevailingSubjectKeys(closure.baseline, closure.represented)
    );
    const afterChange = await calculateTrustScore(food(), { authoritativeSnapshot: replaced.snapshot });
    expect(afterChange.rveelGovernedCertifications).toEqual(['UTZ Certified']);
    const removed = await send(
      service,
      contributor.contributorId,
      [],
      'j12-remove',
      deriveEvidenceFacts([utz]).facts.map((row) => row.subjectKey)
    );
    const afterRemove = await calculateTrustScore(food(), { authoritativeSnapshot: await service.snapshot(BARCODE) });
    expect(afterRemove.rveelGovernedCertifications).toBeUndefined();
    expect(projectSnapshotForAssessment(removed.snapshot, 'uat').some((row) => row.domain === 'certifications')).toBe(false);
    const again = await service.snapshot(BARCODE);
    expect(projectSnapshotForAssessment(again, 'uat').map((row) => row.exactWording)).not.toContain('Fairtrade');
    expect(projectSnapshotForAssessment(again, 'uat').map((row) => row.exactWording)).not.toContain('UTZ');
  });

  it('shortlists only variants of one family, and a Not-a-certification disposition does not escalate', () => {
    const assets: GovernedCertificationAssets = {
      ...governedCertificationAssets(),
      catalogue: [
        ...governedCertificationAssets().catalogue,
        {
          certificationId: 'cert.fairtrade_variant',
          displayName: 'Fairtrade Ingredient',
          familyName: 'Fairtrade',
          lifecycle: 'active',
          identityClass: 'certification',
          supportedScopes: ['ingredient_component'],
          scopeRule: 'explicit_only',
          mvpScoreEligible: false,
          mvpPoints: 0,
          mvpReceiver: 'none',
          succeededBy: 'none',
        },
      ],
    };
    const shortlist = resolvePacketObservation(
      { visualMark: true, ambiguity: 'family_variants', proposedFamilyName: 'Fairtrade' },
      assets
    );
    expect(shortlist.kind).toBe('shortlist');
    if (shortlist.kind !== 'shortlist') return;
    expect(shortlist.options.map((option) => option.displayName).sort()).toEqual(['Fairtrade', 'Fairtrade Ingredient']);
    const blocked = recordUnresolvedObservation('store slogan');
    setCandidateDisposition('store slogan', 'Not a certification');
    const again = recordUnresolvedObservation('store slogan');
    expect(blocked.disposition).toBe('Unresolved');
    expect(again.disposition).toBe('Not a certification');
    expect(again.escalated).toBe(false);
    expect(again.count).toBe(1);
  });
});
