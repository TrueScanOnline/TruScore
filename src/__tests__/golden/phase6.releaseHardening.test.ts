import fs from 'fs';
import path from 'path';
import { buildProductScanResult } from '../../services/buildProductScanResult';
import { resolveSharedIdentityContext } from '../../identity/resolveSharedIdentityContext';
import { selectBenchmarkSnapshot } from '../../benchmark/snapshotSelect';
import { materializeFrozenBenchmarkAttribution } from '../../benchmark/materializeFrozenBenchmarkAttribution';
import {
  PHASE6_FIXTURES,
  PHASE6_FIXTURE_PACK_VERSION,
  PHASE6_FIXTURE_SCHEMA_ID,
} from '../fixtures/phase6/fixtures';
import type { Phase6FixtureCase, Phase6GateLevel } from '../fixtures/phase6/types';
import type { AlertsPreferences } from '../../store/useAlertsStore';

const PREFS: AlertsPreferences = {
  israelPalestine: 'neutral',
  indiaChina: 'neutral',
  avoidAnimalTesting: false,
  avoidForcedLabour: false,
  avoidPalmOil: false,
  geopoliticalEnabled: false,
  ethicalEnabled: false,
  environmentalEnabled: false,
};

type FixtureResult = {
  fixture_id: string;
  severity: 'P0' | 'P1';
  layer: string;
  gate_tags: string[];
  passed: boolean;
  reasons: string[];
  output: {
    market: 'AU' | 'NZ' | 'UNKNOWN';
    signal_ids_ordered: string[];
    has_legacy_banner_signals: boolean;
  };
};

function flattenSignalIds(result: ReturnType<typeof buildProductScanResult>['result']): string[] {
  return [
    ...result.signals.safety_regulatory,
    ...result.signals.transparency,
    ...result.signals.user_preference,
    ...result.signals.premium_insight,
  ].map((s) => s.id);
}

function hasLegacyFeederSignals(result: ReturnType<typeof buildProductScanResult>['result']): boolean {
  const ids = flattenSignalIds(result);
  return ids.some((id) => id.includes('transparency-web-search') || id.includes('transparency-limited-data'));
}

