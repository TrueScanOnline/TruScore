import AsyncStorage from '@react-native-async-storage/async-storage';
import { admitEvidence } from '../../../contributions/admissionContract';
import { __setContributionCreationRecordClassForTests } from '../../../contributions/productionEpoch';
import { submitGovernedEvidence } from '../../../contributions/submitGovernedEvidence';
import type { ContributionEvidence } from '../../../contributions/types';
import { selectPrevailingOriginFacts } from '../../../origins/governedFacts';
import { PRODUCT_ORIGINS_EXPLAINER_HOOK } from '../../../origins/governedFacts';
import {
  addManualEvidenceUnit,
  applyReviewAction,
  assignReviewDisposition,
  commitStagedCapture,
  handoffReviewedUnits,
  openSessionForProduct,
  setSourceFraming,
} from '../../../packetContribution';
import { toScoringProduct } from '../../../contributions/eligibilityBoundary';
import type { Product } from '../../../types/product';

const BARCODE = '9300673111111';
const memory = new Map<string, string>();

function admitAt(evidence: ContributionEvidence, timestamp: number): ContributionEvidence {
  const admitted = admitEvidence(evidence, { admissionReason: 'primary_user_origin', timestamp });
  if (!admitted.ok) throw new Error(admitted.reason);
  return admitted.evidence;
}

beforeEach(() => {
  memory.clear();
  __setContributionCreationRecordClassForTests('production');
  (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) =>
    memory.has(key) ? memory.get(key)! : null
  );
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
    memory.set(key, value);
  });
  (AsyncStorage.removeItem as jest.Mock).mockImplementation(async (key: string) => {
    memory.delete(key);
  });
});

afterEach(() => {
  __setContributionCreationRecordClassForTests(null);
});

