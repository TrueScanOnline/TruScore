/**
 * Phase C Dynamic Signals refresh — source CSV integrity (predecessors, successors, new records, targets).
 * Does not regenerate or assert on the runtime embed.
 */

import fs from 'fs';
import path from 'path';
import { parseCsv } from '../../../identity/workstreamA/csv';

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const PACK = path.join(ROOT, 'workstreamC', 'c-data', 'dynamic-signals-v0.3', 'input');

const PREDECESSOR_IDS = [
  'SIG-SR-AU-001',
  'SIG-SR-AU-002',
  'SIG-SR-NZ-002',
  'SIG-SR-AU-003',
  'SIG-IN-AU-001',
  'SIG-IN-AU-002',
  'SIG-IN-AU-003',
  'SIG-IN-AU-004',
  'SIG-IN-AU-005',
  'SIG-IN-GL-001',
  'SIG-IN-NZ-001',
  'SIG-IN-NZ-002',
  'SIG-IN-NZ-003',
  'SIG-IN-GL-002',
  'SIG-IN-NZ-004',
  'SIG-IN-NZ-005',
  'SIG-SR-NZ-003',
  'SIG-SR-AU-004',
] as const;

const NEW_IDS = [
  'SIG-SR-AU-005',
  'SIG-SR-AU-006',
  'SIG-SR-AU-007',
  'SIG-SR-AU-008',
  'SIG-SR-NZ-004',
  'SIG-SR-NZ-005',
  'SIG-SR-NZ-006',
  'SIG-IN-GL-003',
] as const;

const NEW_HEADLINES: Record<(typeof NEW_IDS)[number], string> = {
  'SIG-SR-AU-005': 'Recall: Red Hat Cookia Matcha Chocolate Flavor 80g',
  'SIG-SR-AU-006': 'Recall: JC Seafood Sweet Chilli and Lime Salmon Portions 275g',
  'SIG-SR-AU-007': 'Recall: selected Austral Herbs peppermint leaf packs',
  'SIG-SR-AU-008': 'Recall: Brie Mon Sire 1kg',
  'SIG-SR-NZ-004': 'Recall: Dongwon Fried Bean Curd 340g',
  'SIG-SR-NZ-005': 'Recall: Woolworths Multi Grain Cereal 500g',
  'SIG-SR-NZ-006': 'Recall: selected Mon Sire Brie packs',
  'SIG-IN-GL-003': 'Global Witness reports Mondelez lobbying on EU deforestation rules',
};

const SIGNAL_COLS = 30;

