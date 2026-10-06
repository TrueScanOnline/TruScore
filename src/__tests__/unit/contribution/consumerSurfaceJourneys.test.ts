/**
 * Consumer-surface corrections.
 * Presentation and journey entry only. Scoring and prepareVisibleContribution stay as they are.
 */
import fs from 'fs';
import path from 'path';
import { __setContributionCreationRecordClassForTests } from '../../../contributions/productionEpoch';
import {
  ADD_PACKET_INFORMATION,
  ADD_PRODUCT_ORIGINS,
  CHANGE_INGREDIENTS,
  CHANGE_NUTRITION,
  CHANGE_PACKET_INFORMATION,
  CHANGE_PRODUCT_ORIGINS,
  ceasedOriginsRemovedFromForm,
  originChangeLine,
  originRemovalClosesWithoutReplacement,
  originRowsForJourney,
  packetRowVisible,
  resultPacketInformationLines,
} from '../../../contribution/consumerSurface';
import { prepareVisibleContribution } from '../../../contribution/visibleContribution';
import { PACKET_INFORMATION_ADD } from '../../../contribution/resultContributionActions';
import {
  displayCertificationName,
  evidenceFactFromResolution,
  PACKET_REVIEW_CHANGE,
  PACKET_REVIEW_PROMPT,
  PACKET_REVIEW_REMOVE,
  PACKET_REVIEW_YES,
  resolvePacketObservation,
  type PacketResolution,
} from '../../../certifications/resolveCertification';
import { EvidenceAuthority } from '../../../evidenceAuthority/authority';
import { MemoryAuthorityStore } from '../../../evidenceAuthority/memoryStore';
import { deriveEvidenceFacts } from '../../../evidenceAuthority/subjects';
import type { EvidenceFactInput } from '../../../evidenceAuthority/types';
import { stampCoreTruthAuthority } from '../../../config/coreTruthProductCacheAuthority';
import { sha256Hex } from '../../../packetContribution/sha256';
import type { Product } from '../../../types/product';
import { calculateTrustScore } from '../../../utils/trustScore';

const BARCODE = '9300673888888';
const REPO = path.join(__dirname, '../../../..');
const packetBytes = new TextEncoder().encode('consumer-surface-journey');
const packetHash = sha256Hex(packetBytes);

function authority() {
  return new EvidenceAuthority(new MemoryAuthorityStore(), {
    authorityEnv: 'uat',
    now: () => 12_000,
  });
}

