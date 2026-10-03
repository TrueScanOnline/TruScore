/**
 * Founder UAT handoff: admission acknowledgement is not held for OFF dispatch,
 * and refresh applies only the settled assessment cycle.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import fs from 'fs';
import path from 'path';
import { __setContributionCreationRecordClassForTests } from '../../../contributions/productionEpoch';
import { stampCoreTruthAuthority } from '../../../config/coreTruthProductCacheAuthority';
import { EvidenceAuthority } from '../../../evidenceAuthority/authority';
import { MemoryAuthorityStore } from '../../../evidenceAuthority/memoryStore';
import { sha256Hex } from '../../../packetContribution/sha256';
import { awaitSettledRefresh } from '../../../services/productService';
import type { Product, ProductWithTrustScore } from '../../../types/product';
import { calculateTrustScore } from '../../../utils/trustScore';

const BARCODE = '9300673666666';
const memory = new Map<string, string>();
const packetBytes = new TextEncoder().encode('handoff-packet');
const packetHash = sha256Hex(packetBytes);

function food(overrides: Partial<Product> = {}): Product {
  return stampCoreTruthAuthority({
    barcode: BARCODE,
    product_name: 'Handoff oats',
    source: 'openfoodfacts',
    nutriments: { sugars_100g: 4, fat_100g: 2, proteins_100g: 8, energy_100g: 1500 },
    nutrition_data_per: '100g',
    nutriscore_grade: 'b',
    nova_group: 1,
    ingredients_text: 'Wholegrain oats',
    manufacturing_places: 'Australia',
    ...overrides,
  } as Product);
}

function authority(extra: ConstructorParameters<typeof EvidenceAuthority>[1] = {}) {
  return new EvidenceAuthority(new MemoryAuthorityStore(), {
    authorityEnv: 'uat',
    now: () => 9_000,
    ...extra,
  });
}

beforeEach(() => {
  memory.clear();
  __setContributionCreationRecordClassForTests('production');
  process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV = 'uat';
  (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => memory.get(key) ?? null);
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
    memory.set(key, value);
  });
});

afterEach(() => {
  __setContributionCreationRecordClassForTests(null);
});

describe('founder UAT system handoff', () => {
  it('returns the admitted snapshot before a slow eligible OFF dispatch, then completes that dispatch', async () => {
    let releaseDispatch: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      releaseDispatch = resolve;
    });
    const transport = jest.fn(async () => {
      await gate;
      return { ok: true, status: 200, note: 'saved' };
    });
    const service = authority({
      offTarget: 'https://world.openfoodfacts.org/cgi/product_jqm2.pl',
      offCredentialsConfigured: true,
      offExecute: true,
      offTransport: transport,
    });
    const contributor = await service.issueCredential();
    const started = Date.now();
    const admitted = await service.submit(contributor.contributorId, {
      idempotencyKey: 'nutrition-ack',
      barcode: BARCODE,
      sourceBytes: packetBytes,
      declaredSha256: packetHash,
      facts: [{ domain: 'ingredients_nutrition', ingredientsText: 'Wholegrain oats, water' }],
    });
    const acknowledgementMs = Date.now() - started;
    expect(acknowledgementMs).toBeLessThan(150);
    expect(admitted.status).toBe('admitted');
    expect(admitted.snapshot?.prevailing).toHaveLength(1);
    expect(admitted.snapshot?.offDispatch[0].status).toBe('pending');
    expect(transport).not.toHaveBeenCalled();

    const dispatching = service.dispatchPendingOff(BARCODE);
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(transport).toHaveBeenCalledWith(
      expect.objectContaining({
        target: 'https://world.openfoodfacts.org/cgi/product_jqm2.pl',
        fields: expect.objectContaining({ ingredients_text: 'Wholegrain oats, water' }),
      })
    );
    releaseDispatch();
    const result = await dispatching;
    expect(result).toEqual({ sent: 1, failed: 0 });
    const after = await service.snapshot(BARCODE);
    expect(after.offDispatch[0].status).toBe('sent');
    expect(after.offDispatch[0].readBackStatus).toBe('saved');
    expect(after.prevailing[0].versionId).toBe(admitted.snapshot?.prevailing[0].versionId);
    expect(after.prevailing[0].evidence.admissionStatus).toBe('admitted');
  });

  it('keeps an admitted contribution when OFF dispatch fails', async () => {
    const transport = jest.fn(async () => ({ ok: false, status: 401, note: 'auth_failed' }));
    const service = authority({
      offTarget: 'https://world.openfoodfacts.org/cgi/product_jqm2.pl',
      offCredentialsConfigured: true,
      offExecute: true,
      offTransport: transport,
    });
    const contributor = await service.issueCredential();
    const admitted = await service.submit(contributor.contributorId, {
      idempotencyKey: 'nutrition-fail',
      barcode: BARCODE,
      sourceBytes: packetBytes,
      declaredSha256: packetHash,
      facts: [{ domain: 'ingredients_nutrition', ingredientsText: 'Oats' }],
    });
    expect(admitted.status).toBe('admitted');
    const result = await service.dispatchPendingOff(BARCODE);
    expect(result).toEqual({ sent: 0, failed: 1 });
    const after = await service.snapshot(BARCODE);
    expect(after.offDispatch[0].status).toBe('failed_retryable');
    expect(after.offDispatch[0].readBackStatus).toBe('auth_failed');
    expect(after.prevailing[0].evidence.admissionStatus).toBe('admitted');
    expect(after.prevailing[0].versionId).toBe(admitted.snapshot?.prevailing[0].versionId);
  });

  it('reassesses from the admitted snapshot and keeps refresh on the settled cycle, including an NR pillar', async () => {
    const service = authority();
    const contributor = await service.issueCredential();
    const wording = 'Made in Australia';
    const admitted = await service.submit(contributor.contributorId, {
      idempotencyKey: 'origin-refresh',
      barcode: BARCODE,
      sourceBytes: packetBytes,
      declaredSha256: packetHash,
      facts: [
        {
          domain: 'origins',
          exactWording: wording,
          claimValue: 'Australia',
          originStructured: { claimType: 'made_in', primaryCountry: 'Australia' },
        },
      ],
    });
    expect(admitted.status).toBe('admitted');
    const source = food();
    const shown = await calculateTrustScore(source, { authoritativeSnapshot: admitted.snapshot });
    expect(shown._assessmentCycleSettled).toBeUndefined();
    expect(shown.rveelGovernedOrigins).toHaveLength(1);
    expect(shown.nutriscore_grade).toBe('b');
    expect(shown.nova_group).toBe(1);
    const publication = shown._publication!;
    const nrPillars = (['body', 'planet', 'claims', 'transparency'] as const).filter(
      (name) => publication[name].publicationStatus === 'nr'
    );
    expect(nrPillars.length).toBeGreaterThan(0);
    for (const name of nrPillars) {
      expect(publication[name].publishedScore).toBeNull();
      expect(typeof publication[name].internalScore).toBe('number');
    }
    const rated = (['body', 'planet', 'claims', 'transparency'] as const).filter(
      (name) => publication[name].publicationStatus === 'rated'
    );
    expect(rated.length).toBeGreaterThan(0);
    for (const name of rated) {
      expect(publication[name].publishedScore).toBe(publication[name].internalScore);
    }
    const ledger = shown._truscore_analysis!;
    expect(ledger.pillars.Body.finalScore).toBe(publication.body.internalScore);
    expect(ledger.pillars.Planet.finalScore).toBe(publication.planet.internalScore);
    expect(ledger.pillars.Ethics.finalScore).toBe(publication.claims.internalScore);
    expect(ledger.pillars.Open.finalScore).toBe(publication.transparency.internalScore);

    const reloaded = await calculateTrustScore(food(), { authoritativeSnapshot: admitted.snapshot });
    expect(reloaded.rveelGovernedOrigins?.[0].exactWording).toBe(wording);
    expect(reloaded.nutriscore_grade).toBe('b');
    expect(reloaded.nova_group).toBe(1);
    expect(reloaded._publication?.body.publishedScore).toBe(publication.body.publishedScore);
    expect(reloaded._publication?.planet.publicationStatus).toBe(publication.planet.publicationStatus);
    expect(reloaded._publication?.claims.publishedScore).toBe(publication.claims.publishedScore);
    expect(reloaded._publication?.transparency.publishedScore).toBe(publication.transparency.publishedScore);

    const checking = {
      ...shown,
      _assessmentCycleSettled: false,
      _publication: {
        ...publication,
        settled: false,
        overall: { ...publication.overall, publicationStatus: 'checking' as const, publishedScore: null },
      },
    } as ProductWithTrustScore;
    const settled = { ...shown, _assessmentCycleSettled: true } as ProductWithTrustScore;
    let appliedChecking = false;
    const refreshed = await awaitSettledRefresh(async (onProgress) => {
      onProgress({ phase: 'product_ready', product: checking });
      appliedChecking = checking._assessmentCycleSettled === true;
      await new Promise((resolve) => setTimeout(resolve, 20));
      onProgress({ phase: 'product_refined', product: settled });
      return checking;
    });
    expect(appliedChecking).toBe(false);
    expect(refreshed?._assessmentCycleSettled).toBe(true);
    expect(refreshed?.rveelGovernedOrigins?.[0].exactWording).toBe(wording);
    expect(refreshed?.nutriscore_grade).toBe('b');
    expect(refreshed?._publication?.planet.publishedScore).toBe(publication.planet.publishedScore);
    expect(refreshed?._publication?.claims.publishedScore).toBeNull();

    const result = fs.readFileSync(path.join(process.cwd(), 'app/result/[barcode].tsx'), 'utf8');
    const refresh = result.slice(result.indexOf('const handleRefresh'));
    expect(refresh.indexOf('acceptProductUpdate')).toBeGreaterThan(0);
    expect(refresh.indexOf('acceptProductUpdate')).toBeLessThan(refresh.indexOf('setLoadingPhase'));
    expect(refresh).not.toContain('setProduct(productData)');
    expect(refresh).toContain('_assessmentCycleSettled !== true');
  });
});
