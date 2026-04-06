import React, { useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import { NUTRITION_BURN_REFERENCE_KG, type NutritionBurnMinutes } from '../utils/nutritionBurnTime';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface NutritionBurnInfoModalProps {
  visible: boolean;
  onClose: () => void;
  kcalPer100g: number;
  burn: NutritionBurnMinutes;
  productName?: string;
  onSharePrefill: (prefill: string) => void;
}

export default function NutritionBurnInfoModal({
  visible,
  onClose,
  kcalPer100g,
  burn,
  productName,
  onSharePrefill,
}: NutritionBurnInfoModalProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const displayName = productName?.trim() || t('nutrition.burnProductFallback');

  /** Open system share sheet with empty prefill so Share Product uses the standard "Check this out…" hook + summary. */
  const handleShare = useCallback(() => {
    onSharePrefill('');
  }, [onSharePrefill]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlayTouchable} />
        </TouchableWithoutFeedback>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <Ionicons name="calculator-outline" size={24} color={colors.primary} style={styles.icon} />
              <Text style={[styles.title, { color: colors.text }]}>{t('nutrition.burnModalTitle')}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeIconButton, { backgroundColor: colors.surface }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            <View
              style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              accessibilityRole="summary"
              accessibilityLabel={t('nutrition.burnModalHeroA11y', {
                name: displayName,
                kcal: Math.round(kcalPer100g),
                walk: burn.walking,
                run: burn.running,
                cycle: burn.cycling,
              })}
            >
              <Text style={[styles.heroProduct, { color: colors.text }]} numberOfLines={4}>
                {displayName}
              </Text>
              <Text style={[styles.heroKcal, { color: colors.primary }]}>
                {t('nutrition.burnModalHeroKcal', { kcal: Math.round(kcalPer100g) })}
              </Text>
              <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />
              <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
                {t('nutrition.burnModalHeroSub', { weightKg: NUTRITION_BURN_REFERENCE_KG })}
              </Text>
              <View style={styles.heroRows}>
                <View style={styles.heroRow}>
                  <View style={[styles.heroIconWrap, { backgroundColor: colors.primary + '18' }]}>
                    <Ionicons name="walk-outline" size={22} color={colors.primary} />
                  </View>
                  <Text style={[styles.heroRowText, { color: colors.text }]}>
                    {t('nutrition.burnModalHeroWalk', { min: burn.walking })}
                  </Text>
                </View>
                <View style={styles.heroRow}>
                  <View style={[styles.heroIconWrap, { backgroundColor: colors.primary + '18' }]}>
                    <Ionicons name="fitness-outline" size={22} color={colors.primary} />
                  </View>
                  <Text style={[styles.heroRowText, { color: colors.text }]}>
                    {t('nutrition.burnModalHeroRun', { min: burn.running })}
                  </Text>
                </View>
                <View style={styles.heroRow}>
                  <View style={[styles.heroIconWrap, { backgroundColor: colors.primary + '18' }]}>
                    <Ionicons name="bicycle-outline" size={22} color={colors.primary} />
                  </View>
                  <Text style={[styles.heroRowText, { color: colors.text }]}>
                    {t('nutrition.burnModalHeroCycle', { min: burn.cycling })}
                  </Text>
                </View>
              </View>
              <Text style={[styles.heroFootnote, { color: colors.textTertiary }]}>
                {t('nutrition.burnModalHeroFootnote')}
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('nutrition.burnModalSectionSources')}</Text>
            <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
              {t('nutrition.burnModalSourcesBody')}
            </Text>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('nutrition.burnModalSectionMets')}</Text>
            <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
              {t('nutrition.burnModalMetsBody')}
            </Text>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('nutrition.burnModalSectionActivities')}</Text>
            <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
              {t('nutrition.burnModalActivitiesTable')}
            </Text>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('nutrition.burnModalSectionFormula')}</Text>
            <Text style={[styles.formulaMono, { color: colors.text, backgroundColor: colors.surface }]}>
              {t('nutrition.burnModalFormulaLine')}
            </Text>
            <Text style={[styles.paragraph, { color: colors.textSecondary }]}>{t('nutrition.burnModalFor70kg')}</Text>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('nutrition.burnModalSectionHybrid')}</Text>
            <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
              {t('nutrition.burnModalHybridBody')}
            </Text>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('nutrition.burnModalSectionReality')}</Text>
            <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
              {t('nutrition.burnModalRealityBody')}
            </Text>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('nutrition.burnModalSectionPosition')}</Text>
            <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
              {t('nutrition.burnModalPositionBody')}
            </Text>

            <View style={[styles.disclaimerBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
                {t('nutrition.burnModalDisclaimer')}
              </Text>
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: colors.primary }]}
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel={t('nutrition.burnShareA11y')}
            >
              <Ionicons name="share-social-outline" size={20} color="#fff" />
              <Text style={styles.shareButtonText}>{t('common.share')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.done')}
            >
              <Text style={[styles.doneButtonText, { color: colors.text }]}>{t('common.done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: SCREEN_HEIGHT * 0.88,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  icon: { marginRight: 4 },
  title: { fontSize: 20, fontWeight: '700', flex: 1 },
  closeIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { maxHeight: SCREEN_HEIGHT * 0.55 },
  contentContainer: { padding: 20, paddingBottom: 12 },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 8,
  },
  heroProduct: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  heroKcal: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  heroDivider: {
    height: 1,
    marginVertical: 14,
  },
  heroSub: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'none',
  },
  heroRows: { gap: 4 },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  heroIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRowText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  heroFootnote: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 14, marginBottom: 8 },
  paragraph: { fontSize: 14, lineHeight: 21, marginBottom: 10 },
  formulaMono: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  disclaimerBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
    marginTop: 8,
  },
  disclaimerText: { flex: 1, fontSize: 13, lineHeight: 19 },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    minHeight: 48,
  },
  shareButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  doneButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  doneButtonText: { fontSize: 16, fontWeight: '600' },
});
