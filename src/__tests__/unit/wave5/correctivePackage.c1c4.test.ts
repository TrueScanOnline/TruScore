/**
 * Wave 5 baseline corrective package. Each describe block is attributable to one approved outcome.
 * C-1 published visuals and share framing. C-2 Highlights scores. C-3 fail closed. C-4 lane prompts.
 */

import { ShareContentBuilder } from '../../../features/sharing/services/ShareContentBuilder';
import { selectContextualContributionPrompts } from '../../../lib/scoreHighlights/contextualContributionPrompts';
import type { TruScoreResult } from '../../../lib/truscoreEngine';
import {
  resolveGenuinePillarBreakdown,
  resolveScoreCardShareType,
  resolveShareOverallScore,
  shareImageScoreState,
  unpublishedShareCopy,
} from '../../../utils/shareScoreSemantics';
import {
  getTruScoreConsumerPresentation,
  publishedHighlightPillarScores,
  publishedOverallVisualScore,
  RVEEL_SCORE_UNAVAILABLE_TITLE,
} from '../../../utils/truScorePresentation';
import type { ProductWithTrustScore } from '../../../types/product';

const product = {
  barcode: '9300000000099',
  product_name: 'Corrective Cereal',
  brands: 'Test',
  nutriments: {},
  trust_score: 12,
} as unknown as ProductWithTrustScore;

function pillar(
  status: 'rated' | 'nr' | 'checking',
  internalScore: number | null,
  publishedScore: number | null
) {
  return {
    publicationStatus: status,
    internalScore,
    publishedScore,
    confidence: status === 'rated' ? ('moderate' as const) : null,
    sourceQuality: 'community_or_user' as const,
    s26: status === 'nr' ? { explanation: 'Not enough governed information to publish this score.' } : null,
    confidenceReasonCode: status,
    assessmentLanes: {},
    diagnostic: {},
  };
}

function result(args: {
  truscore: number | null;
  breakdown?: TruScoreResult['breakdown'];
  publication?: TruScoreResult['publication'];
}): TruScoreResult {
  return {
    truscore: args.truscore,
    breakdown: args.breakdown ?? { Body: 15, Planet: 15, Ethics: 15, Open: 15 },
    scoringUnavailable: args.truscore == null,
    hasNutriScore: false,
    hasEcoScore: false,
    hasOrigin: false,
    publication: args.publication,
  };
}

function snapshot(statuses: {
  overall: 'rated' | 'nr' | 'checking';
  overallPublished: number | null;
  overallInternal: number;
  body?: 'rated' | 'nr' | 'checking';
  bodyPublished?: number | null;
}): NonNullable<TruScoreResult['publication']> {
  const bodyStatus = statuses.body ?? statuses.overall;
  const bodyPublished =
    statuses.bodyPublished !== undefined
      ? statuses.bodyPublished
      : bodyStatus === 'rated'
        ? 18
        : null;
  return {
    settled: statuses.overall !== 'checking',
    body: pillar(bodyStatus, 18, bodyPublished),
    planet: pillar(statuses.overall, 16, statuses.overall === 'rated' ? 16 : null),
    claims: pillar(statuses.overall, 20, statuses.overall === 'rated' ? 20 : null),
    transparency: pillar(statuses.overall, 18, statuses.overall === 'rated' ? 18 : null),
    overall: {
      ...pillar(statuses.overall, statuses.overallInternal, statuses.overallPublished),
      assessmentLanes: {
        body: bodyStatus,
        planet: statuses.overall,
        claims: statuses.overall,
        transparency: statuses.overall,
      },
    },
  } as NonNullable<TruScoreResult['publication']>;
}

describe('C-1 published-state visuals and share framing', () => {
  const nr = result({
    truscore: 22,
    publication: snapshot({ overall: 'nr', overallPublished: null, overallInternal: 22 }),
  });
  const checking = result({
    truscore: 22,
    publication: snapshot({ overall: 'checking', overallPublished: null, overallInternal: 22 }),
  });
  const low = result({
    truscore: 88,
    publication: snapshot({ overall: 'rated', overallPublished: 30, overallInternal: 88 }),
  });

  it('uses a neutral border input for NR and Checking, and the published score when Rated', () => {
    expect(publishedOverallVisualScore(nr)).toBeNull();
    expect(publishedOverallVisualScore(checking)).toBeNull();
    expect(publishedOverallVisualScore(low)).toBe(30);
  });

  it('does not choose a low-score share from an internal number', () => {
    expect(resolveScoreCardShareType(nr)).toBe('truScore');
    expect(resolveScoreCardShareType(checking)).toBe('truScore');
    expect(resolveScoreCardShareType(low)).toBe('negativeTruScore');
  });

  it('keeps NR distinct from technical unavailability on the live share builder', () => {
    const content = ShareContentBuilder.buildContent({
      product: product as never,
      truScore: nr as never,
      item: 'truScore',
    });
    expect(content.message).not.toContain(RVEEL_SCORE_UNAVAILABLE_TITLE);
    expect(content.message).not.toMatch(/22\/100/);
    expect(content.message).toContain('Overall unrevealed');
    expect(unpublishedShareCopy(checking).title).toBe('Seeing what we can find…');
    expect(unpublishedShareCopy(checking).title).not.toBe(RVEEL_SCORE_UNAVAILABLE_TITLE);
  });
});

