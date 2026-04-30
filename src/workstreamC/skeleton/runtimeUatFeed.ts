import type { DynamicSignalPublicationRecord } from '../../dynamicSignals/publish/types';
import type { MarketKeyResolution } from '../../contracts/phase6/enums';
import type { CsvRecord } from '../../identity/workstreamA/csv';

type ADataMapsLite = {
  brandsById: Map<string, { parent_id: string; review_state: string }>;
  parentsById: Map<string, { review_state: string }>;
};

const SIGNAL_ROWS: CsvRecord[] = [
  { signal_id: 'SIG_REG_AU_001', signal_class: 'safety_regulatory', signal_publication_state: 'publishable', review_state: 'reviewed', confidence_state: 'confirmed', resolution_status: 'resolved', source_id: 'SRC_FSANZ_RECALLS', headline: 'FSANZ recall: Nestlé MILO snack bars due to black rubber foreign matter', short_summary: 'FSANZ records a Nestlé Australia recall of selected MILO snack bar products because of the presence of foreign matter (black rubber).', editorial_review_required: 'N', editorial_review_state: 'not_required', lineage_reference: 'SRC_FSANZ_RECALLS|SIG_REG_AU_001', skeleton_notes: 'Official recall. Trigger only for the named MILO snack bar products/batches; not all Nestlé products.' },
  { signal_id: 'SIG_REG_AU_002', signal_class: 'safety_regulatory', signal_publication_state: 'publishable', review_state: 'reviewed', confidence_state: 'confirmed', resolution_status: 'resolved', source_id: 'SRC_FSANZ_RECALLS', headline: 'FSANZ recall: Nestlé Alfamino Infant Formula due to potential cereulide toxin contamination', short_summary: 'FSANZ records a recall of five batches of Nestlé Alfamino Infant Formula 400g due to potential cereulide toxin contamination.', editorial_review_required: 'N', editorial_review_state: 'not_required', lineage_reference: 'SRC_FSANZ_RECALLS|SIG_REG_AU_002', skeleton_notes: 'Official recall. Exact product/batch fixture designed to prove non-trigger for unrelated Nestlé products such as KitKat or Milo.' },
  { signal_id: 'SIG_REG_NZ_001', signal_class: 'safety_regulatory', signal_publication_state: 'publishable', review_state: 'reviewed', confidence_state: 'confirmed', resolution_status: 'resolved', source_id: 'SRC_MPI_RECALLS', headline: 'MPI recall: Pams Onion Sprouts Combo due to possible Listeria monocytogenes', short_summary: 'MPI records a recall of Southern Alp Sprouts products and Pams Onion Sprouts Combo due to possible Listeria monocytogenes.', editorial_review_required: 'N', editorial_review_state: 'not_required', lineage_reference: 'SRC_MPI_RECALLS|SIG_REG_NZ_001', skeleton_notes: 'Official NZ recall. Trigger only for Pams Onion Sprouts Combo and source-supported sprout products.' },
  { signal_id: 'SIG_REG_NZ_002', signal_class: 'safety_regulatory', signal_publication_state: 'publishable', review_state: 'reviewed', confidence_state: 'confirmed', resolution_status: 'resolved', source_id: 'SRC_MPI_RECALLS', headline: 'MPI recall: Pak’n Save Moorhouse made-in-store bread products due to possible metal foreign matter', short_summary: 'MPI records a store-specific recall of selected Pak’n Save Moorhouse made-in-store bread products due to possible metal foreign matter.', editorial_review_required: 'N', editorial_review_state: 'not_required', lineage_reference: 'SRC_MPI_RECALLS|SIG_REG_NZ_002', skeleton_notes: 'Official NZ recall. Store/product-family scope; do not show for all Foodstuffs or all Pak’n Save products.' },
  { signal_id: 'SIG_NEWS_AU_001', signal_class: 'in_the_news', signal_publication_state: 'publishable', review_state: 'reviewed', confidence_state: 'strong', resolution_status: 'resolved_with_warning', source_id: 'SRC_ABC_NEWS', headline: 'ABC: ACCC alleges Woolworths used misleading “Prices Dropped” discounts', short_summary: 'ABC reports ACCC allegations that Woolworths misled customers by using fake discounts on hundreds of items. Woolworths denies wrongdoing.', editorial_review_required: 'Y', editorial_review_state: 'approved', lineage_reference: 'SRC_ABC_NEWS|SIG_NEWS_AU_001', skeleton_notes: 'Retailer conduct fixture. Trigger only for Woolworths own-label or retailer-branded scans, not all products sold in Woolworths.' },
  { signal_id: 'SIG_NEWS_NZ_001', signal_class: 'in_the_news', signal_publication_state: 'publishable', review_state: 'reviewed', confidence_state: 'strong', resolution_status: 'resolved_with_warning', source_id: 'SRC_1NEWS_NZ', headline: '1News: NZ government moves to lift fines for misleading promotions', short_summary: '1News reports law reform to increase penalties for misleading promotions and notes recent supermarket pricing enforcement context involving Woolworths and Pak’n Save.', editorial_review_required: 'Y', editorial_review_state: 'approved', lineage_reference: 'SRC_1NEWS_NZ|SIG_NEWS_NZ_001', skeleton_notes: 'NZ retailer conduct fixture. Trigger only for relevant retailer-branded/own-label context. Use cautious wording.' },
  { signal_id: 'SIG_NEWS_GLOBAL_001', signal_class: 'in_the_news', signal_publication_state: 'publishable', review_state: 'reviewed', confidence_state: 'strong', resolution_status: 'resolved_with_warning', source_id: 'SRC_GLOBAL_WITNESS_COCOA', headline: 'Global Witness: major chocolate brands linked to Liberian deforestation-risk cocoa supply chains', short_summary: 'Global Witness reports that major chocolate brands are exposed to cocoa linked to recently cleared Liberian rainforest. Skeleton use is limited to relevant cocoa/chocolate/confectionery products.', editorial_review_required: 'Y', editorial_review_state: 'approved', lineage_reference: 'SRC_GLOBAL_WITNESS_COCOA|SIG_NEWS_GLOBAL_001', skeleton_notes: 'NGO/advocacy fixture. Not a parent-wide trigger. Use attribution-safe wording.' },
  { signal_id: 'SIG_NEWS_GLOBAL_002', signal_class: 'in_the_news', signal_publication_state: 'publishable', review_state: 'reviewed', confidence_state: 'strong', resolution_status: 'resolved_with_warning', source_id: 'SRC_RAN_MONDELEZ', headline: 'Rainforest Action Network criticises Mondelēz sustainability claims and supply-chain risks', short_summary: 'Rainforest Action Network alleges Mondelēz sustainability claims do not match supply-chain impacts affecting forests, communities and labour risks. Skeleton use is limited to named/relevant Mondelēz brands or categories.', editorial_review_required: 'Y', editorial_review_state: 'approved', lineage_reference: 'SRC_RAN_MONDELEZ|SIG_NEWS_GLOBAL_002', skeleton_notes: 'NGO/advocacy fixture. Use cautious attribution. Do not trigger for every Mondelēz product by default.' },
];

