/**
 * W5-UI-10 founder Result refinements.
 * Presentation and Origins form order only.
 */

import fs from 'fs';
import path from 'path';
import { dogEarCut, dogEarFlap } from '../../../components/product/emerald/dogEar';
import { productOriginsEntrySentence } from '../../../components/productOriginsEntrySentence';

const REPO = path.join(__dirname, '../../../..');
const RESULT = path.join(REPO, 'app/result/[barcode].tsx');
const FRAME = path.join(REPO, 'src/components/product/emerald/EmeraldScoreFrame.tsx');
const COMPOSITION = path.join(REPO, 'src/components/product/emerald/EmeraldScoreComposition.tsx');
const HERO = path.join(REPO, 'src/components/product/ProductHeroSection.tsx');
const MODAL = path.join(REPO, 'src/components/PacketContributionModal.tsx');
const TRUST = path.join(REPO, 'src/utils/trustScore.ts');

describe('W5-UI-10 founder Result refinements', () => {
  const result = fs.readFileSync(RESULT, 'utf8');
  const frame = fs.readFileSync(FRAME, 'utf8');
  const composition = fs.readFileSync(COMPOSITION, 'utf8');
  const hero = fs.readFileSync(HERO, 'utf8');
  const modal = fs.readFileSync(MODAL, 'utf8');
  const trust = fs.readFileSync(TRUST, 'utf8');

  it('unifies rounded dog-ear geometry and soft lift on Hero and pillars', () => {
    const shared = dogEarCut(200, 140, 22, 46);
    expect(shared.flap).toBe(dogEarFlap(46, 22));
    expect(shared.crease).toContain('C');
    expect(shared.face).toContain('C');
    expect(composition).toContain('dogEarCut(W, H, radius, fold)');
    expect(composition).not.toContain("'pillar'");
    expect(hero).toContain('dogEarCut(width, height, radius, fold)');
    // Hero + pillars share curl-matched flap silhouette soft lift (same peel system).
    expect(hero).toContain('curlShadow');
    expect(composition).toContain('curlShadow');
    expect(hero).toMatch(/d=\{flap\}[^>]*curlShadow/);
    expect(composition).toMatch(/d=\{flap\}[^>]*curlShadow/);
    expect(hero).toContain('-crease');
    expect(composition).toContain('-crease');
  });

  it('removes consumer OFF dispatch status under Feel the Burn while keeping the field', () => {
    expect(result).not.toContain('rveelPacketNutritionStatus');
    expect(result).toContain('<ResultIngredientsSection');
    expect(trust).toContain('rveelPacketNutritionStatus: nutritionStatus');
  });

  it('reduces the Score frame top margin for a closer Hero stack', () => {
    expect(frame).toContain('marginTop: 27');
    expect(frame).not.toContain('marginTop: 36');
  });

  it('places Origins qualifier before percentage and keeps preview wording', () => {
    const originsBlock = modal.slice(modal.indexOf("activeContext === 'origins'"));
    const percentHeading = originsBlock.indexOf('Percentage of ingredients');
    const qualifier = originsBlock.indexOf('Qualifier');
    const percentageLabel = originsBlock.indexOf('Percentage', percentHeading + 1);
    const preview = originsBlock.indexOf('Your product statement');
    const ingredientOrigin = originsBlock.indexOf('Ingredient origin');
    expect(percentHeading).toBeGreaterThan(0);
    expect(qualifier).toBeGreaterThan(percentHeading);
    expect(percentageLabel).toBeGreaterThan(qualifier);
    expect(ingredientOrigin).toBeGreaterThan(percentageLabel);
    expect(preview).toBeGreaterThan(ingredientOrigin);
    expect(originsBlock).toContain('Not stated');
    expect(originsBlock.indexOf('Not stated')).toBeLessThan(qualifier);
    expect(
      productOriginsEntrySentence({
        claimType: 'made_in',
        countries: ['Australia'],
        percentage: '96',
        percentageNotStated: false,
        qualifier: 'at_least',
        local: true,
        imported: false,
      })
    ).toBe('This product is made in Australia with at least 96% local ingredients.');
  });
});
