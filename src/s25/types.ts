/**
 * S25 — About these Additives types (catalogue MVP v0.7).
 * Presentation-only; does not affect Body/Open scoring.
 */

export type S25PresentationTreatment = 'STANDARD' | 'BODY6_EXISTING' | string;
export type S25SourcePreparationRenderMode =
  | 'STANDARD_PROFILE_AND_COPY'
  | 'BODY6_EXISTING_CONTENT'
  | string;
export type S25CodeDetectionScope =
  | 'STRUCTURED_ADDITIVE_TAG_OR_EXPLICIT_E_INS_OR_DECLARED_CLASS_CODE'
  | 'NAME_ONLY'
  | string;
export type S25NameDetectionScope = 'WITHIN_DECLARED_ADDITIVE_CONTEXT' | string;
export type S25ClassRenderMode = 'EXPLAIN' | 'LABEL_ONLY' | string;

export interface S25CatalogueEntry {
  additive_id: string;
  schedule8_code: string | null;
  schedule8_names: string;
  consumer_display_name: string;
  entry_title: string;
  body6_existing: boolean;
  presentation_treatment: S25PresentationTreatment;
  tile_summary: string;
  expanded_summary: string;
  source_preparation_profile: string;
  source_preparation_render_mode: S25SourcePreparationRenderMode;
  source_preparation_copy: string;
  fact_1_label: string;
  fact_1_copy: string;
  fact_2_label: string;
  fact_2_copy: string;
  fact_3_label: string;
  fact_3_copy: string;
  name_aliases: string[];
  code_aliases: string[];
  code_detection_enabled: boolean;
  code_detection_scope: S25CodeDetectionScope;
  bare_numeric_requires_declared_additive_context: boolean;
  name_detection_enabled: boolean;
  name_detection_scope: S25NameDetectionScope;
  evidence_enabled: boolean;
  evidence_copy: string;
  evidence_source_count: number;
  evidence_source_1_link_label: string;
  evidence_source_1_url: string;
  evidence_source_2_link_label: string;
  evidence_source_2_url: string;
}

export interface S25ClassEntry {
  class_id: string;
  parser_terms: string[];
  consumer_label: string;
  consumer_purpose_copy: string;
  render_mode: S25ClassRenderMode;
}

export interface S25SourceProfile {
  profile_id: string;
  consumer_label: string;
  glyph_key: string;
  glyph_brief: string;
  consumer_definition: string;
  consumer_examples: string;
}

export type S25SurfaceCopy = Record<string, string>;

export interface S25DetectionHit {
  additiveId: string;
  /** First reliable character index in ingredients text; null if only tag/stable order. */
  position: number | null;
  source: 'body6_ledger' | 'structured_tag' | 'explicit_code' | 'declared_class_code' | 'name';
}

export interface S25RenderListItem {
  additiveId: string;
  entry: S25CatalogueEntry;
  /** Declared class matched from product ingredient context, if any. */
  declaredClass: S25ClassEntry | null;
  isBody6: boolean;
  /** Colour-family members share one list slot for presentation when multiple fire. */
  colourGroupIds?: string[];
}

export interface S25MergedDetection {
  body6Ids: string[];
  standardIds: string[];
  renderedAdditiveIds: string[];
  /** Ordered list IDs for UI (colour group collapses to earliest colour id as anchor). */
  orderedListAnchors: string[];
  hits: S25DetectionHit[];
}

/** Body ledger ID → canonical S25 additive_id. */
export const BODY6_LEDGER_TO_CANONICAL: Readonly<Record<string, string>> = {
  'body-v12-additive-e102': 'e102',
  'body-v12-additive-e110': 'e110',
  'body-v12-additive-e129': 'e129',
  'body-v12-additive-e171': 'e171',
  'body-v12-additive-e250': 'e250',
  'body-v12-additive-e951': 'e951',
};

export const S25_COLOUR_CANONICAL_IDS = ['e102', 'e110', 'e129'] as const;
