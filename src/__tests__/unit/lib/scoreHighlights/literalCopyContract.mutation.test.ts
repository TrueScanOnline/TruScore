/**
 * Mutation demonstration for the independent literal copy contract (TECH-020).
 *
 * Purpose: prove that the contract suite in `pipelineResolvedCopy.closedSet.test.ts` can actually
 * fail. A copy-fidelity oracle is worthless unless a deliberate change to governed runtime copy
 * makes it go red, and the oracle this replaced could not: it built its expectations from
 * `resolveGovernedCopy()`, so mutating the registry moved expectation and actual together.
 *
 * Each mutation is applied inside `jest.isolateModules`, so the mutated registry lives only in
 * that isolated module graph, and is restored in a `finally` block regardless.
 */

import {
  LITERAL_COPY_CONTRACT,
  normaliseGovernedTypography,
} from '../../../fixtures/scoreHighlights/literalCopyContract.v05';
import { selectScoreHighlights } from '../../../../lib/scoreHighlights/selectScoreHighlights';
import type { FiredAdjustment, ScoreHighlightPillar } from '../../../../lib/scoreHighlights/types';

type Metadata = Record<string, string | number | boolean>;

interface MutableRegistryRow {
  highlightTitle?: string;
  highlightExplainer?: string;
}

interface IsolatedPipeline {
  selectScoreHighlights: (fired: readonly FiredAdjustment[]) => {
    byPillar: Record<ScoreHighlightPillar, Array<{ l1: string; l2: string }>>;
  };
  resolveGovernedCopy: (
    pillar: ScoreHighlightPillar,
    adjustmentId: string,
    metadata: Metadata | undefined
  ) => { l1: string; l2: string } | null;
}

/** The contract entry under test: Planet grade A, a plain locked literal with no tokens. */
const SUBJECT_KEY = 'Planet:planet-v19-environmental-a';
const SUBJECT = LITERAL_COPY_CONTRACT.find((entry) => entry.contractKey === SUBJECT_KEY)!;

function firedRows(): FiredAdjustment[] {
  return SUBJECT.fired.map((row) => ({
    pillar: SUBJECT.pillar,
    id: row.id,
    value: row.value,
    highlightEligible: true,
    ...(row.metadata && { metadata: row.metadata as Metadata }),
  }));
}

/**
 * Run `body` against a freshly loaded Score Highlights module graph in which one governed registry
 * field has been overwritten. The mutation cannot leak: the isolated graph is discarded, and the
 * original value is written back before returning.
 */
function withMutatedGovernedCopy(
  mutate: (row: MutableRegistryRow) => void,
  body: (pipeline: IsolatedPipeline) => void
): void {
  jest.isolateModules(() => {
    /* eslint-disable @typescript-eslint/no-var-requires */
    const registryModule = require('../../../../lib/truscoreEngine/pillars/planetPillarV19Registry');
    const row: MutableRegistryRow =
      registryModule.PLANET_V19_ADJUSTMENT_REGISTRY['planet-v19-environmental-a'];
    const originalTitle = row.highlightTitle;
    const originalExplainer = row.highlightExplainer;

    mutate(row);

    try {
      body({
        selectScoreHighlights:
          require('../../../../lib/scoreHighlights/selectScoreHighlights').selectScoreHighlights,
        resolveGovernedCopy:
          require('../../../../lib/scoreHighlights/governedCommentary').resolveGovernedCopy,
      });
    } finally {
      row.highlightTitle = originalTitle;
      row.highlightExplainer = originalExplainer;
    }
    /* eslint-enable @typescript-eslint/no-var-requires */
  });
}

describe('literal copy contract mutation demonstration', () => {
  it('a mutated governed L1 fails against the hand-authored contract', () => {
    // Clone the founder-locked expectation, then force the runtime to disagree with it.
    const expectedL1 = SUBJECT.l1;
    const mutatedL1 = `${expectedL1} (mutated)`;

    withMutatedGovernedCopy(
      (row) => {
        row.highlightTitle = mutatedL1;
      },
      ({ selectScoreHighlights: select, resolveGovernedCopy }) => {
        const story = select(firedRows()).byPillar.Planet[0];

        // 1. The contract assertion the closed-set suite makes would fail.
        expect(story.l1).toBe(mutatedL1);
        expect(normaliseGovernedTypography(story.l1)).not.toBe(
          normaliseGovernedTypography(expectedL1)
        );
        expect(() =>
          expect(normaliseGovernedTypography(story.l1)).toBe(
            normaliseGovernedTypography(expectedL1)
          )
        ).toThrow();

        // 2. The implementation-derived oracle this replaced would still have passed, because
        //    both sides of that comparison come from the same mutated runtime.
        const implementationOracle = resolveGovernedCopy('Planet', 'planet-v19-environmental-a', undefined);
        expect(implementationOracle?.l1).toBe(story.l1);
      }
    );
  });

  it('a mutated governed L2 fails against the hand-authored contract', () => {
    const expectedL2 = SUBJECT.l2;
    const mutatedL2 = expectedL2.replace('lowest-eco-impact', 'highest-eco-impact');
    expect(mutatedL2).not.toBe(expectedL2);

    withMutatedGovernedCopy(
      (row) => {
        row.highlightExplainer = mutatedL2;
      },
      ({ selectScoreHighlights: select, resolveGovernedCopy }) => {
        const story = select(firedRows()).byPillar.Planet[0];

        expect(story.l2).toBe(mutatedL2);
        expect(() =>
          expect(normaliseGovernedTypography(story.l2)).toBe(
            normaliseGovernedTypography(expectedL2)
          )
        ).toThrow();

        const implementationOracle = resolveGovernedCopy('Planet', 'planet-v19-environmental-a', undefined);
        expect(implementationOracle?.l2).toBe(story.l2);
      }
    );
  });

  it('the un-mutated pipeline still matches the contract, so no mutation leaked', () => {
    const story = selectScoreHighlights(firedRows()).byPillar.Planet[0];
    expect(normaliseGovernedTypography(story.l1)).toBe(normaliseGovernedTypography(SUBJECT.l1));
    expect(normaliseGovernedTypography(story.l2)).toBe(normaliseGovernedTypography(SUBJECT.l2));
  });
});
