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
import { calculateOpenPillar } from '../../../lib/truscoreEngine/pillars/openPillar';
import { publishTransparencyPillar } from '../../../lib/rateability/transparencyPublication';
import { admittedUserOriginPrevailsForDisplay } from '../../../origins/offUserPrecedence';
import type { GovernedOriginFact } from '../../../origins/governedFacts';
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

  it('keeps a stated percentage when the qualifier is not a supported semantic', async () => {
    const stored = await submitGovernedEvidence({
      barcode: BARCODE,
      domain: 'origins',
      claimValue: 'Ghana',
      asProductionEpoch: true,
      originStructured: {
        claimType: 'ingredient_origin',
        primaryCountry: 'Ghana',
        ingredientSubject: 'Cocoa mass',
        ingredientOriginPercentage: 40,
        percentageQualifier: 'other_unclear' as never,
      },
    });
    const facts = selectPrevailingOriginFacts([admitAt(stored, 1)]);
    expect(stored.originStructured?.ingredientOriginPercentage).toBe(40);
    expect(stored.originStructured?.percentageQualifier).toBeUndefined();
    expect(stored.exactWording).toContain('40%');
    expect(facts[0]?.percentage).toBe(40);
    expect(facts[0]?.percentageQualifier).toBeUndefined();
  });
});

function honeyProduct(facts?: GovernedOriginFact[]): Product {
  return {
    barcode: BARCODE,
    product_name: 'Honey',
    source: 'openfoodfacts',
    ingredients_text: 'honey',
    ingredients_text_en: 'honey',
    ingredients_lc: 'en',
    lang: 'en',
    additives_tags: [],
    ...(facts ? { rveelGovernedOrigins: facts } : {}),
  } as Product;
}

