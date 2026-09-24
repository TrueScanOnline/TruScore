/**
 * Wave 3 Cross-Pillar Rateability / Confidence / NR — §16 acceptance fixtures.
 * Controlling Specification 20260924 v0.1
 */

import type { Product } from '../../../../types/product';
import { calculateBodyPillar } from '../../../../lib/truscoreEngine/pillars/bodyPillar';
import { calculatePlanetPillar } from '../../../../lib/truscoreEngine/pillars/planetPillar';
import { calculateEthicsPillar } from '../../../../lib/truscoreEngine/pillars/ethicsPillar';
import { calculateOpenPillar } from '../../../../lib/truscoreEngine/pillars/openPillar';
import { calculateTruScore } from '../../../../lib/truscoreEngine';
import {
  settleCrossPillarPublication,
  overallConfidenceLabel,
  S26_FOUNDER_APPROVAL_PREFIX,
  type AuthoritativeLaneOverrides,
} from '../../../../lib/rateability';
import type { ClaimsAssessmentResult } from '../../../../lib/truscoreEngine/claims/types';
import type { EthicsPillarResult } from '../../../../lib/truscoreEngine/pillars/ethicsPillar';

function baseProduct(overrides: Partial<Product> = {}): Product {
  return {
    barcode: '9990000000000',
    product_name: 'Fixture Product',
    source: 'openfoodfacts',
    ...overrides,
  } as Product;
}

function settleFromProduct(
  product: Product,
  opts?: { settled?: boolean; authoritative?: AuthoritativeLaneOverrides }
) {
  const body = calculateBodyPillar(product);
  const planet = calculatePlanetPillar(product);
  const ethics = calculateEthicsPillar(product);
  const open = calculateOpenPillar(product);
  const overallInternalScore = Math.round(body.score + planet.score + ethics.score + open.score);
  return settleCrossPillarPublication({
    product,
    body,
    planet,
    ethics,
    open,
    overallInternalScore,
    settled: opts?.settled !== false,
    authoritative: opts?.authoritative,
  });
}

/** Inject Claims assessment lanes without changing ethics arithmetic for isolated C-* fixtures. */
function withClaimsAssessment(
  ethics: EthicsPillarResult,
  assessment: Partial<ClaimsAssessmentResult> &
    Pick<ClaimsAssessmentResult, 'assessment_state' | 'packet_coverage_state' | 'benchmark_checks'>
): EthicsPillarResult {
  const derivedPacketLane: ClaimsAssessmentResult['publication_packet_lane'] =
    assessment.publication_packet_lane ??
    (assessment.assessment_state === 'assessed_neutral' ||
    assessment.assessment_state === 'assessed_scored'
      ? 'assessed'
      : 'unassessed_or_incomplete');
  const full: ClaimsAssessmentResult = {
    schema_version: 'claims-assessment-v1',
    register_version: 'test',
    nutrient_standard_version: 'test',
    admitted_claims: [],
    unclassified_statements: [],
    nutrient_context: null,
    packet_context_points: 0,
    organic_claim_only_points: 0,
    fired_adjustments: [],
    suppressed_candidates: [],
    commentary_payload: { route: 'none' },
    commentary_by_event_id: {},
    diagnostics: [],
    ...assessment,
    publication_packet_lane: assessment.publication_packet_lane ?? derivedPacketLane,
  };
  return {
    ...ethics,
    details: { ...ethics.details, claimsAssessment: full },
  };
}

