/**
 * formatCertifications — OFF tags + hierarchy union, organic coalescing, synthetic claims for name/label-text paths.
 */

import { formatCertifications } from '../../../services/openFoodFacts';
import {
  CERT_BADGE_ICONS,
  ORGANIC_LABEL_TEXT_CLAIM_TAG,
  ORGANIC_PRODUCT_NAME_CLAIM_TAG,
} from '../../../constants/certDisplay';
import { evaluateEthicsCertifications } from '../../../services/ethicsCertificationsService';
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

describe('formatCertifications', () => {
  test('labels_hierarchy-only organic tag shows certification badge when labels_tags empty', () => {
    const p: Product = {
      ...minimalProduct(),
      labels_tags: [],
      labels_hierarchy: ['en:organic'],
    };
    const certs = formatCertifications(p);
    expect(certs).toBeDefined();
    expect(certs!.length).toBe(1);
    expect(certs![0].tag).toBe('en:organic');
    expect(certs![0].name).toBe('Organic');
  });

  test('label text ACO certified organic only adds label-text synthetic badge (read-across to ethics)', () => {
    const p: Product = {
      ...minimalProduct(),
      labels_tags: [],
      labels_hierarchy: [],
      labels: 'ACO certified organic',
    };
    const certs = formatCertifications(p);
    expect(certs).toBeDefined();
    expect(certs!.length).toBe(1);
    expect(certs![0].tag).toBe(ORGANIC_LABEL_TEXT_CLAIM_TAG);
    expect(certs![0].name).toBe('Organic');
    expect(certs![0].description).toContain('label');
  });

  test('product-name-only organic adds synthetic badge', () => {
    const p: Product = {
      ...minimalProduct(),
      labels_tags: [],
      labels_hierarchy: [],
      product_name: 'Organic Tomato Soup',
      labels: '',
    };
    const certs = formatCertifications(p);
    expect(certs).toBeDefined();
    expect(certs!.length).toBe(1);
    expect(certs![0].tag).toBe(ORGANIC_PRODUCT_NAME_CLAIM_TAG);
    expect(certs![0].name).toBe('Organic');
    expect(certs![0].description).toContain('product name');
  });

  test.each([
    ['en:bioland'],
    ['en:biokreis'],
    ['en:debio-organic'],
    ['en:tun-certified-organic'],
  ])('expanded organic tag %s maps to leaf icon', (tag) => {
    expect(CERT_BADGE_ICONS[tag]).toBe('leaf-outline');
    const p: Product = {
      ...minimalProduct(),
      labels_tags: [tag],
    };
    const certs = formatCertifications(p);
    expect(certs).toBeDefined();
    expect(certs![0].tag).toBe(tag);
    expect(CERT_BADGE_ICONS[certs![0].tag]).toBe('leaf-outline');
  });

  test('OFF organic tag + product name Organic → single organic badge, no synthetic', () => {
    const p: Product = {
      ...minimalProduct(),
      labels_tags: [],
      labels_hierarchy: ['en:eu-organic'],
      product_name: 'Organic Oats',
    };
    const certs = formatCertifications(p);
    expect(certs).toBeDefined();
    expect(certs!.length).toBe(1);
    expect(certs![0].tag).toBe('en:eu-organic');
    expect(certs!.some((c) => c.tag === ORGANIC_PRODUCT_NAME_CLAIM_TAG)).toBe(false);
  });

  test('labels_tags organic + product name Organic → one coalesced organic badge', () => {
    const p: Product = {
      ...minimalProduct(),
      labels_tags: ['en:organic', 'en:usda-organic'],
      product_name: 'Organic Granola',
    };
    const certs = formatCertifications(p);
    expect(certs).toBeDefined();
    expect(certs!.filter((c) => c.tag === ORGANIC_PRODUCT_NAME_CLAIM_TAG)).toHaveLength(0);
    expect(certs!.length).toBe(1);
    expect(certs![0].tag).toBe('en:organic');
  });

  test('synthetic product-name claim uses leaf-outline in CertBadge map', () => {
    expect(CERT_BADGE_ICONS[ORGANIC_PRODUCT_NAME_CLAIM_TAG]).toBe('leaf-outline');
  });

  test('synthetic label-text claim uses leaf-outline in CertBadge map', () => {
    expect(CERT_BADGE_ICONS[ORGANIC_LABEL_TEXT_CLAIM_TAG]).toBe('leaf-outline');
  });
});

describe('formatCertifications + ethics scoring guardrail', () => {
  test('label text organic scores +2 and formatCertifications shows label-text synthetic', () => {
    const p: Product = {
      ...minimalProduct(),
      labels_tags: [],
      labels: 'ACO certified organic',
    };
    expect(evaluateEthicsCertifications(p).organicMatchSource).toBe('label_or_cert_text');
    const certs = formatCertifications(p);
    expect(certs?.some((c) => c.tag === ORGANIC_LABEL_TEXT_CLAIM_TAG)).toBe(true);
  });

  test('hierarchy en:organic + product name Organic still scores +2 with OFF as organic source', () => {
    const p: Product = {
      ...minimalProduct(),
      labels_tags: [],
      labels_hierarchy: ['en:organic'],
      product_name: 'Organic Oats',
    };
    const e = evaluateEthicsCertifications(p);
    expect(e.adjustment).toBe(2);
    expect(e.organicMatchSource).toBe('off_tags_or_hierarchy');
  });
});
