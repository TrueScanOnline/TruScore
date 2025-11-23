// Manual Product Entry Modal
// Allows users to manually add product information when product is not found

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { saveManualProduct, ManualProductData } from '../services/manualProductService';
import CameraCaptureModal from './CameraCaptureModal';

interface ManualProductEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (product: ManualProductData) => void;
  barcode: string;
}

export default function ManualProductEntryModal({
  visible,
  onClose,
  onSave,
  barcode,
}: ManualProductEntryModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);

  // Form fields
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [quantity, setQuantity] = useState('');
  const [manufacturingCountry, setManufacturingCountry] = useState('');
  const [categories, setCategories] = useState('');
  const [additives, setAdditives] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Nutrition fields (basic)
  const [energy, setEnergy] = useState('');
  const [fat, setFat] = useState('');
  const [saturatedFat, setSaturatedFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [sugars, setSugars] = useState('');
  const [fiber, setFiber] = useState('');
  const [protein, setProtein] = useState('');
  const [salt, setSalt] = useState('');

  const handleImageCapture = async (uri: string) => {
    setImageUri(uri);
    setCameraModalVisible(false);
  };

  const handlePickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('camera.permissionRequired') || 'Permission Required',
        t('camera.galleryPermissionMessage') || 'Please grant permission to access your photo library'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // Copy image to cache directory
        const { getCachePath } = await import('../utils/fileSystemHelper');
        const imageDir = getCachePath('truescan/');
        await FileSystem.makeDirectoryAsync(imageDir, { intermediates: true });
        const imagePath = `${imageDir}${barcode}_${Date.now()}.jpg`;
        
        await FileSystem.copyAsync({
          from: result.assets[0].uri,
          to: imagePath,
        });
        
        setImageUri(imagePath);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!productName.trim()) {
      Alert.alert(
        'Validation Error',
        'Product name is required'
      );
      return;
    }

    setLoading(true);
    try {
      // Build nutriments object if nutrition data provided
      const nutriments: Record<string, number> = {};
      if (energy) nutriments.energy = parseFloat(energy) || 0;
      if (fat) nutriments.fat = parseFloat(fat) || 0;
      if (saturatedFat) nutriments['saturated-fat'] = parseFloat(saturatedFat) || 0;
      if (carbs) nutriments.carbohydrates = parseFloat(carbs) || 0;
      if (sugars) nutriments.sugars = parseFloat(sugars) || 0;
      if (fiber) nutriments.fiber = parseFloat(fiber) || 0;
      if (protein) nutriments.proteins = parseFloat(protein) || 0;
      if (salt) nutriments.salt = parseFloat(salt) || 0;

      // Parse additives string into array format (e.g., "E509, E412" -> ["en:e509", "en:e412"])
      const additivesTags: string[] = [];
      if (additives.trim()) {
        additives.trim()
          .split(',')
          .map(code => code.trim().toLowerCase())
          .filter(code => code.length > 0)
          .forEach(code => {
            // Normalize format: "e509" or "E509" -> "en:e509"
            const normalizedCode = code.startsWith('e') ? `en:${code}` : code;
            if (!additivesTags.includes(normalizedCode)) {
              additivesTags.push(normalizedCode);
            }
          });
      }

      const productData: ManualProductData = {
        barcode,
        product_name: productName.trim(),
        brands: brand.trim() || undefined,
        ingredients_text: ingredients.trim() || undefined,
        image_url: imageUri || undefined,
        nutriments: Object.keys(nutriments).length > 0 ? nutriments : undefined,
        serving_size: servingSize.trim() || undefined,
        quantity: quantity.trim() || undefined,
        manufacturing_places: manufacturingCountry.trim() || undefined,
        countries: manufacturingCountry.trim() || undefined,
        categories: categories.trim() || undefined,
        additives_tags: additivesTags.length > 0 ? additivesTags : undefined,
        timestamp: Date.now(),
      };

      const success = await saveManualProduct(productData);
      
      if (success) {
        onSave(productData);
        Alert.alert(
          'Success',
          'Product information saved successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                handleClose();
              },
            },
          ]
        );
      } else {
        throw new Error('Failed to save product');
      }
    } catch (error) {
      console.error('Error saving manual product:', error);
      Alert.alert(
        'Error',
        'Failed to save product information. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setProductName('');
    setBrand('');
    setIngredients('');
    setServingSize('');
    setQuantity('');
    setManufacturingCountry('');
    setCategories('');
    setImageUri(null);
    setEnergy('');
    setFat('');
    setSaturatedFat('');
    setCarbs('');
    setSugars('');
    setFiber('');
    setProtein('');
    setSalt('');
    onClose();
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>
              Add Product Information
            </Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Barcode Display */}
            <View style={[styles.barcodeContainer, { backgroundColor: colors.surface }]}>
              <Ionicons name="barcode-outline" size={20} color={colors.primary} />
              <Text style={[styles.barcodeText, { color: colors.text }]}>
                Barcode: {barcode}
              </Text>
            </View>

            {/* Product Image */}
            <View style={styles.imageSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Product Image
              </Text>
              {imageUri ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="contain" />
                  <TouchableOpacity
                    style={[styles.removeImageButton, { backgroundColor: colors.error }]}
                    onPress={() => setImageUri(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imageButtons}>
                  <TouchableOpacity
                    style={[styles.imageButton, { backgroundColor: colors.primary }]}
                    onPress={() => setCameraModalVisible(true)}
                  >
                    <Ionicons name="camera" size={24} color="#fff" />
                    <Text style={styles.imageButtonText}>
                      Take Photo
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.imageButton, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
                    onPress={handlePickFromGallery}
                  >
                    <Ionicons name="images-outline" size={24} color={colors.primary} />
                    <Text style={[styles.imageButtonText, { color: colors.primary }]}>
                      Choose from Gallery
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Required Fields */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Required Information
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Product Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder="Enter product name"
                  placeholderTextColor={colors.textSecondary}
                  value={productName}
                  onChangeText={setProductName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Optional Basic Information */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Basic Information
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Brand
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder="Enter brand name"
                  placeholderTextColor={colors.textSecondary}
                  value={brand}
                  onChangeText={setBrand}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Ingredients
                </Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder="Enter ingredients (as listed on packaging)"
                  placeholderTextColor={colors.textSecondary}
                  value={ingredients}
                  onChangeText={setIngredients}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Additives and Preservatives
                </Text>
                <View style={[styles.helpContainer, { backgroundColor: colors.surface, padding: 12, borderRadius: 8, marginBottom: 8 }]}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.helpText, { color: colors.textSecondary, fontSize: 12, flex: 1 }]}>
                    Enter E-number codes (like E509, E412, E211) separated by commas. These codes appear in brackets on product packaging (e.g., "Calcium chloride (E509)"). Our database will provide detailed information about each additive.
                  </Text>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder="E509, E412, E211"
                  placeholderTextColor={colors.textSecondary}
                  value={additives}
                  onChangeText={setAdditives}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Quantity
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholder="e.g., 500g, 1L"
                    placeholderTextColor={colors.textSecondary}
                    value={quantity}
                    onChangeText={setQuantity}
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Serving Size
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholder="e.g., 100g"
                    placeholderTextColor={colors.textSecondary}
                    value={servingSize}
                    onChangeText={setServingSize}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Country of Manufacture
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder="Enter country name"
                  placeholderTextColor={colors.textSecondary}
                  value={manufacturingCountry}
                  onChangeText={setManufacturingCountry}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Categories
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder="e.g., Beverages, Snacks, Dairy"
                  placeholderTextColor={colors.textSecondary}
                  value={categories}
                  onChangeText={setCategories}
                />
              </View>
            </View>

            {/* Nutrition Facts (Optional) */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Nutrition Facts (Optional)
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Enter values per 100g or per serving as shown on packaging
              </Text>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Energy (kcal)
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholder="kcal"
                    placeholderTextColor={colors.textSecondary}
                    value={energy}
                    onChangeText={setEnergy}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Protein (g)
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholder="g"
                    placeholderTextColor={colors.textSecondary}
                    value={protein}
                    onChangeText={setProtein}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Fat (g)
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholder="g"
                    placeholderTextColor={colors.textSecondary}
                    value={fat}
                    onChangeText={setFat}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Saturated Fat (g)
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholder="g"
                    placeholderTextColor={colors.textSecondary}
                    value={saturatedFat}
                    onChangeText={setSaturatedFat}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Carbohydrates (g)
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholder="g"
                    placeholderTextColor={colors.textSecondary}
                    value={carbs}
                    onChangeText={setCarbs}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Sugars (g)
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholder="g"
                    placeholderTextColor={colors.textSecondary}
                    value={sugars}
                    onChangeText={setSugars}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Fiber (g)
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholder="g"
                    placeholderTextColor={colors.textSecondary}
                    value={fiber}
                    onChangeText={setFiber}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    Salt (g)
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    placeholder="g"
                    placeholderTextColor={colors.textSecondary}
                    value={salt}
                    onChangeText={setSalt}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Help Text */}
            <View style={[styles.helpContainer, { backgroundColor: colors.surface }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                You can fill in as much or as little information as available on the product packaging. At minimum, please provide the product name.
              </Text>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={loading || !productName.trim()}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>
                    Save Product
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        visible={cameraModalVisible}
        onClose={() => setCameraModalVisible(false)}
        onCapture={handleImageCapture}
        barcode={barcode}
      />
    </>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  barcodeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  required: {
    color: '#ff6b6b',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  imageSection: {
    marginBottom: 24,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 20,
    padding: 4,
  },
  helpContainer: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  helpText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


