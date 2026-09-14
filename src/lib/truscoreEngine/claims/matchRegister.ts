/**
 * Deterministic Machine Register matching — closed expressions only (REG-02 / R-003).
 * Pipeline: normalise → generate candidates → apply candidate/scoped exclusions →
 * resolve collisions/precedence → aggregate.
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

/** Favourable “no added …” sugar/sodium/fat pattern ids that must survive inverse exclusions. */
const NO_ADDED_PATTERN_IDS = new Set(['B-SUG-002', 'B-SOD-002']);

const CLOSED_PROTEIN_ADJECTIVES = new Set([
  'high',
  'higher',
  'increased',
  'more',
  'source',
  'good',
  'excellent',
  'rich',
]);

const ACTIVE_VITAMIN_MINERAL_TARGETS =
  'vitamins?|minerals?|calcium|iron|zinc|magnesium|iodine|thiamine|thiamin|riboflavin|niacin|folate';

/** Single-pass display escaping from immutable observed_text (never re-escape display_text). */
function displayTextFromObserved(observedText: string): string {
  return toDisplaySafeClaimText(observedText);
}

export function getMachineRegisterVersion(): string {
  return REGISTER.register_version || PACKET_CLAIM_MACHINE_REGISTER_VERSION;
}

export function getActivePatterns(): RegisterPattern[] {
  return REGISTER.patterns.filter((p) => p.active && p.recordable);
}

export function getRegisterMatchTypes(): string[] {
  return [...new Set(REGISTER.patterns.map((p) => p.match_type))].sort();
}

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

function matchesRegexExclusion(normalized: string, exclusion: RegisterExclusion): boolean {
  const cond = exclusion.normalised_pattern_or_condition.trim();
  if (!cond || !isRegexExclusionCondition(cond)) return false;
  try {
    return new RegExp(cond, 'i').test(normalized);
  } catch {
    return false;
  }
}

/**
 * Product-name evidence is Set O scope only — never scan the whole A/B catalogue.
 * OFF labels and packet/OCR/user admissions may use established_packet_statement patterns.
 */
function patternAppliesToScope(pattern: RegisterPattern, observation: AdmittedPacketObservation): boolean {
  const productNameScope =
    observation.is_product_name === true || observation.admission_method === 'governed_product_name';

  if (productNameScope) {
    return pattern.required_scope === 'governed_product_name_whole_product';
  }

  if (pattern.required_scope === 'governed_product_name_whole_product') {
    return false;
  }

  return true;
}

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
    const matched = new RegExp(expr, 'i').test(normalized);
    return { matched };
  } catch {
    return { matched: false };
  }
}

type Candidate = { pattern: RegisterPattern; memberTargets?: string[] };

/**
 * Candidate-scoped exclusion: veto only the candidates the exclusion governs.
 * Independent approved patterns on the same statement survive (X-007 / X-011 style).
 */
