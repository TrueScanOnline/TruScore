// Manufacturing Country User Contribution Service
// Allows users to report "Country of Manufacture" from product labels
// Implements validation system for reliable data

import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateCountrySubmission, RateLimiter } from '../utils/validation';
import { logger } from '../utils/logger';
import { uploadProductPhoto } from './photoUploadService';
import { CONTRIBUTION_POLICY } from '../config/contributionPolicy';
import { submitGovernedEvidence } from '../contributions/submitGovernedEvidence';
import { getBackendUrl, BackendEndpoints } from '../config/backendConfig';

// Rate limiter: max 1 submission per barcode per user (enforced by userId check)
// Additional rate limit: max 10 submissions per hour per user
const submissionRateLimiter = new RateLimiter(10, 60 * 60 * 1000); // 10 per hour

export interface ManufacturingCountrySubmission {
  barcode: string;
  country: string;
  userId: string; // Device ID or user ID
  timestamp: number;
  verified: boolean;
  verifiedCount: number; // Number of users who submitted same country
  disputed: boolean;
  photoUrl?: string; // Optional photo of label
  hasImportedIngredients?: boolean; // "With some imported ingredients" flag
}

const STORAGE_KEY = 'manufacturing_country_submissions';
const USER_ID_KEY = 'manufacturing_country_user_id';

/** Submitter + independentConfirmationsRequired subsequent contributors. */
const VERIFICATION_THRESHOLD = 1 + CONTRIBUTION_POLICY.origins.independentConfirmationsRequired;

// Don't call getBackendUrl() at module load time - call it when needed
function getManufacturingCountryApi(): string {
  return BackendEndpoints.manufacturingCountry(getBackendUrl());
}

/**
 * Get device/user ID (persistent implementation)
 */
