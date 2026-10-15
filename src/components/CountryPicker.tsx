import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COUNTRIES, Country } from '../utils/countries';
import { useTheme } from '../theme';
import { resultEmeraldTone, resultPresentation } from '../theme/resultPresentation';

interface CountryPickerProps {
  selectedCountry: Country | null;
  onSelect: (country: Country) => void;
  placeholder?: string;
  /** Opt-in. Manual product entry keeps the default theme. */
  appearance?: 'default' | 'emerald';
}

export default function CountryPicker({
  selectedCountry,
  onSelect,
  placeholder = 'Select country',
  appearance = 'default',
}: CountryPickerProps) {
  const { colors, darkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const emeraldMode = appearance === 'emerald';
  const emerald = resultEmeraldTone(!!darkMode);
  const ink = emeraldMode ? emerald.ink : colors.text;
  const muted = emeraldMode ? emerald.muted : colors.textSecondary;
  const line = emeraldMode ? emerald.line : colors.border;
  const fieldBg = emeraldMode ? emerald.card : colors.background;
  const sheetBg = emeraldMode ? emerald.card : colors.card;
  const pageBg = emeraldMode ? resultPresentation.canvas[darkMode ? 'dark' : 'light'] : colors.background;
  const action = emeraldMode ? emerald.action : colors.primary;
  const selectedBg = emeraldMode ? emerald.chevronCircle : colors.primary + '20';
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter countries based on search query
  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (country: Country) => {
    console.log('[CountryPicker] Country selected:', country.name);
    onSelect(country);
    setModalVisible(false);
    setSearchQuery('');
  };

  const handleOpen = () => {
    console.log('[CountryPicker] Opening modal');
    setModalVisible(true);
    setSearchQuery('');
  };

  const handleClose = () => {
    console.log('[CountryPicker] Closing modal');
    setModalVisible(false);
    setSearchQuery('');
  };

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.pickerButton,
          emeraldMode ? { borderRadius: 12, minHeight: 48 } : null,
          {
            borderColor: line,
            backgroundColor: fieldBg,
          },
        ]}
        onPress={() => {
          console.log('[CountryPicker] Picker button pressed');
          handleOpen();
        }}
        activeOpacity={0.7}
      >
        {selectedCountry ? (
          <View style={styles.selectedCountry}>
            <Text style={styles.flag}>{selectedCountry.flag}</Text>
            <Text style={[styles.countryName, { color: ink }]}>
              {selectedCountry.name}
            </Text>
          </View>
        ) : (
          <Text style={[styles.placeholder, { color: muted }]}>
            {placeholder}
          </Text>
        )}
        <Ionicons
          name="chevron-down-outline"
          size={20}
          color={muted}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
        statusBarTranslucent={true}
        presentationStyle="overFullScreen"
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          />
          <View
            style={[
              styles.modalContent,
              { backgroundColor: sheetBg },
              emeraldMode
                ? {
                    paddingTop: Math.max(insets.top, 12),
                    paddingBottom: Math.max(insets.bottom, 20),
                  }
                : null,
            ]}
          >
            {/* Header */}
            <View style={[styles.modalHeader, emeraldMode ? { borderBottomColor: line } : null]}>
              <Text style={[styles.modalTitle, { color: ink }]}>
                Select Country
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={
                  emeraldMode
                    ? {
                        minWidth: 44,
                        minHeight: 44,
                        borderRadius: 22,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: emerald.chevronCircle,
                      }
                    : undefined
                }
              >
                <Ionicons name="close" size={24} color={ink} />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View
              style={[
                styles.searchContainer,
                {
                  backgroundColor: emeraldMode ? pageBg : colors.background,
                  borderColor: line,
                  borderRadius: emeraldMode ? 12 : 8,
                },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={20}
                color={muted}
              />
              <TextInput
                style={[styles.searchInput, { color: ink }]}
                placeholder="Search country..."
                placeholderTextColor={muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={muted}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Country List - Full alphabetical list */}
            <FlatList
              data={filteredCountries}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    { borderBottomColor: line },
                    selectedCountry?.code === item.code && {
                      backgroundColor: selectedBg,
                    },
                  ]}
                  onPress={() => {
                    console.log('[CountryPicker] Country item pressed:', item.name);
                    handleSelect(item);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.flag}>{item.flag}</Text>
                  <Text style={[styles.countryItemName, { color: ink }]}>
                    {item.name}
                  </Text>
                  {selectedCountry?.code === item.code && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={action}
                    />
                  )}
                </TouchableOpacity>
              )}
              style={styles.countryList}
              contentContainerStyle={styles.countryListContent}
              keyboardShouldPersistTaps="handled"
              removeClippedSubviews={false}
              initialNumToRender={100}
              maxToRenderPerBatch={50}
              windowSize={21}
              getItemLayout={(data, index) => ({
                length: 56,
                offset: 56 * index,
                index,
              })}
              ListEmptyComponent={
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={[styles.countryItemName, { color: muted }]}>
                    No countries found
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
    marginBottom: 8,
  },
  selectedCountry: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  flag: {
    fontSize: 20,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  placeholder: {
    fontSize: 16,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  countryList: {
    flex: 1,
  },
  countryListContent: {
    paddingBottom: 20,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    minHeight: 56,
  },
  countryItemName: {
    flex: 1,
    fontSize: 16,
  },
});

