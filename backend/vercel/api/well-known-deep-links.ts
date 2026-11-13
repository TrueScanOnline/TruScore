/**
 * Single serverless function for iOS AASA + Android Digital Asset Links (Hobby plan function count).
 * Rewrites from /.well-known/* and /api/.well-known/* (see vercel.json).
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const kind = typeof req.query.kind === 'string' ? req.query.kind : '';

  if (kind === 'apple') {
    res.setHeader('Content-Type', 'application/json');

    const TEAM_ID = process.env.APPLE_TEAM_ID || 'TEAM_ID';

    const aasa = {
      applinks: {
        apps: [],
        details: [
          {
            appID: `${TEAM_ID}.com.truescan.foodscanner`,
            paths: ['/barcode/*', '/barcode/*/*'],
          },
        ],
      },
    };

    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).json(aasa);
  }

  if (kind === 'assetlinks') {
    res.setHeader('Content-Type', 'application/json');

    /**
     * TEMPORARY testing arrangement (founder-authorised 2026-11-13):
     * Debug APK fingerprint for local/emulator App Link verification only.
     * NOT permanent production trust — replace with Play App Signing SHA-256 or remove.
     * Hardcoded to avoid Windows Vercel-CLI env CR/LF contamination that broke DAL.
     */
    const SHA256_FINGERPRINT =
      'FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C';

    const assetlinks = [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: 'com.truescan.foodscanner',
          sha256_cert_fingerprints: [SHA256_FINGERPRINT],
        },
      },
    ];

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(assetlinks);
  }

  return res.status(400).json({ error: 'Invalid or missing kind (apple | assetlinks)' });
}
