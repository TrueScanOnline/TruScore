/**
 * Circuit Breaker Service
 * Prevents querying failing APIs repeatedly
 * Fails fast when network is unreliable
 */

import { logger } from '../utils/logger';

interface CircuitState {
  failures: number;
  lastFailureTime: number;
  isOpen: boolean;
  successCount: number;
}

const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 3, // Open circuit after 3 failures
  successThreshold: 2, // Close circuit after 2 successes
  timeout: 60000, // 60 seconds before retry
};

const circuitStates = new Map<string, CircuitState>();

/**
 * Check if circuit is open for a source
 */
export function isCircuitOpen(source: string): boolean {
  const state = circuitStates.get(source);
  if (!state) return false;
  
  if (state.isOpen) {
    const timeSinceFailure = Date.now() - state.lastFailureTime;
    if (timeSinceFailure > CIRCUIT_BREAKER_CONFIG.timeout) {
      // Timeout expired, allow retry
      logger.debug(`[CircuitBreaker] ${source}: Timeout expired, allowing retry`);
      state.isOpen = false;
      state.failures = 0;
      state.successCount = 0;
      return false;
    }
    return true;
  }
  
  return false;
}

/**
 * Record a failure for a source
 */
export function recordFailure(source: string): void {
  const state = circuitStates.get(source) || {
    failures: 0,
    lastFailureTime: 0,
    isOpen: false,
    successCount: 0,
  };
  
  state.failures++;
  state.lastFailureTime = Date.now();
  state.successCount = 0;
  
  if (state.failures >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
    state.isOpen = true;
    logger.warn(`[CircuitBreaker] ${source}: Circuit OPEN (${state.failures} failures)`);
  }
  
  circuitStates.set(source, state);
}

/**
 * Record a success for a source
 */
export function recordSuccess(source: string): void {
  const state = circuitStates.get(source) || {
    failures: 0,
    lastFailureTime: 0,
    isOpen: false,
    successCount: 0,
  };
  
  state.successCount++;
  state.failures = 0; // Reset failures on success
  
  if (state.isOpen && state.successCount >= CIRCUIT_BREAKER_CONFIG.successThreshold) {
    state.isOpen = false;
    logger.info(`[CircuitBreaker] ${source}: Circuit CLOSED (${state.successCount} successes)`);
  }
  
  circuitStates.set(source, state);
}

/**
 * Reset circuit breaker for a source (for testing or manual reset)
 */
export function resetCircuit(source: string): void {
  circuitStates.delete(source);
  logger.debug(`[CircuitBreaker] ${source}: Circuit reset`);
}

/**
 * Get circuit breaker status for debugging
 */
export function getCircuitStatus(source: string): CircuitState | null {
  return circuitStates.get(source) || null;
}

