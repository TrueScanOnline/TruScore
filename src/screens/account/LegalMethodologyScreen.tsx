import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AccountScreenShell from '../../components/account/AccountScreenShell';
import AccountSection from '../../components/account/AccountSection';
import AccountRow from '../../components/account/AccountRow';
import InfoModal from '../../components/InfoModal';
import { isLegalDestinationReady, legalDestinations } from '../../config/legalDestinations';
import { productIdentity } from '../../config/productIdentity';
import { openLegalDestination } from '../../utils/openLegalDestination';
import { resultEmeraldTone } from '../../theme/resultPresentation';
import { useTheme } from '../../theme';

type Panel = 'methodology' | 'sources' | 'limitations' | null;

/**
 * Legal & Methodology — uses existing governed copy where available.
 * Configured privacy/terms web destinations open only when verified ready.
 */
export default function LegalMethodologyScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { darkMode, colors } = useTheme();
  const emerald = resultEmeraldTone(!!darkMode);
  const [panel, setPanel] = useState<Panel>(null);

  const openExternalOrBlock = async (key: 'privacy' | 'terms') => {
    const dest = legalDestinations[key];
    const result = await openLegalDestination(key);
    if (result === 'blocked') {
      Alert.alert(
        key === 'privacy' ? t('settings.privacyPolicy') : t('account.termsOfUse'),
        t('account.legalUrlUnavailable', { url: dest.url })
      );
      return;
    }
    if (result === 'failed') {
      Alert.alert(t('common.error'), t('account.legalOpenFailed'));
    }
  };

  return (
    <AccountScreenShell
      title={t('account.legalMethodology')}
      onBack={() => navigation.goBack()}
      testID="account-legal-screen"
    >
      <Text style={[styles.intro, { color: emerald.muted }]} maxFontSizeMultiplier={1.35}>
        {t('account.legalIntro')}
      </Text>

      <AccountSection title={t('account.legalDocuments')}>
        <AccountRow
          icon="shield-outline"
          label={t('settings.privacyPolicy')}
          value={
            isLegalDestinationReady('privacy')
              ? undefined
              : t('account.documentUnavailableShort')
          }
          onPress={() => {
            void openExternalOrBlock('privacy');
          }}
          accessibilityHint={t('account.a11yLegalDocument')}
          testID="account-legal-privacy"
        />
        <AccountRow
          icon="document-outline"
          label={t('account.termsOfUse')}
          value={
            isLegalDestinationReady('terms')
              ? undefined
              : t('account.documentUnavailableShort')
          }
          onPress={() => {
            void openExternalOrBlock('terms');
          }}
          accessibilityHint={t('account.a11yLegalDocument')}
          testID="account-legal-terms"
          isLast
        />
      </AccountSection>

      <AccountSection title={t('account.methodologySection')}>
        <AccountRow
          icon="analytics-outline"
          label={t('account.scoreMethodology')}
          onPress={() => setPanel('methodology')}
          testID="account-legal-methodology"
        />
        <AccountRow
          icon="library-outline"
          label={t('account.dataSourcesLicences')}
          onPress={() => setPanel('sources')}
          testID="account-legal-sources"
        />
        <AccountRow
          icon="alert-circle-outline"
          label={t('account.importantLimitations')}
          onPress={() => setPanel('limitations')}
          testID="account-legal-limitations"
          isLast
        />
      </AccountSection>

      <InfoModal
        visible={panel === 'methodology'}
        onClose={() => setPanel(null)}
        title={t('account.scoreMethodology')}
        icon="analytics-outline"
        iconColor={emerald.action}
      >
        <Text style={[styles.modalHeading, { color: colors.text }]}>
          {t('infoModal.trustScore.howItWorks')}
        </Text>
        <Text style={[styles.modalText, { color: colors.text }]}>
          {t('infoModal.trustScore.description')}
        </Text>
        <Text style={[styles.modalText, { color: colors.textSecondary }]}>
          {t('infoModal.trustScore.howItWorksText')}
        </Text>
        <Text style={[styles.modalHeading, { color: colors.text }]}>
          {t('infoModal.trustScore.whenScoreShown')}
        </Text>
        <Text style={[styles.modalText, { color: colors.textSecondary }]}>
          {t('infoModal.trustScore.whenScoreShownText')}
        </Text>
        <Text style={[styles.modalHeading, { color: colors.text }]}>
          {t('infoModal.trustScore.confidenceMeaning')}
        </Text>
        <Text style={[styles.modalText, { color: colors.textSecondary }]}>
          {t('infoModal.trustScore.confidenceMeaningText')}
        </Text>
        <Text style={[styles.modalHeading, { color: colors.text }]}>
          {t('infoModal.trustScore.methodologyLimitations')}
        </Text>
        <Text style={[styles.modalText, { color: colors.textSecondary }]}>
          {t('infoModal.trustScore.methodologyLimitationsText')}
        </Text>
        <Text style={[styles.modalText, { color: colors.textSecondary }]}>
          {t('infoModal.trustScore.note')}
        </Text>
      </InfoModal>

      <InfoModal
        visible={panel === 'sources'}
        onClose={() => setPanel(null)}
        title={t('account.dataSourcesLicences')}
        icon="library-outline"
        iconColor={emerald.action}
      >
        <Text style={[styles.modalText, { color: colors.text }]}>
          {t('settings.openSourceMessage')}
        </Text>
        <Text style={[styles.modalText, { color: colors.textSecondary }]}>
          {t('infoModal.trustScore.dataSourceNote')}
        </Text>
        <Text style={[styles.modalText, { color: colors.textSecondary }]}>
          {t('account.legalSignalsNote')}
        </Text>
      </InfoModal>

      <InfoModal
        visible={panel === 'limitations'}
        onClose={() => setPanel(null)}
        title={t('account.importantLimitations')}
        icon="alert-circle-outline"
        iconColor={emerald.action}
      >
        <Text style={[styles.modalText, { color: colors.text }]}>
          {t('result.legalDisclaimerModalP1')}
        </Text>
        <Text style={[styles.modalText, { color: colors.textSecondary }]}>
          {t('result.legalDisclaimerModalP2')}
        </Text>
        <Text style={[styles.modalText, { color: colors.textSecondary }]}>
          {t('result.legalDisclaimerModalP3')}
        </Text>
        <Text style={[styles.modalText, { color: colors.textSecondary }]}>
          {t('result.legalDataLimitationsModalP1')}
        </Text>
      </InfoModal>

      <View style={styles.footerNote}>
        <Text style={[styles.footerText, { color: emerald.muted }]}>
          {t('account.legalFooterNote', { product: productIdentity.shortName })}
        </Text>
      </View>
    </AccountScreenShell>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  modalHeading: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
    marginBottom: 6,
    marginTop: 4,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
  footerNote: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  footerText: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
});
