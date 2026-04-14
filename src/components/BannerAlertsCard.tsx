/**
 * Banner Alerts Card Component
 * 
 * Displays alerts above the main score card.
 * Alerts are a combination of APP-generated alerts and User Preference alerts.
 * 
 * Styling:
 * - Red heading "ALERT"
 * - Red frame/border
 * - Light red background fill
 * - Only displays when alerts are present
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { BannerAlert, BannerAlertsData } from '../types/bannerAlerts';
import { useTheme } from '../theme';

interface BannerAlertsCardProps {
  alertsData: BannerAlertsData;
}

export default function BannerAlertsCard({ alertsData }: BannerAlertsCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  // Don't render if no alerts
  if (!alertsData.hasAlerts || alertsData.alerts.length === 0) {
    return null;
  }

  // Light red background color
  const lightRedBackground = '#ffebee'; // Material Design light red
  const redBorder = '#d32f2f'; // Material Design red
  const redText = '#c62828'; // Darker red for text

  return (
    <View style={[styles.container, { 
      backgroundColor: lightRedBackground,
      borderColor: redBorder,
      borderWidth: 2,
    }]}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="alert-circle" size={24} color={redText} />
        <Text style={[styles.headerText, { color: redText }]}>ALERT</Text>
        {alertsData.alertCount > 1 && (
          <Text style={[styles.alertCount, { color: redText }]}>
            ({alertsData.alertCount})
          </Text>
        )}
      </View>

      {/* Alerts List */}
      <ScrollView 
        style={styles.alertsList}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {alertsData.alerts.map((alert, index) => {
          const AlertContainer = alert.actionUrl ? TouchableOpacity : View;
          const containerProps = alert.actionUrl ? {
            onPress: () => {
              if (alert.actionUrl) {
                Linking.openURL(alert.actionUrl).catch(err => {
                  console.error('Failed to open URL:', err);
                });
              }
            },
            activeOpacity: 0.7,
          } : {};

          return (
            <AlertContainer
              key={alert.id}
              accessibilityLabel={`banner-signal-${alert.signalClass ?? 'B'}`}
              style={[
                styles.alertItem,
                index < alertsData.alerts.length - 1 && styles.alertItemWithMargin,
                alert.actionUrl && styles.alertItemClickable,
              ]}
              {...containerProps}
            >
              {/* Alert Icon */}
              <View style={styles.alertIconContainer}>
                <Ionicons 
                  name={
                    alert.category === 'recall' ? 'warning' :
                    alert.category === 'animal_cruelty' ? 'paw' :
                    alert.category === 'labor_violations' ? 'people' :
                    alert.category === 'palm_oil' ? 'leaf' :
                    alert.category === 'geopolitical' ? 'globe' :
                    'information-circle'
                  }
                  size={20}
                  color={redText}
                />
              </View>

              {/* Alert Content */}
              <View style={styles.alertContent}>
                <View style={styles.alertTitleRow}>
                  <Text style={[styles.alertTitle, { color: redText }]}>
                    {alert.title}
                  </Text>
                  {alert.actionUrl && (
                    <Ionicons name="open-outline" size={16} color={colors.primary} style={styles.externalLinkIcon} />
                  )}
                </View>
                <Text style={[styles.alertMessage, { color: colors.text }]}>
                  {alert.message}
                </Text>
                
                {/* Source Badge */}
                {alert.sourceDetails?.organization && (
                  <View style={styles.sourceBadge}>
                    <Text style={[styles.sourceText, { color: colors.textSecondary }]}>
                      Source: {alert.sourceDetails.organization}
                    </Text>
                  </View>
                )}
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
    maxHeight: 300, // Limit height, allow scrolling if many alerts
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  alertCount: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  alertsList: {
    maxHeight: 250,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertItemClickable: {
    // Style for clickable alerts
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
  alertIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  sourceBadge: {
    marginTop: 4,
  },
  sourceText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
