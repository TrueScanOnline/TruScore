/**
 * W5-UI-09 founder Result refinements.
 * Presentation contracts only — no scoring or publication changes.
 */

import fs from 'fs';
import path from 'path';
import { dogEarCut, dogEarFlap } from '../../../components/product/emerald/dogEar';
import {
  CLAIMS_LIMITED_CONFIDENCE_BODY,
  CLAIMS_LIMITED_CONFIDENCE_TITLE,
} from '../../../components/claimsLimitedConfidenceCopy';
import { PRODUCT_ORIGINS_LIMITED_CONFIDENCE } from '../../../components/productOriginsCardCopy';
import {
  ABOUT_THIS_INFORMATION,
  ADD_OR_CORRECT_INFORMATION,
  PRODUCT_INFORMATION_HEADING,
  PRODUCT_INFORMATION_MENU_INSTRUCTION,
  PRODUCT_INFORMATION_SUPPORT,
} from '../../../contribution/productInformationMenu';
import {
  RESULT_SCORE_HIGHLIGHTS_HEADING,
  SCORE_HIGHLIGHTS_HEADING,
} from '../../../lib/scoreHighlights';

const REPO = path.join(__dirname, '../../../..');
const RESULT = path.join(REPO, 'app/result/[barcode].tsx');
const COMPOSITION = path.join(REPO, 'src/components/product/emerald/EmeraldScoreComposition.tsx');
const HERO = path.join(REPO, 'src/components/product/ProductHeroSection.tsx');
const HIGHLIGHTS_LIST = path.join(REPO, 'src/components/ScoreHighlightsList.tsx');
const EN = path.join(REPO, 'src/i18n/locales/en.json');

describe('W5-UI-09 founder Result refinements', () => {
  const result = fs.readFileSync(RESULT, 'utf8');
  const composition = fs.readFileSync(COMPOSITION, 'utf8');
  const hero = fs.readFileSync(HERO, 'utf8');
  const highlightsList = fs.readFileSync(HIGHLIGHTS_LIST, 'utf8');
  const en = JSON.parse(fs.readFileSync(EN, 'utf8'));

  it('opens Claims Limited confidence with the Origins pill pattern and Claims-specific copy', () => {
    expect(result).toContain("claims.confidenceReasonCode === 'claims_primary_contribution_limited'");
    expect(result).toContain('setClaimsLimitedConfidenceVisible(true)');
    expect(result).toContain('claimsLimitedConfidenceVisible');
    expect(result).toContain('Limited confidence &gt;');
    expect(result).toContain('CLAIMS_LIMITED_CONFIDENCE_BODY');
    expect(result).toContain('CLAIMS_LIMITED_CONFIDENCE_TITLE');
    expect(CLAIMS_LIMITED_CONFIDENCE_TITLE).toBe('Limited confidence');
    expect(CLAIMS_LIMITED_CONFIDENCE_BODY).toContain('community');
    expect(CLAIMS_LIMITED_CONFIDENCE_BODY).toContain(
      'does not guarantee that the score or confidence will change'
    );
    expect(PRODUCT_ORIGINS_LIMITED_CONFIDENCE).toContain('Product Origins');
    expect(CLAIMS_LIMITED_CONFIDENCE_BODY).not.toEqual(PRODUCT_ORIGINS_LIMITED_CONFIDENCE);
  });

  it('uses the exact Product Information English wording and one contribution entry', () => {
    expect(PRODUCT_INFORMATION_HEADING).toBe('Information missing?');
    expect(PRODUCT_INFORMATION_SUPPORT).toBe(
      'If you think any of the information about this product displayed is incorrect or missing then please help us out and make any necessary additions.'
    );
    expect(ADD_OR_CORRECT_INFORMATION).toBe('Add or correct information');
    expect(ABOUT_THIS_INFORMATION).toBe('Data limitations >');
    expect(PRODUCT_INFORMATION_MENU_INSTRUCTION).toBe('Choose the information you would like to update.');
    expect(en.result.productInformationHeading).toBe(PRODUCT_INFORMATION_HEADING);
    expect(en.result.productInformationSupport).toBe(PRODUCT_INFORMATION_SUPPORT);
    expect(result).toContain('productInformationMenuSections');
    expect(result).toContain('freshProductInformationMenu');
    expect(result).toContain('chevron-forward');
    expect(result).toContain('setProductInformationExpandedCategory');
  });

  it('keeps Add and Change as separate expanded actions and refuses a stale menu tap', () => {
    expect(result).toContain("openContribution(row.destination, row.journey, row.formFirst)");
    expect(result).toContain('setProductInformationExpandedCategory(null)');
    expect(result).toContain('live.actions.length === 1');
    expect(result).toMatch(/if \(!row\)[\s\S]*setContributionChoice\(null\)/);
  });

  it('uses one rounded dog-ear geometry on Hero and Score pillars', () => {
    const heroCut = dogEarCut(320, 180, 22, 46);
    const pillarCut = dogEarCut(160, 138, 22, 46);
    expect(heroCut.flap).toBe(dogEarFlap(46, 22));
    expect(pillarCut.flap).toBe(dogEarFlap(46, 22));
    expect(heroCut.crease).toContain('C');
    expect(pillarCut.crease).toContain('C');
    expect(composition).toContain('dogEarCut(W, H, radius, fold)');
    expect(composition).not.toContain("'pillar'");
    expect(composition).toContain("overflow: 'visible'");
    expect(hero).toContain('dogEarCut(width, height, radius, fold)');
  });

  it('changes only the Result Highlights heading', () => {
    expect(RESULT_SCORE_HIGHLIGHTS_HEADING).toBe('What we noticed:');
    expect(SCORE_HIGHLIGHTS_HEADING).toBe('What we found');
    expect(result).toContain('RESULT_SCORE_HIGHLIGHTS_HEADING');
    expect(result).toContain('heading={RESULT_SCORE_HIGHLIGHTS_HEADING}');
    expect(highlightsList).toContain('heading = SCORE_HIGHLIGHTS_HEADING');
  });
});
