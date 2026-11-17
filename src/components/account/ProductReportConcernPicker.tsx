import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  PRODUCT_REPORT_CONCERN_LABEL_KEYS,
  PRODUCT_REPORT_CONCERN_TYPES,
  type ProductReportConcernType,
} from '../../content/accountTrustContent';
import { resultEmeraldCard, resultEmeraldTone } from '../../theme/resultPresentation';
import { useTheme } from '../../theme';

type Props = {
  visible: boolean;
  onCancel: () => void;
  onSelect: (concern: ProductReportConcernType) => void;
};

/**
 * Accessible concern chooser for product-information reports.
 * Selection is passed into the mailto body; opening email does not create a ticket.
 */
export default function ProductReportConcernPicker({ visible, onCancel, onSelect }: Props) {
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const emerald = resultEmeraldTone(!!darkMode);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel} accessibilityRole="button" accessibilityLabel={t('common.cancel')}>
        <Pressable
          style={[styles.sheet, resultEmeraldCard(!!darkMode)]}
          onPress={(e) => e.stopPropagation()}
          accessibilityViewIsModal
          testID="product-report-concern-picker"
        >
          <Text style={[styles.title, { color: emerald.ink }]} maxFontSizeMultiplier={1.35}>
            {t('account.reportConcernTitle')}
          </Text>
          <Text style={[styles.subtitle, { color: emerald.muted }]} maxFontSizeMultiplier={1.35}>
            {t('account.reportConcernSubtitle')}
          </Text>
          <ScrollView style={styles.list} accessibilityRole="menu">
            {PRODUCT_REPORT_CONCERN_TYPES.map((concern) => (
              <TouchableOpacity
                key={concern}
                style={[styles.row, { borderBottomColor: emerald.line }]}
                onPress={() => onSelect(concern)}
                accessibilityRole="menuitem"
                accessibilityLabel={t(PRODUCT_REPORT_CONCERN_LABEL_KEYS[concern])}
                testID={`product-report-concern-${concern}`}
              >
                <Text style={[styles.rowLabel, { color: emerald.ink }]} maxFontSizeMultiplier={1.35}>
                  {t(PRODUCT_REPORT_CONCERN_LABEL_KEYS[concern])}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.cancel}
            onPress={onCancel}
            accessibilityRole="button"
            testID="product-report-concern-cancel"
          >
            <Text style={[styles.cancelText, { color: emerald.action }]} maxFontSizeMultiplier={1.35}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '78%',
    marginHorizontal: 12,
    marginBottom: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  list: {
    paddingHorizontal: 4,
  },
  row: {
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  cancel: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
