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

    const SHA256_FINGERPRINT =
      process.env.ANDROID_SHA256_FINGERPRINT || 'SHA256_FINGERPRINT';

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

    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).json(assetlinks);
  }

  return res.status(400).json({ error: 'Invalid or missing kind (apple | assetlinks)' });
}
