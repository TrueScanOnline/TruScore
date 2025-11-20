# Sentry Error Reporting Setup Guide

## Overview

Error reporting has been integrated into the TrueScan Food Scanner app. The app includes a graceful error reporting service that works with or without Sentry configured.

## Implementation Status

✅ **Error Reporting Service Created** (`src/services/errorReporting.ts`)
- Graceful degradation if Sentry not installed
- Automatic initialization on app startup
- Console fallback for development

✅ **Error Boundaries Added**
- Root-level Error Boundary
- Screen-level Error Boundaries
- Proper error UI with recovery options

## Installation

### Option 1: Install Sentry (Recommended for Production)

1. **Install Sentry packages:**
   ```bash
   yarn add @sentry/react-native
   ```

2. **Configure Sentry DSN in environment:**
   Create or update `.env` file:
   ```env
   EXPO_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
   ```

3. **Get your Sentry DSN:**
   - Sign up at https://sentry.io
   - Create a new project (React Native)
   - Copy your DSN from project settings

4. **Rebuild native code** (required for Sentry):
   ```bash
   npx expo prebuild
   npm run android  # or npm run ios
   ```

### Option 2: Use Without Sentry (Current State)

The app works perfectly without Sentry. Errors will be:
- Caught by Error Boundaries
- Displayed in user-friendly error UI
- Logged to console for debugging

## Features

### Error Boundaries
- **Root Boundary:** Catches app-wide errors
- **Screen Boundaries:** Isolate errors to specific screens
- **Recovery Options:** "Try Again" button to recover from errors

### Error Reporting Service
- **Automatic Initialization:** Runs on app startup
- **Graceful Degradation:** Works without Sentry
- **Context Tracking:** Adds user context and breadcrumbs
- **Error Grouping:** Automatically groups similar errors

## Usage

### Capture Exceptions Manually

```typescript
import { captureException } from '../src/services/errorReporting';

try {
  // Some operation
} catch (error) {
  captureException(error, {
    context: {
      barcode: '1234567890',
      action: 'fetchProduct',
    },
  });
}
```

### Add Breadcrumbs (User Actions)

```typescript
import { addBreadcrumb } from '../src/services/errorReporting';

addBreadcrumb('User scanned barcode', 'scan', 'info', { barcode: '1234567890' });
```

### Set User Context

```typescript
import { setUser } from '../src/services/errorReporting';

setUser({
  id: 'user-123',
  email: 'user@example.com',
});
```

## Testing Error Boundaries

1. **Simulate an error in a component:**
   ```typescript
   throw new Error('Test error');
   ```

2. **Expected behavior:**
   - Error Boundary catches the error
   - User-friendly error UI displays
   - Error logged to console (and Sentry if configured)
   - "Try Again" button allows recovery

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry DSN for error tracking | No (app works without it) |
| `SENTRY_DSN` | Alternative Sentry DSN variable | No |

## Production Considerations

1. **Enable Sentry in production builds only:**
   - Development: Errors logged to console
   - Production: Errors sent to Sentry

2. **Configure release tracking:**
   - Automatically track app versions
   - Filter errors by version

3. **Set up alerts:**
   - Get notified of critical errors
   - Monitor error rates

## Current Implementation

✅ Error Boundaries integrated
✅ Error reporting service created
✅ Graceful degradation implemented
✅ Error UI with recovery options

⚠️ **Sentry package not installed** (optional)
⚠️ **Sentry DSN not configured** (optional)

The app is fully functional without Sentry. Install and configure Sentry for production error tracking.

