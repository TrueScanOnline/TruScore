import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { isPremiumFeatureEnabled, PremiumFeature } from '../utils/premiumFeatures';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

/**
 * Hook to monitor network status
 * Premium users get enhanced offline mode support
 */
export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
  });
  const { subscriptionInfo } = useSubscriptionStore();
  const canUseOfflineMode = isPremiumFeatureEnabled(PremiumFeature.OFFLINE_MODE, subscriptionInfo);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? null,
        type: state.type,
      });
    });

    // Get initial network state
    NetInfo.fetch().then((state) => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? null,
        type: state.type,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const isOffline = !networkStatus.isConnected || networkStatus.isInternetReachable === false;
  const isOnline = networkStatus.isConnected && networkStatus.isInternetReachable !== false;

  return {
    ...networkStatus,
    isOffline,
    isOnline,
    canUseOfflineMode,
    isOfflineModeEnabled: canUseOfflineMode && isOffline,
  };
}

