// Manual Product Entry Service
// Allows users to manually add product information when product is not found in database

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, ProductWithTrustScore, TrustScoreBreakdown } from '../types/product';
import { ManualProductData } from '../types/manualProduct';
import { cacheProduct } from './cacheService';
import { calculateTruScore } from '../lib/truscoreEngine';
import { getPlanetScoringContext } from '../utils/planetScoringContext';
import { logger } from '../utils/logger';
import { submitProductToOpenFoodFacts, hasOFFCredentials } from './openFoodFactsSubmission';
import { uploadProductPhoto } from './photoUploadService';
import { saveProductToSQLite } from './sqliteProductDatabase';
import { getUserCountryCode } from '../utils/countryDetection';
import { powershellLogger } from '../utils/powershellLogger';
import { buildVercelManualProductPayload } from '../utils/vercelProprietaryManualProduct';
import { getBackendUrl, BackendEndpoints } from '../config/backendConfig';
import { applyResolvedNutrientLevels } from '../utils/resolveNutrientLevels';

const STORAGE_KEY_PREFIX = '@truescan_manual_product_';
const MAX_MANUAL_PRODUCTS = 100; // Limit to prevent storage bloat

// Re-export for backward compatibility
export type { ManualProductData };

/**
 * Save a manually entered product
 */
