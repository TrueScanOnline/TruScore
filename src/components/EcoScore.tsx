import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { EcoScore as EcoScoreType } from '../types/product';

interface EcoScoreProps {
  ecoScore: EcoScoreType;
}

const gradeColors: Record<string, string> = {
  a: '#16a085', // Green
  b: '#4dd09f', // Light green
  c: '#ffd93d', // Yellow
  d: '#ff9800', // Orange
  e: '#ff6b6b', // Red
  unknown: '#95a5a6', // Gray
};

/**
 * Calculate Eco-Score grade from score if grade is missing
 * Official Open Food Facts ranges: A: 80-100, B: 70-79, C: 55-69, D: 40-54, E: 0-39
 */
function calculateGradeFromScore(score: number): 'a' | 'b' | 'c' | 'd' | 'e' | 'unknown' {
  if (score >= 80) return 'a';
  if (score >= 70) return 'b';
  if (score >= 55) return 'c';
  if (score >= 40) return 'd';
  if (score >= 0) return 'e';
  return 'unknown';
}

export default function EcoScore({ ecoScore }: EcoScoreProps) {
  const { t } = useTranslation();
  const score = ecoScore.score || 0;
  
  // Calculate grade from score if grade is missing or unknown
  let grade = ecoScore.grade || 'unknown';
  if ((!grade || grade === 'unknown') && score > 0) {
    grade = calculateGradeFromScore(score);
  }
  
  const color = gradeColors[grade];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="leaf-outline" size={24} color={color} />
        <Text style={styles.title}>{t('ecoscore.title')}</Text>
      </View>

      {/* Large Centered Grade Display */}
      <View style={styles.gradeDisplayContainer}>
        <View style={[styles.largeGradeBadge, { backgroundColor: color }]}>
          <Text style={styles.largeGradeText}>{grade.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.score}>{t('ecoscore.score', { score })}</Text>

      {/* Enhanced Sustainability Details */}
      {ecoScore.co2_total !== undefined && (
        <View style={styles.detail}>
          <Ionicons name="cloud-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {t('ecoscore.co2', { value: ecoScore.co2_total.toFixed(1) })} kg CO₂e/kg
          </Text>
        </View>
      )}

      {ecoScore.water_footprint !== undefined && (
        <View style={styles.detail}>
          <Ionicons name="water-outline" size={16} color="#4a90e2" />
          <Text style={styles.detailText}>
            {t('ecoscore.water', { value: ecoScore.water_footprint.toFixed(0) })} L/kg
          </Text>
        </View>
      )}

      {ecoScore.land_use !== undefined && (
        <View style={styles.detail}>
          <Ionicons name="earth-outline" size={16} color="#8b7355" />
          <Text style={styles.detailText}>
            {t('ecoscore.landUse', { value: ecoScore.land_use.toFixed(1) })} m²/kg
          </Text>
        </View>
      )}

      {ecoScore.biodiversity_threats !== undefined && ecoScore.biodiversity_threats > 0 && (
        <View style={styles.detail}>
          <Ionicons name="leaf-outline" size={16} color={ecoScore.biodiversity_threats > 0.1 ? '#ff6b6b' : '#ffd93d'} />
          <Text style={styles.detailText}>
            {t('ecoscore.biodiversity', { value: (ecoScore.biodiversity_threats * 100).toFixed(1) })}% threat
          </Text>
        </View>
      )}

      {ecoScore.deforestation && ecoScore.deforestation !== 'unknown' && (
        <View style={styles.detail}>
          <Ionicons name="warning-outline" size={16} color={ecoScore.deforestation === 'high' ? '#ff6b6b' : '#ffd93d'} />
          <Text style={styles.detailText}>
            {t('ecoscore.deforestation', { level: ecoScore.deforestation.charAt(0).toUpperCase() + ecoScore.deforestation.slice(1) })}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  gradeDisplayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  largeGradeBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  largeGradeText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  score: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
});

