import en from '../../../i18n/locales/en.json';
import fr from '../../../i18n/locales/fr.json';
import es from '../../../i18n/locales/es.json';
import { RVEEL_SCORE_METHODOLOGY_VERSION } from '../../../config/methodologyVersion';

describe('Rveel Score methodology version lock', () => {
  const v = `v${RVEEL_SCORE_METHODOLOGY_VERSION}`;

  it('EN/FR/ES methodology notes include the same version token as methodologyVersion.ts', () => {
    expect((en as { infoModal: { trustScore: { note: string } } }).infoModal.trustScore.note.toLowerCase()).toContain(
      v
    );
    expect((fr as { infoModal: { trustScore: { note: string } } }).infoModal.trustScore.note.toLowerCase()).toContain(
      v
    );
    expect((es as { infoModal: { trustScore: { note: string } } }).infoModal.trustScore.note.toLowerCase()).toContain(
      v
    );
  });
});
