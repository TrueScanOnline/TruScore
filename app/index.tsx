import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
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
import type { ScanStackParamList } from '../src/navigation/tabStackParamLists';
import { useCameraLifecycle } from '../src/hooks/useCameraLifecycle';
import { powershellLogger } from '../src/utils/powershellLogger';

type NavigationProp = NativeStackNavigationProp<ScanStackParamList>;

export default function ScanScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const { addScan } = useScanStore();
  const { subscriptionInfo } = useSubscriptionStore();
  const { isOffline, isOnline, canUseOfflineMode, isOfflineModeEnabled } = useNetworkStatus();
  const isPremium = isPremiumFeatureEnabled(PremiumFeature.OFFLINE_MODE, subscriptionInfo);

  // Camera lifecycle - hook handles ALL state management
  const cameraLifecycle = useCameraLifecycle(permission?.granted ?? false, {
    autoActivate: true,
    onReady: () => {
      console.log(`[ScanScreen] Camera ready on ${Platform.OS}`);
    },
    onError: (error) => {
      console.error('[ScanScreen] Camera error:', error);
    },
    onStateChange: (state, previousState) => {
      console.log(`[ScanScreen] Camera state: ${previousState} → ${state}`);
    },
  });

  // Handle screen focus - simple and clean
  useFocusEffect(
    useCallback(() => {
      // Reset scanner state
      setScanned(false);
      
      // Activate camera when screen is focused (if permission granted)
      if (permission?.granted) {
        cameraLifecycle.activate();
      }

      return () => {
        // Deactivate camera when screen loses focus
        cameraLifecycle.deactivate();
      };
    }, [permission?.granted, cameraLifecycle.activate, cameraLifecycle.deactivate])
  );

  // Request camera permission on mount
  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        if (!permission?.granted && permission?.canAskAgain) {
          console.log('[ScanScreen] Requesting camera permission...');
          const result = await requestPermission();
          console.log('[ScanScreen] Camera permission result:', result);
        }
      } catch (error: any) {
        console.error('[ScanScreen] Camera permission error:', error);
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
  }, [permission?.granted, requestPermission, t]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cameraLifecycle.reset();
    };
  }, [cameraLifecycle.reset]);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    // Prevent multiple scans
    if (scanned) {
      console.log('[ScanScreen] Ignoring duplicate scan');
      return;
    }
    
    try {
      console.log('[ScanScreen] Barcode scanned:', { type, data, platform: Platform.OS });
      
      setScanned(true);
      cameraLifecycle.deactivate(); // Pause camera after scan

      let barcode = data?.trim();
      
      // Validate input
      if (!barcode || typeof barcode !== 'string') {
        console.error('[ScanScreen] Invalid barcode data:', data);
        Alert.alert(
          t('scan.invalidBarcode') || 'Invalid Barcode',
          t('scan.invalidBarcodeMessage') || 'Please try scanning again.',
          [
            {
              text: 'OK',
              onPress: () => {
                setScanned(false);
                cameraLifecycle.activate();
              },
            },
          ]
        );
        return;
      }
      
      // Handle QR/DataMatrix codes - extract GTIN if present
      if (type === 'qr' || type === 'datamatrix') {
        const gtinMatch = barcode.match(/(?:gtin|ean|upc)[:\s]*(\d{8,14})/i) || barcode.match(/(\d{8,14})/);
        if (gtinMatch && gtinMatch[1]) {
          barcode = gtinMatch[1];
          console.log('[ScanScreen] Extracted GTIN from QR code:', barcode);
        } else {
          console.warn('[ScanScreen] QR code does not contain valid GTIN:', barcode);
          Alert.alert(
            t('scan.invalidBarcode') || 'Invalid Barcode',
            t('scan.qrNoGtin') || 'QR code does not contain a valid product barcode (GTIN).',
            [
              {
                text: 'OK',
                onPress: () => {
                  setScanned(false);
                  cameraLifecycle.activate();
                },
              },
            ]
          );
          return;
        }
      }

      // Validate barcode format
      if (!/^\d{8,14}$/.test(barcode)) {
        console.warn('[ScanScreen] Invalid barcode format:', barcode);
        Alert.alert(
          t('scan.invalidBarcode'),
          t('scan.invalidBarcodeMessage'),
          [
            {
              text: 'OK',
              onPress: () => {
                setScanned(false);
                cameraLifecycle.activate();
              },
            },
          ]
        );
        return;
      }

      // Log barcode scan initiation
      const scanTimestamp = Date.now();
      powershellLogger.scanInitiated(barcode, type, scanTimestamp);
      
      console.log('[ScanScreen] Valid barcode, adding to history:', barcode);

      // Add to history
      try {
        addScan({
          barcode,
          timestamp: Date.now(),
          productName: null,
        });
        console.log('[ScanScreen] Added to scan history');
      } catch (scanError) {
        console.error('[ScanScreen] Error adding to scan history:', scanError);
      }

      // Navigate to result screen
      console.log('[ScanScreen] Navigating to Result screen with barcode:', barcode);
      
      try {
        navigation.navigate('Result', { barcode });
        console.log('[ScanScreen] Navigation successful');
      } catch (navError) {
        console.error('[ScanScreen] Navigation error:', navError);
        setScanned(false);
        cameraLifecycle.activate();
        
        Alert.alert(
          'Navigation Error',
          'Failed to navigate to product page. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[ScanScreen] Fatal error in handleBarCodeScanned:', error);
      setScanned(false);
      cameraLifecycle.activate();
      
      Alert.alert(
        'Scan Error',
        'An error occurred while processing the scan. Please try again.',
        [{ text: 'OK' }]
      );
    }
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
    
    addScan({
      barcode: trimmedBarcode,
      timestamp: Date.now(),
      productName: null,
    });

    navigation.navigate('Result', { barcode: trimmedBarcode });
  };

  const handleManualEntryCancel = () => {
    setShowManualEntry(false);
    setManualBarcode('');
  };

  // Loading state
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

  // Permission denied state
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

  // Main camera view
  return (
    <View style={styles.container}>
      {/* Camera View - Render when ready or active, show placeholder for error */}
      {permission?.granted && (
        <>
          {cameraLifecycle.state !== 'error' && (cameraLifecycle.state === 'ready' || cameraLifecycle.state === 'active') ? (
            <CameraView
              key={cameraLifecycle.cameraKey}
              style={styles.camera}
              facing="back"
              enableTorch={false}
              barcodeScannerSettings={{
                barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr', 'datamatrix'],
              }}
              onBarcodeScanned={scanned || cameraLifecycle.state !== 'active' ? undefined : handleBarCodeScanned}
              onCameraReady={cameraLifecycle.handleCameraReady}
              onMountError={(error) => {
                // Enhanced error handling for iOS camera issues
                console.error('[ScanScreen] Camera mount error:', error);
                try {
                  const errorObj = error instanceof Error 
                    ? error 
                    : new Error(error?.message || String(error) || 'Camera mount error');
                  cameraLifecycle.handleCameraError(errorObj);
                  
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
                          try {
                            Linking.openSettings?.();
                          } catch (linkError) {
                            console.error('[ScanScreen] Error opening settings:', linkError);
                          }
                        },
                      },
                      {
                        text: t('common.retry') || 'Retry',
                        onPress: () => {
                          try {
                            cameraLifecycle.remount();
                          } catch (remountError) {
                            console.error('[ScanScreen] Error remounting camera:', remountError);
                          }
                        },
                      },
                      {
                        text: t('common.cancel') || 'Cancel',
                        style: 'cancel',
                      },
                    ]
                  );
                } catch (alertError) {
                  // Fallback if alert fails
                  console.error('[ScanScreen] Error showing camera error alert:', alertError);
                }
              }}
            />
          ) : (
            <View style={[styles.camera, styles.cameraPlaceholder, { backgroundColor: '#000' }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.cameraPlaceholderText, { color: colors.textSecondary }]}>
                {cameraLifecycle.state === 'error' 
                  ? (t('scan.cameraError') || 'Camera Error')
                  : (t('scan.initializingCamera') || 'Initializing camera...')}
              </Text>
              {cameraLifecycle.state === 'error' && (
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: colors.primary, marginTop: 16 }]}
                  onPress={() => {
                    console.log('[ScanScreen] Retry camera button pressed');
                    setScanned(false);
                    cameraLifecycle.remount();
                  }}
                >
                  <Text style={styles.retryButtonText}>{t('scan.retryCamera') || 'Retry Camera'}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {/* Scanner Overlay */}
          <View style={styles.overlay}>
            {/* Top Bar */}
            <View style={styles.topBar}>
              <Text style={styles.appTitle}>TrueScan</Text>
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