describe('Wave 4A.3 Transparency origins disclosure', () => {
  async function ingredientFact(
    input: {
      subject: string;
      country: string;
      wording: string;
      percentage?: number;
      qualifier?: 'at_least' | 'exactly' | 'more_than' | 'less_than';
    }
  ): Promise<GovernedOriginFact> {
    const stored = admitAt(
      await submitGovernedEvidence({
        barcode: BARCODE,
        domain: 'origins',
        claimValue: input.country || input.subject,
        exactWording: input.wording,
        asProductionEpoch: true,
        originStructured: {
          claimType: 'ingredient_origin',
          primaryCountry: input.country,
          ingredientSubject: input.subject,
          ingredientOriginPercentage: input.percentage,
          percentageQualifier: input.qualifier,
        },
      }),
      1
    );
    const fact = selectPrevailingOriginFacts([stored])[0];
    if (!fact) throw new Error('expected ingredient origin fact');
    return fact;
  }

  it('resolves the existing origins lane from a single-ingredient origin without changing Open scoring', async () => {
    const fact = await ingredientFact({
      subject: 'Honey',
      country: 'New Zealand',
      wording: 'Honey from New Zealand',
    });
    const bare = calculateOpenPillar(honeyProduct());
    const open = calculateOpenPillar(honeyProduct([fact]));
    expect(open.score).toBe(bare.score);
    expect(open.details.originsAdjustmentId).toBe('open-v15-origins-insufficient');
    expect(honeyProduct([fact]).origins_tags).toBeUndefined();
    const published = publishTransparencyPillar({
      product: honeyProduct([fact]),
      open,
      authoritative: { transparencyIngredient: true, transparencyOrigins: true },
    });
    expect(published.assessmentLanes.origins).toBe('resolved');
    expect(published.confidence).toBe('limited');
    expect(published.s26?.code).toBe('TRANSPARENCY_LIMITED_PRIMARY_CONTRIBUTION');
    expect(published.diagnostic.originsDisclosureRequirement).toBe('evidently_complete');
  });

  it('does not resolve the lane from manufacture evidence or from a percentage without a qualifier', async () => {
    const made = selectPrevailingOriginFacts([
      admitAt(
        await submitGovernedEvidence({
          barcode: BARCODE,
          domain: 'origins',
          claimValue: 'New Zealand',
          exactWording: 'Made in New Zealand',
          asProductionEpoch: true,
          originStructured: { claimType: 'made_in', primaryCountry: 'New Zealand' },
        }),
        1
      ),
    ]);
    const madeOpen = calculateOpenPillar(honeyProduct(made));
    const madePublished = publishTransparencyPillar({ product: honeyProduct(made), open: madeOpen });
    expect(madePublished.assessmentLanes.origins).toBe('unassessed');

    const unqualified = await ingredientFact({
      subject: 'Honey',
      country: 'New Zealand',
      wording: 'Honey 80% New Zealand',
      percentage: 80,
    });
    const unqualifiedPublished = publishTransparencyPillar({
      product: honeyProduct([unqualified]),
      open: calculateOpenPillar(honeyProduct([unqualified])),
    });
    expect(unqualified.percentage).toBe(80);
    expect(unqualified.percentageQualifier).toBeUndefined();
    expect(unqualifiedPublished.assessmentLanes.origins).toBe('unassessed');
  });

  it('uses an exact percentage band or a qualified partial statement, and leaves Open tags untouched', async () => {
    const exact = await ingredientFact({
      subject: 'Honey',
      country: 'New Zealand',
      wording: 'Honey exactly 80% New Zealand',
      percentage: 80,
      qualifier: 'exactly',
    });
    const exactOpen = calculateOpenPillar(honeyProduct([exact]));
    const exactPublished = publishTransparencyPillar({
      product: honeyProduct([exact]),
      open: exactOpen,
    });
    expect(exactOpen.details.originsAdjustmentId).toBe('open-v15-origins-pct-76-94');
    expect(exactOpen.details.originsAdjustment).toBe(-1);
    expect(exactPublished.assessmentLanes.origins).toBe('resolved');
    expect(exactPublished.diagnostic.originsDisclosureRequirement).toBe('stated_percentage_band');
    expect(exactPublished.confidence).toBe('limited');

    const qualified = await ingredientFact({
      subject: 'Honey',
      country: 'New Zealand',
      wording: 'Honey from at least 80% New Zealand',
      percentage: 80,
      qualifier: 'at_least',
    });
    const qualifiedPublished = publishTransparencyPillar({
      product: honeyProduct([qualified]),
      open: calculateOpenPillar(honeyProduct([qualified])),
    });
    expect(qualifiedPublished.diagnostic.originsDisclosureRequirement).toBe('stated_percentage_band');
    expect(qualifiedPublished.assessmentLanes.origins).toBe('resolved');
  });

  it('keeps an existing Open origins resolution at its own confidence', async () => {
    const fact = await ingredientFact({
      subject: 'Honey',
      country: 'New Zealand',
      wording: 'Honey from New Zealand',
    });
    const product = honeyProduct([fact]);
    product.origins_tags = ['en:new-zealand'];
    const open = calculateOpenPillar(product);
    expect(open.details.originsAdjustmentId).toBe('open-v15-origins-evidently-complete');
    const published = publishTransparencyPillar({ product, open });
    expect(published.assessmentLanes.origins).toBe('resolved');
    expect(published.confidence).toBe('moderate');
    expect(published.diagnostic.originsDisclosureSource).toBe('off');
  });

  it('lets an admitted ingredient origin prevail over conflicting OFF origin data', async () => {
    const fact = await ingredientFact({
      subject: 'Honey',
      country: 'New Zealand',
      wording: 'Honey from New Zealand',
    });
    const product = honeyProduct([fact]);
    product.origins_tags = ['en:australia'];
    product.origins = 'australia';
    const open = calculateOpenPillar(product);
    expect(open.details.originsAdjustmentId).toBe('open-v15-origins-evidently-complete');
    const published = publishTransparencyPillar({
      product,
      open,
      authoritative: { transparencyIngredient: true, transparencyOrigins: true },
    });
    expect(product.origins_tags).toEqual(['en:australia']);
    expect(product.origins).toBe('australia');
    expect(published.assessmentLanes.origins).toBe('resolved');
    expect(published.confidence).toBe('limited');
    expect(published.diagnostic.originsDisclosureSource).toBe('primary_contribution');
    expect(published.diagnostic.admittedUserPrevailsOverOff).toBe(true);
    expect(published.diagnostic.originsDisclosureRequirement).toBe('evidently_complete');
    expect(admittedUserOriginPrevailsForDisplay(product, [fact])).toBe(true);

    const agreed = honeyProduct([fact]);
    agreed.origins_tags = ['en:new-zealand'];
    const agreedOpen = calculateOpenPillar(agreed);
    const agreedPublished = publishTransparencyPillar({ product: agreed, open: agreedOpen });
    expect(agreedPublished.confidence).toBe('moderate');
    expect(agreedPublished.diagnostic.originsDisclosureSource).toBe('off');
    expect(admittedUserOriginPrevailsForDisplay(agreed, [fact])).toBe(false);

    const madeIn: GovernedOriginFact = {
      evidenceId: 'made-nz',
      subjectKey: 'made_in',
      claimType: 'made_in',
      countries: ['New Zealand'],
      confidence: 'limited',
    };
    const manufactured = honeyProduct([madeIn]);
    manufactured.manufacturing_places = 'Australia';
    expect(admittedUserOriginPrevailsForDisplay(manufactured, [madeIn])).toBe(true);
    expect(manufactured.manufacturing_places).toBe('Australia');
    const manufacturePublished = publishTransparencyPillar({
      product: manufactured,
      open: calculateOpenPillar(manufactured),
    });
    expect(manufacturePublished.assessmentLanes.origins).toBe('unassessed');
  });

  it('does not let conflicting OFF origin data fill a lane the admitted fact does not establish', async () => {
    const fact = await ingredientFact({
      subject: 'Honey',
      country: 'New Zealand',
      wording: 'Honey 80% New Zealand',
      percentage: 80,
    });
    const product = honeyProduct([fact]);
    product.origins_tags = ['en:australia'];
    const open = calculateOpenPillar(product);
    expect(open.details.originsAdjustmentId).toBe('open-v15-origins-evidently-complete');
    const published = publishTransparencyPillar({ product, open });
    expect(product.origins_tags).toEqual(['en:australia']);
    expect(published.assessmentLanes.origins).toBe('unassessed');
    expect(published.diagnostic.admittedUserPrevailsOverOff).toBe(true);
    expect(open.score).toBe(calculateOpenPillar({ ...product, rveelGovernedOrigins: undefined }).score);
  });

  it('leaves two ingredient countries unresolved', async () => {
    const cocoa = await ingredientFact({
      subject: 'Cocoa mass',
      country: 'Ghana',
      wording: 'Cocoa mass from Ghana',
    });
    const sugar = selectPrevailingOriginFacts([
      admitAt(
        await submitGovernedEvidence({
          barcode: BARCODE,
          domain: 'origins',
          claimValue: 'Australia',
          exactWording: 'Cane sugar from Australia',
          asProductionEpoch: true,
          originStructured: {
            claimType: 'ingredient_origin',
            primaryCountry: 'Australia',
            ingredientSubject: 'Cane sugar',
          },
        }),
        2
      ),
    ])[0];
    const multi = {
      ...honeyProduct(),
      product_name: 'Chocolate',
      ingredients_text: 'cocoa mass, cane sugar',
      ingredients_text_en: 'cocoa mass, cane sugar',
      rveelGovernedOrigins: [cocoa, sugar].filter((row): row is GovernedOriginFact => !!row),
    } as Product;
    const multiPublished = publishTransparencyPillar({
      product: multi,
      open: calculateOpenPillar(multi),
    });
    expect(multiPublished.assessmentLanes.origins).toBe('unassessed');
    expect(calculateOpenPillar(multi).details.originsAdjustmentId).toBe('open-v15-origins-insufficient');
  });

  async function placeFact(input: {
    claimType: 'grown_in' | 'produced_in' | 'made_in' | 'packed_in';
    country: string;
    wording: string;
    subject?: string;
    percentage?: number;
    qualifier?: 'at_least' | 'exactly' | 'more_than' | 'less_than';
  }): Promise<GovernedOriginFact> {
    const stored = admitAt(
      await submitGovernedEvidence({
        barcode: BARCODE,
        domain: 'origins',
        claimValue: input.country,
        exactWording: input.wording,
        asProductionEpoch: true,
        originStructured: {
          claimType: input.claimType,
          primaryCountry: input.country,
          ingredientSubject: input.subject,
          ingredientOriginPercentage: input.percentage,
          percentageQualifier: input.qualifier,
        },
      }),
      3
    );
    const fact = selectPrevailingOriginFacts([stored])[0];
    if (!fact) throw new Error('expected place origin fact');
    return fact;
  }

  it('lets grown_in and produced_in enter disclosure completeness only when a v15 state is established', async () => {
    const bareGrown = await placeFact({
      claimType: 'grown_in',
      country: 'New Zealand',
      wording: 'Grown in New Zealand',
    });
    const bareProduct = honeyProduct([bareGrown]);
    const bareOpen = calculateOpenPillar(bareProduct);
    const barePublished = publishTransparencyPillar({ product: bareProduct, open: bareOpen });
    expect(bareOpen.details.originsAdjustmentId).toBe('open-v15-origins-evidently-complete');
    expect(bareOpen.details.originsAdjustment).toBe(8);
    expect(bareOpen.details.originsProvenance).toBe('governed_packet');
    expect(barePublished.assessmentLanes.origins).toBe('resolved');
    expect(barePublished.diagnostic.originsDisclosureRequirement).toBe('evidently_complete');
    expect(bareGrown.claimType).toBe('grown_in');

    const qualifiedGrown = await placeFact({
      claimType: 'grown_in',
      country: 'New Zealand',
      wording: 'Grown in New Zealand from at least 80% New Zealand honey',
      percentage: 80,
      qualifier: 'at_least',
    });
    const qualifiedProduct = honeyProduct([qualifiedGrown]);
    const qualifiedOpen = calculateOpenPillar(qualifiedProduct);
    const qualifiedPublished = publishTransparencyPillar({ product: qualifiedProduct, open: qualifiedOpen });
    expect(qualifiedOpen.details.originsAdjustmentId).toBe('open-v15-origins-pct-76-94');
    expect(qualifiedOpen.details.originsAdjustment).toBe(-1);
    expect(qualifiedPublished.assessmentLanes.origins).toBe('resolved');
    expect(qualifiedPublished.diagnostic.originsDisclosureRequirement).toBe('stated_percentage_band');
    expect(qualifiedPublished.confidence).toBe('limited');

    const produced = await placeFact({
      claimType: 'produced_in',
      country: 'New Zealand',
      wording: 'Honey produced in New Zealand, exactly 80%',
      subject: 'Honey',
      percentage: 80,
      qualifier: 'exactly',
    });
    const producedProduct = honeyProduct([produced]);
    const producedOpen = calculateOpenPillar(producedProduct);
    const producedPublished = publishTransparencyPillar({ product: producedProduct, open: producedOpen });
    expect(producedOpen.details.originsAdjustmentId).toBe('open-v15-origins-pct-76-94');
    expect(producedOpen.details.originsAdjustment).toBe(-1);
    expect(producedPublished.assessmentLanes.origins).toBe('resolved');
    expect(producedPublished.diagnostic.originsDisclosureRequirement).toBe('stated_percentage_band');
    expect(produced.ingredientSubject).toBe('Honey');
  });

  it('does not let made_in or packed_in resolve the Transparency origins lane', async () => {
    const made = await placeFact({
      claimType: 'made_in',
      country: 'New Zealand',
      wording: 'Made in New Zealand from at least 80% New Zealand ingredients',
      percentage: 80,
      qualifier: 'at_least',
    });
    const packed = await placeFact({
      claimType: 'packed_in',
      country: 'Fiji',
      wording: 'Packed in Fiji',
    });
    const product = honeyProduct([made, packed]);
    product.origins_tags = ['en:australia'];
    const open = calculateOpenPillar(product);
    const published = publishTransparencyPillar({ product, open });
    expect(open.details.originsAdjustmentId).toBe('open-v15-origins-evidently-complete');
    expect(published.assessmentLanes.origins).toBe('resolved');
    expect(published.diagnostic.originsDisclosureSource).toBe('off');
    expect(published.confidence).toBe('moderate');
    expect(product.origins_tags).toEqual(['en:australia']);
    expect(product.rveelGovernedOrigins?.map((fact) => fact.claimType).sort()).toEqual(['made_in', 'packed_in']);
  });

  it('keeps admitted grown_in ahead of conflicting OFF origin data', async () => {
    const grown = await placeFact({
      claimType: 'grown_in',
      country: 'New Zealand',
      wording: 'Honey grown in New Zealand from at least 80% New Zealand honey',
      subject: 'Honey',
      percentage: 80,
      qualifier: 'at_least',
    });
    const product = honeyProduct([grown]);
    product.origins_tags = ['en:australia'];
    const open = calculateOpenPillar(product);
    const published = publishTransparencyPillar({
      product,
      open,
      authoritative: { transparencyIngredient: true, transparencyOrigins: true },
    });
    expect(open.details.originsAdjustmentId).toBe('open-v15-origins-pct-76-94');
    expect(open.details.originsAdjustment).toBe(-1);
    expect(open.details.originsProvenance).toBe('governed_packet');
    expect(open.adjustments.filter((row) => row.family === 'origins')).toHaveLength(1);
    expect(product.origins_tags).toEqual(['en:australia']);
    expect(published.assessmentLanes.origins).toBe('resolved');
    expect(published.confidence).toBe('limited');
    expect(published.diagnostic.originsDisclosureSource).toBe('primary_contribution');
    expect(published.diagnostic.admittedUserPrevailsOverOff).toBe(true);
    expect(published.diagnostic.originsDisclosureRequirement).toBe('stated_percentage_band');

    const insufficient = await placeFact({
      claimType: 'produced_in',
      country: 'New Zealand',
      wording: 'Produced in New Zealand',
    });
    const blocked = honeyProduct([insufficient]);
    blocked.origins_tags = ['en:australia'];
    const blockedOpen = calculateOpenPillar(blocked);
    const blockedPublished = publishTransparencyPillar({ product: blocked, open: blockedOpen });
    expect(blocked.origins_tags).toEqual(['en:australia']);
    expect(blockedOpen.details.originsAdjustmentId).toBe('open-v15-origins-evidently-complete');
    expect(blockedPublished.assessmentLanes.origins).toBe('resolved');
    expect(blockedPublished.diagnostic.originsDisclosureRequirement).toBe('evidently_complete');
    expect(blockedPublished.diagnostic.originsDisclosureSource).toBe('primary_contribution');
    expect(blockedPublished.diagnostic.admittedUserPrevailsOverOff).toBe(true);
  });
});
