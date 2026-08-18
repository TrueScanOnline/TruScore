/**
 * Dynamic Signals consumer module — "Did You Know?"
 *
 * Neutral treatment distinct from the four coloured TruScore pillars.
 * Category distinction is label + icon only (Food Safety / In the News).
 * My Choices (class C) is hidden. No severity/urgency styling.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BannerAlertsData, BannerSignalClass } from '../types/bannerAlerts';
import { consumerSignalCategoryLabel } from '../signals/signalRenderMapping';
import { useTheme } from '../theme';

interface BannerAlertsCardProps {
  alertsData: BannerAlertsData;
}

function categoryIcon(signalClass: BannerSignalClass | undefined): keyof typeof Ionicons.glyphMap {
  if (signalClass === 'A') return 'shield-checkmark-outline';
  return 'newspaper-outline';
}

export default function BannerAlertsCard({ alertsData }: BannerAlertsCardProps) {
  const { colors } = useTheme();
  const dyk = colors.didYouKnow;
  const alerts = alertsData.alerts.filter((alert) => alert.signalClass !== 'C');

  if (!alertsData.hasAlerts || alerts.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: dyk.card,
          borderColor: dyk.border,
        },
      ]}
      accessibilityLabel="did-you-know-module"
    >
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: dyk.charcoal }]}>Did You Know?</Text>
      </View>

      <ScrollView style={styles.alertsList} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        {alerts.map((alert, index) => {
          const category = consumerSignalCategoryLabel(alert.signalClass);
          const AlertContainer = alert.actionUrl ? TouchableOpacity : View;
          const containerProps = alert.actionUrl
            ? {
                onPress: () => {
                  if (alert.actionUrl) {
                    Linking.openURL(alert.actionUrl).catch((err) => {
                      console.error('Failed to open URL:', err);
                    });
                  }
                },
                activeOpacity: 0.7,
              }
            : {};

          return (
            <AlertContainer
              key={alert.id}
              accessibilityLabel={`banner-signal-${alert.signalClass ?? 'B'}`}
              style={[
                styles.alertItem,
                index < alerts.length - 1 && styles.alertItemWithMargin,
              ]}
              {...containerProps}
            >
              <View style={styles.alertContent}>
                {category ? (
                  <View
                    style={[
                      styles.categoryBadge,
                      {
                        backgroundColor: dyk.badgeBackground,
                        borderColor: dyk.border,
                      },
                    ]}
                    accessibilityLabel={`did-you-know-category-${category}`}
                  >
                    <Ionicons name={categoryIcon(alert.signalClass)} size={14} color={dyk.charcoal} />
                    <Text style={[styles.categoryBadgeText, { color: dyk.charcoal }]}>{category}</Text>
                  </View>
                ) : null}
                <View style={styles.alertTitleRow}>
                  <Text style={[styles.alertTitle, { color: dyk.charcoal }]}>{alert.title}</Text>
                  {alert.actionUrl ? (
                    <Ionicons
                      name="open-outline"
                      size={16}
                      color={dyk.charcoal}
                      style={styles.externalLinkIcon}
                    />
                  ) : null}
                </View>
                <Text style={[styles.alertMessage, { color: colors.text }]}>{alert.message}</Text>
              </View>
            </AlertContainer>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    maxHeight: 300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  alertsList: {
    maxHeight: 250,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertItemWithMargin: {
    marginBottom: 16,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  externalLinkIcon: {
    marginLeft: 8,
  },
  alertContent: {
    flex: 1,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    flexShrink: 1,
  },
  alertMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
});
