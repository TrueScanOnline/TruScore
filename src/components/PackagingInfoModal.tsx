import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import InfoModal from './InfoModal';
import PackagingSourcesModal from './PackagingSourcesModal';
import { useTheme } from '../theme';
import { Product, PackagingData } from '../types/product';
import { getUserCountryCode } from '../utils/countryDetection';
import {
  getOffPackagingItems,
  getOffPackagingImpactRating,
  getOffPackagingNonRecyclableMaterialsCount,
  hasOffPackagingDisplay,
} from '../utils/packagingOffDisplay';
import * as Linking from 'expo-linking';
import { openFoodFactsProductUrl } from '../utils/packagingRecyclingSources';

interface PackagingInfoModalProps {
  visible: boolean;
  onClose: () => void;
  product: Product | null;
}

// Recycling information by country
const getRecyclingInfo = (countryCode: string | null) => {
  const country = countryCode?.toUpperCase() || 'GLOBAL';
  
  const recyclingInfo: Record<string, {
    title: string;
    description: string;
    materials: Array<{
      material: string;
      recyclable: boolean;
      instructions: string;
      icon: string;
    }>;
    tips: string[];
  }> = {
    'NZ': {
      title: 'New Zealand Recycling Guidelines',
      description: 'Recycling standards and practices in New Zealand',
      materials: [
        {
          material: 'Plastic Bottles (PET #1)',
          recyclable: true,
          instructions: 'Rinse and remove lids. Place in recycling bin. Most councils accept PET bottles.',
          icon: 'reload-circle',
        },
        {
          material: 'Cardboard & Paper',
          recyclable: true,
          instructions: 'Flatten boxes, remove plastic tape. Place in recycling bin. Keep dry.',
          icon: 'reload-circle',
        },
        {
          material: 'Glass Bottles & Jars',
          recyclable: true,
          instructions: 'Rinse and remove lids. Place in glass recycling bin or general recycling.',
          icon: 'reload-circle',
        },
        {
          material: 'Metal Cans (Aluminum & Steel)',
          recyclable: true,
          instructions: 'Rinse clean. Place in recycling bin. Most councils accept all metal cans.',
          icon: 'reload-circle',
        },
        {
          material: 'Soft Plastics (Bags, Wrappers)',
          recyclable: true,
          instructions:
            'Check the Australasian Recycling Label on pack, your council, and environment.govt.nz — drop-off schemes vary by area.',
          icon: 'reload-circle',
        },
        {
          material: 'Mixed Plastics',
          recyclable: false,
          instructions: 'Check with your local council. Some areas accept #1-7 plastics, others only #1-2.',
          icon: 'close-circle',
        },
      ],
      tips: [
        'Official guidance: environment.govt.nz (recycling & rubbish)',
        'On-pack rules: Australasian Recycling Label — arl.org.nz',
        'Always rinse containers before recycling where required',
        'Remove lids and caps when they are a different material',
      ],
    },
    'AU': {
      title: 'Australia Recycling Guidelines',
      description: 'Recycling standards and practices in Australia',
      materials: [
        {
          material: 'Plastic Bottles (PET #1, HDPE #2)',
          recyclable: true,
          instructions: 'Rinse and remove lids. Place in yellow-lid recycling bin. Most councils accept #1 and #2.',
          icon: 'reload-circle',
        },
        {
          material: 'Cardboard & Paper',
          recyclable: true,
          instructions: 'Flatten boxes, remove plastic tape. Place in yellow-lid recycling bin. Keep dry.',
          icon: 'reload-circle',
        },
        {
          material: 'Glass Bottles & Jars',
          recyclable: true,
          instructions: 'Rinse and remove lids. Place in yellow-lid recycling bin.',
          icon: 'reload-circle',
        },
        {
          material: 'Metal Cans (Aluminum & Steel)',
          recyclable: true,
          instructions: 'Rinse clean. Place in yellow-lid recycling bin.',
          icon: 'reload-circle',
        },
        {
          material: 'Soft Plastics',
          recyclable: true,
          instructions:
            'Follow the Australasian Recycling Label on pack, dcceew.gov.au, and your council — store drop-off schemes vary.',
          icon: 'reload-circle',
        },
        {
          material: 'Mixed Plastics (#3-7)',
          recyclable: false,
          instructions: 'Check with your local council. Most only accept #1 and #2 plastics.',
          icon: 'close-circle',
        },
      ],
      tips: [
        'National policy: dcceew.gov.au (waste & recycling)',
        'On-pack rules: Australasian Recycling Label — arl.org.au',
        'Use the yellow-lid bin where your council accepts those streams',
        'Always rinse containers before recycling when required',
      ],
    },
    'US': {
      title: 'United States Recycling Guidelines',
      description: 'Recycling standards vary by state and municipality',
      materials: [
        {
          material: 'Plastic Bottles (PET #1, HDPE #2)',
          recyclable: true,
          instructions: 'Rinse and remove caps. Check local guidelines - most areas accept #1 and #2.',
          icon: 'reload-circle',
        },
        {
          material: 'Cardboard & Paper',
          recyclable: true,
          instructions: 'Flatten boxes, remove plastic tape. Keep dry. Most areas accept.',
          icon: 'reload-circle',
        },
        {
          material: 'Glass Bottles & Jars',
          recyclable: true,
          instructions: 'Rinse and remove lids. Check local guidelines - some areas have separate glass collection.',
          icon: 'reload-circle',
        },
        {
          material: 'Metal Cans (Aluminum & Steel)',
          recyclable: true,
          instructions: 'Rinse clean. Most areas accept both aluminum and steel cans.',
          icon: 'reload-circle',
        },
        {
          material: 'Plastic Bags & Wrappers',
          recyclable: true,
          instructions: 'Take to store drop-off locations (most major retailers). Do not put in curbside recycling.',
          icon: 'reload-circle',
        },
      ],
      tips: [
        'Recycling rules vary significantly by location',
        'Check your local municipality website for specific guidelines',
        'When in doubt, check with your local waste management authority',
        'Plastic bags should never go in curbside recycling',
      ],
    },
    'GB': {
      title: 'United Kingdom Recycling Guidelines',
      description: 'Recycling standards and practices in the UK',
      materials: [
        {
          material: 'Plastic Bottles (PET #1)',
          recyclable: true,
          instructions: 'Rinse and remove lids. Most councils accept plastic bottles.',
          icon: 'reload-circle',
        },
        {
          material: 'Cardboard & Paper',
          recyclable: true,
          instructions: 'Flatten boxes, remove plastic tape. Place in recycling bin. Keep dry.',
          icon: 'reload-circle',
        },
        {
          material: 'Glass Bottles & Jars',
          recyclable: true,
          instructions: 'Rinse and remove lids. Place in glass recycling bin or general recycling.',
          icon: 'reload-circle',
        },
        {
          material: 'Metal Cans (Aluminum & Steel)',
          recyclable: true,
          instructions: 'Rinse clean. Most councils accept metal cans.',
          icon: 'reload-circle',
        },
        {
          material: 'Plastic Packaging',
          recyclable: true,
          instructions: 'Check with your local council - rules vary. Most accept rigid plastic packaging.',
          icon: 'reload-circle',
        },
      ],
      tips: [
        'Recycling rules vary by council',
        'Check your local council website for specific guidelines',
        'Always rinse containers before recycling',
        'Remove lids and caps - they may be different materials',
      ],
    },
    'GLOBAL': {
      title: 'General Recycling Guidelines',
      description: 'General recycling best practices',
      materials: [
        {
          material: 'Plastic Bottles',
          recyclable: true,
          instructions: 'Rinse clean, remove lids. Check local guidelines for accepted types.',
          icon: 'reload-circle',
        },
        {
          material: 'Cardboard & Paper',
          recyclable: true,
          instructions: 'Flatten boxes, remove plastic tape. Keep dry.',
          icon: 'reload-circle',
        },
        {
          material: 'Glass Bottles & Jars',
          recyclable: true,
          instructions: 'Rinse clean, remove lids. Most areas accept glass.',
          icon: 'reload-circle',
        },
        {
          material: 'Metal Cans',
          recyclable: true,
          instructions: 'Rinse clean. Most areas accept aluminum and steel cans.',
          icon: 'reload-circle',
        },
      ],
      tips: [
        'Always check local recycling guidelines',
        'Rinse containers before recycling',
        'Remove lids and caps',
        'Keep recyclables dry and clean',
      ],
    },
  };

  return recyclingInfo[country] || recyclingInfo['GLOBAL'];
};