async function getUserId(): Promise<string> {
  try {
    // Try to get existing user ID
    const existingUserId = await AsyncStorage.getItem(USER_ID_KEY);
    if (existingUserId) {
      return existingUserId;
    }
    
    // Generate a new persistent user ID
    const newUserId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    await AsyncStorage.setItem(USER_ID_KEY, newUserId);
    return newUserId;
  } catch (error) {
    logger.error('Error getting/storing user ID:', error);
    // Fallback to a session-based ID if storage fails
    return `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

/**
 * Get all submissions for a barcode
 */
async function getSubmissionsForBarcode(barcode: string): Promise<ManufacturingCountrySubmission[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const allSubmissions: ManufacturingCountrySubmission[] = JSON.parse(data);
    return allSubmissions.filter((s: ManufacturingCountrySubmission) => s.barcode === barcode);
  } catch (error) {
    logger.error('Error getting submissions:', error);
    return [];
  }
}

/**
 * Submit manufacturing country from user
 */
export async function submitManufacturingCountry(
  barcode: string,
  country: string,
  photoUrl?: string,
  hasImportedIngredients?: boolean
): Promise<{ success: boolean; verified: boolean; message: string; alreadySubmitted?: boolean }> {
  try {
    // Validate input using validation utility
    const validation = validateCountrySubmission(barcode, country, photoUrl);
    if (!validation.valid || !validation.data) {
      return {
        success: false,
        verified: false,
        message: validation.error || 'Invalid input data',
      };
    }

    const { country: validatedCountry, photoUrl: validatedPhotoUrl } = validation.data;
    const userId = await getUserId();
    
    logger.debug('[ManufacturingCountryService] Submitting:', {
      barcode,
      country: validatedCountry,
      hasImportedIngredients,
      userId,
    });
    
    // Rate limiting check
    if (!submissionRateLimiter.isAllowed(userId)) {
      return {
        success: false,
        verified: false,
        message: 'Too many submissions. Please try again later.',
      };
    }

    await submitGovernedEvidence({
      barcode,
      domain: 'origins',
      claimValue: validatedCountry,
      imageUrl: validatedPhotoUrl,
      exactWording: validatedCountry,
    }).catch((err) => {
      logger.warn('[ManufacturingCountryService] Governed evidence persist failed (non-blocking):', err);
    });

    // Try to submit to backend API first (for global sharing)
    try {
      const submissionData = {
        barcode,
        country: validatedCountry,
        userId,
        photoUrl: validatedPhotoUrl,
        hasImportedIngredients: hasImportedIngredients || false,
      };
      console.log('[ManufacturingCountryService] POST to backend:', submissionData);
      
      const manufacturingCountryApi = getManufacturingCountryApi();
      const response = await fetch(manufacturingCountryApi, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        const result = await response.json();
        logger.debug('[ManufacturingCountryService] Submitted to backend API:', result);
        
        // CRITICAL: Upload photo if provided
        let uploadedPhotoUrl: string | undefined = validatedPhotoUrl || undefined;
        if (validatedPhotoUrl) {
          try {
            const photoResult = await uploadProductPhoto(barcode, validatedPhotoUrl, 'country_label');
            if (photoResult.success) {
              uploadedPhotoUrl = photoResult.vercelUrl || photoResult.openFoodFactsUrl || validatedPhotoUrl;
              logger.info(`[ManufacturingCountryService] Photo uploaded: ${uploadedPhotoUrl}`);
            }
          } catch (photoError) {
            logger.warn('[ManufacturingCountryService] Photo upload failed (non-critical):', photoError);
          }
        }

        // Country of manufacture is proprietary (Vercel manufacturing-country API + local cache only; not OFF).

        // Also save locally as cache/backup
        // Check if user already has a submission and update it instead of creating duplicate
        const existingSubmissions = await getSubmissionsForBarcode(barcode);
        const userExistingSubmission = existingSubmissions.find((s: ManufacturingCountrySubmission) => s.userId === userId);
        
        if (userExistingSubmission) {
          // Check if country is changing
          const isCountryChange = userExistingSubmission.country.toUpperCase() !== validatedCountry.toUpperCase();
          
          if (isCountryChange) {
            // Country change - update submission and reset verification
            userExistingSubmission.country = validatedCountry;
            userExistingSubmission.timestamp = Date.now();
            userExistingSubmission.verified = false;
            userExistingSubmission.verifiedCount = 1;
            userExistingSubmission.disputed = false;
            userExistingSubmission.hasImportedIngredients = hasImportedIngredients || false;
            if (uploadedPhotoUrl) {
              userExistingSubmission.photoUrl = uploadedPhotoUrl;
            }
            
            // Recalculate verification status for all submissions
            const allSubmissionsForBarcode = existingSubmissions.filter(s => s.userId !== userId);
            allSubmissionsForBarcode.push(userExistingSubmission);
            
            const matchingSubmissions = allSubmissionsForBarcode.filter(
              s => s.country.toUpperCase() === validatedCountry.toUpperCase()
            );
            const verifiedCount = matchingSubmissions.length;
            const isVerified = verifiedCount >= VERIFICATION_THRESHOLD;
            const uniqueCountries = new Set(allSubmissionsForBarcode.map(s => s.country.toUpperCase()));
            const isDisputed = uniqueCountries.size > 1 && verifiedCount < VERIFICATION_THRESHOLD;
            
            allSubmissionsForBarcode.forEach(submission => {
              if (submission.country.toUpperCase() === validatedCountry.toUpperCase()) {
                submission.verified = isVerified;
                submission.verifiedCount = verifiedCount;
                submission.disputed = isDisputed;
              } else {
                submission.verified = false;
                submission.verifiedCount = allSubmissionsForBarcode.filter(
                  s => s.country.toUpperCase() === submission.country.toUpperCase()
                ).length;
                submission.disputed = isDisputed;
              }
            });
            
            const allSubmissions = await getAllSubmissions();
            const otherSubmissions = allSubmissions.filter(s => s.barcode !== barcode);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...otherSubmissions, ...allSubmissionsForBarcode]));
            
            return {
              success: true,
              verified: false,
              message: `Thank you! Country updated to "${validatedCountry}". Community verification in progress...`,
              alreadySubmitted: false,
            };
          } else {
            // Same country - just update flags
            userExistingSubmission.hasImportedIngredients = hasImportedIngredients || false;
            if (uploadedPhotoUrl) {
              userExistingSubmission.photoUrl = uploadedPhotoUrl;
            }
            const allSubmissions = await getAllSubmissions();
            const otherSubmissions = allSubmissions.filter(s => s.barcode !== barcode);
            const updatedSubmissions = [...otherSubmissions, ...existingSubmissions];
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSubmissions));
          }
        } else {
          // Create new submission
          await saveToLocalStorage(barcode, validatedCountry, userId, uploadedPhotoUrl || undefined, hasImportedIngredients);
        }
        
        return {
          success: result.success,
          verified: result.verified || false,
          message: result.message || 'Thank you for your contribution!',
          alreadySubmitted: result.alreadySubmitted || false,
        };
      }
    } catch (apiError) {
      logger.warn('[ManufacturingCountryService] Backend API unavailable, using local storage:', apiError);
      // Fall back to local storage if backend is unavailable
    }

    // Fallback to local storage (for offline support)
    const timestamp = Date.now();

    // Get existing submissions for this barcode
    const existingSubmissions = await getSubmissionsForBarcode(barcode);

    // Check if this user already submitted for this barcode
    const userExistingSubmission = existingSubmissions.find((s: ManufacturingCountrySubmission) => s.userId === userId);
    if (userExistingSubmission) {
      // Check if user is changing the country (not just updating imported ingredients flag)
      const isCountryChange = userExistingSubmission.country.toUpperCase() !== validatedCountry.toUpperCase();
      
      if (isCountryChange) {
        // User is changing their submitted country - reset verification status
        logger.info(`[ManufacturingCountryService] User changing country from "${userExistingSubmission.country}" to "${validatedCountry}" - resetting verification`);
        
        // Remove old submission from count and update with new country
        userExistingSubmission.country = validatedCountry;
        userExistingSubmission.timestamp = timestamp;
        userExistingSubmission.verified = false;
        userExistingSubmission.verifiedCount = 1; // Reset to 1 (just this user)
        userExistingSubmission.disputed = false;
        userExistingSubmission.hasImportedIngredients = hasImportedIngredients || false;
        
        // Recalculate verification status for ALL submissions (new country starts fresh)
        const allSubmissionsForBarcode = existingSubmissions.filter(s => s.userId !== userId);
        allSubmissionsForBarcode.push(userExistingSubmission);
        
        // Count matching submissions for new country
        const matchingSubmissions = allSubmissionsForBarcode.filter(
          (s: ManufacturingCountrySubmission) => s.country.toUpperCase() === validatedCountry.toUpperCase()
        );
        const verifiedCount = matchingSubmissions.length;
        const isVerified = verifiedCount >= VERIFICATION_THRESHOLD;
        
        // Check for disputes (multiple different countries)
        const uniqueCountries = new Set(allSubmissionsForBarcode.map(s => s.country.toUpperCase()));
        const isDisputed = uniqueCountries.size > 1 && verifiedCount < VERIFICATION_THRESHOLD;
        
        // Update all submissions with new verification status
        allSubmissionsForBarcode.forEach(submission => {
          if (submission.country.toUpperCase() === validatedCountry.toUpperCase()) {
            submission.verified = isVerified;
            submission.verifiedCount = verifiedCount;
            submission.disputed = isDisputed;
          } else {
            submission.verified = false;
            submission.verifiedCount = allSubmissionsForBarcode.filter(
              s => s.country.toUpperCase() === submission.country.toUpperCase()
            ).length;
            submission.disputed = isDisputed;
          }
        });
        
        // Save updated submissions
        const allSubmissions = await getAllSubmissions();
        const otherSubmissions = allSubmissions.filter(s => s.barcode !== barcode);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...otherSubmissions, ...allSubmissionsForBarcode]));
        
        // Submit to backend if available
        try {
          const manufacturingCountryApi = getManufacturingCountryApi();
          const response = await fetch(manufacturingCountryApi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              barcode,
              country: validatedCountry,
              userId,
              photoUrl: validatedPhotoUrl,
              hasImportedIngredients: hasImportedIngredients || false,
            }),
          });
          if (response.ok) {
            logger.info(`[ManufacturingCountryService] ✅ Country change submitted to backend`);
          }
        } catch (backendError) {
          logger.debug('[ManufacturingCountryService] Backend submission failed (non-critical):', backendError);
        }
        
        return {
          success: true,
          verified: false, // Always false after country change - needs re-verification
          alreadySubmitted: false, // Not a repeat - it's an update
          message: `Thank you! Country updated to "${validatedCountry}". Community verification in progress...`,
        };
      }
      
      // Same country - check if we need to update the imported ingredients flag
      const needsUpdate = userExistingSubmission.hasImportedIngredients !== (hasImportedIngredients || false);
      
      if (needsUpdate) {
        // Update the existing submission with the new imported ingredients flag
        logger.info('[ManufacturingCountryService] Updating existing submission with new imported ingredients flag');
        userExistingSubmission.hasImportedIngredients = hasImportedIngredients || false;
        
        // Save the updated submissions
        const allSubmissions = await getAllSubmissions();
        const otherSubmissions = allSubmissions.filter(s => s.barcode !== barcode);
        const updatedSubmissions = [...otherSubmissions, ...existingSubmissions];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSubmissions));
        
        // Get current verification status
        const matchingSubmissions = existingSubmissions.filter(
          (s: ManufacturingCountrySubmission) => s.country.toUpperCase() === userExistingSubmission.country.toUpperCase()
        );
        const verifiedCount = matchingSubmissions.length;
        const isVerified = verifiedCount >= VERIFICATION_THRESHOLD;
        
        return {
          success: true,
          verified: isVerified,
          alreadySubmitted: true,
          message: 'Thank you! Your submission has been updated with the imported ingredients information.',
        };
      }
      
      // User already submitted same country with same flags - return friendly message
      const matchingSubmissions = existingSubmissions.filter(
        (s: ManufacturingCountrySubmission) => s.country.toUpperCase() === userExistingSubmission.country.toUpperCase()
      );
      const verifiedCount = matchingSubmissions.length;
      const isVerified = verifiedCount >= VERIFICATION_THRESHOLD;
      
      return {
        success: true,
        verified: isVerified,
        alreadySubmitted: true,
        message: 'Thank you for your previous submission. You can update the country if it has changed.',
      };
    }

    // New submission (user hasn't submitted before)
    const newSubmission: ManufacturingCountrySubmission = {
      barcode,
      country: validatedCountry,
      userId,
      timestamp,
      verified: false,
      verifiedCount: 1,
      disputed: false,
      photoUrl: validatedPhotoUrl || undefined,
      hasImportedIngredients: hasImportedIngredients || false,
    };
    logger.debug('[ManufacturingCountryService] Creating new submission:', {
      barcode,
      country: validatedCountry,
      hasImportedIngredients: newSubmission.hasImportedIngredients,
    });
    existingSubmissions.push(newSubmission);

    // Count matching submissions (same country)
    const matchingSubmissions = existingSubmissions.filter(
      (s: ManufacturingCountrySubmission) => s.country.toUpperCase() === validatedCountry.toUpperCase()
    );
    const verifiedCount = matchingSubmissions.length;

    // Check if verified (3+ matching submissions)
    const isVerified = verifiedCount >= VERIFICATION_THRESHOLD;

    // Check if disputed (conflicting submissions)
    const uniqueCountries = new Set(existingSubmissions.map((s: ManufacturingCountrySubmission) => s.country.toUpperCase()));
    const isDisputed = uniqueCountries.size > 1 && verifiedCount < VERIFICATION_THRESHOLD;

    // Update verification status for all matching submissions
    matchingSubmissions.forEach((submission: ManufacturingCountrySubmission) => {
      submission.verified = isVerified;
      submission.verifiedCount = verifiedCount;
      submission.disputed = isDisputed;
    });

    // Update non-matching submissions
    existingSubmissions
      .filter((s: ManufacturingCountrySubmission) => s.country.toUpperCase() !== validatedCountry.toUpperCase())
      .forEach((submission: ManufacturingCountrySubmission) => {
        submission.disputed = isDisputed;
        submission.verified = false;
      });

    // Save all submissions
    const allSubmissions = await getAllSubmissions();
    const otherSubmissions = allSubmissions.filter(s => s.barcode !== barcode);
    const updatedSubmissions = [...otherSubmissions, ...existingSubmissions];
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSubmissions));

    // Determine message
    let message = 'Thank you for your contribution!';
    if (isVerified) {
      message = 'Country verified! Your contribution helped verify this information.';
    } else if (verifiedCount === 2) {
      message = `Almost verified! ${VERIFICATION_THRESHOLD - verifiedCount} more matching submission needed.`;
    } else if (verifiedCount > 0) {
      message = `${verifiedCount} user${verifiedCount > 1 ? 's' : ''} reported this country. More submissions needed for verification.`;
    }

    if (isDisputed && !isVerified) {
      message += ' Note: Conflicting submissions detected. Manual review may be needed.';
    }

    return {
      success: true,
      verified: isVerified,
      message,
    };
  } catch (error) {
    logger.error('Error submitting manufacturing country:', error);
    return {
      success: false,
      verified: false,
      message: 'Failed to submit. Please try again.',
    };
  }
}

/**
 * Helper function to save submission to local storage
 */
async function saveToLocalStorage(
  barcode: string,
  country: string,
  userId: string,
  photoUrl?: string | null,
  hasImportedIngredients?: boolean
): Promise<void> {
  try {
    const timestamp = Date.now();
    const newSubmission: ManufacturingCountrySubmission = {
      barcode,
      country,
      userId,
      timestamp,
      verified: false,
      verifiedCount: 1,
      disputed: false,
      photoUrl: (photoUrl && photoUrl !== null) ? photoUrl : undefined,
      hasImportedIngredients: hasImportedIngredients || false,
    };
    logger.debug('[ManufacturingCountryService] Saving to local storage:', {
      barcode,
      country,
      hasImportedIngredients: newSubmission.hasImportedIngredients,
    });

    const existingSubmissions = await getSubmissionsForBarcode(barcode);
    existingSubmissions.push(newSubmission);

    const allSubmissions = await getAllSubmissions();
    const otherSubmissions = allSubmissions.filter(s => s.barcode !== barcode);
    const updatedSubmissions = [...otherSubmissions, ...existingSubmissions];
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSubmissions));
  } catch (error) {
    logger.error('[ManufacturingCountryService] Error saving to local storage:', error);
  }
}

/**
 * Get verified manufacturing country for a barcode
 */
export async function getManufacturingCountry(barcode: string): Promise<{
  country: string | null;
  confidence: 'verified' | 'community' | 'unverified' | 'disputed';
  verifiedCount: number;
  hasImportedIngredients?: boolean; // True if any submission has imported ingredients flag
}> {
  try {
    // Try to fetch from backend API first (for global data)
    try {
      const manufacturingCountryApi = getManufacturingCountryApi();
      const response = await fetch(`${manufacturingCountryApi}?barcode=${encodeURIComponent(barcode)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        logger.debug('[ManufacturingCountryService] Fetched from backend API:', result);
        return {
          country: result.country || null,
          confidence: result.confidence || 'unverified',
          verifiedCount: result.verifiedCount || 0,
          hasImportedIngredients: result.hasImportedIngredients || false,
        };
      }
    } catch (apiError) {
      logger.warn('[ManufacturingCountryService] Backend API unavailable, using local storage:', apiError);
      // Fall back to local storage if backend is unavailable
    }

    // Fallback to local storage
    const submissions = await getSubmissionsForBarcode(barcode);
    
    console.log('[ManufacturingCountryService] Retrieved submissions from local storage:', {
      barcode,
      submissionCount: submissions.length,
      submissions: submissions.map(s => ({
        country: s.country,
        hasImportedIngredients: s.hasImportedIngredients,
      })),
    });
    
    if (submissions.length === 0) {
      return {
        country: null,
        confidence: 'unverified',
        verifiedCount: 0,
        hasImportedIngredients: false,
      };
    }

    // Check if any submission has imported ingredients flag
    const hasImportedIngredients = submissions.some((s: ManufacturingCountrySubmission) => s.hasImportedIngredients === true);
    logger.debug('[ManufacturingCountryService] Aggregated hasImportedIngredients:', hasImportedIngredients);

    // Find verified submissions
    const verifiedSubmissions = submissions.filter((s: ManufacturingCountrySubmission) => s.verified && !s.disputed);
    
    if (verifiedSubmissions.length > 0) {
      // Return most common verified country
      const country = verifiedSubmissions[0].country;
      const verifiedCount = verifiedSubmissions.filter((s: ManufacturingCountrySubmission) => s.country === country).length;
      
      return {
        country,
        confidence: 'verified',
        verifiedCount,
        hasImportedIngredients,
      };
    }

    // Find most common country (even if not verified)
    const countryCounts: Record<string, number> = {};
    submissions.forEach((s: ManufacturingCountrySubmission) => {
      if (!s.disputed) {
        countryCounts[s.country] = (countryCounts[s.country] || 0) + 1;
      }
    });

    const mostCommonCountry = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])[0];

    if (mostCommonCountry) {
      const [country, count] = mostCommonCountry;
      
      // Check if disputed
      const uniqueCountries = Object.keys(countryCounts);
      const isDisputed = uniqueCountries.length > 1;
      
      if (isDisputed) {
        return {
          country,
          confidence: 'disputed',
          verifiedCount: count,
          hasImportedIngredients,
        };
      }

      // Confidence based on count
      if (count >= 2) {
        return {
          country,
          confidence: 'community',
          verifiedCount: count,
          hasImportedIngredients,
        };
      }

      return {
        country,
        confidence: 'unverified',
        verifiedCount: count,
        hasImportedIngredients,
      };
    }

    return {
      country: null,
      confidence: 'unverified',
      verifiedCount: 0,
      hasImportedIngredients: false,
    };
  } catch (error) {
    logger.error('Error getting manufacturing country:', error);
    return {
      country: null,
      confidence: 'unverified',
      verifiedCount: 0,
      hasImportedIngredients: false,
    };
  }
}

