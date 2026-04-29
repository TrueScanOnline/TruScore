export const WORKSTREAM_A_REVIEW_STATES = [
  'seeded',
  'provisional',
  'reviewed',
  'disputed',
  'archived',
] as const;

export const WORKSTREAM_A_PARENT_TYPES = [
  'public_company',
  'private_company',
  'cooperative',
  'state_owned',
  'other',
] as const;

export const WORKSTREAM_A_PARENT_OPERATING_ROLES = [
  'retailer',
  'manufacturer',
  'brand_owner',
  'mixed',
  'other',
] as const;

export const WORKSTREAM_A_PARENT_COHORT_CATEGORIES = [
  'supermarket_retailer_parent',
  'global_food_beverage_parent',
  'regional_food_beverage_parent',
  'category_specialist_parent',
] as const;

export const WORKSTREAM_A_BRAND_TYPES = [
  'global_brand',
  'local_brand',
  'retailer_own_label',
  'brand_family',
] as const;

export const WORKSTREAM_A_ALIAS_TYPES = [
  'spelling_variation',
  'punctuation_variation',
  'casing_variation',
  'short_form',
  'common_shorthand',
  'packaging_variation',
  'retailer_listing_variation',
  'local_market_variant',
  'legacy_brand_name',
  'imported_seed_alias',
  'off_observed_alias',
] as const;

export const WORKSTREAM_A_ALIAS_SOURCE_TYPES = [
  'official_parent_brand_page',
  'official_brand_page',
  'retailer_product_page',
  'retailer_own_brand_page',
  'off_brand_field',
  'off_product_name_field',
  'off_packaging_or_label_text',
  'off_user_submission_observation',
  'packaging_observation',
  'imported_bbfaw_seed',
  'imported_ktc_seed',
  'manual_stewardship',
  'product_specification_document',
  'retailer_catalogue_audit',
  'other',
] as const;

export const WORKSTREAM_A_PRODUCT_LINK_SOURCE_TYPES = [
  'off',
  'manual_review',
  'retailer_data',
  'packaging_observation',
  'imported_seed',
  'retailer_catalogue_audit',
  'other',
] as const;

export const WORKSTREAM_A_OPERATIONAL_ENTITY_TYPES = [
  'manufacturer',
  'importer',
  'distributor',
  'licensee',
] as const;

export const WORKSTREAM_A_OPERATIONAL_USE_CASE_REASONS = [
  'recall_matching',
  'safety_regulatory_matching',
  'major_signal_relevance',
] as const;

export const WORKSTREAM_A_CHANGE_TRIGGER_SOURCE_TYPES = [
  'corporate_press_release',
  'stock_exchange_announcement',
  'official_brand_page',
  'official_company_portfolio_page',
  'analyst_or_manual_detection',
  'other',
] as const;

export const WORKSTREAM_A_CHANGE_CANDIDATE_STATES = [
  'detected',
  'under_review',
  'approved',
  'rejected',
  'archived',
] as const;

export const WORKSTREAM_A_CANDIDATE_STATES = [
  'candidate',
  'promoted',
  'rejected',
  'parked',
  'insufficient_source',
] as const;

export const WORKSTREAM_A_STEWARDSHIP_ACTION_TYPES = [
  'create',
  'update',
  'alias_add',
  'alias_remove',
  'ownership_change_approved',
  'ownership_change_rejected',
  'archive',
  'review_state_change',
  'merge_entities',
  'split_entities',
  'candidate_promoted',
  'candidate_rejected',
] as const;

export const WORKSTREAM_A_MATCH_STATUSES = [
  'matched_canonical_brand',
  'matched_alias',
  'parent_known_brand_missing',
  'parent_unknown',
  'insufficient_source',
  'excluded_non_food_beverage',
  'duplicate_or_rejected',
] as const;

export const WORKSTREAM_A_ENUM_DICTIONARY = {
  review_state: WORKSTREAM_A_REVIEW_STATES,
  parent_type: WORKSTREAM_A_PARENT_TYPES,
  parent_operating_role: WORKSTREAM_A_PARENT_OPERATING_ROLES,
  parent_cohort_category: WORKSTREAM_A_PARENT_COHORT_CATEGORIES,
  brand_type: WORKSTREAM_A_BRAND_TYPES,
  alias_type: WORKSTREAM_A_ALIAS_TYPES,
  alias_source_type: WORKSTREAM_A_ALIAS_SOURCE_TYPES,
  product_link_source_type: WORKSTREAM_A_PRODUCT_LINK_SOURCE_TYPES,
  operational_entity_type: WORKSTREAM_A_OPERATIONAL_ENTITY_TYPES,
  operational_use_case_reason: WORKSTREAM_A_OPERATIONAL_USE_CASE_REASONS,
  change_trigger_source_type: WORKSTREAM_A_CHANGE_TRIGGER_SOURCE_TYPES,
  change_candidate_state: WORKSTREAM_A_CHANGE_CANDIDATE_STATES,
  candidate_state: WORKSTREAM_A_CANDIDATE_STATES,
  stewardship_action_type: WORKSTREAM_A_STEWARDSHIP_ACTION_TYPES,
  catalogue_match_status: WORKSTREAM_A_MATCH_STATUSES,
} as const;

export type EnumDictionaryName = keyof typeof WORKSTREAM_A_ENUM_DICTIONARY;
