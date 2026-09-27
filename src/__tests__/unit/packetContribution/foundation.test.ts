import AsyncStorage from '@react-native-async-storage/async-storage';
import { canApplyToProductionReceiver } from '../../../contributions/admissionContract';
import { toScoringProduct } from '../../../contributions/eligibilityBoundary';
import { submitGovernedEvidence } from '../../../contributions/submitGovernedEvidence';
import { getLocalEvidenceById } from '../../../contributions/evidenceStore';
import type { Product } from '../../../types/product';
import {
  __resetMemoryPrivateBytesForTests,
  __setPrivateByteStoreForTests,
  __setSessionPersistenceForTests,
  addDerivedAsset,
  addManualEvidenceUnit,
  applyReviewAction,
  assignReviewDisposition,
  commitStagedCapture,
  countFeasibilityDefects,
  ensureWave4a1UatCutoverOnce,
  extractionSucceeded,
  getPrivateByteStore,
  getSession,
  handoffReviewedUnits,
  isUatContributionKey,
  openSessionForProduct,
  readSourceBytes,
  rejectStagedCapture,
  runBoundedFeasibilityComparison,
  runExtraction,
  setSourceFraming,
  sha256Hex,
  stripLocationMetadata,
} from '../../../packetContribution';
import type { ExtractionProducer } from '../../../packetContribution';

const memory = new Map<string, string>();
const bytes = (text: string) => new Uint8Array([...text].map((char) => char.charCodeAt(0)));

beforeEach(() => {
  memory.clear();
  __resetMemoryPrivateBytesForTests();
  __setSessionPersistenceForTests(null);
  __setPrivateByteStoreForTests(null);
  (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) =>
    memory.has(key) ? memory.get(key)! : null
  );
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
    memory.set(key, value);
  });
  (AsyncStorage.removeItem as jest.Mock).mockImplementation(async (key: string) => {
    memory.delete(key);
  });
  (AsyncStorage.getAllKeys as jest.Mock).mockImplementation(async () => [...memory.keys()]);
  (AsyncStorage.multiRemove as jest.Mock).mockImplementation(async (keys: string[]) => {
    keys.forEach((key) => memory.delete(key));
  });
  (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
});

