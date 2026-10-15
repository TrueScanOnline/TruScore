/**
 * Doctrine §10.2 compact governed-outcome oracle.
 *
 * For each deterministic fixture, record a canonical G slice and assert it.
 * Approved C-1–C-4 differences are named in the corrective section; they are
 * not silent baseline regenerations. Unintended publication or share leaks fail.
 */

import type { Product } from '../../../types/product';
import { calculateTruScore } from '../../../lib/truscoreEngine';
import { resultContributionActions } from '../../../contribution/resultContributionActions';
import {
  publishedHighlightPillarScores,
  publishedOverallVisualScore,
} from '../../../utils/truScorePresentation';
import {
  resolveGenuinePillarBreakdown,
  resolveShareOverallScore,
  shareImageScoreState,
} from '../../../utils/shareScoreSemantics';

function product(overrides: Partial<Product> = {}): Product {
  return {
    barcode: '9990000000000',
    product_name: 'Oracle Fixture',
    source: 'openfoodfacts',
    ...overrides,
  } as Product;
}

type CompactG = {
  overallStatus: string | undefined;
  overallPublished: number | null | undefined;
  bodyStatus: string | undefined;
  bodyPublished: number | null | undefined;
  planetStatus: string | undefined;
  claimsStatus: string | undefined;
  transparencyStatus: string | undefined;
  settled: boolean | undefined;
  visualOverall: number | null;
  shareOverall: number | null;
  highlightBody: number | null;
  highlightPlanet: number | null;
  imageKind: string;
  imageNeutral: boolean;
  addNutrition: boolean;
  addIngredients: boolean;
};

function compactG(
  overrides: Partial<Product>,
  opts?: { publicationSettled?: boolean }
): CompactG {
  const scored = calculateTruScore(product(overrides), undefined, {
    publicationSettled: opts?.publicationSettled !== false,
  });
  const pub = scored.publication;
  const gate = { publicationSettled: opts?.publicationSettled !== false };
  const highlights = publishedHighlightPillarScores(scored, gate);
  const image = shareImageScoreState(scored, gate);
  const withPublication = {
    ...product(overrides),
    trust_score: scored.truscore,
    trust_score_breakdown: null,
    _publication: pub,
  };
  const actions = resultContributionActions(withPublication);
  return {
    overallStatus: pub?.overall.publicationStatus,
    overallPublished: pub?.overall.publishedScore ?? null,
    bodyStatus: pub?.body.publicationStatus,
    bodyPublished: pub?.body.publishedScore ?? null,
    planetStatus: pub?.planet.publicationStatus,
    claimsStatus: pub?.claims.publicationStatus,
    transparencyStatus: pub?.transparency.publicationStatus,
    settled: pub?.settled,
    visualOverall: publishedOverallVisualScore(scored),
    shareOverall: resolveShareOverallScore(scored, gate),
    highlightBody: highlights.Body,
    highlightPlanet: highlights.Planet,
    imageKind: image.kind,
    imageNeutral: image.neutral,
    addNutrition: actions.addNutrition,
    addIngredients: actions.addIngredients,
  };
}

describe('doctrine §10.2 governed-outcome oracle', () => {
  describe('B0-invariant publication shapes (not C-1–C-4 presentation)', () => {
    it('G-01 checking: no published numbers and no contribution invitations', () => {
      const g = compactG({ nutriscore_grade: 'a', nova_group: 1 }, { publicationSettled: false });
      expect(g.settled).toBe(false);
      expect(g.overallStatus).toBe('checking');
      expect(g.bodyPublished).toBeNull();
      expect(g.overallPublished).toBeNull();
      expect(g.addNutrition).toBe(false);
      expect(g.addIngredients).toBe(false);
    });

    it('Body NR without nutrition or processing keeps Body unpublished', () => {
      const g = compactG({});
      expect(g.bodyStatus).toBe('nr');
      expect(g.bodyPublished).toBeNull();
    });

    it('Body rates when Nutri-Score and NOVA lanes are present', () => {
      const g = compactG({ nutriscore_grade: 'a', nova_group: 2 });
      expect(g.bodyStatus).toBe('rated');
      expect(typeof g.bodyPublished).toBe('number');
    });

    it('any pillar NR keeps Overall unpublished', () => {
      const g = compactG({ nutriscore_grade: 'a', nova_group: 2 });
      if (g.planetStatus === 'nr' || g.claimsStatus === 'nr' || g.transparencyStatus === 'nr') {
        expect(g.overallStatus).toBe('nr');
        expect(g.overallPublished).toBeNull();
      } else {
        expect(g.overallStatus).toBe('rated');
        expect(typeof g.overallPublished).toBe('number');
      }
    });
  });

  describe('approved C-1–C-4 consumer outcomes (intentional deltas from pre-corrective leaks)', () => {
    it('C-1 / C-3: Checking never paints or shares an overall number', () => {
      const g = compactG({ nutriscore_grade: 'b', nova_group: 3 }, { publicationSettled: false });
      expect(g.visualOverall).toBeNull();
      expect(g.shareOverall).toBeNull();
      expect(g.imageKind).toBe('checking');
      expect(g.imageNeutral).toBe(true);
    });

    it('C-1 / C-3: Overall NR never paints or shares an internal sum', () => {
      const g = compactG({});
      expect(g.overallStatus).toBe('nr');
      expect(g.visualOverall).toBeNull();
      expect(g.shareOverall).toBeNull();
      expect(g.imageKind).toBe('nr');
      expect(g.imageNeutral).toBe(true);
      expect(resolveGenuinePillarBreakdown(calculateTruScore(product({})))).toBeNull();
    });

    it('C-2: Highlights receive published pillar scores only, including genuine zero when Rated', () => {
      const ratedBody = compactG({ nutriscore_grade: 'e', nova_group: 4 });
      if (ratedBody.bodyStatus === 'rated') {
        expect(ratedBody.highlightBody).toBe(ratedBody.bodyPublished);
      }
      const checking = compactG({ nutriscore_grade: 'a', nova_group: 1 }, { publicationSettled: false });
      expect(checking.highlightBody).toBeNull();
      expect(checking.highlightPlanet).toBeNull();
    });

    it('C-4: contribution invitations stay false until publication is settled', () => {
      const unsettled = compactG({ nutriscore_grade: 'a', nova_group: 1 }, { publicationSettled: false });
      expect(unsettled.addNutrition).toBe(false);
      expect(unsettled.addIngredients).toBe(false);
    });
  });
});
