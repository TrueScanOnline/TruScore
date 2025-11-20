import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import CountryPicker from './CountryPicker';
import { Country, findCountryByName } from '../utils/countries';

interface ManufacturingCountryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (country: string) => Promise<void>;
  barcode: string;
  productName?: string;
}

export default function ManufacturingCountryModal({
  visible,
  onClose,
  onSubmit,
  barcode,
  productName,
}: ManufacturingCountryModalProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Instructions, Step 2: Select Country
  const isClosingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Helper function to get translation with fallback - ensures always returns a string
  const getTranslation = useCallback((key: string, fallback: string): string => {
    try {
      // Get translation - t() always returns a string (either translation or key)
      const translation = t(key);
      
      // If translation returns the key itself (missing translation), use fallback
      if (!translation || translation === key || typeof translation !== 'string') {
        return fallback;
      }
      
      // Return the translation
      return translation;
    } catch (error) {
      // If anything goes wrong, always return fallback
      return fallback;
    }
  }, [t]);

  // Reset state when modal opens - only once per open
  useEffect(() => {
    if (visible && !hasInitializedRef.current) {
      // Reset to step 1 and clear selection when modal opens
      console.log('[ManufacturingCountryModal] Modal opened - resetting state');
      setStep(1);
      setSelectedCountry(null);
      setSubmitting(false);
      isClosingRef.current = false;
      hasInitializedRef.current = true;
    } else if (!visible) {
      // Reset initialization flag when modal closes
      console.log('[ManufacturingCountryModal] Modal closed - resetting flags');
      hasInitializedRef.current = false;
      isClosingRef.current = false;
    }
  }, [visible]);

  // Debug: Log step changes and scroll to top when step changes
  useEffect(() => {
    console.log('[ManufacturingCountryModal] Step changed to:', step);
    if (step === 2) {
      // Scroll to top when moving to step 2
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 150);
    }
  }, [step]);

  const handleCountrySelect = useCallback((country: Country) => {
    setSelectedCountry(country);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedCountry) {
      Alert.alert(
        getTranslation('manufacturingCountry.invalidTitle', 'Invalid Country'),
        getTranslation('manufacturingCountry.selectCountryMessage', 'Please select a country'),
        [{ text: getTranslation('common.ok', 'OK') }]
      );
      return;
    }

    if (submitting || isClosingRef.current) return;

    setSubmitting(true);
    try {
      await onSubmit(selectedCountry.name);
      setSelectedCountry(null);
      setStep(1);
      isClosingRef.current = true;
      onClose();
    } catch (error) {
      console.error('Error submitting manufacturing country:', error);
      Alert.alert(
        getTranslation('common.error', 'Error'),
        getTranslation('manufacturingCountry.submitError', 'Failed to submit. Please try again.'),
        [{ text: getTranslation('common.ok', 'OK') }]
      );
    } finally {
      setSubmitting(false);
    }
  }, [selectedCountry, submitting, onSubmit, onClose, getTranslation]);

  const handleCancel = useCallback(() => {
    if (submitting || isClosingRef.current) {
      return;
    }
    
    isClosingRef.current = true;
    setSelectedCountry(null);
    setStep(1);
    setSubmitting(false);
    onClose();
  }, [submitting, onClose]);

  // Handler to advance from step 1 to step 2
  const handleNext = useCallback(() => {
    console.log('[ManufacturingCountryModal] handleNext called, current step:', step, 'submitting:', submitting);
    if (!submitting && step === 1) {
      console.log('[ManufacturingCountryModal] Directly setting step to 2');
      // Direct state update for immediate change
      setStep(2);
      // Scroll to top after state update completes
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 200);
    } else {
      console.log('[ManufacturingCountryModal] Next blocked - step:', step, 'submitting:', submitting);
    }
  }, [step, submitting]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        // Only close if modal is visible, not submitting, and not already closing
        if (visible && !submitting && !isClosingRef.current) {
          handleCancel();
        }
      }}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
      hardwareAccelerated={true}
    >
      <View style={styles.modalOverlay} pointerEvents="box-none">
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleCancel}
        />
        <View 
          style={[styles.modalContainer, { backgroundColor: colors.card }]}
        >
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleCancel}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>

          <ScrollView
            key={`scrollview-${step}`}
            ref={scrollViewRef}
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="globe-outline" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                {getTranslation('manufacturingCountry.title', 'Report Manufacturing Country')}
              </Text>
            </View>

            {/* Step Indicator */}
            <View style={styles.stepIndicator}>
              <View style={styles.stepContainer}>
                <View
                  style={[
                    styles.stepCircle,
                    { backgroundColor: step >= 1 ? colors.primary : colors.background },
                    { borderColor: colors.primary },
                  ]}
                >
                  {step > 1 ? (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  ) : (
                    <Text style={[styles.stepNumber, { color: step >= 1 ? '#fff' : colors.textSecondary }]}>
                      1
                    </Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, { color: step >= 1 ? colors.primary : colors.textSecondary }]}>
                  {getTranslation('manufacturingCountry.step1Label', 'Find Label')}
                </Text>
              </View>
              <View style={[styles.stepLine, { backgroundColor: step >= 2 ? colors.primary : colors.border }]} />
              <View style={styles.stepContainer}>
                <View
                  style={[
                    styles.stepCircle,
                    { backgroundColor: step >= 2 ? colors.primary : colors.background },
                    { borderColor: colors.primary },
                  ]}
                >
                  <Text style={[styles.stepNumber, { color: step >= 2 ? '#fff' : colors.textSecondary }]}>
                    2
                  </Text>
                </View>
                <Text style={[styles.stepLabel, { color: step >= 2 ? colors.primary : colors.textSecondary }]}>
                  {getTranslation('manufacturingCountry.step2Label', 'Select Country')}
                </Text>
              </View>
            </View>

            {/* Step 1: Instructions */}
            {step === 1 && (
              <View key="step-1" style={styles.stepContent}>
                <View style={styles.instructionCard}>
                  <Ionicons name="information-circle" size={24} color={colors.primary} />
                  <Text style={[styles.instructionTitle, { color: colors.text }]}>
                    {getTranslation('manufacturingCountry.instructionTitle', 'Step 1: Find the Label')}
                  </Text>
                  <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                    {getTranslation('manufacturingCountry.instructionText',
                      'Look at the product packaging or label. Find text that says "Product of [Country]" or "Made in [Country]".')}
                  </Text>
                </View>

                <View style={styles.exampleCard}>
                  <Text style={[styles.exampleTitle, { color: colors.text }]}>
                    {getTranslation('manufacturingCountry.exampleTitle', 'Examples:')}
                  </Text>
                  <View style={styles.exampleItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    <Text style={[styles.exampleText, { color: colors.textSecondary }]}>
                      "Product of China"
                    </Text>
                  </View>
                  <View style={styles.exampleItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    <Text style={[styles.exampleText, { color: colors.textSecondary }]}>
                      "Made in France"
                    </Text>
                  </View>
                  <View style={styles.exampleItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    <Text style={[styles.exampleText, { color: colors.textSecondary }]}>
                      "Manufactured in Germany"
                    </Text>
                  </View>
                </View>

                {productName && (
                  <View style={styles.productInfoCard}>
                    <Text style={[styles.productLabel, { color: colors.textSecondary }]}>
                      {getTranslation('manufacturingCountry.productLabel', 'Product:')}
                    </Text>
                    <Text style={[styles.productName, { color: colors.text }]}>{productName}</Text>
                  </View>
                )}

                <View style={styles.hintCard}>
                  <Ionicons name="bulb-outline" size={20} color="#ffd93d" />
                  <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                    {getTranslation('manufacturingCountry.hint',
                      'This information helps other users know where their products are made.')}
                  </Text>
                </View>
              </View>
            )}

            {/* Step 2: Country Selection */}
            {step === 2 && (
              <View key="step-2" style={styles.stepContent}>
                <View style={styles.instructionCard}>
                  <Ionicons name="location-outline" size={24} color={colors.primary} />
                  <Text style={[styles.instructionTitle, { color: colors.text }]}>
                    {getTranslation('manufacturingCountry.selectCountryTitle', 'Step 2: Select the Country')}
                  </Text>
                  <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                    {getTranslation('manufacturingCountry.selectCountryText',
                      'Select the country you found on the label from the list below.')}
                  </Text>
                </View>

                <View style={styles.pickerContainer}>
                  <Text style={[styles.pickerLabel, { color: colors.text }]}>
                    {getTranslation('manufacturingCountry.countryLabel', 'Manufacturing Country:')}
                  </Text>
                  <CountryPicker
                    selectedCountry={selectedCountry}
                    onSelect={handleCountrySelect}
                    placeholder={getTranslation('manufacturingCountry.countryPlaceholder', 'Select country...')}
                  />
                  {selectedCountry && (
                    <View style={styles.selectedCountryInfo}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                      <Text style={[styles.selectedCountryText, { color: colors.primary }]}>
                        {getTranslation('manufacturingCountry.selectedCountry', `Selected: ${selectedCountry.name}`)
                          .replace('{{country}}', selectedCountry.name)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.infoCard}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    {getTranslation('manufacturingCountry.privacyNote',
                      'Your contribution helps improve our database. This information will be verified by other users before being shown to everyone.')}
                  </Text>
                </View>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              {step === 1 ? (
                <TouchableOpacity
                  style={[styles.nextButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    console.log('[ManufacturingCountryModal] Next button pressed directly, step:', step);
                    handleNext();
                  }}
                  activeOpacity={0.8}
                  disabled={submitting}
                  testID="next-button"
                >
                  <Text style={styles.buttonText}>
                    {getTranslation('manufacturingCountry.next', 'Next: Select Country')}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => setStep(1)}
                    disabled={submitting}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="arrow-back" size={20} color={colors.text} />
                    <Text style={[styles.backButtonText, { color: colors.text }]}>
                      {getTranslation('common.back', 'Back')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      { backgroundColor: colors.primary },
                      (!selectedCountry || submitting) && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={!selectedCountry || submitting}
                    activeOpacity={0.8}
                  >
                    {submitting ? (
                      <>
                        <Text style={styles.buttonText}>
                          {getTranslation('manufacturingCountry.submitting', 'Submitting...')}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.buttonText}>
                          {getTranslation('manufacturingCountry.submit', 'Submit')}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.background }]}
                onPress={handleCancel}
                disabled={submitting || isClosingRef.current}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                  {getTranslation('common.cancel', 'Cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 8,
  },
  stepContainer: {
    alignItems: 'center',
    gap: 8,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  stepLine: {
    flex: 1,
    height: 2,
    maxWidth: 40,
  },
  stepContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  instructionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  exampleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 12,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exampleText: {
    fontSize: 14,
  },
  productInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  productLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbe6',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  pickerContainer: {
    gap: 8,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedCountryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  selectedCountryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    flex: 1,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 14,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
