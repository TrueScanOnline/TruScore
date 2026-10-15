import i18n from '../../../i18n';

describe('common.remove localisation', () => {
  test('the active locale and the English fallback say Remove', () => {
    expect(i18n.t('common.remove')).toBe('Remove');
    expect(i18n.t('common.remove', { lng: 'en' })).toBe('Remove');
    expect(i18n.t('common.remove', { lng: 'de' })).toBe('Remove');
  });

  test('dormant locales use their own wording', () => {
    expect(i18n.t('common.remove', { lng: 'fr' })).toBe('Retirer');
    expect(i18n.t('common.remove', { lng: 'es' })).toBe('Quitar');
    expect(i18n.t('common.remove', { lng: 'fr' })).not.toBe('Remove');
    expect(i18n.t('common.remove', { lng: 'es' })).not.toBe('Remove');
  });
});
