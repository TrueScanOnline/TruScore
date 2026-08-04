/**
 * Stage 2 MVP — manual batch + best-before month/year entry for food recalls.
 * Provisional UI — founder/legal copy approval required before launch.
 *
 * Internal field state resets whenever `barcode` changes so prior product markings
 * never carry across scans.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import type { FoodRecallSubmittedMarkings } from '../workstreamC/recall';

type Props = {
  /** Scanned barcode — changing this clears all field state */
  barcode: string;
  visible: boolean;
  officialSourceUrl?: string;
  initial?: FoodRecallSubmittedMarkings | null;
  onApply: (markings: FoodRecallSubmittedMarkings) => void;
};

const MONTHS = [
  { v: 1, l: 'Jan' },
  { v: 2, l: 'Feb' },
  { v: 3, l: 'Mar' },
  { v: 4, l: 'Apr' },
  { v: 5, l: 'May' },
  { v: 6, l: 'Jun' },
  { v: 7, l: 'Jul' },
  { v: 8, l: 'Aug' },
  { v: 9, l: 'Sep' },
  { v: 10, l: 'Oct' },
  { v: 11, l: 'Nov' },
  { v: 12, l: 'Dec' },
];

export default function FoodRecallMarkingsEntry({
  barcode,
  visible,
  initial,
  onApply,
}: Props) {
  const [batch, setBatch] = useState(initial?.batchCodeRaw ?? '');
  const [month, setMonth] = useState<number | null>(initial?.bestBeforeMonth ?? null);
  const [year, setYear] = useState(
    initial?.bestBeforeYear != null ? String(initial.bestBeforeYear) : ''
  );

  // Reset fields on every barcode change (do not retain prior product values)
  useEffect(() => {
    setBatch(initial?.batchCodeRaw ?? '');
    setMonth(initial?.bestBeforeMonth ?? null);
    setYear(initial?.bestBeforeYear != null ? String(initial.bestBeforeYear) : '');
  }, [barcode]); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: barcode-only reset

  // When opening edit mode with prior markings, seed fields once visible becomes true
  useEffect(() => {
    if (!visible) return;
    if (initial?.batchCodeRaw != null) setBatch(initial.batchCodeRaw);
    if (initial?.bestBeforeMonth != null) setMonth(initial.bestBeforeMonth);
    if (initial?.bestBeforeYear != null) setYear(String(initial.bestBeforeYear));
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const yearNum = useMemo(() => {
    const n = parseInt(year, 10);
    return Number.isFinite(n) ? n : null;
  }, [year]);

  if (!visible) return null;

  return (
    <View style={styles.wrap} accessibilityLabel="food-recall-batch-entry">
      <Text style={styles.title}>Check batch and best-before</Text>
      <Text style={styles.hint}>
        Find the batch code on the box or wrapper. Best-before is a month/year marking (not a
        clock time). Provisional wording — founder/legal approval required before launch.
      </Text>
      <Text style={styles.label}>Batch code</Text>
      <TextInput
        style={styles.input}
        value={batch}
        onChangeText={setBatch}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder="e.g. 5316TD15"
        accessibilityLabel="food-recall-batch-code"
      />
      <Text style={styles.label}>Best-before month</Text>
      <View style={styles.monthRow}>
        {MONTHS.map((m) => (
          <TouchableOpacity
            key={m.v}
            style={[styles.monthChip, month === m.v && styles.monthChipOn]}
            onPress={() => setMonth(m.v)}
            accessibilityLabel={`food-recall-bb-month-${m.v}`}
          >
            <Text style={[styles.monthText, month === m.v && styles.monthTextOn]}>{m.l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.label}>Best-before year</Text>
      <TextInput
        style={styles.input}
        value={year}
        onChangeText={setYear}
        keyboardType="number-pad"
        placeholder="e.g. 2026"
        accessibilityLabel="food-recall-bb-year"
      />
      <TouchableOpacity
        style={styles.apply}
        onPress={() =>
          onApply({
            batchCodeRaw: batch,
            bestBeforeMonth: month,
            bestBeforeYear: yearNum,
          })
        }
        accessibilityLabel="food-recall-apply-markings"
      >
        <Text style={styles.applyText}>Check against recall notice</Text>
      </TouchableOpacity>
    </View>
  );
}

/** Pure helpers for unit tests — entry visibility and re-check after terminal states */
export function foodRecallMarkingsEntryVisible(opts: {
  needsBatchEntry: boolean;
  editing: boolean;
}): boolean {
  return opts.needsBatchEntry || opts.editing;
}

export function foodRecallShowEditDetails(opts: {
  matchState?: string | null;
  editing: boolean;
  needsBatchEntry: boolean;
}): boolean {
  if (opts.editing || opts.needsBatchEntry) return false;
  return (
    opts.matchState === 'confirmed_affected' || opts.matchState === 'batch_not_listed'
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c62828',
    backgroundColor: '#fff8f8',
  },
  title: { fontSize: 16, fontWeight: '700', color: '#b71c1c', marginBottom: 6 },
  hint: { fontSize: 13, color: '#5d4037', marginBottom: 10, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 4, marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    fontSize: 15,
  },
  monthRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  monthChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbb',
    backgroundColor: '#fff',
  },
  monthChipOn: { backgroundColor: '#c62828', borderColor: '#c62828' },
  monthText: { fontSize: 12, color: '#333' },
  monthTextOn: { color: '#fff', fontWeight: '700' },
  apply: {
    marginTop: 12,
    backgroundColor: '#c62828',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
