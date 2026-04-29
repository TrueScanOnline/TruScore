import {
  WORKSTREAM_A_FILES,
  buildCoverageScorecard,
  buildEnumDictionaryRows,
  buildIdentityGapReport,
  buildTemplateCsvMap,
  validateWorkstreamAPack,
} from '../../../identity/workstreamA';

function baseRows() {
  return {
    [WORKSTREAM_A_FILES.CANONICAL_PARENTS]: [
      {
        parent_id: 'parent:nestle',
        canonical_parent_name: 'Nestle S.A.',
        display_parent_name: 'Nestle',
        parent_type: 'public_company',
        review_state: 'reviewed',
        primary_source_type: 'official_company_portfolio_page',
        primary_source_name: 'Nestle brands page',
        primary_source_id: 'src:nestle-brands',
        primary_source_url_or_reference: '',
        substantiation_note: 'Confirmed from official brand portfolio.',
        parent_operating_role: 'brand_owner',
      },
    ],
    [WORKSTREAM_A_FILES.CANONICAL_BRANDS]: [
      {
        brand_id: 'brand:kitkat',
        canonical_brand_name: 'KitKat',
        display_brand_name: 'KitKat',
        parent_id: 'parent:nestle',
        parent_display_name: 'Nestle',
        brand_type: 'global_brand',
        review_state: 'reviewed',
        primary_source_type: 'official_brand_page',
        primary_source_name: 'KitKat brand page',
        primary_source_id: 'src:kitkat-brand',
        primary_source_url_or_reference: '',
        substantiation_note: 'Brand explicitly listed under Nestle.',
      },
    ],
    [WORKSTREAM_A_FILES.BRAND_ALIASES]: [
      {
        alias_id: 'alias:kit-kat',
        alias_text: 'Kit-Kat',
        alias_normalized: 'kit kat',
        alias_type: 'punctuation_variation',
        alias_source_type: 'manual_stewardship',
        brand_id: 'brand:kitkat',
        canonical_brand_name: 'KitKat',
        parent_id: 'parent:nestle',
        parent_display_name: 'Nestle',
        review_state: 'reviewed',
        source_reference: 'manual-review-1',
        source_id: 'src:manual-review',
      },
    ],
    [WORKSTREAM_A_FILES.GTIN_BRAND_LINKS]: [
      {
        gtin: '9300601249114',
        brand_id: 'brand:kitkat',
        parent_id: 'parent:nestle',
        link_review_state: 'reviewed',
        source_type: 'packaging_observation',
        source_reference: 'pack-photo-9300601249114',
        source_id: 'src:pack-photo',
      },
    ],
    [WORKSTREAM_A_FILES.OPERATIONAL_ENTITIES]: [],
    [WORKSTREAM_A_FILES.OWNERSHIP_CHANGE_CANDIDATES]: [],
    [WORKSTREAM_A_FILES.STEWARDSHIP_ACTION_LOG]: [],
    [WORKSTREAM_A_FILES.SOURCE_REGISTRY]: [
      {
        source_id: 'src:nestle-brands',
        source_name: 'Nestle Portfolio',
        source_type: 'official_company_portfolio_page',
        source_url_or_reference: 'https://www.nestle.com/brands',
        source_owner_or_publisher: 'Nestle',
      },
      {
        source_id: 'src:kitkat-brand',
        source_name: 'KitKat Brand',
        source_type: 'official_brand_page',
        source_url_or_reference: 'https://www.kitkat.com',
        source_owner_or_publisher: 'Nestle',
      },
      {
        source_id: 'src:manual-review',
        source_name: 'Internal review',
        source_type: 'manual_stewardship',
        source_url_or_reference: 'manual:review-1',
        source_owner_or_publisher: 'TrueScan',
      },
      {
        source_id: 'src:pack-photo',
        source_name: 'Pack photo',
        source_type: 'packaging_observation',
        source_url_or_reference: 'pack-photo:9300601249114',
        source_owner_or_publisher: 'TrueScan',
      },
    ],
    [WORKSTREAM_A_FILES.ENUM_DICTIONARY]: buildEnumDictionaryRows(),
  };
}

describe('Workstream A A5 scaffolding', () => {
  it('builds CSV templates for required and optional files', () => {
    const templates = buildTemplateCsvMap();
    expect(Object.keys(templates)).toContain(WORKSTREAM_A_FILES.CANONICAL_PARENTS);
    expect(Object.keys(templates)).toContain(WORKSTREAM_A_FILES.CATALOGUE_AUDIT_OBSERVATIONS);
    expect(templates[WORKSTREAM_A_FILES.ENUM_DICTIONARY]).toContain('enum_name,enum_value');
  });

  it('validates populated pack with strict source linkage', () => {
    const result = validateWorkstreamAPack({
      mode: 'populated',
      rowsByFile: baseRows(),
    });
    expect(result.issues.filter((i) => i.level === 'error')).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('detects gtin and alias-parent integrity failures', () => {
    const rows = baseRows();
    rows[WORKSTREAM_A_FILES.GTIN_BRAND_LINKS][0].gtin = 'bad';
    rows[WORKSTREAM_A_FILES.BRAND_ALIASES][0].parent_id = 'parent:wrong';
    const result = validateWorkstreamAPack({
      mode: 'populated',
      rowsByFile: rows,
    });
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.rule === 'gtin_validation')).toBe(true);
    expect(result.issues.some((i) => i.rule === 'brand_first_alias_validation')).toBe(true);
  });

  it('generates coverage and gap reports from row sets', () => {
    const rows = baseRows();
    const coverage = buildCoverageScorecard({ rowsByFile: rows });
    const gap = buildIdentityGapReport({ rowsByFile: rows, topGapNotes: ['No gaps in sample'] });
    expect(coverage.canonical_parent_count).toBe(1);
    expect(coverage.catalogue_audit_summary.total_rows).toBe(0);
    expect(gap.top_gap_notes).toContain('No gaps in sample');
  });
});

