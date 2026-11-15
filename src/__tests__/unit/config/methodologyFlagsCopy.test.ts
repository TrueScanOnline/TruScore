import fs from 'fs';
import path from 'path';
import en from '../../../i18n/locales/en.json';
import { WHOLE_PRODUCE_NUTRITION_BONUS } from '../../../lib/truscoreEngine/pillars/bodyPillar';

type TrustScoreCopy = {
  infoModal: {
    trustScore: {
      step1: string;
      bodyDesc: string;
      bodySafetyDesc: string;
      planetDesc: string;
      ethicsDesc: string;
      openDesc: string;
      scoringDescription: string;
      excellentDesc: string;
      goodDesc: string;
      fairDesc: string;
      poorDesc: string;
      flags: string;
      flagsDescription: string;
      redFlags: string;
      redFlagsDesc: string;
      greenFlags: string;
      greenFlagsDesc: string;
      flagNegativeNewsDesc: string;
      flagGeopoliticsDesc: string;
      flagBoycottDesc: string;
      flagSustainabilityIssuesDesc: string;
      flagSustainabilityPositiveDesc: string;
      flagEthicsIssuesDesc: string;
      flagEthicsPositiveDesc: string;
      flagCertificationsDesc: string;
      flagNutritionIssuesDesc: string;
      flagNutritionPositiveDesc: string;
      flagProcessingIssuesDesc: string;
      flagPositiveReviewsDesc: string;
      dataSourceNote: string;
    };
  };
};

/**
 * Phase B1 final review — Result methodology Red/Green Flags and related
 * consumer copy must match implemented scoring / publication semantics.
 */
