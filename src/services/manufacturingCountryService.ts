// Manufacturing Country User Contribution Service
// Allows users to report "Country of Manufacture" from product labels
// Implements validation system for reliable data

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ManufacturingCountrySubmission {
  barcode: string;
  country: string;
  userId: string; // Device ID or user ID
  timestamp: number;
  verified: boolean;
  verifiedCount: number; // Number of users who submitted same country
  disputed: boolean;
  photoUrl?: string; // Optional photo of label
}

const STORAGE_KEY = 'manufacturing_country_submissions';
const USER_ID_KEY = 'manufacturing_country_user_id';
const VERIFICATION_THRESHOLD = 3; // Number of matching submissions needed for verification

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
    console.error('Error getting/storing user ID:', error);
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
    return allSubmissions.filter(s => s.barcode === barcode);
  } catch (error) {
    console.error('Error getting submissions:', error);
    return [];
  }
}

/**
 * Submit manufacturing country from user
 */
export async function submitManufacturingCountry(
  barcode: string,
  country: string,
  photoUrl?: string
): Promise<{ success: boolean; verified: boolean; message: string; alreadySubmitted?: boolean }> {
  try {
    // Validate country name (basic validation)
    const normalizedCountry = country.trim().toUpperCase();
    if (!normalizedCountry || normalizedCountry.length < 2) {
      return {
        success: false,
        verified: false,
        message: 'Please enter a valid country name',
      };
    }

    const userId = await getUserId();
    const timestamp = Date.now();

    // Get existing submissions for this barcode
    const existingSubmissions = await getSubmissionsForBarcode(barcode);

    // Check if this user already submitted for this barcode
    const userExistingSubmission = existingSubmissions.find(s => s.userId === userId);
    if (userExistingSubmission) {
      // User already submitted - return friendly message (not an error)
      // Get current verification status for the existing submissions
      const matchingSubmissions = existingSubmissions.filter(
        s => s.country.toUpperCase() === userExistingSubmission.country.toUpperCase()
      );
      const verifiedCount = matchingSubmissions.length;
      const isVerified = verifiedCount >= VERIFICATION_THRESHOLD;
      
      return {
        success: true, // Success to prevent error display
        verified: isVerified,
        alreadySubmitted: true, // Flag to indicate this is a repeat submission
        message: 'Thank you for your previous submission, we can only allow one submission from each user.',
      };
    }

    // New submission (user hasn't submitted before)
    const newSubmission: ManufacturingCountrySubmission = {
      barcode,
      country: normalizedCountry,
      userId,
      timestamp,
      verified: false,
      verifiedCount: 1,
      disputed: false,
      photoUrl,
    };
    existingSubmissions.push(newSubmission);

    // Count matching submissions (same country)
    const matchingSubmissions = existingSubmissions.filter(
      s => s.country.toUpperCase() === normalizedCountry.toUpperCase()
    );
    const verifiedCount = matchingSubmissions.length;

    // Check if verified (3+ matching submissions)
    const isVerified = verifiedCount >= VERIFICATION_THRESHOLD;

    // Check if disputed (conflicting submissions)
    const uniqueCountries = new Set(existingSubmissions.map(s => s.country.toUpperCase()));
    const isDisputed = uniqueCountries.size > 1 && verifiedCount < VERIFICATION_THRESHOLD;

    // Update verification status for all matching submissions
    matchingSubmissions.forEach(submission => {
      submission.verified = isVerified;
      submission.verifiedCount = verifiedCount;
      submission.disputed = isDisputed;
    });

    // Update non-matching submissions
    existingSubmissions
      .filter(s => s.country.toUpperCase() !== normalizedCountry.toUpperCase())
      .forEach(submission => {
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
    console.error('Error submitting manufacturing country:', error);
    return {
      success: false,
      verified: false,
      message: 'Failed to submit. Please try again.',
    };
  }
}

/**
 * Get verified manufacturing country for a barcode
 */
export async function getManufacturingCountry(barcode: string): Promise<{
  country: string | null;
  confidence: 'verified' | 'community' | 'unverified' | 'disputed';
  verifiedCount: number;
}> {
  try {
    const submissions = await getSubmissionsForBarcode(barcode);
    
    if (submissions.length === 0) {
      return {
        country: null,
        confidence: 'unverified',
        verifiedCount: 0,
      };
    }

    // Find verified submissions
    const verifiedSubmissions = submissions.filter(s => s.verified && !s.disputed);
    
    if (verifiedSubmissions.length > 0) {
      // Return most common verified country
      const country = verifiedSubmissions[0].country;
      const verifiedCount = verifiedSubmissions.filter(s => s.country === country).length;
      
      return {
        country,
        confidence: 'verified',
        verifiedCount,
      };
    }

    // Find most common country (even if not verified)
    const countryCounts: Record<string, number> = {};
    submissions.forEach(s => {
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
        };
      }

      // Confidence based on count
      if (count >= 2) {
        return {
          country,
          confidence: 'community',
          verifiedCount: count,
        };
      }

      return {
        country,
        confidence: 'unverified',
        verifiedCount: count,
      };
    }

    return {
      country: null,
      confidence: 'unverified',
      verifiedCount: 0,
    };
  } catch (error) {
    console.error('Error getting manufacturing country:', error);
    return {
      country: null,
      confidence: 'unverified',
      verifiedCount: 0,
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
    return submissions.some(s => s.userId === userId);
  } catch (error) {
    console.error('Error checking user submission:', error);
    return false;
  }
}

/**
 * Submit verified data to Open Food Facts (future implementation)
 * This would integrate with Open Food Facts API to contribute data back
 */
export async function submitToOpenFoodFacts(
  barcode: string,
  country: string
): Promise<{ success: boolean; message: string }> {
  // TODO: Implement Open Food Facts API integration
  // This would require:
  // 1. Open Food Facts API authentication
  // 2. API endpoint for updating product origins
  // 3. Proper formatting of country data
  
  console.log(`Would submit ${country} for barcode ${barcode} to Open Food Facts`);
  
  return {
    success: false,
    message: 'Open Food Facts submission not yet implemented',
  };
}