const SUBJECT_LINKS: CsvRecord[] = [
  { link_id: 'SL001', signal_id: 'SIG_REG_AU_001', subject_type: 'brand', subject_id: 'B0061', market_key: 'AU' },
  { link_id: 'SL002', signal_id: 'SIG_REG_AU_002', subject_type: 'product_family', subject_id: 'SOURCE_PRODUCT_ALFAMINO_400G', market_key: 'AU' },
  { link_id: 'SL003', signal_id: 'SIG_REG_NZ_001', subject_type: 'brand', subject_id: 'B0024', market_key: 'NZ' },
  { link_id: 'SL004', signal_id: 'SIG_REG_NZ_002', subject_type: 'brand', subject_id: 'B0020', market_key: 'NZ' },
  { link_id: 'SL005', signal_id: 'SIG_NEWS_AU_001', subject_type: 'parent', subject_id: 'P0001', market_key: 'AU' },
  { link_id: 'SL006', signal_id: 'SIG_NEWS_NZ_001', subject_type: 'parent', subject_id: 'P0001', market_key: 'NZ' },
  { link_id: 'SL007', signal_id: 'SIG_NEWS_NZ_001', subject_type: 'parent', subject_id: 'P0003', market_key: 'NZ' },
  { link_id: 'SL008', signal_id: 'SIG_NEWS_GLOBAL_001', subject_type: 'brand', subject_id: 'B0241', market_key: 'GLOBAL_CONTEXT' },
  { link_id: 'SL009', signal_id: 'SIG_NEWS_GLOBAL_001', subject_type: 'brand', subject_id: 'B0060', market_key: 'GLOBAL_CONTEXT' },
  { link_id: 'SL010', signal_id: 'SIG_NEWS_GLOBAL_001', subject_type: 'brand', subject_id: 'B0050', market_key: 'GLOBAL_CONTEXT' },
  { link_id: 'SL011', signal_id: 'SIG_NEWS_GLOBAL_002', subject_type: 'brand', subject_id: 'B0241', market_key: 'GLOBAL_CONTEXT' },
  { link_id: 'SL012', signal_id: 'SIG_NEWS_GLOBAL_002', subject_type: 'brand', subject_id: 'B0068', market_key: 'GLOBAL_CONTEXT' },
  { link_id: 'SL013', signal_id: 'SIG_NEWS_GLOBAL_002', subject_type: 'brand', subject_id: 'B0071', market_key: 'GLOBAL_CONTEXT' },
];

