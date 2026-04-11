// FSANZ Database API Endpoint for Vercel
// Serves FSANZ database JSON files for automatic download by the app
// 
// Usage:
//   GET /api/fsanz-database?country=au
//   GET /api/fsanz-database?country=nz

import { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

const MAX_AGE = 31536000; // 1 year cache

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers for ALL requests (including preflight)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, User-Agent, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'false');

  // Rewritten from /api/fsanz-health (single function with fsanz-database on Hobby)
  if (req.query.__health === '1') {
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const nzfcdPaths = [
        path.join(__dirname, '..', 'data', 'nzfcd.json'),
        path.join(process.cwd(), 'data', 'nzfcd.json'),
        '/var/task/data/nzfcd.json',
      ];

      let nzfcdFound = false;
      let nzfcdSize = 0;
      let nzfcdEntries = 0;

      for (const filePath of nzfcdPaths) {
        if (fs.existsSync(filePath)) {
          nzfcdFound = true;
          const stats = fs.statSync(filePath);
          nzfcdSize = stats.size;
          try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            nzfcdEntries = Array.isArray(data) ? data.length : 0;
          } catch {
            // File exists but can't parse
          }
          break;
        }
      }

      const afcdPaths = [
        path.join(__dirname, '..', 'data', 'afcd.json'),
        path.join(process.cwd(), 'data', 'afcd.json'),
        '/var/task/data/afcd.json',
      ];

      let afcdFound = false;
      let afcdSize = 0;
      let afcdEntries = 0;

      for (const filePath of afcdPaths) {
        if (fs.existsSync(filePath)) {
          afcdFound = true;
          const stats = fs.statSync(filePath);
          afcdSize = stats.size;
          try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            afcdEntries = Array.isArray(data) ? data.length : 0;
          } catch {
            // File exists but can't parse
          }
          break;
        }
      }

      return res.status(200).json({
        nzfcd: {
          found: nzfcdFound,
          sizeMB: (nzfcdSize / 1024 / 1024).toFixed(2),
          entries: nzfcdEntries,
          paths: nzfcdPaths,
        },
        afcd: {
          found: afcdFound,
          sizeMB: (afcdSize / 1024 / 1024).toFixed(2),
          entries: afcdEntries,
          paths: afcdPaths,
        },
        workingDir: process.cwd(),
        __dirname: __dirname,
      });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const country = req.query.country as string;

  // Validate country parameter
  if (!country || (country.toLowerCase() !== 'au' && country.toLowerCase() !== 'nz')) {
    return res.status(400).json({ 
      error: 'Invalid country parameter. Must be "au" or "nz"',
      usage: '/api/fsanz-database?country=au or /api/fsanz-database?country=nz'
    });
  }

  const countryLower = country.toLowerCase();
  const countryUpper = countryLower.toUpperCase();
  
  // Try multiple possible locations for the data file
  // In Vercel, files are deployed with the function, so we check relative to the API directory
  const possiblePaths = [
    path.join(process.cwd(), 'data', `fsanz-${countryLower}.json`),
    path.join(process.cwd(), 'backend', 'vercel', 'data', `fsanz-${countryLower}.json`),
    path.join(__dirname, '..', 'data', `fsanz-${countryLower}.json`),
    path.join(__dirname, '..', '..', 'data', `fsanz-${countryLower}.json`),
    path.join(process.cwd(), '..', '..', 'data', `fsanz-${countryLower}.json`),
    path.join(process.cwd(), 'public', `fsanz-${countryLower}.json`),
  ];

  let filepath: string | null = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      filepath = possiblePath;
      break;
    }
  }

  if (!filepath) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', `public, max-age=3600`); // Cache empty database for 1 hour
    
    // Log for debugging (will appear in Vercel logs)
    console.warn(`FSANZ ${countryUpper} database file not found. Returning empty database. Searched paths:`, possiblePaths);
    console.warn(`Current working directory:`, process.cwd());
    console.warn(`__dirname:`, __dirname);
    
    // Return empty database object instead of 404
    // This allows the app to download successfully and handle empty database gracefully
    const emptyDatabase = {};
    const emptyDatabaseJson = JSON.stringify(emptyDatabase);
    
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Length', Buffer.byteLength(emptyDatabaseJson, 'utf8'));
    res.setHeader(
      'X-FSANZ-Info',
      JSON.stringify({
        country: countryUpper,
        productCount: 0,
        fileSize: emptyDatabaseJson.length,
        fileSizeMB: '0.00',
        lastModified: new Date().toISOString(),
        note: 'Empty database - file not found on server',
      })
    );
    
    return res.status(200).send(emptyDatabaseJson);
  }

  try {
    // Read file
    const fileContent = fs.readFileSync(filepath, 'utf8');
    const fileStats = fs.statSync(filepath);

    // Parse to validate JSON and get metadata
    let jsonData: any;
    try {
      jsonData = JSON.parse(fileContent);
    } catch (parseError) {
      console.error(`Error parsing FSANZ ${countryUpper} JSON:`, parseError);
      // Return empty database if parse fails
      jsonData = {};
    }
    const productCount = Object.keys(jsonData).length;

    // Set headers for caching and CORS
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Length', fileStats.size);
    res.setHeader('Cache-Control', `public, max-age=${MAX_AGE}, immutable`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader(
      'X-FSANZ-Info',
      JSON.stringify({
        country: countryUpper,
        productCount,
        fileSize: fileStats.size,
        fileSizeMB: (fileStats.size / 1024 / 1024).toFixed(2),
        lastModified: fileStats.mtime.toISOString(),
      })
    );

    // Send file
    return res.status(200).send(fileContent);

  } catch (error) {
    console.error(`Error serving FSANZ ${countryUpper} database:`, error);
    
    // Set CORS headers even for error responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
