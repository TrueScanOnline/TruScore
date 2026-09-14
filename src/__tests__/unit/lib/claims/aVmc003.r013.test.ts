/**
 * A-VMC-003 / R-013 — deterministic_member_count combination observation tests.
 * Closed Target Vocabulary only — no invented recognition behaviour.
 */

import {
  getRegisterMatchTypes,
  listDistinctVitaminMineralTargets,
  matchAdmittedObservations,
} from '../../../../lib/truscoreEngine/claims/matchRegister';
import { assessClaimsPacketAndOrganic } from '../../../../lib/truscoreEngine/claims/assessClaims';
import type { AdmittedPacketObservation, ClaimsNutrientContext } from '../../../../lib/truscoreEngine/claims/types';

function obs(text: string, id = 'e1'): AdmittedPacketObservation {
  return {
    evidence_id: id,
    observed_text: text,
    display_text: text,
    admission_method: 'user_confirmation',
    source_locator: 'uat',
  };
}

function nutrientComplete(): ClaimsNutrientContext {
  return {
    standard_version: 'uk-gov-fop-mtl-rveel-reviewed-2026-09-12',
    nutrient_methodology_version: '20260912_v0_1',
    nutrient_reference_asset_id: 'uk-gov-fop-mtl-rveel-reviewed-2026-09-12',
    basis: 'food',
    large_portion_override: false,
    nutrients: {
      total_sugars: { level: 'low', high_reason: null },
      saturated_fat: { level: 'low', high_reason: null },
      sodium: { level: 'low', high_reason: null },
    },
    required_context_complete: true,
    any_governed_high: false,
    high_nutrient_labels: [],
  };
}

describe('Machine Register match_types + A-VMC-003 / R-013', () => {
  test('register exposes all governed match_type values', () => {
    expect(getRegisterMatchTypes()).toEqual([
      'deterministic_member_count',
      'regex',
      'regex_exact',
    ]);
  });

  test('positive: two distinct members → one A-VMC-003 combination observation', () => {
    const match = matchAdmittedObservations([obs('Source of vitamin C and calcium')]);
    expect(match.matched).toHaveLength(1);
    expect(match.matched[0].register_row_id).toBe('A-VMC-003');
    expect(match.matched[0].canonical_family).toBe('vitamin_mineral_combination');
    expect(match.matched[0].member_targets).toEqual(['calcium', 'vitamin_c']);
    expect(match.diagnostics.some((d) => d.code === 'r013_combination_observation')).toBe(true);
  });

  test('positive: alias collision collapses to one canonical member (no false combination)', () => {
    // thiamin and vitamin b1 are the same Target Vocabulary member
    const members = listDistinctVitaminMineralTargets('contains thiamin and vitamin b1');
    expect(members).toEqual(['vitamin_b1']);
    const match = matchAdmittedObservations([obs('Contains thiamin and vitamin b1')]);
    expect(match.matched.every((m) => m.register_row_id !== 'A-VMC-003')).toBe(true);
  });

  test('negative: single member does not fire A-VMC-003', () => {
    const match = matchAdmittedObservations([obs('Source of vitamin C')]);
    expect(match.matched.every((m) => m.register_row_id !== 'A-VMC-003')).toBe(true);
    expect(match.matched.some((m) => m.register_row_id.startsWith('A-VIT'))).toBe(true);
  });

  test('negative: unlisted look-alike targets do not invent members', () => {
    const match = matchAdmittedObservations([obs('Source of vitamin Q and selenium')]);
    expect(match.matched.every((m) => m.register_row_id !== 'A-VMC-003')).toBe(true);
  });

  test('collision: combination supersedes individual vitamin/mineral hits on same statement', () => {
    const match = matchAdmittedObservations([obs('High in vitamin C and iron')]);
    expect(match.matched).toHaveLength(1);
    expect(match.matched[0].register_row_id).toBe('A-VMC-003');
    expect(match.matched[0].member_targets).toEqual(['iron', 'vitamin_c']);
  });

  test('R-013 scoring: combination yields one Packet Context event, not per-member events', () => {
    const r = assessClaimsPacketAndOrganic({
      admittedObservations: [obs('Source of vitamin C and calcium')],
      packetCoverageState: 'complete',
      nutrientContext: nutrientComplete(),
      certifiedOrganicFired: false,
      otherCertificationFired: false,
      benchmarkChecks: [
        { source: 'ktc', status: 'no_finding' },
        { source: 'bbfaw', status: 'no_finding' },
      ],
    });
    expect(r.admitted_claims).toHaveLength(1);
    expect(r.admitted_claims[0].register_row_id).toBe('A-VMC-003');
    expect(r.packet_context_points).toBe(1);
    expect(r.fired_adjustments.filter((f) => f.family === 'packet_context')).toHaveLength(1);
  });

  test('CR-12 residual: contains vitamins and minerals → A-VMC-002 not fail-closed', () => {
    const match = matchAdmittedObservations([obs('contains vitamins and minerals')]);
    expect(match.matched).toHaveLength(1);
    expect(match.matched[0].register_row_id).toBe('A-VMC-002');
    expect(match.diagnostics.some((d) => d.code === 'collision_priority_tie_fail_closed')).toBe(
      false
    );
  });

  test('CR-12 residual: vitamins and minerals alone → A-VMC-001', () => {
    const match = matchAdmittedObservations([obs('vitamins and minerals')]);
    expect(match.matched).toHaveLength(1);
    expect(match.matched[0].register_row_id).toBe('A-VMC-001');
  });
});
