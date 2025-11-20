// Error Reporting Service
// Integrates with Sentry for production error tracking
// Gracefully degrades if Sentry is not configured

interface ErrorContext {
  [key: string]: any;
}

class ErrorReportingService {
  private isInitialized = false;
  private sentry: any = null;

  /**
   * Initialize error reporting (Sentry)
   * Should be called early in app lifecycle
   * 
   * NOTE: This will only work if @sentry/react-native is installed.
   * If Sentry is not installed, this will gracefully fail and the app will continue.
   */
  async initialize() {
    // Temporarily disabled - uncomment when @sentry/react-native is installed
    // Metro bundler requires the module to exist for static analysis
    // 
    // To enable Sentry:
    // 1. Install: yarn add @sentry/react-native
    // 2. Uncomment the code below
    // 3. Configure EXPO_PUBLIC_SENTRY_DSN in .env
    
    console.log('[ErrorReporting] Sentry initialization skipped (not installed)');
    this.sentry = null;
    this.isInitialized = false;
    return false;
    
    /* 
    // UNCOMMENT WHEN SENTRY IS INSTALLED:
    try {
      const Sentry = require('@sentry/react-native');
      if (Sentry && Sentry.init) {
        const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
        
        if (SENTRY_DSN && SENTRY_DSN !== 'YOUR_SENTRY_DSN') {
          Sentry.init({
            dsn: SENTRY_DSN,
            enableInExpoDevelopment: false,
            debug: __DEV__,
            environment: __DEV__ ? 'development' : 'production',
            tracesSampleRate: __DEV__ ? 1.0 : 0.1,
            enableAutoSessionTracking: true,
            sessionTrackingIntervalMillis: 30000,
          });
          
          this.sentry = Sentry;
          this.isInitialized = true;
          console.log('[ErrorReporting] Sentry initialized successfully');
          return true;
        }
      }
    } catch (error) {
      console.log('[ErrorReporting] Sentry not available');
      this.sentry = null;
      this.isInitialized = false;
    }
    return false;
    */
  }

  /**
   * Capture an exception/error
   */
  captureException(error: Error, context?: ErrorContext) {
    try {
      if (this.sentry && this.isInitialized) {
        if (context) {
          this.sentry.withScope((scope: any) => {
            Object.keys(context).forEach(key => {
              scope.setContext(key, context[key]);
            });
            this.sentry.captureException(error);
          });
        } else {
          this.sentry.captureException(error);
        }
      } else {
        // Fallback to console in development or if Sentry not available
        console.error('[ErrorReporting] Error captured (Sentry not available):', error, context);
      }
    } catch (reportingError) {
      console.error('[ErrorReporting] Failed to capture error:', reportingError);
    }
  }

  /**
   * Capture a message (for non-error events)
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
    try {
      if (this.sentry && this.isInitialized) {
        if (context) {
          this.sentry.withScope((scope: any) => {
            Object.keys(context).forEach(key => {
              scope.setContext(key, context[key]);
            });
            this.sentry.captureMessage(message, level);
          });
        } else {
          this.sentry.captureMessage(message, level);
        }
      } else {
        // Fallback to console
        console.log(`[ErrorReporting] ${level.toUpperCase()}: ${message}`, context);
      }
    } catch (reportingError) {
      console.error('[ErrorReporting] Failed to capture message:', reportingError);
    }
  }

  /**
   * Set user context (for tracking which user encountered the error)
   */
  setUser(user: { id?: string; email?: string; username?: string }) {
    try {
      if (this.sentry && this.isInitialized) {
        this.sentry.setUser(user);
      }
    } catch (error) {
      console.error('[ErrorReporting] Failed to set user:', error);
    }
  }

  /**
   * Add breadcrumb (for tracking user actions leading to error)
   */
  addBreadcrumb(message: string, category: string, level: 'info' | 'warning' | 'error' = 'info', data?: any) {
    try {
      if (this.sentry && this.isInitialized) {
        this.sentry.addBreadcrumb({
          message,
          category,
          level,
          data,
          timestamp: Date.now() / 1000,
        });
      }
    } catch (error) {
      console.error('[ErrorReporting] Failed to add breadcrumb:', error);
    }
  }

  /**
   * Set extra context (for additional error context)
   */
  setContext(key: string, context: any) {
    try {
      if (this.sentry && this.isInitialized) {
        this.sentry.setContext(key, context);
      }
    } catch (error) {
      console.error('[ErrorReporting] Failed to set context:', error);
    }
  }

  /**
   * Check if error reporting is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.sentry !== null;
  }
}

// Export singleton instance
export const errorReporting = new ErrorReportingService();

// Export convenience functions
export const captureException = (error: Error, context?: ErrorContext) => {
  errorReporting.captureException(error, context);
};

export const captureMessage = (message: string, level?: 'info' | 'warning' | 'error', context?: ErrorContext) => {
  errorReporting.captureMessage(message, level, context);
};

export const setUser = (user: { id?: string; email?: string; username?: string }) => {
  errorReporting.setUser(user);
};

export const addBreadcrumb = (message: string, category: string, level?: 'info' | 'warning' | 'error', data?: any) => {
  errorReporting.addBreadcrumb(message, category, level, data);
};

export default errorReporting;

