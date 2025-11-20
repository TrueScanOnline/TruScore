# Fixed Type Error: Cannot read property 'split' of undefined

## Issue
The app was crashing with error: `TypeError: Cannot read property 'split' of undefined` in the Hermes JavaScript engine.

## Root Cause
The error occurred in the i18n initialization code where `Localization.locale` could be `undefined` or `null` in some cases, causing `.split()` to fail.

## Fixes Applied

### 1. **i18n Initialization (`src/i18n/index.ts`)**
- Added safe language detection with try-catch
- Added checks for `Localization.locale` being undefined/null
- Added fallback to `Localization.locales?.[0]?.languageCode`
- Added type checking and string validation
- Only returns supported languages (en, es, fr), defaults to 'en'

### 2. **Open Food Facts Service (`src/services/openFoodFacts.ts`)**
- Added type checks for `product.origins` before calling `.split()`
- Added type checks for tag arrays before accessing elements
- Added safe string operations with optional chaining

### 3. **CountryFlag Component (`src/components/CountryFlag.tsx`)**
- Added type check for `country` parameter in `formatCountryName()`
- Added null/undefined check before calling `.split()`
- Returns 'Unknown' if country is not a valid string

## Changes Made

### `src/i18n/index.ts`
```typescript
// Before:
const deviceLanguage = Localization.locale.split('-')[0];

// After:
const getDeviceLanguage = (): string => {
  try {
    const locale = Localization.locale || Localization.locales?.[0]?.languageCode;
    if (!locale) return 'en';
    
    const localeString = typeof locale === 'string' ? locale : locale.toString();
    const languageCode = localeString.split('-')[0] || localeString.split('_')[0];
    
    if (['en', 'es', 'fr'].includes(languageCode)) {
      return languageCode;
    }
    return 'en';
  } catch (error) {
    console.error('Error detecting device language:', error);
    return 'en';
  }
};
```

### `src/services/openFoodFacts.ts`
- Added type checks before string operations
- Added optional chaining for array access
- Added validation for string types

### `src/components/CountryFlag.tsx`
- Added type validation in `formatCountryName()` function
- Added null/undefined checks before string operations

## Testing
The app should now handle cases where:
- `Localization.locale` is undefined or null
- Product data has missing or invalid string fields
- Country codes are in unexpected formats

## Status
✅ **Fixed** - All `.split()` calls now have proper null/undefined checks and type validation

