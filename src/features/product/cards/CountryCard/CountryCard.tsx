// Modular Country of Manufacture Card Component

import React, { useState, Suspense } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '../../../../components/ErrorBoundary';
import { ProductWithTrustScore } from '../../../../types/product';
import ManufacturingCountryModal from '../../../../components/ManufacturingCountryModal';
import CountryFlag from '../../../../components/CountryFlag';
import { extractManufacturingCountry } from '../../../../services/openFoodFacts';
import { getManufacturingCountry, hasUserSubmitted } from '../../../../services/manufacturingCountryService';
import { useTheme } from '../../../../theme';
import { CardPremiumGate } from '../../../premium/CardPremiumGate';
import { PremiumFeature } from '../../../../utils/premiumFeatures';
import { CountryCardSkeleton } from './CountryCardSkeleton';
import { CountryCardError } from './CountryCardError';
import { useEffect } from 'react';

/** Imported-ingredients note — orange (distinct from verified-country green). */
const IMPORTED_INGREDIENTS_BORDER = '#e65100';
const IMPORTED_INGREDIENTS_FILL = '#fff3e0';
const IMPORTED_INGREDIENTS_FOREGROUND = '#e65100';

interface CountryCardProps {
  barcode: string;
  product?: ProductWithTrustScore;
  onShare?: () => void;
  premiumFeatures?: PremiumFeature[];
}