const UX_COPY = new Map<string, { title: string; body: string; why: string }>([
  ['SIG_NEWS_GLOBAL_001', { title: 'Global Witness links major chocolate brands to deforestation-risk cocoa supply chains.', body: 'Shown because this product is a reviewed chocolate/cocoa brand in the affected supply-chain context.', why: 'This is an NGO investigation signal, not a product safety recall. It should not imply the specific product is unsafe.' }],
  ['SIG_REG_AU_002', { title: 'FSANZ recall for Nestlé Alfamino Infant Formula 400g.', body: 'Shown because the official recall applies to this named product and listed batches.', why: 'Does not apply to unrelated Nestlé products.' }],
  ['SIG_NEWS_AU_001', { title: 'ABC reports ACCC allegations about Woolworths discount pricing practices.', body: 'Shown because the scanned item is a reviewed Woolworths own-label or retailer-branded product.', why: 'Does not apply to third-party products merely sold at Woolworths.' }],
]);

const A_DATA_LITE: ADataMapsLite = {
  brandsById: new Map([
    ['B0004', { parent_id: 'P0001', review_state: 'reviewed' }],
    ['B0007', { parent_id: 'P0001', review_state: 'reviewed' }],
    ['B0024', { parent_id: 'P0003', review_state: 'reviewed' }],
    ['B0020', { parent_id: 'P0003', review_state: 'reviewed' }],
    ['B0241', { parent_id: 'P0009', review_state: 'reviewed' }],
    ['B0069', { parent_id: 'P0009', review_state: 'reviewed' }],
    ['B0061', { parent_id: 'P0008', review_state: 'reviewed' }],
  ]),
  parentsById: new Map([
    ['P0001', { review_state: 'reviewed' }],
    ['P0003', { review_state: 'reviewed' }],
    ['P0008', { review_state: 'reviewed' }],
    ['P0009', { review_state: 'reviewed' }],
  ]),
};

const UAT_CHAIN_BY_BARCODE: Record<string, { brand_id: string; parent_id: string } | undefined> = {
  '9415556123456': { brand_id: 'B0004', parent_id: 'P0001' }, // NZ UAT_C_011
  '9300601234567': { brand_id: 'B0241', parent_id: 'P0009' }, // AU UAT_C_008
  '9310123456789': { brand_id: 'B0069', parent_id: 'P0009' }, // AU Ritz negative
};

function toInternalMarket(scanPublic: 'AU' | 'NZ' | 'UNKNOWN'): MarketKeyResolution {
  if (scanPublic === 'AU') return 'AU';
  if (scanPublic === 'NZ') return 'NZ';
  return 'AU+NZ';
}

function marketMatches(scanPublic: 'AU' | 'NZ' | 'UNKNOWN', linkMarket: string): boolean {
  if (linkMarket === 'GLOBAL_CONTEXT') return scanPublic === 'AU' || scanPublic === 'NZ';
  return linkMarket === scanPublic;
}

