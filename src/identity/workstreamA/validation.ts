import { WORKSTREAM_A_ENUM_DICTIONARY, WORKSTREAM_A_REVIEW_STATES } from './enums';
import { WORKSTREAM_A_FILES, type WorkstreamAFileName } from './schema';
import type { CsvRecord } from './csv';
import {
  WORKSTREAM_A_REQUIRED_COLUMNS,
  WORKSTREAM_A_OPTIONAL_FILES,
  WORKSTREAM_A_REQUIRED_FILES,
  buildEnumDictionaryRows,
} from './templates';

function isGtin(value: string): boolean {
  return /^\d{8,14}$/.test(value);
}

type ValidationMode = 'template' | 'populated';
type IssueLevel = 'error' | 'warning';

export interface ValidationIssue {
  level: IssueLevel;
  file: string;
  rule: string;
  message: string;
}

export interface WorkstreamAValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
  missing_required_files: WorkstreamAFileName[];
  missing_optional_files: WorkstreamAFileName[];
}

export interface ValidatePackInput {
  rowsByFile: Partial<Record<WorkstreamAFileName, CsvRecord[]>>;
  mode: ValidationMode;
}

function addIssue(
  issues: ValidationIssue[],
  level: IssueLevel,
  file: string,
  rule: string,
  message: string
): void {
  issues.push({ level, file, rule, message });
}

function hasValue(v: string | undefined): boolean {
  return Boolean(v && v.trim().length > 0);
}

function ensureColumns(
  fileName: WorkstreamAFileName,
  rows: CsvRecord[],
  issues: ValidationIssue[]
): void {
  const columns = WORKSTREAM_A_REQUIRED_COLUMNS[fileName];
  const first = rows[0] ?? {};
  for (const column of columns) {
    if (!(column in first) && rows.length > 0) {
      addIssue(issues, 'error', fileName, 'required_column_presence', `Missing column '${column}'.`);
    }
  }
}

function validateEnum(fileName: string, value: string, enumName: keyof typeof WORKSTREAM_A_ENUM_DICTIONARY, issues: ValidationIssue[], rowRef: string): void {
  if (!hasValue(value)) {
    return;
  }
  if (!(WORKSTREAM_A_ENUM_DICTIONARY[enumName] as readonly string[]).includes(value)) {
    addIssue(issues, 'error', fileName, 'enum_validity', `${rowRef} has invalid ${enumName} value '${value}'.`);
  }
}

function requireSourceFields(
  fileName: string,
  row: CsvRecord,
  rowRef: string,
  issues: ValidationIssue[],
  mode: ValidationMode
): void {
  const missing = [
    !hasValue(row.primary_source_type),
    !hasValue(row.primary_source_name),
    !(hasValue(row.primary_source_id) || hasValue(row.primary_source_url_or_reference)),
    !hasValue(row.substantiation_note),
  ].some(Boolean);

  if (!missing) {
    return;
  }
  if (mode === 'template') {
    addIssue(issues, 'warning', fileName, 'source_field_validation', `${rowRef} missing source fields in template mode.`);
  } else {
    addIssue(issues, 'error', fileName, 'source_field_validation', `${rowRef} missing required source fields.`);
  }
}

