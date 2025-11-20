# Fixed Error: Property 'useTranslation' doesn't exist

## Issue
The app was crashing with error: `ReferenceError: Property 'useTranslation' doesn't exist` in Android.

## Root Cause
Two files (`app/settings.tsx` and `app/history.tsx`) were using `useTranslation()` hook but were missing the import statement.

## Fixes Applied

### 1. **Settings Screen (`app/settings.tsx`)**
**Missing Import:**
```typescript
import { useTranslation } from 'react-i18next';
```

**Fixed:** Added the missing import statement.

### 2. **History Screen (`app/history.tsx`)**
**Missing Import:**
```typescript
import { useTranslation } from 'react-i18next';
```

**Fixed:** Added the missing import statement.

## Files Updated

### `app/settings.tsx`
- Added: `import { useTranslation } from 'react-i18next';`

### `app/history.tsx`
- Added: `import { useTranslation } from 'react-i18next';`

## Verification
All files that use `useTranslation()` now have the proper import:
- ✅ `app/index.tsx` - Has import
- ✅ `app/onboarding.tsx` - Has import
- ✅ `app/result/[barcode].tsx` - Has import
- ✅ `app/history.tsx` - Fixed (added import)
- ✅ `app/settings.tsx` - Fixed (added import)
- ✅ `src/components/TrustScore.tsx` - Has import
- ✅ `src/components/EcoScore.tsx` - Has import
- ✅ `src/components/NutritionTable.tsx` - Has import

## Status
✅ **Fixed** - All files using `useTranslation()` now have proper imports

