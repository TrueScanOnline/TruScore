// Web Search Pricing Modal
// Shows Google search results for product pricing (Android = Google, iOS = Safari)
// Displays search results in WebView with a return-to-app control

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import * as Location from 'expo-location';
import { logger } from '../utils/logger';
import { Product } from '../types/product';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GoogleSearchPricingModalProps {
  visible: boolean;
  onClose: () => void;
  productName: string;
  barcode?: string;
  product?: Product | null;
}

export default function GoogleSearchPricingModal({
  visible,
  onClose,
  productName,
  barcode,
  product,
}: GoogleSearchPricingModalProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [searchUrl, setSearchUrl] = useState<string>('');

  useEffect(() => {
    if (visible) {
      buildSearchUrl();
    }
  }, [visible, productName, product]);

  /**
   * Build comprehensive search query with product name, brand, size/weight
   */
  const buildSearchQuery = (): string => {
    const parts: string[] = [];

    // Add product name
    if (productName && !productName.startsWith('Product ')) {
      parts.push(productName);
    }

    // Add brand if available
    if (product?.brands && product.brands.trim().length > 0) {
      const brands = product.brands.split(',').map(b => b.trim()).filter(Boolean);
      if (brands.length > 0) {
        parts.push(brands[0]); // Use first brand
      }
    }

    // Add size/weight if available
    if (product?.quantity) {
      parts.push(product.quantity);
    } else if (product?.serving_size) {
      parts.push(product.serving_size);
    }

    // Add "price" and "buy" keywords for better results
    parts.push('price', 'buy');

    // Join all parts
    return parts.join(' ');
  };

  const buildSearchUrl = async () => {
    try {
      setLoading(true);
      
      // Get user location for better search results
      let locationContext = '';
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const position = await Location.getCurrentPositionAsync();
          const reverseGeocode = await Location.reverseGeocodeAsync({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          
          if (reverseGeocode && reverseGeocode.length > 0) {
            const address = reverseGeocode[0];
            const city = address.city || address.district || '';
            const region = address.region || '';
            const country = address.country || '';
            
            if (city) {
              locationContext = ` in ${city}`;
              if (region && region !== city) {
                locationContext += `, ${region}`;
              }
            } else if (country) {
              locationContext = ` in ${country}`;
            }
          }
        }
      } catch (error) {
        logger.debug('Error getting location for search', error);
        // Continue without location context
      }

      // Build comprehensive search query
      const searchQuery = buildSearchQuery();
      const queryWithLocation = locationContext 
        ? `${searchQuery}${locationContext}`
        : searchQuery;

      // Build Google Shopping search URL
      // tbm=shop = Google Shopping (shows prices)
      // tbs=vw:g = grid view with prices
      const encodedQuery = encodeURIComponent(queryWithLocation);
      const url = `https://www.google.com/search?tbm=shop&q=${encodedQuery}&tbs=vw:g&hl=en`;
      
      setSearchUrl(url);
      logger.info(`[WebSearch] Built search URL: ${url}`);
    } catch (error) {
      logger.error('Error building search URL', error);
      // Fallback to basic search
      const fallbackQuery = encodeURIComponent(`${productName} price buy`);
      setSearchUrl(`https://www.google.com/search?tbm=shop&q=${fallbackQuery}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewLoad = () => {
    setLoading(false);
  };

  const handleWebViewError = (error: any) => {
    logger.error('WebView error', error);
    setLoading(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Ionicons 
              name={Platform.OS === 'ios' ? 'globe' : 'search'} 
              size={24} 
              color={colors.primary} 
            />
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {Platform.OS === 'ios' ? 'Safari Search' : 'Google Search'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {productName}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: colors.border }]}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* WebView Container */}
        <View style={styles.webViewContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading search results...
              </Text>
            </View>
          )}
          
          {searchUrl ? (
            <WebView
              source={{ uri: searchUrl }}
              style={styles.webView}
              onLoad={handleWebViewLoad}
              onError={handleWebViewError}
              startInLoadingState={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              scalesPageToFit={true}
              userAgent={
                Platform.OS === 'ios'
                  ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
                  : 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
              }
            />
          ) : (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color={colors.textSecondary} />
              <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                Unable to load search results
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={buildSearchUrl}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Footer with Return Button */}
        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.returnButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.returnButtonText}>Return to Rveel Score</Text>
          </TouchableOpacity>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    borderTopWidth: 1,
  },
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  returnButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
