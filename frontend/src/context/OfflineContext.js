import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import api from '../api/client';
import {
  checkIsOnline,
  getPendingCounts,
  syncAllPending,
} from '../utils/offlineSync';

const OfflineContext = createContext(null);

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);

  // Initial load & listeners
  useEffect(() => {
    updateOnlineStatus();
    updatePendingCounts();

    // 1. Web event listeners for online/offline
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOnline = () => {
        setIsOnline(true);
        triggerAutoSync();
      };
      const handleOffline = () => {
        setIsOnline(false);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } else {
      // 2. Mobile periodic heartbeat check every 15s
      const interval = setInterval(() => {
        updateOnlineStatus();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, []);

  // Update online status
  const updateOnlineStatus = async () => {
    try {
      const online = await checkIsOnline();
      setIsOnline(online);
      if (online && pendingCount > 0) {
        triggerAutoSync();
      }
    } catch {
      setIsOnline(false);
    }
  };

  // Refresh pending count
  const updatePendingCounts = async () => {
    const counts = await getPendingCounts();
    setPendingCount(counts.totalCount);
    return counts;
  };

  // Auto sync on connection restore
  const triggerAutoSync = async () => {
    const counts = await getPendingCounts();
    if (counts.totalCount > 0 && !isSyncing) {
      syncNow();
    }
  };

  // Manual or automatic sync
  const syncNow = async () => {
    if (isSyncing) return;
    try {
      setIsSyncing(true);
      const result = await syncAllPending(api);
      setLastSyncResult(result);
      setPendingCount(result.remainingPending);
      return result;
    } catch (error) {
      console.error('Offline sync execution failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        pendingCount,
        isSyncing,
        lastSyncResult,
        syncNow,
        updatePendingCounts,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

export default OfflineContext;
