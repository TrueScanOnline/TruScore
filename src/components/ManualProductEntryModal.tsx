// Manual Product Entry Modal
// Allows users to manually add product information when product is not found

import React, { useState, useEffect } from 'react';
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
import * as FileSystem from 'expo-file-system';
import { saveManualProduct } from '../services/manualProductService';
import { ManualProductData } from '../types/manualProduct';
import CameraCaptureModal from './CameraCaptureModal';
import { parseAllergensAndAdditives } from '../utils/manualProductParsing';
import CountryPicker from './CountryPicker';
import CertificationMultiPicker from './CertificationMultiPicker';
import { findCountryByName, Country } from '../utils/countries';
import { getTruscoreCertificationPickerTags } from '../services/ethicsCertificationsService';
import { Product } from '../types/product';
import { extractProductDataFromPhoto, verifyOCRData } from '../services/photoOcrService';
import { logger } from '../utils/logger';
import { useSettingsStore } from '../store/useSettingsStore';
import {
  parseWeightNutrientInputToGramsPer100g,
  prefillManualNutritionFromProduct,
} from '../utils/manualEditNutritionPrefill';

interface ManualProductEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (product: ManualProductData) => void;
  barcode: string;
  initialProduct?: Product | null; // For edit mode - pre-fill with existing product data
  editMode?: boolean; // If true, allows editing existing products (product_name optional)
}

