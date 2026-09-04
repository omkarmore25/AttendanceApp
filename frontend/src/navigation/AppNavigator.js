import React, { useEffect, useRef } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OTPScreen from '../screens/OTPScreen';
import HomeScreen from '../screens/HomeScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import AdminDashboard from '../screens/AdminDashboard';
import CreateEventScreen from '../screens/CreateEventScreen';
import ManageEventsScreen from '../screens/ManageEventsScreen';
import EventAttendanceScreen from '../screens/EventAttendanceScreen';
import ManualAttendanceScreen from '../screens/ManualAttendanceScreen';
import ManageGroupsScreen from '../screens/ManageGroupsScreen';
import ManageUsersScreen from '../screens/ManageUsersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import JapmalaScreen from '../screens/JapmalaScreen';
import JapmalaReportScreen from '../screens/JapmalaReportScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsScreen from '../screens/TermsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerStyle: {
    backgroundColor: theme.colors.bg,
  },
  headerTintColor: theme.colors.textPrimary,
  headerTitleStyle: {
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.lg,
  },
  headerShadowVisible: false,
  contentStyle: {
    backgroundColor: theme.colors.bg,
  },
};

// ─── Tab Icon Component ───
const TabIcon = ({ emoji, label, focused }) => (
  <View style={styles.tabIcon}>
    <Text style={{ fontSize: focused ? 20 : 18 }}>{emoji}</Text>
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

// ─── User Home Stack ───
const UserHomeStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event Details' }} />
    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: '🛡️ Privacy Policy' }} />
    <Stack.Screen name="Terms" component={TermsScreen} options={{ title: '📜 Terms of Service' }} />
  </Stack.Navigator>
);

// ─── Admin Home Stack ───
const AdminHomeStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="AdminMain" component={AdminDashboard} options={{ headerShown: false }} />
    <Stack.Screen name="ManageUsers" component={ManageUsersScreen} options={{ title: 'Manage Users' }} />
    <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'Create Event' }} />
    <Stack.Screen name="ManageEvents" component={ManageEventsScreen} options={{ title: 'Manage Events' }} />
    <Stack.Screen name="EventAttendance" component={EventAttendanceScreen} options={{ title: 'Attendance' }} />
    <Stack.Screen name="ManualAttendance" component={ManualAttendanceScreen} options={{ title: 'Offline Attendance' }} />
    <Stack.Screen name="ManageGroups" component={ManageGroupsScreen} options={{ title: 'Groups' }} />
    <Stack.Screen name="JapmalaReport" component={JapmalaReportScreen} options={{ title: '📿 Japmala Report' }} />
    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: '🛡️ Privacy Policy' }} />
    <Stack.Screen name="Terms" component={TermsScreen} options={{ title: '📜 Terms of Service' }} />
  </Stack.Navigator>
);

// ─── Profile Stack ───
const ProfileStack = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: '🛡️ Privacy Policy' }} />
    <Stack.Screen name="Terms" component={TermsScreen} options={{ title: '📜 Terms of Service' }} />
  </Stack.Navigator>
);

// ─── Admin Tab Navigator ───
const AdminTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: theme.colors.bgCard,
        borderTopColor: theme.colors.border,
        borderTopWidth: 1,
        height: Platform.OS === 'web' ? 70 : 65,
        paddingBottom: Platform.OS === 'web' ? 12 : 8,
        paddingTop: 4,
        position: Platform.OS === 'web' ? 'fixed' : 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
      },
      tabBarShowLabel: false,
    }}
  >
    <Tab.Screen
      name="AdminHomeTab"
      component={AdminHomeStack}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon emoji="🛡️" label="Dashboard" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="EventsTab"
      component={UserHomeStack}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon emoji="📅" label="Events" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="JapmalaTab"
      component={JapmalaScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon emoji="📿" label="Japmala" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="ProfileTab"
      component={ProfileStack}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} />,
      }}
    />
  </Tab.Navigator>
);

// ─── User Tab Navigator ───
const UserTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: theme.colors.bgCard,
        borderTopColor: theme.colors.border,
        borderTopWidth: 1,
        height: Platform.OS === 'web' ? 70 : 65,
        paddingBottom: Platform.OS === 'web' ? 12 : 8,
        paddingTop: 4,
        position: Platform.OS === 'web' ? 'fixed' : 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
      },
      tabBarShowLabel: false,
    }}
  >
    <Tab.Screen
      name="HomeTab"
      component={UserHomeStack}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="JapmalaTab"
      component={JapmalaScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon emoji="📿" label="Japmala" focused={focused} />,
      }}
    />
    <Tab.Screen
      name="ProfileTab"
      component={ProfileStack}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} />,
      }}
    />
  </Tab.Navigator>
);

// ─── Auth Stack ───
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="OTP" component={OTPScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: true, title: '🛡️ Privacy Policy' }} />
    <Stack.Screen name="Terms" component={TermsScreen} options={{ headerShown: true, title: '📜 Terms of Service' }} />
  </Stack.Navigator>
);

// ─── Main Navigator ───
const AppNavigator = () => {
  const { isLoggedIn, isAdmin, loading } = useAuth();
  const navigationRef = useNavigationContainerRef();
  const isNavigatingBackRef = useRef(false);

  // Sync React Navigation with Mobile Web Browser Back Button (popstate)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handlePopState = () => {
      if (isNavigatingBackRef.current) {
        isNavigatingBackRef.current = false;
        return;
      }
      if (navigationRef.isReady() && navigationRef.canGoBack()) {
        isNavigatingBackRef.current = true;
        navigationRef.goBack();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleStateChange = () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (navigationRef.isReady()) {
      if (!isNavigatingBackRef.current && navigationRef.canGoBack()) {
        window.history.pushState({ appNav: true }, '');
      }
      isNavigatingBackRef.current = false;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        {/* Glowing Spiritual Icon Circle */}
        <View style={styles.splashIconCircle}>
          <Text style={styles.splashIconEmoji}>📿</Text>
        </View>

        {/* Brand App Name */}
        <Text style={styles.splashTitle}>Sant Samagam</Text>
        <Text style={styles.splashSubtitle}>संत समागम</Text>

        {/* Tagline */}
        <Text style={styles.splashTagline}>सत्संग, सेवा व जपानुष्ठान</Text>

        {/* Pulsing Saffron Spinner */}
        <ActivityIndicator size="small" color="#f97316" style={styles.splashSpinner} />

        <Text style={styles.splashGreeting}>जय सच्चिदानंद 🙏</Text>
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} onStateChange={handleStateChange}>
      {!isLoggedIn ? (
        <AuthStack />
      ) : isAdmin ? (
        <AdminTabs />
      ) : (
        <UserTabs />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0d1322',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  splashIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(249, 115, 22, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  splashIconEmoji: {
    fontSize: 46,
  },
  splashTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  splashSubtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f97316',
    marginBottom: 8,
  },
  splashTagline: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 24,
  },
  splashSpinner: {
    marginVertical: 8,
  },
  splashGreeting: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 16,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  tabLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
  tabLabelActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});

export default AppNavigator;
