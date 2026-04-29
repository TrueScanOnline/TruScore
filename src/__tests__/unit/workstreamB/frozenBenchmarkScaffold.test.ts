import fs from 'fs';
import path from 'path';
import { loadWorkstreamBPackFromCsv } from '../../../workstreamB/frozenBenchmarkHardening/bDataLoader';
import {
  validateWorkstreamBPack,
  assembleFrozenBenchmarkAttributionFromBData,
  runFreezeGuardDiagnostics,
  runScoringReadDiagnostics,
  minimalSharedIdentityStub,
  WORKSTREAM_B_FILES,
} from '../../../workstreamB/frozenBenchmarkHardening';
import { writeTemplatePack, runWorkstreamBScaffold } from '../../../workstreamB/frozenBenchmarkHardening/bScaffoldRunner';
import { entityFromRecord } from '../../../workstreamB/frozenBenchmarkHardening/bDataTypes';
import type { ProductWithTrustScore } from '../../../types/product';

describe('Workstream B frozen benchmark scaffold', () => {
  const root = path.resolve(__dirname, '..', '..', '..', '..');
  const populatedPack = path.join(root, 'workstreamB', 'b-data', 'populated-from-repo-v0');

  it('validates populated-from-repo pack without errors', () => {
    const load = loadWorkstreamBPackFromCsv(populatedPack);
    expect(load.missingRequiredFiles.length).toBe(0);
    const v = validateWorkstreamBPack({ mode: 'populated', rowsByFile: load.rowsByFile });
    expect(v.ok).toBe(true);
    expect(v.correction_row_count).toBe(0);
    expect(v.crosswalk_absent).toBe(true);
  });

  it('assembler uses B-Data owner fields only (no A inference)', () => {
    const load = loadWorkstreamBPackFromCsv(populatedPack);
    const releases = load.rowsByFile[WORKSTREAM_B_FILES.BENCHMARK_RELEASES] ?? [];
    const ent = entityFromRecord(load.rowsByFile[WORKSTREAM_B_FILES.BENCHMARK_ENTITIES]![0]);
    const frozen = assembleFrozenBenchmarkAttributionFromBData({
      releaseRows: releases,
      entity: ent,
      subjectCanonicalBrandId: 'test:brand',
      lineageToken: 'unit-test',
    });
    expect(frozen).not.toBeNull();
    expect(frozen!.subject_resolution.benchmark_owner_entity_id).toBe(ent.benchmark_owner_entity_id);
    expect(frozen!.subject_resolution.benchmark_owner_legal_name).toBe(ent.benchmark_owner_legal_name);
  });

  it('freeze guard diagnostics register + block in-place + supersede', () => {
    const load = loadWorkstreamBPackFromCsv(populatedPack);
    const releases = load.rowsByFile[WORKSTREAM_B_FILES.BENCHMARK_RELEASES] ?? [];
    const ent = entityFromRecord(load.rowsByFile[WORKSTREAM_B_FILES.BENCHMARK_ENTITIES]![0]);
    const d = runFreezeGuardDiagnostics({ releaseRows: releases, sampleEntity: ent, correction_row_count: 0 });
    expect(d.register_initial_ok).toBe(true);
    expect(d.in_place_blocked).toBe(true);
    expect(d.supersede_ok).toBe(true);
  });

  it('scoring-read diagnostics show frozen gate when ineligible', () => {
    const load = loadWorkstreamBPackFromCsv(populatedPack);
    const releases = load.rowsByFile[WORKSTREAM_B_FILES.BENCHMARK_RELEASES] ?? [];
    const ent = entityFromRecord(load.rowsByFile[WORKSTREAM_B_FILES.BENCHMARK_ENTITIES]![0]);
    const ineligible = assembleFrozenBenchmarkAttributionFromBData({
      releaseRows: releases,
      entity: ent,
      subjectCanonicalBrandId: 'b:x',
      lineageToken: 't',
      overrides: { review_state: 'provisional', resolution_status: 'needs_review', blocker_flags: ['needs_review'] },
    });
    const product = {
      barcode: '1',
      product_name: 'p',
      brands: ent.display_name,
      brand_owner: ent.benchmark_owner_legal_name,
      labels_tags: [],
      ingredients_text: '',
      ingredients_analysis_tags: [],
      additives_tags: [],
      nutriments: {},
      source: 'test',
      _shared_identity_context: minimalSharedIdentityStub('x'),
      _frozen_benchmark_attribution: ineligible!,
    } as ProductWithTrustScore;
    const r = runScoringReadDiagnostics([{ label: 't', product }]);
    expect(r.cases[0].frozen_gate_adjustment_applied).toBe(true);
    expect(r.cases[0].score).toBe(15);
  });

  it('writes template pack and runs scaffold smoke', () => {
    const tmp = path.join(root, 'workstreamB', 'b-data', 'smoke-pack-v0');
    writeTemplatePack(tmp);
    const result = runWorkstreamBScaffold(tmp, { mode: 'template' });
    expect(fs.existsSync(result.validationSummaryPath)).toBe(true);
  });
});
