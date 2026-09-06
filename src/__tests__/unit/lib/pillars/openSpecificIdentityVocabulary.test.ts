/**
 * Closed-set integrity for the governed Open v15 specific-identity vocabulary (v0.7).
 *
 * The frozen snapshot is scoring evidence. Count/hash lock integrity only — semantic
 * authority is the v0.7 source-hygiene rules plus founder-reviewed alias allowlist.
 */
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  OPEN_SPECIFIC_IDENTITY_PHRASES,
  OPEN_SPECIFIC_IDENTITY_VOCAB_META,
} from '../../../../lib/truscoreEngine/pillars/openSpecificIdentityVocabulary.generated';
import {
  OPEN_SPECIFIC_IDENTITY_REJECTION_META,
  OPEN_SPECIFIC_IDENTITY_REJECTIONS,
} from '../../../../lib/truscoreEngine/pillars/openSpecificIdentityVocabulary.rejections.generated';

const REPO_ROOT = path.resolve(__dirname, '../../../../../');
const GENERATED = path.join(
  REPO_ROOT,
  'src/lib/truscoreEngine/pillars/openSpecificIdentityVocabulary.generated.ts'
);
const MATCHER = path.join(REPO_ROOT, 'src/lib/truscoreEngine/pillars/openPillarHiddenTerms.ts');

describe('Open specific-identity vocabulary — closed-set integrity (v0.7)', () => {
  it('exposes a frozen phrase count and content hash', () => {
    expect(OPEN_SPECIFIC_IDENTITY_VOCAB_META.phraseCount).toBe(OPEN_SPECIFIC_IDENTITY_PHRASES.length);
    expect(OPEN_SPECIFIC_IDENTITY_VOCAB_META.phraseCount).toBe(518);
    expect(OPEN_SPECIFIC_IDENTITY_VOCAB_META.contentSha256).toBe(
      'dd2d624371dd5ab4f87cbb365a463a2278c1df96ed5d2acc6f01d703b285a0dd'
    );
    expect(OPEN_SPECIFIC_IDENTITY_VOCAB_META.methodologyVersion).toBe('v0.7');
    expect(OPEN_SPECIFIC_IDENTITY_VOCAB_META.source).toBe('ADDITIVE_DATABASE');
  });

  it('keeps phrases unique, normalised, and longest-first', () => {
    const seen = new Set<string>();
    let prevLen = Number.POSITIVE_INFINITY;
    for (const phrase of OPEN_SPECIFIC_IDENTITY_PHRASES) {
      expect(phrase).toBe(phrase.toLowerCase().replace(/\s+/g, ' ').trim());
      expect(phrase.length).toBeGreaterThanOrEqual(3);
      expect(seen.has(phrase)).toBe(false);
      seen.add(phrase);
      expect(phrase.length).toBeLessThanOrEqual(prevLen);
      prevLen = phrase.length;
    }
  });

  it('includes required plain-language identities and founder-reviewed aliases', () => {
    const set = new Set(OPEN_SPECIFIC_IDENTITY_PHRASES);
    for (const required of [
      'lecithin',
      'xanthan gum',
      'potassium sorbate',
      'ascorbic acid',
      'citric acid',
      'sodium nitrite',
      'tartrazine',
      'aspartame',
      'msg',
      'tbhq',
      'bha',
      'bht',
      'turmeric',
      'vitamin b2',
      'vitamin b3',
    ]) {
      expect(set.has(required)).toBe(true);
    }
  });

  it('excludes annotation, class-labelled, and broad-shell phrases from positive identity', () => {
    const set = new Set(OPEN_SPECIFIC_IDENTITY_PHRASES);
    for (const forbidden of [
      'alternative',
      'additional variant',
      'another variant',
      'reserved for antibiotics',
      'preservative sodium nitrite',
      'colour tartrazine',
      'color tartrazine',
      'sweetener aspartame',
      'emulsifier',
      'thickener',
      'preservative',
      'colour',
      'blend',
      'vegetable gum',
    ]) {
      expect(set.has(forbidden)).toBe(false);
    }
  });

  it('content hash matches the committed phrase list (edits are reviewable)', () => {
    const hash = createHash('sha256')
      .update(OPEN_SPECIFIC_IDENTITY_PHRASES.join('\n'), 'utf8')
      .digest('hex');
    expect(hash).toBe(OPEN_SPECIFIC_IDENTITY_VOCAB_META.contentSha256);
  });

  it('runtime matcher consumes the frozen snapshot, not live ADDITIVE_DATABASE identity lookup', () => {
    const matcher = fs.readFileSync(MATCHER, 'utf8');
    expect(matcher).toContain("from './openSpecificIdentityVocabulary.generated'");
    expect(matcher).toContain('OPEN_SPECIFIC_IDENTITY_PHRASES');
    const identityFn = matcher.slice(
      matcher.indexOf('function specificationContainsRecognisedIdentity'),
      matcher.indexOf('function specificationContainsRecognisedIdentity') + 800
    );
    expect(identityFn).toContain('OPEN_SPECIFIC_IDENTITY_PHRASES');
    expect(identityFn).not.toContain('ADDITIVE_DATABASE');
    expect(identityFn).not.toContain('getAdditiveInfo');
  });

  it('generated artifact file is present and declares the same hash', () => {
    const source = fs.readFileSync(GENERATED, 'utf8');
    expect(source).toContain(OPEN_SPECIFIC_IDENTITY_VOCAB_META.contentSha256);
    expect(source).toContain(`phraseCount: ${OPEN_SPECIFIC_IDENTITY_VOCAB_META.phraseCount}`);
  });
});

