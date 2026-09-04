import { registerRootComponent } from 'expo';
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { OfflineProvider } from './src/context/OfflineContext';
import OfflineStatusBanner from './src/components/OfflineStatusBanner';
import AppNavigator from './src/navigation/AppNavigator';
import theme from './src/theme';

// Ensure dark background on web root to prevent white flash
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.style.backgroundColor = '#0d1322';
  document.body.style.backgroundColor = '#0d1322';
}

// Forward Google OAuth tokens back to native Android App if opened via mobile browser
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const hash = window.location.hash || window.location.search || '';
  if (hash.includes('access_token=')) {
    const params = new URLSearchParams(hash.replace('#', '?'));
    const token = params.get('access_token');
    if (token) {
      setTimeout(() => {
        window.location.href = `attendanceapp://login#access_token=${token}`;
      }, 300);
    }
  }
}

function App() {
  return (
    <SafeAreaProvider style={styles.root}>
      <View style={styles.root}>
        <AuthProvider>
          <OfflineProvider>
            <StatusBar style="light" />
            <OfflineStatusBanner />
            <AppNavigator />
          </OfflineProvider>
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0d1322',
    ...(Platform.OS === 'web' ? { minHeight: '100%', width: '100%', height: '100%', backgroundColor: '#0d1322' } : {}),
  },
});

registerRootComponent(App);
