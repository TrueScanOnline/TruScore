/**
 * Conditional Result card — “About these Additives”.
 * Renders only when renderedAdditiveIds.length ≥ 1. Neutral glyph; no RAG/risk framing.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { formatResultCountCopy, getSurfaceCopy } from '../s25/loadAsset';
import { S25_ADDITIVE_COUNT_GLYPH } from '../s25/glyphs';

interface AboutTheseAdditivesCardProps {
  count: number;
  onPress: () => void;
}

export default function AboutTheseAdditivesCard({ count, onPress }: AboutTheseAdditivesCardProps) {
  const { colors } = useTheme();
  if (count < 1) return null;

  const title = getSurfaceCopy('surface_title') || 'About these Additives';
  const countText = formatResultCountCopy(count);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.96 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${countText}`}
    >
      <View style={styles.row}>
        <View style={styles.left}>
          <Ionicons name={S25_ADDITIVE_COUNT_GLYPH} size={24} color={colors.primary} />
          <View style={styles.textCol}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.count, { color: colors.textSecondary }]}>{countText}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  count: {
    fontSize: 14,
    lineHeight: 20,
  },
});
