/**
 * ETHICS pillar — certifications element (ETHICS SPEC sheet).
 */

import {
  evaluateEthicsCertifications,
  ETHICS_CERTIFICATION_WEIGHTS,
} from '../../../services/ethicsCertificationsService';
import type { Product } from '../../../types/product';

const minimalProduct = (): Product => ({
  barcode: '000',
  brands: 'X',
  categories: '',
  categories_tags: [],
  labels_tags: [],
  ingredients_text: '',
  ingredients_analysis_tags: [],
  additives_tags: [],
  nutriments: {},
  source: 'test',
});

describe('ethicsCertificationsService', () => {
  test('no labels → no adjustment', () => {
    const e = evaluateEthicsCertifications(minimalProduct());
    expect(e.adjustment).toBe(0);
    expect(e.winningScheme).toBeNull();
  });

  test('Fairtrade tag → +5', () => {
    const p = { ...minimalProduct(), labels_tags: ['en:fair-trade'] };
    const e = evaluateEthicsCertifications(p);
    expect(e.adjustment).toBe(ETHICS_CERTIFICATION_WEIGHTS.fairtrade);
    expect(e.winningScheme).toBe('fairtrade');
  });

  test('Fairtrade + RSPO → max only (Fairtrade 5)', () => {
    const p = {
      ...minimalProduct(),
      labels_tags: ['en:fair-trade', 'en:rspo'],
    };
    const e = evaluateEthicsCertifications(p);
    expect(e.adjustment).toBe(5);
    expect(e.winningScheme).toBe('fairtrade');
    expect(e.eligibleSchemes).toContain('rspo');
  });

  test('RSPO only → +3', () => {
    const p = { ...minimalProduct(), labels_tags: ['en:roundtable-on-sustainable-palm-oil'] };
    expect(evaluateEthicsCertifications(p).adjustment).toBe(3);
  });

  test('Rainforest Alliance → +4', () => {
    const p = { ...minimalProduct(), labels_tags: ['en:rainforest-alliance'] };
    expect(evaluateEthicsCertifications(p).winningScheme).toBe('rainforest_alliance');
    expect(evaluateEthicsCertifications(p).adjustment).toBe(4);
  });

  test('en:organic alone → no organic credit', () => {
    const p = { ...minimalProduct(), labels_tags: ['en:organic'] };
    expect(evaluateEthicsCertifications(p).adjustment).toBe(0);
  });

  test('EU organic tag → +2', () => {
    const p = { ...minimalProduct(), labels_tags: ['en:eu-organic'] };
    const e = evaluateEthicsCertifications(p);
    expect(e.winningScheme).toBe('organic');
    expect(e.adjustment).toBe(2);
  });

  test('MSC OFF tag without API validation → no MSC credit', () => {
    const p = {
      ...minimalProduct(),
      labels_tags: ['en:marine-stewardship-council'],
      ethics_msc_api_validated: undefined,
    };
    const e = evaluateEthicsCertifications(p);
    expect(e.eligibleSchemes).not.toContain('msc');
    expect(e.adjustment).toBe(0);
  });

  test('MSC with API validated true → +4', () => {
    const p = {
      ...minimalProduct(),
      labels_tags: ['en:marine-stewardship-council'],
      ethics_msc_api_validated: true,
    };
    const e = evaluateEthicsCertifications(p);
    expect(e.winningScheme).toBe('msc');
    expect(e.adjustment).toBe(4);
  });

  test('MSC API false → no credit even with OFF label', () => {
    const p = {
      ...minimalProduct(),
      labels_tags: ['en:marine-stewardship-council'],
      ethics_msc_api_validated: false,
    };
    expect(evaluateEthicsCertifications(p).adjustment).toBe(0);
  });
});