describe('Wave 4A.3 product origins', () => {
  it('keeps different origin types and preserves qualifications, percentages, and ingredient subjects', async () => {
    const made = admitAt(
      await submitGovernedEvidence({
        barcode: BARCODE,
        domain: 'origins',
        claimValue: 'New Zealand',
        exactWording: 'Made in New Zealand from at least 80% New Zealand ingredients',
        asProductionEpoch: true,
        originStructured: {
          claimType: 'made_in',
          primaryCountry: 'New Zealand',
          ingredientOriginPercentage: 80,
          percentageQualifier: 'at_least',
          originQualification: 'local',
        },
      }),
      1
    );
    const packed = admitAt(
      await submitGovernedEvidence({
        barcode: BARCODE,
        domain: 'origins',
        claimValue: 'Australia',
        exactWording: 'Packed in Australia',
        asProductionEpoch: true,
        originStructured: { claimType: 'packed_in', primaryCountry: 'Australia', countries: ['Australia'] },
      }),
      2
    );
    const cocoa = admitAt(
      await submitGovernedEvidence({
        barcode: BARCODE,
        domain: 'origins',
        claimValue: 'Cocoa mass',
        exactWording: 'Cocoa mass from Ghana',
        asProductionEpoch: true,
        originStructured: {
          claimType: 'ingredient_origin',
          primaryCountry: 'Ghana',
          ingredientSubject: 'Cocoa mass',
        },
      }),
      3
    );
    const facts = selectPrevailingOriginFacts([made, packed, cocoa]);
    expect(facts.map((fact) => fact.claimType).sort()).toEqual(['ingredient_origin', 'made_in', 'packed_in']);
    const madeFact = facts.find((fact) => fact.claimType === 'made_in');
    expect(madeFact?.percentage).toBe(80);
    expect(madeFact?.percentageQualifier).toBe('at_least');
    expect(madeFact?.originQualification).toBe('local');
    expect(madeFact?.exactWording).toContain('at least 80%');
    expect(madeFact?.confidence).toBe('limited');
    expect(facts.find((fact) => fact.ingredientSubject === 'Cocoa mass')?.countries).toEqual(['Ghana']);
    expect(PRODUCT_ORIGINS_EXPLAINER_HOOK).toEqual({
      surface: 'product_origins',
      levels: ['L1', 'L2', 'L3'],
      editorial: 'deferred',
    });
  });

  it('treats a later admitted same subject as prevailing and leaves unrelated facts in place', async () => {
    const first = admitAt(
      await submitGovernedEvidence({
        barcode: BARCODE,
        domain: 'origins',
        claimValue: 'New Zealand',
        exactWording: 'Made in New Zealand',
        asProductionEpoch: true,
        originStructured: { claimType: 'made_in', primaryCountry: 'New Zealand' },
      }),
      10
    );
    const packed = admitAt(
      await submitGovernedEvidence({
        barcode: BARCODE,
        domain: 'origins',
        claimValue: 'Fiji',
        exactWording: 'Packed in Fiji',
        asProductionEpoch: true,
        originStructured: { claimType: 'packed_in', primaryCountry: 'Fiji' },
      }),
      11
    );
    const later = admitAt(
      await submitGovernedEvidence({
        barcode: BARCODE,
        domain: 'origins',
        claimValue: 'Australia',
        exactWording: 'Made in Australia',
        asProductionEpoch: true,
        originStructured: { claimType: 'made_in', primaryCountry: 'Australia' },
      }),
      12
    );
    const facts = selectPrevailingOriginFacts([first, packed, later]);
    expect(facts.find((fact) => fact.claimType === 'made_in')?.countries).toEqual(['Australia']);
    expect(facts.find((fact) => fact.claimType === 'made_in')?.evidenceId).toBe(later.evidenceId);
    expect(facts.find((fact) => fact.claimType === 'packed_in')?.countries).toEqual(['Fiji']);
    expect(facts.some((fact) => fact.evidenceId === first.evidenceId)).toBe(false);
  });

  it('does not turn a partial gap, an absent statement, or an unadmitted proposal into an origin fact', async () => {
    const partial = admitAt(
      await submitGovernedEvidence({
        barcode: BARCODE,
        domain: 'origins',
        claimValue: 'Sugar',
        exactWording: 'Sugar',
        asProductionEpoch: true,
        originStructured: { claimType: 'ingredient_origin', primaryCountry: '', ingredientSubject: 'Sugar' },
      }),
      1
    );
    const submittedOnly = await submitGovernedEvidence({
      barcode: BARCODE,
      domain: 'origins',
      claimValue: 'China',
      exactWording: 'Grown in China',
      asProductionEpoch: true,
      originStructured: { claimType: 'grown_in', primaryCountry: 'China' },
    });
    const legacyOther = admitAt(
      await submitGovernedEvidence({
        barcode: BARCODE,
        domain: 'origins',
        claimValue: 'Somewhere',
        exactWording: 'Somewhere',
        asProductionEpoch: true,
        originStructured: { claimType: 'other', primaryCountry: 'Somewhere' },
      }),
      2
    );
    const facts = selectPrevailingOriginFacts([partial, submittedOnly, legacyOther]);
    expect(facts).toHaveLength(1);
    expect(facts[0]?.ingredientSubject).toBe('Sugar');
    expect(facts[0]?.countries).toEqual([]);
    expect(facts[0]?.percentage).toBeUndefined();

    const session = await openSessionForProduct({ barcode: BARCODE });
    const photo = await commitStagedCapture({
      sessionId: session.sessionId,
      bytes: new Uint8Array([9, 9, 9]),
      source: 'camera',
    });
    await setSourceFraming(session.sessionId, photo.asset.assetId, 'targeted');
    const unit = await addManualEvidenceUnit({
      sessionId: session.sessionId,
      domain: 'origins',
      statement: 'Made in New Zealand',
      support: { coverage: 'whole_image', sourceAssetId: photo.asset.assetId },
    });
    await assignReviewDisposition({ sessionId: session.sessionId, unitId: unit.unitId, disposition: 'A' });
    await applyReviewAction({ sessionId: session.sessionId, unitId: unit.unitId, action: 'accept' });
    const handed = await handoffReviewedUnits({ sessionId: session.sessionId });
    expect(handed[0]?.outcome).toBe('skipped');
    if (handed[0]?.outcome === 'skipped') expect(handed[0].reason).toBe('origin_claim_not_explicit');
  });

  it('does not let a contributed origin manufacture an Open origins score input beyond the existing single place', async () => {
    const made = admitAt(
      await submitGovernedEvidence({
        barcode: BARCODE,
        domain: 'origins',
        claimValue: 'New Zealand',
        asProductionEpoch: true,
        originStructured: { claimType: 'made_in', primaryCountry: 'New Zealand' },
      }),
      1
    );
    const packed = admitAt(
      await submitGovernedEvidence({
        barcode: BARCODE,
        domain: 'origins',
        claimValue: 'Australia',
        asProductionEpoch: true,
        originStructured: { claimType: 'packed_in', primaryCountry: 'Australia' },
      }),
      2
    );
    const product = { barcode: BARCODE, product_name: 'Origins fixture', source: 'openfoodfacts' } as Product;
    const scoring = toScoringProduct(product, [made, packed]);
    expect(scoring?.manufacturing_places_tags).toBeUndefined();
    expect(scoring?.origins_tags).toBeUndefined();
    expect(typeof scoring?.manufacturing_places === 'string' || scoring?.manufacturing_places == null).toBe(true);
  });
});
