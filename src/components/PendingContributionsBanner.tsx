/**
 * Pending Contributions Banner
 * 
 * Shows when user has pending contributions that haven't been submitted
 * Displays a banner with "Submit All" button to submit all contributions at once
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import { 
  hasPendingContributions, 
  getPendingContributions, 
  submitAllContributions,
  clearPendingContributions,
  AccumulatedContributions 
} from '../services/unifiedContributionService';
import { logger } from '../utils/logger';

interface PendingContributionsBannerProps {
  barcode: string;
  onSubmitted?: () => void;
}

export default function PendingContributionsBanner({ 
  barcode, 
  onSubmitted 
}: PendingContributionsBannerProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [hasPending, setHasPending] = useState(false);
  const [pending, setPending] = useState<AccumulatedContributions | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPendingContributions();
  }, [barcode]);

  const checkPendingContributions = async () => {
    try {
      setLoading(true);
      const hasPendingData = await hasPendingContributions(barcode);
      setHasPending(hasPendingData);
      
      if (hasPendingData) {
        const pendingData = await getPendingContributions(barcode);
        setPending(pendingData);
      } else {
        setPending(null);
      }
    } catch (error) {
      logger.error('[PendingContributionsBanner] Error checking pending contributions:', error);
      setHasPending(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAll = async () => {
    Alert.alert(
      t('contribution.submitAllTitle') || 'Submit All Contributions',
      t('contribution.submitAllMessage') || 'Submit all your contributions (photos, product info, country) to make them available to all users?',
      [
        {
          text: t('common.cancel') || 'Cancel',
          style: 'cancel',
        },
        {
          text: t('common.submit') || 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              const result = await submitAllContributions(barcode);
              
              if (result.success) {
                Alert.alert(
                  t('contribution.submitSuccess') || 'Success!',
                  t('contribution.submitSuccessMessage') || 'All your contributions have been submitted and are now available to all users.',
                  [{ text: t('common.ok') || 'OK' }]
                );
                
                // Refresh pending status
                await checkPendingContributions();
                
                // Notify parent
                onSubmitted?.();
              } else {
                const errorMessage = result.errors.length > 0
                  ? result.errors.join('\n')
                  : t('contribution.submitError') || 'Some contributions failed to submit. Please try again.';
                
                Alert.alert(
                  t('contribution.submitError') || 'Submission Error',
                  errorMessage,
                  [{ text: t('common.ok') || 'OK' }]
                );
              }
            } catch (error) {
              logger.error('[PendingContributionsBanner] Error submitting contributions:', error);
              Alert.alert(
                t('common.error') || 'Error',
                t('contribution.submitError') || 'Failed to submit contributions. Please try again.',
                [{ text: t('common.ok') || 'OK' }]
              );
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleDismiss = async () => {
    Alert.alert(
      t('contribution.dismissTitle') || 'Dismiss Contributions?',
      t('contribution.dismissMessage') || 'Are you sure you want to dismiss these contributions? They will not be submitted.',
      [
        {
          text: t('common.cancel') || 'Cancel',
          style: 'cancel',
        },
        {
          text: t('common.dismiss') || 'Dismiss',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearPendingContributions(barcode);
              await checkPendingContributions();
            } catch (error) {
              logger.error('[PendingContributionsBanner] Error clearing contributions:', error);
            }
          },
        },
      ]
    );
  };

  if (loading || !hasPending || !pending) {
    return null;
  }

  const contributionCount = [
    pending.photos.length > 0,
    !!(pending.productData.product_name || pending.productData.ingredients_text || pending.productData.nutriments),
    !!pending.manufacturingCountry,
  ].filter(Boolean).length;

  return (
    <View style={[styles.banner, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('contribution.pendingTitle') || 'Pending Contributions'}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {t('contribution.pendingDescription', { count: contributionCount }) || 
              `You have ${contributionCount} contribution(s) ready to submit`}
          </Text>
          
          {/* Show what's pending */}
          <View style={styles.pendingList}>
            {pending.photos.length > 0 && (
              <View style={styles.pendingItem}>
                <Ionicons name="camera-outline" size={16} color={colors.primary} />
                <Text style={[styles.pendingText, { color: colors.textSecondary }]}>
                  {pending.photos.length} photo(s)
                </Text>
              </View>
            )}
            {(pending.productData.product_name || pending.productData.ingredients_text || pending.productData.nutriments) && (
              <View style={styles.pendingItem}>
                <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                <Text style={[styles.pendingText, { color: colors.textSecondary }]}>
                  {t('contribution.productInfo') || 'Product information'}
                </Text>
              </View>
            )}
            {pending.manufacturingCountry && (
              <View style={styles.pendingItem}>
                <Ionicons name="globe-outline" size={16} color={colors.primary} />
                <Text style={[styles.pendingText, { color: colors.textSecondary }]}>
                  {t('contribution.country') || 'Country of origin'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.dismissButton, { borderColor: colors.border }]}
          onPress={handleDismiss}
          disabled={submitting}
        >
          <Text style={[styles.dismissText, { color: colors.textSecondary }]}>
            {t('common.dismiss') || 'Dismiss'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmitAll}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={18} color="#fff" style={styles.submitIcon} />
              <Text style={styles.submitText}>
                {t('contribution.submitAll') || 'Submit All'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  pendingList: {
    marginTop: 4,
  },
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  pendingText: {
    fontSize: 12,
    marginLeft: 6,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  dismissButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  dismissText: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  submitIcon: {
    marginRight: 6,
  },
  submitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

