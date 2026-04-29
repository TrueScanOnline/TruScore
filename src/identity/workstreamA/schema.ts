export const WORKSTREAM_A_FILES = {
  CANONICAL_PARENTS: 'canonical_parents.csv',
  CANONICAL_BRANDS: 'canonical_brands.csv',
  BRAND_ALIASES: 'brand_aliases.csv',
  GTIN_BRAND_LINKS: 'gtin_brand_links.csv',
  OPERATIONAL_ENTITIES: 'operational_entities.csv',
  OWNERSHIP_CHANGE_CANDIDATES: 'ownership_change_candidates.csv',
  STEWARDSHIP_ACTION_LOG: 'stewardship_action_log.csv',
  SOURCE_REGISTRY: 'source_registry.csv',
  ENUM_DICTIONARY: 'enum_dictionary.csv',
  WAVE1_CONTROL_SURFACE: 'wave1_control_surface.csv',
  PARENT_EXTENSION_CANDIDATES: 'parent_extension_candidates.csv',
  ALIAS_HARVEST_CANDIDATES: 'alias_harvest_candidates.csv',
  CATALOGUE_AUDIT_OBSERVATIONS: 'catalogue_audit_observations.csv',
} as const;

export type WorkstreamAFileName = (typeof WORKSTREAM_A_FILES)[keyof typeof WORKSTREAM_A_FILES];

export interface CanonicalParentRow {
  parent_id: string;
  canonical_parent_name: string;
  display_parent_name: string;
  parent_type: string;
  review_state: string;
  primary_source_type: string;
  primary_source_name: string;
  primary_source_id?: string;
  primary_source_url_or_reference?: string;
  substantiation_note: string;
  parent_operating_role?: string;
  source_harvest_date?: string;
  review_owner?: string;
  review_updated_at?: string;
  notes_internal?: string;
}

export interface CanonicalBrandRow {
  brand_id: string;
  canonical_brand_name: string;
  display_brand_name: string;
  parent_id: string;
  parent_display_name: string;
  brand_type: string;
  review_state: string;
  primary_source_type: string;
  primary_source_name: string;
  primary_source_id?: string;
  primary_source_url_or_reference?: string;
  substantiation_note: string;
  source_harvest_date?: string;
  review_updated_at?: string;
  notes_internal?: string;
}

export interface BrandAliasRow {
  alias_id: string;
  alias_text: string;
  alias_normalized: string;
  alias_type: string;
  alias_source_type: string;
  brand_id: string;
  canonical_brand_name: string;
  parent_id: string;
  parent_display_name: string;
  review_state: string;
  source_reference: string;
  source_id?: string;
  notes_internal?: string;
}

export interface GtinBrandLinkRow {
  gtin: string;
  brand_id: string;
  parent_id: string;
  link_review_state: string;
  source_type: string;
  source_reference: string;
  source_id?: string;
  product_name?: string;
  last_reviewed_at?: string;
  notes_internal?: string;
}

export interface OperationalEntityRow {
  operational_entity_id: string;
  operational_entity_name: string;
  entity_type: string;
  use_case_reason: string;
  review_state: string;
  source_reference: string;
  source_id?: string;
  linked_parent_id?: string;
  linked_brand_id?: string;
  notes_internal?: string;
}

export interface OwnershipChangeCandidateRow {
  change_candidate_id: string;
  target_entity_type: 'parent' | 'brand';
  target_entity_id: string;
  candidate_new_parent_name: string;
  trigger_source_type: string;
  trigger_source_title: string;
  trigger_source_url?: string;
  trigger_source_reference: string;
  detected_at: string;
  candidate_state: string;
  candidate_new_parent_id?: string;
  human_reviewer?: string;
  review_outcome_note?: string;
  approved_effective_date?: string;
  notes_internal?: string;
  source_id?: string;
}

export interface StewardshipActionLogRow {
  stewardship_action_id: string;
  action_type: string;
  target_entity_type: string;
  target_entity_id: string;
  action_timestamp: string;
  actor: string;
  action_summary: string;
  related_change_candidate_id?: string;
  before_state_note?: string;
  after_state_note?: string;
}