export default function ManualProductEntryModal({
  visible,
  onClose,
  onSave,
  barcode,
  initialProduct,
  editMode = false,
}: ManualProductEntryModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const units = useSettingsStore((s) => s.units);
  const [loading, setLoading] = useState(false);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);

  // Form fields
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [quantity, setQuantity] = useState('');
  const [selectedManufacturingCountry, setSelectedManufacturingCountry] = useState<Country | null>(null);
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

  // Allergens & Additives
  const [allergensAdditives, setAllergensAdditives] = useState('');

  // Certifications: OFF tags aligned with TruScore ethics picker
  const [selectedCertificationTags, setSelectedCertificationTags] = useState<string[]>([]);

  // Pre-fill form fields when editing existing product
  useEffect(() => {
    if (visible && initialProduct && editMode) {
      setProductName(initialProduct.product_name || '');
      setBrand(initialProduct.brands || '');
      setIngredients(
        initialProduct.ingredients_text ||
          initialProduct.ingredients_text_en ||
          ''
      );
      setServingSize(initialProduct.serving_size || '');
      setQuantity(initialProduct.quantity || '');
      const countryRaw = (initialProduct.manufacturing_places || initialProduct.countries || '').trim();
      setSelectedManufacturingCountry(countryRaw ? findCountryByName(countryRaw) ?? null : null);
      setImageUri(initialProduct.image_url || initialProduct.image_front_url || null);

      // Nutrition: same per-100g resolution and rounding as NutritionTable (respects metric/imperial)
      const preNut = prefillManualNutritionFromProduct(initialProduct, units);
      setEnergy(preNut.energy);
      setFat(preNut.fat);
      setSaturatedFat(preNut.saturatedFat);
      setCarbs(preNut.carbs);
      setSugars(preNut.sugars);
      setFiber(preNut.fiber);
      setProtein(preNut.protein);
      setSalt(preNut.salt);
      
      // Pre-fill allergens/additives (convert tags back to text for editing)
      const allergenText = initialProduct.allergens_tags?.map(tag => 
        tag.replace(/^en:/, '').replace(/-/g, ' ')
      ).join(', ') || '';
      const additiveText = initialProduct.additives_tags?.map(tag => 
        tag.replace(/^en:/, '').toUpperCase()
      ).join(', ') || '';
      const allergensAdditivesText = [allergenText, additiveText]
        .filter(t => t.length > 0)
        .join(', ');
      setAllergensAdditives(allergensAdditivesText);
      
      const pickerAllow = new Set(getTruscoreCertificationPickerTags());
      const labelParts: string[] = [];
      if (Array.isArray(initialProduct.labels_tags)) {
        labelParts.push(...initialProduct.labels_tags);
      }
      if (Array.isArray(initialProduct.labels_hierarchy)) {
        labelParts.push(...initialProduct.labels_hierarchy);
      }
      if (Array.isArray(initialProduct.certifications)) {
        for (const c of initialProduct.certifications) {
          const tag = (c.tag || c.id || '').trim();
          if (tag) labelParts.push(tag);
        }
      }
      const normalizedCerts = [...new Set(labelParts.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].filter(
        (tag) => pickerAllow.has(tag)
      );
      setSelectedCertificationTags(normalizedCerts.sort());
    } else if (visible && !editMode) {
      // Reset form when opening in add mode
      setProductName('');
      setBrand('');
      setIngredients('');
      setServingSize('');
      setQuantity('');
      setSelectedManufacturingCountry(null);
      setImageUri(null);
      setEnergy('');
      setFat('');
      setSaturatedFat('');
      setCarbs('');
      setSugars('');
      setFiber('');
      setProtein('');
      setSalt('');
      setAllergensAdditives('');
      setSelectedCertificationTags([]);
    }
  }, [visible, initialProduct, editMode, units]);

  const handleImageCapture = async (uri: string) => {
    setImageUri(uri);
    setCameraModalVisible(false);
    
    // NEW: Extract product data from photo using OCR (like Yuka)
    try {
      setLoading(true);
      const extractedData = await extractProductDataFromPhoto(uri, barcode);
      
      // Auto-fill form fields with extracted data
      if (extractedData.product_name) {
        setProductName(extractedData.product_name);
      }
      if (extractedData.ingredients_text) {
        setIngredients(extractedData.ingredients_text);
      }
      if (extractedData.brands) {
        setBrand(extractedData.brands);
      }
      if (extractedData.nutriments) {
        if (extractedData.nutriments['energy-kcal']) {
          setEnergy(extractedData.nutriments['energy-kcal'].toString());
        }
        if (extractedData.nutriments.proteins_100g) {
          setProtein(extractedData.nutriments.proteins_100g.toString());
        }
        if (extractedData.nutriments.fat_100g) {
          setFat(extractedData.nutriments.fat_100g.toString());
        }
        if (extractedData.nutriments.carbohydrates_100g) {
          setCarbs(extractedData.nutriments.carbohydrates_100g.toString());
        }
        if (extractedData.nutriments.sugars_100g) {
          setSugars(extractedData.nutriments.sugars_100g.toString());
        }
        if (extractedData.nutriments.salt_100g) {
          setSalt(extractedData.nutriments.salt_100g.toString());
        }
        if (extractedData.nutriments.fiber_100g) {
          setFiber(extractedData.nutriments.fiber_100g.toString());
        }
        if (extractedData.nutriments['saturated-fat_100g']) {
          setSaturatedFat(extractedData.nutriments['saturated-fat_100g'].toString());
        }
      }
      
      // Show success message
      Alert.alert(
        t('product.ocrSuccess') || 'Data Extracted',
        t('product.ocrSuccessMessage') || 'Product information extracted from photo. Please review and edit if needed.',
        [{ text: t('common.ok') || 'OK' }]
      );
    } catch (error) {
      logger.warn('[ManualProductEntry] OCR extraction failed (non-critical):', error);
      // Continue - user can manually enter data
    } finally {
      setLoading(false);
    }
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
        const imageDir = `${FileSystem.cacheDirectory}truescan/`;
        await FileSystem.makeDirectoryAsync(imageDir, { intermediates: true });
        const imagePath = `${imageDir}${barcode}_${Date.now()}.jpg`;
        
        await FileSystem.copyAsync({
          from: result.assets[0].uri,
          to: imagePath,
        });
        
        setImageUri(imagePath);
        
        // NEW: Extract product data from photo using OCR (like Yuka)
        try {
          setLoading(true);
          const extractedData = await extractProductDataFromPhoto(imagePath, barcode);
          
          // Auto-fill form fields with extracted data
          if (extractedData.product_name) {
            setProductName(extractedData.product_name);
          }
          if (extractedData.ingredients_text) {
            setIngredients(extractedData.ingredients_text);
          }
          if (extractedData.brands) {
            setBrand(extractedData.brands);
          }
          if (extractedData.nutriments) {
            if (extractedData.nutriments['energy-kcal']) {
              setEnergy(extractedData.nutriments['energy-kcal'].toString());
            }
            if (extractedData.nutriments.proteins_100g) {
              setProtein(extractedData.nutriments.proteins_100g.toString());
            }
            if (extractedData.nutriments.fat_100g) {
              setFat(extractedData.nutriments.fat_100g.toString());
            }
            if (extractedData.nutriments.carbohydrates_100g) {
              setCarbs(extractedData.nutriments.carbohydrates_100g.toString());
            }
            if (extractedData.nutriments.sugars_100g) {
              setSugars(extractedData.nutriments.sugars_100g.toString());
            }
            if (extractedData.nutriments.salt_100g) {
              setSalt(extractedData.nutriments.salt_100g.toString());
            }
            if (extractedData.nutriments.fiber_100g) {
              setFiber(extractedData.nutriments.fiber_100g.toString());
            }
            if (extractedData.nutriments['saturated-fat_100g']) {
              setSaturatedFat(extractedData.nutriments['saturated-fat_100g'].toString());
            }
          }
          
          // Show success message
          Alert.alert(
            t('product.ocrSuccess') || 'Data Extracted',
            t('product.ocrSuccessMessage') || 'Product information extracted from photo. Please review and edit if needed.',
            [{ text: t('common.ok') || 'OK' }]
          );
        } catch (error) {
          logger.warn('[ManualProductEntry] OCR extraction failed (non-critical):', error);
          // Continue - user can manually enter data
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      logger.error('Error picking image:', error);
      Alert.alert(t('common.error') || 'Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    // ===== USER CONTRIBUTION FLOW: UI TRIGGER =====
    logger.debug(`[ManualProductEntryModal] 🎯 SAVE BUTTON CLICKED for barcode: ${barcode}`);
    logger.debug(`[ManualProductEntryModal] Form data:`, {
      barcode,
      productName: productName.trim(),
      hasPhoto: !!imageUri,
      photoPath: imageUri || 'NONE',
      hasIngredients: !!ingredients.trim(),
      hasNutrition: [energy, fat, carbs, protein].some((v) => !!String(v || '').trim()),
    });
    
    // Validate required fields (product name only required in add mode, not edit mode)
    if (!editMode && !productName.trim()) {
      logger.warn(`[ManualProductEntryModal] ❌ Validation failed: Product name required`);
      Alert.alert(
        t('manualProduct.validationError') || 'Validation Error',
        t('manualProduct.productNameRequired') || 'Product name is required'
      );
      return;
    }

    setLoading(true);
    logger.debug(`[ManualProductEntryModal] ✅ Validation passed, calling saveManualProduct...`);
    try {
      // Build nutriments (per 100g mirrors so NutritionTable shows community values)
      const nutriments: Record<string, number> = {};
      const toG = (raw: string) => parseWeightNutrientInputToGramsPer100g(raw, units);
      if (energy.trim()) {
        const v = parseFloat(energy.trim().replace(',', '.'));
        if (!Number.isNaN(v)) {
          nutriments['energy-kcal'] = v;
          nutriments['energy-kcal_100g'] = v;
        }
      }
      if (fat.trim()) {
        const v = toG(fat);
        if (v !== undefined) {
          nutriments.fat = v;
          nutriments.fat_100g = v;
        }
      }
      if (saturatedFat.trim()) {
        const v = toG(saturatedFat);
        if (v !== undefined) {
          nutriments['saturated-fat'] = v;
          nutriments['saturated-fat_100g'] = v;
        }
      }
      if (carbs.trim()) {
        const v = toG(carbs);
        if (v !== undefined) {
          nutriments.carbohydrates = v;
          nutriments.carbohydrates_100g = v;
        }
      }
      if (sugars.trim()) {
        const v = toG(sugars);
        if (v !== undefined) {
          nutriments.sugars = v;
          nutriments.sugars_100g = v;
        }
      }
      if (fiber.trim()) {
        const v = toG(fiber);
        if (v !== undefined) {
          nutriments.fiber = v;
          nutriments.fiber_100g = v;
        }
      }
      if (protein.trim()) {
        const v = toG(protein);
        if (v !== undefined) {
          nutriments.proteins = v;
          nutriments.proteins_100g = v;
        }
      }
      if (salt.trim()) {
        const v = toG(salt);
        if (v !== undefined) {
          nutriments.salt = v;
          nutriments.salt_100g = v;
        }
      }

      // Parse allergens/additives text into structured tags
      const { allergens_tags, additives_tags } = parseAllergensAndAdditives(allergensAdditives);
      const labels_tags = [...selectedCertificationTags];
      const labels_hierarchy = [...selectedCertificationTags];
      const countryName = selectedManufacturingCountry?.name?.trim() || '';

      // Use product name from initialProduct if editing and no name provided
      const finalProductName = editMode && !productName.trim() && initialProduct?.product_name
        ? initialProduct.product_name
        : productName.trim();
      
      const productData: ManualProductData = {
        barcode,
        product_name: finalProductName || (initialProduct?.product_name || 'Unknown Product'),
        brands: brand.trim() || undefined,
        ingredients_text: ingredients.trim() || undefined,
        image_url: imageUri || undefined,
        nutriments: Object.keys(nutriments).length > 0 ? nutriments : undefined,
        serving_size: servingSize.trim() || undefined,
        quantity: quantity.trim() || undefined,
        manufacturing_places: countryName || undefined,
        countries: countryName || undefined,
        allergens_tags: allergens_tags.length > 0 ? allergens_tags : undefined,
        additives_tags: additives_tags.length > 0 ? additives_tags : undefined,
        labels_tags: labels_tags.length > 0 ? labels_tags : undefined,
        labels_hierarchy: labels_hierarchy.length > 0 ? labels_hierarchy : undefined,
        timestamp: Date.now(),
      };

      logger.debug(`[ManualProductEntryModal] 📦 Calling saveManualProduct with data:`, {
        barcode: productData.barcode,
        product_name: productData.product_name,
        hasPhoto: !!productData.image_url,
        photoPath: productData.image_url || 'NONE',
        hasIngredients: !!productData.ingredients_text,
        hasNutrition: !!productData.nutriments,
      });
      
      const success = await saveManualProduct(productData);
      
      logger.debug(`[ManualProductEntryModal] 📦 saveManualProduct returned: ${success}`);
      
      if (success) {
        onSave(productData);
        Alert.alert(
          t('manualProduct.success') || 'Success',
          t('manualProduct.savedSuccessfully') || 'Product information saved successfully!',
          [
            {
              text: t('common.ok') || 'OK',
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
      logger.error('Error saving manual product:', error);
      Alert.alert(
        t('common.error') || 'Error',
        t('manualProduct.saveError') || 'Failed to save product information. Please try again.'
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
    setSelectedManufacturingCountry(null);
    setImageUri(null);
    setEnergy('');
    setFat('');
    setSaturatedFat('');
    setCarbs('');
    setSugars('');
    setFiber('');
    setProtein('');
    setSalt('');
    setAllergensAdditives('');
    setSelectedCertificationTags([]);
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
              {editMode
                ? t('manualProduct.manualEditPageTitle')
                : t('manualProduct.title')}
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
                {t('manualProduct.barcode') || 'Barcode'}: {barcode}
              </Text>
            </View>

            {/* Product Image */}
            <View style={styles.imageSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('manualProduct.productImage') || 'Product Image'}
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
                      {t('manualProduct.takePhoto') || 'Take Photo'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.imageButton, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
                    onPress={handlePickFromGallery}
                  >
                    <Ionicons name="images-outline" size={24} color={colors.primary} />
                    <Text style={[styles.imageButtonText, { color: colors.primary }]}>
                      {t('manualProduct.chooseFromGallery') || 'Choose from Gallery'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Required Fields */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('manualProduct.requiredInformation') || 'Required Information'}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t('manualProduct.productName') || 'Product Name'} 
                  {!editMode && <Text style={styles.required}> *</Text>}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder={t('manualProduct.productNamePlaceholder') || 'Enter product name'}
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
                {t('manualProduct.basicInformation') || 'Basic Information'}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t('manualProduct.brand') || 'Brand'}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder={t('manualProduct.brandPlaceholder') || 'Enter brand name'}
                  placeholderTextColor={colors.textSecondary}
                  value={brand}
                  onChangeText={setBrand}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t('manualProduct.ingredients') || 'Ingredients'}
                </Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder={t('manualProduct.ingredientsPlaceholder') || 'Enter ingredients (as listed on packaging)'}
                  placeholderTextColor={colors.textSecondary}
                  value={ingredients}
                  onChangeText={setIngredients}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {t('manualProduct.quantity') || 'Quantity'}
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
                    {t('manualProduct.servingSize') || 'Serving Size'}
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
                  {t('manualProduct.manufacturingCountry') || 'Country of Manufacture'}
                </Text>
                <CountryPicker
                  selectedCountry={selectedManufacturingCountry}
                  onSelect={setSelectedManufacturingCountry}
                  placeholder={t('manualProduct.manufacturingCountryPlaceholder')}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t('manualProduct.certificationsLabels') || 'Certifications'}
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, marginBottom: 6 }]}>
                  {t('manualProduct.certificationsLabelsNote')}
                </Text>
                <CertificationMultiPicker
                  selectedTags={selectedCertificationTags}
                  onChange={setSelectedCertificationTags}
                />
              </View>
            </View>

            {/* Nutrition Facts (Optional) */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('manualProduct.nutritionFacts') || 'Nutrition Facts (Optional)'}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                {t('manualProduct.nutritionFactsNote') || 'Enter values per 100g or per serving as shown on packaging'}
              </Text>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {t('manualProduct.energy') || 'Energy (kcal)'}
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
                    {t('manualProduct.protein') || 'Protein (g)'}
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
                    {t('manualProduct.fat') || 'Fat (g)'}
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
                    {t('manualProduct.saturatedFat') || 'Saturated Fat (g)'}
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
                    {t('manualProduct.carbohydrates') || 'Carbohydrates (g)'}
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
                    {t('manualProduct.sugars') || 'Sugars (g)'}
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
                    {t('manualProduct.fiber') || 'Fiber (g)'}
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
                    {t('manualProduct.salt') || 'Salt (g)'}
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

            {/* Allergens & Additives */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('manualProduct.allergensAdditives') || 'Allergens & Additives (Optional)'}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                {t('manualProduct.allergensAdditivesNote') || 'Enter E-numbers (e.g., E260, E300) and allergens (e.g., Contains: Milk, Eggs) as listed on packaging'}
              </Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                placeholder={t('manualProduct.allergensAdditivesPlaceholder') || 'e.g., E260, E300, Contains: Milk, Eggs'}
                placeholderTextColor={colors.textSecondary}
                value={allergensAdditives}
                onChangeText={setAllergensAdditives}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Help Text */}
            <View style={[styles.helpContainer, { backgroundColor: colors.surface }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                {t('manualProduct.helpText') || 'You can fill in as much or as little information as available on the product packaging. At minimum, please provide the product name.'}
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
                {t('common.cancel') || 'Cancel'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={loading || (!editMode && !productName.trim())}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>
                    {t('manualProduct.save') || 'Save Product'}
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


