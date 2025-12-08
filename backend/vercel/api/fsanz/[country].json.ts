// FSANZ Database API Endpoint for Vercel
// Serves FSANZ database JSON files for automatic download by the app
// 
// Usage:
//   GET /api/fsanz/au.json
//   GET /api/fsanz/nz.json

import { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

const MAX_AGE = 31536000; // 1 year cache
const DATA_DIR = path.join(process.cwd(), '../../data');

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { country } = req.query;

  // Validate country parameter
  if (!country || (country !== 'au' && country !== 'nz')) {
    return res.status(400).json({ 
      error: 'Invalid country parameter. Must be "au" or "nz"' 
    });
  }

  const countryUpper = country.toUpperCase();
  const filename = `fsanz-${country}.json`;
  const filepath = path.join(DATA_DIR, filename);

  try {
    // Check if file exists
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        error: `FSANZ ${countryUpper} database file not found`,
        message: `Please upload ${filename} to the data/ directory`,
        expectedPath: filepath,
      });
    }

    // Read file
    const fileContent = fs.readFileSync(filepath, 'utf8');
    const fileStats = fs.statSync(filepath);

    // Parse to validate JSON
    const jsonData = JSON.parse(fileContent);
    const productCount = Object.keys(jsonData).length;

    // Set headers for caching and CORS
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', fileStats.size);
    res.setHeader('Cache-Control', `public, max-age=${MAX_AGE}, immutable`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader(
      'X-FSANZ-Info',
      JSON.stringify({
        country: countryUpper,
        productCount,
        fileSize: fileStats.size,
        lastModified: fileStats.mtime.toISOString(),
      })
    );

    // Send file
    return res.status(200).send(fileContent);

  } catch (error) {
    console.error(`Error serving FSANZ ${countryUpper} database:`, error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}










