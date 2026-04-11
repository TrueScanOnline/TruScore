// Main product data hook
// Fetches product data and provides it to cards

import { useState, useEffect } from 'react';
import { ProductWithTrustScore } from '../../../types/product';
import { fetchProduct, refreshProduct } from '../../../services/productService';
import { calculateTruScore, TruScoreResult } from '../../../lib/truscoreEngine';
import { useValuesStore } from '../../../store/useValuesStore';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { getPlanetScoringContext } from '../../../utils/planetScoringContext';
import { logger } from '../../../utils/logger';
import { getManualProduct, isManualProduct } from '../../../services/manualProductService';

interface UseProductDataOptions {
  barcode: string;
  useCache?: boolean;
  isPremium?: boolean;
  isOffline?: boolean;
}

export function useProductData({
  barcode,
  useCache = true,
  isPremium = false,
  isOffline = false,
}: UseProductDataOptions) {
  const [product, setProduct] = useState<ProductWithTrustScore | null>(null);
  const [truScore, setTruScore] = useState<TruScoreResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const valuesPreferences = useValuesStore();
  const planetPackagingMarket = useSettingsStore((s) => s.planetPackagingMarket);

  const loadProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check if manual product first
      const manualProduct = await getManualProduct(barcode);
      if (manualProduct) {
        setProduct(manualProduct);
        const calculated = calculateTruScore(manualProduct, valuesPreferences, getPlanetScoringContext());
        setTruScore(calculated);
        setLoading(false);
        return;
      }

      // Fetch from APIs
      const productData = await fetchProduct(barcode, useCache, isPremium, isOffline);
      if (productData) {
        setProduct(productData);
        const calculated = calculateTruScore(productData, valuesPreferences, getPlanetScoringContext());
        setTruScore(calculated);
      } else {
        setError(new Error('Product not found'));
      }
    } catch (err) {
      logger.error('Error loading product:', err);
      setError(err instanceof Error ? err : new Error('Failed to load product'));
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const productData = await refreshProduct(barcode);
      if (productData) {
        setProduct(productData);
        const calculated = calculateTruScore(productData, valuesPreferences, getPlanetScoringContext());
        setTruScore(calculated);
      }
    } catch (err) {
      logger.error('Error refreshing product:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh product'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [barcode, useCache, isPremium, isOffline]);

  // Recalculate TruScore when values preferences change
  useEffect(() => {
    if (product) {
      const calculated = calculateTruScore(product, valuesPreferences, getPlanetScoringContext());
      setTruScore(calculated);
    }
  }, [valuesPreferences, product, planetPackagingMarket]);

  return {
    product,
    truScore,
    loading,
    error,
    refresh,
    reload: loadProduct,
  };
}


