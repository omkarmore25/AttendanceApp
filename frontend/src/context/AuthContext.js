import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load saved session on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    let hasLocalAuth = false;
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        hasLocalAuth = true;
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      // Instantly open the app without waiting for internet/Render cold start
      setLoading(false);
    }

    // Verify token with backend silently in background (non-blocking)
    if (hasLocalAuth) {
      try {
        const res = await api.get('/auth/me');
        if (res.data?.user) {
          setUser(res.data.user);
          await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
        }
      } catch (verifyErr) {
        // Only reset if explicitly rejected (401/403)
        if (verifyErr.response?.status === 401 || verifyErr.response?.status === 403) {
          console.warn('Stored session expired or invalid, resetting auth...');
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          setToken(null);
          setUser(null);
        } else {
          console.log('Backend unreachable or slow, keeping local session active.');
        }
      }
    }
  };

  // Send OTP for Registration
  const sendOTP = async (username, email, phone, password) => {
    try {
      const response = await api.post('/auth/send-otp', {
        username,
        email,
        phone,
        password,
      });

      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send verification code',
      };
    }
  };

  // Verify OTP & Complete Registration
  const verifyOTP = async (email, otp, username, phone, password) => {
    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otp,
        username,
        phone,
        password,
      });

      const { token: newToken, user: newUser } = response.data;

      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Verification failed',
      };
    }
  };

  // Direct Google Sign-In
  const googleLogin = async (googleData) => {
    try {
      const response = await api.post('/auth/google', googleData);

      const { token: newToken, user: newUser } = response.data;

      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Google Sign-In failed',
      };
    }
  };

  // Direct Register
  const register = async (username, email, phone, password) => {
    try {
      const response = await api.post('/auth/register', {
        username,
        email,
        phone,
        password,
      });

      const { token: newToken, user: newUser } = response.data;

      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { token: newToken, user: newUser } = response.data;

      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  // Logout
  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Update cached user profile
  const updateUserProfile = async (updatedUser) => {
    setUser(updatedUser);
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const isAdmin = user?.role === 'Admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin,
        isLoggedIn: !!token,
        sendOTP,
        verifyOTP,
        googleLogin,
        register,
        login,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
