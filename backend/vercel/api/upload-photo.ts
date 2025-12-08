/**
 * Photo Upload API - Vercel Backend
 * Handles photo uploads from mobile app and stores them for global access
 * 
 * Endpoint: POST /api/upload-photo
 * 
 * Storage Options:
 * 1. Vercel Blob Storage (recommended) - requires @vercel/blob package
 * 2. Cloudinary (easy integration, free tier)
 * 3. AWS S3 (scalable, requires AWS account)
 * 4. Base64 in database (small images only, not recommended for production)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { savePhoto } from '../lib/database';

function handleCORS(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Upload photo to cloud storage
 * Returns public URL for the uploaded photo
 */
async function uploadToCloudStorage(
  barcode: string,
  imageType: string,
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  try {
    // Option 1: Vercel Blob Storage (recommended)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = await import('@vercel/blob');
        const buffer = Buffer.from(imageBase64, 'base64');
        const filename = `${barcode}/${imageType}_${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`;
        
        const blob = await put(filename, buffer, {
          access: 'public',
          contentType: mimeType,
        });
        
        return blob.url;
      } catch (error) {
        console.warn('[PhotoUpload] Vercel Blob Storage failed, trying fallback:', error);
      }
    }
    
    // Option 2: Cloudinary (if configured)
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
        const cloudinary = require('cloudinary').v2;
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `truescan/${barcode}`,
              public_id: `${imageType}_${Date.now()}`,
              resource_type: 'image',
            },
            (error: any, result: any) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          
          const buffer = Buffer.from(imageBase64, 'base64');
          uploadStream.end(buffer);
        });
        
        return (result as any).secure_url;
      } catch (error) {
        console.warn('[PhotoUpload] Cloudinary upload failed, trying fallback:', error);
      }
    }
    
    // Option 3: Store as base64 in database (fallback for small images)
    // Note: Not recommended for production, but works for development
    // For production, use Vercel Blob or Cloudinary
    const maxBase64Size = 5 * 1024 * 1024; // 5MB limit
    if (imageBase64.length < maxBase64Size) {
      // Return a data URL (can be stored in database)
      const dataUrl = `data:${mimeType};base64,${imageBase64}`;
      return dataUrl;
    }
    
    throw new Error('Image too large for base64 storage. Configure cloud storage (Vercel Blob or Cloudinary).');
  } catch (error) {
    console.error('[PhotoUpload] Error uploading to cloud storage:', error);
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  handleCORS(res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { barcode, imageType, imageBase64, mimeType, userId } = req.body;

    if (!barcode || !imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: barcode, imageBase64',
      });
    }

    // Validate image size (max 10MB base64)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageBase64.length > maxSize) {
      return res.status(400).json({
        success: false,
        error: 'Image too large. Maximum size is 10MB.',
      });
    }

    // Upload to cloud storage
    let photoUrl: string;
    try {
      photoUrl = await uploadToCloudStorage(
        barcode,
        imageType || 'front',
        imageBase64,
        mimeType || 'image/jpeg'
      );
    } catch (uploadError) {
      console.error('[PhotoUploadAPI] Upload failed:', uploadError);
      return res.status(500).json({
        success: false,
        error: 'Failed to upload photo to storage',
      });
    }

    // Store photo metadata in database
    try {
      await savePhoto({
        barcode,
        imageType: imageType || 'front',
        photoUrl,
        photoData: imageBase64.length < 1024 * 1024 ? imageBase64 : undefined, // Store small images as base64
        userId: userId || undefined,
      });
    } catch (dbError) {
      console.warn('[PhotoUploadAPI] Database save failed (non-critical):', dbError);
      // Continue - photo was uploaded, just metadata save failed
    }

    return res.status(200).json({
      success: true,
      url: photoUrl,
      message: 'Photo uploaded successfully',
    });
  } catch (error) {
    console.error('[PhotoUploadAPI] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