function runFixture(fx: Phase6FixtureCase): FixtureResult {
  const nowMs = new Date(fx.clock_iso).getTime();
  const identity = resolveSharedIdentityContext({
    gtin: fx.input.barcode,
    product: fx.input.product,
    marketHint: fx.input.marketHint,
  });
  const { result } = buildProductScanResult({
    barcode: fx.input.barcode,
    market: fx.input.marketHint,
    product: fx.input.product,
    userPreferences: PREFS,
    isSubscriber: false,
    terminal_state: 'success',
    nowMs,
    dynamicSignalRecords: fx.input.dynamic_records,
  });
  const signalIds = flattenSignalIds(result);
  const reasons: string[] = [];
  if (result.market !== fx.expected.public_market) {
    reasons.push(`market_mismatch expected=${fx.expected.public_market} actual=${result.market}`);
  }
  if (identity.public_market !== fx.expected.public_market) {
    reasons.push(`identity_public_market_mismatch expected=${fx.expected.public_market} actual=${identity.public_market}`);
  }
  if (fx.expected.publishable_signal_ids.join('|') !== signalIds.join('|')) {
    reasons.push(`signal_order_mismatch expected=${fx.expected.publishable_signal_ids.join(',')} actual=${signalIds.join(',')}`);
  }
  for (const id of fx.expected.disallowed_signal_ids) {
    if (signalIds.includes(id)) reasons.push(`disallowed_signal_present:${id}`);
  }
  if (typeof fx.expected.has_legacy_banner_signals === 'boolean') {
    const hasLegacy = hasLegacyFeederSignals(result);
    if (hasLegacy !== fx.expected.has_legacy_banner_signals) {
      reasons.push(`legacy_feeder_mismatch expected=${fx.expected.has_legacy_banner_signals} actual=${hasLegacy}`);
    }
  }
  if (typeof fx.expected.frozen_ethics_scoring_eligible === 'boolean') {
    if (!fx.input.frozen_probe) {
      reasons.push('frozen_probe_missing_for_expected_frozen_ethics_scoring_eligible');
    } else {
      const snapshot = selectBenchmarkSnapshot(fx.input.frozen_probe.benchmark_name);
      const frozen = materializeFrozenBenchmarkAttribution({
        snapshot,
        benchmarkName: fx.input.frozen_probe.benchmark_name,
        product: fx.input.product,
        sharedIdentityContext: identity.context,
        reviewState: fx.input.frozen_probe.review_state,
        resolutionStatus: fx.input.frozen_probe.resolution_status,
        blockerFlags: fx.input.frozen_probe.blocker_flags,
      });
      if (frozen.eligibility.ethics_scoring_eligible !== fx.expected.frozen_ethics_scoring_eligible) {
        reasons.push(
          `frozen_eligibility_mismatch expected=${fx.expected.frozen_ethics_scoring_eligible} actual=${frozen.eligibility.ethics_scoring_eligible}`
        );
      }
    }
  }
  return {
    fixture_id: fx.id,
    severity: fx.severity,
    layer: fx.layer,
    gate_tags: fx.gate_tags,
    passed: reasons.length === 0,
    reasons,
    output: {
      market: result.market,
      signal_ids_ordered: signalIds,
      has_legacy_banner_signals: hasLegacyFeederSignals(result),
    },
  };
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

describe('Phase 6 release hardening (Slice 7)', () => {
  it('runs fixture pack and emits gate/baseline artifacts', () => {
    const gateLevel = (process.env.PHASE6_GATE_LEVEL as Phase6GateLevel | undefined) ?? 'merge';
    const out = PHASE6_FIXTURES.map(runFixture);
    const reportDir = path.resolve(process.cwd(), 'reports/phase6');
    ensureDir(reportDir);

    const summary = {
      fixture_pack_version: PHASE6_FIXTURE_PACK_VERSION,
      fixture_schema_id: PHASE6_FIXTURE_SCHEMA_ID,
      gate_level: gateLevel,
      totals: {
        total: out.length,
        passed: out.filter((x) => x.passed).length,
        failed: out.filter((x) => !x.passed).length,
        p0_failed: out.filter((x) => x.severity === 'P0' && !x.passed).length,
        p1_failed: out.filter((x) => x.severity === 'P1' && !x.passed).length,
      },
      gate_status: {
        A: out.filter((x) => x.gate_tags.includes('A') && !x.passed).length === 0,
        B: out.filter((x) => x.gate_tags.includes('B') && !x.passed).length === 0,
        C: out.filter((x) => x.gate_tags.includes('C') && !x.passed).length === 0,
        D: out.filter((x) => x.gate_tags.includes('D') && !x.passed).length === 0,
        E: out.filter((x) => x.gate_tags.includes('E') && !x.passed).length === 0,
      },
      fixtures: out,
      generated_at: new Date().toISOString(),
    };

    fs.writeFileSync(
      path.join(reportDir, 'fixture_run_summary.json'),
      JSON.stringify(summary, null, 2),
      'utf8'
    );

    const baselineDir = path.resolve(process.cwd(), 'src/__tests__/fixtures/phase6/baseline');
    ensureDir(baselineDir);
    const baselinePath = path.join(baselineDir, 'phase6-baseline.v1.json');
    const baselinePayload = {
      fixture_pack_version: PHASE6_FIXTURE_PACK_VERSION,
      fixture_schema_id: PHASE6_FIXTURE_SCHEMA_ID,
      fixtures: out.map((x) => ({
        fixture_id: x.fixture_id,
        passed: x.passed,
        output: x.output,
      })),
    };

    if (process.env.PHASE6_UPDATE_BASELINE === '1' || !fs.existsSync(baselinePath)) {
      fs.writeFileSync(baselinePath, JSON.stringify(baselinePayload, null, 2), 'utf8');
    }

    const expectedBaseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    const releaseDiff = {
      fixture_pack_version: PHASE6_FIXTURE_PACK_VERSION,
      fixture_schema_id: PHASE6_FIXTURE_SCHEMA_ID,
      matches_baseline: JSON.stringify(expectedBaseline) === JSON.stringify(baselinePayload),
      baseline_path: baselinePath,
      generated_at: new Date().toISOString(),
      diffs:
        JSON.stringify(expectedBaseline) === JSON.stringify(baselinePayload)
          ? []
          : out.map((x) => ({
              fixture_id: x.fixture_id,
              actual: x,
            })),
    };
    fs.writeFileSync(
      path.join(reportDir, 'release_comparison_diff.json'),
      JSON.stringify(releaseDiff, null, 2),
      'utf8'
    );

    // Gate enforcement by stage:
    // merge => P0 only; RC/public => P0 and P1.
    expect(summary.totals.p0_failed).toBe(0);
    if (gateLevel === 'release_candidate' || gateLevel === 'public_release') {
      expect(summary.totals.p1_failed).toBe(0);
    }
    expect(releaseDiff.matches_baseline).toBe(true);
  });
});