function candidateVetoedByExclusion(
  exclusion: RegisterExclusion,
  candidate: Candidate,
  normalized: string,
  diagnostics: { code: string; detail: string }[]
): boolean {
  const id = exclusion.negative_id;
  const p = candidate.pattern;

  // Inverse sugar — do not veto full B-SUG-002 “no added sugar” matches
  if (id === 'X-001') {
    if (NO_ADDED_PATTERN_IDS.has(p.pattern_id)) return false;
    return p.canonical_family === 'total_sugars' || /sugar/.test(p.pattern_id.toLowerCase());
  }

  // Inverse fat/sodium/salt — do not veto B-SOD-002 / no-added fat rows
  if (id === 'X-002') {
    if (NO_ADDED_PATTERN_IDS.has(p.pattern_id)) return false;
    return (
      p.canonical_family === 'sodium' ||
      p.canonical_family === 'saturated_fat' ||
      p.canonical_family === 'total_fat' ||
      /fat|sod|salt/.test(p.pattern_id.toLowerCase())
    );
  }

  if (id === 'X-003') {
    return p.canonical_family === 'protein' || /protein/i.test(p.pattern_id);
  }
  if (id === 'X-004') {
    return p.canonical_family === 'fibre' || /fibre|fiber/i.test(p.pattern_id);
  }
  if (id === 'X-005') {
    return (
      p.canonical_family === 'vitamin_mineral' ||
      p.match_type === 'deterministic_member_count' ||
      /vmc|vitamin|mineral/i.test(p.pattern_id)
    );
  }
  if (id === 'X-006') {
    return p.canonical_family === 'total_sugars';
  }

  // Unapproved protein adjectives — veto protein candidates that are not independently approved
  if (id === 'X-007') {
    if (/^A-PRO-00[1-4]$/.test(p.pattern_id)) return false;
    return p.canonical_family === 'protein' || /protein/i.test(p.pattern_id);
  }

  if (id === 'X-008') {
    return /fat/i.test(p.canonical_family) || /fat/i.test(p.pattern_id);
  }
  if (id === 'X-009' || id === 'X-010') {
    return p.canonical_family === 'sodium' || /sod|salt/i.test(p.pattern_id);
  }

  // Protein bar alone — no A/B from that phrase alone; preserve independently approved protein patterns
  if (id === 'X-011') {
    if (/^A-PRO-00[1-4]$/.test(p.pattern_id)) return false;
    return p.canonical_family === 'protein' || /protein/i.test(p.pattern_id);
  }

  // Outside MVP V/M vocabulary — unclassified those targets; do not kill other families
  if (id === 'X-012') {
    return (
      p.canonical_family === 'vitamin_mineral' ||
      p.match_type === 'deterministic_member_count' ||
      /vmc|vitamin|mineral/i.test(p.pattern_id)
    );
  }

  if (id === 'X-013' || id === 'X-014' || id === 'X-015' || id === 'X-016') {
    return p.catalogue_set === 'C' || /fodmap|vegan|dairy|gluten|plant/i.test(p.pattern_id);
  }

  // Certified Organic → no Set O packet row (cert path separate)
  if (id === 'X-017' || id === 'X-023') {
    return p.catalogue_set === 'O' || /org/i.test(p.pattern_id);
  }

  // Ingredient / partial organic — veto Set O only; unrelated claims survive
  if (id === 'X-018' || id === 'X-019') {
    return p.catalogue_set === 'O' || /org/i.test(p.pattern_id);
  }

  // X-024: founder-dispositioned for MVP — not runtime-enforced (no brand-token parser)
  if (id === 'X-024') {
    diagnostics.push({
      code: 'x024_founder_dispositioned_mvp',
      detail:
        'X-024 brand-token Organic edge is founder-dispositioned / not runtime-enforced for MVP; product-name Organic claim-only +1 may fire; Certified Organic +3 requires separate certification evidence',
    });
    return false;
  }

  // Default regex exclusion: veto A/B candidates in overlapping family when possible
  if (p.catalogue_set === 'A' || p.catalogue_set === 'B') {
    return true;
  }
  return false;
}

/** Deterministic prose exclusions (X-020…X-022). */
function applyProseExclusionPredicates(
  normalized: string,
  observation: AdmittedPacketObservation,
  candidates: Candidate[],
  diagnostics: { code: string; detail: string }[]
): Candidate[] {
  let remaining = [...candidates];

  // X-020: mandatory/regulatory packet information — evidence-location/source exclusion.
  // Does not lexically veto approved OFF labels / labels_en / voluntary packet admissions.
  const mandatoryLocators = new Set([
    'nip',
    'mandatory_legal_text',
    'ingredient_list',
    'allergen_statement',
    'preparation_instructions',
  ]);
  if (observation.source_locator && mandatoryLocators.has(observation.source_locator)) {
    diagnostics.push({
      code: 'x020_mandatory_source_excluded',
      detail: `evidence ${observation.evidence_id}: source_locator=${observation.source_locator} outside voluntary packet-claim input universe`,
    });
    return [];
  }

  // X-021: unlisted adjective immediately before active protein/fibre target
  const stop = new Set([
    'of',
    'a',
    'an',
    'the',
    'per',
    'with',
    'contains',
    'and',
    'or',
    'in',
    'for',
    'to',
    'from',
    'g',
    'mg',
  ]);
  const adjTarget = normalized.match(/\b([a-z]+)\s+(protein|fibre|fiber)\b/gi) || [];
  let unlistedHit = false;
  for (const phrase of adjTarget) {
    const parts = phrase.toLowerCase().split(/\s+/);
    const adj = parts[0];
    if (CLOSED_PROTEIN_ADJECTIVES.has(adj) || stop.has(adj)) continue;
    if (/^\d/.test(adj)) continue;
    unlistedHit = true;
  }
  if (unlistedHit) {
    const before = remaining.length;
    remaining = remaining.filter((c) => {
      const fam = c.pattern.canonical_family;
      // Preserve independently approved absolute protein/fibre patterns
      if (/^A-PRO-00[1-4]$/.test(c.pattern.pattern_id)) return true;
      if (/^A-FIB-/.test(c.pattern.pattern_id)) return true;
      if (fam === 'protein' || fam === 'fibre' || fam === 'dietary_fibre') return false;
      return true;
    });
    diagnostics.push({
      code: 'x021_unlisted_adjective',
      detail: `evidence ${observation.evidence_id}: unlisted adjective+target → non-approved protein/fibre candidates dropped (independent approved patterns preserved)`,
    });
    void before;
  }

  // X-022: comparative vitamin/mineral
  const comparativeVm = new RegExp(
    `\\b(?:more|higher|increased|less|lower|reduced)\\s+(?:${ACTIVE_VITAMIN_MINERAL_TARGETS})\\b`,
    'i'
  );
  if (comparativeVm.test(normalized)) {
    remaining = remaining.filter(
      (c) =>
        c.pattern.canonical_family !== 'vitamin_mineral' &&
        c.pattern.match_type !== 'deterministic_member_count' &&
        !/vmc|vitamin|mineral/i.test(c.pattern.pattern_id)
    );
    diagnostics.push({
      code: 'x022_comparative_vm',
      detail: `evidence ${observation.evidence_id}: comparative V/M outside MVP catalogue (unrelated families preserved)`,
    });
  }

  // X-024: founder-dispositioned for MVP — not runtime-enforced; diagnostic only on product-name Organic
  if (
    observation.is_product_name === true &&
    remaining.some((c) => c.pattern.catalogue_set === 'O')
  ) {
    diagnostics.push({
      code: 'x024_founder_dispositioned_mvp',
      detail:
        'X-024 brand-token Organic edge is founder-dispositioned / not runtime-enforced for MVP; product-name Organic claim-only +1 may fire; Certified Organic +3 requires separate certification evidence',
    });
  }

  // Silence unused closed-set reference (documents closed vocabulary for X-021)
  void CLOSED_PROTEIN_ADJECTIVES;

  return remaining;
}