describe('Result methodology flags and score-band copy contracts', () => {
  const t = (en as TrustScoreCopy).infoModal.trustScore;
  const modalSource = fs.readFileSync(
    path.join(__dirname, '../../../components/TrustScoreInfoModal.tsx'),
    'utf8'
  );

  const flagCorpus = [
    t.flags,
    t.flagsDescription,
    t.redFlags,
    t.redFlagsDesc,
    t.greenFlags,
    t.greenFlagsDesc,
    t.flagNegativeNewsDesc,
    t.flagGeopoliticsDesc,
    t.flagBoycottDesc,
    t.flagSustainabilityIssuesDesc,
    t.flagSustainabilityPositiveDesc,
    t.flagEthicsIssuesDesc,
    t.flagEthicsPositiveDesc,
    t.flagCertificationsDesc,
    t.flagNutritionIssuesDesc,
    t.flagProcessingIssuesDesc,
    t.flagPositiveReviewsDesc,
    t.dataSourceNote,
  ]
    .join('\n')
    .toLowerCase();

  it('never represents food recalls as direct Rveel Score deductions', () => {
    const recall = t.flagNegativeNewsDesc.toLowerCase();
    expect(recall).toMatch(/separate from rveel score|dynamic signals/);
    expect(recall).toMatch(/not score deductions|are not score/);
    expect(recall).not.toMatch(/recall.{0,60}(decrease|reduce) .{0,20}(score|points)/);
    expect(t.dataSourceNote.toLowerCase()).toContain('separate from rveel score');
  });

  it('describes Planet via Eco-Score and packaging fallback, not independent carbon/water scoring', () => {
    expect(t.planetDesc.toLowerCase()).toContain('eco-score');
    expect(t.planetDesc.toLowerCase()).toMatch(/packaging fallback|packaging/);
    expect(t.flagSustainabilityIssuesDesc.toLowerCase()).toContain('eco-score');
    expect(t.flagSustainabilityIssuesDesc.toLowerCase()).toMatch(/packaging fallback|packaging/);
    expect(t.flagSustainabilityIssuesDesc.toLowerCase()).toMatch(
      /not each scored independently|not independent/
    );
    expect(t.flagSustainabilityPositiveDesc.toLowerCase()).toContain('eco-score');
    expect(t.flagSustainabilityPositiveDesc.toLowerCase()).not.toMatch(
      /low carbon footprint.*increase sustainability scores/
    );
  });

  it('aligns Claims flag copy with benchmarks, highest-scheme certs, and packet claims', () => {
    for (const text of [t.ethicsDesc, t.flagEthicsIssuesDesc, t.flagEthicsPositiveDesc, t.flagCertificationsDesc]) {
      const lower = text.toLowerCase();
      expect(lower).toMatch(/bbfaw|knowthechain|highest/);
    }
    expect(t.flagCertificationsDesc.toLowerCase()).toContain('fairtrade +6');
    expect(t.flagCertificationsDesc.toLowerCase()).toContain('organic +2');
    expect(t.flagCertificationsDesc.toLowerCase()).toMatch(/not stacked|no stacking/);
    expect(t.flagEthicsPositiveDesc.toLowerCase()).toMatch(/packet-claim|packet claim/);
  });

  it('distinguishes missing Transparency evidence from automatic negative scoring', () => {
    expect(t.flagGeopoliticsDesc.toLowerCase()).toMatch(/unrevealed|\bnr\b/);
    expect(t.flagGeopoliticsDesc.toLowerCase()).toMatch(/not treated as an automatic numeric penalty|not.*automatic/);
    expect(t.flagBoycottDesc.toLowerCase()).toMatch(/unrevealed|\bnr\b|checking/);
    expect(t.flagBoycottDesc.toLowerCase()).toMatch(/rather than simply reducing|prevent/);
    expect(t.flagPositiveReviewsDesc.toLowerCase()).toMatch(/nr|unrevealed/);
    expect(t.openDesc.toLowerCase()).toMatch(/unrevealed|\bnr\b/);
  });

  it('matches Body floor and scoring inputs; allergens are not a Body scoring input', () => {
    expect(t.step1.toLowerCase()).toContain('2–25');
    expect(t.step1.toLowerCase()).toContain('nutri-score');
    expect(t.step1.toLowerCase()).toContain('nova');
    expect(t.step1.toLowerCase()).toMatch(/additives of concern|food additives/);
    expect(t.step1.toLowerCase()).not.toContain('allergen');
    expect(t.bodySafetyDesc.toLowerCase()).toMatch(/not a body scoring input|not.*scoring input/);
    expect(t.bodyDesc.toLowerCase()).toContain('nutri-score');
    expect(modalSource).toMatch(/Body score \(2–25\)/);
    expect(modalSource).toMatch(/Allergens are not a Body scoring input/);
    expect(modalSource).not.toMatch(/Body score \(0-25\).*allergens/i);
  });

  it('avoids categorical Negative/Positive Points headings and unsupported absolute quality claims', () => {
    expect(t.redFlags.toLowerCase()).not.toContain('negative points');
    expect(t.greenFlags.toLowerCase()).not.toContain('positive points');
    expect(t.flagsDescription.toLowerCase()).toMatch(/do not automatically change|contextual|separate/);
    const bands = [t.excellentDesc, t.goodDesc, t.fairDesc, t.poorDesc, t.scoringDescription]
      .join(' ')
      .toLowerCase();
    expect(bands).toMatch(/under rveel's methodology|under rveel's assessment rules/);
    expect(bands).not.toMatch(/outstanding quality|better overall product quality across all dimensions/);
    expect(bands).toMatch(/do not certify|not guarantees|do not mean|do not by themselves prove/);
    expect(flagCorpus).not.toContain('100% transparent');
    expect(flagCorpus).not.toContain('zero reputational');
    expect(flagCorpus).not.toContain('upcitemdb');
  });

  it('explains Whole Produce +7 only when no valid Nutri-Score and eligibility gate (incl. NOVA 1) passes', () => {
    expect(WHOLE_PRODUCE_NUTRITION_BONUS).toBe(7);
    const nutritionPositive = t.flagNutritionPositiveDesc.toLowerCase();
    expect(nutritionPositive).toContain(`whole produce +${WHOLE_PRODUCE_NUTRITION_BONUS}`);
    expect(nutritionPositive).toMatch(/no valid nutri-score/);
    expect(nutritionPositive).toMatch(/eligibility gate|eligible/);
    expect(nutritionPositive).toContain('nova 1');
    expect(nutritionPositive).toMatch(/not themselves a scoring bonus|not a separate scoring bonus|not.*scoring bonus/);
    expect(nutritionPositive).not.toMatch(/whole foods.*improve nutrition scores|health benefits improve/);
  });

  it('describes Excellent/Good bands as combined assessments without implying every or most pillars are strong', () => {
    const excellent = t.excellentDesc.toLowerCase();
    const good = t.goodDesc.toLowerCase();
    expect(excellent).toMatch(/combined assessment/);
    expect(good).toMatch(/combined assessment/);
    expect(excellent).toMatch(/does not mean every pillar|not mean every pillar/);
    expect(good).toMatch(/do not mean most or all pillars|not mean most or all pillars/);
    expect(excellent).not.toMatch(/strong outcomes across the four pillars/);
    expect(good).not.toMatch(/most assessed pillars/);
  });
});