describe('Open specific-identity vocabulary — generation rejection audit (v0.7)', () => {
  it('records rejection counts by reason', () => {
    expect(OPEN_SPECIFIC_IDENTITY_REJECTION_META.totalRejected).toBe(
      OPEN_SPECIFIC_IDENTITY_REJECTIONS.length
    );
    expect(OPEN_SPECIFIC_IDENTITY_REJECTION_META.countsByReason.annotation_admin).toBeGreaterThan(0);
    expect(OPEN_SPECIFIC_IDENTITY_REJECTION_META.countsByReason.class_labelled).toBeGreaterThan(0);
    expect(
      OPEN_SPECIFIC_IDENTITY_REJECTION_META.countsByReason.parenthetical_not_allowlisted
    ).toBeGreaterThan(0);
    expect(OPEN_SPECIFIC_IDENTITY_REJECTION_META.countsByReason.placeholder_name).toBeGreaterThan(0);
  });

  it('rejects the founder-cited annotation and class-labelled exemplars', () => {
    const byPhrase = new Map(
      OPEN_SPECIFIC_IDENTITY_REJECTIONS.map((r) => [r.phrase, r.reason] as const)
    );
    expect(byPhrase.get('alternative')).toBe('annotation_admin');
    expect(byPhrase.get('additional variant')).toBe('annotation_admin');
    expect(byPhrase.get('another variant')).toBe('annotation_admin');
    expect(byPhrase.get('reserved for antibiotics')).toBe('annotation_admin');
    expect(byPhrase.get('preservative sodium nitrite')).toBe('class_labelled');
    expect(byPhrase.get('colour tartrazine')).toBe('class_labelled');
    expect(byPhrase.get('color tartrazine')).toBe('class_labelled');
    expect(byPhrase.get('sweetener aspartame')).toBe('class_labelled');
  });

  it('rejection ledger hash matches committed rows', () => {
    const hash = createHash('sha256')
      .update(
        OPEN_SPECIFIC_IDENTITY_REJECTIONS.map((r) => `${r.reason}\t${r.phrase}\t${r.source}`)
          .slice()
          .sort()
          .join('\n'),
        'utf8'
      )
      .digest('hex');
    expect(hash).toBe(OPEN_SPECIFIC_IDENTITY_REJECTION_META.contentSha256);
  });
});
