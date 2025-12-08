// Camera Lifecycle Hook
// Stable, reliable camera state management for iOS and Android
// Event-driven, no timing-based patches

import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';

export type CameraState = 
  | 'idle'           // Initial state, camera not initialized
  | 'ready'          // Camera is ready and can scan
  | 'active'         // Camera is actively scanning
  | 'error';         // Camera error state

interface CameraLifecycleConfig {
  onStateChange?: (state: CameraState, previousState: CameraState) => void;
  onReady?: () => void;
  onError?: (error: Error) => void;
  autoActivate?: boolean; // Automatically activate when ready
}

interface CameraLifecycleReturn {
  state: CameraState;
  cameraKey: number;
  isActive: boolean;
  activate: () => void;
  deactivate: () => void;
  remount: () => void;
  reset: () => void;
  handleCameraReady: () => void;
  handleCameraError: (error: Error) => void;
}

/**
 * Camera Lifecycle Hook
 * Stable, event-driven camera state management
 * Works reliably on both iOS and Android
 */
export function useCameraLifecycle(
  hasPermission: boolean,
  config: CameraLifecycleConfig = {}
): CameraLifecycleReturn {
  const { onStateChange, onReady, onError, autoActivate = true } = config;
  
  const [state, setState] = useState<CameraState>('idle');
  const [cameraKey, setCameraKey] = useState(0);
  const previousStateRef = useRef<CameraState>('idle');
  const isMountedRef = useRef(true);
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track previous permission to detect actual changes
  const prevPermissionRef = useRef(hasPermission);

  // Update previous state when state changes and notify callback
  useEffect(() => {
    if (previousStateRef.current !== state) {
      const previous = previousStateRef.current;
      previousStateRef.current = state;
      onStateChange?.(state, previous);
      logger.debug(`[CameraLifecycle] State transition: ${previous} → ${state}`);
    }
  }, [state, onStateChange]);

  // Handle permission changes - SINGLE SOURCE OF TRUTH for initialization
  useEffect(() => {
    // Only react if permission actually changed
    if (prevPermissionRef.current === hasPermission) {
      return;
    }
    
    const prevPermission = prevPermissionRef.current;
    prevPermissionRef.current = hasPermission;
    
    // Clear any pending initialization timeout
    if (initializationTimeoutRef.current) {
      clearTimeout(initializationTimeoutRef.current);
      initializationTimeoutRef.current = null;
    }
    
    if (!hasPermission) {
      // Permission revoked - reset to idle
      setState(prevState => {
        if (prevState !== 'idle') {
          logger.debug('[CameraLifecycle] Permission revoked, resetting to idle');
          return 'idle';
        }
        return prevState;
      });
      setCameraKey(0);
      return;
    }

    // Permission granted - initialize camera
    if (prevPermission === false && hasPermission === true) {
      logger.debug('[CameraLifecycle] Permission granted, initializing camera');
      
      // Reset camera key to force remount
      setCameraKey(prev => prev + 1);
      
      // Set state to ready (CameraView will mount and call onCameraReady)
      // We start as 'ready' because CameraView will be rendered
      setState('ready');
    }
  }, [hasPermission]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
        initializationTimeoutRef.current = null;
      }
    };
  }, []);

  /**
   * Activate camera (start scanning)
   */
  const activate = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setState(prevState => {
      if (prevState === 'ready' || prevState === 'error') {
        logger.debug('[CameraLifecycle] Activating camera');
        return 'active';
      }
      // If idle and has permission, initialize first
      if (prevState === 'idle' && hasPermission) {
        logger.debug('[CameraLifecycle] Activating from idle, initializing');
        setCameraKey(prev => prev + 1);
        return 'ready';
      }
      return prevState;
    });
  }, [hasPermission]);

  /**
   * Deactivate camera (pause scanning)
   */
  const deactivate = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setState(prevState => {
      if (prevState === 'active') {
        logger.debug('[CameraLifecycle] Deactivating camera');
        return 'ready';
      }
      return prevState;
    });
  }, []);

  /**
   * Remount camera (force reinitialization)
   * Platform-aware: Android may need a brief moment
   */
  const remount = useCallback(() => {
    if (!isMountedRef.current) return;
    
    logger.debug('[CameraLifecycle] Remounting camera');
    
    // Reset to idle first
    setState('idle');
    
    // Platform-specific remount delay (Android sometimes needs a moment)
    const delay = Platform.OS === 'android' ? 100 : 0;
    
    if (delay > 0) {
      initializationTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && hasPermission) {
          setCameraKey(prev => prev + 1);
          setState('ready');
        }
      }, delay);
    } else {
      // iOS: immediate remount
      if (hasPermission) {
        setCameraKey(prev => prev + 1);
        setState('ready');
      }
    }
  }, [hasPermission]);

  /**
   * Reset camera to initial state
   */
  const reset = useCallback(() => {
    if (!isMountedRef.current) return;
    
    if (initializationTimeoutRef.current) {
      clearTimeout(initializationTimeoutRef.current);
      initializationTimeoutRef.current = null;
    }
    
    setState('idle');
    setCameraKey(0);
    logger.debug('[CameraLifecycle] Camera reset');
  }, []);

  /**
   * Handle camera ready event
   * This is called by CameraView's onCameraReady callback
   */
  const handleCameraReady = useCallback(() => {
    if (!isMountedRef.current) return;
    
    logger.debug('[CameraLifecycle] Camera ready callback received');
    
    setState(prevState => {
      if (prevState === 'ready' || prevState === 'idle') {
        logger.debug('[CameraLifecycle] Camera is ready');
        onReady?.();
        
        // Auto-activate if configured
        if (autoActivate) {
          // Use microtask to ensure state update completes first
          Promise.resolve().then(() => {
            if (isMountedRef.current) {
              setState('active');
            }
          });
        }
        
        return autoActivate ? 'active' : 'ready';
      }
      // If already active or error, don't change
      return prevState;
    });
  }, [autoActivate, onReady]);

  /**
   * Handle camera error event
   */
  const handleCameraError = useCallback((error: Error) => {
    if (!isMountedRef.current) return;
    
    logger.error('[CameraLifecycle] Camera error:', error);
    setState('error');
    onError?.(error);
  }, [onError]);

  const isActive = state === 'active';

  return {
    state,
    cameraKey,
    isActive,
    activate,
    deactivate,
    remount,
    reset,
    handleCameraReady,
    handleCameraError,
  };
}

/**
 * Platform-specific camera configuration
 */
export const cameraConfig = {
  android: {
    remountDelay: 100, // Android sometimes needs a brief moment
    autoActivate: true,
  },
  ios: {
    remountDelay: 0, // iOS is typically immediate
    autoActivate: true,
  },
} as const;

/**
 * Get platform-specific camera config
 */
export function getCameraConfig() {
  return Platform.OS === 'android' ? cameraConfig.android : cameraConfig.ios;
}
