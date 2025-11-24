import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import * as FileSystem from 'expo-file-system/legacy';

interface CameraCaptureModalProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (imageUri: string) => void;
  barcode?: string;
}

export default function CameraCaptureModal({ visible, onClose, onCapture, barcode }: CameraCaptureModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('camera.permissionRequired'),
        t('camera.permissionMessage'),
        [{ text: t('common.ok') }]
      );
      return false;
    }
    return true;
  };

  const handleTakePicture = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert(t('camera.error'), t('camera.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  const handlePickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('camera.permissionRequired'),
        t('camera.galleryPermissionMessage'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('camera.error'), t('camera.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveImage = async () => {
    if (capturedImage) {
      setLoading(true);
      try {
        // Save image to cache directory
        const imageDir = `${FileSystem.cacheDirectory}truescan/`;
        await FileSystem.makeDirectoryAsync(imageDir, { intermediates: true });
        const imagePath = `${imageDir}${barcode || 'product'}_${Date.now()}.jpg`;
        
        // Copy image to cache
        await FileSystem.copyAsync({
          from: capturedImage,
          to: imagePath,
        });

        onCapture(imagePath);
        setCapturedImage(null);
        onClose();
      } catch (error) {
        console.error('Error saving image:', error);
        // Even if save fails, use the original URI
        onCapture(capturedImage);
        setCapturedImage(null);
        onClose();
      } finally {
        setLoading(false);
      }
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('camera.captureTitle')}</Text>
          <View style={styles.placeholder} />
        </View>

        {capturedImage ? (
          // Preview captured image
          <View style={styles.previewContainer}>
            <Image source={{ uri: capturedImage }} style={styles.previewImage} resizeMode="contain" />
            <View style={styles.previewButtons}>
              <TouchableOpacity
                style={[styles.button, styles.retakeButton, { backgroundColor: colors.surface }]}
                onPress={() => setCapturedImage(null)}
              >
                <Ionicons name="refresh" size={24} color={colors.text} />
                <Text style={[styles.buttonText, { color: colors.text }]}>{t('camera.retake')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveImage}
              >
                <Ionicons name="checkmark" size={24} color="#fff" />
                <Text style={styles.buttonText}>{t('camera.usePhoto')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Image picker options
          <View style={styles.pickerContainer}>
            <View style={styles.instructionsContainer}>
              <Ionicons name="camera-outline" size={64} color={colors.primary} />
              <Text style={[styles.instructionsTitle, { color: colors.text }]}>
                {t('camera.captureTitle')}
              </Text>
              <Text style={[styles.instructionsText, { color: colors.textSecondary }]}>
                {t('camera.captureInstructions')}
              </Text>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loading} />
            ) : (
              <View style={styles.pickerButtons}>
                <TouchableOpacity
                  style={[styles.pickerButton, { backgroundColor: colors.primary }]}
                  onPress={handleTakePicture}
                >
                  <Ionicons name="camera" size={32} color="#fff" />
                  <Text style={styles.pickerButtonText}>{t('camera.takePhoto')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pickerButton, { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.primary }]}
                  onPress={handlePickFromGallery}
                >
                  <Ionicons name="images-outline" size={32} color={colors.primary} />
                  <Text style={[styles.pickerButtonText, { color: colors.primary }]}>
                    {t('camera.chooseFromGallery')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  pickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  instructionsContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  instructionsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionsText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  loading: {
    marginVertical: 40,
  },
  pickerButtons: {
    width: '100%',
    gap: 16,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 12,
  },
  pickerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewImage: {
    width: '100%',
    height: '70%',
    borderRadius: 12,
  },
  previewButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  retakeButton: {
    borderWidth: 1,
  },
  saveButton: {},
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  permissionMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

