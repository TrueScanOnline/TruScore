// Timeout Helper Utility
// Provides AbortSignal.timeout() compatibility for React Native
// AbortSignal.timeout() is not available in React Native, so we provide a polyfill

/**
 * Create an AbortSignal that times out after the specified milliseconds
 * Polyfill for AbortSignal.timeout() which is not available in React Native
 */
export function createTimeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  
  // Set timeout to abort after specified milliseconds
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, ms);
  
  // Store timeout ID for potential cleanup
  (controller.signal as any)._timeoutId = timeoutId;
  
  return controller.signal;
}

/**
 * Fetch with timeout wrapper
 * Provides a simple way to add timeout to fetch requests
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const signal = createTimeoutSignal(timeoutMs);
  
  // Merge with existing signal if provided
  if (options.signal) {
    // If both signals exist, abort when either one aborts
    const existingSignal = options.signal;
    const abortHandler = () => {
      if (!signal.aborted) {
        controller.abort();
      }
    };
    existingSignal.addEventListener('abort', abortHandler);
    
    // Clean up listener when our signal aborts
    signal.addEventListener('abort', () => {
      existingSignal.removeEventListener('abort', abortHandler);
    });
  }
  
  return fetch(url, {
    ...options,
    signal,
  });
}

