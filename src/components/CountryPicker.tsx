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
import { Ionicons } from '@expo/vector-icons';
import { COUNTRIES, Country } from '../utils/countries';
import { useTheme } from '../theme';

interface CountryPickerProps {
  selectedCountry: Country | null;
  onSelect: (country: Country) => void;
  placeholder?: string;
}

export default function CountryPicker({
  selectedCountry,
  onSelect,
  placeholder = 'Select country',
}: CountryPickerProps) {
  const { colors } = useTheme();
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
          {
            borderColor: colors.border,
            backgroundColor: colors.background,
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
            <Text style={[styles.countryName, { color: colors.text }]}>
              {selectedCountry.name}
            </Text>
          </View>
        ) : (
          <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
            {placeholder}
          </Text>
        )}
        <Ionicons
          name="chevron-down-outline"
          size={20}
          color={colors.textSecondary}
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
            style={[styles.modalContent, { backgroundColor: colors.card }]}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select Country
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View
              style={[
                styles.searchContainer,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={20}
                color={colors.textSecondary}
              />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search country..."
                placeholderTextColor={colors.textSecondary}
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
                    color={colors.textSecondary}
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
                    { borderBottomColor: colors.border },
                    selectedCountry?.code === item.code && {
                      backgroundColor: colors.primary + '20',
                    },
                  ]}
                  onPress={() => {
                    console.log('[CountryPicker] Country item pressed:', item.name);
                    handleSelect(item);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.flag}>{item.flag}</Text>
                  <Text style={[styles.countryItemName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  {selectedCountry?.code === item.code && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary}
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
                  <Text style={[styles.countryItemName, { color: colors.textSecondary }]}>
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

