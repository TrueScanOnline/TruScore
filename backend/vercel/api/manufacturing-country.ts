/**
 * Manufacturing Country API - Global sharing endpoint
 * Allows users worldwide to submit and retrieve manufacturing country data
 * 
 * Endpoints:
 * - POST /api/manufacturing-country - Submit manufacturing country data
 * - GET /api/manufacturing-country?barcode={barcode} - Get manufacturing country data for a barcode
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  saveManufacturingCountrySubmission,
  getManufacturingCountrySubmissions,
} from '../lib/database';

interface ManufacturingCountrySubmission {
  barcode: string;
  country: string;
  userId: string;
  timestamp: number;
  verified: boolean;
  verifiedCount: number;
  disputed: boolean;
  photoUrl?: string;
  hasImportedIngredients?: boolean;
}

const VERIFICATION_THRESHOLD = 3;

function handleCORS(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  handleCORS(res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      // Submit manufacturing country data
      const { barcode, country, userId, hasImportedIngredients, photoUrl } = req.body;

      if (!barcode || !country || !userId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: barcode, country, userId',
        });
      }

      // Get existing submissions for this barcode from database
      const existingSubmissions: ManufacturingCountrySubmission[] = await getManufacturingCountrySubmissions(barcode);

      // Check if user already submitted
      const userExistingSubmission = existingSubmissions.find(s => s.userId === userId);
      if (userExistingSubmission) {
        // Calculate current verification status
        const matchingSubs = existingSubmissions.filter(s => s.country.toUpperCase() === country.toUpperCase());
        const verifiedCount = matchingSubs.length;
        const isVerified = verifiedCount >= VERIFICATION_THRESHOLD;
        
        return res.status(200).json({
          success: true,
          verified: isVerified,
          alreadySubmitted: true,
          message: 'Thank you for your previous submission, we can only allow one submission from each user.',
        });
      }

      // Create new submission and save to database
      const timestamp = Date.now();
      const newSubmission: ManufacturingCountrySubmission = {
        barcode,
        country: country.trim(),
        userId,
        timestamp,
        verified: false,
        verifiedCount: 1,
        disputed: false,
        photoUrl: photoUrl || undefined,
        hasImportedIngredients: hasImportedIngredients || false,
      };

      // Save to database
      await saveManufacturingCountrySubmission({
        barcode,
        country: country.trim(),
        userId,
        photoUrl: photoUrl || undefined,
        hasImportedIngredients: hasImportedIngredients || false,
      });
      
      // Refresh submissions from database to get updated counts
      const allSubmissions = await getManufacturingCountrySubmissions(barcode);

      // Calculate verification status from all submissions
      const matchingSubs = allSubmissions.filter(s => s.country.toUpperCase() === country.trim().toUpperCase());
      const finalVerifiedCount = matchingSubs.length;
      const finalIsVerified = finalVerifiedCount >= VERIFICATION_THRESHOLD;
      const uniqueCountries = new Set(allSubmissions.map(s => s.country.toUpperCase()));
      const finalIsDisputed = uniqueCountries.size > 1 && finalVerifiedCount < VERIFICATION_THRESHOLD;

      let message = 'Thank you for your contribution!';
      if (finalIsVerified) {
        message = 'Country verified! Your contribution helped verify this information.';
      } else if (finalVerifiedCount === 2) {
        message = `Almost verified! ${VERIFICATION_THRESHOLD - finalVerifiedCount} more matching submission needed.`;
      } else if (finalVerifiedCount > 0) {
        message = `${finalVerifiedCount} user${finalVerifiedCount > 1 ? 's' : ''} reported this country. More submissions needed for verification.`;
      }

      if (finalIsDisputed && !finalIsVerified) {
        message += ' Note: Conflicting submissions detected. Manual review may be needed.';
      }

      return res.status(200).json({
        success: true,
        verified: finalIsVerified,
        message,
      });

    } else if (req.method === 'GET') {
      // Get manufacturing country data for a barcode
      const { barcode } = req.query;

      if (!barcode || typeof barcode !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Missing barcode parameter',
        });
      }

      const submissions: ManufacturingCountrySubmission[] = await getManufacturingCountrySubmissions(barcode);

      if (submissions.length === 0) {
        return res.status(200).json({
          country: null,
          confidence: 'unverified',
          verifiedCount: 0,
          hasImportedIngredients: false,
        });
      }

      // Check if any submission has imported ingredients flag
      const hasImportedIngredients = submissions.some(s => s.hasImportedIngredients === true);

      // Find verified submissions
      const verifiedSubmissions = submissions.filter(s => s.verified && !s.disputed);

      if (verifiedSubmissions.length > 0) {
        const country = verifiedSubmissions[0].country;
        const verifiedCount = verifiedSubmissions.filter(s => s.country === country).length;

        return res.status(200).json({
          country,
          confidence: 'verified',
          verifiedCount,
          hasImportedIngredients,
        });
      }

      // Find most common country
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
        const uniqueCountries = Object.keys(countryCounts);
        const isDisputed = uniqueCountries.length > 1;

        if (isDisputed) {
          return res.status(200).json({
            country,
            confidence: 'disputed',
            verifiedCount: count,
            hasImportedIngredients,
          });
        }

        if (count >= 2) {
          return res.status(200).json({
            country,
            confidence: 'community',
            verifiedCount: count,
            hasImportedIngredients,
          });
        }

        return res.status(200).json({
          country,
          confidence: 'unverified',
          verifiedCount: count,
          hasImportedIngredients,
        });
      }

      return res.status(200).json({
        country: null,
        confidence: 'unverified',
        verifiedCount: 0,
        hasImportedIngredients: false,
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[ManufacturingCountryAPI] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
