import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import {
  getTruscoreCertificationPickerTags,
  formatCertificationTagForPicker,
} from '../services/ethicsCertificationsService';

interface CertificationMultiPickerProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function CertificationMultiPicker({
  selectedTags,
  onChange,
  placeholder,
}: CertificationMultiPickerProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const allTags = useMemo(() => getTruscoreCertificationPickerTags(), []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allTags;
    return allTags.filter((tag) => {
      const label = formatCertificationTagForPicker(tag).toLowerCase();
      return tag.includes(q) || label.includes(q);
    });
  }, [allTags, searchQuery]);

  const selectedSet = useMemo(() => new Set(selectedTags), [selectedTags]);

  const toggle = (tag: string) => {
    const next = new Set(selectedSet);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    onChange(Array.from(next).sort());
  };

  const removeTag = (tag: string) => {
    onChange(selectedTags.filter((t) => t !== tag));
  };

  const ph =
    placeholder ||
    t('manualProduct.certificationsPickerPlaceholder') ||
    'Select certifications…';

  return (
    <View>
      {selectedTags.length > 0 && (
        <View style={styles.chipWrap}>
          {selectedTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.chip, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}
              onPress={() => removeTag(tag)}
              accessibilityRole="button"
              accessibilityLabel={t('manualProduct.removeCertification', 'Remove certification')}
            >
              <Text style={[styles.chipText, { color: colors.text }]} numberOfLines={1}>
                {formatCertificationTagForPicker(tag)}
              </Text>
              <Ionicons name="close-circle" size={18} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.pickerButton,
          { borderColor: colors.border, backgroundColor: colors.background },
        ]}
        onPress={() => {
          setModalVisible(true);
          setSearchQuery('');
        }}
        activeOpacity={0.7}
      >
        <Text
          style={[
            selectedTags.length ? styles.pickerButtonText : styles.placeholder,
            { color: selectedTags.length ? colors.text : colors.textSecondary },
          ]}
          numberOfLines={1}
        >
          {selectedTags.length
            ? t('manualProduct.certificationsSelectedCount', { count: selectedTags.length })
            : ph}
        </Text>
        <Ionicons name="chevron-down-outline" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent
        presentationStyle="overFullScreen"
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('manualProduct.certificationsPickerTitle') || 'Certifications'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View
              style={[styles.searchContainer, { backgroundColor: colors.background, borderColor: colors.border }]}
            >
              <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={t('manualProduct.certificationsSearchPlaceholder') || 'Search…'}
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              {t('manualProduct.certificationsPickerHint') || 'Tap rows to select or deselect. Same tags as TruScore ethics certifications.'}
            </Text>

            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const on = selectedSet.has(item);
                return (
                  <TouchableOpacity
                    style={[
                      styles.row,
                      { borderBottomColor: colors.border },
                      on && { backgroundColor: colors.primary + '18' },
                    ]}
                    onPress={() => toggle(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.rowText}>
                      <Text style={[styles.rowTitle, { color: colors.text }]}>
                        {formatCertificationTagForPicker(item)}
                      </Text>
                      <Text style={[styles.rowTag, { color: colors.textSecondary }]} numberOfLines={1}>
                        {item}
                      </Text>
                    </View>
                    {on ? (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    ) : (
                      <Ionicons name="ellipse-outline" size={22} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                );
              }}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={{ color: colors.textSecondary }}>
                    {t('manualProduct.certificationsNoResults') || 'No matching certifications'}
                  </Text>
                </View>
              }
            />

            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: colors.primary }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.doneButtonText}>{t('common.done', 'Done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: '100%',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
  },
  pickerButtonText: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  placeholder: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalContent: {
    maxHeight: '88%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    lineHeight: 16,
  },
  list: {
    maxHeight: 360,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    flex: 1,
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowTag: {
    fontSize: 12,
    marginTop: 2,
  },
  empty: {
    padding: 24,
    alignItems: 'center',
  },
  doneButton: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