export function validateWorkstreamAPack(input: ValidatePackInput): WorkstreamAValidationResult {
  const issues: ValidationIssue[] = [];
  const rowsByFile = input.rowsByFile;
  const missingRequiredFiles = WORKSTREAM_A_REQUIRED_FILES.filter((file) => !rowsByFile[file]);
  const missingOptionalFiles = WORKSTREAM_A_OPTIONAL_FILES.filter((file) => !rowsByFile[file]);

  for (const fileName of missingRequiredFiles) {
    addIssue(issues, 'error', fileName, 'required_files', `${fileName} is required but missing.`);
  }
  for (const fileName of missingOptionalFiles) {
    addIssue(issues, 'warning', fileName, 'optional_files', `${fileName} not present (optional).`);
  }

  const parents = rowsByFile[WORKSTREAM_A_FILES.CANONICAL_PARENTS] ?? [];
  const brands = rowsByFile[WORKSTREAM_A_FILES.CANONICAL_BRANDS] ?? [];
  const aliases = rowsByFile[WORKSTREAM_A_FILES.BRAND_ALIASES] ?? [];
  const gtinLinks = rowsByFile[WORKSTREAM_A_FILES.GTIN_BRAND_LINKS] ?? [];
  const operationalEntities = rowsByFile[WORKSTREAM_A_FILES.OPERATIONAL_ENTITIES] ?? [];
  const ownershipCandidates = rowsByFile[WORKSTREAM_A_FILES.OWNERSHIP_CHANGE_CANDIDATES] ?? [];
  const stewardship = rowsByFile[WORKSTREAM_A_FILES.STEWARDSHIP_ACTION_LOG] ?? [];
  const sourceRegistry = rowsByFile[WORKSTREAM_A_FILES.SOURCE_REGISTRY] ?? [];
  const enumDictionary = rowsByFile[WORKSTREAM_A_FILES.ENUM_DICTIONARY] ?? [];
  const aliasCandidates = rowsByFile[WORKSTREAM_A_FILES.ALIAS_HARVEST_CANDIDATES] ?? [];
  const parentCandidates = rowsByFile[WORKSTREAM_A_FILES.PARENT_EXTENSION_CANDIDATES] ?? [];
  const controlSurface = rowsByFile[WORKSTREAM_A_FILES.WAVE1_CONTROL_SURFACE] ?? [];

  for (const [fileName, rows] of Object.entries(rowsByFile) as [WorkstreamAFileName, CsvRecord[]][]) {
    ensureColumns(fileName, rows, issues);
  }

  const parentIds = new Set<string>();
  const brandParentById = new Map<string, string>();
  const sourceIds = new Set<string>();
  const changeCandidateIds = new Set<string>();

  for (const row of sourceRegistry) {
    if (sourceIds.has(row.source_id)) {
      addIssue(issues, 'error', WORKSTREAM_A_FILES.SOURCE_REGISTRY, 'id_uniqueness', `Duplicate source_id '${row.source_id}'.`);
    }
    sourceIds.add(row.source_id);
  }

  for (const row of parents) {
    if (parentIds.has(row.parent_id)) {
      addIssue(issues, 'error', WORKSTREAM_A_FILES.CANONICAL_PARENTS, 'id_uniqueness', `Duplicate parent_id '${row.parent_id}'.`);
    }
    parentIds.add(row.parent_id);
    validateEnum(WORKSTREAM_A_FILES.CANONICAL_PARENTS, row.parent_type, 'parent_type', issues, row.parent_id);
    validateEnum(WORKSTREAM_A_FILES.CANONICAL_PARENTS, row.review_state, 'review_state', issues, row.parent_id);
    if (hasValue(row.parent_operating_role)) {
      validateEnum(
        WORKSTREAM_A_FILES.CANONICAL_PARENTS,
        row.parent_operating_role,
        'parent_operating_role',
        issues,
        row.parent_id
      );
    }
    if (row.review_state !== 'archived') {
      requireSourceFields(WORKSTREAM_A_FILES.CANONICAL_PARENTS, row, row.parent_id, issues, input.mode);
      if (!hasValue(row.primary_source_id) || !sourceIds.has(row.primary_source_id ?? '')) {
        addIssue(
          issues,
          input.mode === 'template' ? 'warning' : 'error',
          WORKSTREAM_A_FILES.CANONICAL_PARENTS,
          'source_registry_linkage',
          `${row.parent_id} should resolve primary_source_id in source_registry.csv.`
        );
      }
    }
  }

  for (const row of brands) {
    if (brandParentById.has(row.brand_id)) {
      addIssue(issues, 'error', WORKSTREAM_A_FILES.CANONICAL_BRANDS, 'id_uniqueness', `Duplicate brand_id '${row.brand_id}'.`);
    }
    brandParentById.set(row.brand_id, row.parent_id);
    validateEnum(WORKSTREAM_A_FILES.CANONICAL_BRANDS, row.brand_type, 'brand_type', issues, row.brand_id);
    validateEnum(WORKSTREAM_A_FILES.CANONICAL_BRANDS, row.review_state, 'review_state', issues, row.brand_id);
    if (!parentIds.has(row.parent_id)) {
      addIssue(
        issues,
        'error',
        WORKSTREAM_A_FILES.CANONICAL_BRANDS,
        'cross_file_integrity',
        `${row.brand_id} references missing parent_id '${row.parent_id}'.`
      );
    }
    if (row.review_state !== 'archived') {
      requireSourceFields(WORKSTREAM_A_FILES.CANONICAL_BRANDS, row, row.brand_id, issues, input.mode);
      if (!hasValue(row.primary_source_id) || !sourceIds.has(row.primary_source_id ?? '')) {
        addIssue(
          issues,
          input.mode === 'template' ? 'warning' : 'error',
          WORKSTREAM_A_FILES.CANONICAL_BRANDS,
          'source_registry_linkage',
          `${row.brand_id} should resolve primary_source_id in source_registry.csv.`
        );
      }
    }
  }

  for (const row of aliases) {
    validateEnum(WORKSTREAM_A_FILES.BRAND_ALIASES, row.alias_type, 'alias_type', issues, row.alias_id);
    validateEnum(WORKSTREAM_A_FILES.BRAND_ALIASES, row.alias_source_type, 'alias_source_type', issues, row.alias_id);
    validateEnum(WORKSTREAM_A_FILES.BRAND_ALIASES, row.review_state, 'review_state', issues, row.alias_id);
    const parentId = brandParentById.get(row.brand_id);
    if (!parentId) {
      addIssue(issues, 'error', WORKSTREAM_A_FILES.BRAND_ALIASES, 'brand_first_alias_validation', `${row.alias_id} references unknown brand_id '${row.brand_id}'.`);
    } else if (parentId !== row.parent_id) {
      addIssue(
        issues,
        'error',
        WORKSTREAM_A_FILES.BRAND_ALIASES,
        'brand_first_alias_validation',
        `${row.alias_id} parent_id '${row.parent_id}' does not match brand parent '${parentId}'.`
      );
    }
    if (hasValue(row.source_id) && !sourceIds.has(row.source_id ?? '')) {
      addIssue(issues, 'error', WORKSTREAM_A_FILES.BRAND_ALIASES, 'source_registry_linkage', `${row.alias_id} has unknown source_id '${row.source_id}'.`);
    }
    if (!hasValue(row.source_id) && row.review_state === 'reviewed') {
      addIssue(
        issues,
        'warning',
        WORKSTREAM_A_FILES.BRAND_ALIASES,
        'source_registry_linkage',
        `${row.alias_id} is reviewed but has no source_id linkage.`
      );
    }
  }

  for (const row of gtinLinks) {
    if (!isGtin(row.gtin)) {
      addIssue(issues, 'error', WORKSTREAM_A_FILES.GTIN_BRAND_LINKS, 'gtin_validation', `${row.gtin} is not a valid GTIN.`);
    }
    validateEnum(WORKSTREAM_A_FILES.GTIN_BRAND_LINKS, row.link_review_state, 'review_state', issues, row.gtin);
    validateEnum(WORKSTREAM_A_FILES.GTIN_BRAND_LINKS, row.source_type, 'product_link_source_type', issues, row.gtin);
    const expectedParent = brandParentById.get(row.brand_id);
    if (!expectedParent) {
      addIssue(
        issues,
        'error',
        WORKSTREAM_A_FILES.GTIN_BRAND_LINKS,
        'cross_file_integrity',
        `${row.gtin} references unknown brand_id '${row.brand_id}'.`
      );
    } else if (expectedParent !== row.parent_id) {
      addIssue(
        issues,
        'error',
        WORKSTREAM_A_FILES.GTIN_BRAND_LINKS,
        'cross_file_integrity',
        `${row.gtin} has parent '${row.parent_id}' but brand '${row.brand_id}' resolves to '${expectedParent}'.`
      );
    }
    if (hasValue(row.source_id) && !sourceIds.has(row.source_id ?? '')) {
      addIssue(issues, 'error', WORKSTREAM_A_FILES.GTIN_BRAND_LINKS, 'source_registry_linkage', `${row.gtin} has unknown source_id '${row.source_id}'.`);
    }
  }

  for (const row of operationalEntities) {
    validateEnum(WORKSTREAM_A_FILES.OPERATIONAL_ENTITIES, row.entity_type, 'operational_entity_type', issues, row.operational_entity_id);
    validateEnum(WORKSTREAM_A_FILES.OPERATIONAL_ENTITIES, row.use_case_reason, 'operational_use_case_reason', issues, row.operational_entity_id);
    validateEnum(WORKSTREAM_A_FILES.OPERATIONAL_ENTITIES, row.review_state, 'review_state', issues, row.operational_entity_id);
    if (hasValue(row.linked_parent_id) && !parentIds.has(row.linked_parent_id ?? '')) {
      addIssue(issues, 'error', WORKSTREAM_A_FILES.OPERATIONAL_ENTITIES, 'cross_file_integrity', `${row.operational_entity_id} has unknown linked_parent_id '${row.linked_parent_id}'.`);
    }
    if (hasValue(row.linked_brand_id) && !brandParentById.has(row.linked_brand_id ?? '')) {
      addIssue(issues, 'error', WORKSTREAM_A_FILES.OPERATIONAL_ENTITIES, 'cross_file_integrity', `${row.operational_entity_id} has unknown linked_brand_id '${row.linked_brand_id}'.`);
    }
    if (hasValue(row.source_id) && !sourceIds.has(row.source_id ?? '')) {
      addIssue(issues, 'error', WORKSTREAM_A_FILES.OPERATIONAL_ENTITIES, 'source_registry_linkage', `${row.operational_entity_id} has unknown source_id '${row.source_id}'.`);
    }
  }

  const stewardshipByCandidate = new Map<string, CsvRecord[]>();
  for (const row of stewardship) {
    validateEnum(WORKSTREAM_A_FILES.STEWARDSHIP_ACTION_LOG, row.action_type, 'stewardship_action_type', issues, row.stewardship_action_id);
    if (hasValue(row.related_change_candidate_id)) {
      const bucket = stewardshipByCandidate.get(row.related_change_candidate_id ?? '') ?? [];
      bucket.push(row);
      stewardshipByCandidate.set(row.related_change_candidate_id ?? '', bucket);
    }
  }

  for (const row of ownershipCandidates) {
    if (changeCandidateIds.has(row.change_candidate_id)) {
      addIssue(issues, 'error', WORKSTREAM_A_FILES.OWNERSHIP_CHANGE_CANDIDATES, 'id_uniqueness', `Duplicate change_candidate_id '${row.change_candidate_id}'.`);
    }
    changeCandidateIds.add(row.change_candidate_id);
    validateEnum(WORKSTREAM_A_FILES.OWNERSHIP_CHANGE_CANDIDATES, row.trigger_source_type, 'change_trigger_source_type', issues, row.change_candidate_id);
    validateEnum(WORKSTREAM_A_FILES.OWNERSHIP_CHANGE_CANDIDATES, row.candidate_state, 'change_candidate_state', issues, row.change_candidate_id);
    if (row.target_entity_type === 'brand' && !brandParentById.has(row.target_entity_id)) {
      addIssue(issues, 'error', WORKSTREAM_A_FILES.OWNERSHIP_CHANGE_CANDIDATES, 'ownership_change_candidate_validation', `${row.change_candidate_id} references unknown brand '${row.target_entity_id}'.`);
    }
    if (row.target_entity_type === 'parent' && !parentIds.has(row.target_entity_id)) {
      addIssue(issues, 'error', WORKSTREAM_A_FILES.OWNERSHIP_CHANGE_CANDIDATES, 'ownership_change_candidate_validation', `${row.change_candidate_id} references unknown parent '${row.target_entity_id}'.`);
    }
    if (hasValue(row.source_id) && !sourceIds.has(row.source_id ?? '')) {
      addIssue(issues, 'error', WORKSTREAM_A_FILES.OWNERSHIP_CHANGE_CANDIDATES, 'source_registry_linkage', `${row.change_candidate_id} has unknown source_id '${row.source_id}'.`);
    }
    if (row.candidate_state === 'approved') {
      if (!hasValue(row.human_reviewer)) {
        addIssue(issues, 'error', WORKSTREAM_A_FILES.OWNERSHIP_CHANGE_CANDIDATES, 'approved_change_completeness', `${row.change_candidate_id} approved without human_reviewer.`);
      }
      if (!hasValue(row.approved_effective_date)) {
        const notes = `${row.review_outcome_note ?? ''}`.toLowerCase();
        const hasExceptionFlag = notes.includes('effective_date') || notes.includes('intentionally omitted');
        const related = stewardshipByCandidate.get(row.change_candidate_id) ?? [];
        const hasValidStewardshipException = related.some((entry) => {
          if (entry.action_type !== 'ownership_change_approved') {
            return false;
          }
          const rationale = `${entry.before_state_note ?? ''} ${entry.after_state_note ?? ''}`.toLowerCase();
          return (
            hasValue(entry.action_timestamp) &&
            hasValue(entry.actor) &&
            hasValue(entry.target_entity_type) &&
            hasValue(entry.target_entity_id) &&
            hasValue(entry.action_summary) &&
            rationale.includes('effective')
          );
        });
        if (!(hasExceptionFlag && hasValidStewardshipException)) {
          addIssue(
            issues,
            'error',
            WORKSTREAM_A_FILES.OWNERSHIP_CHANGE_CANDIDATES,
            'approved_change_completeness',
            `${row.change_candidate_id} approved without approved_effective_date and missing stewardship exception trail.`
          );
        }
      }
    }
  }

  for (const row of aliasCandidates) {
    validateEnum(WORKSTREAM_A_FILES.ALIAS_HARVEST_CANDIDATES, row.alias_type, 'alias_type', issues, row.candidate_id);
    validateEnum(WORKSTREAM_A_FILES.ALIAS_HARVEST_CANDIDATES, row.alias_source_type, 'alias_source_type', issues, row.candidate_id);
    validateEnum(WORKSTREAM_A_FILES.ALIAS_HARVEST_CANDIDATES, row.candidate_state, 'candidate_state', issues, row.candidate_id);
  }

  for (const row of parentCandidates) {
    validateEnum(WORKSTREAM_A_FILES.PARENT_EXTENSION_CANDIDATES, row.candidate_state, 'candidate_state', issues, row.candidate_id);
  }

  for (const row of controlSurface) {
    validateEnum(WORKSTREAM_A_FILES.WAVE1_CONTROL_SURFACE, row.parent_cohort_category, 'parent_cohort_category', issues, row.control_row_id);
    validateEnum(WORKSTREAM_A_FILES.WAVE1_CONTROL_SURFACE, row.review_state, 'review_state', issues, row.control_row_id);
    for (const flag of [
      'au_shelf_priority_y_n',
      'nz_shelf_priority_y_n',
      'bbfaw_seed_asset_member_y_n',
      'ktc_seed_asset_member_y_n',
      'core_uat_asset_member_y_n',
      'official_parent_brand_source_harvested_y_n',
    ]) {
      if (hasValue(row[flag]) && row[flag] !== 'Y' && row[flag] !== 'N') {
        addIssue(issues, 'error', WORKSTREAM_A_FILES.WAVE1_CONTROL_SURFACE, 'enum_validity', `${row.control_row_id} has invalid ${flag} value '${row[flag]}'.`);
      }
    }
  }

  const expectedEnumRows = buildEnumDictionaryRows();
  const enumActual = new Set(enumDictionary.map((r) => `${r.enum_name}|${r.enum_value}`));
  for (const row of expectedEnumRows) {
    const key = `${row.enum_name}|${row.enum_value}`;
    if (!enumActual.has(key)) {
      addIssue(issues, 'error', WORKSTREAM_A_FILES.ENUM_DICTIONARY, 'enum_dictionary_drift', `Missing enum dictionary row '${key}'.`);
    }
  }

  const deprecatedFieldHints = [
    'confidence_state',
    'benchmark_relevance',
    'ownership_currency',
    'own_label_families',
  ];
  for (const [fileName, rows] of Object.entries(rowsByFile) as [string, CsvRecord[]][]) {
    if (rows.length === 0) {
      continue;
    }
    const keys = Object.keys(rows[0]);
    for (const deprecatedField of deprecatedFieldHints) {
      if (keys.includes(deprecatedField)) {
        addIssue(issues, 'error', fileName, 'deprecated_field_detection', `Deprecated field '${deprecatedField}' found.`);
      }
    }
  }

  return {
    ok: !issues.some((issue) => issue.level === 'error'),
    issues,
    missing_required_files: missingRequiredFiles,
    missing_optional_files: missingOptionalFiles,
  };
}

