import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useScanStore } from '../src/store/useScanStore';
import { useSubscriptionStore } from '../src/store/useSubscriptionStore';
import { isPremiumFeatureEnabled, PremiumFeature } from '../src/utils/premiumFeatures';
import { useNetworkStatus } from '../src/hooks/useNetworkStatus';
import { useTheme } from '../src/theme';
import PremiumGate from '../src/components/PremiumGate';
import { RootStackParamList } from './_layout';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ScanScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const [cameraKey, setCameraKey] = useState(0); // Force remount camera
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const { addScan } = useScanStore();
  const { subscriptionInfo } = useSubscriptionStore();
  const { isOffline, isOnline, canUseOfflineMode, isOfflineModeEnabled } = useNetworkStatus();
  const isPremium = isPremiumFeatureEnabled(PremiumFeature.OFFLINE_MODE, subscriptionInfo);
  const remountTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset camera when screen is focused (user returns to scanner)
  // OPTIMIZED: Debounce camera remounting to prevent memory leaks from rapid tab switching
  useFocusEffect(
    useCallback(() => {
      // Clear any pending remount timer
      if (remountTimerRef.current) {
        clearTimeout(remountTimerRef.current);
        remountTimerRef.current = null;
      }

      // Reset scanner state immediately
      setScanned(false);
      
      // On iOS, ensure camera is active immediately when permission is granted
      if (permission?.granted) {
        // For iOS: Activate camera immediately without delay
        if (Platform.OS === 'ios') {
          setCameraActive(true);
          // Force remount to ensure camera initializes properly
          setCameraKey(prev => prev + 1);
        } else {
          // For Android: Use debounced remount
          setCameraActive(true);
          remountTimerRef.current = setTimeout(() => {
            if (permission?.granted) {
              setCameraKey(prev => prev + 1);
              setCameraActive(true);
            }
            remountTimerRef.current = null;
          }, 100);
        }
      }

      return () => {
        // Cleanup: clear timer if component unmounts or loses focus
        if (remountTimerRef.current) {
          clearTimeout(remountTimerRef.current);
          remountTimerRef.current = null;
        }
      };
    }, [permission?.granted])
  );

  useEffect(() => {
    // Request camera permission on mount
    const requestCameraPermission = async () => {
      try {
        if (!permission?.granted && permission?.canAskAgain) {
          console.log('[ScanScreen] Requesting camera permission...');
          const result = await requestPermission();
          console.log('[ScanScreen] Camera permission result:', result);
        }
      } catch (error: any) {
        console.error('[ScanScreen] Camera permission error:', error);
        // Show alert for both iOS and Android
        Alert.alert(
          t('scan.cameraPermissionError') || 'Camera Access Needed',
          t('scan.cameraPermissionErrorMessage') || 'Camera access needed – enable in settings',
          [
            {
              text: t('common.settings') || 'Settings',
              onPress: () => {
                Linking.openSettings?.();
              },
            },
            {
              text: t('common.cancel') || 'Cancel',
              style: 'cancel',
            },
          ]
        );
      }
    };

    requestCameraPermission();
  }, [permission?.granted, requestPermission]);

  // Separate effect to handle camera activation when permission is granted
  useEffect(() => {
    if (permission?.granted) {
      console.log('[ScanScreen] Camera permission granted, activating camera...');
      // On iOS, activate immediately; on Android, use a small delay
      if (Platform.OS === 'ios') {
        setCameraActive(true);
        // Force remount to ensure proper initialization
        setCameraKey(prev => prev + 1);
      } else {
        // Android: Small delay to ensure proper initialization
        setCameraActive(false);
        setTimeout(() => {
          setCameraKey(prev => prev + 1);
          setCameraActive(true);
        }, 100);
      }
    } else {
      setCameraActive(false);
    }
  }, [permission?.granted]);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    setCameraActive(false);

    let barcode = data.trim();
    
    // Handle QR/DataMatrix codes - extract GTIN if present
    if (type === 'qr' || type === 'datamatrix') {
      // Try to extract GTIN from QR code data
      // QR codes may contain GTIN in various formats: GTIN:1234567890123, 1234567890123, etc.
      const gtinMatch = barcode.match(/(?:gtin|ean|upc)[:\s]*(\d{8,14})/i) || barcode.match(/(\d{8,14})/);
      if (gtinMatch && gtinMatch[1]) {
        barcode = gtinMatch[1];
        // Show toast notification for QR fallback
        const Toast = require('react-native-toast-message').default;
        Toast.show({ type: 'info', text1: 'Scan complete', text2: 'QR fallback – scan complete' });
      } else {
        // QR code doesn't contain a valid GTIN
        Alert.alert(
          t('scan.invalidBarcode') || 'Invalid Barcode',
          t('scan.qrNoGtin') || 'QR code does not contain a valid product barcode (GTIN).',
          [
            {
              text: 'OK',
              onPress: () => {
                setScanned(false);
                setCameraActive(true);
              },
            },
          ]
        );
        return;
      }
    }

    // Validate barcode (UPC/EAN should be 8-14 digits)
    if (!/^\d{8,14}$/.test(barcode)) {
      Alert.alert(
        t('scan.invalidBarcode'),
        t('scan.invalidBarcodeMessage'),
        [
          {
            text: 'OK',
            onPress: () => {
              setScanned(false);
              setCameraActive(true);
            },
          },
        ]
      );
      return;
    }

    // Add to history
    addScan({
      barcode,
      timestamp: Date.now(),
      productName: null, // Will be fetched in result screen
    });

    // Navigate to result screen
    navigation.navigate('Result', { barcode });
    
    // Don't reset here - useFocusEffect will handle it when returning to screen
  };

  const handleManualEntry = () => {
    setShowManualEntry(true);
    setManualBarcode('');
  };

  const handleManualEntrySubmit = () => {
    if (!manualBarcode || !/^\d{8,14}$/.test(manualBarcode.trim())) {
      Alert.alert(
        t('scan.invalidBarcode'),
        t('scan.invalidBarcodeMessage')
      );
      return;
    }

    const trimmedBarcode = manualBarcode.trim();
    setShowManualEntry(false);
    setManualBarcode('');
    
    // Add to history
    addScan({
      barcode: trimmedBarcode,
      timestamp: Date.now(),
      productName: null,
    });

    // Navigate to result screen
    navigation.navigate('Result', { barcode: trimmedBarcode });
  };

  const handleManualEntryCancel = () => {
    setShowManualEntry(false);
    setManualBarcode('');
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="camera-outline" size={80} color={colors.primary} />
        <Text style={[styles.permissionTitle, { color: colors.text }]}>
          {t('scan.permissionRequired')}
        </Text>
        <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
          {t('scan.permissionText')}
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: colors.primary }]}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>{t('scan.grantPermission')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      {permission?.granted && (
        <>
          {cameraActive ? (
            <CameraView
              key={cameraKey} // Force remount on focus
              style={styles.camera}
              facing="back"
              enableTorch={false}
              barcodeScannerSettings={{
                barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr', 'datamatrix'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              onCameraReady={() => {
                console.log('[ScanScreen] Camera ready on', Platform.OS);
                setCameraActive(true);
              }}
              onMountError={(error) => {
                console.error('[ScanScreen] Camera mount error:', error);
                console.error('[ScanScreen] Error details:', JSON.stringify(error, null, 2));
                setCameraActive(false);
                
                // More helpful error message for iOS
                const errorMessage = Platform.OS === 'ios' 
                  ? 'Failed to initialize camera. Please check Settings > TrueScan > Camera and ensure it is enabled. Then restart the app.'
                  : t('scan.cameraErrorMessage') || 'Failed to initialize camera. Please try again.';
                
                Alert.alert(
                  t('scan.cameraError') || 'Camera Error',
                  errorMessage,
                  [
                    {
                      text: t('common.settings') || 'Settings',
                      onPress: () => {
                        Linking.openSettings?.();
                      },
                    },
                    {
                      text: t('common.retry') || 'Retry',
                      onPress: () => {
                        console.log('[ScanScreen] Retrying camera mount...');
                        setCameraKey(prev => prev + 1);
                        setTimeout(() => setCameraActive(true), 300);
                      },
                    },
                    {
                      text: t('common.cancel') || 'Cancel',
                      style: 'cancel',
                    },
                  ]
                );
              }}
            />
          ) : (
            <View style={[styles.camera, styles.cameraPlaceholder, { backgroundColor: '#000' }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.cameraPlaceholderText, { color: colors.textSecondary }]}>
                {t('scan.initializingCamera') || 'Initializing camera...'}
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary, marginTop: 16 }]}
                onPress={() => {
                  setCameraKey(prev => prev + 1);
                  setCameraActive(true);
                }}
              >
                <Text style={styles.retryButtonText}>Retry Camera</Text>
              </TouchableOpacity>
            </View>
          )}
          {/* Scanner Overlay - Absolutely positioned on top */}
          <View style={styles.overlay}>
            {/* Top Bar */}
            <View style={styles.topBar}>
              <Text style={styles.appTitle}>TrueScan</Text>
              {/* Offline Indicator */}
              {isOffline && (
                <View style={[styles.offlineIndicator, { backgroundColor: canUseOfflineMode ? '#ffa500' : '#ff6b6b' }]}>
                  <Ionicons 
                    name={canUseOfflineMode ? "cloud-offline" : "warning"} 
                    size={16} 
                    color="#fff" 
                  />
                  <Text style={styles.offlineText}>
                    {canUseOfflineMode ? t('offline.mode') : t('offline.noConnection')}
                  </Text>
                </View>
              )}
            </View>

            {/* Scanning Frame */}
            <View style={styles.scanFrame}>
              <View style={styles.corner} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>

            {/* Instructions */}
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionText}>
                {t('scan.scanning')}
              </Text>
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleManualEntry}
              >
                <Ionicons name="keypad-outline" size={24} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                  {t('scan.manualEntry')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Manual Entry Modal */}
      <Modal
        visible={showManualEntry}
        animationType="slide"
        transparent={true}
        onRequestClose={handleManualEntryCancel}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('scan.manualEntry')}
            </Text>
            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              {t('scan.manualEntryDescription') || 'Enter barcode manually (8-14 digits)'}
            </Text>
            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: colors.surface, 
                color: colors.text,
                borderColor: colors.border 
              }]}
              placeholder={t('scan.barcodePlaceholder') || 'Enter barcode'}
              placeholderTextColor={colors.textSecondary}
              value={manualBarcode}
              onChangeText={setManualBarcode}
              keyboardType="number-pad"
              autoFocus={true}
              maxLength={14}
              returnKeyType="done"
              onSubmitEditing={handleManualEntrySubmit}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border 
                }]}
                onPress={handleManualEntryCancel}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  {t('common.cancel') || 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSubmit, { 
                  backgroundColor: colors.primary 
                }]}
                onPress={handleManualEntrySubmit}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  {t('common.search') || 'Search'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  cameraPlaceholderText: {
    marginTop: 16,
    fontSize: 16,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  offlineText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  scanFrame: {
    flex: 1,
    marginHorizontal: 40,
    marginVertical: 100,
    borderWidth: 2,
    borderColor: '#16a085',
    borderRadius: 20,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderColor: '#4dd09f',
    top: -2,
    left: -2,
  },
  topRight: {
    top: -2,
    right: -2,
    left: 'auto',
    borderLeftWidth: 0,
    borderRightWidth: 4,
  },
  bottomLeft: {
    top: 'auto',
    bottom: -2,
    borderTopWidth: 0,
    borderBottomWidth: 4,
  },
  bottomRight: {
    top: 'auto',
    bottom: -2,
    right: -2,
    left: 'auto',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 160,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  actionButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 2,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    borderWidth: 1,
  },
  modalButtonSubmit: {
    // backgroundColor set dynamically
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