export default function PackagingInfoModal({ visible, onClose, product }: PackagingInfoModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [sourcesVisible, setSourcesVisible] = useState(false);
  const countryCode = getUserCountryCode();
  const recyclingInfo = getRecyclingInfo(countryCode);

  if (!product || !hasOffPackagingDisplay(product)) return null;

  const packagingData: PackagingData | undefined = product.packaging_data;
  const offItems = getOffPackagingItems(product);
  const impactRating = getOffPackagingImpactRating(product);
  const nonRecyclableMaterials = getOffPackagingNonRecyclableMaterialsCount(product);
  const showEcoScorePackagingNotes =
    impactRating != null || (nonRecyclableMaterials != null && nonRecyclableMaterials > 0);
  const offProductUrl = openFoodFactsProductUrl(product.barcode);

  // Extract material types from packaging items
  const getMaterialName = (material?: string): string => {
    if (!material) return 'Unknown Material';
    // Remove "en:" prefix if present
    const cleanMaterial = material.replace(/^en:/, '');
    // Convert to readable format
    return cleanMaterial
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getShapeName = (shape?: string): string => {
    if (!shape) return 'Unknown Shape';
    const cleanShape = shape.replace(/^en:/, '');
    return cleanShape
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <>
    <InfoModal
      visible={visible}
      onClose={onClose}
      title={t('result.packaging', 'Packaging')}
      icon="cube-outline"
      iconColor={colors.primary}
    >
      <View>
        <TouchableOpacity
          style={[styles.offProductLink, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => Linking.openURL(offProductUrl).catch(() => {})}
          activeOpacity={0.7}
          accessibilityRole="link"
        >
          <Ionicons name="open-outline" size={22} color={colors.primary} />
          <View style={styles.offProductLinkTextCol}>
            <Text style={[styles.offProductLinkTitle, { color: colors.primary }]}>
              {t('result.packagingSourceOffProduct')}
            </Text>
            <Text style={[styles.offProductUrl, { color: colors.textTertiary }]} selectable numberOfLines={2}>
              {offProductUrl}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {showEcoScorePackagingNotes ? (
          <View style={[styles.ecoNoteBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 8 }]}>
              {t('result.packagingOffImpactRatingTitle')}
            </Text>
            {impactRating != null ? (
              <Text style={[styles.ecoNoteBody, { color: colors.textSecondary }]}>
                {t('result.packagingOffImpactRatingHint')}
              </Text>
            ) : null}
            {nonRecyclableMaterials != null && nonRecyclableMaterials > 0 ? (
              <Text
                style={[
                  styles.ecoNoteBody,
                  { color: colors.text, marginTop: impactRating != null ? 10 : 0, fontWeight: '600' },
                ]}
              >
                {t('result.packagingOffImpactNonRecyclable', { count: nonRecyclableMaterials })}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Current Packaging Status */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('result.packagingDetails', 'Packaging Details')}
          </Text>

          {/* Status Badges */}
          <View style={styles.badgesContainer}>
            {packagingData?.isRecyclable && (
              <View style={[styles.badge, { backgroundColor: '#16a085' + '20' }]}>
                <Ionicons name="reload-circle" size={16} color="#16a085" />
                <Text style={[styles.badgeText, { color: '#16a085' }]}>
                  {t('result.recyclable', 'Recyclable')}
                </Text>
              </View>
            )}
            {packagingData?.isReusable && (
              <View style={[styles.badge, { backgroundColor: '#4dd09f' + '20' }]}>
                <Ionicons name="refresh-circle" size={16} color="#4dd09f" />
                <Text style={[styles.badgeText, { color: '#4dd09f' }]}>
                  {t('result.reusable', 'Reusable')}
                </Text>
              </View>
            )}
            {packagingData?.isBiodegradable && (
              <View style={[styles.badge, { backgroundColor: '#16a085' + '20' }]}>
                <Ionicons name="leaf" size={16} color="#16a085" />
                <Text style={[styles.badgeText, { color: '#16a085' }]}>
                  {t('result.biodegradable', 'Biodegradable')}
                </Text>
              </View>
            )}
          </View>

          {/* Packaging Items List (Open Food Facts) */}
          {offItems.length > 0 && (
            <View style={styles.itemsContainer}>
              <Text style={[styles.itemsTitle, { color: colors.text }]}>
                {t('result.packagingComponents', 'Packaging Components')}:
              </Text>
              {offItems.map((item, index) => (
                <View key={index} style={[styles.itemCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.itemHeader}>
                    <Ionicons name="cube" size={20} color={colors.primary} />
                    <Text style={[styles.itemTitle, { color: colors.text }]}>
                      {getShapeName(item.shape) || 'Packaging Item'}
                    </Text>
                  </View>
                  {item.material && (
                    <Text style={[styles.itemMaterial, { color: colors.textSecondary }]}>
                      <Text style={{ fontWeight: '600' }}>Material: </Text>
                      {getMaterialName(item.material)}
                    </Text>
                  )}
                  {item.recycling && (
                    <View style={styles.itemRecycling}>
                      <Ionicons 
                        name={item.recycling.includes('recyclable') ? 'checkmark-circle' : 'close-circle'} 
                        size={16} 
                        color={item.recycling.includes('recyclable') ? '#16a085' : '#ff6b6b'} 
                      />
                      <Text style={[styles.itemRecyclingText, { 
                        color: item.recycling.includes('recyclable') ? '#16a085' : '#ff6b6b' 
                      }]}>
                        {item.recycling.includes('recyclable') 
                          ? t('result.recyclable', 'Recyclable')
                          : t('result.notRecyclable', 'Not Recyclable')}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Recycling Information by Location */}
        <View style={styles.section}>
          <View style={styles.recyclingHeader}>
            <Ionicons name="reload-circle" size={24} color={colors.primary} />
            <View style={styles.recyclingHeaderText}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {recyclingInfo.title}
              </Text>
              <Text style={[styles.recyclingSubtitle, { color: colors.textSecondary }]}>
                {recyclingInfo.description}
              </Text>
            </View>
          </View>

          {/* Material Recycling Guide */}
          <View style={styles.materialsContainer}>
            {recyclingInfo.materials.map((material, index) => (
              <View 
                key={index} 
                style={[
                  styles.materialCard, 
                  { 
                    backgroundColor: material.recyclable ? '#16a085' + '10' : '#ff6b6b' + '10',
                    borderLeftColor: material.recyclable ? '#16a085' : '#ff6b6b',
                    borderLeftWidth: 4,
                  }
                ]}
              >
                <View style={styles.materialHeader}>
                  <Ionicons 
                    name={material.icon as any} 
                    size={20} 
                    color={material.recyclable ? '#16a085' : '#ff6b6b'} 
                  />
                  <Text style={[styles.materialName, { color: colors.text }]}>
                    {material.material}
                  </Text>
                </View>
                <Text style={[styles.materialInstructions, { color: colors.textSecondary }]}>
                  {material.instructions}
                </Text>
              </View>
            ))}
          </View>

          {/* Recycling Tips */}
          {recyclingInfo.tips && recyclingInfo.tips.length > 0 && (
            <View style={styles.tipsContainer}>
              <Text style={[styles.tipsTitle, { color: colors.text }]}>
                {t('result.recyclingTips', 'Recycling Tips')}:
              </Text>
              {recyclingInfo.tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <Ionicons name="bulb-outline" size={16} color={colors.primary} />
                  <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                    {tip}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <Text style={[styles.sourcesSectionTitle, { color: colors.text }]}>
            {t('result.packagingOfficialSources', 'Official sources')}
          </Text>
          <TouchableOpacity
            style={[styles.sourcesButton, { backgroundColor: colors.primary + '18', borderColor: colors.primary }]}
            onPress={() => setSourcesVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="link-outline" size={20} color={colors.primary} />
            <Text style={[styles.sourcesButtonText, { color: colors.primary }]}>
              {t('result.packagingOpenSourcesButton')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </InfoModal>

    <PackagingSourcesModal
      visible={sourcesVisible}
      onClose={() => setSourcesVisible(false)}
      barcode={product.barcode}
    />
    </>
  );
}

const styles = StyleSheet.create({
  offProductLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  offProductLinkTextCol: {
    flex: 1,
    minWidth: 0,
  },
  offProductLinkTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  offProductUrl: {
    fontSize: 12,
    marginTop: 4,
  },
  ecoNoteBlock: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  ecoNoteBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemsContainer: {
    marginTop: 16,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  itemCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemMaterial: {
    fontSize: 14,
    marginBottom: 8,
  },
  itemRecycling: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemRecyclingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  recyclingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  recyclingHeaderText: {
    flex: 1,
  },
  recyclingSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  materialsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  materialCard: {
    padding: 16,
    borderRadius: 12,
  },
  materialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  materialName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  materialInstructions: {
    fontSize: 14,
    lineHeight: 20,
  },
  tipsContainer: {
    marginTop: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sourcesSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 10,
  },
  sourcesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  sourcesButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});

