/**
 * Consumer pillar nomenclature regression.
 *
 * Founder naming disposition (5 September 2026): consumers see Body, Planet, **Claims** and
 * **Transparency**. "Ethics" and "Open" survive only as internal pillar keys, stable adjustment
 * IDs (`ethics-v37-*`, `open-v15-*`), scoring registries and S28 score diagnostics.
 *
 * This suite proves the active consumer surfaces cannot display Ethics or Open AS PILLAR NAMES,
 * while deliberately preserving:
 *   - the proper nouns "Open Food Facts" / "Open Beauty Facts" / "Open Pet Food Facts",
 *   - the "Open Source" attribution and imperative "Open …" call-to-action labels,
 *   - every internal identifier, breakdown key and S28 diagnostic string.
 *
 * Score-neutral: naming and presentation only.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ACTIVE_CONSUMER_PILLAR_LABELS,
  consumerPillarLabel,
} from '../../../../lib/scoreHighlights';
import { selectScoreHighlights } from '../../../../lib/scoreHighlights/selectScoreHighlights';
import { selectContextualContributionPrompts } from '../../../../lib/scoreHighlights/contextualContributionPrompts';
import { ShareContentBuilder } from '../../../../features/sharing/services/ShareContentBuilder';
import { generateShareMessage, getShareCardData } from '../../../../services/shareCardGenerator';
import { buildEthicsPillarBannerAlerts } from '../../../../services/ethicsPillarBannerAlerts';
import { ETHICS_V37_ADJUSTMENT_REGISTRY } from '../../../../lib/truscoreEngine/pillars/ethicsPillarV37Registry';
import { OPEN_V15_ADJUSTMENT_REGISTRY } from '../../../../lib/truscoreEngine/pillars/openPillarV15Registry';
import type { TruScoreResult } from '../../../../lib/truscoreEngine';
import type { ProductWithTrustScore } from '../../../../types/product';
import type { FiredAdjustment, ScoreHighlightPillar } from '../../../../lib/scoreHighlights/types';
import en from '../../../../i18n/locales/en.json';

const REPO_ROOT = path.join(__dirname, '..', '..', '..', '..', '..');

/**
 * Mask the uses of the word "Open" that are NOT the pillar name, plus "Ethics" where it is an
 * internal code identifier. Anything still matching afterwards is a consumer pillar-name leak.
 */
function maskPermittedUses(text: string): string {
  return (
    text
      // Proper nouns for the upstream databases.
      .replace(/Open (Food|Beauty|Pet Food) Facts/g, '\u2039db\u203a')
      .replace(/Open Source/g, '\u2039oss\u203a')
      // Imperative call-to-action / accessibility labels ("Open reference", "Open in Rveel").
      .replace(/\bOpen (reference|disclaimer|manual edit|in [A-Z])/g, '\u2039cta\u203a')
      // Internal code: pillar-key literals, union members, object keys and property access.
      .replace(/consumerPillarLabel\(\s*'(Ethics|Open)'\s*\)/g, '\u2039label\u203a')
      .replace(/'(Ethics|Open)'/g, '\u2039key\u203a')
      .replace(/\b(Ethics|Open):/g, '\u2039key\u203a:')
      .replace(/\.(Ethics|Open)\b/g, '.\u2039key\u203a')
  );
}

/** Pillar-name leaks left in a consumer string after the permitted uses are masked out. */
function pillarNameLeaks(text: string): string[] {
  const masked = maskPermittedUses(text);
  const leaks: string[] = [];
  if (/\bEthics\b/i.test(masked)) leaks.push('Ethics');
  if (/\bOpen\b/.test(masked)) leaks.push('Open');
  return leaks;
}