function editorialAllows(row: CsvRecord): boolean {
  const req = (row.editorial_review_required ?? '').toUpperCase();
  const st = row.editorial_review_state ?? '';
  return req === 'Y' ? st === 'approved' : st === 'not_required' || st === '';
}

export function isWorkstreamCSkeletonUatEnabled(): boolean {
  return process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT === '1';
}

export function buildWorkstreamCSkeletonRecordsForRuntime(input: {
  barcode: string;
  productName: string;
  scanMarketPublic: 'AU' | 'NZ' | 'UNKNOWN';
  logLines?: string[];
}): DynamicSignalPublicationRecord[] {
  if (!isWorkstreamCSkeletonUatEnabled()) return [];
  const log = input.logLines ?? [];
  const chain = UAT_CHAIN_BY_BARCODE[input.barcode];
  if (!chain) {
    log.push(`workstreamC_runtime_guard: barcode ${input.barcode} not in UAT fixture set`);
    return [];
  }
  const brand = A_DATA_LITE.brandsById.get(chain.brand_id);
  const parent = A_DATA_LITE.parentsById.get(chain.parent_id);
  if (!brand || !parent || brand.review_state !== 'reviewed' || parent.review_state !== 'reviewed') {
    log.push('chain_resolve: reviewed A-chain check failed (RT001)');
    return [];
  }
  log.push(`chain_resolve: brand_id=${chain.brand_id} parent_id=${chain.parent_id} source=injected_uat_fixture`);

  const signalById = new Map(SIGNAL_ROWS.map((r) => [r.signal_id ?? '', r]));
  const marketKey = toInternalMarket(input.scanMarketPublic);
  const out: DynamicSignalPublicationRecord[] = [];
  for (const link of SUBJECT_LINKS) {
    if (!marketMatches(input.scanMarketPublic, link.market_key ?? '')) continue;
    const st = link.subject_type ?? '';
    const sid = link.subject_id ?? '';
    if (st === 'brand' && sid !== chain.brand_id) continue;
    if (st === 'parent' && sid !== chain.parent_id) continue;
    if (st === 'product_family') {
      if (sid !== 'SOURCE_PRODUCT_ALFAMINO_400G' || !input.productName.toLowerCase().includes('alfamino')) continue;
    }
    const row = signalById.get(link.signal_id ?? '');
    if (!row) continue;
    if (!editorialAllows(row) || row.signal_publication_state !== 'publishable') continue;
    const ux = UX_COPY.get(row.signal_id ?? '');
    const dedupe_key = `p6|workstream_c_skeleton|${row.signal_id}|${link.link_id}|${input.barcode}`;
    out.push({
      signal_id: row.signal_id ?? '',
      dedupe_key,
      signal_class: row.signal_class as DynamicSignalPublicationRecord['signal_class'],
      signal_publication_state: 'publishable',
      resolution_key: { gtin: input.barcode, market_key: marketKey },
      state: {
        confidence_state: row.confidence_state as DynamicSignalPublicationRecord['state']['confidence_state'],
        review_state: row.review_state as DynamicSignalPublicationRecord['state']['review_state'],
        resolution_status: row.resolution_status as DynamicSignalPublicationRecord['state']['resolution_status'],
      },
      lineage_reference: row.lineage_reference ?? `phase6:pub:signal:${row.signal_id}`,
      source_system: row.source_id,
      source_record_id: row.source_id,
      source_idempotency_key: `workstream_c_skeleton|${row.signal_id}|${link.link_id}`,
      staleness: { valid_until: '2099-12-31T00:00:00.000Z' },
      editorial: { priority: 0, due_at: null, last_reviewed_at: null },
      mislink: { open_report_count: 0, last_event_at: null },
      skeleton_card_copy: {
        title_display: ux?.title ?? row.headline ?? row.signal_id ?? '',
        body_display: ux?.body ?? row.short_summary ?? '',
        why_display: ux?.why ?? row.skeleton_notes ?? '',
      },
    });
    log.push(`match: link=${link.link_id} signal=${row.signal_id} market_link=${link.market_key} GLOBAL_CONTEXT=narrow_eligibility_only`);
  }
  log.push(`attach: built ${out.length} publication record(s)`);
  return out;
}
