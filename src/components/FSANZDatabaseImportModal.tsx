// FSANZ Database Import Modal
// Allows users to import FSANZ database JSON files into the app

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import * as DocumentPicker from 'expo-document-picker';
import { 
  importFSANZDatabaseFromFile, 
  getFSANZImportStatus,
  clearFSANZDatabase,
  isFSANZDatabaseImported,
} from '../services/fsanDatabaseImport';
import { getUserCountryCode } from '../utils/countryDetection';

interface FSANZDatabaseImportModalProps {
  visible: boolean;
  onClose: () => void;
}

type ImportStatus = 'idle' | 'importing' | 'success' | 'error';

export default function FSANZDatabaseImportModal({
  visible,
  onClose,
}: FSANZDatabaseImportModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const userCountry = getUserCountryCode();
  
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [selectedCountry, setSelectedCountry] = useState<'AU' | 'NZ'>(userCountry === 'AU' ? 'AU' : 'NZ');
  const [importResult, setImportResult] = useState<{ productCount: number; error?: string } | null>(null);
  const [databaseStatus, setDatabaseStatus] = useState<{ imported: boolean; productCount?: number; importDate?: number } | null>(null);
  const [loading, setLoading] = useState(false);

  // Load database status when modal opens
  useEffect(() => {
    if (visible) {
      loadDatabaseStatus();
    }
  }, [visible, selectedCountry]);

  const loadDatabaseStatus = async () => {
    try {
      const status = await getFSANZImportStatus(selectedCountry);
      setDatabaseStatus(status);
    } catch (error) {
      console.error('Error loading database status:', error);
    }
  };

  const handleSelectFile = async () => {
    try {
      setLoading(true);
      setImportStatus('idle');
      setImportResult(null);

      // Pick JSON file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        Alert.alert(
          t('fsanzImport.error') || 'Error',
          t('fsanzImport.noFileSelected') || 'No file selected'
        );
        setLoading(false);
        return;
      }

      const fileUri = result.assets[0].uri;
      
      // Start import
      setImportStatus('importing');
      const importResult = await importFSANZDatabaseFromFile(fileUri, selectedCountry);
      
      if (importResult.success) {
        setImportStatus('success');
        setImportResult({ productCount: importResult.productCount });
        await loadDatabaseStatus();
        
        Alert.alert(
          t('fsanzImport.success') || 'Success',
          t('fsanzImport.importSuccess', { count: importResult.productCount }) || 
          `Successfully imported ${importResult.productCount} products`
        );
      } else {
        setImportStatus('error');
        setImportResult({ productCount: 0, error: importResult.error });
        
        Alert.alert(
          t('fsanzImport.error') || 'Error',
          importResult.error || t('fsanzImport.importFailed') || 'Import failed'
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setImportStatus('error');
      setImportResult({ productCount: 0, error: errorMessage });
      
      Alert.alert(
        t('fsanzImport.error') || 'Error',
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearDatabase = async () => {
    Alert.alert(
      t('fsanzImport.clearConfirm') || 'Clear Database',
      t('fsanzImport.clearConfirmMessage') || 'Are you sure you want to clear the imported database? This cannot be undone.',
      [
        {
          text: t('common.cancel') || 'Cancel',
          style: 'cancel',
        },
        {
          text: t('common.clear') || 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearFSANZDatabase(selectedCountry);
              await loadDatabaseStatus();
              Alert.alert(
                t('fsanzImport.cleared') || 'Cleared',
                t('fsanzImport.databaseCleared') || 'Database cleared successfully'
              );
            } catch (error) {
              Alert.alert(
                t('fsanzImport.error') || 'Error',
                error instanceof Error ? error.message : String(error)
              );
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <Ionicons name="cloud-download-outline" size={24} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>
                {t('fsanzImport.title') || 'FSANZ Database Import'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {/* Instructions */}
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('fsanzImport.instructions') || 'Instructions'}
              </Text>
              <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
                {t('fsanzImport.instructionsText') || 
                  '1. Download FSANZ database from the official website\n' +
                  '2. Convert to JSON using the import script\n' +
                  '3. Select the JSON file to import'}
              </Text>
            </View>

            {/* Country Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('fsanzImport.selectCountry') || 'Select Country'}
              </Text>
              <View style={styles.countryButtons}>
                <TouchableOpacity
                  style={[
                    styles.countryButton,
                    selectedCountry === 'AU' && { backgroundColor: colors.primary, borderColor: colors.primary },
                    { borderColor: colors.border },
                  ]}
                  onPress={() => {
                    setSelectedCountry('AU');
                    setImportStatus('idle');
                    setImportResult(null);
                  }}
                >
                  <Text style={[
                    styles.countryButtonText,
                    selectedCountry === 'AU' && { color: '#fff' },
                    { color: colors.text },
                  ]}>
                    Australia (AU)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.countryButton,
                    selectedCountry === 'NZ' && { backgroundColor: colors.primary, borderColor: colors.primary },
                    { borderColor: colors.border },
                  ]}
                  onPress={() => {
                    setSelectedCountry('NZ');
                    setImportStatus('idle');
                    setImportResult(null);
                  }}
                >
                  <Text style={[
                    styles.countryButtonText,
                    selectedCountry === 'NZ' && { color: '#fff' },
                    { color: colors.text },
                  ]}>
                    New Zealand (NZ)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Database Status */}
            {databaseStatus && (
              <View style={[styles.section, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t('fsanzImport.currentStatus') || 'Current Status'}
                </Text>
                {databaseStatus.imported ? (
                  <View>
                    <View style={styles.statusRow}>
                      <Ionicons name="checkmark-circle" size={20} color="#16a085" />
                      <Text style={[styles.statusText, { color: colors.text }]}>
                        {t('fsanzImport.imported') || 'Database imported'}
                      </Text>
                    </View>
                    {databaseStatus.productCount !== undefined && (
                      <Text style={[styles.statusDetail, { color: colors.textSecondary }]}>
                        {t('fsanzImport.productCount', { count: databaseStatus.productCount }) || 
                          `${databaseStatus.productCount} products`}
                      </Text>
                    )}
                    {databaseStatus.importDate && (
                      <Text style={[styles.statusDetail, { color: colors.textSecondary }]}>
                        {t('fsanzImport.importedAt') || 'Imported:'} {formatDate(databaseStatus.importDate)}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={[styles.clearButton, { borderColor: colors.error || '#ff6b6b' }]}
                      onPress={handleClearDatabase}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.error || '#ff6b6b'} />
                      <Text style={[styles.clearButtonText, { color: colors.error || '#ff6b6b' }]}>
                        {t('fsanzImport.clearDatabase') || 'Clear Database'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.statusRow}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
                    <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                      {t('fsanzImport.notImported') || 'No database imported'}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Import Button */}
            <TouchableOpacity
              style={[
                styles.importButton,
                { backgroundColor: colors.primary },
                loading && styles.importButtonDisabled,
              ]}
              onPress={handleSelectFile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                  <Text style={styles.importButtonText}>
                    {t('fsanzImport.selectFile') || 'Select JSON File to Import'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Import Result */}
            {importStatus === 'success' && importResult && (
              <View style={[styles.resultBox, { backgroundColor: '#16a085' + '20', borderColor: '#16a085' }]}>
                <Ionicons name="checkmark-circle" size={24} color="#16a085" />
                <Text style={[styles.resultText, { color: '#16a085' }]}>
                  {t('fsanzImport.importSuccess', { count: importResult.productCount }) || 
                    `Successfully imported ${importResult.productCount} products`}
                </Text>
              </View>
            )}

            {importStatus === 'error' && importResult?.error && (
              <View style={[styles.resultBox, { backgroundColor: '#ff6b6b' + '20', borderColor: '#ff6b6b' }]}>
                <Ionicons name="alert-circle" size={24} color="#ff6b6b" />
                <Text style={[styles.resultText, { color: '#ff6b6b' }]}>
                  {importResult.error}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  countryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  countryButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  countryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusDetail: {
    fontSize: 12,
    marginLeft: 28,
    marginTop: 4,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  importButtonDisabled: {
    opacity: 0.6,
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  resultText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
});
