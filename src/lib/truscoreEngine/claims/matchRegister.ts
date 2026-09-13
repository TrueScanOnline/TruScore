/**
 * Deterministic Machine Register matching — closed expressions only (REG-02 / R-003).
 * match_type handlers: regex | regex_exact | deterministic_member_count (A-VMC-003 / R-013).
 */

import registerJson from './machineRegister/packetClaimMachineRegister.v1.json';
import { normalizePacketStatement, toDisplaySafeClaimText } from './normalize';
import type {
  AdmittedPacketObservation,
  ClaimsCatalogueSet,
  MatchedClaimObservation,
} from './types';
import { PACKET_CLAIM_MACHINE_REGISTER_VERSION } from './types';

export interface RegisterPattern {
  pattern_id: string;
  catalogue_set: ClaimsCatalogueSet;
  recordable: boolean;
  canonical_family: string;
  direction_class: string;
  claim_form: string;
  match_type: string;
  normalised_match_expression: string;
  required_scope: string;
  context_test_eligible: boolean;
  score_if_any_high: string;
  score_if_complete_none_high: string;
  score_if_incomplete_no_high: string;
  collision_priority: number;
  source_basis: string;
  notes: string;
  active: boolean;
}

export interface RegisterExclusion {
  negative_id: string;
  normalised_pattern_or_condition: string;
  reason: string;
  required_treatment: string;
}

interface RegisterFile {
  register_version: string;
  patterns: RegisterPattern[];
  exclusions: RegisterExclusion[];
}

const REGISTER = registerJson as RegisterFile;

export function getMachineRegisterVersion(): string {
  return REGISTER.register_version || PACKET_CLAIM_MACHINE_REGISTER_VERSION;
}

export function getActivePatterns(): RegisterPattern[] {
  return REGISTER.patterns.filter((p) => p.active && p.recordable);
}

export function getRegisterMatchTypes(): string[] {
  return [...new Set(REGISTER.patterns.map((p) => p.match_type))].sort();
}

/**
 * Active Target Vocabulary aliases → canonical member ids for A-VMC-003 / R-013.
 * Only specific vitamin/mineral targets participate (not generic "vitamin"/"mineral").
 * Longer aliases are matched first so "vitamin b12" wins over "vitamin b1".
 */
const ACTIVE_MEMBER_TARGET_ALIASES: { alias: string; canonical: string }[] = [
  { alias: 'vitamin b12', canonical: 'vitamin_b12' },
  { alias: 'vitamin b 12', canonical: 'vitamin_b12' },
  { alias: 'vitamin b1', canonical: 'vitamin_b1' },
  { alias: 'vitamin b 1', canonical: 'vitamin_b1' },
  { alias: 'vitamin b2', canonical: 'vitamin_b2' },
  { alias: 'vitamin b 2', canonical: 'vitamin_b2' },
  { alias: 'vitamin b3', canonical: 'vitamin_b3' },
  { alias: 'vitamin b 3', canonical: 'vitamin_b3' },
  { alias: 'vitamin b5', canonical: 'vitamin_b5' },
  { alias: 'vitamin b 5', canonical: 'vitamin_b5' },
  { alias: 'vitamin b6', canonical: 'vitamin_b6' },
  { alias: 'vitamin b 6', canonical: 'vitamin_b6' },
  { alias: 'vitamin b7', canonical: 'vitamin_b7' },
  { alias: 'vitamin b 7', canonical: 'vitamin_b7' },
  { alias: 'vitamin b9', canonical: 'vitamin_b9' },
  { alias: 'vitamin b 9', canonical: 'vitamin_b9' },
  { alias: 'vitamin d2', canonical: 'vitamin_d2' },
  { alias: 'vitamin d 2', canonical: 'vitamin_d2' },
  { alias: 'vitamin d3', canonical: 'vitamin_d3' },
  { alias: 'vitamin d 3', canonical: 'vitamin_d3' },
  { alias: 'vitamin k1', canonical: 'vitamin_k1' },
  { alias: 'vitamin k 1', canonical: 'vitamin_k1' },
  { alias: 'vitamin k2', canonical: 'vitamin_k2' },
  { alias: 'vitamin k 2', canonical: 'vitamin_k2' },
  { alias: 'vitamin a', canonical: 'vitamin_a' },
  { alias: 'vitamin c', canonical: 'vitamin_c' },
  { alias: 'vitamin d', canonical: 'vitamin_d' },
  { alias: 'vitamin e', canonical: 'vitamin_e' },
  { alias: 'vitamin k', canonical: 'vitamin_k' },
  { alias: 'thiamine', canonical: 'vitamin_b1' },
  { alias: 'thiamin', canonical: 'vitamin_b1' },
  { alias: 'riboflavin', canonical: 'vitamin_b2' },
  { alias: 'niacin', canonical: 'vitamin_b3' },
  { alias: 'folate', canonical: 'vitamin_b9' },
  { alias: 'calcium', canonical: 'calcium' },
  { alias: 'iron', canonical: 'iron' },
  { alias: 'zinc', canonical: 'zinc' },
  { alias: 'magnesium', canonical: 'magnesium' },
  { alias: 'iodine', canonical: 'iodine' },
];