export interface SourceRegistryRow {
  source_id: string;
  source_name: string;
  source_type: string;
  source_url_or_reference: string;
  source_owner_or_publisher: string;
  harvest_method?: string;
  harvest_date?: string;
  notes_internal?: string;
}

export interface Wave1ControlSurfaceRow {
  control_row_id: string;
  parent_id?: string;
  canonical_parent_name: string;
  parent_cohort_category: string;
  au_shelf_priority_y_n: 'Y' | 'N';
  nz_shelf_priority_y_n: 'Y' | 'N';
  bbfaw_seed_asset_member_y_n: 'Y' | 'N';
  ktc_seed_asset_member_y_n: 'Y' | 'N';
  core_uat_asset_member_y_n: 'Y' | 'N';
  official_parent_brand_source_harvested_y_n: 'Y' | 'N';
  source_status: string;
  brand_population_status: string;
  alias_population_status: string;
  gtin_link_status: string;
  review_state: string;
  gap_status: string;
  next_population_action: string;
  notes_internal?: string;
}

export interface ParentExtensionCandidateRow {
  candidate_id: string;
  candidate_brand_name: string;
  candidate_parent_name: string;
  evidence_source_type: string;
  evidence_reference: string;
  retailer_or_source: string;
  category_path: string;
  candidate_state: string;
  review_outcome_note: string;
  notes_internal?: string;
}

export interface AliasHarvestCandidateRow {
  candidate_id: string;
  alias_text: string;
  alias_normalized: string;
  alias_type: string;
  alias_source_type: string;
  candidate_brand_id: string;
  candidate_canonical_brand_name: string;
  candidate_parent_id: string;
  candidate_parent_display_name: string;
  source_reference: string;
  candidate_state: string;
  review_outcome_note: string;
  notes_internal?: string;
}

export interface CatalogueAuditObservationRow {
  audit_row_id: string;
  retailer: string;
  retailer_country: string;
  department: string;
  category_path: string;
  product_title_raw: string;
  extracted_brand_candidate: string;
  normalized_brand_candidate: string;
  match_status: string;
  matched_brand_id?: string;
  matched_alias_id?: string;
  parent_extension_candidate_id?: string;
  audit_date: string;
  notes_internal?: string;
}

export interface EnumDictionaryRow {
  enum_name: string;
  enum_value: string;
}

export interface WorkstreamATemplateSet {
  [WORKSTREAM_A_FILES.CANONICAL_PARENTS]: CanonicalParentRow[];
  [WORKSTREAM_A_FILES.CANONICAL_BRANDS]: CanonicalBrandRow[];
  [WORKSTREAM_A_FILES.BRAND_ALIASES]: BrandAliasRow[];
  [WORKSTREAM_A_FILES.GTIN_BRAND_LINKS]: GtinBrandLinkRow[];
  [WORKSTREAM_A_FILES.OPERATIONAL_ENTITIES]: OperationalEntityRow[];
  [WORKSTREAM_A_FILES.OWNERSHIP_CHANGE_CANDIDATES]: OwnershipChangeCandidateRow[];
  [WORKSTREAM_A_FILES.STEWARDSHIP_ACTION_LOG]: StewardshipActionLogRow[];
  [WORKSTREAM_A_FILES.SOURCE_REGISTRY]: SourceRegistryRow[];
  [WORKSTREAM_A_FILES.ENUM_DICTIONARY]: EnumDictionaryRow[];
  [WORKSTREAM_A_FILES.WAVE1_CONTROL_SURFACE]?: Wave1ControlSurfaceRow[];
  [WORKSTREAM_A_FILES.PARENT_EXTENSION_CANDIDATES]?: ParentExtensionCandidateRow[];
  [WORKSTREAM_A_FILES.ALIAS_HARVEST_CANDIDATES]?: AliasHarvestCandidateRow[];
  [WORKSTREAM_A_FILES.CATALOGUE_AUDIT_OBSERVATIONS]?: CatalogueAuditObservationRow[];
}

