// Digital Asset Links file for Android App Links
// Served at: https://truescan.app/.well-known/assetlinks.json
// Must be served with Content-Type: application/json

import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set correct content type
  res.setHeader('Content-Type', 'application/json');
  
  // TODO: Replace SHA256_FINGERPRINT with your app's SHA256 certificate fingerprint
  // Get it by running: 
  //   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
  // Look for "SHA256:" value
  const SHA256_FINGERPRINT = process.env.ANDROID_SHA256_FINGERPRINT || 'SHA256_FINGERPRINT';
  
  const assetlinks = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.truescan.foodscanner',
        sha256_cert_fingerprints: [
          SHA256_FINGERPRINT, // Replace with actual SHA256 fingerprint
          // Add additional fingerprints for release builds if needed
        ],
      },
    },
  ];

  // Cache for 1 hour
  res.setHeader('Cache-Control', 'public, max-age=3600');
  
  return res.status(200).json(assetlinks);
}
