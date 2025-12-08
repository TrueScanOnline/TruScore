# Console.log Migration Status

This document tracks the migration of `console.log/warn/error` statements to the centralized `logger` utility.

## Migration Strategy

- `console.log` → `logger.debug()` (for debug messages) or `logger.info()` (for informational messages)
- `console.warn` → `logger.warn()`
- `console.error` → `logger.error()`

## Files Migrated ✅

1. **src/services/cacheService.ts** - All console statements migrated
2. **src/services/barcodeMonsterApi.ts** - All console statements migrated

## Files Remaining (60 files)

The following files still contain console statements and should be migrated:

### Services (High Priority)
- src/services/manualProductService.ts
- src/services/webScrapingService.ts
- src/services/webSearchFallback.ts
- src/services/pricingService.ts
- src/services/userPriceSubmission.ts
- src/services/errorReporting.ts
- ... (and 50+ more service files)

### Components
- src/components/FSANZDatabaseImportModal.tsx
- src/components/GlobalPricingCard.tsx
- src/components/ManualProductEntryModal.tsx
- ... (and 10+ more component files)

### Stores
- src/store/useSubscriptionStore.ts
- src/store/useSettingsStore.ts
- src/store/useScanStore.ts
- src/store/useFavoritesStore.ts
- src/store/useValuesStore.ts

## Migration Pattern

For each file:
1. Import logger: `import { logger } from '../utils/logger';` (adjust path as needed)
2. Replace console statements:
   ```typescript
   // Before
   console.log('Debug message');
   console.warn('Warning message');
   console.error('Error message', error);
   
   // After
   logger.debug('Debug message');
   logger.warn('Warning message');
   logger.error('Error message', error);
   ```

## Benefits

- Centralized logging with log levels
- Automatic sanitization of sensitive data
- Production builds can strip debug logs
- Consistent logging format across the app

## Next Steps

Continue migrating remaining files, prioritizing:
1. Service files (most console usage)
2. Store files (state management)
3. Component files (UI logic)