describe('Wave 4A.1 packet contribution foundation', () => {
  it('hashes source bytes stably', () => {
    expect(sha256Hex(new Uint8Array())).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    );
    expect(sha256Hex(bytes('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
  });

  it('strips gallery location metadata and keeps the original bytes behind a derivative', async () => {
    const session = await openSessionForProduct({ barcode: '9300000000444' });
    const original = bytes('packet-pixels');
    const stripped = stripLocationMetadata({ gps: '-36.8,174.7', Make: 'camera' });
    expect(stripped.metadata.gps).toBeUndefined();
    expect(stripped.locationMetadata).toBe('stripped');
    const committed = await commitStagedCapture({
      sessionId: session.sessionId,
      bytes: original,
      source: 'gallery',
      metadata: { GPSLatitude: '1' },
    });
    expect(committed.asset.locationMetadata).toBe('stripped');
    const derived = await addDerivedAsset({
      sessionId: session.sessionId,
      sourceAssetId: committed.asset.assetId,
      transform: { kind: 'region', x: 0.1, y: 0.1, width: 0.4, height: 0.3 },
    });
    const stored = await readSourceBytes(committed.asset);
    expect(stored && sha256Hex(stored)).toBe(committed.asset.contentSha256);
    expect(derived.derived.sourceAssetId).toBe(committed.asset.assetId);
    expect(derived.session.sourceAssets[0].contentSha256).toBe(committed.asset.contentSha256);
  });

  it('does not keep a retaken capture and reloads a multi-image session', async () => {
    const session = await openSessionForProduct({ barcode: '9300000000444', variantKey: '500g' });
    await rejectStagedCapture('packet/preview/temp');
    expect(await getPrivateByteStore().get('packet/preview/temp')).toBeNull();
    await commitStagedCapture({ sessionId: session.sessionId, bytes: bytes('front'), source: 'camera' });
    await commitStagedCapture({ sessionId: session.sessionId, bytes: bytes('back'), source: 'camera' });
    const duplicate = await commitStagedCapture({
      sessionId: session.sessionId,
      bytes: bytes('front'),
      source: 'camera',
    });
    expect(duplicate.duplicate).toBe(true);
    const reloaded = await getSession(session.sessionId);
    expect(reloaded?.sourceAssets).toHaveLength(2);
    expect(reloaded?.variantKey).toBe('500g');
    expect(reloaded?.sourceAssets.every((asset) => asset.privateKey.startsWith('packet/'))).toBe(true);
  });

  it('keeps captured work when extraction abstains or fails, and does not invent facts', async () => {
    const session = await openSessionForProduct({ barcode: '9300000000444' });
    await commitStagedCapture({ sessionId: session.sessionId, bytes: bytes('panel'), source: 'camera' });
    const abstained = await runExtraction({ sessionId: session.sessionId });
    expect(abstained.run.status).toBe('abstained');
    expect(extractionSucceeded(abstained.run)).toBe(false);
    expect(abstained.run.observations).toHaveLength(0);
    expect(abstained.session.units).toHaveLength(0);
    expect(abstained.session.sourceAssets).toHaveLength(1);

    const failing: ExtractionProducer = {
      id: 'boom',
      kind: 'other',
      async extract() {
        throw new Error('provider_down');
      },
    };
    const failed = await runExtraction({ sessionId: session.sessionId, producer: failing });
    expect(failed.run.status).toBe('failed');
    expect(failed.run.statusDetail).toBe('provider_down');
    expect(failed.session.sourceAssets).toHaveLength(1);
    expect(failed.session.units).toHaveLength(0);
  });

  it('blocks unbounded support, allows a targeted manual statement, and sets another unit aside', async () => {
    const session = await openSessionForProduct({ barcode: '9300000000444' });
    const photo = await commitStagedCapture({
      sessionId: session.sessionId,
      bytes: bytes('nutrition-only'),
      source: 'camera',
    });
    const broad = await addManualEvidenceUnit({
      sessionId: session.sessionId,
      domain: 'origins',
      statement: 'New Zealand',
      support: { coverage: 'whole_image', sourceAssetId: photo.asset.assetId },
    });
    await expect(
      applyReviewAction({ sessionId: session.sessionId, unitId: broad.unitId, action: 'manual_entry' })
    ).rejects.toThrow('evidence_unit_not_bounded_to_source');

    await setSourceFraming(session.sessionId, photo.asset.assetId, 'targeted');
    const reviewed = await applyReviewAction({
      sessionId: session.sessionId,
      unitId: broad.unitId,
      action: 'manual_entry',
      correctionText: 'New Zealand',
    });
    expect(reviewed.status).toBe('reviewed');

    const other = await addManualEvidenceUnit({
      sessionId: session.sessionId,
      domain: 'packet_claims',
      statement: 'High in fibre',
      support: { coverage: 'whole_image', sourceAssetId: photo.asset.assetId },
    });
    const aside = await applyReviewAction({
      sessionId: session.sessionId,
      unitId: other.unitId,
      action: 'set_aside',
    });
    expect(aside.status).toBe('set_aside');

    const calls: string[] = [];
    const first = await handoffReviewedUnits({
      sessionId: session.sessionId,
      submit: async (params) => {
        calls.push(params.domain);
        return { evidenceId: 'ev-1', admissionStatus: 'submitted' } as Awaited<
          ReturnType<typeof submitGovernedEvidence>
        >;
      },
    });
    expect(calls).toEqual(['origins']);
    expect(first.find((item) => item.unitId === other.unitId)?.outcome).toBe('skipped');
    expect(first.find((item) => item.outcome === 'submitted' && item.unitId === broad.unitId)).toMatchObject({
      admissionStatus: 'submitted',
      idempotent: false,
    });
    const second = await handoffReviewedUnits({
      sessionId: session.sessionId,
      submit: async () => {
        throw new Error('must_not_resubmit');
      },
    });
    expect(second.find((item) => item.unitId === broad.unitId)).toMatchObject({ idempotent: true, evidenceId: 'ev-1' });
  });

  it('submits into 4A.0 without admission or scoring projection', async () => {
    const session = await openSessionForProduct({ barcode: '9300000000444' });
    const photo = await commitStagedCapture({
      sessionId: session.sessionId,
      bytes: bytes('origin-panel'),
      source: 'camera',
    });
    await setSourceFraming(session.sessionId, photo.asset.assetId, 'targeted');
    const unit = await addManualEvidenceUnit({
      sessionId: session.sessionId,
      domain: 'origins',
      statement: 'New Zealand',
      support: { coverage: 'whole_image', sourceAssetId: photo.asset.assetId },
    });
    await applyReviewAction({
      sessionId: session.sessionId,
      unitId: unit.unitId,
      action: 'manual_entry',
      correctionText: 'New Zealand',
    });
    const results = await handoffReviewedUnits({ sessionId: session.sessionId });
    const submitted = results.find((item) => item.outcome === 'submitted');
    expect(submitted && submitted.outcome === 'submitted' && submitted.admissionStatus).toBe('submitted');
    const stored = await getLocalEvidenceById(submitted && submitted.outcome === 'submitted' ? submitted.evidenceId : '');
    expect(stored?.admissionStatus).toBe('submitted');
    expect(stored?.imageUrl?.startsWith('private://packet/')).toBe(true);
    expect(canApplyToProductionReceiver(stored!, 'open_origins')).toBe(false);
    const product = { barcode: '9300000000444', product_name: 'Fixture', source: 'openfoodfacts' } as Product;
    expect(toScoringProduct(product, stored ? [stored] : [])?.manufacturing_places).toBeUndefined();
  });

  it('does not let an unclassified unit use automatic acceptance', async () => {
    const session = await openSessionForProduct({ barcode: '9300000000444' });
    const photo = await commitStagedCapture({
      sessionId: session.sessionId,
      bytes: bytes('panel'),
      source: 'camera',
    });
    await setSourceFraming(session.sessionId, photo.asset.assetId, 'targeted');
    const producer: ExtractionProducer = {
      id: 'fixture',
      kind: 'ocr_assisted',
      modelName: 'fixture',
      modelVersion: '0',
      configurationId: 'test',
      async extract() {
        return {
          status: 'observations' as const,
          statusDetail: 'fixture',
          observations: [
            {
              text: 'Fibre 9g',
              support: { coverage: 'whole_image' as const, sourceAssetId: photo.asset.assetId },
            },
          ],
        };
      },
    };
    const extracted = await runExtraction({ sessionId: session.sessionId, producer });
    const unit = extracted.session.units[0];
    expect(unit.disposition).toBeNull();
    expect(unit.extractionRunId).toBe(extracted.run.runId);
    await expect(
      applyReviewAction({ sessionId: session.sessionId, unitId: unit.unitId, action: 'accept' })
    ).rejects.toThrow('review_action_not_permitted_for_disposition');
    await assignReviewDisposition({ sessionId: session.sessionId, unitId: unit.unitId, disposition: 'A' });
    const accepted = await applyReviewAction({
      sessionId: session.sessionId,
      unitId: unit.unitId,
      action: 'accept',
    });
    expect(accepted.status).toBe('reviewed');
    const held = await handoffReviewedUnits({ sessionId: session.sessionId });
    expect(held[0].outcome).toBe('held_for_later_receiver');
  });

  it('resets contribution UAT keys once and leaves unrelated keys', async () => {
    memory.set('@rveel_contribution_evidence_v1', '[]');
    memory.set('@rveel_contribution_recovery_v1', '[]');
    memory.set('@truescan_pending_contributions_9300000000444', '[]');
    memory.set('@settings_unrelated', 'keep');
    await getPrivateByteStore().put('packet/session/file', bytes('img'));
    await getPrivateByteStore().put('other/file', bytes('keep'));
    const first = await ensureWave4a1UatCutoverOnce();
    expect(first.ran).toBe(true);
    expect(memory.has('@rveel_contribution_evidence_v1')).toBe(false);
    expect(memory.has('@truescan_pending_contributions_9300000000444')).toBe(false);
    expect(memory.get('@settings_unrelated')).toBe('keep');
    expect(await getPrivateByteStore().get('packet/session/file')).toBeNull();
    expect(await getPrivateByteStore().get('other/file')).not.toBeNull();
    memory.set('@rveel_contribution_evidence_v1', 'after');
    const second = await ensureWave4a1UatCutoverOnce();
    expect(second.ran).toBe(false);
    expect(memory.get('@rveel_contribution_evidence_v1')).toBe('after');
    expect(isUatContributionKey('@settings_unrelated')).toBe(false);
  });

  it('compares extraction approaches without selecting a provider', () => {
    const summary = runBoundedFeasibilityComparison();
    const counts = countFeasibilityDefects(summary);
    expect(summary.productionProviderSelected).toBe(false);
    expect(summary.automaticAThresholdsEstablished).toBe(false);
    expect(counts.abstentions).toBeGreaterThan(0);
    expect(counts.leakage).toBeGreaterThan(0);
    expect(counts.unsupported).toBeGreaterThan(0);
    expect(summary.results.some((result) => result.status === 'abstained' && result.observations.length === 0)).toBe(
      true
    );
  });
});
