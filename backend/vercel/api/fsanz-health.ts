/**
 * FSANZ Health Check - Verify databases are loading
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as fs from 'fs';
import * as path from 'path';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Try to load NZFCD
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
        } catch (e) {
          // File exists but can't parse
        }
        break;
      }
    }
    
    // Try to load AFCD
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
        } catch (e) {
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
        paths: nzfcdPaths
      },
      afcd: {
        found: afcdFound,
        sizeMB: (afcdSize / 1024 / 1024).toFixed(2),
        entries: afcdEntries,
        paths: afcdPaths
      },
      workingDir: process.cwd(),
      __dirname: __dirname
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error)
    });
  }
}