function food(overrides: Partial<Product> = {}): Product {
  return stampCoreTruthAuthority({
    barcode: BARCODE,
    product_name: 'Organic Oats',
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
  return fact;
}

function presented(product: Product): string[] {
  return resultPacketInformationLines({
    claimWordings: (product.rveelGovernedPacketClaims || []).map((claim) => claim.exactWording),
    certificationNames: product.rveelGovernedCertifications || [],
    recognisedCertificationNames: (product.certifications || []).map((cert) => displayCertificationName(cert)),
  });
}

function countLine(lines: string[], wording: string): number {
  const needle = wording.toLowerCase();
  return lines.filter((line) => line.trim().toLowerCase() === needle).length;
}

const chile = {
  claimType: 'produced_in' as const,
  wording: '',
  place: 'Chile',
  ingredient: '',
  percentage: '',
  intent: 'edited' as const,
};

beforeEach(() => {
  __setContributionCreationRecordClassForTests('production');
  process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV = 'uat';
});

afterEach(() => {
  __setContributionCreationRecordClassForTests(null);
});

describe('consumer surface journeys', () => {
  it('shows ACO Certified Organic once, including after a second score from the same snapshot', async () => {
    const claim = factFor(resolvePacketObservation({ observedWording: 'Organic' }));
    const aco = factFor(resolvePacketObservation({ observedWording: 'ACO Certified Organic' }));
    const service = authority();
    const contributor = await service.issueCredential();
    await send(service, contributor.contributorId, [claim], 'surface-organic');
    const certified = await send(service, contributor.contributorId, [aco], 'surface-aco');
    const shown = await calculateTrustScore(food(), { authoritativeSnapshot: certified.snapshot });
    const lines = presented(shown);
    expect(countLine(lines, 'ACO Certified Organic')).toBe(1);
    expect(countLine(lines, 'Organic')).toBe(0);
    expect(ethicsAdjustments(shown).some((row) => row.adjustmentId === 'ethics-v37-cert-organic' && row.value === 2)).toBe(true);
    expect(ethicsAdjustments(shown).some((row) => row.adjustmentId === 'claims.organic.claim_only.v1')).toBe(false);
    expect(shown.rveelGovernedCertifications).toEqual(['ACO Certified Organic']);

    const refreshed = await calculateTrustScore(food(), { authoritativeSnapshot: await service.snapshot(BARCODE) });
    expect(presented(refreshed)).toEqual(lines);
    expect(countLine(presented(refreshed), 'ACO Certified Organic')).toBe(1);
  });

  it('restores a single generic Organic presentation when ACO is no longer current', async () => {
    const claim = factFor(resolvePacketObservation({ observedWording: 'Organic' }));
    const aco = factFor(resolvePacketObservation({ observedWording: 'ACO Certified Organic' }));
    const service = authority();
    const contributor = await service.issueCredential();
    await send(service, contributor.contributorId, [claim], 'surface-organic-restore');
    await send(service, contributor.contributorId, [aco], 'surface-aco-restore');
    const removed = await send(
      service,
      contributor.contributorId,
      [],
      'surface-aco-cease',
      deriveEvidenceFacts([aco]).facts.map((row) => row.subjectKey)
    );
    const restored = await calculateTrustScore(food(), { authoritativeSnapshot: removed.snapshot });
    const lines = presented(restored);
    expect(countLine(lines, 'Organic')).toBe(1);
    expect(countLine(lines, 'ACO Certified Organic')).toBe(0);
    expect(ethicsAdjustments(restored).some((row) => row.adjustmentId === 'claims.organic.claim_only.v1' && row.value === 1)).toBe(true);
    const rescanned = await calculateTrustScore(food(), { authoritativeSnapshot: await service.snapshot(BARCODE) });
    expect(presented(rescanned)).toEqual(lines);
  });

  it('uses Change and Add on the reachable contribution surfaces and keeps assessment Add direct', () => {
    const result = fs.readFileSync(path.join(REPO, 'app/result/[barcode].tsx'), 'utf8');
    const modal = fs.readFileSync(path.join(REPO, 'src/components/PacketContributionModal.tsx'), 'utf8');
    expect(result).toContain(CHANGE_NUTRITION);
    expect(result).toContain(CHANGE_INGREDIENTS);
    expect(result).toContain(CHANGE_PACKET_INFORMATION);
    expect(result).toContain(ADD_PACKET_INFORMATION);
    expect(result).toContain(CHANGE_PRODUCT_ORIGINS);
    expect(result).toContain(ADD_PRODUCT_ORIGINS);
    expect(result).not.toContain('Correct nutrition');
    expect(result).not.toContain('Correct ingredients');
    expect(result).not.toContain('Correct product origins');
    expect(result).not.toContain('Correct packet');
    expect(result).toContain("setContributionChoice('packet')");
    expect(result).toContain("setContributionChoice('origins')");
    expect(result).toContain("openContribution('packetClaims', 'change', true)");
    expect(result).toContain("openContribution('packetClaims', 'add', true)");
    expect(result).toContain("openContribution('origins', 'change', true)");
    expect(result).toContain("openContribution('origins', 'add', true)");
    expect(result).toContain("openContribution('nutrition', 'add')");
    expect(result).toContain("openContribution('ingredients', 'add')");
    expect(result).toContain("openContribution('origins', 'add')");
    expect(result).toContain("openContribution('packetClaims', 'add')");
    expect(result).toContain('Add nutrition');
    expect(result).toContain('Add ingredients');
    expect(result).toContain('Add product origins');
    expect(result).toContain('PACKET_INFORMATION_ADD');
    expect(PACKET_INFORMATION_ADD).toBe('Add packet claims');
    expect(modal).toContain('packetRowVisible');
    expect(modal).toContain('originRowsForJourney');
    expect(modal).toContain("header: 'Packet information'");
    expect(modal).toContain('PACKET_REVIEW_PROMPT');
    expect(modal).toContain('PACKET_REVIEW_YES');
    expect(modal).toContain('PACKET_REVIEW_CHANGE');
    expect(modal).toContain('PACKET_REVIEW_REMOVE');
    expect(PACKET_REVIEW_PROMPT).toBe('Is this on the pack?');
    expect(PACKET_REVIEW_YES).toBe('Yes');
    expect(PACKET_REVIEW_CHANGE).toBe('Change');
    expect(PACKET_REVIEW_REMOVE).toBe('Remove');
  });

  it('shows current packet propositions for Change and a clean Add without an empty Remove row', () => {
    expect(packetRowVisible('change', 'ACO Certified Organic', ['ACO Certified Organic'])).toBe(true);
    expect(packetRowVisible('add', 'ACO Certified Organic', ['ACO Certified Organic'])).toBe(false);
    expect(packetRowVisible('change', '', [])).toBe(false);
    expect(packetRowVisible('add', '', [])).toBe(false);
    expect(packetRowVisible('add', 'High in protein', ['ACO Certified Organic'])).toBe(true);

    const kept = prepareVisibleContribution({
      contexts: ['packetClaims'],
      ingredientsText: '',
      nutrition: { basis: 'per_100g', amounts: {}, sodiumUnit: 'mg' },
      nutritionBaseline: { basis: 'per_100g', amounts: {}, sodiumUnit: 'mg' },
      origins: [],
      claims: [],
      initialClaims: [],
      certifications: ['ACO Certified Organic'],
      initialCertifications: ['ACO Certified Organic'],
      pendingPacketWording: 'High in protein',
    });
    expect(kept.status).toBe('ready');
    if (kept.status !== 'ready') return;
    expect(kept.claims).toEqual(['High in protein']);
    expect(kept.certifications).toEqual([]);
    expect(kept.ceasedSubjectKeys).toEqual([]);

    const same = prepareVisibleContribution({
      contexts: ['packetClaims'],
      ingredientsText: '',
      nutrition: { basis: 'per_100g', amounts: {}, sodiumUnit: 'mg' },
      nutritionBaseline: { basis: 'per_100g', amounts: {}, sodiumUnit: 'mg' },
      origins: [],
      claims: [],
      certifications: ['ACO Certified Organic'],
      initialCertifications: ['ACO Certified Organic'],
      pendingPacketWording: 'ACO Certified Organic',
    });
    expect(same.status).toBe('unchanged');
  });

  it('keeps Product of Chile on Change and starts Add without that proposition or manufactured wording', () => {
    expect(originChangeLine('produced_in', 'Chile')).toBe('Product of Chile');
    const changeRows = originRowsForJourney('change', [chile], 'Chile');
    expect(changeRows).toHaveLength(1);
    expect(changeRows[0]?.claimType).toBe('produced_in');
    expect(changeRows[0]?.place).toBe('Chile');
    expect(changeRows[0]?.wording).toBe('');
    const addRows = originRowsForJourney('add', [chile], 'Chile');
    expect(addRows).toEqual([
      { claimType: null, wording: '', place: '', ingredient: '', percentage: '', intent: 'new' },
    ]);
    expect(addRows[0]?.wording).not.toBe('Chile');

    const removed = ceasedOriginsRemovedFromForm([chile], addRows);
    expect(removed.length).toBeGreaterThan(0);
    expect(
      originRemovalClosesWithoutReplacement(
        ['Choose the type of origin statement and the country.'],
        removed,
        ['origins']
      )
    ).toBe(true);

    const added = prepareVisibleContribution({
      contexts: ['origins'],
      ingredientsText: '',
      nutrition: { basis: 'per_100g', amounts: {}, sodiumUnit: 'mg' },
      nutritionBaseline: { basis: 'per_100g', amounts: {}, sodiumUnit: 'mg' },
      origins: [{ claimType: 'grown_in', wording: '', place: 'Peru', ingredient: '', percentage: '', intent: 'new' }],
      claims: [],
      certifications: [],
    });
    expect(added.status).toBe('ready');
    if (added.status !== 'ready') return;
    expect(added.origins).toHaveLength(1);
    expect(added.origins[0]?.claimType).toBe('grown_in');
    expect(added.origins[0]?.place).toBe('Peru');
    expect(added.origins[0]?.wording).toBe('');
    expect(added.ceasedSubjectKeys).toEqual([]);
  });
});
