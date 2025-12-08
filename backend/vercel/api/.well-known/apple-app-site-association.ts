// Apple App Site Association (AASA) file for iOS Universal Links
// Served at: https://truescan.app/.well-known/apple-app-site-association
// Must be served with Content-Type: application/json (no .json extension)

import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set correct content type (MUST be application/json, not text/html)
  res.setHeader('Content-Type', 'application/json');
  
  // AASA file must be served without .json extension
  // Format: https://truescan.app/.well-known/apple-app-site-association
  
  // TODO: Replace TEAM_ID with your actual Apple Developer Team ID
  // Get it from: https://developer.apple.com/account -> Membership -> Team ID
  // Format: ABC123DEF4 (10 characters, alphanumeric)
  const TEAM_ID = process.env.APPLE_TEAM_ID || 'TEAM_ID';
  
  const aasa = {
    applinks: {
      apps: [], // Must be empty array
      details: [
        {
          appID: `${TEAM_ID}.com.truescan.foodscanner`,
          paths: [
            '/barcode/*', // Handle all barcode links
            '/barcode/*/*', // Handle nested paths if needed
          ],
        },
      ],
    },
  };

  // Cache for 1 hour (AASA files are cached by iOS)
  res.setHeader('Cache-Control', 'public, max-age=3600');
  
  return res.status(200).json(aasa);
}
