/**
 * A3: the UnRevealed explanation names the NR pillars from the publication snapshot.
 * It does not invent a contribution invitation or read an internal score.
 */

import { ShareContentBuilder } from '../../../features/sharing/services/ShareContentBuilder';
import type { TruScoreResult } from '../../../lib/truscoreEngine';
import type { ProductWithTrustScore } from '../../../types/product';
import { generateShareMessage } from '../../../services/shareCardGenerator';
import { highlightContributionOffer } from '../../../lib/scoreHighlights/highlightContributionLinks';
import {
  getTruScoreConsumerPresentation,
  publishedHighlightPillarScores,
  RVEEL_SCORE_UNAVAILABLE_EXPLANATION,
  RVEEL_SCORE_UNAVAILABLE_TITLE,
} from '../../../utils/truScorePresentation';
import { unpublishedShareCopy } from '../../../utils/shareScoreSemantics';

const OLD_UNIVERSAL_EXPLANATION =
  'We could not find enough information in each category to Rveel a score. Please help us out by adding the information in each category by tapping on the category cards above.';

type PillarStatus = 'rated' | 'nr' | 'checking';

function pillar(status: PillarStatus, publishedScore: number | null, confidence: 'high' | 'moderate' | 'limited' | null = null) {
  return {
    publicationStatus: status,
    internalScore: 22,
    publishedScore,
    confidence: status === 'rated' ? confidence ?? 'moderate' : null,
    sourceQuality: 'community_or_user' as const,
    s26:
      status === 'nr'
        ? {
            explanation: 'Not enough governed information to publish this score.',
            contributionOpportunity: { material: true, domain: 'ingredients_nutrition', routeStatus: 'none' as const },
          }
        : null,
    confidenceReasonCode: status,
    assessmentLanes: {},
    diagnostic: {},
  };
}

function nrResult(statuses: {
  body?: PillarStatus;
  planet?: PillarStatus;
  claims?: PillarStatus;
  transparency?: PillarStatus;
  overall?: 'nr' | 'checking' | 'rated';
  overallScore?: number | null;
  settled?: boolean;
  omitPublication?: boolean;
  omitPillar?: 'body' | 'planet' | 'claims' | 'transparency';
  bodyScore?: number | null;
  bodyConfidence?: 'high' | 'moderate' | 'limited' | null;
  overallConfidence?: 'high' | 'moderate' | 'limited' | null;
}): TruScoreResult {
  const overall = statuses.overall ?? 'nr';
  const body = pillar(statuses.body ?? 'rated', statuses.bodyScore === undefined ? 12 : statuses.bodyScore, statuses.bodyConfidence);
  const planet = pillar(statuses.planet ?? 'rated', statuses.planet === 'nr' ? null : 16);
  const claims = pillar(statuses.claims ?? 'rated', statuses.claims === 'nr' ? null : 18);
  const transparency = pillar(statuses.transparency ?? 'rated', statuses.transparency === 'nr' ? null : 14);
  const publication = {
    settled: statuses.settled !== false && overall !== 'checking',
    body,
    planet,
    claims,
    transparency,
    overall: {
      ...pillar(
        overall,
        statuses.overallScore === undefined ? (overall === 'rated' ? 60 : null) : statuses.overallScore,
        statuses.overallConfidence
      ),
      assessmentLanes: {
        body: statuses.body ?? 'rated',
        planet: statuses.planet ?? 'rated',
        claims: statuses.claims ?? 'rated',
        transparency: statuses.transparency ?? 'rated',
      },
    },
  };
  if (statuses.omitPillar) {
    delete (publication as { body?: unknown; planet?: unknown; claims?: unknown; transparency?: unknown })[statuses.omitPillar];
  }
  return {
    truscore: 61,
    breakdown: { Body: 22, Planet: 22, Ethics: 22, Open: 22 },
    scoringUnavailable: false,
    hasNutriScore: false,
    hasEcoScore: false,
    hasOrigin: false,
    publication: statuses.omitPublication ? undefined : (publication as TruScoreResult['publication']),
  };
}

function explanation(result: TruScoreResult): string {
  const presentation = getTruScoreConsumerPresentation(result);
  if (presentation.kind !== 'nr') {
    throw new Error(`expected NR, received ${presentation.kind}`);
  }
  return presentation.explanation;
}

const product = {
  barcode: '9300000000104',
  product_name: 'UnRevealed Cereal',
  brands: 'Test',
  nutriments: {},
  trust_score: 61,
} as unknown as ProductWithTrustScore;