function isRegexExclusionCondition(condition: string): boolean {
  return condition.startsWith('\\') || condition.startsWith('^') || condition.includes('\\b');
}

function matchesExclusion(normalized: string, exclusion: RegisterExclusion): boolean {
  const cond = exclusion.normalised_pattern_or_condition.trim();
  if (!cond) return false;
  // Narrative exclusions (X-020 etc.) are applied by admission policy, not regex.
  if (!isRegexExclusionCondition(cond) && !cond.startsWith('^')) {
    return false;
  }
  try {
    return new RegExp(cond, 'i').test(normalized);
  } catch {
    return false;
  }
}

function patternAppliesToScope(pattern: RegisterPattern, observation: AdmittedPacketObservation): boolean {
  if (pattern.required_scope === 'governed_product_name_whole_product') {
    return observation.is_product_name === true || observation.admission_method === 'governed_product_name';
  }
  if (pattern.required_scope === 'standalone_promotional_callout') {
    // Exact whole-string match patterns; any established packet statement may apply.
    return true;
  }
  return true;
}

/** Distinct active vitamin/mineral member targets (canonical ids) for R-013. */
export function listDistinctVitaminMineralTargets(normalized: string): string[] {
  const found = new Set<string>();
  for (const { alias, canonical } of ACTIVE_MEMBER_TARGET_ALIASES) {
    const re = new RegExp(`(?:^|\\s)${alias.replace(/\s+/g, '\\s+')}(?:\\s|$)`, 'i');
    if (re.test(normalized)) found.add(canonical);
  }
  return [...found].sort();
}

function matchPattern(
  normalized: string,
  pattern: RegisterPattern
): { matched: boolean; memberTargets?: string[] } {
  if (pattern.match_type === 'deterministic_member_count') {
    const members = listDistinctVitaminMineralTargets(normalized);
    return { matched: members.length >= 2, memberTargets: members.length >= 2 ? members : undefined };
  }
  const expr = pattern.normalised_match_expression;
  try {
    // regex_exact rows use anchored ^…$ expressions; regex rows use word-boundary expressions.
    // Both are closed RegExp tests — no fuzzy/semantic expansion (REG-02).
    const matched = new RegExp(expr, 'i').test(normalized);
    return { matched };
  } catch {
    return { matched: false };
  }
}

export interface MatchRegisterResult {
  matched: MatchedClaimObservation[];
  unclassified: {
    evidence_id: string;
    observed_text: string;
    display_text: string;
  }[];
  diagnostics: { code: string; detail: string }[];
  excluded: { evidence_id: string; negative_id: string; reason: string }[];
}

/**
 * Match admitted observations against the active Machine Register.
 * Collision R-012: same statement matching A and B retains B.
 * R-013: A-VMC-003 combination observation supersedes individual vitamin/mineral hits
 * on the same statement (one observation with member_targets; never one score event per member).
 */
