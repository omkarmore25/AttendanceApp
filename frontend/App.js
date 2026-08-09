import { registerRootComponent } from 'expo';
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import theme from './src/theme';

function App() {
  return (
    <SafeAreaProvider style={styles.root}>
      <View style={styles.root}>
        <AuthProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    ...(Platform.OS === 'web' ? { height: '100vh', width: '100vw', minHeight: '100vh' } : {}),
  },
});

registerRootComponent(App);
