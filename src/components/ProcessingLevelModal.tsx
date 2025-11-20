import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import InfoModal from './InfoModal';
import { useTheme } from '../theme';

interface ProcessingLevelModalProps {
  visible: boolean;
  onClose: () => void;
  novaGroup?: 1 | 2 | 3 | 4;
}

export default function ProcessingLevelModal({ visible, onClose, novaGroup }: ProcessingLevelModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const getNovaInfo = (group: number) => {
    switch (group) {
      case 1:
        return {
          color: '#16a085',
          icon: 'leaf',
          title: t('nova.1'),
          description: t('infoModal.trustScore.nova1Description'),
          examples: t('infoModal.trustScore.nova1Examples'),
          benefits: [
            t('infoModal.trustScore.nova1Benefit1'),
            t('infoModal.trustScore.nova1Benefit2'),
            t('infoModal.trustScore.nova1Benefit3'),
          ],
        };
      case 2:
        return {
          color: '#4dd09f',
          icon: 'create',
          title: t('nova.2'),
          description: t('infoModal.trustScore.nova2Description'),
          examples: t('infoModal.trustScore.nova2Examples'),
          benefits: [
            t('infoModal.trustScore.nova2Benefit1'),
            t('infoModal.trustScore.nova2Benefit2'),
          ],
        };
      case 3:
        return {
          color: '#ffa500',
          icon: 'build',
          title: t('nova.3'),
          description: t('infoModal.trustScore.nova3Description'),
          examples: t('infoModal.trustScore.nova3Examples'),
          concerns: [
            t('infoModal.trustScore.nova3Concern1'),
            t('infoModal.trustScore.nova3Concern2'),
          ],
        };
      case 4:
        return {
          color: '#ff6b6b',
          icon: 'warning',
          title: t('nova.4'),
          description: t('infoModal.trustScore.nova4Description'),
          examples: t('infoModal.trustScore.nova4Examples'),
          concerns: [
            t('infoModal.trustScore.nova4Concern1'),
            t('infoModal.trustScore.nova4Concern2'),
            t('infoModal.trustScore.nova4Concern3'),
            t('infoModal.trustScore.nova4Concern4'),
          ],
        };
      default:
        return null;
    }
  };

  const novaInfo = novaGroup ? getNovaInfo(novaGroup) : null;

  if (!novaInfo) return null;

  return (
    <InfoModal
      visible={visible}
      onClose={onClose}
      title={t('result.processingLevel')}
      icon={novaInfo.icon as any}
      iconColor={novaInfo.color}
    >
      {/* NOVA Group Badge */}
      <View style={[styles.novaBadgeContainer, { backgroundColor: novaInfo.color + '20' }]}>
        <View style={[styles.novaBadge, { backgroundColor: novaInfo.color }]}>
          <Text style={styles.novaBadgeText}>NOVA {novaGroup}</Text>
        </View>
        <Text style={[styles.novaTitle, { color: colors.text }]}>
          {novaInfo.title}
        </Text>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('infoModal.trustScore.whatIsNova')}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {t('infoModal.trustScore.novaClassificationDescription')}
        </Text>
      </View>

      {/* Group Description */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('infoModal.trustScore.groupDescription')}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {novaInfo.description}
        </Text>
      </View>

      {/* Examples */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('infoModal.trustScore.examples')}
        </Text>
        <View style={[styles.examplesContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.examplesText, { color: colors.text }]}>
            {novaInfo.examples}
          </Text>
        </View>
      </View>

      {/* Benefits (for groups 1-2) */}
      {novaInfo.benefits && (
        <View style={styles.section}>
          <View style={[styles.benefitsHeader, { borderBottomColor: '#16a085' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#16a085" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('infoModal.trustScore.benefits')}
            </Text>
          </View>
          {novaInfo.benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <Ionicons name="checkmark" size={20} color="#16a085" />
              <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
                {benefit}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Concerns (for groups 3-4) */}
      {novaInfo.concerns && (
        <View style={styles.section}>
          <View style={[styles.concernsHeader, { borderBottomColor: '#ff6b6b' }]}>
            <Ionicons name="warning" size={24} color="#ff6b6b" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('infoModal.trustScore.concerns')}
            </Text>
          </View>
          {novaInfo.concerns.map((concern, index) => (
            <View key={index} style={styles.concernItem}>
              <Ionicons name="alert-circle" size={20} color="#ff6b6b" />
              <Text style={[styles.concernText, { color: colors.textSecondary }]}>
                {concern}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Note */}
      <View style={[styles.note, { backgroundColor: colors.primary + '20' }]}>
        <Ionicons name="information-circle" size={20} color={colors.primary} />
        <Text style={[styles.noteText, { color: colors.text }]}>
          {t('infoModal.trustScore.novaNote')}
        </Text>
      </View>
    </InfoModal>
  );
}

const styles = StyleSheet.create({
  novaBadgeContainer: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  novaBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  novaBadgeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  novaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  examplesContainer: {
    borderRadius: 12,
    padding: 16,
  },
  examplesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 2,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  concernsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 2,
  },
  concernItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  concernText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  note: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});

