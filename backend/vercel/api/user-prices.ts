/**
 * User Prices API - Vercel Backend
 * Stores user-submitted prices for global sharing
 * 
 * Endpoints:
 * - POST /api/user-prices - Submit user price
 * - GET /api/user-prices?barcode={barcode} - Get user prices for a product
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  saveUserPrice,
  getUserPrices,
} from '../lib/database';

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
      // Submit user price
      const { barcode, price, currency, retailer, location, userId } = req.body;

      if (!barcode || !price || !currency || !retailer) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: barcode, price, currency, retailer',
        });
      }

      // Validate price
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0 || priceNum > 10000) {
        return res.status(400).json({
          success: false,
          error: 'Invalid price (must be between $0.01 and $10,000)',
        });
      }

      // Get existing prices for this barcode from database
      const existingPrices = await getUserPrices(barcode);

      // Check for duplicates (same retailer + similar price within 5%)
      // Note: For database, we check after saving (can be optimized later)
      const duplicate = existingPrices.find(
        (p: any) => p.retailer.toLowerCase() === retailer.toLowerCase() &&
                    Math.abs(p.price - priceNum) / priceNum < 0.05
      );

      if (duplicate) {
        return res.status(200).json({
          success: false,
          message: 'Similar price already submitted for this retailer',
        });
      }
      
      // Check verification status (auto-verify if multiple submissions exist)
      const verified = existingPrices.length >= 2;

      // Create price entry
      const priceEntry = {
        barcode,
        price: priceNum,
        currency: currency.toUpperCase(),
        retailer: retailer.trim(),
        location: location?.trim(),
        userId: userId || 'anonymous',
        timestamp: Date.now(),
        verified: existingPrices.length >= 2, // Auto-verify if multiple submissions
      };

      // Save to database
      await saveUserPrice({
        barcode,
        price: priceNum,
        currency: currency.toUpperCase(),
        retailer: retailer.trim(),
        location: location?.trim(),
        userId: userId || 'anonymous',
      });

      // Create response object
      const priceEntry = {
        barcode,
        price: priceNum,
        currency: currency.toUpperCase(),
        retailer: retailer.trim(),
        location: location?.trim(),
        userId: userId || 'anonymous',
        timestamp: Date.now(),
        verified,
      };

      return res.status(200).json({
        success: true,
        message: 'Price submitted successfully!',
        price: priceEntry,
      });

    } else if (req.method === 'GET') {
      // Get user prices for a barcode
      const { barcode } = req.query;

      if (!barcode || typeof barcode !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Missing barcode parameter',
        });
      }

      const prices = await getUserPrices(barcode);

      return res.status(200).json({
        success: true,
        prices,
        count: prices.length,
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[UserPricesAPI] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