export async function saveManualProduct(data: ManualProductData): Promise<boolean> {
  // ===== USER CONTRIBUTION FLOW: STEP 1 - USER A SUBMITTING DATA =====
  // CRITICAL: Log at the VERY START - before any try/catch - to catch all attempts
  logger.debug(`[ManualProductService] 🚀 saveManualProduct CALLED for barcode: ${data.barcode}`);
  logger.debug(`[ManualProductService] Input data:`, {
    barcode: data.barcode,
    product_name: data.product_name,
    hasPhoto: !!data.image_url,
    photoPath: data.image_url || 'NONE',
    hasIngredients: !!data.ingredients_text,
    hasNutrition: !!data.nutriments,
  });
  
  powershellLogger.section(`USER CONTRIBUTION: USER A SUBMITTING DATA - ${data.barcode}`);
  powershellLogger.log('INFO', 'USER_CONTRIBUTION', `User A starting contribution for barcode: ${data.barcode}`, {
    barcode: data.barcode,
    hasProductName: !!data.product_name,
    hasPhoto: !!data.image_url,
    hasIngredients: !!data.ingredients_text,
    hasNutrition: !!data.nutriments,
    timestamp: new Date().toISOString(),
  });
  
  try {
    const nutrimentsEntries = Object.entries(data.nutriments || {});
    const nutrimentsPreview = nutrimentsEntries.slice(0, 20).reduce<Record<string, unknown>>((acc, [k, v]) => {
      acc[k] = v;
      return acc;
    }, {});
    const offCredsConfigured = hasOFFCredentials();

    // Validate required fields (barcode always required, product_name can be optional for partial updates)
    if (!data.barcode) {
      powershellLogger.log('ERROR', 'USER_CONTRIBUTION', 'Barcode is required', { barcode: data.barcode });
      throw new Error('Barcode is required');
    }
    // Use 'Unknown Product' as fallback if product_name not provided
    const productName = data.product_name || 'Unknown Product';
    const countryCode = getUserCountryCode();

    powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Processing user contribution data`, {
      barcode: data.barcode,
      productName,
      hasPhoto: !!data.image_url,
      photoPath: data.image_url || 'NONE',
      hasIngredients: !!data.ingredients_text,
      hasNutrition: !!data.nutriments && Object.keys(data.nutriments).length > 0,
    });

    // Create Product object from manual data
    const product: Product = {
      barcode: data.barcode,
      product_name: productName,
      product_name_en: productName,
      brands: data.brands,
      ingredients_text: data.ingredients_text,
      image_url: data.image_url,
      nutriments: data.nutriments,
      serving_size: data.serving_size,
      quantity: data.quantity,
      manufacturing_places: data.manufacturing_places,
      countries: data.countries,
      categories: data.categories,
      allergens_tags: data.allergens_tags,
      additives_tags: data.additives_tags,
      packaging_data: data.packaging_data,
      source: 'user_contributed' as Product['source'],
      created_t: Math.floor(data.timestamp / 1000),
      last_modified_t: Math.floor(data.timestamp / 1000),
      completion: calculateCompletion(data),
      quality: calculateQuality(data),
    };

    applyResolvedNutrientLevels(product);

    // Calculate Trust Score if we have enough data
    let productWithScore: ProductWithTrustScore;
    try {
      const trustScoreResult = calculateTruScore(product, undefined, getPlanetScoringContext());
      // Map TruScoreResult to TrustScoreBreakdown format
      const breakdown: TrustScoreBreakdown = {
        body: trustScoreResult.breakdown.Body || 0,
        planet: trustScoreResult.breakdown.Planet || 0,
        ethics: trustScoreResult.breakdown.Ethics || 0,
        open: trustScoreResult.breakdown.Open || 0,
        reasons: [],
      };
      
      productWithScore = {
        ...product,
        trust_score: trustScoreResult.truscore,
        trust_score_breakdown: breakdown,
        _truscore_metadata: {
          hasNutriScore: trustScoreResult.hasNutriScore,
          hasEcoScore: trustScoreResult.hasEcoScore,
          hasOrigin: trustScoreResult.hasOrigin,
        },
      };
    } catch (error) {
      logger.error('[ManualProductService] Error calculating trust score', error);
      // If trust score calculation fails, use product without score
      productWithScore = {
        ...product,
        trust_score: null,
        trust_score_breakdown: null,
      };
    }

    (productWithScore as any)._source = 'LOCAL';

    // ===== CRITICAL: SAVE LOCALLY FIRST - This ensures data is available even if backend fails =====
    logger.debug(`[ManualProductService] 💾 Starting LOCAL SAVE for barcode: ${data.barcode}`);
    
    // Save to cache (so it appears in app immediately)
    try {
      await cacheProduct(productWithScore, false); // false = not premium
      logger.debug(`[ManualProductService] ✅ Saved to cache: ${data.barcode}`);
    } catch (cacheError) {
      logger.error(`[ManualProductService] ❌ Cache save failed:`, cacheError);
      logger.warn('[ManualProductService] Failed to save to cache (non-critical):', cacheError);
    }

    // CRITICAL: Save to SQLite database for persistent storage across app restarts
    // This ensures user-contributed data is available for all future scans
    try {
      await saveProductToSQLite(productWithScore, countryCode ?? undefined);
      logger.debug(`[ManualProductService] ✅ Saved to SQLite: ${data.barcode}`);
      logger.info(`[ManualProductService] ✅ Saved user-contributed product to SQLite: ${data.barcode}`);
    } catch (sqliteError) {
      logger.error(`[ManualProductService] ❌ SQLite save failed:`, sqliteError);
      logger.warn('[ManualProductService] Failed to save to SQLite (non-critical):', sqliteError);
      // Continue - cache and AsyncStorage still work
    }

    // Also save to manual products storage (for management)
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${data.barcode}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify({
        ...data,
        product: productWithScore,
      }));
      logger.debug(`[ManualProductService] ✅ Saved to AsyncStorage: ${data.barcode} (key: ${storageKey})`);
      
      // Add to manual products list
      await addToManualProductsList(data.barcode);
      logger.debug(`[ManualProductService] ✅ Added to manual products list: ${data.barcode}`);
    } catch (storageError) {
      logger.error(`[ManualProductService] ❌ AsyncStorage save failed:`, storageError);
      logger.warn('[ManualProductService] Failed to save to AsyncStorage (non-critical):', storageError);
    }

    logger.info(`[ManualProductService] ✅ Saved manual product: ${data.barcode} - ${productName}`);
    logger.debug(`[ManualProductService] ✅ LOCAL SAVE COMPLETE for barcode: ${data.barcode}`);
    
    // CRITICAL: Verify local save was successful by reading it back
    try {
      const verificationKey = `${STORAGE_KEY_PREFIX}${data.barcode}`;
      const verificationData = await AsyncStorage.getItem(verificationKey);
      if (verificationData) {
        logger.debug(`[ManualProductService] ✅ VERIFICATION: Local data confirmed saved for barcode: ${data.barcode}`);
        powershellLogger.log('SUCCESS', 'USER_CONTRIBUTION', `✅ LOCAL SAVE VERIFIED`, {
          barcode: data.barcode,
          savedToCache: true,
          savedToSQLite: true,
          savedToAsyncStorage: true,
          verification: 'PASSED',
        });
      } else {
        logger.error(`[ManualProductService] ❌ VERIFICATION FAILED: Local data NOT found after save for barcode: ${data.barcode}`);
        powershellLogger.log('ERROR', 'USER_CONTRIBUTION', `❌ LOCAL SAVE VERIFICATION FAILED`, {
          barcode: data.barcode,
          verification: 'FAILED',
        });
      }
    } catch (verifyError) {
      logger.error(`[ManualProductService] ❌ Verification error:`, verifyError);
    }
    
    // ===== USER CONTRIBUTION FLOW: STEP 2 - PHOTO UPLOAD =====
    powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Starting photo upload process`, {
      barcode: data.barcode,
      hasPhoto: !!data.image_url,
      photoPath: data.image_url || 'NONE',
    });
    
    // ===== CRITICAL: BACKEND SUBMISSION - MUST HAPPEN =====
    // This is the ONLY way data becomes available to other users
    // If this fails, data is only local and NOT shared globally
    logger.info(`[ManualProductService] 🔥 STARTING BACKEND SUBMISSION - This is CRITICAL for global sharing`);
    logger.info(`[ManualProductService] Backend submission is NOT optional - data must be submitted!`);
    
    // CRITICAL: Submit to Open Food Facts and Vercel backend for global sharing
    // This ensures user data becomes available to all users worldwide
    try {
      // Upload photo first if available
      if (data.image_url) {
        try {
          powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Uploading hero photo (Vercel proprietary)`, {
            barcode: data.barcode,
            photoPath: data.image_url,
            targetServers: ['Vercel Backend (proprietary)'],
          });

          const photoResult = await uploadProductPhoto(data.barcode, data.image_url, 'front');

          if (photoResult.success) {
            const uploadedUrl = photoResult.vercelUrl || photoResult.openFoodFactsUrl;
            powershellLogger.log('SUCCESS', 'USER_CONTRIBUTION', `Photo uploaded successfully`, {
              barcode: data.barcode,
              openFoodFactsUrl: photoResult.openFoodFactsUrl || 'NONE',
              vercelUrl: photoResult.vercelUrl || 'NONE',
              finalUrl: uploadedUrl,
            });

            logger.info(`[ManualProductService] Photo uploaded: ${uploadedUrl}`);
            if (uploadedUrl) {
              productWithScore.image_url = uploadedUrl;
              productWithScore.image_front_url = uploadedUrl;
              // Critical: first save used local picker URI (file://). Re-persist so later scans use the hosted URL.
              try {
                await cacheProduct(productWithScore, false);
                await saveProductToSQLite(productWithScore, countryCode ?? undefined);
                const storageKey = `${STORAGE_KEY_PREFIX}${data.barcode}`;
                await AsyncStorage.setItem(
                  storageKey,
                  JSON.stringify({
                    ...data,
                    image_url: uploadedUrl,
                    product: productWithScore,
                  })
                );
                powershellLogger.log(
                  'SUCCESS',
                  'USER_CONTRIBUTION',
                  `USER_SUBMIT: local cache + SQLite + AsyncStorage updated with hosted hero photo URL`,
                  {
                    barcode: data.barcode,
                    storage: ['cache', 'sqlite', 'asyncStorage'],
                    hostedPhotoHost: (() => {
                      try {
                        return /^https?:\/\//i.test(uploadedUrl)
                          ? new URL(uploadedUrl).hostname
                          : 'non-http';
                      } catch {
                        return 'unknown';
                      }
                    })(),
                    usedVercelBlob: !!photoResult.vercelUrl,
                  }
                );
              } catch (rePersistErr) {
                logger.warn('[ManualProductService] Post-upload re-persist failed:', rePersistErr);
                powershellLogger.log('WARN', 'USER_CONTRIBUTION', `Hosted photo saved on server but local re-persist failed`, {
                  barcode: data.barcode,
                  error: rePersistErr instanceof Error ? rePersistErr.message : String(rePersistErr),
                });
              }
            }
          } else {
            powershellLogger.log('WARN', 'USER_CONTRIBUTION', `Photo upload failed`, {
              barcode: data.barcode,
              error: photoResult.message,
            });
          }
        } catch (photoError) {
          powershellLogger.log('ERROR', 'USER_CONTRIBUTION', `Photo upload error`, {
            barcode: data.barcode,
            error: photoError instanceof Error ? photoError.message : String(photoError),
          });
          logger.warn('[ManualProductService] Photo upload failed (non-critical):', photoError);
        }
      } else {
        powershellLogger.log('INFO', 'USER_CONTRIBUTION', `No photo to upload`, {
          barcode: data.barcode,
        });
      }
      
      powershellLogger.log('INFO', 'USER_CONTRIBUTION', 'Manual Edit nutrition payload prepared for OFF submission', {
        barcode: data.barcode,
        hasNutrition: nutrimentsEntries.length > 0,
        nutrimentsKeyCount: nutrimentsEntries.length,
        nutrimentsKeys: nutrimentsEntries.map(([key]) => key),
        nutrimentsPreview,
        hasServingSize: !!data.serving_size,
        servingSize: data.serving_size || null,
        offCredentialsConfigured: offCredsConfigured,
      });

      // Submit to Open Food Facts
      const offResult = await submitProductToOpenFoodFacts(data);
      if (offResult.success) {
        powershellLogger.log('SUCCESS', 'USER_CONTRIBUTION', 'OFF submission accepted for manual edit payload', {
          barcode: data.barcode,
          accepted: true,
          productUrl: offResult.productUrl || null,
          hasNutritionInPayload: nutrimentsEntries.length > 0,
          nutrimentsKeyCount: nutrimentsEntries.length,
          offCredentialsConfigured: offCredsConfigured,
        });
        logger.info(`[ManualProductService] ✅ Submitted to Open Food Facts: ${offResult.productUrl}`);
      } else {
        powershellLogger.log('WARN', 'USER_CONTRIBUTION', 'OFF submission rejected/failed for manual edit payload', {
          barcode: data.barcode,
          accepted: false,
          offMessage: offResult.message,
          hasNutritionInPayload: nutrimentsEntries.length > 0,
          nutrimentsKeyCount: nutrimentsEntries.length,
          offCredentialsConfigured: offCredsConfigured,
        });
        logger.warn(`[ManualProductService] Open Food Facts submission failed: ${offResult.message}`);
        // Continue - local save was successful
      }
      
      // ===== USER CONTRIBUTION FLOW: STEP 3 - VERCEL (PROPRIETARY FIELDS ONLY) =====
      powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Vercel manual-products (country + certifications only)`, {
        barcode: data.barcode,
        hasManufacturingOrCountry: !!(
          data.manufacturing_places?.trim() ||
          data.countries?.trim()
        ),
        hasCertTags: !!(data.labels_tags && data.labels_tags.length > 0),
      });

      const proprietaryPayload = buildVercelManualProductPayload(data);
      const hasProprietaryForVercel = Object.keys(proprietaryPayload).length > 0;

      let backendSubmissionSuccess = !hasProprietaryForVercel;
      const maxRetries = 3;
      let retryCount = 0;

      if (!hasProprietaryForVercel) {
        logger.info(
          `[ManualProductService] Skipping Vercel manual-products POST (no country or certifications to store)`
        );
      }

      while (hasProprietaryForVercel && !backendSubmissionSuccess && retryCount < maxRetries) {
        try {
          const backendUrl = getBackendUrl();
          const endpoint = BackendEndpoints.manualProducts(backendUrl);

          powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Submitting proprietary data to backend (attempt ${retryCount + 1}/${maxRetries})`, {
            barcode: data.barcode,
            endpoint,
            backendUrl,
            proprietaryKeys: Object.keys(proprietaryPayload),
          });

          logger.info(`[ManualProductService] Submitting proprietary slice to backend (attempt ${retryCount + 1}/${maxRetries}): ${endpoint}`);

          const submissionStartTime = Date.now();
          const submissionPayload = {
            barcode: data.barcode,
            productData: proprietaryPayload,
          };

          powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Submitting payload to backend`, {
            barcode: data.barcode,
            endpoint,
            payload: submissionPayload,
            payloadSize: JSON.stringify(submissionPayload).length,
          });

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(submissionPayload),
          });
          
          const submissionTime = Date.now() - submissionStartTime;
          const responseText = await response.text();
          let responseData: any = null;
          try {
            responseData = JSON.parse(responseText);
          } catch {
            // Response is not JSON
          }
          
          // CRITICAL: Log full request and response for debugging
          logger.debug(`[ManualProductService] 📤 Backend request details:`, {
            endpoint,
            method: 'POST',
            payloadSize: JSON.stringify(submissionPayload).length,
            hasPhoto: !!productWithScore.image_url,
            photoUrl: productWithScore.image_url || 'NONE',
          });
          
          logger.debug(`[ManualProductService] 📥 Backend response details:`, {
            status: response.status,
            statusText: response.statusText,
            responseTime: `${submissionTime}ms`,
            responseLength: responseText.length,
            rawResponse: responseText.substring(0, 500),
            parsedResponse: responseData,
          });
          
          powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Backend submission response`, {
            barcode: data.barcode,
            status: response.status,
            statusText: response.statusText,
            responseTime: `${submissionTime}ms`,
            responseLength: responseText.length,
            rawResponse: responseText.substring(0, 1000), // First 1000 chars
            parsedResponse: responseData,
            requestPayload: {
              barcode: submissionPayload.barcode,
              proprietaryKeys: Object.keys(submissionPayload.productData as object),
            },
          });
          
          if (response.ok) {
            // Check if submission was actually successful
            const isSuccess = responseData?.success === true || 
                             responseData?.success === 'true' ||
                             response.status === 200 || 
                             response.status === 201;
            
            powershellLogger.log('SUCCESS', 'USER_CONTRIBUTION', `✅ Successfully submitted to backend`, {
              barcode: data.barcode,
              status: response.status,
              responseTime: `${submissionTime}ms`,
              responseSuccess: responseData?.success,
              responseMessage: responseData?.message,
              hasProductInResponse: !!responseData?.product,
              hasPhoto: !!productWithScore.image_url,
              photoUrl: productWithScore.image_url || 'NONE',
              fullResponse: responseData, // Log full response
            });
            
            logger.info(`[ManualProductService] ✅ Successfully submitted to Vercel backend: ${data.barcode}`);
            logger.info(`[ManualProductService] Backend response: ${responseText.substring(0, 500)}`);
            
            // Log what was actually submitted
            powershellLogger.log('INFO', 'USER_CONTRIBUTION', `Proprietary data submitted to backend`, {
              barcode: data.barcode,
              proprietaryKeys: Object.keys(proprietaryPayload),
            });
            
            backendSubmissionSuccess = true;
          } else if (response.status === 401) {
            // 401 indicates authentication required - this should NOT happen with production URLs
            logger.error(`[ManualProductService] ❌ Backend returned 401 - Authentication Required`);
            logger.error(`[ManualProductService] This usually means a preview deployment URL is being used`);
            logger.error(`[ManualProductService] Backend URL: ${backendUrl}`);
            logger.error(`[ManualProductService] Response: ${responseText.substring(0, 500)}`);
            
            // Check if this is a preview deployment URL
            if (backendUrl.includes('-') && backendUrl.match(/https:\/\/[^-]+-[a-z0-9]+\.vercel\.app/)) {
              logger.error(`[ManualProductService] ❌ CRITICAL: Preview deployment URL detected!`);
              logger.error(`[ManualProductService] ❌ Preview deployments require authentication and cannot be used for public API access`);
              logger.error(`[ManualProductService] ❌ Please use production deployment URL or configure EXPO_PUBLIC_BACKEND_URL`);
              logger.error(`[ManualProductService] ❌ Data saved locally only - will NOT be available to other users`);
            }
            
            // Don't retry 401 errors - they won't succeed
            logger.warn(`[ManualProductService] ⚠️  Backend submission failed due to authentication. Data saved locally only.`);
            logger.warn(`[ManualProductService] ⚠️  Other users will NOT see this update until backend is accessible.`);
            break; // Don't retry - authentication won't change
          } else {
            logger.error(`[ManualProductService] ❌ Backend submission failed: ${response.status} ${response.statusText}`);
            logger.error(`[ManualProductService] Response: ${responseText.substring(0, 500)}`);
            
            // Retry on server errors (5xx) or rate limits (429)
            if ((response.status >= 500 && response.status < 600) || response.status === 429) {
              retryCount++;
              if (retryCount < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s
                logger.info(`[ManualProductService] Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
              }
            }
            
            // For other errors, don't retry
            break;
          }
        } catch (backendError: any) {
          logger.error('[ManualProductService] ❌ Backend submission error:', {
            error: backendError?.message || String(backendError),
            stack: backendError?.stack,
            barcode: data.barcode,
            attempt: retryCount + 1,
          });
          
          // Retry on network errors
          if (retryCount < maxRetries - 1 && (
            backendError?.message?.includes('Network') ||
            backendError?.message?.includes('fetch') ||
            backendError?.code === 'ERR_NETWORK'
          )) {
            retryCount++;
            const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
            logger.info(`[ManualProductService] Network error, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          // Don't retry on other errors
          break;
        }
      }
      
      if (!backendSubmissionSuccess) {
        // CRITICAL FAILURE: Backend submission failed - data NOT shared globally!
        logger.error(`[ManualProductService] ❌❌❌ BACKEND SUBMISSION FAILED after ${retryCount + 1} attempts!`);
        logger.error(`[ManualProductService] ❌ Data saved locally ONLY - NOT available to other users!`);
        logger.error(`[ManualProductService] ❌ This is a CRITICAL issue - data is not being shared globally!`);
        
        powershellLogger.log('ERROR', 'USER_CONTRIBUTION', `❌❌❌ CRITICAL: Backend submission FAILED after ${retryCount + 1} attempts`, {
          barcode: data.barcode,
          attempts: retryCount + 1,
          maxRetries,
          impact: 'Data saved locally only - NOT available to other users',
          critical: true,
        });
        
        logger.error(`[ManualProductService] ❌ CRITICAL: Backend submission failed after ${retryCount + 1} attempts. Data saved locally only.`);
        logger.error(`[ManualProductService] ❌ CRITICAL: Other users will NOT see this update until backend submission succeeds.`);
        
        // CRITICAL: Show alert to user that submission failed
        // This ensures user knows their data isn't being shared
        // Note: We can't use Alert here (not in React context), but we log it clearly
      } else if (hasProprietaryForVercel) {
        logger.info(
          `[ManualProductService] ✅ Proprietary fields (country / certifications) saved to Vercel for other users.`
        );
        powershellLogger.log('SUCCESS', 'USER_CONTRIBUTION', `✅ Vercel proprietary sync complete`, {
          barcode: data.barcode,
          proprietaryKeys: Object.keys(proprietaryPayload),
        });
      }
    } catch (submissionError) {
      // CRITICAL ERROR: Backend submission failed - data is NOT available to other users!
      logger.error(`[ManualProductService] ❌❌❌ CRITICAL: Global submission FAILED!`, submissionError);
      logger.error(`[ManualProductService] ❌ Data saved locally ONLY - NOT available to other users!`);
      logger.error(`[ManualProductService] ❌ Error details:`, {
        error: submissionError instanceof Error ? submissionError.message : String(submissionError),
        stack: submissionError instanceof Error ? submissionError.stack : undefined,
        barcode: data.barcode,
      });
      
      logger.error('[ManualProductService] ❌ CRITICAL: Global submission failed - data not shared globally!', submissionError);
      
      powershellLogger.log('ERROR', 'USER_CONTRIBUTION', `❌❌❌ CRITICAL: Global submission FAILED!`, {
        barcode: data.barcode,
        error: submissionError instanceof Error ? submissionError.message : String(submissionError),
        stack: submissionError instanceof Error ? submissionError.stack : undefined,
        impact: 'Data saved locally ONLY - NOT available to other users',
      });
      
      // CRITICAL: Don't silently fail - throw error so caller knows submission failed
      // But still return true because local save succeeded
      // The caller should handle this appropriately
    }
    
    logger.debug(`[ManualProductService] ✅ saveManualProduct COMPLETE (success=true) for barcode: ${data.barcode}`);
    return true;
  } catch (error) {
    logger.error(`[ManualProductService] ❌ CRITICAL ERROR in saveManualProduct:`, error);
    logger.error('[ManualProductService] Error saving manual product', error);
    powershellLogger.log('ERROR', 'USER_CONTRIBUTION', `❌ CRITICAL ERROR - saveManualProduct failed`, {
      barcode: data.barcode,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return false;
  }
}

/**
 * Get a manually entered product
 */
export async function getManualProduct(barcode: string): Promise<ProductWithTrustScore | null> {
  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${barcode}`;
    const data = await AsyncStorage.getItem(storageKey);
    
    if (!data) {
      return null;
    }

    const parsed = JSON.parse(data);
    const p = parsed.product || null;
    if (p && (p as any)._source == null) (p as any)._source = 'LOCAL';
    return p;
  } catch (error) {
    logger.error('[ManualProductService] Error getting manual product', error);
    return null;
  }
}

/**
 * Check if a product was manually added
 */
export async function isManualProduct(barcode: string): Promise<boolean> {
  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${barcode}`;
    const data = await AsyncStorage.getItem(storageKey);
    return data !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Get all manually added products
 */
export async function getAllManualProducts(): Promise<ManualProductData[]> {
  try {
    const listKey = `${STORAGE_KEY_PREFIX}list`;
    const listData = await AsyncStorage.getItem(listKey);
    
    if (!listData) {
      return [];
    }

    const barcodes: string[] = JSON.parse(listData);
    const products: ManualProductData[] = [];

    for (const barcode of barcodes) {
      const storageKey = `${STORAGE_KEY_PREFIX}${barcode}`;
      const data = await AsyncStorage.getItem(storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        products.push(parsed);
      }
    }

    // Sort by timestamp (newest first)
    return products.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    logger.error('[ManualProductService] Error getting all manual products', error);
    return [];
  }
}

/**
 * Delete a manually added product
 */
export async function deleteManualProduct(barcode: string): Promise<boolean> {
  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${barcode}`;
    await AsyncStorage.removeItem(storageKey);
    await removeFromManualProductsList(barcode);
    return true;
  } catch (error) {
    logger.error('[ManualProductService] Error deleting manual product', error);
    return false;
  }
}

