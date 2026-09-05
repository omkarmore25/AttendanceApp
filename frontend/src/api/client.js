import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// â”€â”€â”€ API Base URL (Live Production Server) â”€â”€â”€
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://attendance-backend-h7if.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s timeout to gracefully absorb Render cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// â”€â”€â”€ Automatically attach JWT token to every request â”€â”€â”€
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

// â”€â”€â”€ Handle 401 & Automatic Retry for Render Cold Starts / Network Glitches â”€â”€â”€
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    if (response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      return Promise.reject(error);
    }

    // Auto retry up to 2 times for cold starts and intermittent network timeouts
    if (config && (!config._retryCount || config._retryCount < 2)) {
      const isNetworkOrTimeout = !response || error.code === 'ECONNABORTED' || (response.status >= 500 && response.status <= 504);
      if (isNetworkOrTimeout) {
        config._retryCount = (config._retryCount || 0) + 1;
        const delay = config._retryCount * 1200;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(config);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };