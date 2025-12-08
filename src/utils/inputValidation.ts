// Input validation utilities
// Validates and sanitizes user inputs to prevent security issues

import { logger } from './logger';

/**
 * Validate barcode format
 * Supports EAN-8, EAN-13, UPC-A, UPC-E formats
 */
export function validateBarcode(barcode: string): {
  isValid: boolean;
  normalized?: string;
  error?: string;
} {
  if (!barcode || typeof barcode !== 'string') {
    return {
      isValid: false,
      error: 'Barcode must be a non-empty string',
    };
  }

  // Remove whitespace and non-digit characters (except leading zeros)
  const cleaned = barcode.trim().replace(/[^\d]/g, '');

  if (cleaned.length === 0) {
    return {
      isValid: false,
      error: 'Barcode must contain at least one digit',
    };
  }

  // Check length (EAN-8: 8, EAN-13: 13, UPC-A: 12, UPC-E: 8)
  const validLengths = [8, 12, 13];
  if (!validLengths.includes(cleaned.length)) {
    return {
      isValid: false,
      error: `Barcode must be 8, 12, or 13 digits (got ${cleaned.length})`,
    };
  }

  // Validate checksum for EAN-13 and EAN-8
  if (cleaned.length === 13 || cleaned.length === 8) {
    if (!validateEANChecksum(cleaned)) {
      return {
        isValid: false,
        error: 'Invalid barcode checksum',
      };
    }
  }

  // Validate checksum for UPC-A
  if (cleaned.length === 12) {
    if (!validateUPCChecksum(cleaned)) {
      return {
        isValid: false,
        error: 'Invalid UPC checksum',
      };
    }
  }

  return {
    isValid: true,
    normalized: cleaned,
  };
}

/**
 * Validate EAN checksum (EAN-8 and EAN-13)
 */
function validateEANChecksum(barcode: string): boolean {
  const digits = barcode.split('').map(Number);
  const checkDigit = digits.pop()!;
  
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  
  const calculatedCheck = (10 - (sum % 10)) % 10;
  return calculatedCheck === checkDigit;
}

/**
 * Validate UPC checksum (UPC-A)
 */
function validateUPCChecksum(barcode: string): boolean {
  const digits = barcode.split('').map(Number);
  const checkDigit = digits.pop()!;
  
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 3 : 1);
  }
  
  const calculatedCheck = (10 - (sum % 10)) % 10;
  return calculatedCheck === checkDigit;
}

/**
 * Sanitize search query
 * Removes potentially dangerous characters and limits length
 */
export function sanitizeSearchQuery(query: string, maxLength: number = 100): string {
  if (!query || typeof query !== 'string') {
    return '';
  }

  // Trim and limit length
  let sanitized = query.trim().substring(0, maxLength);

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Remove SQL injection patterns (basic)
  sanitized = sanitized.replace(/['";\\]/g, '');

  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  return sanitized;
}

/**
 * Validate deep link URL
 */
export function validateDeepLink(url: string): {
  isValid: boolean;
  barcode?: string;
  error?: string;
} {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'URL must be a non-empty string',
    };
  }

  try {
    const parsed = new URL(url);
    
    // Check if it's a TrueScan deep link
    // Handle both custom scheme (truescan://) and https://truescan.app
    const protocol = parsed.protocol.toLowerCase();
    const isCustomScheme = protocol === 'truescan:';
    const isHttpsScheme = protocol === 'https:' && parsed.host === 'truescan.app';
    
    if (isCustomScheme || isHttpsScheme) {
      // Extract barcode from path
      const pathMatch = parsed.pathname.match(/\/barcode\/(\d+)/);
      if (pathMatch && pathMatch[1]) {
        const barcodeValidation = validateBarcode(pathMatch[1]);
        if (barcodeValidation.isValid) {
          return {
            isValid: true,
            barcode: barcodeValidation.normalized,
          };
        }
        return {
          isValid: false,
          error: barcodeValidation.error,
        };
      }
    }

    return {
      isValid: false,
      error: 'Invalid deep link format',
    };
  } catch (error) {
    logger.error('Error validating deep link', error);
    return {
      isValid: false,
      error: 'Invalid URL format',
    };
  }
}

/**
 * Validate product name
 */
export function validateProductName(name: string, maxLength: number = 200): {
  isValid: boolean;
  sanitized?: string;
  error?: string;
} {
  if (!name || typeof name !== 'string') {
    return {
      isValid: false,
      error: 'Product name must be a non-empty string',
    };
  }

  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: 'Product name cannot be empty',
    };
  }

  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      error: `Product name must be less than ${maxLength} characters`,
    };
  }

  // Remove control characters
  const sanitized = trimmed.replace(/[\x00-\x1F\x7F]/g, '');

  return {
    isValid: true,
    sanitized,
  };
}

/**
 * Validate email (for user submissions)
 */
export function validateEmail(email: string): {
  isValid: boolean;
  error?: string;
} {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: 'Email must be a non-empty string',
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Invalid email format',
    };
  }

  if (email.length > 254) {
    return {
      isValid: false,
      error: 'Email must be less than 254 characters',
    };
  }

  return {
    isValid: true,
  };
}