describe('C-2 Highlights receive published pillar scores', () => {
  it('passes null for NR and Checking pillars and the published number, including zero, when Rated', () => {
    const mixed = result({
      truscore: 40,
      breakdown: { Body: 21, Planet: 19, Ethics: 17, Open: 14 },
      publication: {
        ...snapshot({ overall: 'nr', overallPublished: null, overallInternal: 40, body: 'rated', bodyPublished: 0 }),
        planet: pillar('checking', 19, 19),
        claims: pillar('nr', 17, 17),
        transparency: pillar('rated', 99, 11),
      } as TruScoreResult['publication'],
    });
    expect(publishedHighlightPillarScores(mixed)).toEqual({
      Body: 0,
      Planet: null,
      Ethics: null,
      Open: 11,
    });
  });

  it('passes null for every pillar when publication is missing', () => {
    expect(publishedHighlightPillarScores(result({ truscore: 64 }))).toEqual({
      Body: null,
      Planet: null,
      Ethics: null,
      Open: null,
    });
  });
});

describe('C-3 consumer fallbacks fail closed', () => {
  it('does not present or share an internal score when publication is missing', () => {
    const internal = result({ truscore: 72, breakdown: { Body: 18, Planet: 16, Ethics: 20, Open: 18 } });
    expect(getTruScoreConsumerPresentation(internal).kind).toBe('unavailable');
    expect(resolveShareOverallScore(internal)).toBeNull();
    expect(resolveGenuinePillarBreakdown(internal)).toBeNull();
  });

  it('fails closed on a Rated status with no published number, and keeps a genuine zero', () => {
    const incompatible = result({
      truscore: 40,
      publication: snapshot({ overall: 'rated', overallPublished: null, overallInternal: 40 }),
    });
    expect(getTruScoreConsumerPresentation(incompatible).kind).toBe('unavailable');
    expect(resolveShareOverallScore(incompatible)).toBeNull();

    const zero = result({
      truscore: 55,
      publication: snapshot({ overall: 'rated', overallPublished: 0, overallInternal: 55 }),
    });
    expect(getTruScoreConsumerPresentation(zero).kind).toBe('scored');
    expect(resolveShareOverallScore(zero)).toBe(0);
  });

  it('omits the pillar breakdown when one nested pillar is not Rated', () => {
    const partial = result({
      truscore: 48,
      publication: snapshot({
        overall: 'rated',
        overallPublished: 48,
        overallInternal: 48,
        body: 'nr',
        bodyPublished: null,
      }),
    });
    expect(resolveShareOverallScore(partial)).toBe(48);
    expect(resolveGenuinePillarBreakdown(partial)).toBeNull();
  });
});

describe('C-1 image share keeps NR, Checking, and failure distinct', () => {
  it('does not draw a number or a shared dash for unpublished states', () => {
    const nr = shareImageScoreState(
      result({
        truscore: 22,
        publication: snapshot({ overall: 'nr', overallPublished: null, overallInternal: 22 }),
      })
    );
    const checking = shareImageScoreState(
      result({
        truscore: 22,
        publication: snapshot({ overall: 'checking', overallPublished: null, overallInternal: 22 }),
      })
    );
    const missing = shareImageScoreState(result({ truscore: 22 }));
    const rated = shareImageScoreState(
      result({
        truscore: 90,
        publication: snapshot({ overall: 'rated', overallPublished: 0, overallInternal: 90 }),
      })
    );

    expect(nr).toMatchObject({ kind: 'nr', valueText: null, caption: 'Overall unrevealed', neutral: true });
    expect(checking).toMatchObject({
      kind: 'checking',
      valueText: null,
      caption: 'Seeing what we can find…',
      neutral: true,
    });
    expect(missing).toMatchObject({
      kind: 'unavailable',
      valueText: null,
      caption: RVEEL_SCORE_UNAVAILABLE_TITLE,
      neutral: true,
    });
    expect(nr.caption).not.toBe(checking.caption);
    expect(nr.caption).not.toBe(missing.caption);
    expect(rated).toMatchObject({ kind: 'rated', valueText: '0/100', neutral: false });
  });
});

