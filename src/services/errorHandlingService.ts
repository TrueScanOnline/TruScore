/**
 * Centralized Error Handling Service
 * 
 * Provides consistent error handling patterns across the application.
 * Ensures all errors are properly logged, reported, and user-friendly messages are displayed.
 * 
 * @module errorHandlingService
 */

import { logger } from '../utils/logger';
import { Platform } from 'react-native';

/**
 * Error categories for better error classification
 */
export enum ErrorCategory {
  NETWORK = 'network',
  DATABASE = 'database',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  API = 'api',
  UNKNOWN = 'unknown',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Standardized error structure
 */
export interface AppError {
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  code?: string;
  originalError?: Error | unknown;
  context?: Record<string, unknown>;
  timestamp: number;
  platform: 'ios' | 'android' | 'web';
}

/**
 * User-friendly error messages
 */
const USER_ERROR_MESSAGES: Record<ErrorCategory, string> = {
  [ErrorCategory.NETWORK]: 'Network connection issue. Please check your internet connection and try again.',
  [ErrorCategory.DATABASE]: 'Unable to access product database. Please try again.',
  [ErrorCategory.VALIDATION]: 'Invalid input. Please check your entry and try again.',
  [ErrorCategory.PERMISSION]: 'Permission required. Please enable in Settings.',
  [ErrorCategory.API]: 'Service temporarily unavailable. Please try again later.',
  [ErrorCategory.UNKNOWN]: 'An unexpected error occurred. Please try again.',
};

/**
 * Create a standardized error object
 */
export function createAppError(
  error: Error | unknown,
  category: ErrorCategory = ErrorCategory.UNKNOWN,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  context?: Record<string, unknown>
): AppError {
  const message = error instanceof Error ? error.message : String(error);
  const originalError = error instanceof Error ? error : new Error(String(error));

  return {
    message,
    category,
    severity,
    originalError,
    context,
    timestamp: Date.now(),
    platform: Platform.OS as 'ios' | 'android' | 'web',
  };
}

/**
 * Get user-friendly error message
 */
export function getUserErrorMessage(error: AppError | ErrorCategory): string {
  if (typeof error === 'string') {
    return USER_ERROR_MESSAGES[error] || USER_ERROR_MESSAGES[ErrorCategory.UNKNOWN];
  }
  return USER_ERROR_MESSAGES[error.category] || USER_ERROR_MESSAGES[ErrorCategory.UNKNOWN];
}

/**
 * Log error with appropriate level
 */
export function logError(error: AppError, additionalContext?: Record<string, unknown>): void {
  const logContext = {
    ...error.context,
    ...additionalContext,
    platform: error.platform,
    timestamp: new Date(error.timestamp).toISOString(),
  };

  switch (error.severity) {
    case ErrorSeverity.CRITICAL:
      logger.error(`[CRITICAL] ${error.message}`, logContext);
      break;
    case ErrorSeverity.HIGH:
      logger.error(`[HIGH] ${error.message}`, logContext);
      break;
    case ErrorSeverity.MEDIUM:
      logger.warn(`[MEDIUM] ${error.message}`, logContext);
      break;
    case ErrorSeverity.LOW:
      logger.debug(`[LOW] ${error.message}`, logContext);
      break;
  }

  // Log original error if available
  if (error.originalError instanceof Error && error.originalError.stack) {
    logger.debug('Original error stack:', error.originalError.stack);
  }
}

/**
 * Handle error with logging and optional reporting
 */
export function handleError(
  error: Error | unknown,
  category: ErrorCategory = ErrorCategory.UNKNOWN,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  context?: Record<string, unknown>
): AppError {
  const appError = createAppError(error, category, severity, context);
  logError(appError);
  return appError;
}

/**
 * Handle network errors specifically
 */
export function handleNetworkError(error: Error | unknown, context?: Record<string, unknown>): AppError {
  return handleError(error, ErrorCategory.NETWORK, ErrorSeverity.MEDIUM, context);
}

/**
 * Handle database errors specifically
 */
export function handleDatabaseError(error: Error | unknown, context?: Record<string, unknown>): AppError {
  return handleError(error, ErrorCategory.DATABASE, ErrorSeverity.HIGH, context);
}

/**
 * Handle validation errors specifically
 */
export function handleValidationError(error: Error | unknown, context?: Record<string, unknown>): AppError {
  return handleError(error, ErrorCategory.VALIDATION, ErrorSeverity.LOW, context);
}

/**
 * Handle permission errors specifically
 */
export function handlePermissionError(error: Error | unknown, context?: Record<string, unknown>): AppError {
  return handleError(error, ErrorCategory.PERMISSION, ErrorSeverity.MEDIUM, context);
}

/**
 * Handle API errors specifically
 */
export function handleApiError(error: Error | unknown, context?: Record<string, unknown>): AppError {
  return handleError(error, ErrorCategory.API, ErrorSeverity.MEDIUM, context);
}

/**
 * Safe async wrapper - catches and handles errors automatically
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback: T,
  category: ErrorCategory = ErrorCategory.UNKNOWN,
  context?: Record<string, unknown>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    handleError(error, category, ErrorSeverity.MEDIUM, context);
    return fallback;
  }
}

/**
 * Safe sync wrapper - catches and handles errors automatically
 */
export function safeSync<T>(
  fn: () => T,
  fallback: T,
  category: ErrorCategory = ErrorCategory.UNKNOWN,
  context?: Record<string, unknown>
): T {
  try {
    return fn();
  } catch (error) {
    handleError(error, category, ErrorSeverity.MEDIUM, context);
    return fallback;
  }
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    );
  }
  return false;
}

/**
 * Check if error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('timeout') || message.includes('timed out');
  }
  return false;
}

/**
 * Retry wrapper with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  context?: Record<string, unknown>
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on validation errors
      if (error instanceof Error && error.message.includes('validation')) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        break;
      }
      
      // Exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);
      logger.debug(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, context);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All retries failed
  handleError(lastError, ErrorCategory.API, ErrorSeverity.HIGH, {
    ...context,
    retries: maxRetries,
  });
  
  throw lastError;
}