/** Strip line and block comments so code commentary never counts as consumer copy. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
}

function collectStrings(node: unknown, keyPath: string, out: Array<[string, string]>): void {
  if (typeof node === 'string') {
    out.push([keyPath, node]);
    return;
  }
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      collectStrings(value, keyPath ? `${keyPath}.${key}` : key, out);
    }
  }
}

const EN_STRINGS: Array<[string, string]> = [];
collectStrings(en, '', EN_STRINGS);

const product = {
  barcode: '9300000000003',
  product_name: 'Nomenclature Test Bar',
  brands: 'Test',
  nutriments: {},
  trust_score: 72,
  trust_score_breakdown: null,
} as unknown as ProductWithTrustScore;

const truScore: TruScoreResult = {
  truscore: 72,
  breakdown: { Body: 18, Planet: 17, Ethics: 20, Open: 17 },
  insights: [],
};

const SHARE_ITEMS = [
  'truScore',
  'negativeTruScore',
  'productInfo',
  'insights',
  'recall',
  'countryOfManufacture',
  'palmOil',
  'nutrition',
  'ingredients',
  'processing',
  'allergens',
  'ecoscore',
] as const;

describe('canonical consumer pillar labels', () => {
  it('maps the internal pillar keys to the founder-locked consumer names', () => {
    expect(consumerPillarLabel('Body')).toBe('Body');
    expect(consumerPillarLabel('Planet')).toBe('Planet');
    expect(consumerPillarLabel('Ethics')).toBe('Claims');
    expect(consumerPillarLabel('Open')).toBe('Transparency');
    expect(ACTIVE_CONSUMER_PILLAR_LABELS).toEqual([
      'Body',
      'Planet',
      'Claims',
      'Transparency',
    ]);
  });

  it('never emits a pillar name that is itself a leak', () => {
    for (const label of ACTIVE_CONSUMER_PILLAR_LABELS) {
      expect(pillarNameLeaks(label)).toEqual([]);
    }
  });
});

describe('live consumer surfaces cannot render Ethics or Open as pillar names', () => {
  it('share content for every share item is clean', () => {
    for (const item of SHARE_ITEMS) {
      const content = ShareContentBuilder.buildContent({
        product: product as never,
        truScore: truScore as never,
        item: item as never,
      });
      expect(pillarNameLeaks(content.title)).toEqual([]);
      expect(pillarNameLeaks(content.message)).toEqual([]);
    }
  });

  it('the share card message and card data are clean, and use the consumer labels', () => {
    const message = generateShareMessage(product, truScore);
    expect(pillarNameLeaks(message)).toEqual([]);
    expect(message).toContain('• Claims: 20/25');
    expect(message).toContain('• Transparency: 17/25');

    // Internal breakdown keys are untouched; only the rendered label changes.
    expect(getShareCardData(product, truScore).breakdown).toEqual({
      Body: 18,
      Planet: 17,
      Ethics: 20,
      Open: 17,
    });
  });

  it('the platform-optimised variants stay clean', () => {
    const base = ShareContentBuilder.buildContent({
      product: product as never,
      truScore: truScore as never,
      item: 'truScore',
    });
    for (const platform of ['twitter', 'facebook', 'instagram', 'snapchat', 'tiktok', 'whatsapp']) {
      const optimised = ShareContentBuilder.optimizeForPlatform(base, platform as never);
      expect(pillarNameLeaks(optimised.message)).toEqual([]);
    }
  });

  it('the Claims-pillar banner alerts name the consumer pillar', () => {
    const alerts = buildEthicsPillarBannerAlerts(product, {
      pillarName: 'Ethics',
      baseScore: 15,
      finalScore: 9,
      adjustments: [
        { adjustmentId: 'ethics-v37-bbfaw-tier-6', description: 'BBFAW Tier 6', value: -6 },
        { adjustmentId: 'ethics-v37-ktc-21-30', description: 'KTC band 21-30', value: -6 },
      ],
    } as never);

    expect(alerts).toHaveLength(2);
    for (const alert of alerts) {
      expect(pillarNameLeaks(alert.title)).toEqual([]);
      expect(pillarNameLeaks(alert.message)).toEqual([]);
      expect(pillarNameLeaks(alert.sourceDetails?.organization ?? '')).toEqual([]);
      expect(alert.title).toContain('Claims pillar');
      // Internal identity (id, dedupe key, adjustment IDs) is deliberately unchanged.
      expect(alert.id).toContain('ethics-pillar-');
      expect(alert.dedupeKey).toContain(':ethics:');
    }
  });

  it('governed Score Highlights copy and contextual prompts are clean', () => {
    const eligible: FiredAdjustment[] = [
      ...Object.entries(ETHICS_V37_ADJUSTMENT_REGISTRY),
      ...Object.entries(OPEN_V15_ADJUSTMENT_REGISTRY),
    ]
      .filter(([, row]) => (row as { highlightEligible?: boolean }).highlightEligible)
      .map(([id]) => ({
        pillar: (id.startsWith('ethics') ? 'Ethics' : 'Open') as ScoreHighlightPillar,
        id,
        value: -1,
        highlightEligible: true,
      }));

    // Resolve each eligible ID on its own so one unresolved token cannot mask the others.
    for (const row of eligible) {
      const { byPillar } = selectScoreHighlights([row]);
      for (const story of byPillar[row.pillar]) {
        expect(pillarNameLeaks(story.l1)).toEqual([]);
        expect(pillarNameLeaks(story.l2)).toEqual([]);
      }
    }

    for (const pillar of ['Body', 'Planet', 'Ethics', 'Open'] as const) {
      const prompts = selectContextualContributionPrompts(pillar, [
        { pillar, id: `${pillar.toLowerCase()}-base`, value: 0, highlightEligible: false },
      ]);
      for (const prompt of prompts) {
        expect(pillarNameLeaks(prompt.l1)).toEqual([]);
        expect(pillarNameLeaks(prompt.l2)).toEqual([]);
      }
    }
  });
});

describe('English locale bundle carries no consumer pillar-name leak', () => {
  it('uses the consumer labels for the pillar-name keys', () => {
    expect((en as Record<string, Record<string, string>>).result.ethics).toBe('Claims');
    expect((en as Record<string, Record<string, string>>).result.open).toBe('Transparency');
  });

  it('has no remaining pillar-name occurrence in any string value', () => {
    const leaks = EN_STRINGS.filter(([, value]) => pillarNameLeaks(value).length > 0).map(
      ([key]) => key
    );
    expect(leaks).toEqual([]);
  });

  it('still keeps the upstream database proper nouns', () => {
    const offMentions = EN_STRINGS.filter(([, value]) => value.includes('Open Food Facts'));
    expect(offMentions.length).toBeGreaterThan(5);
  });
});

describe('active consumer source files carry no pillar-name copy', () => {
  const CONSUMER_SOURCES = [
    'src/components/TrustScoreInfoModal.tsx',
    'src/components/EcoScoreInfoModal.tsx',
    'src/components/TruScore.tsx',
    'src/components/ScoreHighlightsList.tsx',
    'src/components/ScoreHighlightsLookThroughModal.tsx',
    'src/features/sharing/services/ShareContentBuilder.ts',
    'src/services/shareCardGenerator.ts',
    'src/services/ethicsPillarBannerAlerts.ts',
  ];

  /** Phrases that can only be a consumer pillar name, whatever the surrounding syntax. */
  const FORBIDDEN_PHRASES = [
    /ethics pillar/i,
    /open pillar/i,
    /ethics score/i,
    /open score/i,
    /[•*]\s*Ethics\b/,
    /[•*]\s*Open\b/,
    /Body,\s*Planet,\s*Ethics/,
    /Ethics\s*\(\d/,
    /t\('result\.(ethics|open)'\)/,
  ];

  it.each(CONSUMER_SOURCES)('%s', (relative) => {
    const source = stripComments(fs.readFileSync(path.join(REPO_ROOT, relative), 'utf8'));
    for (const phrase of FORBIDDEN_PHRASES) {
      expect(source).not.toMatch(phrase);
    }
  });

  it('routes the pillar names through the canonical helper', () => {
    for (const relative of [
      'src/components/TrustScoreInfoModal.tsx',
      'src/features/sharing/services/ShareContentBuilder.ts',
      'src/services/shareCardGenerator.ts',
    ]) {
      const source = fs.readFileSync(path.join(REPO_ROOT, relative), 'utf8');
      expect(source).toContain('consumerPillarLabel');
    }
  });
});

describe('internal naming is deliberately unchanged', () => {
  it('keeps the Ethics/Open stable adjustment ID prefixes', () => {
    expect(Object.keys(ETHICS_V37_ADJUSTMENT_REGISTRY).every((id) => id.startsWith('ethics-v37-'))).toBe(
      true
    );
    expect(Object.keys(OPEN_V15_ADJUSTMENT_REGISTRY).every((id) => id.startsWith('open-v15-'))).toBe(
      true
    );
  });

  it('keeps the internal breakdown keys on TruScoreResult', () => {
    expect(Object.keys(truScore.breakdown).sort()).toEqual(['Body', 'Ethics', 'Open', 'Planet']);
  });

  it('leaves the S28 diagnostics modal rendering internal pillar names', () => {
    const s28 = fs.readFileSync(
      path.join(REPO_ROOT, 'src', 'components', 'TruScoreAnalysisModal.tsx'),
      'utf8'
    );
    expect(s28).toContain("(['Body', 'Planet', 'Ethics', 'Open'] as const)");
    expect(s28).toContain('{pillar.pillarName}');
    expect(s28).not.toContain('consumerPillarLabel');
  });
});