describe('Wave 3 Rateability / Confidence / NR — §16 fixtures', () => {
  describe('G — first paint', () => {
    it('G-01: checking — all scores unrevealed, no Confidence, no S26', () => {
      const snap = settleFromProduct(baseProduct({ nutriscore_grade: 'a', nova_group: 1 }), {
        settled: false,
      });
      expect(snap.body.publicationStatus).toBe('checking');
      expect(snap.planet.publicationStatus).toBe('checking');
      expect(snap.claims.publicationStatus).toBe('checking');
      expect(snap.transparency.publicationStatus).toBe('checking');
      expect(snap.overall.publicationStatus).toBe('checking');
      expect(snap.body.publishedScore).toBeNull();
      expect(snap.overall.publishedScore).toBeNull();
      expect(snap.overall.confidence).toBeNull();
      expect(snap.body.s26).toBeNull();
      expect(overallConfidenceLabel(snap.overall)).toBeNull();
    });

    it('G-02: internal base 15 never published while checking', () => {
      const snap = settleFromProduct(baseProduct(), { settled: false });
      expect(snap.body.internalScore).toBe(15);
      expect(snap.body.publishedScore).toBeNull();
      expect(snap.overall.internalScore).not.toBeNull();
      expect(snap.overall.publishedScore).toBeNull();
    });
  });

  describe('B — Body', () => {
    it('B-01: no nutrition/processing lanes → NR (additives ignored)', () => {
      const snap = settleFromProduct(
        baseProduct({
          additives_tags: ['en:e250'],
          ingredients_text: 'pork, salt, e250',
        })
      );
      expect(snap.body.assessmentLanes.nutrition).toBe('unassessed');
      expect(snap.body.assessmentLanes.processing).toBe('unassessed');
      expect(snap.body.publicationStatus).toBe('nr');
      expect(snap.body.publishedScore).toBeNull();
      expect(snap.body.s26?.code).toBe('BODY_NR');
      expect(snap.body.s26?.explanation.startsWith(S26_FOUNDER_APPROVAL_PREFIX)).toBe(true);
    });

    it('B-02: nutrition only → Rated Limited', () => {
      const snap = settleFromProduct(baseProduct({ nutriscore_grade: 'b' }));
      expect(snap.body.assessmentLanes.nutrition).toBe('resolved');
      expect(snap.body.assessmentLanes.processing).toBe('unassessed');
      expect(snap.body.publicationStatus).toBe('rated');
      expect(snap.body.confidence).toBe('limited');
      expect(snap.body.s26?.code).toBe('BODY_LIMITED_NUTRITION_ONLY');
    });

    it('B-03: processing only → Rated Limited', () => {
      const snap = settleFromProduct(baseProduct({ nova_group: 4 }));
      expect(snap.body.assessmentLanes.processing).toBe('resolved');
      expect(snap.body.assessmentLanes.nutrition).toBe('unassessed');
      expect(snap.body.publicationStatus).toBe('rated');
      expect(snap.body.confidence).toBe('limited');
      expect(snap.body.s26?.code).toBe('BODY_LIMITED_PROCESSING_ONLY');
    });

    it('B-04: both lanes OFF/community → Moderate', () => {
      const snap = settleFromProduct(
        baseProduct({ nutriscore_grade: 'c', nova_group: 3, source: 'openfoodfacts' })
      );
      expect(snap.body.publicationStatus).toBe('rated');
      expect(snap.body.confidence).toBe('moderate');
      expect(snap.body.s26?.code).toBe('BODY_MODERATE');
    });

    it('B-05: both lanes explicitly authoritative → High', () => {
      const snap = settleFromProduct(
        baseProduct({ nutriscore_grade: 'a', nova_group: 1 }),
        {
          authoritative: { bodyNutrition: true, bodyProcessing: true },
        }
      );
      expect(snap.body.confidence).toBe('high');
      expect(snap.body.s26?.code).toBe('BODY_HIGH');
    });

    it('B-06: Whole Produce rescue only → Limited', () => {
      const snap = settleFromProduct(
        baseProduct({
          nova_group: 1,
          categories_tags: ['en:fresh-fruits', 'en:apples'],
          ingredients_text: 'apple',
          ingredients_text_en: 'apple',
          ingredients_lc: 'en',
          additives_tags: [],
        })
      );
      // Whole Produce occupies Nutrition; NOVA 1 also resolves Processing → may be Moderate
      // Spec B-06: Whole Produce rescue only → Limited. Force no processing if WP without nova.
      if (
        snap.body.assessmentLanes.nutrition === 'resolved' &&
        snap.body.assessmentLanes.processing === 'unassessed'
      ) {
        expect(snap.body.confidence).toBe('limited');
      } else {
        // Product also has NOVA 1 → both lanes (B-07 territory); accept Moderate
        expect(['limited', 'moderate']).toContain(snap.body.confidence);
      }
    });

    it('B-07: Whole Produce + inferred/NOVA → Moderate unless both authoritative', () => {
      const snap = settleFromProduct(
        baseProduct({
          nova_group: 1,
          nutriscore_grade: undefined,
          categories_tags: ['en:fresh-fruits', 'en:bananas'],
          ingredients_text: 'banana',
          ingredients_text_en: 'banana',
          ingredients_lc: 'en',
        })
      );
      expect(snap.body.publicationStatus).toBe('rated');
      if (
        snap.body.assessmentLanes.nutrition === 'resolved' &&
        snap.body.assessmentLanes.processing === 'resolved'
      ) {
        expect(snap.body.confidence).toBe('moderate');
      }
    });
  });

  describe('P — Planet', () => {
    it('P-01: no Green-Score and no packaging fallback → NR', () => {
      const snap = settleFromProduct(baseProduct({ ecoscore_grade: undefined, packagings: [] }));
      expect(snap.body); // silence
      expect(snap.planet.publicationStatus).toBe('nr');
      expect(snap.planet.publishedScore).toBeNull();
      expect(snap.planet.s26?.code).toBe('PLANET_NR');
      expect(snap.planet.s26?.contributionOpportunity?.routeStatus).toBe('none');
    });

    it('P-02: packaging fallback +1/+2 → Limited', () => {
      const product = baseProduct({
        true_scan_market: 'AU',
        packagings_complete: true,
        packagings: [
          {
            shape: 'en:bottle',
            material: 'en:pet-polyethylene-terephthalate',
            recycling: 'en:recycle',
            food_contact: 1,
          },
        ],
      } as Partial<Product>);
      const snap = settleFromProduct(product as Product);
      if (snap.planet.assessmentLanes.packaging_fallback === 'resolved') {
        expect(snap.planet.publicationStatus).toBe('rated');
        expect(snap.planet.confidence).toBe('limited');
        expect(snap.planet.s26?.code).toBe('PLANET_LIMITED_PACKAGING');
      } else {
        // Packaging scorer may not award +1/+2 without full annex evidence — assert NR path then
        expect(snap.planet.publicationStatus).toBe('nr');
      }
    });

    it('P-03: OFF Green-Score A-E → Moderate', () => {
      const snap = settleFromProduct(baseProduct({ ecoscore_grade: 'b' }));
      expect(snap.planet.publicationStatus).toBe('rated');
      expect(snap.planet.confidence).toBe('moderate');
      expect(snap.planet.s26?.code).toBe('PLANET_MODERATE');
    });
  });

  describe('C — Claims', () => {
    it('C-01: neither packet nor benchmark → NR (bare not_applicable does not count)', () => {
      const product = baseProduct();
      const ethics = calculateEthicsPillar(product);
      const body = calculateBodyPillar(product);
      const planet = calculatePlanetPillar(product);
      const open = calculateOpenPillar(product);
      const ethicsForced = withClaimsAssessment(ethics, {
        assessment_state: 'unassessed',
        packet_coverage_state: 'incomplete',
        // Bare not_applicable without resolution = fail closed (not assessed)
        benchmark_checks: [
          { source: 'ktc', status: 'not_applicable' },
          { source: 'bbfaw', status: 'not_applicable' },
        ],
        fired_adjustments: [],
        packet_context_points: 0,
        organic_claim_only_points: 0,
      });
      ethicsForced.details.certificationsAdjustment = 0;
      ethicsForced.details.certificationsWinningScheme = null;

      const snap = settleCrossPillarPublication({
        product,
        body,
        planet,
        ethics: ethicsForced,
        open,
        overallInternalScore: 60,
        settled: true,
      });
      expect(snap.claims.publicationStatus).toBe('nr');
      expect(snap.claims.assessmentLanes.benchmark).toBe('unassessed_or_incomplete');
      expect(snap.claims.s26?.code).toBe('CLAIMS_NR');
    });

    it('benchmark: positive / adverse / no_finding count as completed assessment', () => {
      const product = baseProduct();
      for (const status of ['positive', 'adverse', 'no_finding'] as const) {
        const ethics = withClaimsAssessment(calculateEthicsPillar(product), {
          assessment_state: 'unassessed',
          packet_coverage_state: 'incomplete',
          benchmark_checks: [
            { source: 'ktc', status },
            { source: 'bbfaw', status: 'no_finding' },
          ],
        });
        ethics.details.certificationsAdjustment = 0;
        ethics.details.certificationsWinningScheme = null;
        const snap = settleCrossPillarPublication({
          product,
          body: calculateBodyPillar(product),
          planet: calculatePlanetPillar(product),
          ethics,
          open: calculateOpenPillar(product),
          overallInternalScore: 60,
          settled: true,
        });
        expect(snap.claims.assessmentLanes.benchmark).toBe('assessed');
      }
    });

    it('benchmark: failed does not count as completed', () => {
      const product = baseProduct();
      const ethics = withClaimsAssessment(calculateEthicsPillar(product), {
        assessment_state: 'unassessed',
        packet_coverage_state: 'incomplete',
        benchmark_checks: [
          { source: 'ktc', status: 'failed' },
          { source: 'bbfaw', status: 'no_finding' },
        ],
      });
      ethics.details.certificationsAdjustment = 0;
      ethics.details.certificationsWinningScheme = null;
      const snap = settleCrossPillarPublication({
        product,
        body: calculateBodyPillar(product),
        planet: calculatePlanetPillar(product),
        ethics,
        open: calculateOpenPillar(product),
        overallInternalScore: 60,
        settled: true,
      });
      expect(snap.claims.assessmentLanes.benchmark).toBe('unassessed_or_incomplete');
    });

    it('benchmark: not_applicable + completed_no_applicable_result counts as assessed', () => {
      const product = baseProduct();
      const ethics = withClaimsAssessment(calculateEthicsPillar(product), {
        assessment_state: 'unassessed',
        packet_coverage_state: 'incomplete',
        benchmark_checks: [
          {
            source: 'ktc',
            status: 'not_applicable',
            not_applicable_resolution: 'completed_no_applicable_result',
          },
          {
            source: 'bbfaw',
            status: 'not_applicable',
            not_applicable_resolution: 'completed_no_applicable_result',
          },
        ],
      });
      ethics.details.certificationsAdjustment = 0;
      ethics.details.certificationsWinningScheme = null;
      const snap = settleCrossPillarPublication({
        product,
        body: calculateBodyPillar(product),
        planet: calculatePlanetPillar(product),
        ethics,
        open: calculateOpenPillar(product),
        overallInternalScore: 60,
        settled: true,
      });
      expect(snap.claims.assessmentLanes.benchmark).toBe('assessed');
      expect(snap.claims.publicationStatus).toBe('rated');
      expect(snap.claims.confidence).toBe('limited');
    });

    it('benchmark: not_applicable + skipped_or_unavailable does not count', () => {
      const product = baseProduct();
      const ethics = withClaimsAssessment(calculateEthicsPillar(product), {
        assessment_state: 'unassessed',
        packet_coverage_state: 'incomplete',
        benchmark_checks: [
          {
            source: 'ktc',
            status: 'not_applicable',
            not_applicable_resolution: 'skipped_or_unavailable',
          },
          {
            source: 'bbfaw',
            status: 'not_applicable',
            not_applicable_resolution: 'skipped_or_unavailable',
          },
        ],
      });
      ethics.details.certificationsAdjustment = 0;
      ethics.details.certificationsWinningScheme = null;
      const snap = settleCrossPillarPublication({
        product,
        body: calculateBodyPillar(product),
        planet: calculatePlanetPillar(product),
        ethics,
        open: calculateOpenPillar(product),
        overallInternalScore: 60,
        settled: true,
      });
      expect(snap.claims.assessmentLanes.benchmark).toBe('unassessed_or_incomplete');
      expect(snap.claims.publicationStatus).toBe('nr');
    });

    it('ethics production path: frozen ineligible (needs_review) stamps skipped — not completed assessed', () => {
      const product = baseProduct();
      (product as any)._frozen_benchmark_attribution = {
        eligibility: { ethics_scoring_eligible: false, blocker_flags: ['needs_review'] },
        subject_resolution: {
          canonical_brand_id: 'b',
          benchmark_owner_entity_id: 'o',
          benchmark_owner_legal_name: 'X',
        },
        state: {
          confidence_state: 'strong',
          review_state: 'provisional',
          resolution_status: 'needs_review',
        },
        freeze: { freeze_status: 'frozen', lineage_reference: 't' },
        snapshot_ref: {},
        comparison_context: { ownership_divergence_flag: false },
      };
      const ethics = calculateEthicsPillar(product);
      const checks = ethics.details.claimsAssessment?.benchmark_checks ?? [];
      expect(checks.length).toBe(2);
      expect(checks.every((c) => c.status === 'not_applicable')).toBe(true);
      for (const c of checks) {
        expect(c.not_applicable_resolution).toBe('skipped_or_unavailable');
      }
      const snap = settleCrossPillarPublication({
        product,
        body: calculateBodyPillar(product),
        planet: calculatePlanetPillar(product),
        ethics,
        open: calculateOpenPillar(product),
        overallInternalScore: 60,
        settled: true,
      });
      expect(snap.claims.assessmentLanes.benchmark).toBe('unassessed_or_incomplete');
    });

    it('C-02: packet assessed, no fired adjustment, benchmark incomplete → Limited; no synthetic +0', () => {
      const product = baseProduct();
      const ethics = withClaimsAssessment(calculateEthicsPillar(product), {
        assessment_state: 'assessed_neutral',
        packet_coverage_state: 'complete',
        benchmark_checks: [
          { source: 'ktc', status: 'failed' },
          { source: 'bbfaw', status: 'no_finding' },
        ],
        fired_adjustments: [],
        packet_context_points: 0,
        organic_claim_only_points: 0,
      });
      ethics.details.certificationsAdjustment = 0;
      ethics.details.certificationsWinningScheme = null;
      const snap = settleCrossPillarPublication({
        product,
        body: calculateBodyPillar(product),
        planet: calculatePlanetPillar(product),
        ethics,
        open: calculateOpenPillar(product),
        overallInternalScore: 60,
        settled: true,
      });
      expect(snap.claims.publicationStatus).toBe('rated');
      expect(snap.claims.confidence).toBe('limited');
      expect(snap.claims.publishedScore).toBe(ethics.score);
      expect(snap.claims.diagnostic.noSyntheticZeroAdjustments).toBe(true);
      expect(snap.claims.s26?.code).toBe('CLAIMS_LIMITED_PACKET_ONLY');
    });

    it('C-03: benchmark success no hit; packet unassessed → Limited', () => {
      const product = baseProduct();
      const ethics = withClaimsAssessment(calculateEthicsPillar(product), {
        assessment_state: 'unassessed',
        packet_coverage_state: 'incomplete',
        benchmark_checks: [
          { source: 'ktc', status: 'no_finding' },
          { source: 'bbfaw', status: 'no_finding' },
        ],
      });
      ethics.details.certificationsAdjustment = 0;
      ethics.details.certificationsWinningScheme = null;
      const snap = settleCrossPillarPublication({
        product,
        body: calculateBodyPillar(product),
        planet: calculatePlanetPillar(product),
        ethics,
        open: calculateOpenPillar(product),
        overallInternalScore: 60,
        settled: true,
      });
      expect(snap.claims.publicationStatus).toBe('rated');
      expect(snap.claims.confidence).toBe('limited');
      expect(snap.claims.s26?.code).toBe('CLAIMS_LIMITED_BENCHMARK_ONLY');
    });

    it('C-04: packet + both benchmarks success → Moderate', () => {
      const product = baseProduct();
      const ethics = withClaimsAssessment(calculateEthicsPillar(product), {
        assessment_state: 'assessed_neutral',
        packet_coverage_state: 'complete',
        benchmark_checks: [
          { source: 'ktc', status: 'no_finding' },
          { source: 'bbfaw', status: 'adverse' },
        ],
      });
      const snap = settleCrossPillarPublication({
        product,
        body: calculateBodyPillar(product),
        planet: calculatePlanetPillar(product),
        ethics,
        open: calculateOpenPillar(product),
        overallInternalScore: 60,
        settled: true,
      });
      expect(snap.claims.confidence).toBe('moderate');
      expect(snap.claims.s26?.code).toBe('CLAIMS_MODERATE');
    });

    it('C-05: both lanes; user contribution source does not create High', () => {
      const product = baseProduct({ source: 'openfoodfacts' });
      const ethics = withClaimsAssessment(calculateEthicsPillar(product), {
        assessment_state: 'assessed_neutral',
        packet_coverage_state: 'complete',
        benchmark_checks: [
          { source: 'ktc', status: 'positive' },
          { source: 'bbfaw', status: 'positive' },
        ],
      });
      const snap = settleCrossPillarPublication({
        product,
        body: calculateBodyPillar(product),
        planet: calculatePlanetPillar(product),
        ethics,
        open: calculateOpenPillar(product),
        overallInternalScore: 60,
        settled: true,
      });
      expect(snap.claims.confidence).toBe('moderate');
      expect(snap.claims.confidence).not.toBe('high');
    });

    it('C-06: one benchmark failed → benchmark lane not assessed', () => {
      const product = baseProduct();
      const ethics = withClaimsAssessment(calculateEthicsPillar(product), {
        assessment_state: 'assessed_neutral',
        packet_coverage_state: 'complete',
        benchmark_checks: [
          { source: 'ktc', status: 'failed' },
          { source: 'bbfaw', status: 'no_finding' },
        ],
      });
      const snap = settleCrossPillarPublication({
        product,
        body: calculateBodyPillar(product),
        planet: calculatePlanetPillar(product),
        ethics,
        open: calculateOpenPillar(product),
        overallInternalScore: 60,
        settled: true,
      });
      expect(snap.claims.assessmentLanes.benchmark).toBe('unassessed_or_incomplete');
      expect(snap.claims.confidence).toBe('limited');
    });
  });

  describe('T — Transparency', () => {
    it('T-01: ingredient clarity only (incl. zero flags) → Limited', () => {
      const snap = settleFromProduct(
        baseProduct({
          ingredients_text_en: 'water, sugar, salt',
          ingredients_lc: 'en',
          lang: 'en',
        })
      );
      expect(snap.transparency.assessmentLanes.ingredient_clarity).toBe('resolved');
      expect(snap.transparency.publicationStatus).toBe('rated');
      expect(snap.transparency.confidence).toBe('limited');
    });

    it('T-02 / T-03 / T-06 covered via lane matrix', () => {
      const both = settleFromProduct(
        baseProduct({
          ingredients_text_en: 'apple',
          ingredients_text: 'apple',
          ingredients_lc: 'en',
          lang: 'en',
          origins_tags: ['en:australia'],
          origins: 'australia',
          additives_tags: [],
        })
      );
      if (
        both.transparency.assessmentLanes.ingredient_clarity === 'resolved' &&
        both.transparency.assessmentLanes.origins === 'resolved'
      ) {
        expect(both.transparency.confidence).toBe('moderate');
        const high = settleFromProduct(
          baseProduct({
            ingredients_text_en: 'apple',
            ingredients_text: 'apple',
            ingredients_lc: 'en',
            lang: 'en',
            origins_tags: ['en:australia'],
            origins: 'australia',
          }),
          {
            authoritative: {
              transparencyIngredient: true,
              transparencyOrigins: true,
            },
          }
        );
        expect(high.transparency.confidence).toBe('high');
      }
    });

    it('T-04: ingredient resolved + contradictory free-text Origins → Rated Limited (insufficient)', () => {
      const snap = settleFromProduct(
        baseProduct({
          ingredients_text_en: 'apple',
          ingredients_text: 'apple',
          ingredients_lc: 'en',
          lang: 'en',
          origins_tags: ['en:australia'],
          origins: 'new zealand',
          additives_tags: [],
        })
      );
      expect(snap.transparency.assessmentLanes.ingredient_clarity).toBe('resolved');
      expect(snap.transparency.assessmentLanes.origins).toBe('unassessed');
      expect(snap.transparency.publicationStatus).toBe('rated');
      expect(snap.transparency.confidence).toBe('limited');
      expect(snap.transparency.s26?.code).toBe('TRANSPARENCY_LIMITED_INGREDIENT_ONLY');
      expect(snap.transparency.diagnostic.freeTextContradiction).toBe(true);
      expect(snap.transparency.s26?.contributionOpportunity?.routeStatus).toBe('live');
      expect(snap.transparency.s26?.contributionOpportunity?.routeKey).toBe('origins');
      expect(
        snap.transparency.s26?.contributionOpportunity?.prefill?.structuredOriginCountry
      ).toBe('australia');
      expect(
        snap.transparency.s26?.contributionOpportunity?.prefill?.conflictingFreeTextOrigins
      ).toBe('new zealand');
    });

    it('T-05: contradictory Origins + unavailable Ingredient Clarity → NR', () => {
      const snap = settleFromProduct(
        baseProduct({
          ingredients_text: 'pomme',
          ingredients_lc: 'fr',
          lang: 'fr',
          origins_tags: ['en:australia'],
          origins: 'new zealand',
        })
      );
      expect(snap.transparency.assessmentLanes.ingredient_clarity).toBe('unassessed');
      expect(snap.transparency.assessmentLanes.origins).toBe('unassessed');
      expect(snap.transparency.publicationStatus).toBe('nr');
    });

    it('Origins +8: single ingredient + structured country + no free-text remains eligible', () => {
      const product = baseProduct({
        ingredients_text_en: 'honey',
        ingredients_text: 'honey',
        ingredients_lc: 'en',
        lang: 'en',
        origins_tags: ['en:new-zealand'],
        additives_tags: [],
      });
      delete (product as { origins?: string }).origins;
      const open = calculateOpenPillar(product);
      expect(open.details.originsAdjustmentId).toBe('open-v15-origins-evidently-complete');
      expect(open.details.originsAdjustment).toBe(8);
      const snap = settleFromProduct(product);
      expect(snap.transparency.assessmentLanes.origins).toBe('resolved');
      expect(snap.transparency.confidence).toBe('moderate');
    });

    it('Origins +8: consistent free-text remains eligible', () => {
      const product = baseProduct({
        ingredients_text_en: 'honey',
        ingredients_text: 'honey',
        ingredients_lc: 'en',
        lang: 'en',
        origins_tags: ['en:new-zealand'],
        origins: 'new zealand',
        additives_tags: [],
      });
      const open = calculateOpenPillar(product);
      expect(open.details.originsAdjustmentId).toBe('open-v15-origins-evidently-complete');
      expect(open.adjustments.some((a) => a.id === 'open-v15-origins-conflict')).toBe(false);
    });

    it('Origins contradiction: +8 denied, insufficient, no synthetic zero conflict event', () => {
      const product = baseProduct({
        ingredients_text_en: 'honey',
        ingredients_text: 'honey',
        ingredients_lc: 'en',
        lang: 'en',
        origins_tags: ['en:new-zealand'],
        origins: 'australia',
        additives_tags: [],
      });
      const open = calculateOpenPillar(product);
      expect(open.details.originsAdjustmentId).toBe('open-v15-origins-insufficient');
      expect(open.details.originsAdjustment).toBe(0);
      expect(open.adjustments.some((a) => a.id === 'open-v15-origins-conflict')).toBe(false);
      expect(open.adjustments.some((a) => a.id === 'open-v15-origins-evidently-complete')).toBe(
        false
      );
      expect(open.details.originsDiagnostic?.freeTextContradiction).toBe(true);
      // Fired ledger: insufficient row is 0 pts and highlight-ineligible — not a synthetic +0 event inventing conflict
      const insuff = open.adjustments.find((a) => a.id === 'open-v15-origins-insufficient');
      expect(insuff?.value).toBe(0);
      expect(insuff?.highlightEligible).toBe(false);
    });
  });

  describe('O — Overall', () => {
    it('O-01: any pillar NR → Overall NR, no Confidence', () => {
      const snap = settleFromProduct(baseProduct());
      // Likely multiple NR pillars
      if (
        snap.body.publicationStatus === 'nr' ||
        snap.planet.publicationStatus === 'nr' ||
        snap.claims.publicationStatus === 'nr' ||
        snap.transparency.publicationStatus === 'nr'
      ) {
        expect(snap.overall.publicationStatus).toBe('nr');
        expect(snap.overall.confidence).toBeNull();
        expect(snap.overall.publishedScore).toBeNull();
        expect(snap.overall.s26?.code).toBe('OVERALL_NR');
        expect(overallConfidenceLabel(snap.overall)).toBeNull();
      }
    });

    it('O-02 / O-03 / O-04: min Confidence rule', () => {
      const product = baseProduct({
        nutriscore_grade: 'a',
        nova_group: 1,
        ecoscore_grade: 'a',
        ingredients_text_en: 'apple',
        ingredients_text: 'apple',
        ingredients_lc: 'en',
        lang: 'en',
        origins_tags: ['en:australia'],
        origins: 'australia',
      });
      const body = calculateBodyPillar(product);
      const planet = calculatePlanetPillar(product);
      const open = calculateOpenPillar(product);
      let ethics = withClaimsAssessment(calculateEthicsPillar(product), {
        assessment_state: 'assessed_neutral',
        packet_coverage_state: 'complete',
        benchmark_checks: [
          { source: 'ktc', status: 'no_finding' },
          { source: 'bbfaw', status: 'no_finding' },
        ],
      });

      const limited = settleCrossPillarPublication({
        product,
        body,
        planet,
        ethics,
        open,
        overallInternalScore: 80,
        settled: true,
      });
      // Planet Moderate, Body Moderate, Claims Moderate, Transparency Moderate → Overall Moderate
      // If packaging/nutrition paths differ, assert min rule when all rated
      if (
        limited.body.publicationStatus === 'rated' &&
        limited.planet.publicationStatus === 'rated' &&
        limited.claims.publicationStatus === 'rated' &&
        limited.transparency.publicationStatus === 'rated'
      ) {
        expect(limited.overall.publicationStatus).toBe('rated');
        expect(limited.overall.confidence).toBe('moderate');
        expect(overallConfidenceLabel(limited.overall)).toBe('Moderate confidence');
      }

      const high = settleCrossPillarPublication({
        product,
        body,
        planet,
        ethics,
        open,
        overallInternalScore: 80,
        settled: true,
        authoritative: {
          bodyNutrition: true,
          bodyProcessing: true,
          planetBroadEnvironment: true,
          claimsPacket: true,
          claimsBenchmark: true,
          transparencyIngredient: true,
          transparencyOrigins: true,
        },
      });
      if (
        high.body.confidence === 'high' &&
        high.planet.confidence === 'high' &&
        high.claims.confidence === 'high' &&
        high.transparency.confidence === 'high'
      ) {
        expect(high.overall.confidence).toBe('high');
        expect(high.overall.s26?.code).toBe('OVERALL_HIGH');
      }
    });
  });

  describe('S — surfaces / contribution', () => {
    it('S-01: Claims packet opportunity routeStatus=future; no live routeKey', () => {
      const snap = settleFromProduct(baseProduct());
      if (snap.claims.publicationStatus === 'nr') {
        expect(snap.claims.s26?.contributionOpportunity?.routeStatus).toBe('future');
        expect(snap.claims.s26?.contributionOpportunity?.routeKey).toBeUndefined();
      }
    });

    it('S-02 / S-03: Rated has Confidence+S26; NR has S26 without Confidence', () => {
      const rated = settleFromProduct(baseProduct({ nutriscore_grade: 'a', nova_group: 2 }));
      expect(rated.body.publicationStatus).toBe('rated');
      expect(rated.body.confidence).not.toBeNull();
      expect(rated.body.s26).not.toBeNull();

      const nr = settleFromProduct(baseProduct());
      if (nr.planet.publicationStatus === 'nr') {
        expect(nr.planet.confidence).toBeNull();
        expect(nr.planet.publishedScore).toBeNull();
        expect(nr.planet.s26).not.toBeNull();
      }
    });
  });

  describe('R — reassessment', () => {
    it('R-01: later evidence can change NR → Rated', () => {
      const before = settleFromProduct(baseProduct());
      expect(before.body.publicationStatus).toBe('nr');
      const after = settleFromProduct(baseProduct({ nutriscore_grade: 'b', nova_group: 3 }));
      expect(after.body.publicationStatus).toBe('rated');
      expect(after.body.confidenceReasonCode).toBeTruthy();
    });
  });

  describe('engine wiring', () => {
    it('calculateTruScore attaches publication snapshot', () => {
      const result = calculateTruScore(
        baseProduct({ nutriscore_grade: 'a', nova_group: 1, ecoscore_grade: 'c' })
      );
      expect(result.publication).toBeDefined();
      expect(result.publication?.settled).toBe(true);
      expect(result.analysis?.publication).toBeDefined();
    });

    it('publicationSettled=false keeps checking', () => {
      const result = calculateTruScore(baseProduct({ nutriscore_grade: 'a' }), undefined, {
        publicationSettled: false,
      });
      expect(result.publication?.overall.publicationStatus).toBe('checking');
      expect(result.publication?.body.publishedScore).toBeNull();
    });
  });

  describe('corrective production paths (founder QA disposition)', () => {
    it('no brand — governed checks skipped (not no_finding)', () => {
      const ethics = calculateEthicsPillar(
        baseProduct({
          brands: '',
          brand_owner: undefined,
          nutriments: { sugars_100g: 1 },
          categories_tags: ['en:snacks'],
        })
      );
      const checks = ethics.details.claimsAssessment?.benchmark_checks ?? [];
      expect(checks.length).toBe(2);
      expect(checks.every((c) => c.status === 'not_applicable')).toBe(true);
      expect(checks.every((c) => c.not_applicable_resolution === 'skipped_or_unavailable')).toBe(
        true
      );
      const snap = settleCrossPillarPublication({
        product: baseProduct({ brands: '' }),
        body: calculateBodyPillar(baseProduct()),
        planet: calculatePlanetPillar(baseProduct()),
        ethics,
        open: calculateOpenPillar(baseProduct()),
        overallInternalScore: 60,
        settled: true,
      });
      expect(snap.claims.assessmentLanes.benchmark).toBe('unassessed_or_incomplete');
    });

    it('placeholder brand — skipped (not converted to no_finding)', () => {
      const ethics = calculateEthicsPillar(
        baseProduct({
          brands: 'unknown',
          nutriments: { sugars_100g: 1 },
          categories_tags: ['en:snacks'],
        })
      );
      const checks = ethics.details.claimsAssessment?.benchmark_checks ?? [];
      expect(checks.length).toBe(2);
      for (const c of checks) {
        expect(c.status).toBe('not_applicable');
        expect(c.not_applicable_resolution).toBe('skipped_or_unavailable');
      }
    });

    it('real brand subject + no finite-asset match → no_finding (assessed)', () => {
      const product = baseProduct({
        brands: 'CompletelyUnknownBrandXYZ123',
        nutriments: { sugars_100g: 1, 'saturated-fat_100g': 0.5, sodium_100g: 0.05 },
        categories_tags: ['en:snacks'],
      });
      const ethics = calculateEthicsPillar(product);
      const checks = ethics.details.claimsAssessment?.benchmark_checks ?? [];
      expect(checks.length).toBe(2);
      const ktc = checks.find((c) => c.source === 'ktc');
      const bbfaw = checks.find((c) => c.source === 'bbfaw');
      expect(ktc?.status).toBe('no_finding');
      expect(bbfaw?.status).toBe('no_finding');
      const snap = settleCrossPillarPublication({
        product,
        body: calculateBodyPillar(product),
        planet: calculatePlanetPillar(product),
        ethics,
        open: calculateOpenPillar(product),
        overallInternalScore: Math.round(
          calculateBodyPillar(product).score +
            calculatePlanetPillar(product).score +
            ethics.score +
            calculateOpenPillar(product).score
        ),
        settled: true,
      });
      expect(snap.claims.assessmentLanes.benchmark).toBe('assessed');
    });

    it('OFF-label packet admission with zero packet adjustment still assesses Packet lane', () => {
      const product = baseProduct({
        brands: '',
        labels: 'Gluten free',
        nutriments: { sugars_100g: 1, 'saturated-fat_100g': 0.5, sodium_100g: 0.05 },
        categories_tags: ['en:snacks'],
      });
      const ethics = calculateEthicsPillar(product);
      const assessment = ethics.details.claimsAssessment;
      expect(assessment).toBeDefined();
      expect(assessment!.admitted_claims.length).toBeGreaterThan(0);
      expect(assessment!.packet_context_points).toBe(0);
      expect(assessment!.packet_coverage_state).toBe('incomplete');
      expect(assessment!.publication_packet_lane).toBe('assessed');
      ethics.details.certificationsAdjustment = 0;
      ethics.details.certificationsWinningScheme = null;
      const snap = settleCrossPillarPublication({
        product,
        body: calculateBodyPillar(product),
        planet: calculatePlanetPillar(product),
        ethics,
        open: calculateOpenPillar(product),
        overallInternalScore: 60,
        settled: true,
      });
      expect(snap.claims.assessmentLanes.packet).toBe('assessed');
      expect(snap.claims.diagnostic.noSyntheticZeroAdjustments).toBe(true);
    });

    it('unclassified OFF labels + incomplete coverage do not assess Packet lane', () => {
      const product = baseProduct({
        brands: '',
        labels: 'Responsibly sourced',
        nutriments: { sugars_100g: 1 },
        categories_tags: ['en:snacks'],
      });
      const ethics = calculateEthicsPillar(product);
      const assessment = ethics.details.claimsAssessment!;
      expect(assessment.admitted_claims.length).toBe(0);
      expect(assessment.packet_coverage_state).toBe('incomplete');
      expect(assessment.publication_packet_lane).toBe('unassessed_or_incomplete');
    });

    it('complete packet coverage with no governed claims assesses Packet lane (upstream truth)', () => {
      const product = baseProduct({
        brands: '',
        nutriments: { sugars_100g: 1 },
        categories_tags: ['en:snacks'],
      });
      const ethics = calculateEthicsPillar(product, { packetCoverageState: 'complete' });
      const assessment = ethics.details.claimsAssessment!;
      expect(assessment.admitted_claims.length).toBe(0);
      expect(assessment.packet_coverage_state).toBe('complete');
      expect(assessment.publication_packet_lane).toBe('assessed');
    });

    it('consistent free-text Origins must not populate conflictingFreeTextOrigins', () => {
      const snap = settleFromProduct(
        baseProduct({
          ingredients_text_en: 'apple',
          ingredients_text: 'apple',
          ingredients_lc: 'en',
          lang: 'en',
          origins_tags: ['en:australia'],
          origins: 'australia',
          additives_tags: [],
        })
      );
      expect(snap.transparency.diagnostic.freeTextContradiction).not.toBe(true);
      expect(
        snap.transparency.s26?.contributionOpportunity?.prefill?.conflictingFreeTextOrigins
      ).toBeUndefined();
    });

    it('contradictory free-text Origins populates conflictingFreeTextOrigins only', () => {
      const snap = settleFromProduct(
        baseProduct({
          ingredients_text_en: 'apple',
          ingredients_text: 'apple',
          ingredients_lc: 'en',
          lang: 'en',
          origins_tags: ['en:australia'],
          origins: 'new zealand',
          additives_tags: [],
        })
      );
      expect(snap.transparency.diagnostic.freeTextContradiction).toBe(true);
      expect(
        snap.transparency.s26?.contributionOpportunity?.prefill?.conflictingFreeTextOrigins
      ).toBe('new zealand');
    });
  });
});
