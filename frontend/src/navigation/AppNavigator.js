import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, Platform } from 'react-native';
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
      name="ProfileTab"
      component={ProfileScreen}
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
      name="ProfileTab"
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} />,
      }}
    />
  </Tab.Navigator>
);

import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

// ─── Auth Stack ───
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="OTP" component={OTPScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
  </Stack.Navigator>
);

// ─── Main Navigator ───
const AppNavigator = () => {
  const { isLoggedIn, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingEmoji}>📍</Text>
        <Text style={styles.loadingText}>AttendanceApp</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
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
    backgroundColor: theme.colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
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
