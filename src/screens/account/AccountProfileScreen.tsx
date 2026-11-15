import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AccountScreenShell from '../../components/account/AccountScreenShell';
import { resultEmeraldCard, resultEmeraldTone } from '../../theme/resultPresentation';
import { useTheme } from '../../theme';

/**
 * Guest profile detail. Structured so authenticated fields can replace guest copy later.
 * Does not treat device contribution credentials as a customer login.
 */
export default function AccountProfileScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const emerald = resultEmeraldTone(!!darkMode);

  return (
    <AccountScreenShell
      title={t('account.profileTitle')}
      onBack={() => navigation.goBack()}
      testID="account-profile-screen"
    >
      <View style={[styles.card, resultEmeraldCard(!!darkMode)]}>
        <View style={[styles.avatar, { backgroundColor: darkMode ? '#243832' : '#E8F5F1' }]}>
          <Ionicons name="person" size={36} color={emerald.action} />
        </View>
        <Text style={[styles.heading, { color: emerald.ink }]}>{t('account.guest')}</Text>
        <Text style={[styles.body, { color: emerald.muted }]}>{t('account.profileGuestBody')}</Text>
        <Text style={[styles.body, { color: emerald.muted, marginTop: 12 }]}>
          {t('account.profileLocalStorageNote')}
        </Text>
      </View>
    </AccountScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
