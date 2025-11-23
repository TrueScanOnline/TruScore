// FSANZ Database Import Modal
// Allows users to import pre-converted FSANZ database JSON files

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import {
  importFSANZDatabaseFromFile,
  getFSANZDatabaseMetadata,
  isFSANZDatabaseImported,
  clearFSANZDatabase,
} from '../services/fsanDatabaseImport';
import {
  isAutoUpdateEnabled,
  setAutoUpdateEnabled,
  forceUpdateCheck,
} from '../services/fsanDatabaseAutoUpdate';
import { updateFromCDNIfNeeded } from '../services/fsanDatabaseCDN';
import { logger } from '../utils/logger';
import { useTheme } from '../theme';

interface FSANZDatabaseImportModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function FSANZDatabaseImportModal({
  visible,
  onClose,
}: FSANZDatabaseImportModalProps) {
  const { colors } = useTheme();
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [autoUpdateEnabled, setAutoUpdateEnabledState] = useState(true); // Default to enabled
  const [auMetadata, setAuMetadata] = useState<{
    productCount: number;
    importDate: string;
    dataSize: number;
  } | null>(null);
  const [nzMetadata, setNzMetadata] = useState<{
    productCount: number;
    importDate: string;
    dataSize: number;
  } | null>(null);

  // Load metadata and auto-update status on mount
  React.useEffect(() => {
    if (visible) {
      loadMetadata();
      loadAutoUpdateStatus();
    }
  }, [visible]);

  const loadAutoUpdateStatus = async () => {
    const enabled = await isAutoUpdateEnabled();
    setAutoUpdateEnabledState(enabled);
  };

  const loadMetadata = async () => {
    const [auMeta, nzMeta] = await Promise.all([
      getFSANZDatabaseMetadata('AU'),
      getFSANZDatabaseMetadata('NZ'),
    ]);
    setAuMetadata(auMeta);
    setNzMetadata(nzMeta);
  };

  const handleImportFile = async (country: 'AU' | 'NZ') => {
    try {
      setImporting(true);
      setImportStatus(`Selecting ${country === 'AU' ? 'Australian' : 'New Zealand'} database file...`);

      // Pick JSON file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setImporting(false);
        setImportStatus(null);
        return;
      }

      const fileUri = result.assets[0].uri;
      setImportStatus(`Importing ${country === 'AU' ? 'Australian' : 'New Zealand'} database...`);

      // Import database
      const importResult = await importFSANZDatabaseFromFile(fileUri, country);

      if (importResult.success) {
        setImportStatus(
          `✅ Successfully imported ${importResult.productCount.toLocaleString()} products!`
        );
        Alert.alert(
          'Import Successful',
          `Successfully imported ${importResult.productCount.toLocaleString()} products from FSANZ ${country === 'AU' ? 'Australian' : 'New Zealand'} database.`,
          [{ text: 'OK', onPress: () => loadMetadata() }]
        );
      } else {
        setImportStatus(`❌ Import failed: ${importResult.error}`);
        Alert.alert('Import Failed', importResult.error || 'Unknown error occurred');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('FSANZ import error:', errorMessage);
      setImportStatus(`❌ Error: ${errorMessage}`);
      Alert.alert('Import Error', errorMessage);
    } finally {
      setImporting(false);
      setTimeout(() => setImportStatus(null), 5000);
    }
  };

  const handleClearDatabase = async (country: 'AU' | 'NZ') => {
    Alert.alert(
      'Clear Database',
      `Are you sure you want to clear the ${country === 'AU' ? 'Australian' : 'New Zealand'} FSANZ database? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearFSANZDatabase(country);
            await loadMetadata();
            Alert.alert('Database Cleared', 'The database has been cleared successfully.');
          },
        },
      ]
    );
  };

  const handleToggleAutoUpdate = async (enabled: boolean) => {
    await setAutoUpdateEnabled(enabled);
    setAutoUpdateEnabledState(enabled);
    // Don't show alert - the toggle itself provides visual feedback
    // Users can see the status change immediately
    logger.info(`FSANZ auto-update ${enabled ? 'enabled' : 'disabled'} by user`);
  };

  const handleForceUpdate = async () => {
    try {
      setImporting(true);
      setImportStatus('Checking for updates...');
      
      const result = await forceUpdateCheck();
      
      if (result.success && result.countries.some((c) => c.success)) {
        const successCount = result.countries.filter((c) => c.success).length;
        setImportStatus(`✅ Updated ${successCount} database(s) successfully!`);
        await loadMetadata();
        Alert.alert(
          'Update Complete',
          `Successfully updated ${successCount} database(s).`
        );
      } else {
        const errors = result.countries
          .filter((c) => !c.success)
          .map((c) => `${c.country}: ${c.error || 'Unknown error'}`)
          .join('\n');
        setImportStatus('❌ Update failed. Check CDN configuration.');
        Alert.alert('Update Failed', errors || 'No updates available or CDN not configured.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setImportStatus(`❌ Error: ${errorMessage}`);
      Alert.alert('Update Error', errorMessage);
    } finally {
      setImporting(false);
      setTimeout(() => setImportStatus(null), 5000);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const modalStyles = styles(colors);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.modalContainer}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>FSANZ Database Import</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={modalStyles.content}>
            <Text style={modalStyles.description}>
              Import official FSANZ (Food Standards Australia New Zealand) databases to improve
              product recognition. Download databases from official websites, convert to JSON using
              the provided script, then import here.
            </Text>

            {importStatus && (
              <View style={modalStyles.statusContainer}>
                <Text style={modalStyles.statusText}>{importStatus}</Text>
                {importing && <ActivityIndicator size="small" color={colors.primary} style={modalStyles.loader} />}
              </View>
            )}

            {/* Australian Database */}
            <View style={modalStyles.databaseSection}>
              <View style={modalStyles.databaseHeader}>
                <Ionicons name="flag" size={20} color={colors.primary} />
                <Text style={modalStyles.databaseTitle}>Australian Database</Text>
              </View>

              {auMetadata ? (
                <View style={modalStyles.metadataContainer}>
                  <Text style={modalStyles.metadataText}>
                    ✅ Imported: {auMetadata.productCount.toLocaleString()} products
                  </Text>
                  <Text style={modalStyles.metadataText}>
                    📅 Date: {formatDate(auMetadata.importDate)}
                  </Text>
                  <Text style={modalStyles.metadataText}>
                    📦 Size: {formatSize(auMetadata.dataSize)}
                  </Text>
                  <View style={modalStyles.buttonRow}>
                    <TouchableOpacity
                      style={[modalStyles.button, modalStyles.updateButton]}
                      onPress={() => handleImportFile('AU')}
                      disabled={importing}
                    >
                      <Ionicons name="refresh" size={16} color="#fff" />
                      <Text style={modalStyles.buttonText}>Update</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[modalStyles.button, modalStyles.clearButton]}
                      onPress={() => handleClearDatabase('AU')}
                      disabled={importing}
                    >
                      <Ionicons name="trash" size={16} color="#fff" />
                      <Text style={modalStyles.buttonText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={modalStyles.emptyContainer}>
                  <Text style={modalStyles.emptyText}>No database imported</Text>
                  <TouchableOpacity
                    style={[modalStyles.button, modalStyles.importButton]}
                    onPress={() => handleImportFile('AU')}
                    disabled={importing}
                  >
                    <Ionicons name="cloud-download" size={16} color="#fff" />
                    <Text style={modalStyles.buttonText}>Import Database</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* New Zealand Database */}
            <View style={modalStyles.databaseSection}>
              <View style={modalStyles.databaseHeader}>
                <Ionicons name="flag" size={20} color={colors.primary} />
                <Text style={modalStyles.databaseTitle}>New Zealand Database</Text>
              </View>

              {nzMetadata ? (
                <View style={modalStyles.metadataContainer}>
                  <Text style={modalStyles.metadataText}>
                    ✅ Imported: {nzMetadata.productCount.toLocaleString()} products
                  </Text>
                  <Text style={modalStyles.metadataText}>
                    📅 Date: {formatDate(nzMetadata.importDate)}
                  </Text>
                  <Text style={modalStyles.metadataText}>
                    📦 Size: {formatSize(nzMetadata.dataSize)}
                  </Text>
                  <View style={modalStyles.buttonRow}>
                    <TouchableOpacity
                      style={[modalStyles.button, modalStyles.updateButton]}
                      onPress={() => handleImportFile('NZ')}
                      disabled={importing}
                    >
                      <Ionicons name="refresh" size={16} color="#fff" />
                      <Text style={modalStyles.buttonText}>Update</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[modalStyles.button, modalStyles.clearButton]}
                      onPress={() => handleClearDatabase('NZ')}
                      disabled={importing}
                    >
                      <Ionicons name="trash" size={16} color="#fff" />
                      <Text style={modalStyles.buttonText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={modalStyles.emptyContainer}>
                  <Text style={modalStyles.emptyText}>No database imported</Text>
                  <TouchableOpacity
                    style={[modalStyles.button, modalStyles.importButton]}
                    onPress={() => handleImportFile('NZ')}
                    disabled={importing}
                  >
                    <Ionicons name="cloud-download" size={16} color="#fff" />
                    <Text style={modalStyles.buttonText}>Import Database</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Auto-Update Settings */}
            <View style={modalStyles.databaseSection}>
              <View style={modalStyles.databaseHeader}>
                <Ionicons name="sync-outline" size={20} color={colors.primary} />
                <Text style={modalStyles.databaseTitle}>Automatic Updates</Text>
              </View>
              <View style={modalStyles.metadataContainer}>
                <View style={modalStyles.buttonRow}>
                  <Text style={modalStyles.metadataText}>
                    {autoUpdateEnabled
                      ? '✅ Automatic updates enabled (checks every 7 days)'
                      : '❌ Automatic updates disabled'}
                  </Text>
                  <TouchableOpacity
                    style={[modalStyles.button, autoUpdateEnabled ? modalStyles.updateButton : modalStyles.importButton]}
                    onPress={() => handleToggleAutoUpdate(!autoUpdateEnabled)}
                    disabled={importing}
                  >
                    <Ionicons name={autoUpdateEnabled ? 'toggle' : 'toggle-outline'} size={16} color="#fff" />
                    <Text style={modalStyles.buttonText}>
                      {autoUpdateEnabled ? 'Disable' : 'Enable'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[modalStyles.button, modalStyles.updateButton]}
                  onPress={handleForceUpdate}
                  disabled={importing || !autoUpdateEnabled}
                >
                  <Ionicons name="refresh" size={16} color="#fff" />
                  <Text style={modalStyles.buttonText}>Check for Updates Now</Text>
                </TouchableOpacity>
                <Text style={[modalStyles.metadataText, { fontSize: 12, marginTop: 8 }]}>
                  Note: Automatic updates require CDN configuration. See documentation for setup.
                </Text>
              </View>
            </View>

            {/* Instructions */}
            <View style={modalStyles.instructionsContainer}>
              <Text style={modalStyles.instructionsTitle}>How to Import:</Text>
              <Text style={modalStyles.instructionsText}>
                1. Download FSANZ database exports from official websites{'\n'}
                2. Convert to JSON using: npm run import-fsanz{'\n'}
                3. Select the JSON file using the Import button above{'\n'}
                {'\n'}
                Or enable automatic updates to download from CDN automatically.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 5,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  statusContainer: {
    backgroundColor: colors.warningBackground,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  loader: {
    marginLeft: 10,
  },
  databaseSection: {
    marginBottom: 24,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
  },
  databaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  databaseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  metadataContainer: {
    marginTop: 8,
  },
  metadataText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  importButton: {
    backgroundColor: colors.primary,
  },
  updateButton: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  instructionsContainer: {
    backgroundColor: colors.warningBackground,
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

const styles = (colors: any) => createStyles(colors);
