/**
 * Wave 3 UAT narrow correction — Confidence/S26 routing helpers, Transparency Origins CTA,
 * and Coles raspberries NOVA 1 production-path gate report.
 */

import { assessNOVAGroup1, assignNOVA1IfHighConfidence } from '../../../../utils/novaAssessment';
import { calculateBodyPillar } from '../../../../lib/truscoreEngine/pillars/bodyPillar';
import { calculateOpenPillar } from '../../../../lib/truscoreEngine/pillars/openPillar';
import { settleCrossPillarPublication } from '../../../../lib/rateability';
import { calculatePlanetPillar } from '../../../../lib/truscoreEngine/pillars/planetPillar';
import { calculateEthicsPillar } from '../../../../lib/truscoreEngine/pillars/ethicsPillar';
import type { Product } from '../../../../types/product';

const S27_PREFIX = '[Awaiting founder edit]';

function settleTransparency(product: Product) {
  const body = calculateBodyPillar(product);
  const planet = calculatePlanetPillar(product);
  const ethics = calculateEthicsPillar(product);
  const open = calculateOpenPillar(product);
  return settleCrossPillarPublication({
    product,
    body,
    planet,
    ethics,
    open,
    overallInternalScore: Math.round(body.score + planet.score + ethics.score + open.score),
    settled: true,
  });
}

describe('Wave 3 UAT narrow correction', () => {
  describe('A — W3-S27 founder-edit prefix', () => {
    it('uses the exact consumer prefix token', () => {
      expect(S27_PREFIX).toBe('[Awaiting founder edit]');
      const titled = `${S27_PREFIX} Understanding Rveel Score`;
      expect(titled.startsWith('[Awaiting founder edit] ')).toBe(true);
    });
  });

  describe('B — Transparency Origins contribution', () => {
    it('exposes live Origins when Origins lane is unassessed even if ingredient clarity is also unassessed', () => {
      const snap = settleTransparency({
        barcode: '9990000000099',
        product_name: 'Gap Product',
        source: 'openfoodfacts',
        // No usable ingredients clarity / no structured origins
        ingredients_text: 'pomme',
        ingredients_lc: 'fr',
        lang: 'fr',
      } as Product);
      expect(snap.transparency.assessmentLanes.origins).toBe('unassessed');
      expect(snap.transparency.s26?.contributionOpportunity?.routeKey).toBe('origins');
      expect(snap.transparency.s26?.contributionOpportunity?.routeStatus).toBe('live');
    });

    it('keeps Origins live when ingredient clarity is resolved and Origins is not', () => {
      const snap = settleTransparency({
        barcode: '9990000000098',
        product_name: 'Origin Gap',
        source: 'openfoodfacts',
        ingredients_text_en: 'apple',
        ingredients_text: 'apple',
        ingredients_lc: 'en',
        lang: 'en',
        additives_tags: [],
      } as Product);
      expect(snap.transparency.assessmentLanes.ingredient_clarity).toBe('resolved');
      expect(snap.transparency.assessmentLanes.origins).toBe('unassessed');
      expect(snap.transparency.s26?.contributionOpportunity?.routeKey).toBe('origins');
    });

    it('deduping ingredients_nutrition must not remove a separate Origins route key', () => {
      const bodyOpp = {
        routeKey: 'ingredients_nutrition' as const,
        routeStatus: 'live' as const,
      };
      const transparencyOpp = {
        routeKey: 'origins' as const,
        routeStatus: 'live' as const,
      };
      const seen = new Set<string>();
      const show = (key: string) => {
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      };
      expect(show(bodyOpp.routeKey)).toBe(true);
      expect(show(transparencyOpp.routeKey)).toBe(true);
      expect(seen.has('origins')).toBe(true);
      expect(seen.has('ingredients_nutrition')).toBe(true);
    });
  });

  describe('C — Coles frozen raspberries 9310645318080 NOVA 1 production path', () => {
    /**
     * Live OFF evidence (world API): Nutri-Score A, empty nova_group, empty ingredients_text,
     * empty additives. Whole Produce must not stack when Nutri-Score is present.
     */
    const colesRaspberriesProductionInput: Product = {
      barcode: '9310645318080',
      product_name: 'Raspberries',
      brands: 'coles',
      source: 'openfoodfacts',
      nutriscore_grade: 'a',
      nova_group: undefined,
      ingredients_text: '',
      additives_tags: [],
      categories_tags: [
        'en:plant-based-foods-and-beverages',
        'en:plant-based-foods',
        'en:frozen-foods',
        'en:fruits',
      ],
    } as Product;

    it('fails the existing NOVA 1 rescue gate: No ingredients text — no methodology expansion', () => {
      const assessment = assessNOVAGroup1(colesRaspberriesProductionInput);
      expect(assessment.likelyNOVA1).toBe(false);
      expect(assessment.reason).toBe('No ingredients text');

      const after = assignNOVA1IfHighConfidence({ ...colesRaspberriesProductionInput });
      expect(after.nova_group).toBeUndefined();
      expect(after.nova1Provenance).toBeUndefined();
    });

    it('Body is Nutri-Score A only (22) — Whole Produce excluded; NOVA +3 absent', () => {
      const body = calculateBodyPillar({ ...colesRaspberriesProductionInput });
      expect(body.details.hasNutriScore).toBe(true);
      expect(body.details.nutriscoreGrade?.toLowerCase()).toBe('a');
      expect(body.details.nutriscoreValue).toBe(22);
      expect(body.details.wholeProduceAdjustmentApplied).toBe(false);
      expect(body.details.novaAdjustment).toBe(0);
      // Base 15 + Nutri A +7 = 22; rescue would add +3 → 25 only if ingredients gate passed
      expect(body.score).toBe(22);
      expect(
        body.adjustments.some((a) => String(a.id).startsWith('body-v12-nova-1'))
      ).toBe(false);
    });
  });
});