function CountryCardContent({ barcode, product, onShare, premiumFeatures }: CountryCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [userContributedCountry, setUserContributedCountry] = useState<{ country: string; confidence: string; verifiedCount: number; hasImportedIngredients?: boolean } | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    // Load user-contributed country data
    const loadCountryData = async () => {
      if (!product) return;
      
      const manufacturingCountry = extractManufacturingCountry(product);
      const contributed = await getManufacturingCountry(barcode);
      const submitted = await hasUserSubmitted(barcode);
      
      console.log('[CountryCard] Loaded data:', {
        manufacturingCountry,
        contributedCountry: contributed.country,
        hasImportedIngredients: contributed.hasImportedIngredients,
        confidence: contributed.confidence,
      });
      
      if (!manufacturingCountry) {
        // No Open Food Facts country - use user-contributed data if available
        if (contributed.country) {
          setUserContributedCountry({
            country: contributed.country,
            confidence: contributed.confidence,
            verifiedCount: contributed.verifiedCount,
            hasImportedIngredients: contributed.hasImportedIngredients || false,
          });
          console.log('[CountryCard] Set userContributedCountry (no OFF country):', {
            country: contributed.country,
            hasImportedIngredients: contributed.hasImportedIngredients || false,
          });
        } else {
          setUserContributedCountry(null);
        }
      } else {
        // We have Open Food Facts country, but still check for imported ingredients flag
        if (contributed.hasImportedIngredients) {
          // Store only the imported ingredients flag, not the country (since we use Open Food Facts country)
          setUserContributedCountry({
            country: '', // Empty since we use Open Food Facts country
            confidence: 'verified' as const,
            verifiedCount: 0,
            hasImportedIngredients: true,
          });
          console.log('[CountryCard] Set userContributedCountry (OFF country, with imported flag):', {
            hasImportedIngredients: true,
          });
        } else {
          setUserContributedCountry(null);
          console.log('[CountryCard] No imported ingredients flag, cleared userContributedCountry');
        }
      }
      setHasSubmitted(submitted);
    };
    loadCountryData();
  }, [barcode, product]);

  if (!product) {
    return null;
  }

  const manufacturingCountry = extractManufacturingCountry(product);
  const displayManufacturingCountry = manufacturingCountry || userContributedCountry?.country || null;

  const shouldShowVerifyButton = () => {
    if (displayManufacturingCountry) {
      if (manufacturingCountry) return false; // Open Food Facts data - verified
      if (!hasSubmitted) return true;
      if (userContributedCountry && userContributedCountry.confidence !== 'verified') {
        return true;
      }
    }
    return false;
  };

  const getVerifyButtonText = () => {
    if (!displayManufacturingCountry) {
      return t('manufacturingCountry.contributeTitle', 'Enter Manufacturing Country');
    }
    if (userContributedCountry?.confidence === 'unverified') {
      return t('manufacturingCountry.unverified', 'Help Verify This Country');
    }
    if (userContributedCountry?.confidence === 'disputed') {
      return t('manufacturingCountry.disputed', 'Resolve Dispute - Verify Country');
    }
    return t('manufacturingCountry.reportDifferent', 'Verify or Update Country');
  };

  return (
    <>
      <CardPremiumGate features={premiumFeatures || []}>
        {displayManufacturingCountry ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: '#16a085', borderWidth: 2 }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="globe-outline" size={24} color={colors.text} />
                <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
                  {t('result.countryOfManufacture', 'Country of Manufacture')}
                </Text>
              </View>
              <View style={styles.cardHeaderRight}>
                <View style={styles.confidenceBadge}>
                  {manufacturingCountry ? (
                    <Ionicons name="checkmark-circle" size={16} color="#16a085" />
                  ) : userContributedCountry ? (
                    <>
                      {userContributedCountry.confidence === 'verified' && (
                        <Ionicons name="checkmark-circle" size={16} color="#16a085" />
                      )}
                      {userContributedCountry.confidence === 'community' && (
                        <Ionicons name="people" size={16} color="#4dd09f" />
                      )}
                      {userContributedCountry.confidence === 'unverified' && (
                        <Ionicons name="help-circle" size={16} color="#ffd93d" />
                      )}
                      {userContributedCountry.confidence === 'disputed' && (
                        <Ionicons name="warning" size={16} color="#ff9800" />
                      )}
                    </>
                  ) : null}
                </View>
                {onShare && (
                  <TouchableOpacity
                    onPress={onShare}
                    style={styles.shareButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="share-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <View style={styles.originContainer}>
              <CountryFlag country={displayManufacturingCountry} />
              {(() => {
                const shouldShow = userContributedCountry?.hasImportedIngredients === true;
                console.log('[CountryCard] Badge display check:', {
                  userContributedCountry: userContributedCountry ? 'exists' : 'null',
                  hasImportedIngredients: userContributedCountry?.hasImportedIngredients,
                  shouldShow,
                });
                return shouldShow ? (
                  <View style={styles.importedIngredientsBadge}>
                    <Ionicons name="globe" size={16} color={IMPORTED_INGREDIENTS_FOREGROUND} />
                    <Text style={[styles.importedIngredientsText, { color: IMPORTED_INGREDIENTS_FOREGROUND }]}>
                      {t('manufacturingCountry.withImportedIngredients', 'With some imported ingredients')}
                    </Text>
                  </View>
                ) : null;
              })()}
            </View>
            {!manufacturingCountry && userContributedCountry && (
              <View style={styles.validationContainer}>
                {(userContributedCountry.verifiedCount || 0) >= 3 ? (
                  <View style={[styles.validationMessage, { backgroundColor: '#16a085' + '20', borderColor: '#16a085' }]}>
                    <Ionicons name="shield-checkmark" size={20} color="#16a085" />
                    <Text style={[styles.validationText, { color: '#16a085' }]}>
                      {t('manufacturingCountry.authenticated', 'Authenticated by 3 users')}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.validationMessage, { backgroundColor: '#ffd93d' + '15', borderColor: '#ffd93d' }]}>
                    <Ionicons name="shield-outline" size={20} color="#ffd93d" />
                    <Text style={[styles.validationText, { color: colors.text }]}>
                      {t('manufacturingCountry.communityVerificationInProgress', 'COMMUNITY VERIFICATION IN PROGRESS...')}
                    </Text>
                  </View>
                )}
              </View>
            )}
            {shouldShowVerifyButton() && (
              <TouchableOpacity
                style={[styles.verifyButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={16} color={colors.primary} />
                <Text style={[styles.verifyButtonText, { color: colors.primary }]}>
                  {getVerifyButtonText()}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderWidth: 2, borderColor: '#ff6b6b' }]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="globe-outline" size={24} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
                {t('result.countryOfManufacture', 'Country of Manufacture')}
              </Text>
            </View>
            <View style={styles.contributeContainer}>
              <Text style={[styles.notDisclosedTitle, { color: '#d32f2f' }]}>
                {t('manufacturingCountry.notDisclosed', 'Country not disclosed by brand!')}
              </Text>
              <Text style={[styles.contributeText, { color: '#16a085' }]}>
                {t('manufacturingCountry.contributeDescriptionLine1', 'Is it on the packaging?')}
              </Text>
              <Text style={[styles.contributeText, { color: '#16a085' }]}>
                {t('manufacturingCountry.contributeDescriptionLine2', 'Click here to add ...')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </CardPremiumGate>

      <ManufacturingCountryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={async (country: string, hasImportedIngredients?: boolean) => {
          // Reload country data after submission
          // Add a small delay to ensure data is saved before reloading
          await new Promise(resolve => setTimeout(resolve, 100));
          const manufacturingCountry = extractManufacturingCountry(product);
          const contributed = await getManufacturingCountry(barcode);
          
          console.log('[CountryCard] Reloaded country data after submission:', {
            manufacturingCountry,
            contributedCountry: contributed.country,
            hasImportedIngredients: contributed.hasImportedIngredients,
          });
          
          if (!manufacturingCountry) {
            // No Open Food Facts country - use user-contributed data if available
            if (contributed.country) {
              setUserContributedCountry({
                country: contributed.country,
                confidence: contributed.confidence,
                verifiedCount: contributed.verifiedCount,
                hasImportedIngredients: contributed.hasImportedIngredients || false,
              });
            } else {
              setUserContributedCountry(null);
            }
          } else {
            // We have Open Food Facts country, but still check for imported ingredients flag
            if (contributed.hasImportedIngredients) {
              // Store only the imported ingredients flag, not the country (since we use Open Food Facts country)
              setUserContributedCountry({
                country: '', // Empty since we use Open Food Facts country
                confidence: 'verified' as const,
                verifiedCount: 0,
                hasImportedIngredients: true,
              });
            } else {
              setUserContributedCountry(null);
            }
          }
          setHasSubmitted(true);
        }}
        barcode={barcode}
        productName={product?.product_name || product?.product_name_en}
      />
    </>
  );
}

export default function CountryCard(props: CountryCardProps) {
  return (
    <ErrorBoundary feature="CountryCard">
      <Suspense fallback={<CountryCardSkeleton />}>
        <CountryCardContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceBadge: {
    marginLeft: 8,
  },
  shareButton: {
    padding: 4,
  },
  originContainer: {
    alignItems: 'center',
    marginVertical: 12,
    gap: 12,
  },
  importedIngredientsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: IMPORTED_INGREDIENTS_BORDER,
    backgroundColor: IMPORTED_INGREDIENTS_FILL,
    gap: 8,
    marginTop: 8,
  },
  importedIngredientsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  validationContainer: {
    marginTop: 12,
  },
  validationMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  validationText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    gap: 8,
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contributeContainer: {
    marginTop: 12,
  },
  notDisclosedTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  contributeText: {
    fontSize: 14,
    marginTop: 4,
  },
});


