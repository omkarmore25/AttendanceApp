import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';
import theme from '../theme';

const CONSENT_STORAGE_KEY = 'dpdp_cookie_consent_v1';

/**
 * ConsentBanner Component
 * Non-intrusive banner gating non-essential trackers/storage under DPDP Act 2023.
 */
const ConsentBanner = ({ onOpenPrivacy }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    checkConsent();
  }, []);

  const checkConsent = async () => {
    try {
      const stored = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
      if (!stored) {
        // Show banner after brief delay
        setTimeout(() => setVisible(true), 1200);
      }
    } catch {
      // Ignore storage read error
    }
  };

  const handleAccept = async (level) => {
    try {
      const record = {
        level, // 'essential' | 'all'
        timestamp: new Date().toISOString(),
      };
      await AsyncStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
      setVisible(false);

      // Async log to backend
      api.post('/compliance/consent', {
        purposes: {
          essential_account: true,
          analytics_performance: level === 'all',
        },
        source: 'WebBanner',
      }).catch(() => {});
    } catch {
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.bannerContainer}>
      <View style={styles.bannerContent}>
        <View style={styles.textContainer}>
          <Text style={styles.bannerTitle}>🛡️ Privacy & Cookie Notice (DPDP Act, 2023)</Text>
          <Text style={styles.bannerText}>
            We use essential storage to securely maintain your login session and event check-ins.
            No third-party advertising or cross-site tracking cookies are used.
          </Text>
        </View>

        <View style={styles.btnRow}>
          {onOpenPrivacy && (
            <TouchableOpacity style={styles.linkBtn} onPress={onOpenPrivacy}>
              <Text style={styles.linkText}>Notice</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.essentialBtn}
            onPress={() => handleAccept('essential')}
          >
            <Text style={styles.essentialText}>Essential Only</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => handleAccept('all')}
          >
            <Text style={styles.acceptText}>Accept All</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 20 : 70,
    left: 16,
    right: 16,
    zIndex: 999999,
    alignItems: 'center',
  },
  bannerContent: {
    backgroundColor: theme.colors.bgCard,
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    maxWidth: 580,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  textContainer: {
    marginBottom: theme.spacing.sm,
  },
  bannerTitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.heavy,
    color: theme.colors.primaryLight,
    marginBottom: 4,
  },
  bannerText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  linkBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  linkText: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  essentialBtn: {
    backgroundColor: theme.colors.bgElevated,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  essentialText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
  },
  acceptBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  acceptText: {
    color: '#fff',
    fontSize: theme.fontSize.xs,
    fontWeight: 'bold',
  },
});

export default ConsentBanner;