/**
 * Add barcode to manual products list
 */
async function addToManualProductsList(barcode: string): Promise<void> {
  try {
    const listKey = `${STORAGE_KEY_PREFIX}list`;
    const listData = await AsyncStorage.getItem(listKey);
    const barcodes: string[] = listData ? JSON.parse(listData) : [];
    
    // Add if not already in list
    if (!barcodes.includes(barcode)) {
      barcodes.unshift(barcode); // Add to beginning
      
      // Limit list size
      if (barcodes.length > MAX_MANUAL_PRODUCTS) {
        barcodes.splice(MAX_MANUAL_PRODUCTS);
      }
      
      await AsyncStorage.setItem(listKey, JSON.stringify(barcodes));
    }
  } catch (error) {
    logger.error('[ManualProductService] Error adding to list', error);
  }
}

/**
 * Remove barcode from manual products list
 */
async function removeFromManualProductsList(barcode: string): Promise<void> {
  try {
    const listKey = `${STORAGE_KEY_PREFIX}list`;
    const listData = await AsyncStorage.getItem(listKey);
    if (!listData) return;
    
    const barcodes: string[] = JSON.parse(listData);
    const filtered = barcodes.filter(b => b !== barcode);
    await AsyncStorage.setItem(listKey, JSON.stringify(filtered));
  } catch (error) {
    logger.error('[ManualProductService] Error removing from list', error);
  }
}