function isOverlappingVitaminMineralCandidate(c: Candidate, retainedId: string): boolean {
  const id = c.pattern.pattern_id;
  if (id === retainedId) return false;
  if (id === 'A-VMC-001' || id === 'A-VMC-002' || id === 'A-VMC-003') return true;
  const fam = c.pattern.canonical_family;
  return (
    fam === 'vitamin' ||
    fam === 'mineral' ||
    fam === 'vitamin_mineral' ||
    /^A-VIT-/i.test(id) ||
    /^A-MIN-/i.test(id)
  );
}

/**
 * Same-observation governed combination precedence (CR-12 residual).
 * Returns a single-candidate selection when a VMC row applies; otherwise null.
 */
function applyVitaminMineralCombinationPrecedence(
  candidates: Candidate[],
  evidenceId: string,
  diagnostics: { code: string; detail: string }[]
): Candidate[] | null {
  const vmc003 = candidates.find(
    (h) =>
      h.pattern.pattern_id === 'A-VMC-003' && h.pattern.match_type === 'deterministic_member_count'
  );
  if (vmc003) {
    const suppressed = candidates
      .filter((c) => isOverlappingVitaminMineralCandidate(c, 'A-VMC-003'))
      .map((c) => c.pattern.pattern_id);
    diagnostics.push({
      code: 'r013_combination_observation',
      detail: `evidence ${evidenceId}: A-VMC-003 retained as one combination observation with members [${(vmc003.memberTargets ?? []).join(', ')}]${suppressed.length ? `; suppressed [${suppressed.join(', ')}]` : ''}`,
    });
    return [vmc003];
  }

  const vmc002 = candidates.find((h) => h.pattern.pattern_id === 'A-VMC-002');
  if (vmc002) {
    const suppressed = candidates
      .filter((c) => isOverlappingVitaminMineralCandidate(c, 'A-VMC-002'))
      .map((c) => c.pattern.pattern_id);
    diagnostics.push({
      code: 'vmc_combination_precedence',
      detail: `evidence ${evidenceId}: A-VMC-002 retained; overlapping A-VMC-001 and component vitamin/mineral candidates suppressed${suppressed.length ? ` [${suppressed.join(', ')}]` : ''}`,
    });
    return [vmc002];
  }

  const vmc001 = candidates.find((h) => h.pattern.pattern_id === 'A-VMC-001');
  if (vmc001) {
    const suppressed = candidates
      .filter((c) => isOverlappingVitaminMineralCandidate(c, 'A-VMC-001'))
      .map((c) => c.pattern.pattern_id);
    diagnostics.push({
      code: 'vmc_combination_precedence',
      detail: `evidence ${evidenceId}: A-VMC-001 retained; overlapping component vitamin/mineral candidates suppressed${suppressed.length ? ` [${suppressed.join(', ')}]` : ''}`,
    });
    return [vmc001];
  }

  return null;
}

