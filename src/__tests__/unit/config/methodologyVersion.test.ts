import en from '../../../i18n/locales/en.json';
import fr from '../../../i18n/locales/fr.json';
import es from '../../../i18n/locales/es.json';
import {
  METHODOLOGY_REVIEW_TRIGGER_PATHS,
  RVEEL_SCORE_METHODOLOGY_VERSION,
} from '../../../config/methodologyVersion';

type TrustScoreStrings = {
  infoModal: {
    trustScore: {
      note: string;
      description: string;
      transparencyTitle: string;
      transparencyNote: string;
      dataSourceNote: string;
      howItWorksText: string;
      ethicsDesc: string;
      dataSourcesDescription: string;
    };
  };
};

/**
 * INV-SC-9 / D-9: internal methodology version must remain as an engineering lock,
 * but must not be exposed as a consumer-facing methodology version label.
 */
describe('Rveel Score methodology version lock (INV-SC-9)', () => {
  const consumerVersionToken = `v${RVEEL_SCORE_METHODOLOGY_VERSION}`;
  const enTrust = (en as TrustScoreStrings).infoModal.trustScore;
  const frTrust = (fr as TrustScoreStrings).infoModal.trustScore;
  const esTrust = (es as TrustScoreStrings).infoModal.trustScore;

  it('preserves the internal engineering methodology version constant', () => {
    expect(RVEEL_SCORE_METHODOLOGY_VERSION).toBe('1.4');
    expect(METHODOLOGY_REVIEW_TRIGGER_PATHS.length).toBeGreaterThan(0);
  });

  it('does not expose the obsolete consumer methodology version token in EN/FR/ES notes', () => {
    for (const note of [enTrust.note, frTrust.note, esTrust.note]) {
      expect(note.toLowerCase()).not.toContain(consumerVersionToken.toLowerCase());
      expect(note.toLowerCase()).not.toContain('rveel score v1.4');
    }
  });

  it('keeps EN consumer methodology copy free of absolute accuracy / transparency claims', () => {
    const joined = [
      enTrust.description,
      enTrust.howItWorksText,
      enTrust.note,
      enTrust.transparencyTitle,
      enTrust.transparencyNote,
      enTrust.dataSourceNote,
      enTrust.dataSourcesDescription,
      enTrust.ethicsDesc,
    ]
      .join(' ')
      .toLowerCase();

    expect(joined).not.toContain('100% transparent');
    expect(joined).not.toContain('based entirely on');
    expect(joined).not.toContain('no proprietary');
    expect(joined).not.toContain('independently verifiable');
    expect(joined).not.toContain('zero reputational risk');
    expect(joined).not.toContain('maximum credibility');
    expect(joined).not.toContain('upcitemdb');
    expect(joined).not.toContain('barcode spider');
  });

  it('aligns EN Claims description with highest-scheme certification weights (no stacking)', () => {
    const ethics = enTrust.ethicsDesc.toLowerCase();
    expect(ethics).toContain('highest');
    expect(ethics).toContain('fairtrade +6');
    expect(ethics).toContain('organic +2');
    expect(ethics).not.toContain('fairtrade +8');
    expect(ethics).toMatch(/not stacked|no stacking|highest scheme only/);
    expect(ethics).not.toMatch(/multiple labels can stack|stack up to \+25/);
  });
});
