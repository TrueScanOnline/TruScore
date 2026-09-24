/**
 * Frozen ineligibility → Rateability not_applicable_resolution mapping.
 */
import type { FrozenBenchmarkAttributionObject } from '../../../../benchmark/types';
import {
  classifyFrozenBenchmarkIneligibility,
  frozenIneligibleNotApplicableResolution,
} from '../../../../lib/truscoreEngine/pillars/frozenBenchmarkRateability';
import { isBenchmarkCheckSuccessfullyAssessed } from '../../../../lib/rateability';

function frozen(
  overrides: Partial<{
    freeze_status: FrozenBenchmarkAttributionObject['freeze']['freeze_status'];
    review_state: FrozenBenchmarkAttributionObject['state']['review_state'];
    resolution_status: FrozenBenchmarkAttributionObject['state']['resolution_status'];
    confidence_state: FrozenBenchmarkAttributionObject['state']['confidence_state'];
    blocker_flags: string[];
    ethics_scoring_eligible: boolean;
  }>
): FrozenBenchmarkAttributionObject {
  return {
    snapshot_ref: {
      benchmark_name: 'BBFAW',
      benchmark_cycle: '2024',
      snapshot_version: 't',
      ownership_cutoff_date: '2024-01-01',
    },
    subject_resolution: {
      canonical_brand_id: 'b',
      benchmark_owner_entity_id: 'o',
      benchmark_owner_legal_name: 'Co',
    },
    comparison_context: { ownership_divergence_flag: false },
    state: {
      confidence_state: overrides.confidence_state ?? 'strong',
      review_state: overrides.review_state ?? 'reviewed',
      resolution_status: overrides.resolution_status ?? 'resolved',
    },
    eligibility: {
      ethics_scoring_eligible: overrides.ethics_scoring_eligible ?? false,
      blocker_flags: overrides.blocker_flags ?? [],
    },
    freeze: {
      freeze_status: overrides.freeze_status ?? 'frozen',
      lineage_reference: 't',
    },
  };
}

describe('frozenBenchmarkRateability mapping', () => {
  const cases: Array<{
    name: string;
    input: ReturnType<typeof frozen> | null;
    cause: string;
  }> = [
    { name: 'null frozen', input: null, cause: 'no_frozen_object' },
    {
      name: 'draft freeze',
      input: frozen({ freeze_status: 'draft', ethics_scoring_eligible: false }),
      cause: 'freeze_not_frozen',
    },
    {
      name: 'provisional review',
      input: frozen({ review_state: 'provisional', ethics_scoring_eligible: false }),
      cause: 'review_not_reviewed',
    },
    {
      name: 'ambiguous resolution',
      input: frozen({ resolution_status: 'ambiguous', ethics_scoring_eligible: false }),
      cause: 'resolution_ambiguous',
    },
    {
      name: 'blocked resolution',
      input: frozen({ resolution_status: 'blocked', ethics_scoring_eligible: false }),
      cause: 'resolution_blocked',
    },
    {
      name: 'needs_review resolution',
      input: frozen({ resolution_status: 'needs_review', ethics_scoring_eligible: false }),
      cause: 'resolution_needs_review',
    },
    {
      name: 'blocker flags',
      input: frozen({
        blocker_flags: ['pending_correction'],
        ethics_scoring_eligible: false,
        resolution_status: 'resolved',
        review_state: 'reviewed',
      }),
      cause: 'blocker_flags_present',
    },
  ];

  for (const c of cases) {
    it(`${c.name} → skipped_or_unavailable (not assessed)`, () => {
      if (c.input) {
        expect(classifyFrozenBenchmarkIneligibility(c.input)).toBe(c.cause);
      } else {
        expect(classifyFrozenBenchmarkIneligibility(c.input)).toBe('no_frozen_object');
      }
      const resolution = frozenIneligibleNotApplicableResolution(c.input);
      expect(resolution).toBe('skipped_or_unavailable');
      expect(
        isBenchmarkCheckSuccessfullyAssessed({
          source: 'ktc',
          status: 'not_applicable',
          not_applicable_resolution: resolution,
        })
      ).toBe(false);
    });
  }

  it('ethics_scoring_eligible alone never yields completed_no_applicable_result', () => {
    const ineligible = frozen({ ethics_scoring_eligible: false, resolution_status: 'needs_review' });
    expect(frozenIneligibleNotApplicableResolution(ineligible)).not.toBe(
      'completed_no_applicable_result'
    );
  });
});
