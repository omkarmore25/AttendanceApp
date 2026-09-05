import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── API Base URL (Live Production Server) ───
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://attendance-backend-h7if.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000, // 25s timeout to handle Render cold starts gracefully
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Automatically attach JWT token to every request ───
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error reading token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Handle 401 responses (expired token) ───
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
