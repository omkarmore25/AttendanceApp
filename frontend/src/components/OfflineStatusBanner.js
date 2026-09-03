import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useOffline } from '../context/OfflineContext';
import theme from '../theme';

/**
 * Non-intrusive floating Offline / Sync status badge
 */
const OfflineStatusBanner = () => {
  const { isOnline, pendingCount, isSyncing, lastSyncResult, syncNow } = useOffline();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (lastSyncResult && lastSyncResult.totalSynced > 0) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [lastSyncResult]);

  // Don't show if online with nothing pending and not recently synced
  if (isOnline && pendingCount === 0 && !isSyncing && !showSuccess) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.badge,
          !isOnline && styles.badgeOffline,
          isSyncing && styles.badgeSyncing,
          showSuccess && styles.badgeSuccess,
        ]}
      >
        {isSyncing ? (
          <View style={styles.row}>
            <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
            <Text style={styles.text}>Syncing records with cloud...</Text>
          </View>
        ) : showSuccess ? (
          <View style={styles.row}>
            <Text style={styles.icon}>🟢</Text>
            <Text style={styles.text}>
              {lastSyncResult.totalSynced} record(s) synced successfully!
            </Text>
          </View>
        ) : !isOnline ? (
          <View style={styles.row}>
            <Text style={styles.icon}>🟠</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Offline Mode</Text>
              <Text style={styles.subtext}>
                {pendingCount > 0
                  ? `${pendingCount} record(s) saved locally`
                  : 'New entries will be saved locally'}
              </Text>
            </View>

            {pendingCount > 0 && (
              <TouchableOpacity
                style={styles.syncBtn}
                onPress={syncNow}
                activeOpacity={0.8}
              >
                <Text style={styles.syncBtnText}>🔄 Sync</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : pendingCount > 0 ? (
          <View style={styles.row}>
            <Text style={styles.icon}>🟡</Text>
            <Text style={[styles.text, { flex: 1 }]}>
              {pendingCount} record(s) pending sync
            </Text>
            <TouchableOpacity
              style={styles.syncBtn}
              onPress={syncNow}
              activeOpacity={0.8}
            >
              <Text style={styles.syncBtnText}>🔄 Sync Now</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 12 : 45,
    left: 16,
    right: 16,
    zIndex: 99999,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: 480,
    width: '100%',
    borderWidth: 1,
    borderColor: '#475569',
  },
  badgeOffline: {
    backgroundColor: '#1e293b',
    borderColor: '#f97316',
    borderWidth: 1.5,
  },
  badgeSyncing: {
    backgroundColor: '#0369a1',
    borderColor: '#38bdf8',
  },
  badgeSuccess: {
    backgroundColor: '#065f46',
    borderColor: '#34d399',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  icon: {
    fontSize: 14,
  },
  title: {
    color: '#f97316',
    fontSize: 12,
    fontWeight: 'bold',
  },
  subtext: {
    color: '#cbd5e1',
    fontSize: 11,
  },
  text: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  syncBtn: {
    backgroundColor: '#f97316',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginLeft: 6,
  },
  syncBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default OfflineStatusBanner;
