/**
 * W5-UI-11 — Community Agreement presentation simplification (card copy only).
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  COMMUNITY_ADDED_CAPTION,
  communityAgreementScopeHint,
  nutritionRowIsCommunity,
  representedCommunityNutritionKeys,
  agreementSurfaceGate,
} from '../../../communityAgreement';
import type { Product } from '../../../types/product';
import { CLAIMS_LIMITED_CONFIDENCE_BODY } from '../../../components/claimsLimitedConfidenceCopy';
import { PRODUCT_ORIGINS_LIMITED_CONFIDENCE } from '../../../components/productOriginsCardCopy';

const root = path.join(__dirname, '../../..');

function readSrc(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

describe('W5-UI-11 Community Agreement presentation', () => {
  const bar = readSrc('components/communityAgreement/CommunityAgreementBar.tsx');
  const nutrition = readSrc('components/NutritionTable.tsx');
  const result = readSrc('../app/result/[barcode].tsx');

  it('1–4. Result cards do not render Community-added captions or suffixes', () => {
    expect(nutrition).not.toContain('COMMUNITY_ADDED_CAPTION');
    expect(nutrition).not.toMatch(/Community-added/);
    expect(result).not.toContain('COMMUNITY_ADDED_CAPTION');
    expect(result).not.toMatch(/Community-added/);
    expect(result).not.toContain('communityAdded=');
  });

  it('5–7. Agreement bar shows only the simplified question', () => {
    // W5-UI-13 supersedes W5-UI-11/12 question and button chrome.
    expect(bar).toContain('Does this look right?');
    expect(bar).not.toContain('Community agreements');
    expect(bar).not.toContain('community-added');
    expect(bar).not.toContain('communityAgreementScopeHint');
    expect(bar).toContain('Agree with this information.');
    expect(bar).toContain('accessibilityLabel="Correct information"');
  });

  it('8–9. Eligibility wiring and counter presentation remain', () => {
    expect(bar).toContain('agreementControlsVisible');
    expect(bar).toContain('fetchCommunityAgreement');
    expect(bar).toContain('submitCommunityAgreement');
    expect(bar).toContain('remoteCount');
    expect(result).toContain('agreementSurfaceGate');
    expect(result).toContain('CommunityAgreementBar');
    expect(result).toContain('surfaceEnabled={agreementSurfaceEnabled');
  });

  it('10–11. Limited confidence gates stay original; no new nutrition/ingredients LC badge', () => {
    expect(result).toContain("product._publication?.transparency.confidence === 'limited'");
    expect(result).toContain(
      "product._publication?.claims.confidenceReasonCode === 'claims_primary_contribution_limited'"
    );
    expect(result).toContain('PRODUCT_ORIGINS_LIMITED_CONFIDENCE');
    expect(result).toContain('CLAIMS_LIMITED_CONFIDENCE_BODY');
    expect(PRODUCT_ORIGINS_LIMITED_CONFIDENCE.toLowerCase()).toContain('community');
    expect(CLAIMS_LIMITED_CONFIDENCE_BODY.toLowerCase()).toContain('community');
    // No manufactured Limited confidence affordance for nutrition/ingredients cards.
    expect(result).not.toMatch(/setNutritionLimitedConfidence|nutritionLimitedConfidence/);
    expect(result).not.toMatch(/setIngredientsLimitedConfidence|ingredientsLimitedConfidence/);
  });

  it('12. Provenance helpers and settlement gate remain available internally', () => {
    expect(typeof nutritionRowIsCommunity).toBe('function');
    expect(typeof representedCommunityNutritionKeys).toBe('function');
    expect(typeof agreementSurfaceGate).toBe('function');
    expect(
      nutritionRowIsCommunity('sugars', { sugars_100g: 1 }, ['sugars_100g'])
    ).toBe(true);
    expect(
      [...representedCommunityNutritionKeys({ sugars_100g: 1 }, ['sugars_100g'])]
    ).toEqual(['sugars_100g']);
    // Scope hint is intentionally blank on cards (W5-UI-11).
    expect(
      communityAgreementScopeHint('nutrition', {
        barcode: '1',
        nutriments: { sugars_100g: 1 },
        rveelGovernedNutrimentKeys: ['sugars_100g'],
      } as Product)
    ).toBe('');
    expect(COMMUNITY_ADDED_CAPTION.toLowerCase()).not.toContain('confidence');
  });
});