export interface MatchRegisterResult {
  matched: MatchedClaimObservation[];
  unclassified: {
    evidence_id: string;
    observed_text: string;
    display_text: string;
  }[];
  diagnostics: { code: string; detail: string }[];
  excluded: {
    evidence_id: string;
    negative_id: string;
    reason: string;
    vetoed_pattern_id?: string;
  }[];
}

/**
 * Match admitted observations against the active Machine Register.
 * Collision R-012: same statement matching A and B retains B.
 * R-013: A-VMC-003 combination supersedes individual vitamin/mineral hits.
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

    // 1) Generate active-row candidates (scoped)
    let candidates: Candidate[] = [];
    for (const pattern of patterns) {
      if (!patternAppliesToScope(pattern, obs)) continue;
      const result = matchPattern(normalized, pattern);
      if (result.matched) candidates.push({ pattern, memberTargets: result.memberTargets });
    }

    // 2) Apply candidate/scoped regex exclusions
    for (const ex of REGISTER.exclusions) {
      if (!isRegexExclusionCondition(ex.normalised_pattern_or_condition)) continue;
      if (!matchesRegexExclusion(normalized, ex)) continue;

      const kept: Candidate[] = [];
      let vetoedAny = false;
      for (const cand of candidates) {
        if (candidateVetoedByExclusion(ex, cand, normalized, diagnostics)) {
          vetoedAny = true;
          excluded.push({
            evidence_id: obs.evidence_id,
            negative_id: ex.negative_id,
            reason: ex.reason,
            vetoed_pattern_id: cand.pattern.pattern_id,
          });
        } else {
          kept.push(cand);
        }
      }
      candidates = kept;
      // Record that the exclusion phrase matched even when independent patterns were preserved
      if (!vetoedAny && (ex.negative_id === 'X-007' || ex.negative_id === 'X-011')) {
        diagnostics.push({
          code: `${ex.negative_id.toLowerCase()}_phrase_scoped`,
          detail: `evidence ${obs.evidence_id}: ${ex.negative_id} matched; independently governed protein patterns preserved`,
        });
        excluded.push({
          evidence_id: obs.evidence_id,
          negative_id: ex.negative_id,
          reason: ex.reason,
          vetoed_pattern_id: '(phrase-only; independent patterns preserved)',
        });
      }
    }

    // 3) Prose exclusions (X-020 / X-021 / X-022); X-024 handled as MVP-accepted edge above
    candidates = applyProseExclusionPredicates(normalized, obs, candidates, diagnostics);

    if (candidates.length === 0) {
      // Do not dump exclusion-rejected governed wording into “outside claims we assess”
      const hadExclusion = excluded.some((e) => e.evidence_id === obs.evidence_id);
      if (!hadExclusion) {
        unclassified.push({
          evidence_id: obs.evidence_id,
          observed_text: obs.observed_text,
          display_text: displayTextFromObserved(obs.observed_text),
        });
      }
      continue;
    }

    let selected = candidates;

    // Governed vitamin/mineral combination precedence (same observation) before generic priority ties.
    // A-VMC-003 (R-013) > A-VMC-002 > A-VMC-001 > component A-VIT/A-MIN hits.
    const combinationSelected = applyVitaminMineralCombinationPrecedence(
      candidates,
      obs.evidence_id,
      diagnostics
    );
    if (combinationSelected) {
      selected = combinationSelected;
    } else {
      // R-012
      const hasA = candidates.some((h) => h.pattern.catalogue_set === 'A');
      const hasB = candidates.some((h) => h.pattern.catalogue_set === 'B');
      if (hasA && hasB) {
        selected = candidates.filter((h) => h.pattern.catalogue_set === 'B');
        diagnostics.push({
          code: 'collision_a_b_retain_b',
          detail: `evidence ${obs.evidence_id}: A+B collision retained Set B`,
        });
      }
    }

    // Highest collision_priority wins — no JSON-order tiebreak
    const maxPriority = Math.max(...selected.map((s) => s.pattern.collision_priority));
    const top = selected.filter((s) => s.pattern.collision_priority === maxPriority);
    if (top.length > 1) {
      // Distinct equal-priority ambiguity → fail closed (only after governed combination rules)
      diagnostics.push({
        code: 'collision_priority_tie_fail_closed',
        detail: `evidence ${obs.evidence_id}: equal priority among [${top.map((t) => t.pattern.pattern_id).join(', ')}]`,
      });
      continue;
    }
    const best = top[0];

    matched.push({
      evidence_id: obs.evidence_id,
      observed_text: obs.observed_text,
      display_text: displayTextFromObserved(obs.observed_text),
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