describe('C-3 incomplete publication fails closed', () => {
  it('does not publish a score when settled is missing or a Rated value is absent', () => {
    const unsettledShape = result({
      truscore: 64,
      publication: {
        ...snapshot({ overall: 'rated', overallPublished: 64, overallInternal: 64 }),
        settled: undefined,
      } as TruScoreResult['publication'],
    });
    const ratedWithoutValue = result({
      truscore: 64,
      publication: snapshot({ overall: 'rated', overallPublished: null, overallInternal: 64 }),
    });
    const nrWithStrayNumber = result({
      truscore: 64,
      publication: {
        ...snapshot({ overall: 'nr', overallPublished: null, overallInternal: 64 }),
        overall: {
          ...snapshot({ overall: 'nr', overallPublished: null, overallInternal: 64 }).overall,
          publishedScore: 64,
        },
      } as TruScoreResult['publication'],
    });

    expect(getTruScoreConsumerPresentation(unsettledShape).kind).toBe('unavailable');
    expect(resolveShareOverallScore(unsettledShape)).toBeNull();
    expect(shareImageScoreState(unsettledShape).valueText).toBeNull();
    expect(resolveShareOverallScore(ratedWithoutValue)).toBeNull();
    expect(resolveShareOverallScore(nrWithStrayNumber)).toBeNull();
    expect(shareImageScoreState(nrWithStrayNumber).kind).toBe('nr');
    expect(publishedHighlightPillarScores(unsettledShape).Body).toBeNull();
  });

  it('ignores a missing pillar entry instead of its internal score', () => {
    const partial = result({
      truscore: 48,
      breakdown: { Body: 21, Planet: 16, Ethics: 20, Open: 18 },
      publication: {
        settled: true,
        planet: snapshot({ overall: 'rated', overallPublished: 48, overallInternal: 48 }).planet,
        claims: snapshot({ overall: 'rated', overallPublished: 48, overallInternal: 48 }).claims,
        transparency: snapshot({ overall: 'rated', overallPublished: 48, overallInternal: 48 })
          .transparency,
        overall: snapshot({ overall: 'rated', overallPublished: 48, overallInternal: 48 }).overall,
      } as TruScoreResult['publication'],
    });
    expect(publishedHighlightPillarScores(partial).Body).toBeNull();
    expect(resolveGenuinePillarBreakdown(partial)).toBeNull();
    expect(resolveShareOverallScore(partial)).toBe(48);
  });
});

describe('C-4 contextual prompts follow lanes', () => {
  const ledger = [
    { pillar: 'Body' as const, id: 'body-v12-base', value: 0, highlightEligible: false },
    { pillar: 'Planet' as const, id: 'planet-v19-base', value: 0, highlightEligible: false },
    { pillar: 'Ethics' as const, id: 'ethics-v37-base', value: 0, highlightEligible: false },
    { pillar: 'Open' as const, id: 'open-v15-origins-insufficient', value: -3, highlightEligible: true },
  ];

  it('returns no prompt from the ledger alone, even if the route flag is set', () => {
    expect(selectContextualContributionPrompts('Body', ledger)).toEqual([]);
    expect(selectContextualContributionPrompts('Planet', ledger)).toEqual([]);
    expect(
      selectContextualContributionPrompts('Open', ledger, { userContributionRouteLive: true })
    ).toEqual([]);
  });

  it('a governed processing-only Body gap does not reuse the no-finding or nutrition sentence', () => {
    const processingOnly = selectContextualContributionPrompts(
      'Body',
      [
        { pillar: 'Body', id: 'body-v12-base', value: 0, highlightEligible: false },
        { pillar: 'Body', id: 'body-v12-nutri-a', value: 4, highlightEligible: true },
      ],
      {
        governance: {
          material: true,
          routeStatus: 'live',
          lanes: { nutrition: 'resolved', processing: 'unassessed' },
        },
      }
    );
    expect(processingOnly).toEqual([]);
    const bothMissing = selectContextualContributionPrompts('Body', [], {
      governance: {
        material: true,
        routeStatus: 'live',
        lanes: { nutrition: 'unassessed', processing: 'unassessed' },
      },
    });
    expect(bothMissing.map((prompt) => prompt.l1)).toEqual(['We need more information for Body']);
  });

  it('explains a live unresolved lane and stays silent when that lane is resolved', () => {
    const unresolved = selectContextualContributionPrompts('Ethics', ledger, {
      governance: { material: true, routeStatus: 'live', lanes: { packet: 'unassessed_or_incomplete' } },
    });
    expect(unresolved.map((prompt) => prompt.kind)).toEqual(['base']);
    expect(unresolved[0].action).toBeUndefined();

    expect(
      selectContextualContributionPrompts('Ethics', ledger, {
        governance: { material: true, routeStatus: 'live', lanes: { packet: 'assessed' } },
      })
    ).toEqual([]);
    expect(
      selectContextualContributionPrompts('Planet', ledger, {
        governance: { material: true, routeStatus: 'live' },
      })
    ).toEqual([]);
  });
});