/**
 * Get all submissions (internal helper)
 */
async function getAllSubmissions(): Promise<ManufacturingCountrySubmission[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting all submissions:', error);
    return [];
  }
}

/**
 * Check if user has already submitted for a barcode
 */
export async function hasUserSubmitted(barcode: string): Promise<boolean> {
  try {
    const submissions = await getSubmissionsForBarcode(barcode);
    const userId = await getUserId();
    return submissions.some((s: ManufacturingCountrySubmission) => s.userId === userId);
  } catch (error) {
    logger.error('Error checking user submission:', error);
    return false;
  }
}

/**
 * Get community country statistics - top countries by submission count
 * Returns array of countries sorted by submission count (descending)
 */
export async function getCommunityCountryStats(barcode: string): Promise<Array<{ country: string; count: number }>> {
  try {
    const submissions = await getSubmissionsForBarcode(barcode);
    
    if (submissions.length === 0) {
      return [];
    }

    // Count submissions per country
    const countryCounts: Record<string, number> = {};
    submissions.forEach((s: ManufacturingCountrySubmission) => {
      if (!s.disputed) {
        countryCounts[s.country] = (countryCounts[s.country] || 0) + 1;
      }
    });

    // Convert to array and sort by count (descending)
    const stats = Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);

    return stats;
  } catch (error) {
    logger.error('Error getting community country stats', error);
    return [];
  }
}

/**
 * Legacy hook — manufacturing country is proprietary (Vercel + app cache only), not Open Food Facts.
 * @deprecated Use submitManufacturingCountry().
 */
export async function submitToOpenFoodFacts(
  _barcode: string,
  _country: string
): Promise<{ success: boolean; message: string }> {
  logger.warn(
    '[ManufacturingCountryService] submitToOpenFoodFacts is obsolete; country is not sent to Open Food Facts.'
  );
  return {
    success: false,
    message: 'Manufacturing country is stored on Rveel only.',
  };
}

