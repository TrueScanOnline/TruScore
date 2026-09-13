/**
 * Rveel Score analysis modal
 * Shows exactly how each of the 4 pillars was scored: which database returned data,
 * query type (barcode/brand/parent/product_field), order queried, and each adjustment with value.
 * Matches the Rveel Score shown on the app.
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

  const { fetchTrace, pillars, totalScore, barcode, claimsAssessment } = analysis;

  return (
    <InfoModal
      visible={visible}
      onClose={onClose}
      title="Rveel Score breakdown"
      icon="analytics-outline"
      iconColor={colors.primary}
    >
      <View style={styles.content}>
        <View style={[styles.totalRow, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>Total Rveel Score</Text>
          <Text style={[styles.totalValue, { color: colors.primary }]}>{totalScore}/100</Text>
        </View>
        <Text style={[styles.meta, { color: colors.textTertiary }]}>Barcode: {barcode}</Text>

        {/* S28-01..07 Claims Rescue diagnostic truth (founder/UAT Score Diagnostics only) */}
        {claimsAssessment ? (
          <View style={[styles.claimsBlock, { borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Claims assessment (S28)</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Founder/UAT diagnostic — assessment state is independent of the numeric score.
            </Text>
            <Text style={[styles.claimsLine, { color: colors.text }]} testID="s28-assessment-state">
              assessment_state: {claimsAssessment.assessment_state}
            </Text>
            <Text style={[styles.claimsLine, { color: colors.text }]} testID="s28-packet-coverage-state">
              packet_coverage_state: {claimsAssessment.packet_coverage_state}
            </Text>
            <Text style={[styles.claimsLine, { color: colors.textTertiary }]}>
              register_version: {claimsAssessment.register_version} · nutrient_standard_version:{' '}
              {claimsAssessment.nutrient_standard_version} · schema: {claimsAssessment.schema_version}
            </Text>

            <Text style={[styles.claimsSubhead, { color: colors.text }]}>Admitted claims</Text>
            {claimsAssessment.admitted_claims.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textTertiary }]}>None</Text>
            ) : (
              claimsAssessment.admitted_claims.map((c) => (
                <View key={`${c.evidence_id}:${c.register_row_id}`} style={styles.claimsItem}>
                  <Text style={[styles.claimsLine, { color: colors.text }]}>
                    {c.register_row_id} · set {c.set} · {c.canonical_family}
                  </Text>
                  <Text style={[styles.claimsLine, { color: colors.textSecondary }]}>
                    evidence_id: {c.evidence_id} · admission: {c.admission_method}
                    {c.source_locator ? ` · locator: ${c.source_locator}` : ''}
                  </Text>
                  <Text style={[styles.claimsLine, { color: colors.textSecondary }]}>
                    observed: {c.observed_text}
                  </Text>
                  <Text style={[styles.claimsLine, { color: colors.textSecondary }]}>
                    display: {c.display_text}
                  </Text>
                  {c.member_targets && c.member_targets.length > 0 ? (
                    <Text style={[styles.claimsLine, { color: colors.textTertiary }]}>
                      member_targets: {c.member_targets.join(', ')}
                    </Text>
                  ) : null}
                </View>
              ))
            )}

            <Text style={[styles.claimsSubhead, { color: colors.text }]}>Nutrient context</Text>
            {claimsAssessment.nutrient_context ? (
              <View>
                <Text style={[styles.claimsLine, { color: colors.textSecondary }]}>
                  standard: {claimsAssessment.nutrient_context.standard_version} · basis:{' '}
                  {claimsAssessment.nutrient_context.basis} · large_portion_override:{' '}
                  {String(claimsAssessment.nutrient_context.large_portion_override)}
                </Text>
                {(
                  [
                    ['total_sugars', claimsAssessment.nutrient_context.nutrients.total_sugars],
                    ['saturated_fat', claimsAssessment.nutrient_context.nutrients.saturated_fat],
                    ['sodium', claimsAssessment.nutrient_context.nutrients.sodium],
                  ] as const
                ).map(([key, entry]) => (
                  <Text key={key} style={[styles.claimsLine, { color: colors.text }]}>
                    {key}: {entry.level}
                    {entry.per_100_value != null ? ` · per100=${entry.per_100_value}` : ''}
                    {entry.per_portion_value != null ? ` · portion=${entry.per_portion_value}` : ''}
                    {entry.high_reason ? ` · high_reason=${entry.high_reason}` : ''}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={[styles.empty, { color: colors.textTertiary }]}>No nutrient context</Text>
            )}

            <Text style={[styles.claimsSubhead, { color: colors.text }]}>Fired Claims adjustments</Text>
            {claimsAssessment.fired_adjustments.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textTertiary }]}>
                None (assessed-neutral must never appear as a +0 fired row)
              </Text>
            ) : (
              claimsAssessment.fired_adjustments.map((f, i) => (
                <Text key={`${f.id}:${i}`} style={[styles.claimsLine, { color: colors.text }]}>
                  {f.id} · {f.points > 0 ? '+' : ''}
                  {f.points} · {f.description}
                  {f.canonical_id ? ` · commentary/canonical: ${f.canonical_id}` : ''}
                </Text>
              ))
            )}

            <Text style={[styles.claimsSubhead, { color: colors.text }]}>Suppressed candidates</Text>
            {claimsAssessment.suppressed_candidates.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textTertiary }]}>None</Text>
            ) : (
              claimsAssessment.suppressed_candidates.map((s, i) => (
                <Text key={`${s.candidate_id}:${i}`} style={[styles.claimsLine, { color: colors.text }]}>
                  {s.candidate_id} · would={s.points_would_have_been} · {s.reason_code}: {s.reason_detail}
                </Text>
              ))
            )}

            <Text style={[styles.claimsSubhead, { color: colors.text }]}>Benchmark checks</Text>
            {claimsAssessment.benchmark_checks.map((b) => (
              <Text key={b.source} style={[styles.claimsLine, { color: colors.text }]}>
                {b.source}: {b.status}
              </Text>
            ))}

            <Text style={[styles.claimsSubhead, { color: colors.text }]}>Diagnostics / fail-closed reasons</Text>
            {claimsAssessment.diagnostics.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textTertiary }]}>None</Text>
            ) : (
              claimsAssessment.diagnostics.map((d, i) => (
                <Text key={`${d.code}:${i}`} style={[styles.claimsLine, { color: colors.text }]}>
                  {d.code}: {d.detail}
                </Text>
              ))
            )}

            {claimsAssessment.commentary_payload.route !== 'none' ? (
              <Text style={[styles.claimsLine, { color: colors.textTertiary }]}>
                commentary_route: {claimsAssessment.commentary_payload.route}
                {claimsAssessment.commentary_payload.l1
                  ? ` · L1 bound: ${claimsAssessment.commentary_payload.l1.slice(0, 80)}…`
                  : ''}
              </Text>
            ) : null}
          </View>
        ) : null}

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
                    {adj.adjustmentId ? (
                      <Text style={[styles.adjId, { color: colors.textTertiary }]}>{adj.adjustmentId}</Text>
                    ) : null}
                    <Text style={[styles.adjDesc, { color: colors.text }]} numberOfLines={2}>{adj.description}</Text>
                    <Text style={[styles.adjSource, { color: colors.textTertiary }]}>
                      Highlight: {adj.highlightEligible === true ? 'eligible' : adj.highlightEligible === false ? 'ineligible' : '—'}
                    </Text>
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
  adjId: { fontSize: 11, marginBottom: 2, opacity: 0.85 },
  adjDesc: { fontSize: 13 },
  adjSourceRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 2 },
  adjSource: { fontSize: 11 },
  adjLink: { fontSize: 11, textDecorationLine: 'underline', marginLeft: 8 },
  adjValue: { fontSize: 14, fontWeight: '600' },
  placeholder: { fontStyle: 'italic' },
  claimsBlock: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16 },
  claimsSubhead: { fontSize: 13, fontWeight: '600', marginTop: 10, marginBottom: 4 },
  claimsLine: { fontSize: 12, marginBottom: 2 },
  claimsItem: { marginBottom: 8 },
  bottomSpacer: { height: 24 },
});
