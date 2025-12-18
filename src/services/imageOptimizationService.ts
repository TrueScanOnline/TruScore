/**
 * Image Optimization Service
 * Compresses and optimizes images before caching to reduce memory usage
 * 
 * Note: Requires expo-image-manipulator for full functionality
 * Install: npx expo install expo-image-manipulator
 */

import * as FileSystem from 'expo-file-system';
import { logger } from '../utils/logger';

// Try to import ImageManipulator (may not be installed)
let ImageManipulator: any = null;
try {
  ImageManipulator = require('expo-image-manipulator');
} catch {
  // Package not installed - will use fallback
  logger.debug('expo-image-manipulator not installed, using fallback image handling');
}

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'png' | 'jpeg' | 'jpg';
  maxFileSizeMB?: number;
}

const DEFAULT_OPTIONS: Required<Omit<ImageOptimizationOptions, 'format'>> & { format: 'jpeg' } = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.8,
  format: 'jpeg',
  maxFileSizeMB: 2,
};

/**
 * Optimize image for caching
 * Reduces image size while maintaining acceptable quality
 * 
 * @param uri - Source image URI (local file:// or remote http://)
 * @param options - Optimization options
 * @returns Optimized image URI
 */
export async function optimizeImageForCache(
  uri: string,
  options: ImageOptimizationOptions = {}
): Promise<string> {
  const {
    maxWidth = DEFAULT_OPTIONS.maxWidth,
    maxHeight = DEFAULT_OPTIONS.maxHeight,
    quality = DEFAULT_OPTIONS.quality,
    format = DEFAULT_OPTIONS.format,
    maxFileSizeMB = DEFAULT_OPTIONS.maxFileSizeMB,
  } = options;

  try {
    // If ImageManipulator is not available, return original URI
    if (!ImageManipulator) {
      logger.debug('ImageManipulator not available, returning original image');
      return uri;
    }

    // Check if image is already local
    if (uri.startsWith('file://')) {
      // Check file size first
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists && 'size' in fileInfo) {
        const sizeMB = fileInfo.size / (1024 * 1024);
        if (sizeMB <= maxFileSizeMB) {
          // File is already small enough, return as-is
          logger.debug(`Image already optimized (${sizeMB.toFixed(2)}MB): ${uri}`);
          return uri;
        }
      }
    }

    // Convert format string to ImageManipulator format
    const manipulatorFormat = format === 'png' 
      ? ImageManipulator.SaveFormat.PNG 
      : ImageManipulator.SaveFormat.JPEG;

    // Get image dimensions first
    const imageInfo = await ImageManipulator.manipulateAsync(
      uri,
      [], // No manipulation yet, just get info
      { format: manipulatorFormat }
    );

    // Calculate resize dimensions if needed
    let resize: { width?: number; height?: number } | undefined;
    if (imageInfo.width > maxWidth || imageInfo.height > maxHeight) {
      const aspectRatio = imageInfo.width / imageInfo.height;
      if (imageInfo.width > imageInfo.height) {
        resize = { width: maxWidth, height: Math.round(maxWidth / aspectRatio) };
      } else {
        resize = { height: maxHeight, width: Math.round(maxHeight * aspectRatio) };
      }
    }

    // Manipulate image (resize and compress)
    const manipulations: any[] = [];
    if (resize) {
      manipulations.push({ resize });
    }

    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      manipulations,
      { compress: quality, format: manipulatorFormat }
    );

    // Check final file size
    if (manipulated.uri.startsWith('file://')) {
      const fileInfo = await FileSystem.getInfoAsync(manipulated.uri);
      if (fileInfo.exists && 'size' in fileInfo) {
        const sizeMB = fileInfo.size / (1024 * 1024);
        logger.debug(`Image optimized: ${sizeMB.toFixed(2)}MB (from ${uri})`);
        
        // If still too large, reduce quality further
        if (sizeMB > maxFileSizeMB) {
          logger.warn(`Image still too large after optimization (${sizeMB.toFixed(2)}MB), reducing quality further`);
          const reducedQuality = Math.max(0.5, quality * 0.7);
          const reOptimized = await ImageManipulator.manipulateAsync(
            uri,
            manipulations,
            { compress: reducedQuality, format: manipulatorFormat }
          );
          return reOptimized.uri;
        }
      }
    }

    return manipulated.uri;
  } catch (error) {
    logger.error('Error optimizing image, returning original:', error);
    // Return original URI if optimization fails
    return uri;
  }
}

/**
 * Get estimated image size in MB
 */
export async function getImageSizeMB(uri: string): Promise<number | null> {
  try {
    if (uri.startsWith('file://')) {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists && 'size' in fileInfo) {
        return fileInfo.size / (1024 * 1024);
      }
    }
    return null;
  } catch (error) {
    logger.debug('Error getting image size:', error);
    return null;
  }
}

/**
 * Check if image needs optimization
 */
export async function needsOptimization(
  uri: string,
  maxFileSizeMB: number = DEFAULT_OPTIONS.maxFileSizeMB
): Promise<boolean> {
  const sizeMB = await getImageSizeMB(uri);
  if (sizeMB === null) {
    // Can't determine size, assume it needs optimization if it's a remote URL
    return uri.startsWith('http://') || uri.startsWith('https://');
  }
  return sizeMB > maxFileSizeMB;
}
