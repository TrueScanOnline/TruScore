/**
 * Closed-set integrity for the governed Open v15 specific-identity vocabulary.
 *
 * The frozen snapshot is scoring evidence. Changes must be visible/reviewable — not silently
 * inherited from live ADDITIVE_DATABASE mutations at runtime.
 */
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  OPEN_SPECIFIC_IDENTITY_PHRASES,
  OPEN_SPECIFIC_IDENTITY_VOCAB_META,
} from '../../../../lib/truscoreEngine/pillars/openSpecificIdentityVocabulary.generated';

const REPO_ROOT = path.resolve(__dirname, '../../../../../');
const GENERATED = path.join(
  REPO_ROOT,
  'src/lib/truscoreEngine/pillars/openSpecificIdentityVocabulary.generated.ts'
);
const MATCHER = path.join(REPO_ROOT, 'src/lib/truscoreEngine/pillars/openPillarHiddenTerms.ts');

describe('Open specific-identity vocabulary — closed-set integrity', () => {
  it('exposes a frozen phrase count and content hash', () => {
    expect(OPEN_SPECIFIC_IDENTITY_VOCAB_META.phraseCount).toBe(OPEN_SPECIFIC_IDENTITY_PHRASES.length);
    expect(OPEN_SPECIFIC_IDENTITY_VOCAB_META.phraseCount).toBeGreaterThan(100);
    expect(OPEN_SPECIFIC_IDENTITY_VOCAB_META.contentSha256).toMatch(/^[a-f0-9]{64}$/);
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

  it('includes the founder-required plain-language identities', () => {
    const set = new Set(OPEN_SPECIFIC_IDENTITY_PHRASES);
    for (const required of [
      'lecithin',
      'xanthan gum',
      'potassium sorbate',
      'ascorbic acid',
      'citric acid',
      'caramel',
      'msg',
    ]) {
      expect(set.has(required)).toBe(true);
    }
  });

  it('does not include broad/generic Open disclosure shells as identity evidence', () => {
    const set = new Set(OPEN_SPECIFIC_IDENTITY_PHRASES);
    for (const blocked of [
      'emulsifier',
      'thickener',
      'preservative',
      'colour',
      'color',
      'blend',
      'vegetable gum',
      'acid',
      'extract',
      'flavour',
      'flavor',
    ]) {
      expect(set.has(blocked)).toBe(false);
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
    // decodeCodedTerm may still use getAdditiveInfo for coded display names — that is not
    // the unbracketed identity gate. The identity gate must not call ADDITIVE_DATABASE.
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