/**
 * Calculate completion percentage based on filled fields
 */
function calculateCompletion(data: ManualProductData): number {
  let filled = 0;
  const total = 8; // Total important fields
  
  if (data.product_name) filled++;
  if (data.brands) filled++;
  if (data.ingredients_text) filled++;
  if (data.image_url) filled++;
  if (data.nutriments && Object.keys(data.nutriments).length > 0) filled++;
  if (data.serving_size) filled++;
  if (data.manufacturing_places) filled++;
  if (data.categories) filled++;
  
  return Math.round((filled / total) * 100);
}

/**
 * Calculate quality score based on data completeness and accuracy
 */
function calculateQuality(data: ManualProductData): number {
  let score = 0;
  
  // Base score for required fields
  if (data.product_name && data.product_name.length > 3) score += 20;
  if (data.barcode && /^\d{8,14}$/.test(data.barcode)) score += 10;
  
  // Additional score for optional but important fields
  if (data.ingredients_text && data.ingredients_text.length > 10) score += 20;
  if (data.image_url) score += 15;
  if (data.brands) score += 10;
  if (data.nutriments && Object.keys(data.nutriments).length > 0) score += 15;
  if (data.manufacturing_places) score += 5;
  if (data.categories) score += 5;
  
  return Math.min(100, score);
}

/**
 * Submit manual product to Open Food Facts (optional - now handled automatically)
 * This function is kept for backward compatibility but auto-submission happens in saveManualProduct()
 * 
 * @deprecated Use saveManualProduct() which automatically submits to OFF and Vercel
 */
export async function submitToOpenFoodFacts(data: ManualProductData): Promise<boolean> {
  try {
    // Auto-submission now happens in saveManualProduct()
    // This function is kept for backward compatibility
    const result = await submitProductToOpenFoodFacts(data);
    return result.success;
  } catch (error) {
    logger.error('[ManualProductService] Error submitting to OFF', error);
    return false;
  }
}

