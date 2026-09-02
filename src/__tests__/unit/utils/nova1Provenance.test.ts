/**
 * Wave 3 P1-B — NOVA 1 provenance lifecycle tests.
 */

import {
  bodyNova1AdjustmentId,
  ensureNova1ProvenanceOnProduct,
  markNova1ProvenanceInferred,
  markNova1ProvenanceOff,
  resolveNova1Provenance,
} from '../../../utils/nova1Provenance';
import { assignNOVA1IfHighConfidence } from '../../../utils/novaAssessment';
import { calculateBodyPillar } from '../../../lib/truscoreEngine/pillars/bodyPillar';
import { Product } from '../../../types/product';
import { scoringInputCompleteness, selectPreferredLocalProduct } from '../../../utils/localProductPreference';

function baseProduct(over: Partial<Product> = {}): Product {
  return {
    barcode: '9300000000001',
    product_name: 'Test',
    brands: 'Test',
    categories: 'en:vegetables',
    categories_tags: ['en:vegetables'],
    ingredients_text: 'peas',
    additives_tags: [],
    source: 'openfoodfacts',
    ...over,
  };
}

describe('nova1Provenance lifecycle', () => {
  test('external OFF NOVA 1 stays off across enhancement', () => {
    const p = baseProduct({ nova_group: 1 });
    markNova1ProvenanceOff(p);
    assignNOVA1IfHighConfidence(p);
    ensureNova1ProvenanceOnProduct(p);
    expect(p.nova1Provenance).toBe('off');
    expect(p._nova_estimated).toBeUndefined();
    const body = calculateBodyPillar(p);
    expect(body.adjustments.some((a) => a.id === 'body-v12-nova-1-off')).toBe(true);
    expect(body.adjustments.find((a) => a.id === 'body-v12-nova-1-off')?.highlightEligible).toBe(true);
  });

  test('inferred NOVA 1 remains inferred and Highlight-ineligible', () => {
    const p = baseProduct({ ingredients_text: 'frozen peas', additives_tags: [] });
    markNova1ProvenanceInferred(p);
    ensureNova1ProvenanceOnProduct(p);
    expect(p.nova1Provenance).toBe('inferred');
    const body = calculateBodyPillar(p);
    const row = body.adjustments.find((a) => a.id === 'body-v12-nova-1-inferred');
    expect(row).toBeTruthy();
    expect(row?.highlightEligible).toBe(false);
    expect(row?.value).toBe(3);
  });

  test('legacy missing provenance becomes unknown and never promotes to off', () => {
    const p = baseProduct({ nova_group: 1 });
    expect(resolveNova1Provenance(p)).toBe('unknown');
    ensureNova1ProvenanceOnProduct(p);
    expect(p.nova1Provenance).toBe('unknown');
    expect(bodyNova1AdjustmentId('unknown')).toBe('body-v12-nova-1-unknown');
    const body = calculateBodyPillar(p);
    expect(body.adjustments.some((a) => a.id === 'body-v12-nova-1-unknown')).toBe(true);
    expect(body.adjustments.find((a) => a.id === 'body-v12-nova-1-unknown')?.highlightEligible).toBe(
      false
    );
  });

  test('_nova_estimated legacy bridge maps to inferred', () => {
    const p = baseProduct({ nova_group: 1, _nova_estimated: true });
    expect(resolveNova1Provenance(p)).toBe('inferred');
  });
});

describe('localProductPreference (P1-A)', () => {
  test('prefers fuller cache over thinner SQLite', () => {
    const thinSqlite = baseProduct({ barcode: '1', nutriscore_grade: 'a' });
    const fullCache = baseProduct({
      barcode: '1',
      nutriscore_grade: 'a',
      nova_group: 1,
      nova1Provenance: 'off',
      origins_tags: ['en:australia'],
      brand_owner: 'Acme',
    });
    expect(scoringInputCompleteness(fullCache)).toBeGreaterThan(scoringInputCompleteness(thinSqlite));
    expect(selectPreferredLocalProduct(thinSqlite, fullCache)).toBe(fullCache);
  });

  test('equal completeness prefers fresher _cachedAt', () => {
    const older = baseProduct({ barcode: '1', nova_group: 2 });
    (older as Product & { _cachedAt?: number })._cachedAt = 100;
    const newer = baseProduct({ barcode: '1', nova_group: 2 });
    (newer as Product & { _cachedAt?: number })._cachedAt = 200;
    expect(selectPreferredLocalProduct(older, newer)).toBe(newer);
  });
});
