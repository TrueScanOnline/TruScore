/**
 * ETHICS pillar — certifications element (SPEC v37 + organic MVP rules).
 */

import {
  evaluateEthicsCertifications,
  ETHICS_CERTIFICATION_WEIGHTS,
  normalizeEthicsOrganicText,
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

  test('Fairtrade tag → +6', () => {
    const p = { ...minimalProduct(), labels_tags: ['en:fair-trade'] };
    const e = evaluateEthicsCertifications(p);
    expect(e.adjustment).toBe(ETHICS_CERTIFICATION_WEIGHTS.fairtrade);
    expect(e.winningScheme).toBe('fairtrade');
  });

  test('Fairtrade + RSPO → Fairtrade 6; RSPO not Ethics-eligible', () => {
    const p = {
      ...minimalProduct(),
      labels_tags: ['en:fair-trade', 'en:rspo'],
    };
    const e = evaluateEthicsCertifications(p);
    expect(e.adjustment).toBe(6);
    expect(e.winningScheme).toBe('fairtrade');
    expect(e.eligibleSchemes).not.toContain('rspo');
  });

  test('RSPO only → no Ethics certification points', () => {
    const p = { ...minimalProduct(), labels_tags: ['en:roundtable-on-sustainable-palm-oil'] };
    const e = evaluateEthicsCertifications(p);
    expect(e.adjustment).toBe(0);
    expect(e.winningScheme).toBeNull();
    expect(e.eligibleSchemes).not.toContain('rspo');
    expect(ETHICS_CERTIFICATION_WEIGHTS.rspo).toBe(0);
  });

  test('Rainforest Alliance → +6', () => {
    const p = { ...minimalProduct(), labels_tags: ['en:rainforest-alliance'] };
    const e = evaluateEthicsCertifications(p);
    expect(e.winningScheme).toBe('rainforest_alliance');
    expect(e.adjustment).toBe(6);
    expect(ETHICS_CERTIFICATION_WEIGHTS.rainforest_alliance).toBe(6);
  });

  test('UTZ → +6 (same Rainforest Alliance/UTZ scheme)', () => {
    const p = { ...minimalProduct(), labels_tags: ['en:utz-certified'] };
    const e = evaluateEthicsCertifications(p);
    expect(e.winningScheme).toBe('rainforest_alliance');
    expect(e.adjustment).toBe(6);
  });

  test('en:organic → +2', () => {
    const p = { ...minimalProduct(), labels_tags: ['en:organic'] };
    const e = evaluateEthicsCertifications(p);
    expect(e.winningScheme).toBe('organic');
    expect(e.adjustment).toBe(2);
    expect(e.organicMatchSource).toBe('off_tags_or_hierarchy');
  });

  test('en:aco-certified-organic → Organic +2', () => {
    const p = { ...minimalProduct(), labels_tags: ['en:aco-certified-organic'] };
    const e = evaluateEthicsCertifications(p);
    expect(e.winningScheme).toBe('organic');
    expect(e.adjustment).toBe(2);
    expect(e.organicMatchSource).toBe('off_tags_or_hierarchy');
  });

  test('label text ACO certified organic → Organic +2', () => {
    const p = {
      ...minimalProduct(),
      labels: 'ACO certified organic',
      labels_tags: [],
    };
    const e = evaluateEthicsCertifications(p);
    expect(e.winningScheme).toBe('organic');
    expect(e.adjustment).toBe(2);
    expect(e.organicMatchSource).toBe('label_or_cert_text');
  });

  test('labels_hierarchy en:organic only (no labels_tags) → Organic +2', () => {
    const p = {
      ...minimalProduct(),
      labels_tags: [],
      labels_hierarchy: ['en:organic'],
    };
    const e = evaluateEthicsCertifications(p);
    expect(e.winningScheme).toBe('organic');
    expect(e.adjustment).toBe(2);
    expect(e.organicMatchSource).toBe('off_tags_or_hierarchy');
  });

  test('label text Canada Organic → Organic +2', () => {
    const p = {
      ...minimalProduct(),
      labels: 'Canada Organic',
    };
    const e = evaluateEthicsCertifications(p);
    expect(e.winningScheme).toBe('organic');
    expect(e.organicMatchSource).toBe('label_or_cert_text');
  });

  test('label text Tún certified organic → Organic +2 (diacritic normalisation)', () => {
    const p = {
      ...minimalProduct(),
      labels: 'Tún certified organic',
    };
    const e = evaluateEthicsCertifications(p);
    expect(e.winningScheme).toBe('organic');
    expect(e.adjustment).toBe(2);
  });

  test('label text Catalan Council of Organic Production → Organic +2', () => {
    const p = {
      ...minimalProduct(),
      labels: 'Catalan Council of Organic Production',
    };
    const e = evaluateEthicsCertifications(p);
    expect(e.winningScheme).toBe('organic');
    expect(e.adjustment).toBe(2);
  });

  test('product name Organic Greek Yoghurt, no OFF organic label → Organic +2', () => {
    const p = {
      ...minimalProduct(),
      product_name: 'Organic Greek Yoghurt',
      labels_tags: [],
      labels: '',
    };
    const e = evaluateEthicsCertifications(p);
    expect(e.winningScheme).toBe('organic');
    expect(e.adjustment).toBe(2);
    expect(e.organicMatchSource).toBe('product_name');
  });

  test('product name containing non-organic → no Organic +2', () => {
    const p = {
      ...minimalProduct(),
      product_name: 'non-organic snack',
      labels_tags: [],
    };
    const e = evaluateEthicsCertifications(p);
    expect(e.eligibleSchemes).not.toContain('organic');
  });

  test('ingredients_text organic milk only → no Organic +2', () => {
    const p = {
      ...minimalProduct(),
      ingredients_text: 'organic milk, cream',
      labels_tags: [],
      product_name: 'Plain',
    };
    const e = evaluateEthicsCertifications(p);
    expect(e.eligibleSchemes).not.toContain('organic');
  });

  test('Fairtrade + en:organic → Fairtrade wins (+6)', () => {
    const p = {
      ...minimalProduct(),
      labels_tags: ['en:fair-trade', 'en:organic'],
    };
    const e = evaluateEthicsCertifications(p);
    expect(e.adjustment).toBe(6);
    expect(e.winningScheme).toBe('fairtrade');
    expect(e.eligibleSchemes).toContain('organic');
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

describe('normalizeEthicsOrganicText', () => {
  test('strips diacritics for matching', () => {
    expect(normalizeEthicsOrganicText('Tún')).toBe('tun');
  });
});