export function matchAdmittedObservations(
  observations: AdmittedPacketObservation[],
  options?: { registerVersionExpected?: string }
): MatchRegisterResult {
  const diagnostics: MatchRegisterResult['diagnostics'] = [];
  const version = getMachineRegisterVersion();
  if (options?.registerVersionExpected && options.registerVersionExpected !== version) {
    diagnostics.push({
      code: 'register_version_mismatch',
      detail: `Expected ${options.registerVersionExpected}, loaded ${version}`,
    });
    return { matched: [], unclassified: [], diagnostics, excluded: [] };
  }

  const patterns = getActivePatterns();
  const matched: MatchedClaimObservation[] = [];
  const unclassified: MatchRegisterResult['unclassified'] = [];
  const excluded: MatchRegisterResult['excluded'] = [];

  for (const obs of observations) {
    const normalized = normalizePacketStatement(obs.observed_text);
    if (!normalized) continue;

    // Ingredient-level organic exclusions etc.
    let excludedHit: RegisterExclusion | undefined;
    for (const ex of REGISTER.exclusions) {
      if (matchesExclusion(normalized, ex)) {
        excludedHit = ex;
        break;
      }
    }
    if (excludedHit) {
      excluded.push({
        evidence_id: obs.evidence_id,
        negative_id: excludedHit.negative_id,
        reason: excludedHit.reason,
      });
      // Certified Organic wording → route to certifications (no packet row)
      if (excludedHit.negative_id === 'X-017' || excludedHit.negative_id === 'X-023') {
        continue;
      }
      // Inverse/unfavourable → may remain unclassified if required; treat as unclassified for honesty
      if (excludedHit.required_treatment.toLowerCase().includes('unclassified')) {
        unclassified.push({
          evidence_id: obs.evidence_id,
          observed_text: obs.observed_text,
          display_text: toDisplaySafeClaimText(obs.display_text || obs.observed_text),
        });
      }
      continue;
    }

    const hits: { pattern: RegisterPattern; memberTargets?: string[] }[] = [];
    for (const pattern of patterns) {
      if (!patternAppliesToScope(pattern, obs)) continue;
      const result = matchPattern(normalized, pattern);
      if (result.matched) hits.push({ pattern, memberTargets: result.memberTargets });
    }

    if (hits.length === 0) {
      unclassified.push({
        evidence_id: obs.evidence_id,
        observed_text: obs.observed_text,
        display_text: toDisplaySafeClaimText(obs.display_text || obs.observed_text),
      });
      continue;
    }

    let selected = hits;

    // R-013: combination member-count row wins over individual vitamin/mineral / phrase VMC rows
    const combinationHit = hits.find(
      (h) =>
        h.pattern.match_type === 'deterministic_member_count' &&
        h.pattern.pattern_id === 'A-VMC-003'
    );
    if (combinationHit) {
      selected = [combinationHit];
      diagnostics.push({
        code: 'r013_combination_observation',
        detail: `evidence ${obs.evidence_id}: A-VMC-003 retained as one combination observation with members [${(combinationHit.memberTargets ?? []).join(', ')}]`,
      });
    } else {
      // Collision: same statement matches A and B → retain B (R-012)
      const hasA = hits.some((h) => h.pattern.catalogue_set === 'A');
      const hasB = hits.some((h) => h.pattern.catalogue_set === 'B');
      if (hasA && hasB) {
        selected = hits.filter((h) => h.pattern.catalogue_set === 'B');
        diagnostics.push({
          code: 'collision_a_b_retain_b',
          detail: `evidence ${obs.evidence_id}: A+B collision retained Set B`,
        });
      }
    }

    // Prefer highest collision_priority within remaining; keep one observation per statement
    selected.sort((a, b) => b.pattern.collision_priority - a.pattern.collision_priority);
    const best = selected[0];
    matched.push({
      evidence_id: obs.evidence_id,
      observed_text: obs.observed_text,
      display_text: toDisplaySafeClaimText(obs.display_text || obs.observed_text),
      register_row_id: best.pattern.pattern_id,
      canonical_family: best.pattern.canonical_family,
      set: best.pattern.catalogue_set,
      admission_method: obs.admission_method,
      source_locator: obs.source_locator,
      collision_priority: best.pattern.collision_priority,
      context_test_eligible: best.pattern.context_test_eligible,
      ...(best.memberTargets && best.memberTargets.length > 0
        ? { member_targets: best.memberTargets }
        : {}),
    });
  }

  return { matched, unclassified, diagnostics, excluded };
}