describe('dynamic UnRevealed explanation', () => {
  it('names only Planet when the other three pillars are Rated', () => {
    const text = explanation(nrResult({ planet: 'nr' }));
    expect(text).toBe(
      "To reveal the overall Rveel Score, all four cards need a rating. Planet isn't rated yet. Tap on any of the cards to add more information."
    );
    expect(text).not.toContain(OLD_UNIVERSAL_EXPLANATION);
    expect(text).not.toMatch(/each category|add the information|Ethics|Open/i);
  });

  it('names Body and Claims when those two are NR', () => {
    expect(explanation(nrResult({ body: 'nr', claims: 'nr' }))).toBe(
      "To reveal the overall Rveel Score, all four cards need a rating. Body and Claims aren't rated yet. Tap on any of the cards to add more information."
    );
  });

  it('names Body, Planet and Transparency when those three are NR', () => {
    expect(explanation(nrResult({ body: 'nr', planet: 'nr', transparency: 'nr' }))).toBe(
      "To reveal the overall Rveel Score, all four cards need a rating. Body, Planet and Transparency aren't rated yet. Tap on any of the cards to add more information."
    );
  });

  it('names all four pillars when every pillar is NR', () => {
    expect(
      explanation(nrResult({ body: 'nr', planet: 'nr', claims: 'nr', transparency: 'nr' }))
    ).toBe(
      "To reveal the overall Rveel Score, all four cards need a rating. Body, Planet, Claims and Transparency aren't rated yet. Tap on any of the cards to add more information."
    );
  });

  it('uses the neutral fallback when Overall is NR but no NR pillar can be identified', () => {
    const allRated = explanation(nrResult({ body: 'rated', planet: 'rated', claims: 'rated', transparency: 'rated' }));
    const missingPlanet = explanation(nrResult({ body: 'nr', omitPillar: 'planet' }));
    const checkingPlanet = explanation(nrResult({ planet: 'checking', body: 'nr' }));
    for (const text of [allRated, missingPlanet, checkingPlanet]) {
      expect(text).toBe("The overall Rveel Score isn't ready to reveal yet.");
      expect(text).not.toMatch(/isn't rated yet|aren't rated yet|each category|add /i);
    }
  });

  it('keeps Checking, missing publication, and technical unavailability distinct from NR', () => {
    const checking = getTruScoreConsumerPresentation(
      nrResult({ overall: 'checking', body: 'checking', planet: 'checking', claims: 'checking', transparency: 'checking' })
    );
    expect(checking).toMatchObject({
      kind: 'checking',
      title: 'Seeing what we can find…',
      explanation: 'Assessment still settling.',
      showNumericScore: false,
      overallDisplay: '—',
    });

    const missing = getTruScoreConsumerPresentation(nrResult({ omitPublication: true }));
    expect(missing).toMatchObject({
      kind: 'unavailable',
      title: RVEEL_SCORE_UNAVAILABLE_TITLE,
      explanation: RVEEL_SCORE_UNAVAILABLE_EXPLANATION,
      showNumericScore: false,
    });

    const ratedWithoutNumber = getTruScoreConsumerPresentation(
      nrResult({ overall: 'rated', overallScore: null })
    );
    expect(ratedWithoutNumber).toMatchObject({
      kind: 'unavailable',
      title: RVEEL_SCORE_UNAVAILABLE_TITLE,
      explanation: RVEEL_SCORE_UNAVAILABLE_EXPLANATION,
    });
    expect(JSON.stringify(ratedWithoutNumber)).not.toContain('UnRevealed?');
    expect(JSON.stringify(checking)).not.toContain(RVEEL_SCORE_UNAVAILABLE_TITLE);
  });

  it('keeps a genuine published zero and does not explain a Rated score as NR', () => {
    const zero = getTruScoreConsumerPresentation(
      nrResult({
        overall: 'rated',
        overallScore: 0,
        bodyScore: 0,
        bodyConfidence: 'limited',
        overallConfidence: 'limited',
      })
    );
    expect(zero).toMatchObject({ kind: 'scored', score: 0, showNumericScore: true });
    expect(JSON.stringify(zero)).not.toContain('UnRevealed');

    const pillars = publishedHighlightPillarScores(nrResult({ planet: 'nr', bodyScore: 0 }));
    expect(pillars).toEqual({ Body: 0, Planet: null, Ethics: 18, Open: 14 });
  });

  it('keeps NR card naming and the approved UnRevealed CTA', () => {
    const text = explanation(nrResult({ body: 'nr' }));
    expect(text).toContain("Body isn't rated yet.");
    expect(text).toContain('Tap on any of the cards to add more information.');
    expect(text).not.toMatch(/each category|Any available pillar scores are shown above/i);
  });

  it('shares the NR explanation without a number', () => {
    const result = nrResult({ planet: 'nr' });
    const copy = unpublishedShareCopy(result);
    expect(copy.title).toBe('UnRevealed?');
    expect(copy.explanation).toContain("Planet isn't rated yet.");
    expect(copy.explanation).not.toMatch(/\d/);

    const content = ShareContentBuilder.buildContent({
      product: product as never,
      truScore: result as never,
      item: 'truScore',
    });
    expect(content.message).toContain(copy.explanation);
    expect(content.message).not.toMatch(/61\/100|22\/25|22\/100/);
    expect(generateShareMessage(product, result)).toContain("Planet isn't rated yet.");
    expect(generateShareMessage(product, result)).not.toMatch(/61\/100/);
  });

  it('leaves an existing assessment-driven Add unchanged', () => {
    const offered = highlightContributionOffer(
      {
        _publication: {
          settled: true,
          body: {
            publicationStatus: 'nr',
            publishedScore: null,
            assessmentLanes: { nutrition: 'unassessed', processing: 'unassessed' },
            s26: {
              contributionOpportunity: {
                material: true,
                domain: 'ingredients_nutrition',
                routeStatus: 'live',
                routeKey: 'ingredients_nutrition',
              },
            },
          },
          planet: { publicationStatus: 'rated', publishedScore: 12, assessmentLanes: {} },
          claims: {
            publicationStatus: 'rated',
            publishedScore: 12,
            assessmentLanes: { packet: 'assessed', benchmark: 'assessed' },
          },
          transparency: {
            publicationStatus: 'rated',
            publishedScore: 12,
            assessmentLanes: { ingredient_clarity: 'resolved', origins: 'resolved' },
          },
          overall: { publicationStatus: 'nr', publishedScore: null },
        },
      } as never,
      'Body',
      { publicationSettled: true }
    );
    expect(offered.links.map((link) => link.label)).toEqual(['Add nutrition']);
  });
});
