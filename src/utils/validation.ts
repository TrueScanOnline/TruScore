// Input validation utilities - prevents XSS, injection, and data corruption
import { z } from 'zod';

// ISO 3166-1 alpha-2 country codes (subset of most common)
export const VALID_COUNTRY_CODES = [
  'US', 'GB', 'NZ', 'AU', 'CA', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI',
  'PL', 'CZ', 'IE', 'PT', 'GR', 'HU', 'RO', 'BG', 'HR', 'SK', 'SI', 'LT', 'LV', 'EE', 'LU', 'MT', 'CY',
  'JP', 'CN', 'KR', 'IN', 'SG', 'MY', 'TH', 'VN', 'PH', 'ID', 'TW', 'HK', 'MO', 'BN', 'KH', 'LA', 'MM',
  'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'UY', 'PY', 'BO', 'CR', 'PA', 'GT', 'HN', 'NI', 'SV',
  'DO', 'CU', 'JM', 'TT', 'BB', 'BS', 'BZ', 'GY', 'SR', 'GF', 'ZA', 'EG', 'NG', 'KE', 'GH', 'TZ', 'ET',
  'IL', 'PS', 'AE', 'SA', 'KW', 'QA', 'BH', 'OM', 'YE', 'IQ', 'JO', 'LB', 'SY', 'TR', 'IR', 'PK', 'BD',
  'LK', 'MV', 'NP', 'BT', 'AF', 'RU', 'UA', 'BY', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'MN', 'GE', 'AM', 'AZ',
] as const;

// Country code validation schema
export const CountryCodeSchema = z.enum(VALID_COUNTRY_CODES as unknown as [string, ...string[]]);

// Barcode validation (EAN-13, UPC-A, etc.)
export const BarcodeSchema = z.string()
  .regex(/^\d{8,14}$/, 'Barcode must be 8-14 digits')
  .min(8)
  .max(14);

// Text sanitization - removes potentially dangerous characters
export function sanitizeText(input: string | null | undefined, maxLength = 500): string {
  if (!input) return '';
  
  // Remove null bytes and control characters (except newlines and tabs)
  let sanitized = input
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
    .trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

// URL validation and sanitization
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    // Only allow http/https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

// Validate country code
export function validateCountryCode(code: string): boolean {
  const upperCode = code.toUpperCase();
  return (VALID_COUNTRY_CODES as readonly string[]).includes(upperCode);
}

// Validate barcode format
export function validateBarcode(barcode: string): boolean {
  return BarcodeSchema.safeParse(barcode).success;
}

// Rate limiting helper
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside window
    const recentRequests = requests.filter(time => now - time < this.windowMs);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    return true;
  }
  
  reset(key: string): void {
    this.requests.delete(key);
  }
}

// Input validation for manufacturing country submission
export interface ValidatedCountrySubmission {
  barcode: string;
  country: string;
  photoUrl?: string | null;
}

export function validateCountrySubmission(
  barcode: string,
  country: string,
  photoUrl?: string | null
): { valid: boolean; data?: ValidatedCountrySubmission; error?: string } {
  // Validate barcode
  if (!validateBarcode(barcode)) {
    return { valid: false, error: 'Invalid barcode format' };
  }
  
  // Validate country
  const normalizedCountry = country.trim().toUpperCase();
  if (!normalizedCountry || normalizedCountry.length < 2 || normalizedCountry.length > 100) {
    return { valid: false, error: 'Invalid country name' };
  }
  
  // Validate country code if it's a 2-letter code
  if (normalizedCountry.length === 2 && !validateCountryCode(normalizedCountry)) {
    return { valid: false, error: 'Invalid country code' };
  }
  
  // Sanitize country name
  const sanitizedCountry = sanitizeText(normalizedCountry, 100);
  
  // Validate photo URL if provided
  let sanitizedPhotoUrl: string | null = null;
  if (photoUrl) {
    sanitizedPhotoUrl = sanitizeUrl(photoUrl);
    if (!sanitizedPhotoUrl) {
      return { valid: false, error: 'Invalid photo URL' };
    }
  }
  
  return {
    valid: true,
    data: {
      barcode,
      country: sanitizedCountry,
      photoUrl: sanitizedPhotoUrl,
    },
  };
}

