/**
 * TruScore Analysis Modal
 * Shows exactly how each of the 4 pillars was scored: which database returned data,
 * query type (barcode/brand/parent/product_field), order queried, and each adjustment with value.
 * 100% matches the TruScore shown on the app.
 */

import React from 'react';
import { View, Text, StyleSheet, Linking, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import type { TruScoreAnalysis } from '../types/truscoreAnalysis';
import InfoModal from './InfoModal';

interface TruScoreAnalysisModalProps {
  visible: boolean;
  onClose: () => void;
  analysis: TruScoreAnalysis | null | undefined;
}

export default function TruScoreAnalysisModal({ visible, onClose, analysis }: TruScoreAnalysisModalProps) {
  const { colors } = useTheme();

  if (!analysis) {
    return (
      <InfoModal visible={visible} onClose={onClose} title="Score breakdown" icon="analytics-outline" iconColor={colors.primary}>
        <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
          No analysis available for this scan. Score breakdown is shown after a full calculation (e.g. not from cache without trace).
        </Text>
      </InfoModal>
    );
  }

  const { fetchTrace, pillars, totalScore, barcode } = analysis;

  return (
    <InfoModal
      visible={visible}
      onClose={onClose}
      title="TruScore breakdown"
      icon="analytics-outline"
      iconColor={colors.primary}
    >
      <View style={styles.content}>
        <View style={[styles.totalRow, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>Total TruScore</Text>
          <Text style={[styles.totalValue, { color: colors.primary }]}>{totalScore}/100</Text>
        </View>
        <Text style={[styles.meta, { color: colors.textTertiary }]}>Barcode: {barcode}</Text>

        {/* Data sources: which DBs were queried, order, hit/miss */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Data sources (query order)</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Which databases were queried for this barcode and whether they returned a result.
        </Text>
        {fetchTrace.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textTertiary }]}>No fetch trace (e.g. cached product).</Text>
        ) : (
          <View style={[styles.table, { borderColor: colors.border }]}>
            <View style={[styles.tableRow, styles.tableHeader, { borderColor: colors.border }]}>
              <Text style={[styles.tableCell, styles.tableHeaderText, { color: colors.text }]}>#</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText, { color: colors.text }]}>Database</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText, { color: colors.text }]}>Query by</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText, { color: colors.text }]}>Result</Text>
            </View>
            {fetchTrace.map((entry, i) => (
              <View key={i} style={[styles.tableRow, { borderColor: colors.border }]}>
                <Text style={[styles.tableCell, { color: colors.textSecondary }]}>{entry.order}</Text>
                <Text style={[styles.tableCell, { color: colors.text }]}>{entry.database}</Text>
                <Text style={[styles.tableCell, { color: colors.textSecondary }]}>{entry.queryKeyType}</Text>
                <View style={styles.tableCell}>
                  {entry.hit ? (
                    <Ionicons name="checkmark-circle" size={18} color="#16a085" />
                  ) : (
                    <Ionicons name="close-circle-outline" size={18} color={colors.textTertiary} />
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Per-pillar breakdown */}
        {(['Body', 'Planet', 'Ethics', 'Open'] as const).map((name) => {
          const pillar = pillars[name];
          if (!pillar) return null;
          return (
            <View key={name} style={[styles.pillarBlock, { borderColor: colors.border }]}>
              <View style={[styles.pillarHeader, { backgroundColor: colors.surface }]}>
                <Text style={[styles.pillarName, { color: colors.text }]}>{pillar.pillarName}</Text>
                <Text style={[styles.pillarScore, { color: colors.primary }]}>
                  {pillar.finalScore}/25
                  {pillar.baseScore !== pillar.finalScore && (
                    <Text style={[styles.pillarBase, { color: colors.textSecondary }]}> (base {pillar.baseScore})</Text>
                  )}
                </Text>
              </View>
              {pillar.adjustments.map((adj, idx) => (
                <View key={idx} style={[styles.adjRow, { borderColor: colors.border }]}>
                  <View style={styles.adjLeft}>
                    <Text style={[styles.adjDesc, { color: colors.text }]} numberOfLines={2}>{adj.description}</Text>
                    {(adj.sourceDatabase || adj.queryKeyType) && (
                      <View style={styles.adjSourceRow}>
                        <Text style={[styles.adjSource, { color: colors.textTertiary }]}>
                          {adj.sourceDatabase || '—'} • {adj.queryKeyType || '—'}
                        </Text>
                        {adj.referenceUrl != null && (
                          <Pressable
                            onPress={() => Linking.openURL(adj.referenceUrl!)}
                            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                          >
                            <Text style={[styles.adjLink, { color: colors.primary }]}>Open reference</Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.adjValue,
                      adj.value > 0 ? { color: '#16a085' } : adj.value < 0 ? { color: '#e74c3c' } : { color: colors.textSecondary },
                    ]}
                  >
                    {adj.value > 0 ? '+' : ''}{adj.value}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}
        <View style={styles.bottomSpacer} />
      </View>
    </InfoModal>
  );
}

const styles = StyleSheet.create({
  content: {},
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  totalLabel: { fontSize: 15, fontWeight: '600' },
  totalValue: { fontSize: 20, fontWeight: '700' },
  meta: { fontSize: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, marginBottom: 8 },
  empty: { fontStyle: 'italic', marginBottom: 16 },
  table: { borderWidth: 1, borderRadius: 8, marginBottom: 20, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 6, paddingHorizontal: 8 },
  tableHeader: { backgroundColor: 'rgba(0,0,0,0.05)' },
  tableHeaderText: { fontWeight: '600', fontSize: 12 },
  tableCell: { flex: 1, fontSize: 12 },
  pillarBlock: { borderWidth: 1, borderRadius: 8, marginBottom: 12, overflow: 'hidden' },
  pillarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12 },
  pillarName: { fontSize: 15, fontWeight: '600' },
  pillarScore: { fontSize: 15, fontWeight: '700' },
  pillarBase: { fontWeight: '400', fontSize: 13 },
  adjRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderTopWidth: 1 },
  adjLeft: { flex: 1, marginRight: 8 },
  adjDesc: { fontSize: 13 },
  adjSourceRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 2 },
  adjSource: { fontSize: 11 },
  adjLink: { fontSize: 11, textDecorationLine: 'underline', marginLeft: 8 },
  adjValue: { fontSize: 14, fontWeight: '600' },
  placeholder: { fontStyle: 'italic' },
  bottomSpacer: { height: 24 },
});