describe('Phase C Dynamic Signals source refresh', () => {
  const signals = parseCsv(fs.readFileSync(path.join(PACK, 'signals.csv'), 'utf8'));
  const targets = parseCsv(fs.readFileSync(path.join(PACK, 'signal_targets.csv'), 'utf8'));

  it('predecessor rows have 30 columns and empty expires_at', () => {
    const preds = signals.filter((s) =>
      (PREDECESSOR_IDS as readonly string[]).includes(s.signal_id ?? '')
    );
    expect(preds).toHaveLength(18);
    for (const p of preds) {
      expect(Object.keys(p).length).toBe(SIGNAL_COLS);
      expect((p.expires_at ?? '').trim()).toBe('');
      expect((p.supersedes_signal_id ?? '').trim()).toBe('');
      expect((p.lineage_reference ?? '').trim().length).toBeGreaterThan(0);
      expect((p.rationale_summary ?? '').trim().length).toBeGreaterThan(0);
      expect((p.evidence_policy_version ?? '').trim()).toMatch(/^RVEEL-SIGNALS-MVP-2026-08/);
      expect(p.signal_publication_state).not.toBe('publishable');
    }
  });

  it('successors use -20260918 ids, supersede predecessors, single publishable head per dedupe', () => {
    const byDedupe = new Map<string, typeof signals>();
    for (const s of signals) {
      const key = s.dedupe_key ?? '';
      const list = byDedupe.get(key) ?? [];
      list.push(s);
      byDedupe.set(key, list);
    }

    for (const predId of PREDECESSOR_IDS) {
      const succId = `${predId}-20260918`;
      const pred = signals.find((s) => s.signal_id === predId);
      const succ = signals.find((s) => s.signal_id === succId);
      expect(pred).toBeDefined();
      expect(succ).toBeDefined();
      expect(succ!.dedupe_key).toBe(pred!.dedupe_key);
      expect(succ!.supersedes_signal_id).toBe(predId);
      expect(succ!.expires_at).toBe('2026-12-31');
      expect(succ!.evidence_policy_version).toBe('RVEEL-SIGNALS-MVP-2026-09-v0.4');
    }

    for (const [dedupe, rows] of byDedupe) {
      if (!dedupe) continue;
      const publishable = rows.filter((r) => r.signal_publication_state === 'publishable');
      expect(publishable.length).toBeLessThanOrEqual(1);
      if (publishable.length === 1) {
        const head = publishable[0].signal_id ?? '';
        const ok =
          head.endsWith('-20260918') || (NEW_IDS as readonly string[]).includes(head);
        expect(ok).toBe(true);
      }
    }
  });

  it('eight new signal IDs present with exact headlines', () => {
    for (const id of NEW_IDS) {
      const row = signals.find((s) => s.signal_id === id);
      expect(row).toBeDefined();
      expect(row!.signal_headline).toBe(NEW_HEADLINES[id]);
      expect(row!.evidence_policy_version).toBe('RVEEL-SIGNALS-MVP-2026-09-v0.4');
      expect(row!.detected_at).toBe('2026-09-18');
      expect(row!.reviewed_at).toBe('2026-09-18');
    }
  });

  it('Mon Sire AU/NZ targets remain market-separated exact scopes', () => {
    const au = targets.find((t) => t.signal_id === 'SIG-SR-AU-008');
    const nz = targets.find((t) => t.signal_id === 'SIG-SR-NZ-006');
    expect(au).toBeDefined();
    expect(nz).toBeDefined();
    expect(au!.market_key).toBe('AU');
    expect(nz!.market_key).toBe('NZ');
    expect(au!.propagation_mode).toBe('exact_only');
    expect(au!.canonical_target_id ?? '').toBe('');
    expect(au!.resolution_status).toBe('needs_review');
    // NZ may resolve to NZ-only family — must not share AU canonical
    expect(nz!.canonical_target_id).not.toBe(au!.canonical_target_id || 'P0009');
    expect((nz!.scope_review_summary ?? '').toLowerCase()).toMatch(/never cross|nz-only|sabato/);
    expect((au!.scope_review_summary ?? '').toLowerCase()).toMatch(/au-only|must not cross|foodland/);
  });

  it('SIG-IN-GL-003 Mondelez target is P0009 entity_descendants without cocoa guard', () => {
    const tgt = targets.find((t) => t.signal_id === 'SIG-IN-GL-003');
    expect(tgt).toBeDefined();
    expect(tgt!.canonical_target_id).toBe('P0009');
    expect(tgt!.propagation_mode).toBe('entity_descendants');
    expect(tgt!.target_type).toBe('entity');
    expect(tgt!.resolution_status).toBe('resolved');
    expect((tgt!.product_scope_guard ?? '').trim()).toBe('');
    expect(tgt!.market_key).toBe('AU+NZ');

    const sig = signals.find((s) => s.signal_id === 'SIG-IN-GL-003');
    expect(sig!.signal_publication_state).toBe('publishable');
    expect(sig!.editorial_review_state).toBe('approved');
  });

  it('GL-001/GL-002 successor targets retain cocoa_chocolate guard', () => {
    const cocoa = targets.filter(
      (t) =>
        (t.signal_id === 'SIG-IN-GL-001-20260918' || t.signal_id === 'SIG-IN-GL-002-20260918') &&
        t.resolution_status === 'resolved'
    );
    expect(cocoa.length).toBeGreaterThanOrEqual(8);
    for (const t of cocoa) {
      expect(t.product_scope_guard).toBe('cocoa_chocolate');
    }
  });
});
