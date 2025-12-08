// Hook for TruScore card data
// Supports props-first with fallback fetching

import { useState, useEffect } from 'react';
import { ProductWithTrustScore } from '../../../../../types/product';
import { calculateTruScore, TruScoreResult } from '../../../../../lib/truscoreEngine';
import { fetchProduct } from '../../../../../services/productService';
import { useValuesStore } from '../../../../../store/useValuesStore';
import { logger } from '../../../../../utils/logger';

interface UseTruScoreDataOptions {
  barcode: string;
  product?: ProductWithTrustScore; // Props-first: prefer provided product
  autoFetch?: boolean; // Fallback: fetch if product not provided
}

export function useTruScoreData({ barcode, product, autoFetch = true }: UseTruScoreDataOptions) {
  const [truScore, setTruScore] = useState<TruScoreResult | null>(null);
  const [loading, setLoading] = useState(!product);
  const [error, setError] = useState<Error | null>(null);
  const valuesPreferences = useValuesStore();

  useEffect(() => {
    // Props-first: Use provided product if available
    if (product) {
      try {
        const calculated = calculateTruScore(product, valuesPreferences);
        setTruScore(calculated);
        setLoading(false);
        setError(null);
      } catch (err) {
        logger.error('Error calculating TruScore from product:', err);
        setError(err instanceof Error ? err : new Error('Failed to calculate TruScore'));
        setLoading(false);
      }
      return;
    }

    // Fallback: Fetch product if not provided
    if (autoFetch) {
      setLoading(true);
      fetchProduct(barcode)
        .then((fetchedProduct) => {
          if (fetchedProduct) {
            const calculated = calculateTruScore(fetchedProduct, valuesPreferences);
            setTruScore(calculated);
            setError(null);
          } else {
            setError(new Error('Product not found'));
          }
        })
        .catch((err) => {
          logger.error('Error fetching product for TruScore:', err);
          setError(err instanceof Error ? err : new Error('Failed to fetch product'));
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [barcode, product, autoFetch, valuesPreferences]);

  return { truScore, loading, error };
}


